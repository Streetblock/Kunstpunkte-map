export type Weekend = 1 | 2;

export interface Artwork {
  url: string;
  alt: string;
  credit: string;
  sourceUrl: string;
  permission: string;
}

export interface Participant {
  slug: string;
  name: string;
  cancelled: boolean;
  url: string;
  artwork?: Artwork;
}

export interface Kunstpunkt {
  type: 'Feature';
  id: string;
  geometry: { type: 'Point'; coordinates: [number, number] };
  properties: {
    number: number;
    address: string;
    weekend: Weekend;
    hasOffspace: boolean;
    participants: Participant[];
  };
}

export interface Dataset {
  type: 'FeatureCollection';
  event: {
    year: number;
    timezone: 'Europe/Berlin';
    weekends: { id: Weekend; label: string; area: string; dates: [string, string] }[];
  };
  source: { url: string; retrievedAt: string; sha256: string };
  features: Kunstpunkt[];
}
