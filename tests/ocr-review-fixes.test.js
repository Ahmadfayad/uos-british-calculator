const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const { serve } = require('./server');
(async()=>{
  const site=await serve();
  const browser=await chromium.launch({channel:'chrome'});
  try {
    const page=await browser.newPage({colorScheme:'dark'});
    await page.addInitScript(()=>localStorage.setItem('theme','dark'));
    await page.goto(site.url);
    assert(await page.locator('body').evaluate(body=>body.classList.contains('light-theme')));
    assert.equal(await page.locator('.theme-toggle').count(),0);
    assert.equal(await page.locator('.action-bar .reset-visible').count(),0);
    assert.equal(await page.locator('.buttons-row .reset-visible').count(),1);
    const result=await page.evaluate(()=>{
      const english=parseGradeLine('ENGLISH LANGUAGE GRADE8 (eight)','o-level');
      const starLine='9706 ACCOUNTING A*(a*)';
      const template=deriveLayoutTemplate(starLine,'Accounting','A*');
      const match=buildLayoutRegex(template.pattern).exec(cleanOcrLine(starLine));
      return {english,template,match:match?.slice(1),wrongGrade:deriveLayoutTemplate(starLine,'Accounting','B')};
    });
    assert.equal(result.english.grade,'8');
    assert.equal(result.english.rawSubject,'ENGLISH LANGUAGE');
    assert(!result.template.error);
    assert(result.template.hasLiteral,'Syllabus number must constrain the taught layout');
    assert.deepEqual(result.match,['ACCOUNTING','A*']);
    assert(result.wrongGrade.error,'An absent grade must still be rejected');
    await page.evaluate(async()=>{
      renderPageForSnapshot=async()=>{const canvas=document.createElement('canvas');canvas.width=1200;canvas.height=1600;const ctx=canvas.getContext('2d');ctx.fillStyle='white';ctx.fillRect(0,0,1200,1600);ctx.fillStyle='black';ctx.font='32px Arial';ctx.fillText('ACCOUNTING A*',100,240);return canvas;};
      _teachLine={line:'9706 ACCOUNTING A*(a*)',file:'example.png',docFile:new File(['x'],'example.png',{type:'image/png'}),page:1,box:{x0:.1,y0:.1,x1:.9,y1:.2}};
      document.getElementById('ocr-review').innerHTML='<div id="teach-snap"></div>';
      document.getElementById('ocr-modal').classList.add('open');
      await showTeachSnapshot(_teachLine);
    });
    await page.getByRole('button',{name:'Enlarge document',exact:true}).click();
    assert(await page.locator('#document-dialog').isVisible());
    assert(await page.locator('#document-image').isVisible());
    for(const width of [1280,390]) {
      await page.setViewportSize({width,height:900});
      const toolbar=await page.locator('.document-toolbar').evaluate(el=>{
        const close=el.querySelector('button').getBoundingClientRect(),zoom=el.querySelector('select').getBoundingClientRect();
        return {closeVisible:close.top>=0&&close.bottom<=innerHeight,zoomVisible:zoom.top>=0&&zoom.bottom<=innerHeight,background:getComputedStyle(el).backgroundColor,color:getComputedStyle(el.querySelector('button')).color};
      });
      assert(toolbar.closeVisible&&toolbar.zoomVisible);
      assert.equal(toolbar.background,'rgb(255, 255, 255)');
      assert.equal(toolbar.color,'rgb(255, 255, 255)');
      await page.screenshot({path:require('node:path').join(__dirname,`../downloads/document-review-${width}.png`)});
    }
    await page.getByRole('button',{name:'Close',exact:true}).click();
    assert(!(await page.locator('#document-dialog').isVisible()));
    console.log('PASS light-only UI, reset placement, joined GCSE grade, A* teaching and teaching viewer controls');
  } finally {await browser.close();site.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
