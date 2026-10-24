# Réglages propres au Raspberry Pi 5 (sourcé par chroot-setup.sh)

# Pas d'installateur : l'image s'écrit directement sur la carte SD / le SSD.
# Premier démarrage : utilisateur « lucien », mot de passe « lucien », à changer immédiatement.
useradd -m -s /usr/bin/lsh -G sudo,video,audio,plugdev,netdev,bluetooth,input lucien
echo 'lucien:lucien' | chpasswd
chage -d 0 lucien

# Agrandir la partition système au premier démarrage
cat > /usr/lib/systemd/system/lucien-agrandir.service <<'EOF'
[Unit]
Description=Lucien OS : agrandir la partition au premier démarrage
ConditionPathExists=!/var/lib/lucien/agrandi
[Service]
Type=oneshot
ExecStart=/bin/sh -c 'dev=$(findmnt -no SOURCE /); disk=/dev/$(lsblk -no PKNAME $dev); growpart $disk 2 && resize2fs $dev; mkdir -p /var/lib/lucien; touch /var/lib/lucien/agrandi'
[Install]
WantedBy=multi-user.target
EOF
apt-get install -y cloud-guest-utils
systemctl enable lucien-agrandir.service

# Mémoire compressée (zram) pour les modèles 4 Go
apt-get install -y zram-tools
echo -e "ALGO=zstd\nPERCENT=50" > /etc/default/zramswap
