// ===== ÉTAT DE L'ÉCRAN =====
const UI = {
  tab: 'today',
  date: isoDate(),     // jour affiché dans l'onglet Séance
  month: null,         // mois affiché dans le calendrier (1er du mois)
  selDay: null,        // jour touché dans le calendrier
  search: '',
  showHidden: false,   // section « Masqués » dépliée
};
let draft = null;      // cardio / cours en cours de saisie
let setDraft = null;   // série en cours de réglage (pile de plaques)
try { UI.tab = localStorage.getItem('fitcoach-tab') || 'today'; } catch (e) {}

// ===== EXERCICES & HISTORIQUE =====
function allExercises() {
  return [...CATALOG, ...Data.exercises.map(e => ({ ...e, group: e.group || 'custom', custom: true }))];
}
const findExercise = id => allExercises().find(e => e.id === id);
const exOfEntry = e => findExercise(e.exId) || { id: e.exId, kind: e.kind };
const activeSessions = () => Data.sessions.filter(s => (s.entries || []).some(entryDone));
const sessionOf = date => Data.sessions.find(s => s.id === date);
function cloneSession(date) {
  const s = sessionOf(date);
  return s ? JSON.parse(JSON.stringify(s)) : { id: date, entries: [], createdAt: Date.now() };
}
// Tous les passages faits d'un exercice, du plus récent au plus ancien
function historyOf(exId) {
  const out = [];
  for (const s of Data.sessions) for (const e of s.entries || []) if (e.exId === exId && entryDone(e)) out.push({ date: s.id, entry: e });
  return out;
}
function recentExerciseIds(limit) {
  const ids = [];
  for (const s of Data.sessions) for (const e of s.entries || []) if (!ids.includes(e.exId)) ids.push(e.exId);
  return ids.slice(0, limit);
}
function sessionsInRange(from, to) {
  return activeSessions().filter(s => s.id >= from && s.id <= to).length;
}
const maxWeight = e => Math.max(0, ...doneSets(e).map(s => s.weight || 0));

// Modifie l'exercice d'une séance puis enregistre (supprime l'exercice s'il est vide)
function updateEntry(date, entryId, fn) {
  const s = cloneSession(date);
  const e = s.entries.find(x => x.id === entryId);
  if (!e) return null;
  fn(e);
  s.entries = s.entries.filter(x => x.kind !== 'sets' || (x.sets || []).length);
  saveSession(s);
  return e;
}

// ===== PILE DE PLAQUES =====
// Comme sur une machine : les plaques légères en haut, la goupille choisit le poids.
const STEP = 2.5;
const plateLabel = v => (v ? fmtNum(v) : t('plateNone'));
// Plaque où se place la goupille : la plus lourde sans dépasser le poids (12,75 kg → plaque 12,5)
const pinPlate = (values, w) => values.filter(v => v <= w).pop() ?? values[0];
function stackHtml(values, pin, action, cls = '') {
  const at = pinPlate(values, pin);
  return `<div class="stack ${cls}" role="group" aria-label="${t('stackAria')}">${values.map(v => {
    const state = v === at ? 'pin' : v < at ? 'lifted' : '';
    return `<button type="button" class="plate ${state}" data-v="${v}" onclick="${action}(${v})" aria-pressed="${v === at}" aria-label="${v ? t('kilos', { w: fmtNum(v) }) : t('plateNoneAria')}">${plateLabel(v)}</button>`;
  }).join('')}</div>`;
}
// ===== NAVIGATION =====
function setTab(tab) {
  UI.tab = tab;
  try { localStorage.setItem('fitcoach-tab', tab); } catch (e) {}
  window.scrollTo(0, 0);
  render();
}

function render() {
  if (!Data.user) return;
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === UI.tab));
  $('#sync').classList.toggle('hidden', !(Data.pending || !navigator.onLine) || DEMO);
  if (UI.tab === 'today') renderToday(); else renderTrack();
}
onDataChange = () => { autoAttachOld(); render(); if (sheetRefresh) sheetRefresh(); };
window.addEventListener('online', render);
window.addEventListener('offline', render);

// ===== ONGLET SÉANCE =====
function chronoText() {
  const s = sessionOf(UI.date);
  if (UI.date !== isoDate() || !s || !s.createdAt) return '';
  const min = Math.round((Date.now() - s.createdAt) / 60000);
  return min >= 1 && min < 300 ? `${min} min` : '';
}
setInterval(() => { const el = $('#chrono'); if (el) el.textContent = chronoText(); }, 30000);

function renderToday() {
  const today = isoDate();
  const isToday = UI.date === today;
  const entries = (sessionOf(UI.date) || {}).entries || [];
  const last = activeSessions().find(s => s.id < UI.date);
  const weekCount = sessionsInRange(isoDate(mondayOf(new Date())), today);
  const current = entries.find(e => pendingIndex(e) >= 0);

  let html = `
    <div class="page-head">
      <div class="head-row">
        <span class="eyebrow">${cap(fmtDay(UI.date))}</span>
        <span class="chrono" id="chrono">${chronoText()}</span>
      </div>
      <div class="head-row">
        <h1>${isToday ? t('todayTitle') : t('dayTitle', { date: esc(fmtShort(UI.date)) })}</h1>
        <button class="date-chip" onclick="openDayPicker()" aria-label="${t('otherDayAria')}">${icon('cal')}${t('otherDay')}</button>
      </div>
    </div>`;

  if (!entries.length) {
    html += `
      <div class="empty">
        <p class="empty-title">${isToday ? t('noSportToday') : t('noSessionDay')}</p>
        <p class="muted">${last ? t('lastSession', { when: relDay(last.id) }) : t('firstSession')}
          ${isToday ? `<br>${t('weekProgress', { n: weekCount, goal: weeklyGoal() })}` : ''}</p>
        <button class="btn-accent big" onclick="openPicker()">${icon('plus')}${isToday ? t('startSession') : t('addExercise')}</button>
      ${quickFavs()}
      </div>`;
  } else {
    html += `<div class="rows">${entries.map(e => e === current ? currentCard(e) : entryRow(e)).join('')}</div>
      <button class="btn-outline" onclick="openPicker()">${icon('plus')}${current ? t('addAnother') : t('nextExercise')}</button>
      ${current ? '' : quickFavs()}
      ${entries.some(entryDone) ? `<p class="muted small center foot">${sessionFoot(entries)}</p>` : ''}`;
  }
  if (!isToday) html += `<p class="center"><button class="link" onclick="goToDay('${today}')">${t('backToday')}</button></p>`;
  $('#view').innerHTML = html;
}

// Favoris en un geste, sous le bouton d'ajout
function quickFavs() {
  const favs = favorites().map(findExercise);
  if (!favs.length) return '';
  return `<div class="quick"><p class="label">${t('favorites')}</p><div class="chips">${favs.map(ex =>
    `<button class="chip" onclick="pickExercise('${esc(ex.id)}')">${icon('star')}${esc(exLabel(ex))}</button>`).join('')}</div></div>`;
}

function sessionFoot(entries) {
  const done = entries.filter(entryDone);
  const sets = done.reduce((t, e) => t + (e.kind === 'sets' ? doneSets(e).length : 0), 0);
  const min = done.reduce((t, e) => t + (e.kind !== 'sets' && e.duration ? e.duration : 0), 0);
  return [tn('exercises', done.length), sets && tn('sets', sets), min && t('cardioMin', { n: min })].filter(Boolean).join(' · ');
}

function entryRow(e) {
  const pi = pendingIndex(e);
  const sub = pi >= 0 && !doneSets(e).length ? tn('plannedSets', e.sets.length) : entrySummary(e);
  const mark = entryDone(e) && pi < 0 ? `<span class="row-mark">${icon('check')}</span>` : icon('chev');
  const setup = setupSummary(e.setup);
  return `<button class="row" onclick="openEntry('${esc(e.id)}')">${pictoTile(exOfEntry(e))}
    <span class="row-main"><span class="row-name">${esc(entryName(e))}</span>${enLine(entryEn(e))}<span class="row-sub">${esc(sub)}</span>
    ${setup ? `<span class="row-setup">${esc(setup)}</span>` : ''}
    ${e.note ? `<span class="row-note">${esc(e.note)}</span>` : ''}</span>${mark}</button>`;
}

// L'exercice en cours : un tableau des séries (poids, répétitions, coche).
// La ligne en cours a ses boutons − / + ; toucher un poids ou un nombre ouvre le réglage précis.
function currentCard(e) {
  const i = pendingIndex(e);
  const id = esc(e.id);
  const last = historyOf(e.exId).find(h => h.date < UI.date);
  const setup = setupSummary(e.setup);
  const rows = e.sets.map((s, k) => {
    const done = s.done !== false, cur = k === i;
    const n = k + 1;
    const reps = cur
      ? `<div class="mini-step"><button onclick="stepSetReps('${id}',${k},-1)" aria-label="${t('repMinus')}">${icon('minus')}</button><span class="serif">${s.reps ?? '–'}</span><button onclick="stepSetReps('${id}',${k},1)" aria-label="${t('repPlus')}">${icon('plus')}</button></div>`
      : `<button class="cell serif" onclick="openSet('${id}',${k})" aria-label="${t('changeNumbers')}">${s.reps ?? '–'}</button>`;
    const check = done
      ? `<button class="chk on" onclick="undoSet('${id}',${k})" aria-label="${t('setUndoAria', { n })}">${icon('check')}</button>`
      : `<button class="chk${cur ? ' cur' : ''}" onclick="finishSetAt('${id}',${k})" aria-label="${t('setCheckAria', { n })}">${icon('check')}</button>`;
    return `<div class="srow${cur ? ' cur' : ''}${!done && !cur ? ' later' : ''}"><span class="sn">${n}</span>
      <button class="cell serif" onclick="openSet('${id}',${k})" aria-label="${t('changeNumbers')}">${s.weight ? fmtNum(s.weight) : '–'}</button>${reps}${check}</div>`;
  }).join('');
  return `<section class="now sets" aria-label="${t('currentAria')}">
    <div class="now-head">
      <button class="icon-btn now-close" onclick="removeCurrent('${id}')" aria-label="${t('removeEx')}">${icon('close')}</button>
      <button class="picto-btn" onclick="openTips('${esc(e.exId)}')" aria-label="${t('tipsAria')}">${pictoTile(exOfEntry(e), 'big')}<span class="picto-help" aria-hidden="true">${icon('info')}</span></button>
      <div class="now-head-text"><h2 class="now-name">${esc(entryName(e))}</h2>${enLine(entryEn(e))}
        ${last ? `<p class="now-last">${esc(t('lastShort', { what: entrySummary(last.entry) }))}</p>` : ''}</div>
    </div>
    ${setup ? `<p class="now-setup">${esc(setup)}</p>` : ''}
    ${i >= 0 ? progressionHtml(e.exId, e.id) : ''}
    <div class="sets-grid">
      <div class="srow hd"><span class="sn">#</span><span>${t('colWeight')}</span><span>${t('colReps')}</span><span></span></div>
      ${rows}
    </div>
    <div class="sets-actions">
      <button class="add" onclick="addPlannedSet('${id}')">${icon('plus')}${t('addSetBtn')}</button>
      <button onclick="stopEntry('${id}')">${t('finishEx')}</button>
    </div>
    <div class="now-links">
      <button onclick="finishAll('${id}')">${t('validateAll')}</button>
      <button class="tips-link" onclick="openTips('${esc(e.exId)}')">${t('tipsLink')}</button>
      <button onclick="openEntry('${id}')">${t('setup')} · ${t('comment').toLowerCase()}</button>
    </div>
  </section>`;
}

// Retirer l'exercice en cours (confirmation si des séries sont déjà faites), avec « Annuler »
function removeEntry(entryId) {
  const s = cloneSession(UI.date);
  s.entries = s.entries.filter(x => x.id !== entryId);
  saveSession(s);
}
function removeCurrent(entryId) {
  const s = cloneSession(UI.date);
  const k = s.entries.findIndex(x => x.id === entryId);
  if (k < 0) return;
  const e = s.entries[k];
  if (doneSets(e).length && !confirm(t('confirmDelete', { name: entryName(e) }))) return;
  removeEntry(entryId);
  toast(t('removedEx'), { label: t('undo'), fn: () => {
    const back = cloneSession(UI.date);
    back.entries.splice(Math.min(k, back.entries.length), 0, e);
    saveSession(back);
  } });
}
function finishSetAt(entryId, k) {
  const e = updateEntry(UI.date, entryId, e => { e.sets[k].done = true; });
  if (e) toast(pendingIndex(e) < 0 ? t('exerciseDone') : t('setNDone', { n: k + 1 }));
}
function undoSet(entryId, k) {
  updateEntry(UI.date, entryId, e => { e.sets[k].done = false; });
}
// Répétitions de la série en cours, sans ouvrir de panneau (ex. 8 au lieu de 10 à la dernière série)
function stepSetReps(entryId, k, d) {
  updateEntry(UI.date, entryId, e => { e.sets[k].reps = Math.max(0, (e.sets[k].reps || 0) + d) || null; });
}
function finishAll(entryId) {
  updateEntry(UI.date, entryId, e => e.sets.forEach(s => { s.done = true; }));
  toast(t('exerciseDone'));
}
function addPlannedSet(entryId) {
  updateEntry(UI.date, entryId, e => { e.sets.push({ ...e.sets[e.sets.length - 1], done: false }); });
}
// Terminer : les séries prévues non faites sont retirées
function stopEntry(entryId) {
  updateEntry(UI.date, entryId, e => { e.sets = e.sets.filter(s => s.done !== false); });
}

function goToDay(date) {
  if (!date) return;
  UI.date = date > isoDate() ? isoDate() : date;
  UI.tab = 'today';
  closeSheet();
  window.scrollTo(0, 0);
  render();
}

// ===== FAVORIS =====
const favorites = () => (prefs().favorites || []).filter(id => findExercise(id));
const isFav = id => (prefs().favorites || []).includes(id);
function toggleFav(id) {
  const f = prefs().favorites || [];
  const on = !f.includes(id);
  savePrefs({ favorites: on ? [...f, id] : f.filter(x => x !== id) });
  toast(on ? t('addedFav') : t('removedFav'));
}

// ===== OBJECTIFS PAR MUSCLE =====
// prefs.goals : { muscle: 'up' (à développer) | 'down' (à ménager) }. Sert aux pictos (orange),
// aux avertissements, au filtre « Mes objectifs » et, plus tard, aux recommandations.
const muscleGoal = m => (prefs().goals || {})[m] || null;
const hasUpGoals = () => Object.values(prefs().goals || {}).includes('up');
const muscleNames = list => list.map(muscleShort).join(', ');
function setGoal(m, g) {
  const goals = { ...(prefs().goals || {}) };
  if (g) goals[m] = g; else delete goals[m];
  savePrefs({ goals });
}
// Étiquette verte : l'exercice travaille en principal un muscle « à développer »
function goalBadge(ex) {
  const up = musclesOf(ex)[0].filter(m => muscleGoal(m) === 'up');
  return up.length ? `<span class="goal-badge">${icon('check')}${esc(t('goalBadge', { m: muscleNames(up) }))}</span>` : '';
}
// « Sollicite surtout : trapèzes (à ménager) »
function goalNote(ex) {
  const [main, sec] = musclesOf(ex);
  const dMain = main.filter(m => muscleGoal(m) === 'down');
  const dSec = sec.filter(m => !main.includes(m) && muscleGoal(m) === 'down');
  if (dMain.length) return t('goalWarnMain', { m: muscleNames(dMain) });
  if (dSec.length) return t('goalWarnSec', { m: muscleNames(dSec) });
  return '';
}
// Plus c'est haut, plus l'exercice va dans le sens de tes objectifs
function goalScore(ex) {
  const [main, sec] = musclesOf(ex);
  let s = 0;
  for (const m of main) s += muscleGoal(m) === 'up' ? 2 : muscleGoal(m) === 'down' ? -3 : 0;
  for (const m of sec) if (!main.includes(m)) s += muscleGoal(m) === 'up' ? 1 : muscleGoal(m) === 'down' ? -1 : 0;
  return s;
}
function goalsSummary() {
  const g = prefs().goals || {};
  const up = MUSCLES.filter(m => g[m] === 'up'), down = MUSCLES.filter(m => g[m] === 'down');
  return [up.length && t('goalsSumUp', { m: muscleNames(up) }), down.length && t('goalsSumDown', { m: muscleNames(down) })].filter(Boolean).join(' · ');
}
function openGoals() {
  openSheet(`
    <div class="sheet-head">
      <div><div class="eyebrow">${t('account')}</div><h3>${t('goalsTitle')}</h3></div>
      <button class="icon-btn" onclick="closeSheet()" aria-label="${t('close')}">${icon('close')}</button>
    </div>
    <p class="muted small">${t('goalsHint')}</p>
    <div id="goals-list"></div>`, renderGoals);
}
function renderGoals() {
  const box = $('#goals-list');
  if (!box) return;
  box.innerHTML = MUSCLES.map(m => `<div class="goal-line"><span>${t('m_' + m)}</span>
    <div class="seg small" role="radiogroup" aria-label="${esc(t('m_' + m))}">${[['up', t('goalUp')], [null, '—'], ['down', t('goalDown')]].map(([g, label]) =>
      `<button class="${muscleGoal(m) === g ? 'active' : ''} ${g || 'none'}" role="radio" aria-checked="${muscleGoal(m) === g}" onclick="setGoal('${m}',${g ? `'${g}'` : 'null'})">${label}</button>`).join('')}</div>
  </div>`).join('');
}

// ===== MASQUÉS =====
// Exercices qui ne t'intéressent pas ou pas dispo : rangés en bas de la liste, repliés.
const isHidden = id => (prefs().hidden || []).includes(id);
function toggleHidden(id) {
  const h = prefs().hidden || [];
  const on = !h.includes(id);
  const patch = { hidden: on ? [...h, id] : h.filter(x => x !== id) };
  if (on) patch.favorites = (prefs().favorites || []).filter(x => x !== id); // un exercice masqué n'est plus en favori
  savePrefs(patch);
  toast(on ? t('hiddenToast') : t('unhiddenToast'));
}
function toggleHiddenSection() { UI.showHidden = !UI.showHidden; renderPickerList(); }

// ===== DOUBLONS =====
// Compare un nom à tous les exercices (et à leurs autres noms) : identique, contenu, faute de frappe, mot en commun.
const STOP = new Set(['de', 'du', 'des', 'la', 'le', 'les', 'au', 'aux', 'en', 'et', 'avec', 'sur', 'the', 'machine', 'exercice']);
const simple = s => norm(s).replace(/[^a-z0-9]+/g, ' ').trim();
const words = s => simple(s).split(' ').filter(w => w.length > 2 && !STOP.has(w));
function lev(a, b) {
  const d = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    let prev = d[0]; d[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const tmp = d[j];
      d[j] = Math.min(d[j] + 1, d[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = tmp;
    }
  }
  return d[b.length];
}
function similarExercises(name) {
  const n = simple(name);
  if (n.length < 3) return [];
  const nw = words(name);
  const scored = allExercises().map(e => {
    let score = 0;
    for (const cand of [e.name, e.en, ...(e.aliases || [])].filter(Boolean)) {
      const c = simple(cand);
      if (c === n) score = Math.max(score, 100);
      else if (c.length >= 4 && n.length >= 4 && (c.includes(n) || n.includes(c))) score = Math.max(score, 80);
      if (lev(c, n) <= Math.max(1, Math.floor(Math.min(c.length, n.length) / 5))) score = Math.max(score, 75);
      const cw = words(cand);
      const common = nw.filter(w => cw.some(x => x === w || (w.length >= 5 && x.length >= 5 && lev(x, w) <= 1)));
      if (common.length) score = Math.max(score, 50 + 15 * common.length);
    }
    return { e, score };
  }).filter(x => x.score >= 60).sort((a, b) => b.score - a.score);
  // Une correspondance forte existe : on n'affiche pas les ressemblances lointaines
  const strong = scored.length && scored[0].score >= 80;
  return scored.filter(x => !strong || x.score >= 75).slice(0, 5);
}

// ===== CHOIX DE L'EXERCICE =====
function pickerFilters() {
  const hasCustom = Data.exercises.length > 0;
  const hasRecent = recentExerciseIds(1).length > 0;
  return [
    { id: 'fav', label: t('favorites') },
    hasUpGoals() && { id: 'goals', label: t('f_goals') },
    hasRecent && { id: 'recent', label: t('f_recent') },
    { id: 'all', label: t('f_all') },
    ...GROUPS.filter(g => g.id !== 'custom').map(g => ({ id: g.id, label: g.label })),
    hasCustom && { id: 'custom', label: t('g_custom') },
  ].filter(Boolean);
}
function defaultFilter() {
  let f = null;
  try { f = localStorage.getItem('fitcoach-filter'); } catch (e) {}
  if (f && pickerFilters().some(x => x.id === f)) return f;
  return favorites().length ? 'fav' : recentExerciseIds(1).length ? 'recent' : 'all';
}
function setFilter(id) {
  UI.filter = id;
  try { localStorage.setItem('fitcoach-filter', id); } catch (e) {}
  renderPickerList();
  const chip = document.querySelector(`#picker-chips [data-f="${id}"]`);
  if (chip) chip.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
}

function openPicker() {
  UI.search = '';
  UI.filter = defaultFilter();
  openSheet(`
    <div class="sheet-head"><h3>${t('whichExercise')}</h3>
      <button class="icon-btn" onclick="closeSheet()" aria-label="${t('close')}">${icon('close')}</button></div>
    <input class="input" type="search" placeholder="${t('search')}" oninput="UI.search=this.value;renderPickerList()" aria-label="${t('searchAria')}">
    <div class="chips" id="picker-chips" role="tablist" aria-label="${t('categories')}"></div>
    <div id="picker-list"></div>`, renderPickerList);
}

function hiddenItem(ex) {
  return `<div class="pick hidden-ex">
    <button class="pick-main" onclick="pickExercise('${esc(ex.id)}')"><span class="pick-name">${esc(exLabel(ex))}</span>${enLine(exEn(ex))}</button>
    <button class="unhide" onclick="toggleHidden('${esc(ex.id)}')">${t('unhide')}</button>
  </div>`;
}
function hiddenSection(list) {
  if (!list.length) return '';
  return `<div class="hidden-block">
    <button class="hidden-toggle" onclick="toggleHiddenSection()" aria-expanded="${UI.showHidden}">
      ${icon('eyeoff')}<span>${t('hiddenSection', { n: list.length })}</span>${icon(UI.showHidden ? 'up' : 'down')}
    </button>
    ${UI.showHidden ? `<p class="muted small">${t('hiddenHint')}</p>` + list.map(hiddenItem).join('') : ''}
  </div>`;
}

function pickItem(ex) {
  const last = historyOf(ex.id)[0];
  const sub = last ? `${entrySummary(last.entry)} · ${relDay(last.date)}` : KINDS[ex.kind].label;
  const fav = isFav(ex.id);
  const musc = musclesLine(ex);
  return `<div class="pick">
    <button class="pick-main" onclick="pickExercise('${esc(ex.id)}')">${pictoTile(ex)}<span class="pick-text">${goalBadge(ex)}<span class="pick-name">${esc(exLabel(ex))}</span>${enLine(exEn(ex))}
      ${musc ? `<span class="pick-musc">${esc(musc)}</span>` : ''}${goalNote(ex) ? `<span class="pick-warn">${esc(goalNote(ex))}</span>` : ''}<span class="pick-sub">${esc(sub)}</span></span></button>
    <button class="star${fav ? ' on' : ''}" onclick="toggleFav('${esc(ex.id)}')" aria-pressed="${fav}" aria-label="${fav ? t('favOn') : t('favOff')} : ${esc(exLabel(ex))}">${icon('star')}</button>
    <button class="hide-btn" onclick="toggleHidden('${esc(ex.id)}')" aria-label="${t('hide')} : ${esc(exLabel(ex))}">${icon('eyeoff')}</button>
  </div>`;
}
const byName = (a, b) => exLabel(a).localeCompare(exLabel(b), currentLang);

function renderPickerList() {
  const box = $('#picker-list');
  if (!box) return;
  const q = UI.search.trim();
  $('#picker-chips').innerHTML = pickerFilters().map(f =>
    `<button class="chip${!q && UI.filter === f.id ? ' active' : ''}" data-f="${f.id}" role="tab" aria-selected="${!q && UI.filter === f.id}" onclick="setFilter('${f.id}')">${f.id === 'fav' ? icon('star') : ''}${f.label}</button>`).join('');
  const every = allExercises();
  const all = every.filter(e => !isHidden(e.id));
  let hiddenPool = [];
  let html = '';
  if (q) {
    // Recherche dans tout le catalogue, y compris les autres noms (anglais…)
    const nq = simple(q);
    const found = all.filter(e => [e.name, e.en, ...(e.aliases || [])].filter(Boolean).some(n => simple(n).includes(nq)))
      .sort((a, b) => (isFav(b.id) - isFav(a.id)) || byName(a, b));
    html += found.length ? found.map(pickItem).join('') : `<p class="muted small empty-list">${t('noMatch', { q: esc(q) })}</p>`;
    hiddenPool = every.filter(e => isHidden(e.id) && [e.name, e.en, ...(e.aliases || [])].filter(Boolean).some(n => simple(n).includes(nq)));
    if (!found.some(e => simple(exLabel(e)) === nq)) {
      html += `<button class="pick-create" onclick="openCreate()">${icon('plus')}${t('createQ', { q: esc(q) })}</button>`;
    }
  } else {
    const f = UI.filter;
    if (f === 'fav') {
      const favs = favorites().map(findExercise);
      html += favs.length ? favs.map(pickItem).join('')
        : `<p class="muted small empty-list">${t('noFavs', { star: icon('star') })}</p>`;
    } else if (f === 'goals') {
      const list = all.map(e => ({ e, s: goalScore(e) })).filter(x => x.s > 0)
        .sort((a, b) => b.s - a.s || byName(a.e, b.e)).map(x => x.e);
      html += `<p class="muted small empty-list">${t('goalsFilterHint')}</p>` + list.map(pickItem).join('');
    } else if (f === 'recent') {
      const recent = recentExerciseIds(12).map(findExercise).filter(Boolean);
      html += recent.filter(e => !isHidden(e.id)).map(pickItem).join('');
      hiddenPool = recent.filter(e => isHidden(e.id));
    } else if (f === 'all') {
      for (const g of GROUPS) {
        const list = all.filter(e => e.group === g.id).sort(byName);
        if (list.length) html += `<p class="pick-group">${g.label}</p>` + list.map(pickItem).join('');
      }
      hiddenPool = every.filter(e => isHidden(e.id));
    } else if (f === 'custom') {
      html += all.filter(e => e.custom).sort(byName).map(pickItem).join('');
      hiddenPool = every.filter(e => e.custom && isHidden(e.id));
    } else {
      html += all.filter(e => e.group === f).sort(byName).map(pickItem).join('');
      hiddenPool = every.filter(e => e.group === f && isHidden(e.id));
    }
    html += `<button class="pick-create" onclick="openCreate()">${icon('plus')}${t('createExercise')}</button>`;
  }
  box.innerHTML = html + hiddenSection(hiddenPool.sort(byName));
}

// ===== CRÉER UN EXERCICE (avec vérification des doublons) =====
// pre : valeurs de départ (variante d'un exercice existant)
let createConfirm = false;
let createState = null;
function openCreate(pre = {}) {
  const name = pre.name ?? UI.search.trim();
  createConfirm = false;
  const kind = pre.kind || 'sets';
  createState = { kind, fields: pre.fields ? [...pre.fields] : [...(DEFAULT_FIELDS[kind] || [])], muscles: [...(pre.muscles || [])],
    fieldsTouched: !!pre.fields, variant: !!pre.base, baseId: pre.baseId };
  const groupFor = ['upper', 'lower', 'core', 'cardio', 'class'];
  openSheet(`
    <div class="sheet-head"><h3>${pre.base ? t('variant') : t('newExercise')}</h3>
      <button class="icon-btn" onclick="closeSheet()" aria-label="${t('close')}">${icon('close')}</button></div>
    ${pre.base ? `<p class="muted small">${esc(t('variantOf', { name: pre.base }))}</p>` : ''}
    <label class="field"><span>${t('name')}</span>
      <input class="input" id="new-name" value="${esc(name)}" maxlength="60" placeholder="${t('namePh')}" oninput="createConfirm=false;renderSimilar()" autocomplete="off"></label>
    <div id="similar"></div>
    <p class="field"><span>${t('whatToLog')}</span></p>
    <div class="kinds" role="radiogroup">${Object.entries(KINDS).map(([k, v]) => `
      <button class="kind${k === kind ? ' active' : ''}" data-kind="${k}" role="radio" aria-checked="${k === kind}" onclick="selectKind(this)">
        <span class="kind-label">${v.label}</span><span class="kind-hint">${v.hint}</span></button>`).join('')}</div>
    <div id="create-fields"></div>
    <p class="field"><span>${t('musclesWorked')}</span></p>
    <div class="chips wrap" id="create-muscles">${MUSCLES.map(m => `<button class="chip${createState.muscles.includes(m) ? ' active' : ''}" aria-pressed="${createState.muscles.includes(m)}" onclick="toggleCreateMuscle(this,'${m}')">${t('m_' + m)}</button>`).join('')}</div>
    <p class="field"><span>${t('categoryHint')}</span></p>
    <div class="chips wrap" id="new-group" role="radiogroup">${GROUPS.filter(g => groupFor.includes(g.id)).map(g =>
      `<button class="chip${g.id === pre.group ? ' active' : ''}" data-g="${g.id}" role="radio" aria-checked="${g.id === pre.group}" onclick="selectGroup(this)">${g.label}</button>`).join('')}</div>
    <button class="btn-accent big" id="create-btn" onclick="createExercise()">${t('createStart')}</button>`);
  renderCreateFields();
  renderSimilar();
  if (!name) $('#new-name').focus();
}
function selectKind(btn) {
  document.querySelectorAll('.kind').forEach(b => { b.classList.toggle('active', b === btn); b.setAttribute('aria-checked', b === btn); });
  createState.kind = btn.dataset.kind;
  if (!createState.fieldsTouched) createState.fields = [...(DEFAULT_FIELDS[createState.kind] || [])];
  renderCreateFields();
}
// Cardio et cours : on choisit les infos à noter (muscu : séries, répétitions, poids)
function renderCreateFields() {
  const box = $('#create-fields');
  if (!box) return;
  box.innerHTML = createState.kind === 'sets' ? '' : `
    <p class="field"><span>${t('fieldsToLog')}</span></p>
    <div class="chips wrap">${FIELD_ORDER.map(k => `<button class="chip${createState.fields.includes(k) ? ' active' : ''}" aria-pressed="${createState.fields.includes(k)}" onclick="toggleCreateField('${k}')">${t('fs_' + k)}</button>`).join('')}</div>`;
}
function toggleCreateField(k) {
  const f = createState.fields;
  createState.fields = f.includes(k) ? f.filter(x => x !== k) : FIELD_ORDER.filter(x => x === k || f.includes(x));
  createState.fieldsTouched = true;
  renderCreateFields();
}
function toggleCreateMuscle(btn, m) {
  const on = !createState.muscles.includes(m);
  createState.muscles = on ? [...createState.muscles, m] : createState.muscles.filter(x => x !== m);
  btn.classList.toggle('active', on);
  btn.setAttribute('aria-pressed', on);
}
function selectGroup(btn) {
  const on = !btn.classList.contains('active');
  document.querySelectorAll('#new-group .chip').forEach(b => { b.classList.toggle('active', on && b === btn); b.setAttribute('aria-checked', on && b === btn); });
}
function renderSimilar() {
  const box = $('#similar');
  if (!box) return;
  // Une variante ressemble forcément à l'exercice de départ : pas d'alerte
  const sim = createState && createState.variant ? [] : similarExercises($('#new-name').value);
  const btn = $('#create-btn');
  if (btn) btn.textContent = createConfirm ? t('createAnyway') : t('createStart');
  box.innerHTML = !sim.length ? '' : `
    <div class="similar${createConfirm ? ' warn' : ''}">
      <p class="similar-title">${sim[0].score === 100 ? t('existsAlready') : t('maybeExists')}</p>
      ${sim.map(({ e }) => `<button class="similar-item" onclick="pickExercise('${esc(e.id)}')">
        <span><b>${esc(exLabel(e))}</b><span class="muted small"> · ${esc((GROUPS.find(g => g.id === e.group) || {}).label || '')}</span></span>
        <span class="similar-use">${t('use')}</span></button>`).join('')}
      ${createConfirm ? `<p class="small">${t('confirmCreate')}</p>` : ''}
    </div>`;
}
function createExercise() {
  const name = $('#new-name').value.trim().replace(/\s+/g, ' ');
  if (!name) { $('#new-name').focus(); return; }
  const sim = similarExercises(name);
  if (sim.length && sim[0].score === 100) {
    toast(t('existsToast'));
    pickExercise(sim[0].e.id);
    return;
  }
  if (sim.length && !createConfirm && !createState.variant) {
    createConfirm = true;
    renderSimilar();
    $('#similar').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    return;
  }
  const g = document.querySelector('#new-group .chip.active');
  const { kind, fields, muscles } = createState;
  const ex = { id: 'c-' + Date.now().toString(36), name, kind, createdAt: Date.now() };
  if (kind !== 'sets') ex.fields = fields.length ? fields : DEFAULT_FIELDS[kind];
  if (muscles.length) ex.muscles = muscles;
  if (g) ex.group = g.dataset.g;
  if (createState.baseId) ex.variantOf = createState.baseId;
  saveCustomExercise(ex);
  toast(t('created', { name }));
  pickExercise(ex.id, { ...ex, group: ex.group || 'custom', custom: true });
}
// Variante : même type, mêmes infos et mêmes muscles, avec son propre historique
function openVariant(exId) {
  const ex = findExercise(exId);
  if (!ex) return;
  openCreate({ name: t('variantName', { name: exLabel(ex) }), kind: ex.kind, group: ex.group === 'custom' ? null : ex.group,
    fields: ex.kind === 'sets' ? null : fieldsFor(exId, ex.kind), muscles: musclesOf(ex)[0], base: exLabel(ex), baseId: exId });
}

// ===== CHAMPS D'UN EXERCICE =====
// Ceux de l'exercice (catalogue ou création), plus les infos ajoutées à la main, plus celles déjà remplies.
function fieldsFor(exId, kind, entry) {
  const ex = findExercise(exId);
  const base = (ex && ex.fields) || EX_FIELDS[exId] || DEFAULT_FIELDS[kind] || ['duration'];
  const extra = (prefs().extraFields || {})[exId] || [];
  const filled = entry ? FIELD_ORDER.filter(k => entry[k] !== null && entry[k] !== undefined && entry[k] !== '') : [];
  return [...new Set([...base, ...extra, ...filled])].filter(k => FIELDS[k]);
}

function pickExercise(id, exObj) {
  const ex = exObj || findExercise(id);
  const last = historyOf(ex.id)[0];
  const le = last && last.entry;
  if (ex.kind === 'sets') {
    // On prévoit les séries de la dernière fois (mêmes poids, mêmes répétitions, mêmes réglages) :
    // il suffit ensuite de toucher « Série faite »
    const base = le ? doneSets(le) : [];
    const sets = (base.length ? base : [0, 1, 2].map(() => ({ reps: 10, weight: null })))
      .map(s => ({ reps: s.reps ?? null, weight: s.weight ?? null, done: false }));
    const s = cloneSession(UI.date);
    const entry = { id: 'e' + Date.now().toString(36), exId: ex.id, name: ex.name, kind: 'sets', note: '', sets };
    if (le && le.setup) entry.setup = JSON.parse(JSON.stringify(le.setup));
    s.entries.push(entry);
    saveSession(s);
    closeSheet();
    setTimeout(() => $('.now') && $('.now').scrollIntoView({ behavior: 'smooth', block: 'center' }), 50);
    // Touché par erreur : « Annuler » le retire et rouvre la liste
    toast(t('addedEx', { name: exLabel(ex) }), { label: t('undo'), fn: () => { removeEntry(entry.id); openPicker(); } });
    return;
  }
  // Cardio, cours : toutes les valeurs de la dernière fois (vitesse, inclinaison, poids porté, piste…)
  const fields = fieldsFor(ex.id, ex.kind, le);
  draft = { entryId: null, exId: ex.id, name: ex.name, kind: ex.kind, note: '', fields };
  for (const k of fields) draft[k] = le && le[k] !== undefined ? le[k] : null;
  if (!le && fields.includes('duration') && !fields.includes('laps')) draft.duration = ex.kind === 'cardio' ? 20 : 30;
  openTimeEditor(last);
}

// ===== RÉGLER UNE SÉRIE (grande pile + poids exact) =====
const WEIGHT_STEPS = [0.25, 0.5, 1, 2.5];
function weightStep() {
  let v = null;
  try { v = parseFloat(localStorage.getItem('fitcoach-wstep')); } catch (e) {}
  return WEIGHT_STEPS.includes(v) ? v : 0.5;
}
function openSet(entryId, idx) {
  const e = (sessionOf(UI.date).entries || []).find(x => x.id === entryId);
  if (!e) return;
  const set = e.sets[idx];
  // Une série prévue reste prévue : on ne fait que changer ses chiffres (la coche du tableau la valide)
  const keep = set.done === false;
  setDraft = { entryId, idx, reps: set.reps, weight: set.weight || 0, wasDone: set.done !== false, keep };
  const last = historyOf(e.exId).find(h => h.date < UI.date);
  const values = Array.from({ length: 81 }, (_, i) => i * STEP); // 0 à 200 kg
  openSheet(`
    <div class="sheet-head">
      <div><div class="eyebrow">${t('setOf', { i: idx + 1, n: e.sets.length })}</div><h3>${esc(entryName(e))}</h3>${enLine(entryEn(e))}</div>
      <button class="icon-btn" onclick="closeSheet()" aria-label="${t('close')}">${icon('close')}</button>
    </div>
    <div class="set-editor">
      <div class="set-col">
        <p class="label">${t('weightHint')}</p>
        <div class="stack-scroll" id="set-stack">${stackHtml(values, setDraft.weight, 'pinSet')}</div>
      </div>
      <div class="set-col reps-col">
        <p class="label">${t('reps')}</p>
        <button class="round-btn" onclick="stepReps(1)" aria-label="${t('repPlus')}">${icon('plus')}</button>
        <input class="reps-input serif" id="reps" inputmode="numeric" value="${setDraft.reps ?? ''}" placeholder="0" onchange="setDraft.reps=numOrNull(this.value)" onfocus="this.select()" aria-label="${t('reps')}">
        <button class="round-btn" onclick="stepReps(-1)" aria-label="${t('repMinus')}">${icon('minus')}</button>
      </div>
    </div>
    <div class="solo">
      <span>${t('weightExact')} (kg)</span>
      <div class="weight-row">
        <div class="stepper">
          <button type="button" onclick="stepWeight(-1)" aria-label="${t('minus')}">${icon('minus')}</button>
          <input class="serif" id="weight-input" inputmode="decimal" value="${setDraft.weight ? fmtNum(setDraft.weight) : ''}" placeholder="0" onchange="setWeight(this.value)" onfocus="this.select()" aria-label="${t('weightAria')}">
          <button type="button" onclick="stepWeight(1)" aria-label="${t('plus')}">${icon('plus')}</button>
        </div>
        <div class="step-pick"><span class="muted small">${t('stepLabel')}</span><div class="seg small" id="wstep">${weightStepsHtml()}</div></div>
      </div>
    </div>
    <p class="muted small">${last ? t('lastTime', { when: relDay(last.date), what: esc(entrySummary(last.entry)) }) : t('firstTimeEx')}</p>
    <button class="btn-accent big" onclick="saveSet()">${setDraft.wasDone || keep ? t('save') : t('validateSet')}</button>
    ${setDraft.wasDone ? `<button class="link-danger" onclick="deleteSet()">${t('deleteSet')}</button>` : ''}`);
  const pin = $('#set-stack .plate.pin');
  if (pin) pin.scrollIntoView({ block: 'center' });
}
const weightStepsHtml = () => WEIGHT_STEPS.map(v =>
  `<button class="${v === weightStep() ? 'active' : ''}" aria-pressed="${v === weightStep()}" onclick="setWeightStep(${v})">${fmtNum(v)}</button>`).join('');
function setWeightStep(v) {
  try { localStorage.setItem('fitcoach-wstep', v); } catch (e) {}
  $('#wstep').innerHTML = weightStepsHtml();
}
// Le poids exact (au clavier ou avec + / −) et la pile restent d'accord
function showWeight(scroll) {
  const values = [...document.querySelectorAll('#set-stack .plate')].map(p => +p.dataset.v);
  const at = pinPlate(values, setDraft.weight);
  document.querySelectorAll('#set-stack .plate').forEach(p => {
    const pv = +p.dataset.v;
    p.classList.toggle('pin', pv === at);
    p.classList.toggle('lifted', pv < at);
    p.setAttribute('aria-pressed', pv === at);
  });
  const input = $('#weight-input');
  if (input) input.value = setDraft.weight ? fmtNum(setDraft.weight) : '';
  const pin = $('#set-stack .plate.pin');
  if (scroll && pin) pin.scrollIntoView({ block: 'nearest' });
}
function pinSet(v) { setDraft.weight = v; showWeight(false); }
function stepWeight(d) {
  const step = weightStep();
  setDraft.weight = Math.max(0, Math.round((setDraft.weight + d * step) * 100) / 100);
  showWeight(true);
}
function setWeight(v) { setDraft.weight = Math.max(0, numOrNull(v) || 0); showWeight(true); }
function stepReps(d) {
  setDraft.reps = Math.max(0, (setDraft.reps || 0) + d) || null;
  $('#reps').value = setDraft.reps ?? '';
}
function saveSet() {
  setDraft.reps = numOrNull($('#reps').value);
  setDraft.weight = Math.max(0, numOrNull($('#weight-input').value) || 0);
  const { entryId, idx, reps, weight, wasDone, keep } = setDraft;
  updateEntry(UI.date, entryId, e => {
    const old = e.sets[idx];
    // Les séries prévues ensuite suivent le nouveau poids (et les répétitions si elles étaient identiques)
    for (let k = idx + 1; k < e.sets.length; k++) {
      const s = e.sets[k];
      if (s.done !== false) continue;
      if (s.weight === old.weight) s.weight = weight || null;
      if (s.reps === old.reps) s.reps = reps;
    }
    e.sets[idx] = { reps, weight: weight || null, done: wasDone || !keep };
  });
  closeSheet();
  toast(wasDone || keep ? t('modified') : t('setDone'));
}
function deleteSet() {
  updateEntry(UI.date, setDraft.entryId, e => { e.sets.splice(setDraft.idx, 1); });
  closeSheet();
  toast(t('setDeleted'));
}

// ===== RÉGLAGES DE MUSCU =====
const moveLabel = m => (m && m.startsWith('mv_') ? t(m) : m || '');
const customMoves = exId => (prefs().moves || {})[exId] || [];
// « Machine · Sur le dos · banc incliné 30° · Bras tendus · cible : pectoraux »
function setupSummary(st) {
  if (!st) return '';
  const parts = [];
  if (st.machine) parts.push(t('machine'));
  if (st.dumbbells) parts.push(t('dumbbells'));
  if (st.position) parts.push(t('pos_' + st.position));
  if (st.bench) parts.push(t('benchSum', { b: t('bench_' + st.bench).toLowerCase() }) + (st.bench !== 'flat' && st.angle ? ` ${fmtNum(st.angle)}°` : ''));
  if (st.move) parts.push(moveLabel(st.move));
  if (st.target && st.target.length) parts.push(t('targetSum', { m: st.target.map(m => t('m_' + m).toLowerCase()).join(', ') }));
  return parts.join(' · ');
}
let setupDraft = null;
function renderSetup() {
  const box = $('#setup-box');
  if (!box) return;
  const st = setupDraft.setup;
  const chip = (on, action, label) => `<button class="chip${on ? ' active' : ''}" aria-pressed="${!!on}" onclick="${action}">${label}</button>`;
  const ex = findExercise(setupDraft.exId);
  const [p, sec] = musclesOf(ex);
  const moves = [...MOVES, ...customMoves(setupDraft.exId)];
  if (st.move && !moves.includes(st.move)) moves.push(st.move);
  box.innerHTML = `
    <p class="label">${t('setup')}</p>
    <div class="chips wrap">
      ${chip(st.machine, "toggleSetup('machine')", t('machine'))}
      ${chip(st.dumbbells, "toggleSetup('dumbbells')", t('dumbbells'))}
    </div>
    <p class="sub-label">${t('position')}</p>
    <div class="chips wrap">${POSITIONS.map(v => chip(st.position === v, `pickSetup('position','${v}')`, t('pos_' + v))).join('')}</div>
    <p class="sub-label">${t('bench')}</p>
    <div class="chips wrap">${BENCHES.map(v => chip(st.bench === v, `pickSetup('bench','${v}')`, t('bench_' + v))).join('')}</div>
    ${st.bench === 'incline' || st.bench === 'decline' ? `<div class="solo"><span>${t('benchAngle')}</span>${stepper(st.angle, 'stepAngle', 'setAngle', '—', t('benchAngle'))}</div>` : ''}
    <p class="muted small hint">${t('benchHint')}</p>
    <p class="sub-label">${t('move')}</p>
    <div class="chips wrap">${moves.map((v, i) => chip(st.move === v, `pickMove(${i})`, esc(moveLabel(v)))).join('')}
      ${setupDraft.addingMove ? '' : `<button class="chip dashed" onclick="setupDraft.addingMove=true;renderSetup();$('#move-new').focus()">${icon('plus')}${t('addMove')}</button>`}</div>
    ${setupDraft.addingMove ? `<div class="inline-add"><input class="input" id="move-new" maxlength="80" placeholder="${t('movePh')}" onkeydown="if(event.key==='Enter')addMove()">
      <button class="btn-accent" onclick="addMove()">${t('moveAdd')}</button></div><p class="muted small hint">${t('moveAddHint')}</p>` : ''}
    <p class="sub-label">${t('target')}</p>
    <div class="chips wrap">${MUSCLES.map(m => chip((st.target || []).includes(m), `toggleTarget('${m}')`, t('m_' + m))).join('')}</div>
    <p class="works">${pictoTile(ex, 'big')}<span>${p.length ? t('worksMost', { p: `<b>${p.map(m => t('m_' + m)).join(', ')}</b>` }) + (sec.length ? ' ' + t('worksAlso', { s: sec.map(m => t('m_' + m)).join(', ') }) : '') : t('worksUnknown')}</span></p>
    ${goalNote(ex) ? `<p class="goal-warn">${esc(goalNote(ex))}</p>` : ''}`;
  setupDraft.moves = moves;
}
function toggleSetup(k) { setupDraft.setup[k] = !setupDraft.setup[k]; renderSetup(); }
function pickSetup(k, v) { setupDraft.setup[k] = setupDraft.setup[k] === v ? null : v; renderSetup(); }
function pickMove(i) { const v = setupDraft.moves[i]; setupDraft.setup.move = setupDraft.setup.move === v ? null : v; renderSetup(); }
function toggleTarget(m) {
  const tg = setupDraft.setup.target || [];
  setupDraft.setup.target = tg.includes(m) ? tg.filter(x => x !== m) : [...tg, m];
  renderSetup();
}
function stepAngle(d) { setupDraft.setup.angle = Math.min(90, Math.max(0, (setupDraft.setup.angle || 0) + d * 5)) || null; renderSetup(); }
function setAngle(v) { setupDraft.setup.angle = numOrNull(v); }
function addMove() {
  const v = $('#move-new').value.trim().replace(/\s+/g, ' ');
  if (!v) return;
  const all = prefs().moves || {};
  const list = customMoves(setupDraft.exId);
  if (!list.includes(v)) savePrefs({ moves: { ...all, [setupDraft.exId]: [...list, v] } });
  setupDraft.setup.move = v;
  setupDraft.addingMove = false;
  renderSetup();
}
// Réglages vides : on n'enregistre rien
function cleanSetup(st) {
  const out = {};
  for (const [k, v] of Object.entries(st || {})) if (v && !(Array.isArray(v) && !v.length)) out[k] = v;
  if (!out.bench || out.bench === 'flat') delete out.angle;
  return Object.keys(out).length ? out : null;
}

// ===== DÉTAIL D'UN EXERCICE DE LA SÉANCE =====
function openEntry(entryId) {
  const e = (sessionOf(UI.date).entries || []).find(x => x.id === entryId);
  if (!e) return;
  if (e.kind !== 'sets') {
    draft = JSON.parse(JSON.stringify({ ...e, entryId: e.id }));
    draft.fields = fieldsFor(e.exId, e.kind, e);
    openTimeEditor(historyOf(e.exId).find(h => h.date < UI.date));
    return;
  }
  const id = esc(e.id);
  setupDraft = { exId: e.exId, setup: JSON.parse(JSON.stringify(e.setup || {})) };
  openSheet(`
    <div class="sheet-head">
      <div><div class="eyebrow">${esc(entrySummary(e))}</div><h3>${esc(entryName(e))}</h3>${enLine(entryEn(e))}</div>
      <button class="icon-btn" onclick="closeSheet()" aria-label="${t('close')}">${icon('close')}</button>
    </div>
    <div class="set-list">${e.sets.map((s, i) => `
      <button class="set-line" onclick="openSet('${id}',${i})">
        <span class="set-n">${i + 1}</span>
        <span class="set-val">${s.reps ?? '–'} × ${s.weight ? fmtNum(s.weight) + ' kg' : t('noWeight')}</span>
        ${s.done === false ? `<span class="muted small">${t('planned')}</span>` : `<span class="row-mark">${icon('check')}</span>`}
      </button>`).join('')}</div>
    <button class="btn-outline" onclick="addPlannedSet('${id}');closeSheet()">${icon('plus')}${t('addSet')}</button>
    <div class="setup-box" id="setup-box"></div>
    <label class="field" style="margin-top:16px"><span>${t('note')}</span>
      <textarea class="input" id="entry-note" rows="2" maxlength="300" placeholder="${t('notePh')}">${esc(e.note || '')}</textarea></label>
    <button class="btn-accent big" onclick="saveEntryDetails('${id}')">${t('save')}</button>
    <button class="link center-link" onclick="tipsFromEntry('${id}')">${t('tipsLink')}</button>
    <button class="link center-link" onclick="openVariant('${esc(e.exId)}')">${t('variant')}</button>
    <button class="link-danger" onclick="deleteEntry('${id}')">${t('deleteExercise')}</button>`);
  renderSetup();
}
function saveEntryDetails(entryId) {
  const note = $('#entry-note').value.trim();
  if (document.activeElement && document.activeElement.onchange) document.activeElement.onchange();
  const setup = cleanSetup(setupDraft.setup);
  updateEntry(UI.date, entryId, e => { e.note = note; if (setup) e.setup = setup; else delete e.setup; });
  closeSheet();
  toast(t('saved'));
}
function deleteEntry(entryId) {
  const e = (sessionOf(UI.date).entries || []).find(x => x.id === entryId);
  if (!e || !confirm(t('confirmDelete', { name: entryName(e) }))) return;
  const s = cloneSession(UI.date);
  s.entries = s.entries.filter(x => x.id !== entryId);
  saveSession(s);
  draft = null;
  closeSheet();
  toast(t('deleted'));
}

// ===== CONSEILS « BIEN FAIRE » =====
// Fiche ouverte depuis l'exercice en cours, le suivi ou le détail d'un exercice.
// back : rouvre le panneau d'où l'on vient (sans perdre ce qui était en cours de saisie).
const exNote = exId => (prefs().exNotes || {})[exId] || '';
function saveExNote(exId, v) {
  const notes = { ...(prefs().exNotes || {}) };
  const text = v.trim();
  if (text === exNote(exId)) return;
  if (text) notes[exId] = text; else delete notes[exId];
  savePrefs({ exNotes: notes });
}
function openTips(exId, back) {
  UI.tipsBack = back || null;
  const ex = findExercise(exId) || { id: exId, kind: 'sets', name: '' };
  const tip = TIPS[exId];
  const tx = tip && (tip[currentLang] || tip.fr);
  const musc = musclesLine(ex);
  const note = goalNote(ex);
  const spare = tip && tip.spare ? Object.entries(tip.spare).filter(([m]) => muscleGoal(m) === 'down').map(([, s]) => s) : [];
  const srcs = [tip && tip.src, ...spare.map(s => s.src)].filter(Boolean);
  const list = (items, cls, ic) => items.map(x => `<p class="tip-line"><span class="tip-mark ${cls}">${icon(ic)}</span><span>${esc(x)}</span></p>`).join('');
  openSheet(`
    <div class="sheet-head tips-head">
      ${pictoTile(ex, 'big')}
      <div class="tips-title"><div class="eyebrow">${t('tipsEyebrow')}</div><h3>${esc(exLabel(ex))}</h3>${enLine(exEn(ex))}
        ${musc ? `<p class="pick-musc">${esc(musc)}</p>` : ''}</div>
      <button class="icon-btn" onclick="closeTips()" aria-label="${UI.tipsBack ? t('back') : t('close')}">${icon(UI.tipsBack ? 'prev' : 'close')}</button>
    </div>
    ${tx && tx.do.length ? `<p class="tips-label ok">${t('tipsDo')}</p>${list(tx.do, 'ok', 'check')}` : ''}
    ${tx && tx.dont.length ? `<p class="tips-label no">${t('tipsDont')}</p>${list(tx.dont, 'no', 'close')}` : ''}
    ${!tx ? `<p class="muted small">${t('tipsNone')}</p>` : ''}
    ${note ? `<div class="tips-goal"><p class="tips-label warn">${t('tipsGoal')}</p>
      <p>${esc(spare.length ? spare.map(s => s[currentLang] || s.fr).join(' ') : note)}</p></div>` : ''}
    ${srcs.length ? `<p class="tips-src">${t(srcs.length > 1 ? 'sources' : 'source')} : ${srcs.map(([n, u]) => `<a href="${esc(u)}" target="_blank" rel="noopener">${esc(n)}</a>`).join(', ')}</p>` : ''}
    <label class="field tips-notes"><span>${t('exNotes')}</span>
      <textarea class="input" id="ex-notes" rows="2" maxlength="500" placeholder="${t('exNotesPh')}" onchange="saveExNote('${esc(exId)}', this.value)">${esc(exNote(exId))}</textarea></label>
    <p class="muted small hint">${t('exNotesHint')}</p>`);
}
function closeTips() {
  const n = $('#ex-notes');
  if (n && n.onchange) n.onchange();
  const back = UI.tipsBack;
  UI.tipsBack = null;
  if (back) back(); else closeSheet();
}
// Depuis l'éditeur cardio : on garde le brouillon et on y revient
function tipsFromEditor() {
  draft.note = $('#draft-note').value;
  if (document.activeElement && document.activeElement.onchange) document.activeElement.onchange();
  const d = draft, last = UI.editorLast;
  openTips(d.exId, () => { draft = d; openTimeEditor(last); });
}
// Depuis le détail muscu : on garde les réglages et le commentaire non enregistrés
function tipsFromEntry(entryId) {
  const note = $('#entry-note').value;
  const pending = setupDraft;
  openTips(pending.exId, () => { openEntry(entryId); setupDraft = pending; $('#entry-note').value = note; renderSetup(); });
}

// ===== CARDIO & COURS : LES CHAMPS DE L'EXERCICE =====
const stepper = (value, onStep, onSet, placeholder, label) => `
  <div class="stepper">
    <button type="button" onclick="${onStep}(-1)" aria-label="${t('minus')}">${icon('minus')}</button>
    <input class="serif" inputmode="decimal" value="${value === null || value === undefined ? '' : fmtNum(value)}" placeholder="${placeholder}" onchange="${onSet}(this.value)" onfocus="this.select()" aria-label="${label}">
    <button type="button" onclick="${onStep}(1)" aria-label="${t('plus')}">${icon('plus')}</button>
  </div>`;

function openTimeEditor(last) {
  const isNew = !draft.entryId;
  UI.editorLast = last;
  UI.addInfo = false;
  UI.newTrack = false;
  openSheet(`
    <div class="sheet-head">
      <div><div class="eyebrow">${KINDS[draft.kind].label}</div><h3>${esc(entryName(draft))}</h3>${enLine(entryEn(draft))}</div>
      <button class="icon-btn" onclick="closeSheet()" aria-label="${t('close')}">${icon('close')}</button>
    </div>
    <div id="editor-body"></div>
    <p class="muted small">${last ? t('lastTime', { when: relDay(last.date), what: esc(entrySummary(last.entry)) }) : t('firstTime')}</p>
    <label class="field"><span>${t('comment')}</span>
      <textarea class="input" id="draft-note" rows="2" maxlength="300" placeholder="${t('notePh')}">${esc(draft.note || '')}</textarea></label>
    <button class="btn-accent big" onclick="saveDraft()">${isNew ? t('done') : t('save')}</button>
    <button class="link center-link" onclick="tipsFromEditor()">${t('tipsLink')}</button>
    <button class="link center-link" onclick="openVariant('${esc(draft.exId)}')">${t('variant')}</button>
    ${isNew ? '' : `<button class="link-danger" onclick="deleteEntry('${esc(draft.entryId)}')">${t('deleteExercise')}</button>`}`);
  renderEditorBody();
}
function fieldHtml(k) {
  if (k === 'track') return trackFieldHtml();
  const v = draft[k];
  let hint = '';
  if (k === 'carry' && v) hint = t('carryTotal', { v: fmtNum(v * 2) });
  if (k === 'rpe') hint = t('rpeHint');
  return `<div class="solo"><span>${t('fld_' + k)}</span>${stepper(v, `stepField.bind(null,'${k}')`, `setField.bind(null,'${k}')`, '—', t('fs_' + k))}
    ${hint ? `<p class="muted small hint">${hint}</p>` : ''}</div>`;
}
function renderEditorBody() {
  const box = $('#editor-body');
  if (!box) return;
  const more = FIELD_ORDER.filter(k => !draft.fields.includes(k));
  box.innerHTML = draft.fields.map(fieldHtml).join('') + (!more.length ? '' : UI.addInfo ? `
    <div class="add-info">
      <p class="sub-label">${t('addInfo')}</p>
      <div class="chips wrap">${more.map(k => `<button class="chip dashed" onclick="addField('${k}')">${icon('plus')}${t('fs_' + k)}</button>`).join('')}</div>
      <p class="muted small hint">${t('addInfoHint')}</p>
    </div>` : `<button class="chip dashed add-info-btn" onclick="UI.addInfo=true;renderEditorBody()">${icon('plus')}${t('addInfo')}</button>`);
}
// Ajoute une info à l'exercice ; elle reste proposée les fois suivantes
function addField(k) {
  draft.fields = [...draft.fields, k];
  const all = prefs().extraFields || {};
  const mine = all[draft.exId] || [];
  if (!mine.includes(k)) savePrefs({ extraFields: { ...all, [draft.exId]: [...mine, k] } });
  UI.addInfo = false;
  renderEditorBody();
}
function stepField(field, dir) {
  const { step, max = Infinity } = FIELDS[field];
  const cur = draft[field];
  draft[field] = cur === null || cur === undefined ? (dir > 0 ? step : null) : Math.min(max, Math.max(0, Math.round((cur + dir * step) * 100) / 100)) || null;
  renderEditorBody();
}
function setField(field, v) {
  const n = numOrNull(v);
  draft[field] = n === null ? null : Math.min(FIELDS[field].max || Infinity, Math.max(0, n));
  if (field === 'carry') renderEditorBody();
}

// Pistes de référence : enregistrées une fois (nom, longueur facultative), puis choisies d'un geste
function trackFieldHtml() {
  const list = tracks();
  return `<div class="solo"><span>${t('fld_track')}</span>
    <div class="chips wrap">${list.map(tr => `<button class="chip${draft.track === tr.id ? ' active' : ''}" aria-pressed="${draft.track === tr.id}" onclick="pickTrack('${esc(tr.id)}')">${esc(tr.name)}${tr.length ? ` · ${t('trackLen', { v: fmtNum(tr.length) })}` : ''}</button>`).join('')}
      ${UI.newTrack ? '' : `<button class="chip dashed" onclick="UI.newTrack=true;renderEditorBody();$('#track-name').focus()">${icon('plus')}${t('newTrack')}</button>`}</div>
    ${!list.length && !UI.newTrack ? `<p class="muted small hint">${t('noTrack')}</p>` : ''}
    ${UI.newTrack ? `<div class="track-form">
      <input class="input" id="track-name" maxlength="40" placeholder="${t('trackNamePh')}" aria-label="${t('trackName')}">
      <label class="field"><span>${t('trackLength')}</span><input class="input" id="track-length" inputmode="decimal" placeholder="—"></label>
      <p class="muted small hint">${t('trackLengthHint')}</p>
      <button class="btn-accent" onclick="addTrack()">${t('trackAdd')}</button>
    </div>` : ''}</div>`;
}
function pickTrack(id) { draft.track = draft.track === id ? null : id; renderEditorBody(); }
function addTrack() {
  const name = $('#track-name').value.trim().replace(/\s+/g, ' ');
  if (!name) { $('#track-name').focus(); return; }
  const tr = { id: 't' + Date.now().toString(36), name };
  const len = numOrNull($('#track-length').value);
  if (len) tr.length = len;
  savePrefs({ tracks: [...tracks(), tr] });
  draft.track = tr.id;
  UI.newTrack = false;
  renderEditorBody();
}

function saveDraft() {
  if (document.activeElement && document.activeElement.onchange) document.activeElement.onchange();
  const entry = { id: draft.entryId || 'e' + Date.now().toString(36), exId: draft.exId, name: draft.name, kind: draft.kind, note: $('#draft-note').value.trim() };
  for (const k of draft.fields) entry[k] = draft[k] ?? null;
  const s = cloneSession(UI.date);
  const i = s.entries.findIndex(e => e.id === entry.id);
  if (i >= 0) s.entries[i] = entry; else s.entries.push(entry);
  saveSession(s);
  draft = null;
  closeSheet();
  toast(i >= 0 ? t('modified') : t('saved'));
}

// ===== ONGLET SUIVI =====
function renderTrack() {
  const now = new Date();
  if (!UI.month) UI.month = new Date(now.getFullYear(), now.getMonth(), 1);
  const month = sessionsInRange(isoDate(new Date(now.getFullYear(), now.getMonth(), 1)), isoDate());
  const monthName = now.toLocaleDateString(locale(), { month: 'long' });

  $('#view').innerHTML = `
    <div class="page-head">
      <div class="head-row"><span class="eyebrow">${cap(monthName)}</span></div>
      <h1>${month ? tn('sessionsStacked', month) : t('noSessionMonth')}</h1>
      <p class="muted small">${t('trackHint', { goal: weeklyGoal() })}</p>
    </div>
    <section class="card">${weeksHtml()}</section>
    <section class="card">${musclesCardHtml()}</section>
    <section class="card">${calendarHtml()}</section>
    <section class="card">
      <h2 class="card-title">${t('byExercise')}</h2>
      ${exerciseListHtml()}
    </section>`;
}

function weeksHtml() {
  const goal = weeklyGoal();
  const thisMonday = mondayOf(new Date());
  const counts = {};
  for (const s of activeSessions()) {
    const k = isoDate(mondayOf(toDate(s.id)));
    counts[k] = (counts[k] || 0) + 1;
  }
  const cols = [];
  for (let i = 7; i >= 0; i--) {
    const mon = addDays(thisMonday, -7 * i);
    const n = counts[isoDate(mon)] || 0;
    const slots = Math.max(goal, n, 1);
    const plates = Array.from({ length: slots }, (_, k) =>
      `<span class="wplate ${k < n ? 'full' : 'goal'}"></span>`).join('');
    const label = `${mon.getDate()}/${mon.getMonth() + 1}`;
    cols.push(`<div class="wcol${i === 0 ? ' now' : ''}" role="img" aria-label="${i === 0 ? t('thisWeek') : t('weekOf', { date: fmtShort(isoDate(mon)) })} : ${n ? tn('workouts', n) : t('noWorkout')}">
      <span class="wcount">${n || ''}</span><div class="wstack">${plates}</div><span class="wlabel">${label}</span></div>`);
  }
  return `<div class="weeks">${cols.join('')}</div>`;
}

// Calendrier d'un mois : jours de sport en vert. Sert au Suivi et au choix « Autre jour ».
function calendarGrid(m, { selected, action, prev, next }) {
  const today = isoDate();
  const y = m.getFullYear(), mo = m.getMonth();
  const daysInMonth = new Date(y, mo + 1, 0).getDate();
  const end = addDays(mondayOf(new Date(y, mo, daysInMonth)), 6);
  const done = new Set(activeSessions().map(s => s.id));
  const isCurrent = y === new Date().getFullYear() && mo === new Date().getMonth();
  let cells = '';
  for (let d = mondayOf(m); d <= end; d = addDays(d, 1)) {
    const id = isoDate(d);
    if (d.getMonth() !== mo) { cells += `<span class="cal-cell out"></span>`; continue; }
    const cls = ['cal-cell', done.has(id) && 'done', id === today && 'today', id > today && 'future', id === selected && 'sel'].filter(Boolean).join(' ');
    const label = `${fmtDay(id)}${done.has(id) ? t('workoutMark') : ''}`;
    cells += id > today
      ? `<span class="${cls}">${d.getDate()}</span>`
      : `<button class="${cls}" onclick="${action}('${id}')" aria-label="${esc(label)}">${d.getDate()}</button>`;
  }
  const lastDay = isCurrent ? new Date().getDate() : daysInMonth;
  const active = [...done].filter(id => id.startsWith(`${y}-${pad(mo + 1)}`)).length;
  const monthName = m.toLocaleDateString(locale(), { month: 'long', year: 'numeric' });
  return `
    <div class="cal-head">
      <button class="icon-btn" onclick="${prev}" aria-label="${t('prevMonth')}">${icon('prev')}</button>
      <h2 class="card-title">${cap(monthName)}</h2>
      <button class="icon-btn" onclick="${next}" aria-label="${t('nextMonth')}" ${isCurrent ? 'disabled' : ''}>${icon('chev')}</button>
    </div>
    <div class="cal-grid">${[...t('dow')].map(d => `<span class="cal-dow">${d}</span>`).join('')}${cells}</div>
    <div class="cal-foot">
      <span><span class="legend-dot on"></span>${tn('daysSport', active)}</span>
      <span><span class="legend-dot"></span>${t('daysRest', { n: Math.max(0, lastDay - active) })}</span>
    </div>`;
}
const monthStart = d => new Date(d.getFullYear(), d.getMonth(), 1);
const shiftedMonth = (m, n) => { const x = new Date(m.getFullYear(), m.getMonth() + n, 1); return x > new Date() ? m : x; };

function calendarHtml() {
  return calendarGrid(UI.month, { selected: UI.selDay, action: 'selectDay', prev: 'shiftMonth(-1)', next: 'shiftMonth(1)' }) + dayDetailHtml();
}

// « Autre jour » : même calendrier, pour aller noter ou revoir une séance passée
function openDayPicker() {
  UI.pickMonth = monthStart(toDate(UI.date));
  openSheet(`
    <div class="sheet-head"><h3>${t('otherDay')}</h3>
      <button class="icon-btn" onclick="closeSheet()" aria-label="${t('close')}">${icon('close')}</button></div>
    <div id="day-picker"></div>`, renderDayPicker);
}
function renderDayPicker() {
  const box = $('#day-picker');
  if (box) box.innerHTML = calendarGrid(UI.pickMonth, { selected: UI.date, action: 'goToDay', prev: 'pickMonthShift(-1)', next: 'pickMonthShift(1)' });
}
function pickMonthShift(n) { UI.pickMonth = shiftedMonth(UI.pickMonth, n); renderDayPicker(); }

function dayDetailHtml() {
  if (!UI.selDay) return `<p class="muted small cal-hint">${t('tapDay')}</p>`;
  const entries = ((sessionOf(UI.selDay) || {}).entries || []).filter(entryDone);
  return `<div class="day-detail">
    <p class="day-detail-title">${esc(cap(fmtDay(UI.selDay)))}</p>
    ${entries.length
      ? entries.map(e => `<div class="day-line"><span>${esc(entryName(e))}</span><span>${esc(entrySummary(e))}</span></div>`).join('')
        + `<button class="btn-outline" onclick="goToDay('${UI.selDay}')">${t('viewEdit')}</button>`
      : `<p class="muted small">${t('noSportDay')}</p><button class="btn-outline" onclick="goToDay('${UI.selDay}')">${t('addThatDay')}</button>`}
  </div>`;
}

function selectDay(id) { UI.selDay = UI.selDay === id ? null : id; render(); }
function shiftMonth(n) {
  UI.month = shiftedMonth(UI.month, n);
  UI.selDay = null;
  render();
}

// Valeur suivie pour un exercice : charge max, total de répétitions, ou durée
function metricFor(kind, hist) {
  if (kind === 'sets') {
    const withWeight = hist.some(h => doneSets(h.entry).some(s => s.weight));
    return withWeight
      ? { title: t('maxLoad'), fmt: v => `${fmtNum(v)} kg`, get: e => maxWeight(e) || null }
      : { title: t('totalReps'), fmt: v => t('repsUnit', { v: fmtNum(v) }), get: e => doneSets(e).reduce((t, s) => t + (s.reps || 0), 0) || null };
  }
  if (hist.some(h => h.entry.laps)) return { title: t('lapsTitle'), fmt: v => fmtNum(v), get: e => e.laps || null };
  return { title: t('durationMin'), fmt: v => `${fmtNum(v)} min`, get: e => e.duration || null };
}

function exerciseListHtml() {
  const byEx = new Map();
  for (const s of activeSessions()) for (const e of s.entries) {
    if (!entryDone(e)) continue;
    if (!byEx.has(e.exId)) byEx.set(e.exId, { id: e.exId, name: e.name, kind: e.kind, last: s.id, entry: e, count: 0 });
    byEx.get(e.exId).count++;
  }
  if (!byEx.size) return `<p class="muted small">${t('emptyExercises')}</p>`;
  return `<div class="ex-list">${[...byEx.values()].map(x => {
    const metric = metricFor(x.kind, historyOf(x.id));
    const v = metric.get(x.entry);
    return `<button class="row flat" onclick="openExercise('${esc(x.id)}')">${pictoTile(exOfEntry(x.entry))}
      <span class="row-main"><span class="row-name">${esc(entryName(x.entry))}</span>${enLine(entryEn(x.entry))}
      <span class="row-sub">${tn('times', x.count, { when: relDay(x.last) })}</span></span>
      <span class="row-val">${v ? metric.fmt(v) : ''}</span>${icon('chev')}
    </button>`;
  }).join('')}</div>`;
}

function openExercise(exId) {
  const hist = historyOf(exId);
  if (!hist.length) return;
  const first = hist[0].entry;
  const metric = metricFor(first.kind, hist);
  const pts = hist.slice().reverse()
    .map(h => ({ date: h.date, value: metric.get(h.entry), entry: h.entry }))
    .filter(p => p.value !== null)
    .map(p => ({ ...p, tip: `${esc(fmtShort(p.date))}<br><b>${esc(metric.fmt(p.value))}</b><br>${esc(entrySummary(p.entry))}` }));
  let story = '';
  if (pts.length >= 2) {
    const a = pts[0].value, b = pts[pts.length - 1].value, diff = b - a;
    const vars = { a: metric.fmt(a), b: metric.fmt(b), date: esc(fmtDM(pts[0].date)) };
    story = t(diff > 0 ? 'storyUp' : diff < 0 ? 'storyDown' : 'storyFlat', vars);
  }
  openSheet(`
    <div class="sheet-head">
      <div><div class="eyebrow">${tn('workouts', hist.length)}</div><h3>${esc(entryName(first))}</h3>${enLine(entryEn(first))}</div>
      <button class="icon-btn" onclick="closeSheet()" aria-label="${t('close')}">${icon('close')}</button>
    </div>
    ${story ? `<p class="story">${story}</p>` : ''}
    ${progressionHtml(exId)}
    <p class="label">${metric.title}</p>
    ${pts.length >= 2 ? `<div class="chart" id="ex-chart"></div>` : `<p class="muted small">${t('curveLater')}</p>`}
    <ul class="history">${hist.map(h => `
      <li><span class="h-date">${esc(cap(fmtDay(h.date)))}</span><span>${esc(entrySummary(h.entry))}</span>
      ${setupSummary(h.entry.setup) ? `<span class="h-setup">${esc(setupSummary(h.entry.setup))}</span>` : ''}
      ${h.entry.note ? `<span class="h-note">${esc(h.entry.note)}</span>` : ''}</li>`).join('')}</ul>
    <button class="btn-outline" onclick="openTips('${esc(exId)}')">${t('tipsLink')}</button>
    ${(findExercise(exId) || {}).custom ? `<button class="btn-outline" onclick="openAttach('${esc(exId)}')">${t('attachPick')}</button>` : ''}
    ${findExercise(exId) ? `<button class="btn-outline" onclick="openVariant('${esc(exId)}')">${icon('plus')}${t('variant')}</button>` : ''}`);
  if (pts.length >= 2) lineChart($('#ex-chart'), pts);
}

// ===== MON COMPTE =====
function openMenu() {
  openSheet(`
    <div class="sheet-head">
      <div><div class="eyebrow">${t('account')}</div><h3>${esc(Data.user.email)}</h3></div>
      <button class="icon-btn" onclick="closeSheet()" aria-label="${t('close')}">${icon('close')}</button>
    </div>
    ${DEMO ? `<p class="demo-note">${t('demoMenu')}</p>` : ''}
    <div class="goal">
      <span>${t('weeklyGoal')}</span>
      <div class="stepper small">
        <button type="button" onclick="changeGoal(-1)" aria-label="${t('minus')}">${icon('minus')}</button>
        <span class="serif" id="goal-val">${weeklyGoal()}</span>
        <button type="button" onclick="changeGoal(1)" aria-label="${t('plus')}">${icon('plus')}</button>
      </div>
    </div>
    <div class="goal"><span>${t('language')}</span>${langSwitchHtml()}</div>
    <div class="menu-list">
      ${DEMO ? `<button class="btn-line" onclick="Backend.resetDemo()">${t('resetDemo')}</button>` : ''}
      <button class="btn-line" onclick="openMyExercises()">${t('myExercises')}</button>
      <button class="btn-line" onclick="openGoals()">${t('goalsTitle')}${goalsSummary() ? `<span class="btn-sub">${esc(goalsSummary())}</span>` : ''}</button>
      <button class="btn-line" onclick="logout()">${t('logout')}</button>
    </div>`);
}
function changeGoal(d) {
  const g = Math.min(7, Math.max(1, weeklyGoal() + d));
  savePrefs({ weeklyGoal: g });
  $('#goal-val').textContent = g;
}
function logout() { closeSheet(); Backend.logout(); }

// ===== PANNEAU DU BAS =====
// Le bouton retour d'Android ferme le panneau au lieu de quitter l'appli.
let sheetRefresh = null;
function openSheet(html, refresh) {
  const sheet = $('#sheet');
  sheet.innerHTML = html;
  sheet.scrollTop = 0;
  sheetRefresh = refresh || null;
  if (sheet.classList.contains('hidden')) {
    sheet.classList.remove('hidden');
    $('#backdrop').classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    history.pushState({ sheet: true }, '');
  }
  if (refresh) refresh();
}
function hideSheet() {
  $('#sheet').classList.add('hidden');
  $('#backdrop').classList.add('hidden');
  $('#sheet').innerHTML = '';
  document.body.style.overflow = '';
  sheetRefresh = null;
}
function closeSheet() {
  if ($('#sheet').classList.contains('hidden')) return;
  hideSheet();
  if (history.state && history.state.sheet) history.back();
}
window.addEventListener('popstate', () => { if (!$('#sheet').classList.contains('hidden')) hideSheet(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeSheet(); });

// ===== CONNEXION =====
let authMode = 'login';
function switchAuth(mode) {
  authMode = mode;
  $('#tab-login').classList.toggle('active', mode === 'login');
  $('#tab-register').classList.toggle('active', mode === 'register');
  $('#auth-submit').textContent = mode === 'login' ? t('login') : t('createAccount');
  $('#auth-password').autocomplete = mode === 'login' ? 'current-password' : 'new-password';
  $('#auth-forgot').classList.toggle('hidden', mode !== 'login');
  authMsg('');
}
function authMsg(text, ok) {
  const el = $('#auth-msg');
  el.textContent = text;
  el.classList.toggle('hidden', !text);
  el.classList.toggle('ok', !!ok);
}
async function submitAuth(ev) {
  ev.preventDefault();
  const email = $('#auth-email').value.trim(), pw = $('#auth-password').value;
  const btn = $('#auth-submit');
  btn.disabled = true;
  authMsg('');
  try {
    await (authMode === 'login' ? Backend.login(email, pw) : Backend.register(email, pw));
  } catch (e) {
    authMsg(authMessage(e.code));
  }
  btn.disabled = false;
}
async function forgotPassword() {
  const email = $('#auth-email').value.trim();
  if (!email) { authMsg(t('forgotNeedEmail')); return; }
  try {
    await Backend.reset(email);
    authMsg(t('resetSent'), true);
  } catch (e) { authMsg(authMessage(e.code)); }
}

// ===== DÉMARRAGE =====
applyTranslations();
startAuth(user => {
  $('#auth-screen').classList.toggle('hidden', !!user);
  $('#app').classList.toggle('hidden', !user);
  $('#nav').classList.toggle('hidden', !user);
  $('#demo-note').classList.toggle('hidden', !DEMO);
  if (user) { UI.date = isoDate(); render(); }
  else hideSheet();
});

// Au retour dans l'appli le lendemain, « aujourd'hui » doit suivre
let knownToday = isoDate();
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState !== 'visible' || !Data.user || knownToday === isoDate()) return;
  if (UI.date === knownToday) UI.date = isoDate();
  knownToday = isoDate();
  render();
});

if ('serviceWorker' in navigator && location.protocol === 'https:') {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
