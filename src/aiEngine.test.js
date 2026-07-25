import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  buildAIResumeMarkup, buildTaskPrompt, callAIProvider, parseGrammarCorrections,
  parseStructuredResume
} from './aiEngine';
import { analyzeATS } from './atsEngine';

afterEach(() => vi.unstubAllGlobals());

describe('ResumeForge AI engine', () => {
  it('parses a structured resume and builds editable, escaped resume markup', () => {
    const parsed = parseStructuredResume(JSON.stringify({
      profile: { name: 'Priya <Sharma>', headline: 'Data Analyst', email: 'priya@example.com', links: ['linkedin.com/in/priya'] },
      summary: 'Evidence-led analyst.', skills: ['SQL', 'Power BI'],
      experience: [{ role: 'Analyst', company: 'Acme', dates: '2022–Present', bullets: ['Reduced reporting time by 30%.'] }],
      education: [{ qualification: 'B.Sc.', institution: 'University', dates: '2022' }]
    }));
    const markup = buildAIResumeMarkup(parsed);
    expect(parsed.skills).toEqual(['SQL', 'Power BI']);
    expect(markup).toContain('Priya &lt;Sharma&gt;');
    expect(markup).toContain('data-section-name="Experience"');
    expect(markup).toContain('contenteditable="true"');
    expect(markup).not.toContain('<Sharma>');
  });

  it('builds truthfulness-constrained prompts and parses batch grammar corrections', () => {
    const prompt = buildTaskPrompt({ task: 'full', payload: { name: 'A', targetRole: 'Engineer' }, context: { text: '', sections: [] } });
    expect(prompt).toContain('Return strict JSON only');
    const corrections = parseGrammarCorrections('```json\n[{"original":"Led team","replacement":"Led the team","reason":"Article"}]\n```');
    expect(corrections).toEqual([{ original: 'Led team', replacement: 'Led the team', reason: 'Article' }]);
  });

  it('calculates an explainable ATS score and job keyword coverage locally', () => {
    const html = `<h1>Priya Sharma</h1><div>priya@example.com +91 9876543210 linkedin.com/in/priya</div><h2>Summary</h2><p>Data analyst</p><h2>Experience</h2><ul><li>Improved SQL reporting speed by 35%</li><li>Built Power BI dashboards for sales teams</li></ul><h2>Skills</h2><p>SQL Power BI analytics</p><h2>Education</h2><p>BSc Statistics</p>`;
    const report = analyzeATS({ html, jobDescription: 'Seeking a data analyst with SQL, Power BI, Python, analytics and stakeholder communication.' });
    expect(report.score).toBeGreaterThan(60);
    expect(report.breakdown).toHaveLength(6);
    expect(report.keywords.matched).toContain('sql');
    expect(report.keywords.missing).toContain('python');
    expect(report.disclaimer).toMatch(/not a result from any employer or ATS vendor/i);
  });

  it('calls the OpenAI Responses API with optional web search and extracts citations', async () => {
    const fetchMock = vi.fn(async (_url, options) => ({
      ok: true,
      json: async () => ({ model: 'gpt-5.6-sol', output: [{ content: [{ type: 'output_text', text: 'Focused answer', annotations: [{ title: 'Official source', url: 'https://example.com/source' }] }] }] })
    }));
    vi.stubGlobal('fetch', fetchMock);
    const result = await callAIProvider({ provider: 'openai', apiKey: 'session-key', model: 'gpt-5.6-sol', endpoint: 'https://api.openai.com/v1/responses', useResearch: true }, 'Question');
    const request = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(request.tools).toEqual([{ type: 'web_search' }]);
    expect(request.instructions).toContain('Never invent employers');
    expect(fetchMock.mock.calls[0][1].headers.Authorization).toBe('Bearer session-key');
    expect(result.text).toBe('Focused answer');
    expect(result.sources[0].url).toBe('https://example.com/source');
  });

  it('calls Gemini with Google Search grounding and blocks insecure remote endpoints', async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({ candidates: [{ content: { parts: [{ text: 'Grounded answer' }] }, groundingMetadata: { groundingChunks: [{ web: { title: 'Source', uri: 'https://example.org' } }] } }] })
    }));
    vi.stubGlobal('fetch', fetchMock);
    const result = await callAIProvider({ provider: 'gemini', apiKey: 'gemini-key', model: 'gemini-3.6-flash', useResearch: true }, 'Question');
    const request = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(request.tools).toEqual([{ google_search: {} }]);
    expect(result.sources).toEqual([{ title: 'Source', url: 'https://example.org' }]);
    await expect(callAIProvider({ provider: 'compatible', endpoint: 'http://remote.example.com/v1/chat/completions', model: 'model' }, 'Question')).rejects.toThrow(/must use HTTPS/i);
  });

  it('supports a key-optional local compatible provider and preserves its low temperature', async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({ model: 'local-career-model', choices: [{ message: { content: 'Direct local answer' } }] })
    }));
    vi.stubGlobal('fetch', fetchMock);

    const result = await callAIProvider({ provider: 'compatible', endpoint: 'http://localhost:11434/v1/chat/completions', model: 'local-career-model', apiKey: '' }, 'Question');
    const options = fetchMock.mock.calls[0][1];
    const request = JSON.parse(options.body);
    expect(options.headers.Authorization).toBeUndefined();
    expect(request.temperature).toBe(0.2);
    expect(request.messages[0].content).toContain('Never invent employers');
    expect(result.text).toBe('Direct local answer');
  });

  it('handles missing credentials, invalid URLs, provider failures, and empty responses', async () => {
    await expect(callAIProvider({ provider: 'openai', apiKey: '' }, 'Question')).rejects.toThrow(/OpenAI API key/i);
    await expect(callAIProvider({ provider: 'gemini', apiKey: '' }, 'Question')).rejects.toThrow(/Gemini API key/i);
    await expect(callAIProvider({ provider: 'compatible', endpoint: 'not a URL' }, 'Question')).rejects.toThrow(/valid provider endpoint URL/i);

    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, status: 401, statusText: 'Unauthorized', json: async () => ({ error: { message: 'Invalid credential' } }) })));
    await expect(callAIProvider({ provider: 'openai', apiKey: 'private-session-secret', endpoint: 'https://api.openai.com/v1/responses' }, 'Question')).rejects.toThrow('AI provider request failed: Invalid credential');

    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => ({ choices: [{ message: { content: '' } }] }) })));
    await expect(callAIProvider({ provider: 'compatible', endpoint: 'http://127.0.0.1:11434/v1/chat/completions' }, 'Question')).rejects.toThrow(/did not contain text/i);
  });
});
