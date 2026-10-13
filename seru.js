// SERU testi: hizli alistirma (10 soru, aninda aciklama) ve sinav provasi (37 soru, 45 dk).
// Gercek sinavin dagilimi: 18 coktan secmeli + 17 cumle tamamlama + 2 okuma-anlama, gecme %60.
(() => {
  const BANK = window.SERU || [];
  const SECTIONS = {
    1: "Lisans", 2: "Araç lisansı", 3: "Yolculuklar", 4: "Güvenlik", 5: "Sürücü davranışı",
    6: "Londra'da sürüş ve park", 7: "Güvenli sürüş", 8: "Eşitlik ve engellilik",
    9: "Çocukları ve risk altındakileri koruma", 10: "Paylaşımlı yolculuk"
  };
  const TYPE_LABEL = { mcq: "Doğru cevabı seçin", fill: "Cümleyi tamamlayın", read: "Okuyun ve cevaplayın" };
  const EXAM = { mcq: 18, fill: 17, read: 2, minutes: 45 };
  const PASS = 0.6;
  const $ = id => document.getElementById(id);
  const typeOf = x => x.t || "mcq";

  function show(id) { document.querySelectorAll(".screen").forEach(s => s.classList.toggle("on", s.id === id)); window.scrollTo(0, 0); }
  function shuffle(a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

  // Bu telefonda sorulmus sorular hatirlanir; bir turun havuzu bitince o tur bastan baslar
  function pick(type, n) {
    const key = "seru-seen-" + type;
    let seen = [];
    try { seen = JSON.parse(localStorage.getItem(key) || "[]"); } catch (_) {}
    const all = BANK.filter(x => typeOf(x) === type);
    let fresh = all.filter(x => !seen.includes(x.q));
    if (fresh.length < n) { seen = []; fresh = all.slice(); }
    const out = shuffle(fresh).slice(0, n);
    try { localStorage.setItem(key, JSON.stringify(seen.concat(out.map(x => x.q)))); } catch (_) {}
    return out;
  }

  let mode = "practice", qs = [], idx = 0, picks = [], timerId = null, deadline = 0;

  function start(m) {
    mode = m;
    if (m === "exam") {
      // Sinav sirasi: once coktan secmeli, sonra cumle tamamlama, en sonda okuma
      qs = pick("mcq", EXAM.mcq).concat(pick("fill", EXAM.fill), pick("read", EXAM.read));
      deadline = Date.now() + EXAM.minutes * 60000;
      clearInterval(timerId); timerId = setInterval(tick, 1000); tick();
    } else {
      // Alistirma: karisik 10 soru (7 coktan secmeli, 2 cumle, 1 okuma)
      qs = shuffle(pick("mcq", 7).concat(pick("fill", 2), pick("read", 1)));
      clearInterval(timerId); $("seru-timer").textContent = "";
    }
    qs = qs.map(x => ({ ...x, opts: shuffle(x.o) }));
    idx = 0; picks = [];
    show("s-seru-q");
    render();
  }

  function tick() {
    const left = Math.max(0, deadline - Date.now());
    const m = Math.floor(left / 60000), s = Math.floor(left / 1000) % 60;
    const el = $("seru-timer");
    el.textContent = "⏱ " + String(m).padStart(2, "0") + ":" + String(s).padStart(2, "0");
    el.classList.toggle("low", left < 5 * 60000);
    if (left <= 0) finish();
  }

  function render() {
    const x = qs[idx];
    $("seru-progress").textContent = `Soru ${idx + 1} / ${qs.length}`;
    $("seru-type").textContent = TYPE_LABEL[typeOf(x)];
    const p = $("seru-passage");
    p.hidden = !x.p; p.textContent = x.p || "";
    $("seru-qtext").textContent = x.q;
    $("seru-tr").textContent = x.tr; $("seru-tr").hidden = true;
    $("seru-trbtn").textContent = "🇹🇷 Türkçesini göster";
    $("seru-feedback").hidden = true;
    $("seru-next").disabled = true;
    $("seru-next").textContent = idx + 1 < qs.length ? "Sonraki →" : "Sonucu gör";
    const box = $("seru-opts"); box.innerHTML = "";
    x.opts.forEach(o => {
      const b = document.createElement("button");
      b.className = "opt"; b.textContent = o;
      b.onclick = () => choose(o, b);
      box.append(b);
    });
  }

  function choose(o, btn) {
    const x = qs[idx];
    const buttons = [...$("seru-opts").children];
    if (mode === "exam") {
      // Sinavda: secim degistirilebilir, aciklama sonda
      buttons.forEach(b => b.classList.toggle("sel", b === btn));
      picks[idx] = o;
      $("seru-next").disabled = false;
      return;
    }
    if (picks[idx] !== undefined) return;  // alistirmada tek hak
    picks[idx] = o;
    const right = o === x.o[0];
    buttons.forEach(b => {
      b.disabled = true;
      if (b.textContent === x.o[0]) b.classList.add("right");
      else if (b === btn) b.classList.add("wrong");
    });
    const f = $("seru-feedback");
    f.className = "card feedback " + (right ? "ok" : "no");
    f.innerHTML = "";
    const h = document.createElement("b"); h.textContent = right ? "✓ Doğru" : "✗ Yanlış – doğru cevap: " + x.o[0];
    const e = document.createElement("p"); e.textContent = x.e;
    const r = document.createElement("p"); r.className = "ref"; r.textContent = `📖 El kitabı – Bölüm ${x.s}: ${SECTIONS[x.s]}`;
    f.append(h, e, r); f.hidden = false;
    $("seru-next").disabled = false;
  }

  function next() {
    if (idx + 1 < qs.length) { idx++; render(); window.scrollTo(0, 0); }
    else finish();
  }

  function finish() {
    clearInterval(timerId);
    const answered = picks.filter(p => p !== undefined).length;
    const correct = qs.filter((x, i) => picks[i] === x.o[0]).length;
    const pct = Math.round(correct / qs.length * 100);
    const passed = correct / qs.length >= PASS;
    $("seru-score").textContent = `${correct} / ${qs.length} doğru (%${pct})`;
    const v = $("seru-verdict");
    if (mode === "exam") {
      v.textContent = passed ? "✅ GEÇTİNİZ – gerçek sınavda geçme notu %60" : "❌ Bu sefer olmadı – geçmek için %60 gerekiyor. Yanlışlarınıza bakıp tekrar deneyin.";
      v.className = passed ? "verdict pass" : "verdict fail";
    } else {
      v.textContent = passed ? "Güzel gidiyorsunuz 👍" : "Yanlışlarınızı okuyun, sonra tekrar deneyin.";
      v.className = "verdict";
    }
    $("seru-meta").textContent = answered < qs.length ? `${qs.length - answered} soru boş kaldı (boş = yanlış).` : "";
    const box = $("seru-wrong"); box.innerHTML = "";
    const wrong = qs.map((x, i) => ({ x, p: picks[i] })).filter(w => w.p !== w.x.o[0]);
    $("seru-wrong-title").hidden = !wrong.length;
    wrong.forEach(({ x, p }) => {
      const d = document.createElement("div"); d.className = "ans";
      const q = document.createElement("div"); q.className = "q"; q.textContent = (x.p ? x.p + " " : "") + x.q;
      const a = document.createElement("div"); a.className = "tip"; a.textContent = "Sizin cevabınız: " + (p === undefined ? "(boş)" : p);
      const c = document.createElement("div"); c.className = "ok"; c.textContent = "Doğru cevap: " + x.o[0];
      const e = document.createElement("div"); e.className = "sample"; e.textContent = x.e;
      const r = document.createElement("div"); r.className = "ref"; r.textContent = `📖 Bölüm ${x.s}: ${SECTIONS[x.s]}`;
      d.append(q, a, c, e, r); box.append(d);
    });
    show("s-seru-result");
  }

  $("seru-practice").onclick = () => start("practice");
  $("seru-exam").onclick = () => start("exam");
  $("seru-next").onclick = next;
  $("seru-quit").onclick = finish;
  $("seru-again").onclick = () => start(mode);
  $("seru-trbtn").onclick = () => {
    const t = $("seru-tr"); t.hidden = !t.hidden;
    $("seru-trbtn").textContent = t.hidden ? "🇹🇷 Türkçesini göster" : "🇹🇷 Türkçesini gizle";
  };
  $("seru-count").textContent = BANK.length;
  window.__seru = { start, finish, state: () => ({ mode, qs, idx, picks }) };  // test icin
})();
