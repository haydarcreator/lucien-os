/* Lucien Office — Lucien Carnet (prise de notes), Lucien Tâches, Lucien Formulaires */
"use strict";

/* ================= Lucien Carnet ================= */
function CarnetApp(body, w) {
  const N = store.get("carnet", null) || { sections: [
    { id: 1, n: "Cours", c: "#7048e8", pages: [{ id: 11, t: "Mathématiques", d: Date.now(), boxes: [{ x: 40, y: 30, w: 420, html: "<h2>Théorème de Pythagore</h2><p>Dans un triangle rectangle : <b>a² + b² = c²</b></p><p>Astuce : vérifie-le avec Lucien Calculator, mode Géométrie.</p>" }, { x: 40, y: 190, w: 300, html: '<p><label><input type="checkbox"> Faire les exercices p. 42</label></p><p><label><input type="checkbox" checked> Relire le cours</label></p>' }], ink: [] }] },
    { id: 2, n: "Idées", c: "#e8590c", pages: [{ id: 21, t: "Projets", d: Date.now(), boxes: [{ x: 40, y: 30, w: 360, html: "<p>Clique n'importe où sur la page pour écrire. Utilise l'onglet <b>Dessiner</b> pour prendre des notes à la main.</p>" }], ink: [] }] }
  ], nextId: 100 };
  const save = debounce(() => store.set("carnet", N), 300);
  let sec = N.sections[0], page = sec.pages[0], tab = "Accueil", pen = null;
  const COLORS = ["#7048e8", "#e8590c", "#2b8a3e", "#1c7ed6", "#e03131", "#0c8599", "#f08c00"];
  body.innerHTML = `<div class="off carnet" style="--oc:#7719aa"><div class="otop"><span class="tt">Lucien Carnet</span></div>
    <div class="otabs">${["Accueil", "Insertion", "Dessiner", "Affichage"].map(t => `<button class="otab" data-t="${t}">${t}</button>`).join("")}</div><div class="oribbon"></div>
    <div class="ocontent"><div class="nsec"></div><div class="npages"></div><div class="nscroll"><div class="npage"><input class="ntitle" placeholder="Titre de la page"><div class="ndate"></div><canvas class="nink"></canvas><div class="nboxes"></div></div></div></div></div>`;
  const R = $(".oribbon", body), secEl = $(".nsec", body), pagesEl = $(".npages", body), pg = $(".npage", body), boxesEl = $(".nboxes", body), ink = $(".nink", body), title = $(".ntitle", body);
  const RIB = {
    "Accueil": [["Police", [[["let", "<b>G</b>", "bold", "Gras"], ["let", "<i>I</i>", "italic", "Italique"], ["let", "<u>S</u>", "underline", "Souligné"], ["let", "<s>ab</s>", "strikeThrough", "Barré"], ["color", "highlight", "hiliteColor", "#fff59d", "Surligner"], ["color", "fcolor", "foreColor", "#e03131", "Couleur"]]]], ["Paragraphe", [[["btn", "ul", null, "insertUnorderedList", "Puces"], ["btn", "ol", null, "insertOrderedList", "Numéros"], ["btn", "alignL", null, "justifyLeft"], ["btn", "alignC", null, "justifyCenter"]]]],
      ["Styles", ["gal", "style", [["h1", "Titre 1", "font-size:15px;font-weight:700"], ["h2", "Titre 2", "font-weight:600"], ["p", "Normal"], ["blockquote", "<i>Citation</i>"]]]], ["Indicateurs", ["big", "check", "À faire", "todo"], ["big", "star", "Important", "important"], ["big", "comment", "Question", "question"]]],
    "Insertion": [["Insérer", ["big", "textbox", "Zone de texte", "box"], ["big", "table", "Tableau", "table"], ["big", "image", "Image", "image"], ["big", "link", "Lien", "link"], ["big", "clock", "Date", "date"], ["big", "fx", "Équation", "equation"]]],
    "Dessiner": [["Outils", ["big", "select", "Sélection", "pen-off"], ["big", "pen", "Stylo", "pen-pen"], ["big", "highlight", "Surligneur", "pen-hl"], ["big", "x", "Gomme", "pen-erase"], ["color", "palette", "inkColor", "#1c7ed6", "Couleur du stylo"], ["big", "trash", "Tout effacer", "ink-clear"]]],
    "Affichage": [["Page", ["big", "gridl", "Lignes", "lines"], ["big", "palette", "Couleur de page", "pagecolor"]], ["Zoom", ["big", "zoomin", "Zoom +", "zin"], ["big", "zoomout", "Zoom -", "zout"]]]
  };
  let inkColor = "#1c7ed6", zoom = 1;
  function ribbon() {
    $$(".otab", body).forEach(b => b.classList.toggle("sel", b.dataset.t === tab));
    R.innerHTML = ribbonHTML(RIB[tab]); R.classList.remove("swap"); void R.offsetWidth; R.classList.add("swap");
    $$("button[data-c]", R).forEach(b => { b.onmousedown = (e) => e.preventDefault(); b.onclick = () => cmd(b.dataset.c, b.dataset.v); });
    $$("input[data-c]", R).forEach(i => i.onchange = () => cmd(i.dataset.c, i.value));
    $$(`[data-c^="pen-"]`, R).forEach(b => b.classList.toggle("on", b.dataset.c === "pen-" + (pen || "off")));
  }
  $$(".otab", body).forEach(b => b.onclick = () => { tab = b.dataset.t; ribbon(); });
  function drawNav() {
    secEl.innerHTML = N.sections.map(s => `<div class="nst ${s === sec ? "sel" : ""}" data-s="${s.id}" style="--c:${s.c}">${esc(s.n)}</div>`).join("") + `<div class="nst add" data-adds>${svg("plus", 13)} Section</div>`;
    pagesEl.innerHTML = sec.pages.map(p => `<div class="npi ${p === page ? "sel" : ""}" data-p="${p.id}"><b>${esc(p.t || "Sans titre")}</b><small>${new Date(p.d).toLocaleDateString(locale())}</small></div>`).join("") + `<div class="npi add" data-addp>${svg("plus", 13)} Ajouter une page</div>`;
    $$("[data-s]", secEl).forEach(e => { e.onclick = () => { sec = N.sections.find(s => s.id === +e.dataset.s); page = sec.pages[0]; drawNav(); drawPage(); }; e.oncontextmenu = (ev) => ctxMenu(ev, [["Renommer", async () => { const r = await dialog(w, "Renommer la section", [{ k: "n", l: "Nom", v: sec.n }]); if (r) { sec.n = r.n; save(); drawNav(); } }, { ic: "pen" }], ["Supprimer", () => { if (N.sections.length > 1) { N.sections = N.sections.filter(s => s !== sec); sec = N.sections[0]; page = sec.pages[0]; save(); drawNav(); drawPage(); } }, { ic: "trash" }]]); });
    $("[data-adds]", secEl).onclick = async () => { const r = await dialog(w, "Nouvelle section", [{ k: "n", l: "Nom de la section", v: "Nouvelle section" }], "Créer"); if (!r) return; sec = { id: N.nextId++, n: r.n, c: COLORS[N.sections.length % COLORS.length], pages: [] }; N.sections.push(sec); addPage(); };
    $$("[data-p]", pagesEl).forEach(e => { e.onclick = () => { page = sec.pages.find(p => p.id === +e.dataset.p); drawNav(); drawPage(); }; e.oncontextmenu = (ev) => ctxMenu(ev, [["Supprimer la page", () => { sec.pages = sec.pages.filter(p => p.id !== +e.dataset.p); page = sec.pages[0]; if (!page) addPage(); save(); drawNav(); drawPage(); }, { ic: "trash" }]]); });
    $("[data-addp]", pagesEl).onclick = addPage;
  }
  function addPage() { page = { id: N.nextId++, t: "", d: Date.now(), boxes: [], ink: [] }; sec.pages.push(page); save(); drawNav(); drawPage(); title.focus(); }
  function drawPage() {
    if (!page) { pg.style.display = "none"; return; } pg.style.display = "";
    title.value = page.t; $(".ndate", body).textContent = new Date(page.d).toLocaleString(locale(), { dateStyle: "full", timeStyle: "short" });
    pg.style.background = page.bg || ""; pg.classList.toggle("lines", !!page.lines);
    boxesEl.innerHTML = "";
    page.boxes.forEach((b, i) => boxesEl.append(boxEl(b, i)));
    redrawInk();
  }
  function boxEl(b) {
    const el = h(`<div class="nbox" style="left:${b.x}px;top:${b.y}px;width:${b.w}px"><div class="ngrip"></div><div class="ntext" contenteditable="true">${b.html}</div></div>`);
    const t = $(".ntext", el);
    t.oninput = () => { b.html = t.innerHTML; save(); };
    t.onblur = () => { if (!t.innerText.trim() && !t.querySelector("img,table,input")) { page.boxes = page.boxes.filter(x => x !== b); el.remove(); save(); } };
    el.addEventListener("change", () => { b.html = t.innerHTML; save(); });
    $(".ngrip", el).onpointerdown = (e) => { e.preventDefault(); const sx = e.clientX, sy = e.clientY, ox = b.x, oy = b.y; const mv = (ev) => { b.x = Math.max(0, ox + (ev.clientX - sx) / zoom); b.y = Math.max(0, oy + (ev.clientY - sy) / zoom); el.style.left = b.x + "px"; el.style.top = b.y + "px"; }; const up = () => { removeEventListener("pointermove", mv); removeEventListener("pointerup", up); save(); }; addEventListener("pointermove", mv); addEventListener("pointerup", up); };
    return el;
  }
  title.oninput = () => { page.t = title.value; save(); drawNavSoon(); };
  const drawNavSoon = debounce(drawNav, 400);
  // clic sur la page : nouvelle zone de texte (comme dans OneNote)
  boxesEl.addEventListener("pointerdown", (e) => {
    if (pen || e.target !== boxesEl) return;
    const r = boxesEl.getBoundingClientRect(), b = { x: (e.clientX - r.left) / zoom, y: (e.clientY - r.top) / zoom - 10, w: 320, html: "" };
    page.boxes.push(b); const el = boxEl(b); boxesEl.append(el); setTimeout(() => $(".ntext", el).focus(), 0); e.preventDefault();
  });
  /* encre */
  function redrawInk() {
    const W = pg.clientWidth, H = Math.max(pg.clientHeight, 900), d = devicePixelRatio || 1;
    ink.width = W * d; ink.height = H * d; ink.style.width = W + "px"; ink.style.height = H + "px";
    const g = ink.getContext("2d"); g.setTransform(d, 0, 0, d, 0, 0); g.lineCap = g.lineJoin = "round";
    page.ink.forEach(s => { g.strokeStyle = s.c; g.lineWidth = s.w; g.globalAlpha = s.a || 1; g.beginPath(); s.p.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.stroke(); });
    g.globalAlpha = 1; ink.style.pointerEvents = pen ? "auto" : "none"; ink.style.cursor = pen === "erase" ? "cell" : "crosshair";
  }
  ink.addEventListener("pointerdown", (e) => {
    if (!pen) return; ink.setPointerCapture(e.pointerId);
    const r = ink.getBoundingClientRect(), P = (ev) => [(ev.clientX - r.left) / zoom, (ev.clientY - r.top) / zoom];
    if (pen === "erase") { const er = (ev) => { const [x, y] = P(ev); const before = page.ink.length; page.ink = page.ink.filter(s => !s.p.some(([a, b]) => Math.hypot(a - x, b - y) < 10)); if (page.ink.length !== before) redrawInk(); }; er(e); ink.onpointermove = er; ink.onpointerup = () => { ink.onpointermove = null; save(); }; return; }
    const s = { c: pen === "hl" ? "#ffeb3b" : inkColor, w: pen === "hl" ? 16 : 2.5, a: pen === "hl" ? .45 : 1, p: [P(e)] }; page.ink.push(s);
    ink.onpointermove = (ev) => { s.p.push(P(ev)); redrawInk(); };
    ink.onpointerup = () => { ink.onpointermove = null; save(); };
  });
  async function cmd(c, v) {
    if (["bold", "italic", "underline", "strikeThrough", "insertUnorderedList", "insertOrderedList", "justifyLeft", "justifyCenter"].includes(c)) return document.execCommand(c);
    if (c === "hiliteColor" || c === "foreColor") { document.execCommand("styleWithCSS", false, true); return document.execCommand(c, false, v); }
    if (c === "style") return document.execCommand("formatBlock", false, v);
    const ins = (html) => { if (document.activeElement?.classList.contains("ntext")) document.execCommand("insertHTML", false, html); else { const b = { x: 40, y: 40 + page.boxes.length * 30, w: 360, html }; page.boxes.push(b); boxesEl.append(boxEl(b)); } save(); };
    switch (c) {
      case "todo": return ins('<label><input type="checkbox"> </label>&nbsp;');
      case "important": return ins('<span class="ntag imp">Important</span>&nbsp;');
      case "question": return ins('<span class="ntag q">Question</span>&nbsp;');
      case "box": return ins("<p>Nouvelle note</p>");
      case "table": return ins('<table class="ntab"><tr><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td></tr><tr><td>&nbsp;</td><td>&nbsp;</td><td>&nbsp;</td></tr></table>');
      case "image": { const i = h(`<input type="file" accept="image/*">`); i.onchange = () => { const r = new FileReader(); r.onload = () => ins(`<img src="${r.result}" style="max-width:100%">`); r.readAsDataURL(i.files[0]); }; i.click(); return; }
      case "link": { const r = await dialog(w, "Lien", [{ k: "u", l: "Adresse", v: "https://" }]); if (r) ins(`<a href="${esc(r.u)}" target="_blank" rel="noopener">${esc(r.u)}</a>`); return; }
      case "date": return ins(new Date().toLocaleString(locale(), { dateStyle: "long", timeStyle: "short" }));
      case "equation": { const r = await dialog(w, "Équation", [{ k: "e", l: "Calcul (le résultat est ajouté)", v: "2^10 + √144" }], "Insérer"); if (r) { let res; try { res = calcFmt(CalcEngine.evaluate(r.e)); } catch { res = "?"; } ins(`<span class="neq">${esc(r.e)} = <b>${res}</b></span>&nbsp;`); } return; }
      case "inkColor": inkColor = v; return;
      case "ink-clear": page.ink = []; save(); return redrawInk();
      case "lines": page.lines = !page.lines; save(); return drawPage();
      case "pagecolor": { const r = await dialog(w, "Couleur de page", [{ k: "c", l: "Couleur", type: "select", o: ["Blanc", "Crème", "Bleu clair", "Vert clair", "Rose"] }]); if (r) { page.bg = { Blanc: "", "Crème": "#fdf6e3", "Bleu clair": "#e7f5ff", "Vert clair": "#ebfbee", Rose: "#fff0f6" }[r.c]; save(); drawPage(); } return; }
      case "zin": case "zout": zoom = Math.max(.5, Math.min(2, zoom + (c === "zin" ? .1 : -.1))); pg.style.zoom = zoom; return;
    }
    if (c.startsWith("pen-")) { pen = c === "pen-off" ? null : c.slice(4); ribbon(); redrawInk(); }
  }
  const ro = new ResizeObserver(() => redrawInk()); ro.observe(pg); w._cleanup = () => ro.disconnect();
  ribbon(); drawNav(); drawPage();
}

/* ================= Lucien Tâches ================= */
function TachesApp(body) {
  const T = store.get("taches", null) || { lists: [{ id: "perso", n: "Tâches", c: "#1c7ed6" }, { id: "ecole", n: "École", c: "#e8590c" }], items: [
    { id: 1, t: "Essayer Lucien Calculator", l: "perso", done: false, imp: true, due: new Date().toISOString().slice(0, 10), myday: true, note: "" },
    { id: 2, t: "Réviser les équations du 2nd degré", l: "ecole", done: false, imp: false, due: "", myday: true, note: "Mode Équations de Lucien Calculator" },
    { id: 3, t: "Installer Lucien OS sur le Raspberry Pi 5", l: "perso", done: true, imp: false, due: "", myday: false, note: "" }], nextId: 100 };
  const save = () => store.set("taches", T);
  let cur = "myday", sel = null;
  const SMART = [["myday", "Ma journée", "sun"], ["imp", "Important", "star"], ["plan", "Planifié", "clock"], ["all", "Toutes", "ul"]];
  const filter = (it) => cur === "myday" ? it.myday : cur === "imp" ? it.imp : cur === "plan" ? !!it.due : cur === "all" ? true : it.l === cur;
  function draw() {
    const name = (SMART.find(s => s[0] === cur) || [, (T.lists.find(l => l.id === cur) || {}).n])[1];
    const items = T.items.filter(filter), open = items.filter(i => !i.done), done = items.filter(i => i.done);
    const it = T.items.find(i => i.id === sel);
    body.innerHTML = `<div class="todo"><div class="tside">${SMART.map(([k, l, ic]) => `<div class="si ${k === cur ? "sel" : ""}" data-l="${k}">${svg(ic, 15)}<span class="lbl">${l}</span><small>${T.items.filter(i => !i.done && (k === "myday" ? i.myday : k === "imp" ? i.imp : k === "plan" ? !!i.due : true)).length || ""}</small></div>`).join("")}<hr>
      ${T.lists.map(l => `<div class="si ${l.id === cur ? "sel" : ""}" data-l="${l.id}"><span class="ldot" style="background:${l.c}"></span><span class="lbl">${esc(l.n)}</span><small>${T.items.filter(i => i.l === l.id && !i.done).length || ""}</small></div>`).join("")}<div class="si" data-newl>${svg("plus", 15)}<span class="lbl">Nouvelle liste</span></div></div>
      <div class="tmain"><h1>${esc(name)}</h1>${cur === "myday" ? `<p class="muted">${new Date().toLocaleDateString(locale(), { weekday: "long", day: "numeric", month: "long" })}</p>` : ""}
      <form class="tadd">${svg("plus", 16)}<input placeholder="Ajouter une tâche" aria-label="Ajouter une tâche"></form>
      <div class="titems">${open.map(row).join("")}</div>${done.length ? `<h4 class="muted">Terminées (${done.length})</h4><div class="titems">${done.map(row).join("")}</div>` : ""}</div>
      ${it ? `<div class="tdet"><div class="tdrow"><button class="tchk ${it.done ? "on" : ""}" data-chk="${it.id}">${svg("check", 13, 3)}</button><input class="txt" data-f="t" value="${esc(it.t)}" style="flex:1;font-size:15px"></div>
        <button class="btn ghost" data-f="myday">${svg("sun", 14)} ${it.myday ? "Retirer de Ma journée" : "Ajouter à Ma journée"}</button>
        <label>Échéance<input class="txt" type="date" data-f="due" value="${it.due}"></label>
        <label>Liste<select class="txt" data-f="l">${T.lists.map(l => `<option value="${l.id}" ${l.id === it.l ? "selected" : ""}>${esc(l.n)}</option>`).join("")}</select></label>
        <label>Note<textarea class="txt" data-f="note" rows="4">${esc(it.note)}</textarea></label>
        <div style="flex:1"></div><button class="btn ghost" data-del>${svg("trash", 14)} Supprimer la tâche</button></div>` : ""}</div>`;
    $$("[data-l]", body).forEach(e => e.onclick = () => { cur = e.dataset.l; sel = null; draw(); });
    $("[data-newl]", body).onclick = async () => { const r = await dialog(body.closest(".win"), "Nouvelle liste", [{ k: "n", l: "Nom", v: "Courses" }], "Créer"); if (r && r.n) { const l = { id: "l" + T.nextId++, n: r.n, c: GCOLORS[T.lists.length % 8] }; T.lists.push(l); cur = l.id; save(); draw(); } };
    $(".tadd", body).onsubmit = (e) => { e.preventDefault(); const v = $(".tadd input", body).value.trim(); if (!v) return; T.items.unshift({ id: T.nextId++, t: v, l: T.lists.some(l => l.id === cur) ? cur : "perso", done: false, imp: cur === "imp", due: cur === "plan" ? new Date().toISOString().slice(0, 10) : "", myday: cur === "myday", note: "" }); save(); draw(); $(".tadd input", body).focus(); };
    $$("[data-chk]", body).forEach(b => b.onclick = (e) => { e.stopPropagation(); const i = T.items.find(x => x.id === +b.dataset.chk); i.done = !i.done; save(); if (i.done) { b.classList.add("on", "pop"); notify("taches", "Bravo !", "Tâche terminée : " + i.t); setTimeout(draw, 380); } else draw(); });
    $$("[data-star]", body).forEach(b => b.onclick = (e) => { e.stopPropagation(); const i = T.items.find(x => x.id === +b.dataset.star); i.imp = !i.imp; save(); draw(); });
    $$(".trow", body).forEach(r => r.onclick = () => { sel = sel === +r.dataset.id ? null : +r.dataset.id; draw(); });
    if (it) {
      $$("[data-f]", body).forEach(f => { const k = f.dataset.f; if (k === "myday") f.onclick = () => { it.myday = !it.myday; save(); draw(); }; else f.onchange = () => { it[k] = f.value; save(); draw(); }; });
      $("[data-del]", body).onclick = () => { T.items = T.items.filter(x => x !== it); sel = null; save(); draw(); };
    }
  }
  const row = (i) => { const l = T.lists.find(x => x.id === i.l); const late = i.due && !i.done && i.due < new Date().toISOString().slice(0, 10); return `<div class="trow ${i.done ? "done" : ""} ${i.id === sel ? "sel" : ""}" data-id="${i.id}"><button class="tchk ${i.done ? "on" : ""}" data-chk="${i.id}" aria-label="Terminer">${svg("check", 13, 3)}</button><div class="tt2"><span>${esc(i.t)}</span><small class="muted">${l ? esc(l.n) : ""}${i.due ? ` · <span style="${late ? "color:#e03131" : ""}">${svg("clock", 11)} ${new Date(i.due + "T00:00").toLocaleDateString(locale(), { day: "numeric", month: "short" })}</span>` : ""}${i.myday ? ` · ${svg("sun", 11)} Ma journée` : ""}${i.note ? ` · ${svg("note", 11)}` : ""}</small></div><button class="tstar ${i.imp ? "on" : ""}" data-star="${i.id}" aria-label="Important">${svg("star", 16)}</button></div>`; };
  draw();
}

/* ================= Lucien Formulaires ================= */
function FormulairesApp(body, w) {
  const FS2 = store.get("forms", null) || { forms: [{ id: 1, t: "Sondage : ma matière préférée", d: "Réponds en 30 secondes !", qs: [
    { id: 1, k: "choix", t: "Quelle est ta matière préférée ?", o: ["Mathématiques", "Français", "Sciences", "Histoire", "Sport"], req: true },
    { id: 2, k: "note", t: "Note Lucien Calculator sur 5", o: [], req: false },
    { id: 3, k: "texte", t: "Une idée pour améliorer Lucien OS ?", o: [], req: false }], rep: [{ 1: "Mathématiques", 2: 5, 3: "Encore plus de graphiques" }, { 1: "Sciences", 2: 4, 3: "" }, { 1: "Mathématiques", 2: 5, 3: "" }] }], nextId: 100 };
  const save = () => store.set("forms", FS2);
  let form = null, mode = "list";
  const KINDS = { choix: "Choix unique", multi: "Cases à cocher", texte: "Réponse courte", long: "Paragraphe", note: "Note (étoiles)", date: "Date", nombre: "Nombre" };
  function draw() {
    if (mode === "list" || !form) {
      body.innerHTML = `<div class="forms"><div class="fhead"><h1>Mes formulaires</h1><button class="btn" data-new>${svg("plus", 14)} Nouveau formulaire</button><button class="btn ghost" data-quiz>${svg("sparkle", 14)} Nouveau quiz</button></div>
        <div class="apps">${FS2.forms.map((f, i) => `<div class="appc" data-f="${f.id}" style="cursor:pointer;animation-delay:${i * 40}ms"><div class="icon t-av">${svg("check")}</div><div class="info"><b>${esc(f.t)}</b><small>${f.qs.length} question(s) · ${f.rep.length} réponse(s)</small></div></div>`).join("")}</div></div>`;
      $$("[data-f]", body).forEach(c => c.onclick = () => { form = FS2.forms.find(f => f.id === +c.dataset.f); mode = "edit"; draw(); });
      const mk = (quiz) => { form = { id: FS2.nextId++, t: quiz ? "Quiz sans titre" : "Formulaire sans titre", d: "", quiz, qs: [{ id: 1, k: "choix", t: "Question 1", o: ["Option 1", "Option 2"], req: false, ok: quiz ? "Option 1" : undefined }], rep: [] }; FS2.forms.unshift(form); save(); mode = "edit"; draw(); };
      $("[data-new]", body).onclick = () => mk(false); $("[data-quiz]", body).onclick = () => mk(true);
      return;
    }
    const tabs = `<div class="fhead"><button class="ob" data-back>${svg("back", 16)} Mes formulaires</button><div class="ctabs" style="margin:auto">${[["edit", "Questions"], ["fill", "Aperçu / répondre"], ["res", `Réponses (${form.rep.length})`]].map(([k, l]) => `<button class="${k === mode ? "sel" : ""}" data-m="${k}">${l}</button>`).join("")}</div><button class="btn ghost" data-dl>${svg("download", 14)} Exporter CSV</button></div>`;
    if (mode === "edit") {
      body.innerHTML = `<div class="forms">${tabs}<div class="fpaper"><div class="fq ftop"><input class="ftitle" value="${esc(form.t)}" data-k="t"><input class="txt" placeholder="Description" value="${esc(form.d)}" data-k="d" style="width:100%"></div>
        ${form.qs.map((q, i) => `<div class="fq" data-q="${i}"><div class="crow"><input class="txt" value="${esc(q.t)}" data-qt style="flex:1;font-size:15px"><select class="txt" data-qk>${Object.entries(KINDS).map(([k, l]) => `<option value="${k}" ${k === q.k ? "selected" : ""}>${l}</option>`).join("")}</select></div>
          ${q.k === "choix" || q.k === "multi" ? `<div class="fopts">${q.o.map((o, j) => `<div class="crow"><span class="fmark ${q.k}"></span><input class="txt" value="${esc(o)}" data-o="${j}" style="flex:1">${form.quiz ? `<label class="muted"><input type="radio" name="ok${i}" data-ok="${j}" ${q.ok === o ? "checked" : ""}> bonne réponse</label>` : ""}<button class="x" data-ro="${j}">${svg("x", 13)}</button></div>`).join("")}<button class="ob" data-ao>${svg("plus", 13)} Ajouter une option</button></div>` : `<p class="muted">${KINDS[q.k]}</p>`}
          <div class="crow" style="justify-content:flex-end"><label class="muted"><input type="checkbox" data-req ${q.req ? "checked" : ""}> Obligatoire</label><button class="ob" data-dup>${svg("dup", 14)}</button><button class="ob" data-del>${svg("trash", 14)}</button></div></div>`).join("")}
        <button class="btn" data-aq>${svg("plus", 14)} Ajouter une question</button></div></div>`;
      $$("[data-k]", body).forEach(i => i.oninput = () => { form[i.dataset.k] = i.value; save(); });
      $$(".fq[data-q]", body).forEach(el => {
        const q = form.qs[+el.dataset.q];
        $("[data-qt]", el).oninput = (e) => { q.t = e.target.value; save(); };
        $("[data-qk]", el).onchange = (e) => { q.k = e.target.value; if ((q.k === "choix" || q.k === "multi") && !q.o.length) q.o = ["Option 1", "Option 2"]; save(); draw(); };
        $$("[data-o]", el).forEach(o => o.oninput = () => { const old = q.o[+o.dataset.o]; q.o[+o.dataset.o] = o.value; if (q.ok === old) q.ok = o.value; save(); });
        $$("[data-ok]", el).forEach(o => o.onchange = () => { q.ok = q.o[+o.dataset.ok]; save(); });
        $$("[data-ro]", el).forEach(b => b.onclick = () => { q.o.splice(+b.dataset.ro, 1); save(); draw(); });
        $("[data-ao]", el) && ($("[data-ao]", el).onclick = () => { q.o.push("Option " + (q.o.length + 1)); save(); draw(); });
        $("[data-req]", el).onchange = (e) => { q.req = e.target.checked; save(); };
        $("[data-dup]", el).onclick = () => { form.qs.splice(+el.dataset.q + 1, 0, { ...clone(q), id: FS2.nextId++ }); save(); draw(); };
        $("[data-del]", el).onclick = () => { form.qs.splice(+el.dataset.q, 1); save(); draw(); };
      });
      $("[data-aq]", body).onclick = () => { form.qs.push({ id: FS2.nextId++, k: "choix", t: "Nouvelle question", o: ["Option 1", "Option 2"], req: false }); save(); draw(); };
    }
    if (mode === "fill") {
      body.innerHTML = `<div class="forms">${tabs}<form class="fpaper"><div class="fq ftop"><h2 style="margin:0">${esc(form.t)}</h2><p class="muted">${esc(form.d)}</p></div>
        ${form.qs.map(q => `<div class="fq"><b>${esc(q.t)}${q.req ? ' <span style="color:#e03131">*</span>' : ""}</b><div style="margin-top:8px">${
          q.k === "choix" ? q.o.map(o => `<label class="fopt"><input type="radio" name="q${q.id}" value="${esc(o)}" ${q.req ? "required" : ""}> ${esc(o)}</label>`).join("") :
          q.k === "multi" ? q.o.map(o => `<label class="fopt"><input type="checkbox" name="q${q.id}" value="${esc(o)}"> ${esc(o)}</label>`).join("") :
          q.k === "note" ? `<div class="stars" data-st="${q.id}">${[1, 2, 3, 4, 5].map(n => `<button type="button" data-n="${n}">${svg("star", 26)}</button>`).join("")}<input type="hidden" name="q${q.id}"></div>` :
          q.k === "long" ? `<textarea class="txt" name="q${q.id}" rows="3" style="width:100%" ${q.req ? "required" : ""}></textarea>` :
          `<input class="txt" type="${q.k === "date" ? "date" : q.k === "nombre" ? "number" : "text"}" name="q${q.id}" style="width:100%" ${q.req ? "required" : ""}>`}</div></div>`).join("")}
        <button class="btn">Envoyer</button></form></div>`;
      $$("[data-st]", body).forEach(s => $$("button", s).forEach(b => b.onclick = () => { $("input", s).value = b.dataset.n; $$("button", s).forEach(x => x.classList.toggle("on", +x.dataset.n <= +b.dataset.n)); }));
      $("form.fpaper", body).onsubmit = (e) => {
        e.preventDefault(); const fd = new FormData(e.target), r = {}; let score = 0;
        form.qs.forEach(q => { const v = q.k === "multi" ? fd.getAll("q" + q.id).join(", ") : fd.get("q" + q.id); r[q.id] = q.k === "note" || q.k === "nombre" ? (v ? +v : "") : v || ""; if (form.quiz && q.ok && v === q.ok) score++; });
        form.rep.push(r); save();
        const nq = form.qs.filter(q => q.ok).length;
        $("form.fpaper", body).innerHTML = `<div class="fq ftop" style="text-align:center;animation:popin .4s var(--spring)">${svg("check", 46, 2.4)}<h2>Merci, votre réponse a été enregistrée.</h2>${form.quiz ? `<p style="font-size:20px">Score : <b>${score} / ${nq}</b></p>` : ""}<button class="btn" type="button" data-again>Envoyer une autre réponse</button></div>`;
        $("[data-again]", body).onclick = draw;
      };
    }
    if (mode === "res") {
      body.innerHTML = `<div class="forms">${tabs}<div class="fpaper"><div class="fq ftop"><h2 style="margin:0">${form.rep.length} réponse(s)</h2></div>${form.qs.map(q => {
        const vals = form.rep.map(r => r[q.id]).filter(v => v !== "" && v != null);
        if (q.k === "choix" || q.k === "multi") { const cnt = {}; q.o.forEach(o => cnt[o] = 0); vals.forEach(v => String(v).split(", ").forEach(x => cnt[x] = (cnt[x] || 0) + 1)); const mx = Math.max(1, ...Object.values(cnt)); return `<div class="fq"><b>${esc(q.t)}</b>${Object.entries(cnt).map(([o, n], i) => `<div class="fbar"><span>${esc(o)}</span><div><i style="width:${n / mx * 100}%;background:${GCOLORS[i % 8]}"></i></div><b>${n}</b></div>`).join("")}</div>`; }
        if (q.k === "note" || q.k === "nombre") { const s = CalcEngine.stats(vals.map(Number)); return `<div class="fq"><b>${esc(q.t)}</b><p>${s ? `Moyenne <b>${F(+s.mean.toFixed(2))}</b> · min ${F(s.min)} · max ${F(s.max)} · ${s.n} réponse(s)` : "Aucune réponse"}</p></div>`; }
        return `<div class="fq"><b>${esc(q.t)}</b>${vals.map(v => `<p class="fans">${esc(v)}</p>`).join("") || '<p class="muted">Aucune réponse</p>'}</div>`;
      }).join("")}</div></div>`;
    }
    $("[data-back]", body).onclick = () => { mode = "list"; draw(); };
    $$("[data-m]", body).forEach(b => b.onclick = () => { mode = b.dataset.m; draw(); });
    $("[data-dl]", body).onclick = () => { const head = form.qs.map(q => `"${q.t.replace(/"/g, '""')}"`).join(";"); const rows = form.rep.map(r => form.qs.map(q => `"${String(r[q.id] ?? "").replace(/"/g, '""')}"`).join(";")); downloadFile(form.t + ".csv", "text/csv", "﻿" + [head, ...rows].join("\r\n")); };
  }
  draw();
}
