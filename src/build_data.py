# -*- coding: utf-8 -*-
import json

paths = json.load(open('/tmp/paths.json'))

# code: [ko_primary, kanji_full, kana_base, romaji, region, [ko_aliases...]]
D = {
 "HOK":["홋카이도","北海道","ほっかいどう","Hokkaido","홋카이도",["호카이도"]],
 "AOM":["아오모리","青森県","あおもり","Aomori","도호쿠",[]],
 "IWT":["이와테","岩手県","いわて","Iwate","도호쿠",[]],
 "MGI":["미야기","宮城県","みやぎ","Miyagi","도호쿠",[]],
 "AKI":["아키타","秋田県","あきた","Akita","도호쿠",[]],
 "YGT":["야마가타","山形県","やまがた","Yamagata","도호쿠",[]],
 "FSH":["후쿠시마","福島県","ふくしま","Fukushima","도호쿠",[]],
 "IBR":["이바라키","茨城県","いばらき","Ibaraki","간토",["이바라기"]],
 "TCG":["도치기","栃木県","とちぎ","Tochigi","간토",["토치기"]],
 "GNM":["군마","群馬県","ぐんま","Gunma","간토",["구마"]],
 "STM":["사이타마","埼玉県","さいたま","Saitama","간토",[]],
 "CHB":["지바","千葉県","ちば","Chiba","간토",["치바"]],
 "TKY":["도쿄","東京都","とうきょう","Tokyo","간토",["도쿄도","동경","토쿄"]],
 "KNG":["가나가와","神奈川県","かながわ","Kanagawa","간토",["카나가와"]],
 "NGT":["니가타","新潟県","にいがた","Niigata","주부",["니이가타"]],
 "TYM":["도야마","富山県","とやま","Toyama","주부",["토야마"]],
 "ISH":["이시카와","石川県","いしかわ","Ishikawa","주부",[]],
 "FKU":["후쿠이","福井県","ふくい","Fukui","주부",[]],
 "YMN":["야마나시","山梨県","やまなし","Yamanashi","주부",[]],
 "NGN":["나가노","長野県","ながの","Nagano","주부",[]],
 "GIF":["기후","岐阜県","ぎふ","Gifu","주부",["기부"]],
 "SZK":["시즈오카","静岡県","しずおか","Shizuoka","주부",[]],
 "AIC":["아이치","愛知県","あいち","Aichi","주부",[]],
 "MIE":["미에","三重県","みえ","Mie","간사이",[]],
 "SHG":["시가","滋賀県","しが","Shiga","간사이",[]],
 "KYO":["교토","京都府","きょうと","Kyoto","간사이",["교토부","쿄토"]],
 "OSK":["오사카","大阪府","おおさか","Osaka","간사이",["오사카부","오오사카"]],
 "HYG":["효고","兵庫県","ひょうご","Hyogo","간사이",[]],
 "NRA":["나라","奈良県","なら","Nara","간사이",[]],
 "WKM":["와카야마","和歌山県","わかやま","Wakayama","간사이",[]],
 "TTR":["돗토리","鳥取県","とっとり","Tottori","주고쿠",["도토리"]],
 "SHM":["시마네","島根県","しまね","Shimane","주고쿠",[]],
 "OKY":["오카야마","岡山県","おかやま","Okayama","주고쿠",[]],
 "HRS":["히로시마","広島県","ひろしま","Hiroshima","주고쿠",[]],
 "YMG":["야마구치","山口県","やまぐち","Yamaguchi","주고쿠",[]],
 "TSJ":["도쿠시마","徳島県","とくしま","Tokushima","시코쿠",["토쿠시마"]],
 "KGG":["가가와","香川県","かがわ","Kagawa","시코쿠",["카가와"]],
 "EHM":["에히메","愛媛県","えひめ","Ehime","시코쿠",[]],
 "KCH":["고치","高知県","こうち","Kochi","시코쿠",["코치"]],
 "FKO":["후쿠오카","福岡県","ふくおか","Fukuoka","규슈·오키나와",[]],
 "SGA":["사가","佐賀県","さが","Saga","규슈·오키나와",[]],
 "NGS":["나가사키","長崎県","ながさき","Nagasaki","규슈·오키나와",[]],
 "KMT":["구마모토","熊本県","くまもと","Kumamoto","규슈·오키나와",["쿠마모토"]],
 "OIT":["오이타","大分県","おおいた","Oita","규슈·오키나와",["오오이타"]],
 "MYZ":["미야자키","宮崎県","みやざき","Miyazaki","규슈·오키나와",[]],
 "KGS":["가고시마","鹿児島県","かごしま","Kagoshima","규슈·오키나와",["카고시마"]],
 "OKN":["오키나와","沖縄県","おきなわ","Okinawa","규슈·오키나와",[]],
}

assert set(D)==set(paths), set(paths)-set(D)

def kanji_base(k):
    for suf in ["都","道","府","県"]:
        if k.endswith(suf): return k[:-1]
    return k

out={}
for code,(ko,kanji,kana,romaji,region,aliases) in D.items():
    accepted=set()
    accepted.add(ko)
    for a in aliases: accepted.add(a)
    accepted.add(kanji); accepted.add(kanji_base(kanji))
    accepted.add(kana)
    # kana with dou for hokkaido already full; add base without trailing う? keep as is
    accepted.add(romaji.lower())
    out[code]={
        "ko":ko,"kanji":kanji,"kana":kana,"romaji":romaji,
        "region":region,"accepted":sorted(accepted),"d":paths[code]
    }

json.dump(out, open('data.json','w'), ensure_ascii=False)
print("prefectures:",len(out))
print("sample TKY:", {k:v for k,v in out['TKY'].items() if k!='d'})
