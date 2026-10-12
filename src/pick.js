/* =======================================================================
   PICK — 어떤 문제를 낼지 고르기 (growth.js 보다 먼저 붙는다)

   세 가지가 같은 "문제 거르기" 한 곳으로 모인다.
     대륙 고르기   세계지도에서 아시아만, 유럽만… (DATA[c].region)
     난이도        한국 시·군에서 '시 단위만'(85곳) / '군까지 전부'(167곳)
     빼놓기        지도에서 나라를 눌러 다음부터 안 나오게. 설정에서 되돌린다

   고른 내용은 P.pick 에 지도별로 담겨 기록과 함께 저장된다.
   growth.js 의 pool() 이 여기를 거쳐 간다 — PICK 이 먼저 평가돼야 해서 앞에 붙인다.
   ======================================================================= */
const PICK=(function(){
function $(id){ return document.getElementById(id); }
function esc(s){ return String(s==null?"":s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c])); }
function ds(){ return typeof CURRENT!=="undefined"?CURRENT:""; }
function save(){ try{ if(typeof persist==="function") persist(); else if(typeof lsSave==="function") lsSave(); }catch(e){} }

/* 지도별 설정. conts=고른 대륙(빈 배열이면 전부), tier="si"면 시 단위만, off=뺀 코드 */
function st(key){
  key=key||ds();
  if(typeof P==="undefined") return {conts:[],tier:null,off:{}};
  P.pick=P.pick||{};
  const v=P.pick[key]=P.pick[key]||{};
  v.conts=v.conts||[]; v.off=v.off||{};
  /* 한국 시·군은 군 단위가 처음엔 어렵다는 피드백 → 기본을 '시 단위만'으로 둔다.
     한 번이라도 직접 고르면 그 값을 쓴다(전부는 ""로 저장해 '안 고름'과 구분). */
  if(v.tier===undefined||v.tier===null) v.tier=/^kr_sgg/.test(key)?"si":"";
  /* 세계지도의 속령·무인도는 기본으로 뺀다 (처음엔 나라만 197곳) */
  if(v.minor===undefined) v.minor=false;
  return v;
}

/* 이 지도에 어떤 고르기가 쓸모 있는가 */
function hasConts(){ return ds()==="world"; }
function hasTier(){ return /^kr_sgg/.test(ds()); }
function minorList(){
  try{ return (DATASETS[ds()]||{}).minor||null; }catch(e){ return null; }
}
function hasMinor(){ const m=minorList(); return !!(m&&m.length); }
function isGun(code){
  const d=(typeof DATA!=="undefined"&&DATA[code])||null;
  return !!(d&&/군$/.test(d.kanji||""));
}

/* ---------- 거르기 (growth.js 의 pool 이 부른다) ---------- */
function filter(codes){
  if(!codes||!codes.length) return codes;
  const v=st(), conts=v.conts||[], off=v.off||{};
  let out=codes.filter(c=>!off[c]);
  if(hasConts()&&conts.length) out=out.filter(c=>conts.indexOf((DATA[c]||{}).region)>=0);
  if(hasTier()&&v.tier==="si") out=out.filter(c=>!isGun(c));
  if(hasMinor()&&!v.minor){ const m=new Set(minorList()); out=out.filter(c=>!m.has(c)); }
  /* 전부 걸러지면 라운드를 만들 수 없다 — 그대로 돌려주고 알린다 */
  if(!out.length){ note("고른 조건에 맞는 문제가 없어서 전체로 풉니다."); return codes; }
  return out;
}
function count(){ try{ return filter(typeof pool==="function"?pool():CODES).length; }catch(e){ return 0; } }

/* ---------- 빼놓기 ---------- */
function isOff(code){ return !!st().off[code]; }
function setOff(code,on){
  if(!code) return;
  const v=st();
  if(on) v.off[code]=1; else delete v.off[code];
  save(); paintChips(); render();
}
/* 지도에서 눌렀을 때 — 되돌릴 수 있게 알림을 띄운다 */
function tapOut(code){
  if(!code||!DATA[code]) return;
  setOff(code,true);
  const nm=DATA[code].ko;
  toast(`🚫 <b>${esc(nm)}</b> 뺐어요 · 다음부터 안 나와요`,
        ()=>{ setOff(code,false); toast(`↩️ <b>${esc(nm)}</b> 되돌렸어요`); });
  /* 지금 풀고 있는 문제를 뺐으면 다음 문제로 넘긴다 */
  if(typeof target!=="undefined"&&target===code){ const b=document.getElementById("skipbtn"); if(b) b.click(); }
}

/* ---------- 지도 칩에 표시 ---------- */
function paintChips(){
  try{
    const off=st().off;
    for(const c in chipEls){ if(chipEls[c]) chipEls[c].classList.toggle("pickoff",!!off[c]); }
    for(const c in (typeof DATA!=="undefined"?DATA:{})){
      const p=svg&&svg.querySelector(`path[data-code="${c}"]`);
      if(p) p.classList.toggle("pickoff",!!off[c]);
    }
  }catch(e){}
}

/* ---------- 알림 ---------- */
let tT=0;
function toast(html,undo){
  let t=$("picktoast");
  if(!t){ t=document.createElement("div"); t.id="picktoast"; t.className="picktoast"; t.setAttribute("role","status"); document.body.appendChild(t); }
  t.innerHTML=html+(undo?' <button type="button" id="pickundo">되돌리기</button>':"");
  t.classList.add("show");
  if(undo) $("pickundo").addEventListener("click",()=>{ t.classList.remove("show"); undo(); });
  clearTimeout(tT); tT=setTimeout(()=>t.classList.remove("show"),4200);
}
function note(t){ const n=$("picknote"); if(n) n.textContent=t; }

/* ---------- 고르기 창 ---------- */
function wrap(){
  let w=$("pickwrap");
  if(w) return w;
  w=document.createElement("div"); w.id="pickwrap"; w.className="pickwrap";
  document.body.appendChild(w);
  w.addEventListener("click",e=>{
    if(e.target===w) return close();
    const b=e.target.closest("[data-k]"); if(!b) return;
    const k=b.dataset.k, v=st();
    if(k==="close") return close();
    if(k==="cont"){
      const c=b.dataset.v, i=v.conts.indexOf(c);
      if(i>=0) v.conts.splice(i,1); else v.conts.push(c);
      save(); apply();
    }
    else if(k==="contall"){ v.conts=[]; save(); apply(); }
    else if(k==="tier"){ v.tier=b.dataset.v||""; save(); apply(); }
    else if(k==="minor"){ v.minor=!!b.dataset.v; save(); apply(); }
    else if(k==="on"){ setOff(b.dataset.v,false); apply(); }
    else if(k==="onall"){ v.off={}; save(); apply(); }
  });
  return w;
}
function apply(){ render(); if(typeof resetGame==="function") resetGame(); paintChips(); }
function open(){ wrap().classList.add("open"); render(); }
function close(){ const w=$("pickwrap"); if(w) w.classList.remove("open"); }

function render(){
  const w=$("pickwrap"); if(!w||!w.classList.contains("open")) return;
  const v=st(), all=(typeof CODES!=="undefined"?CODES:[]);
  let body="";

  if(hasConts()){
    const order=(typeof REGION_ORDER!=="undefined"?REGION_ORDER:[]);
    body+='<div class="picksec"><h4>대륙 고르기 <small>고르지 않으면 전부</small></h4><div class="pickchips">';
    for(const r of order){
      const n=all.filter(c=>(DATA[c]||{}).region===r).length;
      if(!n) continue;
      const on=v.conts.indexOf(r)>=0;
      body+=`<button type="button" data-k="cont" data-v="${esc(r)}" class="${on?"on":""}">${esc(r)} <i>${n}</i></button>`;
    }
    body+=`</div><button type="button" class="picklink" data-k="contall">전부 다시 켜기</button></div>`;
  }

  if(hasTier()){
    const si=all.filter(c=>!isGun(c)).length;
    body+='<div class="picksec"><h4>난이도 <small>군 단위는 처음엔 어렵습니다</small></h4><div class="pickchips">'+
      `<button type="button" data-k="tier" data-v="si" class="${v.tier==="si"?"on":""}">시 단위만 <i>${si}</i></button>`+
      `<button type="button" data-k="tier" data-v="" class="${v.tier?"":"on"}">군까지 전부 <i>${all.length}</i></button>`+
      '</div></div>';
  }

  if(hasMinor()){
    const n=minorList().length;
    body+='<div class="picksec"><h4>속령·작은 섬 <small>괌, 미국령 버진아일랜드, 무인도…</small></h4><div class="pickchips">'+
      `<button type="button" data-k="minor" data-v="" class="${v.minor?"":"on"}">나라만 <i>${(typeof CODES!=="undefined"?CODES.length:0)-n}</i></button>`+
      `<button type="button" data-k="minor" data-v="1" class="${v.minor?"on":""}">속령까지 전부 <i>${(typeof CODES!=="undefined"?CODES.length:0)}</i></button>`+
      '</div></div>';
  }

  const off=Object.keys(v.off).filter(c=>DATA&&DATA[c]);
  body+='<div class="picksec"><h4>빼놓은 문제 <small>지도에서 눌러 뺄 수 있어요</small></h4>';
  if(!off.length) body+='<p class="pickempty">아직 없어요. 플레이 중에 지도에서 누르면 다음부터 안 나와요.</p>';
  else{
    body+='<div class="pickchips">'+off.map(c=>
      `<button type="button" data-k="on" data-v="${esc(c)}" class="back">${esc(DATA[c].ko)} <i>↩</i></button>`).join("")+
      `</div><button type="button" class="picklink" data-k="onall">${off.length}개 전부 되돌리기</button>`;
  }
  body+='</div>';

  w.innerHTML=`<div class="pickbox" role="dialog" aria-modal="true" aria-label="문제 고르기">
    <div class="pickhead"><h2>🎚️ 문제 고르기</h2><button type="button" data-k="close" aria-label="닫기">✕</button></div>
    <div class="pickbody">${body}
      <div class="picksum">지금 풀 문제 <b>${count()}</b>개</div>
      <div class="picknote" id="picknote"></div>
    </div></div>`;
}

/* 시작 화면에 넣는 체크 한 줄 — growth.js 의 renderStart 가 불러다 붙인다 */
function startRow(){
  if(!hasMinor()) return "";
  const on=st().minor, n=minorList().length;
  return `<label class="pickminor"><input type="checkbox" data-g="minor"${on?" checked":""}>`+
         `🏝️ 속령·작은 섬도 함께 <small>${n}곳 · 괌, 미국령 버진아일랜드 같은 곳</small></label>`;
}
function toggleMinor(){
  const v=st(); v.minor=!v.minor; save();
  if(typeof resetGame==="function") resetGame();
  render();
}

const api={filter,isOff,setOff,tapOut,open,close,paintChips,count,startRow,toggleMinor,hasMinor};
try{ window.PICK=api; }catch(e){}

function init(){
  /* 설정(⚙️)에 들어가는 줄 */
  const links=document.querySelector(".setlinks");
  if(links){
    const row=document.createElement("div");
    row.className="settrow";
    row.innerHTML='<span>🎚️ 문제 고르기</span><button class="btn" id="pickbtn">열기</button>';
    links.parentNode.insertBefore(row,links);
    $("pickbtn").addEventListener("click",()=>{ document.querySelector(".settings").classList.remove("open"); open(); });
  }
  document.addEventListener("keydown",e=>{ if(e.key==="Escape") close(); });
  /* 지도를 바꾸면 그 지도의 설정으로 다시 그린다 */
  if(typeof loadDataset==="function"){
    const _l=loadDataset;
    loadDataset=function(k){ _l(k); paintChips(); render(); };
  }
  /* resetGame 이 지도 칠을 초기화하므로(className 재설정) 그 뒤에 다시 흐리게 칠한다 */
  if(typeof resetGame==="function"){
    const _r=resetGame;
    resetGame=function(){ _r(); paintChips(); };
  }
  paintChips();
}
if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",init);
else init();
return api;
})();
