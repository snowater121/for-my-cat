/* =======================================================================
   DEMO — 소개 영상용 자동 시연 (?demo=1 일 때만 움직인다)

   맥 화면 녹화(⌘⇧5)를 켜 두고 ▶ 를 누르면 끝까지 저절로 흘러간다.
     로비 → 지도 타이핑 (타이핑·연속 정답·완주) → 결과와 역 스탬프 → 1:1 대결
   평소에는 아무 일도 하지 않는다(맨 위에서 바로 빠져나간다).
   ======================================================================= */
(function(){
let Q; try{ Q=new URLSearchParams(location.search); }catch(e){ Q=new URLSearchParams(""); }
if(Q.get("demo")!=="1") return;

const wait=ms=>new Promise(r=>setTimeout(r,ms));
const $=id=>document.getElementById(id);
function cat(){ try{ return MAS.stage; }catch(e){ return null; } }

/* 눌렀다는 걸 눈에 보이게 — 가짜 커서 대신 대상이 한 번 튄다 */
function press(el){
  if(!el) return;
  el.classList.add("demopress");
  setTimeout(()=>el.classList.remove("demopress"),420);
  el.click();
}
/* 한 글자씩 찍는다 (게임의 입력 처리와 타자 소리를 그대로 지나간다) */
async function type(text,per){
  const inp=$("answer"); if(!inp) return;
  inp.focus(); inp.value="";
  for(const ch of text){
    inp.value+=ch;
    inp.dispatchEvent(new Event("input",{bubbles:true}));
    await wait(per||70);
  }
  await wait(120);
  inp.dispatchEvent(new KeyboardEvent("keydown",{key:"Enter",bubbles:true}));
}

/* 다음 문제가 실제로 뜰 때까지 기다린다.
   게임은 정답 뒤 650ms 있다가 다음 문제로 넘어가고, 대결은 카운트다운이 끝나야 첫 문제가 난다.
   기다리지 않고 바로 치면 이전 이름을 다시 쳐서 오답이 나거나, 문제가 없는 사이에 끝나 버린다. */
async function waitTarget(prev,ms,allowOver){
  /* allowOver: 앞 라운드가 끝난 직후라 over 가 아직 true 다. 새 라운드가 시작되면
     resetGame 이 풀어 주므로, 첫 문제를 기다릴 때는 over 를 보지 않는다. */
  const t0=Date.now();
  while(Date.now()-t0<(ms||9000)){
    if(!allowOver&&typeof over!=="undefined"&&over) return null;
    if(typeof target!=="undefined"&&target&&target!==prev) return target;
    await wait(90);
  }
  return null;
}
async function answerAll(n,per){
  let last=null;
  for(let i=0;i<n;i++){
    const t=await waitTarget(last,9000);
    if(!t) break;
    last=t;
    await wait(220);
    await type(DATA[t].ko,per);
    await wait(260);
  }
}

/* ---------- 시작 덮개 ---------- */
function overlay(){
  const o=document.createElement("div");
  o.className="demoveil";
  o.innerHTML='<div class="demobox"><b>시연 준비됨</b>'+
    '<small>맥 화면 녹화(⌘⇧5)를 켠 뒤 눌러 주세요</small>'+
    '<button type="button" id="demogo">▶ 시연 시작</button>'+
    '<em>Space 로도 시작</em></div>';
  document.body.appendChild(o);
  return o;
}
function done(){
  const o=document.createElement("div");
  o.className="demoveil end";
  o.innerHTML='<div class="demobox"><b>시연 끝</b>'+
    '<button type="button" onclick="location.reload()">↻ 다시 보기</button></div>';
  document.body.appendChild(o);
}

/* ---------- 1) 지도 타이핑 ---------- */
async function playRound(n){
  /* 짧게 보여 주려고 문제 수를 줄인다 (기록에는 남지 않도록 라운드만 자른다) */
  if(typeof queue!=="undefined"&&queue.length>n){
    queue=queue.slice(0,n); ROUND=n; updateStats();
    $("qnum").textContent=`1번째 / ${n}`;
  }
  press($("startbtn"));
  await answerAll(n,72);
}

/* ---------- 2) 1:1 대결 ----------
   상대는 같은 방에 직접 써 넣어 만든다. 혼자서도 대결 장면을 찍을 수 있다. */
async function playVersus(){
  if(!(window.VS&&VS.on())) return;
  const url=p=>DBURL.replace(/\/$/,"")+p+".json";
  const put=(p,v)=>fetch(url(p),{method:"PUT",body:JSON.stringify(v)}).catch(()=>{});
  const patch=(p,v)=>fetch(url(p),{method:"PATCH",body:JSON.stringify(v)}).catch(()=>{});

  const code=await VS.create(5);
  if(!code) return;
  await wait(1400);
  const foe="DEMOFOE01";
  await put("/rooms/"+code+"/p/"+foe,{name:"리사",ready:false,found:0,round:5,done:false,at:Date.now()});
  await wait(1100);
  await patch("/rooms/"+code+"/p/"+foe,{ready:true,at:Date.now()});
  await wait(700);
  press(document.querySelector('[data-v="ready"]'));

  /* 첫 문제가 뜰 때까지 기다렸다가, 그때부터 상대도 하나씩 맞히게 한다 (쫓고 쫓기는 그림) */
  const first=await waitTarget(null,14000,true);
  if(!first) return;
  [300,1400,2600,3800].forEach((t,i)=>
    setTimeout(()=>patch("/rooms/"+code+"/p/"+foe,{found:i+1,round:5,at:Date.now()}),t));

  await wait(220);
  await type(DATA[first].ko,58);
  await wait(260);
  await answerAll(4,58);
  await patch("/rooms/"+code+"/p/"+foe,{done:true,found:4,ms:99000,grid:"🟩🟩🟩🟩🟥",at:Date.now()});
  await wait(3400);
  fetch(url("/rooms/"+code),{method:"DELETE"}).catch(()=>{});   // 찍고 나면 방을 치운다
}

/* ---------- 전체 흐름 ---------- */
let DBURL="";
async function run(veil){
  veil.remove();
  document.body.classList.add("demorun");
  try{ DBURL=(window.VS&&VS.on())?VS.dbUrl():""; }catch(e){}
  const c=cat(); if(c) c.say("같이 외워 볼까? 🐾",2600);

  await wait(700);
  await playRound(5);
  await wait(3600);                        // 결과 창 + 역 스탬프
  const close=document.querySelector('#gresult [data-a="close"]'); press(close);
  await wait(900);

  await playVersus();
  await wait(1200);
  document.body.classList.remove("demorun");
  done();
}

function boot(){
  /* 로비에서 이어 온 경우(&go=1)는 덮개 없이 바로 이어 간다 — 영상 중간에 덮개가 또 뜨면 안 된다 */
  if(Q.get("go")==="1"){
    const v=document.createElement("div");      // 넘어오는 순간만 살짝 가린다
    v.className="demoveil blank";
    document.body.appendChild(v);
    setTimeout(()=>run(v),420);
    return;
  }
  const veil=overlay();
  const go=()=>{ document.removeEventListener("keydown",key); run(veil); };
  const key=e=>{ if(e.code==="Space"){ e.preventDefault(); go(); } };
  $("demogo").addEventListener("click",go);
  document.addEventListener("keydown",key);
}
if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",boot);
else boot();
})();
