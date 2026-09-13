# Kunstpunkte mobil

Mobile Leaflet-Karte der Düsseldorfer Kunstpunkte. Unabhängiger Prototyp für 2026.

Besucher sollen auf dem Smartphone schnell einen passenden Kunstpunkt finden, die dort Teilnehmenden ansehen und eine externe Navigation starten können.

Stand: 13. September 2026. Der mobile Kern ist implementiert: Karte mit Clustern, Suche, Wochenend-/Offraumfilter, Liste, Standort mit Luftlinie, Details, Routenlinks und teilbare Kunstpunkt-Links. Bei Namenssuche werden passende Personen in Gruppenateliers zuerst angezeigt und hervorgehoben.

Repository: [Streetblock/Kunstpunkte-map](https://github.com/Streetblock/Kunstpunkte-map).

Testadresse nach erfolgreichem Pages-Deployment: [Kunstpunkte unterwegs](https://streetblock.github.io/Kunstpunkte-map/).

- [Ziel, Umfang, Entscheidungen und Abnahmekriterien](docs/PROJEKTPLAN.md)
- [Datenbefund und Quellen](docs/DATENBEFUND.md)
- [Roadmap mit Abnahmen](docs/ROADMAP.md)
- [Prüfstand und noch offene Abnahmen](docs/ABNAHME.md)

Vereinbart: zuerst mobiler Kern als unabhängiger Prototyp; Zielrepository `streetblock/Kunstpunkte-map`, öffentlich. PWA mit offline verfügbarer Atelierliste als anschließende Ausbaustufe. Daten und Bilder werden eingeplant; Bildfelder sind optional und benötigen Quellen-/Urheberangaben. Technischer Vorschlag: statische Web-App auf GitHub Pages mit Leaflet, TypeScript und Vite.

## Lokal starten

Node.js 24 oder neuer erforderlich.

```sh
npm ci
npm run dev
```

Die lokale Adresse ist `http://127.0.0.1:5173/`. `npm run preview` zeigt nach einem Build die Produktionsdateien unter Port 4173.

## Prüfungen

```sh
npm run format:check
npm test
npm run test:smoke
```

`test:smoke` führt TypeScript-Prüfung und Produktionsbuild aus und testet die gebündelte App in jsdom mit simulierten Netzwerk- und Standortantworten. Das ersetzt keinen echten mobilen Browser- oder GPS-Test. Insgesamt werden derzeit 14 Tests ausgeführt. Für Änderungen am Erscheinungsbild: `npm run format`.

## Daten und Aktualisierung

Alle Besucher laden einen geprüften lokalen Datensatz. Kein Browser führt das fremde `gm_daten.js` aus. [Import und Datenpflege](data/README.md) beschreiben Snapshot, Quelle, Zeitstempel und Validierung. Änderungen werden bewusst importiert und committed; es gibt derzeit keine automatische Aktualisierung vom Veranstalter.

Kartenkacheln kommen standardmäßig von OpenStreetMap. `VITE_TILE_URL` und `VITE_TILE_ATTRIBUTION` können beim Build einen anderen Anbieter konfigurieren; dessen Bedingungen sowie der Text im Informationsdialog sind dabei anzupassen. Keine Offline-Vorladung von Standardkacheln.

## GitHub Pages

Der Workflow in `.github/workflows/pages.yml` prüft Formatierung, reproduzierbaren Datenimport, fachliche Tests und die Produktions-App. Nur erfolgreiche Builds von `main` werden veröffentlicht; Pull Requests werden ausschließlich geprüft. Pages verwendet den Build-Typ „GitHub Actions“. Relative Assetpfade unterstützen `/Kunstpunkte-map/` und direkte Links wie `?punkt=163`.

## Grenzen des ersten Tests

- Keine PWA/Offlinezusage, keine eigenen Geh- oder Fahrradrouten.
- Öffnungszeiten, Sparten, Zugang und Bilder werden derzeit auf den Originalseiten verlinkt. Optionale Bildanzeige mit Quellen-/Urheberangaben ist vorbereitet; der Snapshot enthält keine Bildkopien.
- Abgesagte Teilnehmende werden gekennzeichnet; eine Teilabsage schließt kein ganzes Atelierhaus.
- Standort ausschließlich auf Knopfdruck, ohne gespeicherten Verlauf. Kartenanbieter und Navigationsdienste benötigen ihre jeweiligen Onlineverbindungen.
