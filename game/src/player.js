// The player: WASD/arrows or click-to-move, sneak (Shift) is slow and quiet, running is
// fast and loud. Noise is a radius guards can hear; crouching shrinks it to almost nothing.
import { FIELD, PLAYER } from './config.js';
import { isSolid } from './levels.js';

export function createPlayer(start) {
  return {
    x: start.x, y: start.y, sneaking: false, running: false, moving: false,
    noise: 0, stepT: 0, clickX: null, clickY: null, facing: -Math.PI / 2,
  };
}

function tryMove(player, level, dx, dy) {
  const nx = player.x + dx, ny = player.y + dy;
  const r = PLAYER.radius - 2;
  for (const [ox, oy] of [[-r, -r], [r, -r], [-r, r], [r, r]]) {
    if (isSolid(level, Math.floor((nx + ox) / FIELD.tile), Math.floor((ny + oy) / FIELD.tile))) return;
  }
  player.x = nx; player.y = ny;
}

export function updatePlayer(player, level, input, dt) {
  let mx = 0, my = 0;
  if (input.left) mx -= 1;
  if (input.right) mx += 1;
  if (input.up) my -= 1;
  if (input.down) my += 1;
  if (mx === 0 && my === 0 && player.clickX !== null) {
    const dx = player.clickX - player.x, dy = player.clickY - player.y;
    if (Math.hypot(dx, dy) < 6) { player.clickX = null; player.clickY = null; }
    else { mx = dx / Math.hypot(dx, dy); my = dy / Math.hypot(dx, dy); }
  }
  const len = Math.hypot(mx, my);
  player.moving = len > 0;
  player.sneaking = !!input.sneak;
  player.running = !!input.run && !player.sneaking;
  if (len > 0) {
    const speed = player.sneaking ? PLAYER.sneakSpeed : player.running ? PLAYER.runSpeed : PLAYER.walkSpeed;
    const nx = (mx / len) * speed * dt, ny = (my / len) * speed * dt;
    tryMove(player, level, nx, 0);
    tryMove(player, level, 0, ny);
    player.facing = Math.atan2(my, mx);
    player.stepT -= dt;
    if (player.stepT <= 0) {
      player.stepT = player.sneaking ? 0.55 : player.running ? 0.28 : 0.38;
      player.noise = player.sneaking ? 8 : player.running ? 95 : 55;
    }
  } else {
    player.noise = 0;
  }
  player.noise = Math.max(0, player.noise - dt * 220);
}
