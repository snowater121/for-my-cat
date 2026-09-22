# -*- coding: utf-8 -*-
"""
build_brand.py — 링크 미리보기 이미지(og.png)와 앱 아이콘을 brand/*.html 에서 크롬으로 찍어낸다.
문구나 디자인을 바꿨을 때만 실행하면 된다:  python3 build_brand.py
"""
import os, shutil, subprocess, tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

def shot(src, out, w, h, url=None, scale=1):
    # 헤드리스 크롬은 스크린샷을 쓴 뒤에도 종료하지 않을 때가 있다 → 시간 제한 후 파일이 있으면 성공으로 본다
    tmp = tempfile.mkdtemp()
    if os.path.exists(out):
        os.remove(out)
    proc = subprocess.Popen([CHROME, "--headless=new", "--disable-gpu", "--hide-scrollbars",
                             "--force-device-scale-factor=%d" % scale,
                             "--window-size=%d,%d" % (w, h), "--virtual-time-budget=%d" % (15000 if url else 6000),
                             "--user-data-dir=" + tmp, "--mute-audio",
                             "--screenshot=" + out, url or ("file://" + os.path.join(HERE, "brand", src))],
                            stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    try:
        proc.wait(timeout=40)
    except subprocess.TimeoutExpired:
        proc.kill()
        proc.wait()
    shutil.rmtree(tmp, ignore_errors=True)
    assert os.path.exists(out), "스크린샷 실패: " + src
    if os.path.dirname(out) == ROOT:
        print("written", os.path.relpath(out, ROOT))

def serve():
    """게임 화면 캡처는 게임 페이지를 iframe으로 조작해야 해서 같은 출처의 로컬 서버가 필요하다."""
    import http.server, socketserver, threading, functools
    class Quiet(http.server.SimpleHTTPRequestHandler):
        def log_message(self, *a):
            pass
    handler = functools.partial(Quiet, directory=ROOT)
    srv = socketserver.TCPServer(("127.0.0.1", 0), handler)
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    return srv

import sys
if "--shots-only" not in sys.argv:
    shot("og.html", os.path.join(ROOT, "og.png"), 1200, 630)
    icon512 = os.path.join(ROOT, "icon-512.png")
    shot("icon.html", icon512, 512, 512)
    for size, name in ((192, "icon-192.png"), (180, "apple-touch-icon.png")):
        out = os.path.join(ROOT, name)
        subprocess.check_call(["sips", "-z", str(size), str(size), icon512, "--out", out], stdout=subprocess.DEVNULL)
        print("written", name)

# 로비 카드용 실제 게임 화면 (휴대폰 크기 390×300, 2배 해상도 → JPEG)
srv = serve()
for page in ("arcade", "specialty"):
    png = os.path.join(tempfile.mkdtemp(), page + ".png")
    shot(None, png, 390, 300, url="http://127.0.0.1:%d/src/brand/shot.html?p=%s" % (srv.server_address[1], page), scale=2)
    out = os.path.join(ROOT, "shot-%s.jpg" % page)
    subprocess.check_call(["sips", "-s", "format", "jpeg", "-s", "formatOptions", "82", png, "--out", out],
                          stdout=subprocess.DEVNULL)
    print("written", os.path.basename(out), "%d KB" % (os.path.getsize(out) // 1024))
srv.shutdown()
