window.mouseX = W/2; window.mouseY = H/2;

function getMousePos(e) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
}

window.addEventListener('mousemove', e => { 
  const pos = getMousePos(e); 
  window.mouseX = pos.x; 
  window.mouseY = pos.y; 

  if(grabbedObj) { 
    if(grabbedObj.ox !== undefined) { 
      grabbedObj.x = pos.x + grabbedObj.ox; 
      grabbedObj.y = pos.y + grabbedObj.oy; 
    } else { 
      grabbedObj.x = pos.x; 
      grabbedObj.y = pos.y; 
      grabbedObj.climbY = 0; 
    }
  } 
});

const cats = [
  new Cat('white', W/2-100, {body:'#e6dfd3', ear:'#d4c5b0', eye:'#5c8a6d'}),
  new Cat('grey', W/2-50, {body:'#9e968d', ear:'#827a70', eye:'#4a6b82'}),
  new Cat('orange', W/2, {body:'#e0ab67', ear:'#c28b4a', eye:'#7b5c94'}),
  new Cat('cow', W/2+50, {body:'#f5f5f5', ear:'#222222', eye:'#d4af37'}),
  new Cat('black', W/2+100, {body:'#1a1a1a', ear:'#0a0a0a', eye:'#ffe600'}),
  new Cat('curly', W/2+150, {body:'#fdf8f5', ear:'#f4e4e0', eye:'#8bbab4'})
];
const gemini = new GeminiBot();

let lastTime=performance.now(), spawnTimer=2000;

function loop(ts) {
  const dt = Math.min(ts-lastTime, 50); lastTime=ts;
  ctx.clearRect(0,0,W,H);
  
  updateWeather(dt);
  drawRoom();
  trashes = trashes.filter(t => !t.eaten); 
  
  spawnTimer-=dt;
  if(spawnTimer<=0 && trashes.length < 15) {
    trashes.push(new Trash(100+Math.random()*(W-200), 380+Math.random()*(H-420)));
    spawnTimer=4000+Math.random()*5000;
  }
  
  let entities = [...furnitures, ...trashes, ...cats];
  
  entities.sort((a,b) => {
    let ay = a.y, by = b.y;
    
    if(a.t === 'bed') ay -= 25; else if (a.t === 'tree' || a.t === 'box') ay -= 5;
    if(b.t === 'bed') by -= 25; else if (b.t === 'tree' || b.t === 'box') by -= 5;

    if(a instanceof Cat && ['sleep_bed', 'sit_box', 'climb', 'sit_tree', 'in_bin', 'scratch_tree'].includes(a.state) && a.targetObj) {
      ay = a.targetObj.y + 1; 
    }
    if(b instanceof Cat && ['sleep_bed', 'sit_box', 'climb', 'sit_tree', 'in_bin', 'scratch_tree'].includes(b.state) && b.targetObj) {
      by = b.targetObj.y + 1;
    }
    
    if(a instanceof Cat && a.state === 'hide') ay -= 50; 
    if(b instanceof Cat && b.state === 'hide') by -= 50;
    
    if(a.isGrabbed) ay += 1000; if(b.isGrabbed) by += 1000; 
    return ay - by;
  });

  entities.forEach(e => {
    if(e instanceof Cat) e.update(dt, cats);
    else if(e instanceof Trash) e.update();
  });
  
  entities.forEach(e => {
    if(e instanceof Cat || e instanceof Trash) e.draw();
    else { let old = furnitures; furnitures = [e]; drawFurnitures(); furnitures = old; }
  });
  
  gemini.update(dt, cats, trashes); gemini.draw();
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

const card = document.getElementById('card');
let grabbedObj = null, cardTimeout = null;

canvas.addEventListener('mousedown', e => {
  const pos = getMousePos(e);
  
  card.style.display = 'none';
  if(cardTimeout) clearTimeout(cardTimeout);
  
  if(Math.abs(gemini.x - pos.x) < 50 && Math.abs(gemini.y - pos.y) < 50) {
    if(gemini.state === 'stuck' || gemini.state === 'frenzy') {
      gemini.state = 'idle'; gemini.timer = 3000; gemini.emo = '=_='; 
      let golds = trashes.filter(t => t.isGolden);
      if(golds.length >= 4) {
         let idx = trashes.findIndex(t => t.isGolden);
         if(idx > -1) trashes.splice(idx, 1);
      }
      trashes.push(new Trash(gemini.x, gemini.y+10, 0, -2, true));
      return; 
    } else {
      if(Math.random() < 0.15) {
        gemini.state = 'stuck'; gemini.timer = 5000; gemini.emo = 'X(';
        if(gemini.rider) { gemini.rider.riding = false; gemini.rider.vy = -2; gemini.rider = null; }
      }
      return;
    }
  }
  
  for(let i=cats.length-1; i>=0; i--) {
    let c = cats[i];
    let hitRadius = c.type === 'black' || c.type === 'grey' ? 60 : 40;
    if(Math.abs(c.x-pos.x) < hitRadius && Math.abs(c.y-pos.y) < hitRadius) {
      if(c.state === 'sleep_bed' || c.state === 'sit_box' || c.state === 'climb' || c.state === 'sit_tree' || c.state === 'in_bin' || c.state === 'scratch_tree') {
        c.state = 'idle'; c.targetObj = null; c.climbY = 0;
      } else {
        c.state = 'grabbed'; c.ox = c.x - pos.x; c.oy = c.y - pos.y;
      }
      grabbedObj = c; return;
    }
  }

  for(let i=furnitures.length-1; i>=0; i--) {
    let f = furnitures[i];
    if(Math.abs(f.x-pos.x) < f.w/2 && Math.abs(f.y-pos.y) < f.h/2) {
      if(f.t === 'bed' || f.t === 'box' || f.t === 'tree') {
        if(f.t === 'bed' && f.occupant && f.occupant.state === 'sleep_bed') {
          f.occupant.state = 'idle'; f.occupant = null;
        } else if(f.t === 'box' && f.occupant && f.occupant.state === 'sit_box') {
          f.occupant.state = 'idle'; f.occupant = null;
        } else if(f.t === 'tree' && f.occupant && (f.occupant.state === 'climb' || f.occupant.state === 'sit_tree')) {
          f.occupant.state = 'idle'; f.occupant = null;
        }
      }
      grabbedObj = f; f.ox = f.x - pos.x; f.oy = f.y - pos.y; return;
    }
  }

  for(let i=trashes.length-1; i>=0; i--) {
    let t = trashes[i];
    if(Math.abs(t.x-pos.x) < t.w/2 && Math.abs(t.y-pos.y) < t.h/2) {
      if(t.isGolden) {
        gemini.state = 'happy'; gemini.timer = 2000; gemini.emo = '^_^';
        trashes.splice(i,1); return;
      } else {
        t.eaten = true; return;
      }
    }
  }
});

canvas.addEventListener('mouseup', () => {
  if(grabbedObj) {
    if(grabbedObj instanceof Cat) {
      if(grabbedObj.state === 'grabbed') {
        let onFloor = false;
        for(let f of furnitures) {
          if(f.t === 'bed' && Math.abs(f.x - grabbedObj.x) < 80 && Math.abs(f.y - grabbedObj.y) < 80) {
            f.occupant = grabbedObj; grabbedObj.state = 'sleep_bed'; onFloor = true; break;
          }
          if(f.t === 'box' && Math.abs(f.x - grabbedObj.x) < 60 && Math.abs(f.y - grabbedObj.y) < 60) {
            f.occupant = grabbedObj; grabbedObj.state = 'sit_box'; onFloor = true; break;
          }
          if(f.t === 'tree' && Math.abs(f.x - grabbedObj.x) < 130 && Math.abs(f.y - grabbedObj.y) < 130) {
            grabbedObj.state = 'climb'; onFloor = true; break;
          }
        }
        if(!onFloor) grabbedObj.state = 'idle';
      }
    } else if(grabbedObj.t) {
      let onFloor = false;
      for(let f of furnitures) {
        if(f.t === 'bed' && Math.abs(f.x - grabbedObj.x) < 80 && Math.abs(f.y - grabbedObj.y) < 80 && !f.occupant) {
          f.x = grabbedObj.x; f.y = grabbedObj.y; onFloor = true; break;
        }
        if(f.t === 'box' && Math.abs(f.x - grabbedObj.x) < 60 && Math.abs(f.y - grabbedObj.y) < 60 && !f.occupant) {
          f.x = grabbedObj.x; f.y = grabbedObj.y; onFloor = true; break;
        }
        if(f.t === 'tree' && Math.abs(f.x - grabbedObj.x) < 130 && Math.abs(f.y - grabbedObj.y) < 130 && !f.occupant) {
          f.x = grabbedObj.x; f.y = grabbedObj.y; onFloor = true; break;
        }
      }
      if(!onFloor) {
        furnitures = furnitures.filter(ff => ff !== grabbedObj);
      }
    }
    grabbedObj = null;
  }
});

// 其余原有代码保持不变（drawRoom、drawFurnitures、furnitures数组、updateWeather等全部保留）
