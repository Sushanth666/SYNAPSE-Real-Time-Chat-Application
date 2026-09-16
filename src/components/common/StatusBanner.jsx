import React, { useState, useEffect, useRef } from 'react';
import { useSocket } from '../../context/SocketContext.jsx';
import { WifiOff, RefreshCw, X } from 'lucide-react';

export const StatusBanner = () => {
    const { connectionState, reconnect } = useSocket();
    const [showBanner, setShowBanner] = useState(false);
    const [dismissed, setDismissed] = useState(false);
    const [retryCount, setRetryCount] = useState(0);
    const timerRef = useRef(null);
    const prevStateRef = useRef(connectionState);

    useEffect(() => {
        const prev = prevStateRef.current;
        prevStateRef.current = connectionState;

        if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
        }

        if (connectionState === 'connected') {
            // Immediately hide and reset on success
            setShowBanner(false);
            setDismissed(false);
            setRetryCount(0);
            return;
        }

        if (connectionState === 'connecting' && prev === 'connected') {
            // Transitioning from connected → connecting: likely a momentary blip
            // Give it 5 seconds to recover silently
            timerRef.current = setTimeout(() => {
                setShowBanner(true);
                setDismissed(false);
            }, 5000);
            return;
        }

        if (connectionState === 'disconnected') {
            if (prev === 'connecting') {
                // Failed to reconnect — count retry and show after brief delay
                setRetryCount(c => c + 1);
                timerRef.current = setTimeout(() => {
                    setShowBanner(true);
                }, 1500);
            } else if (prev === 'connected') {
                // Just dropped from connected — 5s grace before showing banner
                timerRef.current = setTimeout(() => {
                    setShowBanner(true);
                    setDismissed(false);
                }, 5000);
            }
        }

        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, [connectionState]);

    if (!showBanner || dismissed || connectionState === 'connected') return null;

    const isRetrying = connectionState === 'connecting';

    return (
      <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-[100] px-4 py-2 rounded-2xl shadow-2xl backdrop-blur-xl transition-all duration-300 flex items-center gap-3 border text-xs font-semibold animate-in fade-in slide-in-from-top-3 max-w-lg pointer-events-auto ${
        isRetrying
          ? 'bg-amber-950/90 border-amber-500/40 text-amber-200'
          : 'bg-rose-950/90 border-rose-500/40 text-rose-200'
      }`}>
        <div className="flex items-center gap-2">
          {isRetrying ? (
            <RefreshCw className="w-4 h-4 animate-spin text-amber-400 flex-shrink-0" />
          ) : (
            <WifiOff className="w-4 h-4 text-rose-400 flex-shrink-0" />
          )}
          <span className="text-xs">
            {isRetrying
              ? 'Reconnecting to real-time gateway...'
              : retryCount > 0
              ? `Connection lost · Reconnecting... (attempt ${retryCount})`
              : 'Disconnected from live chat server'}
          </span>
        </div>

        <div className="flex items-center gap-1.5 ml-auto flex-shrink-0">
          {!isRetrying && (
            <button
              type="button"
              onClick={() => { setRetryCount(0); reconnect(); }}
              className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white/15 hover:bg-white/25 active:scale-95 transition-all text-white text-[11px] font-bold shadow-xs"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Retry</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setDismissed(true)}
            className="p-1 rounded-lg text-white/60 hover:text-white transition-colors"
            title="Dismiss notification"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
};
