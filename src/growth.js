/* =======================================================================
   GROWTH — 공유·재방문 기능 (build_artifact.py가 게임 스크립트 끝에 붙인다)
   - 오늘의 문제: 날짜로 문제 5개를 정해 모두가 같은 문제를 푼다 (서버 없음)
   - 도전장: 라운드 순서를 시드 번호로 만들고, 시드를 링크에 담아 같은 순서로 도전
   - 이달의 특집: 제철·축제 시·군 묶음
   - 결과 창: 텍스트 공유 / 결과 이미지 / 도전장 링크
   - 연속 공부(스트릭)·업적
   ======================================================================= */
const GROW=(function(){
const SITE="https://snowater121.github.io/for-my-cat/";
const PAGE_FILE=__PAGE_FILE__;
const SEASON=__SEASON__;
const DAILY_N=5;
let SPECIAL=null;          // {type:"daily"|"challenge"|"season", codes, seed, title, from}
let SEED=0, OUT={}, ROUND_CODES=[], LAST=null;

/* ---------- 유틸 ---------- */
function ensure(){ P.days=P.days||[]; P.ach=P.ach||{}; P.daily=P.daily||{}; P.shares=P.shares||0; P.wins=P.wins||0; }
function ymd(d){ d=d||new Date(); return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0"); }
function dayNum(s){ const [y,m,d]=s.split("-").map(Number); return Math.round(Date.UTC(y,m-1,d)/86400000); }
function hash(s){ let h=2166136261>>>0; for(let i=0;i<s.length;i++){ h^=s.charCodeAt(i); h=Math.imul(h,16777619)>>>0; } return h>>>0; }
function rng(seed){ let a=seed>>>0; return function(){ a=(a+0x6D2B79F5)>>>0; let t=a; t=Math.imul(t^(t>>>15),t|1); t^=t+Math.imul(t^(t>>>7),t|61); return ((t^(t>>>14))>>>0)/4294967296; }; }
function seeded(arr,seed){ const a=arr.slice().sort(), r=rng(seed); for(let i=a.length-1;i>0;i--){ const j=Math.floor(r()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } return a; }
function pool(){ return mode==="eju"?EJU_CODES:CODES; }
function b64e(s){ return btoa(unescape(encodeURIComponent(s))).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,""); }
function b64d(s){ s=s.replace(/-/g,"+").replace(/_/g,"/"); while(s.length%4) s+="="; return decodeURIComponent(escape(atob(s))); }
function $(id){ return document.getElementById(id); }
function mk(){ return modeKey(); }
function modeName(k){ return MODE_LABEL[k]||({quiz:"지목 퀴즈",free:"자유 채우기",type:"타자 연습"})[k]||k; }
function monthDay(){ const d=new Date(); return (d.getMonth()+1)+"/"+d.getDate(); }
function dailyKey(){ return ymd()+"|"+CURRENT+"|"+mk(); }

/* ---------- 연속 공부 ---------- */
function streakNow(){
  ensure(); const set=new Set(P.days); let n=0, d=dayNum(ymd());
  if(!set.has(ymd())) d-=1;                         // 오늘 아직 안 했으면 어제부터 센다
  const toStr=x=>{ const t=new Date(x*86400000); return t.getUTCFullYear()+"-"+String(t.getUTCMonth()+1).padStart(2,"0")+"-"+String(t.getUTCDate()).padStart(2,"0"); };
  while(set.has(toStr(d))){ n++; d--; }
  return n;
}
function bestDays(){
  ensure(); let best=0, run=0, prev=null;
  for(const s of P.days){ const n=dayNum(s); run=(prev!==null&&n===prev+1)?run+1:1; prev=n; if(run>best) best=run; }
  return best;
}

/* ---------- 업적 ---------- */
function fullClear(re,n){ return Object.keys(P.best).some(k=>re.test(k)&&P.best[k].found>=n&&P.best[k].round>=n); }
const ACH=[
  {id:"first",  i:"🎮", n:"첫 라운드",     d:"라운드를 처음 끝냈다",               ok:()=>P.stats.plays>=1},
  {id:"p10",    i:"🕹️", n:"단골 손님",     d:"10판 플레이",                         ok:()=>P.stats.plays>=10},
  {id:"p50",    i:"👾", n:"오락실 주인",   d:"50판 플레이",                         ok:()=>P.stats.plays>=50},
  {id:"clear",  i:"🏁", n:"완주",          d:"한 라운드를 빠짐없이 맞혔다",         ok:()=>P.stats.clears>=1},
  {id:"s10",    i:"🔥", n:"불붙었다",      d:"10문제 연속 정답",                    ok:()=>P.stats.bestStreak>=10},
  {id:"s30",    i:"☄️", n:"멈출 수 없어",  d:"30문제 연속 정답",                    ok:()=>P.stats.bestStreak>=30},
  {id:"d3",     i:"📅", n:"사흘 연속",     d:"3일 연속 공부",                       ok:()=>bestDays()>=3},
  {id:"d7",     i:"🗓️", n:"일주일 개근",   d:"7일 연속 공부",                       ok:()=>bestDays()>=7},
  {id:"d30",    i:"🏆", n:"한 달 개근",    d:"30일 연속 공부",                      ok:()=>bestDays()>=30},
  {id:"daily",  i:"☀️", n:"오늘의 문제",   d:"오늘의 문제에 처음 참여",             ok:()=>Object.keys(P.daily).length>=1},
  {id:"perfect",i:"🟩", n:"퍼펙트 데이",   d:"오늘의 문제를 모두 초록으로",         ok:()=>Object.values(P.daily).some(x=>x.grid&&!/[🟨🟥]/u.test(x.grid))},
  {id:"jp",     i:"🗾", n:"일본 일주",     d:"일본 47곳을 한 라운드에 전부",        ok:()=>fullClear(/^jp(_sp)?_/,47)},
  {id:"sgg",    i:"🏘️", n:"전국 방방곡곡", d:"한국 시·군 167곳을 한 라운드에 전부", ok:()=>fullClear(/^kr_sgg(_sp)?_/,167)},
  {id:"world",  i:"🌍", n:"세계 일주",     d:"세계 256개국을 한 라운드에 전부",     ok:()=>fullClear(/^world_/,256)},
  {id:"win",    i:"⚔️", n:"도전 성공",     d:"받은 도전장의 기록을 이겼다",         ok:()=>P.wins>=1},
  {id:"share",  i:"📤", n:"자랑하기",      d:"결과를 처음 공유했다",                ok:()=>P.shares>=1},
];
function checkAch(){
  ensure(); const fresh=[];
  for(const a of ACH){ if(!P.ach[a.id]&&a.ok()){ P.ach[a.id]=Date.now(); fresh.push(a); } }
  return fresh;
}
function toast(html){
  let t=$("gtoast"); if(!t){ t=document.createElement("div"); t.id="gtoast"; t.className="gtoast"; t.setAttribute("role","status"); document.body.appendChild(t); }
  t.innerHTML=html; t.classList.add("show"); clearTimeout(t._h); t._h=setTimeout(()=>t.classList.remove("show"),2800);
}
function announce(list){
  list.forEach((a,i)=>setTimeout(()=>{ toast(`<span style="font-size:20px">${a.i}</span> 업적 달성! <b>${esc(a.n)}</b>`); if(soundOn){AC();tone(988,0.07,"square",0.05);tone(1319,0.12,"square",0.05,0.07);} },i*3000));
}

/* ---------- 특별 라운드 ---------- */
function setModeUI(m){
  if(!PAGE_MODES.includes(m)) return;
  mode=m; [...$("mode").children].forEach(x=>x.classList.toggle("on",x.dataset.m===m));
}
function setDirUI(d){
  if(d!=="name"&&d!=="feat") return;
  ejuDir=d; [...$("ejudir").children].forEach(x=>x.classList.toggle("on",x.dataset.d===d));
}
function switchDs(ds){
  [...$("dset").children].forEach(x=>x.classList.toggle("on",x.dataset.ds===ds));
  if(ds===CURRENT) resetGame(); else loadDataset(ds);
}
function startDaily(){
  if(mode==="free") setModeUI(PAGE_MODES.includes("quiz")?"quiz":PAGE_MODES[0]);
  const codes=seeded(pool(),hash(ymd()+"|"+CURRENT+"|"+(mode==="eju"?"eju":mode))).slice(0,DAILY_N);
  SPECIAL={type:"daily",codes,seed:0,title:"📅 "+monthDay()+" 오늘의 문제"};
  resetGame();
}
function seasonNow(){ const m=new Date().getMonth()+1; return SEASON.find(s=>s.m===m)||null; }
function seasonTarget(s){
  if(DATASETS[s.ds]) return {ds:s.ds, m:"eju"};
  const alt=s.ds.replace(/_sp$/,"");                     // 지도 타이핑 페이지에서는 같은 지도로 지목 퀴즈
  return DATASETS[alt]?{ds:alt, m:"quiz"}:null;
}
function startSeason(m){
  const s=SEASON.find(x=>x.m===m); if(!s) return;
  const t=seasonTarget(s); if(!t) return;
  const data=DATASETS[t.ds].data, by={};
  for(const c in data) by[data[c].ko]=c;
  const codes=seeded(s.names.map(n=>by[n]).filter(Boolean),hash("season"+m));
  setModeUI(t.m);
  SPECIAL={type:"season",codes,seed:0,title:s.emoji+" "+m+"월 특집 · "+s.title,sub:s.desc};
  switchDs(t.ds);
}
function applyChallenge(o){
  if(!o||!DATASETS[o.ds]) return;
  setModeUI(o.m); if(o.d) setDirUI(o.d);
  SPECIAL={type:"challenge",seed:(o.s>>>0)||1,codes:o.k?String(o.k).split(","):null,
           title:"⚔️ "+(o.n||"익명")+"의 도전장",
           from:{n:o.n||"익명",t:+o.t||0,f:+o.f||0,r:+o.r||0}};
  switchDs(o.ds);
}
function exitSpecial(){ SPECIAL=null; resetGame(); }

/* 라운드 준비: 모든 라운드의 순서를 시드로 만든다 (그래야 도전장이 같은 순서를 재현한다) */
const _reset=resetGame;
resetGame=function(){
  _reset();
  OUT={};
  if(mode==="free"){ ROUND_CODES=[]; SEED=0; renderStart(); return; }
  if(SPECIAL&&SPECIAL.codes){
    const p=new Set(pool());
    queue=SPECIAL.codes.filter(c=>p.has(c)); ROUND=queue.length; SEED=0;
  } else {
    SEED=(SPECIAL&&SPECIAL.seed)||((Math.random()*4294967295)>>>0)||1;
    queue=seeded(pool(),SEED);
  }
  ROUND_CODES=queue.slice(); updateStats(); renderStart();
};
// 사용자가 직접 지도·모드를 바꾸면 특별 라운드는 끝난다
$("mode").addEventListener("click",e=>{ if(e.target.closest("button")) SPECIAL=null; },true);
$("dset").addEventListener("click",e=>{ if(e.target.closest("button")) SPECIAL=null; },true);

/* 문제별 결과(🟩🟨🟥) 추적 */
const RANK={ok:0,hint:1,wrong:1,fail:2};
function mark(code,s){ if(code&&(RANK[s]>(RANK[OUT[code]]||0))) OUT[code]=s; }
const _wrong=REC.wrong.bind(REC);
REC.wrong=function(code){ mark(code,"wrong"); _wrong(code); };
$("hintbtn").addEventListener("click",()=>mark(target,"hint"),true);
$("revealbtn").addEventListener("click",()=>mark(target,"fail"),true);
$("skipbtn").addEventListener("click",()=>mark(target,"fail"),true);
function gridOf(codes){
  return codes.map(c=>(!found.has(c)||revealed.has(c))?"🟥":(OUT[c]?"🟨":"🟩")).join("");
}

/* ---------- 라운드 종료 ---------- */
const _finish=REC.finish.bind(REC);
REC.finish=function(cleared){
  if(!startedAt) return _finish(cleared);
  ensure();
  const ms=Date.now()-startedAt, key=CURRENT+"_"+mk();
  const prev=P.best[key]?Object.assign({},P.best[key]):null;
  const live=REC.live?Object.assign({},REC.live):{correct:0,wrong:0,peak:0};
  const sp=SPECIAL?Object.assign({},SPECIAL):null;
  const res={ms,found:found.size,round:ROUND,cleared,live,key,ds:CURRENT,mk:mk(),mode,dir:ejuDir,
             seed:SEED,codes:ROUND_CODES.slice(),special:sp,
             grid:(sp&&sp.type!=="challenge"&&ROUND_CODES.length<=40)?gridOf(ROUND_CODES):null};
  const t=ymd();
  if(!P.days.includes(t)){ P.days.push(t); P.days.sort(); if(P.days.length>400) P.days=P.days.slice(-400); }
  if(sp&&sp.type==="daily"){
    const dk=dailyKey();
    if(!P.daily[dk]) P.daily[dk]={grid:res.grid,ms,found:res.found,round:res.round};
    const ks=Object.keys(P.daily).sort(); if(ks.length>90) ks.slice(0,ks.length-90).forEach(k=>delete P.daily[k]);
  }
  if(sp&&sp.type==="challenge"&&sp.from){
    const f=sp.from; res.win=res.found>f.f||(res.found===f.f&&ms<f.t);
    if(res.win) P.wins++;
  }
  _finish(cleared);                                   // 최고 기록 갱신 + 저장
  // 오늘의 문제·특집처럼 문제가 정해진 짧은 라운드는 전체 라운드 기록과 섞이지 않게 최고 기록에서 뺀다
  // (플레이 횟수·연속 공부·업적에는 그대로 반영)
  if(sp&&sp.codes){ if(prev) P.best[key]=prev; else delete P.best[key]; renderBestStrip(); }
  const now=P.best[key]; res.newBest=!!(now&&prev&&now.at!==prev.at);
  res.fresh=checkAch();
  persist();
  LAST=res;
  setTimeout(()=>showResult(res), cleared?1300:450);
};

/* ---------- 시작 화면 ---------- */
function renderStart(){
  const box=$("gstart"); if(!box) return; ensure();
  const st=streakNow(), doneToday=P.days.includes(ymd());
  let html=`<div class="gstreak">`+(st>0
      ?(doneToday?`🔥 <b>${st}</b>일째 연속 공부. 오늘 몫 완료 ✓`:`🔥 <b>${st}</b>일째 연속 공부 중. 오늘 한 판이면 ${st+1}일째`)
      :`📅 오늘 첫 판을 시작해 보세요`)+`</div>`;
  if(SPECIAL){
    let sub=SPECIAL.sub||"";
    if(SPECIAL.type==="daily") sub=`모두에게 같은 ${ROUND}문제 · ${esc(DATASETS[CURRENT].label)} · ${esc(modeName(mk()))}`;
    if(SPECIAL.type==="challenge"&&SPECIAL.from){ const f=SPECIAL.from; sub=`이길 기록 ${fmt(f.t)} (${f.f}/${f.r}). 문제 순서도 똑같아요`; }
    html+=`<div class="gbanner"><div>${esc(SPECIAL.title)}<span class="gsub">${esc(sub)}</span></div><button type="button" data-g="exit">✕ 일반 모드</button></div>`;
  } else {
    const done=!!P.daily[dailyKey()], s=seasonNow(), canSeason=s&&seasonTarget(s);
    html+=`<div class="gbtns"><button type="button" class="gbtn${done?" done":""}" data-g="daily">📅 오늘의 문제 <small>${done?"완료 ✓":DAILY_N+"문제"}</small></button>`+
          (canSeason?`<button type="button" class="gbtn" data-g="season">${s.emoji} ${s.m}월 특집 <small>${esc(s.title)}</small></button>`:"")+`</div>`;
  }
  box.innerHTML=html;
}

/* ---------- 결과 창 ---------- */
function shareURL(res){ return SITE+PAGE_FILE+(res&&res.special&&res.special.type==="daily"?"?daily=1&ds="+res.ds:""); }
function challengeURL(res){
  const o={v:1,ds:res.ds,m:res.mode,d:res.dir,s:res.seed,n:P.name||"",t:res.ms,f:res.found,r:res.round};
  if(res.special&&res.special.codes) o.k=res.special.codes.join(",");
  return SITE+PAGE_FILE+"?c="+b64e(JSON.stringify(o));
}
function shareText(res){
  const d=DATASETS[res.ds], L=[];
  if(res.special&&res.special.type==="daily") L.push("GEO ARCADE 📅 "+monthDay()+" 오늘의 문제");
  else if(res.special&&res.special.type==="season") L.push("GEO ARCADE "+res.special.title);
  else L.push("GEO ARCADE 🕹️");
  L.push(d.icon+" "+d.brand+" · "+modeName(res.mk));
  L.push(res.grid?res.grid+"  ⏱ "+fmt(res.ms):"⏱ "+fmt(res.ms)+" · ✅ "+res.found+"/"+res.round);
  const st=streakNow(); if(st>=2) L.push("🔥 "+st+"일 연속 공부 중");
  L.push(shareURL(res));
  return L.join("\n");
}
function acc(res){ const t=res.live.correct+res.live.wrong; return t?Math.round(res.live.correct/t*100):0; }
function showResult(res){
  let w=$("gresult");
  if(!w){ w=document.createElement("div"); w.id="gresult"; w.className="gwrap"; document.body.appendChild(w);
    w.addEventListener("click",e=>{ if(e.target===w) closeResult(); const b=e.target.closest("[data-a]"); if(b) act(b.dataset.a); }); }
  const d=DATASETS[res.ds], sp=res.special;
  const title=res.cleared?"🎉 CLEAR!":"🏁 ROUND OVER";
  let body=`<div class="gmeta">${d.icon} ${esc(d.brand)} · ${esc(modeName(res.mk))}${sp&&sp.type!=="challenge"?"<br>"+esc(sp.title):""}</div>`+
    `<div class="gbig">${fmt(res.ms)}</div>`+
    `<div class="gstats"><span>✅ ${res.found}/${res.round}</span><span>🎯 정답률 ${acc(res)}%</span><span>🔥 최고 연속 ${res.live.peak}</span></div>`;
  if(res.grid) body+=`<div class="ggrid" aria-label="문제별 결과">${res.grid}</div>`;
  if(sp&&sp.type==="challenge"&&sp.from){ const f=sp.from;
    body+=`<div class="gvs ${res.win?"win":"lose"}">⚔️ ${esc(f.n)} ${fmt(f.t)} (${f.f}/${f.r}) → ${res.win?"승리! 🎉":"아쉬워요, 다시 도전!"}</div>`; }
  if(res.newBest) body+=`<div class="gnew">NEW RECORD!</div>`;
  const st=streakNow(); if(st>0) body+=`<div class="gstk">🔥 ${st}일 연속 공부 중</div>`;
  if(res.fresh.length) body+=`<div class="gachnew">${res.fresh.map(a=>`<div><span>${a.i}</span>새 업적: ${esc(a.n)}</div>`).join("")}</div>`;
  if(!P.name) body+=`<label class="gname">도전장에 표시할 이름 <input id="gname" maxlength="12" placeholder="이름" autocomplete="off"></label>`;
  w.innerHTML=`<div class="gbox" role="dialog" aria-modal="true" aria-label="라운드 결과"><div class="ghead"><h2>${title}</h2><button type="button" class="btn" data-a="close" aria-label="닫기">✕</button></div>`+
    `<div class="gbody">${body}</div>`+
    `<div class="gact"><button type="button" class="primary" data-a="share">📤 결과 공유</button><button type="button" data-a="image">🖼️ 이미지 저장</button>`+
    `<button type="button" data-a="challenge">⚔️ 도전장 보내기</button><button type="button" data-a="again">🔁 다시 하기</button></div>`+
    `<div class="gnote" id="gnote" aria-live="polite"></div></div>`;
  const ni=$("gname");
  if(ni) ni.addEventListener("input",()=>{ P.name=ni.value.trim(); $("pname").value=P.name; persist(); });
  w.classList.add("open");
  announce(res.fresh);
  const first=w.querySelector('[data-a="share"]'); if(first) first.focus();
}
function closeResult(){ const w=$("gresult"); if(w) w.classList.remove("open"); }
document.addEventListener("keydown",e=>{ if(e.key==="Escape"&&$("gresult")&&$("gresult").classList.contains("open")) closeResult(); });

function note(html){ const n=$("gnote"); if(n) n.innerHTML=html; }
function counted(){ ensure(); P.shares++; const f=checkAch(); persist(); announce(f); }
async function shareOrCopy(text,label){
  try{ if(navigator.share){ await navigator.share({text}); counted(); note(label+" 공유 창을 열었어요."); return; } }
  catch(e){ if(e&&e.name==="AbortError") return; }
  try{ await navigator.clipboard.writeText(text); counted(); note("📋 복사했어요. 카톡이나 DM에 붙여넣으면 돼요."); return; }catch(e){}
  note(`아래 내용을 길게 눌러 복사하세요.<textarea readonly>${esc(text)}</textarea>`);
  const ta=document.querySelector("#gnote textarea"); if(ta){ ta.focus(); ta.select(); }
  counted();
}
async function act(a){
  const res=LAST; if(!res&&a!=="close") return;
  if(a==="close") return closeResult();
  if(a==="again"){ closeResult(); resetGame(); return; }
  if(a==="share") return shareOrCopy(shareText(res),"📤");
  if(a==="challenge"){
    const who=P.name||"친구";
    const text=`⚔️ ${who}의 도전장! GEO ARCADE ${DATASETS[res.ds].brand} · ${modeName(res.mk)}\n`+
               `기록 ${fmt(res.ms)} (${res.found}/${res.round}). 같은 문제를 같은 순서로 풀어서 이겨 봐!\n`+challengeURL(res);
    return shareOrCopy(text,"⚔️");
  }
  if(a==="image") return saveImage(res);
}

/* ---------- 결과 이미지 (1080×1350) ---------- */
async function drawCard(res){
  const W=1080,H=1350,c=document.createElement("canvas"); c.width=W; c.height=H;
  const g=c.getContext("2d"), d=DATASETS[res.ds];
  try{ await Promise.all([document.fonts.load('60px "Press Start 2P"'),document.fonts.load('900 40px "Noto Sans KR"'),document.fonts.load('700 30px "Noto Sans KR"')]); }catch(e){}
  const bg=g.createLinearGradient(0,0,0,H); bg.addColorStop(0,"#120a2e"); bg.addColorStop(.55,"#2a0f4e"); bg.addColorStop(1,"#5b1670");
  g.fillStyle=bg; g.fillRect(0,0,W,H);
  // 픽셀 태양
  const sy=880, sr=250, sun=g.createLinearGradient(0,sy-sr,0,sy+sr); sun.addColorStop(0,"#ffe14d"); sun.addColorStop(.6,"#ff6ec7"); sun.addColorStop(1,"#ff2e93");
  g.save(); g.beginPath(); g.arc(W/2,sy,sr,0,Math.PI*2); g.clip(); g.fillStyle=sun; g.globalAlpha=.35;
  for(let y=sy-sr;y<sy+sr;y+=26){ g.fillRect(W/2-sr,y,sr*2,17); } g.restore();
  // 그리드 바닥
  g.strokeStyle="rgba(255,46,147,.35)"; g.lineWidth=2;
  for(let i=0;i<14;i++){ const y=1080+i*i*2.2; g.beginPath(); g.moveTo(0,y); g.lineTo(W,y); g.stroke(); }
  for(let i=-12;i<=12;i++){ g.beginPath(); g.moveTo(W/2+i*40,1080); g.lineTo(W/2+i*190,H); g.stroke(); }
  // 스캔라인
  g.fillStyle="rgba(0,0,0,.18)"; for(let y=0;y<H;y+=4) g.fillRect(0,y,W,1);
  const px='"Press Start 2P","Noto Sans KR",monospace', kr='"Noto Sans KR",sans-serif';
  g.textAlign="center"; g.textBaseline="alphabetic";
  const shadowText=(t,x,y,font,col,sh,off)=>{ g.font=font; g.fillStyle=sh; g.fillText(t,x+off,y+off); g.fillStyle=col; g.fillText(t,x,y); };
  shadowText("GEO ARCADE",W/2,150,"60px "+px,"#ffe14d","#ff2e93",6);
  g.font="700 34px "+kr; g.fillStyle="#ffd6f0";
  g.fillText(res.special&&res.special.type==="daily"?"📅 "+monthDay()+" 오늘의 문제":res.special&&res.special.type==="season"?res.special.title:"지리 메모리",W/2,225);
  g.font="900 46px "+kr; g.fillStyle="#fff"; g.fillText(d.icon+" "+d.brand,W/2,330);
  g.font="700 32px "+kr; g.fillStyle="#9fe8ff"; g.fillText(modeName(res.mk),W/2,382);
  shadowText(fmt(res.ms),W/2,540,"110px "+px,"#59ffd0","rgba(0,0,0,.55)",7);
  g.font="900 44px "+kr; g.fillStyle="#fff"; g.fillText("✅ "+res.found+" / "+res.round+"   🎯 "+acc(res)+"%",W/2,640);
  if(res.grid){ g.font="72px "+kr; g.fillText(res.grid,W/2,760); }
  else { g.font="700 36px "+kr; g.fillStyle="#ffd6f0"; g.fillText("🔥 최고 연속 "+res.live.peak+"문제",W/2,740); }
  const st=streakNow(); if(st>0){ g.font="900 40px "+kr; g.fillStyle="#ffe14d"; g.fillText("🔥 "+st+"일 연속 공부 중",W/2,850); }
  if(P.name){ g.font="700 34px "+kr; g.fillStyle="#fff"; g.fillText("PLAYER · "+P.name,W/2,930); }
  g.font="700 30px "+kr; g.fillStyle="rgba(255,255,255,.85)"; g.fillText("snowater121.github.io/for-my-cat",W/2,H-80);
  g.font="700 24px "+kr; g.fillStyle="rgba(255,255,255,.6)"; g.fillText("제작자 @konomiwosawagou",W/2,H-38);
  return new Promise(r=>c.toBlob(r,"image/png"));
}
async function saveImage(res){
  note("🖼️ 이미지를 만드는 중…");
  let blob=null; try{ blob=await drawCard(res); }catch(e){}
  if(!blob){ note("이 브라우저에서는 이미지를 만들 수 없어요."); return; }
  const name="geo-arcade-"+ymd()+".png";
  // Artifact 안에서는 downloads 기능으로 저장한다
  try{ const dl=window.claude&&typeof window.claude.use==="function"?await window.claude.use("downloads"):null;
       if(dl){ await dl.save({filename:name,data:blob}); note("🖼️ 저장했어요."); counted(); return; } }
  catch(e){ if(e&&e.code==="declined"){ note("저장을 취소했어요."); return; } }
  try{ const file=new File([blob],name,{type:"image/png"});
       if(navigator.canShare&&navigator.canShare({files:[file]})){ await navigator.share({files:[file],text:shareText(res)}); note("🖼️ 공유 창을 열었어요. 인스타 스토리에도 올릴 수 있어요."); counted(); return; } }
  catch(e){ if(e&&e.name==="AbortError") return; }
  const a=document.createElement("a"); a.href=URL.createObjectURL(blob); a.download=name; document.body.appendChild(a); a.click();
  setTimeout(()=>{ URL.revokeObjectURL(a.href); a.remove(); },1500);
  note("🖼️ 이미지를 내려받았어요."); counted();
}

/* ---------- 기록 패널: 업적 탭 + 연속 공부 통계 ---------- */
function renderAch(){
  const el=$("pane-ach"); if(!el) return; ensure();
  const got=ACH.filter(a=>P.ach[a.id]).length;
  el.innerHTML=`<div class="gachhead">${got} / ${ACH.length} 달성</div><div class="gachs">`+
    ACH.map(a=>`<div class="gach${P.ach[a.id]?" on":""}"><span class="i">${a.i}</span><div><b>${esc(a.n)}</b><small>${esc(a.d)}</small></div></div>`).join("")+`</div>`;
}
const _rs=renderStat;
renderStat=function(){
  _rs(); ensure();
  const grid=document.querySelector("#pane-stat .recgrid"); if(!grid) return;
  grid.insertAdjacentHTML("beforeend",
    `<div class="reccard"><div class="k">📅 지금 연속</div><div class="n">${streakNow()}일</div></div>`+
    `<div class="reccard"><div class="k">🗓️ 최장 연속</div><div class="n">${bestDays()}일</div></div>`+
    `<div class="reccard"><div class="k">공부한 날</div><div class="n">${P.days.length}일</div></div>`);
};
const _rr=renderRecords;
renderRecords=function(){ _rr(); renderAch(); };

/* ---------- 초기화 ---------- */
function init(){
  ensure();
  const tabs=document.querySelector(".rectabs"), body=document.querySelector(".recbody");
  tabs.insertAdjacentHTML("beforeend",'<button data-t="ach">업적</button>');
  body.insertAdjacentHTML("beforeend",'<div class="recpane" id="pane-ach"></div>');
  tabs.addEventListener("click",e=>{ const b=e.target.closest("button"); if(!b) return; $("pane-ach").classList.toggle("on",b.dataset.t==="ach"); });
  const ss=$("startscreen"), box=document.createElement("div");
  box.id="gstart"; box.className="gstart"; ss.appendChild(box);
  box.addEventListener("click",e=>{
    const b=e.target.closest("[data-g]"); if(!b) return;
    if(soundOn){AC();tone(784,0.05,"square",0.05);}
    if(b.dataset.g==="daily") startDaily();
    else if(b.dataset.g==="season"){ const s=seasonNow(); if(s) startSeason(s.m); }
    else if(b.dataset.g==="exit") exitSpecial();
  });
  // 링크로 들어온 경우: ?c=도전장  ?season=월  ?daily=1  ?ds=데이터셋
  let q; try{ q=new URLSearchParams(location.search); }catch(e){ q=new URLSearchParams(""); }
  try{
    if(q.get("c")) applyChallenge(JSON.parse(b64d(q.get("c"))));
    else if(q.get("season")) startSeason(+q.get("season"));
    else {
      if(q.get("ds")&&DATASETS[q.get("ds")]&&q.get("ds")!==CURRENT) switchDs(q.get("ds"));
      if(q.get("daily")) startDaily();
    }
  }catch(e){}
  // 첫 라운드는 이 코드가 붙기 전에 만들어져 시드가 없다 → 다시 준비해야 도전장이 같은 순서를 재현한다
  if(!SPECIAL) resetGame();
  renderStart(); renderAch();
  const f=checkAch(); if(f.length){ persist(); }      // 예전 기록으로 이미 달성한 업적은 조용히 채운다
}
init();
return {startDaily,startSeason,exitSpecial,streakNow,bestDays};
})();
