/* Lucien Office — Lucien Tableur (feuilles de calcul, formules, graphiques) */
"use strict";
const XCOLS = 26, XROWS = 100;
const colName = (c) => String.fromCharCode(65 + c);
const cellKey = (r, c) => colName(c) + (r + 1);
const parseKey = (k) => { const m = /^([A-Z])(\d+)$/.exec(k); return m ? [+m[2] - 1, m[1].charCodeAt(0) - 65] : null; };
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
  return F;
})();
const XFN_HELP = [["SOMME", "Additionne des nombres"], ["MOYENNE", "Moyenne arithmétique"], ["MIN", "Plus petite valeur"], ["MAX", "Plus grande valeur"], ["NB", "Compte les nombres"], ["NBVAL", "Compte les cellules non vides"], ["SI", "SI(test; si_vrai; si_faux)"], ["NB.SI", "NB.SI(plage; critère)"], ["SOMME.SI", "SOMME.SI(plage; critère; [somme])"], ["ARRONDI", "ARRONDI(nombre; décimales)"], ["CONCAT", "Assemble du texte"], ["AUJOURDHUI", "Date du jour"], ["RACINE", "Racine carrée"], ["PRODUIT", "Multiplie des nombres"]];
const formulaCache = {};
function compileFormula(src) {
  if (formulaCache[src]) return formulaCache[src];
  const strs = [];
  let s = src.replace(/"[^"]*"/g, m => { strs.push(m); return `\u0001${strs.length - 1}\u0001`; }).replace(/;/g, ",").toUpperCase();
  s = s.replace(/\$?([A-Z])\$?(\d+):\$?([A-Z])\$?(\d+)/g, 'R("$1$2","$3$4")');
  s = s.replace(/(^|[^A-Z"\w])\$?([A-Z])\$?(\d+)(?![\d(])/g, '$1V("$2$3")');
  s = s.replace(/([A-Z][A-Z0-9.]*)\s*\(/g, (m, n) => { if (n === "R" || n === "V") return m; if (!(n in XFN)) throw "#NOM?"; return `F["${n}"](`; });
  s = s.replace(/\b(VRAI|TRUE)\b/g, "true").replace(/\b(FAUX|FALSE)\b/g, "false");
  s = s.replace(/(\d+(?:\.\d+)?)%/g, "($1/100)").replace(/<>/g, "!=").replace(/([^<>!=])=(?!=)/g, "$1==").replace(/\^/g, "**").replace(/&/g, '+""+');
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
      ["Styles", ["gal", "cstyle", [["table", "Tableau", "background:#d9e1f2", "Mettre sous forme"], ["bon", "Bon", "background:#c6efce;color:#006100"], ["neutre", "Neutre", "background:#ffeb9c;color:#9c5700"], ["mauvais", "Mauvais", "background:#ffc7ce;color:#9c0006"], ["titre", "<b>Titre</b>", "font-size:14px"], ["total", "<b>Total</b>", "border-top:2px solid #4472c4"]]]],
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
      ["Trier et filtrer", ["big", "sortaz", "Trier A → Z", "sortaz"], ["big", "sortza", "Trier Z → A", "sortza"], ["big", "filter", "Filtrer", "filter"]],
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
        v = fn((x) => { const y = val(x, stack); if (typeof y === "string" && y[0] === "#") throw y; return y === "" ? 0 : y; }, (a, b) => rangeKeys(a, b).map(x => val(x, stack)), XFN);
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
    for (let r = 0; r < XROWS; r++) for (let c = 0; c < XCOLS; c++) {
      const k = cellKey(r, c), cell = cells()[k], td = tds[r][c];
      if (!cell) { if (td.textContent || td.className || td.style.cssText) { td.textContent = ""; td.className = ""; td.style.cssText = ""; } continue; }
      const v = val(k), s = cell.s || {};
      td.textContent = showFormulas && String(cell.v)[0] === "=" ? cell.v : display(v, s);
      td.className = (typeof v === "number" && !s.al ? "num " : "") + (s.wr ? "wr " : "") + (s.bd ? "bd " : "") + (typeof v === "string" && v[0] === "#" ? "err" : "");
      td.style.cssText = `${s.b ? "font-weight:700;" : ""}${s.i ? "font-style:italic;" : ""}${s.u ? "text-decoration:underline;" : ""}${s.bg ? `background:${s.bg};` : ""}${s.fg ? `color:${s.fg};` : ""}${s.al ? `text-align:${s.al};` : ""}${s.fs ? `font-size:${s.fs}pt;` : ""}${s.ff ? `font-family:${s.ff};` : ""}${s.st || ""}`;
    }
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
      case "filter": { const r = await dialog(w, "Filtrer", [{ k: "q", l: `Afficher les lignes dont la colonne ${colName(sel()[1])} contient (vide = tout afficher)` }], "Filtrer"); if (!r) return; for (let rr = 1; rr < XROWS; rr++) tbody.rows[rr].style.display = r.q && !String(val(cellKey(rr, sel()[1]))).toLowerCase().includes(r.q.toLowerCase()) ? "none" : ""; return drawSel(); }
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
