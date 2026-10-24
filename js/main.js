/* Lucien OS — bureau : menus, clic droit, centre de contrôle, recherche, Launchpad, démarrage */
"use strict";

/* ================= Menus et clic droit ================= */
let openMenu = null;
function closeMenus() {
  $$(".menu,#cc").forEach(m => { m.classList.add("out"); setTimeout(() => m.remove(), 120); });
  $$("#menubar .m").forEach(m => m.classList.remove("open")); openMenu = null;
}
/* items : "-" ou [libellé, fonction, {ic, kbd, dis, sub}] */
function buildMenu(items) {
  const m = h(`<div class="menu"></div>`);
  for (const it of items) {
    if (it === "-") { m.append(h("<hr>")); continue; }
    const [label, fn, o = {}] = it;
    const r = h(`<div class="mi ${o.dis ? "dis" : ""}">${o.ic ? svg(o.ic, 15) : ""}<span class="l">${esc(label)}</span>${o.kbd ? `<kbd>${o.kbd}</kbd>` : ""}${o.sub ? svg("fwd", 12) : ""}</div>`);
    if (o.sub) { const s = buildMenu(o.sub); s.classList.add("sub"); r.append(s); }
    else if (!o.dis) r.onclick = (e) => { e.stopPropagation(); closeMenus(); fn && fn(); };
    m.append(r);
  }
  return m;
}
function ctxMenu(e, items) {
  e.preventDefault(); e.stopPropagation(); closeMenus();
  const m = buildMenu(items); m.style.visibility = "hidden";
  $("#desktop").append(m);
  const x = Math.min(e.clientX, innerWidth - m.offsetWidth - 6), y = Math.min(e.clientY, innerHeight - m.offsetHeight - 6);
  m.style.left = x + "px"; m.style.top = y + "px"; m.style.visibility = "";
  $$(".sub", m).forEach(s => { if (x + m.offsetWidth * 2 > innerWidth) { s.style.left = "auto"; s.style.right = "100%"; } });
  openMenu = "ctx";
}
const MENUS = {
  lucien: () => [["À propos de Lucien OS", () => openApp("about"), { ic: "info" }], "-", ["Paramètres système…", () => openApp("settings"), { ic: "gear" }], ["Lucien Store…", () => openApp("store"), { ic: "bag" }], "-",
    ["Forcer à quitter…", () => openApp("monitor"), { kbd: "⌥⌘⎋" }], "-", ["Suspendre", () => power("sleep"), { ic: "moon" }], ["Redémarrer…", () => power("restart"), { ic: "restart" }], ["Éteindre…", () => power("shutdown"), { ic: "power" }], "-",
    ["Verrouiller l'écran", () => power("lock"), { ic: "lock", kbd: "⌃⌘Q" }], ["Fermer la session de Lucien…", () => power("logout"), { ic: "logout", kbd: "⇧⌘Q" }]],
  fichier: () => [["Nouvelle fenêtre Fichiers", () => openApp("files"), { kbd: "⌘N" }], ["Nouveau dossier sur le bureau", () => newOnDesktop("dir"), { kbd: "⇧⌘N" }], ["Nouveau document", null, { sub: newDocItems(HOME + "/Bureau") }], "-", ["Ouvrir un terminal", () => openApp("shell")], "-", ["Fermer la fenêtre", () => { const f = $(".win.focus"); f && closeApp(f._id); }, { kbd: "⌘W" }]],
  edition: () => [["Annuler", () => document.execCommand("undo"), { kbd: "⌘Z" }], ["Rétablir", () => document.execCommand("redo"), { kbd: "⇧⌘Z" }], "-", ["Couper", () => document.execCommand("cut"), { kbd: "⌘X" }], ["Copier", () => document.execCommand("copy"), { kbd: "⌘C" }], ["Coller", null, { kbd: "⌘V", dis: true }], ["Tout sélectionner", () => document.execCommand("selectAll"), { kbd: "⌘A" }]],
  presentation: () => [["Basculer clair / sombre", toggleTheme, { ic: "contrast" }], ["Plein écran", () => document.documentElement.requestFullscreen?.(), { ic: "expand" }], ["Launchpad", launchpad, { ic: "grid", kbd: "F4" }]],
  aller: () => [["Lucien", () => openApp("files", HOME), { ic: "home" }], ["Bureau", () => openApp("files", HOME + "/Bureau"), { ic: "desktop" }], ["Documents", () => openApp("files", HOME + "/Documents"), { ic: "doc" }], ["Téléchargements", () => openApp("files", HOME + "/Téléchargements"), { ic: "download" }], ["Lucien HD", () => openApp("files", "/"), { ic: "hdd" }]],
  fenetre: () => [["Réduire", () => { const f = $(".win.focus"); f && minimize(f); }, { kbd: "⌘M" }], ["Agrandir", () => { const f = $(".win.focus"); f && toggleMax(f); }], "-", ["Tout fermer", () => Object.keys(openWins).forEach(closeApp)]],
  aide: () => [["Aide de Lucien Shell", () => openApp("shell", "aide")], ["Projet sur GitHub", () => openApp("browser", "https://github.com/")], ["Raccourcis clavier", () => dialog($("#desktop"), "Raccourcis clavier", [{ type: "info", html: "Ctrl + Espace : recherche<br>F4 : Launchpad<br>Échap : fermer les menus<br>Clic droit : menu contextuel<br>Double-clic sur une barre de titre : agrandir" }], "")]]
};
function showMenu(el, key) {
  const same = openMenu === key; closeMenus(); if (same) return;
  openMenu = key; el.classList.add("open");
  const m = buildMenu(MENUS[key]());
  m.style.top = "26px"; m.style.left = Math.min(el.offsetLeft, innerWidth - 240) + "px";
  $("#desktop").append(m);
}
function toggleTheme() { S.theme = S.theme === "dark" ? "light" : "dark"; store.set("theme", S.theme); applyTheme(true); }

/* ================= Centre de contrôle ================= */
function showCC() {
  const was = openMenu === "cc"; closeMenus(); if (was) return; openMenu = "cc";
  const t = (k, ic, n, on, s) => `<div class="tile ${on ? "on" : ""}" data-k="${k}"><div class="ic">${svg(ic, 15)}</div><div><b>${n}</b><small>${s}</small></div></div>`;
  const cc = h(`<div id="cc">
    ${t("wifi", "wifi", "Wi-Fi", S.wifi, S.wifi ? "Maison-5G" : "Désactivé")}${t("bt", "bt", "Bluetooth", S.bt, S.bt ? "Activé" : "Désactivé")}
    ${t("dnd", "moon", "Ne pas déranger", S.dnd, S.dnd ? "Activé" : "Désactivé")}${t("theme", "contrast", "Mode sombre", S.theme === "dark", S.theme === "dark" ? "Activé" : "Désactivé")}
    <div class="tile wide"><b>Luminosité</b><input type="range" min="10" max="100" value="${S.brightness}" data-r="brightness"></div>
    <div class="tile wide"><b>Son</b><input type="range" min="0" max="100" value="${S.volume}" data-r="volume"></div>
  </div>`);
  $$(".tile[data-k]", cc).forEach(el => el.onclick = (e) => {
    e.stopPropagation(); const k = el.dataset.k;
    if (k === "theme") toggleTheme(); else S[k] = !S[k];
    const on = k === "theme" ? S.theme === "dark" : S[k];
    el.classList.toggle("on", on); $("small", el).textContent = k === "wifi" && on ? "Maison-5G" : on ? "Activé" : "Désactivé";
    refreshSettings();
  });
  $$("input[data-r]", cc).forEach(r => r.oninput = () => { S[r.dataset.r] = +r.value; applyTheme(); });
  $("#desktop").append(cc);
}

/* ================= Recherche (Spotlight) ================= */
function spotlight() {
  if ($("#spot")) { $("#spot").remove(); return; }
  const sp = h(`<div id="spot"><div class="q">${svg("search", 20)}<input placeholder="Recherche Lucien" aria-label="Recherche"></div><div class="res"></div></div>`);
  $("#desktop").append(sp);
  const inp = $("input", sp), res = $(".res", sp);
  let sel = 0, items = [];
  const files = [];
  const walk = (p, n) => Object.entries(n.children).forEach(([k, c]) => { if (k.startsWith(".")) return; const pp = resolve(k, p); files.push([pp, k, c]); if (c.type === "dir") walk(pp, c); });
  walk(HOME, node(HOME));
  const render = () => {
    const q = inp.value.trim().toLowerCase();
    items = Object.entries(APPS).filter(([, a]) => !q || a.name.toLowerCase().includes(q)).map(([id, a]) => ({ html: appIcon(id), label: a.name, kind: "Application", go: () => openApp(id) }));
    if (q) {
      files.filter(([, k]) => k.toLowerCase().includes(q)).slice(0, 8).forEach(([p, k, c]) => items.push({ html: fileIcon(k, c), label: k, kind: pretty(p), go: () => openPath(p) }));
      items.push({ html: appIcon("browser"), label: `Rechercher « ${inp.value} » sur le web`, kind: "Lucien Browser", go: () => openApp("browser", inp.value) });
    }
    sel = Math.max(0, Math.min(sel, items.length - 1));
    res.innerHTML = items.map((it, i) => `<div class="r ${i === sel ? "sel" : ""}" data-i="${i}">${it.html}<div>${esc(it.label)}<br><small style="opacity:.7">${esc(it.kind)}</small></div></div>`).join("");
    $$(".r", res).forEach(r => r.onclick = () => go(+r.dataset.i));
  };
  const go = (i) => { const it = items[i]; if (!it) return; sp.remove(); it.go(); };
  inp.oninput = () => { sel = 0; render(); };
  inp.onkeydown = (e) => {
    if (e.key === "ArrowDown") { sel++; render(); e.preventDefault(); }
    else if (e.key === "ArrowUp") { sel--; render(); e.preventDefault(); }
    else if (e.key === "Enter") go(sel);
    else if (e.key === "Escape") sp.remove();
  };
  render(); inp.focus();
}

/* ================= Launchpad ================= */
function launchpad() {
  if ($("#launch")) return closeLaunch();
  const lp = h(`<div id="launch"><input placeholder="Rechercher" aria-label="Rechercher une app"><div class="lg"></div></div>`);
  document.body.append(lp);
  const draw = (q = "") => {
    $(".lg", lp).innerHTML = Object.entries(APPS).filter(([, a]) => !a.hide && a.name.toLowerCase().includes(q)).map(([id, a], i) => `<div class="la" data-id="${id}" style="animation-delay:${i * 18}ms">${appIcon(id)}${a.name}</div>`).join("");
    $$(".la", lp).forEach(el => el.onclick = (e) => { e.stopPropagation(); closeLaunch(); openApp(el.dataset.id); });
  };
  $("input", lp).oninput = (e) => draw(e.target.value.toLowerCase());
  $("input", lp).onclick = (e) => e.stopPropagation();
  lp.onclick = closeLaunch;
  draw(); setTimeout(() => $("input", lp).focus(), 50);
}
function closeLaunch() { const lp = $("#launch"); if (!lp) return; lp.classList.add("out"); setTimeout(() => lp.remove(), 220); }

/* ================= Icônes du bureau ================= */
const DESK = HOME + "/Bureau";
const iconPos = store.get("iconPos", {});
let deskSel = null;
function newDocItems(dir) {
  return [
    ["Document texte", () => newFile(dir, "Sans titre.txt", ""), { ic: "file" }],
    ["Document Lucien Texte", () => newFile(dir, "Document.ltxt", "<p><br></p>"), { ic: "doc" }],
    ["Classeur Lucien Tableur", () => newFile(dir, "Classeur.ltab", ""), { ic: "sheet" }],
    ["Présentation Lucien Présentation", () => newFile(dir, "Présentation.lpre", ""), { ic: "slides" }],
    ["Script Lucien Shell", () => newFile(dir, "script.lsh", "# Script Lucien Shell\ndis Bonjour !\n"), { ic: "terminal" }]
  ];
}
function newFile(dir, base, content) { const n = fsCreate(dir, base, { type: "file", content }); afterCreate(dir, n); }
function newOnDesktop(kind) { const n = fsCreate(DESK, "Nouveau dossier", { type: "dir", children: {} }); afterCreate(DESK, n); }
function newFolder(dir) { const n = fsCreate(dir, "Nouveau dossier", { type: "dir", children: {} }); afterCreate(dir, n); }
function afterCreate(dir, name) {
  // la vue qui affiche ce dossier lance le renommage
  setTimeout(() => {
    const el = dir === DESK ? $(`.dicon[data-n="${CSS.escape(name)}"]`) : $$(".win .fi").find(f => f.dataset.n === name && f.closest(".win")._cwd === dir);
    if (el) { el.classList.add("new"); inlineRename(el, resolve(name, dir)); }
  }, 30);
}
function inlineRename(el, path) {
  const lbl = $(".lbl", el) || el; const old = parentOf(path)[1];
  const inp = h(`<input class="rename" value="${esc(old)}">`);
  lbl.replaceWith(inp); inp.focus();
  const dot = old.lastIndexOf("."); inp.setSelectionRange(0, dot > 0 && node(path)?.type === "file" ? dot : old.length);
  let done = false;
  const end = (ok) => { if (done) return; done = true; if (ok) fsRename(path, inp.value); else fsChanged(); };
  inp.onkeydown = (e) => { e.stopPropagation(); if (e.key === "Enter") end(true); if (e.key === "Escape") end(false); };
  inp.onblur = () => end(true);
  inp.onpointerdown = (e) => e.stopPropagation();
  inp.ondblclick = (e) => e.stopPropagation();
}
function fileCtxItems(path, refresh) {
  const n = node(path), [dir, name] = parentOf(path);
  const app = n.type === "dir" ? "files" : (FTYPES[extOf(name)] || [, , "apercu"])[2];
  return [
    ["Ouvrir", () => openPath(path), { ic: "open" }],
    ...(n.type === "file" ? [["Ouvrir avec", null, { sub: ["texte", "tableur", "presentation", "apercu", "notes"].map(a => [APPS[a].name + (a === app ? " (par défaut)" : ""), () => a === "notes" ? openApp("notes") : openApp(a, { path }), { ic: APPS[a].ic }]) }]] : []),
    "-",
    ["Renommer", () => refresh("rename"), { ic: "pen" }],
    ["Dupliquer", () => fsCreate(dir, name.replace(/(\.[^.]+)?$/, " copie$1"), clone(n)), { ic: "dup" }],
    ["Copier", () => { fileClipboard = { name, n: clone(n) }; }, { ic: "copy" }],
    ["Lire les informations", () => fileInfo(path), { ic: "info" }],
    ...(/\.(lcn|deb)$/.test(name) ? ["-", ["Installer avec lpm", () => openApp("shell", "lpm installe " + name), { ic: "package" }]] : []),
    ...(n.type === "file" ? [["Analyser avec Lucien Antivirus", () => openApp("shell", "scan " + pretty(path).replace(/ /g, "\\ ")), { ic: "shield" }]] : []),
    "-",
    ["Placer dans la corbeille", () => fsTrash(path), { ic: "trash", kbd: "⌘⌫" }]
  ];
}
function dirCtxItems(dir) {
  return [
    ["Nouveau dossier", () => newFolder(dir), { ic: "folder", kbd: "⇧⌘N" }],
    ["Nouveau document", null, { ic: "newdoc", sub: newDocItems(dir) }],
    ["Importer des fichiers…", () => importFiles(dir), { ic: "upload" }],
    "-",
    ["Coller l'élément", () => { fsCreate(dir, fileClipboard.name, clone(fileClipboard.n)); }, { ic: "paste", dis: !fileClipboard }],
    "-",
    ["Ouvrir dans Lucien Shell", () => openApp("shell", "va " + pretty(dir).replace(/ /g, "\\ ")), { ic: "terminal" }],
    ["Lire les informations", () => fileInfo(dir), { ic: "info" }]
  ];
}
function fileInfo(path) {
  const n = node(path), [, name] = parentOf(path);
  const size = n.type === "dir" ? Object.keys(n.children).length + " élément(s)" : (n.content || "").length + " octets";
  dialog($("#desktop"), "Informations : " + (name || "Lucien HD"), [{ type: "info", html: `Type : ${n.type === "dir" ? "Dossier" : "Fichier ." + esc(extOf(name) || "?")}<br>Emplacement : ${esc(pretty(parentOf(path)[0]))}<br>Taille : ${size}<br>Ouvre avec : ${n.type === "dir" ? "Fichiers" : APPS[(FTYPES[extOf(name)] || [, , "apercu"])[2]].name}` }], "");
}
function importFiles(dir) {
  const inp = h(`<input type="file" multiple style="display:none">`);
  document.body.append(inp);
  inp.onchange = () => { addRealFiles(dir, inp.files); inp.remove(); };
  inp.click();
}
function addRealFiles(dir, files) {
  [...files].forEach(f => {
    const rd = new FileReader();
    const isText = /^text\/|json|xml|csv/.test(f.type) || /\.(txt|md|lsh|csv|json)$/i.test(f.name);
    rd.onload = () => { fsCreate(dir, f.name, { type: "file", content: rd.result, data: !isText }); notify("files", "Fichier ajouté", f.name + " → " + pretty(dir)); };
    isText ? rd.readAsText(f) : rd.readAsDataURL(f);
  });
}
function buildIcons() {
  const box = $("#icons"); box.innerHTML = "";
  const entries = [["Lucien HD", "/", { type: "dir", children: {} }, true], ...Object.entries(node(DESK).children).filter(([k]) => !k.startsWith(".")).map(([k, c]) => [k, resolve(k, DESK), c, false])];
  const colH = Math.max(1, Math.floor((box.clientHeight || innerHeight - 110) / 104));
  entries.forEach(([name, path, n, hd], i) => {
    const pos = iconPos[path] || { x: (box.clientWidth || innerWidth) - 100 - Math.floor(i / colH) * 96, y: 12 + (i % colH) * 104 };
    const el = h(`<div class="dicon ${deskSel === path ? "sel" : ""}" data-n="${esc(name)}" style="left:${pos.x}px;top:${pos.y}px">${hd ? `<div class="icon t-settings">${svg("hdd")}</div>` : fileIcon(name, n)}<div class="lbl">${esc(name)}</div></div>`);
    el.ondblclick = () => openPath(path);
    el.onpointerdown = (e) => {
      if (e.button !== 0) return;
      e.stopPropagation(); deskSel = path; $$(".dicon").forEach(d => d.classList.toggle("sel", d === el));
      const sx = e.clientX, sy = e.clientY, ox = el.offsetLeft, oy = el.offsetTop; let moved = false;
      const mv = (ev) => { if (!moved && Math.hypot(ev.clientX - sx, ev.clientY - sy) < 4) return; moved = true; el.classList.add("dragging"); el.style.left = ox + ev.clientX - sx + "px"; el.style.top = oy + ev.clientY - sy + "px"; };
      const up = () => { removeEventListener("pointermove", mv); removeEventListener("pointerup", up); el.classList.remove("dragging"); if (moved) { iconPos[path] = { x: Math.round(el.offsetLeft / 8) * 8, y: Math.round(el.offsetTop / 8) * 8 }; el.style.left = iconPos[path].x + "px"; el.style.top = iconPos[path].y + "px"; store.set("iconPos", iconPos); } };
      addEventListener("pointermove", mv); addEventListener("pointerup", up);
    };
    el.oncontextmenu = (e) => hd ? ctxMenu(e, [["Ouvrir", () => openApp("files", "/"), { ic: "open" }], ["Lire les informations", () => fileInfo("/"), { ic: "info" }]])
      : ctxMenu(e, fileCtxItems(path, (a) => a === "rename" && inlineRename(el, path)));
    box.append(el);
  });
}
function deskContext(e) {
  if (e.target.closest(".win,#dock,#menubar,.dicon,.menu,#cc,#spot,#notifs")) return;
  ctxMenu(e, [
    ...dirCtxItems(DESK).slice(0, 5),
    "-",
    ["Ranger les icônes", () => { Object.keys(iconPos).forEach(k => delete iconPos[k]); store.set("iconPos", iconPos); buildIcons(); }, { ic: "grid" }],
    ["Trier par nom", () => { Object.keys(iconPos).forEach(k => delete iconPos[k]); buildIcons(); }, { ic: "sortaz" }],
    "-",
    ["Changer le fond d'écran…", () => openApp("settings", "fond"), { ic: "image" }],
    ["Ouvrir Lucien Shell ici", () => openApp("shell", "va ~/Bureau"), { ic: "terminal" }]
  ]);
}
function emptyTrash() { node(HOME + "/.Corbeille").children = {}; fsChanged(); notify("trash", "Corbeille vidée", "Les éléments ont été supprimés."); }

/* ================= Horloge ================= */
function tickClock() {
  const d = new Date(), loc = locale(), o = { timeZone: S.tz, hour12: !S.h24 };
  try {
    $("#mbClock").textContent = d.toLocaleDateString(loc, { ...o, weekday: "short", day: "numeric", month: "short" }) + "  " + d.toLocaleTimeString(loc, { ...o, hour: "2-digit", minute: "2-digit" });
    $("#lgDate").textContent = d.toLocaleDateString(loc, { ...o, weekday: "long", day: "numeric", month: "long" });
    $("#lgTime").textContent = d.toLocaleTimeString(loc, { ...o, hour: "2-digit", minute: "2-digit" });
  } catch { S.tz = "UTC"; }
}

/* ================= Démarrage et alimentation ================= */
const BOOTLOG = ["[  OK  ] Noyau Linux 6.8 chargé", "[  OK  ] Montage de /", "[  OK  ] Démarrage de udev", "[  OK  ] Réseau (NetworkManager)", "[  OK  ] Lucien Antivirus (temps réel)", "[  OK  ] lpm-daemon", "[  OK  ] Session graphique Lucien"];
async function boot() {
  Object.keys(openWins).forEach(id => { openWins[id].remove(); delete openWins[id]; });
  $("#off")?.remove();
  $("#desktop").classList.add("hidden"); $("#login").classList.add("hidden");
  const b = $("#boot"); b.classList.remove("hidden", "fadeout");
  const bar = $(".bar i", b), log = $(".log", b); bar.style.width = 0;
  for (let i = 0; i < BOOTLOG.length; i++) { bar.style.width = ((i + 1) / BOOTLOG.length * 100) + "%"; log.textContent = BOOTLOG[i]; await sleep(240 + Math.random() * 200); }
  await sleep(300);
  b.classList.add("fadeout"); await sleep(500); b.classList.add("hidden");
  if (S.autoLogin) return enterDesktop();
  const lg = $("#login"); lg.classList.remove("hidden", "leave"); $("#lgPass").value = ""; $("#lgPass").focus();
}
async function enterDesktop() {
  const lg = $("#login"); lg.classList.add("leave");
  const d = $("#desktop"); d.classList.remove("hidden"); d.classList.add("enter");
  applyTheme(); buildDock(); buildIcons(); setMenuApp();
  await sleep(600); lg.classList.add("hidden"); d.classList.remove("enter");
  setTimeout(() => notify("store", "Bienvenue dans Lucien OS", "Clic droit sur le bureau pour créer des fichiers. Lucien Office est dans le Dock."), 400);
}
async function power(kind) {
  closeMenus();
  const ov = $("#overlay");
  if (kind === "lock" || kind === "logout") {
    if (kind === "logout") Object.keys(openWins).forEach(closeApp);
    const lg = $("#login"); lg.classList.remove("hidden"); lg.classList.add("leave"); setTimeout(() => lg.classList.remove("leave"), 30);
    setTimeout(() => $("#desktop").classList.add("hidden"), 500); $("#lgPass").value = ""; return;
  }
  ov.classList.add("on"); await sleep(700);
  if (kind === "sleep") { const wake = () => { ov.classList.remove("on"); removeEventListener("pointerdown", wake); removeEventListener("keydown", wake); }; setTimeout(() => { addEventListener("pointerdown", wake); addEventListener("keydown", wake); }, 300); return; }
  ov.classList.remove("on");
  if (kind === "restart") return boot();
  if (kind === "shutdown") {
    $("#desktop").classList.add("hidden"); $("#login").classList.add("hidden");
    const off = h(`<div id="off"><img src="assets/logo.webp" alt="" style="width:60px;opacity:.3"><div>Lucien OS est éteint.</div><button>${svg("power")} Allumer</button></div>`);
    document.body.append(off); $("button", off).onclick = boot;
  }
}

/* ================= Initialisation ================= */
(function init() {
  $("#lgGo").innerHTML = svg("arrow", 15, 2.2);
  $$("[data-i]").forEach(el => el.innerHTML = svg(el.dataset.i, 18));
  $("#mbSearch").innerHTML = svg("search", 15);
  $("#mbCC").innerHTML = svg("sliders", 15);
  $("#mbWifi").innerHTML = svg("wifi", 15);
  $("#mbBat").innerHTML = svg("battery", 18) + " 87 %";
  $$("#menubar [data-menu]").forEach(el => el.addEventListener("click", (e) => { e.stopPropagation(); showMenu(el, el.dataset.menu); }));
  $$("#menubar [data-menu]").forEach(el => el.addEventListener("mouseenter", () => { if (openMenu && openMenu !== el.dataset.menu && MENUS[openMenu]) showMenu(el, el.dataset.menu); }));
  $("#mbCC").onclick = $("#mbWifi").onclick = (e) => { e.stopPropagation(); showCC(); };
  $("#mbSearch").onclick = (e) => { e.stopPropagation(); spotlight(); };
  document.addEventListener("pointerdown", (e) => {
    if (!e.target.closest(".menu,#cc,#menubar")) closeMenus();
    if (!e.target.closest("#spot")) $("#spot")?.remove();
    if (!e.target.closest(".dicon")) { deskSel = null; $$(".dicon.sel").forEach(d => d.classList.remove("sel")); }
  });
  $("#desktop").addEventListener("contextmenu", deskContext);
  const icons = $("#icons");
  icons.addEventListener("dragover", (e) => e.preventDefault());
  icons.addEventListener("drop", (e) => { e.preventDefault(); if (e.dataTransfer.files.length) addRealFiles(DESK, e.dataTransfer.files); });
  document.addEventListener("keydown", (e) => {
    if ($("#desktop").classList.contains("hidden")) return;
    if ((e.ctrlKey || e.metaKey) && e.code === "Space") { e.preventDefault(); spotlight(); }
    if (e.key === "F4") { e.preventDefault(); launchpad(); }
    if (e.key === "Escape") { closeMenus(); closeLaunch(); }
    if ((e.key === "Delete" || e.key === "Backspace") && deskSel && deskSel !== "/" && !e.target.closest("input,textarea,[contenteditable]")) { fsTrash(deskSel); deskSel = null; }
  });
  fsListeners.add(() => { if (!$("#desktop").classList.contains("hidden")) buildIcons(); });
  addEventListener("resize", debounce(buildIcons, 200));
  $("#lgForm").onsubmit = (e) => { e.preventDefault(); const p = $("#lgPass"); if (!p.value) { p.animate([{ transform: "translateX(-8px)" }, { transform: "translateX(8px)" }, { transform: "translateX(-4px)" }, { transform: "none" }], { duration: 300 }); return; } enterDesktop(); };
  $$("#login [data-act]").forEach(b => b.onclick = () => power(b.dataset.act));
  setInterval(tickClock, 1000); tickClock();
  applyTheme();
  boot();
})();
