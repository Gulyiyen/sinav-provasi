# topo_raw.json + topo_stations.json -> topo-geo.js (sokak noktalari/cizgileri, yol numaralari, onemli yerler)
# Kullanim: python tools/topo_fetch.py raw.json stations.json
# sonra: python tools/topo_build.py raw.json stations.json topo-geo.js
import json, math, sys
RAW, ST, OUT = sys.argv[1:4]
d = json.load(open(RAW, encoding="utf-8"))
stations = json.load(open(ST, encoding="utf-8"))

LAT0 = 51.51
KX = 111320 * math.cos(math.radians(LAT0)); KY = 110540
def m(p): return (p[1] * KX, p[0] * KY)
def dist(a, b): (x1, y1), (x2, y2) = m(a), m(b); return math.hypot(x1 - x2, y1 - y2)
def seglen(g): return sum(dist(g[i], g[i + 1]) for i in range(len(g) - 1))
def pt_seg(p, a, b):
    (px, py), (ax, ay), (bx, by) = m(p), m(a), m(b)
    dx, dy = bx - ax, by - ay
    t = 0 if dx == dy == 0 else max(0, min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)))
    return math.hypot(px - ax - t * dx, py - ay - t * dy)
def simplify(g, tol=6):
    if len(g) < 3: return g
    a, b = g[0], g[-1]; idx, dm = 0, 0
    for i in range(1, len(g) - 1):
        dd = pt_seg(g[i], a, b)
        if dd > dm: idx, dm = i, dd
    if dm <= tol: return [a, b]
    return simplify(g[:idx + 1], tol)[:-1] + simplify(g[idx:], tol)

streets = []
for name, s in d["streets"].items():
    gs = s["geoms"]
    # ayni adli ama ayri sokaklari ayir: uclari 40 m icinde olan parcalar ayni sokaktir
    par = list(range(len(gs)))
    def f(i):
        while par[i] != i: par[i] = par[par[i]]; i = par[i]
        return i
    for i in range(len(gs)):
        for j in range(i + 1, len(gs)):
            if any(dist(p, q) < 40 for p in (gs[i][0], gs[i][-1]) for q in (gs[j][0], gs[j][-1])):
                par[f(i)] = f(j)
    cl = {}
    for i in range(len(gs)): cl.setdefault(f(i), []).append(i)
    best = max(cl.values(), key=lambda ix: sum(seglen(gs[i]) for i in ix))
    geoms = [gs[i] for i in best]
    total = sum(seglen(g) for g in geoms)
    if total < 300: continue
    streets.append({"n": name, "geoms": geoms, "len": total})

# yol numarasi: yalnizca en buyuk parcada >=85% ayni numara olan sokaklar
raw_refs = {}
for name, s in d["streets"].items():
    pass
# refs'i parca bazinda yeniden hesaplamak icin ham etiketler yok; ham toplamdaki baskin numara + tek parca kosulu
for st in streets:
    s = d["streets"][st["n"]]
    tot = s["len"]
    refs = sorted(s["refs"].items(), key=lambda x: -x[1])
    share_main = st["len"] / sum(seglen(g) for g in s["geoms"])  # en buyuk parcanin, ayni adli tum yollara orani
    ok = (share_main > 0.999 and refs and refs[0][1] / tot >= 0.85) or (share_main >= 0.8 and refs and refs[0][1] / tot >= 0.9)
    if ok and ";" not in refs[0][0]:
        st["ref"] = refs[0][0]

# isaret noktasi: en uzun parcanin ortasi
for st in streets:
    g = max(st["geoms"], key=seglen)
    half, acc = seglen(g) / 2, 0
    for i in range(len(g) - 1):
        L = dist(g[i], g[i + 1])
        if acc + L >= half:
            t = (half - acc) / L if L else 0
            st["pt"] = [g[i][0] + t * (g[i + 1][0] - g[i][0]), g[i][1] + t * (g[i + 1][1] - g[i][1])]
            break
        acc += L

def near_line(p, geoms, lim):
    return any(pt_seg(p, g[i], g[i + 1]) < lim for g in geoms for i in range(len(g) - 1))

# her sokak icin "karistirilabilir" komsular: 1.5 km icinde, ama isarete 150 m'den yakin gecmeyen sokaklar
for st in streets:
    st["nb"] = [o["n"] for o in streets if o is not st and dist(st["pt"], o["pt"]) < 1500 and not near_line(st["pt"], o["geoms"], 150)]

LM = ["Buckingham Palace", "Trafalgar Square", "Piccadilly Circus", "Marble Arch", "Hyde Park Corner", "Tower of London",
      "St Paul's Cathedral", "British Museum", "Natural History Museum", "Covent Garden Market", "Tate Modern", "Royal Albert Hall",
      "Harrods", "Westminster Abbey", "Tower Bridge", "The Shard", "Bank of England", "Lord's Cricket Ground", "Madame Tussauds",
      "Elizabeth Tower (Big Ben)", "St Thomas' Hospital", "Guy's Hospital", "University College Hospital", "Royal Festival Hall",
      "Imperial War Museum", "Kensington Palace", "Emirates Stadium", "Battersea Power Station", "Smithfield Market"]
places = [{"n": n, "k": "place", "p": [round(d["landmarks"][n]["lat"], 5), round(d["landmarks"][n]["lng"], 5)]} for n in LM]

# istasyonlar: OSM adi -> gosterilen ad; ana hat istasyonlari "London X" adli dugumden
ST_MAP = {"London Victoria": "Victoria station", "London Waterloo": "Waterloo station", "London Paddington": "Paddington station",
          "London Euston": "Euston station", "London King's Cross": "King's Cross station", "London Liverpool Street": "Liverpool Street station",
          "London Marylebone": "Marylebone station", "London Bridge": "London Bridge station", "London Fenchurch Street": "Fenchurch Street station",
          "London Cannon Street": "Cannon Street station", "Charing Cross": "Charing Cross station"}
TUBE = ["Angel", "Baker Street", "Bank", "Barbican", "Bond Street", "Borough", "Camden Town", "Chancery Lane", "Covent Garden",
        "Earl's Court", "Edgware Road", "Elephant & Castle", "Embankment", "Euston Square", "Farringdon", "Gloucester Road", "Goodge Street",
        "Great Portland Street", "Green Park", "Highbury & Islington", "Holborn", "Hyde Park Corner", "Kennington", "Knightsbridge",
        "Lambeth North", "Lancaster Gate", "Leicester Square", "Mansion House", "Marble Arch", "Monument", "Moorgate", "Mornington Crescent",
        "Notting Hill Gate", "Old Street", "Oval", "Oxford Circus", "Piccadilly Circus", "Pimlico", "Queensway", "Regent's Park",
        "Russell Square", "Sloane Square", "South Kensington", "Southwark", "St. James's Park", "St. Paul's", "Temple", "Tottenham Court Road",
        "Tower Hill", "Vauxhall", "Warren Street", "Westminster", "Whitechapel", "Aldgate", "Aldgate East", "Shoreditch High Street",
        "High Street Kensington", "Swiss Cottage", "Chalk Farm", "Brixton", "Stockwell", "Mile End", "Bethnal Green"]
by = {}
for s in stations: by.setdefault(s["name"], []).append(s)
for osm, show in ST_MAP.items():
    if osm in by: s = by[osm][0]; places.append({"n": show, "k": "station", "osm": osm, "p": [round(s["lat"], 5), round(s["lng"], 5)]})
    else: print("no station", osm)
for t in TUBE:
    if t in by:
        # ayni adli birden cok dugum: birbirine 300 m'den uzaksa belirsiz, atla
        pts = by[t]
        if any(dist((a["lat"], a["lng"]), (b["lat"], b["lng"])) > 300 for a in pts for b in pts): print("ambiguous", t); continue
        s = pts[0]; places.append({"n": t + " station", "k": "station", "osm": t, "p": [round(s["lat"], 5), round(s["lng"], 5)]})
    else: print("no tube", t)

out_st = [{"n": s["n"], "ref": s.get("ref"), "pt": [round(s["pt"][0], 5), round(s["pt"][1], 5)], "nb": s["nb"],
           "g": [[[round(p[0], 5), round(p[1], 5)] for p in simplify(g)] for g in s["geoms"]]} for s in streets]
js = "// Otomatik uretildi (OpenStreetMap verisi, (c) OpenStreetMap katkicilari, ODbL). Elle duzenlemeyin; tools/ altindaki betikle yeniden uretin.\n"
js += "window.TOPO_GEO = " + json.dumps({"streets": out_st, "places": places}, ensure_ascii=False, separators=(",", ":")) + ";\n"
open(OUT, "w", encoding="utf-8").write(js)
print("streets", len(out_st), "with ref", sum(1 for s in out_st if s["ref"]), "places", len(places), "bytes", len(js.encode()))
print("streets with <3 neighbours:", [s["n"] for s in out_st if len(s["nb"]) < 3])
