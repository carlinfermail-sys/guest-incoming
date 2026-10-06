# Token Manager — fresh READ and proposed repair

Date: 2026-10-05 Europe/Rome. Scenario 7326882, Inactive.
Fresh blueprint: 5 connected modules, plus orphan module 2. Data store 184287 key current, same source consumed by backfill 7380915. Schema: accessToken and refreshToken.

READ: PASS for identifying the configuration and exact repair boundary; runtime readiness FAIL.

Confirmed defects:
- authentication/details maps 3.data.accessToken, but Beds24 returns token.
- Set variables accessToken maps the same nonexistent field.
- No data store write persists the renewed token.
- Bookings validation GET is unbounded.
- Orphan module 2 has no data store/key; does not execute.

Proposed minimal repair, awaiting explicit approval:
1. Map authentication/details token header and accessToken variable to 3.data.token.
2. Restrict validation GET bookings to id=91980392.
3. Append data store Update a record for datastore 184287, key current, after successful validations. Set accessToken=3.data.token, preserve refreshToken=1.refreshToken; do not overwrite the record with empty values or create missing records. Require nonempty token and success status before persistence.
4. Leave orphan module untouched and schedule inactive.
5. Read-back saved UI and blueprint; one controlled Token Manager run, then one controlled backfill run, live reconciliation.

No scenario WRITE, renewal run or schedule change performed in this milestone yet. Existing Beds24 scopes unchanged. Do not place credentials in documentation, candidate files or Git.

Primary reference: https://wiki.beds24.com/index.php/Category:API_V2 (refresh response token, expiresIn; refreshToken header).

## DEPLOYMENT AND CONTROLLED TESTS — 2026-10-05

Explicit user approval received for the proposed Token Manager repair and controlled tests.
- Imported candidate correcting module 4 token header, module 6 accessToken variable to 3.data.token and module 5 validation query restricted to booking 91980392.
- Added module 7 Update a record: existing Beds24 Token Manager store, key=current, insert missing record=No; accessToken=3.data.token and refreshToken=1.refreshToken.
- Filter VALIDATED_TOKEN_ONLY: length(3.data.token)>0 AND 4.data.validToken Is true. HTTP validation failures stop the flow before persistence.
- Orphan module 2 preserved unchanged. Both schedules left Inactive; stored frequency still 15 minutes.
- Saved, reloaded and inspected all changed mappings, validation URL, module7 key/no-insert/token mappings and filter: UI read-back PASS. Full POST blueprint export remains pending.

Token Manager run at 19:40: completed, six connected modules each executed once, validation filter passed once and persistence module executed once.
Backfill run at 19:41: completed; booking query results=1, has_more=false; UPDATE PATCH /v1/pages/3d931e5c-b8d7-81df-a212-e55874afc674 returned HTTP200. CREATE route passed0, DUPLICATE_BOOKING_ID0, Property/Unit exception branches0. Reconciliation for this one-booking run: READ1 = CREATED0 + UPDATED1 + EXCEPTIONS0; DUPLICATES0; unexpected CREATE0; blocking exceptions0. This certifies only the restricted Testing scope, not the full production sync or ongoing token lifecycle.

Evidence screenshots: Token-Manager-saved-readback.jpg, Token-Manager-run-success.jpg, Backfill-controlled-run-success.jpg. No credential values stored in this record or candidate.

Next: full saved POST blueprint comparison; review production scope and handling of invalid IDs/non-Testing matches before replacing the test booking restriction and enabling six-hour periodic sync. Token renewal must occur before a periodic sync consumes an expired token; a one-off successful renewal does not establish that dependency.

## FINAL POST BLUEPRINT READ-BACK — PASS

Fresh saved export downloaded at 19:43:39 and compared on 2026-10-05. File: Make-7326882-POST-token-manager.json. SHA256: 939EB7FBEF3568BC4F53E7F43603F2AA35C6EE1E521FEB689FCBE1D5C8AC3A58.
Five existing modules match PRE on module/version/parameters/mapper/filter after applying exactly the three authorized mapping/URL edits. Orphan module 2 unchanged. Sixth connected module 7 is datastore:UpdateRecord, datastore184287/current, upsert=false, overwriteArrays=false, mapped accessToken from3.data.token and preserved refreshToken from1. Filter is precisely one AND group: length(token)>0 and validToken=true.

Token Manager correction milestone complete, including saved semantic POST read-back and successful controlled renewal plus backfill reconciliation. No further user browser interaction is required for this milestone. Production scope, invalid-ID/non-Testing accounting, automatic renewal dependency and six-hour scheduling remain separate pending work. No scheduling activated and no full production sync certification claimed.
