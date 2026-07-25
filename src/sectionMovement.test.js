import { describe, expect, it } from 'vitest';
import {
  cleanEditorMarkup, dropSectionAt, dropSectionInColumn, getSectionName,
  moveSectionInDocument
} from './sectionMovement';

const MATRIX_CASES = Array.from({ length: 1024 }, (_, id) => ({
  id,
  direction: ['up', 'down', 'left', 'right'][id % 4],
  mainCount: 3 + (id % 10),
  asideCount: 2 + (Math.floor(id / 8) % 7),
}));

function createFixture(mainCount, asideCount) {
  const root = document.createElement('article');
  root.innerHTML = `<main class="resume-columns"><div class="resume-main">${Array.from({ length: mainCount }, (_, index) => `<section class="resume-section" data-section-name="Main ${index}"><h2>Main ${index}</h2><p>DETAIL-MAIN-${index}</p></section>`).join('')}</div><aside class="resume-aside">${Array.from({ length: asideCount }, (_, index) => `<section class="resume-section" data-section-name="Aside ${index}"><h2>Aside ${index}</h2><p>DETAIL-ASIDE-${index}</p></section>`).join('')}</aside></main>`;
  return root;
}

const sectionNames = container => [...container.querySelectorAll(':scope > .resume-section')].map(getSectionName);

describe('1,024-case whole-section movement matrix', () => {
  it.each(MATRIX_CASES)('movement case $id: $direction preserves heading and details', ({ id, direction, mainCount, asideCount }) => {
    const root = createFixture(mainCount, asideCount);
    const main = root.querySelector('.resume-main');
    const aside = root.querySelector('.resume-aside');
    let source;
    let expectedNeighbor;

    if (direction === 'up') {
      const sourceIndex = 1 + (id % (mainCount - 1));
      source = main.children[sourceIndex];
      expectedNeighbor = main.children[sourceIndex - 1];
    } else if (direction === 'down') {
      const sourceIndex = id % (mainCount - 1);
      source = main.children[sourceIndex];
      expectedNeighbor = main.children[sourceIndex + 1];
    } else if (direction === 'left') source = aside.children[id % asideCount];
    else source = main.children[id % mainCount];

    const sourceName = getSectionName(source);
    const sourceDetails = source.querySelector('p').textContent;
    const neighborName = expectedNeighbor ? getSectionName(expectedNeighbor) : '';
    const moved = moveSectionInDocument(root, source, direction);

    expect(moved).toBe(true);
    expect(getSectionName(source)).toBe(sourceName);
    expect(source.querySelector('p')).toHaveTextContent(sourceDetails);
    expect(root.querySelectorAll(`[data-section-name="${sourceName}"]`)).toHaveLength(1);

    if (direction === 'left') expect(source.parentElement).toBe(main);
    else if (direction === 'right') expect(source.parentElement).toBe(aside);
    else {
      const order = sectionNames(main);
      const sourcePosition = order.indexOf(sourceName);
      const neighborPosition = order.indexOf(neighborName);
      if (direction === 'up') expect(sourcePosition).toBeLessThan(neighborPosition);
      else expect(sourcePosition).toBeGreaterThan(neighborPosition);
    }
  });
});

describe('section movement boundaries, cross-column drops, and clean output', () => {
  it('rejects boundaries, hidden sections, invalid roots, and same-column side moves', () => {
    const root = createFixture(3, 2);
    const first = root.querySelector('.resume-main .resume-section');
    const last = root.querySelector('.resume-aside .resume-section:last-child');
    expect(moveSectionInDocument(root, first, 'up')).toBe(false);
    expect(moveSectionInDocument(root, last, 'down')).toBe(false);
    expect(moveSectionInDocument(root, first, 'left')).toBe(false);
    first.style.display = 'none';
    expect(moveSectionInDocument(root, first, 'right')).toBe(false);
    expect(moveSectionInDocument(document.createElement('div'), last, 'right')).toBe(false);
    expect(moveSectionInDocument(root, last, 'diagonal')).toBe(false);
  });

  it('drops complete sections before, after, and into an empty opposite column', () => {
    const root = createFixture(4, 2);
    const source = root.querySelector('[data-section-name="Main 2"]');
    const target = root.querySelector('[data-section-name="Aside 0"]');
    expect(dropSectionAt(root, source, target, 'before')).toBe(true);
    expect(source.parentElement).toHaveClass('resume-aside');
    expect(source.nextElementSibling).toBe(target);
    expect(source).toHaveTextContent('DETAIL-MAIN-2');

    expect(dropSectionAt(root, source, target, 'after')).toBe(true);
    expect(target.nextElementSibling).toBe(source);
    const main = root.querySelector('.resume-main');
    main.replaceChildren();
    expect(dropSectionInColumn(root, source, main)).toBe(true);
    expect(main.lastElementChild).toBe(source);
    expect(dropSectionInColumn(root, source, main)).toBe(false);
  });

  it('removes every editor-only movement artifact without changing resume content', () => {
    const root = createFixture(3, 2);
    const section = root.querySelector('.resume-section');
    section.classList.add('section-reorderable', 'section-dragging', 'section-drop-after');
    section.setAttribute('draggable', 'true');
    section.setAttribute('aria-grabbed', 'true');
    section.insertAdjacentHTML('afterbegin', '<div class="section-move-toolbar" data-editor-ui="section-controls"><button>Move</button></div>');
    const cleaned = cleanEditorMarkup(root.innerHTML);
    const holder = document.createElement('div');
    holder.innerHTML = cleaned;

    expect(holder.querySelector('[data-editor-ui]')).toBeNull();
    expect(holder.querySelector('.section-move-toolbar')).toBeNull();
    expect(holder.querySelector('[draggable]')).toBeNull();
    expect(holder.querySelector('[aria-grabbed]')).toBeNull();
    expect(holder.querySelector('.section-reorderable, .section-dragging, .section-drop-after')).toBeNull();
    expect(holder.textContent).toContain('DETAIL-MAIN-0');
    expect(holder.querySelectorAll('.resume-section')).toHaveLength(5);
  });
});
