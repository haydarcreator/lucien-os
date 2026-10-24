#!/usr/bin/env bash
# Fabrique une image carte SD / NVMe pour Raspberry Pi 5.
#   mk-pi-image.sh <rootfs> <sortie.img>
# Partition 1 : FAT32 « system-boot » (firmware, noyau, config.txt)
# Partition 2 : ext4 « writable » (système), agrandie au premier démarrage
set -euo pipefail
ROOTFS="$1" IMG="$2"
SIZE_MB=$(( $(du -sm --exclude=boot/firmware "$ROOTFS" | cut -f1) + 1536 ))
BOOT_MB=512

rm -f "$IMG"
truncate -s "$(( SIZE_MB + BOOT_MB ))M" "$IMG"
parted -s "$IMG" mklabel msdos \
  mkpart primary fat32 1MiB "$(( BOOT_MB + 1 ))MiB" set 1 boot on \
  mkpart primary ext4 "$(( BOOT_MB + 1 ))MiB" 100%

LOOP=$(losetup --show -fP "$IMG")
MNT=$(mktemp -d)
trap 'umount -R "$MNT" 2>/dev/null || true; losetup -d "$LOOP"' EXIT
mkfs.vfat -F 32 -n system-boot "${LOOP}p1"
mkfs.ext4 -q -L writable "${LOOP}p2"

mount "${LOOP}p2" "$MNT"
rsync -aHAX --exclude boot/firmware "$ROOTFS/" "$MNT/"
mkdir -p "$MNT/boot/firmware"
mount "${LOOP}p1" "$MNT/boot/firmware"

# Firmware, noyau et arbres de périphériques
KVER=$(ls -1 "$ROOTFS/lib/modules" | sort -V | tail -1)
cp -r "$ROOTFS"/usr/lib/linux-firmware-raspi/* "$MNT/boot/firmware/"
cp "$ROOTFS/boot/vmlinuz-$KVER" "$MNT/boot/firmware/vmlinuz"
cp "$ROOTFS/boot/initrd.img-$KVER" "$MNT/boot/firmware/initrd.img"
DTB="$ROOTFS/lib/firmware/$KVER/device-tree"
cp "$DTB"/broadcom/bcm2712*.dtb "$MNT/boot/firmware/"
cp -r "$DTB/overlays" "$MNT/boot/firmware/"

cat > "$MNT/boot/firmware/config.txt" <<'EOF'
# Lucien OS — Raspberry Pi 5
[all]
arm_64bit=1
kernel=vmlinuz
initramfs initrd.img followkernel
cmdline=cmdline.txt
dtoverlay=vc4-kms-v3d
max_framebuffers=2
disable_overscan=1
disable_splash=1
camera_auto_detect=1
display_auto_detect=1

[pi5]
# Active le port PCIe (SSD NVMe via HAT M.2)
dtparam=pciex1
dtparam=pciex1_gen=3
# Ventilateur actif officiel
dtparam=fan_temp0=60000
EOF
echo "console=tty1 root=LABEL=writable rootfstype=ext4 rootwait fixrtc quiet splash plymouth.ignore-serial-consoles" > "$MNT/boot/firmware/cmdline.txt"

cat > "$MNT/etc/fstab" <<'EOF'
LABEL=writable     /               ext4  defaults,noatime  0 1
LABEL=system-boot  /boot/firmware  vfat  defaults          0 1
EOF

umount -R "$MNT"; rmdir "$MNT"
losetup -d "$LOOP"; trap - EXIT
xz -T0 -9 -f "$IMG"
sha256sum "$IMG.xz" > "$IMG.xz.sha256"
echo "Image : $IMG.xz  (à écrire avec Raspberry Pi Imager → « Use custom »)"
