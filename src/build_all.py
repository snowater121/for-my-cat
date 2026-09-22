# -*- coding: utf-8 -*-
"""
build_all.py — 배포 파일을 전부 다시 만든다. src/ 폴더에서 실행:

    python3 build_all.py

  japan_prefectures_metro.html  ← build_html2.py   (일본 단독판)
  world_countries_metro.html    ← build_world.py   (세계 단독판)
  arcade.html + artifact/       ← build_artifact.py arcade     (지도 타이핑: 일본·한국·세계)
  specialty.html                ← build_artifact.py specialty  (지역 특산물: 한국·일본)
  index.html (로비)는 손으로 관리한다 — 이달의 특집 데이터만 season.json에서 채운다.
  sw.js                         ← sw.template.js  (앱 설치·오프라인용 서비스워커)
  og.png / icon-*.png           ← build_brand.py  (없을 때만)
"""
import os, shutil, subprocess, sys

HERE = os.path.dirname(os.path.abspath(__file__))
os.chdir(HERE)

def run(*args):
    print("$ python3 " + " ".join(args))
    subprocess.check_call([sys.executable] + list(args))

if not os.path.exists("korea.json"):
    run("build_korea_data.py")
run("build_html2.py")
run("build_world.py")
for f in ("japan_prefectures_metro.html", "world_countries_metro.html"):
    shutil.move(f, os.path.join("..", f))
run("build_artifact.py", "arcade")
run("build_artifact.py", "specialty")

# 링크 미리보기 이미지·앱 아이콘 (없을 때만 — 디자인을 바꿨으면 build_brand.py를 직접 실행)
if not all(os.path.exists(os.path.join("..", f)) for f in ("og.png", "icon-192.png", "icon-512.png", "apple-touch-icon.png")):
    run("build_brand.py")

# 로비에 이달의 특집 데이터 넣기
import io, json, re, hashlib
lobby = io.open(os.path.join("..", "index.html"), encoding="utf-8").read()
season = json.dumps(json.load(io.open("season.json", encoding="utf-8")), ensure_ascii=False)
lobby, n = re.subn(r"/\*SEASON\*/.*?/\*END\*/", lambda m: "/*SEASON*/" + season + "/*END*/", lobby, flags=re.S)
assert n == 1, "index.html에 /*SEASON*/…/*END*/ 표시가 없음"
io.open(os.path.join("..", "index.html"), "w", encoding="utf-8").write(lobby)

# 로비 문제 예시 띠: 실제 특산물 데이터의 첫 단서 → 정답 (한국·일본 번갈아)
sgg = json.load(io.open("specialty_kr_sgg.json", encoding="utf-8"))
sp_jp, jpmap = json.load(io.open("specialty_jp.json", encoding="utf-8")), json.load(io.open("data.json", encoding="utf-8"))
KR_PICK = ["이천", "보성", "성주", "완도", "안동", "영주"]
JP_PICK = ["AOM", "WKM", "HRS", "ISH", "KCH", "OKY"]
ticker = []
for kr, jpc in zip(KR_PICK, JP_PICK):
    ticker.append(["KR", sgg[kr]["clues"][0], kr])
    ticker.append(["JP", sp_jp[jpc]["clues"][0], jpmap[jpc]["ko"]])
lobby = io.open(os.path.join("..", "index.html"), encoding="utf-8").read()
lobby, n = re.subn(r"/\*TICKER\*/.*?/\*END\*/", lambda m: "/*TICKER*/" + json.dumps(ticker, ensure_ascii=False) + "/*END*/", lobby, flags=re.S)
assert n == 1, "index.html에 /*TICKER*/…/*END*/ 표시가 없음"
io.open(os.path.join("..", "index.html"), "w", encoding="utf-8").write(lobby)

# 서비스워커: 배포 파일 내용이 바뀌면 캐시 이름도 바뀌어 옛 캐시가 정리된다
h = hashlib.sha1()
for f in ("index.html", "arcade.html", "specialty.html", "manifest.webmanifest",
          "terms.html", "privacy.html", "legal.css", "shot-arcade.jpg", "shot-specialty.jpg"):
    h.update(io.open(os.path.join("..", f), "rb").read())
sw = io.open("sw.template.js", encoding="utf-8").read().replace("__BUILD__", h.hexdigest()[:10])
io.open(os.path.join("..", "sw.js"), "w", encoding="utf-8").write(sw)
print("sw.js — 캐시 " + h.hexdigest()[:10])
print("\n완료.")
