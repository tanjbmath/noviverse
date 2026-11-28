// Keep a built entry at the repository root for GitHub Pages branch publishing.
// Editable HTML lives in src/index.html.
import { cp, rm, writeFile } from 'node:fs/promises';
const root = new URL('../', import.meta.url);
for (const path of ['index.html', 'assets', 'textures', 'wonders', 'favicon.svg', 'asset-manifest.json', 'THIRD_PARTY_LICENSES.txt']) {
  const dest = new URL(path, root);
  await rm(dest, { recursive: true, force: true });
  await cp(new URL(`dist/${path}`, root), dest, { recursive: true });
}
await writeFile(new URL('.nojekyll', root), '');
console.log('Published the built entry, bundles and textures at the repository root for GitHub Pages.');
