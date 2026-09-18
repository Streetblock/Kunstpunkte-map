import { createHash } from 'node:crypto';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { relative, resolve, sep } from 'node:path';

const root = fileURLToPath(new URL('../dist/', import.meta.url));
const hash = (content: Uint8Array | string) => createHash('sha256').update(content).digest('hex');
const files = (await readdir(root, { recursive: true, withFileTypes: true }))
  .filter((file) => file.isFile() && file.name !== 'sw.js')
  .map((file) => relative(root, resolve(file.parentPath, file.name)).split(sep).join('/'))
  .sort();
const entries = await Promise.all(
  files.map(async (path) => ({ path, sha256: hash(await readFile(resolve(root, path))) })),
);
const template = await readFile(new URL('../src/service-worker.js', import.meta.url), 'utf8');
const version = hash(JSON.stringify(entries) + template).slice(0, 20);
await writeFile(
  resolve(root, 'sw.js'),
  template.replace(/['"]__PRECACHE__['"]/, JSON.stringify(entries)).replace('__VERSION__', version),
);
console.log(`Offline version ${version}: ${entries.length} app files (no map tiles).`);
