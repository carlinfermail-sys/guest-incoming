# Protocollo operativo per agenti — Guest Incoming

Questo file si applica a ogni sessione di lavoro nel repository Guest Incoming.

## Obiettivo e ambito

- GitHub (`origin`) è la **source of truth** per il codice versionato.
- Notion rimane il database operativo dell'MVP; Make e Beds24 sono integrazioni esistenti.
- Non introdurre un nuovo database e non modificare codice applicativo al di fuori del task o milestone esplicitamente approvato.
- Procedere con **un solo task o milestone alla volta**. Prima di iniziarne uno nuovo, chiudere, far approvare o dichiarare bloccato quello corrente.

## Apertura di ogni sessione

Prima di modificare qualsiasi file, eseguire controlli di sola lettura:

1. Identificare repository, branch attivo e working tree (`git status --short --branch`).
2. Eseguire `git fetch` (operazione non distruttiva consentita), quindi verificare esplicitamente se il branch locale è **ahead**, **behind** o **diverged** rispetto a `origin/<branch>` (ad esempio con `git rev-list --left-right --count origin/<branch>...<branch>`).
3. Se il working tree contiene modifiche non salvate o non attribuite al task corrente, fermarsi: non sovrascriverle, non ripristinarle e non eliminarle. Segnalare lo stato e chiedere istruzioni.
4. Se la copia locale è indietro rispetto a GitHub, sincronizzarla in modo non distruttivo prima di qualsiasi modifica. Se la sincronizzazione richiede merge, rebase o gestione conflitti, fermarsi e chiedere approvazione.

Quando il progetto è ripreso da un altro PC, questi controlli e la sincronizzazione con GitHub sono obbligatori prima di modificare file o avviare strumenti che li generano.

## Decisioni e modifiche

- Non cambiare architettura, modello dati, integrazioni, contratti API o decisioni progettuali senza prima segnalarne chiaramente l'impatto e ottenere approvazione esplicita.
- Limitare le modifiche al task approvato; evitare refactor, aggiornamenti di dipendenze o pulizie non necessari.
- Non sovrascrivere mai modifiche locali non salvate, anche se sembrano obsolete o in errore.
- Conservare codice, test e documentazione tecnica nel repository e mantenerli coerenti con il task.

## Verifica e chiusura del task

1. Eseguire i test e la build appropriati al task (per l'attuale app Next.js, almeno `npm run lint` e `npm run build` quando applicabili).
2. Non dichiarare mai un task completato con test o build falliti. Correggere, oppure segnalare esplicitamente il blocco con l'errore e l'impatto.
3. Prima di ogni commit o push, presentare all'utente: risultato, file modificati, verifiche eseguite e diff/effetto rilevante. Attendere approvazione esplicita.
4. Eseguire commit e push **solo dopo** tale approvazione.

Ogni chiusura di task deve riportare esattamente queste sezioni:

- `TASK`: obiettivo e stato.
- `FILES`: file creati o modificati.
- `TEST`: comandi eseguiti e relativo esito.
- `RESULT`: comportamento o risultato ottenuto.
- `GIT`: branch, working tree, commit/push e stato remoto.
- `NEXT`: prossimo passo proposto oppure blocco che richiede una decisione.
