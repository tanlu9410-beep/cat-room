import { ctx, drawShadow } from '../canvas.js';
import { W, H, FLOOR_Y, BOUND_PAD, BOUND_PAD_SMALL,
         GEMINI_SPEED, GEMINI_RIDER_SPEED_MULT, GEMINI_FRENZY_SPEED,
         GEMINI_CLEAN_THRESHOLD, GEMINI_CLEAN_DONE_THRESHOLD,
         GEMINI_IDLE_TIMER, GEMINI_SWEEP_TIMER, GEMINI_WAIT_TIMER,
         GEMINI_STUCK_TIMER, GEMINI_FRENZY_STUCK_TIMER, GEMINI_FRENZY_COOLDOWN,
         GEMINI_IDLE_AFTER_TIMER, GEMINI_GOLDEN_MAX, GEMINI_RANDOM_STUCK_RATE } from '../config.js';
import { Trash } from './Trash.js';

export class GeminiBot {
  constructor() {
    this.x = W / 2; this.y = H - 80;
    this.vx = 0; this.vy = 0;
    this.state = 'idle';
    this.timer = GEMINI_IDLE_TIMER; this.rider = null;
    this.target = null; this.emo = '♪';
    this.emos = ['♥', '✨', '♪', '=_=', '>_<', '🤖'];
    this.cleanMode = false;
    this.frenzyCooldown = 0;
    this.isGrabbed = false;
  }

  update(dt, world) {
    const { cats, trashes, furnitures } = world;
    if (this.isGrabbed) return;
    this.timer -= dt;
    this.frenzyCooldown -= dt;
    let unread = trashes.filter(t => !t.isGolden && !t.eaten);

    if (this.state === 'idle') {
      if (unread.length >= GEMINI_CLEAN_THRESHOLD || this.timer <= 0) {
        this.state = 'sweep';
        this.cleanMode = unread.length >= GEMINI_CLEAN_THRESHOLD;
        this.timer = this.cleanMode ? 99999 : GEMINI_SWEEP_TIMER;
        let angle = Math.random() * Math.PI * 2;
        this.vx = Math.cos(angle) * GEMINI_SPEED; this.vy = Math.sin(angle) * GEMINI_SPEED * 0.5;
        this.emo = this.emos[Math.floor(Math.random() * this.emos.length)];
      }
      if (Math.random() < GEMINI_RANDOM_STUCK_RATE * dt) {
        this.state = 'stuck'; this.timer = GEMINI_STUCK_TIMER; this.emo = '';
      }
    }

    if (this.state === 'sweep') {
      let whiteCat = cats.find(c => c.type === 'white');
      let cowCat = cats.find(c => c.type === 'cow');

      if (!this.rider && whiteCat && Math.abs(whiteCat.x - this.x) < 80 && Math.abs(whiteCat.y - this.y) < 50) {
        this.state = 'wait'; this.timer = GEMINI_WAIT_TIMER; this.emo = '♥';
      }
      else if (cowCat && cowCat.state === 'zoomies' && this.frenzyCooldown <= 0) {
        if (Math.random() < 0.05) {
          this.state = 'frenzy'; this.target = cowCat; this.emo = '';
        }
        this.frenzyCooldown = GEMINI_FRENZY_COOLDOWN;
      }

      let speedMult = this.rider ? GEMINI_RIDER_SPEED_MULT : 1;
      this.x += this.vx * speedMult * dt;
      this.y += this.vy * speedMult * dt;

      if (this.x <= BOUND_PAD) { this.x = BOUND_PAD; this.vx = Math.abs(this.vx); }
      if (this.x >= W - BOUND_PAD) { this.x = W - BOUND_PAD; this.vx = -Math.abs(this.vx); }
      if (this.y <= FLOOR_Y) { this.y = FLOOR_Y; this.vy = Math.abs(this.vy); }
      if (this.y >= H - BOUND_PAD_SMALL) { this.y = H - BOUND_PAD_SMALL; this.vy = -Math.abs(this.vy); }

      trashes.forEach(t => {
        if (!t.eaten && Math.abs(t.x - this.x) < 40 && Math.abs(t.y - this.y) < 40) {
          t.eaten = true; this.emo = '✨';
        }
      });

      let bin = furnitures.find(f => f.t === 'bin');
      if (bin && bin.state === 'down' && Math.abs(this.x - bin.x) < 50 && Math.abs(this.y - bin.y) < 40) {
        bin.state = 'up'; this.emo = '✨';
        cats.forEach(c => { if (c.state === 'in_bin' && c.targetObj === bin) { c.state = 'wander'; c.y += 20; c.setEmo('❓', 1000); } });
      }

      let remain = trashes.filter(t => !t.eaten && !t.isGolden);
      if (this.cleanMode && remain.length <= GEMINI_CLEAN_DONE_THRESHOLD) {
        this.cleanMode = false; this.state = 'idle'; this.timer = GEMINI_IDLE_AFTER_TIMER; this.emo = '💤';
      } else if (!this.cleanMode && this.timer <= 0) {
        this.state = 'idle'; this.rider = null; this.timer = GEMINI_IDLE_AFTER_TIMER; this.emo = '💤';
      }
    }
    else if (this.state === 'wait') {
      if (this.timer <= 0) { this.state = 'sweep'; this.emo = '♪'; }
    }
    else if (this.state === 'frenzy') {
      if (!this.target) { this.state = 'idle'; this.timer = GEMINI_IDLE_TIMER; this.emo = '=_='; return; }
      let dx = this.target.x - this.x, dy = this.target.y - this.y;
      let dist = Math.hypot(dx, dy);
      if (dist > 0) { this.x += (dx / dist) * GEMINI_FRENZY_SPEED * dt; this.y += (dy / dist) * GEMINI_FRENZY_SPEED * dt; }

      if (this.x <= BOUND_PAD || this.x >= W - BOUND_PAD || this.y <= FLOOR_Y || this.y >= H - BOUND_PAD_SMALL) {
        this.x = Math.max(BOUND_PAD, Math.min(W - BOUND_PAD, this.x));
        this.y = Math.max(FLOOR_Y, Math.min(H - BOUND_PAD_SMALL, this.y));
        this.state = 'stuck'; this.timer = GEMINI_FRENZY_STUCK_TIMER; this.emo = '';
      }
    }
    else if (this.state === 'stuck') {
      if (this.timer <= 0) {
        let golds = trashes.filter(t => t.isGolden);
        if (golds.length >= GEMINI_GOLDEN_MAX) {
          let idx = trashes.findIndex(t => t.isGolden);
          if (idx > -1) trashes.splice(idx, 1);
        }
        trashes.push(new Trash(this.x, this.y + 10, 0, -2, true));
        this.state = 'idle'; this.timer = GEMINI_IDLE_TIMER; this.emo = '=_=';
      }
    }
  }

  draw() {
    ctx.save(); ctx.translate(this.x, this.y); ctx.scale(2.0, 2.0);

    if (this.isGrabbed) {
      drawShadow(16, 6);
      ctx.translate(0, -10 + Math.sin(Date.now() * 0.05) * 2);
    } else {
      drawShadow(16, 6);
    }

    if (this.state === 'stuck') {
      ctx.rotate(Math.PI / 2);
      ctx.translate(10, -10);
    }

    let dir = 1;
    if (this.state === 'sweep' || this.state === 'idle') dir = this.vx < 0 ? -1 : 1;
    if (this.state === 'frenzy') dir = this.target && this.target.x < this.x ? -1 : 1;
    if (dir < 0) ctx.scale(-1, 1);

    let yOffset = (this.state === 'wait') ? 2 : 0;
    ctx.translate(0, yOffset);

    ctx.fillStyle = '#5ba4d4'; ctx.fillRect(-10, -10, 20, 16); ctx.fillStyle = '#d0eeff'; ctx.fillRect(-7, -8, 14, 8);

    if (this.state === 'stuck') {
      ctx.strokeStyle = '#ff0000'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(-5, -6); ctx.lineTo(-2, -3); ctx.moveTo(-2, -6); ctx.lineTo(-5, -3); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(2, -6); ctx.lineTo(5, -3); ctx.moveTo(5, -6); ctx.lineTo(2, -3); ctx.stroke();
      ctx.beginPath(); ctx.arc(0, -1, 2, 0, Math.PI, true); ctx.stroke();
    } else {
      ctx.fillStyle = (this.state === 'frenzy') ? '#ff0000' : '#2060a0';
      ctx.fillRect(-5, -6, 3, 3); ctx.fillRect(2, -6, 3, 3);
    }

    ctx.fillStyle = '#2c3e50'; ctx.fillRect(-9, 6, 6, 4); ctx.fillRect(3, 6, 6, 4);
    ctx.strokeStyle = '#8b7355'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(10, -2); ctx.lineTo(20, 6); ctx.stroke();
    // Status light
    const lightOn = Math.sin(Date.now() * 0.005) > 0;
    ctx.fillStyle = this.state === 'stuck' ? '#ff4444' : this.state === 'frenzy' ? '#ff8800' : (lightOn ? '#4ade80' : '#166534');
    ctx.fillRect(7, -12, 3, 3);

    ctx.scale(dir < 0 ? -1 : 1, 1);

    if (this.emo && this.state !== 'stuck') {
      let emoY = this.rider ? -35 : -15;
      ctx.fillStyle = 'rgba(60,130,200,0.9)'; ctx.font = 'bold 10px sans-serif';
      ctx.fillText(this.emo, -6, emoY);
    }

    ctx.restore();
  }
}
