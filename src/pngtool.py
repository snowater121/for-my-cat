# -*- coding: utf-8 -*-
"""
pngtool.py — PNG를 읽고 쓰고, 흰 배경을 지운다. 바깥 라이브러리 없이 zlib만 쓴다.
(맥에 Pillow가 없고 sips는 배경을 못 지운다.)

  w, h, px = read_rgba("a.png")     # px 는 bytearray, 픽셀당 RGBA 4바이트
  cut_background(w, h, px)          # 테두리와 이어진 흰 배경을 투명하게
  write_rgba("b.png", w, h, px)
"""
import zlib, struct


# ------------------------------------------------------------------ 읽기
def read_rgba(path):
    d = open(path, "rb").read()
    assert d[:8] == b"\x89PNG\r\n\x1a\n", "PNG이 아니다: " + path
    i, idat, pal, trns = 8, [], None, None
    w = h = depth = ctype = interlace = None
    while i < len(d):
        ln, typ = struct.unpack_from(">I4s", d, i)
        body = d[i + 8:i + 8 + ln]
        if typ == b"IHDR":
            w, h, depth, ctype, _, _, interlace = struct.unpack(">IIBBBBB", body)
        elif typ == b"PLTE":
            pal = body
        elif typ == b"tRNS":
            trns = body
        elif typ == b"IDAT":
            idat.append(body)
        elif typ == b"IEND":
            break
        i += 12 + ln
    assert depth == 8, "8비트 PNG만 다룬다 (%s: %d비트)" % (path, depth)
    assert interlace == 0, "인터레이스 PNG는 다루지 않는다: " + path
    ch = {0: 1, 2: 3, 3: 1, 4: 2, 6: 4}[ctype]
    raw = zlib.decompress(b"".join(idat))

    # 스캔라인 필터 풀기
    stride = w * ch
    out = bytearray(h * stride)
    prev = bytearray(stride)
    p = 0
    for y in range(h):
        ft = raw[p]; p += 1
        line = bytearray(raw[p:p + stride]); p += stride
        if ft == 1:
            for x in range(ch, stride):
                line[x] = (line[x] + line[x - ch]) & 255
        elif ft == 2:
            for x in range(stride):
                line[x] = (line[x] + prev[x]) & 255
        elif ft == 3:
            for x in range(stride):
                a = line[x - ch] if x >= ch else 0
                line[x] = (line[x] + ((a + prev[x]) >> 1)) & 255
        elif ft == 4:
            for x in range(stride):
                a = line[x - ch] if x >= ch else 0
                c = prev[x - ch] if x >= ch else 0
                b = prev[x]
                q = a + b - c
                pa, pb, pc = abs(q - a), abs(q - b), abs(q - c)
                pr = a if (pa <= pb and pa <= pc) else (b if pb <= pc else c)
                line[x] = (line[x] + pr) & 255
        out[y * stride:(y + 1) * stride] = line
        prev = line

    # RGBA로 맞추기
    px = bytearray(w * h * 4)
    for k in range(w * h):
        s, t = k * ch, k * 4
        if ctype == 6:
            px[t:t + 4] = out[s:s + 4]
        elif ctype == 2:
            px[t:t + 3] = out[s:s + 3]; px[t + 3] = 255
        elif ctype == 3:
            v = out[s]
            px[t:t + 3] = pal[v * 3:v * 3 + 3]
            px[t + 3] = trns[v] if (trns and v < len(trns)) else 255
        elif ctype == 0:
            g = out[s]; px[t] = px[t + 1] = px[t + 2] = g; px[t + 3] = 255
        elif ctype == 4:
            g = out[s]; px[t] = px[t + 1] = px[t + 2] = g; px[t + 3] = out[s + 1]
    return w, h, px


# ------------------------------------------------------------------ 쓰기
def write_rgba(path, w, h, px):
    stride = w * 4
    raw = bytearray()
    for y in range(h):
        raw.append(0)                                  # 필터 없음
        raw += px[y * stride:(y + 1) * stride]

    def chunk(t, b):
        return struct.pack(">I", len(b)) + t + b + struct.pack(">I", zlib.crc32(t + b) & 0xFFFFFFFF)

    out = b"\x89PNG\r\n\x1a\n"
    out += chunk(b"IHDR", struct.pack(">IIBBBBB", w, h, 8, 6, 0, 0, 0))
    out += chunk(b"IDAT", zlib.compress(bytes(raw), 9))
    out += chunk(b"IEND", b"")
    open(path, "wb").write(out)


# ------------------------------------------------------------------ 배경 지우기
def has_opaque_border(w, h, px):
    """가장자리 안쪽 한 겹이 불투명한 무채색으로 차 있으면 배경을 지워야 하는 그림이다."""
    m = max(4, min(w, h) // 12)        # 바깥 여백이 투명할 수 있어 꽤 안쪽을 본다
    n = op = 0
    for x in range(m, w - m, 3):
        for y in (m, h - 1 - m):
            k = (y * w + x) * 4
            n += 1
            if _plain(px, k):
                op += 1
    return bool(n) and op / float(n) > 0.6


def _plain(px, k):
    """불투명한 밝은 무채색 = 배경. 고양이 크림색(240,230,215)은 색이 살짝 있어 걸리지 않는다."""
    if px[k + 3] < 24:
        return False
    r, g, b = px[k], px[k + 1], px[k + 2]
    return min(r, g, b) >= 150 and (max(r, g, b) - min(r, g, b)) <= 16


def cut_background(w, h, px, feather=True):
    """테두리에서 시작해 이어진 밝은 무채색 배경(체크무늬·흰 패널)만 투명하게 만든다.
    고양이 안쪽의 크림색 주둥이·발은 테두리와 이어져 있지 않아 살아남는다.

    경계 보정은 알파만 낮춘다. 예전에 색까지 되돌리려다(un-premultiply)
    밝은 가장자리가 새까맣게 변해 주둥이가 뭉개진 적이 있다.
    """
    def loose(i):
        k = i * 4
        return px[k + 3] < 24 or _plain(px, k)

    def bg(i):
        """배경 후보이면서 사방이 대체로 배경이어야 한다.
        이 이웃 조건이 없으면 고양이 주둥이를 가로지르는 흰 수염을 타고 들어가 수염을 지운다."""
        k = i * 4
        if px[k + 3] < 24:
            return True
        if not _plain(px, k):
            return False
        x, y = i % w, i // w
        n = 0
        for j, inside in ((i - 1, x > 0), (i + 1, x < w - 1), (i - w, y > 0), (i + w, y < h - 1)):
            if not inside or loose(j):
                n += 1
        return n >= 3

    seen = bytearray(w * h)
    stack = []
    for x in range(w):
        for y in (0, h - 1):
            stack.append(y * w + x)
    for y in range(h):
        for x in (0, w - 1):
            stack.append(y * w + x)
    while stack:
        i = stack.pop()
        if seen[i] or not bg(i):
            continue
        seen[i] = 1
        x, y = i % w, i // w
        if x > 0:     stack.append(i - 1)
        if x < w - 1: stack.append(i + 1)
        if y > 0:     stack.append(i - w)
        if y < h - 1: stack.append(i + w)

    # 배경에 닿은 한 겹만 반투명으로 — 배경색이 섞여 들어간 띠를 지운다. 딱 한 겹이라 안으로 번지지 않는다.
    edge = []
    if feather:
        for i in range(w * h):
            if seen[i]:
                continue
            x, y = i % w, i // w
            if ((x > 0 and seen[i - 1]) or (x < w - 1 and seen[i + 1]) or
                    (y > 0 and seen[i - w]) or (y < h - 1 and seen[i + w])):
                k = i * 4
                if min(px[k], px[k + 1], px[k + 2]) >= 190:
                    edge.append(i)

    for i in range(w * h):
        if seen[i]:
            px[i * 4 + 3] = 0
    for i in edge:
        px[i * 4 + 3] = min(px[i * 4 + 3], 110)
    return sum(seen)


def trim(w, h, px, pad=2, thr=8):
    """투명한 여백을 잘라낸다. 여백이 남아 있으면 화면에서 그림이 실제보다 작게 보인다."""
    x0, y0, x1, y1 = w, h, -1, -1
    for y in range(h):
        row = y * w
        for x in range(w):
            if px[(row + x) * 4 + 3] > thr:
                if x < x0: x0 = x
                if x > x1: x1 = x
                if y < y0: y0 = y
                if y > y1: y1 = y
    if x1 < 0:
        return w, h, px
    x0 = max(0, x0 - pad); y0 = max(0, y0 - pad)
    x1 = min(w - 1, x1 + pad); y1 = min(h - 1, y1 + pad)
    nw, nh = x1 - x0 + 1, y1 - y0 + 1
    out = bytearray(nw * nh * 4)
    for y in range(nh):
        s = ((y + y0) * w + x0) * 4
        out[y * nw * 4:(y + 1) * nw * 4] = px[s:s + nw * 4]
    return nw, nh, out
