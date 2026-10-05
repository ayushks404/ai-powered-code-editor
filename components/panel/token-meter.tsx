'use client';

import { TokenUsage } from '@/lib/types';

interface TokenMeterProps {
  usage: TokenUsage;
}

export default function TokenMeter({ usage }: TokenMeterProps) {
  const totalTokens = usage.inputTokens + usage.outputTokens;

  return (
    <div className="flex flex-col gap-4 p-4 text-xs font-sans text-zinc-300">
      {/* Total Cost Banner */}
      <div className="flex flex-col gap-1 p-3.5 bg-[#252526] border border-[#3c3c3c] rounded-lg shadow-sm">
        <div className="flex items-center justify-between text-zinc-400 text-[11px]">
          <span className="font-medium uppercase tracking-wider">Session Cost</span>
          <span className="px-1.5 py-0.5 rounded bg-emerald-950/70 text-emerald-400 border border-emerald-800/50 font-mono text-[10px]">
            Live Meter
          </span>
        </div>
        <div className="text-2xl font-bold font-mono text-emerald-400">
          ${usage.totalCost.toFixed(5)}
        </div>
        <div className="text-[11px] text-zinc-500">
          Calculated across OpenAI & Anthropic API calls
        </div>
      </div>

      {/* Token Metrics Cards */}
      <div className="grid grid-cols-2 gap-2.5">
        <div className="flex flex-col gap-1 p-3 bg-[#252526] border border-[#3c3c3c] rounded-md">
          <span className="text-zinc-400 text-[11px]">Input Tokens</span>
          <span className="text-sm font-semibold font-mono text-zinc-200">
            {usage.inputTokens.toLocaleString()}
          </span>
        </div>
        <div className="flex flex-col gap-1 p-3 bg-[#252526] border border-[#3c3c3c] rounded-md">
          <span className="text-zinc-400 text-[11px]">Output Tokens</span>
          <span className="text-sm font-semibold font-mono text-zinc-200">
            {usage.outputTokens.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Detailed Breakdown Table */}
      <div className="flex flex-col gap-2 bg-[#252526] border border-[#3c3c3c] rounded-md p-3">
        <span className="text-zinc-400 text-[11px] font-medium uppercase tracking-wider">
          Interaction Breakdown
        </span>

        <div className="flex items-center justify-between py-1.5 border-b border-[#333]">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            <span>Inline Completions</span>
          </div>
          <span className="font-mono text-zinc-400">{usage.completionCalls} calls</span>
        </div>

        <div className="flex items-center justify-between py-1.5 border-b border-[#333]">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-purple-500" />
            <span>Code Reviews</span>
          </div>
          <span className="font-mono text-zinc-400">{usage.reviewCalls} calls</span>
        </div>

        <div className="flex items-center justify-between pt-1">
          <span className="font-medium text-zinc-300">Total Tokens</span>
          <span className="font-mono font-semibold text-zinc-200">{totalTokens.toLocaleString()}</span>
        </div>
      </div>

      {/* Model Rates Footer */}
      <div className="p-3 bg-[#1e1e1e] border border-[#333] rounded-md text-[11px] text-zinc-500 flex flex-col gap-1">
        <div className="font-medium text-zinc-400">Rates Applied:</div>
        <div>• Inline Completions: gpt-4o-mini ($0.15 in / $0.60 out per 1M)</div>
        <div>• Code Review: claude-sonnet-4-6 ($3.00 in / $15.00 out per 1M)</div>
      </div>
    </div>
  );
}
