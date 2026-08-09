const API_URL="https://importantly-marriage-meant-events.trycloudflare.com";
let movies=[],filteredMovies=[],selectedMovie=null,category="all",query="";
const $=id=>document.getElementById(id);

document.addEventListener("DOMContentLoaded",()=>{ 
 $("currentYear").textContent=new Date().getFullYear(); bind(); loadMovies();
});

const api=p=>API_URL.replace(/\/+$/,"")+(p.startsWith("/")?p:"/"+p);

function bind(){
 $("menuToggle").onclick=()=>{const n=$("mainNavigation");n.classList.toggle("open");$("menuToggle").setAttribute("aria-expanded",n.classList.contains("open"));};
 $("retryButton").onclick=loadMovies;
 $("searchInput").oninput=e=>{query=e.target.value;$("clearSearchButton").hidden=!query;filter();};
 $("clearSearchButton").onclick=()=>{$("searchInput").value="";query="";$("clearSearchButton").hidden=true;filter();};
 $("viewAllButton").onclick=()=>{category="all";document.querySelectorAll(".category").forEach(b=>b.classList.toggle("active",b.dataset.category==="all"));filter();};
 $("categoryContainer").onclick=e=>{const b=e.target.closest(".category");if(!b)return;category=b.dataset.category;document.querySelectorAll(".category").forEach(x=>x.classList.toggle("active",x===b));filter();};
 $("genreGrid").onclick=e=>{const b=e.target.closest("[data-genre]");if(!b)return;category=b.dataset.genre.toLowerCase();document.querySelectorAll(".category").forEach(x=>x.classList.toggle("active",x.dataset.category===category));$("movies").scrollIntoView({behavior:"smooth"});filter();};
 $("heroWatchButton").onclick=()=>selectedMovie?openPlayer(selectedMovie):toast("មិនទាន់មានភាពយន្ត","⚠️");
 $("heroInfoButton").onclick=()=>selectedMovie?openInfo(selectedMovie):toast("មិនទាន់មានភាពយន្ត","⚠️");
 $("closePlayerButton").onclick=closePlayer;$("closeInfoButton").onclick=closeInfo;
 $("downloadButton").onclick=()=>selectedMovie&&(location.href=api("/download/"+encodeURIComponent(selectedMovie.id)));
 $("shareButton").onclick=share;
 document.onkeydown=e=>{if(e.key==="Escape"){closePlayer();closeInfo();}};
}

async function loadMovies(){
 $("loading").hidden=false;$("movieGrid").hidden=true;$("error").hidden=true;
 try{const r=await fetch(api("/movies"),{cache:"no-store"});if(!r.ok)throw 0;const d=await r.json();movies=Array.isArray(d)?d:(d.movies||[]);filteredMovies=[...movies];$("loading").hidden=true;$("movieGrid").hidden=false;
 if(!movies.length){empty("សូមបន្ថែមភាពយន្តតាម Admin Panel។");defaultHero();return}$("emptyState").hidden=true;render();featured(movies[0]);
 }catch(e){$("loading").hidden=true;$("movieGrid").hidden=true;$("error").hidden=false;defaultHero();}
}

function filter(){const q=query.toLowerCase().trim();filteredMovies=movies.filter(m=>{if(category!=="all"&&!Array.isArray(m.genre))return false;if(category!=="all"&&!m.genre.some(g=>String(g).toLowerCase()===category))return false;if(!q)return true;return [m.title,m.title_kh,m.description,m.description_kh,m.country,m.year,m.language,m.subtitle,...(m.genre||[])].filter(Boolean).join(" ").toLowerCase().includes(q)});render();filteredMovies.length?($("emptyState").hidden=true):empty("រកមិនឃើញភាពយន្តដែលអ្នកកំពុងស្វែងរកទេ");}
function render(){$("movieGrid").innerHTML="";filteredMovies.forEach(m=>$("movieGrid").appendChild(card(m)));}
function card(m){
 const a=document.createElement("article");a.className="movie";const p=document.createElement("div");p.className="poster";
 if(m.poster){const i=document.createElement("img");i.src=m.poster;i.alt=m.title||"Movie poster";i.loading="lazy";i.onerror=()=>{i.remove();p.innerHTML='<div class="placeholder">🎬</div>'};p.appendChild(i)}else p.innerHTML='<div class="placeholder">🎬</div>';
 if(m.quality)p.appendChild(badge(m.quality,"badge"));if(m.rating)p.appendChild(badge("⭐ "+m.rating,"badge rating"));
 const b=document.createElement("div");b.className="movieBody";b.innerHTML="<h3></h3><small></small><div></div><button class='watch'>▶️ Watch</button>";b.children[0].textContent=m.title_kh||m.title||"Unknown Movie";b.children[1].textContent=[m.year,m.duration].filter(Boolean).join(" • ");b.children[2].textContent=Array.isArray(m.genre)?m.genre.join(" • "):"";b.querySelector("button").onclick=e=>{e.stopPropagation();openPlayer(m)};a.append(p,b);a.onclick=()=>openPlayer(m);return a;
}
function badge(t,c){const x=document.createElement("span");x.className=c;x.textContent=t;return x}
function featured(m){selectedMovie=m;$("heroTitle").textContent=m.title_kh||m.title||"MovieFlixKH";$("heroMeta").textContent=[m.year,m.quality,m.rating?`⭐ ${m.rating}`:"",...(m.genre||[])].filter(Boolean).join(" • ");$("heroDescription").textContent=m.description_kh||m.description||"មើលភាពយន្តនេះនៅលើ MovieFlixKH។";$("heroBackdrop").src=m.backdrop||m.poster||""}
function defaultHero(){selectedMovie=null;$("heroTitle").textContent="MovieFlixKH";$("heroMeta").textContent="";$("heroDescription").textContent="ស្វាគមន៍មកកាន់ MovieFlixKH — មើលភាពយន្ត និងវីដេអូអនឡាញ។";$("heroBackdrop").removeAttribute("src")}
function openPlayer(m){if(!m?.id)return;selectedMovie=m;$("playerMovieTitle").textContent=m.title_kh||m.title||"Movie";$("videoPlayer").src=api("/stream/"+encodeURIComponent(m.id));$("videoPlayer").load();$("detailsTitle").textContent=m.title_kh||m.title||"Movie";$("detailsDescription").textContent=m.description_kh||m.description||"មិនមានការពិពណ៌នា";$("detailsGrid").innerHTML=[["ឆ្នាំ",m.year],["ប្រទេស",m.country],["Genre",Array.isArray(m.genre)?m.genre.join(", "):""],["រយៈពេល",m.duration],["Quality",m.quality],["Language",m.language],["Subtitle",m.subtitle],["Rating",m.rating?`⭐ ${m.rating}`:""]].filter(x=>x[1]).map(x=>`<div><small>${x[0]}</small><strong>${esc(x[1])}</strong></div>`).join("");$("playerModal").hidden=false;document.body.style.overflow="hidden"}
function closePlayer(){$("videoPlayer").pause();$("videoPlayer").removeAttribute("src");$("videoPlayer").load();$("playerModal").hidden=true;document.body.style.overflow=""}
function openInfo(m){selectedMovie=m;$("infoModalTitle").textContent=m.title_kh||m.title||"ព័ត៌មាន";$("infoModalBody").innerHTML=`<h2>${esc(m.title_kh||m.title||"Movie")}</h2><p>${esc(m.description_kh||m.description||"មិនមានព័ត៌មាន")}</p>`;$("infoModal").hidden=false;document.body.style.overflow="hidden"}
function closeInfo(){$("infoModal").hidden=true;if($("playerModal").hidden)document.body.style.overflow=""}
async function share(){if(!selectedMovie)return;const u=location.href.split("?")[0]+"?movie="+encodeURIComponent(selectedMovie.id);try{if(navigator.share)await navigator.share({title:selectedMovie.title||"MovieFlixKH",url:u});else{await navigator.clipboard.writeText(u);toast("បាន Copy Link","🔗")}}catch{}}
function empty(t){$("emptyMessage").textContent=t;$("emptyState").hidden=false}
function toast(t,i="✓"){$("toast").textContent=i+" "+t;$("toast").hidden=false;clearTimeout(window.__t);window.__t=setTimeout(()=>$("toast").hidden=true,3000)}
function esc(v){return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",""":"&quot;","'":"&#039;"}[c]))}
