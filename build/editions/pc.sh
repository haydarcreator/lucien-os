# Réglages propres au PC de bureau (sourcé par chroot-setup.sh)
. /tmp/lucien/build/editions/installateur.sh

# Pas de mise en veille automatique sur secteur
cat > /usr/share/glib-2.0/schemas/91_lucien-pc.gschema.override <<'EOF'

[org.gnome.settings-daemon.plugins.power]
sleep-inactive-ac-type='nothing'
EOF
glib-compile-schemas /usr/share/glib-2.0/schemas
