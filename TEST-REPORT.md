# ResumeForge v10 verification report

Date: 26 July 2026 (Asia/Kolkata)

## Result

- Automated tests: **6,107 passed, 0 failed** across 5 test files
- Dedicated import integrity matrix: **5,038 passed** (5,000 generated content/mapping cases + 38 format, heading, edge, security, rendering, and integrity checks)
- Dedicated section-movement matrix: **1,027 passed** (1,024 combinations + 3 boundary/drop/sanitization cases)
- Manual QA catalogues: **5,500 authored cases** (5,000 import-focused XLSX + 500 legacy CSV), ready for independent human sign-off
- Production build: **passed**
- Production dependency audit: **0 known vulnerabilities**
- Output: self-contained `dist/index.html`, 6,958,498 bytes
- SHA-256: `80CE7EF679C9F0655BCA561D78526F82F3CA269C0D60175680105BE55083DEF3`
- External scripts in built HTML: **0**
- External stylesheets in built HTML: **0**

## Reported typing defect

Root cause: each input event copied the full editable page into React state, causing React to replace the `contenteditable` HTML and destroy the browser caret/focus after a character.

Fix: the live editable DOM stays stable. Resume analysis is updated after a 250 ms idle pause, and autosave captures the DOM after a 900 ms idle pause without assigning the page back through `innerHTML`.

Regression test: type a complete phrase into the summary, confirm the original focused node remains connected, wait through autosave, confirm the full phrase is stored, then continue typing without another click. **Passed.** The isolated regression duration fell from approximately 24 seconds before input debouncing to under 5 seconds including full app startup and autosave wait.

## Resume upload and section-number request

Section-number fix: numeric markers are removed from the live resume DOM and globally hidden by CSS as a defensive fallback. Headings and the complete content of each section remain intact. A UI regression verifies no numeric marker survives after the editor mounts. **Passed.**

Import implementation: the home page and editor now expose Upload resume. PDF, DOCX, ODT, RTF, HTML, text/Markdown/CSV/JSON, and common image formats are accepted. The review screen reports the extraction method, stable text fingerprint, detected headings, total/accounted lines, and warnings before the user applies anything.

Integrity behavior: import is deterministic and does not call AI. The 5,000-case matrix reconstructs the original extracted source from mapped header/heading/content lines and requires character-for-character equality, equal fingerprints, all lines accounted for, expected section order, and presence of unique source tokens in editable markup. **5,000/5,000 passed.**

Dual fidelity behavior: PDF/image page visuals and safe DOCX-style previews can be kept in Source visual mode. Editable mapping keeps extracted characters verbatim and supports template changes and manual/AI editing. The end-to-end UI test uploads a controlled Banking Operations resume, reviews its mapping, applies it, changes templates, and verifies a unique quantified sentence remains unchanged. **Passed.**

## Section movement defect

Fix: enabled sections can be moved Up/Down or between left/right columns from Content. Every visible section also has page-level arrow controls and a drag handle for exact before/after placement, including cross-column placement. The DOM operation moves the original `<section>` node, so its heading, paragraphs, lists, dates, links, formatting, and other details remain together.

Persistence protection: editor toolbars, drag state, and drop indicators are removed by a shared serializer before autosave, manual save, AI context, page navigation, and export. The UI integration test moves Projects and Skills through customizer controls and page drag/drop, verifies unique details remain attached, saves, and confirms editor-only markup is absent. **Passed.**

## Coverage

| Area | Verified behavior |
|---|---|
| Home and navigation | New resume, saved resumes, 48 grouped template entry points, 60-section overview |
| Editing | Continuous typing, caret retention, idle analysis, autosave persistence, formatting controls |
| Section movement | Customizer arrows, page arrows, exact drag/drop, cross-column moves, boundaries, content integrity, save/export cleanup |
| Resume import | Home/editor upload, format detection, TXT integration, line accounting, fingerprints, heading aliases, deterministic mapping, source/editable modes, template-change retention |
| Import safety | Size/text/page limits, unsupported/legacy format handling, hostile HTML removal, markup escaping, OCR warnings, no-AI import behavior |
| Templates | 40,320 generated designs, 48 groups, pagination, filters, structurally different layouts |
| Documents | Profile photo, page add/navigation/removal, same/different page designs, header/footer, columns, tables |
| Customization | Fonts, font upload, six RGB color controls, 36 list systems, 18 patterns, paper and image controls |
| Storage | Draft persistence, manual saves, home-page listing, resume reopen, session-key non-persistence |
| AI integration | OpenAI, Gemini, compatible/local request contracts; review-before-apply; undo; errors; citations |
| AI safety | Truthfulness instructions, prompt-injection resistance, HTTPS enforcement, HTML escaping, malformed payload rejection |
| ATS | Explainable bounded score, keyword matching/missing terms, complete-vs-incomplete accuracy comparison |
| Exports | PDF, DOCX, PNG, JPG, HTML, TXT, RTF, SVG; multi-page PDF page count |
| Responsive | Desktop, 1150 px, 820 px, 500 px, mobile drawers/dock, and print layout rules |
| Performance | 5,038 import tests completed in 1.182 seconds; 1,027 movement tests completed in 2.637 seconds; complete UI/export regression completed in 94.317 seconds |

## Requested AI career scenarios

Deterministic fixtures passed for:

- Banking / relationship management / KYC / AML / credit
- Trade Finance / SWIFT / UCP 600 / sanctions / export transactions
- Software Testing / Selenium / automation / regression / defects
- Functional Testing / test cases / UAT / Jira / requirements
- Information Technology / infrastructure / Active Directory / networking / incidents
- Cheque Department / CTS / inward and outward clearing / reconciliation
- Experienced-professional resume / operations / leadership / compliance / measurable outcomes

Each scenario checks that supplied facts remain in the structured resume and prompt, safe editable markup is generated, role terminology is present, and ATS keyword coverage is high. The application deliberately instructs AI providers not to invent employers, dates, qualifications, metrics, or credentials.

## Honest limits

- Live OpenAI/Gemini/local-model output was not sent because no user API key or live provider was available. Provider contracts and response handling were tested with deterministic network mocks. Live wording is probabilistic and must be reviewed.
- Export workflows were exercised with controlled rendering/download mocks in the automated UI suite. Visual inspection of downloaded files should still be done for the user's final content, fonts, images, and target viewer.
- No OCR engine can guarantee 100% recognition across arbitrary scans, handwriting, languages, rotations, compression, or damage. ResumeForge preserves the source visual when available and requires verification. Editable reconstruction is not the same guarantee as pixel-identical source rendering.
- DOCX import is semantic, not pixel-identical. Complex Word pagination, floating shapes, fields, and text boxes require a native Word/LibreOffice rendering or conversion service for closer fidelity.
- The desktop app's interactive browser-control connection could not initialize during this run. Automated DOM interaction covered the complete UI workflow, including the exact typing defect, but this report does not mislabel that as a manual browser session.
- The 5,000 import cases in `QA-MANUAL-IMPORT-5000.xlsx` and 500 legacy cases in `QA-MANUAL-500.csv` are authored and ready; they are not falsely marked as executed. Human sign-off across physical devices, sample files, Word/PDF viewers, languages, and OCR conditions remains separate from the 6,107 passing automated checks.
- The ATS score is a local heuristic, not an employer or vendor score and not a guarantee of selection.

## Reproduce

```bash
npm install
npm test
npm run build
npm audit --omit=dev
```
