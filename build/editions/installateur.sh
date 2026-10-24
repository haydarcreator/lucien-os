# Installateur graphique de Lucien OS (Calamares habillé Lucien) — PC et laptop
C=/etc/calamares
mkdir -p $C/modules $C/branding/lucien
cp /usr/share/lucien/logo.webp $C/branding/lucien/
cp /usr/share/icons/hicolor/256x256/apps/lucien.png $C/branding/lucien/logo.png

cat > $C/settings.conf <<'EOF'
modules-search: [ local, /usr/lib/x86_64-linux-gnu/calamares/modules ]
sequence:
  - show: [ welcome, locale, keyboard, partition, users, summary ]
  - exec: [ partition, mount, unpackfs, machineid, fstab, locale, keyboard, localecfg,
            users, displaymanager, networkcfg, hwclock, services-systemd,
            packages, initramfs, grubcfg, bootloader, umount ]
  - show: [ finished ]
branding: lucien
prompt-install: true
dont-chroot: false
EOF

cat > $C/branding/lucien/branding.desc <<'EOF'
---
componentName: lucien
welcomeStyleCalamares: true
strings:
  productName: Lucien OS
  shortProductName: Lucien
  version: "1.0"
  shortVersion: "1.0"
  versionedName: Lucien OS 1.0
  shortVersionedName: Lucien 1.0
  bootloaderEntryName: Lucien OS
  productUrl: https://github.com/lucien-os/lucien-os
  supportUrl: https://github.com/lucien-os/lucien-os/issues
images:
  productLogo: logo.png
  productIcon: logo.png
  productWelcome: logo.png
slideshow: show.qml
style:
  SidebarBackground: "#1d1a16"
  SidebarText: "#f3eee7"
  SidebarTextCurrent: "#d08a3c"
  SidebarBackgroundCurrent: "#2a2622"
EOF
cat > $C/branding/lucien/show.qml <<'EOF'
import QtQuick 2.0;
import calamares.slideshow 1.0;
Presentation {
  Slide { Text { anchors.centerIn: parent; text: "Bienvenue dans Lucien OS\nÉlégant comme macOS, libre comme Linux."; font.pixelSize: 22; horizontalAlignment: Text.AlignHCenter } }
  Slide { Text { anchors.centerIn: parent; text: "Installe des paquets .lcn et .deb\navec Lucien Store ou « lpm installe »."; font.pixelSize: 22; horizontalAlignment: Text.AlignHCenter } }
  Slide { Text { anchors.centerIn: parent; text: "Lucien Shell, Lucien Browser et Lucien Antivirus\nsont déjà prêts."; font.pixelSize: 22; horizontalAlignment: Text.AlignHCenter } }
}
EOF

cat > $C/modules/unpackfs.conf <<'EOF'
unpack:
  - source: "/cdrom/casper/filesystem.squashfs"
    sourcefs: "squashfs"
    destination: ""
EOF
cat > $C/modules/users.conf <<'EOF'
defaultGroups: [ sudo, adm, audio, video, plugdev, netdev, lpadmin ]
autologinGroup: autologin
sudoersGroup: sudo
setRootPassword: false
user:
  shell: /usr/bin/lsh
EOF
cat > $C/modules/displaymanager.conf <<'EOF'
displaymanagers: [ gdm ]
basicSetup: false
EOF
cat > $C/modules/packages.conf <<'EOF'
backend: apt
operations:
  - remove: [ calamares, casper ]
EOF
cat > $C/modules/bootloader.conf <<'EOF'
efiBootLoader: "grub"
grubInstall: "grub-install"
grubMkconfig: "grub-mkconfig"
grubCfg: "/boot/grub/grub.cfg"
grubProbe: "grub-probe"
efiBootMgr: "efibootmgr"
efiBootloaderId: "lucien"
installEFIFallback: true
EOF
cat > $C/modules/partition.conf <<'EOF'
efiSystemPartition: "/boot/efi"
efiSystemPartitionSize: 512M
userSwapChoices: [ none, file ]
initialSwapChoice: file
defaultFileSystemType: "ext4"
availableFileSystemTypes: [ ext4, btrfs, xfs ]
enableLuksAutomatedPartitioning: true
EOF
cat > $C/modules/welcome.conf <<'EOF'
showSupportUrl: true
showReleaseNotesUrl: false
requirements:
  requiredStorage: 20
  requiredRam: 2.0
  check: [ storage, ram, power, internet, root ]
  required: [ storage, ram, root ]
EOF

# Raccourci « Installer Lucien OS » sur le bureau de la session live
cat > /usr/share/applications/lucien-installer.desktop <<'EOF'
[Desktop Entry]
Name=Installer Lucien OS
Exec=pkexec calamares
Icon=lucien
Type=Application
Categories=System;
EOF
