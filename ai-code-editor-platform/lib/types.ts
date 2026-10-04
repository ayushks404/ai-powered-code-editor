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
