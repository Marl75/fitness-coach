// ===== LANGUE (FR / EN) =====
// Même principe que Ma Collection : langue du téléphone par défaut, bouton pour changer, choix mémorisé.
const I18N = {
  fr: {
    locale: 'fr-FR', langSwitch: 'English', close: 'Fermer', save: 'Enregistrer', minus: 'Moins', plus: 'Plus',
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
    setDeleted: 'Série supprimée', planned: 'prévue', addSet: 'Ajouter une série', note: 'Note',
    notePh: 'Réglage de la machine, ressenti…', deleteExercise: 'Supprimer cet exercice',
    confirmDelete: 'Supprimer « {name} » de cette séance ?', deleted: 'Supprimé',
    durationMin: 'Durée (minutes)', durationAria: 'Durée en minutes', distanceKm: 'Distance (km, facultatif)',
    distanceAria: 'Distance en kilomètres', noteOptional: 'Note (facultatif)', done: 'C’est fait',
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
    importOld: 'Importer l’ancienne FitCoach', resetDemo: 'Réinitialiser la démo', logout: 'Se déconnecter', language: 'Langue',
    // Dates et résumés
    today: 'aujourd’hui', yesterday: 'hier', daysAgo: 'il y a {n} jours', onDate: 'le {date}',
    didIt: 'Fait', notStarted: 'Pas encore commencé',
    // Import
    importTitle: 'Importer l’ancienne FitCoach',
    importHint: 'Choisis le fichier de sauvegarde (FitCoach-sauvegarde-….json). Les exercices déjà importés ne sont pas ajoutés deux fois.',
    unreadable: 'Ce fichier n’est pas lisible', noSessionsFile: 'Aucune séance trouvée dans ce fichier', whichProfile: 'Quel profil importer ?',
    unnamed: 'Sans nom', imported_one: '{n} exercice importé', imported_other: '{n} exercices importés', allImported: 'Tout était déjà importé',
    // Types et catégories
    kind_sets: 'Muscu', kindHint_sets: 'séries, répétitions, poids', kind_cardio: 'Cardio', kindHint_cardio: 'durée, distance',
    kind_time: 'Cours / étirement', kindHint_time: 'durée',
    g_upper: 'Haut du corps', g_lower: 'Jambes & fessiers', g_core: 'Abdos & gainage', g_cardio: 'Cardio',
    g_class: 'Cours & étirements', g_custom: 'Mes exercices',
  },
  en: {
    locale: 'en-GB', langSwitch: 'Français', close: 'Close', save: 'Save', minus: 'Less', plus: 'More',
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
    setDeleted: 'Set deleted', planned: 'planned', addSet: 'Add a set', note: 'Note',
    notePh: 'Machine settings, how it felt…', deleteExercise: 'Delete this exercise',
    confirmDelete: 'Remove “{name}” from this workout?', deleted: 'Deleted',
    durationMin: 'Duration (minutes)', durationAria: 'Duration in minutes', distanceKm: 'Distance (km, optional)',
    distanceAria: 'Distance in kilometres', noteOptional: 'Note (optional)', done: 'Done',
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
    importOld: 'Import old FitCoach', resetDemo: 'Reset demo', logout: 'Log out', language: 'Language',
    today: 'today', yesterday: 'yesterday', daysAgo: '{n} days ago', onDate: 'on {date}',
    didIt: 'Done', notStarted: 'Not started yet',
    importTitle: 'Import old FitCoach',
    importHint: 'Pick the backup file (FitCoach-sauvegarde-….json). Exercises already imported are not added twice.',
    unreadable: 'This file can’t be read', noSessionsFile: 'No workout found in this file', whichProfile: 'Which profile to import?',
    unnamed: 'No name', imported_one: '{n} exercise imported', imported_other: '{n} exercises imported', allImported: 'Everything was already imported',
    kind_sets: 'Strength', kindHint_sets: 'sets, reps, weight', kind_cardio: 'Cardio', kindHint_cardio: 'duration, distance',
    kind_time: 'Class / stretching', kindHint_time: 'duration',
    g_upper: 'Upper body', g_lower: 'Legs & glutes', g_core: 'Core', g_cardio: 'Cardio',
    g_class: 'Classes & stretching', g_custom: 'My exercises',
  },
};

const LANG_KEY = 'fitcoach-lang';
let currentLang = 'fr';
try {
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
