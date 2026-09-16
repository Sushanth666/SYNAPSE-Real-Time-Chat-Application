import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { Avatar } from '../common/Avatar.jsx';
import {
    X,
    ArrowRight,
    UserPlus,
    Users,
    Plus,
    Shield,
    Loader2,
    Check,
    Trash2,
    Mail,
    User as UserIcon,
    Briefcase,
    ArrowLeftRight
} from 'lucide-react';

export const SwitchUserModal = ({ isOpen, onClose }) => {
    const { user, allUsers, loginAsUser, register } = useAuth();
    const [isAdding, setIsAdding] = useState(false);
    const [newName, setNewName] = useState('');
    const [newEmail, setNewEmail] = useState('');
    const [newBio, setNewBio] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formError, setFormError] = useState(null);

    // Managed accounts saved by the user
    const [savedAccountIds, setSavedAccountIds] = useState(() => {
        try {
            const saved = localStorage.getItem('pulsechat_saved_accounts');
            return saved ? JSON.parse(saved) : [];
        } catch {
            return [];
        }
    });

    // Keep active user in saved list
    useEffect(() => {
        if (user && !savedAccountIds.includes(user.id)) {
            const updated = [...savedAccountIds, user.id];
            setSavedAccountIds(updated);
            localStorage.setItem('pulsechat_saved_accounts', JSON.stringify(updated));
        }
    }, [user]);

    // Close on ESC
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && isOpen) {
                handleClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen]);

    if (!isOpen || typeof document === 'undefined') {
        return null;
    }

    // Resolve user objects for all saved account IDs
    const managedUsers = [];
    if (user) {
        managedUsers.push(user);
    }
    savedAccountIds.forEach(id => {
        if (!user || id !== user.id) {
            const found = allUsers.find(u => u.id === id);
            if (found) {
                managedUsers.push(found);
            }
        }
    });

    const handleSwitch = async (userId) => {
        if (user && userId === user.id) return;
        await loginAsUser(userId);
        onClose();
        resetState();
    };

    const handleCreateAccount = async (e) => {
        e.preventDefault();
        if (!newName.trim() || !newEmail.trim()) {
            setFormError('Please provide both name and email.');
            return;
        }
        setFormError(null);
        setIsSubmitting(true);
        try {
            await register(newName.trim(), newEmail.trim(), undefined, newBio.trim() || 'Team Member');
            // Look up created user and save to managed accounts
            const newlyCreated = allUsers.find(u => u.email.toLowerCase() === newEmail.trim().toLowerCase());
            if (newlyCreated) {
                const next = Array.from(new Set([...savedAccountIds, newlyCreated.id]));
                setSavedAccountIds(next);
                localStorage.setItem('pulsechat_saved_accounts', JSON.stringify(next));
            }
            onClose();
            resetState();
        } catch (err) {
            setFormError(err.message || 'Failed to add account.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const removeManagedAccount = (e, id) => {
        e.stopPropagation();
        const next = savedAccountIds.filter(savedId => savedId !== id);
        setSavedAccountIds(next);
        localStorage.setItem('pulsechat_saved_accounts', JSON.stringify(next));
    };

    const resetState = () => {
        setIsAdding(false);
        setNewName('');
        setNewEmail('');
        setNewBio('');
        setFormError(null);
    };

    const handleClose = () => {
        onClose();
        resetState();
    };

    return createPortal(
        <div
            className="fixed inset-0 z-[999990] flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-md animate-fade-in"
            onClick={handleClose}
        >
            <div
                className="relative w-full max-w-md bg-white dark:bg-[#0f172a] border border-brand-500/30 rounded-3xl shadow-2xl shadow-brand-500/10 overflow-hidden flex flex-col max-h-[88vh] animate-modal-in"
                onClick={e => e.stopPropagation()}
            >
                {/* Ambient Decorative Glows */}
                <div className="absolute -top-16 -left-16 w-44 h-44 bg-brand-500/15 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -bottom-16 -right-16 w-44 h-44 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />

                {/* Header Bar with Synapse Logo */}
                <div className="relative z-10 px-5 sm:px-6 py-4 border-b border-slate-100 dark:border-slate-800/90 flex items-center justify-between flex-shrink-0 bg-white/70 dark:bg-[#0f172a]/70 backdrop-blur-md">
                    <div className="flex items-center gap-3">
                        {/* Synapse Logo Pill */}
                        <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-2xl bg-brand-500/10 dark:bg-brand-500/15 border border-brand-500/25 shadow-xs">
                            <img
                                src="/synapse-logo.png"
                                alt="Synapse"
                                className="w-6 h-6 rounded-lg object-cover ring-1 ring-brand-400/40 shadow-xs"
                            />
                            <span className="text-xs font-black tracking-tight text-brand-600 dark:text-brand-300">Synapse</span>
                        </div>

                        <div>
                            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                                <ArrowLeftRight className="w-3.5 h-3.5 text-brand-500" />
                                <span>{isAdding ? 'Add Account' : 'Switch Account'}</span>
                            </h2>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                {isAdding ? 'Register a new workspace profile' : 'Fast-switch between your active profiles'}
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={handleClose}
                        className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        title="Close (Esc)"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Content Area */}
                {!isAdding ? (
                    <div className="relative z-10 p-5 space-y-3.5 overflow-y-auto flex-1">
                        {/* Accounts List */}
                        <div className="space-y-2">
                            {managedUsers.map((u) => {
                                const isCurrent = user ? u.id === user.id : false;
                                return (
                                    <div
                                        key={u.id}
                                        onClick={() => handleSwitch(u.id)}
                                        className={`w-full flex items-center justify-between p-3.5 rounded-2xl transition-all cursor-pointer ${
                                            isCurrent
                                                ? 'bg-gradient-to-r from-brand-500/15 via-purple-500/10 to-indigo-500/15 border border-brand-500/40 shadow-xs ring-1 ring-brand-500/30'
                                                : 'bg-slate-50/70 hover:bg-slate-100/90 dark:bg-slate-900/60 dark:hover:bg-slate-800/80 border border-slate-200/80 dark:border-slate-800 hover:border-brand-500/40 group hover:scale-[1.01]'
                                        }`}
                                    >
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="relative">
                                                <Avatar src={u.avatar} name={u.name} size="md" status={u.status} />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="text-xs font-bold text-slate-900 dark:text-slate-100 group-hover:text-brand-600 dark:group-hover:text-brand-300 transition-colors flex items-center gap-2 truncate">
                                                    <span className="truncate">{u.name}</span>
                                                    {isCurrent && (
                                                        <span className="inline-flex items-center gap-1 text-[10px] bg-gradient-to-r from-brand-600 to-purple-600 text-white px-2 py-0.5 rounded-full font-bold shadow-xs">
                                                            <Check className="w-2.5 h-2.5" />
                                                            <span>Active</span>
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                                                    {u.bio || u.email}
                                                </div>
                                            </div>
                                        </div>

                                        {!isCurrent ? (
                                            <div className="flex items-center gap-2 flex-shrink-0">
                                                <button
                                                    type="button"
                                                    onClick={(e) => removeManagedAccount(e, u.id)}
                                                    className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors"
                                                    title="Remove from saved accounts"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-brand-500/10 group-hover:bg-brand-500 group-hover:text-white text-brand-600 dark:text-brand-300 text-[11px] font-bold transition-all shadow-xs">
                                                    <span>Switch</span>
                                                    <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                                                </span>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-1 text-xs font-semibold text-brand-600 dark:text-brand-400 flex-shrink-0">
                                                <Check className="w-4 h-4" />
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {/* Add Account Button */}
                        <div className="pt-2">
                            <button
                                type="button"
                                onClick={() => setIsAdding(true)}
                                className="w-full flex items-center justify-center gap-2 p-3.5 rounded-2xl border-2 border-dashed border-brand-400/40 hover:border-brand-500 bg-brand-50/40 dark:bg-brand-950/20 hover:bg-brand-500/10 text-brand-600 dark:text-brand-300 text-xs font-bold transition-all hover:shadow-sm active:scale-95"
                            >
                                <Plus className="w-4 h-4" />
                                <span>Add Another Account</span>
                            </button>
                        </div>
                    </div>
                ) : (
                    /* Inline Add Account Form */
                    <form onSubmit={handleCreateAccount} className="relative z-10 p-5 space-y-4 overflow-y-auto flex-1">
                        {formError && (
                            <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-300 text-xs flex items-center gap-2">
                                <Shield className="w-4 h-4 flex-shrink-0 text-rose-500" />
                                <span>{formError}</span>
                            </div>
                        )}

                        <div>
                            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                                Full Name *
                            </label>
                            <div className="relative">
                                <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                                <input
                                    type="text"
                                    required
                                    autoFocus
                                    placeholder="e.g. Maya Lin"
                                    value={newName}
                                    onChange={e => setNewName(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-900/90 text-slate-900 dark:text-slate-100 text-xs font-semibold focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30 transition-all"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                                Email Address *
                            </label>
                            <div className="relative">
                                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                                <input
                                    type="email"
                                    required
                                    placeholder="e.g. maya@example.com"
                                    value={newEmail}
                                    onChange={e => setNewEmail(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-900/90 text-slate-900 dark:text-slate-100 text-xs font-semibold focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30 transition-all"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                                Role / Bio (Optional)
                            </label>
                            <div className="relative">
                                <Briefcase className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                                <input
                                    type="text"
                                    placeholder="e.g. Senior Product Designer"
                                    value={newBio}
                                    onChange={e => setNewBio(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-900/90 text-slate-900 dark:text-slate-100 text-xs font-semibold focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30 transition-all"
                                />
                            </div>
                        </div>

                        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => {
                                    setIsAdding(false);
                                    setFormError(null);
                                }}
                                className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="px-4 py-2 rounded-xl bg-gradient-to-r from-brand-600 via-purple-600 to-indigo-600 hover:from-brand-500 hover:via-purple-500 hover:to-indigo-500 text-white text-xs font-bold shadow-md shadow-brand-500/25 transition-all flex items-center gap-1.5 disabled:opacity-50 active:scale-95"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                        <span>Adding...</span>
                                    </>
                                ) : (
                                    <>
                                        <UserPlus className="w-3.5 h-3.5" />
                                        <span>Create & Switch</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>,
        document.body
    );
};
