/* MovieFlixKH Admin */
const API_URL="https://YOUR-API-URL";
const $=id=>document.getElementById(id);
let movies=[];

document.addEventListener("DOMContentLoaded",()=>{
  $("refreshButton").addEventListener("click",loadMovies);
  $("movieForm").addEventListener("submit",saveMovie);
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
  }catch(e){console.error(e);message("មិនអាចភ្ជាប់ទៅ API បានទេ។",true)}
}

function renderMovies(){
  const list=$("movieList");list.innerHTML="";
  if(!movies.length){list.innerHTML="<p>🎬 មិនទាន់មានភាពយន្តទេ</p>";return}
  movies.forEach(m=>{
    const row=document.createElement("div");row.className="movie-row";
    const info=document.createElement("div");
    const title=document.createElement("strong");title.textContent=m.title_kh||m.title||"Unknown Movie";
    const meta=document.createElement("small");meta.textContent=[m.year,m.quality,m.license].filter(Boolean).join(" • ");
    info.append(title,meta);
    const btn=document.createElement("button");btn.className="secondary";btn.type="button";btn.textContent="✏️ Edit";btn.onclick=()=>fillForm(m);
    row.append(info,btn);list.appendChild(row);
  });
}

function fillForm(m){
  const map={movieId:"id",title:"title",titleKh:"title_kh",year:"year",country:"country",duration:"duration",quality:"quality",language:"language",subtitle:"subtitle",genre:"genre",rating:"rating",description:"description",descriptionKh:"description_kh",videoFileId:"video_file_id",khmerAudio:"khmer_audio",khmerSubtitle:"khmer_subtitle",poster:"poster",backdrop:"backdrop",license:"license",source:"source"};
  Object.entries(map).forEach(([id,key])=>{const el=$(id);if(el){const v=m[key];el.value=Array.isArray(v)?v.join(", "):(v??"")}});
  scrollTo({top:0,behavior:"smooth"});
}

function saveMovie(e){
  e.preventDefault();
  message("Admin Form រួចរាល់។ ជំហានបន្ទាប់យើងត្រូវបន្ថែម POST/PUT endpoint នៅ Backend ដើម្បី Save Movie ពី Admin។",false);
}

function message(text,error=false){
  const box=$("adminMessage");box.textContent=text;box.className=error?"message error":"message";box.hidden=false;
  setTimeout(()=>box.hidden=true,5000);
}
