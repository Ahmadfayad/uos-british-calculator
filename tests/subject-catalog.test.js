const assert=require('node:assert/strict');
const fs=require('node:fs');
const {chromium}=require('playwright');
const {serve}=require('./server');
(async()=>{
 const site=await serve(),browser=await chromium.launch({channel:'chrome'});
 try{
  const page=await browser.newPage();
  let rows=JSON.parse(fs.readFileSync('supabase/subject-catalog-seed.json','utf8')).map((r,i)=>({...r,id:i+1,updated_at:'2026-10-07T00:00:00Z'}));
  await page.route('**/rest/v1/subject_catalog**',async route=>{
   const req=route.request(),url=new URL(req.url()),method=req.method();let result=rows;
   if(method!=='GET'){
    assert.equal(req.headers().authorization,'Bearer test-admin');
    const id=Number((url.searchParams.get('id')||'').replace('eq.',''));
    if(method==='POST'){const row={...req.postDataJSON(),id:200,updated_at:new Date().toISOString()};rows.push(row);result=[row];}
    if(method==='PATCH'){const row=rows.find(r=>r.id===id);Object.assign(row,req.postDataJSON(),{updated_at:new Date().toISOString()});result=[row];}
    if(method==='DELETE'){result=rows.filter(r=>r.id===id);rows=rows.filter(r=>r.id!==id);}
   }
   await route.fulfill({json:result});
  });
  await page.goto(site.url);
  await page.evaluate(async()=>{await loadSubjectCatalog();_adminToken='test-admin';document.body.insertAdjacentHTML('beforeend','<div id="admin-subject-catalog"></div>');await renderSubjectCatalog();});
  assert.equal(await page.locator('#catalog-table tr').count(),154);
  await page.selectOption('#catalog-filter','as-level');assert.equal(await page.locator('#catalog-table tr').count(),40);
  await page.selectOption('#catalog-filter','');
  await page.evaluate(()=>editCatalogSubject());
  await page.fill('#catalog-name','MOE Biology');await page.selectOption('#catalog-level','moe');await page.selectOption('#catalog-category','Sciences');await page.fill('#catalog-aliases','علم الأحياء');await page.click('#catalog-save');
  await page.waitForFunction(()=>catalog.rows.length===155);
  const parsed=await page.evaluate(()=>parseMoeRows('علم الأحياء 100 50 88','',''));
  assert.equal(parsed[0].subject,'MOE Biology');assert.equal(parsed[0].moeMark.value,88);
  await page.evaluate(()=>editCatalogSubject(200));await page.fill('#catalog-name','MOE Life Science');await page.click('#catalog-save');
  await page.waitForFunction(()=>catalog.rows.some(r=>r.subject==='MOE Life Science'));
  assert(await page.evaluate(()=>catalog.rows.find(r=>r.id===200).aliases.includes('MOE Biology')));
  await page.evaluate(()=>editCatalogSubject(200));await page.uncheck('#catalog-active');await page.click('#catalog-save');
  await page.waitForFunction(()=>!catalog.rows.find(r=>r.id===200).active);
  assert.equal((await page.evaluate(()=>parseMoeRows('علم الأحياء 100 50 88','',''))).length,0);
  await page.evaluate(()=>{catalog.rows.push({id:201,level:'a-level',subject:'=HYPERLINK("evil")',category:'Languages',aliases:[],active:true,updated_at:''});});
  const csvPromise=page.waitForEvent('download');await page.evaluate(()=>exportSubjectCatalog('csv'));const csv=await csvPromise;
  const csvText=fs.readFileSync(await csv.path(),'utf8');assert(csvText.includes('MOE Life Science'));assert(csvText.includes("'="));
  const xlsxPromise=page.waitForEvent('download',{timeout:30000});await page.evaluate(()=>exportSubjectCatalog('xlsx'));const xlsx=await xlsxPromise;
  const bytes=[...fs.readFileSync(await xlsx.path())];
  const workbook=await page.evaluate(bytes=>{const book=XLSX.read(new Uint8Array(bytes),{type:'array'});return {rows:XLSX.utils.sheet_to_json(book.Sheets.Subjects,{header:1}),formulaCells:Object.values(book.Sheets.Subjects).filter(cell=>cell&&cell.f).length};},bytes);
  assert.equal(workbook.rows.length,157);assert.equal(workbook.formulaCells,0);
  await page.evaluate(()=>{catalog.rows.pop();deleteCatalogSubject(200);});await page.click('#cond-confirm-ok');await page.waitForFunction(()=>catalog.rows.length===154);
  await page.evaluate(()=>{const bio=catalog.rows.find(r=>r.level==='o-level'&&r.subject==='Biology');applySubjectCatalog(catalog.rows.map(r=>r===bio?{...r,subject:'Life Science',aliases:[...r.aliases,'Biology']}:r));});
  assert.equal(await page.evaluate(()=>matchOcrSubject('Biology','o-level').subject),'Life Science');
  assert.equal(await page.evaluate(()=>coreScienceType('Life Science')),'biology');
  await page.route('**/rest/v1/subject_catalog**',route=>route.abort());
  await page.evaluate(()=>loadSubjectCatalog(true));assert((await page.locator('#subject-catalog-status').textContent()).includes('Could not refresh'));
  console.log('PASS catalog counts, filters, admin CRUD, MOE aliases, inactive OCR, rename/science matching, CSV/XLSX and offline fallback');
 }finally{await browser.close();site.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
