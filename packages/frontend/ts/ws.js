"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useWebSocket = useWebSocket;
var react_1 = require("react");
function useWebSocket(ticker, onMessage) {
    var useRef = react_1.default.useRef;
    var useEffect = react_1.default.useEffect;
    var wsRef = useRef(null);
    var tickerRef = useRef(ticker);
    tickerRef.current = ticker;
    useEffect(function () {
        var _a, _b;
        var closed = false;
        function wsUrl() {
            var loc = window.location;
            var proto = loc.protocol === 'https:' ? 'wss:' : 'ws:';
            return "".concat(proto, "//localhost:3000/ws");
        }
        if (((_a = wsRef.current) === null || _a === void 0 ? void 0 : _a.readyState) === WebSocket.OPEN ||
            ((_b = wsRef.current) === null || _b === void 0 ? void 0 : _b.readyState) === WebSocket.OPEN) {
            return;
        }
        var ws = new WebSocket(wsUrl());
        wsRef.current = ws;
        ws.onopen = function () {
            if (tickerRef.current) {
                ws.send(JSON.stringify({ type: 'subscribe', ticker: tickerRef.current }));
            }
        };
        ws.onmessage = function (ev) {
            try {
                var msg = JSON.parse(ev.data);
                onMessage && onMessage(msg);
            }
            catch (_a) { }
        };
        ws.onclose = function () {
            wsRef.current = null;
            if (!closed) {
                setTimeout(function () {
                    // noop; reconnection is managed by component lifecycle when ticker changes or component re-mounts
                }, 1500);
            }
        };
        var pingTimer = setInterval(function () {
            try {
                ws.send(JSON.stringify({ type: 'ping' }));
            }
            catch (_a) { }
        }, 30000);
        return function () {
            closed = true;
            clearInterval(pingTimer);
            try {
                if (wsRef.current) {
                    if (tickerRef.current) {
                        wsRef.current.send(JSON.stringify({
                            type: 'unsubscribe',
                            ticker: tickerRef.current,
                        }));
                    }
                    wsRef.current.close();
                }
            }
            catch (_a) {
            }
            finally {
                wsRef.current = null;
            }
        };
    }, [ticker]);
    return wsRef;
}
