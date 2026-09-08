# Architettura e integrazioni

## Architettura approvata

| Componente | Ruolo |
| --- | --- |
| Beds24 | Origine dati delle prenotazioni nel flusso P0. |
| Make | Layer di integrazione e orchestrazione. |
| Notion | Database operativo dell'MVP. |
| `Bookings/Stays` | Database centrale unico per prenotazioni e soggiorni. |

Flusso corrente: `Beds24 → Make → Notion`.

La web app nel repository non modifica questo flusso né il modello dati. Le responsabilità di dominio sono descritte in `03-operational-data-model.md`; il mapping dettagliato è in `05-notion-population-matrix.md`.

## Integrazione Beds24 → Make → Notion

Il P0 richiede un record Beds24 completo e coerente in Notion e la verifica dello stesso mapping su almeno 2–3 prenotazioni differenti.

**DOCUMENTATO PARZIALMENTE**: esiste il BACKFILL `Beds24 → Make → Notion`; esistono moduli/condizioni downstream da sottoporre a impact check; la paginazione documentata utilizza `data / pages.nextPageLink`.

**DA ACQUISIRE / VERIFICARE**: configurazione completa degli scenari Make, endpoint/payload completi, filtri/router/search effettivi, deduplica, retry, logging e gestione errori.

Fonte prevista: Notion Knowledge Base / Blueprint, Architecture & APIs e Blueprint Make.

## Autenticazione Beds24

Lifecycle documentato:

`Invite Code → /authentication/setup → Refresh Token → /authentication/token → Access Token`

| Elemento | Stato |
| --- | --- |
| Access token temporaneo | VERIFICATO |
| Refresh token | DOCUMENTATO |
| Automazione completa refresh | DA PROGETTARE / DA VERIFICARE |

Il token management deve essere sviluppato separatamente. Non modificare o destabilizzare il BACKFILL funzionante.

Non inserire token, refresh token, invite code, chiavi o credenziali nel repository.

## Confini di integrazione

- Preservare prima di migliorare.
- Non eseguire refactor distruttivi durante la stabilizzazione MVP.
- Ogni variazione di architettura, integrazione o schema richiede approvazione secondo `AGENTS.md`.
