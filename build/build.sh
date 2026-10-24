#!/usr/bin/env bash
# Construit une image de Lucien OS.
#   sudo ./build/build.sh pc       → out/lucien-os-1.0-pc-amd64.iso
#   sudo ./build/build.sh laptop   → out/lucien-os-1.0-laptop-amd64.iso
#   sudo ./build/build.sh pi5      → out/lucien-os-1.0-pi5-arm64.img.xz
# Machine hôte : Ubuntu 24.04 (ou Debian 12), ~25 Go libres, connexion Internet.
set -euo pipefail

EDITION="${1:-}"
VERSION="1.0"
SUITE="noble"   # Ubuntu 24.04 LTS
HERE="$(cd "$(dirname "$0")" && pwd)"
REPO="$(dirname "$HERE")"
WORK="${WORK:-$REPO/work/$EDITION}"
OUT="${OUT:-$REPO/out}"
ROOTFS="$WORK/rootfs"

case "$EDITION" in
  pc|laptop) ARCH=amd64; MIRROR=http://archive.ubuntu.com/ubuntu ;;
  pi5)       ARCH=arm64; MIRROR=http://ports.ubuntu.com/ubuntu-ports ;;
  *) echo "usage : sudo $0 pc|laptop|pi5" >&2; exit 1 ;;
esac
[ "$(id -u)" = 0 ] || { echo "lance ce script avec sudo" >&2; exit 1; }

log() { printf '\033[38;5;215m==> %s\033[0m\n' "$*"; }

log "Dépendances de l'hôte"
apt-get update -qq
apt-get install -y -qq debootstrap squashfs-tools xorriso mtools \
  dosfstools parted kpartx rsync imagemagick webp xz-utils >/dev/null
if [ "$ARCH" = amd64 ]; then
  apt-get install -y -qq grub-pc-bin grub-efi-amd64-bin >/dev/null
fi
if [ "$ARCH" = arm64 ] && [ "$(dpkg --print-architecture)" != arm64 ]; then
  apt-get install -y -qq qemu-user-static binfmt-support >/dev/null
fi

cleanup() {
  for m in dev/pts dev proc sys run; do umount -lf "$ROOTFS/$m" 2>/dev/null || true; done
}
trap cleanup EXIT

if [ ! -f "$ROOTFS/etc/os-release" ]; then
  log "Système de base Ubuntu $SUITE ($ARCH)"
  mkdir -p "$ROOTFS"
  debootstrap --arch="$ARCH" --components=main,restricted,universe,multiverse "$SUITE" "$ROOTFS" "$MIRROR"
fi

log "Copie des composants Lucien"
STAGE="$ROOTFS/tmp/lucien"
rm -rf "$STAGE"; mkdir -p "$STAGE"
rsync -a --exclude work --exclude out --exclude .git "$REPO/" "$STAGE/"
# Plymouth ne lit que le PNG : on convertit le logo et on fabrique la barre de progression
dwebp -quiet "$REPO/assets/logo.webp" -o "$WORK/logo-full.png"
convert "$WORK/logo-full.png" -resize 512x512 "$STAGE/boot/plymouth/lucien/logo.png"
convert -size 4x5 xc:'#eeeeee' "$STAGE/boot/plymouth/lucien/barre.png"
convert -size 4x5 xc:'#333333' "$STAGE/boot/plymouth/lucien/barre-fond.png"
convert "$WORK/logo-full.png" -resize 256x256 "$STAGE/assets/logo-256.png"

log "Configuration dans le chroot ($EDITION)"
for m in dev dev/pts proc sys run; do mount --bind "/$m" "$ROOTFS/$m"; done
rm -f "$ROOTFS/etc/resolv.conf"; cp -L /etc/resolv.conf "$ROOTFS/etc/resolv.conf"
chroot "$ROOTFS" env EDITION="$EDITION" ARCH="$ARCH" VERSION="$VERSION" MIRROR="$MIRROR" SUITE="$SUITE" \
  DEBIAN_FRONTEND=noninteractive bash /tmp/lucien/build/chroot-setup.sh
rm -rf "$STAGE"
cleanup

mkdir -p "$OUT"
if [ "$EDITION" = pi5 ]; then
  bash "$HERE/mk-pi-image.sh" "$ROOTFS" "$OUT/lucien-os-$VERSION-pi5-arm64.img"
else
  bash "$HERE/mk-iso.sh" "$ROOTFS" "$WORK/iso" "$OUT/lucien-os-$VERSION-$EDITION-amd64.iso" "$EDITION"
fi
log "Terminé ✓  ($(ls -1 "$OUT" | tr '\n' ' '))"
