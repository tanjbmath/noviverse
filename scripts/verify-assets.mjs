import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
const root = new URL('../public/', import.meta.url);
const manifest = JSON.parse(await readFile(new URL('asset-manifest.json', root), 'utf8'));
for (const asset of manifest.assets) {
  const file = await readFile(new URL(asset.file, root));
  const hash = createHash('sha256').update(file).digest('hex');
  if (hash !== asset.sha256 || file.length !== asset.bytes) throw new Error(`Asset integrity mismatch: ${asset.file}`);
  if (file[0] !== 0xff || file[1] !== 0xd8) throw new Error(`Expected JPEG: ${asset.file}`);
  console.log(`Verified ${asset.file}: ${file.length.toLocaleString()} bytes; source and terms recorded.`);
}
