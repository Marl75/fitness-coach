// ===== LANGUE (FR / EN) =====
// Même principe que Ma Collection : langue du téléphone par défaut, bouton pour changer, choix mémorisé.
const I18N = {
  fr: {
    locale: 'fr-FR', close: 'Fermer', save: 'Enregistrer', minus: 'Moins', plus: 'Plus',
    // Connexion
    authSub: 'Note tes séances, suis ta régularité', tabLogin: 'Connexion', tabRegister: 'Inscription',
    email: 'E-mail', emailPh: 'ton@email.com', password: 'Mot de passe', passwordPh: '6 caractères minimum',
    login: 'Se connecter', createAccount: 'Créer mon compte', forgot: 'Mot de passe oublié ?',
    demoAuth: 'Mode démo : n’importe quel e-mail et mot de passe fonctionnent. Les séances sont factices et restent sur cet appareil.',
    forgotNeedEmail: 'Écris ton e-mail ci-dessus, puis touche à nouveau « Mot de passe oublié ».',
    resetSent: 'E-mail envoyé ! Regarde ta boîte de réception (et les spams).',
    'auth/invalid-email': 'Adresse e-mail invalide.', 'auth/missing-password': 'Mot de passe manquant.',
    'auth/weak-password': 'Mot de passe trop court (6 caractères minimum).',
    'auth/email-already-in-use': 'Un compte existe déjà avec cet e-mail. Connecte-toi.',
    'auth/invalid-credential': 'E-mail ou mot de passe incorrect.', 'auth/wrong-password': 'E-mail ou mot de passe incorrect.',
    'auth/user-not-found': 'Aucun compte avec cet e-mail.', 'auth/too-many-requests': 'Trop d’essais. Réessaie dans quelques minutes.',
    'auth/network-request-failed': 'Pas de connexion internet.',
    'auth/operation-not-allowed': 'La connexion par e-mail n’est pas activée dans Firebase (Authentication > E-mail/Mot de passe).',
    authDefault: 'Une erreur est survenue. Réessaie.', serverRefused: 'Le serveur a refusé l’enregistrement',
    // Structure
    offline: 'Hors ligne · gardé sur le téléphone', navToday: 'Séance', navTrack: 'Suivi', account: 'Mon compte',
    // Séance
    todayTitle: 'Séance du jour', dayTitle: 'Séance du {date}', otherDay: 'Autre jour', otherDayAria: 'Choisir un autre jour',
    noSportToday: 'Pas encore de sport aujourd’hui.', noSessionDay: 'Pas de séance ce jour-là.',
    lastSession: 'Dernière séance {when}.', firstSession: 'Ta première séance commence ici.', weekProgress: 'Cette semaine : {n} sur {goal}.',
    startSession: 'Commencer ma séance', addExercise: 'Ajouter un exercice', addAnother: 'Ajouter un autre exercice',
    nextExercise: 'Exercice suivant', backToday: 'Revenir à aujourd’hui', favorites: 'Favoris',
    exercises_one: '{n} exercice', exercises_other: '{n} exercices', sets_one: '{n} série', sets_other: '{n} séries',
    cardioMin: '{n} min de cardio / cours', plannedSets_one: '{n} série prévue', plannedSets_other: '{n} séries prévues',
    currentAria: 'Exercice en cours', setOf: 'Série {i} sur {n}', changeNumbers: 'Changer les chiffres de la série',
    noWeight: 'sans poids', plateNone: 'Sans', plateNoneAria: 'Sans poids', kilos: '{w} kilos', stackAria: 'Pile de plaques',
    setDone: 'Série faite', addSetShort: '+ série', validateAll: 'Tout valider', stopHere: 'Arrêter là',
    exerciseDone: 'Exercice terminé', setNDone: 'Série {n} faite', addedFav: 'Ajouté aux favoris', removedFav: 'Retiré des favoris',
    // Choix de l'exercice
    whichExercise: 'Quel exercice ?', search: 'Rechercher…', searchAria: 'Rechercher un exercice', categories: 'Catégories',
    f_recent: 'Récents', f_all: 'Tous', favOn: 'Retirer des favoris', favOff: 'Ajouter aux favoris',
    noMatch: 'Aucun exercice ne correspond à « {q} ».', createQ: 'Créer « {q} »', createExercise: 'Créer un exercice',
    noFavs: 'Pas encore de favori. Touche l’étoile {star} à côté d’un exercice pour le retrouver ici, et en raccourci sur l’écran Séance.',
    newExercise: 'Nouvel exercice', name: 'Nom', namePh: 'ex. Presse à épaules', whatToLog: 'Ce que tu veux noter',
    categoryHint: 'Catégorie (pour le retrouver dans les filtres)', createStart: 'Créer et commencer', createAnyway: 'Créer quand même',
    existsAlready: 'Cet exercice existe déjà :', maybeExists: 'Il existe peut-être déjà :', use: 'Utiliser',
    confirmCreate: 'Si c’est bien un autre exercice, touche « Créer quand même ».', existsToast: 'Cet exercice existe déjà',
    created: '« {name} » créé',
    hide: 'Masquer', unhide: 'Réafficher', hiddenSection: 'Masqués ({n})', hiddenToast: 'Masqué · en bas de la liste',
    unhiddenToast: 'Réaffiché', hiddenHint: 'Exercices que tu as masqués. Touche « Réafficher » pour les remettre dans la liste.',
    // Réglage d'une série
    weightHint: 'Poids · touche une plaque', reps: 'Répétitions', repPlus: 'Une répétition de plus', repMinus: 'Une répétition de moins',
    lastTime: 'La dernière fois ({when}) : {what}', firstTimeEx: 'Première fois sur cet exercice.', firstTime: 'Première fois !',
    validateSet: 'Valider la série', deleteSet: 'Supprimer cette série', modified: 'Modifié', saved: 'Enregistré',
    setDeleted: 'Série supprimée', planned: 'prévue', addSet: 'Ajouter une série', note: 'Commentaire',
    notePh: 'Ressenti, réglage, à montrer au coach…', deleteExercise: 'Supprimer cet exercice',
    confirmDelete: 'Supprimer « {name} » de cette séance ?', deleted: 'Supprimé',
    durationMin: 'Durée (minutes)', durationAria: 'Durée en minutes', distanceKm: 'Distance (km, facultatif)',
    distanceAria: 'Distance en kilomètres', noteOptional: 'Commentaire (facultatif)', done: 'C’est fait',
    // Suivi
    sessionsStacked_one: '{n} séance, empilée', sessionsStacked_other: '{n} séances, empilées', noSessionMonth: 'Pas encore de séance ce mois-ci',
    trackHint: 'Une plaque par séance, une colonne par semaine (en vert : cette semaine). Objectif : {goal} par semaine, en pointillés.',
    byExercise: 'Par exercice', thisWeek: 'Cette semaine', weekOf: 'Semaine du {date}',
    workouts_one: '{n} séance', workouts_other: '{n} séances', noWorkout: 'aucune séance', workoutMark: ' : séance',
    prevMonth: 'Mois précédent', nextMonth: 'Mois suivant', dow: 'LMMJVSD',
    daysSport_one: '{n} jour de sport', daysSport_other: '{n} jours de sport', daysRest: '{n} sans sport',
    tapDay: 'Touche un jour pour voir ce que tu as fait.', viewEdit: 'Voir ou modifier la séance',
    noSportDay: 'Pas de sport ce jour-là.', addThatDay: 'Ajouter une séance ce jour-là',
    maxLoad: 'Charge max (kg)', totalReps: 'Répétitions au total', repsUnit: '{v} rép.',
    times_one: '{n} fois · {when}', times_other: '{n} fois · {when}',
    emptyExercises: 'Tes exercices apparaîtront ici après ta première séance.',
    storyUp: 'De {a} à <b class="accent">{b}</b> depuis le {date}.', storyDown: 'De {a} à {b} depuis le {date}.',
    storyFlat: 'Stable à {b} depuis le {date}.', curveLater: 'La courbe apparaîtra à partir de 2 séances.',
    // Mon compte
    demoMenu: 'Mode démo : les données sont factices et restent sur cet appareil.', weeklyGoal: 'Objectif par semaine',
    resetDemo: 'Réinitialiser la démo', logout: 'Se déconnecter', language: 'Langue',
    // Dates et résumés
    today: 'aujourd’hui', yesterday: 'hier', daysAgo: 'il y a {n} jours', onDate: 'le {date}',
    didIt: 'Fait', notStarted: 'Pas encore commencé',
    // Types et catégories
    kind_sets: 'Muscu', kindHint_sets: 'séries, répétitions, poids', kind_cardio: 'Cardio', kindHint_cardio: 'durée, vitesse, inclinaison, allers-retours…',
    kind_time: 'Cours / étirement', kindHint_time: 'durée',
    g_upper: 'Haut du corps', g_lower: 'Jambes & fessiers', g_core: 'Abdos & gainage', g_cardio: 'Cardio',
    g_class: 'Cours & étirements', g_custom: 'Mes exercices',
  },
  en: {
    locale: 'en-GB', close: 'Close', save: 'Save', minus: 'Less', plus: 'More',
    authSub: 'Log your workouts, track your consistency', tabLogin: 'Log in', tabRegister: 'Sign up',
    email: 'Email', emailPh: 'you@email.com', password: 'Password', passwordPh: 'At least 6 characters',
    login: 'Log in', createAccount: 'Create my account', forgot: 'Forgot password?',
    demoAuth: 'Demo mode: any email and password work. Workouts are fake and stay on this device.',
    forgotNeedEmail: 'Type your email above, then tap “Forgot password?” again.',
    resetSent: 'Email sent! Check your inbox (and spam).',
    'auth/invalid-email': 'Invalid email address.', 'auth/missing-password': 'Missing password.',
    'auth/weak-password': 'Password too short (at least 6 characters).',
    'auth/email-already-in-use': 'An account already exists with this email. Log in instead.',
    'auth/invalid-credential': 'Wrong email or password.', 'auth/wrong-password': 'Wrong email or password.',
    'auth/user-not-found': 'No account with this email.', 'auth/too-many-requests': 'Too many attempts. Try again in a few minutes.',
    'auth/network-request-failed': 'No internet connection.',
    'auth/operation-not-allowed': 'Email sign-in is not enabled in Firebase (Authentication > Email/Password).',
    authDefault: 'Something went wrong. Please try again.', serverRefused: 'The server refused to save',
    offline: 'Offline · saved on this phone', navToday: 'Workout', navTrack: 'Progress', account: 'My account',
    todayTitle: 'Today’s workout', dayTitle: 'Workout of {date}', otherDay: 'Other day', otherDayAria: 'Pick another day',
    noSportToday: 'No workout yet today.', noSessionDay: 'No workout that day.',
    lastSession: 'Last workout {when}.', firstSession: 'Your first workout starts here.', weekProgress: 'This week: {n} of {goal}.',
    startSession: 'Start my workout', addExercise: 'Add an exercise', addAnother: 'Add another exercise',
    nextExercise: 'Next exercise', backToday: 'Back to today', favorites: 'Favorites',
    exercises_one: '{n} exercise', exercises_other: '{n} exercises', sets_one: '{n} set', sets_other: '{n} sets',
    cardioMin: '{n} min of cardio / classes', plannedSets_one: '{n} set planned', plannedSets_other: '{n} sets planned',
    currentAria: 'Current exercise', setOf: 'Set {i} of {n}', changeNumbers: 'Change this set',
    noWeight: 'bodyweight', plateNone: 'None', plateNoneAria: 'No weight', kilos: '{w} kilos', stackAria: 'Weight stack',
    setDone: 'Set done', addSetShort: '+ set', validateAll: 'Mark all done', stopHere: 'Stop here',
    exerciseDone: 'Exercise done', setNDone: 'Set {n} done', addedFav: 'Added to favorites', removedFav: 'Removed from favorites',
    whichExercise: 'Which exercise?', search: 'Search…', searchAria: 'Search exercises', categories: 'Categories',
    f_recent: 'Recent', f_all: 'All', favOn: 'Remove from favorites', favOff: 'Add to favorites',
    noMatch: 'No exercise matches “{q}”.', createQ: 'Create “{q}”', createExercise: 'Create an exercise',
    noFavs: 'No favorites yet. Tap the star {star} next to an exercise to find it here, and as a shortcut on the Workout screen.',
    newExercise: 'New exercise', name: 'Name', namePh: 'e.g. Shoulder press', whatToLog: 'What you want to log',
    categoryHint: 'Category (to find it in the filters)', createStart: 'Create and start', createAnyway: 'Create anyway',
    existsAlready: 'This exercise already exists:', maybeExists: 'It may already exist:', use: 'Use',
    confirmCreate: 'If it really is a different exercise, tap “Create anyway”.', existsToast: 'This exercise already exists',
    created: '“{name}” created',
    hide: 'Hide', unhide: 'Show again', hiddenSection: 'Hidden ({n})', hiddenToast: 'Hidden · moved to the bottom of the list',
    unhiddenToast: 'Shown again', hiddenHint: 'Exercises you have hidden. Tap “Show again” to put them back in the list.',
    weightHint: 'Weight · tap a plate', reps: 'Reps', repPlus: 'One more rep', repMinus: 'One less rep',
    lastTime: 'Last time ({when}): {what}', firstTimeEx: 'First time on this exercise.', firstTime: 'First time!',
    validateSet: 'Log this set', deleteSet: 'Delete this set', modified: 'Updated', saved: 'Saved',
    setDeleted: 'Set deleted', planned: 'planned', addSet: 'Add a set', note: 'Comment',
    notePh: 'How it felt, settings, to show your coach…', deleteExercise: 'Delete this exercise',
    confirmDelete: 'Remove “{name}” from this workout?', deleted: 'Deleted',
    durationMin: 'Duration (minutes)', durationAria: 'Duration in minutes', distanceKm: 'Distance (km, optional)',
    distanceAria: 'Distance in kilometres', noteOptional: 'Comment (optional)', done: 'Done',
    sessionsStacked_one: '{n} workout, stacked', sessionsStacked_other: '{n} workouts, stacked', noSessionMonth: 'No workout yet this month',
    trackHint: 'One plate per workout, one column per week (green: this week). Goal: {goal} per week, dotted.',
    byExercise: 'By exercise', thisWeek: 'This week', weekOf: 'Week of {date}',
    workouts_one: '{n} workout', workouts_other: '{n} workouts', noWorkout: 'no workout', workoutMark: ': workout',
    prevMonth: 'Previous month', nextMonth: 'Next month', dow: 'MTWTFSS',
    daysSport_one: '{n} active day', daysSport_other: '{n} active days', daysRest: '{n} rest',
    tapDay: 'Tap a day to see what you did.', viewEdit: 'View or edit the workout',
    noSportDay: 'No sport that day.', addThatDay: 'Add a workout on that day',
    maxLoad: 'Max load (kg)', totalReps: 'Total reps', repsUnit: '{v} reps',
    times_one: '{n} time · {when}', times_other: '{n} times · {when}',
    emptyExercises: 'Your exercises will show up here after your first workout.',
    storyUp: 'From {a} to <b class="accent">{b}</b> since {date}.', storyDown: 'From {a} to {b} since {date}.',
    storyFlat: 'Steady at {b} since {date}.', curveLater: 'The chart will appear after 2 workouts.',
    demoMenu: 'Demo mode: data is fake and stays on this device.', weeklyGoal: 'Weekly goal',
    resetDemo: 'Reset demo', logout: 'Log out', language: 'Language',
    today: 'today', yesterday: 'yesterday', daysAgo: '{n} days ago', onDate: 'on {date}',
    didIt: 'Done', notStarted: 'Not started yet',
    kind_sets: 'Strength', kindHint_sets: 'sets, reps, weight', kind_cardio: 'Cardio', kindHint_cardio: 'duration, speed, incline, laps…',
    kind_time: 'Class / stretching', kindHint_time: 'duration',
    g_upper: 'Upper body', g_lower: 'Legs & glutes', g_core: 'Core', g_cardio: 'Cardio',
    g_class: 'Classes & stretching', g_custom: 'My exercises',
  },
};

// ===== Textes des champs détaillés, des réglages de muscu et des muscles =====
Object.assign(I18N.fr, {
  fld_duration: 'Durée (minutes)', fld_distance: 'Distance (km)', fld_speed: 'Vitesse (km/h)', fld_incline: 'Inclinaison (%)',
  fld_level: 'Résistance (niveau de la machine)', fld_rpe: 'Intensité ressentie (1 à 10)', fld_laps: 'Allers-retours',
  fld_carry: 'Poids porté (kg dans chaque main)', fld_floors: 'Étages / marches', fld_track: 'Piste',
  fs_duration: 'Durée', fs_distance: 'Distance', fs_speed: 'Vitesse', fs_incline: 'Inclinaison', fs_level: 'Résistance',
  fs_rpe: 'Intensité', fs_laps: 'Allers-retours', fs_carry: 'Poids porté', fs_floors: 'Étages', fs_track: 'Piste',
  sum_duration: '{v} min', sum_distance: '{v} km', sum_speed: '{v} km/h', sum_incline: 'pente {v} %', sum_level: 'niveau {v}',
  sum_rpe: 'intensité {v}/10', sum_carry: '{v} kg × 2', sum_laps_one: '{v} aller-retour', sum_laps_other: '{v} allers-retours',
  sum_floors_one: '{v} étage', sum_floors_other: '{v} étages',
  carryTotal: 'soit {v} kg au total', rpeHint: '1 = très facile · 10 = à fond', fieldAria: '{f}',
  addInfo: 'Ajouter une info', addInfoHint: 'Elle te sera proposée les prochaines fois pour cet exercice.',
  noTrack: 'Enregistre ta piste une fois, ensuite il suffit de la choisir.', newTrack: 'Nouvelle piste',
  trackName: 'Nom de la piste', trackNamePh: 'ex. Piste du parc', trackLength: 'Longueur d’un aller (mètres, facultatif)',
  trackLengthHint: 'Avec la longueur, l’appli calcule la distance parcourue.', trackAdd: 'Ajouter la piste', trackLen: '{v} m',
  lapsTitle: 'Allers-retours',
  // Poids précis
  weightExact: 'Poids exact', stepLabel: 'Pas des boutons', weightAria: 'Poids en kilos',
  // Réglages de muscu
  setup: 'Réglages', setupHint: 'Gardés pour la prochaine fois.', machine: 'Machine', dumbbells: 'Avec haltères',
  position: 'Position', pos_standing: 'Debout', pos_seated: 'Position assise', pos_supine: 'Sur le dos', pos_prone: 'Sur le ventre',
  bench: 'Banc', bench_flat: 'Plat', bench_incline: 'Incliné', bench_decline: 'Décliné', benchAngle: 'Angle du banc (degrés)',
  benchHint: 'Incliné : la tête plus haute que les hanches. Décliné : l’inverse, le banc penche vers l’arrière et la tête est plus basse que les hanches.',
  benchSum: 'banc {b}', move: 'Mouvement', addMove: 'Autre mouvement', movePh: 'Décris le mouvement', moveAdd: 'Ajouter',
  moveAddHint: 'Il te sera proposé les prochaines fois pour cet exercice.',
  mv_unilateral: 'Un bras à la fois', mv_wide: 'Prise large', mv_narrow: 'Prise serrée', mv_straight: 'Bras tendus',
  mv_overhead: 'Bras à la verticale, redescendus derrière la tête',
  target: 'Muscle que je veux travailler', targetSum: 'cible : {m}',
  worksMost: 'Cet exercice travaille surtout : {p}.', worksAlso: 'Un peu aussi : {s}.', worksUnknown: 'Choisis les muscles travaillés en créant l’exercice pour les voir ici.',
  lastShort: 'Dernière fois : {what}', comment: 'Commentaire', alsoLittle: 'un peu',
  goalsTitle: 'Mes objectifs par muscle', goalUp: 'À développer', goalDown: 'À ménager', f_goals: 'Mes objectifs',
  goalsHint: 'À développer : le filtre « Mes objectifs » te propose d’abord les exercices qui les travaillent. À ménager : ils s’affichent en orange sur les pictos, avec un avertissement sur les exercices qui les sollicitent.',
  goalsFilterHint: 'Exercices qui travaillent tes muscles à développer, en ménageant les autres. Les mieux adaptés en premier.',
  goalWarnMain: 'Sollicite surtout : {m} (à ménager)', goalBadge: 'Objectif : {m}', pseudo: 'Pseudo', pseudoPh: 'Ajoute ton prénom', pseudoSaved: 'Pseudo : {p}', pseudoRemoved: 'Pseudo retiré', details: 'Précisions', addedEx: '« {name} » ajouté', undo: 'Annuler', removeEx: 'Retirer cet exercice', removedEx: 'Exercice retiré',
  muscleOpenAria: 'Voir les exercices pour : {m}', muscleWeekUp: 'Cette semaine : {n} séries ciblées sur {target} (repère pour le développer).',
  muscleWeekN: 'Cette semaine : {n} séries ciblées.', muscleMain: 'Le ciblent', muscleHelp: 'L’aident aussi',
  muscleNone: 'Aucun exercice de la liste ne travaille ce muscle.', neverDone: 'Jamais fait', addToSession: 'Ajouter à ma séance', goalWarnSec: 'Sollicite un peu : {m} (à ménager)',
  goalsSumUp: 'À développer : {m}', goalsSumDown: 'à ménager : {m}',
  colWeight: 'Poids (kg)', colReps: 'Rép.', addSetBtn: 'Série', finishEx: 'Terminer',
  setCheckAria: 'Valider la série {n}', setUndoAria: 'Série {n} faite : toucher pour annuler',
  tipsLink: 'Conseils', tipsAria: 'Voir les conseils pour bien faire le mouvement', tipsEyebrow: 'Bien faire',
  tipsDo: 'À faire', tipsDont: 'À éviter', tipsGoal: 'Pour tes objectifs', back: 'Retour',
  tipsNone: 'Pas de conseils pour cet exercice : l’appli n’affiche que des conseils issus de sources sûres, et aucune n’a été trouvée pour celui-ci.',
  source: 'Source', sources: 'Sources', exNotes: 'Mes notes', exNotesPh: 'Réglage de la machine, charge, sensations…',
  exNotesHint: 'Gardées pour toutes tes séances de cet exercice.',
  musclesWeek: 'Muscles cette semaine', musclesWeekHint: 'Séries faites depuis lundi : ciblées (le muscle principal de l’exercice), et en gris « + » celles où il a aidé. Touche un muscle pour voir ses exercices.',
  setsShort_one: '{n} série', setsShort_other: '{n} séries',
  musclesEmpty: 'Pas encore de séries de muscu cette semaine.', musclesSetGoals: 'Choisir mes objectifs par muscle',
  musclesSrc: 'Repères pour développer un muscle : au moins {n} séries ciblées et {d} séances par semaine (trait vertical).',
  alertNever: '{m} : pas encore travaillé.', alertNotSince: '{m} : rien cette semaine, dernière fois {when}.',
  alertOnce: '{m} : une seule séance cette semaine (repère : 2).', alertSpare: '{m} (à ménager) : {n} séries ciblées cette semaine.',
  progressTip: 'La dernière fois, à {w} kg, tu as dépassé tes {r} répétitions prévues à chaque série. Tu peux augmenter de 2 à 10 % : entre {lo} et {hi} kg.',
  progressApply: 'Passer à {w} kg', progressApplied: 'Séries prévues à {w} kg',
  myExercises: 'Mes exercices créés', myExercisesHint: 'Rattache-les à un exercice de la liste pour avoir le picto, les muscles, les conseils et les avertissements. Ton historique est gardé.',
  myExercisesEmpty: 'Tu n’as pas encore créé d’exercice.', noMuscles: 'Muscles non renseignés', looksLike: 'Ressemble à :',
  attachTo: 'Rattacher à « {name} »', attachOther: 'Choisir un autre', attachPick: 'Rattacher à un exercice de la liste',
  editMuscles: 'Muscles', attachConfirm: 'Rattacher « {a} » à « {b} » ? Ses {n} séances passeront sous « {b} » et « {a} » sera supprimé.',
  attached: 'Rattaché à « {name} »', autoAttached_one: '{n} ancien exercice rattaché à la liste', autoAttached_other: '{n} anciens exercices rattachés à la liste',
  // Créer
  fieldsToLog: 'Infos à noter', musclesWorked: 'Muscles travaillés (facultatif)',
  variant: 'Créer une variante', variantName: '{name} (variante)', variantOf: 'Variante de « {name} » : même type et mêmes infos à noter, historique à part.',
  // Muscles
  m_pecs: 'Pectoraux', m_lats: 'Grand dorsal (dos)', m_upperback: 'Haut du dos (entre les omoplates)', m_traps: 'Trapèzes (haut, vers le cou)', m_shoulders: 'Épaules',
  m_biceps: 'Biceps', m_triceps: 'Triceps', m_forearms: 'Avant-bras', m_hipflexors: 'Fléchisseurs de hanche (psoas)', m_abs: 'Abdos', m_obliques: 'Obliques', m_lowerback: 'Lombaires',
  m_glutes: 'Fessiers', m_quads: 'Quadriceps', m_hams: 'Ischio-jambiers', m_adductors: 'Adducteurs (intérieur cuisses)',
  m_abductors: 'Abducteurs (extérieur cuisses)', m_calves: 'Mollets',
});
Object.assign(I18N.en, {
  fld_duration: 'Duration (minutes)', fld_distance: 'Distance (km)', fld_speed: 'Speed (km/h)', fld_incline: 'Incline (%)',
  fld_level: 'Resistance (machine level)', fld_rpe: 'Perceived intensity (1 to 10)', fld_laps: 'Laps (there and back)',
  fld_carry: 'Weight carried (kg in each hand)', fld_floors: 'Floors / steps', fld_track: 'Track',
  fs_duration: 'Duration', fs_distance: 'Distance', fs_speed: 'Speed', fs_incline: 'Incline', fs_level: 'Resistance',
  fs_rpe: 'Intensity', fs_laps: 'Laps', fs_carry: 'Weight carried', fs_floors: 'Floors', fs_track: 'Track',
  sum_duration: '{v} min', sum_distance: '{v} km', sum_speed: '{v} km/h', sum_incline: '{v}% incline', sum_level: 'level {v}',
  sum_rpe: 'intensity {v}/10', sum_carry: '{v} kg × 2', sum_laps_one: '{v} lap', sum_laps_other: '{v} laps',
  sum_floors_one: '{v} floor', sum_floors_other: '{v} floors',
  carryTotal: '{v} kg in total', rpeHint: '1 = very easy · 10 = all out', fieldAria: '{f}',
  addInfo: 'Add a detail', addInfoHint: 'It will be offered next time for this exercise.',
  noTrack: 'Save your track once, then just pick it.', newTrack: 'New track',
  trackName: 'Track name', trackNamePh: 'e.g. Park track', trackLength: 'One-way length (metres, optional)',
  trackLengthHint: 'With the length, the app works out the distance covered.', trackAdd: 'Add track', trackLen: '{v} m',
  lapsTitle: 'Laps',
  weightExact: 'Exact weight', stepLabel: 'Button step', weightAria: 'Weight in kilos',
  setup: 'Setup', setupHint: 'Kept for next time.', machine: 'Machine', dumbbells: 'With dumbbells',
  position: 'Position', pos_standing: 'Standing', pos_seated: 'Seated', pos_supine: 'Lying on your back', pos_prone: 'Lying face down',
  bench: 'Bench', bench_flat: 'Flat', bench_incline: 'Incline', bench_decline: 'Decline', benchAngle: 'Bench angle (degrees)',
  benchHint: 'Incline: head higher than hips. Decline: the opposite, the bench tilts back and your head is lower than your hips.',
  benchSum: '{b} bench', move: 'Movement', addMove: 'Other movement', movePh: 'Describe the movement', moveAdd: 'Add',
  moveAddHint: 'It will be offered next time for this exercise.',
  mv_unilateral: 'One arm at a time', mv_wide: 'Wide grip', mv_narrow: 'Narrow grip', mv_straight: 'Straight arms',
  mv_overhead: 'Arms vertical, lowered behind the head',
  target: 'Muscle I want to work', targetSum: 'target: {m}',
  worksMost: 'This exercise mainly works: {p}.', worksAlso: 'Also a little: {s}.', worksUnknown: 'Pick the muscles worked when creating the exercise to see them here.',
  lastShort: 'Last time: {what}', comment: 'Comment', alsoLittle: 'a little',
  goalsTitle: 'My goals per muscle', goalUp: 'Develop', goalDown: 'Go easy', f_goals: 'My goals',
  goalsHint: 'Develop: the “My goals” filter shows exercises that work these muscles first. Go easy: they show in orange on the pictures, with a warning on exercises that work them.',
  goalsFilterHint: 'Exercises that work the muscles you want to develop while sparing the others. Best matches first.',
  goalWarnMain: 'Mainly works: {m} (go easy)', goalBadge: 'Goal: {m}', pseudo: 'Nickname', pseudoPh: 'Add your name', pseudoSaved: 'Nickname: {p}', pseudoRemoved: 'Nickname removed', details: 'Details', addedEx: '“{name}” added', undo: 'Undo', removeEx: 'Remove this exercise', removedEx: 'Exercise removed',
  muscleOpenAria: 'See exercises for: {m}', muscleWeekUp: 'This week: {n} targeted sets out of {target} (benchmark to develop it).',
  muscleWeekN: 'This week: {n} targeted sets.', muscleMain: 'Target it', muscleHelp: 'Also help',
  muscleNone: 'No exercise in the list works this muscle.', neverDone: 'Never done', addToSession: 'Add to my workout', goalWarnSec: 'Also works a little: {m} (go easy)',
  goalsSumUp: 'Develop: {m}', goalsSumDown: 'go easy: {m}',
  colWeight: 'Weight (kg)', colReps: 'Reps', addSetBtn: 'Set', finishEx: 'Finish',
  setCheckAria: 'Log set {n}', setUndoAria: 'Set {n} done: tap to undo',
  tipsLink: 'Tips', tipsAria: 'See tips to do the movement well', tipsEyebrow: 'Good form',
  tipsDo: 'Do', tipsDont: 'Avoid', tipsGoal: 'For your goals', back: 'Back',
  tipsNone: 'No tips for this exercise: the app only shows tips from reliable sources, and none was found for this one.',
  source: 'Source', sources: 'Sources', exNotes: 'My notes', exNotesPh: 'Machine settings, load, how it feels…',
  exNotesHint: 'Kept for all your sessions of this exercise.',
  musclesWeek: 'Muscles this week', musclesWeekHint: 'Sets done since Monday: targeted (the exercise’s main muscle), and in grey “+” the ones where it helped. Tap a muscle to see its exercises.',
  setsShort_one: '{n} set', setsShort_other: '{n} sets',
  musclesEmpty: 'No strength sets yet this week.', musclesSetGoals: 'Choose my goals per muscle',
  musclesSrc: 'Benchmarks to develop a muscle: at least {n} targeted sets and {d} sessions per week (vertical line).',
  alertNever: '{m}: not trained yet.', alertNotSince: '{m}: nothing this week, last trained {when}.',
  alertOnce: '{m}: only one session this week (benchmark: 2).', alertSpare: '{m} (go easy): {n} targeted sets this week.',
  progressTip: 'Last time, at {w} kg, you beat your {r} planned reps on every set. You can add 2 to 10%: between {lo} and {hi} kg.',
  progressApply: 'Switch to {w} kg', progressApplied: 'Planned sets at {w} kg',
  myExercises: 'My custom exercises', myExercisesHint: 'Link them to an exercise from the list to get the picture, muscles, tips and warnings. Your history is kept.',
  myExercisesEmpty: 'You haven’t created any exercise yet.', noMuscles: 'Muscles not set', looksLike: 'Looks like:',
  attachTo: 'Link to “{name}”', attachOther: 'Pick another', attachPick: 'Link to an exercise from the list',
  editMuscles: 'Muscles', attachConfirm: 'Link “{a}” to “{b}”? Its {n} sessions will move under “{b}” and “{a}” will be deleted.',
  attached: 'Linked to “{name}”', autoAttached_one: '{n} old exercise linked to the list', autoAttached_other: '{n} old exercises linked to the list',
  fieldsToLog: 'Details to log', musclesWorked: 'Muscles worked (optional)',
  variant: 'Create a variant', variantName: '{name} (variant)', variantOf: 'Variant of “{name}”: same type and details, separate history.',
  m_pecs: 'Chest', m_lats: 'Lats (back)', m_upperback: 'Upper back (between shoulder blades)', m_traps: 'Upper traps (neck)', m_shoulders: 'Shoulders',
  m_biceps: 'Biceps', m_triceps: 'Triceps', m_forearms: 'Forearms', m_hipflexors: 'Hip flexors', m_abs: 'Abs', m_obliques: 'Obliques', m_lowerback: 'Lower back',
  m_glutes: 'Glutes', m_quads: 'Quads', m_hams: 'Hamstrings', m_adductors: 'Adductors (inner thighs)',
  m_abductors: 'Abductors (outer thighs)', m_calves: 'Calves',
});

const LANG_KEY = 'fitcoach-lang';
let currentLang = 'fr';
try {
  // ?lang=en ou ?lang=fr dans l'adresse force la langue (et la mémorise)
  const urlLang = new URLSearchParams(location.search).get('lang');
  if (urlLang === 'en' || urlLang === 'fr') localStorage.setItem(LANG_KEY, urlLang);
  const saved = localStorage.getItem(LANG_KEY);
  currentLang = saved === 'en' || saved === 'fr' ? saved
    : ((navigator.language || 'fr').toLowerCase().startsWith('fr') ? 'fr' : 'en');
} catch (e) {}

function t(key, params) {
  let str = I18N[currentLang][key] ?? I18N.fr[key] ?? key;
  if (params) Object.entries(params).forEach(([k, v]) => { str = str.split(`{${k}}`).join(v); });
  return str;
}
// Pluriel : en français 0 et 1 sont au singulier, en anglais seul 1 l'est
function tn(key, n, params) {
  const one = currentLang === 'fr' ? n <= 1 : n === 1;
  return t(key + (one ? '_one' : '_other'), { n, ...params });
}
const locale = () => t('locale');

// Textes fixes de la page (attributs data-i18n)
function applyTranslations() {
  document.documentElement.lang = currentLang;
  document.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = t(el.dataset.i18n); });
  document.querySelectorAll('[data-i18n-ph]').forEach(el => { el.placeholder = t(el.dataset.i18nPh); });
  document.querySelectorAll('[data-i18n-aria]').forEach(el => { el.setAttribute('aria-label', t(el.dataset.i18nAria)); });
  const sw = document.getElementById('auth-lang');
  if (sw) sw.innerHTML = langSwitchHtml();
}

// Sélecteur « FR | EN » : les deux langues toujours visibles, la langue active surlignée
function langSwitchHtml() {
  return `<div class="seg" role="radiogroup" aria-label="${t('language')}">${['fr', 'en'].map(l =>
    `<button class="${l === currentLang ? 'active' : ''}" role="radio" aria-checked="${l === currentLang}" onclick="setLanguage('${l}')">${l.toUpperCase()}</button>`).join('')}</div>`;
}
function setLanguage(lang) {
  if (lang === currentLang) return;
  toggleLanguage();
}

function toggleLanguage() {
  currentLang = currentLang === 'fr' ? 'en' : 'fr';
  try { localStorage.setItem(LANG_KEY, currentLang); } catch (e) {}
  applyTranslations();
  if (typeof switchAuth === 'function') switchAuth(authMode);
  if (Data.user) {
    render();
    if (!$('#sheet').classList.contains('hidden')) openMenu();
  }
}
