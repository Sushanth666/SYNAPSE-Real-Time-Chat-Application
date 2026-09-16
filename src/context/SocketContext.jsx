import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from './AuthContext.jsx';
const SocketContext = createContext(undefined);
export const SocketProvider = ({ children }) => {
    const { user, token } = useAuth();
    const [connectionState, setConnectionState] = useState('disconnected');
    const wsRef = useRef(null);
    const userRef = useRef(user);
    const tokenRef = useRef(token);
    userRef.current = user;
    tokenRef.current = token;

    const reconnectAttemptRef = useRef(0);
    const reconnectTimeoutRef = useRef(null);
    const heartbeatIntervalRef = useRef(null);
    const listenersRef = useRef(new Map());

    const on = useCallback((event, callback) => {
        if (!listenersRef.current.has(event)) {
            listenersRef.current.set(event, new Set());
        }
        listenersRef.current.get(event).add(callback);
        // Return cleanup function
        return () => {
            listenersRef.current.get(event)?.delete(callback);
        };
    }, []);

    const send = useCallback((action, payload) => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({ action, payload, token: tokenRef.current }));
            return true;
        }
        return false;
    }, []);

    const connect = useCallback(() => {
        const currentUser = userRef.current;
        const currentToken = tokenRef.current;
        if (!currentUser) {
            if (wsRef.current) {
                try { wsRef.current.close(); } catch {}
                wsRef.current = null;
            }
            setConnectionState('disconnected');
            return;
        }

        if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) {
            return;
        }

        setConnectionState('connecting');
        // Protocol & Host resolution
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = window.location.port === '5173'
            ? `${window.location.hostname}:3001`
            : window.location.host;
        const wsUrl = `${protocol}//${host}/ws`;

        try {
            const ws = new WebSocket(wsUrl);
            wsRef.current = ws;

            ws.onopen = () => {
                setConnectionState('connected');
                reconnectAttemptRef.current = 0;
                // Authenticate socket session
                ws.send(JSON.stringify({
                    action: 'auth',
                    token: tokenRef.current || currentToken,
                    payload: { userId: userRef.current?.id || currentUser.id }
                }));
                // Immediately confirm online presence on the server & network
                ws.send(JSON.stringify({
                    action: 'presence:update',
                    token: tokenRef.current || currentToken,
                    payload: { status: 'online' }
                }));
                // Setup ping heartbeat
                if (heartbeatIntervalRef.current)
                    clearInterval(heartbeatIntervalRef.current);
                heartbeatIntervalRef.current = setInterval(() => {
                    if (ws.readyState === WebSocket.OPEN) {
                        ws.send(JSON.stringify({ action: 'ping' }));
                    }
                }, 25000);
            };

            ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    const handlers = listenersRef.current.get(data.event);
                    if (handlers) {
                        handlers.forEach(fn => fn(data.payload));
                    }
                }
                catch (err) {
                    console.error('Socket message parse error:', err);
                }
            };

            ws.onerror = () => {
                // Handled by close event
            };

            ws.onclose = () => {
                setConnectionState('disconnected');
                if (heartbeatIntervalRef.current)
                    clearInterval(heartbeatIntervalRef.current);
                // Exponential backoff reconnect only if user still logged in
                if (userRef.current) {
                    // Start with a longer first delay (2s) so brief hiccups recover silently within the banner debounce window (5s)
                    const backoff = [2000, 4000, 8000, 15000, 30000];
                    const delay = backoff[Math.min(reconnectAttemptRef.current, backoff.length - 1)];
                    reconnectAttemptRef.current += 1;
                    if (reconnectTimeoutRef.current)
                        clearTimeout(reconnectTimeoutRef.current);
                    reconnectTimeoutRef.current = setTimeout(() => {
                        connect();
                    }, delay);
                }
            };
        }
        catch {
            setConnectionState('disconnected');
        }
    }, []);

    const reconnect = useCallback(() => {
        if (reconnectTimeoutRef.current)
            clearTimeout(reconnectTimeoutRef.current);
        reconnectAttemptRef.current = 0;
        if (wsRef.current) {
            const ws = wsRef.current;
            wsRef.current = null;
            try { ws.close(); } catch {}
        }
        connect();
    }, [connect]);

    useEffect(() => {
        if (user?.id) {
            connect();
        } else {
            if (wsRef.current) {
                try { wsRef.current.close(); } catch {}
                wsRef.current = null;
            }
            setConnectionState('disconnected');
        }

        return () => {
            if (reconnectTimeoutRef.current)
                clearTimeout(reconnectTimeoutRef.current);
            if (heartbeatIntervalRef.current)
                clearInterval(heartbeatIntervalRef.current);
            if (wsRef.current) {
                const ws = wsRef.current;
                wsRef.current = null;
                try { ws.close(); } catch {}
            }
        };
    }, [user?.id, connect]);
    return (<SocketContext.Provider value={{ connectionState, reconnect, send, on }}>
      {children}
    </SocketContext.Provider>);
};
export const useSocket = () => {
    const context = useContext(SocketContext);
    if (!context) {
        throw new Error('useSocket must be used within a SocketProvider');
    }
    return context;
};
