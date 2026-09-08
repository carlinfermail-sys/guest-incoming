# Scope e confini dell'MVP

## Obiettivo P0 attivo

Completare `Beds24 → Make → Notion → Bookings/Stays`.

Obiettivo immediato: ottenere un record Beds24 completo e coerente in Notion, quindi verificare lo stesso mapping su almeno 2–3 prenotazioni differenti.

## Confini MVP approvati

- Notion è il database operativo dell'MVP.
- `Bookings/Stays` è l'unico database centrale di prenotazioni e soggiorni.
- Non creare database separati per Booking.com, Airbnb, Direct, Website o altri canali.
- `Channel` identifica la provenienza della prenotazione.
- Bookings e Stays restano nello stesso database durante l'MVP.
- Properties e Units sono consolidate e non devono essere ridisegnate senza dipendenza concreta.
- Trackers rimane Database Control Center.
- Knowledge Base e dati operativi rimangono separati.

## Stato master data

| Area | Stato |
| --- | --- |
| Properties | MVP Complete |
| Units | MVP Complete |
| Bookings/Stays | In sviluppo / consolidamento |
| Vendors | In sviluppo |
| Tasks | Futuro |

## Successivi al P0, nel percorso MVP

- Campi operativi P1 e attività di stabilizzazione P2, descritti in `06-decisions-roadmap-and-saas.md`.

## Futuro / fuori dal core MVP attuale

- Tasks Engine.
- Multi-tenancy, billing, permission system e altre astrazioni SaaS premature.

## Da acquisire da Notion

**DA ACQUISIRE DA NOTION**: utenti, casi d'uso completi, criteri di accettazione puntuali e requisiti funzionali non espressi nelle specifiche consolidate.

Fonte prevista: Notion Knowledge Base / Blueprint.
