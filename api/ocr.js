// Same-origin gateway. The work-PC connection key never reaches the browser.
const MAX_BYTES = 4 * 1024 * 1024;
module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  const reply = (status, body) => res.status(status).json(body);
  let server;
  try {
    server = new URL(process.env.OCR_SERVER_URL);
    if(server.protocol !== 'https:' || server.username || server.password || server.search || server.hash) throw Error();
    if(!/^[a-f0-9]{64}$/.test(process.env.OCR_SERVER_TOKEN || '')) throw Error();
  } catch { return reply(503, { available: false }); }
  if(!['GET', 'POST'].includes(req.method)) return reply(405, { error: 'Method not allowed' });
  if(req.headers['sec-fetch-site'] === 'cross-site') return reply(403, { error: 'Use the calculator website.' });
  if(req.headers.origin && !['https://uos-british-calculator.vercel.app', `https://${req.headers.host}`].includes(req.headers.origin)) return reply(403, { error: 'Use the calculator website.' });
  const headers = { Authorization: `Bearer ${process.env.OCR_SERVER_TOKEN}` };
  try {
    if(req.method === 'GET') {
      const response = await fetch(new URL('/remote-health', server), { headers, signal: AbortSignal.timeout(1500), redirect: 'error' });
      return reply(200, { available: response.ok && (await response.json()).ready === true });
    }
    const level = new URL(req.url, 'https://calculator.invalid').searchParams.get('level');
    if(!['o-level', 'as-level', 'a-level', 'moe'].includes(level)) return reply(400, { error: 'Invalid certificate type' });
    const isPdf = req.headers['content-type'] === 'application/pdf';
    if(!isPdf && req.headers['content-type'] !== 'image/png') return reply(415, { error: 'Send a PDF or PNG.' });
    const chunks = [];
    let size = 0;
    for await (const chunk of req) {
      size += chunk.length;
      if(size > MAX_BYTES) return reply(413, { error: 'Page too large' });
      chunks.push(chunk);
    }
    const body = Buffer.concat(chunks);
    if(isPdf ? !body.subarray(0, 5).equals(Buffer.from('%PDF-')) : !body.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]))) return reply(400, { error: 'Invalid file' });
    headers['Content-Type'] = isPdf ? 'application/pdf' : 'image/png';
    const response = await fetch(new URL(`/remote-ocr?level=${level}`, server), { method: 'POST', headers, body, signal: AbortSignal.timeout(12000), redirect: 'error' });
    if(!response.ok) return reply(503, { error: 'Work OCR computer unavailable or busy' });
    const data = await response.json();
    if(!Array.isArray(data.pages) || !data.pages.length || data.pages.length > 60 || (!isPdf && data.pages.length !== 1)) throw Error();
    const pages = data.pages.map((page, index) => {
      if(page.page !== index + 1 || typeof page.text !== 'string' || page.text.length > 100000 || !Array.isArray(page.lineBoxes) || page.lineBoxes.length > 5000 || !Number.isFinite(page.confidence)) throw Error();
      if(page.arabicText !== undefined && (typeof page.arabicText !== 'string' || page.arabicText.length > 100000)) throw Error();
      if(!page.lineBoxes.every(box => ['x0','x1','y0','y1'].every(key => Number.isFinite(box[key]) && box[key] >= 0 && box[key] <= 1))) throw Error();
      return { page: index + 1, source: 'ocr', text: page.text, arabicText: page.arabicText || '', lineBoxes: page.lineBoxes, confidence: Math.max(0, Math.min(100, page.confidence)) };
    });
    return reply(200, { pages });
  } catch { return reply(503, { available: false, error: 'Work OCR computer unavailable' }); }
};
module.exports.config = { api: { bodyParser: false } };
