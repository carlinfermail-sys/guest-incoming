# Registro delle conoscenze

## Legenda

- **VERIFICATO**: confermato con test o configurazione controllata.
- **DOCUMENTATO**: definito nelle specifiche consolidate; la fonte operativa primaria resta Notion Knowledge Base / Blueprint.
- **DOCUMENTATO PARZIALMENTE**: alcune informazioni sono documentate, mentre il completamento richiede verifica o integrazione.
- **DA VERIFICARE**: richiede test, certificazione o conferma prima del riuso.
- **DA ACQUISIRE DA NOTION**: dettaglio non disponibile nelle specifiche consolidate.

## Registro attuale

| Argomento | Stato | Fonte principale | Evidenza o azione |
| --- | --- | --- | --- |
| Notion come database operativo dell'MVP | DOCUMENTATO | Notion Knowledge Base / Blueprint | Architettura approvata. |
| Make come layer di integrazione/orchestrazione | DOCUMENTATO | Notion Knowledge Base / Blueprint | Architettura approvata. |
| Flusso `Beds24 → Make → Notion` | DOCUMENTATO | Notion Knowledge Base / Blueprint | P0 attivo; dettaglio in `02`. |
| `Bookings/Stays` come unico database centrale | DOCUMENTATO | Notion Knowledge Base / Blueprint | Dettaglio in `03`. |
| Properties e Units consolidate | DOCUMENTATO | Notion Knowledge Base / Blueprint | Stato master data in `01`. |
| Text diretto, Number, Relation e Select | VERIFICATO | Pattern Notion controllati | Dettaglio e mapping in `05`. |
| Date Check-in/Check-out | VERIFICATO | Pattern Notion operativo | Mapping Make **OPERATIVO/VERIFICATO**; payload API manuale **DA VERIFICARE** separatamente. |
| `confirmed → Confirmed` in Booking Status | VERIFICATO | Due Run Once consecutivi | Dettaglio in `04` e `05`. |
| Access token Beds24 temporaneo | VERIFICATO | Lifecycle Beds24 | Dettaglio in `02`. |
| Refresh token Beds24 | DOCUMENTATO | Lifecycle Beds24 | Automazione refresh **DA PROGETTARE / DA VERIFICARE**. |
| Schema completo Beds24, identificativi e dati ospite | DA ACQUISIRE DA NOTION | Knowledge Base / Blueprint | Necessario per P0. |
| Lifecycle Booking/Stay | DOCUMENTATO PARZIALMENTE | Knowledge Base / Blueprint | Stati e alcuni significati documentati; transizioni, eventi e regole complete **DA VERIFICARE / COMPLETARE**. |
| Trackers come Database Control Center | DOCUMENTATO | Knowledge Base / Blueprint | Dettaglio in `03`. |
| Blueprint Make dettagliato | DA ACQUISIRE DA NOTION | Knowledge Base / Blueprint | Da acquisire/verificare separatamente. |

## Regola di aggiornamento

Ogni avanzamento di stato deve riportare fonte, test o evidenza. Non promuovere voci **DA VERIFICARE** o **DA ACQUISIRE DA NOTION** senza conferma dalla fonte prevista.
