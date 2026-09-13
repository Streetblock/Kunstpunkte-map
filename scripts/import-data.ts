import { readFile, mkdir, writeFile, rename } from 'node:fs/promises';
import { parseSource, SOURCE_URL } from './parse-source.ts';

const snapshot = new URL('../data/source/gm_daten-2026.js.txt', import.meta.url);
const metadata = new URL('../data/source/retrieval.json', import.meta.url);
const output = new URL('../public/data/kunstpunkte-2026.json', import.meta.url);
const refresh = process.argv.includes('--refresh');

const response = refresh ? await fetch(SOURCE_URL, { signal: AbortSignal.timeout(20_000) }) : null;
if (response && !response.ok) throw new Error(`Quelldownload fehlgeschlagen: HTTP ${response.status}`);
const source = response ? await response.text() : await readFile(snapshot, 'utf8');
const retrievedAt: string = refresh ? new Date().toISOString()
  : JSON.parse(await readFile(metadata, 'utf8')).retrievedAt;
const dataset = parseSource(source, retrievedAt);
const json = JSON.stringify(dataset);
if (Buffer.byteLength(json) >= 200_000) throw new Error('Daten überschreiten das Budget von 200 KB.');
const report = {
  points: dataset.features.length,
  participants: dataset.features.reduce((sum, point) => sum + point.properties.participants.length, 0),
  north: dataset.features.filter(point => point.properties.weekend === 1).length,
  south: dataset.features.filter(point => point.properties.weekend === 2).length,
  offspaceLocations: dataset.features.filter(point => point.properties.hasOffspace).length,
  bytes: Buffer.byteLength(json), sha256: dataset.source.sha256,
};

// Validate completely before replacing any published data. Rename atomically on the same filesystem.
await mkdir(new URL('../public/data/', import.meta.url), { recursive: true });
if (refresh) {
  await mkdir(new URL('../data/source/', import.meta.url), { recursive: true });
  await writeFile(snapshot, source, 'utf8');
  await writeFile(metadata, JSON.stringify({ url: SOURCE_URL, retrievedAt }, null, 2) + '\n');
}
const temp = new URL(output.href + '.tmp');
await writeFile(temp, json + '\n', 'utf8');
await rename(temp, output);
console.log(JSON.stringify(report, null, 2));
