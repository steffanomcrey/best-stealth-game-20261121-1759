// Line of sight: sample the segment guard -> player; any sight-blocking tile ends the ray.
import { blocksSight } from './levels.js';
import { GUARD } from './config.js';

export function hasLineOfSight(level, ax, ay, bx, by) {
  const dx = bx - ax, dy = by - ay;
  const dist = Math.hypot(dx, dy);
  const steps = Math.max(1, Math.ceil(dist / 8));
  for (let i = 1; i < steps; i += 1) {
    if (blocksSight(level, ax + (dx * i) / steps, ay + (dy * i) / steps)) return false;
  }
  return true;
}

function angleDiff(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

// Can this guard see the player right now? Range, cone angle and cover all matter.
export function guardSeesPlayer(level, guard, px, py, sneaking) {
  const dx = px - guard.x, dy = py - guard.y;
  const dist = Math.hypot(dx, dy);
  const range = sneaking ? GUARD.viewDist * 0.62 : GUARD.viewDist;
  if (dist > range) return { seen: false, dist };
  if (Math.abs(angleDiff(Math.atan2(dy, dx), guard.angle)) > GUARD.viewHalfAngle) return { seen: false, dist };
  if (!hasLineOfSight(level, guard.x, guard.y, px, py)) return { seen: false, dist };
  return { seen: true, dist };
}
