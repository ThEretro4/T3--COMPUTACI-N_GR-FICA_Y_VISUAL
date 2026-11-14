import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0b1112);
scene.fog = new THREE.Fog(0x0b1112, 9, 58);

const camera = new THREE.PerspectiveCamera(75, innerWidth/innerHeight, 0.1, 120);
camera.position.set(0,1.65,23);
const renderer = new THREE.WebGLRenderer({antialias:true});
renderer.setSize(innerWidth,innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio,1.7));
renderer.shadowMap.enabled = false; // sin sombras
document.body.appendChild(renderer.domElement);

scene.add(new THREE.HemisphereLight(0xdfeeee,0x2a3535,1.1));
const ambient = new THREE.AmbientLight(0x9fb5b5,0.35); scene.add(ambient);
const lamp = new THREE.DirectionalLight(0xe6f4f4,0.6);
lamp.position.set(-5,12,8); scene.add(lamp);

const loader = new GLTFLoader();
const clock = new THREE.Clock();
const keys = {};
let yaw=0, pitch=0, locked=false, ended=false, started=false;
let activeWeapon=1;
const ammo={1:8,2:24};
const weaponModels={};
const zombies=[];
const pickups=[];
const colliders=[];
const solidMeshes=[];
const raycaster=new THREE.Raycaster();
const screenCenter=new THREE.Vector2(0,0);
const hudAmmo=document.getElementById('ammo');
const weaponName=document.getElementById('weaponName');
const screen=document.getElementById('screen');
const screenTitle=document.getElementById('screenTitle');
const screenText=document.getElementById('screenText');
const startButton=document.getElementById('startButton');
const toast=document.getElementById('toast');
let toastTimer=0;

function message(text){
  toast.textContent=text; toastTimer=2.0;
}
function makeMaterial(color, rough=1){return new THREE.MeshStandardMaterial({color,roughness:rough,metalness:0});}
// Quita brillos/reflejos de los materiales de los modelos GLB
function flatten(o){
  o.castShadow=false; o.receiveShadow=false;
  (Array.isArray(o.material)?o.material:[o.material]).forEach(m=>{
    if(!m) return;
    if('metalness' in m) m.metalness=0;
    if('roughness' in m) m.roughness=1;
    if('envMapIntensity' in m) m.envMapIntensity=0;
    m.needsUpdate=true;
  });
}
function box(w,h,d,x,y,z,color,solid=true){
  const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),makeMaterial(color));
  mesh.position.set(x,y,z); scene.add(mesh);
  if(solid){ colliders.push(new THREE.Box3().setFromObject(mesh)); solidMeshes.push(mesh); }
  return mesh;
}
function floor(w,d,x,z,color=0x59634b,tex=null){
  const mat=tex?new THREE.MeshStandardMaterial({map:tex,roughness:1,metalness:0}):makeMaterial(color);
  const m=new THREE.Mesh(new THREE.PlaneGeometry(w,d),mat);
  m.rotation.x=-Math.PI/2; m.position.set(x,0,z); scene.add(m);
}
function tileTexture(){
  const c=document.createElement('canvas'); c.width=c.height=128; const g=c.getContext('2d');
  g.fillStyle='#cfd9d6'; g.fillRect(0,0,128,128); g.fillStyle='#b4c4c0'; g.fillRect(0,0,64,64); g.fillRect(64,64,64,64);
  const t=new THREE.CanvasTexture(c); t.wrapS=t.wrapT=THREE.RepeatWrapping; t.repeat.set(9,45); t.colorSpace=THREE.SRGBColorSpace; return t;
}
function sign(text,x,y,z,rotY=0,w=4.6,bg='#1d6f68'){
  const c=document.createElement('canvas'); c.width=512; c.height=128; const g=c.getContext('2d');
  g.fillStyle=bg; g.fillRect(0,0,512,128); g.fillStyle='#fff'; g.font='bold 46px Arial'; g.textAlign='center'; g.textBaseline='middle'; g.fillText(text,256,66);
  const t=new THREE.CanvasTexture(c); t.colorSpace=THREE.SRGBColorSpace;
  const m=new THREE.Mesh(new THREE.PlaneGeometry(w,w/4),new THREE.MeshBasicMaterial({map:t}));
  m.position.set(x,y,z); m.rotation.y=rotY; scene.add(m);
}
const WALL=0xdbe6e3;
function wallWithGap(z,g0,g1){
  box(g0+8.5,5,0.6,(g0-8.5)/2,2.5,z,WALL);
  box(8.5-g1,5,0.6,(g1+8.5)/2,2.5,z,WALL);
  box(g1-g0,1.3,0.6,(g0+g1)/2,4.35,z,WALL,false);
}
function bed(x,z){ box(1.1,.55,2.2,x,.45,z,0xe9efef); box(1.12,.14,1.3,x,.76,z+.35,0x4a90a4,false); box(.8,.12,.5,x,.78,z-.8,0xffffff,false); }
function buildWorld(){
  // estructura: suelo de baldosas, techo y paredes exteriores
  floor(18,90,0,-10,0,tileTexture());
  const ceil=new THREE.Mesh(new THREE.PlaneGeometry(18,90),makeMaterial(0xdfe6e5));
  ceil.rotation.x=Math.PI/2; ceil.position.set(0,5,-10); scene.add(ceil);
  box(0.6,5,90,-8.5,2.5,-10,WALL); box(0.6,5,90,8.5,2.5,-10,WALL);
  box(18,5,0.6,0,2.5,35,WALL); box(18,5,0.6,0,2.5,-55,WALL);
  box(.65,1.1,90,-8.5,.55,-10,0x3b8f86,false); box(.65,1.1,90,8.5,.55,-10,0x3b8f86,false);
  // zonas separadas por muros con puertas desplazadas (zig-zag)
  wallWithGap(16,-5,0); wallWithGap(-6,0,5); wallWithGap(-22,-5,0); wallWithGap(-33,-2.5,2.5);
  sign('RECEPCIÓN · INICIO',0,3.6,34.6,Math.PI,5);
  sign('URGENCIAS',-2.5,3.7,16.35); sign('HABITACIONES',2.5,3.7,-5.65);
  sign('QUIRÓFANO',-2.5,3.7,-21.65); sign('HELIPUERTO · EXTRACCIÓN',0,3.7,-32.65,0,5.2,'#2a7a2a');
  // cruces rojas
  [[5,34.6],[-5,-5.65]].forEach(([x,z])=>{ const r=z>0?Math.PI:0; box(.3,1.3,.05,x,3.3,z,0xc0262c,false); box(1.3,.3,.05,x,3.3,z,0xc0262c,false); });
  // luces fluorescentes
  for(let z=28;z>-50;z-=14){
    const p=new THREE.Mesh(new THREE.BoxGeometry(2.4,.1,.7),new THREE.MeshBasicMaterial({color:0xf4ffff}));
    p.position.set(0,4.93,z); scene.add(p);
    const light=new THREE.PointLight(0xcfeeee,0.8,14); light.position.set(0,4.2,z); scene.add(light);
  }
  // Recepción: mostrador y sillas
  box(6,1.1,1.2,-3,.55,28,0x7a8f8c); box(6.3,.1,1.4,-3,1.15,28,0xe9efef,false);
  for(let x=4.5;x<=7.5;x+=1.2) box(.8,.5,.8,x,.25,30,0x3b8f86);
  box(1.2,2.2,.8,-7.7,1.1,31,0xa9b8b5);
  // Urgencias: bancas y camillas
  [12,8,4,0].forEach(z=>box(.8,.5,2.4,-7.2,.25,z,0x3b8f86));
  box(1,.7,2.2,6.5,.55,11,0xe9efef); box(1,.7,2.2,6.5,.55,2,0xe9efef);
  // Habitaciones: camas y cortinas
  [-10,-14,-18].forEach(z=>bed(-7.2,z)); [-12,-17].forEach(z=>bed(7.2,z));
  box(.1,2.6,3,-5.2,1.5,-12,0xa9d0d6,false); box(.1,2.6,3,5.2,1.5,-14.5,0xa9d0d6,false);
  // Quirófano / laboratorio
  box(1.2,.9,2.4,-5.5,.45,-28,0xcfd9d6); box(2.6,1,1,5.5,.5,-30,0xcfd9d6); box(1.2,2.2,.8,-7.7,1.1,-24,0xa9b8b5);
  // Helipuerto / bahía de ambulancias
  box(2.2,2,4.5,-6.5,1,-45,0xf0f0f0); box(2.22,.4,4.52,-6.5,1.1,-45,0xc0262c,false);
  box(2.2,2,4.5,6.5,1,-42,0xf0f0f0); box(2.22,.4,4.52,6.5,1.1,-42,0xc0262c,false);
  // zona de extracción (helipad)
  const pad=new THREE.Mesh(new THREE.CylinderGeometry(3.2,3.2,0.16,32),new THREE.MeshStandardMaterial({color:0x2f6f33,emissive:0x163d10,roughness:1,metalness:0}));
  pad.position.set(0,0.08,-48); scene.add(pad);
  const ring=new THREE.Mesh(new THREE.TorusGeometry(2.5,.12,8,40),new THREE.MeshBasicMaterial({color:0x9cff67}));
  ring.rotation.x=Math.PI/2; ring.position.set(0,.22,-48); scene.add(ring);
  sign('EXTRACCIÓN',0,3.4,-54.6,0,4,'#2a7a2a');
  const marker=new THREE.PointLight(0x77ff44,2.5,15); marker.position.set(0,2,-48); scene.add(marker);
}
buildWorld();

function loadWeapon(id,path,position,scale){
  loader.load(path,gltf=>{
    const model=gltf.scene;
    model.scale.setScalar(scale);
    model.position.copy(position);
    model.rotation.y=Math.PI;
    model.traverse(o=>{if(o.isMesh){flatten(o);}});
    camera.add(model); weaponModels[id]=model;
    if(id!==activeWeapon) model.visible=false;
  },undefined,err=>console.error('No se pudo cargar '+path,err));
}
loadWeapon(1,'./assets/pistol.glb',new THREE.Vector3(.34,-.30,-.62),1.05);
loadWeapon(2,'./assets/rifle.glb',new THREE.Vector3(.38,-.34,-.72),.72);
scene.add(camera);

function spawnZombie(x,z){
  const holder=new THREE.Group(); holder.position.set(x,0,z); scene.add(holder);
  const data={group:holder,hp:2,active:false,dead:false,hitMeshes:[],speed:1.35};
  loader.load('./assets/zombie.glb',gltf=>{
    const model=gltf.scene; model.scale.setScalar(.88); model.rotation.y=Math.PI;
    model.traverse(o=>{if(o.isMesh){flatten(o);data.hitMeshes.push(o);}});
    holder.add(model); data.model=model;
  },undefined,err=>console.error(err));
  // invisible target volume ensures ray hits the zombie even with a low-poly mesh
  const hit=new THREE.Mesh(new THREE.SphereGeometry(.48,10,8),new THREE.MeshBasicMaterial({color:0xff0000,transparent:true,opacity:0,colorWrite:false,depthWrite:false}));
  hit.position.y=1.0; hit.scale.set(.9,1.7,.9); holder.add(hit); data.hitMeshes.push(hit);
  zombies.push(data);
}
[[-2,-2],[3,-10],[-3,-19],[2,-28],[-2,-38],[4,8]].forEach(p=>spawnZombie(p[0],p[1]));

function spawnAmmo(x,z){
  const group=new THREE.Group(); group.position.set(x,.55,z); scene.add(group);
  const crate=new THREE.Mesh(new THREE.BoxGeometry(.85,.75,.75),makeMaterial(0x326a37));
  group.add(crate);
  const stripe=new THREE.Mesh(new THREE.BoxGeometry(.9,.12,.78),makeMaterial(0xd0bd58)); group.add(stripe);
  const glow=new THREE.PointLight(0x7bff55,1.1,4); glow.position.y=.4; group.add(glow);
  pickups.push({group,used:false});
}
spawnAmmo(-4,-8); spawnAmmo(4,-24); spawnAmmo(0,-40);

function updateHud(){
  weaponName.textContent=activeWeapon===1?'PISTOLA':'RIFLE';
  hudAmmo.textContent=ammo[activeWeapon]+' / '+(activeWeapon===1?'8':'24');
}
updateHud();

function showEnd(win){
  ended=true; document.exitPointerLock?.();
  screen.style.display='flex';
  screenTitle.textContent=win?'¡MISIÓN COMPLETADA!':'GAME OVER';
  screenText.textContent=win?'Has llegado a la zona de extracción. ¡Buen trabajo, soldado!':'Un zombi te ha atrapado. La misión ha terminado.';
  startButton.textContent='REINICIAR';
}
function resetGame(){
  location.reload();
}
startButton.addEventListener('click',()=>{
  if(started && ended){resetGame();return;}
  started=true; screen.style.display='none'; renderer.domElement.requestPointerLock();
});
document.addEventListener('pointerlockchange',()=>{locked=document.pointerLockElement===renderer.domElement;});
document.addEventListener('mousemove',e=>{
  if(!locked||ended)return;
  yaw-=e.movementX*.0022;
  pitch-=e.movementY*.0022;
  pitch=Math.max(-1.25,Math.min(1.25,pitch));
  camera.rotation.order='YXZ'; camera.rotation.y=yaw; camera.rotation.x=pitch;
});
document.addEventListener('keydown',e=>{
  keys[e.code]=true;
  if(e.code==='Digit1'||e.code==='Digit2'){
    activeWeapon=e.code==='Digit1'?1:2;
    Object.entries(weaponModels).forEach(([id,m])=>m.visible=Number(id)===activeWeapon);
    updateHud();
  }
});
document.addEventListener('keyup',e=>keys[e.code]=false);

function shoot(){
  if(!locked||ended||!started)return;
  if(ammo[activeWeapon]<=0){message('SIN MUNICIÓN: busca una caja de abastecimiento');return;}
  ammo[activeWeapon]--; updateHud();
  raycaster.setFromCamera(screenCenter,camera);
  const targets=[];
  zombies.forEach(z=>{if(!z.dead)targets.push(...z.hitMeshes);});
  const hits=raycaster.intersectObjects(targets,true);
  const wallHit=raycaster.intersectObjects(solidMeshes,false)[0];
  if(hits.length && (!wallHit || wallHit.distance>hits[0].distance)){
    let obj=hits[0].object;
    let target=zombies.find(z=>z.hitMeshes.some(m=>m===obj||m.getObjectById(obj.id)));
    // resolve parent when ray intersects a child of a model
    if(!target){
      let p=obj;
      while(p && !target){target=zombies.find(z=>z.group===p);p=p.parent;}
    }
    if(target&&!target.dead){
      target.hp--;
      if(target.hp<=0){
        target.dead=true; target.group.visible=false; message('ZOMBI ELIMINADO');
      } else message('IMPACTO: falta 1 disparo');
    }
  }
}
document.addEventListener('mousedown',e=>{if(e.button===0)shoot();});

function blocked(pos){
  const r=.38;
  for(const b of colliders){
    if(pos.x+r>b.min.x&&pos.x-r<b.max.x&&pos.z+r>b.min.z&&pos.z-r<b.max.z)return true;
  }
  return false;
}
function updatePlayer(dt){
  if(!locked||ended)return;
  const forward=new THREE.Vector3(-Math.sin(yaw),0,-Math.cos(yaw));
  const right=new THREE.Vector3(Math.cos(yaw),0,-Math.sin(yaw));
  let move=new THREE.Vector3();
  if(keys.KeyW)move.add(forward);
  if(keys.KeyS)move.sub(forward);
  if(keys.KeyD)move.add(right);
  if(keys.KeyA)move.sub(right);
  if(move.lengthSq()>0){
    move.normalize().multiplyScalar(5.0*dt);
    const next=camera.position.clone().add(move);
    if(!blocked(new THREE.Vector3(next.x,0,next.z)))camera.position.x=next.x;
    const nextZ=camera.position.clone().add(move);
    if(!blocked(new THREE.Vector3(camera.position.x,0,nextZ.z)))camera.position.z=nextZ.z;
  }
  camera.position.y=1.65;
}
function updateZombies(dt){
  if(!locked||ended)return;
  const player=new THREE.Vector3(camera.position.x,0,camera.position.z);
  zombies.forEach(z=>{
    if(z.dead)return;
    const pos=z.group.position;
    const dx=player.x-pos.x, dz=player.z-pos.z;
    const dist=Math.hypot(dx,dz);
    if(dist<13)z.active=true;
    if(z.active&&dist>1.05){
      const step=Math.min(z.speed*dt,dist-1.0);
      const nx=pos.x+(dx/dist)*step, nz=pos.z+(dz/dist)*step;
      if(!blocked(new THREE.Vector3(nx,0,pos.z)))pos.x=nx;
      if(!blocked(new THREE.Vector3(pos.x,0,nz)))pos.z=nz;
      z.group.rotation.y=Math.atan2(dx,dz);
    }
    if(dist<=1.25){showEnd(false);}
  });
}
function updatePickups(){
  pickups.forEach(p=>{
    if(p.used)return;
    p.group.rotation.y+=.012;
    const d=p.group.position.distanceTo(new THREE.Vector3(camera.position.x,.55,camera.position.z));
    if(d<1.5){
      p.used=true;p.group.visible=false;
      ammo[1]=Math.min(8,ammo[1]+4);
      ammo[2]=Math.min(24,ammo[2]+10);
      updateHud();message('MUNICIÓN RECOGIDA: +4 PISTOLA / +10 RIFLE');
    }
  });
}
function animate(){
  requestAnimationFrame(animate);
  const dt=Math.min(clock.getDelta(),.05);
  if(toastTimer>0){toastTimer-=dt;if(toastTimer<=0)toast.textContent='';}
  updatePlayer(dt); updateZombies(dt); updatePickups();
  if(!ended && camera.position.z<-45 && Math.abs(camera.position.x)<3.2)showEnd(true);
  renderer.render(scene,camera);
}
animate();
addEventListener('resize',()=>{
  camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);
});
