// Harita (Topographical) - coktan secmeli kisim. Gercek sinavda 34 puan; rota cizme (66 puan) ayri, henuz yok.
// Haritali sorular her seferinde topo-geo.js'deki OSM verisinden hesaplanir; cevap koordinattan gelir, elle yazilmaz.
(() => {
  const GEO = window.TOPO_GEO || { streets: [], places: [] };
  const SIGNS = window.TOPO_SIGNS || [], TF = window.TOPO_TF || [];
  const $ = id => document.getElementById(id);
  const HAS_MAP = !!window.L;

  const DIRS = ["North", "North-east", "East", "South-east", "South", "South-west", "West", "North-west"];
  const DIRS_TR = ["kuzey", "kuzeydoğu", "doğu", "güneydoğu", "güney", "güneybatı", "batı", "kuzeybatı"];
  const KIND = {
    compass: "Pusula ve yönler", grid: "Kare (grid) bulma", street: "Sokak bulma",
    road: "Yol numarası", sign: "İşaretler", tf: "Rota planlama – doğru mu, yanlış mı?"
  };
  const MIX = { practice: { compass: 2, grid: 2, street: 2, road: 1, sign: 2, tf: 1 },
                long: { compass: 4, grid: 4, street: 4, road: 3, sign: 3, tf: 2 } };
  const COLS = "ABCD", N = 4;

  const show = (id, how) => window.showScreen(id, how);  // ortak gecis: telefonun geri tusu calissin
  function shuffle(a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
  const rnd = a => a[Math.floor(Math.random() * a.length)];

  // Mesafe (m) ve pusula acisi (derece, kuzey=0, saat yonu)
  function meters(a, b) {
    const kx = 111320 * Math.cos(a[0] * Math.PI / 180);
    return Math.hypot((b[1] - a[1]) * kx, (b[0] - a[0]) * 110540);
  }
  function bearing(a, b) {
    const r = Math.PI / 180, f1 = a[0] * r, f2 = b[0] * r, dl = (b[1] - a[1]) * r;
    const y = Math.sin(dl) * Math.cos(f2), x = Math.cos(f1) * Math.sin(f2) - Math.sin(f1) * Math.cos(f2) * Math.cos(dl);
    return (Math.atan2(y, x) / r + 360) % 360;
  }
  // Uc yanlis sik + dogru cevap; o[0] her zaman dogru
  const opts = (right, pool) => [right].concat(shuffle(pool.filter(x => x !== right)).slice(0, 3));

  // --- Soru ureticileri ---
  function genCompass() {
    for (let t = 0; t < 500; t++) {
      const A = rnd(GEO.places), B = rnd(GEO.places);
      if (A === B) continue;
      const d = meters(A.p, B.p);
      if (d < 800 || d > 5000) continue;
      const b = bearing(A.p, B.p), k = Math.round(b / 45) % 8;
      if (Math.abs(((b - k * 45) + 540) % 360 - 180) > 12) continue;  // iki yonun arasina dusenler belirsiz, atla
      const drive = Math.random() < 0.5;
      const v = Math.round(Math.cos(k * 45 * Math.PI / 180) * 10), h = Math.round(Math.sin(k * 45 * Math.PI / 180) * 10);
      const where = [v > 0 ? "yukarıda" : v < 0 ? "aşağıda" : "", h > 0 ? "sağda" : h < 0 ? "solda" : ""].filter(Boolean).join(" ve ");
      return {
        kind: "compass",
        q: drive ? `You drive from ${A.n} (green marker) to ${B.n} (red marker). In which general direction are you travelling?`
                 : `In which direction is ${B.n} (red marker) from ${A.n} (green marker)?`,
        tr: drive ? `${A.n} (yeşil) noktasından ${B.n} (kırmızı) noktasına gidiyorsunuz. Genel olarak hangi yöne gidiyorsunuz?`
                  : `${A.n} (yeşil) noktasından bakınca ${B.n} (kırmızı) hangi yönde?`,
        o: opts(DIRS[k], DIRS),
        e: `Haritada kuzey yukarıdadır. Kırmızı işaret yeşile göre ${where} → ${DIRS_TR[k]} (${DIRS[k]}). Yaklaşık ${(d / 1000).toFixed(1)} km.`,
        map: { type: "pair", a: A, b: B }
      };
    }
  }

  function genGrid() {
    const st = GEO.places.filter(p => p.k === "station");
    const P = rnd(st), c = Math.floor(Math.random() * N), r = Math.floor(Math.random() * N);
    const right = COLS[c] + (r + 1);
    // Yanlis siklar: komsu kareler (en kolay karisan)
    const near = [];
    for (let dc = -1; dc <= 1; dc++) for (let dr = -1; dr <= 1; dr++) {
      const cc = c + dc, rr = r + dr;
      if ((dc || dr) && cc >= 0 && cc < N && rr >= 0 && rr < N) near.push(COLS[cc] + (rr + 1));
    }
    return {
      kind: "grid",
      q: `Using the grid on the map, in which square is ${P.n}?`,
      tr: `Haritadaki kareleri kullanarak: ${P.n} hangi karede?`,
      o: opts(right, near),
      e: `Önce harfe (üstteki sütun: A–D), sonra rakama (soldaki satır: 1–4) bakın. ${P.n} → ${COLS[c]} sütunu, ${r + 1}. satır = ${right}. Haritada istasyonlar adıyla yazılır; adı arayın.`,
      map: { type: "grid", p: P, c, r, fx: 0.25 + Math.random() * 0.5, fy: 0.25 + Math.random() * 0.5 }
    };
  }

  function genStreet() {
    const S = rnd(GEO.streets.filter(s => s.nb.length >= 3));
    return {
      kind: "street",
      q: "What is the name of the road at the red marker?",
      tr: "Kırmızı işaretin olduğu yolun adı ne?",
      o: opts(S.n, S.nb),
      e: `Haritada yol adları yolun üzerine yazılır. Gerekirse haritayı iki parmakla büyütün. Doğru cevap: ${S.n}.`,
      map: { type: "point", s: S }
    };
  }

  function genRoad() {
    const withRef = GEO.streets.filter(s => s.ref);
    const S = rnd(withRef);
    const nearRefs = withRef.filter(o => o !== S && meters(o.pt, S.pt) < 3000).map(o => o.ref);
    let pool = [...new Set(nearRefs)].filter(x => x !== S.ref);
    if (pool.length < 3) pool = [...new Set(withRef.map(o => o.ref))];
    return {
      kind: "road",
      q: `The road shown in purple is ${S.n}. What is its road number?`,
      tr: `Mor gösterilen yol ${S.n}. Yol numarası nedir?`,
      o: opts(S.ref, pool),
      e: `Yol numarası haritada yolun üzerinde küçük kutu içinde yazar. ${S.n} = ${S.ref}. "A" ile başlayanlar ana yol, "B" ile başlayanlar daha küçük yollardır.`,
      map: { type: "line", s: S }
    };
  }

  function seenPick(key, list, n, id) {
    let seen = [];
    try { seen = JSON.parse(localStorage.getItem(key) || "[]"); } catch (_) {}
    let fresh = list.filter(x => !seen.includes(id(x)));
    if (fresh.length < n) { seen = []; fresh = list.slice(); }
    const out = shuffle(fresh).slice(0, n);
    try { localStorage.setItem(key, JSON.stringify(seen.concat(out.map(id)))); } catch (_) {}
    return out;
  }
  function genSigns(n) {
    return seenPick("topo-seen-sign", SIGNS, n, x => x.a).map(s => ({
      kind: "sign", q: "What does this sign mean?", tr: "Bu işaret ne anlama gelir?",
      o: opts(s.a, SIGNS.map(x => x.a)), e: s.e, svg: s.svg, trOpt: s.tr
    }));
  }
  function genTF(n) {
    return seenPick("topo-seen-tf", TF, n, x => x.q).map(t => ({
      kind: "tf", q: t.q, tr: t.tr, o: t.a ? ["True", "False"] : ["False", "True"], e: t.e, fixed: true
    }));
  }

  function build(mode) {
    const m = MIX[mode], out = [];
    const many = (f, n) => { for (let i = 0; i < n; i++) { const x = f(); if (x) out.push(x); } };
    if (HAS_MAP && GEO.places.length) {
      many(genCompass, m.compass); many(genGrid, m.grid); many(genStreet, m.street); many(genRoad, m.road);
    } else {
      // Harita kutuphanesi yuklenemediyse (internet yok) yalnizca haritasiz sorular
      m.sign += 3; m.tf += 4;
    }
    out.push(...genSigns(m.sign), ...genTF(m.tf));
    return shuffle(out);
  }

  // --- Harita ---
  let map = null, layer = null;
  function ensureMap() {
    if (map || !HAS_MAP) return;
    map = L.map("topo-map", { zoomControl: false, attributionControl: true, zoomSnap: 0.25 });
    L.control.zoom({ position: "bottomright" }).addTo(map);  // sol ust kosede kare etiketleri var
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);
    layer = L.layerGroup().addTo(map);
  }
  const pin = (color, label) => L.divIcon({
    className: "", iconSize: [26, 26], iconAnchor: [13, 13],
    html: `<div class="pin" style="background:${color}">${label || ""}</div>`
  });
  let homeView = null;
  function drawMap(x) {
    const box = $("topo-mapbox");
    box.hidden = !x.map; $("topo-reset").hidden = !x.map;
    if (!x.map || !HAS_MAP) return;
    ensureMap();
    map.invalidateSize();
    layer.clearLayers();
    const M = x.map;
    if (M.type === "pair") {
      L.marker(M.a.p, { icon: pin("#1fb36b", "A") }).bindTooltip(M.a.n, { permanent: true, direction: "top", offset: [0, -12] }).addTo(layer);
      L.marker(M.b.p, { icon: pin("#e5484d", "B") }).bindTooltip(M.b.n, { permanent: true, direction: "top", offset: [0, -12] }).addTo(layer);
      map.fitBounds([M.a.p, M.b.p], { padding: [50, 50] });
    } else if (M.type === "point") {
      L.marker(M.s.pt, { icon: pin("#e5484d") }).addTo(layer);
      map.setView(M.s.pt, 17);
    } else if (M.type === "line") {
      M.s.g.forEach(g => L.polyline(g, { color: "#8b3dff", weight: 7, opacity: 0.4, interactive: false }).addTo(layer));
      map.fitBounds(L.latLngBounds([].concat(...M.s.g)), { padding: [20, 20] });
      if (map.getZoom() < 14) map.setView(M.s.pt, 14);
      // Harita karolari yol numarasini her yolda yazmiyor: gorunen tum numarali yollara kendi etiketimizi koyariz,
      // aday mor yolun uzerindekini okur (gercek sinavdaki gibi haritadan okuma)
      const vb = map.getBounds();
      GEO.streets.filter(o => o.ref && vb.contains(o.pt)).forEach(o => L.marker(o.pt, {
        interactive: false, icon: L.divIcon({ className: "", iconSize: null, html: `<div class="shield">${o.ref}</div>` })
      }).addTo(layer));
    } else if (M.type === "grid") {
      // Istasyonu secilen karenin icine dusurecek sekilde merkezi kaydir, sonra 4x4 kareyi cografi cizgi olarak ciz
      const z = 15, size = map.getSize();
      const target = L.point(size.x * (M.c + M.fx) / N, size.y * (M.r + M.fy) / N);
      const p = map.project(M.p.p, z);
      const center = map.unproject(p.subtract(target).add(size.divideBy(2)), z);
      map.setView(center, z, { animate: false });
      const nw = map.containerPointToLatLng([0, 0]), se = map.containerPointToLatLng([size.x, size.y]);
      const lat = i => nw.lat + (se.lat - nw.lat) * i / N, lng = i => nw.lng + (se.lng - nw.lng) * i / N;
      const st = { color: "#d0021b", weight: 2, opacity: 0.8, interactive: false };
      for (let i = 0; i <= N; i++) {
        L.polyline([[lat(i), nw.lng], [lat(i), se.lng]], st).addTo(layer);
        L.polyline([[nw.lat, lng(i)], [se.lat, lng(i)]], st).addTo(layer);
      }
      for (let i = 0; i < N; i++) {
        const lab = t => L.divIcon({ className: "", iconSize: [22, 22], iconAnchor: [11, 11], html: `<div class="gridlab">${t}</div>` });
        L.marker([nw.lat + (se.lat - nw.lat) * 0.04, lng(i + 0.5)], { icon: lab(COLS[i]), interactive: false }).addTo(layer);
        L.marker([lat(i + 0.5), nw.lng + (se.lng - nw.lng) * 0.03], { icon: lab(i + 1), interactive: false }).addTo(layer);
      }
    }
    homeView = { c: map.getCenter(), z: map.getZoom() };
  }

  // --- Akis ---
  let mode = "practice", qs = [], idx = 0, picks = [];
  function start(m) {
    mode = m;
    qs = build(m).map(x => ({ ...x, opts: x.fixed ? x.o : shuffle(x.o) }));
    idx = 0; picks = [];
    show("s-topo-q");
    render();
  }

  function render() {
    const x = qs[idx];
    $("topo-progress").textContent = `Soru ${idx + 1} / ${qs.length}`;
    $("topo-type").textContent = KIND[x.kind];
    $("topo-qtext").textContent = x.q;
    $("topo-tr").textContent = x.tr; $("topo-tr").hidden = true;
    $("topo-trbtn").textContent = "🇹🇷 Türkçesini göster";
    const sg = $("topo-sign"); sg.hidden = !x.svg; sg.innerHTML = x.svg || "";
    $("topo-feedback").hidden = true;
    $("topo-next").disabled = true;
    $("topo-next").textContent = idx + 1 < qs.length ? "Sonraki →" : "Sonucu gör";
    const box = $("topo-opts"); box.innerHTML = "";
    x.opts.forEach(o => {
      const b = document.createElement("button");
      b.className = "opt"; b.textContent = o; b.dataset.v = o;
      b.onclick = () => choose(o, b);
      box.append(b);
    });
    drawMap(x);
  }

  function choose(o, btn) {
    const x = qs[idx];
    const buttons = [...$("topo-opts").children];
    if (mode === "long") {
      buttons.forEach(b => b.classList.toggle("sel", b === btn));
      picks[idx] = o; $("topo-next").disabled = false; return;
    }
    if (picks[idx] !== undefined) return;
    picks[idx] = o;
    const right = o === x.o[0];
    buttons.forEach(b => {
      b.disabled = true;
      if (b.dataset.v === x.o[0]) b.classList.add("right");
      else if (b === btn) b.classList.add("wrong");
    });
    const f = $("topo-feedback");
    f.className = "card feedback " + (right ? "ok" : "no");
    f.innerHTML = "";
    const h = document.createElement("b"); h.textContent = right ? "✓ Doğru" : "✗ Yanlış – doğru cevap: " + x.o[0];
    const e = document.createElement("p"); e.textContent = (x.trOpt ? `(${x.trOpt}) ` : "") + x.e;
    f.append(h, e); f.hidden = false;
    $("topo-next").disabled = false;
  }

  function next() {
    if (idx + 1 < qs.length) { idx++; render(); window.scrollTo(0, 0); }
    else finish();
  }

  function finish() {
    const correct = qs.filter((x, i) => picks[i] === x.o[0]).length;
    const pct = Math.round(correct / qs.length * 100);
    $("topo-score").textContent = `${correct} / ${qs.length} doğru (%${pct})`;
    const v = $("topo-verdict");
    v.textContent = pct >= 60 ? "Güzel gidiyorsunuz 👍" : "Yanlışlarınızı okuyun, sonra tekrar deneyin.";
    // Konu bazinda: hangi tur soruda zorlaniyor
    const by = {};
    qs.forEach((x, i) => { const b = by[x.kind] = by[x.kind] || [0, 0]; b[1]++; if (picks[i] === x.o[0]) b[0]++; });
    $("topo-meta").textContent = Object.entries(by).map(([k, [a, n]]) => `${KIND[k].split(" –")[0]}: ${a}/${n}`).join(" · ");
    const box = $("topo-wrong"); box.innerHTML = "";
    const wrong = qs.map((x, i) => ({ x, p: picks[i] })).filter(w => w.p !== w.x.o[0]);
    $("topo-wrong-title").hidden = !wrong.length; box.hidden = !wrong.length;
    wrong.forEach(({ x, p }) => {
      const d = document.createElement("div"); d.className = "ans";
      const q = document.createElement("div"); q.className = "q"; q.textContent = x.q;
      if (x.svg) { const s = document.createElement("div"); s.className = "signsm"; s.innerHTML = x.svg; d.append(s); }
      const a = document.createElement("div"); a.className = "tip"; a.textContent = "Sizin cevabınız: " + (p === undefined ? "(boş)" : p);
      const c = document.createElement("div"); c.className = "ok"; c.textContent = "Doğru cevap: " + x.o[0];
      const e = document.createElement("div"); e.className = "sample"; e.textContent = (x.trOpt ? `(${x.trOpt}) ` : "") + x.e;
      d.append(q, a, c, e); box.append(d);
    });
    show("s-topo-result", "replace");
  }

  $("topo-practice").onclick = () => start("practice");
  $("topo-long").onclick = () => start("long");
  $("topo-next").onclick = next;
  $("topo-quit").onclick = finish;
  $("topo-again").onclick = () => start(mode);
  $("topo-reset").onclick = () => { if (map && homeView) map.setView(homeView.c, homeView.z); };
  $("topo-trbtn").onclick = () => {
    const t = $("topo-tr"); t.hidden = !t.hidden;
    $("topo-trbtn").textContent = t.hidden ? "🇹🇷 Türkçesini göster" : "🇹🇷 Türkçesini gizle";
  };
  window.__topo = { start, finish, build, state: () => ({ mode, qs, idx, picks }), map: () => map };  // test icin
})();
