// Everything on screen: the gallery floor, walls and cover, lamp light and shadow pools,
// guard vision cones (raycast, so cover and walls cut them), the player, the HUD with its
// detection meter, a minimap with guard facing arrows, and the title / win / caught screens.
import { COLORS, FIELD, GUARD } from './config.js';
import { blocksSight } from './levels.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_WIN = 'win';
export const SCREEN_CAUGHT = 'caught';
export const SCREEN_LEVEL_DONE = 'levelDone';

function conePolygon(ctx, level, guard) {
  const pts = [[guard.x, guard.y]];
  const steps = 24;
  for (let i = 0; i <= steps; i += 1) {
    const a = guard.angle - GUARD.viewHalfAngle + (2 * GUARD.viewHalfAngle * i) / steps;
    let dist = GUARD.viewDist;
    for (let d = 12; d <= GUARD.viewDist; d += 8) {
      if (blocksSight(level, guard.x + Math.cos(a) * d, guard.y + Math.sin(a) * d)) { dist = d; break; }
    }
    pts.push([guard.x + Math.cos(a) * dist, guard.y + Math.sin(a) * dist]);
  }
  return pts;
}

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');
  function resize() {
    const scale = Math.min(window.innerWidth / FIELD.width, window.innerHeight / FIELD.height);
    canvas.width = FIELD.width; canvas.height = FIELD.height;
    canvas.style.width = `${FIELD.width * scale}px`;
    canvas.style.height = `${FIELD.height * scale}px`;
  }
  resize();
  window.addEventListener('resize', resize);

  function drawLevel(level, player, detection) {
    for (let r = 0; r < FIELD.rows; r += 1) {
      for (let c = 0; c < FIELD.cols; c += 1) {
        const x = c * FIELD.tile, y = r * FIELD.tile;
        const key = `${c},${r}`;
        ctx.fillStyle = (r + c) % 2 ? COLORS.floor : COLORS.floorAlt;
        ctx.fillRect(x, y, FIELD.tile, FIELD.tile);
        if (level.shadow.has(key)) { ctx.fillStyle = COLORS.shadow; ctx.fillRect(x, y, FIELD.tile, FIELD.tile); }
        if (level.lit.has(key)) { ctx.fillStyle = 'rgba(245,200,107,0.10)'; ctx.fillRect(x, y, FIELD.tile, FIELD.tile); }
        if (level.walls.has(key)) {
          ctx.fillStyle = COLORS.wall; ctx.fillRect(x, y, FIELD.tile, FIELD.tile);
          ctx.fillStyle = COLORS.wallTop; ctx.fillRect(x, y, FIELD.tile, 6);
        } else if (level.cover.has(key)) {
          ctx.fillStyle = COLORS.cover; ctx.fillRect(x + 3, y + 3, FIELD.tile - 6, FIELD.tile - 6);
          ctx.fillStyle = COLORS.coverTop; ctx.fillRect(x + 3, y + 3, FIELD.tile - 6, 5);
          ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.strokeRect(x + 3, y + 3, FIELD.tile - 6, FIELD.tile - 6);
        }
      }
    }
    // Shadow-pool labels so the safe zones read at a glance.
    ctx.font = 'bold 11px sans-serif'; ctx.textAlign = 'center';
    level.shadow.forEach((key) => {
      const [c, r] = key.split(',').map(Number);
      ctx.fillStyle = 'rgba(125,211,252,0.55)';
      ctx.fillText('SHADOW', (c + 0.5) * FIELD.tile, (r + 0.5) * FIELD.tile + 4);
    });
    // Ink pages.
    for (const p of level.pages) {
      if (p.taken) continue;
      ctx.fillStyle = COLORS.page;
      ctx.fillRect(p.x - 8, p.y - 10, 16, 20);
      ctx.fillStyle = '#141824';
      ctx.fillRect(p.x - 5, p.y - 6, 10, 2); ctx.fillRect(p.x - 5, p.y - 1, 10, 2); ctx.fillRect(p.x - 5, p.y + 4, 7, 2);
    }
    // Locked doors.
    for (const d of level.doors) {
      if (d.open) continue;
      ctx.fillStyle = '#7dd3fc';
      ctx.fillRect(d.col * FIELD.tile + 4, d.row * FIELD.tile + 2, FIELD.tile - 8, FIELD.tile - 4);
      ctx.fillStyle = '#0e1428'; ctx.font = 'bold 12px sans-serif';
      ctx.fillText('LOCKED', (d.col + 0.5) * FIELD.tile, (d.row + 0.5) * FIELD.tile + 4);
    }
    // Exit, labelled.
    const e = level.exit;
    const open = level.pages.every((p) => p.taken);
    ctx.fillStyle = open ? COLORS.exit : '#3a4a3a';
    ctx.fillRect(e.x - 18, e.y - 18, 36, 36);
    ctx.strokeStyle = open ? '#a7f3d0' : '#5b6b5b'; ctx.lineWidth = 3;
    ctx.strokeRect(e.x - 18, e.y - 18, 36, 36);
    ctx.fillStyle = open ? '#06281a' : '#c8d2c8'; ctx.font = 'bold 12px sans-serif';
    ctx.fillText(open ? 'EXIT' : 'LOCKED', e.x, e.y - 26);
  }

  function drawGuards(level, guards) {
    for (const g of guards) {
      const alert = g.state !== 'patrol';
      ctx.beginPath();
      const poly = conePolygon(ctx, level, g);
      ctx.moveTo(poly[0][0], poly[0][1]);
      for (let i = 1; i < poly.length; i += 1) ctx.lineTo(poly[i][0], poly[i][1]);
      ctx.closePath();
      ctx.fillStyle = alert ? COLORS.coneAlert : COLORS.cone;
      ctx.fill();
      // Dashed range arc at the cone's far edge.
      ctx.setLineDash([4, 6]); ctx.strokeStyle = alert ? 'rgba(255,90,90,0.7)' : 'rgba(245,200,107,0.5)';
      ctx.beginPath(); ctx.arc(g.x, g.y, GUARD.viewDist, g.angle - GUARD.viewHalfAngle, g.angle + GUARD.viewHalfAngle); ctx.stroke();
      ctx.setLineDash([]);
      // Guard body with a facing wedge and a "?" when suspicious.
      ctx.beginPath(); ctx.arc(g.x, g.y, GUARD.radius, 0, Math.PI * 2);
      ctx.fillStyle = alert ? COLORS.guard : COLORS.guardCalm; ctx.fill();
      ctx.strokeStyle = '#141824'; ctx.lineWidth = 2; ctx.stroke();
      ctx.beginPath(); ctx.moveTo(g.x, g.y);
      ctx.lineTo(g.x + Math.cos(g.angle - 0.5) * 10, g.y + Math.sin(g.angle - 0.5) * 10);
      ctx.lineTo(g.x + Math.cos(g.angle + 0.5) * 10, g.y + Math.sin(g.angle + 0.5) * 10);
      ctx.closePath(); ctx.fillStyle = '#141824'; ctx.fill();
      if (g.suspicious > 0.3 || alert) {
        ctx.fillStyle = alert ? '#ff5d5d' : '#ffd166'; ctx.font = 'bold 20px sans-serif';
        ctx.fillText(alert ? '!' : '?', g.x, g.y - 22);
      }
    }
  }

  function drawPlayer(player) {
    if (player.noise > 0) {
      ctx.beginPath(); ctx.arc(player.x, player.y, player.noise, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(232,236,244,0.35)'; ctx.stroke();
    }
    ctx.beginPath(); ctx.arc(player.x, player.y, 13, 0, Math.PI * 2);
    ctx.fillStyle = player.sneaking ? COLORS.playerSneak : COLORS.player; ctx.fill();
    ctx.strokeStyle = '#06281a'; ctx.lineWidth = 2; ctx.stroke();
    // Facing tick and a little ink-brush quill mark.
    ctx.beginPath(); ctx.moveTo(player.x, player.y);
    ctx.lineTo(player.x + Math.cos(player.facing) * 18, player.y + Math.sin(player.facing) * 18);
    ctx.strokeStyle = '#06281a'; ctx.lineWidth = 3; ctx.stroke();
    if (player.sneaking) {
      ctx.fillStyle = COLORS.text; ctx.font = 'bold 11px sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('SNEAKING', player.x, player.y - 20);
    }
  }

  function drawHud(s) {
    ctx.fillStyle = 'rgba(10,13,24,0.92)'; ctx.fillRect(0, 0, FIELD.width, 46);
    ctx.fillStyle = COLORS.text; ctx.font = 'bold 17px sans-serif'; ctx.textAlign = 'left';
    ctx.fillText(`NIGHT INK  ·  ${s.level.name}`, 14, 29);
    // Detection meter.
    const mx = 430, mw = 260;
    ctx.fillStyle = '#232a40'; ctx.fillRect(mx, 12, mw, 22);
    ctx.fillStyle = s.detection > 0.7 ? '#ff5d5d' : s.detection > 0.35 ? '#ffd166' : '#7ee787';
    ctx.fillRect(mx, 12, mw * Math.min(1, s.detection), 22);
    ctx.strokeStyle = COLORS.text; ctx.strokeRect(mx, 12, mw, 22);
    ctx.fillStyle = COLORS.text; ctx.font = 'bold 13px sans-serif';
    const label = s.detection > 0.7 ? 'SPOTTED!' : s.detection > 0.35 ? 'SUSPICIOUS' : s.hidden ? 'HIDDEN' : 'UNSEEN';
    ctx.fillText(`DETECTION ${Math.round(s.detection * 100)}%  ${label}`, mx + mw + 12, 29);
    // Pages, timer, alerts, level.
    ctx.textAlign = 'right';
    ctx.fillText(`PAGES ${s.pagesGot}/${s.pagesTotal}   TIME ${s.time.toFixed(1)}s   ALERTS ${s.alerts}   LEVEL ${s.levelIndex + 1}/3`, FIELD.width - 14, 29);
    // Footer hints.
    ctx.fillStyle = 'rgba(10,13,24,0.92)'; ctx.fillRect(0, FIELD.height - 26, FIELD.width, 26);
    ctx.fillStyle = COLORS.dim; ctx.font = '13px sans-serif'; ctx.textAlign = 'left';
    ctx.fillText('WASD / arrows move · Shift sneak (quiet) · R run (loud) · click to walk · E next level at EXIT', 14, FIELD.height - 8);
    ctx.textAlign = 'right';
    ctx.fillText(s.level.hint, FIELD.width - 14, FIELD.height - 8);
    drawMinimap(s);
  }

  function drawMinimap(s) {
    const w = 150, h = 84, ox = FIELD.width - w - 12, oy = FIELD.height - 26 - h - 10;
    ctx.fillStyle = 'rgba(10,13,24,0.85)'; ctx.fillRect(ox - 4, oy - 4, w + 8, h + 8);
    const sx = w / FIELD.width, sy = h / FIELD.height;
    ctx.fillStyle = '#232a40'; ctx.fillRect(ox, oy, w, h);
    for (const g of s.level.guards) {
      ctx.fillStyle = g.state === 'patrol' ? COLORS.guardCalm : COLORS.guard;
      ctx.beginPath(); ctx.arc(ox + g.x * sx, oy + g.y * sy, 4, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.moveTo(ox + g.x * sx, oy + g.y * sy);
      ctx.lineTo(ox + g.x * sx + Math.cos(g.angle) * 9, oy + g.y * sy + Math.sin(g.angle) * 9);
      ctx.strokeStyle = ctx.fillStyle; ctx.stroke();
    }
    ctx.fillStyle = COLORS.player;
    ctx.beginPath(); ctx.arc(ox + s.player.x * sx, oy + s.player.y * sy, 4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = COLORS.exit;
    ctx.fillRect(ox + s.level.exit.x * sx - 3, oy + s.level.exit.y * sy - 3, 6, 6);
  }

  function overlay(title, lines, accent) {
    ctx.fillStyle = 'rgba(8,10,20,0.78)'; ctx.fillRect(0, 0, FIELD.width, FIELD.height);
    ctx.textAlign = 'center';
    ctx.fillStyle = accent; ctx.font = 'bold 64px Georgia, serif';
    ctx.fillText(title, FIELD.width / 2, 250);
    ctx.fillStyle = COLORS.text; ctx.font = '20px sans-serif';
    lines.forEach((line, i) => ctx.fillText(line, FIELD.width / 2, 310 + i * 32));
    ctx.fillStyle = COLORS.dim; ctx.font = '15px sans-serif';
    ctx.fillText('Press Enter or click to continue', FIELD.width / 2, 310 + lines.length * 32 + 30);
  }

  return {
    draw(s) {
      ctx.clearRect(0, 0, FIELD.width, FIELD.height);
      ctx.fillStyle = COLORS.floor; ctx.fillRect(0, 0, FIELD.width, FIELD.height);
      if (s.screen === SCREEN_TITLE) {
        drawLevel(s.level, s.player, s.detection);
        drawGuards(s.level, s.level.guards);
        drawPlayer(s.player);
        drawHud(s);
        overlay('NIGHT INK', ['The Quiet Gallery', 'Steal every ink page. Slip out the EXIT unseen.', 'Guards watch with lantern cones. Shadow pools hide you.'], '#ffd166');
        return;
      }
      drawLevel(s.level, s.player, s.detection);
      drawGuards(s.level, s.level.guards);
      drawPlayer(s.player);
      drawHud(s);
      if (s.screen === SCREEN_WIN) {
        overlay('THE GALLERY IS YOURS', [`All 3 wings cleared in ${s.time.toFixed(1)}s with ${s.alerts} alerts.`, `Best: ${s.best}s — press Enter to play again.`], '#7ee787');
      } else if (s.screen === SCREEN_CAUGHT) {
        overlay('CAUGHT', ['A guard caught you in the lamplight.', 'Press Enter to try the wing again.'], '#ff5d5d');
      } else if (s.screen === SCREEN_LEVEL_DONE) {
        overlay('WING CLEARED', [`${s.level.name} done — ${s.pagesGot} pages, ${s.alerts} alerts.`, 'Press Enter for the next wing.'], '#7dd3fc');
      }
    },
  };
}
