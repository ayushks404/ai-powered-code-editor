'use client';

import { useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { SUPPORTED_LANGUAGES, detectLanguageFromFilename } from '@/lib/languages';
import { Finding, ReviewState, TokenUsage } from '@/lib/types';
import { calculateCost } from '@/lib/pricing';
import AIPanel from '@/components/panel/ai-panel';

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
  const [tokenUsage, setTokenUsage] = useState<TokenUsage>({
    inputTokens: 0,
    outputTokens: 0,
    totalCost: 0,
    completionCalls: 0,
    reviewCalls: 0,
  });

  const activeLangOption = SUPPORTED_LANGUAGES.find((l) => l.id === selectedLanguage) || SUPPORTED_LANGUAGES[0];

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

  const handleLoadSample = () => {
    if (activeLangOption) {
      setCode(activeLangOption.sampleCode);
    }
  };

  const handleRunReview = () => {
    setReviewState('analyzing');
    setTimeout(() => {
      setReviewState('idle');
    }, 1200);
  };

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
          isCollapsed={isPanelCollapsed}
          onToggleCollapse={() => setIsPanelCollapsed(!isPanelCollapsed)}
        />
      </div>

      {/* Footer / Status Bar */}
      <footer className="flex items-center justify-between px-3 h-6 bg-[#007acc] text-white text-[11px] font-mono shrink-0 select-none">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            Monaco Ready
          </span>
          <span>File: {filename}</span>
        </div>
        <div className="flex items-center gap-4">
          <span>Lang: {activeLangOption.name}</span>
          <span>UTF-8</span>
          <span>Spaces: 2</span>
        </div>
      </footer>
    </div>
  );
}
