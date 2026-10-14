// Catalogue d'exercices de départ.
// aliases : autres noms (anglais, machines) pour retrouver l'exercice et repérer les doublons.
// kind : 'sets'   → séries (répétitions × kg)
//        'cardio' → durée (+ distance facultative)
//        'time'   → durée seule (cours, étirements, gainage)
// Libellés traduits (voir i18n.js) : KINDS[k].label, GROUPS[i].label
const KINDS = Object.fromEntries(['sets', 'cardio', 'time'].map(k => [k, {
  get label() { return t('kind_' + k); },
  get hint() { return t('kindHint_' + k); },
}]));

const GROUPS = ['upper', 'lower', 'core', 'cardio', 'class', 'custom'].map(id => ({ id, get label() { return t('g_' + id); } }));

const CATALOG_EN = {"lat-pulldown": "Lat pulldown",
  "tirage-horizontal": "Seated cable row",
  "row-haltere": "Dumbbell row",
  "pullup": "Assisted pull-up",
  "face-pull": "Cable face pull",
  "dev-couche": "Bench press",
  "dev-incline": "Incline dumbbell press",
  "devmili": "Shoulder press",
  "pec-deck": "Pec deck (butterfly)",
  "ecarte-poulie": "Cable fly",
  "lateral": "Lateral raise",
  "reversefly": "Reverse fly",
  "curl": "Biceps curl",
  "curl-marteau": "Hammer curl",
  "triceps-poulie": "Triceps pushdown",
  "dips": "Dips",
  "shrug": "Shrugs",
  "squat": "Squat",
  "leg-press": "Leg press",
  "squat-bulgare": "Bulgarian split squat",
  "fentes": "Lunges",
  "hipthrust": "Hip thrust",
  "rdl": "Romanian deadlift",
  "legext": "Leg extension",
  "legcurl": "Leg curl",
  "abduction": "Hip abduction (machine)",
  "adduction": "Hip adduction (machine)",
  "kickback": "Cable glute kickback",
  "mollets": "Calf raise",
  "hyperext": "Back extension (45°)",
  "crunch": "Crunch",
  "crunch-poulie": "Cable crunch",
  "releve-jambes": "Leg raise",
  "russian": "Russian twist",
  "planche": "Plank",
  "planche-lat": "Side plank",
  "mountain": "Mountain climbers",
  "tapis": "Treadmill run",
  "marche-inclinee": "Incline walk",
  "velo": "Bike",
  "elliptique": "Elliptical",
  "rameur": "Rowing machine",
  "stairmaster": "Stair climber (StairMaster)",
  "allers-retours": "Loaded carry laps (farmer's walk)",
  "pullover": "Pullover",
  "corde": "Jump rope",
  "course": "Outdoor run",
  "natation": "Swimming",
  "yoga": "Yoga",
  "pilates": "Pilates",
  "stretching": "Stretching",
  "cours-collectif": "Group class",
  "hiit": "HIIT"};

const CATALOG = [
  // Haut du corps
  ['lat-pulldown', 'Tirage vertical', 'upper', 'sets', ['lat pulldown', 'tirage poitrine', 'tirage haut']],
  ['tirage-horizontal', 'Tirage horizontal (rowing assis)', 'upper', 'sets', ['seated row', 'rowing assis', 'tirage bas']],
  ['row-haltere', 'Rowing haltère', 'upper', 'sets', ['dumbbell row', 'rowing unilateral']],
  ['pullup', 'Traction assistée', 'upper', 'sets', ['pull up', 'traction', 'tractions', 'gravitron']],
  ['face-pull', 'Face pull à la poulie', 'upper', 'sets', ['face pull']],
  ['dev-couche', 'Développé couché', 'upper', 'sets', ['bench press', 'developpe couche']],
  ['dev-incline', 'Développé incliné haltères', 'upper', 'sets', ['incline press']],
  ['devmili', 'Développé militaire', 'upper', 'sets', ['shoulder press', 'presse epaules', 'developpe epaules']],
  ['pec-deck', 'Pec deck (butterfly)', 'upper', 'sets', ['butterfly', 'pec fly']],
  ['ecarte-poulie', 'Écarté à la poulie', 'upper', 'sets', ['cable fly', 'ecarte']],
  ['lateral', 'Élévations latérales', 'upper', 'sets', ['lateral raise', 'elevations laterales']],
  ['reversefly', 'Oiseau inversé', 'upper', 'sets', ['reverse fly']],
  ['curl', 'Curl biceps', 'upper', 'sets', ['biceps curl', 'bras']],
  ['curl-marteau', 'Curl marteau', 'upper', 'sets', ['hammer curl']],
  ['triceps-poulie', 'Extension triceps à la poulie', 'upper', 'sets', ['triceps pushdown', 'extension triceps', 'triceps']],
  ['dips', 'Dips', 'upper', 'sets'],
  ['shrug', 'Shrug (trapèzes)', 'upper', 'sets', ['trapezes']],
  ['pullover', 'Pull-over', 'upper', 'sets', ['pull over', 'bras tendus', 'allonge bras tendus']],
  // Jambes & fessiers
  ['squat', 'Squat', 'lower', 'sets'],
  ['leg-press', 'Presse à cuisses', 'lower', 'sets', ['leg press', 'seated leg press', 'presse jambes', 'presse']],
  ['squat-bulgare', 'Squat bulgare', 'lower', 'sets', ['bulgarian split squat']],
  ['fentes', 'Fentes', 'lower', 'sets', ['lunges', 'fente']],
  ['hipthrust', 'Hip thrust', 'lower', 'sets', ['hip thrust', 'pont fessier', 'glute bridge']],
  ['rdl', 'Soulevé de terre roumain', 'lower', 'sets', ['romanian deadlift', 'deadlift', 'souleve de terre']],
  ['legext', 'Leg extension', 'lower', 'sets', ['leg extension', 'extension jambes', 'quadriceps']],
  ['legcurl', 'Leg curl', 'lower', 'sets', ['leg curl', 'ischios']],
  ['abduction', 'Abduction (machine)', 'lower', 'sets', ['outer thigh', 'abducteurs', 'exterieur cuisses']],
  ['adduction', 'Adduction (machine)', 'lower', 'sets', ['inner thigh', 'adducteurs', 'interieur cuisses']],
  ['kickback', 'Kickback à la poulie', 'lower', 'sets', ['glute kickback']],
  ['mollets', 'Mollets', 'lower', 'sets', ['calf raise', 'mollet']],
  ['hyperext', 'Extensions lombaires (banc 45°)', 'lower', 'sets', ['back extension', 'lombaires']],
  // Abdos & gainage
  ['crunch', 'Crunch', 'core', 'sets', ['abdos', 'sit up']],
  ['crunch-poulie', 'Crunch à la poulie', 'core', 'sets'],
  ['releve-jambes', 'Relevé de jambes', 'core', 'sets', ['leg raise']],
  ['russian', 'Russian twist', 'core', 'sets'],
  ['planche', 'Planche (gainage)', 'core', 'time', ['plank', 'gainage']],
  ['planche-lat', 'Planche latérale', 'core', 'time', ['side plank']],
  ['mountain', 'Mountain climbers', 'core', 'time'],
  // Cardio
  ['tapis', 'Course sur tapis', 'cardio', 'cardio', ['treadmill', 'tapis de course', 'running']],
  ['marche-inclinee', 'Marche inclinée', 'cardio', 'cardio', ['incline walk']],
  ['velo', 'Vélo', 'cardio', 'cardio', ['bike', 'spinning', 'velo appartement']],
  ['elliptique', 'Vélo elliptique', 'cardio', 'cardio', ['elliptical', 'cross trainer']],
  ['rameur', 'Rameur', 'cardio', 'cardio', ['rower', 'rowing machine']],
  ['stairmaster', 'Montée de marches (StairMaster)', 'cardio', 'cardio', ['escalier', 'marches', 'stepper', 'stair climber']],
  ['allers-retours', 'Allers-retours chargés (piste)', 'cardio', 'cardio', ['farmer walk', 'marche chargee', 'porter des sacs', 'sacs', 'poids', 'piste']],
  ['corde', 'Corde à sauter', 'cardio', 'time', ['jump rope', 'corde a sauter']],
  ['course', 'Course à pied (dehors)', 'cardio', 'cardio', ['run', 'jogging', 'footing']],
  ['natation', 'Natation', 'cardio', 'cardio', ['swim', 'piscine']],
  // Cours & étirements
  ['yoga', 'Yoga', 'class', 'time'],
  ['pilates', 'Pilates', 'class', 'time'],
  ['stretching', 'Étirements', 'class', 'time', ['stretch', 'etirement']],
  ['cours-collectif', 'Cours collectif', 'class', 'time', ['group class', 'body pump', 'zumba']],
  ['hiit', 'HIIT', 'class', 'time'],
].map(([id, name, group, kind, aliases = []]) => ({ id, name, en: CATALOG_EN[id], group, kind, aliases }));

// ===== CHAMPS À NOTER (cardio, cours…) =====
// Chaque exercice a ses propres champs ; la valeur est rangée dans l'exercice noté sous la même clé.
// step : pas des boutons + / − ; max : valeur la plus haute.
const FIELDS = {
  duration: { step: 5 },     // minutes
  distance: { step: 0.5 },   // km
  speed: { step: 0.5 },      // km/h
  incline: { step: 1 },      // %
  level: { step: 1 },        // résistance / niveau de la machine
  rpe: { step: 1, max: 10 }, // intensité ressentie, de 1 à 10
  laps: { step: 1 },         // allers-retours
  carry: { step: 0.5 },      // charge portée, kg par main
  floors: { step: 5 },       // étages / marches
  track: { type: 'track' },  // piste de référence (choisie dans une liste)
};
const FIELD_ORDER = Object.keys(FIELDS);
const DEFAULT_FIELDS = { cardio: ['duration', 'distance'], time: ['duration'] };
const EX_FIELDS = {
  'tapis': ['duration', 'speed', 'incline', 'distance'],
  'marche-inclinee': ['duration', 'speed', 'incline', 'carry'],
  'course': ['duration', 'distance'],
  'velo': ['duration', 'level', 'rpe', 'distance'],
  'elliptique': ['duration', 'level', 'rpe'],
  'rameur': ['duration', 'distance', 'level'],
  'stairmaster': ['duration', 'level', 'floors'],
  'allers-retours': ['laps', 'carry', 'track', 'duration'],
  'natation': ['duration', 'distance'],
};

// ===== MUSCLES =====
const MUSCLES = ['pecs', 'lats', 'upperback', 'shoulders', 'biceps', 'triceps', 'abs', 'obliques', 'lowerback',
  'glutes', 'quads', 'hams', 'adductors', 'abductors', 'calves'];
// Ce que chaque exercice du catalogue travaille vraiment : [principaux, secondaires]
const EX_MUSCLES = {
  'lat-pulldown': [['lats'], ['biceps', 'upperback']],
  'tirage-horizontal': [['upperback', 'lats'], ['biceps']],
  'row-haltere': [['lats', 'upperback'], ['biceps']],
  'pullup': [['lats'], ['biceps', 'upperback']],
  'face-pull': [['upperback', 'shoulders'], []],
  'dev-couche': [['pecs'], ['triceps', 'shoulders']],
  'dev-incline': [['pecs', 'shoulders'], ['triceps']],
  'devmili': [['shoulders'], ['triceps']],
  'pec-deck': [['pecs'], ['shoulders']],
  'ecarte-poulie': [['pecs'], ['shoulders']],
  'lateral': [['shoulders'], ['upperback']],
  'reversefly': [['upperback', 'shoulders'], []],
  'curl': [['biceps'], []],
  'curl-marteau': [['biceps'], []],
  'triceps-poulie': [['triceps'], []],
  'dips': [['triceps', 'pecs'], ['shoulders']],
  'shrug': [['upperback'], []],
  'pullover': [['lats', 'pecs'], ['triceps']],
  'squat': [['quads', 'glutes'], ['hams', 'lowerback']],
  'leg-press': [['quads', 'glutes'], ['hams']],
  'squat-bulgare': [['quads', 'glutes'], ['hams', 'adductors']],
  'fentes': [['quads', 'glutes'], ['hams']],
  'hipthrust': [['glutes'], ['hams']],
  'rdl': [['hams', 'glutes'], ['lowerback']],
  'legext': [['quads'], []],
  'legcurl': [['hams'], []],
  'abduction': [['abductors', 'glutes'], []],
  'adduction': [['adductors'], []],
  'kickback': [['glutes'], ['hams']],
  'mollets': [['calves'], []],
  'hyperext': [['lowerback', 'glutes'], ['hams']],
  'crunch': [['abs'], []],
  'crunch-poulie': [['abs'], ['obliques']],
  'releve-jambes': [['abs'], []],
  'russian': [['obliques'], ['abs']],
  'planche': [['abs'], ['lowerback', 'shoulders']],
  'planche-lat': [['obliques'], ['abs']],
  'mountain': [['abs'], ['shoulders']],
  'stairmaster': [['glutes', 'quads'], ['calves']],
  'tapis': [['quads', 'glutes'], ['calves']],
  'course': [['quads', 'glutes'], ['calves']],
  'velo': [['quads'], ['glutes', 'calves']],
  'elliptique': [['quads', 'glutes'], []],
  'rameur': [['lats', 'upperback'], ['quads', 'biceps']],
  'corde': [['calves'], ['shoulders']],
  'natation': [['lats', 'shoulders'], []],
  'marche-inclinee': [['glutes', 'calves'], ['hams']],
  'allers-retours': [['upperback'], ['glutes', 'abs']],
};
// Muscles d'un exercice : catalogue, sinon ceux choisis à la création (tous comptés comme principaux)
function musclesOf(ex) {
  if (!ex) return [[], []];
  if (EX_MUSCLES[ex.id]) return EX_MUSCLES[ex.id];
  return [ex.muscles || [], []];
}

// ===== RÉGLAGES DE MUSCU =====
// Enregistrés avec l'exercice noté (entry.setup) : machine, haltères, position, banc, mouvement, muscles visés.
const POSITIONS = ['standing', 'seated', 'supine', 'prone'];
const BENCHES = ['flat', 'incline', 'decline'];
// Mouvements proposés à tous les exercices ; ceux ajoutés à la main restent proposés pour cet exercice
const MOVES = ['mv_unilateral', 'mv_wide', 'mv_narrow', 'mv_straight', 'mv_overhead'];

const CATALOG_BY_ID = Object.fromEntries(CATALOG.map(e => [e.id, e]));

// Nom affiché dans la langue choisie (les exercices créés gardent le nom donné)
const exLabel = ex => (currentLang === 'en' && ex.en) || ex.name;
// Nom d'un exercice noté dans une séance : le catalogue suit la langue, sinon le nom enregistré
const entryName = e => (CATALOG_BY_ID[e.exId] ? exLabel(CATALOG_BY_ID[e.exId]) : e.name);
// En français, le nom anglais s'affiche en dessous (rien en anglais, ni pour les exercices créés)
const exEn = ex => (currentLang === 'fr' && ex && ex.en && norm(ex.en) !== norm(ex.name) ? ex.en : '');
const entryEn = e => exEn(CATALOG_BY_ID[e.exId]);
const enLine = (en, cls = 'en-name') => (en ? `<span class="${cls}">${esc(en)}</span>` : '');
