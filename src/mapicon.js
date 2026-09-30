/* =======================================================================
   MAPICON — 맵 선택 UI (mascot.js 뒤에 붙는다)

   1) 선택 버튼의 이모지(🗾🇰🇷🏘️🌍)를 실제 지도 모양으로 바꾼다.
      페이지에 이미 들어 있는 경계 데이터(DATASETS[*].data[*].d)를 다시 그리므로
      파일이 커지지 않는다. 경계선은 vector-effect="non-scaling-stroke" 로 긋는다 —
      뷰박스 단위로 굵기를 주면 세계지도(1010 단위를 28px로)에서는 선이 사라지고
      일본 지도에서는 덩어리가 된다. 이걸 쓰면 축소율과 무관하게 화면 픽셀로 그려져서
      시·도(16조각)는 굵은 몇 줄, 시·군(167조각)은 촘촘한 결로 구분된다.

   2) 고른 지도에 맞는 고양이 그림을 시작 화면에 띄운다 (일본·한국·세계 각각).
      고른 것만 내려받으므로 첫 화면 용량에 얹히지 않는다.
   ======================================================================= */
(function(){
const NS="http://www.w3.org/2000/svg";
const seg=document.getElementById("dset");
if(!seg||typeof DATASETS==="undefined") return;

/* ---------- 1. 버튼의 지도 모양 ---------- */
function silhouette(ds){
  const d=DATASETS[ds];
  if(!d||!d.data||!d.vb) return null;
  const codes=Object.keys(d.data);
  let dd="";
  for(const c of codes){ const p=d.data[c].d; if(p) dd+=p+" "; }
  if(!dd) return null;
  const svg=document.createElementNS(NS,"svg");
  svg.setAttribute("viewBox",d.vb.join(" "));
  svg.setAttribute("preserveAspectRatio","xMidYMid meet");
  svg.setAttribute("aria-hidden","true");
  svg.setAttribute("class","dsmap");
  const path=document.createElementNS(NS,"path");
  path.setAttribute("d",dd);
  path.setAttribute("vector-effect","non-scaling-stroke");
  path.setAttribute("stroke-width",codes.length>100?"0.35":"0.7");
  svg.appendChild(path);
  return svg;
}
function drawButtons(){
  [...seg.children].forEach(b=>{
    const ds=b.dataset.ds;
    if(!ds||!DATASETS[ds]||b.querySelector(".dsmap")) return;
    const svg=silhouette(ds);
    if(!svg) return;
    b.textContent=DATASETS[ds].label||"";        // 이모지를 떼고 이름만 남긴다
    b.insertBefore(svg,b.firstChild);
    if(!b.title) b.title=DATASETS[ds].brand||"";
  });
}
/* 세계지도는 조각이 256개라 처음 그릴 때 잠깐 걸린다 — 한가할 때 만든다 */
if(window.requestIdleCallback) requestIdleCallback(()=>drawButtons(),{timeout:2000});
else setTimeout(drawButtons,400);

/* ---------- 2. 시작 화면의 지도별 고양이 그림 ---------- */
const ART={jp:"map_jp", jp_sp:"map_jp",
           kr:"map_kr", kr_sgg:"map_kr", kr_sp:"map_kr", kr_sgg_sp:"map_kr",
           world:"map_world"};
const SPR=(typeof MAS!=="undefined"&&MAS.SPR)||{};
const ss=document.getElementById("startscreen");
let art=null;
if(ss){
  art=document.createElement("img");
  art.id="mapart"; art.className="mapart"; art.alt=""; art.setAttribute("aria-hidden","true");
  art.draggable=false;
  ss.insertBefore(art,ss.firstChild);
}
function showArt(ds){
  if(!art) return;
  const url=SPR[ART[ds]];
  if(!url){ art.classList.remove("on"); return; }
  if(art.getAttribute("src")===url){ art.classList.add("on"); return; }
  art.classList.remove("on");
  art.onload=()=>art.classList.add("on");
  art.src=url;
}
showArt(typeof CURRENT!=="undefined"?CURRENT:null);

/* 시작 화면은 지도 칸 위에 얹혀 있어서, 칸이 낮으면 그림이 START를 밀어낸다.
   CSS로는 부모 높이를 못 재니 여기서 재서 줄이거나 감춘다. */
const wrap=document.querySelector(".mapwrap");
function fit(){
  if(!art||!wrap) return;
  const h=wrap.getBoundingClientRect().height;
  art.classList.toggle("tiny",h<440);
  art.classList.toggle("gone",h<340);
}
if(wrap){
  if(window.ResizeObserver) new ResizeObserver(fit).observe(wrap);
  window.addEventListener("resize",fit);
  fit();
}

/* 지도를 바꾸면 그림도 바꾼다 */
if(typeof loadDataset==="function"){
  const _load=loadDataset;
  loadDataset=function(key){ _load(key); showArt(key); fit(); };
}
})();
