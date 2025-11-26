<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Infinite Runner</title>
<style>
  body { margin:0; overflow:hidden; background:black; color:white; font-family:sans-serif; }
  #ui { position:absolute; top:10px; left:10px; z-index:10; }
  #scoreEl, #tokensEl { margin-right:15px; }
  button { margin:5px; padding:5px 10px; }
  #messageBox { position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); padding:10px 20px; font-size:18px; border-radius:6px; display:none; }
</style>
</head>
<body>

<div id="ui">
  <span id="scoreEl">0</span>
  <span id="tokensEl">0</span>
  <button id="btnStart">Start</button>
  <button id="btnPause">Pause</button>
</div>
<div id="messageBox"></div>

<script src="https://cdn.jsdelivr.net/npm/three@0.155.0/build/three.min.js"></script>
<script>

window.onload = function(){

// --- Variables ---
let scene, camera, renderer;
let player, objects=[], particleGroup;
let running=false, score=0, tokens=0, lastTime=0, forwardSpeed=0.9, spawnTimer=0.2;
let slowModeActive = 1.0;
const messageBox = document.getElementById('messageBox');
const scoreEl = document.getElementById('scoreEl');
const tokensEl = document.getElementById('tokensEl');

// --- Scene setup ---
scene = new THREE.Scene();
camera = new THREE.PerspectiveCamera(60, window.innerWidth/window.innerHeight, 0.1, 100);
camera.position.set(0, 2, 6);

renderer = new THREE.WebGLRenderer({ antialias:true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// --- Neon-style path ---
const pathMat = new THREE.LineBasicMaterial({ color:0x00ffff });
const pathGeo = new THREE.BufferGeometry().setFromPoints([ new THREE.Vector3(-2,0,0), new THREE.Vector3(2,0,-50) ]);
const path = new THREE.Line(pathGeo, pathMat);
scene.add(path);

// --- Player ---
player = {
  mesh: new THREE.Mesh(new THREE.SphereGeometry(0.3,16,16), new THREE.MeshStandardMaterial({ color:0xff00ff })),
  position: new THREE.Vector3(0,0,0),
  vy:0,
  onGround:true,
};
scene.add(player.mesh);

// --- Lights ---
const ambient = new THREE.AmbientLight(0xffffff,0.5);
scene.add(ambient);
const point = new THREE.PointLight(0xffffff,1);
point.position.set(0,5,5);
scene.add(point);

// --- Particle group ---
particleGroup = new THREE.Group();
scene.add(particleGroup);

// --- Utility functions ---
function showMessage(txt,color='#0ff',ttl=1600){
  messageBox.style.display='block';
  messageBox.textContent = txt;
  messageBox.style.color = color;
  setTimeout(()=>{ messageBox.style.display='none'; }, ttl);
}

// --- Start run ---
function startRun(){
  objects.forEach(o=>scene.remove(o.mesh));
  objects=[];
  score=0; scoreEl.textContent='0';
  tokens=0; tokensEl.textContent='0';
  forwardSpeed=0.9;
  spawnTimer=0.2;
  player.mesh.position.set(0,0,0); player.vy=0; player.onGround=true;
  running=true;
  lastTime = performance.now();
  showMessage('Run started','#0ff');
}

// --- Update world ---
function updateWorld(delta){
  if(!running) return;

  const move = forwardSpeed * delta * 60 * slowModeActive;
  player.mesh.position.z -= move; // downhill effect

  // spawn coins randomly
  spawnTimer -= delta;
  if(spawnTimer<=0){
    spawnTimer = 0.4 + Math.random()*0.3;
    const coin = new THREE.Mesh(new THREE.TorusGeometry(0.15,0.05,8,16), new THREE.MeshStandardMaterial({ color:0xffff00 }));
    coin.position.set((Math.random()-0.5)*3,0.2,player.mesh.position.z-10);
    scene.add(coin);
    objects.push({ mesh:coin, type:'coin' });
  }

  // check falling
  if(Math.abs(player.mesh.position.x) > 5){
    running=false;
    showMessage('You fell! Restart','#f00');
  }

  score += move*0.2;
  scoreEl.textContent = Math.floor(score);
}

// --- Animate ---
function renderLoop(ts){
  if(!lastTime) lastTime=ts;
  const delta = Math.min(0.08,(ts-lastTime)/1000);
  lastTime = ts;

  if(running){
    updateWorld(delta);
    // simple gravity
    if(!player.onGround){ player.vy -= 0.03*delta*60; player.mesh.position.y += player.vy*delta*60; if(player.mesh.position.y<=0){ player.mesh.position.y=0; player.vy=0; player.onGround=true; } }
  }

  renderer.render(scene,camera);
  requestAnimationFrame(renderLoop);
}
requestAnimationFrame(renderLoop);

// --- Controls ---
window.addEventListener('keydown', (e)=>{
  if(e.code==='ArrowLeft') player.mesh.position.x -= 0.2;
  if(e.code==='ArrowRight') player.mesh.position.x += 0.2;
  if(e.code==='Space'){ if(player.onGround){ player.vy=0.4; player.onGround=false; } }
});

document.getElementById('btnStart').onclick = startRun;
document.getElementById('btnPause').onclick = ()=>{ running=!running; showMessage(running?'Resumed':'Paused'); };

// --- Resize ---
window.addEventListener('resize',()=>{ renderer.setSize(window.innerWidth, window.innerHeight); camera.aspect=window.innerWidth/window.innerHeight; camera.updateProjectionMatrix(); });

};
</script>
</body>
</html>
