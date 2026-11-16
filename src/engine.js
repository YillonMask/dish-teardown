(function(){
const D = window.DISH;
const Q = new URLSearchParams(location.search);
const RECORD = Q.has('record'); if (RECORD) document.body.classList.add('rec');
const ACCENT = new THREE.Color('#e8552b');
const canvas = document.getElementById('c');
const stage = document.getElementById('stage');
const renderer = new THREE.WebGLRenderer({canvas, antialias:true, preserveDrawingBuffer:RECORD});
renderer.setPixelRatio(Math.min(window.devicePixelRatio||1, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
const scene = new THREE.Scene();
scene.background = new THREE.Color('#f3efe8');
scene.fog = new THREE.Fog('#f3efe8', 40, 80);
const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 200);

{ // soft studio environment for glossy reflections
  const env = new THREE.Scene(); const room = new THREE.Mesh(new THREE.SphereGeometry(20, 32, 16), new THREE.MeshBasicMaterial({color:'#4a4541', side:THREE.BackSide})); env.add(room);
  const panel = (w,h,x,y,z,c) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w,h), new THREE.MeshBasicMaterial({color:c, side:THREE.DoubleSide})); m.position.set(x,y,z); m.lookAt(0,0,0); env.add(m); };
  panel(14,8, 4,14,6,'#ffffff'); panel(8,6, -12,6,-4,'#e8eefc'); panel(10,4, 6,4,-12,'#fff3e0');
  const pm = new THREE.PMREMGenerator(renderer); scene.environment = pm.fromScene(env, 0.04).texture; scene.environmentIntensity = 0.35; }
scene.add(new THREE.HemisphereLight('#ffffff', '#d9cfc2', 1.15));
const key = new THREE.DirectionalLight('#fff6ea', 2.1);
key.position.set(6, 16, 8); key.castShadow = true;
key.shadow.mapSize.set(2048, 2048);
const sc = key.shadow.camera; sc.left=-14; sc.right=14; sc.top=14; sc.bottom=-14; sc.near=1; sc.far=50;
key.shadow.radius = 6; key.shadow.bias = -0.0004; key.shadow.normalBias = 0.02;
scene.add(key);
const fill = new THREE.DirectionalLight('#e9f0ff', 0.55); fill.position.set(-8, 6, -6); scene.add(fill);
const ground = new THREE.Mesh(new THREE.PlaneGeometry(120,120), new THREE.ShadowMaterial({opacity:0.16}));
ground.rotation.x = -Math.PI/2; ground.receiveShadow = true; scene.add(ground);
const floorTint = new THREE.Mesh(new THREE.CircleGeometry(30, 64), new THREE.MeshBasicMaterial({color:'#ebe5dc'}));


// seeded rng
let seed = 1234567;
const rng = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };

// ---------- parts ----------
const parts = [];
const byId = {};
D.parts.forEach((p, i) => {
  const holder = new THREE.Group();
  const inner = p.build(THREE, rng);
  holder.add(inner);
  scene.add(holder);
  holder.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(inner);
  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());
  const mats = [];
  inner.traverse(o => {
    if (o.isMesh) {
      o.castShadow = o.userData.noShadow ? false : true; o.receiveShadow = true;
      o.material = Array.isArray(o.material) ? o.material.map(m => m.clone()) : o.material.clone();
      o.userData.baseCast = o.castShadow;
      (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => mats.push({m, op:m.opacity, tr:m.transparent, dw:m.depthWrite,
        em:m.emissive ? m.emissive.clone() : null, mesh:o}));
    }
  });
  const P = {def:p, i, holder, inner, center, radius:Math.max(size.x, size.z)/2, height:size.y, mats,
    off:new THREE.Vector3(), tOff:new THREE.Vector3(), fade:1, tFade:1, glow:0, tGlow:0, spin:0, tSpin:0, el:null, line:null, dot:null};
  parts.push(P); byId[p.id] = P;
});

// ---------- UI ----------
const bar = document.getElementById('bar');
const panel = document.getElementById('panel');
const overlay = document.getElementById('overlay');
const svg = document.getElementById('lines');
const tourflag = document.getElementById('tourflag');
const buttons = {};
function mkBtn(id, html, cls){ const b=document.createElement('button'); b.innerHTML=html; if(cls) b.className=cls;
  b.addEventListener('click', e => { stopTour(); act(id); }); bar.appendChild(b); buttons[id]=b; return b; }
mkBtn('all', '整体', 'special');
parts.forEach(P => mkBtn(P.def.id, (P.def.tag?'<small>'+P.def.tag+'</small>':'')+P.def.btn));
mkBtn('explode', '全部拆开', 'special');
mkBtn('tour', '▶ 自动导览', 'special');
const NS='http://www.w3.org/2000/svg';
parts.forEach(P => {
  const el = document.createElement('div'); el.className='callout';
  el.innerHTML = '<b>'+(P.def.tag? P.def.tag+' · ':'')+P.def.name+'</b><span>'+P.def.note+'</span>';
  overlay.appendChild(el); P.el = el;
  P.line = document.createElementNS(NS,'line'); P.line.setAttribute('stroke','#2b2622'); P.line.setAttribute('stroke-width','1');
  P.dot = document.createElementNS(NS,'circle'); P.dot.setAttribute('r','3'); P.dot.setAttribute('fill','#2b2622');
  svg.appendChild(P.line); svg.appendChild(P.dot);
});
function hex(c){ return '#'+new THREE.Color(c).getHexString(); }
function renderPanel(){
  if (state.mode === 'focus') {
    const p = byId[state.sel].def;
    panel.innerHTML = (p.tag?'<span class="tag">'+p.tag+'</span>':'') + '<h2>'+p.name+'</h2><div class="note">'+p.note+'</div>'+
      '<h3>在这道菜里的作用</h3><p>'+p.role+'</p>'+
      '<h3>每份大约用量</h3><p class="amt">'+p.amount+'</p><p class="approx">* 粗略估计，各家做法不同</p>'+
      (p.fact?'<h3>小知识</h3><p>'+p.fact+'</p>':'');
  } else {
    panel.innerHTML = '<span class="tag">'+(state.mode==='explode'?'爆炸视图':'整体')+'</span><h2>'+D.title+'</h2><div class="note">'+D.subtitle+'</div>'+
      '<p>'+D.intro+'</p><h3>组成部分</h3><ul>'+
      parts.map(P=>'<li><i style="background:'+hex(P.def.swatch)+'"></i>'+(P.def.tag?P.def.tag+' · ':'')+P.def.name+'</li>').join('')+'</ul>';
  }
}

// ---------- state ----------
const state = {mode:'all', sel:null};
const asideDir = new THREE.Vector3(1,0,0);
function camRight(){ const v=new THREE.Vector3(); v.setFromMatrixColumn(camera.matrixWorld,0); v.y=0; v.normalize(); return v; }
function act(id){
  if (id === 'tour') { startTour(); return; }
  if (id === 'all' || id === 'explode') { state.mode = id; state.sel = null; }
  else { state.mode = 'focus'; state.sel = id; asideDir.copy(camRight()); }
  Object.entries(buttons).forEach(([k,b]) => b.classList.toggle('on', k===id || (k==='tour' && touring)));
  computeTargets(); renderPanel();
}
const cam = {az:0.6, pol:1.0, dist:D.cam.all, target:new THREE.Vector3(0,D.cam.allY,0), tPol:1.0, tDist:D.cam.all, tTarget:new THREE.Vector3(0,D.cam.allY,0), zoom:1};
function computeTargets(){
  const m = state.mode;
  parts.forEach(P => {
    P.tSpin = 0; P.tGlow = 0;
    if (m === 'all') { P.tOff.set(0,0,0); P.tFade = 1; }
    else if (m === 'explode') { P.tOff.set(0, P.def.explodeY, 0); P.tFade = 1; }
    else {
      if (P.def.id === state.sel) {
        const want = asideDir.clone().multiplyScalar(D.cam.focusSide).setY(D.cam.focusY);
        P.tOff.copy(want).sub(new THREE.Vector3(P.center.x, P.center.y, P.center.z));
        P.tFade = 1; P.tGlow = 1; P.tSpin = 1;
      } else { P.tOff.copy(asideDir).multiplyScalar(-D.cam.restSide); P.tFade = 0.22; }
    }
  });
  if (m === 'all') { cam.tDist = D.cam.all; cam.tTarget.set(0, D.cam.allY, 0); cam.tPol = 1.0; }
  else if (m === 'explode') { cam.tDist = D.cam.explode; cam.tTarget.set(0, D.cam.explodeY, 0); cam.tPol = 1.28; }
  else { cam.tDist = D.cam.focus; const mid = asideDir.clone().multiplyScalar((D.cam.focusSide - D.cam.restSide)/2); mid.y = (D.cam.focusY + D.cam.allY)/2 + 0.3; cam.tTarget.copy(mid); cam.tPol = 1.12; }
}

// ---------- tour ----------
let touring = false, tourT = 0, tourIdx = 0, idle = 0;
const STEP = D.tourStep || 2.3;
const tour = [[0,'all']];
let tt = 3.0;
D.tourOrder.forEach(id => { tour.push([tt, id]); tt += STEP; });
tour.push([tt,'explode']); tt += 6.2;
tour.push([tt,'all']); tt += 2.6;
const TOUR_LEN = tt;
window.__tourLength = TOUR_LEN;
function startTour(){ touring = true; tourT = 0; tourIdx = 0; cam.zoom = 1; tourflag.style.opacity = 1; buttons.tour.classList.add('on'); }
function stopTour(){ touring = false; idle = 0; tourflag.style.opacity = 0; buttons.tour.classList.remove('on'); }
function tourTick(dt){
  tourT += dt;
  while (tourIdx < tour.length && tour[tourIdx][0] <= tourT) { act(tour[tourIdx][1]); tourIdx++; }
  if (tourT >= TOUR_LEN) { tourT = 0; tourIdx = 0; }
  cam.az += dt * 0.2;
}

// ---------- input ----------
const ptrs = new Map(); let pinch0 = 0, zoom0 = 1;
canvas.addEventListener('pointerdown', e => { canvas.setPointerCapture(e.pointerId); ptrs.set(e.pointerId, {x:e.clientX, y:e.clientY}); if (touring) stopTour(); idle = 0;
  if (ptrs.size === 2) { const [a,b] = [...ptrs.values()]; pinch0 = Math.hypot(a.x-b.x, a.y-b.y); zoom0 = cam.zoom; } });
canvas.addEventListener('pointermove', e => { if (!ptrs.has(e.pointerId)) return; const p = ptrs.get(e.pointerId); idle = 0;
  if (ptrs.size === 1) { cam.az -= (e.clientX - p.x) * 0.008; cam.pol = Math.min(1.5, Math.max(0.25, cam.pol - (e.clientY - p.y) * 0.006)); cam.tPol = cam.pol; userPol = true; }
  p.x = e.clientX; p.y = e.clientY;
  if (ptrs.size === 2) { const [a,b] = [...ptrs.values()]; const d = Math.hypot(a.x-b.x, a.y-b.y); if (pinch0 > 0) cam.zoom = Math.min(2.5, Math.max(0.45, zoom0 * pinch0 / d)); } });
const up = e => { ptrs.delete(e.pointerId); if (ptrs.size < 2) pinch0 = 0; };
canvas.addEventListener('pointerup', up); canvas.addEventListener('pointercancel', up);
canvas.addEventListener('wheel', e => { e.preventDefault(); idle = 0; if (touring) stopTour(); cam.zoom = Math.min(2.5, Math.max(0.45, cam.zoom * Math.exp(e.deltaY * 0.001))); }, {passive:false});
let userPol = false;

// ---------- frame ----------
function resize(){
  const w = stage.clientWidth, h = stage.clientHeight;
  renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
  svg.setAttribute('viewBox', '0 0 '+w+' '+h);
}
window.addEventListener('resize', resize);
const damp = (k, dt) => 1 - Math.exp(-k * dt);
const tmp = new THREE.Vector3();
function step(dt, draw){ if (draw === undefined) draw = true;
  if (touring) tourTick(dt);
  else if (!RECORD) { idle += dt; if (idle > (D.idleStart || 10)) startTour(); }
  const k = damp(4.2, dt);
  parts.forEach(P => {
    P.off.lerp(P.tOff, k); P.fade += (P.tFade - P.fade) * k; P.glow += (P.tGlow - P.glow) * k;
    P.spin += (P.tSpin - P.spin) * k;
    P.holder.position.copy(P.off);
    // spin around own centre while isolated
    if (P.spin > 0.01) P.inner.rotation.y += dt * 0.5 * P.spin; else P.inner.rotation.y += (0 - P.inner.rotation.y) * k;
    P.inner.position.set(P.center.x, 0, P.center.z); P.inner.children.forEach(()=>{});
    P.mats.forEach(o => {
      const f = P.fade;
      if (f < 0.985) { o.m.transparent = true; o.m.opacity = o.op * f; o.m.depthWrite = false; o.mesh.castShadow = false; }
      else { o.m.transparent = o.tr; o.m.opacity = o.op; o.m.depthWrite = o.dw; o.mesh.castShadow = o.mesh.userData.baseCast; }
      if (o.em) o.m.emissive.copy(o.em).lerp(ACCENT, (P.def.glowK ?? 0.28) * P.glow);
    });
  });
  // camera
  const asp = camera.aspect;
  const fit = asp < 1.25 ? Math.min(2.4, 1.25 / asp) : 1;
  const fitE = state.mode === 'explode' ? Math.max(1, fit * 0.72) : fit;
  cam.dist += (cam.tDist * cam.zoom * fitE - cam.dist) * k;
  if (!ptrs.size) cam.pol += (cam.tPol - cam.pol) * damp(1.5, dt);
  cam.target.lerp(cam.tTarget, k);
  camera.position.set(cam.target.x + cam.dist * Math.sin(cam.pol) * Math.sin(cam.az), cam.target.y + cam.dist * Math.cos(cam.pol), cam.target.z + cam.dist * Math.sin(cam.pol) * Math.cos(cam.az));
  camera.lookAt(cam.target);
  camera.updateMatrixWorld();
  if (draw) { renderer.render(scene, camera); labels(); }
}
// inner pivot: we spin inner about its own centre -> offset children
parts.forEach(P => { const g = new THREE.Group(); while (P.inner.children.length) g.add(P.inner.children[0]); g.position.set(-P.center.x, 0, -P.center.z); P.inner.add(g); });

function proj(v){ tmp.copy(v).project(camera); return {x:(tmp.x+1)/2*stage.clientWidth, y:(1-tmp.y)/2*stage.clientHeight, z:tmp.z}; }
function labels(){
  const R = camRight(); const W = stage.clientWidth, H = stage.clientHeight;
  const items = [];
  parts.forEach(P => {
    let vis = 0;
    if (state.mode === 'explode') vis = 1; else if (state.mode === 'focus' && state.sel === P.def.id) vis = 1;
    vis *= Math.max(0, 1 - P.off.distanceTo(P.tOff) / 1.2);
    const c = new THREE.Vector3(P.center.x, P.center.y, P.center.z).add(P.off);
    const a = proj(c.clone().addScaledVector(R, P.radius * 0.92 * (P.def.anchorK || 1)));
    const l = proj(c.clone().addScaledVector(R, P.radius + 1.4));
    const ew = P.el.offsetWidth || 120, eh = P.el.offsetHeight || 36;
    let lx = Math.max(Math.min(l.x, W - ew - 8), a.x + 12);
    if (lx + ew > W - 4) lx = W - ew - 4;
    items.push({P, a, lx, ly:l.y, ew, eh, vis});
  });
  // de-overlap visible labels vertically
  const vis = items.filter(o => o.vis > 0.01).sort((p, q) => p.ly - q.ly);
  for (let i = 1; i < vis.length; i++) { const need = vis[i-1].ly + (vis[i-1].eh + vis[i].eh) / 2 + 4; if (vis[i].ly < need) vis[i].ly = need; }
  if (vis.length) { const last = vis[vis.length-1]; const over = last.ly + last.eh/2 - (H - 64); if (over > 0) vis.forEach(o => o.ly -= over); }
  for (let i = 0; i < vis.length; i++) { const min = 12 + vis[i].eh/2 + (i ? 0 : 0); if (vis[i].ly < min) vis[i].ly = min; }
  items.forEach(({P, a, lx, ly, vis}) => {
    P.el.style.left = lx + 'px'; P.el.style.top = ly + 'px'; P.el.style.opacity = vis;
    P.el.classList.toggle('sel', state.sel === P.def.id);
    P.line.setAttribute('x1', a.x); P.line.setAttribute('y1', a.y); P.line.setAttribute('x2', lx); P.line.setAttribute('y2', ly);
    P.line.setAttribute('opacity', vis); P.dot.setAttribute('cx', a.x); P.dot.setAttribute('cy', a.y); P.dot.setAttribute('opacity', vis);
    const col = state.sel === P.def.id ? '#e8552b' : '#2b2622';
    P.line.setAttribute('stroke', col); P.dot.setAttribute('fill', col);
  });
}

resize(); computeTargets(); renderPanel();
Object.entries(buttons).forEach(([k,b]) => b.classList.toggle('on', k==='all'));
if (RECORD) {
  window.__advance = (dt, n) => { n = n||1; for (let i = 0; i < n; i++) step(dt, i === n-1); };
  window.__startTour = startTour; window.__cam = cam; window.__byId = byId;
  window.__act = id => act(id);
  window.__ready = true;
  step(1/30);
} else {
  let last = performance.now();
  const loop = now => { const dt = Math.min(0.05, (now - last) / 1000); last = now; step(dt); requestAnimationFrame(loop); };
  requestAnimationFrame(loop);
  if (Q.has('tour')) startTour();
}
})();
