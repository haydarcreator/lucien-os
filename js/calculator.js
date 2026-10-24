/* Lucien Calculator — interface : standard, scientifique, programmeur, conversions, historique
   Les modes Graphiques, Équations et Statistiques sont dans calc-graph.js */
"use strict";
const CALC_MODES = [];
const calcHist = store.get("calc.hist", []);
const calcFmt = (x) => CalcEngine.format(x, locale());

function CalculatorApp(body, w, arg) {
  const C = { mode: store.get("calc.mode", "standard"), deg: store.get("calc.deg", true), mem: 0, showHist: innerWidth > 900, w };
  body.innerHTML = `<div class="calc"><div class="cside"></div><div class="cmain"><div class="cpane"></div><div class="chist"><h6>Historique <button data-clear>Effacer</button></h6><div class="hl"></div></div></div></div>`;
  const side = $(".cside", body), pane = $(".cpane", body), hist = $(".chist", body);
  C.pane = pane;
  C.pushHist = (expr, res) => { calcHist.unshift({ expr, res, t: Date.now() }); calcHist.length = Math.min(calcHist.length, 200); store.set("calc.hist", calcHist); drawHist(); };
  function drawHist() {
    $(".hl", hist).innerHTML = calcHist.length ? calcHist.map((h, i) => `<div class="he" data-i="${i}"><small>${esc(h.expr)}</small><b>= ${esc(h.res)}</b></div>`).join("") : `<p class="muted" style="color:#8d867c;font-size:12px;padding:8px">Les calculs apparaîtront ici. Clique sur un résultat pour le réutiliser.</p>`;
    $$(".he", hist).forEach(e => e.onclick = () => C.recall && C.recall(calcHist[+e.dataset.i]));
  }
  $("[data-clear]", hist).onclick = () => { calcHist.length = 0; store.set("calc.hist", calcHist); drawHist(); };
  function drawSide() {
    const groups = [["Calculer", ["standard", "scientifique", "programmeur"]], ["Apprendre", ["graphiques", "equations", "statistiques", "geometrie"]], ["Outils", ["conversions"]]];
    side.innerHTML = groups.map(([g, ids]) => `<h6>${g}</h6>` + ids.map(id => { const m = CALC_MODES.find(x => x.id === id); return m ? `<div class="si ${C.mode === id ? "sel" : ""}" data-m="${id}">${svg(m.ic, 15)}<span class="lbl">${m.name}</span></div>` : ""; }).join("")).join("");
    $$(".si", side).forEach(s => s.onclick = () => setMode(s.dataset.m));
  }
  function setMode(id) {
    C.mode = id; store.set("calc.mode", id); drawSide();
    C._cleanup && C._cleanup(); C._cleanup = null; C.recall = null; C.onKey = null;
    pane.innerHTML = ""; pane.style.animation = "none"; void pane.offsetWidth; pane.style.animation = "";
    const m = CALC_MODES.find(x => x.id === id) || CALC_MODES[0];
    hist.style.display = m.hist && C.showHist ? "" : "none";
    m.render(C);
    const small = { standard: [340, 520], scientifique: [820, 520] }[id];
    if (!w.classList.contains("max") && small && innerWidth > 700) { w.classList.add("anim"); w.style.width = Math.min(innerWidth - 20, small[0] + (m.hist && C.showHist ? 220 : 0) + 176) + "px"; w.style.height = small[1] + "px"; setTimeout(() => w.classList.remove("anim"), 360); }
    else if (!w.classList.contains("max") && !small && innerWidth > 700 && w.offsetWidth < 900) { w.classList.add("anim"); w.style.width = Math.min(innerWidth - 20, 1000) + "px"; w.style.height = Math.min(innerHeight - 110, 640) + "px"; setTimeout(() => w.classList.remove("anim"), 360); }
  }
  body.tabIndex = 0;
  body.addEventListener("keydown", (e) => { if (C.onKey && !e.target.closest("input:not(.expr),select,textarea")) C.onKey(e); });
  w._onArg = (a) => { if (typeof a === "string" && CALC_MODES.some(m => m.id === a)) setMode(a); };
  w._cleanup = () => C._cleanup && C._cleanup();
  drawHist(); drawSide(); setMode(typeof arg === "string" ? arg : C.mode);
  setTimeout(() => body.focus(), 80);
}

/* ---------- clavier standard / scientifique ---------- */
function keypadMode(C, sci) {
  let expr = "", second = false, justDone = false, showFrac = false;
  const p = C.pane;
  p.innerHTML = `<div class="cdisp"><div class="bar">${sci ? `<button class="tool ${C.deg ? "on" : ""}" data-t="deg">${C.deg ? "Degrés" : "Radians"}</button>` : ""}<button class="tool" data-t="frac">a/b</button><button class="tool" data-t="hist">${svg("clock", 12)}</button></div>
    <input class="expr" spellcheck="false" autocomplete="off" aria-label="Expression" style="background:none;border:0;text-align:right;font:18px inherit;color:#a59c90;width:100%"><div class="res">0</div><div class="alt"></div></div><div class="ckeys"></div>`;
  const inp = $(".expr", p), res = $(".res", p), alt = $(".alt", p), keys = $(".ckeys", p);
  const STD = [["AC", "top", "clear"], ["⌫", "top", "back"], ["%", "top", "%"], ["÷", "op", "÷"], ["7"], ["8"], ["9"], ["×", "op", "×"], ["4"], ["5"], ["6"], ["−", "op", "−"], ["1"], ["2"], ["3"], ["+", "op", "+"], ["±", "", "neg"], ["0"], [",", "", ","], ["=", "op", "eq"]];
  const SCI = () => [
    ["(", "fn", "("], [")", "fn", ")"], ["mc", "fn", "mc"], ["m+", "fn", "m+"], ["m−", "fn", "m-"], ["mr", "fn", "mr"],
    ["2<sup>nd</sup>", "fn" + (second ? " on2" : ""), "2nd"], ["x<sup>2</sup>", "fn", "^2"], ["x<sup>3</sup>", "fn", "^3"], ["x<sup>y</sup>", "fn", "^"], [second ? "2<sup>x</sup>" : "e<sup>x</sup>", "fn", second ? "2^(" : "e^("], ["10<sup>x</sup>", "fn", "10^("],
    ["1/x", "fn", "inv"], ["√x", "fn", "√("], ["∛x", "fn", "∛("], ["<sup>y</sup>√x", "fn", "root("], [second ? "log<sub>2</sub>" : "ln", "fn", second ? "log2(" : "ln("], ["log<sub>10</sub>", "fn", "log("],
    ["x!", "fn", "!"], [second ? "sin<sup>−1</sup>" : "sin", "fn", second ? "asin(" : "sin("], [second ? "cos<sup>−1</sup>" : "cos", "fn", second ? "acos(" : "cos("], [second ? "tan<sup>−1</sup>" : "tan", "fn", second ? "atan(" : "tan("], ["e", "fn", "e"], ["EE", "fn", "×10^("],
    ["Ans", "fn", "ans"], [second ? "sinh<sup>−1</sup>" : "sinh", "fn", second ? "asinh(" : "sinh("], [second ? "cosh<sup>−1</sup>" : "cosh", "fn", second ? "acosh(" : "cosh("], [second ? "tanh<sup>−1</sup>" : "tanh", "fn", second ? "atanh(" : "tanh("], ["π", "fn", "π"], ["Alea", "fn", "alea()"]
  ];
  function drawKeys() {
    const list = sci ? [] : STD, sciK = sci ? SCI() : [];
    if (sci) { for (let r = 0; r < 5; r++) { list.push(...sciK.slice(r * 6, r * 6 + 6)); list.push(...STD.slice(r * 4, r * 4 + 4)); } }
    keys.style.gridTemplateColumns = `repeat(${sci ? 10 : 4},1fr)`;
    keys.innerHTML = list.map(([l, cls = "", v]) => `<button class="ckey ${cls}" data-v="${esc(v ?? l)}">${l}</button>`).join("");
    $$(".ckey", keys).forEach(k => { k.onmousedown = (e) => e.preventDefault(); k.onclick = () => press(k.dataset.v); });
  }
  const preview = () => {
    alt.innerHTML = ""; res.classList.remove("err");
    const src = expr.trim(); if (!src) { res.textContent = "0"; return null; }
    try {
      const v = CalcEngine.evaluate(src, { ans: C.ans ?? 0 }, C.deg);
      const fr = CalcEngine.fracHTML(v), ex = CalcEngine.exactForm(v);
      res.innerHTML = showFrac && fr ? fr.simple : calcFmt(v);
      res.classList.toggle("small", res.textContent.length > 12);
      const bits = []; if (fr) bits.push(`<span title="Fraction">= ${fr.simple}</span>`); if (fr && fr.mixed) bits.push(`<span title="Nombre mixte">= ${fr.mixed}</span>`); if (ex) bits.push(`<span title="Valeur exacte">= ${ex}</span>`);
      if (Number.isFinite(v) && v !== 0 && (Math.abs(v) >= 1e6 || Math.abs(v) < 1e-3)) bits.push(`<span title="Notation scientifique">${v.toExponential(4).replace("e", " × 10^")}</span>`);
      alt.innerHTML = bits.join(""); return v;
    } catch (e) { if (justDone) return null; res.textContent = calcFmt(C.ans ?? 0) === "0" && !src ? "0" : res.textContent; return null; }
  };
  const set = (v) => { expr = v; inp.value = v; preview(); };
  function insert(t) { const s = inp.selectionStart ?? expr.length, e = inp.selectionEnd ?? expr.length; const nv = expr.slice(0, s) + t + expr.slice(e); set(nv); requestAnimationFrame(() => inp.setSelectionRange(s + t.length, s + t.length)); }
  function press(v) {
    const ops = ["+", "−", "×", "÷", "^", "%", "!", "^2", "^3"];
    if (justDone && !ops.includes(v) && !["eq", "back", "neg", "2nd", "frac", "m+", "m-", "mr", "mc", "inv"].includes(v)) { set(""); }
    if (justDone && ops.includes(v)) set("Ans");
    justDone = false;
    switch (v) {
      case "clear": return set("");
      case "back": return set(expr.slice(0, -1));
      case "neg": return set(/^-\(.*\)$/.test(expr) ? expr.slice(2, -1) : expr ? `-(${expr})` : "-");
      case "inv": return set(expr ? `1/(${expr})` : "1/");
      case "2nd": second = !second; return drawKeys();
      case "ans": return insert("Ans");
      case "mc": C.mem = 0; return notify("calc", "Mémoire", "Mémoire effacée");
      case "m+": case "m-": { const r = preview(); if (r != null) { C.mem += v === "m+" ? r : -r; notify("calc", "Mémoire", "M = " + calcFmt(C.mem)); } return; }
      case "mr": return insert(String(C.mem).replace(".", ","));
      case "eq": {
        const r = preview(); if (r == null) { res.classList.add("err"); res.textContent = expr ? "Expression incomplète" : "0"; return; }
        C.ans = r; C.pushHist(expr, showFrac && CalcEngine.fracHTML(r) ? CalcEngine.fracHTML(r).text : calcFmt(r));
        res.animate([{ transform: "scale(1.04)" }, { transform: "none" }], { duration: 180 });
        justDone = true; inp.value = calcFmt(r); expr = String(r).replace(".", ",").replace(/e\+?/, "×10^"); alt.innerHTML = alt.innerHTML; return;
      }
      default: return insert(v.replace("ans", "Ans").replace("alea()", "alea()"));
    }
  }
  inp.oninput = () => { expr = inp.value; justDone = false; preview(); };
  inp.onkeydown = (e) => { if (e.key === "Enter" || e.key === "=") { e.preventDefault(); press("eq"); } if (e.key === "Escape") { e.preventDefault(); press("clear"); } };
  C.onKey = (e) => {
    if (e.target === inp) return;
    const map = { Enter: "eq", "=": "eq", Escape: "clear", Backspace: "back", "*": "×", "/": "÷", "-": "−", ".": ",", "^": "^" };
    const k = map[e.key] || (/^[0-9+%(),!]$/.test(e.key) ? e.key : null);
    if (!k) return; e.preventDefault(); press(k);
    const b = $$(".ckey", keys).find(x => x.dataset.v === k); if (b) { b.classList.add("press"); setTimeout(() => b.classList.remove("press"), 110); }
  };
  $$(".tool", p).forEach(b => b.onclick = () => {
    if (b.dataset.t === "deg") { C.deg = !C.deg; store.set("calc.deg", C.deg); b.textContent = C.deg ? "Degrés" : "Radians"; b.classList.toggle("on", C.deg); preview(); }
    if (b.dataset.t === "frac") { showFrac = !showFrac; b.classList.toggle("on", showFrac); preview(); }
    if (b.dataset.t === "hist") { C.showHist = !C.showHist; $(".chist", C.w).style.display = C.showHist ? "" : "none"; }
  });
  C.recall = (hh) => { set(hh.expr); };
  drawKeys(); set("");
}
CALC_MODES.push({ id: "standard", name: "Standard", ic: "grid", hist: true, render: (C) => keypadMode(C, false) });
CALC_MODES.push({ id: "scientifique", name: "Scientifique", ic: "fx", hist: true, render: (C) => keypadMode(C, true) });

/* ---------- programmeur (entiers 8 à 64 bits) ---------- */
CALC_MODES.push({ id: "programmeur", name: "Programmeur", ic: "code", hist: true, render(C) {
  let base = 10, bits = 64n, expr = "";
  const p = C.pane;
  p.innerHTML = `<div class="cdisp" style="min-height:90px"><div class="bar"><select class="cin" data-ws style="padding:2px 6px;font-size:12px"><option value="64">QWORD 64 bits</option><option value="32">DWORD 32 bits</option><option value="16">WORD 16 bits</option><option value="8">BYTE 8 bits</option></select></div><div class="expr"></div><div class="res">0</div></div>
    <div class="pbase"></div><div class="pbits"></div><div class="ckeys" style="grid-template-columns:repeat(6,1fr)"></div>`;
  const mask = () => (1n << bits) - 1n, signed = (v) => { v &= mask(); return v >> (bits - 1n) ? v - (1n << bits) : v; };
  const tokens = (s) => s.match(/<<|>>|[0-9A-Fa-f]+|[&|^~+\-*/%()]/g) || [];
  function calc(s) {
    const out = [], ops = [], prec = { "|": 1, "^": 2, "&": 3, "<<": 4, ">>": 4, "+": 5, "-": 5, "*": 6, "/": 6, "%": 6, "~": 7 };
    const apply = () => { const o = ops.pop(); if (o === "~") { out.push(~out.pop()); return; } const b = out.pop(), a = out.pop(); if (a === undefined || b === undefined) throw 0; out.push(o === "+" ? a + b : o === "-" ? a - b : o === "*" ? a * b : o === "/" ? (b ? a / b : (() => { throw 0; })()) : o === "%" ? a % b : o === "&" ? a & b : o === "|" ? a | b : o === "^" ? a ^ b : o === "<<" ? a << b : a >> b); };
    for (const t of tokens(s)) {
      if (/^[0-9A-Fa-f]+$/.test(t)) { out.push(BigInt((base === 16 ? "0x" : base === 8 ? "0o" : base === 2 ? "0b" : "") + t)); continue; }
      if (t === "(") ops.push(t); else if (t === ")") { while (ops.length && ops[ops.length - 1] !== "(") apply(); ops.pop(); }
      else { while (ops.length && ops[ops.length - 1] !== "(" && t !== "~" && prec[ops[ops.length - 1]] >= prec[t]) apply(); ops.push(t); }
    }
    while (ops.length) apply();
    if (out.length !== 1) throw 0; return signed(out[0]);
  }
  const show = (v, b) => { const u = v & mask(); let s = u.toString(b).toUpperCase(); if (b === 2) s = s.padStart(Number(bits) > 16 ? 8 : Number(bits), "0").replace(/(?=(\d{4})+$)/g, " ").trim(); else if (b === 16) s = s.replace(/(?=(\w{4})+$)/g, " ").trim(); return b === 10 ? v.toString() : s; };
  let val = 0n;
  function draw() {
    try { val = expr ? calc(expr) : 0n; $(".res", p).classList.remove("err"); } catch { }
    $(".expr", p).textContent = expr || " ";
    $(".res", p).textContent = show(val, base);
    $(".pbase", p).innerHTML = [[16, "HEX"], [10, "DEC"], [8, "OCT"], [2, "BIN"]].map(([b, l]) => `<div class="${b === base ? "cur" : ""}" data-b="${b}">${l}</div><div class="${b === base ? "cur" : ""}">${show(val, b)}</div>`).join("");
    $$("[data-b]", p).forEach(d => d.onclick = () => { expr = show(val & mask(), +d.dataset.b).replace(/ /g, ""); base = +d.dataset.b; if (base === 10) expr = val.toString(); draw(); drawKeys(); });
    const u = val & mask(), n = Number(bits);
    $(".pbits", p).innerHTML = Array.from({ length: n }, (_, i) => { const bit = BigInt(n - 1 - i); return `<span class="${(u >> bit) & 1n ? "one" : ""}" data-bit="${bit}" title="bit ${bit}">${(u >> bit) & 1n}</span>`; }).join("");
    $$("[data-bit]", p).forEach(s => s.onclick = () => { val = signed((val & mask()) ^ (1n << BigInt(s.dataset.bit))); expr = base === 10 ? val.toString() : show(val, base).replace(/ /g, ""); draw(); });
  }
  const K = [["AND", "fn", "&"], ["OR", "fn", "|"], ["XOR", "fn", "^"], ["NOT", "fn", "~"], ["<<", "fn", "<<"], [">>", "fn", ">>"], ["A"], ["B"], ["C"], ["D"], ["E"], ["F"], ["7"], ["8"], ["9"], ["(", "fn"], [")", "fn"], ["÷", "op", "/"], ["4"], ["5"], ["6"], ["%", "fn"], ["AC", "top", "clear"], ["×", "op", "*"], ["1"], ["2"], ["3"], ["±", "fn", "neg"], ["⌫", "top", "back"], ["−", "op", "-"], ["0"], ["00"], ["", "fn", ""], ["", "fn", ""], ["=", "op", "eq"], ["+", "op", "+"]];
  function drawKeys() {
    const ok = (d) => parseInt(d, 16) < base;
    $(".ckeys", p).innerHTML = K.map(([l, c = "", v]) => `<button class="ckey ${c}" data-v="${v ?? l}" ${/^[0-9A-F]$/.test(l) && !ok(l) ? "disabled" : ""}>${l}</button>`).join("");
    $$(".ckey", p).forEach(k => k.onclick = () => press(k.dataset.v));
  }
  function press(v) {
    if (!v) return;
    if (v === "clear") expr = ""; else if (v === "back") expr = expr.slice(0, -1);
    else if (v === "neg") expr = (-val).toString(base === 10 ? 10 : base);
    else if (v === "eq") { if (expr) C.pushHist(expr + ` (base ${base})`, show(val, base)); expr = base === 10 ? val.toString() : show(val, base).replace(/ /g, ""); }
    else expr += v === "00" ? "00" : v.length > 1 && /[<>]/.test(v) ? ` ${v} ` : v;
    draw();
  }
  $("[data-ws]", p).onchange = (e) => { bits = BigInt(e.target.value); draw(); };
  C.onKey = (e) => { const k = e.key.toUpperCase(); if (/^[0-9A-F]$/.test(k) && parseInt(k, 16) < base) press(k); else if ("+-*/%&|^~()".includes(e.key)) press(e.key); else if (e.key === "Enter") press("eq"); else if (e.key === "Backspace") press("back"); else if (e.key === "Escape") press("clear"); else return; e.preventDefault(); };
  C.recall = (hh) => { expr = hh.expr.replace(/ \(base \d+\)$/, ""); draw(); };
  drawKeys(); draw();
} });

/* ---------- conversions ---------- */
const UNITS = {
  "Longueur": { m: ["mètre", 1], km: ["kilomètre", 1000], cm: ["centimètre", .01], mm: ["millimètre", .001], µm: ["micromètre", 1e-6], nm: ["nanomètre", 1e-9], mi: ["mile", 1609.344], yd: ["yard", .9144], ft: ["pied", .3048], in: ["pouce", .0254], nmi: ["mille marin", 1852], al: ["année-lumière", 9.4607e15], ua: ["unité astronomique", 1.495978707e11] },
  "Masse": { kg: ["kilogramme", 1], g: ["gramme", .001], mg: ["milligramme", 1e-6], t: ["tonne", 1000], lb: ["livre", .45359237], oz: ["once", .028349523125], ct: ["carat", .0002], st: ["stone", 6.35029318] },
  "Température": { C: ["degré Celsius"], F: ["degré Fahrenheit"], K: ["kelvin"] },
  "Surface": { "m²": ["mètre carré", 1], "km²": ["kilomètre carré", 1e6], "cm²": ["centimètre carré", 1e-4], ha: ["hectare", 1e4], a: ["are", 100], "ft²": ["pied carré", .09290304], "in²": ["pouce carré", 6.4516e-4], acre: ["acre", 4046.8564224], "mi²": ["mile carré", 2589988.11] },
  "Volume": { L: ["litre", 1], mL: ["millilitre", .001], cL: ["centilitre", .01], "m³": ["mètre cube", 1000], "cm³": ["centimètre cube", .001], gal: ["gallon US", 3.785411784], "gal UK": ["gallon impérial", 4.54609], cup: ["tasse US", .2365882365], "fl oz": ["once liquide US", .0295735296] },
  "Vitesse": { "m/s": ["mètre par seconde", 1], "km/h": ["kilomètre par heure", 1 / 3.6], mph: ["mile par heure", .44704], kn: ["nœud", .514444], Mach: ["Mach", 340.29], c: ["vitesse de la lumière", 299792458] },
  "Temps": { s: ["seconde", 1], ms: ["milliseconde", .001], min: ["minute", 60], h: ["heure", 3600], j: ["jour", 86400], sem: ["semaine", 604800], mois: ["mois (moyen)", 2629746], an: ["année", 31556952], siècle: ["siècle", 3155695200] },
  "Données": { o: ["octet", 1], bit: ["bit", .125], ko: ["kilooctet", 1e3], Mo: ["mégaoctet", 1e6], Go: ["gigaoctet", 1e9], To: ["téraoctet", 1e12], Kio: ["kibioctet", 1024], Mio: ["mébioctet", 1048576], Gio: ["gibioctet", 1073741824] },
  "Énergie": { J: ["joule", 1], kJ: ["kilojoule", 1000], cal: ["calorie", 4.184], kcal: ["kilocalorie", 4184], Wh: ["wattheure", 3600], kWh: ["kilowattheure", 3.6e6], eV: ["électronvolt", 1.602176634e-19], BTU: ["BTU", 1055.06] },
  "Pression": { Pa: ["pascal", 1], hPa: ["hectopascal", 100], kPa: ["kilopascal", 1000], bar: ["bar", 1e5], atm: ["atmosphère", 101325], mmHg: ["millimètre de mercure", 133.322], psi: ["psi", 6894.757] },
  "Angle": { "°": ["degré", Math.PI / 180], rad: ["radian", 1], grad: ["grade", Math.PI / 200], tr: ["tour", 2 * Math.PI], "′": ["minute d'arc", Math.PI / 10800], "″": ["seconde d'arc", Math.PI / 648000] },
  "Puissance": { W: ["watt", 1], kW: ["kilowatt", 1000], MW: ["mégawatt", 1e6], ch: ["cheval-vapeur", 735.49875], hp: ["horsepower", 745.69987] },
  "Consommation": { "L/100km": ["litre aux 100 km"], "km/L": ["kilomètre par litre"], mpg: ["mile par gallon US"] }
};
function convert(cat, v, from, to) {
  if (cat === "Température") { const k = from === "C" ? v + 273.15 : from === "F" ? (v - 32) * 5 / 9 + 273.15 : v; return to === "C" ? k - 273.15 : to === "F" ? (k - 273.15) * 9 / 5 + 32 : k; }
  if (cat === "Consommation") { const l100 = from === "L/100km" ? v : from === "km/L" ? 100 / v : 235.214583 / v; return to === "L/100km" ? l100 : to === "km/L" ? 100 / l100 : 235.214583 / l100; }
  return v * UNITS[cat][from][1] / UNITS[cat][to][1];
}
CALC_MODES.push({ id: "conversions", name: "Conversions", ic: "replace", render(C) {
  let cat = store.get("calc.cat", "Longueur");
  const p = C.pane;
  const draw = () => {
    const u = Object.keys(UNITS[cat]);
    p.innerHTML = `<div class="cbox"><div class="ctabs">${Object.keys(UNITS).map(c => `<button class="${c === cat ? "sel" : ""}" data-c="${c}">${c}</button>`).join("")}</div>
      <div class="ccard"><div class="crow"><input class="cin" data-v value="1" style="flex:1;font-size:26px"><select class="cin" data-f>${u.map(k => `<option value="${esc(k)}">${esc(k)} — ${UNITS[cat][k][0]}</option>`).join("")}</select></div>
      <div style="text-align:center;margin:6px 0"><button class="tool" data-swap>${svg("replace", 14)} Inverser</button></div>
      <div class="crow"><div class="cin" data-o style="flex:1;font-size:26px;min-height:44px">…</div><select class="cin" data-t>${u.map((k, i) => `<option value="${esc(k)}" ${i === 1 ? "selected" : ""}>${esc(k)} — ${UNITS[cat][k][0]}</option>`).join("")}</select></div></div>
      <div class="ccard"><b style="font-size:13px">Toutes les unités</b><table class="ctable" data-all></table></div>
      <p class="muted">Astuce : tu peux taper un calcul dans la case, par exemple 3×12 ou 1,5+0,25.</p></div>`;
    const vin = $("[data-v]", p), f = $("[data-f]", p), t = $("[data-t]", p);
    const run = () => {
      let v; try { v = CalcEngine.evaluate(vin.value || "0"); } catch { $("[data-o]", p).textContent = "…"; return; }
      $("[data-o]", p).textContent = calcFmt(convert(cat, v, f.value, t.value));
      $("[data-all]", p).innerHTML = u.map(k => `<tr><td>${UNITS[cat][k][0]}</td><td>${calcFmt(convert(cat, v, f.value, k))} ${esc(k)}</td></tr>`).join("");
    };
    vin.oninput = f.onchange = t.onchange = run;
    $("[data-swap]", p).onclick = () => { const a = f.value; f.value = t.value; t.value = a; run(); };
    $$("[data-c]", p).forEach(b => b.onclick = () => { cat = b.dataset.c; store.set("calc.cat", cat); draw(); });
    run();
  };
  draw();
} });
