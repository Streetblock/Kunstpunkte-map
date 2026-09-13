import type { Kunstpunkt } from './model.ts';

export interface Position { lat: number; lng: number; accuracy: number; timestamp: number }

export function distanceMeters(position: Pick<Position, 'lat' | 'lng'>, point: Kunstpunkt): number {
  const [lng, lat] = point.geometry.coordinates;
  const rad = Math.PI / 180;
  const dLat = (lat - position.lat) * rad, dLng = (lng - position.lng) * rad;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(position.lat * rad) * Math.cos(lat * rad) * Math.sin(dLng / 2) ** 2;
  return 6_371_000 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(Math.max(0, 1 - a)));
}

export function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters / 10) * 10} m Luftlinie`;
  return `${(meters / 1000).toLocaleString('de-DE', { maximumFractionDigits: 1 })} km Luftlinie`;
}

export function sortByDistance(points: Kunstpunkt[], position: Position): Kunstpunkt[] {
  return [...points].sort((a, b) => distanceMeters(position, a) - distanceMeters(position, b) || a.properties.number - b.properties.number);
}

export function locate(geolocation: Pick<Geolocation, 'getCurrentPosition'> | undefined): Promise<Position> {
  if (!geolocation) return Promise.reject(new Error('Dieser Browser kann deinen Standort nicht ermitteln. Suche stattdessen nach einer Straße oder einem Kunstpunkt.'));
  return new Promise((resolve, reject) => {
    geolocation.getCurrentPosition(result => {
      const { latitude: lat, longitude: lng, accuracy } = result.coords;
      if (![lat, lng, accuracy, result.timestamp].every(Number.isFinite) || Math.abs(lat) > 90 || Math.abs(lng) > 180 || accuracy < 0) {
        reject(new Error('Der Browser hat keine gültige Position geliefert. Bitte versuche es erneut.')); return;
      }
      resolve({ lat, lng, accuracy, timestamp: result.timestamp });
    }, error => {
      const messages: Record<number, string> = {
        1: 'Standortzugriff nicht erlaubt. Du kannst die Freigabe in den Browsereinstellungen ändern oder nach einer Straße suchen.',
        2: 'Dein Standort ist gerade nicht verfügbar. Bitte versuche es draußen erneut.',
        3: 'Die Standortsuche dauert zu lange. Bitte versuche es erneut.',
      };
      reject(new Error(messages[error.code] ?? 'Der Standort konnte nicht ermittelt werden.'));
    }, { enableHighAccuracy: true, timeout: 12_000, maximumAge: 30_000 });
  });
}
