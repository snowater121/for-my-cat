# -*- coding: utf-8 -*-
import json, re

src = open('build_html2.py').read()
m = re.search(r"HTML = r'''(.*?)'''", src, re.S)
HTML = m.group(1)

world = json.load(open('world.json'))
DATA_JS = json.dumps(world, ensure_ascii=False)

# --- transforms ---
# EJU disabled
HTML = HTML.replace('const EJU = __EJU__;', 'const EJU = {};')
# continents
region_js = ('const REGION_ORDER = ["아시아","유럽","아프리카","북·중미","남아메리카","오세아니아","기타"];\n'
 'const REGION_COLOR = {\n'
 ' "아시아":"#E15759","유럽":"#4E79A7","아프리카":"#F28E2B","북·중미":"#59A14F",\n'
 ' "남아메리카":"#B07AA1","오세아니아":"#76B7B2","기타":"#9aa4b2"\n'
 '};')
HTML = re.sub(r'const REGION_ORDER = \[.*?\];\nconst REGION_COLOR = \{.*?\};', region_js, HTML, flags=re.S)
# viewBox + FULL_VB (world)
HTML = HTML.replace('viewBox="-40 -5 650 546"', 'viewBox="0 0 1010 666"')
HTML = HTML.replace('const FULL_VB=[-40,-5,650,546];', 'const FULL_VB=[0,0,1010,666];')
# title / brand
HTML = HTML.replace('<title>일본 도도부현 메모리 · Japan Prefecture Metro</title>',
                    '<title>세계 국가 이름 메모리 · World Countries Metro</title>')
HTML = HTML.replace('🗾 일본 도도부현 메모리', '🌍 세계 국가 이름 메모리')
# remove only the EJU mode button (keep #ejudir element hidden so its JS handler stays valid)
HTML = HTML.replace('      <button data-m="eju">🎓 EJU 지역</button>\n', '')
# switch button: point back to Japan version
HTML = HTML.replace('<a class="btn" id="switchbtn" href="world_countries_metro.html" title="세계 버전으로">🌍 세계</a>',
                    '<a class="btn" id="switchbtn" href="japan_prefectures_metro.html" title="일본 버전으로">🗾 일본</a>')
# language toggle: 日本語 -> English
HTML = HTML.replace('<button data-l="ja">日本語</button>', '<button data-l="ja">English</button>')
HTML = HTML.replace('"日本語で入力（漢字・かな・ローマ字）"', '"영어(English)로 입력"')
HTML = HTML.replace('"日本語で入력"', '"영어(English)로 입력"')
HTML = HTML.replace('"日本語で入力"', '"영어(English)로 입력"')
# smaller labels for dense world map
HTML = HTML.replace('text.lbl{fill:#f4f8ff;font-size:8px;', 'text.lbl{fill:#f4f8ff;font-size:6px;')
# data
HTML = HTML.replace('__DATA__', DATA_JS)

open('world_countries_metro.html','w').write(HTML)
print("written", len(HTML), "bytes; countries:", len(world))
# leftover checks
for tok in ['__DATA__','__EJU__','日本語','data-m="eju"','홋카이도']:
    print("leftover",tok,":", tok in HTML)
