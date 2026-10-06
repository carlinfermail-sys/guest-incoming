# Guest Incoming — Make MF3 deployment record

Date: 2026-10-05, Europe/Rome.
Scenario: 7380915 — Beds24 - P0 Backfill V2 TEST.
URL: https://eu1.make.com/1503617/scenarios/7380915/edit

## TASK

MF3 Booking ID Guard deployed and semantic read-back verified. Periodic synchronization is NOT certified or activated.

## Authorization and protocol

User authorized the MF3 deployment and subsequently the correction of the four malformed Property/Unit filter groups. Backup precedes deployment. One milestone at a time. No Run Once, no Beds24 write, no schedule activation occurred.

## Changes actually deployed

- Added module 22 (`util:SetVariable2`) as the third terminal route of Booking router 13, below Property Guard 16 and Unit Guard 21.
- Filter `DUPLICATE_BOOKING_ID`: `length(4.body.results) > 1` OR `4.body.has_more = true`.
- Terminal sets `P0_EXCEPTION` with Booking ID, match count and pagination state; it does not create/update bookings.
- Normalized condition arrays on modules 6, 13, 17 and 19 to one AND group each. All condition expressions, operators and values were preserved.
- Preserved CREATE 14, UPDATE 15, positive Booking ID checks, cardinality checks, Property/Unit uniqueness checks, pagination checks and UPDATE `Environment = Testing` restriction.

## Why the original preparation was not deployed unchanged

The repository's `deploy-p0-micro-fix-3.ps1` replaces CREATE/UPDATE filters, removing existing safeguards, and discovers a parent router through a recursive text match that may select an ancestor. That script was NOT executed. A narrowly scoped candidate was prepared instead.

The editor also reported `t.forEach is not a function` when opening the original UNIT_OK filter. Four flat condition arrays were identified. The correction changes grouping representation only, preserving the intended AND logic.

## FILES / evidence

- `Make-7380915-PRE-MF3-fresh.json` — fresh exported backup immediately before deployment.
- `Make-7380915-MF3-guard-format-candidate.json` — actual authorized candidate.
- `Make-7380915-POST-MF3.json` — saved scenario exported after reload.
- `Make-MF3-saved-proof.jpg` — screenshot of the persisted duplicate filter.

SHA-256:

| Evidence | SHA-256 |
|---|---|
| PRE | `067061BAB4A2CAD1C87B860784EDBC2491C801C1B25FC2154461A2805D274E95` |
| Candidate | `F1E770D9855207DE1D6A5998EEF61DD070AEAF5AC5A0990CDD5283D01C86F59F` |
| POST | `CFF954DB9659DD229445C061818628BA9C8E4E01FB116E5E6B773B735E18F122` |

Byte hashes differ because Make serializes exported blueprints differently. Semantic comparison found no differences in module type, version, parameters, filters, mappings or route paths across all 16 modules.

## TEST

- Fresh PRE export equals the earlier baseline: PASS.
- Candidate changes only the new duplicate route and four grouping representations: PASS.
- All filter conditions serialize as arrays of AND groups: PASS.
- Existing local automation-gate, reconciliation, reconciliation-contract, dry-run and exception-manifest tests: 10/10 PASS. These are local contract tests, not proof of live scenario execution.
- Reload confirms persisted duplicate branch and inactive state: PASS.
- Full POST semantic comparison against candidate: PASS, 16 modules.

## RESULT

MF3 deployment/read-back milestone completed. The scenario remains inactive. Stored schedule is still every 15 minutes; it has not been changed to six hours. The Beds24 request remains restricted to test booking ID 91980392. No controlled live run, reconciliation counts or periodic execution certification has been obtained.

## GIT

Local repository observed on `main...origin/main`; existing untracked `scripts/ocr-spike/synthetic-images/` preserved. Fetch failed because the session cannot write `.git/FETCH_HEAD`. Remote synchronization therefore remains unverified. The record was added as docs/13-make-mf3-deployment-2026-10-05.md; git diff --check passed. No commits or pushes were performed.

## NEXT

1. Record published in Notion Architecture & APIs and added to repository docs/13-make-mf3-deployment-2026-10-05.md. Commit/push remain blocked by access to Git internals.
2. Do not run the old MF3 deployer unchanged.
3. Before a live run, confirm the restricted test booking and its existing Notion identity/environment; define expected outcome and reconciliation counters.
4. Verify actual accounting of missing IDs and non-Testing matches; local contract tests do not prove that the live topology accounts for all such cases.
5. Only after all prerequisites pass: one controlled run, read its execution evidence, reconcile with 0 duplicates, 0 unexpected CREATEs, 0 blocking exceptions and no silent drops.
6. Only after that certification may scheduling every six hours be enabled. Do not schedule this single-booking test path as the complete production sync without an explicitly reviewed scope change.


## CONTROLLED RUN — 2026-10-05 19:28 Europe/Rome

User authorized continuation toward the controlled-run milestone. Preflight confirmed Notion page 3d931e5cb8d781dfa212e55874afc674 belongs to data source 6870ccd455634cf3868ba807a2fbc89c and has Environment=Testing. Expected safe outcome: update of the existing test record, no CREATE.

One Run Once executed. Data store module 1 completed; HTTP module 2 failed: Beds24 HTTP 401, Token not valid (InvalidConfigurationError). Execution finalized before the iterator and all Notion modules. Therefore no CREATE/UPDATE or duplicate checks ran. This is a blocking authentication exception; reconciliation and schedule gate FAIL, not a zero-record PASS. Scenario remains Inactive; schedule unchanged.

Existing Beds24 - Token Manager scenario 7326882 found, Inactive. Fresh UI READ shows connected Data store current -> GET authentication/token (mapped refreshToken) -> authentication/details -> bookings -> Set variables; disconnected Data store module 2 is unconfigured. No persistent token write is visible in this topology. Configuration dialogs were cancelled; any editor unsaved state was discarded. No Token Manager execution or saved modification performed.

Next: fresh Token Manager blueprint export, verify token persistence and smallest safe repair, read-back, renew credentials using existing authorized Beds24 access, repeat the controlled test, reconcile, then assess production scope. Keep credentials out of reports and Git. Screenshot: Make-controlled-run-token-error.jpg.
