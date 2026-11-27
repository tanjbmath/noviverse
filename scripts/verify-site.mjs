import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
const root = new URL('../', import.meta.url);
for (const prefix of ['', 'dist/']) {
  const folder = new URL(prefix, root);
  const html = await readFile(new URL('index.html', folder), 'utf8');
  const entry = html.match(/<script[^>]*type="module"[^>]*src="([^"]+)"/);
  assert.ok(entry && entry[1].startsWith('./assets/'), `${prefix}index.html must load a built relative entry`);
  assert.ok(!html.includes('src="/src/main.js"') && !html.includes('src="/main.js"'), 'Raw Vite entry must never be published');
  for (const match of html.matchAll(/(?:src|href)="(\.\/[^"?#]+)"/g)) {
    assert.ok((await stat(new URL(match[1], folder))).isFile(), `Missing published asset ${match[1]}`);
  }
  for (const file of ['textures/earth.jpg', 'textures/moon.jpg']) assert.ok((await stat(new URL(file, folder))).size > 100000);
  // Resolving under a repository subpath must stay under that subpath.
  assert.ok(new URL(entry[1], 'https://example.invalid/noviverse/').pathname.startsWith('/noviverse/assets/'));
  console.log(`Verified ${prefix || 'repository root/'}: built entry, linked files, textures and repository subpath.`);
}
