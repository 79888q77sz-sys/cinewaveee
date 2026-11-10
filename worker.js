const COOKIE = "cinewave_session";
const DAY = 7 * 24 * 60 * 60;

function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json; charset=utf-8", ...headers } });
}
function cookieValue(request, name) {
  const raw = request.headers.get("Cookie") || "";
  for (const part of raw.split(";")) {
    const [key, ...rest] = part.trim().split("=");
    if (key === name) return rest.join("=");
  }
  return null;
}
function b64(bytes) { return btoa(String.fromCharCode(...new Uint8Array(bytes))).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/g,""); }
function unb64(s) { s=s.replace(/-/g,"+").replace(/_/g,"/"); while(s.length%4)s+="="; return Uint8Array.from(atob(s),c=>c.charCodeAt(0)); }
async function hmac(value, secret) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), {name:"HMAC",hash:"SHA-256"}, false, ["sign"]);
  return b64(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value)));
}
async function makeSession(email, env) {
  const payload = b64(new TextEncoder().encode(JSON.stringify({email, exp:Math.floor(Date.now()/1000)+DAY*7})));
  return `${payload}.${await hmac(payload, env.SESSION_SECRET)}`;
}
async function readSession(request, env) {
  const token = cookieValue(request, COOKIE);
  if (!token || !env.SESSION_SECRET) return null;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;
  const expected = await hmac(payload, env.SESSION_SECRET);
  if (signature !== expected) return null;
  try { const data=JSON.parse(new TextDecoder().decode(unb64(payload))); return data.exp > Math.floor(Date.now()/1000) ? data.email : null; } catch { return null; }
}
function sessionHeader(token) { return `${COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${DAY*7}`; }
function clearHeader() { return `${COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`; }
async function body(request) { try { return await request.json(); } catch { return {}; } }
async function hashPassword(password, saltBytes) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({name:"PBKDF2",salt:saltBytes,iterations:150000,hash:"SHA-256"},key,256);
  return b64(bits);
}
async function currentUser(request, env) {
  const email = await readSession(request, env);
  if (!email) return null;
  return await env.DB.prepare("SELECT id,name,email,vip FROM cinewave_users WHERE email=?").bind(email).first();
}
async function api(request, env, url) {
  if (!env.DB) return json({error:"Database is not configured. Follow the Cloudflare setup guide."},500);
  if (url.pathname === "/api/health" && request.method === "GET") return json({ok:true,app:"CineWave"});
  if (url.pathname === "/api/register" && request.method === "POST") {
    const data=await body(request), name=String(data.name||"").trim(), email=String(data.email||"").trim().toLowerCase(), password=String(data.password||"");
    if(name.length<1||name.length>50)return json({error:"Please enter a name between 1 and 50 characters."},400);
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||email.length>254)return json({error:"Please enter a valid email address."},400);
    if(password.length<8)return json({error:"Password must be at least 8 characters long."},400);
    const existing=await env.DB.prepare("SELECT id FROM cinewave_users WHERE email=?").bind(email).first();
    if(existing)return json({error:"An account with this email already exists. Please sign in."},409);
    const salt=crypto.getRandomValues(new Uint8Array(16)), saltText=b64(salt), passwordHash=await hashPassword(password,salt);
    const result=await env.DB.prepare("INSERT INTO cinewave_users (name,email,password_salt,password_hash,vip) VALUES (?,?,?,?,0)").bind(name,email,saltText,passwordHash).run();
    const token=await makeSession(email,env);
    return json({user:{id:result.meta.last_row_id,name,email,vip:false}},201,{"set-cookie":sessionHeader(token)});
  }
  if (url.pathname === "/api/login" && request.method === "POST") {
    const data=await body(request), email=String(data.email||"").trim().toLowerCase(), password=String(data.password||"");
    const user=await env.DB.prepare("SELECT id,name,email,password_salt,password_hash,vip FROM cinewave_users WHERE email=?").bind(email).first();
    if(!user || await hashPassword(password,unb64(user.password_salt))!==user.password_hash)return json({error:"Email or password is incorrect."},401);
    const token=await makeSession(email,env);
    return json({user:{id:user.id,name:user.name,email:user.email,vip:!!user.vip}},200,{"set-cookie":sessionHeader(token)});
  }
  if (url.pathname === "/api/me" && request.method === "GET") {
    const user=await currentUser(request,env); if(!user)return json({error:"Not signed in."},401);
    return json({user:{id:user.id,name:user.name,email:user.email,vip:!!user.vip}});
  }
  if (url.pathname === "/api/logout" && request.method === "POST") return json({ok:true},200,{"set-cookie":clearHeader()});
  if (url.pathname === "/api/lab/vip-check" && request.method === "POST") {
    if(env.ENABLE_VIP_BURP_LAB!=="true")return json({error:"VIP training lab is disabled."},404);
    const user=await currentUser(request,env); if(!user)return json({error:"Please sign in before using the VIP lab."},401);
    const data=await body(request);
    if(data.is_vip!==true)return json({is_vip:false,message:"You're not a VIP member."},403);
    return json({is_vip:true,message:"Successfully enabled VIP demo access. This is a temporary security-training simulation."});
  }
  return json({error:"Not found"},404);
}
export default {
  async fetch(request, env) {
    const url=new URL(request.url);
    if(url.pathname.startsWith("/api/")) return api(request,env,url);
    return env.ASSETS.fetch(request);
  }
};
