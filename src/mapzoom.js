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
  if(typeof tweenVB==="function") tweenVB(full().slice());
  else setVB(full().slice());
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

/* ---------- 단추 ---------- */
const bar=document.createElement("div");
bar.className="mzbar";
bar.innerHTML='<button type="button" data-z="in"  title="확대" aria-label="지도 확대">＋</button>'+
              '<button type="button" data-z="out" title="축소" aria-label="지도 축소">－</button>'+
              '<button type="button" data-z="fit" title="전체 보기" aria-label="전체 지도 보기">⟲</button>';
wrap.appendChild(bar);
bar.addEventListener("click",e=>{
  const b=e.target.closest("[data-z]"); if(!b) return;
  const r=svgEl.getBoundingClientRect(), cx=r.left+r.width/2, cy=r.top+r.height/2;
  if(b.dataset.z==="in") zoomAt(cx,cy,1/1.35);
  else if(b.dataset.z==="out") zoomAt(cx,cy,1.35);
  else reset();
});
})();
