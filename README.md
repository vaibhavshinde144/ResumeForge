# ResumeForge

ResumeForge is a responsive professional resume studio with a home dashboard, Word-style formatting, 40,320 templates grouped into 48 structurally distinct resume types, multi-page editing, saved drafts, review-first AI assistance, an explainable ATS preflight, and high-quality export tools.

## Run locally

```bash
npm install
npm run dev
```

Open the local URL printed by Vite. Use `npm run build` to create a production bundle in `dist/`. The production `dist/index.html` is a self-contained single-file application that can also be opened directly by double-clicking it.

## Included

- 48 grouped template types across five collections: core formats, professional styles, industries, global CV conventions, and specialist/storytelling resumes
- 840 original templates in every type, for 40,320 templates total
- Distinct ATS, chronological, functional, hybrid, compact, academic, portrait-rail, photo-banner, color-block, infographic, geometric, industry, and regional architectures
- Fast collection filters, grouped type selector, search, photo/ATS filters, and progressive 18-card catalogue paging
- Live inline editing with exact font size, bold, italic, underline, strikethrough, superscript, subscript, color, highlight, alignment, lists, indentation, links, unlinking, clear formatting, and images
- Stable continuous typing with caret-safe, idle-debounced ATS analysis and focus-preserving autosave
- Whole-section movement: Up/Down/Left/Right controls in Content, direct on-page controls, and drag-and-drop anywhere; headings and all section details move atomically
- Repeatable entries in every section except Summary and Objective: add complete jobs, qualifications, projects, credentials, skills, languages, awards, custom details, and more; remove individual entries on the page or the last entry from Content
- Expandable project records: preserve the project name and headline metadata, then add multiline roles/responsibilities, duration, skills/technologies, outcomes, links, client/team context, and unrestricted free text beneath that project
- Lossless-first resume upload for PDF, DOCX, ODT, RTF, HTML, text, Markdown, CSV, JSON, and common image formats
- Import review with extraction method, recognized sections, line-accounting, source fingerprint, warnings, and explicit Apply action
- Dual imported-resume modes: preserved PDF/image source visual and verbatim-text editable mapping with template switching
- Deterministic section mapping that never calls AI or rewrites facts during import; OCR uncertainty is disclosed for human verification
- Numeric section badges removed from every resume template while section headings and their complete content remain intact
- A curated system-font catalogue plus any installed font name and licensed TTF, OTF, WOFF, or WOFF2 upload, supporting more than 100,000 available font files without bundling unlicensed fonts
- Six independent hexadecimal color channels; every picker supports all 16,777,216 RGB colors
- 36 bullet, numbering, and multilevel systems; 18 professional background pattern systems
- Body and heading fonts, exact base size, heading scale, weight, line height, letter spacing, word spacing, paragraph spacing, alignment, and LTR/RTL controls
- Attach, replace, or hide a profile photo on every photo-enabled template; the starter portrait is embedded for reliable offline use
- Add continuation pages, same-design blank pages, or independently designed blank pages; navigate and remove pages, with all pages included in exports
- A4, US Letter, Legal, A5, and Executive page formats
- Working document controls for page breaks, running headers and footers, one-to-three-column layouts, and editable tables
- Image width, profile-photo size, wrap left/right/inline/full-width, corner radius, border, brightness, and contrast
- Design, page-scope, layout, typography, section-visibility, and content-reference controls
- 60 independently controlled sections, including all 21 sections supplied in `section-when-to-include-key-benefit-21.csv`
- A searchable, source-linked resume research library
- Complete-resume AI generation from verified user facts, with a preview and explicit Apply action
- AI section writing for all 60 sections, grammar and clarity correction, professional suggestions, and resume-aware career Q&A
- ResumeForge Free AI is the default: an on-device Professional Career Engine 2.0 with deep evidence-preserving rewriting, 20 career-domain knowledge packs, and no account, API key, billing, usage quota, or network request
- OpenAI Responses API, Google Gemini, and configurable OpenAI-compatible/local provider connections
- Optional OpenAI web search or Gemini Google Search grounding with source links
- Session-only API keys that are never stored in resumes, browser storage, exports, or source code
- Automatic local ATS preflight with contact, section, evidence, readability, structure, and job-keyword breakdowns
- Truthfulness and prompt-injection safeguards that instruct providers not to invent personal history or obey instructions embedded in pasted content
- Browser-local drafts and a saved-resume library
- Exact-visual PDF, Word, PNG, JPG, HTML, and SVG exports generated from one validated page render
- Separate editable Word, TXT, and RTF exports for content workflows where the file standard cannot preserve arbitrary browser CSS pixel-for-pixel
- Ultra 4x raster quality, nonblank output validation, multi-page PDF/Word, and ZIP packaging for multi-page PNG/JPG
- Desktop, tablet, and mobile layouts

## Testing

Run `npm test` for the 7,647-test automated suite. It includes a 5,000-case import integrity/mapping matrix, a 1,024-case combinatorial section-movement matrix, a 1,000-case export matrix, an exact 500-case repeatable-section-item matrix, four focused project migration/detail cases, 34 focused free-AI cases, boundary and security tests, and full UI integration tests. Free-AI coverage verifies substantive rewriting of short prompts, complete-resume generation, weak-responsibility improvement, summaries/objectives, tone control, grammar, professional review, all 20 career knowledge domains, context prioritisation, cancellation, no-key operation, review-before-apply, and zero paid-provider calls. Project coverage verifies text-preserving migration, existing-description retention, structured and unrestricted multiline details, complete project add/remove, save cleanup, and export retention. The export matrix rotates through every offered format, 40 template families, 25 resume-data profiles, one-to-five-page documents, and high/ultra quality. The suite also covers the upload/review/apply/template-change workflow, source fingerprints, line accounting, the home/editor workflow, continuous typing through autosave, templates, document controls, photos, multi-page behavior, customization, saved resumes, every export pipeline, AI review/apply/undo, provider request formats, credential and endpoint failures, injection escaping, long-input bounds, ATS accuracy and score limits, responsive CSS, and a repeated local performance workload.

`scripts/export-smoke.mjs` is the real-browser artifact gate. It downloads all nine export choices, one- and two-page PDF/Word files, and PNGs from Style, Industry, and Global template families. The generated PDF pages and raster files are then rendered/inspected rather than accepted on file existence alone.

`scripts/section-items-smoke.mjs` verifies page-level and Content-panel add/remove actions in real Chromium at desktop and mobile viewports, edits a newly added job, audits browser storage for editor-only markup, and fails on page or console errors.

`scripts/free-ai-smoke.mjs` performs 36 real-browser checks. It creates and applies a complete resume, proves that the reported 10-year Trade Finance/Software Testing/Functional Testing note becomes a substantive professional summary instead of being echoed, checks an evidence-rich trade-finance answer, writes a project section, produces professional suggestions, verifies desktop/mobile layouts, saves and exports the generated document, and fails if free mode contacts OpenAI or Gemini.

`QA-MANUAL-500.csv` supplies 500 independently executable human QA cases. They are intentionally marked ready for manual sign-off rather than falsely labelled as executed.

`QA-MANUAL-IMPORT-5000.xlsx` supplies 5,000 additional authored manual cases across PDF, Word/rich documents, OCR/images, mapping integrity, source/editable mode, template switching, persistence/export, security/negative behavior, responsive devices, accessibility, and performance. These cases are also intentionally marked **not executed — ready for manual QA**.

The 20 local knowledge packs cover Trade Finance, Functional Testing, Software QA, Test Automation, Banking, Cheque Clearing/CTS, IT Support, Software Engineering, Data Analytics, Cybersecurity, Project Management, Product Design, Finance/Accounting, Operations/Supply Chain, Sales, Customer Service, Human Resources, Marketing, Healthcare, and Education. Tests validate supplied-fact preservation, substantial professional rewriting, structured response parsing, safe rendering, evidence guidance, role vocabulary, and ATS terminology. Connected-provider wording is probabilistic and requires the user's own API key, so no test can promise a provider will be perfect on every question.

The GitHub Pages workflow runs tests and the production build before every deployment.

## AI setup and security

Open the editor and select **AI Copilot**. **ResumeForge Free AI** is ready immediately and needs no configuration, key, account, billing, or network connection. Professional Career Engine 2.0 transforms brief verified notes into polished summaries, objectives, evidence-oriented bullets, complete resumes, professional suggestions, detailed career-domain answers, and ATS guidance locally in the browser. It deliberately avoids inventing employers, dates, qualifications, or metrics.

Use **Connect** only when you intentionally want OpenAI, Google Gemini, or another compatible provider. Connected-provider credentials live only in React memory and disappear when the tab is closed or reloaded. The ATS preflight and ResumeForge Free AI remain local and keyless.

This portable build can call a provider directly for personal use. A public production deployment should route AI calls through an authenticated server or serverless function with rate limits, abuse protection, and provider credentials stored in server secrets. Never embed an API key in this repository or the generated HTML.

AI output is probabilistic and must be reviewed. The score is a transparent heuristic, not a score from an employer or ATS vendor, and it cannot guarantee an interview.

The template catalogue is generated from original page architecture, typography, header, section-heading, color, density, photo, and corner combinations. Novorésumé, Kickresume, Reactive Resume, Enhancv, Resume.io, and Zety were used only as feature/category research references; ResumeForge does not scrape or copy proprietary templates or content.
