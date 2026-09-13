# Datenbefund der Ausgangskarte

Untersucht am 13.09.2026 durch Lesen von HTML, CSS und JavaScript. Dies ist eine Quellcode- und Datenanalyse; ein visueller Test auf einem Smartphone wurde noch nicht durchgeführt.

## Vorhandene Umsetzung

Die [Karte](https://kunstpunkte.de/karte.html) bindet Leaflet und die [Kartenlogik](https://kunstpunkte.de/osm/osm_leaflet.js) ein. Bereits vorhanden sind Viewport-Metadaten, nummerierte Marker, Farbdifferenzierung und responsive CSS-Regeln. Ein rein starres Desktoplayout wäre als Beschreibung zu pauschal.

- Karte laut CSS allgemein `height:100vh`, `max-width:1200px`; bei maximal 480 Pixeln Breite `height:88vh`.
- Marker laut JavaScript 32×32 Pixel; jeder Standort wird einzeln hinzugefügt, ohne Clustering.
- Details sind HTML-Popups, die sowohl per Mouseover als auch per Klick geöffnet werden.
- Website-Suche geht an `suche.php`; sie ist keine lokale Kartenfilterung.
- Im untersuchten Kartenskript kein Geolocation-Ablauf und kein mobiles Detailpanel.
- Bestehende Punktlinks verwenden eine nackte Nummer als Query, beispielsweise `karte.html?163`.
- Kartenhintergrund ist RVR „Stadtkarte 2.0“ über `geodaten.metropoleruhr.de`, nicht der öffentliche OSM-Standardkachelserver.
- Zusätzliche Bildoverlays korrigieren den Bereich Else-Gores-Straße auf Zoom 17–19. Bei Anbieterwechsel die reale Position/Adresszuordnung gesondert prüfen; diese historischen Overlays nicht blind übernehmen.

CSS-Quellen: [all.css](https://kunstpunkte.de/lib/css/all.css), [all-mq.css](https://kunstpunkte.de/lib/css/all-mq.css).

## Quelldaten und Bedeutung

[gm_daten.js](https://kunstpunkte.de/osm/gm_daten.js) enthält ein JavaScript-Objekt mit `jahr`, `we_eins`, `we_zwei` und `data`. Es ist kein JSON und kein GeoJSON.

`data` trennt Standorte mit `+++`; ein Standort besteht aus:

`Breite:Länge:Adresse:Kategorie:Kunstpunktnummer:Slug:Name[:Slug:Name ...]`

| Merkmal | Gemessener Befund |
| --- | --- |
| Jahr | 2026 |
| Dateigröße | 23.035 Byte als UTF-8, unkomprimiert |
| Standorte | 196 |
| Name/Slug-Paare | 416; umfasst Personen und Einrichtungen, daher nicht gleichbedeutend mit 416 Künstlern |
| `ks` | 85 Standorte, Wochenende 1 |
| `os` | 18 Standorte mit Offraum, Wochenende 1 |
| `kn` | 83 Standorte, Wochenende 2 |
| `on` | 10 Standorte mit Offraum, Wochenende 2 |
| Wochenende 1 | 12./13.09.2026, Norden, zusammen 103 Standorte |
| Wochenende 2 | 19./20.09.2026, Süden, zusammen 93 Standorte |

Die Zuordnung ergibt sich aus der ausgeführten Programmlogik (`zweites Zeichen == s` → `we_eins`) und den [offiziellen Veranstaltungsdaten](https://kunstpunkte.de/index.html). Alte CSS-Kommentare nennen `kn/on` „nord“ und `ks/os` „süd“; sie widersprechen der 2026-Zuordnung. Keine geografische Deutung der Buchstaben im neuen Import verwenden.

Die Website nennt 30 Offräume, die Datei enthält 28 mit Offraum gekennzeichnete Standorte. Das sind unterschiedliche Zählebenen; mehrere Einrichtungen können einen Kunstpunkt teilen. Ein vollständiger Abgleich aller 30 Einrichtungen wurde noch nicht durchgeführt.

## Besondere Fälle

- Mehrere Personen und Einrichtungen pro Kunstpunkt müssen erhalten bleiben.
- Nr. 194 enthält 22 Name/Slug-Paare und eine Adresse mit HTML-Zeilenumbruch.
- Namen enthalten HTML-Entities wie `&nbsp;` und `&#x2011;`; teilweise ist `<br>` enthalten. Suchindex und Anzeige brauchen normalisierten Klartext.
- Nr. 152: Stephen Reader mit „(abgesagt)“.
- Nr. 163: Gudrun Kemsa mit „(abgesagt)“ innerhalb eines weiter besetzten Atelierhauses. Kein Standortausfall allein aus einer Personenabsage ableiten.
- Personenlinks werden im Original als `https://kunstpunkte.de/{jahr}/{slug}.html` erzeugt.
- Ein Browserindex der Detailseite Gudrun Kemsa war beim Abruf zwei Wochen alt und zeigte noch keine Absage, während die live gelesene Kartendatei sie enthielt. Veröffentlichungs- und Abrufstände müssen deshalb nachvollziehbar bleiben; Suchmaschinenansichten sind kein Ersatz für den geprüften Import.

## Verfügbare und fehlende Inhalte

Direkt verfügbar: Jahr, Wochenenden, Koordinaten, Adresse, Standortnummer, Kategoriecode, Teilnehmernamen und Slugs.

Nicht als eigene Felder verfügbar: Sparten, Öffnungsintervalle, Zugang, Biografie, Bilder, expliziter Absagestatus, Zeitpunkt der letzten fachlichen Änderung und dokumentierte Nutzungslizenz.

Die exemplarische [Detailseite Gudrun Kemsa](https://kunstpunkte.de/2026/gudrun-kemsa.html) enthält Sparte und „barrierefrei erreichbar“. Das belegt eine mögliche Ergänzungsquelle, jedoch keine vollständige Datenabdeckung aller Teilnehmenden. Vor einem entsprechenden Import sind Format, Abdeckung, Aktualisierung und vorgesehene Weiterverwendung zu klären.

## Vorgeschlagenes normalisiertes Modell

- Veranstaltung: Jahr, Zeitzone, datierte Wochenenden und ggf. bestätigte allgemeine Zeiten.
- Kunstpunkt: jahresbezogene ID (z. B. `2026-163`), gedruckte Nummer, Adresse, GeoJSON-Punkt mit Reihenfolge `[Länge, Breite]`, Wochenende, `hasOffspace` und Teilnehmerliste.
- Teilnehmer: Slug, bereinigter Name, Originaldetail-URL, Absagehinweis mit Quelle; später optionale Sparten und Zugangshinweise auf der tatsächlich belegten Ebene.
- Provenienz: Quell-URL, Abrufzeit, Datenversion/Hash sowie manuelle Korrekturen mit Begründung.
- Unbekanntes ausdrücklich `null`/unbekannt lassen; keine erfundenen Öffnungszeiten oder Merkmale.

Der Import muss unbekannte Codes, ungültige Koordinaten, doppelte Nummern, unvollständige Name/Slug-Paare und Formatänderungen melden. Er darf Änderungen der Quelle nicht stillschweigend verschlucken. Es wird kein fremder JavaScript-Code ausgeführt.
