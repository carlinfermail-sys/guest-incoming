# Local OCR CPU Spike — PCLab2

Date: 2026-10-05
Status: DESIGN / NO REAL GUEST DOCUMENTS

## Decision
Do not attempt to run Baidu Unlimited-OCR upstream on PCLab2 unchanged.
PCLab2 has no NVIDIA/CUDA and no Python runtime; the existing local audit already records this constraint.

Keep Unlimited-OCR as a research/reference branch with localhost-only binding (127.0.0.1).

## P0 OCR objective
The operational target is narrower than generic vision OCR:

image/scan -> local OCR -> MRZ / structured field extraction -> human verification -> ROS1000-ready ordered data -> deletion of source document according to retention policy.

No automatic Questura/ROS1000 submission is authorized in this spike.

## Candidate A — Tesseract 5
Advantages:
- CPU-native and mature.
- Command-line integration; Python is not required for the OCR engine.
- Broad language support.
- Suitable as a lightweight baseline on old x86 hardware.

Risks / validation:
- Windows current binaries are third-party builds; verify source/hash before installation.
- Accuracy on photographed IDs and MRZ must be benchmarked.
- Pre-processing may materially affect accuracy.

## Candidate B — PaddleOCR CPU packaged runtime
Advantages:
- Local CPU inference is feasible in packaged Windows builds.
- Potentially stronger detection/recognition on photographed documents.

Risks / validation:
- Heavier runtime than Tesseract.
- Third-party packaging must be audited before execution.
- Benchmark memory/latency on i3-4150 before adoption.

## Synthetic benchmark contract
Never use a real guest identity document during the spike.

Dataset:
1. Synthetic passport-like page with two ICAO-style MRZ lines.
2. Synthetic EU-ID-like card with name, surname, DOB, document number, nationality, expiry.
3. Rotated/noisy synthetic photo.
4. Low-contrast synthetic photo.

Measure:
- exact MRZ character accuracy;
- field extraction accuracy;
- latency;
- peak memory;
- offline/network behavior.

Acceptance:
- no outbound network dependency during recognition;
- human review remains mandatory;
- raw image is not retained by the workflow after the operator-approved lifecycle;
- OCR confidence/uncertain fields are surfaced, never silently guessed.

## Next safe action
Prepare synthetic test images and a parser/test harness independent of the OCR engine.
Installing an OCR runtime is a separate reversible change and should occur only after package provenance is selected.
