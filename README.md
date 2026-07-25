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
- AI section writing for all 60 sections, grammar and clarity correction, professional suggestions, and resume-aware or general Q&A
- OpenAI Responses API, Google Gemini, and configurable OpenAI-compatible/local provider connections
- Optional OpenAI web search or Gemini Google Search grounding with source links
- Session-only API keys that are never stored in resumes, browser storage, exports, or source code
- Automatic local ATS preflight with contact, section, evidence, readability, structure, and job-keyword breakdowns
- Truthfulness and prompt-injection safeguards that instruct providers not to invent personal history or obey instructions embedded in pasted content
- Browser-local drafts and a saved-resume library
- PDF, DOCX, PNG, JPG, HTML, TXT, RTF, and SVG exports
- Desktop, tablet, and mobile layouts

## Testing

Run `npm test` for the 6,107-test automated suite. It includes a 5,000-case import integrity/mapping matrix, a 1,024-case combinatorial section-movement matrix, boundary and security tests, and full UI integration tests. It also covers the upload/review/apply/template-change workflow, source fingerprints, line accounting, the home/editor workflow, continuous typing through autosave, templates, document controls, photos, multi-page behavior, customization, saved resumes, every export pipeline, AI review/apply/undo, provider request formats, credential and endpoint failures, injection escaping, long-input bounds, ATS accuracy and score limits, responsive CSS, and a repeated local performance workload.

`QA-MANUAL-500.csv` supplies 500 independently executable human QA cases. They are intentionally marked ready for manual sign-off rather than falsely labelled as executed.

`QA-MANUAL-IMPORT-5000.xlsx` supplies 5,000 additional authored manual cases across PDF, Word/rich documents, OCR/images, mapping integrity, source/editable mode, template switching, persistence/export, security/negative behavior, responsive devices, accessibility, and performance. These cases are also intentionally marked **not executed — ready for manual QA**.

Deterministic domain scenarios cover Banking, Trade Finance, Software Testing, Functional Testing, Information Technology, Cheque Clearing/CTS, and experienced-professional resumes. These tests validate prompt fact preservation, structured response parsing, safe rendering, role vocabulary, and ATS matching. Live provider wording is probabilistic and requires the user's own API key, so no test can promise a provider will be perfect on every question.

The GitHub Pages workflow runs tests and the production build before every deployment.

## AI setup and security

Open the editor, select **AI Copilot**, then use **Connect**. Enter a provider model and a session-only API key. Credentials live only in React memory and disappear when the tab is closed or reloaded. The ATS preflight runs locally and needs no provider or key.

This portable build can call a provider directly for personal use. A public production deployment should route AI calls through an authenticated server or serverless function with rate limits, abuse protection, and provider credentials stored in server secrets. Never embed an API key in this repository or the generated HTML.

AI output is probabilistic and must be reviewed. The score is a transparent heuristic, not a score from an employer or ATS vendor, and it cannot guarantee an interview.

The template catalogue is generated from original page architecture, typography, header, section-heading, color, density, photo, and corner combinations. Novorésumé, Kickresume, Reactive Resume, Enhancv, Resume.io, and Zety were used only as feature/category research references; ResumeForge does not scrape or copy proprietary templates or content.
