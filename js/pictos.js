// ===== PICTOS D'EXERCICES =====
// Une silhouette au trait par exercice, le muscle travaillé surligné en vert (secondaires : vert pâle).
// Chaque pose donne les articulations (repère 48 × 48) et l'appareil ; les muscles se dessinent
// automatiquement le long du corps, d'après musclesOf() : un exercice créé a donc aussi son picto.
//   h tête · s épaules · p bassin · e coude · a main · k genou · f pied (L / R : les deux côtés)

// Silhouette debout, de face
const STAND = { h: [24, 7], s: [24, 11.5], p: [24, 25], kL: [22, 32], fL: [21, 40], kR: [26, 32], fR: [27, 40] };
// Couchée sur le dos, sur un banc
const LYING = { h: [10, 29], s: [14, 30], p: [27, 30], kL: [32, 24], fL: [36, 41], kR: [32, 24], fR: [36, 41] };
const BENCH = 'M7 34 H34 M11 34 V41 M30 34 V41';
const both = (e, a) => ({ eL: e, aL: a, eR: e, aR: a });
const db = (x, y) => `<circle cx="${x}" cy="${y}" r="2.2"/>`;   // haltère vu de face
const pulley = (x, y) => `<circle cx="${x}" cy="${y}" r="1.6"/>`;

const POSES = {
  // Haut du corps
  'lat-pulldown': { h: [24, 17], s: [24, 21], p: [24, 32], eL: [16, 16], aL: [13, 8], eR: [32, 16], aR: [35, 8], kL: [21, 34], fL: [20, 41], kR: [27, 34], fR: [28, 41],
    props: ['M9 8 H39 M24 2 V8', 'M17 33 H31'] },
  'tirage-horizontal': { h: [16, 12], s: [17, 16.5], p: [17, 30], ...both([11, 22], [21, 23]), kL: [27, 27], fL: [37, 31], kR: [27, 27], fR: [37, 31],
    props: ['M21 23 H44', 'M39 25 V35', 'M10 32 H24'] },
  'row-haltere': { h: [11, 14], s: [15, 16.5], p: [31, 19], eL: [21, 14], aL: [19, 22], eR: [15, 23], aR: [15, 29], kL: [33, 30], fL: [34, 41], kR: [27, 29], fR: [21, 29],
    props: ['M10 30 H30 M12 30 V41 M28 30 V41', db(19, 23)] },
  'pullup': { h: [24, 9], s: [24, 13.5], p: [24, 27], eL: [17, 10], aL: [16, 3], eR: [31, 10], aR: [32, 3], kL: [22, 34], fL: [22, 41], kR: [26, 34], fR: [26, 41],
    props: ['M10 3 H38', 'M17 42 H31'] },
  'face-pull': { h: [22, 7], s: [22, 11.5], p: [22, 25], ...both([15, 10], [19, 7]), kL: [21, 32], fL: [20, 40], kR: [24, 32], fR: [25, 40],
    props: ['M19 7 L41 9', pulley(42, 9)] },
  'dev-couche': { ...LYING, ...both([18, 23], [18, 15]), props: [BENCH, 'M10 15 H26', 'M9 12 V18 M27 12 V18'] },
  'dev-incline': { h: [13, 20], s: [16, 23], p: [27, 33], ...both([17, 15], [17, 8]), kL: [33, 29], fL: [36, 41], kR: [33, 29], fR: [36, 41],
    props: ['M13 26 L25 37 H35 M33 37 V41 M18 31 V41', 'M12 8 H22', db(11, 8), db(23, 8)] },
  'devmili': { ...STAND, eL: [17, 13], aL: [18, 5], eR: [31, 13], aR: [30, 5], props: ['M13 5 H35', 'M12 2 V8 M36 2 V8'] },
  'pec-deck': { ...STAND, eL: [15, 15], aL: [21, 12], eR: [33, 15], aR: [27, 12], props: ['M21 8 V16 M27 8 V16', 'M16 7 Q24 3 32 7'] },
  'ecarte-poulie': { ...STAND, eL: [15, 15], aL: [21, 13], eR: [33, 15], aR: [27, 13], props: ['M5 3 L21 13 M43 3 L27 13', pulley(5, 3), pulley(43, 3)] },
  'lateral': { ...STAND, eL: [17, 13.5], aL: [9, 14], eR: [31, 13.5], aR: [39, 14], props: [db(8, 14), db(40, 14)] },
  'reversefly': { h: [12, 15], s: [16, 17], p: [30, 18], eL: [20, 12], aL: [23, 7], eR: [20, 12], aR: [23, 7], kL: [31, 29], fL: [30, 40], kR: [31, 29], fR: [30, 40],
    props: [db(23, 6), 'M8 41 H36'] },
  'curl': { ...STAND, eL: [20, 19], aL: [18, 13], eR: [28, 19], aR: [30, 13], props: [db(18, 12), db(30, 12)] },
  'curl-marteau': { ...STAND, eL: [20, 19], aL: [19, 12], eR: [28, 19], aR: [29, 12], props: ['M19 9 V15 M29 9 V15'] },
  'triceps-poulie': { h: [22, 7], s: [22, 11.5], p: [22, 25], ...both([23, 19], [29, 24]), kL: [21, 32], fL: [20, 40], kR: [24, 32], fR: [25, 40],
    props: ['M34 3 L29 24', pulley(34, 3)] },
  'dips': { h: [24, 8], s: [24, 12.5], p: [24, 26], eL: [17, 15], aL: [16, 22], eR: [31, 15], aR: [32, 22], kL: [22, 33], fL: [22, 39], kR: [26, 33], fR: [26, 39],
    props: ['M8 22 H18 M30 22 H40', 'M10 22 V41 M38 22 V41'] },
  'shrug': { ...STAND, eL: [20, 19], aL: [19, 26], eR: [28, 19], aR: [29, 26], props: ['M16 26 H22 M26 26 H32', 'M14 9 V3 M12 5 L14 3 L16 5 M34 9 V3 M32 5 L34 3 L36 5'] },
  'pullover': { h: [13, 29], s: [17, 30], p: [30, 30], ...both([12, 25], [8, 20]), kL: [35, 24], fL: [39, 41], kR: [35, 24], fR: [39, 41],
    props: ['M10 34 H37 M14 34 V41 M33 34 V41', '<circle cx="7" cy="19" r="2.6"/>', 'M21 12 Q14 9 10 14 M10 14 L10.5 9.5 M10 14 L14.5 13'] },
  // Jambes & fessiers
  'squat': { h: [19, 12], s: [20, 16.5], p: [28, 28], ...both([14, 19], [9, 18]), kL: [18, 30], fL: [21, 40], kR: [18, 30], fR: [21, 40], props: ['M8 41 H36'] },
  'leg-press': { h: [10, 22], s: [13, 26], p: [22, 33], ...both([17, 31], [21, 34]), kL: [25, 22], fL: [34, 19], kR: [25, 22], fR: [34, 19],
    props: ['M37 10 L32 30', 'M7 24 L19 37 H29'] },
  'squat-bulgare': { h: [21, 7], s: [21, 11.5], p: [21, 24], ...both([21, 18], [21, 24]), kL: [14, 30], fL: [14, 40], kR: [27, 33], fR: [34, 28],
    props: ['M30 29 H42 M32 29 V41 M40 29 V41', db(21, 25)] },
  'fentes': { h: [22, 7], s: [22, 11.5], p: [22, 24], ...both([22, 18], [22, 24]), kL: [15, 30], fL: [14, 40], kR: [29, 37], fR: [35, 40],
    props: [db(22, 25), 'M8 41 H40'] },
  'hipthrust': { h: [9, 25], s: [13, 27], p: [27, 23], ...both([20, 24], [26, 21]), kL: [34, 26], fL: [34, 40], kR: [34, 26], fR: [34, 40],
    props: ['M4 29 H15 M6 29 V40 M13 29 V40', 'M21 20 H33', 'M20 17 V23 M34 17 V23'] },
  'rdl': { h: [12, 15], s: [16, 17], p: [30, 18], ...both([17, 24], [18, 31]), kL: [30, 29], fL: [30, 40], kR: [30, 29], fR: [30, 40],
    props: ['M12 31 H24', 'M12 28 V34 M24 28 V34'] },
  'legext': { h: [17, 9], s: [17, 13.5], p: [19, 27], ...both([19, 21], [24, 28]), kL: [29, 27], fL: [40, 25], kR: [29, 27], fR: [40, 25],
    props: ['M14 30 H30 M18 30 V41 M28 30 V41 M14 30 V14', '<circle cx="40" cy="28" r="2"/>'] },
  'legcurl': { h: [8, 24], s: [12, 26], p: [26, 26], ...both([9, 30], [5, 30]), kL: [36, 26], fL: [33, 16], kR: [36, 26], fR: [33, 16],
    props: ['M6 30 H38 M9 30 V40 M35 30 V40', '<circle cx="33" cy="14" r="2"/>'] },
  'abduction': { h: [24, 9], s: [24, 13.5], p: [24, 27], eL: [19, 20], aL: [17, 27], eR: [29, 20], aR: [31, 27], kL: [15, 30], fL: [15, 40], kR: [33, 30], fR: [33, 40],
    props: ['M17 28 H31', 'M12 27 V34 M36 27 V34', 'M8 31 H3 M5 29 L3 31 L5 33 M40 31 H45 M43 29 L45 31 L43 33'] },
  'adduction': { h: [24, 9], s: [24, 13.5], p: [24, 27], eL: [19, 20], aL: [17, 27], eR: [29, 20], aR: [31, 27], kL: [15, 30], fL: [15, 40], kR: [33, 30], fR: [33, 40],
    props: ['M17 28 H31', 'M18 29 V35 M30 29 V35', 'M4 31 H10 M8 29 L10 31 L8 33 M44 31 H38 M40 29 L38 31 L40 33'] },
  'kickback': { h: [12, 13], s: [16, 15], p: [26, 22], ...both([14, 22], [12, 28]), kL: [25, 31], fL: [25, 40], kR: [33, 24], fR: [41, 19],
    props: ['M41 19 L44 30', pulley(44, 31), 'M8 28 H14'] },
  'mollets': { ...STAND, eL: [20, 19], aL: [19, 26], eR: [28, 19], aR: [29, 26], fL: [21, 38], fR: [27, 38],
    props: ['M15 40 H33', 'M38 30 V22 M36 24 L38 22 L40 24'] },
  'hyperext': { h: [10, 14], s: [14, 17], p: [26, 26], ...both([18, 21], [16, 18]), kL: [32, 32], fL: [38, 38], kR: [32, 32], fR: [38, 38],
    props: ['M22 30 L28 24', 'M24 29 L38 41 M36 37 V41'] },
  // Abdos & gainage
  'crunch': { h: [13, 27], s: [16, 30], p: [26, 36], ...both([14, 24], [12, 26]), kL: [33, 28], fL: [38, 37], kR: [33, 28], fR: [38, 37], props: ['M5 38 H43'] },
  'crunch-poulie': { h: [17, 27], s: [18, 22], p: [29, 28], ...both([15, 25], [17, 23]), kL: [29, 38], fL: [38, 38], kR: [29, 38], fR: [38, 38],
    props: ['M17 23 L18 3', pulley(18, 3), 'M8 39 H42'] },
  'releve-jambes': { h: [8, 35], s: [12, 36], p: [25, 36], ...both([18, 38], [23, 38]), kL: [29, 25], fL: [33, 13], kR: [29, 25], fR: [33, 13], props: ['M4 40 H44'] },
  'russian': { h: [15, 20], s: [18, 24], p: [26, 34], ...both([24, 27], [30, 30]), kL: [34, 26], fL: [41, 30], kR: [34, 26], fR: [41, 30],
    props: ['<circle cx="31" cy="31" r="2.6"/>', 'M8 37 H44'] },
  'planche': { h: [8, 24], s: [12, 26], p: [26, 28], ...both([12, 33], [19, 33]), kL: [33, 30], fL: [41, 32], kR: [33, 30], fR: [41, 32], props: ['M4 34 H44'] },
  'planche-lat': { h: [9, 17], s: [13, 20], p: [25, 28], eL: [13, 32], aL: [19, 33], eR: [19, 21], aR: [24, 26], kL: [33, 32], fL: [41, 36], kR: [33, 32], fR: [41, 36],
    props: ['M4 37 H44'] },
  'mountain': { h: [8, 18], s: [12, 21], p: [27, 25], ...both([12, 28], [12, 34]), kL: [34, 29], fL: [42, 33], kR: [20, 28], fR: [27, 33], props: ['M4 35 H44'] },
  // Cardio
  'tapis': { h: [22, 8], s: [21.5, 12], p: [19, 23], eL: [16, 19], aL: [19, 23], eR: [26, 17], aR: [29, 13], kL: [13, 29], fL: [11, 36], kR: [25, 30], fR: [24, 37],
    props: ['M6 40 H42', 'M40 40 L37 20 H32'] },
  'marche-inclinee': { h: [21, 9], s: [21, 13], p: [20, 24], eL: [19, 18], aL: [17, 22], eR: [24, 17], aR: [27, 20], kL: [18, 29], fL: [16, 34], kR: [23, 28], fR: [25, 32],
    props: ['M6 41 L42 33', 'M38 34 L35 17 H30'] },
  'course': { h: [22, 8], s: [21.5, 12], p: [19, 23], eL: [16, 19], aL: [19, 23], eR: [26, 17], aR: [29, 13], kL: [13, 29], fL: [11, 36], kR: [25, 30], fR: [24, 37],
    props: ['M4 40 H44', 'M3 14 H8 M2 19 H7'] },
  'velo': { h: [23, 9], s: [22.5, 13], p: [20, 23], ...both([27, 17], [31, 20]), kL: [27, 28], fL: [25, 35], kR: [27, 28], fR: [25, 35],
    props: ['<circle cx="12" cy="35" r="7"/>', '<circle cx="37" cy="35" r="7"/>', 'M12 35 L20 25 H32 L37 35 M20 25 L25 35 M32 25 L31 20 H35'] },
  'elliptique': { h: [22, 7], s: [22, 11.5], p: [22, 24], eL: [27, 17], aL: [30, 13], eR: [17, 17], aR: [16, 22], kL: [26, 31], fL: [25, 37], kR: [19, 31], fR: [21, 37],
    props: ['M30 6 L33 30 M16 14 L13 30', '<ellipse cx="24" cy="38" rx="11" ry="2.5"/>'] },
  'rameur': { h: [16, 22], s: [18, 26], p: [24, 36], ...both([15, 31], [22, 29]), kL: [31, 28], fL: [37, 36], kR: [31, 28], fR: [37, 36],
    props: ['M22 29 L42 31', 'M6 39 H44', 'M38 31 V38'] },
  'stairmaster': { h: [23, 7], s: [23, 11], p: [22, 22], eL: [19, 16], aL: [18, 19], eR: [27, 15], aR: [28, 17], kL: [21, 28], fL: [20, 34], kR: [28, 21], fR: [30, 26],
    props: ['M5 42 H15 V34 H25 V26 H35 V18 H43'] },
  'corde': { ...STAND, h: [24, 9], s: [24, 13.5], p: [24, 26], eL: [19, 20], aL: [16, 25], eR: [29, 20], aR: [32, 25], kL: [22, 32], fL: [22, 37], kR: [26, 32], fR: [26, 37],
    props: ['M16 25 C10 -1 38 -1 32 25', 'M10 41 H38'] },
  'natation': { h: [10, 22], s: [14, 23], p: [28, 24], eL: [10, 17], aL: [4, 19], eR: [18, 27], aR: [22, 30], kL: [34, 24], fL: [41, 23], kR: [34, 25], fR: [41, 27],
    props: ['M3 32 Q7 29 11 32 T19 32 T27 32 T35 32 T43 32'] },
  'allers-retours': { h: [24, 7], s: [24, 11.5], p: [24, 25], eL: [20, 18], aL: [16, 23], eR: [28, 18], aR: [32, 23], kL: [22, 31], fL: [20, 37], kR: [26, 31], fR: [28, 37],
    props: ['<rect x="12" y="23" width="7" height="8" rx="1.5"/>', '<rect x="29" y="23" width="7" height="8" rx="1.5"/>', 'M8 43 H40 M12 40 L8 43 L12 46 M36 40 L40 43 L36 46'] },
  // Cours & étirements
  'yoga': { ...STAND, eL: [19, 6], aL: [24, 1], eR: [29, 6], aR: [24, 1], kR: [31, 28], fR: [24, 31], props: ['M10 41 H38'] },
  'pilates': { h: [9, 34], s: [13, 35], p: [25, 35], ...both([17, 38], [21, 38]), kL: [31, 35], fL: [39, 35], kR: [30, 26], fR: [34, 17], props: ['M4 39 H44'] },
  'stretching': { h: [31, 24], s: [28, 27], p: [17, 34], ...both([34, 31], [40, 33]), kL: [29, 35], fL: [41, 35], kR: [29, 35], fR: [41, 35], props: ['M6 38 H44'] },
  'cours-collectif': { ...STAND, eL: [18, 7], aL: [14, 3], eR: [30, 7], aR: [34, 3], kL: [19, 32], fL: [15, 40], kR: [29, 32], fR: [33, 40],
    props: ['M39 14 V6 L44 5 V13', '<circle cx="37.5" cy="14" r="1.6"/>', '<circle cx="42.5" cy="13" r="1.6"/>'] },
  'hiit': { h: [19, 12], s: [20, 16.5], p: [28, 28], ...both([14, 19], [9, 18]), kL: [18, 30], fL: [21, 40], kR: [18, 30], fR: [21, 40],
    props: ['M39 3 L34 13 H39 L35 22', 'M8 41 H36'] },
};
// Exercices créés : silhouette debout, bras le long du corps, et un objet selon le type
const GENERIC_POSE = { ...STAND, eL: [20, 19], aL: [19, 26], eR: [28, 19], aR: [29, 26] };
const KIND_PROP = {
  sets: ['M14 26 H20 M28 26 H34', 'M15 23.5 V28.5 M33 23.5 V28.5'],
  cardio: ['M40 9 a5 5 0 1 0 0.01 0 M40 6 V9 L42 11', 'M38 2 H42'],
  time: ['M10 41 H38'],
};

// Où dessiner chaque muscle sur la silhouette : segment du corps et portion [début, fin]
const MUSCLE_ON = {
  pecs: [['s', 'p', 0.08, 0.38]],
  upperback: [['s', 'p', 0, 0.32], ['s', 'eL', 0, 0.3], ['s', 'eR', 0, 0.3]],
  lats: [['s', 'p', 0.22, 0.62]],
  abs: [['s', 'p', 0.45, 0.88]],
  obliques: [['s', 'p', 0.45, 0.88]],
  lowerback: [['s', 'p', 0.62, 0.98]],
  shoulders: [['s', 'eL', 0, 0.45], ['s', 'eR', 0, 0.45]],
  biceps: [['s', 'eL', 0.3, 0.95], ['s', 'eR', 0.3, 0.95]],
  triceps: [['s', 'eL', 0.3, 0.95], ['s', 'eR', 0.3, 0.95]],
  forearms: [['eL', 'aL', 0.1, 0.85], ['eR', 'aR', 0.1, 0.85]],
  hipflexors: [['p', 'kL', 0.05, 0.5], ['p', 'kR', 0.05, 0.5]],
  glutes: [['p', 'p']],
  quads: [['p', 'kL', 0.18, 0.92], ['p', 'kR', 0.18, 0.92]],
  hams: [['p', 'kL', 0.18, 0.92], ['p', 'kR', 0.18, 0.92]],
  adductors: [['p', 'kL', 0.18, 0.92], ['p', 'kR', 0.18, 0.92]],
  abductors: [['p', 'kL', 0.18, 0.92], ['p', 'kR', 0.18, 0.92]],
  calves: [['kL', 'fL', 0.15, 0.75], ['kR', 'fR', 0.15, 0.75]],
};

const lerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
const pt = ([x, y]) => `${+x.toFixed(2)} ${+y.toFixed(2)}`;
const asEl = p => (p.startsWith('<') ? p : `<path d="${p}"/>`);

function muscleMarks(pose, list, cls) {
  let out = '';
  for (const m of list) for (const [from, to, t0, t1] of MUSCLE_ON[m] || []) {
    const a = pose[from], b = pose[to];
    if (!a || !b) continue;
    if (from === to) { out += `<circle class="${cls}" cx="${a[0]}" cy="${a[1]}" r="1.9"/>`; continue; }
    out += `<path class="${cls}" d="M${pt(lerp(a, b, t0))} L${pt(lerp(a, b, t1))}"/>`;
  }
  return out;
}

// Picto d'un exercice (catalogue ou créé) ; muscles : [principaux, secondaires]
function pictoSvg(ex, size = 40) {
  const pose = (ex && POSES[ex.id]) || { ...GENERIC_POSE, props: KIND_PROP[(ex && ex.kind) || 'sets'] || [] };
  const [main, sec] = musclesOf(ex);
  const j = pose;
  const limbs = [['s', 'p'], ['s', 'eL', 'aL'], ['s', 'eR', 'aR'], ['p', 'kL', 'fL'], ['p', 'kR', 'fR']]
    .filter(c => c.every(k => j[k])).map(c => `M${c.map(k => pt(j[k])).join(' L')}`).join(' ');
  return `<svg class="picto-svg" viewBox="0 0 48 48" width="${size}" height="${size}" aria-hidden="true">
    <g class="pf">${(pose.props || []).map(asEl).join('')}<path d="${limbs}"/><circle cx="${j.h[0]}" cy="${j.h[1]}" r="3.5"/></g>
    <g class="pm-sec">${muscleMarks(j, sec.filter(m => !main.includes(m)), 'pm')}</g>
    <g class="pm-main">${muscleMarks(j, main, 'pm')}</g>
  </svg>`;
}
const pictoTile = (ex, cls = '') => `<span class="picto ${cls}">${pictoSvg(ex)}</span>`;
// « Pectoraux · un peu triceps, épaules »
function musclesLine(ex) {
  const [main, sec] = musclesOf(ex);
  if (!main.length) return '';
  const extra = sec.filter(m => !main.includes(m));
  return main.map(m => t('m_' + m)).join(', ') + (extra.length ? ` · ${t('alsoLittle')} ${extra.map(m => t('m_' + m).toLowerCase()).join(', ')}` : '');
}
