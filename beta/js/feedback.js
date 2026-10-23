// ===== « UNE IDÉE, UN SOUCI ? » : messages envoyés à l'administratrice =====
// Un document feedback/{id} par message, lu sur la page de suivi (marl75.github.io/admin, onglet Retours).
// Format contrôlé par firestore.rules ; seule l'administratrice peut lire les messages.
// En démo il n'y a pas de compte : le message part sans compte, par une connexion Firebase à part,
// avec l'e-mail que la personne veut bien donner.
const FEEDBACK_KINDS = ['idea', 'bug', 'other'];
const feedbackOn = () => !!FIREBASE_CONFIG && typeof firebase !== 'undefined';
let feedbackKind = 'idea', feedbackScreen = '';

function openFeedback() {
  feedbackKind = 'idea';
  feedbackScreen = UI.tab;
  const reply = DEMO
    ? `<label class="field"><span class="sr-only">${t('fbEmailPh')}</span>
        <input class="input" id="fb-email" type="email" maxlength="200" autocomplete="email" placeholder="${t('fbEmailPh')}"></label>`
    : `<label class="fb-reply"><input type="checkbox" id="fb-reply" checked> ${esc(t('fbReply', { email: Data.user.email || '' }))}</label>`;
  openSheet(`
    <div class="sheet-head">
      <div><div class="eyebrow">${t('fbEyebrow')}</div><h3>${t('fbMenu')}</h3></div>
      <button class="icon-btn" onclick="closeSheet()" aria-label="${t('close')}">${icon('close')}</button>
    </div>
    <div class="chips wrap" role="radiogroup" aria-label="${t('fbEyebrow')}">${FEEDBACK_KINDS.map(k =>
      `<button class="chip${k === feedbackKind ? ' active' : ''}" role="radio" aria-checked="${k === feedbackKind}" data-kind="${k}" onclick="setFeedbackKind('${k}')">${t('fbKind_' + k)}</button>`).join('')}</div>
    <textarea class="input" id="fb-text" rows="5" maxlength="2000" aria-label="${t('fbMenu')}" placeholder="${t('fbPh_' + feedbackKind)}" oninput="$('#fb-error').textContent=''"></textarea>
    <p class="fb-error" id="fb-error" role="alert"></p>
    ${reply}
    <button class="btn-accent big" id="fb-send" onclick="sendFeedback()">${t('fbSend')}</button>
    <p class="muted small fb-context">${t('fbContext')}</p>`);
}
function setFeedbackKind(k) {
  feedbackKind = k;
  document.querySelectorAll('#sheet .chip[data-kind]').forEach(b => {
    b.classList.toggle('active', b.dataset.kind === k);
    b.setAttribute('aria-checked', b.dataset.kind === k);
  });
  $('#fb-text').placeholder = t('fbPh_' + k);
}

// Version de l'appli : le numéro ?v= des fichiers (changé à chaque publication)
const appVersion = () => ((document.querySelector('script[src*="js/feedback.js"]') || {}).src || '').split('v=')[1] || '';

async function sendFeedback() {
  const text = $('#fb-text').value.trim();
  if (!text) { $('#fb-error').textContent = t('fbEmpty'); $('#fb-text').focus(); return; }
  const email = DEMO ? ($('#fb-email').value || '').trim().slice(0, 200) : ($('#fb-reply').checked ? Data.user.email || '' : '');
  const doc = {
    app: 'routine', kind: feedbackKind, text: text.slice(0, 2000), email, uid: DEMO ? null : Data.user.uid,
    screen: feedbackScreen, lang: currentLang, version: appVersion(), ua: navigator.userAgent.slice(0, 300),
    demo: DEMO, beta: !!window.BETA,
  };
  const btn = $('#fb-send');
  btn.disabled = true;
  try {
    await postFeedback(doc);
  } catch (e) {
    console.warn('Message non envoyé :', e);
    $('#fb-error').textContent = t(e.message === 'offline' ? 'fbOffline' : 'fbFailed');
    btn.disabled = false;
    return;
  }
  openSheet(`
    <div class="sheet-head">
      <div><div class="eyebrow">${t('fbEyebrow')}</div><h3>${t('fbThanks')}</h3></div>
      <button class="icon-btn" onclick="closeSheet()" aria-label="${t('close')}">${icon('close')}</button>
    </div>
    <p class="muted">${t(email ? 'fbThanksReply' : 'fbThanksText')}</p>
    <button class="btn-outline" onclick="closeSheet()">${t('close')}</button>`);
}

// Avec un compte : comme les séances, l'écriture est gardée sur le téléphone hors connexion et part au
// retour du réseau, on n'attend donc pas la réponse. Sans compte (démo) : pas de copie sur le téléphone,
// le message doit partir tout de suite.
let feedbackApp = null;
function postFeedback(doc) {
  const data = { ...doc, createdAt: firebase.firestore.FieldValue.serverTimestamp() };
  if (!DEMO) {
    firebase.firestore().collection('feedback').add(data).catch(e => { console.warn(e); toast(t('serverRefused')); });
    return Promise.resolve();
  }
  if (!navigator.onLine) return Promise.reject(new Error('offline'));
  feedbackApp = feedbackApp || firebase.initializeApp(FIREBASE_CONFIG, 'feedback');
  const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 15000));
  return Promise.race([feedbackApp.firestore().collection('feedback').add(data), timeout]);
}
