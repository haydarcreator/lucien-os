#!/usr/bin/env python3
"""lucien-settings — réglages rapides de Lucien OS en ligne de commande.

Les réglages complets sont dans l'app « Paramètres » (GNOME Control Center, habillée Lucien).
Cet outil applique les préférences propres à Lucien OS :

  lucien-settings theme clair|sombre
  lucien-settings accent orange|rose|violet|bleu|vert|gris
  lucien-settings dock bas|gauche|droite
  lucien-settings boutons mac|linux          (boutons de fenêtre à gauche ou à droite)
  lucien-settings demarrage logo|texte       (écran de démarrage Plymouth)
  lucien-settings shell lsh|bash             (shell par défaut)
  lucien-settings edition                    (affiche l'édition : pi5, pc, laptop)
  lucien-settings tout                       (affiche les réglages actuels)
"""
import os
import subprocess
import sys

ACCENTS = {"orange": "orange", "rose": "pink", "violet": "purple", "bleu": "blue", "vert": "green", "gris": "slate"}
DOCK = "org.gnome.shell.extensions.dash-to-dock"


def gset(schema, key, value):
    subprocess.run(["gsettings", "set", schema, key, value], check=True)


def gget(schema, key):
    r = subprocess.run(["gsettings", "get", schema, key], capture_output=True, text=True)
    return r.stdout.strip() or "?"


def edition():
    try:
        with open("/etc/lucien-edition") as f:
            return f.read().strip()
    except OSError:
        return "inconnue"


def main(a):
    if not a or a[0] in ("-h", "--help", "aide"):
        print(__doc__)
        return
    cmd, val = a[0], (a[1] if len(a) > 1 else "")
    if cmd == "theme":
        dark = val == "sombre"
        gset("org.gnome.desktop.interface", "color-scheme", "'prefer-dark'" if dark else "'default'")
        gset("org.gnome.desktop.interface", "gtk-theme", "'WhiteSur-Dark'" if dark else "'WhiteSur-Light'")
    elif cmd == "accent":
        if val not in ACCENTS:
            sys.exit("couleurs : " + ", ".join(ACCENTS))
        # accent-color existe depuis GNOME 47 ; sur GNOME 46 on prend la variante Yaru équivalente
        if subprocess.run(["gsettings", "writable", "org.gnome.desktop.interface", "accent-color"], capture_output=True).returncode == 0:
            gset("org.gnome.desktop.interface", "accent-color", f"'{ACCENTS[val]}'")
        else:
            gset("org.gnome.desktop.interface", "gtk-theme", f"'Yaru-{ACCENTS[val]}'")
    elif cmd == "dock":
        pos = {"bas": "BOTTOM", "gauche": "LEFT", "droite": "RIGHT"}.get(val) or sys.exit("bas|gauche|droite")
        gset(DOCK, "dock-position", f"'{pos}'")
    elif cmd == "boutons":
        layout = "close,minimize,maximize:" if val == "mac" else "appmenu:minimize,maximize,close"
        gset("org.gnome.desktop.wm.preferences", "button-layout", f"'{layout}'")
    elif cmd == "demarrage":
        theme = "lucien" if val == "logo" else "text"
        subprocess.run(["sudo", "plymouth-set-default-theme", "-R", theme], check=True)
    elif cmd == "shell":
        path = "/usr/bin/lsh" if val == "lsh" else "/bin/bash"
        subprocess.run(["chsh", "-s", path], check=True)
    elif cmd == "edition":
        print(edition())
        return
    elif cmd == "tout":
        print(f"Édition       : {edition()}")
        print(f"Thème         : {gget('org.gnome.desktop.interface', 'color-scheme')}")
        print(f"Accent        : {gget('org.gnome.desktop.interface', 'accent-color')}")
        print(f"Dock          : {gget(DOCK, 'dock-position')}")
        print(f"Boutons       : {gget('org.gnome.desktop.wm.preferences', 'button-layout')}")
        print(f"Shell         : {os.environ.get('SHELL', '?')}")
        return
    else:
        sys.exit(f"réglage inconnu : {cmd} (voir lucien-settings aide)")
    print("✓ réglage appliqué")


if __name__ == "__main__":
    main(sys.argv[1:])
