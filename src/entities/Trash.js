import { ctx, drawShadow } from '../canvas.js';
import { W, H, FLOOR_Y, BOUND_PAD_SMALL, TRASH_FRICTION, TRASH_BOUNCE,
         TRASH_SCATTER_COUNT, TRASH_SCATTER_SPREAD } from '../config.js';

export class Trash {
  constructor(x, y, vx, vy, isGolden = false) {
    this.x = x; this.y = y; this.vx = vx || 0; this.vy = vy || 0;
    this.scattered = false; this.pieces = []; this.isGolden = isGolden;
  }

  scatter() {
    this.scattered = true;
    for (let i = 0; i < TRASH_SCATTER_COUNT; i++) {
      this.pieces.push({
        x: this.x + (Math.random() - 0.5) * TRASH_SCATTER_SPREAD,
        y: this.y + (Math.random() - 0.5) * TRASH_SCATTER_SPREAD
      });
    }
  }

  update() {
    if (this.scattered) return;
    this.x += this.vx; this.y += this.vy;
    this.vx *= TRASH_FRICTION; this.vy *= TRASH_FRICTION;
    if (this.y < FLOOR_Y) { this.y = FLOOR_Y; this.vy *= TRASH_BOUNCE; }
    if (this.y > H - BOUND_PAD_SMALL) { this.y = H - BOUND_PAD_SMALL; this.vy *= TRASH_BOUNCE; }
    if (this.x < BOUND_PAD_SMALL) { this.x = BOUND_PAD_SMALL; this.vx *= TRASH_BOUNCE; }
    if (this.x > W - BOUND_PAD_SMALL) { this.x = W - BOUND_PAD_SMALL; this.vx *= TRASH_BOUNCE; }
  }

  draw() {
    ctx.save(); ctx.translate(this.x, this.y); ctx.scale(1.5, 1.5);
    if (this.scattered) {
      ctx.fillStyle = this.isGolden ? '#e8ca58' : '#b0b0b0';
      this.pieces.forEach(p => {
        ctx.save(); ctx.translate(p.x - this.x, p.y - this.y); ctx.rotate(Math.random());
        ctx.fillRect(-3, -2, 6, 4); ctx.restore();
      });
    } else {
      drawShadow(8, 4); ctx.translate(0, -5);
      ctx.fillStyle = this.isGolden ? '#ffd700' : '#e0e0e0';
      ctx.beginPath(); ctx.arc(0, 0, 8, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = this.isGolden ? '#b8860b' : '#a0a0a0'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(-4, -3); ctx.lineTo(4, 2); ctx.moveTo(-3, 4); ctx.lineTo(4, -3); ctx.stroke();
    }
    ctx.restore();
  }
}
