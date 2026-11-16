// Embed parts2 collage images into template.html as data URIs.
// Usage: node photo-version/build.js
const fs = require('fs');
const path = require('path');

const here = __dirname;
const rootDir = path.resolve(here, '..');
const template = fs.readFileSync(path.join(here, 'template.html'), 'utf8');
const meta = JSON.parse(fs.readFileSync(path.join(here, 'meta.json'), 'utf8'));

const ASSET_FILES = {
  hero: 'hero.jpg',
  hero_alt: 'hero_alt.jpg',
  chicken: 'chicken_collage.jpg',
  peanut: 'peanut_collage.jpg',
  chili: 'chili_collage.jpg',
  scallion: 'scallion_collage.jpg',
  pepper: 'pepper_collage.jpg',
  gingergarlic: 'gingergarlic_collage.jpg',
  sauce: 'sauce_collage.jpg',
  plate: 'plate_collage.jpg'
};

function dataUri(file) {
  const p = path.join(here, 'parts2', file);
  const buf = fs.readFileSync(p);
  const ext = path.extname(file).slice(1).toLowerCase();
  const mime = ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg' : ext === 'png' ? 'image/png' : 'application/octet-stream';
  return `data:${mime};base64,` + buf.toString('base64');
}

const assets = {};
for (const [key, file] of Object.entries(ASSET_FILES)) assets[key] = dataUri(file);

let html = template
  .replace('/*META*/', JSON.stringify(meta))
  .replace('/*ASSETS*/', JSON.stringify(assets));

const out = path.join(here, 'index.html');
fs.writeFileSync(out, html);
console.log('wrote', path.relative(rootDir, out), html.length, 'bytes');
