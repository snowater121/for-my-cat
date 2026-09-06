# -*- coding: utf-8 -*-
import json
data = json.load(open('data.json'))
DATA_JS = json.dumps(data, ensure_ascii=False)

HTML = r'''<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>일본 도도부현 메모리 · Japan Prefecture Metro</title>
<style>
:root{
  --bg:#0f1420; --panel:#171d2b; --panel2:#1e2636; --line:#2b3446;
  --text:#e8edf6; --sub:#8b97ad; --accent:#4dd0e1; --ok:#38d39f; --miss:#ff6b6b;
  --unfound:#26304240;
}
*{box-sizing:border-box}
html,body{margin:0;height:100%}
body{background:var(--bg);color:var(--text);font-family:"Noto Sans KR","Noto Sans JP",-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;display:flex;flex-direction:column;height:100vh;overflow:hidden}
header{display:flex;align-items:center;gap:14px;padding:12px 18px;border-bottom:1px solid var(--line);background:var(--panel);flex-wrap:wrap}
.brand{font-weight:800;font-size:17px;letter-spacing:.3px}
.brand small{color:var(--sub);font-weight:500;margin-left:6px;font-size:12px}
.stats{display:flex;gap:18px;margin-left:auto;align-items:center;flex-wrap:wrap}
.stat{text-align:center;min-width:64px}
.stat .v{font-size:20px;font-weight:800;font-variant-numeric:tabular-nums;line-height:1}
.stat .l{font-size:11px;color:var(--sub);margin-top:3px}
.stat .v.ok{color:var(--ok)}
.seg{display:flex;background:var(--panel2);border:1px solid var(--line);border-radius:9px;overflow:hidden}
.seg button{background:transparent;border:0;color:var(--sub);padding:7px 12px;font-size:13px;font-weight:700;cursor:pointer}
.seg button.on{background:var(--accent);color:#04121a}
.tools{display:flex;gap:8px;align-items:center}
.btn{background:var(--panel2);border:1px solid var(--line);color:var(--text);padding:7px 12px;border-radius:9px;font-size:13px;font-weight:700;cursor:pointer}
.btn:hover{border-color:var(--accent)}
.btn.danger:hover{border-color:var(--miss);color:var(--miss)}
label.chk{display:flex;align-items:center;gap:6px;font-size:12px;color:var(--sub);cursor:pointer;user-select:none}
main{flex:1;display:flex;min-height:0}
.mapwrap{flex:1.6;position:relative;min-width:0;background:radial-gradient(1200px 700px at 60% 30%,#141b2b,#0f1420)}
svg{width:100%;height:100%;display:block}
path.pref{fill:var(--unfound);stroke:#3a465c;stroke-width:.6;stroke-linejoin:round;transition:fill .45s ease}
path.pref.found{stroke:#0b0f18;stroke-width:.5}
path.pref.miss{fill:#3a2130;stroke:#ff6b6b80}
path.pref.pulse{animation:pop .5s ease}
@keyframes pop{0%{filter:brightness(2.2)}100%{filter:brightness(1)}}
text.lbl{fill:#f4f8ff;font-size:8px;font-weight:700;text-anchor:middle;dominant-baseline:middle;paint-order:stroke;stroke:#0b0f18;stroke-width:1.6px;pointer-events:none;opacity:0}
text.lbl.show{opacity:1}
aside{flex:.9;min-width:250px;max-width:340px;border-left:1px solid var(--line);background:var(--panel);overflow-y:auto;padding:12px}
.region{margin-bottom:12px}
.region h3{display:flex;align-items:center;gap:8px;margin:0 0 6px;font-size:13px}
.dot{width:11px;height:11px;border-radius:3px;flex:none}
.region .cnt{margin-left:auto;font-size:12px;color:var(--sub);font-variant-numeric:tabular-nums}
.chips{display:flex;flex-wrap:wrap;gap:5px}
.chip{font-size:12px;padding:3px 8px;border-radius:7px;background:var(--panel2);border:1px solid var(--line);color:var(--sub)}
.chip.got{color:#04121a;font-weight:700}
footer{border-top:1px solid var(--line);background:var(--panel);padding:12px 18px}
.inbar{display:flex;gap:10px;max-width:760px;margin:0 auto;align-items:center}
#answer{flex:1;background:var(--panel2);border:1px solid var(--line);border-radius:12px;color:var(--text);font-size:18px;padding:12px 16px;outline:none;font-weight:700}
#answer:focus{border-color:var(--accent);box-shadow:0 0 0 3px #4dd0e133}
#answer.flash-ok{border-color:var(--ok);box-shadow:0 0 0 3px #38d39f44}
.progress{height:6px;background:var(--panel2);border-radius:99px;overflow:hidden;margin-top:10px;max-width:760px;margin-left:auto;margin-right:auto}
.progress i{display:block;height:100%;width:0;background:linear-gradient(90deg,var(--accent),var(--ok));transition:width .4s ease}
.hint{max-width:760px;margin:8px auto 0;font-size:12px;color:var(--sub);text-align:center;min-height:16px}
.win{color:var(--ok);font-weight:800}
@media(max-width:820px){
  main{flex-direction:column}
  aside{max-width:none;min-width:0;border-left:0;border-top:1px solid var(--line);flex:none;max-height:34vh}
  .mapwrap{flex:none;height:44vh}
}
</style>
</head>
<body>
<header>
  <div class="brand">🗾 일본 도도부현 메모리<small id="modehint">이름을 타이핑하세요</small></div>
  <div class="tools">
    <div class="seg" id="lang">
      <button data-l="ko" class="on">한국어</button>
      <button data-l="ja">日本語</button>
    </div>
    <label class="chk"><input type="checkbox" id="showlbl"> 지도에 이름</label>
    <button class="btn" id="reset">다시하기</button>
    <button class="btn danger" id="giveup">정답 보기</button>
  </div>
  <div class="stats">
    <div class="stat"><div class="v ok" id="count">0<span style="color:var(--sub);font-size:13px">/47</span></div><div class="l">맞힌 개수</div></div>
    <div class="stat"><div class="v" id="timer">0:00</div><div class="l">경과 시간</div></div>
    <div class="stat"><div class="v" id="pct">0%</div><div class="l">진행률</div></div>
  </div>
</header>

<main>
  <div class="mapwrap">
    <svg id="map" viewBox="-40 -5 650 546" preserveAspectRatio="xMidYMid meet"></svg>
  </div>
  <aside id="panel"></aside>
</main>

<footer>
  <div class="inbar">
    <input id="answer" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="예: 도쿄, 오사카, 홋카이도…">
  </div>
  <div class="progress"><i id="bar"></i></div>
  <div class="hint" id="hint">첫 글자를 입력하면 타이머가 시작됩니다.</div>
</footer>

<script>
const DATA = __DATA__;
const REGION_ORDER = ["홋카이도","도호쿠","간토","주부","간사이","주고쿠","시코쿠","규슈·오키나와"];
const REGION_COLOR = {
 "홋카이도":"#4E79A7","도호쿠":"#59A14F","간토":"#E15759","주부":"#F28E2B",
 "간사이":"#B07AA1","주고쿠":"#76B7B2","시코쿠":"#E6B800","규슈·오키나와":"#FF7CA0"
};
const TOTAL = Object.keys(DATA).length;

const norm = s => (s||"").toString().trim().toLowerCase().replace(/[\s・·.\-()]/g,"");
// build lookup: normalized accepted -> code
const LOOKUP = {};
for(const code in DATA){ for(const a of DATA[code].accepted){ LOOKUP[norm(a)] = code; } }

const found = new Set();
let lang = "ko", startedAt = null, timerId = null, over=false;
const centroids = {};

// ---- build SVG ----
const svg = document.getElementById("map");
const SVGNS="http://www.w3.org/2000/svg";
for(const code of Object.keys(DATA)){
  const p = document.createElementNS(SVGNS,"path");
  p.setAttribute("d", DATA[code].d);
  p.setAttribute("class","pref");
  p.dataset.code = code;
  const t = document.createElementNS(SVGNS,"title");
  t.textContent = "?";
  p.appendChild(t);
  svg.appendChild(p);
}
// labels layer on top
const labels = {};
for(const code of Object.keys(DATA)){
  const tx = document.createElementNS(SVGNS,"text");
  tx.setAttribute("class","lbl");
  svg.appendChild(tx);
  labels[code]=tx;
}
// compute centroids after layout
requestAnimationFrame(()=>{
  for(const code of Object.keys(DATA)){
    const path = svg.querySelector(`path[data-code="${code}"]`);
    const b = path.getBBox();
    centroids[code] = [b.x+b.width/2, b.y+b.height/2];
    labels[code].setAttribute("x", centroids[code][0]);
    labels[code].setAttribute("y", centroids[code][1]);
  }
});

// ---- side panel ----
const panel = document.getElementById("panel");
const chipEls = {};
function buildPanel(){
  panel.innerHTML="";
  for(const region of REGION_ORDER){
    const codes = Object.keys(DATA).filter(c=>DATA[c].region===region);
    const wrap=document.createElement("div"); wrap.className="region";
    const h=document.createElement("h3");
    h.innerHTML=`<span class="dot" style="background:${REGION_COLOR[region]}"></span>${region}<span class="cnt" id="cnt-${region}"></span>`;
    wrap.appendChild(h);
    const chips=document.createElement("div"); chips.className="chips";
    for(const c of codes){
      const chip=document.createElement("span"); chip.className="chip"; chip.id="chip-"+c;
      chip.textContent="•••";
      chips.appendChild(chip); chipEls[c]=chip;
    }
    wrap.appendChild(chips); panel.appendChild(wrap);
    updateRegionCount(region);
  }
}
function updateRegionCount(region){
  const codes=Object.keys(DATA).filter(c=>DATA[c].region===region);
  const got=codes.filter(c=>found.has(c)).length;
  const el=document.getElementById("cnt-"+region);
  if(el) el.textContent=`${got}/${codes.length}`;
}
function labelFor(code){ return lang==="ko"?DATA[code].ko:DATA[code].kanji; }

// ---- timer ----
function fmt(ms){const s=Math.floor(ms/1000);return Math.floor(s/60)+":"+String(s%60).padStart(2,"0");}
function startTimer(){ if(timerId)return; startedAt=Date.now();
  timerId=setInterval(()=>{document.getElementById("timer").textContent=fmt(Date.now()-startedAt);},250);
}
function stopTimer(){ clearInterval(timerId); timerId=null; }

// ---- reveal ----
function reveal(code, missMode=false){
  const path=svg.querySelector(`path[data-code="${code}"]`);
  const col=REGION_COLOR[DATA[code].region];
  if(missMode){ path.classList.add("miss"); }
  else{
    path.style.fill=col;
    path.classList.add("found","pulse");
    setTimeout(()=>path.classList.remove("pulse"),500);
  }
  path.querySelector("title").textContent=`${DATA[code].ko} · ${DATA[code].kanji} (${DATA[code].romaji})`;
  const tx=labels[code];
  tx.textContent=labelFor(code);
  if(document.getElementById("showlbl").checked) tx.classList.add("show");
  const chip=chipEls[code];
  chip.textContent=labelFor(code);
  chip.classList.add("got");
  chip.style.background=col;
  chip.style.borderColor=col;
  updateRegionCount(DATA[code].region);
}

function updateStats(){
  document.getElementById("count").innerHTML=`${found.size}<span style="color:var(--sub);font-size:13px">/47</span>`;
  const pct=Math.round(found.size/TOTAL*100);
  document.getElementById("pct").textContent=pct+"%";
  document.getElementById("bar").style.width=pct+"%";
}

// ---- input ----
const input=document.getElementById("answer");
const hint=document.getElementById("hint");
input.addEventListener("input",()=>{
  if(over) return;
  const key=norm(input.value);
  if(!key) return;
  const code=LOOKUP[key];
  if(code && !found.has(code)){
    if(!startedAt) startTimer();
    found.add(code);
    reveal(code);
    updateStats();
    input.value="";
    input.classList.add("flash-ok");
    setTimeout(()=>input.classList.remove("flash-ok"),300);
    hint.textContent=`좋아요! ${DATA[code].ko} (${DATA[code].kanji}) · 남은 개수 ${TOTAL-found.size}`;
    if(found.size===TOTAL) winGame();
  }
});
input.addEventListener("keydown",e=>{ if(e.key==="Enter") input.value=""; });

function winGame(){
  over=true; stopTimer();
  hint.innerHTML=`<span class="win">🎉 완성! 47개 전부 맞혔어요 · 기록 ${fmt(Date.now()-startedAt)}</span>`;
  input.blur();
}

// ---- controls ----
document.getElementById("lang").addEventListener("click",e=>{
  const b=e.target.closest("button"); if(!b) return;
  lang=b.dataset.l;
  [...e.currentTarget.children].forEach(x=>x.classList.toggle("on",x===b));
  document.getElementById("modehint").textContent = lang==="ko"?"한국어로 타이핑":"日本語で入力（漢字・かな・ローマ字）";
  input.placeholder = lang==="ko"?"예: 도쿄, 오사카, 홋카이도…":"例: とうきょう / 東京 / tokyo";
  // relabel found ones
  for(const c of found){ labels[c].textContent=labelFor(c); chipEls[c].textContent=labelFor(c); }
});
document.getElementById("showlbl").addEventListener("change",e=>{
  const on=e.target.checked;
  for(const c of Object.keys(DATA)){
    if(found.has(c)||over) labels[c].classList.toggle("show",on);
  }
});
document.getElementById("giveup").addEventListener("click",()=>{
  if(over){ return; }
  over=true; stopTimer();
  for(const code of Object.keys(DATA)){
    if(!found.has(code)) reveal(code,true);
    labels[code].textContent=labelFor(code);
    if(document.getElementById("showlbl").checked) labels[code].classList.add("show");
    const chip=chipEls[code];
    if(!found.has(code)){ chip.textContent=labelFor(code); chip.style.color="#ff9db0"; }
  }
  // also label missing on map even if showlbl off, lightly
  for(const code of Object.keys(DATA)){ if(!found.has(code)) labels[code].classList.add("show"); }
  hint.innerHTML=`정답을 공개했어요. 맞힌 개수 <b>${found.size}/47</b> · 빨간색이 놓친 곳이에요.`;
});
document.getElementById("reset").addEventListener("click",()=>location.reload());

buildPanel();
updateStats();
input.focus();
</script>
</body>
</html>'''

HTML = HTML.replace("__DATA__", DATA_JS)
open('japan_prefectures_metro.html','w').write(HTML)
print("written", len(HTML), "bytes")
