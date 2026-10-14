// ===== BILAN PAR MUSCLE, PROGRESSION, EXERCICES CRÉÉS =====
// Repères sourcés :
// - ACSM, position officielle 2026 : pour développer un muscle, le travailler au moins 2 jours par semaine ;
// - OMS / ACSM : au moins 150 minutes d'activité d'endurance modérée par semaine ;
// - ACSM 2009 : +2 à 10 % de charge quand on dépasse les répétitions visées.
const DAYS_TARGET = 2;
const CARDIO_TARGET = 150;
const ACSM_2026 = ['ACSM 2026', 'https://www.ovid.com/jnls/acsm-msse/fulltext/10.1249/mss.0000000000003897~american-college-of-sports-medicine-position-stand'];
const ACSM_2009 = ['ACSM 2009', 'https://sfu.ca/~ryand/kin343/ACSMresistance.pdf'];
const WHO_2020 = ['OMS 2020', 'https://www.who.int/publications/i/item/9789240015128'];
const srcLink = ([name, url]) => `<a href="${esc(url)}" target="_blank" rel="noopener">${esc(name)}</a>`;

// ----- Bilan de la semaine : jours par muscle, tous types d'exercices -----
// Un muscle compte un jour quand un exercice fait ce jour-là l'a comme muscle principal
// (muscu, cardio ou gainage : une marche inclinée compte pour les fessiers).
function muscleWeek(from, to) {
  const days = {}, detail = {};
  let cardioMin = 0;
  for (const s of activeSessions()) {
    if (s.id < from || s.id > to) continue;
    for (const e of s.entries || []) {
      if (!entryDone(e)) continue;
      if (e.kind === 'cardio' && e.duration) cardioMin += e.duration;
      for (const m of musclesOf(exOfEntry(e))[0]) {
        (days[m] = days[m] || new Set()).add(s.id);
        (detail[m] = detail[m] || []).push({ date: s.id, entry: e });
      }
    }
  }
  return { days, detail, cardioMin };
}
function lastTrained(m) {
  for (const s of activeSessions()) for (const e of s.entries || []) {
    if (entryDone(e) && musclesOf(exOfEntry(e))[0].includes(m)) return s.id;
  }
  return null;
}
const weekRange = () => [isoDate(mondayOf(new Date())), isoDate()];

function musclesCardHtml() {
  const [from, to] = weekRange();
  const { days, cardioMin } = muscleWeek(from, to);
  const goals = prefs().goals || {};
  const n = m => (days[m] || new Set()).size;
  const list = MUSCLES.filter(m => n(m) || goals[m])
    .sort((a, b) => ((goals[b] === 'up') - (goals[a] === 'up')) || ((goals[a] === 'down') - (goals[b] === 'down')) || (n(b) - n(a)));

  // Points d'attention : muscles à ménager sollicités, muscles à développer en retard
  const alerts = MUSCLES.filter(m => goals[m] === 'down' && n(m)).map(m => t('alertSpareDays', { m: cap(muscleShort(m)), n: tn('daysN', n(m)) }));
  for (const m of MUSCLES.filter(m => goals[m] === 'up' && n(m) < DAYS_TARGET)) {
    if (n(m)) { alerts.push(t('alertOnceDays', { m: cap(muscleShort(m)) })); continue; }
    const lt = lastTrained(m);
    alerts.push(lt ? t('alertNotSince', { m: cap(muscleShort(m)), when: relDay(lt) }) : t('alertNever', { m: cap(muscleShort(m)) }));
  }

  const dots = (k, g) => {
    const slots = Math.max(g === 'up' ? DAYS_TARGET : 0, k, 1);
    return Array.from({ length: slots }, (_, i) => `<span class="dot${i < k ? ' on' : ''}${i >= k && g === 'up' && i < DAYS_TARGET ? ' want' : ''}"></span>`).join('');
  };
  const rows = list.map(m => {
    const k = n(m), g = goals[m];
    return `<button class="mrow ${g === 'down' ? 'warn' : g === 'up' ? 'up' : ''}" onclick="openMuscle('${m}')" aria-label="${esc(t('muscleOpenAria', { m: t('m_' + m) }))}">
      <span class="mname">${esc(t('m_' + m).replace(/\s*\(.*\)$/, ''))}${g === 'up' ? ` <span class="mgoal">${t('goalUp').toLowerCase()}</span>` : g === 'down' ? ` <span class="mgoal warn">${t('goalDown').toLowerCase()}</span>` : ''}</span>
      <span class="mdots" role="img" aria-label="${esc(tn('daysN', k))}">${dots(k, g)}</span>
      <span class="mval">${tn('daysN', k)}</span>
    </button>`;
  }).join('');
  const pct = Math.min(100, Math.round(100 * cardioMin / CARDIO_TARGET));

  return `<h2 class="card-title">${t('musclesWeek')}</h2>
    <p class="muted small">${t('musclesDaysHint')}</p>
    ${alerts.length ? `<ul class="malerts">${alerts.slice(0, 4).map(a => `<li>${esc(a)}</li>`).join('')}</ul>` : ''}
    ${rows || `<p class="muted small">${t('musclesEmpty')}</p>`}
    ${!Object.keys(goals).length ? `<button class="link" onclick="openGoals()">${t('musclesSetGoals')}</button>` : ''}
    <div class="cardio-line">
      <div class="mrow-top"><span class="mname">${t('cardioWeek')}</span><span class="mval">${t('cardioOf', { n: Math.round(cardioMin), target: CARDIO_TARGET })}</span></div>
      <div class="mbar"><span class="main" style="width:${pct}%"></span></div>
    </div>
    <p class="tips-src">${t('musclesDaysSrc', { d: DAYS_TARGET, c: CARDIO_TARGET })} ${srcLink(ACSM_2026)}, ${srcLink(WHO_2020)}</p>`;
}

// Écran d'accueil : le muscle à développer le plus en retard cette semaine
function startHint() {
  const [from, to] = weekRange();
  const { days } = muscleWeek(from, to);
  const late = MUSCLES.filter(m => muscleGoal(m) === 'up' && !(days[m] || new Set()).size);
  return late.length ? t('startMissing', { m: muscleNames(late.slice(0, 2)) }) : '';
}

// ----- Exercices pour un muscle (depuis le bilan) -----
// D'abord ceux qui le ciblent en principal, sans solliciter de muscle à ménager ; à égalité,
// ceux que tu connais déjà et tes favoris. Puis ceux où il aide.
function exercisesFor(m) {
  const pool = allExercises().filter(e => !isHidden(e.id));
  const rank = e => {
    const [main, sec] = musclesOf(e);
    // Muscle à ménager sollicité : en principal, tout en bas ; en soutien, après les autres
    const spare = main.some(x => muscleGoal(x) === 'down') ? 2 : sec.some(x => muscleGoal(x) === 'down') ? 1 : 0;
    return [spare, -(isFav(e.id) ? 1 : 0), -historyOf(e.id).length, main.length];
  };
  const cmp = (a, b) => { const ra = rank(a), rb = rank(b); for (let i = 0; i < ra.length; i++) if (ra[i] !== rb[i]) return ra[i] - rb[i]; return byName(a, b); };
  return {
    main: pool.filter(e => musclesOf(e)[0].includes(m)).sort(cmp),
    help: pool.filter(e => !musclesOf(e)[0].includes(m) && musclesOf(e)[1].includes(m)).sort(cmp),
  };
}
function openMuscle(m) {
  const [from, to] = weekRange();
  const { days, detail } = muscleWeek(from, to);
  const k = (days[m] || new Set()).size, g = muscleGoal(m);
  const lists = exercisesFor(m);
  const item = ex => {
    const last = historyOf(ex.id)[0];
    const note = goalNote(ex);
    return `<div class="pick">
      <div class="pick-main">${pictoTile(ex, 'small')}<span class="pick-text"><span class="pick-name">${esc(exLabel(ex))}${isFav(ex.id) ? ` <span class="fav-mark">${icon('star')}</span>` : ''}</span>${enLine(exEn(ex))}
        ${note ? `<span class="pick-warn">${esc(note)}</span>` : ''}
        <span class="pick-sub">${esc(last ? `${entrySummary(last.entry)} · ${relDay(last.date)}` : t('neverDone'))}</span></span></div>
      <button class="add-btn" onclick="addFromMuscle('${esc(ex.id)}')" aria-label="${esc(t('addToSession'))} : ${esc(exLabel(ex))}">${icon('plus')}</button>
    </div>`;
  };
  const week = (detail[m] || []).map(d => `<div class="day-line"><span>${esc(cap(fmtDay(d.date)))} · ${esc(entryName(d.entry))}</span><span>${esc(entrySummary(d.entry))}</span></div>`).join('');
  openSheet(`
    <div class="sheet-head">
      <div><div class="eyebrow">${g === 'up' ? t('goalUp') : g === 'down' ? t('goalDown') : t('musclesWeek')}</div><h3>${esc(t('m_' + m))}</h3></div>
      <button class="icon-btn" onclick="closeSheet()" aria-label="${t('close')}">${icon('close')}</button>
    </div>
    <p class="muted small">${g === 'up' ? t('muscleDaysUp', { n: tn('daysN', k), target: DAYS_TARGET }) : t('muscleDaysN', { n: tn('daysN', k) })}</p>
    ${week ? `<div class="week-detail">${week}</div>` : ''}
    ${lists.main.length ? `<p class="pick-group">${t('muscleMain')}</p>${lists.main.map(item).join('')}` : ''}
    ${lists.help.length ? `<p class="pick-group">${t('muscleHelp')}</p>${lists.help.slice(0, 6).map(item).join('')}` : ''}
    ${!lists.main.length && !lists.help.length ? `<p class="muted small empty-list">${t('muscleNone')}</p>` : ''}`);
}
// Ajoute l'exercice à la séance du jour et y retourne
function addFromMuscle(exId) {
  UI.date = isoDate();
  UI.tab = 'today';
  try { localStorage.setItem('fitcoach-tab', 'today'); } catch (e) {}
  render();
  pickExercise(exId);
}

// ----- Objectif de répétitions et progression -----
// prefs.repTargets : { exId: [min, max] }. Quand chaque série de la dernière séance atteint le haut
// de la fourchette au même poids, on propose +2 à 10 % (ACSM 2009), puis on repart vers le bas.
const repTarget = exId => (prefs().repTargets || {})[exId] || null;
function stepRepTarget(exId, i, d) {
  const all = prefs().repTargets || {};
  const cur = all[exId] ? [...all[exId]] : [8, 12];
  cur[i] = Math.max(1, Math.min(50, cur[i] + d));
  if (cur[0] > cur[1]) cur[i === 0 ? 1 : 0] = cur[i];
  savePrefs({ repTargets: { ...all, [exId]: cur } });
  const box = $('#rep-target');
  if (box) box.innerHTML = repTargetHtml(exId, true);
}
function clearRepTarget(exId) {
  const { [exId]: _, ...rest } = prefs().repTargets || {};
  savePrefs({ repTargets: rest });
  const box = $('#rep-target');
  if (box) box.innerHTML = repTargetHtml(exId);
}
function repTargetHtml(exId, justSet) {
  const tg = repTarget(exId) || (justSet ? [8, 12] : null);
  if (!tg) return `<button class="chip dashed rep-set" onclick="stepRepTarget('${esc(exId)}',0,0)">${icon('plus')}${t('repTargetAdd')}</button>`;
  const st = i => `<div class="stepper small"><button type="button" onclick="stepRepTarget('${esc(exId)}',${i},-1)" aria-label="${t('minus')}">${icon('minus')}</button><span class="serif">${tg[i]}</span><button type="button" onclick="stepRepTarget('${esc(exId)}',${i},1)" aria-label="${t('plus')}">${icon('plus')}</button></div>`;
  return `<div class="rep-target"><p class="sub-label">${t('repTarget')}</p>
    <div class="rep-row">${st(0)}<span class="muted">${t('to')}</span>${st(1)}<button class="link" onclick="clearRepTarget('${esc(exId)}')">${t('remove')}</button></div>
    <p class="muted small">${t('repTargetHint', { b: tg[1], a: tg[0] })}</p></div>`;
}
function progressionFor(exId, beforeDate) {
  const hist = historyOf(exId).filter(h => h.date < beforeDate && h.entry.kind === 'sets');
  if (!hist.length) return null;
  const last = doneSets(hist[0].entry);
  if (!last.length) return null;
  const w = last[0].weight;
  if (!w || last.some(s => s.weight !== w)) return null;
  const tg = repTarget(exId);
  let planned;
  if (tg) {
    // Objectif fixé : le haut de la fourchette atteint à chaque série
    if (last.some(s => (s.reps || 0) < tg[1])) return null;
    planned = tg[1];
  } else {
    // Sans objectif : chaque série dépasse les répétitions de la séance d'avant au même poids
    if (hist.length < 2) return null;
    const prev = doneSets(hist[1].entry);
    if (!prev.length || prev.some(s => s.weight !== w)) return null;
    planned = Math.max(...prev.map(s => s.reps || 0));
    if (!planned || last.some(s => (s.reps || 0) < planned + 1)) return null;
  }
  const round = v => Math.round(v * 4) / 4;
  const lo = Math.max(w + 0.25, round(w * 1.02)), hi = Math.max(lo, round(w * 1.10));
  return { w, lo, hi, planned, target: !!tg };
}
// Sur l'exercice en cours : une seule ligne
function progressionChip(exId, entryId) {
  const p = progressionFor(exId, UI.date);
  if (!p) return '';
  return `<button class="progress-chip" onclick="applyWeight('${esc(entryId)}', ${p.lo})">
    <span class="pc-arrow">↑</span><span class="pc-text">${t(p.target ? 'progressChipTarget' : 'progressChip', { w: fmtNum(p.lo) })}</span><span class="pc-act">${t('apply')}</span></button>`;
}
// Sur la page de l'exercice : le détail et la source
function progressionHtml(exId) {
  const p = progressionFor(exId, isoDate() + 'z');
  if (!p) return '';
  return `<div class="progress-tip">
    <p>${t(p.target ? 'progressTipTarget' : 'progressTip', { w: fmtNum(p.w), r: p.planned, lo: fmtNum(p.lo), hi: fmtNum(p.hi) })}</p>
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
// Rattache des exercices créés à des exercices de la liste ({ idCréé: idListe }) : l'historique,
// les favoris, les notes… passent sous l'exercice de la liste, puis les exercices créés sont supprimés.
// Tout est fait en une passe (une écriture par séance, une seule pour les réglages).
function attachExercise(customId, catId) { attachMany({ [customId]: catId }); }
function attachMany(map) {
  const ids = Object.keys(map);
  for (const s of Data.sessions) {
    if (!(s.entries || []).some(e => map[e.exId])) continue;
    const copy = JSON.parse(JSON.stringify(s));
    copy.entries.forEach(e => { const to = map[e.exId]; if (to) { e.exId = to; e.name = CATALOG_BY_ID[to].name; } });
    saveSession(copy);
  }
  const p = prefs();
  const swap = list => [...new Set((list || []).map(id => map[id] || id))];
  const moveKeys = (obj, merge) => {
    if (!obj || !ids.some(id => id in obj)) return obj;
    const out = {};
    for (const [k, v] of Object.entries(obj)) {
      const to = map[k] || k;
      out[to] = out[to] !== undefined ? merge(out[to], v) : v;
    }
    return out;
  };
  const listMerge = (a, b) => [...new Set([...a, ...b])];
  savePrefs({
    favorites: swap(p.favorites),
    hidden: (p.hidden || []).filter(id => !map[id]),
    extraFields: moveKeys(p.extraFields, listMerge),
    moves: moveKeys(p.moves, listMerge),
    exNotes: moveKeys(p.exNotes, (a, b) => `${a}\n${b}`),
  });
  ids.forEach(deleteCustomExercise);
}
