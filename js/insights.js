// ===== BILAN PAR MUSCLE, PROGRESSION, EXERCICES CRÉÉS =====
// Repères (ACSM, position officielle 2026) : pour développer un muscle, au moins 10 séries par
// semaine et au moins 2 séances par semaine. Progression (ACSM 2009) : +2 à 10 % de charge quand
// on fait 1 à 2 répétitions de plus que prévu.
const SETS_TARGET = 10;
const DAYS_TARGET = 2;
const ACSM_2026 = ['ACSM 2026', 'https://www.ovid.com/jnls/acsm-msse/fulltext/10.1249/mss.0000000000003897~american-college-of-sports-medicine-position-stand'];
const ACSM_2009 = ['ACSM 2009', 'https://sfu.ca/~ryand/kin343/ACSMresistance.pdf'];
const srcLink = ([name, url]) => `<a href="${esc(url)}" target="_blank" rel="noopener">${esc(name)}</a>`;

// ----- Bilan de la semaine -----
// Séries faites par muscle : « ciblées » (muscle principal de l'exercice) et « en soutien » (secondaire).
function muscleWeek(from, to) {
  const main = {}, sec = {}, days = {};
  for (const s of activeSessions()) {
    if (s.id < from || s.id > to) continue;
    for (const e of s.entries || []) {
      if (e.kind !== 'sets') continue;
      const n = doneSets(e).length;
      if (!n) continue;
      const [pm, sm] = musclesOf(exOfEntry(e));
      for (const m of pm) { main[m] = (main[m] || 0) + n; (days[m] = days[m] || new Set()).add(s.id); }
      for (const m of sm) if (!pm.includes(m)) sec[m] = (sec[m] || 0) + n;
    }
  }
  return { main, sec, days };
}
// Dernier jour où un muscle a été travaillé en principal
function lastTrained(m) {
  for (const s of activeSessions()) for (const e of s.entries || []) {
    if (e.kind === 'sets' && doneSets(e).length && musclesOf(exOfEntry(e))[0].includes(m)) return s.id;
  }
  return null;
}

function musclesCardHtml() {
  const from = isoDate(mondayOf(new Date())), to = isoDate();
  const { main, sec, days } = muscleWeek(from, to);
  const goals = prefs().goals || {};
  const list = MUSCLES.filter(m => main[m] || sec[m] || goals[m] === 'up')
    .sort((a, b) => ((goals[b] === 'up') - (goals[a] === 'up')) || ((main[b] || 0) - (main[a] || 0)));
  const scale = Math.max(SETS_TARGET, ...list.map(m => (main[m] || 0) + (sec[m] || 0)));

  // Points d'attention : d'abord les muscles à ménager sollicités, puis ceux à développer en retard
  const alerts = MUSCLES.filter(m => goals[m] === 'down' && main[m]).map(m => t('alertSpare', { m: cap(muscleShort(m)), n: main[m] }));
  for (const m of MUSCLES.filter(m => goals[m] === 'up')) {
    const n = main[m] || 0, d = (days[m] || new Set()).size;
    if (!n) {
      const lt = lastTrained(m);
      alerts.push(lt ? t('alertNotSince', { m: cap(muscleShort(m)), when: relDay(lt) }) : t('alertNever', { m: cap(muscleShort(m)) }));
    } else if (d < DAYS_TARGET) alerts.push(t('alertOnce', { m: cap(muscleShort(m)) }));
  }

  const rows = list.map(m => {
    const n = main[m] || 0, s2 = sec[m] || 0, g = goals[m];
    const cls = g === 'down' ? 'warn' : g === 'up' ? 'up' : '';
    return `<div class="mrow ${cls}">
      <div class="mrow-top"><span class="mname">${esc(t('m_' + m).replace(/\s*\(.*\)$/, ''))}${g === 'up' ? ` <span class="mgoal">${t('goalUp').toLowerCase()}</span>` : g === 'down' ? ` <span class="mgoal warn">${t('goalDown').toLowerCase()}</span>` : ''}</span>
        <span class="mval">${tn('setsShort', n)}${s2 ? ` <span class="muted">+ ${s2}</span>` : ''}</span></div>
      <div class="mbar" role="img" aria-label="${esc(t('m_' + m))} : ${tn('setsShort', n)}">
        <span class="main" style="width:${(100 * n / scale).toFixed(1)}%"></span><span class="sec" style="width:${(100 * s2 / scale).toFixed(1)}%"></span>
        ${g === 'up' ? `<span class="target" style="left:${(100 * SETS_TARGET / scale).toFixed(1)}%"></span>` : ''}
      </div>
    </div>`;
  }).join('');

  return `<h2 class="card-title">${t('musclesWeek')}</h2>
    <p class="muted small">${t('musclesWeekHint')}</p>
    ${alerts.length ? `<ul class="malerts">${alerts.slice(0, 4).map(a => `<li>${esc(a)}</li>`).join('')}</ul>` : ''}
    ${rows || `<p class="muted small">${t('musclesEmpty')}</p>`}
    ${!Object.keys(goals).length ? `<button class="link" onclick="openGoals()">${t('musclesSetGoals')}</button>` : ''}
    <p class="tips-src">${t('musclesSrc', { n: SETS_TARGET, d: DAYS_TARGET })} ${srcLink(ACSM_2026)}</p>`;
}

// ----- Progression -----
// Dernière séance faite à un seul poids, avec dans chaque série 1 ou 2 répétitions de plus que
// prévu (prévu = répétitions de la séance d'avant au même poids) : on propose +2 à 10 %.
function progressionFor(exId, beforeDate) {
  const hist = historyOf(exId).filter(h => h.date < beforeDate && h.entry.kind === 'sets');
  if (hist.length < 2) return null;
  const last = doneSets(hist[0].entry), prev = doneSets(hist[1].entry);
  if (!last.length || !prev.length) return null;
  const w = last[0].weight;
  if (!w || last.some(s => s.weight !== w) || prev.some(s => s.weight !== w)) return null;
  const planned = Math.max(...prev.map(s => s.reps || 0));
  if (!planned || last.some(s => (s.reps || 0) < planned + 1)) return null;
  const round = v => Math.round(v * 4) / 4;
  const lo = Math.max(w + 0.25, round(w * 1.02)), hi = Math.max(lo, round(w * 1.10));
  return { w, lo, hi, planned };
}
function progressionHtml(exId, entryId) {
  const p = progressionFor(exId, UI.date);
  if (!p) return '';
  return `<div class="progress-tip">
    <p>${t('progressTip', { w: fmtNum(p.w), r: p.planned, lo: fmtNum(p.lo), hi: fmtNum(p.hi) })}</p>
    ${entryId ? `<button class="btn-accent" onclick="applyWeight('${esc(entryId)}', ${p.lo})">${t('progressApply', { w: fmtNum(p.lo) })}</button>` : ''}
    <p class="tips-src">${t('source')} : ${srcLink(ACSM_2009)}</p>
  </div>`;
}
// Le nouveau poids s'applique aux séries prévues (pas encore faites)
function applyWeight(entryId, v) {
  updateEntry(UI.date, entryId, e => e.sets.forEach(s => { if (s.done === false) s.weight = v; }));
  toast(t('progressApplied', { w: fmtNum(v) }));
}

// ----- Mes exercices créés : muscles, rattachement à la liste -----
function openMyExercises() {
  openSheet(`
    <div class="sheet-head">
      <div><div class="eyebrow">${t('account')}</div><h3>${t('myExercises')}</h3></div>
      <button class="icon-btn" onclick="closeSheet()" aria-label="${t('close')}">${icon('close')}</button>
    </div>
    <p class="muted small">${t('myExercisesHint')}</p>
    <div id="my-ex"></div>`, renderMyExercises);
}
const sessionsUsing = id => Data.sessions.filter(s => (s.entries || []).some(e => e.exId === id)).length;
function renderMyExercises() {
  const box = $('#my-ex');
  if (!box) return;
  const list = allExercises().filter(e => e.custom).sort(byName);
  if (!list.length) { box.innerHTML = `<p class="muted small empty-list">${t('myExercisesEmpty')}</p>`; return; }
  box.innerHTML = list.map(ex => {
    // Suggestion seulement pour un exercice « flou » : pas une variante voulue, pas de muscles renseignés
    const sim = ex.variantOf || (ex.muscles || []).length ? null
      : similarExercises(ex.name).map(x => x.e).find(e => !e.custom && e.kind === ex.kind);
    const musc = musclesLine(ex);
    const open = UI.editMuscles === ex.id;
    return `<div class="myex">
      <div class="myex-top">${pictoTile(ex)}<div class="myex-text"><span class="pick-name">${esc(ex.name)}</span>
        <span class="${musc ? 'pick-musc' : 'pick-warn'}">${esc(musc || t('noMuscles'))}</span>
        <span class="pick-sub">${tn('workouts', sessionsUsing(ex.id))}</span></div></div>
      ${sim ? `<p class="small myex-sim">${t('looksLike')} <b>${esc(exLabel(sim))}</b></p>` : ''}
      <div class="myex-actions">
        ${sim ? `<button class="btn-accent" onclick="confirmAttach('${esc(ex.id)}','${esc(sim.id)}')">${t('attachTo', { name: esc(exLabel(sim)) })}</button>` : ''}
        <button class="chip" onclick="openAttach('${esc(ex.id)}')">${sim ? t('attachOther') : t('attachPick')}</button>
        <button class="chip${open ? ' active' : ''}" onclick="UI.editMuscles=${open ? 'null' : `'${esc(ex.id)}'`};renderMyExercises()">${t('editMuscles')}</button>
      </div>
      ${open ? `<div class="chips wrap">${MUSCLES.map(m => `<button class="chip${(ex.muscles || []).includes(m) ? ' active' : ''}" aria-pressed="${(ex.muscles || []).includes(m)}" onclick="toggleCustomMuscle('${esc(ex.id)}','${m}')">${t('m_' + m)}</button>`).join('')}</div>` : ''}
    </div>`;
  }).join('');
}
function toggleCustomMuscle(id, m) {
  const ex = Data.exercises.find(e => e.id === id);
  if (!ex) return;
  const mus = ex.muscles || [];
  saveCustomExercise({ ...ex, muscles: mus.includes(m) ? mus.filter(x => x !== m) : [...mus, m] });
}
// Choisir l'exercice de la liste auquel rattacher
function openAttach(customId) {
  UI.attachFor = customId;
  UI.attachQ = '';
  const ex = findExercise(customId);
  openSheet(`
    <div class="sheet-head">
      <div><div class="eyebrow">${t('attachPick')}</div><h3>${esc(ex.name)}</h3></div>
      <button class="icon-btn" onclick="openMyExercises()" aria-label="${t('back')}">${icon('prev')}</button>
    </div>
    <input class="input" type="search" placeholder="${t('search')}" oninput="UI.attachQ=this.value;renderAttachList()" aria-label="${t('searchAria')}">
    <div id="attach-list"></div>`, renderAttachList);
}
function renderAttachList() {
  const box = $('#attach-list');
  if (!box) return;
  const ex = findExercise(UI.attachFor);
  const q = simple(UI.attachQ || '');
  const list = CATALOG.filter(e => e.kind === ex.kind && (!q || [e.name, e.en, ...(e.aliases || [])].some(n => simple(n).includes(q)))).sort(byName);
  box.innerHTML = list.map(e => `<div class="pick"><button class="pick-main" onclick="confirmAttach('${esc(ex.id)}','${esc(e.id)}')">${pictoTile(e)}<span class="pick-text"><span class="pick-name">${esc(exLabel(e))}</span>${enLine(exEn(e))}<span class="pick-musc">${esc(musclesLine(e))}</span></span></button></div>`).join('')
    || `<p class="muted small empty-list">${t('noMatch', { q: esc(UI.attachQ) })}</p>`;
}
function confirmAttach(customId, catId) {
  const ex = findExercise(customId), cat = CATALOG_BY_ID[catId];
  if (!ex || !cat || !confirm(t('attachConfirm', { a: ex.name, b: exLabel(cat), n: sessionsUsing(customId) }))) return;
  attachExercise(customId, catId);
  toast(t('attached', { name: exLabel(cat) }));
  openMyExercises();
}
// Rattache un exercice créé à un exercice de la liste : l'historique, les favoris, les notes…
// passent sous l'exercice de la liste, puis l'exercice créé est supprimé.
function attachExercise(customId, catId) {
  const cat = CATALOG_BY_ID[catId];
  for (const s of Data.sessions) {
    if (!(s.entries || []).some(e => e.exId === customId)) continue;
    const copy = JSON.parse(JSON.stringify(s));
    copy.entries.forEach(e => { if (e.exId === customId) { e.exId = catId; e.name = cat.name; } });
    saveSession(copy);
  }
  const p = prefs();
  const swap = list => [...new Set((list || []).map(id => (id === customId ? catId : id)))];
  const moveKey = (obj, merge) => {
    if (!obj || !(customId in obj)) return obj;
    const { [customId]: v, ...rest } = obj;
    return { ...rest, [catId]: rest[catId] !== undefined ? merge(rest[catId], v) : v };
  };
  savePrefs({
    favorites: swap(p.favorites),
    hidden: swap(p.hidden).filter(id => id !== catId || (p.hidden || []).includes(catId)),
    extraFields: moveKey(p.extraFields, (a, b) => [...new Set([...a, ...b])]),
    moves: moveKey(p.moves, (a, b) => [...new Set([...a, ...b])]),
    exNotes: moveKey(p.exNotes, (a, b) => `${a}\n${b}`),
  });
  deleteCustomExercise(customId);
}
