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

  // Le test vérifie des noms français puis anglais : il part du français et remet la langue d'origine à la fin
  const startLang = currentLang;
  if (currentLang !== 'fr') toggleLanguage();
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
  await step('Bien démarrer, présentation et onglet Réglages', async () => {
    savePrefs({ weeklyGoal: undefined, setupHidden: undefined, onboarded: undefined }); render(); await wait();
    ok($('.setup-card') && document.querySelectorAll('.setup-step').length === 3, 'carte Bien démarrer absente');
    ok($('.nav-btn[data-tab="settings"].has-dot'), 'point sur Réglages absent');
    openOnboarding(); ok($('#onboarding h3'), 'présentation absente');
    UI.ob.goal = 4; $('#onboarding .btn-accent').click(); await wait();
    ok(weeklyGoal() === 4 && UI.ob.step === 1, 'étape 1 de la présentation');
    setGoal('glutes', 'up'); await wait(); ok($('#onboarding .chip.active'), 'muscle cible non coché');
    $('#onboarding .btn-accent').click(); await wait(); ok(UI.ob.step === 2, 'étape 3 absente');
    closeSheet(); await wait();
    ok(prefs().onboarded, 'présentation pas marquée vue');
    ok(document.querySelectorAll('.setup-step.done').length === 2, 'carte non cochée au fil de l’eau');
    hideSetupCard(); await wait(); ok(!$('.setup-card'), 'carte non masquée');
    setTab('settings'); await wait();
    ok(document.querySelectorAll('#view .btn-line').length >= 5 && $('#goal-val'), 'onglet Réglages incomplet');
    changeGoal(-1); await wait(); ok(weeklyGoal() === 3, 'objectif par semaine non modifié');
    savePrefs({ goals: { pecs: 'up', lats: 'up', upperback: 'up', traps: 'down' } });
    setTab('today'); await wait();
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
    // La dernière série cochée laisse l'exercice ouvert : « Une de plus » ou « Terminer l'exercice »
    ok(isPending(entryOf('dev-couche')) && $('.now .all-done'), 'exercice fermé après la dernière série');
    addPlannedSet(e.id); await wait();
    ok(entryOf('dev-couche').sets.length === 4 && pendingIndex(entryOf('dev-couche')) === 3, '« Une de plus » ratée');
    finishSetAt(e.id, 3); await wait();
    openSet(e.id, 0); ok(document.querySelectorAll('#sheet .counter').length === 2, 'compteurs poids et répétitions absents');
    $('#weight-input').value = '12,75'; $('#weight-input').dispatchEvent(new Event('input')); saveSet(); await wait(200);
    const s0 = entryOf('dev-couche').sets[0];
    ok(s0.weight === 12.75 && s0.reps === reps0 && s0.done, 'réglage précis incorrect');
    undoSet(e.id, 2); await wait(); ok(pendingIndex(entryOf('dev-couche')) === 2, 'annulation de coche ratée');
    finishSetAt(e.id, 2); await wait();
    stopEntry(e.id); await wait();
    ok(!isPending(entryOf('dev-couche')) && entryOf('dev-couche').sets.length === 4, '« Terminer l’exercice » raté');
  });
  await step('Cardio : carte en cours et « C’est fait »', async () => {
    pickExercise('marche-inclinee'); await wait(200);
    const c = entryOf('marche-inclinee');
    ok(c && c.pending, 'cardio pas « en cours »');
    ok($('.now .fgrid'), 'réglages du cardio absents');
    stepEntryField(c.id, 'incline', 1); setEntryField(c.id, 'speed', '5,5'); await wait();
    ok(entryOf('marche-inclinee').speed === 5.5, 'vitesse non enregistrée');
    // Dernière valeur tapée puis « C'est fait » sans quitter le champ : la valeur compte et le bouton reste en place
    const input = $('.now .fgrid input'), btn = $('.now .btn-accent');
    input.focus(); input.value = '42'; input.dispatchEvent(new Event('input')); await wait();
    ok(document.body.contains(btn), 'écran redessiné pendant la saisie (appui perdu)');
    // Comme un doigt : appui (le champ perd le focus), relâché, puis le clic
    document.dispatchEvent(new Event('pointerdown')); input.blur(); document.dispatchEvent(new Event('pointerup'));
    ok(document.body.contains(btn), 'bouton remplacé avant le clic');
    btn.click(); await wait();
    const k0 = fieldsFor(c.exId, c.kind, c).filter(k => k !== 'track')[0];
    ok(entryOf('marche-inclinee')[k0] === 42, 'dernière valeur tapée perdue');
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
    ok(document.querySelectorAll('.heat-cell').length === MUSCLES.length && document.querySelectorAll('.kpi').length === 3, 'bilan incomplet');
    ok(document.querySelectorAll('.prog-line').length > 0, 'progression absente');
    openMuscle('glutes'); ok($('#sheet .pick'), 'exercices du muscle absents');
    openExerciseList(); ok($('#sheet .ex-list'), 'liste par exercice absente');
    // rowing haltère : historique créé plus haut par le test lui-même (indépendant des données déjà présentes)
    openExercise('row-haltere'); ok($('#sheet .history'), 'historique absent');
    closeSheet(); await wait();
  });
  await step('Mon compte : pseudo, objectifs, exercices créés', async () => {
    openMenu(); ok($('#pseudo-input'), 'pseudo absent');
    ok(!$('#sheet #goal-val'), 'réglages encore dans Mon compte');
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
  await step('Panneau rouvert juste après une fermeture', async () => {
    openMenu(); closeSheet(); openWeeklyGoal(); await wait(400);
    ok(!$('#sheet').classList.contains('hidden'), 'panneau refermé tout seul');
    closeSheet(); await wait(300);
  });
  await step('Jour passé laissé « en cours »', async () => {
    const d = isoDate(addDays(new Date(), -3)), old = Date.now() - 3 * 86400000;
    const before = sessionOf(d);
    Backend.put('sessions', d, { entries: [{ id: 'sm-old', exId: 'tapis', name: 'Course sur tapis', kind: 'cardio', note: '', pending: true, duration: 20 }], createdAt: old, updatedAt: old });
    goToDay(d); await wait();
    ok(!$('.now'), 'carte « en cours » sur un jour passé');
    pickExercise('curl'); await wait(200);
    ok($('.now'), 'pas de carte en cours en notant un jour passé');
    if (before) { const { id, ...doc } = before; Backend.put('sessions', d, doc); } else Backend.del('sessions', d);
    goToDay(isoDate()); await wait();
  });
  await step('Inscription : 8 caractères minimum, pas d’indication à la connexion', async () => {
    switchAuth('register');
    ok($('#auth-password').placeholder === t('passwordPh'), 'consigne absente à l’inscription');
    $('#auth-email').value = 'nouveau@exemple.test'; $('#auth-password').value = 'abc1234';
    await submitAuth({ preventDefault() {} });
    ok(!$('#auth-msg').classList.contains('hidden') && $('#auth-msg').textContent === t('auth/weak-password'), 'mot de passe de 7 caractères accepté');
    switchAuth('login');
    ok($('#auth-password').placeholder === t('passwordPhLogin'), 'consigne des 8 caractères affichée à la connexion');
    $('#auth-password').value = ''; $('#auth-email').value = '';
  });
  await step('Démo : bandeau, compte, quitter', async () => {
    ok(window.BETA || !$('#demo-bar').classList.contains('hidden'), 'bandeau démo absent');
    openMenu(); ok($('#sheet').textContent.includes(t('leaveDemo')) && $('#sheet').textContent.includes(t('demoAccount')), 'compte de démo mal affiché');
    closeSheet(); await wait();
    const d = demoData();
    ok(Object.keys(d.sessions).length > 20 && !d.sessions[isoDate()] && d.settings.prefs.routines.length === 2, 'données d’exemple incomplètes');
  });
  await step('Lien confidentialité', async () => {
    openMenu(); ok($('#sheet a.privacy-link'), 'lien absent du compte'); closeSheet(); await wait();
  });
  await step('Aucune erreur JavaScript', async () => { ok(!errors.length, errors.join(' | ')); });

  if (currentLang !== startLang) toggleLanguage();
  const failed = results.filter(r => !r.ok);
  window.SMOKE_RESULT = { passed: results.length - failed.length, total: results.length, failed };
  const box = document.createElement('div');
  box.style.cssText = 'position:fixed;inset:auto 8px 90px 8px;z-index:99;padding:12px 14px;border-radius:14px;font:14px/1.4 sans-serif;background:' + (failed.length ? '#FF8A7A' : '#8FE3C0') + ';color:#0F1115;max-height:50vh;overflow:auto';
  box.innerHTML = `<b>Test : ${results.length - failed.length} / ${results.length} OK</b>` + failed.map(f => `<div>✗ ${esc(f.name)} : ${esc(f.err)}</div>`).join('');
  document.body.appendChild(box);
  console.log('SMOKE', JSON.stringify(window.SMOKE_RESULT));
})();
