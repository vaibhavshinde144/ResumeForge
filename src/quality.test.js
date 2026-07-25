import { describe, expect, it } from 'vitest';
import styles from './styles.css?raw';
import {
  buildAIResumeMarkup, buildTaskPrompt, extractResumeContext, parseGrammarCorrections,
  parseStructuredResume
} from './aiEngine';
import { analyzeATS } from './atsEngine';

const DOMAIN_SCENARIOS = [
  {
    label: 'Banking', role: 'Banking Relationship Manager',
    skills: ['Banking', 'KYC', 'AML', 'Credit', 'Portfolio'],
    bullet: 'Managed a banking portfolio of 120 clients using KYC, AML, and credit assessments.',
    job: 'banking kyc aml credit portfolio'
  },
  {
    label: 'Trade Finance', role: 'Trade Finance Specialist',
    skills: ['Trade Finance', 'SWIFT', 'UCP 600', 'Sanctions', 'Export'],
    bullet: 'Processed 350 export transactions through SWIFT with UCP 600 and sanctions controls.',
    job: 'trade finance swift ucp sanctions export'
  },
  {
    label: 'Software Testing', role: 'Software Test Engineer',
    skills: ['Software Testing', 'Selenium', 'Automation', 'Regression', 'Defects'],
    bullet: 'Automated 240 Selenium checks and reduced regression defects by 32%.',
    job: 'software testing selenium automation regression defects'
  },
  {
    label: 'Functional Testing', role: 'Functional Test Analyst',
    skills: ['Functional Testing', 'UAT', 'Test Cases', 'Jira', 'Requirements'],
    bullet: 'Designed 180 functional test cases and coordinated UAT requirements and Jira defects.',
    job: 'functional testing uat cases jira requirements'
  },
  {
    label: 'Information Technology', role: 'IT Support Engineer',
    skills: ['Infrastructure', 'Active Directory', 'Networking', 'Incidents', 'Service'],
    bullet: 'Resolved 500 infrastructure incidents across Active Directory and networking services.',
    job: 'infrastructure active directory networking incidents services'
  },
  {
    label: 'Cheque Department', role: 'Cheque Clearing Officer',
    skills: ['Cheque Clearing', 'CTS', 'Reconciliation', 'Inward', 'Outward'],
    bullet: 'Reconciled 1,200 inward and outward cheque clearing items through CTS controls.',
    job: 'cheque clearing cts reconciliation inward outward'
  },
  {
    label: 'Experienced Professional', role: 'Operations Manager',
    skills: ['Operations', 'Leadership', 'Compliance', 'Process', 'Metrics'],
    bullet: 'Led 45 operations colleagues and improved compliance process metrics by 28%.',
    job: 'operations leadership compliance process metrics'
  }
];

function domainResume(scenario) {
  return parseStructuredResume(JSON.stringify({
    profile: {
      name: `${scenario.label} Candidate`, headline: scenario.role,
      email: 'candidate@example.com', phone: '+91 9876543210', location: 'Mumbai, India',
      links: ['linkedin.com/in/candidate']
    },
    summary: `${scenario.role} with verified experience in ${scenario.skills.join(', ')}.`,
    skills: scenario.skills,
    experience: [{ role: scenario.role, company: 'Verified Employer', location: 'Mumbai', dates: '2020-Present', bullets: [scenario.bullet] }],
    education: [{ qualification: 'Bachelor of Commerce', institution: 'Verified University', dates: '2020', details: [] }]
  }));
}

describe('AI resume domain accuracy pipeline', () => {
  it.each(DOMAIN_SCENARIOS)('preserves supplied $label facts and matches its target vocabulary', scenario => {
    const data = domainResume(scenario);
    const markup = buildAIResumeMarkup(data);
    const report = analyzeATS({ html: markup, jobDescription: scenario.job });

    expect(markup).toContain(scenario.role);
    expect(markup).toContain(scenario.bullet);
    expect(report.keywords.coverage).toBeGreaterThanOrEqual(80);
    expect(report.keywords.missing.length).toBeLessThanOrEqual(1);
    expect(report.score).toBeGreaterThanOrEqual(70);

    const prompt = buildTaskPrompt({
      task: 'full', context: { text: '', pageCount: 0, sections: [] },
      payload: { targetRole: scenario.role, facts: scenario.bullet, skills: scenario.skills }
    });
    expect(prompt).toContain(scenario.role);
    expect(prompt).toContain(scenario.bullet);
    expect(prompt).toContain('Use empty strings or arrays for unknown facts');
  });
});

describe('negative, edge, security, accuracy, performance, and device checks', () => {
  it('rejects malformed AI resume and grammar payloads with useful errors', () => {
    expect(() => parseStructuredResume('not json')).toThrow(/not valid resume JSON/i);
    expect(() => parseStructuredResume('{"profile":,}')).toThrow(/malformed resume JSON/i);
    expect(() => parseGrammarCorrections('{"replacement":"text"}')).toThrow(/valid correction list/i);
    expect(() => parseGrammarCorrections('[broken]')).toThrow(/malformed correction list/i);
  });

  it('escapes injected HTML while preserving international names and text', () => {
    const parsed = parseStructuredResume(JSON.stringify({
      profile: { name: 'Asha Rao <script>alert(1)</script>', headline: 'परीक्षण विशेषज्ञ' },
      summary: 'Résumé quality — बैंकिंग एवं परीक्षण',
      skills: ['SQL & Analytics'],
      additionalSections: [{ name: 'Community <img src=x onerror=alert(1)>', items: ['Safe <b>fact</b>'] }]
    }));
    const markup = buildAIResumeMarkup(parsed);
    const holder = document.createElement('div');
    holder.innerHTML = markup;

    expect(holder.querySelectorAll('script, img[onerror], b')).toHaveLength(0);
    expect(holder.textContent).toContain('Asha Rao <script>alert(1)</script>');
    expect(holder.textContent).toContain('परीक्षण विशेषज्ञ');
    expect(holder.textContent).toContain('Résumé quality');
  });

  it('bounds extracted multi-page context and removes executable or visual noise', () => {
    const longText = 'Verified professional fact '.repeat(3000);
    const pages = Array.from({ length: 10 }, (_, index) => `<script>bad()</script><style>.bad{}</style><svg></svg><section class="resume-section" data-section-name="Page ${index + 1}"><h2>Experience ${index + 1}</h2><p>${longText}</p></section>`);
    const context = extractResumeContext(pages);

    expect(context.pageCount).toBe(10);
    expect(context.text.length).toBeLessThanOrEqual(24000);
    expect(context.sections.length).toBeLessThanOrEqual(80);
    expect(context.text).not.toContain('bad()');
  });

  it('keeps ATS scores explainable and rewards complete, relevant evidence', () => {
    const complete = buildAIResumeMarkup(domainResume(DOMAIN_SCENARIOS[2]));
    const strong = analyzeATS({ html: complete, jobDescription: DOMAIN_SCENARIOS[2].job });
    const incomplete = analyzeATS({ html: '<h1>Candidate</h1><p>Looking for work.</p>', jobDescription: DOMAIN_SCENARIOS[2].job });

    expect(strong.score).toBeGreaterThan(incomplete.score);
    expect(strong.score).toBeLessThanOrEqual(100);
    expect(incomplete.score).toBeGreaterThanOrEqual(0);
    expect(strong.breakdown.every(item => item.score >= 0 && item.score <= item.max)).toBe(true);
    expect(strong.disclaimer).toMatch(/heuristic/i);
  });

  it('processes a substantial local AI and ATS workload within a practical UI budget', () => {
    const started = performance.now();
    for (let index = 0; index < 80; index += 1) {
      const scenario = DOMAIN_SCENARIOS[index % DOMAIN_SCENARIOS.length];
      const markup = buildAIResumeMarkup(domainResume(scenario));
      const report = analyzeATS({ html: markup, jobDescription: scenario.job });
      expect(report.score).toBeGreaterThanOrEqual(70);
    }
    expect(performance.now() - started).toBeLessThan(5000);
  });

  it('contains tablet, phone, print, mobile drawer, and six-action dock layouts', () => {
    expect(styles).toContain('@media (max-width: 1150px)');
    expect(styles).toContain('@media (max-width: 820px)');
    expect(styles).toContain('@media (max-width: 500px)');
    expect(styles).toContain('@media print');
    expect(styles).toMatch(/\.templates-panel\.open, \.customizer-panel\.open/);
    expect(styles).toMatch(/\.ai-assistant-panel \{ top: 102px; bottom: 61px;/);
    expect(styles).toContain('grid-template-columns: 1fr 1fr 58px 1fr 1fr 1fr');
  });

  it('suppresses section-number badges globally and includes responsive import review styles', () => {
    expect(styles).toMatch(/\.resume-page \.section-heading > span \{ display: none !important; \}/);
    expect(styles).toContain('.import-modal');
    expect(styles).toContain('.import-mode-toggle');
    expect(styles).toContain('.imported-visual-page');
    expect(styles).toContain('.imported-exact-lines');
  });
});
