import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';

const exportMocks = vi.hoisted(() => ({
  toPng: vi.fn(async () => 'data:image/png;base64,dGVzdA=='),
  toJpeg: vi.fn(async () => 'data:image/jpeg;base64,dGVzdA=='),
  pdfSave: vi.fn(),
  pdfAddImage: vi.fn(),
  pdfAddPage: vi.fn(),
  packDocx: vi.fn(async () => new Blob(['PK-test-docx'])),
}));

vi.mock('html-to-image', () => ({ toPng: exportMocks.toPng, toJpeg: exportMocks.toJpeg }));
vi.mock('jspdf', () => ({ jsPDF: class MockPdf { addImage(...args) { exportMocks.pdfAddImage(...args); } addPage(...args) { exportMocks.pdfAddPage(...args); } save(...args) { exportMocks.pdfSave(...args); } } }));
vi.mock('docx', () => ({
  Document: class MockDocument { constructor(value) { this.value = value; } },
  ImageRun: class MockImageRun { constructor(value) { this.value = value; } },
  Paragraph: class MockParagraph { constructor(value) { this.value = value; } },
  TextRun: class MockTextRun { constructor(value) { this.value = value; } },
  Packer: { toBlob: exportMocks.packDocx },
  HeadingLevel: { TITLE: 'title', HEADING_2: 'heading2' },
  SectionType: { NEXT_PAGE: 'nextPage' },
  HorizontalPositionRelativeFrom: { PAGE: 'page' },
  VerticalPositionRelativeFrom: { PAGE: 'page' },
  TextWrappingType: { NONE: 0 },
}));

async function openEditor(user) {
  await user.click(document.querySelector('.home-primary'));
  await screen.findByPlaceholderText('Search 40,320 templates');
}

describe('ResumeForge complete experience', () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.clearAllMocks();
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    window.HTMLElement.prototype.scrollIntoView = vi.fn();
  });
  afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

  it('opens on a real home page with creation, saved-resume, template-group, and section entry points', () => {
    const { container } = render(<App />);
    expect(screen.getAllByText('ResumeForge').length).toBeGreaterThan(0);
    expect(screen.getByRole('heading', { name: /Build a resume that feels unmistakably yours/i })).toBeInTheDocument();
    expect(container.querySelectorAll('.home-collection-block')).toHaveLength(5);
    expect(container.querySelectorAll('.home-group-card')).toHaveLength(48);
    expect(container.querySelectorAll('.section-chip-grid > span')).toHaveLength(60);
    expect(screen.getByRole('button', { name: /Go to saved resumes/i })).toBeInTheDocument();
    expect(screen.getByText('No saved resumes yet')).toBeInTheDocument();
  });

  it('imports a text resume verbatim, maps sections, and preserves content while changing templates', async () => {
    const user = userEvent.setup();
    const { container } = render(<App />);
    await user.click(screen.getByRole('button', { name: /Upload existing resume/i }));
    expect(screen.getByRole('heading', { name: /Upload an existing resume/i })).toBeInTheDocument();

    const exactLine = 'Reconciled 1,250 clearing exceptions with zero unauthorized data changes.';
    const source = ['Asha Rao', 'Banking Operations Specialist', 'asha@example.com | Mumbai', 'SUMMARY', 'Banking operations professional.', 'EXPERIENCE', 'Senior Associate | Example Bank | 2020–Present', exactLine, 'SKILLS', 'Cheque clearing; reconciliation; UCP 600', 'EDUCATION', 'Bachelor of Commerce | 2019'].join('\n');
    const file = new File([source], 'Asha-Rao-Banking-Resume.txt', { type: 'text/plain' });
    fireEvent.change(container.querySelector('.import-modal input[type="file"]'), { target: { files: [file] } });
    await user.click(screen.getByRole('button', { name: /Analyze resume/i }));

    await screen.findByText('Analysis complete');
    expect(screen.getByText('All lines accounted for')).toBeInTheDocument();
    expect(screen.getAllByText('Experience').length).toBeGreaterThan(0);
    await user.click(screen.getByRole('button', { name: /Open editable mapping/i }));

    await waitFor(() => expect(container.querySelector('.resume-page h1')).toHaveTextContent('Asha Rao'));
    expect(container.querySelector('.resume-page')).toHaveTextContent(exactLine);
    expect(container.querySelector('.resume-page [data-source-fingerprint]')).toBeInTheDocument();
    await user.click(screen.getByText('Applicant 002'));
    expect(container.querySelector('.resume-page')).toHaveTextContent(exactLine);
  });

  it('removes numeric badges from section headings in every resume template', async () => {
    const user = userEvent.setup();
    const { container } = render(<App />);
    await openEditor(user);
    await waitFor(() => expect([...container.querySelectorAll('.resume-page .section-heading > span')].filter(marker => /^\d+$/.test(marker.textContent.trim()))).toHaveLength(0));
  });

  it('creates a resume and renders the complete editor', async () => {
    const user = userEvent.setup();
    const { container } = render(<App />);
    await openEditor(user);
    expect(screen.getByText('Template library')).toBeInTheDocument();
    expect(container.querySelector('.resume-page')).toBeInTheDocument();
    expect(container.querySelector('.resume-photo').getAttribute('src')).toMatch(/^data:image\/png;base64,/);
    expect(container.querySelectorAll('.custom-tabs button')).toHaveLength(4);
    expect(container.querySelectorAll('.color-control')).toHaveLength(6);
    await user.click(screen.getByRole('button', { name: /Content/i }));
    expect(container.querySelectorAll('.section-toggle')).toHaveLength(60);
  });

  it('accepts continuous typing without losing the caret and autosaves the complete edit', async () => {
    const user = userEvent.setup();
    const { container } = render(<App />);
    await openEditor(user);
    const paragraph = container.querySelector('.resume-intro p');
    const originalNode = paragraph;

    await user.click(paragraph);
    await user.type(paragraph, ' Continuous typing works 12345.');

    expect(paragraph).toHaveTextContent('Continuous typing works 12345.');
    expect(paragraph).toBe(originalNode);
    expect(paragraph.isConnected).toBe(true);
    expect(document.activeElement).toBe(paragraph);

    await waitFor(() => {
      expect(window.localStorage.getItem('resumeforge-draft-pages')).toContain('Continuous typing works 12345.');
    }, { timeout: 2200 });
    expect(paragraph.isConnected).toBe(true);
    expect(document.activeElement).toBe(paragraph);

    await user.type(paragraph, ' Still focused.');
    expect(paragraph).toHaveTextContent('Still focused.');
    expect(document.activeElement).toBe(paragraph);
  });

  it('groups exactly 40,320 templates into 48 types with 840 templates per type', async () => {
    const user = userEvent.setup();
    render(<App />);
    await openEditor(user);
    const typeSelect = screen.getByLabelText('Resume type');
    expect(typeSelect.querySelectorAll('option')).toHaveLength(49);
    await user.selectOptions(typeSelect, 'technology');
    expect(screen.getByText('840 templates')).toBeInTheDocument();
    expect(screen.getByText('Cobalt Stack 001')).toBeInTheDocument();
    await user.clear(screen.getByPlaceholderText('Search 40,320 templates'));
    await user.type(screen.getByPlaceholderText('Search 40,320 templates'), 'Systems 003');
    expect(screen.getByText('Systems 003')).toBeInTheDocument();
  });

  it('applies structurally different templates from distinct groups', async () => {
    const user = userEvent.setup();
    const { container } = render(<App />);
    const modernCard = [...container.querySelectorAll('.home-group-card')].find(card => card.textContent.includes('Modern Professional'));
    await user.click(modernCard);
    await user.click(screen.getByText('Modern Grid 001'));
    expect(container.querySelector('.resume-page')).toHaveClass('layout-modern', 'group-modern', 'header-split', 'heading-label');
    await user.selectOptions(screen.getByLabelText('Resume type'), 'academic');
    await user.click(screen.getByText('Citation 001'));
    expect(container.querySelector('.resume-page')).toHaveClass('layout-academic', 'group-academic', 'resume-no-photo');
  });

  it('paginates the large catalogue and applies photo-rail, color-block, and ATS architectures', async () => {
    const user = userEvent.setup();
    const { container } = render(<App />);
    await openEditor(user);
    expect(container.querySelectorAll('.template-card')).toHaveLength(18);
    await user.click(screen.getByRole('button', { name: /Show 18 more designs/i }));
    expect(container.querySelectorAll('.template-card')).toHaveLength(36);

    const typeSelect = screen.getByLabelText('Resume type');
    await user.selectOptions(typeSelect, 'photo');
    await user.click(screen.getByText('Portrait Rail 001'));
    expect(container.querySelector('.resume-page')).toHaveClass('layout-portrait-rail', 'resume-has-photo');

    await user.selectOptions(typeSelect, 'color-block');
    await user.click(screen.getByText('Block 001'));
    expect(container.querySelector('.resume-page')).toHaveClass('layout-colorblock', 'group-color-block');

    await user.selectOptions(typeSelect, 'ats-classic');
    await user.click(screen.getByText('Clearline 001'));
    expect(container.querySelector('.resume-page')).toHaveClass('layout-ats', 'resume-no-photo');
  });

  it('attaches and hides a profile photo in templates that require one', async () => {
    const user = userEvent.setup();
    const { container } = render(<App />);
    await openEditor(user);
    await user.selectOptions(screen.getByLabelText('Resume type'), 'photo');
    await user.click(screen.getByText('Portrait Rail 001'));
    const originalSource = container.querySelector('.resume-photo').getAttribute('src');
    const file = new File([new Uint8Array([1, 2, 3, 4])], 'new-portrait.png', { type: 'image/png' });
    fireEvent.change(container.querySelector('#profile-image-upload'), { target: { files: [file] } });
    await waitFor(() => expect(container.querySelector('.resume-photo').getAttribute('src')).not.toBe(originalSource));
    await user.click(screen.getByRole('button', { name: /^Hide$/i }));
    expect(container.querySelector('.resume-photo')).toHaveStyle({ display: 'none' });
  });

  it('makes every document option functional and supports page navigation', async () => {
    const user = userEvent.setup();
    const { container } = render(<App />);
    await openEditor(user);
    await user.click([...container.querySelectorAll('.custom-tabs button')].find(button => button.textContent.includes('Layout')));
    await user.click(screen.getByRole('button', { name: /Continuation page/i }));
    expect(container.querySelector('.page-nav > span')).toHaveTextContent('Page 2 of 2');
    expect(container.querySelector('.resume-page h1')).toHaveTextContent('Career highlights');

    await user.click(screen.getByRole('button', { name: /Header & footer/i }));
    expect(container.querySelector('.resume-page')).toHaveClass('show-page-furniture');
    await user.click(screen.getByRole('button', { name: /Content columns/i }));
    expect(container.querySelector('.resume-page')).toHaveClass('document-columns-3');
    await user.click(screen.getByRole('button', { name: /Insert editable table/i }));
    expect(container.querySelector('.resume-table')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Previous page' }));
    expect(container.querySelector('.page-nav > span')).toHaveTextContent('Page 1 of 2');
  });

  it('saves a resume, shows it on the home page, and reopens it', async () => {
    const user = userEvent.setup();
    const { container } = render(<App />);
    await openEditor(user);
    await user.click(screen.getByRole('button', { name: /^Save$/ }));
    expect(JSON.parse(window.localStorage.getItem('resumeforge-saves'))).toHaveLength(1);
    await user.click(screen.getByTitle('Go to home'));
    expect(container.querySelectorAll('.home-saved-grid article')).toHaveLength(1);
    await user.click(screen.getByRole('button', { name: /Continue/i }));
    expect(container.querySelector('.resume-page')).toBeInTheDocument();
  });

  it('imports the CSV section catalogue, stores research guidance, and adds researched sections', async () => {
    const user = userEvent.setup();
    const { container } = render(<App />);
    await openEditor(user);
    fireEvent.click(screen.getByRole('button', { name: /Content/i }));
    expect(container.querySelectorAll('.section-toggle')).toHaveLength(60);
    expect(screen.getByText('Resume knowledge base')).toBeInTheDocument();
    expect(screen.getByText(/AI tools live in Career copilot and run only when you request them/i)).toBeInTheDocument();
    const search = screen.getByLabelText('Search resume sections');
    await user.type(search, 'Security Clearances');
    const clearanceToggle = screen.getByRole('button', { name: 'Add Security Clearances' });
    fireEvent.click(clearanceToggle);
    await waitFor(() => expect([...container.querySelectorAll('.resume-section')].find(section => section.querySelector('h2')?.textContent === 'Security Clearances')).toBeInTheDocument());
    expect(container.querySelector('[data-section-name="Security Clearances"]')).toHaveTextContent('clearance level');
  });

  it('moves complete sections from the customizer and directly on the resume page', async () => {
    const user = userEvent.setup();
    const { container } = render(<App />);
    await openEditor(user);
    await user.click(screen.getByRole('button', { name: /Content/i }));

    let projectsControl = [...container.querySelectorAll('.section-toggle')].find(row => row.querySelector('b')?.textContent === 'Projects');
    await user.click(projectsControl.querySelector('[aria-label="Move Projects up"]'));
    let mainNames = [...container.querySelectorAll('.resume-main > .resume-section')].filter(section => section.style.display !== 'none').map(section => section.querySelector('h2')?.textContent);
    expect(mainNames.indexOf('Projects')).toBeLessThan(mainNames.indexOf('Experience'));
    expect([...container.querySelectorAll('.resume-section')].find(section => section.querySelector('h2')?.textContent === 'Projects')).toHaveTextContent('Pulse Insights');

    projectsControl = [...container.querySelectorAll('.section-toggle')].find(row => row.querySelector('b')?.textContent === 'Projects');
    await user.click(projectsControl.querySelector('[aria-label="Move Projects to right column"]'));
    let projects = [...container.querySelectorAll('.resume-section')].find(section => section.querySelector('h2')?.textContent === 'Projects');
    expect(projects.parentElement).toHaveClass('resume-aside');
    expect(projects).toHaveTextContent('Atlas Design System');

    const pageMoveLeft = container.querySelector('.resume-aside .resume-section .section-move-toolbar [aria-label="Move Skills to left column"]');
    await user.click(pageMoveLeft);
    const skills = [...container.querySelectorAll('.resume-section')].find(section => section.querySelector('h2')?.textContent === 'Skills');
    expect(skills.parentElement).toHaveClass('resume-main');
    expect(skills).toHaveTextContent('Product strategy');

    projects = [...container.querySelectorAll('.resume-section')].find(section => section.querySelector('h2')?.textContent === 'Projects');
    const dragHandle = projects.querySelector('[data-section-drag-handle]');
    let experience = [...container.querySelectorAll('.resume-section')].find(section => section.querySelector('h2')?.textContent === 'Experience');
    const dataTransfer = { effectAllowed: '', dropEffect: '', setData: vi.fn(), getData: vi.fn() };
    fireEvent.dragStart(dragHandle, { dataTransfer });
    fireEvent.dragOver(experience, { dataTransfer, clientY: 0 });
    fireEvent.drop(experience, { dataTransfer, clientY: 0 });
    projects = [...container.querySelectorAll('.resume-section')].find(section => section.querySelector('h2')?.textContent === 'Projects');
    experience = [...container.querySelectorAll('.resume-section')].find(section => section.querySelector('h2')?.textContent === 'Experience');
    expect(projects.parentElement).toBe(experience.parentElement);
    expect([...experience.parentElement.children].indexOf(projects)).toBeLessThan([...experience.parentElement.children].indexOf(experience));
    expect(projects).toHaveTextContent('Pulse Insights');

    await user.click(screen.getByRole('button', { name: /^Save$/ }));
    const saved = window.localStorage.getItem('resumeforge-saves');
    expect(saved).toContain('Pulse Insights');
    expect(saved).not.toContain('data-editor-ui');
    expect(saved).not.toContain('section-move-toolbar');
  });

  it('provides the font universe, exact type controls, and 36 list systems', async () => {
    const user = userEvent.setup();
    const { container } = render(<App />);
    await openEditor(user);
    await user.click(screen.getByRole('button', { name: /^Type$/i }));
    expect(screen.getByText('100,000+ compatible')).toBeInTheDocument();
    expect(container.querySelectorAll('.list-style-grid button')).toHaveLength(36);
    await user.selectOptions(screen.getByLabelText('Body font'), 'Avenir');
    expect(container.querySelector('.resume-page').style.getPropertyValue('--doc-font')).toBe('Avenir');
    await user.click(container.querySelector('.list-style-grid button[title="Star"]'));
    expect(container.querySelector('.resume-page')).toHaveClass('list-style-star', 'list-custom-marker');
    await user.click(container.querySelector('.list-style-grid button[title="Legal outline"]'));
    await user.click(screen.getByRole('button', { name: /Insert Legal outline list/i }));
    expect(container.querySelector('.multilevel-list')).toBeInTheDocument();
  });

  it('supports 16.7-million-color pickers, page patterns, and uploaded custom fonts', async () => {
    const user = userEvent.setup();
    const { container } = render(<App />);
    await openEditor(user);
    expect(screen.getByText('16.7M colors per picker')).toBeInTheDocument();
    fireEvent.change(container.querySelector('.color-control input[type="color"]'), { target: { value: '#123456' } });
    expect(container.querySelector('.resume-page').style.getPropertyValue('--accent')).toBe('#123456');
    await user.click(screen.getByRole('button', { name: /Fine grid/i }));
    expect(container.querySelector('.resume-page')).toHaveClass('pattern-fine-grid');

    await user.click(screen.getByRole('button', { name: /^Type$/i }));
    const fontFile = new File([new Uint8Array([0, 1, 0, 0])], 'My-Licensed-Font.ttf', { type: 'font/ttf' });
    fireEvent.change(container.querySelector('#custom-font-upload'), { target: { files: [fontFile] } });
    await waitFor(() => expect(container.querySelector('.resume-page').style.getPropertyValue('--doc-font')).toBe('My Licensed Font'));
    expect(document.querySelector('#resume-font-my-licensed-font')).toBeInTheDocument();
  });

  it('creates blank pages with independent designs, paper sizes, and image wrapping', async () => {
    const user = userEvent.setup();
    const { container } = render(<App />);
    await openEditor(user);
    await user.click([...container.querySelectorAll('.custom-tabs button')].find(button => button.textContent.includes('Layout')));
    await user.click(screen.getByRole('button', { name: /Blank page with different design/i }));
    expect(container.querySelector('.page-nav > span')).toHaveTextContent('Page 2 of 2');
    expect(container.querySelector('.resume-page h1')).toHaveTextContent('New page');
    expect(screen.getByRole('button', { name: /This page only/i })).toHaveClass('active');
    await user.selectOptions(screen.getByLabelText('Paper size'), 'letter');
    expect(container.querySelector('.page-wrap').style.getPropertyValue('--page-width')).toBe('816px');
    await user.click(screen.getByRole('button', { name: /Wrap left/i }));
    expect(container.querySelector('.resume-page')).toHaveClass('image-wrap-left');
  });

  it('opens editor drawers from the mobile dock', async () => {
    const user = userEvent.setup();
    const { container } = render(<App />);
    await openEditor(user);
    const dockButtons = container.querySelectorAll('.mobile-dock button');
    fireEvent.click(dockButtons[0]);
    expect(container.querySelector('.templates-panel')).toHaveClass('open');
    fireEvent.click(dockButtons[1]);
    expect(container.querySelector('.customizer-panel')).toHaveClass('open');
    expect(container.querySelector('.templates-panel')).not.toHaveClass('open');
  });

  it('opens the complete AI workspace with six workflows and automatic ATS analysis', async () => {
    const user = userEvent.setup();
    const { container } = render(<App />);
    await openEditor(user);
    await user.click(screen.getByRole('button', { name: /AI Copilot/i }));
    expect(container.querySelector('.ai-assistant-panel')).toHaveClass('open');
    expect(screen.getAllByRole('tab')).toHaveLength(6);
    await user.click(screen.getByRole('tab', { name: /ATS/i }));
    expect(screen.getByText('AUTOMATIC PREFLIGHT')).toBeInTheDocument();
    expect(screen.getByText(/Heuristic preflight score/i)).toBeInTheDocument();
    fireEvent.change(screen.getByPlaceholderText(/Paste a job description for role-specific matching/i), { target: { value: 'Product designer Figma research accessibility analytics' } });
    expect(screen.getByText(/Keyword coverage/i)).toBeInTheDocument();
  });

  it('generates and applies a complete AI resume only after explicit review', async () => {
    const generated = JSON.stringify({
      profile: { name: 'Priya Sharma', headline: 'Data Analyst', email: 'priya@example.com', phone: '+91 9876543210', location: 'Pune, India', links: ['linkedin.com/in/priya'] },
      summary: 'Data analyst who turns complex information into clear decisions.',
      skills: ['SQL', 'Power BI'],
      experience: [{ role: 'Data Analyst', company: 'Acme', location: 'Pune', dates: '2023–Present', bullets: ['Reduced reporting time by 30%.'] }],
      education: [{ qualification: 'B.Sc. Statistics', institution: 'Pune University', dates: '2023', details: [] }],
      projects: [], certifications: [], awards: [], languages: ['English'], additionalSections: []
    });
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => ({ model: 'gpt-5.6-sol', output: [{ content: [{ type: 'output_text', text: generated }] }] }) })));
    const user = userEvent.setup();
    const { container } = render(<App />);
    await openEditor(user);
    await user.click(screen.getByRole('button', { name: /AI Copilot/i }));
    await user.click(screen.getByRole('tab', { name: /Connect/i }));
    fireEvent.change(screen.getByLabelText('AI API key'), { target: { value: 'session-test-key' } });
    await user.click(screen.getByRole('tab', { name: /Create/i }));
    fireEvent.change(screen.getByLabelText('Full name'), { target: { value: 'Priya Sharma' } });
    fireEvent.change(screen.getByLabelText('Target role'), { target: { value: 'Data Analyst' } });
    await user.click(screen.getByRole('button', { name: /Generate complete resume/i }));
    expect(container.querySelector('.resume-page h1')).toHaveTextContent('Ananya Rao');
    const apply = await screen.findByRole('button', { name: /Apply complete resume/i });
    await user.click(apply);
    expect(container.querySelector('.resume-page h1')).toHaveTextContent('Priya Sharma');
    expect(container.querySelector('[data-section-name="Experience"]')).toHaveTextContent('Reduced reporting time by 30%');
    expect(JSON.stringify(window.localStorage)).not.toContain('session-test-key');
    await user.click(screen.getByRole('button', { name: /Undo last applied AI change/i }));
    expect(container.querySelector('.resume-page h1')).toHaveTextContent('Ananya Rao');
  });

  it('exports a two-page resume as a real multi-page PDF flow', async () => {
    const user = userEvent.setup();
    render(<App />);
    await openEditor(user);
    await user.click(screen.getByRole('button', { name: /^Add page$/i }));
    await user.click(screen.getByRole('button', { name: /^Export/i }));
    await user.click(screen.getByRole('button', { name: /Export PDF/i }));
    await waitFor(() => expect(screen.queryByText('Finish your resume')).not.toBeInTheDocument());
    expect(exportMocks.toPng).toHaveBeenCalledTimes(2);
    expect(exportMocks.pdfAddImage).toHaveBeenCalledTimes(2);
    expect(exportMocks.pdfAddPage).toHaveBeenCalledOnce();
    expect(exportMocks.pdfSave).toHaveBeenCalledOnce();
    exportMocks.toPng.mock.calls.forEach(([capturedPage, options]) => {
      expect(capturedPage.style.left).toBe('0px');
      expect(capturedPage.parentElement.dataset.exportHost).toBe('true');
      expect(options.style.left).toBe('0');
    });
  });

  it('offers and executes every export pipeline without errors', async () => {
    const user = userEvent.setup();
    render(<App />);
    await openEditor(user);
    const formats = [
      ['PDF', 'PDF'], ['Word (exact)', 'DOCX'], ['Word (editable)', 'DOCX-EDITABLE'], ['PNG', 'PNG'], ['JPG', 'JPG'],
      ['HTML', 'HTML'], ['Text', 'TXT'], ['RTF', 'RTF'], ['SVG', 'SVG'],
    ];

    for (const [label, extension] of formats) {
      await user.click(screen.getByRole('button', { name: /^Export/i }));
      const formatButton = [...document.querySelectorAll('.format-grid button')].find(button => button.querySelector('strong')?.textContent === label);
      await user.click(formatButton);
      await user.click(screen.getByRole('button', { name: new RegExp(`Export ${extension}`, 'i') }));
      await waitFor(() => expect(screen.queryByText('Finish your resume')).not.toBeInTheDocument());
    }

    expect(exportMocks.pdfSave).toHaveBeenCalledOnce();
    expect(exportMocks.pdfAddImage).toHaveBeenCalledOnce();
    expect(exportMocks.toPng).toHaveBeenCalledTimes(4);
    expect(exportMocks.toJpeg).toHaveBeenCalledOnce();
    expect(exportMocks.packDocx).toHaveBeenCalledTimes(2);
    expect(HTMLAnchorElement.prototype.click).toHaveBeenCalledTimes(8);
  });
});
