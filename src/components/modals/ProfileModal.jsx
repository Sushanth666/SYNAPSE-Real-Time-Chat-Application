import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { useSocket } from '../../context/SocketContext.jsx';
import { useChat } from '../../context/ChatContext.jsx';
import { Avatar } from '../common/Avatar.jsx';
import {
    X,
    Camera,
    Check,
    Mail,
    User as UserIcon,
    Shield,
    Clock,
    Loader2,
    Copy,
    CheckCheck,
    UploadCloud,
    AlertCircle,
    LogOut,
    Sparkles,
    Settings,
    FileText
} from 'lucide-react';
import { SignOutConfirmModal } from '../common/SignOutConfirmModal.jsx';

export const ProfileModal = ({ isOpen, onClose }) => {
    const { user, updateProfile, logout } = useAuth();
    const { send } = useSocket();
    const { setIsExportModalOpen } = useChat();
    const fileInputRef = useRef(null);

    const [name, setName] = useState(user?.name || '');
    const [bio, setBio] = useState(user?.bio || '');
    const [avatar, setAvatar] = useState(user?.avatar || '');
    const [status, setStatus] = useState(user?.status || 'online');
    const [isSaving, setIsSaving] = useState(false);
    const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
    const [uploadError, setUploadError] = useState(null);
    const [isCopied, setIsCopied] = useState(false);
    const [savedSuccess, setSavedSuccess] = useState(false);
    const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);

    // Sync state when user changes or modal opens
    useEffect(() => {
        if (user && isOpen) {
            setName(user.name);
            setBio(user.bio || '');
            setAvatar(user.avatar || '');
            setStatus(user.status || 'online');
            setSavedSuccess(false);
            setUploadError(null);
        }
    }, [user, isOpen]);

    const handleConfirmSignOut = useCallback(() => {
        setShowSignOutConfirm(false);
        onClose();
        logout();
    }, [onClose, logout]);

    // Close on ESC
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && isOpen && !showSignOutConfirm) {
                onClose();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, showSignOutConfirm, onClose]);

    if (!isOpen || !user || typeof document === 'undefined') {
        return null;
    }

    const handleAvatarFileUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            setUploadError('Please select an image file (PNG, JPG, WebP, GIF)');
            return;
        }

        if (file.size > 20 * 1024 * 1024) {
            setUploadError('Image size should be under 20MB');
            return;
        }

        setUploadError(null);
        setIsUploadingAvatar(true);

        // 1. Immediate instant local preview via DataURL
        const reader = new FileReader();
        reader.onload = () => {
            if (typeof reader.result === 'string') {
                setAvatar(reader.result);
            }
        };
        reader.readAsDataURL(file);

        // 2. Upload to server to persist permanently
        try {
            const formData = new FormData();
            formData.append('file', file);

            const res = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            });

            if (res.ok) {
                const data = await res.json();
                if (data.url) {
                    setAvatar(data.url);
                }
            }
        } catch (err) {
            console.error('Failed to upload avatar image to backend:', err);
        } finally {
            setIsUploadingAvatar(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const handleCopyEmail = () => {
        navigator.clipboard.writeText(user.email);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        if (!name.trim()) return;
        setIsSaving(true);
        try {
            await updateProfile({
                name: name.trim(),
                bio: bio.trim(),
                avatar: (avatar && typeof avatar === 'string' && avatar.trim()) ? avatar.trim() : null,
                status
            });
            // Broadcast presence change via WebSocket
            send('presence:update', { status });
            setSavedSuccess(true);
            setTimeout(() => {
                setSavedSuccess(false);
                onClose();
            }, 850);
        } finally {
            setIsSaving(false);
        }
    };

    const statusOptions = [
        {
            value: 'online',
            label: 'Online',
            desc: 'Active & available to chat',
            color: 'bg-emerald-500',
            glowColor: 'shadow-emerald-500/30'
        },
        {
            value: 'away',
            label: 'Away',
            desc: 'Stepped away momentarily',
            color: 'bg-amber-500',
            glowColor: 'shadow-amber-500/30'
        },
        {
            value: 'busy',
            label: 'Busy / DND',
            desc: 'Notifications silenced',
            color: 'bg-rose-500',
            glowColor: 'shadow-rose-500/30'
        },
        {
            value: 'offline',
            label: 'Invisible',
            desc: 'Appear offline to others',
            color: 'bg-slate-400',
            glowColor: 'shadow-slate-400/30'
        }
    ];

    return createPortal(
        <div
            className="fixed inset-0 z-[999990] flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-md animate-fade-in"
            onClick={onClose}
        >
            <div
                className="relative w-full max-w-lg bg-white dark:bg-[#0f172a] border border-brand-500/30 rounded-3xl shadow-2xl shadow-brand-500/10 overflow-hidden flex flex-col max-h-[92vh] animate-modal-in"
                onClick={e => e.stopPropagation()}
            >
                {/* Ambient Decorative Glows */}
                <div className="absolute -top-20 -left-20 w-52 h-52 bg-brand-500/15 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -bottom-20 -right-20 w-52 h-52 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />

                {/* Modal Header Bar with Synapse Brand Logo */}
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
                                <Settings className="w-3.5 h-3.5 text-brand-500" />
                                <span>Profile & Settings</span>
                            </h2>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                Personalize your identity, avatar & presence
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        title="Close (Esc)"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Content Form */}
                <form onSubmit={handleSave} className="relative z-10 flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 sm:space-y-5">
                    {/* Hidden File Input for Avatar Upload */}
                    <input
                        type="file"
                        ref={fileInputRef}
                        accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
                        onChange={handleAvatarFileUpload}
                        className="hidden"
                    />

                    {/* Profile Hero Card with Brand Gradient Border */}
                    <div className="p-4 rounded-2xl bg-gradient-to-br from-brand-500/10 via-purple-500/5 to-indigo-500/10 border border-brand-500/25 shadow-xs flex flex-col sm:flex-row items-center sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3.5 min-w-0">
                            {/* Avatar with Camera Badge */}
                            <div className="relative group flex-shrink-0">
                                <div
                                    onClick={() => fileInputRef.current?.click()}
                                    className="w-16 h-16 sm:w-18 sm:h-18 rounded-full ring-3 ring-brand-500/40 shadow-lg shadow-brand-500/20 bg-slate-200 dark:bg-slate-800 flex items-center justify-center relative overflow-hidden cursor-pointer group hover:ring-brand-500/70 transition-all"
                                    title="Click to upload custom photo"
                                >
                                    <Avatar src={avatar} name={name || user.name} size="xl" status={status} />

                                    {/* Subtle Hover Overlay */}
                                    <div className="absolute inset-0 bg-black/55 backdrop-blur-[1px] opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white rounded-full">
                                        <Camera className="w-4 h-4 mb-0.5" />
                                        <span className="text-[9px] font-semibold tracking-wide">Change</span>
                                    </div>

                                    {/* Loading spinner during upload */}
                                    {isUploadingAvatar && (
                                        <div className="absolute inset-0 bg-black/65 backdrop-blur-xs flex flex-col items-center justify-center text-white rounded-full z-10">
                                            <Loader2 className="w-5 h-5 animate-spin text-brand-400" />
                                            <span className="text-[8px] font-medium mt-0.5">Uploading</span>
                                        </div>
                                    )}
                                </div>

                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="absolute -bottom-0.5 -right-0.5 p-1.5 rounded-full bg-gradient-to-r from-brand-600 to-purple-600 hover:from-brand-500 hover:to-purple-500 text-white shadow-md transition-transform hover:scale-110 active:scale-95 ring-2 ring-white dark:ring-[#0f172a] cursor-pointer"
                                    title="Upload photo from device"
                                >
                                    <Camera className="w-3 h-3" />
                                </button>
                            </div>

                            {/* Name & Email Summary */}
                            <div className="min-w-0">
                                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                                    {name || user.name}
                                </h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                                    {user.email}
                                </p>
                                <span className="inline-flex items-center gap-1 mt-1 text-[10px] font-semibold text-brand-600 dark:text-brand-300 bg-brand-500/15 border border-brand-500/25 px-2 py-0.5 rounded-full">
                                    <Shield className="w-2.5 h-2.5" />
                                    <span>Verified Account</span>
                                </span>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                            {avatar ? (
                                <button
                                    type="button"
                                    onClick={() => setAvatar('')}
                                    className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700/70 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-all shadow-xs flex items-center gap-1.5"
                                    title="Revert to first letter initial avatar"
                                >
                                    <span className="w-4 h-4 rounded-full bg-gradient-to-tr from-brand-600 to-indigo-600 text-white text-[9px] font-bold flex items-center justify-center">
                                        {(name || user.name || '?').trim().charAt(0).toUpperCase()}
                                    </span>
                                    <span>Use Initials</span>
                                </button>
                            ) : null}

                            <button
                                type="button"
                                disabled={isUploadingAvatar}
                                onClick={() => fileInputRef.current?.click()}
                                className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-brand-600 via-purple-600 to-indigo-600 hover:from-brand-500 hover:via-purple-500 hover:to-indigo-500 disabled:opacity-50 text-white text-xs font-semibold shadow-md shadow-brand-500/25 flex items-center gap-1.5 transition-all active:scale-95 flex-shrink-0"
                                title="Upload custom image from your device"
                            >
                                {isUploadingAvatar ? (
                                    <>
                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                        <span>Uploading...</span>
                                    </>
                                ) : (
                                    <>
                                        <UploadCloud className="w-3.5 h-3.5" />
                                        <span>{avatar ? 'Change Photo' : 'Upload Photo'}</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    {uploadError && (
                        <div className="flex items-center gap-2 text-xs text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-3.5 py-2.5 rounded-xl border border-rose-200 dark:border-rose-900/50">
                            <AlertCircle className="w-4 h-4 flex-shrink-0" />
                            <span>{uploadError}</span>
                        </div>
                    )}

                    {/* Form Fields: Name, Email & Bio */}
                    <div className="space-y-3.5">
                        <div>
                            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                                Full Display Name *
                            </label>
                            <div className="relative">
                                <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                                <input
                                    type="text"
                                    required
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    placeholder="Your full name"
                                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-700/80 rounded-xl text-sm font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30 transition-all"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                                Email Address
                            </label>
                            <div className="flex items-center gap-2">
                                <div className="relative flex-1">
                                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                                    <input
                                        type="email"
                                        readOnly
                                        value={user.email}
                                        className="w-full pl-10 pr-4 py-2.5 bg-slate-100/70 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 rounded-xl text-sm text-slate-600 dark:text-slate-300 cursor-not-allowed select-all"
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={handleCopyEmail}
                                    className="px-3.5 py-2.5 rounded-xl border border-brand-500/20 bg-brand-50/50 dark:bg-brand-950/30 hover:bg-brand-100/60 dark:hover:bg-brand-900/40 text-brand-600 dark:text-brand-300 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs"
                                    title="Copy email address"
                                >
                                    {isCopied ? <CheckCheck className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                                    <span>{isCopied ? 'Copied' : 'Copy'}</span>
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                                Headline / Role / Bio
                            </label>
                            <div className="relative">
                                <FileText className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                                <input
                                    type="text"
                                    value={bio}
                                    onChange={e => setBio(e.target.value)}
                                    placeholder="e.g. Senior Frontend Engineer • Real-time Team"
                                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-700/80 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30 transition-all"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Online Presence Status Grid */}
                    <div className="space-y-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                        <div className="flex items-center justify-between">
                            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                Live Presence Status
                            </label>
                            <span className="text-[10px] font-medium text-brand-600 dark:text-brand-400">
                                Broadcasted in real-time
                            </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {statusOptions.map(opt => {
                                const isSelected = status === opt.value;
                                return (
                                    <div
                                        key={opt.value}
                                        onClick={() => setStatus(opt.value)}
                                        className={`flex items-start gap-3 p-3 rounded-2xl cursor-pointer border transition-all ${
                                            isSelected
                                                ? 'bg-brand-50/80 dark:bg-brand-950/40 border-brand-500/70 shadow-sm shadow-brand-500/10 ring-1.5 ring-brand-500/40'
                                                : 'bg-slate-50/60 dark:bg-slate-900/60 hover:bg-slate-100 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-800'
                                        }`}
                                    >
                                        <span className={`w-3 h-3 rounded-full mt-0.5 flex-shrink-0 ${opt.color} ${opt.glowColor} shadow-xs`} />
                                        <div className="min-w-0 flex-1">
                                            <div className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center justify-between">
                                                <span>{opt.label}</span>
                                                {isSelected && <Check className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />}
                                            </div>
                                            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight mt-0.5">
                                                {opt.desc}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Account Meta Badges */}
                    <div className="p-3 rounded-2xl bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                        <div className="flex items-center gap-1.5">
                            <Shield className="w-3.5 h-3.5 text-brand-500" />
                            <span>Authenticated User</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            <span>User ID: <span className="font-mono text-slate-700 dark:text-slate-300 font-semibold">{user.id}</span></span>
                        </div>
                    </div>

                    {/* Chat Backup & Data Export Section */}
                    <div className="p-3.5 rounded-2xl bg-gradient-to-r from-purple-500/10 via-violet-500/5 to-indigo-500/10 border border-brand-500/25 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                            <div className="p-2.5 rounded-xl bg-gradient-to-tr from-brand-600 to-purple-600 text-white shadow-sm shadow-brand-500/25 flex-shrink-0">
                                <UploadCloud className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                                <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                                    <span>Chat Backup & Export</span>
                                </h4>
                                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                                    Export messages & media or save cloud backup
                                </p>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={() => {
                                onClose();
                                setIsExportModalOpen(true);
                            }}
                            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-brand-600 via-purple-600 to-indigo-600 hover:from-brand-500 hover:via-purple-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-md shadow-brand-500/25 flex items-center gap-1.5 flex-shrink-0 active:scale-95 transition-all"
                        >
                            <UploadCloud className="w-3.5 h-3.5" />
                            <span>Backup Now</span>
                        </button>
                    </div>

                    {/* Sign Out Confirmation Modal */}
                    <SignOutConfirmModal
                        isOpen={showSignOutConfirm}
                        onCancel={() => setShowSignOutConfirm(false)}
                        onConfirm={handleConfirmSignOut}
                    />

                    {/* Submit & Action Bar */}
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2.5">
                        <button
                            type="button"
                            onClick={() => setShowSignOutConfirm(true)}
                            className="px-3 py-2 text-xs font-semibold text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors flex items-center gap-1.5"
                            title="Sign out of your account"
                        >
                            <LogOut className="w-3.5 h-3.5" />
                            <span>Sign Out</span>
                        </button>

                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-xl transition-colors"
                            >
                                Cancel
                            </button>

                            <button
                                type="submit"
                                disabled={isSaving}
                                className={`px-5 py-2 rounded-xl font-bold text-xs shadow-md transition-all flex items-center gap-1.5 ${
                                    savedSuccess
                                        ? 'bg-emerald-600 text-white shadow-emerald-500/25'
                                        : 'bg-gradient-to-r from-brand-600 via-purple-600 to-indigo-600 hover:from-brand-500 hover:via-purple-500 hover:to-indigo-500 text-white shadow-brand-500/25 active:scale-95'
                                }`}
                            >
                                {isSaving ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        <span>Saving...</span>
                                    </>
                                ) : savedSuccess ? (
                                    <>
                                        <Check className="w-4 h-4" />
                                        <span>Saved!</span>
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="w-3.5 h-3.5" />
                                        <span>Save Changes</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );
};
