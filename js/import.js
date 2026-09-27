// ===== IMPORT DE L'ANCIENNE FITCOACH =====
// Lit le fichier de sauvegarde JSONBin ({ users: { code: { profiles: { id: profil } } } })
// et range chaque exercice noté dans la séance du jour correspondant.

function openImport() {
  openSheet(`
    <div class="sheet-head">
      <div><h3>Importer l’ancienne FitCoach</h3>
      <p class="muted small">Choisis le fichier de sauvegarde (FitCoach-sauvegarde-….json). Les exercices déjà importés ne sont pas ajoutés deux fois.</p></div>
      <button class="icon-btn" onclick="closeSheet()" aria-label="Fermer">${icon('close')}</button>
    </div>
    <input class="input" type="file" accept=".json,application/json" onchange="readImportFile(this.files[0])">
    <div id="import-choice"></div>`);
}

async function readImportFile(file) {
  if (!file) return;
  let json;
  try { json = JSON.parse(await file.text()); } catch (e) { toast('Ce fichier n’est pas lisible'); return; }
  const profiles = [];
  for (const user of Object.values(json.users || {})) {
    for (const p of Object.values(user.profiles || {})) {
      const logs = (p.feedback && p.feedback.logs) || [];
      if (logs.length) profiles.push({ name: p.name || 'Sans nom', logs });
    }
  }
  if (!profiles.length) { toast('Aucune séance trouvée dans ce fichier'); return; }
  window._importProfiles = profiles;
  $('#import-choice').innerHTML = `<p class="pick-group">Quel profil importer ?</p>` + profiles.map((p, i) =>
    `<button class="btn-line" style="margin-bottom:8px" onclick="runImport(${i})">${esc(p.name)} — ${plural(p.logs.length, 'exercice')}</button>`).join('');
}

function runImport(i) {
  const logs = window._importProfiles[i].logs.slice().sort((a, b) => String(a.id).localeCompare(String(b.id)));
  const known = new Map(allExercises().map(e => [norm(e.name), e]));
  const byDate = {};
  for (const log of logs) {
    if (!log.date || !log.exName) continue;
    // Le type vient de ce qui a été noté à l'époque (séries ou durée)
    const kind = !log.reps && !log.weight && log.duration ? 'time' : 'sets';
    let ex = known.get(norm(log.exName));
    if (!ex) {
      ex = { id: 'c-' + norm(log.exName).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''), name: log.exName.trim(), kind, createdAt: Date.now() };
      saveCustomExercise(ex);
      known.set(norm(ex.name), ex);
    }
    const entry = { id: 'imp-' + log.id, exId: ex.id, name: ex.name, kind, note: (log.notes || '').trim() };
    if (kind === 'sets') {
      const set = { reps: numOrNull(log.reps), weight: numOrNull(log.weight) };
      entry.sets = Array.from({ length: Math.max(1, +log.sets || 1) }, () => ({ ...set }));
    } else {
      entry.duration = numOrNull(log.duration);
      entry.distance = null;
    }
    (byDate[log.date] = byDate[log.date] || []).push(entry);
  }
  let added = 0;
  for (const [date, entries] of Object.entries(byDate)) {
    const s = cloneSession(date);
    for (const e of entries) {
      if (s.entries.some(x => x.id === e.id)) continue;
      s.entries.push(e);
      added++;
    }
    saveSession(s);
  }
  closeSheet();
  toast(added ? `${plural(added, 'exercice')} importé${added > 1 ? 's' : ''}` : 'Tout était déjà importé');
}
