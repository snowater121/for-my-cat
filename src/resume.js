/* =======================================================================
   RESUME — 풀던 판 이어서 하기 (growth.js 뒤에 붙는다)

   중간에 창을 닫거나 전화가 와도 그대로 돌아올 수 있게, 진행 중인 라운드를
   통째로 localStorage 에 적어 둔다. 다음에 들어오면 시작 화면 맨 위에
   "⏯️ 풀던 판이 남아 있어요 — 이어서 하기 / 새로 시작" 한 줄이 뜬다.

   되살리는 것: 지도·모드·방향 · 남은 문제와 순서 · 맞힌 곳 · 정답공개한 곳 ·
                문제별 결과(🟩🟨🟥) · 연속 정답 · 정답/오답 수 · 흘러간 시간.
   그래서 이어서 끝내도 기록·업적·공유 그림이 한 판 그대로 나온다.

   저장하지 않는 것
     1:1 실시간 대결 — 상대가 기다려 주지 않으므로 이어 할 수 없다.
     아직 START 를 누르지 않았거나 이미 끝난 판.

   로그인해 두면 auth.js 가 이 저장본도 계정에 함께 올린다 (다른 기기에서 이어서).
   ======================================================================= */
const RESUME=(function(){
const KEY="geoarcade.resume.v1";
const MAX_AGE=14*24*3600*1000;          // 2주 지난 저장본은 없는 셈 친다
const $=id=>document.getElementById(id);

let snap=null;        // 아직 쓰지 않은 저장본 (있으면 시작 화면에 줄이 뜬다)
let tmr=0;
let roundDs="";       // 지금 진행 중인 판이 어느 지도의 것인가 (지도를 바꾸는 중에 섞이지 않게)

/* 시연(?demo=1)에서는 저장도 복원도 하지 않는다 — 영상에 엉뚱한 줄이 끼면 안 된다 */
let DEMO=false;
try{ DEMO=new URLSearchParams(location.search).get("demo")==="1"; }catch(e){}

/* ---------- 읽고 쓰기 ---------- */
function read(){
  try{
    const o=JSON.parse(localStorage.getItem(KEY)||"null");
    if(!o||o.v!==1||!o.ds||!DATASETS[o.ds]) return null;
    if(Date.now()-(o.at||0)>MAX_AGE) return null;
    return o;
  }catch(e){ return null; }
}
function write(o){
  try{ if(o) localStorage.setItem(KEY,JSON.stringify(o)); else localStorage.removeItem(KEY); }catch(e){}
  try{ if(window.AUTH&&AUTH.touch) AUTH.touch(); }catch(e){}     // 계정에도 따라 올린다
}

/* ---------- 지금 판을 사진 찍기 ---------- */
function take(){
  if(DEMO) return null;
  if(typeof pendingStart==="undefined"||pendingStart||over||!startedAt) return null;
  const rs=(window.GROW&&GROW.roundState)?GROW.roundState():null;
  if(!rs) return null;
  if(rs.special&&rs.special.type==="versus") return null;        // 실시간 대결은 이어 할 수 없다
  /* 지도를 바꾸는 중에는 DATA 가 벌써 새 지도 것이다 — 이때 찍으면 뒤섞인 사진이 나온다 */
  if(roundDs&&roundDs!==CURRENT) return null;
  if(queue.length&&!DATA[queue[0]]) return null;
  if(found.size===0&&revealed.size===0&&(Date.now()-startedAt)<4000) return null;  // 막 시작한 판은 둘 필요 없다
  return {v:1,at:Date.now(),
          ds:CURRENT,mode:mode,dir:(typeof ejuDir!=="undefined"?ejuDir:""),
          round:ROUND,queue:queue.slice(),
          found:[...found],revealed:[...revealed],
          streak:streak|0,ms:Date.now()-startedAt,
          live:(REC.live?Object.assign({},REC.live):null),
          seed:rs.seed,codes:rs.codes,out:rs.out,special:rs.special};
}
function save(){ const o=take(); if(o) write(o); }
function schedule(){ clearTimeout(tmr); tmr=setTimeout(save,600); }

/* 한 문제 끝날 때마다 updateStats 가 불린다 — 거기 얹어 두면 빠짐이 없다 */
if(typeof updateStats==="function"){
  const _u=updateStats;
  updateStats=function(){ _u(); schedule(); };
}
/* 탭을 닫거나 숨길 때는 기다리지 않고 바로 적는다 */
addEventListener("visibilitychange",()=>{ if(document.visibilityState==="hidden"){ clearTimeout(tmr); save(); } });
addEventListener("pagehide",()=>{ clearTimeout(tmr); save(); });

/* 판이 끝나면 저장본은 쓸모가 없다 */
const _fin=REC.finish.bind(REC);
REC.finish=function(cleared){ clearTimeout(tmr); write(null); snap=null; return _fin(cleared); };

/* 다 풀기 전에 판을 접었다면(다시하기·지도 바꾸기·모드 바꾸기) 그 판을 붙잡아 둔다.
   그래야 손이 미끄러져도 시작 화면에서 바로 "이어서 하기" 로 돌아올 수 있다.
   지도 바꾸기는 loadDataset 이 CURRENT·DATA 를 갈아 끼우기 **전에** 찍어야 한다. */
if(typeof loadDataset==="function"){
  const _l=loadDataset;
  loadDataset=function(k){ keep(); return _l(k); };
}
if(typeof resetGame==="function"){
  const _r=resetGame;
  resetGame=function(){ keep(); return _r(); };   // renderStart 가 곧 불리면서 줄이 뜬다
}
function keep(){ const o=take(); if(o){ write(o); snap=o; } }

/* START 를 눌렀다 = 새로 시작하겠다는 뜻이니 옛 저장본을 버린다 */
if(typeof beginRound==="function"){
  const _b=beginRound;
  beginRound=function(){ drop(); roundDs=CURRENT; return _b(); };
}

/* ---------- 되살리기 ---------- */
function fmtAgo(at){
  const m=Math.round((Date.now()-at)/60000);
  if(m<1) return "방금";
  if(m<60) return m+"분 전";
  const h=Math.round(m/60); if(h<24) return h+"시간 전";
  return Math.round(h/24)+"일 전";
}
/* 정답을 공개했던 곳은 engine 의 '정답 공개' 와 똑같이 칠한다 */
function paintRevealed(code){
  const p=svg.querySelector(`path[data-code="${code}"]`); if(!p) return;
  p.classList.remove("target","dim"); p.classList.add("revealed");
  if(labels[code]){ labels[code].textContent=labelFor(code); labels[code].classList.add("show"); }
  const chip=chipEls[code];
  if(chip){ chip.textContent=labelFor(code); chip.classList.remove("now"); chip.style.color="#ffcf66"; }
  if(ovPaths[code]) ovPaths[code].setAttribute("fill","#6b551a");
}

function restore(){
  const o=snap; if(!o) return;
  drop();                                        // 되살리는 순간 저장본은 소비된다
  const rs={seed:o.seed,codes:o.codes,out:o.out,special:o.special};

  /* 1) 라운드의 성격(특별 라운드·시드)을 먼저 돌려놓아야 resetGame 이 같은 판을 다시 만든다 */
  if(window.GROW){
    GROW.setRoundState(rs);
    GROW.setModeUI(o.mode); if(o.dir) GROW.setDirUI(o.dir);
    GROW.switchDs(o.ds);                         // 지도 교체 + resetGame (OUT 은 여기서 비워진다)
    GROW.setRoundState(rs);                      // 그래서 문제별 결과는 한 번 더 넣어 준다
  }

  /* 2) 진행 상황을 그대로 꽂는다 */
  ROUND=o.round|0;
  queue=(o.queue||[]).filter(c=>DATA[c]);
  found=new Set((o.found||[]).filter(c=>DATA[c]));
  revealed=new Set((o.revealed||[]).filter(c=>DATA[c]));
  streak=o.streak|0;
  REC.live=o.live||{correct:0,wrong:0,peak:0};
  for(const c of found) try{ markFound(c); }catch(e){}
  for(const c of revealed) paintRevealed(c);

  /* 3) 멈춰 있던 시계를 흘러간 만큼 뒤로 물려서 다시 돌린다 */
  over=false; pendingStart=false; roundDs=o.ds;
  $("startscreen").style.display="none";
  startTimer(); startedAt=Date.now()-(o.ms||0);
  updateStats();

  if(mode==="free"){ hint.textContent="떠오르는 이름을 입력하세요! (이어서 하는 중)"; }
  else{
    nextTarget();
    hint.textContent = mode==="quiz" ? "이어서 하는 중 — 하이라이트된 곳의 이름을 입력하고 Enter!"
      : mode==="type" ? "이어서 하는 중 — 화면의 이름을 그대로 따라 입력!"
      : "이어서 하는 중 — 특징을 읽고 이름을 입력한 뒤 Enter!";
  }
  input.value=""; input.focus();
  try{ MAS.stage.face("focus",1400).say("이어서 가 보자 🐾",2400); }catch(e){}
}

function drop(){
  clearTimeout(tmr); snap=null; write(null);
  try{ if(window.GROW) GROW.renderStart(); }catch(e){}
}

/* ---------- 시작 화면 한 줄 (growth.js 의 renderStart 가 불러다 붙인다) ---------- */
function startRow(){
  const o=snap; if(!o) return "";
  const d=DATASETS[o.ds]||{};
  const n=(o.found||[]).length;
  return `<div class="rsrow"><div class="rstxt">⏯️ 풀던 판이 남아 있어요`+
    `<small>${esc(d.icon||"")} ${esc(d.brand||o.ds)} · ${n}/${o.round} 맞힘 · ${fmt(o.ms||0)} · ${fmtAgo(o.at)}</small></div>`+
    `<div class="rsbtn"><button type="button" data-g="resume">이어서 하기</button>`+
    `<button type="button" class="ghost" data-g="dropresume">새로 시작</button></div></div>`;
}

/* ---------- 계정 동기화에서 쓴다 ---------- */
function get(){ return snap||read(); }
function put(o){                                    // 다른 기기에서 가져온 저장본을 받는다
  if(!o||o.v!==1||!o.ds||!DATASETS[o.ds]) return false;
  const now=get();
  if(now&&(now.at||0)>=(o.at||0)) return false;     // 여기 것이 더 새것이면 둔다
  try{ localStorage.setItem(KEY,JSON.stringify(o)); }catch(e){}
  snap=o;
  try{ if(window.GROW) GROW.renderStart(); }catch(e){}
  return true;
}

const api={startRow,restore,drop,save,get,put};
try{ window.RESUME=api; }catch(e){}

snap=DEMO?null:read();
if(snap){ try{ if(window.GROW) GROW.renderStart(); }catch(e){} }
return api;
})();
