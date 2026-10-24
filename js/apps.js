/* Lucien OS — applications : Fichiers, Shell, Browser, Antivirus, Store, Moniteur, Notes, Aperçu, Corbeille */
"use strict";

/* ================= Fichiers ================= */
function FilesApp(body, w, arg) {
  let cwd = typeof arg === "string" ? arg : HOME + "/Documents", hist = [cwd], hi = 0, view = "grid", sel = null, q = "";
  const places = [["home", "Lucien", HOME], ["desktop", "Bureau", HOME + "/Bureau"], ["doc", "Documents", HOME + "/Documents"], ["download", "Téléchargements", HOME + "/Téléchargements"], ["image", "Images", HOME + "/Images"], ["music", "Musique", HOME + "/Musique"], ["hdd", "Lucien HD", "/"], ["trash", "Corbeille", HOME + "/.Corbeille"]];
  body.innerHTML = `<div class="split"><div class="side"><h6>Favoris</h6>${places.map(([g, n, p]) => `<div class="si" data-p="${p}">${svg(g)}<span class="lbl">${n}</span></div>`).join("")}
    <h6>Étiquettes</h6><div class="si"><span style="width:10px;height:10px;border-radius:50%;background:#ff5f57"></span><span class="lbl">Important</span></div><div class="si"><span style="width:10px;height:10px;border-radius:50%;background:#28c840"></span><span class="lbl">Projets</span></div></div>
    <div class="fmain"><div class="ftool"><button class="ib" data-a="back" title="Précédent">${svg("back")}</button><button class="ib" data-a="fwd" title="Suivant">${svg("fwd")}</button><b></b>
      <button class="ib" data-a="newdir" title="Nouveau dossier">${svg("folder")}</button><button class="ib" data-a="import" title="Importer des fichiers">${svg("upload")}</button>
      <button class="ib" data-a="view" title="Changer la présentation">${svg("grid")}</button><input class="txt" placeholder="Rechercher" style="width:130px"></div>
      <div class="fzone"></div></div></div>`;
  const zone = $(".fzone", body);
  const go = (p) => { if (!node(p)) return; hist = hist.slice(0, hi + 1); hist.push(p); hi++; cwd = p; sel = null; draw(); };
  function draw() {
    const n = node(cwd); if (!n) { cwd = HOME; return draw(); }
    w._cwd = cwd;
    setTitle("files", parentOf(cwd)[1] || "Lucien HD");
    $$(".si[data-p]", body).forEach(s => s.classList.toggle("sel", s.dataset.p === cwd));
    $(".ftool b", body).textContent = pretty(cwd).replace("/.Corbeille", "/Corbeille");
    $("[data-a=back]", body).disabled = hi === 0; $("[data-a=fwd]", body).disabled = hi >= hist.length - 1;
    const entries = Object.entries(n.children).filter(([k]) => !k.startsWith(".") && k.toLowerCase().includes(q)).sort(([a, x], [b, y]) => (x.type === "dir" ? 0 : 1) - (y.type === "dir" ? 0 : 1) || a.localeCompare(b));
    zone.innerHTML = `<div class="${view}"></div>`;
    const g = zone.firstChild;
    if (!entries.length) g.outerHTML = `<p class="muted">Dossier vide — clic droit pour créer un dossier ou un document, ou glisse des fichiers ici.</p>`;
    for (const [name, c] of entries) {
      const p = resolve(name, cwd);
      const f = h(`<div class="fi ${sel === p ? "sel" : ""}" data-n="${esc(name)}">${fileIcon(name, c)}<span class="lbl">${esc(name)}</span>${view === "list" ? `<span class="m">${c.type === "dir" ? Object.keys(c.children).length + " éléments" : (c.content || "").length + " o"}</span>` : ""}</div>`);
      f.onclick = (e) => { e.stopPropagation(); sel = p; $$(".fi", zone).forEach(x => x.classList.toggle("sel", x === f)); };
      f.ondblclick = () => c.type === "dir" ? go(p) : openPath(p);
      f.oncontextmenu = (e) => { sel = p; ctxMenu(e, fileCtxItems(p, (a) => a === "rename" && inlineRename(f, p))); };
      g.append(f);
    }
  }
  zone.onclick = () => { sel = null; $$(".fi.sel", zone).forEach(x => x.classList.remove("sel")); };
  zone.oncontextmenu = (e) => { if (!e.target.closest(".fi")) ctxMenu(e, cwd.endsWith("/.Corbeille") ? [["Vider la corbeille", emptyTrash, { ic: "trash" }]] : dirCtxItems(cwd)); };
  zone.ondragover = (e) => { e.preventDefault(); zone.classList.add("drop"); };
  zone.ondragleave = () => zone.classList.remove("drop");
  zone.ondrop = (e) => { e.preventDefault(); zone.classList.remove("drop"); addRealFiles(cwd, e.dataTransfer.files); };
  body.addEventListener("keydown", (e) => {
    if (e.target.closest("input")) return;
    if ((e.key === "Delete" || e.key === "Backspace") && sel) { fsTrash(sel); sel = null; }
    if (e.key === "Enter" && sel) { const f = $(".fi.sel", zone); f && inlineRename(f, sel); }
  });
  body.tabIndex = 0;
  $(".ftool", body).onclick = (e) => {
    const a = e.target.closest("[data-a]")?.dataset.a;
    if (a === "back" && hi > 0) { cwd = hist[--hi]; draw(); }
    if (a === "fwd" && hi < hist.length - 1) { cwd = hist[++hi]; draw(); }
    if (a === "newdir") newFolder(cwd);
    if (a === "import") importFiles(cwd);
    if (a === "view") { view = view === "grid" ? "list" : "grid"; draw(); }
  };
  $(".ftool input", body).oninput = (e) => { q = e.target.value.toLowerCase(); draw(); };
  $$(".si[data-p]", body).forEach(s => s.onclick = () => go(s.dataset.p));
  const onFs = () => draw();
  fsListeners.add(onFs); w._cleanup = () => fsListeners.delete(onFs);
  w._onArg = (p) => typeof p === "string" && go(p);
  draw();
}

/* ================= Lucien Shell ================= */
function ShellApp(body, w, arg) {
  body.innerHTML = `<div class="term"></div>`;
  const t = $(".term", body);
  const sh = { cwd: HOME, vars: { UTILISATEUR: "lucien", OS: "Lucien OS", VERSION: "1.0" }, aliases: { ll: "liste -l", cls: "efface" }, hist: [], hi: 0 };
  const line = h(`<div class="in"><span class="pr"></span><input spellcheck="false" autocomplete="off" aria-label="Commande"></div>`);
  const out = (txt, cls = "") => { const l = h(`<div class="l ${cls}"></div>`); l.innerHTML = txt; t.insertBefore(l, line); t.scrollTop = t.scrollHeight; };
  const prompt = () => `<span class="p">lucien</span> <span class="hl">${esc(pretty(sh.cwd))}</span> <span class="p">❯</span>`;
  t.append(line);
  const inp = $("input", line);
  const setPrompt = () => $(".pr", line).innerHTML = prompt();
  t.onclick = () => inp.focus();
  const HELP = [
    ["aide", "affiche cette aide"], ["liste [-l] [dossier]", "liste les fichiers (ls)"], ["va <dossier>", "change de dossier (cd)"], ["ici", "dossier courant (pwd)"],
    ["montre <fichier>", "affiche un fichier (cat)"], ["dis <texte>", "affiche du texte (echo)"], ["cree <fichier>", "crée un fichier vide (touch)"], ["dossier <nom>", "crée un dossier (mkdir)"],
    ["jette <chemin>", "envoie à la corbeille (rm)"], ["renomme <a> <b>", "renomme (mv)"], ["soit x = valeur", "définit une variable, utilise $x"], ["alias nom = cmd", "crée un raccourci"],
    ["cmd | filtre mot", "garde les lignes contenant « mot »"], ["cmd | compte", "compte les lignes"], ["essaie a sinon b", "lance b si a échoue"],
    ["lpm installe <app>", "installe un paquet .lcn ou .deb"], ["lpm liste / lpm cherche <mot>", "paquets installés / disponibles"], ["scan [chemin]", "analyse avec Lucien Antivirus"],
    ["ouvre <app|fichier>", "ouvre une application ou un fichier"], ["theme clair|sombre", "change le thème"], ["lucienfetch", "infos système"], ["date · qui · historique · efface · quitte", ""]
  ];
  const fsCheck = (p) => { const n = node(p); if (!n) throw `aucun fichier ou dossier : ${pretty(p)}`; return n; };
  const cmds = {
    aide: () => "<span class='hl'>Lucien Shell (lsh) 1.0</span> — commandes en français, les noms Linux marchent aussi.\n\n" + HELP.map(([a, b]) => `  <span class='p'>${esc(a).padEnd(34)}</span>${b}`).join("\n"),
    liste: (a) => {
      const long = a[0] === "-l"; if (long) a = a.slice(1);
      const p = resolve(a[0] || ".", sh.cwd), n = fsCheck(p);
      if (n.type !== "dir") return esc(a[0]);
      const e = Object.entries(n.children).filter(([k]) => long || !k.startsWith("."));
      if (long) return e.map(([k, c]) => `${c.type === "dir" ? "d" : "-"}rw-r--r--  lucien  ${String(c.content ? c.content.length : 4096).padStart(6)}  ${c.type === "dir" ? `<span class='hl'>${esc(k)}/</span>` : esc(k)}`).join("\n");
      return e.map(([k, c]) => c.type === "dir" ? `<span class='hl'>${esc(k)}/</span>` : /\.lcn$/.test(k) ? `<span class='p'>${esc(k)}</span>` : esc(k)).join("   ");
    },
    va: (a) => { const p = resolve(a[0], sh.cwd), n = fsCheck(p); if (n.type !== "dir") throw "pas un dossier : " + a[0]; sh.cwd = p; return ""; },
    ici: () => sh.cwd,
    montre: (a) => { if (!a[0]) throw "usage : montre <fichier>"; const n = fsCheck(resolve(a[0], sh.cwd)); if (n.type === "dir") throw a[0] + " est un dossier"; return n.data ? "[fichier binaire]" : esc(n.content.replace(/<[^>]+>/g, " ")); },
    dis: (a) => esc(a.join(" ")),
    cree: (a) => { const p = resolve(a[0], sh.cwd), [d, f] = parentOf(p); if (!fsCheck(d).children[f]) { node(d).children[f] = { type: "file", content: "" }; fsChanged(); } return ""; },
    dossier: (a) => { const p = resolve(a[0], sh.cwd), [d, f] = parentOf(p); if (!fsCheck(d).children[f]) { node(d).children[f] = { type: "dir", children: {} }; fsChanged(); } return ""; },
    jette: (a) => { const p = resolve(a[0], sh.cwd); fsCheck(p); fsTrash(p); return `<span class='ok'>→ ${esc(parentOf(p)[1])} déplacé dans la corbeille</span>`; },
    renomme: (a) => { const p = resolve(a[0], sh.cwd); fsCheck(p); fsRename(p, a[1] || ""); return ""; },
    efface: () => { $$(".l", t).forEach(l => l.remove()); return ""; },
    date: () => new Date().toLocaleString(locale(), { dateStyle: "full", timeStyle: "medium", timeZone: S.tz }),
    qui: () => "lucien",
    historique: () => sh.hist.map((c, i) => `  ${String(i + 1).padStart(3)}  ${esc(c)}`).join("\n"),
    soit: (a) => { const m = a.join(" ").match(/^(\w+)\s*=\s*(.*)$/); if (!m) throw "usage : soit nom = valeur"; sh.vars[m[1]] = m[2]; return ""; },
    alias: (a) => { if (!a.length) return Object.entries(sh.aliases).map(([k, v]) => `${k} = ${esc(v)}`).join("\n"); const m = a.join(" ").match(/^(\w+)\s*=\s*(.*)$/); if (!m) throw "usage : alias nom = commande"; sh.aliases[m[1]] = m[2]; return ""; },
    ouvre: (a) => {
      const k = (a[0] || "").toLowerCase(); if (!k) throw "usage : ouvre <app|fichier>";
      const p = resolve(a[0], sh.cwd); if (node(p)) { openPath(p); return `<span class='ok'>Ouverture de ${esc(a[0])}…</span>`; }
      const id = Object.keys(APPS).find(i => i === k || APPS[i].name.toLowerCase().includes(k)); if (!id) throw "application inconnue : " + a[0];
      openApp(id); return `<span class='ok'>Ouverture de ${APPS[id].name}…</span>`;
    },
    theme: (a) => { if (!/^(clair|sombre)$/.test(a[0])) throw "usage : theme clair|sombre"; S.theme = a[0] === "sombre" ? "dark" : "light"; store.set("theme", S.theme); applyTheme(true); return "<span class='ok'>Thème appliqué</span>"; },
    lucienfetch: () => {
      const e = EDITIONS[S.edition];
      const art = ["   ▄▄▄        ▄▄▄  ", "  █████▄▄▄▄▄▄█████ ", "   ▀███████████▀▀  ", "  ▄███▀▀▀▀▀▀▀███▄  ", "  ▀▀▀▀        ▀▀▀  "];
      const info = [`<span class='p'>lucien</span>@<span class='p'>${S.edition}</span>`, "─────────────────", `<span class='p'>OS</span>      Lucien OS 1.0 « Os de Lune »`, `<span class='p'>Base</span>    Ubuntu 24.04 LTS (noyau 6.8)`, `<span class='p'>Machine</span> ${e.name} (${e.arch})`, `<span class='p'>CPU</span>     ${e.cpu}`, `<span class='p'>Mémoire</span> ${e.ram}`, `<span class='p'>Shell</span>   lsh 1.0`, `<span class='p'>Langue</span>  ${locale()}`, `<span class='p'>Paquets</span> ${1284} (deb) · ${S.installed.length} (lcn)`];
      return info.map((l, i) => `<span style="color:#f4e6cf">${(art[i] || "").padEnd(20)}</span>${l}`).join("\n");
    },
    scan: async (a) => {
      const p = resolve(a[0] || "~", sh.cwd); fsCheck(p);
      out(`<span class='dim'>Lucien Antivirus — analyse de ${esc(pretty(p))}…</span>`);
      const found = []; let count = 0;
      const walk = (path, n) => { if (n.type === "dir") Object.entries(n.children).forEach(([k, c]) => walk(resolve(k, path), c)); else { count++; if (isThreat(path, n)) found.push(path); } };
      walk(p, node(p)); await sleep(700);
      return `${count} fichier(s) analysé(s). ` + (found.length ? `<span class='er'>${found.length} menace(s) :</span>\n` + found.map(f => `  <span class='er'>×</span> ${esc(pretty(f))}  (Lucien.Heur.DoubleExt)`).join("\n") + "\n<span class='dim'>→ ouvre antivirus pour les mettre en quarantaine</span>" : "<span class='ok'>Aucune menace</span>");
    },
    lpm: async (a) => {
      const [sub, ...rest] = a;
      if (sub === "liste") return S.installed.map(i => { const p = PKGS.find(x => x.id === i); return p ? `<span class='ok'>●</span> ${p.id.padEnd(12)} ${p.ver.padEnd(8)} <span class='dim'>.${p.fmt}</span>` : ""; }).join("\n");
      if (sub === "cherche") { const q = (rest[0] || "").toLowerCase(); return PKGS.filter(p => p.id.includes(q) || p.name.toLowerCase().includes(q)).map(p => `${p.id.padEnd(12)} ${p.ver.padEnd(8)} .${p.fmt}  <span class='dim'>${esc(p.desc)}</span>`).join("\n") || "aucun résultat"; }
      if (sub === "installe" || sub === "install") {
        const q = (rest[0] || "").replace(/[-_]\d.*$/, "").replace(/\.(lcn|deb)$/, "").toLowerCase();
        const p = PKGS.find(x => x.id === q); if (!p) throw "paquet introuvable : " + rest[0];
        if (S.installed.includes(p.id)) return `${p.id} est déjà installé.`;
        out(`<span class='dim'>Résolution de ${p.id} (${p.fmt === "lcn" ? "paquet Lucien .lcn" : "paquet Ubuntu .deb"})…</span>`); await sleep(400);
        out(`<span class='dim'>Vérification de la signature… OK</span>`); await sleep(400);
        out(`<span class='dim'>Analyse antivirus… OK</span>`); await sleep(400);
        installPkg(p.id); return `<span class='ok'>${p.name} ${p.ver} installé</span>`;
      }
      if (sub === "retire" || sub === "remove") { const i = S.installed.indexOf(rest[0]); if (i < 0) throw rest[0] + " n'est pas installé"; S.installed.splice(i, 1); store.set("installed", S.installed); return `<span class='ok'>${esc(rest[0])} désinstallé</span>`; }
      if (sub === "maj" || sub === "update") { await sleep(600); return "<span class='ok'>Tout est à jour</span> (dépôts : lucien-main, ubuntu-noble)"; }
      return "lpm — gestionnaire de paquets Lucien\n  lpm installe <paquet|fichier.lcn|fichier.deb>\n  lpm retire <paquet>\n  lpm liste\n  lpm cherche <mot>\n  lpm maj";
    },
    quitte: () => { setTimeout(() => closeApp("shell"), 200); return "Au revoir."; }
  };
  Object.assign(cmds, { ls: cmds.liste, cd: cmds.va, pwd: cmds.ici, cat: cmds.montre, echo: cmds.dis, touch: cmds.cree, mkdir: cmds.dossier, rm: cmds.jette, mv: cmds.renomme, clear: cmds.efface, whoami: cmds.qui, history: cmds.historique, help: cmds.aide, exit: cmds.quitte, open: cmds.ouvre, neofetch: cmds.lucienfetch });
  const split = (s) => (s.match(/(?:\\ |[^\s"])+|"[^"]*"/g) || []).map(x => x.replace(/^"|"$/g, "").replace(/\\ /g, " "));
  async function runOne(seg, input) {
    let parts = split(seg);
    if (sh.aliases[parts[0]]) parts = [...split(sh.aliases[parts[0]]), ...parts.slice(1)];
    const [c, ...args] = parts;
    if (c === "filtre" || c === "grep") return (input || "").split("\n").filter(l => l.toLowerCase().includes((args[0] || "").toLowerCase())).join("\n");
    if (c === "compte" || c === "wc") return String((input || "").split("\n").filter(Boolean).length);
    if (!cmds[c]) throw `commande inconnue : ${esc(c)} — tape <span class='p'>aide</span>`;
    return await cmds[c](args);
  }
  async function run(raw) {
    const src = raw.replace(/(^|\s)#.*$/, "").replace(/\$(\w+)/g, (_, k) => sh.vars[k] ?? "").trim();
    if (!src) return;
    const m = src.match(/^essaie\s+(.+?)\s+sinon\s+(.+)$/);
    if (m) { if (!(await run(m[1]))) await run(m[2]); return true; }
    for (const chain of src.split("&&")) {
      try {
        let data = null;
        for (const seg of chain.split("|")) data = await runOne(seg.trim(), data);
        if (data) out(data);
      } catch (e) { out("lsh: " + e, "er"); return false; }
    }
    return true;
  }
  inp.onkeydown = async (e) => {
    if (e.key === "Enter") {
      const v = inp.value; inp.value = "";
      out(prompt() + " " + esc(v));
      if (v.trim()) { sh.hist.push(v); sh.hi = sh.hist.length; }
      inp.disabled = true; await run(v); inp.disabled = false; setPrompt(); inp.focus(); t.scrollTop = t.scrollHeight;
    } else if (e.key === "ArrowUp") { if (sh.hi > 0) inp.value = sh.hist[--sh.hi]; e.preventDefault(); }
    else if (e.key === "ArrowDown") { sh.hi = Math.min(sh.hi + 1, sh.hist.length); inp.value = sh.hist[sh.hi] || ""; e.preventDefault(); }
    else if (e.key === "Tab") {
      e.preventDefault();
      const parts = inp.value.split(" "), last = parts.pop();
      const pool = parts.length ? Object.keys(node(sh.cwd).children) : Object.keys(cmds);
      const mm = pool.filter(x => x.startsWith(last)); if (mm.length === 1) { parts.push(mm[0].replace(/ /g, "\\ ")); inp.value = parts.join(" "); } else if (mm.length) out(mm.join("   "), "dim");
    } else if (e.key === "l" && e.ctrlKey) { e.preventDefault(); cmds.efface(); }
  };
  out(`<span class='p'>Lucien Shell 1.0</span> <span class='dim'>— tape « aide » pour commencer, Tab pour compléter.</span>`);
  setPrompt();
  w._onArg = async (c) => { if (typeof c !== "string") return; out(prompt() + " " + esc(c)); await run(c); setPrompt(); };
  if (typeof arg === "string") w._onArg(arg);
  setTimeout(() => inp.focus(), 60);
}

/* ================= Lucien Browser ================= */
function BrowserApp(body, w, arg) {
  body.innerHTML = `<div class="bw"><div class="tabs"></div>
    <div class="urlbar"><button data-a="back" title="Précédent">${svg("back")}</button><button data-a="fwd" title="Suivant">${svg("fwd")}</button><button data-a="reload" title="Recharger">${svg("restart")}</button>
    <input aria-label="Adresse"><span class="shield" title="Bloqueur de pistes Lucien">${svg("shield", 13)} <b class="blk">0</b> pistes bloquées</span><button data-a="home" title="Accueil">${svg("home")}</button></div>
    <div class="page"></div></div>`;
  let tabs = [], cur = 0;
  const page = $(".page", body), url = $(".urlbar input", body);
  const newTab = (u = "lucien://accueil") => { tabs.push({ hist: [u], i: 0 }); cur = tabs.length - 1; draw(); };
  const tab = () => tabs[cur];
  const toUrl = (q) => /^(lucien|https?):\/\//.test(q) ? q : /^[\w-]+(\.[\w-]+)+(\/.*)?$/.test(q) ? "https://" + q : "https://duckduckgo.com/?q=" + encodeURIComponent(q);
  const nav = (q) => { const u = toUrl(q.trim()); const t = tab(); t.hist = t.hist.slice(0, t.i + 1); t.hist.push(u); t.i++; draw(); };
  const title = (u) => u === "lucien://accueil" ? "Accueil" : u.replace(/^https?:\/\/(www\.)?/, "").split(/[/?]/)[0];
  function draw() {
    const u = tab().hist[tab().i];
    $(".tabs", body).innerHTML = tabs.map((t, i) => `<div class="tab ${i === cur ? "sel" : ""}" data-i="${i}"><span>${esc(title(t.hist[t.i]))}</span><b data-x="${i}">${svg("x", 11)}</b></div>`).join("") + `<div class="tab add" title="Nouvel onglet">${svg("plus", 13)}</div>`;
    $$(".tab[data-i]", body).forEach(el => el.onclick = (e) => {
      const x = e.target.closest("[data-x]");
      if (x) { tabs.splice(+x.dataset.x, 1); if (!tabs.length) return closeApp("browser"); cur = Math.min(cur, tabs.length - 1); } else cur = +el.dataset.i;
      draw();
    });
    $(".tab.add", body).onclick = () => newTab();
    url.value = u === "lucien://accueil" ? "" : u;
    url.placeholder = "Rechercher ou saisir une adresse";
    if (u === "lucien://accueil") {
      const favs = [["book", "t-txt", "Wikipédia", "https://fr.wikipedia.org"], ["code", "t-shell", "GitHub", "https://github.com"], ["cpu", "t-app", "Raspberry Pi", "https://www.raspberrypi.com"], ["package", "t-deb", "Ubuntu", "https://ubuntu.com"], ["globe", "t-av", "OpenStreetMap", "https://www.openstreetmap.org/export/embed.html"], ["search", "t-browser", "DuckDuckGo", "https://duckduckgo.com"]];
      page.innerHTML = `<div class="home"><img src="assets/logo.webp" alt=""><h1>Lucien Browser</h1><form><input placeholder="Rechercher sur le web en privé…" aria-label="Recherche"></form>
        <div class="favs">${favs.map(([g, c, n, l]) => `<div class="fav" data-u="${l}"><div class="icon ${c}">${svg(g)}</div>${n}</div>`).join("")}</div>
        <p class="muted" style="font-size:12px;text-align:center">Bloqueur de pistes intégré · HTTPS partout · Aucune télémétrie</p></div>`;
      $("form", page).onsubmit = (e) => { e.preventDefault(); nav($("input", page).value); };
      $$(".fav", page).forEach(f => f.onclick = () => nav(f.dataset.u));
    } else {
      page.innerHTML = `<iframe src="${esc(u)}" referrerpolicy="no-referrer" sandbox="allow-scripts allow-same-origin allow-forms allow-popups"></iframe>
        <div class="note"><span>Démo web : certains sites refusent l'affichage intégré. Le vrai Lucien Browser (WebKit) les ouvre tous.</span><a class="btn" href="${esc(u)}" target="_blank" rel="noopener">Ouvrir ${svg("arrow", 13)}</a></div>`;
      const b = $(".blk", body); b.textContent = +b.textContent + Math.floor(Math.random() * 9) + 1;
    }
  }
  $(".urlbar", body).addEventListener("click", (e) => {
    const a = e.target.closest("[data-a]")?.dataset.a; if (!a) return; const t = tab();
    if (a === "back" && t.i > 0) t.i--; if (a === "fwd" && t.i < t.hist.length - 1) t.i++; if (a === "home") return nav("lucien://accueil");
    draw();
  });
  url.onkeydown = (e) => { if (e.key === "Enter" && url.value.trim()) nav(url.value); };
  w._onArg = (q) => { if (typeof q === "string") { newTab(); nav(q); } };
  newTab();
  if (typeof arg === "string") nav(arg);
}

/* ================= Lucien Antivirus ================= */
const SIGS = { "Lucien.Heur.DoubleExt": /\.(pdf|doc|jpg|txt)\.exe$/i, "Lucien.Win.PE": /^MZ/ };
function isThreat(path, n) { return n.type === "file" && !n.data && (SIGS["Lucien.Heur.DoubleExt"].test(path) || SIGS["Lucien.Win.PE"].test(n.content || "")); }
function AvApp(body, w) {
  let tabSel = "etat", scanning = false;
  const tabsDef = [["etat", "shieldok", "État"], ["scan", "search", "Analyse"], ["temps", "zap", "Temps réel"], ["quar", "lock", "Quarantaine"], ["pare", "wall", "Pare-feu"], ["maj", "download", "Mises à jour"]];
  body.innerHTML = `<div class="split"><div class="side">${tabsDef.map(([k, g, n]) => `<div class="si" data-k="${k}">${svg(g)}<span class="lbl">${n}</span></div>`).join("")}</div><div class="main"></div></div>`;
  const main = $(".main", body);
  const threats = () => { const f = []; const walk = (p, n) => n.type === "dir" ? Object.entries(n.children).forEach(([k, c]) => walk(resolve(k, p), c)) : isThreat(p, n) && f.push(p); walk("/", FS["/"]); return f; };
  function draw() {
    $$(".si", body).forEach(s => s.classList.toggle("sel", s.dataset.k === tabSel));
    const ok = S.realtime && S.firewall;
    main.classList.remove("page-in"); void main.offsetWidth; main.classList.add("page-in");
    if (tabSel === "etat") main.innerHTML = `<div class="avhead"><div class="big ${ok ? "" : "warn"}">${svg(ok ? "check" : "warn", 36, 2.4)}</div><div><h2>${ok ? "Vous êtes protégé" : "Protection réduite"}</h2><small class="muted">Dernière analyse : ${S.lastScan ? new Date(S.lastScan).toLocaleString(locale()) : "jamais"}</small></div></div>
      <div class="card"><div class="row"><div>Protection en temps réel<small>Analyse chaque fichier ouvert ou téléchargé</small></div><b>${S.realtime ? "Active" : "Désactivée"}</b></div>
      <div class="row"><div>Pare-feu<small>Bloque les connexions entrantes non autorisées</small></div><b>${S.firewall ? "Actif" : "Désactivé"}</b></div>
      <div class="row"><div>Signatures<small>Moteur Lucien + base ClamAV</small></div><b>v2026.10.24</b></div>
      <div class="row"><div>Éléments en quarantaine</div><b>${S.quarantine.length}</b></div></div>
      <button class="btn" data-go="scan">${svg("search", 14)} Lancer une analyse rapide</button>`;
    if (tabSel === "scan") main.innerHTML = `<h2>Analyse</h2><div class="card"><div class="row"><div>Analyse rapide<small>Dossier personnel et téléchargements</small></div><button class="btn" data-scan="${HOME}">Analyser</button></div>
      <div class="row"><div>Analyse complète<small>Tout le système</small></div><button class="btn" data-scan="/">Analyser</button></div></div>
      <div class="prog"><i></i></div><div class="scanpath"></div><div class="res"></div>`;
    if (tabSel === "temps") main.innerHTML = `<h2>Protection en temps réel</h2><div class="card">
      <div class="row"><div>Activer la protection en temps réel<small>Recommandé</small></div><button class="sw ${S.realtime ? "on" : ""}" data-t="realtime"></button></div>
      <div class="row"><div>Analyser les paquets .lcn et .deb avant installation</div><button class="sw on" data-t="x1"></button></div>
      <div class="row"><div>Analyser les téléchargements de Lucien Browser</div><button class="sw on" data-t="x2"></button></div>
      <div class="row"><div>Analyser les macros des documents Lucien Office</div><button class="sw on" data-t="x6"></button></div>
      <div class="row"><div>Bloquer les clés USB inconnues</div><button class="sw" data-t="x3"></button></div></div>`;
    if (tabSel === "quar") main.innerHTML = `<h2>Quarantaine</h2>` + (S.quarantine.length ? `<div class="card">${S.quarantine.map((q, i) => `<div class="row"><div>${esc(q.name)}<small>${esc(q.sig)} · ${esc(pretty(q.from))}</small></div><button class="btn ghost" data-del="${i}">Supprimer</button></div>`).join("")}</div>` : `<p class="muted">Aucun élément en quarantaine.</p>`);
    if (tabSel === "pare") main.innerHTML = `<h2>Pare-feu (ufw)</h2><div class="card"><div class="row"><div>Pare-feu<small>Connexions entrantes bloquées par défaut</small></div><button class="sw ${S.firewall ? "on" : ""}" data-t="firewall"></button></div>
      <div class="row"><div>SSH (22)<small>Autorisé sur le réseau local seulement</small></div><b>Limité</b></div><div class="row"><div>Partage de fichiers (445)</div><b>Bloqué</b></div><div class="row"><div>Mode furtif<small>Ne répond pas au ping</small></div><button class="sw on" data-t="x4"></button></div></div>`;
    if (tabSel === "maj") main.innerHTML = `<h2>Mises à jour des signatures</h2><div class="card"><div class="row"><div>Base de signatures<small>8 724 113 signatures</small></div><b>v2026.10.24</b></div><div class="row"><div>Mise à jour automatique<small>Toutes les 4 heures</small></div><button class="sw on" data-t="x5"></button></div></div><button class="btn" data-upd>Rechercher maintenant</button><span class="u muted" style="margin-left:10px"></span>`;
    $$("[data-go]", main).forEach(b => b.onclick = () => { tabSel = b.dataset.go; draw(); $("[data-scan]", main).click(); });
    $$("[data-t]", main).forEach(b => b.onclick = () => { b.classList.toggle("on"); if (b.dataset.t in S) S[b.dataset.t] = b.classList.contains("on"); });
    $$("[data-del]", main).forEach(b => b.onclick = () => { S.quarantine.splice(+b.dataset.del, 1); store.set("quarantine", S.quarantine); draw(); });
    $$("[data-scan]", main).forEach(b => b.onclick = () => scan(b.dataset.scan));
    const u = $("[data-upd]", main); if (u) u.onclick = async () => { u.disabled = true; $(".u", main).innerHTML = `<span class="radar"></span> Téléchargement…`; await sleep(1200); $(".u", main).textContent = "Signatures à jour"; u.disabled = false; };
  }
  async function scan(root) {
    if (scanning) return; scanning = true;
    $$("[data-scan]", main).forEach(b => b.disabled = true);
    const files = []; const walk = (p, n) => n.type === "dir" ? Object.entries(n.children).forEach(([k, c]) => walk(resolve(k, p), c)) : files.push(p); walk(root, node(root));
    const fake = ["/usr/bin/bash", "/usr/lib/libc.so.6", "/usr/share/icons/lucien/index.theme", "/boot/vmlinuz", "/usr/lib/firmware/brcm", "/var/cache/lpm/pkgs"];
    const all = root === "/" ? [...fake, ...files, ...fake.map(f => f + ".d")] : files;
    for (let i = 0; i < all.length; i++) {
      if (!$(".prog i", main)) break;
      $(".prog i", main).style.width = ((i + 1) / all.length * 100) + "%";
      $(".scanpath", main).textContent = all[i];
      await sleep(root === "/" ? 140 : 200);
    }
    const found = threats().filter(p => p.startsWith(root === "/" ? "/" : root));
    S.lastScan = Date.now(); store.set("lastScan", S.lastScan); scanning = false;
    const res = $(".res", main);
    if (res) {
      $(".scanpath", main).textContent = `Terminé : ${all.length} fichiers analysés`;
      res.innerHTML = found.length ? `<div class="card" style="margin-top:14px">${found.map(f => `<div class="row"><div>${svg("warn", 14)} ${esc(parentOf(f)[1])}<small>Lucien.Heur.DoubleExt · ${esc(pretty(f))}</small></div><button class="btn" data-q="${esc(f)}">Mettre en quarantaine</button></div>`).join("")}</div>` : `<p style="color:#1f9c4a;margin-top:14px"><b>Aucune menace détectée</b></p>`;
      $$("[data-q]", res).forEach(b => b.onclick = () => { const p = b.dataset.q, [d, f] = parentOf(p); S.quarantine.push({ name: f, from: d, sig: "Lucien.Heur.DoubleExt" }); store.set("quarantine", S.quarantine); delete node(d).children[f]; fsChanged(); const r = b.closest(".row"); r.animate([{ opacity: 1 }, { opacity: 0, transform: "translateX(20px)" }], { duration: 250, fill: "forwards" }); setTimeout(() => r.remove(), 250); notify("av", "Menace neutralisée", f + " a été mis en quarantaine."); });
      $$("[data-scan]", main).forEach(b => b.disabled = false);
    }
    notify("av", "Analyse terminée", found.length ? found.length + " menace(s) trouvée(s)" : "Aucune menace détectée");
  }
  $$(".si", body).forEach(s => s.onclick = () => { tabSel = s.dataset.k; draw(); });
  draw();
}

/* ================= Lucien Store (.lcn / .deb) ================= */
const PKGS = [
  { id: "lsh", name: "Lucien Shell", ver: "1.0.0", fmt: "lcn", ic: "terminal", cls: "t-shell", desc: "Le shell officiel de Lucien OS", app: "shell" },
  { id: "browser", name: "Lucien Browser", ver: "1.0.0", fmt: "lcn", ic: "compass", cls: "t-browser", desc: "Navigateur rapide et privé (WebKit)", app: "browser" },
  { id: "av", name: "Lucien Antivirus", ver: "1.0.0", fmt: "lcn", ic: "shieldok", cls: "t-av", desc: "Protection temps réel + ClamAV", app: "av" },
  { id: "office", name: "Lucien Office", ver: "1.0.0", fmt: "lcn", ic: "doc", cls: "t-texte", desc: "Texte, Tableur et Présentation", app: "texte" },
  { id: "dessin", name: "Dessin", ver: "2.1.0", fmt: "lcn", ic: "brush", cls: "t-app", desc: "Peinture et croquis simples" },
  { id: "musique", name: "Lucien Musique", ver: "0.9.2", fmt: "lcn", ic: "music", cls: "t-store", desc: "Lecteur de musique minimaliste" },
  { id: "meteo", name: "Météo", ver: "1.2.0", fmt: "lcn", ic: "cloud", cls: "t-files", desc: "Prévisions locales" },
  { id: "vlc", name: "VLC", ver: "3.0.20", fmt: "deb", ic: "play", cls: "t-browser", desc: "Lecteur multimédia universel" },
  { id: "gimp", name: "GIMP", ver: "2.10.36", fmt: "deb", ic: "image", cls: "t-monitor", desc: "Retouche d'images avancée" },
  { id: "code", name: "VS Code", ver: "1.94", fmt: "deb", ic: "code", cls: "t-files", desc: "Éditeur de code" },
  { id: "steam", name: "Steam", ver: "1.0.0.79", fmt: "deb", ic: "gamepad", cls: "t-shell", desc: "Jeux (PC & laptop uniquement)", x86: true },
  { id: "kodi", name: "Kodi", ver: "21.1", fmt: "deb", ic: "display", cls: "t-av", desc: "Média-center, idéal sur Raspberry Pi" }
];
function installPkg(id) { if (!S.installed.includes(id)) { S.installed.push(id); store.set("installed", S.installed); } const p = PKGS.find(x => x.id === id); notify("store", "Installation terminée", `${p.name} (.${p.fmt}) est prêt.`); openWins.store?._redraw?.(); }
function StoreApp(body, w, arg) {
  let cat = "tout";
  const cats = [["tout", "sparkle", "Découvrir"], ["lcn", "package", "Paquets .lcn"], ["deb", "package", "Paquets .deb (Ubuntu)"], ["inst", "check", "Installés"], ["maj", "download", "Mises à jour"]];
  body.innerHTML = `<div class="split"><div class="side"><input class="txt" placeholder="Rechercher" style="width:100%;margin-bottom:8px">${cats.map(([k, g, n]) => `<div class="si" data-k="${k}">${svg(g)}<span class="lbl">${n}</span></div>`).join("")}</div><div class="main"></div></div>`;
  const main = $(".main", body), q = $("input", body);
  function draw() {
    $$(".si", body).forEach(s => s.classList.toggle("sel", s.dataset.k === cat));
    if (cat === "maj") { main.innerHTML = `<h2>Mises à jour</h2><div class="card"><div class="row"><div>Lucien OS 1.0.1<small>Correctifs de sécurité · noyau 6.8.0-48</small></div><button class="btn">Mettre à jour</button></div></div><p class="muted">Les paquets .lcn et .deb sont mis à jour ensemble par <b>lpm maj</b>.</p>`; return; }
    const s = q.value.toLowerCase(), x86 = EDITIONS[S.edition].arch === "x86_64";
    const list = PKGS.filter(p => (cat === "tout" || p.fmt === cat || (cat === "inst" && S.installed.includes(p.id))) && (!s || p.name.toLowerCase().includes(s)));
    main.innerHTML = `<h2>${cats.find(c => c[0] === cat)[2]}</h2>${cat === "tout" ? `<div class="card" style="padding:14px;background:linear-gradient(120deg,color-mix(in srgb,var(--accent) 30%,transparent),transparent)"><b style="font-size:15px">Deux formats, un seul installeur</b><br><small class="muted">Lucien OS installe les paquets <span class="badge">.lcn</span> (natifs, signés, vérifiés) et les paquets Ubuntu <span class="badge deb">.deb</span>. Double-clique un fichier ou tape <code>lpm installe</code>.</small></div>` : ""}
      <div class="apps">${list.map((p, i) => {
        const inst = S.installed.includes(p.id), na = p.x86 && !x86;
        return `<div class="appc" style="animation-delay:${i * 30}ms"><div class="icon ${p.cls}">${svg(p.ic)}</div><div class="info"><b>${p.name} <span class="badge ${p.fmt === "deb" ? "deb" : ""}">.${p.fmt}</span></b><small>${p.desc}</small><small>v${p.ver}</small><div class="prog hidden" style="margin-top:6px"><i></i></div></div>
          <button class="btn ${inst ? "ghost" : ""}" data-id="${p.id}" ${na ? "disabled title='Non disponible sur arm64'" : ""}>${na ? "x86 seul." : inst ? "Ouvrir" : "Obtenir"}</button></div>`;
      }).join("") || `<p class="muted">Aucune app.</p>`}</div>`;
    $$("[data-id]", main).forEach(b => b.onclick = async () => {
      const id = b.dataset.id, p = PKGS.find(x => x.id === id);
      if (S.installed.includes(id)) { p.app ? openApp(p.app) : notify("store", p.name, "Application de démonstration"); return; }
      const pr = $(".prog", b.closest(".appc")), bar = $("i", pr); pr.classList.remove("hidden"); b.disabled = true; b.innerHTML = `<span class="radar" style="border-color:#fff;border-top-color:transparent;width:14px;height:14px"></span>`;
      for (let i = 1; i <= 20; i++) { bar.style.width = i * 5 + "%"; await sleep(70); }
      installPkg(id); draw();
    });
  }
  q.oninput = draw;
  $$(".si", body).forEach(s => s.onclick = () => { cat = s.dataset.k; draw(); });
  w._redraw = draw;
  w._onArg = (a) => { if (typeof a !== "string") return; const id = a.replace(/[-_]\d.*$/, "").replace(/\.(lcn|deb)$/, ""); const p = PKGS.find(x => x.id === id); if (p) { cat = p.fmt; q.value = p.name; draw(); } };
  draw();
  if (arg) w._onArg(arg);
}

/* ================= Moniteur d'activité ================= */
function MonitorApp(body, w) {
  const procs = [["lucien-session", 1.2, 180], ["lucien-browser", 8.4, 640], ["lucien-office", 2.6, 310], ["lsh", 0.1, 12], ["lucien-av (temps réel)", 0.6, 95], ["mutter", 3.1, 210], ["pipewire", 0.4, 30], ["NetworkManager", 0.2, 22], ["lpm-daemon", 0.0, 18]];
  body.innerHTML = `<div class="main mon"><b>Processeur</b><div class="graph g1"></div><b>Mémoire</b><div class="graph g2"></div><table><thead><tr><th>Processus</th><th>% CPU</th><th>Mémoire</th><th></th></tr></thead><tbody></tbody></table></div>`;
  const c = Array(40).fill(5), m = Array(40).fill(35);
  $(".g1", body).innerHTML = c.map(() => "<i></i>").join(""); $(".g2", body).innerHTML = m.map(() => `<i style="background:#6a3fe0"></i>`).join("");
  const tick = () => {
    c.push(5 + Math.random() * 35); m.push(35 + Math.random() * 10); c.shift(); m.shift();
    $$(".g1 i", body).forEach((b, i) => b.style.height = c[i] + "%");
    $$(".g2 i", body).forEach((b, i) => b.style.height = m[i] + "%");
    $("tbody", body).innerHTML = procs.map(([n, cp, me], i) => `<tr><td>${n}</td><td>${(cp * (0.6 + Math.random() * 0.8)).toFixed(1)}</td><td>${me} Mo</td><td>${i ? `<button class="btn ghost" data-k="${i}" style="padding:1px 8px">Quitter</button>` : ""}</td></tr>`).join("");
    $$("[data-k]", body).forEach(b => b.onclick = () => procs.splice(+b.dataset.k, 1));
  };
  tick(); const iv = setInterval(tick, 1200); w._cleanup = () => clearInterval(iv);
}

/* ================= Notes ================= */
function NotesApp(body) {
  body.innerHTML = `<textarea class="notes" aria-label="Notes"></textarea>`;
  const ta = $("textarea", body); ta.value = S.notes; ta.oninput = () => { S.notes = ta.value; store.set("notes", S.notes); };
}

/* ================= Aperçu (images, texte) ================= */
function ApercuApp(body, w, arg) {
  const show = (a) => {
    const path = a && a.path; const n = path && node(path);
    if (!n) { body.innerHTML = `<div class="viewer"><p class="muted">Ouvre une image ou un fichier texte depuis Fichiers.</p></div>`; return; }
    setTitle("apercu", parentOf(path)[1]);
    if (n.data && /^(data:image|assets\/)/.test(n.content)) body.innerHTML = `<div class="viewer"><img src="${esc(n.content)}" alt=""></div>`;
    else if (n.data) body.innerHTML = `<div class="viewer"><p class="muted">Aperçu indisponible pour ce type de fichier.</p></div>`;
    else {
      body.innerHTML = `<textarea class="notes" spellcheck="false"></textarea>`;
      const ta = $("textarea", body); ta.value = n.content || ""; ta.oninput = () => { n.content = ta.value; saveFS(); };
    }
  };
  w._onArg = show; show(arg);
}

/* ================= Corbeille ================= */
function TrashApp(body, w) {
  const dir = HOME + "/.Corbeille";
  const draw = () => {
    const items = Object.entries(node(dir).children);
    body.innerHTML = `<div class="fmain" style="height:100%"><div class="ftool"><b>Corbeille</b><button class="btn ghost" ${items.length ? "" : "disabled"}>Vider</button></div><div class="fzone"><div class="grid">${items.map(([k, n]) => `<div class="fi" data-k="${esc(k)}" title="Double-clic pour remettre">${fileIcon(k, n)}<span class="lbl">${esc(k)}</span></div>`).join("") || `<p class="muted">La corbeille est vide.</p>`}</div></div></div>`;
    $(".ftool button", body).onclick = emptyTrash;
    const putBack = (k) => { const n = node(dir).children[k], to = n._from && node(n._from) ? n._from : HOME; delete n._from; delete node(dir).children[k]; fsCreate(to, k, n); };
    $$(".fi", body).forEach(f => {
      f.ondblclick = () => putBack(f.dataset.k);
      f.oncontextmenu = (e) => ctxMenu(e, [["Remettre", () => putBack(f.dataset.k), { ic: "undo" }], ["Supprimer immédiatement", () => { delete node(dir).children[f.dataset.k]; fsChanged(); }, { ic: "x" }]]);
    });
  };
  fsListeners.add(draw); w._cleanup = () => fsListeners.delete(draw);
  draw();
}

/* ================= À propos ================= */
function AboutApp(body) {
  const e = EDITIONS[S.edition];
  body.innerHTML = `<div style="text-align:center;padding:24px 20px" class="page-in"><img src="assets/logo.webp" alt="" style="width:130px"><h2 style="margin:8px 0 0">Lucien OS</h2><div class="muted">Version 1.0 « Os de Lune »</div>
    <div class="card" style="text-align:left;margin-top:18px"><div class="row"><span>Édition</span><b>${e.name}</b></div><div class="row"><span>Processeur</span><b>${e.cpu}</b></div><div class="row"><span>Mémoire</span><b>${e.ram}</b></div><div class="row"><span>Graphismes</span><b>${e.gpu}</b></div><div class="row"><span>Base</span><b>Ubuntu 24.04 LTS · ${e.arch}</b></div></div>
    <button class="btn" onclick="openApp('settings','maj')">Mise à jour logicielle…</button></div>`;
}
