# Housekeeping production promotion plan — 2026-10-19

## Outcome

Promote the verified housekeeping-readiness logic without changing or replacing the existing Beds24 booking synchronization.

## Boundaries

- Existing production booking sync: scenario `7787277`; preserve unchanged.
- Verified readiness candidate: scenario `7828962`; keep inactive and on demand.
- Promotion target: a separate Housekeeping Production scenario derived from the candidate.
- No activation, scheduling, production mapping, or production run is authorized by this plan.

## Evidence already verified in TEST

The candidate passed the following synthetic cases:

1. create one housekeeping item for a confirmed booking with no existing event;
2. mark the single existing item `Annullata` for a cancelled booking;
3. do not create an item for a cancellation without an existing event;
4. update the same event when checkout changes;
5. preserve `Pronta` on an identical rerun;
6. block all writes when more than one housekeeping item matches the booking.

The final reconciliation used two manual runs. Production scenario `7787277` was not modified or executed.

## Real-booking eligibility gate

A booking can be used for the single controlled production test only if all conditions pass:

- Beds24 source status is `confirmed`;
- checkout is operationally imminent;
- Bookings/Stays Production contains exactly one row for the Beds24 Booking ID;
- the Beds24 room resolves to exactly one production Unit;
- Housekeeping contains zero or one row for the Booking ID, never more than one;
- no cleaner has started or completed work for the booking;
- the pre-run snapshot is complete.

The future booking observed during planning, Beds24 ID `89355870` with checkout `2027-04-25`, is `new/Pending` and is explicitly ineligible.

## Zero-run preparation

1. Save an immutable export/hash of candidate `7828962`.
2. Create a separate Housekeeping Production scenario and leave it inactive/on demand.
3. Replace only the TEST Bookings, Units, and Housekeeping data-source identifiers with verified production identifiers.
4. Temporarily restrict the source query to the one approved Beds24 Booking ID.
5. Re-open and read every write-capable module to verify destination and mapped fields.
6. Capture the pre-run snapshot:
   - booking row and canonical Beds24 ID;
   - resolved Unit row and readiness state;
   - all matching Housekeeping rows;
   - scenario state, filter rules, and credit balance.
7. Present the selected booking, expected writes, estimate, and rollback for explicit authorization.

## Single controlled run

- Run the separate inactive scenario once manually.
- Do not activate scheduling.
- Expected Make cost: approximately 12–15 credits based on observed TEST executions.
- Hard test budget: 20 credits. Stop and investigate if the run exceeds this bound.
- Immediately reconcile booking identity, event cardinality, checkout date, Housekeeping state, Unit state, exceptions, and actual credit use.

## Rollback

1. Keep or return the new Housekeeping scenario to inactive.
2. Do not alter scenario `7787277`.
3. Restore only the affected Unit and Housekeeping values from the pre-run snapshot when no human operational activity has started.
4. If a cleaner has started work, do not overwrite their updates; stop and reconcile manually.
5. Never delete production records automatically. Preserve evidence and record the exception.

## Promotion decision after the run

Scheduling remains a separate approval gate. If the controlled run passes, start with the lowest practical cadence, monitor the first scheduled execution, and document actual consumption before considering any increase in frequency.

## Current status

Plan prepared. No production scenario, data-source mapping, run, activation, or schedule change was performed.
