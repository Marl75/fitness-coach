// ===== OUTILS =====
const $ = sel => document.querySelector(sel);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const icon = (id, cls = '') => `<svg class="${cls}" aria-hidden="true"><use href="#i-${id}"/></svg>`;
const norm = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
const plural = (n, word) => `${n} ${word}${n > 1 ? 's' : ''}`;

// Dates au format AAAA-MM-JJ, toujours en heure locale
// (l'ancienne appli utilisait l'heure UTC : à Singapour, une séance avant 8 h tombait la veille).
const pad = n => String(n).padStart(2, '0');
const isoDate = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const toDate = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const mondayOf = d => { const x = new Date(d.getFullYear(), d.getMonth(), d.getDate()); x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); return x; };
const daysBetween = (a, b) => Math.round((toDate(b) - toDate(a)) / 86400000);
const fmtDay = s => toDate(s).toLocaleDateString(locale(), { weekday: 'long', day: 'numeric', month: 'long' });
const fmtShort = s => toDate(s).toLocaleDateString(locale(), { day: 'numeric', month: 'short' });
const fmtDM = s => toDate(s).toLocaleDateString(locale(), { day: 'numeric', month: 'long' });
const fmtLong = s => toDate(s).toLocaleDateString(locale(), { day: 'numeric', month: 'long', year: 'numeric' });
function relDay(s) {
  const n = daysBetween(s, isoDate());
  if (n === 0) return t('today');
  if (n === 1) return t('yesterday');
  if (n > 1 && n < 7) return t('daysAgo', { n });
  return t('onDate', { date: fmtDM(s) });
}

const numOrNull = v => {
  if (v === null || v === undefined || v === '') return null;
  const n = parseFloat(String(v).replace(',', '.'));
  return Number.isFinite(n) ? n : null;
};
const fmtNum = n => { const s = String(Math.round(n * 100) / 100); return currentLang === 'en' ? s : s.replace('.', ','); };

// Séries : une série prévue a done === false ; les anciennes données (sans le champ) comptent comme faites
const doneSets = e => (e.sets || []).filter(s => s.done !== false && (s.reps || s.weight));
const pendingIndex = e => e.kind === 'sets' ? (e.sets || []).findIndex(s => s.done === false) : -1;
const entryDone = e => e.kind !== 'sets' || doneSets(e).length > 0;

// Résumé lisible d'un exercice noté : « 3 × 10 · 20 kg », « 25 min · 3 km »
function entrySummary(e) {
  if (e.kind === 'sets') {
    const sets = doneSets(e);
    if (!sets.length) return (e.sets || []).length ? t('notStarted') : t('didIt');
    // Mêmes répétitions, poids différents : « 3 × 10 · 35 / 32,5 / 35 kg »
    if (sets.length > 1 && sets.every(s => s.reps === sets[0].reps) && sets.every(s => s.weight) && new Set(sets.map(s => s.weight)).size > 1) {
      return `${sets.length} × ${sets[0].reps || '?'} · ${sets.map(s => fmtNum(s.weight)).join(' / ')} kg`;
    }
    const groups = [];
    for (const s of sets) {
      const g = groups[groups.length - 1];
      if (g && g.reps === s.reps && g.weight === s.weight) g.n++;
      else groups.push({ n: 1, reps: s.reps, weight: s.weight });
    }
    return groups.map(g => {
      const reps = g.reps ? `${g.n} × ${g.reps}` : tn('sets', g.n);
      return g.weight ? `${reps} · ${fmtNum(g.weight)} kg` : reps;
    }).join(' + ');
  }
  const parts = [];
  if (e.duration) parts.push(`${fmtNum(e.duration)} min`);
  if (e.distance) parts.push(`${fmtNum(e.distance)} km`);
  return parts.join(' · ') || t('didIt');
}

let toastTimer;
function toast(msg) {
  document.querySelectorAll('.toast').forEach(t => t.remove());
  const el = document.createElement('div');
  el.className = 'toast';
  el.setAttribute('role', 'status');
  el.textContent = msg;
  document.body.appendChild(el);
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.remove(), 2400);
}
