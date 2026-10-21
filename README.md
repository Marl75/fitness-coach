# Routine

**Live app: [marl75.github.io/fitness-coach](https://marl75.github.io/fitness-coach/)** · available in English and French

**Try it without an account: [demo](https://marl75.github.io/fitness-coach/?demo&lang=en)** (opens straight into a sample account with 12 weeks of workouts, goals and routines; kept in your browser, refreshed every day, nothing is sent). French: [démo](https://marl75.github.io/fitness-coach/?demo&lang=fr)

<img src="screenshots/progress.png" alt="Routine progress screen, demo mode" width="280">

(Formerly FitCoach; the address is unchanged.)

A small progressive web app to log workouts and keep track of your consistency.

## Features

- **Routines**: save any workout as a routine and start it in one tap from the start screen ("What are we doing today?")
- **Workout**: add exercises as you go; everything is pre-filled from last time, strength and cardio alike (cardio becomes the current card with its own steppers)
- **Getting started**: a short, skippable introduction for new accounts (workouts per week, target muscles, first routine), then a "Getting started" card on the home screen until those settings are done or the card is closed
- **Settings tab**: weekly goal, goals per muscle, routines, custom exercises and language in one place; the account icon only holds the account
- **Sets table**: one row per set (weight, reps, check); the current set has its own − / + for reps, so a shorter last set takes two taps; tapping a number opens two matching counters for weight and reps, each showing last time's value
- **Finishing an exercise**: checking the last set keeps the exercise open, with "One more" and "Finish exercise"
- **Details per exercise**: speed and incline for incline walking, resistance and intensity for the bike, laps on a saved track with the weight carried in each hand… plus a comment; any extra detail can be added and is remembered
- **Strength setup**: machine or not, dumbbells, position, bench (flat, incline, decline and angle), movement (your own options are remembered) and the muscle you want to work, next to the muscles the exercise really works
- **Everything from last time is pre-filled**: weights, reps, setup, speed, incline, track…
- **A picture for every exercise**: a line figure doing the movement, with the muscles it works highlighted in green (custom exercises get a generic figure with the muscles you chose)
- **Goals per muscle**: mark muscles to develop or to go easy on (e.g. upper traps); muscles to go easy on show in orange with a warning, and a “My goals” filter lists the best-matching exercises first
- **Good form tips** for each exercise (do / avoid, plus a tip for your muscle goals), only from reliable sources cited on the card (ExRx.net, Concept2, NSCA, studies), and personal notes kept across sessions
- **Progress dashboard**: workouts, cardio minutes (against 150 a week, WHO) and goal streak at the top; every muscle as a colour-coded pill for the days it was worked this week (strength, cardio and core alike) against the benchmark of 2 days a week (ACSM 2026), with alerts; the last 8 weeks; recent exercises with a mini curve and their change
- **Rep targets and progression**: set a rep range per exercise (e.g. 8 to 12); when you reach the top on every set, the app suggests adding 2 to 10% (ACSM 2009) in one line, applied with one tap
- **My custom exercises**: link them to an exercise from the list (history, favourites and notes move over) or set their muscles
- **Custom exercises and variants** with the details you choose; in French, catalogue exercises also show their English name
- **Exercise picker** with categories, favourites and duplicate detection; unused exercises can be hidden
- **Log another day** from a calendar showing the days you trained
- **Progress**: calendar of days with and without exercise, workouts per week against a goal, progress per exercise
- **Dark mode**

## Stack

- Plain HTML, CSS and JavaScript, no build step
- [Firebase](https://firebase.google.com/) Authentication (email and password) and Firestore; configuration in `js/config.js`, security rules in `firestore.rules`
- Language follows the browser; `?lang=en` or `?lang=fr` in the address forces it
- Without a configuration, or with `?demo` in the address, the app opens in demo mode on a sample account kept in the browser (`demoData()` in `js/data.js`); the login screen links to it, and `?signup` opens the sign-up tab

## Development

- **Code layout**: `js/core.js` (state, history, navigation, bottom sheet), one file per screen (`session.js`, `picker.js`, `entry.js`, `track.js`, `account.js`), shared modules (`exercises.js`, `pictos.js`, `tips.js`, `insights.js`, `routines.js`…) and `boot.js`, loaded last
- **Branches**: work happens on `dev`; `main` is what everyone uses
- **Test version**: `tools/publish-beta.sh` publishes `dev` to [marl75.github.io/fitness-coach/beta/](https://marl75.github.io/fitness-coach/beta/) without touching the main version; it runs on demo data unless `?real` is added
- **Regression test**: open the app with `?demo&smoke`; it goes through every screen and action and shows the result (demo data only)
- **Release**: `tools/release.sh` merges `dev` into `main` and bumps the version (`tools/bump-version.sh`) so phones reload the new files

