# Make cadence and cleaning operations checkpoint — 2026-10-11

This checkpoint records the agreed Make polling cadence and the cleaner-facing Notion readiness changes verified on 2026-10-11. It complements the production-sync evidence in [18](18-production-sync-activation-2026-10-05.md) and the operational-view audit in [20](20-notion-operational-views-2026-10-07.md).

## Beds24 → Make → Notion cadence

### Decision

- Start with a scheduled check every **6 hours**.
- An hourly check is a reasonable later option after the synchronization has remained correct and stable; it is not the initial cadence.
- Do not change the schedule or trigger a Make run as part of this documentation checkpoint.

### Consumption estimate

For a 30-day month, a six-hour schedule means about **120 scheduled checks** (4/day × 30). An hourly schedule means about **720 scheduled checks** (24/day × 30). These are estimates for the scheduled trigger checks only, not a guaranteed total credit bill: processing bundles and downstream modules can add consumption. Make documents that more frequent polling increases trigger consumption and that filters can stop bundles before downstream processing.

References:
- [Make: schedule a scenario](https://help.make.com/step-10-schedule-your-scenario)
- [Make: credits](https://help.make.com/credits)
- [Make: add a filter](https://help.make.com/step-4-add-a-filter)

Keep the six-hour cadence while the flow is being observed. Consider hourly only after controlled runs and reconciliation remain clean, with no unexpected CREATEs, duplicates, or blocking exceptions. Put filters and duplicate guards before expensive or write-capable modules. Do not use repeated production runs as a substitute for diagnosis.

## Scenario state and evidence boundary

- The production-sync evidence in [18](18-production-sync-activation-2026-10-05.md) records scenario **7787277** as Active every six hours and seven scheduled successful runs through 2026-10-07; the latest documented run reconciled with zero CREATEs, exceptions, or duplicates and one UPDATE.
- A separate candidate/test scenario **7828962** had previously been reported inactive/on-demand.
- On 2026-10-11, Make presented the sign-in page. Neither scenario's current live state nor later execution history was rechecked in this checkpoint. No Make scenario was run or changed on 2026-10-11.
- Therefore, the last recorded production state is the six-hour schedule in the 2026-10-07 evidence; it is not a fresh verification of the present state.

## Cleaner-facing Notion operations

Verified on 2026-10-11:

- The saved view **Incarichi assegnati — governanti** now displays the fields needed to operate an assignment: Incarico, Data pulizia, Struttura, Unità, Ospite, Ditta / governante, Referente pulizia, Stato pulizia, presa-in-carico operator/time, completion operator/time, Carlos final verification/time, and Note operative.
- Existing view filters and sorting were preserved. The registry remains separate from Bookings/Stays and contains no financial amounts or commissions.
- Doina is shown with **Accesso completo** on this cleaner-only registry. Andrea was not separately invited; the pilot order remains Doina first.
- The workflow instruction on the registry remains: Carlos assigns the cleaner; the cleaner records In corso and Pulizia completata with operator/time; only after Carlos's final check is the unit marked Pronta.
- The operational view was empty at verification time. The only registry record was a historical cleaning already completed and checked. A Notion booking row for a 2026-10-12 checkout remained Pending and had no cleaning vendor; it was not converted into a task because the checkout still requires verification in Beds24.
- The Notion access and view were verified, but Doina's hands-on operation from her own account was not tested.

## Operational interim procedure

Until the booking source confirms a checkout, create no cleaning assignment from an unverified/pending booking. After a verified checkout, create one assignment manually, deduplicated by booking ID plus checkout date, then assign it to the cleaner. Make automation is not needed for the cleaner pilot and should not be run merely to make the view non-empty.

## Git and change record

This is a local documentation checkpoint only. No application code, Notion data, permissions, or Make scenario settings were changed by writing this file. No commit or push was performed.
