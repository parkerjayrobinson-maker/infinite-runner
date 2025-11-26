/* ------------------- Scene & Camera ------------------- */
const canvas = document.getElementById('gameCanvas');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0x000000);


const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
camera.position.set(0,2,5);


/* ------------------- Lighting ------------------- */
const ambient = new THREE.AmbientLight(0x0ff, 0.5);
scene.add(ambient);
const dirLight = new THREE.DirectionalLight(0x0ff, 1);
dirLight.position.set(5,10,5);
scene.add(dirLight);


/* ------------------- Player ------------------- */
const player = {
  mesh: null, vy:0, onGround:true, shield:false, magnet:false, doubleTokens:false,
  jumpSpeed:0.35
};


function makePlayerMesh(){
  const geo = new THREE.SphereGeometry(0.3,16,16);
  const mat = SKINS.find(s=>s.id===selectedSkin).mat.clone();
  const mesh = new THREE.Mesh(geo, mat);
  mesh.castShadow = true;
  mesh.position.set(0,0,0);
  return mesh;
}


player.mesh = makePlayerMesh();
scene.add(player.mesh);


/* ------------------- Path ------------------- */
const track = new THREE.Group();
scene.add(track);


const trackWidth = 6;
const trackLength = 200;
const pathGeo = new THREE.PlaneGeometry(trackWidth, trackLength, trackLength/2, 1);
const pathMat = new THREE.MeshStandardMaterial({ color: 0x1111ff, emissive: 0x0ff, side: THREE.DoubleSide });
const pathMesh = new THREE.Mesh(pathGeo, pathMat);
pathMesh.rotation.x = -Math.PI/2;
pathMesh.position.z = -trackLength/2;
track.add(pathMesh);


/* ------------------- Game State ------------------- */
let objects = [];
let score = 0;
let tokens = 0;
let highs = [];
let running = false;
let forwardSpeed = 0.15;
let slowModeActive = 1.0;
let lastTime = null;


/* ------------------- Spawn ------------------- */
function makeCoinMesh(){ return new THREE.Mesh(new THREE.TorusGeometry(0.1,0.04,8,16), new THREE.MeshStandardMaterial({ color:0xffff00, emissive:0xffff00 })); }
function makePowerMesh(type){ 
  const color = type==='shield'?0x00ffff:type==='magnet'?0xff0000:type==='double'?0x00ff00:0xff00ff;
  return new THREE.Mesh(new THREE.BoxGeometry(0.25,0.25,0.25), new THREE.MeshStandardMaterial({ color, emissive:color })); 
}
function makeObstacleMesh(){ 
  return new THREE.Mesh(new THREE.BoxGeometry(0.6+Math.random()*0.5,0.6,0.6+Math.random()*0.5), new THREE.MeshStandardMaterial({ color:0xff00ff, emissive:0xff00ff }));
}


function spawnObjects(){
  const z = player.mesh.position.z - 20 - Math.random()*20;
  const x = (Math.random()-0.5)*trackWidth;
  const typeRoll = Math.random();
  let mesh, type;
  if(typeRoll<0.5){ mesh = makeCoinMesh(); type='coin'; }
  else if(typeRoll<0.7){ mesh = makePowerMesh(POWERUPS[Math.floor(Math.random()*POWERUPS.length)].id); type='power'; }
  else{ mesh = makeObstacleMesh(); type='obs'; }
  mesh.position.set(x,0,z);
  scene.add(mesh);
  objects.push({ mesh, type });
}


/* ------------------- Collisions ------------------- */
function checkCollisions(){
  const px = player.mesh.position.x;
  const pz = player.mesh.position.z;
  for(let i=objects.length-1;i>=0;i--){
    const o = objects[i];
    const dx = px - o.mesh.position.x;
    const dz = pz - o.mesh.position.z;
    const dist = Math.sqrt(dx*dx+dz*dz);
    if(dist<0.35){
      if(o.type==='coin'){ tokens++; objects[i].mesh.visible=false; objects.splice(i,1); }
      if(o.type==='power'){ pickupPower(POWERUPS[Math.floor(Math.random()*POWERUPS.length)].id); objects[i].mesh.visible=false; objects.splice(i,1); }
      if(o.type==='obs' && !player.shield){ failRun(); return; }
    }
  }
}


/* ------------------- Pickup Powers ------------------- */
function pickupPower(ptype){
  if(ptype === 'shield'){ player.shield = true; setTimeout(()=>player.shield=false, 10000); }
  if(ptype === 'slow'){ slowModeActive = 0.5; setTimeout(()=>{ slowModeActive=1.0; },8000); }
  if(ptype === 'magnet'){ player.magnet = true; setTimeout(()=>{ player.magnet=false; },10000); }
  if(ptype === 'double'){ player.doubleTokens = true; setTimeout(()=>{ player.doubleTokens=false; },10000); }
}


/* ------------------- Fall check ------------------- */
function checkFall(){
  if(Math.abs(player.mesh.position.x)>trackWidth/2+1 || player.mesh.position.y<-1){
    failRun();
  }
}


/* ------------------- Fail Run ------------------- */
function failRun(){
  running=false;
  alert(`Run ended! Score: ${Math.floor(score)}, Tokens: ${tokens}`);
  score=0;
  tokens=0;
  player.mesh.position.set(0,0,0);
  objects.forEach(o=>scene.remove(o.mesh));
  objects=[];
}


/* ------------------- Player Control ------------------- */
let inputX = 0;
window.addEventListener('keydown',(e)=>{
  if(e.code==='ArrowLeft') inputX=-0.02;
  if(e.code==='ArrowRight') inputX=0.02;
  if(e.code==='Space' && player.onGround){ player.vy=player.jumpSpeed; player.onGround=false; }
});
window.addEventListener('keyup',(e)=>{
  if(e.code==='ArrowLeft' || e.code==='ArrowRight') inputX=0;
});


/* ------------------- Update ------------------- */
function update(dt){
  if(!running) return;
  player.mesh.position.x += inputX * dt*60;
  player.mesh.position.z -= forwardSpeed*dt*60;
  player.vy -= 0.02*dt*60;
  player.mesh.position.y += player.vy*dt*60;
  if(player.mesh.position.y<0){ player.mesh.position.y=0; player.vy=0; player.onGround=true; }


  // spawn coins/obstacles ahead
  if(Math.random()<0.02) spawnObjects();


  checkCollisions();
  checkFall();


  score += forwardSpeed*dt*60;
  document.getElementById('scoreEl').textContent = Math.floor(score);
  document.getElementById('tokensEl').textContent = tokens;
}


/* ------------------- Render Loop ------------------- */
function renderLoop(ts){
  if(!lastTime) lastTime=ts;
  const delta = (ts-lastTime)/16.666;
  lastTime=ts;


  update(delta);


  // player spin
  player.mesh.rotation.y += 0.2*delta;


  renderer.render(scene,camera);
  requestAnimationFrame(renderLoop);
}
requestAnimationFrame(renderLoop);


/* ------------------- Controls ------------------- */
document.getElementById('btnStart').addEventListener('click',()=>{ running=true; });
document.getElementById('btnPause').addEventListener('click',()=>{ running=!running; });
document.getElementById('btnShop').addEventListener('click',()=>{ document.getElementById('shopUI').style.display='flex'; });
document.getElementById('btnScores').addEventListener('click',()=>{ document.getElementById('scoresUI').style.display='flex'; });
function closeShop(){ document.getElementById('shopUI').style.display='none'; }
function closeScores(){ document.getElementById('scoresUI').style.display='none'; }


/* ------------------- Window Resize ------------------- */
window.addEventListener('resize',()=>{ renderer.setSize(window.innerWidth,window.innerHeight); camera.aspect=window.innerWidth/window.innerHeight; camera.updateProjectionMatrix(); });