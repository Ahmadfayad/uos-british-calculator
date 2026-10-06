// Serial comparison against the old 300 dpi / one-thread reader. PDFs and
// extracted rows stay local. Usage: node ocr-speed.test.js [1.pdf ...]
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');
const { serve } = require('./server');

if (process.argv.includes('--config')) {
  const vm = require('node:vm');
  const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  const load = html.slice(html.indexOf('async function loadOrt()'), html.indexOf('\nfunction paddleSession('));
  (async () => {
    for (const [isolated, cores, want] of [[false, 8, 1], [true, 8, 4], [true, 2, 1], [true, 1, 1]]) {
      const context = vm.createContext({ self: { crossOriginIsolated: isolated }, navigator: { hardwareConcurrency: cores },
        ort: { env: { wasm: {} } }, loadScriptOnce: async () => {}, ORT_CDN: '', ORT_WASM_PATH: '' });
      await vm.runInContext(load + '\nloadOrt()', context);
      assert.equal(context.ort.env.wasm.numThreads, want);
    }
    console.log('PASS thread selection and single-thread fallback');
  })().catch(error => { console.error(error); process.exitCode = 1; });
} else
(async () => {
  const { url, close } = await serve();
  const browser = await chromium.launch({ channel: 'chrome' });
  const reuse = process.argv.includes('--reuse-baseline');
  const british = process.argv.includes('--british');
  const gpu = process.argv.includes('--gpu');
  const files = process.argv.slice(2).filter(arg => !arg.startsWith('--'));
  if (!files.length) files.push('1.pdf');
  try {
    for (const file of files) {
      const report = path.join(__dirname, '..', 'samples', file + '.benchmark.json');
      const runs = reuse ? [JSON.parse(fs.readFileSync(report, 'utf8'))[british || gpu ? 1 : 0]] : [];
      for (const baseline of (reuse ? [false] : [true, false])) {
        const page = await browser.newPage();
        if (baseline || (british && !gpu)) await page.addInitScript(() => Object.defineProperty(navigator, 'gpu', {value:undefined}));
        if (baseline) await page.route('**/index.html', async route => {
          const response = await route.fetch();
          const html = (await response.text())
            .replace(/const PDF_RENDER_DPI = \d+;/, 'const PDF_RENDER_DPI = 300;')
            .replace(/ort\.env\.wasm\.numThreads = [^;]+;/, gpu || british ? 'ort.env.wasm.numThreads = self.crossOriginIsolated ? Math.max(1, Math.min(4, (navigator.hardwareConcurrency || 2) - 1)) : 1;' : 'ort.env.wasm.numThreads = 1;');
          await route.fulfill({ response, body: html });
        });
        await page.goto(url);
        if (gpu) console.log('GPU adapter available: ' + await page.evaluate(async () => !!(navigator.gpu && await navigator.gpu.requestAdapter())));
        console.log(`${file} ${baseline ? 'baseline' : 'candidate'}: loading engines`);
        await page.exposeFunction('benchmarkStatus', status => console.log(`${file}: ${status}`));
        const startupStart = Date.now();
        await page.evaluate(() => Promise.race([
          (async () => { await loadPdfLibrary(); await ensurePaddleReady(); })(),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Engine startup timed out')), 120000))
        ]));
        // Read directly, avoiding the review UI, caching and Auto's second engine.
        const run = await page.evaluate(async ({name, british}) => {
          const response = await fetch('samples/' + encodeURIComponent(name));
          if (!response.ok) throw new Error('Missing sample: ' + name);
          const file = new File([await response.arrayBuffer()], name, { type: 'application/pdf' });
          const start = performance.now();
          const pages = (await extractPages(file, ['paddle'], window.benchmarkStatus, { british })).paddle;
          const rows = parseDocument(pages, file.name, 'paddle').map(r =>
            [r.page, r.level, r.subject, r.grade, r.status, r.include].join('|')).sort();
          return { seconds: +( (performance.now() - start) / 1000).toFixed(1),
            threads: ort.env.wasm.numThreads, pages: pages.length, rows };
        }, {name: file, british: british && !baseline});
        run.startupSeconds = +((Date.now() - startupStart) / 1000 - run.seconds).toFixed(1);
        runs.push(run);
        console.log(`${file} ${baseline ? 'baseline' : 'candidate'}: ${run.seconds}s, ${run.threads} thread(s), ${run.pages} pages, ${run.rows.length} rows`);
        await page.close();
      }
      fs.writeFileSync(british || gpu ? report.replace('.benchmark.json', gpu ? '.gpu.benchmark.json' : '.british.benchmark.json') : report, JSON.stringify(runs, null, 2));
      assert.deepEqual(runs[1].rows, runs[0].rows, `${file}: extracted results changed; inspect the local benchmark report`);
      console.log(`PASS ${file}: identical results; ${Math.round((1 - runs[1].seconds / runs[0].seconds) * 100)}% faster`);
    }
  } finally { await browser.close(); close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
