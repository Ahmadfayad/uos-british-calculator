// Graphify does not index JavaScript inside HTML. Keep line numbers unchanged
// in a temporary JS input, then map the graph's locations back to index.html.
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const root = path.join(__dirname, '..');
const inputName = 'graphify-inline-input.js';
const input = path.join(root, inputName);
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
let source = html.replace(/[^\r\n]/g, ' ');
for (const match of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script\s*>/gi)) {
  const start = match.index + match[0].indexOf('>') + 1;
  source = source.slice(0, start) + match[1] + source.slice(start + match[1].length);
}
fs.writeFileSync(input, source, { flag: 'wx' });
try {
  const cli = process.platform === 'win32' ? 'graphify.exe' : 'graphify';
  execFileSync(cli, ['update', '.'], { cwd: root, stdio: 'inherit' });
  const output = path.join(root, 'graphify-out');
  const graphPath = path.join(output, 'graph.json');
  execFileSync(cli, ['cluster-only', '.', '--no-label'], { cwd: root, stdio: 'inherit' });
  for (const name of ['graph.json', 'GRAPH_REPORT.md', 'graph.html']) {
    const file = path.join(output, name);
    fs.writeFileSync(file, fs.readFileSync(file, 'utf8').replaceAll(inputName, 'index.html'));
  }
  const mapped = JSON.parse(fs.readFileSync(graphPath, 'utf8'));
  const upload = mapped.nodes.find(node => node.source_file === 'index.html' && node.label === 'handleCertificateFiles()');
  const line = Number(upload?.source_location?.match(/^L(\d+)/)?.[1]);
  if (!line || !html.split(/\r?\n/)[line - 1].includes('async function handleCertificateFiles(')) {
    throw new Error('Graph verification failed: certificate upload function is missing');
  }
  if (mapped.nodes.some(node => /^samples[\\/]/.test(node.source_file || ''))) throw new Error('Student samples must not be indexed');
  console.log('PASS Graphify includes the calculator and OCR functions at index.html source lines.');
} finally {
  fs.unlinkSync(input);
}
