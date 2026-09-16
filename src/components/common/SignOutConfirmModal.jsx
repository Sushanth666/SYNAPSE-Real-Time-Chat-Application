import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { LogOut, X, ShieldAlert, Sparkles, Clock, LogIn } from 'lucide-react';

/**
 * SignOutConfirmModal
 * Reusable portal-based confirmation dialog for signing out.
 * When Sign Out is clicked, displays a warm 5-second greeting/farewell
 * screen with an animated countdown bar before redirecting to login.
 */
export const SignOutConfirmModal = ({ isOpen, onCancel, onConfirm }) => {
    const { user } = useAuth();
    const [isGreeting, setIsGreeting] = useState(false);
    const [countdown, setCountdown] = useState(5);

    // Reset greeting state when modal is closed/opened
    useEffect(() => {
        if (!isOpen) {
            setIsGreeting(false);
            setCountdown(5);
        }
    }, [isOpen]);

    // 5-second countdown timer when in greeting mode
    useEffect(() => {
        let intervalId;
        let timeoutId;

        if (isGreeting && isOpen) {
            setCountdown(5);

            intervalId = setInterval(() => {
                setCountdown((prev) => (prev > 1 ? prev - 1 : 0));
            }, 1000);

            timeoutId = setTimeout(() => {
                setIsGreeting(false);
                onConfirm();
            }, 5000);
        }

        return () => {
            if (intervalId) clearInterval(intervalId);
            if (timeoutId) clearTimeout(timeoutId);
        };
    }, [isGreeting, isOpen, onConfirm]);

    if (!isOpen || typeof document === 'undefined') return null;

    const getTimeGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'morning';
        if (hour < 17) return 'afternoon';
        return 'evening';
    };

    const handleStartSignOut = () => {
        setIsGreeting(true);
    };

    const handleSkipToLogin = () => {
        setIsGreeting(false);
        onConfirm();
    };

    const handleCancel = () => {
        setIsGreeting(false);
        setCountdown(5);
        onCancel();
    };

    return createPortal(
        <div
            className="fixed inset-0 z-[999999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in"
            onClick={isGreeting ? undefined : handleCancel}
        >
            <div
                className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 shadow-2xl border border-brand-500/30 overflow-hidden animate-modal-in"
                onClick={e => e.stopPropagation()}
            >
                {/* Ambient glow orbs */}
                <div className="absolute -top-20 -left-20 w-48 h-48 bg-brand-500/20 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -bottom-20 -right-20 w-44 h-44 bg-pink-500/15 rounded-full blur-3xl pointer-events-none" />

                {/* Close button (only visible when not in greeting countdown) */}
                {!isGreeting && (
                    <button
                        type="button"
                        onClick={handleCancel}
                        className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all z-10 cursor-pointer"
                        title="Cancel"
                    >
                        <X className="w-4 h-4" />
                    </button>
                )}

                {/* Header — Brand Logo */}
                <div className="relative z-10 flex flex-col items-center gap-3 mb-4">
                    <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 shadow-sm">
                        <img
                            src="/synapse-logo.png"
                            alt="Synapse"
                            className="w-7 h-7 rounded-xl object-cover shadow-md shadow-brand-500/20 ring-2 ring-brand-400/30"
                        />
                        <span className="text-sm font-black tracking-tight text-slate-900 dark:text-white">Synapse</span>
                    </div>

                    {/* Icon switch based on state */}
                    {isGreeting ? (
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-600 via-pink-500 to-amber-400 flex items-center justify-center text-white shadow-xl shadow-purple-500/40 ring-4 ring-purple-400/25 animate-pop">
                            <Sparkles className="w-8 h-8 text-amber-100 animate-glitter-sparkle" />
                        </div>
                    ) : (
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-600 via-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-brand-500/35 ring-4 ring-brand-500/20 animate-pop">
                            <ShieldAlert className="w-8 h-8" />
                        </div>
                    )}
                </div>

                {/* ─── STATE 1: GREETING & 5-SECOND REDIRECT ─── */}
                {isGreeting ? (
                    <div className="relative z-10 text-center animate-in fade-in zoom-in-95 duration-200">
                        <h3 className="text-xl font-black tracking-tight text-slate-900 dark:text-white mb-2">
                            Goodbye, {user?.name || 'Friend'}! 👋
                        </h3>

                        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
                            Thank you for collaborating on <span className="font-bold text-brand-600 dark:text-brand-400">Synapse</span>. Have a wonderful {getTimeGreeting()} ahead! ✨
                        </p>

                        {/* Live Countdown Badge */}
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/15 text-purple-600 dark:text-purple-300 font-bold text-xs border border-purple-500/30 mb-3 shadow-xs">
                            <Clock className="w-3.5 h-3.5 animate-spin-once" />
                            <span>Redirecting to login in {countdown}s...</span>
                        </div>

                        {/* 5-Second Animated Progress Bar */}
                        <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden mb-5 shadow-inner">
                            <div
                                className="h-full rounded-full bg-gradient-to-r from-purple-500 via-pink-500 to-amber-400"
                                style={{ animation: 'countdown-shrink 5s linear forwards' }}
                            />
                        </div>

                        {/* Skip Wait Action */}
                        <button
                            type="button"
                            onClick={handleSkipToLogin}
                            className="w-full py-2.5 px-4 rounded-2xl bg-gradient-to-r from-brand-600 via-purple-600 to-indigo-600 hover:from-brand-500 hover:via-purple-500 text-white font-semibold text-xs sm:text-sm shadow-md shadow-brand-500/30 transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
                        >
                            <LogIn className="w-4 h-4" />
                            <span>Go to Login Now</span>
                        </button>
                    </div>
                ) : (
                    /* ─── STATE 2: INITIAL SIGN OUT CONFIRMATION ─── */
                    <>
                        <div className="relative z-10 text-center mb-6">
                            <h3 className="text-lg font-black tracking-tight text-slate-900 dark:text-white mb-1.5">
                                Sign Out?
                            </h3>
                            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                                Are you sure you want to sign out of{' '}
                                <span className="font-semibold text-brand-600 dark:text-brand-400">Synapse</span>?
                                You'll need to sign in again to access your messages.
                            </p>
                        </div>

                        {/* Action buttons */}
                        <div className="relative z-10 flex items-center gap-3">
                            <button
                                type="button"
                                onClick={handleCancel}
                                className="flex-1 py-2.5 px-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-sm transition-all active:scale-95 cursor-pointer"
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                onClick={handleStartSignOut}
                                className="flex-1 py-2.5 px-4 rounded-2xl bg-gradient-to-r from-brand-600 via-purple-600 to-indigo-600 hover:from-brand-500 hover:via-purple-500 hover:to-indigo-500 text-white font-semibold text-sm shadow-md shadow-brand-500/30 transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                            >
                                <LogOut className="w-4 h-4" />
                                Sign Out
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>,
        document.body
    );
};
