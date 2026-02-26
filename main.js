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
  trashes = trashes.filter(t => !t.eaten); // 清理扫地机吃掉的垃圾
  
  spawnTimer-=dt;
  if(spawnTimer<=0 && trashes.length < 15) {
    trashes.push(new Trash(100+Math.random()*(W-200), 380+Math.random()*(H-420)));
    spawnTimer=4000+Math.random()*5000;
  }
  
  let entities = [...furnitures, ...trashes, ...cats];
  
  // 核心修复：基于真实视觉坐标的物理层级吸附
  entities.sort((a,b) => {
    let ay = a.y, by = b.y;
    
    // 把家具的基础层推远一点
    if(a.t === 'bed' || a.t === 'tree' || a.t === 'box') ay -= 5;
    if(b.t === 'bed' || b.t === 'tree' || b.t === 'box') by -= 5;

    // 如果猫和家具绑定了，直接吸附该家具的Y轴
    if(a instanceof Cat && ['sleep_bed', 'sit_box', 'climb', 'sit_tree', 'in_bin'].includes(a.state) && a.targetObj) {
      ay = a.targetObj.y + 1; // 永远在家具上面（前面）一点点
    }
    if(b instanceof Cat && ['sleep_bed', 'sit_box', 'climb', 'sit_tree', 'in_bin'].includes(b.state) && b.targetObj) {
      by = b.targetObj.y + 1;
    }
    
    // 黑猫偷窥强制藏在背后
    if(a instanceof Cat && a.state === 'hide') ay -= 50; 
    if(b instanceof Cat && b.state === 'hide') by -= 50;
    
    // 被抓起的物体永远在最前
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
  
  // 每次点击全局优先关闭弹窗
  card.style.display = 'none';
  if(cardTimeout) clearTimeout(cardTimeout);
  
  // 点扫地机强制解救宕机
  if(Math.abs(gemini.x - pos.x) < 50 && Math.abs(gemini.y - pos.y) < 50) {
    if(gemini.state === 'stuck') { gemini.state = 'idle'; gemini.timer = 3000; gemini.emo = '=_='; return; }
    if(gemini.state === 'sweep') { gemini.emo = '♥'; }
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
    if(grabbedObj instanceof Cat) {
      grabbedObj.state = 'wander'; 
      grabbedObj.climbY = 0; 
      
      let closest = null; let minDist = 60;
      cats.forEach(other => {
        if(other !== grabbedObj && !other.isGrabbed) {
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
