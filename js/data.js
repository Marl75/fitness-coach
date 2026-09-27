// ===== DONNÉES =====
// Firestore : users/{uid}/sessions/{AAAA-MM-JJ} et users/{uid}/exercises/{id}.
// Une séance par jour : l'identifiant d'une séance est sa date.
// Hors connexion, Firestore garde les écritures sur le téléphone et les envoie au retour du réseau.

const DEMO = !FIREBASE_CONFIG || new URLSearchParams(location.search).has('demo');

const Data = {
  user: null,
  sessions: [],   // de la plus récente à la plus ancienne
  exercises: [],  // exercices créés par l'utilisateur
  pending: false, // des écritures attendent le réseau
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
    logout: () => auth.signOut(),
    listen(emit) {
      const pending = { sessions: false, exercises: false };
      for (const name of ['sessions', 'exercises']) {
        unsubs.push(col(name).onSnapshot({ includeMetadataChanges: true }, snap => {
          Data[name] = snap.docs.map(d => ({ id: d.id, ...d.data() }));
          pending[name] = snap.metadata.hasPendingWrites;
          Data.pending = pending.sessions || pending.exercises;
          emit();
        }, e => console.warn('Lecture impossible :', e)));
      }
    },
    stop() { unsubs.forEach(u => u()); unsubs = []; },
    // Pas de await : hors connexion la promesse n'aboutit qu'au retour du réseau,
    // mais l'écriture est déjà visible localement.
    put(name, id, doc) {
      col(name).doc(id).set(doc).catch(e => { console.warn(e); toast('Le serveur a refusé l’enregistrement'); });
    },
    del(name, id) {
      col(name).doc(id).delete().catch(e => console.warn(e));
    },
  };
}

// Mode démo : tout reste dans ce navigateur, avec des séances factices pour tester.
function demoBackend() {
  const KEY = 'fitcoach-demo-v1';
  let store = null;
  try { store = JSON.parse(localStorage.getItem(KEY)); } catch (e) {}
  store = store || { user: null, sessions: {}, exercises: {} };
  let authCb = () => {}, emitCb = null;
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(store)); } catch (e) {} };
  const push = () => {
    Data.sessions = Object.entries(store.sessions).map(([id, d]) => ({ id, ...d }));
    Data.exercises = Object.entries(store.exercises).map(([id, d]) => ({ id, ...d }));
    if (emitCb) emitCb();
  };
  const signIn = async email => {
    store.user = { uid: 'demo', email };
    if (!Object.keys(store.sessions).length) store.sessions = demoSessions();
    save();
    authCb(store.user);
  };
  return {
    onAuth(cb) { authCb = cb; setTimeout(() => cb(store.user), 0); },
    login: signIn,
    register: signIn,
    reset: async () => {},
    logout: async () => { store.user = null; save(); authCb(null); },
    listen(emit) { emitCb = emit; push(); },
    stop() { emitCb = null; },
    put(name, id, doc) { store[name][id] = doc; save(); push(); },
    del(name, id) { delete store[name][id]; save(); push(); },
    resetDemo() { try { localStorage.removeItem(KEY); } catch (e) {} location.reload(); },
  };
}

function demoSessions() {
  let seed = 7;
  const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const plans = [
    [['leg-press', 'Presse à cuisses', 60], ['hipthrust', 'Hip thrust', 30], ['abduction', 'Abduction (machine)', 40]],
    [['lat-pulldown', 'Tirage vertical', 30], ['devmili', 'Développé militaire', 8], ['curl', 'Curl biceps', 6]],
    [['squat', 'Squat', 25], ['legcurl', 'Leg curl', 20], ['crunch', 'Crunch', 0]],
  ];
  const sessions = {};
  const today = new Date();
  for (let back = 95; back >= 1; back--) {
    if (rand() > 0.42) continue;
    const d = addDays(today, -back);
    const progress = (95 - back) / 95;
    const plan = plans[back % 3];
    const entries = plan.map(([exId, name, base], i) => ({
      id: `e${back}-${i}`, exId, name, kind: 'sets', note: '',
      sets: [0, 1, 2].map(() => ({ reps: base ? 10 : 20, weight: base ? Math.round((base * (1 + progress * 0.3)) / 2.5) * 2.5 : null })),
    }));
    if (rand() > 0.4) entries.push({ id: `e${back}-c`, exId: 'tapis', name: 'Tapis de course', kind: 'cardio', note: '', duration: 15 + Math.round(rand() * 3) * 5, distance: null });
    if (rand() > 0.85) entries.splice(0, entries.length, { id: `e${back}-y`, exId: 'yoga', name: 'Yoga', kind: 'time', note: 'Cours du dimanche', duration: 60 });
    sessions[isoDate(d)] = { entries, createdAt: d.getTime(), updatedAt: d.getTime() };
  }
  return sessions;
}

// ===== API utilisée par l'appli =====
let onDataChange = () => {};

function startAuth(onUser) {
  Backend.onAuth(user => {
    Data.user = user;
    Backend.stop();
    Data.sessions = [];
    Data.exercises = [];
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

const AUTH_ERRORS = {
  'auth/invalid-email': 'Adresse e-mail invalide.',
  'auth/missing-password': 'Mot de passe manquant.',
  'auth/weak-password': 'Mot de passe trop court (6 caractères minimum).',
  'auth/email-already-in-use': 'Un compte existe déjà avec cet e-mail. Connecte-toi.',
  'auth/invalid-credential': 'E-mail ou mot de passe incorrect.',
  'auth/wrong-password': 'E-mail ou mot de passe incorrect.',
  'auth/user-not-found': 'Aucun compte avec cet e-mail.',
  'auth/too-many-requests': 'Trop d’essais. Réessaie dans quelques minutes.',
  'auth/network-request-failed': 'Pas de connexion internet.',
};
const authMessage = code => AUTH_ERRORS[code] || 'Une erreur est survenue. Réessaie.';
