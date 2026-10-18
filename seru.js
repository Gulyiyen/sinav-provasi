// (c) 2026 Sinav Provasi / Private Hire Test London. Tum haklari saklidir - All rights reserved.
// Sorular, aciklamalar ve kod ozgundur; izinsiz kopyalanamaz, yeniden yayinlanamaz.
// SERU testi: hizli alistirma (10 soru, aninda aciklama) ve sinav provasi (37 soru, 45 dk).
// Gercek sinavin dagilimi: 18 coktan secmeli + 17 cumle tamamlama + 2 okuma-anlama, gecme %60.
(() => {
  const BANK = window.SERU || [];
  const SECTIONS = {
    1: T("Lisans", "Licensing"), 2: T("Araç lisansı", "Vehicle licensing"), 3: T("Yolculuklar", "Journeys"), 4: T("Güvenlik", "Safety"), 5: T("Sürücü davranışı", "Driver behaviour"),
    6: T("Londra'da sürüş ve park", "Driving and parking in London"), 7: T("Güvenli sürüş", "Safe driving"), 8: T("Eşitlik ve engellilik", "Equality and disability"),
    9: T("Çocukları ve risk altındakileri koruma", "Safeguarding children and adults at risk"), 10: T("Paylaşımlı yolculuk", "Shared journeys")
  };
  const TYPE_LABEL = T({ mcq: "Doğru cevabı seçin", fill: "Cümleyi tamamlayın", read: "Okuyun ve cevaplayın" }, { mcq: "Choose the correct answer", fill: "Complete the sentence", read: "Read and answer" });
  const EXAM = { mcq: 18, fill: 17, read: 2, minutes: 45 };
  const PASS = 0.6;
  const $ = id => document.getElementById(id);
  const typeOf = x => x.t || "mcq";

  const show = (id, how) => window.showScreen(id, how);  // ortak gecis: telefonun geri tusu calissin
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
    $("seru-progress").textContent = `${T("Soru", "Question")} ${idx + 1} / ${qs.length}`;
    $("seru-type").textContent = TYPE_LABEL[typeOf(x)];
    const p = $("seru-passage");
    p.hidden = !x.p; p.textContent = x.p || "";
    $("seru-qtext").textContent = x.q;
    $("seru-tr").textContent = x.tr; $("seru-tr").hidden = true;
    $("seru-trbtn").textContent = "🇹🇷 Türkçesini göster";
    $("seru-feedback").hidden = true;
    $("seru-next").disabled = true;
    $("seru-next").textContent = idx + 1 < qs.length ? T("Sonraki →", "Next →") : T("Sonucu gör", "See result");
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
    const h = document.createElement("b"); h.textContent = right ? T("✓ Doğru", "✓ Correct") : T("✗ Yanlış – doğru cevap: ", "✗ Wrong – correct answer: ") + x.o[0];
    const e = document.createElement("p"); e.textContent = T(x.e, x.ee || x.e);
    const r = document.createElement("p"); r.className = "ref"; r.textContent = `📖 ${T("El kitabı – Bölüm", "Handbook – Section")} ${x.s}: ${SECTIONS[x.s]}`;
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
    $("seru-score").textContent = T(`${correct} / ${qs.length} doğru (%${pct})`, `${correct} / ${qs.length} correct (${pct}%)`);
    const v = $("seru-verdict");
    if (mode === "exam") {
      v.textContent = passed ? T("✅ GEÇTİNİZ – gerçek sınavda geçme notu %60", "✅ PASS – the pass mark in the real test is 60%") : T("❌ Bu sefer olmadı – geçmek için %60 gerekiyor. Yanlışlarınıza bakıp tekrar deneyin.", "❌ Not this time – you need 60% to pass. Look at your mistakes and try again.");
      v.className = passed ? "verdict pass" : "verdict fail";
    } else {
      v.textContent = passed ? T("Güzel gidiyorsunuz 👍", "You're doing well 👍") : T("Yanlışlarınızı okuyun, sonra tekrar deneyin.", "Read your mistakes, then try again.");
      v.className = "verdict";
    }
    $("seru-meta").textContent = answered < qs.length ? T(`${qs.length - answered} soru boş kaldı (boş = yanlış).`, `${qs.length - answered} questions left blank (blank = wrong).`) : "";
    const box = $("seru-wrong"); box.innerHTML = "";
    const wrong = qs.map((x, i) => ({ x, p: picks[i] })).filter(w => w.p !== w.x.o[0]);
    $("seru-wrong-title").hidden = !wrong.length;
    wrong.forEach(({ x, p }) => {
      const d = document.createElement("div"); d.className = "ans";
      const q = document.createElement("div"); q.className = "q"; q.textContent = (x.p ? x.p + " " : "") + x.q;
      const a = document.createElement("div"); a.className = "tip"; a.textContent = T("Sizin cevabınız: ", "Your answer: ") + (p === undefined ? T("(boş)", "(blank)") : p);
      const c = document.createElement("div"); c.className = "ok"; c.textContent = T("Doğru cevap: ", "Correct answer: ") + x.o[0];
      const e = document.createElement("div"); e.className = "sample"; e.textContent = T(x.e, x.ee || x.e);
      const r = document.createElement("div"); r.className = "ref"; r.textContent = `📖 ${T("Bölüm", "Section")} ${x.s}: ${SECTIONS[x.s]}`;
      d.append(q, a, c, e, r); box.append(d);
    });
    show("s-seru-result", "replace");
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
  // Sinavdan geri tusuyla cikilirsa sayac dursun (yoksa sure bitince sonuc ekrani kendiliginden acilirdi)
  window.addEventListener("screenleave", e => { if (e.detail === "s-seru-q") clearInterval(timerId); });
  window.__seru = { start, finish, state: () => ({ mode, qs, idx, picks }) };  // test icin
})();
