const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const html = fs.readFileSync(require('node:path').join(__dirname, '..', 'index.html'), 'utf8');
const functionSource = (name, next) => html.slice(html.indexOf('async function ' + name + '('), html.indexOf(next, html.indexOf('async function ' + name + '(')));
(async () => {
  for (const engine of ['paddle', 'tesseract']) {
    let arabicReads = 0;
    const context = vm.createContext({
      paddleDetect: async () => [],
      paddleReadWith: async (_, __, lang) => { if (lang === 'ar') arabicReads++; return { text: 'British certificate', confidence: 20, weakShare: 1 }; },
      tessRecognize: async (_, lang) => { if (lang !== 'eng') arabicReads++; return { text: 'British certificate', confidence: 20 }; },
      looksLikeMoeDocument: text => /Grade 12/.test(text)
    });
    const name = engine + 'ReadPage';
    vm.runInContext(functionSource(name, engine === 'paddle' ? '// ── Page extraction' : '// ── PaddleOCR engine'), context);
    await vm.runInContext(name + '({}, {british:true})', context);
    assert.equal(arabicReads, 0, engine + ': skip speculative Arabic on British uploads');
    await vm.runInContext(name + '({}, {})', context);
    assert.equal(arabicReads, 1, engine + ': preserve automatic Arabic for MOE/untyped');
    await vm.runInContext(name + '({}, {british:true,forceArabic:true})', context);
    assert.equal(arabicReads, 2, engine + ': preserve Arabic text-layer override');
    context.paddleReadWith = async () => ({ text: 'Grade 12', confidence: 20, weakShare: 1 });
    context.tessRecognize = async (_, lang) => { if(lang !== 'eng') arabicReads++; return {text:'Grade 12',confidence:20}; };
    context.paddleReadWith = async (_, __, lang) => { if(lang==='ar') arabicReads++;return {text:'Grade 12',weakShare:1}; };
    await vm.runInContext(name + '({}, {british:true})', context);
    assert.equal(arabicReads, 3, engine + ': MOE heading overrides chosen category');
  }
  const runContext = vm.createContext({ navigator: {gpu:{}}, _paddleCpuPaths:new Set(), _paddleSessions:{}, calls:0 });
  runContext.paddleSession = async () => ({inputNames:['x'],outputNames:['y'],release:async()=>{},run:async()=>{ runContext.calls++; if(runContext.calls===1)throw Error('GPU shape unsupported');return {y:'CPU result'}; }});
  vm.runInContext(functionSource('runPaddle', 'function paddleDict'), runContext);
  assert.equal(await vm.runInContext("runPaddle('model', {})", runContext), 'CPU result');
  assert.equal(runContext.calls,2);
  assert(runContext._paddleCpuPaths.has('model'));
  const visited = [], retries = [];
  const extraction = vm.createContext({
    pdfjsLib:{getDocument:()=>({promise:Promise.resolve({numPages:3,getPage:async p=>{visited.push(p);return {number:p,getTextContent:async()=>({items:[]}),getViewport:()=>({}),cleanup:()=>{}};},destroy:async()=>{}})})},
    textLayerToLines:()=>({text:'',boxes:[]}),hasResultLines:()=>false,
    renderPdfPage:async p=>({number:p.number,width:1,height:1}),
    PAGE_READERS:{paddle:async c=>{if(c.number===2)throw Error('bad page');return {text:'ok'};}},
    tesseractReadPage:async c=>{retries.push(c.number);return {text:'retry'};}
  });
  extraction.file={name:'sample.pdf',arrayBuffer:async()=>new ArrayBuffer(0)};
  vm.runInContext(functionSource('extractPages','async function fileFingerprint'),extraction);
  const result = await vm.runInContext("extractPages(file, ['paddle'], ()=>{}, {fallback:true})",extraction);
  assert.deepEqual(visited,[1,2,3]);
  assert.deepEqual(retries,[2]);
  assert.equal(result.paddle[1].page,2);
  assert.equal(result.paddle[1].fallbackEngine,'tesseract');
  assert.equal(result.paddle[2].text,'ok');
  assert(!html.includes('ocr-pages'));
  assert.equal((html.match(/class="ocr-drop" data-level=/g) || []).length, 4);
  console.log('PASS four upload categories and Arabic pass safeguards');
})().catch(e => { console.error(e); process.exitCode = 1; });
