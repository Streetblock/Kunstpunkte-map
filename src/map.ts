import L from 'leaflet';
import 'leaflet.markercluster';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import type { Kunstpunkt } from './model.ts';
import { element } from './dom.ts';
import { isCancelled } from './search.ts';
import type { Position } from './location.ts';

export function createMap(container: HTMLElement, onSelect: (point: Kunstpunkt) => void, onTileError: (failed: boolean) => void) {
  const map = L.map(container, { zoomControl: false, attributionControl: false, maxZoom: 19, minZoom: 10 });
  const attribution = L.control.attribution({ prefix: false }).addTo(map);
  document.querySelector('#map-attribution')?.append(attribution.getContainer()!);
  map.setView([51.223, 6.783], 12);
  L.control.zoom({ position: 'topright', zoomInTitle: 'Vergrößern', zoomOutTitle: 'Verkleinern' }).addTo(map);
  // Only request visible tiles. No service worker, prefetch or offline tile download.
  const tiles = L.tileLayer(import.meta.env.VITE_TILE_URL || 'https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: import.meta.env.VITE_TILE_ATTRIBUTION || '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  }).addTo(map);
  const failedTiles = new Set<string>();
  tiles.on('tileerror', event => {
    const { x, y, z } = (event as L.TileErrorEvent).coords;
    failedTiles.add(`${z}/${x}/${y}`); onTileError(true);
  });
  tiles.on('tileload', event => {
    const { x, y, z } = (event as L.TileEvent).coords;
    failedTiles.delete(`${z}/${x}/${y}`); onTileError(failedTiles.size > 0);
  });
  const clusters = L.markerClusterGroup({
    showCoverageOnHover: false, maxClusterRadius: 48,
    spiderfyOnMaxZoom: true, zoomToBoundsOnClick: true,
    animate: !matchMedia('(prefers-reduced-motion: reduce)').matches,
    iconCreateFunction(cluster) {
      const badge = element('span', 'cluster-inner', String(cluster.getChildCount()));
      badge.setAttribute('aria-label', `${cluster.getChildCount()} Kunstpunkte, zum Vergrößern auswählen`);
      return L.divIcon({ html: badge, className: 'point-cluster', iconSize: [48, 48] });
    },
  }).addTo(map);
  const markers = new Map<string, L.Marker>();
  let visible: Kunstpunkt[] = [];
  let selected: string | null = null;
  const locationLayer = L.layerGroup().addTo(map);

  const highlight = () => {
    markers.forEach((marker, id) => {
      marker.getElement()?.classList.toggle('selected-marker', id === selected);
      marker.getElement()?.setAttribute('aria-pressed', String(id === selected));
    });
  };
  map.on('layeradd zoomend moveend', highlight);
  const resize = new ResizeObserver(() => map.invalidateSize({ pan: false }));
  resize.observe(container);

  return {
    setPoints(points: Kunstpunkt[], fit = false) {
      visible = points;
      clusters.clearLayers();
      for (const point of points) {
        if (!markers.has(point.id)) {
          const p = point.properties;
          const badge = element('span', 'pin-number', String(p.number));
          const [lng, lat] = point.geometry.coordinates;
          const marker = L.marker([lat, lng], {
            title: `Kunstpunkt ${p.number}: ${p.address}${p.hasOffspace ? ' · Offraum' : ''}`,
            alt: `Kunstpunkt ${p.number}: ${p.address}`,
            icon: L.divIcon({
              html: badge,
              className: `point-marker weekend-${p.weekend}${p.hasOffspace ? ' offspace-marker' : ''}${isCancelled(point) ? ' cancelled-marker' : ''}`,
              iconSize: [44, 44], iconAnchor: [22, 22],
            }),
          });
          marker.on('click', () => onSelect(point));
          markers.set(point.id, marker);
        }
      }
      clusters.addLayers(points.map(point => markers.get(point.id)!));
      if (fit) this.fit();
      highlight();
    },
    fit() {
      if (!visible.length) return;
      const bounds = L.latLngBounds(visible.map(point => {
        const [lng, lat] = point.geometry.coordinates;
        return [lat, lng] as [number, number];
      }));
      map.invalidateSize({ pan: false });
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 16, animate: false });
    },
    select(point: Kunstpunkt | null) {
      selected = point?.id ?? null;
      highlight();
      if (!point || !container.clientWidth) return;
      const marker = markers.get(point.id);
      if (marker) clusters.zoomToShowLayer(marker, () => {
        highlight();
        const [lng, lat] = point.geometry.coordinates;
        map.panInside([lat, lng], { paddingTopLeft: [40, 40], paddingBottomRight: [55, Math.min(300, container.clientHeight / 2)], animate: false });
      });
    },
    resize() { map.invalidateSize({ pan: false }); },
    showLocation(position: Position) {
      locationLayer.clearLayers();
      L.circle([position.lat, position.lng], { radius: position.accuracy, color: '#1758bb', weight: 1, fillOpacity: .08, interactive: false }).addTo(locationLayer);
      L.circleMarker([position.lat, position.lng], { radius: 8, color: '#fff', weight: 3, fillColor: '#1758bb', fillOpacity: 1, interactive: false }).addTo(locationLayer);
      map.setView([position.lat, position.lng], 15, { animate: false });
    },
  };
}
