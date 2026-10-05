// Averages below 70% mean "not eligible for any program": popup, scenario flags and majors.
const { chromium } = require('playwright');
const { serve } = require('./server');

const oLevels = g => ['Biology', 'Chemistry', 'Mathematics', 'Physics', 'English Language'].map(subject => ({ level: 'o-level', subject, grade: g, status: 'final' }));
const asLevels = (a, b) => [{ level: 'as-level', subject: 'Biology', grade: a, status: 'final' }, { level: 'as-level', subject: 'Chemistry', grade: b, status: 'final' }];

(async () => {
  const { url, close } = await serve();
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto(url);
  let failures = 0;
  const check = (name, ok) => { if (!ok) failures++; console.log(`${ok ? 'PASS' : 'FAIL'} ${name}`); };

  const run = async subjects => {
    await page.evaluate(() => document.querySelectorAll('.subject-card').forEach(c => c.remove()));
    await page.evaluate(s => s.forEach(x => addFilledSubjectCard(x)), subjects);
    await page.evaluate(() => calculateOverallPercentage());
    await page.waitForTimeout(800);
    return page.evaluate(() => ({
      notEligible: document.getElementById('success-modal-box').classList.contains('not-eligible'),
      title: document.getElementById('success-title').textContent,
      majors: window._lastScenarios[0].majorTypes.length,
      below: window._lastScenarios[0].belowMinimum
    }));
  };

  const low = await run([...oLevels('D'), ...asLevels('D', 'E')]);
  check('below 70%: popup says Not Eligible', low.notEligible && low.title === 'Not Eligible');
  check('below 70%: scenario flagged and no majors', low.below && low.majors === 0);
  await page.waitForTimeout(4000);
  check('below 70%: popup does not auto-close', await page.evaluate(() => document.getElementById('success-modal').classList.contains('open')));

  const high = await run([...oLevels('A'), ...asLevels('A', 'A')]);
  check('above 70%: normal result popup', !high.notEligible && high.title === 'Result' && high.majors > 0 && !high.below);

  const edge = await page.evaluate(() => [69.99996, 70, 69.9999].map(isBelowMinimum));
  check('70.0000% (shown) is not below the minimum, 69.9999% is', edge[0] === false && edge[1] === false && edge[2] === true);

  await browser.close(); close();
  console.log(failures ? `${failures} FAILED` : 'All passed');
  process.exit(failures ? 1 : 0);
})();
