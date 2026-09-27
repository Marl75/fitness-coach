// Catalogue d'exercices de départ.
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
  ['lat-pulldown', 'Tirage vertical', 'upper', 'sets'],
  ['tirage-horizontal', 'Tirage horizontal (rowing assis)', 'upper', 'sets'],
  ['row-haltere', 'Rowing haltère', 'upper', 'sets'],
  ['pullup', 'Traction assistée', 'upper', 'sets'],
  ['face-pull', 'Face pull à la poulie', 'upper', 'sets'],
  ['dev-couche', 'Développé couché', 'upper', 'sets'],
  ['dev-incline', 'Développé incliné haltères', 'upper', 'sets'],
  ['devmili', 'Développé militaire', 'upper', 'sets'],
  ['pec-deck', 'Pec deck (butterfly)', 'upper', 'sets'],
  ['ecarte-poulie', 'Écarté à la poulie', 'upper', 'sets'],
  ['lateral', 'Élévations latérales', 'upper', 'sets'],
  ['reversefly', 'Oiseau inversé', 'upper', 'sets'],
  ['curl', 'Curl biceps', 'upper', 'sets'],
  ['curl-marteau', 'Curl marteau', 'upper', 'sets'],
  ['triceps-poulie', 'Extension triceps à la poulie', 'upper', 'sets'],
  ['dips', 'Dips', 'upper', 'sets'],
  ['shrug', 'Shrug (trapèzes)', 'upper', 'sets'],
  // Jambes & fessiers
  ['squat', 'Squat', 'lower', 'sets'],
  ['leg-press', 'Presse à cuisses', 'lower', 'sets'],
  ['squat-bulgare', 'Squat bulgare', 'lower', 'sets'],
  ['fentes', 'Fentes', 'lower', 'sets'],
  ['hipthrust', 'Hip thrust', 'lower', 'sets'],
  ['rdl', 'Soulevé de terre roumain', 'lower', 'sets'],
  ['legext', 'Leg extension', 'lower', 'sets'],
  ['legcurl', 'Leg curl', 'lower', 'sets'],
  ['abduction', 'Abduction (machine)', 'lower', 'sets'],
  ['adduction', 'Adduction (machine)', 'lower', 'sets'],
  ['kickback', 'Kickback à la poulie', 'lower', 'sets'],
  ['mollets', 'Mollets', 'lower', 'sets'],
  ['hyperext', 'Extensions lombaires (banc 45°)', 'lower', 'sets'],
  // Abdos & gainage
  ['crunch', 'Crunch', 'core', 'sets'],
  ['crunch-poulie', 'Crunch à la poulie', 'core', 'sets'],
  ['releve-jambes', 'Relevé de jambes', 'core', 'sets'],
  ['russian', 'Russian twist', 'core', 'sets'],
  ['planche', 'Planche (gainage)', 'core', 'time'],
  ['planche-lat', 'Planche latérale', 'core', 'time'],
  ['mountain', 'Mountain climbers', 'core', 'time'],
  // Cardio
  ['tapis', 'Tapis de course', 'cardio', 'cardio'],
  ['marche-inclinee', 'Marche inclinée', 'cardio', 'cardio'],
  ['velo', 'Vélo', 'cardio', 'cardio'],
  ['elliptique', 'Vélo elliptique', 'cardio', 'cardio'],
  ['rameur', 'Rameur', 'cardio', 'cardio'],
  ['stairmaster', 'StairMaster', 'cardio', 'cardio'],
  ['corde', 'Corde à sauter', 'cardio', 'time'],
  ['course', 'Course à pied (dehors)', 'cardio', 'cardio'],
  ['natation', 'Natation', 'cardio', 'cardio'],
  // Cours & étirements
  ['yoga', 'Yoga', 'class', 'time'],
  ['pilates', 'Pilates', 'class', 'time'],
  ['stretching', 'Étirements', 'class', 'time'],
  ['cours-collectif', 'Cours collectif', 'class', 'time'],
  ['hiit', 'HIIT', 'class', 'time'],
].map(([id, name, group, kind]) => ({ id, name, group, kind }));
