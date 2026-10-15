# A-Z benzeri harita icin arac yollari DISINDAKI katmanlar: yaya yollari, adli servis yollari, park, su, demiryolu.
# Arac yollari route_raw.json'dan (tools/route_fetch.py) gelir. Veri (c) OpenStreetMap katkicilari, ODbL.
# Kullanim: python tools/map_fetch.py map_raw.json
import json, sys, urllib.request, urllib.parse
BBOX = (51.500, -0.172, 51.540, -0.105)  # route_fetch.py ile ayni kutu
q = f"""[out:json][timeout:180];
(
  way["highway"="pedestrian"]{BBOX};
  way["highway"="service"]["name"]{BBOX};
  nwr["leisure"~"^(park|garden)$"]{BBOX};
  nwr["natural"="water"]{BBOX};
  nwr["waterway"="riverbank"]{BBOX};
  way["railway"="rail"]["tunnel"!="yes"]{BBOX};
);
out body geom;"""
UA = {"User-Agent": "sinav-provasi-dataprep/0.1 (one-off build script)"}
for ep in ["https://overpass-api.de/api/interpreter", "https://overpass.kumi.systems/api/interpreter"]:
    try:
        req = urllib.request.Request(ep, data=urllib.parse.urlencode({"data": q}).encode(), headers=UA)
        r = json.load(urllib.request.urlopen(req, timeout=240))
        break
    except Exception as e:
        print("fail", ep, e)
else:
    sys.exit(1)
json.dump(r, open(sys.argv[1], "w", encoding="utf-8"))
print("elements", len(r["elements"]), "osm base", r.get("osm3s", {}).get("timestamp_osm_base"))
