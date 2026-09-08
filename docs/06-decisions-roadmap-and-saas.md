# Decisioni, roadmap e futura evoluzione SaaS

## Decisioni approvate

- Notion è il database operativo dell'MVP.
- Make è il layer di integrazione/orchestrazione.
- Il flusso corrente è `Beds24 → Make → Notion`.
- `Bookings/Stays` è il database centrale unico per prenotazioni e soggiorni.
- Non creare database separati per singolo canale; `Channel` identifica la provenienza.
- Bookings e Stays restano nello stesso database durante l'MVP.
- Properties e Units sono consolidate; non ridisegnarle senza dipendenza concreta.
- Trackers rimane Database Control Center.
- Knowledge Base e dati operativi restano separati.
- Non modificare il tipo di una proprietà Notion per risolvere un problema di mapping prima di verificare il payload/API previsto per il tipo esistente.

## Roadmap

### P0 — attivo

Completare `Beds24 → Make → Notion → Bookings/Stays` con un record completo e coerente in Notion, poi verificare il mapping su almeno 2–3 prenotazioni differenti.

La Population Matrix P0 è in `05-notion-population-matrix.md`.

### P1 — operativo

- Cleaning Status.
- Cleaning Completed Date.
- Assigned Vendor.
- Eventuali campi operativi check-in/check-out.

### P2 — stabilizzazione

- Test record completo end-to-end.
- Test di 2–3 prenotazioni.
- Gestione valori Beds24 inattesi.
- Impact check di filtri/router/search Make.
- Riduzione di operations Make inutili.

## Principi engineering

- Preservare prima di migliorare.
- Una milestone alla volta.
- Non inventare requisiti.
- Distinguere VERIFICATO / DOCUMENTATO / DA VERIFICARE.
- Niente refactor distruttivi durante la stabilizzazione MVP.
- Test prima della chiusura.

## Evoluzione SaaS — fuori dall'MVP

La futura evoluzione SaaS è ammessa come direzione, ma non introduce ora multi-tenancy, billing, permission system o altre astrazioni premature.

**DA ACQUISIRE DA NOTION**: prerequisiti approvati, sequenza di evoluzione e decisioni architetturali necessarie prima di ogni implementazione SaaS.

Fonte prevista: Notion Knowledge Base / Blueprint e decisioni progettuali approvate.
