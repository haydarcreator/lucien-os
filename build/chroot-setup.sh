#!/usr/bin/env bash
# Exécuté DANS le chroot par build.sh. Transforme Ubuntu en Lucien OS.
set -euo pipefail
S=/tmp/lucien
log() { printf '\033[38;5;141m  -> %s\033[0m\n' "$*"; }

log "Dépôts"
cat > /etc/apt/sources.list <<EOF
deb $MIRROR $SUITE main restricted universe multiverse
deb $MIRROR $SUITE-updates main restricted universe multiverse
deb $MIRROR $SUITE-security main restricted universe multiverse
EOF
# Lucien OS n'utilise pas les snaps : Firefox/Software passent par .deb, .lcn et Flatpak
cat > /etc/apt/preferences.d/sans-snap.pref <<'EOF'
Package: snapd
Pin: release a=*
Pin-Priority: -10
EOF
apt-get update

log "Paquets communs + édition $EDITION"
pkgs() { grep -vE '^\s*(#|$)' "$1" | tr '\n' ' '; }
# shellcheck disable=SC2046
apt-get install -y --no-install-recommends $(pkgs "$S/build/packages/commun.txt") $(pkgs "$S/build/packages/$EDITION.txt")

log "Outils Lucien"
install -Dm755 "$S/lsh/lsh.py"                  /usr/bin/lsh
install -Dm755 "$S/lpm/lpm.py"                  /usr/bin/lpm
install -Dm755 "$S/antivirus/lucien-av.py"      /usr/bin/lucien-av
install -Dm755 "$S/browser/lucien-browser.py"   /usr/bin/lucien-browser
install -Dm755 "$S/settings/lucien-settings.py" /usr/bin/lucien-settings
install -Dm644 "$S/lsh/lshrc.example"           /etc/skel/.lshrc
install -Dm644 "$S/assets/logo.webp"            /usr/share/lucien/logo.webp
install -Dm644 "$S/assets/logo-256.png"         /usr/share/icons/hicolor/256x256/apps/lucien.png
install -Dm644 "$S/assets/wallpapers/clair.svg"  /usr/share/backgrounds/lucien/clair.svg
install -Dm644 "$S/assets/wallpapers/sombre.svg" /usr/share/backgrounds/lucien/sombre.svg
cp "$S"/build/desktop/*.desktop /usr/share/applications/
grep -qx /usr/bin/lsh /etc/shells || echo /usr/bin/lsh >> /etc/shells
mkdir -p /var/lib/lpm /var/lib/lucien-av
echo '{}' > /var/lib/lpm/installed.json

log "Lucien Office (LibreOffice en ruban, formats Office par défaut)"
cp "$S"/office/*.desktop /usr/share/applications/
for app in writer calc impress; do
  echo "NoDisplay=true" >> "/usr/share/applications/libreoffice-$app.desktop" 2>/dev/null || true
done
install -Dm644 "$S/office/registrymodifications.xcu" /etc/skel/.config/libreoffice/4/user/registrymodifications.xcu

log "Apps web Lucien (Calculator, Code, Carnet, Tâches, Formulaires)"
mkdir -p /usr/share/lucien/web
cp -r "$S/demo" "$S/css" "$S/js" "$S/assets" /usr/share/lucien/web/
install -Dm755 "$S/webapp/lucien-webapp.py" /usr/bin/lucien-webapp
cp "$S"/webapp/*.desktop /usr/share/applications/

log "Type MIME .lcn → double-clic = installation"
install -Dm644 "$S/build/desktop/lucien-lcn.xml" /usr/share/mime/packages/lucien-lcn.xml
update-mime-database /usr/share/mime

log "Thème macOS (WhiteSur)"
tmp=$(mktemp -d)
for r in WhiteSur-gtk-theme WhiteSur-icon-theme WhiteSur-cursors; do
  git clone -q --depth 1 "https://github.com/vinceliuice/$r.git" "$tmp/$r"
done
(cd "$tmp/WhiteSur-gtk-theme" && ./install.sh -d /usr/share/themes -c light -c dark >/dev/null)
(cd "$tmp/WhiteSur-icon-theme" && ./install.sh -d /usr/share/icons >/dev/null)
(cd "$tmp/WhiteSur-cursors" && cp -r dist /usr/share/icons/WhiteSur-cursors)
rm -rf "$tmp"
install -Dm644 "$S/settings/90_lucien.gschema.override" /usr/share/glib-2.0/schemas/90_lucien.gschema.override
glib-compile-schemas /usr/share/glib-2.0/schemas

log "Écran de démarrage"
mkdir -p /usr/share/plymouth/themes/lucien
cp "$S"/boot/plymouth/lucien/* /usr/share/plymouth/themes/lucien/
plymouth-set-default-theme lucien || update-alternatives --install /usr/share/plymouth/themes/default.plymouth default.plymouth /usr/share/plymouth/themes/lucien/lucien.plymouth 200
sed -i 's/^GRUB_CMDLINE_LINUX_DEFAULT=.*/GRUB_CMDLINE_LINUX_DEFAULT="quiet splash"/' /etc/default/grub 2>/dev/null || true
mkdir -p /etc/default/grub.d
echo 'GRUB_DISTRIBUTOR="Lucien OS"' > /etc/default/grub.d/90-lucien.cfg 2>/dev/null || true

log "Identité du système"
cat > /etc/os-release <<EOF
PRETTY_NAME="Lucien OS $VERSION"
NAME="Lucien OS"
VERSION_ID="$VERSION"
VERSION="$VERSION (Os de Lune)"
VERSION_CODENAME=$SUITE
ID=lucien
ID_LIKE="ubuntu debian"
UBUNTU_CODENAME=$SUITE
HOME_URL="https://github.com/haydarcreator/lucien-os"
LOGO=lucien
EOF
ln -sf /etc/os-release /usr/lib/os-release
echo "$EDITION" > /etc/lucien-edition
echo lucien > /etc/hostname
printf 'Lucien OS %s \\n \\l\n\n' "$VERSION" > /etc/issue
sed -i 's/^DISTRIB_DESCRIPTION=.*/DISTRIB_DESCRIPTION="Lucien OS '"$VERSION"'"/' /etc/lsb-release

log "Sécurité : pare-feu + antivirus temps réel"
ufw default deny incoming >/dev/null; ufw default allow outgoing >/dev/null
sed -i 's/^ENABLED=no/ENABLED=yes/' /etc/ufw/ufw.conf
install -Dm644 "$S/antivirus/lucien-av.service" /usr/lib/systemd/user/lucien-av.service
systemctl --global enable lucien-av.service
systemctl enable clamav-freshclam.service 2>/dev/null || true

log "Langue française par défaut"
locale-gen fr_FR.UTF-8 en_US.UTF-8 >/dev/null
update-locale LANG=fr_FR.UTF-8
echo 'XKBLAYOUT="fr"' >> /etc/default/keyboard

if [ -f "$S/build/editions/$EDITION.sh" ]; then
  log "Réglages spécifiques : $EDITION"
  # shellcheck source=/dev/null
  . "$S/build/editions/$EDITION.sh"
fi

log "Nettoyage"
apt-get clean
rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*
: > /etc/machine-id
