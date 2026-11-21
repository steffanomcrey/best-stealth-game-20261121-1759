// Guard behaviour: patrol waypoints, grow suspicious when something is heard or glimpsed,
// chase when the player is plainly seen, then give up and return to patrol.
import { GUARD } from './config.js';
import { guardSeesPlayer } from './vision.js';

function moveToward(guard, tx, ty, speed, dt) {
  const dx = tx - guard.x, dy = ty - guard.y;
  const dist = Math.hypot(dx, dy);
  if (dist < 2) return true;
  const step = Math.min(dist, speed * dt);
  guard.x += (dx / dist) * step;
  guard.y += (dy / dist) * step;
  guard.angle = Math.atan2(dy, dx);
  return dist - step < 2;
}

// Returns how strongly this guard is seeing the player (0..1) this step.
export function updateGuard(guard, level, player, dt) {
  const seen = guardSeesPlayer(level, guard, player.x, player.y, player.sneaking);
  if (guard.state === 'patrol') {
    const target = guard.waypoints[guard.wp];
    if (moveToward(guard, target.x, target.y, GUARD.patrolSpeed, dt)) {
      guard.wp = (guard.wp + 1) % guard.waypoints.length;
    }
    if (seen.seen) {
      guard.suspicious += dt * (seen.dist < 120 ? 1.6 : 0.8);
      if (guard.suspicious > 1.2) { guard.state = 'chase'; guard.alertT = 3; }
    } else if (player.noise > 0 && Math.hypot(player.x - guard.x, player.y - guard.y) < GUARD.hearDist) {
      guard.suspicious += dt * 0.7;
      if (guard.suspicious > 1.5) guard.state = 'investigate';
      guard.investigateX = player.x; guard.investigateY = player.y;
    } else {
      guard.suspicious = Math.max(0, guard.suspicious - dt * 0.5);
    }
  } else if (guard.state === 'investigate') {
    if (moveToward(guard, guard.investigateX, guard.investigateY, GUARD.patrolSpeed * 1.4, dt)) {
      guard.state = 'patrol';
    }
    if (seen.seen) { guard.state = 'chase'; guard.alertT = 3; }
  } else { // chase: run at the player; lose them and the chase cools off.
    moveToward(guard, player.x, player.y, GUARD.chaseSpeed, dt);
    guard.alertT -= dt;
    if (!seen.seen) guard.alertT -= dt * 2;
    if (guard.alertT <= 0) { guard.state = 'patrol'; guard.suspicious = 0.4; }
  }
  return seen.seen ? 1 : 0;
}
