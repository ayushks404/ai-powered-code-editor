import type * as monaco from 'monaco-editor';
import { CodeRange, Finding, Severity } from './types';

/**
 * Converts our CodeRange (Monaco 1-indexed convention) to a monaco.Range object.
 * CodeRange deliberately uses Monaco's 1-indexed convention throughout so we never
 * need to convert at the editor boundary — avoids off-by-one bugs.
 */
export function toMonacoRange(
  range: CodeRange,
  monacoNS: typeof monaco
): monaco.Range {
  return new monacoNS.Range(
    range.startLineNumber,
    range.startColumn,
    range.endLineNumber,
    range.endColumn
  );
}

const SEVERITY_COLORS: Record<Severity, string> = {
  info: '#3b82f6',     // blue
  warning: '#f59e0b', // amber
  error: '#ef4444',   // red
};

/**
 * Creates a Monaco editor decoration for a given finding.
 * Applies inline underline styling, gutter margin icon, and overview ruler marker.
 * glyphMarginHoverMessage provides a tooltip with finding title + description on hover.
 */
export function findingToDecoration(
  finding: Finding,
  monacoNS: typeof monaco
): monaco.editor.IModelDeltaDecoration {
  return {
    range: toMonacoRange(finding.range, monacoNS),
    options: {
      isWholeLine: false,
      className: `finding-underline-${finding.severity}`,
      glyphMarginClassName: `finding-glyph-${finding.severity}`,
      glyphMarginHoverMessage: {
        value: `**${finding.title}**\n\n${finding.description}`,
      },
      overviewRuler: {
        color: SEVERITY_COLORS[finding.severity],
        position: 7, // monaco.editor.OverviewRulerLane.Full
      },
    },
  };
}

/**
 * Extracts the code string at a given CodeRange from the editor model.
 * Used when building the diff view: extracts current code at a finding's range
 * to show as the "original" side in the DiffEditor.
 */
export function extractCodeAtRange(
  model: monaco.editor.ITextModel,
  range: CodeRange,
  monacoNS: typeof monaco
): string {
  return model.getValueInRange(toMonacoRange(range, monacoNS));
}

/**
 * Applies a text edit to the editor at the precise range of a finding's suggested fix.
 * Uses editor.executeEdits() — Monaco's atomic edit API — so it's undoable and
 * correctly handles cases where the file changed since the suggestion was generated.
 */
export function applyFixToEditor(
  editor: monaco.editor.IStandaloneCodeEditor,
  range: CodeRange,
  newText: string,
  monacoNS: typeof monaco
): void {
  editor.executeEdits('ai-fix', [
    {
      range: toMonacoRange(range, monacoNS),
      text: newText,
      forceMoveMarkers: true,
    },
  ]);
  editor.focus();
}
