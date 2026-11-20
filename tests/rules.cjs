// Teste firestore.rules sur les serveurs de Firebase, sans rien publier : node tests/rules.cjs [firestore.rules]
// Nécessite firebase-tools installé globalement et connecté (firebase login), comme pour Ma Collection.
// Pas lancé par GitHub (il faut un compte connecté) : à faire avant de coller de nouvelles règles.
const FT = require('child_process').execSync('npm root -g').toString().trim() + '/firebase-tools/lib/';
const { requireAuth } = require(FT + 'requireAuth');
const { Client } = require(FT + 'apiv2');
const { rulesOrigin } = require(FT + 'api');
const fs = require('fs');
const src = fs.readFileSync(process.argv[2] || require('path').join(__dirname, '..', 'firestore.rules'), 'utf8');
const D = '/databases/(default)/documents';
const me = { uid: 'u1', token: { email: 'a@b.fr' } }, other = { uid: 'u2', token: { email: 'x@y.fr' } };
const TIME = '2026-10-20T10:00:00Z', M = '2026-10';
const session = { entries: [{ id: 'e1', exId: 'squat', kind: 'sets', sets: [{ reps: 10, weight: 20, done: true }] }], createdAt: 1, updatedAt: 2 };
const usage = { email: 'a@b.fr', firstSeen: 1, lastSeen: 1, activityByMonth: { [M]: { days: 2, exercises: 6, sets: 18, cardioMin: 30 } },
  sessionCount: 2, routineCount: 1, customCount: 0, goalsCount: 3, lang: 'fr', months: { [M]: { opens: 2, routines: 1, lastSeen: 1 }, '2026-09': { opens: 9 } } };
const merge = (a, b) => JSON.parse(JSON.stringify({ ...a, ...b }));
const month = (m, v) => merge(usage, { months: { ...usage.months, [m]: v } });
// Retours (js/feedback.js) ; ADMIN_UID est remplacé par ton identifiant dans les règles publiées
const admin = { uid: 'ADMIN_UID', token: { email: 'admin@b.fr' } };
const fb = { app: 'routine', kind: 'idea', text: 'Un minuteur de repos', email: 'a@b.fr', uid: 'u1', screen: 'today',
  lang: 'fr', version: '20261022111548', ua: 'Mozilla/5.0', demo: false, beta: false, createdAt: TIME };
const anonFb = merge(fb, { email: 'x@y.fr', uid: null, demo: true });
const FB_ID = 'AbCdEfGhIjKlMnOpQrSt'; // identifiant automatique de Firestore : 20 lettres et chiffres
// [attendu, nom, méthode, chemin, compte, avant, après, heure]
const cases = [
  ['ALLOW', 'séance : lire la sienne', 'get', '/users/u1/sessions/2026-10-20', me, session],
  ['DENY', 'séance : lire celle d’un autre', 'get', '/users/u1/sessions/2026-10-20', other, session],
  ['ALLOW', 'séance : créer', 'create', '/users/u1/sessions/2026-10-20', me, null, session],
  ['ALLOW', 'séance : modifier (champ ancien inconnu gardé)', 'update', '/users/u1/sessions/2026-10-20', me, merge(session, { legacy: 1 }), merge(session, { legacy: 1, routine: { id: 'r', name: 'Haut' } })],
  ['ALLOW', 'séance : supprimer', 'delete', '/users/u1/sessions/2026-10-20', me, session],
  ['DENY', 'séance : identifiant qui n’est pas une date', 'create', '/users/u1/sessions/abc', me, null, session],
  ['DENY', 'séance : sans liste d’exercices', 'create', '/users/u1/sessions/2026-10-20', me, null, { createdAt: 1 }],
  ['DENY', 'séance : plus de 100 exercices', 'create', '/users/u1/sessions/2026-10-20', me, null, { entries: Array.from({ length: 101 }, (_, i) => ({ id: 'e' + i })) }],
  ['DENY', 'séance : écrire chez un autre', 'create', '/users/u1/sessions/2026-10-20', other, null, session],
  ['ALLOW', 'exercice créé : créer', 'create', '/users/u1/exercises/c-abc', me, null, { name: 'Mon exo', kind: 'sets', createdAt: 1 }],
  ['DENY', 'exercice créé : nom trop long', 'create', '/users/u1/exercises/c-abc', me, null, { name: 'x'.repeat(101), kind: 'sets' }],
  ['ALLOW', 'réglages : prefs', 'update', '/users/u1/settings/prefs', me, { weeklyGoal: 3 }, { weeklyGoal: 4, goals: { glutes: 'up' } }],
  ['DENY', 'réglages : autre document', 'create', '/users/u1/settings/autre', me, null, { a: 1 }],
  ['DENY', 'collection inconnue sous le compte', 'create', '/users/u1/fichiers/f1', me, null, { a: 1 }],
  ['DENY', 'document du compte lui-même', 'create', '/users/u1', me, null, { a: 1 }],
  ['ALLOW', 'usage : première visite', 'create', '/usage/u1', me, null, { email: 'a@b.fr', firstSeen: 5, lastSeen: 5, activityByMonth: {}, sessionCount: 0, routineCount: 0, customCount: 0, goalsCount: 0, lang: 'en' }],
  ['ALLOW', 'usage : premier compteur du mois (création)', 'create', '/usage/u1', me, null, { months: { [M]: { opens: 1, lastSeen: 5 } } }],
  ['ALLOW', 'usage : visite (champs généraux)', 'update', '/usage/u1', me, usage, merge(usage, { lastSeen: 9, sessionCount: 3, activityByMonth: { [M]: { days: 3 } } })],
  ['ALLOW', 'usage : ouverture +1', 'update', '/usage/u1', me, usage, month(M, { opens: 3, routines: 1, lastSeen: 9 })],
  ['ALLOW', 'usage : routine lancée +1', 'update', '/usage/u1', me, usage, month(M, { opens: 2, routines: 2, lastSeen: 1 })],
  ['ALLOW', 'usage : 31 oct. 23 h UTC, novembre (heure de Singapour)', 'update', '/usage/u1', me, usage, month('2026-11', { opens: 1 }), '2026-10-31T23:00:00Z'],
  ['DENY', 'usage : compteur en texte (injection dans la page de suivi)', 'update', '/usage/u1', me, usage, merge(usage, { sessionCount: '<img src=x onerror=alert(1)>' })],
  ['DENY', 'usage : ouvertures +5', 'update', '/usage/u1', me, usage, month(M, { opens: 7, routines: 1 })],
  ['DENY', 'usage : compteur en baisse', 'update', '/usage/u1', me, usage, month(M, { opens: 1, routines: 1 })],
  ['DENY', 'usage : mois passé', 'update', '/usage/u1', me, usage, month('2026-09', { opens: 10 })],
  ['DENY', 'usage : mois suivant en milieu de mois', 'update', '/usage/u1', me, usage, month('2026-11', { opens: 1 })],
  ['DENY', 'usage : e-mail d’un autre', 'update', '/usage/u1', me, usage, merge(usage, { email: 'x@y.fr' })],
  ['DENY', 'usage : firstSeen réécrit', 'update', '/usage/u1', me, usage, merge(usage, { firstSeen: 0 })],
  ['DENY', 'usage : langue inconnue', 'update', '/usage/u1', me, usage, merge(usage, { lang: '<b>' })],
  ['DENY', 'usage : champ inconnu', 'update', '/usage/u1', me, usage, merge(usage, { admin: true })],
  ['DENY', 'usage : champ inconnu dans le mois', 'update', '/usage/u1', me, usage, month(M, { ...usage.months[M], note: 'x' })],
  ['DENY', 'usage : document d’un autre compte', 'update', '/usage/u1', other, usage, merge(usage, { lastSeen: 9 })],
  ['DENY', 'usage : lire celui d’un autre', 'get', '/usage/u1', other, usage],
  ['ALLOW', 'retour : avec un compte', 'create', '/feedback/' + FB_ID, me, null, fb],
  ['ALLOW', 'retour : avec un compte, sans demander de réponse', 'create', '/feedback/' + FB_ID, me, null, merge(fb, { email: '' })],
  ['ALLOW', 'retour : sans compte (démo), avec un e-mail', 'create', '/feedback/' + FB_ID, null, null, anonFb],
  ['ALLOW', 'retour : champs minimum', 'create', '/feedback/' + FB_ID, null, null, { app: 'routine', kind: 'bug', text: 'x', createdAt: TIME }],
  ['DENY', 'retour : texte vide', 'create', '/feedback/' + FB_ID, me, null, merge(fb, { text: '' })],
  ['DENY', 'retour : texte de plus de 2000 caractères', 'create', '/feedback/' + FB_ID, me, null, merge(fb, { text: 'x'.repeat(2001) })],
  ['DENY', 'retour : type inconnu', 'create', '/feedback/' + FB_ID, me, null, merge(fb, { kind: '<b>' })],
  ['DENY', 'retour : autre appli', 'create', '/feedback/' + FB_ID, me, null, merge(fb, { app: 'collection' })],
  ['DENY', 'retour : champ inconnu', 'create', '/feedback/' + FB_ID, me, null, merge(fb, { status: 'done' })],
  ['DENY', 'retour : au nom d’un autre compte', 'create', '/feedback/' + FB_ID, other, null, fb],
  ['DENY', 'retour : e-mail d’un autre avec un compte', 'create', '/feedback/' + FB_ID, me, null, merge(fb, { email: 'x@y.fr' })],
  ['DENY', 'retour : sans compte mais avec un identifiant', 'create', '/feedback/' + FB_ID, null, null, merge(anonFb, { uid: 'u1' })],
  ['DENY', 'retour : date choisie par l’appareil', 'create', '/feedback/' + FB_ID, me, null, merge(fb, { createdAt: '2020-01-01T00:00:00Z' })],
  ['DENY', 'retour : navigateur trop long', 'create', '/feedback/' + FB_ID, me, null, merge(fb, { ua: 'x'.repeat(301) })],
  ['DENY', 'retour : lire (compte ordinaire)', 'get', '/feedback/' + FB_ID, me, fb],
  ['DENY', 'retour : lire sans compte', 'get', '/feedback/' + FB_ID, null, fb],
  ['DENY', 'retour : modifier son message', 'update', '/feedback/' + FB_ID, me, fb, merge(fb, { text: 'autre' })],
  ['ALLOW', 'retour : l’administratrice lit', 'get', '/feedback/' + FB_ID, admin, fb],
  ['ALLOW', 'retour : l’administratrice change le statut', 'update', '/feedback/' + FB_ID, admin, fb, merge(fb, { status: 'done' })],
  ['DENY', 'retour : statut inconnu', 'update', '/feedback/' + FB_ID, admin, fb, merge(fb, { status: '<b>' })],
  ['DENY', 'retour : l’administratrice ne réécrit pas le texte', 'update', '/feedback/' + FB_ID, admin, fb, merge(fb, { text: 'autre' })],
  ['ALLOW', 'retour : l’administratrice supprime', 'delete', '/feedback/' + FB_ID, admin, fb],
  ['DENY', 'retour : identifiant choisi (guillemet)', 'create', "/feedback/x'onclick", me, null, fb],
  ['DENY', 'hors des collections prévues', 'create', '/autre/doc', me, null, { a: 1 }],
];
(async () => {
  const { configstore } = require(FT + 'configstore');
  await requireAuth({ user: configstore.get('user'), tokens: configstore.get('tokens') });
  const c = new Client({ urlPrefix: rulesOrigin(), apiVersion: 'v1' });
  const testCases = cases.map(([expectation, , method, path, auth, before, after, time]) => ({
    expectation,
    request: { auth, path: D + path, method, time: time || TIME, ...(after ? { resource: { data: after } } : {}) },
    ...(before ? { resource: { data: before } } : {}),
  }));
  const res = await c.post('/projects/fitcoach-71392:test', { source: { files: [{ name: 'firestore.rules', content: src }] }, testSuite: { testCases } });
  const body = res.body;
  if (body.issues) console.log('ISSUES', JSON.stringify(body.issues, null, 1));
  let fails = 0;
  (body.testResults || []).forEach((r, i) => {
    const ok = r.state === 'SUCCESS'; if (!ok) fails++;
    console.log(ok ? '✔' : '✖', cases[i][0], cases[i][1], ok ? '' : JSON.stringify(r.debugMessages || r.errorPosition || ''));
  });
  console.log(fails ? `${fails} échec(s)` : `tout passe (${cases.length} cas)`);
  if (fails) process.exit(1);
})().catch(e => { console.error('Erreur', e.message, JSON.stringify(e.context && e.context.body || '')); process.exit(1); });
