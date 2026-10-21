// ===== DÉTAIL D'UN EXERCICE : série précise, réglages de muscu, précisions, conseils, éditeur cardio =====

// ===== RÉGLER UNE SÉRIE (poids et répétitions : deux compteurs identiques) =====
// Sous chaque compteur, le chiffre de la même série la dernière fois.
function openSet(entryId, idx) {
  const e = (sessionOf(UI.date).entries || []).find(x => x.id === entryId);
  if (!e) return;
  const set = e.sets[idx];
  // Une série prévue reste prévue : on ne fait que changer ses chiffres (la coche du tableau la valide)
  const keep = set.done === false;
  setDraft = { entryId, idx, reps: set.reps, weight: set.weight || 0, wasDone: set.done !== false, keep };
  const last = lastTimeOf(e.exId);
  const lastSets = last ? doneSets(last.entry) : [];
  const prev = lastSets[Math.min(idx, lastSets.length - 1)];
  const counter = (id, label, value, step, set, prevText) => `
    <div class="counter">
      <p class="label">${label}</p>
      <div class="counter-ctl">
        <button type="button" class="round-btn" onclick="${step}(-1)" aria-label="${t('minus')} : ${label}">${icon('minus')}</button>
        <input class="counter-input serif" id="${id}" inputmode="decimal" value="${value}" placeholder="0" oninput="${set}(this.value)" onfocus="this.select()" aria-label="${label}">
        <button type="button" class="round-btn" onclick="${step}(1)" aria-label="${t('plus')} : ${label}">${icon('plus')}</button>
      </div>
      <p class="counter-prev">${prevText ? esc(t('prevValue', { v: prevText })) : '&nbsp;'}</p>
    </div>`;
  openSheet(`
    <div class="sheet-head">
      <div><div class="eyebrow">${t('setOf', { i: idx + 1, n: e.sets.length })}</div><h3>${esc(entryName(e))}</h3>${enLine(entryEn(e))}</div>
      <button class="icon-btn" onclick="closeSheet()" aria-label="${t('close')}">${icon('close')}</button>
    </div>
    <div class="counters">
      ${counter('weight-input', t('weightKg'), setDraft.weight ? fmtNum(setDraft.weight) : '', 'stepWeight', 'setWeight', prev && prev.weight ? `${fmtNum(prev.weight)} kg` : '')}
      ${counter('reps', t('reps'), setDraft.reps ?? '', 'stepReps', 'setReps', prev && prev.reps ? t('repsUnit', { v: prev.reps }) : '')}
    </div>
    <p class="muted small">${last ? t('lastTime', { when: relDay(last.date), what: esc(entrySummary(last.entry)) }) : t('firstTimeEx')}</p>
    <button class="btn-accent big" onclick="saveSet()">${setDraft.wasDone || keep ? t('save') : t('validateSet')}</button>
    ${setDraft.wasDone ? `<button class="link-danger" onclick="deleteSet()">${t('deleteSet')}</button>` : ''}`);
}
function stepWeight(d) {
  setDraft.weight = Math.max(0, Math.round((setDraft.weight + d * STEP) * 100) / 100);
  $('#weight-input').value = setDraft.weight ? fmtNum(setDraft.weight) : '';
}
function setWeight(v) { setDraft.weight = Math.max(0, numOrNull(v) || 0); }
function stepReps(d) {
  setDraft.reps = Math.max(0, (setDraft.reps || 0) + d) || null;
  $('#reps').value = setDraft.reps ?? '';
}
function setReps(v) { setDraft.reps = numOrNull(v); }
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
    openTimeEditor(lastTimeOf(e.exId));
    return;
  }
  const id = jsq(e.id);
  setupDraft = { exId: e.exId, setup: JSON.parse(JSON.stringify(e.setup || {})) };
  openSheet(`
    <div class="sheet-head">
      <div><div class="eyebrow">${esc(entrySummary(e))}</div><h3>${esc(entryName(e))}</h3>${enLine(entryEn(e))}</div>
      <button class="icon-btn" onclick="closeSheet()" aria-label="${t('close')}">${icon('close')}</button>
    </div>
    <div class="set-list">${e.sets.map((s, i) => `
      <button class="set-line" onclick="openSet(${id},${i})">
        <span class="set-n">${i + 1}</span>
        <span class="set-val">${s.reps ?? '–'} × ${s.weight ? fmtNum(s.weight) + ' kg' : t('noWeight')}</span>
        ${s.done === false ? `<span class="muted small">${t('planned')}</span>` : `<span class="row-mark">${icon('check')}</span>`}
      </button>`).join('')}</div>
    <button class="btn-outline" onclick="addPlannedSet(${id});closeSheet()">${icon('plus')}${t('addSet')}</button>
    <div id="rep-target">${repTargetHtml(e.exId)}</div>
    <div class="setup-box" id="setup-box"></div>
    <label class="field" style="margin-top:16px"><span>${t('note')}</span>
      <textarea class="input" id="entry-note" rows="2" maxlength="300" placeholder="${t('notePh')}">${esc(e.note || '')}</textarea></label>
    <button class="btn-accent big" onclick="saveEntryDetails(${id})">${t('save')}</button>
    <button class="link center-link" onclick="tipsFromEntry(${id})">${t('tipsLink')}</button>
    <button class="link center-link" onclick="openVariant(${jsq(e.exId)})">${t('variant')}</button>
    <button class="link-danger" onclick="deleteEntry(${id})">${t('deleteExercise')}</button>`);
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
      <textarea class="input" id="ex-notes" rows="2" maxlength="500" placeholder="${t('exNotesPh')}" onchange="saveExNote(${jsq(exId)}, this.value)">${esc(exNote(exId))}</textarea></label>
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
    <button class="link center-link" onclick="openVariant(${jsq(draft.exId)})">${t('variant')}</button>
    ${isNew ? '' : `<button class="link-danger" onclick="deleteEntry(${jsq(draft.entryId)})">${t('deleteExercise')}</button>`}`);
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
    <div class="chips wrap">${list.map(tr => `<button class="chip${draft.track === tr.id ? ' active' : ''}" aria-pressed="${draft.track === tr.id}" onclick="pickTrack(${jsq(tr.id)})">${esc(tr.name)}${tr.length ? ` · ${t('trackLen', { v: fmtNum(tr.length) })}` : ''}</button>`).join('')}
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
  if (draft.pending) entry.pending = true;
  for (const k of draft.fields) entry[k] = draft[k] ?? null;
  const s = cloneSession(UI.date);
  const i = s.entries.findIndex(e => e.id === entry.id);
  if (i >= 0) s.entries[i] = entry; else s.entries.push(entry);
  saveSession(s);
  draft = null;
  closeSheet();
  toast(i >= 0 ? t('modified') : t('saved'));
}
