export const canvas = document.getElementById('c');
export const ctx = canvas.getContext('2d');

export function drawShadow(w, h) {
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath();
  ctx.ellipse(0, 0, w, h, 0, 0, Math.PI * 2);
  ctx.fill();
}
