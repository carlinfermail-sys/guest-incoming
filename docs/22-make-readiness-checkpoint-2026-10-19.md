# Make readiness — checkpoint 2026-10-19

## Scope

Stabilize the housekeeping-readiness candidate with minimal Make consumption before any production activation.

## Scenario boundaries

- Production booking sync: scenario `7787277`, preserved and not modified.
- Readiness candidate: scenario `7828962`, inactive and on demand.
- Test data sources:
  - Bookings: `2b623912-6ace-4557-a900-bae8c50b940a`
  - Units: `d31fe8fb-548e-4727-ae87-9e9cf6c05f7f`
  - Housekeeping: `c1714026-20f8-4dcc-8ea0-c9366d4ee37d`

## Implemented and verified

The candidate now reads both `Confirmed` and `Cancelled` synthetic bookings.

Guards:

1. create a housekeeping item only when no matching item exists and booking status is `Confirmed`;
2. mark an existing housekeeping item `Annullata` only when exactly one matching item exists and booking status is `Cancelled`;
3. block the route when more than one matching housekeeping item exists;
4. preserve the no-op path for an existing confirmed item so identical reruns do not overwrite `Pronta`.

Synthetic evidence:

- cancellation with an existing event: PASS, `Stato pulizia` changed to `Annullata`;
- cancellation without an existing event after guard correction: PASS, no housekeeping item created;
- the item created during the first failed guard test was retained as audit evidence and marked `Annullata`;
- no production database or production scenario was executed.

Two controlled Make runs were used. The second run was isolated to one synthetic booking to minimize operations.

## Open production gate

Production activation is intentionally blocked until changed check-out dates are reconciled safely.

The current lookup includes booking identity and check-out date. If the date changes after the first event is created, the workflow can treat the changed booking as new. Before activation, change the reconciliation key to the canonical Beds24 booking identity and update the existing event only when the date differs.

Required behavior:

- same booking + same date: no-op, preserve cleaner state including `Pronta`;
- same booking + changed date: update the existing event date/key and reset operational readiness as explicitly defined;
- cancelled booking + one existing event: mark `Annullata`;
- cancelled booking + no event: no-op;
- more than one event for the booking: block and surface for review.

## Low-consumption activation plan

1. Complete the changed-date branch offline in the inactive candidate.
2. Run one synthetic changed-date test and one idempotent rerun only.
3. Map the candidate to production data sources and run one controlled real booking.
4. Activate on a low-frequency schedule only after evidence is recorded.
5. Monitor the first scheduled execution and then document the final production state.

## Current result

The cancellation and false-create guards are verified. Production activation has not been performed because the changed-date gate is still open.
