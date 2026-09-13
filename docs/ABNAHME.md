# Prüfstand des ersten mobilen Kerns

Stand: 13.09.2026. Implementierter Prototyp, noch keine vollständige Abnahme auf echten Mobilgeräten.

## Durchgeführt

- TypeScript-Prüfung und Produktionsbuild unter Node.js 24.14.0, Windows.
- 11 fachliche/DOM-Tests für Datenimport, Suchnormalisierung, Filter, Teilnehmerabsagen, Distanzsortierung, Routenlinks, Standortfehler und Standortdetails.
- 3 Anwendungstests mit dem tatsächlich gebauten JavaScript in jsdom. Der Test isoliert Netz und GPS; es werden keine echten Standortdaten erfragt und keine Kartenkacheln für Tests heruntergeladen.
- Anwendung startet mit 196 Standorten; Wochenendfilter ergeben 103 bzw. 93, Offraumfilter 28 Standorte.
- Regression „Wildförster“: `wildf`, `Wildförster` und `wildforster` finden Nr. 2; Dagmar Wildförster erscheint zuerst und hervorgehoben in Karteikarte und Standortdetails.
- Gruppenatelier Nr. 194: alle 22 Einträge im aufgeklappten Panel erreichbar; Escape schließt und stellt den Fokus wieder her.
- Direkter Projektlink `?punkt=163`, unbekannte Nummer, Standortverweigerung und fehlgeschlagener Datenabruf geprüft.
- Normalisierter Metadatensatz: 93.649 Byte ohne abschließenden Zeilenumbruch. Produktions-JavaScript etwa 204 KB / 61 KB gzip, CSS etwa 31 KB / 11 KB gzip; genaue Hashnamen und Größen ändern sich pro Build.

## Zuordnung zu den Plan-Abnahmekriterien

| Kriterien | Status / Evidenz |
| --- | --- |
| A03–A06 | Fachliche Daten-/Such-/Filtertests bestanden. Liste und Kartenmodul bekommen dieselbe berechnete Treffermenge. |
| A08 | DOM-Test: 22 Einträge, Expand/Collapse, Absage und Fokuswiederherstellung. Reales Scrollen/Touch offen. |
| A09 | Standort ist beim Start unangefragt; Erfolg und Fehlerfälle mit Testantworten geprüft. Reale GPS-Abfrage/Genauigkeitsanzeige auf Geräten offen. |
| A10 | Koordinatenreihenfolge und Projektpfad sowie direkter App-Aufruf automatisiert geprüft. Öffnen der externen Karten-Apps auf Geräten offen. |
| A11 | Vollständige und einzelne Absagen fachlich geprüft; kein unbelegter Öffnungsfilter. |
| A12 | Datenbudget erfüllt. Die 100-ms-Vorgabe ist noch nicht auf dem vereinbarten Android-Gerät gemessen. |
| A15 | Quell-/Zeitangabe implementiert, Attribution außerhalb überlagerbarer Kartenpanels; Importabbruch und Datenladefehler getestet. Reale Kachelausfälle noch manuell prüfen. |
| A01/A02/A07/A14 | Responsive CSS, mindestens 44-Pixel-Buttons/Marker, Clustering und zugängliche Bedienung implementiert. Tatsächliche Touchbedienung, Layout, Kontraste und Screenreader-Abnahme noch offen. |
| A13 | Kein abgeschlossener Test mit Netz-/CPU-Drosselung und drei Kaltstarts. |
| A16/A17 | PWA bewusst nächste Stufe; nicht implementiert. |
| A18 | Öffnungszeitenfilter zurückgestellt, bis verlässliche Zeitdaten vorliegen. |
| A19 | Fünf Besuchertests noch ausstehend. |

Die bereitgestellte Nutzeraufnahme zeigt die frühe Listenansicht und war die Grundlage des Wildförster-Fixes. Sie ersetzt keine systematische Geräteabnahme. Die lokalen Änderungen werden in fachlich getrennten Commits dokumentiert.

## Nächste manuelle Prüfung

Die folgenden Favoritenprüfungen ergänzen den ursprünglichen Kern. Aktuell insgesamt 21 bestandene automatisierte Tests (15 fachliche/DOM-Tests und 6 Anwendungstests).

### Ergänzung: Favoriten

| ID | Abnahmekriterium | Prüfung |
| --- | --- | --- |
| F01 | Kunstpunkte über Stern in Liste und Details speichern/entfernen; beide Anzeigen und Gesamtanzahl stimmen überein. | Gebaute App in jsdom geprüft. |
| F02 | Gespeicherte IDs bleiben nach erneutem Start mit demselben Browserspeicher erhalten; Entfernen bleibt ebenfalls gespeichert. | Speicher- und Anwendungstest mit erneuter App-Initialisierung bestanden. |
| F03 | Favoritenansicht zeigt nur gemerkte Standorte; Nord/Süd, Suche und Offraumfilter bilden die korrekte Schnittmenge. | Fachliche Tests und vollständiger Bedienablauf bestanden. |
| F04 | Keine Treffer und Entfernen des letzten sichtbaren Favoriten ergeben eine verständliche leere Ansicht. Zurücksetzen der Filter löscht keine Merkliste. | Anwendungstest bestanden; Speicheränderung ausschließlich über Merken/Entfernen. |
| F05 | Blockierter/voller Speicher erzeugt keine falsche Erfolgsmeldung oder gespeicherte Darstellung; beschädigte Daten lassen die App benutzbar. | Fehlerfälle fachlich und mit der gebauten App geprüft. |
| F06 | Einträge anderer Jahre erscheinen nicht als Favorit der Ausgabe 2026; Änderungen in anderen Tabs werden übernommen. | Jahres- und Tab-Tests bestanden. |

Echtes Neuladen, Schließen/Wiederöffnen des Browsers und Touchbedienung bitte zusätzlich auf den Zielgeräten testen. Merklisten sind lokal pro Browser/Origin; insbesondere werden Favoriten aus `localhost` nicht auf die öffentliche GitHub-Seite übertragen.

### Geräteprüfung

1. iPhone Safari und Android Chrome, konkrete Versionen notieren. Ansichten bei 360×640, 390×844 und 412×915 sowie quer und mit Bildschirmtastatur ausprobieren.
2. `Wildförster` suchen, Treffer öffnen, alle Personen aufklappen, Details schließen; Nummer 194 mit langer Liste prüfen.
3. Kartencluster und nahe Standorte auswählen, zoomen, Filter wechseln und Karten-/Listenwechsel prüfen.
4. Eigenen Standort erlauben bzw. verweigern; Luftlinie, Genauigkeit und erneute Messung prüfen.
5. Google-/Apple-Navigation sowie Teilen und Browser-Zurück auf dem Mobilgerät testen.
6. Bildschirmleser, Tastatur, 200 % Vergrößerung, Kontraste und Performance messen; Befunde nachtragen.
