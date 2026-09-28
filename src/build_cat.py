# -*- coding: utf-8 -*-
"""
build_cat.py — 고양이 역장 원본 그림을 사이트가 쓸 크기로 줄여 ../mascot/ 에 넣는다.

원본은 `src/brand/cat/` (사용자가 만든 투명 PNG). 앱 아이콘은 brand/icon.html 이
원본을 직접 읽으므로 여기서 만들지 않는다. 흰/회색 배경이 남아 있는 것은
`pngtool.cut_background`로 지운 뒤 줄인다.

페이지는 `mascot/<상태>.png` 로 부르고, Artifact 본문에서만 data URI로 박아 넣는다
(build_artifact.py 가 한다).

    python3 build_cat.py        # build_all.py 가 알아서 부른다
"""
import hashlib, io, os, subprocess, tempfile
import pngtool

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, "brand", "cat")
OUT = os.path.join(os.path.dirname(HERE), "mascot")

# 상태 → (원본 파일, 내보낼 긴 변 크기)
#   얼굴 컷은 화면에서 60~110px로 쓴다. 220px면 고해상도 화면에서도 충분하다.
#   전신 컷은 로비·결과 이미지·아이콘처럼 큰 자리에 쓴다.
SPRITES = {
    "base":     ("expression_01_neutral.png",    180),   # 기본 — 대기
    "happy":    ("expression_03_happy.png",      180),   # 웃음 — 정답
    "combo":    ("expression_06_big_laugh.png",  180),   # 크게 웃음 — 연속 정답
    "wink":     ("expression_04_wink.png",       180),   # 윙크 — 인사
    "focus":    ("expression_08_curious.png",    180),   # 집중 — 힌트
    "surprise": ("expression_09_surprised.png",  180),   # 놀람
    "panic":    ("expression_14_dizzy.png",      180),   # 당황 — 오답
    "full":     ("turnaround_01_front.png",      300),   # 전신 정면 — 결과 이미지
    "full3q":   ("turnaround_02_front_3q.png",   300),   # 전신 3/4 — 로비
    # 맵을 고르면 시작 화면에 뜨는 그림. 고른 것만 받으므로 첫 화면 용량에 얹히지 않는다.
    "map_jp":    ("map_japan.png",               360),   # 일본
    "map_kr":    ("map_korea.png",               360),   # 한국 (시·도·시·군 공용)
    "map_world": ("map_global.png",              360),   # 세계
}


def version():
    """그림이 바뀌면 주소도 바뀌도록 — 안 그러면 브라우저가 옛 그림을 계속 쓴다."""
    h = hashlib.sha1()
    for k in sorted(SPRITES):
        h.update(io.open(os.path.join(OUT, k + ".png"), "rb").read())
    return h.hexdigest()[:8]


def urls(prefix="mascot/"):
    v = version()
    return {k: "%s%s.png?v=%s" % (prefix, k, v) for k in SPRITES}


def prepare(src):
    """배경을 지운 임시 파일을 돌려준다.

    원본 중에는 '투명'이라면서 실제로는 체크무늬(투명 표시용 격자)나 회색 패널이
    그림으로 구워져 있는 것이 있다. 이미 투명한 그림에 돌려도 바뀌는 것이 없으므로
    가리지 않고 전부 한 번 거친다."""
    path = os.path.join(SRC, src)
    assert os.path.exists(path), "원본이 없다: " + path
    w, h, px = pngtool.read_rgba(path)
    before = sum(1 for i in range(0, w * h, 11) if px[i * 4 + 3] > 200)
    pngtool.cut_background(w, h, px)
    after = sum(1 for i in range(0, w * h, 11) if px[i * 4 + 3] > 200)
    w, h, px = pngtool.trim(w, h, px)          # 투명 여백을 남기면 화면에서 작게 보인다
    tmp = os.path.join(tempfile.gettempdir(), "cat_cut_" + src)
    pngtool.write_rgba(tmp, w, h, px)
    return tmp, before - after > before * 0.02


def main():
    if not os.path.isdir(OUT):
        os.makedirs(OUT)
    cache, total = {}, 0
    for name, (src, size) in sorted(SPRITES.items()):
        if src not in cache:
            cache[src] = prepare(src)
        path, cut = cache[src]
        d = os.path.join(OUT, name + ".png")
        subprocess.check_call(["sips", "-Z", str(size), path, "--out", d], stdout=subprocess.DEVNULL)
        n = os.path.getsize(d)
        total += n
        print("  mascot/%-12s %5.1f KB  ← %s%s" % (name + ".png", n / 1024.0, src, " (배경 제거)" if cut else ""))
    print("mascot/ — %d장 %.0f KB" % (len(SPRITES), total / 1024.0))


if __name__ == "__main__":
    main()
