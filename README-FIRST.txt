RESUMEFORGE - WORKING APPLICATION
=================================

1. Keep all files in this folder together.
2. Double-click OPEN-RESUMEFORGE.bat or index.html.
3. The app runs directly in Chrome, Edge, or Firefox. No installation is required.

The app opens on the ResumeForge home page. From there you can create a new resume,
open a saved resume, or browse 40,320 templates grouped into 48 distinct resume types
and five collections: formats, professional styles, industries, global CVs, and
specialist/storytelling resumes. The editor includes 60 controlled resume sections.

UPLOAD AN EXISTING RESUME
-------------------------
Select Upload existing resume on the home page or Upload resume in the editor. Choose a
supported PDF, DOCX, ODT, RTF, HTML, text/Markdown/CSV/JSON, or image file. ResumeForge
shows the extraction method, line accounting, text fingerprint, detected sections, and
warnings before anything is applied. Import never uses AI and never rewrites source facts.

Use Source visual to retain captured PDF/image pages. Use Editable mapping to keep the
extracted characters verbatim while changing templates, sections, and formatting. These
are different guarantees: arbitrary PDF/image/DOCX files cannot be both pixel-identical
and structurally editable, and OCR always requires comparison with the source visual.
See IMPORT-ACCURACY-NOTES.md for supported formats, limits, and professional verification
guidance. Numeric badges have been removed from all resume section headings.

CONTINUOUS EDITING FIX
----------------------
The editable resume now keeps the same focused DOM element while you type. ATS/AI analysis
is updated after a short idle pause, and autosave persists the complete text without moving
the caret. You can type continuously, wait for autosave, and continue without clicking again.

SECTION MOVEMENT
----------------
Open Content to move any enabled section Up, Down, to the left column, or to the right
column. On the resume page, hover or tap a section to use the same arrows, or drag the
handle to place it before or after any other section. The heading and every paragraph,
list, date, link, and detail in that section move together. Movement controls are editor
tools only and are automatically removed from saves and exports.

Photo-enabled templates let you attach, replace, or hide a profile photo. Use the
page controls above the document to add, navigate, or remove pages. Layout > Document
options now provides page breaks, running headers and footers, one-to-three-column
content layouts, and editable tables. Multi-page content is included in exports.

The expanded design studio includes six full RGB color channels, 18 patterns, 36
bullet/numbering/multilevel systems, body and heading typography controls, custom font
file upload, arbitrary installed-font names, image sizing/wrapping/filters, five paper
formats, and document-wide or page-specific design controls. Pages may inherit the
document design or use an independent template and styling.

The Content tab stores researched guidance for all sections, including every row from
the supplied 21-section CSV.

AI COPILOT
----------
Open a resume and select AI Copilot. It can draft a complete resume from verified facts,
write any of the 60 sections, correct grammar, provide prioritized suggestions, answer
focused questions, and optionally use provider-supported live web research. Every change
is previewed and requires Apply before it replaces resume content.

Use Connect to choose OpenAI, Google Gemini, or a compatible/local provider. API keys are
held only in memory for the current tab; they are not saved with the resume or embedded
in exports. Never put a key into this folder or publish one to GitHub. Public deployments
should use an authenticated server-side proxy. Provider usage and web research may cost
money according to the selected provider.

The ATS preflight runs locally without an API key. It checks contact details, core
sections, measurable evidence, readability, structure, and target-job keywords. It is a
heuristic review tool, not an employer or ATS-vendor score, and cannot guarantee hiring.

Your drafts and saved resumes are stored in the current browser on the current device.
Use Export to download exact-visual PDF, Word, PNG, JPG, HTML, or SVG copies.
Choose Word (exact) when the design must match the editor; it stores each page as a
high-resolution full-page image. Choose Word (editable), TXT, or RTF when editable
content matters more than pixel-identical browser styling.

The source folder contains the full React/Vite project, automated tests, and a GitHub
Pages deployment workflow. Developers can run:

  npm install
  npm test
  npm run dev

The included automated suite contains 7,107 tests, including 5,000 generated import
integrity/mapping cases and 1,024 combinatorial whole-section movement cases. It also
covers the reported typing/autosave regression, upload/review/template switching, positive
and negative workflows, edge cases, provider errors, injection safety, ATS accuracy bounds,
performance, responsive layouts, seven requested career domains, and all eight export
pipelines. QA-MANUAL-IMPORT-5000.xlsx contains 5,000 authored import cases and
QA-MANUAL-500.csv contains 500 earlier cases; both are ready for independent human sign-off
and are not marked as executed. Live provider answers still depend on the selected provider, model, supplied
facts, connectivity, and the user's own API key and must be reviewed.

Important: open the index.html beside this file. Do not open source/index.html directly;
that file is for development and must be run through Vite.
