window.DISH = (function(){
function std(THREE, color, o){ return new THREE.MeshStandardMaterial(Object.assign({color, roughness:0.55, metalness:0}, o||{})); }
const PT = 0.16; // plate food surface height
const R = 1.9;   // mound radius
const moundY = (r) => PT + 0.12 + Math.max(0, 1 - (r*r)/(R*R)) * 0.55;
function spot(rng, rmax){ const r = Math.sqrt(rng()) * (rmax||R); const a = rng()*Math.PI*2; return [Math.cos(a)*r, Math.sin(a)*r, r]; }
function roundedCube(THREE, s, k){ const g = new THREE.BoxGeometry(s, s*0.85, s, 4, 4, 4); const p = g.attributes.position; const v = new THREE.Vector3();
  for (let i=0;i<p.count;i++){ v.fromBufferAttribute(p,i); const n = v.clone().normalize().multiplyScalar(s*0.62); v.lerp(n, k); p.setXYZ(i, v.x, v.y, v.z); } g.computeVertexNormals(); return g; }
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
{ id:'sauce', btn:'酱汁', name:'宫保酱汁 · 荔枝味汁', note:'酱油 醋 糖 淀粉 调成', swatch:'#8a2e16', explodeY:1.4, anchorK:0.85,
  role:'调味核心。生抽、香醋、白糖、料酒、少许盐和水淀粉预先调成碗芡，出锅前倒入，收汁后红亮挂在每块鸡丁上，酸甜微辣的“荔枝味”就来自这里。', amount:'约 50–70 毫升（生抽约 1 汤匙、醋约 1–1.5 汤匙、糖约 1–1.5 汤匙、水淀粉约 2 汤匙，均为约数）', fact:'“荔枝味”不是放了荔枝，而是糖醋比例让酸甜像荔枝一样先甜后酸。',
  build(THREE, rng){ const g = new THREE.Group();
    const sh = new THREE.Shape(); const n = 40; for (let k=0;k<=n;k++){ const a=k/n*Math.PI*2; const r = 2.15 + 0.22*Math.sin(a*3+0.5) + 0.12*Math.sin(a*7); const x=Math.cos(a)*r, y=Math.sin(a)*r; k? sh.lineTo(x,y) : sh.moveTo(x,y); }
    const geo = new THREE.ExtrudeGeometry(sh, {depth:0.03, bevelEnabled:true, bevelSize:0.06, bevelThickness:0.025, bevelSegments:3, curveSegments:4});
    const m = new THREE.Mesh(geo, new THREE.MeshPhysicalMaterial({color:'#8c2d14', roughness:0.12, clearcoat:1, clearcoatRoughness:0.05, transparent:true, opacity:0.92}));
    m.rotation.x = -Math.PI/2; m.position.y = PT + 0.0; m.userData.noShadow = true; g.add(m);
    const om = new THREE.MeshPhysicalMaterial({color:'#c9431c', roughness:0.05, clearcoat:1, transparent:true, opacity:0.85});
    for (let i=0;i<22;i++){ const [x,z] = spot(rng, 2.1); const d = new THREE.Mesh(new THREE.SphereGeometry(0.06+rng()*0.08, 12, 8), om); d.scale.y = 0.2; d.position.set(x, PT+0.07, z); d.userData.noShadow = true; g.add(d); }
    return g; } },
{ id:'chicken', btn:'鸡丁', name:'鸡丁', note:'鸡腿肉/鸡胸肉切丁', swatch:'#c98a4a', explodeY:2.5,
  role:'主料。鸡腿肉（更嫩）或鸡胸肉切 1.5 厘米左右的丁，用盐、料酒、蛋清、淀粉上浆，热油滑炒后外焦里嫩。', amount:'约 250–300 克', fact:'传统做法多用鸡腿肉，切丁前先用刀背拍松、划十字花刀更入味。',
  build(THREE, rng){ const g = new THREE.Group(); const geo = roundedCube(THREE, 0.42, 0.45);
    const mats = [std(THREE,'#c4813f',{roughness:0.35}), std(THREE,'#b56d32',{roughness:0.35}), std(THREE,'#d59a5a',{roughness:0.35})];
    for (let i=0;i<30;i++){ const [x,z,r] = spot(rng, R-0.1); const m = new THREE.Mesh(geo, mats[i%3]); const s = 0.8+rng()*0.45;
      m.scale.set(s, s*(0.8+rng()*0.3), s*(0.9+rng()*0.3)); m.position.set(x, moundY(r)+0.05, z); m.rotation.set(rng()*3, rng()*3, rng()*3); g.add(m); }
    return g; } },
{ id:'peanut', btn:'花生米', name:'花生米', note:'油炸至酥脆', swatch:'#dba25c', explodeY:3.5,
  role:'口感担当。去皮花生米冷油下锅小火炸至酥脆，出锅前最后才拌入，保持脆度。', amount:'约 50–80 克', fact:'花生要晾凉再放，否则吸了汁就不脆了。',
  build(THREE, rng){ const g = new THREE.Group(); const geo = new THREE.SphereGeometry(0.15, 16, 12); const m1 = std(THREE,'#e0aa64',{roughness:0.45}); const m2 = std(THREE,'#c98b48',{roughness:0.5});
    for (let i=0;i<34;i++){ const [x,z,r] = spot(rng, R+0.1); const m = new THREE.Mesh(geo, i%4? m1 : m2); m.scale.set(1.15, 0.78, 0.78);
      m.position.set(x, moundY(Math.min(r,R))+0.12+rng()*0.08, z); m.rotation.set(rng()*3, rng()*3, rng()*3); g.add(m); }
    return g; } },
{ id:'chili', btn:'干辣椒', name:'干辣椒段', note:'剪段去籽，炝出糊辣香', swatch:'#a3160f', explodeY:4.7,
  role:'香味来源。干辣椒剪成约 2 厘米小段，和花椒一起小火炝到棕红，出“糊辣”香，但不能炸黑发苦。', amount:'约 10–15 段（约 5–10 克）', fact:'川菜“糊辣味”的关键：辣椒炸到刚刚变色、香味最浓的那一刻。',
  build(THREE, rng){ const g = new THREE.Group(); const geo = new THREE.CylinderGeometry(0.085, 0.075, 0.42, 14, 1, true); const m = std(THREE,'#a8180f',{roughness:0.3, side:THREE.DoubleSide});
    const seedG = new THREE.SphereGeometry(0.025, 6, 4); const sm = std(THREE,'#e8c27a');
    for (let i=0;i<16;i++){ const [x,z,r] = spot(rng, R); const c = new THREE.Mesh(geo, m); c.position.set(x, moundY(r)+0.2, z); c.rotation.set(Math.PI/2 + (rng()-0.5)*0.8, 0, rng()*6); g.add(c);
      if (i%3===0){ const s = new THREE.Mesh(seedG, sm); s.position.set(x+0.1, moundY(r)+0.15, z+0.08); g.add(s); } }
    return g; } },
{ id:'pepper', btn:'花椒', name:'花椒', note:'带来麻味的红花椒', swatch:'#6e2b19', explodeY:5.75,
  role:'麻味来源。与干辣椒同炝，给整道菜带来若有若无的麻香，“麻”与“辣”互相托衬。', amount:'约 1 小匙（约 2–3 克）', fact:'宫保鸡丁是“糊辣荔枝味”，花椒只做点缀，不能抢味。',
  build(THREE, rng){ const g = new THREE.Group(); const geo = new THREE.IcosahedronGeometry(0.05, 1); const m = std(THREE,'#6a2a18',{roughness:0.85});
    for (let i=0;i<36;i++){ const [x,z,r] = spot(rng, R); const p = new THREE.Mesh(geo, m); p.position.set(x, moundY(r)+0.2+rng()*0.06, z); g.add(p);
      const p2 = new THREE.Mesh(geo, m); p2.scale.setScalar(0.8); p2.position.set(x+0.07, p.position.y, z+0.02); g.add(p2); }
    return g; } },
{ id:'scallion', btn:'葱段', name:'葱段', note:'大葱白切小段', swatch:'#8cc05a', explodeY:6.75,
  role:'提香。大葱葱白切成与鸡丁差不多大小的段，与鸡丁同炒，带来葱香和清甜。', amount:'约 2–3 根葱白（约 50 克）', fact:'葱段要切得和鸡丁、花生差不多大，吃起来口感统一。',
  build(THREE, rng){ const g = new THREE.Group(); const geo = new THREE.CylinderGeometry(0.1, 0.1, 0.34, 16, 1, false);
    const mw = std(THREE,'#eef3d8',{roughness:0.4}); const mg = std(THREE,'#86bd55',{roughness:0.4});
    for (let i=0;i<14;i++){ const [x,z,r] = spot(rng, R); const c = new THREE.Mesh(geo, i%3? mw : mg); c.position.set(x, moundY(r)+0.22, z); c.rotation.set(Math.PI/2 + (rng()-0.5)*0.5, 0, rng()*6); g.add(c); }
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
