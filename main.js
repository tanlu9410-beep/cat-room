window.mouseX = W/2; window.mouseY = H/2;

function getMousePos(e) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
}

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
  
  spawnTimer-=dt;
  if(spawnTimer<=0 && trashes.filter(t=>!t.scattered).length<4) {
    trashes.push(new Trash(100+Math.random()*(W-200), 380+Math.random()*(H-420)));
    spawnTimer=4000+Math.random()*5000;
  }
  
  let entities = [...furnitures, ...trashes, ...cats];
  // 复杂的深度排序：涵盖攀爬、箱内、猫窝、掩体后和普通遮挡
  entities.sort((a,b) => {
    let ay = a.y, by = b.y;
    if(a instanceof Cat) {
      if(['sit_box', 'in_bin', 'sleep_bed'].includes(a.state)) ay += 100;
      if(['climb', 'sit_tree'].includes(a.state)) ay += 200; 
      if(a.state === 'hide') ay -= 50; 
    }
    if(b instanceof Cat) {
      if(['sit_box', 'in_bin', 'sleep_bed'].includes(b.state)) by += 100;
      if(['climb', 'sit_tree'].includes(b.state)) by += 200;
      if(b.state === 'hide') by -= 50;
    }
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
  
  if(Math.abs(gemini.x - pos.x) < 50 && Math.abs(gemini.y - pos.y) < 50) {
    if(gemini.state === 'frenzy') { gemini.state = 'idle'; gemini.timer = 3000; gemini.emo = '×_×'; return; }
    if(gemini.state === 'sweep') { gemini.emo = '♥'; }
  }
  
  for(let i=cats.length-1; i>=0; i--) {
    let c = cats[i];
    let hitRadius = c.type === 'black' ? 60 : 40;
    if(Math.abs(c.x-pos.x)<hitRadius && Math.abs((c.y+c.climbY)-pos.y)<hitRadius) { 
      grabbedObj = c; c.isGrabbed = true; c.riding = false; 
      e.preventDefault(); // 关键补丁：阻止浏览器原生选中
      return; 
    }
  }
  for(let i=furnitures.length-1; i>=0; i--) {
    let f = furnitures[i];
    if(Math.abs(f.x-pos.x)<f.w*2 && Math.abs(f.y-pos.y)<f.h*2) { 
      grabbedObj = f; f.isGrabbed = true; f.ox = f.x-pos.x; f.oy = f.y-pos.y; 
      e.preventDefault(); // 关键补丁：阻止浏览器原生选中
      return; 
    }
  }
  const clickedTrash = trashes.find(t=>!t.scattered && Math.abs(t.x-pos.x)<25 && Math.abs(t.y-pos.y)<25);
  if(clickedTrash) {
    const lib = clickedTrash.isGolden ? goldenLibrary : trashLibrary;
    const item = lib[Math.floor(Math.random()*lib.length)];
    document.getElementById('card-content').textContent = item.c;
    document.getElementById('card-author').textContent = item.a;
    
    let cardLeft = e.clientX;
    let cardTop = e.clientY - 20;
    card.style.display = 'block'; 
    const cWidth = card.offsetWidth; const cHeight = card.offsetHeight;
    if(cardLeft + cWidth/2 > window.innerWidth) cardLeft = window.innerWidth - cWidth/2 - 10;
    if(cardLeft - cWidth/2 < 0) cardLeft = cWidth/2 + 10;
    if(cardTop - cHeight < 0) cardTop = cHeight + 10;
    
    card.style.left = cardLeft + 'px';
    card.style.top = cardTop + 'px';
    
    if(cardTimeout) clearTimeout(cardTimeout);
    cardTimeout = setTimeout(()=>card.style.display='none', 4500);
  }
});

// 全局合并鼠标移动监听，保证拖拽极度丝滑
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
      grabbedObj.climbY = 0; // 猫被抓起时脱离Z轴
    }
  } 
});

window.addEventListener('mouseup', e => { 
  if(grabbedObj) { 
    grabbedObj.isGrabbed = false; 
    if(grabbedObj.state) grabbedObj.state = 'wander'; 
    grabbedObj = null; 
  } 
});
