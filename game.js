let scene, camera, renderer;
let player, forwardSpeed = 0.9, score = 0, tokens = 0, running = false, lastTime;
let objects = [], particleGroup;
let highs = [];
let slowModeActive = 1.0;

const scoreEl = document.getElementById('scoreEl');
const tokensEl = document.getElementById('tokensEl');
const highEl = document.getElementById('highEl');
const messageBox = document.getElementById('messageBox');

init();

function init() {
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
  renderer = new THREE.WebGLRenderer({antialias:true});
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  // Neon path
  const pathGeo = new THREE.PlaneGeometry(10, 1000, 50, 50);
  const pathMat = new THREE.MeshBasicMaterial({color:0x0ff, wireframe:true});
  const pathMesh = new THREE.Mesh(pathGeo, pathMat);
  pathMesh.rotation.x = -Math.PI/2;
  pathMesh.position.z = -500;
  scene.add(pathMesh);

  // Player
  const geom = new THREE.SphereGeometry(0.5, 16,16);
  const mat = new THREE.MeshBasicMaterial({color:0xff0, wireframe:true});
  const mesh = new THREE.Mesh(geom, mat);
  mesh.position.set(0,0.5,0);
  scene.add(mesh);
  player = {mesh, vy:0, onGround:true, x:0, z:0};

  // Particles
  particleGroup = new THREE.Group();
  scene.add(particleGroup);

  camera.position.set(0,5,10);
  camera.lookAt(0,0,0);

  window.addEventListener('resize', onResize);
  document.getElementById('btnStart').addEventListener('click', startRun);
  document.getElementById('btnPause').addEventListener('click', ()=>{ running=!running; });
  window.addEventListener('keydown', e=>{ if(e.code==='Space') jump(); });
  
  animate();
}

function onResize(){
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth/window.innerHeight;
  camera.updateProjectionMatrix();
}

function jump(){
  if(player.onGround){ player.vy = 0.3; player.onGround=false; }
}

function startRun(){
  objects.forEach(o=>scene.remove(o.mesh));
  objects = [];
  score = 0; tokens = 0;
  running = true; lastTime = performance.now();
  player.mesh.position.set(0,0.5,0); player.vy=0; player.onGround=true;
}

function spawnObject(){
  const type = Math.random()<0.7?'coin':'obs';
  const mesh = type==='coin'?
    new THREE.Mesh(new THREE.TetrahedronGeometry(0.3), new THREE.MeshBasicMaterial({color:0xff0, wireframe:true})) :
    new THREE.Mesh(new THREE.BoxGeometry(1,1,1), new THREE.MeshBasicMaterial({color:0xff00ff, wireframe:true}));
  mesh.position.set((Math.random()-0.5)*6,0.5, player.mesh.position.z - Math.random()*30 - 10);
  scene.add(mesh);
  objects.push({mesh,type});
}

function updateObjects(dt){
  for(let i=objects.length-1;i>=0;i--){
    const o = objects[i];
    o.mesh.position.z += forwardSpeed * dt * 60 * slowModeActive;
    if(o.mesh.position.z>5){ scene.remove(o.mesh); objects.splice(i,1); continue; }

    // collision
    const dist = o.mesh.position.clone().sub(player.mesh.position).length();
    if(dist<0.7){
      if(o.type==='coin'){ tokens++; scene.remove(o.mesh); objects.splice(i,1); showMsg('+1 Token'); }
      else { failRun(); return; }
    }
  }
}

function updatePlayer(dt){
  player.vy -= 0.02*dt*60;
  player.mesh.position.y += player.vy*dt*60;
  if(player.mesh.position.y<0.5){ player.mesh.position.y=0.5; player.vy=0; player.onGround=true; }

  // sliding left-right
  if(window.keyLeft) player.mesh.position.x -= dt*6;
  if(window.keyRight) player.mesh.position.x += dt*6;

  // fall off path
  if(Math.abs(player.mesh.position.x)>5){ failRun(); }
}

function failRun(){
  running=false;
  showMsg('Run Ended!');
  objects.forEach(o=>scene.remove(o.mesh));
  objects=[];
}

function showMsg(txt){
  messageBox.textContent=txt;
  messageBox.style.display='block';
  setTimeout(()=>{ messageBox.style.display='none'; }, 1500);
}

function animate(ts){
  requestAnimationFrame(animate);
  if(!lastTime) lastTime=ts;
  const dt = (ts-lastTime)/1000; lastTime=ts;

  if(running){
    // spawn objects periodically
    if(Math.random()<0.03) spawnObject();

    score += dt*10;
    scoreEl.textContent = Math.floor(score);
    tokensEl.textContent = tokens;

    updateObjects(dt);
    updatePlayer(dt);

    // camera follows player
    camera.position.z = player.mesh.position.z + 10;
    camera.position.x += (player.mesh.position.x - camera.position.x)*0.1;
  }

  // rotate player
  player.mesh.rotation.x += dt*5;
  player.mesh.rotation.y += dt*5;

  renderer.render(scene, camera);
}

// simple key tracking
window.keyLeft=false; window.keyRight=false;
window.addEventListener('keydown', e=>{ if(e.code==='ArrowLeft') window.keyLeft=true; if(e.code==='ArrowRight') window.keyRight=true; });
window.addEventListener('keyup', e=>{ if(e.code==='ArrowLeft') window.keyLeft=false; if(e.code==='ArrowRight') window.keyRight=false; });
