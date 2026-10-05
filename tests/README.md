# Tests

Browser tests that run the real calculator in Chromium (Playwright).

```bash
cd tests
npm install
npx playwright install chromium
npm test            # below-70% rule: popup, scenario flags, majors (about 10 s)
npm run test:ocr    # Final/Expected per page on the local samples (about 25 min)
```

`test:ocr` reads the PDFs in `samples/`, which holds real student documents and is
git-ignored: never commit it. Pages in `expected-status.json` whose file is missing are skipped.
To add a case, put the PDF in `samples/` and add `"file.pdf": { "page": ["final"|"expected"|"unclear"] }`.
