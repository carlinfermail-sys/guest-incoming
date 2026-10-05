# Windows Native OCR Benchmark — PCLab2

Date: 2026-10-05
Dataset: synthetic only; no real guest documents.

## Environment
Windows 10 native WinRT Windows.Media.Ocr.
User-profile OCR engine available.
No third-party OCR runtime installed.

## Results
- eu-id-clean: ~329 ms. Name, DOB, nationality and expiry recognized. Synthetic document number CA00000AA was read as CAOOOOOAA (zero/O ambiguity).
- td3-clean: ~277 ms. Human-readable name fields recognized; both MRZ lines were omitted.
- td3-low-contrast: ~329 ms. Human-readable name fields recognized; MRZ omitted.
- td3-rotated (+7 degrees): ~338 ms. Human-readable name fields recognized; MRZ omitted.

## Finding
Windows native OCR is fast enough on PCLab2 and useful as a first-pass field OCR, but it does not meet the MRZ acceptance requirement in this synthetic baseline.

It must not be used alone to auto-accept identity-document data.

## Architecture decision
Use Windows OCR only as an optional first-pass/helper.
MRZ requires a dedicated OCR strategy plus ICAO check-digit validation.
Human review remains mandatory.
Tesseract/MRZ-specific benchmarking is now justified, but installation provenance must be approved before adding a third-party binary.
