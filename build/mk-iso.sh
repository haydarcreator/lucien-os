#!/usr/bin/env bash
# Fabrique une ISO live amorçable (BIOS + UEFI) à partir du rootfs.
#   mk-iso.sh <rootfs> <dossier-iso> <sortie.iso> <edition>
set -euo pipefail
ROOTFS="$1" ISO="$2" OUT="$3" EDITION="$4"

rm -rf "$ISO"; mkdir -p "$ISO/casper" "$ISO/boot/grub"
cp "$(ls -1 "$ROOTFS"/boot/vmlinuz-* | sort -V | tail -1)" "$ISO/casper/vmlinuz"
cp "$(ls -1 "$ROOTFS"/boot/initrd.img-* | sort -V | tail -1)" "$ISO/casper/initrd"

mksquashfs "$ROOTFS" "$ISO/casper/filesystem.squashfs" -comp zstd -Xcompression-level 19 -noappend -e boot/efi
du -sx --block-size=1 "$ROOTFS" | cut -f1 > "$ISO/casper/filesystem.size"
chroot "$ROOTFS" dpkg-query -W --showformat='${Package} ${Version}\n' > "$ISO/casper/filesystem.manifest"

mkdir -p "$ISO/.disk"
echo "Lucien OS 1.0 $EDITION amd64" > "$ISO/.disk/info"

cat > "$ISO/boot/grub/grub.cfg" <<'EOF'
set timeout=5
set default=0
insmod all_video
set color_normal=light-gray/black
set color_highlight=white/dark-gray

menuentry "Essayer ou installer Lucien OS" {
  linux /casper/vmlinuz boot=casper username=lucien hostname=lucien quiet splash ---
  initrd /casper/initrd
}
menuentry "Lucien OS (mode sans échec graphique)" {
  linux /casper/vmlinuz boot=casper username=lucien hostname=lucien nomodeset ---
  initrd /casper/initrd
}
menuentry "Vérifier le support" {
  linux /casper/vmlinuz boot=casper integrity-check quiet splash ---
  initrd /casper/initrd
}
menuentry "Paramètres du firmware UEFI" { fwsetup }
EOF

grub-mkrescue -o "$OUT" "$ISO" -- -volid "LUCIEN_OS"
sha256sum "$OUT" > "$OUT.sha256"
echo "ISO : $OUT"
