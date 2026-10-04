import { WebSocket } from 'ws';
import { WSClientMessage, WSServerMessage, Finding } from '../lib/types';

function send(ws: WebSocket, message: WSServerMessage) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(message));
  }
}

/**
 * Handles incoming WebSocket connections for AI Code Review.
 * In Milestone 3, this implements a STUB echo handler to verify
 * end-to-end WebSocket roundtrip communication before Milestone 4 (Anthropic AI streaming).
 */
export function handleReviewConnection(ws: WebSocket) {
  console.log('[WebSocket] Client connected to /ws/review');

  ws.on('message', async (raw) => {
    let msg: WSClientMessage;
    try {
      msg = JSON.parse(raw.toString());
    } catch {
      send(ws, { type: 'error', message: 'Invalid JSON payload received' });
      return;
    }

    if (msg.type !== 'review') {
      return;
    }

    console.log(`[WebSocket] Received review request for language: ${msg.language}`);

    // Milestone 3 STUB: Simulate streaming response with hardcoded finding
    try {
      // 1. Send hardcoded finding
      const stubFinding: Finding = {
        id: `stub-finding-${Date.now()}`,
        severity: 'warning',
        title: 'Stub: Unhandled promise rejection / error checking',
        description:
          'This is a verified test finding streamed over WebSocket from ws/review-server.ts.',
        range: msg.range || {
          startLineNumber: 1,
          startColumn: 1,
          endLineNumber: 2,
          endColumn: 20,
        },
        suggestedFix: {
          originalCode: msg.code.slice(0, 50),
          newCode: `// Fixed with error handling\ntry {\n  ${msg.code.slice(0, 40)}\n} catch (e) {\n  console.error(e);\n}`,
          description: 'Wrap operations in try/catch block.',
        },
      };

      // Slight delay to simulate network latency
      await new Promise((resolve) => setTimeout(resolve, 300));
      send(ws, { type: 'finding', finding: stubFinding });

      // 2. Send token usage
      await new Promise((resolve) => setTimeout(resolve, 150));
      send(ws, {
        type: 'usage',
        usage: {
          inputTokens: 120,
          outputTokens: 45,
          source: 'review',
        },
      });

      // 3. Send done signal
      await new Promise((resolve) => setTimeout(resolve, 100));
      send(ws, { type: 'done' });
    } catch (err) {
      console.error('[WebSocket] Error in review handler:', err);
      send(ws, { type: 'error', message: 'Failed to process code review' });
    }
  });

  ws.on('close', () => {
    console.log('[WebSocket] Client disconnected from /ws/review');
  });

  ws.on('error', (err) => {
    console.error('[WebSocket] Connection error:', err);
  });
}
