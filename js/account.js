// ===== MON COMPTE : objectifs par muscle, menu, connexion =====

// ===== OBJECTIFS PAR MUSCLE =====
// prefs.goals : { muscle: 'up' (à développer) | 'down' (à ménager) }. Sert aux pictos (orange),
// aux avertissements, au filtre « Mes objectifs » et, plus tard, aux recommandations.
const muscleGoal = m => (prefs().goals || {})[m] || null;
const hasUpGoals = () => Object.values(prefs().goals || {}).includes('up');
const muscleNames = list => list.map(muscleShort).join(', ');
function setGoal(m, g) {
  const goals = { ...(prefs().goals || {}) };
  if (g) goals[m] = g; else delete goals[m];
  savePrefs({ goals });
}
// Étiquette verte : l'exercice travaille en principal un muscle « à développer »
function goalBadge(ex) {
  const up = musclesOf(ex)[0].filter(m => muscleGoal(m) === 'up');
  return up.length ? `<span class="goal-badge">${icon('check')}${esc(t('goalBadge', { m: muscleNames(up) }))}</span>` : '';
}
// « Sollicite surtout : trapèzes (à ménager) »
function goalNote(ex) {
  const [main, sec] = musclesOf(ex);
  const dMain = main.filter(m => muscleGoal(m) === 'down');
  const dSec = sec.filter(m => !main.includes(m) && muscleGoal(m) === 'down');
  if (dMain.length) return t('goalWarnMain', { m: muscleNames(dMain) });
  if (dSec.length) return t('goalWarnSec', { m: muscleNames(dSec) });
  return '';
}
// Plus c'est haut, plus l'exercice va dans le sens de tes objectifs
function goalScore(ex) {
  const [main, sec] = musclesOf(ex);
  let s = 0;
  for (const m of main) s += muscleGoal(m) === 'up' ? 2 : muscleGoal(m) === 'down' ? -3 : 0;
  for (const m of sec) if (!main.includes(m)) s += muscleGoal(m) === 'up' ? 1 : muscleGoal(m) === 'down' ? -1 : 0;
  return s;
}
function goalsSummary() {
  const g = prefs().goals || {};
  const up = MUSCLES.filter(m => g[m] === 'up'), down = MUSCLES.filter(m => g[m] === 'down');
  return [up.length && t('goalsSumUp', { m: muscleNames(up) }), down.length && t('goalsSumDown', { m: muscleNames(down) })].filter(Boolean).join(' · ');
}
function openGoals() {
  openSheet(`
    <div class="sheet-head">
      <div><div class="eyebrow">${t('navSettings')}</div><h3>${t('goalsTitle')}</h3></div>
      <button class="icon-btn" onclick="closeSheet()" aria-label="${t('close')}">${icon('close')}</button>
    </div>
    <p class="muted small">${t('goalsHint')}</p>
    <div id="goals-list"></div>`, renderGoals);
}
function renderGoals() {
  const box = $('#goals-list');
  if (!box) return;
  box.innerHTML = MUSCLES.map(m => `<div class="goal-line"><span>${t('m_' + m)}</span>
    <div class="seg small" role="radiogroup" aria-label="${esc(t('m_' + m))}">${[['up', t('goalUp')], [null, '—'], ['down', t('goalDown')]].map(([g, label]) =>
      `<button class="${muscleGoal(m) === g ? 'active' : ''} ${g || 'none'}" role="radio" aria-checked="${muscleGoal(m) === g}" onclick="setGoal('${m}',${g ? `'${g}'` : 'null'})">${label}</button>`).join('')}</div>
  </div>`).join('');
}

// ===== MON COMPTE =====
// Seulement le compte : pseudo, e-mail, déconnexion. Le paramétrage est dans l'onglet Réglages.
function openMenu() {
  openSheet(`
    <div class="sheet-head">
      <div class="account-head"><div class="eyebrow">${t('account')}</div>
        <label class="name-edit"><span class="sr-only">${t('pseudo')}</span>
          <input class="serif" id="pseudo-input" maxlength="30" autocomplete="nickname" placeholder="${t('pseudoPh')}" value="${esc(pseudo())}"
            onchange="savePseudo(this.value)" onkeydown="if(event.key==='Enter')this.blur()">${icon('edit')}</label>
        <p class="muted small">${DEMO ? t('demoAccount') : esc(Data.user.email)}</p></div>
      <button class="icon-btn" onclick="closeSheet()" aria-label="${t('close')}">${icon('close')}</button>
    </div>
    ${DEMO ? `<p class="demo-note">${t('demoMenu')}</p>` : ''}
    <div class="menu-list">
      ${DEMO ? `<button class="btn-line" onclick="Backend.resetDemo()">${t('resetDemo')}</button>` : ''}
      <button class="btn-line" onclick="closeSheet();setTab('settings')">${t('navSettings')}<span class="btn-sub">${t('settingsSub')}</span></button>
      <button class="btn-quiet" onclick="logout()">${DEMO ? t('leaveDemo') : t('logout')}</button>
      <a class="privacy-link" href="privacy-policy.html" target="_blank" rel="noopener">${t('privacy')}</a>
    </div>`);
}
// Pseudo affiché à la place de l'e-mail (la connexion reste par e-mail)
const pseudo = () => (prefs().pseudo || '').trim();
function savePseudo(v) {
  const p = v.trim().replace(/\s+/g, ' ');
  if (p === pseudo()) return;
  savePrefs({ pseudo: p || undefined });
  toast(p ? t('pseudoSaved', { p }) : t('pseudoRemoved'));
  if (!$('#sheet').classList.contains('hidden')) openMenu();
}
function logout() { closeSheet(); Backend.logout(); }

// ===== CONNEXION =====
let authMode = 'login';
function switchAuth(mode) {
  authMode = mode;
  $('#tab-login').classList.toggle('active', mode === 'login');
  $('#tab-register').classList.toggle('active', mode === 'register');
  $('#auth-submit').textContent = mode === 'login' ? t('login') : t('createAccount');
  $('#auth-password').autocomplete = mode === 'login' ? 'current-password' : 'new-password';
  $('#auth-forgot').classList.toggle('hidden', mode !== 'login');
  authMsg('');
}
function authMsg(text, ok) {
  const el = $('#auth-msg');
  el.textContent = text;
  el.classList.toggle('hidden', !text);
  el.classList.toggle('ok', !!ok);
}
async function submitAuth(ev) {
  ev.preventDefault();
  const email = $('#auth-email').value.trim(), pw = $('#auth-password').value;
  const btn = $('#auth-submit');
  btn.disabled = true;
  authMsg('');
  try {
    await (authMode === 'login' ? Backend.login(email, pw) : Backend.register(email, pw));
  } catch (e) {
    authMsg(authMessage(e.code));
  }
  btn.disabled = false;
}
async function forgotPassword() {
  const email = $('#auth-email').value.trim();
  if (!email) { authMsg(t('forgotNeedEmail')); return; }
  try {
    await Backend.reset(email);
    authMsg(t('resetSent'), true);
  } catch (e) { authMsg(authMessage(e.code)); }
}
