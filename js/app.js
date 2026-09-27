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
function stackHtml(values, pin, action, cls = '') {
  return `<div class="stack ${cls}" role="group" aria-label="${t('stackAria')}">${values.map(v => {
    const state = v === pin ? 'pin' : v < pin ? 'lifted' : '';
    return `<button type="button" class="plate ${state}" data-v="${v}" onclick="${action}(${v})" aria-pressed="${v === pin}" aria-label="${v ? t('kilos', { w: fmtNum(v) }) : t('plateNoneAria')}">${plateLabel(v)}</button>`;
  }).join('')}</div>`;
}
function windowAround(w, n = 5) {
  const start = Math.max(0, w - STEP * Math.floor(n / 2));
  return Array.from({ length: n }, (_, i) => start + i * STEP);
}
// Petite pile décorative : plus il y a de plaques levées, plus c'est lourd par rapport à tes habitudes
function miniStack(e) {
  if (e.kind !== 'sets') return `<span class="mini mini-icon">${icon('timer')}</span>`;
  const hist = historyOf(e.exId).map(h => maxWeight(h.entry)).filter(Boolean);
  const w = maxWeight(e);
  let lit = 0;
  if (w) {
    const lo = Math.min(...hist, w), hi = Math.max(...hist, w);
    lit = hi === lo ? 3 : 1 + Math.round(4 * (w - lo) / (hi - lo));
  }
  return `<span class="mini" aria-hidden="true">${Array.from({ length: 6 }, (_, i) =>
    `<span class="${i < lit - 1 ? 'on' : i === lit - 1 ? 'pin' : ''}"></span>`).join('')}</span>`;
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
onDataChange = () => { render(); if (sheetRefresh) sheetRefresh(); };
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
      ${quickFavs()}
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
  return `<button class="row" onclick="openEntry('${esc(e.id)}')">${miniStack(e)}
    <span class="row-main"><span class="row-name">${esc(entryName(e))}</span><span class="row-sub">${esc(sub)}</span>
    ${e.note ? `<span class="row-note">${esc(e.note)}</span>` : ''}</span>${mark}</button>`;
}

// L'exercice en cours : une grande carte avec la pile et « Série faite »
function currentCard(e) {
  const i = pendingIndex(e);
  const set = e.sets[i];
  const w = set.weight || 0;
  const id = esc(e.id);
  return `<section class="now" aria-label="${t('currentAria')}">
    ${stackHtml(windowAround(w), w, `pinCurrent.bind(null,'${id}')`, 'compact')}
    <div class="now-main">
      <div class="eyebrow">${t('setOf', { i: i + 1, n: e.sets.length })}</div>
      <h2 class="now-name">${esc(entryName(e))}</h2>
      <button class="now-value" onclick="openSet('${id}',${i})" aria-label="${t('changeNumbers')}">
        <span class="serif">${set.reps || '–'}</span><span class="now-unit">× ${w ? fmtNum(w) + ' kg' : t('noWeight')}</span>
      </button>
      <button class="btn-accent" onclick="finishSet('${id}')">${icon('check')}${t('setDone')}</button>
      <div class="now-links">
        <button onclick="addPlannedSet('${id}')">${t('addSetShort')}</button>
        <button onclick="finishAll('${id}')">${t('validateAll')}</button>
        <button onclick="stopEntry('${id}')">${t('stopHere')}</button>
      </div>
    </div>
  </section>`;
}

function pinCurrent(entryId, v) {
  updateEntry(UI.date, entryId, e => {
    const i = pendingIndex(e);
    // Le nouveau poids vaut pour cette série et les suivantes
    for (let k = i; k < e.sets.length; k++) if (e.sets[k].done === false) e.sets[k].weight = v || null;
  });
}
function finishSet(entryId) {
  const e = updateEntry(UI.date, entryId, e => { e.sets[pendingIndex(e)].done = true; });
  if (e) toast(pendingIndex(e) < 0 ? t('exerciseDone') : t('setNDone', { n: doneSets(e).length }));
}
function finishAll(entryId) {
  updateEntry(UI.date, entryId, e => e.sets.forEach(s => { s.done = true; }));
  toast(t('exerciseDone'));
}
function addPlannedSet(entryId) {
  updateEntry(UI.date, entryId, e => { e.sets.push({ ...e.sets[e.sets.length - 1], done: false }); });
}
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
    <button class="pick-main" onclick="pickExercise('${esc(ex.id)}')"><span class="pick-name">${esc(exLabel(ex))}</span></button>
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
  return `<div class="pick">
    <button class="pick-main" onclick="pickExercise('${esc(ex.id)}')"><span class="pick-name">${esc(exLabel(ex))}</span><span class="pick-sub">${esc(sub)}</span></button>
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
let createConfirm = false;
function openCreate() {
  const name = UI.search.trim();
  createConfirm = false;
  const groupFor = ['upper', 'lower', 'core', 'cardio', 'class'];
  openSheet(`
    <div class="sheet-head"><h3>${t('newExercise')}</h3>
      <button class="icon-btn" onclick="closeSheet()" aria-label="${t('close')}">${icon('close')}</button></div>
    <label class="field"><span>${t('name')}</span>
      <input class="input" id="new-name" value="${esc(name)}" maxlength="60" placeholder="${t('namePh')}" oninput="createConfirm=false;renderSimilar()" autocomplete="off"></label>
    <div id="similar"></div>
    <p class="field"><span>${t('whatToLog')}</span></p>
    <div class="kinds" role="radiogroup">${Object.entries(KINDS).map(([k, v], i) => `
      <button class="kind${i === 0 ? ' active' : ''}" data-kind="${k}" role="radio" aria-checked="${i === 0}" onclick="selectKind(this)">
        <span class="kind-label">${v.label}</span><span class="kind-hint">${v.hint}</span></button>`).join('')}</div>
    <p class="field"><span>${t('categoryHint')}</span></p>
    <div class="chips wrap" id="new-group" role="radiogroup">${GROUPS.filter(g => groupFor.includes(g.id)).map(g =>
      `<button class="chip" data-g="${g.id}" role="radio" aria-checked="false" onclick="selectGroup(this)">${g.label}</button>`).join('')}</div>
    <button class="btn-accent big" id="create-btn" onclick="createExercise()">${t('createStart')}</button>`);
  renderSimilar();
  if (!name) $('#new-name').focus();
}
function selectKind(btn) {
  document.querySelectorAll('.kind').forEach(b => { b.classList.toggle('active', b === btn); b.setAttribute('aria-checked', b === btn); });
}
function selectGroup(btn) {
  const on = !btn.classList.contains('active');
  document.querySelectorAll('#new-group .chip').forEach(b => { b.classList.toggle('active', on && b === btn); b.setAttribute('aria-checked', on && b === btn); });
}
function renderSimilar() {
  const box = $('#similar');
  if (!box) return;
  const sim = similarExercises($('#new-name').value);
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
  if (sim.length && !createConfirm) {
    createConfirm = true;
    renderSimilar();
    $('#similar').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    return;
  }
  const g = document.querySelector('#new-group .chip.active');
  const ex = { id: 'c-' + Date.now().toString(36), name, kind: $('.kind.active').dataset.kind, createdAt: Date.now() };
  if (g) ex.group = g.dataset.g;
  saveCustomExercise(ex);
  toast(t('created', { name }));
  pickExercise(ex.id, { ...ex, group: ex.group || 'custom', custom: true });
}

function pickExercise(id, exObj) {
  const ex = exObj || findExercise(id);
  const last = historyOf(ex.id)[0];
  const le = last && last.entry;
  if (ex.kind === 'sets') {
    // On prévoit les séries de la dernière fois : il suffit ensuite de toucher « Série faite »
    const base = le ? doneSets(le) : [];
    const sets = (base.length ? base : [0, 1, 2].map(() => ({ reps: 10, weight: null })))
      .map(s => ({ reps: s.reps ?? null, weight: s.weight ?? null, done: false }));
    const s = cloneSession(UI.date);
    s.entries.push({ id: 'e' + Date.now().toString(36), exId: ex.id, name: ex.name, kind: 'sets', note: '', sets });
    saveSession(s);
    closeSheet();
    setTimeout(() => $('.now') && $('.now').scrollIntoView({ behavior: 'smooth', block: 'center' }), 50);
    return;
  }
  draft = { entryId: null, exId: ex.id, name: ex.name, kind: ex.kind, note: '',
    duration: le && le.duration ? le.duration : (ex.kind === 'cardio' ? 20 : 30), distance: le && le.distance ? le.distance : null };
  openTimeEditor(last);
}

// ===== RÉGLER UNE SÉRIE (grande pile) =====
function openSet(entryId, idx) {
  const e = (sessionOf(UI.date).entries || []).find(x => x.id === entryId);
  if (!e) return;
  const set = e.sets[idx];
  setDraft = { entryId, idx, reps: set.reps, weight: set.weight || 0, wasDone: set.done !== false };
  const last = historyOf(e.exId).find(h => h.date < UI.date);
  const values = Array.from({ length: 81 }, (_, i) => i * STEP); // 0 à 200 kg
  openSheet(`
    <div class="sheet-head">
      <div><div class="eyebrow">${t('setOf', { i: idx + 1, n: e.sets.length })}</div><h3>${esc(entryName(e))}</h3></div>
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
        <p class="weight-read" id="weight-read">${setDraft.weight ? fmtNum(setDraft.weight) + ' kg' : t('noWeight')}</p>
      </div>
    </div>
    <p class="muted small">${last ? t('lastTime', { when: relDay(last.date), what: esc(entrySummary(last.entry)) }) : t('firstTimeEx')}</p>
    <button class="btn-accent big" onclick="saveSet()">${setDraft.wasDone ? t('save') : t('validateSet')}</button>
    ${setDraft.wasDone ? `<button class="link-danger" onclick="deleteSet()">${t('deleteSet')}</button>` : ''}`);
  const pin = $('#set-stack .plate.pin');
  if (pin) pin.scrollIntoView({ block: 'center' });
}
function pinSet(v) {
  setDraft.weight = v;
  document.querySelectorAll('#set-stack .plate').forEach(p => {
    const pv = +p.dataset.v;
    p.classList.toggle('pin', pv === v);
    p.classList.toggle('lifted', pv < v);
    p.setAttribute('aria-pressed', pv === v);
  });
  $('#weight-read').textContent = v ? fmtNum(v) + ' kg' : t('noWeight');
}
function stepReps(d) {
  setDraft.reps = Math.max(0, (setDraft.reps || 0) + d) || null;
  $('#reps').value = setDraft.reps ?? '';
}
function saveSet() {
  setDraft.reps = numOrNull($('#reps').value);
  const { entryId, idx, reps, weight, wasDone } = setDraft;
  updateEntry(UI.date, entryId, e => {
    const old = e.sets[idx];
    // Les séries prévues ensuite suivent le nouveau poids (et les répétitions si elles étaient identiques)
    for (let k = idx + 1; k < e.sets.length; k++) {
      const s = e.sets[k];
      if (s.done !== false) continue;
      if (s.weight === old.weight) s.weight = weight || null;
      if (s.reps === old.reps) s.reps = reps;
    }
    e.sets[idx] = { reps, weight: weight || null, done: true };
  });
  closeSheet();
  toast(wasDone ? t('modified') : t('setDone'));
}
function deleteSet() {
  updateEntry(UI.date, setDraft.entryId, e => { e.sets.splice(setDraft.idx, 1); });
  closeSheet();
  toast(t('setDeleted'));
}

// ===== DÉTAIL D'UN EXERCICE DE LA SÉANCE =====
function openEntry(entryId) {
  const e = (sessionOf(UI.date).entries || []).find(x => x.id === entryId);
  if (!e) return;
  if (e.kind !== 'sets') {
    draft = JSON.parse(JSON.stringify({ duration: 30, distance: null, ...e, entryId: e.id }));
    openTimeEditor(historyOf(e.exId).find(h => h.date < UI.date));
    return;
  }
  const id = esc(e.id);
  openSheet(`
    <div class="sheet-head">
      <div><div class="eyebrow">${esc(entrySummary(e))}</div><h3>${esc(entryName(e))}</h3></div>
      <button class="icon-btn" onclick="closeSheet()" aria-label="${t('close')}">${icon('close')}</button>
    </div>
    <div class="set-list">${e.sets.map((s, i) => `
      <button class="set-line" onclick="openSet('${id}',${i})">
        <span class="set-n">${i + 1}</span>
        <span class="set-val">${s.reps ?? '–'} × ${s.weight ? fmtNum(s.weight) + ' kg' : t('noWeight')}</span>
        ${s.done === false ? `<span class="muted small">${t('planned')}</span>` : `<span class="row-mark">${icon('check')}</span>`}
      </button>`).join('')}</div>
    <button class="btn-outline" onclick="addPlannedSet('${id}');closeSheet()">${icon('plus')}${t('addSet')}</button>
    <label class="field" style="margin-top:16px"><span>${t('note')}</span>
      <textarea class="input" id="entry-note" rows="2" maxlength="300" placeholder="${t('notePh')}">${esc(e.note || '')}</textarea></label>
    <button class="btn-accent big" onclick="saveEntryNote('${id}')">${t('save')}</button>
    <button class="link-danger" onclick="deleteEntry('${id}')">${t('deleteExercise')}</button>`);
}
function saveEntryNote(entryId) {
  const note = $('#entry-note').value.trim();
  updateEntry(UI.date, entryId, e => { e.note = note; });
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

// ===== CARDIO & COURS : DURÉE (ET DISTANCE) =====
const stepper = (value, onStep, onSet, placeholder, label) => `
  <div class="stepper">
    <button type="button" onclick="${onStep}(-1)" aria-label="${t('minus')}">${icon('minus')}</button>
    <input class="serif" inputmode="decimal" value="${value === null || value === undefined ? '' : fmtNum(value)}" placeholder="${placeholder}" onchange="${onSet}(this.value)" onfocus="this.select()" aria-label="${label}">
    <button type="button" onclick="${onStep}(1)" aria-label="${t('plus')}">${icon('plus')}</button>
  </div>`;

function openTimeEditor(last) {
  const isNew = !draft.entryId;
  openSheet(`
    <div class="sheet-head">
      <div><div class="eyebrow">${KINDS[draft.kind].label}</div><h3>${esc(entryName(draft))}</h3></div>
      <button class="icon-btn" onclick="closeSheet()" aria-label="${t('close')}">${icon('close')}</button>
    </div>
    <div id="editor-body"></div>
    <p class="muted small">${last ? t('lastTime', { when: relDay(last.date), what: esc(entrySummary(last.entry)) }) : t('firstTime')}</p>
    <textarea class="input" id="draft-note" rows="1" maxlength="300" placeholder="${t('noteOptional')}">${esc(draft.note || '')}</textarea>
    <button class="btn-accent big" onclick="saveDraft()">${isNew ? t('done') : t('save')}</button>
    ${isNew ? '' : `<button class="link-danger" onclick="deleteEntry('${esc(draft.entryId)}')">${t('deleteExercise')}</button>`}`);
  renderEditorBody();
}
function renderEditorBody() {
  const box = $('#editor-body');
  if (!box) return;
  box.innerHTML = `
    <div class="solo"><span>${t('durationMin')}</span>${stepper(draft.duration, "stepField.bind(null,'duration',5)", "setField.bind(null,'duration')", '0', t('durationAria'))}</div>
    ${draft.kind === 'cardio' ? `<div class="solo"><span>${t('distanceKm')}</span>${stepper(draft.distance, "stepField.bind(null,'distance',0.5)", "setField.bind(null,'distance')", '—', t('distanceAria'))}</div>` : ''}`;
}
function stepField(field, step, dir) {
  const cur = draft[field];
  draft[field] = cur === null || cur === undefined ? (dir > 0 ? step : null) : Math.max(0, cur + dir * step) || null;
  renderEditorBody();
}
function setField(field, v) { draft[field] = numOrNull(v); }

function saveDraft() {
  if (document.activeElement && document.activeElement.onchange) document.activeElement.onchange();
  const entry = { id: draft.entryId || 'e' + Date.now().toString(36), exId: draft.exId, name: draft.name, kind: draft.kind, note: $('#draft-note').value.trim(),
    duration: draft.duration ?? null, distance: draft.kind === 'cardio' ? draft.distance ?? null : null };
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
    return `<button class="row flat" onclick="openExercise('${esc(x.id)}')">${miniStack(x.entry)}
      <span class="row-main"><span class="row-name">${esc(entryName(x.entry))}</span>
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
      <div><div class="eyebrow">${tn('workouts', hist.length)}</div><h3>${esc(entryName(first))}</h3></div>
      <button class="icon-btn" onclick="closeSheet()" aria-label="${t('close')}">${icon('close')}</button>
    </div>
    ${story ? `<p class="story">${story}</p>` : ''}
    <p class="label">${metric.title}</p>
    ${pts.length >= 2 ? `<div class="chart" id="ex-chart"></div>` : `<p class="muted small">${t('curveLater')}</p>`}
    <ul class="history">${hist.map(h => `
      <li><span class="h-date">${esc(cap(fmtDay(h.date)))}</span><span>${esc(entrySummary(h.entry))}</span>
      ${h.entry.note ? `<span class="h-note">${esc(h.entry.note)}</span>` : ''}</li>`).join('')}</ul>`);
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
