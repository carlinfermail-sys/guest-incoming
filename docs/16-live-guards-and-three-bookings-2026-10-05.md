# James — live guard matrix and bounded READ preflight

Checkpoint 2026-10-05. This supplements the earlier deployment records. Production readiness is NOT complete.

## Live synthetic guard matrix

Make scenario 7786520, Guest Incoming - James guard matrix, run 20:06 completed successfully. The actual saved P0 filter conditions were used with synthetic fixtures and mocked lookup/write modules. No external API or booking writes exist in this harness.

16 input cases reconcile to 16 terminal outcomes: 1 WOULD_CREATE, 1 WOULD_UPDATE, 14 EXCEPTION. Expected duplicate exceptions: 2. Invalid ID: 3; retained ambiguous legacy: 1; disallowed environment: 2; Property not found: 1; Property ambiguous/paginated: 2; Unit not found: 1; Unit ambiguous/paginated: 2. Observed route counts match these expectations. These are live Make engine guard tests, not real CREATE/UPDATE acceptance tests.

## Three real bookings, READ ONLY

Make scenario 7786573, Guest Incoming - James 3 BOOKINGS PREFLIGHT - READ ONLY, run 20:09 completed successfully. Source URL restricted to IDs 91980392, 92792612, 91916738. Data store READ, Beds24 GET, Notion lookup queries only. Booking writes replaced by local mock variables.

All three had exactly one Booking, one Property and one Unit match. Terminal module32 succeeded three times. READ3 = WOULD_CREATE0 + WOULD_UPDATE3 + EXCEPTIONS0; DUPLICATES0. UPDATED_DELTA here denotes a proposed update, NOT a performed booking write.

| Booking ID | Beds24 status | Arrival | Departure | Notion environment | Notion Stay Status | Proposed action |
| --- | --- | --- | --- | --- | --- | --- |
| 92792612 | new | 2026-09-25 | 2026-09-28 | Production | In Stay | WOULD_UPDATE |
| 91980392 | new | 2026-09-07 | 2026-09-13 | Testing | empty | WOULD_UPDATE |
| 91916738 | cancelled | 2026-09-19 | 2026-09-21 | Production | empty | WOULD_UPDATE |

Important unresolved decision: Isabelle's populated In Stay conflicts with an elapsed departure date. Existing documented contract preserves explicit operational overrides but has no implemented marker distinguishing overrides from stale legacy values. Asked user whether to preserve populated states and report conflicts, or authorize automatic status recalculation. Do not infer an answer or overwrite Production states while pending.

## Remaining production gates

- Preserve Environment, human notes, workflow assignments and explicit operational decisions on UPDATE.
- Implement agreed raw/normalized/operational status contract, including controlled cancellation test.
- Prove real bounded CREATE then rerun UPDATE idempotency and multi-booking reconciliation; synthetic mock outcomes do not establish this.
- Establish bounded periodic source scope, automatic outcome aggregation and valid-token dependency.
- Only after all production gates PASS, schedule every six hours. Existing backfill and new test scenarios remain Inactive; stored15-minute scheduling is not activation.

Git: main; cached origin comparison0 ahead/0 behind. Fresh fetch failed because .git/FETCH_HEAD is not writable. Documents13–16 local only; no commit/push. Pre-existing OCR synthetic images remain untouched.

## Recommended status rule and concrete bounded candidate

The user requested a recommendation rather than choosing a policy. Recommended populated operational states remain intact; empty states receive source/date baseline. Offline candidate Make-James-three-bookings-controlled-update-candidate.json is prepared and validated structurally, NOT imported or run. IDs restricted to91980392/92792612/91916738. Only existing-record PATCH module15 remains; CREATE replaced by accountable UNEXPECTED_CREATE_IN_BOUNDED_UPDATE exception. Environment and Notes omitted from PATCH, other workflow fields not written. Empty baseline uses Europe/Rome date, source cancellation Cancelled, past departure Completed, future arrival Preparing, otherwise In Stay. Runtime mapping/payload validation pending. Explicit confirmation requested for this status rule and bounded test under repository contract-change rule. No six-hour activation.
