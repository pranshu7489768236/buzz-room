# Buzz Room

A live, multiplayer trivia game anyone can join with a 4-letter room code —
no accounts, no installs. One person hosts, others join from their phone or
laptop, and everyone's screen stays in sync in real time: questions,
countdown timer, answer reveals, and a running leaderboard.

## How it works
- Host creates a room and gets a shareable room code
- Players join from any device by entering the code and their name
- The host starts the game; questions and results sync live to every player
- Speed-based scoring rewards faster correct answers
- Final leaderboard shows the winner at the end

## Tech
- Single-page vanilla HTML/CSS/JS, no build step
- Real-time state sync for room, players, questions, and answers

## Running locally
This is a static site — open with any static file server (e.g. VS Code's
Live Server extension, or `python -m http.server`). Note: the multiplayer
sync itself depends on a runtime API only available on the published,
hosted version of this project — locally you'll see the full UI, but
hosting/joining a room won't sync between devices.
