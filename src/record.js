// Record stills or an auto-tour video from a built demo page.
// Usage: node src/record.js <demo-dir> <name> <stills|video|phone> [closeupPartId]
// Videos are written to media/<name>.mp4. Stills go into the demo directory.
// Frame dumps (gitignored) go to frames_<name>/ in the repo root.
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = path.resolve(__dirname, '..');
const dirArg = process.argv[2];
const name = process.argv[3];
const mode = process.argv[4];
const closeupId = process.argv[5];

if (!dirArg || !name || !['stills', 'video', 'phone'].includes(mode)) {
  console.error('Usage: node src/record.js <demo-dir> <name> <stills|video|phone> [closeupPartId]');
  process.exit(1);
}

const dir = path.resolve(rootDir, dirArg);
const index = path.join(dir, 'index.html');
if (!fs.existsSync(index)) {
  console.error('Missing', index, '— build the demo first.');
  process.exit(1);
}

const mediaDir = path.join(rootDir, 'media');
fs.mkdirSync(mediaDir, { recursive: true });

(async () => {
  const browser = await chromium.launch({
    args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist']
  });
  const phone = mode === 'phone';
  const page = await browser.newPage({
    viewport: phone ? { width: 390, height: 844 } : { width: 1280, height: 720 },
    deviceScaleFactor: phone ? 2 : 1.5
  });
  const errs = [];
  page.on('pageerror', e => errs.push(String(e)));
  page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });

  await page.goto('file://' + index + '?record=1');
  await page.waitForFunction(() => window.__ready, null, { timeout: 60000 });
  const dt = 1 / 30;

  if (mode === 'stills' || phone) {
    const suffix = phone ? '_phone' : '';
    await page.evaluate(dt => { __act('all'); __advance(dt, 120); }, dt);
    await page.screenshot({ path: path.join(dir, name.replace(/_teardown$/, '') + suffix + '_assembled.png') });
    await page.evaluate(dt => { __act('explode'); __advance(dt, 150); }, dt);
    await page.screenshot({ path: path.join(dir, name.replace(/_teardown$/, '') + suffix + '_exploded.png') });
    await page.evaluate(dt => { __act(window.DISH.tourOrder[0]); __advance(dt, 120); }, dt);
    await page.screenshot({ path: path.join(dir, name.replace(/_teardown$/, '') + suffix + '_focus.png') });
    if (closeupId && !phone) {
      await page.evaluate(([dt, id]) => {
        __act(id);
        __advance(dt, 150);
        const P = __byId[id];
        const c = P.center.clone().add(P.off);
        __cam.tTarget.copy(c);
        __cam.zoom = 0.5;
        __cam.tPol = 0.95;
        __advance(dt, 150);
      }, [dt, closeupId]);
      await page.screenshot({ path: path.join(dir, name.replace(/_teardown$/, '') + '_' + closeupId + '_closeup.png') });
    }
  } else {
    const fdir = path.join(rootDir, 'frames_' + name);
    fs.rmSync(fdir, { recursive: true, force: true });
    fs.mkdirSync(fdir);
    const len = await page.evaluate(() => window.__tourLength);
    await page.evaluate(() => __startTour());
    const N = Math.round(len * 30);
    for (let i = 0; i < N; i++) {
      await page.evaluate(dt => __advance(dt, 1), dt);
      await page.screenshot({
        path: path.join(fdir, 'f' + String(i).padStart(5, '0') + '.jpg'),
        type: 'jpeg',
        quality: 92
      });
      if (i % 150 === 0) console.log('frame', i, '/', N);
    }
    const outMp4 = path.join(mediaDir, name.endsWith('.mp4') ? name : name + '.mp4');
    execSync(
      `ffmpeg -y -loglevel error -framerate 30 -i ${fdir}/f%05d.jpg ` +
      `-vf "scale=1920:1080:flags=lanczos:in_range=full:out_range=tv,format=yuv420p" ` +
      `-pix_fmt yuv420p -color_range tv -c:v libx264 -preset slow -crf 20 -movflags +faststart ${outMp4}`
    );
    console.log('video done', outMp4);
  }

  if (errs.length) console.log('errors:', JSON.stringify(errs));
  else console.log('errors: []');
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
