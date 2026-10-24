<p align="center"><img src="assets/logo.webp" width="180" alt="Logo Lucien OS"></p>

<h1 align="center">Lucien OS</h1>
<p align="center">Élégant comme macOS, libre comme Linux.<br>Pour <b>Raspberry Pi 5</b>, <b>PC de bureau</b> et <b>laptop</b>.</p>

---

## Essayer la démo

**Site officiel : https://lucienos.web.app** — nouveautés, [conditions d'utilisation](conditions.html), [politique de confidentialité](confidentialite.html) et la démo à tester directement (aussi sur [`demo/`](demo/index.html)).

Le site est hébergé sur Firebase Hosting (projet `lucienos`). Pour le mettre à jour : `firebase deploy --only hosting`. GitHub Pages en publie aussi une copie à chaque push sur `main`.

La démo reproduit tout le système dans le navigateur :

| Partie | Ce qu'on peut faire |
|---|---|
| Démarrage | Écran de démarrage avec le logo, journal de boot, écran de connexion, veille, redémarrage, extinction |
| Bureau | Barre de menus, Dock avec effet loupe, Launchpad (F4), recherche (Ctrl + Espace), centre de contrôle, notifications |
| Clic droit | Nouveau dossier, nouveau document (texte, Lucien Texte, Tableur, Présentation, script), importer des fichiers, renommer, dupliquer, copier/coller, informations, corbeille. Glisser-déposer des vrais fichiers sur le bureau ou dans Fichiers |
| Fichiers | Navigation, favoris, vue icônes ou liste, recherche, corbeille avec restauration |
| Lucien Shell | Terminal avec commandes en français (`aide`, `liste`, `va`, `montre`, `lpm`, `scan`, `lucienfetch`…) |
| Lucien Browser | Onglets, page d'accueil privée, bloqueur de pistes |
| Lucien Office | Accueil Office, **Lucien Carnet**, **Lucien Tâches**, **Lucien Formulaires**, **Lucien Texte** (suivi des modifications, commentaires, dictée, export .docx), **Lucien Tableur** (recopie, mise en forme conditionnelle, filtres, 80+ fonctions), **Lucien Présentation** (mode présentateur, laser) : ruban (Accueil, Insertion, Création, Mise en page, Références, Formules, Données, Transitions, Animations, Diaporama, Révision, Affichage), menu Fichier (Nouveau, Ouvrir, Enregistrer, Imprimer, Exporter), modèles |
| Lucien Calculator | 8 modes dont graphiques, équations avec étapes, statistiques et géométrie |
| Lucien Code | Éditeur de code avec terminal, aperçu HTML et console |
| Lucien Antivirus | Analyse rapide/complète, quarantaine, temps réel, pare-feu, mises à jour |
| Lucien Store | Paquets `.lcn` (Lucien) et `.deb` (Ubuntu) |
| Paramètres | Wi-Fi, Bluetooth, son, apparence, fond d'écran, **toutes les langues (ISO 639-1) et toutes les régions du monde (249 pays et territoires)**, fuseaux horaires, calendriers, chiffres, claviers, démarrage, édition matérielle… |

Les fichiers créés dans la démo sont gardés dans le navigateur (`localStorage`).

## Les trois éditions

| Édition | Architecture | Image | Particularités |
|---|---|---|---|
| Raspberry Pi 5 | arm64 | `.img.xz` (carte SD / SSD NVMe) | `linux-raspi`, PCIe NVMe activé, ventilateur, zram, partition agrandie au 1er démarrage |
| PC de bureau | amd64 | `.iso` live + installateur | pilotes Mesa/Vulkan, GameMode, pas de veille sur secteur |
| Laptop | amd64 | `.iso` live + installateur | noyau HWE, TLP (charge limitée à 80 %), gestes du pavé tactile, lecteur d'empreintes |

Toutes sont basées sur **Ubuntu 24.04 LTS** avec GNOME habillé façon macOS (thème WhiteSur, Dock en bas, boutons de fenêtre à gauche).

## Construire une image

Sur une machine Ubuntu 24.04 (environ 25 Go libres) :

```bash
sudo ./build/build.sh pi5
```

```bash
sudo ./build/build.sh pc
```

```bash
sudo ./build/build.sh laptop
```

Les images arrivent dans `out/`. Le workflow `.github/workflows/build.yml` construit les trois éditions et les joint à une release quand on pousse un tag `v*`.

- **Raspberry Pi 5** : écris `out/lucien-os-1.0-pi5-arm64.img.xz` avec Raspberry Pi Imager (« Use custom »). Identifiant : `lucien`, mot de passe : `lucien` (à changer au premier démarrage).
- **PC / laptop** : écris l'ISO sur une clé USB (balenaEtcher, Raspberry Pi Imager ou `dd`), démarre dessus, puis lance « Installer Lucien OS » (Calamares).

## Deux systèmes d'installation : `.deb` et `.lcn`

`lpm` installe les deux formats :

```bash
sudo lpm installe vlc_3.0.20_arm64.deb
```

```bash
sudo lpm installe dessin-2.1.lcn
```

Le format `.lcn` est décrit dans [docs/FORMAT-LCN.md](docs/FORMAT-LCN.md) : manifeste JSON, sommes SHA-256 obligatoires, signature GPG, analyse antivirus avant installation, dépendances vers des paquets Ubuntu (`deb:…`). Pour en créer un : `lpm construis lpm/exemple -o bonjour.lcn`.

## Lucien Shell (`lsh`)

```text
lucien ~ ❯ soit nom = Lucien
lucien ~ ❯ dis Bonjour $nom
Bonjour Lucien
lucien ~ ❯ liste ~/Documents | filtre rapport | compte
1
lucien ~ ❯ essaie lpm maj sinon dis "pas de réseau"
```

Commandes en français (`liste`, `va`, `ici`, `montre`, `dis`, `cree`, `dossier`, `jette`), les noms Linux marchent aussi. Toute autre commande lance le programme Linux normal. Configuration : `~/.lshrc`.

## Lucien Office

Sur le vrai système, Lucien Office est LibreOffice configuré avec l'interface en ruban et les formats `.docx`, `.xlsx`, `.pptx` par défaut, présenté sous les noms Lucien Texte, Lucien Tableur et Lucien Présentation (`office/`).

## Lucien Calculator

Une calculatrice faite pour apprendre : Standard, Scientifique (fractions et valeurs exactes comme 2√2 ou π/2), Programmeur (hexadécimal, binaire, bits), **Graphiques** (curseurs a, b, c, racines, extremums, intersections, dérivée, aire, tableau de valeurs), **Équations** avec les étapes (1er et 2nd degré, systèmes 2×2 et 3×3, équation libre), **Statistiques** (quartiles, écart-type, histogramme, boîte à moustaches, régression), **Géométrie** (14 figures) et Conversions (13 catégories).

## Lucien Code

Un éditeur de code façon Visual Studio Code, sans magasin d'extensions : explorateur, onglets, coloration de 12 langages, minicarte, palette de commandes (Ctrl+Maj+P), ouverture rapide (Ctrl+P), recherche et remplacement dans les fichiers, terminal Lucien Shell intégré, aperçu HTML en direct (F5), console JavaScript, problèmes, contrôle de version.

Sur le système installé, Calculator, Code, Carnet, Tâches et Formulaires s'ouvrent dans leur propre fenêtre avec `lucien-webapp` (même code que la démo).

## Lucien Browser et Lucien Antivirus

- `browser/lucien-browser.py` : navigateur GTK + WebKitGTK, onglets, navigation privée, bloqueur de pistes, téléchargements analysés.
- `antivirus/lucien-av.py` : empreintes SHA-256, règles heuristiques (double extension, binaire Windows déguisé, mineurs, reverse shells…), ClamAV, quarantaine, surveillance en temps réel (`lucien-av surveille`, service systemd utilisateur).

## Structure du dépôt

```text
index.html, *.html     site (accueil, nouveautés, conditions, confidentialité)
demo/, css/, js/       démo web
assets/                 logo et fonds d'écran
lsh/                    Lucien Shell
lpm/                    gestionnaire de paquets (.lcn + .deb) et paquet d'exemple
browser/                Lucien Browser
antivirus/              Lucien Antivirus + service systemd
settings/               réglages par défaut GNOME + outil lucien-settings
office/                 Lucien Office (LibreOffice habillé)
boot/plymouth/          écran de démarrage
build/                  construction des images Pi 5, PC, laptop + installateur
docs/                   format .lcn
tests/                  tests rapides des outils
```

## Tests

```bash
bash tests/run.sh
```

## Licence

MIT. Lucien OS est basé sur Ubuntu, GNOME, LibreOffice, ClamAV et WhiteSur, chacun sous sa propre licence.
