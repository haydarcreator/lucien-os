/* Lucien Calculator — moteur : analyse d'expressions, fractions, résolution, statistiques
   Pas d'eval : l'expression est découpée en jetons puis compilée en fonctions JavaScript. */
"use strict";
const CalcEngine = (() => {
  const CONST = { pi: Math.PI, "π": Math.PI, e: Math.E, phi: (1 + Math.sqrt(5)) / 2, "φ": (1 + Math.sqrt(5)) / 2, tau: 2 * Math.PI, "τ": 2 * Math.PI };
  const fact = (n) => { if (n < 0 || !Number.isFinite(n)) return NaN; if (!Number.isInteger(n)) return gamma(n + 1); let r = 1; for (let i = 2; i <= n; i++) r *= i; return r; };
  function gamma(z) { if (z < .5) return Math.PI / (Math.sin(Math.PI * z) * gamma(1 - z)); z -= 1; const g = 7, c = [.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313, -176.61502916214059, 12.507343278686905, -.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7]; let x = c[0]; for (let i = 1; i < g + 2; i++) x += c[i] / (z + i); const t = z + g + .5; return Math.sqrt(2 * Math.PI) * t ** (z + .5) * Math.exp(-t) * x; }
  const gcd = (a, b) => { a = Math.abs(Math.round(a)); b = Math.abs(Math.round(b)); while (b) [a, b] = [b, a % b]; return a; };
  const comb = (n, k) => k < 0 || k > n ? 0 : Math.round(fact(n) / (fact(k) * fact(n - k)));
  /* fonctions : (angle) indique qu'elles dépendent du mode degrés/radians */
  const FN = {
    sin: [1, (x, m) => Math.sin(m.toRad(x))], cos: [1, (x, m) => Math.cos(m.toRad(x))], tan: [1, (x, m) => Math.tan(m.toRad(x))],
    asin: [1, (x, m) => m.fromRad(Math.asin(x))], acos: [1, (x, m) => m.fromRad(Math.acos(x))], atan: [1, (x, m) => m.fromRad(Math.atan(x))],
    sinh: [1, Math.sinh], cosh: [1, Math.cosh], tanh: [1, Math.tanh], asinh: [1, Math.asinh], acosh: [1, Math.acosh], atanh: [1, Math.atanh],
    ln: [1, Math.log], log: [-1, (x, b) => b === undefined ? Math.log10(x) : Math.log(x) / Math.log(b)], log2: [1, Math.log2], exp: [1, Math.exp],
    sqrt: [1, Math.sqrt], "√": [1, Math.sqrt], racine: [1, Math.sqrt], cbrt: [1, Math.cbrt], "∛": [1, Math.cbrt], root: [2, (x, n) => x < 0 && n % 2 ? -((-x) ** (1 / n)) : x ** (1 / n)],
    abs: [1, Math.abs], floor: [1, Math.floor], ent: [1, Math.floor], ceil: [1, Math.ceil], round: [-1, (x, n = 0) => Math.round(x * 10 ** n) / 10 ** n], arrondi: [-1, (x, n = 0) => Math.round(x * 10 ** n) / 10 ** n],
    sign: [1, Math.sign], fact: [1, fact], gamma: [1, gamma], ncr: [2, comb], comb: [2, comb], npr: [2, (n, k) => Math.round(fact(n) / fact(n - k))],
    gcd: [2, gcd], pgcd: [2, gcd], lcm: [2, (a, b) => Math.abs(a * b) / gcd(a, b)], ppcm: [2, (a, b) => Math.abs(a * b) / gcd(a, b)], mod: [2, (a, b) => ((a % b) + b) % b],
    min: [-1, Math.min], max: [-1, Math.max], moyenne: [-1, (...a) => a.reduce((s, x) => s + x, 0) / a.length], mean: [-1, (...a) => a.reduce((s, x) => s + x, 0) / a.length],
    rand: [0, Math.random], alea: [0, Math.random], hypot: [-1, Math.hypot]
  };
  FN.arcsin = FN.asin; FN.arccos = FN.acos; FN.arctan = FN.atan;
  const FN_NAMES = Object.keys(FN).sort((a, b) => b.length - a.length);

  function normalize(s) {
    return String(s).replace(/(\d),(\d)/g, "$1.$2").replace(/[×·∙]/g, "*").replace(/÷/g, "/").replace(/[−–]/g, "-").replace(/²/g, "^2").replace(/³/g, "^3")
      .replace(/\s+/g, "");
  }
  function tokenize(src) {
    const s = normalize(src), out = [];
    let i = 0;
    while (i < s.length) {
      const c = s[i];
      const num = /^(\d+\.?\d*|\.\d+)(E[+-]?\d+)?/i.exec(s.slice(i));
      if (num) { out.push({ t: "num", v: parseFloat(num[0]) }); i += num[0].length; continue; }
      if ("+-*/^(),;!%=<>".includes(c)) { out.push({ t: "op", v: c === ";" ? "," : c }); i++; continue; }
      const rest = s.slice(i).toLowerCase();
      const fn = FN_NAMES.find(n => rest.startsWith(n) && (s[i + n.length] === "(" || n === "√" || n === "∛"));
      if (fn) { out.push({ t: "fn", v: fn }); i += fn.length; continue; }
      const cst = ["pi", "phi", "tau", "π", "φ", "τ", "ans"].find(n => rest.startsWith(n));
      if (cst) { out.push({ t: "id", v: cst }); i += cst.length; continue; }
      if (/[a-zA-Zα-ω]/.test(c)) { out.push({ t: "id", v: c }); i++; continue; }
      throw new Error("Caractère inattendu : " + c);
    }
    // multiplication implicite : 2x, 2(…), )(, x(…), 3π, )2
    const res = [];
    for (const tk of out) {
      const p = res[res.length - 1];
      const endsValue = p && (p.t === "num" || p.t === "id" || (p.t === "op" && (p.v === ")" || p.v === "!" || p.v === "%")));
      const startsValue = tk.t === "num" || tk.t === "id" || tk.t === "fn" || (tk.t === "op" && tk.v === "(");
      if (endsValue && startsValue && !(p.t === "num" && tk.t === "num")) res.push({ t: "op", v: "*" });
      res.push(tk);
    }
    return res;
  }
  /* analyse descendante : priorité  + -  <  * /  <  signe  <  ^ (droite)  <  ! % */
  function parse(tokens) {
    let i = 0;
    const peek = () => tokens[i], eat = (v) => { const t = tokens[i]; if (!t || t.v !== v) throw new Error(`« ${v} » attendu`); i++; };
    function add() { let a = mul(); while (peek() && (peek().v === "+" || peek().v === "-")) { const op = tokens[i++].v; a = { t: "bin", op, a, b: mul() }; } return a; }
    function mul() { let a = unary(); while (peek() && (peek().v === "*" || peek().v === "/")) { const op = tokens[i++].v; a = { t: "bin", op, a, b: unary() }; } return a; }
    function unary() { if (peek() && peek().v === "-") { i++; return { t: "neg", a: unary() }; } if (peek() && peek().v === "+") { i++; return unary(); } return pow(); }
    function pow() { const a = post(); if (peek() && peek().v === "^") { i++; return { t: "bin", op: "^", a, b: unary() }; } return a; }
    function post() { let a = atom(); while (peek() && (peek().v === "!" || peek().v === "%")) a = { t: "post", op: tokens[i++].v, a }; return a; }
    function atom() {
      const t = tokens[i++];
      if (!t) throw new Error("Expression incomplète");
      if (t.t === "num") return { t: "num", v: t.v };
      if (t.t === "id") return { t: "var", n: t.v };
      if (t.t === "fn") {
        if ((t.v === "√" || t.v === "∛") && !(peek() && peek().v === "(")) return { t: "call", f: t.v === "√" ? "sqrt" : "cbrt", args: [pow()] };
        eat("("); const args = []; if (peek() && peek().v !== ")") { args.push(add()); while (peek() && peek().v === ",") { i++; args.push(add()); } } eat(")");
        const ar = FN[t.v][0]; if (ar >= 0 && args.length !== ar) throw new Error(`${t.v} attend ${ar} argument(s)`);
        return { t: "call", f: t.v, args };
      }
      if (t.v === "(") { const a = add(); if (peek() && peek().v === ")") i++; return a; }
      throw new Error("Symbole inattendu : " + t.v);
    }
    const ast = add();
    if (i < tokens.length) throw new Error("Symbole inattendu : " + tokens[i].v);
    return ast;
  }
  /* compilation en fermetures (rapide pour tracer des milliers de points) */
  function build(n, mode) {
    switch (n.t) {
      case "num": { const v = n.v; return () => v; }
      case "var": { const k = n.n.toLowerCase(); if (k in CONST) { const v = CONST[k]; return () => v; } const raw = n.n; return (env) => { const v = env[raw] ?? env[k]; if (v === undefined) throw new Error(`Variable inconnue : ${raw}`); return v; }; }
      case "neg": { const a = build(n.a, mode); return (e) => -a(e); }
      case "post": { const a = build(n.a, mode); return n.op === "!" ? (e) => fact(a(e)) : (e) => a(e) / 100; }
      case "call": { const f = FN[n.f][1], args = n.args.map(x => build(x, mode)); const uses = f.length === 2 && ["sin", "cos", "tan", "asin", "acos", "atan", "arcsin", "arccos", "arctan"].includes(n.f); return uses ? (e) => f(args[0](e), e.__mode || mode) : (e) => f(...args.map(g => g(e))); }
      case "bin": {
        const a = build(n.a, mode), b = build(n.b, mode);
        switch (n.op) { case "+": return (e) => a(e) + b(e); case "-": return (e) => a(e) - b(e); case "*": return (e) => a(e) * b(e); case "/": return (e) => a(e) / b(e);
          case "^": return (e) => { const x = a(e), y = b(e); if (x < 0 && !Number.isInteger(y)) { const inv = 1 / y; if (Number.isInteger(inv) && inv % 2) return -((-x) ** y); } return x ** y; }; }
      }
    }
    throw new Error("Expression invalide");
  }
  const angle = (deg) => ({ toRad: (x) => deg ? x * Math.PI / 180 : x, fromRad: (x) => deg ? x * 180 / Math.PI : x });
  const cache = new Map();
  function compile(src, deg = false) {
    const key = src + "|" + deg; if (cache.has(key)) return cache.get(key);
    const fn = build(parse(tokenize(src)), angle(deg)); cache.set(key, fn); if (cache.size > 500) cache.clear(); return fn;
  }
  function evaluate(src, env = {}, deg = false) { return compile(src, deg)(env); }
  /* variables utilisées (pour créer des curseurs a, b, c… dans les graphiques) */
  function vars(src) { try { return [...new Set(tokenize(src).filter(t => t.t === "id" && !(t.v.toLowerCase() in CONST) && t.v !== "ans").map(t => t.v))]; } catch { return []; } }

  /* fraction la plus proche (fractions continues) */
  function toFraction(x, maxDen = 10000) {
    if (!Number.isFinite(x) || Number.isInteger(x)) return null;
    let h1 = 1, h0 = 0, k1 = 0, k0 = 1, b = x;
    for (let i = 0; i < 40; i++) {
      const a = Math.floor(b); [h1, h0] = [a * h1 + h0, h1]; [k1, k0] = [a * k1 + k0, k1];
      if (k1 > maxDen) return null;
      if (Math.abs(x - h1 / k1) < 1e-10 * Math.max(1, Math.abs(x))) return { n: h1, d: k1 };
      b = 1 / (b - a); if (!Number.isFinite(b)) break;
    }
    return null;
  }
  function fracHTML(x) {
    const f = toFraction(x); if (!f) return null;
    const sgn = f.n < 0 ? "−" : "", n = Math.abs(f.n), w = Math.floor(n / f.d), r = n % f.d;
    const fr = (a, b) => `<span class="fr"><span>${a}</span><span>${b}</span></span>`;
    return { simple: sgn + fr(n, f.d), mixed: w && r ? `${sgn}${w} ${fr(r, f.d)}` : null, text: `${f.n}/${f.d}` };
  }
  /* reconnaissance de √n et de multiples de π, utile en classe */
  function exactForm(x) {
    if (!Number.isFinite(x) || Number.isInteger(x)) return null;
    const p = toFraction(x / Math.PI, 100); if (p && Math.abs(p.n) < 100) return `${p.n === 1 ? "" : p.n === -1 ? "−" : p.n}π${p.d !== 1 ? "/" + p.d : ""}`;
    const s = x * x, r = Math.round(s);
    if (Math.abs(s - r) < 1e-9 && r < 10000) { let k = 1, m = r; for (let i = 2; i * i <= m; i++) while (m % (i * i) === 0) { k *= i; m /= i * i; } if (m > 1) return `${x < 0 ? "−" : ""}${k > 1 ? k : ""}√${m}`; }
    return null;
  }
  function format(x, loc = "fr-FR", digits = 12) {
    if (typeof x !== "number") return String(x);
    if (Number.isNaN(x)) return "Erreur";
    if (!Number.isFinite(x)) return x > 0 ? "∞" : "−∞";
    if (Math.abs(x) < 1e-12) return "0";
    const ax = Math.abs(x);
    if (ax >= 1e15 || ax < 1e-9) { const [m, e] = x.toExponential(digits - 3).split("e"); return `${(+m).toLocaleString(loc, { maximumFractionDigits: digits - 3 })}×10${sup(+e)}`; }
    return (+x.toPrecision(digits)).toLocaleString(loc, { maximumFractionDigits: 10 });
  }
  const SUP = { "-": "⁻", 0: "⁰", 1: "¹", 2: "²", 3: "³", 4: "⁴", 5: "⁵", 6: "⁶", 7: "⁷", 8: "⁸", 9: "⁹" };
  const sup = (n) => String(n).split("").map(c => SUP[c] || c).join("");

  /* racines de f sur [a,b] : changements de signe + minima qui touchent zéro */
  function roots(f, a, b, n = 4000) {
    const out = [], h = (b - a) / n;
    let x0 = a, y0 = f(x0);
    for (let i = 1; i <= n; i++) {
      const x1 = a + i * h, y1 = f(x1);
      if (Number.isFinite(y0) && Number.isFinite(y1)) {
        if (y0 === 0) out.push(x0);
        else if (y0 * y1 < 0 && Math.abs(y1 - y0) < 1e6 * Math.max(1, h)) { let lo = x0, hi = x1, flo = y0; for (let k = 0; k < 80; k++) { const m = (lo + hi) / 2, fm = f(m); if (flo * fm <= 0) hi = m; else { lo = m; flo = fm; } } out.push((lo + hi) / 2); }
      }
      x0 = x1; y0 = y1;
    }
    for (const e of extrema(f, a, b, n)) if (Math.abs(e.y) < 1e-7) out.push(e.x);
    return dedupe(out.sort((p, q) => p - q));
  }
  function extrema(f, a, b, n = 2000) {
    const out = [], h = (b - a) / n;
    for (let i = 1; i < n; i++) {
      const xm = a + (i - 1) * h, x = a + i * h, xp = a + (i + 1) * h, ym = f(xm), y = f(x), yp = f(xp);
      if (![ym, y, yp].every(Number.isFinite)) continue;
      if ((y > ym && y >= yp) || (y < ym && y <= yp)) {
        let lo = xm, hi = xp; const isMax = y > ym;
        for (let k = 0; k < 60; k++) { const m1 = lo + (hi - lo) / 3, m2 = hi - (hi - lo) / 3; if ((f(m1) < f(m2)) === isMax) lo = m1; else hi = m2; }
        const ex = (lo + hi) / 2; out.push({ x: ex, y: f(ex), max: isMax });
      }
    }
    return out;
  }
  const dedupe = (arr) => arr.filter((x, i) => i === 0 || Math.abs(x - arr[i - 1]) > 1e-6).map(x => Math.abs(x) < 1e-10 ? 0 : x);
  function integral(f, a, b, n = 2000) { if (n % 2) n++; const h = (b - a) / n; let s = f(a) + f(b); for (let i = 1; i < n; i++) s += f(a + i * h) * (i % 2 ? 4 : 2); return s * h / 3; }
  const derive = (f, h = 1e-5) => (x) => (f(x + h) - f(x - h)) / (2 * h);

  /* statistiques descriptives */
  function stats(xs) {
    const v = [...xs].sort((a, b) => a - b), n = v.length; if (!n) return null;
    const sum = v.reduce((s, x) => s + x, 0), mean = sum / n;
    const q = (p) => { const pos = (n - 1) * p, lo = Math.floor(pos), hi = Math.ceil(pos); return v[lo] + (v[hi] - v[lo]) * (pos - lo); };
    const varp = v.reduce((s, x) => s + (x - mean) ** 2, 0) / n;
    const counts = {}; v.forEach(x => counts[x] = (counts[x] || 0) + 1); const maxc = Math.max(...Object.values(counts));
    const mode = maxc > 1 ? Object.keys(counts).filter(k => counts[k] === maxc).map(Number) : [];
    return { n, sum, mean, median: q(.5), q1: q(.25), q3: q(.75), min: v[0], max: v[n - 1], range: v[n - 1] - v[0], varp, vars: n > 1 ? varp * n / (n - 1) : 0, sdp: Math.sqrt(varp), sds: n > 1 ? Math.sqrt(varp * n / (n - 1)) : 0, mode, sorted: v };
  }
  function regression(xs, ys) {
    const n = Math.min(xs.length, ys.length); if (n < 2) return null;
    const mx = xs.slice(0, n).reduce((s, x) => s + x, 0) / n, my = ys.slice(0, n).reduce((s, y) => s + y, 0) / n;
    let sxy = 0, sxx = 0, syy = 0; for (let i = 0; i < n; i++) { sxy += (xs[i] - mx) * (ys[i] - my); sxx += (xs[i] - mx) ** 2; syy += (ys[i] - my) ** 2; }
    const a = sxy / sxx, b = my - a * mx; return { a, b, r: sxy / Math.sqrt(sxx * syy), n };
  }
  /* résolution d'un système linéaire par la méthode de Gauss, avec les étapes */
  function gauss(M) {
    const A = M.map(r => [...r]), n = A.length, steps = [];
    for (let c = 0; c < n; c++) {
      let p = c; for (let r = c + 1; r < n; r++) if (Math.abs(A[r][c]) > Math.abs(A[p][c])) p = r;
      if (Math.abs(A[p][c]) < 1e-12) return { steps, sol: null };
      if (p !== c) { [A[p], A[c]] = [A[c], A[p]]; steps.push(`Échange des lignes L${c + 1} et L${p + 1}`); }
      for (let r = 0; r < n; r++) { if (r === c || !A[r][c]) continue; const k = A[r][c] / A[c][c]; for (let j = c; j <= n; j++) A[r][j] -= k * A[c][j]; steps.push(`L${r + 1} ← L${r + 1} − (${format(k)}) × L${c + 1}`); }
    }
    return { steps, sol: A.map((r, i) => r[n] / r[i]) };
  }
  function parseList(s) { return String(s).split(/[\s;\n]+/).map(x => x.replace(",", ".")).filter(x => x !== "").map(Number).filter(Number.isFinite); }
  return { tokenize, parse, compile, evaluate, vars, toFraction, fracHTML, exactForm, format, sup, roots, extrema, integral, derive, stats, regression, gauss, parseList, FN: Object.keys(FN), fact, gcd };
})();
