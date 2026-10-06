# Next James micro-task — repeatability before production

2026-10-05. Candidate ONLY, not deployed. Source: saved POST-MF3 export; no subsequent saved backfill changes in this session.

Evidence reviewed: Notion Sync Specification; BACKFILL V2 execution contract; P0 Repeatability + Status Contract. Operational database source 6870ccd455634cf3868ba807a2fbc89c. Isabelle92792612 is Production; BookingStatus In stay and StayStatus In Stay, checkout2026-09-28. Source status new. Do not claim the single Testing run updated Isabelle or completed her operational workflow.

Candidate Make-7380915-repeatability-candidate.json:
- After iterator3, classify missing/nonpositive numeric BookingID as INVALID_BOOKING_ID before querying Notion.
- Exclude retained legacy ambiguity91550809 as AMBIGUOUS_LEGACY_MATCH before writes.
- Move existing valid-ID gate before booking query4, rather than silently dropping after query4.
- Add explicit ENVIRONMENT_NOT_TESTING outcome for one existing match with a non-Testing/empty environment; existing UPDATE Testing guard stays intact.
- Add a terminal outcome module after every successful CREATE/UPDATE and every exception: BookingID, primary outcome/reason and READ/CREATED/UPDATED/EXCEPTIONS/DUPLICATES deltas.
- Preserve existing Property/Unit/MF3 guards, write payloads and restricted Beds24 URL. No production writes, new data store or scheduling in this micro-task.

Validation: candidate generator asserts ten explicit terminal outcomes, unchanged existing write payloads and guards. Result PASS at static candidate level, NOT runtime certification. Invalid source IDs are assumed numeric or missing; malformed API responses must stop globally. Terminal deltas support execution-history reconciliation, but do not implement automatic cross-route aggregate totals yet.

Separate pending production tasks: aggregate/reconcile execution outcomes; cover source statuses and cancellation; preserve Environment and user notes on UPDATE; enable controlled Production updates and CREATE Production only after preflight; implement StayStatus baseline without overwriting explicit overrides; connect periodic valid-token dependency; bounded second/multi-booking tests before full scope and six-hour activation.

WRITE approval required for this exact candidate by user's fresh READ/review rule. After approval: fresh saved UI check, import, save/reload, read-back, affected controlled tests. No historical backfill.

## Deployment checkpoint

User confirmed the concrete micro-correction. Candidate imported into scenario7380915 and saved; reload confirms Inactive state, restricted schedule unchanged and new route labels persisted. Valid-ID/not-legacy filter and legacy numeric filter directly inspected. Canvas elements overlap, so label clicks for some filters opened neighboring dialogs; those dialogs were cancelled without saved changes. Full POST semantic export comparison is required before any new controlled run. No new run executed after this micro-deploy. Run-with-existing-data chooser was inspected and closed without execution.

Milestone status: deployed, full read-back pending; runtime tests pending. Do not mark complete or schedule. Next needed UI action is Export blueprint in tab2 for saved7380915; export menu left open.

## FINAL READ-BACK AND TEST CHECKPOINT — 2026-10-05

Correct saved backfill export received at19:58:02, file Beds24 - P0 Backfill V2 TEST.blueprint (3).json, copied as Make-7380915-POST-repeatability.json. SHA256895BEB4B179CD26782622DD27500EA9670C3581E85A4E4DE99C1E26B92F1BCF5.
Complete semantic comparison PASS: all30 modules, version/parameters/mapper/filter and route ancestry match the authorized candidate.
Controlled live run at19:59 completed successfully. Terminal outcome module32 executed once and returned P0_BOOKING_ID91980392, P0_OUTCOME UPDATED, READ_DELTA1, CREATED_DELTA0, UPDATED_DELTA1, EXCEPTIONS_DELTA0, DUPLICATES_DELTA0. CREATE and exception routes passed0. Reconciliation1=0+1+0. Scenario Inactive, schedule still stored15minutes; not activated.
Local evaluation of actual saved filters:16/16 cases PASS, each exactly one primary outcome (create/update, missing/zero/negative ID, retained legacy, Production/empty environment, duplicate/pagination, Property and Unit0/>1/pagination). These are local tests, NOT live exception-path tests. Unknown/non-numeric source IDs and malformed API contract remain outside this numeric-ID test matrix.

RESULT: authorized micro-deploy, full POST read-back, live normal-path test and local affected-guard matrix complete. Broader repeatability acceptance remains incomplete: live exception-path matrix, aggregation of per-record deltas, status/cancellation contract, bounded multi-booking and production safeguards are still required. No production writes or scheduling authorized/executed in this micro-task.
GIT: local docs update only; no commit/push; remote sync remains unverified from earlier FETCH_HEAD permission failure.
