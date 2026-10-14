/* =======================================================================
   AUTH — 계정으로 기록 남기기 (growth.js · resume.js 뒤에 붙는다)

   Firebase Authentication(이메일+비밀번호)을 **SDK 없이** REST로만 쓴다.
     가입/로그인  https://identitytoolkit.googleapis.com/v1/accounts:signUp|signInWithPassword
     토큰 갱신    https://securetoken.googleapis.com/v1/token          (idToken 은 1시간짜리)
     비밀번호     accounts:sendOobCode (재설정 메일) · accounts:update (바꾸기)
   versus.js 와 같은 이유로 SDK를 넣지 않는다 — "단일 HTML 한 장" 원칙.

   기록 보관함:  <RTDB>/users/{uid}  =  { p: 기록(P), r: 이어하기 저장본, at: 올린 시각 }
   보안 규칙이 auth.uid 로 잠가 두어서 남의 칸은 읽지도 쓰지도 못한다 (db-rules.json).

   합치기(merge): 두 기기에서 따로 논 기록이 만났을 때
     최고 기록  더 좋은 쪽            자주 틀린 곳  더 많이 틀린 쪽
     누적 통계  더 큰 쪽              공부한 날     둘을 합집합
     업적       먼저 딴 날짜          오늘의 문제   둘을 합집합
   합이 아니라 '큰 쪽'을 쓰는 이유: 동기화가 오갈 때마다 같은 판이 두 번 세어지면 안 된다.

   auth.json 의 apiKey 가 비어 있으면 이 기능 전체가 조용히 꺼진다.
   ======================================================================= */
const AUTH=(function(){
const CFG=__AUTH__;                       // {apiKey:"", url:""}
const KEY="geoarcade.auth.v1";            // {uid,email,refreshToken}
const IDP="https://identitytoolkit.googleapis.com/v1/accounts:";
const TOK="https://securetoken.googleapis.com/v1/token";

function on(){ return !!(CFG&&CFG.apiKey&&CFG.url); }
function $(id){ return document.getElementById(id); }
function dbRoot(){ return String(CFG.url||"").replace(/\/$/,""); }

let user=null;        // {uid,email,refreshToken,idToken,expAt}
let busy=false, lastSync=0, pushTimer=0, lastEmail="";

/* ---------- 저장해 둔 로그인 ---------- */
function remember(){
  try{ user?localStorage.setItem(KEY,JSON.stringify({uid:user.uid,email:user.email,refreshToken:user.refreshToken}))
           :localStorage.removeItem(KEY); }catch(e){}
}
function recall(){ try{ return JSON.parse(localStorage.getItem(KEY)||"null"); }catch(e){ return null; } }

/* ---------- Firebase REST ---------- */
const MSG={
  EMAIL_EXISTS:"이미 가입된 이메일이에요. 로그인해 주세요.",
  EMAIL_NOT_FOUND:"가입되지 않은 이메일이에요.",
  INVALID_PASSWORD:"비밀번호가 맞지 않아요.",
  INVALID_LOGIN_CREDENTIALS:"이메일이나 비밀번호가 맞지 않아요.",
  INVALID_EMAIL:"이메일 형식을 다시 확인해 주세요.",
  MISSING_PASSWORD:"비밀번호를 입력해 주세요.",
  USER_DISABLED:"사용이 중지된 계정이에요.",
  TOO_MANY_ATTEMPTS_TRY_LATER:"잠시 뒤에 다시 시도해 주세요.",
  OPERATION_NOT_ALLOWED:"콘솔에서 '이메일/비밀번호' 로그인을 켜 주세요.",
  TOKEN_EXPIRED:"로그인이 만료됐어요. 다시 로그인해 주세요.",
  USER_NOT_FOUND:"로그인이 만료됐어요. 다시 로그인해 주세요."
};
function human(code){
  const k=String(code||"").split(":")[0].trim();
  if(MSG[k]) return MSG[k];
  if(/^WEAK_PASSWORD/.test(k)) return "비밀번호는 6자 이상이어야 해요.";
  return "잘 안 됐어요 ("+k+")";
}
async function idp(method,body){
  const r=await fetch(IDP+method+"?key="+encodeURIComponent(CFG.apiKey),
    {method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
  const j=await r.json().catch(()=>({}));
  if(!r.ok) throw new Error((j.error&&j.error.message)||"UNKNOWN");
  return j;
}
/* idToken 은 1시간이면 끝난다 — 쓸 때마다 남은 시간을 보고 알아서 바꿔 낀다 */
async function token(){
  if(!user) return null;
  if(user.idToken&&Date.now()<user.expAt-60000) return user.idToken;
  const r=await fetch(TOK+"?key="+encodeURIComponent(CFG.apiKey),
    {method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded"},
     body:"grant_type=refresh_token&refresh_token="+encodeURIComponent(user.refreshToken)});
  const j=await r.json().catch(()=>({}));
  if(!r.ok){
    const code=(j.error&&(j.error.message||j.error))||"TOKEN_EXPIRED";
    signOut(); throw new Error(typeof code==="string"?code:"TOKEN_EXPIRED");
  }
  user.idToken=j.id_token; user.refreshToken=j.refresh_token||user.refreshToken;
  user.expAt=Date.now()+(+j.expires_in||3600)*1000;
  remember();
  return user.idToken;
}
function adopt(j){
  user={uid:j.localId,email:j.email,refreshToken:j.refreshToken,
        idToken:j.idToken,expAt:Date.now()+(+j.expiresIn||3600)*1000};
  remember();
}

/* ---------- 기록 보관함 ---------- */
async function pull(){
  const t=await token(); if(!t) return null;
  const r=await fetch(dbRoot()+"/users/"+user.uid+".json?auth="+encodeURIComponent(t));
  if(!r.ok) throw new Error("읽기 실패 ("+r.status+")");
  return await r.json();
}
async function push(){
  const t=await token(); if(!t) return;
  let resume=null; try{ resume=(window.RESUME&&RESUME.get())||null; }catch(e){}
  const body={p:P,r:resume,at:Date.now()};
  const r=await fetch(dbRoot()+"/users/"+user.uid+".json?auth="+encodeURIComponent(t),
    {method:"PUT",body:JSON.stringify(body)});
  if(!r.ok) throw new Error("쓰기 실패 ("+r.status+")");
  lastSync=Date.now(); paintChrome();
}

/* ---------- 합치기 ---------- */
function better(a,b){
  if(!a) return b; if(!b) return a;
  if((a.found||0)!==(b.found||0)) return (a.found||0)>(b.found||0)?a:b;
  return (a.ms||0)<=(b.ms||0)?a:b;
}
function merge(L,R){
  if(!R||!R.stats) return L;
  if(!L||!L.stats) return R;
  const o=JSON.parse(JSON.stringify(L));
  o.name=L.name||R.name||"";

  o.best=Object.assign({},R.best||{});
  for(const k in (L.best||{})) o.best[k]=better(L.best[k],(R.best||{})[k]);

  o.misses=Object.assign({},R.misses||{});
  for(const k in (L.misses||{})) o.misses[k]=Math.max(L.misses[k]||0,(R.misses||{})[k]||0);

  o.stats={};
  for(const k of ["plays","clears","totalMs","correct","wrong","bestStreak"])
    o.stats[k]=Math.max((L.stats||{})[k]||0,(R.stats||{})[k]||0);

  o.days=[...new Set([].concat(L.days||[],R.days||[]))].sort().slice(-400);

  o.ach=Object.assign({},R.ach||{});
  for(const k in (L.ach||{})){
    const a=L.ach[k]||0, b=(R.ach||{})[k]||0;
    o.ach[k]=(a&&b)?Math.min(a,b):(a||b);        // 먼저 딴 날짜를 남긴다
  }

  o.daily=Object.assign({},R.daily||{},L.daily||{});
  const dk=Object.keys(o.daily).sort();
  if(dk.length>90) dk.slice(0,dk.length-90).forEach(k=>delete o.daily[k]);

  o.shares=Math.max(L.shares||0,R.shares||0);
  o.wins=Math.max(L.wins||0,R.wins||0);

  o.pick=Object.assign({},R.pick||{},L.pick||{});   // 문제 고르기는 이 기기 설정이 우선
  o.at=Date.now();
  return o;
}

/* 받아온 것과 합쳐서 화면까지 다시 그린다 */
function absorb(remote){
  if(!remote) return false;
  let changed=false;
  if(remote.p&&remote.p.stats){
    P=merge(P,remote.p);
    try{ if(window.GROW) GROW.ensure(); }catch(e){}
    lsSave(); renderRecords(); renderBestStrip();
    const pn=$("pname"); if(pn) pn.value=P.name||"";
    try{ if(window.PICK) PICK.paintChips(); }catch(e){}
    try{ if(window.GROW) GROW.renderStart(); }catch(e){}
    changed=true;
  }
  if(remote.r){ try{ if(window.RESUME) RESUME.put(remote.r); }catch(e){} }
  return changed;
}

/* ---------- 바깥에서 부르는 것 ---------- */
async function sync(){
  if(!user||busy) return;
  setBusy(true);
  try{
    absorb(await pull());
    await push();
    setBusy(false); note("✅ 기록을 맞췄어요.");
  }catch(e){ setBusy(false); note("⚠️ "+human(e.message)); }
  paintChrome();
}
/* persist() 가 불릴 때마다 — 한 박자 묶어서 올린다 */
function touch(){
  if(!user) return;
  clearTimeout(pushTimer);
  pushTimer=setTimeout(()=>{ push().catch(()=>{}); },1500);
}

async function signIn(email,pw,isNew){
  const j=await idp(isNew?"signUp":"signInWithPassword",{email,password:pw,returnSecureToken:true});
  adopt(j);
  absorb(await pull());          // 저쪽 기록을 먼저 가져와 합치고
  await push();                  // 합친 결과를 올려 둔다
}
function signOut(){
  if(user&&user.email) lastEmail=user.email;
  user=null; clearTimeout(pushTimer); remember(); paint();
}
async function resetMail(email){
  await idp("sendOobCode",{requestType:"PASSWORD_RESET",email});
}
async function changePw(pw){
  const t=await token(); if(!t) throw new Error("TOKEN_EXPIRED");
  const j=await idp("update",{idToken:t,password:pw,returnSecureToken:true});
  if(j.idToken){ user.idToken=j.idToken; user.expAt=Date.now()+(+j.expiresIn||3600)*1000; }
  if(j.refreshToken){ user.refreshToken=j.refreshToken; }
  remember();
}

/* ---------- 창 ---------- */
function esc2(s){ return String(s==null?"":s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c])); }
function note(html){ const n=$("aunote"); if(n) n.innerHTML=html; }
function wrap(){
  let w=$("auwrap");
  if(w) return w;
  w=document.createElement("div"); w.id="auwrap"; w.className="auwrap";
  document.body.appendChild(w);
  w.addEventListener("click",e=>{
    if(e.target===w) return close();
    const b=e.target.closest("[data-a]"); if(b) act(b.dataset.a);
  });
  w.addEventListener("keydown",e=>{ if(e.key==="Enter"&&e.target.tagName==="INPUT"){ e.preventDefault(); act(user?"pw":"in"); } });
  return w;
}
function open(){ wrap().classList.add("open"); paint(); const f=$("auemail")||$("ausync"); if(f) f.focus(); }
function close(){ const w=$("auwrap"); if(w) w.classList.remove("open"); }

function ago(t){
  if(!t) return "아직";
  const m=Math.round((Date.now()-t)/60000);
  return m<1?"방금":(m<60?m+"분 전":Math.round(m/60)+"시간 전");
}
/* 창을 통째로 다시 그리면 입력하던 이메일·비밀번호가 날아간다.
   그래서 '밖'(상태줄·단추 이름)과 '안'(창 내용)을 나눠 두고, 창은 로그인 상태가
   바뀔 때만 다시 그린다. 기다리는 동안은 단추만 잠근다. */
function setBusy(b){
  busy=b;
  const w=$("auwrap"); if(!w) return;
  w.querySelectorAll(".auact button").forEach(x=>{ x.disabled=b; });
  const sy=$("ausync"); if(sy) sy.textContent=b?"맞추는 중…":"🔄 지금 동기화";
  const inb=w.querySelector('[data-a="in"]'); if(inb) inb.textContent=b?"잠시만요…":"로그인";
  const ago1=w.querySelector(".auok small"); if(ago1&&!b) ago1.textContent="마지막 동기화 "+ago(lastSync);
}
function paint(){ paintChrome(); paintPanel(); }
function paintChrome(){
  /* 기록판 아래 상태줄 */
  const dot=$("syncdot"), msg=$("syncmsg"), btn=$("aubtn");
  if(dot) dot.classList.toggle("on",!!user);
  if(msg&&!DBCONNECTED()) msg.textContent=user
    ? "☁️ "+user.email+" 계정에 기록이 저장돼요"
    : "기록은 이 브라우저에 저장됩니다 · 로그인하면 기기를 옮겨도 남아요";
  if(btn) btn.textContent=user?"👤 계정":"🔑 로그인";
  const row=$("aurowbtn"); if(row) row.textContent=user?"열기":"로그인";
  const ago2=document.querySelector("#auwrap .auok small");
  if(ago2) ago2.textContent="마지막 동기화 "+ago(lastSync);
}
function paintPanel(){
  const w=$("auwrap"); if(!w||!w.classList.contains("open")) return;
  const body=user?`
    <div class="auok">✅ <b>${esc2(user.email)}</b> 로 로그인했어요<small>마지막 동기화 ${ago(lastSync)}</small></div>
    <p class="auhelp">기록·업적·연속 공부·풀던 판이 이 계정에 저장돼요. 다른 기기에서 같은 계정으로 들어가면 그대로 이어서 할 수 있어요.</p>
    <div class="auact">
      <button type="button" class="primary" data-a="sync" id="ausync"${busy?" disabled":""}>${busy?"맞추는 중…":"🔄 지금 동기화"}</button>
      <button type="button" data-a="out">로그아웃</button>
    </div>
    <div class="ausep"></div>
    <label class="aufield">새 비밀번호로 바꾸기<input type="password" id="aupw" autocomplete="new-password" placeholder="6자 이상"></label>
    <div class="auact"><button type="button" data-a="pw">비밀번호 바꾸기</button></div>`
  :`
    <p class="auhelp">이메일과 비밀번호만 있으면 돼요. 기록·업적·연속 공부·<b>풀던 판</b>까지 계정에 저장돼서, 폰에서 하다 끄고 노트북에서 이어서 할 수 있어요.</p>
    <label class="aufield">이메일<input type="email" id="auemail" autocomplete="username" placeholder="you@example.com" spellcheck="false" value="${esc2(lastEmail)}"></label>
    <label class="aufield">비밀번호<input type="password" id="aupw" autocomplete="current-password" placeholder="6자 이상"></label>
    <div class="auact">
      <button type="button" class="primary" data-a="in"${busy?" disabled":""}>${busy?"잠시만요…":"로그인"}</button>
      <button type="button" data-a="up"${busy?" disabled":""}>처음이에요 (가입)</button>
    </div>
    <button type="button" class="aulink" data-a="forgot">비밀번호를 잊었어요</button>`;
  w.innerHTML=`<div class="aubox" role="dialog" aria-modal="true" aria-label="계정">
    <div class="auhead"><h2>👤 계정</h2><button type="button" data-a="close" aria-label="닫기">✕</button></div>
    <div class="aubody">${body}<div class="aunote" id="aunote" aria-live="polite"></div></div></div>`;
}
/* claude 환경의 공유 랭킹판이 붙어 있으면 그쪽 안내문을 건드리지 않는다 */
function DBCONNECTED(){ try{ return !!DB; }catch(e){ return false; } }

async function act(a){
  if(a==="close") return close();
  const em=($("auemail")&&$("auemail").value||"").trim();
  const pw=($("aupw")&&$("aupw").value||"");
  if(em) lastEmail=em;
  if(a==="sync") return sync();
  if(a==="out"){ signOut(); note("로그아웃했어요. 기록은 이 브라우저에도 그대로 남아 있어요."); return; }
  if(a==="forgot"){
    if(!em) return note("이메일을 먼저 입력해 주세요.");
    try{ await resetMail(em); note("📧 비밀번호 재설정 메일을 보냈어요. 메일함(스팸함도)을 확인해 주세요."); }
    catch(e){ note("⚠️ "+human(e.message)); }
    return;
  }
  if(a==="pw"){
    if(pw.length<6) return note("비밀번호는 6자 이상이어야 해요.");
    try{ await changePw(pw); note("✅ 비밀번호를 바꿨어요."); }catch(e){ note("⚠️ "+human(e.message)); }
    return;
  }
  if(a==="in"||a==="up"){
    if(!em) return note("이메일을 입력해 주세요.");
    if(pw.length<6) return note("비밀번호는 6자 이상이어야 해요.");
    setBusy(true);
    try{
      await signIn(em,pw,a==="up");
      busy=false; paint();                       // 로그인 상태가 바뀌었으니 창을 다시 그린다
      note(a==="up"?"🎉 가입했어요. 이제 기록이 계정에 남아요.":"✅ 로그인했어요. 기록을 맞췄어요.");
    }catch(e){
      setBusy(false);                            // 실패했을 땐 적어 둔 걸 그대로 두고 까닭만 알린다
      note("⚠️ "+human(e.message));
    }
  }
}

/* ---------- 붙이기 ---------- */
const api={on,open,close,sync,touch,signOut,user:()=>user&&{uid:user.uid,email:user.email}};
try{ window.AUTH=api; }catch(e){}

function init(){
  if(!on()) return;

  /* 설정(⚙️) 줄 */
  const links=document.querySelector(".setlinks");
  if(links){
    const row=document.createElement("div");
    row.className="settrow";
    row.innerHTML='<span>👤 계정 (기록 이어가기)</span><button class="btn" id="aurowbtn">로그인</button>';
    links.parentNode.insertBefore(row,links);
    $("aurowbtn").addEventListener("click",()=>{
      const s=document.querySelector(".settings"); if(s) s.classList.remove("open");
      open();
    });
  }
  /* 기록판 아래 단추 */
  const foot=document.querySelector(".recfoot");
  if(foot){
    const b=document.createElement("button");
    b.type="button"; b.className="btn aubtn"; b.id="aubtn"; b.textContent="🔑 로그인";
    foot.appendChild(b);
    b.addEventListener("click",open);
  }
  document.addEventListener("keydown",e=>{ if(e.key==="Escape") close(); });

  /* persist() 가 불릴 때마다 계정에도 올린다 */
  if(typeof persist==="function"){
    const _p=persist;
    persist=function(){ _p(); touch(); };
  }

  /* 저장된 로그인으로 조용히 들어간다 */
  const saved=recall();
  if(saved&&saved.refreshToken){
    user={uid:saved.uid,email:saved.email,refreshToken:saved.refreshToken,idToken:null,expAt:0};
    paint();
    pull().then(r=>{ absorb(r); return push(); }).catch(()=>{});
  }
  paint();
}
if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",init);
else init();
return api;
})();
