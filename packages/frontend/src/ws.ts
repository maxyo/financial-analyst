import React from 'react';

export function useWebSocket(ticker: string, onMessage?: (msg: any) => void) {
  const useRef = React.useRef;
  const useEffect = React.useEffect;

  const wsRef = useRef<WebSocket | null>(null) as React.MutableRefObject<WebSocket | null>;
  const tickerRef = useRef(ticker);
  tickerRef.current = ticker;

  useEffect(() => {
    let closed = false;
    function wsUrl() {
      const loc = window.location;
      const proto = loc.protocol === 'https:' ? 'wss:' : 'ws:';
      return `${proto}//localhost:3000/ws`;
    }

    if (
      wsRef.current?.readyState === WebSocket.OPEN ||
      wsRef.current?.readyState === WebSocket.OPEN
    ) {
      return;
    }
    const ws = new WebSocket(wsUrl());
    wsRef.current = ws;

    ws.onopen = () => {
      if (tickerRef.current) {
        ws.send(
          JSON.stringify({ type: 'subscribe', ticker: tickerRef.current }),
        );
      }
    };
    ws.onmessage = (ev) => {
      try {
        const msg = JSON.parse(ev.data);
        onMessage && onMessage(msg);
      } catch {}
    };
    ws.onclose = () => {
      wsRef.current = null;
      if (!closed) {
        setTimeout(() => {
          // noop; reconnection is managed by component lifecycle when ticker changes or component re-mounts
        }, 1500);
      }
    };

    const pingTimer = setInterval(() => {
      try {
        ws.send(JSON.stringify({ type: 'ping' }));
      } catch {}
    }, 30000);

    return () => {
      closed = true;
      clearInterval(pingTimer);
      try {
        if (wsRef.current) {
          if (tickerRef.current) {
            wsRef.current.send(
              JSON.stringify({
                type: 'unsubscribe',
                ticker: tickerRef.current,
              }),
            );
          }
          wsRef.current.close();
        }
      } catch {
      } finally {
        wsRef.current = null;
      }
    };
  }, [ticker]);

  return wsRef;
}
