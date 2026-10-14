// ===== TEST DE NON-RÉGRESSION (mode démo uniquement) =====
// Ouvrir l'appli avec ?demo&smoke : parcourt tous les écrans et toutes les actions,
// puis affiche le résultat (et le met dans window.SMOKE_RESULT).
// Ne touche jamais aux vraies données : refuse de tourner hors du mode démo.
(async () => {
  if (!DEMO) { console.error('Test refusé : uniquement en mode démo (?demo).'); return; }
  const wait = (ms = 120) => new Promise(r => setTimeout(r, ms));
  const results = [];
  const errors = [];
  window.addEventListener('error', e => errors.push(String(e.message)));
  window.addEventListener('unhandledrejection', e => errors.push(String(e.reason)));
  window.confirm = () => true; // pas de boîte de dialogue pendant le test
  const ok = (cond, msg) => { if (!cond) throw new Error(msg); };
  async function step(name, fn) {
    try { await fn(); results.push({ name, ok: true }); }
    catch (e) { results.push({ name, ok: false, err: e.message }); }
  }
  const today = () => sessionOf(isoDate()) || { entries: [] };
  const entryOf = exId => today().entries.find(e => e.exId === exId);

  await step('Connexion démo', async () => {
    if (!Data.user) await Backend.login('test@exemple.test');
    await wait(300);
    ok(Data.user, 'pas connecté');
  });
  await step('État de départ', async () => {
    savePrefs({ goals: { pecs: 'up', lats: 'up', upperback: 'up', traps: 'down' }, routines: [], repTargets: {}, favorites: ['dev-couche'] });
    saveSession({ id: isoDate(), entries: [] });
    UI.date = isoDate(); setTab('today'); await wait();
    ok($('.empty'), 'écran d’accueil absent');
  });
  await step('Ajouter un exercice de muscu', async () => {
    pickExercise('dev-couche'); await wait(200);
    ok(entryOf('dev-couche'), 'exercice non ajouté');
    ok($('.now .sets-grid'), 'tableau des séries absent');
    ok($('.toast button'), 'bouton Annuler absent');
  });
  await step('Annuler un ajout', async () => {
    $('.toast button').click(); await wait(200);
    ok(!entryOf('dev-couche'), 'ajout non annulé');
    closeSheet(); await wait(100);
    pickExercise('dev-couche'); await wait(200);
  });
  await step('Séries : répétitions, coches, réglage précis', async () => {
    const e = entryOf('dev-couche');
    stepSetReps(e.id, 0, 1); await wait();
    const reps0 = entryOf('dev-couche').sets[0].reps;
    e.sets.forEach((_, k) => finishSetAt(e.id, k)); await wait();
    ok(!isPending(entryOf('dev-couche')), 'séries pas toutes faites');
    openSet(e.id, 0); setWeight('12,75'); saveSet(); await wait(200);
    const s0 = entryOf('dev-couche').sets[0];
    ok(s0.weight === 12.75 && s0.reps === reps0 && s0.done, 'réglage précis incorrect');
    undoSet(e.id, 2); await wait(); ok(isPending(entryOf('dev-couche')), 'annulation de coche ratée');
    finishSetAt(e.id, 2); await wait();
  });
  await step('Cardio : carte en cours et « C’est fait »', async () => {
    pickExercise('marche-inclinee'); await wait(200);
    const c = entryOf('marche-inclinee');
    ok(c && c.pending, 'cardio pas « en cours »');
    ok($('.now .fgrid'), 'réglages du cardio absents');
    stepEntryField(c.id, 'incline', 1); setEntryField(c.id, 'speed', '5,5'); await wait();
    ok(entryOf('marche-inclinee').speed === 5.5, 'vitesse non enregistrée');
    finishCardio(c.id); await wait();
    ok(entryDone(entryOf('marche-inclinee')), 'cardio non terminé');
  });
  await step('Précisions cardio (éditeur) sans perdre l’état', async () => {
    const c = entryOf('marche-inclinee');
    openEntry(c.id); ok($('#editor-body'), 'éditeur absent');
    saveDraft(); await wait(200);
    ok(entryDone(entryOf('marche-inclinee')), 'état perdu à l’enregistrement');
  });
  await step('Précisions muscu : réglages et objectif de répétitions', async () => {
    const e = entryOf('dev-couche');
    openEntry(e.id); ok($('#setup-box') && $('#rep-target'), 'panneau incomplet');
    toggleSetup('machine'); stepRepTarget('dev-couche', 0, 0); await wait();
    saveEntryDetails(e.id); await wait(200);
    ok(entryOf('dev-couche').setup && entryOf('dev-couche').setup.machine, 'réglage non enregistré');
    ok(repTarget('dev-couche'), 'objectif non enregistré');
  });
  await step('Fiche « Bien faire » et objectif à ménager', async () => {
    openTips('lateral'); await wait();
    ok(document.querySelectorAll('#sheet .tip-line').length > 0, 'conseils absents');
    ok($('#sheet .tips-goal'), 'encadré trapèzes absent');
    closeTips(); await wait();
  });
  await step('Enregistrer comme routine', async () => {
    setTab('today'); await wait();
    ok(document.querySelector('[onclick="openSaveRoutine()"]'), 'lien absent');
    openSaveRoutine(); $('#routine-name').value = 'Test séance'; saveRoutineFromDraft(); await wait(200);
    ok(routines().some(r => r.name === 'Test séance' && r.items.length === 2), 'routine non enregistrée');
  });
  await step('Créer une routine depuis Mon compte', async () => {
    openRoutines(); openRoutineEditor();
    UI.rDraft.name = 'Test compte'; rdAdd('squat'); rdAdd('hipthrust'); rdMove(1, -1); saveRoutineDraft(); await wait(200);
    const r = routines().find(x => x.name === 'Test compte');
    ok(r && r.items[0] === 'hipthrust', 'routine du compte incorrecte');
    closeSheet(); await wait();
  });
  await step('Lancer une routine', async () => {
    saveSession({ id: isoDate(), entries: [] }); render(); await wait();
    ok(document.querySelectorAll('.routine').length >= 2, 'routines absentes de l’accueil');
    launchRoutine(routines().find(x => x.name === 'Test séance').id); await wait(250);
    ok(today().entries.length === 2 && today().routine, 'routine mal lancée');
    ok($('.eyebrow').textContent.includes('Test séance'), 'nom de routine absent');
  });
  await step('Retirer l’exercice en cours puis annuler', async () => {
    const cur = today().entries.find(isPending);
    removeCurrent(cur.id); await wait();
    ok(!today().entries.some(e => e.id === cur.id), 'non retiré');
    $('.toast button').click(); await wait();
    ok(today().entries.some(e => e.id === cur.id), 'non restauré');
  });
  await step('Progression avec objectif de répétitions', async () => {
    const y = isoDate(addDays(new Date(), -1));
    saveSession({ id: y, entries: [{ id: 'sm1', exId: 'row-haltere', name: 'Rowing haltère', kind: 'sets', note: '', sets: [0, 1, 2].map(() => ({ reps: 12, weight: 10, done: true })) }] });
    savePrefs({ repTargets: { 'row-haltere': [8, 12] } }); await wait();
    const p = progressionFor('row-haltere', isoDate());
    ok(p && p.lo > 10 && p.target, 'progression non proposée');
  });
  await step('Liste des exercices', async () => {
    openPicker(); setFilter('upper'); await wait();
    ok(document.querySelectorAll('#picker-list .pick').length > 5, 'liste vide');
    ok($('#picker-list .tag.ok'), 'étiquette objectif absente');
    UI.search = 'bench'; renderPickerList();
    ok([...document.querySelectorAll('#picker-list .pick-name')].some(n => n.textContent.includes('Développé couché')), 'recherche anglaise ratée');
    UI.search = ''; ok(pickerFilters().some(f => f.id === 'goals'), 'filtre objectifs absent');
    closeSheet(); await wait();
  });
  await step('Créer un exercice et une variante', async () => {
    UI.search = 'Test exo unique'; openCreate(); createExercise(); await wait(200);
    ok(Data.exercises.some(e => e.name === 'Test exo unique'), 'exercice non créé');
    openVariant('marche-inclinee'); createExercise(); await wait(200);
    ok(Data.exercises.some(e => e.variantOf === 'marche-inclinee'), 'variante non créée');
    closeSheet(); await wait();
  });
  await step('Suivi : bilan, muscle, exercices', async () => {
    setTab('track'); await wait();
    ok(document.querySelectorAll('.mrow').length > 0 && $('.cardio-line'), 'bilan incomplet');
    openMuscle('glutes'); ok($('#sheet .pick'), 'exercices du muscle absents');
    openExerciseList(); ok($('#sheet .ex-list'), 'liste par exercice absente');
    openExercise('dev-couche'); ok($('#sheet .history'), 'historique absent');
    closeSheet(); await wait();
  });
  await step('Mon compte : pseudo, objectifs, exercices créés', async () => {
    openMenu(); ok($('#pseudo-input'), 'pseudo absent');
    savePseudo('Testeur'); await wait(); ok(pseudo() === 'Testeur', 'pseudo non enregistré');
    openGoals(); ok(document.querySelectorAll('.goal-line').length === MUSCLES.length, 'objectifs incomplets');
    openMyExercises(); ok($('#my-ex'), 'exercices créés absents');
    closeSheet(); await wait();
  });
  await step('Autre jour', async () => {
    setTab('today'); await wait();
    const b = $('.date-chip'); if (b) { openDayPicker(); ok($('.cal-grid'), 'calendrier absent'); closeSheet(); }
    await wait();
  });
  await step('Anglais', async () => {
    toggleLanguage(); await wait();
    setTab('today'); openPicker(); setFilter('upper');
    ok([...document.querySelectorAll('#picker-list .pick-name')].some(n => n.textContent.includes('Bench press')), 'noms anglais absents');
    closeSheet(); toggleLanguage(); closeSheet(); await wait();
  });
  await step('Statistiques : rien en démo, calcul de l’activité', async () => {
    await recordVisit(); ok(!usageRecorded, 'le suivi ne doit pas tourner en démo');
    const a = activityByMonth([{ id: '2026-03-02', entries: [
      { kind: 'sets', sets: [{ reps: 10, weight: 5, done: true }, { reps: 8, weight: 5, done: true }, { reps: 8, weight: 5, done: false }] },
      { kind: 'cardio', duration: 30 }, { kind: 'cardio', duration: 15, pending: true }] }]);
    const m = a['2026-03'];
    ok(m && m.days === 1 && m.exercises === 2 && m.sets === 2 && m.cardioMin === 30, 'activité mal calculée : ' + JSON.stringify(m));
  });
  await step('Lien confidentialité', async () => {
    openMenu(); ok($('#sheet a.privacy-link'), 'lien absent du compte'); closeSheet(); await wait();
  });
  await step('Aucune erreur JavaScript', async () => { ok(!errors.length, errors.join(' | ')); });

  const failed = results.filter(r => !r.ok);
  window.SMOKE_RESULT = { passed: results.length - failed.length, total: results.length, failed };
  const box = document.createElement('div');
  box.style.cssText = 'position:fixed;inset:auto 8px 90px 8px;z-index:99;padding:12px 14px;border-radius:14px;font:14px/1.4 sans-serif;background:' + (failed.length ? '#FF8A7A' : '#8FE3C0') + ';color:#0F1115;max-height:50vh;overflow:auto';
  box.innerHTML = `<b>Test : ${results.length - failed.length} / ${results.length} OK</b>` + failed.map(f => `<div>✗ ${esc(f.name)} : ${esc(f.err)}</div>`).join('');
  document.body.appendChild(box);
  console.log('SMOKE', JSON.stringify(window.SMOKE_RESULT));
})();
