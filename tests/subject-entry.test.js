const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const { serve } = require('./server');
(async () => {
  const site = await serve();
  const browser = await chromium.launch({channel:'chrome'});
  try {
    const page = await browser.newPage();
    await page.goto(site.url);
    assert.equal(await page.locator('.ocr-drop').count(),5);
    await page.evaluate(() => {
      window.uploadCalls=[];
      handleCertificateFiles=(files,level)=>window.uploadCalls.push({count:files.length,level});
      addFilledSubjectCard({subject:'Mathematics',level:'o-level',grade:'A',category:'science',status:'final'});
      addFilledSubjectCard({subject:'Arabic',level:'moe',mark:85,category:'other',status:'final'});
    });
    await page.setInputFiles('#ocr-file-all',[
      {name:'o-level.pdf',mimeType:'application/pdf',buffer:Buffer.from('%PDF-test')},
      {name:'a-level.pdf',mimeType:'application/pdf',buffer:Buffer.from('%PDF-test')}
    ]);
    assert.deepEqual(await page.evaluate(()=>window.uploadCalls),[{count:2,level:''}]);
    for(const width of [1280,390]) {
      await page.setViewportSize({width,height:950});
      assert(await page.locator('.grade').first().isVisible());
      assert(await page.locator('.percentile').last().isVisible());
      assert.equal(await page.locator('.grade-status').first().inputValue(),'final');
      assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
      const fields=await page.locator('.subject-card').first().evaluate(card=>[...card.querySelectorAll('.subject-search,.grade,.grade-status,.delete-btn')].map(el=>{const r=el.getBoundingClientRect();return {x:r.x,y:r.y,right:r.right,bottom:r.bottom};}));
      for(let i=0;i<fields.length;i++) for(let j=i+1;j<fields.length;j++) {
        const a=fields[i],b=fields[j];
        assert(a.right<=b.x||b.right<=a.x||a.bottom<=b.y||b.bottom<=a.y,'Entry controls must not overlap');
      }
      await page.locator('.manual-entry-heading').scrollIntoViewIfNeeded();
      await page.screenshot({path:require('node:path').join(__dirname,`../downloads/subject-entry-${width}.png`)});
    }
    console.log('PASS five upload options, mixed upload, desktop/mobile fields and no overlap');
  } finally {await browser.close();site.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
