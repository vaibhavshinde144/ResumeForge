import { describe, expect, it, vi } from 'vitest';
import { AI_PROVIDERS, callAIProvider, parseGrammarCorrections, parseStructuredResume, testAIConnection } from './aiEngine';
import { correctFreeAIText, FREE_AI_KNOWLEDGE_DOMAINS, freeAIGrammarCorrections, generateFreeAIResponse } from './freeAIEngine';

const request = (task, payload = {}, context = { text: '', sections: [] }, jobDescription = '') => ({ task, payload, context, jobDescription });

describe('ResumeForge Free AI', () => {
  it('is the default, keyless, browser-local provider', async () => {
    expect(AI_PROVIDERS[0]).toMatchObject({ id: 'free', local: true, requiresKey: false });
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    const result = await callAIProvider({ provider: 'free', apiKey: '' }, request('question', { question: 'How do I improve ATS compatibility?' }));
    expect(result.provider).toBe('ResumeForge Free AI');
    expect(result.model).toContain('Professional Career Engine 2.0');
    expect(result.raw.local).toBe(true);
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });

  it('verifies immediately without an account, key, or network request', async () => {
    const result = await testAIConnection({ provider: 'free', apiKey: '', model: 'On-device Professional Career Engine 2.0' });
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
    expect(data.summary).toContain('accurate and compliant transaction processing');
    expect(data.summary).not.toContain('Documented scope includes');
    expect(data.experience[0]).toMatchObject({ role: 'Trade Finance Specialist', company: 'Verified Bank', dates: '2020-Present' });
    expect(data.experience[0].bullets).toContain('Reduced document exceptions by 18%.');
    expect(data.projects[0].bullets.some(item => item.startsWith('Coordinated release testing'))).toBe(true);
    expect(data.skills).toContain('UCP 600');
    expect(text).not.toContain('Invented Employer');
  });

  it('writes concise paragraphs and evidence-oriented bullet sections', () => {
    const summary = generateFreeAIResponse(request('section', { section: 'Professional Summary', details: 'functional test analyst. validates banking workflows. coordinates UAT.', length: 'concise' }));
    const experience = generateFreeAIResponse(request('section', { section: 'Experience', details: 'designed 120 test cases\ncoordinated UAT defects' }));
    expect(summary).toContain('Functional Test Analyst');
    expect(summary).toContain('validation of banking workflows');
    expect(summary).toContain('coordination of uat');
    expect(summary.split(/\s+/).length).toBeGreaterThan(40);
    expect(experience).toContain('- Designed 120 test cases');
    expect(experience).toContain('- Coordinated UAT defects');
  });

  it('deeply rewrites the exact short mixed-domain prompt instead of echoing it', () => {
    const input = 'I have 10 years experience in Trade Finance, Software Testing, Functional Testing.';
    const summary = generateFreeAIResponse(request('section', {
      section: 'Professional Summary', details: input, tone: 'confident and concise', length: 'concise'
    }));
    expect(summary).not.toBe(input);
    expect(summary).not.toContain('I have');
    expect(summary).toContain('10 years of experience');
    expect(summary).toContain('Trade Finance and Quality Assurance professional');
    expect(summary).toContain('requirements analysis');
    expect(summary).toContain('accurate and compliant transaction processing');
    expect(summary.split(/\s+/).length).toBeGreaterThanOrEqual(55);
    expect(summary.split(/\s+/).length).toBeLessThanOrEqual(100);
  });

  it('changes professional positioning by tone without altering supplied facts', () => {
    const details = '8 years experience as IT support engineer. resolved service desk incidents.';
    const concise = generateFreeAIResponse(request('section', { section: 'Professional Summary', details, tone: 'confident and concise', length: 'standard' }));
    const executive = generateFreeAIResponse(request('section', { section: 'Professional Summary', details, tone: 'executive and strategic', length: 'standard' }));
    expect(concise).not.toBe(executive);
    expect(concise).toContain('8 years');
    expect(executive).toContain('8 years');
    expect(executive).toContain('risk-aware, cross-functional perspective');
    expect(`${concise} ${executive}`).not.toMatch(/Goldman|Microsoft|2025|40%/i);
  });

  it('turns weak responsibility wording into action-oriented evidence bullets', () => {
    const result = generateFreeAIResponse(request('section', {
      section: 'Experience', details: 'responsible for test cases\nworked on UAT\nhandled defects'
    }));
    expect(result).toContain('- Managed test cases');
    expect(result).toContain('- Contributed to UAT');
    expect(result).toContain('- Managed defects');
    expect(result).not.toMatch(/Responsible for|Worked on|Handled/);
  });

  it('writes a targeted objective from sparse verified facts', () => {
    const result = generateFreeAIResponse(request('section', {
      section: 'Objective', details: '3 years functional testing seeking senior test analyst role'
    }));
    expect(result).toContain('Senior Test Analyst');
    expect(result).toContain('3 years');
    expect(result).toContain('requirements analysis');
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
    expect(result).toContain('Experience —');
    expect(result).toContain('Target-role alignment —');
    expect(result).toContain('accessibility');
  });

  it.each([
    ['banking KYC resume', 'KYC and AML controls'],
    ['trade finance SWIFT role', 'UCP 600'],
    ['software testing resume', 'risk-based test planning'],
    ['functional testing UAT', 'requirements analysis'],
    ['automation testing with Selenium', 'automation-framework design'],
    ['IT support engineer', 'incident and service-request management'],
    ['cheque clearing CTS', 'inward and outward clearing'],
    ['software engineer API role', 'maintainable application development'],
    ['data analyst Power BI', 'data preparation and validation'],
    ['cybersecurity SOC analyst', 'security monitoring and investigation'],
    ['project manager PMO', 'risk and dependency management'],
    ['product design Figma', 'user and product discovery'],
    ['accounting general ledger', 'financial reporting and analysis'],
    ['supply chain operations', 'process and capacity management'],
    ['sales business development', 'consultative selling'],
    ['customer service role', 'customer issue resolution'],
    ['human resources talent acquisition', 'talent and employee lifecycle support'],
    ['digital marketing campaign', 'audience and market insight'],
    ['healthcare patient care', 'patient- or service-centred delivery'],
    ['education teacher curriculum', 'learner-centred planning'],
  ])('answers the %s career domain without a paid provider', (question, expected) => {
    const result = generateFreeAIResponse(request('question', { question }));
    expect(result.toLowerCase()).toContain(expected.toLowerCase());
    expect(result).toContain('Evidence that will make the profile credible');
    expect(result).toContain('ATS vocabulary to consider when truthful');
  });

  it('ships at least 20 substantial local career knowledge packs', () => {
    expect(FREE_AI_KNOWLEDGE_DOMAINS).toHaveLength(20);
    FREE_AI_KNOWLEDGE_DOMAINS.forEach(domain => {
      expect(domain.label.length).toBeGreaterThan(5);
      expect(domain.keywords.length).toBeGreaterThanOrEqual(6);
    });
  });

  it('prioritizes the domain in the question over unrelated resume context', () => {
    const result = generateFreeAIResponse(request('question', { question: 'How should I position a trade finance resume?' }, {
      text: 'Product Designer Figma user research', sections: [{ name: 'Experience' }]
    }));
    expect(result).toContain('Trade Finance professional');
    expect(result).not.toContain('Product Designer');
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
