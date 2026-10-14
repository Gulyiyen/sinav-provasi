// Harita - ROTA CIZME (gercek sinavda 66 puan: 3 soru - kisa, yol kapatmali kisa, uzun).
// Yol agi route-graph.js'te (OSM: tek yonler + donus yasaklari); ilk kullanimda yuklenir.
// Aday haritaya kavsak kavsak dokunur; her dokunus en yakin kavsaga oturur, iki dokunus arasi yol boyunca birlesir.
// Puanlama TfL rehberindeki 4 kritere gore: baslangic/bitis, ters rota, en direkt rota, yasak yon/donus (+ kapali yol).
// TfL soru basina puan dagilimini yayinlamiyor: buradaki puan kesintileri TAHMINDIR, kriterler resmidir.
(() => {
  const $ = id => document.getElementById(id);
  const MAX = 22;                  // 66 / 3
  const MINOR_COST = 1.15;         // ara sokaklar biraz "pahali": en direkt rota ana yollari tercih etsin
  const TAP_PX = 34;               // dokunus bu kadar piksel icindeki kavsaga oturur
  // Iki dokunus arasi: en fazla 600 m YA DA en fazla 6 yol parcasi (The Mall gibi uzun, az kavsakli yollar serbest;
  // yalnizca basa ve sona dokunup rotayi sisteme cizdirmek engellenir)
  const MAX_HOP = 600, MAX_HOP_EDGES = 6, HOP_SEARCH = 3000;
  // Isaret bir kavsak degil bir YER: yerin cevresindeki her kavsak baslangic/varis sayilir.
  // (Tek kavsaga oturtunca Piccadilly Circus gibi tek yonlu meydanlarda 'en iyi rota' meydani dolasiyordu.)
  const R_START = 80, R_END = 100;
  let G = null, map = null, layers = null, signLayer = null;

  // --- Veri ---
  function loadGraph() {
    if (G) return Promise.resolve(G);
    return new Promise((ok, fail) => {
      const s = document.createElement("script");
      s.src = "route-graph.js"; s.onload = () => { prepare(window.ROUTE_GRAPH); ok(G); }; s.onerror = fail;
      document.head.append(s);
    });
  }
  function prepare(R) {
    const nodes = R.nodes.map(([a, b]) => [a / 1e5, b / 1e5]);
    const adj = nodes.map(() => []);
    const edges = R.edges.map(([a, b, ow, minor, name, len, mid], i) => {
      const pts = [nodes[a]];
      for (let k = 0; k < mid.length; k += 2) pts.push([mid[k] / 1e5, mid[k + 1] / 1e5]);
      pts.push(nodes[b]);
      adj[a].push(i); adj[b].push(i);
      return { a, b, ow, minor: !!minor, name: R.names[name], len, pts };
    });
    G = { nodes, edges, adj, banned: new Set(R.banned.map(([x, y]) => x + "," + y)), signs: R.signs };
  }
  const other = (e, n) => (G.edges[e].a === n ? G.edges[e].b : G.edges[e].a);
  const legal = (e, from) => { const E = G.edges[e]; return E.ow === 0 || (E.ow === 1 ? E.a === from : E.b === from); };
  function meters(p, q) { const kx = 111320 * Math.cos(p[0] * Math.PI / 180); return Math.hypot((p[1] - q[1]) * kx, (p[0] - q[0]) * 110540); }

  // Kucuk ikili yigin
  function Heap() { const h = []; return {
    push(c, v) { h.push([c, v]); let i = h.length - 1; while (i) { const p = (i - 1) >> 1; if (h[p][0] <= h[i][0]) break; [h[p], h[i]] = [h[i], h[p]]; i = p; } },
    pop() { const t = h[0], l = h.pop(); if (h.length) { h[0] = l; let i = 0; for (;;) { const a = 2 * i + 1, b = a + 1; let m = i;
      if (a < h.length && h[a][0] < h[m][0]) m = a; if (b < h.length && h[b][0] < h[m][0]) m = b; if (m === i) break; [h[m], h[i]] = [h[i], h[m]]; i = m; } } return t; },
    get size() { return h.length; } }; }

  // En direkt YASAL rota: kenar tabanli Dijkstra (donus yasaklari icin gelinen kenar da durumun parcasi)
  function bestRoute(sources, targets, closed) {
    const dist = new Map(), prev = new Map(), H = Heap();
    const key = (e, n) => e + ">" + n;
    sources.forEach(s => { dist.set(key(-1, s), 0); H.push(0, [-1, s]); });
    while (H.size) {
      const [c, [ein, n]] = H.pop();
      const k = key(ein, n);
      if (c > dist.get(k)) continue;
      if (targets.has(n)) {
        const path = []; let cur = k;
        while (prev.has(cur)) { const p = prev.get(cur); path.push(p.step); cur = p.from; }
        return { steps: path.reverse(), cost: c };
      }
      for (const e of G.adj[n]) {
        if (closed && closed.has(e)) continue;
        if (!legal(e, n)) continue;
        if (ein >= 0 && G.banned.has(ein + "," + e)) continue;
        if (e === ein && G.adj[n].length > 1) continue;  // ayni yoldan geri donus yok (cikmaz sokak haric)
        const m = other(e, n), E = G.edges[e];
        const nc = c + E.len * (E.minor ? MINOR_COST : 1), nk = key(e, m);
        if (nc < (dist.has(nk) ? dist.get(nk) : Infinity)) { dist.set(nk, nc); prev.set(nk, { from: k, step: { e, from: n } }); H.push(nc, [e, m]); }
      }
    }
    return null;
  }
  // Iki dokunus arasi yol: adayin dokundugu yerleri birlestirir. Kural disi parcalar YASAK DEGIL, yalnizca biraz
  // pahali: neredeyse esit bir yasal yol varsa o cizilir (adayin kastetmedigi ihlal cezalanmasin);
  // aday kural disi yola sik sik dokunursa o yol cizilir ve puanlamada yakalanir.
  function hop(s, t, closed) {
    const dist = new Map(), prev = new Map(), H = Heap();
    const key = (e, n) => e + ">" + n;
    dist.set(key(-1, s), 0); H.push(0, [-1, s, 0]);
    while (H.size) {
      const [c, [ein, n, len]] = H.pop();
      const k = key(ein, n);
      if (c > dist.get(k) || len > HOP_SEARCH) continue;
      if (n === t) {
        const p = []; let cur = k;
        while (prev.has(cur)) { const x = prev.get(cur); p.push(x.step); cur = x.from; }
        if (len > MAX_HOP && p.length > MAX_HOP_EDGES) return null;
        return { steps: p.reverse(), len };
      }
      for (const e of G.adj[n]) {
        if (e === ein && G.adj[n].length > 1) continue;
        const E = G.edges[e], m = other(e, n);
        let w = E.len;
        if (!legal(e, n) || (closed && closed.has(e))) w = w * 1.5 + 15;
        if (ein >= 0 && G.banned.has(ein + "," + e)) w += 40;
        const nc = c + w, nk = key(e, m);
        if (nc < (dist.has(nk) ? dist.get(nk) : Infinity)) { dist.set(nk, nc); prev.set(nk, { from: k, step: { e, from: n } }); H.push(nc, [e, m, len + E.len]); }
      }
    }
    return null;
  }
  const stepLen = steps => steps.reduce((a, s) => a + G.edges[s.e].len, 0);
  const stepCost = steps => steps.reduce((a, s) => a + G.edges[s.e].len * (G.edges[s.e].minor ? MINOR_COST : 1), 0);
  const stepPts = s => { const E = G.edges[s.e]; return E.a === s.from ? E.pts : E.pts.slice().reverse(); };

  // --- Soru uretimi ---
  function places() {
    const P = (window.TOPO_GEO && window.TOPO_GEO.places) || [];
    const lat = G.nodes.map(n => n[0]), lng = G.nodes.map(n => n[1]);
    const box = [Math.min(...lat) + 0.0015, Math.max(...lat) - 0.0015, Math.min(...lng) + 0.0025, Math.max(...lng) - 0.0025];
    return P.filter(p => p.p[0] > box[0] && p.p[0] < box[1] && p.p[1] > box[2] && p.p[1] < box[3]).map(p => {
      let best = -1, bd = Infinity;
      const within = r => G.nodes.map((n, i) => i).filter(i => meters(G.nodes[i], p.p) <= r);
      G.nodes.forEach((n, i) => { const d = meters(n, p.p); if (d < bd) { bd = d; best = i; } });
      // Yer yoldan uzaksa (bina ortasi, ornegin British Museum): en yakin kavsak + 60 m icindekiler
      const rs = Math.max(R_START, bd + 60), re = Math.max(R_END, bd + 60);
      return { n: p.n, p: p.p, rs, re, starts: within(rs), ends: within(re) };
    });
  }
  const rnd = a => a[Math.floor(Math.random() * a.length)];
  function makeQuestion(kind) {
    const P = places();
    const [lo, hi] = kind === "long" ? [2500, 4200] : [900, 1700];
    for (let t = 0; t < 300; t++) {
      const A = rnd(P), B = rnd(P);
      if (A === B || meters(A.p, B.p) < 500) continue;
      if (A.n.split(" ")[0] === B.n.split(" ")[0]) continue;  // "Marble Arch" / "Marble Arch station" gibi
      const r = bestRoute(A.starts, new Set(B.ends));
      if (!r) continue;
      const L = stepLen(r.steps);
      if (L < lo || L > hi) continue;
      const q = { kind, A, B, best: r, closed: null, closedName: "" };
      if (kind === "closed") {
        // En direkt rotanin uzerindeki, adi olan bir yolu (tum uzunluguyla) kapat
        const seen = {};
        r.steps.forEach(s => { const E = G.edges[s.e]; if (E.name && !/^[AB]\d/.test(E.name)) seen[E.name] = (seen[E.name] || 0) + E.len; });
        const cands = Object.keys(seen).filter(n => seen[n] > 150);
        if (!cands.length) continue;
        const name = rnd(cands);
        const closed = new Set(G.edges.map((E, i) => E.name === name ? i : -1).filter(i => i >= 0));
        // Kapali yol baslangic/varis bolgesine degmesin
        const touches = n => G.adj[n].some(e => closed.has(e));
        if (A.starts.some(touches) || B.ends.some(touches)) continue;
        const r2 = bestRoute(A.starts, new Set(B.ends), closed);
        if (!r2 || stepLen(r2.steps) > L * 2) continue;
        Object.assign(q, { best: r2, closed, closedName: name });
      }
      q.q = `What is the most direct route between ${A.n} (the green marker) and ${B.n} (the red marker)?` + (q.closedName ? ` NOTE: ${q.closedName} is CLOSED.` : "");
      q.tr = `${A.n} (yeşil işaret) ile ${B.n} (kırmızı işaret) arasındaki en direkt rota hangisi?` + (q.closedName ? ` DİKKAT: ${q.closedName} KAPALI.` : "");
      return q;
    }
    return null;
  }

  // --- Puanlama ---
  function score(q, taps, steps) {
    const out = { items: [], pts: MAX, wrongWay: [], bannedAt: [], closedUsed: [] };
    const near = (n, P, r) => meters(G.nodes[n], P.p) <= r + 25;  // dokunus payi
    if (!taps.length || !steps.length) {
      out.pts = 0; out.items.push(["no", "Rota çizilmedi.", -MAX]); return out;
    }
    const first = taps[0], last = taps[taps.length - 1];
    const atA = n => near(n, q.A, q.A.rs), atB = n => near(n, q.B, q.B.re);
    const reversed = atB(first) && atA(last);
    const ded = (ok, good, bad, d) => { out.items.push(ok ? ["ok", good, 0] : ["no", bad, -d]); if (!ok) out.pts -= d; };
    if (reversed) ded(false, "", "Rota TERS çizilmiş (kırmızıdan yeşile). TfL bunu puan kaybettiren hata sayar.", 11);
    else {
      ded(atA(first), "Başlangıç doğru (yeşil işaret).", "Rota yeşil işaretten başlamıyor.", 4);
      ded(atB(last), "Bitiş doğru (kırmızı işaret).", "Rota kırmızı işarette bitmiyor.", 4);
    }
    steps.forEach((s, i) => {
      if (!legal(s.e, s.from)) out.wrongWay.push(s.e);
      if (i && steps[i - 1].e !== s.e && G.banned.has(steps[i - 1].e + "," + s.e)) out.bannedAt.push(s.from);
      if (q.closed && q.closed.has(s.e)) out.closedUsed.push(s.e);
    });
    const ww = [...new Set(out.wrongWay.map(e => G.edges[e].name || "isimsiz yol"))];
    ded(!ww.length, "Tek yönlü yollara uyuldu.", `Tek yönlü yolda TERS yöne gidildi: ${ww.join(", ")}.`, Math.min(12, 4 * ww.length));
    ded(!out.bannedAt.length, "Yasak dönüş yok.", `${out.bannedAt.length} yasak dönüş yapıldı (haritadaki kırmızı halkalı işaretler).`, Math.min(12, 4 * out.bannedAt.length));
    if (q.closed) ded(!out.closedUsed.length, `Kapalı yol (${q.closedName}) kullanılmadı.`, `KAPALI yol kullanıldı: ${q.closedName}.`, 8);
    const um = Math.round(stepLen(steps)), bm = Math.round(stepLen(q.best.steps));
    if (reversed || !atA(first) || !atB(last)) {
      // Yeşilden kırmızıya tamamlanmamış rota: kısalığı "direkt" sayılamaz
      ded(false, "", `Rota yeşilden kırmızıya tamamlanmadığı için en direkt rota olarak değerlendirilemedi (en direkt yasal rota ${bm} m).`, 10);
    } else {
      const ratio = stepCost(steps) / q.best.cost;
      // %12'ye kadar uzun rota tam puan: ana yolu kullanan makul alternatif cezalanmasin
      const d = ratio <= 1.12 ? 0 : Math.min(10, Math.ceil((ratio - 1.12) / 0.04));
      ded(d === 0, `Rota direkt: ${um} m (en kısa yasal rota ${bm} m).`, `Rota en direkt değil: ${um} m, en direkt yasal rota ${bm} m (%${Math.round((ratio - 1) * 100)} daha uzun).`, d);
    }
    out.pts = Math.max(0, out.pts);
    return out;
  }

  // --- Ekran ---
  let qs = [], qi = 0, taps = [], steps = [], hops = [], results = [], mode = "single", done = false;
  const KIND_TR = { short: "Kısa rota", closed: "Kısa rota – yol kapalı", long: "Uzun rota" };

  function ensureMap() {
    if (map) return;
    map = L.map("route-map", { zoomControl: false, doubleClickZoom: false, zoomSnap: 0.5 });
    L.control.zoom({ position: "bottomright" }).addTo(map);
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);
    layers = L.layerGroup().addTo(map);
    // Donus yasagi isaretleri (OSM karolari gostermiyor): yakinlastirinca gorunur
    signLayer = L.layerGroup();
    // Highway Code bicimi: kirmizi halka + capraz cizgi = yasak, mavi daire = zorunlu yon
    const ARROW = {
      right_turn: (c) => `<path d="M40 80 V50 H60" fill="none" stroke="${c}" stroke-width="11"/><polygon points="56,32 80,50 56,68" fill="${c}"/>`,
      left_turn: (c) => `<path d="M60 80 V50 H40" fill="none" stroke="${c}" stroke-width="11"/><polygon points="44,32 20,50 44,68" fill="${c}"/>`,
      straight_on: (c) => `<path d="M50 84 V40" stroke="${c}" stroke-width="11"/><polygon points="32,44 50,18 68,44" fill="${c}"/>`,
      u_turn: (c) => `<path d="M62 82 V46 A12 12 0 0 0 38 46 V58" fill="none" stroke="${c}" stroke-width="10"/><polygon points="26,56 50,56 38,74" fill="${c}"/>`
    };
    const signSvg = kind => {
      const only = kind.startsWith("only_"), a = ARROW[kind.replace(/^(no|only)_/, "")];
      if (!a) return "";
      const body = only ? `<circle cx="50" cy="50" r="48" fill="#005eb8"/>` + a("#fff")
        : `<circle cx="50" cy="50" r="43" fill="#fff" stroke="#c8102e" stroke-width="12"/>` + a("#000") + `<line x1="20" y1="20" x2="80" y2="80" stroke="#c8102e" stroke-width="10"/>`;
      return `<svg viewBox="0 0 100 100" width="20" height="20">${body}</svg>`;
    };
    G.signs.forEach(([la, ln, kind]) => {
      const html = signSvg(kind);
      if (html) L.marker([la / 1e5, ln / 1e5], { interactive: false, icon: L.divIcon({ className: "rsign", iconSize: [20, 20], iconAnchor: [10, 10], html }) }).addTo(signLayer);
    });
    const vis = () => { if (map.getZoom() >= 16) signLayer.addTo(map); else signLayer.remove(); };
    map.on("zoomend", vis);
    map.on("click", ev => tap(ev.latlng));
  }
  const pin = (color, label) => L.divIcon({ className: "", iconSize: [28, 28], iconAnchor: [14, 14], html: `<div class="pin" style="background:${color};width:28px;height:28px;line-height:22px">${label}</div>` });

  function startRoutes(m) {
    mode = m;
    if (!window.L) { alert("Harita yüklenemedi. İnternet bağlantınızı kontrol edip sayfayı yenileyin."); return; }
    $("route-status").textContent = "Harita yükleniyor…";
    if (document.querySelector(".screen.on").id !== "s-route") show("s-route");  // "Yeni rota": ayni ekran, gecmise yazma
    loadGraph().then(() => {
      const kinds = m === "exam" ? ["short", "closed", "long"] : [m];
      qs = kinds.map(makeQuestion).filter(Boolean);
      qi = 0; results = [];
      ensureMap(); render();
    }).catch(() => { $("route-status").textContent = "Harita verisi yüklenemedi. İnternet bağlantınızı kontrol edin."; });
  }
  const show = (id, how) => window.showScreen(id, how);  // ortak gecis: telefonun geri tusu calissin

  function render() {
    const q = qs[qi];
    taps = []; steps = []; hops = []; done = false;
    $("route-progress").textContent = mode === "exam" ? `Rota ${qi + 1} / ${qs.length} · ${KIND_TR[q.kind]}` : KIND_TR[q.kind];
    $("route-q").textContent = q.q;
    $("route-tr").textContent = q.tr; $("route-tr").hidden = true;
    $("route-feedback").hidden = true;
    $("route-next").hidden = true;
    ["route-undo", "route-clear", "route-submit"].forEach(id => { $(id).hidden = false; });
    map.invalidateSize();
    map.fitBounds([q.A.p, q.B.p], { padding: [40, 40], animate: false });
    draw();
    $("route-status").textContent = "Yeşil işarete dokunarak başlayın, sonra yol boyunca kavşak kavşak dokunun.";
  }

  function draw(res) {
    const q = qs[qi];
    layers.clearLayers();
    if (q.closed) q.closed.forEach(e => L.polyline(G.edges[e].pts, { color: "#d0021b", weight: 8, opacity: 0.8, dashArray: "6 6", interactive: false }).addTo(layers));
    if (q.closed) {
      const mid = [...q.closed][Math.floor(q.closed.size / 2)];
      L.marker(G.edges[mid].pts[0], { interactive: false, icon: L.divIcon({ className: "", iconSize: null, html: `<div class="closedlab">CLOSED</div>` }) }).addTo(layers);
    }
    if (res) q.best.steps.forEach(s => L.polyline(stepPts(s), { color: "#1fb36b", weight: 10, opacity: 0.55, interactive: false }).addTo(layers));
    const bad = new Set(res ? res.wrongWay.concat(res.closedUsed) : []);
    steps.forEach(s => L.polyline(stepPts(s), { color: bad.has(s.e) ? "#e5484d" : "#2563eb", weight: 5, opacity: 0.95, interactive: false }).addTo(layers));
    if (res) res.bannedAt.forEach(n => L.circleMarker(G.nodes[n], { radius: 12, color: "#e5484d", weight: 4, fill: false }).addTo(layers));
    taps.forEach(n => L.circleMarker(G.nodes[n], { radius: 4, color: "#2563eb", fillColor: "#fff", fillOpacity: 1, weight: 2, interactive: false }).addTo(layers));
    L.marker(q.A.p, { icon: pin("#1fb36b", "A"), interactive: false }).bindTooltip(q.A.n, { permanent: true, direction: "top", offset: [0, -14] }).addTo(layers);
    L.marker(q.B.p, { icon: pin("#e5484d", "B"), interactive: false }).bindTooltip(q.B.n, { permanent: true, direction: "top", offset: [0, -14] }).addTo(layers);
    $("route-len").textContent = steps.length ? `Çizilen: ${Math.round(stepLen(steps))} m` : "";
  }

  function tap(ll) {
    if (done || !qs.length) return;
    const p = map.latLngToContainerPoint(ll);
    let best = -1, bd = TAP_PX;
    G.nodes.forEach((n, i) => {
      const d = p.distanceTo(map.latLngToContainerPoint(n));
      if (d < bd) { bd = d; best = i; }
    });
    if (best < 0) { $("route-status").textContent = "Oraya yakın bir kavşak yok – yolun üzerine, kavşağa yakın dokunun (gerekirse büyütün)."; return; }
    if (taps.length && taps[taps.length - 1] === best) return;
    if (taps.length) {
      const h = hop(taps[taps.length - 1], best, qs[qi].closed);
      if (!h) { $("route-status").textContent = "Bu nokta önceki noktadan çok uzak. Yol boyunca daha sık dokunun."; return; }
      hops.push(h.steps.length); steps.push(...h.steps);
    }
    taps.push(best);
    $("route-status").textContent = taps.length === 1 ? "Başladınız. Yol boyunca dokunmaya devam edin; bitince “Rotayı bitir”." : "Devam edin. Yanlış dokunduysanız “Geri al”.";
    draw();
  }
  function undo() {
    if (done || !taps.length) return;
    taps.pop();
    if (hops.length >= taps.length && hops.length) { const n = hops.pop(); steps.splice(steps.length - n, n); }
    draw();
  }
  function submit() {
    if (done) return;
    if (taps.length < 2) { $("route-status").textContent = "Önce rotayı çizin: en az iki noktaya dokunun."; return; }
    done = true;
    const q = qs[qi], res = score(q, taps, steps);
    results.push({ q, res });
    draw(res);
    const f = $("route-feedback"); f.innerHTML = "";
    const h = document.createElement("b"); h.textContent = `Puan: ${res.pts} / ${MAX}`; f.append(h);
    res.items.forEach(([k, t]) => { const p = document.createElement("p"); p.className = k === "ok" ? "ok" : "tip"; p.textContent = (k === "ok" ? "✓ " : "✗ ") + t; f.append(p); });
    const lg = document.createElement("p"); lg.className = "ref";
    lg.textContent = "Haritada: mavi = sizin rotanız, kırmızı = kurala aykırı kısım, yeşil = en direkt yasal rota. Puan kesintileri tahminidir (TfL dağılımı yayınlamıyor); kriterler TfL rehberinden. Değerlendirici ana yolları kullanan makul bir alternatifi de kabul edebilir.";
    f.append(lg); f.hidden = false;
    ["route-undo", "route-clear", "route-submit"].forEach(id => { $(id).hidden = true; });
    $("route-next").hidden = false;
    $("route-next").textContent = qi + 1 < qs.length ? "Sonraki rota →" : (mode === "exam" ? "Sonucu gör" : "Yeni rota");
    $("route-status").textContent = "";
    // Sonuc tum rotayi gostersin
    map.fitBounds(L.latLngBounds([].concat(...steps.map(stepPts), ...q.best.steps.map(stepPts))), { padding: [30, 30] });
  }
  function next() {
    if (qi + 1 < qs.length) { qi++; render(); window.scrollTo(0, 0); return; }
    if (mode !== "exam") { startRoutes(mode); return; }
    const tot = results.reduce((a, r) => a + r.res.pts, 0);
    $("route-score").textContent = `Rota puanı: ${tot} / ${MAX * results.length}`;
    $("route-verdict").textContent = `Gerçek sınavda rota soruları 100 puanın 66'sı. Geçmek için toplamda 60 gerekir; rotalardan ne kadar çok puan alırsanız çoktan seçmeli kısımda o kadar rahat edersiniz.`;
    const box = $("route-sum"); box.innerHTML = "";
    results.forEach(({ q, res }) => {
      const d = document.createElement("div"); d.className = "ans";
      const a = document.createElement("div"); a.className = "q"; a.textContent = `${KIND_TR[q.kind]}: ${res.pts} / ${MAX}`;
      const b = document.createElement("div"); b.className = "muted"; b.style.fontSize = "15px"; b.textContent = `${q.A.n} → ${q.B.n}` + (q.closedName ? ` (kapalı: ${q.closedName})` : "");
      d.append(a, b);
      res.items.filter(i => i[0] === "no").forEach(i => { const p = document.createElement("div"); p.className = "tip"; p.textContent = "✗ " + i[1]; d.append(p); });
      box.append(d);
    });
    show("s-route-result", "replace");
  }

  $("route-short").onclick = () => startRoutes("short");
  $("route-closed").onclick = () => startRoutes("closed");
  $("route-long").onclick = () => startRoutes("long");
  $("route-exam").onclick = () => startRoutes("exam");
  $("route-again").onclick = () => startRoutes("exam");
  $("route-undo").onclick = undo;
  $("route-clear").onclick = () => { if (!done) { taps = []; steps = []; hops = []; draw(); } };
  $("route-submit").onclick = submit;
  $("route-next").onclick = next;
  $("route-trbtn").onclick = () => { const t = $("route-tr"); t.hidden = !t.hidden; };
  window.__route = { start: startRoutes, tap, submit, state: () => ({ qs, qi, taps, steps, results, done }), graph: () => G, bestRoute, map: () => map };  // test icin
})();
