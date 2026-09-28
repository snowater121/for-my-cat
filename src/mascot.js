/* =======================================================================
   MASCOT — 고양이 역장 (build_artifact.py가 growth.js 앞에 붙인다)

   와카야마 기시역의 고양이 역장 '타마'에서 온 설정. 역장 모자를 쓴 고양이가
   플레이어 옆에 서서 반응하고, 라운드가 끝나면 역 스탬프(駅スタンプ)를 찍어 준다.

   - 그림: 캐릭터 시트를 그대로 옮긴 인라인 SVG. 표정 6개 / 동작 6개.
   - 외부 이미지가 없어서 단일 HTML에 그대로 들어가고, 색은 테마 변수를 따른다.
   - API: MAS.make() 로 인스턴스를 만들고 face/pose/say/stamp 로 조종한다.
     게임 페이지에서는 MAS.stage 하나가 지도 왼쪽 아래에 자동으로 선다.
   ======================================================================= */
const MAS=(function(){

/* 캐릭터 시트 팔레트 (스와치에서 그대로 뽑은 값) */
const C={
  navy:"#2b254b", navyDark:"#191330", navyLite:"#443a72",
  cream:"#efe2d4", pink:"#fc468f", earPink:"#fc6c9c", pad:"#f2a3b4",
  yellow:"#fddb4e", cyan:"#42cfd4", purple:"#702df6", ink:"#1b1338",
  stamp:"#d9452f"
};
const REDUCED=window.matchMedia&&window.matchMedia("(prefers-reduced-motion:reduce)").matches;
let seq=0;
function E(s){ return String(s==null?"":s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c])); }
function beep(f,d,v){ try{ if(typeof soundOn!=="undefined"&&soundOn&&typeof tone==="function"){ AC(); tone(f,d,"square",v||0.045); } }catch(e){} }

/* ------------------------------------------------------------------ 얼굴 부품
   눈은 x좌표만 받아 좌우를 같은 함수로 그린다. 표정별 그룹을 전부 넣어 두고
   CSS(data-e)로 하나만 보여 준다 — 표정을 바꿔도 DOM을 다시 만들지 않는다. */
function eyeOpen(x,u,big){
  const rx=big?10.5:9.5, ry=big?12.5:11.5, pr=big?3.4:4.6, py=big?7:7.6;
  return `<ellipse cx="${x}" cy="40" rx="${rx}" ry="${ry}" fill="url(#me${u})" stroke="${C.ink}" stroke-width="1.6"/>`+
         `<ellipse cx="${x+0.8}" cy="41" rx="${pr}" ry="${py}" fill="${C.ink}"/>`+
         `<circle cx="${x-3.2}" cy="34.2" r="3.1" fill="#fff"/>`+
         `<circle cx="${x+3.4}" cy="45.4" r="1.5" fill="#fff" opacity=".65"/>`;
}
function eyeArc(x){   // ^ ^ 웃는 눈
  return `<path d="M${x-8.5},43 Q${x},31.5 ${x+8.5},43" fill="none" stroke="${C.ink}" stroke-width="3.6" stroke-linecap="round"/>`;
}
function eyeNarrow(x,u){   // 집중 — 가늘게 뜬 눈
  return `<path d="M${x-9.5},40 Q${x},32.5 ${x+9.5},40 Q${x},47.5 ${x-9.5},40Z" fill="url(#me${u})" stroke="${C.ink}" stroke-width="1.6"/>`+
         `<ellipse cx="${x}" cy="40" rx="3.4" ry="4.4" fill="${C.ink}"/>`+
         `<circle cx="${x-2.6}" cy="37.6" r="1.7" fill="#fff"/>`;
}
function eyeSwirl(x){ // 당황 — 빙글빙글
  return `<circle cx="${x}" cy="40" r="10" fill="#fff" stroke="${C.ink}" stroke-width="1.6"/>`+
         `<path d="M${x},32.6 a7.4,7.4 0 1,1 -6.4,3.7 a4.6,4.6 0 1,0 4.4,-2.4 a2,2 0 1,0 -1.4,2.9"`+
         ` fill="none" stroke="${C.ink}" stroke-width="2" stroke-linecap="round"/>`;
}
function blush(){
  return `<ellipse cx="34" cy="52" rx="7" ry="4.4" fill="${C.pink}" opacity=".45"/>`+
         `<ellipse cx="86" cy="52" rx="7" ry="4.4" fill="${C.pink}" opacity=".45"/>`;
}
const MOUTH={
  base:`<path d="M53.5,57.5 Q57,61.3 60,57.8 Q63,61.3 66.5,57.5" fill="none" stroke="${C.ink}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>`+
       `<path d="M56,57 L58.6,57 L57.3,61.4Z" fill="#fff"/>`,
  open:`<path d="M49,54.5 Q60,74 71,54.5 Q60,60 49,54.5Z" fill="#7d2440"/>`+
       `<path d="M53.5,60 Q60,69.5 66.5,60 Q60,63 53.5,60Z" fill="${C.earPink}"/>`+
       `<path d="M51.5,55.6 L55,55.2 L53.4,59.6Z" fill="#fff"/>`+
       `<path d="M68.5,55.6 L65,55.2 L66.6,59.6Z" fill="#fff"/>`,
  line:`<path d="M54,58.5 L66,58.5" fill="none" stroke="${C.ink}" stroke-width="2.4" stroke-linecap="round"/>`,
  o:`<ellipse cx="60" cy="59" rx="4.4" ry="5.4" fill="#7d2440"/>`,
  wave:`<path d="M52.5,58.6 q3.5,-3.6 7,0 t7,0" fill="none" stroke="${C.ink}" stroke-width="2.4" stroke-linecap="round"/>`
};

/* ------------------------------------------------------------------ 본체 SVG */
function svgMarkup(u,opt){
  /* 역장 모자: 챙이 넓은 제모. 귀 끝은 양옆으로 삐져나오게 폭을 맞췄다 */
  const cap=opt.cap===false?"":(
    `<g class="m-cap" transform="rotate(-6 60 4)">`+
      `<path d="M35,11 C35,-6 46,-14 60,-14 C74,-14 85,-6 85,11 Z" fill="#3a3168"`+
        ` stroke="${C.cream}" stroke-opacity=".55" stroke-width="1.8" stroke-linejoin="round"/>`+
      `<path d="M36,10 C36.5,-3 44,-10 54,-12.4 C45,-7 41,1 40,10 Z" fill="#544a8c" opacity=".7"/>`+
      `<path d="M29,15.5 C43,25 77,25 91,15.5 C91,23 78,28.5 60,28.5 C42,28.5 29,23 29,15.5 Z"`+
        ` fill="#0f0a2c" stroke="${C.cream}" stroke-opacity=".5" stroke-width="1.6" stroke-linejoin="round"/>`+
      `<path d="M31,17.6 C44,25 76,25 89,17.6 C88,19.8 85,21.6 81,22.8 C70,26 50,26 39,22.8 C35,21.6 32,19.8 31,17.6 Z" fill="#241d52"/>`+
      `<rect x="30" y="7.4" width="60" height="9" rx="4.5" fill="${C.yellow}" stroke="#b8871f" stroke-opacity=".5" stroke-width="1"/>`+
      `<rect x="30" y="13.6" width="60" height="2.4" rx="1.2" fill="#d9a92c" opacity=".55"/>`+
      `<circle cx="60" cy="-2.5" r="5.6" fill="${C.cyan}" stroke="${C.ink}" stroke-width="1.3"/>`+
      `<path d="M57.2,-3.6 h2.2 v2.2 h-2.2z M61,-5.6 h2.4 v2.4 h-2.4z M58.6,0 h2.6 v2 h-2.6z" fill="#2e8f5e"/>`+
    `</g>`);
  /* 그림 파일로 내보낼 때(결과 이미지)는 페이지 CSS가 없으므로 표정 선택 규칙을 안에 넣는다 */
  const MOF={base:"base",wink:"base",happy:"open",focus:"line",surprise:"o",panic:"wave"};
  const e=opt.e||"base";
  const alone=opt.standalone
    ? ` width="${opt.w||240}" height="${Math.round((opt.w||240)*147/120)}"`
    : "";
  const inlineCSS=opt.standalone
    ? `<style>.f,.mo{display:none}.f-${e}{display:block}.mo-${MOF[e]||"base"}{display:block}`+
      `.m-mark{opacity:${e==="surprise"?1:0}}.m-sweat{opacity:${e==="panic"?1:0}}</style>`
    : "";
  return `<svg class="mas-svg" viewBox="0 -19 120 147"${alone} xmlns="http://www.w3.org/2000/svg" role="img" aria-label="고양이 역장">${inlineCSS}
<defs>
 <linearGradient id="mb${u}" x1="0" y1="0" x2=".3" y2="1">
   <stop offset="0" stop-color="${C.navyLite}"/><stop offset=".5" stop-color="${C.navy}"/><stop offset="1" stop-color="${C.navyDark}"/></linearGradient>
 <linearGradient id="mh${u}" x1=".2" y1="0" x2=".75" y2="1">
   <stop offset="0" stop-color="#4b4079"/><stop offset=".55" stop-color="${C.navy}"/><stop offset="1" stop-color="#1e1841"/></linearGradient>
 <linearGradient id="mt${u}" x1="0" y1="1" x2=".35" y2="0">
   <stop offset="0" stop-color="${C.navy}"/><stop offset=".42" stop-color="${C.navy}"/>
   <stop offset=".72" stop-color="${C.pink}"/><stop offset="1" stop-color="${C.cyan}"/></linearGradient>
 <radialGradient id="me${u}" cx=".34" cy=".26" r=".88">
   <stop offset="0" stop-color="#fff2ad"/><stop offset=".55" stop-color="${C.yellow}"/><stop offset="1" stop-color="#eda42a"/></radialGradient>
 <radialGradient id="mg${u}" cx=".34" cy=".3" r=".82">
   <stop offset="0" stop-color="#8aeaee"/><stop offset="1" stop-color="#1f8fa2"/></radialGradient>
</defs>

<g class="m-all">
  <!-- 꼬리: 끝으로 갈수록 핑크→시안 (시트의 그라데이션 꼬리) -->
  <g class="m-tail"><path d="M79,103 C101,105 113,91 111,73 C110,61 102,54 96,56"
     fill="none" stroke="url(#mt${u})" stroke-width="12" stroke-linecap="round"/></g>

  <!-- 뒷발 -->
  <ellipse cx="45" cy="115.5" rx="11" ry="7.5" fill="${C.cream}"/>
  <ellipse cx="75" cy="115.5" rx="11" ry="7.5" fill="${C.cream}"/>
  <ellipse cx="45" cy="117" rx="4.2" ry="2.7" fill="${C.pad}"/>
  <ellipse cx="75" cy="117" rx="4.2" ry="2.7" fill="${C.pad}"/>

  <!-- 몸통 -->
  <path d="M60,64 C78,64 90,79 90,96 C90,111 77,119.5 60,119.5 C43,119.5 30,111 30,96 C30,79 42,64 60,64Z" fill="url(#mb${u})"/>
  <path d="M60,72 C70,72 77,83 77,95 C77,108 69,114 60,114 C51,114 43,108 43,95 C43,83 50,72 60,72Z" fill="${C.cream}"/>
  <!-- 포인트 마크 (시트의 픽셀 십자) -->
  <path d="M85,88 h2.6 v-2.6 h2.6 v2.6 h2.6 v2.6 h-2.6 v2.6 h-2.6 v-2.6 h-2.6z" fill="${C.pink}" opacity=".9"/>

  <!-- 팔 -->
  <g class="m-arm m-arm-l"><ellipse cx="28" cy="95" rx="8.6" ry="11.5" transform="rotate(-14 28 95)" fill="url(#mb${u})"/>
    <ellipse cx="25.6" cy="103.5" rx="7.4" ry="6.4" fill="${C.cream}"/>
    <ellipse cx="25.6" cy="104.5" rx="3.1" ry="2.2" fill="${C.pad}"/></g>
  <g class="m-arm m-arm-r"><ellipse cx="92" cy="95" rx="8.6" ry="11.5" transform="rotate(14 92 95)" fill="url(#mb${u})"/>
    <ellipse cx="94.4" cy="103.5" rx="7.4" ry="6.4" fill="${C.cream}"/>
    <ellipse cx="94.4" cy="104.5" rx="3.1" ry="2.2" fill="${C.pad}"/></g>

  <!-- 머리 -->
  <g class="m-head">
    <polygon points="30,36 23,4 57,21" fill="url(#mh${u})" stroke="url(#mh${u})" stroke-width="7" stroke-linejoin="round"/>
    <polygon points="90,36 97,4 63,21" fill="url(#mh${u})" stroke="url(#mh${u})" stroke-width="7" stroke-linejoin="round"/>
    <polygon points="32,31 28.5,13 48,23" fill="${C.earPink}" stroke="${C.earPink}" stroke-width="4.4" stroke-linejoin="round"/>
    <polygon points="88,31 91.5,13 72,23" fill="${C.earPink}" stroke="${C.earPink}" stroke-width="4.4" stroke-linejoin="round"/>
    <path d="M36.5,20 h2.4 v-2.4 h2.4 v2.4 h2.4 v2.4 h-2.4 v2.4 h-2.4 v-2.4 h-2.4z" fill="${C.cyan}"/>

    <ellipse cx="60" cy="42" rx="34" ry="32" fill="url(#mh${u})"/>
    <ellipse cx="60" cy="56" rx="18.5" ry="12" fill="${C.cream}"/>

    <g class="f f-base">${eyeOpen(45,u)}${eyeOpen(75,u)}</g>
    <g class="f f-wink">${eyeOpen(45,u)}${eyeArc(75)}</g>
    <g class="f f-happy">${eyeArc(45)}${eyeArc(75)}${blush()}</g>
    <g class="f f-focus">${eyeNarrow(45,u)}${eyeNarrow(75,u)}</g>
    <g class="f f-surprise">${eyeOpen(45,u,1)}${eyeOpen(75,u,1)}</g>
    <g class="f f-panic">${eyeSwirl(45)}${eyeSwirl(75)}${blush()}</g>

    <path d="M56.6,48.4 h6.8 q1.6,0 0.8,1.5 l-2.6,3.4 q-1.6,1.8 -3.2,0 l-2.6,-3.4 q-0.8,-1.5 0.8,-1.5z" fill="${C.pink}"/>
    <g class="mo mo-base">${MOUTH.base}</g>
    <g class="mo mo-open">${MOUTH.open}</g>
    <g class="mo mo-line">${MOUTH.line}</g>
    <g class="mo mo-o">${MOUTH.o}</g>
    <g class="mo mo-wave">${MOUTH.wave}</g>
    ${cap}
  </g>

  <!-- 목걸이 (픽셀 지구) -->
  <path d="M45,69 C51,79 69,79 75,69" fill="none" stroke="${C.yellow}" stroke-width="2.4"/>
  <circle cx="60" cy="80.5" r="8.6" fill="${C.yellow}"/>
  <circle cx="60" cy="80.5" r="6.2" fill="url(#mg${u})"/>
  <path d="M56.6,78 h2.4 v2 h-2.4z M60.4,76.6 h2.6 v2.2 h-2.6z M57.8,82 h3 v2 h-3z M61.6,81.4 h2 v2 h-2z" fill="#3aa46a"/>
</g>

<!-- 놀람·정답 때만 보이는 효과 -->
<g class="m-mark"><path d="M104,18 v11 M104,33.5 v2.6" stroke="${C.yellow}" stroke-width="4" stroke-linecap="round"/>
  <path d="M113,20 v11 M113,35.5 v2.6" stroke="${C.pink}" stroke-width="4" stroke-linecap="round"/></g>
<g class="m-sweat"><path d="M99,40 c0,-6 5,-10 5,-10 s5,4 5,10 a5,5 0 0,1 -10,0z" fill="#7fd6f5" stroke="#3b9fd0" stroke-width="1.2"/></g>
</svg>`;
}

/* ------------------------------------------------------------------ 인스턴스 */
function make(opt){
  opt=opt||{};
  const u=++seq;
  const el=document.createElement("div");
  el.className="mas"+(opt.cls?" "+opt.cls:"");
  el.dataset.e="base"; el.dataset.p="idle";
  el.innerHTML=(opt.bubble===false?"":'<div class="mas-say" role="status"></div>')+
               '<div class="mas-fig">'+svgMarkup(u,opt)+'</div>';
  const bub=el.querySelector(".mas-say");
  let faceTimer=0, poseTimer=0, sayTimer=0;

  const api={
    el,
    /* 표정: base·wink·happy·focus·surprise·panic. ms를 주면 그 뒤 base로 돌아온다 */
    face(e,ms){
      clearTimeout(faceTimer); el.dataset.e=e;
      if(ms) faceTimer=setTimeout(()=>{ el.dataset.e="base"; },ms);
      return api;
    },
    /* 동작: idle·jump·run·hop·shake·point·stamp */
    pose(p,ms){
      clearTimeout(poseTimer); el.dataset.p="idle";
      void el.offsetWidth;                       // 같은 동작을 연달아 줘도 다시 재생되도록
      el.dataset.p=p;
      if(ms) poseTimer=setTimeout(()=>{ el.dataset.p="idle"; },ms);
      return api;
    },
    /* 말풍선. ms가 0이면 계속 띄워 둔다 */
    say(html,ms){
      if(!bub) return api;
      clearTimeout(sayTimer);
      if(!html){ bub.classList.remove("on"); bub.innerHTML=""; return api; }
      bub.innerHTML=html; bub.classList.add("on");
      if(ms) sayTimer=setTimeout(()=>bub.classList.remove("on"),ms);
      return api;
    },
    hush(){ return api.say(""); },
    show(on){ el.classList.toggle("off",on===false); return api; },
    /* 자주 쓰는 반응 묶음 */
    react(kind){
      if(kind==="ok")      return api.face("happy",1200).pose("jump",700);
      if(kind==="combo")   return api.face("happy",1500).pose("spin",800);
      if(kind==="wrong")   return api.face("panic",1400).pose("shake",600);
      if(kind==="hint")    return api.face("focus",1600).pose("point",900);
      if(kind==="surprise")return api.face("surprise",1400).pose("hop",600);
      if(kind==="clear")   return api.face("happy",3000).pose("spin",1200);
      return api.face("base");
    }
  };
  return api;
}

/* ------------------------------------------------------------------ 역 스탬프
   라운드가 끝나면 고양이가 찍어 주는 도장. 기시역 스탬프처럼 둥근 테두리 안에
   고양이 얼굴과 문구를 넣는다. 색은 주홍 잉크 한 가지. */
function stampSVG(o){
  o=o||{};
  const top=(o.top||"GEO ARCADE").toUpperCase();
  const mid=o.mid||"완주";
  const sub=o.sub||"";
  const date=o.date||"";
  const ms=mid.length<=2?18:(mid.length===3?15:12);   // 글자 수에 맞춰 크기를 줄인다
  const ink=o.ink||"currentColor";                    // 기본은 CSS의 color (테마별로 다름)
  const u=++seq;
  return `<svg class="mas-stamp-svg" viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${E(mid)} 스탬프">
<defs><path id="sa${u}" d="M60,60 m-45,0 a45,45 0 1,1 90,0"/></defs>
<circle cx="60" cy="60" r="55.5" fill="none" stroke="${ink}" stroke-width="3.4"/>
<circle cx="60" cy="60" r="49" fill="none" stroke="${ink}" stroke-width="1.5"/>
<text class="mas-stamp-t" fill="${ink}"><textPath href="#sa${u}" startOffset="50%" text-anchor="middle">${E(top)}</textPath></text>
<g stroke="${ink}" stroke-width="2.8" fill="none" stroke-linejoin="round" stroke-linecap="round">
  <path d="M42,40 L38.5,25 L53,32.5"/><path d="M78,40 L81.5,25 L67,32.5"/>
  <path d="M60,28.5 a20,17.5 0 1,1 -0.1,0z"/>
  <path d="M52,39.5 q3,-3.6 6,0"/><path d="M62,39.5 q3,-3.6 6,0"/>
  <path d="M57,46.5 q3,3.4 6,0"/>
  <path d="M40.5,44 h-8 M40.5,48.5 h-7.5 M79.5,44 h8 M79.5,48.5 h7.5"/>
</g>
<text class="mas-stamp-m" x="60" y="79" text-anchor="middle" fill="${ink}" style="font-size:${ms}px">${E(mid)}</text>
${sub?`<text class="mas-stamp-s" x="60" y="90" text-anchor="middle" fill="${ink}">${E(sub)}</text>`:""}
${date?`<text class="mas-stamp-s" x="60" y="101.5" style="font-size:8px" text-anchor="middle" fill="${ink}" opacity=".85">${E(date)}</text>`:""}
</svg>`;
}

/* 결과 창에서 "쾅" 찍는 연출 */
function pressStamp(box,o,cat){
  if(!box) return;
  box.innerHTML=`<div class="mas-stamp">${stampSVG(o)}</div>`;
  const s=box.firstChild;
  if(REDUCED){ s.classList.add("on"); return; }
  if(cat) cat.pose("stamp",900).face("focus",600);
  setTimeout(()=>{ s.classList.add("hit"); beep(180,0.09,0.07); beep(120,0.16,0.05); if(cat) cat.face("happy",1600); },260);
  setTimeout(()=>s.classList.add("on"),260);
}

/* 결과 이미지(캔버스)에 그리려면 비트맵이 필요하다 — SVG를 data URL 이미지로 */
function load(svg){
  return new Promise((res,rej)=>{
    const img=new Image();
    img.onload=()=>res(img); img.onerror=rej;
    setTimeout(()=>rej(new Error("timeout")),4000);
    img.src="data:image/svg+xml;charset=utf-8,"+encodeURIComponent(svg);
  });
}
function image(opt){
  opt=Object.assign({standalone:true,w:300,e:"happy"},opt||{});
  return load(svgMarkup(++seq,opt));
}
function stampImage(o){
  return load(stampSVG(o)
    .replace('class="mas-stamp-svg"','width="250" height="250"')
    .replace(/class="mas-stamp-t"/g,'font-family="sans-serif" font-size="9" font-weight="700" letter-spacing="2"')
    .replace(/class="mas-stamp-m"/g,'font-family="sans-serif" font-weight="900"')
    .replace(/class="mas-stamp-s"/g,'font-family="sans-serif" font-size="9" font-weight="700"'));
}

/* ------------------------------------------------------------------ 게임 붙이기 */
const api={make,stampSVG,pressStamp,image,stampImage,C,stage:null};

function attach(){
  const wrap=document.querySelector(".mapwrap");
  if(!wrap||typeof sCorrect!=="function") return;           // 게임 페이지가 아니면 아무것도 안 한다
  const cat=make({cls:"mas-stage"});
  wrap.appendChild(cat.el); api.stage=cat;

  /* 정답·오답 효과음은 타이핑·4지선다 어느 쪽이든 반드시 지나간다 — 여기만 감싸면 전부 잡힌다 */
  const _ok=sCorrect, _no=sWrong;
  sCorrect=function(st){
    _ok(st);
    if(st>0&&st%5===0){ cat.react("combo"); cat.say("🔥 "+st+"연속!",1700); }
    else cat.react("ok");
  };
  sWrong=function(){ _no(); cat.react("wrong"); };
  const _win=winGame;
  winGame=function(){ _win(); cat.react("clear"); cat.say("전 구간 완주! 도장 찍어 줄게 🐾",3200); };
  /* 힌트는 같이 고민하는 표정, 정답 보기·넘어가기는 시무룩 */
  const hb=document.getElementById("hintbtn"), rb=document.getElementById("revealbtn"), sb=document.getElementById("skipbtn");
  if(hb) hb.addEventListener("click",()=>{ cat.react("hint"); cat.say("이 근처였는데…",1800); });
  if(rb) rb.addEventListener("click",()=>{ cat.face("panic",1600).pose("shake",600); });
  if(sb) sb.addEventListener("click",()=>{ cat.face("focus",1400); });

  /* 라운드 시작 카운트다운에 맞춰 준비 자세 */
  const stbtn=document.getElementById("startbtn");
  if(stbtn) stbtn.addEventListener("click",()=>{ cat.hush(); cat.face("focus",2600).pose("hop",600); });
}

/* 이 파일은 게임 스크립트 맨 끝(문서 마지막)에 붙으므로 DOM은 이미 있다.
   혹시 더 앞에서 실행되더라도 한 번 더 시도한다. */
try{ attach(); }catch(e){}
if(!api.stage) document.addEventListener("DOMContentLoaded",()=>{ try{ attach(); }catch(e){} });

return api;
})();
