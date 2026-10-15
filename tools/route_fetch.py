# Rota cizme icin yol agi: arac yollari (tek yon bilgisiyle) + donus yasaklari (OSM restriction iliskileri).
# Kullanim: python tools/route_fetch.py route_raw.json
import json, sys, time, urllib.request, urllib.parse
BBOX = (51.500, -0.172, 51.540, -0.105)  # Marylebone, Fitzrovia, Bloomsbury, Soho, Mayfair, Westminster, Covent Garden
HW = "motorway|motorway_link|trunk|trunk_link|primary|primary_link|secondary|secondary_link|tertiary|tertiary_link|unclassified|residential|living_street"
q = f"""[out:json][timeout:180];
way["highway"~"^({HW})$"]{BBOX}->.w;
.w out body geom;
relation["type"="restriction"](bw.w);
out body;"""
UA = {"User-Agent": "sinav-provasi-dataprep/0.1 (one-off build script)"}
# Overpass ucretsiz ve ara sira yogun (500/504): 3 tur, turlar arasi bekleyerek dener
r = None
for attempt in range(3):
    for ep in ["https://overpass-api.de/api/interpreter", "https://overpass.kumi.systems/api/interpreter", "https://overpass.private.coffee/api/interpreter"]:
        try:
            req = urllib.request.Request(ep, data=urllib.parse.urlencode({"data": q}).encode(), headers=UA)
            r = json.load(urllib.request.urlopen(req, timeout=240))
            break
        except Exception as e:
            print("fail", ep, e)
    if r: break
    time.sleep(60 * (attempt + 1))
if not r:
    sys.exit(1)
json.dump(r, open(sys.argv[1], "w", encoding="utf-8"))
ways = [e for e in r["elements"] if e["type"] == "way"]
rels = [e for e in r["elements"] if e["type"] == "relation"]
print("ways", len(ways), "restrictions", len(rels))
