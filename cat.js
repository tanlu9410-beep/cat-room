class Cat {
  constructor(type, x, c) {
    this.type = type; this.x = x; this.y = 400; this.c = c;
    this.state = 'wander'; this.vx=0; this.vy=0; this.timer=0;
    this.emo = null; this.emoTimer = 0;
    this.isGrabbed = false; this.riding = false;
    this.targetObj = null; this.climbY = 0; 
  }
  setEmo(e, time=1500) { this.emo = e; this.emoTimer = time; }
  
  update(dt, cats) {
    if(this.isGrabbed) { this.climbY = 0; return; }
    if(this.emoTimer > 0) this.emoTimer -= dt; else this.emo = null;

    if(this.riding && gemini.state === 'sweep') {
      this.x = gemini.x; this.y = gemini.y - 25;
      if(Math.random()<0.002 || gemini.state !== 'sweep') { this.riding = false; this.vy = -2; gemini.rider = null; }
      return;
    } else { this.riding = false; }

    this.timer -= dt;
    let busy = ['sniff', 'sleep_bed', 'sit_box', 'sit_tree', 'climb', 'in_bin', 'window', 'hide', 'groom', 'belly', 'self_groom'].includes(this.state);
    if(busy && this.timer <= 0) {
      if(this.state === 'in_bin' && this.targetObj) this.y += 30; 
      if(this.state === 'climb') { this.state = 'sit_tree'; this.timer = 8000; this.setEmo('💤', 5000); }
      else if(this.state !== 'sit_tree') { this.state = 'wander'; this.targetObj = null; this.climbY = 0; }
    }

    if(this.state === 'sit_box' && this.targetObj) { this.x = this.targetObj.x; this.y = this.targetObj.y; }
    if(this.state === 'sleep_bed' && this.targetObj) { this.x = this.targetObj.x; this.y = this.targetObj.y - 8; }
    if(this.state === 'sit_tree' && this.targetObj) { this.x = this.targetObj.x; this.y = this.targetObj.y; this.climbY = -85; } 
    
    if(this.state === 'climb' && this.targetObj) {
      this.x = this.targetObj.x; 
      this.climbY -= 0.05 * dt; 
      if(this.climbY <= -85) { this.climbY = -85; this.state = 'sit_tree'; this.timer = 8000; }
      return;
    }
    if(this.state === 'sit_tree') {
      if(Math.random()<0.01 && this.timer % 2000 < 50) this.setEmo(Math.random()<0.5?'♥':'♪', 1000);
      return; 
    }

    // 核心修复：更聪明的全员上车与拒载逻辑
    if(gemini.state === 'sweep' && !this.riding && !gemini.rider && !busy && Math.abs(gemini.x - this.x) < 50 && Math.abs(gemini.y - this.y) < 50) {
      if(Math.random()<0.05) { // 强烈的上车意愿
         let rejectProb = 0;
         if (this.type === 'black' || this.type === 'grey') rejectProb = 0.8; // 大型猫容易被拒
         else if (this.type === 'orange' || this.type === 'cow') rejectProb = 0.4;
         else if (this.type === 'curly') rejectProb = 0.1;

         if (Math.random() < rejectProb) {
             gemini.emo = '💢'; // 扫地机发怒拒载
             this.vx = (this.x > gemini.x ? 1 : -1) * 3; // 猫被弹开
             this.setEmo('❓', 1000);
         } else {
             this.riding = true; gemini.rider = this; this.vx = 0; this.vy = 0;
         }
      }
    }

    if(this.type === 'black') {
      if(!busy && this.state === 'wander' && Math.random()<0.05) {
        let f = furnitures.find(f => ['box', 'bed'].includes(f.t));
        if(f) { this.targetObj = f; this.state = 'hide'; this.timer = 10000; }
      }
      if(this.state === 'hide' && this.targetObj) {
        const dx = this.targetObj.x - this.x, dy = (this.targetObj.y - 15) - this.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        if(dist > 5) { this.vx = (dx/dist)*2; this.vy = (dy/dist)*2; }
        else { this.vx = 0; this.vy = 0; this.x = this.targetObj.x; this.y = this.targetObj.y - 15; }
      }
    }

    if(this.type === 'curly') {
      if(!busy && this.state === 'wander' && Math.random()<0.05) {
        let target = (Math.random()<0.3) ? gemini : cats.find(c => c!==this && !c.isGrabbed && c.y > 350);
        if(target) { this.targetObj = target; this.state = 'cling'; this.timer = 6000; }
      }
      if(this.state === 'cling' && this.targetObj) {
        if(this.timer <= 0) { this.state = 'wander'; this.targetObj = null; }
        else {
          const dx = this.targetObj.x - this.x, dy = this.targetObj.y - this.y;
          const dist = Math.sqrt(dx*dx + dy*dy);
          if(dist < 40) { this.vx = 0; this.vy = 0; this.setEmo('咕噜咕噜', 500); }
          else { this.vx = (dx/dist)*1.5; this.vy = (dy/dist)*1.5; } 
        }
      }
    }
    
    if(this.type === 'white' && this.state === 'wander' && Math.random() < 0.2) {
      trashes.forEach(t => {
        if(!t.scattered && Math.abs(t.x - this.x) < 40 && Math.abs(t.y - this.y) < 30) {
          t.vx += (t.x - this.x) * 0.15; t.vy += (t.y - this.y) * 0.15;
        }
      });
    }

    if(this.state === 'in_bin' && this.targetObj && this.targetObj.state === 'down') {
      this.x = this.targetObj.x; this.y = this.targetObj.y;
      this.targetObj.x -= 1.5; 
      if(this.targetObj.x < 50) this.targetObj.x = 50;
      if(Math.random()<0.02) trashes.push(new Trash(this.x+20, this.y, 2, -2));
      return; 
    }

    if(this.state === 'chase_yarn') {
      let yarn = furnitures.find(f => f.t === 'yarn');
      if(!yarn || this.timer <= 0) { this.state = 'wander'; }
      else {
        const dx = yarn.x - this.x, dy = yarn.y - this.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        if(dist < 30) { yarn.vx += dx * 0.2; yarn.vy += dy * 0.2; this.setEmo('✨', 800); } 
        else { this.vx = (dx/dist)*3; this.vy = (dy/dist)*3; }
      }
    }

    if(this.state === 'chase_cat' && this.targetObj) {
      if(this.timer <= 0) this.state = 'wander';
      else {
        const dx = this.targetObj.x - this.x, dy = this.targetObj.y - this.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        if(dist < 20) this.state = 'wander';
        else { this.vx = (dx/dist)*4; this.vy = (dy/dist)*4; }
      }
    }

    cats.forEach(other => { 
      if(other!==this && !other.isGrabbed && !busy && this.state !== 'chase_cat' && this.state !== 'chase_yarn' && this.state !== 'hide' && this.state !== 'cling'){ 
        const dx=this.x-other.x, dy=this.y-other.y, dist=Math.sqrt(dx*dx+dy*dy); 
        if(dist<40 && this.state==='wander' && other.state==='wander' && Math.random()<0.02) {
          this.state = 'sniff'; other.state = 'sniff'; this.timer = 1500; other.timer = 1500; this.vx=0; other.vx=0;
          this.setEmo('❓'); other.setEmo('❓');
          
          setTimeout(() => {
            if(!this.isGrabbed && !other.isGrabbed) {
              if(Math.random() < 0.4) {
                this.state = 'groom'; other.state = 'groom'; 
                this.timer = 4000; other.timer = 4000;
                this.x = other.x - 15; this.y = other.y; this.vx = -1; other.vx = 1; 
                this.setEmo('♥', 3000); other.setEmo('♥', 3000);
              } else if(Math.random() < 0.5) {
                this.state = 'chase_cat'; this.targetObj = other; this.timer = 3000; this.setEmo('💢', 1000);
                other.state = 'wander'; other.vx = (Math.random()-0.5)*5; other.vy = (Math.random()-0.5)*5;
              }
            }
          }, 1500);
        } else if(dist<25){ this.x+=dx*0.05; this.y+=dy*0.05; } 
      } 
    });

    // 统天空闲行为分配：优化随机权重，确保舔毛和翻肚皮稳定出现
    if(!busy && this.state === 'wander' && !['curly', 'black', 'cow'].includes(this.type)) {
      if(this.timer <= 0) {
        let r = Math.random();
        if (this.type === 'grey' && r < 0.35) {
           this.state = 'self_groom'; this.timer = 4000; this.vx = 0; this.vy = 0;
        } else if (this.type === 'orange' && r < 0.35) {
           this.state = 'belly'; this.timer = 4000; this.vx = 0; this.vy = 0;
        } else if (r < 0.15) {
           this.state = 'sleep'; this.timer = 3000; this.setEmo('💤', 3000); this.vx = 0; this.vy = 0;
        } else {
           const a = Math.random()*Math.PI*2; this.vx = Math.cos(a)*1.5; this.vy = Math.sin(a)*0.8; this.timer = 2000;
        }
      }
    }

    if(this.state === 'wander' && Math.random() < 0.05 && this.type !== 'black' && this.type !== 'curly') {
      let f = furnitures.find(f => Math.abs(f.x - this.x) < 50 && Math.abs(f.y - this.y) < 50);
      if(f) {
        if(f.t === 'bed' && Math.random()<0.4) { this.state = 'sleep_bed'; this.targetObj = f; this.timer = 8000; this.setEmo('💤', 8000); }
        else if(f.t === 'box' && Math.random()<0.5) { this.state = 'sit_box'; this.targetObj = f; this.timer = 6000; }
        else if(f.t === 'tree' && Math.random()<0.4) { this.state = 'climb'; this.targetObj = f; this.x = f.x; this.timer = 3000; this.climbY = 0; }
        else if(f.t === 'bin' && f.state === 'up' && Math.random()<0.4) { f.state = 'down'; this.state = 'in_bin'; this.targetObj = f; this.timer = 8000; }
        else if(f.t === 'yarn' && Math.random()<0.5) { this.state = 'chase_yarn'; this.timer = 5000; }
      }
      if((weather === 'rain' || weather === 'snow') && Math.random()<0.3 && this.y < 380) {
        this.state = 'window'; this.vx = 0; this.vy = 0; this.timer = 4000; this.setEmo(Math.random()<0.5?'♥':'♪', 2000);
      }
    }

    if(this.type === 'cow' && !busy && this.state === 'wander') {
      if(this.timer<=0) {
        if(Math.random()<0.4) { this.state='zoomies'; this.vx=(Math.random()-0.5)*8; this.vy=(Math.random()-0.5)*3; this.timer=1500; this.setEmo('💢',1500); }
        else { this.vx=(Math.random()-0.5)*1.5; this.vy=(Math.random()-0.5)*0.8; this.timer=1500; }
      }
    } 

    if(!busy && this.state !== 'hide' && this.state !== 'climb') {
      this.x += this.vx * dt * 0.05; this.y += this.vy * dt * 0.05;
      this.x = Math.max(50, Math.min(W-50, this.x));
      this.y = Math.max(350, Math.min(H-40, this.y));
    }
  }
  
  draw() {
    ctx.save(); 
    ctx.translate(this.x, this.y + this.climbY); 
    // 灰猫黑猫全部变大 2.25倍
    let currentScale = (this.type === 'black' || this.type === 'grey') ? 2.25 : 1.5;
    ctx.scale(currentScale, currentScale);
    
    if(this.state === 'window' || this.state === 'climb') { } 
    else if(this.vx<0 && !this.isGrabbed && this.state !== 'in_bin' && this.state !== 'belly') ctx.scale(-1,1);
    
    if(this.state === 'belly') { ctx.scale(1,-1); ctx.translate(0, 4); }
    
    if(this.emo && !this.isGrabbed) { 
      ctx.save(); ctx.scale(this.vx<0?-1:1, 1); 
      ctx.fillStyle='#fff'; ctx.font='14px sans-serif'; 
      if(this.emo === '咕噜咕噜') ctx.font='10px sans-serif';
      ctx.fillText(this.emo, -8, -25); 
      ctx.restore(); 
    }

    if(!this.isGrabbed && !['sleep_bed', 'sit_box', 'sit_tree', 'in_bin', 'climb'].includes(this.state) && this.type !== 'black') drawShadow(12, 5);

    ctx.fillStyle = this.c.body;
    
    if(this.isGrabbed) {
      const kick = Math.sin(Date.now() * 0.04) * 3;
      ctx.fillRect(-6, -4, 12, 18); ctx.fillRect(-6, -12, 12, 10);
      ctx.fillRect(-5, 14, 3, 5+kick); ctx.fillRect(2, 14, 3, 5-kick);
      ctx.fillStyle=this.c.ear; ctx.fillRect(-5, -16, 3, 4); ctx.fillRect(2, -16, 3, 4);
      ctx.fillStyle=this.c.eye; ctx.fillRect(-4, -8, 2, 2); ctx.fillRect(2, -8, 2, 2);
    } else if(this.state === 'in_bin') {
      ctx.save(); ctx.translate(12, 5); ctx.rotate(Math.PI/2);
      ctx.fillRect(-6, -4, 12, 10); 
      ctx.save(); ctx.translate(0, 6); ctx.rotate(Math.sin(Date.now()*0.03)*0.8); ctx.fillRect(-2,0,4,12); ctx.restore(); 
      ctx.restore();
    } else if(this.state === 'sit_box') {
      // 探出开口纸箱：只画前半个头和尾巴
      ctx.fillRect(-6,-16,12,10); 
      ctx.fillStyle=this.c.ear; ctx.fillRect(-5,-20,4,5); ctx.fillRect(1,-20,4,5);
      ctx.fillStyle=this.c.eye; ctx.fillRect(-4,-13,2,2); ctx.fillRect(2,-13,2,2);
      ctx.fillStyle = this.c.body;
      ctx.save(); ctx.translate(16, 0); ctx.rotate(Math.sin(Date.now()*0.01)*0.5); ctx.fillRect(0,0,12,4); ctx.restore(); 
    } else if(this.state === 'sleep_bed' || this.state === 'sit_tree' || this.state === 'sleep') {
      ctx.fillRect(-10,-5,20,12); ctx.fillRect(-8,-12,12,10);
      ctx.fillStyle=this.c.ear; ctx.fillRect(-7,-16,4,5); ctx.fillRect(3,-16,4,5);
      ctx.fillStyle='#1a1a1a'; ctx.fillRect(-5,-8,4,1.5); ctx.fillRect(3,-8,4,1.5);
      if(this.state === 'sit_tree') { 
        ctx.fillStyle = this.c.body;
        ctx.save(); ctx.translate(8, 0); ctx.rotate(Math.PI/2 + Math.sin(Date.now()*0.01)*0.3); ctx.fillRect(0,0,12,4); ctx.restore();
      }
    } else if(this.state === 'window' || this.state === 'climb') {
      ctx.fillRect(-8,-8,16,14); ctx.fillRect(-6,-16,12,10); 
      ctx.fillStyle=this.c.ear; ctx.fillRect(-6,-20,4,5); ctx.fillRect(2,-20,4,5);
      if(this.state === 'climb') {
        const climbBounce = Math.sin(Date.now()*0.02)*3;
        ctx.fillRect(-10, -4+climbBounce, 4, 6); ctx.fillRect(6, -4-climbBounce, 4, 6); 
      } else {
        ctx.fillStyle = this.c.body;
        ctx.save(); ctx.translate(0, 4); ctx.rotate(Math.PI/2 + Math.sin(Date.now()*0.005)*0.2); ctx.fillRect(0,0,14,4); ctx.restore();
      }
    } else if(this.type === 'curly') {
      ctx.fillRect(-10,0,18,8); ctx.fillRect(-7,-10,12,10);
      ctx.fillRect(-14,5,6,3); 
      const moving = Math.abs(this.vx)>0.1 || Math.abs(this.vy)>0.1;
      const bounce = moving ? Math.sin(Date.now()*0.02)*2 : 0;
      ctx.fillRect(2,4,4,5-bounce); ctx.fillRect(6,4,4,5+bounce); 
      ctx.fillStyle=this.c.ear; ctx.fillRect(-7,-14,4,5); ctx.fillRect(3,-14,4,5);
      ctx.fillStyle=this.c.eye; ctx.fillRect(-4,-6,2,2); ctx.fillRect(4,-6,2,2);
      ctx.fillStyle='rgba(200,200,200,0.5)'; ctx.beginPath(); ctx.arc(-2,2,2,0,Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.arc(4,2,2,0,Math.PI*2); ctx.fill();
    } else if(this.type === 'black') {
      if(this.state === 'hide') {
        ctx.fillStyle='#ffe600'; 
        ctx.fillRect(-4,-11,2,2); ctx.fillRect(4,-11,2,2);
      } else {
        ctx.fillRect(-9,-8,18,12); ctx.fillRect(-7,-15,12,10);
        ctx.fillStyle=this.c.ear; ctx.fillRect(-7,-19,4,5); ctx.fillRect(3,-19,4,5);
        ctx.fillStyle='#ffe600'; ctx.fillRect(-4,-11,2,2); ctx.fillRect(4,-11,2,2);
        ctx.fillStyle = this.c.body; ctx.save(); ctx.translate(-8, -3); ctx.rotate(Math.sin(Date.now()*0.01)*0.5); ctx.fillRect(-12, -2, 12, 4); ctx.restore();
      }
    } else if(this.state === 'self_groom') {
      // 灰猫专属：翘起大腿自己舔毛
      ctx.fillRect(-8,-4,16,12); ctx.fillRect(-6,-12,12,10); 
      ctx.fillStyle=this.c.ear; ctx.fillRect(-5,-16,4,5); ctx.fillRect(1,-16,4,5);
      ctx.fillStyle='#1a1a1a'; ctx.fillRect(-4,-7,3,1); ctx.fillRect(1,-7,3,1); 
      ctx.fillStyle = this.c.body;
      ctx.save(); ctx.translate(4, 2); ctx.rotate(-Math.PI/4); ctx.fillRect(0, -10, 4, 12); ctx.restore();
    } else {
      ctx.save();
      if(this.state === 'groom') ctx.translate(0, Math.sin(Date.now()*0.01)*1.5);
      ctx.fillRect(-9,-8,18,12); ctx.fillRect(-7,-15,12,10);
      const moving = Math.abs(this.vx)>0.1 || Math.abs(this.vy)>0.1;
      const bounce = moving ? Math.sin(Date.now()*0.02)*2 : 0;
      ctx.fillRect(-8,4,4,5-bounce); ctx.fillRect(4,4,4,5+bounce);
      ctx.fillStyle=this.c.ear; ctx.fillRect(-7,-19,4,5); ctx.fillRect(3,-19,4,5);
      ctx.fillStyle=this.state==='groom'?'#1a1a1a':this.c.eye; 
      if(this.state==='groom') { ctx.fillRect(-4,-11,3,1); ctx.fillRect(4,-11,3,1); } 
      else { ctx.fillRect(-4,-11,2,2); ctx.fillRect(4,-11,2,2); }
      if(this.type === 'cow') { ctx.fillStyle='#222'; ctx.fillRect(-9,-8,8,6); ctx.fillRect(1,-5,8,7); ctx.fillRect(-7,-15,5,5); }
      
      let tailAngle = 0;
      if(this.type === 'grey') {
        tailAngle = Math.atan2((window.mouseY||H/2) - this.y, (window.mouseX||W/2) - this.x);
        if(this.vx<0 && !this.isGrabbed) tailAngle = Math.PI - tailAngle; 
      } else {
        tailAngle = Math.sin(Date.now()*0.005)*0.5;
      }
      ctx.fillStyle = this.c.body;
      ctx.save(); ctx.translate(-6, -2); ctx.rotate(tailAngle);
      ctx.fillRect(-8, -1, 8, 3); ctx.restore();
      
      ctx.restore();
    }
    ctx.restore();
  }
}

class GeminiBot {
  constructor() {
    this.x = W/2; this.y = H-80; 
    this.vx = 0; this.vy = 0;
    this.state = 'idle'; 
    this.timer = 5000; this.rider = null;
    this.target = null; this.emo = '♪';
    this.emos = ['♥', '✨', '♪', '=_=', '>_<', '🤖'];
    this.cleanMode = false;
  }
  update(dt, cats, trashes) {
    this.timer -= dt;
    let unread = trashes.filter(t => !t.isGolden && !t.eaten);

    if(this.state === 'idle') {
      if(unread.length >= 8 || this.timer <= 0) {
        this.state = 'sweep';
        this.cleanMode = unread.length >= 8;
        this.timer = this.cleanMode ? 99999 : 20000; 
        // 核心修复：给扫地机初速度，让它全向漫游
        let angle = Math.random() * Math.PI * 2;
        let speed = 0.12; 
        this.vx = Math.cos(angle) * speed; this.vy = Math.sin(angle) * speed * 0.5;
        this.emo = this.emos[Math.floor(Math.random()*this.emos.length)];
      }
    }

    if(this.state === 'sweep') {
      let whiteCat = cats.find(c => c.type === 'white');
      let cowCat = cats.find(c => c.type === 'cow');
      
      // 只有开始扫地时，才会主动等待白猫
      if(!this.rider && whiteCat && Math.abs(whiteCat.x - this.x) < 80 && Math.abs(whiteCat.y - this.y) < 50) {
        this.state = 'wait'; this.timer = 3000; this.emo = '♥';
      }
      // 狂暴概率极大幅度下调至0.0001
      else if(cowCat && cowCat.state === 'zoomies' && Math.random()<0.0001) {
        this.state = 'frenzy'; this.target = cowCat; this.emo = '💢';
      }

      // 全向二维移动，背猫时减速
      let speedMult = this.rider ? 0.6 : 1;
      this.x += this.vx * speedMult * dt;
      this.y += this.vy * speedMult * dt;

      // 严格的四壁折返，绝不穿墙
      if(this.x < 50) { this.x = 50; this.vx *= -1; }
      if(this.x > W-50) { this.x = W-50; this.vx *= -1; }
      if(this.y < 350) { this.y = 350; this.vy *= -1; }
      if(this.y > H-40) { this.y = H-40; this.vy *= -1; }

      // 缩小扫地判定范围
      trashes.forEach(t => {
        if(!t.eaten && Math.abs(t.x - this.x) < 40 && Math.abs(t.y - this.y) < 40) {
          t.eaten = true; this.emo = '✨';
        }
      });

      let bin = furnitures.find(f => f.t === 'bin');
      if(bin && bin.state === 'down' && Math.abs(this.x - bin.x) < 50 && Math.abs(this.y - bin.y) < 40) {
        bin.state = 'up'; this.emo = '✨';
        cats.forEach(c => { if(c.state==='in_bin' && c.targetObj===bin) { c.state='wander'; c.y+=20; c.setEmo('❓',1000); } });
      }

      let remain = trashes.filter(t => !t.eaten && !t.isGolden);
      if (this.cleanMode && remain.length <= 3) {
        this.cleanMode = false; this.state = 'idle'; this.timer = 8000; this.emo = '💤';
      } else if (!this.cleanMode && this.timer <= 0) {
        this.state = 'idle'; this.rider = null; this.timer = 8000; this.emo = '💤';
      }
    }
    else if(this.state === 'wait') {
      if(this.timer <= 0) { this.state = 'sweep'; this.emo = '♪'; }
    }
    else if(this.state === 'frenzy') {
      let dx = this.target.x - this.x, dy = this.target.y - this.y;
      let dist = Math.hypot(dx, dy);
      if(dist > 0) { this.x += (dx/dist) * 0.4 * dt; this.y += (dy/dist) * 0.4 * dt; }
      
      // 撞墙必定宕机卡死 30 秒
      if(this.x <= 50 || this.x >= W-50 || this.y <= 350 || this.y >= H-40) {
        this.x = Math.max(50, Math.min(W-50, this.x));
        this.y = Math.max(350, Math.min(H-40, this.y));
        this.state = 'stuck'; this.timer = 30000; this.emo = '×_×';
      }
    }
    else if(this.state === 'stuck') {
      if(this.timer <= 0) {
        // 自动恢复并吐出金色垃圾
        let golds = trashes.filter(t => t.isGolden);
        if(golds.length >= 4) { 
            let idx = trashes.findIndex(t => t.isGolden);
            if (idx > -1) trashes.splice(idx, 1);
        }
        trashes.push(new Trash(this.x, this.y+10, 0, -2, true));
        this.state = 'idle'; this.timer = 5000; this.emo = '=_=';
      }
    }
  }
  
  draw() {
    ctx.save(); ctx.translate(this.x,this.y); ctx.scale(2.0, 2.0); 
    drawShadow(16, 6);
    
    if(this.state === 'stuck') ctx.rotate(Math.sin(Date.now() * 0.05) * 0.2);
    
    let dir = 1;
    if(this.state === 'sweep' || this.state === 'idle') dir = this.vx < 0 ? -1 : 1;
    if(this.state === 'frenzy') dir = this.target && this.target.x < this.x ? -1 : 1;
    if(dir < 0) ctx.scale(-1,1);
    
    let yOffset = (this.state === 'wait') ? 2 : 0;
    ctx.translate(0, yOffset);

    ctx.fillStyle='#5ba4d4'; ctx.fillRect(-10,-10,20,16); ctx.fillStyle='#d0eeff'; ctx.fillRect(-7,-8,14,8);
    ctx.fillStyle=(this.state==='frenzy' || this.state==='stuck')?'#ff0000':'#2060a0'; 
    ctx.fillRect(-5,-6,3,3); ctx.fillRect(2,-6,3,3); 
    
    ctx.fillStyle='#2c3e50'; ctx.fillRect(-9,6,6,4); ctx.fillRect(3,6,6,4);
    ctx.strokeStyle='#8b7355'; ctx.lineWidth=1.5; ctx.beginPath(); ctx.moveTo(10,-2); ctx.lineTo(20,6); ctx.stroke();
    
    ctx.scale(dir<0?-1:1, 1);
    
    // 核心修复：带猫时，表情泡泡抬高防止遮挡
    let emoY = this.rider ? -35 : -15;
    ctx.fillStyle='rgba(60,130,200,0.9)'; ctx.font='bold 10px sans-serif'; 
    ctx.fillText(this.emo, -6, emoY);
    
    ctx.restore();
  }
}
