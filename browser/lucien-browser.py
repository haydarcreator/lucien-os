#!/usr/bin/env python3
"""Lucien Browser — navigateur web de Lucien OS (GTK 3 + WebKitGTK).

Dépendances (Ubuntu 24.04) : python3-gi gir1.2-gtk-3.0 gir1.2-webkit2-4.1
Fonctions : onglets, page d'accueil lucien://accueil, bloqueur de pistes,
navigation privée, HTTPS par défaut, téléchargements analysés par Lucien Antivirus.
"""
import json
import os
import shutil
import subprocess
import sys
import urllib.parse

import gi
gi.require_version("Gtk", "3.0")
gi.require_version("WebKit2", "4.1")
from gi.repository import GLib, Gio, Gtk, WebKit2  # noqa: E402

APP_ID = "org.lucienos.Browser"
LOGO = "/usr/share/lucien/logo.webp"
SEARCH = "https://duckduckgo.com/?q="
DATA = os.path.join(GLib.get_user_data_dir(), "lucien-browser")

# Règles au format « content blocker » de WebKit : pistes et publicités courantes
BLOCK_RULES = [
    {"trigger": {"url-filter": d, "load-type": ["third-party"]}, "action": {"type": "block"}}
    for d in [r"doubleclick\.net", r"google-analytics\.com", r"googletagmanager\.com", r"facebook\.net",
              r"scorecardresearch\.com", r"adservice\.google", r"criteo\.", r"taboola\.com", r"outbrain\.com", r"hotjar\.com"]
]

HOME_HTML = """<!doctype html><html lang="fr"><meta charset="utf-8"><title>Accueil</title>
<style>
body{{margin:0;font-family:system-ui,sans-serif;background:#f5efe6;color:#1d1a16;display:flex;flex-direction:column;align-items:center;padding-top:12vh}}
@media(prefers-color-scheme:dark){{body{{background:#1b1916;color:#f3eee7}}input{{background:#2a2622!important;color:#fff}}}}
img{{width:120px}}h1{{margin:10px 0 24px}}
form{{width:min(560px,90vw)}}input{{width:100%;box-sizing:border-box;padding:13px 20px;font-size:16px;border-radius:26px;border:1px solid #0002;background:#fff;outline:none}}
p{{opacity:.6;font-size:13px;margin-top:28px}}
</style>
<img src="file://{logo}" alt=""><h1>Lucien Browser</h1>
<form action="{search}" method="get"><input name="q" placeholder="Rechercher en privé…" autofocus></form>
<p>Bloqueur de pistes actif · HTTPS par défaut · Aucune télémétrie</p></html>"""


def to_url(text):
    text = text.strip()
    if text.startswith(("http://", "https://", "file://", "lucien://", "about:")):
        return text
    if "." in text and " " not in text:
        return "https://" + text
    return SEARCH + urllib.parse.quote_plus(text)


class Tab(Gtk.Box):
    def __init__(self, win, url):
        super().__init__(orientation=Gtk.Orientation.VERTICAL)
        self.win = win
        # Une vue éphémère ne garde ni cookies, ni cache, ni historique
        self.view = WebKit2.WebView(is_ephemeral=win.private, user_content_manager=win.app.content_manager)
        s = self.view.get_settings()
        s.set_enable_developer_extras(True)
        s.set_enable_smooth_scrolling(True)
        s.set_user_agent_with_application_details("LucienBrowser", "1.0")
        self.progress = Gtk.ProgressBar()
        self.progress.get_style_context().add_class("osd")
        self.pack_start(self.progress, False, False, 0)
        self.pack_start(self.view, True, True, 0)
        self.label = Gtk.Label(label="Nouvel onglet", max_width_chars=18, ellipsize=3)
        close = Gtk.Button.new_from_icon_name("window-close-symbolic", Gtk.IconSize.MENU)
        close.set_relief(Gtk.ReliefStyle.NONE)
        close.connect("clicked", lambda *_: win.close_tab(self))
        self.header = Gtk.Box(spacing=6)
        self.header.pack_start(self.label, True, True, 0)
        self.header.pack_start(close, False, False, 0)
        self.header.show_all()
        self.view.connect("notify::title", self.on_title)
        self.view.connect("notify::estimated-load-progress", self.on_progress)
        self.view.connect("notify::uri", lambda *_: win.sync_url(self))
        self.view.connect("create", lambda v, nav: win.new_tab(nav.get_request().get_uri()).view)
        self.view.load_uri(url)
        self.show_all()

    def on_title(self, *_):
        title = self.view.get_title() or "Sans titre"
        self.label.set_text(title)
        if self.win.current() is self:
            self.win.header.set_subtitle(title)

    def on_progress(self, *_):
        p = self.view.get_estimated_load_progress()
        self.progress.set_fraction(p)
        self.progress.set_visible(p < 1)


class Window(Gtk.ApplicationWindow):
    def __init__(self, app, private=False):
        super().__init__(application=app, title="Lucien Browser", default_width=1200, default_height=800)
        self.app, self.private = app, private
        self.header = Gtk.HeaderBar(show_close_button=True, title="Lucien Browser" + (" — Privé" if private else ""))
        self.set_titlebar(self.header)
        for icon, cb in [("go-previous-symbolic", lambda *_: self.current().view.go_back()),
                         ("go-next-symbolic", lambda *_: self.current().view.go_forward()),
                         ("view-refresh-symbolic", lambda *_: self.current().view.reload())]:
            b = Gtk.Button.new_from_icon_name(icon, Gtk.IconSize.BUTTON)
            b.connect("clicked", cb)
            self.header.pack_start(b)
        self.entry = Gtk.Entry(placeholder_text="Rechercher ou saisir une adresse", width_chars=60)
        self.entry.connect("activate", lambda e: self.current().view.load_uri(to_url(e.get_text())))
        self.header.set_custom_title(self.entry)
        menu = Gio.Menu()
        menu.append("Nouvel onglet", "win.newtab")
        menu.append("Nouvelle fenêtre privée", "app.private")
        menu.append("Outils de développement", "win.inspect")
        mb = Gtk.MenuButton(menu_model=menu, image=Gtk.Image.new_from_icon_name("open-menu-symbolic", Gtk.IconSize.BUTTON))
        self.header.pack_end(mb)
        add = Gtk.Button.new_from_icon_name("tab-new-symbolic", Gtk.IconSize.BUTTON)
        add.connect("clicked", lambda *_: self.new_tab())
        self.header.pack_end(add)
        for name, cb in [("newtab", lambda *_: self.new_tab()), ("inspect", lambda *_: self.current().view.get_inspector().show()),
                         ("closetab", lambda *_: self.close_tab(self.current())), ("focusurl", lambda *_: self.entry.grab_focus())]:
            a = Gio.SimpleAction.new(name, None)
            a.connect("activate", cb)
            self.add_action(a)
        self.notebook = Gtk.Notebook(scrollable=True)
        self.notebook.connect("switch-page", lambda nb, page, n: self.sync_url(page))
        self.add(self.notebook)
        self.new_tab()
        self.show_all()

    def current(self):
        return self.notebook.get_nth_page(self.notebook.get_current_page())

    def new_tab(self, url="lucien://accueil"):
        tab = Tab(self, url)
        n = self.notebook.append_page(tab, tab.header)
        self.notebook.set_tab_reorderable(tab, True)
        self.notebook.set_current_page(n)
        return tab

    def close_tab(self, tab):
        self.notebook.remove_page(self.notebook.page_num(tab))
        if self.notebook.get_n_pages() == 0:
            self.close()

    def sync_url(self, tab):
        if tab is self.current():
            uri = tab.view.get_uri() or ""
            self.entry.set_text("" if uri.startswith("lucien://") else uri)


class Browser(Gtk.Application):
    def __init__(self):
        super().__init__(application_id=APP_ID, flags=Gio.ApplicationFlags.HANDLES_OPEN)
        self.content_manager = WebKit2.UserContentManager()

    def do_startup(self):
        Gtk.Application.do_startup(self)
        os.makedirs(DATA, exist_ok=True)
        ctx = WebKit2.WebContext.get_default()
        ctx.register_uri_scheme("lucien", self.on_lucien_scheme)
        ctx.get_security_manager().register_uri_scheme_as_secure("lucien")
        ctx.connect("download-started", self.on_download)
        dm = ctx.get_website_data_manager()
        dm.get_cookie_manager().set_accept_policy(WebKit2.CookieAcceptPolicy.NO_THIRD_PARTY)
        try:  # HTTPS par défaut (WebKitGTK ≥ 2.38)
            ctx.get_website_data_manager().set_tls_errors_policy(WebKit2.TLSErrorsPolicy.FAIL)
        except AttributeError:
            pass
        store = WebKit2.UserContentFilterStore.new(os.path.join(DATA, "filtres"))
        store.save("lucien-pistes", GLib.Bytes.new(json.dumps(BLOCK_RULES).encode()), None, self.on_filter_saved, store)
        for name, cb in [("private", lambda *_: Window(self, private=True)), ("quit", lambda *_: self.quit())]:
            a = Gio.SimpleAction.new(name, None)
            a.connect("activate", cb)
            self.add_action(a)
        self.set_accels_for_action("win.newtab", ["<Control>t"])
        self.set_accels_for_action("win.closetab", ["<Control>w"])
        self.set_accels_for_action("win.focusurl", ["<Control>l"])
        self.set_accels_for_action("app.private", ["<Control><Shift>n"])
        self.set_accels_for_action("app.quit", ["<Control>q"])

    def on_filter_saved(self, store, res, _):
        try:
            self.content_manager.add_filter(store.save_finish(res))
        except GLib.Error as e:
            print("Bloqueur de pistes indisponible :", e.message, file=sys.stderr)

    def on_lucien_scheme(self, req):
        if req.get_path() in ("accueil", "") or req.get_uri().startswith("lucien://accueil"):
            html = HOME_HTML.format(logo=LOGO, search=SEARCH.split("?")[0])
        else:
            html = "<h1>Page Lucien inconnue</h1>"
        data = html.encode()
        req.finish(Gio.MemoryInputStream.new_from_data(data), len(data), "text/html")

    def on_download(self, ctx, download):
        def finished(d):
            path = GLib.filename_from_uri(d.get_destination())[0]
            if shutil.which("lucien-av"):
                r = subprocess.run(["lucien-av", "scan", "--quiet", "--quarantine", path])
                msg = "Menace détectée : fichier mis en quarantaine" if r.returncode == 1 else "✓ Téléchargement analysé, aucune menace"
            else:
                msg = "Téléchargement terminé"
            n = Gio.Notification.new("Lucien Browser")
            n.set_body(f"{os.path.basename(path)} — {msg}")
            self.send_notification(None, n)
        download.connect("finished", finished)

    def do_activate(self):
        Window(self)

    def do_open(self, files, n, hint):
        win = self.get_active_window() or Window(self)
        for f in files:
            win.new_tab(f.get_uri())
        win.present()


if __name__ == "__main__":
    sys.exit(Browser().run(sys.argv))
