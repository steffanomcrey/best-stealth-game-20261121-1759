// Every tuning number and colour in one place. Logical playfield 1280x720; the renderer
// scales it to the window, so no rule depends on screen size.
export const FIELD = { width: 1280, height: 720, tile: 40, cols: 32, rows: 18 };
export const STEP = 1 / 60;
export const PLAYER = { radius: 13, walkSpeed: 165, sneakSpeed: 88, runSpeed: 235 };
export const GUARD = { radius: 14, patrolSpeed: 62, chaseSpeed: 118, viewDist: 250, viewHalfAngle: 0.62, hearDist: 150 };
export const DETECT = { fillSeen: 0.55, fillLit: 0.85, fillSneak: 0.28, drainHidden: 0.35, drainShadow: 0.7, caughtAt: 1 };
export const COLORS = {
  floor: '#141824', floorAlt: '#171c2b', wall: '#3a4364', wallTop: '#4d5878',
  cover: '#6b5433', coverTop: '#8a6f45', shadow: '#0e1428', lamp: '#f5c86b',
  cone: 'rgba(245,200,107,0.30)', coneAlert: 'rgba(255,80,80,0.38)',
  player: '#7ee787', playerSneak: '#4cc38a', guard: '#ff5d5d', guardCalm: '#e8b13c',
  exit: '#39d98a', page: '#ffd166', key: '#7dd3fc', text: '#e8ecf4', dim: '#9aa3b8',
};
export const BEST_KEY = 'night-ink-best';
