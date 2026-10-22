#!/bin/sh
# Change le numéro de version partout d'un coup (adresses ?v= de index.html et cache du service worker),
# pour que les téléphones rechargent bien la nouvelle version. À lancer avant chaque publication.
# Usage : tools/bump-version.sh [dossier]   (par défaut : la racine du dépôt)
set -e
DIR="${1:-$(cd "$(dirname "$0")/.." && pwd)}"
V=$(date +%Y%m%d%H%M%S)
sed -i.bak -E "s/\?v=[0-9]+/?v=$V/g" "$DIR/index.html"
sed -i.bak -E "s/const CACHE = 'fitcoach-(beta-)?[^']*'/const CACHE = 'fitcoach-\1$V'/" "$DIR/sw.js"
rm -f "$DIR/index.html.bak" "$DIR/sw.js.bak"
echo "Version $V"
