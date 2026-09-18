# -*- coding: utf-8 -*-
"""
build_all.py — 배포 파일을 전부 다시 만든다. src/ 폴더에서 실행:

    python3 build_all.py

  japan_prefectures_metro.html  ← build_html2.py   (일본 단독판)
  world_countries_metro.html    ← build_world.py   (세계 단독판)
  arcade.html + artifact/       ← build_artifact.py arcade     (지도 타이핑: 일본·한국·세계)
  specialty.html                ← build_artifact.py specialty  (지역 특산물: 한국·일본)
  index.html (로비)는 손으로 관리한다.
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
print("\n완료.")
