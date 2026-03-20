import { W, H, TRASH_MAX_COUNT, TRASH_SPAWN_MIN_INTERVAL, TRASH_SPAWN_EXTRA_INTERVAL } from './config.js';
import { state } from './state.js';
import { ctx } from './canvas.js';
import { Cat } from './entities/Cat.js';
import { GeminiBot } from './entities/GeminiBot.js';
import { Trash } from './entities/Trash.js';
import { CAT_DEFINITIONS } from './data/cat-definitions.js';
import { createInitialFurnitures } from './data/furniture-defs.js';
import { updateWeather } from './systems/weather.js';
import { drawRoom } from './systems/room.js';
import { renderFrame } from './systems/renderer.js';
import { initInput } from './systems/input.js';

// 初始化
state.furnitures = createInitialFurnitures();
state.cats = CAT_DEFINITIONS.map(def => new Cat(def.type, def.x, def.colors));
state.gemini = new GeminiBot();
initInput();

// 游戏循环
function loop(ts) {
  const dt = Math.min(ts - state.lastTime, 50);
  state.lastTime = ts;
  ctx.clearRect(0, 0, W, H);

  updateWeather(dt);
  drawRoom();
  state.trashes = state.trashes.filter(t => !t.eaten);

  state.spawnTimer -= dt;
  if (state.spawnTimer <= 0 && state.trashes.length < TRASH_MAX_COUNT) {
    state.trashes.push(new Trash(100 + Math.random() * (W - 200), 380 + Math.random() * (H - 420)));
    state.spawnTimer = TRASH_SPAWN_MIN_INTERVAL + Math.random() * TRASH_SPAWN_EXTRA_INTERVAL;
  }

  renderFrame(dt, state);
  requestAnimationFrame(loop);
}

state.lastTime = performance.now();
requestAnimationFrame(loop);
