// (c) 2026 Sinav Provasi / Private Hire Test London. Tum haklari saklidir - All rights reserved.
// Sorular, aciklamalar ve kod ozgundur; izinsiz kopyalanamaz, yeniden yayinlanamaz.
// Kendi sokak haritamiz (OSM verisi, map-data.js): harita karolari yerine canvas'a cizilir.
// Atlas gorunumu fikri (renkli yol siniflari, HER sokakta ad, tek yon oklari) - renkler ve cizim bizim.
// Neden: OSM karolari uzak yakinlikta kucuk sokak adlarini yazmiyordu (operator: 'Parker Street gibi kucuk yollari
// goremiyorum'); gercek sinav haritasi butun adlari gosterir.
(() => {
  // Renkler bilerek ticari atlaslardan farkli (operator, 15 Eki: 'renkleri biraz degistir ki problem cikmasin')
  const C = {
    bg: "#f4f1ea", park: "#cfe6c2", parkText: "#4f7a43", water: "#a8d0ea", rail: "#8d8d8d",
    // [dolgu, kenar] sinif sirasiyla: A, B, ucuncul, ara sokak, yaya, servis
    road: [["#ef9a7a", "#b8654c"], ["#fcd3a1", "#c79a5c"], ["#fff3c4", "#c9bd8a"], ["#ffffff", "#b9b4a8"], ["#efe3e6", "#c9b5ba"], ["#ffffff", "#cfcac0"]],
    text: "#2b2b2b", halo: "rgba(255,255,255,0.92)", arrow: "#55606e"
  };
  const BASE_W = [11, 9.5, 8.5, 7, 4.5, 4];  // zoom 17'de piksel genislik
  const ORDER = [5, 4, 3, 2, 1, 0];         // once ara sokaklar, en ustte A yollari

  let D = null, loading = null;
  function load() {
    if (D) return Promise.resolve(D);
    if (loading) return loading;
    loading = new Promise((ok, fail) => {
      const s = document.createElement("script");
      s.src = "map-data.js";
      s.onload = () => { D = decode(window.MAP_DATA); ok(D); };
      s.onerror = () => { loading = null; fail(new Error("map-data")); };
      document.head.append(s);
    });
    return loading;
  }
  // Delta kodlu E5 -> Web Mercator (zoom 0, 256 px) koordinatlari; her yolun kutusu (gorunmeyeni atlamak icin)
  function decode(M) {
    const merc = (la, ln) => {
      const s = Math.sin(la * Math.PI / 180);
      return [(ln + 180) / 360 * 256, (0.5 - Math.log((1 + s) / (1 - s)) / (4 * Math.PI)) * 256];
    };
    const pts = f => {
      const out = []; let a = 0, b = 0;
      for (let i = 0; i < f.length; i += 2) { a += f[i]; b += f[i + 1]; out.push(merc(a / 1e5, b / 1e5)); }
      return out;
    };
    const box = p => { let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
      p.forEach(([x, y]) => { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }); return [x0, y0, x1, y1]; };
    const roads = M.roads.map(([c, n, r, ow, f]) => { const p = pts(f); return { c, name: M.names[n] || "", ref: M.names[r] || "", ow, p, b: box(p) }; });
    const areas = M.areas.map(([k, n, f]) => { const p = pts(f); return { k, name: M.names[n] || "", p, b: box(p) }; });
    const rails = M.rails.map(f => { const p = pts(f); return { p, b: box(p) }; });
    // Ad yazmak icin ayni adli parcalar uc uca birlestirilir (Parker Street OSM'de 3 kisa parca: hicbirine ad sigmiyordu)
    const groups = {};
    roads.forEach(r => { if (r.name) (groups[r.name + "|" + r.c] = groups[r.name + "|" + r.c] || []).push(r.p.slice()); });
    const same = (p, q) => Math.abs(p[0] - q[0]) < 6e-5 && Math.abs(p[1] - q[1]) < 6e-5, chains = [];  // 1e-5 birim ~ 1 m
    Object.entries(groups).forEach(([key, segs]) => {
      const [name, c] = key.split("|");
      while (segs.length) {
        let ch = segs.pop(), grown = true;
        while (grown) {
          grown = false;
          for (let i = 0; i < segs.length; i++) {
            // uclar ~6 m icindeyse ayni nokta sayilir (Parker Street'in iki parcasi arasinda ~3 m bosluk var)
            const s = segs[i], a = ch[0], z = ch[ch.length - 1];
            if (same(s[0], z)) ch = ch.concat(s.slice(1));
            else if (same(s[s.length - 1], z)) ch = ch.concat(s.slice(0, -1).reverse());
            else if (same(s[s.length - 1], a)) ch = s.concat(ch.slice(1));
            else if (same(s[0], a)) ch = s.slice().reverse().concat(ch.slice(1));
            else continue;
            segs.splice(i, 1); grown = true; break;
          }
        }
        chains.push({ name, c: +c, p: ch, b: box(ch) });
      }
    });
    return { roads, areas, rails, chains };
  }

  const Layer = L.Layer.extend({
    onAdd(map) {
      this._map = map;
      // Harita donebilir (leaflet-rotate): katman DONEN pane'de durur, yollarla birlikte doner
      if (!map.getPane("az")) { const p = map.createPane("az", map._rotatePane || undefined); p.style.zIndex = 250; p.style.pointerEvents = "none"; }
      // leaflet-zoom-animated: buyutme animasyonunda eski cizim CSS ile olceklenir (operator: 'buyutunce gec aciliyor' -
      // eskiden animasyon boyunca gizleniyordu), animasyon bitince keskin olarak yeniden cizilir
      this._c = L.DomUtil.create("canvas", "leaflet-zoom-animated", map.getPane("az"));
      this._c.style.position = "absolute";
      map.on("moveend zoomend resize viewreset", this._schedule, this);
      map.on("rotate", this._rotated, this);
      map.on("zoomanim", this._animZoom, this);
      map.on("zoom", this._onZoom, this);  // parmakla buyutme (pinch) sirasinda surekli
      if (map.attributionControl) map.attributionControl.addAttribution('&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>');
      load().then(() => this._draw()).catch(() => this.fire("dataerror"));
    },
    onRemove(map) {
      map.off("moveend zoomend resize viewreset", this._schedule, this);
      map.off("rotate", this._rotated, this);
      map.off("zoomanim", this._animZoom, this);
      map.off("zoom", this._onZoom, this);
      this._c.remove();
    },
    // moveend + zoomend ayni anda gelir: tek cizim
    _schedule() { if (this._raf) return; this._raf = requestAnimationFrame(() => { this._raf = null; this._draw(); }); },
    _animZoom(e) { this._transform(e.center, e.zoom); },
    _onZoom() { this._transform(this._map.getCenter(), this._map.getZoom()); },
    // L.Renderer ile ayni hesap: cizildigi andaki sol ust kose yeni zoom'a olceklenir
    _transform(center, zoom) {
      if (this._z == null) return;
      const map = this._map, s = map.getZoomScale(zoom, this._z), o = map._getNewPixelOrigin(center, zoom);
      L.DomUtil.setTransform(this._c, L.point(this._ox * s - o.x, this._oy * s - o.y), s);
    },
    // Dondurme sirasinda canvas CSS ile doner; parmak durunca yeniden cizilir (yazilar dik, kenarlar dolu)
    _rotated() { clearTimeout(this._rt); this._rt = setTimeout(() => this._draw(), 120); },
    _draw() {
      if (!D || !this._map) return;
      const map = this._map, size = map.getSize(), z = map.getZoom(), PAD = 0.2;
      // Donuk haritada ekran, katman duzleminde egik bir dikdortgen: ekranin kosegeni kadar bir kare her acida kaplar
      const side = Math.round(Math.hypot(size.x, size.y) * (1 + 2 * PAD)), W = side, H = side;
      const mid = map.containerPointToLayerPoint([size.x / 2, size.y / 2]), tl = L.point(mid.x - side / 2, mid.y - side / 2);
      // Kisa kaydirma: cizili kenar payi yetiyor, yeniden cizme (telefonda akicilik)
      const org0 = map.getPixelOrigin(), am = [org0.x + mid.x, org0.y + mid.y], bear = map.getBearing ? map.getBearing() : 0;
      const sig = z + "|" + bear + "|" + side;
      if (this._sig === sig && this._am && Math.hypot(am[0] - this._am[0], am[1] - this._am[1]) < side * PAD * 0.6) {
        L.DomUtil.setTransform(this._c, L.point(this._ox - org0.x, this._oy - org0.y), 1);
        return;
      }
      this._sig = sig; this._am = am;
      const dpr = Math.min(window.devicePixelRatio || 1, 2), c = this._c;
      c.width = W * dpr; c.height = H * dpr; c.style.width = W + "px"; c.style.height = H + "px";
      L.DomUtil.setTransform(c, tl, 1);
      const ctx = c.getContext("2d");
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      // zoom-0 Mercator -> bu canvas'in pikseli
      const k = Math.pow(2, z), org = map.getPixelOrigin(), ox = org.x + tl.x, oy = org.y + tl.y;
      this._ox = ox; this._oy = oy; this._z = z;  // buyutme animasyonu icin
      const X = p => p[0] * k - ox, Y = p => p[1] * k - oy;
      const vis = b => b[2] * k - ox > -20 && b[0] * k - ox < W + 20 && b[3] * k - oy > -20 && b[1] * k - oy < H + 20;
      const path = p => { ctx.beginPath(); ctx.moveTo(X(p[0]), Y(p[0])); for (let i = 1; i < p.length; i++) ctx.lineTo(X(p[i]), Y(p[i])); };

      ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H);
      D.areas.forEach(a => { if (!vis(a.b)) return; path(a.p); ctx.closePath(); ctx.fillStyle = a.k ? C.water : C.park; ctx.fill(); });
      ctx.lineCap = "butt"; ctx.lineJoin = "round";
      if (z >= 14) D.rails.forEach(r => {
        if (!vis(r.b)) return;
        path(r.p); ctx.strokeStyle = C.rail; ctx.lineWidth = 3; ctx.setLineDash([]); ctx.stroke();
        ctx.strokeStyle = "#fff"; ctx.lineWidth = 1.4; ctx.setLineDash([6, 6]); ctx.stroke();
      });
      ctx.setLineDash([]);
      const sc = Math.pow(2, (z - 17) * 0.8);
      const wOf = cl => Math.max(cl <= 1 ? 2.5 : 1.2, BASE_W[cl] * sc);
      const shown = D.roads.filter(r => vis(r.b) && (z >= 15 || r.c <= 3) && (z >= 14 || r.c <= 2));
      ctx.lineCap = "round";
      // Kenar cizgileri, sonra dolgu: kavsaklar duz birlessin
      ORDER.forEach(cl => shown.forEach(r => { if (r.c !== cl) return; path(r.p); ctx.strokeStyle = C.road[cl][1]; ctx.lineWidth = wOf(cl) + 1.6; ctx.stroke(); }));
      ORDER.forEach(cl => shown.forEach(r => { if (r.c !== cl) return; path(r.p); ctx.strokeStyle = C.road[cl][0]; ctx.lineWidth = wOf(cl); ctx.stroke(); }));

      // Tek yon oklari: yol boyunca ~110 px'de bir
      if (z >= 15) {
        ctx.fillStyle = C.arrow;
        shown.forEach(r => {
          if (!r.ow || r.c > 3) return;
          let acc = 55;
          for (let i = 1; i < r.p.length; i++) {
            const x1 = X(r.p[i - 1]), y1 = Y(r.p[i - 1]), x2 = X(r.p[i]), y2 = Y(r.p[i]);
            const L1 = Math.hypot(x2 - x1, y2 - y1); let t = 110 - acc;
            while (t <= L1) {
              const f = t / L1, x = x1 + (x2 - x1) * f, y = y1 + (y2 - y1) * f;
              let ang = Math.atan2(y2 - y1, x2 - x1); if (r.ow < 0) ang += Math.PI;
              ctx.save(); ctx.translate(x, y); ctx.rotate(ang);
              ctx.beginPath(); ctx.moveTo(5, 0); ctx.lineTo(-4, -3.5); ctx.lineTo(-2, 0); ctx.lineTo(-4, 3.5); ctx.closePath(); ctx.fill();
              ctx.restore(); t += 110;
            }
            acc = (acc + L1) % 110;
          }
        });
      }
      this._labels(ctx, vis, X, Y, z, W, H);
    },
    // Sokak adlari: once yolun en uzun duz parcasina, yola paralel; sigmazsa yolun kivrimini izleyerek harf harf.
    // Carpisanlar ve ayni adin yakin tekrari atlanir. Oncelik: A > B > ucuncul > ara sokak > yaya.
    _labels(ctx, vis, X, Y, z, W, H) {
      if (z < 14) return;
      const boxes = [], lastAt = {};
      // Harita B kadar donukken katmandaki a acisi ekranda a+B gorunur: yazilar EKRANA gore dik tutulur
      const B = (this._map.getBearing ? this._map.getBearing() : 0) * Math.PI / 180;
      const upright = a => { let s = a + B; s = Math.atan2(Math.sin(s), Math.cos(s)); return s > Math.PI / 2 ? a - Math.PI : s < -Math.PI / 2 ? a + Math.PI : a; };
      const hit = b => boxes.some(o => b[0] < o[2] && b[2] > o[0] && b[1] < o[3] && b[3] > o[1]);
      const fs = cl => (cl <= 1 ? 12 : cl === 2 ? 11.5 : 11) * (z >= 17 ? 1.08 : z <= 15 ? 0.88 : 1);
      const order = D.chains.filter(r => vis(r.b) && (z >= 16 || r.c <= 4) && (z >= 15 || r.c <= 1)).sort((a, b) => a.c - b.c);
      ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.lineJoin = "round";
      const near = (name, x, y) => (lastAt[name] || []).some(([px, py]) => Math.hypot(px - x, py - y) < 260);
      const curved = (r, tw) => {
        // yol boyunca piksel noktalar; yazinin ortasi yolun ortasina; soldan saga okunacak yone cevrilir
        let P = r.p.map(q => [X(q), Y(q)]);
        const cum = [0]; for (let i = 1; i < P.length; i++) cum.push(cum[i - 1] + Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]));
        const total = cum[cum.length - 1];
        if (total < tw + 12) return false;
        const sx = (P[P.length - 1][0] - P[0][0]) * Math.cos(B) - (P[P.length - 1][1] - P[0][1]) * Math.sin(B);  // ekranda soldan saga mi
        if (sx < 0) { P = P.reverse(); for (let i = 0; i < cum.length; i++) cum[i] = total - cum[i]; cum.reverse(); }
        const at = s => { let i = 1; while (i < cum.length - 1 && cum[i] < s) i++;
          const f = (s - cum[i - 1]) / ((cum[i] - cum[i - 1]) || 1);
          return [P[i - 1][0] + (P[i][0] - P[i - 1][0]) * f, P[i - 1][1] + (P[i][1] - P[i - 1][1]) * f, Math.atan2(P[i][1] - P[i - 1][1], P[i][0] - P[i - 1][0])]; };
        const s0 = total / 2 - tw / 2, glyphs = []; let s = s0, maxTurn = 0, prevA = null;
        for (const ch of r.name) {
          const w = ctx.measureText(ch).width, [x, y, a] = at(s + w / 2);
          if (prevA !== null) maxTurn = Math.max(maxTurn, Math.abs(((a - prevA + 3 * Math.PI) % (2 * Math.PI)) - Math.PI));
          prevA = a; glyphs.push([ch, x, y, a]); s += w;
        }
        if (maxTurn > 0.6) return false;  // keskin kivrimda harfler birbirine girer
        const hh = fs(r.c) / 2 + 2, gb = glyphs.map(([, x, y]) => [x - hh, y - hh, x + hh, y + hh]);
        const [mx, my] = at(total / 2);
        if (mx < 0 || my < 0 || mx > W || my > H || near(r.name, mx, my) || gb.some(hit)) return false;
        gb.forEach(b => boxes.push(b)); (lastAt[r.name] = lastAt[r.name] || []).push([mx, my]);
        glyphs.forEach(([ch, x, y, a]) => { ctx.save(); ctx.translate(x, y); ctx.rotate(a);
          ctx.strokeStyle = C.halo; ctx.lineWidth = 3; ctx.strokeText(ch, 0, 0.5); ctx.fillStyle = C.text; ctx.fillText(ch, 0, 0.5); ctx.restore(); });
        return true;
      };
      // Uzun sokaklar once (ayni sinifta): kisa bir sokagin adi uzun olaninkini engellemesin
      const plen = r => r.p.slice(1).reduce((s, q, i) => s + Math.hypot(q[0] - r.p[i][0], q[1] - r.p[i][1]), 0);
      order.sort((a, b) => a.c - b.c || plen(b) - plen(a));
      order.forEach(r => {
        // duz parcalar (art arda neredeyse ayni yondeki parcalar birlesir), uzundan kisaya: ad sigan ve
        // baska yaziyla carpismayan ilk parcaya yazilir; hicbiri olmazsa yolun kivrimini izleyerek
        const runs = [];
        for (let i = 1; i < r.p.length; i++) {
          let j = i; const x1 = X(r.p[i - 1]), y1 = Y(r.p[i - 1]);
          const a0 = Math.atan2(Y(r.p[i]) - y1, X(r.p[i]) - x1);
          while (j + 1 < r.p.length && Math.abs(Math.atan2(Y(r.p[j + 1]) - Y(r.p[j]), X(r.p[j + 1]) - X(r.p[j])) - a0) < 0.25) j++;
          const x2 = X(r.p[j]), y2 = Y(r.p[j]);
          runs.push({ x1, y1, x2, y2, len: Math.hypot(x2 - x1, y2 - y1) });
          i = j;
        }
        runs.sort((a, b) => b.len - a.len);
        ctx.font = `${r.c <= 1 ? 700 : 600} ${fs(r.c)}px system-ui, -apple-system, "Segoe UI", sans-serif`;
        const tw = ctx.measureText(r.name).width, hh = fs(r.c) / 2 + 2;
        for (const run of runs) {
          if (tw + 8 > run.len) break;
          const cx = (run.x1 + run.x2) / 2, cy = (run.y1 + run.y2) / 2;
          if (cx < 0 || cy < 0 || cx > W || cy > H || near(r.name, cx, cy)) continue;
          let ang = Math.atan2(run.y2 - run.y1, run.x2 - run.x1);
          ang = upright(ang);  // yazi ekranda ters durmasin
          const hw = tw / 2 + 3, ca = Math.abs(Math.cos(ang)), sa = Math.abs(Math.sin(ang));
          const ex = hw * ca + hh * sa, ey = hw * sa + hh * ca, b = [cx - ex, cy - ey, cx + ex, cy + ey];
          if (hit(b)) continue;
          boxes.push(b); (lastAt[r.name] = lastAt[r.name] || []).push([cx, cy]);
          ctx.save(); ctx.translate(cx, cy); ctx.rotate(ang);
          ctx.strokeStyle = C.halo; ctx.lineWidth = 3; ctx.strokeText(r.name, 0, 0.5);
          ctx.fillStyle = C.text; ctx.fillText(r.name, 0, 0.5);
          ctx.restore();
          return;
        }
        curved(r, tw);
      });
      // Buyuk parklarin adlari
      ctx.font = `italic 600 ${z >= 16 ? 13 : 12}px system-ui, sans-serif`; ctx.fillStyle = C.parkText;
      D.areas.forEach(a => {
        if (a.k || !a.name) return;
        const w = (a.b[2] - a.b[0]) * Math.pow(2, z), h = (a.b[3] - a.b[1]) * Math.pow(2, z);
        const tw = ctx.measureText(a.name).width;
        if (w < tw + 20 || h < 24) return;
        const cx = X([(a.b[0] + a.b[2]) / 2, 0]), cy = Y([0, (a.b[1] + a.b[3]) / 2]);
        const bb = [cx - tw / 2, cy - 8, cx + tw / 2, cy + 8];
        if (cx < 0 || cy < 0 || cx > W || cy > H || hit(bb)) return;
        boxes.push(bb);
        ctx.save(); ctx.translate(cx, cy); ctx.rotate(-B);  // park adi ekranda yatay
        ctx.strokeStyle = C.halo; ctx.lineWidth = 3; ctx.strokeText(a.name, 0, 0); ctx.fillText(a.name, 0, 0); ctx.restore();
      });
    }
  });
  window.AZMap = { layer: () => new Layer(), load, data: () => D };
})();
