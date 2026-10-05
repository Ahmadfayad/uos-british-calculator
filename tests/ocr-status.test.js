// Checks the Final/Expected decision on the local sample certificates (samples/*.pdf, never committed).
// Usage:  npm install  &&  npm run test:ocr [file.pdf]      (takes ~25 minutes: every page is read with OCR)
const { chromium } = require('playwright');
const path = require('path'), fs = require('fs');
const { serve } = require('./server');

const expected = JSON.parse(fs.readFileSync(path.join(__dirname, 'expected-status.json'), 'utf8').replace(/^\uFEFF/, ''));
const samples = path.join(__dirname, '..', 'samples');

(async () => {
  const { url, close } = await serve();
  const browser = await chromium.launch();
  let failures = 0;
  const only = process.argv[2];
  for (const [file, pages] of Object.entries(expected)) {
    if (only && file !== only) continue;
    const full = path.join(samples, file);
    if (!fs.existsSync(full)) { console.log(`SKIP ${file} (not in samples/)`); continue; }
    const page = await browser.newPage();
    await page.goto(url);
    await page.setInputFiles('#ocr-file-input', full);
    await page.waitForFunction(() => /Finished/.test(document.getElementById('ocr-progress')?.innerText || ''), null, { timeout: 900000 });
    const rows = await page.evaluate(() => window._ocrRows.filter(r => r.level !== 'moe').map(r => ({ page: r.page, status: r.reasons.has('status') ? 'unclear' : r.status })));
    for (const [pg, want] of Object.entries(pages)) {
      const got = [...new Set(rows.filter(r => String(r.page) === pg).map(r => r.status))].sort();
      const ok = JSON.stringify(got) === JSON.stringify(want);
      if (!ok) failures++;
      console.log(`${ok ? 'PASS' : 'FAIL'} ${file} p${pg}: expected ${want.join('+')}, got ${got.join('+') || 'no rows'}`);
    }
    await page.close();
  }
  await browser.close(); close();
  console.log(failures ? `${failures} FAILED` : 'All passed');
  process.exit(failures ? 1 : 0);
})();

