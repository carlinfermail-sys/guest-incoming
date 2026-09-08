# Modello dati operativo

## Principi approvati

- Notion è il database operativo dell'MVP.
- Knowledge Base e dati operativi restano separati.
- `Bookings/Stays` è l'unico database centrale di prenotazioni e soggiorni.
- Bookings e Stays restano nello stesso database durante l'MVP.
- Non creare database per singolo canale; `Channel` identifica la provenienza della prenotazione.
- Properties e Units sono consolidate e non vengono ridisegnate senza dipendenza concreta.
- Trackers rimane Database Control Center.

## Entità e stato

| Entità/area | Ruolo | Stato |
| --- | --- | --- |
| `Bookings/Stays` | Database centrale prenotazioni e soggiorni | In sviluppo / consolidamento |
| Properties | Master data consolidato | MVP Complete |
| Units | Master data consolidato | MVP Complete |
| Vendors | Master data operativo | In sviluppo |
| Tasks | Tasks Engine | Futuro |
| Trackers | Database Control Center per navigazione rapida dei database, controllo dati, accesso alle viste operative e debug operativo | DOCUMENTATO |

## Bookings/Stays

Il database centralizza i record provenienti da canali differenti. Il campo `Channel` identifica la provenienza; non sono autorizzati database separati per Booking.com, Airbnb, Direct, Website o altri canali.

Il mapping puntuale, inclusi Property/Unit relation e relativi ID, appartiene a `05-notion-population-matrix.md`.

## Relazioni concettuali note

- `Properties → Units`
- `Units → Bookings/Stays`
- `Bookings/Stays → Vendors`

Queste relazioni concettuali non definiscono automaticamente cardinalità, foreign key o autorizzazione a ridisegnare lo schema.

## Da acquisire da Notion

**DA ACQUISIRE / VERIFICARE**: schema completo delle proprietà, ID effettivi, cardinalità, obbligatorietà, deduplica, ownership degli aggiornamenti e schema Beds24 completo.

Fonte prevista: Notion Knowledge Base / Blueprint e Architecture & APIs.
