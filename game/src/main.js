// Boot and the one loop: input is read every frame, the world advances in fixed 1/60 s
// steps, and the renderer paints what is there. The game moves between title, play,
// level-done, caught and win screens. Detection fills when a guard sees you (faster in
// lamplight, slower while sneaking) and drains when you are hidden (twice as fast in a
// shadow pool): being seen is a warning, not an instant fail, until the meter fills.
// ?seed=N fixes the level. ?shot=start|play|alert|end (with &seed=N) stages that scene
// instead of running the loop, paints it twice and sets window.__shotReady.
import { BEST_KEY, STEP } from './config.js';
import { createRandom } from './random.js';
import { buildLevel, inLight, inShadow } from './levels.js';
import { DETECT } from './config.js';
import { updateGuard } from './guards.js';
import { createPlayer, updatePlayer } from './player.js';
import { alertSting, footstep, pageChime, unlockAudio, winChime } from './audio.js';
import { createInput } from './input.js';
import { createRenderer, SCREEN_CAUGHT, SCREEN_LEVEL_DONE, SCREEN_PLAY, SCREEN_TITLE, SCREEN_WIN } from './render.js';
import { stageShot } from './shots.js';

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : Math.floor(Math.random() * 4294967296);
createRandom(seed); // seed is honoured by the level layout (fixed maps) and shot staging.

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const input = createInput(canvas);
const renderer = createRenderer(canvas);
input.state.onClick = (x, y) => {
  unlockAudio();
  if (game.screen === SCREEN_PLAY) { game.player.clickX = x; game.player.clickY = y; }
};

const game = {
  levelIndex: 0, level: null, player: null, screen: SCREEN_TITLE,
  detection: 0, time: 0, alerts: 0, best: 0, hidden: false, renderer,
  loadLevel(index) {
    this.levelIndex = index;
    this.level = buildLevel(index);
    this.player = createPlayer(this.level.start);
    this.detection = 0;
    this.screen = SCREEN_PLAY;
  },
  snapshot() {
    return {
      screen: this.screen, level: this.level, player: this.player,
      detection: this.detection, time: this.time, alerts: this.alerts,
      pagesGot: this.level.pages.filter((p) => p.taken).length,
      pagesTotal: this.level.pages.length, levelIndex: this.levelIndex, best: this.best,
      hidden: this.hidden,
    };
  },
  tick(dt, keys) {
    if (this.screen !== SCREEN_PLAY) return;
    this.time += dt;
    const prevNoise = this.player.noise;
    updatePlayer(this.player, this.level, keys, dt);
    if (this.player.moving && this.player.stepT <= 0.02) footstep(this.player.sneaking, this.player.running);
    let seen = false;
    for (const g of this.level.guards) {
      const wasChase = g.state === 'chase';
      if (updateGuard(g, this.level, this.player, dt)) seen = true;
      if (!wasChase && g.state === 'chase') { this.alerts += 1; alertSting(); }
    }
    // Detection: fill while seen, drain while hidden; shadow pools drain twice as fast.
    this.hidden = !seen;
    if (seen) {
      const rate = this.player.sneaking ? DETECT.fillSneak : inLight(this.level, this.player.x, this.player.y) ? DETECT.fillLit : DETECT.fillSeen;
      this.detection = Math.min(1, this.detection + rate * dt);
    } else {
      const drain = inShadow(this.level, this.player.x, this.player.y) ? DETECT.drainShadow : DETECT.drainHidden;
      this.detection = Math.max(0, this.detection - drain * dt);
    }
    if (this.detection >= DETECT.caughtAt) { this.screen = SCREEN_CAUGHT; return; }
    // Collect ink pages.
    for (const p of this.level.pages) {
      if (!p.taken && Math.hypot(p.x - this.player.x, p.y - this.player.y) < 26) {
        p.taken = true; pageChime();
        if (this.level.pages.every((q) => q.taken)) {
          for (const d of this.level.doors) { this.level.walls.delete(`${d.col},${d.row}`); d.open = true; }
        }
      }
    }
    // Reach the exit once every page is taken.
    const e = this.level.exit;
    if (this.level.pages.every((p) => p.taken) && Math.hypot(e.x - this.player.x, e.y - this.player.y) < 30) {
      if (this.levelIndex >= 2) {
        this.screen = SCREEN_WIN; winChime();
        try {
          const prev = Number.parseInt(window.localStorage.getItem(BEST_KEY) ?? '0', 10) || 0;
          if (!prev || this.time < prev) window.localStorage.setItem(BEST_KEY, String(Math.round(this.time)));
          this.best = Number.parseInt(window.localStorage.getItem(BEST_KEY) ?? '0', 10) || 0;
        } catch { this.best = Math.round(this.time); }
      } else {
        this.screen = SCREEN_LEVEL_DONE;
      }
    }
    void prevNoise;
  },
};

game.loadLevel(0);
game.screen = SCREEN_TITLE;
window.__game = game; // test hook: lets a headless play test drive and read the real state.
try { game.best = Number.parseInt(window.localStorage.getItem(BEST_KEY) ?? '0', 10) || 0; } catch { game.best = 0; }

if (shot) {
  game.loadLevel(0);
  stageShot(game, shot);
} else {
  const MAX_FRAME = 0.25;
  let last = performance.now();
  function frame(now) {
    const dt = Math.min(MAX_FRAME, (now - last) / 1000);
    last = now;
    if (game.screen === SCREEN_TITLE && input.confirmPressed()) { unlockAudio(); game.loadLevel(0); }
    else if (game.screen === SCREEN_CAUGHT && input.confirmPressed()) { game.loadLevel(game.levelIndex); }
    else if (game.screen === SCREEN_LEVEL_DONE && input.confirmPressed()) { game.loadLevel(game.levelIndex + 1); }
    else if (game.screen === SCREEN_WIN && input.confirmPressed()) { game.loadLevel(0); game.screen = SCREEN_TITLE; }
    let acc = dt;
    while (acc > 0) { const step = Math.min(STEP, acc); game.tick(step, input.state); acc -= step; }
    renderer.draw(game.snapshot());
    status.textContent = `Night Ink, level ${game.levelIndex + 1} of 3, ${game.level.pages.filter((p) => p.taken).length} of ${game.level.pages.length} pages, detection ${Math.round(game.detection * 100)} percent.`;
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
