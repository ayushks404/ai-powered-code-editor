'use client';

import { useRef, useEffect, useCallback } from 'react';
import Editor, { OnMount } from '@monaco-editor/react';
import type * as monaco from 'monaco-editor';

interface CodeEditorProps {
  language: string;
  value: string;
  onChange?: (value: string | undefined) => void;
  onUsage?: (inputTokens: number, outputTokens: number) => void;
  editorRef?: React.MutableRefObject<monaco.editor.IStandaloneCodeEditor | null>;
}

export default function CodeEditor({
  language,
  value,
  onChange,
  onUsage,
  editorRef,
}: CodeEditorProps) {
  const monacoRef = useRef<typeof monaco | null>(null);
  const internalEditorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const providerRef = useRef<monaco.IDisposable | null>(null);

  const registerProvider = useCallback(
    (monacoInstance: typeof monaco, lang: string) => {
      if (providerRef.current) {
        providerRef.current.dispose();
      }

      const provider: monaco.languages.InlineCompletionsProvider = {
        provideInlineCompletions: async (
          model: monaco.editor.ITextModel,
          position: monaco.Position,
          context: monaco.languages.InlineCompletionContext,
          token: monaco.CancellationToken
        ) => {
          return new Promise<monaco.languages.InlineCompletions>((resolve) => {
            // 1. Debounce: clear previous timer if user is typing
            if (debounceRef.current) {
              clearTimeout(debounceRef.current);
            }

            debounceRef.current = setTimeout(async () => {
              // 2. Cancellation: abort stale in-flight HTTP request
              if (abortRef.current) {
                abortRef.current.abort();
              }
              abortRef.current = new AbortController();

              // 3. Extract prefix & suffix context around cursor
              const prefix = model.getValueInRange({
                startLineNumber: 1,
                startColumn: 1,
                endLineNumber: position.lineNumber,
                endColumn: position.column,
              });

              const totalLines = model.getLineCount();
              const suffix = model.getValueInRange({
                startLineNumber: position.lineNumber,
                startColumn: position.column,
                endLineNumber: totalLines,
                endColumn: model.getLineMaxColumn(totalLines),
              });

              try {
                // 4. Fetch completion from route handler
                const response = await fetch('/api/complete', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ prefix, suffix, language: lang }),
                  signal: abortRef.current.signal,
                });

                const data = await response.json();

                // 5. Track token usage
                if (data.usage && (data.usage.inputTokens > 0 || data.usage.outputTokens > 0)) {
                  onUsage?.(data.usage.inputTokens, data.usage.outputTokens);
                }

                if (token.isCancellationRequested) {
                  resolve({ items: [] });
                  return;
                }

                // 6. Return inline completion item for Monaco ghost text
                resolve({
                  items: data.completion
                    ? [
                        {
                          insertText: data.completion,
                          range: {
                            startLineNumber: position.lineNumber,
                            startColumn: position.column,
                            endLineNumber: position.lineNumber,
                            endColumn: position.column,
                          },
                        },
                      ]
                    : [],
                });
              } catch {
                resolve({ items: [] });
              }
            }, 350);
          });
        },
        disposeInlineCompletions: () => {},
      };

      providerRef.current = monacoInstance.languages.registerInlineCompletionsProvider(
        lang,
        provider
      );
    },
    [onUsage]
  );

  const handleMount: OnMount = (editor, monacoInstance) => {
    internalEditorRef.current = editor;
    if (editorRef) {
      editorRef.current = editor;
    }
    monacoRef.current = monacoInstance;

    registerProvider(monacoInstance, language);
  };

  useEffect(() => {
    const monacoInstance = monacoRef.current;
    if (!monacoInstance) return;

    registerProvider(monacoInstance, language);

    return () => {
      if (providerRef.current) {
        providerRef.current.dispose();
      }
    };
  }, [language, registerProvider]);

  return (
    <Editor
      height="100%"
      language={language}
      value={value}
      onChange={onChange}
      onMount={handleMount}
      theme="vs-dark"
      options={{
        fontSize: 14,
        minimap: { enabled: true },
        lineNumbers: 'on',
        scrollBeyondLastLine: false,
        automaticLayout: true,
        padding: { top: 16, bottom: 16 },
        tabSize: 2,
        renderLineHighlight: 'all',
        fontFamily: 'var(--font-geist-mono), monospace',
        inlineSuggest: { enabled: true },
        quickSuggestions: { other: true, comments: true, strings: true },
      }}
    />
  );
}
