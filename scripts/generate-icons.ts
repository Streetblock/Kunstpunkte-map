// Dependency-free raster export of the app's geometric K mark; no external artwork/fonts.
import { mkdirSync, writeFileSync } from 'node:fs';
import { deflateSync } from 'node:zlib';

const root = new URL('../public/icons/', import.meta.url);
mkdirSync(root, { recursive: true });
function crc32(bytes: Buffer) {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
  }
  return (crc ^ 0xffffffff) >>> 0;
}
function chunk(type: string, bytes: Buffer) {
  const data = Buffer.concat([Buffer.from(type), bytes]);
  const length = Buffer.alloc(4),
    crc = Buffer.alloc(4);
  length.writeUInt32BE(bytes.length);
  crc.writeUInt32BE(crc32(data));
  return Buffer.concat([length, data, crc]);
}
function icon(size: number) {
  const raw = Buffer.alloc((size * 3 + 1) * size);
  const bg = [20, 43, 74],
    lime = [231, 255, 135];
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      const color = [0, 0, 0];
      for (let sy = 0; sy < 3; sy++)
        for (let sx = 0; sx < 3; sx++) {
          const u = (x + (sx + 0.5) / 3) / size,
            v = (y + (sy + 0.5) / 3) / size;
          const k =
            (u >= 0.29 && u <= 0.39 && v >= 0.28 && v <= 0.72) ||
            (u >= 0.37 &&
              u <= 0.68 &&
              v >= 0.28 &&
              v <= 0.72 &&
              Math.abs(Math.abs(v - 0.5) - (u - 0.39) * 0.82) < 0.06);
          const dot = (u - 0.73) ** 2 + (v - 0.25) ** 2 < 0.045 ** 2;
          const sample = dot ? lime : k ? [255, 255, 255] : bg;
          for (let c = 0; c < 3; c++) color[c]! += sample[c]! / 9;
        }
      const offset = y * (size * 3 + 1) + 1 + x * 3;
      for (let c = 0; c < 3; c++) raw[offset + c] = Math.round(color[c]!);
    }
  const header = Buffer.alloc(13);
  header.writeUInt32BE(size, 0);
  header.writeUInt32BE(size, 4);
  header[8] = 8;
  header[9] = 2;
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', header),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}
for (const [name, size] of [
  ['icon-192.png', 192],
  ['icon-512.png', 512],
  ['maskable-512.png', 512],
  ['apple-touch-icon.png', 180],
] as const)
  writeFileSync(new URL(name, root), icon(size));
