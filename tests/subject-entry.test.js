const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const { serve } = require('./server');
(async () => {
  const site = await serve();
  const browser = await chromium.launch({channel:'chrome'});
  try {
    const page = await browser.newPage();
    await page.goto(site.url);
    await page.evaluate(()=>localStorage.setItem('ocrEngine','tesseract'));
    await page.reload();
    assert.equal(await page.locator('#ocr-engine').inputValue(),'openvino','OpenVINO must start selected even after an older engine preference');
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
    await page.evaluate(async()=>{
      window._ocrBatch=[{name:'preview.png',file:new File(['test'],'preview.png',{type:'image/png'})}];
      renderPageForSnapshot=async()=>{const canvas=document.createElement('canvas');canvas.width=1200;canvas.height=1600;canvas.getContext('2d').fillRect(0,0,1200,1600);return canvas;};
      await openDocumentPreview({file:'preview.png',page:1,box:{x0:.2,y0:.2,x1:.8,y1:.25}});
    });
    assert(await page.locator('#document-dialog').isVisible());
    assert(await page.locator('#document-image').isVisible());
    await page.selectOption('#document-zoom','200');
    assert.equal(await page.locator('#document-image').evaluate(image=>image.style.width),'200%');
    await page.keyboard.press('Escape');
    assert(!(await page.locator('#document-dialog').isVisible()));
    await page.evaluate(()=>window.scrollTo(0,document.body.scrollHeight));
    const reset=page.locator('.reset-visible');
    assert(await reset.evaluate(button=>{const r=button.getBoundingClientRect();return r.y>=0&&r.bottom<=innerHeight;}));
    await reset.click();
    assert.equal(await page.locator('.subject-card').count(),0);
    console.log('PASS five upload options, mixed upload, desktop/mobile fields and no overlap');
  } finally {await browser.close();site.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
