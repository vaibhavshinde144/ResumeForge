import { createRequire } from 'node:module';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const require = createRequire(import.meta.url);
const playwrightRoot = process.env.PLAYWRIGHT_MODULE_ROOT || 'playwright';
const { chromium } = require(playwrightRoot);
const targetUrl = process.env.RESUMEFORGE_URL || 'http://127.0.0.1:4173/';
const outputDirectory = path.resolve(process.env.RESUMEFORGE_EXPORT_DIR || 'tmp/export-smoke');
const chromePath = process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

await mkdir(outputDirectory, { recursive: true });
const browser = await chromium.launch({ headless: true, executablePath: chromePath });
const context = await browser.newContext({ acceptDownloads: true, viewport: { width: 1600, height: 1100 }, deviceScaleFactor: 1 });
const page = await context.newPage();
const browserErrors = [];
page.on('console', message => {
  if (message.type() === 'error' && !/Failed to load resource: the server responded with a status of 404/i.test(message.text())) browserErrors.push(`console: ${message.text()}`);
});
page.on('pageerror', error => browserErrors.push(`page: ${error.message}`));

await page.goto(targetUrl, { waitUntil: 'networkidle' });
await page.locator('.home-primary').click();
await page.locator('.resume-page').waitFor({ state: 'visible' });
await page.locator('.resume-page').screenshot({ path: path.join(outputDirectory, 'editor-resume.png') });

const formats = [
  ['PDF', /Export PDF/i],
  ['Word (exact)', /Export DOCX/i],
  ['Word (editable)', /Export DOCX-EDITABLE/i],
  ['PNG', /Export PNG/i],
  ['JPG', /Export JPG/i],
  ['HTML', /Export HTML/i],
  ['Text', /Export TXT/i],
  ['RTF', /Export RTF/i],
  ['SVG', /Export SVG/i],
];
const downloads = [];

for (const [label, exportButtonName] of formats) {
  await page.getByRole('button', { name: /^Export/ }).click();
  const modal = page.getByRole('dialog');
  const escapedLabel = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  await modal.locator('.format-grid button').filter({ hasText: new RegExp(`^\\s*${escapedLabel}`) }).click();
  const downloadPromise = page.waitForEvent('download', { timeout: 120000 });
  await modal.getByRole('button', { name: exportButtonName }).click();
  const download = await downloadPromise;
  const suggested = download.suggestedFilename();
  const destination = path.join(outputDirectory, suggested);
  await download.saveAs(destination);
  downloads.push({ label, file: destination });
  await modal.waitFor({ state: 'detached', timeout: 120000 });
}

await page.getByRole('button', { name: /^Add page$/i }).click();
for (const [label, exportButtonName] of [['PDF', /Export PDF/i], ['Word (exact)', /Export DOCX/i]]) {
  await page.getByRole('button', { name: /^Export/ }).click();
  const modal = page.getByRole('dialog');
  const escapedLabel = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  await modal.locator('.format-grid button').filter({ hasText: new RegExp(`^\\s*${escapedLabel}`) }).click();
  const downloadPromise = page.waitForEvent('download', { timeout: 120000 });
  await modal.getByRole('button', { name: exportButtonName }).click();
  const download = await downloadPromise;
  const suggested = download.suggestedFilename();
  const destination = path.join(outputDirectory, `two-page-${suggested}`);
  await download.saveAs(destination);
  downloads.push({ label: `Two-page ${label}`, file: destination });
  await modal.waitFor({ state: 'detached', timeout: 120000 });
}

await page.getByRole('button', { name: 'Delete current page' }).click();
for (const collectionName of ['Styles', 'Industries', 'Global']) {
  await page.locator('.collection-strip button').filter({ hasText: new RegExp(`^${collectionName}$`) }).click();
  await page.locator('.template-card').nth(collectionName === 'Styles' ? 1 : collectionName === 'Industries' ? 2 : 3).click();
  await page.getByRole('button', { name: /^Export/ }).click();
  const modal = page.getByRole('dialog');
  await modal.locator('.format-grid button').filter({ hasText: /^\s*PNG/ }).click();
  const downloadPromise = page.waitForEvent('download', { timeout: 120000 });
  await modal.getByRole('button', { name: /Export PNG/i }).click();
  const download = await downloadPromise;
  const destination = path.join(outputDirectory, `${collectionName.toLowerCase()}-${download.suggestedFilename()}`);
  await download.saveAs(destination);
  downloads.push({ label: `${collectionName} template PNG`, file: destination });
  await modal.waitFor({ state: 'detached', timeout: 120000 });
}

const htmlPreview = await context.newPage();
await htmlPreview.goto(pathToFileURL(path.join(outputDirectory, 'Ananya-Rao-Resume.html')).href, { waitUntil: 'load' });
await htmlPreview.locator('.resume-page').first().waitFor({ state: 'visible' });
await htmlPreview.locator('.resume-page').first().screenshot({ path: path.join(outputDirectory, 'html-resume.png') });
await htmlPreview.close();

await writeFile(path.join(outputDirectory, 'browser-errors.json'), JSON.stringify(browserErrors, null, 2));
await writeFile(path.join(outputDirectory, 'downloads.json'), JSON.stringify(downloads, null, 2));
await browser.close();

if (browserErrors.length) throw new Error(browserErrors.join('\n'));
process.stdout.write(JSON.stringify({ targetUrl, outputDirectory, downloads }, null, 2));
