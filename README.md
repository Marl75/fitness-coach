# Routine

(anciennement FitCoach — l'adresse reste marl75.github.io/fitness-coach)

Petite appli (PWA) pour noter ses séances de sport et suivre sa régularité.

- **Séance** : on ajoute les exercices au fil de la séance ; l'appli propose ce qui a été fait la dernière fois.
- **Suivi** : calendrier des jours avec et sans sport, séances par semaine, progression par exercice.

Données : Firebase (Authentication e-mail/mot de passe + Firestore), configuration dans `js/config.js`,
règles de sécurité dans `firestore.rules`. Sans configuration (ou avec `?demo` dans l'adresse),
l'appli tourne en mode démo avec des données factices gardées dans le navigateur.
