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

const unique = values => [...new Set(values.map(clean).filter(Boolean))];
const capitalize = value => value ? value.charAt(0).toUpperCase() + value.slice(1) : '';
const completeSentence = value => {
  const normalized = capitalize(clean(value).replace(/^I\s+/i, '').replace(/^Responsible for\s+/i, 'Managed '));
  return normalized && !/[.!?]$/.test(normalized) ? `${normalized}.` : normalized;
};

const humanList = values => {
  const items = unique(values);
  if (items.length < 2) return items[0] || '';
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(', ')}, and ${items.at(-1)}`;
};

const titleCase = value => clean(value).split(/\s+/).map(word => {
  if (/^(?:IT|QA|UAT|API|KYC|AML|CTS|SWIFT|ERP|CRM|UI|UX|SQL)$/i.test(word)) return word.toUpperCase();
  return word ? word.charAt(0).toUpperCase() + word.slice(1).toLowerCase() : '';
}).join(' ');

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
    const bullets = (lines.length ? lines : sentences(block)).map(item => professionalizeBullet(item, 'experience')).filter(Boolean);
    return { role: header.title || targetRole, company: header.organization, location: header.location, dates: header.dates, bullets };
  });
  const suppliedAchievements = sentences(achievements).map(item => professionalizeBullet(item, 'achievement')).filter(Boolean);
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
      return { name: clean(name), subtitle: '', bullets: [professionalizeBullet(detail.join(':'), 'project')].filter(Boolean).concat(lines.map(item => professionalizeBullet(item, 'project'))) };
    }
    return { name: parts[0], subtitle: parts.slice(1).join(' | '), bullets: lines.map(item => professionalizeBullet(item, 'project')).filter(Boolean) };
  });
}

function parseCredentials(value) {
  return listItems(value).map(item => {
    const parts = item.split(/\s*\|\s*/).map(clean);
    return { name: parts[0], issuer: parts[1] || '', date: parts[2] || '' };
  });
}

const DOMAIN_PROFILES = [
  {
    id: 'trade-finance', label: 'trade finance operations', professional: 'Trade Finance professional',
    match: /trade finance|letter(?:s)? of credit|documentary credit|documentary collection|\bswift\b|\bucp\s*600\b/i,
    strengths: ['trade-document scrutiny', 'documentary credit and collection workflows', 'SWIFT-enabled processing', 'discrepancy and compliance controls'],
    evidence: ['transaction volumes', 'document discrepancy rates', 'turnaround time', 'operational accuracy', 'sanctions or compliance exceptions'],
    keywords: ['Trade Finance', 'Letters of Credit', 'Documentary Collections', 'SWIFT', 'UCP 600', 'ISBP', 'Sanctions Screening', 'Discrepancy Management'],
  },
  {
    id: 'functional-testing', label: 'functional testing', professional: 'Functional Test Analyst',
    match: /functional test|\buat\b|test scenario|test case|requirements? traceability|business acceptance/i,
    strengths: ['requirements analysis', 'scenario and test-case design', 'end-to-end functional validation', 'defect triage and UAT coordination'],
    evidence: ['requirements coverage', 'test-case volumes', 'defect leakage', 'retest turnaround', 'UAT completion or release readiness'],
    keywords: ['Functional Testing', 'Requirements Analysis', 'Test Scenarios', 'Test Cases', 'RTM', 'Defect Lifecycle', 'UAT', 'Regression Testing'],
  },
  {
    id: 'software-testing', label: 'software quality assurance', professional: 'Software Quality Assurance professional',
    match: /software test|quality assurance|\bqa\b|regression test|system integration test|release validation/i,
    strengths: ['risk-based test planning', 'functional and regression coverage', 'defect analysis', 'release-quality validation'],
    evidence: ['defect detection', 'escaped defects', 'coverage', 'execution cycle time', 'release stability'],
    keywords: ['Quality Assurance', 'Test Planning', 'Regression Testing', 'Integration Testing', 'Defect Management', 'Test Evidence', 'Release Validation'],
  },
  {
    id: 'test-automation', label: 'test automation', professional: 'Test Automation Engineer',
    match: /automation test|selenium|cypress|playwright|appium|testng|cucumber|automated test/i,
    strengths: ['automation-framework design', 'maintainable test scripting', 'CI/CD execution', 'failure analysis and reporting'],
    evidence: ['automation coverage', 'execution time saved', 'flaky-test reduction', 'release frequency', 'maintenance effort'],
    keywords: ['Test Automation', 'Selenium', 'Playwright', 'Cypress', 'API Automation', 'CI/CD', 'Framework Design', 'Regression Suite'],
  },
  {
    id: 'banking', label: 'banking operations', professional: 'Banking Operations professional',
    match: /banking|retail bank|corporate bank|\bkyc\b|\baml\b|account opening|loan operations|credit operations/i,
    strengths: ['regulated transaction processing', 'KYC and AML controls', 'reconciliation and exception handling', 'customer and operational risk management'],
    evidence: ['transaction accuracy', 'service-level attainment', 'exception volumes', 'customer turnaround', 'audit or compliance findings'],
    keywords: ['Banking Operations', 'KYC', 'AML', 'Reconciliation', 'Regulatory Compliance', 'Risk Controls', 'Customer Service', 'Maker-Checker'],
  },
  {
    id: 'cheque-clearing', label: 'cheque-clearing operations', professional: 'Cheque Clearing Operations professional',
    match: /cheque|check clearing|\bcts\b|inward clearing|outward clearing|return clearing/i,
    strengths: ['CTS processing', 'inward and outward clearing', 'return and exception handling', 'reconciliation and maker-checker control'],
    evidence: ['daily instrument volumes', 'return rates', 'reconciliation breaks', 'cut-off compliance', 'processing accuracy'],
    keywords: ['CTS', 'Inward Clearing', 'Outward Clearing', 'Returns Processing', 'Reconciliation', 'Exception Handling', 'Maker-Checker', 'SLA'],
  },
  {
    id: 'it-support', label: 'information-technology service operations', professional: 'IT Support professional',
    match: /information technology|\bit support\b|service desk|desktop support|support engineer|system admin|network support/i,
    strengths: ['incident and service-request management', 'technical troubleshooting', 'access and change controls', 'user communication and documentation'],
    evidence: ['resolution time', 'first-contact resolution', 'ticket backlog', 'service availability', 'user satisfaction'],
    keywords: ['Incident Management', 'Service Requests', 'Troubleshooting', 'Active Directory', 'Networking', 'Access Management', 'Change Control', 'SLA'],
  },
  {
    id: 'software-engineering', label: 'software engineering', professional: 'Software Engineer',
    match: /software engineer|software developer|full.?stack|front.?end|back.?end|java developer|python developer|react developer/i,
    strengths: ['maintainable application development', 'API and data integration', 'code review and testing', 'reliable software delivery'],
    evidence: ['performance', 'availability', 'deployment frequency', 'defect reduction', 'user or transaction scale'],
    keywords: ['Software Development', 'API Design', 'Data Structures', 'Code Review', 'Unit Testing', 'CI/CD', 'Performance', 'Agile'],
  },
  {
    id: 'data-analytics', label: 'data analytics', professional: 'Data Analyst',
    match: /data analy|business intelligence|power bi|tableau|data visual|\bsql\b|reporting analyst/i,
    strengths: ['data preparation and validation', 'analytical modelling', 'dashboard and report design', 'decision-focused insight communication'],
    evidence: ['reporting time saved', 'data-quality improvement', 'adoption', 'forecast accuracy', 'business value influenced'],
    keywords: ['Data Analysis', 'SQL', 'Power BI', 'Tableau', 'Data Visualization', 'Dashboarding', 'Data Quality', 'Stakeholder Reporting'],
  },
  {
    id: 'cybersecurity', label: 'cybersecurity', professional: 'Cybersecurity professional',
    match: /cyber|information security|soc analyst|security operation|vulnerability|penetration test|siem/i,
    strengths: ['security monitoring and investigation', 'vulnerability and risk assessment', 'incident response', 'control documentation and remediation'],
    evidence: ['alert volumes', 'mean time to respond', 'vulnerability closure', 'control coverage', 'audit findings'],
    keywords: ['Cybersecurity', 'SIEM', 'Incident Response', 'Vulnerability Management', 'Risk Assessment', 'Security Controls', 'Threat Analysis'],
  },
  {
    id: 'project-management', label: 'project and programme delivery', professional: 'Project Management professional',
    match: /project manag|program manag|programme manag|pmo|scrum master|delivery manager/i,
    strengths: ['scope and delivery planning', 'risk and dependency management', 'stakeholder governance', 'cross-functional execution'],
    evidence: ['budget', 'schedule variance', 'milestones delivered', 'risk closure', 'business adoption'],
    keywords: ['Project Management', 'Planning', 'RAID', 'Stakeholder Management', 'Governance', 'Agile', 'Budget', 'Change Management'],
  },
  {
    id: 'product-design', label: 'product and user-experience design', professional: 'Product Designer',
    match: /product design|\bux\b|\bui\b|figma|interaction design|user research|design system/i,
    strengths: ['user and product discovery', 'interaction and visual design', 'prototyping and usability validation', 'accessible design-system thinking'],
    evidence: ['task success', 'conversion', 'adoption', 'time on task', 'design-system reuse'],
    keywords: ['User Research', 'Interaction Design', 'Prototyping', 'Figma', 'Design Systems', 'Accessibility', 'Usability Testing'],
  },
  {
    id: 'finance-accounting', label: 'finance and accounting', professional: 'Finance and Accounting professional',
    match: /accounting|accountant|financial analy|general ledger|accounts payable|accounts receivable|month.?end close|audit/i,
    strengths: ['financial reporting and analysis', 'ledger and reconciliation control', 'close and audit support', 'variance and process analysis'],
    evidence: ['close-cycle time', 'reconciliation accuracy', 'working capital', 'cost reduction', 'audit adjustments'],
    keywords: ['Financial Reporting', 'General Ledger', 'Reconciliation', 'Variance Analysis', 'Month-End Close', 'Audit', 'Accounts Payable', 'Accounts Receivable'],
  },
  {
    id: 'operations', label: 'business and supply-chain operations', professional: 'Operations professional',
    match: /operations manag|business operations|supply chain|logistics|procurement|inventory|warehouse/i,
    strengths: ['process and capacity management', 'supplier or workflow coordination', 'quality and control improvement', 'service-level delivery'],
    evidence: ['cycle time', 'throughput', 'inventory accuracy', 'cost', 'service-level attainment'],
    keywords: ['Operations Management', 'Process Improvement', 'Supply Chain', 'Logistics', 'Procurement', 'Inventory', 'SLA', 'Quality Control'],
  },
  {
    id: 'sales', label: 'sales and business development', professional: 'Sales and Business Development professional',
    match: /sales|business development|account executive|relationship manager|revenue growth|pipeline/i,
    strengths: ['consultative selling', 'pipeline and account development', 'commercial negotiation', 'customer relationship management'],
    evidence: ['revenue', 'pipeline value', 'conversion', 'retention', 'account growth'],
    keywords: ['Business Development', 'Consultative Selling', 'Pipeline Management', 'Negotiation', 'Account Management', 'CRM', 'Revenue Growth'],
  },
  {
    id: 'customer-service', label: 'customer service', professional: 'Customer Service professional',
    match: /customer service|customer support|call cent|contact cent|client service|customer success/i,
    strengths: ['customer issue resolution', 'clear multichannel communication', 'case ownership', 'service-quality improvement'],
    evidence: ['customer satisfaction', 'first-contact resolution', 'response time', 'case volume', 'retention'],
    keywords: ['Customer Service', 'Issue Resolution', 'Case Management', 'Customer Satisfaction', 'SLA', 'Escalation Management', 'CRM'],
  },
  {
    id: 'human-resources', label: 'human resources and talent', professional: 'Human Resources professional',
    match: /human resources|\bhr\b|talent acquisition|recruit|employee relations|learning and development|payroll/i,
    strengths: ['talent and employee lifecycle support', 'policy and process administration', 'stakeholder advisory', 'people-data and compliance discipline'],
    evidence: ['time to hire', 'retention', 'case turnaround', 'training completion', 'payroll or data accuracy'],
    keywords: ['Human Resources', 'Talent Acquisition', 'Employee Relations', 'HR Operations', 'Policy', 'Onboarding', 'Learning and Development'],
  },
  {
    id: 'marketing', label: 'marketing and communications', professional: 'Marketing professional',
    match: /marketing|digital campaign|content strateg|seo|social media|brand management|communications/i,
    strengths: ['audience and market insight', 'campaign planning and execution', 'content and channel optimisation', 'performance analysis'],
    evidence: ['reach', 'engagement', 'qualified leads', 'conversion', 'return on campaign spend'],
    keywords: ['Marketing Strategy', 'Campaign Management', 'Content Marketing', 'SEO', 'Social Media', 'Analytics', 'Lead Generation', 'Brand'],
  },
  {
    id: 'healthcare', label: 'healthcare delivery', professional: 'Healthcare professional',
    match: /healthcare|hospital|clinical|patient care|nurs|medical|pharma/i,
    strengths: ['patient- or service-centred delivery', 'accurate documentation', 'multidisciplinary coordination', 'quality and safety compliance'],
    evidence: ['patient volumes', 'quality indicators', 'turnaround time', 'documentation accuracy', 'safety outcomes'],
    keywords: ['Patient Care', 'Clinical Documentation', 'Quality and Safety', 'Care Coordination', 'Compliance', 'Healthcare Operations'],
  },
  {
    id: 'education', label: 'education and learning', professional: 'Education professional',
    match: /teacher|teaching|education|lecturer|faculty|curriculum|instructional design|trainer/i,
    strengths: ['learner-centred planning', 'instruction and facilitation', 'assessment and feedback', 'curriculum or learning-content development'],
    evidence: ['learner attainment', 'engagement', 'completion', 'curriculum coverage', 'feedback scores'],
    keywords: ['Teaching', 'Curriculum', 'Assessment', 'Learning Design', 'Classroom Management', 'Facilitation', 'Learner Engagement'],
  },
];

export const FREE_AI_KNOWLEDGE_DOMAINS = DOMAIN_PROFILES.map(({ id, label, keywords }) => ({ id, label, keywords: [...keywords] }));

const DOMAIN_VALUE = {
  'trade-finance': 'accurate and compliant transaction processing',
  'functional-testing': 'traceable requirements coverage and business-ready releases',
  'software-testing': 'consistent product quality and release confidence',
  'test-automation': 'faster repeatable validation and dependable delivery feedback',
  banking: 'controlled operations, regulatory compliance, and dependable customer service',
  'cheque-clearing': 'accurate clearing, timely reconciliation, and effective exception control',
  'it-support': 'service reliability, timely resolution, and positive user outcomes',
  'software-engineering': 'maintainable systems, reliable delivery, and scalable user value',
  'data-analytics': 'trusted insight, efficient reporting, and better-informed decisions',
  cybersecurity: 'stronger security controls, timely response, and risk reduction',
  'project-management': 'predictable delivery, transparent governance, and stakeholder alignment',
  'product-design': 'usable, accessible, and coherent product experiences',
  'finance-accounting': 'accurate reporting, effective controls, and informed financial decisions',
  operations: 'efficient workflows, dependable service levels, and continuous improvement',
  sales: 'sustainable pipeline development, customer value, and commercial growth',
  'customer-service': 'timely resolution, service consistency, and customer trust',
  'human-resources': 'reliable people operations, employee experience, and policy compliance',
  marketing: 'relevant audience engagement, accountable campaigns, and commercial impact',
  healthcare: 'safe, coordinated, and patient-centred service delivery',
  education: 'effective learning experiences, learner progress, and inclusive engagement',
};

const detectDomains = value => DOMAIN_PROFILES.filter(profile => profile.match.test(clean(value)));
const extractYears = value => {
  const match = clean(value).match(/\b(\d+(?:\.\d+)?)\s*\+?\s*(?:years?|yrs?)\b/i);
  return match ? `${match[1]}${/\+/.test(match[0]) ? '+' : ''} years` : '';
};

const extractRole = value => {
  const match = clean(value).match(/\b((?:(?:senior|lead|principal|junior|associate|certified|experienced|functional|technical|business|software|trade|finance|banking|quality|test|product|project|data|security|operations|customer|support|full.?stack|front.?end|back.?end)\s+){0,5}(?:analyst|manager|specialist|engineer|consultant|officer|executive|developer|designer|tester|lead|associate|administrator|accountant|coordinator|professional))\b/i);
  return match ? titleCase(match[1].replace(/^experienced\s+/i, '')) : '';
};

const deriveProfessionalTitle = (domains, suppliedRole) => {
  if (suppliedRole) return titleCase(suppliedRole);
  const has = id => domains.some(domain => domain.id === id);
  if (has('trade-finance') && (has('functional-testing') || has('software-testing'))) return 'Trade Finance and Quality Assurance professional';
  if (has('functional-testing') && has('software-testing')) return 'Software Quality Assurance professional';
  if (domains.length === 1) return domains[0].professional;
  if (domains.length > 1) return `Multidisciplinary ${humanList(domains.slice(0, 2).map(domain => domain.label))} professional`;
  return 'Results-oriented professional';
};

const scopePhrase = value => {
  const source = clean(value).replace(/[.!?]+$/, '').replace(/^I\s+/i, '');
  const mappings = [
    [/^validat(?:e|es|ed|ing)\s+(.+)/i, 'validation of $1'],
    [/^coordinat(?:e|es|ed|ing)\s+(.+)/i, 'coordination of $1'],
    [/^manag(?:e|es|ed|ing)\s+(.+)/i, 'management of $1'],
    [/^design(?:s|ed|ing)?\s+(.+)/i, 'design of $1'],
    [/^test(?:s|ed|ing)?\s+(.+)/i, 'testing of $1'],
    [/^support(?:s|ed|ing)?\s+(.+)/i, 'support for $1'],
    [/^review(?:s|ed|ing)?\s+(.+)/i, 'review of $1'],
    [/^process(?:es|ed|ing)?\s+(.+)/i, 'processing of $1'],
  ];
  const found = mappings.find(([pattern]) => pattern.test(source));
  return found ? source.replace(found[0], found[1]).toLowerCase() : source.toLowerCase();
};

const explicitScope = value => sentences(correctFreeAIText(value)).filter(sentence => {
  const plain = sentence.replace(/[.!?]+$/, '');
  return !/^(?:i\s+)?(?:have|bring|possess)\s+\d+\+?\s+years?\s+(?:of\s+)?experience/i.test(plain)
    && !/^(?:i\s+)?(?:have|bring|possess)\s+experience\s+in\s+/i.test(plain);
}).map(scopePhrase).filter(Boolean);

function professionalSummary(details, options = {}) {
  const corrected = correctFreeAIText(details);
  const combined = [corrected, options.targetRole, options.industry, options.skills].map(clean).filter(Boolean).join(' | ');
  const domains = detectDomains(combined);
  const years = extractYears(options.experienceYears) || extractYears(corrected);
  const suppliedRole = clean(options.targetRole) || extractRole(corrected);
  const title = deriveProfessionalTitle(domains, suppliedRole);
  const labels = domains.map(domain => domain.label);
  const openingQualifier = /executive|strategic/i.test(options.tone) ? 'Strategic' : domains.length > 1 ? 'Versatile' : 'Accomplished';
  const opening = `${openingQualifier} ${title}${years ? ` with ${years} of experience` : ''}${labels.length ? ` spanning ${humanList(labels.slice(0, 3))}` : ''}.`;
  const strengthSet = unique(domains.flatMap(domain => domain.strengths.slice(0, domains.length > 1 ? 2 : 4))).slice(0, 5);
  const valueSet = unique(domains.map(domain => DOMAIN_VALUE[domain.id])).slice(0, 3);
  const capability = strengthSet.length
    ? `Combines ${humanList(strengthSet)} to support ${humanList(valueSet.length ? valueSet : ['quality', 'delivery reliability', 'stakeholder confidence'])}.`
    : corrected;
  const suppliedScope = explicitScope(corrected).slice(0, 4);
  const scope = suppliedScope.length ? `Documented scope includes ${humanList(suppliedScope)}.` : '';
  const closingByTone = /technical|precise/i.test(options.tone)
    ? 'Applies a structured, evidence-led approach to requirements, controls, validation, issue resolution, and continuous improvement.'
    : /people|warm/i.test(options.tone)
      ? 'Known for a collaborative, detail-conscious approach that connects stakeholder needs with dependable service and quality outcomes.'
      : /executive|strategic/i.test(options.tone)
        ? 'Brings a risk-aware, cross-functional perspective to aligning operational priorities, delivery quality, and measurable business value.'
        : 'Brings a structured, detail-oriented approach to translating business needs into reliable, compliant, and high-quality outcomes.';
  const limit = clean(options.length) === 'detailed' ? 5 : clean(options.length) === 'standard' ? 4 : 3;
  return [opening, capability, scope, closingByTone].filter(Boolean).slice(0, limit).join(' ');
}

const BULLET_CONTEXT = [
  { match: /test cases?/i, suffix: 'to improve requirements coverage and execution consistency' },
  { match: /\buat\b/i, suffix: 'to support business validation and release readiness' },
  { match: /defects?|bugs?/i, suffix: 'with clear evidence, prioritisation, retesting, and closure tracking' },
  { match: /\bswift\b/i, suffix: 'in line with documented trade-finance procedures and control requirements' },
  { match: /discrepanc|document scrutiny/i, suffix: 'to support accurate and compliant transaction processing' },
  { match: /reconcil/i, suffix: 'while investigating exceptions and maintaining an auditable control trail' },
  { match: /stakeholder|cross-functional/i, suffix: 'to align requirements, decisions, dependencies, and delivery expectations' },
  { match: /requirements?/i, suffix: 'and translated them into clear, traceable delivery or validation criteria' },
];

function professionalizeBullet(value, sectionName = '') {
  let text = clean(value).replace(/^[-*\s]+/, '').replace(/[.!?]+$/, '').replace(/^I\s+/i, '');
  if (!text) return '';
  const replacements = [
    [/^responsible for\s+/i, 'Managed '], [/^worked on\s+/i, 'Contributed to '], [/^helped (?:with|to)?\s*/i, 'Supported '],
    [/^handled\s+/i, 'Managed '], [/^did\s+/i, 'Executed '], [/^involved in\s+/i, 'Supported '],
    [/^participated in\s+/i, 'Collaborated on '], [/^made\s+/i, 'Developed '], [/^was part of\s+/i, 'Contributed to '],
  ];
  replacements.forEach(([pattern, replacement]) => { text = text.replace(pattern, replacement); });
  text = capitalize(text);
  const enrichment = BULLET_CONTEXT.find(item => item.match.test(text));
  if (enrichment && !/[;,]\s*(?:to|while|with|by|through)\b/i.test(text) && text.split(/\s+/).length < 18) text += `, ${enrichment.suffix}`;
  const beginsWithAction = /^(?:Led|Managed|Designed|Developed|Delivered|Built|Created|Implemented|Improved|Reduced|Increased|Coordinated|Validated|Mapped|Analysed|Analyzed|Executed|Tested|Reviewed|Processed|Resolved|Supported|Collaborated|Contributed|Automated|Migrated|Launched|Optimised|Optimized)\b/i.test(text);
  if (/project/i.test(sectionName) && text.split(/\s+/).length < 4 && !enrichment && !beginsWithAction) text = `Delivered ${text.charAt(0).toLowerCase()}${text.slice(1)}`;
  return completeSentence(text);
}

function localResume(payload = {}) {
  const skills = listItems(payload.skills, true);
  const experience = parseExperience(payload.careerHistory, clean(payload.targetRole), payload.achievements);
  const summary = professionalSummary('', {
    targetRole: payload.targetRole, industry: payload.industry, experienceYears: payload.experienceYears,
    skills: payload.skills, tone: 'confident and concise', length: 'standard',
  });
  const additional = listItems(payload.additionalDetails);
  const additionalSections = [];
  if (!experience.length && clean(payload.achievements)) additionalSections.push({ name: 'Career Highlights', items: sentences(payload.achievements).map(item => professionalizeBullet(item, 'achievement')) });
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

function objectiveText(details, payload = {}) {
  const corrected = correctFreeAIText(details);
  const role = clean(payload.targetRole) || extractRole(corrected);
  const domains = detectDomains(corrected);
  const years = extractYears(corrected);
  const capabilities = unique(domains.flatMap(domain => domain.strengths.slice(0, 2))).slice(0, 4);
  const value = humanList(capabilities.length ? capabilities : explicitScope(corrected).slice(0, 3)) || 'transferable professional capabilities';
  return `Seeking${role ? ` a ${titleCase(role)} opportunity` : ' an opportunity'} to apply ${value}${years ? `, supported by ${years} of relevant experience` : ''}. Focused on contributing dependable execution, continuous improvement, and measurable value while developing deeper role-specific expertise.`;
}

function localSection(request = {}) {
  const payload = request.payload || request;
  const name = clean(payload.section) || 'Resume section';
  const details = clean(payload.details);
  if (!details) return 'Add verified facts before generating this section.';
  if (/objective/i.test(name)) return objectiveText(details, payload);
  if (/summary|profile|about/i.test(name)) return professionalSummary(details, payload);
  if (/skill|language|keyword|tool|technolog/i.test(name)) return unique(listItems(details, true)).map(item => `- ${titleCase(item)}`).join('\n');
  if (BULLET_SECTIONS.test(name)) return sentences(details).map(item => `- ${professionalizeBullet(item, name)}`).join('\n');
  const polished = sentences(details).map(item => professionalizeBullet(item, name));
  return polished.join(clean(payload.length) === 'detailed' ? '\n\n' : ' ');
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
  if (!/@/.test(text) || !/\+?\d[\d\s()-]{7,}/.test(text)) recommendations.push('Contact details — add a professional email address and reachable phone number; verify every character and link before export.');
  if (!has('summary') && !has('objective')) recommendations.push('Opening profile — add a tailored 60–90 word summary that connects experience level, target role, domain strengths, and supported value.');
  if (!has('experience')) recommendations.push('Experience — add verified employers, roles, dates, scope, actions, tools, controls, stakeholders, and outcomes.');
  if (!/\b\d+(?:[.,]\d+)?%|\b\d+[+]?\b/.test(text)) recommendations.push('Evidence — add truthful scale, volume, time, quality, revenue, cost, risk, or percentage measures where records support them.');
  if (!has('skills') && !has('technical skills')) recommendations.push('Skills — group role-critical domain, technical, analytical, and collaboration capabilities; retain only skills demonstrated elsewhere.');
  if (!has('education')) recommendations.push('Education — include relevant qualifications, institutions, locations where useful, and completion dates.');
  const jobWords = importantWords(request.jobDescription);
  const resumeWords = new Set(importantWords(text));
  const missing = jobWords.filter(word => !resumeWords.has(word)).slice(0, 8);
  if (missing.length) recommendations.push(`Target-role alignment — review these missing vacancy terms and add only those that accurately describe your background: ${missing.join(', ')}.`);
  const domains = detectDomains(`${text} ${request.jobDescription}`);
  if (domains.length) recommendations.push(`Domain evidence — for ${humanList(domains.slice(0, 2).map(item => item.label))}, prioritise verified measures such as ${humanList(unique(domains.flatMap(item => item.evidence)).slice(0, 5))}.`);
  recommendations.push('Experience writing — use action + scope + method + outcome. Separate routine responsibilities from improvements, controls, delivery, and measurable impact.');
  recommendations.push('Readability — keep dates, headings, punctuation, terminology, and verb tense consistent; prefer direct language and short bullets.');
  recommendations.push('Final factual review — verify every employer, date, qualification, metric, product, link, regulation, and technical term before applying or exporting.');
  return recommendations.slice(0, 10).map((item, index) => `${index + 1}. ${item}`).join('\n');
}

const domainAnswer = (domains, question) => {
  const selected = domains.slice(0, 3);
  const capabilities = unique(selected.flatMap(domain => domain.strengths)).slice(0, 10);
  const evidence = unique(selected.flatMap(domain => domain.evidence)).slice(0, 8);
  const keywords = unique(selected.flatMap(domain => domain.keywords)).slice(0, 16);
  const position = deriveProfessionalTitle(selected, '');
  const asksForResume = /resume|cv|summary|profile|experience|skill|bullet|responsibil/i.test(question);
  return [
    `Recommended professional positioning\n${position} with an evidence-led profile connecting ${humanList(selected.map(domain => domain.label))}. Keep the positioning focused on verified experience rather than listing disconnected keywords.`,
    `Core expertise to emphasise\n${capabilities.map(item => `• ${capitalize(item)}`).join('\n')}`,
    `Evidence that will make the profile credible\nQuantify only from reliable records: ${humanList(evidence)}. Also name the process scope, systems or standards used, stakeholders supported, control performed, issue resolved, and resulting business effect.`,
    asksForResume ? `Professional bullet structure\n• [Action verb] [specific process or deliverable] using [verified method/tool/standard], resulting in [verified quality, time, risk, cost, volume, or customer outcome].\n• [Investigated/coordinated/improved] [specific issue or workflow], strengthening [verified control, coverage, turnaround, accuracy, or release readiness].` : '',
    `ATS vocabulary to consider when truthful\n${keywords.join(' • ')}`,
    `Quality check\nDo not copy every term. Select the capabilities you can prove, show them through achievements or project evidence, and verify every employer, date, product, standard, and metric before use.`,
  ].filter(Boolean).join('\n\n');
};

function localQuestion(request = {}) {
  const question = clean(request.payload?.question);
  const context = request.context || {};
  if (/\bCONNECTION_OK\b/i.test(question)) return 'CONNECTION_OK';
  if (/ats score|applicant tracking|\bats\b/i.test(question)) {
    return 'ATS improvement should be evidence-led, not score-led. First confirm standard headings, readable chronology, contact completeness, and parseable text. Next compare the target job description with the resume and map each truthful requirement to evidence in Summary, Skills, Experience, or Projects. Prioritise must-have domain terms, systems, methods, certifications, and outcomes without keyword stuffing. Use the ATS tab for an explainable local comparison; no score or template can guarantee selection.';
  }
  if (/grammar|spelling|proofread/i.test(question)) return 'Use Review for field, page, or complete-resume corrections. The local engine fixes common spelling, punctuation, capitalisation, spacing, and obvious wording problems while preserving names, dates, technologies, and figures. After correction, manually check tense consistency, parallel bullet structure, domain terminology, and whether each claim remains factually accurate.';
  const questionDomains = detectDomains(question);
  const queryDomains = questionDomains.length ? questionDomains : detectDomains(clean(context.text).slice(0, 4000));
  if (queryDomains.length) return domainAnswer(queryDomains, question);
  if (/summary|objective|professional profile/i.test(question)) return 'Build the opening in three layers: professional identity and experience level; two to five role-relevant strengths; and the value or outcomes those strengths support. Keep a summary to roughly 60–90 words for most experienced candidates. An objective should explain the target direction and transferable value. Avoid first-person wording, unsupported adjectives, generic claims, and skills that are not evidenced elsewhere.';
  if (/experience|bullet|responsibilit|achievement/i.test(question)) return 'Use the structure Action + Scope + Method + Outcome. Begin with a precise verb, name the process or deliverable, explain the tool/control/collaboration where relevant, and close with a verified quality, time, risk, cost, volume, revenue, or customer result. If no metric exists, describe a defensible operational outcome such as improved traceability, clearer governance, reduced rework, stronger compliance, or reliable delivery—only when it is true.';
  if (/project/i.test(question)) return 'A strong project entry covers: project name and purpose; your role and ownership; duration; business or technical context; methods, technologies, standards, and stakeholders; key responsibilities; constraints or risks; deliverables; and verified outcomes. Use two to five bullets, separating what the project was from what you personally contributed.';
  if (/interview/i.test(question)) return 'Prepare a focused evidence bank before practising answers. Select six to eight real STAR examples covering delivery, complex problem solving, quality or risk, stakeholder collaboration, conflict, change, failure or learning, and leadership. For each, record the situation, your personal responsibility, the actions you took, why you chose them, and the verified result. Then adapt the most relevant example to each question without memorising a script.';
  if (/cover letter/i.test(question)) return 'Structure the letter around the employer’s need, not a biography. Open with the target role and a specific reason for fit; connect two or three verified requirements to relevant experience; include one credible outcome; explain the value you would bring; and close directly. Keep it concise, avoid repeating the complete resume, and never invent knowledge of the organisation.';
  const sections = (context.sections || []).map(section => section.name).filter(Boolean);
  return `ResumeForge Free AI is a private, browser-local professional career engine. I can provide detailed help with resume strategy, summaries, experience bullets, projects, skills, ATS alignment, career domains, interview preparation, and cover letters${sections.length ? ` using the visible resume sections: ${sections.join(', ')}` : ''}. For a deeper answer, include the target role or industry, experience level, verified responsibilities, tools or standards, and the outcome you want to communicate. Current news, laws, prices, and unrestricted general-world research require an optional connected research provider.`;
}

export function generateFreeAIResponse(request) {
  if (typeof request === 'string') return /CONNECTION_OK/i.test(request) ? 'CONNECTION_OK' : localQuestion({ payload: { question: request } });
  const task = request?.task || 'question';
  if (task === 'full') return JSON.stringify(localResume(request.payload), null, 2);
  if (task === 'section') return localSection(request);
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
  return { text, sources: [], provider: 'ResumeForge Free AI', model: 'On-device Professional Career Engine 2.0', raw: { local: true, task: request?.task || 'question', knowledgeDomains: FREE_AI_KNOWLEDGE_DOMAINS.length } };
}
