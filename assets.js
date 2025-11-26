/* Skins and power-up definitions */
const SKINS = [
  { id: 'blue', name: 'Blue Neon', mat: new THREE.MeshStandardMaterial({ color: 0x00ffff, emissive: 0x00ffff, roughness: 0.3 }) },
  { id: 'pink', name: 'Pink Neon', mat: new THREE.MeshStandardMaterial({ color: 0xff00ff, emissive: 0xff00ff, roughness: 0.3 }) },
];


const ownedSkins = ['blue'];
let selectedSkin = 'blue';


/* Power-ups config (for shop & in-run) */
const POWERUPS = [
  { id:'shield', name:'Shield', price:40 },
  { id:'double', name:'Double Tokens', price:80 },
  { id:'magnet', name:'Magnet', price:60 },
  { id:'slow', name:'Slow-motion', price:50 }
];