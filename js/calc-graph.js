/* Lucien Calculator — modes pour apprendre : Graphiques, Équations, Statistiques, Géométrie */
"use strict";
const GCOLORS = ["#e8590c", "#1c7ed6", "#2b8a3e", "#ae3ec9", "#e03131", "#0c8599", "#f08c00", "#5f3dc4"];
const PARAMS = ["a", "b", "c", "d", "k", "m", "n", "p", "q", "t"];
const num = (s) => { try { return CalcEngine.evaluate(String(s || "0")); } catch { return NaN; } };
const F = (x) => calcFmt(x);

/* ================= Graphiques ================= */
CALC_MODES.push({ id: "graphiques", name: "Graphiques", ic: "chart", render(C) {
  const st = store.get("calc.graph", null) || { fns: [{ src: "x^2-2", on: true }, { src: "sin(x)", on: true }, { src: "a*x+b", on: true }], params: { a: 1, b: 0 } };
  let view = { cx: 0, cy: 0, scale: 40 }, tool = null, showDer = false, area = null, table = false;
  const p = C.pane;
  p.innerHTML = `<div class="gwrap"><div class="glist"><div class="gl"></div><div class="gtools">
      <button class="tool" data-add>${svg("plus", 12)} Fonction</button><button class="tool" data-tool="racines">Racines</button><button class="tool" data-tool="extremums">Extremums</button><button class="tool" data-tool="intersections">Intersections</button>
      <button class="tool" data-der>f′(x) dérivée</button><button class="tool" data-area>∫ Aire</button><button class="tool" data-table>Tableau</button><button class="tool" data-png>${svg("download", 12)} Image</button></div><div class="gout"></div></div>
    <div class="gcanvas"><canvas></canvas><div class="gctl"><button data-z="in" title="Zoom avant">${svg("plus", 15)}</button><button data-z="out" title="Zoom arrière">${svg("minus", 15)}</button><button data-z="home" title="Recentrer">${svg("home", 15)}</button></div><div class="gtip hidden"></div></div></div>`;
  const cv = $("canvas", p), ctx = cv.getContext("2d"), box = $(".gcanvas", p), tip = $(".gtip", p), out = $(".gout", p);
  const save = () => store.set("calc.graph", st);
  const compiled = () => st.fns.map((f, i) => {
    const src = f.src.replace(/^\s*(y|f\(x\))\s*=\s*/i, "");
    if (!src.trim()) return null;
    try { const g = CalcEngine.compile(src, C.deg === true && false); const env = { ...st.params }; const fn = (x) => { env.x = x; try { return g(env); } catch { return NaN; } }; fn(1); return { fn, color: GCOLORS[i % GCOLORS.length], on: f.on, i, src }; } catch { return { bad: true, i }; }
  });
  function drawList() {
    const used = new Set(); st.fns.forEach(f => CalcEngine.vars(f.src).forEach(v => PARAMS.includes(v) && used.add(v)));
    used.forEach(v => { if (!(v in st.params)) st.params[v] = 1; });
    $(".gl", p).innerHTML = st.fns.map((f, i) => `<div class="gfn" data-i="${i}"><span class="dot ${f.on ? "" : "off"}" style="background:${GCOLORS[i % 8]};color:${GCOLORS[i % 8]}" title="Afficher / masquer"></span><span style="font:italic 14px Georgia,serif;color:#a59c90">${String.fromCharCode(102 + i)}(x)=</span><input class="cin" value="${esc(f.src)}" spellcheck="false"><button class="x" title="Supprimer">${svg("x", 13)}</button></div>`).join("")
      + [...used].map(v => `<div class="gsl"><div class="crow" style="justify-content:space-between"><b>${v} = <span data-pv="${v}">${F(st.params[v])}</span></b><span class="muted">curseur</span></div><input type="range" min="-10" max="10" step="0.1" value="${st.params[v]}" data-pr="${v}"></div>`).join("");
    $$(".gfn", p).forEach(row => {
      const i = +row.dataset.i;
      $("input", row).oninput = (e) => { st.fns[i].src = e.target.value; save(); validate(); draw(); };
      $("input", row).onchange = () => drawList();
      $(".dot", row).onclick = () => { st.fns[i].on = !st.fns[i].on; save(); drawList(); draw(); };
      $(".x", row).onclick = () => { st.fns.splice(i, 1); save(); drawList(); draw(); };
    });
    $$("[data-pr]", p).forEach(r => r.oninput = () => { st.params[r.dataset.pr] = +r.value; $(`[data-pv="${r.dataset.pr}"]`, p).textContent = F(+r.value); save(); draw(); });
    validate();
  }
  const validate = () => compiled().forEach((c, i) => $(`.gfn[data-i="${i}"]`, p)?.classList.toggle("bad", !!(c && c.bad)));
  const toPx = (x, y) => [cv.width / 2 / devicePixelRatio + (x - view.cx) * view.scale, cv.height / 2 / devicePixelRatio - (y - view.cy) * view.scale];
  const toWorld = (px, py) => [(px - cv.width / 2 / devicePixelRatio) / view.scale + view.cx, -(py - cv.height / 2 / devicePixelRatio) / view.scale + view.cy];
  function niceStep() { const raw = 80 / view.scale, p10 = 10 ** Math.floor(Math.log10(raw)), m = raw / p10; return (m < 2 ? 1 : m < 5 ? 2 : 5) * p10; }
  let marks = [];
  function draw() {
    const W = box.clientWidth, H = box.clientHeight, dpr = devicePixelRatio || 1;
    if (cv.width !== W * dpr || cv.height !== H * dpr) { cv.width = W * dpr; cv.height = H * dpr; }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H);
    const step = niceStep(), [x0, y1] = toWorld(0, 0), [x1, y0] = toWorld(W, H);
    ctx.lineWidth = 1;
    for (let gx = Math.floor(x0 / step) * step; gx <= x1; gx += step) { const [px] = toPx(gx, 0); ctx.strokeStyle = Math.abs(gx) < step / 2 ? "#333" : "#e6e6e6"; ctx.beginPath(); ctx.moveTo(px, 0); ctx.lineTo(px, H); ctx.stroke(); }
    for (let gy = Math.floor(y0 / step) * step; gy <= y1; gy += step) { const [, py] = toPx(0, gy); ctx.strokeStyle = Math.abs(gy) < step / 2 ? "#333" : "#e6e6e6"; ctx.beginPath(); ctx.moveTo(0, py); ctx.lineTo(W, py); ctx.stroke(); }
    ctx.fillStyle = "#666"; ctx.font = "11px -apple-system,Segoe UI,sans-serif";
    const [ox, oy] = toPx(0, 0), lx = Math.min(Math.max(ox, 4), W - 30), ly = Math.min(Math.max(oy, 12), H - 4);
    for (let gx = Math.floor(x0 / step) * step; gx <= x1; gx += step) if (Math.abs(gx) > step / 2) { const [px] = toPx(gx, 0); ctx.fillText(F(+gx.toPrecision(10)), px + 3, ly + 13 > H ? ly - 4 : ly + 13); }
    for (let gy = Math.floor(y0 / step) * step; gy <= y1; gy += step) if (Math.abs(gy) > step / 2) { const [, py] = toPx(0, gy); ctx.fillText(F(+gy.toPrecision(10)), lx + 4, py - 3); }
    const cs = compiled().filter(c => c && !c.bad && c.on);
    if (area && cs[0]) { const f = cs[0].fn; ctx.fillStyle = cs[0].color + "33"; ctx.beginPath(); const [ax, ay] = toPx(area.a, 0); ctx.moveTo(ax, ay); for (let i = 0; i <= 200; i++) { const x = area.a + (area.b - area.a) * i / 200; ctx.lineTo(...toPx(x, f(x))); } ctx.lineTo(...toPx(area.b, 0)); ctx.closePath(); ctx.fill(); }
    const plot = (fn, color, dash) => {
      ctx.strokeStyle = color; ctx.lineWidth = 2.5; ctx.setLineDash(dash || []); ctx.beginPath(); let pen = false, lastY = null;
      for (let px = 0; px <= W; px += 1) { const [x] = toWorld(px, 0), y = fn(x); if (!Number.isFinite(y)) { pen = false; continue; } const [, py] = toPx(x, y); if (pen && lastY !== null && Math.abs(py - lastY) > H * 2) pen = false; if (pen) ctx.lineTo(px, py); else ctx.moveTo(px, py); pen = true; lastY = py; }
      ctx.stroke(); ctx.setLineDash([]);
    };
    cs.forEach(c => { plot(c.fn, c.color); if (showDer) plot(CalcEngine.derive(c.fn), c.color, [6, 5]); });
    marks.forEach((m, mi) => { const [px, py] = toPx(m.x, m.y); ctx.fillStyle = "#fff"; ctx.strokeStyle = m.color; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(px, py, 5, 0, 7); ctx.fill(); ctx.stroke(); ctx.fillStyle = "#222"; ctx.font = "12px ui-monospace,Menlo,monospace"; ctx.fillText(m.y === 0 ? `x = ${F(+m.x.toFixed(4))}` : `(${F(+m.x.toFixed(4))} ; ${F(+m.y.toFixed(4))})`, px + 8, py + (mi % 2 ? 18 : -8)); });
  }
  function runTool(t) {
    tool = tool === t ? null : t; marks = []; out.innerHTML = "";
    $$("[data-tool]", p).forEach(b => b.classList.toggle("on", b.dataset.tool === tool));
    if (!tool) return draw();
    const [x0] = toWorld(0, 0), [x1] = toWorld(box.clientWidth, 0), cs = compiled().filter(c => c && !c.bad && c.on), lines = [];
    if (tool === "racines") cs.forEach(c => { const r = CalcEngine.roots(c.fn, x0, x1); r.forEach(x => marks.push({ x, y: 0, color: c.color })); lines.push(`<b style="color:${c.color}">${esc(c.src)}</b> = 0 pour x ∈ { ${r.map(x => F(+x.toFixed(6))).join(" ; ") || "aucune racine visible"} }`); });
    if (tool === "extremums") cs.forEach(c => { const e = CalcEngine.extrema(c.fn, x0, x1); e.forEach(m => marks.push({ ...m, color: c.color })); lines.push(`<b style="color:${c.color}">${esc(c.src)}</b> : ${e.map(m => `${m.max ? "maximum" : "minimum"} (${F(+m.x.toFixed(4))} ; ${F(+m.y.toFixed(4))})`).join(", ") || "aucun extremum visible"}`); });
    if (tool === "intersections") for (let i = 0; i < cs.length; i++) for (let j = i + 1; j < cs.length; j++) { const a = cs[i], b = cs[j]; const r = CalcEngine.roots((x) => a.fn(x) - b.fn(x), x0, x1); r.forEach(x => marks.push({ x, y: a.fn(x), color: "#222" })); lines.push(`<b style="color:${a.color}">${esc(a.src)}</b> ∩ <b style="color:${b.color}">${esc(b.src)}</b> : ${r.map(x => `(${F(+x.toFixed(4))} ; ${F(+a.fn(x).toFixed(4))})`).join(", ") || "aucune"}`); }
    out.innerHTML = lines.join("<br>") || "Ajoute au moins une fonction.";
    draw();
  }
  async function areaTool() {
    if (area) { area = null; out.innerHTML = ""; $("[data-area]", p).classList.remove("on"); return draw(); }
    const r = await dialog(C.w, "Aire sous la courbe (intégrale)", [{ k: "a", l: "De x =", v: "0" }, { k: "b", l: "À x =", v: "2" }], "Calculer"); if (!r) return;
    const c = compiled().find(c => c && !c.bad && c.on); if (!c) return;
    area = { a: num(r.a), b: num(r.b) }; const v = CalcEngine.integral(c.fn, area.a, area.b);
    $("[data-area]", p).classList.add("on");
    out.innerHTML = `∫ de ${F(area.a)} à ${F(area.b)} de <b style="color:${c.color}">${esc(c.src)}</b> dx ≈ <b>${F(+v.toFixed(8))}</b><br><span class="muted">Méthode de Simpson, 2000 intervalles. L'aire sous l'axe des x compte en négatif.</span>`;
    draw();
  }
  function tableTool() {
    table = !table; $("[data-table]", p).classList.toggle("on", table);
    if (!table) { out.innerHTML = ""; return; }
    const cs = compiled().filter(c => c && !c.bad && c.on);
    out.innerHTML = `<div class="crow" style="margin-bottom:6px">De <input class="cin" data-ts value="-3" style="width:56px"> pas <input class="cin" data-tp value="1" style="width:56px"></div><table class="ctable" data-tt></table>`;
    const fill = () => { const s = num($("[data-ts]", out).value), d = num($("[data-tp]", out).value) || 1; $("[data-tt]", out).innerHTML = `<tr><th>x</th>${cs.map(c => `<th style="color:${c.color}">${esc(c.src)}</th>`).join("")}</tr>` + Array.from({ length: 13 }, (_, i) => { const x = s + i * d; return `<tr><td>${F(+x.toFixed(10))}</td>${cs.map(c => `<td>${F(c.fn(x))}</td>`).join("")}</tr>`; }).join(""); };
    $("[data-ts]", out).oninput = $("[data-tp]", out).oninput = fill; fill();
  }
  // navigation : glisser, molette, pincer
  let drag = null;
  box.addEventListener("pointerdown", (e) => { if (e.target.closest(".gctl")) return; drag = { x: e.clientX, y: e.clientY, cx: view.cx, cy: view.cy }; box.setPointerCapture(e.pointerId); });
  box.addEventListener("pointermove", (e) => {
    const r = box.getBoundingClientRect(), px = e.clientX - r.left, py = e.clientY - r.top;
    if (drag) { view.cx = drag.cx - (e.clientX - drag.x) / view.scale; view.cy = drag.cy + (e.clientY - drag.y) / view.scale; tip.classList.add("hidden"); return draw(); }
    const [x] = toWorld(px, py); let best = null;
    compiled().filter(c => c && !c.bad && c.on).forEach(c => { const y = c.fn(x); if (!Number.isFinite(y)) return; const [, cy] = toPx(x, y); const d = Math.abs(cy - py); if (d < 30 && (!best || d < best.d)) best = { d, x, y, c, cy }; });
    if (best) { tip.classList.remove("hidden"); tip.style.left = px + "px"; tip.style.top = best.cy + "px"; tip.innerHTML = `<span style="color:${best.c.color}">●</span> x = ${F(+best.x.toFixed(4))}  y = ${F(+best.y.toFixed(4))}`; } else tip.classList.add("hidden");
  });
  box.addEventListener("pointerup", () => drag = null);
  box.addEventListener("pointerleave", () => tip.classList.add("hidden"));
  box.addEventListener("wheel", (e) => { e.preventDefault(); const r = box.getBoundingClientRect(), [wx, wy] = toWorld(e.clientX - r.left, e.clientY - r.top); const k = Math.exp(-e.deltaY * .0015); view.scale = Math.min(5000, Math.max(.5, view.scale * k)); const [nx, ny] = toWorld(e.clientX - r.left, e.clientY - r.top); view.cx += wx - nx; view.cy += wy - ny; draw(); }, { passive: false });
  $$("[data-z]", p).forEach(b => b.onclick = () => { if (b.dataset.z === "home") view = { cx: 0, cy: 0, scale: 40 }; else view.scale *= b.dataset.z === "in" ? 1.5 : 1 / 1.5; draw(); });
  $("[data-add]", p).onclick = () => { st.fns.push({ src: "", on: true }); save(); drawList(); $$(".gfn input", p).pop().focus(); };
  $$("[data-tool]", p).forEach(b => b.onclick = () => runTool(b.dataset.tool));
  $("[data-der]", p).onclick = (e) => { showDer = !showDer; e.target.classList.toggle("on", showDer); if (showDer) out.innerHTML = "Les dérivées sont en pointillés : là où f′(x) = 0, la courbe a un sommet."; draw(); };
  $("[data-area]", p).onclick = areaTool;
  $("[data-table]", p).onclick = tableTool;
  $("[data-png]", p).onclick = () => { const a = h(`<a download="graphique-lucien.png"></a>`); a.href = cv.toDataURL("image/png"); a.click(); };
  const ro = new ResizeObserver(draw); ro.observe(box);
  C._cleanup = () => ro.disconnect();
  drawList(); draw();
} });

/* ================= Équations (avec les étapes) ================= */
CALC_MODES.push({ id: "equations", name: "Équations", ic: "fx", render(C) {
  let tab = "deg2";
  const p = C.pane;
  const tabs = [["deg1", "1er degré"], ["deg2", "2nd degré"], ["sys2", "Système 2×2"], ["sys3", "Système 3×3"], ["libre", "Équation libre"]];
  const coef = (k, v, l) => `<label class="crow" style="gap:4px"><input class="cin" data-k="${k}" value="${v}" style="width:70px;text-align:center"><span style="font:italic 16px Georgia,serif">${l}</span></label>`;
  const forms = {
    deg1: () => `<div class="crow">${coef("a", 3, "x +")}${coef("b", -6, "= 0")}</div>`,
    deg2: () => `<div class="crow">${coef("a", 1, "x² +")}${coef("b", -3, "x +")}${coef("c", 2, "= 0")}</div>`,
    sys2: () => `<div class="crow">${coef("a1", 2, "x +")}${coef("b1", 1, "y =")}${coef("c1", 5, "")}</div><div class="crow">${coef("a2", 1, "x −")}${coef("b2", 1, "y =")}${coef("c2", 1, "")}</div>`,
    sys3: () => [[1, 1, 1, 6], [2, -1, 1, 3], [1, 2, -1, 2]].map((r, i) => `<div class="crow">${coef(`m${i}0`, r[0], "x +")}${coef(`m${i}1`, r[1], "y +")}${coef(`m${i}2`, r[2], "z =")}${coef(`m${i}3`, r[3], "")}</div>`).join(""),
    libre: () => `<div class="crow"><input class="cin" data-k="eq" value="x^3 - 2x = 1" style="flex:1;font-size:17px"></div><p class="muted">Écris n'importe quelle équation en x, par exemple <b>2^x = 10</b>, <b>cos(x) = x</b> ou <b>x^3-6x^2+11x-6 = 0</b>. Lucien cherche toutes les solutions entre −100 et 100.</p>`
  };
  function draw() {
    p.innerHTML = `<div class="cbox"><div class="ctabs">${tabs.map(([k, l]) => `<button class="${k === tab ? "sel" : ""}" data-t="${k}">${l}</button>`).join("")}</div>
      <div class="ccard">${forms[tab]()}<div class="crow" style="margin-top:10px"><button class="tool on" data-go style="padding:6px 16px;font-size:14px">Résoudre</button><span class="muted">Les étapes s'affichent comme au tableau.</span></div></div><div class="steps"></div></div>`;
    $$("[data-t]", p).forEach(b => b.onclick = () => { tab = b.dataset.t; draw(); });
    $("[data-go]", p).onclick = solve;
    $$("input", p).forEach(i => i.onkeydown = (e) => e.key === "Enter" && solve());
    solve();
  }
  const v = (k) => num($(`[data-k="${k}"]`, p).value);
  const st = (html, i) => `<div class="st" style="animation-delay:${i * 90}ms">${html}</div>`;
  function solve() {
    const s = [], out = $(".steps", p);
    try {
      if (tab === "deg1") {
        const a = v("a"), b = v("b");
        s.push(`On veut résoudre <b>${F(a)}x + ${F(b)} = 0</b>.`);
        if (a === 0) s.push(b === 0 ? "a = 0 et b = 0 : tous les nombres sont solutions." : "a = 0 et b ≠ 0 : il n'y a aucune solution.");
        else { s.push(`On enlève ${F(b)} des deux côtés : ${F(a)}x = ${F(-b)}`); s.push(`On divise par ${F(a)} : x = ${F(-b)} / ${F(a)}`); const x = -b / a, fr = CalcEngine.fracHTML(x); s.push(`<b>x = ${F(x)}</b>${fr ? ` = ${fr.simple}` : ""}`); }
      }
      if (tab === "deg2") {
        const a = v("a"), b = v("b"), c = v("c");
        if (a === 0) { s.push("a = 0 : c'est une équation du 1er degré."); s.push(`x = ${F(-c / b)}`); }
        else {
          s.push(`On veut résoudre <b>${F(a)}x² + ${F(b)}x + ${F(c)} = 0</b>.`);
          const D = b * b - 4 * a * c;
          s.push(`On calcule le discriminant : Δ = b² − 4ac = (${F(b)})² − 4 × ${F(a)} × ${F(c)} = <b>${F(D)}</b>`);
          if (D > 0) { const r = Math.sqrt(D), x1 = (-b - r) / (2 * a), x2 = (-b + r) / (2 * a); s.push(`Δ > 0 : deux solutions réelles. √Δ = ${CalcEngine.exactForm(r) || F(r)}`); s.push(`x₁ = (−b − √Δ) / 2a = (${F(-b)} − ${F(r)}) / ${F(2 * a)} = <b>${F(x1)}</b>`); s.push(`x₂ = (−b + √Δ) / 2a = (${F(-b)} + ${F(r)}) / ${F(2 * a)} = <b>${F(x2)}</b>`); s.push(`Forme factorisée : ${F(a)}(x − ${F(x1)})(x − ${F(x2)})`); }
          else if (D === 0) { s.push(`Δ = 0 : une solution double. x₀ = −b / 2a = <b>${F(-b / (2 * a))}</b>`); }
          else { const re = -b / (2 * a), im = Math.sqrt(-D) / (2 * a); s.push("Δ < 0 : pas de solution réelle, mais deux solutions complexes conjuguées :"); s.push(`<b>x = ${F(re)} ± ${F(Math.abs(im))} i</b>`); }
          s.push(`Le sommet de la parabole est en (${F(-b / (2 * a))} ; ${F(c - b * b / (4 * a))}). Elle est tournée vers le ${a > 0 ? "haut" : "bas"}.`);
          s.push(`<button class="tool" data-plot="${F(a).replace(/\s/g, "")}*x^2+(${F(b).replace(/\s/g, "")})*x+(${F(c).replace(/\s/g, "")})">${svg("chart", 12)} Voir le graphique</button>`);
        }
      }
      if (tab === "sys2") {
        const a1 = v("a1"), b1 = v("b1"), c1 = v("c1"), a2 = v("a2"), b2 = v("b2"), c2 = v("c2");
        const D = a1 * b2 - a2 * b1;
        s.push(`Méthode de Cramer. Déterminant : D = a₁b₂ − a₂b₁ = ${F(a1)}×${F(b2)} − ${F(a2)}×${F(b1)} = <b>${F(D)}</b>`);
        if (D === 0) s.push("D = 0 : le système n'a pas de solution unique (droites parallèles ou confondues).");
        else { const Dx = c1 * b2 - c2 * b1, Dy = a1 * c2 - a2 * c1; s.push(`Dx = c₁b₂ − c₂b₁ = ${F(Dx)} ; Dy = a₁c₂ − a₂c₁ = ${F(Dy)}`); s.push(`x = Dx / D = <b>${F(Dx / D)}</b> ; y = Dy / D = <b>${F(Dy / D)}</b>`); s.push(`Vérification : ${F(a1)}×${F(Dx / D)} + ${F(b1)}×${F(Dy / D)} = ${F(a1 * Dx / D + b1 * Dy / D)}`); }
      }
      if (tab === "sys3") {
        const M = [0, 1, 2].map(i => [0, 1, 2, 3].map(j => v(`m${i}${j}`)));
        const g = CalcEngine.gauss(M); s.push("Méthode du pivot de Gauss :"); g.steps.forEach(x => s.push(x));
        s.push(g.sol ? `<b>x = ${F(g.sol[0])} ; y = ${F(g.sol[1])} ; z = ${F(g.sol[2])}</b>` : "Le système n'a pas de solution unique.");
      }
      if (tab === "libre") {
        const eq = $(`[data-k="eq"]`, p).value, [l, r = "0"] = eq.split("=");
        const fl = CalcEngine.compile(l), fr = CalcEngine.compile(r), f = (x) => { try { return fl({ x }) - fr({ x }); } catch { return NaN; } };
        s.push(`On cherche x tel que ${esc(l.trim())} − (${esc(r.trim())}) = 0.`);
        const roots = CalcEngine.roots(f, -100, 100, 20000);
        s.push(roots.length ? `${roots.length} solution(s) : <b>${roots.map(x => "x = " + F(+x.toFixed(10))).join(" ; ")}</b>` : "Aucune solution réelle trouvée entre −100 et 100.");
        s.push(`<span class="muted">Méthode numérique (changement de signe puis dichotomie), précision 10⁻¹⁰.</span>`);
        s.push(`<button class="tool" data-plot="(${esc(l)})-(${esc(r)})">${svg("chart", 12)} Voir le graphique</button>`);
      }
    } catch (e) { s.push("Je n'arrive pas à lire l'équation : " + esc(e.message || e)); }
    out.innerHTML = s.map(st).join("");
    $$("[data-plot]", out).forEach(b => b.onclick = () => { const g = store.get("calc.graph", null) || { fns: [], params: {} }; g.fns.unshift({ src: b.dataset.plot.replace(/,/g, "."), on: true }); store.set("calc.graph", g); C.w._onArg("graphiques"); });
  }
  draw();
} });

/* ================= Statistiques ================= */
CALC_MODES.push({ id: "statistiques", name: "Statistiques", ic: "chart", render(C) {
  const p = C.pane;
  p.innerHTML = `<div class="cbox"><div class="crow" style="align-items:stretch"><div style="flex:1;min-width:200px"><b>Série x</b><textarea class="cin" data-x rows="3" style="width:100%;resize:vertical">12 15 11 18 15 14 20 15 9 13</textarea></div>
    <div style="flex:1;min-width:200px"><b>Série y</b> <span class="muted">(facultatif, pour la régression)</span><textarea class="cin" data-y rows="3" style="width:100%;resize:vertical">30 37 28 45 36 33 50 38 22 31</textarea></div></div>
    <p class="muted" style="margin:0">Sépare les valeurs par des espaces, des points-virgules ou des retours à la ligne.</p>
    <div class="crow" style="align-items:flex-start"><div class="ccard" style="flex:1;min-width:240px"><table class="ctable" data-r></table></div>
    <div class="ccard" style="flex:1.4;min-width:280px;background:#fff"><canvas data-h height="190" style="width:100%"></canvas><canvas data-b height="70" style="width:100%"></canvas><canvas data-s height="190" style="width:100%"></canvas></div></div></div>`;
  const run = () => {
    const xs = CalcEngine.parseList($("[data-x]", p).value), ys = CalcEngine.parseList($("[data-y]", p).value), s = CalcEngine.stats(xs);
    if (!s) { $("[data-r]", p).innerHTML = "<tr><td>Saisis des valeurs.</td></tr>"; return; }
    const reg = ys.length >= 2 ? CalcEngine.regression(xs, ys) : null;
    const rows = [["Effectif n", s.n], ["Somme Σx", s.sum], ["Moyenne x̄", s.mean], ["Médiane", s.median], ["Mode", s.mode.length ? s.mode.map(F).join(" ; ") : "aucun"], ["Minimum", s.min], ["Maximum", s.max], ["Étendue", s.range], ["1er quartile Q1", s.q1], ["3e quartile Q3", s.q3], ["Écart interquartile", s.q3 - s.q1], ["Variance (population) σ²", s.varp], ["Écart-type (population) σ", s.sdp], ["Écart-type (échantillon) s", s.sds]];
    if (reg) rows.push(["Droite de régression", `y = ${F(+reg.a.toFixed(4))}x + ${F(+reg.b.toFixed(4))}`], ["Coefficient de corrélation r", +reg.r.toFixed(4)], ["r²", +(reg.r ** 2).toFixed(4)]);
    $("[data-r]", p).innerHTML = rows.map(([k, v]) => `<tr><td>${k}</td><td>${typeof v === "number" ? F(+v.toPrecision(10)) : v}</td></tr>`).join("");
    const prep = (c) => { const r = c.getBoundingClientRect(), d = devicePixelRatio || 1; c.width = r.width * d; c.height = +c.getAttribute("height") * d; const g = c.getContext("2d"); g.scale(d, d); return [g, r.width, +c.getAttribute("height")]; };
    // histogramme
    { const [g, W, H] = prep($("[data-h]", p)); const k = Math.max(3, Math.min(12, Math.ceil(Math.sqrt(s.n)))), wdt = (s.range || 1) / k, bins = Array(k).fill(0); xs.forEach(x => bins[Math.min(k - 1, Math.floor((x - s.min) / wdt))]++); const mx = Math.max(...bins);
      g.fillStyle = "#333"; g.font = "12px sans-serif"; g.fillText("Histogramme", 6, 14);
      bins.forEach((b, i) => { const bw = (W - 20) / k, bh = (H - 40) * b / mx; g.fillStyle = "#ff9f0a"; g.fillRect(10 + i * bw + 1, H - 20 - bh, bw - 2, bh); g.fillStyle = "#666"; g.font = "10px sans-serif"; g.fillText(F(+(s.min + i * wdt).toFixed(2)), 10 + i * bw, H - 6); }); }
    // boîte à moustaches
    { const [g, W, H] = prep($("[data-b]", p)); const X = (v) => 10 + (v - s.min) / (s.range || 1) * (W - 20), y = H / 2;
      g.strokeStyle = "#333"; g.lineWidth = 1.5; g.beginPath(); g.moveTo(X(s.min), y); g.lineTo(X(s.q1), y); g.moveTo(X(s.q3), y); g.lineTo(X(s.max), y); [s.min, s.max].forEach(v => { g.moveTo(X(v), y - 8); g.lineTo(X(v), y + 8); }); g.stroke();
      g.fillStyle = "#ffe0b2"; g.fillRect(X(s.q1), y - 16, X(s.q3) - X(s.q1), 32); g.strokeRect(X(s.q1), y - 16, X(s.q3) - X(s.q1), 32); g.strokeStyle = "#e8590c"; g.lineWidth = 3; g.beginPath(); g.moveTo(X(s.median), y - 16); g.lineTo(X(s.median), y + 16); g.stroke();
      g.fillStyle = "#333"; g.font = "11px sans-serif"; g.fillText("Boîte à moustaches", 6, 12); }
    // nuage de points + droite
    { const c = $("[data-s]", p); c.style.display = reg ? "" : "none"; if (reg) { const [g, W, H] = prep(c); const ymin = Math.min(...ys), ymax = Math.max(...ys), X = (v) => 30 + (v - s.min) / (s.range || 1) * (W - 45), Y = (v) => H - 20 - (v - ymin) / ((ymax - ymin) || 1) * (H - 40);
      g.fillStyle = "#333"; g.font = "12px sans-serif"; g.fillText("Nuage de points et droite de régression", 6, 14);
      g.fillStyle = "#1c7ed6"; xs.forEach((x, i) => { if (i < ys.length) { g.beginPath(); g.arc(X(x), Y(ys[i]), 4, 0, 7); g.fill(); } });
      g.strokeStyle = "#e8590c"; g.lineWidth = 2; g.beginPath(); g.moveTo(X(s.min), Y(reg.a * s.min + reg.b)); g.lineTo(X(s.max), Y(reg.a * s.max + reg.b)); g.stroke(); } }
  };
  $$("textarea", p).forEach(t => t.oninput = run);
  const ro = new ResizeObserver(run); ro.observe(p); C._cleanup = () => ro.disconnect();
  run();
} });

/* ================= Géométrie ================= */
CALC_MODES.push({ id: "geometrie", name: "Géométrie", ic: "shape", render(C) {
  const SH = {
    "Triangle (côtés)": [["a", 3], ["b", 4], ["c", 5]], "Triangle rectangle (Pythagore)": [["a (côté)", 3], ["b (côté)", 4]], "Rectangle": [["longueur", 5], ["largeur", 3]], "Carré": [["côté", 4]],
    "Cercle": [["rayon", 2]], "Trapèze": [["grande base", 6], ["petite base", 4], ["hauteur", 3]], "Parallélogramme": [["base", 5], ["hauteur", 3]], "Polygone régulier": [["nombre de côtés", 6], ["côté", 2]],
    "Cube": [["arête", 3]], "Pavé droit": [["longueur", 4], ["largeur", 3], ["hauteur", 2]], "Sphère": [["rayon", 3]], "Cylindre": [["rayon", 2], ["hauteur", 5]], "Cône": [["rayon", 2], ["hauteur", 5]], "Pyramide (base carrée)": [["côté de la base", 4], ["hauteur", 6]]
  };
  let shape = "Triangle (côtés)";
  const p = C.pane;
  function draw() {
    p.innerHTML = `<div class="cbox"><div class="crow"><select class="cin" data-s>${Object.keys(SH).map(k => `<option ${k === shape ? "selected" : ""}>${k}</option>`).join("")}</select></div>
      <div class="crow">${SH[shape].map(([l, v], i) => `<label class="crow" style="gap:6px">${l}<input class="cin" data-i="${i}" value="${v}" style="width:80px"></label>`).join("")}</div>
      <div class="crow" style="align-items:flex-start"><div class="steps" style="flex:1;min-width:240px"></div><svg data-fig width="220" height="180" viewBox="0 0 220 180" style="background:#fff;border-radius:12px;flex:none"></svg></div></div>`;
    $("[data-s]", p).onchange = (e) => { shape = e.target.value; draw(); };
    $$("[data-i]", p).forEach(i => i.oninput = calc);
    calc();
  }
  function calc() {
    const v = $$("[data-i]", p).map(i => num(i.value)), out = [], pi = Math.PI; let fig = "";
    const R = (l, f, val) => out.push(`${l} : ${f} = <b>${F(+val.toPrecision(10))}</b>`);
    switch (shape) {
      case "Triangle (côtés)": { const [a, b, c] = v; if (a + b <= c || a + c <= b || b + c <= a) { out.push("Ces longueurs ne forment pas un triangle (inégalité triangulaire)."); break; } const s = (a + b + c) / 2, A = Math.sqrt(s * (s - a) * (s - b) * (s - c)); R("Périmètre", "a + b + c", a + b + c); R("Aire (formule de Héron)", "√(s(s−a)(s−b)(s−c)) avec s = " + F(s), A); const al = Math.acos((b * b + c * c - a * a) / (2 * b * c)) * 180 / pi, be = Math.acos((a * a + c * c - b * b) / (2 * a * c)) * 180 / pi; R("Angle Â", "arccos((b²+c²−a²)/2bc)", al); R("Angle B̂", "arccos((a²+c²−b²)/2ac)", be); R("Angle Ĉ", "180° − Â − B̂", 180 - al - be); const sq = [a, b, c].sort((x, y) => x - y); if (Math.abs(sq[0] ** 2 + sq[1] ** 2 - sq[2] ** 2) < 1e-9) out.push("Ce triangle est <b>rectangle</b> (réciproque de Pythagore)."); fig = `<polygon points="20,160 200,160 ${20 + 180 * ((b * b + c * c - a * a) / (2 * c * c) || .5)},${160 - Math.min(140, 180 * 2 * A / (c * c))}" fill="#ffe0b2" stroke="#e8590c" stroke-width="2"/>`; break; }
      case "Triangle rectangle (Pythagore)": { const [a, b] = v, c = Math.hypot(a, b); R("Hypoténuse", `√(${F(a)}² + ${F(b)}²)`, c); R("Aire", "a × b / 2", a * b / 2); R("Périmètre", "a + b + c", a + b + c); R("Angle opposé à a", "arctan(a/b)", Math.atan(a / b) * 180 / pi); fig = `<polygon points="30,160 190,160 30,40" fill="#ffe0b2" stroke="#e8590c" stroke-width="2"/><rect x="30" y="146" width="14" height="14" fill="none" stroke="#e8590c"/>`; break; }
      case "Rectangle": R("Aire", "L × l", v[0] * v[1]); R("Périmètre", "2(L + l)", 2 * (v[0] + v[1])); R("Diagonale", "√(L² + l²)", Math.hypot(v[0], v[1])); fig = `<rect x="25" y="45" width="170" height="100" fill="#ffe0b2" stroke="#e8590c" stroke-width="2"/>`; break;
      case "Carré": R("Aire", "c²", v[0] ** 2); R("Périmètre", "4c", 4 * v[0]); R("Diagonale", "c√2", v[0] * Math.SQRT2); fig = `<rect x="50" y="20" width="140" height="140" fill="#ffe0b2" stroke="#e8590c" stroke-width="2"/>`; break;
      case "Cercle": R("Aire", "πr²", pi * v[0] ** 2); R("Périmètre", "2πr", 2 * pi * v[0]); R("Diamètre", "2r", 2 * v[0]); fig = `<circle cx="110" cy="90" r="70" fill="#ffe0b2" stroke="#e8590c" stroke-width="2"/><line x1="110" y1="90" x2="180" y2="90" stroke="#e8590c"/>`; break;
      case "Trapèze": R("Aire", "(B + b) × h / 2", (v[0] + v[1]) * v[2] / 2); fig = `<polygon points="15,150 205,150 160,40 60,40" fill="#ffe0b2" stroke="#e8590c" stroke-width="2"/>`; break;
      case "Parallélogramme": R("Aire", "b × h", v[0] * v[1]); fig = `<polygon points="15,150 160,150 205,40 60,40" fill="#ffe0b2" stroke="#e8590c" stroke-width="2"/>`; break;
      case "Polygone régulier": { const [n, c] = v; R("Périmètre", "n × c", n * c); R("Aire", "n c² / (4 tan(π/n))", n * c * c / (4 * Math.tan(pi / n))); R("Angle intérieur", "(n − 2) × 180° / n", (n - 2) * 180 / n); fig = `<polygon points="${Array.from({ length: Math.min(40, Math.max(3, Math.round(n))) }, (_, i, a) => `${110 + 75 * Math.cos(2 * pi * i / a.length - pi / 2)},${90 + 75 * Math.sin(2 * pi * i / a.length - pi / 2)}`).join(" ")}" fill="#ffe0b2" stroke="#e8590c" stroke-width="2"/>`; break; }
      case "Cube": R("Volume", "a³", v[0] ** 3); R("Aire totale", "6a²", 6 * v[0] ** 2); R("Diagonale", "a√3", v[0] * Math.sqrt(3)); fig = `<g fill="#ffe0b2" stroke="#e8590c" stroke-width="2"><polygon points="40,60 150,60 150,170 40,170"/><polygon points="40,60 80,20 190,20 150,60"/><polygon points="150,60 190,20 190,130 150,170"/></g>`; break;
      case "Pavé droit": { const [L, l, hh] = v; R("Volume", "L × l × h", L * l * hh); R("Aire totale", "2(Ll + Lh + lh)", 2 * (L * l + L * hh + l * hh)); R("Diagonale", "√(L² + l² + h²)", Math.hypot(L, l, hh)); fig = `<g fill="#ffe0b2" stroke="#e8590c" stroke-width="2"><polygon points="20,80 160,80 160,165 20,165"/><polygon points="20,80 60,40 200,40 160,80"/><polygon points="160,80 200,40 200,125 160,165"/></g>`; break; }
      case "Sphère": R("Volume", "4/3 πr³", 4 / 3 * pi * v[0] ** 3); R("Aire", "4πr²", 4 * pi * v[0] ** 2); fig = `<circle cx="110" cy="90" r="70" fill="#ffe0b2" stroke="#e8590c" stroke-width="2"/><ellipse cx="110" cy="90" rx="70" ry="18" fill="none" stroke="#e8590c" stroke-dasharray="4 3"/>`; break;
      case "Cylindre": R("Volume", "πr²h", pi * v[0] ** 2 * v[1]); R("Aire totale", "2πr(r + h)", 2 * pi * v[0] * (v[0] + v[1])); fig = `<g fill="#ffe0b2" stroke="#e8590c" stroke-width="2"><rect x="50" y="35" width="120" height="115"/><ellipse cx="110" cy="150" rx="60" ry="15"/><ellipse cx="110" cy="35" rx="60" ry="15"/></g>`; break;
      case "Cône": { const [r, hh] = v, g = Math.hypot(r, hh); R("Volume", "πr²h / 3", pi * r * r * hh / 3); R("Génératrice", "√(r² + h²)", g); R("Aire totale", "πr(r + g)", pi * r * (r + g)); fig = `<g fill="#ffe0b2" stroke="#e8590c" stroke-width="2"><polygon points="110,15 50,150 170,150"/><ellipse cx="110" cy="150" rx="60" ry="15"/></g>`; break; }
      case "Pyramide (base carrée)": { const [c, hh] = v; R("Volume", "c² × h / 3", c * c * hh / 3); const ap = Math.hypot(c / 2, hh); R("Apothème", "√((c/2)² + h²)", ap); R("Aire totale", "c² + 2c × apothème", c * c + 2 * c * ap); fig = `<g fill="#ffe0b2" stroke="#e8590c" stroke-width="2"><polygon points="110,15 30,150 150,150"/><polygon points="110,15 150,150 200,115"/></g>`; break; }
    }
    $(".steps", p).innerHTML = out.map((x, i) => `<div class="st" style="animation-delay:${i * 60}ms">${x}</div>`).join("");
    $("[data-fig]", p).innerHTML = fig;
  }
  draw();
} });
