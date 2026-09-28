/* =======================================================================
   MASCOT — 고양이 역장 (build_artifact.py가 growth.js 앞에 붙인다)

   와카야마 기시역의 고양이 역장 '타마'에서 온 설정. 고양이가 플레이어 옆에 서서
   반응하고, 라운드가 끝나면 역 스탬프(駅スタンプ)를 찍어 준다.

   - 그림: 사용자가 만든 캐릭터 원본 PNG (src/brand/cat → build_cat.py → mascot/).
     표정 7장 + 전신 2장. 동작은 CSS 애니메이션으로 준다.
   - 도장만 SVG로 그린다 (고무 도장이라 선화가 맞고, 글자가 매번 바뀐다).
   - API: MAS.make() 로 인스턴스를 만들고 face/pose/say 로 조종한다.
     게임 페이지에서는 MAS.stage 하나가 지도 왼쪽 아래에 자동으로 선다.
   ======================================================================= */
const MAS=(function(){

/* 캐릭터 시트에서 뽑은 색 (말풍선·도장처럼 그림 밖 요소를 맞출 때 쓴다) */
const C={
  navy:"#2b254b", cream:"#efe2d4", pink:"#fc468f", earPink:"#fc6c9c",
  yellow:"#fddb4e", cyan:"#42cfd4", purple:"#702df6", stamp:"#d9452f"
};
const REDUCED=window.matchMedia&&window.matchMedia("(prefers-reduced-motion:reduce)").matches;
let seq=0;
function E(s){ return String(s==null?"":s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c])); }
function beep(f,d,v){ try{ if(typeof soundOn!=="undefined"&&soundOn&&typeof tone==="function"){ AC(); tone(f,d,"square",v||0.045); } }catch(e){} }

/* ------------------------------------------------------------------ 그림
   사용자가 만든 캐릭터 원본 PNG를 그대로 쓴다. 상태별로 한 장씩 겹쳐 두고
   CSS(data-e)로 하나만 보여 준다 — 바꿀 때 새로 받지 않아 깜빡임이 없다.
   경로는 빌드가 정한다: 사이트는 mascot/*.png, Artifact 본문은 data URI. */
const SPR=__SPRITES__;
const FACES=["base","happy","combo","wink","focus","surprise","panic"];

function figure(opt){
  if(opt.full) return `<img class="s on" src="${SPR[opt.full===true?"full":opt.full]}" alt="고양이 역장" draggable="false">`;
  return FACES.map(f=>`<img class="s s-${f}" src="${SPR[f]}" alt="${f==="base"?"고양이 역장":""}"`+
                      ` draggable="false"${f==="base"?"":' aria-hidden="true"'}>`).join("");
}

/* ------------------------------------------------------------------ 인스턴스 */
function make(opt){
  opt=opt||{};
  const el=document.createElement("div");
  el.className="mas"+(opt.full?" full":"")+(opt.cls?" "+opt.cls:"");
  el.dataset.e="base"; el.dataset.p="idle";
  el.innerHTML=(opt.bubble===false?"":'<div class="mas-say" role="status"></div>')+
               '<div class="mas-fig">'+figure(opt)+'</div>';
  const bub=el.querySelector(".mas-say");
  let faceTimer=0, poseTimer=0, sayTimer=0;

  const api={
    el,
    /* 표정: base·happy·combo·wink·focus·surprise·panic. ms를 주면 그 뒤 base로 */
    face(e,ms){
      clearTimeout(faceTimer);
      el.dataset.e=FACES.indexOf(e)>=0?e:"base";
      if(ms) faceTimer=setTimeout(()=>{ el.dataset.e="base"; },ms);
      return api;
    },
    /* 동작: idle·jump·hop·spin·shake·point·stamp (CSS 애니메이션) */
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
      if(kind==="combo")   return api.face("combo",1600).pose("spin",800);
      if(kind==="wrong")   return api.face("panic",1400).pose("shake",600);
      if(kind==="hint")    return api.face("focus",1600).pose("point",900);
      if(kind==="surprise")return api.face("surprise",1400).pose("hop",600);
      if(kind==="clear")   return api.face("combo",3000).pose("spin",1200);
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

/* 결과 이미지(캔버스)용 비트맵 */
function loadURL(u){
  return new Promise((res,rej)=>{
    const img=new Image();
    img.onload=()=>res(img); img.onerror=rej;
    setTimeout(()=>rej(new Error("timeout")),6000);
    img.src=u;
  });
}
function image(opt){
  opt=opt||{};
  const key=opt.full?(opt.full===true?"full":opt.full):(opt.e||"base");
  return loadURL(SPR[key]||SPR.base);
}
function stampImage(o){
  return loadURL("data:image/svg+xml;charset=utf-8,"+encodeURIComponent(stampSVG(o)
    .replace('class="mas-stamp-svg"','width="250" height="250"')
    .replace(/class="mas-stamp-t"/g,'font-family="sans-serif" font-size="9" font-weight="700" letter-spacing="2"')
    .replace(/class="mas-stamp-m"/g,'font-family="sans-serif" font-weight="900"')
    .replace(/class="mas-stamp-s"/g,'font-family="sans-serif" font-size="9" font-weight="700"')));
}

/* ------------------------------------------------------------------ 게임 붙이기 */
const api={make,stampSVG,pressStamp,image,stampImage,SPR,C,stage:null};

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
