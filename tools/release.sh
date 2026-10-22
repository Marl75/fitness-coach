#!/bin/sh
# Passe la version de test (branche dev) en VERSION NORMALE pour tout le monde.
# À lancer seulement après avoir vérifié la version de test (et ?demo&smoke : tout doit être OK).
# Usage : depuis la branche dev, tout commité :  tools/release.sh
set -e
ROOT=$(git rev-parse --show-toplevel)
cd "$ROOT"
[ "$(git rev-parse --abbrev-ref HEAD)" = "dev" ] || { echo "À lancer depuis la branche dev."; exit 1; }
[ -z "$(git status --porcelain)" ] || { echo "Commite d'abord tes changements."; exit 1; }
git fetch -q origin
git checkout -q main && git merge -q --ff-only origin/main
git merge -q --no-edit dev
tools/bump-version.sh >/dev/null
git commit -q -am "Mise en ligne de la version de test"
git push -q origin main
git checkout -q dev && git merge -q --ff-only main
git push -q origin dev
echo "En ligne pour tout le monde : https://marl75.github.io/fitness-coach/"
