# Kunstpunkte mobil

Mobile Leaflet-Karte der Düsseldorfer Kunstpunkte. Unabhängiger Prototyp für 2026.

Besucher sollen auf dem Smartphone schnell einen passenden Kunstpunkt finden, die dort Teilnehmenden ansehen und eine externe Navigation starten können.

Stand: 18. September 2026. Der mobile Kern enthält eine kompakte Suchleiste, Karte mit zoomabhängigen Clustern und direkter Ortsauswahl, Wochenend-/Offraumfilter, Orts- und Künstler-/Raumlisten, Standort mit Luftlinie, vollständige Teilnehmerdetails, Routenlinks und teilbare Kunstpunkt-Links. Namen stehen in den Karten im Vordergrund, Adressen bleiben sichtbar.

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

`test:smoke` führt TypeScript-Prüfung und Produktionsbuild aus und testet die gebündelte App in jsdom mit simulierten Netzwerk- und Standortantworten. Das ersetzt keinen echten mobilen Browser- oder GPS-Test. Insgesamt werden derzeit 26 Tests ausgeführt. Für Änderungen am Erscheinungsbild: `npm run format`.

## Entdecken und Suchen

- Das Suchsymbol öffnet die Suche. Der Haken bzw. Enter klappt sie ein; ein aktiver Begriff bleibt sichtbar und gezielt löschbar.
- Suche erhält die gewählte Ansicht. Auf der Karte erscheinen die Treffer nach kurzer Tipppause im passenden Ausschnitt; in der Liste bleiben sie als Liste sichtbar. Wochenend-/Offraumfilter erhalten den gewählten Ausschnitt, „Übersicht“ zeigt alle gefilterten Orte.
- „Orte“ gruppiert die Namen nach Kunstpunkt. „Künstler & Räume“ zeigt jeden Eintrag der Quelle mit den zugehörigen Adressen und Terminen. „Ort/Alle Orte auf Karte“ setzt einen sichtbaren, löschbaren Namensfilter.
- Beim Öffnen sind alle Teilnehmenden mit ihren Originalseiten direkt erreichbar. Nur der mittlere Namensbereich scrollt; Kopf, Routenbuttons und Teilen bleiben sichtbar. Aus der Liste öffnen Details als Dialog, auf der Karte als Panel.
- Gleiche Quellkennungen können mehrere Auftritte in dieser Ausgabe bündeln. Gleiche Namen werden nicht automatisch gleichgesetzt. Dauerhafte Personenfavoriten über mehrere Jahre sind noch nicht implementiert.

## Favoriten

- Den Stern in einer Trefferkarte oder „Merken“ in den Standortdetails wählen, um den gesamten Kunstpunkt zu speichern oder wieder zu entfernen.
- Der Stern mit Anzahl im Kopfbereich öffnet die Favoritenansicht. Die vorhandenen Wochenendfilter trennen Nord und Süd; Suche und Offraumfilter funktionieren weiterhin zusammen mit den Favoriten.
- Ein Neuladen erhält die gemerkten Kunstpunkte. Die aktuelle Such-/Filteransicht wird beim Neuladen zurückgesetzt; „Filter zurücksetzen“ löscht keine Favoriten.
- Gespeichert werden nur jahresbezogene Standort-IDs unter `kunstpunkte-map:favorites:v1` in `localStorage`. Kein Konto, keine Übertragung der Merkliste und keine Synchronisierung zwischen Geräten.
- Favoriten gelten pro Browser und Website-Adresse. Lokale Vorschau und GitHub-Pages-Seite haben getrennte Merklisten. Das Löschen der Websitedaten entfernt die Favoriten; im Privatmodus kann die Speicherung beim Schließen enden.
- Änderungen werden zwischen geöffneten Tabs übernommen. Blockierter Speicher oder fehlgeschlagenes Schreiben führen zu einem Hinweis; die Oberfläche behauptet dann nicht, erfolgreich gespeichert zu haben.

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
