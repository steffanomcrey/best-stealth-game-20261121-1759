// The three gallery wings. Legend: # wall, C crate cover (blocks movement and sight),
// S shadow pool (detection drains twice as fast), L lamplit floor (detection fills faster),
// P ink page, D locked door (opens when every page is taken), E exit, @ player start.
// Guards patrol the waypoint lists (tile coordinates); each level adds a guard and a page.
import { FIELD } from './config.js';

const L1 = [
  '################################',
  '#..............................#',
  '#..CC........#.....P........E..#',
  '#..............................#',
  '#....S......####......CC.......#',
  '#..............................#',
  '#..CC.....G...........G........#',
  '#..............................#',
  '#.......####......S......####..#',
  '#..............................#',
  '#..P......CC......G.......CC...#',
  '#..............................#',
  '#....CC.......####......S......#',
  '#..............................#',
  '#..@...........P.........CC....#',
  '#..............................#',
  '#..S...........................#',
  '################################',
];
const L2 = [
  '################################',
  '#....P..........####......E....#',
  '#..CC.....G.....#..#.....CC....#',
  '#...............#..#...........#',
  '#..S....####.....#..#...####...#',
  '#......P........#..#...........#',
  '#.....G.........D..D.....G.....#',
  '#...............#..#...........#',
  '#..CC....####...#..#....CC.....#',
  '#..............................#',
  '#.......G..........S.......P...#',
  '#..............................#',
  '#..CC......####......####......#',
  '#..............................#',
  '#..@.....P......CC........CC...#',
  '#..............................#',
  '#....S.........................#',
  '################################',
];
const L3 = [
  '################################',
  '#..P....CC......####.....P...E.#',
  '#.............G..#..#....CC....#',
  '#..S...........#..#..#.........#',
  '#....####......#..#..#...G.....#',
  '#..............#..#..#.........#',
  '#..G.....CC....D..D....CC......#',
  '#..............#..#..#.........#',
  '#.....####.....#..#..#....S....#',
  '#.............G..#..#....G.....#',
  '#..CC.....S....#..#..#.........#',
  '#..............................#',
  '#....P.....####.....####...P...#',
  '#..............................#',
  '#..@......CC......G......CC....#',
  '#..........P...................#',
  '#.....S........................#',
  '################################',
];

function tileCenter(col, row) {
  return { x: (col + 0.5) * FIELD.tile, y: (row + 0.5) * FIELD.tile };
}

// Parse one ASCII map into the sets the rules and the renderer need.
export function parseLevel(index, rows) {
  const walls = new Set(), cover = new Set(), shadow = new Set(), lit = new Set();
  const pages = [];
  let exit = null, start = null;
  const doors = [];
  for (let r = 0; r < rows.length; r += 1) {
    for (let c = 0; c < rows[r].length; c += 1) {
      const ch = rows[r][c];
      const key = `${c},${r}`;
      if (ch === '#') walls.add(key);
      else if (ch === 'C') cover.add(key);
      else if (ch === 'S') shadow.add(key);
      else if (ch === 'L') lit.add(key);
      else if (ch === 'P') pages.push({ ...tileCenter(c, r), taken: false });
      else if (ch === 'D') { walls.add(key); doors.push({ col: c, row: r, open: false }); }
      else if (ch === 'E') exit = { ...tileCenter(c, r), col: c, row: r };
      else if (ch === '@') start = tileCenter(c, r);
    }
  }
  return { index, walls, cover, shadow, lit, pages, exit, start, doors };
}

const WAYPOINTS = [
  [ // Level 1: three guards, short honest patrols a player can learn.
    [[9, 6], [21, 6]], [[19, 10], [19, 14]], [[9, 6], [9, 12]],
  ],
  [ // Level 2: four guards, one crossing the locked door hall.
    [[9, 2], [9, 6]], [[24, 6], [24, 2]], [[8, 10], [16, 10]], [[20, 6], [28, 6]],
  ],
  [ // Level 3: five guards, overlapping cones in the curator's wing.
    [[13, 2], [13, 6]], [[24, 4], [24, 9]], [[6, 6], [6, 12]], [[13, 9], [19, 9]], [[20, 14], [28, 14]],
  ],
];

export const LEVELS = [
  { name: 'The Quiet Gallery', hint: 'Take all 3 ink pages, then slip out the EXIT unseen.', rows: L1 },
  { name: 'The Ink Vault', hint: 'The locked door opens when all 4 pages are taken.', rows: L2 },
  { name: "The Curator's Wing", hint: 'Five guards now. Shadow pools are your friends.', rows: L3 },
];

export function buildLevel(index) {
  const def = LEVELS[index];
  const level = parseLevel(index, def.rows);
  level.name = def.name;
  level.hint = def.hint;
  level.guards = WAYPOINTS[index].map((wps) => ({
    waypoints: wps.map(([c, r]) => tileCenter(c, r)),
    wp: 0, x: tileCenter(wps[0][0], wps[0][1]).x, y: tileCenter(wps[0][0], wps[0][1]).y,
    angle: 0, state: 'patrol', suspicious: 0, alertT: 0,
  }));
  return level;
}

export function isSolid(level, col, row) {
  if (col < 0 || row < 0 || col >= FIELD.cols || row >= FIELD.rows) return true;
  return level.walls.has(`${col},${row}`) || level.cover.has(`${col},${row}`);
}
// True when the tile at (x,y) blocks a guard's line of sight.
export function blocksSight(level, x, y) {
  const col = Math.floor(x / FIELD.tile), row = Math.floor(y / FIELD.tile);
  if (col < 0 || row < 0 || col >= FIELD.cols || row >= FIELD.rows) return true;
  return level.walls.has(`${col},${row}`) || level.cover.has(`${col},${row}`);
}
export function inShadow(level, x, y) {
  return level.shadow.has(`${Math.floor(x / FIELD.tile)},${Math.floor(y / FIELD.tile)}`);
}
export function inLight(level, x, y) {
  return level.lit.has(`${Math.floor(x / FIELD.tile)},${Math.floor(y / FIELD.tile)}`);
}
