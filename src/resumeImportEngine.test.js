import { describe, expect, it } from 'vitest';
import {
  buildImportedResumeMarkup, buildImportedVisualPages, detectResumeFileKind,
  fingerprintText, htmlToPlainText, identifySectionHeading, mapResumeText,
  normalizeHeading, rtfToPlainText
} from './resumeImportEngine';

const domains = [
  ['Banking Operations', 'Processed inward remittances and reconciled suspense accounts.'],
  ['Trade Finance', 'Reviewed letters of credit, UCP 600 documents, and discrepancy notices.'],
  ['Software Testing', 'Executed functional, regression, API, and database validation.'],
  ['Information Technology', 'Supported identity, endpoint, network, and incident workflows.'],
  ['Cheque Operations', 'Verified clearing files, positive-pay exceptions, and return reasons.'],
  ['Quality Assurance', 'Built traceable test evidence and release-readiness reports.'],
  ['Risk and Compliance', 'Completed KYC checks and escalated policy exceptions.'],
  ['Product Operations', 'Improved customer onboarding and measured service outcomes.'],
];
const summaryHeadings = ['SUMMARY', 'Professional Summary:', 'Career Summary', 'Profile', 'About Me'];
const experienceHeadings = ['EXPERIENCE', 'Work Experience:', 'Professional Experience', 'Employment History', 'Career History'];
const skillHeadings = ['SKILLS', 'Core Skills:', 'Key Skills', 'Competencies', 'Areas of Expertise'];
const educationHeadings = ['EDUCATION', 'Academic Background:', 'Academic Qualifications', 'Qualifications', 'Educational Qualifications'];

const IMPORT_MATRIX = Array.from({ length: 5000 }, (_, id) => {
  const [domain, achievement] = domains[id % domains.length];
  const token = `RF-IMPORT-${String(id + 1).padStart(4, '0')}`;
  const source = [
    `Candidate ${id + 1}`,
    `${domain} Specialist`,
    `candidate${id + 1}@example.com | +91 90000 ${String(id).padStart(5, '0')}`,
    summaryHeadings[id % summaryHeadings.length],
    `${token} — ${achievement}`,
    experienceHeadings[Math.floor(id / 5) % experienceHeadings.length],
    `Senior Associate | Example Bank | 2020–Present`,
    `• ${achievement}`,
    skillHeadings[Math.floor(id / 25) % skillHeadings.length],
    `${domain}; reconciliation; controls; stakeholder communication`,
    educationHeadings[Math.floor(id / 125) % educationHeadings.length],
    `Bachelor of Commerce | Example University | 2019`,
  ].join('\n');
  return { id: id + 1, source, token };
});

describe('5,000-case resume import integrity matrix', () => {
  it.each(IMPORT_MATRIX)('case $id preserves every extracted character and maps known sections', ({ source, token }) => {
    const mapping = mapResumeText(source);
    const reconstructed = [
      ...mapping.headerLines,
      ...mapping.sections.flatMap(section => [section.sourceHeading, ...section.lines]),
    ].join('\n');

    expect(mapping.sourceText).toBe(source);
    expect(mapping.fingerprint).toBe(fingerprintText(source));
    expect(mapping.allLinesAccountedFor).toBe(true);
    expect(mapping.sections.map(section => section.name)).toEqual(['Summary', 'Experience', 'Skills', 'Education']);
    expect(reconstructed).toBe(source);
    expect(buildImportedResumeMarkup(mapping)).toContain(token);
  });
});

describe('import parser positive, negative, and edge coverage', () => {
  it.each([
    ['resume.pdf', 'application/pdf', 'pdf'],
    ['resume.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'docx'],
    ['resume.odt', 'application/vnd.oasis.opendocument.text', 'odt'],
    ['resume.rtf', 'application/rtf', 'rtf'],
    ['resume.html', 'text/html', 'html'],
    ['resume.htm', '', 'html'],
    ['resume.txt', 'text/plain', 'text'],
    ['resume.md', 'text/markdown', 'text'],
    ['resume.csv', 'text/csv', 'text'],
    ['resume.json', 'application/json', 'text'],
    ['resume.png', 'image/png', 'image'],
    ['resume.jpg', 'image/jpeg', 'image'],
    ['resume.jpeg', '', 'image'],
    ['resume.webp', 'image/webp', 'image'],
    ['resume.bmp', 'image/bmp', 'image'],
    ['resume.gif', 'image/gif', 'image'],
    ['resume.tif', 'image/tiff', 'image'],
    ['resume.tiff', '', 'image'],
    ['resume.doc', 'application/msword', 'legacy-doc'],
    ['resume.exe', 'application/octet-stream', 'unsupported'],
  ])('detects %s as %s', (name, type, expected) => {
    expect(detectResumeFileKind({ name, type })).toBe(expected);
  });

  it.each([
    ['SUMMARY', 'Summary'], ['professional profile:', 'Summary'], ['• EXPERIENCE —', 'Experience'],
    ['TECHNICAL SKILLS', 'Technical Skills'], ['licenses and certifications', 'Certifications'],
    ['awards and honours', 'Awards'], ['community service', 'Volunteer Experience'],
    ['not a standard section heading', null], ['', null],
  ])('recognizes normalized heading %s', (heading, expected) => {
    expect(identifySectionHeading(heading)).toBe(expected);
  });

  it('normalizes punctuation and Unicode bullets without changing content lines', () => {
    expect(normalizeHeading('  ◆ Professional Summary: —  ')).toBe('professional summary');
  });

  it('preserves an unstructured resume in a deterministic fallback section', () => {
    const source = 'Asha Rao\nOperations Analyst\n\nExact line one\nExact line two';
    const mapping = mapResumeText(source);
    expect(mapping.mappingConfidence).toBe('manual-review-required');
    expect(mapping.allLinesAccountedFor).toBe(true);
    expect(mapping.sections[0]).toMatchObject({ name: 'Additional Information', lines: ['', 'Exact line one', 'Exact line two'] });
  });

  it('handles blank input without inventing resume facts', () => {
    const mapping = mapResumeText('');
    expect(mapping.sourceText).toBe('');
    expect(mapping.headerLines).toEqual([]);
    expect(mapping.sections[0].lines).toEqual(['']);
    expect(mapping.allLinesAccountedFor).toBe(true);
  });

  it('rejects extracted text over the safety limit', () => {
    expect(() => mapResumeText('x'.repeat(1_000_001))).toThrow(/1,000,000-character/);
  });

  it('extracts readable HTML text while removing executable content', () => {
    const text = htmlToPlainText('<h1>Asha Rao</h1><script>steal()</script><p>Summary<br>Exact result</p>');
    expect(text).toContain('Asha Rao');
    expect(text).toContain('Exact result');
    expect(text).not.toContain('steal');
  });

  it('extracts common RTF controls without rewriting plain content', () => {
    expect(rtfToPlainText('{\\rtf1\\ansi Asha Rao\\par Summary\\par Exact result}')).toContain('Asha Rao\nSummary\nExact result');
  });

  it('escapes extracted markup in the editable document', () => {
    const markup = buildImportedResumeMarkup(mapResumeText('Asha <script>\nTester\nSUMMARY\nExact & safe'));
    expect(markup).toContain('Asha &lt;script&gt;');
    expect(markup).toContain('Exact &amp; safe');
    expect(markup).not.toContain('<script>');
  });

  it('creates one source page per preserved visual', () => {
    const pages = buildImportedVisualPages([{ type: 'image', dataUrl: 'data:image/png;base64,AA==' }, { type: 'html', content: '<p>Exact</p>' }], 'resume.pdf');
    expect(pages).toHaveLength(2);
    expect(pages[0]).toContain('page 1');
    expect(pages[1]).toContain('Exact');
  });

  it('fingerprints both content and length to support integrity review', () => {
    expect(fingerprintText('Resume A')).not.toBe(fingerprintText('Resume B'));
    expect(fingerprintText('Resume A')).toMatch(/^rf-[0-9a-f]{8}-8$/);
  });
});
