const http = require('http'), fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..');
const types = { '.html': 'text/html', '.js': 'text/javascript', '.onnx': 'application/octet-stream', '.txt': 'text/plain', '.json': 'application/json' };

// Serves the project folder (the PaddleOCR models cannot load from file://).
function serve() {
  return new Promise(resolve => {
    const server = http.createServer((req, res) => {
      const file = path.join(root, decodeURIComponent(req.url.split('?')[0]).replace(/^\/$/, '/index.html'));
      if (!file.startsWith(root) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); return res.end(); }
      res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream' });
      fs.createReadStream(file).pipe(res);
    }).listen(0, () => resolve({ url: `http://localhost:${server.address().port}/index.html`, close: () => server.close() }));
  });
}
module.exports = { serve };
