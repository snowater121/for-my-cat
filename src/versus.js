/* =======================================================================
   VERSUS — 1:1 실시간 대결방 (growth.js 뒤에 붙는다)

   Firebase Realtime Database를 **SDK 없이** REST로만 쓴다.
     읽기(실시간)  EventSource(.json)  → put/patch 이벤트
     쓰기          fetch PUT / PATCH / DELETE(.json)
   RTDB REST는 EventSource를 그대로 받아 주므로 100KB짜리 SDK를 넣지 않아도 되고,
   "단일 HTML 한 장" 원칙도 지켜진다.

   방 구조
     /rooms/{코드}/cfg      {ds,mode,dir,n,seed,host,at}   방장이 한 번 쓴다
     /rooms/{코드}/p/{내id} {name,ready,found,round,done,ms,grid,at}
     /rooms/{코드}/go       시작 시각(ms). 찍히면 양쪽이 동시에 카운트다운

   승부: 맞힌 개수 → 같으면 걸린 시간. (사용자가 고른 방식)
   ======================================================================= */
const VS=(function(){
const CFG=__VERSUS__;                       // {url:"https://xxx.firebaseio.com"} — 비면 기능이 꺼진다
const ALIVE=6*60*60*1000;                   // 6시간 지난 방은 없는 것으로 친다
const CODE_CHARS="ABCDEFGHJKLMNPQRSTUVWXYZ23456789";   // 헷갈리는 I,O,0,1 제외

let room=null;                              // 방 코드
let me=null;                                // 내 id
let state=null;                             // 방 전체 (스트림으로 들어온 것)
let es=null;                                // EventSource
let host=false;
let phase="off";                            // off|lobby|ready|count|play|over
let sent={};                                // 마지막으로 보낸 진행도 (같으면 안 보낸다)
let pushTimer=0;

function on(){ return !!(CFG&&CFG.url); }
function $(id){ return document.getElementById(id); }
function url(p){ return CFG.url.replace(/\/$/,"")+p+".json"; }
function code(n){ let s=""; for(let i=0;i<n;i++) s+=CODE_CHARS[Math.floor(Math.random()*CODE_CHARS.length)]; return s; }
/* 탭마다 다른 사람이어야 한다 — sessionStorage는 탭 단위라 같은 브라우저에서
   두 탭을 열어도 서로 다른 참가자가 된다 (새로고침에는 살아남는다). */
function myId(){
  let v=null;
  try{ v=sessionStorage.getItem("geoarcade.vsid"); }catch(e){}
  if(!v){
    v=code(10);
    try{ sessionStorage.setItem("geoarcade.vsid",v); }catch(e){}
  }
  return v;
}
async function put(p,v){ try{ await fetch(url(p),{method:"PUT",body:JSON.stringify(v)}); }catch(e){} }
async function patch(p,v){ try{ await fetch(url(p),{method:"PATCH",body:JSON.stringify(v)}); }catch(e){} }
async function del(p){ try{ await fetch(url(p),{method:"DELETE"}); }catch(e){} }
async function read(p){ try{ const r=await fetch(url(p)); return await r.json(); }catch(e){ return null; } }

/* ---------- 실시간 스트림 ----------
   RTDB는 put(그 경로를 통째로 교체) / patch(합치기) 두 가지를 보낸다.
   path는 구독한 지점으로부터의 상대 경로라서 직접 따라 들어가 꽂아 준다. */
function apply(root,path,data,merge){
  const parts=String(path||"/").split("/").filter(Boolean);
  if(!parts.length) return merge&&root?Object.assign(root,data):data;
  let cur=root=(root&&typeof root==="object")?root:{};
  for(const k of parts.slice(0,-1)){
    if(typeof cur[k]!=="object"||cur[k]===null) cur[k]={};
    cur=cur[k];
  }
  const last=parts[parts.length-1];
  if(data===null) delete cur[last];
  else if(merge&&typeof cur[last]==="object"&&cur[last]) Object.assign(cur[last],data);
  else cur[last]=data;
  return root;
}
function listen(c){
  stop();
  es=new EventSource(url("/rooms/"+c));
  const take=(merge)=>(e)=>{
    let m=null; try{ m=JSON.parse(e.data); }catch(err){ return; }
    if(!m) return;
    state=apply(state,m.path,m.data,merge);
    render();
  };
  es.addEventListener("put",take(false));
  es.addEventListener("patch",take(true));
  es.onerror=()=>{ note("연결이 끊겼어요. 방 코드로 다시 들어와 주세요."); };
}
function stop(){ if(es){ try{ es.close(); }catch(e){} es=null; } }

/* ---------- 사람 ---------- */
function players(){
  const p=(state&&state.p)||{};
  return Object.keys(p).map(k=>Object.assign({id:k},p[k]));
}
function foe(){ return players().filter(x=>x.id!==me)[0]||null; }
function mine(){ return players().filter(x=>x.id===me)[0]||null; }
function myName(){ return (typeof P!=="undefined"&&P.name)||"나"; }

/* ---------- 방 만들기 / 들어가기 ---------- */
async function create(n){
  const c=code(5);
  room=c; me=myId(); host=true; state=null;
  const cfg={ds:CURRENT,mode:mode,dir:(typeof ejuDir!=="undefined"?ejuDir:""),
             n:n||10,seed:((Math.random()*4294967295)>>>0)||1,host:me,at:Date.now()};
  await put("/rooms/"+c+"/cfg",cfg);
  await put("/rooms/"+c+"/p/"+me,{name:myName(),ready:false,found:0,round:cfg.n,done:false,at:Date.now()});
  listen(c); phase="lobby"; openPanel();
  return c;
}
async function join(c){
  c=String(c||"").toUpperCase().replace(/[^A-Z0-9]/g,"");
  if(c.length<4){ note("방 코드를 다시 확인해 주세요."); return false; }
  const cfg=await read("/rooms/"+c+"/cfg");
  if(!cfg){ note("그런 방이 없어요. 코드를 다시 확인해 주세요."); return false; }
  if(Date.now()-(cfg.at||0)>ALIVE){ note("오래된 방이에요. 새로 만들어 주세요."); return false; }
  const now=await read("/rooms/"+c+"/p");
  const ids=Object.keys(now||{});
  if(ids.length>=2&&ids.indexOf(myId())<0){ note("이미 두 명이 들어가 있어요."); return false; }
  room=c; me=myId(); host=(cfg.host===me); state=null;
  await put("/rooms/"+c+"/p/"+me,{name:myName(),ready:false,found:0,round:cfg.n,done:false,at:Date.now()});
  listen(c); phase="lobby"; openPanel();
  return true;
}
async function leave(){
  if(room&&me) await del("/rooms/"+room+"/p/"+me);
  stop(); room=null; state=null; phase="off"; host=false; syncWait();
  closePanel(); hideHud();
  if(typeof GROW!=="undefined"&&GROW.exitSpecial) GROW.exitSpecial();
}
async function setReady(v){
  if(!room) return;
  await patch("/rooms/"+room+"/p/"+me,{ready:!!v,at:Date.now()});
}

/* ---------- 라운드 ---------- */
function cfg(){ return (state&&state.cfg)||null; }
function startRound(){
  const c=cfg(); if(!c) return;
  if(typeof GROW==="undefined"||!GROW.startVersus) return;
  GROW.startVersus({ds:c.ds,mode:c.mode,dir:c.dir,seed:c.seed,n:c.n,
                    title:"⚔️ 1:1 대결 · "+room});
}
/* 둘 다 준비되면 방장이 시작 시각을 찍는다 — 양쪽이 같은 시각에 카운트다운 */
function maybeGo(){
  if(!host||!room||phase!=="lobby") return;          // 정리 중·진행 중에는 찍지 않는다
  const ps=players();
  if(ps.length===2&&ps.every(x=>x.ready)&&!(state&&state.go)){
    put("/rooms/"+room+"/go",Date.now()+1200);
  }
}
let went=false;
function watchGo(){
  const go=state&&state.go;
  if(!go){                                           // 방장이 재대결을 눌러 go를 지웠다
    if(went&&phase!=="play"){ went=false; sent={}; phase="lobby"; hideHud(); syncWait(); }
    return;
  }
  if(went) return;
  went=true; phase="count"; syncWait(); closePanel(); showHud();
  startRound();
  const wait=Math.max(0,go-Date.now());
  setTimeout(()=>{ phase="play"; if(typeof runCountdown==="function") runCountdown(); },wait);
}

/* 진행도 올리기 — 답을 맞힐 때마다 부르되 400ms로 묶어서 보낸다 */
function pushProgress(){
  if(!room||phase!=="play") return;
  clearTimeout(pushTimer);
  pushTimer=setTimeout(()=>{
    const v={found:(typeof found!=="undefined"?found.size:0),round:(typeof ROUND!=="undefined"?ROUND:0)};
    if(sent.found===v.found&&sent.round===v.round) return;
    sent=v; patch("/rooms/"+room+"/p/"+me,v);
  },400);
}
/* 내가 끝났다 */
function finish(res){
  if(!room) return;
  phase="over"; syncWait(); hideHud();
  setTimeout(()=>openPanel(), res.cleared?900:350);
  patch("/rooms/"+room+"/p/"+me,
        {done:true,found:res.found,round:res.round,ms:res.ms,grid:res.grid||"",at:Date.now()});
}
/* 승패 — 맞힌 개수 → 같으면 걸린 시간 */
function verdict(){
  const a=mine(), b=foe();
  if(!a||!b||!a.done||!b.done) return null;
  if(a.found!==b.found) return a.found>b.found?"win":"lose";
  if(a.ms!==b.ms) return a.ms<b.ms?"win":"lose";
  return "draw";
}
async function rematch(){
  if(!room||!host||phase==="reset") return;
  const c=cfg(); if(!c) return;
  phase="reset";                                     // 정리하는 동안 go가 찍히지 않게 잠근다
  const ps=players();
  for(const x of ps) await patch("/rooms/"+room+"/p/"+x.id,{ready:false,found:0,done:false,ms:0,grid:""});
  await del("/rooms/"+room+"/go");
  await patch("/rooms/"+room+"/cfg",{seed:((Math.random()*4294967295)>>>0)||1,at:Date.now()});
  went=false; sent={}; phase="lobby"; openPanel();
}

/* ---------- 화면: 방 패널 ---------- */
function panel(){
  let w=$("vswrap");
  if(w) return w;
  w=document.createElement("div"); w.id="vswrap"; w.className="vswrap";
  document.body.appendChild(w);
  w.addEventListener("click",e=>{
    const b=e.target.closest("[data-v]"); if(!b) return;
    const a=b.dataset.v;
    if(a==="close") closePanel();
    else if(a==="leave") leave();
    else if(a==="ready") setReady(!(mine()||{}).ready);
    else if(a==="copy") share();
    else if(a==="rematch") rematch();
    else if(a==="make") create(+($("vsn")||{}).value||10);
    else if(a==="join") join(($("vscode")||{}).value);
  });
  return w;
}
function openPanel(){ panel().classList.add("open"); render(); }
function closePanel(){ const w=$("vswrap"); if(w) w.classList.remove("open"); }

function link(){
  const base=location.href.split("?")[0];
  return base+"?room="+room;
}
async function share(){
  const t="⚔️ GEO ARCADE 1:1 대결 방 "+room+"\n같이 풀자!\n"+link();
  try{ if(navigator.share){ await navigator.share({text:t}); note("공유 창을 열었어요."); return; } }catch(e){ if(e&&e.name==="AbortError") return; }
  try{ await navigator.clipboard.writeText(t); note("📋 방 링크를 복사했어요."); return; }catch(e){}
  note("이 주소를 보내 주세요: "+link());
}
function note(t){ const n=$("vsnote"); if(n) n.textContent=t; }

function row(p,label){
  if(!p) return `<div class="vsp empty"><b>${label}</b><small>아직 안 들어왔어요</small></div>`;
  const pct=p.round?Math.round((p.found||0)/p.round*100):0;
  return `<div class="vsp${p.ready?" ready":""}"><b>${esc(p.name||"익명")}${p.id===me?" (나)":""}</b>`+
    `<small>${p.done?"끝남 · "+(typeof fmt==="function"?fmt(p.ms||0):"")+" · "+(p.found||0)+"/"+p.round
             :(p.ready?"준비 완료 ✓":"준비 중…")}</small>`+
    `<i style="width:${pct}%"></i></div>`;
}
function syncWait(){
  document.body.classList.toggle("vswait",!!room&&(phase==="lobby"||phase==="ready"));
}
function render(){
  syncWait();
  drawHud();                                  // 상대가 올린 진행도도 여기서 반영된다
  const w=$("vswrap"); if(!w||!w.classList.contains("open")) return;
  if(!room){
    w.innerHTML=`<div class="vsbox" role="dialog" aria-modal="true" aria-label="1:1 대결">
      <div class="vshead"><h2>⚔️ 1:1 대결</h2><button type="button" data-v="close" aria-label="닫기">✕</button></div>
      <div class="vsbody">
        <p class="vsintro">둘이 <b>같은 문제를 같은 순서로</b> 풉니다. 맞힌 개수가 많은 쪽이 이기고, 같으면 빠른 쪽이 이깁니다.</p>
        <label class="vsfield">문제 수
          <select id="vsn"><option value="5">5문제</option><option value="10" selected>10문제</option><option value="20">20문제</option></select>
        </label>
        <button type="button" class="vsbtn primary" data-v="make">방 만들기</button>
        <div class="vsor">또는</div>
        <label class="vsfield">방 코드
          <input id="vscode" maxlength="5" placeholder="ABCDE" autocomplete="off" inputmode="latin">
        </label>
        <button type="button" class="vsbtn" data-v="join">들어가기</button>
        <div class="vsnote" id="vsnote"></div>
      </div></div>`;
    return;
  }
  const c=cfg(), a=mine(), b=foe(), v=verdict();
  const ds=(typeof DATASETS!=="undefined"&&c&&DATASETS[c.ds])||null;
  w.innerHTML=`<div class="vsbox" role="dialog" aria-modal="true" aria-label="대결방 ${room}">
    <div class="vshead"><h2>⚔️ ${room}</h2><button type="button" data-v="close" aria-label="닫기">✕</button></div>
    <div class="vsbody">
      <div class="vscfg">${ds?esc(ds.icon+" "+ds.brand):""}${c?" · "+c.n+"문제":""}</div>
      ${row(a,"나")}
      ${row(b,"상대")}
      ${v?`<div class="vsend ${v}">${v==="win"?"🎉 이겼다!":v==="lose"?"아쉬워요, 다음 판에!":"🤝 비겼어요"}</div>`:""}
      ${(a&&b&&a.done&&b.done&&a.grid&&b.grid)?
        `<div class="vsgrid"><div><span>나</span>${a.grid}</div><div><span>상대</span>${b.grid}</div></div>`:""}
      <div class="vsact">
        ${v?(host?`<button type="button" class="vsbtn primary" data-v="rematch">🔁 다시 대결</button>`
                 :`<button type="button" class="vsbtn" disabled>방장이 다시 시작하면 이어져요</button>`)
          :(a&&a.done)?`<button type="button" class="vsbtn" disabled>상대가 끝나길 기다리는 중…</button>`
           :`<button type="button" class="vsbtn primary" data-v="ready">${(a&&a.ready)?"준비 취소":"준비 완료"}</button>`}
        <button type="button" class="vsbtn" data-v="copy">🔗 방 링크</button>
        <button type="button" class="vsbtn ghost" data-v="leave">나가기</button>
      </div>
      <div class="vsnote" id="vsnote">${b?"":"방 코드 "+room+" 를 친구에게 보내세요."}</div>
    </div></div>`;
  maybeGo(); watchGo();
}

/* ---------- 화면: 플레이 중 상대 진행도 ---------- */
function hud(){
  let h=$("vshud");
  if(!h){
    h=document.createElement("div"); h.id="vshud"; h.className="vshud";
    const wrap=document.querySelector(".mapwrap");
    (wrap||document.body).appendChild(h);
  }
  return h;
}
function showHud(){ hud().classList.add("on"); drawHud(); }
function hideHud(){ const h=$("vshud"); if(h) h.classList.remove("on"); }
function drawHud(){
  const h=$("vshud"); if(!h||!h.classList.contains("on")) return;
  const a=mine(), b=foe();
  const bar=(p,cls)=>{
    const pct=p&&p.round?Math.round((p.found||0)/p.round*100):0;
    return `<div class="vsb ${cls}"><span>${p?esc(p.name||"익명"):"상대"}</span>`+
           `<i><b style="width:${pct}%"></b></i><em>${p?(p.found||0):0}</em></div>`;
  };
  h.innerHTML=bar(a,"me")+bar(b,"foe");
}

/* ---------- 들어오기 ---------- */
function openNew(){ room=null; state=null; openPanel(); }
function esc(s){ return String(s==null?"":s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c])); }

const api={on,openNew,create,join,leave,finish,pushProgress,drawHud,get room(){return room;},
           get phase(){return phase;},verdict,hideHud};

/* growth.js 가 먼저 평가되므로 이름(VS)으로는 못 본다 — const는 초기화 전 접근이 막힌다(TDZ).
   창에 걸어 두고 window.VS 로 보게 한다. init() 안에서 시작 화면을 다시 그리므로 그 전에 걸어야 한다. */
try{ window.VS=api; }catch(e){}

function init(){
  if(!on()) return;
  me=myId();
  /* 링크로 들어온 경우: ?room=코드 */
  let q; try{ q=new URLSearchParams(location.search); }catch(e){ q=new URLSearchParams(""); }
  const c=q.get("room");
  if(c) setTimeout(()=>join(c),300);
  /* 진행도는 화면이 갱신될 때마다 따라 올린다 */
  if(typeof updateStats==="function"){
    const _u=updateStats;
    updateStats=function(){ _u(); pushProgress(); drawHud(); };
  }
  if(typeof GROW!=="undefined"&&GROW.renderStart) GROW.renderStart();   // ⚔️ 버튼을 뒤늦게 붙인다
  window.addEventListener("beforeunload",()=>{ if(room&&me) navigator.sendBeacon&&navigator.sendBeacon(url("/rooms/"+room+"/p/"+me),JSON.stringify({gone:true})); });
}
init();
return api;
})();
