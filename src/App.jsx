import React, { useEffect, useMemo, useRef, useState } from 'react';
import DEFAULT_PROFILE_PHOTO from './assets/ananya-rao-headshot.png?inline';
import {
  AlignCenter, AlignJustify, AlignLeft, AlignRight, ArrowLeft, Baseline,
  Bold, Check, ChevronDown, ChevronLeft, ChevronRight, Cloud,
  Columns2, Download, File, FileImage, FilePlus2, FileStack, FileText, FileUp,
  Grid2X2, HelpCircle, Highlighter, Image as ImageIcon, IndentDecrease,
  IndentIncrease, Italic, LayoutGrid, Link2, List, ListOrdered, LoaderCircle,
  MoreHorizontal, Palette,
  Plus, Redo2, Save, Search, SlidersHorizontal, Sparkles, Trash2, Type,
  Underline, Undo2, X, ZoomIn, ZoomOut, Strikethrough,
  Superscript, Subscript, Unlink, Eraser
} from 'lucide-react';
import {
  ADDITIONAL_TEMPLATE_GROUPS, FONT_CATALOG, LIST_STYLES, PAPER_SIZES,
  SECTION_CATALOG
} from './customizationData';
import AdvancedCustomizerPanel from './AdvancedCustomizerPanel';
import AIAssistantPanel from './AIAssistantPanel';
import {
  AI_PROVIDERS, buildAIResumeMarkup, callAIProvider, extractResumeContext,
  parseGrammarCorrections, parseStructuredResume, testAIConnection
} from './aiEngine';
import { analyzeATS } from './atsEngine';
import ImportResumeModal from './ImportResumeModal';
import { buildImportedResumeMarkup, buildImportedVisualPages } from './resumeImportEngine';
import {
  cleanEditorMarkup, dropSectionAt, dropSectionInColumn, getSectionName,
  moveSectionInDocument
} from './sectionMovement';
import {
  addSectionItem, ensureProjectDetails, getSectionItems, isRepeatableSection,
  normalizeProjectEntries, normalizeSectionItems, removeSectionItem
} from './sectionItems';
import {
  assertRasterHasVisibleContent, buildRasterSvg, collectDocumentCss,
  createExportHost, dataUrlToUint8Array, escapeRtf, waitForExportAssets
} from './exportEngine';

const ACCENTS = ['#bd4f2f', '#087e6b', '#2563a6', '#6b4ba1', '#a16810', '#292d32', '#8e4054', '#315b51', '#34516f', '#72544b', '#526b2f', '#4d5564'];
const FONTS = FONT_CATALOG;

const TEMPLATE_COLLECTIONS = [
  { id: 'formats', title: 'Core resume formats', description: 'Proven structures for ATS, career history, skills, and detailed applications.' },
  { id: 'styles', title: 'Professional design styles', description: 'Original visual systems from restrained minimalism to expressive editorial design.' },
  { id: 'industries', title: 'Industry collections', description: 'Hierarchy and emphasis tuned for the expectations of specific fields.' },
  { id: 'global', title: 'Global CV conventions', description: 'Flexible regional patterns for applications across international markets.' },
  { id: 'specialty', title: 'Specialist & storytelling resumes', description: 'Original systems for portfolios, specialized careers, independent work, and career transitions.' },
];

const TEMPLATE_GROUPS = [
  { id: 'ats-classic', collection: 'formats', title: 'ATS Classic', description: 'Single-column, parser-safe layouts with standard headings.', accent: '#292d32', layouts: ['ats', 'crisp', 'ruleline', 'classic'], names: ['Clearline', 'Applicant', 'Exact Match', 'Plainspoken'], photo: 'never', ats: true },
  { id: 'chronological', collection: 'formats', title: 'Reverse Chronological', description: 'Career progression led by the most recent experience.', accent: '#34516f', layouts: ['chronological', 'timeline', 'milestone', 'editorial'], names: ['Career Arc', 'Progression', 'Milestone', 'Continuum'], photo: 'optional', ats: true },
  { id: 'functional', collection: 'formats', title: 'Functional / Skills-first', description: 'Transferable skills take priority over employment dates.', accent: '#315b51', layouts: ['skills-first', 'skill-grid', 'capability', 'quadrant'], names: ['Capability', 'Skill Map', 'Strengths', 'Transfer'], photo: 'never', ats: true },
  { id: 'combination', collection: 'formats', title: 'Combination / Hybrid', description: 'Balanced emphasis on skills, achievements, and work history.', accent: '#72544b', layouts: ['hybrid', 'bridge', 'split', 'bordered-columns'], names: ['Bridge', 'Dual Focus', 'Balance', 'Converge'], photo: 'optional', ats: true },
  { id: 'one-page', collection: 'formats', title: 'One-page Compact', description: 'Dense but readable structures for concise applications.', accent: '#4d5564', layouts: ['onepage', 'microgrid', 'compact', 'dense'], names: ['One Page', 'Snapshot', 'Compact Pro', 'Brief'], photo: 'optional', ats: true },
  { id: 'detailed', collection: 'formats', title: 'Detailed Multi-page', description: 'Expanded history for experienced and specialist candidates.', accent: '#574b3d', layouts: ['detailed', 'narrative', 'federal', 'academic'], names: ['Full Record', 'Narrative', 'Career File', 'Longform'], photo: 'never', ats: true },
  { id: 'government', collection: 'formats', title: 'Federal & Government', description: 'Detailed duty, grade, hours, and public-service chronology.', accent: '#3f5364', layouts: ['federal', 'docket', 'label-grid', 'ruleline'], names: ['Public Service', 'Civic Record', 'Federal Detail', 'Docket'], photo: 'never', ats: true },
  { id: 'academic', collection: 'formats', title: 'Academic & Research', description: 'Publications, teaching, grants, and scholarly credentials.', accent: '#574b3d', layouts: ['academic', 'scholar', 'citation', 'detailed'], names: ['Citation', 'Research Folio', 'Faculty', 'Scholar'], photo: 'never', ats: true },

  { id: 'modern', collection: 'styles', title: 'Modern Professional', description: 'Contemporary hierarchy for business and product careers.', accent: '#bd4f2f', layouts: ['modern', 'editorial', 'swiss-grid', 'banded'], names: ['Modern Grid', 'Terra', 'Studio', 'Signal'], photo: 'optional' },
  { id: 'minimal', collection: 'styles', title: 'Minimalist', description: 'Whitespace, fine rules, and understated typography.', accent: '#38434f', layouts: ['minimal', 'whitespace', 'monoline', 'crisp'], names: ['Quiet Line', 'Whitespace', 'Bare', 'Essential'], photo: 'optional', ats: true },
  { id: 'executive', collection: 'styles', title: 'Executive Leadership', description: 'Authoritative formats for directors and senior leaders.', accent: '#244a70', layouts: ['executive', 'boardroom', 'signature', 'ledger'], names: ['Boardroom', 'Summit', 'Legacy', 'Command'], photo: 'optional' },
  { id: 'corporate', collection: 'styles', title: 'Corporate', description: 'Polished business layouts with disciplined section structure.', accent: '#34516f', layouts: ['corporate', 'color-cap', 'ruleline', 'classic'], names: ['Corporate Line', 'Blue Chip', 'Enterprise', 'Counsel'], photo: 'optional', ats: true },
  { id: 'creative', collection: 'styles', title: 'Creative & Editorial', description: 'Expressive composition for media, arts, and communications.', accent: '#6b4ba1', layouts: ['creative', 'asymmetric', 'shapes', 'gallery'], names: ['Canvas', 'Concept', 'Editorial', 'Muse'], photo: 'optional' },
  { id: 'color-block', collection: 'styles', title: 'Color Block', description: 'Bold panels create unmistakable visual hierarchy.', accent: '#8e4054', layouts: ['colorblock', 'dark-split', 'split-panel', 'soft-sidebar'], names: ['Block', 'Duotone', 'Contrast', 'Panel'], photo: 'optional' },
  { id: 'photo', collection: 'styles', title: 'Photo Profile', description: 'Portrait-led designs for people-focused and creative roles.', accent: '#2563a6', layouts: ['portrait-rail', 'photo-banner', 'ribbon-photo', 'angular-profile'], names: ['Portrait Rail', 'Profile Banner', 'Ribbon', 'Angle'], photo: 'always' },
  { id: 'infographic', collection: 'styles', title: 'Infographic', description: 'Skill meters, timelines, and visual achievement summaries.', accent: '#526b2f', layouts: ['infographic', 'dashboard', 'skill-grid', 'dark-split'], names: ['Dashboard', 'Data Story', 'Skill Meter', 'Visual CV'], photo: 'optional' },
  { id: 'elegant', collection: 'styles', title: 'Elegant Serif', description: 'Refined type, balanced spacing, and editorial restraint.', accent: '#72544b', layouts: ['elegant', 'signature', 'editorial', 'monoline'], names: ['Regent', 'Poise', 'Serif Note', 'Heritage'], photo: 'optional' },
  { id: 'geometric', collection: 'styles', title: 'Geometric', description: 'Angles, frames, and graphic shapes for a distinctive profile.', accent: '#2563a6', layouts: ['geometric', 'angular-profile', 'framed', 'shapes'], names: ['Geometry', 'Cornerstone', 'Facet', 'Frame'], photo: 'optional' },

  { id: 'technology', collection: 'industries', title: 'Technology & Engineering', description: 'Skills-forward systems for software, data, and engineering.', accent: '#2563a6', layouts: ['tech', 'terminal', 'code-grid', 'systems'], names: ['Cobalt Stack', 'Codebase', 'Systems', 'Open Source'], photo: 'optional', ats: true },
  { id: 'healthcare', collection: 'industries', title: 'Healthcare & Nursing', description: 'Credentials, licenses, clinical skills, and care experience.', accent: '#087e6b', layouts: ['healthcare', 'credential', 'careline', 'timeline'], names: ['Clinical', 'Care Path', 'Medline', 'Vital'], photo: 'optional', ats: true },
  { id: 'finance', collection: 'industries', title: 'Finance & Banking', description: 'Conservative, metrics-led formats for regulated work.', accent: '#38434f', layouts: ['ledger', 'corporate', 'compact', 'executive'], names: ['Ivy Ledger', 'Balance Sheet', 'Sterling', 'Capital'], photo: 'never', ats: true },
  { id: 'legal', collection: 'industries', title: 'Legal & Compliance', description: 'Precise chronological layouts for law and governance.', accent: '#4d5564', layouts: ['legal', 'docket', 'classic', 'ruleline'], names: ['Counsel', 'Casebook', 'Statute', 'Chambers'], photo: 'never', ats: true },
  { id: 'sales', collection: 'industries', title: 'Sales & Marketing', description: 'Targets, campaign impact, and growth metrics lead the page.', accent: '#9b4c38', layouts: ['sales', 'impact', 'portfolio', 'modern'], names: ['Pipeline', 'Growth Story', 'Market Maker', 'Revenue'], photo: 'optional' },
  { id: 'design', collection: 'industries', title: 'Design & Portfolio', description: 'Selected work, creative practice, and tools presented visually.', accent: '#6b4ba1', layouts: ['portfolio', 'gallery', 'creative', 'dark-split'], names: ['Portfolio', 'Gallery Note', 'Studio Practice', 'Artboard'], photo: 'optional' },
  { id: 'education', collection: 'industries', title: 'Education & Teaching', description: 'Teaching history, credentials, and learning outcomes.', accent: '#a16810', layouts: ['education', 'academic', 'soft-sidebar', 'timeline'], names: ['Lesson Plan', 'Faculty Line', 'Learning Path', 'Chalkboard'], photo: 'optional', ats: true },
  { id: 'student', collection: 'industries', title: 'Student & Graduate', description: 'Education-led layouts for internships and first roles.', accent: '#a16810', layouts: ['student', 'campus', 'skill-grid', 'minimal'], names: ['First Step', 'Campus', 'Graduate Line', 'Launch'], photo: 'optional', ats: true },
  { id: 'trades', collection: 'industries', title: 'Skilled Trades & Operations', description: 'Licenses, equipment, safety, and hands-on experience.', accent: '#72544b', layouts: ['trade', 'label-grid', 'chronological', 'compact'], names: ['Workshop', 'Field Record', 'Operations', 'Craft'], photo: 'optional', ats: true },
  { id: 'hospitality', collection: 'industries', title: 'Hospitality & Customer Service', description: 'Service achievements, languages, and people skills.', accent: '#8e4054', layouts: ['service', 'photo-banner', 'soft-sidebar', 'modern'], names: ['Welcome', 'Guest First', 'Service Line', 'Concierge'], photo: 'optional' },
  { id: 'nonprofit', collection: 'industries', title: 'Nonprofit & Social Impact', description: 'Mission, programs, fundraising, and community outcomes.', accent: '#315b51', layouts: ['impact', 'narrative', 'timeline', 'color-cap'], names: ['Mission', 'Community', 'Purpose', 'Impact'], photo: 'optional' },
  { id: 'science', collection: 'industries', title: 'Science & Laboratory', description: 'Research methods, publications, instruments, and findings.', accent: '#315b51', layouts: ['citation', 'academic', 'systems', 'credential'], names: ['Laboratory', 'Research Note', 'Method', 'Discovery'], photo: 'never', ats: true },

  { id: 'international', collection: 'global', title: 'International CV', description: 'Flexible global CV structures with multilingual sections.', accent: '#35614c', layouts: ['international', 'passport', 'timeline', 'sidebar'], names: ['Global', 'Continental', 'Worldview', 'Passport'], photo: 'optional' },
  { id: 'uk-cv', collection: 'global', title: 'UK CV', description: 'Concise achievement-led CVs without mandatory photography.', accent: '#34516f', layouts: ['uk-cv', 'classic', 'chronological', 'crisp'], names: ['London', 'Britannia', 'Camden', 'Thames'], photo: 'never', ats: true },
  { id: 'european', collection: 'global', title: 'European CV', description: 'Structured languages, qualifications, and mobility details.', accent: '#2563a6', layouts: ['euro', 'passport', 'label-grid', 'international'], names: ['Europa', 'Mobility', 'Continental', 'Blue Star'], photo: 'optional' },
  { id: 'india', collection: 'global', title: 'India Professional', description: 'Career, education, technical skills, and personal details.', accent: '#bd4f2f', layouts: ['india-pro', 'color-cap', 'label-grid', 'chronological'], names: ['India Pro', 'Bengaluru', 'Merit', 'Career India'], photo: 'optional', ats: true },
  { id: 'asia-pacific', collection: 'global', title: 'Asia-Pacific CV', description: 'Polished regional CVs with skills and language emphasis.', accent: '#087e6b', layouts: ['apac', 'soft-sidebar', 'bordered-columns', 'modern'], names: ['Pacific', 'Meridian', 'Asia Pro', 'Harbour'], photo: 'optional' },
  { id: 'middle-east', collection: 'global', title: 'Middle East CV', description: 'Bilingual-ready, credential-led professional profiles.', accent: '#a16810', layouts: ['mena', 'portrait-rail', 'elegant', 'international'], names: ['Gulf Professional', 'Oasis', 'Crescent', 'Horizon'], photo: 'optional' },
  ...ADDITIONAL_TEMPLATE_GROUPS,
];

const TEMPLATES_PER_GROUP = 840;
const TOTAL_TEMPLATE_COUNT = TEMPLATE_GROUPS.length * TEMPLATES_PER_GROUP;
const HEADER_STYLES = ['clean', 'centered', 'split', 'band', 'boxed', 'minimal'];
const SECTION_STYLES = ['rule', 'pill', 'label', 'bar', 'boxed', 'numbered'];
const CORNER_STYLES = ['square', 'soft', 'round'];

const templates = Array.from({ length: TOTAL_TEMPLATE_COUNT }, (_, index) => {
  const groupIndex = Math.floor(index / TEMPLATES_PER_GROUP);
  const group = TEMPLATE_GROUPS[groupIndex];
  const variation = index % TEMPLATES_PER_GROUP;
  const layoutIndex = variation % 4;
  const colorwayIndex = Math.floor(variation / 4) % 7;
  const fontIndex = Math.floor(variation / 28) % 5;
  const densityIndex = Math.floor(variation / 140) % 3;
  const headerIndex = Math.floor(variation / 420) % 2;
  const collection = TEMPLATE_COLLECTIONS.find(item => item.id === group.collection);
  return {
    group: group.id,
    groupName: group.title,
    collection: group.collection,
    collectionName: collection?.title || group.collection,
    id: `template-${index + 1}`,
    name: `${group.names[variation % group.names.length]} ${String(variation + 1).padStart(3, '0')}`,
    accent: colorwayIndex === 0 ? group.accent : ACCENTS[(colorwayIndex + groupIndex * 2) % ACCENTS.length],
    font: FONTS[(fontIndex + groupIndex) % FONTS.length],
    layout: group.layouts[layoutIndex],
    density: ['airy', 'balanced', 'compact'][densityIndex],
    headerStyle: HEADER_STYLES[(headerIndex + groupIndex) % HEADER_STYLES.length],
    sectionStyle: SECTION_STYLES[(layoutIndex + colorwayIndex + groupIndex) % SECTION_STYLES.length],
    cornerStyle: CORNER_STYLES[(fontIndex + colorwayIndex) % CORNER_STYLES.length],
    badge: group.ats ? 'ATS' : variation % 113 === 0 ? 'Popular' : variation % 79 === 0 ? 'New' : '',
    photo: group.photo === 'always' || (group.photo !== 'never' && variation % 3 !== 0),
  };
});

const templateClasses = template => `layout-${template.layout} group-${template.group} header-${template.headerStyle} heading-${template.sectionStyle} corners-${template.cornerStyle} ${template.photo ? 'resume-has-photo' : 'resume-no-photo'}`;

const DEFAULT_SECTIONS = Object.fromEntries(SECTION_CATALOG.map(section => [section.name, section.defaultEnabled]));

const SECTION_LABELS = Object.keys(DEFAULT_SECTIONS);

const storage = {
  getItem(key) { try { return window.localStorage.getItem(key); } catch { return null; } },
  setItem(key, value) { try { window.localStorage.setItem(key, value); return true; } catch { return false; } },
  removeItem(key) { try { window.localStorage.removeItem(key); } catch { /* storage unavailable */ } },
};

const DEFAULT_PHOTO_TOKEN = '__RESUMEFORGE_DEFAULT_PROFILE_PHOTO__';
const compactMarkupForStorage = markup => typeof markup === 'string' ? markup.split(DEFAULT_PROFILE_PHOTO).join(DEFAULT_PHOTO_TOKEN) : markup;
const hydrateMarkupFromStorage = markup => typeof markup === 'string' ? markup.split(DEFAULT_PHOTO_TOKEN).join(DEFAULT_PROFILE_PHOTO) : markup;

const readSavedResumes = () => {
  try {
    const value = JSON.parse(storage.getItem('resumeforge-saves') || '[]');
    return Array.isArray(value) ? value : [];
  } catch { return []; }
};

const readDraftPages = () => {
  try {
    const value = JSON.parse(storage.getItem('resumeforge-draft-pages') || 'null');
    if (Array.isArray(value) && value.length && value.every(page => typeof page === 'string')) return value.map(hydrateMarkupFromStorage);
  } catch { /* fall back to the legacy single-page draft */ }
  return [hydrateMarkupFromStorage(storage.getItem('resumeforge-draft-html')) || defaultResumeMarkup];
};

const defaultResumeMarkup = `
  <header class="resume-hero">
    <div class="identity">
      <img class="resume-photo" src="${DEFAULT_PROFILE_PHOTO}" alt="Ananya Rao" />
      <div>
        <p class="eyebrow" contenteditable="true">PRODUCT DESIGN & STRATEGY</p>
        <h1 contenteditable="true">Ananya Rao</h1>
        <p class="role" contenteditable="true">Senior Product Designer</p>
      </div>
    </div>
    <div class="contact" contenteditable="true">
      <span>ananya.rao@example.com</span><span>+91 98765 43210</span>
      <span>Bengaluru, India</span><span>ananyarao.design</span>
    </div>
  </header>
  <div class="resume-rule"></div>
  <section class="resume-section resume-intro">
    <h2 contenteditable="true">Summary</h2>
    <p contenteditable="true">Product designer with 8+ years of experience turning complex workflows into clear, human-centered products. Known for combining rigorous research, calm visual systems, and close cross-functional partnership to deliver measurable growth.</p>
  </section>
  <section class="resume-section compact-section">
    <div class="section-heading"><h2 contenteditable="true">Objective</h2><span>00</span></div>
    <p contenteditable="true">To lead product design for a mission-driven team where research, systems thinking, and craft create meaningful customer outcomes.</p>
  </section>
  <main class="resume-columns">
    <div class="resume-main">
      <section class="resume-section">
        <div class="section-heading"><h2 contenteditable="true">Experience</h2><span>01</span></div>
        <article class="job">
          <div class="job-top"><div><h3 contenteditable="true">Senior Product Designer</h3><p contenteditable="true">Orbit Labs · Bengaluru</p></div><time contenteditable="true">2022 — Present</time></div>
          <ul contenteditable="true">
            <li>Led the redesign of a B2B analytics platform, improving task completion by 34% across core workflows.</li>
            <li>Built a modular design system used by six product squads, reducing delivery time by 28%.</li>
            <li>Mentored four designers and introduced monthly customer insight reviews.</li>
          </ul>
        </article>
        <article class="job">
          <div class="job-top"><div><h3 contenteditable="true">Product Designer</h3><p contenteditable="true">Northstar Digital · Mumbai</p></div><time contenteditable="true">2019 — 2022</time></div>
          <ul contenteditable="true">
            <li>Designed onboarding experiences that lifted activation from 61% to 78%.</li>
            <li>Partnered with research and engineering to launch 12 customer-facing features.</li>
          </ul>
        </article>
      </section>
      <section class="resume-section">
        <div class="section-heading"><h2 contenteditable="true">Projects</h2><span>02</span></div>
        <div class="project-row" contenteditable="true"><strong>Pulse Insights</strong><span>Research platform · 2024</span></div>
        <div class="project-row" contenteditable="true"><strong>Atlas Design System</strong><span>Multi-product system · 2023</span></div>
      </section>
      <section class="resume-section">
        <div class="section-heading"><h2 contenteditable="true">Awards</h2><span>03</span></div>
        <div class="project-row" contenteditable="true"><strong>Design Excellence Award</strong><span>Product Guild · 2024</span></div>
      </section>
      <section class="resume-section">
        <div class="section-heading"><h2 contenteditable="true">Volunteer Experience</h2><span>04</span></div>
        <div class="job-top" contenteditable="true"><div><h3>Design Mentor</h3><p>Women Who Design</p></div><time>2021 — Present</time></div>
      </section>
      <section class="resume-section">
        <div class="section-heading"><h2 contenteditable="true">Publications</h2><span>05</span></div>
        <p contenteditable="true"><strong>Designing for Complex Decisions</strong> · Product Practice Journal, 2023</p>
      </section>
      <section class="resume-section">
        <div class="section-heading"><h2 contenteditable="true">Patents</h2><span>06</span></div>
        <p contenteditable="true">Adaptive workflow visualization system · Patent pending, 2024</p>
      </section>
      <section class="resume-section">
        <div class="section-heading"><h2 contenteditable="true">References</h2><span>07</span></div>
        <p contenteditable="true">Available upon request.</p>
      </section>
    </div>
    <aside class="resume-aside">
      <section class="resume-section">
        <div class="section-heading"><h2 contenteditable="true">Skills</h2><span>08</span></div>
        <div class="skill-list" contenteditable="true"><span>Product strategy</span><span>UX research</span><span>Interaction design</span><span>Design systems</span><span>Prototyping</span><span>Team leadership</span></div>
      </section>
      <section class="resume-section">
        <div class="section-heading"><h2 contenteditable="true">Technical Skills</h2><span>09</span></div>
        <p contenteditable="true">Figma · FigJam · Protopie · HTML/CSS · Jira · Dovetail · Amplitude</p>
      </section>
      <section class="resume-section">
        <div class="section-heading"><h2 contenteditable="true">Education</h2><span>10</span></div>
        <div class="education" contenteditable="true"><strong>M.Des, Interaction Design</strong><span>National Institute of Design</span><small>2016 — 2018</small></div>
        <div class="education" contenteditable="true"><strong>B.E., Computer Science</strong><span>Visvesvaraya Technological University</span><small>2011 — 2015</small></div>
      </section>
      <section class="resume-section">
        <div class="section-heading"><h2 contenteditable="true">Certifications</h2><span>11</span></div>
        <div class="education" contenteditable="true"><strong>Human-Centered Design</strong><span>IDEO U</span><small>2023</small></div>
        <div class="education" contenteditable="true"><strong>Product Analytics</strong><span>Reforge</span><small>2022</small></div>
      </section>
      <section class="resume-section">
        <div class="section-heading"><h2 contenteditable="true">Languages</h2><span>12</span></div>
        <p contenteditable="true">English · Fluent<br/>Hindi · Native<br/>Kannada · Conversational</p>
      </section>
      <section class="resume-section">
        <div class="section-heading"><h2 contenteditable="true">Personal Details</h2><span>13</span></div>
        <p contenteditable="true">Work authorization: India<br/>Availability: 30 days<br/>Open to relocation</p>
      </section>
      <section class="resume-section">
        <div class="section-heading"><h2 contenteditable="true">Courses</h2><span>14</span></div>
        <p contenteditable="true">Design Leadership · Accessibility for Product Teams · Advanced Facilitation</p>
      </section>
      <section class="resume-section">
        <div class="section-heading"><h2 contenteditable="true">Professional Memberships</h2><span>15</span></div>
        <p contenteditable="true">Interaction Design Association · Design Leadership Forum</p>
      </section>
      <section class="resume-section">
        <div class="section-heading"><h2 contenteditable="true">Interests</h2><span>16</span></div>
        <p contenteditable="true">Urban sketching · Behavioral science · Long-distance cycling</p>
      </section>
    </aside>
  </main>`;

const continuationResumeMarkup = `
  <header class="resume-hero resume-continuation-hero">
    <div class="identity"><div><p class="eyebrow" contenteditable="true">ANANYA RAO · CONTINUED</p><h1 contenteditable="true">Career highlights</h1><p class="role" contenteditable="true">Senior Product Designer</p></div></div>
    <div class="contact" contenteditable="true"><span>ananya.rao@example.com</span><span>ananyarao.design</span></div>
  </header>
  <div class="resume-rule"></div>
  <main class="resume-columns">
    <div class="resume-main">
      <section class="resume-section"><div class="section-heading"><h2 contenteditable="true">Experience</h2><span>01</span></div><article class="job"><div class="job-top"><div><h3 contenteditable="true">Additional experience</h3><p contenteditable="true">Company · Location</p></div><time contenteditable="true">Dates</time></div><ul contenteditable="true"><li>Add another measurable achievement or responsibility.</li><li>Continue your employment history without squeezing the first page.</li></ul></article></section>
      <section class="resume-section"><div class="section-heading"><h2 contenteditable="true">Projects</h2><span>02</span></div><div class="project-row" contenteditable="true"><strong>Project name</strong><span>Role · Year</span></div><p contenteditable="true">Describe the problem, your contribution, and the outcome.</p></section>
      <section class="resume-section"><div class="section-heading"><h2 contenteditable="true">Publications</h2><span>03</span></div><p contenteditable="true">Add publications, presentations, research, or thought leadership.</p></section>
    </div>
    <aside class="resume-aside">
      <section class="resume-section"><div class="section-heading"><h2 contenteditable="true">Awards</h2><span>04</span></div><p contenteditable="true">Award · Issuer · Year</p></section>
      <section class="resume-section"><div class="section-heading"><h2 contenteditable="true">Certifications</h2><span>05</span></div><div class="education" contenteditable="true"><strong>Certification</strong><span>Issuer</span><small>Year</small></div></section>
      <section class="resume-section"><div class="section-heading"><h2 contenteditable="true">Volunteer Experience</h2><span>06</span></div><p contenteditable="true">Organization · Contribution</p></section>
      <section class="resume-section"><div class="section-heading"><h2 contenteditable="true">References</h2><span>07</span></div><p contenteditable="true">Available upon request.</p></section>
    </aside>
  </main>`;

const blankResumeMarkup = `
  <header class="resume-hero resume-continuation-hero">
    <div class="identity"><div><p class="eyebrow" contenteditable="true">ANANYA RAO · RESUME</p><h1 contenteditable="true">New page</h1><p class="role" contenteditable="true">Add the content this page needs</p></div></div>
    <div class="contact" contenteditable="true"><span>ananya.rao@example.com</span><span>ananyarao.design</span></div>
  </header>
  <div class="resume-rule"></div>
  <main class="resume-columns">
    <div class="resume-main"><section class="resume-section"><div class="section-heading"><h2 contenteditable="true">Custom Section</h2><span>01</span></div><p contenteditable="true">Click here and start writing, or add a researched section from the Content library.</p></section></div>
    <aside class="resume-aside"></aside>
  </main>`;

const escapeHtml = value => String(value).replace(/[&<>'"]/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character]);

const sectionMarkupFor = section => `
  <section class="resume-section custom-resume-section" data-section-name="${escapeHtml(section.name)}">
    <div class="section-heading"><h2 contenteditable="true">${escapeHtml(section.name)}</h2><span>+</span></div>
    <p contenteditable="true">${escapeHtml(section.sample)}</p>
  </section>`;

const aiTextMarkup = value => String(value || '').split(/\n{2,}/).map(block => {
  const lines = block.split('\n').map(line => line.trim()).filter(Boolean);
  const bulletLines = lines.filter(line => /^[-•*]\s+/.test(line));
  if (bulletLines.length === lines.length && lines.length) return `<ul contenteditable="true">${lines.map(line => `<li>${escapeHtml(line.replace(/^[-•*]\s+/, ''))}</li>`).join('')}</ul>`;
  return `<p contenteditable="true">${lines.map(escapeHtml).join('<br/>')}</p>`;
}).join('');

const aiSectionMarkup = (name, value) => `<section class="resume-section custom-resume-section ai-generated-section" data-section-name="${escapeHtml(name)}"><div class="section-heading"><h2 contenteditable="true">${escapeHtml(name)}</h2><span>AI</span></div>${aiTextMarkup(value)}</section>`;

const applyCorrectionsToMarkup = (markup, corrections) => {
  const holder = document.createElement('div');
  holder.innerHTML = markup;
  const walker = document.createTreeWalker(holder, 4);
  const textNodes = [];
  while (walker.nextNode()) textNodes.push(walker.currentNode);
  let applied = 0;
  corrections.forEach(correction => {
    const target = textNodes.find(node => node.nodeValue?.includes(correction.original));
    if (!target) return;
    target.nodeValue = target.nodeValue.replace(correction.original, correction.replacement);
    applied += 1;
  });
  return { markup: holder.innerHTML, applied };
};

const collectionShortLabel = id => ({ formats: 'Formats', styles: 'Styles', industries: 'Industries', global: 'Global', specialty: 'Specialist' })[id] || id;

function IconButton({ icon: Icon, label, onClick, active = false, disabled = false }) {
  return <button className={`icon-button ${active ? 'active' : ''}`} onClick={onClick} title={label} aria-label={label} disabled={disabled}><Icon size={16} strokeWidth={1.9} /></button>;
}

function TemplateThumb({ template, selected, onSelect }) {
  return (
    <button className={`template-card ${selected ? 'selected' : ''}`} onClick={() => onSelect(template)}>
      <div className={`template-sheet ${templateClasses(template)} ${template.photo ? 'with-photo' : 'without-photo'}`} style={{ '--thumb-accent': template.accent, '--thumb-font': template.font }}>
        <div className="t-head"><i></i><div><b></b><span></span></div></div>
        <div className="t-rule"></div>
        <div className="t-body"><div><b></b><span></span><span></span><span></span></div><div><b></b><span></span><span></span></div></div>
        <div className="t-foot"><i/><span/><span/></div>
      </div>
      <div className="template-meta"><span>{template.name}</span><small>{template.groupName}</small></div>
      {template.badge && <em>{template.badge}</em>}
      {selected && <span className="selected-check"><Check size={12} /></span>}
    </button>
  );
}

function Toolbar({ exec, font, setFont, fontSize, setFontSize, onApplyFontSize, textColor, highlightColor, onOpenCustomize }) {
  const toolbarFontOptions = FONTS.includes(font) ? FONTS : [font, ...FONTS];
  const fontSizes = [8, 9, 10, 11, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48, 60, 72];
  return (
    <div className="ribbon" aria-label="Document formatting toolbar">
      <div className="tool-group history">
        <IconButton icon={Undo2} label="Undo" onClick={() => exec('undo')} />
        <IconButton icon={Redo2} label="Redo" onClick={() => exec('redo')} />
      </div>
      <div className="tool-group font-tools">
        <label className="select-control"><Type size={14} /><select value={font} onChange={e => { setFont(e.target.value); exec('fontName', e.target.value); }}>{toolbarFontOptions.map(item => <option key={item}>{item}</option>)}</select></label>
        <label className="select-control font-size"><select value={fontSize} onChange={e => { setFontSize(e.target.value); onApplyFontSize(Number(e.target.value)); }}>{fontSizes.map(size => <option key={size} value={size}>{size}</option>)}</select></label>
      </div>
      <div className="tool-group">
        <IconButton icon={Bold} label="Bold" onClick={() => exec('bold')} />
        <IconButton icon={Italic} label="Italic" onClick={() => exec('italic')} />
        <IconButton icon={Underline} label="Underline" onClick={() => exec('underline')} />
        <IconButton icon={Strikethrough} label="Strikethrough" onClick={() => exec('strikeThrough')} />
        <IconButton icon={Superscript} label="Superscript" onClick={() => exec('superscript')} />
        <IconButton icon={Subscript} label="Subscript" onClick={() => exec('subscript')} />
        <label className="color-tool" title="Text color"><Baseline size={16} /><input type="color" value={textColor} onChange={e => exec('foreColor', e.target.value)} /></label>
        <label className="color-tool" title="Highlight color"><Highlighter size={16} /><input type="color" value={highlightColor} onChange={e => exec('hiliteColor', e.target.value)} /></label>
      </div>
      <div className="tool-group align-tools">
        <IconButton icon={AlignLeft} label="Align left" onClick={() => exec('justifyLeft')} />
        <IconButton icon={AlignCenter} label="Align center" onClick={() => exec('justifyCenter')} />
        <IconButton icon={AlignRight} label="Align right" onClick={() => exec('justifyRight')} />
        <IconButton icon={AlignJustify} label="Justify" onClick={() => exec('justifyFull')} />
      </div>
      <div className="tool-group list-tools">
        <IconButton icon={List} label="Bulleted list" onClick={() => exec('insertUnorderedList')} />
        <IconButton icon={ListOrdered} label="Numbered list" onClick={() => exec('insertOrderedList')} />
        <IconButton icon={IndentDecrease} label="Decrease indent" onClick={() => exec('outdent')} />
        <IconButton icon={IndentIncrease} label="Increase indent / multilevel list" onClick={() => exec('indent')} />
      </div>
      <div className="tool-group insert-tools">
        <IconButton icon={Link2} label="Insert link" onClick={() => { const url = window.prompt('Paste a link'); if (url) exec('createLink', url); }} />
        <IconButton icon={Unlink} label="Remove link" onClick={() => exec('unlink')} />
        <IconButton icon={ImageIcon} label="Insert image" onClick={() => document.getElementById('inline-image-upload')?.click()} />
        <IconButton icon={Eraser} label="Clear formatting" onClick={() => exec('removeFormat')} />
        <IconButton icon={MoreHorizontal} label="All customization options" onClick={onOpenCustomize} />
      </div>
    </div>
  );
}

function TemplatesPanel({ selectedTemplate, onSelect, open, onClose, group, setGroup }) {
  const [query, setQuery] = useState('');
  const [style, setStyle] = useState('All');
  const [collection, setCollection] = useState('all');
  const [shown, setShown] = useState(18);
  const filtered = useMemo(() => templates.filter(template => {
    const groupMatch = group === 'all' || template.group === group;
    const collectionMatch = collection === 'all' || template.collection === collection;
    const styleMatch = style === 'All' || (style === 'ATS ready' ? template.badge === 'ATS' : style === 'With photo' ? template.photo : !template.photo);
    const search = query.trim().toLowerCase();
    const searchMatch = !search || [template.name, template.groupName, template.collectionName, template.layout].some(value => value.toLowerCase().includes(search));
    return groupMatch && collectionMatch && styleMatch && searchMatch;
  }), [query, group, collection, style]);

  useEffect(() => setShown(18), [query, group, collection, style]);

  const chooseCollection = collectionId => {
    setCollection(collectionId);
    setGroup('all');
  };

  const chooseGroup = groupId => {
    setGroup(groupId);
    if (groupId !== 'all') setCollection(TEMPLATE_GROUPS.find(item => item.id === groupId)?.collection || 'all');
  };

  return (
    <aside className={`templates-panel side-panel ${open ? 'open' : ''}`}>
      <div className="side-panel-head"><div><span className="panel-kicker">{TOTAL_TEMPLATE_COUNT.toLocaleString()} ORIGINAL DESIGNS</span><h2>Template library</h2></div><button className="mobile-close" onClick={onClose} aria-label="Close templates"><X size={18}/></button></div>
      <div className="search-field"><Search size={16}/><input value={query} onChange={event => setQuery(event.target.value)} placeholder={`Search ${TOTAL_TEMPLATE_COUNT.toLocaleString()} templates`} /><button title="Filters"><SlidersHorizontal size={15}/></button></div>
      <div className="collection-strip" aria-label="Template collections"><button className={collection === 'all' ? 'active' : ''} onClick={() => chooseCollection('all')}>All</button>{TEMPLATE_COLLECTIONS.map(item => <button key={item.id} className={collection === item.id ? 'active' : ''} onClick={() => chooseCollection(item.id)}>{collectionShortLabel(item.id)}</button>)}</div>
      <label className="template-group-select"><span>Resume type</span><select value={group} onChange={event => chooseGroup(event.target.value)}><option value="all">All {TEMPLATE_GROUPS.length} types · {TOTAL_TEMPLATE_COUNT.toLocaleString()}</option>{TEMPLATE_COLLECTIONS.map(section => <optgroup key={section.id} label={section.title}>{TEMPLATE_GROUPS.filter(item => item.collection === section.id).map(item => <option key={item.id} value={item.id}>{item.title} · {TEMPLATES_PER_GROUP}</option>)}</optgroup>)}</select></label>
      <div className="category-strip">{['All', 'ATS ready', 'With photo', 'No photo'].map(item => <button key={item} className={style === item ? 'active' : ''} onClick={() => setStyle(item)}>{item}</button>)}</div>
      <div className="library-count"><span>{filtered.length.toLocaleString()} templates</span><small>Showing {Math.min(shown, filtered.length).toLocaleString()}</small><button><Grid2X2 size={14}/></button></div>
      <div className="template-grid">{filtered.slice(0, shown).map(template => <TemplateThumb key={template.id} template={template} selected={selectedTemplate.id === template.id} onSelect={t => { onSelect(t); if (window.innerWidth < 760) onClose(); }} />)}</div>
      {shown < filtered.length && <button className="load-more" onClick={() => setShown(value => value + 18)}>Show 18 more designs <ChevronDown size={14}/></button>}
    </aside>
  );
}

function ExportModal({ onClose, onExport, exporting }) {
  const [format, setFormat] = useState('pdf');
  const [quality, setQuality] = useState('ultra');
  const formats = [
    { id: 'pdf', label: 'PDF', detail: 'Exact visual, all pages', icon: FileText },
    { id: 'docx', label: 'Word (exact)', detail: 'Pixel-perfect visual .docx', icon: File },
    { id: 'docx-editable', label: 'Word (editable)', detail: 'Editable text, simplified layout', icon: File },
    { id: 'png', label: 'PNG', detail: 'Lossless exact image', icon: FileImage },
    { id: 'jpg', label: 'JPG', detail: 'High-quality exact image', icon: ImageIcon },
    { id: 'html', label: 'HTML', detail: 'Exact browser document', icon: FileStack },
    { id: 'txt', label: 'Text', detail: 'Plain-text ATS copy', icon: FileText },
    { id: 'rtf', label: 'RTF', detail: 'Editable universal text', icon: FileText },
    { id: 'svg', label: 'SVG', detail: 'Exact visual image', icon: FileImage },
  ];
  const exactVisual = ['pdf', 'docx', 'png', 'jpg', 'html', 'svg'].includes(format);
  return <div className="modal-backdrop" onMouseDown={e => e.target === e.currentTarget && onClose()}><div className="export-modal" role="dialog" aria-modal="true"><div className="modal-head"><div><span className="panel-kicker">EXPORT STUDIO</span><h2>Finish your resume</h2><p>Exact visual formats use the same rendered page shown in the editor.</p></div><button onClick={onClose}><X size={20}/></button></div><div className="format-grid">{formats.map(({ id, label, detail, icon: Icon }) => <button key={id} className={format === id ? 'active' : ''} onClick={() => setFormat(id)}><Icon size={20}/><span><strong>{label}</strong><small>{detail}</small></span>{format === id && <Check size={15}/>}</button>)}</div>{['pdf','docx','png','jpg','svg'].includes(format) && <label className="quality-select"><span><strong>Render quality</strong><small>Higher quality creates a larger file.</small></span><select value={quality} onChange={e => setQuality(e.target.value)}><option value="high">High · 2×</option><option value="ultra">Ultra · 4×</option></select></label>}<div className={`export-note ${exactVisual ? '' : 'is-semantic'}`}><Check size={15}/><span>{exactVisual ? 'Exact visual export: design, alignment, colors, photos, and page geometry are preserved.' : 'Editable/ATS text formats preserve content; their file standards cannot preserve arbitrary web layouts.'}</span></div><div className="modal-actions"><button className="secondary-button" onClick={onClose}>Cancel</button><button className="primary-button" onClick={() => onExport(format, quality)} disabled={exporting}>{exporting ? <LoaderCircle className="spin" size={17}/> : <Download size={17}/>} {exporting ? 'Preparing…' : `Export ${format.toUpperCase()}`}</button></div></div></div>;
}

function SavedModal({ saves, onClose, onLoad, onDelete, onNew }) {
  return <div className="modal-backdrop" onMouseDown={e => e.target === e.currentTarget && onClose()}><div className="saved-modal"><div className="modal-head"><div><span className="panel-kicker">YOUR WORK</span><h2>Saved resumes</h2><p>Stored securely in this browser.</p></div><button onClick={onClose}><X size={20}/></button></div><button className="new-resume-card" onClick={onNew}><Plus size={20}/><span><strong>Start a new resume</strong><small>Begin with the selected format</small></span></button><div className="saved-list">{saves.length ? saves.map(save => <div className="saved-item" key={save.id}><div className="saved-mini"><i style={{background: save.accent}}/></div><button className="saved-copy" onClick={() => onLoad(save)}><strong>{save.name}</strong><span>{save.template} · Edited {new Date(save.updatedAt).toLocaleDateString()}</span></button><button className="delete-save" onClick={() => onDelete(save.id)} title="Delete"><Trash2 size={16}/></button></div>) : <div className="empty-saves"><FileText size={28}/><strong>No saved resumes yet</strong><span>Your first save will appear here.</span></div>}</div></div></div>;
}

function HomePage({ saves, onCreate, onImport, onBrowseGroup, onLoad, onDelete }) {
  const scrollTo = id => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  return (
    <div className="home-shell">
      <header className="home-nav">
        <button className="brand home-brand" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <div className="brand-mark"><FileText size={18}/><i/></div><div><strong>ResumeForge</strong><span>Precision career studio</span></div>
        </button>
        <nav>
          <button onClick={() => scrollTo('template-types')}>Template types</button>
          <button onClick={() => scrollTo('home-features')}>Features</button>
          <button onClick={() => scrollTo('saved-resumes')}>Saved resumes <em>{saves.length}</em></button>
        </nav>
        <button className="home-create-small" onClick={onCreate}><Plus size={16}/>Create resume</button>
      </header>

      <main>
        <section className="home-hero">
          <div className="hero-copy">
            <span className="hero-kicker"><Sparkles size={14}/> BUILT FOR EVERY CAREER STORY</span>
            <h1>Build a resume that feels unmistakably yours.</h1>
            <p>Start with a true template type, draft or refine it with review-first AI, check ATS readiness, and export a polished document in minutes.</p>
            <div className="hero-actions">
              <button className="home-primary" onClick={onCreate}><FilePlus2 size={18}/>Create new resume<ChevronRight size={16}/></button>
              <button className="home-secondary upload-resume-home" onClick={onImport}><FileUp size={18}/>Upload existing resume</button>
              <button className="home-secondary" onClick={() => scrollTo('saved-resumes')}><FileStack size={18}/>Go to saved resumes</button>
            </div>
            <div className="hero-proof"><span><Check size={14}/>Review-first AI</span><span><Check size={14}/>Explainable ATS preflight</span><span><Check size={14}/>Ultra-quality export</span></div>
          </div>
          <div className="hero-visual" aria-label="Resume template examples">
            {TEMPLATE_GROUPS.slice(0, 3).map((group, index) => <button key={group.id} className={`hero-sheet hero-sheet-${index + 1} layout-${group.layouts[0]}`} style={{ '--sheet-accent': group.accent }} onClick={() => onBrowseGroup(group.id)}><span>{group.title}</span><div className="hero-sheet-head"><i/><b/></div><hr/><div className="hero-sheet-body"><i/><i/><i/><i/><i/></div></button>)}
            <div className="hero-template-count"><strong>{TOTAL_TEMPLATE_COUNT.toLocaleString()}</strong><span>original templates<br/>across {TEMPLATE_GROUPS.length} types</span></div>
          </div>
        </section>

        <section className="home-metrics" id="home-features">
          <div><strong>{TOTAL_TEMPLATE_COUNT.toLocaleString()}</strong><span>Templates</span><small>{TEMPLATE_GROUPS.length} structural types in {TEMPLATE_COLLECTIONS.length} collections</small></div>
          <div><strong>{SECTION_CATALOG.length}</strong><span>Resume sections</span><small>Use only what your story needs</small></div>
          <div><strong>8</strong><span>Export formats</span><small>PDF, Word, image, web, and more</small></div>
          <div><strong>4×</strong><span>Ultra quality</span><small>Sharp output for print and screens</small></div>
        </section>

        <section className="home-section template-types-section" id="template-types">
          <div className="home-section-head"><div><span className="panel-kicker">TEMPLATE LIBRARY</span><h2>Choose a format, style, industry, global CV, or specialist story.</h2><p>Every type has four page architectures plus typography, header, color, density, section-heading, photo, and corner systems.</p></div><button onClick={onCreate}>Browse all {TOTAL_TEMPLATE_COUNT.toLocaleString()} <ChevronRight size={15}/></button></div>
          <div className="home-collections">
            {TEMPLATE_COLLECTIONS.map(collection => <section className="home-collection-block" key={collection.id}>
              <div className="home-collection-title"><div><span>{collection.title}</span><small>{collection.description}</small></div><em>{TEMPLATE_GROUPS.filter(group => group.collection === collection.id).length} types</em></div>
              <div className="home-groups">
                {TEMPLATE_GROUPS.filter(group => group.collection === collection.id).map((group, index) => (
                  <button className="home-group-card" key={group.id} onClick={() => onBrowseGroup(group.id)}>
                    <div className={`home-group-preview layout-${group.layouts[0]} header-${HEADER_STYLES[index % HEADER_STYLES.length]} heading-${SECTION_STYLES[index % SECTION_STYLES.length]}`} style={{ '--group-accent': group.accent }}><div className="gp-head"><i/><span/></div><b/><div className="gp-cols"><span/><span/></div><em>{String(index + 1).padStart(2, '0')}</em></div>
                    <div className="home-group-copy"><span>{group.title}</span><small>{group.description}</small><em>{TEMPLATES_PER_GROUP.toLocaleString()} templates <ChevronRight size={12}/></em></div>
                  </button>
                ))}
              </div>
            </section>)}
          </div>
        </section>

        <section className="home-section home-sections-showcase">
          <div className="home-section-head"><div><span className="panel-kicker">SECTION LIBRARY</span><h2>Every section your career may need.</h2><p>Turn sections on or off without rebuilding the document.</p></div></div>
          <div className="section-chip-grid">{SECTION_LABELS.map((label, index) => <span key={label}><i>{String(index + 1).padStart(2, '0')}</i>{label}<Check size={13}/></span>)}</div>
        </section>

        <section className="home-section home-saved" id="saved-resumes">
          <div className="home-section-head"><div><span className="panel-kicker">YOUR WORK</span><h2>Saved resumes</h2><p>Continue editing a resume saved in this browser.</p></div><button onClick={onCreate}><Plus size={15}/>New resume</button></div>
          {saves.length ? <div className="home-saved-grid">{saves.map(save => <article key={save.id}><div className="saved-document-preview"><i style={{ background: save.accent }}/><b/><span/><span/></div><div><strong>{save.name}</strong><span>{save.template}</span><small>Updated {new Date(save.updatedAt).toLocaleDateString()}</small></div><button onClick={() => onLoad(save)}>Continue <ChevronRight size={14}/></button><button className="home-delete" onClick={() => onDelete(save.id)} title="Delete saved resume"><Trash2 size={14}/></button></article>)}</div> : <div className="home-empty-saved"><div><FileStack size={25}/></div><strong>No saved resumes yet</strong><p>Create your first resume and it will appear here automatically.</p><button onClick={onCreate}><Plus size={15}/>Create new resume</button></div>}
        </section>
      </main>
      <footer className="home-footer"><div className="brand"><div className="brand-mark"><FileText size={17}/><i/></div><div><strong>ResumeForge</strong><span>Precision career studio</span></div></div><p>Build with clarity. Review with AI. Export with confidence.</p><span>{TOTAL_TEMPLATE_COUNT.toLocaleString()} templates · {SECTION_CATALOG.length} sections · AI + ATS</span></footer>
    </div>
  );
}

export default function App() {
  const resumeRef = useRef(null);
  const imageUploadRef = useRef(null);
  const profileImageUploadRef = useRef(null);
  const fontUploadRef = useRef(null);
  const aiEditableTargetRef = useRef(null);
  const aiAbortRef = useRef(null);
  const analysisTimerRef = useRef(null);
  const autosaveInputTimerRef = useRef(null);
  const draggedSectionRef = useRef(null);
  const initialPagesRef = useRef(null);
  if (!initialPagesRef.current) initialPagesRef.current = readDraftPages();
  const [view, setView] = useState('home');
  const [selectedTemplate, setSelectedTemplate] = useState(templates[0]);
  const [templateGroup, setTemplateGroup] = useState('all');
  const [accent, setAccent] = useState(templates[0].accent);
  const [font, setFont] = useState(templates[0].font);
  const [headingFont, setHeadingFont] = useState(templates[0].font);
  const [fontSize, setFontSize] = useState('11');
  const [baseFontSize, setBaseFontSize] = useState(11);
  const [scale, setScale] = useState(100);
  const [fontWeight, setFontWeight] = useState(400);
  const [lineHeight, setLineHeight] = useState(1.4);
  const [letterSpacing, setLetterSpacing] = useState(0);
  const [wordSpacing, setWordSpacing] = useState(0);
  const [paragraphSpacing, setParagraphSpacing] = useState(8);
  const [textColor, setTextColor] = useState('#222629');
  const [headingColor, setHeadingColor] = useState(templates[0].accent);
  const [secondaryAccent, setSecondaryAccent] = useState('#315b51');
  const [pageBackground, setPageBackground] = useState('#ffffff');
  const [highlightColor, setHighlightColor] = useState('#f4d8aa');
  const [pattern, setPattern] = useState('none');
  const [listStyle, setListStyle] = useState('disc');
  const [textAlignment, setTextAlignment] = useState('left');
  const [textDirection, setTextDirection] = useState('ltr');
  const [margins, setMargins] = useState(20);
  const [paperSize, setPaperSize] = useState('a4');
  const [layout, setLayout] = useState(templates[0].layout);
  const [imageSize, setImageSize] = useState(160);
  const [profileImageSize, setProfileImageSize] = useState(78);
  const [imageWrap, setImageWrap] = useState('inline');
  const [imageRadius, setImageRadius] = useState(6);
  const [imageBorderWidth, setImageBorderWidth] = useState(0);
  const [imageBrightness, setImageBrightness] = useState(100);
  const [imageContrast, setImageContrast] = useState(100);
  const [sections, setSections] = useState(DEFAULT_SECTIONS);
  const [panel, setPanel] = useState(null);
  const [tab, setTab] = useState('design');
  const [zoom, setZoom] = useState(82);
  const [pages, setPages] = useState(initialPagesRef.current);
  const [activePage, setActivePage] = useState(0);
  const [contentMarkup, setContentMarkup] = useState(initialPagesRef.current[0]);
  // Keep the React-owned markup stable while the user is typing. Replacing a
  // contenteditable element's innerHTML on every input moves the caret and can
  // make the editor accept only one character before it must be clicked again.
  const [analysisMarkup, setAnalysisMarkup] = useState(initialPagesRef.current[0]);
  const [headerFooter, setHeaderFooter] = useState(false);
  const [documentColumns, setDocumentColumns] = useState(2);
  const [pageDesignScope, setPageDesignScope] = useState('all');
  const [pageDesignOverrides, setPageDesignOverrides] = useState({});
  const [customFonts, setCustomFonts] = useState([]);
  const [docKey, setDocKey] = useState(0);
  const [isSaved, setIsSaved] = useState(true);
  const [autoSave, setAutoSave] = useState(true);
  const [exportOpen, setExportOpen] = useState(false);
  const [savedOpen, setSavedOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [importSession, setImportSession] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [toast, setToast] = useState('');
  const [saves, setSaves] = useState(readSavedResumes);
  const defaultAIProvider = AI_PROVIDERS[0];
  const [aiConfig, setAIConfig] = useState({ provider: defaultAIProvider.id, model: defaultAIProvider.model, endpoint: defaultAIProvider.endpoint, apiKey: '', useResearch: false });
  const [aiConnection, setAIConnection] = useState(defaultAIProvider.local ? 'connected' : 'idle');
  const [aiBusy, setAIBusy] = useState(false);
  const [aiResult, setAIResult] = useState(null);
  const [aiError, setAIError] = useState('');
  const [aiResultTask, setAIResultTask] = useState('');
  const [aiTarget, setAITarget] = useState(null);
  const [aiUndo, setAIUndo] = useState(null);
  const [jobDescription, setJobDescription] = useState('');
  const [resumeRevision, setResumeRevision] = useState(0);

  const baseDesign = {
    accent, secondaryAccent, textColor, headingColor, pageBackground, highlightColor,
    pattern, font, headingFont, baseFontSize, headingScale: scale, fontWeight,
    lineHeight, letterSpacing, wordSpacing, paragraphSpacing, textAlignment,
    textDirection, listStyle, margins, paperSize, layout, imageSize,
    profileImageSize, imageWrap, imageRadius, imageBorderWidth, imageBrightness,
    imageContrast
  };

  const designSetters = {
    accent: setAccent, secondaryAccent: setSecondaryAccent, textColor: setTextColor,
    headingColor: setHeadingColor, pageBackground: setPageBackground,
    highlightColor: setHighlightColor, pattern: setPattern, font: setFont,
    headingFont: setHeadingFont, baseFontSize: setBaseFontSize,
    headingScale: setScale, fontWeight: setFontWeight, lineHeight: setLineHeight,
    letterSpacing: setLetterSpacing, wordSpacing: setWordSpacing,
    paragraphSpacing: setParagraphSpacing, textAlignment: setTextAlignment,
    textDirection: setTextDirection, listStyle: setListStyle, margins: setMargins,
    paperSize: setPaperSize, layout: setLayout, imageSize: setImageSize,
    profileImageSize: setProfileImageSize, imageWrap: setImageWrap,
    imageRadius: setImageRadius, imageBorderWidth: setImageBorderWidth,
    imageBrightness: setImageBrightness, imageContrast: setImageContrast
  };

  const resolvePageDesign = pageIndex => ({ ...baseDesign, ...(pageDesignOverrides[pageIndex] || {}) });
  const activeDesign = resolvePageDesign(activePage);
  const activeTemplate = templates.find(template => template.id === pageDesignOverrides[activePage]?.templateId) || selectedTemplate;
  const activePaper = PAPER_SIZES.find(size => size.id === activeDesign.paperSize) || PAPER_SIZES[0];
  const activeListDefinition = LIST_STYLES.find(style => style.id === activeDesign.listStyle) || LIST_STYLES[0];
  const layoutChoices = [...new Set([activeTemplate?.layout, ...(TEMPLATE_GROUPS.find(item => item.id === activeTemplate?.group)?.layouts || ['editorial', 'sidebar', 'classic'])])].filter(Boolean);
  const analysisPages = useMemo(() => pages.map((markup, index) => index === activePage ? analysisMarkup : markup), [pages, activePage, analysisMarkup, resumeRevision]);
  const resumeContext = useMemo(() => extractResumeContext(analysisPages), [analysisPages]);
  const atsReport = useMemo(() => analyzeATS({ html: analysisPages.join('\n'), jobDescription }), [analysisPages, jobDescription]);

  const changeDesign = (key, value) => {
    if (pageDesignScope === 'page') {
      setPageDesignOverrides(current => ({ ...current, [activePage]: { ...(current[activePage] || {}), [key]: value } }));
    } else {
      designSetters[key]?.(value);
    }
    setIsSaved(false);
  };

  const designClassForPage = pageIndex => {
    const design = resolvePageDesign(pageIndex);
    const template = templates.find(item => item.id === pageDesignOverrides[pageIndex]?.templateId) || selectedTemplate;
    const listDefinition = LIST_STYLES.find(item => item.id === design.listStyle) || LIST_STYLES[0];
    return `resume-page ${templateClasses({ ...template, layout: design.layout })} density-${template.density} document-columns-${documentColumns} pattern-${design.pattern} image-wrap-${design.imageWrap} text-align-${design.textAlignment} direction-${design.textDirection} list-kind-${listDefinition.kind} list-style-${design.listStyle} ${listDefinition.marker ? 'list-custom-marker' : ''} ${headerFooter ? 'show-page-furniture' : ''}`;
  };

  const designStyleForPage = pageIndex => {
    const design = resolvePageDesign(pageIndex);
    const paper = PAPER_SIZES.find(size => size.id === design.paperSize) || PAPER_SIZES[0];
    const listDefinition = LIST_STYLES.find(item => item.id === design.listStyle) || LIST_STYLES[0];
    return {
      '--accent': design.accent,
      '--secondary-accent': design.secondaryAccent,
      '--text-color': design.textColor,
      '--heading-color': design.headingColor,
      '--page-background': design.pageBackground,
      '--highlight-color': design.highlightColor,
      '--doc-font': design.font,
      '--heading-font': design.headingFont,
      '--base-font-size': `${design.baseFontSize}px`,
      '--type-scale': design.headingScale / 100,
      '--font-weight': design.fontWeight,
      '--line-height': design.lineHeight,
      '--letter-spacing': `${design.letterSpacing}px`,
      '--word-spacing': `${design.wordSpacing}px`,
      '--paragraph-spacing': `${design.paragraphSpacing}px`,
      '--page-margin': `${design.margins * 3.78}px`,
      '--page-width': `${paper.widthPx}px`,
      '--page-height': `${paper.heightPx}px`,
      '--image-size': `${design.imageSize}px`,
      '--profile-image-size': `${design.profileImageSize}px`,
      '--image-radius': `${design.imageRadius}px`,
      '--image-border-width': `${design.imageBorderWidth}px`,
      '--image-brightness': `${design.imageBrightness}%`,
      '--image-contrast': `${design.imageContrast}%`,
      '--list-style-type': listDefinition.cssType || 'disc',
      '--list-marker': listDefinition.marker ? `"${listDefinition.marker}  "` : 'normal'
    };
  };

  const notify = message => { setToast(message); window.clearTimeout(window.__resumeToast); window.__resumeToast = window.setTimeout(() => setToast(''), 2600); };

  const updateAIConfig = patch => {
    setAIConfig(current => ({ ...current, ...patch }));
    const nextProvider = AI_PROVIDERS.find(item => item.id === (patch.provider || aiConfig.provider));
    setAIConnection(nextProvider?.local ? 'connected' : 'idle');
  };

  const rememberEditableTarget = event => {
    const editable = event.target.closest?.('[contenteditable="true"]');
    if (editable && resumeRef.current?.contains(editable)) aiEditableTargetRef.current = editable;
  };

  const markEditorChanged = event => {
    const html = event.currentTarget.innerHTML;
    window.clearTimeout(analysisTimerRef.current);
    analysisTimerRef.current = window.setTimeout(() => {
      setAnalysisMarkup(cleanEditorMarkup(html));
      setResumeRevision(value => value + 1);
    }, 250);
    window.clearTimeout(autosaveInputTimerRef.current);
    if (autoSave) {
      // Reset persistence on every keystroke. React may batch repeated
      // setIsSaved(false) calls, so the state-driven effect alone cannot be
      // relied on to restart its timer for the final character.
      autosaveInputTimerRef.current = window.setTimeout(() => autoSaveDraft(), 900);
    }
    setIsSaved(false);
  };

  const decorateSectionControls = () => {
    if (!resumeRef.current) return;
    resumeRef.current.querySelectorAll('.resume-section').forEach(section => {
      section.querySelectorAll(':scope > .section-heading > span').forEach(marker => {
        if (/^\d+$/.test(marker.textContent.trim())) marker.remove();
      });
      section.classList.add('section-reorderable');
      const name = getSectionName(section);
      let toolbar = section.querySelector(':scope > [data-editor-ui="section-controls"]');
      if (!toolbar) {
        toolbar = document.createElement('div');
        toolbar.className = 'section-move-toolbar';
        toolbar.dataset.editorUi = 'section-controls';
        toolbar.contentEditable = 'false';
        toolbar.setAttribute('role', 'toolbar');
        toolbar.setAttribute('aria-label', `Edit ${name} section`);
        const controls = [
          ['drag', '⠿', `Drag ${name} anywhere`],
          ['up', '↑', `Move ${name} up`],
          ['down', '↓', `Move ${name} down`],
          ['left', '←', `Move ${name} to left column`],
          ['right', '→', `Move ${name} to right column`],
        ];
        controls.forEach(([action, symbol, label]) => {
          const button = document.createElement('button');
          button.type = 'button';
          button.textContent = symbol;
          button.title = label;
          button.setAttribute('aria-label', label);
          if (action === 'drag') {
            button.className = 'section-drag-handle';
            button.draggable = true;
            button.dataset.sectionDragHandle = 'true';
          } else button.dataset.sectionAction = action;
          toolbar.appendChild(button);
        });
        section.prepend(toolbar);
      }

      if (!isRepeatableSection(section)) return;
      normalizeSectionItems(section);
      if (name === 'Projects') {
        normalizeProjectEntries(section).forEach(entry => {
          if (entry.querySelector(':scope > [data-project-action="details"]')) return;
          const projectName = entry.querySelector('.project-row strong')?.textContent?.trim() || 'project';
          const hasDetails = Boolean(entry.querySelector(':scope > .project-details'));
          const detailsButton = document.createElement('button');
          detailsButton.type = 'button';
          detailsButton.className = 'project-details-button';
          detailsButton.dataset.editorUi = 'project-controls';
          detailsButton.dataset.projectAction = 'details';
          detailsButton.contentEditable = 'false';
          detailsButton.textContent = hasDetails ? 'Edit project details' : '+ Add project details';
          detailsButton.title = `${hasDetails ? 'Edit' : 'Add'} details for ${projectName}`;
          detailsButton.setAttribute('aria-label', `${hasDetails ? 'Edit' : 'Add'} details for ${projectName}`);
          entry.appendChild(detailsButton);
        });
      }
      const heading = section.querySelector(':scope > .section-heading');
      if (heading && !heading.querySelector('[data-item-action="add"]')) {
        const addButton = document.createElement('button');
        addButton.type = 'button';
        addButton.textContent = '+';
        addButton.className = 'section-add-item-button';
        addButton.dataset.editorUi = 'item-controls';
        addButton.dataset.itemAction = 'add';
        addButton.contentEditable = 'false';
        addButton.title = `Add ${name} item`;
        addButton.setAttribute('aria-label', `Add ${name} item`);
        heading.appendChild(addButton);
      }
      getSectionItems(section).forEach((item, index) => {
        item.classList.add('resume-item-editable');
        item.dataset.itemEditable = 'true';
        if (item.querySelector(':scope > [data-editor-ui="item-controls"]')) return;
        const removeButton = document.createElement('button');
        removeButton.type = 'button';
        removeButton.textContent = '×';
        removeButton.className = 'item-remove-button';
        removeButton.dataset.editorUi = 'item-controls';
        removeButton.dataset.itemAction = 'remove';
        removeButton.contentEditable = 'false';
        removeButton.title = `Remove ${name} item ${index + 1}`;
        removeButton.setAttribute('aria-label', `Remove ${name} item ${index + 1}`);
        item.appendChild(removeButton);
      });
    });
  };

  const commitSectionMovement = message => {
    if (!resumeRef.current) return;
    const html = cleanEditorMarkup(resumeRef.current.innerHTML);
    setPages(current => current.map((markup, index) => index === activePage ? html : markup));
    setContentMarkup(html);
    setAnalysisMarkup(html);
    setResumeRevision(value => value + 1);
    setIsSaved(false);
    notify(message);
  };

  const mutateResumeSectionItem = (name, action, explicitSection = null, explicitItem = null) => {
    if (!resumeRef.current) return false;
    const section = explicitSection || [...resumeRef.current.querySelectorAll('.resume-section')]
      .find(item => item.style.display !== 'none' && getSectionName(item) === name);
    if (!section || !isRepeatableSection(section)) {
      notify(`${name} uses a single text field`);
      return false;
    }
    const changed = action === 'add' ? Boolean(addSectionItem(section)) : removeSectionItem(section, explicitItem);
    if (!changed) {
      notify(`No ${name} item is available to remove`);
      return false;
    }
    commitSectionMovement(`${name} item ${action === 'add' ? 'added' : 'removed'}`);
    return true;
  };

  const moveResumeSection = (name, direction, explicitSection = null) => {
    if (!resumeRef.current) return false;
    const section = explicitSection || [...resumeRef.current.querySelectorAll('.resume-section')]
      .find(item => item.style.display !== 'none' && getSectionName(item) === name);
    if (!section) {
      notify(`${name} is not visible on this page`);
      return false;
    }
    const moved = moveSectionInDocument(resumeRef.current, section, direction);
    if (!moved) {
      notify(`${name} cannot move ${direction} from its current position`);
      return false;
    }
    commitSectionMovement(`${name} moved ${direction}`);
    return true;
  };

  const handleEditorClick = event => {
    const projectActionButton = event.target.closest?.('[data-project-action="details"]');
    if (projectActionButton) {
      event.preventDefault();
      event.stopPropagation();
      const entry = projectActionButton.closest('.project-entry');
      const existed = Boolean(entry?.querySelector(':scope > .project-details'));
      const details = ensureProjectDetails(entry);
      if (!details) return;
      if (!existed) {
        projectActionButton.textContent = 'Edit project details';
        projectActionButton.setAttribute('aria-label', projectActionButton.getAttribute('aria-label')?.replace(/^Add/, 'Edit') || 'Edit project details');
        setAnalysisMarkup(cleanEditorMarkup(resumeRef.current.innerHTML));
        setResumeRevision(value => value + 1);
        setIsSaved(false);
        notify('Project details added — edit the suggested fields or press Enter for free text');
      }
      window.requestAnimationFrame(() => details.focus());
      return;
    }
    const itemActionButton = event.target.closest?.('[data-item-action]');
    if (itemActionButton) {
      event.preventDefault();
      event.stopPropagation();
      const section = itemActionButton.closest('.resume-section');
      const item = itemActionButton.closest('[data-item-editable]');
      mutateResumeSectionItem(getSectionName(section), itemActionButton.dataset.itemAction, section, item);
      return;
    }
    const actionButton = event.target.closest?.('[data-section-action]');
    if (actionButton) {
      event.preventDefault();
      event.stopPropagation();
      const section = actionButton.closest('.resume-section');
      moveResumeSection(getSectionName(section), actionButton.dataset.sectionAction, section);
      return;
    }
    event.stopPropagation();
    rememberEditableTarget(event);
  };

  const clearSectionDropIndicators = () => {
    resumeRef.current?.querySelectorAll('.section-drop-before, .section-drop-after').forEach(section => {
      section.classList.remove('section-drop-before', 'section-drop-after');
    });
  };

  const handleSectionDragStart = event => {
    const handle = event.target.closest?.('[data-section-drag-handle]');
    if (!handle) return;
    const section = handle.closest('.resume-section');
    draggedSectionRef.current = section;
    section.classList.add('section-dragging');
    section.setAttribute('aria-grabbed', 'true');
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', getSectionName(section));
    }
  };

  const handleSectionDragOver = event => {
    const source = draggedSectionRef.current;
    if (!source) return;
    const target = event.target.closest?.('.resume-section');
    const column = event.target.closest?.('.resume-main, .resume-aside');
    if (!target && !column) return;
    event.preventDefault();
    if (event.dataTransfer) event.dataTransfer.dropEffect = 'move';
    clearSectionDropIndicators();
    if (target && target !== source) {
      const bounds = target.getBoundingClientRect();
      target.classList.add(event.clientY > bounds.top + bounds.height / 2 ? 'section-drop-after' : 'section-drop-before');
    }
  };

  const handleSectionDrop = event => {
    const source = draggedSectionRef.current;
    if (!source || !resumeRef.current) return;
    event.preventDefault();
    const name = getSectionName(source);
    const target = event.target.closest?.('.resume-section');
    const column = event.target.closest?.('.resume-main, .resume-aside');
    let moved = false;
    if (target && target !== source) {
      const placement = target.classList.contains('section-drop-after') ? 'after' : 'before';
      moved = dropSectionAt(resumeRef.current, source, target, placement);
    } else if (column) moved = dropSectionInColumn(resumeRef.current, source, column);
    clearSectionDropIndicators();
    source.classList.remove('section-dragging');
    source.removeAttribute('aria-grabbed');
    draggedSectionRef.current = null;
    if (moved) commitSectionMovement(`${name} moved to the selected position`);
  };

  const handleSectionDragEnd = () => {
    const source = draggedSectionRef.current;
    source?.classList.remove('section-dragging');
    source?.removeAttribute('aria-grabbed');
    draggedSectionRef.current = null;
    clearSectionDropIndicators();
  };

  const cancelAIRequest = () => {
    aiAbortRef.current?.abort();
    aiAbortRef.current = null;
    setAIBusy(false);
    setAIError('Request cancelled.');
  };

  const beginAIRequest = () => {
    aiAbortRef.current?.abort();
    const controller = new AbortController();
    aiAbortRef.current = controller;
    setAIBusy(true);
    setAIError('');
    setAIResult(null);
    return controller;
  };

  const testProvider = async () => {
    const controller = beginAIRequest();
    setAIConnection('testing');
    try {
      const result = await testAIConnection(aiConfig, controller.signal);
      if (!result.ok) throw new Error('The provider responded, but the connection check was not recognized.');
      setAIConnection('connected');
      notify(`${result.provider} connection verified`);
    } catch (error) {
      if (error.name !== 'AbortError') {
        setAIConnection('failed');
        setAIError(error.message || 'Could not connect to the AI provider.');
      }
    } finally {
      if (aiAbortRef.current === controller) aiAbortRef.current = null;
      setAIBusy(false);
    }
  };

  const runAIRequest = async (task, payload = {}) => {
    const controller = beginAIRequest();
    const currentPages = snapshotPages();
    const context = extractResumeContext(currentPages);
    const requestPayload = { ...payload };
    let target = null;
    if (task === 'grammar') {
      if (payload.scope === 'field') {
        const editable = aiEditableTargetRef.current && resumeRef.current?.contains(aiEditableTargetRef.current) ? aiEditableTargetRef.current : resumeRef.current?.querySelector('.resume-intro p, [contenteditable="true"]');
        if (!editable) {
          setAIError('Click an editable resume field first, then run the grammar correction.');
          controller.abort();
          aiAbortRef.current = null;
          setAIBusy(false);
          return;
        }
        const selection = window.getSelection?.();
        const selectedText = selection && !selection.isCollapsed && editable.contains(selection.anchorNode) ? selection.toString().trim() : '';
        requestPayload.text = selectedText || editable.textContent.trim();
        target = { scope: 'field', originalText: editable.textContent, selectedText };
      } else if (payload.scope === 'page') {
        requestPayload.text = extractResumeContext([currentPages[activePage]]).text;
        target = { scope: 'page', pageIndex: activePage };
      } else {
        requestPayload.text = context.text;
        target = { scope: 'resume' };
      }
    } else if (task === 'section') target = { scope: 'section', section: payload.section };
    setAITarget(target);
    setAIResultTask(task);
    try {
      const result = await callAIProvider(aiConfig, { task, payload: requestPayload, context, jobDescription }, controller.signal);
      setAIResult(result);
      setAIConnection('connected');
    } catch (error) {
      if (error.name !== 'AbortError') setAIError(error.message || 'The AI request could not be completed.');
    } finally {
      if (aiAbortRef.current === controller) aiAbortRef.current = null;
      setAIBusy(false);
    }
  };

  const finishAIApply = message => {
    setResumeRevision(value => value + 1);
    setIsSaved(false);
    setAIResult(null);
    setAIError('');
    notify(message);
  };

  const applyAIResult = () => {
    if (!aiResult) return;
    try {
      setAIUndo({ pages: snapshotPages(), activePage, sections, label: aiResultTask });
      if (aiResultTask === 'full') {
        const data = parseStructuredResume(aiResult.text);
        const photo = resumeRef.current?.querySelector('.resume-photo:not([style*="display: none"])')?.getAttribute('src') || '';
        const markup = buildAIResumeMarkup(data, { photoUrl: photo });
        setPages([markup]);
        setActivePage(0);
        setContentMarkup(markup);
        setDocKey(key => key + 1);
        setPageDesignOverrides(current => current[0] ? { 0: current[0] } : {});
        const enabled = { ...DEFAULT_SECTIONS };
        Object.keys(enabled).forEach(key => { enabled[key] = markup.includes(`>${key}<`) || markup.includes(`data-section-name="${key}"`); });
        setSections(enabled);
        persistPageDraft([markup]);
        finishAIApply('AI resume applied — verify every fact before export');
        return;
      }
      if (aiResultTask === 'section') {
        const name = aiTarget?.section || 'Custom Section';
        const replacement = aiSectionMarkup(name, aiResult.text);
        const matching = [...(resumeRef.current?.querySelectorAll('.resume-section') || [])].find(section => section.dataset.sectionName === name || section.querySelector('h2')?.textContent.trim() === name);
        if (matching) matching.outerHTML = replacement;
        else (resumeRef.current?.querySelector('.resume-main') || resumeRef.current)?.insertAdjacentHTML('beforeend', replacement);
        setSections(current => ({ ...current, [name]: true }));
        const html = cleanEditorMarkup(resumeRef.current.innerHTML);
        setContentMarkup(html);
        setPages(current => current.map((markup, index) => index === activePage ? html : markup));
        finishAIApply(`${name} updated with reviewed AI content`);
        return;
      }
      if (aiResultTask === 'grammar') {
        if (aiTarget?.scope === 'field') {
          const editable = aiEditableTargetRef.current;
          if (!editable || !resumeRef.current?.contains(editable)) throw new Error('The original editable field is no longer available.');
          editable.textContent = aiTarget.selectedText ? aiTarget.originalText.replace(aiTarget.selectedText, aiResult.text.trim()) : aiResult.text.trim();
          const html = cleanEditorMarkup(resumeRef.current.innerHTML);
          setContentMarkup(html);
          setPages(current => current.map((markup, index) => index === activePage ? html : markup));
          finishAIApply('Grammar correction applied');
          return;
        }
        const corrections = parseGrammarCorrections(aiResult.text);
        const sourcePages = snapshotPages();
        let totalApplied = 0;
        const correctedPages = sourcePages.map((markup, index) => {
          if (aiTarget?.scope === 'page' && index !== aiTarget.pageIndex) return markup;
          const corrected = applyCorrectionsToMarkup(markup, corrections);
          totalApplied += corrected.applied;
          return corrected.markup;
        });
        if (!totalApplied) throw new Error('None of the proposed corrections matched the current resume text.');
        setPages(correctedPages);
        setContentMarkup(correctedPages[activePage]);
        setDocKey(key => key + 1);
        persistPageDraft(correctedPages);
        finishAIApply(`${totalApplied} grammar correction${totalApplied === 1 ? '' : 's'} applied`);
      }
    } catch (error) {
      setAIError(error.message || 'The AI result could not be applied safely.');
    }
  };

  const insertAIResult = () => {
    if (!aiResult || !resumeRef.current) return;
    setAIUndo({ pages: snapshotPages(), activePage, sections, label: aiResultTask });
    const name = aiResultTask === 'suggestions' ? 'Resume Review Notes' : 'AI Research Notes';
    const sources = aiResult.sources?.length ? `\n\nSources:\n${aiResult.sources.map(source => `- ${source.title}: ${source.url}`).join('\n')}` : '';
    const markup = aiSectionMarkup(name, `${aiResult.text}${sources}`);
    (resumeRef.current.querySelector('.resume-main') || resumeRef.current).insertAdjacentHTML('beforeend', markup);
    const html = cleanEditorMarkup(resumeRef.current.innerHTML);
    setContentMarkup(html);
    setPages(current => current.map((page, index) => index === activePage ? html : page));
    finishAIApply(`${name} inserted`);
  };

  const undoLastAIChange = () => {
    if (!aiUndo?.pages?.length) return;
    setPages(aiUndo.pages);
    setActivePage(Math.min(aiUndo.activePage, aiUndo.pages.length - 1));
    setContentMarkup(aiUndo.pages[Math.min(aiUndo.activePage, aiUndo.pages.length - 1)]);
    setSections(aiUndo.sections || DEFAULT_SECTIONS);
    setDocKey(key => key + 1);
    persistPageDraft(aiUndo.pages);
    setAIUndo(null);
    setResumeRevision(value => value + 1);
    setIsSaved(false);
    notify('Last AI change undone');
  };

  const snapshotPages = () => {
    const next = [...pages];
    if (resumeRef.current) next[activePage] = cleanEditorMarkup(resumeRef.current.innerHTML);
    return next;
  };

  const persistPageDraft = next => {
    const compactPages = next.map(compactMarkupForStorage);
    storage.setItem('resumeforge-draft-pages', JSON.stringify(compactPages));
    storage.setItem('resumeforge-draft-html', compactPages[0] || compactMarkupForStorage(defaultResumeMarkup));
  };

  const captureDraft = () => {
    if (!resumeRef.current) return contentMarkup;
    const html = cleanEditorMarkup(resumeRef.current.innerHTML);
    const next = [...pages];
    next[activePage] = html;
    setPages(next);
    setContentMarkup(html);
    persistPageDraft(next);
    setIsSaved(true);
    return html;
  };

  const autoSaveDraft = () => {
    if (!resumeRef.current) return;
    const next = snapshotPages();
    setPages(next);
    persistPageDraft(next);
    setIsSaved(true);
  };

  const goToPage = pageIndex => {
    if (pageIndex < 0 || pageIndex >= pages.length || pageIndex === activePage) return;
    const next = snapshotPages();
    persistPageDraft(next);
    setPages(next);
    setActivePage(pageIndex);
    setContentMarkup(next[pageIndex]);
    setDocKey(key => key + 1);
  };

  const addPageVariant = variant => {
    const next = snapshotPages();
    const markup = variant === 'continuation' ? continuationResumeMarkup : blankResumeMarkup;
    next.push(markup);
    const nextPageIndex = next.length - 1;
    if (variant === 'different') {
      const currentTemplateIndex = templates.findIndex(template => template.id === activeTemplate.id);
      const alternateTemplate = templates[(currentTemplateIndex + TEMPLATES_PER_GROUP) % templates.length];
      setPageDesignOverrides(current => ({
        ...current,
        [nextPageIndex]: {
          templateId: alternateTemplate.id,
          accent: alternateTemplate.accent,
          headingColor: alternateTemplate.accent,
          font: alternateTemplate.font,
          headingFont: alternateTemplate.font,
          layout: alternateTemplate.layout,
          pattern: 'corner-arc'
        }
      }));
      setPageDesignScope('page');
    }
    persistPageDraft(next);
    setPages(next);
    setActivePage(nextPageIndex);
    setContentMarkup(markup);
    setDocKey(key => key + 1);
    setIsSaved(false);
    notify(`${variant === 'continuation' ? 'Continuation' : variant === 'different' ? 'Independent-design blank' : 'Blank'} page ${next.length} added`);
  };

  const addPage = () => addPageVariant('continuation');
  const addBlankPage = () => addPageVariant('blank');
  const addDifferentPage = () => addPageVariant('different');

  const deleteCurrentPage = () => {
    if (pages.length === 1) return notify('A resume needs at least one page');
    const next = snapshotPages().filter((_, index) => index !== activePage);
    const nextIndex = Math.min(activePage, next.length - 1);
    setPageDesignOverrides(current => Object.fromEntries(Object.entries(current).flatMap(([key, value]) => {
      const index = Number(key);
      if (index === activePage) return [];
      return [[index > activePage ? index - 1 : index, value]];
    })));
    persistPageDraft(next);
    setPages(next);
    setActivePage(nextIndex);
    setContentMarkup(next[nextIndex]);
    setDocKey(key => key + 1);
    setIsSaved(false);
    notify('Page removed');
  };

  useEffect(() => {
    if (!autoSave || isSaved) return;
    // Persist only after the user pauses. Deliberately avoid setContentMarkup
    // here so autosave never rewrites the live contenteditable DOM or its caret.
    const timer = setTimeout(() => autoSaveDraft(), 900);
    return () => clearTimeout(timer);
  }, [isSaved, autoSave, activePage, analysisMarkup]);

  useEffect(() => {
    window.clearTimeout(analysisTimerRef.current);
    setAnalysisMarkup(contentMarkup);
  }, [contentMarkup]);

  useEffect(() => () => {
    window.clearTimeout(analysisTimerRef.current);
    window.clearTimeout(autosaveInputTimerRef.current);
  }, []);

  useEffect(() => {
    if (!resumeRef.current) return;
    resumeRef.current.querySelectorAll('.resume-section').forEach(section => {
      const heading = section.querySelector('h2')?.textContent?.trim();
      if (heading && Object.prototype.hasOwnProperty.call(sections, heading)) {
        section.style.display = sections[heading] ? '' : 'none';
      }
    });
    decorateSectionControls();
  }, [sections, contentMarkup, docKey, layout]);

  const exec = (command, value = null) => {
    resumeRef.current?.focus();
    document.execCommand(command, false, value);
    setIsSaved(false);
  };

  const selectTemplate = template => {
    captureDraft();
    if (pageDesignScope === 'page') {
      setPageDesignOverrides(current => ({ ...current, [activePage]: { ...(current[activePage] || {}), templateId: template.id, accent: template.accent, headingColor: template.accent, font: template.font, headingFont: template.font, layout: template.layout } }));
      notify(`${template.name} applied to page ${activePage + 1}`);
    } else {
      setSelectedTemplate(template);
      setTemplateGroup(template.group);
      setAccent(template.accent);
      setHeadingColor(template.accent);
      setFont(template.font);
      setHeadingFont(template.font);
      setLayout(template.layout);
      notify(`${template.name} applied to all pages`);
    }
    setIsSaved(false);
  };

  const saveResume = () => {
    const currentPages = snapshotPages();
    setPages(currentPages);
    persistPageDraft(currentPages);
    const compactPages = currentPages.map(compactMarkupForStorage);
    const save = { id: Date.now(), name: importSession?.fileName || 'Ananya Rao — Senior Product Designer', template: selectedTemplate.name, templateId: selectedTemplate.id, group: selectedTemplate.group, accent, font, layout, sections, pages: compactPages, html: compactPages[0], headerFooter, documentColumns, customization: baseDesign, pageDesignOverrides, pageDesignScope, customFonts, jobDescription, importMetadata: importSession ? { fileName: importSession.fileName, fileType: importSession.fileType, method: importSession.method, sourceFingerprint: importSession.sourceFingerprint, mode: importSession.mode } : null, updatedAt: new Date().toISOString() };
    const next = [save, ...saves].slice(0, 12);
    setSaves(next);
    if (!storage.setItem('resumeforge-saves', JSON.stringify(next))) notify('Browser storage is full; export a copy to keep your work.');
    setIsSaved(true);
    notify('Resume saved');
  };

  const newResume = () => {
    setImportSession(null);
    setPages([defaultResumeMarkup]);
    setActivePage(0);
    setContentMarkup(defaultResumeMarkup);
    setDocKey(k => k + 1);
    setSections(DEFAULT_SECTIONS);
    setHeaderFooter(false);
    setDocumentColumns(2);
    setPageDesignScope('all');
    setPageDesignOverrides({});
    setAccent(templates[0].accent);
    setSecondaryAccent('#315b51');
    setTextColor('#222629');
    setHeadingColor(templates[0].accent);
    setPageBackground('#ffffff');
    setHighlightColor('#f4d8aa');
    setPattern('none');
    setFont(templates[0].font);
    setHeadingFont(templates[0].font);
    setFontSize('11');
    setBaseFontSize(11);
    setScale(100);
    setFontWeight(400);
    setLineHeight(1.4);
    setLetterSpacing(0);
    setWordSpacing(0);
    setParagraphSpacing(8);
    setTextAlignment('left');
    setTextDirection('ltr');
    setListStyle('disc');
    setMargins(20);
    setPaperSize('a4');
    setLayout(templates[0].layout);
    setImageSize(160);
    setProfileImageSize(78);
    setImageWrap('inline');
    setImageRadius(6);
    setImageBorderWidth(0);
    setImageBrightness(100);
    setImageContrast(100);
    setCustomFonts([]);
    setJobDescription('');
    setAIResult(null);
    setAIError('');
    setAIUndo(null);
    storage.removeItem('resumeforge-draft-html');
    storage.removeItem('resumeforge-draft-pages');
    setSavedOpen(false);
    setView('editor');
    setPanel('templates');
    setIsSaved(false);
    notify('New resume ready');
  };

  const installCustomFont = definition => {
    if (!definition?.name || !definition?.dataUrl) return;
    const styleId = `resume-font-${definition.name.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}`;
    let style = document.getElementById(styleId);
    if (!style) {
      style = document.createElement('style');
      style.id = styleId;
      document.head.appendChild(style);
    }
    const safeName = definition.name.replace(/["\\]/g, '');
    style.textContent = `@font-face{font-family:"${safeName}";src:url("${definition.dataUrl}") format("${definition.format || 'opentype'}");font-style:normal;font-weight:100 900;font-display:swap;}`;
  };

  const loadSave = save => {
    const savedTemplate = templates.find(template => template.id === save.templateId) || templates.find(template => template.name === save.template) || templates.find(template => template.group === save.group) || templates[0];
    const savedPages = (Array.isArray(save.pages) && save.pages.length ? save.pages : [save.html || defaultResumeMarkup]).map(hydrateMarkupFromStorage);
    setPages(savedPages);
    setActivePage(0);
    setContentMarkup(savedPages[0]);
    setAccent(save.accent || templates[0].accent);
    setHeadingColor(save.accent || templates[0].accent);
    setFont(save.font || templates[0].font);
    setHeadingFont(save.font || templates[0].font);
    setLayout(save.layout || templates[0].layout);
    if (save.customization) Object.entries(save.customization).forEach(([key, value]) => designSetters[key]?.(value));
    setSections(save.sections || DEFAULT_SECTIONS);
    setHeaderFooter(Boolean(save.headerFooter));
    setDocumentColumns(save.documentColumns || 2);
    setPageDesignOverrides(save.pageDesignOverrides || {});
    setPageDesignScope(save.pageDesignScope || 'all');
    setCustomFonts(save.customFonts || []);
    setJobDescription(save.jobDescription || '');
    setAIUndo(null);
    setImportSession(save.importMetadata ? { ...save.importMetadata, editablePages: savedPages, visualPages: [], mode: 'editable' } : null);
    (save.customFonts || []).forEach(installCustomFont);
    setSelectedTemplate(savedTemplate);
    setTemplateGroup(savedTemplate.group);
    setDocKey(k => k + 1);
    setSavedOpen(false);
    setView('editor');
    setIsSaved(true);
    notify('Saved resume opened');
  };

  const deleteSave = id => {
    const next = saves.filter(item => item.id !== id);
    setSaves(next);
    storage.setItem('resumeforge-saves', JSON.stringify(next));
  };

  const handleImageUpload = e => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = `<img class="inserted-resume-image" src="${reader.result}" alt="Inserted visual"/>`;
      exec('insertHTML', img);
    };
    reader.readAsDataURL(file);
  };

  const handleFontUpload = event => {
    const file = event.target.files?.[0];
    if (!file) return;
    const extension = file.name.split('.').pop()?.toLowerCase();
    const format = extension === 'woff2' ? 'woff2' : extension === 'woff' ? 'woff' : extension === 'ttf' ? 'truetype' : 'opentype';
    const name = file.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ').trim() || `Custom Font ${customFonts.length + 1}`;
    const reader = new FileReader();
    reader.onload = () => {
      const definition = { name, dataUrl: reader.result, format };
      installCustomFont(definition);
      setCustomFonts(current => [...current.filter(item => item.name !== name), definition]);
      changeDesign('font', name);
      changeDesign('headingFont', name);
      notify(`${name} font installed for this resume`);
      event.target.value = '';
    };
    reader.readAsDataURL(file);
  };

  const applyInlineFontSize = pixels => {
    if (!resumeRef.current) return;
    resumeRef.current.focus();
    const selection = window.getSelection?.();
    if (!selection || selection.isCollapsed || !resumeRef.current.contains(selection.anchorNode)) {
      changeDesign('baseFontSize', pixels);
      notify(`Document font size set to ${pixels}px`);
      return;
    }
    document.execCommand('fontSize', false, '7');
    resumeRef.current.querySelectorAll('font[size="7"]').forEach(node => {
      node.removeAttribute('size');
      node.style.fontSize = `${pixels}px`;
    });
    setIsSaved(false);
  };

  const handleProfilePhotoUpload = e => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = () => {
      resumeRef.current?.querySelectorAll('.resume-photo').forEach(photo => {
        photo.src = reader.result;
        photo.alt = file.name.replace(/\.[^.]+$/, '') || 'Profile photo';
        photo.style.removeProperty('display');
      });
      setPages(current => current.map((markup, pageIndex) => {
        if (pageIndex === activePage && resumeRef.current) return cleanEditorMarkup(resumeRef.current.innerHTML);
        const holder = document.createElement('div');
        holder.innerHTML = markup;
        holder.querySelectorAll('.resume-photo').forEach(photo => { photo.src = reader.result; photo.style.removeProperty('display'); });
        return holder.innerHTML;
      }));
      setIsSaved(false);
      notify('Profile photo attached');
      e.target.value = '';
    };
    reader.readAsDataURL(file);
  };

  const removeProfilePhoto = () => {
    resumeRef.current?.querySelectorAll('.resume-photo').forEach(photo => { photo.style.display = 'none'; });
    setPages(current => current.map((markup, pageIndex) => {
      if (pageIndex === activePage && resumeRef.current) return cleanEditorMarkup(resumeRef.current.innerHTML);
      const holder = document.createElement('div');
      holder.innerHTML = markup;
      holder.querySelectorAll('.resume-photo').forEach(photo => { photo.style.display = 'none'; });
      return holder.innerHTML;
    }));
    setIsSaved(false);
    notify('Profile photo hidden');
  };

  const cycleDocumentColumns = () => {
    const next = documentColumns === 3 ? 1 : documentColumns + 1;
    setDocumentColumns(next);
    setIsSaved(false);
    notify(`${next}-column document layout applied`);
  };

  const insertEditableTable = () => {
    if (!resumeRef.current) return;
    const table = `<table class="resume-table" contenteditable="true"><tbody><tr><th>Heading</th><th>Details</th></tr><tr><td>Item</td><td>Click to edit</td></tr></tbody></table>`;
    const selection = window.getSelection?.();
    if (selection?.anchorNode && resumeRef.current.contains(selection.anchorNode)) exec('insertHTML', table);
    else resumeRef.current.querySelector('.resume-main')?.insertAdjacentHTML('beforeend', table);
    setIsSaved(false);
    notify('Editable table inserted');
  };

  const insertMultilevelList = style => {
    if (!resumeRef.current) return;
    const list = `<ol class="multilevel-list" data-list-style="${escapeHtml(style.id)}" contenteditable="true"><li>Primary achievement<ol><li>Supporting evidence</li><li>Additional detail<ol><li>Third-level point</li></ol></li></ol></li><li>Next primary achievement</li></ol>`;
    const selection = window.getSelection?.();
    if (selection?.anchorNode && resumeRef.current.contains(selection.anchorNode)) exec('insertHTML', list);
    else resumeRef.current.querySelector('.resume-main')?.insertAdjacentHTML('beforeend', list);
    setIsSaved(false);
    notify(`${style.label} list inserted`);
  };

  const toggleResumeSection = (name, enabled) => {
    const definition = SECTION_CATALOG.find(section => section.name === name);
    if (!definition || !resumeRef.current) {
      setSections(current => ({ ...current, [name]: enabled }));
      return;
    }
    const matching = [...resumeRef.current.querySelectorAll('.resume-section')].filter(section => section.dataset.sectionName === name || section.querySelector('h2')?.textContent?.trim() === name);
    if (enabled && matching.length === 0) {
      const target = definition.placement === 'aside' ? resumeRef.current.querySelector('.resume-aside') : resumeRef.current.querySelector('.resume-main');
      (target || resumeRef.current).insertAdjacentHTML('beforeend', sectionMarkupFor(definition));
    } else {
      matching.forEach(section => { section.style.display = enabled ? '' : 'none'; });
    }
    setSections(current => ({ ...current, [name]: enabled }));
    setIsSaved(false);
    notify(`${name} ${enabled ? 'added' : 'hidden'}`);
  };

  const downloadBlob = (blob, filename) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a'); link.href = url; link.download = filename; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const exportResume = async (format, quality) => {
    if (!resumeRef.current) return;
    setExporting(true);
    const exportPages = snapshotPages();
    setPages(exportPages);
    persistPageDraft(exportPages);
    const nameHolder = document.createElement('div');
    nameHolder.innerHTML = exportPages[0] || '';
    const resumeName = nameHolder.querySelector('h1')?.textContent?.trim() || 'Professional-Resume';
    const filename = `${resumeName.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '') || 'Professional'}-Resume`;
    const plainPages = exportPages.map(markup => {
      const holder = document.createElement('div');
      holder.innerHTML = markup;
      holder.querySelectorAll('[style*="display: none"]').forEach(node => node.remove());
      return holder.innerText || holder.textContent || '';
    });
    const plainText = plainPages.join('\n\n--- PAGE BREAK ---\n\n');
    const inlineDesignStyle = pageIndex => Object.entries(designStyleForPage(pageIndex)).map(([key, value]) => `${key}:${value}`).join(';');
    const renderVisualPages = async rasterFormat => {
      const { toJpeg, toPng } = await import('html-to-image');
      const pixelRatio = quality === 'ultra' ? 4 : 2;
      const rendered = [];
      for (let pageIndex = 0; pageIndex < exportPages.length; pageIndex += 1) {
        const pageDesign = resolvePageDesign(pageIndex);
        const paper = PAPER_SIZES.find(size => size.id === pageDesign.paperSize) || PAPER_SIZES[0];
        const { host, node } = createExportHost({
          className: designClassForPage(pageIndex),
          style: designStyleForPage(pageIndex),
          markup: exportPages[pageIndex],
          paper,
          pageIndex,
          pageCount: exportPages.length,
          runningHeader: `${resumeName} · Resume`,
        });
        try {
          await waitForExportAssets(node);
          const options = {
            pixelRatio,
            backgroundColor: pageDesign.pageBackground,
            cacheBust: true,
            width: paper.widthPx,
            height: paper.heightPx,
            skipAutoScale: false,
            filter: candidate => !candidate?.dataset?.editorUi,
            style: {
              position: 'relative',
              left: '0',
              top: '0',
              margin: '0',
              transform: 'none',
              transformOrigin: 'top left',
            },
          };
          const dataUrl = rasterFormat === 'jpg'
            ? await toJpeg(node, { ...options, quality: 0.98 })
            : await toPng(node, options);
          await assertRasterHasVisibleContent(dataUrl, Boolean(plainPages[pageIndex].trim()));
          rendered.push({ dataUrl, paper, pageIndex, pixelRatio, mime: rasterFormat === 'jpg' ? 'image/jpeg' : 'image/png' });
        } finally {
          host.remove();
        }
      }
      return rendered;
    };
    const downloadRasterPages = async (renderedPages, extension) => {
      if (renderedPages.length === 1) {
        const link = document.createElement('a');
        link.download = `${filename}.${extension}`;
        link.href = renderedPages[0].dataUrl;
        link.click();
        return;
      }
      const zipModule = await import('jszip');
      const zip = new zipModule.default();
      renderedPages.forEach(({ dataUrl }, pageIndex) => zip.file(`${filename}-page-${pageIndex + 1}.${extension}`, dataUrlToUint8Array(dataUrl)));
      downloadBlob(await zip.generateAsync({ type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 6 } }), `${filename}-${extension.toUpperCase()}-pages.zip`);
    };
    try {
      if (format === 'png' || format === 'jpg') {
        await downloadRasterPages(await renderVisualPages(format), format);
      } else if (format === 'pdf') {
        const renderedPages = await renderVisualPages('png');
        const pdfModule = await import('jspdf');
        const firstPaper = PAPER_SIZES.find(size => size.id === resolvePageDesign(0).paperSize) || PAPER_SIZES[0];
        const pdf = new pdfModule.jsPDF({ orientation: firstPaper.widthMm > firstPaper.heightMm ? 'landscape' : 'portrait', unit: 'mm', format: [firstPaper.widthMm, firstPaper.heightMm], compress: true });
        renderedPages.forEach(({ dataUrl, paper }, pageIndex) => {
          if (pageIndex > 0) pdf.addPage([paper.widthMm, paper.heightMm], paper.widthMm > paper.heightMm ? 'landscape' : 'portrait');
          pdf.addImage(dataUrl, 'PNG', 0, 0, paper.widthMm, paper.heightMm, undefined, 'FAST');
        });
        pdf.save(`${filename}.pdf`);
      } else if (format === 'html') {
        const styles = collectDocumentCss();
        const pageHtml = exportPages.map((markup, pageIndex) => `<article class="${designClassForPage(pageIndex)}" data-page-number="${pageIndex + 1}" data-page-count="${exportPages.length}" data-running-header="${resumeName} · Resume" style="${inlineDesignStyle(pageIndex)};position:relative;left:0;top:0;transform:none">${markup}</article>`).join('\n');
        const html = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${filename}</title><style>${styles}html,body{margin:0;min-height:100%;background:#ddd}body{overflow:auto;padding:20px}.resume-page{margin:0 auto 20px;transform:none!important}@media print{body{padding:0;background:#fff}.resume-page{margin:0;break-after:page}}</style></head><body>${pageHtml}</body></html>`;
        downloadBlob(new Blob([html], { type: 'text/html' }), `${filename}.html`);
      } else if (format === 'txt') {
        downloadBlob(new Blob([plainText], { type: 'text/plain' }), `${filename}.txt`);
      } else if (format === 'rtf') {
        const escapedPages = plainPages.map(escapeRtf);
        downloadBlob(new Blob([`{\\rtf1\\ansi\\deff0{\\fonttbl{\\f0 Arial;}}\\fs22 ${escapedPages.join('\\page\n')}}`], { type: 'application/rtf' }), `${filename}.rtf`);
      } else if (format === 'svg') {
        downloadBlob(new Blob([buildRasterSvg(await renderVisualPages('png'))], { type: 'image/svg+xml' }), `${filename}.svg`);
      } else if (format === 'docx') {
        const renderedPages = await renderVisualPages('png');
        const {
          Document, HorizontalPositionRelativeFrom, ImageRun, Packer, Paragraph,
          SectionType, TextWrappingType, VerticalPositionRelativeFrom
        } = await import('docx');
        const sectionsForWord = renderedPages.map(({ dataUrl, paper }, pageIndex) => ({
          properties: {
            ...(pageIndex > 0 ? { type: SectionType.NEXT_PAGE } : {}),
            page: {
              size: { width: Math.round(paper.widthMm / 25.4 * 1440), height: Math.round(paper.heightMm / 25.4 * 1440) },
              margin: { top: 0, right: 0, bottom: 0, left: 0, header: 0, footer: 0, gutter: 0 },
            },
          },
          children: [new Paragraph({
            spacing: { before: 0, after: 0, line: 1 },
            children: [new ImageRun({
              type: 'png',
              data: dataUrlToUint8Array(dataUrl),
              transformation: { width: paper.widthPx, height: paper.heightPx },
              altText: { title: `${resumeName} resume page ${pageIndex + 1}`, description: 'Exact visual export from ResumeForge', name: `${filename}-page-${pageIndex + 1}` },
              floating: {
                horizontalPosition: { relative: HorizontalPositionRelativeFrom.PAGE, offset: 0 },
                verticalPosition: { relative: VerticalPositionRelativeFrom.PAGE, offset: 0 },
                wrap: { type: TextWrappingType.NONE },
                behindDocument: false,
                allowOverlap: true,
                layoutInCell: false,
              },
            })],
          })],
        }));
        const doc = new Document({ creator: 'ResumeForge', title: `${resumeName} Resume`, description: 'Exact visual resume export', sections: sectionsForWord });
        downloadBlob(await Packer.toBlob(doc), `${filename}.docx`);
      } else if (format === 'docx-editable') {
        const { Document, Packer, Paragraph, TextRun, HeadingLevel } = await import('docx');
        const children = plainPages.flatMap((pageText, pageIndex) => {
          const pageDesign = resolvePageDesign(pageIndex);
          return pageText.split('\n').map(line => line.trim()).filter(Boolean).map((line, lineIndex) => new Paragraph({ pageBreakBefore: pageIndex > 0 && lineIndex === 0, heading: lineIndex === 0 ? HeadingLevel.TITLE : (SECTION_LABELS.includes(line) ? HeadingLevel.HEADING_2 : undefined), children: [new TextRun({ text: line, bold: lineIndex === 0, color: (lineIndex === 0 ? pageDesign.headingColor : pageDesign.textColor).replace('#',''), size: lineIndex === 0 ? Math.round(pageDesign.baseFontSize * 3.4) : Math.round(pageDesign.baseFontSize * 2), font: lineIndex === 0 ? pageDesign.headingFont : pageDesign.font })], spacing: { after: lineIndex === 0 ? 180 : Math.round(pageDesign.paragraphSpacing * 10) } }));
        });
        const doc = new Document({ creator: 'ResumeForge', title: `${resumeName} Resume - editable`, sections: [{ properties: { page: { margin: { top: 720, right: 720, bottom: 720, left: 720 } } }, children }] });
        downloadBlob(await Packer.toBlob(doc), `${filename}-editable.docx`);
      }
      notify(`${format === 'docx-editable' ? 'Editable Word' : format.toUpperCase()} exported successfully`);
      setExportOpen(false);
    } catch (error) {
      console.error(error);
      notify(error?.message || 'Export could not be completed. Please try again.');
    } finally { setExporting(false); }
  };

  const hiddenHeadings = Object.entries(sections).filter(([, enabled]) => !enabled).map(([name]) => name);

  const browseTemplateGroup = groupId => {
    const firstTemplate = templates.find(template => template.group === groupId) || templates[0];
    setTemplateGroup(groupId);
    setSelectedTemplate(firstTemplate);
    setAccent(firstTemplate.accent);
    setHeadingColor(firstTemplate.accent);
    setFont(firstTemplate.font);
    setHeadingFont(firstTemplate.font);
    setLayout(firstTemplate.layout);
    setPageDesignScope('all');
    setPageDesignOverrides({});
    setView('editor');
    setPanel('templates');
  };

  const applyImportedResume = (result, mode = 'editable') => {
    const editablePages = [buildImportedResumeMarkup(result.mapping)];
    const visualPages = buildImportedVisualPages(result.sourcePages, result.fileName);
    const resolvedMode = mode === 'source' && visualPages.length ? 'source' : 'editable';
    const nextPages = resolvedMode === 'source' ? visualPages : editablePages;
    setImportSession({
      fileName: result.fileName,
      fileType: result.fileType,
      method: result.method,
      sourceFingerprint: result.sourceFingerprint,
      sourceText: result.sourceText,
      warnings: result.warnings || [],
      editablePages,
      visualPages,
      mode: resolvedMode,
    });
    setPages(nextPages);
    setActivePage(0);
    setContentMarkup(nextPages[0]);
    setAnalysisMarkup(nextPages[0]);
    setSections(current => ({ ...current, ...Object.fromEntries(result.mapping.sections.map(section => [section.name, true])) }));
    setPageDesignScope('all');
    setPageDesignOverrides({});
    setDocKey(key => key + 1);
    setView('editor');
    setPanel(null);
    setImportOpen(false);
    setIsSaved(false);
    notify(resolvedMode === 'source' ? 'Source visual opened; switch to Editable mapping to change content' : 'Editable resume imported with verbatim extracted text');
  };

  const switchImportedMode = mode => {
    if (!importSession || importSession.mode === mode) return;
    let session = importSession;
    if (importSession.mode === 'editable') {
      session = { ...session, editablePages: snapshotPages() };
    }
    const nextPages = mode === 'source' ? session.visualPages : session.editablePages;
    if (!nextPages?.length) return notify('A source visual is not available for this import');
    const nextIndex = Math.min(activePage, nextPages.length - 1);
    setImportSession({ ...session, mode });
    setPages(nextPages);
    setActivePage(nextIndex);
    setContentMarkup(nextPages[nextIndex]);
    setAnalysisMarkup(nextPages[nextIndex]);
    setDocKey(key => key + 1);
    setIsSaved(false);
    notify(mode === 'source' ? 'Showing preserved source visual' : 'Showing editable mapped resume');
  };

  const returnHome = () => {
    captureDraft();
    setPanel(null);
    setView('home');
  };

  if (view === 'home') {
    return <><HomePage saves={saves} onCreate={newResume} onImport={() => setImportOpen(true)} onBrowseGroup={browseTemplateGroup} onLoad={loadSave} onDelete={deleteSave} />{importOpen && <ImportResumeModal onClose={() => setImportOpen(false)} onApply={applyImportedResume}/>}</>;
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <button className="brand editor-brand" onClick={returnHome} title="Go to home"><div className="brand-mark"><FileText size={18}/><i/></div><div><strong>ResumeForge</strong><span>Precision career studio</span></div></button>
        <div className="document-name"><button title="Back to home" onClick={returnHome}><ArrowLeft size={16}/></button><div><strong>Ananya Rao — Resume</strong><span>{isSaved ? <><Cloud size={12}/> Saved</> : 'Unsaved changes'}</span></div><button title="Rename resume"><ChevronDown size={14}/></button></div>
        <nav className="top-actions">
          <button className="text-button desktop-only" onClick={() => setImportOpen(true)}><FileUp size={16}/>Upload resume</button>
          <button className="text-button ai-launch-button" onClick={() => setPanel('ai')}><Sparkles size={16}/>AI Copilot <span>{atsReport.score}</span></button>
          <button className="text-button desktop-only" onClick={() => setSavedOpen(true)}><FileStack size={16}/>My resumes <span>{saves.length}</span></button>
          <button className="text-button desktop-only" onClick={saveResume}><Save size={16}/>Save</button>
          <button className="export-button" onClick={() => setExportOpen(true)}><Download size={16}/>Export<ChevronDown size={14}/></button>
          <button className="avatar" title="Account">AR</button>
        </nav>
      </header>

      <div className="format-bar">
        <Toolbar exec={exec} font={activeDesign.font} setFont={value => changeDesign('font', value)} fontSize={fontSize} setFontSize={setFontSize} onApplyFontSize={applyInlineFontSize} textColor={activeDesign.textColor} highlightColor={activeDesign.highlightColor} onOpenCustomize={() => { setPanel('customize'); setTab('typography'); }}/>
        <div className="format-actions"><label className="autosave"><span>Auto-save</span><button className={`tiny-toggle ${autoSave ? 'on' : ''}`} onClick={e => { e.preventDefault(); setAutoSave(v => !v); }}><i/></button></label><button title="Help"><HelpCircle size={17}/></button></div>
      </div>

      <div className="workspace">
        <TemplatesPanel selectedTemplate={activeTemplate} onSelect={selectTemplate} open={panel === 'templates'} onClose={() => setPanel(null)} group={templateGroup} setGroup={setTemplateGroup} />
        <section className="canvas-stage" onClick={() => setPanel(null)}>
          <div className="canvas-toolbar">
            <div className="page-nav"><button onClick={() => goToPage(activePage - 1)} disabled={activePage === 0} aria-label="Previous page"><ChevronLeft size={15}/></button><span>Page <strong>{activePage + 1}</strong> of {pages.length}</span><button onClick={() => goToPage(activePage + 1)} disabled={activePage === pages.length - 1} aria-label="Next page"><ChevronRight size={15}/></button><button className="add-page-button" onClick={addPage}><Plus size={13}/>Add page</button>{pages.length > 1 && <button className="remove-page-button" onClick={deleteCurrentPage} aria-label="Delete current page"><Trash2 size={13}/></button>}</div>
            {importSession && <div className="import-mode-toggle" role="group" aria-label="Imported resume view"><button className={importSession.mode === 'editable' ? 'active' : ''} onClick={() => switchImportedMode('editable')}>Editable mapping</button><button className={importSession.mode === 'source' ? 'active' : ''} disabled={!importSession.visualPages?.length} onClick={() => switchImportedMode('source')}>Source visual</button></div>}
            <div className="document-health"><span><i/> ATS preflight <strong>{atsReport.score}/100</strong></span><span><Check size={13}/> {atsReport.grade}</span></div>
            <div className="zoom-control"><IconButton icon={ZoomOut} label="Zoom out" onClick={() => setZoom(z => Math.max(55, z - 5))}/><input type="range" min="55" max="110" value={zoom} onChange={e => setZoom(Number(e.target.value))}/><span>{zoom}%</span><IconButton icon={ZoomIn} label="Zoom in" onClick={() => setZoom(z => Math.min(110, z + 5))}/></div>
          </div>
          <div className="canvas-scroll">
            <div className="page-wrap" style={{ '--zoom': zoom / 100, '--page-width': `${activePaper.widthPx}px`, '--page-height': `${activePaper.heightPx}px` }}>
              <article
                key={docKey}
                ref={resumeRef}
                className={designClassForPage(activePage)}
                data-page-number={activePage + 1}
                data-page-count={pages.length}
                data-running-header="Ananya Rao · Resume"
                style={designStyleForPage(activePage)}
                dangerouslySetInnerHTML={{ __html: contentMarkup }}
                onInput={markEditorChanged}
                onClick={handleEditorClick}
                onKeyUp={rememberEditableTarget}
                onDragStart={handleSectionDragStart}
                onDragOver={handleSectionDragOver}
                onDrop={handleSectionDrop}
                onDragEnd={handleSectionDragEnd}
              />
              {hiddenHeadings.length > 0 && <div className="hidden-sections-note"><Check size={14}/>{hiddenHeadings.length} section{hiddenHeadings.length > 1 ? 's' : ''} hidden from export</div>}
            </div>
          </div>
        </section>
        <AdvancedCustomizerPanel open={panel === 'customize'} onClose={() => setPanel(null)} tab={tab} setTab={setTab} design={activeDesign} onDesignChange={changeDesign} sections={sections} onToggleSection={toggleResumeSection} onMoveSection={moveResumeSection} onAddSectionItem={name => mutateResumeSectionItem(name, 'add')} onRemoveSectionItem={name => mutateResumeSectionItem(name, 'remove')} selectedTemplate={activeTemplate} layoutChoices={layoutChoices} onUploadProfilePhoto={() => profileImageUploadRef.current?.click()} onRemoveProfilePhoto={removeProfilePhoto} onUploadFont={() => fontUploadRef.current?.click()} onAddPage={addPage} onAddBlankPage={addBlankPage} onAddDifferentPage={addDifferentPage} pageCount={pages.length} activePage={activePage} headerFooter={headerFooter} onToggleHeaderFooter={() => { setHeaderFooter(value => !value); setIsSaved(false); notify(headerFooter ? 'Header and footer hidden' : 'Header and footer added'); }} documentColumns={documentColumns} onCycleColumns={cycleDocumentColumns} onInsertTable={insertEditableTable} onInsertMultilevelList={insertMultilevelList} pageDesignScope={pageDesignScope} onSetPageDesignScope={setPageDesignScope}/>
      </div>

      <AIAssistantPanel open={panel === 'ai'} onClose={() => setPanel(null)} config={aiConfig} onConfigChange={updateAIConfig} connection={aiConnection} onTestConnection={testProvider} onRun={runAIRequest} onApplyResult={applyAIResult} onInsertResult={insertAIResult} onCancel={cancelAIRequest} busy={aiBusy} result={aiResult} error={aiError} resultTask={aiResultTask} onClearResult={() => { setAIResult(null); setAIError(''); }} jobDescription={jobDescription} onJobDescriptionChange={setJobDescription} atsReport={atsReport} canUndoAI={Boolean(aiUndo)} onUndoAI={undoLastAIChange}/>

      <div className="mobile-dock">
        <button onClick={() => setPanel('templates')} className={panel === 'templates' ? 'active' : ''}><LayoutGrid size={19}/><span>Templates</span></button>
        <button onClick={() => { setPanel('customize'); setTab('design'); }} className={panel === 'customize' && tab === 'design' ? 'active' : ''}><Palette size={19}/><span>Design</span></button>
        <button className="mobile-save" onClick={saveResume}><Save size={20}/></button>
        <button onClick={() => setPanel('ai')} className={panel === 'ai' ? 'active' : ''}><Sparkles size={19}/><span>AI</span></button>
        <button onClick={() => { setPanel('customize'); setTab('layout'); }} className={panel === 'customize' && tab === 'layout' ? 'active' : ''}><Columns2 size={19}/><span>Layout</span></button>
        <button onClick={() => setSavedOpen(true)}><FileStack size={19}/><span>Saved</span></button>
      </div>
      <input id="inline-image-upload" ref={imageUploadRef} hidden type="file" accept="image/*" onChange={handleImageUpload}/>
      <input id="profile-image-upload" ref={profileImageUploadRef} hidden type="file" accept="image/png,image/jpeg,image/webp" onChange={handleProfilePhotoUpload}/>
      <input id="custom-font-upload" ref={fontUploadRef} hidden type="file" accept=".ttf,.otf,.woff,.woff2,font/ttf,font/otf,font/woff,font/woff2" onChange={handleFontUpload}/>
      {importOpen && <ImportResumeModal onClose={() => setImportOpen(false)} onApply={applyImportedResume}/>} 
      {exportOpen && <ExportModal onClose={() => setExportOpen(false)} onExport={exportResume} exporting={exporting}/>} 
      {savedOpen && <SavedModal saves={saves} onClose={() => setSavedOpen(false)} onLoad={loadSave} onDelete={deleteSave} onNew={newResume}/>} 
      {toast && <div className="toast"><Check size={16}/>{toast}</div>}
    </div>
  );
}
