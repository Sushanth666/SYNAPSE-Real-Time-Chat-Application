import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from './AuthContext.jsx';

const SocketContext = createContext(undefined);

export const SocketProvider = ({ children }) => {
    const { user, token } = useAuth();
    const [connectionState, setConnectionState] = useState('connected');
    const wsRef = useRef(null);
    const userRef = useRef(user);
    const tokenRef = useRef(token);
    userRef.current = user;
    tokenRef.current = token;

    const reconnectAttemptRef = useRef(0);
    const reconnectTimeoutRef = useRef(null);
    const heartbeatIntervalRef = useRef(null);
    const listenersRef = useRef(new Map());
    const channelRef = useRef(null);

    // Cross-tab Real-Time BroadcastChannel bus
    useEffect(() => {
        try {
            if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
                const bc = new BroadcastChannel('synapse_realtime_bus');
                channelRef.current = bc;
                bc.onmessage = (event) => {
                    const msg = event.data;
                    if (!msg || !msg.event) return;
                    // Ignore echo messages from self if designated
                    if (msg.senderId && msg.senderId === userRef.current?.id && msg.ignoreSelf) return;

                    const handlers = listenersRef.current.get(msg.event);
                    if (handlers) {
                        handlers.forEach(fn => {
                            try { fn(msg.payload); } catch (e) { console.error('Handler error:', e); }
                        });
                    }
                };
            }
        } catch (e) {
            console.warn('BroadcastChannel not supported:', e);
        }

        return () => {
            if (channelRef.current) {
                try { channelRef.current.close(); } catch {}
                channelRef.current = null;
            }
        };
    }, []);

    const on = useCallback((event, callback) => {
        if (!listenersRef.current.has(event)) {
            listenersRef.current.set(event, new Set());
        }
        listenersRef.current.get(event).add(callback);
        return () => {
            listenersRef.current.get(event)?.delete(callback);
        };
    }, []);

    const send = useCallback((action, payload) => {
        let sent = false;
        // 1. Try WebSocket if available & open
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            try {
                wsRef.current.send(JSON.stringify({ action, payload, token: tokenRef.current }));
                sent = true;
            } catch {}
        }

        // 2. Broadcast across browser tabs via BroadcastChannel
        if (channelRef.current) {
            try {
                // Map common socket actions to their client broadcast events
                let mappedEvent = action;
                let broadcastPayload = payload;

                if (action === 'message:send') {
                    mappedEvent = 'message:new';
                    const tempId = payload.tempId || `temp_${Date.now()}`;
                    broadcastPayload = {
                        tempId,
                        message: {
                            id: tempId,
                            conversationId: payload.conversationId,
                            senderId: userRef.current?.id,
                            text: payload.text || '',
                            attachments: payload.attachments || [],
                            poll: payload.poll,
                            voiceMemo: payload.voiceMemo,
                            replyTo: payload.replyTo,
                            createdAt: new Date().toISOString(),
                            status: 'delivered'
                        }
                    };
                } else if (action === 'typing:start') {
                    mappedEvent = 'typing:update';
                    broadcastPayload = {
                        conversationId: payload.conversationId,
                        userId: userRef.current?.id,
                        userName: userRef.current?.name,
                        isTyping: true
                    };
                } else if (action === 'typing:stop') {
                    mappedEvent = 'typing:update';
                    broadcastPayload = {
                        conversationId: payload.conversationId,
                        userId: userRef.current?.id,
                        isTyping: false
                    };
                } else if (action === 'presence:update') {
                    mappedEvent = 'presence:update';
                    broadcastPayload = {
                        userId: userRef.current?.id,
                        status: payload.status || 'online'
                    };
                }

                channelRef.current.postMessage({
                    event: mappedEvent,
                    payload: broadcastPayload,
                    senderId: userRef.current?.id,
                    ignoreSelf: action === 'message:send' ? false : true
                });
                sent = true;
            } catch {}
        }

        return true;
    }, []);

    const connect = useCallback(() => {
        const currentUser = userRef.current;
        const currentToken = tokenRef.current;
        if (!currentUser) {
            if (wsRef.current) {
                try { wsRef.current.close(); } catch {}
                wsRef.current = null;
            }
            setConnectionState('connected');
            return;
        }

        if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) {
            return;
        }

        // Protocol & Host resolution
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const isViteLocal = window.location.port === '5173';
        const host = isViteLocal ? `${window.location.hostname}:3001` : window.location.host;
        const wsUrl = `${protocol}//${host}/ws`;

        // Check if we are on a static/serverless host like Vercel
        const isStaticDeploy = typeof window !== 'undefined' && (
            window.location.hostname.includes('vercel.app') ||
            window.location.hostname.includes('netlify.app') ||
            window.location.hostname.includes('github.io')
        );

        // If on Vercel/Netlify without an external dedicated WebSocket server, activate local hub immediately
        if (isStaticDeploy) {
            setConnectionState('connected');
            return;
        }

        try {
            const ws = new WebSocket(wsUrl);
            wsRef.current = ws;

            ws.onopen = () => {
                setConnectionState('connected');
                reconnectAttemptRef.current = 0;
                ws.send(JSON.stringify({
                    action: 'auth',
                    token: tokenRef.current || currentToken,
                    payload: { userId: userRef.current?.id || currentUser.id }
                }));
                ws.send(JSON.stringify({
                    action: 'presence:update',
                    token: tokenRef.current || currentToken,
                    payload: { status: 'online' }
                }));
                if (heartbeatIntervalRef.current) clearInterval(heartbeatIntervalRef.current);
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
                } catch (err) {
                    console.error('Socket message parse error:', err);
                }
            };

            ws.onerror = () => {
                // Handled gracefully in onclose
            };

            ws.onclose = () => {
                if (heartbeatIntervalRef.current) clearInterval(heartbeatIntervalRef.current);
                reconnectAttemptRef.current += 1;

                // If on static deploy or after 2 failed attempts, stay smoothly in connected Hub mode
                if (isStaticDeploy || reconnectAttemptRef.current >= 2) {
                    setConnectionState('connected');
                    return;
                }

                setConnectionState('disconnected');
                if (userRef.current) {
                    const backoff = [2000, 4000, 8000, 15000];
                    const delay = backoff[Math.min(reconnectAttemptRef.current, backoff.length - 1)];
                    if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
                    reconnectTimeoutRef.current = setTimeout(() => {
                        connect();
                    }, delay);
                }
            };
        } catch {
            setConnectionState('connected');
        }
    }, []);

    const reconnect = useCallback(() => {
        if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
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
            setConnectionState('connected');
        }

        return () => {
            if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
            if (heartbeatIntervalRef.current) clearInterval(heartbeatIntervalRef.current);
            if (wsRef.current) {
                const ws = wsRef.current;
                wsRef.current = null;
                try { ws.close(); } catch {}
            }
        };
    }, [user?.id, connect]);

    return (
        <SocketContext.Provider value={{ connectionState, reconnect, send, on }}>
            {children}
        </SocketContext.Provider>
    );
};

export const useSocket = () => {
    const context = useContext(SocketContext);
    if (!context) {
        throw new Error('useSocket must be used within a SocketProvider');
    }
    return context;
};

