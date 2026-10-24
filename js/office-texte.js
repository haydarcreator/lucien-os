/* Lucien Office — Lucien Texte (traitement de texte, ruban façon Office) */
"use strict";
function TexteApp(body, w, arg) {
  let page, savedRange = null, zoom = 100, readMode = false;
  const tabs = {
    "Accueil": [
      ["Presse-papiers", ["big", "paste", "Coller", "paste"], [[["btn", "cut", "Couper", "cut"]], [["btn", "copy", "Copier", "copy"]], [["btn", "brushfmt", "Reproduire", "fmtpaint", "Reproduire la mise en forme"]]]],
      ["Police", [[["sel", "fontName", FONTS, 120, "Police"], ["sel", "fontSize", SIZES.map(String), 52, "Taille de police"], ["btn", "zoomin", null, "grow", "Augmenter la taille"], ["btn", "zoomout", null, "shrink", "Réduire la taille"], ["btn", "x", null, "removeFormat", "Effacer toute la mise en forme"]],
        [["let", "<b>G</b>", "bold", "Gras (Ctrl+B)"], ["let", "<i>I</i>", "italic", "Italique (Ctrl+I)"], ["let", "<u>S</u>", "underline", "Souligné (Ctrl+U)"], ["let", "<s>ab</s>", "strikeThrough", "Barré"], ["let", "x<sub>2</sub>", "subscript", "Indice"], ["let", "x<sup>2</sup>", "superscript", "Exposant"], ["color", "highlight", "hiliteColor", "#ffff00", "Couleur de surbrillance du texte"], ["color", "fcolor", "foreColor", "#c00000", "Couleur de police"]]]],
      ["Paragraphe", [[["btn", "ul", null, "insertUnorderedList", "Puces"], ["btn", "ol", null, "insertOrderedList", "Numérotation"], ["btn", "outdent", null, "outdent", "Diminuer le retrait"], ["btn", "indent", null, "indent", "Augmenter le retrait"], ["sel", "lineHeight", [["1", "1,0"], ["1.15", "1,15"], ["1.5", "1,5"], ["2", "2,0"], ["2.5", "2,5"], ["3", "3,0"]], 56, "Interligne"]],
        [["btn", "alignL", null, "justifyLeft", "Aligner à gauche"], ["btn", "alignC", null, "justifyCenter", "Centrer"], ["btn", "alignR", null, "justifyRight", "Aligner à droite"], ["btn", "justify", null, "justifyFull", "Justifier"], ["color", "fill", "blockBg", "#deeaf6", "Trame de fond"]]]],
      ["Styles", ["gal", "style", [["p", "AaBbCc", "", "Normal"], ["div", "AaBbCc", "", "Sans interligne"], ["h1", "AaBb", "font-size:18px;color:#1f3864;font-weight:300", "Titre"], ["h2", "AaBbC", "color:#2f5496", "Titre 1"], ["h3", "AaBbC", "color:#1f3763;font-size:11px", "Titre 2"], ["blockquote", "<i>AaBbCc</i>", "color:#404040", "Citation"], ["pre", "AaBb", "font-family:Consolas,monospace", "Code"]]]],
      ["Édition", [[["btn", "search", "Rechercher", "find"]], [["btn", "replace", "Remplacer", "replace"]], [["btn", "select", "Sélectionner", "selectAll"]]]]
    ],
    "Insertion": [
      ["Pages", ["big", "newdoc", "Page de garde", "cover"], ["big", "pagebreak", "Saut de page", "pagebreak"]],
      ["Tableaux", ["big", "table", "Tableau", "table"]],
      ["Illustrations", ["big", "image", "Images", "image"], ["big", "shape", "Formes", "shape"], ["big", "chart", "Graphique", "chart"]],
      ["Liens", ["big", "link", "Lien", "link"], ["big", "comment", "Commentaire", "comment"]],
      ["En-tête et pied", [[["btn", "header", "En-tête", "header"]], [["btn", "footer", "Pied de page", "footer"]], [["btn", "hash", "Numéro de page", "pagenum"]]]],
      ["Texte", [[["btn", "textbox", "Zone de texte", "textbox"]], [["btn", "clock", "Date et heure", "date"]], [["btn", "hr", "Ligne", "hr"]]]],
      ["Symboles", ["big", "omega", "Symbole", "symbol"]]
    ],
    "Création": [
      ["Mise en forme du document", ["gal", "theme", [["office", "Titre", "color:#1f3864", "Office"], ["lucien", "Titre", "color:#b0651f;font-family:Georgia", "Lucien"], ["moderne", "Titre", "color:#111;font-family:Arial;font-weight:700", "Moderne"], ["classique", "Titre", "color:#5b2c06;font-family:Garamond,Georgia", "Classique"], ["vert", "Titre", "color:#1e6b3a", "Nature"]]]],
      ["Arrière-plan", ["color", "palette", "pageColor", "#ffffff", "Couleur de page"], ["big", "water", "Filigrane", "watermark"], ["big", "border", "Bordures de page", "pageborder"]]
    ],
    "Mise en page": [
      ["Mise en page", ["big", "margins", "Marges", "margins"], ["big", "orient", "Orientation", "orient"], ["big", "size", "Taille", "psize"], ["big", "columns", "Colonnes", "columns"]],
      ["Paragraphe", [[["btn", "indent", "Retrait +", "indent"]], [["btn", "outdent", "Retrait -", "outdent"]]]]
    ],
    "Références": [
      ["Table des matières", ["big", "toc", "Table des matières", "toc"]],
      ["Notes de bas de page", ["big", "footnote", "Insérer une note", "footnote"]],
      ["Citations", ["big", "book", "Insérer une citation", "cite"]]
    ],
    "Révision": [
      ["Vérification", ["big", "spell", "Orthographe", "spell"], ["big", "count", "Statistiques", "wordcount"]],
      ["Voix", ["big", "speak", "Lecture à voix haute", "speak"]],
      ["Commentaires", ["big", "comment", "Nouveau commentaire", "comment"], ["big", "x", "Supprimer", "delcomments"]],
      ["Langue", ["big", "globe", "Langue", "lang"]]
    ],
    "Affichage": [
      ["Affichages", ["big", "book", "Mode Lecture", "read"], ["big", "doc", "Page", "printview"]],
      ["Afficher", [[["btn", "ruler", "Règle", "ruler"]], [["btn", "header", "En-têtes", "showhf"]]]],
      ["Zoom", ["big", "zoomin", "Zoom +", "zoomin"], ["big", "zoomout", "Zoom -", "zoomout"], ["big", "search", "100 %", "zoom100"]],
      ["Fenêtre", ["big", "expand", "Plein écran", "full"]]
    ]
  };
  const TPL_PV = (t) => `<div style="font:700 13px Calibri;color:#1f3864">${t}</div><div style="width:80%;height:4px;background:#ddd"></div><div style="width:80%;height:4px;background:#ddd"></div><div style="width:60%;height:4px;background:#ddd"></div>`;
  const templates = [
    { l: "Document vierge", pv: "", make: () => "<p><br></p>" },
    { l: "Lettre", pv: TPL_PV("Lettre"), make: () => `<p style="text-align:right">Lucien<br>1 rue des Os<br>75000 Paris</p><p>Paris, le ${new Date().toLocaleDateString(locale())}</p><p><b>Objet :</b> …</p><p>Madame, Monsieur,</p><p>…</p><p>Je vous prie d'agréer, Madame, Monsieur, l'expression de mes salutations distinguées.</p><p style="text-align:right">Lucien</p>` },
    { l: "CV moderne", pv: TPL_PV("Curriculum vitæ"), make: () => `<h1>Lucien Dupont</h1><p style="color:#2f5496">Développeur · lucien@exemple.org · 06 00 00 00 00</p><h2>Expérience</h2><p><b>2024 – aujourd'hui</b> · Lucien OS — Développeur système</p><h2>Formation</h2><p><b>2023</b> · Licence informatique</p><h2>Compétences</h2><ul><li>Linux, Python, JavaScript</li><li>Travail en équipe</li></ul>` },
    { l: "Rapport", pv: TPL_PV("Rapport"), make: () => `<h1>Titre du rapport</h1><p style="color:#595959">Sous-titre · ${new Date().toLocaleDateString(locale())}</p><h2>Introduction</h2><p>…</p><h2>Analyse</h2><p>…</p><h2>Conclusion</h2><p>…</p>` },
    { l: "Compte rendu de réunion", pv: TPL_PV("Réunion"), make: () => `<h1>Compte rendu de réunion</h1><table><tr><td><b>Date</b></td><td>${new Date().toLocaleDateString(locale())}</td></tr><tr><td><b>Participants</b></td><td>…</td></tr></table><h2>Ordre du jour</h2><ol><li>…</li></ol><h2>Décisions</h2><ul><li>…</li></ul>` }
  ];
  const api = OfficeShell(body, w, {
    id: "texte", kind: "texte", color: "#2b579a", ext: "ltxt", exts: ["ltxt", "docx", "doc", "txt"], untitled: "Document1", first: "Accueil", tabs, templates,
    exportLabel: "Page web .html (s'ouvre dans Word, LibreOffice…)",
    onCmd, getContent: () => page.innerHTML, load,
    status: () => { const words = (page.innerText.match(/\S+/g) || []).length; const pages = Math.max(1, Math.ceil(page.scrollHeight / (page.classList.contains("land") ? 794 : 1123))); return `<span>Page 1 sur ${pages}</span><span>${words} mot${words > 1 ? "s" : ""}</span><span>${esc(langName(S.lang))} (${esc(regionName(S.region))})</span><span class="sp"></span><button data-z="-">${svg("minus", 12)}</button><input type="range" min="50" max="200" value="${zoom}"><button data-z="+">${svg("plus", 12)}</button><span>${zoom} %</span>`; },
    afterStatus: (st) => { $("input", st).oninput = (e) => setZoom(+e.target.value); $$("[data-z]", st).forEach(b => b.onclick = () => setZoom(zoom + (b.dataset.z === "+" ? 10 : -10))); },
    sync: syncRibbon,
    printArgs: () => ["Document", page.innerHTML, ".wm{display:none} h1{color:#1f3864;font-weight:300} table{border-collapse:collapse} td{border:1px solid #8eaadb;padding:4px}"],
    exportFile: () => [api.doc.name.replace(/\.[^.]+$/, "") + ".html", "text/html", `<!doctype html><meta charset="utf-8"><body style="font-family:Calibri,Arial">${page.innerHTML}</body>`]
  });
  api.content.innerHTML = `<div class="wscroll"><div class="wruler hidden"></div><div class="wpage" contenteditable="true" spellcheck="true"></div></div>`;
  page = $(".wpage", api.content);
  document.execCommand("defaultParagraphSeparator", false, "p");
  page.innerHTML = "<p><br></p>";

  function load(c) { page.innerHTML = c && c.trim() ? (c.includes("<") ? c : c.split("\n").map(l => `<p>${esc(l) || "<br>"}</p>`).join("")) : "<p><br></p>"; api.status(); }
  const onSel = () => { const s = getSelection(); if (s.rangeCount && page.contains(s.anchorNode)) { savedRange = s.getRangeAt(0).cloneRange(); syncRibbon(); } };
  document.addEventListener("selectionchange", onSel);
  w._cleanup = () => document.removeEventListener("selectionchange", onSel);
  page.addEventListener("input", () => api.dirty());
  function restore() { page.focus(); if (savedRange) { const s = getSelection(); s.removeAllRanges(); s.addRange(savedRange); } }
  const exec = (c, v = null) => { restore(); document.execCommand("styleWithCSS", false, true); document.execCommand(c, false, v); api.dirty(); syncRibbon(); };
  const insertHTML = (html) => exec("insertHTML", html);
  function block() { const s = getSelection(); let n = s.anchorNode; while (n && n !== page && !(n.nodeType === 1 && /^(P|H\d|DIV|LI|BLOCKQUOTE|PRE|TD)$/.test(n.tagName))) n = n.parentNode; return n && n !== page ? n : null; }
  function setFontSize(pt) {
    restore(); document.execCommand("styleWithCSS", false, false); document.execCommand("fontSize", false, 7);
    $$('font[size="7"]', page).forEach(f => { const s = document.createElement("span"); s.style.fontSize = pt + "pt"; s.innerHTML = f.innerHTML; f.replaceWith(s); });
    api.dirty();
  }
  function curSize() { const s = getSelection(); const el = s.anchorNode && (s.anchorNode.nodeType === 1 ? s.anchorNode : s.anchorNode.parentElement); return el && page.contains(el) ? Math.round(parseFloat(getComputedStyle(el).fontSize) * 0.75 * 2) / 2 : 11; }
  function syncRibbon() {
    const rib = $(".oribbon", api.root); if (!rib) return;
    ["bold", "italic", "underline", "strikeThrough", "subscript", "superscript", "insertUnorderedList", "insertOrderedList", "justifyLeft", "justifyCenter", "justifyRight", "justifyFull"].forEach(c => { const b = $(`button[data-c="${c}"]`, rib); if (b) { try { b.classList.toggle("on", document.queryCommandState(c)); } catch {} } });
    const fs = $('select[data-c="fontSize"]', rib); if (fs && document.activeElement !== fs) { const v = String(curSize()); if (![...fs.options].some(o => o.value === v)) fs.add(new Option(v)); fs.value = v; }
    const fn = $('select[data-c="fontName"]', rib); if (fn && document.activeElement !== fn) { try { const f = (document.queryCommandValue("fontName") || "Calibri").split(",")[0].replace(/["']/g, "").trim(); if (![...fn.options].some(o => o.value === f)) fn.add(new Option(f)); fn.value = f; } catch {} }
  }
  function setZoom(z) { zoom = Math.max(50, Math.min(200, z)); page.style.zoom = zoom / 100; $(".wruler", api.content).style.zoom = zoom / 100; api.status(); }
  function findText(q, from) {
    const tw = document.createTreeWalker(page, NodeFilter.SHOW_TEXT); let n; q = q.toLowerCase();
    while ((n = tw.nextNode())) { const i = n.data.toLowerCase().indexOf(q); if (i >= 0 && (!from || from.compareBoundaryPoints(Range.START_TO_END, (() => { const r = document.createRange(); r.setStart(n, i); return r; })()) < 0)) { const r = document.createRange(); r.setStart(n, i); r.setEnd(n, i + q.length); return r; } }
    return null;
  }
  let painter = null;
  page.addEventListener("mouseup", () => { if (painter) { restore(); painter.forEach(([c, v]) => document.execCommand(c, false, v)); painter = null; page.style.cursor = ""; api.dirty(); } });

  async function onCmd(c, v, el) {
    const simple = ["bold", "italic", "underline", "strikeThrough", "subscript", "superscript", "insertUnorderedList", "insertOrderedList", "indent", "outdent", "justifyLeft", "justifyCenter", "justifyRight", "justifyFull", "removeFormat", "undo", "redo", "selectAll", "cut", "copy"];
    if (simple.includes(c)) return exec(c);
    switch (c) {
      case "paste": restore(); try { const t = await navigator.clipboard.readText(); exec("insertText", t); } catch { notify("texte", "Coller", "Utilise Ctrl+V pour coller depuis le presse-papiers."); } return;
      case "fmtpaint": painter = [["bold", null], ["italic", null]].filter(([k]) => document.queryCommandState(k)); painter.push(["foreColor", document.queryCommandValue("foreColor")]); page.style.cursor = "copy"; notify("texte", "Reproduire la mise en forme", "Sélectionne le texte auquel appliquer la mise en forme."); return;
      case "fontName": return exec("fontName", v);
      case "fontSize": return setFontSize(+v);
      case "grow": case "shrink": { const cur = curSize(); const i = SIZES.findIndex(s => s >= cur); return setFontSize(SIZES[Math.max(0, Math.min(SIZES.length - 1, c === "grow" ? (SIZES[i] === cur ? i + 1 : i) : i - 1))]); }
      case "foreColor": case "hiliteColor": return exec(c, v);
      case "blockBg": restore(); { const b = block(); if (b) { b.style.background = v; api.dirty(); } } return;
      case "lineHeight": restore(); { const b = block(); (b || page).style.lineHeight = v; api.dirty(); } return;
      case "style": return exec("formatBlock", v);
      case "find": case "replace": {
        const r = await dialog(w, c === "find" ? "Rechercher" : "Rechercher et remplacer", c === "find" ? [{ k: "q", l: "Rechercher", v: typeof v === "string" ? v : "" }] : [{ k: "q", l: "Rechercher" }, { k: "r", l: "Remplacer par" }], c === "find" ? "Suivant" : "Remplacer tout");
        if (!r || !r.q) return;
        if (c === "find") { const rg = findText(r.q, savedRange); if (!rg) return notify("texte", "Rechercher", `« ${r.q} » introuvable.`); page.focus(); const s = getSelection(); s.removeAllRanges(); s.addRange(rg); savedRange = rg; rg.startContainer.parentElement.scrollIntoView({ block: "center", behavior: "smooth" }); return; }
        let n = 0; const tw = document.createTreeWalker(page, NodeFilter.SHOW_TEXT); const re = new RegExp(r.q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi"); let t;
        while ((t = tw.nextNode())) { const before = t.data; t.data = before.replace(re, () => { n++; return r.r; }); }
        api.dirty(); return notify("texte", "Remplacer", `${n} remplacement(s) effectué(s).`);
      }
      case "cover": page.insertAdjacentHTML("afterbegin", `<div style="min-height:900px;display:flex;flex-direction:column;justify-content:center;border-left:8px solid #2b579a;padding-left:30px"><h1 style="font-size:40pt">Titre du document</h1><p style="font-size:16pt;color:#595959">Sous-titre</p><p>Lucien · ${new Date().toLocaleDateString(locale())}</p></div><div class="pbreak"></div>`); api.dirty(); return;
      case "pagebreak": return insertHTML(`<div class="pbreak"></div><p><br></p>`);
      case "table": { const r = await dialog(w, "Insérer un tableau", [{ k: "c", l: "Nombre de colonnes", type: "number", v: 3 }, { k: "r", l: "Nombre de lignes", type: "number", v: 3 }], "Insérer"); if (!r) return; const cols = Math.min(20, +r.c || 3), rows = Math.min(50, +r.r || 3); return insertHTML(`<table>${Array.from({ length: rows }, (_, i) => `<tr>${Array.from({ length: cols }, () => i ? "<td><br></td>" : `<th style="background:#4472c4;color:#fff"><br></th>`).join("")}</tr>`).join("")}</table><p><br></p>`); }
      case "image": { const inp = h(`<input type="file" accept="image/*">`); inp.onchange = () => { const rd = new FileReader(); rd.onload = () => insertHTML(`<img src="${rd.result}" style="max-width:100%">`); rd.readAsDataURL(inp.files[0]); }; inp.click(); return; }
      case "shape": { const r = await dialog(w, "Formes", [{ k: "s", l: "Forme", type: "select", o: ["Rectangle", "Ellipse", "Triangle", "Flèche", "Étoile"], v: "Rectangle" }], "Insérer"); if (!r) return; const p = { Rectangle: '<rect x="4" y="4" width="112" height="72" rx="4"/>', Ellipse: '<ellipse cx="60" cy="40" rx="56" ry="36"/>', Triangle: '<path d="M60 4l56 72H4z"/>', "Flèche": '<path d="M4 28h72V8l40 32-40 32V52H4z"/>', "Étoile": '<path d="M60 4l11 24 26 3-19 18 5 26-23-13-23 13 5-26-19-18 26-3z"/>' }[r.s]; return insertHTML(`<svg width="120" height="80" viewBox="0 0 120 80" style="vertical-align:middle"><g fill="#4472c4" stroke="#2f528f" stroke-width="2">${p}</g></svg>&nbsp;`); }
      case "chart": return insertHTML(`<svg width="360" height="200" viewBox="0 0 360 200" style="display:block;margin:6pt 0"><line x1="30" y1="180" x2="350" y2="180" stroke="#999"/>${[60, 110, 80, 150].map((v, i) => `<rect x="${50 + i * 75}" y="${180 - v}" width="45" height="${v}" fill="${["#4472c4", "#ed7d31", "#a5a5a5", "#ffc000"][i]}"/><text x="${72 + i * 75}" y="195" font-size="11" text-anchor="middle">T${i + 1}</text>`).join("")}</svg><p><br></p>`);
      case "link": { restore(); const sel = getSelection().toString(); const r = await dialog(w, "Insérer un lien", [{ k: "t", l: "Texte à afficher", v: sel }, { k: "u", l: "Adresse", v: "https://" }], "OK"); if (!r) return; if (sel) exec("createLink", r.u); else insertHTML(`<a href="${esc(r.u)}">${esc(r.t || r.u)}</a>`); return; }
      case "comment": { restore(); const sel = getSelection().toString(); if (!sel) return notify("texte", "Commentaire", "Sélectionne d'abord du texte."); const r = await dialog(w, "Nouveau commentaire", [{ k: "t", l: "Commentaire de Lucien" }], "Publier"); if (!r) return; return insertHTML(`<mark class="cmt" title="Lucien : ${esc(r.t)}">${esc(sel)}</mark>`); }
      case "delcomments": $$("mark.cmt", page).forEach(m => m.replaceWith(...m.childNodes)); api.dirty(); return;
      case "header": case "footer": case "showhf": {
        if (!$(".whf", page)) { page.insertAdjacentHTML("afterbegin", `<div class="whf" data-ph="En-tête">En-tête</div>`); page.insertAdjacentHTML("beforeend", `<div class="whf ft">Pied de page</div>`); }
        page.classList.toggle("showhf", c === "showhf" ? undefined : true); api.dirty(); return;
      }
      case "pagenum": if (!$(".whf.ft", page)) await onCmd("footer"); $(".whf.ft", page).innerHTML = `<div style="text-align:center">Page 1</div>`; api.dirty(); return;
      case "textbox": return insertHTML(`<div style="border:1px solid #4472c4;padding:8pt;margin:6pt 0;display:inline-block;min-width:200px">Zone de texte</div>&nbsp;`);
      case "date": return exec("insertText", new Date().toLocaleDateString(locale(), { dateStyle: "long" }));
      case "hr": return exec("insertHorizontalRule");
      case "symbol": {
        const syms = "© ® ™ € £ ¥ $ ¢ § ¶ ° ± × ÷ ≠ ≈ ≤ ≥ ∞ √ ∑ ∏ ∫ ∂ α β γ δ ε θ λ μ π σ φ ω Ω ← → ↑ ↓ ↔ ⇒ ⇔ ✓ • … « » ¿ ¡ ½ ¼ ¾ ‰ ′ ″".split(" ");
        const bg = h(`<div class="sheetbg"><div class="sheet"><h3>Symbole</h3><div style="display:grid;grid-template-columns:repeat(10,1fr);gap:4px">${syms.map(s => `<button class="ob" style="justify-content:center;font-size:16px" data-s="${s}">${s}</button>`).join("")}</div><div class="acts"><button class="btn ghost">Fermer</button></div></div></div>`);
        w.append(bg); $$("[data-s]", bg).forEach(b => b.onclick = () => { exec("insertText", b.dataset.s); }); $(".acts button", bg).onclick = () => bg.remove(); return;
      }
      case "theme": {
        const T = { office: ["Calibri", "#1f3864", "#2f5496"], lucien: ["Georgia", "#b0651f", "#8a4f17"], moderne: ["Arial", "#111111", "#333333"], classique: ["Garamond, Georgia", "#5b2c06", "#7a3d0a"], vert: ["Calibri", "#1e6b3a", "#2e8b57"] }[v];
        page.style.fontFamily = T[0]; $$("h1", page).forEach(x => x.style.color = T[1]); $$("h2,h3", page).forEach(x => x.style.color = T[2]); api.dirty(); return;
      }
      case "pageColor": page.style.backgroundColor = v; api.dirty(); return;
      case "watermark": { const r = await dialog(w, "Filigrane", [{ k: "t", l: "Texte (vide pour retirer)", v: "CONFIDENTIEL" }], "OK"); if (!r) return; $(".wm", page)?.remove(); if (r.t) page.insertAdjacentHTML("afterbegin", `<div class="wm" contenteditable="false">${esc(r.t)}</div>`); api.dirty(); return; }
      case "pageborder": page.style.outline = page.style.outline ? "" : "3px double #2b579a"; page.style.outlineOffset = "-40px"; return;
      case "margins": { const r = await dialog(w, "Marges", [{ k: "m", l: "Marges", type: "select", o: ["Normales (2,54 cm)", "Étroites (1,27 cm)", "Larges (3,81 cm)"] }], "OK"); if (!r) return; page.classList.remove("narrow", "wide"); if (r.m.startsWith("Étroites")) page.classList.add("narrow"); if (r.m.startsWith("Larges")) page.classList.add("wide"); return; }
      case "orient": page.classList.toggle("land"); api.status(); return;
      case "psize": { const r = await dialog(w, "Taille", [{ k: "s", l: "Format", type: "select", o: ["A4 (21 × 29,7 cm)", "Lettre US (21,6 × 27,9 cm)"] }], "OK"); if (r) page.classList.toggle("letter", r.s.startsWith("Lettre")); return; }
      case "columns": { const r = await dialog(w, "Colonnes", [{ k: "n", l: "Nombre de colonnes", type: "select", o: ["1", "2", "3"] }], "OK"); if (r) { page.style.columnCount = r.n; page.style.columnGap = "1.25cm"; } return; }
      case "toc": {
        const hs = $$("h1,h2,h3", page).filter(x => !x.closest(".toc")); hs.forEach((x, i) => x.id = "t" + i);
        $(".toc", page)?.remove();
        page.insertAdjacentHTML("afterbegin", `<div class="toc" contenteditable="false" style="margin-bottom:16pt"><h2 style="color:#2f5496">Table des matières</h2>${hs.map(x => `<div style="padding-left:${(+x.tagName[1] - 1) * 18}px;display:flex"><a href="#${x.id}" style="color:inherit;text-decoration:none">${esc(x.textContent)}</a><span style="flex:1;border-bottom:1px dotted #999;margin:0 4px 4px"></span>1</div>`).join("") || "<p>Aucun titre : utilise les styles Titre 1 / Titre 2.</p>"}</div>`);
        api.dirty(); return;
      }
      case "footnote": { const n = $$("sup.fn", page).length + 1; insertHTML(`<sup class="fn">${n}</sup>`); let box = $(".fnotes", page); if (!box) { page.insertAdjacentHTML("beforeend", `<div class="fnotes" style="border-top:1px solid #999;width:40%;margin-top:30pt;font-size:9pt"></div>`); box = $(".fnotes", page); } box.insertAdjacentHTML("beforeend", `<p><sup>${n}</sup> Note de bas de page.</p>`); return; }
      case "cite": { const r = await dialog(w, "Insérer une citation", [{ k: "a", l: "Auteur" }, { k: "t", l: "Titre" }, { k: "y", l: "Année", v: new Date().getFullYear() }], "OK"); if (r) exec("insertText", ` (${r.a}, ${r.y})`); return; }
      case "spell": page.spellcheck = !page.spellcheck; page.blur(); page.focus(); notify("texte", "Orthographe", page.spellcheck ? "Vérification activée" : "Vérification désactivée"); return;
      case "wordcount": { const t = page.innerText; dialog(w, "Statistiques", [{ type: "info", html: `Pages : ${Math.max(1, Math.ceil(page.scrollHeight / 1123))}<br>Mots : ${(t.match(/\S+/g) || []).length}<br>Caractères (espaces compris) : ${t.length}<br>Caractères (sans espaces) : ${t.replace(/\s/g, "").length}<br>Paragraphes : ${$$("p,h1,h2,h3,li", page).length}` }], ""); return; }
      case "speak": { if (speechSynthesis.speaking) return speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(getSelection().toString() || page.innerText); u.lang = locale(); speechSynthesis.speak(u); return; }
      case "lang": dialog(w, "Langue", [{ type: "info", html: `Langue de vérification : <b>${esc(langName(S.lang))}</b>. Change-la dans Paramètres › Langue et région.` }], ""); return;
      case "read": readMode = !readMode; page.contentEditable = !readMode; page.classList.toggle("ro", readMode); $(".oribbon", api.root).style.display = readMode ? "none" : ""; if (readMode) notify("texte", "Mode Lecture", "Clique à nouveau sur Affichage › Mode Lecture pour revenir."); return;
      case "printview": readMode = false; page.contentEditable = true; $(".oribbon", api.root).style.display = ""; return;
      case "ruler": $(".wruler", api.content).classList.toggle("hidden"); return;
      case "zoomin": return setZoom(zoom + 10);
      case "zoomout": return setZoom(zoom - 10);
      case "zoom100": return setZoom(100);
      case "full": return toggleMax(w);
    }
  }
  if (arg && arg.path) api.open(arg.path);
  setTimeout(() => page.focus(), 100);
}
