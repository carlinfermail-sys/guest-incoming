# Booking/Stay lifecycle

## Principio MVP

Bookings e Stays restano nello stesso database `Bookings/Stays` durante l'MVP. Non sono previsti database separati per canale; `Channel` identifica la provenienza della prenotazione.

## Booking Status verificato

| Aspetto | Stato |
| --- | --- |
| Tipo della proprietà `Booking Status` | VERIFICATO: Select |
| Normalizzazione Make | VERIFICATO: `confirmed → Confirmed` con `switch()` |
| Aggiornamento Notion | VERIFICATO: PATCH con `select.name` |
| Evidenza | VERIFICATO: due Run Once consecutivi |

Il mapping dettagliato della proprietà appartiene a `05-notion-population-matrix.md`.

## Valori attualmente noti di Booking Status

`Pending`, `Confirmed`, `Preparing`, `Ready Check-in`, `In stay`, `Check-out Today`, `Cleaning`, `Completed`, `Cancelled`.

## Stati Stay documentati

| Stato | Significato documentato |
| --- | --- |
| `Preparing` | Soggiorno futuro in preparazione |
| `Ready` | Appartamento pronto per l'arrivo |
| `In Stay` | Ospite presente |
| `Checkout Pending` | Checkout effettuato, pulizia da completare |
| `Completed` | Soggiorno concluso |
| `Cancelled` | Prenotazione annullata |

Questi valori non definiscono una state machine o un ordine automatico delle transizioni.

## Da verificare / completare

**DA VERIFICARE / COMPLETARE**: eventi che provocano le transizioni, condizioni temporali, automazioni, sistema autorevole per ogni cambio stato, cancellazioni nelle diverse fasi, eventi duplicati/fuori ordine e rapporto preciso Booking Status/Stay Status.

Fonte prevista: Notion Knowledge Base / Blueprint, processi operativi e Architecture & APIs.

## Regola di stabilizzazione

Non modificare il BACKFILL funzionante mentre è in corso la certificazione del mapping P0.
