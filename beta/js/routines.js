// ===== ROUTINES =====
// Une routine = une liste d'exercices enregistrée depuis une séance (« Enregistrer comme routine »).
// La lancer ajoute tous ses exercices à la séance du jour, avec les chiffres de la dernière fois.
// prefs.routines : [{ id, name, items: [exId…], lastUsed }]
const routines = () => (prefs().routines || []).filter(r => (r.items || []).length);
function saveRoutines(list) { savePrefs({ routines: list }); }

function routineCardsHtml() {
  const list = routines();
  if (!list.length) return '';
  return `<p class="label">${t('myRoutines')}</p><div class="routines">${list.map(r => {
    const exs = r.items.map(findExercise).filter(Boolean);
    return `<div class="routine">
      <div class="routine-main">
        <span class="routine-name">${esc(r.name)}</span>
        <span class="routine-sub">${esc([tn('exercises', exs.length), r.lastUsed && t('lastUsed', { when: relDay(r.lastUsed) })].filter(Boolean).join(' · '))}</span>
        <span class="routine-ex">${exs.slice(0, 4).map(ex => pictoTile(ex, 'tiny')).join('')}${exs.length > 4 ? `<span class="picto tiny more">+${exs.length - 4}</span>` : ''}</span>
      </div>
      <button class="btn-accent" onclick="launchRoutine('${esc(r.id)}')">${t('launch')}</button>
    </div>`;
  }).join('')}</div>`;
}

function launchRoutine(id) {
  const r = routines().find(x => x.id === id);
  if (!r) return;
  const s = cloneSession(UI.date);
  const exs = r.items.map(findExercise).filter(Boolean);
  exs.forEach(ex => s.entries.push(buildEntry(ex)));
  s.routine = { id: r.id, name: r.name };
  saveSession(s);
  saveRoutines((prefs().routines || []).map(x => (x.id === id ? { ...x, lastUsed: UI.date } : x)));
  toast(t('routineLaunched', { name: r.name, n: exs.length }));
  setTimeout(() => $('.now') && $('.now').scrollIntoView({ behavior: 'smooth', block: 'center' }), 50);
}

// Enregistrer la séance affichée comme routine : on choisit le nom et les exercices à garder
function openSaveRoutine() {
  const entries = ((sessionOf(UI.date) || {}).entries || []).filter(entryDone);
  const ids = [...new Set(entries.map(e => e.exId))].filter(id => findExercise(id));
  UI.routineDraft = { ids, keep: new Set(ids) };
  const guess = (sessionOf(UI.date) || {}).routine ? (sessionOf(UI.date).routine.name) : t('routineNamePh', { date: fmtDM(UI.date) });
  openSheet(`
    <div class="sheet-head"><div><div class="eyebrow">${t('saveAsRoutine')}</div><h3>${t('newRoutine')}</h3></div>
      <button class="icon-btn" onclick="closeSheet()" aria-label="${t('close')}">${icon('close')}</button></div>
    <label class="field"><span>${t('routineName')}</span>
      <input class="input" id="routine-name" maxlength="40" value="${esc(guess)}" onfocus="this.select()"></label>
    <p class="field"><span>${t('routineExercises')}</span></p>
    <div id="routine-items"></div>
    <button class="btn-accent big" onclick="saveRoutineFromDraft()">${t('saveRoutine')}</button>`, renderRoutineItems);
}
function renderRoutineItems() {
  const box = $('#routine-items');
  if (!box) return;
  const d = UI.routineDraft;
  box.innerHTML = d.ids.map((id, i) => {
    const ex = findExercise(id), on = d.keep.has(id);
    return `<label class="routine-item${on ? '' : ' off'}"><input type="checkbox" ${on ? 'checked' : ''} onchange="toggleRoutineItem(${i})">
      ${pictoTile(ex, 'small')}<span class="pick-name">${esc(exLabel(ex))}</span></label>`;
  }).join('');
}
function toggleRoutineItem(i) {
  const d = UI.routineDraft, id = d.ids[i];
  if (d.keep.has(id)) d.keep.delete(id); else d.keep.add(id);
  renderRoutineItems();
}
function saveRoutineFromDraft() {
  const name = $('#routine-name').value.trim().replace(/\s+/g, ' ');
  const items = UI.routineDraft.ids.filter(id => UI.routineDraft.keep.has(id));
  if (!name) { $('#routine-name').focus(); return; }
  if (!items.length) { toast(t('routineEmpty')); return; }
  saveRoutines([...(prefs().routines || []), { id: 'r' + Date.now().toString(36), name, items }]);
  closeSheet();
  toast(t('routineSaved', { name }));
}

// Mon compte › Mes routines : créer, modifier, changer l'ordre, supprimer
function openRoutines() {
  openSheet(`
    <div class="sheet-head"><div><div class="eyebrow">${t('account')}</div><h3>${t('myRoutines')}</h3></div>
      <button class="icon-btn" onclick="closeSheet()" aria-label="${t('close')}">${icon('close')}</button></div>
    <button class="btn-accent big" onclick="openRoutineEditor()">${icon('plus')}${t('newRoutine')}</button>
    <p class="muted small routines-hint">${t('routinesHint2')}</p>
    <div id="routines-list"></div>`, renderRoutinesList);
}
function renderRoutinesList() {
  const box = $('#routines-list');
  if (!box) return;
  const list = prefs().routines || [];
  box.innerHTML = list.length ? list.map((r, i) => `<div class="myex">
      <span class="routine-name">${esc(r.name)}</span>
      <p class="muted small">${esc(r.items.map(id => (findExercise(id) ? exLabel(findExercise(id)) : '')).filter(Boolean).join(' · '))}</p>
      <div class="myex-actions">
        <button class="chip" onclick="openRoutineEditor('${esc(r.id)}')">${t('edit')}</button>
        <button class="chip" onclick="moveRoutine(${i},-1)" ${i === 0 ? 'disabled' : ''} aria-label="${t('moveUp')}">${icon('up')}</button>
        <button class="chip" onclick="moveRoutine(${i},1)" ${i === list.length - 1 ? 'disabled' : ''} aria-label="${t('moveDown')}">${icon('down')}</button>
        <button class="chip" onclick="deleteRoutine('${esc(r.id)}')">${t('delete')}</button>
      </div>
    </div>`).join('') : `<p class="muted small empty-list">${t('routinesEmpty')}</p>`;
}
function moveRoutine(i, d) {
  const list = [...(prefs().routines || [])];
  const j = i + d;
  if (j < 0 || j >= list.length) return;
  [list[i], list[j]] = [list[j], list[i]];
  saveRoutines(list);
}
function deleteRoutine(id) {
  const r = (prefs().routines || []).find(x => x.id === id);
  if (!r || !confirm(t('routineDeleteConfirm', { name: r.name }))) return;
  saveRoutines((prefs().routines || []).filter(x => x.id !== id));
}

// Créer ou modifier une routine sans passer par une séance : nom, exercices choisis dans la liste, ordre
function openRoutineEditor(id) {
  const r = id && (prefs().routines || []).find(x => x.id === id);
  UI.rDraft = { id: r ? r.id : null, name: r ? r.name : '', items: r ? [...r.items] : [], adding: !r, q: '' };
  openSheet(`
    <div class="sheet-head"><div><div class="eyebrow">${t('myRoutines')}</div><h3>${r ? t('editRoutine') : t('newRoutine')}</h3></div>
      <button class="icon-btn" onclick="openRoutines()" aria-label="${t('back')}">${icon('prev')}</button></div>
    <label class="field"><span>${t('routineName')}</span>
      <input class="input" id="rd-name" maxlength="40" placeholder="${t('routineNameEx')}" value="${esc(UI.rDraft.name)}" oninput="UI.rDraft.name=this.value"></label>
    <div id="rd-body"></div>
    <button class="btn-accent big" onclick="saveRoutineDraft()">${t('saveRoutine')}</button>`, renderRoutineEditor);
}
function renderRoutineEditor() {
  const box = $('#rd-body');
  if (!box) return;
  const d = UI.rDraft;
  const chosen = d.items.map((id, i) => {
    const ex = findExercise(id);
    if (!ex) return '';
    return `<div class="rd-item">${pictoTile(ex, 'small')}<span class="pick-name">${esc(exLabel(ex))}</span>
      <button class="icon-btn" onclick="rdMove(${i},-1)" ${i === 0 ? 'disabled' : ''} aria-label="${t('moveUp')}">${icon('up')}</button>
      <button class="icon-btn" onclick="rdMove(${i},1)" ${i === d.items.length - 1 ? 'disabled' : ''} aria-label="${t('moveDown')}">${icon('down')}</button>
      <button class="icon-btn" onclick="rdRemove(${i})" aria-label="${t('remove')} : ${esc(exLabel(ex))}">${icon('close')}</button></div>`;
  }).join('');
  let add = '';
  if (d.adding) {
    const q = simple(d.q);
    const pool = allExercises().filter(e => !isHidden(e.id) && !d.items.includes(e.id)
      && (!q || [e.name, e.en, ...(e.aliases || [])].filter(Boolean).some(n => simple(n).includes(q))))
      .sort((a, b) => (isFav(b.id) - isFav(a.id)) || byName(a, b)).slice(0, q ? 30 : 15);
    add = `<div class="rd-add">
      <input class="input" type="search" id="rd-search" placeholder="${t('search')}" value="${esc(d.q)}" oninput="UI.rDraft.q=this.value;renderRoutineEditor();const i=$('#rd-search');i.focus();i.setSelectionRange(i.value.length,i.value.length)" aria-label="${t('searchAria')}">
      ${pool.map(e => `<button class="rd-pick" onclick="rdAdd('${esc(e.id)}')">${pictoTile(e, 'small')}<span class="pick-name">${esc(exLabel(e))}${isFav(e.id) ? ` <span class="fav-mark">${icon('star')}</span>` : ''}</span>${icon('plus')}</button>`).join('')}
      ${!q ? `<p class="muted small">${t('rdSearchMore')}</p>` : ''}
    </div>`;
  }
  box.innerHTML = `<p class="field"><span>${t('routineExercisesN', { n: d.items.length })}</span></p>
    ${chosen || `<p class="muted small">${t('rdEmpty')}</p>`}
    ${d.adding ? add : `<button class="chip dashed rd-add-btn" onclick="UI.rDraft.adding=true;renderRoutineEditor()">${icon('plus')}${t('rdAddExercises')}</button>`}`;
}
function rdAdd(id) { UI.rDraft.items.push(id); renderRoutineEditor(); }
function rdRemove(i) { UI.rDraft.items.splice(i, 1); renderRoutineEditor(); }
function rdMove(i, d) {
  const it = UI.rDraft.items, j = i + d;
  if (j < 0 || j >= it.length) return;
  [it[i], it[j]] = [it[j], it[i]];
  renderRoutineEditor();
}
function saveRoutineDraft() {
  const d = UI.rDraft;
  const name = (d.name || '').trim().replace(/\s+/g, ' ');
  if (!name) { $('#rd-name').focus(); toast(t('routineNeedName')); return; }
  if (!d.items.length) { toast(t('routineEmpty')); return; }
  const list = prefs().routines || [];
  saveRoutines(d.id ? list.map(r => (r.id === d.id ? { ...r, name, items: d.items } : r))
    : [...list, { id: 'r' + Date.now().toString(36), name, items: d.items }]);
  toast(t('routineSaved', { name }));
  openRoutines();
}
