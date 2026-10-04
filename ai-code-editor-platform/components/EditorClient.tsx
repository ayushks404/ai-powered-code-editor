'use client';

import { useState, useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';
import type * as monaco from 'monaco-editor';
import { SUPPORTED_LANGUAGES, detectLanguageFromFilename } from '@/lib/languages';
import { Finding, ReviewState, TokenUsage, WSServerMessage } from '@/lib/types';
import { calculateCost } from '@/lib/pricing';
import { useReviewWebSocket } from '@/lib/use-websocket';
import AIPanel from '@/components/panel/ai-panel';
import DiffViewModal from '@/components/editor/diff-view-modal';

const CodeEditor = dynamic(() => import('@/components/editor/code-editor'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center bg-[#1e1e1e] text-zinc-400 text-sm font-mono">
      Loading Monaco Editor...
    </div>
  ),
});

export default function EditorClient() {
  const [filename, setFilename] = useState('sample.ts');
  const [selectedLanguage, setSelectedLanguage] = useState('typescript');
  const [isManualOverride, setIsManualOverride] = useState(false);
  const [code, setCode] = useState(SUPPORTED_LANGUAGES[0].sampleCode);

  // AIPanel States
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(false);
  const [findings, setFindings] = useState<Finding[]>([]);
  const [reviewState, setReviewState] = useState<ReviewState>('idle');
  const [activeDiffFinding, setActiveDiffFinding] = useState<Finding | null>(null);
  const [tokenUsage, setTokenUsage] = useState<TokenUsage>({
    inputTokens: 0,
    outputTokens: 0,
    totalCost: 0,
    completionCalls: 0,
    reviewCalls: 0,
  });

  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const reviewTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeLangOption =
    SUPPORTED_LANGUAGES.find((l) => l.id === selectedLanguage) || SUPPORTED_LANGUAGES[0];

  // WebSocket message handler
  const handleWSMessage = useCallback((msg: WSServerMessage) => {
    if (reviewTimeoutRef.current) {
      clearTimeout(reviewTimeoutRef.current);
      reviewTimeoutRef.current = null;
    }

    if (msg.type === 'finding') {
      setFindings((prev) => [...prev, msg.finding]);
    } else if (msg.type === 'usage') {
      const cost = calculateCost(msg.usage.inputTokens, msg.usage.outputTokens, 'review');
      setTokenUsage((prev) => ({
        ...prev,
        inputTokens: prev.inputTokens + msg.usage.inputTokens,
        outputTokens: prev.outputTokens + msg.usage.outputTokens,
        totalCost: prev.totalCost + cost,
        reviewCalls: prev.reviewCalls + 1,
      }));
    } else if (msg.type === 'done') {
      setReviewState('completed');
    } else if (msg.type === 'error') {
      setReviewState('error');
      console.error('[Review WebSocket] Error message received:', msg.message);
    }
  }, []);

  const { connected, sendReview } = useReviewWebSocket(handleWSMessage);

  const handleFilenameChange = (newFilename: string) => {
    setFilename(newFilename);
    const detected = detectLanguageFromFilename(newFilename);
    if (detected !== 'plaintext') {
      setSelectedLanguage(detected);
      setIsManualOverride(false);
      const langConfig = SUPPORTED_LANGUAGES.find((l) => l.id === detected);
      if (langConfig) {
        setCode(langConfig.sampleCode);
      }
    }
  };

  const handleLanguageSelect = (langId: string) => {
    setSelectedLanguage(langId);
    setIsManualOverride(true);
    const langConfig = SUPPORTED_LANGUAGES.find((l) => l.id === langId);
    if (langConfig) {
      const dotIdx = filename.lastIndexOf('.');
      if (dotIdx !== -1) {
        const baseName = filename.slice(0, dotIdx);
        setFilename(`${baseName}${langConfig.extensions[0]}`);
      } else {
        setFilename(langConfig.defaultFilename);
      }
      setCode(langConfig.sampleCode);
    }
  };

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleOpenLocalFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content !== undefined) {
        setCode(content);
        setFilename(file.name);
        const detected = detectLanguageFromFilename(file.name);
        if (detected !== 'plaintext') {
          setSelectedLanguage(detected);
          setIsManualOverride(false);
        }
        setFindings([]);
      }
    };
    reader.readAsText(file);
    // Reset input so same file can be reloaded if needed
    e.target.value = '';
  };

  const handleLoadSample = () => {
    if (activeLangOption) {
      setCode(activeLangOption.sampleCode);
    }
  };

  const handleRunReview = useCallback(() => {
    setReviewState('analyzing');
    setFindings([]);

    // Safety timeout: reset state after 15s if server doesn't respond
    if (reviewTimeoutRef.current) {
      clearTimeout(reviewTimeoutRef.current);
    }
    reviewTimeoutRef.current = setTimeout(() => {
      setReviewState((current) => (current === 'analyzing' ? 'idle' : current));
    }, 15000);

    // Check if user has an active text selection
    let reviewCode = code;
    let reviewRange = {
      startLineNumber: 1,
      startColumn: 1,
      endLineNumber: code.split('\n').length,
      endColumn: 1,
    };

    if (editorRef.current) {
      const selection = editorRef.current.getSelection();
      const model = editorRef.current.getModel();
      if (selection && model && !selection.isEmpty()) {
        const selectedText = model.getValueInRange(selection);
        if (selectedText.trim().length > 0) {
          reviewCode = selectedText;
          reviewRange = {
            startLineNumber: selection.startLineNumber,
            startColumn: selection.startColumn,
            endLineNumber: selection.endLineNumber,
            endColumn: selection.endColumn,
          };
        }
      }
    }

    sendReview({
      type: 'review',
      code: reviewCode,
      language: selectedLanguage,
      range: reviewRange,
    });
  }, [code, selectedLanguage, sendReview]);

  const handleSelectFinding = useCallback((finding: Finding) => {
    if (editorRef.current) {
      editorRef.current.revealLineInCenter(finding.range.startLineNumber);
      editorRef.current.setSelection({
        startLineNumber: finding.range.startLineNumber,
        startColumn: finding.range.startColumn,
        endLineNumber: finding.range.endLineNumber,
        endColumn: finding.range.endColumn,
      });
      editorRef.current.focus();
    }
  }, []);

  const handleViewFix = useCallback((finding: Finding) => {
    setActiveDiffFinding(finding);
  }, []);

  const handleAcceptFix = useCallback((finding: Finding) => {
    if (!editorRef.current || !finding.suggestedFix) return;

    const newText =
      typeof finding.suggestedFix === 'object'
        ? finding.suggestedFix.newCode
        : finding.suggestedFix;

    // Apply fix atomically via Monaco executeEdits API
    editorRef.current.executeEdits('ai-fix', [
      {
        range: {
          startLineNumber: finding.range.startLineNumber,
          startColumn: finding.range.startColumn,
          endLineNumber: finding.range.endLineNumber,
          endColumn: finding.range.endColumn,
        },
        text: newText,
        forceMoveMarkers: true,
      },
    ]);

    // Synchronize React code state
    const updatedValue = editorRef.current.getValue();
    setCode(updatedValue);

    // Remove resolved finding from state
    setFindings((prev) => prev.filter((f) => f.id !== finding.id));

    // Close diff view modal
    setActiveDiffFinding(null);
    editorRef.current.focus();
  }, []);

  const handleUsage = useCallback((inputTokens: number, outputTokens: number) => {
    const cost = calculateCost(inputTokens, outputTokens, 'completion');
    setTokenUsage((prev) => ({
      ...prev,
      inputTokens: prev.inputTokens + inputTokens,
      outputTokens: prev.outputTokens + outputTokens,
      totalCost: prev.totalCost + cost,
      completionCalls: prev.completionCalls + 1,
    }));
  }, []);

  // Compute current code snippet for active diff finding
  const getCurrentDiffCode = () => {
    if (!activeDiffFinding || !editorRef.current) return '';
    const model = editorRef.current.getModel();
    if (!model) return '';
    return model.getValueInRange({
      startLineNumber: activeDiffFinding.range.startLineNumber,
      startColumn: activeDiffFinding.range.startColumn,
      endLineNumber: activeDiffFinding.range.endLineNumber,
      endColumn: activeDiffFinding.range.endColumn,
    });
  };

  return (
    <div className="flex flex-col h-full bg-[#1e1e1e] text-zinc-200 font-sans select-none">
      {/* Top Header Toolbar */}
      <header className="flex flex-wrap items-center justify-between gap-3 px-4 py-2 bg-[#252526] border-b border-[#3c3c3c] text-xs shrink-0">
        {/* Left: Window Controls & Filename Input */}
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5">
            <span className="w-3 h-3 rounded-full bg-[#ff5f57] border border-[#e0443e]" />
            <span className="w-3 h-3 rounded-full bg-[#febc2e] border border-[#dba023]" />
            <span className="w-3 h-3 rounded-full bg-[#28c840] border border-[#1aab29]" />
          </div>

          <div className="flex items-center gap-2 bg-[#1e1e1e] border border-[#3c3c3c] rounded px-2.5 py-1 focus-within:border-blue-500 transition-colors">
            <svg className="w-3.5 h-3.5 text-zinc-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <input
              type="text"
              value={filename}
              onChange={(e) => handleFilenameChange(e.target.value)}
              className="bg-transparent border-none outline-none text-zinc-200 font-mono text-xs w-36 focus:w-48 transition-all"
              placeholder="e.g. sample.ts, main.py"
              title="Edit filename to auto-detect language extension"
            />
          </div>

          <span className="text-[11px] px-2 py-0.5 rounded bg-blue-950/60 text-blue-300 border border-blue-800/50 font-mono">
            {isManualOverride ? 'Manual Selection' : 'Auto-Detected'}
          </span>
        </div>

        {/* Right: Quick Language Switches, Selector & Panel Toggle */}
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1 bg-[#1e1e1e] p-1 rounded border border-[#3c3c3c]">
            {SUPPORTED_LANGUAGES.slice(0, 4).map((lang) => (
              <button
                key={lang.id}
                onClick={() => handleLanguageSelect(lang.id)}
                className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                  selectedLanguage === lang.id
                    ? 'bg-blue-600 text-white'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-[#2a2d2e]'
                }`}
              >
                {lang.name}
              </button>
            ))}
          </div>

          <select
            value={selectedLanguage}
            onChange={(e) => handleLanguageSelect(e.target.value)}
            className="bg-[#1e1e1e] border border-[#3c3c3c] text-zinc-200 rounded px-2.5 py-1 text-xs outline-none focus:border-blue-500 cursor-pointer font-mono"
          >
            {SUPPORTED_LANGUAGES.map((lang) => (
              <option key={lang.id} value={lang.id}>
                {lang.name} ({lang.extensions.join(', ')})
              </option>
            ))}
          </select>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleOpenLocalFile}
            className="hidden"
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-2.5 py-1 bg-[#323233] hover:bg-[#3c3c3c] text-zinc-300 border border-[#454545] rounded transition-colors text-xs flex items-center gap-1.5"
            title="Open and review a file from your computer"
          >
            <svg className="w-3.5 h-3.5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            Open File
          </button>

          <button
            onClick={handleLoadSample}
            className="px-2.5 py-1 bg-[#323233] hover:bg-[#3c3c3c] text-zinc-300 border border-[#454545] rounded transition-colors text-xs flex items-center gap-1.5"
            title="Reload sample code for the current language"
          >
            <svg className="w-3 h-3 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Sample
          </button>

          <button
            onClick={() => setIsPanelCollapsed(!isPanelCollapsed)}
            className={`px-2.5 py-1 border rounded transition-colors text-xs flex items-center gap-1.5 ${
              !isPanelCollapsed
                ? 'bg-blue-950/80 text-blue-300 border-blue-800'
                : 'bg-[#323233] text-zinc-300 border-[#454545] hover:bg-[#3c3c3c]'
            }`}
            title="Toggle AI Side Panel"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
            <span>{isPanelCollapsed ? 'Show Panel' : 'Panel'}</span>
          </button>
        </div>
      </header>

      {/* Main Two-Pane Container */}
      <div className="flex-1 flex min-h-0 overflow-hidden relative">
        {/* Left Pane: Monaco Editor */}
        <div className="flex-1 min-w-0 h-full relative">
          <CodeEditor
            language={selectedLanguage}
            value={code}
            findings={findings}
            editorRef={editorRef}
            onChange={(val) => setCode(val ?? '')}
            onUsage={handleUsage}
          />
        </div>

        {/* Right Pane: AI Panel (Review & Usage tabs) */}
        <AIPanel
          findings={findings}
          reviewState={reviewState}
          tokenUsage={tokenUsage}
          onRunReview={handleRunReview}
          onSelectFinding={handleSelectFinding}
          onViewFix={handleViewFix}
          isCollapsed={isPanelCollapsed}
          onToggleCollapse={() => setIsPanelCollapsed(!isPanelCollapsed)}
        />
      </div>

      {/* Footer / Status Bar */}
      <footer className="flex items-center justify-between px-3 h-6 bg-[#007acc] text-white text-[11px] font-mono shrink-0 select-none">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            <span className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-emerald-400' : 'bg-amber-400'}`} />
            {connected ? 'WebSocket Connected' : 'Connecting WS...'}
          </span>
          <span>File: {filename}</span>
        </div>
        <div className="flex items-center gap-4">
          <span>Lang: {activeLangOption.name}</span>
          <span>UTF-8</span>
          <span>Spaces: 2</span>
        </div>
      </footer>

      {/* Diff View Modal (M5) */}
      {activeDiffFinding && (
        <DiffViewModal
          finding={activeDiffFinding}
          currentCode={getCurrentDiffCode()}
          language={selectedLanguage}
          onAccept={handleAcceptFix}
          onClose={() => setActiveDiffFinding(null)}
        />
      )}
    </div>
  );
}
