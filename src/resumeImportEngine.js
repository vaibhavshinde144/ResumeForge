const MAX_FILE_BYTES = 30 * 1024 * 1024;
const MAX_PDF_PAGES = 25;
const MAX_TEXT_CHARACTERS = 1_000_000;

export const RESUME_IMPORT_ACCEPT = '.pdf,.docx,.odt,.txt,.rtf,.html,.htm,.md,.csv,.json,.png,.jpg,.jpeg,.webp,.bmp,.gif,.tif,.tiff';

export const SECTION_HEADING_ALIASES = {
  Summary: ['summary', 'professional summary', 'career summary', 'profile', 'professional profile', 'about me', 'about'],
  Objective: ['objective', 'career objective', 'professional objective'],
  Experience: ['experience', 'work experience', 'professional experience', 'employment', 'employment history', 'career history', 'work history'],
  Education: ['education', 'academic background', 'academic qualifications', 'educational qualifications', 'qualifications'],
  Skills: ['skills', 'core skills', 'key skills', 'competencies', 'core competencies', 'areas of expertise'],
  'Technical Skills': ['technical skills', 'technologies', 'technology', 'tools and technologies', 'computer skills', 'it skills'],
  Projects: ['projects', 'key projects', 'selected projects', 'project experience', 'academic projects'],
  Certifications: ['certifications', 'certificates', 'professional certifications', 'licenses and certifications', 'licences and certifications'],
  Awards: ['awards', 'honors', 'honours', 'awards and honors', 'awards and honours', 'recognition'],
  Achievements: ['achievements', 'key achievements', 'accomplishments', 'career highlights'],
  Languages: ['languages', 'language proficiency', 'language skills'],
  'Personal Details': ['personal details', 'personal information', 'additional personal information'],
  Publications: ['publications', 'research publications', 'selected publications'],
  Patents: ['patents', 'inventions'],
  'Volunteer Experience': ['volunteer experience', 'volunteering', 'community involvement', 'community service'],
  References: ['references', 'professional references'],
  Courses: ['courses', 'training', 'professional development', 'workshops'],
  'Professional Memberships': ['professional memberships', 'memberships', 'affiliations'],
  Interests: ['interests', 'hobbies', 'hobbies and interests'],
  Portfolio: ['portfolio', 'selected work', 'work samples'],
  Leadership: ['leadership', 'leadership experience'],
  Research: ['research', 'research experience'],
  'Security Clearances': ['security clearance', 'security clearances'],
  'Additional Information': ['additional information', 'other information', 'miscellaneous'],
};

const aliasLookup = new Map(Object.entries(SECTION_HEADING_ALIASES).flatMap(([canonical, aliases]) => aliases.map(alias => [alias, canonical])));
const ASIDE_SECTIONS = new Set(['Skills', 'Technical Skills', 'Education', 'Certifications', 'Languages', 'Personal Details', 'Courses', 'Professional Memberships', 'Interests', 'Security Clearances']);

const escapeHtml = value => String(value ?? '').replace(/[&<>'"]/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character]);
const extensionOf = name => String(name || '').toLowerCase().split('.').pop() || '';
const readDataUrl = file => new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = () => reject(reader.error || new Error('The file could not be read.')); reader.readAsDataURL(file); });
const readText = file => typeof file?.text === 'function' ? file.text() : new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result || '')); reader.onerror = () => reject(reader.error || new Error('The file could not be read.')); reader.readAsText(file); });

export function fingerprintText(value = '') {
  let hash = 2166136261;
  const text = String(value);
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `rf-${(hash >>> 0).toString(16).padStart(8, '0')}-${text.length}`;
}

export function normalizeHeading(value = '') {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/[\s:\u2013\u2014-]+$/g, '')
    .replace(/^[\s\u2022\u00b7\u25aa\u25a0\u25c6\u25ba\u25b6*-]+/, '')
    .replace(/\s+/g, ' ');
  /* c8 ignore next -- retained below only for patch-safe migration of legacy bytes */
  return String(value).trim().toLowerCase().replace(/[\s:–—-]+$/g, '').replace(/^[\s•·▪■◆►▶*-]+/, '').replace(/\s+/g, ' ');
}

export function identifySectionHeading(value = '') {
  const normalized = normalizeHeading(value);
  if (!normalized || normalized.length > 64) return null;
  return aliasLookup.get(normalized) || null;
}

export function mapResumeText(sourceText = '') {
  const text = String(sourceText ?? '').replace(/^\uFEFF/, '');
  if (text.length > MAX_TEXT_CHARACTERS) throw new Error('The extracted resume text exceeds the 1,000,000-character safety limit. Split the document and import it in parts.');
  const lines = text.split(/\r\n|\n|\r/);
  const headingIndexes = lines.map((line, index) => ({ index, canonical: identifySectionHeading(line) })).filter(item => item.canonical);
  let headerLines = [];
  const sections = [];

  if (headingIndexes.length) {
    headerLines = lines.slice(0, headingIndexes[0].index);
    headingIndexes.forEach((heading, position) => {
      const end = headingIndexes[position + 1]?.index ?? lines.length;
      sections.push({
        name: heading.canonical,
        sourceHeading: lines[heading.index],
        lines: lines.slice(heading.index + 1, end),
      });
    });
  } else if (!text) {
    sections.push({ name: 'Additional Information', sourceHeading: '', lines: [''] });
  } else {
    let splitIndex = lines.findIndex((line, index) => index > 0 && !line.trim());
    if (splitIndex < 0) splitIndex = Math.min(lines.length, 4);
    headerLines = lines.slice(0, splitIndex);
    const remaining = lines.slice(splitIndex);
    if (remaining.length || !headerLines.length) sections.push({ name: 'Additional Information', sourceHeading: '', lines: remaining.length ? remaining : lines });
  }

  const accountedLines = headerLines.length + sections.reduce((sum, section) => sum + section.lines.length + (section.sourceHeading ? 1 : 0), 0);
  return {
    sourceText: text,
    fingerprint: fingerprintText(text),
    headerLines,
    sections,
    detectedHeadingCount: headingIndexes.length,
    accountedLineCount: accountedLines,
    totalLineCount: lines.length,
    allLinesAccountedFor: accountedLines === lines.length,
    mappingConfidence: headingIndexes.length >= 4 ? 'high' : headingIndexes.length >= 1 ? 'review' : 'manual-review-required',
  };
}

const exactLinesMarkup = lines => `<div class="imported-exact-lines" contenteditable="true">${lines.map((line, index) => `${index ? '<br/>' : ''}${escapeHtml(line)}`).join('')}</div>`;
const sectionMarkup = section => `<section class="resume-section imported-resume-section" data-section-name="${escapeHtml(section.name)}"><div class="section-heading"><h2 contenteditable="true">${escapeHtml(section.sourceHeading || section.name)}</h2></div>${exactLinesMarkup(section.lines)}</section>`;

export function buildImportedResumeMarkup(mapping) {
  const header = mapping.headerLines || [];
  const nonempty = header.map((value, index) => ({ value, index })).filter(item => item.value.trim());
  const nameIndex = nonempty[0]?.index ?? -1;
  const roleIndex = nonempty[1]?.index ?? -1;
  const contactLines = header.filter((_, index) => index !== nameIndex && index !== roleIndex);
  const main = mapping.sections.filter(section => !ASIDE_SECTIONS.has(section.name));
  const aside = mapping.sections.filter(section => ASIDE_SECTIONS.has(section.name));
  const mainSections = main.length ? main : aside.splice(0, Math.max(1, Math.ceil(aside.length / 2)));
  return `<header class="resume-hero imported-resume-hero"><div class="identity"><div><p class="eyebrow">IMPORTED · VERBATIM TEXT</p><h1 contenteditable="true">${escapeHtml(nameIndex >= 0 ? header[nameIndex] : 'Imported resume')}</h1>${roleIndex >= 0 ? `<p class="role" contenteditable="true">${escapeHtml(header[roleIndex])}</p>` : ''}</div></div>${contactLines.length ? `<div class="contact">${exactLinesMarkup(contactLines)}</div>` : ''}</header><div class="resume-rule"></div><main class="resume-columns" data-source-fingerprint="${escapeHtml(mapping.fingerprint)}"><div class="resume-main">${mainSections.map(sectionMarkup).join('')}</div><aside class="resume-aside">${aside.map(sectionMarkup).join('')}</aside></main>`;
}

export function buildImportedVisualPages(sourcePages = [], fileName = 'Imported resume') {
  return sourcePages.map((page, index) => page.type === 'html'
    ? `<div class="imported-visual-page imported-html-preview" data-imported-page="${index + 1}"><div class="imported-preview-label">Source-style preview · ${escapeHtml(fileName)} · page ${index + 1}</div><div class="imported-safe-html">${page.content}</div></div>`
    : `<div class="imported-visual-page" data-imported-page="${index + 1}"><div class="imported-preview-label">Source visual · ${escapeHtml(fileName)} · page ${index + 1}</div><img src="${escapeHtml(page.dataUrl)}" alt="${escapeHtml(fileName)} page ${index + 1}"/></div>`);
}

function safeHtmlFragment(value = '') {
  const documentValue = new DOMParser().parseFromString(String(value), 'text/html');
  documentValue.querySelectorAll('script,style,iframe,object,embed,link,meta,form,input,button,textarea,select').forEach(node => node.remove());
  documentValue.querySelectorAll('*').forEach(node => {
    [...node.attributes].forEach(attribute => {
      const keep = attribute.name === 'alt' || (attribute.name === 'href' && /^(https?:|mailto:|tel:|#)/i.test(attribute.value)) || (attribute.name === 'src' && /^data:image\//i.test(attribute.value));
      if (!keep) node.removeAttribute(attribute.name);
    });
    if (node.tagName === 'A') node.setAttribute('rel', 'noreferrer noopener');
  });
  return documentValue.body.innerHTML;
}

export function htmlToPlainText(value = '') {
  const documentValue = new DOMParser().parseFromString(String(value), 'text/html');
  documentValue.querySelectorAll('script,style,iframe,object,embed').forEach(node => node.remove());
  documentValue.querySelectorAll('br').forEach(node => node.replaceWith('\n'));
  documentValue.querySelectorAll('p,div,li,h1,h2,h3,h4,h5,h6,tr,section,article').forEach(node => node.append('\n'));
  return documentValue.body.textContent.replace(/\n{3,}/g, '\n\n').trim();
}

export function rtfToPlainText(value = '') {
  return String(value)
    .replace(/\\u(-?\d+)\??/g, (_, number) => String.fromCharCode(Number(number) < 0 ? Number(number) + 65536 : Number(number)))
    .replace(/\\'([0-9a-f]{2})/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/\\(?:par|line)\b ?/g, '\n')
    .replace(/\\tab\b/g, '\t')
    .replace(/\\[a-z]+-?\d* ?/gi, '')
    .replace(/[{}]/g, '')
    .replace(/\\([\\{}])/g, '$1')
    .trim();
}

function pdfItemsToText(items = []) {
  const rows = [];
  items.filter(item => typeof item.str === 'string').forEach(item => {
    const y = item.transform?.[5] ?? 0;
    let row = rows.find(candidate => Math.abs(candidate.y - y) < 2.5);
    if (!row) { row = { y, items: [] }; rows.push(row); }
    row.items.push({ x: item.transform?.[4] ?? 0, text: item.str });
  });
  return rows.sort((a, b) => b.y - a.y).map(row => row.items.sort((a, b) => a.x - b.x).map(item => item.text).join(' ').replace(/\s+/g, ' ').trim()).join('\n');
}

async function extractPdf(file, onProgress) {
  const pdfjs = await import('pdfjs-dist/build/pdf.mjs');
  const worker = await import('pdfjs-dist/build/pdf.worker.min.mjs?url');
  pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
  const documentTask = pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) });
  const pdf = await documentTask.promise;
  if (pdf.numPages > MAX_PDF_PAGES) throw new Error(`This browser build imports up to ${MAX_PDF_PAGES} PDF pages at once. Split this ${pdf.numPages}-page file first.`);
  const texts = [];
  const sourcePages = [];
  for (let pageIndex = 1; pageIndex <= pdf.numPages; pageIndex += 1) {
    onProgress?.({ stage: 'Reading PDF', progress: Math.round(((pageIndex - 1) / pdf.numPages) * 65) });
    const page = await pdf.getPage(pageIndex);
    const content = await page.getTextContent();
    texts.push(pdfItemsToText(content.items));
    const viewport = page.getViewport({ scale: 1.7 });
    const canvas = document.createElement('canvas');
    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);
    const context = canvas.getContext('2d', { alpha: false });
    if (context) {
      await page.render({ canvasContext: context, viewport }).promise;
      sourcePages.push({ type: 'image', dataUrl: canvas.toDataURL('image/png', 1) });
    }
  }
  onProgress?.({ stage: 'Reading PDF', progress: 70 });
  return { text: texts.join('\n\n'), sourcePages, method: 'Embedded PDF text layer', warnings: texts.join('').trim() ? [] : ['No embedded PDF text was found; OCR is required for this scanned PDF.'] };
}

async function extractDocx(file) {
  const mammoth = await import('mammoth/mammoth.browser');
  const arrayBuffer = await file.arrayBuffer();
  const [raw, converted] = await Promise.all([mammoth.extractRawText({ arrayBuffer }), mammoth.convertToHtml({ arrayBuffer })]);
  return {
    text: raw.value,
    sourcePages: [{ type: 'html', content: safeHtmlFragment(converted.value) }],
    method: 'DOCX semantic extraction',
    warnings: ['DOCX source-style preview is semantic, not pixel-identical; Word layout requires a native Word/LibreOffice rendering service.', ...raw.messages.map(message => message.message)],
  };
}

async function extractOdt(file) {
  const { default: JSZip } = await import('jszip');
  const zip = await JSZip.loadAsync(await file.arrayBuffer());
  const content = await zip.file('content.xml')?.async('string');
  if (!content) throw new Error('The ODT file does not contain content.xml.');
  const withBreaks = content.replace(/<text:line-break\s*\/>/g, '\n').replace(/<\/text:p>/g, '\n').replace(/<\/text:h>/g, '\n');
  const xml = new DOMParser().parseFromString(withBreaks, 'application/xml');
  return { text: xml.documentElement.textContent.replace(/\n{3,}/g, '\n\n').trim(), sourcePages: [], method: 'ODT XML extraction', warnings: ['ODT formatting cannot be reproduced exactly in this browser-only build; extracted text remains unchanged after extraction.'] };
}

async function recognizeImages(sourcePages, language, onProgress) {
  const { createWorker } = await import('tesseract.js');
  let currentPage = 0;
  const worker = await createWorker(language || 'eng', undefined, { logger: message => {
    if (message.status === 'recognizing text') onProgress?.({ stage: `OCR page ${currentPage + 1}`, progress: 70 + Math.round(((currentPage + message.progress) / sourcePages.length) * 28) });
  } });
  const texts = [];
  try {
    for (currentPage = 0; currentPage < sourcePages.length; currentPage += 1) {
      const result = await worker.recognize(sourcePages[currentPage].dataUrl);
      texts.push(result.data.text || '');
    }
  } finally { await worker.terminate(); }
  return texts.join('\n\n');
}

export function detectResumeFileKind(file) {
  const extension = extensionOf(file?.name);
  const mime = String(file?.type || '').toLowerCase();
  if (extension === 'pdf' || mime === 'application/pdf') return 'pdf';
  if (extension === 'docx' || mime.includes('wordprocessingml')) return 'docx';
  if (extension === 'odt' || mime.includes('opendocument.text')) return 'odt';
  if (['html', 'htm'].includes(extension) || mime === 'text/html') return 'html';
  if (extension === 'rtf' || mime.includes('rtf')) return 'rtf';
  if (mime.startsWith('image/') || ['png', 'jpg', 'jpeg', 'webp', 'bmp', 'gif', 'tif', 'tiff'].includes(extension)) return 'image';
  if (['txt', 'md', 'csv', 'json'].includes(extension) || mime.startsWith('text/')) return 'text';
  if (extension === 'doc') return 'legacy-doc';
  return 'unsupported';
}

export async function extractResumeFile(file, { ocrLanguage = 'eng', enableOcr = true, onProgress } = {}) {
  if (!file) throw new Error('Choose a resume file first.');
  if (file.size > MAX_FILE_BYTES) throw new Error('The file exceeds the 30 MB browser safety limit.');
  const kind = detectResumeFileKind(file);
  onProgress?.({ stage: 'Reading file', progress: 3 });
  let extracted;
  if (kind === 'pdf') extracted = await extractPdf(file, onProgress);
  else if (kind === 'docx') extracted = await extractDocx(file);
  else if (kind === 'odt') extracted = await extractOdt(file);
  else if (kind === 'html') { const html = await readText(file); extracted = { text: htmlToPlainText(html), sourcePages: [{ type: 'html', content: safeHtmlFragment(html) }], method: 'Sanitized HTML extraction', warnings: [] }; }
  else if (kind === 'rtf') extracted = { text: rtfToPlainText(await readText(file)), sourcePages: [], method: 'RTF text extraction', warnings: ['Complex RTF positioning and embedded objects require a native document conversion service.'] };
  else if (kind === 'text') extracted = { text: await readText(file), sourcePages: [], method: 'Direct text read', warnings: [] };
  else if (kind === 'image') {
    const dataUrl = await readDataUrl(file);
    extracted = { text: '', sourcePages: [{ type: 'image', dataUrl }], method: 'Image OCR', warnings: ['OCR accuracy depends on resolution, language, contrast, rotation, columns, and scan quality. Verify every character against the source visual.'] };
  } else if (kind === 'legacy-doc') throw new Error('Legacy .doc files cannot be safely decoded in a browser. Save the file as .docx or PDF in Word or LibreOffice, then import it.');
  else throw new Error('Unsupported file type. Use PDF, DOCX, ODT, RTF, HTML, text, Markdown, CSV, JSON, or a supported image.');

  if (enableOcr && extracted.sourcePages.length && extracted.sourcePages.every(page => page.type === 'image') && extracted.text.replace(/\s/g, '').length < 30) {
    try {
      extracted.text = await recognizeImages(extracted.sourcePages, ocrLanguage, onProgress);
      extracted.method = kind === 'pdf' ? 'PDF page OCR' : 'Image OCR';
    } catch (error) {
      extracted.warnings.push(`OCR could not complete: ${error?.message || 'unknown OCR error'}. The source visual remains available.`);
    }
  }
  if (!extracted.text.trim() && !extracted.sourcePages.length) throw new Error('No readable text was found. Choose the correct OCR language or upload a higher-resolution/exported-text version.');
  if (!extracted.text.trim()) extracted.warnings.push('No text was extracted. You can retain the source visual, but editable mapping requires a readable text layer or successful OCR.');
  onProgress?.({ stage: 'Mapping sections', progress: 99 });
  const mapping = mapResumeText(extracted.text);
  onProgress?.({ stage: 'Complete', progress: 100 });
  return {
    fileName: file.name,
    fileSize: file.size,
    fileType: file.type,
    kind,
    method: extracted.method,
    sourceText: mapping.sourceText,
    sourceFingerprint: mapping.fingerprint,
    mapping,
    sourcePages: extracted.sourcePages,
    warnings: extracted.warnings,
    exactTextPreservedAfterExtraction: true,
  };
}
