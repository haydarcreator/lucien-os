#!/usr/bin/env python3
"""Lucien Shell (lsh) — le shell de Lucien OS.

Différences avec bash :
  * commandes intégrées en français (liste, va, montre, dis…) ; les noms Linux marchent aussi
  * variables avec « soit nom = valeur », lues avec $nom
  * alias avec « alias nom = commande »
  * filtres intégrés dans les tubes : « … | filtre mot », « … | compte »
  * « essaie cmd sinon cmd2 » : exécute cmd2 si cmd échoue
  * toute autre commande est lancée comme un programme Linux normal

Usage : lsh               (interactif)
        lsh script.lsh    (exécute un script)
        lsh -c "commande"
"""
import os
import re
import shlex
import shutil
import subprocess
import sys
import time

VERSION = "1.0.0"
RC = os.path.expanduser("~/.lshrc")
HISTFILE = os.path.expanduser("~/.lsh_history")

C = {"p": "\033[38;5;215m", "hl": "\033[38;5;141m", "ok": "\033[38;5;114m", "er": "\033[38;5;203m", "dim": "\033[2m", "x": "\033[0m"}
if not sys.stdout.isatty():
    C = {k: "" for k in C}


class LshError(Exception):
    pass


class Shell:
    def __init__(self):
        self.vars = {"UTILISATEUR": os.environ.get("USER", "lucien"), "OS": "Lucien OS", "VERSION": VERSION}
        self.aliases = {"ll": "liste -l", "cls": "efface"}
        self.status = 0
        self.builtins = {
            "aide": self.b_aide, "liste": self.b_liste, "va": self.b_va, "ici": self.b_ici,
            "montre": self.b_montre, "dis": self.b_dis, "cree": self.b_cree, "dossier": self.b_dossier,
            "jette": self.b_jette, "efface": self.b_efface, "soit": self.b_soit, "alias": self.b_alias,
            "historique": self.b_historique, "lucienfetch": self.b_fetch, "quitte": self.b_quitte,
            "lpm": self.b_ext("lpm"), "scan": self.b_ext("lucien-av", "scan"),
        }
        # Noms Linux habituels pour les commandes intégrées
        for fr, en in {"va": "cd", "ici": "pwd", "quitte": "exit", "soit": "set", "aide": "help", "historique": "history"}.items():
            self.builtins[en] = self.builtins[fr]

    # ---------- commandes intégrées ----------
    def b_aide(self, args, inp):
        rows = [
            ("liste [-l] [dossier]", "lister les fichiers"), ("va <dossier>", "changer de dossier"), ("ici", "dossier courant"),
            ("montre <fichier>", "afficher un fichier"), ("dis <texte>", "afficher du texte"), ("cree / dossier <nom>", "créer fichier / dossier"),
            ("jette <chemin>", "envoyer à la corbeille"), ("soit x = valeur", "variable ($x)"), ("alias n = cmd", "raccourci"),
            ("cmd | filtre mot", "filtrer les lignes"), ("cmd | compte", "compter les lignes"), ("essaie a sinon b", "repli en cas d'échec"),
            ("lpm installe <paquet>", "installer .lcn ou .deb"), ("scan [chemin]", "Lucien Antivirus"), ("lucienfetch", "infos système"),
        ]
        out = f"{C['p']}Lucien Shell {VERSION}{C['x']}\n\n"
        out += "\n".join(f"  {C['p']}{a:<26}{C['x']}{b}" for a, b in rows)
        return out + "\n\nToute autre commande est lancée comme un programme Linux.\n"

    def b_liste(self, args, inp):
        long = "-l" in args
        args = [a for a in args if a != "-l"]
        path = os.path.expanduser(args[0] if args else ".")
        if not os.path.exists(path):
            raise LshError(f"aucun fichier ou dossier : {path}")
        if not os.path.isdir(path):
            return path + "\n"
        names = sorted(os.listdir(path), key=str.lower)
        if not long:
            names = [n for n in names if not n.startswith(".")]
        lines = []
        for n in names:
            full = os.path.join(path, n)
            shown = f"{C['hl']}{n}/{C['x']}" if os.path.isdir(full) else f"{C['p']}{n}{C['x']}" if n.endswith(".lcn") else n
            if long:
                st = os.lstat(full)
                lines.append(f"{'d' if os.path.isdir(full) else '-'} {st.st_size:>10}  {time.strftime('%d/%m/%Y %H:%M', time.localtime(st.st_mtime))}  {shown}")
            else:
                lines.append(shown)
        return ("\n" if long else "   ").join(lines) + "\n"

    def b_va(self, args, inp):
        try:
            os.chdir(os.path.expanduser(args[0] if args else "~"))
        except OSError as e:
            raise LshError(f"va : {e.strerror} : {args[0]}")
        return ""

    def b_ici(self, args, inp):
        return os.getcwd() + "\n"

    def b_montre(self, args, inp):
        if not args:
            return inp or ""
        out = []
        for a in args:
            try:
                with open(os.path.expanduser(a), encoding="utf-8", errors="replace") as f:
                    out.append(f.read())
            except OSError as e:
                raise LshError(f"montre : {e.strerror} : {a}")
        return "".join(out)

    def b_dis(self, args, inp):
        return " ".join(args) + "\n"

    def b_cree(self, args, inp):
        for a in args:
            open(os.path.expanduser(a), "a").close()
        return ""

    def b_dossier(self, args, inp):
        for a in args:
            os.makedirs(os.path.expanduser(a), exist_ok=True)
        return ""

    def b_jette(self, args, inp):
        trash = os.path.expanduser("~/.local/share/Trash/files")
        os.makedirs(trash, exist_ok=True)
        for a in args:
            p = os.path.expanduser(a)
            if not os.path.exists(p):
                raise LshError(f"jette : introuvable : {a}")
            shutil.move(p, os.path.join(trash, os.path.basename(p.rstrip("/"))))
        return f"{C['ok']}→ envoyé à la corbeille{C['x']}\n" if args else ""

    def b_efface(self, args, inp):
        return "\033[2J\033[H"

    def _assign(self, args, what):
        m = re.match(r"^(\w+)\s*=\s*(.*)$", " ".join(args))
        if not m:
            raise LshError(f"usage : {what} nom = valeur")
        return m.group(1), m.group(2)

    def b_soit(self, args, inp):
        if not args:
            return "".join(f"{k} = {v}\n" for k, v in self.vars.items())
        k, v = self._assign(args, "soit")
        self.vars[k] = v
        return ""

    def b_alias(self, args, inp):
        if not args:
            return "".join(f"{k} = {v}\n" for k, v in self.aliases.items())
        k, v = self._assign(args, "alias")
        self.aliases[k] = v
        return ""

    def b_historique(self, args, inp):
        try:
            import readline
            return "".join(f"{i:>4}  {readline.get_history_item(i)}\n" for i in range(1, readline.get_current_history_length() + 1))
        except ImportError:
            return ""

    def b_fetch(self, args, inp):
        info = {}
        try:
            with open("/etc/os-release") as f:
                info = dict(l.strip().split("=", 1) for l in f if "=" in l)
        except OSError:
            pass
        model = ""
        try:
            with open("/proc/device-tree/model") as f:
                model = f.read().strip("\x00\n")
        except OSError:
            model = os.uname().machine if hasattr(os, "uname") else ""
        art = ["   ▄▄▄        ▄▄▄  ", "  █████▄▄▄▄▄▄█████ ", "   ▀███████████▀▀  ", "  ▄███▀▀▀▀▀▀▀███▄  ", "  ▀▀▀▀        ▀▀▀  "]
        lines = [
            f"{C['p']}{self.vars['UTILISATEUR']}{C['x']}@{C['p']}{os.uname().nodename if hasattr(os, 'uname') else 'lucien'}{C['x']}",
            "─" * 18,
            f"{C['p']}OS{C['x']}      {info.get('PRETTY_NAME', 'Lucien OS').strip(chr(34))}",
            f"{C['p']}Machine{C['x']} {model}",
            f"{C['p']}Noyau{C['x']}   {os.uname().release if hasattr(os, 'uname') else '?'}",
            f"{C['p']}Shell{C['x']}   lsh {VERSION}",
        ]
        return "\n".join(f"{art[i] if i < len(art) else ' ' * 20}{l}" for i, l in enumerate(lines)) + "\n"

    def b_quitte(self, args, inp):
        raise SystemExit(int(args[0]) if args else 0)

    def b_ext(self, prog, *pre):
        def run(args, inp):
            return self.external([prog, *pre, *args], inp, capture=inp is not None)
        return run

    # ---------- exécution ----------
    def expand(self, line):
        return re.sub(r"\$(\w+)", lambda m: self.vars.get(m.group(1), os.environ.get(m.group(1), "")), line)

    def external(self, argv, inp, capture):
        if not shutil.which(argv[0]):
            raise LshError(f"commande inconnue : {argv[0]} — tape « aide »")
        p = subprocess.run(argv, input=inp, text=True, stdout=subprocess.PIPE if capture else None)
        self.status = p.returncode
        if p.returncode:
            raise LshError(f"{argv[0]} a échoué (code {p.returncode})") if capture else LshError("")
        return p.stdout if capture else ""

    def run_segment(self, seg, inp, last):
        redir = None
        m = re.search(r"\s(>>?)\s*(\S+)\s*$", " " + seg)
        if m:
            redir = (m.group(1), os.path.expanduser(m.group(2)))
            seg = (" " + seg)[: m.start()].strip()
        argv = shlex.split(seg)
        if not argv:
            return inp
        if argv[0] in self.aliases:
            argv = shlex.split(self.aliases[argv[0]]) + argv[1:]
        cmd, args = argv[0], argv[1:]
        if cmd == "filtre":
            word = (args[0] if args else "").lower()
            out = "".join(l for l in inp.splitlines(True) if word in l.lower())
        elif cmd == "compte":
            out = f"{len([l for l in (inp or '').splitlines() if l.strip()])}\n"
        elif cmd in self.builtins:
            out = self.builtins[cmd](args, inp)
        else:
            out = self.external(argv, inp, capture=not last or redir is not None)
        if redir:
            with open(redir[1], "a" if redir[0] == ">>" else "w", encoding="utf-8") as f:
                f.write(out)
            return ""
        return out

    def run_pipeline(self, line):
        segs = [s.strip() for s in line.split("|")]
        data = None
        for i, s in enumerate(segs):
            data = self.run_segment(s, data, last=i == len(segs) - 1)
        if data:
            sys.stdout.write(data)
            sys.stdout.flush()

    def run_line(self, line):
        line = self.expand(re.sub(r"(^|\s)#.*$", "", line)).strip()
        if not line:
            return
        m = re.match(r"^essaie\s+(.+?)\s+sinon\s+(.+)$", line)
        if m:
            try:
                self.run_line(m.group(1))
            except LshError:
                self.run_line(m.group(2))
            return
        for chain in line.split("&&"):
            try:
                self.run_pipeline(chain.strip())
                self.status = 0
            except LshError as e:
                self.status = self.status or 1
                if str(e):
                    print(f"{C['er']}lsh: {e}{C['x']}", file=sys.stderr)
                raise

    def run_file(self, path):
        with open(path, encoding="utf-8") as f:
            for line in f:
                try:
                    self.run_line(line)
                except LshError:
                    pass

    def prompt(self):
        cwd = os.getcwd()
        home = os.path.expanduser("~")
        if cwd == home or cwd.startswith(home + os.sep):
            cwd = "~" + cwd[len(home):]
        mark = C["p"] if self.status == 0 else C["er"]
        return f"{C['p']}{self.vars['UTILISATEUR']}{C['x']} {C['hl']}{cwd}{C['x']} {mark}❯{C['x']} "

    def interactive(self):
        try:
            import readline
            try:
                readline.read_history_file(HISTFILE)
            except OSError:
                pass
            words = list(self.builtins) + ["filtre", "compte", "essaie", "sinon"]
            def complete(text, state):
                pool = words + os.listdir(".") if readline.get_begidx() == 0 else os.listdir(".")
                m = [w for w in pool if w.startswith(text)]
                return m[state] if state < len(m) else None
            readline.set_completer(complete)
            readline.parse_and_bind("tab: complete")
        except ImportError:
            readline = None
        print(f"{C['p']}Lucien Shell {VERSION}{C['x']} {C['dim']}— tape « aide » pour commencer.{C['x']}")
        while True:
            try:
                line = input(self.prompt())
            except EOFError:
                print()
                break
            except KeyboardInterrupt:
                print()
                continue
            try:
                self.run_line(line)
            except LshError:
                pass
            except KeyboardInterrupt:
                print()
        if readline:
            readline.write_history_file(HISTFILE)


def main():
    sh = Shell()
    if os.path.exists(RC):
        sh.run_file(RC)
    a = sys.argv[1:]
    if a[:1] == ["-c"] and len(a) > 1:
        try:
            sh.run_line(a[1])
        except LshError:
            pass
        sys.exit(sh.status)
    if a[:1] in (["-v"], ["--version"]):
        print(f"lsh {VERSION}")
        return
    if a:
        sh.run_file(a[0])
        sys.exit(sh.status)
    sh.interactive()


if __name__ == "__main__":
    main()
