import { describe, expect, it, vi } from 'vitest';
import { AI_PROVIDERS, callAIProvider, parseGrammarCorrections, parseStructuredResume, testAIConnection } from './aiEngine';
import { correctFreeAIText, freeAIGrammarCorrections, generateFreeAIResponse } from './freeAIEngine';

const request = (task, payload = {}, context = { text: '', sections: [] }, jobDescription = '') => ({ task, payload, context, jobDescription });

describe('ResumeForge Free AI', () => {
  it('is the default, keyless, browser-local provider', async () => {
    expect(AI_PROVIDERS[0]).toMatchObject({ id: 'free', local: true, requiresKey: false });
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    const result = await callAIProvider({ provider: 'free', apiKey: '' }, request('question', { question: 'How do I improve ATS compatibility?' }));
    expect(result.provider).toBe('ResumeForge Free AI');
    expect(result.model).toContain('On-device');
    expect(result.raw.local).toBe(true);
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });

  it('verifies immediately without an account, key, or network request', async () => {
    const result = await testAIConnection({ provider: 'free', apiKey: '', model: 'On-device Career Engine 1.0' });
    expect(result.ok).toBe(true);
    expect(result.text).toBe('CONNECTION_OK');
  });

  it('creates a complete structured resume using only supplied facts', () => {
    const text = generateFreeAIResponse(request('full', {
      name: 'Priya Sharma', targetRole: 'Trade Finance Specialist', industry: 'Banking', experienceYears: '6 years',
      email: 'priya@example.com', phone: '+91 99999 11111', location: 'Mumbai, India', links: 'linkedin.com/in/priya',
      careerHistory: 'Trade Finance Specialist | Verified Bank | Mumbai | 2020-Present\nProcessed export documents through SWIFT\nReviewed UCP 600 discrepancies',
      achievements: 'Reduced document exceptions by 18%', education: 'B.Com | Mumbai University | Mumbai | 2019',
      skills: 'Trade Finance, SWIFT, UCP 600, Sanctions Screening',
      projects: 'Export Controls Upgrade | Lead | 2024\nMapped validation controls\nCoordinated release testing',
      certifications: 'Trade Finance Certificate | Verified Institute | 2023', languages: 'English, Hindi'
    }));
    const data = parseStructuredResume(text);
    expect(data.profile.name).toBe('Priya Sharma');
    expect(data.summary).toContain('6 years');
    expect(data.experience[0]).toMatchObject({ role: 'Trade Finance Specialist', company: 'Verified Bank', dates: '2020-Present' });
    expect(data.experience[0].bullets).toContain('Reduced document exceptions by 18%.');
    expect(data.projects[0].bullets).toContain('Coordinated release testing.');
    expect(data.skills).toContain('UCP 600');
    expect(text).not.toContain('Invented Employer');
  });

  it('writes concise paragraphs and evidence-oriented bullet sections', () => {
    const summary = generateFreeAIResponse(request('section', { section: 'Professional Summary', details: 'functional test analyst. validates banking workflows. coordinates UAT.', length: 'concise' }));
    const experience = generateFreeAIResponse(request('section', { section: 'Experience', details: 'designed 120 test cases\ncoordinated UAT defects' }));
    expect(summary).toBe('Functional test analyst. Validates banking workflows. Coordinates UAT.');
    expect(experience).toContain('- Designed 120 test cases.');
    expect(experience).toContain('- Coordinated UAT defects.');
  });

  it('corrects common spelling, punctuation, capitalization, and spacing safely', () => {
    expect(correctFreeAIText('i acheived teh target with sucessfully completed testing')).toBe('I achieved the target with successfully completed testing.');
    const corrections = freeAIGrammarCorrections('Managed  teh project , and techinical testing');
    expect(corrections).toEqual(expect.arrayContaining([
      { original: 'teh', replacement: 'the', reason: 'Corrected spelling' },
      { original: 'techinical', replacement: 'technical', reason: 'Corrected spelling' },
    ]));
    expect(parseGrammarCorrections(generateFreeAIResponse(request('grammar', { scope: 'resume', text: 'teh techinical work' })))).toHaveLength(2);
  });

  it('provides resume-specific review recommendations from local content', () => {
    const result = generateFreeAIResponse(request('suggestions', { focus: 'ATS' }, {
      text: 'Candidate candidate@example.com Summary Product designer Skills Figma',
      sections: [{ name: 'Summary' }, { name: 'Skills' }]
    }, 'Product designer accessibility research analytics'));
    expect(result).toContain('Experience:');
    expect(result).toContain('Target role alignment:');
    expect(result).toContain('accessibility');
  });

  it.each([
    ['banking KYC resume', 'KYC and AML controls'],
    ['trade finance SWIFT role', 'UCP 600'],
    ['software testing Selenium resume', 'API testing'],
    ['functional testing UAT', 'requirements analysis'],
    ['IT support engineer', 'incident management'],
    ['cheque clearing CTS', 'inward and outward clearing'],
    ['product design Figma', 'user research'],
  ])('answers the %s career domain without a paid provider', (question, expected) => {
    expect(generateFreeAIResponse(request('question', { question }))).toContain(expected);
  });

  it('states the offline boundary for live or unrelated facts', () => {
    const result = generateFreeAIResponse(request('question', { question: 'What happened in world news today?' }, { sections: [{ name: 'Experience' }] }));
    expect(result).toContain('Current news');
    expect(result).toContain('connected research provider');
  });

  it('honors cancellation without doing work', async () => {
    const controller = new AbortController();
    controller.abort();
    await expect(callAIProvider({ provider: 'free' }, request('question', { question: 'ATS' }), controller.signal)).rejects.toMatchObject({ name: 'AbortError' });
  });
});
