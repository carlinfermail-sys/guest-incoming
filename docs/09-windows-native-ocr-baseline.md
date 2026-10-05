# Windows Native OCR Baseline — PCLab2

Date: 2026-10-05
Status: DISCOVERED / BENCHMARK REQUIRED

## Discovery
PCLab2 Windows 10 exposes the WinRT type:
Windows.Media.Ocr.OcrEngine

TryCreateFromUserProfileLanguages() succeeds.

Available recognizer languages observed locally:
- en-US
- es-ES
- es-MX
- it-IT

## Architectural consequence
Benchmark Windows native OCR before installing a third-party OCR runtime.

Priority:
1. Windows.Media.Ocr baseline.
2. Tesseract 5 only if native OCR is insufficient.
3. Heavier CPU OCR only if both fail acceptance criteria.

## Privacy boundary
Recognition must remain local.
No guest document may be used for development benchmarking.
Use synthetic images only until the workflow and deletion lifecycle are approved.

## Acceptance criteria
- OCR callable locally without network dependency.
- MRZ output can be validated by ICAO check digits.
- uncertain/invalid fields must require human review.
- no silent guessing.
- acceptable latency on PCLab2.
