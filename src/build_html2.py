# -*- coding: utf-8 -*-
import json
data = json.load(open('data.json'))
DATA_JS = json.dumps(data, ensure_ascii=False)
eju = json.load(open('eju.json'))
EJU_JS = json.dumps(eju, ensure_ascii=False)

HTML = r'''<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>일본 도도부현 메모리 · Japan Prefecture Metro</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Press+Start+2P&family=VT323&family=Noto+Sans+KR:wght@500;700;900&display=swap" rel="stylesheet">
<style>
:root{ /* light theme (default) */
  --bg1:#eef2f8; --bg2:#dde5f0;
  --headbg1:#ffffff; --headbg2:#e9eff7;
  --panel:#ffffff; --panel2:#eef1f7; --line:#d2dae7;
  --text:#1b2534; --sub:#5f6b7e;
  --accent:#0e9cb5; --ok:#12a578; --miss:#e5484d; --gold:#c98a00;
  --mapbg1:#f3f6fb; --mapbg2:#e6ecf6;
  --unfound:#d0d9e7; --unfoundstroke:#aab6c9;
  --dimfill:#c3cede;
  --missfill:#f3c9cc; --revealfill:#f4e2a8;
  --inputbg1:#ffffff; --inputbg2:#eef2f8;
  --glass:#ffffffd6;
  --ovunfound:#c9d3e2;
}
body.dark{
  --bg1:#1a2540; --bg2:#0f1420;
  --headbg1:#1b2233; --headbg2:#141b28;
  --panel:#171d2b; --panel2:#1e2636; --line:#2b3446;
  --text:#e8edf6; --sub:#8b97ad;
  --accent:#4dd0e1; --ok:#38d39f; --miss:#ff6b6b; --gold:#ffd54f;
  --mapbg1:#141b2b; --mapbg2:#0f1420;
  --unfound:#263042; --unfoundstroke:#3a465c;
  --dimfill:#33405a;
  --missfill:#3a2130; --revealfill:#4a3a12;
  --inputbg1:#212b3d; --inputbg2:#181f2d;
  --glass:#0b0f18cc;
  --ovunfound:#2a3346;
}
body,header,aside,footer,.btn,.seg,#answer,.chip{transition:background-color .25s ease,color .25s ease,border-color .25s ease}
*{box-sizing:border-box}
html,body{margin:0;height:100%}
body{background:radial-gradient(1100px 640px at 82% -12%,var(--bg1),var(--bg2) 60%);color:var(--text);font-family:"Noto Sans KR","Noto Sans JP",-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;display:flex;flex-direction:column;height:100vh;height:100dvh;overflow:hidden}
header{display:flex;align-items:center;gap:12px;padding:11px 18px;border-bottom:1px solid var(--line);background:linear-gradient(90deg,var(--headbg1),var(--headbg2));flex-wrap:wrap;box-shadow:0 3px 14px #0003;position:relative;z-index:8}
header::after{content:"";position:absolute;left:0;right:0;bottom:-1px;height:1px;background:linear-gradient(90deg,transparent,var(--accent),transparent);opacity:.5}
.brand{font-weight:800;font-size:17px;letter-spacing:.3px}
.brand small{color:var(--sub);font-weight:500;margin-left:6px;font-size:12px}
.stats{display:flex;gap:16px;margin-left:auto;align-items:center;flex-wrap:wrap}
.stat{text-align:center;min-width:56px}
.stat .v{font-size:20px;font-weight:800;font-variant-numeric:tabular-nums;line-height:1}
.stat .l{font-size:11px;color:var(--sub);margin-top:3px}
.stat .v.ok{color:var(--ok)} .stat .v.gold{color:var(--gold)}
.stat.qonly{display:none}
body.quiz .stat.qonly{display:block}
.seg{display:flex;background:var(--panel2);border:1px solid var(--line);border-radius:9px;overflow:hidden}
.seg button{background:transparent;border:0;color:var(--sub);padding:7px 12px;font-size:13px;font-weight:700;cursor:pointer}
.seg button.on{background:var(--accent);color:#04121a}
.seg.mode button.on{background:var(--gold);color:#1a1400}
.tools{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
.btn{background:var(--panel2);border:1px solid var(--line);color:var(--text);padding:7px 12px;border-radius:9px;font-size:13px;font-weight:700;cursor:pointer}
.btn:hover{border-color:var(--accent)}
.btn.danger:hover{border-color:var(--miss);color:var(--miss)}
label.chk{display:flex;align-items:center;gap:6px;font-size:12px;color:var(--sub);cursor:pointer;user-select:none}
body.quiz label.chk{display:none}
main{flex:1;display:flex;min-height:0}
.mapwrap{flex:1.6;position:relative;min-width:0;background:radial-gradient(1200px 700px at 60% 30%,var(--mapbg1),var(--mapbg2))}
svg#map{width:100%;height:100%;display:block}
path.pref{fill:var(--unfound);stroke:var(--unfoundstroke);stroke-width:.6;stroke-linejoin:round;transition:fill .45s ease,opacity .4s ease}
path.pref.found{stroke:#0b0f18;stroke-width:.5}
path.pref.miss{fill:var(--missfill);stroke:#e5484d99}
path.pref.dim{fill:var(--dimfill);opacity:.5}
path.pref.target{fill:var(--gold)!important;stroke:#fff;stroke-width:1.3;opacity:1;animation:tpulse 1.1s ease-in-out infinite}
path.pref.revealed{fill:var(--revealfill);stroke:#c98a0099}
@keyframes tpulse{0%,100%{filter:brightness(1)}50%{filter:brightness(1.45)}}
path.pref.pulse{animation:pop .5s ease}
@keyframes pop{0%{filter:brightness(2.2)}100%{filter:brightness(1)}}
text.lbl{fill:#f4f8ff;font-size:8px;font-weight:700;text-anchor:middle;dominant-baseline:middle;paint-order:stroke;stroke:#0b0f18;stroke-width:1.6px;pointer-events:none;opacity:0}
text.lbl.show{opacity:1}
/* quiz banner */
.qbanner{position:absolute;top:14px;left:50%;transform:translateX(-50%);background:var(--glass);color:var(--text);border:1px solid var(--line);backdrop-filter:blur(4px);padding:8px 18px;border-radius:12px;font-weight:800;font-size:15px;display:none;align-items:center;gap:10px;z-index:5;box-shadow:0 4px 16px #0002}
body.quiz .qbanner{display:flex}
.qbanner .num{color:var(--gold)}
.qhint{position:absolute;bottom:14px;left:50%;transform:translateX(-50%);font-size:13px;color:var(--gold);background:var(--glass);border:1px solid var(--line);padding:5px 12px;border-radius:9px;display:none;z-index:5}
/* overview inset */
.overview{position:absolute;right:12px;top:12px;width:150px;height:126px;background:var(--glass);border:1px solid var(--line);border-radius:10px;padding:5px;display:none;z-index:4;box-shadow:0 4px 16px #0002}
body.quiz .overview{display:block}
.overview .cap{font-size:10px;color:var(--sub);text-align:center;margin-bottom:1px}
svg#ovmap{width:100%;height:104px}
path.ov{stroke:#0b0f18;stroke-width:.5}
aside{flex:.9;min-width:250px;max-width:340px;border-left:1px solid var(--line);background:var(--panel);overflow-y:auto;padding:12px}
.region{margin-bottom:12px}
.region h3{display:flex;align-items:center;gap:8px;margin:0 0 6px;font-size:13px}
.dot{width:11px;height:11px;border-radius:3px;flex:none}
.region .cnt{margin-left:auto;font-size:12px;color:var(--sub);font-variant-numeric:tabular-nums}
.chips{display:flex;flex-wrap:wrap;gap:5px}
.chip{font-size:12px;padding:3px 8px;border-radius:7px;background:var(--panel2);border:1px solid var(--line);color:var(--sub)}
.chip.got{color:#04121a;font-weight:700}
.chip.now{outline:2px solid var(--gold);outline-offset:1px}
footer{border-top:1px solid var(--line);background:var(--panel);padding:12px 18px}
.inbar{display:flex;gap:8px;max-width:820px;margin:0 auto;align-items:center}
#answer{flex:1;background:linear-gradient(180deg,var(--inputbg1),var(--inputbg2));border:2px solid var(--line);border-radius:16px;color:var(--text);font-size:27px;padding:18px 22px;outline:none;font-weight:800;letter-spacing:.5px;caret-color:var(--accent);box-shadow:inset 0 1px 0 #ffffff12;transition:box-shadow .2s,border-color .2s}
#answer::placeholder{color:#5b6a82;font-weight:600}
#answer:focus{border-color:var(--accent);box-shadow:0 0 0 4px #4dd0e130,0 0 30px #4dd0e124,inset 0 1px 0 #ffffff12}
#answer.pop{animation:inpop .12s ease}
@keyframes inpop{50%{transform:scale(1.012)}}
#answer.flash-ok{border-color:var(--ok);box-shadow:0 0 0 3px #38d39f44}
#answer.flash-no{border-color:var(--miss);box-shadow:0 0 0 3px #ff6b6b44;animation:shake .3s}
@keyframes shake{25%{transform:translateX(-5px)}75%{transform:translateX(5px)}}
.qbtns{display:none;gap:8px} body.quiz .qbtns{display:flex}
.progress{height:6px;background:var(--panel2);border-radius:99px;overflow:hidden;margin-top:10px;max-width:820px;margin-left:auto;margin-right:auto}
.progress i{display:block;height:100%;width:0;background:linear-gradient(90deg,var(--accent),var(--ok));transition:width .4s ease}
.hint{max-width:820px;margin:8px auto 0;font-size:12px;color:var(--sub);text-align:center;min-height:16px}
.win{color:var(--ok);font-weight:800}
/* ===================== RESPONSIVE ===================== */
/* 태블릿 / 좁은 가로: 지도 위, 지역 패널 아래로 세로 배치.
   높이를 vh로 고정하지 않고 flex로 나눠 헤더·푸터가 커져도 넘치지 않게 한다. */
@media(max-width:820px){
  main{flex-direction:column}
  .mapwrap{flex:1 1 auto;height:auto;min-height:0}
  aside{flex:0 0 auto;height:24vh;min-height:0;max-width:none;min-width:0;
        border-left:0;border-top:2px solid var(--accent);padding:10px}
  .overview{width:110px;height:96px}
  svg#ovmap{height:74px}
  #answer{font-size:22px;padding:14px 16px}
  #combo{font-size:18px}
  /* 헤더 3단 구성: 제목 / 도구(한 줄 가로 스크롤) / 스탯 */
  .brand{width:100%;order:1}
  .tools{order:2;width:100%;flex-wrap:nowrap;overflow-x:auto;overflow-y:hidden;
         scrollbar-width:none;-webkit-overflow-scrolling:touch}
  .tools::-webkit-scrollbar{display:none}
  .tools>*{flex:0 0 auto}
  .seg button,.btn{white-space:nowrap}
  .stats{order:3;width:100%;margin-left:0;justify-content:space-between;gap:0}
  .stat{min-width:0;flex:1}
}
/* 휴대폰 세로 */
@media(max-width:600px){
  header{padding:7px 10px;gap:6px}
  .brand{font-size:13px;width:100%;order:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .brand small{display:none}
  /* 도구는 줄바꿈 대신 가로 스크롤 — 헤더가 화면을 잡아먹지 않도록 */
  .tools{order:2;width:100%;flex-wrap:nowrap;overflow-x:auto;overflow-y:hidden;gap:6px;
         justify-content:flex-start;scrollbar-width:none;-webkit-overflow-scrolling:touch}
  .tools::-webkit-scrollbar{display:none}
  .tools>*{flex:0 0 auto}
  .seg button{padding:6px 9px;font-size:11.5px;white-space:nowrap}
  .btn{padding:6px 9px;font-size:12px;white-space:nowrap}
  .stats{order:3;width:100%;gap:0;justify-content:space-between;margin-left:0}
  .stat{min-width:0;flex:1}
  .stat .v{font-size:12px}
  .stat .l{font-size:9px}
  .settings{width:min(84vw,240px)}
  aside{height:20vh;padding:8px}
  .region{margin-bottom:8px}
  .region h3{font-size:11px}
  .chip{font-size:10.5px;padding:2px 6px}
  /* 문제 배너: 폭을 다 쓰고 가운데 정렬 */
  .qbanner{left:8px;right:8px;top:8px;transform:none;justify-content:center;text-align:center;
           flex-wrap:wrap;gap:5px;font-size:12px;padding:6px 10px;border-radius:9px}
  .qbanner .num{font-size:9px}
  .qhint{font-size:11px}
  /* 미니맵을 좌하단으로 — 위쪽 배너와 겹치지 않게 */
  .overview{width:84px;height:74px;top:auto;bottom:8px;left:8px;right:auto;padding:3px}
  .overview .cap{font-size:8px}
  svg#ovmap{height:56px}
  body.eju .overview{display:none}
  /* 입력줄: 입력칸 한 줄 + 버튼 한 줄. 버튼이 글자 단위로 쪼개지던 문제를 막는다 */
  footer{padding:9px 10px 20px}   /* 하단 여백은 제작자 워터마크 자리 */
  .inbar{flex-wrap:wrap;gap:7px}
  #answer{flex:1 1 100%;font-size:19px;padding:12px 14px;border-radius:12px}
  .qbtns{width:100%;gap:6px}
  .qbtns .btn{flex:1 1 0;min-width:0;white-space:nowrap;text-align:center;padding:10px 4px;font-size:12px}
  .typetarget{font-size:22px;padding:9px 12px;min-height:44px}
  .startbtn{font-size:15px;padding:14px 20px}
  .countdown{font-size:clamp(38px,15vw,58px)}
  .credit{font-size:6px}
  .typinglabel{display:none}
  /* EJU·특산물 모드: 단서 카드가 지도 아래를 덮으므로 지역 패널을 접어 지도에 자리를 준다.
     패널이 있으면 확대된 목표 지역이 카드 뒤로 숨고 세 번째 단서가 잘렸다. */
  body.eju aside{display:none}
  .ejucard{max-height:48%;width:calc(100% - 16px);padding:10px 12px;bottom:8px}
  .ejucard .cat{margin-bottom:8px}
  .ejucard ul{gap:6px}
  .ejucard li{font-size:13.5px}
  .ejucard .qname h2{font-size:22px}
  .opt{font-size:13.5px;padding:9px 11px}
}
/* 아주 좁은 화면 */
@media(max-width:380px){
  .stat .v{font-size:11px}
  .qbtns .btn{font-size:11px;padding:9px 2px}
  #answer{font-size:17px}
  .seg button{padding:6px 7px;font-size:11px}
}
/* 휴대폰 가로: 세로 공간이 귀하므로 다시 좌우 배치하고 헤더를 최소화 */
@media(max-height:520px) and (orientation:landscape){
  main{flex-direction:row}
  .mapwrap{flex:1.5;height:auto}
  aside{flex:.9;height:auto;max-height:none;max-width:220px;min-width:0;
        border-top:0;border-left:2px solid var(--accent)}
  /* 헤더를 한 줄로 눌러 담는다 — 세로 375px에서 헤더가 화면의 1/3을 먹던 문제 */
  header{padding:5px 10px;gap:8px;flex-wrap:nowrap}
  .brand{display:none}
  .tools{flex:1 1 auto;min-width:0;flex-wrap:nowrap;overflow-x:auto;overflow-y:hidden;
         gap:5px;scrollbar-width:none;-webkit-overflow-scrolling:touch}
  .tools::-webkit-scrollbar{display:none}
  .tools>*{flex:0 0 auto}
  .seg button{padding:5px 8px;font-size:11px;white-space:nowrap}
  .btn{padding:5px 8px;font-size:11px;white-space:nowrap}
  .stats{flex:0 0 auto;width:auto;margin-left:0;gap:9px;flex-wrap:nowrap}
  .stat{min-width:42px}
  .stat .v{font-size:12px}
  .stat .l{font-size:9px}
  .typinglabel{display:none}
  footer{padding:6px 10px 8px}
  .inbar{flex-wrap:nowrap}
  #answer{flex:1;font-size:17px;padding:9px 12px}
  .qbtns{width:auto}
  .progress{margin-top:6px}
  .hint{margin-top:5px;font-size:11px}
  .startbtn{font-size:14px;padding:11px 18px}
  .overview{width:78px;height:68px}
  svg#ovmap{height:50px}
}
/* ---- design + fx ---- */
.typingstage{max-width:860px;margin:0 auto;position:relative}
.typinglabel{max-width:860px;margin:0 auto 6px;font-size:11px;letter-spacing:2px;color:var(--sub);text-transform:uppercase;font-weight:700}
.progress i{box-shadow:0 0 12px #4dd0e155}
#fx{position:absolute;inset:0;pointer-events:none;overflow:hidden;z-index:6}
.float{position:absolute;transform:translate(-50%,-50%);font-weight:800;font-size:16px;text-shadow:0 2px 6px #000,0 0 10px #0008;animation:floatup 1.05s ease-out forwards;white-space:nowrap}
@keyframes floatup{0%{opacity:0;transform:translate(-50%,-30%) scale(.7)}20%{opacity:1}100%{opacity:0;transform:translate(-50%,-165%) scale(1.12)}}
.dot{position:absolute;width:7px;height:7px;border-radius:50%;transform:translate(-50%,-50%);animation:burstfx .65s ease-out forwards}
@keyframes burstfx{0%{opacity:1;transform:translate(-50%,-50%) scale(1)}100%{opacity:0;transform:translate(calc(-50% + var(--dx)),calc(-50% + var(--dy))) scale(.4)}}
.confetti{position:absolute;top:-16px;width:8px;height:12px;border-radius:2px;z-index:7;animation:fall linear forwards}
@keyframes fall{to{transform:translateY(var(--fall)) rotate(var(--rot));opacity:.25}}
#combo{position:absolute;top:54px;left:50%;transform:translateX(-50%);font-weight:900;font-size:24px;color:var(--gold);text-shadow:0 2px 10px #000,0 0 20px #ffd54f99;opacity:0;pointer-events:none;z-index:7}
#combo.show{animation:comboPop .85s ease-out}
@keyframes comboPop{0%{opacity:0;transform:translateX(-50%) scale(.5)}22%{opacity:1;transform:translateX(-50%) scale(1.18)}100%{opacity:0;transform:translateX(-50%) scale(1)}}
.chip{transition:transform .12s ease}
.chip.got{transform:scale(1.02)}
#soundbtn.off{color:var(--sub);opacity:.7}
a.btn{text-decoration:none;display:inline-flex;align-items:center;gap:4px}
#switchbtn{border-color:var(--accent);color:var(--accent)}
/* ---- typing-practice mode ---- */
.typetarget{display:none;justify-content:center;flex-wrap:wrap;gap:1px;font-size:34px;font-weight:800;letter-spacing:2px;margin:0 auto 12px;padding:12px 18px;min-height:60px;align-items:center;background:var(--panel2);border:2px dashed var(--line);border-radius:14px;max-width:860px}
body.type .typetarget{display:flex}
.tc{color:var(--sub);opacity:.5;transition:color .08s}
.tc.done{color:var(--ok);opacity:1}
.tc.wrong{color:var(--miss);opacity:1;text-decoration:underline}
.tc.cur{opacity:1;color:var(--text);box-shadow:inset 0 -4px 0 var(--accent);border-radius:3px}
body.type .qbanner{display:flex}
body.type .overview{display:block}
body.type .qbtns{display:flex}
body.type #hintbtn,body.type #revealbtn{display:none}
body.type label.chk{display:none}
body.type .stat.qonly{display:block}
/* ---- EJU mode ---- */
.ejudironly{display:none}
body.eju .ejudironly{display:flex}
.ejucard{position:absolute;left:50%;bottom:16px;transform:translateX(-50%);max-width:620px;width:calc(100% - 44px);max-height:52%;overflow:auto;background:var(--glass);border:1px solid var(--line);border-radius:16px;padding:16px 20px;box-shadow:0 12px 44px #0005;display:none;z-index:6;backdrop-filter:blur(7px)}
body.eju .ejucard{display:block}
.ejucard .cat{display:inline-block;font-size:12px;font-weight:800;letter-spacing:1px;color:#fff;background:var(--accent);padding:4px 12px;border-radius:20px;margin-bottom:12px}
.ejucard ul{margin:0;padding:0;list-style:none;display:flex;flex-direction:column;gap:9px}
.ejucard li{font-size:16px;line-height:1.5;font-weight:600;display:flex;gap:9px;color:var(--text)}
.ejucard li .ic{flex:none;color:var(--accent);font-weight:900}
.ejucard .q{margin-top:12px;font-size:13px;color:var(--accent);font-weight:800}
/* variant B: choose feature */
.ejucard .qname h2{margin:.1em 0;font-size:30px;font-weight:900}
.ejucard .qsub{font-size:12px;color:var(--sub);font-weight:600}
.choices{display:flex;flex-direction:column;gap:8px;margin-top:12px}
.opt{text-align:left;background:var(--panel2);border:1px solid var(--line);color:var(--text);padding:11px 14px;border-radius:11px;font-size:15px;font-weight:600;cursor:pointer;line-height:1.45}
.opt:hover{border-color:var(--accent)}
.opt.right{background:var(--ok);color:#04121a;border-color:var(--ok)}
.opt.wrong{background:#ff6b6b22;border-color:var(--miss);color:var(--miss);opacity:.65;cursor:default}
body.eju .qbanner{display:flex}
body.eju .overview{display:block}
body.eju .qbtns{display:flex}
body.eju label.chk{display:none}
body.eju .stat.qonly{display:block}
body.ejufeat #answer, body.ejufeat .typinglabel{display:none}
body.ejufeat #hintbtn, body.ejufeat #revealbtn{display:none}
/* ===================== ARCADE SKIN ===================== */
.stat .v,#combo,.win,.qbanner .num,.credit,.typinglabel{font-family:"Press Start 2P",ui-monospace,monospace}
.stat .v{font-size:15px;letter-spacing:0}
.typinglabel{font-size:9px;letter-spacing:1px}
.brand{text-shadow:2px 2px 0 var(--miss)}
.btn,.seg,#answer,aside,.qbanner,.overview,.ejucard,.chip,.opt{border-radius:7px}
.btn{border-width:2px;box-shadow:2px 2px 0 #0007;transition:transform .08s,box-shadow .08s,border-color .2s,background-color .2s,color .2s}
.btn:active{transform:translate(2px,2px);box-shadow:none}
.seg{border-width:2px}
a.btn:active{transform:translate(2px,2px)}
header{border-bottom:2px solid var(--accent);box-shadow:0 2px 0 var(--miss),0 6px 16px #0008}
aside{border-left:2px solid var(--accent)}
footer{border-top:2px solid var(--accent)}
#answer{border-width:2px}
.progress{border:1px solid var(--line)}
.progress i{box-shadow:0 0 10px var(--accent)}
#combo{text-shadow:2px 2px 0 #000,0 0 16px var(--gold)}
.win{font-size:12px}
.mapwrap{box-shadow:inset 0 0 0 2px #ffffff12}
.qbanner .num{font-size:11px}
/* CRT scanlines over whole screen — subtle (light) / a bit stronger (dark) */
body::after{content:"";position:fixed;inset:0;z-index:60;pointer-events:none;opacity:.6;
  background:repeating-linear-gradient(0deg,#0000 0 3px,#0000000a 3px 4px);mix-blend-mode:multiply}
body.dark::after{opacity:1;background:repeating-linear-gradient(0deg,#0000 0 3px,#00000014 3px 4px)}
/* maker credit, bottom-right */
.credit{position:fixed;right:9px;bottom:7px;z-index:70;font-size:8px;line-height:1.4;color:#fff;opacity:.6;
  text-shadow:1px 1px 0 #000,0 0 6px var(--accent);pointer-events:none}
@media(max-width:560px){.credit{font-size:7px;opacity:.5}}
/* light (day) = clean white arcade: softer shadows, gentler frame */
body:not(.dark) .btn{box-shadow:2px 2px 0 #00000018}
body:not(.dark) header{box-shadow:0 2px 0 var(--miss),0 4px 12px #0000000f}
body:not(.dark) .mapwrap{box-shadow:inset 0 0 0 2px #0000000d}
body:not(.dark) #combo{text-shadow:2px 2px 0 #fff,0 0 14px var(--gold)}
body:not(.dark) .credit{color:#1b2534;opacity:.5;text-shadow:1px 1px 0 #fff}
/* settings (gear) panel */
.gearwrap{position:relative}
.settings{position:absolute;top:calc(100% + 8px);right:0;z-index:95;width:230px;background:var(--panel);border:2px solid var(--accent);border-radius:10px;box-shadow:4px 4px 0 #0007;padding:9px;display:none;flex-direction:column;gap:7px}
.settings.open{display:flex}
.settitle{font-family:"Press Start 2P",monospace;font-size:8px;color:var(--accent);padding:2px 2px 6px;border-bottom:1px dashed var(--line);letter-spacing:0}
.settrow{display:flex;align-items:center;justify-content:space-between;gap:10px;font-size:12px;font-weight:700;color:var(--text);padding:2px 2px}
.settrow .btn{padding:5px 9px}
.tgl{border:2px solid var(--accent);background:var(--accent);color:#04121a;font-weight:800;font-size:11px;padding:5px 12px;border-radius:7px;cursor:pointer;min-width:48px;box-shadow:2px 2px 0 #0006;transition:transform .08s,box-shadow .08s}
.tgl:active{transform:translate(2px,2px);box-shadow:none}
.tgl.off{background:transparent;color:var(--sub);border-color:var(--line)}
.settings label.chk{display:flex !important;transform:scale(1.25);margin-right:6px}
body.nocrt::after{display:none !important}
/* start screen + countdown */
.startscreen{position:absolute;inset:0;z-index:9;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;background:rgba(6,4,22,.6);backdrop-filter:blur(2px)}
body:not(.dark) .startscreen{background:rgba(240,244,250,.72)}
.startbtn{font-family:"Press Start 2P",monospace;font-size:20px;color:#04121a;background:var(--gold);border:3px solid #fff;border-radius:12px;padding:20px 34px;cursor:pointer;box-shadow:6px 6px 0 var(--miss);animation:startbob 1.4s ease-in-out infinite}
.startbtn:hover{filter:brightness(1.06)}
.startbtn:active{transform:translate(3px,3px);box-shadow:3px 3px 0 var(--miss)}
@keyframes startbob{50%{transform:translateY(-7px)}}
.countdown{font-family:"Press Start 2P",monospace;font-size:clamp(44px,10vw,72px);color:var(--gold);text-shadow:4px 4px 0 var(--miss),0 0 26px var(--gold);min-height:1px}
.countdown.pulse{animation:cdpop .55s ease}
@keyframes cdpop{0%{transform:scale(.3);opacity:0}55%{transform:scale(1.18);opacity:1}100%{transform:scale(1);opacity:.95}}
</style>
</head>
<body class="quiz dark">
<header>
  <div class="brand">🗾 일본 도도부현 메모리<small id="modehint">이름을 타이핑하세요</small></div>
  <div class="tools">
    <div class="seg mode" id="mode">
      <button data-m="free">🗺️ 자유 채우기</button>
      <button data-m="quiz" class="on">🔍 지목 퀴즈</button>
      <button data-m="type">⌨️ 타자 연습</button>
      <button data-m="eju">🎓 EJU 지역</button>
    </div>
    <div class="seg" id="lang">
      <button data-l="ko" class="on">한국어</button>
      <button data-l="ja">日本語</button>
    </div>
    <div class="seg ejudironly" id="ejudir">
      <button data-d="name" class="on">특징→지역</button>
      <button data-d="feat">지역→특징</button>
    </div>
    <a class="btn" href="index.html" title="로비로">🏠 로비</a>
    <a class="btn" id="switchbtn" href="world_countries_metro.html" title="세계 버전으로">🌍 세계</a>
    <button class="btn" id="reset">다시하기</button>
    <button class="btn danger" id="giveup">정답 보기</button>
    <button class="btn" id="fsbtn" title="전체화면 전환">⛶</button>
    <div class="gearwrap">
      <button class="btn" id="gearbtn" title="설정">⚙️</button>
      <div class="settings" id="settings">
        <div class="settitle">⚙️ 설정 · OPTIONS</div>
        <div class="settrow"><span>📺 CRT 스캔라인</span><button class="tgl on" id="crtbtn">ON</button></div>
        <div class="settrow"><span>🔊 사운드</span><button class="btn" id="soundbtn" title="사운드 켜기/끄기">🔊</button></div>
        <div class="settrow"><span>🎨 테마 (라이트/다크)</span><button class="btn" id="themebtn" title="라이트/다크 전환">☀️</button></div>
        <div class="settrow"><span>🏷️ 지도에 이름 표시</span><label class="chk"><input type="checkbox" id="showlbl"></label></div>
      </div>
    </div>
  </div>
  <div class="stats">
    <div class="stat"><div class="v ok" id="count">0<span style="color:var(--sub);font-size:13px">/47</span></div><div class="l">맞힌 개수</div></div>
    <div class="stat"><div class="v" id="timer">0:00</div><div class="l">경과 시간</div></div>
    <div class="stat qonly"><div class="v gold" id="streak">0</div><div class="l">🔥 연속</div></div>
    <div class="stat"><div class="v" id="pct">0%</div><div class="l">진행률</div></div>
  </div>
</header>

<main>
  <div class="mapwrap">
    <div class="qbanner"><span class="num" id="qnum">문제 1</span> · <span id="qtext">하이라이트된 곳의 이름은?</span></div>
    <div class="qhint" id="qhint"></div>
    <div class="overview"><div class="cap">전체 위치</div><svg id="ovmap" viewBox="-40 -5 650 546" preserveAspectRatio="xMidYMid meet"></svg></div>
    <svg id="map" viewBox="-40 -5 650 546" preserveAspectRatio="xMidYMid meet"></svg>
    <div id="ejucard" class="ejucard"></div>
    <div id="combo"></div>
    <div id="fx"></div>
    <div id="startscreen" class="startscreen">
      <button id="startbtn" class="startbtn">▶ START</button>
      <div id="countdown" class="countdown"></div>
    </div>
  </div>
  <aside id="panel"></aside>
</main>

<footer>
  <div class="typinglabel">⌨️ 타이핑</div>
  <div class="typingstage">
  <div id="typetarget" class="typetarget"></div>
  <div class="inbar">
    <input id="answer" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="">
    <div class="qbtns">
      <button class="btn" id="hintbtn">💡 힌트</button>
      <button class="btn" id="skipbtn">⏭ 넘어가기</button>
      <button class="btn danger" id="revealbtn">정답</button>
    </div>
  </div>
  </div>
  <div class="progress"><i id="bar"></i></div>
  <div class="hint" id="hint">첫 글자를 입력하면 타이머가 시작됩니다.</div>
</footer>

<script>
const DATA = __DATA__;
const EJU = __EJU__;
const REGION_ORDER = ["홋카이도","도호쿠","간토","주부","간사이","주고쿠","시코쿠","규슈","오키나와"];
const REGION_COLOR = {
 "홋카이도":"#4E79A7","도호쿠":"#59A14F","간토":"#E15759","주부":"#F28E2B",
 "간사이":"#B07AA1","주고쿠":"#76B7B2","시코쿠":"#E6B800","규슈":"#FF7CA0","오키나와":"#00B8D4"
};
const CODES = Object.keys(DATA);
const TOTAL = CODES.length;
const EJU_CODES = Object.keys(EJU);
let ROUND = TOTAL;
const FULL_VB=[-40,-5,650,546];
function OVU(){ return getComputedStyle(document.body).getPropertyValue('--ovunfound').trim()||'#2a3346'; }

const norm = s => (s||"").toString().trim().toLowerCase().replace(/[\s・·.\-()]/g,"");
const LOOKUP = {};
for(const code in DATA){ for(const a of DATA[code].accepted){ LOOKUP[norm(a)] = code; } }

let mode="quiz", lang="ko", ejuDir="name";
let pendingStart=true;
let found=new Set(), revealed=new Set();
let startedAt=null, timerId=null, over=false;
let queue=[], target=null, streak=0, hintLevel=0;
const bbox={}, labels={}, ovPaths={};

// ---- build main svg ----
const svg=document.getElementById("map");
const ov=document.getElementById("ovmap");
const SVGNS="http://www.w3.org/2000/svg";
for(const code of CODES){
  const p=document.createElementNS(SVGNS,"path");
  p.setAttribute("d",DATA[code].d); p.setAttribute("class","pref"); p.dataset.code=code;
  const t=document.createElementNS(SVGNS,"title"); t.textContent="?"; p.appendChild(t);
  svg.appendChild(p);
  const o=document.createElementNS(SVGNS,"path");
  o.setAttribute("d",DATA[code].d); o.setAttribute("class","ov"); o.setAttribute("fill",OVU());
  ov.appendChild(o); ovPaths[code]=o;
}
for(const code of CODES){
  const tx=document.createElementNS(SVGNS,"text"); tx.setAttribute("class","lbl");
  svg.appendChild(tx); labels[code]=tx;
}
requestAnimationFrame(()=>{
  for(const code of CODES){
    const b=svg.querySelector(`path[data-code="${code}"]`).getBBox();
    bbox[code]={x:b.x,y:b.y,w:b.width,h:b.height};
    labels[code].setAttribute("x",b.x+b.width/2);
    labels[code].setAttribute("y",b.y+b.height/2);
  }
});

// ---- viewBox tween ----
let curVB=FULL_VB.slice(), vbAnim=0;
function setVB(vb){svg.setAttribute("viewBox",vb.join(" "));curVB=vb;}
function tweenVB(tv,dur=560){
  const start=curVB.slice(), t0=performance.now(), id=++vbAnim;
  function step(now){ if(id!==vbAnim)return;
    let k=Math.min(1,(now-t0)/dur); const e=k<.5?2*k*k:1-Math.pow(-2*k+2,2)/2;
    setVB(start.map((s,i)=>s+(tv[i]-s)*e));
    if(k<1)requestAnimationFrame(step); }
  requestAnimationFrame(step);
}
// bbox는 buildMap()의 requestAnimationFrame에서 채워진다. 그 전에 라운드가
// 시작되면(탭이 백그라운드라 rAF가 미뤄진 경우 등) 여기서 예외가 나면서
// 지도 확대·안내문·입력창 포커스가 통째로 건너뛰어졌다. 없으면 즉석에서 계산한다.
function bboxOf(code){
  let b=bbox[code];
  if(!b){
    const el=svg.querySelector(`path[data-code="${code}"]`);
    if(!el) return null;
    try{ const r=el.getBBox(); b=bbox[code]={x:r.x,y:r.y,w:r.width,h:r.height}; }
    catch(e){ return null; }
  }
  return b;
}
function vbForTarget(code){
  const b=bboxOf(code); if(!b) return FULL_VB.slice();
  const pad=Math.max(b.w,b.h)*0.85+10;
  let w=b.w+pad*2, h=b.h+pad*2;
  const ar=(svg.clientWidth||900)/(svg.clientHeight||600);
  if(w/h<ar) w=h*ar; else h=w/ar;
  const cx=b.x+b.w/2, cy=b.y+b.h/2;
  return [cx-w/2,cy-h/2,w,h];
}

// ---- panel ----
const panel=document.getElementById("panel"); const chipEls={};
function buildPanel(){
  panel.innerHTML=""; 
  for(const region of REGION_ORDER){
    const codes=CODES.filter(c=>DATA[c].region===region);
    const wrap=document.createElement("div"); wrap.className="region";
    const h=document.createElement("h3");
    h.innerHTML=`<span class="dot" style="background:${REGION_COLOR[region]}"></span>${region}<span class="cnt" id="cnt-${region}"></span>`;
    wrap.appendChild(h);
    const chips=document.createElement("div"); chips.className="chips";
    for(const c of codes){ const chip=document.createElement("span"); chip.className="chip"; chip.id="chip-"+c; chip.textContent="•••"; chips.appendChild(chip); chipEls[c]=chip; }
    wrap.appendChild(chips); panel.appendChild(wrap); updateRegionCount(region);
  }
}
function updateRegionCount(region){
  const codes=CODES.filter(c=>DATA[c].region===region);
  const got=codes.filter(c=>found.has(c)).length;
  const el=document.getElementById("cnt-"+region); if(el) el.textContent=`${got}/${codes.length}`;
}
function labelFor(code){ return lang==="ko"?DATA[code].ko:DATA[code].kanji; }

// ---- timer & stats ----
function fmt(ms){const s=Math.floor(ms/1000);return Math.floor(s/60)+":"+String(s%60).padStart(2,"0");}
function startTimer(){ if(timerId||over)return; startedAt=Date.now(); timerId=setInterval(()=>{document.getElementById("timer").textContent=fmt(Date.now()-startedAt);},250); }
function stopTimer(){ clearInterval(timerId); timerId=null; }
function updateStats(){
  document.getElementById("count").innerHTML=`${found.size}<span style="color:var(--sub);font-size:13px">/${ROUND}</span>`;
  const pct=Math.round(found.size/ROUND*100);
  document.getElementById("pct").textContent=pct+"%";
  document.getElementById("bar").style.width=pct+"%";
  document.getElementById("streak").textContent=streak;
}

// ---- reveal a prefecture as FOUND ----
function markFound(code){
  const path=svg.querySelector(`path[data-code="${code}"]`);
  path.classList.remove("target","dim","revealed");
  path.style.fill=REGION_COLOR[DATA[code].region];
  path.classList.add("found","pulse"); setTimeout(()=>path.classList.remove("pulse"),500);
  path.querySelector("title").textContent=`${DATA[code].ko} · ${DATA[code].kanji} (${DATA[code].romaji})`;
  labels[code].textContent=labelFor(code);
  if(document.getElementById("showlbl").checked) labels[code].classList.add("show");
  const chip=chipEls[code]; chip.textContent=labelFor(code); chip.classList.add("got"); chip.classList.remove("now");
  chip.style.background=REGION_COLOR[DATA[code].region]; chip.style.borderColor=REGION_COLOR[DATA[code].region];
  ovPaths[code].setAttribute("fill",REGION_COLOR[DATA[code].region]);
  updateRegionCount(DATA[code].region);
}

// ---- QUIZ MODE ----
function shuffle(a){for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
function setDimForQuiz(){
  for(const c of CODES){
    const p=svg.querySelector(`path[data-code="${c}"]`);
    p.classList.remove("target");
    if(found.has(c)||revealed.has(c)) p.classList.remove("dim");
    else p.classList.add("dim");
  }
}
function nextTarget(){
  hintLevel=0; document.getElementById("qhint").style.display="none";
  // remove old now-chip highlight
  for(const c of CODES) chipEls[c] && chipEls[c].classList.remove("now");
  if(queue.length===0){ target=null; if(found.size===ROUND) winGame(); else finishQuiz(); return; }
  target=queue[0];
  setDimForQuiz();
  const p=svg.querySelector(`path[data-code="${target}"]`);
  p.classList.remove("dim"); p.classList.add("target");
  chipEls[target] && chipEls[target].classList.add("now");
  // overview highlight
  for(const c of CODES){ if(!found.has(c)) ovPaths[c].setAttribute("fill", c===target?"#ffd54f":OVU()); }
  tweenVB(vbForTarget(target));
  document.getElementById("qnum").textContent=`${ROUND-queue.length+1}번째 / ${ROUND}`;
  document.getElementById("qtext").textContent = mode==="eju" ? (ejuDir==="feat" ? "이름을 보고 대표 특징을 고르세요" : "특징을 읽고 이 지역의 이름을 입력!") : mode==="type" ? "화면의 이름을 그대로 따라 입력! ⌨️" : "하이라이트된 곳의 이름은?";
  if(mode==="type") renderTypeTarget();
  if(mode==="eju"){ if(ejuDir==="feat") showEjuChoices(target); else showEjuClue(target); }
}
function startQuiz(){
  const pool=(mode==="eju")?EJU_CODES:CODES;
  queue=shuffle(pool.filter(c=>!found.has(c)));
  nextTarget();
}
function finishQuiz(){
  over=true; stopTimer();
  const el=document.getElementById("qnum"); 
  document.getElementById("hint").innerHTML=`퀴즈 끝! 맞힘 <b>${found.size}</b> · 정답공개 <b style="color:var(--miss)">${revealed.size}</b> · 시간 ${startedAt?fmt(Date.now()-startedAt):"-"}`;
  tweenVB(FULL_VB);
  for(const c of CODES){ const p=svg.querySelector(`path[data-code="${c}"]`); p.classList.remove("dim","target"); }
  document.getElementById("ejucard").style.display="none";
}

// ---- EJU mode ----
function showEjuClue(code){
  const e=EJU[code]; const card=document.getElementById("ejucard"); card.style.display="";
  card.innerHTML=`<span class="cat">${e.cat}</span>`+
    `<ul>${e.clues.map(x=>`<li><span class="ic">▹</span><span>${x}</span></li>`).join("")}</ul>`+
    `<div class="q">🎓 하이라이트된 이 지역의 이름은?</div>`;
}
function showEjuChoices(code){
  const e=EJU[code]; const card=document.getElementById("ejucard"); card.style.display="";
  const others=shuffle(EJU_CODES.filter(c=>c!==code)).slice(0,3);
  const opts=shuffle([{t:e.clues[0],ok:1}].concat(others.map(o=>({t:EJU[o].clues[0],ok:0}))));
  card.innerHTML=`<div class="qname"><span class="cat">${e.cat}</span><h2>${lang==="ko"?e.ko:e.kanji}</h2><div class="qsub">이 지역의 대표 특징을 고르세요</div></div>`+
    `<div class="choices">${opts.map(o=>`<button class="opt" data-ok="${o.ok}">${o.t}</button>`).join("")}</div>`;
  card.querySelectorAll(".opt").forEach(b=>b.addEventListener("click",()=>{
    if(over||!target) return;
    if(!startedAt) startTimer();
    if(b.dataset.ok==="1"){
      const cc=target; b.classList.add("right");
      found.add(cc); streak++; queue.shift(); markFound(cc); updateStats(); sCorrect(streak);
      ejuReveal(cc,true); target=null; setTimeout(()=>{ if(!over) nextTarget(); },1800);
    } else {
      b.classList.add("wrong"); b.disabled=true; sWrong(); streak=0; updateStats();
      hint.textContent="땡! 다른 지역의 특징이에요. 다시 골라보세요.";
    }
  }));
}
function ejuReveal(code,correct){
  document.getElementById("ejucard").style.display="none";
  tweenVB(vbForTarget(code),700);
  const p=svg.querySelector(`path[data-code="${code}"]`); p.classList.add("pulse"); setTimeout(()=>p.classList.remove("pulse"),500);
  setTimeout(()=>{ try{celebrate(code,streak);}catch(e){} },320);
  const e=EJU[code];
  hint.innerHTML=(correct?`<b style="color:var(--ok)">✅ 정답! ${e.ko} · ${e.kanji}</b>`:`<b style="color:var(--gold)">정답: ${e.ko} · ${e.kanji}</b>`)+` — ${e.detail}`;
}

// ---- input ----
const input=document.getElementById("answer");
const hint=document.getElementById("hint");
function flash(cls){ input.classList.add(cls); setTimeout(()=>input.classList.remove(cls),350); }

// ---- sound engine (Web Audio, no external files) ----
let audioCtx=null, soundOn=true;
function AC(){
  if(!audioCtx){ try{audioCtx=new (window.AudioContext||window.webkitAudioContext)();}catch(e){return null;} }
  if(audioCtx.state==="suspended") audioCtx.resume();
  return audioCtx;
}
function tone(freq,dur,type,gain,when,glideTo){
  const ac=AC(); if(!ac||!soundOn) return;
  const t=ac.currentTime+(when||0);
  const o=ac.createOscillator(), g=ac.createGain();
  o.type=type||"sine"; o.frequency.setValueAtTime(freq,t);
  if(glideTo) o.frequency.exponentialRampToValueAtTime(glideTo,t+dur);
  g.gain.setValueAtTime(0.0001,t);
  g.gain.exponentialRampToValueAtTime(gain||0.15,t+0.008);
  g.gain.exponentialRampToValueAtTime(0.0001,t+dur);
  o.connect(g); g.connect(ac.destination);
  o.start(t); o.stop(t+dur+0.03);
}
// ---- 8-bit / arcade chiptune SFX (square waves) ----
function sClick(){ tone(180+Math.random()*30,0.028,"square",0.035); }
function sCorrect(st){ // coin/blip that climbs with combo
  const s=Math.min(st,10);
  tone(784+s*24,0.055,"square",0.06,0);
  tone(1175+s*36,0.11,"square",0.06,0.055);
}
function sWrong(){ // arcade "miss" descending buzz
  tone(196,0.09,"square",0.07,0,150);
  tone(130,0.16,"square",0.07,0.09,92);
}
function sReveal(){ tone(523,0.07,"square",0.05,0); tone(392,0.13,"square",0.05,0.07); }
function sWin(){ // 1-UP style fanfare
  const n=[[523,0.1],[659,0.1],[784,0.1],[1047,0.12],[784,0.1],[1047,0.12],[1319,0.26]];
  let t=0; n.forEach(x=>{ tone(x[0],x[1],"square",0.06,t); t+=x[1]*0.9; });
}

// ---- FX overlay ----
const mapwrap=document.querySelector(".mapwrap");
const fxLayer=document.getElementById("fx");
const comboEl=document.getElementById("combo");
function prefScreen(code){
  const r=svg.querySelector(`path[data-code="${code}"]`).getBoundingClientRect();
  const w=mapwrap.getBoundingClientRect();
  return [r.left+r.width/2-w.left, r.top+r.height/2-w.top];
}
function floatText(x,y,txt,color){
  const el=document.createElement("div"); el.className="float"; el.textContent=txt;
  el.style.left=x+"px"; el.style.top=y+"px"; el.style.color=color||"#fff";
  fxLayer.appendChild(el); setTimeout(()=>el.remove(),1100);
}
function burst(x,y,color){
  for(let i=0;i<12;i++){
    const d=document.createElement("div"); d.className="dot";
    const ang=Math.random()*6.283, dist=22+Math.random()*42;
    d.style.left=x+"px"; d.style.top=y+"px"; d.style.background=color||"#4dd0e1";
    d.style.setProperty("--dx",Math.cos(ang)*dist+"px");
    d.style.setProperty("--dy",Math.sin(ang)*dist+"px");
    fxLayer.appendChild(d); setTimeout(()=>d.remove(),700);
  }
}
function showCombo(st){
  if(mode!=="quiz"||st<2) return;
  comboEl.textContent=`🔥 ${st} COMBO`;
  comboEl.classList.remove("show"); void comboEl.offsetWidth; comboEl.classList.add("show");
}
function popInput(){ input.classList.remove("pop"); void input.offsetWidth; input.classList.add("pop"); }
// ---- typing-practice helpers ----
function displayType(code){ return lang==="ko"?DATA[code].ko:DATA[code].kana; }
function renderTypeTarget(){
  const box=document.getElementById("typetarget"); box.innerHTML="";
  if(!target) return;
  for(const ch of displayType(target)){
    const sp=document.createElement("span"); sp.className="tc"; sp.textContent=ch; box.appendChild(sp);
  }
  updateTypeColor("");
}
function updateTypeColor(val){
  if(!target) return;
  const t=displayType(target); const spans=[...document.getElementById("typetarget").children];
  for(let i=0;i<spans.length;i++){
    spans[i].className="tc";
    if(i<val.length) spans[i].classList.add(val[i]===t[i]?"done":"wrong");
    else if(i===val.length) spans[i].classList.add("cur");
  }
}
function celebrate(code,st){
  let x,y; try{ [x,y]=prefScreen(code); }catch(e){ const w=mapwrap.getBoundingClientRect(); x=w.width/2; y=w.height/2; }
  floatText(x,y,"+ "+labelFor(code),REGION_COLOR[DATA[code].region]);
  burst(x,y,REGION_COLOR[DATA[code].region]);
  showCombo(st);
}
function confettiRain(){
  const w=mapwrap.getBoundingClientRect();
  for(let i=0;i<70;i++){
    setTimeout(()=>{
      const d=document.createElement("div"); d.className="confetti";
      d.style.left=Math.random()*w.width+"px";
      d.style.background=`hsl(${Math.random()*360},85%,62%)`;
      d.style.animationDuration=(1.6+Math.random()*1.2)+"s";
      d.style.setProperty("--fall",(w.height+50)+"px");
      d.style.setProperty("--rot",(Math.random()*760-380)+"deg");
      fxLayer.appendChild(d); setTimeout(()=>d.remove(),2900);
    }, i*28);
  }
}

// ---- answer handlers ----
function acceptFree(code){
  found.add(code); streak++; markFound(code); updateStats(); input.value=""; flash("flash-ok");
  sCorrect(streak); celebrate(code,streak);
  hint.textContent=`좋아요! ${DATA[code].ko} (${DATA[code].kanji}) · 남은 ${ROUND-found.size}`;
  if(found.size===ROUND) winGame();
}
function acceptType(){
  const code=target;
  found.add(code); streak++; queue.shift(); markFound(code);
  updateStats(); input.value=""; flash("flash-ok"); sCorrect(streak); celebrate(code,streak);
  hint.textContent=`좋아요! ${DATA[code].ko} · 🔥 ${streak}연속`;
  target=null; setTimeout(()=>{ if(!over) nextTarget(); }, 500);
}
function acceptTarget(){ // quiz & eju(name)
  const code=target;
  found.add(code); streak++; queue.shift(); markFound(code);
  updateStats(); input.value=""; flash("flash-ok"); sCorrect(streak);
  if(mode==="eju"){ ejuReveal(code,true); }
  else { celebrate(code,streak); hint.textContent=`정답! ${DATA[code].ko} (${DATA[code].kanji}) · 🔥 ${streak}연속`; }
  target=null;
  setTimeout(()=>{ if(!over) nextTarget(); }, mode==="eju"?2300:650);
}
function wrongAnswer(){
  sWrong(); flash("flash-no"); streak=0; updateStats();
  hint.textContent="❌ 오답! 다시 시도해 보세요.";
  input.value="";
}
// live handling: free & type accept as you type; quiz & eju submit on Enter
input.addEventListener("input",()=>{
  if(over||pendingStart) return;
  sClick(); popInput();
  if(mode==="type"&&target) updateTypeColor(input.value);
  const key=norm(input.value); if(!key) return;
  if(mode==="free"){
    const code=LOOKUP[key];
    if(code && !found.has(code)) acceptFree(code);
  } else if(mode==="type"){
    if(target && (norm(displayType(target))===key || DATA[target].accepted.map(norm).includes(key))) acceptType();
  }
});
// Enter = submit answer (with wrong feedback)
input.addEventListener("keydown",e=>{
  if(e.key!=="Enter") return;
  if(over||pendingStart) return;
  const key=norm(input.value);
  if(mode==="quiz" || (mode==="eju" && ejuDir==="name")){
    if(!target||!key) return;
    if(DATA[target].accepted.map(norm).includes(key)) acceptTarget(); else wrongAnswer();
  } else if(mode==="free"){
    if(!key) return;
    const code=LOOKUP[key];
    if(code && !found.has(code)) acceptFree(code);
    else if(code && found.has(code)) input.value="";
    else wrongAnswer();
  } else if(mode==="type"){
    if(target && key && (norm(displayType(target))===key || DATA[target].accepted.map(norm).includes(key))) acceptType();
  }
});

// ---- START button + 3·2·1 countdown ----
const startScreen=document.getElementById("startscreen");
function armGame(){
  pendingStart=true;
  document.getElementById("countdown").textContent="";
  document.getElementById("startbtn").style.display="";
  startScreen.style.display="flex";
  hint.textContent="▶ START를 눌러 시작하세요!";
}
function beginRound(){
  pendingStart=false; startScreen.style.display="none";
  startedAt=null; startTimer();
  if(mode==="free"){ hint.textContent="떠오르는 이름을 입력하세요!"; }
  else { nextTarget(); hint.textContent = mode==="quiz" ? "하이라이트된 곳의 이름을 입력하고 Enter!" : mode==="type" ? "화면의 이름을 그대로 따라 입력!" : "특징을 읽고 이름을 입력한 뒤 Enter!"; }
  input.value=""; input.focus();
}
function runCountdown(){
  const cd=document.getElementById("countdown"), sb=document.getElementById("startbtn");
  sb.style.display="none";
  const seq=["3","2","1","GO!"]; let i=0;
  (function step(){
    if(i>=seq.length){ cd.textContent=""; beginRound(); return; }
    cd.textContent=seq[i];
    cd.classList.remove("pulse"); void cd.offsetWidth; cd.classList.add("pulse");
    if(soundOn){ AC(); tone(i<3?659:1046,0.13,"square",0.07); if(i>=3) tone(1568,0.2,"square",0.06,0.08); }
    i++; setTimeout(step,700);
  })();
}
document.getElementById("startbtn").addEventListener("click",()=>{ if(soundOn){AC();} runCountdown(); });

function winGame(){
  over=true; stopTimer();
  hint.innerHTML=`<span class="win">🎉 완성! ${ROUND}곳 전부 맞혔어요 · 기록 ${startedAt?fmt(Date.now()-startedAt):"-"}</span>`;
  if(mode!=="free"){ tweenVB(FULL_VB); for(const c of CODES){svg.querySelector(`path[data-code="${c}"]`).classList.remove("dim","target");} document.getElementById("typetarget").innerHTML=""; document.getElementById("ejucard").style.display="none"; }
  sWin(); confettiRain();
  input.blur();
}

// ---- quiz buttons ----
document.getElementById("hintbtn").addEventListener("click",()=>{
  if(!((mode==="quiz"||mode==="eju")&&target)) return;
  hintLevel++;
  const name=labelFor(target);
  const txt = hintLevel===1 ? `💡 ${DATA[target].region} 지방`
    : `💡 ${DATA[target].region} 지방 · ${name.slice(0,Math.min(name.length,hintLevel-1))}${"○".repeat(Math.max(0,name.length-(hintLevel-1)))}`;
  if(mode==="eju"){ hint.textContent=txt; }
  else { const qh=document.getElementById("qhint"); qh.style.display="block"; qh.textContent=txt; }
  input.focus();
});
document.getElementById("skipbtn").addEventListener("click",()=>{
  if(!((mode==="quiz"||mode==="type"||mode==="eju")&&target)) return;
  streak=0; updateStats();
  queue.push(queue.shift()); // move to back
  hint.textContent="다음에 다시 물어볼게요.";
  input.value=""; nextTarget(); input.focus();
});
document.getElementById("revealbtn").addEventListener("click",()=>{
  if(mode==="eju"){
    if(!target) return;
    const code=target; revealed.add(code); streak=0;
    const p=svg.querySelector(`path[data-code="${code}"]`); p.classList.add("revealed");
    labels[code].textContent=labelFor(code); labels[code].classList.add("show");
    chipEls[code].textContent=labelFor(code); chipEls[code].classList.remove("now"); chipEls[code].style.color="#c98a00";
    sReveal(); ejuReveal(code,false); queue.shift(); updateStats();
    input.value=""; target=null; setTimeout(()=>{ if(!over) nextTarget(); }, 2300); input.focus();
    return;
  }
  if(mode!=="quiz"||!target) return;
  const code=target; revealed.add(code); streak=0;
  const p=svg.querySelector(`path[data-code="${code}"]`);
  p.classList.remove("target","dim"); p.classList.add("revealed");
  labels[code].textContent=labelFor(code); labels[code].classList.add("show");
  chipEls[code].textContent=labelFor(code); chipEls[code].classList.remove("now"); chipEls[code].style.color="#ffcf66";
  ovPaths[code].setAttribute("fill","#6b551a"); sReveal();
  queue.shift(); updateStats();
  hint.innerHTML=`정답은 <b style="color:var(--gold)">${DATA[code].ko} · ${DATA[code].kanji}</b> 였어요.`;
  input.value=""; target=null; setTimeout(()=>{ if(!over) nextTarget(); }, 900); input.focus();
});

// ---- controls ----
document.getElementById("lang").addEventListener("click",e=>{
  const b=e.target.closest("button"); if(!b)return; lang=b.dataset.l;
  [...e.currentTarget.children].forEach(x=>x.classList.toggle("on",x===b));
  document.getElementById("modehint").textContent=lang==="ko"?(mode==="quiz"?"한국어로 이름 맞히기":"한국어로 타이핑"):"日本語で入力（漢字・かな・ローマ字）";
  input.placeholder="";
  for(const c of found){ labels[c].textContent=labelFor(c); chipEls[c].textContent=labelFor(c); }
  for(const c of revealed){ labels[c].textContent=labelFor(c); chipEls[c].textContent=labelFor(c); }
  if(mode==="type"&&target){ renderTypeTarget(); updateTypeColor(input.value); }
});
document.getElementById("showlbl").addEventListener("change",e=>{
  const on=e.target.checked;
  for(const c of CODES){ if(found.has(c)||revealed.has(c)||over) labels[c].classList.toggle("show",on); }
});
document.getElementById("mode").addEventListener("click",e=>{
  const b=e.target.closest("button"); if(!b)return; const m=b.dataset.m; if(m===mode)return;
  [...e.currentTarget.children].forEach(x=>x.classList.toggle("on",x===b));
  mode=m; resetGame();
});
document.getElementById("ejudir").addEventListener("click",e=>{
  const b=e.target.closest("button"); if(!b)return; const d=b.dataset.d; if(d===ejuDir)return;
  [...e.currentTarget.children].forEach(x=>x.classList.toggle("on",x===b));
  ejuDir=d; if(mode==="eju") resetGame();
});
document.getElementById("giveup").addEventListener("click",()=>{
  if(over)return; over=true; stopTimer();
  for(const code of CODES){
    if(!found.has(code)){
      const p=svg.querySelector(`path[data-code="${code}"]`); p.classList.remove("target","dim"); p.classList.add("miss");
      const chip=chipEls[code]; chip.textContent=labelFor(code); chip.classList.remove("now"); chip.style.color="#ff9db0";
    }
    labels[code].textContent=labelFor(code); labels[code].classList.add("show");
  }
  if(mode==="quiz") tweenVB(FULL_VB);
  hint.innerHTML=`정답을 공개했어요. 맞힌 개수 <b>${found.size}/${ROUND}</b> · 빨간색이 놓친 곳이에요.`;
});
document.getElementById("themebtn").addEventListener("click",e=>{
  const dark=document.body.classList.toggle("dark");
  e.currentTarget.textContent=dark?"☀️":"🌙";
  for(const c of CODES){ if(!found.has(c)&&!revealed.has(c)) ovPaths[c].setAttribute("fill", c===target?"#ffd54f":OVU()); }
  input.focus();
});
document.getElementById("reset").addEventListener("click",()=>resetGame());
document.getElementById("soundbtn").addEventListener("click",e=>{
  soundOn=!soundOn;
  e.currentTarget.textContent=soundOn?"🔊":"🔇";
  e.currentTarget.classList.toggle("off",!soundOn);
  if(soundOn){ AC(); tone(784,0.07,"square",0.06); tone(1175,0.1,"square",0.06,0.07); }
  input.focus();
});
// ---- settings (gear) panel ----
const gearBtn=document.getElementById("gearbtn"), settingsEl=document.getElementById("settings");
gearBtn.addEventListener("click",e=>{ e.stopPropagation(); settingsEl.classList.toggle("open"); if(soundOn){AC();tone(660,0.04,"square",0.04);} });
document.addEventListener("click",e=>{ if(!settingsEl.contains(e.target) && e.target!==gearBtn) settingsEl.classList.remove("open"); });
document.getElementById("crtbtn").addEventListener("click",function(){
  const off=document.body.classList.toggle("nocrt");
  this.classList.toggle("off",off); this.textContent=off?"OFF":"ON";
  if(soundOn){AC();tone(off?400:880,0.06,"square",0.05);}
});
// ---- fullscreen toggle ----
const fsBtn=document.getElementById("fsbtn");
fsBtn.addEventListener("click",()=>{
  const el=document.documentElement, fe=document.fullscreenElement||document.webkitFullscreenElement;
  if(!fe){ (el.requestFullscreen||el.webkitRequestFullscreen||function(){}).call(el); }
  else { (document.exitFullscreen||document.webkitExitFullscreen||function(){}).call(document); }
  if(soundOn){AC();tone(660,0.05,"square",0.04);}
});
function syncFS(){ fsBtn.textContent=(document.fullscreenElement||document.webkitFullscreenElement)?"🗗":"⛶"; }
document.addEventListener("fullscreenchange",syncFS);
document.addEventListener("webkitfullscreenchange",syncFS);

function resetGame(){
  vbAnim++; stopTimer();
  found=new Set(); revealed=new Set(); startedAt=null; over=false; streak=0; target=null; queue=[]; hintLevel=0;
  ROUND = (mode==="eju") ? EJU_CODES.length : TOTAL;
  document.body.classList.toggle("quiz",mode==="quiz");
  document.body.classList.toggle("type",mode==="type");
  document.body.classList.toggle("eju",mode==="eju");
  document.body.classList.toggle("ejufeat",mode==="eju"&&ejuDir==="feat");
  document.body.classList.toggle("free",mode==="free");
  document.getElementById("timer").textContent="0:00";
  document.getElementById("qhint").style.display="none";
  document.getElementById("typetarget").innerHTML="";
  document.getElementById("ejucard").innerHTML="";
  for(const code of CODES){
    const p=svg.querySelector(`path[data-code="${code}"]`);
    p.className.baseVal="pref"; p.style.fill=""; p.querySelector("title").textContent="?";
    labels[code].classList.remove("show"); labels[code].textContent="";
    ovPaths[code].setAttribute("fill",OVU());
    const chip=chipEls[code]; chip.className="chip"; chip.textContent="•••"; chip.style.background=""; chip.style.borderColor=""; chip.style.color="";
  }
  for(const region of REGION_ORDER) updateRegionCount(region);
  updateStats();
  document.getElementById("modehint").textContent=lang==="ko"?(mode==="free"?"한국어로 타이핑":mode==="quiz"?"한국어로 이름 맞히기":mode==="type"?"화면 이름 따라 입력":"특징 읽고 지역 맞히기"):"日本語で入力";
  setVB(FULL_VB);
  if(mode!=="free"){ const pool=(mode==="eju")?EJU_CODES:CODES; queue=shuffle(pool.filter(c=>!found.has(c))); }
  armGame();
  input.value="";
}

buildPanel(); resetGame();
</script>
<div class="credit">제작자 : @konomiwosawagou</div>
</body>
</html>'''

HTML = HTML.replace("__DATA__", DATA_JS)
HTML = HTML.replace("__EJU__", EJU_JS)
open('japan_prefectures_metro.html','w').write(HTML)
print("written", len(HTML))
