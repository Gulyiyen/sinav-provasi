// Soru bankasi kontrolu: yapi + "dogru cevap en uzun sik" orani. Kullanim: node tools/check_bank.js seru-data.js,seru-data-2.js [-v]
global.window = {};
process.argv[2].split(",").forEach(f => require(require("path").resolve(f)));
const S = window.SERU;
let longest = 0, clear = 0;
const clearList = [];
S.forEach((x, i) => {
  const L = x.o.map(o => o.length), mx = Math.max(...L.slice(1));
  if (L[0] > mx) { longest++; if (L[0] > mx * 1.3) { clear++; clearList.push(i + " " + x.q.slice(0, 50)); } }
});
const bad = S.filter(x => !x.q || !x.tr || !x.e || !x.s || !Array.isArray(x.o) || x.o.length !== 4 || new Set(x.o).size !== 4 ||
  (x.t === "fill" && !x.q.includes("___")) || (x.t === "read" && !x.p));
const by = {}; S.forEach(x => { const t = x.t || "mcq"; by[t] = (by[t] || 0) + 1; });
const sec = {}; S.forEach(x => sec[x.s] = (sec[x.s] || 0) + 1);
console.log("total", S.length, JSON.stringify(by), "bad", bad.length, "dup", S.length - new Set(S.map(x => x.q)).size);
console.log("per section", JSON.stringify(sec));
console.log("correct is longest:", longest, "(" + Math.round(longest / S.length * 100) + "%)", "clearly longer >30%:", clear);
if (process.argv[3] === "-v") clearList.forEach(l => console.log("  ", l));
