export const FONT_COMPATIBILITY_COUNT = 100000;

export const FONT_CATEGORIES = [
  {
    id: 'sans', label: 'Sans serif', families: [
      'Arial', 'Arial Narrow', 'Aptos', 'Aptos Display', 'Avenir', 'Avenir Next', 'Bahnschrift', 'Calibri', 'Candara', 'Century Gothic',
      'Corbel', 'DM Sans', 'Futura', 'Franklin Gothic Book', 'Franklin Gothic Medium', 'Frutiger', 'Gill Sans', 'Helvetica', 'Helvetica Neue', 'Inter',
      'Lato', 'Libre Franklin', 'Lucida Grande', 'Montserrat', 'Myriad Pro', 'Noto Sans', 'Open Sans', 'Optima', 'Proxima Nova', 'Roboto',
      'Segoe UI', 'Source Sans 3', 'Tahoma', 'Trebuchet MS', 'Ubuntu', 'Univers', 'Verdana', 'Work Sans', 'IBM Plex Sans', 'Public Sans'
    ]
  },
  {
    id: 'serif', label: 'Serif', families: [
      'Baskerville', 'Book Antiqua', 'Bookman Old Style', 'Cambria', 'Charter', 'Constantia', 'Didot', 'EB Garamond', 'Garamond', 'Georgia',
      'Hoefler Text', 'IBM Plex Serif', 'Libre Baskerville', 'Libre Caslon Text', 'Lora', 'Merriweather', 'Minion Pro', 'Noto Serif', 'Palatino',
      'Palatino Linotype', 'Playfair Display', 'Rockwell', 'Sabon', 'Source Serif 4', 'Spectral', 'Times', 'Times New Roman', 'Tinos', 'PT Serif', 'Crimson Text'
    ]
  },
  {
    id: 'humanist', label: 'Humanist & editorial', families: [
      'Atkinson Hyperlegible', 'Benton Sans', 'Bitter', 'Cabin', 'Carlito', 'Clear Sans', 'DIN', 'DIN Next', 'Droid Sans', 'Gotham',
      'Humanist 521', 'Jost', 'Karla', 'Lexend', 'Manrope', 'Maven Pro', 'Merriweather Sans', 'Mulish', 'Nunito Sans', 'Overpass',
      'Quicksand', 'Raleway', 'Rubik', 'Source Sans Pro', 'Urbanist', 'Vollkorn', 'Zilla Slab'
    ]
  },
  {
    id: 'mono', label: 'Monospace & technical', families: [
      'Andale Mono', 'Cascadia Code', 'Cascadia Mono', 'Consolas', 'Courier', 'Courier New', 'DejaVu Sans Mono', 'Fira Code', 'IBM Plex Mono',
      'Inconsolata', 'JetBrains Mono', 'Liberation Mono', 'Lucida Console', 'Menlo', 'Monaco', 'Noto Sans Mono', 'Roboto Mono', 'Source Code Pro', 'Ubuntu Mono'
    ]
  },
  {
    id: 'display', label: 'Display & distinctive', families: [
      'Abril Fatface', 'Bebas Neue', 'Bodoni 72', 'Bodoni MT', 'Cooper Black', 'Copperplate', 'DIN Condensed', 'Impact', 'League Spartan',
      'Oswald', 'Roboto Condensed', 'Teko', 'Titillium Web', 'Trade Gothic', 'Tw Cen MT', 'Yanone Kaffeesatz'
    ]
  },
  {
    id: 'global', label: 'Global scripts & accessible', families: [
      'Arial Unicode MS', 'Noto Sans Arabic', 'Noto Sans Bengali', 'Noto Sans Devanagari', 'Noto Sans Gujarati', 'Noto Sans Gurmukhi',
      'Noto Sans Hebrew', 'Noto Sans JP', 'Noto Sans Kannada', 'Noto Sans KR', 'Noto Sans Malayalam', 'Noto Sans SC', 'Noto Sans Tamil',
      'Noto Sans Telugu', 'Noto Sans Thai', 'Noto Sans TC', 'Noto Serif Devanagari', 'Yu Gothic', 'Malgun Gothic', 'Microsoft YaHei'
    ]
  }
];

export const FONT_CATALOG = [...new Set(FONT_CATEGORIES.flatMap(category => category.families))];

export const LIST_STYLES = [
  { id: 'disc', label: 'Solid circle', group: 'Bullets', kind: 'bullet', cssType: 'disc', preview: '●' },
  { id: 'circle', label: 'Open circle', group: 'Bullets', kind: 'bullet', cssType: 'circle', preview: '○' },
  { id: 'square', label: 'Square', group: 'Bullets', kind: 'bullet', cssType: 'square', preview: '■' },
  { id: 'diamond', label: 'Diamond', group: 'Bullets', kind: 'bullet', marker: '◆', preview: '◆' },
  { id: 'hollow-diamond', label: 'Hollow diamond', group: 'Bullets', kind: 'bullet', marker: '◇', preview: '◇' },
  { id: 'arrow', label: 'Arrow', group: 'Bullets', kind: 'bullet', marker: '➜', preview: '➜' },
  { id: 'chevron', label: 'Chevron', group: 'Bullets', kind: 'bullet', marker: '›', preview: '›' },
  { id: 'check', label: 'Checkmark', group: 'Bullets', kind: 'bullet', marker: '✓', preview: '✓' },
  { id: 'dash', label: 'Dash', group: 'Bullets', kind: 'bullet', marker: '–', preview: '–' },
  { id: 'star', label: 'Star', group: 'Bullets', kind: 'bullet', marker: '★', preview: '★' },
  { id: 'hollow-star', label: 'Hollow star', group: 'Bullets', kind: 'bullet', marker: '☆', preview: '☆' },
  { id: 'triangle', label: 'Triangle', group: 'Bullets', kind: 'bullet', marker: '▸', preview: '▸' },
  { id: 'plus', label: 'Plus', group: 'Bullets', kind: 'bullet', marker: '+', preview: '+' },
  { id: 'cross', label: 'Cross', group: 'Bullets', kind: 'bullet', marker: '×', preview: '×' },
  { id: 'pin', label: 'Pinpoint', group: 'Bullets', kind: 'bullet', marker: '•', preview: '•' },
  { id: 'accent-bar', label: 'Accent bar', group: 'Bullets', kind: 'bullet', marker: '▌', preview: '▌' },
  { id: 'target', label: 'Target', group: 'Bullets', kind: 'bullet', marker: '⊙', preview: '⊙' },
  { id: 'spark', label: 'Spark', group: 'Bullets', kind: 'bullet', marker: '✦', preview: '✦' },
  { id: 'decimal', label: '1, 2, 3', group: 'Numbering', kind: 'number', cssType: 'decimal', preview: '1.' },
  { id: 'decimal-zero', label: '01, 02, 03', group: 'Numbering', kind: 'number', cssType: 'decimal-leading-zero', preview: '01.' },
  { id: 'lower-alpha', label: 'a, b, c', group: 'Numbering', kind: 'number', cssType: 'lower-alpha', preview: 'a.' },
  { id: 'upper-alpha', label: 'A, B, C', group: 'Numbering', kind: 'number', cssType: 'upper-alpha', preview: 'A.' },
  { id: 'lower-roman', label: 'i, ii, iii', group: 'Numbering', kind: 'number', cssType: 'lower-roman', preview: 'i.' },
  { id: 'upper-roman', label: 'I, II, III', group: 'Numbering', kind: 'number', cssType: 'upper-roman', preview: 'I.' },
  { id: 'lower-greek', label: 'Greek', group: 'Numbering', kind: 'number', cssType: 'lower-greek', preview: 'α.' },
  { id: 'armenian', label: 'Armenian', group: 'Numbering', kind: 'number', cssType: 'armenian', preview: 'Ա.' },
  { id: 'georgian', label: 'Georgian', group: 'Numbering', kind: 'number', cssType: 'georgian', preview: 'ა.' },
  { id: 'none', label: 'No marker', group: 'Numbering', kind: 'number', cssType: 'none', preview: '—' },
  { id: 'outline-decimal', label: 'Legal outline', group: 'Multilevel', kind: 'multilevel', cssType: 'decimal', preview: '1.1' },
  { id: 'outline-alpha', label: 'Alpha outline', group: 'Multilevel', kind: 'multilevel', cssType: 'upper-alpha', preview: 'A.1' },
  { id: 'outline-roman', label: 'Roman outline', group: 'Multilevel', kind: 'multilevel', cssType: 'upper-roman', preview: 'I.a' },
  { id: 'outline-mixed', label: 'Mixed outline', group: 'Multilevel', kind: 'multilevel', cssType: 'decimal', preview: '1.a.i' },
  { id: 'steps', label: 'Process steps', group: 'Multilevel', kind: 'multilevel', marker: 'STEP', preview: 'Step' },
  { id: 'milestones', label: 'Milestones', group: 'Multilevel', kind: 'multilevel', marker: '◆', preview: '◆.1' },
  { id: 'chapters', label: 'Chapters', group: 'Multilevel', kind: 'multilevel', cssType: 'upper-roman', preview: 'I—1' },
  { id: 'hierarchy', label: 'Hierarchy tree', group: 'Multilevel', kind: 'multilevel', marker: '└', preview: '└' }
];

export const BACKGROUND_PATTERNS = [
  { id: 'none', label: 'Clean paper' },
  { id: 'fine-grid', label: 'Fine grid' },
  { id: 'dot-matrix', label: 'Dot matrix' },
  { id: 'diagonal', label: 'Diagonal lines' },
  { id: 'crosshatch', label: 'Crosshatch' },
  { id: 'corner-arc', label: 'Corner arc' },
  { id: 'topography', label: 'Topographic' },
  { id: 'blueprint', label: 'Blueprint' },
  { id: 'paper-grain', label: 'Paper grain' },
  { id: 'half-tone', label: 'Halftone' },
  { id: 'vertical-rule', label: 'Vertical rule' },
  { id: 'side-band', label: 'Side band' },
  { id: 'header-glow', label: 'Header glow' },
  { id: 'corner-blocks', label: 'Corner blocks' },
  { id: 'soft-waves', label: 'Soft waves' },
  { id: 'minimal-frame', label: 'Minimal frame' },
  { id: 'accent-circles', label: 'Accent circles' },
  { id: 'editorial-bars', label: 'Editorial bars' }
];

export const PAPER_SIZES = [
  { id: 'a4', label: 'A4 — 210 × 297 mm', widthPx: 794, heightPx: 1123, widthMm: 210, heightMm: 297 },
  { id: 'letter', label: 'US Letter — 8.5 × 11 in', widthPx: 816, heightPx: 1056, widthMm: 215.9, heightMm: 279.4 },
  { id: 'legal', label: 'US Legal — 8.5 × 14 in', widthPx: 816, heightPx: 1344, widthMm: 215.9, heightMm: 355.6 },
  { id: 'a5', label: 'A5 — 148 × 210 mm', widthPx: 559, heightPx: 794, widthMm: 148, heightMm: 210 },
  { id: 'executive', label: 'Executive — 7.25 × 10.5 in', widthPx: 696, heightPx: 1008, widthMm: 184.15, heightMm: 266.7 }
];

const baseSections = [
  ['Summary', 'Essentials', 'A concise overview for experienced candidates.', 'Summarize years, specialty, two strengths, and one measurable result.', true, 'main'],
  ['Objective', 'Essentials', 'Useful for entry-level candidates, career changers, or a sharply targeted move.', 'State the target role, transferable value, and employer outcome.', false, 'main'],
  ['Experience', 'Essentials', 'The primary evidence section for most professional resumes.', 'List role, employer, dates, scope, and achievement-led bullets.', true, 'main'],
  ['Education', 'Essentials', 'Required when the qualification matters or for early-career applications.', 'Include degree, institution, location, dates, and relevant distinctions.', true, 'aside'],
  ['Certifications', 'Credentials', 'Highlights current, role-relevant professional credentials.', 'Include credential, issuer, verification link, and expiry where relevant.', true, 'aside'],
  ['Projects', 'Evidence', 'Shows applied skills when work samples or side projects strengthen the application.', 'Use problem, contribution, tools, and result.', true, 'main'],
  ['Skills', 'Capabilities', 'Provides fast keyword scanning for recruiters and ATS.', 'Group relevant hard and soft skills; avoid unsupported keyword stuffing.', true, 'aside'],
  ['Technical Skills', 'Capabilities', 'Separates technical languages, systems, methods, and platforms.', 'Group by languages, frameworks, data, cloud, methods, and tools.', true, 'aside'],
  ['Awards', 'Evidence', 'Use for selective recognition that proves excellence or impact.', 'Include award, issuing body, reason, and year.', false, 'main'],
  ['Languages', 'Capabilities', 'Important for multilingual, international, customer-facing, or regional roles.', 'Name each language and use a clear proficiency standard.', true, 'aside'],
  ['Personal Details', 'Regional', 'Use only where local norms or the employer explicitly require it.', 'Keep sensitive information minimal and relevant to the application.', false, 'aside'],
  ['Volunteer Experience', 'Experience', 'Shows leadership, service, or relevant experience outside paid employment.', 'Format like employment with role, organization, dates, and outcomes.', false, 'main'],
  ['Publications', 'Academic', 'For research, writing, technical authority, or thought-leadership roles.', 'Use a consistent citation style and add DOI or link when useful.', false, 'main'],
  ['Courses', 'Education', 'Useful when targeted learning fills a qualification gap.', 'Include only recent, credible, and role-relevant courses.', false, 'aside'],
  ['Patents', 'Academic', 'For inventors, researchers, engineers, and innovation leaders.', 'Include title, patent number or status, jurisdiction, and year.', false, 'main'],
  ['Professional Memberships', 'Credentials', 'Shows active standing in a relevant professional community.', 'Include association, membership grade, leadership role, and dates.', false, 'aside'],
  ['Interests', 'Personal', 'Use sparingly when interests demonstrate culture fit or useful attributes.', 'Choose specific interests that invite constructive conversation.', false, 'aside'],
  ['References', 'Administrative', 'Include only when requested or when named referees add material credibility.', 'Provide name, title, relationship, and contact details with permission.', false, 'aside']
];

const importedSections = [
  ['Professional Summary Highlights', 'Essentials', 'A short, bulleted snapshot of top achievements, distinct from a paragraph summary.', 'Add three to five evidence-led highlights.', false, 'main'],
  ['Core Competencies / Areas of Expertise', 'Capabilities', 'For quick ATS and recruiter keyword scanning; best with 6–12 focused capabilities.', 'Use concise, role-aligned competency phrases.', false, 'aside'],
  ['Selected Accomplishments', 'Evidence', 'For measurable wins that span multiple roles or company-wide initiatives.', 'Lead each accomplishment with scale and result.', false, 'main'],
  ['Relevant Coursework', 'Education', 'For recent graduates or career changers when coursework directly supports the role.', 'List only advanced or strongly relevant subjects.', false, 'aside'],
  ['Portfolio / Work Samples', 'Evidence', 'For designers, writers, developers, marketers, and other portfolio-led professions.', 'Add project title, contribution, result, and accessible link.', false, 'main'],
  ['Case Studies / Impact Stories', 'Evidence', 'Use mini case studies to show problem, action, and result for major wins.', 'Write two to three lines using problem → action → result.', false, 'main'],
  ['Consulting / Freelance Experience', 'Experience', 'When independent work is substantial and should be separated from permanent roles.', 'Group clients or list major engagements with scope and impact.', false, 'main'],
  ['Contract / Temporary Roles', 'Experience', 'Clarifies short engagements and prevents legitimate transitions being misread.', 'Label contract type, agency if relevant, assignment, and result.', false, 'main'],
  ['Security Clearances', 'Administrative', 'Critical for government, defense, or regulated-industry roles.', 'State clearance level, status, sponsor, and eligibility without classified details.', false, 'aside'],
  ['Availability / Notice Period', 'Administrative', 'Useful for hiring timelines, especially in fast-moving markets.', 'State availability date or contractual notice period.', false, 'aside'],
  ['Salary Expectations', 'Administrative', 'Include only when the job posting or application process explicitly requests it.', 'Use a researched range and clarify currency and basis.', false, 'aside'],
  ['Relocation / Work Authorization', 'Administrative', 'Clarifies relocation interest, visa status, or work-permit eligibility.', 'State authorized locations, sponsorship need, and relocation scope.', false, 'aside'],
  ['Teaching / Mentoring', 'Leadership', 'Shows leadership, coaching, and knowledge-transfer ability.', 'Describe audience, program, scale, and development result.', false, 'main'],
  ['Key Tools / Software', 'Capabilities', 'Calls out specific platforms separately from broader technical skills.', 'Group tools by purpose and lead with the most role-relevant.', false, 'aside'],
  ['Conference Talks / Presentations', 'Academic', 'Demonstrates thought leadership and communication skill.', 'Include talk title, event, location, year, and link.', false, 'main'],
  ['Media Mentions / Press', 'Evidence', 'Useful for founders, executives, experts, or public-facing professionals.', 'Cite outlet, topic, date, and link without overstating coverage.', false, 'main'],
  ['Client List / Key Accounts', 'Evidence', 'For sales, agency, or consulting roles where account scale demonstrates credibility.', 'List public clients only or describe confidential accounts by sector and scale.', false, 'main'],
  ['Performance Metrics / KPIs', 'Evidence', 'A dedicated place for revenue, efficiency, retention, quality, or delivery measures.', 'Use metric, baseline, result, timeframe, and your contribution.', false, 'main'],
  ['Security / Compliance Training', 'Credentials', 'For regulated industries where HIPAA, GDPR, PCI, safety, or controls matter.', 'Include training title, provider, completion date, and validity.', false, 'aside'],
  ['Teaching Certifications / Licenses', 'Credentials', 'When a teaching license or specialist credential is required or differentiating.', 'Include license type, jurisdiction, identifier, and expiry.', false, 'aside'],
  ['Hobbies with Professional Relevance', 'Personal', 'Only when hobbies reinforce culture fit or relevant skills.', 'Connect the activity to leadership, discipline, teamwork, or craft.', false, 'aside']
];

const researchSections = [
  ['Professional Headline', 'Essentials', 'A compact positioning line beneath the name.', 'Combine target role, domain, and distinctive value in one line.', false, 'main'],
  ['Internships', 'Experience', 'Important evidence for students, graduates, and career changers.', 'Format like experience and prioritize contribution over observation.', false, 'main'],
  ['Social Profiles / Online Presence', 'Digital', 'Connects recruiters to credible professional profiles and public work.', 'Add LinkedIn, GitHub, portfolio, ORCID, or relevant professional channels.', false, 'aside'],
  ['Academic Achievements', 'Education', 'Supports early-career, scholarship, and academic applications.', 'Include honors, ranking, distinction, competition, or thesis result.', false, 'main'],
  ['Research Experience', 'Academic', 'For laboratory, academic, policy, UX research, and R&D roles.', 'Include question, methods, contribution, output, and supervisor if relevant.', false, 'main'],
  ['Grants / Fellowships / Funding', 'Academic', 'Shows competitive funding, research independence, or program leadership.', 'Include funder, program, amount when public, role, and period.', false, 'main'],
  ['Licenses / Registrations', 'Credentials', 'Required in regulated professions and licensed trades.', 'Include authority, registration number where safe, region, status, and expiry.', false, 'aside'],
  ['Testimonials / Recommendations', 'Evidence', 'Use selectively for freelance, consulting, creative, or service careers.', 'Add a short attributed line with permission and verifiable context.', false, 'main'],
  ['Strengths', 'Capabilities', 'A concise set of differentiators supported elsewhere by evidence.', 'Name three to six strengths and connect them to outcomes.', false, 'aside'],
  ['Entrepreneurship / Ventures', 'Experience', 'For founders, operators, side ventures, and commercial experiments.', 'State venture, market, role, traction, and current status.', false, 'main'],
  ['Board / Advisory Roles', 'Leadership', 'Shows governance, strategic influence, or subject-matter leadership.', 'Include organization, mandate, committee, period, and contribution.', false, 'main'],
  ['Military Service', 'Experience', 'Translates service, leadership, operations, and specialist training.', 'Use accessible civilian language and clarify rank, scope, and outcomes.', false, 'main'],
  ['Community Leadership', 'Leadership', 'Shows leadership and impact in civic or community organizations.', 'Include role, constituency, program scale, and result.', false, 'main'],
  ['Open-Source Contributions', 'Digital', 'For technology and research roles where public contribution proves skill.', 'Name project, contribution type, adoption or impact, and repository link.', false, 'main'],
  ['Hackathons / Competitions', 'Evidence', 'Useful for students and practitioners demonstrating rapid problem solving.', 'Include event, challenge, team role, result, and prototype link.', false, 'main'],
  ['Training / Workshops', 'Education', 'Captures structured professional learning not represented by formal degrees.', 'Include program, provider, duration, and applied outcome.', false, 'aside'],
  ['Career Breaks / Sabbaticals', 'Experience', 'Provides clear context for intentional time away from formal employment.', 'State dates and relevant caregiving, study, travel, health, or project activity only as comfortable.', false, 'main'],
  ['Quantified Results Dashboard', 'Evidence', 'Gives senior leaders and commercial professionals a fast view of scale and outcomes.', 'Use four to eight verified metrics with clear units and periods.', false, 'main'],
  ['Life Philosophy / Values', 'Personal', 'For culture-led, mission-led, leadership, or creative applications.', 'Keep it concise, specific, and aligned with demonstrated behavior.', false, 'aside'],
  ['My Time / Day in the Life', 'Personal', 'A visual storytelling section for creative or culture-focused applications.', 'Show how time is allocated across leadership, craft, customers, and learning.', false, 'aside'],
  ['Books / Influences', 'Personal', 'A selective personality section for education, creative, or thought-leadership roles.', 'Choose a few relevant influences and add why they matter.', false, 'aside']
];

export const SECTION_CATALOG = [...baseSections, ...importedSections, ...researchSections].map(([name, category, benefit, sample, defaultEnabled, placement]) => ({ name, category, benefit, sample, defaultEnabled, placement }));

export const RESUME_KNOWLEDGE = [
  { category: 'Structure', title: 'Reverse chronological', guidance: 'Lead with the most recent relevant experience when career progression is the strongest evidence.', source: 'https://novoresume.com/cv-templates' },
  { category: 'Structure', title: 'Functional / skills-first', guidance: 'Prioritize capabilities and projects when changing careers, returning to work, or when job history is not the clearest proof.', source: 'https://novoresume.com/cv-templates' },
  { category: 'Structure', title: 'Hybrid', guidance: 'Balance a strong capability summary with chronological proof when both skills and progression matter.', source: 'https://novoresume.com/cv-templates' },
  { category: 'Layout', title: 'Readable hierarchy', guidance: 'Use consistent headings, generous whitespace, and predictable date placement so readers can scan quickly.', source: 'https://www.kickresume.com/en/resumes/' },
  { category: 'Layout', title: 'ATS-safe reading order', guidance: 'Keep each section together and preserve a logical left-to-right, top-to-bottom text flow even in multi-column layouts.', source: 'https://enhancv.com/resume-templates/' },
  { category: 'Content', title: 'Achievement bullets', guidance: 'Prefer action + scope + result. Quantify only with accurate, defensible measures.', source: 'https://www.kickresume.com/en/resumes/' },
  { category: 'Content', title: 'Relevant optional sections', guidance: 'Add optional sections only when they improve evidence for the target role or explain important context.', source: 'https://novoresume.com/cv-templates' },
  { category: 'Pages', title: 'Page length follows purpose', guidance: 'One or two pages suits many commercial applications; academic and federal CVs can be longer when the evidence requires it.', source: 'https://novoresume.com/cv-templates' },
  { category: 'Customization', title: 'Structured style overrides', guidance: 'Apply typography, color, spacing, borders, and alignment consistently at document, section, or page scope.', source: 'https://github.com/amruthpillai/reactive-resume' },
  { category: 'Customization', title: 'Move content across pages', guidance: 'Split lengthy sections deliberately so items remain intact and the second page has meaningful context.', source: 'https://docs.rxresu.me/guides/moving-items-between-sections' },
  { category: 'Regional', title: 'Photo conventions vary', guidance: 'Use a photo only when appropriate for the country, profession, and application instructions.', source: 'https://novoresume.com/cv-templates' },
  { category: 'Privacy', title: 'Minimize sensitive data', guidance: 'Avoid unnecessary identity, salary, health, or family information unless legally and contextually appropriate.', source: 'https://rxresu.me/' }
];

export const ADDITIONAL_TEMPLATE_GROUPS = [
  { id: 'consulting-casebook', collection: 'specialty', title: 'Consulting Casebook', description: 'Structured case impact, client context, and executive-ready evidence.', accent: '#274b5d', layouts: ['docket', 'ruleline', 'ledger', 'boardroom'], names: ['Case Brief', 'Engagement', 'Advisor', 'Strategy File'], photo: 'never', ats: true },
  { id: 'startup-builder', collection: 'specialty', title: 'Startup Builder', description: 'Venture metrics, product launches, and cross-functional ownership.', accent: '#b84a32', layouts: ['modern', 'impact', 'asymmetric', 'color-cap'], names: ['Zero to One', 'Launchpad', 'Venture', 'Builder'], photo: 'optional' },
  { id: 'data-analytics', collection: 'specialty', title: 'Data & Analytics', description: 'Models, platforms, experiments, and quantified decision impact.', accent: '#315a75', layouts: ['dashboard', 'systems', 'code-grid', 'infographic'], names: ['Signal', 'Metric', 'Data Story', 'Decision Lab'], photo: 'never', ats: true },
  { id: 'cybersecurity', collection: 'specialty', title: 'Cybersecurity', description: 'Clearances, controls, incidents, risk, and technical credentials.', accent: '#24383e', layouts: ['terminal', 'systems', 'credential', 'dark-split'], names: ['Secure Line', 'Control Plane', 'Sentinel', 'Zero Trust'], photo: 'never', ats: true },
  { id: 'media-communications', collection: 'specialty', title: 'Media & Communications', description: 'Editorial work, campaigns, audiences, press, and public narratives.', accent: '#8b4159', layouts: ['editorial', 'gallery', 'creative', 'signature'], names: ['Byline', 'Newsroom', 'Editorial Voice', 'Broadcast'], photo: 'optional' },
  { id: 'architecture-built', collection: 'specialty', title: 'Architecture & Built Environment', description: 'Projects, typologies, software, registrations, and design contribution.', accent: '#6b5949', layouts: ['geometric', 'portfolio', 'framed', 'swiss-grid'], names: ['Blueprint', 'Studio Plan', 'Built Form', 'Section'], photo: 'optional' },
  { id: 'aviation-maritime', collection: 'specialty', title: 'Aviation & Maritime', description: 'Licenses, routes, vessels, safety, hours, and operational leadership.', accent: '#2f596e', layouts: ['passport', 'timeline', 'corporate', 'international'], names: ['Flight Record', 'Voyage', 'Command Log', 'Navigator'], photo: 'optional', ats: true },
  { id: 'sports-performance', collection: 'specialty', title: 'Sports & Performance', description: 'Results, rankings, coaching, training, and performance metrics.', accent: '#4d6a32', layouts: ['impact', 'dashboard', 'photo-banner', 'banded'], names: ['Performance', 'Scorecard', 'Momentum', 'Podium'], photo: 'optional' },
  { id: 'product-ux', collection: 'specialty', title: 'Product & UX Portfolio', description: 'Case studies, discovery, systems thinking, and product outcomes.', accent: '#7450a0', layouts: ['portfolio', 'modern', 'split-panel', 'minimal'], names: ['Product Story', 'Discovery', 'Experience Map', 'Design Ops'], photo: 'optional' },
  { id: 'thought-leadership', collection: 'specialty', title: 'Thought Leadership', description: 'Speaking, publications, media, advisory work, and intellectual contribution.', accent: '#76513f', layouts: ['elegant', 'citation', 'narrative', 'ribbon-photo'], names: ['Voice', 'Forum', 'Perspective', 'Author'], photo: 'optional' },
  { id: 'freelance-portfolio', collection: 'specialty', title: 'Freelance & Independent', description: 'Client work, selected engagements, testimonials, and business outcomes.', accent: '#9a4f3b', layouts: ['gallery', 'portfolio', 'colorblock', 'soft-sidebar'], names: ['Independent', 'Client Book', 'Practice', 'Selected Work'], photo: 'optional' },
  { id: 'career-change', collection: 'specialty', title: 'Career Change Narrative', description: 'Transferable strengths, relevant projects, coursework, and a clear direction.', accent: '#3f655c', layouts: ['skills-first', 'bridge', 'hybrid', 'capability'], names: ['Pivot', 'Transfer', 'Next Chapter', 'New Direction'], photo: 'never', ats: true }
];
