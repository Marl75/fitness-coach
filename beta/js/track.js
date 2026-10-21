// ===== ÉCRAN SUIVI =====

// ===== ONGLET SUIVI =====
// Tableau de bord : les chiffres de la semaine, les muscles en couleurs, les semaines, la progression.
function renderTrack() {
  const [from, to] = weekRange();
  const week = sessionsInRange(from, to), goal = weeklyGoal();
  const { cardioMin } = muscleWeek(from, to);
  const streak = goalStreak();
  const kpi = (label, v, unit, ok) => `<div class="kpi${ok ? ' ok' : ''}"><span class="kpi-k">${label}</span>
    <span class="kpi-v serif">${v}<small>${unit}</small></span></div>`;
  $('#view').innerHTML = `
    <div class="page-head">
      <div class="head-row"><span class="eyebrow">${t('weekOfLong', { date: esc(fmtDM(from)) })}</span></div>
      <h1 class="sr-only">${t('navTrack')}</h1>
    </div>
    <div class="kpis">
      ${kpi(t('kpiSessions'), week, ` / ${goal}`, week >= goal)}
      ${kpi(t('kpiCardio'), Math.round(cardioMin), ` / ${CARDIO_TARGET} min`, cardioMin >= CARDIO_TARGET)}
      ${kpi(t('kpiStreak'), streak, ` ${t('weeksShort')}`, streak > 0)}
    </div>
    <section class="card">${musclesCardHtml()}</section>
    <section class="card"><h2 class="card-title">${t('lastWeeks')}</h2>${weeksHtml()}</section>
    <section class="card">${progressCardHtml()}</section>`;
}
// Nombre de séances par semaine : { 'AAAA-MM-JJ' du lundi: n }
function sessionsPerWeek() {
  const counts = {};
  for (const s of activeSessions()) { const k = isoDate(mondayOf(toDate(s.id))); counts[k] = (counts[k] || 0) + 1; }
  return counts;
}
// Semaines d'affilée où l'objectif est atteint (la semaine en cours compte dès qu'il l'est)
function goalStreak() {
  const goal = weeklyGoal();
  const counts = sessionsPerWeek();
  let mon = mondayOf(new Date()), n = 0;
  if ((counts[isoDate(mon)] || 0) >= goal) n++;
  for (mon = addDays(mon, -7); (counts[isoDate(mon)] || 0) >= goal; mon = addDays(mon, -7)) n++;
  return n;
}

// Progression : les exercices faits le plus récemment, avec leur courbe en miniature
function progressCardHtml() {
  const ids = [];
  for (const s of activeSessions()) for (const e of s.entries) if (entryDone(e) && !ids.includes(e.exId)) ids.push(e.exId);
  const head = `<h2 class="card-title">${t('progressTitle')}</h2>`;
  if (!ids.length) return `${head}<p class="muted small">${t('emptyExercises')}</p>`;
  const lines = ids.slice(0, 5).map(id => {
    const hist = historyOf(id);
    const metric = metricFor(hist[0].entry.kind, hist);
    const vals = hist.slice(0, 10).reverse().map(h => metric.get(h.entry)).filter(v => v !== null);
    const a = vals[0], b = vals[vals.length - 1];
    const pct = vals.length >= 2 && a > 0 ? Math.round(100 * (b - a) / a) : null;
    return `<button class="prog-line" onclick="openExercise('${esc(id)}')">${pictoTile(exOfEntry(hist[0].entry), 'small')}
      <span class="prog-name">${esc(entryName(hist[0].entry))}<span class="prog-sub">${esc(metric.fmt(b ?? 0))}</span></span>
      ${sparkline(vals)}
      <span class="prog-pct${pct > 0 ? ' up' : pct < 0 ? ' down' : ''}">${pct === null ? '' : `${pct > 0 ? '+' : pct < 0 ? '−' : ''}${Math.abs(pct)} %`}</span>
    </button>`;
  }).join('');
  return `${head}<div class="prog-list">${lines}</div>
    <button class="btn-line row-btn" onclick="openExerciseList()">${t('allExercises', { n: ids.length })}${icon('chev')}</button>`;
}
function sparkline(vals) {
  if (vals.length < 2) return '<span class="spark"></span>';
  const lo = Math.min(...vals), hi = Math.max(...vals), w = 64, h = 20;
  const pts = vals.map((v, i) => `${(i * w / (vals.length - 1)).toFixed(1)},${(hi === lo ? h / 2 : h - 2 - (v - lo) * (h - 4) / (hi - lo)).toFixed(1)}`);
  return `<svg class="spark" viewBox="0 0 ${w} ${h}" aria-hidden="true"><polyline points="${pts.join(' ')}"/></svg>`;
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
  const counts = sessionsPerWeek();
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

// Calendrier d'un mois : jours de sport en vert (choix « Autre jour »).
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
