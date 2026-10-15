# route_raw.json (tools/route_fetch.py) -> route-graph.js: kavsak grafi, tek yonler, donus yasaklari.
# Kullanim: python tools/route_build.py route_raw.json route-graph.js
import json, math, sys
RAW, OUT = sys.argv[1:3]
r = json.load(open(RAW, encoding="utf-8"))
WAYS = [e for e in r["elements"] if e["type"] == "way"]
RELS = [e for e in r["elements"] if e["type"] == "relation"]

KX = 111320 * math.cos(math.radians(51.52)); KY = 110540
def dist(a, b): return math.hypot((a[1] - b[1]) * KX, (a[0] - b[0]) * KY)

# --- Arac (PHV) girebilir mi? Kosullu kurallar (saatli) yok sayilir.
def drivable(t):
    if t.get("area") == "yes": return False
    mv = t.get("motor_vehicle") or t.get("motorcar")
    # "destination" = yalniz oraya gidecek arac (teslimat/erisim): gecis rotasi olamaz. Yayalastirilan eski Strand
    # (St Mary le Strand cevresi, 2022) boyle etiketli; eskiden serbest sayildigi icin en iyi rota oradan geciyordu.
    if mv in ("no", "private", "permit", "delivery", "agricultural", "destination"): return False
    if mv in ("yes", "designated", "permissive"): return True
    if t.get("vehicle") in ("no", "private", "destination"): return False
    if t.get("access") in ("no", "private", "destination"): return False
    return True
def oneway(t):
    o = t.get("oneway")
    if o in ("yes", "true", "1"): return 1
    if o == "-1": return -1
    if o in ("no", "alternating", "reversible"): return 0
    if t.get("junction") in ("roundabout", "circular") or t.get("highway") in ("motorway", "motorway_link"): return 1
    return 0
MINOR = {"residential", "unclassified", "living_street"}

ways = {w["id"]: w for w in WAYS if drivable(w["tags"])}
use = {}
for w in ways.values():
    for i, n in enumerate(w["nodes"]):
        use[n] = use.get(n, 0) + (2 if i in (0, len(w["nodes"]) - 1) else 1)
coord = {}
for w in ways.values():
    for n, g in zip(w["nodes"], w["geometry"]): coord[n] = (g["lat"], g["lon"])
junction = {n for n, c in use.items() if c >= 2}
# yasak iliskilerindeki "via" dugumleri de kavsak sayilsin
for rel in RELS:
    for m in rel["members"]:
        if m["role"] == "via" and m["type"] == "node" and m["ref"] in coord: junction.add(m["ref"])

edges = []  # {a,b,way,ow,minor,name,geom,len}
for w in ways.values():
    ns = w["nodes"]; t = w["tags"]
    start = 0
    for i in range(1, len(ns)):
        if ns[i] in junction or i == len(ns) - 1:
            seg = ns[start:i + 1]
            g = [coord[n] for n in seg]
            L = sum(dist(g[k], g[k + 1]) for k in range(len(g) - 1))
            if L > 0.5:
                edges.append({"a": seg[0], "b": seg[-1], "way": w["id"], "ow": oneway(t), "minor": t.get("highway") in MINOR,
                              "name": t.get("name") or t.get("ref") or "", "geom": g, "len": L})
            start = i

# --- En buyuk guclu bagli bilesen (tek yonler dahil); disarida kalan parcalar (otopark cikisi vb.) atilir
adj, radj = {}, {}
def link(x, y): adj.setdefault(x, []).append(y); radj.setdefault(y, []).append(x)
for e in edges:
    if e["ow"] >= 0: link(e["a"], e["b"])
    if e["ow"] <= 0: link(e["b"], e["a"])
nodes_all = set(adj) | set(radj)
order, seen = [], set()
for s in nodes_all:  # Kosaraju, yinelemeli
    if s in seen: continue
    stack = [(s, iter(adj.get(s, [])))]; seen.add(s)
    while stack:
        v, it = stack[-1]
        nxt = next(it, None)
        if nxt is None: stack.pop(); order.append(v)
        elif nxt not in seen: seen.add(nxt); stack.append((nxt, iter(adj.get(nxt, []))))
comp, cid = {}, 0
for s in reversed(order):
    if s in comp: continue
    stack = [s]; comp[s] = cid
    while stack:
        v = stack.pop()
        for u in radj.get(v, []):
            if u not in comp: comp[u] = cid; stack.append(u)
    cid += 1
sizes = {}
for v, c in comp.items(): sizes[c] = sizes.get(c, 0) + 1
main = max(sizes, key=sizes.get)
edges = [e for e in edges if comp.get(e["a"]) == main and comp.get(e["b"]) == main]
print("edges", len(edges), "main SCC nodes", sizes[main], "of", len(nodes_all))

# --- Indeksle
nid = {}
for e in edges:
    for n in (e["a"], e["b"]):
        if n not in nid: nid[n] = len(nid)
names = sorted({e["name"] for e in edges})
nameix = {n: i for i, n in enumerate(names)}
by_way_node = {}  # (way, node) -> edge indexes touching node
for i, e in enumerate(edges):
    by_way_node.setdefault((e["way"], e["a"]), []).append(i)
    by_way_node.setdefault((e["way"], e["b"]), []).append(i)
at_node = {}
for i, e in enumerate(edges):
    at_node.setdefault(e["a"], []).append(i); at_node.setdefault(e["b"], []).append(i)

# --- Donus yasaklari: (giris kenari, cikis kenari) cifti; yalnizca dugum uzerinden olanlar
banned, signs, skipped, approach, placed = set(), [], 0, {}, []
E5 = lambda x: round(x * 1e5)
for rel in RELS:
    t = rel["tags"]; kind = t.get("restriction", "")
    if any(k.startswith("restriction:") for k in t) and not kind: skipped += 1; continue
    via = [m for m in rel["members"] if m["role"] == "via"]
    fr = [m["ref"] for m in rel["members"] if m["role"] == "from" and m["type"] == "way"]
    to = [m["ref"] for m in rel["members"] if m["role"] == "to" and m["type"] == "way"]
    if len(via) != 1 or via[0]["type"] != "node" or not fr or not to or not kind: skipped += 1; continue
    v = via[0]["ref"]
    ins = [i for f in fr for i in by_way_node.get((f, v), [])]
    outs_to = {i for tw in to for i in by_way_node.get((tw, v), [])}
    if not ins or not outs_to: skipped += 1; continue
    if kind.startswith("no_"):
        pairs = [(i, o) for i in ins for o in outs_to]
    elif kind.startswith("only_"):
        pairs = [(i, o) for i in ins for o in at_node[v] if o not in outs_to]
    else:
        skipped += 1; continue
    for p in pairs: banned.add(p)
    approach.setdefault((ins[0], v), set()).add(kind)

# Isaret kavsagin ustune degil, YAKLASILAN yolun uzerine (kavsaktan ~18 m geri) konur: hangi yonden gelene
# uygulandigi gorulsun. Bir yaklasmanin butun yasaklari TEK isarette toplanir (OSM ayni kavsak icin ayri kayitlar
# tutuyor; Oxford Circus'ta 14 isaret ust uste biniyordu). Isaret yaklasma yonune dondurulur (gelen aracin gidis
# yonu, kuzeyden saat yonunde derece) ve gidis yonunun SOLUNA (UK) 5 m kaydirilir: cift yonlu yolda hangi seride
# ait oldugu gorulsun. Baska bir isarete 12 m'den yakin duserse yol boyunca geriye kaydirilir.
for (ei, v), kinds in sorted(approach.items()):
    e = edges[ei]
    g = e["geom"] if e["b"] == v else e["geom"][::-1]  # g[-1] = kavsak
    def place(back):
        pos, seg = g[-1], (g[-2], g[-1])
        for k in range(len(g) - 1, 0, -1):
            L = dist(g[k], g[k - 1]); seg = (g[k - 1], g[k])
            if L >= back: t = back / L; pos = (g[k][0] + t * (g[k - 1][0] - g[k][0]), g[k][1] + t * (g[k - 1][1] - g[k][1])); break
            back -= L; pos = g[k - 1]
        dx, dy = (seg[1][1] - seg[0][1]) * KX, (seg[1][0] - seg[0][0]) * KY  # metre: dogu, kuzey
        n = math.hypot(dx, dy) or 1
        pos = (pos[0] + 5.0 * dx / n / KY, pos[1] - 5.0 * dy / n / KX)  # sola 5 m: (dogu, kuzey) -> (-kuzey, dogu)
        return pos, math.degrees(math.atan2(dx, dy)) % 360
    back = 18.0
    pos, brg = place(back)
    for _ in range(4):
        if all(dist(pos, q) >= 12 for q in placed): break
        back += 12; pos, brg = place(back)
    placed.append(pos)
    signs.append([E5(pos[0]), E5(pos[1]), ",".join(sorted(kinds)), round(brg)])
print("banned pairs", len(banned), "restriction signs", len(signs), "skipped", skipped)

def simplify(g, tol=2.5):
    if len(g) < 3: return g
    a, b = g[0], g[-1]
    def pd(p):
        ax, ay, bx, by, px, py = a[1] * KX, a[0] * KY, b[1] * KX, b[0] * KY, p[1] * KX, p[0] * KY
        dx, dy = bx - ax, by - ay
        t = 0 if dx == dy == 0 else max(0, min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)))
        return math.hypot(px - ax - t * dx, py - ay - t * dy)
    idx, dm = max(((i, pd(g[i])) for i in range(1, len(g) - 1)), key=lambda x: x[1])
    if dm <= tol: return [a, b]
    return simplify(g[:idx + 1], tol)[:-1] + simplify(g[idx:], tol)

E5 = lambda x: round(x * 1e5)
nodes = [None] * len(nid)
for n, i in nid.items(): nodes[i] = [E5(coord[n][0]), E5(coord[n][1])]
out_edges = []
for e in edges:
    mid = simplify(e["geom"])[1:-1]
    # [a, b, tek yon (1 a->b, -1 b->a, 0 iki yon), ara yol mu, ad no, uzunluk m, ara noktalar duz dizi]
    out_edges.append([nid[e["a"]], nid[e["b"]], e["ow"], 1 if e["minor"] else 0, nameix[e["name"]], round(e["len"], 1),
                      [c for p in mid for c in (E5(p[0]), E5(p[1]))]])
data = {"nodes": nodes, "edges": out_edges, "names": names, "banned": sorted(banned), "signs": signs}
js = ("// Otomatik uretildi: tools/route_build.py. Veri (c) OpenStreetMap katkicilari, ODbL.\n"
      "// Koordinatlar 1e5 ile carpilmis tam sayi. edges: [a, b, tekyon, ara yol, ad no, uzunluk m, ara noktalar].\n"
      "window.ROUTE_GRAPH = " + json.dumps(data, ensure_ascii=False, separators=(",", ":")) + ";\n")
open(OUT, "w", encoding="utf-8").write(js)
print("nodes", len(nodes), "bytes", len(js.encode()))
