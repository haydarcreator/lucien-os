/* Lucien OS — noyau de la démo : utilitaires, icônes, état, fichiers, fenêtres, Dock */
"use strict";
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const h = (html) => { const t = document.createElement("template"); t.innerHTML = html.trim(); return t.content.firstElementChild; };
const esc = (s) => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const debounce = (fn, ms) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };

/* ================= Icônes (SVG, aucun emoji) ================= */
const IC = {
  folder: '<path d="M3 6.5A1.5 1.5 0 0 1 4.5 5h4l2 2h9A1.5 1.5 0 0 1 21 8.5v9a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 17.5z"/>',
  file: '<path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4"/>',
  doc: '<path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4M9 12h6M9 15h6M9 18h4"/>',
  sheet: '<rect x="4" y="4" width="16" height="16" rx="1.5"/><path d="M4 10h16M4 15h16M10 4v16"/>',
  slides: '<rect x="3" y="4" width="18" height="12" rx="1.5"/><path d="M12 16v4M8 20h8M8 9h8M8 12h5"/>',
  terminal: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 9l3 3-3 3M12 15h5"/>',
  compass: '<circle cx="12" cy="12" r="9"/><path d="M15.5 8.5l-2 5-5 2 2-5z"/>',
  shield: '<path d="M12 3l8 3v6c0 4.5-3.4 8-8 9-4.6-1-8-4.5-8-9V6z"/>',
  shieldok: '<path d="M12 3l8 3v6c0 4.5-3.4 8-8 9-4.6-1-8-4.5-8-9V6z"/><path d="M8.5 12l2.5 2.5 4.5-5"/>',
  bag: '<path d="M5 8h14l-1 12H6z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
  note: '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 8h6M9 12h6M9 16h4"/>',
  chart: '<path d="M4 20V4M4 20h16"/><path d="M8 16v-4M12 16V8M16 16v-6"/>',
  trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v6M14 11v6"/>',
  wifi: '<path d="M2 9a15 15 0 0 1 20 0M5 12.5a10 10 0 0 1 14 0M8.5 16a5 5 0 0 1 7 0"/><circle cx="12" cy="19" r="1" fill="currentColor"/>',
  bt: '<path d="M7 7l10 10-5 4V3l5 4L7 17"/>',
  moon: '<path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5z"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5L19 19M5 19l1.5-1.5M17.5 6.5L19 5"/>',
  contrast: '<circle cx="12" cy="12" r="9"/><path d="M12 3a9 9 0 0 1 0 18z" fill="currentColor"/>',
  search: '<circle cx="11" cy="11" r="6"/><path d="M20 20l-4.5-4.5"/>',
  battery: '<rect x="2" y="7" width="18" height="10" rx="2"/><path d="M22 10v4"/><rect x="4" y="9" width="12" height="6" rx="1" fill="currentColor" stroke="none"/>',
  volume: '<path d="M4 9h4l5-4v14l-5-4H4z"/><path d="M16 9a4 4 0 0 1 0 6M18.5 6.5a8 8 0 0 1 0 11"/>',
  bell: '<path d="M6 16v-5a6 6 0 0 1 12 0v5l2 2H4z"/><path d="M10 20a2 2 0 0 0 4 0"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/>',
  lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  users: '<circle cx="9" cy="8" r="3.5"/><path d="M2 20a7 7 0 0 1 14 0M16 4.5a3.5 3.5 0 0 1 0 7M18 13.5a7 7 0 0 1 4 6.5"/>',
  power: '<path d="M12 3v9"/><path d="M6.3 6.3a8 8 0 1 0 11.4 0"/>',
  restart: '<path d="M20 12a8 8 0 1 1-2.3-5.7"/><path d="M20 4v5h-5"/>',
  download: '<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>',
  upload: '<path d="M12 20V9M7 14l5-5 5 5M5 4h14"/>',
  palette: '<path d="M12 3a9 9 0 1 0 0 18c1.5 0 2-1 2-2s-1-1.5-1-2.5 1-1.5 2-1.5h2a4 4 0 0 0 4-4c0-4.4-4-8-9-8z"/><circle cx="7.5" cy="11" r="1"/><circle cx="10" cy="7" r="1"/><circle cx="15" cy="7.5" r="1"/>',
  display: '<rect x="3" y="4" width="18" height="12" rx="1.5"/><path d="M9 20h6M12 16v4"/>',
  image: '<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="10" r="1.5"/><path d="M21 16l-5-5-9 8"/>',
  keyboard: '<rect x="2" y="6" width="20" height="12" rx="2"/><path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M7 14h10"/>',
  home: '<path d="M3 11l9-7 9 7v9H3z"/><path d="M10 20v-6h4v6"/>',
  desktop: '<rect x="3" y="4" width="18" height="13" rx="1.5"/><path d="M8 21h8"/>',
  music: '<path d="M9 18V5l11-2v13"/><circle cx="6.5" cy="18" r="2.5"/><circle cx="17.5" cy="16" r="2.5"/>',
  hdd: '<rect x="3" y="6" width="18" height="12" rx="2"/><path d="M7 14h.01M11 14h6"/>',
  package: '<path d="M12 3l8 4.5v9L12 21l-8-4.5v-9z"/><path d="M4 7.5l8 4.5 8-4.5M12 12v9"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7"/>',
  x: '<path d="M6 6l12 12M18 6L6 18"/>',
  minus: '<path d="M5 12h14"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  expand: '<path d="M14 4h6v6M10 20H4v-6M20 4l-7 7M4 20l7-7"/>',
  warn: '<path d="M12 3l10 18H2z"/><path d="M12 10v5M12 18h.01"/>',
  back: '<path d="M15 5l-7 7 7 7"/>', fwd: '<path d="M9 5l7 7-7 7"/>', down: '<path d="M6 9l6 6 6-6"/>',
  zap: '<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>',
  wall: '<rect x="3" y="4" width="18" height="16" rx="1"/><path d="M3 10h18M3 15h18M9 4v6M15 10v5M9 15v5"/>',
  printer: '<path d="M7 9V3h10v6"/><rect x="3" y="9" width="18" height="8" rx="2"/><path d="M7 14h10v7H7z"/>',
  save: '<path d="M5 3h11l3 3v15H5z"/><path d="M8 3v5h7V3M8 21v-7h8v7"/>',
  undo: '<path d="M9 14L4 9l5-5"/><path d="M4 9h11a5 5 0 0 1 0 10h-3"/>',
  redo: '<path d="M15 14l5-5-5-5"/><path d="M20 9H9a5 5 0 0 0 0 10h3"/>',
  cut: '<circle cx="6" cy="18" r="3"/><circle cx="18" cy="18" r="3"/><path d="M8 16L19 4M16 16L5 4"/>',
  copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/>',
  paste: '<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4V2h6v2M9 10h6M9 14h6"/>',
  brushfmt: '<path d="M4 4h12v5H4z"/><path d="M16 6h3v5h-7v3M11 14h2v7h-2z"/>',
  alignL: '<path d="M4 6h16M4 10h10M4 14h16M4 18h10"/>', alignC: '<path d="M4 6h16M7 10h10M4 14h16M7 18h10"/>',
  alignR: '<path d="M4 6h16M10 10h10M4 14h16M10 18h10"/>', justify: '<path d="M4 6h16M4 10h16M4 14h16M4 18h16"/>',
  ul: '<path d="M9 6h11M9 12h11M9 18h11"/><circle cx="4.5" cy="6" r="1" fill="currentColor"/><circle cx="4.5" cy="12" r="1" fill="currentColor"/><circle cx="4.5" cy="18" r="1" fill="currentColor"/>',
  ol: '<path d="M10 6h10M10 12h10M10 18h10M4 4h1.5v4M4 14.5c.5-1 2.5-1 2.5.3 0 1-2.5 1.7-2.5 3.2H7"/>',
  indent: '<path d="M4 5h16M10 10h10M10 14h10M4 19h16M4 9l3 3-3 3"/>', outdent: '<path d="M4 5h16M10 10h10M10 14h10M4 19h16M7 9l-3 3 3 3"/>',
  spacing: '<path d="M10 6h10M10 12h10M10 18h10M5 4v16M3 6l2-2 2 2M3 18l2 2 2-2"/>',
  table: '<rect x="3" y="4" width="18" height="16" rx="1"/><path d="M3 10h18M3 15h18M9 4v16M15 4v16"/>',
  link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
  shape: '<rect x="3" y="3" width="10" height="10" rx="1"/><circle cx="15.5" cy="15.5" r="5.5"/>',
  sum: '<path d="M18 5H6l6 7-6 7h12"/>',
  sortaz: '<path d="M7 4v16M3 16l4 4 4-4M14 4h5l-5 7h5M14 20l2.5-6 2.5 6M14.8 18h3.4"/>',
  sortza: '<path d="M7 20V4M3 8l4-4 4 4M14 4h5l-5 7h5M14 20l2.5-6 2.5 6M14.8 18h3.4"/>',
  play: '<path d="M7 4l13 8-13 8z"/>',
  highlight: '<path d="M4 21h16"/><path d="M14 4l5 5-8 8H6v-5z"/>',
  fcolor: '<path d="M4 21h16"/><path d="M7 17l5-13 5 13M8.8 12.5h6.4"/>',
  fill: '<path d="M3 21h18"/><path d="M5 11l7-7 7 7-6 6a1.4 1.4 0 0 1-2 0z"/><path d="M19 13c1 1.5 1.5 2.3 1.5 3a1.5 1.5 0 0 1-3 0c0-.7.5-1.5 1.5-3z"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5h.01"/>',
  pen: '<path d="M4 20h4L19 9l-4-4L4 16z"/>',
  sparkle: '<path d="M12 3l2 6 6 2-6 2-2 6-2-6-6-2 6-2z"/>',
  cloud: '<path d="M7 18a5 5 0 1 1 1-9.9A6 6 0 0 1 19.5 10 4 4 0 0 1 18 18z"/>',
  brush: '<path d="M18 3l3 3-9 9-3-3z"/><path d="M9 12c-3 0-5 2-5 5 0 1.5-1 2.5-2 3 4 1 9 0 9-5z"/>',
  code: '<path d="M8 7l-5 5 5 5M16 7l5 5-5 5M14 4l-4 16"/>',
  gamepad: '<rect x="2" y="7" width="20" height="11" rx="5"/><path d="M7 11v3M5.5 12.5h3M15 12h.01M18 13.5h.01"/>',
  grid: '<rect x="4" y="4" width="6" height="6" rx="1.5"/><rect x="14" y="4" width="6" height="6" rx="1.5"/><rect x="4" y="14" width="6" height="6" rx="1.5"/><rect x="14" y="14" width="6" height="6" rx="1.5"/>',
  sliders: '<path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0"/><circle cx="16" cy="6" r="2"/><circle cx="10" cy="12" r="2"/><circle cx="18" cy="18" r="2"/>',
  cpu: '<rect x="6" y="6" width="12" height="12" rx="1.5"/><path d="M9 2v4M15 2v4M9 18v4M15 18v4M2 9h4M2 15h4M18 9h4M18 15h4"/>',
  eye: '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/>',
  text: '<path d="M5 6V4h14v2M12 4v16M9 20h6"/>',
  textbox: '<rect x="3" y="5" width="18" height="14" rx="1" stroke-dasharray="3 2"/><path d="M8 9h8M12 9v7"/>',
  header: '<rect x="4" y="3" width="16" height="18" rx="1"/><path d="M4 8h16"/>',
  footer: '<rect x="4" y="3" width="16" height="18" rx="1"/><path d="M4 16h16"/>',
  pagebreak: '<path d="M6 3v6h12V3M6 21v-6h12v6M3 12h3M9 12h2M13 12h2M18 12h3"/>',
  hash: '<path d="M5 9h14M5 15h14M10 4l-2 16M16 4l-2 16"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  omega: '<path d="M5 20h4v-2a7 7 0 1 1 6 0v2h4"/>',
  hr: '<path d="M3 12h18"/>',
  margins: '<rect x="4" y="3" width="16" height="18" rx="1"/><rect x="8" y="7" width="8" height="10" stroke-dasharray="2 2"/>',
  orient: '<rect x="3" y="7" width="13" height="10" rx="1"/><path d="M17 4a5 5 0 0 1 4 5M21 9l-1-2.5M21 9l-2.5-.5"/>',
  size: '<rect x="5" y="3" width="14" height="18" rx="1"/><path d="M9 8h6M9 12h6"/>',
  columns: '<rect x="3" y="4" width="18" height="16" rx="1"/><path d="M12 4v16"/>',
  toc: '<path d="M4 6h10M4 10h14M7 14h11M7 18h11"/>',
  footnote: '<path d="M4 6h10M4 10h10M4 14h6M17 4v6M15 6h4"/>',
  spell: '<path d="M4 15l3.5-9 3.5 9M5.4 12h4.2M13 16l3 3 5-6"/>',
  count: '<path d="M4 6h16M4 10h16M4 14h9"/><path d="M15 18h5M17.5 15.5v5"/>',
  speak: '<path d="M4 9h4l5-4v14l-5-4H4z"/><path d="M16 9a4 4 0 0 1 0 6"/>',
  comment: '<path d="M4 4h16v12H9l-5 4z"/>',
  zoomin: '<circle cx="11" cy="11" r="6"/><path d="M20 20l-4.5-4.5M8.5 11h5M11 8.5v5"/>',
  zoomout: '<circle cx="11" cy="11" r="6"/><path d="M20 20l-4.5-4.5M8.5 11h5"/>',
  ruler: '<rect x="2" y="8" width="20" height="8" rx="1"/><path d="M6 8v3M10 8v4M14 8v3M18 8v4"/>',
  book: '<path d="M4 5a2 2 0 0 1 2-2h14v16H6a2 2 0 0 0-2 2z"/><path d="M4 19V5"/>',
  water: '<path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z"/>',
  border: '<rect x="4" y="4" width="16" height="16"/><path d="M4 12h16M12 4v16" stroke-dasharray="2 2"/>',
  wrap: '<path d="M4 6h16M4 12h13a3 3 0 0 1 0 6h-4M4 18h6M14 16l-2 2 2 2"/>',
  merge: '<rect x="3" y="6" width="18" height="12" rx="1"/><path d="M8 12h8M10 10l-2 2 2 2M14 10l2 2-2 2"/>',
  rowins: '<rect x="3" y="4" width="18" height="6" rx="1"/><rect x="3" y="14" width="18" height="6" rx="1"/><path d="M12 10v4"/>',
  rowdel: '<rect x="3" y="4" width="18" height="6" rx="1"/><path d="M8 17l8 0"/>',
  colins: '<rect x="4" y="3" width="6" height="18" rx="1"/><rect x="14" y="3" width="6" height="18" rx="1"/>',
  dup: '<rect x="8" y="8" width="12" height="12" rx="2"/><rect x="4" y="4" width="12" height="12" rx="2"/>',
  fx: '<path d="M10 4c-2 0-3 1-3.5 3L4 20M3 10h7M13 10l6 8M19 10l-6 8"/>',
  filter: '<path d="M3 5h18l-7 8v6l-4 2v-8z"/>',
  freeze: '<rect x="3" y="4" width="18" height="16" rx="1"/><path d="M3 9h18" stroke-width="3"/>',
  gridl: '<path d="M3 3h18v18H3zM3 9h18M3 15h18M9 3v18M15 3v18" stroke-dasharray="2 2"/>',
  layout: '<rect x="3" y="4" width="18" height="16" rx="1"/><path d="M3 9h18M11 9v11"/>',
  theme: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 15l5-5 4 4 3-3 6 6"/>',
  trans: '<rect x="2" y="6" width="9" height="12" rx="1"/><rect x="13" y="6" width="9" height="12" rx="1"/><path d="M9 12h6M13 10l2 2-2 2"/>',
  anim: '<path d="M4 18c4 0 4-12 8-12s4 12 8 12"/><circle cx="12" cy="6" r="1.5" fill="currentColor"/>',
  present: '<rect x="3" y="4" width="18" height="12" rx="1"/><path d="M10 8l4 2-4 2z" fill="currentColor"/><path d="M12 16v4M8 20h8"/>',
  sorter: '<rect x="3" y="4" width="8" height="6" rx="1"/><rect x="13" y="4" width="8" height="6" rx="1"/><rect x="3" y="14" width="8" height="6" rx="1"/><rect x="13" y="14" width="8" height="6" rx="1"/>',
  replace: '<path d="M4 7h11l-3-3M20 17H9l3 3"/>',
  select: '<path d="M5 3l14 8-6 2-2 6z"/>',
  close: '<path d="M6 6l12 12M18 6L6 18"/>',
  open: '<path d="M3 6.5A1.5 1.5 0 0 1 4.5 5h4l2 2h9A1.5 1.5 0 0 1 21 8.5V10H6l-3 9z"/><path d="M6 10h16l-3 9H3"/>',
  pdf: '<path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4M8.5 16v-4h1.5a1.2 1.2 0 0 1 0 2.4H8.5"/>',
  share: '<circle cx="18" cy="5" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="19" r="2.5"/><path d="M8.2 10.8l7.6-4.4M8.2 13.2l7.6 4.4"/>',
  newdoc: '<path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4M12 11v6M9 14h6"/>',
  arrow: '<path d="M4 12h14M13 6l6 6-6 6"/>',
  circle: '<circle cx="12" cy="12" r="8"/>',
  rect: '<rect x="4" y="6" width="16" height="12" rx="1"/>',
  tri: '<path d="M12 4l9 16H3z"/>',
  star: '<path d="M12 3l2.8 5.7 6.2.9-4.5 4.4 1 6.2L12 17.3 6.5 20.2l1-6.2L3 9.6l6.2-.9z"/>',
  calc: '<rect x="5" y="2.5" width="14" height="19" rx="3"/><rect x="8" y="5.5" width="8" height="4" rx="1"/><path d="M8.5 13h.01M12 13h.01M15.5 13h.01M8.5 16.5h.01M12 16.5h.01M15.5 16.5h.01"/>',
  office: '<path d="M4 6l8-3 8 3v12l-8 3-8-3z"/><path d="M12 3v18M4 6l8 3 8-3"/>',
  notebook: '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 3v18M12 8h4M12 12h4"/>',
  form: '<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8h8M8 12h5"/><circle cx="8" cy="16.5" r="1.2"/><path d="M11 16.5h5"/>',
  logout: '<path d="M10 4H5v16h5M15 8l4 4-4 4M9 12h10"/>'
};
const svg = (n, s = 16, sw = 1.8) => `<svg class="i" width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${IC[n] || ""}</svg>`;

/* ================= Stockage et état ================= */
const store = {
  get(k, d) { try { const v = localStorage.getItem("lucien." + k); return v === null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem("lucien." + k, JSON.stringify(v)); } catch {} }
};
const EDITIONS = {
  pi5:    { name: "Raspberry Pi 5", cpu: "Broadcom BCM2712 · 4 × Cortex-A76 2,4 GHz", arch: "arm64", ram: "8 Go LPDDR4X", gpu: "VideoCore VII", disk: "microSD / NVMe 128 Go", bat: false },
  pc:     { name: "PC de bureau", cpu: "AMD Ryzen 7 7700 · 8 cœurs", arch: "x86_64", ram: "32 Go DDR5", gpu: "AMD Radeon RX 7600", disk: "NVMe 1 To", bat: false },
  laptop: { name: "Laptop", cpu: "Intel Core Ultra 7 155H", arch: "x86_64", ram: "16 Go LPDDR5", gpu: "Intel Arc (intégrée)", disk: "NVMe 512 Go", bat: true }
};
const WALLS = {
  lucien: null,
  aube: "linear-gradient(160deg,#ffecd2,#fcb69f)",
  ocean: "radial-gradient(900px 600px at 20% 20%,#6dd5ed 0,transparent 60%),linear-gradient(160deg,#2193b0,#1c3f72)",
  foret: "radial-gradient(900px 600px at 80% 10%,#a8e063 0,transparent 55%),linear-gradient(160deg,#56ab2f,#134e2a)",
  nuit: "radial-gradient(900px 600px at 70% 20%,#4b3b8f 0,transparent 60%),linear-gradient(160deg,#0f0c29,#24243e)",
  ardoise: "linear-gradient(160deg,#606c88,#3f4c6b)"
};
const S = {
  theme: store.get("theme", "light"),
  accent: store.get("accent", "#d08a3c"),
  edition: store.get("edition", "laptop"),
  wall: store.get("wall", "lucien"),
  lang: store.get("lang", "fr"),
  langs: store.get("langs", ["fr", "en"]),
  region: store.get("region", "FR"),
  tz: store.get("tz", (() => { try { return Intl.DateTimeFormat().resolvedOptions().timeZone; } catch { return "Europe/Paris"; } })()),
  h24: store.get("h24", true),
  keyboards: store.get("keyboards", ["Français (AZERTY)"]),
  wifi: true, bt: true, dnd: false, realtime: true,
  brightness: 80, volume: 60, textSize: 13,
  installed: store.get("installed", ["lsh", "browser", "av", "office"]),
  quarantine: store.get("quarantine", []),
  lastScan: store.get("lastScan", null),
  autoUpdate: true, firewall: true, bootSplash: true, autoLogin: false, magnify: true,
  notes: store.get("notes", "Bienvenue dans Lucien OS\n\n- Ctrl + Espace : recherche\n- Clic droit sur le bureau : nouveau dossier, nouveau document\n- Double-clic sur la barre d'une fenêtre : agrandir\n- Tape « aide » dans Lucien Shell\n")
};
const locale = () => `${S.lang}-${S.region}`;
function applyTheme(animate) {
  const r = document.documentElement;
  if (animate) { r.classList.add("theming"); setTimeout(() => r.classList.remove("theming"), 500); }
  r.dataset.theme = S.theme;
  r.style.setProperty("--accent", S.accent);
  r.lang = S.lang;
  document.body.style.fontSize = S.textSize + "px";
  const d = $("#desktop");
  d.style.filter = `brightness(${0.55 + S.brightness / 222})`;
  const w = S.wall.startsWith("data:") ? `center/cover url(${S.wall})` : WALLS[S.wall];
  d.style.background = w || ""; $("#login").style.background = w || "";
  $("#mbBat").style.display = EDITIONS[S.edition].bat ? "" : "none";
}

/* ================= Système de fichiers virtuel ================= */
const HOME = "/home/lucien";
const DEFAULT_FS = () => ({ type: "dir", children: {
  home: { type: "dir", children: { lucien: { type: "dir", children: {
    Bureau: { type: "dir", children: { "Lisez-moi.txt": { type: "file", content: "Lucien OS — démo web.\nClic droit sur le bureau pour créer des dossiers et des documents.\nLe vrai système se construit avec build/build.sh (voir GitHub)." } } },
    Documents: { type: "dir", children: {
      "bienvenue.txt": { type: "file", content: "Bonjour et bienvenue dans Lucien OS !\nUn système Linux élégant, rapide et libre." },
      "Rapport.ltxt": { type: "file", content: "<h1>Rapport annuel</h1><p>Ce document a été créé avec <b>Lucien Texte</b>, le traitement de texte de Lucien Office.</p><h2>Objectifs</h2><ul><li>Un système simple</li><li>Des applications élégantes</li><li>Aucune télémétrie</li></ul><p>Bonne lecture.</p>" },
      "Budget.ltab": { type: "file", content: JSON.stringify({ sheets: [{ name: "Feuil1", cw: {}, cells: {
        A1: { v: "Poste", s: { b: 1, bg: "#107c41", fg: "#ffffff" } }, B1: { v: "Janvier", s: { b: 1, bg: "#107c41", fg: "#ffffff" } }, C1: { v: "Février", s: { b: 1, bg: "#107c41", fg: "#ffffff" } }, D1: { v: "Total", s: { b: 1, bg: "#107c41", fg: "#ffffff" } },
        A2: { v: "Loyer" }, B2: { v: "800" }, C2: { v: "800" }, D2: { v: "=SOMME(B2:C2)" },
        A3: { v: "Courses" }, B3: { v: "320" }, C3: { v: "295" }, D3: { v: "=SOMME(B3:C3)" },
        A4: { v: "Transport" }, B4: { v: "75" }, C4: { v: "90" }, D4: { v: "=SOMME(B4:C4)" },
        A5: { v: "Total", s: { b: 1 } }, B5: { v: "=SOMME(B2:B4)", s: { b: 1 } }, C5: { v: "=SOMME(C2:C4)", s: { b: 1 } }, D5: { v: "=SOMME(D2:D4)", s: { b: 1, bg: "#e2efda" } }
      } }] }) },
      "Présentation.lpre": { type: "file", content: "" },
      "script.lsh": { type: "file", content: "# Exemple de script Lucien Shell\nsoit nom = Lucien\ndis Bonjour $nom !\nliste ~/Documents" }
    } },
    Images: { type: "dir", children: { "logo.webp": { type: "file", content: "assets/logo.webp", data: true } } },
    Musique: { type: "dir", children: {} },
    "Téléchargements": { type: "dir", children: {
      "dessin-2.1.lcn": { type: "file", content: "[paquet Lucien]" },
      "vlc_3.0.20_arm64.deb": { type: "file", content: "[paquet Ubuntu]" },
      "facture.pdf.exe": { type: "file", content: "MZ suspicious" }
    } },
    ".Corbeille": { type: "dir", children: {} },
    ".lshrc": { type: "file", content: "# Configuration de Lucien Shell\nalias ll = liste -l\nsoit EDITEUR = notes" }
  } } } },
  system: { type: "dir", children: { version: { type: "file", content: "Lucien OS 1.0 « Os de Lune »" }, apps: { type: "dir", children: {} } } },
  etc: { type: "dir", children: { "lucien-release": { type: "file", content: "NAME=\"Lucien OS\"\nVERSION=\"1.0\"\nID=lucien\nID_LIKE=ubuntu debian" }, hostname: { type: "file", content: "lucien" } } }
} });
const FS = { "/": store.get("fs2", null) || DEFAULT_FS() };
const saveFS = debounce(() => store.set("fs2", FS["/"]), 400);
const fsListeners = new Set();
function fsChanged() { saveFS(); fsListeners.forEach(f => f()); }

function resolve(path, cwd = HOME) {
  if (!path || path === "~") path = HOME;
  if (path.startsWith("~/")) path = HOME + path.slice(1);
  if (!path.startsWith("/")) path = (cwd === "/" ? "" : cwd) + "/" + path;
  const out = [];
  for (const p of path.split("/")) { if (!p || p === ".") continue; if (p === "..") out.pop(); else out.push(p); }
  return "/" + out.join("/");
}
function node(path) {
  let n = FS["/"];
  for (const p of path.split("/").filter(Boolean)) { if (n.type !== "dir" || !n.children[p]) return null; n = n.children[p]; }
  return n;
}
const parentOf = (path) => { const i = path.lastIndexOf("/"); return [path.slice(0, i) || "/", path.slice(i + 1)]; };
const pretty = (p) => p === HOME ? "~" : p.startsWith(HOME + "/") ? "~" + p.slice(HOME.length) : p;
const extOf = (n) => (n.match(/\.([^.]+)$/) || [, ""])[1].toLowerCase();
function uniqueName(dir, base) {
  const d = node(dir); if (!d.children[base]) return base;
  const m = base.match(/^(.*?)(\.[^.]+)?$/);
  for (let i = 2; ; i++) { const n = `${m[1]} ${i}${m[2] || ""}`; if (!d.children[n]) return n; }
}
function fsCreate(dir, base, n) { const name = uniqueName(dir, base); node(dir).children[name] = n; fsChanged(); return name; }
function fsRename(path, newName) {
  newName = newName.trim().replace(/\//g, "-"); const [d, f] = parentOf(path);
  if (!newName || newName === f) return f;
  if (node(d).children[newName]) { notify("files", "Nom déjà utilisé", `« ${newName} » existe déjà.`); return f; }
  node(d).children[newName] = node(path); delete node(d).children[f]; fsChanged(); return newName;
}
function fsTrash(path) {
  const [d, f] = parentOf(path), n = node(path); if (!n) return;
  n._from = d; node(HOME + "/.Corbeille").children[uniqueName(HOME + "/.Corbeille", f)] = n;
  delete node(d).children[f]; fsChanged();
}
const clone = (o) => JSON.parse(JSON.stringify(o));
let fileClipboard = null;

/* types de fichiers → icône, couleur, application */
const FTYPES = {
  ltxt: ["doc", "t-texte", "texte"], docx: ["doc", "t-texte", "texte"], doc: ["doc", "t-texte", "texte"],
  ltab: ["sheet", "t-tableur", "tableur"], xlsx: ["sheet", "t-tableur", "tableur"], csv: ["sheet", "t-tableur", "tableur"],
  lpre: ["slides", "t-presentation", "presentation"], pptx: ["slides", "t-presentation", "presentation"],
  lcn: ["logo", "img", "store"], deb: ["package", "t-deb", "store"], exe: ["warn", "t-warn", "av"],
  webp: ["image", "t-img", "apercu"], png: ["image", "t-img", "apercu"], jpg: ["image", "t-img", "apercu"], jpeg: ["image", "t-img", "apercu"], gif: ["image", "t-img", "apercu"], svg: ["image", "t-img", "apercu"],
  lsh: ["terminal", "t-shell", "code"], js: ["code", "t-code", "code"], ts: ["code", "t-code", "code"], json: ["code", "t-code", "code"], css: ["code", "t-code", "code"], html: ["code", "t-code", "code"], py: ["code", "t-code", "code"], md: ["file", "t-txt", "code"], mp3: ["music", "t-store", "apercu"], pdf: ["pdf", "t-warn", "apercu"]
};
function fileIcon(name, n, cls = "") {
  if (n.type === "dir") return `<div class="icon t-files ${cls}">${svg("folder")}</div>`;
  const [ic, tc] = FTYPES[extOf(name)] || ["file", "t-txt"];
  return ic === "logo" ? `<div class="icon img ${cls}"></div>` : `<div class="icon ${tc} ${cls}">${svg(ic)}</div>`;
}
function openPath(path) {
  const n = node(path); if (!n) return;
  if (n.type === "dir") return openApp("files", path);
  const app = (FTYPES[extOf(path)] || [, , "apercu"])[2];
  if (app === "av") { openApp("av"); return notify("av", "Fichier bloqué", parentOf(path)[1] + " ressemble à un logiciel malveillant."); }
  if (app === "store") return openApp("store", parentOf(path)[1]);
  openApp(app, { path });
}

/* ================= Applications ================= */
const APPS = {
  files:        { name: "Fichiers", ic: "folder", cls: "t-files", w: 780, h: 480, render: "FilesApp" },
  shell:        { name: "Lucien Shell", ic: "terminal", cls: "t-shell", w: 700, h: 440, render: "ShellApp" },
  browser:      { name: "Lucien Browser", ic: "compass", cls: "t-browser", w: 940, h: 600, render: "BrowserApp" },
  texte:        { name: "Lucien Texte", ic: "doc", cls: "t-texte", w: 1040, h: 660, render: "TexteApp", office: true },
  tableur:      { name: "Lucien Tableur", ic: "sheet", cls: "t-tableur", w: 1040, h: 640, render: "TableurApp", office: true },
  presentation: { name: "Lucien Présentation", ic: "slides", cls: "t-presentation", w: 1080, h: 660, render: "PresentationApp", office: true },
  office:       { name: "Lucien Office", ic: "office", cls: "t-office", w: 900, h: 600, render: "OfficeHubApp" },
  carnet:       { name: "Lucien Carnet", ic: "notebook", cls: "t-carnet", w: 1040, h: 640, render: "CarnetApp", office: true },
  taches:       { name: "Lucien Tâches", ic: "check", cls: "t-taches", w: 860, h: 560, render: "TachesApp", office: true },
  formulaires:  { name: "Lucien Formulaires", ic: "form", cls: "t-form", w: 880, h: 620, render: "FormulairesApp", office: true },
  code:         { name: "Lucien Code", ic: "code", cls: "t-code", w: 1100, h: 680, render: "CodeApp" },
  calc:         { name: "Lucien Calculator", ic: "calc", cls: "t-calc", w: 860, h: 560, render: "CalculatorApp" },
  av:           { name: "Lucien Antivirus", ic: "shieldok", cls: "t-av", w: 740, h: 500, render: "AvApp" },
  store:        { name: "Lucien Store", ic: "bag", cls: "t-store", w: 880, h: 570, render: "StoreApp" },
  notes:        { name: "Notes", ic: "note", cls: "t-notes", w: 520, h: 420, render: "NotesApp" },
  monitor:      { name: "Moniteur d'activité", ic: "chart", cls: "t-monitor", w: 640, h: 470, render: "MonitorApp" },
  settings:     { name: "Paramètres", ic: "gear", cls: "t-settings", w: 860, h: 580, render: "SettingsApp" },
  apercu:       { name: "Aperçu", ic: "eye", cls: "t-apercu", w: 640, h: 480, render: "ApercuApp" },
  about:        { name: "À propos de Lucien OS", ic: "info", cls: "t-store", w: 480, h: 420, render: "AboutApp", hide: true },
  trash:        { name: "Corbeille", ic: "trash", cls: "t-trash", w: 580, h: 400, render: "TrashApp" }
};
const DOCK = ["launch", "files", "shell", "browser", "office", "texte", "tableur", "presentation", "calc", "code", "av", "store", "notes", "settings", "|", "trash"];
const appIcon = (id, extra = "") => id === "launch" ? `<div class="icon t-launch" ${extra}>${svg("grid")}</div>` : `<div class="icon ${APPS[id].cls}" ${extra}>${svg(APPS[id].ic)}</div>`;

/* ================= Gestionnaire de fenêtres ================= */
let zTop = 100;
const openWins = {};
function openApp(id, arg) {
  if (openWins[id]) {
    const w = openWins[id];
    if (w.classList.contains("hidden")) restore(w); else focus(w);
    if (arg !== undefined && w._onArg) w._onArg(arg);
    return w;
  }
  const a = APPS[id];
  const W = Math.min(a.w, innerWidth - 20), H = Math.min(a.h, innerHeight - 120);
  const n = Object.keys(openWins).length;
  const x = Math.max(10, (innerWidth - W) / 2 + (n % 5) * 26 - 50), y = Math.max(34, (innerHeight - H) / 2 - 40 + (n % 5) * 22);
  const w = h(`<div class="win" style="left:${x}px;top:${y}px;width:${W}px;height:${H}px">
    <div class="tb"><div class="lights"><i class="c" title="Fermer">${svg("x", 8, 3)}</i><i class="n" title="Réduire">${svg("minus", 8, 3)}</i><i class="x" title="Agrandir">${svg("expand", 8, 2.6)}</i></div><div class="t">${a.name}</div></div>
    <div class="body"></div><div class="rs"></div></div>`);
  w._id = id;
  $("#wins").append(w);
  openWins[id] = w;
  $(".c", w).onclick = (e) => { e.stopPropagation(); closeApp(id); };
  $(".n", w).onclick = (e) => { e.stopPropagation(); minimize(w); };
  $(".x", w).onclick = (e) => { e.stopPropagation(); toggleMax(w); };
  $(".tb", w).ondblclick = (e) => { if (!e.target.closest(".lights")) toggleMax(w); };
  w.addEventListener("pointerdown", () => focus(w));
  drag(w);
  window[a.render]($(".body", w), w, arg);
  focus(w);
  w.animate([{ opacity: 0, transform: "scale(.9) translateY(14px)" }, { opacity: 1, transform: "none" }], { duration: 320, easing: "cubic-bezier(.2,.9,.25,1.1)" });
  refreshDock();
  return w;
}
const setTitle = (id, t) => { const w = openWins[id]; if (w) $(".tb .t", w).textContent = t; };
function closeApp(id) {
  const w = openWins[id]; if (!w) return;
  if (w._beforeClose && w._beforeClose() === false) return;
  w._cleanup && w._cleanup();
  delete openWins[id];
  w.style.pointerEvents = "none";
  w.animate([{ opacity: 1, transform: "none" }, { opacity: 0, transform: "scale(.92)" }], { duration: 180, easing: "ease-in", fill: "forwards" });
  setTimeout(() => { w.remove(); refreshDock(); setMenuApp(); }, 190);
}
function dockTarget(w) {
  const it = $(`#dock .it[data-id="${w._id}"]`), r = w.getBoundingClientRect();
  const t = it ? it.getBoundingClientRect() : { left: innerWidth / 2, top: innerHeight, width: 0, height: 0 };
  return `translate(${t.left + t.width / 2 - (r.left + r.width / 2)}px,${t.top + t.height / 2 - (r.top + r.height / 2)}px) scale(.06)`;
}
function minimize(w) {
  const tr = dockTarget(w);
  w.animate([{ transform: "none", opacity: 1 }, { transform: tr, opacity: .3 }], { duration: 460, easing: "cubic-bezier(.5,0,.75,0)" });
  setTimeout(() => { w.classList.add("hidden"); setMenuApp(); }, 450);
}
function restore(w) {
  w.classList.remove("hidden");
  w.animate([{ transform: dockTarget(w), opacity: .3 }, { transform: "none", opacity: 1 }], { duration: 420, easing: "cubic-bezier(.2,.9,.3,1)" });
  focus(w);
}
function toggleMax(w) { w.classList.add("anim"); w.classList.toggle("max"); setTimeout(() => w.classList.remove("anim"), 380); }
function focus(w) {
  $$(".win").forEach(x => x.classList.remove("focus"));
  w.classList.add("focus"); w.style.zIndex = ++zTop;
  setMenuApp(APPS[w._id].name);
}
function setMenuApp(name) {
  if (!name) { const f = $(".win.focus:not(.hidden)"); name = f && openWins[f._id] ? APPS[f._id].name : "Fichiers"; }
  $("#mbApp").textContent = name;
}
function drag(w) {
  const tb = $(".tb", w), rs = $(".rs", w);
  tb.addEventListener("pointerdown", (e) => {
    if (e.target.closest(".lights") || innerWidth <= 700) return;
    if (w.classList.contains("max")) return;
    const ox = e.clientX - w.offsetLeft, oy = e.clientY - w.offsetTop;
    const mv = (ev) => { w.style.left = (ev.clientX - ox) + "px"; w.style.top = Math.max(26, ev.clientY - oy) + "px"; };
    const up = () => { removeEventListener("pointermove", mv); removeEventListener("pointerup", up); };
    addEventListener("pointermove", mv); addEventListener("pointerup", up);
  });
  rs.addEventListener("pointerdown", (e) => {
    e.stopPropagation();
    const sx = e.clientX, sy = e.clientY, sw = w.offsetWidth, sh = w.offsetHeight;
    const mv = (ev) => { w.style.width = Math.max(320, sw + ev.clientX - sx) + "px"; w.style.height = Math.max(220, sh + ev.clientY - sy) + "px"; };
    const up = () => { removeEventListener("pointermove", mv); removeEventListener("pointerup", up); };
    addEventListener("pointermove", mv); addEventListener("pointerup", up);
  });
}

/* ================= Dock (agrandissement façon macOS) ================= */
function buildDock() {
  const d = $("#dock"); d.innerHTML = "";
  for (const id of DOCK) {
    if (id === "|") { d.append(h(`<div class="sep"></div>`)); continue; }
    const name = id === "launch" ? "Launchpad" : APPS[id].name;
    const it = h(`<div class="it" data-id="${id}">${appIcon(id)}<div class="tip">${name}</div></div>`);
    it.onclick = () => {
      if (id === "launch") return launchpad();
      if (!openWins[id]) { it.classList.add("bounce"); setTimeout(() => it.classList.remove("bounce"), 1200); }
      const w = openWins[id];
      if (w && !w.classList.contains("hidden") && w.classList.contains("focus")) return minimize(w);
      openApp(id);
    };
    it.oncontextmenu = (e) => id !== "launch" && ctxMenu(e, [
      [openWins[id] ? "Afficher" : "Ouvrir", () => openApp(id)],
      ...(id === "trash" ? [["Vider la corbeille", emptyTrash]] : []),
      "-", ["Options › Garder dans le Dock", null, { dis: true }],
      ...(openWins[id] ? ["-", ["Quitter", () => closeApp(id)]] : [])
    ]);
    d.append(it);
  }
  let centers = null;
  d.onmouseenter = () => { centers = $$(".it", d).map(it => { const r = it.getBoundingClientRect(); return r.left + r.width / 2; }); d.classList.remove("settle"); };
  d.onmousemove = (e) => {
    if (!S.magnify || innerWidth <= 700 || !centers) return;
    $$(".it", d).forEach((it, i) => { const dist = Math.abs(e.clientX - centers[i]); const k = Math.max(0, 1 - dist / 160); const s = (innerWidth < 1200 ? 40 : 50) + 26 * Math.sin(k * Math.PI / 2) ** 2; it.style.width = it.style.height = s + "px"; });
  };
  d.onmouseleave = () => { d.classList.add("settle"); $$(".it", d).forEach(it => it.style.width = it.style.height = ""); centers = null; };
  refreshDock();
}
function refreshDock() { $$("#dock .it").forEach(it => it.classList.toggle("running", !!openWins[it.dataset.id])); }

/* ================= Notifications ================= */
function notify(app, title, text) {
  if (S.dnd) return;
  const n = h(`<div class="notif">${appIcon(app)}<div><b>${esc(title)}</b><small>${esc(text)}</small></div></div>`);
  $("#notifs").append(n);
  const bye = () => { n.classList.add("out"); setTimeout(() => n.remove(), 380); };
  n.onclick = () => { openApp(app); bye(); };
  setTimeout(bye, 4500);
}

/* ================= Feuille de dialogue (sheet) ================= */
function dialog(win, title, fields, ok = "OK") {
  return new Promise((res) => {
    const bg = h(`<div class="sheetbg"><form class="sheet"><h3>${esc(title)}</h3>${fields.map((f, i) =>
      f.type === "info" ? `<p class="muted">${f.html || esc(f.l)}</p>` :
      f.type === "select" ? `<label>${esc(f.l)}<select name="f${i}">${f.o.map(o => `<option ${o === f.v ? "selected" : ""}>${esc(o)}</option>`).join("")}</select></label>` :
      `<label>${esc(f.l)}<input class="txt" name="f${i}" type="${f.type || "text"}" value="${esc(f.v ?? "")}"></label>`).join("")}
      <div class="acts">${ok ? `<button type="button" class="btn ghost" data-x>Annuler</button>` : ""}<button class="btn">${esc(ok || "Fermer")}</button></div></form></div>`);
    const host = win.classList?.contains("win") ? win : win.closest(".win") || $("#desktop");
    host.append(bg);
    const form = $("form", bg), first = $("input,select", form);
    first ? setTimeout(() => { first.focus(); first.select?.(); }, 50) : null;
    const end = (v) => { $(".sheet", bg).animate([{ transform: "none" }, { transform: "translateY(-100%)" }], { duration: 180 }); bg.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 200, fill: "forwards" }); setTimeout(() => bg.remove(), 200); res(v); };
    form.onsubmit = (e) => { e.preventDefault(); const v = {}; fields.forEach((f, i) => { if (f.type !== "info") v[f.k || i] = form.elements["f" + i].value; }); end(v); };
    $("[data-x]", form) && ($("[data-x]", form).onclick = () => end(null));
    form.onkeydown = (e) => { if (e.key === "Escape") { e.stopPropagation(); end(null); } };
  });
}
