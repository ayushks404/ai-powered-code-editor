'use client';

import { DiffEditor } from '@monaco-editor/react';
import { Finding } from '@/lib/types';

interface DiffViewModalProps {
  finding: Finding | null;
  currentCode: string;
  language: string;
  onAccept: (finding: Finding) => void;
  onClose: () => void;
}

export default function DiffViewModal({
  finding,
  currentCode,
  language,
  onAccept,
  onClose,
}: DiffViewModalProps) {
  if (!finding || !finding.suggestedFix) return null;

  const originalSnippet =
    typeof finding.suggestedFix === 'object' && finding.suggestedFix.originalCode
      ? finding.suggestedFix.originalCode
      : currentCode;

  const modifiedSnippet =
    typeof finding.suggestedFix === 'object' && finding.suggestedFix.newCode
      ? finding.suggestedFix.newCode
      : typeof finding.suggestedFix === 'string'
      ? finding.suggestedFix
      : currentCode;

  const fixDescription =
    typeof finding.suggestedFix === 'object' ? finding.suggestedFix.description : undefined;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div
        className="flex flex-col w-full max-w-4xl h-[85vh] max-h-[700px] bg-[#1e1e1e] border border-[#3c3c3c] rounded-lg shadow-2xl overflow-hidden font-sans select-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-[#252526] border-b border-[#3c3c3c] shrink-0">
          <div className="flex items-center gap-3">
            <span
              className={`px-2 py-0.5 rounded text-[10px] uppercase font-mono font-medium border ${
                finding.severity === 'error'
                  ? 'bg-rose-950/70 text-rose-300 border-rose-800/60'
                  : finding.severity === 'warning'
                  ? 'bg-amber-950/70 text-amber-300 border-amber-800/60'
                  : 'bg-blue-950/70 text-blue-300 border-blue-800/60'
              }`}
            >
              {finding.severity}
            </span>
            <h3 className="font-semibold text-zinc-100 text-sm">{finding.title}</h3>
          </div>

          <button
            onClick={onClose}
            className="p-1 hover:bg-[#333] text-zinc-400 hover:text-zinc-200 rounded transition-colors"
            title="Close modal"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Finding Summary & Explanation */}
        <div className="px-5 py-3 bg-[#222223] border-b border-[#333] shrink-0 flex flex-col gap-1.5 text-xs">
          <p className="text-zinc-300 leading-relaxed">{finding.description}</p>
          {fixDescription && (
            <p className="text-blue-400 text-[11px] font-mono">
              💡 <span className="font-sans font-medium text-zinc-300">Proposed Fix: </span>
              {fixDescription}
            </p>
          )}
          <div className="text-[11px] text-zinc-500 font-mono">
            Target Lines: {finding.range.startLineNumber} – {finding.range.endLineNumber}
          </div>
        </div>

        {/* Side-by-Side Monaco Diff Editor */}
        <div className="flex-1 min-h-0 bg-[#1e1e1e] relative">
          <div className="absolute inset-0">
            <DiffEditor
              height="100%"
              language={language}
              original={originalSnippet}
              modified={modifiedSnippet}
              theme="vs-dark"
              options={{
                readOnly: true,
                renderSideBySide: true,
                automaticLayout: true,
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                fontSize: 13,
                fontFamily: 'var(--font-geist-mono), monospace',
                lineNumbers: 'on',
                renderIndicators: true,
                diffWordWrap: 'on',
              }}
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-5 py-3 bg-[#252526] border-t border-[#3c3c3c] shrink-0">
          <div className="text-xs text-zinc-400 font-mono">
            Original (Left) vs. Suggested Fix (Right)
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 rounded text-xs font-medium text-zinc-300 bg-[#323233] hover:bg-[#3c3c3c] border border-[#454545] transition-colors"
            >
              Reject / Dismiss
            </button>
            <button
              onClick={() => onAccept(finding)}
              className="px-4 py-1.5 rounded text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-500 transition-colors shadow-sm flex items-center gap-1.5"
            >
              <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
              <span>Accept Fix</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
