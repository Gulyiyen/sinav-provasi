# Rota cizme + harita icin KAPI testi: veri yenilendikten sonra yayina cikmadan once calisir (aylik otomasyon da).
# Gercek tarayicida (Playwright/Chromium) sayfayi acar. Bir kontrol bile kalirsa cikis kodu 1: yeni veri yayina cikmaz.
# Kullanim: python tools/check_route.py [--quick]
#   - en iyi rotayi birebir izleyen aday her soruda 22/22 alir
#   - hicbir en iyi rotada U donusu yok; hicbir soru Kingsway'den gecmiyor
#   - en iyi rota boyunca haritaya GERCEKTEN dokunan aday (0 ve 135 derece donuk harita) 22/22 alir
#   - yasak donus puan kirmaz, uyari verir; harita ve isaretler hatasiz cizilir; konsol hatasi yok
#   - veri boyutu oncekine gore makul (Overpass yarim cevap dondururse yakalanir)
import functools, http.server, json, os, subprocess, sys, threading
from playwright.sync_api import sync_playwright

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
QUICK = "--quick" in sys.argv
N = 20 if QUICK else 60
fails = []
def check(ok, msg):
    print(("PASS " if ok else "FAIL ") + msg, flush=True)
    if not ok: fails.append(msg)

# --- Veri boyutu: git'teki onceki surume gore (ilk kez ise atlanir)
def counts(js):
    s = js[js.index("{"):js.rindex("}") + 1]; d = json.loads(s)
    return {k: len(v) for k, v in d.items() if isinstance(v, list)}
for f in ("route-graph.js", "map-data.js"):
    try:
        old = subprocess.run(["git", "show", "HEAD:" + f], cwd=ROOT, capture_output=True, text=True, encoding="utf-8").stdout
        new = open(os.path.join(ROOT, f), encoding="utf-8").read()
        if not old: continue
        co, cn = counts(old), counts(new)
        for k in ("nodes", "edges", "roads", "areas"):
            if k in co and co[k]:
                r = cn.get(k, 0) / co[k]
                check(0.85 <= r <= 1.15, f"{f} {k}: {co[k]} -> {cn.get(k, 0)} (%{round((r - 1) * 100)})")
    except Exception as e:
        check(False, f"{f} okunamadi: {e}")

H = functools.partial(http.server.SimpleHTTPRequestHandler, directory=ROOT); H.log_message = lambda *a: None
srv = http.server.ThreadingHTTPServer(("127.0.0.1", 0), H); threading.Thread(target=srv.serve_forever, daemon=True).start()
URL = f"http://127.0.0.1:{srv.server_address[1]}/index.html"

TAP = '''([kind, bear]) => { const R = __route, G = R.graph(), st = R.state(), q = st.qs[st.qi], m = R.map();
  const nodes = [q.best.steps[0].from]; let acc = 0;
  q.best.steps.forEach((s, i) => { const E = G.edges[s.e]; acc += E.len; const to = E.a === s.from ? E.b : E.a;
    if (acc > 120 || i === q.best.steps.length - 1) { nodes.push(to); acc = 0; } });
  if (m.setBearing) m.setBearing(bear);
  for (const n of nodes) { m.setView(G.nodes[n], 17, { animate: false }); R.tap(L.latLng(G.nodes[n][0], G.nodes[n][1])); }
  R.submit(); if (m.setBearing) m.setBearing(0);
  const r = R.state().results.slice(-1)[0].res;
  return { pts: r.pts, why: r.items.filter(x => x[0] === "no").map(x => x[1]), name: q.A.n + " -> " + q.B.n }; }'''

with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page(viewport={"width": 390, "height": 900}, device_scale_factor=2)
    errs = []
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.on("console", lambda m: m.type == "error" and errs.append(m.text))
    pg.goto(URL)
    pg.evaluate('() => __route.start("short")')
    pg.wait_for_function("() => __route.graph() && __route.state().qs.length && window.AZMap && AZMap.data()", timeout=60000)

    r = pg.evaluate('''(N) => { const R = __route, G = R.graph(), o = { n: 0, full: 0, u: 0, ww: 0, bad: [], ks: [], pl: {} };
      for (const k of ["short", "closed", "long"]) for (let i = 0; i < N; i++) {
        const q = R.makeQuestion(k); if (!q) continue; o.n++;
        const s = q.best.steps, res = R.score(q, [s[0].from, R.lastNode(s)], s);
        if (res.pts === 22) o.full++; else if (o.bad.length < 3) o.bad.push(q.A.n + " -> " + q.B.n + ": " + res.items.filter(x => x[0] === "no").map(x => x[1]).join(" | "));
        o.u += R.uTurnsIn(s).length; o.ww += res.wrongWay.length; o.pl[q.A.n] = 1; o.pl[q.B.n] = 1;
        if (s.some(x => G.edges[x.e].name === "Kingsway") && o.ks.length < 3) o.ks.push(q.A.n + " -> " + q.B.n);
      } return o; }''', N)
    check(r["n"] >= N * 2.5, f"soru uretimi: {r['n']} / {N * 3}")
    check(r["full"] == r["n"], f"en iyi rotayi izleyen aday tam puan: {r['full']} / {r['n']} {r['bad']}")
    check(not r["ks"], f"hicbir soru Kingsway'den gecmiyor (operator istegi) {r['ks']}")
    print("     soruda kullanilan farkli yer:", len(r["pl"]))
    check(r["u"] == 0 and r["ww"] == 0, f"en iyi rotalarda U donusu {r['u']}, ters yon {r['ww']}")

    taps = []
    for bear in (0, 135):
        for k in ["short", "closed", "long"] * (2 if QUICK else 5):
            pg.evaluate(f'() => __route.start("{k}")')
            pg.wait_for_function("() => __route.state().qs.length && !__route.state().taps.length", timeout=30000)
            taps.append(pg.evaluate(TAP, [k, bear]))
    bad = [t for t in taps if t["pts"] != 22]
    check(not bad, f"haritaya dokunarak en iyi rotayi izleyen aday tam puan: {len(taps) - len(bad)} / {len(taps)} {bad[:2]}")

    w = pg.evaluate('''() => { const R = __route, G = R.graph();
      let e1, e2, v;  // ortak kavsagi olan ilk yasak cift
      for (const k of G.banned) { [e1, e2] = k.split(",").map(Number); const A = G.edges[e1], B = G.edges[e2];
        v = [A.a, A.b].find(x => x === B.a || x === B.b); if (v != null && e1 !== e2) break; }
      const E1 = G.edges[e1];
      const q = R.state().qs[R.state().qi], st = [{ e: e1, from: E1.a === v ? E1.b : E1.a }, { e: e2, from: v }];
      const r = R.score(q, [st[0].from, v], st);
      return { warn: r.items.some(x => x[0] === "warn"), bannedDeduct: r.items.some(x => x[0] === "no" && /dönüş yasa/.test(x[1])) }; }''')
    check(w["warn"] and not w["bannedDeduct"], f"yasak donus uyarir, puan kirmaz: {w}")

    for z in (14, 16, 18):
        pg.evaluate(f"() => {{ const m = __route.map(); m.setView([51.515, -0.13], {z}, {{ animate: false }}); m.fire('moveend'); }}")
        pg.wait_for_timeout(200)
    check(not errs, f"konsol hatasi yok {errs[:3]}")
    b.close()
srv.shutdown()
print("FAIL SAYISI", len(fails))
sys.exit(1 if fails else 0)
