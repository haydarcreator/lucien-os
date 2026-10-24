#!/usr/bin/env python3
"""Lucien Antivirus — protection de Lucien OS.

  lucien-av scan [chemins…] [--quarantine] [--quiet]   analyse (code retour 1 si menace)
  lucien-av surveille [dossiers…]                       protection temps réel (inotify)
  lucien-av quarantaine [liste|restaure N|supprime N]
  lucien-av maj                                         met à jour les signatures (ClamAV + Lucien)
  lucien-av etat

Moteur à trois couches :
  1. empreintes SHA-256 connues (base Lucien, /var/lib/lucien-av/hashes.txt)
  2. règles heuristiques (double extension, binaire Windows déguisé, scripts de minage, reverse shells…)
  3. ClamAV (clamdscan / clamscan) s'il est installé
"""
import argparse
import hashlib
import json
import os
import re
import shutil
import subprocess
import sys
import time

DB_DIR = os.environ.get("LUCIEN_AV_DB", "/var/lib/lucien-av")
HASHES = os.path.join(DB_DIR, "hashes.txt")
QUAR = os.path.join(DB_DIR, "quarantaine")
QUAR_INDEX = os.path.join(QUAR, "index.json")
LOG = os.path.join(DB_DIR, "journal.log")
MAX_SIZE = 64 * 1024 * 1024
SKIP = ("/proc", "/sys", "/dev", "/run", QUAR)
RED, GRN, DIM, X = "\033[31m", "\033[32m", "\033[2m", "\033[0m"

# Empreinte du fichier de test EICAR standard (inoffensif, reconnu par tous les antivirus)
BUILTIN_HASHES = {"275a021bbfb6489e54d471899f7db9d1663fc695ec2fe2a2c4538aabf651fd0f": "EICAR-Test-File"}

HEURISTICS = [
    ("Lucien.Heur.DoubleExt", "nom", re.compile(r"\.(pdf|docx?|xlsx?|jpe?g|png|txt|mp4)\.(exe|scr|bat|cmd|vbs|js|sh)$", re.I)),
    ("Lucien.Heur.WinPE.Deguise", "debut", re.compile(rb"^MZ")),
    ("Lucien.Heur.Mineur", "contenu", re.compile(rb"(stratum\+tcp://|xmrig|cryptonight)", re.I)),
    ("Lucien.Heur.ReverseShell", "contenu", re.compile(rb"(bash -i >& ?/dev/tcp/|nc -e /bin/(ba)?sh|socket\.socket\(.*\n.*dup2)", re.I)),
    ("Lucien.Heur.Destructeur", "contenu", re.compile(rb"rm -rf --no-preserve-root /|:\(\)\{ ?:\|:& ?\};:")),
    ("Lucien.Heur.Telechargeur", "contenu", re.compile(rb"(curl|wget)[^\n|]{0,200}\|\s*(sudo\s+)?(ba)?sh", re.I)),
]
EICAR = rb"X5O!P%@AP[4\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*"
WIN_EXT = (".exe", ".dll", ".scr", ".com", ".msi")


def log(msg):
    try:
        os.makedirs(DB_DIR, exist_ok=True)
        with open(LOG, "a") as f:
            f.write(time.strftime("%Y-%m-%d %H:%M:%S ") + msg + "\n")
    except OSError:
        pass


def load_hashes():
    db = dict(BUILTIN_HASHES)
    try:
        with open(HASHES) as f:
            for line in f:
                parts = line.strip().split(None, 1)
                if len(parts) == 2 and not line.startswith("#"):
                    db[parts[0].lower()] = parts[1]
    except FileNotFoundError:
        pass
    return db


def check_file(path, hashes):
    """Renvoie le nom de la menace ou None."""
    try:
        st = os.stat(path)
        if not os.path.isfile(path) or st.st_size > MAX_SIZE:
            return None
        with open(path, "rb") as f:
            data = f.read()
    except OSError:
        return None
    name = hashes.get(hashlib.sha256(data).hexdigest())
    if name:
        return name
    if EICAR in data[:128]:
        return "EICAR-Test-File"
    base = os.path.basename(path)
    for sig, kind, rx in HEURISTICS:
        if kind == "nom" and rx.search(base):
            return sig
        if kind == "debut" and rx.match(data[:2]) and not base.lower().endswith(WIN_EXT):
            return sig
        if kind == "contenu" and rx.search(data):
            return sig
    return None


def walk(paths):
    for p in paths:
        p = os.path.abspath(os.path.expanduser(p))
        if os.path.isfile(p):
            yield p
            continue
        for dp, dns, fns in os.walk(p):
            dns[:] = [d for d in dns if not os.path.join(dp, d).startswith(SKIP)]
            for fn in fns:
                full = os.path.join(dp, fn)
                if not os.path.islink(full):
                    yield full


def clamav(paths):
    exe = shutil.which("clamdscan") or shutil.which("clamscan")
    if not exe:
        return {}
    args = [exe, "--no-summary", "--infected"] + (["--fdpass"] if exe.endswith("clamdscan") else ["-r"])
    out = subprocess.run(args + paths, capture_output=True, text=True).stdout
    found = {}
    for line in out.splitlines():
        if line.endswith(" FOUND"):
            path, sig = line[:-6].rsplit(": ", 1)
            found[path] = "ClamAV." + sig
    return found


def quarantine(path, sig):
    os.makedirs(QUAR, mode=0o700, exist_ok=True)
    idx = load_quar()
    dest = os.path.join(QUAR, f"{int(time.time() * 1000)}-{os.path.basename(path)}.quar")
    shutil.move(path, dest)
    os.chmod(dest, 0o000)
    idx.append({"origine": path, "fichier": dest, "menace": sig, "date": time.strftime("%Y-%m-%d %H:%M")})
    with open(QUAR_INDEX, "w") as f:
        json.dump(idx, f, indent=2, ensure_ascii=False)
    log(f"QUARANTAINE {path} ({sig})")


def load_quar():
    try:
        with open(QUAR_INDEX) as f:
            return json.load(f)
    except FileNotFoundError:
        return []


def notify(title, body):
    if shutil.which("notify-send"):
        subprocess.run(["notify-send", "-a", "Lucien Antivirus", "-i", "security-high", title, body], check=False)


def cmd_scan(a):
    hashes = load_hashes()
    paths = a.chemins or [os.path.expanduser("~")]
    found, n, t0 = {}, 0, time.time()
    for f in walk(paths):
        n += 1
        if not a.quiet and sys.stdout.isatty() and n % 50 == 0:
            print(f"\r{DIM}{n} fichiers… {f[-60:]:<60}{X}", end="", flush=True)
        sig = check_file(f, hashes)
        if sig:
            found[f] = sig
    found.update(clamav(paths))
    if not a.quiet and sys.stdout.isatty():
        print("\r" + " " * 80 + "\r", end="")
    for f, sig in found.items():
        print(f"{RED}× {f}{X}  {sig}")
        if a.quarantine:
            quarantine(f, sig)
            print(f"  {DIM}→ mis en quarantaine{X}")
    if not a.quiet:
        print(f"{n} fichiers analysés en {time.time() - t0:.1f} s — " +
              (f"{RED}{len(found)} menace(s){X}" if found else f"{GRN}aucune menace ✓{X}"))
    log(f"SCAN {' '.join(paths)} : {n} fichiers, {len(found)} menaces")
    return 1 if found else 0


def cmd_surveille(a):
    """Protection temps réel : analyse chaque fichier créé ou modifié (nécessite inotify-tools)."""
    dirs = a.dossiers or [os.path.expanduser("~/Téléchargements"), os.path.expanduser("~/Downloads"), "/tmp"]
    dirs = [d for d in dirs if os.path.isdir(d)]
    if not shutil.which("inotifywait"):
        sys.exit("inotifywait introuvable : sudo apt install inotify-tools")
    hashes = load_hashes()
    print(f"Lucien Antivirus — surveillance de : {', '.join(dirs)}")
    proc = subprocess.Popen(["inotifywait", "-m", "-r", "-q", "-e", "close_write,moved_to", "--format", "%w%f"] + dirs,
                            stdout=subprocess.PIPE, text=True)
    for line in proc.stdout:
        path = line.rstrip("\n")
        sig = check_file(path, hashes) or clamav([path]).get(path)
        if sig:
            quarantine(path, sig)
            notify("Menace bloquée", f"{os.path.basename(path)} ({sig}) a été mis en quarantaine.")
            print(f"{RED}× {path} — {sig} → quarantaine{X}", flush=True)


def cmd_quarantaine(a):
    idx = load_quar()
    if a.action == "liste":
        if not idx:
            print("Quarantaine vide.")
        for i, q in enumerate(idx):
            print(f"{i:>3}  {q['date']}  {q['menace']:<28} {q['origine']}")
        return
    if a.n is None or not 0 <= a.n < len(idx):
        sys.exit("numéro invalide (voir : lucien-av quarantaine liste)")
    q = idx.pop(a.n)
    if a.action == "restaure":
        os.chmod(q["fichier"], 0o600)
        shutil.move(q["fichier"], q["origine"])
        print(f"Restauré : {q['origine']}")
    else:
        os.remove(q["fichier"])
        print(f"Supprimé définitivement : {q['origine']}")
    with open(QUAR_INDEX, "w") as f:
        json.dump(idx, f, indent=2, ensure_ascii=False)


def cmd_maj(a):
    if shutil.which("freshclam"):
        subprocess.run(["freshclam"], check=False)
    url = os.environ.get("LUCIEN_AV_URL", "https://lucien-os.github.io/av/hashes.txt")
    try:
        import urllib.request
        os.makedirs(DB_DIR, exist_ok=True)
        urllib.request.urlretrieve(url, HASHES + ".new")
        os.replace(HASHES + ".new", HASHES)
        print(f"{GRN}✓ signatures Lucien à jour ({len(load_hashes())} empreintes){X}")
    except Exception as e:
        print(f"Signatures Lucien non mises à jour : {e}")


def cmd_etat(a):
    rt = subprocess.run(["systemctl", "--user", "is-active", "lucien-av"], capture_output=True, text=True).stdout.strip() if shutil.which("systemctl") else "?"
    fw = subprocess.run(["ufw", "status"], capture_output=True, text=True).stdout.split("\n")[0] if shutil.which("ufw") else "ufw absent"
    print(f"Temps réel   : {rt}")
    print(f"Pare-feu     : {fw}")
    print(f"ClamAV       : {'oui' if shutil.which('clamscan') else 'non installé'}")
    print(f"Empreintes   : {len(load_hashes())}")
    print(f"Quarantaine  : {len(load_quar())} élément(s)")


def main():
    ap = argparse.ArgumentParser(prog="lucien-av", description="Lucien Antivirus")
    sub = ap.add_subparsers(dest="cmd", required=True)
    p = sub.add_parser("scan"); p.add_argument("chemins", nargs="*"); p.add_argument("--quarantine", action="store_true"); p.add_argument("--quiet", action="store_true")
    p = sub.add_parser("surveille"); p.add_argument("dossiers", nargs="*")
    p = sub.add_parser("quarantaine"); p.add_argument("action", nargs="?", default="liste", choices=["liste", "restaure", "supprime"]); p.add_argument("n", nargs="?", type=int)
    sub.add_parser("maj")
    sub.add_parser("etat")
    a = ap.parse_args()
    sys.exit({"scan": cmd_scan, "surveille": cmd_surveille, "quarantaine": cmd_quarantaine, "maj": cmd_maj, "etat": cmd_etat}[a.cmd](a) or 0)


if __name__ == "__main__":
    main()
