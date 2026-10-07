# Tests

Browser tests that run the real calculator in Chromium (Playwright).

```bash
cd tests
npm install
npx playwright install chromium
npm test            # below-70% rule: popup, scenario flags, majors (about 10 s)
npm run test:ocr    # Final/Expected per page on the local samples (about 25 min)
npm run test:speed -- 1.pdf # serial 300 dpi/one-thread versus current settings
```

`test:ocr` reads the PDFs in `samples/`, which holds real student documents and is
git-ignored: never commit it. Pages in `expected-status.json` whose file is missing are skipped.
To add a case, put the PDF in `samples/` and add `"file.pdf": { "page": ["final"|"expected"|"unclear"] }`.

The speed comparison uses installed Google Chrome, excludes engine startup, and
checks that page, subject, level, grade, status and inclusion stay identical.
Reports remain in the ignored `samples/` folder. Pass multiple filenames to check
more samples; `--reuse-baseline` reuses the previously recorded one-thread results.
`node ocr-speed.test.js --config` checks thread selection without a
browser.

`node ocr-categories.test.js` checks category-specific Arabic safeguards, full
PDF extraction and CPU/page-level fallback.
For GPU versus the current threaded CPU, use `node ocr-speed.test.js --gpu 2.pdf`.
GPU reports use a separate `.gpu.benchmark.json` file; `--reuse-baseline --gpu`
compares to the saved threaded CPU run. `--british` tests the British reader
on CPU against the saved threaded CPU run. Startup is reported separately.

Run `node tests/subject-catalog.test.js` from the project root to check catalog CRUD, OCR aliases, inactivity, CSV/XLSX exports and offline fallback. It uses mocked catalog responses and installed Chrome; it does not change live data.
