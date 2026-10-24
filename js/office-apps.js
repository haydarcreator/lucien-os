/* Lucien Office — écran d'accueil Office */
"use strict";
const OFFICE_APPS = ["texte", "tableur", "presentation", "carnet", "taches", "formulaires", "calc"];

/* ================= Accueil Lucien Office ================= */
function OfficeHubApp(body) {
  const draw = () => {
    const docs = allDocs(["ltxt", "docx", "ltab", "xlsx", "csv", "lpre", "pptx"]);
    const hour = new Date().getHours();
    body.innerHTML = `<div class="ohub"><nav>${svg("home", 20)}${OFFICE_APPS.map(a => `<button data-a="${a}" title="${APPS[a].name}">${appIcon(a)}</button>`).join("")}</nav>
      <div class="hm"><h1>${hour < 18 ? "Bonjour" : "Bonsoir"}, Lucien</h1>
      <div class="hnew"><button class="hn" data-n="texte">${appIcon("texte")}<span>Document vierge</span></button><button class="hn" data-n="tableur">${appIcon("tableur")}<span>Classeur vierge</span></button><button class="hn" data-n="presentation">${appIcon("presentation")}<span>Présentation vierge</span></button><button class="hn" data-n="carnet">${appIcon("carnet")}<span>Nouveau carnet</span></button><button class="hn" data-n="formulaires">${appIcon("formulaires")}<span>Nouveau formulaire</span></button></div>
      <h3>Applications</h3><div class="happs">${OFFICE_APPS.map((a, i) => `<button data-a="${a}" style="animation-delay:${i * 35}ms">${appIcon(a)}<span>${APPS[a].name.replace("Lucien ", "")}</span></button>`).join("")}</div>
      <h3>Récents</h3><div class="recent">${docs.length ? docs.map(pth => `<div data-o="${esc(pth)}">${fileIcon(parentOf(pth)[1], node(pth)).replace('class="icon', 'style="width:28px;height:28px;border-radius:6px" class="icon')}<b>${esc(parentOf(pth)[1])}</b><small>${esc(pretty(parentOf(pth)[0]))}</small></div>`).join("") : `<p class="muted">Aucun document récent.</p>`}</div></div></div>`;
    $$("[data-a]", body).forEach(b => b.onclick = () => openApp(b.dataset.a));
    $$("[data-n]", body).forEach(b => b.onclick = () => openApp(b.dataset.n));
    $$("[data-o]", body).forEach(r => r.onclick = () => openPath(r.dataset.o));
  };
  draw();
}
