// (c) 2026 Sinav Provasi / Private Hire Test London. Tum haklari saklidir - All rights reserved.
// Sorular, aciklamalar ve kod ozgundur; izinsiz kopyalanamaz, yeniden yayinlanamaz.
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
  // Iki dokunus arasi: en fazla 1000 m YA DA en fazla 6 yol parcasi (The Mall gibi uzun, az kavsakli yollar serbest;
  // yalnizca basa ve sona dokunup rotayi sisteme cizdirmek engellenir). 600 m iken (operator, 16 Eki: 'cizerken bazen
  // takiliyor, cizmiyor') kus ucusu 300-400 m arayla dokunuslarin %39'u, 400-500 m'de %75'i sessizce reddediliyordu.
  const MAX_HOP = 1000, MAX_HOP_EDGES = 6, HOP_SEARCH = 3000;
  // Isaret bir kavsak degil bir YER: yerin cevresindeki her kavsak baslangic/varis sayilir.
  // (Tek kavsaga oturtunca Piccadilly Circus gibi tek yonlu meydanlarda 'en iyi rota' meydani dolasiyordu.)
  const R_START = 80, R_END = 100;
  // Isaretten uzakta baslamak/bitmek, o mesafeyi SURMEKTEN 6 kat pahali: rota yerin onunde biter. (1 kat iken son
  // 90 m'yi surmekle 90 m uzakta durmak esit sayiliyordu ve rotalar hedefin ~90 m onunde bitiyordu.)
  const GAP_W = 6;
  // En yakin yolu bundan uzak olan yer (bina/park ortasi) rota sorusunda kullanilmaz: rota nerede bitecek belirsiz
  const MAX_ROAD_GAP = 130;
  let G = null, map = null, layers = null, signLayer = null, signIcon = null, vis = () => {}, showSigns = false;

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
    addDoors();
  }
  // Yol aginda yalnizca KAVSAKLAR var. Covent Garden istasyonu gibi iki kavsagin ortasindaki bir yer icin rota en yakin
  // kavsakta (~100 m otede) bitiyordu. Her yerin onundeki yola, kapinin tam karsisina bir "durak noktasi" eklenir:
  // yol orada ikiye bolunur (tek yon, ad, donus yasaklari korunur). Iki yonlu ayri seritli yollarda iki serit de bolunur.
  function addDoors() {
    const P = (window.TOPO_GEO && window.TOPO_GEO.places) || [];
    const lat = G.nodes.map(n => n[0]), lng = G.nodes.map(n => n[1]);
    const inBox = p => p[0] > Math.min(...lat) && p[0] < Math.max(...lat) && p[1] > Math.min(...lng) && p[1] < Math.max(...lng);
    P.filter(pl => inBox(pl.p)).forEach(pl => {
      const kx = 111320 * Math.cos(pl.p[0] * Math.PI / 180), ky = 110540;
      const xy = q => [(q[1] - pl.p[1]) * kx, (q[0] - pl.p[0]) * ky];
      const cands = [];
      G.edges.forEach((E, e) => {
        let best = null;
        for (let k = 0; k + 1 < E.pts.length; k++) {
          const [x1, y1] = xy(E.pts[k]), [x2, y2] = xy(E.pts[k + 1]), dx = x2 - x1, dy = y2 - y1, L2 = dx * dx + dy * dy;
          const t = L2 ? Math.max(0, Math.min(1, -(x1 * dx + y1 * dy) / L2)) : 0;
          const d = Math.hypot(x1 + t * dx, y1 + t * dy);
          if (!best || d < best.d) best = { e, k, t, d };
        }
        if (best) cands.push(best);
      });
      cands.sort((x, y) => x.d - y.d);
      if (!cands.length || cands[0].d > MAX_ROAD_GAP) return;
      cands.filter(c => c.d <= cands[0].d + 15).slice(0, 2).forEach(c => split(c));
    });
  }
  function split({ e, k, t }) {
    const E = G.edges[e];
    const A = E.pts[k], B = E.pts[k + 1], P = [A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t];
    const p1 = E.pts.slice(0, k + 1).concat([P]), p2 = [P].concat(E.pts.slice(k + 1));
    const plen = pts => pts.slice(1).reduce((s, q, i) => s + meters(pts[i], q), 0);
    const l1 = plen(p1), l2 = plen(p2);
    if (l1 < 12 || l2 < 12) return;  // kavsaga cok yakin: kavsagin kendisi yeterli
    const v = G.nodes.length, e2 = G.edges.length, b = E.b;
    G.nodes.push(P); G.adj.push([e, e2]);
    G.edges.push({ a: v, b, ow: E.ow, minor: E.minor, name: E.name, len: E.len * l2 / (l1 + l2), pts: p2 });
    Object.assign(E, { b: v, len: E.len * l1 / (l1 + l2), pts: p1 });
    G.adj[b] = G.adj[b].map(x => (x === e ? e2 : x));
    // b kavsagindaki donus yasaklari artik yeni parcaya ait
    [...G.banned].forEach(key => {
      const [x, y] = key.split(",").map(Number);
      if (x === e && G.adj[b].includes(y) && y !== e2) { G.banned.delete(key); G.banned.add(e2 + "," + y); }
      if (y === e && G.adj[b].includes(x) && x !== e2) { G.banned.delete(key); G.banned.add(x + "," + e2); }
    });
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

  // --- U donusu ---
  // Ayri seritli yollarda (Kingsway, Euston Road, Cockspur Street) OSM iki yonu ayri tek yonlu yol olarak tutar; aradaki
  // 10-30 m'lik gecitten karsi seride gecmek motor icin iki normal donustu -> en iyi rotalarin ~%10'u gercekte
  // yapilamayan U donusu iceriyordu (operator, 15 Eki: Kingsway). Simdi: yon 150 dereceden fazla tersine donerse U sayilir;
  // tek kavsakta ya da toplam <=40 m kisa parcalar (<=30 m) zinciri uzerinden. Cikmaz sokakta donmek serbest.
  const U_DEG = 150, SHORT = 30, CHAIN = 40;
  const brgCache = new Map();
  function edgeBrg(e, n, arriving) {  // e kenarinin n kavsagindaki yonu: varirken (arriving) ya da cikarken
    const k = e + (arriving ? "<" : ">") + n;
    if (!brgCache.has(k)) {
      const E = G.edges[e], p = E.a === n ? E.pts : E.pts.slice().reverse();  // p[0] = n
      brgCache.set(k, arriving ? brgOf(p[1], p[0]) : brgOf(p[0], p[1]));
    }
    return brgCache.get(k);
  }
  const isU = (b1, b2) => Math.abs((b2 - b1 + 540) % 360 - 180) > U_DEG;
  // ein ile n'ye gelindi; ref = son CHAIN metre icinde gidilen yonler [{b, d, id}] (yoksa null). e'ye cikmak U mu?
  // (Tek bir "zincir basi" yetmiyordu: Cockspur Street 8+8+12 m parcalardan sonra 29 m gecit -> zincir sifirlaniyordu.)
  const uAt = (ein, n, e, ref) => {
    if (G.adj[n].length < 2 || ein < 0) return false;
    const out = edgeBrg(e, n, false);
    return isU(edgeBrg(ein, n, true), out) || (ref !== null && ref.some(r => isU(r.b, out)));
  };
  // e ile n'den gecildikten sonra: e kisaysa (<=SHORT) gelinen yon ve son CHAIN metredeki yonler hatirlanir
  function nextRef(ein, n, e, ref) {
    const L = G.edges[e].len;
    if (L > SHORT || ein < 0) return null;
    const keep = (ref || []).map(r => ({ b: r.b, d: r.d + L, id: r.id })).filter(r => r.d <= CHAIN);
    keep.push({ b: edgeBrg(ein, n, true), d: L, id: ein });
    return keep;
  }
  const refKey = ref => (ref ? ref.map(r => r.id).join(".") : "");
  // Bir adim dizisindeki U donusleri (puanlama): U'nun yapildigi adimlarin indeksleri
  function uTurnsIn(steps) {
    const out = []; let ref = null;
    for (let i = 1; i < steps.length; i++) {
      const n = steps[i].from, ein = steps[i - 1].e;
      if (uAt(ein, n, steps[i].e, ref)) { out.push(i); ref = null; continue; }
      ref = nextRef(ein, n, steps[i].e, ref);
    }
    return out;
  }

  // En direkt YASAL rota: kenar tabanli Dijkstra (donus yasaklari icin gelinen kenar da durumun parcasi)
  // sources/targets: Map(kavsak -> isarete kus ucusu uzaklik). Bu "yurume payi" maliyete eklenir: rota isaretin
  // DIBINDE baslar/biter, 100 m'lik bolgenin kenarinda degil. (Eskiden varis bolgesine ilk girilen kavsakta bitiyordu.)
  // Durum = (gelinen kenar, kavsak, kisa parca zincirinin basladigi kenar): U donusu zincir uzerinden de yakalanir.
  function bestRoute(sources, targets, closed) {
    const dist = new Map(), prev = new Map(), H = Heap();
    const key = (e, n, ref) => e + ">" + n + ">" + refKey(ref);
    sources.forEach((g, s) => { dist.set(key(-1, s, null), g); H.push(g, [-1, s, null]); });
    while (H.size) {
      const [c, [ein, n, ref, fin]] = H.pop();
      const k = key(ein, n, ref);
      if (fin) {
        const path = []; let cur = k;
        while (prev.has(cur)) { const p = prev.get(cur); path.push(p.step); cur = p.from; }
        const steps = path.reverse();
        return { steps, cost: stepCost(steps), total: c };
      }
      if (c > dist.get(k)) continue;
      if (targets.has(n)) H.push(c + targets.get(n), [ein, n, ref, true]);
      for (const e of G.adj[n]) {
        if (closed && closed.has(e)) continue;
        if (!legal(e, n)) continue;
        if (ein >= 0 && G.banned.has(ein + "," + e)) continue;
        // En iyi rota hic geri donmez - cikmaz sokakta da (kapali yol sorusunda Thornhaugh Street'e girip donuyordu)
        if (e === ein) continue;
        if (uAt(ein, n, e, ref)) continue;
        const m = other(e, n), E = G.edges[e], r2 = nextRef(ein, n, e, ref);
        const nc = c + E.len * (E.minor ? MINOR_COST : 1), nk = key(e, m, r2);
        if (nc < (dist.has(nk) ? dist.get(nk) : Infinity)) { dist.set(nk, nc); prev.set(nk, { from: k, step: { e, from: n } }); H.push(nc, [e, m, r2]); }
      }
    }
    return null;
  }
  // Iki dokunus arasi yol: adayin dokundugu yerleri birlestirir. Kural disi parcalar YASAK DEGIL, ama pahali:
  // makul uzunlukta yasal bir yol varsa o cizilir (adayin kastetmedigi ihlal cezalanmasin); kural disi yol ancak
  // yasal yol cok daha uzunsa (aday belli ki oradan gitmek istiyor) cizilir ve puanlamada yakalanir.
  // (Ters yon 1.5x+15 iken Euston Road'da 71 m'lik dogru tur yerine 26 m ters yon seciliyordu: dogru rotayi
  // izleyen aday ceza aliyordu.)
  // before: onceki adimlar. Yeni parca kavsaga NEREDEN gelindigini bilerek baslar: eskiden her parca sifirdan
  // basliyordu ve dokunulan kavsakta iki parca arasindaki gecis yasak donus/U olabiliyordu (Kingsway, Portman Square).
  function hop(s, t, closed, before) {
    const dist = new Map(), prev = new Map(), H = Heap();
    const key = (e, n, ref) => e + ">" + n + ">" + refKey(ref);
    let ein0 = -1, ref0 = null;
    if (before && before.length) {
      for (let i = 1; i < before.length; i++) ref0 = uAt(before[i - 1].e, before[i].from, before[i].e, ref0) ? null : nextRef(before[i - 1].e, before[i].from, before[i].e, ref0);
      ein0 = before[before.length - 1].e;
    }
    dist.set(key(ein0, s, ref0), 0); H.push(0, [ein0, s, 0, ref0]);
    while (H.size) {
      const [c, [ein, n, len, ref]] = H.pop();
      const k = key(ein, n, ref);
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
        if (!legal(e, n) || (closed && closed.has(e))) w = w * 2.5 + 60;
        if (ein >= 0 && G.banned.has(ein + "," + e)) w += 120;
        if (uAt(ein, n, e, ref)) w += 400;  // U gercekte yok: en iyi rota U yerine uzun tur atar, aradaki dokunuslar o turu kisaltip U uydurmasin (60 iken Euston Road'da uyduruyordu)
        const r2 = nextRef(ein, n, e, ref);
        const nc = c + w, nk = key(e, m, r2);
        if (nc < (dist.has(nk) ? dist.get(nk) : Infinity)) { dist.set(nk, nc); prev.set(nk, { from: k, step: { e, from: n } }); H.push(nc, [e, m, len + E.len, r2]); }
      }
    }
    return null;
  }
  const stepLen = steps => steps.reduce((a, s) => a + G.edges[s.e].len, 0);
  const stepCost = steps => steps.reduce((a, s) => a + G.edges[s.e].len * (G.edges[s.e].minor ? MINOR_COST : 1), 0);
  const lastNode = st => { const s = st[st.length - 1], E = G.edges[s.e]; return E.a === s.from ? E.b : E.a; };
  const stepPts = s => { const E = G.edges[s.e]; return E.a === s.from ? E.pts : E.pts.slice().reverse(); };
  // Iki adim arasindaki donus: gelis yonu (brg, kuzeyden derece) ve ne tur donus oldugu (yasak isareti icin)
  const brgOf = (p, q) => (Math.atan2((q[1] - p[1]) * Math.cos(p[0] * Math.PI / 180), q[0] - p[0]) * 180 / Math.PI + 360) % 360;
  function turnOf(s1, s2) {
    const a = stepPts(s1), b = stepPts(s2);
    const bin = brgOf(a[a.length - 2], a[a.length - 1]), bout = brgOf(b[0], b[1]);
    const d = (bout - bin + 540) % 360 - 180;  // + saga, - sola
    const kind = Math.abs(d) > 150 ? "no_u_turn" : Math.abs(d) < 30 ? "no_straight_on" : d > 0 ? "no_right_turn" : "no_left_turn";
    return { kind, brg: bin };
  }

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
      if (bd > MAX_ROAD_GAP) return null;
      // Bina/meydan ortasi yoldan uzaksa (British Museum, Waterloo, Westminster Abbey) isaret binanin onundeki yola,
      // "kapiya" konur: rota isarette biter, isaret binanin ortasinda kalip rota "erken bitmis" gorunmez
      if (bd > 40) {
        const door = G.nodes[best], w = r => G.nodes.map((n, i) => i).filter(i => meters(G.nodes[i], door) <= r);
        const gap = ids => new Map(ids.map(i => [i, GAP_W * meters(G.nodes[i], door)]));
        return { n: p.n, k: p.k, p: door, bd: 0, rs: R_START, re: R_END, starts: gap(w(R_START)), ends: gap(w(R_END)) };
      }
      const gap = ids => new Map(ids.map(i => [i, GAP_W * meters(G.nodes[i], p.p)]));
      return { n: p.n, k: p.k, p: p.p, bd, rs, re, starts: gap(within(rs)), ends: gap(within(re)) };
    }).filter(Boolean);
  }
  const rnd = a => a[Math.floor(Math.random() * a.length)];
  // Bu yollardan gecen / bu yollarda baslayip biten sorular uretilmez (operator, 16 Eki: Kingsway sorularini cikar)
  const AVOID = new Set(["Kingsway"]);
  const avoided = steps => steps.some(s => AVOID.has(G.edges[s.e].name));
  const onAvoided = nodes => [...nodes].some(n => G.adj[n].some(e => AVOID.has(G.edges[e].name)));
  function makeQuestion(kind) {
    const P = places();
    const [lo, hi] = kind === "long" ? [2500, 4200] : [900, 1700];
    for (let t = 0; t < 300; t++) {
      const A = rnd(P), B = rnd(P);
      if (A === B || meters(A.p, B.p) < 500) continue;
      // "Marble Arch" / "Marble Arch station", "Covent Garden Market" / "Covent Garden station" gibi ayni yer; ilk kelimeye
      // bakmak "Royal Opera House" / "Royal Albert Hall" gibi farkli yerleri de eliyordu
      const base = n => n.replace(/ station$/, "");
      if (A.n.startsWith(base(B.n)) || B.n.startsWith(base(A.n))) continue;
      const r = bestRoute(A.starts, B.ends);
      if (!r || avoided(r.steps)) continue;
      if (onAvoided(A.starts.keys()) || onAvoided(B.ends.keys())) continue;
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
        if ([...A.starts.keys()].some(touches) || [...B.ends.keys()].some(touches)) continue;
        const r2 = bestRoute(A.starts, B.ends, closed);
        if (!r2 || avoided(r2.steps) || stepLen(r2.steps) > L * 2) continue;
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
      out.pts = 0; out.items.push(["no", T("Rota çizilmedi.", "No route was drawn."), -MAX]); return out;
    }
    const first = taps[0], last = taps[taps.length - 1];
    const atA = n => near(n, q.A, q.A.rs), atB = n => near(n, q.B, q.B.re);
    const reversed = atB(first) && atA(last);
    const ded = (ok, good, bad, d) => { out.items.push(ok ? ["ok", good, 0] : ["no", bad, -d]); if (!ok) out.pts -= d; };
    if (reversed) ded(false, "", T("Rota TERS çizilmiş (kırmızıdan yeşile). TfL bunu puan kaybettiren hata sayar.", "The route was drawn BACKWARDS (red to green). TfL counts this as an error that loses points."), 11);
    else {
      ded(atA(first), T("Başlangıç doğru (yeşil işaret).", "Correct start (green marker)."), T("Rota yeşil işaretten başlamıyor.", "The route does not start at the green marker."), 4);
      ded(atB(last), T("Bitiş doğru (kırmızı işaret).", "Correct finish (red marker)."), T("Rota kırmızı işarette bitmiyor.", "The route does not finish at the red marker."), 4);
      // Bolgenin icinde ama hedefin kapisina gelmeden durmak: en direkt rotanin bittigi yere gore olculur
      // (bazi yerler yoldan uzak; ornegin Waterloo istasyonunun ortasina 120 m'den yakin yol yok)
      const short = Math.round(meters(G.nodes[last], q.B.p) - meters(G.nodes[lastNode(q.best.steps)], q.B.p));
      if (atB(last) && short > 50) ded(false, "", T(`Rota hedefe varmadan bitiyor: kırmızı işaretin önüne gelmeden ${short} m erken durdunuz.`, `The route stops short of the destination: you stopped ${short} m before reaching the red marker.`), 2);
    }
    out.bannedTurns = [];  // {n kavsak, kind "no_right_turn" vb., brg yaklasma yonu, from/to yol adi}
    steps.forEach((s, i) => {
      if (!legal(s.e, s.from)) out.wrongWay.push(s.e);
      if (i && steps[i - 1].e !== s.e && G.banned.has(steps[i - 1].e + "," + s.e)) {
        out.bannedAt.push(s.from);
        out.bannedTurns.push(Object.assign({ n: s.from, from: G.edges[steps[i - 1].e].name, to: G.edges[s.e].name }, turnOf(steps[i - 1], s)));
      }
      if (q.closed && q.closed.has(s.e)) out.closedUsed.push(s.e);
    });
    const ww = [...new Set(out.wrongWay.map(e => G.edges[e].name || "isimsiz yol"))];
    ded(!ww.length, T("Tek yönlü yollara uyuldu.", "One-way streets were followed."), T(`Tek yönlü yolda TERS yöne gidildi: ${ww.join(", ")}.`, `Wrong way down a one-way street: ${ww.join(", ")}.`), Math.min(12, 4 * ww.length));
    const TURN_TR = T({ no_left_turn: "sola", no_right_turn: "sağa", no_u_turn: "U", no_straight_on: "düz" }, { no_left_turn: "no left turn", no_right_turn: "no right turn", no_u_turn: "no U-turn", no_straight_on: "no straight on" });
    const turnTxt = t => `${t.from || T("isimsiz yol", "unnamed road")} → ${t.to || T("isimsiz yol", "unnamed road")} (${T(TURN_TR[t.kind] + " dönüş yasak", TURN_TR[t.kind])})`;
    out.uTurns = uTurnsIn(steps).map(i => ({ n: steps[i].from, name: G.edges[steps[i - 1].e].name || "isimsiz yol" }));
    ded(!out.uTurns.length, T("U dönüşü yok.", "No U-turns."), T(`U dönüşü yapıldı: ${[...new Set(out.uTurns.map(u => u.name))].join(", ")}. Sınavda U dönüşü ile rota çizilmez.`, `U-turn made: ${[...new Set(out.uTurns.map(u => u.name))].join(", ")}. Routes in the test must not use U-turns.`), Math.min(8, 4 * out.uTurns.length));
    // Donus yasagi PUAN KIRMAZ, uyarir (operator, 15 Eki): haritada gorunmuyor, veride hata olabilir ve kurallar sik
    // degisiyor; yanlis veriyle haksiz puan kirmak, hic uyarmamaktan kotu. Model rota yine de yasaklardan kacinir.
    if (out.bannedAt.length) out.items.push(["warn", T(`Dikkat – bu kavşakta dönüş yasağı olabilir: ${out.bannedTurns.map(turnTxt).join("; ")}. Haritada işaretle gösterildi. Puan kırılmadı; gerçek yolda tabelaya bakın.`, `Careful – there may be a banned turn at this junction: ${out.bannedTurns.map(turnTxt).join("; ")}. It is marked on the map. No points were taken off; on the real road, check the signs.`), 0]);
    if (q.closed) ded(!out.closedUsed.length, T(`Kapalı yol (${q.closedName}) kullanılmadı.`, `The closed road (${q.closedName}) was not used.`), T(`KAPALI yol kullanıldı: ${q.closedName}.`, `The CLOSED road was used: ${q.closedName}.`), 8);
    const um = Math.round(stepLen(steps)), bm = Math.round(stepLen(q.best.steps));
    if (reversed || !atA(first) || !atB(last)) {
      // Yeşilden kırmızıya tamamlanmamış rota: kısalığı "direkt" sayılamaz
      ded(false, "", T(`Rota yeşilden kırmızıya tamamlanmadığı için en direkt rota olarak değerlendirilemedi (en direkt yasal rota ${bm} m).`, `The route is not complete from green to red, so it could not be scored as the most direct route (most direct legal route: ${bm} m).`), 10);
    } else {
      // Puanlamada isarete uzaklik GERCEK metreyle sayilir (GAP_W yalnizca en iyi rotayi kapiya goturmek icin);
      // erken durmanin cezasi yukaridaki -2
      const gapM = (n, P) => meters(G.nodes[n], P.p);
      // Isaretten uzakta baslayip/bitmek de "yol" sayilir: 90 m erken biten rota 90 m eksik degil, o kadar eksik
      const ratio = (stepCost(steps) + gapM(first, q.A) + gapM(last, q.B)) / (q.best.cost + gapM(q.best.steps[0].from, q.A) + gapM(lastNode(q.best.steps), q.B));
      // %12'ye kadar uzun rota tam puan: ana yolu kullanan makul alternatif cezalanmasin
      const d = ratio <= 1.12 ? 0 : Math.min(10, Math.ceil((ratio - 1.12) / 0.04));
      ded(d === 0, T(`Rota direkt: ${um} m (en kısa yasal rota ${bm} m).`, `Direct route: ${um} m (shortest legal route ${bm} m).`), T(`Rota en direkt değil: ${um} m, en direkt yasal rota ${bm} m (%${Math.round((ratio - 1) * 100)} daha uzun).`, `Not the most direct route: ${um} m, most direct legal route ${bm} m (${Math.round((ratio - 1) * 100)}% longer).`), d);
    }
    out.pts = Math.max(0, out.pts);
    return out;
  }

  // --- Ekran ---
  let qs = [], qi = 0, taps = [], steps = [], hops = [], results = [], mode = "single", done = false;
  const KIND_TR = T({ short: "Kısa rota", closed: "Kısa rota – yol kapalı", long: "Uzun rota" }, { short: "Short route", closed: "Short route – road closed", long: "Long route" });

  function ensureMap() {
    if (map) return;
    // Elle dondurme (operator, 15 Eki: 'bazen yol ters kaliyor'): iki parmakla cevir ya da dugmeler (leaflet-rotate)
    const canRotate = !!(L.Map.TouchRotate);
    map = L.map("route-map", { zoomControl: false, doubleClickZoom: false, zoomSnap: 0.5,
      rotate: canRotate, touchRotate: canRotate, rotateControl: false, shiftKeyRotate: false, bearing: 0 });
    L.control.zoom({ position: "bottomright" }).addTo(map);
    if (canRotate) {
      const RotCtl = L.Control.extend({ options: { position: "topright" }, onAdd() {
        const box = L.DomUtil.create("div", "leaflet-bar rotbar");
        [["⟲", T("Sola çevir", "Rotate left"), -30], ["⬆N", T("Kuzey yukarı", "North up"), 0], ["⟳", T("Sağa çevir", "Rotate right"), 30]].forEach(([t, title, d]) => {
          const a = L.DomUtil.create("a", "", box); a.href = "#"; a.textContent = t; a.title = title; a.setAttribute("role", "button");
          L.DomEvent.on(a, "click", e => { L.DomEvent.stop(e); map.setBearing(d ? map.getBearing() + d : 0); });
        });
        L.DomEvent.disableClickPropagation(box);
        return box;
      } });
      new RotCtl().addTo(map);
      // Isaretler (marker) donmez, dik kalir: icindeki ok haritanin acisi kadar cevrilir
      const setMb = () => map.getContainer().style.setProperty("--mb", map.getBearing() + "deg");
      map.on("rotate", setMb); setMb();
    }
    // Kendi haritamiz (azmap.js): her sokakta ad + tek yon oklari. Veri yuklenemezse OSM karolarina donulur.
    const tiles = () => L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);
    if (window.AZMap) {
      const lat = G.nodes.map(n => n[0]), lng = G.nodes.map(n => n[1]);
      map.setMaxBounds([[Math.min(...lat) - 0.004, Math.min(...lng) - 0.006], [Math.max(...lat) + 0.004, Math.max(...lng) + 0.006]]);
      map.setMinZoom(14); map.setMaxZoom(19);
      window.AZMap.layer().on("dataerror", tiles).addTo(map);
    } else tiles();
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
    // brg: yaklasan aracin gidis yonu -> isaretin "yukari"si o yone doner (ok surucuye gore okunur).
    // Bir yaklasmanin butun yasaklari tek isarette yan yana ("no_left_turn,no_u_turn").
    // "Yalniz duz" mavi oku yol boyunca tek yon gibi okunuyordu (operator, 15 Eki): sola + saga donulmez olarak cizilir.
    const ORDER = ["only_left_turn", "only_right_turn", "no_left_turn", "no_straight_on", "no_right_turn", "no_u_turn"];
    signIcon = (kinds, brg) => {
      const ks = new Set(kinds.split(",").flatMap(k => k === "only_straight_on" ? ["no_left_turn", "no_right_turn"] : [k]));
      const parts = ORDER.filter(k => ks.has(k)).map(signSvg).filter(Boolean);
      if (!parts.length) return null;
      const svg = parts.join(""), w = 20 * parts.length;
      const html = `<div style="display:flex;width:${w}px;transform:rotate(calc(${brg || 0}deg + var(--mb,0deg))) scale(var(--ss,1))">${svg}</div>`;
      return L.divIcon({ className: "rsign", iconSize: [w, 20], iconAnchor: [w / 2, 10], html });
    };
    G.signs.forEach(([la, ln, kinds, brg]) => {
      const icon = signIcon(kinds, brg);
      if (icon) L.marker([la / 1e5, ln / 1e5], { interactive: false, icon }).addTo(signLayer);
    });
    // Varsayilan GIZLI (operator, 15 Eki: 'cok fazla saga sola donulmez isareti var, confusing'): OSM her ayri seritli
    // yol gecisine de yasak kaydi tutuyor, sokakta tabelasi olmayanlar dahil. Yasak dönüş yapilirsa sonucta yalniz o
    // kavsagin isareti cikar; hepsini gormek isteyen dugmeyle acar.
    // Kalabalik kavsaklarda (Oxford Circus: 45 m icinde 8 yaklasma) isaretler uzaktan kucuk, yakinlastirinca buyur
    vis = () => {
      const z = map.getZoom();
      map.getContainer().style.setProperty("--ss", z >= 18 ? 1 : z >= 17 ? 0.8 : 0.65);
      if (showSigns && z >= 16) signLayer.addTo(map); else signLayer.remove();
    };
    map.on("zoomend", vis);
    map.on("click", ev => tap(ev.latlng));
  }
  // Damla bicimli isaret: UCU yerin tam ustunde. Yerin kendisi (istasyon simgesi) altinda gorunur kalir.
  const pin = (color, label) => L.divIcon({ className: "", iconSize: [30, 40], iconAnchor: [15, 40], html: `<div class="dpin" style="--c:${color}"><b>${label}</b></div>` });
  const ROUNDEL = `<svg viewBox="0 0 24 24" width="16" height="16"><circle cx="12" cy="12" r="8.5" fill="none" stroke="#dc241f" stroke-width="4.5"/><rect x="1" y="9.5" width="22" height="5" fill="#0019a8"/></svg>`;
  const placeIcon = P => L.divIcon({ className: "", iconSize: [16, 16], iconAnchor: [8, 8], html: P.k === "station" ? ROUNDEL : `<div class="pdot"></div>` });

  const isExam = () => mode.startsWith("exam");
  let lastExam = "exam";
  function startRoutes(m) {
    mode = m; if (m.startsWith("exam")) lastExam = m;
    if (!window.L) { alert(T("Harita yüklenemedi. İnternet bağlantınızı kontrol edip sayfayı yenileyin.", "The map could not load. Check your internet connection and refresh the page.")); return; }
    $("route-status").textContent = T("Harita yükleniyor…", "Loading map…");
    if (document.querySelector(".screen.on").id !== "s-route") show("s-route");  // "Yeni rota": ayni ekran, gecmise yazma
    loadGraph().then(() => {
      // "exam" = gercek sinav (3 rota); "exam9" = uzun prova, her turden 3 rota
      const kinds = m === "exam" ? ["short", "closed", "long"] : m === "exam9" ? ["short", "closed", "long", "short", "closed", "long", "short", "closed", "long"] : [m];
      qs = [];
      kinds.forEach(k => {  // ayni prova icinde ayni yer cifti tekrar etmesin
        for (let t = 0; t < 8; t++) {
          const q = makeQuestion(k);
          if (q && (t === 7 || !qs.some(x => x.A.n === q.A.n && x.B.n === q.B.n))) { qs.push(q); break; }
        }
      });
      qi = 0; results = [];
      ensureMap(); render();
    }).catch(() => { $("route-status").textContent = T("Harita verisi yüklenemedi. İnternet bağlantınızı kontrol edin.", "Map data could not load. Check your internet connection."); });
  }
  const show = (id, how) => window.showScreen(id, how);  // ortak gecis: telefonun geri tusu calissin

  function render() {
    const q = qs[qi];
    taps = []; steps = []; hops = []; done = false;
    $("route-progress").textContent = isExam() ? `${T("Rota", "Route")} ${qi + 1} / ${qs.length} · ${KIND_TR[q.kind]}` : KIND_TR[q.kind];
    $("route-q").textContent = q.q;
    $("route-tr").textContent = q.tr; $("route-tr").hidden = true;
    $("route-feedback").hidden = true;
    $("route-next").hidden = true;
    ["route-undo", "route-clear", "route-submit"].forEach(id => { $(id).hidden = false; });
    map.stop(); map.invalidateSize();  // onceki rotanin harita animasyonu bitmeden dokunus yanlis kavsaga oturmasin
    map.fitBounds([q.A.p, q.B.p], { padding: [40, 40], animate: false });
    draw();
    $("route-status").classList.remove("refused");
    $("route-status").textContent = T("Yeşil işarete dokunarak başlayın, sonra yol boyunca kavşak kavşak dokunun.", "Start by tapping the green marker, then tap junction by junction along the road.");
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
    if (res) res.uTurns.forEach(u => L.marker(G.nodes[u.n], { interactive: false, zIndexOffset: 1000,
      icon: L.divIcon({ className: "", iconSize: [26, 26], iconAnchor: [13, 13], html: `<div class="uturn">U</div>` }) }).addTo(layers));
    if (res) res.bannedTurns.forEach(t => {
      L.circleMarker(G.nodes[t.n], { radius: 12, color: "#e5484d", weight: 4, fill: false }).addTo(layers);
      const icon = signIcon(t.kind, t.brg);  // yalniz ihlal edilen yasagin isareti, gelis yonune donuk
      if (icon) L.marker(G.nodes[t.n], { interactive: false, icon, zIndexOffset: 1000 }).addTo(layers);
    });
    taps.forEach(n => L.circleMarker(G.nodes[n], { radius: 4, color: "#2563eb", fillColor: "#fff", fillOpacity: 1, weight: 2, interactive: false }).addTo(layers));
    if (res) [[q.A, q.best.steps[0].from], [q.B, lastNode(q.best.steps)]].forEach(([P, n]) =>
      L.polyline([G.nodes[n], P.p], { color: "#1fb36b", weight: 4, opacity: 0.8, dashArray: "4 6", interactive: false }).addTo(layers));
    // Harita karolari istasyon adlarini bu yakinlikta cogu zaman yazmiyor: istasyonlari kendimiz isaretleriz
    ((window.TOPO_GEO && window.TOPO_GEO.places) || []).forEach(P => {
      if (P.k === "station" && P.n !== q.A.n && P.n !== q.B.n) L.marker(P.p, { interactive: false, icon: L.divIcon({ className: "", iconSize: null, html: `<div class="stlab${map.latLngToContainerPoint(P.p).x > map.getSize().x * 0.62 ? " rev" : ""}">${ROUNDEL}${P.n.replace(/ station$/, "")}</div>` }) }).addTo(layers);
    });
    [[q.A, "#1fb36b", "A"], [q.B, "#e5484d", "B"]].forEach(([P, c, t]) => {
      L.marker(P.p, { icon: placeIcon(P), interactive: false }).addTo(layers);
      L.marker(P.p, { icon: pin(c, t), interactive: false }).bindTooltip(P.n, { permanent: true, direction: "top", offset: [0, -40], className: "plab" }).addTo(layers);
    });
    $("route-len").textContent = steps.length ? `${T("Çizilen", "Drawn")}: ${Math.round(stepLen(steps))} m` : "";
  }

  function tap(ll) {
    if (done || !qs.length) return;
    const p = map.latLngToContainerPoint(ll);
    let best = -1, bd = TAP_PX;
    G.nodes.forEach((n, i) => {
      const d = p.distanceTo(map.latLngToContainerPoint(n));
      if (d < bd) { bd = d; best = i; }
    });
    if (best < 0) { refuse(T("Oraya yakın bir kavşak yok – yolun üzerine, kavşağa yakın dokunun (gerekirse büyütün).", "No junction near there – tap on the road, close to a junction (zoom in if needed)."), ll); return; }
    if (taps.length && taps[taps.length - 1] === best) return;
    if (taps.length) {
      const h = onModel(taps[taps.length - 1], best) || hop(taps[taps.length - 1], best, qs[qi].closed, steps);
      if (!h) { refuse(T("Bu nokta önceki noktadan çok uzak – dokunuş alınmadı. Son mavi noktaya daha yakın bir kavşağa dokunun.", "This point is too far from the previous one – tap not accepted. Tap a junction closer to the last blue dot."), G.nodes[best]); return; }
      hops.push(h.steps.length); steps.push(...h.steps);
    }
    taps.push(best);
    $("route-status").classList.remove("refused");
    $("route-status").textContent = taps.length === 1 ? T("Başladınız. Yol boyunca dokunmaya devam edin; bitince “Rotayı bitir”.", "Started. Keep tapping along the road; when done, press “Finish route”.") : T("Devam edin. Yanlış dokunduysanız “Geri al”.", "Keep going. If you tapped the wrong place, press “Undo”.");
    draw();
  }
  // Alinmayan dokunus GORUNSUN: eskiden yalniz kucuk gri yazi degisiyordu, aday "harita takildi" saniyordu
  function refuse(msg, ll) {
    const st = $("route-status"); st.textContent = msg; st.classList.remove("refused"); void st.offsetWidth; st.classList.add("refused");
    const c = L.circleMarker(ll, { radius: 16, color: "#e5484d", weight: 3, fill: false, interactive: false }).addTo(map);
    setTimeout(() => c.remove(), 900);
    if (navigator.vibrate) try { navigator.vibrate(60); } catch (e) {}
  }
  // Aday model rotanin uzerindeki kavsaklara sirayla dokunuyorsa ve simdiye kadar da model rotadaysa, arasi model
  // rotanin kendisidir. (Seyrek dokunusta iki dokunus arasindaki en kisa yol, model rotanin bir sonraki donusu icin
  // sectigi yaklasmayi bilemez: Procter Street yerine Catton Street -> ardindan yasak donus. Dogru rotayi izleyen
  // aday ceza almasin.)
  function onModel(a, b) {
    const ms = qs[qi].best.steps, k = steps.length;
    if (k >= ms.length || steps.some((s, i) => s.e !== ms[i].e) || ms[k].from !== a) return null;
    for (let j = k; j < ms.length; j++) {
      const to = lastNode(ms.slice(j, j + 1));
      if (to === b) {
        const part = ms.slice(k, j + 1), len = stepLen(part);
        if (len > MAX_HOP && part.length > MAX_HOP_EDGES) return null;  // hop ile ayni "cok uzak" kurali
        return { steps: part, len };
      }
    }
    return null;
  }
  function undo() {
    if (done || !taps.length) return;
    taps.pop();
    if (hops.length >= taps.length && hops.length) { const n = hops.pop(); steps.splice(steps.length - n, n); }
    draw();
  }
  function submit() {
    if (done) return;
    if (taps.length < 2) { $("route-status").textContent = T("Önce rotayı çizin: en az iki noktaya dokunun.", "Draw the route first: tap at least two points."); return; }
    done = true;
    const q = qs[qi], res = score(q, taps, steps);
    results.push({ q, res });
    draw(res);
    const f = $("route-feedback"); f.innerHTML = "";
    const h = document.createElement("b"); h.textContent = `Puan: ${res.pts} / ${MAX}`; f.append(h);
    res.items.forEach(([k, t]) => { const p = document.createElement("p"); p.className = k === "ok" ? "ok" : "tip"; p.textContent = (k === "ok" ? "✓ " : k === "warn" ? "⚠ " : "✗ ") + t; f.append(p); });
    const lg = document.createElement("p"); lg.className = "ref";
    lg.textContent = T("Haritada: mavi = sizin rotanız, kırmızı = kurala aykırı kısım, yeşil = en direkt yasal rota. Puan kesintileri tahminidir (TfL dağılımı yayınlamıyor); kriterler TfL rehberinden. Değerlendirici ana yolları kullanan makul bir alternatifi de kabul edebilir.", "On the map: blue = your route, red = the part that breaks a rule, green = the most direct legal route. Point deductions are estimates (TfL does not publish the breakdown); the criteria come from TfL guidance. An assessor may also accept a sensible alternative that uses main roads.");
    f.append(lg); f.hidden = false;
    ["route-undo", "route-clear", "route-submit"].forEach(id => { $(id).hidden = true; });
    $("route-next").hidden = false;
    $("route-next").textContent = qi + 1 < qs.length ? T("Sonraki rota →", "Next route →") : (isExam() ? T("Sonucu gör", "See result") : T("Yeni rota", "New route"));
    $("route-status").textContent = "";
    // Sonuc tum rotayi gostersin
    map.fitBounds(L.latLngBounds([].concat(...steps.map(stepPts), ...q.best.steps.map(stepPts))), { padding: [30, 30], animate: false });
  }
  function next() {
    if (qi + 1 < qs.length) { qi++; render(); window.scrollTo(0, 0); return; }
    if (!isExam()) { startRoutes(mode); return; }
    const tot = results.reduce((a, r) => a + r.res.pts, 0);
    $("route-score").textContent = `${T("Rota puanı", "Route score")}: ${tot} / ${MAX * results.length}`;
    $("route-verdict").textContent = (results.length > 3 ? T(`Ortalama: rota başına ${(tot / results.length).toFixed(1)} / ${MAX}. `, `Average: ${(tot / results.length).toFixed(1)} / ${MAX} per route. `) : "") + T(`Gerçek sınavda 3 rota var ve 100 puanın 66'sı. Geçmek için toplamda 60 gerekir; rotalardan ne kadar çok puan alırsanız çoktan seçmeli kısımda o kadar rahat edersiniz.`, `The real test has 3 routes worth 66 of the 100 points. You need 60 in total to pass; the more points you get on the routes, the easier the multiple-choice part becomes.`);
    const box = $("route-sum"); box.innerHTML = "";
    results.forEach(({ q, res }) => {
      const d = document.createElement("div"); d.className = "ans";
      const a = document.createElement("div"); a.className = "q"; a.textContent = `${KIND_TR[q.kind]}: ${res.pts} / ${MAX}`;
      const b = document.createElement("div"); b.className = "muted"; b.style.fontSize = "15px"; b.textContent = `${q.A.n} → ${q.B.n}` + (q.closedName ? ` (${T("kapalı", "closed")}: ${q.closedName})` : "");
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
  $("route-exam9").onclick = () => startRoutes("exam9");
  $("route-again").onclick = () => startRoutes(lastExam);
  $("route-undo").onclick = undo;
  $("route-signs").onclick = () => {
    showSigns = !showSigns; vis();
    $("route-signs").textContent = showSigns ? T("🚫 Dönüş yasaklarını gizle", "🚫 Hide banned turns") : T("🚫 Dönüş yasaklarını göster", "🚫 Show banned turns");
    if (showSigns && map && map.getZoom() < 16) $("route-status").textContent = T("İşaretleri görmek için haritayı büyütün.", "Zoom in to see the signs.");
  };
  $("route-clear").onclick = () => { if (!done) { taps = []; steps = []; hops = []; draw(); } };
  $("route-submit").onclick = submit;
  $("route-next").onclick = next;
  $("route-trbtn").onclick = () => { const t = $("route-tr"); t.hidden = !t.hidden; };
  window.__route = { start: startRoutes, tap, submit, makeQuestion, score, lastNode, state: () => ({ qs, qi, taps, steps, results, done }), graph: () => G, bestRoute, hop, turnOf, uTurnsIn, uAt, debugPlaces: () => places(), map: () => map };  // test icin
})();
