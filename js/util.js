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
const fmtDay = s => toDate(s).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
const fmtShort = s => toDate(s).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
const fmtLong = s => toDate(s).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
function relDay(s) {
  const n = daysBetween(s, isoDate());
  if (n === 0) return 'aujourd’hui';
  if (n === 1) return 'hier';
  if (n > 1 && n < 7) return `il y a ${n} jours`;
  return `le ${fmtShort(s)}`;
}

const numOrNull = v => {
  if (v === null || v === undefined || v === '') return null;
  const n = parseFloat(String(v).replace(',', '.'));
  return Number.isFinite(n) ? n : null;
};
const fmtNum = n => String(Math.round(n * 100) / 100).replace('.', ',');

// Résumé lisible d'un exercice noté : « 3 × 10 · 20 kg », « 25 min · 3 km »
function entrySummary(e) {
  if (e.kind === 'sets') {
    const sets = (e.sets || []).filter(s => s.reps || s.weight);
    if (!sets.length) return 'Fait';
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
      const reps = g.reps ? `${g.n} × ${g.reps}` : plural(g.n, 'série');
      return g.weight ? `${reps} · ${fmtNum(g.weight)} kg` : reps;
    }).join(' + ');
  }
  const parts = [];
  if (e.duration) parts.push(`${fmtNum(e.duration)} min`);
  if (e.distance) parts.push(`${fmtNum(e.distance)} km`);
  return parts.join(' · ') || 'Fait';
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
