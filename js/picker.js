// ===== CHOISIR ET CRÉER UN EXERCICE : favoris, masqués, doublons, liste, création, champs =====

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

// Deux lignes : nom (+ nom anglais), étiquettes objectif / à ménager, dernière fois
function pickItem(ex) {
  const last = historyOf(ex.id)[0];
  const sub = last ? `${entrySummary(last.entry)} · ${relDay(last.date)}` : t('neverDone');
  const fav = isFav(ex.id);
  const [main, sec] = musclesOf(ex);
  const up = main.filter(m => muscleGoal(m) === 'up');
  const downMain = main.filter(m => muscleGoal(m) === 'down');
  const downSec = sec.filter(m => !main.includes(m) && muscleGoal(m) === 'down');
  const tags = (up.length ? `<span class="tag ok">${icon('check')}${esc(muscleShort(up[0]))}${up.length > 1 ? ` +${up.length - 1}` : ''}</span>` : '')
    + (downMain.length ? `<span class="tag warn strong">${esc(muscleShort(downMain[0]))}</span>` : downSec.length ? `<span class="tag warn">${esc(muscleShort(downSec[0]))}</span>` : '');
  return `<div class="pick">
    <button class="pick-main" onclick="pickExercise('${esc(ex.id)}')">${pictoTile(ex, 'small')}<span class="pick-text">
      <span class="pick-line"><span class="pick-name">${esc(exLabel(ex))}</span>${tags}</span>${enLine(exEn(ex))}
      <span class="pick-sub">${esc(sub)}</span></span></button>
    <button class="star${fav ? ' on' : ''}" onclick="toggleFav('${esc(ex.id)}')" aria-pressed="${fav}" aria-label="${fav ? t('favOn') : t('favOff')} : ${esc(exLabel(ex))}">${icon('star')}</button>
    <button class="hide-btn" onclick="toggleHidden('${esc(ex.id)}')" aria-label="${t('hide')} : ${esc(exLabel(ex))}">${icon('eyeoff')}</button>
  </div>`;
}
const byName = (a, b) => exLabel(a).localeCompare(exLabel(b), currentLang);
// Dans une catégorie : favoris d'abord, puis ordre alphabétique
const byFavThenName = (a, b) => (isFav(b.id) - isFav(a.id)) || byName(a, b);

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
        const list = all.filter(e => e.group === g.id).sort(byFavThenName);
        if (list.length) html += `<p class="pick-group">${g.label}</p>` + list.map(pickItem).join('');
      }
      hiddenPool = every.filter(e => isHidden(e.id));
    } else if (f === 'custom') {
      html += all.filter(e => e.custom).sort(byFavThenName).map(pickItem).join('');
      hiddenPool = every.filter(e => e.custom && isHidden(e.id));
    } else {
      html += all.filter(e => e.group === f).sort(byFavThenName).map(pickItem).join('');
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

// Exercice prêt à faire, avec les chiffres de la dernière fois (séries, réglages, vitesse, pente…)
function buildEntry(ex) {
  const last = historyOf(ex.id)[0];
  const le = last && last.entry;
  const entry = { id: 'e' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5), exId: ex.id, name: ex.name, kind: ex.kind, note: '' };
  if (ex.kind === 'sets') {
    const base = le ? doneSets(le) : [];
    entry.sets = (base.length ? base : [0, 1, 2].map(() => ({ reps: 10, weight: null })))
      .map(s => ({ reps: s.reps ?? null, weight: s.weight ?? null, done: false }));
    if (le && le.setup) entry.setup = JSON.parse(JSON.stringify(le.setup));
  } else {
    entry.pending = true;
    const fields = fieldsFor(ex.id, ex.kind, le);
    for (const k of fields) entry[k] = le && le[k] !== undefined ? le[k] : null;
    if (!le && fields.includes('duration') && !fields.includes('laps')) entry.duration = ex.kind === 'cardio' ? 20 : 30;
  }
  return entry;
}
function pickExercise(id, exObj) {
  const ex = exObj || findExercise(id);
  const entry = buildEntry(ex);
  const s = cloneSession(UI.date);
  closeOpenEntries(s);
  s.entries.push(entry);
  saveSession(s);
  closeSheet();
  setTimeout(() => $('.now') && $('.now').scrollIntoView({ behavior: 'smooth', block: 'center' }), 50);
  // Touché par erreur : « Annuler » le retire et rouvre la liste
  toast(t('addedEx', { name: exLabel(ex) }), { label: t('undo'), fn: () => { removeEntry(entry.id); openPicker(); } });
}
