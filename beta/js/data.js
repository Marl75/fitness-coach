// ===== DONNÉES =====
// Firestore : users/{uid}/sessions/{AAAA-MM-JJ} et users/{uid}/exercises/{id}.
// Une séance par jour : l'identifiant d'une séance est sa date.
// Hors connexion, Firestore garde les écritures sur le téléphone et les envoie au retour du réseau.

// Version de test (dossier beta/, window.BETA) : données de démo par défaut, ?real pour son vrai compte
const DEMO = !FIREBASE_CONFIG || new URLSearchParams(location.search).has('demo')
  || (window.BETA === true && !new URLSearchParams(location.search).has('real'));

const Data = {
  user: null,
  sessions: [],   // de la plus récente à la plus ancienne
  exercises: [],  // exercices créés par l'utilisateur
  settings: [],   // réglages (document « prefs » : objectif par semaine)
  pending: false, // des écritures attendent le réseau
  loaded: false,  // séances, exercices et réglages reçus du serveur au moins une fois
};

const Backend = DEMO ? demoBackend() : firebaseBackend();

function firebaseBackend() {
  firebase.initializeApp(FIREBASE_CONFIG);
  const auth = firebase.auth();
  const db = firebase.firestore();
  db.enablePersistence({ synchronizeTabs: true })
    .catch(e => console.warn('Mode hors connexion indisponible :', e.code));
  let unsubs = [];
  const col = name => db.collection('users').doc(Data.user.uid).collection(name);

  return {
    onAuth(cb) { auth.onAuthStateChanged(u => cb(u ? { uid: u.uid, email: u.email } : null)); },
    login: (email, pw) => auth.signInWithEmailAndPassword(email, pw),
    register: (email, pw) => auth.createUserWithEmailAndPassword(email, pw),
    reset: email => auth.sendPasswordResetEmail(email),
    // Appareil partagé : à la déconnexion, on efface aussi la copie des données gardée pour le hors connexion
    logout: async () => {
      await auth.signOut();
      try { await db.terminate(); await db.clearPersistence(); } catch (e) { console.warn('Copie locale non effacée :', e); }
      location.reload();
    },
    listen(emit) {
      const pending = { sessions: false, exercises: false, settings: false };
      const fromServer = { sessions: false, exercises: false, settings: false };
      for (const name of ['sessions', 'exercises', 'settings']) {
        unsubs.push(col(name).onSnapshot({ includeMetadataChanges: true }, snap => {
          Data[name] = snap.docs.map(d => ({ id: d.id, ...d.data() }));
          pending[name] = snap.metadata.hasPendingWrites;
          Data.pending = Object.values(pending).some(Boolean);
          // Tout reçu du serveur (pas seulement la copie du téléphone) : on sait si le compte est neuf
          if (!snap.metadata.fromCache) fromServer[name] = true;
          Data.loaded = Object.values(fromServer).every(Boolean);
          emit();
        }, e => console.warn('Lecture impossible :', e)));
      }
    },
    stop() { unsubs.forEach(u => u()); unsubs = []; },
    // Pas de await : hors connexion la promesse n'aboutit qu'au retour du réseau,
    // mais l'écriture est déjà visible localement.
    put(name, id, doc) {
      col(name).doc(id).set(doc).catch(e => { console.warn(e); toast(t('serverRefused')); });
    },
    del(name, id) {
      col(name).doc(id).delete().catch(e => console.warn(e));
    },
  };
}

// Mode démo : pas de compte, on arrive directement dans l'appli, avec un compte d'exemple bien rempli.
// Tout reste dans ce navigateur ; les données d'exemple sont refaites chaque jour (dates à jour).
function demoBackend() {
  const KEY = 'fitcoach-demo-v2';
  let store = null;
  try { store = JSON.parse(localStorage.getItem(KEY)); } catch (e) {}
  if (!store || store.day !== isoDate()) store = { day: isoDate(), user: { uid: 'demo', email: '' }, ...demoData() };
  let authCb = () => {}, emitCb = null;
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(store)); } catch (e) {} };
  const push = () => {
    Data.sessions = Object.entries(store.sessions).map(([id, d]) => ({ id, ...d }));
    Data.exercises = Object.entries(store.exercises).map(([id, d]) => ({ id, ...d }));
    Data.settings = Object.entries(store.settings).map(([id, d]) => ({ id, ...d }));
    if (emitCb) emitCb();
  };
  save();
  return {
    onAuth(cb) { authCb = cb; setTimeout(() => cb(store.user), 0); },
    login: async () => authCb(store.user),
    register: async () => authCb(store.user),
    reset: async () => {},
    logout: () => leaveDemo(),
    listen(emit) { emitCb = emit; Data.loaded = true; push(); },
    stop() { emitCb = null; },
    put(name, id, doc) { store[name][id] = doc; save(); push(); },
    del(name, id) { delete store[name][id]; save(); push(); },
    resetDemo() { try { localStorage.removeItem(KEY); } catch (e) {} location.reload(); },
  };
}
// Quitter la démo : la vraie appli (dans la version de test, ?real : son vrai compte)
function leaveDemo(signup) {
  const q = new URLSearchParams();
  if (window.BETA) q.set('real', '');
  if (signup) q.set('signup', '');
  q.set('lang', currentLang);
  location.href = location.pathname + '?' + q.toString().replace(/=(&|$)/g, '$1');
}

// Compte d'exemple : 12 semaines à environ 3 séances (bas du corps, haut du corps, cardio ou yoga),
// des charges qui progressent, des objectifs par muscle, deux routines et un objectif de répétitions.
function demoData() {
  let seed = 11;
  const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const today = new Date();
  const lower = [['leg-press', 'Presse à cuisses', 70, 10], ['hipthrust', 'Hip thrust', 40, 10], ['abduction', 'Abduction (machine)', 35, 12], ['legcurl', 'Leg curl', 20, 12]];
  const upper = [['lat-pulldown', 'Tirage vertical', 32.5, 10], ['tirage-horizontal', 'Tirage horizontal (rowing assis)', 30, 10], ['devmili', 'Développé militaire', 8, 10], ['curl', 'Curl biceps', 6, 12]];
  const sets = ([exId, name, base, reps], progress, k) => ({
    id: `e${k}-${exId}`, exId, name, kind: 'sets', note: '',
    sets: [0, 1, 2].map(i => ({ done: true, reps: i === 2 && rand() > 0.6 ? reps - 2 : reps, weight: Math.round(base * (1 + progress * 0.25) / 2.5) * 2.5 || base })),
  });
  const sessions = {};
  let k = 0;
  // Lundi, mercredi, samedi, avec quelques séances sautées ; jamais aujourd'hui (la séance du jour reste à faire)
  for (let back = 84; back >= 1; back--) {
    const d = addDays(today, -back), dow = (d.getDay() + 6) % 7;
    if (![0, 2, 5].includes(dow) || (back > 7 && rand() > 0.82)) continue;
    const progress = (84 - back) / 84;
    let entries;
    if (dow === 0) entries = lower.map(x => sets(x, progress, k));
    else if (dow === 2) entries = upper.map(x => sets(x, progress, k));
    else entries = rand() > 0.35
      ? [{ id: `e${k}-c`, exId: 'marche-inclinee', name: 'Marche inclinée', kind: 'cardio', note: '', duration: 30 + Math.round(progress * 3) * 5, speed: 5, incline: 8 + Math.round(progress * 4), carry: null }]
      : [{ id: `e${k}-y`, exId: 'yoga', name: 'Yoga', kind: 'time', note: 'Cours du samedi', duration: 60 }];
    if (dow !== 5 && rand() > 0.5) entries.push({ id: `e${k}-t`, exId: 'tapis', name: 'Course sur tapis', kind: 'cardio', note: '', duration: 15 + Math.round(rand() * 2) * 5, distance: null });
    const at = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 18, 30).getTime();
    sessions[isoDate(d)] = { entries, createdAt: at, updatedAt: at };
    k++;
  }
  const settings = { prefs: {
    pseudo: 'Démo', weeklyGoal: 3, onboarded: true, setupHidden: true,
    goals: { glutes: 'up', upperback: 'up', lats: 'up', traps: 'down' },
    favorites: ['hipthrust', 'lat-pulldown'],
    repTargets: { hipthrust: [8, 12] },
    routines: [
      { id: 'r-bas', name: 'Bas du corps', items: lower.map(x => x[0]) },
      { id: 'r-haut', name: 'Haut du corps', items: upper.map(x => x[0]) },
    ],
  } };
  return { sessions, exercises: {}, settings };
}

// ===== API utilisée par l'appli =====
let onDataChange = () => {};

function startAuth(onUser) {
  Backend.onAuth(user => {
    Data.user = user;
    Backend.stop();
    Data.sessions = [];
    Data.exercises = [];
    Data.settings = [];
    Data.loaded = false;
    if (user) Backend.listen(() => {
      Data.sessions.sort((a, b) => b.id.localeCompare(a.id));
      onDataChange();
    });
    onUser(user);
  });
}

// JSON aller-retour : Firestore refuse les valeurs undefined
const clean = obj => JSON.parse(JSON.stringify(obj));

function saveSession(session) {
  const { id, ...doc } = session;
  doc.updatedAt = Date.now();
  if (!doc.entries || !doc.entries.length) Backend.del('sessions', id);
  else Backend.put('sessions', id, clean(doc));
}

function saveCustomExercise(ex) {
  const { id, ...doc } = ex;
  Backend.put('exercises', id, clean(doc));
}

function deleteCustomExercise(id) {
  Backend.del('exercises', id);
}

const prefs = () => Data.settings.find(s => s.id === 'prefs') || {};
const weeklyGoal = () => prefs().weeklyGoal || 3;
function savePrefs(patch) {
  Backend.put('settings', 'prefs', clean({ ...prefs(), id: undefined, ...patch }));
}

// Messages d'erreur de connexion : traduits dans i18n.js (clés « auth/… »)
const authMessage = code => (code && I18N.fr[code] ? t(code) : t('authDefault'));
