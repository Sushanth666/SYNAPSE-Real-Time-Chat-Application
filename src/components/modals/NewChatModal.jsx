import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { useChat } from '../../context/ChatContext.jsx';
import { Avatar } from '../common/Avatar.jsx';
import {
    X,
    Users,
    User,
    Search,
    Check,
    MessageSquare,
    Hash,
    FileText,
    Sparkles,
    Loader2,
    ArrowRight,
    UserPlus,
    AlertCircle
} from 'lucide-react';

export const NewChatModal = ({ isOpen, onClose }) => {
    const { user, allUsers } = useAuth();
    const { createConversation } = useChat();
    const [mode, setMode] = useState('direct');
    const [groupName, setGroupName] = useState('');
    const [groupDescription, setGroupDescription] = useState('');
    const [selectedUserIds, setSelectedUserIds] = useState([]);
    const [search, setSearch] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);

    // Close on ESC
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    // Reset inputs when modal opens or closes
    useEffect(() => {
        if (!isOpen) {
            setSelectedUserIds([]);
            setGroupName('');
            setGroupDescription('');
            setSearch('');
            setError(null);
            setMode('direct');
        }
    }, [isOpen]);

    if (!isOpen || !user || typeof document === 'undefined') {
        return null;
    }

    // Filter available contacts (exclude myself)
    const contacts = allUsers.filter(u => u.id !== user.id);
    const filteredContacts = contacts.filter(u =>
        u.name.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase())
    );

    const toggleSelect = (userId) => {
        if (mode === 'direct') {
            setSelectedUserIds([userId]);
        } else {
            setSelectedUserIds(prev =>
                prev.includes(userId)
                    ? prev.filter(id => id !== userId)
                    : [...prev, userId]
            );
        }
        setError(null);
    };

    const handleRemoveSelected = (e, userId) => {
        e.stopPropagation();
        setSelectedUserIds(prev => prev.filter(id => id !== userId));
    };

    const handleCreate = async () => {
        if (selectedUserIds.length === 0) {
            setError('Please select at least one contact to start a conversation.');
            return;
        }
        if (mode === 'group' && !groupName.trim()) {
            setError('Please provide a name for your group channel.');
            return;
        }

        setError(null);
        setSubmitting(true);
        try {
            const participants = [user.id, ...selectedUserIds];
            const name =
                mode === 'group'
                    ? groupName.trim()
                    : allUsers.find(u => u.id === selectedUserIds[0])?.name || 'Chat';
            await createConversation(
                mode,
                name,
                participants,
                undefined,
                mode === 'group' ? groupDescription.trim() : undefined
            );
            onClose();
        } catch (err) {
            setError(err.message || 'Failed to create conversation');
        } finally {
            setSubmitting(false);
        }
    };

    return createPortal(
        <div
            className="fixed inset-0 z-[999990] flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-md animate-fade-in"
            onClick={onClose}
        >
            <div
                className="relative w-full max-w-lg bg-white dark:bg-[#0f172a] border border-purple-500/30 dark:border-purple-500/35 rounded-3xl shadow-2xl shadow-purple-950/40 overflow-hidden flex flex-col max-h-[92vh] animate-modal-in"
                onClick={e => e.stopPropagation()}
            >
                {/* Ambient Decorative Radial Glows */}
                <div className="absolute -top-20 -left-20 w-56 h-56 bg-purple-500/15 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -bottom-20 -right-20 w-56 h-56 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />

                {/* Modal Header Bar with Synapse Brand Logo */}
                <div className="relative z-10 px-5 sm:px-6 py-4 border-b border-slate-100 dark:border-slate-800/90 flex items-center justify-between flex-shrink-0 bg-white/70 dark:bg-[#0f172a]/70 backdrop-blur-md">
                    <div className="flex items-center gap-3">
                        {/* Synapse Logo Pill */}
                        <div className="flex items-center gap-2 px-2.5 py-1 rounded-2xl bg-purple-500/10 dark:bg-purple-500/15 border border-purple-500/25 shadow-xs">
                            <img
                                src="/synapse-logo.png"
                                alt="Synapse"
                                className="w-5 h-5 rounded-lg object-cover ring-1 ring-purple-400/40 shadow-xs"
                            />
                            <span className="text-[11px] font-black tracking-tight text-purple-600 dark:text-purple-300">Synapse</span>
                        </div>

                        <div>
                            <h2 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                                {mode === 'direct' ? (
                                    <UserPlus className="w-4 h-4 text-purple-500" />
                                ) : (
                                    <Users className="w-4 h-4 text-purple-500" />
                                )}
                                <span>{mode === 'direct' ? 'New Direct Message' : 'Create Group Channel'}</span>
                            </h2>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                {mode === 'direct'
                                    ? 'Start an instant 1-on-1 private conversation'
                                    : 'Collaborate with multiple teammates in a shared channel'}
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={onClose}
                        className="p-2 rounded-2xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-all hover:scale-105 active:scale-95"
                        title="Close (Esc)"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Mode Switcher Segmented Control */}
                <div className="relative z-10 px-5 sm:px-6 pt-4 flex-shrink-0">
                    <div className="flex bg-slate-100 dark:bg-slate-900/90 p-1.5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 gap-1.5">
                        <button
                            type="button"
                            onClick={() => {
                                setMode('direct');
                                setSelectedUserIds([]);
                                setError(null);
                            }}
                            className={`flex-1 py-2 px-3 text-xs font-bold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 ${
                                mode === 'direct'
                                    ? 'bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 text-white shadow-md shadow-purple-600/30'
                                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-slate-800/60'
                            }`}
                        >
                            <User className="w-3.5 h-3.5" />
                            <span>Direct Chat</span>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                                mode === 'direct' ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                            }`}>
                                1-on-1
                            </span>
                        </button>

                        <button
                            type="button"
                            onClick={() => {
                                setMode('group');
                                setSelectedUserIds([]);
                                setError(null);
                            }}
                            className={`flex-1 py-2 px-3 text-xs font-bold rounded-xl transition-all duration-200 flex items-center justify-center gap-2 ${
                                mode === 'group'
                                    ? 'bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 text-white shadow-md shadow-purple-600/30'
                                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-slate-800/60'
                            }`}
                        >
                            <Users className="w-3.5 h-3.5" />
                            <span>Group Channel</span>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                                mode === 'group' ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                            }`}>
                                Team
                            </span>
                        </button>
                    </div>
                </div>

                {/* Group Channel Inputs (Only in group mode) */}
                {mode === 'group' && (
                    <div className="relative z-10 px-5 sm:px-6 pt-3 space-y-2.5 flex-shrink-0 animate-fade-in">
                        <div>
                            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                                <Hash className="w-3 h-3 text-purple-500" />
                                <span>Group Name *</span>
                            </label>
                            <input
                                type="text"
                                placeholder="e.g. ⚡ Engineering Core, 🎨 Design Sprint"
                                value={groupName}
                                onChange={e => setGroupName(e.target.value)}
                                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-700/80 rounded-2xl text-slate-900 dark:text-slate-100 placeholder-slate-400 text-xs font-medium focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                            />
                        </div>

                        <div>
                            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                                <FileText className="w-3 h-3 text-slate-400" />
                                <span>Channel Description (Optional)</span>
                            </label>
                            <input
                                type="text"
                                placeholder="What is this channel about?"
                                value={groupDescription}
                                onChange={e => setGroupDescription(e.target.value)}
                                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-700/80 rounded-2xl text-slate-900 dark:text-slate-100 placeholder-slate-400 text-xs font-medium focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                            />
                        </div>
                    </div>
                )}

                {/* Search Bar */}
                <div className="relative z-10 px-5 sm:px-6 pt-3 pb-1 flex-shrink-0">
                    <div className="relative flex items-center">
                        <Search className="w-4 h-4 text-purple-500 absolute left-3.5 pointer-events-none" />
                        <input
                            type="text"
                            placeholder="Search team members by name or email..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="w-full pl-9 pr-8 py-2.5 bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-700/80 rounded-2xl text-slate-900 dark:text-slate-100 placeholder-slate-400 text-xs font-medium focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                        />
                        {search && (
                            <button
                                onClick={() => setSearch('')}
                                className="absolute right-3 p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Selected Members Interactive Chips Tray */}
                {selectedUserIds.length > 0 && (
                    <div className="relative z-10 px-5 sm:px-6 py-2 flex items-center gap-1.5 overflow-x-auto no-scrollbar flex-shrink-0 animate-fade-in">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex-shrink-0 mr-1">
                            Selected:
                        </span>
                        {selectedUserIds.map(id => {
                            const u = allUsers.find(userObj => userObj.id === id);
                            if (!u) return null;
                            return (
                                <div
                                    key={id}
                                    className="flex items-center gap-1.5 pl-1.5 pr-2 py-1 rounded-full bg-purple-500/15 dark:bg-purple-500/20 border border-purple-500/30 text-purple-700 dark:text-purple-300 text-xs font-semibold flex-shrink-0 animate-scale-in"
                                >
                                    <Avatar src={u.avatar} name={u.name} size="xs" />
                                    <span className="max-w-[100px] truncate">{u.name}</span>
                                    <button
                                        type="button"
                                        onClick={(e) => handleRemoveSelected(e, id)}
                                        className="w-4 h-4 rounded-full bg-purple-500/20 hover:bg-purple-500/40 text-purple-700 dark:text-purple-300 flex items-center justify-center transition-colors"
                                        title={`Remove ${u.name}`}
                                    >
                                        <X className="w-2.5 h-2.5" />
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Contacts List */}
                <div className="relative z-10 flex-1 overflow-y-auto px-5 sm:px-6 py-2 space-y-1.5 min-h-[180px] custom-scrollbar">
                    {filteredContacts.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-10 text-center animate-fade-in">
                            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-500 mb-2">
                                <Search className="w-5 h-5" />
                            </div>
                            <p className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-0.5">
                                No team members found
                            </p>
                            <p className="text-[11px] text-slate-400 max-w-[200px]">
                                {search ? `No results matching "${search}"` : 'No other contacts are currently available.'}
                            </p>
                            {search && (
                                <button
                                    onClick={() => setSearch('')}
                                    className="mt-2 text-xs font-semibold text-purple-600 dark:text-purple-400 hover:underline"
                                >
                                    Clear search
                                </button>
                            )}
                        </div>
                    ) : (
                        filteredContacts.map(contact => {
                            const isSelected = selectedUserIds.includes(contact.id);
                            return (
                                <div
                                    key={contact.id}
                                    onClick={() => toggleSelect(contact.id)}
                                    className={`group flex items-center justify-between p-3 rounded-2xl cursor-pointer transition-all duration-150 ${
                                        isSelected
                                            ? 'bg-gradient-to-r from-purple-500/15 via-violet-500/10 to-indigo-500/15 dark:from-purple-900/25 dark:via-violet-900/20 dark:to-indigo-900/25 border border-purple-500/40 dark:border-purple-500/50 shadow-xs'
                                            : 'border border-transparent hover:border-slate-200 dark:hover:border-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-200'
                                    }`}
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="relative flex-shrink-0">
                                            <Avatar
                                                src={contact.avatar}
                                                name={contact.name}
                                                size="md"
                                                status={contact.status}
                                            />
                                        </div>
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                                                    {contact.name}
                                                </span>
                                                {contact.status === 'online' && (
                                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-semibold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                                                        Active
                                                    </span>
                                                )}
                                            </div>
                                            <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                                                {contact.email}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Selection Checkbox / Radio Pill */}
                                    <div
                                        className={`w-6 h-6 flex items-center justify-center transition-all duration-150 flex-shrink-0 ${
                                            mode === 'direct' ? 'rounded-full' : 'rounded-xl'
                                        } ${
                                            isSelected
                                                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 border border-purple-400 text-white shadow-sm shadow-purple-500/40 scale-105'
                                                : 'border border-slate-300 dark:border-slate-700 text-transparent group-hover:border-purple-400'
                                        }`}
                                    >
                                        <Check className="w-3.5 h-3.5 stroke-[2.75]" />
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Error Banner */}
                {error && (
                    <div className="relative z-10 px-5 sm:px-6 py-2 flex items-center gap-2 text-xs text-rose-500 bg-rose-500/10 border-t border-rose-500/20 font-medium">
                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                        <span>{error}</span>
                    </div>
                )}

                {/* Modal Footer */}
                <div className="relative z-10 px-5 sm:px-6 py-3.5 border-t border-slate-100 dark:border-slate-800/90 bg-slate-50/80 dark:bg-slate-900/60 backdrop-blur-sm flex items-center justify-between flex-shrink-0">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-purple-500/10 dark:bg-purple-500/15 border border-purple-500/25 text-purple-700 dark:text-purple-300 text-xs font-semibold">
                        <Sparkles className="w-3.5 h-3.5 text-purple-500" />
                        <span>
                            {selectedUserIds.length} {selectedUserIds.length === 1 ? 'member' : 'members'} selected
                        </span>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-xl hover:bg-slate-200/60 dark:hover:bg-slate-800/80 transition-all active:scale-95"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handleCreate}
                            disabled={submitting || selectedUserIds.length === 0}
                            className="px-5 py-2.5 text-xs font-bold bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 hover:from-purple-500 hover:via-violet-500 hover:to-indigo-500 text-white rounded-2xl shadow-lg shadow-purple-600/30 hover:shadow-purple-600/50 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-40 disabled:pointer-events-none flex items-center gap-2"
                        >
                            {submitting ? (
                                <>
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    <span>Creating...</span>
                                </>
                            ) : (
                                <>
                                    <span>{mode === 'direct' ? 'Start Chat' : 'Create Group'}</span>
                                    <ArrowRight className="w-3.5 h-3.5" />
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};
