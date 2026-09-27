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
  "tapis": "Treadmill",
  "marche-inclinee": "Incline walk",
  "velo": "Bike",
  "elliptique": "Elliptical",
  "rameur": "Rowing machine",
  "stairmaster": "StairMaster",
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
  ['tapis', 'Tapis de course', 'cardio', 'cardio', ['treadmill', 'course tapis', 'running']],
  ['marche-inclinee', 'Marche inclinée', 'cardio', 'cardio', ['incline walk']],
  ['velo', 'Vélo', 'cardio', 'cardio', ['bike', 'spinning', 'velo appartement']],
  ['elliptique', 'Vélo elliptique', 'cardio', 'cardio', ['elliptical', 'cross trainer']],
  ['rameur', 'Rameur', 'cardio', 'cardio', ['rower', 'rowing machine']],
  ['stairmaster', 'StairMaster', 'cardio', 'cardio', ['escalier', 'stair climber']],
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
const CATALOG_BY_ID = Object.fromEntries(CATALOG.map(e => [e.id, e]));

// Nom affiché dans la langue choisie (les exercices créés gardent le nom donné)
const exLabel = ex => (currentLang === 'en' && ex.en) || ex.name;
// Nom d'un exercice noté dans une séance : le catalogue suit la langue, sinon le nom enregistré
const entryName = e => (CATALOG_BY_ID[e.exId] ? exLabel(CATALOG_BY_ID[e.exId]) : e.name);
