/* Lucien Code — éditeur de code façon Visual Studio Code (sans magasin d'extensions) */
"use strict";
const LC_ROOT = HOME + "/Projets";
const LC_SAMPLES = {
  "mon-site": { type: "dir", children: {
    "index.html": { type: "file", content: '<!doctype html>\n<html lang="fr">\n<head>\n  <meta charset="utf-8">\n  <title>Mon site</title>\n  <link rel="stylesheet" href="style.css">\n</head>\n<body>\n  <h1>Bonjour depuis Lucien Code</h1>\n  <p>Modifie ce fichier puis appuie sur F5 pour voir le résultat.</p>\n  <button id="btn">Clique-moi</button>\n  <script src="script.js"></script>\n</body>\n</html>\n' },
    "style.css": { type: "file", content: "/* Styles du site */\nbody {\n  font-family: system-ui, sans-serif;\n  background: #fbf3e6;\n  color: #3b2a1a;\n  padding: 40px;\n}\n\nh1 {\n  color: #b0651f;\n}\n\nbutton {\n  padding: 10px 18px;\n  border: 0;\n  border-radius: 10px;\n  background: #d08a3c;\n  color: white;\n  font-size: 16px;\n}\n" },
    "script.js": { type: "file", content: "// Script du site\nconst bouton = document.getElementById(\"btn\");\nlet clics = 0;\n\nbouton.addEventListener(\"click\", () => {\n  clics++;\n  bouton.textContent = `Cliqué ${clics} fois`;\n  console.log(\"Clic numéro\", clics);\n});\n\nfunction carre(n) {\n  return n * n;\n}\nconsole.log(\"Le carré de 12 est\", carre(12));\n" },
    "README.md": { type: "file", content: "# Mon site\n\nUn petit site créé avec **Lucien Code**.\n\n- `index.html` : la page\n- `style.css` : les couleurs\n- `script.js` : le code JavaScript\n\nAppuie sur `F5` pour lancer l'aperçu.\n" }
  } },
  "maths.py": { type: "file", content: "# Exemple Python\ndef fibonacci(n):\n    \"\"\"Renvoie les n premiers nombres de Fibonacci.\"\"\"\n    a, b = 0, 1\n    suite = []\n    for _ in range(n):\n        suite.append(a)\n        a, b = b, a + b\n    return suite\n\nprint(fibonacci(10))\n" },
  "bonjour.lsh": { type: "file", content: "# Script Lucien Shell\nsoit nom = Lucien\ndis Bonjour $nom !\nliste ~/Projets\n" },
  "donnees.json": { type: "file", content: '{\n  "nom": "Lucien OS",\n  "version": "1.0",\n  "editions": ["pi5", "pc", "laptop"],\n  "libre": true\n}\n' }
};
const LANGS_C = { js: "JavaScript", mjs: "JavaScript", ts: "TypeScript", json: "JSON", html: "HTML", htm: "HTML", css: "CSS", py: "Python", md: "Markdown", lsh: "Lucien Shell", sh: "Shell", txt: "Texte brut", c: "C", cpp: "C++", java: "Java", xml: "XML", svg: "XML" };
const FBADGE = { js: ["JS", "#e8d44d", "#000"], ts: ["TS", "#3178c6", "#fff"], json: ["{}", "#cbcb41", "#000"], html: ["<>", "#e44d26", "#fff"], css: ["#", "#1572b6", "#fff"], py: ["PY", "#3572a5", "#fff"], md: ["M", "#519aba", "#fff"], lsh: [">_", "#d08a3c", "#fff"], sh: ["$", "#89e051", "#000"] };

/* ---------- coloration syntaxique ---------- */
const HL = (() => {
  const E = (s) => s.replace(/[&<>]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));
  const KW = {
    js: "await|async|break|case|catch|class|const|continue|default|delete|do|else|export|extends|finally|for|from|function|if|import|in|instanceof|let|new|of|return|static|super|switch|this|throw|try|typeof|var|void|while|yield|true|false|null|undefined",
    py: "and|as|assert|async|await|break|class|continue|def|del|elif|else|except|False|finally|for|from|global|if|import|in|is|lambda|None|nonlocal|not|or|pass|raise|return|True|try|while|with|yield|print|range|len",
    lsh: "soit|dis|liste|va|ici|montre|cree|dossier|jette|alias|essaie|sinon|lpm|scan|aide|quitte|echo|cd|ls|cat|if|then|fi|for|do|done|export",
    c: "int|char|float|double|void|return|if|else|for|while|struct|include|define|class|public|private|static|new|import|package|true|false|null"
  };
  const rules = {
    js: [[/\/\/.*|\/\*[\s\S]*?\*\//, "c"], [/`(?:\\[\s\S]|[^`\\])*`|"(?:\\.|[^"\\\n])*"|'(?:\\.|[^'\\\n])*'/, "s"], [/\b\d+(?:\.\d+)?\b/, "n"], [new RegExp(`\\b(?:${KW.js})\\b`), "k"], [/\b[A-Z][\w$]*\b/, "t"], [/\b[a-zA-Z_$][\w$]*(?=\s*\()/, "f"], [/\b[a-zA-Z_$][\w$]*(?=\s*:)/, "a"]],
    py: [[/#.*/, "c"], [/"""[\s\S]*?"""|'''[\s\S]*?'''|f?"(?:\\.|[^"\\\n])*"|f?'(?:\\.|[^'\\\n])*'/, "s"], [/\b\d+(?:\.\d+)?\b/, "n"], [new RegExp(`\\b(?:${KW.py})\\b`), "k"], [/@\w+/, "f"], [/\b[a-zA-Z_]\w*(?=\s*\()/, "f"]],
    css: [[/\/\*[\s\S]*?\*\//, "c"], [/"[^"\n]*"|'[^'\n]*'/, "s"], [/#[0-9a-fA-F]{3,8}\b/, "n"], [/-?\b\d+(?:\.\d+)?(?:px|em|rem|%|vh|vw|s|ms|deg|fr)?\b/, "n"], [/@[\w-]+/, "k"], [/[\w-]+(?=\s*:[^{]*;)/, "a"], [/[.#]?[a-zA-Z][\w-]*(?=[^{}]*\{)/, "f"]],
    html: [[/<!--[\s\S]*?-->/, "c"], [/<\/?[\w-]+|\/?>/, "g"], [/\s[\w-:]+(?==)/, "a"], [/"[^"]*"|'[^']*'/, "s"], [/&\w+;/, "n"]],
    json: [[/"(?:\\.|[^"\\])*"(?=\s*:)/, "a"], [/"(?:\\.|[^"\\])*"/, "s"], [/-?\b\d+(?:\.\d+)?(?:e[+-]?\d+)?\b/, "n"], [/\b(?:true|false|null)\b/, "k"]],
    md: [[/^#{1,6} .*$/m, "h"], [/\*\*[^*\n]+\*\*/, "b"], [/`[^`\n]+`/, "s"], [/\[[^\]\n]+\]\([^)\n]+\)/, "a"], [/^\s*[-*+] /m, "k"], [/^\s*\d+\. /m, "k"]],
    lsh: [[/#.*/, "c"], [/"[^"\n]*"|'[^'\n]*'/, "s"], [/\$\w+/, "a"], [/\b\d+\b/, "n"], [new RegExp(`(?:^|(?<=[\\s|&;]))(?:${KW.lsh})\\b`, "m"), "k"]],
    c: [[/\/\/.*|\/\*[\s\S]*?\*\//, "c"], [/"(?:\\.|[^"\\\n])*"|'(?:\\.|[^'\\\n])*'/, "s"], [/#\w+/, "k"], [/\b\d+(?:\.\d+)?\b/, "n"], [new RegExp(`\\b(?:${KW.c})\\b`), "k"], [/\b[a-zA-Z_]\w*(?=\s*\()/, "f"]]
  };
  rules.ts = rules.mjs = rules.js; rules.htm = rules.xml = rules.svg = rules.html; rules.sh = rules.lsh; rules.cpp = rules.java = rules.c;
  const compiled = {};
  for (const [k, list] of Object.entries(rules)) compiled[k] = { re: new RegExp(list.map(([r]) => `(${r.source})`).join("|"), "gm"), cls: list.map(([, c]) => c) };
  function highlight(src, ext) {
    const R = compiled[ext]; if (!R) return E(src);
    let out = "", last = 0; R.re.lastIndex = 0; let m;
    while ((m = R.re.exec(src))) {
      if (m[0] === "") { R.re.lastIndex++; continue; }
      const gi = m.findIndex((g, i) => i > 0 && g !== undefined) - 1;
      out += E(src.slice(last, m.index)) + `<span class="tk-${R.cls[gi]}">${E(m[0])}</span>`; last = m.index + m[0].length;
    }
    return out + E(src.slice(last));
  }
  return { highlight };
})();

function CodeApp(body, w, arg) {
  if (!node(LC_ROOT) || !node(LC_ROOT).children) { node(HOME).children["Projets"] = { type: "dir", children: clone(LC_SAMPLES) }; fsChanged(); }
  const ST = store.get("code.set", { theme: "dark", size: 13, tab: 2, wrap: false, minimap: true, autosave: false });
  const saveSet = () => store.set("code.set", ST);
  let side = "explorer", open = [], cur = null, openDirs = new Set([LC_ROOT, LC_ROOT + "/mon-site"]), selPath = null, panelTab = "terminal", preview = null, commits = store.get("code.git", []), baseline = {};
  body.innerHTML = `<div class="lc ${ST.theme === "dark" ? "" : ST.theme} ${ST.wrap ? "wrap" : ""}">
    <div class="lcmenu">${["Fichier", "Édition", "Sélection", "Affichage", "Atteindre", "Exécuter", "Terminal", "Aide"].map(m => `<span data-menu="${m}">${m}</span>`).join("")}<span class="lccmd" title="Palette de commandes (Ctrl+Maj+P)">${svg("search", 12)} Lucien Code — Projets</span></div>
    <div class="lcmain"><div class="lcact">
      <button data-s="explorer" title="Explorateur (Ctrl+Maj+E)">${svg("copy", 22, 1.6)}</button><button data-s="search" title="Rechercher (Ctrl+Maj+F)">${svg("search", 22, 1.6)}</button><button data-s="git" title="Contrôle de code source">${svg("share", 22, 1.6)}</button><button data-s="run" title="Exécuter et déboguer">${svg("play", 22, 1.6)}</button>
      <div style="flex:1"></div><button data-s="account" title="Compte">${svg("user", 22, 1.6)}</button><button data-s="settings" title="Paramètres">${svg("gear", 22, 1.6)}</button></div>
      <div class="lcside"></div>
      <div class="lced"><div class="lctabs"></div><div class="lccrumb"></div><div class="lcbody"><div class="lcview"></div></div>
        <div class="lcpanel"><div class="ph">${[["terminal", "Terminal"], ["output", "Sortie"], ["problems", "Problèmes"], ["console", "Console de débogage"]].map(([k, l]) => `<span data-p="${k}">${l}</span>`).join("")}<span class="sp"></span><button data-pnew title="Nouveau terminal">${svg("plus", 14)}</button><button data-pclose title="Fermer le panneau">${svg("x", 14)}</button></div><div class="lcpbody"></div></div></div></div>
    <div class="lcstat"><span>${svg("share", 12)} main</span><span data-st="prob">${svg("x", 12)} 0 ${svg("warn", 12)} 0</span><span class="sp"></span><span data-st="pos">Ln 1, Col 1</span><span data-st="tab">Espaces : ${ST.tab}</span><span>UTF-8</span><span data-st="lang">—</span><span data-st="bell">${svg("bell", 12)}</span></div></div>`;
  const R = $(".lc", body), sideEl = $(".lcside", R), view = $(".lcview", R), tabsEl = $(".lctabs", R), crumb = $(".lccrumb", R), panel = $(".lcpanel", R), pbody = $(".lcpbody", R), lcbody = $(".lcbody", R);
  const ext = (p) => extOf(p);
  const rel = (p) => p.replace(LC_ROOT + "/", "").replace(LC_ROOT, "Projets");
  const badge = (name, n) => { if (n.type === "dir") return `<span class="fi2" style="color:#dcb67a">${svg("folder", 14)}</span>`; const b = FBADGE[ext(name)]; return b ? `<span class="fi2" style="background:${b[1]};color:${b[2]}">${b[0]}</span>` : `<span class="fi2" style="color:var(--tx2)">${svg("file", 13)}</span>`; };

  /* ---------- barre latérale ---------- */
  function drawSide() {
    $$(".lcact button", R).forEach(b => b.classList.toggle("sel", b.dataset.s === side));
    sideEl.classList.toggle("off", side === "settings" || side === "account" ? false : !side);
    if (side === "explorer") {
      sideEl.innerHTML = `<h5>Explorateur<span class="sp"></span><button data-a="nf" title="Nouveau fichier">${svg("newdoc", 15)}</button><button data-a="nd" title="Nouveau dossier">${svg("folder", 15)}</button><button data-a="ref" title="Actualiser">${svg("restart", 15)}</button><button data-a="col" title="Tout réduire">${svg("minus", 15)}</button></h5><h5 style="padding-top:0;color:var(--tx)">${svg("down", 12)} Projets</h5><div class="lctree" tabindex="0"></div>`;
      const tree = $(".lctree", sideEl);
      const walk = (dir, depth) => Object.entries(node(dir).children).sort(([a, x], [b, y]) => (x.type === "dir" ? 0 : 1) - (y.type === "dir" ? 0 : 1) || a.localeCompare(b)).forEach(([name, n]) => {
        const p = resolve(name, dir), isOpen = openDirs.has(p);
        const row = h(`<div class="lcn ${p === selPath ? "sel" : ""}" style="padding-left:${8 + depth * 12}px" data-p="${esc(p)}"><span class="tw ${isOpen ? "open" : ""}">${n.type === "dir" ? svg("fwd", 11) : ""}</span>${badge(name, n)}<span class="nm">${esc(name)}</span></div>`);
        row.onclick = () => { selPath = p; if (n.type === "dir") { isOpen ? openDirs.delete(p) : openDirs.add(p); drawSide(); } else openFile(p); };
        row.oncontextmenu = (e) => ctxMenu(e, [...(n.type === "dir" ? [["Nouveau fichier…", () => newItem(p, false), { ic: "newdoc" }], ["Nouveau dossier…", () => newItem(p, true), { ic: "folder" }], "-"] : [["Ouvrir", () => openFile(p), { ic: "open" }], ["Ouvrir dans l'aperçu", () => { openFile(p); run(); }, { ic: "play" }], "-"]),
          ["Renommer", () => renameItem(row, p), { ic: "pen", kbd: "F2" }], ["Copier le chemin", () => navigator.clipboard?.writeText(p), { ic: "copy" }], ["Ouvrir dans le terminal", () => { showPanel("terminal"); termRun("va " + pretty(n.type === "dir" ? p : parentOf(p)[0]).replace(/ /g, "\\ ")); }, { ic: "terminal" }], "-", ["Supprimer", () => { fsTrash(p); closeTab(p, true); }, { ic: "trash" }]]);
        tree.append(row);
        if (n.type === "dir" && isOpen) walk(p, depth + 1);
      });
      walk(LC_ROOT, 0);
      tree.oncontextmenu = (e) => { if (e.target === tree) ctxMenu(e, [["Nouveau fichier…", () => newItem(LC_ROOT, false)], ["Nouveau dossier…", () => newItem(LC_ROOT, true)]]); };
      tree.onkeydown = (e) => { if (e.key === "F2" && selPath) renameItem($(`.lcn[data-p="${CSS.escape(selPath)}"]`, tree), selPath); if (e.key === "Delete" && selPath) { fsTrash(selPath); closeTab(selPath, true); } };
      $$("[data-a]", sideEl).forEach(b => b.onclick = () => { const a = b.dataset.a, dir = selPath && node(selPath)?.type === "dir" ? selPath : selPath ? parentOf(selPath)[0] : LC_ROOT; if (a === "nf") newItem(dir, false); if (a === "nd") newItem(dir, true); if (a === "ref") drawSide(); if (a === "col") { openDirs.clear(); drawSide(); } });
    }
    if (side === "search") {
      sideEl.innerHTML = `<h5>Rechercher</h5><div class="lcsearch"><input data-q placeholder="Rechercher"><input data-r placeholder="Remplacer"><div class="crow" style="gap:4px"><button class="tool" data-ra>Tout remplacer</button><small style="color:var(--tx2)" data-n></small></div></div><div class="lcres"></div>`;
      const q = $("[data-q]", sideEl), res = $(".lcres", sideEl);
      const find = () => {
        const s = q.value; res.innerHTML = ""; if (!s) return; let total = 0;
        allFiles().forEach(p => { const lines = (node(p).content || "").split("\n"), hits = []; lines.forEach((l, i) => { if (l.toLowerCase().includes(s.toLowerCase())) hits.push([i, l]); }); if (!hits.length) return; total += hits.length;
          res.append(h(`<div class="rf">${badge(parentOf(p)[1], node(p))} ${esc(rel(p))} <small style="color:var(--tx2)">${hits.length}</small></div>`));
          hits.slice(0, 50).forEach(([i, l]) => { const r = h(`<div class="rl">${esc(l.trim()).replace(new RegExp(s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi"), m => `<mark>${m}</mark>`)}</div>`); r.onclick = () => { openFile(p); goLine(i + 1); }; res.append(r); }); });
        $("[data-n]", sideEl).textContent = total ? `${total} résultat(s)` : "Aucun résultat";
      };
      q.oninput = debounce(find, 150);
      $("[data-ra]", sideEl).onclick = () => { const s = q.value, rr = $("[data-r]", sideEl).value; if (!s) return; let n = 0; allFiles().forEach(p => { const nd = node(p); const parts = nd.content.split(s); if (parts.length > 1) { n += parts.length - 1; nd.content = parts.join(rr); const t = open.find(o => o.path === p); if (t) t.text = nd.content; } }); fsChanged(); drawEditor(); find(); notify("code", "Remplacer", `${n} remplacement(s)`); };
      setTimeout(() => q.focus(), 30);
    }
    if (side === "git") {
      const mod = Object.keys(baseline).filter(p => node(p) && baseline[p] !== node(p).content);
      sideEl.innerHTML = `<h5>Contrôle de code source</h5><div class="lcgit"><textarea rows="2" placeholder="Message (Ctrl+Entrée pour valider)"></textarea><button class="btn" data-c ${mod.length ? "" : "disabled"}>${svg("check", 14)} Valider</button>
        <b style="margin-top:6px">Modifications (${mod.length})</b>${mod.map(p => `<div class="gch" data-o="${esc(p)}">${badge(parentOf(p)[1], node(p))} ${esc(parentOf(p)[1])} <small style="color:var(--tx2)">${esc(rel(parentOf(p)[0]))}</small><b>M</b></div>`).join("") || '<span style="color:var(--tx2)">Aucune modification depuis la dernière validation.</span>'}
        <b style="margin-top:10px">Historique</b>${commits.slice().reverse().map(c => `<div class="lgc"><b>${esc(c.m)}</b><br>${new Date(c.d).toLocaleString(locale())} · ${c.files.length} fichier(s)</div>`).join("") || '<span style="color:var(--tx2)">Aucune validation.</span>'}</div>`;
      const commit = () => { const m = $("textarea", sideEl).value.trim() || "Mise à jour"; commits.push({ m, d: Date.now(), files: mod }); store.set("code.git", commits); mod.forEach(p => baseline[p] = node(p).content); drawSide(); notify("code", "Validation", m); };
      $("[data-c]", sideEl).onclick = commit;
      $("textarea", sideEl).onkeydown = (e) => { if (e.key === "Enter" && e.ctrlKey) commit(); };
      $$("[data-o]", sideEl).forEach(r => r.onclick = () => openFile(r.dataset.o));
    }
    if (side === "run") {
      const t = tab();
      sideEl.innerHTML = `<h5>Exécuter et déboguer</h5><div class="lcgit"><button class="btn" data-run ${t ? "" : "disabled"}>${svg("play", 14)} Exécuter ${t ? esc(parentOf(t.path)[1]) : ""}</button><span style="color:var(--tx2)">F5 lance le fichier ouvert :<br>• HTML : aperçu en direct à côté du code<br>• JavaScript : exécution avec la console<br>• Lucien Shell (.lsh) : dans le terminal<br>• JSON : vérification de la syntaxe<br>• Markdown : aperçu mis en forme</span></div>`;
      $("[data-run]", sideEl).onclick = run;
    }
    if (side === "settings") { showSettings(); side = "explorer"; drawSide(); }
    if (side === "account") { notify("code", "Compte", "Connecté en local en tant que Lucien. Aucune donnée n'est envoyée."); side = "explorer"; drawSide(); }
  }
  const allFiles = () => { const out = []; const walk = (p) => Object.entries(node(p).children).forEach(([k, n]) => { const pp = resolve(k, p); if (n.type === "dir") walk(pp); else if (!n.data) out.push(pp); }); walk(LC_ROOT); return out; };
  async function newItem(dir, isDir) {
    const r = await dialog(w, isDir ? "Nouveau dossier" : "Nouveau fichier", [{ k: "n", l: "Nom", v: isDir ? "nouveau-dossier" : "nouveau.js" }], "Créer"); if (!r || !r.n.trim()) return;
    const name = fsCreate(dir, r.n.trim(), isDir ? { type: "dir", children: {} } : { type: "file", content: "" });
    openDirs.add(dir); const p = resolve(name, dir); selPath = p; if (!isDir) openFile(p); drawSide();
  }
  function renameItem(row, p) {
    if (!row) return; const nm = $(".nm", row), inp = h(`<input value="${esc(parentOf(p)[1])}">`); nm.replaceWith(inp); inp.focus(); inp.select();
    let done = false; const end = (ok) => { if (done) return; done = true; if (ok) { const nn = fsRename(p, inp.value), np = resolve(nn, parentOf(p)[0]); open.forEach(o => { if (o.path === p) o.path = np; }); if (cur === p) cur = np; } drawSide(); drawTabs(); };
    inp.onkeydown = (e) => { e.stopPropagation(); if (e.key === "Enter") end(true); if (e.key === "Escape") end(false); }; inp.onblur = () => end(true); inp.onclick = (e) => e.stopPropagation();
  }

  /* ---------- onglets et éditeur ---------- */
  const tab = () => open.find(o => o.path === cur);
  function openFile(p) {
    const n = node(p); if (!n || n.type === "dir") return;
    if (!open.some(o => o.path === p)) { open.push({ path: p, text: n.content || "", dirty: false, scroll: 0, sel: 0 }); if (baseline[p] === undefined) baseline[p] = n.content || ""; }
    cur = p; selPath = p; drawTabs(); drawEditor(); if (side === "explorer") $$(".lcn", sideEl).forEach(r => r.classList.toggle("sel", r.dataset.p === p));
  }
  function closeTab(p, force) {
    const t = open.find(o => o.path === p); if (!t) return;
    if (t.dirty && !force) { dialog(w, `Enregistrer les modifications de ${parentOf(p)[1]} ?`, [{ type: "info", l: "Vos modifications seront perdues si vous ne les enregistrez pas." }], "Enregistrer").then(r => { if (r) { saveTab(t); } closeTab(p, true); }); return; }
    const i = open.indexOf(t); open.splice(i, 1); if (cur === p) cur = open[Math.max(0, i - 1)]?.path || null; drawTabs(); drawEditor();
  }
  function saveTab(t = tab()) { if (!t) return; const n = node(t.path); if (!n) return; n.content = t.text; t.dirty = false; fsChanged(); drawTabs(); lint(); if (preview && preview.auto) refreshPreview(); }
  function drawTabs() {
    tabsEl.innerHTML = open.map(o => `<div class="lctab ${o.path === cur ? "sel" : ""} ${o.dirty ? "dirty" : ""}" data-p="${esc(o.path)}" title="${esc(pretty(o.path))}">${badge(parentOf(o.path)[1], { type: "file" })}<span class="nm">${esc(parentOf(o.path)[1])}</span><i data-x>${svg("x", 12)}</i></div>`).join("");
    $$(".lctab", tabsEl).forEach(el => { el.onclick = (e) => { if (e.target.closest("[data-x]")) return closeTab(el.dataset.p); cur = el.dataset.p; drawTabs(); drawEditor(); }; el.onauxclick = (e) => { if (e.button === 1) closeTab(el.dataset.p); }; el.oncontextmenu = (e) => ctxMenu(e, [["Fermer", () => closeTab(el.dataset.p)], ["Fermer les autres", () => open.filter(o => o.path !== el.dataset.p).forEach(o => closeTab(o.path))], ["Tout fermer", () => [...open].forEach(o => closeTab(o.path))], "-", ["Révéler dans l'explorateur", () => { side = "explorer"; let d = parentOf(el.dataset.p)[0]; while (d.startsWith(LC_ROOT)) { openDirs.add(d); d = parentOf(d)[0]; } selPath = el.dataset.p; drawSide(); }]]); });
    const t = tab(); crumb.innerHTML = t ? rel(t.path).split("/").map(esc).join(` ${svg("fwd", 10)} `) : "";
    $('[data-st="lang"]', R).textContent = t ? (LANGS_C[ext(t.path)] || "Texte brut") : "—";
    setTitle("code", t ? `${parentOf(t.path)[1]}${t.dirty ? " ●" : ""} — Lucien Code` : "Lucien Code");
  }
  let ta = null, pre = null, gut = null, mini = null, curl = null;
  function drawEditor() {
    const t = tab();
    if (!t) { view.innerHTML = `<div class="lcwelcome"><h1>Lucien Code</h1><p style="color:var(--tx2)">L'éditeur de code de Lucien OS</p><h3>Démarrer</h3><a data-w="nf">${svg("newdoc", 15)} Nouveau fichier…</a><a data-w="open">${svg("open", 15)} Ouvrir index.html</a><a data-w="pal">${svg("search", 15)} Palette de commandes (Ctrl+Maj+P)</a><h3>Récents</h3>${allFiles().slice(0, 6).map(p => `<a data-o="${esc(p)}">${badge(parentOf(p)[1], node(p))} ${esc(rel(p))}</a>`).join("")}<h3>Raccourcis</h3><p style="color:var(--tx2);line-height:1.9">Ctrl+P : ouvrir un fichier · Ctrl+S : enregistrer · F5 : exécuter · Ctrl+/ : commenter · Ctrl+F : rechercher · Ctrl+\` : terminal · Ctrl+B : barre latérale</p></div>`;
      $$("[data-w]", view).forEach(a => a.onclick = () => a.dataset.w === "nf" ? newItem(LC_ROOT, false) : a.dataset.w === "open" ? openFile(LC_ROOT + "/mon-site/index.html") : palette(">"));
      $$("[data-o]", view).forEach(a => a.onclick = () => openFile(a.dataset.o)); ta = null; return; }
    view.innerHTML = `<div class="lcgut"></div><div class="lccode"><div class="lccurl"></div><pre></pre><textarea spellcheck="false" autocapitalize="off" autocomplete="off" wrap="${ST.wrap ? "soft" : "off"}"></textarea></div>`;
    if (ST.minimap && !$(".lcmini", lcbody)) lcbody.insertBefore(h(`<div class="lcmini"><pre></pre><div class="vp"></div></div>`), view.nextSibling);
    if (!ST.minimap) $(".lcmini", lcbody)?.remove();
    ta = $("textarea", view); pre = $("pre", view); gut = $(".lcgut", view); mini = $(".lcmini", lcbody); curl = $(".lccurl", view);
    [ta, pre, gut].forEach(e => { e.style.fontSize = ST.size + "px"; e.style.lineHeight = Math.round(ST.size * 1.54) + "px"; });
    ta.style.tabSize = pre.style.tabSize = ST.tab;
    ta.value = t.text; paint(); ta.scrollTop = t.scroll; ta.selectionStart = ta.selectionEnd = t.sel; syncScroll();
    ta.oninput = () => { t.text = ta.value; if (!t.dirty) { t.dirty = true; drawTabs(); } paint(); lintSoon(); if (ST.autosave) autosave(); };
    ta.onscroll = syncScroll;
    ta.onkeydown = keys;
    ta.onkeyup = ta.onclick = () => { caret(); t.sel = ta.selectionStart; };
    ta.focus(); caret(); lint();
    if (mini) mini.onclick = (e) => { const r = mini.getBoundingClientRect(); ta.scrollTop = ((e.clientY - r.top) / r.height) * ta.scrollHeight - ta.clientHeight / 2; };
  }
  const autosave = debounce(() => saveTab(), 800);
  function paint() {
    const t = tab(); if (!t || !pre) return;
    const html = HL.highlight(t.text, ext(t.path)) + "\n";
    pre.innerHTML = html; if (mini) $("pre", mini).innerHTML = html;
    const n = t.text.split("\n").length; gut.innerHTML = Array.from({ length: n }, (_, i) => `<div data-l="${i + 1}">${i + 1}</div>`).join("");
    caret();
  }
  function syncScroll() {
    if (!ta) return; const t = tab(); if (t) t.scroll = ta.scrollTop;
    pre.style.transform = `translate(${-ta.scrollLeft}px,${-ta.scrollTop}px)`; gut.style.transform = `translateY(${-ta.scrollTop}px)`; curl.style.transform = `translateY(${-ta.scrollTop}px)`;
    if (mini) { const mp = $("pre", mini), k = 3 / (parseFloat(getComputedStyle(ta).lineHeight) || 20), mh = mini.clientHeight; const off = Math.max(0, Math.min(mp.scrollHeight - mh, ta.scrollTop * k - mh / 3)); mp.style.transform = `translateY(${-off}px)`; Object.assign($(".vp", mini).style, { top: ta.scrollTop * k - off + "px", height: ta.clientHeight * k + "px" }); }
  }
  function caret() {
    if (!ta) return; const before = ta.value.slice(0, ta.selectionStart), ln = before.split("\n").length, col = before.length - before.lastIndexOf("\n");
    const sel = ta.selectionEnd - ta.selectionStart;
    $('[data-st="pos"]', R).textContent = `Ln ${ln}, Col ${col}${sel ? ` (${sel} sélectionné${sel > 1 ? "s" : ""})` : ""}`;
    const lh = parseFloat(getComputedStyle(ta).lineHeight) || 20; curl.style.top = 6 + (ln - 1) * lh + "px"; curl.style.height = lh + "px";
    $$(".cur", gut).forEach(e => e.classList.remove("cur")); gut.children[ln - 1]?.classList.add("cur");
  }
  function goLine(n) { if (!ta) return; const lines = ta.value.split("\n"); let pos = 0; for (let i = 0; i < n - 1 && i < lines.length; i++) pos += lines[i].length + 1; ta.focus(); ta.setSelectionRange(pos, pos + (lines[n - 1] || "").length); const lh = parseFloat(getComputedStyle(ta).lineHeight) || 20; ta.scrollTop = (n - 5) * lh; caret(); }
  const PAIRS = { "(": ")", "[": "]", "{": "}", '"': '"', "'": "'", "`": "`" };
  function edit(start, end, text, selS, selE) { ta.setSelectionRange(start, end); document.execCommand("insertText", false, text); if (selS !== undefined) ta.setSelectionRange(selS, selE ?? selS); }
  function keys(e) {
    const t = tab(), v = ta.value, s = ta.selectionStart, en = ta.selectionEnd, ctrl = e.ctrlKey || e.metaKey, ind = " ".repeat(ST.tab);
    if (e.key === "Tab") { e.preventDefault(); if (s === en && !e.shiftKey) return edit(s, en, ind); const ls = v.lastIndexOf("\n", s - 1) + 1, block = v.slice(ls, en); const nb = e.shiftKey ? block.replace(new RegExp(`^ {1,${ST.tab}}`, "gm"), "") : block.replace(/^/gm, ind); return edit(ls, en, nb, ls, ls + nb.length); }
    if (e.key === "Enter" && !ctrl) { e.preventDefault(); const ls = v.lastIndexOf("\n", s - 1) + 1, lead = /^\s*/.exec(v.slice(ls, s))[0], prev = v[s - 1], nxt = v[s]; const more = /[{[(:]$/.test(v.slice(ls, s).trimEnd()) ? ind : ""; if (more && PAIRS[prev] === nxt) return edit(s, en, "\n" + lead + more + "\n" + lead, s + 1 + lead.length + more.length); return edit(s, en, "\n" + lead + more); }
    if (PAIRS[e.key] && !ctrl) { if (s !== en) { e.preventDefault(); return edit(s, en, e.key + v.slice(s, en) + PAIRS[e.key], s + 1, en + 1); } if (/[\w]/.test(v[s] || "") && e.key !== "(") return; if ((e.key === '"' || e.key === "'" || e.key === "`") && v[s] === e.key) { e.preventDefault(); return ta.setSelectionRange(s + 1, s + 1); } e.preventDefault(); return edit(s, en, e.key + PAIRS[e.key], s + 1); }
    if ([")", "]", "}"].includes(e.key) && v[s] === e.key && s === en) { e.preventDefault(); return ta.setSelectionRange(s + 1, s + 1); }
    if (e.key === "Backspace" && s === en && PAIRS[v[s - 1]] === v[s]) { e.preventDefault(); return edit(s - 1, s + 1, ""); }
    if (ctrl && e.key === "/") { e.preventDefault(); const cm = { py: "#", lsh: "#", sh: "#", css: null, html: null, md: null }[ext(t.path)] ?? "//"; const ls = v.lastIndexOf("\n", s - 1) + 1, le = v.indexOf("\n", en); const blk = v.slice(ls, le < 0 ? v.length : le); let nb;
      if (!cm) { const [o, c] = ext(t.path) === "css" ? ["/* ", " */"] : ["<!-- ", " -->"]; nb = blk.startsWith(o) ? blk.slice(o.length, -c.length) : o + blk + c; } else { const all = blk.split("\n").every(l => l.trim().startsWith(cm) || !l.trim()); nb = blk.split("\n").map(l => all ? l.replace(new RegExp(`^(\\s*)${cm.replace(/\//g, "\\/")} ?`), "$1") : l.trim() ? l.replace(/^(\s*)/, `$1${cm} `) : l).join("\n"); }
      return edit(ls, ls + blk.length, nb, ls, ls + nb.length); }
    if (ctrl && e.key.toLowerCase() === "d") { e.preventDefault(); const ls = v.lastIndexOf("\n", s - 1) + 1, le = v.indexOf("\n", s); const line = v.slice(ls, le < 0 ? v.length : le); return edit(le < 0 ? v.length : le, le < 0 ? v.length : le, "\n" + line, s + line.length + 1); }
    if (e.altKey && (e.key === "ArrowUp" || e.key === "ArrowDown")) { e.preventDefault(); const lines = v.split("\n"), ln = v.slice(0, s).split("\n").length - 1, to = ln + (e.key === "ArrowUp" ? -1 : 1); if (to < 0 || to >= lines.length) return; [lines[ln], lines[to]] = [lines[to], lines[ln]]; const col = s - (v.lastIndexOf("\n", s - 1) + 1); ta.select(); document.execCommand("insertText", false, lines.join("\n")); const p = lines.slice(0, to).join("\n").length + (to ? 1 : 0) + col; ta.setSelectionRange(p, p); return; }
    if (ctrl && e.key.toLowerCase() === "f") { e.preventDefault(); return findWidget(); }
    if (ctrl && e.key.toLowerCase() === "g") { e.preventDefault(); return palette(":"); }
  }
  function findWidget() {
    $(".lcfind", view)?.remove();
    const fw = h(`<div class="lcfind"><input placeholder="Rechercher" value="${esc(ta.value.slice(ta.selectionStart, ta.selectionEnd))}"><small></small><button data-p title="Précédent">${svg("back", 13)}</button><button data-n title="Suivant">${svg("fwd", 13)}</button><input data-r placeholder="Remplacer" style="width:120px"><button data-ra title="Tout remplacer">${svg("replace", 13)}</button><button data-x>${svg("x", 13)}</button></div>`);
    view.append(fw); const q = $("input", fw);
    const hits = () => { const s = q.value.toLowerCase(), out = []; if (!s) return out; let i = ta.value.toLowerCase().indexOf(s); while (i >= 0) { out.push(i); i = ta.value.toLowerCase().indexOf(s, i + 1); } return out; };
    const go = (dir) => { const hs = hits(); $("small", fw).textContent = hs.length ? "" : "Aucun résultat"; if (!hs.length) return; const p = ta.selectionStart; let i = dir > 0 ? hs.findIndex(x => x > p) : hs.length - 1 - [...hs].reverse().findIndex(x => x < p); if (i < 0 || i >= hs.length) i = dir > 0 ? 0 : hs.length - 1; ta.focus(); ta.setSelectionRange(hs[i], hs[i] + q.value.length); const lh = parseFloat(getComputedStyle(ta).lineHeight); ta.scrollTop = (ta.value.slice(0, hs[i]).split("\n").length - 6) * lh; caret(); q.focus(); $("small", fw).textContent = `${i + 1} sur ${hs.length}`; };
    q.oninput = () => go(1); q.onkeydown = (e) => { if (e.key === "Enter") go(e.shiftKey ? -1 : 1); if (e.key === "Escape") { fw.remove(); ta.focus(); } };
    $("[data-n]", fw).onclick = () => go(1); $("[data-p]", fw).onclick = () => go(-1); $("[data-x]", fw).onclick = () => { fw.remove(); ta.focus(); };
    $("[data-ra]", fw).onclick = () => { if (!q.value) return; const nv = ta.value.split(q.value).join($("[data-r]", fw).value); ta.select(); document.execCommand("insertText", false, nv); };
    q.focus(); q.select();
  }

  /* ---------- vérification (problèmes) ---------- */
  let problems = [];
  function lint() {
    const t = tab(); problems = [];
    if (t) {
      const e = ext(t.path);
      if (e === "js" || e === "mjs") { try { new Function(t.text); } catch (err) { const m = /line (\d+)|<anonymous>:(\d+)/.exec(err.stack || ""); problems.push({ path: t.path, line: m ? +(m[1] || m[2]) - 2 : 1, msg: err.message }); } }
      if (e === "json") { try { JSON.parse(t.text); } catch (err) { const m = /position (\d+)/.exec(err.message); problems.push({ path: t.path, line: m ? t.text.slice(0, +m[1]).split("\n").length : 1, msg: err.message }); } }
      if (e === "html") { const opens = (t.text.match(/<(div|p|section|ul|ol|li|span|a|button|main|header|footer|body|html|head|script|style|table|tr|td)\b/gi) || []).length, closes = (t.text.match(/<\/(div|p|section|ul|ol|li|span|a|button|main|header|footer|body|html|head|script|style|table|tr|td)>/gi) || []).length; if (opens !== closes) problems.push({ path: t.path, line: 1, msg: `${opens} balise(s) ouvertes pour ${closes} fermée(s)`, warn: true }); }
      if (e === "css") { const o = (t.text.match(/\{/g) || []).length, c = (t.text.match(/\}/g) || []).length; if (o !== c) problems.push({ path: t.path, line: 1, msg: "Accolades non équilibrées" }); }
    }
    const errs = problems.filter(p => !p.warn).length, warns = problems.length - errs;
    $('[data-st="prob"]', R).innerHTML = `${svg("x", 12)} ${errs} ${svg("warn", 12)} ${warns}`;
    if (gut) $$("div", gut).forEach(d => d.classList.toggle("err", problems.some(p => p.line === +d.dataset.l && !p.warn)));
    if (panelTab === "problems") drawPanel();
  }
  const lintSoon = debounce(lint, 500);

  /* ---------- panneau du bas ---------- */
  let term = null, output = [], consoleLog = [];
  function showPanel(tb) { panel.classList.remove("off"); panelTab = tb; drawPanel(); }
  function drawPanel() {
    $$(".ph span[data-p]", panel).forEach(s => s.classList.toggle("sel", s.dataset.p === panelTab));
    if (panelTab === "terminal") {
      if (!term) { term = h(`<div style="height:100%"></div>`); const fake = { _onArg: null, classList: { contains: () => false }, closest: () => w }; ShellApp(term, fake, "va ~/Projets"); term._w = fake; }
      pbody.innerHTML = ""; pbody.append(term); setTimeout(() => $("input", term)?.focus(), 30); return;
    }
    if (panelTab === "output") pbody.innerHTML = `<div class="lcout">${output.join("\n") || '<span class="dim">Aucune sortie. Appuie sur F5 pour exécuter le fichier ouvert.</span>'}</div>`;
    if (panelTab === "console") pbody.innerHTML = `<div class="lcout">${consoleLog.join("\n") || '<span class="dim">La console affiche les console.log() de tes pages HTML et scripts JavaScript.</span>'}</div>`;
    if (panelTab === "problems") { pbody.innerHTML = problems.length ? problems.map((p, i) => `<div class="lcprob" data-i="${i}">${svg(p.warn ? "warn" : "x", 13)} ${esc(p.msg)} <span style="color:var(--tx2)">${esc(parentOf(p.path)[1])} [Ln ${p.line}]</span></div>`).join("") : '<div class="lcout dim">Aucun problème détecté dans l\'espace de travail.</div>'; $$("[data-i]", pbody).forEach(r => r.onclick = () => { openFile(problems[+r.dataset.i].path); goLine(problems[+r.dataset.i].line); }); }
    pbody.scrollTop = pbody.scrollHeight;
  }
  const termRun = (cmd) => { if (!term) { panelTab = "terminal"; drawPanel(); } setTimeout(() => term._w._onArg && term._w._onArg(cmd), 50); };
  $$(".ph span[data-p]", panel).forEach(s => s.onclick = () => { panelTab = s.dataset.p; drawPanel(); });
  $("[data-pclose]", panel).onclick = () => panel.classList.add("off");
  $("[data-pnew]", panel).onclick = () => { term = null; showPanel("terminal"); };

  /* ---------- exécution ---------- */
  const logLine = (cls, txt) => esc(new Date().toLocaleTimeString(locale())) + `  <span class="${cls}">${esc(txt)}</span>`;
  function bundleHTML(p) {
    const dir = parentOf(p)[0]; let html = node(p).content;
    html = html.replace(/<link[^>]+href="([^"]+\.css)"[^>]*>/g, (m, f) => { const n = node(resolve(f, dir)); return n ? `<style>${n.content}</style>` : m; });
    html = html.replace(/<script[^>]+src="([^"]+\.js)"[^>]*><\/script>/g, (m, f) => { const n = node(resolve(f, dir)); return n ? `<script>${n.content.replace(/<\/script/gi, "<\\/script")}<\/script>` : m; });
    const hook = `<script>(function(){const s=(t,a)=>parent.postMessage({lucienCode:1,t,a:a.map(x=>{try{return typeof x==="object"?JSON.stringify(x):String(x)}catch(e){return String(x)}})},"*");["log","info","warn","error"].forEach(k=>{const o=console[k];console[k]=(...a)=>{s(k,a);o.apply(console,a)}});addEventListener("error",e=>s("error",[e.message+" (ligne "+e.lineno+")"]));})();<\/script>`;
    return html.includes("<head>") ? html.replace("<head>", "<head>" + hook) : hook + html;
  }
  const onMsg = (e) => { if (!e.data || !e.data.lucienCode) return; consoleLog.push(logLine(e.data.t === "error" ? "er" : e.data.t === "warn" ? "wa" : "", e.data.a.join(" "))); if (panelTab === "console") drawPanel(); };
  addEventListener("message", onMsg);
  function refreshPreview() { if (!preview) return; const f = $("iframe", preview.el); if (preview.kind === "html") f.srcdoc = bundleHTML(preview.path); }
  function run() {
    const t = tab(); if (!t) return notify("code", "Exécuter", "Ouvre d'abord un fichier.");
    if (t.dirty) saveTab(t);
    const e = ext(t.path), name = parentOf(t.path)[1];
    output.push(logLine("dim", `> Exécution de ${name}`));
    if (e === "html" || e === "md") {
      preview?.el.remove();
      const el = h(`<div class="lcprev"><div class="ph">${svg("eye", 13)} Aperçu — ${esc(name)}<span style="flex:1"></span><label style="display:flex;gap:4px;align-items:center"><input type="checkbox" data-auto checked> Actualiser à l'enregistrement</label><button class="tool" data-rel>${svg("restart", 12)}</button><button class="tool" data-x>${svg("x", 12)}</button></div><iframe sandbox="allow-scripts allow-modals allow-forms"></iframe></div>`);
      lcbody.append(el); preview = { el, path: t.path, kind: e, auto: true };
      if (e === "md") { const md = t.text.replace(/[&<>]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c])).replace(/^### (.*)$/gm, "<h3>$1</h3>").replace(/^## (.*)$/gm, "<h2>$1</h2>").replace(/^# (.*)$/gm, "<h1>$1</h1>").replace(/\*\*([^*]+)\*\*/g, "<b>$1</b>").replace(/`([^`]+)`/g, "<code>$1</code>").replace(/^\s*[-*] (.*)$/gm, "<li>$1</li>").replace(/\n\n/g, "<p>"); $("iframe", el).srcdoc = `<body style="font-family:system-ui;padding:20px;line-height:1.6">${md}</body>`; }
      else refreshPreview();
      $("[data-x]", el).onclick = () => { el.remove(); preview = null; };
      $("[data-rel]", el).onclick = refreshPreview;
      $("[data-auto]", el).onchange = (ev) => preview.auto = ev.target.checked;
      output.push(logLine("ok", "Aperçu ouvert à droite."));
    } else if (e === "js" || e === "mjs") {
      showPanel("console"); consoleLog.push(logLine("dim", `▶ node ${name}`));
      const frame = h(`<iframe sandbox="allow-scripts" style="display:none"></iframe>`); document.body.append(frame);
      frame.srcdoc = `<script>(function(){const s=(t,a)=>parent.postMessage({lucienCode:1,t,a:a.map(x=>{try{return typeof x==="object"?JSON.stringify(x):String(x)}catch(e){return String(x)}})},"*");["log","info","warn","error"].forEach(k=>{console[k]=(...a)=>s(k,a)});try{${t.text.replace(/<\/script/gi, "<\\/script")}\n}catch(e){s("error",[e.name+" : "+e.message])}s("info",["Terminé."]);})();<\/script>`;
      setTimeout(() => frame.remove(), 5000);
    } else if (e === "lsh" || e === "sh") {
      showPanel("terminal"); t.text.split("\n").filter(l => l.trim() && !l.trim().startsWith("#")).forEach((l, i) => setTimeout(() => termRun(l), 120 * i));
    } else if (e === "json") {
      try { JSON.parse(t.text); output.push(logLine("ok", "JSON valide.")); } catch (err) { output.push(logLine("er", "JSON invalide : " + err.message)); } showPanel("output");
    } else if (e === "py") {
      output.push(logLine("wa", "Python s'exécute avec « python3 " + name + " » dans le terminal de Lucien OS installé. La démo web ne contient pas Python.")); showPanel("output");
    } else { output.push(logLine("wa", `Pas d'exécution prévue pour les fichiers .${e || "?"}`)); showPanel("output"); }
  }

  /* ---------- palette de commandes ---------- */
  const COMMANDS = () => [
    ["Fichier : Nouveau fichier", "Ctrl+N", () => newItem(LC_ROOT, false)], ["Fichier : Enregistrer", "Ctrl+S", () => saveTab()], ["Fichier : Tout enregistrer", "", () => open.forEach(saveTab)], ["Fichier : Fermer l'éditeur", "Ctrl+W", () => cur && closeTab(cur)],
    ["Exécuter : Lancer le fichier", "F5", run], ["Affichage : Basculer le terminal", "Ctrl+`", () => panel.classList.contains("off") ? showPanel("terminal") : panel.classList.add("off")], ["Affichage : Afficher les problèmes", "", () => showPanel("problems")],
    ["Affichage : Basculer la barre latérale", "Ctrl+B", () => { sideEl.classList.toggle("off"); }], ["Affichage : Basculer la minicarte", "", () => { ST.minimap = !ST.minimap; saveSet(); drawEditor(); }], ["Affichage : Retour automatique à la ligne", "Alt+Z", () => { ST.wrap = !ST.wrap; saveSet(); R.classList.toggle("wrap", ST.wrap); drawEditor(); }],
    ["Préférences : Thème sombre", "", () => setTheme("dark")], ["Préférences : Thème clair", "", () => setTheme("light")], ["Préférences : Thème Lucien", "", () => setTheme("lucien")], ["Préférences : Ouvrir les paramètres", "Ctrl+,", showSettings],
    ["Affichage : Agrandir la police", "Ctrl+=", () => { ST.size = Math.min(28, ST.size + 1); saveSet(); drawEditor(); }], ["Affichage : Réduire la police", "Ctrl+-", () => { ST.size = Math.max(9, ST.size - 1); saveSet(); drawEditor(); }],
    ["Atteindre : Ligne…", "Ctrl+G", () => palette(":")], ["Rechercher dans les fichiers", "Ctrl+Maj+F", () => { side = "search"; drawSide(); }], ["Contrôle de code source : Valider", "", () => { side = "git"; drawSide(); }],
    ["Mettre en forme le document (JSON)", "Maj+Alt+F", () => { const t = tab(); if (t && ext(t.path) === "json") { try { const v = JSON.stringify(JSON.parse(t.text), null, ST.tab); ta.select(); document.execCommand("insertText", false, v + "\n"); } catch { notify("code", "Mise en forme", "JSON invalide."); } } else notify("code", "Mise en forme", "Disponible pour les fichiers JSON."); }]
  ];
  function palette(mode = ">") {
    $(".lcpal", R)?.remove();
    const pal = h(`<div class="lcpal"><input value="${mode === ">" ? ">" : mode === ":" ? ":" : ""}"><div class="pl"></div></div>`); R.append(pal);
    const inp = $("input", pal), list = $(".pl", pal); let sel = 0, items = [];
    const draw = () => {
      const v = inp.value;
      if (v.startsWith(":")) { items = [{ l: `Atteindre la ligne ${v.slice(1) || "…"}`, k: "", f: () => goLine(+v.slice(1) || 1) }]; }
      else if (v.startsWith(">")) { const q = v.slice(1).trim().toLowerCase(); items = COMMANDS().filter(([l]) => l.toLowerCase().includes(q)).map(([l, k, f]) => ({ l, k, f })); }
      else { const q = v.toLowerCase(); items = allFiles().filter(p => rel(p).toLowerCase().includes(q)).map(p => ({ l: parentOf(p)[1], k: rel(parentOf(p)[0]), f: () => openFile(p) })); }
      sel = Math.min(sel, Math.max(0, items.length - 1));
      list.innerHTML = items.map((it, i) => `<div class="pi ${i === sel ? "sel" : ""}" data-i="${i}"><span>${esc(it.l)}</span><small>${esc(it.k)}</small></div>`).join("") || '<div class="pi"><small>Aucun résultat</small></div>';
      $$("[data-i]", list).forEach(r => r.onclick = () => go(+r.dataset.i));
    };
    const go = (i) => { const it = items[i]; pal.remove(); it && it.f(); };
    inp.oninput = () => { sel = 0; draw(); };
    inp.onkeydown = (e) => { e.stopPropagation(); if (e.key === "ArrowDown") { sel = Math.min(items.length - 1, sel + 1); draw(); e.preventDefault(); } if (e.key === "ArrowUp") { sel = Math.max(0, sel - 1); draw(); e.preventDefault(); } if (e.key === "Enter") go(sel); if (e.key === "Escape") { pal.remove(); ta?.focus(); } };
    inp.onblur = () => setTimeout(() => pal.remove(), 150);
    draw(); inp.focus(); inp.setSelectionRange(inp.value.length, inp.value.length);
  }
  function setTheme(th) { ST.theme = th; saveSet(); R.classList.remove("light", "lucien"); if (th !== "dark") R.classList.add(th); }
  function showSettings() {
    const el = h(`<div class="lcset"><h2>Paramètres</h2><div class="card">
      <div class="row"><div>Thème de couleur</div><select data-k="theme"><option value="dark">Sombre</option><option value="light">Clair</option><option value="lucien">Lucien</option></select></div>
      <div class="row"><div>Taille de police</div><input type="number" data-k="size" min="9" max="28" value="${ST.size}" style="width:70px"></div>
      <div class="row"><div>Taille des tabulations</div><select data-k="tab"><option>2</option><option>4</option><option>8</option></select></div>
      <div class="row"><div>Retour automatique à la ligne</div><button class="sw ${ST.wrap ? "on" : ""}" data-b="wrap"></button></div>
      <div class="row"><div>Minicarte</div><button class="sw ${ST.minimap ? "on" : ""}" data-b="minimap"></button></div>
      <div class="row"><div>Enregistrement automatique</div><button class="sw ${ST.autosave ? "on" : ""}" data-b="autosave"></button></div></div>
      <p style="color:var(--tx2)">Lucien Code n'a pas de magasin d'extensions : tout ce qu'il faut est déjà inclus (coloration de 12 langages, terminal, aperçu HTML, console, recherche, contrôle de version).</p><button class="btn" data-x>Fermer</button></div>`);
    view.append(el); $('[data-k="theme"]', el).value = ST.theme; $('[data-k="tab"]', el).value = String(ST.tab);
    $('[data-k="theme"]', el).onchange = (e) => setTheme(e.target.value);
    $('[data-k="size"]', el).onchange = (e) => { ST.size = +e.target.value; saveSet(); };
    $('[data-k="tab"]', el).onchange = (e) => { ST.tab = +e.target.value; saveSet(); $('[data-st="tab"]', R).textContent = "Espaces : " + ST.tab; };
    $$("[data-b]", el).forEach(b => b.onclick = () => { b.classList.toggle("on"); ST[b.dataset.b] = b.classList.contains("on"); saveSet(); R.classList.toggle("wrap", ST.wrap); });
    $("[data-x]", el).onclick = () => { el.remove(); drawEditor(); };
  }

  /* ---------- menus et raccourcis ---------- */
  const MENUS2 = {
    "Fichier": [["Nouveau fichier", () => newItem(LC_ROOT, false), { kbd: "Ctrl+N" }], ["Nouveau dossier", () => newItem(LC_ROOT, true)], ["Ouvrir un fichier…", () => palette(""), { kbd: "Ctrl+P" }], "-", ["Enregistrer", () => saveTab(), { kbd: "Ctrl+S" }], ["Tout enregistrer", () => open.forEach(saveTab)], "-", ["Fermer l'éditeur", () => cur && closeTab(cur), { kbd: "Ctrl+W" }], ["Quitter", () => closeApp("code")]],
    "Édition": [["Annuler", () => document.execCommand("undo"), { kbd: "Ctrl+Z" }], ["Rétablir", () => document.execCommand("redo"), { kbd: "Ctrl+Y" }], "-", ["Rechercher", () => ta && findWidget(), { kbd: "Ctrl+F" }], ["Rechercher dans les fichiers", () => { side = "search"; drawSide(); }, { kbd: "Ctrl+Maj+F" }], "-", ["Commenter la ligne", () => ta && keys({ key: "/", ctrlKey: true, preventDefault() {} }), { kbd: "Ctrl+/" }]],
    "Sélection": [["Tout sélectionner", () => ta?.select(), { kbd: "Ctrl+A" }], ["Dupliquer la ligne", () => ta && keys({ key: "d", ctrlKey: true, preventDefault() {} }), { kbd: "Ctrl+D" }], ["Monter la ligne", () => ta && keys({ key: "ArrowUp", altKey: true, preventDefault() {} }), { kbd: "Alt+↑" }], ["Descendre la ligne", () => ta && keys({ key: "ArrowDown", altKey: true, preventDefault() {} }), { kbd: "Alt+↓" }]],
    "Affichage": [["Palette de commandes…", () => palette(">"), { kbd: "Ctrl+Maj+P" }], "-", ["Explorateur", () => { side = "explorer"; drawSide(); }], ["Rechercher", () => { side = "search"; drawSide(); }], ["Contrôle de code source", () => { side = "git"; drawSide(); }], "-", ["Terminal", () => showPanel("terminal"), { kbd: "Ctrl+`" }], ["Problèmes", () => showPanel("problems")], ["Sortie", () => showPanel("output")], "-", ["Minicarte", () => { ST.minimap = !ST.minimap; saveSet(); drawEditor(); }], ["Retour à la ligne", () => { ST.wrap = !ST.wrap; saveSet(); R.classList.toggle("wrap", ST.wrap); drawEditor(); }, { kbd: "Alt+Z" }]],
    "Atteindre": [["Atteindre le fichier…", () => palette(""), { kbd: "Ctrl+P" }], ["Atteindre la ligne…", () => palette(":"), { kbd: "Ctrl+G" }]],
    "Exécuter": [["Démarrer", run, { kbd: "F5" }], ["Ouvrir l'aperçu HTML", run]],
    "Terminal": [["Nouveau terminal", () => { term = null; showPanel("terminal"); }], ["Exécuter le fichier dans le terminal", () => { const t = tab(); if (t && ext(t.path) === "lsh") run(); else termRun("montre " + pretty(cur || LC_ROOT).replace(/ /g, "\\ ")); }]],
    "Aide": [["Bienvenue", () => { cur = null; drawTabs(); drawEditor(); }], ["Raccourcis clavier", () => dialog(w, "Raccourcis clavier", [{ type: "info", html: "Ctrl+P ouvrir · Ctrl+Maj+P commandes · Ctrl+S enregistrer · F5 exécuter · Ctrl+/ commenter · Ctrl+D dupliquer · Alt+↑/↓ déplacer · Ctrl+F rechercher · Ctrl+G ligne · Ctrl+` terminal · Ctrl+B barre latérale · Tab / Maj+Tab indenter" }], "")], ["À propos de Lucien Code", () => dialog(w, "Lucien Code", [{ type: "info", html: "Version 1.0 · inclus dans Lucien OS.<br>Sans magasin d'extensions : tout est déjà intégré." }], "")]]
  };
  $$("[data-menu]", R).forEach(m => m.onclick = (e) => { const r = m.getBoundingClientRect(); ctxMenu({ preventDefault() {}, stopPropagation() {}, clientX: r.left, clientY: r.bottom + 2 }, MENUS2[m.dataset.menu]); });
  $(".lccmd", R).onclick = () => palette("");
  $$(".lcact button", R).forEach(b => b.onclick = () => { if (side === b.dataset.s && b.dataset.s !== "settings") { side = null; sideEl.classList.add("off"); $$(".lcact button", R).forEach(x => x.classList.remove("sel")); return; } side = b.dataset.s; drawSide(); });
  $('[data-st="prob"]', R).onclick = () => showPanel("problems");
  $('[data-st="pos"]', R).onclick = () => palette(":");
  body.addEventListener("keydown", (e) => {
    const ctrl = e.ctrlKey || e.metaKey, k = e.key.toLowerCase();
    if (ctrl && e.shiftKey && k === "p") { e.preventDefault(); return palette(">"); }
    if (ctrl && e.shiftKey && k === "f") { e.preventDefault(); side = "search"; return drawSide(); }
    if (ctrl && e.shiftKey && k === "e") { e.preventDefault(); side = "explorer"; return drawSide(); }
    if (ctrl && k === "p") { e.preventDefault(); return palette(""); }
    if (ctrl && k === "s") { e.preventDefault(); e.stopPropagation(); return saveTab(); }
    if (ctrl && k === "w") { e.preventDefault(); return cur && closeTab(cur); }
    if (ctrl && k === "n") { e.preventDefault(); return newItem(LC_ROOT, false); }
    if (ctrl && k === "b") { e.preventDefault(); return sideEl.classList.toggle("off"); }
    if (ctrl && (e.key === "`" || e.code === "Backquote")) { e.preventDefault(); return panel.classList.contains("off") ? showPanel("terminal") : panel.classList.add("off"); }
    if (ctrl && e.key === ",") { e.preventDefault(); return showSettings(); }
    if (e.altKey && k === "z") { e.preventDefault(); ST.wrap = !ST.wrap; saveSet(); R.classList.toggle("wrap", ST.wrap); return drawEditor(); }
    if (e.key === "F5") { e.preventDefault(); return run(); }
  });
  const onFs = () => { if (side === "explorer") drawSide(); };
  fsListeners.add(onFs);
  w._cleanup = () => { fsListeners.delete(onFs); removeEventListener("message", onMsg); };
  w._beforeClose = () => { if (open.some(o => o.dirty) && !w._force) { dialog(w, "Fichiers non enregistrés", [{ type: "info", l: "Certains fichiers ont des modifications non enregistrées. Les enregistrer avant de quitter ?" }], "Tout enregistrer").then(r => { if (r) open.forEach(o => o.dirty && saveTab(o)); w._force = true; closeApp("code"); }); return false; } };
  w._onArg = (a) => { if (a && a.path) openFile(a.path); };
  drawSide(); drawTabs(); drawEditor(); showPanel("terminal"); panel.classList.add("off");
  if (arg && arg.path) openFile(arg.path); else openFile(LC_ROOT + "/mon-site/index.html");
}
