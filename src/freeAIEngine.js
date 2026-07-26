const clean = value => String(value ?? '').replace(/\r/g, '').trim();

const listItems = (value, splitCommas = false) => {
  const separator = splitCommas ? /\n|;|,|\u2022/ : /\n|;|\u2022/;
  return clean(value).split(separator).map(item => item.replace(/^[-*\s]+/, '').trim()).filter(Boolean);
};

const sentences = value => {
  const lines = listItems(value);
  if (lines.length !== 1) return lines;
  return lines[0].split(/(?<=[.!?])\s+(?=[A-Z0-9])/).map(item => item.trim()).filter(Boolean);
};

const capitalize = value => value ? value.charAt(0).toUpperCase() + value.slice(1) : '';
const completeSentence = value => {
  const normalized = capitalize(clean(value).replace(/^I\s+/i, '').replace(/^Responsible for\s+/i, 'Managed '));
  return normalized && !/[.!?]$/.test(normalized) ? `${normalized}.` : normalized;
};

const parseHeader = (value, fallbackTitle = '') => {
  const header = clean(value);
  const pipeParts = header.split(/\s*\|\s*/).filter(Boolean);
  if (pipeParts.length > 1) return { title: pipeParts[0], organization: pipeParts[1] || '', location: pipeParts[2] || '', dates: pipeParts[3] || '' };
  const atMatch = header.match(/^(.+?)\s+at\s+(.+?)(?:\s*[|,]\s*(.+))?$/i);
  if (atMatch) return { title: atMatch[1], organization: atMatch[2], location: '', dates: atMatch[3] || '' };
  return { title: fallbackTitle, organization: '', location: '', dates: '' };
};

function parseExperience(value, targetRole, achievements) {
  const history = clean(value);
  if (!history) return [];
  const blocks = history.split(/\n\s*\n/).map(clean).filter(Boolean);
  const result = blocks.map(block => {
    const lines = listItems(block);
    const headerLooksStructured = /\||\s+at\s+/i.test(lines[0] || '');
    const header = parseHeader(headerLooksStructured ? lines.shift() : '', targetRole);
    const bullets = (lines.length ? lines : sentences(block)).map(completeSentence).filter(Boolean);
    return { role: header.title || targetRole, company: header.organization, location: header.location, dates: header.dates, bullets };
  });
  const suppliedAchievements = sentences(achievements).map(completeSentence).filter(Boolean);
  if (result[0] && suppliedAchievements.length) result[0].bullets.push(...suppliedAchievements.filter(item => !result[0].bullets.includes(item)));
  return result;
}

function parseEducation(value) {
  return listItems(value).map(item => {
    const parts = item.split(/\s*\|\s*/).map(clean);
    return { qualification: parts[0], institution: parts[1] || '', location: parts[2] || '', dates: parts[3] || '', details: [] };
  });
}

function parseProjects(value) {
  return clean(value).split(/\n\s*\n/).map(clean).filter(Boolean).map(block => {
    const lines = listItems(block);
    const first = lines.shift() || 'Project';
    const parts = first.split(/\s*\|\s*/).map(clean);
    if (parts.length === 1 && first.includes(':')) {
      const [name, ...detail] = first.split(':');
      return { name: clean(name), subtitle: '', bullets: [completeSentence(detail.join(':'))].filter(Boolean).concat(lines.map(completeSentence)) };
    }
    return { name: parts[0], subtitle: parts.slice(1).join(' | '), bullets: lines.map(completeSentence).filter(Boolean) };
  });
}

function parseCredentials(value) {
  return listItems(value).map(item => {
    const parts = item.split(/\s*\|\s*/).map(clean);
    return { name: parts[0], issuer: parts[1] || '', date: parts[2] || '' };
  });
}

function localResume(payload = {}) {
  const skills = listItems(payload.skills, true);
  const experience = parseExperience(payload.careerHistory, clean(payload.targetRole), payload.achievements);
  const descriptor = [
    clean(payload.targetRole) || 'Professional',
    clean(payload.experienceYears) ? `with ${clean(payload.experienceYears)} of experience` : '',
    clean(payload.industry) ? `in ${clean(payload.industry)}` : '',
  ].filter(Boolean).join(' ');
  const strengths = skills.length ? ` Brings documented strengths in ${skills.slice(0, 5).join(', ')}.` : '';
  const summary = `${descriptor}.${strengths}`.replace(/\.\s*\./g, '.').trim();
  const additional = listItems(payload.additionalDetails);
  const additionalSections = [];
  if (!experience.length && clean(payload.achievements)) additionalSections.push({ name: 'Career Highlights', items: sentences(payload.achievements).map(completeSentence) });
  if (additional.length) additionalSections.push({ name: 'Additional Information', items: additional.map(completeSentence) });
  return {
    profile: {
      name: clean(payload.name), headline: clean(payload.targetRole), email: clean(payload.email),
      phone: clean(payload.phone), location: clean(payload.location), links: listItems(payload.links, true),
    },
    summary,
    skills,
    experience,
    education: parseEducation(payload.education),
    projects: parseProjects(payload.projects),
    certifications: parseCredentials(payload.certifications),
    awards: [],
    languages: listItems(payload.languages, true),
    additionalSections,
  };
}

const BULLET_SECTIONS = /experience|project|achievement|award|skill|certif|responsibil|accomplishment|volunteer|publication|training|workshop|leadership/i;

function localSection(payload = {}) {
  const name = clean(payload.section) || 'Resume section';
  const details = clean(payload.details);
  if (!details) return 'Add verified facts before generating this section.';
  if (/summary|objective|profile|about/i.test(name)) {
    const text = correctFreeAIText(details);
    return clean(payload.length) === 'concise' ? text.split(/(?<=[.!?])\s+/).slice(0, 3).join(' ') : text;
  }
  if (/skill|language|keyword|tool|technolog/i.test(name)) return listItems(details, true).map(item => `- ${capitalize(item)}`).join('\n');
  if (BULLET_SECTIONS.test(name)) return sentences(details).map(item => `- ${completeSentence(item)}`).join('\n');
  return sentences(details).map(completeSentence).join('\n\n');
}

const CORRECTION_RULES = [
  [/\bteh\b/gi, 'the', 'Corrected spelling'],
  [/\brecieve(d|s|ing)?\b/gi, 'receive$1', 'Corrected spelling'],
  [/\bresponsibilites\b/gi, 'responsibilities', 'Corrected spelling'],
  [/\btechinical\b/gi, 'technical', 'Corrected spelling'],
  [/\bexperiance\b/gi, 'experience', 'Corrected spelling'],
  [/\bmangement\b/gi, 'management', 'Corrected spelling'],
  [/\bdevelopement\b/gi, 'development', 'Corrected spelling'],
  [/\bacheived\b/gi, 'achieved', 'Corrected spelling'],
  [/\bsucessfully\b/gi, 'successfully', 'Corrected spelling'],
  [/\bseperate\b/gi, 'separate', 'Corrected spelling'],
  [/\benviroment\b/gi, 'environment', 'Corrected spelling'],
  [/\balot\b/gi, 'a lot', 'Corrected word form'],
  [/\bi\b/g, 'I', 'Capitalized first-person pronoun'],
  [/\s+([,.;:!?])/g, '$1', 'Removed incorrect punctuation spacing'],
  [/ {2,}/g, ' ', 'Removed repeated spacing'],
];

function replacementFor(match, rule) {
  const flags = rule[0].flags.replace('g', '');
  return match.replace(new RegExp(rule[0].source, flags), rule[1]);
}

export function correctFreeAIText(value) {
  let result = clean(value);
  CORRECTION_RULES.forEach(([pattern, replacement]) => { result = result.replace(pattern, replacement); });
  result = result.replace(/(^|[.!?]\s+)([a-z])/g, (_, prefix, letter) => `${prefix}${letter.toUpperCase()}`);
  if (result.split(/\s+/).length > 5 && !/[.!?]$/.test(result)) result += '.';
  return result;
}

export function freeAIGrammarCorrections(value) {
  const source = String(value ?? '');
  const found = [];
  CORRECTION_RULES.forEach(rule => {
    const matches = source.matchAll(rule[0]);
    for (const match of matches) {
      const replacement = replacementFor(match[0], rule);
      if (match[0] !== replacement && !found.some(item => item.original === match[0] && item.replacement === replacement)) {
        found.push({ original: match[0], replacement, reason: rule[2] });
      }
    }
  });
  return found;
}

const importantWords = value => [...new Set(clean(value).toLowerCase().match(/[a-z][a-z0-9+#.-]{2,}/g) || [])]
  .filter(word => !['and','the','with','for','from','that','this','are','your','you','our','job','role','work','have','has'].includes(word));

function localSuggestions(request = {}) {
  const context = request.context || {};
  const text = clean(context.text);
  const sectionNames = (context.sections || []).map(section => clean(section.name).toLowerCase());
  const has = name => sectionNames.some(section => section.includes(name));
  const recommendations = [];
  if (!/@/.test(text) || !/\+?\d[\d\s()-]{7,}/.test(text)) recommendations.push('Contact details: add a professional email address and reachable phone number.');
  if (!has('summary') && !has('objective')) recommendations.push('Opening profile: add a concise summary or objective aligned to the target role.');
  if (!has('experience')) recommendations.push('Experience: add verified employers, roles, dates, responsibilities, and outcomes.');
  if (!/\b\d+(?:[.,]\d+)?%|\b\d+[+]?\b/.test(text)) recommendations.push('Evidence: add truthful scale, volume, time, quality, revenue, cost, or percentage measures where available.');
  if (!has('skills') && !has('technical skills')) recommendations.push('Skills: add a focused skills section containing only capabilities you can demonstrate.');
  if (!has('education')) recommendations.push('Education: include relevant qualifications, institutions, and completion dates.');
  const jobWords = importantWords(request.jobDescription);
  const resumeWords = new Set(importantWords(text));
  const missing = jobWords.filter(word => !resumeWords.has(word)).slice(0, 8);
  if (missing.length) recommendations.push(`Target role alignment: review these missing job-description terms and add only those that are truthful: ${missing.join(', ')}.`);
  recommendations.push('Experience writing: begin bullets with clear action verbs and separate responsibilities from measurable outcomes.');
  recommendations.push('Readability: keep dates, headings, punctuation, and verb tense consistent throughout the document.');
  recommendations.push('Targeting: place the most role-relevant evidence in the upper half of the first page and remove repeated low-value content.');
  recommendations.push('Skills evidence: support important skills with matching examples in experience or project bullets.');
  recommendations.push('Final quality check: verify every employer, date, qualification, metric, link, and technical term before exporting.');
  return recommendations.slice(0, 10).map((item, index) => `${index + 1}. ${item}`).join('\n');
}

const DOMAIN_GUIDANCE = [
  { match: /trade finance|swift|letter of credit|ucp/i, label: 'trade-finance', skills: ['letters of credit', 'documentary collections', 'SWIFT', 'UCP 600', 'sanctions screening', 'trade documentation', 'discrepancy handling'] },
  { match: /cheque|check clearing|cts/i, label: 'cheque-clearing', skills: ['CTS operations', 'inward and outward clearing', 'return processing', 'reconciliation', 'exception handling', 'maker-checker controls', 'service-level compliance'] },
  { match: /functional test|uat|test case/i, label: 'functional-testing', skills: ['requirements analysis', 'test scenarios', 'test cases', 'defect lifecycle', 'UAT', 'Jira', 'traceability'] },
  { match: /software test|qa|quality assurance|selenium|automation test/i, label: 'software-testing', skills: ['test planning', 'functional and regression testing', 'automation', 'API testing', 'defect reporting', 'test evidence', 'release validation'] },
  { match: /bank|kyc|aml|credit|loan/i, label: 'banking', skills: ['KYC and AML controls', 'customer service', 'account operations', 'credit assessment', 'regulatory compliance', 'reconciliation', 'risk controls'] },
  { match: /information technology|\bit\b|support engineer|network|system admin/i, label: 'information-technology', skills: ['incident management', 'service requests', 'troubleshooting', 'networking', 'access management', 'change control', 'documentation'] },
  { match: /product design|ux|ui|figma/i, label: 'product-design', skills: ['user research', 'interaction design', 'prototyping', 'design systems', 'accessibility', 'usability testing', 'stakeholder collaboration'] },
  { match: /project/i, label: 'project', skills: ['project objective', 'role and ownership', 'duration', 'methods and technologies', 'deliverables', 'constraints', 'measurable outcome'] },
];

function localQuestion(request = {}) {
  const question = clean(request.payload?.question);
  const context = request.context || {};
  if (/\bCONNECTION_OK\b/i.test(question)) return 'CONNECTION_OK';
  if (/ats score|applicant tracking|\bats\b/i.test(question)) {
    return 'Use the ATS tab to compare the resume with a target job description. Improve missing contact details, section completeness, relevant keyword coverage, readable headings, and evidence-based experience bullets. Add a keyword only when it accurately reflects your experience; no ATS score guarantees selection.';
  }
  if (/grammar|spelling|proofread/i.test(question)) return 'Open Review, select Current field, Current page, or Entire resume, and run Grammar and clarity. The free engine corrects common spelling, punctuation, capitalization, and spacing while preserving supplied names, dates, technologies, and metrics.';
  if (/summary|objective/i.test(question)) return 'A strong opening states the target role, years or level of experience, domain, two to four relevant strengths, and the value you can deliver. Keep it concise and include only facts you can support elsewhere in the resume.';
  const domain = DOMAIN_GUIDANCE.find(item => item.match.test(question));
  if (domain) return `For a ${domain.label} resume, consider these evidence areas: ${domain.skills.join(', ')}. Turn each verified responsibility into an action-and-outcome bullet, including genuine volume, accuracy, turnaround time, risk, quality, or customer measures when available. Do not claim any skill or metric you cannot verify.`;
  if (/interview/i.test(question)) return 'Prepare concise STAR examples: situation, task, action, and result. Select examples covering delivery, problem solving, collaboration, quality, conflict, and learning. Use only real examples and quantify outcomes when you have evidence.';
  if (/cover letter/i.test(question)) return 'Build the letter around the target role, two or three verified matches from your experience, one relevant outcome, and a direct closing. Avoid repeating the entire resume or adding unsupported claims.';
  const sections = (context.sections || []).map(section => section.name).filter(Boolean);
  return `ResumeForge Free AI works offline for resume and career guidance. Your current resume contains ${sections.length ? sections.join(', ') : 'no recognized sections yet'}. Ask about a target role, section, skills, ATS improvement, project description, grammar, or interview preparation. Current news, prices, laws, and other live facts require a connected research provider.`;
}

export function generateFreeAIResponse(request) {
  if (typeof request === 'string') return /CONNECTION_OK/i.test(request) ? 'CONNECTION_OK' : localQuestion({ payload: { question: request } });
  const task = request?.task || 'question';
  if (task === 'full') return JSON.stringify(localResume(request.payload), null, 2);
  if (task === 'section') return localSection(request.payload);
  if (task === 'grammar') {
    const text = request.payload?.text || '';
    return request.payload?.scope === 'field' ? correctFreeAIText(text) : JSON.stringify(freeAIGrammarCorrections(text));
  }
  if (task === 'suggestions') return localSuggestions(request);
  return localQuestion(request);
}

export async function callFreeAI(request, signal) {
  if (signal?.aborted) throw new DOMException('Request cancelled.', 'AbortError');
  const text = generateFreeAIResponse(request);
  return { text, sources: [], provider: 'ResumeForge Free AI', model: 'On-device Career Engine 1.0', raw: { local: true, task: request?.task || 'question' } };
}
