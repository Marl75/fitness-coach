// ===== CŒUR : état de l'écran, historique, navigation, panneau du bas =====
// Chargé avant les fichiers de chaque écran ; boot.js démarre l'appli en dernier.

// ===== ÉTAT DE L'ÉCRAN =====
const UI = {
  tab: 'today',
  date: isoDate(),     // jour affiché dans l'onglet Séance
  month: null,         // mois affiché dans le calendrier (1er du mois)
  selDay: null,        // jour touché dans le calendrier
  search: '',
  showHidden: false,   // section « Masqués » dépliée
};
let draft = null;      // cardio / cours en cours de saisie
let setDraft = null;   // série en cours de réglage (pile de plaques)
try { UI.tab = localStorage.getItem('fitcoach-tab') || 'today'; } catch (e) {}

// ===== EXERCICES & HISTORIQUE =====
function allExercises() {
  return [...CATALOG, ...Data.exercises.map(e => ({ ...e, group: e.group || 'custom', custom: true }))];
}
const findExercise = id => allExercises().find(e => e.id === id);
const exOfEntry = e => findExercise(e.exId) || { id: e.exId, kind: e.kind };
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

// Ce que change un appui sur + ou − pour le poids (une plaque)
const STEP = 2.5;

// ===== NAVIGATION =====
function setTab(tab) {
  UI.tab = tab;
  try { localStorage.setItem('fitcoach-tab', tab); } catch (e) {}
  window.scrollTo(0, 0);
  render();
}

// Champ de l'écran en cours de saisie (data-live) : sa valeur est enregistrée à chaque chiffre, mais on ne
// redessine pas l'écran sous le doigt, sinon l'appui sur « C'est fait » juste après serait perdu.
// On redessine une fois le champ quitté et le doigt levé (après le clic éventuel).
let viewStale = false, pointerIsDown = false;
const typingInView = () => !!(document.activeElement && document.activeElement.matches('#view input[data-live]'));
const renderIfStale = () => { if (viewStale && !typingInView()) render(); };
document.addEventListener('pointerdown', () => { pointerIsDown = true; }, true);
for (const ev of ['pointerup', 'pointercancel']) document.addEventListener(ev, () => { pointerIsDown = false; if (viewStale) setTimeout(renderIfStale, 0); }, true);
document.addEventListener('focusout', () => { if (viewStale && !pointerIsDown) setTimeout(renderIfStale, 0); });

function render() {
  if (!Data.user) return;
  if (typingInView()) { viewStale = true; return; }
  viewStale = false;
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === UI.tab));
  $('#sync').classList.toggle('hidden', !(Data.pending || !navigator.onLine) || DEMO);
  const set = document.querySelector('.nav-btn[data-tab="settings"]');
  if (set) set.classList.toggle('has-dot', setupPending());
  if (UI.tab === 'today') renderToday(); else if (UI.tab === 'settings') renderSettings(); else renderTrack();
}
onDataChange = () => { render(); if (sheetRefresh) sheetRefresh(); scheduleVisit(); maybeOnboard(); };
window.addEventListener('online', render);
window.addEventListener('offline', render);

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
