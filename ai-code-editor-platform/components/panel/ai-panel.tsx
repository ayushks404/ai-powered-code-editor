'use client';

import { useState } from 'react';
import { Finding, ReviewState, TokenUsage } from '@/lib/types';
import ReviewPanel from './review-panel';
import TokenMeter from './token-meter';

interface AIPanelProps {
  findings: Finding[];
  reviewState: ReviewState;
  tokenUsage: TokenUsage;
  onRunReview: () => void;
  onSelectFinding?: (finding: Finding) => void;
  onViewFix?: (finding: Finding) => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export default function AIPanel({
  findings,
  reviewState,
  tokenUsage,
  onRunReview,
  onSelectFinding,
  onViewFix,
  isCollapsed = false,
  onToggleCollapse,
}: AIPanelProps) {
  const [activeTab, setActiveTab] = useState<'review' | 'usage'>('review');

  if (isCollapsed) {
    return (
      <div className="flex flex-col items-center py-3 px-1 bg-[#252526] border-l border-[#3c3c3c] w-10 shrink-0 gap-4 text-zinc-400">
        <button
          onClick={onToggleCollapse}
          className="p-1.5 hover:bg-[#323233] hover:text-zinc-200 rounded transition-colors"
          title="Expand AI Panel"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
          </svg>
        </button>

        <div className="writing-mode-vertical text-[11px] font-mono tracking-widest text-zinc-400 uppercase py-4 flex items-center gap-2 select-none">
          <span>AI Assistant</span>
          {findings.length > 0 && (
            <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />
          )}
        </div>
      </div>
    );
  }

  return (
    <aside className="flex flex-col h-full bg-[#1e1e1e] border-l border-[#3c3c3c] w-80 sm:w-96 shrink-0 font-sans select-none shadow-lg">
      {/* Panel Header & Tab Switcher */}
      <div className="flex items-center justify-between bg-[#252526] border-b border-[#3c3c3c] px-2 h-10 shrink-0">
        <div className="flex items-center gap-1 h-full">
          <button
            onClick={() => setActiveTab('review')}
            className={`flex items-center gap-1.5 px-3 h-full border-b-2 text-xs font-medium transition-all ${
              activeTab === 'review'
                ? 'border-blue-500 text-zinc-100 bg-[#1e1e1e]'
                : 'border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-[#2a2d2e]'
            }`}
          >
            <svg className="w-3.5 h-3.5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 002-2h2a2 2 0 002 2m-6 9l2 2 4-4" />
            </svg>
            <span>Review</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
              findings.length > 0 ? 'bg-blue-600 text-white' : 'bg-[#333] text-zinc-400'
            }`}>
              {findings.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('usage')}
            className={`flex items-center gap-1.5 px-3 h-full border-b-2 text-xs font-medium transition-all ${
              activeTab === 'usage'
                ? 'border-emerald-500 text-zinc-100 bg-[#1e1e1e]'
                : 'border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-[#2a2d2e]'
            }`}
          >
            <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <span>Usage</span>
            <span className="px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-400 font-mono text-[10px]">
              ${tokenUsage.totalCost.toFixed(4)}
            </span>
          </button>
        </div>

        {/* Collapse Button */}
        {onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            className="p-1 hover:bg-[#333] text-zinc-400 hover:text-zinc-200 rounded transition-colors"
            title="Collapse AI Panel"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
            </svg>
          </button>
        )}
      </div>

      {/* Tab Body */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        {activeTab === 'review' ? (
          <ReviewPanel
            findings={findings}
            reviewState={reviewState}
            onRunReview={onRunReview}
            onSelectFinding={onSelectFinding}
            onViewFix={onViewFix}
          />
        ) : (
          <TokenMeter usage={tokenUsage} />
        )}
      </div>
    </aside>
  );
}
