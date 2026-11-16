// Record stills and an auto-tour video of the photo-based teardown.
// Usage: node photo-version/record_photo.js
// Requires a built photo-version/index.html. Videos go to media/.
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const here = __dirname;
const rootDir = path.resolve(here, '..');
const dir = here;
const name = 'kungpao_photo_teardown';
const index = path.join(dir, 'index.html');
if (!fs.existsSync(index)) {
  console.error('Missing', index, '— run `npm run build:photo` first.');
  process.exit(1);
}
const mediaDir = path.join(rootDir, 'media');
fs.mkdirSync(mediaDir, { recursive: true });

(async () => {
  const launchOpts = {
    args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--no-sandbox']
  };
  if (fs.existsSync('/usr/bin/google-chrome')) launchOpts.executablePath = '/usr/bin/google-chrome';

  const browser = await chromium.launch(launchOpts);
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1.5 });
  const errs = [];
  page.on('pageerror', e => errs.push(String(e)));
  page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await page.goto('file://' + index, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(800);

  await page.evaluate(() => act('all'));
  await page.waitForTimeout(900);
  await page.screenshot({ path: path.join(dir, name + '_assembled.png') });

  await page.evaluate(() => act('chicken'));
  await page.waitForTimeout(900);
  await page.screenshot({ path: path.join(dir, name + '_chicken.png') });

  await page.evaluate(() => act('chili'));
  await page.waitForTimeout(900);
  await page.screenshot({ path: path.join(dir, name + '_chili.png') });

  await page.evaluate(() => act('explode'));
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(dir, name + '_exploded.png') });

  const fdir = path.join(rootDir, 'frames_kungpao_photo');
  fs.rmSync(fdir, { recursive: true, force: true });
  fs.mkdirSync(fdir);

  const steps = ['all', 'chicken', 'peanut', 'chili', 'pepper', 'scallion', 'gingergarlic', 'sauce', 'plate', 'explode', 'all'];
  let frame = 0;
  for (const s of steps) {
    await page.evaluate(id => act(id), s);
    const hold = (s === 'all' || s === 'explode') ? 30 : 24;
    for (let i = 0; i < hold; i++) {
      await page.waitForTimeout(66);
      await page.screenshot({
        path: path.join(fdir, 'f' + String(frame).padStart(5, '0') + '.jpg'),
        type: 'jpeg',
        quality: 88
      });
      frame++;
    }
    console.log('step', s, 'frames', frame);
  }

  const outMp4 = path.join(mediaDir, name + '.mp4');
  execSync(
    `ffmpeg -y -loglevel error -framerate 15 -i ${fdir}/f%05d.jpg ` +
    `-vf "scale=1280:720:flags=lanczos" -pix_fmt yuv420p -c:v libx264 -preset fast -crf 22 -movflags +faststart ${outMp4}`
  );
  console.log('video done frames', frame, outMp4);
  console.log('errors', JSON.stringify(errs));
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
