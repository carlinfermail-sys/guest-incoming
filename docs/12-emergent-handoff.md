# Emergent Handoff — Guest Incoming

Status: integration checkpoint
Rule: do not create a second application branch.

## Source-of-truth model
- GitHub: canonical code/history after integration is confirmed.
- Emergent: AI builder/developer for the application.
- PCLab2: local validation and local-only services.
- Carlos-NBDell: synchronized secondary workstation.

## Current repository reality
This repository currently contains validated technical modules, tests and operational tooling. It must NOT be assumed to contain the current Emergent application source until the Emergent project/repository relationship is verified.

## Validated components ready for integration
### P0 booking safety
- Property Guard contract.
- Unit Guard contract.
- Booking ID Guard / MF3 deploy preparation.
- Isolated reconciliation counters.
- Explicit exception manifest.
- Controlled-test gates.

### Privacy Check-in
- Windows native OCR benchmark.
- Synthetic OCR dataset/harness.
- MRZ parser and check-digit validation.
- Exact ROS1000 field-order contract.
- Holiday-home camereOccupate = 1 validation.
- Human-review requirement.
- Auto-submit disabled.
- Operator-gated pipeline through export-ready and source purge.

## Integration gate in Emergent
Before new application features:
1. Identify the current Emergent project source.
2. Determine whether Emergent is connected to a GitHub repository.
3. Record repository URL and branch if connected.
4. Compare Emergent source with this repository; do not overwrite either side.
5. Decide/import a single canonical history.
6. Only then integrate the validated modules above.

## Do not do before the gate
- Do not regenerate the whole application.
- Do not paste over the current Emergent project.
- Do not assume this repository is already synchronized with Emergent.
- Do not enable ROS1000/Questura automatic submission.
- Do not use real guest identity documents for development tests.
