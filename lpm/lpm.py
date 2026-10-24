#!/usr/bin/env python3
"""lpm — gestionnaire de paquets de Lucien OS.

Installe deux formats :
  .lcn  paquet natif Lucien (voir docs/FORMAT-LCN.md)
  .deb  paquet Ubuntu/Debian (délégué à apt)

  lpm installe <fichier.lcn | fichier.deb | nom>
  lpm retire <nom>
  lpm liste
  lpm cherche <mot>
  lpm info <nom | fichier.lcn>
  lpm maj
  lpm construis <dossier> [-o sortie.lcn]
"""
import argparse
import hashlib
import io
import json
import os
import shutil
import subprocess
import sys
import tarfile
import tempfile
import urllib.request

DB_DIR = os.environ.get("LPM_DB", "/var/lib/lpm")
DB = os.path.join(DB_DIR, "installed.json")
REPO = os.environ.get("LPM_REPO", "https://haydarcreator.github.io/lucien-os/repo")
ROOT = os.environ.get("LPM_ROOT", "/")
ARCH = {"x86_64": "amd64", "aarch64": "arm64"}.get(os.uname().machine, os.uname().machine)

OK, ER, DIM, X = "\033[32m", "\033[31m", "\033[2m", "\033[0m"


def die(msg):
    print(f"{ER}lpm : {msg}{X}", file=sys.stderr)
    sys.exit(1)


def step(msg):
    print(f"{DIM}→ {msg}{X}")


def load_db():
    try:
        with open(DB) as f:
            return json.load(f)
    except FileNotFoundError:
        return {}


def save_db(db):
    os.makedirs(DB_DIR, exist_ok=True)
    tmp = DB + ".tmp"
    with open(tmp, "w") as f:
        json.dump(db, f, indent=2, ensure_ascii=False)
    os.replace(tmp, DB)


def need_root():
    if os.geteuid() != 0 and ROOT == "/":
        die("cette action demande les droits administrateur (sudo lpm …)")


# ---------- format .lcn ----------
def read_lcn(path):
    """Ouvre un .lcn, vérifie sa structure et ses sommes de contrôle, renvoie (manifeste, tar)."""
    try:
        tar = tarfile.open(path, "r:gz")
    except (tarfile.TarError, OSError) as e:
        die(f"{path} n'est pas un paquet .lcn valide ({e})")
    try:
        manifest = json.load(tar.extractfile("lucien.json"))
        sums = tar.extractfile("SHA256SUMS").read().decode().split("\n")
    except KeyError as e:
        die(f"paquet incomplet : {e} manquant")
    for key in ("nom", "version", "arch"):
        if key not in manifest:
            die(f"lucien.json : champ « {key} » manquant")
    expected = dict(reversed(l.split("  ", 1)) for l in sums if l.strip())
    for m in tar.getmembers():
        if not m.isfile() or not m.name.startswith("fichiers/"):
            continue
        digest = hashlib.sha256(tar.extractfile(m).read()).hexdigest()
        if expected.get(m.name) != digest:
            die(f"somme de contrôle invalide pour {m.name} — paquet corrompu ou modifié")
    return manifest, tar


def verify_signature(path):
    sig = path + ".sig"
    if not os.path.exists(sig):
        return False
    if not shutil.which("gpg"):
        return False
    r = subprocess.run(["gpg", "--batch", "--verify", sig, path], capture_output=True)
    if r.returncode:
        die("signature GPG invalide")
    return True


def safe_members(tar):
    for m in tar.getmembers():
        if not m.name.startswith("fichiers/") or m.name == "fichiers/":
            continue
        rel = os.path.normpath(m.name[len("fichiers/"):])
        if rel.startswith("..") or os.path.isabs(rel):
            die(f"chemin dangereux dans le paquet : {m.name}")
        if m.islnk() or m.issym() and ".." in m.linkname.split("/"):
            die(f"lien refusé : {m.name} → {m.linkname}")
        if m.isdev():
            die(f"fichier spécial refusé : {m.name}")
        yield m, rel


def run_script(tar, name, manifest):
    try:
        data = tar.extractfile(f"scripts/{name}").read()
    except KeyError:
        return
    step(f"script {name}")
    with tempfile.NamedTemporaryFile("wb", delete=False, suffix=".sh") as f:
        f.write(data)
    os.chmod(f.name, 0o755)
    env = dict(os.environ, LCN_NOM=manifest["nom"], LCN_VERSION=manifest["version"], LCN_ROOT=ROOT)
    r = subprocess.run([f.name], env=env)
    os.unlink(f.name)
    if r.returncode:
        die(f"le script {name} a échoué")


def antivirus(path):
    if shutil.which("lucien-av"):
        step("analyse Lucien Antivirus")
        if subprocess.run(["lucien-av", "scan", "--quiet", path]).returncode == 1:
            die("Lucien Antivirus a détecté une menace — installation annulée")


def install_lcn(path, assume_yes=False):
    manifest, tar = read_lcn(path)
    name, ver = manifest["nom"], manifest["version"]
    if manifest["arch"] not in ("all", ARCH):
        die(f"{name} est prévu pour {manifest['arch']}, cette machine est {ARCH}")
    signed = verify_signature(path)
    if not signed and not os.environ.get("LPM_AUTORISER_NON_SIGNE"):
        print(f"Attention : {name} n'est pas signé.")
        if not assume_yes and input("Installer quand même ? [o/N] ").strip().lower() not in ("o", "oui", "y"):
            sys.exit(1)
    antivirus(path)
    db = load_db()
    for dep in manifest.get("dependances", []):
        if dep.startswith("deb:"):
            step(f"dépendance Ubuntu {dep[4:]}")
            subprocess.run(["apt-get", "install", "-y", dep[4:]], check=True)
        elif dep not in db:
            step(f"dépendance {dep}")
            install_name(dep, assume_yes=True)
    if name in db:
        step(f"mise à jour {db[name]['version']} → {ver}")
        remove(name, quiet=True, keep_db=True)
    run_script(tar, "avant-installation", manifest)
    files = []
    for m, rel in safe_members(tar):
        dest = os.path.join(ROOT, rel)
        if m.isdir():
            os.makedirs(dest, exist_ok=True)
            continue
        os.makedirs(os.path.dirname(dest), exist_ok=True)
        if m.issym():
            if os.path.lexists(dest):
                os.unlink(dest)
            os.symlink(m.linkname, dest)
        else:
            with tar.extractfile(m) as src, open(dest, "wb") as out:
                shutil.copyfileobj(src, out)
            os.chmod(dest, m.mode & 0o755 | 0o644)
        files.append("/" + rel)
    run_script(tar, "apres-installation", manifest)
    db = load_db()
    db[name] = {"version": ver, "format": "lcn", "description": manifest.get("description", ""), "fichiers": files, "signe": signed,
                "desinstallation": manifest.get("desinstallation", "")}
    save_db(db)
    print(f"{OK}✓ {name} {ver} installé (.lcn){X}")


def install_deb(path):
    antivirus(path)
    step("installation via apt")
    r = subprocess.run(["apt-get", "install", "-y", os.path.abspath(path)])
    if r.returncode:
        die("apt a échoué")
    info = subprocess.run(["dpkg-deb", "-f", path, "Package", "Version", "Description"], capture_output=True, text=True).stdout
    fields = dict(l.split(": ", 1) for l in info.splitlines() if ": " in l)
    db = load_db()
    db[fields.get("Package", os.path.basename(path))] = {"version": fields.get("Version", "?"), "format": "deb", "description": fields.get("Description", "")}
    save_db(db)
    print(f"{OK}✓ {fields.get('Package')} installé (.deb){X}")


def repo_index():
    try:
        with urllib.request.urlopen(f"{REPO}/{ARCH}/index.json", timeout=10) as r:
            return json.load(r)
    except Exception:
        return {}


def install_name(name, assume_yes=False):
    idx = repo_index()
    if name in idx:
        pkg = idx[name]
        step(f"téléchargement de {name} {pkg['version']}")
        tmp = tempfile.mkdtemp()
        dest = os.path.join(tmp, f"{name}.lcn")
        urllib.request.urlretrieve(f"{REPO}/{ARCH}/{pkg['fichier']}", dest)
        try:
            urllib.request.urlretrieve(f"{REPO}/{ARCH}/{pkg['fichier']}.sig", dest + ".sig")
        except Exception:
            pass
        with open(dest, "rb") as f:
            if hashlib.sha256(f.read()).hexdigest() != pkg["sha256"]:
                die("le fichier téléchargé ne correspond pas à l'index")
        install_lcn(dest, assume_yes)
        shutil.rmtree(tmp)
    else:
        step(f"{name} absent du dépôt Lucien, essai avec apt")
        if subprocess.run(["apt-get", "install", "-y", name]).returncode:
            die(f"paquet introuvable : {name}")
        db = load_db()
        db[name] = {"version": "apt", "format": "deb", "description": ""}
        save_db(db)


def remove(name, quiet=False, keep_db=False):
    db = load_db()
    if name not in db:
        die(f"{name} n'est pas installé")
    pkg = db[name]
    if pkg["format"] == "deb":
        subprocess.run(["apt-get", "remove", "-y", name], check=False)
    else:
        if pkg.get("desinstallation"):
            subprocess.run(["sh", "-c", pkg["desinstallation"]], check=False)
        for f in sorted(pkg["fichiers"], key=len, reverse=True):
            p = os.path.join(ROOT, f.lstrip("/"))
            if os.path.islink(p) or os.path.isfile(p):
                os.unlink(p)
    if not keep_db:
        del db[name]
        save_db(db)
    if not quiet:
        print(f"{OK}✓ {name} désinstallé{X}")


def build(src, out):
    """Construit un .lcn à partir d'un dossier contenant lucien.json, fichiers/ et éventuellement scripts/."""
    mpath = os.path.join(src, "lucien.json")
    if not os.path.exists(mpath):
        die(f"{mpath} introuvable")
    with open(mpath) as f:
        manifest = json.load(f)
    out = out or f"{manifest['nom']}-{manifest['version']}-{manifest['arch']}.lcn"
    sums = []
    with tarfile.open(out, "w:gz") as tar:
        tar.add(mpath, "lucien.json")
        for base in ("fichiers", "scripts"):
            root = os.path.join(src, base)
            if not os.path.isdir(root):
                continue
            for dp, _, fns in os.walk(root):
                for fn in sorted(fns):
                    full = os.path.join(dp, fn)
                    arc = os.path.relpath(full, src).replace(os.sep, "/")
                    tar.add(full, arc)
                    if base == "fichiers" and not os.path.islink(full):
                        with open(full, "rb") as fh:
                            sums.append(f"{hashlib.sha256(fh.read()).hexdigest()}  {arc}")
        data = ("\n".join(sums) + "\n").encode()
        ti = tarfile.TarInfo("SHA256SUMS")
        ti.size = len(data)
        tar.addfile(ti, io.BytesIO(data))
    print(f"{OK}✓ paquet créé : {out}{X}")
    print(f"{DIM}signe-le avec : gpg --detach-sign -o {out}.sig {out}{X}")


def main():
    ap = argparse.ArgumentParser(prog="lpm", description="Gestionnaire de paquets Lucien OS (.lcn + .deb)")
    sub = ap.add_subparsers(dest="cmd", required=True)
    p = sub.add_parser("installe", aliases=["install"]); p.add_argument("cible", nargs="+"); p.add_argument("-y", action="store_true")
    p = sub.add_parser("retire", aliases=["remove"]); p.add_argument("nom", nargs="+")
    sub.add_parser("liste", aliases=["list"])
    p = sub.add_parser("cherche", aliases=["search"]); p.add_argument("mot")
    p = sub.add_parser("info"); p.add_argument("cible")
    sub.add_parser("maj", aliases=["update"])
    p = sub.add_parser("construis", aliases=["build"]); p.add_argument("dossier"); p.add_argument("-o", "--sortie")
    a = ap.parse_args()
    cmd = {"install": "installe", "remove": "retire", "list": "liste", "search": "cherche", "update": "maj", "build": "construis"}.get(a.cmd, a.cmd)

    if cmd == "installe":
        need_root()
        for t in a.cible:
            if t.endswith(".lcn"):
                install_lcn(t, a.y)
            elif t.endswith(".deb"):
                install_deb(t)
            else:
                install_name(t, a.y)
    elif cmd == "retire":
        need_root()
        for n in a.nom:
            remove(n)
    elif cmd == "liste":
        for n, p in sorted(load_db().items()):
            print(f"{OK}●{X} {n:<20} {p['version']:<12} {DIM}.{p['format']}{X}")
    elif cmd == "cherche":
        w = a.mot.lower()
        for n, p in repo_index().items():
            if w in n.lower() or w in p.get("description", "").lower():
                print(f"{n:<20} {p['version']:<10} .lcn  {DIM}{p.get('description', '')}{X}")
        subprocess.run(["apt-cache", "search", "--names-only", a.mot])
    elif cmd == "info":
        if a.cible.endswith(".lcn"):
            m, _ = read_lcn(a.cible)
            print(json.dumps(m, indent=2, ensure_ascii=False))
        else:
            p = load_db().get(a.cible) or die(f"{a.cible} n'est pas installé")
            print(json.dumps(p, indent=2, ensure_ascii=False))
    elif cmd == "maj":
        need_root()
        step("dépôts Ubuntu")
        subprocess.run(["apt-get", "update"])
        subprocess.run(["apt-get", "upgrade", "-y"])
        step("dépôt Lucien")
        idx, db = repo_index(), load_db()
        for n, p in db.items():
            if p["format"] == "lcn" and n in idx and idx[n]["version"] != p["version"]:
                install_name(n, assume_yes=True)
        print(f"{OK}✓ système à jour{X}")
    elif cmd == "construis":
        build(a.dossier, a.sortie)


if __name__ == "__main__":
    main()
