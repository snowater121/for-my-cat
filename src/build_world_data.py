# -*- coding: utf-8 -*-
import json, re

# 1) SVG paths
svg = open('/tmp/ex__svg-maps_world/package/index.js').read()
# strip "export default"
obj = svg[svg.index('{'):]
data = json.loads(obj)
viewBox = data['viewBox']
locs = data['locations']

# 2) Korean names
ko = json.load(open('/tmp/ex_i18n-iso-countries/package/langs/ko.json'))['countries']
en_i = json.load(open('/tmp/ex_i18n-iso-countries/package/langs/en.json'))['countries']
def first(v): return v[0] if isinstance(v,list) else v

# 3) continents
wc = json.load(open('/tmp/ex_world-countries/package/dist/countries.json'))
region={}; sub={}
for c in wc:
    region[c['cca2']]=c['region']; sub[c['cca2']]=c['subregion']
REGION_KO={"Asia":"아시아","Europe":"유럽","Africa":"아프리카","Oceania":"오세아니아","Antarctic":"기타"}
def continent(code):
    r=region.get(code,"")
    if r in REGION_KO: return REGION_KO[r]
    if r=="Americas":
        return "남아메리카" if sub.get(code,"")=="South America" else "북·중미"
    return "기타"

# aliases for common countries (code -> extra accepted)
ALIAS={
 "KR":["한국","남한","코리아","southkorea"],"KP":["북한","조선","북조선","northkorea"],
 "US":["미국","아메리카","usa","america","합중국"],"GB":["영국","uk","잉글랜드"],
 "RU":["러시아","로씨야"],"CN":["중국","중화인민공화국"],"JP":["일본","니혼"],
 "DE":["독일"],"FR":["프랑스"],"IT":["이탈리아"],"ES":["스페인","에스파냐"],
 "NL":["네덜란드","화란"],"CH":["스위스"],"IN":["인도"],"BR":["브라질"],
 "CA":["캐나다"],"AU":["호주","오스트레일리아"],"MX":["멕시코"],"EG":["이집트"],
 "TR":["터키","튀르키예"],"SA":["사우디","사우디아라비아"],"AE":["아랍에미리트","uae"],
 "CZ":["체코"],"VN":["베트남","월남"],"TH":["태국","타이"],"PH":["필리핀"],
 "ID":["인도네시아"],"GR":["그리스"],"PT":["포르투갈"],"SE":["스웨덴"],
 "NO":["노르웨이"],"DK":["덴마크"],"FI":["핀란드"],"PL":["폴란드"],
 "AR":["아르헨티나"],"CL":["칠레"],"ZA":["남아공","남아프리카공화국"],
 "NZ":["뉴질랜드"],"IE":["아일랜드"],"AT":["오스트리아"],"BE":["벨기에"],
 "TW":["대만","타이완"],"HK":["홍콩"],"IR":["이란"],"IQ":["이라크"],
 "IL":["이스라엘"],"UA":["우크라이나"],"MY":["말레이시아"],"SG":["싱가포르"],
}

out={}
skip=0
for L in locs:
    code=L['id'].upper()
    d=L['path']
    if not d or not d.strip(): skip+=1; continue
    en = first(en_i.get(code)) or L['name']
    kon = first(ko.get(code)) or en
    cont = continent(code)
    acc=set()
    acc.add(kon); acc.add(en.lower())
    # add i18n english variants (array) as aliases
    ev=en_i.get(code)
    if isinstance(ev,list):
        for x in ev: acc.add(x.lower())
    kv=ko.get(code)
    if isinstance(kv,list):
        for x in kv: acc.add(x)
    for a in ALIAS.get(code,[]): acc.add(a.lower() if a.isascii() else a)
    out[code]={"ko":kon,"kanji":en,"kana":en,"romaji":en,"region":cont,
               "accepted":sorted(acc),"d":d}

json.dump(out, open('world.json','w'), ensure_ascii=False)
from collections import Counter
cc=Counter(v['region'] for v in out.values())
print("countries:",len(out),"skipped(empty path):",skip)
print("viewBox:",viewBox)
print("continents:",dict(cc))
print("sample US:",{k:v for k,v in out['US'].items() if k!='d'})
