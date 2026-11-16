window.DISH = (function(){
const innerR = y => 1.0 + 2.0 * Math.pow(Math.max(0,(y-0.25)/1.75), 0.8);
const BROTH_Y = 1.5;
function std(THREE, color, o){ return new THREE.MeshStandardMaterial(Object.assign({color, roughness:0.55, metalness:0}, o||{})); }
return {
title:'兰州牛肉面 · 拆解', subtitle:'一清 二白 三红 四绿 五黄 —— 一碗面拆成七个部分',
intro:'兰州牛肉面讲究“一清二白三红四绿五黄”：汤清、萝卜白、辣油红、香菜蒜苗绿、面条黄亮。点下方按钮，把每一样单独拎出来看。',
cam:{all:12.5, allY:1.0, focus:15.5, focusY:4.6, focusSide:2.6, restSide:3.4, explode:22.5, explodeY:5.7},
tourOrder:['broth','radish','chili','greens','noodles','beef','bowl'],
parts:[
{ id:'bowl', btn:'海碗', name:'大海碗', note:'白瓷蓝边，汤宽面足', swatch:'#f4f3ef', explodeY:0,
  role:'盛器。大口海碗让汤面宽、散热快，面条能在汤里舒展开，不容易坨。', amount:'容量约 1 升', fact:'兰州街头的面馆多用白瓷大碗，碗口宽，方便把面、汤、配料一眼看全。',
  build(THREE){
    const g = new THREE.Group();
    const pts = [new THREE.Vector2(0,0), new THREE.Vector2(1.15,0), new THREE.Vector2(1.18,0.1), new THREE.Vector2(1.1,0.2)];
    for (let i=0;i<=16;i++){ const y=0.2+i/16*1.82; pts.push(new THREE.Vector2(innerR(Math.max(0.25,y))+0.13, y)); }
    pts.push(new THREE.Vector2(3.17,2.05), new THREE.Vector2(3.08,2.07));
    for (let i=16;i>=0;i--){ const y=0.25+i/16*1.78; pts.push(new THREE.Vector2(innerR(y), y)); }
    pts.push(new THREE.Vector2(0,0.25));
    g.add(new THREE.Mesh(new THREE.LatheGeometry(pts, 96), std(THREE,'#f6f4ee',{roughness:0.22, side:THREE.DoubleSide})));
    const band = []; for (let i=0;i<=6;i++){ const y=1.62+i/6*0.22; band.push(new THREE.Vector2(innerR(y)+0.145, y)); }
    g.add(new THREE.Mesh(new THREE.LatheGeometry(band, 96), std(THREE,'#2f5da8',{roughness:0.3, side:THREE.DoubleSide})));
    const band2 = []; for (let i=0;i<=4;i++){ const y=1.45+i/4*0.05; band2.push(new THREE.Vector2(innerR(y)+0.142, y)); }
    g.add(new THREE.Mesh(new THREE.LatheGeometry(band2, 96), std(THREE,'#2f5da8',{roughness:0.3, side:THREE.DoubleSide})));
    const rim = new THREE.Mesh(new THREE.TorusGeometry(3.12, 0.035, 8, 120), std(THREE,'#2f5da8',{roughness:0.3}));
    rim.rotation.x = Math.PI/2; rim.position.y = 2.06; g.add(rim);
    return g; } },
{ id:'broth', tag:'一清', btn:'清汤', name:'清汤', note:'牛骨熬制的清汤', swatch:'#d6a24f', explodeY:2.6, anchorK:0.9,
  role:'整碗面的灵魂。牛骨、牛肉加花椒、草果、桂皮、姜等香料小火慢熬，撇净浮沫，汤色清亮。', amount:'约 400–500 毫升', fact:'“清”是第一讲究：汤要清而不浑、鲜而不腻，常配少量牛肝汤澄清。',
  build(THREE){
    const g = new THREE.Group();
    const pts = [new THREE.Vector2(0,0.27)];
    for (let i=0;i<=14;i++){ const y=0.27+i/14*(BROTH_Y-0.27); pts.push(new THREE.Vector2(innerR(y)-0.012, y)); }
    pts.push(new THREE.Vector2(0, BROTH_Y));
    const m = new THREE.Mesh(new THREE.LatheGeometry(pts, 96), new THREE.MeshPhysicalMaterial({color:'#d9a552', roughness:0.08, transparent:true, opacity:0.52, depthWrite:false, side:THREE.DoubleSide, clearcoat:1}));
    m.userData.noShadow = true; m.renderOrder = 2; g.add(m);
    const top = new THREE.Mesh(new THREE.CircleGeometry(innerR(BROTH_Y)-0.012, 96), new THREE.MeshPhysicalMaterial({color:'#e2b25e', roughness:0.04, transparent:true, opacity:0.42, depthWrite:false, clearcoat:1}));
    top.rotation.x = -Math.PI/2; top.position.y = BROTH_Y + 0.002; top.userData.noShadow = true; top.renderOrder = 3; g.add(top);
    return g; } },
{ id:'noodles', tag:'五黄', btn:'拉面', name:'手工拉面', note:'黄亮筋道的拉面', swatch:'#f0cf72', explodeY:4.6,
  role:'主食。面团加蓬灰（或碱）揉匀，手工拉成毛细、二细、三细、韭叶、大宽等粗细，煮熟后黄亮有嚼劲。', amount:'约 150–250 克（熟面）', fact:'“五黄”指面条黄亮——是蓬灰里的碱让面带上淡淡的黄色。',
  build(THREE, rng){
    const g = new THREE.Group(); const mat = std(THREE,'#f1d07a',{roughness:0.42});
    for (let s=0;s<34;s++){
      const pts = []; const a0 = rng()*Math.PI*2; const turns = 1.2 + rng()*1.4; const n = 48;
      const yb = 0.55 + rng()*0.75; const ph = rng()*6.28;
      for (let i=0;i<=n;i++){ const t=i/n; const a=a0+t*turns*Math.PI*2*(s%2?1:-1);
        let y = yb + Math.sin(t*9+ph)*0.22 + (s<10 ? Math.sin(t*Math.PI)*0.35 : 0);
        y = Math.min(1.62, Math.max(0.45, y));
        const rmax = innerR(y) - 0.25; const r = Math.min(rmax, 0.35 + (0.5+0.5*Math.sin(t*5+ph*2))*rmax*0.85);
        pts.push(new THREE.Vector3(Math.cos(a)*r, y, Math.sin(a)*r)); }
      const curve = new THREE.CatmullRomCurve3(pts);
      g.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 160, 0.05, 6, false), mat)); }
    return g; } },
{ id:'radish', tag:'二白', btn:'萝卜', name:'白萝卜片', note:'清甜解腻的萝卜片', swatch:'#f2efe2', explodeY:5.9,
  role:'配菜。白萝卜切薄片在牛肉汤里煮到半透明，吸饱汤汁，清甜解腻。', amount:'约 4–6 片（约 30–50 克）', fact:'“二白”说的就是汤里雪白的萝卜片。',
  build(THREE, rng){
    const g = new THREE.Group(); const mat = new THREE.MeshPhysicalMaterial({color:'#f3f0e3', roughness:0.3, transmission:0.15, thickness:0.05, sheen:0.4});
    for (let i=0;i<6;i++){ const m = new THREE.Mesh(new THREE.BoxGeometry(0.82,0.05,0.52), mat);
      m.position.set(1.15 + (i%3)*0.32 - 0.3, BROTH_Y+0.04+i*0.018, -0.9 + Math.floor(i/3)*0.45 - 0.2 + rng()*0.1);
      m.rotation.set((rng()-0.5)*0.15, rng()*Math.PI, (rng()-0.5)*0.15); g.add(m); }
    return g; } },
{ id:'beef', btn:'牛肉', name:'牛肉片', note:'腱子肉切薄片', swatch:'#7a4330', explodeY:7.15,
  role:'荤料。熬汤用的牛腱子肉捞出晾凉，切成薄片或小丁，咸香有嚼头。', amount:'约 30–50 克（另加肉可多）', fact:'传统一碗里肉不多，“加肉”“加蛋”是常见点法。',
  build(THREE, rng){
    const g = new THREE.Group(); const mat = std(THREE,'#74402d',{roughness:0.72}); const fat = std(THREE,'#c9a184',{roughness:0.6});
    for (let i=0;i<5;i++){
      const sh = new THREE.Shape(); const n=10; for (let k=0;k<n;k++){ const a=k/n*Math.PI*2; const r=(0.42+rng()*0.1)*(k%2?1:0.92);
        const x=Math.cos(a)*r*1.35, y=Math.sin(a)*r*0.85; k? sh.lineTo(x,y) : sh.moveTo(x,y); }
      const geo = new THREE.ExtrudeGeometry(sh, {depth:0.05, bevelEnabled:true, bevelSize:0.02, bevelThickness:0.02, bevelSegments:1});
      const m = new THREE.Mesh(geo, mat); m.rotation.x = -Math.PI/2 + (rng()-0.5)*0.12; m.rotation.z = 0.5 + i*0.35;
      m.position.set(-1.3 + i*0.18, BROTH_Y + 0.06 + i*0.03, 0.75 + i*0.1); g.add(m);
      const vein = new THREE.Mesh(new THREE.BoxGeometry(0.5,0.012,0.04), fat); vein.position.copy(m.position).add(new THREE.Vector3(0,0.085,0)); vein.rotation.y = -m.rotation.z; g.add(vein); }
    return g; } },
{ id:'chili', tag:'三红', btn:'辣油', name:'油泼辣子', note:'红亮的辣椒油', swatch:'#c4281c', explodeY:8.25,
  role:'调味与颜色。辣椒面用热油泼香，红亮浮在汤面，香而不燥。', amount:'约 1–2 汤匙（约 10–20 克）', fact:'“三红”是辣油红——讲究红而不辣喉，很多店可以说“多辣”“不要辣”。',
  build(THREE, rng){
    const g = new THREE.Group();
    const film = new THREE.Mesh(new THREE.RingGeometry(1.1, innerR(BROTH_Y)-0.05, 72, 1, 0.3, 2.6), new THREE.MeshPhysicalMaterial({color:'#c3261a', roughness:0.1, transparent:true, opacity:0.7, clearcoat:1, side:THREE.DoubleSide}));
    film.rotation.x = -Math.PI/2; film.position.y = BROTH_Y + 0.012; film.userData.noShadow = true; g.add(film);
    const dm = new THREE.MeshPhysicalMaterial({color:'#d8401e', roughness:0.08, clearcoat:1, transparent:true, opacity:0.9});
    for (let i=0;i<46;i++){ const r = 0.6 + rng()*(innerR(BROTH_Y)-0.8); const a = rng()*Math.PI*2; const s = 0.05 + rng()*0.12;
      const d = new THREE.Mesh(new THREE.SphereGeometry(s, 14, 8), dm); d.scale.y = 0.18; d.position.set(Math.cos(a)*r, BROTH_Y+0.015, Math.sin(a)*r); d.userData.noShadow = true; g.add(d); }
    const fm = std(THREE,'#8e1a12',{roughness:0.8});
    for (let i=0;i<40;i++){ const r = 1.1 + rng()*1.2; const a = 0.3 + rng()*2.6; const f = new THREE.Mesh(new THREE.BoxGeometry(0.07,0.02,0.05), fm);
      f.position.set(Math.cos(a)*r, BROTH_Y+0.03, -Math.sin(a)*r); f.rotation.y = rng()*3; g.add(f); }
    return g; } },
{ id:'greens', tag:'四绿', btn:'香菜蒜苗', name:'香菜 · 蒜苗', note:'碧绿提香的点缀', swatch:'#4c9b3a', explodeY:9.25,
  role:'提香增色。香菜清香、蒜苗辛香，撒在面上，绿色衬着红油白萝卜，一眼好看。', amount:'约 5–10 克', fact:'“四绿”——不吃香菜可以说“不要香菜”，只留蒜苗。',
  build(THREE, rng){
    const g = new THREE.Group();
    const leafShape = new THREE.Shape(); for (let k=0;k<=24;k++){ const a=k/24*Math.PI*2; const r=0.11*(1+0.35*Math.cos(a*3)); const x=Math.cos(a)*r, y=Math.sin(a)*r; k? leafShape.lineTo(x,y):leafShape.moveTo(x,y); }
    const lg = new THREE.ShapeGeometry(leafShape); const lm = std(THREE,'#3f9a36',{roughness:0.5, side:THREE.DoubleSide});
    for (let i=0;i<26;i++){ const r = rng()*0.95; const a = rng()*Math.PI*2; const l = new THREE.Mesh(lg, lm);
      l.position.set(Math.cos(a)*r - 0.1, 1.66 + rng()*0.12, Math.sin(a)*r); l.rotation.set(-Math.PI/2 + (rng()-0.5)*0.6, (rng()-0.5)*0.6, rng()*6); g.add(l); }
    const sg = new THREE.CylinderGeometry(0.065, 0.065, 0.13, 12, 1, true); const s1 = std(THREE,'#74b843',{roughness:0.45, side:THREE.DoubleSide}); const s2 = std(THREE,'#dcefc4',{roughness:0.45, side:THREE.DoubleSide});
    for (let i=0;i<34;i++){ const r = rng()*1.0; const a = rng()*Math.PI*2; const s = new THREE.Mesh(sg, i%3? s1 : s2);
      s.position.set(Math.cos(a)*r + 0.1, 1.68 + rng()*0.12, Math.sin(a)*r); s.rotation.set(Math.PI/2 + (rng()-0.5)*0.8, 0, rng()*6); g.add(s); }
    return g; } }
]};
})();
