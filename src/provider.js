class Provider {
  async implement(_) { throw new Error("implement not configured"); }
  async repair(_) { throw new Error("repair not configured"); }
}
class DeterministicPongProvider extends Provider {
  async implement({goal}) {
    return {files:{
      "index.html":`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Gravity Pong</title><link rel="stylesheet" href="style.css"></head><body><main><h1>Gravity Pong</h1><p>W/S or arrows · First to 7 · R restarts</p><canvas id="game" width="900" height="520"></canvas></main><script src="game.js"></script></body></html>`,
      "style.css":`html,body{margin:0;background:#0b1020;color:#eef;font-family:system-ui}main{max-width:920px;margin:24px auto;text-align:center}canvas{width:100%;background:#050814;border:1px solid #334;border-radius:14px}`,
      "game.js":gameSource(false)
    },decision:`Built dependency-free Canvas Pong candidate for: ${goal}`};
  }
  async repair({failures}) { return {files:{"game.js":gameSource(true)},decision:`Repaired: ${failures.join("; ")}`}; }
}
function gameSource(twist) { return `const canvas=document.querySelector("#game"),c=canvas.getContext("2d");
const S={left:210,right:210,ball:{x:450,y:260,vx:5,vy:2},score:[0,0],over:false};
const keys=new Set();addEventListener("keydown",e=>{keys.add(e.key.toLowerCase());if(e.key.toLowerCase()==="r")reset()});addEventListener("keyup",e=>keys.delete(e.key.toLowerCase()));
function reset(){S.left=S.right=210;S.ball={x:450,y:260,vx:(Math.random()>.5?5:-5),vy:2};S.score=[0,0];S.over=false}function serve(d){S.ball={x:450,y:260,vx:5*d,vy:(Math.random()-.5)*5}}
function update(){if(S.over)return;if(keys.has("w")||keys.has("arrowup"))S.left-=7;if(keys.has("s")||keys.has("arrowdown"))S.left+=7;S.left=Math.max(0,Math.min(420,S.left));S.right+=Math.sign(S.ball.y-(S.right+50))*4.2;S.right=Math.max(0,Math.min(420,S.right));
${twist?'const gravityWell={x:450+Math.sin(Date.now()/900)*170,y:260};const dx=gravityWell.x-S.ball.x,dy=gravityWell.y-S.ball.y,d=Math.max(70,Math.hypot(dx,dy));S.ball.vx+=dx/d*.055;S.ball.vy+=dy/d*.055;':''}
S.ball.x+=S.ball.vx;S.ball.y+=S.ball.vy;if(S.ball.y<8||S.ball.y>512)S.ball.vy*=-1;if(S.ball.x<38&&S.ball.x>22&&S.ball.y>S.left&&S.ball.y<S.left+100&&S.ball.vx<0)S.ball.vx*=-1.06;if(S.ball.x>862&&S.ball.x<878&&S.ball.y>S.right&&S.ball.y<S.right+100&&S.ball.vx>0)S.ball.vx*=-1.06;if(S.ball.x<0){S.score[1]++;serve(1)}if(S.ball.x>900){S.score[0]++;serve(-1)}if(Math.max(...S.score)>=7)S.over=true}
function draw(){c.clearRect(0,0,900,520);c.fillStyle="#eef";c.fillRect(24,S.left,12,100);c.fillRect(864,S.right,12,100);c.beginPath();c.arc(S.ball.x,S.ball.y,9,0,7);c.fill();${twist?'const gravityWell={x:450+Math.sin(Date.now()/900)*170,y:260};c.strokeStyle="#7cf";c.beginPath();c.arc(gravityWell.x,gravityWell.y,24,0,7);c.stroke();c.fillStyle="#7cf";c.fillText("GRAVITY WELL",gravityWell.x-42,gravityWell.y-32);':''}c.font="28px system-ui";c.fillStyle="#eef";c.fillText(S.score[0]+" : "+S.score[1],420,38);if(S.over)c.fillText("GAME OVER · R TO RESTART",270,270)}
function loop(){update();draw();requestAnimationFrame(loop)}loop();`; }
module.exports={Provider,DeterministicPongProvider};
