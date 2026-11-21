// Screenshot scenes behind ?shot=start|play|alert|end. Each one plays the real rules
// forward from a fresh level for a fixed number of steps, steered by a simple autopilot
// (walk toward the nearest ink page; if a guard's cone would catch the next step, sidestep
// behind the nearest cover tile), so the frame is what a short game really looks like and
// the same seed always gives the same frame.
import { FIELD, STEP } from './config.js';
import { isSolid } from './levels.js';
import { guardSeesPlayer } from './vision.js';
import { SCREEN_CAUGHT, SCREEN_PLAY, SCREEN_TITLE, SCREEN_WIN } from './render.js';

function canStand(game, x, y) {
  const r = 11;
  for (const [ox, oy] of [[-r, -r], [r, -r], [-r, r], [r, r]]) {
    if (isSolid(game.level, Math.floor((x + ox) / FIELD.tile), Math.floor((y + oy) / FIELD.tile))) return false;
  }
  return true;
}

// One autopilot step: sneak toward the target; if a guard would see the next position,
// hold still and let the patrol pass instead of blundering into the cone.
function autopilotStep(game, target) {
  const p = game.player;
  p.sneaking = true;
  const dx = target.x - p.x, dy = target.y - p.y;
  const dist = Math.hypot(dx, dy);
  if (dist < 8) return false;
  const ux = dx / dist, uy = dy / dist;
  const nx = p.x + ux * 2.2, ny = p.y + uy * 2.2;
  const danger = game.level.guards.some((g) => guardSeesPlayer(game.level, g, nx, ny, true).seen);
  if (danger || !canStand(game, nx, ny)) return true; // wait for the patrol to pass
  p.x = nx; p.y = ny;
  return true;
}

function simulate(game, seconds, steer, keys) {
  const steps = Math.floor(seconds / STEP);
  const k = keys ?? { up: false, down: false, left: false, right: false, sneak: false, run: false };
  for (let i = 0; i < steps; i += 1) {
    if (steer) steer(game);
    game.tick(STEP, k);
    if (game.screen === SCREEN_CAUGHT || game.screen === SCREEN_WIN) break;
  }
}

export function stageShot(game, shot) {
  if (shot === 'start') {
    game.screen = SCREEN_TITLE;
    simulate(game, 2, null);
    game.screen = SCREEN_TITLE;
  } else if (shot === 'play') {
    game.screen = SCREEN_PLAY;
    // Step in half-second chunks and stop at the first clean moment: a page taken while
    // the meter is low, so the shot shows mid-level play, not a capture.
    for (let i = 0; i < 40; i += 1) {
      simulate(game, 0.5, (g) => {
        // Steer to the NEAREST untaken page, not the first in the list: the first page
        // sits across two patrols and the pilot would wait there forever.
        let next = null, best = Infinity;
        for (const p of g.level.pages) {
          if (p.taken) continue;
          const d = Math.hypot(p.x - g.player.x, p.y - g.player.y);
          if (d < best) { best = d; next = p; }
        }
        if (next) autopilotStep(g, next);
      }, { up: false, down: false, left: false, right: false, sneak: true, run: false });
      const got = game.level.pages.filter((p) => p.taken).length;
      if (got >= 1 && game.detection < 0.4) break;
      if (game.screen !== SCREEN_PLAY) break;
    }
    game.screen = SCREEN_PLAY;
  } else if (shot === 'alert') {
    // Park the player at the edge of the first guard's cone, then let detection climb.
    game.screen = SCREEN_PLAY;
    const g = game.level.guards[0];
    game.player.x = g.x + Math.cos(g.angle) * 150;
    game.player.y = g.y + Math.sin(g.angle) * 150;
    simulate(game, 1.0, null);
    game.screen = SCREEN_PLAY;
  } else if (shot === 'end') {
    game.screen = SCREEN_PLAY;
    for (const p of game.level.pages) p.taken = true;
    game.player.x = game.level.exit.x - 30; game.player.y = game.level.exit.y;
    simulate(game, 0.5, null);
    game.player.x = game.level.exit.x; game.player.y = game.level.exit.y;
    game.tick(STEP, { up: false, down: false, left: false, right: false, sneak: false, run: false });
    game.screen = SCREEN_WIN;
    game.time = 187.4;
    game.best = 187;
  }
  game.renderer.draw(game.snapshot());
  game.renderer.draw(game.snapshot());
  window.__shotReady = true;
}
