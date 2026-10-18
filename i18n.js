// Arayuz dili: "tr" (Turkce) ya da "en" (English). Sinav sorulari her iki dilde de Ingilizce kalir.
// Secim sirasi: ?lang=en|tr linki > kullanicinin onceki secimi > tarayici dili Turkce ise tr, degilse en.
// Statik metin: HTML ogesine data-en="..." yazilir, en ise innerHTML onunla degisir.
// data-only="tr" / data-only="en" = yalniz o dilde gorunur. Kod icinde: T("Turkce", "English").
(() => {
  const ok = l => l === "tr" || l === "en";
  let lang = null;
  try { const q = new URLSearchParams(location.search).get("lang"); if (ok(q)) { lang = q; localStorage.setItem("lang", q); } } catch (_) {}
  if (!lang) try { const s = localStorage.getItem("lang"); if (ok(s)) lang = s; } catch (_) {}
  if (!lang) lang = (navigator.languages || [navigator.language || ""]).some(l => /^tr\b/i.test(l)) ? "tr" : "en";
  window.LANG = lang;
  window.T = (tr, en) => (lang === "en" ? en : tr);
  window.setLang = l => {
    if (!ok(l) || l === lang) return;
    try { localStorage.setItem("lang", l); } catch (_) {}
    const u = new URL(location.href); u.searchParams.delete("lang");
    location.replace(u.toString());
  };
  document.documentElement.lang = lang;
  const apply = () => {
    if (lang === "en") document.title = "Private Hire Test London – PCO test practice";
    if (lang === "en") document.querySelectorAll("[data-en]").forEach(e => { e.innerHTML = e.dataset.en; });
    document.querySelectorAll("[data-only]").forEach(e => { if (e.dataset.only !== lang) e.hidden = true; });
    document.querySelectorAll("[data-lang]").forEach(b => b.classList.toggle("on", b.dataset.lang === lang));
  };
  // Govdedeki betiklerden ONCE cagrilir (index.html'de </div> sonrasi), yoksa dinamik doldurulan alanlar ezilir.
  window.applyLang = apply;
})();
