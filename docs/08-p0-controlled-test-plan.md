# P0 Controlled Test Plan — Guest Incoming OS

Status: PRE-PRODUCTION PLAN
Scenario: Make 7380915

## Preconditions
All must be true before any controlled execution:
- Fresh READ blueprint obtained from Make.
- Fresh blueprint hash stored.
- Scenario identity confirmed: 7380915.
- Property Guard present and validated.
- Unit Guard present and validated.
- Booking ID Guard (MF3) candidate validated against fresh topology.
- Reconciliation counters available.
- Backup immediately before PATCH.
- Explicit approval for WRITE/PATCH.
- No Beds24 write operations in the test path.

## Gate A — MF3 deployment
1. Scenario must be inactive before PATCH.
2. Apply only Booking ID Guard changes.
3. READ-BACK after PATCH.
4. Verify Property Guard and Unit Guard are unchanged.
5. Verify CREATE cardinality = exactly zero existing Booking ID matches.
6. Verify UPDATE cardinality = exactly one existing Booking ID match.
7. Verify duplicate cardinality (>1 / pagination uncertainty) routes to DUPLICATE_BOOKING_ID and no booking write.
8. Save POST-MF3 blueprint + SHA-256.
9. Do not Run Once merely because PATCH succeeded.

## Gate B — Synthetic/local contract
Required outcomes:
- 0 existing booking matches -> CREATED/WOULD_CREATE.
- 1 existing booking match -> UPDATED/WOULD_UPDATE.
- >1 existing booking matches -> EXCEPTION + DUPLICATE.
- missing Booking ID -> EXCEPTION.
- property 0/>1 -> EXCEPTION.
- unit 0/>1 -> EXCEPTION.
- every input is accounted exactly once.

Invariant:
READ = CREATED + UPDATED + EXCEPTIONS
DUPLICATES <= EXCEPTIONS

## Gate C — Controlled live test
Only after Gate A and B pass.
- Use the smallest possible known-safe input set.
- Capture READ count before evaluating writes.
- Do not broaden the date range during the first controlled test.
- Stop on any unexpected module/topology/result.
- Never repair data automatically during the validation run.

## Gate D — Reconciliation
The run is acceptable only when:
- READ equals CREATED + UPDATED + EXCEPTIONS.
- DUPLICATES is bounded by EXCEPTIONS.
- every exception has a reason.
- no silent drop exists.
- no duplicate Booking ID generated a CREATE/UPDATE.
- no ambiguous property/unit generated a CREATE/UPDATE.

## Rollback trigger
Rollback/review immediately if:
- scenario topology differs from expected fresh READ;
- previous guards disappear or move unexpectedly;
- READ-BACK differs from candidate;
- reconciliation fails;
- any unexpected external write occurs.

## Evidence to retain
- PRE-MF3 blueprint + SHA-256.
- CANDIDATE-MF3 blueprint + SHA-256.
- POST-MF3 blueprint + SHA-256.
- module inventory.
- controlled-test counters.
- exception manifest.
- final reconciliation result.
