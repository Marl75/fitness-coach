// ===== ÉTAT DE L'ÉCRAN =====
const UI = {
  tab: 'today',
  date: isoDate(),     // jour affiché dans l'onglet Séance
  month: null,         // mois affiché dans le calendrier (1er du mois)
  selDay: null,        // jour touché dans le calendrier
  search: '',
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
const plateLabel = v => (v ? fmtNum(v) : 'Sans');
function stackHtml(values, pin, action, cls = '') {
  return `<div class="stack ${cls}" role="group" aria-label="Pile de plaques">${values.map(v => {
    const state = v === pin ? 'pin' : v < pin ? 'lifted' : '';
    return `<button type="button" class="plate ${state}" data-v="${v}" onclick="${action}(${v})" aria-pressed="${v === pin}" aria-label="${v ? fmtNum(v) + ' kilos' : 'Sans poids'}">${plateLabel(v)}</button>`;
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
        <span class="eyebrow">${isToday ? cap(fmtDay(UI.date)) : cap(relDay(UI.date))}</span>
        <span class="chrono" id="chrono">${chronoText()}</span>
      </div>
      <div class="head-row">
        <h1>${isToday ? 'Séance du jour' : `Séance du ${esc(fmtShort(UI.date))}`}</h1>
        <label class="date-chip">${icon('cal')}Autre jour
          <input type="date" value="${UI.date}" max="${today}" onchange="goToDay(this.value)" aria-label="Choisir un autre jour">
        </label>
      </div>
    </div>`;

  if (!entries.length) {
    html += `
      <div class="empty">
        <p class="empty-title">${isToday ? 'Pas encore de sport aujourd’hui.' : 'Pas de séance ce jour-là.'}</p>
        <p class="muted">${last ? `Dernière séance ${relDay(last.id)}.` : 'Ta première séance commence ici.'}
          ${isToday ? `<br>Cette semaine : ${weekCount} sur ${weeklyGoal()}.` : ''}</p>
        <button class="btn-accent big" onclick="openPicker()">${icon('plus')}${isToday ? 'Commencer ma séance' : 'Ajouter un exercice'}</button>
      ${quickFavs()}
      </div>`;
  } else {
    html += `<div class="rows">${entries.map(e => e === current ? currentCard(e) : entryRow(e)).join('')}</div>
      <button class="btn-outline" onclick="openPicker()">${icon('plus')}${current ? 'Ajouter un autre exercice' : 'Exercice suivant'}</button>
      ${quickFavs()}
      ${entries.some(entryDone) ? `<p class="muted small center foot">${sessionFoot(entries)}</p>` : ''}`;
  }
  if (!isToday) html += `<p class="center"><button class="link" onclick="goToDay('${today}')">Revenir à aujourd’hui</button></p>`;
  $('#view').innerHTML = html;
}

// Favoris en un geste, sous le bouton d'ajout
function quickFavs() {
  const favs = favorites().map(findExercise);
  if (!favs.length) return '';
  return `<div class="quick"><p class="label">Favoris</p><div class="chips">${favs.map(ex =>
    `<button class="chip" onclick="pickExercise('${esc(ex.id)}')">${icon('star')}${esc(ex.name)}</button>`).join('')}</div></div>`;
}

function sessionFoot(entries) {
  const done = entries.filter(entryDone);
  const sets = done.reduce((t, e) => t + (e.kind === 'sets' ? doneSets(e).length : 0), 0);
  const min = done.reduce((t, e) => t + (e.kind !== 'sets' && e.duration ? e.duration : 0), 0);
  return [plural(done.length, 'exercice'), sets && plural(sets, 'série'), min && `${min} min de cardio / cours`].filter(Boolean).join(' · ');
}

function entryRow(e) {
  const pi = pendingIndex(e);
  const sub = pi >= 0 && !doneSets(e).length ? `${plural(e.sets.length, 'série')} prévue${e.sets.length > 1 ? 's' : ''}` : entrySummary(e);
  const mark = entryDone(e) && pi < 0 ? `<span class="row-mark">${icon('check')}</span>` : icon('chev');
  return `<button class="row" onclick="openEntry('${esc(e.id)}')">${miniStack(e)}
    <span class="row-main"><span class="row-name">${esc(e.name)}</span><span class="row-sub">${esc(sub)}</span>
    ${e.note ? `<span class="row-note">${esc(e.note)}</span>` : ''}</span>${mark}</button>`;
}

// L'exercice en cours : une grande carte avec la pile et « Série faite »
function currentCard(e) {
  const i = pendingIndex(e);
  const set = e.sets[i];
  const w = set.weight || 0;
  const id = esc(e.id);
  return `<section class="now" aria-label="Exercice en cours">
    ${stackHtml(windowAround(w), w, `pinCurrent.bind(null,'${id}')`, 'compact')}
    <div class="now-main">
      <div class="eyebrow">Série ${i + 1} sur ${e.sets.length}</div>
      <h2 class="now-name">${esc(e.name)}</h2>
      <button class="now-value" onclick="openSet('${id}',${i})" aria-label="Changer les chiffres de la série">
        <span class="serif">${set.reps || '–'}</span><span class="now-unit">× ${w ? fmtNum(w) + ' kg' : 'sans poids'}</span>
      </button>
      <button class="btn-accent" onclick="finishSet('${id}')">${icon('check')}Série faite</button>
      <div class="now-links">
        <button onclick="addPlannedSet('${id}')">+ série</button>
        <button onclick="finishAll('${id}')">Tout valider</button>
        <button onclick="stopEntry('${id}')">Arrêter là</button>
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
  if (e) toast(pendingIndex(e) < 0 ? 'Exercice terminé' : `Série ${doneSets(e).length} faite`);
}
function finishAll(entryId) {
  updateEntry(UI.date, entryId, e => e.sets.forEach(s => { s.done = true; }));
  toast('Exercice terminé');
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
  toast(on ? 'Ajouté aux favoris' : 'Retiré des favoris');
}

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
    for (const cand of [e.name, ...(e.aliases || [])]) {
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
    { id: 'fav', label: 'Favoris' },
    hasRecent && { id: 'recent', label: 'Récents' },
    { id: 'all', label: 'Tous' },
    ...GROUPS.filter(g => g.id !== 'custom').map(g => ({ id: g.id, label: g.label })),
    hasCustom && { id: 'custom', label: 'Mes exercices' },
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
    <div class="sheet-head"><h3>Quel exercice ?</h3>
      <button class="icon-btn" onclick="closeSheet()" aria-label="Fermer">${icon('close')}</button></div>
    <input class="input" type="search" placeholder="Rechercher…" oninput="UI.search=this.value;renderPickerList()" aria-label="Rechercher un exercice">
    <div class="chips" id="picker-chips" role="tablist" aria-label="Catégories"></div>
    <div id="picker-list"></div>`, renderPickerList);
}

function pickItem(ex) {
  const last = historyOf(ex.id)[0];
  const sub = last ? `${entrySummary(last.entry)} · ${relDay(last.date)}` : KINDS[ex.kind].label;
  const fav = isFav(ex.id);
  return `<div class="pick">
    <button class="pick-main" onclick="pickExercise('${esc(ex.id)}')"><span class="pick-name">${esc(ex.name)}</span><span class="pick-sub">${esc(sub)}</span></button>
    <button class="star${fav ? ' on' : ''}" onclick="toggleFav('${esc(ex.id)}')" aria-pressed="${fav}" aria-label="${fav ? 'Retirer des favoris' : 'Ajouter aux favoris'} : ${esc(ex.name)}">${icon('star')}</button>
  </div>`;
}
const byName = (a, b) => a.name.localeCompare(b.name, 'fr');

function renderPickerList() {
  const box = $('#picker-list');
  if (!box) return;
  const q = UI.search.trim();
  $('#picker-chips').innerHTML = pickerFilters().map(f =>
    `<button class="chip${!q && UI.filter === f.id ? ' active' : ''}" data-f="${f.id}" role="tab" aria-selected="${!q && UI.filter === f.id}" onclick="setFilter('${f.id}')">${f.id === 'fav' ? icon('star') : ''}${f.label}</button>`).join('');
  const all = allExercises();
  let html = '';
  if (q) {
    // Recherche dans tout le catalogue, y compris les autres noms (anglais…)
    const nq = simple(q);
    const found = all.filter(e => [e.name, ...(e.aliases || [])].some(n => simple(n).includes(nq)))
      .sort((a, b) => (isFav(b.id) - isFav(a.id)) || byName(a, b));
    html += found.length ? found.map(pickItem).join('') : `<p class="muted small empty-list">Aucun exercice ne correspond à « ${esc(q)} ».</p>`;
    if (!found.some(e => simple(e.name) === nq)) {
      html += `<button class="pick-create" onclick="openCreate()">${icon('plus')}Créer « ${esc(q)} »</button>`;
    }
  } else {
    const f = UI.filter;
    if (f === 'fav') {
      const favs = favorites().map(findExercise);
      html += favs.length ? favs.map(pickItem).join('')
        : `<p class="muted small empty-list">Pas encore de favori. Touche l’étoile ${icon('star')} à côté d’un exercice pour le retrouver ici, et en raccourci sur l’écran Séance.</p>`;
    } else if (f === 'recent') {
      html += recentExerciseIds(12).map(findExercise).filter(Boolean).map(pickItem).join('');
    } else if (f === 'all') {
      for (const g of GROUPS) {
        const list = all.filter(e => e.group === g.id).sort(byName);
        if (list.length) html += `<p class="pick-group">${g.label}</p>` + list.map(pickItem).join('');
      }
    } else if (f === 'custom') {
      html += all.filter(e => e.custom).sort(byName).map(pickItem).join('');
    } else {
      html += all.filter(e => e.group === f).sort(byName).map(pickItem).join('');
    }
    html += `<button class="pick-create" onclick="openCreate()">${icon('plus')}Créer un exercice</button>`;
  }
  box.innerHTML = html;
}

// ===== CRÉER UN EXERCICE (avec vérification des doublons) =====
let createConfirm = false;
function openCreate() {
  const name = UI.search.trim();
  createConfirm = false;
  const groupFor = ['upper', 'lower', 'core', 'cardio', 'class'];
  openSheet(`
    <div class="sheet-head"><h3>Nouvel exercice</h3>
      <button class="icon-btn" onclick="closeSheet()" aria-label="Fermer">${icon('close')}</button></div>
    <label class="field"><span>Nom</span>
      <input class="input" id="new-name" value="${esc(name)}" maxlength="60" placeholder="ex. Presse à épaules" oninput="createConfirm=false;renderSimilar()" autocomplete="off"></label>
    <div id="similar"></div>
    <p class="field"><span>Ce que tu veux noter</span></p>
    <div class="kinds" role="radiogroup">${Object.entries(KINDS).map(([k, v], i) => `
      <button class="kind${i === 0 ? ' active' : ''}" data-kind="${k}" role="radio" aria-checked="${i === 0}" onclick="selectKind(this)">
        <span class="kind-label">${v.label}</span><span class="kind-hint">${v.hint}</span></button>`).join('')}</div>
    <p class="field"><span>Catégorie (pour le retrouver dans les filtres)</span></p>
    <div class="chips wrap" id="new-group" role="radiogroup">${GROUPS.filter(g => groupFor.includes(g.id)).map(g =>
      `<button class="chip" data-g="${g.id}" role="radio" aria-checked="false" onclick="selectGroup(this)">${g.label}</button>`).join('')}</div>
    <button class="btn-accent big" id="create-btn" onclick="createExercise()">Créer et commencer</button>`);
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
  if (btn) btn.textContent = createConfirm ? 'Créer quand même' : 'Créer et commencer';
  box.innerHTML = !sim.length ? '' : `
    <div class="similar${createConfirm ? ' warn' : ''}">
      <p class="similar-title">${sim[0].score === 100 ? 'Cet exercice existe déjà :' : 'Il existe peut-être déjà :'}</p>
      ${sim.map(({ e }) => `<button class="similar-item" onclick="pickExercise('${esc(e.id)}')">
        <span><b>${esc(e.name)}</b><span class="muted small"> · ${esc((GROUPS.find(g => g.id === e.group) || {}).label || '')}</span></span>
        <span class="similar-use">Utiliser</span></button>`).join('')}
      ${createConfirm ? '<p class="small">Si c’est bien un autre exercice, touche « Créer quand même ».</p>' : ''}
    </div>`;
}
function createExercise() {
  const name = $('#new-name').value.trim().replace(/\s+/g, ' ');
  if (!name) { $('#new-name').focus(); return; }
  const sim = similarExercises(name);
  if (sim.length && sim[0].score === 100) {
    toast('Cet exercice existe déjà');
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
  toast(`« ${name} » créé`);
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
      <div><div class="eyebrow">Série ${idx + 1} sur ${e.sets.length}</div><h3>${esc(e.name)}</h3></div>
      <button class="icon-btn" onclick="closeSheet()" aria-label="Fermer">${icon('close')}</button>
    </div>
    <div class="set-editor">
      <div class="set-col">
        <p class="label">Poids · touche une plaque</p>
        <div class="stack-scroll" id="set-stack">${stackHtml(values, setDraft.weight, 'pinSet')}</div>
      </div>
      <div class="set-col reps-col">
        <p class="label">Répétitions</p>
        <button class="round-btn" onclick="stepReps(1)" aria-label="Une répétition de plus">${icon('plus')}</button>
        <input class="reps-input serif" id="reps" inputmode="numeric" value="${setDraft.reps ?? ''}" placeholder="0" onchange="setDraft.reps=numOrNull(this.value)" onfocus="this.select()" aria-label="Répétitions">
        <button class="round-btn" onclick="stepReps(-1)" aria-label="Une répétition de moins">${icon('minus')}</button>
        <p class="weight-read" id="weight-read">${setDraft.weight ? fmtNum(setDraft.weight) + ' kg' : 'sans poids'}</p>
      </div>
    </div>
    <p class="muted small">${last ? `La dernière fois (${relDay(last.date)}) : ${esc(entrySummary(last.entry))}` : 'Première fois sur cet exercice.'}</p>
    <button class="btn-accent big" onclick="saveSet()">${setDraft.wasDone ? 'Enregistrer' : 'Valider la série'}</button>
    ${setDraft.wasDone ? `<button class="link-danger" onclick="deleteSet()">Supprimer cette série</button>` : ''}`);
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
  $('#weight-read').textContent = v ? fmtNum(v) + ' kg' : 'sans poids';
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
  toast(wasDone ? 'Modifié' : 'Série faite');
}
function deleteSet() {
  updateEntry(UI.date, setDraft.entryId, e => { e.sets.splice(setDraft.idx, 1); });
  closeSheet();
  toast('Série supprimée');
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
      <div><div class="eyebrow">${esc(entrySummary(e))}</div><h3>${esc(e.name)}</h3></div>
      <button class="icon-btn" onclick="closeSheet()" aria-label="Fermer">${icon('close')}</button>
    </div>
    <div class="set-list">${e.sets.map((s, i) => `
      <button class="set-line" onclick="openSet('${id}',${i})">
        <span class="set-n">${i + 1}</span>
        <span class="set-val">${s.reps ?? '–'} × ${s.weight ? fmtNum(s.weight) + ' kg' : 'sans poids'}</span>
        ${s.done === false ? '<span class="muted small">prévue</span>' : `<span class="row-mark">${icon('check')}</span>`}
      </button>`).join('')}</div>
    <button class="btn-outline" onclick="addPlannedSet('${id}');closeSheet()">${icon('plus')}Ajouter une série</button>
    <label class="field" style="margin-top:16px"><span>Note</span>
      <textarea class="input" id="entry-note" rows="2" maxlength="300" placeholder="Réglage de la machine, ressenti…">${esc(e.note || '')}</textarea></label>
    <button class="btn-accent big" onclick="saveEntryNote('${id}')">Enregistrer</button>
    <button class="link-danger" onclick="deleteEntry('${id}')">Supprimer cet exercice</button>`);
}
function saveEntryNote(entryId) {
  const note = $('#entry-note').value.trim();
  updateEntry(UI.date, entryId, e => { e.note = note; });
  closeSheet();
  toast('Enregistré');
}
function deleteEntry(entryId) {
  const e = (sessionOf(UI.date).entries || []).find(x => x.id === entryId);
  if (!e || !confirm(`Supprimer « ${e.name} » de cette séance ?`)) return;
  const s = cloneSession(UI.date);
  s.entries = s.entries.filter(x => x.id !== entryId);
  saveSession(s);
  draft = null;
  closeSheet();
  toast('Supprimé');
}

// ===== CARDIO & COURS : DURÉE (ET DISTANCE) =====
const stepper = (value, onStep, onSet, placeholder, label) => `
  <div class="stepper">
    <button type="button" onclick="${onStep}(-1)" aria-label="Moins">${icon('minus')}</button>
    <input class="serif" inputmode="decimal" value="${value === null || value === undefined ? '' : fmtNum(value)}" placeholder="${placeholder}" onchange="${onSet}(this.value)" onfocus="this.select()" aria-label="${label}">
    <button type="button" onclick="${onStep}(1)" aria-label="Plus">${icon('plus')}</button>
  </div>`;

function openTimeEditor(last) {
  const isNew = !draft.entryId;
  openSheet(`
    <div class="sheet-head">
      <div><div class="eyebrow">${KINDS[draft.kind].label}</div><h3>${esc(draft.name)}</h3></div>
      <button class="icon-btn" onclick="closeSheet()" aria-label="Fermer">${icon('close')}</button>
    </div>
    <div id="editor-body"></div>
    <p class="muted small">${last ? `La dernière fois (${relDay(last.date)}) : ${esc(entrySummary(last.entry))}` : 'Première fois !'}</p>
    <textarea class="input" id="draft-note" rows="1" maxlength="300" placeholder="Note (facultatif)">${esc(draft.note || '')}</textarea>
    <button class="btn-accent big" onclick="saveDraft()">${isNew ? 'C’est fait' : 'Enregistrer'}</button>
    ${isNew ? '' : `<button class="link-danger" onclick="deleteEntry('${esc(draft.entryId)}')">Supprimer cet exercice</button>`}`);
  renderEditorBody();
}
function renderEditorBody() {
  const box = $('#editor-body');
  if (!box) return;
  box.innerHTML = `
    <div class="solo"><span>Durée (minutes)</span>${stepper(draft.duration, "stepField.bind(null,'duration',5)", "setField.bind(null,'duration')", '0', 'Durée en minutes')}</div>
    ${draft.kind === 'cardio' ? `<div class="solo"><span>Distance (km, facultatif)</span>${stepper(draft.distance, "stepField.bind(null,'distance',0.5)", "setField.bind(null,'distance')", '—', 'Distance en kilomètres')}</div>` : ''}`;
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
  toast(i >= 0 ? 'Modifié' : 'Enregistré');
}

// ===== ONGLET SUIVI =====
function renderTrack() {
  const now = new Date();
  if (!UI.month) UI.month = new Date(now.getFullYear(), now.getMonth(), 1);
  const month = sessionsInRange(isoDate(new Date(now.getFullYear(), now.getMonth(), 1)), isoDate());
  const monthName = now.toLocaleDateString('fr-FR', { month: 'long' });

  $('#view').innerHTML = `
    <div class="page-head">
      <div class="head-row"><span class="eyebrow">${cap(monthName)}</span></div>
      <h1>${month ? `${plural(month, 'séance')}, empilée${month > 1 ? 's' : ''}` : 'Pas encore de séance ce mois-ci'}</h1>
      <p class="muted small">Une plaque par séance, une colonne par semaine (en vert : cette semaine). Objectif : ${weeklyGoal()} par semaine, en pointillés.</p>
    </div>
    <section class="card">${weeksHtml()}</section>
    <section class="card">${calendarHtml()}</section>
    <section class="card">
      <h2 class="card-title">Par exercice</h2>
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
    cols.push(`<div class="wcol${i === 0 ? ' now' : ''}" role="img" aria-label="${i === 0 ? 'Cette semaine' : 'Semaine du ' + fmtShort(isoDate(mon))} : ${n ? plural(n, 'séance') : 'aucune séance'}">
      <span class="wcount">${n || ''}</span><div class="wstack">${plates}</div><span class="wlabel">${label}</span></div>`);
  }
  return `<div class="weeks">${cols.join('')}</div>`;
}

function calendarHtml() {
  const today = isoDate();
  const m = UI.month;
  const y = m.getFullYear(), mo = m.getMonth();
  const daysInMonth = new Date(y, mo + 1, 0).getDate();
  const start = mondayOf(m);
  const end = addDays(mondayOf(new Date(y, mo, daysInMonth)), 6);
  const done = new Set(activeSessions().map(s => s.id));
  const isCurrent = y === new Date().getFullYear() && mo === new Date().getMonth();
  let cells = '';
  for (let d = start; d <= end; d = addDays(d, 1)) {
    const id = isoDate(d);
    if (d.getMonth() !== mo) { cells += `<span class="cal-cell out"></span>`; continue; }
    const cls = ['cal-cell', done.has(id) && 'done', id === today && 'today', id > today && 'future', id === UI.selDay && 'sel'].filter(Boolean).join(' ');
    const label = `${fmtDay(id)}${done.has(id) ? ' : séance' : ''}`;
    cells += id > today
      ? `<span class="${cls}">${d.getDate()}</span>`
      : `<button class="${cls}" onclick="selectDay('${id}')" aria-label="${esc(label)}">${d.getDate()}</button>`;
  }
  const lastDay = isCurrent ? new Date().getDate() : daysInMonth;
  const active = [...done].filter(id => id.startsWith(`${y}-${pad(mo + 1)}`)).length;
  const monthName = m.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  return `
    <div class="cal-head">
      <button class="icon-btn" onclick="shiftMonth(-1)" aria-label="Mois précédent">${icon('prev')}</button>
      <h2 class="card-title">${cap(monthName)}</h2>
      <button class="icon-btn" onclick="shiftMonth(1)" aria-label="Mois suivant" ${isCurrent ? 'disabled' : ''}>${icon('chev')}</button>
    </div>
    <div class="cal-grid">${['L', 'M', 'M', 'J', 'V', 'S', 'D'].map(d => `<span class="cal-dow">${d}</span>`).join('')}${cells}</div>
    <div class="cal-foot">
      <span><span class="legend-dot on"></span>${plural(active, 'jour')} de sport</span>
      <span><span class="legend-dot"></span>${Math.max(0, lastDay - active)} sans sport</span>
    </div>
    ${dayDetailHtml()}`;
}

function dayDetailHtml() {
  if (!UI.selDay) return `<p class="muted small cal-hint">Touche un jour pour voir ce que tu as fait.</p>`;
  const entries = ((sessionOf(UI.selDay) || {}).entries || []).filter(entryDone);
  return `<div class="day-detail">
    <p class="day-detail-title">${esc(cap(fmtDay(UI.selDay)))}</p>
    ${entries.length
      ? entries.map(e => `<div class="day-line"><span>${esc(e.name)}</span><span>${esc(entrySummary(e))}</span></div>`).join('')
        + `<button class="btn-outline" onclick="goToDay('${UI.selDay}')">Voir ou modifier la séance</button>`
      : `<p class="muted small">Pas de sport ce jour-là.</p><button class="btn-outline" onclick="goToDay('${UI.selDay}')">Ajouter une séance ce jour-là</button>`}
  </div>`;
}

function selectDay(id) { UI.selDay = UI.selDay === id ? null : id; render(); }
function shiftMonth(n) {
  const m = new Date(UI.month.getFullYear(), UI.month.getMonth() + n, 1);
  if (m > new Date()) return;
  UI.month = m;
  UI.selDay = null;
  render();
}

// Valeur suivie pour un exercice : charge max, total de répétitions, ou durée
function metricFor(kind, hist) {
  if (kind === 'sets') {
    const withWeight = hist.some(h => doneSets(h.entry).some(s => s.weight));
    return withWeight
      ? { title: 'Charge max (kg)', fmt: v => `${fmtNum(v)} kg`, get: e => maxWeight(e) || null }
      : { title: 'Répétitions au total', fmt: v => `${fmtNum(v)} rép.`, get: e => doneSets(e).reduce((t, s) => t + (s.reps || 0), 0) || null };
  }
  return { title: 'Durée (minutes)', fmt: v => `${fmtNum(v)} min`, get: e => e.duration || null };
}

function exerciseListHtml() {
  const byEx = new Map();
  for (const s of activeSessions()) for (const e of s.entries) {
    if (!entryDone(e)) continue;
    if (!byEx.has(e.exId)) byEx.set(e.exId, { id: e.exId, name: e.name, kind: e.kind, last: s.id, entry: e, count: 0 });
    byEx.get(e.exId).count++;
  }
  if (!byEx.size) return `<p class="muted small">Tes exercices apparaîtront ici après ta première séance.</p>`;
  return `<div class="ex-list">${[...byEx.values()].map(x => {
    const metric = metricFor(x.kind, historyOf(x.id));
    const v = metric.get(x.entry);
    return `<button class="row flat" onclick="openExercise('${esc(x.id)}')">${miniStack(x.entry)}
      <span class="row-main"><span class="row-name">${esc(x.name)}</span>
      <span class="row-sub">${x.count} fois · ${relDay(x.last)}</span></span>
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
    story = diff > 0 ? `De ${metric.fmt(a)} à <b class="accent">${metric.fmt(b)}</b> depuis le ${esc(fmtDM(pts[0].date))}.`
      : diff < 0 ? `De ${metric.fmt(a)} à ${metric.fmt(b)} depuis le ${esc(fmtDM(pts[0].date))}.`
      : `Stable à ${metric.fmt(b)} depuis le ${esc(fmtDM(pts[0].date))}.`;
  }
  openSheet(`
    <div class="sheet-head">
      <div><div class="eyebrow">${plural(hist.length, 'séance')}</div><h3>${esc(first.name)}</h3></div>
      <button class="icon-btn" onclick="closeSheet()" aria-label="Fermer">${icon('close')}</button>
    </div>
    ${story ? `<p class="story">${story}</p>` : ''}
    <p class="label">${metric.title}</p>
    ${pts.length >= 2 ? `<div class="chart" id="ex-chart"></div>` : `<p class="muted small">La courbe apparaîtra à partir de 2 séances.</p>`}
    <ul class="history">${hist.map(h => `
      <li><span class="h-date">${esc(cap(fmtDay(h.date)))}</span><span>${esc(entrySummary(h.entry))}</span>
      ${h.entry.note ? `<span class="h-note">${esc(h.entry.note)}</span>` : ''}</li>`).join('')}</ul>`);
  if (pts.length >= 2) lineChart($('#ex-chart'), pts);
}

// ===== MON COMPTE =====
function openMenu() {
  openSheet(`
    <div class="sheet-head">
      <div><div class="eyebrow">Mon compte</div><h3>${esc(Data.user.email)}</h3></div>
      <button class="icon-btn" onclick="closeSheet()" aria-label="Fermer">${icon('close')}</button>
    </div>
    ${DEMO ? `<p class="demo-note">Mode démo : les données sont factices et restent sur cet appareil.</p>` : ''}
    <div class="goal">
      <span>Objectif par semaine</span>
      <div class="stepper small">
        <button type="button" onclick="changeGoal(-1)" aria-label="Moins">${icon('minus')}</button>
        <span class="serif" id="goal-val">${weeklyGoal()}</span>
        <button type="button" onclick="changeGoal(1)" aria-label="Plus">${icon('plus')}</button>
      </div>
    </div>
    <div class="menu-list">
      <button class="btn-line" onclick="openImport()">Importer l’ancienne FitCoach</button>
      ${DEMO ? `<button class="btn-line" onclick="Backend.resetDemo()">Réinitialiser la démo</button>` : ''}
      <button class="btn-line" onclick="logout()">Se déconnecter</button>
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
  $('#auth-submit').textContent = mode === 'login' ? 'Se connecter' : 'Créer mon compte';
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
  if (!email) { authMsg('Écris ton e-mail ci-dessus, puis touche à nouveau « Mot de passe oublié ».'); return; }
  try {
    await Backend.reset(email);
    authMsg('E-mail envoyé ! Regarde ta boîte de réception (et les spams).', true);
  } catch (e) { authMsg(authMessage(e.code)); }
}

// ===== DÉMARRAGE =====
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
