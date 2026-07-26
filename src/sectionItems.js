const NON_REPEATABLE_SECTION_NAMES = new Set(['Summary', 'Objective']);

const INLINE_ITEM_SECTIONS = new Set([
  'Skills', 'Technical Skills', 'Courses', 'Professional Memberships', 'Interests',
  'Core Competencies / Areas of Expertise', 'Key Tools / Software', 'Strengths',
  'Hobbies with Professional Relevance', 'Books / Influences'
]);

const PLACEHOLDER_LABELS = {
  Experience: 'role',
  Education: 'qualification',
  Certifications: 'certification',
  Projects: 'project',
  Skills: 'skill',
  'Technical Skills': 'technical skill',
  Awards: 'award',
  Languages: 'language',
  'Personal Details': 'detail',
  'Volunteer Experience': 'volunteer role',
  Publications: 'publication',
  Courses: 'course',
  Patents: 'patent',
  'Professional Memberships': 'membership',
  Interests: 'interest',
  References: 'reference'
};

export const PROJECT_DETAILS_HTML = '<p><strong>Roles &amp; responsibilities:</strong> Describe what you owned, delivered, improved, or coordinated.</p><p><strong>Duration:</strong> Add the project start and end dates.</p><p><strong>Skills &amp; technologies:</strong> Add tools, platforms, methods, and technical skills.</p><p>Add outcomes, links, team details, client information, or any other project detail here. Press Enter for another line.</p>';

export function getRepeatableSectionName(section) {
  if (!section) return '';
  return section.dataset.sectionName || section.querySelector('h2')?.textContent?.trim() || '';
}

export function isRepeatableSection(sectionOrName) {
  const name = typeof sectionOrName === 'string' ? sectionOrName : getRepeatableSectionName(sectionOrName);
  return Boolean(name) && !NON_REPEATABLE_SECTION_NAMES.has(name);
}

function contentChildren(section) {
  return [...section.children].filter(node =>
    !node.matches('[data-editor-ui], .section-heading') &&
    !(node.tagName === 'H2' && node.parentElement === section)
  );
}

function splitParagraph(section, paragraph, separatorPattern, wrapperClass) {
  const fragments = paragraph.innerHTML.split(separatorPattern).map(value => value.trim()).filter(Boolean);
  if (fragments.length < 2) return false;
  const wrapper = document.createElement('div');
  wrapper.className = wrapperClass;
  wrapper.dataset.resumeItemList = 'true';
  fragments.forEach(fragment => {
    const item = document.createElement(wrapperClass === 'resume-inline-items' ? 'span' : 'p');
    item.contentEditable = 'true';
    item.innerHTML = fragment;
    wrapper.appendChild(item);
  });
  paragraph.replaceWith(wrapper);
  return true;
}

export function normalizeProjectEntries(section) {
  if (getRepeatableSectionName(section) !== 'Projects') return [];
  [...section.children].filter(node => node.matches('.project-row')).forEach(row => {
    const following = row.nextElementSibling;
    const entry = document.createElement('article');
    entry.className = 'project-entry';
    row.before(entry);
    entry.appendChild(row);
    if (following?.tagName === 'P' && !following.matches('[data-editor-ui]')) {
      const details = document.createElement('div');
      details.className = 'project-details';
      details.dataset.projectDetails = 'true';
      details.setAttribute('contenteditable', 'true');
      details.appendChild(following);
      entry.appendChild(details);
    }
  });
  return [...section.children].filter(node => node.matches('.project-entry'));
}

export function ensureProjectDetails(entry) {
  if (!entry?.matches('.project-entry')) return null;
  let details = entry.querySelector(':scope > .project-details');
  if (details) return details;
  details = document.createElement('div');
  details.className = 'project-details';
  details.dataset.projectDetails = 'true';
  details.setAttribute('contenteditable', 'true');
  details.innerHTML = PROJECT_DETAILS_HTML;
  const row = entry.querySelector(':scope > .project-row');
  if (row) row.insertAdjacentElement('afterend', details);
  else entry.appendChild(details);
  return details;
}

export function normalizeSectionItems(section) {
  if (getRepeatableSectionName(section) === 'Projects') normalizeProjectEntries(section);
  if (!isRepeatableSection(section) || section.querySelector(':scope > [data-resume-item-list]')) return section;
  const name = getRepeatableSectionName(section);
  const children = contentChildren(section);
  if (children.length !== 1 || children[0].tagName !== 'P') return section;
  const paragraph = children[0];
  if (/<br\s*\/?\s*>/i.test(paragraph.innerHTML)) {
    splitParagraph(section, paragraph, /<br\s*\/?\s*>/gi, 'resume-detail-items');
  } else if (INLINE_ITEM_SECTIONS.has(name)) {
    splitParagraph(section, paragraph, /\s*(?:\u00c2?\u00b7|\u2022|\|)\s*/g, 'resume-inline-items');
  }
  return section;
}

export function getSectionItems(section) {
  if (!isRepeatableSection(section)) return [];
  normalizeSectionItems(section);
  const itemList = section.querySelector(':scope > [data-resume-item-list]');
  if (itemList) return [...itemList.children].filter(node => !node.matches('[data-editor-ui]'));

  const skillList = section.querySelector(':scope > .skill-list');
  if (skillList) return [...skillList.children].filter(node => !node.matches('[data-editor-ui]'));

  const children = contentChildren(section);
  const preferredSelectors = ['.job', '.project-entry', '.project-row', '.education', '.job-top'];
  for (const selector of preferredSelectors) {
    const matches = children.filter(node => node.matches(selector));
    if (matches.length) return matches;
  }

  if (children.length === 1 && children[0].matches('ul, ol')) {
    return [...children[0].children].filter(node => node.tagName === 'LI');
  }
  return children;
}

function placeholderFor(name) {
  if (PLACEHOLDER_LABELS[name]) return PLACEHOLDER_LABELS[name];
  return name.replace(/\s*\/.*$/, '').replace(/ies$/i, 'y').replace(/s$/i, '').toLowerCase() || 'item';
}

function cleanClone(clone) {
  clone.querySelectorAll('[data-editor-ui]').forEach(node => node.remove());
  clone.classList.remove('resume-item-editable');
  clone.removeAttribute('data-item-editable');
  clone.removeAttribute('id');
  clone.querySelectorAll('[id]').forEach(node => node.removeAttribute('id'));
}

function resetClone(clone, sectionName) {
  const label = placeholderFor(sectionName);
  if (clone.matches('.job')) {
    const heading = clone.querySelector('h3');
    const organization = clone.querySelector('.job-top p');
    const dates = clone.querySelector('time');
    if (heading) heading.textContent = 'New role';
    if (organization) organization.textContent = 'Company · Location';
    if (dates) dates.textContent = 'Dates';
    const list = clone.querySelector('ul, ol');
    if (list) list.innerHTML = '<li>Add an achievement or responsibility.</li>';
    return;
  }
  if (clone.matches('.project-entry')) {
    const title = clone.querySelector('.project-row strong');
    const meta = clone.querySelector('.project-row span');
    if (title) title.textContent = 'New project';
    if (meta) meta.textContent = 'Role · Year';
    ensureProjectDetails(clone).innerHTML = PROJECT_DETAILS_HTML;
    return;
  }
  if (clone.matches('.project-row')) {
    const title = clone.querySelector('strong');
    const meta = clone.querySelector('span');
    if (title) title.textContent = 'New project';
    if (meta) meta.textContent = 'Role · Year';
    return;
  }
  if (clone.matches('.education')) {
    const title = clone.querySelector('strong');
    const issuer = clone.querySelector('span');
    const year = clone.querySelector('small');
    if (title) title.textContent = `New ${label}`;
    if (issuer) issuer.textContent = 'Institution or issuer';
    if (year) year.textContent = 'Year';
    return;
  }
  if (clone.matches('.job-top')) {
    const heading = clone.querySelector('h3');
    const organization = clone.querySelector('p');
    const dates = clone.querySelector('time');
    if (heading) heading.textContent = `New ${label}`;
    if (organization) organization.textContent = 'Organization';
    if (dates) dates.textContent = 'Dates';
    return;
  }
  if (clone.matches('li')) {
    clone.textContent = `New ${label}`;
    return;
  }
  if (clone.matches('span, p')) {
    clone.textContent = `New ${label}`;
    return;
  }

  const title = clone.querySelector('h3, strong');
  const description = clone.querySelector('p');
  const dates = clone.querySelector('time, small');
  if (title) title.textContent = `New ${label}`;
  if (description) description.textContent = 'Add details';
  if (dates) dates.textContent = 'Dates';
  if (!title && !description && !dates) clone.textContent = `New ${label}`;
}

function createFirstItem(section) {
  const name = getRepeatableSectionName(section);
  if (name === 'Projects') {
    const entry = document.createElement('article');
    entry.className = 'project-entry';
    entry.innerHTML = '<div class="project-row" contenteditable="true"><strong>New project</strong><span>Role · Year</span></div>';
    ensureProjectDetails(entry);
    section.appendChild(entry);
    return entry;
  }
  const list = section.querySelector(':scope > [data-resume-item-list], :scope > .skill-list, :scope > ul, :scope > ol');
  const tagName = list?.matches('ul, ol') ? 'li' : list?.matches('.skill-list, .resume-inline-items') ? 'span' : 'p';
  const item = document.createElement(tagName);
  item.contentEditable = 'true';
  item.textContent = `New ${placeholderFor(name)}`;
  (list || section).appendChild(item);
  return item;
}

export function addSectionItem(section) {
  if (!isRepeatableSection(section)) return null;
  const items = getSectionItems(section);
  if (!items.length) return createFirstItem(section);
  const source = items[items.length - 1];
  const clone = source.cloneNode(true);
  cleanClone(clone);
  resetClone(clone, getRepeatableSectionName(section));
  source.parentElement.insertBefore(clone, source.nextSibling);
  return clone;
}

export function removeSectionItem(section, item = null) {
  if (!isRepeatableSection(section)) return false;
  const items = getSectionItems(section);
  const target = item && items.includes(item) ? item : items[items.length - 1];
  if (!target) return false;
  target.remove();
  return true;
}

export function clearItemEditorDecorations(root) {
  root?.querySelectorAll('.resume-item-editable').forEach(item => {
    item.classList.remove('resume-item-editable');
    item.removeAttribute('data-item-editable');
  });
}
