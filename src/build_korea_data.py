# -*- coding: utf-8 -*-
"""
build_korea_data.py — 한국 16개 광역자치단체 지도 데이터(korea.json) 생성.

원본: npm @svg-maps/south-korea 2.0.0 (MapSVG 기반, CC BY 4.0)
      https://registry.npmjs.org/@svg-maps/south-korea/-/south-korea-2.0.0.tgz
출력 형식은 data.json(일본)과 같다: ko/kanji/kana/romaji/region/accepted/d
  ko     화면 표시용 약칭 (서울, 경기, 충북 …)
  kanji  일본어 표기 (日本語 토글에서 표시)
"""
import io, json, os, re, tarfile, urllib.request

URL = "https://registry.npmjs.org/@svg-maps/south-korea/-/south-korea-2.0.0.tgz"
CACHE = os.path.join(os.path.dirname(os.path.abspath(__file__)), ".cache_south-korea-2.0.0.tgz")
if not os.path.exists(CACHE):
    urllib.request.urlretrieve(URL, CACHE)
with tarfile.open(CACHE) as t:
    js = t.extractfile("package/index.js").read().decode("utf-8")
obj = json.loads(js[js.index("{"):js.rindex("}") + 1])
assert obj["viewBox"] == "0 0 524 631", obj["viewBox"]
paths = {L["id"]: L["path"] for L in obj["locations"]}

# id: (코드, 약칭, [정식·옛 명칭 등 추가 정답], 일본어 표기, [일본어 추가 정답], 가나, 로마자, 권역)
ROWS = [
 ("seoul",            "SEO","서울", ["서울특별시","서울시"],              "ソウル",   ["ソウル特別市"],          "そうる",         "Seoul",     "수도권"),
 ("incheon",          "INC","인천", ["인천광역시","인천시"],              "仁川",     ["仁川広域市"],            "いんちょん",     "Incheon",   "수도권"),
 ("gyeonggi",         "GYG","경기", ["경기도"],                           "京畿道",   [],                        "きょんぎど",     "Gyeonggi",  "수도권"),
 ("gangwon",          "GAW","강원", ["강원도","강원특별자치도"],          "江原道",   ["江原特別自治道"],        "かんうぉんど",   "Gangwon",   "강원"),
 ("daejeon",          "DAJ","대전", ["대전광역시","대전시"],              "大田",     ["大田広域市"],            "てじょん",       "Daejeon",   "충청"),
 ("sejong",           "SEJ","세종", ["세종특별자치시","세종시"],          "世宗",     ["世宗特別自治市"],        "せじょん",       "Sejong",    "충청"),
 ("north-chungcheong","CCB","충북", ["충청북도"],                         "忠清北道", [],                        "ちゅんちょんぷくと","Chungbuk",  "충청"),
 ("south-chungcheong","CCN","충남", ["충청남도"],                         "忠清南道", [],                        "ちゅんちょんなむど","Chungnam",  "충청"),
 ("gwangju",          "GWJ","광주", ["광주광역시","광주시"],              "光州",     ["光州広域市"],            "くぁんじゅ",     "Gwangju",   "호남"),
 ("north-jeolla",     "JLB","전북", ["전라북도","전북특별자치도"],        "全羅北道", ["全北特別自治道"],        "ちょんらぷくと", "Jeonbuk",   "호남"),
 ("south-jeolla",     "JLN","전남", ["전라남도"],                         "全羅南道", [],                        "ちょんらなむど", "Jeonnam",   "호남"),
 ("busan",            "BUS","부산", ["부산광역시","부산시"],              "釜山",     ["釜山広域市"],            "ぷさん",         "Busan",     "영남"),
 ("daegu",            "DAG","대구", ["대구광역시","대구시"],              "大邱",     ["大邱広域市"],            "てぐ",           "Daegu",     "영남"),
 ("ulsan",            "ULS","울산", ["울산광역시","울산시"],              "蔚山",     ["蔚山広域市"],            "うるさん",       "Ulsan",     "영남"),
 ("north-gyeongsang", "GSB","경북", ["경상북도"],                         "慶尚北道", [],                        "きょんさんぷくと","Gyeongbuk", "영남"),
 ("south-gyeongsang", "GSN","경남", ["경상남도"],                         "慶尚南道", [],                        "きょんさんなむど","Gyeongnam", "영남"),
 ("jeju",             "JEJ","제주", ["제주도","제주특별자치도"],          "済州",     ["済州道","済州特別自治道"],"ちぇじゅ",       "Jeju",      "제주"),
]
# 영문 정식 명칭(북/남 도는 North/South 표기도 허용)
EN_EXTRA = {
 "CCB": ["North Chungcheong"], "CCN": ["South Chungcheong"],
 "JLB": ["North Jeolla"],      "JLN": ["South Jeolla"],
 "GSB": ["North Gyeongsang"],  "GSN": ["South Gyeongsang"],
}

out = {}
for sid, code, ko, ko_extra, kanji, kanji_extra, kana, romaji, region in ROWS:
    d = paths.pop(sid)
    acc = [ko] + ko_extra + [kanji] + kanji_extra + [kana, romaji.lower()] + [e.lower() for e in EN_EXTRA.get(code, [])]
    out[code] = {"ko": ko, "kanji": kanji, "kana": kana, "romaji": romaji,
                 "region": region, "accepted": list(dict.fromkeys(acc)), "d": d}
assert not paths, "매핑 안 된 지역: %s" % list(paths)


def absolute_start(d):
    """경로 첫 'm x,y dx,dy …'를 'M x,y l dx,dy …'로 바꾼다.
    다른 경로 뒤에 이어 붙이면 첫 m이 앞 도형 기준 상대좌표가 되어 엉뚱한 곳에 그려지기 때문."""
    m = re.match(r"\s*m\s*([-\d.]+)[ ,]([-\d.]+)\s*", d)
    assert m, d[:30]
    rest = d[m.end():]
    return "M %s,%s " % (m.group(1), m.group(2)) + ("l " + rest if rest[:1] not in "mMzZlLhHvVcCsSqQtTaA" else rest)

# 2026-07-01 광주광역시 + 전라남도 → 전남광주통합특별시 (첫 광역자치단체 통합)
gw, jn = out.pop("GWJ"), out.pop("JLN")
out["JNG"] = {
    "ko": "전남광주", "kanji": "全南光州", "kana": "ちょんなむくぁんじゅ", "romaji": "Jeonnam-Gwangju",
    "region": "호남",
    "accepted": ["전남광주", "전남광주통합특별시", "전남광주특별시", "全南光州", "全南光州統合特別市",
                 "ちょんなむくぁんじゅ", "jeonnam-gwangju", "jeonnamgwangju",
                 # 통합 전 이름도 정답으로 받는다 (익숙한 이름으로 입력해도 맞게)
                 "전라남도", "전남", "광주광역시", "광주", "全羅南道", "光州", "jeonnam", "gwangju"],
    "d": jn["d"].rstrip() + " z " + absolute_start(gw["d"]) + " z",
}

io.open("korea.json", "w", encoding="utf-8").write(json.dumps(out, ensure_ascii=False))
print("korea.json — %d개 시·도 (2026-07 전남광주 통합 반영)" % len(out))
