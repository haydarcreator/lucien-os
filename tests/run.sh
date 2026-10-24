#!/usr/bin/env bash
# Tests rapides des outils Lucien, sans droits root
set -euo pipefail
cd "$(dirname "$0")/.."
T=$(mktemp -d); trap 'rm -rf "$T"' EXIT
ok() { printf '\033[32m✓ %s\033[0m\n' "$*"; }

# Lucien Shell
[ "$(python3 lsh/lsh.py -c 'soit nom = Lucien && dis Bonjour $nom')" = "Bonjour Lucien" ] && ok "lsh : variables"
[ "$(printf 'a\nb\nab\n' > "$T/f"; python3 lsh/lsh.py -c "montre $T/f | filtre a | compte")" = "2" ] && ok "lsh : tubes filtre/compte"
[ "$(python3 lsh/lsh.py -c 'essaie commande-inexistante sinon dis repli' 2>/dev/null)" = "repli" ] && ok "lsh : essaie/sinon"

# lpm : construire puis installer un .lcn dans une racine de test
python3 lpm/lpm.py construis lpm/exemple -o "$T/bonjour.lcn" >/dev/null
LPM_ROOT="$T/root" LPM_DB="$T/db" LPM_AUTORISER_NON_SIGNE=1 python3 lpm/lpm.py installe -y "$T/bonjour.lcn" >/dev/null
[ -x "$T/root/usr/bin/bonjour" ] && ok "lpm : installation .lcn"
LPM_ROOT="$T/root" LPM_DB="$T/db" python3 lpm/lpm.py liste | grep -q bonjour && ok "lpm : base des paquets"
LPM_ROOT="$T/root" LPM_DB="$T/db" python3 lpm/lpm.py retire bonjour >/dev/null
[ ! -e "$T/root/usr/bin/bonjour" ] && ok "lpm : désinstallation"

# Lucien Antivirus : fichier de test EICAR + double extension
mkdir "$T/scan"
printf '%s' 'X5O!P%@AP[4\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*' > "$T/scan/eicar.com"
echo propre > "$T/scan/facture.pdf.exe"
echo propre > "$T/scan/note.txt"
set +e; LUCIEN_AV_DB="$T/av" python3 antivirus/lucien-av.py scan --quiet "$T/scan" > "$T/out"; code=$?; set -e
[ $code = 1 ] && grep -q EICAR "$T/out" && grep -q DoubleExt "$T/out" && ! grep -q note.txt "$T/out" && ok "lucien-av : détection"
echo "Tous les tests sont passés."
