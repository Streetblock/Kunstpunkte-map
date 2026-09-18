# Roadmap

Stand: 13.09.2026 · Entwurf; keine Phase ist bereits abgenommen.

## Umsetzungsstand

Ergänzung 18.09.2026: Kompakter Header und zoomabhängige Cluster mit direkter Ortsauswahl umgesetzt und veröffentlicht. Künstler-/Raumansicht ergänzt, Namen auf Ortskarten hervorgehoben. Suche behält die gewählte Karte-/Listenansicht und zentriert die Kartentreffer. Details zeigen alle Teilnehmenden ohne weiteres Aufklappen, mit eigener Scrollfläche zwischen festem Kopf und Routen-/Teilenleiste. 26 automatisierte Tests bestanden; Browserprüfungen und Grenzen im Abnahmeprotokoll dokumentiert.

Nächster eigenständiger Ausbau: dauerhafte Personen-/Raumidentitäten mit nachvollziehbaren Quellenzuordnungen, getrennte Personenfavoriten, Jahreswechsel und Export/Import. Vorhandene Ortsfavoriten bleiben dabei erhalten; keine automatische Gleichsetzung anhand gleicher Namen.

- M0: Umfang, unabhängiger Projektkontext und öffentliches GitHub-Repository entschieden.
- M1: Repository, Import, Datenmodell und mobile Ansichten umgesetzt. Bilder sind optional vorbereitet; Quelle/Nutzungsumfang bleiben offen.
- M2: Mobiler Kern implementiert und mit 14 fachlichen/Anwendungstests geprüft. Reale Geräteabnahmen bleiben offen.
- M3: GitHub-Pages-Workflow vorbereitet; Deployments werden erst nach erfolgreichen Prüfungen freigegeben. Geräte- und Besuchertests folgen.
- M4: Installierbare PWA mit Icons, Offline-App und Datensatz sowie geprüften vollständigen Updates umgesetzt. Lokaler Browser- und automatisierter Fehlertest dokumentiert; Installation und Flugmodus auf echten Mobilgeräten bleiben offen.
- M5: Lokale Favoriten vorgezogen und umgesetzt: Speicherung über Neuladen hinweg, eigene Ansicht mit Wochenendfiltern. Weitere Erweiterungen offen.

Details und Grenzen der Prüfungen: [Abnahmeprotokoll](ABNAHME.md).

## M0 – Plan abstimmen

Ergebnis: bestätigter Projektplan mit erstem Lieferumfang, Projektkontext, GitHub-Account/Name/Sichtbarkeit und Vorgehen für die verwendeten Daten.

Vorbereitet: Quellanalyse, Ziel, Architekturvorschlag und Kriterien. Bestätigt: mobiler Kern zuerst, unabhängiger Prototyp, öffentliches Repository `streetblock/Kunstpunkte-map`; Daten und Bilder einplanen. Das bereits vorhandene leere lokale Repository wird weiterverwendet. Detailkriterien bleiben ein reviewbarer Planungsentwurf; es wurde noch keine Software abgenommen.

Abnahme: Kern/PWA-Reihenfolge und die noch offenen Entscheidungen im Projektplan sind ausdrücklich als entschieden dokumentiert.

## M1 – Repository, Datenbasis und Bedienkonzept

- GitHub-Repository im vereinbarten Account anlegen und diese Dokumentation übernehmen.
- Projektstruktur, lokale Startanleitung und einfache Build-/Prüfautomation einrichten.
- Import für den 2026-Snapshot, Datenmodell und Validierungsbericht erstellen.
- Kartenanbieter für den Test festlegen; Quellen, Datenstand und vorgesehene öffentliche Datennutzung dokumentieren. Code-Lizenz und Rechte an Veranstaltungsinhalten getrennt behandeln.
- Drei mobile Zustände konkret darstellen: Karte, Trefferliste, Standortdetails mit optionalem Vorschaubild und Urheberangabe. Laden, keine Treffer, Standortfehler, fehlendes Bild und fehlendes Netz ebenfalls vorsehen.

Abnahme: Importkriterien A03/A04/A11 sind überprüft, Datenkorrekturen nachvollziehbar, Bedienkonzept für kleine Displays abgestimmt. Der Entwurf erklärt insbesondere Gruppenateliers und lange Teilnehmerlisten.

## M2 – Nutzbarer mobiler Kern

- Vollbild-Leaflet-Karte, nummerierte Marker und Clustering.
- Suche, Wochenend-/Offraumfilter und synchronisierte Trefferliste.
- Standortabfrage, Genauigkeitsanzeige und Sortierung nach Luftlinie.
- Detailpanel, Originalseitenlinks, Absagen und externe Routenaktion.
- Teilbare Standortlinks sowie Fehler-/Leerzustände und zugängliche Bedienung.

Abnahme: A01–A15 mit passendem Prüfbericht; reale Gerätetests, die noch nicht durchgeführt werden konnten, bleiben offen markiert. Keine vorgezogene Behauptung, bereits alle Endgeräte geprüft zu haben.

## M3 – GitHub-Pages-Test und Besuchertest

- Teststand unter HTTPS veröffentlichen; Projektpfade und direkte Standortaufrufe prüfen.
- iPhone Safari und Android Chrome im Stehen/Gehen testen; Bildschirmtastatur, Einhandbedienung, GPS-Ablehnung und schlechte Verbindung einbeziehen.
- Fünf kurze Nutzertests ausführen und die wichtigsten Hindernisse korrigieren.
- Zuständigkeit für Datenaktualisierungen festhalten; Aktualisierung vor einem Einsatz am Veranstaltungswochenende durchführen und Datenstand sichtbar machen.

Abnahme: A01–A15 auf dem veröffentlichten Stand und A19. Offene Einschränkungen sind konkret dokumentiert. Das ist der erste abgeschlossene Funktionsumfang, wenn PWA als spätere Stufe gewählt wird.

## M4 – PWA und Offline-Liste

- Manifest, passende Icons und Installation ergänzen.
- App und Metadaten offline vorhalten, Cache-Versionierung und zuverlässigen Updatewechsel implementieren.
- Offlinehinweis und Datum des gespeicherten Datensatzes sichtbar machen; Kartenausfall und Cacheverlust behandeln.

Abnahme: A16/A17 plus gezielte Regression der Kernabläufe. Kein zugesagter Offline-Kartenhintergrund. Falls PWA für den ersten Test gewünscht wird, gehört M4 vor die abschließende Freigabe von M3; zusätzliches Update-/Installationstesting bleibt notwendig.

## M5 – Inhaltlicher Ausbau nach Datenlage

Priorität gemeinsam festlegen:

1. Verlässliche Sparten- und Zugangsangaben mit Quellen; entsprechende Filter.
2. Geprüfte Öffnungszeiten und Ausnahmen; „Jetzt geöffnet“ mit A18.
3. Lokale Merkliste umgesetzt; Besuchsstatus weiterhin optional/offen.
4. Bilder und vertiefende Texte bei geklärter Nutzung.
5. Echte Geh-/Radstrecken bzw. Tourenplanung mit geeignetem Routingdienst.
6. Offline-Hintergrundkarte mit ausdrücklich geeignetem Anbieter oder eigenen Kacheln.

Jede Erweiterung erhält vor Umsetzung eigene Abnahmekriterien. Keine Zeit- oder Kostenprognose für die Datenanreicherung, solange Quelle, Umfang und Pflege nicht geklärt sind.

## Vorlage für eine Abnahme

| Feld | Eintrag |
| --- | --- |
| Meilenstein / Version / Commit | |
| Datenstand und Quelle | |
| Test-URL | |
| Geräte, Betriebssysteme, Browser | |
| Geprüfte Kriterien mit Ergebnis | |
| Noch offene Prüfungen und Mängel | |
| Entscheidung und Datum | |
