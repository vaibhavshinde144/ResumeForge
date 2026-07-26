import { describe, expect, it } from 'vitest';
import { EXPORT_FORMATS, buildExportPlan } from './exportEngine';

const formats = Object.keys(EXPORT_FORMATS);
const templateFamilies = [
  'ats-classic', 'chronological', 'functional', 'combination', 'one-page',
  'detailed', 'government', 'academic', 'modern', 'minimal', 'executive',
  'corporate', 'creative', 'photo', 'infographic', 'technical', 'healthcare',
  'finance', 'banking', 'trade-finance', 'legal', 'education', 'sales',
  'operations', 'global-cv', 'portfolio', 'freelance', 'career-change',
  'graduate', 'leadership', 'engineering', 'product', 'testing', 'security',
  'public-service', 'research', 'hospitality', 'construction', 'aviation', 'retail',
];
const dataProfiles = [
  'banking-analyst', 'trade-finance-specialist', 'software-tester', 'functional-tester',
  'it-engineer', 'cheque-operations-officer', 'product-designer', 'graduate',
  'executive', 'academic', 'healthcare', 'legal', 'teacher', 'sales-manager',
  'operations-lead', 'data-analyst', 'cybersecurity-engineer', 'developer',
  'project-manager', 'accountant', 'multilingual-candidate', 'career-changer',
  'freelancer', 'consultant', 'public-servant',
];

const exportCases = Array.from({ length: 1000 }, (_, index) => ({
  caseNumber: index + 1,
  format: formats[index % formats.length],
  templateId: `${templateFamilies[index % templateFamilies.length]}-${String((index % 840) + 1).padStart(3, '0')}`,
  dataProfile: dataProfiles[Math.floor(index / templateFamilies.length) % dataProfiles.length],
  pageCount: (index % 5) + 1,
  quality: index % 3 === 0 ? 'high' : 'ultra',
  fingerprint: `resume-content-${index + 1}-${(index * 2654435761 >>> 0).toString(16)}`,
}));

describe('1,000-case export fidelity matrix', () => {
  it.each(exportCases)('case $caseNumber: $format · $templateId · $dataProfile', testCase => {
    const plan = buildExportPlan({
      format: testCase.format,
      pageCount: testCase.pageCount,
      quality: testCase.quality,
      templateId: testCase.templateId,
      contentFingerprint: testCase.fingerprint,
    });
    const descriptor = EXPORT_FORMATS[testCase.format];

    expect(plan.format).toBe(testCase.format);
    expect(plan.extension).toBe(descriptor.extension);
    expect(plan.fidelity).toBe(descriptor.fidelity);
    expect(plan.raster).toBe(descriptor.raster);
    expect(plan.pageCount).toBe(testCase.pageCount);
    expect(plan.pixelRatio).toBe(testCase.quality === 'ultra' ? 4 : 2);
    expect(plan.templateId).toBe(testCase.templateId);
    expect(plan.contentFingerprint).toBe(testCase.fingerprint);
    expect(plan.preservesAllPages).toBe(true);

    if (['pdf', 'docx', 'png', 'jpg', 'svg'].includes(testCase.format)) {
      expect(plan.fidelity).toBe('pixel');
      expect(plan.raster).toMatch(/png|jpg/);
    }
    if (['txt', 'rtf', 'docx-editable'].includes(testCase.format)) {
      expect(plan.fidelity).toBe('semantic');
      expect(plan.raster).toBeNull();
    }
  });
});
