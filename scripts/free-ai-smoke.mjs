import { createRequire } from 'node:module';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE_ROOT || 'playwright');
const targetUrl = process.env.RESUMEFORGE_URL || 'http://127.0.0.1:4173/';
const outputDirectory = path.resolve(process.env.RESUMEFORGE_FREE_AI_TEST_DIR || 'tmp/free-ai-smoke');
const chromePath = process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

await mkdir(outputDirectory, { recursive: true });
const browser = await chromium.launch({ headless: true, executablePath: chromePath });
const context = await browser.newContext({ viewport: { width: 1600, height: 1100 }, deviceScaleFactor: 1 });
await context.addInitScript(() => localStorage.clear());
const page = await context.newPage();
const errors = [];
const paidProviderCalls = [];
page.on('console', message => {
  if (message.type() === 'error' && !/Failed to load resource: the server responded with a status of 404/i.test(message.text())) errors.push(`console: ${message.text()}`);
});
page.on('pageerror', error => errors.push(`page: ${error.message}`));
page.on('request', request => {
  if (/api\.openai\.com|generativelanguage\.googleapis\.com/i.test(request.url())) paidProviderCalls.push(request.url());
});

const field = label => page.locator('.ai-field').filter({ has: page.locator('span', { hasText: label }) }).first().locator('input, textarea, select').first();
const resultText = page.locator('.ai-result-text');

await page.goto(targetUrl, { waitUntil: 'networkidle' });
await page.locator('.home-primary').click();
await page.locator('.resume-page').waitFor({ state: 'visible' });
await page.getByRole('button', { name: /AI Copilot/i }).click();
await page.getByText('ResumeForge Free AI', { exact: true }).waitFor();
if (!(await page.getByText(/Free and ready/i).count())) throw new Error('free AI is not the ready default provider');

await page.getByRole('tab', { name: 'Connect', exact: true }).click();
await page.getByText('No key, account, billing, or network request', { exact: true }).waitFor();
if (await page.getByLabel('AI API key').count()) throw new Error('free AI unexpectedly asks for an API key');
await page.getByRole('button', { name: 'Verify free AI', exact: true }).click();
await page.getByText('Free AI is ready on this device', { exact: true }).waitFor();

await page.getByRole('tab', { name: 'Create', exact: true }).click();
await field('Full name').fill('Priya Sharma');
await field('Target role').fill('Trade Finance Specialist');
await field('Industry / category').fill('Banking');
await field('Experience').fill('6 years');
await field('Email').fill('priya@example.com');
await field('Phone').fill('+91 99999 11111');
await field('Location').fill('Mumbai, India');
await field('Career history').fill('Trade Finance Specialist | Verified Bank | Mumbai | 2020-Present\nProcessed export documents through SWIFT\nReviewed UCP 600 discrepancies');
await field('Top achievements').fill('Reduced document exceptions by 18%');
await field('Education').fill('B.Com | Mumbai University | Mumbai | 2019');
await field('Skills').fill('Trade Finance, SWIFT, UCP 600, Sanctions Screening');
await field('Projects').fill('Export Controls Upgrade | Lead | 2024\nMapped validation controls\nCoordinated release testing');
await field('Languages').fill('English, Hindi');
await page.getByRole('button', { name: 'Generate complete resume', exact: true }).click();
await page.getByRole('button', { name: 'Apply complete resume', exact: true }).waitFor();
if (!(await resultText.innerText()).includes('Priya Sharma')) throw new Error('free AI preview lost the supplied name');
await page.getByRole('button', { name: 'Apply complete resume', exact: true }).click();
await page.locator('.resume-page h1', { hasText: 'Priya Sharma' }).waitFor();
for (const expected of ['Verified Bank', 'Reduced document exceptions by 18%', 'UCP 600', 'Export Controls Upgrade', 'Coordinated release testing']) {
  if (!(await page.locator('.resume-page').innerText()).includes(expected)) throw new Error(`applied free AI resume lost: ${expected}`);
}
if (!(await page.locator('[data-section-name="Projects"] .project-details').count())) throw new Error('free AI project details are not editable below the project name');

await page.getByRole('tab', { name: 'Ask', exact: true }).click();
await field('Your question').fill('Which skills matter for a trade finance SWIFT resume?');
await page.getByRole('button', { name: 'Get a focused answer', exact: true }).click();
await resultText.filter({ hasText: 'UCP 600' }).waitFor();

await page.getByRole('tab', { name: 'Write', exact: true }).click();
await page.getByLabel('AI section type').selectOption({ label: 'Projects' });
await field('Facts and context').fill('led release testing\nvalidated payment controls\nreduced exceptions by 18%');
await page.getByRole('button', { name: 'Draft Projects', exact: true }).click();
await resultText.filter({ hasText: 'Reduced exceptions by 18%.' }).waitFor();

await page.getByRole('tab', { name: 'Review', exact: true }).click();
await page.getByRole('button', { name: 'Generate professional suggestions', exact: true }).click();
await resultText.filter({ hasText: 'Experience writing:' }).waitFor();

await page.screenshot({ path: path.join(outputDirectory, 'desktop-free-ai.png'), fullPage: true });
await page.setViewportSize({ width: 390, height: 844 });
await page.screenshot({ path: path.join(outputDirectory, 'mobile-free-ai.png'), fullPage: true });
await page.setViewportSize({ width: 1600, height: 1100 });

await page.getByRole('button', { name: 'Close AI workspace', exact: true }).click();
await page.getByRole('button', { name: 'Save', exact: true }).click();
const saved = await page.evaluate(() => localStorage.getItem('resumeforge-saves') || '');
if (!saved.includes('Priya Sharma') || !saved.includes('Reduced document exceptions by 18%')) throw new Error('saved resume lost free AI content');
if (/sk-[a-z0-9_-]{8,}|AI API key/i.test(saved)) throw new Error('saved resume contains credential data');

await page.getByRole('button', { name: /^Export/ }).click();
const exportModal = page.getByRole('dialog');
await exportModal.locator('.format-grid button').filter({ hasText: /^\s*HTML/ }).click();
const downloadPromise = page.waitForEvent('download', { timeout: 120000 });
await exportModal.getByRole('button', { name: /Export HTML/i }).click();
const download = await downloadPromise;
const exportPath = path.join(outputDirectory, 'free-ai-resume.html');
await download.saveAs(exportPath);
const exportedHtml = await readFile(exportPath, 'utf8');
for (const expected of ['Priya Sharma', 'Verified Bank', 'Export Controls Upgrade', 'Reduced document exceptions by 18%']) {
  if (!exportedHtml.includes(expected)) throw new Error(`exported free AI resume lost: ${expected}`);
}

if (paidProviderCalls.length) throw new Error(`free AI made paid provider calls: ${paidProviderCalls.join(', ')}`);
await writeFile(path.join(outputDirectory, 'results.json'), JSON.stringify({
  targetUrl, checks: 29, paidProviderCalls, errors,
  generatedName: await page.locator('.resume-page h1').first().innerText(),
}, null, 2));
await browser.close();
if (errors.length) throw new Error(errors.join('\n'));
process.stdout.write(JSON.stringify({ targetUrl, checks: 29, paidProviderCalls: 0, outputDirectory }, null, 2));
