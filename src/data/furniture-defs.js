import { W, H } from '../config.js';

export function createInitialFurnitures() {
  return [
    { t: 'bed',  x: W - 180, y: H - 100, w: 50, h: 25, ox: 0, oy: 0, state: 'normal' },
    { t: 'yarn', x: W - 300, y: H - 80,  w: 20, h: 20, ox: 0, oy: 0, vx: 0, vy: 0, state: 'normal' },
    { t: 'box',  x: W - 100, y: H - 160, w: 45, h: 35, ox: 0, oy: 0, state: 'normal' },
    { t: 'tree', x: 120,     y: H - 180, w: 40, h: 80, ox: 0, oy: 0, state: 'normal' },
    { t: 'bin',  x: W - 250, y: H - 200, w: 25, h: 30, ox: 0, oy: 0, state: 'up' },
  ];
}
