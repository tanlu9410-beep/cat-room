import { state } from '../state.js';
import { WEATHER_TYPES, WEATHER_MIN_DURATION, WEATHER_EXTRA_DURATION, FLOOR_Y } from '../config.js';

export function updateWeather(dt) {
  state.weatherTimer -= dt;
  if (state.weatherTimer <= 0) {
    state.weather = WEATHER_TYPES[Math.floor(Math.random() * WEATHER_TYPES.length)];
    state.weatherTimer = WEATHER_MIN_DURATION + Math.random() * WEATHER_EXTRA_DURATION;
    state.particles = [];
  }

  if (state.weather === 'rain') {
    if (Math.random() < 0.6) state.particles.push({ x: 150 + Math.random() * 500, y: 50, vy: 10 + Math.random() * 5, l: 12 + Math.random() * 6 });
  } else if (state.weather === 'snow') {
    if (Math.random() < 0.25) state.particles.push({ x: 150 + Math.random() * 500, y: 50, vy: 0.6 + Math.random() * 0.8, vx: (Math.random() - 0.5) * 1.5, l: 2 + Math.random() * 2 });
  }

  state.particles.forEach(p => { p.y += p.vy; if (p.vx) p.x += p.vx; });
  state.particles = state.particles.filter(p => p.y < FLOOR_Y);
}
