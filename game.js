// --- Three.js scene setup ---
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, window.innerWidth/window.innerHeight, 0.1, 100);
const renderer = new THREE.WebGLRenderer({ antialias:true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// --- Neon path ---
const pathLength = 200;
const pathGeom = new THREE.PlaneGeometry(10, pathLength, 20, pathLength/2);
const pathMat = new THREE.MeshBasicMaterial({ color:0x00ffff, wireframe:true });
const path = new THREE.Mesh(pathGeom, pathMat);
path.rotation.x = -Math.PI/2;
scene.add(path);

// --- Player ball ---
const playerGeom = new THREE.SphereGeometry(0.5,32,32);
const playerMat = new THREE.MeshBasicMaterial({ color:0xff00ff, wireframe:true });
const player = new THREE.Mesh(playerGeom, playerMat);
player.position.set(0,0.5,0);
player.velocity = new THREE.Vector3();
scene.add(player);

// --- Coins & obstacles ---
let objects = [];
function createCoin(x,z){
  const geo = new THREE.SphereGeometry(0.2,16,16);
  const mat = new THREE.MeshBasicMaterial({ color:0xffff00, wireframe:true });
  const coin = new THREE.Mesh(geo, mat);
  coin.position.set(x,0.2,z);
  coin.type = 'coin';
  scene.add(coin);
  objects.push(coin);
}
function createObstacle(x,z){
  const geo = new THREE.BoxGeometry(1,1,1);
  const mat = new THREE.MeshBasicMaterial({ color:0xff0000, wireframe:true });
  const obs = new THREE.Mesh(geo, mat);
  obs.position.set(x,0.5,z);
  obs.type = 'obs';
  scene.add(obs);
  objects.push(obs);
}

// --- Game state ---
let running = false;
let score = 0;
let tokens = 0;
const messageBox = document.getElementById('messageBox');
const scoreEl = document.getElementById('score');
const tokensEl = document.getElementById('tokens');
const keys = {};

// --- Input ---
window.addEventListener('keydown', e=>{ keys[e.code]=true; });
window.addEventListener('keyup', e=>{ keys[e.code]=false; });

// --- Start run ---
function startRun(){
  // Reset
  running = true;
  player.position.set(0,0.5,0);
  player.velocity.set(0,0,0);
  score = 0; scoreEl.textContent='0';
  objects.forEach(o=>scene.remove(o));
  objects = [];

  // Spawn initial coins and obstacles
  for(let i=10;i<100;i+=5){
    createCoin(Math.random()*8-4,-i);
    if(Math.random()<0.3) createObstacle(Math.random()*8-4,-i-2);
  }
  showMessage('Run started!');
}

// --- Message ---
function showMessage(txt, ttl=1600){
  messageBox.style.display='block';
  messageBox.textContent = txt;
  setTimeout(()=>{ messageBox.style.display='none'; }, ttl);
}

// --- Update ---
function updatePlayer(dt){
  // sliding controls
  if(keys['ArrowLeft']) player.velocity.x -= 0.02;
  if(keys['ArrowRight']) player.velocity.x += 0.02;
  player.velocity.x *= 0.98; // ice friction
  player.position.add(player.velocity.clone().multiplyScalar(dt*60));

  // automatic forward
  player.position.z -= 0.15*dt*60;

  // camera follow
  camera.position.x += (player.position.x - camera.position.x)*0.08;
  camera.position.y = 2 + player.position.y;
  camera.position.z = player.position.z + 5;
  camera.lookAt(player.position);

  // rotate ball
  player.rotation.x += 0.2;
  player.rotation.z += 0.2;

  // fall check
  if(player.position.x<-5 || player.position.x>5){
    showMessage('Fell off!');
    running=false;
  }

  // collision with coins
  objects.forEach((o,i)=>{
    if(o.type==='coin' && o.position.distanceTo(player.position)<0.5){
      tokens++; tokensEl.textContent=tokens;
      scene.remove(o);
      objects.splice(i,1);
    }
    if(o.type==='obs' && o.position.distanceTo(player.position)<0.7){
      showMessage('Hit obstacle!');
      running=false;
    }
  });
}

// --- Render loop ---
let lastTime;
function loop(ts){
  if(!lastTime) lastTime=ts;
  const dt = (ts-lastTime)/1000;
  lastTime = ts;

  if(running){
    updatePlayer(dt);
    score += dt*10;
    scoreEl.textContent=Math.floor(score);
  }

  renderer.render(scene,camera);
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

// --- Resize ---
window.addEventListener('resize', ()=>{
  camera.aspect = window.innerWidth/window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth,window.innerHeight);
});
