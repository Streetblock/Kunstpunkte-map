# Projektplan: Kunstpunkte mobil

Stand: 13.09.2026 · Status: Entwurf zur Abstimmung

## 1. Konkretes Ziel

Eine deutschsprachige, auf Smartphones ausgerichtete Leaflet-Web-App unterstützt Besucher zu Fuß und mit dem Fahrrad dabei, Kunstpunkte in Düsseldorf zu finden und ihren nächsten Besuch auszuwählen. Der zentrale Ablauf lautet: Karte oder Liste öffnen → nach Nummer, Namen oder Adresse suchen bzw. filtern → Standortdetails lesen → externe Navigation starten.

Der erste Test soll als statische Website auf GitHub Pages erreichbar sein. Installation darf für die Nutzung nicht erforderlich sein. PWA-Funktionen sind eine mögliche Erweiterung. Eine spätere Übernahme unter eine andere Domain soll ohne Wechsel der Kartenbibliothek möglich bleiben.

Erfolg im kurzen Besuchertest: Mindestens 4 von 5 Testpersonen finden ohne Anleitung einen vorgegebenen Kunstpunkt und öffnen dessen Routenlink innerhalb von 60 Sekunden. Standortfreigabe ist keine Voraussetzung für den Suchablauf. Der Standortablauf wird gesondert geprüft.

## 2. Bestätigt und noch offen

Aus dem Auftrag bestätigt:

- Erst planen und offene Fragen klären, danach das GitHub-Repository anlegen.
- Leaflet im mobilen Browser ist die Zielplattform.
- Ziel, überprüfbare Abnahmekriterien und Roadmap dokumentieren.
- GitHub Pages ist als erster Test bzw. Hostingoption erwünscht; PWA ist optional.

Im Gespräch entschieden:

| Entscheidung | Empfehlung | Status |
| --- | --- | --- |
| Erster Lieferumfang | Funktionsfähiger mobiler Kern; PWA danach | Bestätigt |
| Projektkontext | Unabhängiger Prototyp; Kontakt zu Veranstaltern ist vorhanden | Bestätigt |
| GitHub-Ziel | `streetblock/Kunstpunkte-map`, öffentlich | Bestätigt |
| Daten und Bilder | Für einen vorzeigbaren Prototyp einplanen | Gewünscht; konkrete Bildquelle/Weiterverwendung noch zu klären |

Weitere Vorschläge, die mit dem Plan abgestimmt werden:

- Zunächst Ausgabe 2026; Jahreswechsel über Daten und Veranstaltungskonfiguration ermöglichen.
- Kostenarmer Test ohne eigenen Backend- oder Routingbetrieb.
- Eigenständige, gut lesbare Gestaltung mit Kunstpunkt-Nummern und eindeutiger Wochenendlegende. Bilder und Logos erst nach Klärung ihrer vorgesehenen Nutzung übernehmen.
- Daten zunächst als geprüfter Snapshot pro Veröffentlichung. Verantwortlichkeit und Aktualisierungsrhythmus vor einem öffentlichen Besuchertest festlegen.
- Zielbrowser: aktuelle stabile Versionen von Safari auf iPhone und Chrome auf Android zum Testzeitpunkt; konkrete Geräte und Versionen im Abnahmeprotokoll festhalten.

## 3. Empfohlener erster Funktionsumfang

### Karte und Orientierung

- Bildschirmfüllender App-Rahmen mit `100dvh`, Fallback und Safe-Area-Abständen; keine zusätzliche Dokument-Scrollstrecke um die Karte.
- Oben Suchfeld und eine kompakte Filterzeile, unten erreichbare Aktionen für Karte/Liste und Standort.
- Ein Finger verschiebt die Vollbildkarte, zwei Finger zoomen. Scrollen in der Liste oder im Detailbereich verschiebt nicht die Karte darunter.
- Bei einer späteren Einbettung in eine scrollbare Website Gestenbehandlung getrennt betrachten. `cooperativeGestures` ist keine Leaflet-Core-Option.
- Cluster zählen Kunstpunkt-Standorte. Einzelmarker zeigen die gedruckte Nummer; Wochenende und Offraum werden zusätzlich zu Farbe durch Text/Umriss/Icon unterscheidbar.
- Nahe oder identische Koordinaten bleiben bis zum letzten Standort auswählbar, etwa durch Aufspreizen oder eine Standortliste.

### Suche, Filter und Liste

- Lokale Suche nach Kunstpunkt-Nummer, allen zugeordneten Namen und Adresse; tolerant gegenüber Großschreibung, Umlauten und Varianten von Leerzeichen/Bindestrichen.
- Wochenende als `Alle`, `12./13.09. · Nord`, `19./20.09. · Süd`. Keine ausschließlich relativen Labels wie „nächstes Wochenende“.
- Offraum-Filter und sichtbare Trefferzahl. Suche, Wochenende und Offraum werden mit UND kombiniert.
- Start zunächst mit allen Kunstpunkten; ein aktuelles Wochenende darf hervorgehoben werden, ohne das andere unsichtbar zu machen.
- Karte und Liste verwenden dieselbe Treffermenge. Ohne Standort nach Nummer, nach Standortfreigabe optional nach Luftlinie sortieren.
- Beispiel „3 Kunstpunkte innerhalb 500 m Luftlinie“ bezieht sich auf Standorte, nicht auf die Anzahl von Künstlerinnen und Künstlern.
- Suche umfasst standardmäßig alle gefilterten Standorte, nicht nur den sichtbaren Kartenausschnitt. Keine versteckte Begrenzung auf den Kartenausschnitt.
- Leere Ergebnisse erklären und Filter zurücksetzen lassen. Ist ein Suchziel ausgefiltert, die Filterursache kenntlich machen.

### Standort und Details

- Standortzugriff ausschließlich nach Betätigung von „Mein Standort“; Genauigkeitskreis und Zeitpunkt der letzten Messung anzeigen.
- Zunächst einmalige Standortabfrage mit manueller Aktualisierung. Kein ungefragtes dauerhaftes Verfolgen und keine Speicherung des GPS-Verlaufs.
- Verweigerung, Timeout und ungenaue Position verständlich behandeln; die übrige App bleibt benutzbar.
- Unteres Detailpanel mit kompakter und erweiterter Stufe, auch über echte Schaltflächen bedienbar. Wischen ist optional.
- Kompakte Ansicht: Kunstpunkt-Nummer, Adresse, Wochenende und Name bzw. erste Namen mit Anzahl weiterer Teilnehmender.
- Erweiterte Ansicht: alle Personen/Einrichtungen am Kunstpunkt, vorhandene Absagehinweise und individuelle Links zu den Originalseiten.
- „Route hierher“ übergibt Zielkoordinaten an Google Maps oder Apple Maps. Zu Fuß/Fahrrad wird im externen Kartendienst gewählt, soweit unterstützt.
- Standortlinks sind teilbar, zum Beispiel `?punkt=163`. Neuladen auf GitHub Pages erhält die Auswahl.

## 4. Datenabhängige Erweiterungen

### Öffnungszeiten und „Jetzt geöffnet“

Die Quelldatei enthält keine individuellen Öffnungszeiten. Die Website nennt allgemeine Atelierzeiten mit Ausnahmen und abweichende Regeln für Offräume. Deshalb zeigt der erste Kern Wochenenddaten und einen Link zu den Originalinformationen.

Ein verbindlicher „Jetzt geöffnet“-Filter folgt erst mit geprüften Zeitintervallen und Ausnahmen. Berechnung in `Europe/Berlin`, unabhängig von der Gerätezeitzone; von Öffnung einschließlich bis Schließung ausschließlich. Zustände: geöffnet, geschlossen, unbekannt, abgesagt. „Unbekannt“ wird nicht als geschlossen behandelt und besteht den Filter „Jetzt geöffnet“ nicht. Aus allgemeinen Regeln abgeleitete Angaben heißen ausdrücklich „laut allgemeinen Öffnungszeiten“.

Offraum-Freitage benötigen einen eigenen Termin; aus „ab 19 Uhr“ lässt sich keine sichere Schließzeit ableiten. Eine einzelne Absage darf nicht das gesamte Gruppenatelier schließen.

### Sparten, Zugang, Bilder und Texte

Sparten und Hinweise zum Zugang sind auf einzelnen Detailseiten vorhanden, jedoch nicht in `gm_daten.js`. Vor entsprechenden Filtern braucht es eine geprüfte Ergänzungsquelle und einen Aktualisierungsprozess.

Zugangsangaben behalten ihre genaue Bedeutung und Herkunft, z. B. „laut Veranstalter barrierefrei erreichbar“. Fehlende Angaben bedeuten „nicht angegeben“. Zugang zu einer einzelnen Person oder einem Atelier wird nicht ungeprüft auf ein ganzes Haus übertragen. Eine barrierefreie Toilette wird nicht aus stufenlosem Zugang abgeleitet.

Bilder werden bereits im Detailkonzept und Datenmodell eingeplant: optionale Bild-URL, Alternativtext, Urheberangabe, Quell-URL und Nutzungsnachweis. Ein fehlendes oder nicht ladendes Bild darf keine Information oder Aktion unzugänglich machen. Sobald eine geeignete Bildquelle feststeht, können ausgewählte Vorschaubilder den ersten vorzeigbaren Prototyp ergänzen; sie blockieren den Kern nicht. Keine Bildkopien oder vollständigen Biografien aus ungeklärter Quelle in das öffentliche Repository übernehmen. Bis zur Ergänzung führen Links zur Originalseite. Merkliste, Besuchsstatus, Tourenplanung, Mehrsprachigkeit und echte Geh-/Radentfernungen gehören zum optionalen Ausbau.

## 5. Architekturvorschlag

- Leaflet mit kompatiblem Markercluster-Plugin; zum Implementierungsstart stabile, miteinander geprüfte Versionen festschreiben.
- TypeScript und Vite; vorerst kein zusätzliches UI-Framework erforderlich.
- Separate Module für Datenimport, Suche/Filter, Karte, Detailpanel und Standort. So sind spätere Ansichtsänderungen möglich.
- Import zur Build-/Veröffentlichungszeit: Quelldaten als Text laden, Format strikt parsen und validieren, HTML-Entities dekodieren und erlaubte Zeilenumbrüche in Text umwandeln. Fremdes JavaScript nicht mit `eval` ausführen und Namen nicht als Roh-HTML darstellen.
- Lokales GeoJSON mit einem Feature je Kunstpunkt, separater Teilnehmerliste je Feature, Veranstaltungskonfiguration sowie Quellen- und Abrufzeitpunkt.
- Offraum ist eine Eigenschaft eines Standortes, keine dritte Alternative zu Wochenende 1/2. Personen und Einrichtungen nicht aus Namen heuristisch gleichsetzen.
- Veröffentlichung als statische Dateien über GitHub Pages. Relative Pfade/Base-Path, Service-Worker-Scope und Manifest müssen auch unter `/<repository>/` stimmen.
- Kein Live-Abruf von Kunstpunkte-Daten für jeden Besucher: Die App lädt den geprüften eigenen Snapshot, unabhängig von Laufzeit-CORS der Originalseite.
- Kartenanbieter konfigurierbar. Für den ersten Onlinetest sind OSM-Standardkacheln bei Einhaltung der Nutzungsvorgaben eine Option. Die bestehende Karte verwendet einen anderen Anbieter (RVR); dessen Bedingungen sind separat zu prüfen, falls wir ihn übernehmen.
- Keine geheimen API-Schlüssel im Frontend. Standort wird lokal verarbeitet; Hosting, Kacheldienst und externe Navigation haben eigene Netzwerkzugriffe, die im Informationsbereich benannt werden.

### PWA-Ausbaustufe

Manifest, Icons und Service Worker ergänzen; App-Dateien und geprüfter Datensatz sind nach einem erfolgreichen Onlinebesuch offline nutzbar. Ohne Netz bleiben Liste, Suche, Filter und Textdetails verfügbar. Der Offlinezustand und Datenstand sind sichtbar. Kartenhintergrund und externe Navigation werden nicht als offline verfügbar versprochen.

Neue App-/Datenversionen gemeinsam aktivieren; bei fehlgeschlagenem Update die letzte vollständige Version erhalten. Speicherlöschung/Cacheverlust erkennen und beim nächsten Onlinezugriff neu laden. Installation und Verhalten auf iOS und Android getrennt prüfen.

Kein Vorladen von OSM-Standardkacheln für Offlinekarten. Eine echte Offline-Hintergrundkarte erfordert später einen dafür geeigneten Anbieter oder eigene Kacheln. Eine PWA umgeht diese Anbieterbedingungen nicht. Normales HTTP-Caching bereits betrachteter Kacheln ist erlaubt, aber keine Zusage einer vollständigen Offlinekarte. Offline-App und Offline-Kartenhintergrund sind zwei getrennte Anforderungen.

## 6. Abnahmekriterien

Alle Kriterien sind bislang geplant, nicht getestet oder abgenommen.

| ID | Prüffall und erwartetes Ergebnis | Stufe |
| --- | --- | --- |
| A01 | Bei 360×640, 390×844 und 412×915 CSS-Pixeln sowie Querformat sind Suche, Schließen, Standort und Routenaktion erreichbar; keine horizontale Dokumentrolle. Browserleisten, Safe Areas und Bildschirmtastatur verdecken keine aktive Bedienung. | Kern |
| A02 | Buttons, Chips und interaktive Marker haben mindestens 44×44 CSS-Pixel große Trefferflächen; Kategorien besitzen auch eine nichtfarbliche Kennzeichnung. | Kern |
| A03 | Alle 196 Kunstpunkte des untersuchten 2026-Snapshots erscheinen genau einmal; sämtliche 416 Name/Slug-Paare bleiben ihrem Standort zugeordnet. Neue Quelldaten dürfen diese Anzahlen ändern, wenn der Unterschied geprüft und dokumentiert wird. | Kern |
| A04 | `ks/os` ergeben 103 Standorte am 12./13.09.; `kn/on` ergeben 93 am 19./20.09. Der Filter „Offraum“ liefert im untersuchten Snapshot 28 Standorte, nicht fälschlich 30. | Kern |
| A05 | Suche nach `163`, `Kemsa`, `Muller` und einer Adresse findet die erwarteten Orte; `Muller` findet auch Namen mit „Müller“. Teilnehmende eines Gruppenateliers erzeugen keine doppelten Standorttreffer. | Kern |
| A06 | Filterkombinationen zeigen identische Treffermengen auf Karte und Liste; Zurücksetzen stellt alle Standorte wieder her. Keine Treffer führt zu einer erklärten leeren Ansicht. | Kern |
| A07 | Cluster lösen sich beim Zoomen/Auswählen auf; auch bei gleichen Koordinaten ist jeder Standort erreichbar. Kunstpunktnummer und Clusteranzahl sind visuell unterscheidbar. | Kern |
| A08 | Detailpanel zu Nr. 194 macht alle 22 zugeordneten Einträge zugänglich, ohne Inhalte abzuschneiden. Schließen stellt Fokus und Kartenkontext wieder her; Liste/Panel lassen sich unabhängig von der Karte scrollen. | Kern |
| A09 | Standort wird erst nach Klick angefragt. Erfolg zeigt Punkt und Genauigkeit; Ablehnung, Timeout oder fehlende API lassen Suche und Karte funktionsfähig. Entfernung ist ausdrücklich Luftlinie. | Kern |
| A10 | Routenaktion übergibt korrekte Breite/Länge. `?punkt=163` öffnet nach Neuladen die richtigen Details unter dem GitHub-Pages-Projektpfad. Unbekannte Nummern verursachen keinen Absturz. | Kern |
| A11 | Nr. 152 zeigt die vorliegende Absage; bei Nr. 163 wird Gudrun Kemsas Absage auf Personenebene angezeigt, während die anderen Teilnehmenden erreichbar bleiben. Es erscheint kein unbelegtes „Jetzt geöffnet“. | Kern |
| A12 | Kernmetadaten ohne Bilder bleiben unter 200.000 Byte unkomprimiertem UTF-8-JSON. Suche und Filter aktualisieren die sichtbaren Ergebnisse innerhalb 100 ms nach Eingabe/Filterwechsel, gemessen mit geladenem Datensatz auf dokumentiertem Android-Testgerät. | Kern |
| A13 | Kalter Seitenstart: Suche und Liste sind in höchstens 3 Sekunden bedienbar bei 10 Mbit/s Download, 100 ms RTT und 4-facher CPU-Drosselung in Chrome; Median von 3 Läufen. Ausbleibende Kacheln blockieren die Liste nicht. | Kern |
| A14 | Tastaturbedienung, sichtbarer Fokus, beschriftete Bedienelemente und Screenreader-Zugang zu Suche, Treffern und Details funktionieren. Kontraste werden auf 4,5:1 für normalen Text und 3:1 für relevante UI-Grafik geprüft. Karteninhalt ist über die Liste zugänglich. | Kern |
| A15 | Quellenlink und Datenstand sind zugänglich, Kartenattribution bleibt sichtbar und wird von keinem Panel verdeckt. Fehlerhaftes Update überschreibt keinen geprüften Datensatz; fehlende Kacheln erhalten einen verständlichen Hinweis. | Kern |
| A16 | Nach erfolgreichem Onlinebesuch und abgeschlossener Offline-Vorbereitung: Flugmodus, App schließen, neu öffnen → Liste, Suche, Filter und Textdetails funktionieren. Erster Besuch ohne Netz wird nicht als unterstützter Anwendungsfall versprochen. | PWA |
| A17 | App ist nach den Möglichkeiten des Zielbrowsers installierbar, öffnet korrekt unter dem Projektpfad, zeigt Offline-/Datenstatus und wechselt ohne gemischte Dateiversionen auf ein Update. Tests dokumentieren auch fehlenden Cache und unterbrochenes Update. | PWA |
| A18 | Öffnungsstatus besteht Tests direkt vor/am Beginn und Ende, außerhalb der Veranstaltung, bei abweichender Gerätezeitzone, Offraum-Sondertermin, unbekannter Zeit und Teilabsage. | Zeitfilter-Ausbau |
| A19 | Mindestens 4 von 5 Besuchertestpersonen erfüllen den Such- und Routenablauf ohne Anleitung in 60 Sekunden; Hindernisse und daraus nötige Änderungen sind protokolliert. | Testfreigabe |

## 7. Abnahmeverfahren

Pro Meilenstein werden Version/Commit, Datenstand, Geräte/Browser, bestandene Kriterien und offene Mängel protokolliert. Ein Build oder eine Desktop-Simulation ersetzt keinen Test auf iPhone und Android. Nicht verfügbare reale Geräte werden als offene Prüfung ausgewiesen, nicht als bestanden.

Gezielte automatisierte Prüfungen: Importformat/Zuordnung, Absagen, Suche/Filter, URL-Auswahl sowie später Zeitlogik und Cache-Update. Manuelle Prüfung: Touch-Gesten, Bildschirmtastatur, Detailpanel, tatsächliche Navigation, Screenreader und Installation. Vor dem öffentlichen Besuchertest müssen kritische Datenfehler, unerreichbare Aktionen und irreführende Öffnungs-/Zugangsaussagen beseitigt sein.

## 8. Quellen

- [Ausgangskarte](https://kunstpunkte.de/karte.html), [Datenquelle](https://kunstpunkte.de/osm/gm_daten.js), [Kartenlogik](https://kunstpunkte.de/osm/osm_leaflet.js)
- [Veranstaltungsdaten und allgemeine Öffnungszeiten](https://kunstpunkte.de/index.html)
- [Leaflet](https://leafletjs.com/), [Markercluster-Dokumentation](https://leaflet.github.io/Leaflet.markercluster/)
- [GitHub Pages: statisches Hosting und Verfügbarkeit](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages)
- [OSM-Standardkacheln: Nutzung und Offline-Einschränkung](https://operations.osmfoundation.org/policies/tiles/)
- [MDN: PWA-Offlinebetrieb und Service Worker](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Offline_and_background_operation)
