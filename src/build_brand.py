# -*- coding: utf-8 -*-
"""
build_brand.py — 링크 미리보기 이미지(og.png)와 앱 아이콘을 brand/*.html 에서 크롬으로 찍어낸다.
문구나 디자인을 바꿨을 때만 실행하면 된다:  python3 build_brand.py
"""
import os, shutil, subprocess, tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

def shot(src, out, w, h):
    # 헤드리스 크롬은 스크린샷을 쓴 뒤에도 종료하지 않을 때가 있다 → 시간 제한 후 파일이 있으면 성공으로 본다
    tmp = tempfile.mkdtemp()
    if os.path.exists(out):
        os.remove(out)
    proc = subprocess.Popen([CHROME, "--headless=new", "--disable-gpu", "--hide-scrollbars", "--force-device-scale-factor=1",
                             "--window-size=%d,%d" % (w, h), "--virtual-time-budget=6000", "--user-data-dir=" + tmp,
                             "--screenshot=" + out, "file://" + os.path.join(HERE, "brand", src)],
                            stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    try:
        proc.wait(timeout=40)
    except subprocess.TimeoutExpired:
        proc.kill()
        proc.wait()
    shutil.rmtree(tmp, ignore_errors=True)
    assert os.path.exists(out), "스크린샷 실패: " + src
    print("written", os.path.relpath(out, ROOT))

shot("og.html", os.path.join(ROOT, "og.png"), 1200, 630)
icon512 = os.path.join(ROOT, "icon-512.png")
shot("icon.html", icon512, 512, 512)
for size, name in ((192, "icon-192.png"), (180, "apple-touch-icon.png")):
    out = os.path.join(ROOT, name)
    subprocess.check_call(["sips", "-z", str(size), str(size), icon512, "--out", out], stdout=subprocess.DEVNULL)
    print("written", name)
