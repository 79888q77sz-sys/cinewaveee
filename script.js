const $ = (id) => document.getElementById(id);
const titles = [
 {id:1,title:"Neon City",year:2025,genre:"Action · Sci-Fi",free:true,image:"https://images.unsplash.com/photo-1519608487953-e999c86e7455?auto=format&fit=crop&w=700&q=85",desc:"A city that never sleeps hides a secret beneath its electric skyline."},
 {id:2,title:"Wild Frontier",year:2024,genre:"Adventure · Drama",free:true,image:"https://images.unsplash.com/photo-1472396961693-142e6e269027?auto=format&fit=crop&w=700&q=85",desc:"A journey across a breathtaking wilderness tests the limits of courage."},
 {id:3,title:"The Deep",year:2026,genre:"Thriller · Mystery",free:false,image:"https://images.unsplash.com/photo-1518837695005-2083093ee35b?auto=format&fit=crop&w=700&q=85",desc:"A research team discovers something impossible beneath the ocean."},
 {id:4,title:"Golden Hour",year:2025,genre:"Romance · Drama",free:true,image:"https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?auto=format&fit=crop&w=700&q=85",desc:"Two strangers meet in a small coastal town and change each other's lives."},
 {id:5,title:"Shadow Protocol",year:2026,genre:"Action · Thriller",free:false,image:"https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=700&q=85",desc:"An intelligence officer has one night to prevent a global catastrophe."},
 {id:6,title:"Blue Planet",year:2024,genre:"Documentary",free:true,image:"https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=700&q=85",desc:"Explore the extraordinary beauty and fragility of our blue planet."},
 {id:7,title:"Last Kingdom",year:2026,genre:"Fantasy · Adventure",free:false,image:"https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=700&q=85",desc:"An exiled heir returns to reclaim a kingdom lost to darkness."},
 {id:8,title:"Midnight Run",year:2025,genre:"Crime · Action",free:true,image:"https://images.unsplash.com/photo-1519608487953-e999c86e7455?auto=format&fit=crop&w=700&q=85",desc:"One driver, one city, and a race against the clock."},
 {id:9,title:"Beyond Mars",year:2026,genre:"Sci-Fi · Drama",free:false,image:"https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=700&q=85",desc:"The first colony on Mars faces its greatest challenge."},
 {id:10,title:"The Grand Hotel",year:2024,genre:"Mystery · Drama",free:true,image:"https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=700&q=85",desc:"Every guest has a story. One of them has a secret."}
];
let user = null, isRegister = false, activeTitle = null, myList = new Set(), demoVipAccess = false;

function toast(message){$("toast").textContent=message;$("toast").classList.add("show");setTimeout(()=>$("toast").classList.remove("show"),2400)}
function showAuth(){ $("authScreen").classList.remove("hidden");$("app").classList.add("hidden"); }
function showApp(){ $("authScreen").classList.add("hidden");$("app").classList.remove("hidden"); updateProfile(); renderRows(); }
function updateProfile(){const name=user?.name||"Guest";$("navName").textContent=name;$("avatar").textContent=name[0].toUpperCase();$("menuName").textContent=name;$("menuAvatar").textContent=name[0].toUpperCase();$("menuPlan").textContent=(user?.vip||demoVipAccess)?"VIP demo access":"Free plan";}
function posterCard(item){return `<article class="poster" data-id="${item.id}"><img src="${item.image}" alt="${item.title}" loading="lazy"><span class="poster-badge ${item.free?'':'vip'}">${item.free?'FREE':'✦ VIP'}</span><div class="poster-info"><strong>${item.title}</strong><small>${item.year} · ${item.genre}</small></div></article>`}
function fillRow(id,list){$(id).innerHTML=list.map(posterCard).join("");$(id).querySelectorAll(".poster").forEach(card=>card.addEventListener("click",()=>openTitle(Number(card.dataset.id))))}
function renderRows(filter=""){const q=filter.toLowerCase();const list=titles.filter(t=>t.title.toLowerCase().includes(q)||t.genre.toLowerCase().includes(q));fillRow("trendingRow",list.slice(0,5));fillRow("freeRow",list.filter(t=>t.free));fillRow("vipRow",list.filter(t=>!t.free));}
function openTitle(id){const item=titles.find(t=>t.id===id);if(!item)return;activeTitle=item;$("modalTitle").textContent=item.title;$("modalMeta").textContent=`${item.year} · ${item.genre} · ${item.free?"Free":"VIP exclusive"}`;$("modalDescription").textContent=item.desc;$("modalTag").textContent=item.free?"AVAILABLE FREE":"✦ VIP PREMIERE";$("modalArt").style.backgroundImage=`linear-gradient(0deg,#181818,transparent),url("${item.image}")`;$("modalMessage").textContent="";$("vipVideo").classList.add("hidden");$("vipVideo").pause();$("modalSave").textContent=myList.has(id)?"✓ In my list":"＋ My list";$("modal").classList.remove("hidden");}
function closeModal(){$("modal").classList.add("hidden");$("vipVideo").pause()}
function requireVip(){if(!(user?.vip||demoVipAccess)){toast("You're not a VIP member.");return false}return true}
$("authForm").addEventListener("submit",async e=>{
 e.preventDefault(); $("authError").textContent="";
 const email=$("emailInput").value.trim(), password=$("passwordInput").value;
 const payload={email,password,name:$("nameInput").value.trim()};
 const button=$("authSubmit"); button.disabled=true; button.textContent=isRegister?"Creating account...":"Signing in...";
 try {
   const response=await fetch(`/api/${isRegister?"register":"login"}`,{
     method:"POST", credentials:"same-origin",
     headers:{"Content-Type":"application/json","Accept":"application/json"},
     body:JSON.stringify(payload)
   });
   const data=await response.json().catch(()=>({error:"The server returned an invalid response. Check that the Replit Node.js server is running."}));
   if(!response.ok) throw new Error(data.error||`Request failed (${response.status}).`);
   user=data.user; showApp();
 } catch(err) {
   $("authError").textContent = err.message || "Could not connect to the server. Please refresh and try again.";
 } finally {
   button.disabled=false; button.textContent=isRegister?"Create account":"Sign in";
 }
});
$("switchAuth").addEventListener("click",()=>{isRegister=!isRegister;$("authTitle").textContent=isRegister?"Create account":"Sign in";$("nameField").classList.toggle("hidden",!isRegister);$("nameInput").required=isRegister;$("authSubmit").textContent=isRegister?"Create account":"Sign in";$("switchText").textContent=isRegister?"Already a member?":"New to CineWave?";$("switchAuth").textContent=isRegister?"Sign in":"Create an account";$("passwordInput").autocomplete=isRegister?"new-password":"current-password";$("authError").textContent="";});
$("profileButton").addEventListener("click",()=>$("profileMenu").classList.toggle("hidden"));
document.addEventListener("click",e=>{if(!$("profileMenu").contains(e.target)&&!$("profileButton").contains(e.target))$("profileMenu").classList.add("hidden")});
$("logoutButton").addEventListener("click",async()=>{try{await fetch("/api/logout",{method:"POST",credentials:"same-origin"});}catch{}user=null;demoVipAccess=false;showAuth();$("profileMenu").classList.add("hidden");$("authForm").reset();toast("You have signed out.")});
$("editProfile").addEventListener("click",()=>{const name=prompt("Profile name:",user?.name||"");if(name?.trim()){user.name=name.trim().slice(0,50);updateProfile();toast("Profile updated.")}});
$("menuVip").addEventListener("click",()=>{ $("profileMenu").classList.add("hidden");$("upgradeButton").click()});
$("searchInput").addEventListener("input",e=>renderRows(e.target.value));
$("closeModal").addEventListener("click",closeModal);$("modalBackdrop").addEventListener("click",closeModal);
$("modalPlay").addEventListener("click",()=>{if(!activeTitle)return;if(!activeTitle.free&&!requireVip())return;$("modalMessage").textContent=activeTitle.free?"Playing sample video.":"VIP training demo video.";if(!activeTitle.free){$("vipVideo").classList.remove("hidden");$("vipVideo").play().catch(()=>{});}});
$("modalSave").addEventListener("click",()=>{if(!activeTitle)return;myList.has(activeTitle.id)?myList.delete(activeTitle.id):myList.add(activeTitle.id);$("modalSave").textContent=myList.has(activeTitle.id)?"✓ In my list":"＋ My list";toast(myList.has(activeTitle.id)?"Added to My List":"Removed from My List")});
$("heroPlay").addEventListener("click",()=>openTitle(1));$("heroInfo").addEventListener("click",()=>openTitle(1));
$("upgradeButton").addEventListener("click",async()=>{
 if(user?.vip||demoVipAccess){toast("Your account already has VIP access.");$("vip").scrollIntoView({behavior:"smooth"});return;}
 if(!user){toast("Please sign in first.");return;}
 try {
   const response=await fetch("/api/lab/vip-check",{
     method:"POST",credentials:"same-origin",
     headers:{"Content-Type":"application/json","Accept":"application/json"},
     body:JSON.stringify({is_vip:false})
   });
   const data=await response.json().catch(()=>({message:"The server returned an invalid response."}));
   if(response.status===403||data.is_vip===false){toast(data.message||"You're not a VIP member.");return;}
   if(!response.ok)throw new Error(data.error||"VIP lab request failed.");
   if(data.is_vip===true){
     demoVipAccess=true;updateProfile();
     toast("Successfully you become a VIP member! (training demo)");
     $("vip").scrollIntoView({behavior:"smooth"});
   }
 } catch(err){toast(err.message||"Could not connect to VIP training endpoint.");}
});
async function restoreSession(){
 try {
   const response=await fetch("/api/me",{credentials:"same-origin",headers:{"Accept":"application/json"}});
   if(response.ok){const data=await response.json();user=data.user;showApp();return;}
 } catch(err) { console.warn("Session restore unavailable:",err); }
 showAuth();
}
restoreSession();
