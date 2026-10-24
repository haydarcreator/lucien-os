/* Site lucienos.web.app : en-tête, pied de page, thème, menu mobile, apparitions, démo intégrée */
"use strict";
const GITHUB = "https://github.com/haydarcreator/lucien-os";
(function site() {
  const page = document.body.dataset.page;
  const nav = [["index.html#fonctions", "Fonctions", "fonctions"], ["index.html#editions", "Éditions", "editions"], ["nouveautes.html", "Nouveautés", "nouveautes"], ["demo/", "Tester", "demo"]];
  const top = h(`<header class="top"><div class="wrap bar">
    <a class="brand" href="index.html"><img src="assets/logo.webp" alt="">Lucien OS</a>
    <nav class="links">${nav.map(([u, l, k]) => `<a href="${u}" class="${k === page ? "on" : ""}">${l}</a>`).join("")}<a href="${GITHUB}" rel="noopener">GitHub</a>
      <button class="theme-btn" title="Changer de thème" aria-label="Changer de thème">${svg("contrast", 18)}</button></nav>
    <button class="menu-btn" aria-label="Menu">${svg("ul", 22)}</button></div></header>`);
  document.body.prepend(top);
  const foot = h(`<footer><div class="wrap cols">
    <div><a class="brand" href="index.html" style="color:var(--text)"><img src="assets/logo.webp" alt="">Lucien OS</a><p style="margin:10px 0 0;max-width:320px">Élégant comme macOS, libre comme Linux. Projet open source sous licence MIT.</p></div>
    <div class="fl"><a href="nouveautes.html">Nouveautés</a><a href="demo/">Tester la démo</a><a href="conditions.html">Conditions d'utilisation</a><a href="confidentialite.html">Politique de confidentialité</a><a href="${GITHUB}" rel="noopener">Code source</a><a href="${GITHUB}/issues" rel="noopener">Contact</a></div>
  </div><div class="wrap" style="margin-top:24px">© ${new Date().getFullYear()} Lucien OS. Lucien OS n'est affilié ni à Apple, ni à Microsoft, ni à Canonical, ni à la Raspberry Pi Foundation.</div></footer>`);
  document.body.append(foot);

  // thème clair / sombre mémorisé
  const root = document.documentElement;
  try { const t = localStorage.getItem("lucien.site.theme"); if (t) root.dataset.theme = t; } catch {}
  $(".theme-btn", top).onclick = () => {
    const dark = root.dataset.theme ? root.dataset.theme === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
    root.dataset.theme = dark ? "light" : "dark";
    try { localStorage.setItem("lucien.site.theme", root.dataset.theme); } catch {}
  };
  const links = $("nav.links", top);
  $(".menu-btn", top).onclick = () => links.classList.toggle("open");
  $$("a", links).forEach(a => a.onclick = () => links.classList.remove("open"));
  addEventListener("scroll", () => top.classList.toggle("scrolled", scrollY > 8), { passive: true });

  // apparition au défilement
  const io = new IntersectionObserver((es) => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }), { threshold: .12 });
  $$(".reveal").forEach((el, i) => { el.style.transitionDelay = (el.dataset.d || 0) + "ms"; io.observe(el); });

  // icônes déclarées en HTML : <span data-i="nom" data-s="taille">
  $$("[data-i]").forEach(el => el.innerHTML = svg(el.dataset.i, +el.dataset.s || 18));

  // démo intégrée : chargée au clic pour garder la page légère
  const dev = $(".device");
  if (dev) {
    const over = $(".over", dev), frame = $("iframe", dev);
    const start = () => { if (!frame.src) frame.src = frame.dataset.src; over.classList.add("gone"); frame.focus(); };
    over.onclick = start;
    $$("[data-start]").forEach(b => b.onclick = (e) => { e.preventDefault(); dev.scrollIntoView({ behavior: "smooth", block: "center" }); start(); });
    const fs = $("[data-full]"); if (fs) fs.onclick = () => { start(); (dev.requestFullscreen || dev.webkitRequestFullscreen)?.call(dev); };
  }
})();
