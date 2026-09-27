// ===== ÉTAT DE L'ÉCRAN =====
const UI = {
  tab: 'today',
  date: isoDate(),     // jour affiché dans l'onglet Séance
  month: null,         // mois affiché dans le calendrier (1er du mois)
  selDay: null,        // jour touché dans le calendrier
  search: '',
};
let draft = null;      // exercice en cours de saisie
try { UI.tab = localStorage.getItem('fitcoach-tab') || 'today'; } catch (e) {}

// ===== EXERCICES & HISTORIQUE =====
function allExercises() {
  return [...CATALOG, ...Data.exercises.map(e => ({ ...e, group: 'custom' }))];
}
const findExercise = id => allExercises().find(e => e.id === id);
const activeSessions = () => Data.sessions.filter(s => s.entries && s.entries.length);
const sessionOf = date => Data.sessions.find(s => s.id === date);
function cloneSession(date) {
  const s = sessionOf(date);
  return s ? JSON.parse(JSON.stringify(s)) : { id: date, entries: [], createdAt: Date.now() };
}
// Tous les passages d'un exercice, du plus récent au plus ancien
function historyOf(exId) {
  const out = [];
  for (const s of Data.sessions) for (const e of s.entries || []) if (e.exId === exId) out.push({ date: s.id, entry: e });
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
function renderToday() {
  const today = isoDate();
  const isToday = UI.date === today;
  const entries = (sessionOf(UI.date) || {}).entries || [];
  const last = activeSessions().find(s => s.id < UI.date);
  const weekCount = sessionsInRange(isoDate(mondayOf(new Date())), today);

  let html = `
    <div class="day-head">
      <div>
        <div class="eyebrow">${isToday ? 'Aujourd’hui' : relDay(UI.date)}</div>
        <h2>${esc(cap(fmtDay(UI.date)))}</h2>
      </div>
      <label class="date-chip">${icon('cal')}Autre jour
        <input type="date" value="${UI.date}" max="${today}" onchange="goToDay(this.value)" aria-label="Choisir un autre jour">
      </label>
    </div>`;

  if (!entries.length) {
    html += `
      <div class="empty">
        <p class="empty-title">${isToday ? 'Pas encore de sport aujourd’hui' : 'Pas de séance ce jour-là'}</p>
        <p class="muted">${last ? `Dernière séance ${relDay(last.id)}` : 'Ta première séance commence ici.'}
          ${isToday && weekCount ? `<br>Cette semaine : ${plural(weekCount, 'séance')}` : ''}</p>
        <button class="btn-big" onclick="openPicker()">${icon('plus')}${isToday ? 'Commencer ma séance' : 'Ajouter un exercice'}</button>
      </div>`;
  } else {
    html += `<ul class="entries">${entries.map(e => `
      <li><button class="entry" onclick="editEntry('${esc(e.id)}')">
        <span class="entry-main">
          <span class="entry-name">${esc(e.name)}</span>
          <div class="entry-sum">${esc(entrySummary(e))}</div>
          ${e.note ? `<div class="entry-note">${esc(e.note)}</div>` : ''}
        </span>${icon('chev')}
      </button></li>`).join('')}</ul>
      <button class="btn-big" onclick="openPicker()">${icon('plus')}Ajouter un exercice</button>
      <p class="muted small center day-foot">${plural(entries.length, 'exercice')}${totalMinutes(entries) ? ` · ${totalMinutes(entries)} min de cardio / cours` : ''}</p>`;
  }
  if (!isToday) html += `<p class="center"><button class="link" onclick="goToDay('${today}')">Revenir à aujourd’hui</button></p>`;
  $('#view').innerHTML = html;
}
const totalMinutes = entries => entries.reduce((t, e) => t + (e.kind !== 'sets' && e.duration ? e.duration : 0), 0);

function goToDay(date) {
  if (!date) return;
  UI.date = date > isoDate() ? isoDate() : date;
  UI.tab = 'today';
  closeSheet();
  window.scrollTo(0, 0);
  render();
}

// ===== CHOIX DE L'EXERCICE =====
function openPicker() {
  UI.search = '';
  openSheet(`
    <div class="sheet-head"><h3>Quel exercice ?</h3>
      <button class="icon-btn" onclick="closeSheet()" aria-label="Fermer">${icon('close')}</button></div>
    <input class="input" type="search" placeholder="Rechercher ou créer…" oninput="UI.search=this.value;renderPickerList()" aria-label="Rechercher un exercice">
    <div id="picker-list"></div>`, renderPickerList);
}

function pickItem(ex) {
  const last = historyOf(ex.id)[0];
  const sub = last ? `${entrySummary(last.entry)} · ${relDay(last.date)}` : KINDS[ex.kind].label;
  return `<button class="pick" onclick="pickExercise('${esc(ex.id)}')"><span class="pick-name">${esc(ex.name)}</span><span class="pick-sub">${esc(sub)}</span></button>`;
}

function renderPickerList() {
  const box = $('#picker-list');
  if (!box) return;
  const all = allExercises();
  const q = norm(UI.search);
  let html = '';
  if (q) {
    const found = all.filter(e => norm(e.name).includes(q));
    if (!found.some(e => norm(e.name) === q)) {
      html += `<button class="pick" onclick="openCreate()"><span class="pick-name pick-create">+ Créer « ${esc(UI.search.trim())} »</span><span class="pick-sub">Nouvel exercice</span></button>`;
    }
    html += found.map(pickItem).join('');
  } else {
    const recent = recentExerciseIds(6).map(findExercise).filter(Boolean);
    if (recent.length) html += `<p class="pick-group">Récents</p>` + recent.map(pickItem).join('');
    for (const g of GROUPS) {
      const list = all.filter(e => e.group === g.id);
      if (list.length) html += `<p class="pick-group">${g.label}</p>` + list.map(pickItem).join('');
    }
    html += `<p class="pick-group">Il manque un exercice ?</p>
      <button class="pick" onclick="openCreate()"><span class="pick-name pick-create">+ Créer un exercice</span></button>`;
  }
  box.innerHTML = html;
}

function openCreate() {
  const name = UI.search.trim();
  openSheet(`
    <div class="sheet-head"><h3>Nouvel exercice</h3>
      <button class="icon-btn" onclick="closeSheet()" aria-label="Fermer">${icon('close')}</button></div>
    <label class="field"><span>Nom</span>
      <input class="input" id="new-name" value="${esc(name)}" maxlength="60" placeholder="ex. Presse à épaules"></label>
    <p class="field"><span class="muted small">Ce que tu veux noter</span></p>
    <div class="kinds" role="radiogroup">${Object.entries(KINDS).map(([k, v], i) => `
      <button class="kind${i === 0 ? ' active' : ''}" data-kind="${k}" role="radio" aria-checked="${i === 0}" onclick="selectKind(this)">
        <span class="kind-label">${v.label}</span><span class="kind-hint">${v.hint}</span></button>`).join('')}</div>
    <button class="btn-big" onclick="createExercise()">Créer et noter</button>`);
  if (!name) $('#new-name').focus();
}
function selectKind(btn) {
  document.querySelectorAll('.kind').forEach(b => { b.classList.toggle('active', b === btn); b.setAttribute('aria-checked', b === btn); });
}
function createExercise() {
  const name = $('#new-name').value.trim();
  if (!name) { $('#new-name').focus(); return; }
  const existing = allExercises().find(e => norm(e.name) === norm(name));
  if (existing) { pickExercise(existing.id); return; }
  const ex = { id: 'c-' + Date.now().toString(36), name, kind: $('.kind.active').dataset.kind, createdAt: Date.now() };
  saveCustomExercise(ex);
  pickExercise(ex.id, ex);
}

// ===== SAISIE D'UN EXERCICE =====
function pickExercise(id, exObj) {
  const ex = exObj || findExercise(id);
  const last = historyOf(ex.id)[0];
  const le = last && last.entry;
  // On repart de la dernière fois : il suffit souvent de valider
  draft = {
    entryId: null, exId: ex.id, name: ex.name, kind: ex.kind, note: '',
    sets: le && le.sets && le.sets.length ? le.sets.map(s => ({ ...s })) : [{ reps: 10, weight: null }],
    duration: le && le.duration ? le.duration : (ex.kind === 'cardio' ? 20 : 30),
    distance: le && le.distance ? le.distance : null,
  };
  openEditor(last);
}

function editEntry(entryId) {
  const e = (sessionOf(UI.date).entries || []).find(x => x.id === entryId);
  if (!e) return;
  draft = JSON.parse(JSON.stringify({ sets: [{ reps: 10, weight: null }], duration: 30, distance: null, ...e, entryId: e.id }));
  const last = historyOf(e.exId).find(h => h.date < UI.date);
  openEditor(last);
}

function openEditor(last) {
  const isNew = !draft.entryId;
  openSheet(`
    <div class="sheet-head">
      <div><h3>${esc(draft.name)}</h3>
        <p class="muted small">${last ? `La dernière fois (${relDay(last.date)}) : ${esc(entrySummary(last.entry))}` : 'Première fois !'}</p></div>
      <button class="icon-btn" onclick="closeSheet()" aria-label="Fermer">${icon('close')}</button>
    </div>
    <div id="editor-body"></div>
    <textarea class="input" id="draft-note" rows="1" maxlength="300" placeholder="Note (facultatif)">${esc(draft.note || '')}</textarea>
    <button class="btn-big" onclick="saveDraft()">${isNew ? 'Enregistrer' : 'Enregistrer les changements'}</button>
    ${isNew ? '' : `<button class="link-danger" onclick="deleteEntry()">Supprimer cet exercice</button>`}`);
  renderEditorBody();
}

const stepper = (value, onStep, onSet, placeholder, label) => `
  <div class="stepper">
    <button type="button" onclick="${onStep}(-1)" aria-label="Moins">−</button>
    <input inputmode="decimal" value="${value === null || value === undefined ? '' : fmtNum(value)}" placeholder="${placeholder}" onchange="${onSet}(this.value)" onfocus="this.select()" aria-label="${label}">
    <button type="button" onclick="${onStep}(1)" aria-label="Plus">+</button>
  </div>`;

function renderEditorBody() {
  const box = $('#editor-body');
  if (!box) return;
  if (draft.kind === 'sets') {
    box.innerHTML = `<div class="sets">
      <div class="set-row head"><span></span><span>Répétitions</span><span>Poids (kg)</span><span></span></div>
      ${draft.sets.map((s, i) => `
        <div class="set-row">
          <span class="set-n">${i + 1}</span>
          ${stepper(s.reps, `stepSet.bind(null,${i},'reps')`, `setSet.bind(null,${i},'reps')`, '0', `Répétitions série ${i + 1}`)}
          ${stepper(s.weight, `stepSet.bind(null,${i},'weight')`, `setSet.bind(null,${i},'weight')`, '—', `Poids série ${i + 1}`)}
          ${draft.sets.length > 1 ? `<button class="icon-btn" onclick="removeSet(${i})" aria-label="Supprimer la série ${i + 1}">${icon('close')}</button>` : '<span></span>'}
        </div>`).join('')}
      <button class="btn-ghost" onclick="addSet()">+ Ajouter une série</button>
      <p class="muted small" style="margin-top:8px">Laisse le poids vide pour un exercice au poids du corps.</p>
    </div>`;
  } else {
    box.innerHTML = `
      <div class="solo"><span>Durée (minutes)</span>${stepper(draft.duration, "stepField.bind(null,'duration',5)", "setField.bind(null,'duration')", '0', 'Durée en minutes')}</div>
      ${draft.kind === 'cardio' ? `<div class="solo"><span>Distance (km, facultatif)</span>${stepper(draft.distance, "stepField.bind(null,'distance',0.5)", "setField.bind(null,'distance')", '—', 'Distance en kilomètres')}</div>` : ''}`;
  }
}
// Les boutons appellent ces fonctions avec (+1) ou (-1)
function stepSet(i, field, dir) {
  const step = field === 'reps' ? 1 : 2.5;
  const cur = draft.sets[i][field];
  draft.sets[i][field] = cur === null || cur === undefined ? (dir > 0 ? step : null) : Math.max(0, cur + dir * step) || null;
  renderEditorBody();
}
function setSet(i, field, v) { draft.sets[i][field] = numOrNull(v); }
function addSet() { draft.sets.push({ ...draft.sets[draft.sets.length - 1] }); renderEditorBody(); }
function removeSet(i) { draft.sets.splice(i, 1); renderEditorBody(); }
function stepField(field, step, dir) {
  const cur = draft[field];
  draft[field] = cur === null || cur === undefined ? (dir > 0 ? step : null) : Math.max(0, cur + dir * step) || null;
  renderEditorBody();
}
function setField(field, v) { draft[field] = numOrNull(v); }

function saveDraft() {
  // Une saisie clavier non validée (champ encore actif) doit être prise en compte
  if (document.activeElement && document.activeElement.onchange) document.activeElement.onchange();
  const entry = { id: draft.entryId || 'e' + Date.now().toString(36), exId: draft.exId, name: draft.name, kind: draft.kind, note: $('#draft-note').value.trim() };
  if (draft.kind === 'sets') entry.sets = draft.sets.filter(s => s.reps || s.weight).map(s => ({ reps: s.reps ?? null, weight: s.weight ?? null }));
  else { entry.duration = draft.duration ?? null; entry.distance = draft.kind === 'cardio' ? draft.distance ?? null : null; }
  const s = cloneSession(UI.date);
  const i = s.entries.findIndex(e => e.id === entry.id);
  if (i >= 0) s.entries[i] = entry; else s.entries.push(entry);
  saveSession(s);
  draft = null;
  closeSheet();
  toast(i >= 0 ? 'Modifié' : 'Enregistré 💪');
}

function deleteEntry() {
  if (!confirm(`Supprimer « ${draft.name} » de cette séance ?`)) return;
  const s = cloneSession(UI.date);
  s.entries = s.entries.filter(e => e.id !== draft.entryId);
  saveSession(s);
  draft = null;
  closeSheet();
  toast('Supprimé');
}

// ===== ONGLET SUIVI =====
function renderTrack() {
  const today = isoDate();
  const now = new Date();
  if (!UI.month) UI.month = new Date(now.getFullYear(), now.getMonth(), 1);
  const sessions = activeSessions();
  const week = sessionsInRange(isoDate(mondayOf(now)), today);
  const month = sessionsInRange(isoDate(new Date(now.getFullYear(), now.getMonth(), 1)), today);
  const last = sessions[0];

  let html = `
    <div class="day-head"><div><div class="eyebrow">Suivi</div><h2>Ma régularité</h2></div></div>
    <div class="stats">
      <div class="stat"><div class="stat-val">${week}</div><div class="stat-label">cette semaine</div></div>
      <div class="stat"><div class="stat-val">${month}</div><div class="stat-label">ce mois-ci</div></div>
      <div class="stat"><div class="stat-val sm">${last ? cap(relDay(last.id)) : '—'}</div><div class="stat-label">dernière séance</div></div>
    </div>
    <section class="card">${calendarHtml()}</section>
    <section class="card">
      <h3 class="card-title">Séances par semaine</h3>
      <p class="card-sub">12 dernières semaines · touche une barre pour le détail</p>
      <div class="chart" id="weeks-chart"></div>
    </section>
    <section class="card">
      <h3 class="card-title">Par exercice</h3>
      ${exerciseListHtml()}
    </section>`;
  $('#view').innerHTML = html;
  barChart($('#weeks-chart'), weeklyData());
}

function calendarHtml() {
  const today = isoDate();
  const m = UI.month;
  const y = m.getFullYear(), mo = m.getMonth();
  const daysInMonth = new Date(y, mo + 1, 0).getDate();
  const start = mondayOf(m);
  const done = new Set(activeSessions().map(s => s.id));
  const isCurrent = y === new Date().getFullYear() && mo === new Date().getMonth();
  let cells = '';
  const end = addDays(mondayOf(new Date(y, mo, daysInMonth)), 6);
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
      <h3 class="card-title">${monthName}</h3>
      <button class="icon-btn" onclick="shiftMonth(1)" aria-label="Mois suivant" ${isCurrent ? 'disabled style="opacity:.3"' : ''}>${icon('chev')}</button>
    </div>
    <div class="cal-grid">${['L', 'M', 'M', 'J', 'V', 'S', 'D'].map(d => `<span class="cal-dow">${d}</span>`).join('')}${cells}</div>
    <div class="cal-foot">
      <span><span class="legend-dot" style="background:var(--accent)"></span>${plural(active, 'jour')} de sport</span>
      <span><span class="legend-dot" style="border:1.5px solid var(--text-faint)"></span>${lastDay - active} sans sport</span>
    </div>
    ${dayDetailHtml()}`;
}

function dayDetailHtml() {
  if (!UI.selDay) return `<p class="muted small" style="margin-top:10px">Touche un jour pour voir ce que tu as fait.</p>`;
  const entries = (sessionOf(UI.selDay) || {}).entries || [];
  return `<div class="day-detail">
    <p class="day-detail-title">${esc(cap(fmtDay(UI.selDay)))}</p>
    ${entries.length
      ? entries.map(e => `<div class="day-line"><span>${esc(e.name)}</span><span>${esc(entrySummary(e))}</span></div>`).join('')
        + `<button class="btn-line" onclick="goToDay('${UI.selDay}')">Voir ou modifier la séance</button>`
      : `<p class="muted small">Pas de sport ce jour-là.</p><button class="btn-line" onclick="goToDay('${UI.selDay}')">Ajouter une séance ce jour-là</button>`}
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

function weeklyData() {
  const thisMonday = mondayOf(new Date());
  const counts = {};
  for (const s of activeSessions()) {
    const k = isoDate(mondayOf(toDate(s.id)));
    counts[k] = (counts[k] || 0) + 1;
  }
  const out = [];
  for (let i = 11; i >= 0; i--) {
    const mon = addDays(thisMonday, -7 * i);
    const k = isoDate(mon);
    const v = counts[k] || 0;
    out.push({
      label: i === 0 ? 'cette sem.' : `${mon.getDate()}/${mon.getMonth() + 1}`,
      value: v,
      tip: `${i === 0 ? 'Cette semaine' : `Semaine du ${esc(fmtShort(k))}`}<br><b>${v ? plural(v, 'séance') : 'Aucune séance'}</b>`,
    });
  }
  return out;
}

// Valeur suivie pour un exercice : charge max, total de répétitions, ou durée
function metricFor(kind, hist) {
  if (kind === 'sets') {
    const withWeight = hist.some(h => (h.entry.sets || []).some(s => s.weight));
    return withWeight
      ? { title: 'Charge max (kg)', fmt: v => `${fmtNum(v)} kg`, get: e => Math.max(0, ...(e.sets || []).map(s => s.weight || 0)) || null }
      : { title: 'Répétitions au total', fmt: v => `${fmtNum(v)} rép.`, get: e => (e.sets || []).reduce((t, s) => t + (s.reps || 0), 0) || null };
  }
  return { title: 'Durée (minutes)', fmt: v => `${fmtNum(v)} min`, get: e => e.duration || null };
}

function exerciseListHtml() {
  const byEx = new Map();
  for (const s of activeSessions()) for (const e of s.entries) {
    if (!byEx.has(e.exId)) byEx.set(e.exId, { id: e.exId, name: e.name, kind: e.kind, last: s.id, entry: e, count: 0 });
    byEx.get(e.exId).count++;
  }
  if (!byEx.size) return `<p class="muted small">Tes exercices apparaîtront ici après ta première séance.</p>`;
  return `<ul class="ex-list">${[...byEx.values()].map(x => {
    const metric = metricFor(x.kind, historyOf(x.id));
    const v = metric.get(x.entry);
    return `<li><button class="ex-item" onclick="openExercise('${esc(x.id)}')">
      <span class="ex-item-main"><div class="ex-item-name">${esc(x.name)}</div>
      <div class="ex-item-sub">${x.count} fois · ${relDay(x.last)}</div></span>
      <span class="ex-item-val">${v ? metric.fmt(v) : ''}</span>${icon('chev')}
    </button></li>`;
  }).join('')}</ul>`;
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
  openSheet(`
    <div class="sheet-head">
      <div><h3>${esc(first.name)}</h3>
        <p class="muted small">${plural(hist.length, 'séance')} depuis le ${esc(fmtLong(hist[hist.length - 1].date))}</p></div>
      <button class="icon-btn" onclick="closeSheet()" aria-label="Fermer">${icon('close')}</button>
    </div>
    <p class="card-title">${metric.title}</p>
    ${pts.length >= 2 ? `<div class="chart" id="ex-chart"></div>` : `<p class="muted small">La courbe apparaîtra à partir de 2 séances.</p>`}
    <ul class="history">${hist.map(h => `
      <li><span class="h-date">${esc(cap(fmtDay(h.date)))}</span><br>${esc(entrySummary(h.entry))}
      ${h.entry.note ? `<br><span class="h-note">${esc(h.entry.note)}</span>` : ''}</li>`).join('')}</ul>`);
  if (pts.length >= 2) lineChart($('#ex-chart'), pts);
}

// ===== MON COMPTE =====
function openMenu() {
  openSheet(`
    <div class="sheet-head">
      <div><h3>Mon compte</h3><p class="muted small">${esc(Data.user.email)}</p></div>
      <button class="icon-btn" onclick="closeSheet()" aria-label="Fermer">${icon('close')}</button>
    </div>
    ${DEMO ? `<p class="demo-note" style="margin:0 0 12px">Mode démo : les données sont factices et restent sur cet appareil.</p>` : ''}
    <div style="display:grid;gap:8px">
      <button class="btn-line" onclick="openImport()">Importer l’ancienne FitCoach</button>
      ${DEMO ? `<button class="btn-line" onclick="Backend.resetDemo()">Réinitialiser la démo</button>` : ''}
      <button class="btn-line" onclick="logout()">Se déconnecter</button>
    </div>`);
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
