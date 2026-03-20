import { Cat } from '../entities/Cat.js';
import { Trash } from '../entities/Trash.js';
import { GeminiBot } from '../entities/GeminiBot.js';
import { drawSingleFurniture } from './furniture.js';

export function renderFrame(dt, state) {
  const { furnitures, trashes, cats, gemini } = state;
  const world = { cats, gemini, trashes, furnitures, weather: state.weather };

  let entities = [...furnitures, ...trashes, ...cats, gemini];

  entities.sort((a, b) => {
    let ay = a.y, by = b.y;

    if (a.t === 'bed') ay -= 25; else if (a.t === 'tree' || a.t === 'box') ay -= 5;
    if (b.t === 'bed') by -= 25; else if (b.t === 'tree' || b.t === 'box') by -= 5;

    if (a instanceof Cat && ['sleep_bed', 'sit_box', 'climb', 'sit_tree', 'in_bin', 'scratch_tree'].includes(a.state) && a.targetObj) {
      ay = a.targetObj.y + 1;
    }
    if (b instanceof Cat && ['sleep_bed', 'sit_box', 'climb', 'sit_tree', 'in_bin', 'scratch_tree'].includes(b.state) && b.targetObj) {
      by = b.targetObj.y + 1;
    }

    if (a instanceof Cat && a.state === 'hide') ay -= 50;
    if (b instanceof Cat && b.state === 'hide') by -= 50;

    if (a.isGrabbed) ay += 1000; if (b.isGrabbed) by += 1000;
    return ay - by;
  });

  entities.forEach(e => {
    if (e instanceof Cat) e.update(dt, world);
    else if (e instanceof Trash) e.update();
    else if (e instanceof GeminiBot) e.update(dt, world);
  });

  entities.forEach(e => {
    if (e instanceof Cat || e instanceof Trash || e instanceof GeminiBot) e.draw();
    else drawSingleFurniture(e);
  });
}
