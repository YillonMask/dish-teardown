window.DISH = (function(){
function std(THREE, color, o){ return new THREE.MeshStandardMaterial(Object.assign({color, roughness:0.55, metalness:0}, o||{})); }
const PT = 0.16; // plate food surface height
const R = 1.9;   // mound radius
const moundY = (r) => PT + 0.12 + Math.max(0, 1 - (r*r)/(R*R)) * 0.55;
function spot(rng, rmax){ const r = Math.sqrt(rng()) * (rmax||R); const a = rng()*Math.PI*2; return [Math.cos(a)*r, Math.sin(a)*r, r]; }
function roundedCube(THREE, s, k){ const g = new THREE.BoxGeometry(s, s*0.85, s, 4, 4, 4); const p = g.attributes.position; const v = new THREE.Vector3();
  for (let i=0;i<p.count;i++){ v.fromBufferAttribute(p,i); const n = v.clone().normalize().multiplyScalar(s*0.62); v.lerp(n, k); p.setXYZ(i, v.x, v.y, v.z); } g.computeVertexNormals(); return g; }

// ---- procedural helpers (noise + canvas textures) ----
function hash3(x,y,z){ let h = Math.sin(x*127.1 + y*311.7 + z*74.7) * 43758.5453; return h - Math.floor(h); }
function vnoise(x,y,z){ const xi=Math.floor(x), yi=Math.floor(y), zi=Math.floor(z); const xf=x-xi, yf=y-yi, zf=z-zi;
  const u=xf*xf*(3-2*xf), v=yf*yf*(3-2*yf), w=zf*zf*(3-2*zf); let r=0;
  for (let a=0;a<2;a++) for (let b=0;b<2;b++) for (let c=0;c<2;c++) r += hash3(xi+a,yi+b,zi+c)*(a?u:1-u)*(b?v:1-v)*(c?w:1-w);
  return r; }
function fbm(x,y,z){ return vnoise(x,y,z)*0.6 + vnoise(x*2.1,y*2.1,z*2.1)*0.3 + vnoise(x*4.3,y*4.3,z*4.3)*0.1; }
const TEX = {};
function canvasTex(THREE, key, size, draw, srgb){ if (TEX[key]) return TEX[key]; const c = document.createElement('canvas'); c.width = c.height = size; const g = c.getContext('2d'); draw(g, size);
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 4; if (srgb) t.colorSpace = THREE.SRGBColorSpace; TEX[key] = t; return t; }
let crng = 99; const cr = () => { crng = (crng * 16807) % 2147483647; return (crng - 1) / 2147483646; };
// chicken colour: glossy reddish-brown glaze, lighter torn meat patches, small char spots, fibre streaks
function chickenMap(THREE){ return canvasTex(THREE, 'chk', 512, (g, n) => {
  g.fillStyle = '#7a3c17'; g.fillRect(0,0,n,n);
  for (let i=0;i<260;i++){ const x=cr()*n, y=cr()*n, r=8+cr()*40; const gr=g.createRadialGradient(x,y,0,x,y,r);
    const c = cr(); const col = c<0.4 ? '196,132,74' : c<0.8 ? '110,52,20' : '150,70,28';
    gr.addColorStop(0,'rgba('+col+','+(0.35+cr()*0.35)+')'); gr.addColorStop(1,'rgba('+col+',0)'); g.fillStyle=gr; g.fillRect(x-r,y-r,2*r,2*r); }
  // lighter torn meat interior patches
  for (let i=0;i<40;i++){ const x=cr()*n, y=cr()*n; g.save(); g.translate(x,y); g.rotate(cr()*0.4-0.2); const gl=g.createRadialGradient(0,0,0,0,0,30); gl.addColorStop(0,'rgba(214,160,100,'+(0.25+cr()*0.2)+')'); gl.addColorStop(1,'rgba(214,160,100,0)'); g.fillStyle=gl; g.scale(1.8,0.6);
    g.beginPath(); g.arc(0,0,30,0,6.3); g.fill(); g.restore(); }
  // fibres: fine roughly-parallel streaks
  for (let i=0;i<1400;i++){ const x=cr()*n, y=cr()*n, l=10+cr()*40; g.strokeStyle = cr()<0.5 ? 'rgba(235,190,135,0.20)' : 'rgba(90,40,14,0.22)'; g.lineWidth = 0.6+cr()*1.2;
    g.beginPath(); g.moveTo(x,y); g.quadraticCurveTo(x+l*0.5, y+(cr()-0.5)*6, x+l, y+(cr()-0.5)*4); g.stroke(); }
  // char spots
  for (let i=0;i<70;i++){ const x=cr()*n, y=cr()*n, r=1.5+cr()*6; g.fillStyle='rgba(48,20,8,'+(0.5+cr()*0.4)+')'; g.beginPath(); g.ellipse(x,y,r,r*(0.5+cr()*0.6),cr()*3,0,6.3); g.fill(); }
  // chili-oil red tint
  for (let i=0;i<30;i++){ const x=cr()*n, y=cr()*n, r=20+cr()*40; const gr=g.createRadialGradient(x,y,0,x,y,r); gr.addColorStop(0,'rgba(170,40,12,0.25)'); gr.addColorStop(1,'rgba(170,40,12,0)'); g.fillStyle=gr; g.fillRect(x-r,y-r,2*r,2*r); }
}, true); }
function chickenBump(THREE){ return canvasTex(THREE, 'chkb', 512, (g, n) => {
  g.fillStyle = '#808080'; g.fillRect(0,0,n,n);
  for (let i=0;i<2600;i++){ const x=cr()*n, y=cr()*n, l=8+cr()*46; const v = cr()<0.5 ? 170+cr()*60 : 40+cr()*50; g.strokeStyle='rgba('+v+','+v+','+v+',0.45)'; g.lineWidth=0.7+cr()*1.6;
    g.beginPath(); g.moveTo(x,y); g.quadraticCurveTo(x+l*0.5, y+(cr()-0.5)*5, x+l, y+(cr()-0.5)*3); g.stroke(); }
  for (let i=0;i<500;i++){ const x=cr()*n, y=cr()*n, r=1+cr()*3; const v=cr()<0.5?30:220; g.fillStyle='rgba('+v+','+v+','+v+',0.5)'; g.beginPath(); g.arc(x,y,r,0,6.3); g.fill(); }
}, false); }
function peanutMap(THREE){ return canvasTex(THREE, 'pn', 256, (g, n) => {
  g.fillStyle = '#d9a75f'; g.fillRect(0,0,n,n);
  for (let i=0;i<300;i++){ const x=cr()*n, y=cr()*n, r=3+cr()*16; const gr=g.createRadialGradient(x,y,0,x,y,r); const col = cr()<0.5?'240,200,130':'180,118,52';
    gr.addColorStop(0,'rgba('+col+',0.45)'); gr.addColorStop(1,'rgba('+col+',0)'); g.fillStyle=gr; g.fillRect(x-r,y-r,2*r,2*r); }
  for (let i=0;i<60;i++){ g.fillStyle='rgba(140,80,30,0.35)'; g.fillRect(cr()*n, cr()*n, 1+cr()*2, 1+cr()*2); }
}, true); }
function chiliMap(THREE){ return canvasTex(THREE, 'chl', 256, (g, n) => {
  const gr = g.createLinearGradient(0,0,0,n); gr.addColorStop(0,'#5e0f0a'); gr.addColorStop(0.5,'#8a1810'); gr.addColorStop(1,'#5a0d08'); g.fillStyle=gr; g.fillRect(0,0,n,n);
  for (let i=0;i<220;i++){ const x=cr()*n; g.strokeStyle = cr()<0.5 ? 'rgba(30,4,2,0.35)' : 'rgba(190,50,30,0.25)'; g.lineWidth = 1+cr()*3; g.beginPath(); g.moveTo(x,0);
    for (let y=0;y<=n;y+=16) g.lineTo(x+(cr()-0.5)*8, y); g.stroke(); }
}, true); }
function scallionCap(THREE){ return canvasTex(THREE, 'scl', 128, (g, n) => {
  g.fillStyle='#e8ecc8'; g.fillRect(0,0,n,n);
  for (let r=n/2;r>4;r-=7){ g.strokeStyle='rgba(150,170,90,0.55)'; g.lineWidth=1.5; g.beginPath(); g.arc(n/2,n/2,r,0,6.3); g.stroke(); }
  g.fillStyle='#f6f7e6'; g.beginPath(); g.arc(n/2,n/2,6,0,6.3); g.fill();
}, true); }
function scallionSide(THREE){ return canvasTex(THREE, 'sls', 256, (g, n) => {
  g.fillStyle='#e7edc9'; g.fillRect(0,0,n,n);
  for (let i=0;i<90;i++){ const x=cr()*n; g.strokeStyle = cr()<0.6 ? 'rgba(160,190,90,0.35)' : 'rgba(255,255,240,0.5)'; g.lineWidth=1+cr()*3; g.beginPath(); g.moveTo(0,x); g.lineTo(n,x+(cr()-0.5)*4); g.stroke(); }
}, true); }
// irregular, rounded, torn-edged cube
function chickenGeo(THREE, rng){ const g = new THREE.BoxGeometry(1, 1, 1, 7, 7, 7); const p = g.attributes.position; const v = new THREE.Vector3();
  const ox = rng()*50, oy = rng()*50, oz = rng()*50; const sx = 0.85+rng()*0.4, sy = 0.65+rng()*0.3, sz = 0.8+rng()*0.4;
  for (let i=0;i<p.count;i++){ v.fromBufferAttribute(p,i); const sph = v.clone().normalize().multiplyScalar(0.62); v.lerp(sph, 0.55);
    const d = (fbm(v.x*2.6+ox, v.y*2.6+oy, v.z*2.6+oz) - 0.5) * 0.42 + (vnoise(v.x*9+ox, v.y*9+oy, v.z*9+oz) - 0.5) * 0.07;
    v.multiplyScalar(1 + d); v.x *= sx; v.y *= sy; v.z *= sz; p.setXYZ(i, v.x, v.y, v.z); }
  g.computeVertexNormals(); return g; }
return {
title:'宫保鸡丁 · 拆解', subtitle:'一盘川菜拆成八个部分：鸡丁、花生、辣椒、花椒、葱、姜蒜、酱汁、盘子',
intro:'宫保鸡丁是经典川菜，“糊辣荔枝味”：干辣椒和花椒在油里炝出糊辣香，酸甜的荔枝味汁裹住滑嫩鸡丁，最后拌进酥脆花生米。点下方按钮单独查看每样食材。',
cam:{all:11.5, allY:0.4, focus:14.5, focusY:3.6, focusSide:2.6, restSide:3.4, explode:21.5, explodeY:4.8},
tourOrder:['chicken','peanut','chili','pepper','scallion','gingergarlic','sauce','plate'],
parts:[
{ id:'plate', btn:'盘子', name:'白瓷圆盘', note:'约 25 厘米的平盘', swatch:'#f4f3ef', explodeY:0,
  role:'盛器。浅口平盘让鸡丁、花生、辣椒平铺开，红亮的汁水衬在白瓷上更显色。', amount:'直径约 25 厘米', fact:'家常一盘宫保鸡丁约够 2–3 人分享。',
  build(THREE){ const g = new THREE.Group();
    const pts = [new THREE.Vector2(0,0), new THREE.Vector2(1.6,0), new THREE.Vector2(1.65,0.06), new THREE.Vector2(1.6,0.1), new THREE.Vector2(2.3,0.14), new THREE.Vector2(3.0,0.3), new THREE.Vector2(3.45,0.42), new THREE.Vector2(3.5,0.46), new THREE.Vector2(3.42,0.47), new THREE.Vector2(2.95,0.36), new THREE.Vector2(2.3,0.19), new THREE.Vector2(0,PT)];
    g.add(new THREE.Mesh(new THREE.LatheGeometry(pts, 110), std(THREE,'#f7f5f0',{roughness:0.2, side:THREE.DoubleSide})));
    const rim = new THREE.Mesh(new THREE.TorusGeometry(3.2, 0.022, 6, 140), std(THREE,'#b8322a',{roughness:0.35})); rim.rotation.x = Math.PI/2; rim.position.y = 0.405; g.add(rim);
    return g; } },
{ id:'sauce', btn:'酱汁', name:'宫保酱汁 · 荔枝味汁', note:'酱油 醋 糖 淀粉 调成', swatch:'#7c3714', explodeY:1.4, anchorK:0.85,
  role:'调味核心。生抽、香醋、白糖、料酒、少许盐和水淀粉预先调成碗芡，出锅前倒入，收汁后红亮挂在每块鸡丁上，酸甜微辣的“荔枝味”就来自这里。', amount:'约 50–70 毫升（生抽约 1 汤匙、醋约 1–1.5 汤匙、糖约 1–1.5 汤匙、水淀粉约 2 汤匙，均为约数）', fact:'“荔枝味”不是放了荔枝，而是糖醋比例让酸甜像荔枝一样先甜后酸。',
  build(THREE, rng){ const g = new THREE.Group();
    const sh = new THREE.Shape(); const n = 40; for (let k=0;k<=n;k++){ const a=k/n*Math.PI*2; const r = 2.15 + 0.22*Math.sin(a*3+0.5) + 0.12*Math.sin(a*7); const x=Math.cos(a)*r, y=Math.sin(a)*r; k? sh.lineTo(x,y) : sh.moveTo(x,y); }
    const geo = new THREE.ExtrudeGeometry(sh, {depth:0.03, bevelEnabled:true, bevelSize:0.06, bevelThickness:0.025, bevelSegments:3, curveSegments:4});
    const m = new THREE.Mesh(geo, new THREE.MeshPhysicalMaterial({color:'#5a240c', roughness:0.12, clearcoat:1, clearcoatRoughness:0.05, transparent:true, opacity:0.93}));
    m.rotation.x = -Math.PI/2; m.position.y = PT + 0.0; m.userData.noShadow = true; g.add(m);
    const sh2 = new THREE.Shape(); for (let k=0;k<=n;k++){ const a=k/n*Math.PI*2; const r = 2.5 + 0.3*Math.sin(a*4+1.3) + 0.15*Math.sin(a*9); const x=Math.cos(a)*r, y=Math.sin(a)*r; k? sh2.lineTo(x,y) : sh2.moveTo(x,y); }
    const oil = new THREE.Mesh(new THREE.ShapeGeometry(sh2, 6), new THREE.MeshPhysicalMaterial({color:'#d8661a', roughness:0.05, clearcoat:1, transparent:true, opacity:0.7, depthWrite:false}));
    oil.rotation.x = -Math.PI/2; oil.position.y = PT + 0.008; oil.userData.noShadow = true; oil.renderOrder = 1; g.add(oil);
    const om = new THREE.MeshPhysicalMaterial({color:'#d9621c', roughness:0.05, clearcoat:1, transparent:true, opacity:0.85});
    for (let i=0;i<22;i++){ const [x,z] = spot(rng, 2.1); const d = new THREE.Mesh(new THREE.SphereGeometry(0.06+rng()*0.08, 12, 8), om); d.scale.y = 0.2; d.position.set(x, PT+0.07, z); d.userData.noShadow = true; g.add(d); }
    return g; } },
{ id:'chicken', glowK:0.06, btn:'鸡丁', name:'鸡丁', note:'鸡腿肉/鸡胸肉切丁', swatch:'#a5602c', explodeY:2.5,
  role:'主料。鸡腿肉（更嫩）或鸡胸肉切 1.5 厘米左右的丁，用盐、料酒、蛋清、淀粉上浆，热油滑炒后外焦里嫩，最后裹上红亮的荔枝味汁。', amount:'约 250–300 克', fact:'传统做法多用鸡腿肉，切丁前先用刀背拍松、划十字花刀更入味；上浆的淀粉让表面形成一层亮亮的“汁衣”。',
  build(THREE, rng){ const g = new THREE.Group();
    const mat = new THREE.MeshPhysicalMaterial({map:chickenMap(THREE), bumpMap:chickenBump(THREE), bumpScale:3.0, roughness:0.42, clearcoat:0.85, clearcoatRoughness:0.22, sheen:0.3, sheenColor:new THREE.Color('#ffcf99'), vertexColors:true});
    for (let i=0;i<30;i++){ const [x,z,r] = spot(rng, R-0.1); const geo = chickenGeo(THREE, rng);
      // vertex tint: darker glaze in crevices/edges, lighter meat on raised torn bits
      const p = geo.attributes.position, cols = []; const ox = rng()*20;
      for (let k=0;k<p.count;k++){ const n = vnoise(p.getX(k)*5+ox, p.getY(k)*5, p.getZ(k)*5); const t = Math.max(0, Math.min(1, (n-0.35)*1.6));
        cols.push(0.82+0.3*t, 0.78+0.32*t, 0.76+0.3*t); }
      geo.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
      const uvs = geo.attributes.uv; const uo = rng(), vo = rng(); for (let k=0;k<uvs.count;k++) uvs.setXY(k, uvs.getX(k)*0.5+uo, uvs.getY(k)*0.5+vo);
      const m = new THREE.Mesh(geo, mat); const s = 0.36 + rng()*0.12; m.scale.setScalar(s);
      m.position.set(x, moundY(r)+0.08, z); m.rotation.set(rng()*3, rng()*3, rng()*3); g.add(m); }
    return g; } },
{ id:'peanut', btn:'花生米', name:'花生米', note:'去皮油炸至金黄酥脆', swatch:'#d9a75f', explodeY:3.5,
  role:'口感担当。去皮花生米冷油下锅小火炸至金黄酥脆，出锅前最后才拌入，保持脆度。', amount:'约 50–80 克', fact:'花生要晾凉再放，否则吸了汁就不脆了；炸好的花生常会裂成两瓣。',
  build(THREE, rng){ const g = new THREE.Group(); const map = peanutMap(THREE);
    const whole = new THREE.SphereGeometry(0.15, 20, 14); const half = new THREE.SphereGeometry(0.15, 20, 10, 0, Math.PI*2, 0, Math.PI/2);
    const flat = new THREE.CircleGeometry(0.15, 20);
    const m1 = new THREE.MeshPhysicalMaterial({map, color:'#ffffff', roughness:0.5, clearcoat:0.35, clearcoatRoughness:0.4});
    const m2 = new THREE.MeshPhysicalMaterial({map, color:'#b77a46', roughness:0.35, clearcoat:0.8, clearcoatRoughness:0.2});
    const mf = new THREE.MeshStandardMaterial({map, color:'#f3d7a0', roughness:0.7, side:THREE.DoubleSide});
    for (let i=0;i<36;i++){ const [x,z,r] = spot(rng, R+0.1); const isHalf = i%3===0; const mat = i%4===1 ? m2 : m1;
      const pg = new THREE.Group();
      if (isHalf){ const h = new THREE.Mesh(half, mat); pg.add(h); const f = new THREE.Mesh(flat, mf); f.rotation.x = Math.PI/2; pg.add(f); pg.scale.set(1.2, 0.85, 0.85); }
      else { const w = new THREE.Mesh(whole, mat); w.scale.set(1.25, 0.82, 0.8); pg.add(w); }
      pg.position.set(x, moundY(Math.min(r,R))+0.12+rng()*0.08, z); pg.rotation.set(rng()*3, rng()*3, rng()*3); g.add(pg); }
    return g; } },
{ id:'chili', btn:'干辣椒', name:'干辣椒段', note:'剪段去籽，炝出糊辣香', swatch:'#7a1510', explodeY:4.7,
  role:'香味来源。干辣椒剪成约 2–3 厘米小段，和花椒一起小火炝到棕红发亮，出“糊辣”香，但不能炸黑发苦。', amount:'约 10–15 段（约 5–10 克）', fact:'川菜“糊辣味”的关键：辣椒炸到刚刚变色、香味最浓的那一刻。',
  build(THREE, rng){ const g = new THREE.Group(); const map = chiliMap(THREE);
    const m = new THREE.MeshPhysicalMaterial({map, roughness:0.3, clearcoat:1, clearcoatRoughness:0.12, side:THREE.DoubleSide});
    const inner = new THREE.MeshStandardMaterial({color:'#4a0c07', roughness:0.6, side:THREE.BackSide});
    const seedG = new THREE.CylinderGeometry(0.03, 0.03, 0.008, 10); const sm = std(THREE,'#e9c77c',{roughness:0.5});
    for (let i=0;i<16;i++){ const [x,z,r] = spot(rng, R); const L = 0.45 + rng()*0.25;
      const geo = new THREE.CylinderGeometry(0.085, 0.07, L, 20, 10, true); const p = geo.attributes.position; const ox = rng()*30;
      for (let k=0;k<p.count;k++){ const px=p.getX(k), py=p.getY(k), pz=p.getZ(k); const a = Math.atan2(pz, px);
        const w = 1 + 0.18*Math.sin(a*6 + py*14 + ox) + 0.12*(vnoise(Math.cos(a)*3+ox, py*8, Math.sin(a)*3) - 0.5); const fl = 1; p.setXYZ(k, px*w*1.15, py, pz*w*0.72*fl); }
      geo.computeVertexNormals();
      const cg = new THREE.Group(); cg.add(new THREE.Mesh(geo, m)); cg.add(new THREE.Mesh(geo, inner));
      for (let k=0;k<3;k++){ const sd = new THREE.Mesh(seedG, sm); sd.position.set((rng()-0.5)*0.06, (rng()-0.5)*L*0.7, (rng()-0.5)*0.03); sd.rotation.set(rng()*3, rng()*3, 0); cg.add(sd); }
      cg.position.set(x, moundY(r)+0.2, z); cg.rotation.set(Math.PI/2 + (rng()-0.5)*0.7, 0, rng()*6); g.add(cg);
      if (i%3===0){ const s = new THREE.Mesh(seedG, sm); s.position.set(x+0.14, moundY(r)+0.12, z+0.1); s.rotation.x = 1.2; g.add(s); } }
    return g; } },
{ id:'pepper', btn:'花椒', name:'花椒', note:'带来麻味的红花椒', swatch:'#6e2b19', explodeY:5.75,
  role:'麻味来源。与干辣椒同炝，给整道菜带来若有若无的麻香，“麻”与“辣”互相托衬。', amount:'约 1 小匙（约 2–3 克）', fact:'宫保鸡丁是“糊辣荔枝味”，花椒只做点缀，不能抢味。',
  build(THREE, rng){ const g = new THREE.Group(); const geo = new THREE.IcosahedronGeometry(0.05, 1); const m = std(THREE,'#6a2a18',{roughness:0.85});
    for (let i=0;i<36;i++){ const [x,z,r] = spot(rng, R); const p = new THREE.Mesh(geo, m); p.position.set(x, moundY(r)+0.2+rng()*0.06, z); g.add(p);
      const p2 = new THREE.Mesh(geo, m); p2.scale.setScalar(0.8); p2.position.set(x+0.07, p.position.y, z+0.02); g.add(p2); }
    return g; } },
{ id:'scallion', btn:'葱段', name:'葱段', note:'大葱白切小段', swatch:'#c9d98f', explodeY:6.75,
  role:'提香。大葱葱白切成与鸡丁差不多大小的段，与鸡丁同炒，带来葱香和清甜。', amount:'约 2–3 根葱白（约 50 克）', fact:'葱段要切得和鸡丁、花生差不多大，吃起来口感统一。',
  build(THREE, rng){ const g = new THREE.Group(); const geo = new THREE.CylinderGeometry(0.13, 0.13, 0.32, 24, 1, false);
    const side = scallionSide(THREE), cap = scallionCap(THREE);
    const mk = (tint) => [new THREE.MeshPhysicalMaterial({map:side, color:tint, roughness:0.35, clearcoat:0.6, clearcoatRoughness:0.25}),
      new THREE.MeshStandardMaterial({map:cap, color:tint, roughness:0.5}), new THREE.MeshStandardMaterial({map:cap, color:tint, roughness:0.5})];
    const mw = mk('#ffffff'), mg = mk('#c7dc8a'), mb = mk('#e6cf9a');
    for (let i=0;i<16;i++){ const [x,z,r] = spot(rng, R); const c = new THREE.Mesh(geo, i%4===0 ? mg : i%4===1 ? mb : mw); c.scale.set(1, 0.9+rng()*0.3, 1);
      c.position.set(x, moundY(r)+0.22, z); c.rotation.set(Math.PI/2 + (rng()-0.5)*0.6, 0, rng()*6); g.add(c); }
    return g; } },
{ id:'gingergarlic', btn:'姜蒜片', name:'姜片 · 蒜片', note:'切片爆香', swatch:'#ead9a8', explodeY:7.75,
  role:'去腥增香。姜、蒜切薄片（或末），与辣椒花椒一起下锅爆香，是川菜炒菜的底味。', amount:'姜约 10 克、蒜约 3–4 瓣（约 10–15 克）', fact:'有的做法用姜蒜末，更容易裹在鸡丁上。',
  build(THREE, rng){ const g = new THREE.Group();
    const garlic = new THREE.CylinderGeometry(0.15, 0.15, 0.035, 18); const mg = std(THREE,'#f3ecd2',{roughness:0.4});
    const ginger = new THREE.CylinderGeometry(0.18, 0.18, 0.035, 7); const mj = std(THREE,'#e6c06a',{roughness:0.45});
    for (let i=0;i<14;i++){ const [x,z,r] = spot(rng, R); const s = new THREE.Mesh(i%2? garlic : ginger, i%2? mg : mj); if (i%2) s.scale.set(1, 1, 0.7);
      s.position.set(x, moundY(r)+0.24, z); s.rotation.set((rng()-0.5)*1.0, rng()*6, (rng()-0.5)*1.0); g.add(s); }
    return g; } }
]};
})();
