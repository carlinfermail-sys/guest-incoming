# Documentazione tecnica — Guest Incoming MVP

Questa cartella contiene la documentazione tecnica versionata del MVP. La documentazione descrive soltanto decisioni e pattern riportati da fonti approvate; non sostituisce la Knowledge Base/Blueprint di Notion per requisiti e processi operativi.

## Gerarchia delle fonti

1. **Notion Knowledge Base / Blueprint** = source of truth per requisiti, processi, modello operativo e decisioni progettuali approvate.
2. **GitHub repository** = source of truth per codice e documentazione tecnica versionata.
3. **AGENTS.md** = protocollo operativo vincolante per gli agenti di sviluppo.

In caso di conflitto, segnalarlo prima di modificare codice, modello dati o documentazione che presenti una decisione come approvata.

## Indice e fonte principale per argomento

| Documento | Responsabilità documentale primaria |
| --- | --- |
| [00 — Registro delle conoscenze](00-knowledge-register.md) | Stato esplicito delle conoscenze e fonti. |
| [01 — Scope MVP](01-mvp-scope.md) | Confini MVP, stato master data e priorità P0. |
| [02 — Architettura e integrazioni](02-architecture-and-integrations.md) | Componenti, flusso Beds24 → Make → Notion e token lifecycle. |
| [03 — Modello dati operativo](03-operational-data-model.md) | Ruolo di Bookings/Stays, Properties, Units, Trackers e separazione della Knowledge Base. |
| [04 — Booking/Stay lifecycle](04-booking-stay-lifecycle.md) | Regole di lifecycle note e punti ancora da definire. |
| [05 — Population Matrix](05-notion-population-matrix.md) | Mapping P0 e pattern Notion per campo. |
| [06 — Decisioni, roadmap e SaaS](06-decisions-roadmap-and-saas.md) | Decisioni approvate, P0/P1/P2 e confini della futura evoluzione SaaS. |

I documenti secondari devono rimandare al documento responsabile dell'argomento, evitando duplicazioni di dettaglio.

## Protocollo di lavoro James

`Documentazione → schema/tipo → pattern verificato → configurazione minima → test controllato → verifica → documentazione → riuso`.

Questo protocollo guida l'esecuzione delle milestone e non sostituisce le regole vincolanti di `AGENTS.md`.

## Stato attuale

Il P0 attivo è il completamento di `Beds24 → Make → Notion → Bookings/Stays`: ottenere un record Beds24 completo e coerente in Notion, quindi verificare lo stesso mapping su almeno 2–3 prenotazioni differenti.
