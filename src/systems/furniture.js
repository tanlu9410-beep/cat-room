import { ctx, drawShadow } from '../canvas.js';
import { W, H, FLOOR_Y, BOUND_PAD_SMALL, YARN_FRICTION } from '../config.js';

export function drawSingleFurniture(f) {
  if (f.t === 'yarn' && !f.isGrabbed) {
    f.x += f.vx; f.y += f.vy; f.vx *= YARN_FRICTION; f.vy *= YARN_FRICTION;
    if (f.x < BOUND_PAD_SMALL) { f.x = BOUND_PAD_SMALL; f.vx *= -1; } if (f.x > W - BOUND_PAD_SMALL) { f.x = W - BOUND_PAD_SMALL; f.vx *= -1; }
    if (f.y < FLOOR_Y) { f.y = FLOOR_Y; f.vy *= -1; } if (f.y > H - BOUND_PAD_SMALL) { f.y = H - BOUND_PAD_SMALL; f.vy *= -1; }
  }

  ctx.save(); ctx.translate(f.x, f.y); ctx.scale(1.8, 1.8);
  if (f.t === 'bed') {
    if (!f.isGrabbed) drawShadow(30, 15);
    ctx.fillStyle = '#4a6b8c'; ctx.beginPath(); ctx.ellipse(0, -3, 28, 14, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#658bad'; ctx.beginPath(); ctx.ellipse(0, -6, 20, 9, 0, 0, Math.PI * 2); ctx.fill();
  } else if (f.t === 'box') {
    if (!f.isGrabbed) drawShadow(25, 12);
    ctx.fillStyle = '#8b6a47'; ctx.fillRect(-20, -5, 40, 25);
    ctx.fillStyle = '#503c28'; ctx.fillRect(-20, -18, 40, 13);
    ctx.fillStyle = '#9e7a54';
    ctx.fillRect(-20, -24, 40, 6);
    ctx.fillRect(-20, -5, 40, 6);
    ctx.fillRect(-26, -18, 6, 13);
    ctx.fillRect(20, -18, 6, 13);
  } else if (f.t === 'tree') {
    if (!f.isGrabbed) drawShadow(25, 12);
    ctx.fillStyle = '#9e8d73'; ctx.fillRect(-20, 5, 40, 8);
    ctx.fillStyle = '#b8a992'; ctx.fillRect(-6, -40, 12, 50);
    ctx.strokeStyle = '#8c7d65'; ctx.lineWidth = 1;
    for (let i = -38; i < 10; i += 3) { ctx.beginPath(); ctx.moveTo(-6, i); ctx.lineTo(6, i + 2); ctx.stroke(); }
    ctx.fillStyle = '#9e8d73'; ctx.fillRect(-22, -45, 44, 6);
  } else if (f.t === 'yarn') {
    if (!f.isGrabbed) drawShadow(12, 6);
    ctx.rotate(f.x * 0.05);
    ctx.fillStyle = '#b84d4d'; ctx.beginPath(); ctx.arc(0, -6, 10, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#913636'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(-6, -10); ctx.lineTo(5, 0); ctx.moveTo(3, -11); ctx.lineTo(-5, 0); ctx.stroke();
  } else if (f.t === 'bin') {
    if (!f.isGrabbed && f.state === 'up') drawShadow(16, 8);
    if (f.state === 'down') { ctx.translate(0, 5); ctx.rotate(-Math.PI / 2); }
    ctx.fillStyle = '#5c6666'; ctx.fillRect(-12, -22, 24, 24);
    ctx.fillStyle = '#737f80'; ctx.beginPath(); ctx.ellipse(0, -22, 12, 5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#cfd6d6'; ctx.fillRect(-5, -26, 8, 8); ctx.fillRect(-2, -24, 10, 6);
  }
  ctx.restore();
}
