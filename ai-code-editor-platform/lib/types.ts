export type Severity = 'error' | 'warning' | 'info';

export interface CodeRange {
  startLineNumber: number;
  startColumn: number;
  endLineNumber: number;
  endColumn: number;
}

export interface Finding {
  id: string;
  title: string;
  description: string;
  severity: Severity;
  range: CodeRange;
  suggestedFix?: {
    originalCode: string;
    newCode: string;
    description: string;
  };
}

export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  totalCost: number;
  completionCalls: number;
  reviewCalls: number;
}

export type ReviewState = 'idle' | 'analyzing' | 'completed' | 'error';

export interface UsageInfo {
  inputTokens: number;
  outputTokens: number;
  source: 'completion' | 'review';
}

export type WSClientMessage =
  | { type: 'review'; code: string; range?: CodeRange; language: string };

export type WSServerMessage =
  | { type: 'finding'; finding: Finding }
  | { type: 'usage'; usage: UsageInfo }
  | { type: 'done' }
  | { type: 'error'; message: string };

