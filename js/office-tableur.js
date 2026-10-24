/* Lucien Office — Lucien Tableur (feuilles de calcul, formules, graphiques) */
"use strict";
const XCOLS = 26, XROWS = 100;
const colName = (c) => String.fromCharCode(65 + c);
const cellKey = (r, c) => colName(c) + (r + 1);
const parseKey = (k) => { const m = /^([A-Z])(\d+)$/.exec(k); return m ? [+m[2] - 1, m[1].charCodeAt(0) - 65] : null; };
function rangeRows(a, b) {
  const [r0, c0] = parseKey(a), [r1, c1] = parseKey(b), out = [];
  for (let r = Math.min(r0, r1); r <= Math.max(r0, r1); r++) { const row = []; for (let c = Math.min(c0, c1); c <= Math.max(c0, c1); c++) row.push(cellKey(r, c)); out.push(row); }
  return out;
}
/* décale les références relatives d'une formule (recopie) ; les références avec $ restent fixes */
function shiftFormula(src, dr, dc) {
  return String(src).split(/("[^"]*")/).map((part, i) => i % 2 ? part : part.replace(/(?<![A-Za-z])(\$?)([A-Z])(\$?)(\d+)(?![\d(])/g, (m, d1, col, d2, row) => {
    const c = d1 ? col : String.fromCharCode(Math.max(65, Math.min(90, col.charCodeAt(0) + dc))), r = d2 ? row : Math.max(1, +row + dr);
    return d1 + c + d2 + r;
  })).join("");
}
function rangeKeys(a, b) {
  const [r0, c0] = parseKey(a), [r1, c1] = parseKey(b), out = [];
  for (let r = Math.min(r0, r1); r <= Math.max(r0, r1); r++) for (let c = Math.min(c0, c1); c <= Math.max(c0, c1); c++) out.push(cellKey(r, c));
  return out;
}
/* Fonctions disponibles, noms français et anglais */
const XFN = (() => {
  const flat = (a) => a.flat(Infinity);
  const nums = (a) => flat(a).filter(x => typeof x === "number");
  const crit = (c) => { const m = /^(<=|>=|<>|<|>|=)?(.*)$/.exec(String(c)); const op = m[1] || "=", v = isNaN(+m[2]) || m[2] === "" ? m[2] : +m[2]; return (x) => op === "=" ? x == v : op === "<>" ? x != v : op === "<" ? x < v : op === ">" ? x > v : op === "<=" ? x <= v : x >= v; };
  const serial = (d) => (d - new Date(1899, 11, 30)) / 864e5;
  const F = {
    SOMME: (...a) => nums(a).reduce((s, x) => s + x, 0),
    MOYENNE: (...a) => { const n = nums(a); if (!n.length) throw "#DIV/0!"; return F.SOMME(n) / n.length; },
    MIN: (...a) => Math.min(...nums(a)), MAX: (...a) => Math.max(...nums(a)),
    NB: (...a) => nums(a).length, NBVAL: (...a) => flat(a).filter(x => x !== "").length,
    SI: (c, a, b = false) => c ? a : b, ET: (...a) => flat(a).every(Boolean), OU: (...a) => flat(a).some(Boolean), NON: (x) => !x,
    ARRONDI: (x, n = 0) => Math.round(x * 10 ** n) / 10 ** n, ENT: Math.floor, ABS: Math.abs, RACINE: Math.sqrt, PUISSANCE: Math.pow, MOD: (a, b) => a % b, PI: () => Math.PI, ALEA: Math.random,
    PRODUIT: (...a) => nums(a).reduce((s, x) => s * x, 1),
    "NB.SI": (r, c) => flat([r]).filter(crit(c)).length,
    "SOMME.SI": (r, c, s) => { const R = flat([r]), S2 = s ? flat([s]) : R, f = crit(c); return R.reduce((t, x, i) => t + (f(x) && typeof S2[i] === "number" ? S2[i] : 0), 0); },
    CONCAT: (...a) => flat(a).join(""), MAJUSCULE: (s) => String(s).toUpperCase(), MINUSCULE: (s) => String(s).toLowerCase(), NBCAR: (s) => String(s).length,
    GAUCHE: (s, n = 1) => String(s).slice(0, n), DROITE: (s, n = 1) => String(s).slice(-n),
    AUJOURDHUI: () => Math.floor(serial(new Date())), MAINTENANT: () => serial(new Date())
  };
  Object.assign(F, { SUM: F.SOMME, AVERAGE: F.MOYENNE, COUNT: F.NB, COUNTA: F.NBVAL, IF: F.SI, AND: F.ET, OR: F.OU, NOT: F.NON, ROUND: F.ARRONDI, INT: F.ENT, SQRT: F.RACINE, POWER: F.PUISSANCE, RAND: F.ALEA, PRODUCT: F.PRODUIT, COUNTIF: F["NB.SI"], SUMIF: F["SOMME.SI"], CONCATENER: F.CONCAT, UPPER: F.MAJUSCULE, LOWER: F.MINUSCULE, LEN: F.NBCAR, LEFT: F.GAUCHE, RIGHT: F.DROITE, TODAY: F.AUJOURDHUI, NOW: F.MAINTENANT });
  const rows2 = (r) => Array.isArray(r) && Array.isArray(r[0]) ? r : [flat([r])];
  const toDate = (s) => typeof s === "number" ? new Date(new Date(1899, 11, 30).getTime() + s * 864e5) : (() => { const m = /^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/.exec(String(s)); return m ? new Date(+m[3] < 100 ? 2000 + +m[3] : +m[3], m[2] - 1, m[1]) : new Date(s); })();
  const same = (a, b) => a == b || (typeof a === "string" && typeof b === "string" && a.toLowerCase() === b.toLowerCase());
  const keepIf = (pairs, n) => { const ok = Array(n).fill(true); for (let i = 0; i < pairs.length; i += 2) { const R = flat([pairs[i]]), f = crit(pairs[i + 1]); R.forEach((x, j) => { if (!f(x)) ok[j] = false; }); } return ok; };
  Object.assign(F, {
    RECHERCHEV: (v, tb, col, approx = false) => { const T = rows2(tb); const row = approx ? [...T].reverse().find(r => r[0] <= v) : T.find(r => same(r[0], v)); if (!row) throw "#N/A"; return row[col - 1] ?? ""; },
    RECHERCHEH: (v, tb, row) => { const T = rows2(tb); const i = T[0].findIndex(x => same(x, v)); if (i < 0) throw "#N/A"; return (T[row - 1] || [])[i] ?? ""; },
    RECHERCHEX: (v, a, b, def) => { const A = flat([a]), B = flat([b]); const i = A.findIndex(x => same(x, v)); if (i < 0) { if (def !== undefined) return def; throw "#N/A"; } return B[i]; },
    INDEX: (tb, r, c = 1) => { const T = rows2(tb); return T.length === 1 ? T[0][r - 1] ?? "" : (T[r - 1] || [])[c - 1] ?? ""; },
    EQUIV: (v, a) => { const i = flat([a]).findIndex(x => same(x, v)); if (i < 0) throw "#N/A"; return i + 1; },
    "NB.SI.ENS": (...a) => keepIf(a, flat([a[0]]).length).filter(Boolean).length,
    "SOMME.SI.ENS": (s, ...a) => { const S2 = flat([s]), ok = keepIf(a, S2.length); return S2.reduce((x, v, j) => x + (ok[j] && typeof v === "number" ? v : 0), 0); },
    "MOYENNE.SI": (r, c, s) => { const R = flat([r]), S2 = s ? flat([s]) : R, f = crit(c); const v = R.map((x, i) => f(x) ? S2[i] : null).filter(x => typeof x === "number"); if (!v.length) throw "#DIV/0!"; return v.reduce((a, b) => a + b, 0) / v.length; },
    SIERREUR: (fn, alt = "") => { try { const v = typeof fn === "function" ? fn() : fn; return typeof v === "number" && !isFinite(v) ? alt : v; } catch { return alt; } },
    "SI.CONDITIONS": (...a) => { for (let i = 0; i < a.length; i += 2) if (a[i]) return a[i + 1]; throw "#N/A"; },
    MEDIANE: (...a) => { const v = nums(a).sort((x, y) => x - y), n = v.length; if (!n) throw "#NOMBRE!"; return n % 2 ? v[(n - 1) / 2] : (v[n / 2 - 1] + v[n / 2]) / 2; },
    VAR: (...a) => { const v = nums(a), m = v.reduce((s, x) => s + x, 0) / v.length; return v.reduce((s, x) => s + (x - m) ** 2, 0) / (v.length - 1); },
    ECARTYPE: (...a) => Math.sqrt(F.VAR(...a)),
    RANG: (x, r, asc = 0) => { const v = nums([r]).sort((a, b) => asc ? a - b : b - a), i = v.indexOf(x); if (i < 0) throw "#N/A"; return i + 1; },
    "GRANDE.VALEUR": (r, k) => nums([r]).sort((a, b) => b - a)[k - 1], "PETITE.VALEUR": (r, k) => nums([r]).sort((a, b) => a - b)[k - 1],
    SOMMEPROD: (...a) => { const A = a.map(x => flat([x])); return A[0].reduce((s, _, i) => s + A.reduce((p, arr) => p * (+arr[i] || 0), 1), 0); },
    "ARRONDI.SUP": (x, n = 0) => Math.ceil(x * 10 ** n) / 10 ** n, "ARRONDI.INF": (x, n = 0) => Math.floor(x * 10 ** n) / 10 ** n,
    SUPPRESPACE: (s) => String(s).trim().replace(/\s+/g, " "), STXT: (s, d, n) => String(s).substr(d - 1, n), SUBSTITUE: (s, a, b) => String(s).split(a).join(b), REPT: (s, n) => String(s).repeat(n),
    CHERCHE: (a, s) => { const i = String(s).toLowerCase().indexOf(String(a).toLowerCase()); if (i < 0) throw "#VALEUR!"; return i + 1; },
    TEXTE: (v, fm) => { if (typeof v !== "number") return String(v); const d = (String(fm).split(/[.,]/)[1] || "").replace(/[^0#]/g, "").length; return String(fm).includes("%") ? (v * 100).toFixed(d).replace(".", ",") + " %" : v.toFixed(d).replace(".", ","); },
    DATE: (y, m, d) => (new Date(y, m - 1, d) - new Date(1899, 11, 30)) / 864e5,
    ANNEE: (s) => toDate(s).getFullYear(), MOIS: (s) => toDate(s).getMonth() + 1, JOUR: (s) => toDate(s).getDate(), JOURSEM: (s) => toDate(s).getDay() + 1,
    VPM: (r, n, va, vc = 0) => r ? -(va * (1 + r) ** n + vc) * r / ((1 + r) ** n - 1) : -(va + vc) / n,
    ESTNUM: (v) => typeof v === "number", ESTTEXTE: (v) => typeof v === "string" && v !== "",
    LN: Math.log, LOG: (x, b = 10) => Math.log(x) / Math.log(b), EXP: Math.exp, PI: () => Math.PI
  });
  Object.assign(F, { VLOOKUP: F.RECHERCHEV, HLOOKUP: F.RECHERCHEH, XLOOKUP: F.RECHERCHEX, MATCH: F.EQUIV, COUNTIFS: F["NB.SI.ENS"], SUMIFS: F["SOMME.SI.ENS"], AVERAGEIF: F["MOYENNE.SI"], IFERROR: F.SIERREUR, IFS: F["SI.CONDITIONS"], MEDIAN: F.MEDIANE, STDEV: F.ECARTYPE, RANK: F.RANG, LARGE: F["GRANDE.VALEUR"], SMALL: F["PETITE.VALEUR"], SUMPRODUCT: F.SOMMEPROD, ROUNDUP: F["ARRONDI.SUP"], ROUNDDOWN: F["ARRONDI.INF"], TRIM: F.SUPPRESPACE, MID: F.STXT, SUBSTITUTE: F.SUBSTITUE, SEARCH: F.CHERCHE, TEXT: F.TEXTE, YEAR: F.ANNEE, MONTH: F.MOIS, DAY: F.JOUR, WEEKDAY: F.JOURSEM, PMT: F.VPM, ISNUMBER: F.ESTNUM, ISTEXT: F.ESTTEXTE, REPT: F.REPT });
  return F;
})();
const XFN_HELP = [["RECHERCHEV", "RECHERCHEV(valeur; tableau; colonne; [approx])"], ["RECHERCHEX", "RECHERCHEX(valeur; plage; plage_résultat; [si_absent])"], ["INDEX", "INDEX(tableau; ligne; [colonne])"], ["EQUIV", "Position d'une valeur dans une plage"], ["SIERREUR", "SIERREUR(calcul; valeur_si_erreur)"], ["SI.CONDITIONS", "SI.CONDITIONS(test1; v1; test2; v2…)"], ["NB.SI.ENS", "Compte avec plusieurs critères"], ["SOMME.SI.ENS", "Somme avec plusieurs critères"], ["MOYENNE.SI", "Moyenne si critère"], ["MEDIANE", "Valeur du milieu"], ["ECARTYPE", "Écart-type (échantillon)"], ["RANG", "Classement d'une valeur"], ["SOMMEPROD", "Somme des produits"], ["TEXTE", "Met un nombre en forme"], ["DATE", "DATE(année; mois; jour)"], ["VPM", "Mensualité d'un prêt"], ["SOMME", "Additionne des nombres"], ["MOYENNE", "Moyenne arithmétique"], ["MIN", "Plus petite valeur"], ["MAX", "Plus grande valeur"], ["NB", "Compte les nombres"], ["NBVAL", "Compte les cellules non vides"], ["SI", "SI(test; si_vrai; si_faux)"], ["NB.SI", "NB.SI(plage; critère)"], ["SOMME.SI", "SOMME.SI(plage; critère; [somme])"], ["ARRONDI", "ARRONDI(nombre; décimales)"], ["CONCAT", "Assemble du texte"], ["AUJOURDHUI", "Date du jour"], ["RACINE", "Racine carrée"], ["PRODUIT", "Multiplie des nombres"]];
const formulaCache = {};
function compileFormula(src) {
  if (formulaCache[src]) return formulaCache[src];
  const strs = [];
  let s = src.replace(/"[^"]*"/g, m => { strs.push(m); return `\u0001${strs.length - 1}\u0001`; }).replace(/;/g, ",").toUpperCase();
  s = s.replace(/\$?([A-Z])\$?(\d+):\$?([A-Z])\$?(\d+)/g, 'R("$1$2","$3$4")');
  s = s.replace(/(^|[^A-Z"\w])\$?([A-Z])\$?(\d+)(?![\d(])/g, '$1V("$2$3")');
  s = s.replace(/([A-Z][A-Z0-9.]*)\s*\(/g, (m, n) => { if (n === "R" || n === "V") return m; if (!(n in XFN)) throw "#NOM?"; return `F["${n}"](`; });
  for (const lazy of ['F["SIERREUR"](', 'F["IFERROR"](']) {
    let at = s.indexOf(lazy);
    while (at >= 0) {
      const start = at + lazy.length; let d = 0, j = start;
      for (; j < s.length; j++) { const ch = s[j]; if (ch === "(") d++; else if (ch === ")") { if (d === 0) break; d--; } else if (ch === "," && d === 0) break; }
      s = s.slice(0, start) + "()\u0002(" + s.slice(start, j) + ")" + s.slice(j);
      at = s.indexOf(lazy, start + 5);
    }
  }
  s = s.replace(/\b(VRAI|TRUE)\b/g, "true").replace(/\b(FAUX|FALSE)\b/g, "false");
  s = s.replace(/(\d+(?:\.\d+)?)%/g, "($1/100)").replace(/<>/g, "!=").replace(/([^<>!=])=(?!=)/g, "$1==").replace(/\^/g, "**").replace(/&/g, '+""+');
  s = s.replace(/\u0002/g, "=>");
  s = s.replace(/\u0001(\d+)\u0001/g, (m, i) => strs[i]);
  const check = s.replace(/"[^"]*"/g, '""');
  if (/[^\w\s+\-*/().,"<>=!%[\]]/.test(check) || (check.match(/[A-Za-z_]\w*/g) || []).some(id => !["R", "V", "F", "true", "false"].includes(id))) throw "#VALEUR!";
  return (formulaCache[src] = new Function("V", "R", "F", `return (${s});`));
}

function TableurApp(body, w, arg) {
  let book = blank(), cur = 0, act = [0, 0], anchor = [0, 0], editing = null, memo = {}, undoS = [], redoS = [], showGrid = true, freeze = false, zoom = 100;
  function blank() { return { sheets: [{ name: "Feuil1", cells: {}, cw: {} }] }; }
  const sh = () => book.sheets[cur], cells = () => sh().cells;
  const sel = () => [Math.min(anchor[0], act[0]), Math.min(anchor[1], act[1]), Math.max(anchor[0], act[0]), Math.max(anchor[1], act[1])];
  const selKeys = () => { const [r0, c0, r1, c1] = sel(); return rangeKeys(cellKey(r0, c0), cellKey(r1, c1)); };
  const tabs = {
    "Accueil": [
      ["Presse-papiers", ["big", "paste", "Coller", "paste"], [[["btn", "cut", "Couper", "cut"]], [["btn", "copy", "Copier", "copy"]], [["btn", "brushfmt", "Reproduire", "fmtpaint"]]]],
      ["Police", [[["sel", "ff", FONTS, 110, "Police"], ["sel", "fs", SIZES.map(String), 50, "Taille"]], [["let", "<b>G</b>", "b", "Gras"], ["let", "<i>I</i>", "i", "Italique"], ["let", "<u>S</u>", "u", "Souligné"], ["btn", "border", null, "bd", "Bordures"], ["color", "fill", "bg", "#ffff00", "Couleur de remplissage"], ["color", "fcolor", "fg", "#c00000", "Couleur de police"]]]],
      ["Alignement", [[["btn", "alignL", null, "al-left", "Aligner à gauche"], ["btn", "alignC", null, "al-center", "Centrer"], ["btn", "alignR", null, "al-right", "Aligner à droite"]], [["btn", "wrap", "Renvoyer à la ligne", "wr"]], [["btn", "merge", "Fusionner et centrer", "merge"]]]],
      ["Nombre", [[["sel", "fmt", [["gen", "Standard"], ["num", "Nombre"], ["cur", "Monétaire"], ["acc", "Comptabilité"], ["pct", "Pourcentage"], ["date", "Date courte"], ["time", "Heure"], ["sci", "Scientifique"], ["txt", "Texte"]], 110, "Format de nombre"]], [["btn", "plus", ",0", "decp", "Ajouter une décimale"], ["btn", "minus", ",00", "decm", "Réduire les décimales"], ["let", "%", "pctq", "Style de pourcentage"]]]],
      ["Styles", ["big", "palette", "Mise en forme conditionnelle", "cf"], ["gal", "cstyle", [["table", "Tableau", "background:#d9e1f2", "Mettre sous forme"], ["bon", "Bon", "background:#c6efce;color:#006100"], ["neutre", "Neutre", "background:#ffeb9c;color:#9c5700"], ["mauvais", "Mauvais", "background:#ffc7ce;color:#9c0006"], ["titre", "<b>Titre</b>", "font-size:14px"], ["total", "<b>Total</b>", "border-top:2px solid #4472c4"]]]],
      ["Cellules", [[["btn", "rowins", "Insérer ligne", "insrow"]], [["btn", "colins", "Insérer colonne", "inscol"]], [["btn", "rowdel", "Supprimer ligne", "delrow"]]]],
      ["Édition", [[["btn", "sum", "Somme auto", "autosum"]], [["btn", "sortaz", "Trier", "sortaz"]], [["btn", "x", "Effacer", "clear"]]]]
    ],
    "Insertion": [
      ["Tableaux", ["big", "table", "Tableau", "cstyle-table"]],
      ["Graphiques", ["big", "chart", "Histogramme", "chart-bar"], ["big", "anim", "Courbes", "chart-line"], ["big", "circle", "Secteurs", "chart-pie"]],
      ["Texte", ["big", "comment", "Commentaire", "comment"], ["big", "clock", "Date", "date"]]
    ],
    "Mise en page": [
      ["Mise en page", ["big", "orient", "Orientation", "orient"], ["big", "margins", "Marges", "margins"], ["big", "printer", "Zone d'impression", "printarea"]],
      ["Options de la feuille", [[["btn", "gridl", "Quadrillage", "grid"]], [["btn", "header", "En-têtes", "heads"]]]]
    ],
    "Formules": [
      ["Bibliothèque de fonctions", ["big", "fx", "Insérer une fonction", "fx"], ["big", "sum", "Somme automatique", "autosum"], [[["btn", "sum", "Moyenne", "f-MOYENNE"]], [["btn", "sum", "Nb", "f-NB"]], [["btn", "sum", "Max", "f-MAX"]]], [[["btn", "sum", "Min", "f-MIN"]], [["btn", "sum", "Si", "f-SI"]], [["btn", "sum", "NB.SI", "f-NB.SI"]]]],
      ["Calcul", ["big", "restart", "Calculer maintenant", "recalc"], ["big", "eye", "Afficher les formules", "showf"]]
    ],
    "Données": [
      ["Trier et filtrer", ["big", "sortaz", "Trier A → Z", "sortaz"], ["big", "sortza", "Trier Z → A", "sortza"], ["big", "filter", "Filtrer", "filter"], ["big", "palette", "Mise en forme conditionnelle", "cf"]],
      ["Outils de données", ["big", "x", "Supprimer les doublons", "dedup"], ["big", "columns", "Convertir", "split"]]
    ],
    "Révision": [
      ["Vérification", ["big", "spell", "Orthographe", "spellx"], ["big", "count", "Statistiques", "stats"]],
      ["Protéger", ["big", "lock", "Protéger la feuille", "protect"]]
    ],
    "Affichage": [
      ["Afficher", [[["btn", "gridl", "Quadrillage", "grid"]], [["btn", "fx", "Barre de formule", "fbar"]]]],
      ["Zoom", ["big", "zoomin", "Zoom +", "zoomin"], ["big", "zoomout", "Zoom -", "zoomout"], ["big", "search", "100 %", "zoom100"]],
      ["Fenêtre", ["big", "freeze", "Figer la ligne 1", "freeze"], ["big", "expand", "Plein écran", "full"]]
    ]
  };
  const pvGrid = (head) => `<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:1px;width:100%;background:#ddd">${Array.from({ length: 20 }, (_, i) => `<span style="height:12px;background:${i < 4 && head ? "#107c41" : "#fff"}"></span>`).join("")}</div>`;
  const templates = [
    { l: "Nouveau classeur", pv: pvGrid(false), make: () => "" },
    { l: "Budget mensuel", pv: pvGrid(true), make: () => node(HOME + "/Documents/Budget.ltab")?.content || "" },
    { l: "Liste de tâches", pv: pvGrid(true), make: () => JSON.stringify({ sheets: [{ name: "Tâches", cw: { 0: 220, 2: 110 }, cells: { A1: { v: "Tâche", s: { b: 1, bg: "#107c41", fg: "#ffffff" } }, B1: { v: "Priorité", s: { b: 1, bg: "#107c41", fg: "#ffffff" } }, C1: { v: "Échéance", s: { b: 1, bg: "#107c41", fg: "#ffffff" } }, D1: { v: "Fait", s: { b: 1, bg: "#107c41", fg: "#ffffff" } }, A2: { v: "Installer Lucien OS" }, B2: { v: "Haute" }, D2: { v: "Oui" }, A3: { v: "Essayer Lucien Office" }, B3: { v: "Moyenne" }, D3: { v: "Non" }, A5: { v: "Terminées", s: { b: 1 } }, D5: { v: '=NB.SI(D2:D3;"Oui")' } } }] }) },
    { l: "Facture", pv: pvGrid(true), make: () => JSON.stringify({ sheets: [{ name: "Facture", cw: { 0: 200 }, cells: { A1: { v: "FACTURE", s: { b: 1, fs: 18, fg: "#107c41" } }, A3: { v: "Article", s: { b: 1, bg: "#e2efda" } }, B3: { v: "Qté", s: { b: 1, bg: "#e2efda" } }, C3: { v: "Prix", s: { b: 1, bg: "#e2efda" } }, D3: { v: "Montant", s: { b: 1, bg: "#e2efda" } }, A4: { v: "Raspberry Pi 5" }, B4: { v: "2" }, C4: { v: "89", s: { fmt: "cur" } }, D4: { v: "=B4*C4", s: { fmt: "cur" } }, A5: { v: "Carte microSD 128 Go" }, B5: { v: "2" }, C5: { v: "15", s: { fmt: "cur" } }, D5: { v: "=B5*C5", s: { fmt: "cur" } }, C7: { v: "Total HT", s: { b: 1 } }, D7: { v: "=SOMME(D4:D5)", s: { b: 1, fmt: "cur" } }, C8: { v: "TVA 20 %" }, D8: { v: "=D7*20%", s: { fmt: "cur" } }, C9: { v: "Total TTC", s: { b: 1 } }, D9: { v: "=D7+D8", s: { b: 1, fmt: "cur", bg: "#c6efce" } } } }] }) }
  ];
  const api = OfficeShell(body, w, {
    id: "tableur", kind: "tableur", color: "#107c41", ext: "ltab", exts: ["ltab", "xlsx", "csv"], untitled: "Classeur1", first: "Accueil", tabs, templates,
    exportLabel: "Fichier .csv (s'ouvre dans Excel, LibreOffice…)",
    onCmd, getContent: () => JSON.stringify(book), load,
    status: () => {
      const vals = selKeys().map(k => val(k)).filter(v => typeof v === "number");
      const sum = vals.reduce((a, b) => a + b, 0), f = (x) => x.toLocaleString(locale(), { maximumFractionDigits: 4 });
      return `<span>Prêt</span><span class="sp"></span>${vals.length > 1 ? `<span>Moyenne : ${f(sum / vals.length)}</span><span>Nb : ${vals.length}</span><span>Somme : ${f(sum)}</span>` : ""}<button data-z="-">${svg("minus", 12)}</button><input type="range" min="50" max="200" value="${zoom}"><button data-z="+">${svg("plus", 12)}</button><span>${zoom} %</span>`;
    },
    afterStatus: (st) => { $("input", st).oninput = (e) => setZoom(+e.target.value); $$("[data-z]", st).forEach(b => b.onclick = () => setZoom(zoom + (b.dataset.z === "+" ? 10 : -10))); },
    sync: syncRibbon,
    printArgs: () => ["Classeur", tableHTML(), "table{border-collapse:collapse;font:11pt Calibri,Arial} td{border:1px solid #ccc;padding:2px 6px}"],
    exportFile: () => [api.doc.name.replace(/\.[^.]+$/, "") + ".csv", "text/csv", toCSV()]
  });
  api.content.style.flexDirection = "column";
  api.content.innerHTML = `<div class="xfbar"><input class="nbox" aria-label="Zone Nom"><span class="fx">fx</span><input class="fin" aria-label="Barre de formule"></div>
    <div class="xwrap" tabindex="0"><table class="xgrid"><colgroup></colgroup><thead></thead><tbody></tbody></table><div class="xact"></div></div><div class="xsheets"></div>`;
  const wrap = $(".xwrap", api.content), grid = $(".xgrid", wrap), tbody = $("tbody", grid), boxAct = $(".xact", wrap), nbox = $(".nbox", api.content), fin = $(".fin", api.content);
  const tds = [];
  const fillH = h(`<div class="xfill" title="Faire glisser pour recopier ou créer une série"></div>`), fillBox = h(`<div class="xfillbox hidden"></div>`);
  wrap.append(fillH, fillBox);
  const LISTS = [["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"], ["lun", "mar", "mer", "jeu", "ven", "sam", "dim"], ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"], ["janv", "févr", "mars", "avr", "mai", "juin", "juil", "août", "sept", "oct", "nov", "déc"], ["T1", "T2", "T3", "T4"]];
  function seriesNext(src, k) {
    const raw = src.map(c => c?.v ?? ""), last = raw[raw.length - 1];
    if (String(last)[0] === "=") return null;
    const nums2 = raw.map(x => (/^-?\d+([.,]\d+)?$/.test(String(x).trim()) ? parseFloat(String(x).replace(",", ".")) : NaN));
    if (nums2.every(Number.isFinite) && nums2.length >= 2) { const step = nums2[nums2.length - 1] - nums2[nums2.length - 2]; return String(+(nums2[nums2.length - 1] + step * k).toPrecision(12)).replace(".", ","); }
    for (const L of LISTS) { const i = L.findIndex(x => x.toLowerCase() === String(last).toLowerCase()); if (i >= 0) { const w2 = L[(i + k) % L.length]; return /^[A-ZÉ]/.test(last) ? w2[0].toUpperCase() + w2.slice(1) : w2; } }
    const m = /^(.*?)(\d+)$/.exec(String(last)); if (m && !nums2.every(Number.isFinite)) return m[1] + (+m[2] + k);
    return undefined;
  }
  function doFill(dir, n) {
    if (n <= 0) return; snap();
    const [r0, c0, r1, c1] = sel(), vert = dir === "down" || dir === "up", fwd = dir === "down" || dir === "right";
    const lines = vert ? Array.from({ length: c1 - c0 + 1 }, (_, i) => c0 + i) : Array.from({ length: r1 - r0 + 1 }, (_, i) => r0 + i);
    for (const L of lines) {
      const srcPos = vert ? Array.from({ length: r1 - r0 + 1 }, (_, i) => [r0 + i, L]) : Array.from({ length: c1 - c0 + 1 }, (_, i) => [L, c0 + i]);
      const ordered = fwd ? srcPos : [...srcPos].reverse(), src = ordered.map(([r, c]) => cells()[cellKey(r, c)]);
      for (let k = 1; k <= n; k++) {
        const [er, ec] = ordered[ordered.length - 1], tr = vert ? er + (fwd ? k : -k) : er, tc = vert ? ec : ec + (fwd ? k : -k);
        if (tr < 0 || tr >= XROWS || tc < 0 || tc >= XCOLS) break;
        const from = ordered[(k - 1) % ordered.length], sc = cells()[cellKey(...from)];
        const allNum = src.length >= 2 && src.every(c => c && /^-?\d+([.,]\d+)?$/.test(String(c.v).trim()));
        const nx = allNum ? seriesNext(src, k) : sc ? seriesNext([sc], Math.floor((k - 1) / ordered.length) + 1) : undefined;
        const v = sc && String(sc.v)[0] === "=" ? shiftFormula(sc.v, tr - from[0], tc - from[1]) : nx !== undefined && nx !== null ? nx : sc ? sc.v : "";
        if (v === "" && !sc?.s) delete cells()[cellKey(tr, tc)]; else cells()[cellKey(tr, tc)] = { v, ...(sc && sc.s ? { s: clone(sc.s) } : {}) };
      }
    }
    if (dir === "down") act = [Math.min(XROWS - 1, r1 + n), c1]; if (dir === "right") act = [r1, Math.min(XCOLS - 1, c1 + n)];
    if (dir === "up") anchor = [Math.max(0, r0 - n), c0]; if (dir === "left") anchor = [r0, Math.max(0, c0 - n)];
    render();
  }
  fillH.addEventListener("pointerdown", (e) => {
    e.preventDefault(); e.stopPropagation(); if (editor) commit();
    const [r0, c0, r1, c1] = sel(); let dir = null, n = 0;
    const mv = (ev) => {
      const td = document.elementFromPoint(ev.clientX, ev.clientY)?.closest("td"); if (!td || !wrap.contains(td)) return;
      const r = +td.dataset.r, c = +td.dataset.c, dv = r > r1 ? r - r1 : r < r0 ? r - r0 : 0, dh = c > c1 ? c - c1 : c < c0 ? c - c0 : 0;
      if (Math.abs(dv) >= Math.abs(dh)) { dir = dv > 0 ? "down" : dv < 0 ? "up" : null; n = Math.abs(dv); } else { dir = dh > 0 ? "right" : "left"; n = Math.abs(dh); }
      const R0 = dir === "up" ? r0 - n : r0, R1 = dir === "down" ? r1 + n : r1, C0 = dir === "left" ? c0 - n : c0, C1 = dir === "right" ? c1 + n : c1;
      const a = tds[Math.max(0, R0)][Math.max(0, C0)], b = tds[Math.min(XROWS - 1, R1)][Math.min(XCOLS - 1, C1)];
      fillBox.classList.remove("hidden"); Object.assign(fillBox.style, { left: a.offsetLeft + "px", top: a.offsetTop + "px", width: b.offsetLeft + b.offsetWidth - a.offsetLeft + "px", height: b.offsetTop + b.offsetHeight - a.offsetTop + "px", zoom: zoom / 100 });
    };
    const up = () => { removeEventListener("pointermove", mv); removeEventListener("pointerup", up); fillBox.classList.add("hidden"); if (dir) doFill(dir, n); };
    addEventListener("pointermove", mv); addEventListener("pointerup", up);
  });
  const num = (x) => { const v = lit(x ?? ""); return typeof v === "number" ? v : NaN; };
  const hex = (c) => [1, 3, 5].map(i => parseInt(c.slice(i, i + 2), 16));
  const mix = (a, b, p) => { const A = hex(a), B = hex(b); return "#" + A.map((x, i) => Math.round(x + (B[i] - x) * p).toString(16).padStart(2, "0")).join(""); };
  const shade = (c) => { const [r, g, b2] = hex(c); return (r * .299 + g * .587 + b2 * .114) > 150 ? "#3a2a00" : "#ffffff"; };
  $("thead", grid).innerHTML = `<tr><th class="rh corner"></th>${Array.from({ length: XCOLS }, (_, c) => `<th data-c="${c}">${colName(c)}<span class="rzc"></span></th>`).join("")}</tr>`;
  for (let r = 0; r < XROWS; r++) {
    const tr = document.createElement("tr"); tr.innerHTML = `<th class="rh">${r + 1}</th>`; tds[r] = [];
    for (let c = 0; c < XCOLS; c++) { const td = document.createElement("td"); td.dataset.r = r; td.dataset.c = c; tr.append(td); tds[r][c] = td; }
    tbody.append(tr);
  }

  /* ---------- calcul ---------- */
  function lit(s) { s = String(s).trim(); if (/^-?\d+([.,]\d+)?%$/.test(s)) return parseFloat(s.replace(",", ".")) / 100; if (/^-?\d+([.,]\d+)?$/.test(s)) return parseFloat(s.replace(",", ".")); return s; }
  function val(k, stack = new Set()) {
    if (k in memo) return memo[k];
    const c = cells()[k]; let v;
    if (!c || c.v === "" || c.v == null) v = "";
    else if (String(c.v)[0] !== "=") v = lit(c.v);
    else {
      if (stack.has(k)) return "#CIRC!";
      stack.add(k);
      try {
        const fn = compileFormula(String(c.v).slice(1));
        v = fn((x) => { const y = val(x, stack); if (typeof y === "string" && y[0] === "#") throw y; return y === "" ? 0 : y; }, (a, b) => rangeRows(a, b).map(row => row.map(x => val(x, stack))), XFN);
        if (typeof v === "number" && !isFinite(v)) v = "#DIV/0!";
        if (typeof v === "boolean") v = v ? "VRAI" : "FAUX";
        if (Array.isArray(v)) v = "#VALEUR!";
      } catch (e) { v = typeof e === "string" && e[0] === "#" ? e : "#VALEUR!"; }
      stack.delete(k);
    }
    return (memo[k] = v);
  }
  function display(v, s = {}) {
    if (typeof v !== "number") return String(v);
    const d = s.dec, loc = locale(), cur = "EUR";
    switch (s.fmt) {
      case "num": return v.toLocaleString(loc, { minimumFractionDigits: d ?? 2, maximumFractionDigits: d ?? 2 });
      case "cur": case "acc": return v.toLocaleString(loc, { style: "currency", currency: cur, minimumFractionDigits: d ?? 2, maximumFractionDigits: d ?? 2 });
      case "pct": return (v * 100).toLocaleString(loc, { minimumFractionDigits: d ?? 0, maximumFractionDigits: d ?? 0 }) + " %";
      case "date": return new Date(new Date(1899, 11, 30).getTime() + v * 864e5).toLocaleDateString(loc);
      case "time": return new Date(new Date(1899, 11, 30).getTime() + v * 864e5).toLocaleTimeString(loc, { hour: "2-digit", minute: "2-digit" });
      case "sci": return v.toExponential(d ?? 2).replace(".", ",");
      default: return d != null ? v.toLocaleString(loc, { minimumFractionDigits: d, maximumFractionDigits: d }) : v.toLocaleString(loc, { maximumFractionDigits: 10 });
    }
  }
  let showFormulas = false;
  function render() {
    memo = {};
    const cw = sh().cw;
    $("colgroup", grid).innerHTML = `<col style="width:42px">` + Array.from({ length: XCOLS }, (_, c) => `<col style="width:${cw[c] || 80}px">`).join("");
    const rules = (sh().cf || []).map(rule => {
      const [r0, c0, r1, c1] = rule.range, vs = [], cnt = {};
      for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) { const x = val(cellKey(r, c)); if (typeof x === "number") vs.push(x); if (x !== "") cnt[x] = (cnt[x] || 0) + 1; }
      const sorted = [...vs].sort((a, b) => b - a);
      return { ...rule, min: Math.min(...vs), max: Math.max(...vs), cnt, top: sorted[Math.min(sorted.length, +rule.a || 10) - 1] };
    });
    const cfStyle = (r, c, v) => {
      let st = "";
      for (const R of rules) {
        const [r0, c0, r1, c1] = R.range; if (r < r0 || r > r1 || c < c0 || c > c1) continue;
        const n = typeof v === "number", a = num(R.a), b = num(R.b), col = R.color || "#ffc7ce";
        const hit = R.type === "gt" ? n && v > a : R.type === "lt" ? n && v < a : R.type === "between" ? n && v >= a && v <= b : R.type === "eq" ? String(v) === String(R.a) || (n && v === a) : R.type === "contains" ? String(v).toLowerCase().includes(String(R.a).toLowerCase()) : R.type === "dup" ? v !== "" && R.cnt[v] > 1 : R.type === "top" ? n && v >= R.top : false;
        if (hit) st += `background:${col};color:${shade(col)};`;
        if (R.type === "bar" && n) { const p = R.max === R.min ? 100 : Math.max(0, (v - Math.min(0, R.min)) / (R.max - Math.min(0, R.min)) * 100); st += `background:linear-gradient(90deg,${col}cc 0 ${p}%,transparent ${p}%);`; }
        if (R.type === "scale" && n) { const p = R.max === R.min ? .5 : (v - R.min) / (R.max - R.min); st += `background:${p < .5 ? mix("#f8696b", "#ffeb84", p * 2) : mix("#ffeb84", "#63be7b", (p - .5) * 2)};`; }
      }
      return st;
    };
    for (let r = 0; r < XROWS; r++) for (let c = 0; c < XCOLS; c++) {
      const k = cellKey(r, c), cell = cells()[k], td = tds[r][c];
      if (!cell) { if (td.textContent || td.className || td.style.cssText) { td.textContent = ""; td.className = ""; td.style.cssText = ""; } continue; }
      const v = val(k), s = cell.s || {};
      td.textContent = showFormulas && String(cell.v)[0] === "=" ? cell.v : display(v, s);
      td.className = (typeof v === "number" && !s.al ? "num " : "") + (s.wr ? "wr " : "") + (s.bd ? "bd " : "") + (typeof v === "string" && v[0] === "#" ? "err" : "");
      td.style.cssText = `${s.b ? "font-weight:700;" : ""}${s.i ? "font-style:italic;" : ""}${s.u ? "text-decoration:underline;" : ""}${s.bg ? `background:${s.bg};` : ""}${s.fg ? `color:${s.fg};` : ""}${s.al ? `text-align:${s.al};` : ""}${s.fs ? `font-size:${s.fs}pt;` : ""}${s.ff ? `font-family:${s.ff};` : ""}${s.st || ""}${rules.length ? cfStyle(r, c, v) : ""}`;
    }
    const af = sh().af;
    for (let r = 1; r < XROWS; r++) tbody.rows[r].style.display = af && r > af.r && Object.entries(af.hide).some(([c, hs]) => hs.includes(String(val(cellKey(r, +c))))) ? "none" : "";
    $$(".xfb", grid).forEach(x => x.remove());
    if (af) for (let c = af.c0; c <= af.c1; c++) { const b = h(`<span class="xfb ${af.hide[c] && af.hide[c].length ? "on" : ""}" data-fc="${c}" title="Filtrer">${svg("down", 11)}</span>`); tds[af.r][c].append(b); }
    tbody.rows[0].classList.toggle("frz", freeze);
    wrap.classList.toggle("nogrid", !showGrid);
    $(".xsheets", api.content).innerHTML = book.sheets.map((s, i) => `<button class="${i === cur ? "sel" : ""}" data-i="${i}">${esc(s.name)}</button>`).join("") + `<button data-add title="Nouvelle feuille">${svg("plus", 13)}</button>`;
    $$(".xsheets [data-i]", api.content).forEach(b => {
      b.onclick = () => { cur = +b.dataset.i; act = anchor = [0, 0]; render(); };
      b.ondblclick = async () => { const r = await dialog(w, "Renommer la feuille", [{ k: "n", l: "Nom", v: book.sheets[+b.dataset.i].name }]); if (r && r.n) { snap(); book.sheets[+b.dataset.i].name = r.n; render(); } };
      b.oncontextmenu = (e) => ctxMenu(e, [["Renommer", () => b.ondblclick(), { ic: "pen" }], ["Supprimer", () => { if (book.sheets.length > 1) { snap(); book.sheets.splice(+b.dataset.i, 1); cur = 0; render(); } }, { ic: "trash", dis: book.sheets.length < 2 }]]);
    });
    $(".xsheets [data-add]", api.content).onclick = () => { snap(); book.sheets.push({ name: "Feuil" + (book.sheets.length + 1), cells: {}, cw: {} }); cur = book.sheets.length - 1; render(); };
    drawSel();
  }
  function drawSel() {
    const [r0, c0, r1, c1] = sel();
    $$(".xgrid td.in", wrap).forEach(td => td.classList.remove("in"));
    $$(".xgrid th.hs", wrap).forEach(th => th.classList.remove("hs"));
    if (r0 !== r1 || c0 !== c1) for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) tds[r][c].classList.add("in");
    for (let c = c0; c <= c1; c++) $("thead th", grid).parentNode.children[c + 1].classList.add("hs");
    for (let r = r0; r <= r1; r++) tbody.rows[r].cells[0].classList.add("hs");
    const a = tds[r0][c0], b = tds[r1][c1];
    Object.assign(boxAct.style, { left: a.offsetLeft - 1 + "px", top: a.offsetTop - 1 + "px", width: b.offsetLeft + b.offsetWidth - a.offsetLeft + 1 + "px", height: b.offsetTop + b.offsetHeight - a.offsetTop + 1 + "px" });
    Object.assign(fillH.style, { left: b.offsetLeft + b.offsetWidth - 5 + "px", top: b.offsetTop + b.offsetHeight - 5 + "px", zoom: zoom / 100 });
    const k = cellKey(act[0], act[1]);
    nbox.value = r0 !== r1 || c0 !== c1 ? `${cellKey(r0, c0)}:${cellKey(r1, c1)}` : k;
    if (document.activeElement !== fin) fin.value = cells()[k]?.v ?? "";
    syncRibbon(); api.status();
  }
  function syncRibbon() {
    const rib = $(".oribbon", api.root); if (!rib || !tds.length) return;
    const s = cells()[cellKey(act[0], act[1])]?.s || {};
    [["b", s.b], ["i", s.i], ["u", s.u], ["wr", s.wr], ["bd", s.bd], ["al-left", s.al === "left"], ["al-center", s.al === "center"], ["al-right", s.al === "right"], ["grid", showGrid], ["freeze", freeze], ["showf", showFormulas]].forEach(([c, on]) => $(`button[data-c="${c}"]`, rib)?.classList.toggle("on", !!on));
    const f = $('select[data-c="fmt"]', rib); if (f) f.value = s.fmt || "gen";
    const ff = $('select[data-c="ff"]', rib); if (ff) ff.value = s.ff || "Calibri";
    const fs = $('select[data-c="fs"]', rib); if (fs) fs.value = String(s.fs || 11);
  }
  const ensure = (k) => (cells()[k] ||= { v: "" });
  function snap() { undoS.push(JSON.stringify(book)); if (undoS.length > 60) undoS.shift(); redoS = []; api.dirty(); }
  function setCell(k, v) { snap(); const c = ensure(k); c.v = v; if (c.v === "" && !c.s) delete cells()[k]; render(); }
  function styleSel(fn) { snap(); selKeys().forEach(k => { const c = ensure(k); c.s = c.s || {}; fn(c.s, k); }); render(); }

  /* ---------- édition ---------- */
  let editor = null;
  function startEdit(initial) {
    const [r, c] = act, td = tds[r][c], k = cellKey(r, c);
    editing = k;
    editor = h(`<input class="xedit">`);
    Object.assign(editor.style, { left: td.offsetLeft + "px", top: td.offsetTop + "px", minWidth: td.offsetWidth + 2 + "px", height: td.offsetHeight + 2 + "px" });
    editor.value = initial ?? (cells()[k]?.v ?? "");
    wrap.append(editor); editor.focus();
    editor.oninput = () => { fin.value = editor.value; };
    editor.onkeydown = (e) => {
      if (e.key === "Enter") { e.preventDefault(); commit(); move(e.shiftKey ? -1 : 1, 0); }
      else if (e.key === "Tab") { e.preventDefault(); commit(); move(0, e.shiftKey ? -1 : 1); }
      else if (e.key === "Escape") { cancel(); }
      e.stopPropagation();
    };
    editor.onblur = () => setTimeout(() => { if (editor && document.activeElement !== editor && !refMode) commit(); }, 120);
  }
  let refMode = false;
  function commit() { if (!editing) return; const v = editor.value, k = editing; editor.remove(); editor = null; editing = null; setCell(k, v); wrap.focus(); }
  function cancel() { if (!editor) return; editor.remove(); editor = null; editing = null; wrap.focus(); drawSel(); }
  function move(dr, dc, extend) {
    act = [Math.max(0, Math.min(XROWS - 1, act[0] + dr)), Math.max(0, Math.min(XCOLS - 1, act[1] + dc))];
    if (!extend) anchor = [...act];
    drawSel(); tds[act[0]][act[1]].scrollIntoView({ block: "nearest", inline: "nearest" });
  }
  wrap.addEventListener("mousedown", (e) => {
    const fb = e.target.closest(".xfb"); if (fb) { e.preventDefault(); e.stopPropagation(); return filterMenu(+fb.dataset.fc); }
    const td = e.target.closest("td"); if (!td) return;
    const r = +td.dataset.r, c = +td.dataset.c;
    if (editor && /^=/.test(editor.value) && /[=+\-*/(;,:^&<>]$/.test(editor.value)) { e.preventDefault(); refMode = true; editor.value += cellKey(r, c); fin.value = editor.value; editor.focus(); setTimeout(() => refMode = false, 150); return; }
    if (editor) commit();
    e.preventDefault(); wrap.focus();
    if (e.shiftKey) act = [r, c]; else { act = [r, c]; anchor = [r, c]; }
    drawSel();
    const mv = (ev) => { const t = document.elementFromPoint(ev.clientX, ev.clientY)?.closest("td"); if (t && wrap.contains(t)) { act = [+t.dataset.r, +t.dataset.c]; drawSel(); } };
    const up = () => { removeEventListener("mousemove", mv); removeEventListener("mouseup", up); };
    addEventListener("mousemove", mv); addEventListener("mouseup", up);
  });
  wrap.addEventListener("dblclick", (e) => { if (e.target.closest("td")) startEdit(); });
  wrap.addEventListener("contextmenu", (e) => {
    if (!e.target.closest("td")) return;
    ctxMenu(e, [["Couper", () => onCmd("cut"), { ic: "cut" }], ["Copier", () => onCmd("copy"), { ic: "copy" }], ["Coller", () => onCmd("paste"), { ic: "paste" }], "-",
      ["Insérer une ligne", () => onCmd("insrow"), { ic: "rowins" }], ["Insérer une colonne", () => onCmd("inscol"), { ic: "colins" }], ["Supprimer la ligne", () => onCmd("delrow"), { ic: "rowdel" }], ["Supprimer la colonne", () => onCmd("delcol"), { ic: "rowdel" }], "-",
      ["Effacer le contenu", () => onCmd("clear"), { ic: "x" }], ["Trier", null, { ic: "sortaz", sub: [["Du plus petit au plus grand", () => onCmd("sortaz")], ["Du plus grand au plus petit", () => onCmd("sortza")]] }], "-",
      ["Insérer un commentaire", () => onCmd("comment"), { ic: "comment" }], ["Format de cellule…", () => onCmd("cellfmt"), { ic: "sliders" }]]);
  });
  wrap.addEventListener("keydown", (e) => {
    if (editor) return;
    const ctrl = e.ctrlKey || e.metaKey;
    const K = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] }[e.key];
    if (K) { e.preventDefault(); return move(K[0], K[1], e.shiftKey); }
    if (e.key === "Enter") { e.preventDefault(); return move(e.shiftKey ? -1 : 1, 0); }
    if (e.key === "Tab") { e.preventDefault(); return move(0, e.shiftKey ? -1 : 1); }
    if (e.key === "Delete" || e.key === "Backspace") { e.preventDefault(); return onCmd("clear"); }
    if (e.key === "F2") { e.preventDefault(); return startEdit(); }
    if (ctrl && e.key.toLowerCase() === "z") { e.preventDefault(); return onCmd("undo"); }
    if (ctrl && e.key.toLowerCase() === "y") { e.preventDefault(); return onCmd("redo"); }
    if (ctrl && e.key.toLowerCase() === "b") { e.preventDefault(); return onCmd("b"); }
    if (ctrl && e.key.toLowerCase() === "i") { e.preventDefault(); return onCmd("i"); }
    if (ctrl && e.key.toLowerCase() === "u") { e.preventDefault(); return onCmd("u"); }
    if (ctrl && e.key.toLowerCase() === "a") { e.preventDefault(); anchor = [0, 0]; act = [XROWS - 1, XCOLS - 1]; return drawSel(); }
    if (!ctrl && !e.altKey && e.key.length === 1) { e.preventDefault(); startEdit(e.key); }
  });
  wrap.addEventListener("copy", (e) => { e.preventDefault(); e.clipboardData.setData("text/plain", selTSV()); });
  wrap.addEventListener("paste", (e) => { e.preventDefault(); pasteTSV(e.clipboardData.getData("text/plain")); });
  fin.onfocus = () => { fin.value = cells()[cellKey(act[0], act[1])]?.v ?? ""; };
  fin.onkeydown = (e) => { if (e.key === "Enter") { setCell(cellKey(act[0], act[1]), fin.value); wrap.focus(); move(1, 0); } if (e.key === "Escape") { wrap.focus(); drawSel(); } };
  nbox.onkeydown = (e) => { if (e.key !== "Enter") return; const m = nbox.value.toUpperCase().split(":"); const a = parseKey(m[0]), b = parseKey(m[1] || m[0]); if (a && b) { anchor = a; act = b; drawSel(); wrap.focus(); } };
  $("thead", grid).addEventListener("mousedown", (e) => {
    const rz = e.target.closest(".rzc"), th = e.target.closest("th[data-c]"); if (!th) return;
    const c = +th.dataset.c;
    if (rz) { e.preventDefault(); const sx = e.clientX, sw0 = th.offsetWidth; const mv = (ev) => { sh().cw[c] = Math.max(24, sw0 + ev.clientX - sx); $("colgroup", grid).children[c + 1].style.width = sh().cw[c] + "px"; drawSel(); }; const up = () => { removeEventListener("mousemove", mv); removeEventListener("mouseup", up); api.dirty(); }; addEventListener("mousemove", mv); addEventListener("mouseup", up); return; }
    anchor = [0, c]; act = [XROWS - 1, c]; drawSel(); wrap.focus();
  });
  tbody.addEventListener("mousedown", (e) => { const th = e.target.closest("th.rh"); if (!th) return; const r = th.parentNode.rowIndex - 1; anchor = [r, 0]; act = [r, XCOLS - 1]; drawSel(); wrap.focus(); }, true);

  /* ---------- presse-papiers, tri, lignes ---------- */
  let clip = null;
  function selTSV() { const [r0, c0, r1, c1] = sel(); const rows = []; for (let r = r0; r <= r1; r++) { const row = []; for (let c = c0; c <= c1; c++) row.push(display(val(cellKey(r, c)), cells()[cellKey(r, c)]?.s)); rows.push(row.join("\t")); } return rows.join("\n"); }
  function pasteTSV(t) { if (!t) return; snap(); const [r0, c0] = sel(); t.replace(/\r/g, "").split("\n").forEach((line, i) => line.split("\t").forEach((v, j) => { if (r0 + i < XROWS && c0 + j < XCOLS) ensure(cellKey(r0 + i, c0 + j)).v = v; })); render(); }
  function toCSV() { let maxR = 0, maxC = 0; Object.keys(cells()).forEach(k => { const [r, c] = parseKey(k); maxR = Math.max(maxR, r); maxC = Math.max(maxC, c); }); const out = []; for (let r = 0; r <= maxR; r++) { const row = []; for (let c = 0; c <= maxC; c++) { const v = String(val(cellKey(r, c))); row.push(/[;"\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v); } out.push(row.join(";")); } return "﻿" + out.join("\r\n"); }
  function tableHTML() { let maxR = 0, maxC = 0; Object.keys(cells()).forEach(k => { const [r, c] = parseKey(k); maxR = Math.max(maxR, r); maxC = Math.max(maxC, c); }); let s = "<table>"; for (let r = 0; r <= maxR; r++) { s += "<tr>"; for (let c = 0; c <= maxC; c++) { const k = cellKey(r, c); s += `<td style="${tds[r][c].style.cssText}">${esc(display(val(k), cells()[k]?.s))}</td>`; } s += "</tr>"; } return s + "</table>"; }
  function shift(fn) { const nc = {}; Object.entries(cells()).forEach(([k, v]) => { const p = fn(...parseKey(k)); if (p) nc[cellKey(...p)] = v; }); sh().cells = nc; }
  function sortSel(desc) {
    let [r0, c0, r1, c1] = sel();
    if (r0 === r1) { r1 = r0; while (r1 + 1 < XROWS && cells()[cellKey(r1 + 1, c0)]) r1++; if (cells()[cellKey(r0, c0)]?.s?.b) r0++; }
    snap();
    const rows = []; for (let r = r0; r <= r1; r++) { const row = []; for (let c = c0; c <= c1; c++) row.push(cells()[cellKey(r, c)]); rows.push(row); }
    memo = {}; const key = (row) => { const v = row[0] ? lit(row[0].v) : ""; return v; };
    rows.sort((a, b) => { const x = key(a), y = key(b); const r = typeof x === "number" && typeof y === "number" ? x - y : String(x).localeCompare(String(y), locale(), { numeric: true }); return desc ? -r : r; });
    rows.forEach((row, i) => row.forEach((cell, j) => { const k = cellKey(r0 + i, c0 + j); if (cell) cells()[k] = cell; else delete cells()[k]; }));
    render();
  }
  function chart(type) {
    const [r0, c0, r1, c1] = sel();
    const labels = [], data = [];
    for (let r = r0; r <= r1; r++) { const a = val(cellKey(r, c0)), b = c1 > c0 ? val(cellKey(r, c0 + 1)) : a; if (typeof b === "number") { labels.push(c1 > c0 ? String(a) : String(r + 1)); data.push(b); } }
    if (!data.length) return notify("tableur", "Graphique", "Sélectionne une colonne d'étiquettes et une colonne de nombres.");
    const W = 400, H = 210, max = Math.max(...data, 0) || 1, cols = ["#4472c4", "#ed7d31", "#a5a5a5", "#ffc000", "#5b9bd5", "#70ad47"];
    let g = "";
    if (type === "bar") { const bw = (W - 40) / data.length; g = data.map((v, i) => `<rect x="${30 + i * bw + 4}" y="${H - 20 - v / max * (H - 40)}" width="${bw - 8}" height="${v / max * (H - 40)}" fill="${cols[0]}"><animate attributeName="height" from="0" to="${v / max * (H - 40)}" dur=".5s"/><animate attributeName="y" from="${H - 20}" to="${H - 20 - v / max * (H - 40)}" dur=".5s"/></rect><text x="${30 + i * bw + bw / 2}" y="${H - 6}" font-size="10" text-anchor="middle">${esc(labels[i].slice(0, 10))}</text>`).join(""); }
    if (type === "line") { const st = (W - 40) / Math.max(1, data.length - 1); const pts = data.map((v, i) => `${30 + i * st},${H - 20 - v / max * (H - 40)}`).join(" "); g = `<polyline points="${pts}" fill="none" stroke="${cols[0]}" stroke-width="2.5" stroke-dasharray="2000" stroke-dashoffset="2000"><animate attributeName="stroke-dashoffset" to="0" dur="1s" fill="freeze"/></polyline>` + data.map((v, i) => `<circle cx="${30 + i * st}" cy="${H - 20 - v / max * (H - 40)}" r="3.5" fill="${cols[0]}"/><text x="${30 + i * st}" y="${H - 6}" font-size="10" text-anchor="middle">${esc(labels[i].slice(0, 8))}</text>`).join(""); }
    if (type === "pie") { const tot = data.reduce((a, b) => a + Math.abs(b), 0); let a0 = -Math.PI / 2; g = data.map((v, i) => { const a1 = a0 + Math.abs(v) / tot * Math.PI * 2, cx = 120, cy = H / 2, R = 85; const p = `M${cx},${cy} L${cx + R * Math.cos(a0)},${cy + R * Math.sin(a0)} A${R},${R} 0 ${a1 - a0 > Math.PI ? 1 : 0} 1 ${cx + R * Math.cos(a1)},${cy + R * Math.sin(a1)} Z`; a0 = a1; return `<path d="${p}" fill="${cols[i % 6]}" stroke="#fff"/><rect x="240" y="${20 + i * 18}" width="10" height="10" fill="${cols[i % 6]}"/><text x="256" y="${29 + i * 18}" font-size="11">${esc(labels[i].slice(0, 16))}</text>`; }).join(""); }
    const ch = h(`<div class="xchart" style="left:${tds[r0][Math.min(XCOLS - 1, c1 + 1)].offsetLeft + 20}px;top:${tds[r0][0].offsetTop}px"><div class="ch">Graphique<button>${svg("x", 12)}</button></div><svg width="${W + 10}" height="${H}" viewBox="0 0 ${W + 10} ${H}">${type !== "pie" ? `<line x1="28" y1="${H - 20}" x2="${W}" y2="${H - 20}" stroke="#bbb"/>` : ""}${g}</svg></div>`);
    wrap.append(ch);
    $("button", ch).onclick = () => ch.remove();
    $(".ch", ch).onmousedown = (e) => { const sx = e.clientX - ch.offsetLeft, sy = e.clientY - ch.offsetTop; const mv = (ev) => { ch.style.left = ev.clientX - sx + "px"; ch.style.top = ev.clientY - sy + "px"; }; const up = () => { removeEventListener("mousemove", mv); removeEventListener("mouseup", up); }; addEventListener("mousemove", mv); addEventListener("mouseup", up); };
  }
  function filterMenu(c) {
    const af = sh().af, values = [...new Set(Array.from({ length: XROWS - af.r - 1 }, (_, i) => String(val(cellKey(af.r + 1 + i, c)))))].filter(v => v !== "").sort((a, b) => a.localeCompare(b, locale(), { numeric: true }));
    const hidden = af.hide[c] || [];
    const bg = h(`<div class="sheetbg"><div class="sheet"><h3>Filtrer la colonne ${colName(c)}</h3><div class="crow" style="gap:6px;margin-bottom:8px"><button class="btn ghost" data-s="az">${svg("sortaz", 14)} Trier A → Z</button><button class="btn ghost" data-s="za">${svg("sortza", 14)} Trier Z → A</button></div>
      <input class="txt" placeholder="Rechercher" style="width:100%;margin-bottom:6px"><label style="display:flex;gap:6px;color:var(--text)"><input type="checkbox" data-all ${hidden.length ? "" : "checked"}> (Sélectionner tout)</label><div style="max-height:220px;overflow:auto">${values.map(v => `<label style="display:flex;gap:6px;color:var(--text);margin:2px 0" data-lv="${esc(v.toLowerCase())}"><input type="checkbox" value="${esc(v)}" ${hidden.includes(v) ? "" : "checked"}> ${esc(v)}</label>`).join("")}</div>
      <div class="acts"><button class="btn ghost" data-x>Annuler</button><button class="btn" data-ok>OK</button></div></div></div>`);
    w.append(bg);
    const boxes = () => $$('input[type=checkbox]:not([data-all])', bg);
    $("[data-all]", bg).onchange = (e) => boxes().forEach(b => b.checked = e.target.checked);
    $("input.txt", bg).oninput = (e) => $$("[data-lv]", bg).forEach(l => l.style.display = l.dataset.lv.includes(e.target.value.toLowerCase()) ? "" : "none");
    $("[data-x]", bg).onclick = () => bg.remove();
    $("[data-ok]", bg).onclick = () => { af.hide[c] = boxes().filter(b => !b.checked).map(b => b.value); bg.remove(); api.dirty(); render(); };
    $$("[data-s]", bg).forEach(b => b.onclick = () => { bg.remove(); anchor = [af.r + 1, af.c0]; act = [XROWS - 1, af.c1]; const save2 = [anchor, act]; let last = af.r + 1; for (let r = af.r + 1; r < XROWS; r++) for (let cc = af.c0; cc <= af.c1; cc++) if (cells()[cellKey(r, cc)]) last = r; act = [last, af.c1]; const keyCol = c; const [ra, , rb] = sel(); snap(); const rows = []; for (let r = ra; r <= rb; r++) rows.push(Array.from({ length: af.c1 - af.c0 + 1 }, (_, j) => cells()[cellKey(r, af.c0 + j)])); memo = {}; rows.sort((x, y) => { const p = x[keyCol - af.c0] ? lit(x[keyCol - af.c0].v) : "", q = y[keyCol - af.c0] ? lit(y[keyCol - af.c0].v) : ""; const res = typeof p === "number" && typeof q === "number" ? p - q : String(p).localeCompare(String(q), locale(), { numeric: true }); return b.dataset.s === "za" ? -res : res; }); rows.forEach((row, i) => row.forEach((cell, j) => { const k = cellKey(ra + i, af.c0 + j); if (cell) cells()[k] = cell; else delete cells()[k]; })); render(); });
  }
  async function condFormat() {
    const types = { "Supérieur à…": "gt", "Inférieur à…": "lt", "Entre…": "between", "Égal à…": "eq", "Texte qui contient…": "contains", "Valeurs en double": "dup", "10 valeurs les plus élevées": "top", "Barres de données": "bar", "Nuances de couleurs (rouge → vert)": "scale", "Effacer les règles de la feuille": "clear" };
    const colors = { "Rouge clair": "#ffc7ce", "Jaune": "#ffeb9c", "Vert": "#c6efce", "Bleu": "#9bc2e6", "Orange": "#f8cbad", "Violet": "#d9c3e9" };
    const r = await dialog(w, "Mise en forme conditionnelle", [{ k: "t", l: "Règle", type: "select", o: Object.keys(types) }, { k: "a", l: "Valeur (ou nombre de valeurs pour « les plus élevées »)", v: "10" }, { k: "b", l: "Et (pour « Entre »)", v: "" }, { k: "c", l: "Couleur", type: "select", o: Object.keys(colors) }], "Appliquer");
    if (!r) return; snap();
    if (types[r.t] === "clear") { sh().cf = []; return render(); }
    (sh().cf ||= []).push({ range: sel(), type: types[r.t], a: r.a, b: r.b, color: colors[r.c] });
    render(); notify("tableur", "Mise en forme conditionnelle", r.t.replace("…", "") + " appliquée à " + nbox.value);
  }
  function insertFn(name) { const [r0, c0, r1, c1] = sel(); if (r0 !== r1 || c0 !== c1) { const k = cellKey(Math.min(XROWS - 1, r1 + 1), c0); act = anchor = parseKey(k); setCell(k, `=${name}(${cellKey(r0, c0)}:${cellKey(r1, c1)})`); drawSel(); } else startEdit(`=${name}(`); }
  function autoSum() {
    const [r0, c0, r1, c1] = sel();
    if (r0 !== r1 || c0 !== c1) return insertFn("SOMME");
    let r = r0 - 1; while (r >= 0 && typeof val(cellKey(r, c0)) === "number") r--;
    if (r < r0 - 1) return setCell(cellKey(r0, c0), `=SOMME(${cellKey(r + 1, c0)}:${cellKey(r0 - 1, c0)})`);
    let c = c0 - 1; while (c >= 0 && typeof val(cellKey(r0, c)) === "number") c--;
    if (c < c0 - 1) return setCell(cellKey(r0, c0), `=SOMME(${cellKey(r0, c + 1)}:${cellKey(r0, c0 - 1)})`);
    startEdit("=SOMME(");
  }
  function setZoom(z) { zoom = Math.max(50, Math.min(200, z)); grid.style.zoom = zoom / 100; boxAct.style.zoom = zoom / 100; api.status(); }
  function load(c) { try { book = c ? JSON.parse(c) : blank(); } catch { book = blank(); if (c) c.split(/\r?\n/).forEach((l, r) => l.split(/[;,\t]/).forEach((v, cc) => { if (r < XROWS && cc < XCOLS && v) book.sheets[0].cells[cellKey(r, cc)] = { v }; })); } cur = 0; act = anchor = [0, 0]; undoS = []; redoS = []; render(); }

  async function onCmd(c, v) {
    const toggle = (p) => { const on = !(cells()[cellKey(act[0], act[1])]?.s || {})[p]; styleSel(s => s[p] = on ? 1 : 0); };
    if (["b", "i", "u", "wr", "bd"].includes(c)) return toggle(c);
    if (c.startsWith("al-")) return styleSel(s => s.al = c.slice(3));
    if (c.startsWith("f-")) return insertFn(c.slice(2));
    if (c.startsWith("chart-")) return chart(c.slice(6));
    switch (c) {
      case "undo": if (undoS.length) { redoS.push(JSON.stringify(book)); book = JSON.parse(undoS.pop()); render(); api.dirty(); } return;
      case "redo": if (redoS.length) { undoS.push(JSON.stringify(book)); book = JSON.parse(redoS.pop()); render(); api.dirty(); } return;
      case "copy": clip = { tsv: selTSV(), cells: selKeys().map(k => clone(cells()[k] || null)), size: [sel()[2] - sel()[0] + 1, sel()[3] - sel()[1] + 1] }; try { await navigator.clipboard.writeText(clip.tsv); } catch {} notify("tableur", "Copié", "Sélection copiée dans le presse-papiers."); return;
      case "cut": await onCmd("copy"); return onCmd("clear");
      case "paste": { if (clip) { snap(); const [r0, c0] = sel(), [hh, ww] = clip.size; clip.cells.forEach((cell, i) => { const k = cellKey(r0 + Math.floor(i / ww), c0 + i % ww); if (parseKey(k)[0] < XROWS) { if (cell) cells()[k] = clone(cell); else delete cells()[k]; } }); return render(); } try { pasteTSV(await navigator.clipboard.readText()); } catch {} return; }
      case "fmtpaint": { const s = clone(cells()[cellKey(act[0], act[1])]?.s || {}); notify("tableur", "Reproduire la mise en forme", "Clique sur la cellule cible."); const once = () => { styleSel(x => Object.assign(x, s)); wrap.removeEventListener("mouseup", once); }; setTimeout(() => wrap.addEventListener("mouseup", once), 50); return; }
      case "ff": return styleSel(s => s.ff = v);
      case "fs": return styleSel(s => s.fs = +v);
      case "bg": return styleSel(s => s.bg = v);
      case "fg": return styleSel(s => s.fg = v);
      case "fmt": return styleSel(s => s.fmt = v);
      case "pctq": return styleSel(s => s.fmt = "pct");
      case "decp": return styleSel(s => s.dec = Math.min(10, (s.dec ?? (s.fmt === "pct" ? 0 : 2)) + 1));
      case "decm": return styleSel(s => s.dec = Math.max(0, (s.dec ?? (s.fmt === "pct" ? 0 : 2)) - 1));
      case "merge": { const ks = selKeys(); styleSel((s, k) => { s.al = "center"; if (k !== ks[0]) { s.st = "color:transparent"; } else s.b = 1; }); return; }
      case "cstyle": case "cstyle-table": {
        const st = c === "cstyle-table" ? "table" : v; const [r0, c0] = sel();
        return styleSel((s, k) => {
          const [r] = parseKey(k);
          if (st === "table") { if (r === r0) Object.assign(s, { b: 1, bg: "#4472c4", fg: "#ffffff" }); else s.bg = (r - r0) % 2 ? "#d9e1f2" : "#ffffff"; s.bd = 1; }
          if (st === "bon") Object.assign(s, { bg: "#c6efce", fg: "#006100" });
          if (st === "neutre") Object.assign(s, { bg: "#ffeb9c", fg: "#9c5700" });
          if (st === "mauvais") Object.assign(s, { bg: "#ffc7ce", fg: "#9c0006" });
          if (st === "titre") Object.assign(s, { b: 1, fs: 15, fg: "#44546a" });
          if (st === "total") Object.assign(s, { b: 1, st: "border-top:2px solid #4472c4;border-bottom:3px double #4472c4" });
        });
      }
      case "insrow": snap(); { const r0 = sel()[0]; shift((r, cc) => r >= r0 ? (r + 1 < XROWS ? [r + 1, cc] : null) : [r, cc]); } return render();
      case "delrow": snap(); { const [r0, , r1] = sel(), n = r1 - r0 + 1; shift((r, cc) => r < r0 ? [r, cc] : r > r1 ? [r - n, cc] : null); } return render();
      case "inscol": snap(); { const c0 = sel()[1]; shift((r, cc) => cc >= c0 ? (cc + 1 < XCOLS ? [r, cc + 1] : null) : [r, cc]); } return render();
      case "delcol": snap(); { const [, c0, , c1] = sel(), n = c1 - c0 + 1; shift((r, cc) => cc < c0 ? [r, cc] : cc > c1 ? [r, cc - n] : null); } return render();
      case "clear": snap(); selKeys().forEach(k => { if (cells()[k]) { cells()[k].v = ""; if (!cells()[k].s) delete cells()[k]; } }); return render();
      case "autosum": return autoSum();
      case "sortaz": return sortSel(false);
      case "sortza": return sortSel(true);
      case "cf": return condFormat();
      case "filter": { if (sh().af) { delete sh().af; return render(); } const [r0, c0, , c1] = sel(); let a = c0, b = c1; if (a === b) { while (a > 0 && cells()[cellKey(r0, a - 1)]) a--; while (b < XCOLS - 1 && cells()[cellKey(r0, b + 1)]) b++; } snap(); sh().af = { r: r0, c0: a, c1: b, hide: {} }; render(); return notify("tableur", "Filtres", "Clique sur les flèches de la ligne " + (r0 + 1) + " pour filtrer."); }
      case "filter-old": { const r = await dialog(w, "Filtrer", [{ k: "q", l: `Afficher les lignes dont la colonne ${colName(sel()[1])} contient (vide = tout afficher)` }], "Filtrer"); if (!r) return; for (let rr = 1; rr < XROWS; rr++) tbody.rows[rr].style.display = r.q && !String(val(cellKey(rr, sel()[1]))).toLowerCase().includes(r.q.toLowerCase()) ? "none" : ""; return drawSel(); }
      case "dedup": { snap(); const [r0, c0, r1, c1] = sel(); const seen = new Set(); let n = 0; for (let r = r0; r <= r1; r++) { const sig = Array.from({ length: c1 - c0 + 1 }, (_, j) => String(val(cellKey(r, c0 + j)))).join("\u0001"); if (seen.has(sig)) { for (let cc = c0; cc <= c1; cc++) delete cells()[cellKey(r, cc)]; n++; } else seen.add(sig); } render(); return notify("tableur", "Doublons", `${n} ligne(s) en double supprimée(s).`); }
      case "split": { snap(); const [r0, c0, r1] = sel(); for (let r = r0; r <= r1; r++) { const parts = String(cells()[cellKey(r, c0)]?.v ?? "").split(/[;,\t]/); if (parts.length > 1) parts.forEach((p, j) => { if (c0 + j < XCOLS) ensure(cellKey(r, c0 + j)).v = p.trim(); }); } return render(); }
      case "fx": {
        const bg = h(`<div class="sheetbg"><div class="sheet"><h3>Insérer une fonction</h3>${XFN_HELP.map(([n, d]) => `<div class="row" style="cursor:pointer" data-f="${n}"><div><b>${n}</b><small>${d}</small></div>${svg("fwd", 14)}</div>`).join("")}<div class="acts"><button class="btn ghost">Annuler</button></div></div></div>`);
        w.append(bg); $$("[data-f]", bg).forEach(r => r.onclick = () => { bg.remove(); insertFn(r.dataset.f); }); $(".acts button", bg).onclick = () => bg.remove(); return;
      }
      case "recalc": Object.keys(formulaCache).forEach(k => delete formulaCache[k]); return render();
      case "showf": showFormulas = !showFormulas; return render();
      case "comment": { const k = cellKey(act[0], act[1]); const r = await dialog(w, "Commentaire " + k, [{ k: "t", l: "Commentaire", v: tds[act[0]][act[1]].title }], "OK"); if (r) { styleSel(s => s.st = (s.st || "") + "box-shadow:inset -6px 6px 0 -4px #c00;"); tds[act[0]][act[1]].title = r.t; } return; }
      case "cellfmt": { const s = cells()[cellKey(act[0], act[1])]?.s || {}; const r = await dialog(w, "Format de cellule", [{ k: "f", l: "Catégorie", type: "select", o: ["Standard", "Nombre", "Monétaire", "Pourcentage", "Date courte", "Heure", "Scientifique", "Texte"], v: "Standard" }, { k: "d", l: "Nombre de décimales", type: "number", v: s.dec ?? 2 }], "OK"); if (!r) return; const map = { Standard: "gen", Nombre: "num", "Monétaire": "cur", Pourcentage: "pct", "Date courte": "date", Heure: "time", Scientifique: "sci", Texte: "txt" }; return styleSel(x => { x.fmt = map[r.f]; x.dec = +r.d; }); }
      case "date": return setCell(cellKey(act[0], act[1]), new Date().toLocaleDateString(locale()));
      case "grid": showGrid = !showGrid; return render();
      case "heads": $("thead", grid).style.display = $("thead", grid).style.display ? "" : "none"; return;
      case "fbar": $(".xfbar", api.content).classList.toggle("hidden"); return;
      case "freeze": freeze = !freeze; return render();
      case "orient": case "margins": case "printarea": return notify("tableur", "Mise en page", "Réglage appliqué à l'impression.");
      case "spellx": return notify("tableur", "Orthographe", "Aucune faute trouvée dans la feuille.");
      case "stats": return dialog(w, "Statistiques du classeur", [{ type: "info", html: `Feuilles : ${book.sheets.length}<br>Cellules remplies : ${Object.keys(cells()).length}<br>Formules : ${Object.values(cells()).filter(x => String(x.v)[0] === "=").length}` }], "");
      case "protect": return notify("tableur", "Protéger la feuille", "Feuille protégée (démo).");
      case "zoomin": return setZoom(zoom + 10);
      case "zoomout": return setZoom(zoom - 10);
      case "zoom100": return setZoom(100);
      case "full": return toggleMax(w);
      case "find": { const q = String(v || "").toLowerCase(); if (!q) return; const k = Object.keys(cells()).find(k2 => String(val(k2)).toLowerCase().includes(q)); if (k) { act = anchor = parseKey(k); drawSel(); tds[act[0]][act[1]].scrollIntoView({ block: "center" }); } return; }
    }
  }
  render();
  if (arg && arg.path) api.open(arg.path);
  setTimeout(() => wrap.focus(), 100);
}
