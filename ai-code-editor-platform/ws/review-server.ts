import { WebSocket } from 'ws';
import Anthropic from '@anthropic-ai/sdk';
import { WSClientMessage, WSServerMessage, Finding } from '../lib/types';

function getApiKey(): string {
  const rawKey =
    process.env.ANTHROPIC_API_KEY ||
    process.env.LLMSRELAY_API_KEY ||
    process.env.COMETAPI_KEY ||
    '';
  return rawKey.trim().replace(/^['"]|['"]$/g, '');
}

function getBaseUrl(): string {
  const rawBaseURL = process.env.ANTHROPIC_BASE_URL || 'https://api.llmsrelay.com';
  return rawBaseURL.trim().replace(/^['"]|['"]$/g, '').replace(/\/+$/, '');
}

const REVIEW_SYSTEM_PROMPT = `You are an expert AI code reviewer. Given a code snippet, analyze it for potential bugs, security vulnerabilities, performance bottlenecks, and style/best-practice violations.

For EACH issue found, output EXACTLY ONE LINE of JSON (JSONL format — one JSON object per line, nothing else).

Each JSON object MUST match this exact shape:
{"severity":"info"|"warning"|"error","title":"Short summary","description":"Clear explanation of the problem","startLine":1,"startColumn":1,"endLine":1,"endColumn":10,"suggestedFix":{"originalCode":"exact snippet to replace","newCode":"corrected code","description":"explanation of fix"}}

Rules:
1. startLine and endLine must be 1-indexed relative to the snippet provided.
2. Output NOTHING but these single-line JSON objects — no preamble, no markdown code blocks (\`\`\`), and no conversational text.
3. If no issues are found, output nothing.`;

function send(ws: WebSocket, message: WSServerMessage) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(message));
  }
}

/**
 * Handles incoming WebSocket connections for AI Code Review.
 * Uses Anthropic SDK streaming with direct HTTP fetch fallback for LLMsRelay compatibility.
 */
export function handleReviewConnection(ws: WebSocket) {
  console.log('[WebSocket] Client connected to /ws/review');

  ws.on('message', async (raw) => {
    let msg: WSClientMessage;
    try {
      msg = JSON.parse(raw.toString());
    } catch {
      send(ws, { type: 'error', message: 'Invalid JSON message payload received' });
      return;
    }

    if (msg.type !== 'review') {
      return;
    }

    console.log(`[WebSocket] Starting code review for language: ${msg.language || 'typescript'}`);

    const apiKey = getApiKey();
    const baseURL = getBaseUrl();
    const modelName = process.env.ANTHROPIC_MODEL || 'claude-opus-5-5';

    if (!apiKey || apiKey === 'YOUR_SK_CS4_KEY' || apiKey === 'YOUR_ANTHROPIC_API_KEY') {
      console.warn('[WebSocket] Review skipped: ANTHROPIC_API_KEY is not configured in .env.local');
      send(ws, {
        type: 'finding',
        finding: {
          id: `missing-key-${Date.now()}`,
          severity: 'info',
          title: 'ANTHROPIC_API_KEY not configured',
          description:
            'Please paste your LLMsRelay API key (sk-cs4-...) into ai-code-editor-platform/.env.local to enable live AI code review.',
          range: {
            startLineNumber: msg.range?.startLineNumber || 1,
            startColumn: 1,
            endLineNumber: msg.range?.endLineNumber || 1,
            endColumn: 1,
          },
        },
      });
      send(ws, {
        type: 'usage',
        usage: { inputTokens: 0, outputTokens: 0, source: 'review' },
      });
      send(ws, { type: 'done' });
      return;
    }

    const snippetStartLine = msg.range?.startLineNumber || 1;
    let findingCount = 0;

    try {
      // First attempt: Direct LLMsRelay HTTP call
      const endpoint = `${baseURL}/v1/messages`;
      console.log(`[WebSocket] Dispatching review to ${endpoint} with model: ${modelName}`);

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          model: modelName,
          max_tokens: 2048,
          stream: true,
          system: REVIEW_SYSTEM_PROMPT,
          messages: [
            {
              role: 'user',
              content: `Language: ${msg.language || 'typescript'}\n\nCode to review:\n${msg.code}`,
            },
          ],
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[WebSocket] LLMsRelay returned HTTP ${response.status}:`, errorText);
        throw new Error(`LLMsRelay Error (${response.status}): ${errorText}`);
      }

      if (!response.body) {
        throw new Error('Response body is empty');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let sseBuffer = '';
      let lineBuffer = '';
      let fullText = '';
      let inputTokens = Math.ceil(msg.code.length / 4);
      let outputTokens = 0;

      const processLine = (rawLine: string) => {
        const line = rawLine.trim();
        if (!line) return;
        const cleaned = line.replace(/^```jsonl?/, '').replace(/```$/, '').trim();
        if (!cleaned || cleaned.startsWith('//') || cleaned.startsWith('#')) return;

        try {
          const parsed = JSON.parse(cleaned);
          const finding: Finding = {
            id: `finding-${Date.now()}-${findingCount++}`,
            severity: parsed.severity || 'warning',
            title: parsed.title || 'Code Issue',
            description: parsed.description || '',
            range: {
              startLineNumber: snippetStartLine + (parsed.startLine ? parsed.startLine - 1 : 0),
              startColumn: parsed.startColumn || 1,
              endLineNumber: snippetStartLine + (parsed.endLine ? parsed.endLine - 1 : 0),
              endColumn: parsed.endColumn || 1,
            },
            suggestedFix: parsed.suggestedFix,
          };
          send(ws, { type: 'finding', finding });
        } catch {
          // Incomplete or non-JSON line ignored
        }
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        sseBuffer += decoder.decode(value, { stream: true });
        const sseLines = sseBuffer.split('\n');
        sseBuffer = sseLines.pop() || '';

        for (const line of sseLines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.slice(6).trim();
            if (!dataStr || dataStr === '[DONE]') continue;

            try {
              const sse = JSON.parse(dataStr);
              if (sse.type === 'content_block_delta' && sse.delta?.type === 'text_delta') {
                const text = sse.delta.text || '';
                fullText += text;
                lineBuffer += text;

                let newlineIdx: number;
                while ((newlineIdx = lineBuffer.indexOf('\n')) !== -1) {
                  const completedLine = lineBuffer.slice(0, newlineIdx);
                  lineBuffer = lineBuffer.slice(newlineIdx + 1);
                  processLine(completedLine);
                }
              } else if (sse.type === 'message_delta' && sse.usage?.output_tokens) {
                outputTokens = sse.usage.output_tokens;
              } else if (sse.type === 'message_start' && sse.message?.usage?.input_tokens) {
                inputTokens = sse.message.usage.input_tokens;
              }
            } catch {
              // Ignore partial SSE chunk parse error
            }
          }
        }
      }

      // Process any trailing line left in lineBuffer
      if (lineBuffer.trim()) {
        processLine(lineBuffer);
      }

      if (!outputTokens) {
        outputTokens = Math.ceil(fullText.length / 4);
      }

      send(ws, {
        type: 'usage',
        usage: { inputTokens, outputTokens, source: 'review' },
      });

      send(ws, { type: 'done' });
    } catch (err: unknown) {
      console.error('[WebSocket] Review Server Error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Review request failed';
      send(ws, { type: 'error', message: errorMessage });
      send(ws, { type: 'done' });
    }
  });

  ws.on('close', () => {
    console.log('[WebSocket] Client disconnected from /ws/review');
  });

  ws.on('error', (err) => {
    console.error('[WebSocket] Socket error:', err);
  });
}
