const API_URL="https://importantly-marriage-meant-events.trycloudflare.com";
const $=id=>document.getElementById(id);
let movies=[];

document.addEventListener("DOMContentLoaded",()=>{
  $("movieForm").addEventListener("submit",saveMovie);
  $("movieForm").addEventListener("reset",()=>setTimeout(clearMessage,0));
  $("refreshButton").addEventListener("click",loadMovies);
  loadMovies();
});

function api(path=""){return API_URL.replace(/\/+$/,"")+(path.startsWith("/")?path:"/"+path)}

async function loadMovies(){
  if(API_URL.includes("YOUR-API-URL")){message("សូមកំណត់ API_URL ក្នុង admin.js ជាមុន។",true);return}
  try{
    const r=await fetch(api("/movies"),{cache:"no-store"});
    if(!r.ok)throw new Error("API error");
    const data=await r.json();
    movies=Array.isArray(data)?data:(Array.isArray(data.movies)?data.movies:[]);
    $("movieCount").textContent=movies.length;
    $("khmerCount").textContent=movies.filter(m=>m.khmer_audio).length;
    $("licensedCount").textContent=movies.filter(m=>["owned","licensed","public-domain","creative-commons"].includes(m.license)).length;
    renderMovies();
  }catch(e){
    console.error(e);
    $("movieList").innerHTML='<p class="muted">❌ មិនអាចភ្ជាប់ទៅ Server បានទេ។</p>';
  }
}

function renderMovies(){
  const list=$("movieList");
  list.innerHTML="";
  if(!movies.length){list.innerHTML='<p class="muted">🎬 មិនទាន់មានភាពយន្តទេ</p>';return}
  movies.slice().reverse().forEach(m=>{
    const row=document.createElement("div");
    row.className="movie-row";
    const info=document.createElement("div");
    const title=document.createElement("strong");
    title.textContent=m.title_kh||m.title||"Unknown Movie";
    const meta=document.createElement("small");
    meta.textContent=[m.year,m.quality,Array.isArray(m.genre)?m.genre.join(", "):"",m.license].filter(Boolean).join(" • ");
    info.append(title,meta);
    const btn=document.createElement("button");
    btn.type="button";btn.className="secondary";btn.textContent="✏️ Edit";
    btn.onclick=()=>fillForm(m);
    row.append(info,btn);list.appendChild(row);
  });
}

function fillForm(m){
  const map={movieId:"id",title:"title",titleKh:"title_kh",year:"year",country:"country",duration:"duration",quality:"quality",rating:"rating",language:"language",subtitle:"subtitle",genre:"genre",license:"license",poster:"poster",backdrop:"backdrop",videoFileId:"video_file_id",khmerAudio:"khmer_audio",khmerSubtitle:"khmer_subtitle",source:"source",description:"description",descriptionKh:"description_kh"};
  Object.entries(map).forEach(([id,key])=>{
    const el=$(id);if(!el)return;
    const v=m[key];
    el.value=Array.isArray(v)?v.join(", "):(v??"");
  });
  window.scrollTo({top:0,behavior:"smooth"});
  message("ព័ត៌មាន Movie ត្រូវបានដាក់ចូល Form សម្រាប់កែ/រក្សាទុកជាថ្មី។",false);
}

async function saveMovie(e){
  e.preventDefault();

  let adminKey=sessionStorage.getItem("MOVIEFLIX_ADMIN_KEY");
  if(!adminKey){
    adminKey=prompt("🔐 សូមបញ្ចូល Admin Key:");
    if(!adminKey){message("បានបោះបង់។",true);return}
    sessionStorage.setItem("MOVIEFLIX_ADMIN_KEY",adminKey);
  }

  const movie={
    id:$("movieId").value.trim(),
    title:$("title").value.trim(),
    title_kh:$("titleKh").value.trim(),
    description:$("description").value.trim(),
    description_kh:$("descriptionKh").value.trim(),
    poster:$("poster").value.trim(),
    backdrop:$("backdrop").value.trim(),
    genre:$("genre").value.split(",").map(x=>x.trim()).filter(Boolean),
    country:$("country").value.trim(),
    year:$("year").value.trim(),
    duration:$("duration").value.trim(),
    quality:$("quality").value.trim()||"1080P",
    language:$("language").value.trim(),
    subtitle:$("subtitle").value.trim(),
    rating:Number($("rating").value)||0,
    video_file_id:$("videoFileId").value.trim(),
    khmer_audio:$("khmerAudio").value.trim(),
    khmer_subtitle:$("khmerSubtitle").value.trim(),
    license:$("license").value,
    source:$("source").value.trim()
  };

  if(!movie.title){message("សូមបញ្ចូល Title ជាមុន។",true);return}

  const button=$("saveButton");
  button.disabled=true;button.textContent="⏳ Saving...";

  try{
    const r=await fetch(api("/movies"),{
      method:"POST",
      headers:{"Content-Type":"application/json","x-admin-key":adminKey},
      body:JSON.stringify(movie)
    });
    const result=await r.json().catch(()=>({}));

    if(r.status===401){
      sessionStorage.removeItem("MOVIEFLIX_ADMIN_KEY");
      message("🔐 Admin Key មិនត្រឹមត្រូវ។ សូមចុច Save ម្តងទៀត។",true);
      return;
    }
    if(!r.ok)throw new Error(result.message||"Save failed");

    message("✅ Movie បានរក្សាទុកជោគជ័យ!",false);
    $("movieForm").reset();
    await loadMovies();
  }catch(e){
    console.error(e);
    message("❌ មិនអាចរក្សាទុក Movie បានទេ។ ពិនិត្យ Server/Cloudflare URL។",true);
  }finally{
    button.disabled=false;button.textContent="💾 Save Movie";
  }
}

function message(text,error=false){
  const box=$("adminMessage");
  box.textContent=text;
  box.className=error?"message error":"message";
  box.hidden=false;
}
function clearMessage(){ $("adminMessage").hidden=true; }
