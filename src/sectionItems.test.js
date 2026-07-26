import { describe, expect, it } from 'vitest';
import { SECTION_CATALOG } from './customizationData';
import {
  addSectionItem, getRepeatableSectionName, getSectionItems, isRepeatableSection,
  normalizeSectionItems, removeSectionItem
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
