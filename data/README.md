# Veranstaltungsdaten

Der eingecheckte Snapshot stammt von [kunstpunkte.de](https://kunstpunkte.de/osm/gm_daten.js). Abrufzeit und URL stehen in `source/retrieval.json`; die normalisierte Datei enthält zusätzlich den SHA-256-Hash der Quelle. Es handelt sich um einen unabhängigen Prototyp. Veranstaltungsinhalte werden nicht unter einer eigenen Code-Lizenz neu lizenziert.

## Reproduzierbarer Import

Voraussetzung: Node.js 24 oder neuer, danach `npm ci`.

- `npm run data:import`: erzeugt aus dem eingecheckten Snapshot `public/data/kunstpunkte-2026.json`, ohne Netzwerk.
- `npm run data:import -- --refresh`: liest die öffentliche Quelle erneut und ersetzt den Snapshot erst nach erfolgreicher Validierung. Vor Veröffentlichung den Git-Diff prüfen, insbesondere Absagen, Anzahlen und Termine.
- `npm run check` und `npm test`: prüfen Typen und fachliche Importregeln.

Die Datei wird als Datenformat gelesen, nicht als JavaScript ausgeführt. Ein neues Veranstaltungsjahr oder geänderte Wochenendtermine benötigen eine bewusste Anpassung in `scripts/parse-source.ts`. Die Regressionstests bilden den ursprünglichen 2026-Snapshot ab; bei fachlich bestätigten Änderungen werden sie mit aktualisiert.

Das Datenmodell hält optionale Bilder mit Alternativtext, Urheberangabe, Originalquelle und Nutzungsnachweis vor. Der erste Snapshot enthält keine kopierten Bilder oder Biografien.
