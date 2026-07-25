# ResumeForge import accuracy and fidelity

ResumeForge v10 uses a lossless-first, review-before-edit workflow. It keeps the captured source pages when the browser can render them, stores the extracted text without asking AI to rewrite it, creates a stable text fingerprint, accounts for every extracted line, and then maps recognized headings into editable sections.

## Two different guarantees

1. **Source visual mode** preserves rendered PDF pages and uploaded images as page images. This is the highest-fidelity view of the uploaded source that a browser-only application can provide.
2. **Editable mapping mode** keeps the extracted characters verbatim and places them into editable resume sections. A user can change templates, sections, typography, and content. It is an editable reconstruction, not a claim of pixel-identical layout.

For DOCX, ResumeForge uses Mammoth's semantic text/HTML conversion. Mammoth deliberately converts document structure to clean HTML and does not reproduce complex Word styling exactly. See the official project documentation: https://github.com/mwilliamson/mammoth.js/

For PDF, ResumeForge uses PDF.js to read text items and render page canvases. See the official examples: https://mozilla.github.io/pdf.js/examples/index.html

For image and scanned-PDF OCR, ResumeForge uses Tesseract.js. OCR quality depends on scan resolution, rotation, contrast, language, font, columns, and source quality. The Tesseract.js project also states that it does not support PDFs directly, which is why ResumeForge renders PDF pages before OCR: https://github.com/naptha/tesseract.js/

## Integrity controls

- Import does not call the AI provider and does not rewrite personal facts.
- Extracted text receives a deterministic fingerprint in the form `rf-<hash>-<length>`.
- The review screen reports total lines, accounted lines, recognized headings, extraction method, and warnings.
- Recognized headings are mapped through documented aliases; unrecognized material is retained in a fallback section.
- HTML previews are sanitized. Scripts, forms, frames, embedded objects, event handlers, and unsafe attributes are removed.
- Unsupported, oversized, malformed, and legacy `.doc` input receives an actionable error instead of a silent conversion.
- Imported content remains editable after the user explicitly chooses Editable mapping.
- Source visual and editable modes can be switched without using AI.

## Supported browser import formats

PDF, DOCX, ODT, RTF, HTML/HTM, TXT, Markdown, CSV, JSON, PNG, JPG/JPEG, WebP, BMP, GIF, and TIFF are accepted. Legacy binary `.doc` files must first be saved as DOCX or PDF in Word or LibreOffice. The browser build limits a file to 30 MB, extracted text to 1,000,000 characters, and a PDF import to 25 pages at a time.

## Important limitations

- No OCR engine can honestly guarantee 100% recognition across every scan, handwriting sample, language, font, rotation, compression level, or damaged file. Every OCR result must be compared with Source visual.
- Pixel-identical editable conversion from arbitrary PDF/image/DOCX files is not generally possible because visual placement and editable document structure are different representations.
- Source visual mode preserves appearance but is not structurally editable. Editable mapping preserves extracted text but may not retain every visual placement detail.
- DOCX source-style preview is semantic. A native Word or LibreOffice rendering/conversion service is required for closer Word pagination fidelity.
- The portable app stores resumes in browser storage. Large source-page images can exceed a browser's quota; export a copy or use the editable mapping for durable browser-local saving.
- Live AI output and live OCR are probabilistic/external-runtime operations. They require human review and, where applicable, an internet connection or configured provider.

## Release evidence

The repository contains a 5,000-case automated import mapping/integrity matrix and a 5,000-case authored manual QA workbook. The manual workbook is intentionally marked **not executed — ready for manual QA**. It is a professional execution catalogue, not a false claim that 5,000 human checks were completed automatically.
