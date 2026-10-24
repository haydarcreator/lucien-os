# Réglages propres au laptop (sourcé par chroot-setup.sh)
. /tmp/lucien/build/editions/installateur.sh

# Autonomie : TLP remplace power-profiles-daemon
apt-get purge -y power-profiles-daemon 2>/dev/null || true
systemctl enable tlp.service
sed -i 's/^#\?START_CHARGE_THRESH_BAT0=.*/START_CHARGE_THRESH_BAT0=75/; s/^#\?STOP_CHARGE_THRESH_BAT0=.*/STOP_CHARGE_THRESH_BAT0=80/' /etc/tlp.conf

# Gestes du pavé tactile façon macOS (3 doigts = vue d'ensemble, 4 doigts = bureaux)
systemctl enable touchegg.service

cat > /usr/share/glib-2.0/schemas/91_lucien-laptop.gschema.override <<'EOF'
[org.gnome.desktop.interface]
show-battery-percentage=true

[org.gnome.settings-daemon.plugins.power]
sleep-inactive-battery-timeout=900
idle-dim=true
EOF
glib-compile-schemas /usr/share/glib-2.0/schemas
