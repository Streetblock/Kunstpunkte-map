export const FAVORITES_KEY = 'kunstpunkte-map:favorites:v1';
type FavoriteStorage = Pick<Storage, 'getItem' | 'setItem'>;

function readIds(raw: string | null): Set<string> {
  if (raw === null) return new Set();
  const value: unknown = JSON.parse(raw);
  if (
    !value ||
    typeof value !== 'object' ||
    !('version' in value) ||
    value.version !== 1 ||
    !('ids' in value) ||
    !Array.isArray(value.ids) ||
    !value.ids.every((id) => typeof id === 'string' && /^\d{4}-[1-9]\d*$/.test(id))
  ) {
    throw new Error('Unbekanntes Favoritenformat');
  }
  return new Set(value.ids);
}

/** Persist only year-scoped location IDs. A failed write never looks like a saved favorite. */
export function createFavorites(
  storage: () => FavoriteStorage,
  onError: (message: string) => void,
) {
  let ids = new Set<string>();
  function reload() {
    try {
      ids = readIds(storage().getItem(FAVORITES_KEY));
    } catch {
      onError(
        'Deine gespeicherten Favoriten konnten nicht geladen werden. Die Karte bleibt nutzbar.',
      );
    }
  }
  reload();
  return {
    get ids(): ReadonlySet<string> {
      return ids;
    },
    has(id: string) {
      return ids.has(id);
    },
    reload,
    toggle(id: string): boolean {
      if (!/^\d{4}-[1-9]\d*$/.test(id)) return false;
      try {
        const target = storage();
        // Read again before writing, preserving favorites saved by another open tab.
        let next: Set<string>;
        try {
          next = readIds(target.getItem(FAVORITES_KEY));
        } catch {
          next = new Set(ids);
        }
        if (next.has(id)) next.delete(id);
        else next.add(id);
        target.setItem(FAVORITES_KEY, JSON.stringify({ version: 1, ids: [...next].sort() }));
        ids = next;
        return true;
      } catch {
        onError(
          'Favorit nicht gespeichert: Dein Browser erlaubt gerade keine lokale Speicherung. Bitte prüfe die Browsereinstellungen.',
        );
        return false;
      }
    },
  };
}
