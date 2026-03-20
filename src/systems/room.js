import { ctx } from '../canvas.js';
import { W, H } from '../config.js';
import { state } from '../state.js';

export function drawRoom() {
  ctx.fillStyle = '#3a332a'; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#2b251e'; ctx.fillRect(0, 0, W, 180);
  ctx.strokeStyle = '#251f19'; ctx.lineWidth = 2;
  for (let y = 220; y < H; y += 50) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

  ctx.fillStyle = '#1a202c'; ctx.fillRect(150, 40, 500, 300);
  ctx.save(); ctx.beginPath(); ctx.rect(150, 40, 500, 300); ctx.clip();
  if (state.weather === 'sunny') {
    ctx.fillStyle = '#2c405a'; ctx.fillRect(150, 40, 500, 300);
    ctx.fillStyle = 'rgba(255,255,200,0.1)';
    ctx.beginPath(); ctx.moveTo(150, 40); ctx.lineTo(400, 340); ctx.lineTo(150, 340); ctx.fill();
  } else if (state.weather === 'rain') {
    ctx.strokeStyle = 'rgba(150, 180, 220, 0.4)'; ctx.lineWidth = 1;
    state.particles.forEach(p => { ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x - 3, p.y + p.l); ctx.stroke(); });
  } else if (state.weather === 'snow') {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    state.particles.forEach(p => { ctx.beginPath(); ctx.arc(p.x, p.y, p.l, 0, Math.PI * 2); ctx.fill(); });
  }
  ctx.restore();
  ctx.strokeStyle = '#1e1814'; ctx.lineWidth = 10; ctx.strokeRect(150, 40, 500, 300);
  ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(400, 40); ctx.lineTo(400, 340); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(150, 150); ctx.lineTo(650, 150); ctx.stroke();
}
