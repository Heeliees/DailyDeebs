import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import { createHash } from 'node:crypto';

const assets = JSON.parse(await readFile(new URL('./assets.json', import.meta.url), 'utf8'));
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
let index = 0;
async function restore(asset) {
  try { if (hash(await readFile(asset.path)) === asset.sha256) return; } catch {}
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await fetch(asset.url, { signal: AbortSignal.timeout(30000) });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const bytes = Buffer.from(await response.arrayBuffer());
      if (hash(bytes) !== asset.sha256) throw new Error('Asset checksum mismatch');
      await mkdir(dirname(asset.path), { recursive: true });
      await writeFile(asset.path, bytes);
      return;
    } catch (error) {
      if (attempt === 2) throw new Error(`${asset.path}: ${error.message}`);
    }
  }
}
await Promise.all(Array.from({ length: 8 }, async () => {
  while (index < assets.length) await restore(assets[index++]);
}));
console.log(`Verified ${assets.length} assets.`);
