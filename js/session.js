// ===== ÉCRAN SÉANCE : accueil, exercice en cours (muscu et cardio), lignes de la séance =====

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
  const session = sessionOf(UI.date) || {};
  const entries = session.entries || [];
  const last = activeSessions().find(s => s.id < UI.date);
  const weekCount = sessionsInRange(isoDate(mondayOf(new Date())), today);
  // Jour passé laissé tel quel (pas modifié aujourd'hui) : un exercice resté « en cours » s'affiche comme une ligne
  const editedToday = isToday || (session.updatedAt && isoDate(new Date(session.updatedAt)) === today);
  const current = editedToday ? entries.find(isPending) : null;
  // Séance lancée depuis une routine : « Haut du corps · 2 / 5 »
  const eyebrow = session.routine && entries.length
    ? `${esc(session.routine.name)} · ${entries.filter(e => !isPending(e)).length} / ${entries.length}`
    : cap(fmtDay(UI.date));

  let html = `
    <div class="page-head">
      <div class="head-row">
        <span class="eyebrow">${eyebrow}</span>
        <span class="chrono" id="chrono">${chronoText()}</span>
      </div>
      <div class="head-row">
        <h1>${!entries.length && isToday ? t('startTitle') : isToday ? t('todayTitle') : t('dayTitle', { date: esc(fmtShort(UI.date)) })}</h1>
        ${current ? '' : `<button class="date-chip" onclick="openDayPicker()" aria-label="${t('otherDayAria')}">${icon('cal')}${t('otherDay')}</button>`}
      </div>
    </div>`;

  if (!entries.length) {
    const hint = isToday ? startHint() : '';
    html += `
      <div class="empty">
        <p class="muted">${isToday ? t('weekProgress', { n: weekCount, goal: weeklyGoal() }) : t('noSessionDay')}
          ${hint ? ` ${hint}` : ''}${!isToday && last ? '' : ''}</p>
        ${isToday ? setupCardHtml() : ''}
        ${routineCardsHtml()}
        <button class="${routines().length ? 'btn-outline' : 'btn-accent big'}" onclick="openPicker()">${icon('plus')}${isToday ? t('freeSession') : t('addExercise')}</button>
        ${!routines().length && isToday && !setupPending() ? `<p class="muted small routine-hint">${t('routineHint')}</p>` : ''}
        ${quickFavs()}
      </div>`;
  } else {
    html += `<div class="rows">${entries.map(e => e === current ? currentCard(e) : entryRow(e)).join('')}</div>
      <button class="btn-outline" onclick="openPicker()">${icon('plus')}${current && !current.open ? t('addAnother') : t('nextExercise')}</button>
      ${current ? '' : quickFavs()}
      ${entries.some(entryDone) ? `<p class="muted small center foot">${sessionFoot(entries)}</p>` : ''}
      ${!current && entries.some(entryDone) ? `<p class="center"><button class="link" onclick="openSaveRoutine()">${t('saveAsRoutine')}</button></p>` : ''}`;
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
  const pending = isPending(e);
  const sub = e.kind === 'sets' ? (pending && !doneSets(e).length ? tn('plannedSets', e.sets.length) : entrySummary(e))
    : (pending ? t('plannedShort') : entrySummary(e));
  const mark = !pending ? `<span class="row-mark">${icon('check')}</span>` : icon('chev');
  const setup = setupSummary(e.setup);
  return `<button class="row" onclick="openEntry('${esc(e.id)}')">${pictoTile(exOfEntry(e))}
    <span class="row-main"><span class="row-name">${esc(entryName(e))}</span>${enLine(entryEn(e))}<span class="row-sub">${esc(sub)}</span>
    ${setup ? `<span class="row-setup">${esc(setup)}</span>` : ''}
    ${e.note ? `<span class="row-note">${esc(e.note)}</span>` : ''}</span>${mark}</button>`;
}

// L'exercice en cours : un tableau des séries (poids, répétitions, coche).
// La ligne en cours a ses boutons − / + ; toucher un poids ou un nombre ouvre le réglage précis.
function currentCard(e) {
  if (e.kind !== 'sets') return cardioCard(e);
  const i = pendingIndex(e);
  const id = esc(e.id);
  const last = lastTimeOf(e.exId);
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
    ${nowHead(e, nowSubline(e.exId, last))}
    ${setup ? `<p class="now-setup">${esc(setup)}</p>` : ''}
    ${progressionChip(e.exId, e.id)}
    <div class="sets-grid">
      <div class="srow hd"><span class="sn">#</span><span>${t('colWeight')}</span><span>${t('colReps')}</span><span></span></div>
      ${rows}
    </div>
    ${i < 0 ? `<div class="all-done">
      <p class="all-done-title">${tn('allSetsDone', doneSets(e).length)}</p>
      <div class="sets-actions">
        <button class="add" onclick="addPlannedSet('${id}')">${icon('plus')}${t('oneMoreSet')}</button>
        <button class="finish" onclick="stopEntry('${id}')">${t('finishExLong')}</button>
      </div>
    </div>` : `<div class="sets-actions">
      <button class="add" onclick="addPlannedSet('${id}')">${icon('plus')}${t('addSetBtn')}</button>
      <button onclick="stopEntry('${id}')">${t('finishEx')}</button>
    </div>`}
    <div class="now-links">
      <button onclick="openEntry('${id}')">${t('details')}</button>
    </div>
  </section>`;
}

// « Objectif 8 à 12 rép. · dernière fois 3 × 12 »
function nowSubline(exId, last) {
  const tg = repTarget(exId);
  return [tg && t('repTargetShort', { a: tg[0], b: tg[1] }), last && t('lastShortLower', { what: entrySummary(last.entry) })].filter(Boolean).join(' · ');
}
// En-tête de la carte en cours (muscu et cardio) : retirer, picto (conseils), nom, ligne « dernière fois »
const nowHead = (e, subline) => `<div class="now-head">
      <button class="icon-btn now-close" onclick="removeCurrent('${esc(e.id)}')" aria-label="${t('removeEx')}">${icon('close')}</button>
      <button class="picto-btn" onclick="openTips('${esc(e.exId)}')" aria-label="${t('tipsAria')}">${pictoTile(exOfEntry(e), 'big')}<span class="picto-help" aria-hidden="true">${icon('info')}</span></button>
      <div class="now-head-text"><h2 class="now-name">${esc(entryName(e))}</h2>${enLine(entryEn(e))}
        ${subline ? `<p class="now-last">${esc(subline)}</p>` : ''}
        ${tipsChip(e.exId)}</div>
    </div>`;
const tipsChip = exId => `<button class="tips-chip" onclick="openTips('${esc(exId)}')">${icon('info')}${t('tipsChip')}</button>`;

// ----- Carte en cours (cardio, cours) : les champs de l'exercice, préremplis -----
function cardioCard(e) {
  const id = esc(e.id);
  const last = lastTimeOf(e.exId);
  const fields = fieldsFor(e.exId, e.kind, e);
  const cells = fields.filter(k => k !== 'track').map(k => `<div class="fcell">
      <p class="flabel">${t('fs_' + k)}</p>
      <div class="fstep"><button onclick="stepEntryField('${id}','${k}',-1)" aria-label="${t('minus')} : ${t('fs_' + k)}">${icon('minus')}</button>
        <input class="serif" inputmode="decimal" value="${e[k] === null || e[k] === undefined ? '' : fmtNum(e[k])}" placeholder="—" data-live oninput="setEntryField('${id}','${k}',this.value)" onfocus="this.select()" aria-label="${t('fs_' + k)}">
        <button onclick="stepEntryField('${id}','${k}',1)" aria-label="${t('plus')} : ${t('fs_' + k)}">${icon('plus')}</button></div>
      <p class="funit">${t('unit_' + k)}</p></div>`).join('');
  const track = fields.includes('track') ? `<div class="chips wrap ftrack">${tracks().map(tr =>
    `<button class="chip${e.track === tr.id ? ' active' : ''}" onclick="setEntryTrack('${id}','${esc(tr.id)}')">${esc(tr.name)}</button>`).join('')}</div>` : '';
  const diff = cardioDiff(e, last && last.entry);
  return `<section class="now sets" aria-label="${t('currentAria')}">
    ${nowHead(e, last ? t('lastShort', { what: entrySummary(last.entry) }) : '')}
    <div class="fgrid">${cells}</div>
    ${track}
    ${diff ? `<p class="progress-chip static"><span class="pc-arrow">↑</span><span>${esc(diff)}</span></p>` : ''}
    <button class="btn-accent big" onclick="finishCardio('${id}')">${icon('check')}${t('done')}</button>
    <div class="now-links"><button onclick="openEntry('${id}')">${t('details')}</button></div>
  </section>`;
}
// « Par rapport à la dernière fois : pente +1 %, vitesse +0,5 km/h »
function cardioDiff(e, prev) {
  if (!prev) return '';
  const parts = FIELD_ORDER.filter(k => k !== 'track' && typeof e[k] === 'number' && typeof prev[k] === 'number' && e[k] !== prev[k])
    .map(k => { const d = Math.round((e[k] - prev[k]) * 100) / 100; return t('sum_' + k, { v: (d > 0 ? '+' : '−') + fmtNum(Math.abs(d)) }); });
  return parts.length ? t('vsLast', { what: parts.join(', ') }) : '';
}
function stepEntryField(entryId, k, dir) {
  const { step, max = Infinity } = FIELDS[k];
  updateEntry(UI.date, entryId, e => {
    const cur = e[k];
    e[k] = cur === null || cur === undefined ? (dir > 0 ? step : null) : Math.min(max, Math.max(0, Math.round((cur + dir * step) * 100) / 100)) || null;
  });
}
function setEntryField(entryId, k, v) {
  const n = numOrNull(v);
  updateEntry(UI.date, entryId, e => { e[k] = n === null ? null : Math.min(FIELDS[k].max || Infinity, Math.max(0, n)); });
}
function setEntryTrack(entryId, trackId) {
  updateEntry(UI.date, entryId, e => { e.track = e.track === trackId ? null : trackId; });
}
function finishCardio(entryId) {
  updateEntry(UI.date, entryId, e => { delete e.pending; });
  toast(t('exerciseDone'));
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
// La dernière série cochée ne ferme pas l'exercice : il reste ouvert (« Une de plus » ou « Terminer l'exercice »)
function finishSetAt(entryId, k) {
  updateEntry(UI.date, entryId, e => { e.sets[k].done = true; if (pendingIndex(e) < 0) e.open = true; });
  toast(t('setNDone', { n: k + 1 }));
}
function undoSet(entryId, k) {
  updateEntry(UI.date, entryId, e => { e.sets[k].done = false; });
}
// Répétitions de la série en cours, sans ouvrir de panneau (ex. 8 au lieu de 10 à la dernière série)
function stepSetReps(entryId, k, d) {
  updateEntry(UI.date, entryId, e => { e.sets[k].reps = Math.max(0, (e.sets[k].reps || 0) + d) || null; });
}
function addPlannedSet(entryId) {
  updateEntry(UI.date, entryId, e => { e.sets.push({ ...e.sets[e.sets.length - 1], done: false }); });
}
// Terminer : les séries prévues non faites sont retirées
function stopEntry(entryId) {
  const e = updateEntry(UI.date, entryId, e => { e.sets = e.sets.filter(s => s.done !== false); delete e.open; });
  if (e && e.sets.length) toast(t('exerciseDone'));
}
// Passer à un autre exercice termine celui qui était resté ouvert après sa dernière série
function closeOpenEntries(session) {
  for (const e of session.entries) delete e.open;
}

function goToDay(date) {
  if (!date) return;
  UI.date = date > isoDate() ? isoDate() : date;
  UI.tab = 'today';
  closeSheet();
  window.scrollTo(0, 0);
  render();
}
