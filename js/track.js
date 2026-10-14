// ===== ÉCRAN SUIVI =====

// ===== ONGLET SUIVI =====
function renderTrack() {
  const now = new Date();
  if (!UI.month) UI.month = new Date(now.getFullYear(), now.getMonth(), 1);
  const month = sessionsInRange(isoDate(new Date(now.getFullYear(), now.getMonth(), 1)), isoDate());
  const monthName = now.toLocaleDateString(locale(), { month: 'long' });

  const monday = mondayOf(now);
  const week = sessionsInRange(isoDate(monday), isoDate());
  // Le bilan de la semaine d'abord ; les semaines en bref ; les exercices sur une page à part
  $('#view').innerHTML = `
    <div class="page-head">
      <div class="head-row"><span class="eyebrow">${t('weekOfLong', { date: esc(fmtDM(isoDate(monday))) })}</span></div>
      <h1>${tn('weekSessions', week, { goal: weeklyGoal() })}</h1>
    </div>
    <section class="card">${musclesCardHtml()}</section>
    <section class="card"><h2 class="card-title">${t('lastWeeks')}</h2>${weeksHtml()}</section>
    <button class="btn-line row-btn" onclick="openExerciseList()">${t('byExerciseLong')}${icon('chev')}</button>`;
}
function openExerciseList() {
  openSheet(`
    <div class="sheet-head"><h3>${t('byExercise')}</h3>
      <button class="icon-btn" onclick="closeSheet()" aria-label="${t('close')}">${icon('close')}</button></div>
    ${exerciseListHtml()}`);
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
    ${first.kind === 'sets' ? `<div id="rep-target">${repTargetHtml(exId)}</div>` : ''}
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
