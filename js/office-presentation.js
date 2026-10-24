/* Lucien Office — Lucien Présentation (diapositives, thèmes, transitions, animations, diaporama) */
"use strict";
const PTHEMES = {
  blanc:   { n: "Office", bg: "#ffffff", fg: "#262626", ac: "#c43e1c", font: "Calibri, Carlito, sans-serif" },
  lucien:  { n: "Lucien", bg: "linear-gradient(135deg,#fbf3e6,#f1dcc0)", fg: "#3b2a1a", ac: "#b0651f", font: "Georgia, serif" },
  ardoise: { n: "Ardoise", bg: "linear-gradient(135deg,#3a4150,#1f232b)", fg: "#e8e8e8", ac: "#f2a65a", font: "Segoe UI, Inter, sans-serif" },
  ocean:   { n: "Océan", bg: "linear-gradient(135deg,#1c3f72,#2193b0)", fg: "#ffffff", ac: "#9ee7ff", font: "Trebuchet MS, sans-serif" },
  foret:   { n: "Forêt", bg: "linear-gradient(135deg,#134e2a,#2e8b57)", fg: "#f2fff5", ac: "#d4f7a0", font: "Calibri, sans-serif" },
  nuit:    { n: "Nuit", bg: "radial-gradient(circle at 70% 20%,#4b3b8f,#0f0c29)", fg: "#f1eeff", ac: "#ffb86b", font: "Inter, Segoe UI, sans-serif" },
  corail:  { n: "Corail", bg: "linear-gradient(135deg,#fff1eb,#ffd3c4)", fg: "#4a2015", ac: "#e0456a", font: "Century Gothic, sans-serif" }
};
const LAYOUTS = {
  titre: [["title", 80, 160, 800, 120, "Cliquez pour ajouter un titre", "center"], ["sub", 160, 300, 640, 70, "Cliquez pour ajouter un sous-titre"]],
  contenu: [["title", 60, 30, 840, 90, "Cliquez pour ajouter un titre"], ["body", 60, 135, 840, 370, "Cliquez pour ajouter du texte"]],
  deux: [["title", 60, 30, 840, 90, "Cliquez pour ajouter un titre"], ["body", 60, 135, 410, 370, "Cliquez pour ajouter du texte"], ["body", 490, 135, 410, 370, "Cliquez pour ajouter du texte"]],
  section: [["title", 80, 200, 800, 100, "Titre de section"], ["sub", 80, 310, 800, 60, "Cliquez pour ajouter du texte"]],
  titreseul: [["title", 60, 30, 840, 90, "Cliquez pour ajouter un titre"]],
  vide: []
};
const LAYOUT_NAMES = [["titre", "Diapositive de titre"], ["contenu", "Titre et contenu"], ["deux", "Deux contenus"], ["section", "En-tête de section"], ["titreseul", "Titre seul"], ["vide", "Vide"]];
let pelId = 1;
const mkSlide = (layout = "contenu") => ({ layout, trans: "fondu", notes: "", bg: null, els: LAYOUTS[layout].map(([cls, x, y, w, hh, ph, al]) => ({ id: pelId++, type: "text", cls, x, y, w, h: hh, html: "", ph, al: al || "", anim: "" })) });

function slideEl(sl, theme, mode) {
  const T = PTHEMES[theme] || PTHEMES.blanc;
  const d = h(`<div class="sld ${mode === "show" ? "show" : ""}"></div>`);
  d.style.setProperty("--sbg", sl.bg || T.bg); d.style.setProperty("--sfg", T.fg); d.style.setProperty("--sac", T.ac); d.style.setProperty("--sfont", T.font);
  for (const e of sl.els) {
    const el = h(`<div class="pel ${e.cls || ""} ${e.al}" data-id="${e.id}"></div>`);
    Object.assign(el.style, { left: e.x + "px", top: e.y + "px", width: e.w + "px", height: e.h + "px" });
    if (e.type === "text") { el.innerHTML = e.html; if (e.ph) el.dataset.ph = e.ph; if (mode === "edit") el.contentEditable = "true"; }
    if (e.type === "img") el.innerHTML = `<img src="${e.src}" alt="">`;
    if (e.type === "shape") { el.classList.add("shape"); el.innerHTML = `<svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" style="position:absolute;inset:0"><g fill="${e.fill}">${{ rect: '<rect width="100" height="100" rx="4"/>', circle: '<ellipse cx="50" cy="50" rx="50" ry="50"/>', tri: '<path d="M50 0l50 100H0z"/>', arrow: '<path d="M0 30h65V5l35 45-35 45V70H0z"/>', hexa: '<path d="M25 2h50l24 48-24 48H25L1 50z"/>', penta: '<path d="M50 2l48 35-18 60H20L2 37z"/>', heart: '<path d="M50 96C10 66 0 44 6 26 14 4 40 2 50 22 60 2 86 4 94 26c6 18-4 40-44 70z"/>', bubble: '<path d="M8 4h84a6 6 0 0 1 6 6v54a6 6 0 0 1-6 6H40L18 96V70H8a6 6 0 0 1-6-6V10a6 6 0 0 1 6-6z"/>', rrect: '<rect width="100" height="100" rx="18"/>', diamond: '<path d="M50 0l50 50-50 50L0 50z"/>', cloud: '<path d="M26 86C10 86 2 74 4 62c2-12 14-18 22-16 0-20 18-32 34-28 12 3 18 12 20 20 10-2 18 6 18 16 0 16-10 32-26 32z"/>', larrow: '<path d="M100 30H35V5L0 50l35 45V70h65z"/>', cross: '<path d="M35 0h30v35h35v30H65v35H35V65H0V35h35z"/>', moon: '<path d="M60 4a46 46 0 1 0 36 70A40 40 0 0 1 60 4z"/>', star: '<path d="M50 0l14 32 36 3-27 23 8 35-31-18-31 18 8-35L0 35l36-3z"/>' }[e.shape]}</g></svg><div style="position:relative" ${mode === "edit" ? 'contenteditable="true"' : ""}>${e.html || ""}</div>`; }
    if (e.style) el.style.cssText += e.style;
    d.append(el);
  }
  return d;
}

function PresentationApp(body, w, arg) {
  let deck = { theme: "blanc", ratio: "169", slides: [mkSlide("titre")] }, cur = 0, selEl = null, savedRange = null, view = "normal", undoS = [], zoomFit = true;
  const tabs = {
    "Accueil": [
      ["Presse-papiers", ["big", "paste", "Coller", "paste"], [[["btn", "cut", "Couper", "cut"]], [["btn", "copy", "Copier", "copy"]], [["btn", "dup", "Dupliquer", "dupslide"]]]],
      ["Diapositives", ["big", "plus", "Nouvelle diapositive", "newslide"], [[["sel", "layout", LAYOUT_NAMES, 140, "Disposition"]], [["btn", "restart", "Rétablir", "reset"]], [["btn", "trash", "Supprimer", "delslide"]]]],
      ["Police", [[["sel", "fontName", FONTS, 110, "Police"], ["sel", "fontSize", ["12", "14", "16", "18", "20", "24", "28", "32", "36", "44", "54", "60", "72", "96"], 50, "Taille"]], [["let", "<b>G</b>", "bold", "Gras"], ["let", "<i>I</i>", "italic", "Italique"], ["let", "<u>S</u>", "underline", "Souligné"], ["let", "<s>ab</s>", "strikeThrough", "Barré"], ["color", "fcolor", "foreColor", "#c43e1c", "Couleur de police"], ["btn", "x", null, "removeFormat", "Effacer la mise en forme"]]]],
      ["Paragraphe", [[["btn", "ul", null, "insertUnorderedList", "Puces"], ["btn", "ol", null, "insertOrderedList", "Numérotation"], ["btn", "outdent", null, "outdent", "Diminuer le niveau"], ["btn", "indent", null, "indent", "Augmenter le niveau"]], [["btn", "alignL", null, "justifyLeft", "Aligner à gauche"], ["btn", "alignC", null, "justifyCenter", "Centrer"], ["btn", "alignR", null, "justifyRight", "Aligner à droite"], ["btn", "justify", null, "justifyFull", "Justifier"]]]],
      ["Dessin", [[["btn", "rect", null, "shape-rect", "Rectangle"], ["btn", "circle", null, "shape-circle", "Ellipse"], ["btn", "tri", null, "shape-tri", "Triangle"]], [["btn", "shape", null, "shapes", "Toutes les formes"], ["btn", "arrow", null, "shape-arrow", "Flèche"], ["btn", "star", null, "shape-star", "Étoile"], ["color", "fill", "shapeFill", "#4472c4", "Remplissage"]]], ["big", "layout", "Organiser", "arrange"]],
      ["Édition", [[["btn", "search", "Rechercher", "find"]], [["btn", "replace", "Remplacer", "replace"]], [["btn", "select", "Sélectionner", "selectAll"]]]]
    ],
    "Insertion": [
      ["Diapositives", ["big", "plus", "Nouvelle diapositive", "newslide"]],
      ["Tableaux", ["big", "table", "Tableau", "table"]],
      ["Images", ["big", "image", "Images", "image"]],
      ["Illustrations", ["big", "shape", "Formes", "shape-rect"], ["big", "chart", "Graphique", "chart"]],
      ["Texte", ["big", "textbox", "Zone de texte", "textbox"], [[["btn", "header", "En-tête/pied", "footer"]], [["btn", "hash", "Numéro", "slidenum"]], [["btn", "clock", "Date", "date"]]]],
      ["Symboles", ["big", "omega", "Symbole", "symbol"]]
    ],
    "Création": [
      ["Thèmes", ["gal", "theme", Object.entries(PTHEMES).map(([k, t]) => [k, `<span style="font-family:${t.font};color:${t.ac}">Aa</span>`, `background:${t.bg};color:${t.fg};min-width:64px`, t.n])]],
      ["Personnaliser", ["big", "size", "Taille des diapositives", "ratio"], ["color", "palette", "slideBg", "#ffffff", "Format de l'arrière-plan"], ["big", "restart", "Fond du thème", "resetbg"]]
    ],
    "Transitions": [
      ["Transition vers cette diapositive", ["gal", "trans", [["aucune", "Aucune"], ["fondu", "Fondu"], ["pousser", "Pousser"], ["balayer", "Balayer"], ["zoom", "Zoom"], ["cube", "Cube"]].map(([k, l]) => [k, svg("trans", 18), "", l])]],
      ["Minutage", ["big", "check", "Appliquer partout", "transall"], ["big", "play", "Aperçu", "preview"]]
    ],
    "Animations": [
      ["Animation de l'objet sélectionné", ["gal", "anim", [["", "Aucune"], ["apparaitre", "Apparaître"], ["fondu", "Fondu"], ["entree", "Entrée"], ["zoom", "Zoom"], ["rebond", "Rebond"]].map(([k, l]) => [k, svg("anim", 18), "", l])]],
      ["Aperçu", ["big", "play", "Aperçu", "preview"]]
    ],
    "Diaporama": [
      ["Démarrer le diaporama", ["big", "present", "À partir du début", "showstart"], ["big", "play", "À partir de la diapositive actuelle", "showcur"]],
      ["Présentateur", ["big", "users", "Mode présentateur", "presenter"], ["big", "zap", "Pointeur laser", "laserinfo"]],
      ["Configuration", ["big", "eye", "Masquer la diapositive", "hide"], ["big", "speak", "Lire les notes", "speak"], ["big", "pdf", "Exporter en PDF", "pdf"]]
    ],
    "Révision": [
      ["Vérification", ["big", "spell", "Orthographe", "spell"], ["big", "count", "Statistiques", "stats"]],
      ["Commentaires", ["big", "comment", "Nouveau commentaire", "comment"]]
    ],
    "Affichage": [
      ["Affichages des présentations", ["big", "slides", "Normal", "vnormal"], ["big", "sorter", "Trieuse de diapositives", "vsorter"], ["big", "note", "Page de notes", "vnotes"], ["big", "book", "Mode Lecture", "showcur"]],
      ["Zoom", ["big", "expand", "Ajuster à la fenêtre", "fit"]],
      ["Fenêtre", ["big", "expand", "Plein écran", "full"]]
    ]
  };
  const tplDeck = (theme, slides) => () => JSON.stringify({ theme, ratio: "169", slides });
  const T2 = (t, s) => { const sl = mkSlide("titre"); sl.els[0].html = t; sl.els[1].html = s; return sl; };
  const C2 = (t, items) => { const sl = mkSlide("contenu"); sl.els[0].html = t; sl.els[1].html = `<ul>${items.map(i => `<li>${i}</li>`).join("")}</ul>`; return sl; };
  const pv = (k) => { const t = PTHEMES[k]; return `<div style="width:100%;height:100%;background:${t.bg};display:flex;align-items:center;justify-content:center;color:${t.ac};font:22px ${t.font}">${t.n}</div>`; };
  const templates = [
    { l: "Nouvelle présentation", pv: pv("blanc"), make: tplDeck("blanc", [mkSlide("titre")]) },
    { l: "Lucien", pv: pv("lucien"), make: tplDeck("lucien", [T2("Lucien OS", "Élégant comme macOS, libre comme Linux"), C2("Pourquoi Lucien OS ?", ["Pour Raspberry Pi 5, PC et laptop", "Paquets .lcn et .deb", "Lucien Shell, Browser, Antivirus et Office"])]) },
    { l: "Océan", pv: pv("ocean"), make: tplDeck("ocean", [T2("Titre de la présentation", "Sous-titre")]) },
    { l: "Nuit", pv: pv("nuit"), make: tplDeck("nuit", [T2("Titre de la présentation", "Sous-titre")]) },
    { l: "Forêt", pv: pv("foret"), make: tplDeck("foret", [T2("Titre de la présentation", "Sous-titre")]) },
    { l: "Ardoise", pv: pv("ardoise"), make: tplDeck("ardoise", [T2("Titre de la présentation", "Sous-titre")]) },
    { l: "Exposé (école)", pv: pv("corail"), make: tplDeck("corail", [T2("Mon exposé", "Prénom Nom · Classe"), C2("Plan", ["Introduction", "Partie 1", "Partie 2", "Conclusion"]), C2("Introduction", ["Pourquoi ce sujet ?", "La problématique"]), C2("Conclusion", ["Ce qu'il faut retenir", "Merci de votre attention !"])]) },
    { l: "Projet", pv: pv("ocean"), make: tplDeck("ocean", [T2("Nom du projet", "Présentation à l'équipe"), C2("Objectifs", ["Objectif 1", "Objectif 2", "Objectif 3"]), C2("Calendrier", ["Étape 1 : cadrage", "Étape 2 : réalisation", "Étape 3 : lancement"]), C2("Budget et ressources", ["Équipe", "Budget", "Outils"])]) },
    { l: "Bilan", pv: pv("foret"), make: tplDeck("foret", [T2("Bilan de l'année", new Date().getFullYear().toString()), C2("Réussites", ["…"]), C2("Difficultés", ["…"]), C2("Perspectives", ["…"])]) }
  ];
  const api = OfficeShell(body, w, {
    id: "presentation", kind: "presentation", color: "#c43e1c", ext: "lpre", exts: ["lpre", "pptx"], untitled: "Présentation1", first: "Accueil", tabs, templates,
    exportLabel: "Page web .html autonome (diapositives)",
    onCmd, getContent: () => JSON.stringify(deck), load,
    status: () => `<span>Diapositive ${cur + 1} sur ${deck.slides.length}</span><span>${esc(langName(S.lang))}</span><span class="sp"></span><button data-v="notes">${svg("note", 12)} Notes</button><button data-v="normal">${svg("slides", 12)}</button><button data-v="sorter">${svg("sorter", 12)}</button><button data-v="show">${svg("present", 12)}</button>`,
    afterStatus: (st) => $$("[data-v]", st).forEach(b => b.onclick = () => b.dataset.v === "show" ? present(cur) : b.dataset.v === "notes" ? $(".pnotes", api.content).classList.toggle("hidden") : setView(b.dataset.v)),
    printArgs: () => ["Présentation", deck.slides.map(s => `<div style="page-break-after:always;width:960px;height:540px;overflow:hidden">${slideEl(s, deck.theme, "show").outerHTML}</div>`).join(""), document.querySelector('link[href$="office.css"]') ? "" : ""],
    exportFile: () => [api.doc.name.replace(/\.[^.]+$/, "") + ".html", "text/html", `<!doctype html><meta charset="utf-8"><style>body{margin:0;background:#222}.sld{width:960px;height:540px;position:relative;overflow:hidden;margin:20px auto;background:var(--sbg);color:var(--sfg);font-family:var(--sfont)}.pel{position:absolute;overflow:hidden}.title{font-size:44px;color:var(--sac);display:flex;align-items:center}.center{justify-content:center;text-align:center}.sub{font-size:24px;text-align:center}.body{font-size:24px}</style>${deck.slides.map(s => slideEl(s, deck.theme, "show").outerHTML).join("")}`]
  });
  api.content.innerHTML = `<div class="pmain"><div class="pthumbs"></div><div class="pedit"><div class="pstage"><div class="pholder"></div></div><div class="pnotes" contenteditable="true"></div></div></div>`;
  const thumbs = $(".pthumbs", api.content), stage = $(".pstage", api.content), holder = $(".pholder", api.content), notes = $(".pnotes", api.content), pmain = $(".pmain", api.content);
  const slide = () => deck.slides[cur];
  const elData = (id) => slide().els.find(e => e.id === +id);
  const W = () => deck.ratio === "43" ? 720 : 960;
  function snap() { undoS.push(JSON.stringify(deck)); if (undoS.length > 50) undoS.shift(); api.dirty(); }

  function drawThumbs() {
    thumbs.innerHTML = "";
    deck.slides.forEach((s, i) => {
      const t = h(`<div class="pth ${i === cur ? "sel" : ""}" style="animation-delay:${i * 20}ms;${s.hidden ? "opacity:.45" : ""}"><span class="n">${i + 1}</span><div class="box"></div></div>`);
      const sl = slideEl(s, deck.theme, "thumb"); if (deck.ratio === "43") sl.classList.add("r43");
      $(".box", t).append(sl); if (deck.ratio === "43") $(".box", t).style.width = "108px";
      t.onclick = () => { cur = i; selEl = null; drawEditor(); drawThumbs(); api.status(); };
      t.oncontextmenu = (e) => { cur = i; drawAll(); ctxMenu(e, [["Nouvelle diapositive", () => onCmd("newslide"), { ic: "plus" }], ["Dupliquer la diapositive", () => onCmd("dupslide"), { ic: "dup" }], ["Supprimer la diapositive", () => onCmd("delslide"), { ic: "trash" }], "-", ["Monter", () => moveSlide(-1), { ic: "back" }], ["Descendre", () => moveSlide(1), { ic: "fwd" }], "-", ["Disposition", null, { ic: "layout", sub: LAYOUT_NAMES.map(([k, l]) => [l, () => onCmd("layout", k)]) }], [s.hidden ? "Afficher la diapositive" : "Masquer la diapositive", () => onCmd("hide"), { ic: "eye" }]]); };
      thumbs.append(t);
    });
  }
  const drawThumbsSoon = debounce(drawThumbs, 300);
  function fit() {
    const sw = stage.clientWidth - 40, shh = stage.clientHeight - 30, k = Math.max(.15, Math.min(sw / W(), shh / 540));
    holder.style.width = W() * k + "px"; holder.style.height = 540 * k + "px";
    const s = $(".sld", holder); if (s) s.style.transform = `scale(${k})`;
    holder._k = k;
  }
  function drawEditor() {
    holder.innerHTML = "";
    const s = slideEl(slide(), deck.theme, "edit"); if (deck.ratio === "43") s.classList.add("r43");
    holder.append(s); fit();
    notes.textContent = slide().notes || "";
    $$(".pel", s).forEach(el => {
      const d = elData(el.dataset.id);
      el.addEventListener("mousedown", () => select(el.dataset.id));
      el.addEventListener("focus", () => { if (d.cls === "body" && !d.html) { el.innerHTML = "<ul><li><br></li></ul>"; } });
      el.addEventListener("blur", () => { if (d.cls === "body" && !el.innerText.trim()) { el.innerHTML = ""; d.html = ""; } });
      el.addEventListener("input", () => { d.html = el.classList.contains("shape") ? $("div", el).innerHTML : el.innerHTML; api.dirty(); drawThumbsSoon(); });
    });
    s.addEventListener("mousedown", (e) => { if (e.target === s) select(null); });
    if (selEl) select(selEl);
  }
  function select(id) {
    selEl = id; $$(".pgrip,.prz", holder).forEach(x => x.remove());
    $$(".pel", holder).forEach(el => el.classList.toggle("edit-sel", el.dataset.id == id));
    if (!id) return;
    const d = elData(id); if (!d) return;
    const s = $(".sld", holder);
    const grip = h(`<div class="pgrip">${svg("grid", 10)} Déplacer</div>`), rz = h(`<div class="prz"></div>`);
    const place = () => { Object.assign(grip.style, { left: d.x + "px", top: d.y - 14 + "px" }); Object.assign(rz.style, { left: d.x + d.w - 6 + "px", top: d.y + d.h - 6 + "px" }); };
    place(); s.append(grip, rz);
    const dragger = (fn) => (e) => { e.preventDefault(); e.stopPropagation(); snap(); const sx = e.clientX, sy = e.clientY, o = { ...d }, k = holder._k; const el = $(`.pel[data-id="${id}"]`, s);
      const mv = (ev) => { fn(o, (ev.clientX - sx) / k, (ev.clientY - sy) / k); Object.assign(el.style, { left: d.x + "px", top: d.y + "px", width: d.w + "px", height: d.h + "px" }); place(); };
      const up = () => { removeEventListener("mousemove", mv); removeEventListener("mouseup", up); drawThumbs(); }; addEventListener("mousemove", mv); addEventListener("mouseup", up); };
    grip.onmousedown = dragger((o, dx, dy) => { d.x = Math.round(o.x + dx); d.y = Math.round(o.y + dy); });
    rz.onmousedown = dragger((o, dx, dy) => { d.w = Math.max(30, Math.round(o.w + dx)); d.h = Math.max(20, Math.round(o.h + dy)); });
  }
  function drawAll() { if (view === "sorter") return drawSorter(); drawEditor(); drawThumbs(); api.status(); }
  function setView(v) {
    view = v; $(".psorter", api.content)?.remove();
    pmain.classList.toggle("hidden", v === "sorter");
    if (v === "sorter") drawSorter(); else { notes.classList.toggle("hidden", false); if (v === "notes") notes.style.height = "40%"; else notes.style.height = ""; drawAll(); }
  }
  function drawSorter() {
    $(".psorter", api.content)?.remove();
    const g = h(`<div class="psorter"></div>`);
    deck.slides.forEach((s, i) => { const t = h(`<div class="pth ${i === cur ? "sel" : ""}"><span class="n">${i + 1}</span><div class="box"></div></div>`); $(".box", t).append(slideEl(s, deck.theme, "thumb")); t.ondblclick = () => { cur = i; setView("normal"); }; t.onclick = () => { cur = i; drawSorter(); }; g.append(t); });
    api.content.append(g); api.status();
  }
  function moveSlide(d) { const j = cur + d; if (j < 0 || j >= deck.slides.length) return; snap(); [deck.slides[cur], deck.slides[j]] = [deck.slides[j], deck.slides[cur]]; cur = j; drawAll(); }
  function load(c) { try { deck = c ? JSON.parse(c) : null; } catch { deck = null; } if (!deck || !deck.slides?.length) deck = { theme: "blanc", ratio: "169", slides: [mkSlide("titre")] }; deck.slides.forEach(s => s.els.forEach(e => pelId = Math.max(pelId, e.id + 1))); cur = 0; selEl = null; undoS = []; drawAll(); }
  notes.oninput = () => { slide().notes = notes.textContent; api.dirty(); };
  const onSel = () => { const s = getSelection(); if (s.rangeCount && holder.contains(s.anchorNode)) savedRange = s.getRangeAt(0).cloneRange(); };
  document.addEventListener("selectionchange", onSel);
  const ro = new ResizeObserver(() => view !== "sorter" && fit()); ro.observe(stage);
  w._cleanup = () => { document.removeEventListener("selectionchange", onSel); ro.disconnect(); };
  stage.tabIndex = -1;
  api.content.addEventListener("keydown", (e) => {
    const inText = e.target.closest("[contenteditable]");
    if ((e.key === "Delete" || e.key === "Backspace") && !inText && selEl) { snap(); slide().els = slide().els.filter(x => x.id !== +selEl); selEl = null; drawAll(); }
    if (e.key === "F5") { e.preventDefault(); present(e.shiftKey ? cur : 0); }
    if (!inText && (e.key === "ArrowDown" || e.key === "PageDown") && cur < deck.slides.length - 1) { cur++; drawAll(); }
    if (!inText && (e.key === "ArrowUp" || e.key === "PageUp") && cur > 0) { cur--; drawAll(); }
  });
  function restore() { if (savedRange) { const el = savedRange.startContainer.parentElement?.closest("[contenteditable]"); el?.focus(); const s = getSelection(); s.removeAllRanges(); s.addRange(savedRange); } }
  const exec = (c, v = null) => { restore(); document.execCommand("styleWithCSS", false, true); document.execCommand(c, false, v); const el = savedRange && savedRange.startContainer.parentElement?.closest(".pel"); if (el) el.dispatchEvent(new Event("input")); };
  const addEl = (e) => { snap(); const d = { id: pelId++, x: 330, y: 190, w: 300, h: 160, html: "", anim: "", ...e }; slide().els.push(d); selEl = d.id; drawAll(); return d; };

  /* ---------- diaporama ---------- */
  function present(start, presenter = false) {
    const order = deck.slides.map((s, i) => i).filter(i => !deck.slides[i].hidden);
    let pos = Math.max(0, order.indexOf(start)), steps = [], step = 0, ended = false, laser = false, t0 = Date.now(), paused = 0, pauseAt = null;
    const ov = presenter
      ? h(`<div class="pview"><div class="ptop"><b>Mode présentateur</b><span class="ptimer">00:00</span><button class="tool" data-pause>Pause</button><button class="tool" data-reset>Remettre à zéro</button><span style="flex:1"></span><span class="pcount"></span><span class="pclock"></span></div>
          <div class="pcur"><div class="holder" style="position:absolute"></div></div><div class="pside"><div><small>Diapositive suivante</small><div class="pnext" style="aspect-ratio:16/9"></div></div><div class="pnotesv"></div></div>
          <div class="pctl"><button data-prev>${svg("back", 16)} Précédente</button><button data-next>Suivante ${svg("fwd", 16)}</button><button data-laser>${svg("zap", 16)} Pointeur laser (L)</button><button data-zoomn>${svg("zoomin", 16)} Notes plus grandes</button><button data-end>${svg("x", 16)} Fin du diaporama</button></div></div>`)
      : h(`<div class="show"><div class="holder"></div><div class="bar">Clic ou → : suivant · ← : précédent · L : pointeur laser · Échap : quitter</div></div>`);
    document.body.append(ov); try { ov.requestFullscreen?.(); } catch {}
    const holderS = $(".holder", ov), host = presenter ? $(".pcur", ov) : ov, dot = h(`<div class="laser hidden"></div>`);
    document.body.append(dot);
    const fit = (el, box) => { const r = box.getBoundingClientRect(), k = Math.min(r.width / W(), r.height / 540); el.style.transform = `scale(${k})`; return k; };
    const render = (dir = 1) => {
      ended = false; holderS.innerHTML = "";
      const s = deck.slides[order[pos]]; const el = slideEl(s, deck.theme, "show");
      if (deck.ratio === "43") el.classList.add("r43");
      const k = fit(el, host); holderS.style.width = W() * k + "px"; holderS.style.height = 540 * k + "px";
      if (presenter) { const r = host.getBoundingClientRect(); holderS.style.left = (r.width - W() * k) / 2 + "px"; holderS.style.top = (r.height - 540 * k) / 2 + "px"; }
      const wrapT = h(`<div style="position:absolute;inset:0"></div>`); wrapT.append(el); holderS.append(wrapT);
      if (dir > 0 && s.trans && s.trans !== "aucune") wrapT.classList.add("tr-" + s.trans);
      steps = $$(".pel", el).filter(p => elDataIn(s, p.dataset.id)?.anim); steps.forEach(p => p.classList.add("an-hide")); step = 0;
      if (presenter) {
        const nb = $(".pnext", ov); nb.innerHTML = ""; nb.style.position = "relative";
        if (pos < order.length - 1) { const n = slideEl(deck.slides[order[pos + 1]], deck.theme, "show"); n.style.position = "absolute"; fit(n, nb); n.style.transformOrigin = "0 0"; nb.append(n); } else nb.innerHTML = '<div style="color:#888;padding:20px">Fin de la présentation</div>';
        $(".pnotesv", ov).textContent = s.notes || "Aucune note pour cette diapositive.";
        $(".pcount", ov).textContent = `Diapositive ${pos + 1} sur ${order.length}`;
      }
    };
    const elDataIn = (s, id) => s.els.find(e => e.id === +id);
    const next = () => {
      if (ended) return exit();
      if (step < steps.length) { const p = steps[step++], d = elDataIn(deck.slides[order[pos]], p.dataset.id); p.classList.remove("an-hide"); p.classList.add("an-" + d.anim); return; }
      if (pos < order.length - 1) { pos++; render(); } else { ended = true; holderS.innerHTML = `<div class="end">Fin du diaporama. Cliquez pour quitter.</div>`; holderS.style.width = "auto"; holderS.style.height = "auto"; }
    };
    const prev = () => { if (pos > 0) { pos--; render(-1); } };
    const setLaser = (on) => { laser = on; dot.classList.toggle("hidden", !on); ov.classList.toggle("laseron", on); };
    const key = (e) => {
      if (["ArrowRight", " ", "Enter", "PageDown", "n", "N"].includes(e.key)) { e.preventDefault(); next(); }
      if (["ArrowLeft", "PageUp", "p", "P", "Backspace"].includes(e.key)) { e.preventDefault(); prev(); }
      if (e.key === "l" || e.key === "L") setLaser(!laser);
      if (e.key === "b" || e.key === "B") holderS.style.visibility = holderS.style.visibility ? "" : "hidden";
      if (e.key === "Escape") exit();
    };
    const mv = (e) => { if (laser) { dot.style.left = e.clientX + "px"; dot.style.top = e.clientY + "px"; } };
    const tick = setInterval(() => {
      if (!presenter) return;
      const ms = (pauseAt || Date.now()) - t0 - paused, s2 = Math.floor(ms / 1000);
      $(".ptimer", ov).textContent = `${String(Math.floor(s2 / 60)).padStart(2, "0")}:${String(s2 % 60).padStart(2, "0")}`;
      $(".pclock", ov).textContent = new Date().toLocaleTimeString(locale(), { hour: "2-digit", minute: "2-digit", timeZone: S.tz });
    }, 500);
    const onResize = () => render(0);
    const exit = () => { removeEventListener("keydown", key, true); removeEventListener("mousemove", mv); removeEventListener("resize", onResize); clearInterval(tick); dot.remove(); if (document.fullscreenElement) document.exitFullscreen?.(); ov.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 250, fill: "forwards" }); setTimeout(() => ov.remove(), 250); };
    addEventListener("keydown", key, true); addEventListener("mousemove", mv); addEventListener("resize", onResize);
    if (presenter) {
      $(".pcur", ov).onclick = next; $("[data-next]", ov).onclick = next; $("[data-prev]", ov).onclick = prev; $("[data-end]", ov).onclick = exit;
      $("[data-laser]", ov).onclick = () => setLaser(!laser);
      $("[data-zoomn]", ov).onclick = () => { const n = $(".pnotesv", ov); n.style.fontSize = (parseFloat(getComputedStyle(n).fontSize) + 4) + "px"; };
      $("[data-pause]", ov).onclick = (e) => { if (pauseAt) { paused += Date.now() - pauseAt; pauseAt = null; e.target.textContent = "Pause"; } else { pauseAt = Date.now(); e.target.textContent = "Reprendre"; } };
      $("[data-reset]", ov).onclick = () => { t0 = Date.now(); paused = 0; pauseAt = null; };
    } else { ov.onclick = next; ov.oncontextmenu = (e) => { e.preventDefault(); prev(); }; }
    setTimeout(() => render(), presenter ? 60 : 0);
  }

  async function onCmd(c, v) {
    const simple = ["bold", "italic", "underline", "strikeThrough", "insertUnorderedList", "insertOrderedList", "indent", "outdent", "justifyLeft", "justifyCenter", "justifyRight", "justifyFull", "removeFormat", "selectAll", "cut", "copy"];
    if (simple.includes(c)) return exec(c);
    if (c.startsWith("shape-")) return addEl({ type: "shape", shape: c.slice(6), fill: "#4472c4", w: 220, h: 160 });
    switch (c) {
      case "undo": { const ae = document.activeElement; if (ae && ae.closest?.(".pel")) return document.execCommand("undo"); if (undoS.length) { deck = JSON.parse(undoS.pop()); cur = Math.min(cur, deck.slides.length - 1); drawAll(); } return; }
      case "redo": return document.execCommand("redo");
      case "paste": restore(); try { exec("insertText", await navigator.clipboard.readText()); } catch { notify("presentation", "Coller", "Utilise Ctrl+V."); } return;
      case "fontName": return exec("fontName", v);
      case "fontSize": restore(); document.execCommand("styleWithCSS", false, false); document.execCommand("fontSize", false, 7); $$('font[size="7"]', holder).forEach(f => { const s = document.createElement("span"); s.style.fontSize = v + "px"; s.innerHTML = f.innerHTML; f.replaceWith(s); }); $$(".pel", holder).forEach(p => p.dispatchEvent(new Event("input"))); return;
      case "foreColor": return exec("foreColor", v);
      case "newslide": snap(); deck.slides.splice(cur + 1, 0, mkSlide(cur === 0 && deck.slides.length === 1 ? "contenu" : slide().layout === "titre" ? "contenu" : slide().layout)); cur++; selEl = null; return drawAll();
      case "dupslide": snap(); { const cp = clone(slide()); cp.els.forEach(e => e.id = pelId++); deck.slides.splice(cur + 1, 0, cp); cur++; } return drawAll();
      case "delslide": if (deck.slides.length < 2) return; snap(); deck.slides.splice(cur, 1); cur = Math.min(cur, deck.slides.length - 1); return drawAll();
      case "layout": { snap(); const old = slide(), ns = mkSlide(v); ns.els.forEach((e, i) => { const o = old.els.filter(x => x.type === "text" && x.cls === e.cls)[i === 0 ? 0 : i - 1] || old.els.filter(x => x.cls === e.cls)[0]; if (o) e.html = o.html; }); ns.els.push(...old.els.filter(x => x.type !== "text" || !["title", "sub", "body"].includes(x.cls))); Object.assign(ns, { trans: old.trans, notes: old.notes, bg: old.bg }); deck.slides[cur] = ns; return drawAll(); }
      case "reset": return onCmd("layout", slide().layout);
      case "shapeFill": { const d = selEl && elData(selEl); if (d && d.type === "shape") { snap(); d.fill = v; drawAll(); } else notify("presentation", "Remplissage", "Sélectionne d'abord une forme."); return; }
      case "arrange": { const d = selEl && elData(selEl); if (!d) return notify("presentation", "Organiser", "Sélectionne un objet."); snap(); const els = slide().els; els.splice(els.indexOf(d), 1); els.push(d); return drawAll(); }
      case "find": case "replace": {
        const r = await dialog(w, c === "find" ? "Rechercher" : "Remplacer", c === "find" ? [{ k: "q", l: "Rechercher", v: typeof v === "string" ? v : "" }] : [{ k: "q", l: "Rechercher" }, { k: "r", l: "Remplacer par" }], "OK"); if (!r || !r.q) return;
        const re = new RegExp(r.q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
        if (c === "find") { const i = deck.slides.findIndex(s => s.els.some(e => re.test((e.html || "").replace(/<[^>]+>/g, "")))); if (i < 0) return notify("presentation", "Rechercher", "Introuvable."); cur = i; return drawAll(); }
        snap(); let n = 0; deck.slides.forEach(s => s.els.forEach(e => { if (e.html) e.html = e.html.replace(/>([^<]*)</g, (m, t) => ">" + t.replace(re, () => { n++; return r.r; }) + "<").replace(/^([^<]+)/, (m) => m.replace(re, () => { n++; return r.r; })); })); drawAll(); return notify("presentation", "Remplacer", n + " remplacement(s).");
      }
      case "table": { const r = await dialog(w, "Insérer un tableau", [{ k: "c", l: "Colonnes", type: "number", v: 3 }, { k: "r", l: "Lignes", type: "number", v: 3 }], "Insérer"); if (!r) return; return addEl({ type: "text", cls: "text", x: 120, y: 150, w: 720, h: 260, html: `<table style="width:100%;border-collapse:collapse;font-size:18px">${Array.from({ length: +r.r || 3 }, (_, i) => `<tr>${Array.from({ length: +r.c || 3 }, () => `<td style="border:1px solid #999;padding:6px;${i ? "" : "background:var(--sac);color:#fff;font-weight:700"}">&nbsp;</td>`).join("")}</tr>`).join("")}</table>` }); }
      case "image": { const inp = h(`<input type="file" accept="image/*">`); inp.onchange = () => { const rd = new FileReader(); rd.onload = () => addEl({ type: "img", src: rd.result, w: 400, h: 260, x: 280, y: 160 }); rd.readAsDataURL(inp.files[0]); }; inp.click(); return; }
      case "chart": return addEl({ type: "text", cls: "text", x: 230, y: 140, w: 500, h: 300, html: `<svg width="100%" height="100%" viewBox="0 0 500 300"><line x1="40" y1="270" x2="480" y2="270" stroke="currentColor" opacity=".4"/>${[120, 200, 150, 240].map((v, i) => `<rect x="${70 + i * 105}" y="${270 - v}" width="60" height="${v}" fill="${["#4472c4", "#ed7d31", "#a5a5a5", "#ffc000"][i]}"/><text x="${100 + i * 105}" y="292" font-size="16" fill="currentColor" text-anchor="middle">T${i + 1}</text>`).join("")}</svg>` });
      case "textbox": return addEl({ type: "text", cls: "text", html: "Zone de texte", h: 60 });
      case "footer": return addEl({ type: "text", cls: "text", x: 60, y: 500, w: 840, h: 32, html: `<div style="font-size:14px;opacity:.7;text-align:center">Lucien OS · ${new Date().toLocaleDateString(locale())}</div>` });
      case "slidenum": return addEl({ type: "text", cls: "text", x: 860, y: 500, w: 80, h: 32, html: `<div style="font-size:14px;opacity:.7;text-align:right">${cur + 1}</div>` });
      case "date": return addEl({ type: "text", cls: "text", x: 60, y: 500, w: 260, h: 32, html: `<div style="font-size:14px;opacity:.7">${new Date().toLocaleDateString(locale(), { dateStyle: "long" })}</div>` });
      case "symbol": { const r = await dialog(w, "Symbole", [{ k: "s", l: "Symbole", type: "select", o: "© ® ™ € £ ¥ § ° ± × ÷ ≠ ≤ ≥ ∞ √ α β π Ω → ← ↑ ↓ ✓ • …".split(" ") }], "Insérer"); if (r) exec("insertText", r.s); return; }
      case "theme": snap(); deck.theme = v; return drawAll();
      case "ratio": snap(); deck.ratio = deck.ratio === "43" ? "169" : "43"; notify("presentation", "Taille des diapositives", deck.ratio === "43" ? "Standard (4:3)" : "Grand écran (16:9)"); return drawAll();
      case "slideBg": snap(); slide().bg = v; return drawAll();
      case "resetbg": snap(); slide().bg = null; return drawAll();
      case "trans": snap(); slide().trans = v; { const s = $(".sld", holder); s.classList.remove(...[...s.classList].filter(x => x.startsWith("tr-"))); void s.offsetWidth; if (v !== "aucune") s.classList.add("tr-" + v); } return;
      case "transall": snap(); deck.slides.forEach(s => s.trans = slide().trans); return notify("presentation", "Transitions", "Transition appliquée à toutes les diapositives.");
      case "anim": { const d = selEl && elData(selEl); if (!d) return notify("presentation", "Animations", "Sélectionne d'abord un objet de la diapositive."); snap(); d.anim = v; const el = $(`.pel[data-id="${d.id}"]`, holder); if (v) { el.classList.remove(...[...el.classList].filter(x => x.startsWith("an-"))); void el.offsetWidth; el.classList.add("an-" + v); } return; }
      case "preview": { const s = $(".sld", holder); const t = slide().trans; s.classList.remove(...[...s.classList].filter(x => x.startsWith("tr-"))); void s.offsetWidth; if (t && t !== "aucune") s.classList.add("tr-" + t); slide().els.filter(e => e.anim).forEach((e, i) => { const el = $(`.pel[data-id="${e.id}"]`, holder); el.classList.add("an-hide"); setTimeout(() => { el.classList.remove("an-hide"); el.classList.add("an-" + e.anim); }, 500 + i * 700); }); return; }
      case "showstart": return present(0);
      case "showcur": return present(cur);
      case "presenter": return present(cur, true);
      case "laserinfo": return notify("presentation", "Pointeur laser", "Pendant le diaporama, appuyez sur L pour afficher le pointeur laser (B pour un écran noir).");
      case "pdf": { const pr = deck.slides.map(s => `<div style="page-break-after:always;width:960px;height:540px;overflow:hidden;position:relative">${slideEl(s, deck.theme, "show").outerHTML}</div>`).join(""); const css = [...document.styleSheets].map(ss => { try { return [...ss.cssRules].map(r => r.cssText).join("\n"); } catch { return ""; } }).join("\n"); printHTML(api.doc.name, pr, css + "@page{size:960px 540px;margin:0}body{margin:0}"); return notify("presentation", "Exporter en PDF", "Choisissez « Enregistrer en PDF » dans la fenêtre d'impression."); }
      case "shapes": { const names = { rect: "Rectangle", rrect: "Rectangle arrondi", circle: "Ellipse", tri: "Triangle", diamond: "Losange", penta: "Pentagone", hexa: "Hexagone", star: "Étoile", heart: "Cœur", cloud: "Nuage", bubble: "Bulle de dialogue", arrow: "Flèche droite", larrow: "Flèche gauche", cross: "Croix", moon: "Lune" }; const r = await dialog(w, "Formes", [{ k: "s", l: "Forme", type: "select", o: Object.values(names) }], "Insérer"); if (!r) return; const k = Object.keys(names).find(x => names[x] === r.s); return addEl({ type: "shape", shape: k, fill: "#4472c4", w: 220, h: 160 }); }
      case "hide": snap(); slide().hidden = !slide().hidden; return drawThumbs();
      case "speak": { const u = new SpeechSynthesisUtterance(slide().notes || "Aucune note pour cette diapositive."); u.lang = locale(); speechSynthesis.speak(u); return; }
      case "spell": $$(".pel[contenteditable]", holder).forEach(p => p.spellcheck = true); return notify("presentation", "Orthographe", "Vérification activée.");
      case "stats": return dialog(w, "Statistiques", [{ type: "info", html: `Diapositives : ${deck.slides.length}<br>Objets : ${deck.slides.reduce((a, s) => a + s.els.length, 0)}<br>Mots : ${deck.slides.reduce((a, s) => a + s.els.reduce((b, e) => b + ((e.html || "").replace(/<[^>]+>/g, " ").match(/\S+/g) || []).length, 0), 0)}` }], "");
      case "comment": { const r = await dialog(w, "Nouveau commentaire", [{ k: "t", l: "Commentaire" }], "Publier"); if (r && r.t) { snap(); slide().notes = (slide().notes ? slide().notes + "\n" : "") + "Commentaire de Lucien : " + r.t; drawAll(); } return; }
      case "vnormal": return setView("normal");
      case "vsorter": return setView("sorter");
      case "vnotes": return setView("notes");
      case "fit": return fit();
      case "full": return toggleMax(w);
    }
  }
  drawAll();
  if (arg && arg.path) api.open(arg.path);
}
