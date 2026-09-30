# 프로젝트 인수인계 (Claude Code 이어작업용)

> 지하철 메트로 타이핑 스타일의 **지리 암기 게임**. 일본 도도부현 / 세계 국가 두 버전 + 아케이드 로비.
> 이 문서 하나만 Claude Code에 붙여넣으면 맥락을 이어받아 작업할 수 있도록 정리함.

---

## 1. 한 줄 요약

Metro Memory 류의 타이핑 지리 암기 게임을 만든다. 장소 이름을 타이핑하면 지도가 채워지고, 카운트업 타이머와 진행도가 표시된다. 일본판(47 도도부현), 세계판(256개국), 그리고 둘을 고르는 뉴트로 아케이드 로비로 구성. GitHub Pages 배포 대상(여자친구가 EJU/지리 공부용으로 플레이).

---

## 2. 최종 산출물 (배포 대상 3개 파일)

| 파일 | 설명 | 생성 방식 |
|---|---|---|
| `index.html` | 뉴트로 아케이드 **로비** (일본/세계 선택) | **직접 손으로 작성** (빌더 없음) |
| `japan_prefectures_metro.html` | 일본 도도부현 게임 | `build_html2.py` 가 생성 |
| `world_countries_metro.html` | 세계 국가 게임 | `build_world.py` 가 생성 |

모두 **단일 self-contained HTML** (외부 빌드 불필요, 그대로 GitHub Pages 업로드).

### 빌더 & 데이터 파일 (소스, 저장소에 함께 두면 유지보수 편함)
| 파일 | 역할 |
|---|---|
| `build_html2.py` | 일본판 빌더. `HTML = r'''...'''` 템플릿 안의 `__DATA__` / `__EJU__` 를 `data.json`/`eju.json`으로 치환 → `japan_prefectures_metro.html` 출력 |
| `build_world.py` | 세계판 빌더. `build_html2.py`의 `HTML` 템플릿을 읽어 **문자열 치환(transform)** 으로 세계판 생성 (viewBox/대륙/언어/EJU제거 등) → `world_countries_metro.html` 출력 |
| `data.json` | 일본 47 도도부현: `ko/kanji/kana/romaji/region/accepted/d(SVG path)` |
| `eju.json` | EJU 41 도도부현: `cat/clues/detail/ko/kanji/region` |
| `world.json` | 256개국: `ko/kanji=en/kana=en/romaji=en/region=대륙/accepted/d` |

> **중요:** 세계판은 일본판 템플릿을 재사용한다. 그래서 **게임 로직을 고칠 때는 `build_html2.py`의 `HTML` 템플릿을 고친 뒤 두 빌더를 모두 다시 실행**해야 한다.

### 재빌드 명령
```bash
cd <outputs 폴더>
python3 build_html2.py    # japan_prefectures_metro.html 생성
python3 build_world.py    # world_countries_metro.html 생성
node --check <(sed -n '/<script>/,/<\/script>/p' japan_prefectures_metro.html)  # 문법 확인(선택)
```

---

## 3. 게임 기능 / 모드 (state machine)

`mode` 상태값으로 4개 모드 전환:

- **`quiz`** (기본값): 지역이 클로즈업/줌 → 이름을 타이핑해서 맞춤. Enter로 제출, 오답 시 사운드+피드백.
- **`free`**: 자유 타이핑 (전체 지도에서 아무거나 채우기).
- **`type`**: 순수 타자연습. 클로즈업되고 정답이 이미 칸에 적혀 있어 따라 침.
- **`eju`** (일본판 전용): EJU 유학시험 대비. `ejuDir` 서브상태로 방향 전환:
  - `feat`: 특징(특산물/건축양식/대표건물 등)을 보여주고 → 지역명 타이핑
  - `name`: 지역명을 먼저 보여주고 → 특징 4지선다 선택
  - EJU 빈출 핵심 위주, 한국어+일본어 용어 병기.

기타 공통:
- **입력 언어 토글**: 일본판=한국어/일본어(漢字·かな·ローマ字), 세계판=한국어/English
- **ROUND** 변수 = 총 문항수 (일본 47 / EJU 41 / 세계 256)
- **START 버튼 → 3-2-1 카운트다운 → 타이머 시작** (타이머는 `beginRound()`에서 시작)
- 카운트업 타이머 + 진행도 표시

---

## 4. UI / 연출 (뉴트로 아케이드 컨셉)

- **스타일**: 신스웨이브 아케이드. 그리드 바닥, 픽셀 태양, CRT 스캔라인, Press Start 2P / VT323 / Noto Sans KR 폰트.
- **로비(index.html)**: "GEO ARCADE" 타이틀, INSERT COIN, 캐비닛 카드 2개(🗾 일본 / 🌍 세계).
- **CRT 부팅 인트로**: 페이지 로드 시 옛날 TV 켜지는 "지지직" 연출 (`#crton` 오버레이 — bars/seam/noise).
- **아케이드 사운드**: Web Audio API 로 칩튠 square-wave SFX 생성 (오디오 파일 없음).
- **설정 기어(⚙️)** 우측 상단: CRT 토글 / 사운드 / 테마(주/야간) / 라벨표시 통합.
- **전체화면 버튼(⛶)** 우측 상단 (3개 페이지 전부). Fullscreen API 사용, 토글 시 아이콘 🗗↔⛶.
- **제작자 크레딧**: 우측 하단 `제작자 : @konomiwosawagou` (모든 페이지).
- **글리치 강도**: 야간 모드 스캔라인 alpha `#00000014`, 주간 모드는 더 약하게(`#0000000a`, opacity .6) + 화이트톤 아케이드.
- **모바일 반응형**: `@media(max-width:600px)` 컴팩트 헤더(brand/도구/스탯 세로 재배치, 버튼·칩·카드 축소, .typinglabel 숨김) + `@media(max-height:520px) and (orientation:landscape)`.

### 전체화면 버튼 구현 스니펫 (참고)
헤더에 `<button class="btn" id="fsbtn" title="전체화면 전환">⛶</button>` 추가 + JS:
```js
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
```

---

## 5. 데이터 출처 & 좌표

- 일본 SVG path: `react-svgmap-japan` npm 패키지. viewBox `-40 -5 650 546`.
- 세계 SVG path: `@svg-maps/world` npm 패키지. viewBox `0 0 1010 666`.
- npm 패키지는 샌드박스에서 `registry.npmjs.org` tarball로 받아 추출 (jsdelivr는 allowlist 프록시에 막힘).

---

## 6. 이미 겪은 버그 & 해결 (다시 밟지 말 것)

1. **지역명 힌트 버그**: 사가현 region이 "규슈·오키나와"라 힌트에 "오키나와"가 노출됨 → 표준 8지방 + 별도 "오키나와" region으로 분리. (茶 랭킹, 大分 온천 日本一, 和歌山 みかん/梅 1위 등 WebSearch로 검증 완료)
2. **build_world.py가 `#ejudir` 엘리먼트를 통째로 제거** → `getElementById("ejudir").addEventListener`가 null 에러. **해결: EJU 모드 버튼만 제거하고 `#ejudir` 엘리먼트는 숨겨서 유지.** (build_world.py 29행 주석 참고)
3. 플레이스홀더 색 오타 `#5a6舎`(이상한 글자 섞임) → `#5b6a82`로 수정.
4. **타이머가 안 돌던 문제**: 첫 정답 때만 시작됨 → START 카운트다운 후 `beginRound()`에서 타이머 시작하도록 수정.
5. GitHub raw fetch가 빈 응답 / 샌드박스 프록시가 jsdelivr 차단 → registry.npmjs.org tarball 사용.

---

## 7. build_world.py의 변환(transform) 목록 (세계판 생성 규칙)

일본 템플릿 → 세계판으로 바꿀 때 하는 문자열 치환:
- `const EJU = __EJU__;` → `const EJU = {};` (EJU 비활성)
- `REGION_ORDER`/`REGION_COLOR` → 대륙(아시아/유럽/아프리카/북·중미/남아메리카/오세아니아/기타)
- viewBox `-40 -5 650 546` → `0 0 1010 666`, `FULL_VB` 동일 교체
- 타이틀/브랜드 문구 교체
- EJU 모드 **버튼만** 제거 (`#ejudir` 엘리먼트는 유지)
- switch 버튼 링크: 세계 → 일본 방향으로
- 언어 토글 `日本語` → `English`, 입력 안내문 → "영어(English)로 입력"
- 라벨 폰트 `8px` → `6px` (조밀한 세계지도용)
- `__DATA__` → world.json

---

## 8. GitHub Pages 배포

3개 파일(`index.html`, `japan_prefectures_metro.html`, `world_countries_metro.html`)을 리포지터리에 업로드 → Settings > Pages 활성화. `index.html`이 로비 진입점. 재배포 후 반영 안 되면 캐시 → `Ctrl+Shift+R`.

---

## 9. 남은/논의됐던 후보 작업 (요청 시)

- (미요청) **진짜 단일 페이지 통합판**: 페이지 이동 없이 일본↔세계 토글. 현재는 로비에서 링크로 이동하는 방식. 사용자가 원하면 구현.

---

## 10. 파일 경로 메모

이 세션 outputs 폴더에 위 모든 파일이 있음. Claude Code에서는 해당 폴더를 작업 디렉토리로 열고, 코드 수정은 `build_html2.py` 템플릿에서 하고 두 빌더를 재실행하는 흐름을 유지할 것.

---

## 11. 2026-09-06 갱신 — 소스 복원 + 통합 아티팩트 + 기록 시스템

### 11.1 소스 복원
코워크 세션(`local_353a16b5-…`)의 outputs에서 빌더·데이터를 `src/`로 복원 완료.
복원 직후 재빌드해서 기존 배포본과 **바이트 단위 동일**함을 확인했다. 요청 이력은 `WORKLOG.md`.

### 11.2 파일 구성
```
index.html                     로비 (손으로 작성, 빌더 없음)
japan_prefectures_metro.html   일본판      ← src/build_html2.py
world_countries_metro.html     세계판      ← src/build_world.py
geo_arcade.html                통합 단독본 ← src/build_artifact.py  (GitHub Pages용)
artifact/geo_arcade.html       통합 Artifact 본문 ← src/build_artifact.py
src/                           빌더 + data.json / eju.json / world.json
WORKLOG.md                     코워크 세션 요청 이력 29건
_previews/                     당시 미리보기 이미지
```

### 11.3 재빌드
```bash
cd src
python3 build_html2.py && python3 build_world.py && mv *_metro.html ..
python3 build_artifact.py      # ../geo_arcade.html 과 ../artifact/geo_arcade.html 동시 출력
```
`build_artifact.py`의 모든 치환은 `sub()`로 **개수를 검증**한다. 템플릿이 바뀌어 치환 대상이
사라지면 빌드가 조용히 넘어가지 않고 즉시 AssertionError로 실패한다.

### 11.4 통합 아티팩트 (HANDOFF §9의 "단일 페이지 통합판" 구현)
- `DATASETS = {jp, world}` 하나에 두 지도를 담고 헤더 `#dset` 토글로 전환.
- 전환 시 `loadDataset(key)`가 SVG·패널·LOOKUP·bbox·labels·ovPaths·chipEls를 전부 비우고 재구축.
- 세계 선택 시 `body.world` → 라벨 6px 축소 + EJU 모드 버튼 숨김 + 언어 토글 English.
- 로비/스위치 링크 제거(한 페이지라 불필요), 대신 `🏆 기록` 버튼 추가.

### 11.5 기록 시스템
`P` 객체 하나에 모두 담는다: `{name, best{}, misses{}, stats{}}`
- **모드별 최고 기록** `best["<ds>_<mode>"] = {found, round, ms, at}` — 정답 수 우선, 동률이면 시간
- **약점 지역** `misses["<ds>:<CODE>"]` — 오답 / 정답 보기 / 넘어가기에서 집계
- **누적 통계** `stats{plays, clears, totalMs, correct, wrong, bestStreak}`

저장소는 이중화:
- `localStorage["geoarcade.player.v2"]` — **항상** 저장
- `db` 캐퍼빌리티 — `claude.use("db")`가 살아있을 때만 `players/<slug>` 문서에 동기화하고
  `players` 컬렉션 구독으로 공유 랭킹판을 그린다. `null`이면 조용히 로컬 전용으로 동작.

`slugName()`은 **ASCII 전용**으로 만들 것. 한글/가나 문자 클래스를 정규식에 넣었더니
문서 인코딩이 UTF-8이 아닐 때 "Range out of order" SyntaxError로 스크립트 전체가 죽었다.
지금은 ASCII 부분 + djb2 해시 조합으로 만든다.

### 11.6 다시 밟지 말 것 (신규)
6. **Artifact 본문에는 `<!DOCTYPE>`/`<html>`/`<head>`/`<body>` 금지** — 발행 시 호스트가 감싼다.
   따라서 `<meta charset>`도 없다. 로컬에서 file://이나 charset 헤더 없는 서버로 열면
   windows-1252로 해석돼 한글이 깨지고 정규식까지 터진다. 로컬 확인은 `geo_arcade.html`
   (단독본, head 포함)으로 할 것.
7. **잔여 토큰 검사에서 `"<head"`를 쓰면 `<header>`를 오탐한다.** `"<head>"`로 정확히 검사.
8. **기록 패널 마크업을 `</script>` 뒤에 두면 안 된다.** 스크립트가 `getElementById`로
   잡을 수 없어 null 에러. `<footer>` 앞에 삽입한다.
9. `body` 초기 클래스를 마크업에 못 쓰므로 부팅 시 `document.body.classList.add("dark")` 필요.

### 11.7 배포 상태
- **Artifact**(공유 랭킹판): https://claude.ai/code/artifact/50678096-4d7d-4615-a271-1c66f16ee68f
  `db`를 선언한 아티팩트는 **조직 내부 전용**이라 공개 공유가 안 된다. 같은 조직 계정으로
  로그인한 사람만 랭킹판에 참여할 수 있다.
- **GitHub Pages**: `geo_arcade.html`을 올리면 통합판이 동작한다(기록은 기기별 localStorage).
  기존 3개 파일도 그대로 유효하며, `/47` 하드코딩 버그 수정본으로 교체 필요.

### 11.8 반응형 재작업 (모바일 깨짐 수정)

기존 `@media` 3블록을 통째로 다시 썼다. 핵심은 **높이를 vh로 고정하지 않는 것**.
예전에는 `.mapwrap{height:44vh}` + `aside{max-height:32vh}`로 잡아놨는데, 헤더가
3줄로 늘어나자 합이 화면을 넘겨 지역 패널이 한 줄로 찌그러졌다. 지금은
`.mapwrap{flex:1 1 auto}` + `aside{height:20~24vh}`로 남는 공간을 지도가 먹는다.

- **도구 줄바꿈 → 가로 스크롤**: `.tools{flex-wrap:nowrap;overflow-x:auto}` (≤820px).
  헤더 197→150px(태블릿), 208→118px(모바일).
- **가로 모드**: `header{flex-wrap:nowrap}`로 한 줄에 눌러 담아 139→45px, 지도 124→239px.
- **입력줄**: `.inbar{flex-wrap:wrap}` + `#answer{flex:1 1 100%}` + `.qbtns .btn{flex:1;white-space:nowrap}`.
  버튼이 "넘 어 가 기"처럼 글자 단위로 쪼개지고 `정답`이 화면 밖으로 잘리던 문제.
- **문제 배너 / 미니맵 충돌**: 배너는 `left/right:8px`로 폭 전체, 미니맵은 좌하단으로 이동.
- `body{height:100vh;height:100dvh}` — 모바일 주소창 때문에 잘리던 문제.
- 푸터 하단 여백 20px — 제작자 워터마크(하단 15px 점유)와 안내문 겹침.

### 11.9 다시 밟지 말 것 (신규)
10. **`vbForTarget()`은 `bbox`가 비어 있으면 예외를 던진다.** `bbox`는 `buildMap()`의
    `requestAnimationFrame`에서 채워지는데, 그 전에 라운드가 시작되면(탭이 백그라운드라
    rAF가 미뤄진 경우 등) `beginRound()` 안에서 예외가 나면서 **지도 확대·안내문·입력창
    포커스가 통째로 건너뛰어진다.** 증상은 "게임은 도는데 문제 번호가 초기값 그대로".
    `bboxOf()`를 거쳐 없으면 즉석에서 `getBBox()`로 계산하도록 방어했다.

---

## 12. 2026-09-18 — 로비 + 지역 특산물 + 한국 지도

### 12.1 페이지 구성 (바뀜)
```
index.html          로비 (손으로 관리) — 카드 2장: 지도 타이핑 / 지역 특산물
arcade.html         지도 타이핑: 일본 47 · 한국 17 · 세계 256   ← build_artifact.py arcade
specialty.html      지역 특산물: 한국 17 · 일본 47              ← build_artifact.py specialty
artifact/geo_arcade.html   arcade와 같은 내용의 Artifact 본문 (로비 버튼만 뺌)
japan_prefectures_metro.html / world_countries_metro.html   예전 단독판 (그대로 유지)
```
예전 로비 `lobby.html`은 새 `index.html`로 바뀌었다(디자인 그대로, 카드만 교체).

### 12.2 빌드
```bash
cd src && python3 build_all.py
```
`build_all.py`가 korea.json(없을 때만) → 두 단독판 → arcade → specialty 순으로 전부 만든다.

### 12.3 한국 지도
- `build_korea_data.py` → `korea.json`. 원본은 npm `@svg-maps/south-korea` 2.0.0
  (MapSVG 기반, **CC BY 4.0 — 출처 표기 필요**, 로비 하단에 표기함). tarball은
  `src/.cache_*.tgz`에 캐시(gitignore).
- 표시명은 약칭(서울·경기·충북…), 정답은 정식 명칭·옛 명칭·영문·일본어까지 인정
  (예: 전북 = 전라북도 = 전북특별자치도 = 全羅北道 = Jeonbuk).
- 권역: 수도권 / 강원 / 충청 / 호남 / 영남 / 제주.

### 12.4 특산물 데이터
- `specialty_kr.json`(17), `specialty_jp.json`(47). 항목 형식은 `{cat, clues[3], detail}`.
  ko/kanji/region은 빌더가 지도 데이터에서 채운다.
- **clues[0]은 '지역 → 특산물' 4지선다의 정답 보기로도 쓰인다.** 가장 대표적인 특징을 둘 것.
- 빌더가 **단서에 정답 지역명이 들어갔는지 검사**한다(약칭·정식명·한자 어간). 걸리면 빌드 실패.
- 순위 주장("생산량 일본 1위")은 확실한 것만 넣었다. 녹차는 가고시마가 시즈오카를
  추월한 해가 있어 순위 없이 "대표 산지"로 썼다.
- 특산물 페이지는 기존 EJU 모드 엔진을 그대로 쓴다: `DATASETS[k].eju`에 특산물 단서를 끼움.

### 12.5 빌더 일반화
`build_artifact.py`는 이제 `PAGES` 설정으로 페이지를 찍어낸다(담을 지도, 쓸 모드, 기본값,
기록판 구성, 출력 위치). 데이터셋 성격은 플래그로: `dense`(라벨 6px), EJU 단서 없음 →
`body.noeju`로 EJU 버튼 숨김.
- 기록 키: EJU/특산물 모드는 방향별로 따로 — `<ds>_eju_name`, `<ds>_eju_feat`.
  특산물 페이지의 데이터셋 키는 `kr_sp`, `jp_sp`라 지도 타이핑 기록과 섞이지 않는다.
- localStorage는 두 페이지가 공유(누적 통계는 합산, 기록판·약점은 각 페이지 것만 표시).

### 12.6 모바일
EJU·특산물 모드에서는 휴대폰(≤600px)일 때 지역 패널을 접는다. 단서 카드가 지도 아래를
덮어서 확대된 목표 지역이 카드 뒤로 숨고 세 번째 단서가 잘렸기 때문.

---

## 13. 2026-09-19 — 한국 시·군 167곳 + 전남광주 통합 반영

### 13.1 시·군 지도 (`src/build_korea_sgg_data.py` → `korea_sgg.json`)
- 원본: vuski/admdongkor 행정동 경계 **ver20260701** (통계청 SGIS 공공누리 제1유형 → CC BY 4.0).
  **출처 표기 의무**가 있어 로비 하단에 표기함. 원본 geojson(34MB)은 `src/.cache_*`에 캐시(gitignore).
- 가공은 mapshaper(npx): 행정동 3,558개 → 시·군 병합 → EPSG:5179 → 4km² 미만 섬 제거 → 2.5% 단순화 → SVG (192KB).
- 단위 규칙: 특별시·광역시 자치구는 도시 하나로(서울·부산·대구·인천·광주·대전·울산),
  그 안의 군(기장·달성·군위·강화·옹진·울주)은 따로. 일반구가 있는 시(수원·청주·창원 …)는 시 하나로.
- 이름 충돌: `고성(강원)`/`고성(경남)`, `광주`(옛 광주광역시)/`광주(경기)`. 경기 광주는 '광주'로는 정답 처리하지 않는다.
- SVG 경로 속성 순서가 경로마다 달라서 `<path d=… id=…>`를 한 정규식으로 잡으면 25개가 빠졌다 → 속성을 따로 추출.

### 13.2 특산물 (`src/specialty_kr_sgg.json`, 167곳)
- **키가 지도 표시명**(이천, 가평 …)이다. 빌더가 표시명 → 코드로 바꾼다.
- 특산물은 **농산물 지리적표시(GI) 등록 품목**을 뼈대로 했다. 공식 목록 파일(공공데이터포털
  '지리적표시관리정보')은 자동입력방지 인증이 있어 직접 못 받았고, 등록 목록 정리본과 대조했다.
- 헷갈리는 쌍은 clues[0]을 구별되게: 이천(쌀·온천·반도체)/여주(쌀·세종대왕릉), 영덕(강구항 대게)/울진(금강송).
- 유출 검사가 잡은 것: 평택항, 태백산, 계룡대, 고군산군도 → 표현을 바꿈.

### 13.3 전남광주통합특별시 (2026-07-01 출범)
- 광주광역시 + 전라남도 → **전남광주통합특별시**. 첫 광역자치단체 통합. 시·도는 17 → **16**.
- `korea.json`: 두 경로를 합쳐 `JNG` 하나로. **주의**: svg-maps 경로는 상대좌표(`m`)로 시작해서 그냥
  이어 붙이면 두 번째 도형이 엉뚱한 곳에 그려진다 → 두 번째 경로의 시작을 `M x,y l …`로 바꿔 붙인다
  (`absolute_start()`). 옛 광주 영역 중심이 합친 도형 안에, 전북 중심은 밖에 있는지 브라우저에서 검증함.
- 통합 전 이름(전라남도·전남·광주광역시·광주)도 정답으로 받는다.
- 인천도 2026-07 자치구 개편(제물포구·영종구·서해구·검단구), 화성시는 2026년 일반구 4곳 신설 —
  시·군 단위에서는 합쳐지므로 지도에는 영향 없음.

### 13.4 페이지
- 특산물: `🏘️ 시·군`(기본) · `🇰🇷 시·도` · `🗾 일본`
- 지도 타이핑: `🗾 일본` · `🇰🇷 시·도` · `🏘️ 시·군` · `🌍 세계`
- 시·군 데이터셋의 언어 토글은 '정식 명칭'(이천 ↔ 이천시).

---

## 14. 2026-09-19 — 공유·재방문 기능 (마케팅 요소)

### 14.1 파일
```
src/growth.js / growth.css   게임 페이지 끝에 붙는 기능 묶음 (build_artifact.py 7b 단계에서 주입)
src/season.json              이달의 특집 (1~12월, 시·군 표시명) — 빌더가 이름을 검증
src/brand/og.html, icon.html 링크 미리보기·아이콘 원본 → build_brand.py가 크롬 헤드리스로 PNG 생성
src/sw.template.js           서비스워커 원본 → build_all.py가 캐시 이름(내용 해시)을 채워 ../sw.js
manifest.webmanifest         앱 설치 정보 (손으로 관리)
og.png, icon-192/512.png, apple-touch-icon.png   생성물
```

### 14.2 기능
- **오늘의 문제**: `seeded(pool, hash(날짜|데이터셋|모드))`의 앞 5개. 서버 없이 모두 같은 문제.
  결과는 🟩(바로 정답) 🟨(힌트·오답 후 정답, 넘어가기 후 정답) 🟥(정답 보기·못 맞힘).
- **도전장**: **모든 라운드의 순서를 시드로 만든다**(`resetGame` 래핑). 링크 `?c=` = base64url JSON
  `{ds,m,d,s(시드),k(정해진 문제 목록),n,t,f,r}`. 같은 시드 + 같은 풀이면 기기와 무관하게 같은 순서.
  페이지 첫 라운드는 growth.js가 붙기 전에 만들어져 시드가 없으므로 init에서 한 번 다시 준비한다.
- **이달의 특집**: `?season=월`. 로비 배너(build_all이 season.json을 `/*SEASON*/…/*END*/`에 채움).
- **결과 창**: 텍스트 공유(Web Share → 클립보드 → 직접 복사 textarea 순), 결과 이미지(1080×1350 캔버스;
  Artifact에서는 `downloads` 기능, 휴대폰은 공유 시트, 그 외 다운로드), 도전장 보내기.
  공유 링크는 항상 공개 사이트(github.io)를 가리킨다 — Artifact에서 눌러도.
- **연속 공부·업적**: `P.days`(날짜 목록), `P.ach`, `P.daily`, `P.shares`, `P.wins`. 업적 16개, 기록 패널 '업적' 탭.
- **링크 미리보기(OG)·앱 설치(PWA)**: 단독본·로비 head에 태그, body 끝에서 sw.js 등록.
  서비스워커는 HTML '네트워크 먼저'(예전에 캐시 때문에 새 로비가 안 보였던 문제를 피하려고), 폰트·이미지 '캐시 먼저'.

### 14.3 다시 밟지 말 것
11. **정해진 문제 수 라운드(오늘의 문제·특집·목록 도전장)는 최고 기록에서 뺀다.** 안 그러면 5문제짜리
    0:13 기록이 167곳 전체 라운드 기록과 한 칸에 섞인다. (플레이 횟수·연속 공부·업적에는 반영)
12. 헤드리스 크롬은 스크린샷 후 종료하지 않을 때가 있다 → `build_brand.py`는 시간 제한 후 파일 존재로 판정.
13. 내장 브라우저(Claude 앱 미리보기)에서는 서비스워커 등록이 "unknown error"로 거부된다. 코드는 catch로
    무시하므로 게임엔 영향 없음. 실제 설치 여부는 배포 후 크롬 개발자 도구 → Application에서 확인.

---

## 15. 2026-09-19 — 흔한 랜딩페이지 문법 줄이기 (로비 중심)

진단한 20개 항목 중 실제로 해당한 것만 고쳤다: 1(부분)·5·9·17·19·20 + 접근성.
- **17 제품 화면**: 로비 카드 그림을 이모지 → 실제 게임 화면(`shot-arcade.jpg`, `shot-specialty.jpg`).
  `build_brand.py`가 `src/brand/shot.html`로 게임을 iframe에 띄워 조작(일본 지도 채우기 / 이천 문제)한 뒤 찍는다.
  **주의**: iframe 안 입력창에 글자를 넣으면 iframe과 바깥 틀이 모두 입력창 쪽으로 스크롤된다 → 둘 다 되돌린 뒤 자른다.
- **5 이모지 띠** → 실제 단서→정답 띠(`/*TICKER*/`, build_all이 특산물 데이터 첫 단서로 채움). 반복분은 aria-hidden.
- **9 긴 대시**: 단서 데이터 245개를 규칙 변환(인증 표시는 괄호 "쌀(지리적표시)", 나머지는 콜론), UI 문구는 문장을 다시 씀.
- **1 그라데이션**: 색조 회전 애니메이션 제거. 휴대폰에서는 태양을 숨김(제목 뒤 말고 둘 곳이 없음).
- **19·20**: `terms.html`, `privacy.html`, 공용 `legal.css`. 실제 처리 방식대로 작성, 모르는 정보는 `<mark class="todo">[입력 필요]</mark>`.
  로비 하단과 게임 설정(⚙️) 창에 링크. Artifact 본문에서는 공개 사이트 주소로 새 탭.
- 접근성: 로비에 `prefers-reduced-motion`, 지도 출처 대비 3.05→7.63:1, 전체화면 버튼 포커스 링,
  제작자 표기를 고정 배치 → 본문 흐름으로(스크롤 시 카드 글자를 가렸음), 쓰지 않던 VT323 글꼴 요청 제거.
- 헤드리스 크롬은 창 폭 500px 미만을 제대로 재현하지 못한다 → 모바일 확인은 앱 미리보기로.

---

## 16. 2026-09-28~29 — 고양이 역장 마스코트 (마케팅 6번)

와카야마 기시역의 고양이 역장 '타마'에서 온 설정. **사용자가 만든 캐릭터 원본 PNG를 그대로 쓴다**
(처음에는 인라인 SVG로 다시 그렸는데 원본과 달라 보여서 갈아엎었다).

### 16.1 파일
```
src/brand/cat/*.png   원본 27장 — 표정 18, idle/move 8, 턴어라운드 5 (사용자 제작)
src/pngtool.py        PNG 읽기·쓰기·배경 제거·여백 자르기 (Pillow 없이 zlib만)
src/build_cat.py      원본 → mascot/*.png (배경 제거 → 여백 자르기 → 축소)
src/mascot.js/.css    마스코트 동작·말풍선·역 스탬프
mascot/*.png          배포용 스프라이트 9장 (~580 KB)
```
빌드 순서: `build_cat.py` → `build_artifact.py`(mascot.js를 growth.js **앞에** 주입) → 로비 주입.

### 16.2 그림이 어디서 오는가
| 스프라이트 | 원본 | 쓰는 곳 |
|---|---|---|
| base / happy / combo / wink / focus / surprise / panic | `expression_01/03/06/04/08/09/14` | 게임 화면 얼굴 컷 |
| full | `turnaround_01_front` | 결과 이미지, 앱 아이콘 |
| full3q | `turnaround_02_front_3q` | 로비 |

**원본에 배경이 구워져 있다.** '투명 PNG'라면서 실제로는 투명 표시용 체크무늬(흰 #fdfdfd /
회색 #d5d5d5)나 회색 패널이 그림으로 들어 있다. `pngtool.cut_background`가 테두리에서 시작해
이어진 밝은 무채색만 지운다.

### 16.3 주소에 붙는 ?v=
`build_cat.urls()`가 스프라이트 내용 해시를 붙인다(`mascot/base.png?v=7d5917e2`).
그림만 바꾸면 HTML은 그대로라 브라우저가 옛 그림을 계속 쓴다 — 실제로 한 번 겪었다.

### 16.4 API
```js
const c = MAS.make({full:"full3q", bubble:true, cls:"sayleft"});
c.face("happy", 1200);   // base·happy·combo·wink·focus·surprise·panic
c.pose("jump", 700);     // idle·jump·hop·spin·shake·point·stamp (CSS 애니메이션)
c.say("한마디", 0);       // 0이면 계속 띄움
c.react("ok"|"wrong"|"hint"|"combo"|"clear"|"surprise");
MAS.stampSVG({top,mid,sub,date,ink})   // 역 스탬프 (이것만 SVG로 그린다)
MAS.pressStamp(box, opt, cat)          // "쾅" 찍는 연출
MAS.image({full:true}) / MAS.stampImage(o)   // 결과 이미지(캔버스)용 비트맵
MAS.stage                              // 게임 페이지의 상주 고양이
```

### 16.5 어디에 나오는가
- **게임 화면**: 지도 왼쪽 아래 얼굴 컷. 시작 화면에서 말풍선 안내, 정답→점프/웃음,
  5연속→회전/크게 웃음, 오답→당황(빙글 눈), 힌트→집중, 완주→환호.
- **결과 창**: 고양이 옆에서 **역 스탬프를 찍는다.** 글자는 승리 > 만점 > 완주 > 신기록 > 오늘 > 하차 순.
- **스탬프 수첩**: 기록 패널의 '업적' 탭. 딴 것은 주홍 도장, 아직이면 점선 빈 칸.
- **칭호**: 딴 업적 중 가장 어려운 것(`TITLE_RANK`). 시작 화면·결과 창·공유 텍스트·결과 이미지에.
- **결과 이미지(1080×1350)**: 왼쪽 아래 전신 고양이, 오른쪽 아래 도장.
- **로비**: 제목 **오른쪽에 겹쳐** 세운다(전신 3/4). 카드에 마우스를 올리면 한마디.
- **브랜드**: `og.png`는 사용자가 만든 배너를 그대로 쓴다(`brand/source/og-banner.webp`).
  앱 아이콘 3종은 `brand/icon.html`이 원본 PNG를 신스웨이브 배경에 얹어 찍는다.

### 16.6 다시 밟지 말 것
14. **mascot.js / mascot.css 안에 `/*END*/` 와 `</body>` 문자열을 쓰면 빌드가 깨진다.**
    앞은 로비 자리 표시, 뒤는 `build_artifact.py`의 남은 토큰 검사에 걸린다.
15. 정답·오답 반응은 `flash()`가 아니라 **`sCorrect()`/`sWrong()`을 감쌌다.** EJU·특산물의 4지선다는
    `flash()`를 지나가지 않기 때문이다.
16. 말풍선은 `position:absolute`라 `width:max-content`가 없으면 부모(고양이) 폭에 눌려 한 글자씩 줄바꿈된다.
17. **로비에 세로로 자리를 차지하는 요소를 넣지 마라.** 고양이를 흐름에 넣었더니 150px가 밀려
    카드가 화면 밖으로 나가고, 카드 뒤에 가려져 있던 픽셀 태양(`position:fixed`)이 틈새로 드러났다.
    `position:absolute`로 제목 옆에 겹쳐 두고, 880px 아래에서는 숨긴다.
18. **배경 제거에서 색을 되돌리지(un-premultiply) 마라.** 밝은 가장자리가 새까맣게 변해 주둥이가 뭉개진다.
    경계는 알파만 낮춘다.
19. **배경 판정에 이웃 조건을 둬야 한다.** '밝은 무채색'만 보면 주둥이를 가로지르는 흰 수염을 타고
    들어가 수염을 지운다. 사방 중 3면 이상이 배경일 때만 배경으로 친다.
20. **스프라이트의 투명 여백을 잘라라.** 안 자르면 512 캔버스 가운데 얼굴만 있어 화면에서 절반 크기로 보인다.
21. 도장 잉크색은 `currentColor`. 밤 화면에서는 `#d9452f`가 가라앉아 `body.dark`에서 `#ff6e50`으로 올린다.
22. 도장 안쪽은 좁다 — 아래쪽 글자는 8~9px, 데이터셋은 `brand`(길다) 대신 `label`을 쓴다.

### 16.7 미리보기 서버
`.claude/launch.json` + `.claude/serve.mjs` (node 정적 서버, 4173). 빌드한 HTML을 앱 미리보기로 열 때 쓴다.
`python3 -m http.server`는 이 샌드박스에서 `os.getcwd()` 권한 오류로 뜨지 않는다.

### 16.8 마케팅 7항목 현황
1 결과 공유 텍스트 ✅ · 2 링크 미리보기 ✅(사용자 배너) · 3 도전장 ✅ · 4 데일리 ✅ ·
5 칭호·업적 ✅(칭호 추가, 스탬프 수첩으로 개편) · 6 고양이 역장 ✅ · 7 커뮤니티 공략 — 사이트 밖이라 미착수.

### 16.9 남은 것
- `turnaround_03_side` / `04_back` / `05_back_3q`, `idle_02/03`, `move_02~06`, 나머지 표정 11종은
  `src/brand/cat/`에 넣어 뒀지만 아직 쓰지 않는다. 쓸 자리가 생기면 `build_cat.SPRITES`에 한 줄 추가하면 된다.


---

## 17. 2026-09-29 — 맵 선택 화면 (지도 썸네일 + 지도별 고양이 그림)

### 17.1 선택 버튼의 지도 모양
`src/mapicon.js` / `mapicon.css`. 이모지(🗾🇰🇷🏘️🌍) 대신 **실제 지도 모양**을 그린다.
페이지에 이미 들어 있는 경계 데이터(`DATASETS[*].data[*].d`)를 이어 붙여 한 개의
`<path>`로 그리므로 **파일이 커지지 않는다.**

- 경계선은 `vector-effect="non-scaling-stroke"`. 뷰박스 단위로 굵기를 주면
  세계지도(1010 단위를 28px로 줄임)에서는 선이 사라지고 일본 지도에서는 덩어리가 된다.
  이걸 쓰면 축소율과 무관하게 화면 픽셀 기준이라 **시·도(16조각)는 굵은 몇 줄,
  시·군(167조각)은 촘촘한 결**로 구분된다.
- 세계지도는 조각이 256개라 처음 그릴 때 잠깐 걸린다 → `requestIdleCallback`으로 미룬다.

### 17.2 지도별 고양이 그림
사용자가 만든 `map/japan.png` · `korea.png` · `global.png` (1402×1122 투명)를
`src/brand/cat/map_*.png`로 두고, `build_cat.py`가 360px로 줄여 `mascot/map_{jp,kr,world}.png`로 낸다.
지도를 고르면 **시작 화면 START 위에** 해당 그림이 뜬다.

| 데이터셋 | 그림 |
|---|---|
| `jp`, `jp_sp` | `map_jp` (일장기와 벚꽃) |
| `kr`, `kr_sgg`, `kr_sp`, `kr_sgg_sp` | `map_kr` (태극기와 한반도) |
| `world` | `map_world` (지구본과 로켓) |

고른 것만 내려받으므로 첫 화면 용량에 얹히지 않는다.

### 17.3 다시 밟지 말 것
23. **시작 화면은 지도 칸 위에 얹혀 있다.** 그림을 넣으면 칸이 낮을 때 START를 밀어내고
    머리말까지 비집고 올라간다. CSS로는 부모 높이를 못 재니 `mapicon.js`가
    `ResizeObserver`로 `.mapwrap` 높이를 재서 440px 아래면 줄이고(`.tiny`)
    340px 아래면 감춘다(`.gone`).
24. `mapicon.js`는 `MAS.SPR`(그림 주소표)을 쓰므로 **mascot.js 뒤에** 주입해야 한다.

### 17.4 로비의 캐릭터 (2026-09-30)
로비에 셋이 선다.

| 자리 | 그림 | 비고 |
|---|---|---|
| 제목 오른쪽 | `full3q` | 인사·말풍선. 880px 아래에서는 제목과 겹쳐 숨긴다 |
| 지도 타이핑 카드 | `map_world` | 게임 화면 오른쪽 아래 (일본 지도가 가리지 않는 자리) |
| 지역 특산물 카드 | `map_kr` | 게임 화면 **왼쪽 위** — 아래쪽은 단서 칸이라 가리면 안 된다 |

카드 고양이는 `.shot`(게임 화면) 안에 `position:absolute`로 넣어 **카드 높이를 건드리지 않는다.**
주소는 `MAS.SPR`에서 가져오므로 `?v=` 캐시 무효화가 그대로 따라온다.

25. **`.shot .cabcat` 처럼 셀렉터를 세게 써야 한다.** `.shot img{width:100%;height:100%}`가
    먼저 있어서 `.cabcat`(클래스 하나)만으로는 크기가 안 먹고 고양이가 화면을 통째로 덮는다.
26. 카드 그림은 §15에서 "실제 제품 화면"을 보여 주려고 넣은 것이다 — 고양이가 지도나 단서를
    가리면 의미가 없어진다. 높이 38% 정도로 두고 빈 구석에 세운다.


---

## 18. 2026-09-30 — 로비 리디자인 (1990s 아케이드 + 모던 게임 UI)

`index.html`을 다시 짰다. **게임 로직·라우팅·데이터는 건드리지 않았다** — 로비의 HTML/CSS/JS만.

### 18.1 화면
- **데스크톱 55:45** — 왼쪽 로고·카피·CTA·모드 선택, 오른쪽 캐릭터.
  `grid-template-areas`로 짜서 모바일에서는 **로고 → 캐릭터 → 카피 → START → 모드** 순으로 재배치된다.
- **배경**: 네이비 그라데이션 + 시안/마젠타/보라 ambient glow + 네온 도시 실루엣(인라인 SVG) +
  원근 격자 + 스캔라인 + 비네트. 도시는 `opacity:.5`로 물려 뒀다 — 진하면 모드 버튼과 싸운다.
- **캐릭터**: `mascot/hero.png`(사용자 배너 캐릭터). 뒤에 radial glow(`.halo`)와 점선 링(`.ring`)을
  따로 두고, **PNG 자체에는 drop-shadow 하나만** 건다.

### 18.2 모드 선택 (JAPAN / KOREA / WORLD)
올리거나(hover·focus) 고르면 캐릭터가 그 지도의 그림으로 바뀐다 — `map_jp` / `map_kr` / `map_world`.
넉 장을 겹쳐 두고 `.on`만 보여 주므로 바꿀 때 새로 받지 않는다(깜빡임 없음). 전환은 opacity+scale 260ms.
고르면 GAME START가 `arcade.html?ds=jp|kr_sgg|world`로 바뀐다 (이미 있던 `?ds=` 파라미터라 라우팅은 그대로).
같은 걸 다시 누르면 선택이 풀리고 기본 캐릭터·`arcade.html`로 돌아간다.

### 18.3 새 에셋
`src/brand/cat/banner_logo.png`, `banner_hero.png` → `mascot/logo.png`(480px), `mascot/hero.png`(520px).
**둘은 배경 제거를 돌리지 않는다**(`build_cat.NO_CUT`) — 로고의 흰 외곽선이 바깥 투명 영역과 맞닿아 있어
배경 제거가 외곽선을 타고 들어가 글자를 갉아먹는다.

### 18.4 그대로 둔 것
이달의 특집 배너, 문제 예시 띠, 연속 공부 줄, 두 게임 카드(화면 캡처 + 지도별 고양이),
이용약관·개인정보처리방침, 제작자 표기, 전체화면 버튼, CRT 부팅 인트로, 별, 아케이드 효과음,
서비스워커 등록, `/*SEASON*/ /*TICKER*/ /*MASCOTCSS*/ /*MASCOTJS*/` 자리 표시.

### 18.5 새로 넣은 것
**HOW TO PLAY** 모달 — 모드 5가지와 오늘의 문제·도전장·스탬프를 설명한다. ✕·Esc·배경 클릭으로 닫힌다.

### 18.6 다시 밟지 말 것
27. 로비를 다시 쓸 때 `/*SEASON*/…/*END*/` 같은 자리 표시 넷을 **빈 채로 남겨 두면 된다** —
    `build_all.py`가 매번 다시 채운다. 내용까지 손으로 옮길 필요가 없다.
28. 배너 로고·캐릭터에 `pngtool.cut_background`를 돌리지 마라 (§18.3).
