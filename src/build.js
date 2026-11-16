// Bundle template + three.min.js + dish + engine into a single offline HTML page.
// Usage: node src/build.js <dish.js> <out.html>
const fs = require('fs');
const path = require('path');

const dishArg = process.argv[2];
const outArg = process.argv[3];
if (!dishArg || !outArg) {
  console.error('Usage: node src/build.js <dish.js> <out.html>');
  process.exit(1);
}

const srcDir = __dirname;
const rootDir = path.resolve(srcDir, '..');
const threePath = path.join(rootDir, 'node_modules', 'three', 'build', 'three.min.js');
if (!fs.existsSync(threePath)) {
  console.error('Missing three.js at ' + threePath + '\nRun `npm install` in the repo root first.');
  process.exit(1);
}

const dishPath = path.resolve(rootDir, dishArg);
const outPath = path.resolve(rootDir, outArg);
let html = fs.readFileSync(path.join(srcDir, 'template.html'), 'utf8');
const three = fs.readFileSync(threePath, 'utf8');
const dishSrc = fs.readFileSync(dishPath, 'utf8');

const sandbox = { window: {} };
// dish files assign window.DISH = ...
const vm = require('vm');
vm.runInNewContext(dishSrc, sandbox, { filename: dishPath });
const dish = sandbox.window.DISH;
if (!dish || !dish.title) {
  console.error('Dish file did not define window.DISH.title:', dishPath);
  process.exit(1);
}

html = html.split('__TITLE__').join(dish.title).split('__SUBTITLE__').join(dish.subtitle);
html = html
  .replace('/*THREE*/', () => three)
  .replace('/*DISH*/', () => dishSrc)
  .replace('/*ENGINE*/', () => fs.readFileSync(path.join(srcDir, 'engine.js'), 'utf8'));

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, html);
console.log('wrote', path.relative(rootDir, outPath), html.length, 'bytes');
