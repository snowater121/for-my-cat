# -*- coding: utf-8 -*-
"""
build_korea_sgg_data.py — 한국 시·군 단위 지도(korea_sgg.json) 생성.

원본: vuski/admdongkor 행정동 경계 ver20260701 (통계청 SGIS 공공누리 제1유형 → CC BY 4.0)
      "본 데이터는 통계청 통계지리정보서비스(SGIS, https://sgis.kostat.go.kr)에서 공공누리 제1유형으로
       개방한 행정동 경계를 가공한 것이며(가공: vuski/admdongkor, https://github.com/vuski/admdongkor),
       CC BY 4.0으로 배포됩니다."

단위 규칙
  - 특별시·광역시의 자치구는 도시 하나로 합친다 (서울, 부산, 대구, 인천, 광주, 대전, 울산).
    단, 그 안의 군(기장·달성·군위·강화·옹진·울주)은 특산물이 뚜렷해 따로 둔다.
  - 일반구가 있는 시(수원·성남·청주·창원 …)는 시 하나로 합친다.
  - 표시명은 '시/군'을 뗀 이름(이천, 고성 …). 이름이 겹치는 곳은 도를 괄호로 붙인다.
지도 가공은 mapshaper(npx)로 한다: 병합 → EPSG:5179 투영 → 작은 섬 제거 → 단순화 → SVG.
"""
import io, json, os, re, subprocess, sys, tempfile, urllib.request
from collections import defaultdict

HERE = os.path.dirname(os.path.abspath(__file__))
VER = "ver20260701"
URL = "https://raw.githubusercontent.com/vuski/admdongkor/master/%s/HangJeongDong_%s.geojson" % (VER, VER)
CACHE = os.path.join(HERE, ".cache_admdong_%s.geojson" % VER)
if not os.path.exists(CACHE):
    print("다운로드:", URL)
    urllib.request.urlretrieve(URL, CACHE)
src = json.load(io.open(CACHE, encoding="utf-8"))

# 시·도 → 패널 권역 (시·군이 많아 도 단위로 묶는다)
REGION = {
    "서울특별시": "수도권", "인천광역시": "수도권", "경기도": "수도권",
    "강원특별자치도": "강원", "충청북도": "충북",
    "충청남도": "충남·대전·세종", "대전광역시": "충남·대전·세종", "세종특별자치시": "충남·대전·세종",
    "전북특별자치도": "전북", "전남광주통합특별시": "전남광주",
    "경상북도": "경북·대구", "대구광역시": "경북·대구",
    "경상남도": "경남·부산·울산", "부산광역시": "경남·부산·울산", "울산광역시": "경남·부산·울산",
    "제주특별자치도": "제주",
}
PROV_SHORT = {"강원특별자치도": "강원", "경상남도": "경남", "경기도": "경기", "전남광주통합특별시": "전남광주"}
METRO = {"서울특별시": "서울", "부산광역시": "부산", "대구광역시": "대구", "인천광역시": "인천",
         "대전광역시": "대전", "울산광역시": "울산"}
GWANGJU_GU = {"동구", "서구", "남구", "북구", "광산구"}

def unit_of(p):
    """행정동 속성 → (단위 키, 정식 명칭, 시·도명)"""
    sido, sgg = p["sidonm"], p["sggnm"]
    if sido in METRO and not sgg.endswith("군"):
        return METRO[sido], METRO[sido] + ("특별시" if sido == "서울특별시" else "광역시"), sido
    if sido == "전남광주통합특별시" and sgg in GWANGJU_GU:
        return "광주", "광주", sido
    if sido == "세종특별자치시":
        return "세종", "세종특별자치시", sido
    m = re.match(r"^(.+?시)(.+구)$", sgg)          # 수원시장안구 → 수원시
    full = m.group(1) if m else sgg
    return full, full, sido

members = defaultdict(set)
for f in src["features"]:
    key, full, sido = unit_of(f["properties"])
    f["properties"] = {"unit": sido + "|" + key}
    members[sido + "|" + key].add((full, sido))

# 표시명: '시/군'을 떼되 겹치면 도를 붙인다
base = {}
for uk, s in members.items():
    full, sido = next(iter(s))
    short = re.sub(r"(시|군)$", "", full) if full not in ("세종특별자치시",) and len(full) > 2 else full
    if full.endswith(("특별시", "광역시")):
        short = full[:2]
    if full == "세종특별자치시":
        short = "세종"
    base[uk] = (short, full, sido)
count = defaultdict(int)
for short, _, _ in base.values():
    count[short] += 1

tmp = tempfile.mkdtemp()
gin, svgout = os.path.join(tmp, "units.geojson"), os.path.join(tmp, "units.svg")
json.dump(src, io.open(gin, "w", encoding="utf-8"), ensure_ascii=False)
cmd = ["npx", "-y", "mapshaper@0.6.121", gin,
       "-dissolve", "unit",
       "-proj", "EPSG:5179",
       "-filter-islands", "min-area=4km2",
       "-simplify", "2.5%", "keep-shapes",
       "-o", "format=svg", "id-field=unit", "width=900", "margin=4", svgout]
subprocess.check_call(cmd, stdout=subprocess.DEVNULL)
svg = io.open(svgout, encoding="utf-8").read()
vb = re.search(r'viewBox="([^"]+)"', svg).group(1)
paths = {}
for attrs in re.findall(r"<path\b([^>]*)>", svg):          # 속성 순서는 경로마다 다를 수 있다
    paths[re.search(r'\bid="([^"]+)"', attrs).group(1)] = re.search(r'\bd="([^"]+)"', attrs).group(1)
assert len(paths) == len(members), "경로 %d / 단위 %d" % (len(paths), len(members))

out = {}
for n, (uk, (short, full, sido)) in enumerate(sorted(base.items(), key=lambda kv: (kv[1][2], kv[1][0]))):
    disp = short if count[short] == 1 else "%s(%s)" % (short, PROV_SHORT.get(sido, sido[:2]))
    acc = [disp, short, full]
    if count[short] > 1:        # 고성(강원) ← '강원고성', '강원 고성군' 도 인정
        acc += [PROV_SHORT.get(sido, sido[:2]) + short, PROV_SHORT.get(sido, sido[:2]) + full]
    # '광주'는 옛 광주광역시(자치구 5곳)의 몫 — 경기도 광주시는 '광주(경기)'·'경기광주'로만 받는다
    if uk.endswith("|광주"):
        disp, acc = "광주", ["광주", "광주광역시"]
    elif disp == "광주(경기)":
        acc = [a for a in acc if a not in ("광주", "광주시")]
    code = "K%03d" % n
    out[code] = {"ko": disp, "kanji": full, "kana": short, "romaji": "", "region": REGION[sido],
                 "sido": sido, "accepted": list(dict.fromkeys(acc)), "d": paths[uk]}

io.open(os.path.join(HERE, "korea_sgg.json"), "w", encoding="utf-8").write(json.dumps(out, ensure_ascii=False))
print("korea_sgg.json — %d개 시·군, viewBox %s, %.0f KB" %
      (len(out), vb, os.path.getsize(os.path.join(HERE, "korea_sgg.json")) / 1024.0))
print("VIEWBOX", vb)
