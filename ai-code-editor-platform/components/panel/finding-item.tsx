'use client';

import { Finding } from '@/lib/types';

interface FindingItemProps {
  finding: Finding;
  onSelect?: (finding: Finding) => void;
  onViewFix?: (finding: Finding) => void;
}

export default function FindingItem({
  finding,
  onSelect,
  onViewFix,
}: FindingItemProps) {
  const isError = finding.severity === 'error';
  const isWarning = finding.severity === 'warning';

  const severityBadge = isError
    ? 'bg-rose-950/70 text-rose-300 border-rose-800/60'
    : isWarning
    ? 'bg-amber-950/70 text-amber-300 border-amber-800/60'
    : 'bg-blue-950/70 text-blue-300 border-blue-800/60';

  const severityIcon = isError ? (
    <svg className="w-3.5 h-3.5 text-rose-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ) : isWarning ? (
    <svg className="w-3.5 h-3.5 text-amber-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  ) : (
    <svg className="w-3.5 h-3.5 text-blue-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );

  return (
    <div
      onClick={() => onSelect?.(finding)}
      className="flex flex-col gap-2 p-3 bg-[#252526] border border-[#3c3c3c] hover:border-zinc-500 rounded-md transition-all cursor-pointer group shadow-sm"
    >
      {/* Top Meta Line: Icon, Badge, Line Range */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          {severityIcon}
          <span className={`px-1.5 py-0.5 rounded text-[10px] uppercase font-mono font-medium border ${severityBadge}`}>
            {finding.severity}
          </span>
        </div>
        <span className="text-zinc-400 font-mono text-[11px]">
          Lines {finding.range.startLineNumber}–{finding.range.endLineNumber}
        </span>
      </div>

      {/* Finding Title */}
      <h4 className="font-medium text-zinc-200 text-xs group-hover:text-blue-400 transition-colors">
        {finding.title}
      </h4>

      {/* Description */}
      <p className="text-zinc-400 text-[11px] leading-normal line-clamp-3">
        {finding.description}
      </p>

      {/* Quick Fix Action */}
      {finding.suggestedFix && (
        <div className="flex items-center justify-end pt-1.5 border-t border-[#333]">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onViewFix?.(finding);
            }}
            className="px-2.5 py-1 rounded bg-[#323233] hover:bg-[#3c3c3c] text-blue-400 hover:text-blue-300 text-[11px] font-medium border border-[#444] transition-colors flex items-center gap-1 shadow-sm"
          >
            <span>View Fix</span>
            <svg className="w-3 h-3 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
