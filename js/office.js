/* Lucien Office — structure commune : ruban, barre d'accès rapide, coulisses « Fichier », enregistrement */
"use strict";
const FONTS = ["Calibri", "Calibri Light", "Arial", "Aptos", "Cambria", "Candara", "Century Gothic", "Comic Sans MS", "Consolas", "Courier New", "Garamond", "Georgia", "Helvetica", "Inter", "Segoe UI", "Tahoma", "Times New Roman", "Trebuchet MS", "Verdana"];
const SIZES = [8, 9, 10, 10.5, 11, 12, 14, 16, 18, 20, 24, 28, 36, 48, 72];

/* Un groupe du ruban : [libellé, colonne, colonne…]
   Une colonne : un élément ["big"|"btn"|"let"|"sel"|"color"|"gal", …] ou une liste de rangées [[élém…], [élém…]] */
function ribbonItem(it) {
  const [t] = it;
  if (t === "big") return `<button class="ob big" data-c="${it[3]}" title="${esc(it[2])}">${svg(it[1], 28, 1.5)}<span>${it[2]}</span></button>`;
  if (t === "btn") return `<button class="ob" data-c="${it[3]}" title="${esc(it[4] || it[2] || "")}">${svg(it[1], 16)}${it[2] ? `<span>${it[2]}</span>` : ""}</button>`;
  if (t === "let") return `<button class="ob" data-c="${it[2]}" title="${esc(it[3])}"><span class="let">${it[1]}</span></button>`;
  if (t === "sel") return `<select class="osel" data-c="${it[1]}" title="${esc(it[4] || "")}" style="width:${it[3] || 90}px">${it[2].map(o => Array.isArray(o) ? `<option value="${esc(o[0])}">${esc(o[1])}</option>` : `<option>${esc(o)}</option>`).join("")}</select>`;
  if (t === "color") return `<span class="ocolor ob" title="${esc(it[4])}">${svg(it[1], 16)}<span class="bar" style="background:${it[3]}"></span><input type="color" data-c="${it[2]}" value="${it[3]}"></span>`;
  if (t === "gal") return `<div class="ogal">${it[2].map(([v, l, st, sm]) => `<button data-c="${it[1]}" data-v="${esc(v)}" style="${st || ""}">${l}${sm ? `<small>${sm}</small>` : ""}</button>`).join("")}</div>`;
  return "";
}
function ribbonHTML(groups) {
  return groups.map(([label, ...cols]) => `<div class="ogrp"><div class="gb">${cols.map(col =>
    typeof col[0] === "string" ? ribbonItem(col) : `<div class="ocol">${col.map(row => `<div class="orow">${row.map(ribbonItem).join("")}</div>`).join("")}</div>`).join("")}</div><div class="gl">${label}</div></div>`).join("");
}

function allDocs(exts) {
  const out = [];
  const walk = (p, n) => Object.entries(n.children).forEach(([k, c]) => { if (k === ".Corbeille") return; const pp = resolve(k, p); if (c.type === "dir") walk(pp, c); else if (exts.includes(extOf(k))) out.push(pp); });
  walk("/", FS["/"]); return out;
}
function printHTML(title, html, css = "") {
  const f = h(`<iframe style="position:fixed;width:0;height:0;border:0;left:-10px"></iframe>`);
  document.body.append(f);
  const d = f.contentDocument;
  d.open(); d.write(`<!doctype html><html><head><meta charset="utf-8"><title>${esc(title)}</title><style>body{font-family:Calibri,Carlito,Arial,sans-serif;margin:0}${css}</style></head><body>${html}</body></html>`); d.close();
  setTimeout(() => { f.contentWindow.focus(); f.contentWindow.print(); setTimeout(() => f.remove(), 1000); }, 250);
}
function downloadFile(name, mime, data) {
  const a = h(`<a download="${esc(name)}"></a>`);
  a.href = URL.createObjectURL(new Blob([data], { type: mime }));
  document.body.append(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
}

/* cfg : { id, color, ext, exts, kind, tabs:{nom:groupes}, first, onCmd(c,v,el), templates:[{l,pv,make}], getContent(), load(content), status(), printArgs(), exportFile() } */
function OfficeShell(body, w, cfg) {
  const doc = { path: null, name: cfg.untitled, dirty: false };
  body.innerHTML = `<div class="off" style="--oc:${cfg.color}">
    <div class="otop"><button class="qa" data-q="save" title="Enregistrer (Ctrl+S)">${svg("save", 15)}</button><button class="qa" data-q="undo" title="Annuler (Ctrl+Z)">${svg("undo", 15)}</button><button class="qa" data-q="redo" title="Rétablir (Ctrl+Y)">${svg("redo", 15)}</button>
      <div class="tt"></div><div class="srch">${svg("search", 13)}<input placeholder="Rechercher (Alt+Q)"></div><div class="me" title="Lucien"></div></div>
    <div class="otabs"><button class="otab file" data-t="__file">Fichier</button>${Object.keys(cfg.tabs).map(t => `<button class="otab" data-t="${t}">${t}</button>`).join("")}</div>
    <div class="oribbon"></div>
    <div class="ocontent"></div>
    <div class="ostatus"></div>
  </div>`;
  const root = $(".off", body), rib = $(".oribbon", root), content = $(".ocontent", root);
  let tab = cfg.first || Object.keys(cfg.tabs)[1];
  const title = () => { $(".tt", root).textContent = `${doc.name}${doc.dirty ? " •" : ""} - ${APPS[cfg.id].name}`; setTitle(cfg.id, `${doc.name} - ${APPS[cfg.id].name}`); };
  function showTab(t) {
    tab = t;
    $$(".otab", root).forEach(b => b.classList.toggle("sel", b.dataset.t === t));
    rib.innerHTML = ribbonHTML(cfg.tabs[t]);
    rib.classList.remove("swap"); void rib.offsetWidth; rib.classList.add("swap");
    $$("button[data-c]", rib).forEach(b => {
      b.addEventListener("mousedown", (e) => e.preventDefault()); // garde la sélection dans le document
      b.onclick = () => cfg.onCmd(b.dataset.c, b.dataset.v, b);
    });
    $$("select[data-c]", rib).forEach(s => s.onchange = () => cfg.onCmd(s.dataset.c, s.value, s));
    $$("input[data-c]", rib).forEach(i => { i.oninput = () => { i.previousElementSibling.style.background = i.value; }; i.onchange = () => cfg.onCmd(i.dataset.c, i.value, i); });
    api.sync();
  }
  $$(".otab", root).forEach(b => b.onclick = () => b.dataset.t === "__file" ? backstage("accueil") : showTab(b.dataset.t));
  $$(".qa", root).forEach(b => { b.onmousedown = (e) => e.preventDefault(); b.onclick = () => b.dataset.q === "save" ? save() : cfg.onCmd(b.dataset.q); });
  $(".srch input", root).onkeydown = (e) => { if (e.key === "Enter") cfg.onCmd("find", e.target.value); };

  async function save(as) {
    if (!doc.path || as) {
      const dirs = { "Documents": HOME + "/Documents", "Bureau": HOME + "/Bureau", "Téléchargements": HOME + "/Téléchargements", "Lucien (dossier personnel)": HOME };
      const r = await dialog(w, "Enregistrer sous", [{ k: "n", l: "Nom du fichier", v: doc.name.replace(/\.[^.]+$/, "") }, { k: "d", l: "Emplacement", type: "select", o: Object.keys(dirs), v: "Documents" }], "Enregistrer");
      if (!r || !r.n.trim()) return false;
      const dir = dirs[r.d], name = uniqueName(dir, r.n.trim() + "." + cfg.ext);
      node(dir).children[name] = { type: "file", content: "" };
      doc.path = resolve(name, dir); doc.name = name;
    }
    node(doc.path).content = cfg.getContent();
    doc.dirty = false; title(); fsChanged();
    notify(cfg.id, "Document enregistré", pretty(doc.path));
    return true;
  }
  function backstage(page) {
    $(".obs", root)?.remove();
    const nav = [["accueil", "home", "Accueil"], ["nouveau", "newdoc", "Nouveau"], ["ouvrir", "open", "Ouvrir"], "-", ["info", "info", "Informations"], ["enregistrer", "save", "Enregistrer"], ["enregistrersous", "save", "Enregistrer sous"], ["imprimer", "printer", "Imprimer"], ["exporter", "pdf", "Exporter"], ["partager", "share", "Partager"], "-", ["fermer", "close", "Fermer"]];
    const bs = h(`<div class="obs"><nav><button data-p="back">${svg("back", 18)}<span></span></button>${nav.map(n => n === "-" ? "<hr>" : `<button data-p="${n[0]}">${svg(n[1], 16)}<span>${n[2]}</span></button>`).join("")}<div style="flex:1"></div><button data-p="options">${svg("gear", 16)}<span>Options</span></button></nav><div class="bm"></div></div>`);
    root.append(bs);
    const bm = $(".bm", bs);
    const leave = () => { bs.classList.add("out"); setTimeout(() => bs.remove(), 220); };
    const tpls = () => `<div class="tpls">${cfg.templates.map((t, i) => `<div class="tpl ${cfg.kind === "presentation" ? "wide" : ""}" data-i="${i}" style="animation-delay:${i * 40}ms"><div class="pv">${t.pv}</div>${t.l}</div>`).join("")}</div>`;
    const recents = () => { const r = allDocs(cfg.exts); return r.length ? `<div class="recent">${r.map(p => `<div data-o="${esc(p)}">${fileIcon(parentOf(p)[1], node(p), "").replace('class="icon', 'style="width:28px;height:28px;border-radius:6px" class="icon')}<b>${esc(parentOf(p)[1])}</b><small>${esc(pretty(parentOf(p)[0]))}</small></div>`).join("")}</div>` : `<p class="muted">Aucun document.</p>`; };
    const pages = {
      accueil: () => `<h1>Bonjour</h1><h3>Nouveau</h3>${tpls()}<h3 style="margin-top:28px">Récents</h3>${recents()}`,
      nouveau: () => `<h1>Nouveau</h1>${tpls()}`,
      ouvrir: () => `<h1>Ouvrir</h1>${recents()}<p><button class="btn" data-imp>${svg("upload", 14)} Parcourir cet ordinateur…</button></p>`,
      info: () => `<h1>Informations</h1><div class="card" style="max-width:520px"><div class="row"><span>Nom</span><b>${esc(doc.name)}</b></div><div class="row"><span>Emplacement</span><b>${doc.path ? esc(pretty(parentOf(doc.path)[0])) : "Non enregistré"}</b></div><div class="row"><span>Taille</span><b>${cfg.getContent().length} octets</b></div><div class="row"><span>Auteur</span><b>Lucien</b></div><div class="row"><span>Modifié</span><b>${new Date().toLocaleString(locale())}</b></div>${cfg.info ? cfg.info() : ""}</div>`,
      imprimer: () => `<h1>Imprimer</h1><div class="card" style="max-width:420px"><div class="row"><span>Imprimante</span><select class="osel"><option>Imprimante Lucien (réseau)</option><option>Enregistrer en PDF</option></select></div><div class="row"><span>Copies</span><input class="txt" type="number" value="1" style="width:60px"></div><div class="row"><span>Orientation</span><select class="osel"><option>Portrait</option><option>Paysage</option></select></div></div><button class="btn" data-print>${svg("printer", 14)} Imprimer</button>`,
      exporter: () => `<h1>Exporter</h1><div class="card" style="max-width:520px"><div class="row"><div>Créer un document PDF<small>Mise en page fixe, idéale pour partager</small></div><button class="btn" data-print>${svg("pdf", 14)} PDF</button></div><div class="row"><div>Télécharger une copie<small>${cfg.exportLabel}</small></div><button class="btn" data-dl>${svg("download", 14)} Télécharger</button></div></div>`,
      partager: () => `<h1>Partager</h1><p class="muted">Sur Lucien OS, les documents se partagent par e-mail, clé USB ou dossier réseau. Dans la démo, exporte une copie :</p><button class="btn" data-dl>${svg("download", 14)} Télécharger une copie</button>`,
      options: () => `<h1>Options</h1><div class="card" style="max-width:520px"><div class="row"><div>Enregistrement automatique<small>Toutes les 10 minutes</small></div><button class="sw on"></button></div><div class="row"><div>Vérifier l'orthographe en cours de frappe</div><button class="sw on"></button></div><div class="row"><div>Format par défaut<small>Compatible Microsoft Office sur le vrai système (LibreOffice)</small></div><select class="osel"><option>.${cfg.ext} (Lucien)</option><option>${cfg.kind === "texte" ? ".docx" : cfg.kind === "tableur" ? ".xlsx" : ".pptx"}</option><option>${cfg.kind === "texte" ? ".odt" : cfg.kind === "tableur" ? ".ods" : ".odp"}</option></select></div></div>`
    };
    const go = async (p) => {
      if (p === "back") return leave();
      if (p === "enregistrer" || p === "enregistrersous") { leave(); return save(p === "enregistrersous"); }
      if (p === "fermer") { leave(); return closeApp(cfg.id); }
      $$("nav button", bs).forEach(b => b.classList.toggle("sel", b.dataset.p === p));
      bm.innerHTML = pages[p](); bm.classList.remove("page-in"); void bm.offsetWidth; bm.classList.add("page-in");
      $$(".tpl", bm).forEach(t => t.onclick = () => { cfg.load(cfg.templates[+t.dataset.i].make()); doc.path = null; doc.name = cfg.untitled; doc.dirty = false; title(); leave(); });
      $$("[data-o]", bm).forEach(r => r.onclick = () => { api.open(r.dataset.o); leave(); });
      $$("[data-print]", bm).forEach(b => b.onclick = () => { const [t, html, css] = cfg.printArgs(); printHTML(t, html, css); });
      $$("[data-dl]", bm).forEach(b => b.onclick = () => { const f = cfg.exportFile(); downloadFile(f[0], f[1], f[2]); });
      $$(".sw", bm).forEach(b => b.onclick = () => b.classList.toggle("on"));
      const imp = $("[data-imp]", bm); if (imp) imp.onclick = () => { importFiles(HOME + "/Documents"); };
    };
    $$("nav button", bs).forEach(b => b.onclick = () => go(b.dataset.p));
    go(page);
  }
  const api = {
    root, content, doc, save, backstage,
    dirty() { if (!doc.dirty) { doc.dirty = true; title(); } api.status(); },
    status() { $(".ostatus", root).innerHTML = cfg.status(); cfg.afterStatus && cfg.afterStatus($(".ostatus", root)); },
    sync() { cfg.sync && cfg.sync(rib); },
    open(path) { const n = node(path); if (!n) return; cfg.load(n.content); doc.path = path; doc.name = parentOf(path)[1]; doc.dirty = false; title(); api.status(); },
    rerender() { showTab(tab); }
  };
  body.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") { e.preventDefault(); save(); }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "p") { e.preventDefault(); backstage("imprimer"); }
    if (e.key === "Escape" && $(".obs", root)) $("[data-p=back]", root).click();
  });
  w._beforeClose = () => {
    if (!doc.dirty || w._force) return;
    const bg = h(`<div class="sheetbg"><div class="sheet"><h3>Voulez-vous enregistrer les modifications apportées à « ${esc(doc.name)} » ?</h3><p class="muted">Si vous n'enregistrez pas, vos modifications seront perdues.</p><div class="acts"><button class="btn ghost" data-a="no">Ne pas enregistrer</button><button class="btn ghost" data-a="cancel">Annuler</button><button class="btn" data-a="save">Enregistrer</button></div></div></div>`);
    w.append(bg);
    $$("[data-a]", bg).forEach(b => b.onclick = async () => {
      bg.remove();
      if (b.dataset.a === "cancel") return;
      if (b.dataset.a === "save" && !(await save())) return;
      w._force = true; closeApp(cfg.id);
    });
    return false;
  };
  w._onArg = (a) => { if (a && a.path) api.open(a.path); };
  queueMicrotask(() => { showTab(tab); title(); api.status(); });
  return api;
}
