/* =======================================================================
   MAPZOOM — 지도 손으로 확대·축소·이동 + 눌러서 문제 빼기

   - 휠/트랙패드, 손가락 두 개(핀치), 끌기(드래그)로 지도를 직접 본다.
   - 다음 문제로 넘어가면 원래대로 그 문제에 맞춰 다시 잡아 준다(기존 동작).
     직접 움직인 뒤에는 ⟲ 단추로 언제든 전체 지도로 돌아온다.
   - 끌지 않고 톡 눌렀을 때만 '문제에서 빼기'로 본다 (PICK.tapOut).
   ======================================================================= */
(function(){
const svgEl=(typeof svg!=="undefined")?svg:document.getElementById("map");
const wrap=document.querySelector(".mapwrap");
if(!svgEl||!wrap||typeof setVB!=="function") return;

const MIN=0.04, MAX=1.6;                 // 전체 지도 대비 최소/최대 배율
function full(){ return (typeof FULL_VB!=="undefined")?FULL_VB:[0,0,1000,1000]; }
function vb(){ return (typeof curVB!=="undefined")?curVB.slice():full().slice(); }

/* 화면 좌표 → 지도 좌표 */
function toMap(cx,cy){
  const r=svgEl.getBoundingClientRect(), v=vb();
  // preserveAspectRatio="xMidYMid meet" 라서 실제로 그려지는 영역을 따로 구해야 한다
  const s=Math.min(r.width/v[2], r.height/v[3]);
  const dw=v[2]*s, dh=v[3]*s;
  const ox=r.left+(r.width-dw)/2, oy=r.top+(r.height-dh)/2;
  return [v[0]+(cx-ox)/s, v[1]+(cy-oy)/s];
}
function clamp(v){
  const f=full();
  const minW=f[2]*MIN, maxW=f[2]*MAX;
  if(v[2]<minW){ const k=minW/v[2]; v[0]-=(minW-v[2])/2; v[2]=minW; v[3]*=k; v[1]-=(v[3]-v[3]/k)/2; }
  if(v[2]>maxW){ const k=maxW/v[2]; v[0]-=(maxW-v[2])/2; v[2]=maxW; v[3]*=k; v[1]-=(v[3]-v[3]/k)/2; }
  // 지도 밖으로 너무 멀리 나가지 않게 (가장자리로 절반까지만)
  const padX=v[2]*0.5, padY=v[3]*0.5;
  v[0]=Math.max(f[0]-padX, Math.min(f[0]+f[2]+padX-v[2], v[0]));
  v[1]=Math.max(f[1]-padY, Math.min(f[1]+f[3]+padY-v[3], v[1]));
  return v;
}
function manual(v){
  if(typeof vbAnim!=="undefined") vbAnim++;      // 돌고 있던 자동 확대를 끊는다
  setVB(clamp(v));
  wrap.classList.add("zoomed");
}
function zoomAt(cx,cy,k){
  const v=vb(), [mx,my]=toMap(cx,cy);
  const nw=v[2]*k, nh=v[3]*k;
  manual([mx-(mx-v[0])*k, my-(my-v[1])*k, nw, nh]);
}
function reset(){
  wrap.classList.remove("zoomed");
  const v=(!swapped&&typeof target!=="undefined"&&target&&_vbFor)?_vbFor(target):full().slice();
  if(typeof tweenVB==="function") tweenVB(v);
  else setVB(v);
}

/* ---------- 휠 / 트랙패드 ---------- */
svgEl.addEventListener("wheel",e=>{
  e.preventDefault();
  zoomAt(e.clientX,e.clientY, e.deltaY>0 ? 1.12 : 1/1.12);
},{passive:false});

/* ---------- 끌기 · 핀치 ---------- */
const pts=new Map();
let dragFrom=null, moved=0, pinch=0;
svgEl.addEventListener("pointerdown",e=>{
  pts.set(e.pointerId,{x:e.clientX,y:e.clientY});
  if(pts.size===1){ dragFrom={x:e.clientX,y:e.clientY,vb:vb()}; moved=0; }
  else if(pts.size===2){ dragFrom=null; pinch=gap(); }
  try{ svgEl.setPointerCapture(e.pointerId); }catch(err){}
});
function gap(){
  const a=[...pts.values()]; if(a.length<2) return 0;
  return Math.hypot(a[0].x-a[1].x, a[0].y-a[1].y);
}
function mid(){
  const a=[...pts.values()];
  return [(a[0].x+a[1].x)/2,(a[0].y+a[1].y)/2];
}
svgEl.addEventListener("pointermove",e=>{
  if(!pts.has(e.pointerId)) return;
  pts.set(e.pointerId,{x:e.clientX,y:e.clientY});
  if(pts.size===2&&pinch){
    const g=gap(); if(!g) return;
    const [cx,cy]=mid();
    zoomAt(cx,cy,pinch/g); pinch=g; moved=99;
    return;
  }
  if(!dragFrom) return;
  const dx=e.clientX-dragFrom.x, dy=e.clientY-dragFrom.y;
  moved=Math.max(moved,Math.abs(dx)+Math.abs(dy));
  if(moved<4) return;                                 // 손떨림은 클릭으로 본다
  const r=svgEl.getBoundingClientRect(), v=dragFrom.vb;
  const s=Math.min(r.width/v[2], r.height/v[3]);
  manual([v[0]-dx/s, v[1]-dy/s, v[2], v[3]]);
});
function up(e){
  pts.delete(e.pointerId);
  if(pts.size<2) pinch=0;
  if(pts.size===0){
    /* 끌지 않고 톡 눌렀다면 → 그 나라를 문제에서 뺀다 */
    if(moved<5&&dragFrom){
      const p=e.target&&e.target.closest?e.target.closest("path[data-code]"):null;
      const code=p&&p.getAttribute("data-code");
      if(code&&typeof mode!=="undefined"&&mode!=="free"&&window.PICK) window.PICK.tapOut(code);
    }
    dragFrom=null;
  }
}
svgEl.addEventListener("pointerup",up);
svgEl.addEventListener("pointercancel",up);

/* ---------- 전체 지도 ↔ 클로즈업 자리 바꾸기 ----------
   보통은 큰 화면이 문제 지역을 당겨 보여 주고, 오른쪽 위 작은 칸이 전체 위치다.
   이걸 뒤집으면 큰 화면이 전체 지도가 되고 작은 칸이 당겨 보여 준다.
   (미니맵을 눌러도 되고, 아래 돋보기 단추를 눌러도 된다)                       */
const KEY="geoarcade.swapview";
const ovBox=document.querySelector(".overview");
const ovSvg=document.getElementById("ovmap");
let swapped=false;
try{ swapped=localStorage.getItem(KEY)==="1"; }catch(e){}

/* 큰 화면이 당겨지는 곳은 vbForTarget 한 군데다 — 뒤집혔으면 전체를 돌려준다 */
const _vbFor=(typeof vbForTarget==="function")?vbForTarget:null;
if(_vbFor) vbForTarget=function(code){ return swapped?full().slice():_vbFor(code); };

function paintSwap(){
  if(ovBox) ovBox.classList.toggle("swapped",swapped);
  const cap=ovBox&&ovBox.querySelector(".cap");
  if(cap) cap.textContent=swapped?"확대 보기":"전체 위치";
  const b=bar&&bar.querySelector('[data-z="swap"]');
  if(b){ b.classList.toggle("on",swapped);
         b.title=swapped?"큰 화면을 다시 확대해서 보기":"큰 화면을 전체 지도로 보기"; }
}
/* 작은 칸은 큰 화면과 가로세로 비율이 달라서 vbForTarget 을 그대로 쓰면 엉뚱하게 잘린다.
   같은 방식으로 계산하되 작은 칸의 비율을 쓴다. 여기는 전체 맥락을 큰 화면이 맡으므로
   하한(ZOOM_MIN) 없이 바짝 당겨 보여 준다. */
function ovVBFor(code){
  const b=(typeof bboxOf==="function")?bboxOf(code):null;
  if(!b) return full().slice();
  const pad=Math.max(b.w,b.h)*0.35+6;      // 상세 보기라 여백을 적게 (맥락은 큰 화면이 맡는다)
  let w=b.w+pad*2, h=b.h+pad*2;
  const r=ovSvg.getBoundingClientRect();
  const ar=(r.width||150)/(r.height||104);
  if(w/h<ar) w=h*ar; else h=w/ar;
  return [b.x+b.w/2-w/2, b.y+b.h/2-h/2, w, h];
}
/* 문제가 바뀔 때마다 작은 칸의 보기 범위를 맞춘다 */
function syncOv(){
  if(!ovSvg) return;
  if(swapped&&typeof target!=="undefined"&&target) ovSvg.setAttribute("viewBox",ovVBFor(target).join(" "));
  else ovSvg.setAttribute("viewBox",full().join(" "));
}
if(typeof nextTarget==="function"){
  const _n=nextTarget;
  nextTarget=function(){ _n(); syncOv(); };
}
if(typeof resetGame==="function"){
  const _r=resetGame;
  resetGame=function(){ _r(); syncOv(); paintSwap(); };
}
function toggleSwap(){
  swapped=!swapped;
  try{ localStorage.setItem(KEY,swapped?"1":"0"); }catch(e){}
  paintSwap(); syncOv();
  wrap.classList.remove("zoomed");
  if(typeof target!=="undefined"&&target&&_vbFor) tweenVB(vbForTarget(target));
  else if(typeof tweenVB==="function") tweenVB(full().slice());
}
if(ovBox){
  ovBox.style.cursor="pointer";
  ovBox.setAttribute("role","button");
  ovBox.setAttribute("tabindex","0");
  ovBox.title="눌러서 큰 화면과 자리 바꾸기";
  ovBox.addEventListener("click",toggleSwap);
  ovBox.addEventListener("keydown",e=>{ if(e.key==="Enter"||e.key===" "){ e.preventDefault(); toggleSwap(); } });
}

/* ---------- 단추 ---------- */
const bar=document.createElement("div");
bar.className="mzbar";
bar.innerHTML='<button type="button" data-z="swap" aria-label="큰 화면과 작은 지도 자리 바꾸기">🔍</button>'+
              '<button type="button" data-z="in"  title="확대" aria-label="지도 확대">＋</button>'+
              '<button type="button" data-z="out" title="축소" aria-label="지도 축소">－</button>'+
              '<button type="button" data-z="fit" title="원래대로" aria-label="원래 보기로">⟲</button>';
wrap.appendChild(bar);
bar.addEventListener("click",e=>{
  const b=e.target.closest("[data-z]"); if(!b) return;
  const r=svgEl.getBoundingClientRect(), cx=r.left+r.width/2, cy=r.top+r.height/2;
  if(b.dataset.z==="in") zoomAt(cx,cy,1/1.35);
  else if(b.dataset.z==="out") zoomAt(cx,cy,1.35);
  else if(b.dataset.z==="swap") toggleSwap();
  else reset();
});
paintSwap(); syncOv();
})();
