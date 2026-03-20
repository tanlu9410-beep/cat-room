import { WEATHER_INIT_TIMER, W, H } from './config.js';

export const state = {
  weather: 'sunny',
  weatherTimer: WEATHER_INIT_TIMER,
  particles: [],
  trashes: [],
  furnitures: [],
  cats: [],
  gemini: null,
  mouseX: W / 2,
  mouseY: H / 2,
  grabbedObj: null,
  cardTimeout: null,
  lastTime: 0,
  spawnTimer: 2000,
};
