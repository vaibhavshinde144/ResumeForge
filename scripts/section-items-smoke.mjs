import { createRequire } from 'node:module';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const require = createRequire(import.meta.url);
const playwrightRoot = process.env.PLAYWRIGHT_MODULE_ROOT || 'playwright';
const { chromium } = require(playwrightRoot);
const targetUrl = process.env.RESUMEFORGE_URL || 'http://127.0.0.1:4173/';
const outputDirectory = path.resolve(process.env.RESUMEFORGE_ITEM_TEST_DIR || 'tmp/section-items-smoke');
const chromePath = process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

await mkdir(outputDirectory, { recursive: true });
const browser = await chromium.launch({ headless: true, executablePath: chromePath });
const context = await browser.newContext({ viewport: { width: 1600, height: 1100 }, deviceScaleFactor: 1 });
await context.addInitScript(() => localStorage.clear());
const page = await context.newPage();
const errors = [];
page.on('console', message => {
  if (message.type() === 'error' && !/Failed to load resource: the server responded with a status of 404/i.test(message.text())) errors.push(`console: ${message.text()}`);
});
page.on('pageerror', error => errors.push(`page: ${error.message}`));

const section = name => page.locator('.resume-section').filter({ has: page.locator('h2', { hasText: name }) }).first();
const expectCount = async (locator, count, label) => {
  const actual = await locator.count();
  if (actual !== count) throw new Error(`${label}: expected ${count}, received ${actual}`);
};

await page.goto(targetUrl, { waitUntil: 'networkidle' });
await page.locator('.home-primary').click();
await page.locator('.resume-page').waitFor({ state: 'visible' });

const experience = section('Experience');
await expectCount(experience.locator(':scope > .job'), 2, 'initial experience items');
await page.getByRole('button', { name: 'Add Experience item', exact: true }).click();
await expectCount(experience.locator(':scope > .job'), 3, 'experience after add');
const newRole = experience.locator(':scope > .job').nth(2).locator('h3');
await newRole.fill('Quality Engineering Lead');
if ((await newRole.textContent()) !== 'Quality Engineering Lead') throw new Error('new experience item is not editable');
await page.getByRole('button', { name: 'Remove Experience item 3', exact: true }).click();
await expectCount(experience.locator(':scope > .job'), 2, 'experience after remove');

const skills = section('Skills');
await expectCount(skills.locator(':scope > .skill-list > span'), 6, 'initial skills');
await page.getByRole('button', { name: 'Add Skills item', exact: true }).click();
await expectCount(skills.locator(':scope > .skill-list > span'), 7, 'skills after add');
await page.getByRole('button', { name: 'Remove Skills item 7', exact: true }).click();
await expectCount(skills.locator(':scope > .skill-list > span'), 6, 'skills after remove');

const projects = section('Projects');
await expectCount(projects.locator(':scope > .project-entry'), 2, 'migrated project entries');
await page.getByRole('button', { name: 'Add details for Pulse Insights', exact: true }).click();
const projectDetails = projects.locator(':scope > .project-entry').first().locator('.project-details');
await projectDetails.waitFor({ state: 'visible' });
await projectDetails.fill('Roles & responsibilities: Led payment integration and release delivery.');
await projectDetails.press('Enter');
await projectDetails.pressSequentially('Duration: Jan 2024 – Dec 2024');
await projectDetails.press('Enter');
await projectDetails.pressSequentially('Skills & technologies: React, APIs, testing');
await projectDetails.press('Enter');
await projectDetails.pressSequentially('Additional unrestricted project detail.');
const projectText = await projectDetails.innerText();
for (const expected of ['Roles & responsibilities:', 'Duration:', 'Skills & technologies:', 'Additional unrestricted project detail.']) {
  if (!projectText.includes(expected)) throw new Error(`project details missing ${expected}`);
}
await page.getByRole('button', { name: 'Add Projects item', exact: true }).click();
await expectCount(projects.locator(':scope > .project-entry'), 3, 'projects after add');
const newProject = projects.locator(':scope > .project-entry').nth(2);
if (!(await newProject.innerText()).includes('Skills & technologies:')) throw new Error('new project does not contain structured details');
await page.getByRole('button', { name: 'Remove Projects item 3', exact: true }).click();
await expectCount(projects.locator(':scope > .project-entry'), 2, 'projects after remove');

if (await page.locator('[aria-label="Add Summary item"]').count()) throw new Error('Summary must not expose repeatable item controls');
if (await page.locator('[aria-label="Add Objective item"]').count()) throw new Error('Objective must not expose repeatable item controls');

await page.getByRole('button', { name: 'Content', exact: true }).click();
await page.getByRole('button', { name: 'Add Experience item from section library', exact: true }).click();
await expectCount(experience.locator(':scope > .job'), 3, 'customizer experience add');
await page.getByRole('button', { name: 'Remove last Experience item from section library', exact: true }).click();
await expectCount(experience.locator(':scope > .job'), 2, 'customizer experience remove');

await page.getByRole('button', { name: 'Save', exact: true }).click();
const storageAudit = await page.evaluate(() => ({
  saves: localStorage.getItem('resumeforge-saves') || '',
  draft: localStorage.getItem('resumeforge-draft-pages') || ''
}));
for (const [key, value] of Object.entries(storageAudit)) {
  if (/data-editor-ui|item-remove-button|data-item-editable|project-details-button|data-project-action/.test(value)) throw new Error(`${key} contains editor-only item controls`);
}
if (!storageAudit.saves.includes('Additional unrestricted project detail.')) throw new Error('saved resume lost project details');

await page.getByRole('button', { name: /^Export/ }).click();
const exportModal = page.getByRole('dialog');
await exportModal.locator('.format-grid button').filter({ hasText: /^\s*HTML/ }).click();
const projectExportPromise = page.waitForEvent('download', { timeout: 120000 });
await exportModal.getByRole('button', { name: /Export HTML/i }).click();
const projectExport = await projectExportPromise;
const projectExportPath = path.join(outputDirectory, 'project-details-resume.html');
await projectExport.saveAs(projectExportPath);
const projectExportHtml = await readFile(projectExportPath, 'utf8');
if (!projectExportHtml.includes('Additional unrestricted project detail.')) throw new Error('exported resume lost project details');
if (/<button[^>]+project-details-button|data-project-action=|data-editor-ui=/i.test(projectExportHtml)) throw new Error('exported resume contains project editor controls');

await page.setViewportSize({ width: 390, height: 844 });
await page.screenshot({ path: path.join(outputDirectory, 'mobile-editor.png'), fullPage: true });
await page.getByRole('button', { name: 'Add Experience item', exact: true }).click();
await expectCount(experience.locator(':scope > .job'), 3, 'mobile experience add');
await page.getByRole('button', { name: 'Remove Experience item 3', exact: true }).click();
await expectCount(experience.locator(':scope > .job'), 2, 'mobile experience remove');

await page.setViewportSize({ width: 1600, height: 1100 });
await page.screenshot({ path: path.join(outputDirectory, 'desktop-editor.png'), fullPage: true });
await writeFile(path.join(outputDirectory, 'results.json'), JSON.stringify({
  targetUrl,
  checks: 28,
  experienceItems: await experience.locator(':scope > .job').count(),
  skillItems: await skills.locator(':scope > .skill-list > span').count(),
  projectItems: await projects.locator(':scope > .project-entry').count(),
  errors
}, null, 2));
await browser.close();

if (errors.length) throw new Error(errors.join('\n'));
process.stdout.write(JSON.stringify({ targetUrl, checks: 28, outputDirectory }, null, 2));
