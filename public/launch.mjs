// Dependency-free local preview for the packaged static build. No network services or accounts.
import { createServer } from 'node:http';
import { createReadStream } from 'node:fs';
import { stat, realpath } from 'node:fs/promises';
import { dirname, resolve, relative, isAbsolute, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';

const args = process.argv.slice(2);
const option = name => args.includes(name) ? args[args.indexOf(name) + 1] : undefined;
const root = await realpath(resolve(option('--root') || dirname(fileURLToPath(import.meta.url))));
try { await stat(resolve(root, 'index.html')); }
catch { console.error('The built game is missing. Please run Start-NoviVerse.cmd from the project folder.'); process.exit(1); }

const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.jpg': 'image/jpeg', '.png': 'image/png', '.svg': 'image/svg+xml', '.wasm': 'application/wasm' };
const contained = path => { const rel = relative(root, path); return !isAbsolute(rel) && rel !== '..' && !rel.startsWith(`..${sep}`); };
const server = createServer(async (request, response) => {
  response.setHeader('X-Content-Type-Options', 'nosniff');
  response.setHeader('Cache-Control', 'no-store');
  if (!['GET', 'HEAD'].includes(request.method)) { response.writeHead(405, { Allow: 'GET, HEAD' }); response.end(); return; }
  let requested;
  try { requested = decodeURIComponent(new URL(request.url, 'http://localhost').pathname); }
  catch { response.writeHead(400); response.end('Invalid address'); return; }
  const candidate = resolve(root, `.${requested.endsWith('/') ? `${requested}index.html` : requested}`);
  if (!contained(candidate)) { response.writeHead(403); response.end('Not available'); return; }
  try {
    const file = await realpath(candidate);
    if (!contained(file)) { response.writeHead(403); response.end('Not available'); return; }
    const info = await stat(file);
    if (!info.isFile()) { response.writeHead(404); response.end('File not found'); return; }
    response.writeHead(200, { 'Content-Type': mime[extname(file)] || 'application/octet-stream', 'Content-Length': info.size });
    if (request.method === 'HEAD') response.end();
    else { const stream = createReadStream(file); stream.on('error', () => response.destroy()); stream.pipe(response); }
  } catch { response.writeHead(404); response.end('File not found'); }
});
server.on('error', error => { console.error(`Could not start NoviVerse: ${error.message}`); process.exitCode = 1; });
server.listen(Number(option('--port') || 0), '127.0.0.1', () => {
  const url = `http://127.0.0.1:${server.address().port}/`;
  console.log(`\nNoviVerse is ready: ${url}\n\nKeep this window open while playing. Close it, or press Ctrl+C, to stop.\n`);
  if (!args.includes('--no-open')) {
    const command = process.platform === 'win32' ? ['rundll32.exe', ['url.dll,FileProtocolHandler', url]] : process.platform === 'darwin' ? ['open', [url]] : ['xdg-open', [url]];
    const browser = spawn(command[0], command[1], { detached: true, stdio: 'ignore', windowsHide: true });
    browser.on('error', () => console.log(`Open this address in your browser: ${url}`)); browser.unref();
  }
});
process.on('SIGINT', () => { server.close(); server.closeAllConnections(); });
