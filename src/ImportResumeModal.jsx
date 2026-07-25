import React, { useRef, useState } from 'react';
import { AlertTriangle, Check, FileSearch, FileUp, LoaderCircle, ShieldCheck, X } from 'lucide-react';
import { RESUME_IMPORT_ACCEPT, extractResumeFile } from './resumeImportEngine';

const formatBytes = bytes => {
  if (!Number.isFinite(bytes)) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export default function ImportResumeModal({ onClose, onApply }) {
  const inputRef = useRef(null);
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState({ stage: 'Ready', progress: 0 });
  const [ocrLanguage, setOcrLanguage] = useState('eng');
  const [enableOcr, setEnableOcr] = useState(true);

  const chooseFile = event => {
    const selected = event.target.files?.[0] || null;
    setFile(selected);
    setResult(null);
    setError('');
    setProgress({ stage: selected ? 'Ready to analyze' : 'Ready', progress: 0 });
  };

  const analyze = async () => {
    if (!file || busy) return;
    setBusy(true);
    setError('');
    setResult(null);
    try {
      setResult(await extractResumeFile(file, { ocrLanguage, enableOcr, onProgress: setProgress }));
    } catch (failure) {
      setError(failure?.message || 'The resume could not be imported.');
    } finally {
      setBusy(false);
    }
  };

  const mapping = result?.mapping;
  const sourceVisualAvailable = Boolean(result?.sourcePages?.length);

  return (
    <div className="modal-backdrop import-backdrop" onMouseDown={event => event.target === event.currentTarget && !busy && onClose()}>
      <div className="import-modal" role="dialog" aria-modal="true" aria-labelledby="import-resume-title">
        <div className="modal-head">
          <div><span className="panel-kicker">LOSSLESS-FIRST IMPORT</span><h2 id="import-resume-title">Upload an existing resume</h2><p>Preserve the source, extract text without rewriting it, review the mapping, then edit or restyle it.</p></div>
          <button onClick={onClose} disabled={busy} aria-label="Close import"><X size={20}/></button>
        </div>

        {!result && <>
          <button className={`import-dropzone ${file ? 'has-file' : ''}`} onClick={() => inputRef.current?.click()}>
            <span className="import-file-icon">{file ? <FileSearch size={30}/> : <FileUp size={30}/>}</span>
            {file ? <><strong>{file.name}</strong><small>{formatBytes(file.size)} · Click to replace</small></> : <><strong>Choose a resume file</strong><small>PDF, DOCX, ODT, RTF, HTML, text, Markdown, CSV, JSON, PNG, JPG, WebP, BMP, GIF or TIFF · maximum 30 MB</small></>}
          </button>
          <input ref={inputRef} hidden type="file" accept={RESUME_IMPORT_ACCEPT} onChange={chooseFile}/>
          <div className="import-options">
            <label><input type="checkbox" checked={enableOcr} onChange={event => setEnableOcr(event.target.checked)}/> OCR scanned PDF/image pages</label>
            <label><span>OCR language</span><select value={ocrLanguage} onChange={event => setOcrLanguage(event.target.value)}><option value="eng">English</option><option value="hin">Hindi</option><option value="eng+hin">English + Hindi</option><option value="deu">German</option><option value="fra">French</option><option value="spa">Spanish</option><option value="por">Portuguese</option></select></label>
          </div>
          {busy && <div className="import-progress" role="status"><span><LoaderCircle className="spin" size={17}/>{progress.stage}</span><div><i style={{ width: `${progress.progress || 4}%` }}/></div><strong>{progress.progress || 0}%</strong></div>}
          {error && <div className="import-error" role="alert"><AlertTriangle size={17}/><span><strong>Import stopped</strong>{error}</span></div>}
          <div className="import-trust-note"><ShieldCheck size={18}/><span><strong>No factual rewriting during import.</strong> Extracted text is mapped deterministically and fingerprinted. OCR and complex document layouts still require human verification.</span></div>
        </>}

        {result && <div className="import-review">
          <div className="import-success"><Check size={18}/><span><strong>Analysis complete</strong>{result.fileName} · {result.method}</span><button onClick={() => { setResult(null); setProgress({ stage: 'Ready', progress: 0 }); }}>Choose another</button></div>
          <div className="import-audit-grid">
            <div><span>Text integrity</span><strong>{mapping.allLinesAccountedFor ? 'All lines accounted for' : 'Review required'}</strong><small>{mapping.accountedLineCount} of {mapping.totalLineCount} lines · {result.sourceFingerprint}</small></div>
            <div><span>Mapping confidence</span><strong>{mapping.mappingConfidence.replaceAll('-', ' ')}</strong><small>{mapping.detectedHeadingCount} recognized section headings</small></div>
          </div>
          <div className="import-mapping-list"><h3>Mapped sections</h3>{mapping.sections.length ? mapping.sections.map((section, index) => <div key={`${section.name}-${index}`}><Check size={14}/><span><strong>{section.name}</strong><small>{section.sourceHeading || 'Fallback section'} · {section.lines.length} content lines</small></span></div>) : <p>No section headings were confidently recognized. The full extracted text remains preserved in Additional Information.</p>}</div>
          {result.warnings?.length > 0 && <div className="import-warning"><AlertTriangle size={17}/><div><strong>Verify before use</strong>{result.warnings.map((warning, index) => <p key={index}>{warning}</p>)}</div></div>}
          <div className="import-mode-grid">
            <button className="import-mode-card" disabled={!result.sourceText.trim()} onClick={() => onApply(result, 'editable')}><FileSearch size={22}/><span><strong>Open editable mapping</strong><small>{result.sourceText.trim() ? 'All extracted lines stay verbatim. Change templates, sections, fonts, and content.' : 'Editable mapping needs readable text or successful OCR.'}</small></span></button>
            <button className="import-mode-card source" disabled={!sourceVisualAvailable} onClick={() => onApply(result, 'source')}><ShieldCheck size={22}/><span><strong>Open source visual</strong><small>{sourceVisualAvailable ? 'View the captured PDF/image pages or safe DOCX-style preview.' : 'No source visual is available for this file type.'}</small></span></button>
          </div>
        </div>}

        {!result && <div className="modal-actions"><button className="secondary-button" onClick={onClose} disabled={busy}>Cancel</button><button className="primary-button" onClick={analyze} disabled={!file || busy}>{busy ? <LoaderCircle className="spin" size={17}/> : <FileSearch size={17}/>} {busy ? 'Analyzing…' : 'Analyze resume'}</button></div>}
      </div>
    </div>
  );
}
