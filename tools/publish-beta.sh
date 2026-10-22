#!/bin/sh
# Publie la branche « dev » en VERSION DE TEST : https://marl75.github.io/fitness-coach/beta/
# La version normale (racine du site) n'est pas touchée : seul le dossier beta/ de main change.
# La version de test tourne sur des données de démo (?real pour utiliser son vrai compte).
# Usage : depuis la branche dev, tout commité :  tools/publish-beta.sh
set -e
ROOT=$(git rev-parse --show-toplevel)
cd "$ROOT"
[ "$(git rev-parse --abbrev-ref HEAD)" = "dev" ] || { echo "À lancer depuis la branche dev."; exit 1; }
[ -z "$(git status --porcelain)" ] || { echo "Commite d'abord tes changements."; exit 1; }
git fetch -q origin
TMP=$(mktemp -d)
git worktree add -q "$TMP/main" origin/main -B main-beta-publish
trap 'cd "$ROOT"; git worktree remove --force "$TMP/main"; git branch -q -D main-beta-publish 2>/dev/null; rm -rf "$TMP"' EXIT
rm -rf "$TMP/main/beta" && mkdir "$TMP/main/beta"
git archive HEAD -- index.html privacy-policy.html manifest.json sw.js css js tests icon-*.png | tar -x -C "$TMP/main/beta"
B="$TMP/main/beta"
# Marquer la version de test : drapeau, bandeau, nom, copies hors connexion à part
perl -0pi -e 's#<script src="js/config\.js#<script>window.BETA = true;</script>\n<script src="js/config.js#' "$B/index.html"
perl -0pi -e 's#<body>#<body>\n<div class="beta-bar">Version de test · données de démo</div>#' "$B/index.html"
perl -0pi -e 's#<title>Routine</title>#<title>Routine (test)</title>#' "$B/index.html"
perl -0pi -e 's#"name": "Routine"#"name": "Routine (test)"#; s#"short_name": "Routine"#"short_name": "Routine test"#' "$B/manifest.json"
perl -0pi -e "s#const CACHE = 'fitcoach-#const CACHE = 'fitcoach-beta-#" "$B/sw.js"
"$ROOT/tools/bump-version.sh" "$B" >/dev/null
cd "$TMP/main"
git add -A beta
git commit -q -m "Version de test : $(git -C "$ROOT" log -1 --format=%s dev)" || { echo "Rien de nouveau."; exit 0; }
git push -q origin HEAD:main
echo "Version de test publiée : https://marl75.github.io/fitness-coach/beta/"
