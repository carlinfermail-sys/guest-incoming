# Population Matrix e mapping Notion

Questo documento è la fonte principale del mapping di campo `Beds24 → Make → Notion → Bookings/Stays`.

## Population Matrix P0

| # | Campo/area | Tipo Notion | Priorità | Stato |
| --- | --- | --- | --- | --- |
| 1 | Booking Status | Select | P0 | CHIUSO |
| 2 | Booking Source | Select | P0 | Da completare |
| 3 | Booking Type | Select | P0 | Da completare |
| 4 | Channel | Select | P0 | Da completare |
| 5 | Check-in | Date | P0 | Da completare |
| 6 | Check-out | Date | P0 | Da completare |
| 7 | Dates | Date range | P0 | Da completare |
| 8 | Property / Unit relation e relativi ID | DA ACQUISIRE / VERIFICARE | P0 | Da completare |
| 9 | Guest Count | DA ACQUISIRE / VERIFICARE | P0 | Da completare |
| 10 | Identificativi prenotazione e dati ospite dallo schema Beds24 completo | DA ACQUISIRE / VERIFICARE | P0 | Da completare |

## Campi P1 identificati

| Campo | Tipo Notion | Priorità |
| --- | --- | --- |
| Cleaning Status | Select | P1 |
| Cleaning Completed Date | Date | P1 |
| Assigned Vendor | Relation | P1 |

## Campo derivato

| Campo | Tipo Notion | Regola |
| --- | --- | --- |
| Alias | Rollup | Derivato, **non scrivere direttamente** |

## Pattern Notion verificati

| Tipo | Pattern | Stato |
| --- | --- | --- |
| Text | Mapping diretto | VERIFICATO |
| Number | Valore/calcolo numerico; Guest Count può derivare da `adults + children` | VERIFICATO |
| Relation | Ricerca record correlato → Notion Page ID → Relation | VERIFICATO |
| Date | Mapping Check-in/Check-out | OPERATIVO; payload API manuale **DA VERIFICARE** separatamente |
| Select | PATCH Notion API con `select.name` | VERIFICATO |

## Booking Status — chiuso

`confirmed → Confirmed` mediante normalizzazione Make `switch()` e PATCH Notion `select.name`.

`Booking Status` rimane di tipo Select. Il pattern è stato verificato con due Run Once consecutivi.

## Normalizzazioni Select documentate

| Valore sorgente | Valore Notion | Stato |
| --- | --- | --- |
| `confirmed` | `Confirmed` | VERIFICATO |
| `new` | `Pending` | DOCUMENTATO / DA VERIFICARE |
| `request` | `Pending` | DOCUMENTATO / DA VERIFICARE |
| `inquiry` | `Pending` | DOCUMENTATO / DA VERIFICARE |
| `cancelled` | `Cancelled` | DOCUMENTATO / DA VERIFICARE |

## Dati ancora da acquisire

**DA ACQUISIRE / VERIFICARE**: ID effettivi, schema Beds24 completo, source field per ogni mapping, trasformazioni mancanti, lookup Property/Unit, payload Date manuale e dati ospite necessari.

Fonte prevista: Notion Knowledge Base / Blueprint, Population Matrix e Blueprint Make.

## Regola di riuso

Applicare il protocollo James: documentazione → schema/tipo → pattern verificato → configurazione minima → test controllato → verifica → documentazione → riuso.
