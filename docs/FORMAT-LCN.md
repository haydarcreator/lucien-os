# Le format de paquet `.lcn`

Un fichier `.lcn` est une archive `tar.gz` avec cette structure :

```
mon-app-1.0.0-arm64.lcn
├── lucien.json          # manifeste (obligatoire)
├── SHA256SUMS           # sommes de contrôle de fichiers/ (obligatoire)
├── fichiers/            # arborescence copiée à la racine du système
│   └── usr/
│       ├── bin/mon-app
│       └── share/applications/mon-app.desktop
└── scripts/             # optionnel
    ├── avant-installation
    └── apres-installation
```

Une signature GPG détachée peut accompagner le paquet : `mon-app-1.0.0-arm64.lcn.sig`.

## `lucien.json`

```json
{
  "nom": "mon-app",
  "version": "1.0.0",
  "arch": "arm64",
  "description": "Une application d'exemple",
  "auteur": "Toi <toi@exemple.org>",
  "licence": "MIT",
  "dependances": ["lsh", "deb:python3-gi"],
  "desinstallation": "rm -rf /var/lib/mon-app"
}
```

| Champ | Obligatoire | Rôle |
|---|---|---|
| `nom` | oui | identifiant unique |
| `version` | oui | version |
| `arch` | oui | `arm64` (Raspberry Pi 5), `amd64` (PC / laptop) ou `all` |
| `dependances` | non | autres `.lcn`, ou paquets Ubuntu préfixés par `deb:` |
| `desinstallation` | non | commande lancée lors de `lpm retire` |

## Différences avec `.deb`

- **Manifeste JSON** lisible au lieu de `control`.
- **Vérification obligatoire** des sommes SHA-256 de chaque fichier.
- **Analyse antivirus** automatique avant installation (Lucien Antivirus).
- **Pas de chemins dangereux** : `..`, liens durs et fichiers de périphérique sont refusés.
- **Dépendances mixtes** : un `.lcn` peut dépendre de paquets Ubuntu (`deb:…`).
- Les paquets non signés demandent une confirmation.

## Créer un paquet

```bash
lpm construis exemple/ -o mon-app.lcn
gpg --detach-sign -o mon-app.lcn.sig mon-app.lcn
sudo lpm installe mon-app.lcn
```

Voir `lpm/exemple/` pour un paquet complet.
