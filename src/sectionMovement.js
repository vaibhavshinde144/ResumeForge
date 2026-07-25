export const SECTION_MOVE_DIRECTIONS = ['up', 'down', 'left', 'right'];

export function getSectionName(section) {
  if (!section) return '';
  return section.dataset.sectionName || section.querySelector('h2')?.textContent?.trim() || 'Untitled section';
}

export function cleanEditorMarkup(markup = '') {
  const holder = document.createElement('div');
  holder.innerHTML = String(markup || '');
  holder.querySelectorAll('[data-editor-ui]').forEach(node => node.remove());
  holder.querySelectorAll('.resume-section').forEach(section => {
    section.classList.remove('section-reorderable', 'section-dragging', 'section-drop-before', 'section-drop-after');
    section.removeAttribute('draggable');
    section.removeAttribute('aria-grabbed');
  });
  return holder.innerHTML;
}

const movableSections = root => [...root.querySelectorAll('.resume-section')]
  .filter(node => node.style.display !== 'none');

export function moveSectionInDocument(root, section, direction) {
  if (!root?.contains(section) || !SECTION_MOVE_DIRECTIONS.includes(direction)) return false;
  if (section.style.display === 'none') return false;

  if (direction === 'left' || direction === 'right') {
    const destination = root.querySelector(direction === 'left' ? '.resume-main' : '.resume-aside');
    if (!destination || destination === section.parentElement) return false;
    destination.appendChild(section);
    return true;
  }

  const sections = movableSections(root);
  const index = sections.indexOf(section);
  const targetIndex = direction === 'up' ? index - 1 : index + 1;
  if (index < 0 || targetIndex < 0 || targetIndex >= sections.length) return false;
  const target = sections[targetIndex];
  if (direction === 'up') target.parentElement.insertBefore(section, target);
  else target.parentElement.insertBefore(section, target.nextSibling);
  return true;
}

export function dropSectionAt(root, source, target, placement = 'before') {
  if (!root?.contains(source) || !root?.contains(target) || source === target) return false;
  if (!source.classList.contains('resume-section') || !target.classList.contains('resume-section')) return false;
  const destination = target.parentElement;
  destination.insertBefore(source, placement === 'after' ? target.nextSibling : target);
  return true;
}

export function dropSectionInColumn(root, source, column) {
  if (!root?.contains(source) || !root?.contains(column)) return false;
  if (!source.classList.contains('resume-section') || !column.matches('.resume-main, .resume-aside')) return false;
  if (source.parentElement === column && source === column.lastElementChild) return false;
  column.appendChild(source);
  return true;
}
