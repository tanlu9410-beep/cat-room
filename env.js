const W = 800, H = 600;
const canvas = document.getElementById('c');
const ctx = canvas.getContext('2d');

const trashLibrary = [ 
  { c: "猫的呼噜声频率在20-140赫兹之间，能促进骨骼愈合。", a: "🦴 喵星医疗学" }, 
  { c: "《塞尔达传说》的灵感来自宫本茂小时候在京都野外探索的经历。", a: "🗡️ 海拉鲁拾遗" }, 
  { c: "你今天很棒。如果没人跟你说，那纸团告诉你。", a: "📄 揉皱的纸团" }
];
const goldenLibrary = [
  { c: "01001000 01001001... 嗝！系统过载吐出的陈年旧码。", a: "⚠️ 扫地机反刍物" },
  { c: "扫地机器人日记：今天又被奶牛猫逼疯了，但白猫摸了我的头。", a: "🤖 AI核心日记" }
];

let weather = 'sunny'; 
let weatherTimer = 5000;
let particles = [];
let trashes = []; 

function updateWeather(dt) {
  weatherTimer -= dt;
  if (weatherTimer <= 0) {
    const ws = ['sunny', 'rain', 'snow'];
    weather = ws[Math.floor(Math.random() * ws.length)];
    weatherTimer = 15000 + Math.random() * 10000;
    particles = [];
  }
  
  if (weather === 'rain') {
    if (Math.random() < 0.5) particles.push({ x: 150 + Math.random()*500, y: 50, vy: 10 + Math.random()*5, l: 15 });
  } else if (weather === 'snow') {
    if (Math.random() < 0.2) particles.push({ x: 150 + Math.random()*500, y: 50, vy: 1 + Math.random(), vx: (Math.random()-0.5)*2, l: 3 });
  }

  particles.forEach(p => { p.y += p.vy; if(p.vx) p.x += p.vx; });
  particles = particles.filter(p => p.y < 350);
}

function drawRoom() {
  ctx.fillStyle = '#3a332a'; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#2b251e'; ctx.fillRect(0, 0, W, 180);
  ctx.strokeStyle = '#251f19'; ctx.lineWidth = 2;
  for(let y=220; y<H; y+=50) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
  
  ctx.fillStyle = '#1a202c'; ctx.fillRect(150, 40, 500, 300);
  ctx.save(); ctx.beginPath(); ctx.rect(150, 40, 500, 300); ctx.clip();
  if (weather === 'sunny') {
    ctx.fillStyle = '#2c405a'; ctx.fillRect(150, 40, 500, 300);
    ctx.fillStyle = 'rgba(255,255,200,0.1)';
    ctx.beginPath(); ctx.moveTo(150,40); ctx.lineTo(400,340); ctx.lineTo(150,340); ctx.fill();
  } else if (weather === 'rain') {
    ctx.strokeStyle = 'rgba(150, 180, 220, 0.4)'; ctx.lineWidth = 1;
    particles.forEach(p => { ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x-3, p.y+p.l); ctx.stroke(); });
  } else if (weather === 'snow') {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    particles.forEach(p => { ctx.beginPath(); ctx.arc(p.x, p.y, p.l, 0, Math.PI*2); ctx.fill(); });
  }
  ctx.restore();
  ctx.strokeStyle = '#1e1814'; ctx.lineWidth = 10; ctx.strokeRect(150, 40, 500, 300);
  ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(400, 40); ctx.lineTo(400, 340); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(150, 150); ctx.lineTo(650, 150); ctx.stroke();
}

function drawShadow(w, h) {
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath(); ctx.ellipse(0, 0, w, h, 0, 0, Math.PI*2); ctx.fill();
}

class Trash {
  constructor(x,y,vx,vy,isGolden=false) { 
    this.x=x; this.y=y; this.vx=vx||0; this.vy=vy||0; 
    this.scattered=false; this.pieces=[]; this.isGolden=isGolden;
  }
  scatter() { 
    this.scattered=true; 
    for(let i=0;i<4;i++) this.pieces.push({x:this.x+(Math.random()-0.5)*40, y:this.y+(Math.random()-0.5)*40}); 
  }
  update() {
    if(this.scattered) return;
    this.x += this.vx; this.y += this.vy;
    this.vx *= 0.92; this.vy *= 0.92;
    if(this.y < 350) { this.y=350; this.vy*=-0.5; }
    if(this.y > H-40) { this.y=H-40; this.vy*=-0.5; }
    if(this.x < 40) { this.x=40; this.vx*=-0.5; }
    if(this.x > W-40) { this.x=W-40; this.vx*=-0.5; }
  }
  draw() {
    ctx.save(); ctx.translate(this.x,this.y); ctx.scale(1.5,1.5);
    if(this.scattered) {
      ctx.fillStyle=this.isGolden?'#e8ca58':'#b0b0b0'; 
      this.pieces.forEach(p=>{
        ctx.save(); ctx.translate(p.x-this.x, p.y-this.y); ctx.rotate(Math.random());
        ctx.fillRect(-3,-2,6,4); ctx.restore();
      });
    } else {
      drawShadow(8, 4); ctx.translate(0, -5);
      ctx.fillStyle=this.isGolden?'#ffd700':'#e0e0e0'; 
      ctx.beginPath(); ctx.arc(0,0,8,0,Math.PI*2); ctx.fill();
      ctx.strokeStyle=this.isGolden?'#b8860b':'#a0a0a0'; ctx.lineWidth=1;
      ctx.beginPath(); ctx.moveTo(-4,-3); ctx.lineTo(4,2); ctx.moveTo(-3,4); ctx.lineTo(4,-3); ctx.stroke();
    }
    ctx.restore();
  }
}

let furnitures = [
  { t:'bed', x:W-180, y:H-100, w:50, h:25, ox:0, oy:0, state:'normal' },
  { t:'yarn', x:W-300, y:H-80, w:20, h:20, ox:0, oy:0, vx:0, vy:0, state:'normal' },
  { t:'box', x:W-100, y:H-160, w:45, h:35, ox:0, oy:0, state:'normal' },
  { t:'tree', x:120, y:H-180, w:40, h:80, ox:0, oy:0, state:'normal' },
  { t:'bin', x:W-250, y:H-200, w:25, h:30, ox:0, oy:0, state:'up' }
];

function drawFurnitures() {
  furnitures.forEach(f => {
    if(f.t === 'yarn' && !f.isGrabbed) {
      f.x += f.vx; f.y += f.vy; f.vx *= 0.96; f.vy *= 0.96;
      if(f.x < 40) { f.x=40; f.vx *= -1; } if(f.x > W-40) { f.x=W-40; f.vx *= -1; }
      if(f.y < 350) { f.y=350; f.vy *= -1; } if(f.y > H-40) { f.y=H-40; f.vy *= -1; }
    }
    
    ctx.save(); ctx.translate(f.x, f.y); ctx.scale(1.8, 1.8);
    if(f.t === 'bed') {
      if(!f.isGrabbed) drawShadow(30, 15);
      ctx.fillStyle='#4a6b8c'; ctx.beginPath(); ctx.ellipse(0,-3, 28, 14, 0, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle='#658bad'; ctx.beginPath(); ctx.ellipse(0,-6, 20, 9, 0, 0, Math.PI*2); ctx.fill();
    } else if(f.t === 'box') {
      if(!f.isGrabbed) drawShadow(25, 12);
      ctx.fillStyle='#8b6a47'; ctx.fillRect(-20,-5,40,25); 
      ctx.fillStyle='#503c28'; ctx.fillRect(-20,-18,40,13); 
      ctx.fillStyle='#9e7a54'; 
      ctx.fillRect(-20,-24,40,6); 
      ctx.fillRect(-20,-5,40,6);  
      ctx.fillRect(-26,-18,6,13); 
      ctx.fillRect(20,-18,6,13);  
    } else if(f.t === 'tree') {
      if(!f.isGrabbed) drawShadow(25, 12);
      ctx.fillStyle='#9e8d73'; ctx.fillRect(-20,5,40,8);
      ctx.fillStyle='#b8a992'; ctx.fillRect(-6,-40,12,50); 
      ctx.strokeStyle='#8c7d65'; ctx.lineWidth=1;
      for(let i=-38; i<10; i+=3) { ctx.beginPath(); ctx.moveTo(-6,i); ctx.lineTo(6,i+2); ctx.stroke(); }
      ctx.fillStyle='#9e8d73'; ctx.fillRect(-22,-45,44,6); 
    } else if(f.t === 'yarn') {
      if(!f.isGrabbed) drawShadow(12, 6);
      ctx.rotate(f.x * 0.05); 
      ctx.fillStyle='#b84d4d'; ctx.beginPath(); ctx.arc(0,-6,10,0,Math.PI*2); ctx.fill();
      ctx.strokeStyle='#913636'; ctx.lineWidth=1.5;
      ctx.beginPath(); ctx.moveTo(-6,-10); ctx.lineTo(5,0); ctx.moveTo(3,-11); ctx.lineTo(-5,0); ctx.stroke();
    } else if(f.t === 'bin') {
      if(!f.isGrabbed && f.state === 'up') drawShadow(16, 8);
      if(f.state === 'down') { ctx.translate(0, 5); ctx.rotate(-Math.PI/2); }
      ctx.fillStyle='#5c6666'; ctx.fillRect(-12,-22,24,24);
      ctx.fillStyle='#737f80'; ctx.beginPath(); ctx.ellipse(0,-22, 12, 5, 0, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle='#cfd6d6'; ctx.fillRect(-5,-26,8,8); ctx.fillRect(-2,-24,10,6);
    }
    ctx.restore();
  });
}
