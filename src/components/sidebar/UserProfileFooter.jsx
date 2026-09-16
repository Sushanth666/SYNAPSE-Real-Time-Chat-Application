import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useSocket } from '../../context/SocketContext.jsx';
import { Avatar } from '../common/Avatar.jsx';
import { SignOutConfirmModal } from '../common/SignOutConfirmModal.jsx';
import { LogOut, ChevronDown, Check, Settings, ArrowLeftRight } from 'lucide-react';

export const UserProfileFooter = ({ onOpenProfile, onOpenSwitchUser }) => {
    const { user, logout, updateStatus } = useAuth();
    const { send } = useSocket();
    const [statusMenuOpen, setStatusMenuOpen] = useState(false);
    const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);
    const menuRef = useRef(null);

    const handleConfirmSignOut = useCallback(() => {
        setShowSignOutConfirm(false);
        logout();
    }, [logout]);

    // Close status dropdown if clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setStatusMenuOpen(false);
            }
        };
        if (statusMenuOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [statusMenuOpen]);

    if (!user) return null;

    const handleStatusChange = (newStatus) => {
        updateStatus(newStatus);
        send('presence:update', { status: newStatus });
        setStatusMenuOpen(false);
    };

    const statuses = [
        { label: 'Online',    value: 'online',  color: 'bg-emerald-500', desc: 'Active now' },
        { label: 'Away',      value: 'away',    color: 'bg-amber-500',   desc: 'Stepped away' },
        { label: 'Busy',      value: 'busy',    color: 'bg-rose-500',    desc: 'Do not disturb' },
        { label: 'Invisible', value: 'offline', color: 'bg-slate-400',   desc: 'Appear offline' },
    ];

    const userStatus = user.status || 'online';
    const currentStatusObj = statuses.find(s => s.value === userStatus) || statuses[0];

    return (
        <div className="relative p-2.5 border-t border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-[#111827]/90 backdrop-blur-md flex-shrink-0">

            {/* Sign Out Confirmation Modal */}
            <SignOutConfirmModal
                isOpen={showSignOutConfirm}
                onCancel={() => setShowSignOutConfirm(false)}
                onConfirm={handleConfirmSignOut}
            />

            {/* Presence Popup Menu (Opens upwards when clicking status pill) */}
            {statusMenuOpen && (
                <div
                    ref={menuRef}
                    className="absolute left-3 bottom-16 w-60 bg-white/95 dark:bg-[#0f172a]/95 backdrop-blur-xl border border-brand-500/30 rounded-2xl shadow-2xl shadow-brand-500/15 py-2 z-50 animate-modal-in overflow-hidden"
                    onClick={e => e.stopPropagation()}
                >
                    <div className="px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 dark:border-slate-800/80 mb-1 flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-brand-600 dark:text-brand-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-ping" />
                            Set Status
                        </span>
                        <span className="text-[9px] font-normal text-slate-400">Live Presence</span>
                    </div>

                    {statuses.map(s => {
                        const isSelected = userStatus === s.value;
                        return (
                            <button
                                key={s.value}
                                type="button"
                                onClick={() => handleStatusChange(s.value)}
                                className={`w-full px-3.5 py-2 text-xs flex items-center justify-between transition-all group ${
                                    isSelected
                                        ? 'bg-brand-500/10 dark:bg-brand-500/15 text-brand-600 dark:text-brand-300 font-bold'
                                        : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100/80 dark:hover:bg-slate-800/60'
                                }`}
                            >
                                <div className="flex items-center gap-2.5">
                                    <span className={`w-2.5 h-2.5 rounded-full ${s.color} ring-2 ${isSelected ? 'ring-brand-400/50' : 'ring-transparent'} group-hover:scale-110 transition-all shadow-xs`} />
                                    <div className="text-left">
                                        <div className="font-semibold text-[11px] text-slate-800 dark:text-slate-100">{s.label}</div>
                                        <div className="text-[10px] text-slate-400 font-normal">{s.desc}</div>
                                    </div>
                                </div>
                                {isSelected && <Check className="w-4 h-4 text-brand-500 flex-shrink-0" />}
                            </button>
                        );
                    })}
                </div>
            )}

            <div className="flex items-center justify-between gap-2">
                {/* Profile Name & Avatar Area */}
                <div onClick={onOpenProfile} className="flex-1 min-w-0 flex items-center gap-2.5 p-1 rounded-xl hover:bg-slate-100/90 dark:hover:bg-slate-800/80 transition-all cursor-pointer group" title="Click to view & edit your profile">
                    <div className="relative group-hover:scale-105 transition-transform flex-shrink-0">
                        <Avatar src={user.avatar} name={user.name} size="md" status={userStatus}/>
                    </div>

                    <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate group-hover:text-brand-600 dark:group-hover:text-brand-300 transition-colors flex items-center gap-1">
                            <span className="truncate">{user.name}</span>
                            <span className="text-[10px] text-slate-400 group-hover:text-brand-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                • Edit
                            </span>
                        </div>

                        {/* Separate Status Pill */}
                        <div className="mt-0.5" onClick={e => e.stopPropagation()}>
                            <button type="button" onClick={() => setStatusMenuOpen(prev => !prev)} className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-[10px] font-semibold text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700/60 transition-all hover:scale-105 active:scale-95 shadow-xs" title="Click to set online status separately">
                                <span className={`w-2 h-2 rounded-full ${currentStatusObj.color}`}/>
                                <span className="capitalize">{userStatus}</span>
                                <ChevronDown className="w-2.5 h-2.5 text-slate-400"/>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Action icons: Settings, Switch accounts, Sign out */}
                <div className="flex items-center gap-0.5 flex-shrink-0">
                    <button type="button" onClick={onOpenProfile} className="p-1.5 rounded-xl text-slate-500 dark:text-slate-400 hover-icon-purple" title="Profile & Settings">
                        <Settings className="w-4 h-4"/>
                    </button>

                    <button type="button" onClick={onOpenSwitchUser} className="p-1.5 rounded-xl text-slate-500 dark:text-slate-400 hover-icon-purple" title="Switch Accounts">
                        <ArrowLeftRight className="w-4 h-4"/>
                    </button>

                    {/* Sign Out — shows confirmation first */}
                    <button
                        type="button"
                        onClick={() => setShowSignOutConfirm(true)}
                        className="p-1.5 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                        title="Sign Out"
                    >
                        <LogOut className="w-4 h-4"/>
                    </button>
                </div>
            </div>
        </div>
    );
};
