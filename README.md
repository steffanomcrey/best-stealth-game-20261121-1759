[![make.fun](https://make.fun/badge/best-stealth-game-20261121-1759.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759?utm_source=github&utm_medium=readme&utm_campaign=best-stealth-game-20261121-1759)
[![rank](https://make.fun/badge/best-stealth-game-20261121-1759/steffanomcrey/best-stealth-game-20261121-1759/rank.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-stealth-game-20261121-1759)
[![reward](https://make.fun/badge/best-stealth-game-20261121-1759/steffanomcrey/best-stealth-game-20261121-1759/reward.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759?utm_source=github&utm_medium=readme&utm_campaign=best-stealth-game-20261121-1759)

# Night Ink: The Quiet Gallery

A top-down stealth game for the make.fun best-stealth-game bounty. You are an ink thief
in a night gallery. Steal every ink page in each of three wings, stay out of the guards'
lantern vision cones (walls and crates block their sight), and slip out the EXIT unseen.

- 3 levels, 3/4/5 patrolling guards with waypoint patrols you can learn
- Vision cones raycast against walls and cover; a "?" guard is suspicious, "!" is chasing
- Detection meter fills while seen (faster in lamplight, slower while sneaking) and drains
  while hidden, twice as fast in a shadow pool, so a glimpse is a warning, not a fail
- Sneak with Shift (slow, quiet, smaller detection radius); run with R (fast, loud, guards hear it)
- Locked doors open when every page is taken; the exit only opens then too
- WebAudio footsteps and alert stings generated in code, no audio files
- WASD/arrows or click-to-move, minimap with guard facing arrows, title/win/caught screens

## Run it

```
node serve.ts
```

Then open http://localhost:8080. Or open `game/index.html` directly in a browser.

## Screenshots

`?shot=start|play|alert|end&seed=1` stages real renders of the game code: title over
level 1, mid-level play, a near-miss alert, and the win screen.

## Layout

- `game/src/config.js` — tuning numbers and colours
- `game/src/levels.js` — the three wings as ASCII maps, parsed into walls/cover/shadow
- `game/src/vision.js` — line of sight and cone tests
- `game/src/guards.js` — patrol / investigate / chase behaviour
- `game/src/player.js` — movement, sneak/run, noise radius
- `game/src/audio.js` — WebAudio footsteps and stings
- `game/src/input.js` — keyboard and click-to-move
- `game/src/render.js` — canvas drawing, HUD, minimap, screens
- `game/src/shots.js` — screenshot scene staging with a real-rules autopilot
- `game/src/main.js` — boot, loop, detection and level flow
- `main.ts` — Node 22 stdlib-only entrypoint: copies game/ and screenshots/, writes dossier.json
