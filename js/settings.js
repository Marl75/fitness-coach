// ===== RÉGLAGES : onglet, présentation du premier lancement, carte « Bien démarrer » =====
// Tout est facultatif : l'appli marche sans objectif, sans muscles cibles et sans routine.

// ===== ONGLET RÉGLAGES =====
function renderSettings() {
  const goals = goalsSummary();
  const nR = routines().length, nEx = Data.exercises.length;
  $('#view').innerHTML = `
    <div class="page-head">
      <h1>${t('navSettings')}</h1>
      <p class="muted">${t('settingsHint')}</p>
    </div>
    <div class="menu-list">
      <div class="btn-line setting-line">
        <span>${t('weeklyGoal')}<span class="btn-sub">${t('weeklyGoalSub')}</span></span>
        ${goalStepperHtml()}
      </div>
      <button class="btn-line" onclick="openGoals()">${t('goalsTitle')}
        <span class="btn-sub${goals ? '' : ' todo'}">${esc(goals || t('goalsNone'))}</span></button>
      <button class="btn-line" onclick="openRoutines()">${t('myRoutines')}
        <span class="btn-sub${nR ? '' : ' todo'}">${nR ? esc(routines().map(r => r.name).join(' · ')) : t('routinesNone')}</span></button>
      <button class="btn-line" onclick="openMyExercises()">${t('myExercises')}
        <span class="btn-sub">${nEx ? tn('createdN', nEx) : t('myExercisesNone')}</span></button>
      <div class="btn-line setting-line"><span>${t('language')}</span>${langSwitchHtml()}</div>
      <button class="link center-link" onclick="openOnboarding()">${t('replayIntro')}</button>
    </div>`;
}
const goalStepperHtml = () => countStepper(weeklyGoal(), 'changeGoal(-1)', 'changeGoal(1)', 'goal-val');
function changeGoal(d) {
  const g = Math.min(7, Math.max(1, weeklyGoal() + d));
  savePrefs({ weeklyGoal: g });
  const el = $('#goal-val');
  if (el) el.textContent = g;
}

// ===== BIEN DÉMARRER =====
// Sur l'accueil, tant que les trois réglages ne sont pas faits et que la carte n'a pas été fermée.
function setupSteps() {
  const p = prefs();
  return [
    { done: p.weeklyGoal !== undefined, label: p.weeklyGoal !== undefined ? tn('stepGoalDone', p.weeklyGoal) : t('stepGoal'), action: 'openWeeklyGoal()' },
    { done: !!Object.keys(p.goals || {}).length, label: t('stepMuscles'), action: 'openGoals()' },
    { done: routines().length > 0, label: t('stepRoutine'), action: 'openRoutineEditor()' },
  ];
}
const setupPending = () => !prefs().setupHidden && setupSteps().some(s => !s.done);
function setupCardHtml() {
  if (!setupPending()) return '';
  const steps = setupSteps();
  const n = steps.filter(s => s.done).length;
  return `<section class="setup-card" aria-label="${t('setupTitle')}">
    <div class="setup-top"><b>${t('setupTitle')}</b><span class="muted small">${t('setupCount', { n, total: steps.length })}</span>
      <button class="icon-btn" onclick="hideSetupCard()" aria-label="${t('setupHide')}">${icon('close')}</button></div>
    <div class="setup-bar"><span style="width:${Math.round(100 * n / steps.length)}%"></span></div>
    ${steps.map(s => s.done
      ? `<p class="setup-step done"><span class="setup-chk">${icon('check')}</span>${esc(s.label)}</p>`
      : `<button class="setup-step" onclick="${s.action}"><span class="setup-chk"></span>${esc(s.label)}${icon('chev')}</button>`).join('')}
    <p class="muted small">${t('setupFoot')}</p>
  </section>`;
}
function hideSetupCard() {
  savePrefs({ setupHidden: true });
  toast(t('setupHidden'));
}
// Le choix du nombre de séances, seul (depuis la carte) : « C'est noté » l'enregistre même s'il reste à 3
function openWeeklyGoal() {
  openSheet(`
    <div class="sheet-head"><div><div class="eyebrow">${t('navSettings')}</div><h3>${t('weeklyGoal')}</h3></div>
      <button class="icon-btn" onclick="closeSheet()" aria-label="${t('close')}">${icon('close')}</button></div>
    <p class="muted">${t('weeklyGoalSub')}</p>
    <div class="goal-pick">${goalStepperHtml()}</div>
    <button class="btn-accent big" onclick="savePrefs({ weeklyGoal: weeklyGoal() });closeSheet()">${t('noted')}</button>`);
}

// ===== PRÉSENTATION (premier lancement) =====
// Trois écrans facultatifs : séances par semaine, muscles cibles, première routine.
// Proposée une seule fois, aux comptes tout neufs ; on peut la revoir depuis Réglages.
function maybeOnboard() {
  const p = prefs();
  if (!Data.loaded || p.onboarded || Data.sessions.length || Data.exercises.length || p.weeklyGoal !== undefined) return;
  if (!$('#sheet').classList.contains('hidden')) return;
  openOnboarding();
}
function openOnboarding() {
  UI.ob = { step: 0, goal: weeklyGoal() };
  savePrefs({ onboarded: true }); // fermée ou passée, elle ne revient pas toute seule
  openSheet('<div id="onboarding"></div>', renderOnboarding);
}
function renderOnboarding() {
  const box = $('#onboarding');
  if (!box || !UI.ob) return;
  const { step } = UI.ob;
  const dots = `<div class="ob-dots" aria-hidden="true">${[0, 1, 2].map(i => `<i class="${i === step ? 'on' : ''}"></i>`).join('')}</div>`;
  const head = `<div class="ob-top">${dots}<button class="link" onclick="closeSheet()">${t('obSkip')}</button></div>
    <p class="eyebrow">${t('obStep', { n: step + 1 })}</p>`;
  const back = step ? `<button class="link center-link" onclick="UI.ob.step--;renderOnboarding()">${t('back')}</button>` : '';
  if (step === 0) box.innerHTML = `${head}
    <h3>${t('obGoalTitle')}</h3>
    <p class="muted">${t('obGoalText')}</p>
    <div class="goal-pick">${countStepper(UI.ob.goal, 'UI.ob.goal=Math.max(1,UI.ob.goal-1);renderOnboarding()', 'UI.ob.goal=Math.min(7,UI.ob.goal+1);renderOnboarding()')}</div>
    <button class="btn-accent big" onclick="savePrefs({ weeklyGoal: UI.ob.goal });UI.ob.step=1;renderOnboarding()">${t('obNext')}</button>`;
  if (step === 1) {
    // Un appui : à développer (vert) ; deux : à ménager (orange) ; trois : rien
    const next = { up: 'down', down: null };
    const chip = m => {
      const g = muscleGoal(m), to = g ? next[g] : 'up';
      return `<button class="chip${g ? ' active' : ''}${g === 'down' ? ' spare' : ''}" aria-pressed="${!!g}" onclick="setGoal('${m}',${to ? `'${to}'` : 'null'})">${esc(cap(muscleShort(m)))}${g ? ` · ${esc(t(g === 'up' ? 'goalUp' : 'goalDown').toLowerCase())}` : ''}</button>`;
    };
    box.innerHTML = `${head}
      <h3>${t('obMusclesTitle')}</h3>
      <p class="muted">${t('obMusclesText')}</p>
      <p class="sub-label">${t('obMusclesTap')}</p>
      <div class="chips wrap">${MUSCLES.map(chip).join('')}</div>
      <button class="btn-accent big" onclick="UI.ob.step=2;renderOnboarding()">${t('obNext')}</button>${back}`;
  }
  if (step === 2) box.innerHTML = `${head}
    <h3>${t('obRoutineTitle')}</h3>
    <p class="muted">${t('obRoutineText')}</p>
    <button class="btn-accent big" onclick="UI.ob=null;openRoutineEditor()">${t('obRoutineCreate')}</button>
    <button class="btn-outline" onclick="UI.ob=null;closeSheet()">${t('obRoutineLater')}</button>
    <p class="muted small center">${t('obFoot')}</p>${back}`;
}
