// ===== DÉMARRAGE (chargé en dernier) =====

// ===== DÉMARRAGE =====
applyTranslations();
// ?signup (lien « Créer un compte » du site) : onglet Inscription ouvert d'office
if (new URLSearchParams(location.search).has('signup')) switchAuth('register');
startAuth(user => {
  $('#auth-screen').classList.toggle('hidden', !!user);
  $('#app').classList.toggle('hidden', !user);
  $('#nav').classList.toggle('hidden', !user);
  $('#demo-bar').classList.toggle('hidden', !(user && DEMO && !window.BETA));
  usageRecorded = false; // nouvelle connexion : une visite à compter
  if (user) { UI.date = isoDate(); render(); }
  else hideSheet();
});

// Au retour dans l'appli le lendemain, « aujourd'hui » doit suivre
let knownToday = isoDate();
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState !== 'visible' || !Data.user || knownToday === isoDate()) return;
  if (UI.date === knownToday) UI.date = isoDate();
  knownToday = isoDate();
  render();
});

if ('serviceWorker' in navigator && location.protocol === 'https:') {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}

// Test de non-régression : ?demo&smoke (mode démo uniquement, voir tests/smoke.js)
if (DEMO && new URLSearchParams(location.search).has('smoke')) {
  setTimeout(() => { const s = document.createElement('script'); s.src = 'tests/smoke.js?' + Date.now(); document.body.appendChild(s); }, 600);
}
