import { createHash } from 'node:crypto';
import JSON5 from 'json5';
import { decodeHTML } from 'entities';
import type { Dataset, Kunstpunkt, Participant, Weekend } from '../src/model.ts';

export const SOURCE_URL = 'https://kunstpunkte.de/osm/gm_daten.js';

function plainText(value: string): string {
  const text = decodeHTML(value.replace(/<br\s*\/?\s*>/gi, ', '))
    .replace(/\s+/g, ' ').trim();
  if (!text || /[<>]/.test(text)) throw new Error('Leerer Text oder unerwartetes HTML in der Quelle.');
  return text;
}

/** Parse the documented assignment as data. Never execute the source JavaScript. */
export function parseSource(source: string, retrievedAt: string): Dataset {
  const assignment = /^\s*var\s+gm_daten\s*=\s*(\{[\s\S]*\})\s*;?\s*$/.exec(source);
  if (!assignment?.[1]) throw new Error('Unbekanntes Quellformat: gm_daten-Zuweisung erwartet.');
  const raw: unknown = JSON5.parse(assignment[1]);
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new Error('Quellobjekt fehlt.');
  const input = raw as Record<string, unknown>;
  if (Object.keys(input).sort().join(',') !== 'data,jahr,we_eins,we_zwei'
      || input.jahr !== 2026 || input.we_eins !== '12./13. September'
      || input.we_zwei !== '19./20. September' || typeof input.data !== 'string') {
    throw new Error('Veranstaltung/Schema hat sich geändert. Jahreskonfiguration zuerst prüfen.');
  }
  if (!Number.isFinite(Date.parse(retrievedAt))) throw new Error('Ungültiger Abrufzeitpunkt.');
  const numbers = new Set<number>();
  const mapping: Record<string, { weekend: Weekend; hasOffspace: boolean }> = {
    ks: { weekend: 1, hasOffspace: false }, os: { weekend: 1, hasOffspace: true },
    kn: { weekend: 2, hasOffspace: false }, on: { weekend: 2, hasOffspace: true },
  };
  const features: Kunstpunkt[] = input.data.split('+++').map((row, index) => {
    const fields = row.split(':');
    if (fields.length < 7 || (fields.length - 5) % 2 !== 0) {
      throw new Error(`Unvollständiger Eintrag ${index + 1}.`);
    }
    const [latRaw, lngRaw, addressRaw, code, numberRaw] = fields as [string, string, string, string, string];
    const lat = Number(latRaw), lng = Number(lngRaw), number = Number(numberRaw);
    if (!/^\d+\.\d+$/.test(latRaw) || !/^\d+\.\d+$/.test(lngRaw)
        || lat < 51 || lat > 51.5 || lng < 6.5 || lng > 7.1) {
      throw new Error(`Ungültige Koordinaten in Eintrag ${index + 1}.`);
    }
    const category = mapping[code];
    if (!category) throw new Error(`Unbekannter Kategoriecode: ${code}`);
    if (!/^\d+$/.test(numberRaw) || number < 1 || numbers.has(number)) {
      throw new Error(`Ungültige oder doppelte Kunstpunktnummer: ${numberRaw}`);
    }
    numbers.add(number);
    const participants: Participant[] = [];
    const slugs = new Set<string>();
    for (let i = 5; i < fields.length; i += 2) {
      const slug = fields[i]!;
      if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || slugs.has(slug)) {
        throw new Error(`Ungültiger oder doppelter Slug in Kunstpunkt ${number}.`);
      }
      slugs.add(slug);
      const original = plainText(fields[i + 1]!);
      const cancelled = /\s*\((?:leider\s+)?abgesagt\)\s*$/i.test(original);
      const name = original.replace(/\s*\((?:leider\s+)?abgesagt\)\s*$/i, '').trim();
      if (!name) throw new Error(`Name fehlt in Kunstpunkt ${number}.`);
      participants.push({ slug, name, cancelled, url: `https://kunstpunkte.de/2026/${slug}.html` });
    }
    return {
      type: 'Feature', id: `2026-${number}`,
      geometry: { type: 'Point', coordinates: [lng, lat] },
      properties: { number, address: plainText(addressRaw), ...category, participants },
    };
  });
  return {
    type: 'FeatureCollection',
    event: { year: 2026, timezone: 'Europe/Berlin', weekends: [
      { id: 1, label: '12./13. September', area: 'Nord', dates: ['2026-09-12', '2026-09-13'] },
      { id: 2, label: '19./20. September', area: 'Süd', dates: ['2026-09-19', '2026-09-20'] },
    ] },
    source: { url: SOURCE_URL, retrievedAt, sha256: createHash('sha256').update(source).digest('hex') },
    features: features.sort((a, b) => a.properties.number - b.properties.number),
  };
}
