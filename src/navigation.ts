import type { Kunstpunkt } from './model.ts';

export function routeUrls(point: Kunstpunkt): { google: string; apple: string } {
  const [lng, lat] = point.geometry.coordinates;
  const google = new URL('https://www.google.com/maps/dir/');
  google.searchParams.set('api', '1');
  google.searchParams.set('destination', `${lat},${lng}`);
  const apple = new URL('https://maps.apple.com/');
  apple.searchParams.set('daddr', `${lat},${lng}`);
  return { google: google.href, apple: apple.href };
}

export function pointNumberFromUrl(url: URL): number | null {
  const raw = url.searchParams.get('punkt');
  if (!raw || !/^[1-9]\d*$/.test(raw)) return null;
  const number = Number(raw);
  return Number.isSafeInteger(number) ? number : null;
}

export function pointUrl(url: URL, number: number | null): URL {
  const next = new URL(url);
  if (number === null) next.searchParams.delete('punkt');
  else next.searchParams.set('punkt', String(number));
  return next;
}
