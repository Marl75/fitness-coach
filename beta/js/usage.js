// ===== STATISTIQUES D'UTILISATION (pour la page de suivi : marl75.github.io/admin) =====
// Un document usage/{uid} par compte : e-mail, première et dernière visite, et par mois le
// nombre d'ouvertures de l'appli et de routines lancées. Les jours d'entraînement, exercices,
// séries et minutes de cardio sont recalculés à partir de l'historique. Aucun contenu
// (poids, commentaires, notes…) n'est enregistré ici. Lisible seulement par le compte
// lui-même et par l'administratrice (voir firestore.rules). Rien en mode démo.
let usageRecorded = false;

const usageMonth = date => {
  const d = date ? (typeof date === 'string' ? toDate(date) : new Date(date)) : new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
};

// Activité par mois, recalculée à partir des séances (historique complet)
function activityByMonth(sessions = Data.sessions) {
  const out = {};
  for (const s of sessions) {
    const done = (s.entries || []).filter(entryDone);
    if (!done.length) continue;
    const m = out[usageMonth(s.id)] = out[usageMonth(s.id)] || { days: 0, exercises: 0, sets: 0, cardioMin: 0 };
    m.days += 1;
    m.exercises += done.length;
    for (const e of done) {
      if (e.kind === 'sets') m.sets += doneSets(e).length;
      else if (e.kind === 'cardio' && e.duration) m.cardioMin += e.duration;
    }
  }
  return out;
}

function usageDoc() {
  return firebase.firestore().collection('usage').doc(Data.user.uid);
}

// Une fois par ouverture de l'appli, quelques secondes après l'arrivée des données
async function recordVisit() {
  if (DEMO || !Data.user || usageRecorded) return;
  usageRecorded = true;
  try {
    const ref = usageDoc();
    const snap = await ref.get();
    const now = Date.now();
    const data = {
      email: Data.user.email || '',
      lastSeen: now,
      activityByMonth: activityByMonth(),
      sessionCount: activeSessions().length,
      routineCount: (prefs().routines || []).length,
      customCount: Data.exercises.length,
      goalsCount: Object.keys(prefs().goals || {}).length,
      lang: currentLang,
    };
    if (!snap.exists || !snap.data().firstSeen) data.firstSeen = now;
    await ref.set(data, { mergeFields: Object.keys(data) });
    await ref.set({ months: { [usageMonth()]: { opens: firebase.firestore.FieldValue.increment(1), lastSeen: now } } }, { merge: true });
  } catch (e) {
    usageRecorded = false; // réessaiera à la prochaine ouverture
    console.warn('Statistiques non enregistrées :', e);
  }
}

// Compte une action du mois en cours (ex. 'routines' : routine lancée)
function trackUsage(field) {
  if (DEMO || !Data.user) return;
  usageDoc().set({ months: { [usageMonth()]: { [field]: firebase.firestore.FieldValue.increment(1) } } }, { merge: true })
    .catch(e => console.warn('Statistiques non enregistrées :', e));
}

// Déclenchement : après connexion, une fois les données arrivées (léger délai pour l'historique)
let usageTimer = null;
function scheduleVisit() {
  if (DEMO || usageRecorded || usageTimer) return;
  usageTimer = setTimeout(() => { usageTimer = null; recordVisit(); }, 4000);
}
