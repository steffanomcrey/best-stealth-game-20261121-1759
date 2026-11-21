// Keyboard (WASD/arrows, Shift sneak, Shift+run is just run, E interact) and mouse
// click-to-move. Coordinates are converted from screen space to the 1280x720 field.
export const ACTION_CONFIRM = 'confirm';
export function createInput(canvas) {
  const keys = new Set();
  const state = { up: false, down: false, left: false, right: false, sneak: false, run: false };
  const pressed = new Set();
  function sync() {
    state.up = keys.has('KeyW') || keys.has('ArrowUp');
    state.down = keys.has('KeyS') || keys.has('ArrowDown');
    state.left = keys.has('KeyA') || keys.has('ArrowLeft');
    state.right = keys.has('KeyD') || keys.has('ArrowRight');
    state.sneak = keys.has('ShiftLeft') || keys.has('ShiftRight');
    state.run = keys.has('KeyR');
  }
  window.addEventListener('keydown', (e) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault();
    if (!e.repeat) pressed.add(e.code);
    keys.add(e.code); sync();
  });
  window.addEventListener('keyup', (e) => { keys.delete(e.code); sync(); });
  canvas.addEventListener('pointerdown', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 1280;
    const y = ((e.clientY - rect.top) / rect.height) * 720;
    if (state.onClick) state.onClick(x, y);
    pressed.add('Pointer');
  });
  return {
    state,
    wasPressed(code) { const hit = pressed.has(code); if (hit) pressed.delete(code); return hit; },
    confirmPressed() { return this.wasPressed('Enter') || this.wasPressed('Space') || this.wasPressed('Pointer'); },
  };
}
