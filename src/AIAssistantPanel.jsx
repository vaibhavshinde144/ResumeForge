import React, { useState } from 'react';
import {
  BarChart3, Bot, Check, ChevronRight, ClipboardCheck, FilePenLine,
  Globe2, KeyRound, LoaderCircle, MessageSquareText, PlugZap, RefreshCw,
  SearchCheck, Send, ShieldCheck, Sparkles, WandSparkles, X
} from 'lucide-react';
import { AI_PROVIDERS } from './aiEngine';
import { SECTION_CATALOG } from './customizationData';

const EMPTY_INTAKE = {
  name: '', targetRole: '', industry: '', experienceYears: '', email: '', phone: '',
  location: '', links: '', careerHistory: '', achievements: '', education: '', skills: '',
  projects: '', certifications: '', languages: '', additionalDetails: '', jobDescription: ''
};

const TABS = [
  { id: 'create', label: 'Create', icon: WandSparkles },
  { id: 'write', label: 'Write', icon: FilePenLine },
  { id: 'review', label: 'Review', icon: ClipboardCheck },
  { id: 'ask', label: 'Ask', icon: MessageSquareText },
  { id: 'ats', label: 'ATS', icon: BarChart3 },
  { id: 'connect', label: 'Connect', icon: PlugZap },
];

function Field({ label, children, hint }) {
  return <label className="ai-field"><span>{label}</span>{children}{hint && <small>{hint}</small>}</label>;
}

function RunButton({ children, onClick, busy, disabled = false, icon: Icon = Sparkles }) {
  return <button className="ai-run-button" onClick={onClick} disabled={busy || disabled}>{busy ? <LoaderCircle className="spin" size={16}/> : <Icon size={16}/>}<span>{busy ? 'Working…' : children}</span></button>;
}

function ResultCard({ result, error, task, onApply, onInsert, onClear }) {
  if (!result && !error) return null;
  return <div className={`ai-result-card ${error ? 'error' : ''}`} aria-live="polite">
    <div className="ai-result-head"><div>{error ? <X size={16}/> : <Check size={16}/>}<span>{error ? 'Request needs attention' : `${result.provider} · ${result.model || 'AI response'}`}</span></div><button onClick={onClear} aria-label="Clear AI result"><X size={15}/></button></div>
    {error ? <p className="ai-error-copy">{error}</p> : <>
      <div className="ai-result-text">{result.text}</div>
      {result.sources?.length > 0 && <div className="ai-sources"><strong>Research sources</strong>{result.sources.map(source => <a key={source.url} href={source.url} target="_blank" rel="noreferrer">{source.title}<ChevronRight size={12}/></a>)}</div>}
      <div className="ai-result-actions">
        {['full','section','grammar'].includes(task) && <button className="apply-ai-button" onClick={onApply}><Check size={15}/>{task === 'full' ? 'Apply complete resume' : task === 'grammar' ? 'Replace reviewed text' : 'Apply to section'}</button>}
        {task === 'suggestions' && <button onClick={onInsert}><FilePenLine size={15}/>Add as review notes</button>}
        {task === 'question' && <button onClick={onInsert}><FilePenLine size={15}/>Insert as custom section</button>}
      </div>
    </>}
  </div>;
}

export default function AIAssistantPanel({
  open, onClose, config, onConfigChange, connection, onTestConnection,
  onRun, onApplyResult, onInsertResult, onCancel, busy, result, error, resultTask,
  onClearResult, jobDescription, onJobDescriptionChange, atsReport, canUndoAI, onUndoAI
}) {
  const [tab, setTab] = useState('create');
  const [intake, setIntake] = useState(EMPTY_INTAKE);
  const [section, setSection] = useState('Summary');
  const [sectionDetails, setSectionDetails] = useState('');
  const [tone, setTone] = useState('confident and concise');
  const [length, setLength] = useState('concise');
  const [grammarScope, setGrammarScope] = useState('field');
  const [reviewFocus, setReviewFocus] = useState('Professional quality, relevance, evidence, readability, and ATS compatibility');
  const [question, setQuestion] = useState('');
  const provider = AI_PROVIDERS.find(item => item.id === config.provider) || AI_PROVIDERS[0];
  const sectionActionLabel = section === 'Summary' ? 'Professional Summary' : section;
  const setIntakeField = (key, value) => setIntake(current => ({ ...current, [key]: value }));
  const runFull = () => onRun('full', { ...intake, jobDescription: intake.jobDescription || jobDescription });

  if (!open) return <aside className="ai-assistant-panel side-panel" aria-hidden="true"/>;

  return <aside className={`ai-assistant-panel side-panel ${open ? 'open' : ''}`} aria-label="ResumeForge AI workspace">
    <div className="ai-panel-head"><div className="ai-title"><span className="ai-orb"><Sparkles size={18}/></span><div><span className="panel-kicker">REVIEW-FIRST AI</span><h2>Career copilot</h2></div></div><button className="ai-close" onClick={onClose} aria-label="Close AI workspace"><X size={18}/></button></div>
    <div className="ai-provider-strip"><span className={`connection-dot ${connection === 'connected' ? 'connected' : ''}`}/><div><strong>{provider.label}</strong><small>{config.model || 'Model not set'} · {provider.local ? 'Free and ready' : connection === 'connected' ? 'Connection verified' : 'Not verified'}</small></div><button onClick={() => setTab('connect')}><KeyRound size={14}/>{provider.local ? 'Free mode' : 'Configure'}</button></div>
    <div className="ai-tabs" role="tablist">{TABS.map(item => { const Icon = item.icon; return <button key={item.id} role="tab" aria-selected={tab === item.id} className={tab === item.id ? 'active' : ''} onClick={() => setTab(item.id)}><Icon size={15}/><span>{item.label}</span></button>; })}</div>
    <div className="ai-panel-body">
      {tab === 'create' && <section className="ai-workflow">
        <div className="ai-section-intro"><Bot size={19}/><div><h3>Create the complete resume</h3><p>Provide verified facts. AI drafts the full document; you review it before replacement.</p></div></div>
        <div className="ai-form-grid two"><Field label="Full name"><input value={intake.name} onChange={event => setIntakeField('name', event.target.value)} placeholder="e.g. Ananya Rao"/></Field><Field label="Target role"><input value={intake.targetRole} onChange={event => setIntakeField('targetRole', event.target.value)} placeholder="e.g. Senior Product Designer"/></Field><Field label="Industry / category"><input value={intake.industry} onChange={event => setIntakeField('industry', event.target.value)} placeholder="Technology, healthcare…"/></Field><Field label="Experience"><input value={intake.experienceYears} onChange={event => setIntakeField('experienceYears', event.target.value)} placeholder="e.g. 8 years"/></Field><Field label="Email"><input type="email" value={intake.email} onChange={event => setIntakeField('email', event.target.value)} placeholder="name@example.com"/></Field><Field label="Phone"><input value={intake.phone} onChange={event => setIntakeField('phone', event.target.value)} placeholder="Phone number"/></Field><Field label="Location"><input value={intake.location} onChange={event => setIntakeField('location', event.target.value)} placeholder="City, country"/></Field><Field label="Professional links"><input value={intake.links} onChange={event => setIntakeField('links', event.target.value)} placeholder="LinkedIn, portfolio, GitHub"/></Field></div>
        <Field label="Career history" hint="Include employer, role, dates, responsibilities, achievements, tools, and genuine metrics."><textarea rows="6" value={intake.careerHistory} onChange={event => setIntakeField('careerHistory', event.target.value)} placeholder="Describe each role with accurate facts…"/></Field>
        <Field label="Top achievements"><textarea rows="3" value={intake.achievements} onChange={event => setIntakeField('achievements', event.target.value)} placeholder="Awards, outcomes, promotions, revenue, time saved…"/></Field>
        <div className="ai-form-grid two"><Field label="Education"><textarea rows="3" value={intake.education} onChange={event => setIntakeField('education', event.target.value)} placeholder="Degree, institution, dates"/></Field><Field label="Skills"><textarea rows="3" value={intake.skills} onChange={event => setIntakeField('skills', event.target.value)} placeholder="Technical and professional skills"/></Field><Field label="Projects"><textarea rows="3" value={intake.projects} onChange={event => setIntakeField('projects', event.target.value)} placeholder="Project, contribution, result"/></Field><Field label="Certifications"><textarea rows="3" value={intake.certifications} onChange={event => setIntakeField('certifications', event.target.value)} placeholder="Credential, issuer, date"/></Field></div>
        <div className="ai-form-grid two"><Field label="Languages"><textarea rows="3" value={intake.languages} onChange={event => setIntakeField('languages', event.target.value)} placeholder="English, Hindi…"/></Field><Field label="Additional details"><textarea rows="3" value={intake.additionalDetails} onChange={event => setIntakeField('additionalDetails', event.target.value)} placeholder="Volunteering, publications, availability…"/></Field></div>
        <Field label="Target job description"><textarea rows="5" value={intake.jobDescription} onChange={event => { setIntakeField('jobDescription', event.target.value); onJobDescriptionChange(event.target.value); }} placeholder="Paste the vacancy for tailored keywords and priorities"/></Field>
        <RunButton onClick={runFull} busy={busy} disabled={!intake.name.trim() || !intake.targetRole.trim()}>Generate complete resume</RunButton>
      </section>}

      {tab === 'write' && <section className="ai-workflow">
        <div className="ai-section-intro"><FilePenLine size={19}/><div><h3>Write any resume section</h3><p>Transform brief verified facts into professional, domain-aware content across all {SECTION_CATALOG.length} section types.</p></div></div>
        <Field label="Section"><select aria-label="AI section type" value={section} onChange={event => setSection(event.target.value)}>{SECTION_CATALOG.map(item => <option key={item.name}>{item.name}</option>)}</select></Field>
        <Field label="Facts and context"><textarea rows="8" value={sectionDetails} onChange={event => setSectionDetails(event.target.value)} placeholder="What must this section say? Include names, dates, tools, actions, and outcomes."/></Field>
        <div className="ai-form-grid two"><Field label="Tone"><select value={tone} onChange={event => setTone(event.target.value)}><option>confident and concise</option><option>executive and strategic</option><option>technical and precise</option><option>warm and people-focused</option><option>academic and evidence-led</option></select></Field><Field label="Length"><select value={length} onChange={event => setLength(event.target.value)}><option>concise</option><option>standard</option><option>detailed</option></select></Field></div>
        <RunButton onClick={() => onRun('section', { section, details: sectionDetails, tone, length })} busy={busy} disabled={!sectionDetails.trim()}>Draft {sectionActionLabel}</RunButton>
      </section>}

      {tab === 'review' && <section className="ai-workflow">
        <div className="ai-section-intro"><ClipboardCheck size={19}/><div><h3>Polish and review</h3><p>Correct the active field or request a prioritized professional review.</p></div></div>
        <div className="ai-choice-cards"><button className={grammarScope === 'field' ? 'active' : ''} onClick={() => setGrammarScope('field')}><strong>Current field</strong><small>Uses selected or focused editable text</small></button><button className={grammarScope === 'page' ? 'active' : ''} onClick={() => setGrammarScope('page')}><strong>Current page</strong><small>Reviews all text on this page</small></button><button className={grammarScope === 'resume' ? 'active' : ''} onClick={() => setGrammarScope('resume')}><strong>Entire resume</strong><small>Reviews all document pages</small></button></div>
        <RunButton onClick={() => onRun('grammar', { scope: grammarScope })} busy={busy} icon={RefreshCw}>Correct grammar and clarity</RunButton>
        <div className="ai-divider"><span>OR</span></div>
        <Field label="Review focus"><textarea rows="4" value={reviewFocus} onChange={event => setReviewFocus(event.target.value)}/></Field>
        <RunButton onClick={() => onRun('suggestions', { focus: reviewFocus })} busy={busy} icon={SearchCheck}>Generate professional suggestions</RunButton>
      </section>}

      {tab === 'ask' && <section className="ai-workflow ai-chat-workflow">
        <div className="ai-section-intro"><MessageSquareText size={19}/><div><h3>Ask about any topic</h3><p>Resume-aware Q&amp;A for roles, products, industries, work, writing, and general questions.</p></div></div>
        <Field label="Your question"><textarea rows="9" value={question} onChange={event => setQuestion(event.target.value)} placeholder="Ask a specific question…" onKeyDown={event => { if ((event.ctrlKey || event.metaKey) && event.key === 'Enter' && question.trim()) onRun('question', { question }); }}/><small>Press Ctrl/⌘ + Enter to send</small></Field>
        <RunButton onClick={() => onRun('question', { question })} busy={busy} disabled={!question.trim()} icon={Send}>Get a focused answer</RunButton>
      </section>}

      {tab === 'ats' && <section className="ai-workflow ats-workflow">
        <div className="ats-score-hero"><div className={`ats-score-ring score-${Math.floor(atsReport.score / 10)}`} style={{ '--score': `${atsReport.score * 3.6}deg` }}><strong>{atsReport.score}</strong><span>/100</span></div><div><span className="panel-kicker">AUTOMATIC PREFLIGHT</span><h3>{atsReport.grade}</h3><p>Explainable local checks update as you edit.</p></div></div>
        <Field label="Target job description" hint="Used locally for keyword comparison and supplied to AI only when you make an AI request."><textarea rows="7" value={jobDescription} onChange={event => onJobDescriptionChange(event.target.value)} placeholder="Paste a job description for role-specific matching…"/></Field>
        <div className="ats-breakdown">{atsReport.breakdown.map(item => <article key={item.id}><div><strong>{item.label}</strong><span>{item.score}/{item.max}</span></div><progress max={item.max} value={item.score}/><small>{item.detail}</small></article>)}</div>
        {atsReport.keywords.total > 0 && <div className="ats-keywords"><strong>Keyword coverage · {atsReport.keywords.coverage}%</strong><div>{atsReport.keywords.matched.slice(0, 12).map(word => <span className="matched" key={word}>{word}</span>)}{atsReport.keywords.missing.slice(0, 12).map(word => <span className="missing" key={word}>{word}</span>)}</div><small>Green = present. Outlined = review; add only when truthful.</small></div>}
        <div className="ats-suggestions"><strong>Next improvements</strong><ol>{atsReport.suggestions.map(item => <li key={item}>{item}</li>)}</ol></div>
        <div className="ats-disclaimer"><ShieldCheck size={15}/><span>{atsReport.disclaimer}</span></div>
      </section>}

      {tab === 'connect' && <section className="ai-workflow">
        <div className="ai-section-intro"><PlugZap size={19}/><div><h3>Choose an AI provider</h3><p>Free AI runs on this device. Connected providers remain optional for larger models and live research.</p></div></div>
        <Field label="Provider"><select aria-label="AI provider" value={config.provider} onChange={event => { const next = AI_PROVIDERS.find(item => item.id === event.target.value); onConfigChange({ provider: next.id, model: next.model, endpoint: next.endpoint, apiKey: '', useResearch: false }); }}>{AI_PROVIDERS.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}</select></Field>
        {provider.local ? <div className="free-ai-card"><div><ShieldCheck size={18}/><strong>No key, account, billing, or network request</strong></div><p>Deep resume rewriting, 20 career-domain knowledge packs, grammar checks, professional suggestions, career Q&amp;A, and ATS guidance run entirely in your browser. Your resume stays on this device.</p><small>The professional career engine expands verified facts without inventing employers, dates, qualifications, or metrics. Current web facts and unrestricted general knowledge require an optional connected provider.</small></div> : <>
          <Field label="Model"><input aria-label="AI model" value={config.model} onChange={event => onConfigChange({ model: event.target.value })} placeholder="Provider model ID"/></Field>
          {(config.provider === 'compatible' || config.provider === 'openai') && <Field label="Endpoint" hint="Remote endpoints must use HTTPS. HTTP is allowed only on localhost."><input aria-label="AI endpoint" value={config.endpoint} onChange={event => onConfigChange({ endpoint: event.target.value })}/></Field>}
          <Field label={provider.keyLabel} hint="Use a restricted key. For a public production deployment, route requests through your own authenticated server."><input aria-label="AI API key" type="password" autoComplete="off" value={config.apiKey} onChange={event => onConfigChange({ apiKey: event.target.value })} placeholder="Session-only credential"/></Field>
        </>}
        {provider.supportsResearch && <label className="ai-research-toggle"><span><Globe2 size={16}/><span><strong>Live web research</strong><small>{config.provider === 'gemini' ? 'Google Search grounding with citations' : 'OpenAI web search with citations'} · may add provider charges</small></span></span><button className={`tiny-toggle ${config.useResearch ? 'on' : ''}`} aria-label="Toggle live web research" onClick={() => onConfigChange({ useResearch: !config.useResearch })}><i/></button></label>}
        <RunButton onClick={onTestConnection} busy={busy} disabled={(!provider.local && !config.model.trim()) || (provider.requiresKey && !config.apiKey.trim())} icon={PlugZap}>{provider.local ? 'Verify free AI' : 'Test connection'}</RunButton>
        {connection === 'connected' && <div className="connection-success"><Check size={15}/>{provider.local ? 'Free AI is ready on this device' : 'Connection verified for this tab'}</div>}
        {!provider.local && <div className="ai-security-note"><ShieldCheck size={17}/><div><strong>Important security boundary</strong><p>This portable file can call providers directly for personal use. Do not publish it with a key embedded. Resume data is sent only when you click an AI action.</p></div></div>}
      </section>}

      <ResultCard result={result} error={error} task={resultTask} onApply={onApplyResult} onInsert={onInsertResult} onClear={onClearResult}/>
      {canUndoAI && <button className="undo-ai-button" onClick={onUndoAI}><RefreshCw size={14}/>Undo last applied AI change</button>}
      {busy && <button className="cancel-ai-button" onClick={onCancel}>Cancel current request</button>}
      <p className="ai-review-note">AI output may contain errors. Verify names, dates, metrics, qualifications, legal requirements, and current facts before applying or exporting.</p>
    </div>
  </aside>;
}
