// Catalogue d'exercices de départ.
// aliases : autres noms (anglais, machines) pour retrouver l'exercice et repérer les doublons.
// kind : 'sets'   → séries (répétitions × kg)
//        'cardio' → durée (+ distance facultative)
//        'time'   → durée seule (cours, étirements, gainage)
const KINDS = {
  sets:   { label: 'Muscu',  hint: 'séries, répétitions, poids' },
  cardio: { label: 'Cardio', hint: 'durée, distance' },
  time:   { label: 'Cours / étirement', hint: 'durée' },
};

const GROUPS = [
  { id: 'upper',   label: 'Haut du corps' },
  { id: 'lower',   label: 'Jambes & fessiers' },
  { id: 'core',    label: 'Abdos & gainage' },
  { id: 'cardio',  label: 'Cardio' },
  { id: 'class',   label: 'Cours & étirements' },
  { id: 'custom',  label: 'Mes exercices' },
];

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
].map(([id, name, group, kind, aliases = []]) => ({ id, name, group, kind, aliases }));
