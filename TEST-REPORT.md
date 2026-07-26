# ResumeForge v13 project-details verification report

Date: 26 July 2026 (Asia/Kolkata)

## Result

- Automated tests: **7,612 passed, 0 failed** across 7 test files
- Dedicated import integrity matrix: **5,038 passed** (5,000 generated content/mapping cases + 38 format, heading, edge, security, rendering, and integrity checks)
- Dedicated section-movement matrix: **1,027 passed** (1,024 combinations + 3 boundary/drop/sanitization cases)
- Dedicated repeatable-section-item coverage: **504 passed** (500-case matrix across all 60 section definitions and ten item structures + 4 focused project cases)
- Dedicated export matrix: **1,000 passed** across every offered format, 40 template families, 25 resume-data profiles, 1-5 pages, and high/ultra quality
- Manual QA catalogues: **5,500 authored cases** (5,000 import-focused XLSX + 500 legacy CSV), ready for independent human sign-off
- Production build: **passed**
- Production dependency audit: **0 known vulnerabilities**
- Output: self-contained `dist/index.html`, 6,976,234 bytes
- SHA-256: `ABE5D532661BED20930AE2CF41D4E982C80DF366F128884728B5C4BA23DB1AB9`
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

## Repeatable section entries

Every section except Summary and Objective now supports add and remove operations. Users can add a complete structured entry from the circular `+` beside a section heading or from the Content library. They can remove one precise entry on the resume or remove the last entry from Content. Experience clones a complete role/employer/date/achievement structure; projects, education, certifications, skills, languages, list items, imported/custom sections, and other structures retain their appropriate editable shape.

Data protection: adding an entry never changes existing entries. Removing an entry targets only that item. Empty sections can be repopulated, editor controls are excluded from saved drafts and every export, and Summary/Objective expose no item controls. The exact 500-case matrix plus component and Chromium workflows passed. The Chromium gate exercised desktop and mobile add/edit/remove, project-detail editing, Content-panel actions, saved-data cleanup, export cleanup, and console monitoring with **28/28 checks and 0 browser errors**.

## Project details request

Existing project rows are migrated in place into complete project entries without changing project names, metadata, or previously written descriptions. Each project exposes **Add project details** beneath its name. The resulting multiline editable area includes roles and responsibilities, duration, skills and technologies, plus an unrestricted line for outcomes, links, client/team context, or any other information. Pressing Enter adds further free-text lines naturally.

New projects receive this full detail structure automatically. Removing a project removes its name, metadata, and all nested details as one unit. Save/export serialization retains the user content and strips every project editor button. Focused unit/integration tests and the desktop/mobile Chromium gate passed; the latter completed **28/28 checks with 0 browser errors** and reopened the exported HTML to verify the custom details were present without editor controls.

## Export fidelity defect

Root cause: the page passed to `html-to-image` was itself positioned at `left: -10000px`. That root positioning was copied into the snapshot SVG, so the correctly sized canvas contained a page located outside its viewport. PDF and image files were therefore valid containers with blank page pixels. The previous Word exporter separately flattened `innerText`, which necessarily discarded template CSS, columns, spacing, colors, imagery, and alignment.

Fix: the off-screen position now belongs to a wrapper that is never captured; the captured resume page remains at `(0,0)`. Export waits for fonts and images, resets all root positioning in the snapshot options, and rejects content-bearing pages whose sampled pixels are visually blank. PDF, exact Word, PNG, JPG, and SVG now use the same validated high/ultra raster pages. HTML uses the same markup, classes, CSS, page geometry, and per-page design variables.

Word behavior: **Word (exact)** embeds each validated high/ultra resume page as a full-page image in a matching Word section, preserving the visual design. **Word (editable)** remains available as a separately labelled semantic document because arbitrary browser CSS cannot be both pixel-identical and natively editable in Word. TXT and RTF are likewise labelled content/ATS formats rather than exact-visual formats.

Real-browser artifact gate: headless Chromium downloaded all nine choices plus one/two-page PDF and exact Word files and PNGs from Style, Industry, and Global template families. One-page PNG/JPG output was 3176 x 4492 at Ultra. Poppler reopened the generated PDF as one A4 page and the multi-page PDF as two A4 pages; all three rendered pages were visually inspected and contained the expected aligned resume design. The PDF render versus source PNG mean absolute pixel error was **1.660/255** after resolution normalization. Exact Word packages contained one/two sections and one/two nonblank 3176 x 4492 embedded page images respectively. Browser console/page errors: **0** (excluding the preview server's benign missing-favicon 404).

## Coverage

| Area | Verified behavior |
|---|---|
| Home and navigation | New resume, saved resumes, 48 grouped template entry points, 60-section overview |
| Editing | Continuous typing, caret retention, idle analysis, autosave persistence, formatting controls |
| Section movement | Customizer arrows, page arrows, exact drag/drop, cross-column moves, boundaries, content integrity, save/export cleanup |
| Section entries | Add/remove on page and in Content, jobs, skills, structured/generic/list items, empty recovery, Summary/Objective exclusions, persistence cleanup |
| Project details | Lossless row migration, roles/responsibilities, duration, skills/technologies, unrestricted multiline text, complete add/remove, save/export cleanup |
| Resume import | Home/editor upload, format detection, TXT integration, line accounting, fingerprints, heading aliases, deterministic mapping, source/editable modes, template-change retention |
| Import safety | Size/text/page limits, unsupported/legacy format handling, hostile HTML removal, markup escaping, OCR warnings, no-AI import behavior |
| Templates | 40,320 generated designs, 48 groups, pagination, filters, structurally different layouts |
| Documents | Profile photo, page add/navigation/removal, same/different page designs, header/footer, columns, tables |
| Customization | Fonts, font upload, six RGB color controls, 36 list systems, 18 patterns, paper and image controls |
| Storage | Draft persistence, manual saves, home-page listing, resume reopen, session-key non-persistence |
| AI integration | OpenAI, Gemini, compatible/local request contracts; review-before-apply; undo; errors; citations |
| AI safety | Truthfulness instructions, prompt-injection resistance, HTTPS enforcement, HTML escaping, malformed payload rejection |
| ATS | Explainable bounded score, keyword matching/missing terms, complete-vs-incomplete accuracy comparison |
| Exports | Exact PDF/Word/PNG/JPG/HTML/SVG; editable Word/TXT/RTF; nonblank pixel gate; multi-page PDF/Word; multi-page image ZIP |
| Responsive | Desktop, 1150 px, 820 px, 500 px, mobile drawers/dock, and print layout rules |
| Performance | Complete 7,612-test regression completed in 279.32 seconds on the local Windows host; real-browser 14-artifact export run completed in 79.2 seconds; 28-check item/project browser gate completed in 9.3 seconds |

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
- Automated UI mocks are supplemented by real Chromium downloads, Poppler PDF rendering, image variance checks, PDF-to-PNG comparison, and DOCX package/image inspection. Final user-specific files should still be reviewed when they use unusual licensed fonts or remote images.
- No OCR engine can guarantee 100% recognition across arbitrary scans, handwriting, languages, rotations, compression, or damage. ResumeForge preserves the source visual when available and requires verification. Editable reconstruction is not the same guarantee as pixel-identical source rendering.
- DOCX import is semantic, not pixel-identical. Complex Word pagination, floating shapes, fields, and text boxes require a native Word/LibreOffice rendering or conversion service for closer fidelity.
- The desktop app's interactive browser-control connection could not initialize during this run. A real headless Chromium session completed the download/artifact gate; this report does not mislabel that automation as a human manual session.
- The 5,000 import cases in `QA-MANUAL-IMPORT-5000.xlsx` and 500 legacy cases in `QA-MANUAL-500.csv` are authored and ready; they are not falsely marked as executed. Human sign-off across physical devices, sample files, Word/PDF viewers, languages, and OCR conditions remains separate from the 7,612 passing automated checks.
- The ATS score is a local heuristic, not an employer or vendor score and not a guarantee of selection.

## Reproduce

```bash
npm install
npm test
npm run build
npm audit --omit=dev
```
