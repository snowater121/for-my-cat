# -*- coding: utf-8 -*-
"""
build_artifact.py — 일본 + 세계를 한 페이지에 담고 기록/랭킹판을 붙인 Artifact 빌드.

build_html2.py 의 HTML 템플릿을 읽어 문자열 치환으로 변환한다.
출력: ../artifact/geo_arcade.html  (Artifact 본문 — doctype/html/head/body 태그 없음)
"""
import json, re, io, os

src = io.open('build_html2.py', encoding='utf-8').read()
H = re.search(r"HTML = r'''(.*?)'''", src, re.S).group(1)

jp    = json.load(io.open('data.json',  encoding='utf-8'))
eju   = json.load(io.open('eju.json',   encoding='utf-8'))
world = json.load(io.open('world.json', encoding='utf-8'))

DATASETS = {
  "jp": {
    "label": "일본", "icon": "🗾", "brand": "일본 도도부현 메모리",
    "vb": [-40, -5, 650, 546],
    "altLang": "日本語", "altHint": "日本語で入力（漢字・かな・ローマ字）",
    "regionOrder": ["홋카이도","도호쿠","간토","주부","간사이","주고쿠","시코쿠","규슈","오키나와"],
    "regionColor": {"홋카이도":"#4E79A7","도호쿠":"#59A14F","간토":"#E15759","주부":"#F28E2B",
                    "간사이":"#B07AA1","주고쿠":"#76B7B2","시코쿠":"#E6B800","규슈":"#FF7CA0","오키나와":"#00B8D4"},
    "data": jp, "eju": eju,
  },
  "world": {
    "label": "세계", "icon": "🌍", "brand": "세계 국가 이름 메모리",
    "vb": [0, 0, 1010, 666],
    "altLang": "English", "altHint": "영어(English)로 입력",
    "regionOrder": ["아시아","유럽","아프리카","북·중미","남아메리카","오세아니아","기타"],
    "regionColor": {"아시아":"#E15759","유럽":"#4E79A7","아프리카":"#F28E2B","북·중미":"#59A14F",
                    "남아메리카":"#B07AA1","오세아니아":"#76B7B2","기타":"#9aa4b2"},
    "data": world, "eju": {},
  },
}

def sub(old, new, count=1):
    """치환이 실제로 일어났는지 반드시 검증한다 (템플릿이 바뀌면 즉시 실패)."""
    global H
    n = H.count(old)
    assert n == count, "치환 대상 불일치(%d개, 기대 %d): %s" % (n, count, old[:70].replace("\n", "\\n"))
    H = H.replace(old, new)

# ---------------------------------------------------------------- 1. 데이터셋
sub("const DATA = __DATA__;\nconst EJU = __EJU__;",
    "const DATASETS = __DATASETS__;\n"
    "let CURRENT = \"jp\";\n"
    "let DATA = DATASETS.jp.data, EJU = DATASETS.jp.eju;")

sub('const REGION_ORDER = ["홋카이도","도호쿠","간토","주부","간사이","주고쿠","시코쿠","규슈","오키나와"];\n'
    'const REGION_COLOR = {\n'
    ' "홋카이도":"#4E79A7","도호쿠":"#59A14F","간토":"#E15759","주부":"#F28E2B",\n'
    ' "간사이":"#B07AA1","주고쿠":"#76B7B2","시코쿠":"#E6B800","규슈":"#FF7CA0","오키나와":"#00B8D4"\n'
    '};',
    'let REGION_ORDER = DATASETS.jp.regionOrder;\n'
    'let REGION_COLOR = DATASETS.jp.regionColor;')

sub("const CODES = Object.keys(DATA);\n"
    "const TOTAL = CODES.length;\n"
    "const EJU_CODES = Object.keys(EJU);\n"
    "let ROUND = TOTAL;\n"
    "const FULL_VB=[-40,-5,650,546];",
    "let CODES = [], TOTAL = 0, EJU_CODES = [], ROUND = 0;\n"
    "let FULL_VB = DATASETS.jp.vb.slice();\n"
    "function ALTHINT(){ return DATASETS[CURRENT].altHint; }")

sub("const LOOKUP = {};\nfor(const code in DATA){ for(const a of DATA[code].accepted){ LOOKUP[norm(a)] = code; } }",
    "let LOOKUP = {};")

# 언어 안내 문구를 데이터셋에 맞게
sub('"日本語で入力（漢字・かな・ローマ字）"', 'ALTHINT()')
sub('"日本語で入力"', 'ALTHINT()')

# ---------------------------------------------------------------- 2. 지도 빌드를 함수로
sub('const SVGNS="http://www.w3.org/2000/svg";\nfor(const code of CODES){',
    'const SVGNS="http://www.w3.org/2000/svg";\nfunction buildMap(){\nfor(const code of CODES){')

RAF = """requestAnimationFrame(()=>{
  for(const code of CODES){
    const b=svg.querySelector(`path[data-code="${code}"]`).getBBox();
    bbox[code]={x:b.x,y:b.y,w:b.width,h:b.height};
    labels[code].setAttribute("x",b.x+b.width/2);
    labels[code].setAttribute("y",b.y+b.height/2);
  }
});"""
sub(RAF, RAF + "\n}")

# ---------------------------------------------------------------- 3. 헤더 UI
sub('  <div class="brand">🗾 일본 도도부현 메모리<small id="modehint">이름을 타이핑하세요</small></div>',
    '  <div class="brand"><span id="brandtxt">🗾 일본 도도부현 메모리</span><small id="modehint">이름을 타이핑하세요</small></div>')

sub('    <a class="btn" href="index.html" title="로비로">🏠 로비</a>\n'
    '    <a class="btn" id="switchbtn" href="world_countries_metro.html" title="세계 버전으로">🌍 세계</a>\n',
    '    <div class="seg" id="dset">\n'
    '      <button data-ds="jp" class="on">🗾 일본</button>\n'
    '      <button data-ds="world">🌍 세계</button>\n'
    '    </div>\n'
    '    <button class="btn" id="recbtn" title="기록·랭킹">🏆 기록</button>\n')

sub('      <button data-l="ja">日本語</button>', '      <button data-l="ja" id="altlangbtn">日本語</button>')

# ---------------------------------------------------------------- 4. 기록 CSS
sub('/* start screen + countdown */', r'''/* ===== 세계 데이터셋: 조밀한 지도용 라벨 축소 · EJU 숨김 ===== */
body.world text.lbl{font-size:6px}
body.world #mode button[data-m="eju"]{display:none}
/* ===== 기록·랭킹 패널 ===== */
.recwrap{position:fixed;inset:0;z-index:120;display:none;align-items:center;justify-content:center;padding:14px;
  background:rgba(6,4,22,.72);backdrop-filter:blur(3px)}
body:not(.dark) .recwrap{background:rgba(226,233,243,.8)}
body.recopen .recwrap{display:flex}
.recbox{width:min(720px,100%);max-height:min(86dvh,720px);display:flex;flex-direction:column;
  background:var(--panel);border:3px solid var(--accent);border-radius:12px;box-shadow:7px 7px 0 var(--miss);overflow:hidden}
.rechead{display:flex;align-items:center;gap:10px;flex-wrap:wrap;padding:13px 16px;border-bottom:2px solid var(--line);
  background:linear-gradient(90deg,var(--headbg1),var(--headbg2))}
.rechead h2{font-family:"Press Start 2P",monospace;font-size:12px;margin:0;color:var(--accent);letter-spacing:0}
.rechead .sp{flex:1}
.namebox{display:flex;align-items:center;gap:6px}
.namebox input{width:130px;background:var(--inputbg1);border:2px solid var(--line);border-radius:7px;color:var(--text);
  padding:6px 9px;font-family:var(--kr,"Noto Sans KR"),sans-serif;font-size:13px;font-weight:700}
.namebox input:focus{outline:none;border-color:var(--accent)}
.rectabs{display:flex;gap:0;border-bottom:2px solid var(--line);background:var(--panel2)}
.rectabs button{flex:1;background:none;border:none;border-bottom:3px solid transparent;color:var(--sub);
  font-family:var(--kr,"Noto Sans KR"),sans-serif;font-weight:800;font-size:13px;padding:11px 6px;cursor:pointer}
.rectabs button.on{color:var(--accent);border-bottom-color:var(--accent);background:var(--panel)}
.recbody{padding:15px 17px;overflow:auto;flex:1;min-height:120px}
.recpane{display:none}.recpane.on{display:block}
.rectable{width:100%;border-collapse:collapse;font-size:14px}
.rectable th{text-align:left;font-family:"Press Start 2P",monospace;font-size:8px;letter-spacing:1px;color:var(--sub);
  font-weight:400;padding:0 9px 8px;border-bottom:1px dashed var(--line)}
.rectable td{padding:9px;border-bottom:1px solid var(--line);font-weight:700;color:var(--text)}
.rectable tr:last-child td{border-bottom:none}
.rectable .t{font-family:"Press Start 2P",monospace;font-size:11px;color:var(--accent);font-variant-numeric:tabular-nums}
.rectable .who{color:var(--sub);font-weight:800}
.rectable tr.me td{background:var(--panel2)}
.rectable tr.me .who{color:var(--gold)}
.rk{font-family:"Press Start 2P",monospace;font-size:10px;width:34px;color:var(--sub)}
.rk.g1{color:#e8b923}.rk.g2{color:#9aa8bd}.rk.g3{color:#c07a3e}
.recgrid{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:11px}
.reccard{background:var(--panel2);border:2px solid var(--line);border-radius:9px;padding:12px 13px}
.reccard .k{font-size:11px;font-weight:800;color:var(--sub);margin-bottom:6px}
.reccard .n{font-family:"Press Start 2P",monospace;font-size:15px;color:var(--accent);font-variant-numeric:tabular-nums}
.missrow{display:flex;align-items:center;gap:10px;padding:8px 2px;border-bottom:1px solid var(--line)}
.missrow:last-child{border-bottom:none}
.missrow .nm{flex:1;font-weight:800;font-size:14px}
.missrow .rg{font-size:11px;color:var(--sub);font-weight:700}
.missbar{width:96px;height:9px;border-radius:5px;background:var(--panel2);border:1px solid var(--line);overflow:hidden}
.missbar i{display:block;height:100%;background:var(--miss)}
.missrow .ct{font-family:"Press Start 2P",monospace;font-size:9px;color:var(--miss);width:30px;text-align:right}
.recempty{color:var(--sub);font-size:13px;font-weight:700;text-align:center;padding:26px 10px;line-height:1.7}
.recfoot{padding:9px 16px;border-top:2px solid var(--line);font-size:11px;color:var(--sub);font-weight:700;
  display:flex;align-items:center;gap:8px;flex-wrap:wrap;background:var(--panel2)}
.syncdot{width:8px;height:8px;border-radius:50%;background:var(--sub);flex:none}
.syncdot.on{background:var(--ok);box-shadow:0 0 7px var(--ok)}
/* 시작 화면의 최고 기록 스트립 */
.beststrip{display:flex;gap:9px;flex-wrap:wrap;justify-content:center;max-width:520px}
.beststrip .bs{background:var(--glass);border:2px solid var(--line);border-radius:8px;padding:7px 11px;
  font-size:11px;font-weight:800;color:var(--sub);display:flex;align-items:center;gap:7px}
.beststrip .bs b{font-family:"Press Start 2P",monospace;font-size:10px;color:var(--accent);font-variant-numeric:tabular-nums}
@media(max-width:600px){
  .recbox{border-width:2px;box-shadow:4px 4px 0 var(--miss)}
  .rechead h2{font-size:10px}
  .recbody{padding:12px}
  .rectable{font-size:13px}
  .namebox input{width:104px}
}
/* start screen + countdown */''')

# ---- 4b. CRT 부팅 인트로 (기존 로비 index.html에서 이식) ----
sub('/* start screen + countdown */', r"""/* ===== CRT 전원 켜짐 인트로 ===== */
#crton{position:fixed;inset:0;z-index:9999;pointer-events:none;overflow:hidden}
#crton .bar{position:absolute;left:0;right:0;height:51%;background:#000}
#crton .bar.top{top:0;transform-origin:top;animation:crtBar 1.15s cubic-bezier(.7,0,.25,1) forwards}
#crton .bar.bot{bottom:0;transform-origin:bottom;animation:crtBar 1.15s cubic-bezier(.7,0,.25,1) forwards}
@keyframes crtBar{0%,18%{transform:scaleY(1)}52%{transform:scaleY(0)}100%{transform:scaleY(0)}}
#crton .seam{position:absolute;top:50%;left:50%;right:50%;height:3px;transform:translateY(-50%);background:#fff;
  box-shadow:0 0 22px 6px #fff,0 0 60px 12px #bfefff;animation:crtSeam 1.15s ease-out forwards}
@keyframes crtSeam{0%{left:50%;right:50%;opacity:0;height:3px}9%{left:0;right:0;opacity:1;height:3px}18%{opacity:1;height:3px}33%{opacity:1;height:100%}45%{opacity:0;height:100%}100%{opacity:0}}
#crton .noise{position:absolute;inset:0;mix-blend-mode:screen;opacity:0;
  background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  animation:crtNoiseOp 1.15s steps(1) forwards, crtNoiseMv .11s steps(4) infinite}
@keyframes crtNoiseOp{0%,28%{opacity:0}33%{opacity:.55}42%{opacity:.2}50%{opacity:.45}60%{opacity:.12}72%{opacity:.3}85%{opacity:.05}100%{opacity:0}}
@keyframes crtNoiseMv{0%{background-position:0 0}25%{background-position:40px -30px}50%{background-position:-25px 20px}75%{background-position:15px 35px}100%{background-position:-40px -10px}}
body.crtboot header,body.crtboot main,body.crtboot footer{animation:crtWrap 1.15s ease-out}
@keyframes crtWrap{0%,28%{opacity:0;filter:brightness(3)}38%{opacity:1;filter:brightness(2.2) contrast(1.3)}42%{transform:translateX(-6px);filter:contrast(1.5) hue-rotate(12deg)}45%{transform:translateX(5px)}48%{transform:translateX(-2px);filter:contrast(1.2)}51%{transform:translateX(0)}100%{opacity:1;filter:none}}
body.crtdone #crton{display:none}
@media(prefers-reduced-motion:reduce){
  #crton{display:none}
  body.crtboot header,body.crtboot main,body.crtboot footer{animation:none}
}
/* start screen + countdown */""")

sub('<header>\n',
    '<div id="crton"><div class="bar top"></div><div class="bar bot"></div><div class="seam"></div><div class="noise"></div></div>\n<header>\n')

# ---------------------------------------------------------------- 5. 기록 패널 마크업
sub('<footer>\n', r'''<div class="recwrap" id="recwrap">
  <div class="recbox">
    <div class="rechead">
      <h2>🏆 RECORDS</h2>
      <div class="sp"></div>
      <div class="namebox"><span style="font-size:12px;font-weight:800;color:var(--sub)">플레이어</span>
        <input id="pname" maxlength="12" placeholder="이름 입력" autocomplete="off" spellcheck="false"></div>
      <button class="btn" id="recclose" title="닫기">✕</button>
    </div>
    <div class="rectabs">
      <button data-t="board" class="on">최고 기록</button>
      <button data-t="miss">약점 지역</button>
      <button data-t="stat">누적 통계</button>
    </div>
    <div class="recbody">
      <div class="recpane on" id="pane-board"></div>
      <div class="recpane" id="pane-miss"></div>
      <div class="recpane" id="pane-stat"></div>
    </div>
    <div class="recfoot"><span class="syncdot" id="syncdot"></span><span id="syncmsg">기록은 이 브라우저에 저장됩니다</span></div>
  </div>
</div>
<footer>
''')

# 시작 화면에 최고 기록 스트립
sub('      <div id="countdown" class="countdown"></div>',
    '      <div id="countdown" class="countdown"></div>\n'
    '      <div class="beststrip" id="beststrip"></div>')

# ---------------------------------------------------------------- 6. 기록 수집 훅
sub('function wrongAnswer(){\n  sWrong(); flash("flash-no"); streak=0; updateStats();',
    'function wrongAnswer(){\n  sWrong(); flash("flash-no"); streak=0; REC.wrong(target); updateStats();')

sub('  found.add(code); streak++; markFound(code); updateStats(); input.value=""; flash("flash-ok");',
    '  found.add(code); streak++; REC.right(); markFound(code); updateStats(); input.value=""; flash("flash-ok");')
sub('  found.add(code); streak++; queue.shift(); markFound(code);\n  updateStats(); input.value=""; flash("flash-ok"); sCorrect(streak); celebrate(code,streak);',
    '  found.add(code); streak++; REC.right(); queue.shift(); markFound(code);\n  updateStats(); input.value=""; flash("flash-ok"); sCorrect(streak); celebrate(code,streak);')
sub('  found.add(code); streak++; queue.shift(); markFound(code);\n  updateStats(); input.value=""; flash("flash-ok"); sCorrect(streak);',
    '  found.add(code); streak++; REC.right(); queue.shift(); markFound(code);\n  updateStats(); input.value=""; flash("flash-ok"); sCorrect(streak);')
sub('      found.add(cc); streak++; queue.shift(); markFound(cc); updateStats(); sCorrect(streak);',
    '      found.add(cc); streak++; REC.right(); queue.shift(); markFound(cc); updateStats(); sCorrect(streak);')
sub('      b.classList.add("wrong"); b.disabled=true; sWrong(); streak=0; updateStats();',
    '      b.classList.add("wrong"); b.disabled=true; sWrong(); streak=0; REC.wrong(target); updateStats();')

# 정답공개 / 넘어가기 = 못 맞힌 것으로 집계
sub('    const code=target; revealed.add(code); streak=0;\n'
    '    const p=svg.querySelector(`path[data-code="${code}"]`); p.classList.add("revealed");',
    '    const code=target; revealed.add(code); streak=0; REC.wrong(code);\n'
    '    const p=svg.querySelector(`path[data-code="${code}"]`); p.classList.add("revealed");')
sub('  const code=target; revealed.add(code); streak=0;\n'
    '  const p=svg.querySelector(`path[data-code="${code}"]`);\n'
    '  p.classList.remove("target","dim"); p.classList.add("revealed");',
    '  const code=target; revealed.add(code); streak=0; REC.wrong(code);\n'
    '  const p=svg.querySelector(`path[data-code="${code}"]`);\n'
    '  p.classList.remove("target","dim"); p.classList.add("revealed");')
sub('  streak=0; updateStats();\n  queue.push(queue.shift()); // move to back',
    '  streak=0; REC.wrong(target); updateStats();\n  queue.push(queue.shift()); // move to back')

# 라운드 종료
sub('function finishQuiz(){\n  over=true; stopTimer();',
    'function finishQuiz(){\n  over=true; stopTimer(); REC.finish(false);')
sub('function winGame(){\n  over=true; stopTimer();',
    'function winGame(){\n  over=true; stopTimer(); REC.finish(true);')

# ---------------------------------------------------------------- 7. 기록 엔진 + 데이터셋 전환
sub('buildPanel(); resetGame();', r'''/* =======================================================================
   RECORDS — 기록 엔진
   저장소: db(공유 랭킹) 가능하면 db + localStorage, 아니면 localStorage 단독
   ======================================================================= */
const REC_KEY="geoarcade.player.v2";
const MODE_LABEL={quiz:"지목 퀴즈",free:"자유 채우기",type:"타자 연습",eju:"EJU 지역"};
const BOARD_ORDER=[["jp","quiz"],["jp","eju"],["jp","type"],["jp","free"],["world","quiz"],["world","type"],["world","free"]];

function blankPlayer(){ return {name:"",best:{},misses:{},stats:{plays:0,clears:0,totalMs:0,correct:0,wrong:0,bestStreak:0},at:0}; }
let P=blankPlayer();
let DB=null, PEERS=[], recTab="board";

function hashStr(s){ let h=5381; for(let i=0;i<s.length;i++){ h=(((h<<5)+h)+s.charCodeAt(i))>>>0; } return h.toString(36); }
function slugName(s){
  const t=(s||"").trim(); if(!t) return "player";
  const ascii=t.replace(/[^0-9A-Za-z_.~:@-]/g,"").slice(0,20);
  return (ascii?ascii+"-":"p-")+hashStr(t);
}
function lsLoad(){ try{const r=localStorage.getItem(REC_KEY); if(r){const o=JSON.parse(r); if(o&&o.stats) return o;}}catch(e){} return blankPlayer(); }
function lsSave(){ try{ localStorage.setItem(REC_KEY,JSON.stringify(P)); }catch(e){} }

let syncTimer=null;
function pushRemote(){
  if(!DB||!P.name) return;
  clearTimeout(syncTimer);
  syncTimer=setTimeout(()=>{
    P.at=Date.now();
    DB.doc("players/"+slugName(P.name)).set(P).catch(()=>{});
  },700);
}
function persist(){ lsSave(); pushRemote(); renderRecords(); }

const REC={
  live:null,
  begin(){ this.live={correct:0,wrong:0,peak:0}; },
  right(){ if(!this.live) this.begin(); this.live.correct++; P.stats.correct++;
           if(streak>this.live.peak) this.live.peak=streak;
           if(streak>P.stats.bestStreak) P.stats.bestStreak=streak; },
  wrong(code){ if(!this.live) this.begin(); this.live.wrong++; P.stats.wrong++;
           if(code&&DATA[code]) P.misses[CURRENT+":"+code]=(P.misses[CURRENT+":"+code]||0)+1; },
  finish(cleared){
    if(!startedAt) return;
    const ms=Date.now()-startedAt, key=CURRENT+"_"+mode;
    P.stats.plays++; P.stats.totalMs+=ms; if(cleared) P.stats.clears++;
    const prev=P.best[key];
    const better=!prev||found.size>prev.found||(found.size===prev.found&&ms<prev.ms);
    if(better){
      P.best[key]={found:found.size,round:ROUND,ms:ms,at:Date.now()};
      if(prev) setTimeout(()=>{ try{ floatText(mapwrap.getBoundingClientRect().width/2,70,"NEW RECORD!","#e8b923"); }catch(e){} },380);
    }
    this.live=null; persist(); renderBestStrip();
  }
};

/* ---- db 연결 (없으면 조용히 로컬 전용) ---- */
async function connectDB(){
  const dot=document.getElementById("syncdot"), msg=document.getElementById("syncmsg");
  if(!window.claude||typeof window.claude.use!=="function") return;
  let db=null;
  try{ db=await window.claude.use("db"); }catch(e){ db=null; }
  if(!db) return;
  DB=db;
  dot.classList.add("on");
  msg.textContent="공유 랭킹판에 연결됨 — 이름을 입력하면 기록이 함께 올라갑니다";
  try{
    DB.collection("players").limit(50).onSnapshot(snap=>{
      PEERS=snap.docs.map(d=>Object.assign({id:d.id},d.data()||{}));
      const mine=PEERS.find(x=>P.name&&x.id===slugName(P.name));
      if(mine&&(mine.at||0)>(P.at||0)&&(mine.stats||{}).plays>=P.stats.plays){
        P=Object.assign(blankPlayer(),mine); delete P.id; lsSave();
        document.getElementById("pname").value=P.name||"";
      }
      renderRecords(); renderBestStrip();
    },()=>{});
  }catch(e){}
  if(P.name) pushRemote();
}

/* ---- 렌더링 ---- */
function everyone(){
  const mineSlug=P.name?slugName(P.name):null;
  const list=PEERS.filter(p=>p.id!==mineSlug);
  if(P.name||P.stats.plays) list.push(Object.assign({},P,{id:mineSlug||"__me__"}));
  return list;
}
function rankRows(dsKey,modeKey){
  const key=dsKey+"_"+modeKey, mineSlug=P.name?slugName(P.name):"__me__";
  return everyone().map(p=>{
    const b=(p.best||{})[key]; if(!b) return null;
    return {who:p.name||"이름없음",me:p.id===mineSlug,found:b.found,round:b.round,ms:b.ms,at:b.at};
  }).filter(Boolean).sort((a,b)=>(b.found-a.found)||(a.ms-b.ms)).slice(0,10);
}
function stamp(t){ if(!t) return ""; const d=new Date(t); return (d.getMonth()+1)+"/"+d.getDate(); }

function renderBoard(){
  const el=document.getElementById("pane-board");
  let html="";
  for(const [ds,md] of BOARD_ORDER){
    const rows=rankRows(ds,md); if(!rows.length) continue;
    html+=`<div style="margin-bottom:20px"><table class="rectable"><thead><tr>`+
      `<th colspan="2">${DATASETS[ds].icon} ${DATASETS[ds].label} · ${MODE_LABEL[md]}</th>`+
      `<th style="text-align:right">기록</th><th style="text-align:right">정답</th><th style="text-align:right">날짜</th></tr></thead><tbody>`;
    rows.forEach((r,i)=>{
      html+=`<tr class="${r.me?"me":""}"><td class="rk g${i+1}">${i+1}</td><td class="who">${r.me?"⭐ ":""}${esc(r.who)}</td>`+
        `<td class="t" style="text-align:right">${fmt(r.ms)}</td>`+
        `<td style="text-align:right">${r.found}/${r.round}</td>`+
        `<td style="text-align:right;color:var(--sub);font-weight:700;font-size:12px">${stamp(r.at)}</td></tr>`;
    });
    html+=`</tbody></table></div>`;
  }
  el.innerHTML=html||`<div class="recempty">아직 기록이 없어요.<br>한 라운드를 끝내면 여기에 최고 기록이 쌓입니다.</div>`;
}
function renderMiss(){
  const el=document.getElementById("pane-miss");
  const rows=Object.keys(P.misses).map(k=>{
    const [ds,code]=k.split(":"); const d=(DATASETS[ds]||{}).data||{};
    if(!d[code]) return null;
    return {ds:ds,ko:d[code].ko,rg:d[code].region,n:P.misses[k]};
  }).filter(Boolean).sort((a,b)=>b.n-a.n).slice(0,20);
  if(!rows.length){ el.innerHTML=`<div class="recempty">아직 틀린 곳이 없어요.<br>정답 보기·넘어가기·오답이 여기에 모입니다.</div>`; return; }
  const max=rows[0].n;
  el.innerHTML=`<div style="font-size:12px;font-weight:700;color:var(--sub);margin-bottom:11px">가장 자주 놓친 곳 ${rows.length}개 — 여기부터 복습하면 돼요</div>`+
    rows.map(r=>`<div class="missrow"><span style="font-size:14px">${DATASETS[r.ds].icon}</span>`+
      `<span class="nm">${esc(r.ko)}</span><span class="rg">${esc(r.rg)}</span>`+
      `<span class="missbar"><i style="width:${Math.round(r.n/max*100)}%"></i></span>`+
      `<span class="ct">${r.n}</span></div>`).join("");
}
function renderStat(){
  const s=P.stats, tot=s.correct+s.wrong;
  const acc=tot?Math.round(s.correct/tot*100):0;
  const hh=Math.floor(s.totalMs/3600000), mm=Math.floor(s.totalMs%3600000/60000);
  document.getElementById("pane-stat").innerHTML=`<div class="recgrid">`+
    `<div class="reccard"><div class="k">플레이 횟수</div><div class="n">${s.plays}</div></div>`+
    `<div class="reccard"><div class="k">완주 횟수</div><div class="n">${s.clears}</div></div>`+
    `<div class="reccard"><div class="k">누적 시간</div><div class="n">${hh?hh+"h ":""}${mm}m</div></div>`+
    `<div class="reccard"><div class="k">정답률</div><div class="n">${acc}%</div></div>`+
    `<div class="reccard"><div class="k">맞힌 횟수</div><div class="n">${s.correct}</div></div>`+
    `<div class="reccard"><div class="k">🔥 최고 연속</div><div class="n">${s.bestStreak}</div></div>`+
    `</div>`;
}
function esc(s){ return String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;"}[c])); }
function renderRecords(){ renderBoard(); renderMiss(); renderStat(); }

function renderBestStrip(){
  const el=document.getElementById("beststrip"); if(!el) return;
  const items=[];
  for(const md of ["quiz","eju","type","free"]){
    if(CURRENT==="world"&&md==="eju") continue;
    const b=P.best[CURRENT+"_"+md]; if(!b) continue;
    items.push(`<span class="bs">${MODE_LABEL[md]} <b>${fmt(b.ms)}</b> <span style="opacity:.75">${b.found}/${b.round}</span></span>`);
  }
  el.innerHTML=items.length?`<span class="bs" style="border-style:dashed">🏆 내 최고 기록</span>`+items.join(""):"";
}

/* ---- 패널 조작 ---- */
const recWrap=document.getElementById("recwrap");
function openRec(){ document.body.classList.add("recopen"); renderRecords(); if(soundOn){AC();tone(880,0.05,"square",0.05);} }
function closeRec(){ document.body.classList.remove("recopen"); input.focus(); }
document.getElementById("recbtn").addEventListener("click",openRec);
document.getElementById("recclose").addEventListener("click",closeRec);
recWrap.addEventListener("click",e=>{ if(e.target===recWrap) closeRec(); });
document.addEventListener("keydown",e=>{ if(e.key==="Escape"&&document.body.classList.contains("recopen")) closeRec(); });
document.querySelector(".rectabs").addEventListener("click",e=>{
  const b=e.target.closest("button"); if(!b) return;
  recTab=b.dataset.t;
  [...b.parentNode.children].forEach(x=>x.classList.toggle("on",x===b));
  ["board","miss","stat"].forEach(t=>document.getElementById("pane-"+t).classList.toggle("on",t===recTab));
  if(soundOn){AC();tone(660,0.04,"square",0.04);}
});
const nameInput=document.getElementById("pname");
nameInput.addEventListener("input",()=>{ P.name=nameInput.value.trim(); persist(); });

/* =======================================================================
   데이터셋 전환 (일본 ↔ 세계)
   ======================================================================= */
function loadDataset(key){
  const d=DATASETS[key]; if(!d) return;
  CURRENT=key;
  DATA=d.data; EJU=d.eju; REGION_ORDER=d.regionOrder; REGION_COLOR=d.regionColor;
  FULL_VB=d.vb.slice();
  CODES=Object.keys(DATA); TOTAL=CODES.length; EJU_CODES=Object.keys(EJU);
  LOOKUP={}; for(const code in DATA){ for(const a of DATA[code].accepted){ LOOKUP[norm(a)]=code; } }
  vbAnim++; stopTimer();
  svg.innerHTML=""; ov.innerHTML="";
  for(const k of Object.keys(bbox)) delete bbox[k];
  for(const k of Object.keys(labels)) delete labels[k];
  for(const k of Object.keys(ovPaths)) delete ovPaths[k];
  for(const k of Object.keys(chipEls)) delete chipEls[k];
  ov.setAttribute("viewBox",d.vb.join(" "));
  svg.setAttribute("viewBox",d.vb.join(" "));
  document.body.classList.toggle("world",key==="world");
  document.getElementById("brandtxt").textContent=d.icon+" "+d.brand;
  document.getElementById("altlangbtn").textContent=d.altLang;
  if(key==="world"&&mode==="eju"){
    mode="quiz";
    [...document.getElementById("mode").children].forEach(x=>x.classList.toggle("on",x.dataset.m==="quiz"));
  }
  buildMap(); buildPanel(); resetGame();
  renderBestStrip();
}
document.getElementById("dset").addEventListener("click",e=>{
  const b=e.target.closest("button"); if(!b) return;
  if(b.dataset.ds===CURRENT) return;
  [...e.currentTarget.children].forEach(x=>x.classList.toggle("on",x===b));
  if(soundOn){AC();tone(523,0.06,"square",0.05); tone(784,0.09,"square",0.05,0.06);}
  loadDataset(b.dataset.ds);
});

/* ---- 부팅 ---- */
document.body.classList.add("dark","crtboot");
setTimeout(()=>{ document.body.classList.add("crtdone"); const c=document.getElementById("crton"); if(c) c.remove(); },1250);
P=lsLoad(); nameInput.value=P.name||"";
loadDataset("jp");
renderRecords();
connectDB();''')

# ---------------------------------------------------------------- 8. Artifact 본문으로 변환
sub("<!DOCTYPE html>\n<html lang=\"ko\">\n<head>\n<meta charset=\"utf-8\">\n"
    "<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">\n", "")
sub("<title>일본 도도부현 메모리 · Japan Prefecture Metro</title>", "<title>GEO ARCADE</title>")
sub("</head>\n<body class=\"quiz dark\">\n", "")
sub("</body>\n</html>", "")

H = H.replace("__DATASETS__", json.dumps(DATASETS, ensure_ascii=False, separators=(",", ":")))

for tok in ["__DATA__", "__EJU__", "__DATASETS__", "<!DOCTYPE", "<html", "<head>", "</head>", "<body", "</body>", "</html>"]:
    assert tok not in H, "남아있는 토큰: " + tok

out = os.path.join("..", "artifact")
if not os.path.isdir(out):
    os.makedirs(out)
path = os.path.join(out, "geo_arcade.html")
io.open(path, "w", encoding="utf-8").write(H)
# GitHub Pages 배포용 단독 HTML — Artifact 호스트가 붙여주는 head 골격을 직접 포함한다.
# (db가 없는 환경이므로 기록은 자동으로 localStorage 단독으로 동작)
wrap = ('<!DOCTYPE html>\n<html lang="ko">\n<head>\n<meta charset="utf-8">\n'
        '<meta name="viewport" content="width=device-width, initial-scale=1">\n'
        + H.replace("<title>GEO ARCADE</title>",
                    "<title>GEO ARCADE · 지리 메모리</title>", 1)
           .replace("</style>\n", "</style>\n</head>\n<body>\n", 1)
        + "\n</body>\n</html>\n")
standalone = os.path.join("..", "index.html")   # 리포 진입점 = 통합본
io.open(standalone, "w", encoding="utf-8").write(wrap)

print("written %s — %.2f MB, 일본 %d + 세계 %d + EJU %d"
      % (path, len(H.encode("utf-8")) / 1048576.0, len(jp), len(world), len(eju)))
print("        %s — GitHub Pages 배포용 단독본 (%.2f MB)" % (standalone, len(wrap.encode("utf-8"))/1048576.0))
