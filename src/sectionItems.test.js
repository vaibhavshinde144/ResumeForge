import { describe, expect, it } from 'vitest';
import { SECTION_CATALOG } from './customizationData';
import {
  addSectionItem, ensureProjectDetails, getRepeatableSectionName, getSectionItems,
  isRepeatableSection, normalizeProjectEntries, normalizeSectionItems, removeSectionItem
} from './sectionItems';

const structures = [
  '<article class="job"><div class="job-top"><div><h3 contenteditable="true">Role</h3><p contenteditable="true">Company</p></div><time contenteditable="true">Dates</time></div><ul contenteditable="true"><li>Result one</li><li>Result two</li></ul></article>',
  '<div class="skill-list" contenteditable="true"><span>Skill one</span><span>Skill two</span></div>',
  '<div class="education" contenteditable="true"><strong>Qualification</strong><span>Institution</span><small>Year</small></div>',
  '<p contenteditable="true">Detail one<br>Detail two</p>',
  '<p contenteditable="true">Item one · Item two · Item three</p>',
  '<ul contenteditable="true"><li>Point one</li><li>Point two</li></ul>',
  '<div class="project-row" contenteditable="true"><strong>Project</strong><span>Role · Year</span></div>',
  '<div class="job-top" contenteditable="true"><div><h3>Volunteer</h3><p>Organization</p></div><time>Dates</time></div>',
  '<p contenteditable="true">Single editable detail</p>',
  '<div contenteditable="true"><strong>Structured item</strong><p>Supporting detail</p><small>Year</small></div>'
];

const cases = Array.from({ length: 500 }, (_, index) => ({
  caseNumber: index + 1,
  section: SECTION_CATALOG[index % SECTION_CATALOG.length],
  structure: structures[index % structures.length],
  emptyCycle: index % 13 === 0
}));

function createSection(name, structure) {
  const section = document.createElement('section');
  section.className = 'resume-section';
  section.dataset.sectionName = name;
  section.innerHTML = `<div class="section-heading"><h2 contenteditable="true">${name}</h2><span>01</span></div>${structure}`;
  document.body.appendChild(section);
  return section;
}

describe('repeatable section item matrix — 500 cases', () => {
  it.each(cases)('case $caseNumber: $section.name preserves data through add/remove operations', ({ section: definition, structure, emptyCycle }) => {
    const section = createSection(definition.name, structure);
    expect(getRepeatableSectionName(section)).toBe(definition.name);

    if (definition.name === 'Summary' || definition.name === 'Objective') {
      const original = section.innerHTML;
      expect(isRepeatableSection(section)).toBe(false);
      expect(getSectionItems(section)).toEqual([]);
      expect(addSectionItem(section)).toBeNull();
      expect(removeSectionItem(section)).toBe(false);
      expect(section.innerHTML).toBe(original);
      section.remove();
      return;
    }

    expect(isRepeatableSection(section)).toBe(true);
    normalizeSectionItems(section);
    const before = getSectionItems(section);
    const originalTexts = before.map(item => item.textContent);
    const added = addSectionItem(section);
    const afterAdd = getSectionItems(section);
    expect(added).toBe(afterAdd[afterAdd.length - 1]);
    expect(afterAdd).toHaveLength(before.length + 1);
    expect(afterAdd.slice(0, originalTexts.length).map(item => item.textContent)).toEqual(originalTexts);
    expect(added.textContent.trim()).not.toBe('');
    expect(removeSectionItem(section, added)).toBe(true);
    expect(getSectionItems(section).map(item => item.textContent)).toEqual(originalTexts);

    if (emptyCycle) {
      [...getSectionItems(section)].forEach(item => expect(removeSectionItem(section, item)).toBe(true));
      expect(getSectionItems(section)).toHaveLength(0);
      const restored = addSectionItem(section);
      expect(restored).not.toBeNull();
      expect(getSectionItems(section)).toHaveLength(1);
    }
    section.remove();
  });
});

describe('structured project details', () => {
  it('migrates existing project rows without changing their text', () => {
    const section = createSection('Projects', '<div class="project-row" contenteditable="true"><strong>Payments Hub</strong><span>Lead · 2025</span></div><div class="project-row" contenteditable="true"><strong>Risk Engine</strong><span>QA · 2024</span></div>');
    const originalText = section.textContent;
    const entries = normalizeProjectEntries(section);
    expect(entries).toHaveLength(2);
    expect(section.textContent).toBe(originalText);
    expect(entries[0]).toHaveTextContent('Payments Hub');
    expect(entries[1]).toHaveTextContent('Risk Engine');
    section.remove();
  });

  it('preserves an existing free-text project description inside the project entry', () => {
    const section = createSection('Projects', '<div class="project-row" contenteditable="true"><strong>Trade Portal</strong><span>Developer · 2023</span></div><p contenteditable="true">Built SWIFT validation and release controls.</p>');
    const [entry] = normalizeProjectEntries(section);
    expect(entry.querySelector('.project-details')).toHaveTextContent('Built SWIFT validation and release controls.');
    expect(entry.querySelector('.project-details')).toHaveAttribute('contenteditable', 'true');
    section.remove();
  });

  it('adds editable role, duration, technology, and unrestricted free-text prompts', () => {
    const section = createSection('Projects', '<div class="project-row" contenteditable="true"><strong>Cheque Clearing</strong><span>Analyst · 2025</span></div>');
    const [entry] = normalizeProjectEntries(section);
    const details = ensureProjectDetails(entry);
    expect(details).toHaveTextContent('Roles & responsibilities:');
    expect(details).toHaveTextContent('Duration:');
    expect(details).toHaveTextContent('Skills & technologies:');
    expect(details).toHaveTextContent('Press Enter for another line.');
    section.remove();
  });

  it('creates and removes a complete new project together with all details', () => {
    const section = createSection('Projects', '<div class="project-row" contenteditable="true"><strong>Existing Project</strong><span>Owner · 2024</span></div>');
    const added = addSectionItem(section);
    expect(getSectionItems(section)).toHaveLength(2);
    expect(added).toHaveTextContent('New project');
    expect(added).toHaveTextContent('Roles & responsibilities:');
    expect(removeSectionItem(section, added)).toBe(true);
    expect(getSectionItems(section)).toHaveLength(1);
    expect(section).toHaveTextContent('Existing Project');
    section.remove();
  });
});
