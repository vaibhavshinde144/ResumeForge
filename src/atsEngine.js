const STOP_WORDS = new Set('a an and are as at be by for from has have in into is it its of on or our that the their this to using with you your will'.split(' '));
const ACTION_VERBS = ['achieved','accelerated','built','created','cut','delivered','designed','developed','directed','drove','established','expanded','generated','implemented','improved','increased','launched','led','managed','mentored','optimized','reduced','resolved','scaled','streamlined','transformed'];

const wordsOf = value => String(value || '').toLowerCase().match(/[a-z][a-z0-9+#.-]{2,}/g) || [];
const unique = values => [...new Set(values)];

export function extractATSKeywords(value, limit = 30) {
  const counts = new Map();
  wordsOf(value).filter(word => !STOP_WORDS.has(word) && !/^\d+$/.test(word)).forEach(word => counts.set(word, (counts.get(word) || 0) + 1));
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, limit).map(([word]) => word);
}

export function analyzeATS({ html = '', jobDescription = '' } = {}) {
  const holder = document.createElement('div');
  holder.innerHTML = html;
  holder.querySelectorAll('script, style').forEach(node => node.remove());
  const text = holder.textContent.replace(/\s+/g, ' ').trim();
  const lower = text.toLowerCase();
  const headings = [...holder.querySelectorAll('h1,h2,h3')].map(node => node.textContent.trim().toLowerCase());
  const bullets = [...holder.querySelectorAll('li')].map(node => node.textContent.replace(/\s+/g, ' ').trim()).filter(Boolean);
  const wordCount = wordsOf(text).length;
  const email = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i.test(text);
  const phone = /(?:\+?\d[\d\s().-]{7,}\d)/.test(text);
  const link = /(?:https?:\/\/|www\.|linkedin\.com|github\.com|behance\.net|dribbble\.com|\.[a-z]{2,}\/[a-z0-9])/i.test(text);
  const has = name => headings.some(heading => heading === name || heading.includes(name));

  const contactScore = (email ? 5 : 0) + (phone ? 4 : 0) + (link ? 3 : 0);
  const sectionChecks = [has('summary') || has('profile'), has('experience') || has('employment'), has('skills') || has('competenc'), has('education')];
  const sectionWeights = [5, 7, 6, 6];
  const sectionScore = sectionChecks.reduce((sum, present, index) => sum + (present ? sectionWeights[index] : 0), 0);
  const measuredBullets = bullets.filter(item => /(?:\b\d+(?:\.\d+)?%?|[$€£₹]\s?\d+|\b\d+[kmb]\b)/i.test(item));
  const actionBullets = bullets.filter(item => ACTION_VERBS.some(verb => item.toLowerCase().startsWith(verb)));
  const impactScore = Math.min(12, Math.round((measuredBullets.length / Math.max(3, bullets.length)) * 18)) + Math.min(8, Math.round((actionBullets.length / Math.max(3, bullets.length)) * 12));
  const averageBulletWords = bullets.length ? bullets.reduce((sum, item) => sum + wordsOf(item).length, 0) / bullets.length : 0;
  const readabilityScore = (wordCount >= 180 && wordCount <= 1300 ? 7 : wordCount >= 100 ? 4 : 1) + (averageBulletWords >= 8 && averageBulletWords <= 28 ? 5 : bullets.length ? 2 : 0) + (!/\b(i|me|my)\b/i.test(text) ? 2 : 0);
  const imageCount = holder.querySelectorAll('img').length;
  const tableCount = holder.querySelectorAll('table').length;
  const hiddenCount = [...holder.querySelectorAll('[style]')].filter(node => /display\s*:\s*none/i.test(node.getAttribute('style') || '')).length;
  const structureScore = Math.min(15, Math.max(0, 15 - Math.max(0, imageCount - 1) * 2 - tableCount * 3 - Math.min(5, hiddenCount) + (holder.querySelector('h1') ? 2 : 0)));

  const jobKeywords = extractATSKeywords(jobDescription);
  const resumeWords = new Set(wordsOf(text));
  const matched = jobKeywords.filter(keyword => resumeWords.has(keyword));
  const missing = jobKeywords.filter(keyword => !resumeWords.has(keyword));
  const relevanceScore = jobKeywords.length ? Math.round((matched.length / jobKeywords.length) * 15) : Math.min(15, (has('skills') ? 5 : 0) + (has('experience') ? 5 : 0) + (holder.querySelector('.role')?.textContent.trim() ? 3 : 0) + (bullets.length >= 3 ? 2 : 0));

  const breakdown = [
    { id: 'contact', label: 'Contact & links', score: contactScore, max: 12, detail: `${email ? 'Email found' : 'Add an email'} · ${phone ? 'phone found' : 'add a phone'} · ${link ? 'link found' : 'add a professional link'}` },
    { id: 'sections', label: 'Core sections', score: sectionScore, max: 24, detail: `${sectionChecks.filter(Boolean).length}/4 essential section groups found` },
    { id: 'impact', label: 'Evidence & impact', score: impactScore, max: 20, detail: `${measuredBullets.length} quantified and ${actionBullets.length} action-led bullets` },
    { id: 'readability', label: 'Readability', score: readabilityScore, max: 14, detail: `${wordCount} words${bullets.length ? ` · ${Math.round(averageBulletWords)} words per bullet` : ''}` },
    { id: 'structure', label: 'ATS structure', score: structureScore, max: 15, detail: `${imageCount} image(s) · ${tableCount} table(s) · ${hiddenCount} hidden element(s)` },
    { id: 'relevance', label: jobKeywords.length ? 'Job keyword match' : 'General relevance', score: relevanceScore, max: 15, detail: jobKeywords.length ? `${matched.length}/${jobKeywords.length} priority keywords matched` : 'Add a target job description for role-specific matching' },
  ];
  const score = Math.max(0, Math.min(100, breakdown.reduce((sum, item) => sum + item.score, 0)));
  const suggestions = [];
  if (!email || !phone) suggestions.push('Add complete recruiter-ready contact information.');
  if (!sectionChecks[0]) suggestions.push('Add a concise professional summary tailored to the target role.');
  if (!sectionChecks[1]) suggestions.push('Add an experience section with role, employer, dates, and outcome-focused bullets.');
  if (!sectionChecks[2]) suggestions.push('Add a skills section using genuine role-relevant terminology.');
  if (bullets.length < 3) suggestions.push('Use scannable accomplishment bullets for recent work or projects.');
  if (measuredBullets.length < Math.min(3, bullets.length)) suggestions.push('Quantify genuine outcomes where you have supporting evidence; never invent numbers.');
  if (tableCount) suggestions.push('Tables may parse inconsistently in some ATS products; verify with a plain-text export.');
  if (missing.length) suggestions.push(`Review missing job terms: ${missing.slice(0, 8).join(', ')}. Add only those that truthfully match your experience.`);
  if (!jobKeywords.length) suggestions.push('Paste the target job description to calculate a role-specific keyword score.');
  return {
    score,
    grade: score >= 85 ? 'Strong' : score >= 70 ? 'Good foundation' : score >= 55 ? 'Needs improvement' : 'Incomplete',
    breakdown,
    suggestions: unique(suggestions).slice(0, 8),
    keywords: { matched, missing, total: jobKeywords.length, coverage: jobKeywords.length ? Math.round((matched.length / jobKeywords.length) * 100) : null },
    disclaimer: 'Heuristic preflight score, not a result from any employer or ATS vendor. Hiring systems and parsing rules vary.',
  };
}
