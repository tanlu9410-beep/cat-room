import { canvas } from '../canvas.js';
import { state } from '../state.js';
import { GEMINI_GOLDEN_MAX } from '../config.js';
import { Cat } from '../entities/Cat.js';
import { GeminiBot } from '../entities/GeminiBot.js';
import { Trash } from '../entities/Trash.js';
import { trashLibrary, goldenLibrary } from '../data/trash-library.js';

function getMousePos(e) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
}

export function initInput() {
  const card = document.getElementById('card');

  window.addEventListener('mousemove', e => {
    const pos = getMousePos(e);
    state.mouseX = pos.x;
    state.mouseY = pos.y;

    if (state.grabbedObj) {
      if (state.grabbedObj.ox !== undefined) {
        state.grabbedObj.x = pos.x + state.grabbedObj.ox;
        state.grabbedObj.y = pos.y + state.grabbedObj.oy;
      } else {
        state.grabbedObj.x = pos.x;
        state.grabbedObj.y = pos.y;
        if (state.grabbedObj.climbY !== undefined) state.grabbedObj.climbY = 0;
      }
    }
  });

  canvas.addEventListener('mousedown', e => {
    const pos = getMousePos(e);
    const { gemini, cats, trashes, furnitures } = state;

    card.style.display = 'none';
    if (state.cardTimeout) clearTimeout(state.cardTimeout);

    // 第一层级：扫地机器人
    if (Math.abs(gemini.x - pos.x) < 50 && Math.abs(gemini.y - pos.y) < 50) {
      if (gemini.state === 'stuck' || gemini.state === 'frenzy') {
        gemini.state = 'idle'; gemini.timer = 3000; gemini.emo = '=_=';
        let golds = trashes.filter(t => t.isGolden);
        if (golds.length >= GEMINI_GOLDEN_MAX) {
          let idx = trashes.findIndex(t => t.isGolden);
          if (idx > -1) trashes.splice(idx, 1);
        }
        trashes.push(new Trash(gemini.x, gemini.y + 10, 0, -2, true));
        return;
      } else {
        if (Math.random() < 0.15) {
          gemini.state = 'stuck'; gemini.timer = 5000; gemini.emo = '';
          if (gemini.rider) { gemini.rider.riding = false; gemini.rider.vy = -2; gemini.rider = null; }
          return;
        } else {
          state.grabbedObj = gemini; gemini.isGrabbed = true; gemini.ox = gemini.x - pos.x; gemini.oy = gemini.y - pos.y;
          if (gemini.rider) { gemini.rider.riding = false; gemini.rider.vy = -2; gemini.rider = null; }
          e.preventDefault();
          return;
        }
      }
    }

    // 第二层级：猫
    for (let i = cats.length - 1; i >= 0; i--) {
      let c = cats[i];
      let hitRadius = c.type === 'black' || c.type === 'grey' ? 60 : 40;
      if (Math.abs(c.x - pos.x) < hitRadius && Math.abs((c.y + c.climbY) - pos.y) < hitRadius) {
        state.grabbedObj = c; c.isGrabbed = true; c.riding = false;
        e.preventDefault();
        return;
      }
    }

    // 第三层级：纸团
    const clickedTrash = trashes.find(t => !t.scattered && Math.abs(t.x - pos.x) < 25 && Math.abs(t.y - pos.y) < 25);
    if (clickedTrash) {
      const lib = clickedTrash.isGolden ? goldenLibrary : trashLibrary;
      const item = lib[Math.floor(Math.random() * lib.length)];
      document.getElementById('card-content').textContent = item.c;
      document.getElementById('card-author').textContent = item.a;

      card.style.display = 'block';
      const rect = card.getBoundingClientRect();
      const cWidth = rect.width || 280;
      const cHeight = rect.height || 80;
      let cardLeft = e.clientX - cWidth / 2;
      let cardTop = e.clientY - cHeight - 15;

      if (cardLeft + cWidth > window.innerWidth) cardLeft = window.innerWidth - cWidth - 15;
      if (cardLeft < 15) cardLeft = 15;
      if (cardTop < 15) cardTop = e.clientY + 25;

      card.style.left = cardLeft + 'px';
      card.style.top = cardTop + 'px';
      state.cardTimeout = setTimeout(() => card.style.display = 'none', 5000);
      return;
    }

    // 第四层级：家具
    for (let i = furnitures.length - 1; i >= 0; i--) {
      let f = furnitures[i];
      if (Math.abs(f.x - pos.x) < f.w * 2 && Math.abs(f.y - pos.y) < f.h * 2) {
        state.grabbedObj = f; f.isGrabbed = true; f.ox = f.x - pos.x; f.oy = f.y - pos.y;
        e.preventDefault();
        return;
      }
    }
  });

  window.addEventListener('mouseup', e => {
    if (state.grabbedObj) {
      let droppedEntity = state.grabbedObj;
      state.grabbedObj.isGrabbed = false;
      state.grabbedObj = null;

      if (droppedEntity instanceof GeminiBot) {
        droppedEntity.state = 'idle'; droppedEntity.timer = 2000;
      }
      else if (droppedEntity instanceof Cat) {
        droppedEntity.state = 'wander';
        droppedEntity.climbY = 0;
        droppedEntity.timer = 1500;

        let closest = null; let minDist = 60;
        let busyStates = ['sleep_bed', 'sit_box', 'sit_tree', 'climb', 'in_bin', 'window', 'hide', 'scratch_tree', 'sniff', 'groom', 'chase_cat'];

        state.cats.forEach(other => {
          if (other !== droppedEntity && !other.isGrabbed && !busyStates.includes(other.state)) {
            let d = Math.hypot(droppedEntity.x - other.x, droppedEntity.y - other.y);
            if (d < minDist) { minDist = d; closest = other; }
          }
        });

        if (closest) {
          droppedEntity.state = 'sniff'; closest.state = 'sniff';
          droppedEntity.timer = 1500; closest.timer = 1500;
          droppedEntity.setEmo('❓'); closest.setEmo('❓');

          setTimeout(() => {
            if (!droppedEntity.isGrabbed && !closest.isGrabbed) {
              if (Math.random() < 0.5) {
                droppedEntity.state = 'groom'; closest.state = 'groom';
                droppedEntity.timer = 4000; closest.timer = 4000;
                droppedEntity.x = closest.x - 15; droppedEntity.y = closest.y;
                droppedEntity.vx = -1; closest.vx = 1;
                droppedEntity.setEmo('♥', 3000); closest.setEmo('♥', 3000);
              } else {
                droppedEntity.state = 'chase_cat'; droppedEntity.targetObj = closest;
                droppedEntity.timer = 3000; droppedEntity.setEmo('💢', 1000);
                closest.state = 'wander'; closest.vx = (Math.random() - 0.5) * 5; closest.vy = (Math.random() - 0.5) * 5;
              }
            }
          }, 1500);
        }
      }
    }
  });
}
