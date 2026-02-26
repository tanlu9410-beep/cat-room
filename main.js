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
      if(grabbedObj.climbY !== undefined) grabbedObj.climbY = 0; 
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
  
  let entities = [...furnitures, ...trashes, ...cats, gemini];
  
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
    else if(e instanceof GeminiBot) e.update(dt, cats, trashes);
  });
  
  entities.forEach(e => {
    if(e instanceof Cat || e instanceof Trash || e instanceof GeminiBot) e.draw();
    else { let old = furnitures; furnitures = [e]; drawFurnitures(); furnitures = old; }
  });
  
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

const card = document.getElementById('card');
let grabbedObj = null, cardTimeout = null;

canvas.addEventListener('mousedown', e => {
  const pos = getMousePos(e);
  
  card.style.display = 'none';
  if(cardTimeout) clearTimeout(cardTimeout);
  
  // 扫地机交互：可以搬运，也有小概率直接被你点翻车
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
      if(Math.random() < 0.15) { // 15%概率平地摔
        gemini.state = 'stuck'; gemini.timer = 5000; gemini.emo = 'X(';
        if(gemini.rider) { gemini.rider.riding = false; gemini.rider.vy = -2; gemini.rider = null; }
        return;
      } else { // 85%概率被拖拽搬运
        grabbedObj = gemini; gemini.isGrabbed = true; gemini.ox = gemini.x - pos.x; gemini.oy = gemini.y - pos.y;
        if(gemini.rider) { gemini.rider.riding = false; gemini.rider.vy = -2; gemini.rider = null; }
        e.preventDefault(); 
        return;
      }
    }
  }
  
  for(let i=cats.length-1; i>=0; i--) {
    let c = cats[i];
    let hitRadius = c.type === 'black' || c.type === 'grey' ? 60 : 40;
    if(Math.abs(c.x-pos.x)<hitRadius && Math.abs((c.y+c.climbY)-pos.y)<hitRadius) { 
      grabbedObj = c; c.isGrabbed = true; c.riding = false; 
      e.preventDefault(); 
      return; 
    }
  }
  for(let i=furnitures.length-1; i>=0; i--) {
    let f = furnitures[i];
    if(Math.abs(f.x-pos.x)<f.w*2 && Math.abs(f.y-pos.y)<f.h*2) { 
      grabbedObj = f; f.isGrabbed = true; f.ox = f.x-pos.x; f.oy = f.y-pos.y; 
      e.preventDefault(); 
      return; 
    }
  }
  
  const clickedTrash = trashes.find(t=>!t.scattered && Math.abs(t.x-pos.x)<25 && Math.abs(t.y-pos.y)<25);
  if(clickedTrash) {
    const lib = clickedTrash.isGolden ? goldenLibrary : trashLibrary;
    const item = lib[Math.floor(Math.random()*lib.length)];
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
    cardTimeout = setTimeout(()=>card.style.display='none', 5000);
  }
});

window.addEventListener('mouseup', e => { 
  if(grabbedObj) { 
    grabbedObj.isGrabbed = false; 
    
    if(grabbedObj instanceof GeminiBot) {
       grabbedObj.state = 'idle'; grabbedObj.timer = 2000;
    }
    else if(grabbedObj instanceof Cat) {
      grabbedObj.state = 'wander'; 
      grabbedObj.climbY = 0; 
      grabbedObj.timer = 1500; // 强制留出1.5秒寻路时间，防止它落地就直接睡着
      
      let closest = null; let minDist = 60;
      let busyStates = ['sleep_bed', 'sit_box', 'sit_tree', 'climb', 'in_bin', 'window', 'hide', 'scratch_tree', 'sniff', 'groom', 'chase_cat'];
      
      cats.forEach(other => {
        // 核心修复：绝对不打扰正在忙（比如爬树、趴窝）的猫
        if(other !== grabbedObj && !other.isGrabbed && !busyStates.includes(other.state)) {
           let d = Math.hypot(grabbedObj.x - other.x, grabbedObj.y - other.y);
           if(d < minDist) { minDist = d; closest = other; }
        }
      });
      
      if(closest) {
         grabbedObj.state = 'sniff'; closest.state = 'sniff';
         grabbedObj.timer = 1500; closest.timer = 1500;
         grabbedObj.setEmo('❓'); closest.setEmo('❓');
         
         setTimeout(() => {
            if(!grabbedObj.isGrabbed && !closest.isGrabbed) {
               if(Math.random() < 0.5) {
                  grabbedObj.state = 'groom'; closest.state = 'groom';
                  grabbedObj.timer = 4000; closest.timer = 4000;
                  grabbedObj.x = closest.x - 15; grabbedObj.y = closest.y;
                  grabbedObj.vx = -1; closest.vx = 1;
                  grabbedObj.setEmo('♥', 3000); closest.setEmo('♥', 3000);
               } else {
                  grabbedObj.state = 'chase_cat'; grabbedObj.targetObj = closest;
                  grabbedObj.timer = 3000; grabbedObj.setEmo('💢', 1000);
                  closest.state = 'wander'; closest.vx = (Math.random()-0.5)*5; closest.vy = (Math.random()-0.5)*5;
               }
            }
         }, 1500);
      }
    }
    grabbedObj = null; 
  } 
});
