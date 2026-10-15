# route_raw.json + map_raw.json -> map-data.js: A-Z BENZERI kendi haritamiz icin cizim verisi.
# A-Z'den yalniz gorunum fikri alinir (renkli yol siniflari, her sokakta ad, tek yon oklari); veri ve cizim bizim, OSM'den.
# Kullanim: python tools/map_build.py route_raw.json map_raw.json map-data.js
import json, math, sys
RAW, EXTRA, OUT = sys.argv[1:4]
KX = 111320 * math.cos(math.radians(51.52)); KY = 110540
E5 = lambda x: round(x * 1e5)

def simplify(g, tol=1.2):
    """Douglas-Peucker, metre cinsinden (g: [(lat, lon)])."""
    if len(g) < 3: return g
    a, b = g[0], g[-1]
    ax, ay, bx, by = a[1] * KX, a[0] * KY, b[1] * KX, b[0] * KY
    dx, dy = bx - ax, by - ay; L2 = dx * dx + dy * dy
    def pd(p):
        px, py = p[1] * KX, p[0] * KY
        t = 0 if L2 == 0 else max(0, min(1, ((px - ax) * dx + (py - ay) * dy) / L2))
        return math.hypot(px - ax - t * dx, py - ay - t * dy)
    i, d = max(((i, pd(g[i])) for i in range(1, len(g) - 1)), key=lambda x: x[1])
    if d <= tol: return [a, b]
    return simplify(g[:i + 1], tol)[:-1] + simplify(g[i:], tol)

def flat(g):
    """Delta kodlu E5 tam sayilar: [lat0, lon0, dlat1, dlon1, ...] - dosya kucuk kalsin."""
    out, pl, pn = [], 0, 0
    for la, ln in g:
        a, b = E5(la), E5(ln); out += [a - pl, b - pn]; pl, pn = a, b
    return out

names, nix = [], {}
def name_id(n):
    if not n: return -1
    if n not in nix: nix[n] = len(names); names.append(n)
    return nix[n]

# Yol siniflari: 0 = A yolu, 1 = B yolu, 2 = ucuncul (tertiary), 3 = ara sokak, 4 = yaya/arac giremez, 5 = servis (adli)
def road_class(t):
    hw = t.get("highway", "").replace("_link", "")
    ref = (t.get("ref") or "").strip()
    mv = t.get("motor_vehicle") or t.get("motorcar") or t.get("vehicle") or t.get("access")
    if hw == "pedestrian" or mv in ("no", "destination", "private", "delivery"): return 4
    if hw == "service": return 5
    if ref.startswith("A") or hw in ("motorway", "trunk", "primary"): return 0
    if ref.startswith("B") or hw == "secondary": return 1
    if hw == "tertiary": return 2
    return 3
def oneway(t):
    o = t.get("oneway")
    if o in ("yes", "true", "1"): return 1
    if o == "-1": return -1
    if t.get("junction") in ("roundabout", "circular"): return 1
    return 0

roads, seen = [], set()
for src in (RAW, EXTRA):
    for e in json.load(open(src, encoding="utf-8"))["elements"]:
        t = e.get("tags", {})
        if e["type"] != "way" or "highway" not in t or e["id"] in seen or "geometry" not in e: continue
        seen.add(e["id"])
        g = simplify([(p["lat"], p["lon"]) for p in e["geometry"]])
        ref = (t.get("ref") or "").split(";")[0].strip()
        roads.append([road_class(t), name_id(t.get("name")), name_id(ref if ref[:1] in "AB" else ""), oneway(t), flat(g)])

# Alanlar: multipolygon iliskilerinin dis halkalari uc uca eklenir
def rings_from(members):
    segs = [[(p["lat"], p["lon"]) for p in m["geometry"]] for m in members if m.get("geometry") and m.get("role", "outer") in ("outer", "")]
    rings = []
    while segs:
        ring = segs.pop(0)
        changed = True
        while changed and ring[0] != ring[-1]:
            changed = False
            for i, s in enumerate(segs):
                if s[0] == ring[-1]: ring += s[1:]
                elif s[-1] == ring[-1]: ring += s[::-1][1:]
                elif s[-1] == ring[0]: ring = s + ring[1:]
                elif s[0] == ring[0]: ring = s[::-1] + ring[1:]
                else: continue
                segs.pop(i); changed = True; break
        rings.append(ring)
    return rings

areas, rails = [], []
for e in json.load(open(EXTRA, encoding="utf-8"))["elements"]:
    t = e.get("tags", {})
    kind = 0 if t.get("leisure") in ("park", "garden") else 1 if (t.get("natural") == "water" or t.get("waterway") == "riverbank") else None
    if t.get("railway") == "rail" and e["type"] == "way":
        rails.append(flat(simplify([(p["lat"], p["lon"]) for p in e["geometry"]], 2)))
        continue
    if kind is None: continue
    if e["type"] == "way" and e.get("geometry"):
        rs = [[(p["lat"], p["lon"]) for p in e["geometry"]]]
    elif e["type"] == "relation":
        rs = rings_from(e.get("members", []))
    else: continue
    for r in rs:
        if len(r) < 4: continue
        r = simplify(r, 2)
        if len(r) >= 3: areas.append([kind, name_id(t.get("name") if kind == 0 else ""), flat(r)])

# Su once, sonra park (park suyun ustunde kalmasin diye ters sira cizilir)
areas.sort(key=lambda a: -a[0])
data = {"names": names, "roads": roads, "areas": areas, "rails": rails}
js = ("// Otomatik uretildi: tools/map_build.py. Veri (c) OpenStreetMap katkicilari, ODbL.\n"
      "// roads: [sinif 0=A 1=B 2=ucuncul 3=ara 4=yaya 5=servis, ad no, yol no, tek yon, delta E5 koordinat]\n"
      "window.MAP_DATA = " + json.dumps(data, ensure_ascii=False, separators=(",", ":")) + ";\n")
open(OUT, "w", encoding="utf-8").write(js)
from collections import Counter
print("roads", len(roads), Counter(r[0] for r in roads), "areas", len(areas), Counter(a[0] for a in areas), "rails", len(rails), "bytes", len(js.encode()))
