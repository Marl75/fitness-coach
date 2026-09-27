// ===== GRAPHIQUES (SVG maison, une seule série, infobulle au toucher) =====
const SVGNS = 'http://www.w3.org/2000/svg';

function niceMax(v) {
  if (v <= 4) return Math.max(1, Math.ceil(v));
  const p = Math.pow(10, Math.floor(Math.log10(v)));
  for (const m of [1, 2, 2.5, 5, 10]) if (m * p >= v) return m * p;
  return 10 * p;
}

function showTip(box, x, y, html) {
  let tip = box.querySelector('.tip');
  if (!tip) { tip = document.createElement('div'); tip.className = 'tip'; box.appendChild(tip); }
  tip.innerHTML = html;
  const w = box.clientWidth;
  tip.style.left = Math.min(Math.max(x, 70), w - 70) + 'px';
  tip.style.top = y + 'px';
}
const hideTip = box => box.querySelector('.tip')?.remove();

// Barres verticales : [{ label, value, tip }]
function barChart(box, data, { height = 150 } = {}) {
  const W = box.clientWidth || 320, H = height;
  const m = { t: 10, r: 4, b: 22, l: 22 };
  const iw = W - m.l - m.r, ih = H - m.t - m.b;
  const max = niceMax(Math.max(3, ...data.map(d => d.value)));
  const band = iw / data.length;
  const bw = Math.min(26, band * 0.62);
  const y = v => m.t + ih - (v / max) * ih;
  const ticks = max <= 4 ? Array.from({ length: max + 1 }, (_, i) => i) : [0, max / 2, max];

  let s = `<svg viewBox="0 0 ${W} ${H}" height="${H}" role="img">`;
  s += `<g class="grid">${ticks.map(t => `<line x1="${m.l}" x2="${W - m.r}" y1="${y(t)}" y2="${y(t)}"/>`).join('')}</g>`;
  s += `<g class="axis">${ticks.map(t => `<text x="${m.l - 8}" y="${y(t) + 4}" text-anchor="end">${t}</text>`).join('')}`;
  const every = Math.ceil(data.length / 6);
  data.forEach((d, i) => {
    if ((data.length - 1 - i) % every === 0) s += `<text x="${m.l + band * i + band / 2}" y="${H - 4}" text-anchor="middle">${esc(d.label)}</text>`;
  });
  s += `</g><g>`;
  data.forEach((d, i) => {
    if (!d.value) return;
    const x = m.l + band * i + (band - bw) / 2, top = y(d.value), base = y(0), r = Math.min(4, bw / 2, base - top);
    s += `<path fill="var(--accent)" d="M${x},${base} V${top + r} Q${x},${top} ${x + r},${top} H${x + bw - r} Q${x + bw},${top} ${x + bw},${top + r} V${base} Z"/>`;
  });
  s += `</g><g>`;
  data.forEach((d, i) => {
    s += `<rect data-i="${i}" x="${m.l + band * i}" y="${m.t}" width="${band}" height="${ih}" fill="transparent"/>`;
  });
  s += `</g></svg>`;
  box.innerHTML = s;

  const svg = box.querySelector('svg');
  const onMove = ev => {
    const i = ev.target.dataset?.i;
    if (i === undefined) return hideTip(box);
    const d = data[i];
    const r = svg.getBoundingClientRect(), br = box.getBoundingClientRect();
    const scale = r.width / W;
    showTip(box, (m.l + band * i + band / 2) * scale + r.left - br.left, y(d.value) * scale + r.top - br.top, d.tip);
  };
  svg.addEventListener('pointermove', onMove);
  svg.addEventListener('pointerdown', onMove);
  svg.addEventListener('pointerleave', () => hideTip(box));
}

// Courbe dans le temps : [{ date: 'AAAA-MM-JJ', value, tip }] (ordre chronologique)
function lineChart(box, pts, { height = 170 } = {}) {
  const W = box.clientWidth || 320, H = height;
  const m = { t: 14, r: 10, b: 22, l: 34 };
  const iw = W - m.l - m.r, ih = H - m.t - m.b;
  const t0 = toDate(pts[0].date).getTime(), t1 = toDate(pts[pts.length - 1].date).getTime();
  const vals = pts.map(p => p.value);
  let lo = Math.min(...vals), hi = Math.max(...vals);
  // Graduations rondes (1, 2, 2,5, 5, 10…) qui encadrent les valeurs
  const span = (hi - lo) || Math.max(1, hi * 0.2);
  const step = niceMax(span / 3);
  lo = Math.max(0, Math.floor((lo - span * 0.1) / step) * step);
  hi = Math.ceil((hi + span * 0.1) / step) * step;
  const x = p => m.l + (t1 === t0 ? iw / 2 : ((toDate(p.date).getTime() - t0) / (t1 - t0)) * iw);
  const y = v => m.t + ih - ((v - lo) / (hi - lo)) * ih;
  const ticks = [];
  for (let t = lo; t <= hi + step / 2; t += step) ticks.push(t);
  const fmtTick = v => fmtNum(v);

  let s = `<svg viewBox="0 0 ${W} ${H}" height="${H}" role="img">`;
  s += `<g class="grid">${ticks.map(t => `<line x1="${m.l}" x2="${W - m.r}" y1="${y(t)}" y2="${y(t)}"/>`).join('')}</g>`;
  s += `<g class="axis">${ticks.map(t => `<text x="${m.l - 8}" y="${y(t) + 4}" text-anchor="end">${fmtTick(t)}</text>`).join('')}`;
  s += `<text x="${m.l}" y="${H - 4}">${esc(fmtShort(pts[0].date))}</text>`;
  s += `<text x="${W - m.r}" y="${H - 4}" text-anchor="end">${esc(fmtShort(pts[pts.length - 1].date))}</text></g>`;
  s += `<line class="xhair" stroke="var(--text-faint)" stroke-dasharray="3 3" y1="${m.t}" y2="${m.t + ih}" visibility="hidden"/>`;
  s += `<polyline fill="none" stroke="var(--accent)" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" points="${pts.map(p => `${x(p)},${y(p.value)}`).join(' ')}"/>`;
  s += pts.map((p, i) => `<circle data-i="${i}" cx="${x(p)}" cy="${y(p.value)}" r="4" fill="var(--accent)" stroke="var(--surface)" stroke-width="2"/>`).join('');
  s += `<rect x="${m.l}" y="0" width="${iw}" height="${H}" fill="transparent"/></svg>`;
  box.innerHTML = s;

  const svg = box.querySelector('svg'), xh = svg.querySelector('.xhair');
  const onMove = ev => {
    const r = svg.getBoundingClientRect(), br = box.getBoundingClientRect();
    const scale = r.width / W;
    const px = (ev.clientX - r.left) / scale;
    let best = 0;
    pts.forEach((p, i) => { if (Math.abs(x(p) - px) < Math.abs(x(pts[best]) - px)) best = i; });
    const p = pts[best];
    xh.setAttribute('x1', x(p)); xh.setAttribute('x2', x(p)); xh.setAttribute('visibility', 'visible');
    showTip(box, x(p) * scale + r.left - br.left, y(p.value) * scale + r.top - br.top, p.tip);
  };
  svg.addEventListener('pointermove', onMove);
  svg.addEventListener('pointerdown', onMove);
  svg.addEventListener('pointerleave', () => { xh.setAttribute('visibility', 'hidden'); hideTip(box); });
}
