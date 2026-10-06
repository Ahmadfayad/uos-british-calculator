// School letters and tables: rows must be read, with the right level and Final/Expected status.
const { chromium } = require('playwright');
const { serve } = require('./server');

const pages = {
  'status table, OCR column order': {
    text: 'TO WHOM IT MAY CONCERN\nExamination / Results Status\nExamination Subject\nBoard\nJune 2023 / PASSED - E\nIGCSE Biology\nCambridge\nEnglish as a Second June 2025 / PASSED - C\nIGCSE\nLanguage Cambridge\nNov 2025 / PREDICTED\nIGCSE Mathematics\nCambridge GRADE - C\nBiology Nov 2025 / PREDICTED\nIGCSE\n(Repeated) Cambridge GRADE - C\nNov 2025 / PREDICTED\nAS Level Chemistry\nEdexcel GRADE - D',
    want: ['o-level|English - Second Language|C|final', 'o-level|Mathematics|C|expected', 'o-level|Biology|C|expected', 'as-level|Chemistry|D|expected']
  },
  'predicted letter: "CIE A Level BIOLOGY : A*"': {
    text: 'To Whom It May Concern\nSub: Predicted Grades\nCIE A Level BIOLOGY : A*\nCIE A Level CHEMISTRY : B',
    want: ['a-level|Biology|A*|expected', 'a-level|Chemistry|B|expected']
  },
  'interim report with teacher names': {
    text: 'INTERIM REPORT YEAR 13\nSUBJECT TEACHER University Predicated Grade\nBiology Mr D Roughley A*\nMathematics Mr C Cooper B\nYear 13 University Predicted Grade',
    want: ['a-level|Biology|A*|expected', 'a-level|Mathematics|B|expected']
  },
  'transcript with exam board and internal grades': {
    text: 'ACADEMIC TRANSCRIPT\nGCE Advanced Level: (Year 13)\nSubject Name Exam Board Predicted Grade Date\nBiology Pearson Edexcel A* June 2026\nGCE Advanced Level: (Year 12)\nSubject Name Internal school Grade Date\nChemistry Internal school B June 2025',
    want: ['a-level|Biology|A*|expected', 'a-level|Chemistry|B|expected']
  }
};

(async () => {
  const { url, close } = await serve();
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto(url);
  let failures = 0;
  for (const [name, { text, want }] of Object.entries(pages)) {
    const got = await page.evaluate(t => parseDocument([{ page: 1, text: t, confidence: 100, source: 'text' }], 'x', 'paddle')
      .filter(r => r.include).map(r => [r.level, r.subject, r.grade, r.status].join('|')), text);
    const missing = want.filter(w => !got.includes(w));
    if (missing.length) failures++;
    console.log(`${missing.length ? 'FAIL' : 'PASS'} ${name}${missing.length ? ': missing ' + missing.join(', ') + ' (got ' + got.join(', ') + ')' : ''}`);
  }
  await browser.close(); close();
  console.log(failures ? `${failures} FAILED` : 'All passed');
  process.exit(failures ? 1 : 0);
})();
