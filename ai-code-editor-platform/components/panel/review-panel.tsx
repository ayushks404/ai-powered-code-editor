'use client';

import { Finding, ReviewState } from '@/lib/types';
import FindingItem from './finding-item';

interface ReviewPanelProps {
  findings: Finding[];
  reviewState: ReviewState;
  onRunReview: () => void;
  onSelectFinding?: (finding: Finding) => void;
  onViewFix?: (finding: Finding) => void;
}

export default function ReviewPanel({
  findings,
  reviewState,
  onRunReview,
  onSelectFinding,
  onViewFix,
}: ReviewPanelProps) {
  const isAnalyzing = reviewState === 'analyzing';

  return (
    <div className="flex flex-col h-full bg-[#1e1e1e] text-xs font-sans">
      {/* Header Action Bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#252526] border-b border-[#3c3c3c] shrink-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-zinc-200">AI Code Review</span>
          {findings.length > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-blue-900/60 text-blue-300 font-mono text-[10px]">
              {findings.length} {findings.length === 1 ? 'issue' : 'issues'}
            </span>
          )}
        </div>

        <button
          onClick={onRunReview}
          disabled={isAnalyzing}
          className={`px-3 py-1.5 rounded font-medium text-xs flex items-center gap-1.5 transition-colors ${
            isAnalyzing
              ? 'bg-blue-800/50 text-blue-300 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-500 text-white shadow-sm'
          }`}
        >
          {isAnalyzing ? (
            <>
              <svg className="w-3.5 h-3.5 animate-spin text-blue-300" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span>Analyzing...</span>
            </>
          ) : (
            <>
              <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Run AI Review</span>
            </>
          )}
        </button>
      </div>

      {/* Findings Content / Empty State */}
      <div className="flex-1 overflow-y-auto p-4">
        {findings.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-6 border border-dashed border-[#333] rounded-lg bg-[#222223]">
            <div className="w-12 h-12 rounded-full bg-[#2a2d2e] flex items-center justify-center text-zinc-400 mb-3 border border-[#3c3c3c]">
              <svg className="w-6 h-6 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-zinc-200 font-medium text-sm mb-1">No Review Findings</h3>
            <p className="text-zinc-400 text-xs leading-relaxed max-w-xs mb-4">
              Select a code range or click <span className="text-blue-400 font-medium">"Run AI Review"</span> to analyze code for potential bugs, security risks, and optimization opportunities.
            </p>
            <div className="flex flex-col gap-1.5 text-left text-[11px] text-zinc-500 bg-[#1e1e1e] p-3 rounded border border-[#333] w-full">
              <div className="text-zinc-400 font-medium mb-0.5">What AI Review analyzes:</div>
              <div>• Syntax errors & edge cases</div>
              <div>• Performance optimizations</div>
              <div>• Security vulnerabilities & best practices</div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {findings.map((finding) => (
              <FindingItem
                key={finding.id}
                finding={finding}
                onSelect={onSelectFinding}
                onViewFix={onViewFix}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
