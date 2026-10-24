#!/usr/bin/env python3
"""lucien-webapp — ouvre une application Lucien (Calculator, Code, Carnet, Tâches, Formulaires…)
dans sa propre fenêtre, avec le même code que la démo web.

  lucien-webapp calc | code | carnet | taches | formulaires
"""
import os
import sys

import gi
gi.require_version("Gtk", "3.0")
gi.require_version("WebKit2", "4.1")
from gi.repository import Gtk, WebKit2  # noqa: E402

WEB = os.environ.get("LUCIEN_WEB", "/usr/share/lucien/web")
NAMES = {"calc": "Lucien Calculator", "code": "Lucien Code", "carnet": "Lucien Carnet", "taches": "Lucien Tâches", "formulaires": "Lucien Formulaires", "office": "Lucien Office"}
SIZES = {"calc": (900, 600), "code": (1200, 760)}


def main():
    app = sys.argv[1] if len(sys.argv) > 1 else "calc"
    if app not in NAMES:
        sys.exit("applications : " + ", ".join(NAMES))
    win = Gtk.Window(title=NAMES[app])
    win.set_default_size(*SIZES.get(app, (1100, 700)))
    win.set_icon_name("lucien")
    ctx = WebKit2.WebContext.get_default()
    # chaque application garde ses données (localStorage) dans le profil de l'utilisateur
    data = os.path.join(os.path.expanduser("~/.local/share/lucien"), app)
    os.makedirs(data, exist_ok=True)
    view = WebKit2.WebView(web_context=WebKit2.WebContext(website_data_manager=WebKit2.WebsiteDataManager(base_data_directory=data, base_cache_directory=data)))
    s = view.get_settings()
    s.set_allow_file_access_from_file_urls(True)
    s.set_enable_html5_local_storage(True)
    s.set_enable_developer_extras(True)
    view.load_uri(f"file://{WEB}/demo/app.html?app={app}")
    win.add(view)
    win.connect("destroy", Gtk.main_quit)
    win.show_all()
    Gtk.main()


if __name__ == "__main__":
    main()
