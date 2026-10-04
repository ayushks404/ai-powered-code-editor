'use client';

import { useRef, useCallback, useEffect, useState } from 'react';
import { WSClientMessage, WSServerMessage } from './types';

export function useReviewWebSocket(onMessage: (msg: WSServerMessage) => void) {
  const wsRef = useRef<WebSocket | null>(null);
  const onMessageRef = useRef(onMessage);
  const [connected, setConnected] = useState(false);

  // Keep latest callback ref to avoid reconnecting when callback changes
  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/review`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log('[useReviewWebSocket] Connected to /ws/review');
      setConnected(true);
    };

    ws.onclose = () => {
      console.log('[useReviewWebSocket] Disconnected from /ws/review');
      setConnected(false);
    };

    ws.onerror = (error) => {
      console.error('[useReviewWebSocket] WebSocket error:', error);
    };

    ws.onmessage = (event) => {
      try {
        const msg: WSServerMessage = JSON.parse(event.data);
        onMessageRef.current(msg);
      } catch {
        // ignore malformed messages
      }
    };

    wsRef.current = ws;

    return () => {
      ws.close();
    };
  }, []);

  const sendReview = useCallback((message: WSClientMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    } else {
      console.warn('[useReviewWebSocket] Cannot send message: WebSocket is not open');
    }
  }, []);

  return { connected, sendReview };
}
