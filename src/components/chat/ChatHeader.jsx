import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useChat } from '../../context/ChatContext.jsx';
import { Avatar } from '../common/Avatar.jsx';
import { SignOutConfirmModal } from '../common/SignOutConfirmModal.jsx';
import { ArrowLeft, Phone, Video, Search, Sidebar as SidebarIcon, X, Users, Star, Palette, ShieldCheck, FileDown, ChevronUp, ChevronDown, LogOut } from 'lucide-react';
export const ChatHeader = ({ onBackMobile }) => {
    const { user, allUsers, logout } = useAuth();
    const { activeConversation, isDetailsOpen, setIsDetailsOpen, messageSearchQuery, setMessageSearchQuery, setIsStarredModalOpen, startCall, setIsWallpaperModalOpen, typingUsers, setIsExportModalOpen, setIsE2EEModalOpen, verifiedConversations, messages } = useChat();
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [callNotice, setCallNotice] = useState(null);
    const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
    const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);
    const searchInputRef = useRef(null);

    const handleConfirmSignOut = useCallback(() => {
        setShowSignOutConfirm(false);
        logout();
    }, [logout]);

    // Filter messages matching query inside this conversation
    const matchingMessages = useMemo(() => {
        if (!messageSearchQuery || !messageSearchQuery.trim()) return [];
        const q = messageSearchQuery.trim().toLowerCase();
        return (messages || []).filter(m => 
            !m.isDeleted && (
                (m.text && m.text.toLowerCase().includes(q)) ||
                (m.attachments && m.attachments.some(a => a.name?.toLowerCase().includes(q))) ||
                (m.poll && m.poll.question?.toLowerCase().includes(q))
            )
        );
    }, [messages, messageSearchQuery]);

    // Jump to match by index and smooth scroll
    const jumpToMatch = (index) => {
        if (!matchingMessages.length) return;
        const safeIndex = (index + matchingMessages.length) % matchingMessages.length;
        setCurrentMatchIndex(safeIndex);
        const targetMsg = matchingMessages[safeIndex];
        if (targetMsg) {
            const el = document.getElementById(`msg-${targetMsg.id}`);
            if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                el.classList.add('ring-4', 'ring-amber-400', 'rounded-2xl', 'transition-all');
                setTimeout(() => {
                    el.classList.remove('ring-4', 'ring-amber-400', 'rounded-2xl', 'transition-all');
                }, 2000);
            }
        }
    };

    const handleNextMatch = () => jumpToMatch(currentMatchIndex + 1);
    const handlePrevMatch = () => jumpToMatch(currentMatchIndex - 1);

    // When search query changes, jump to first match
    useEffect(() => {
        if (matchingMessages.length > 0) {
            jumpToMatch(0);
        } else {
            setCurrentMatchIndex(0);
        }
    }, [messageSearchQuery]);

    // Auto-focus search input when opened
    useEffect(() => {
        if (isSearchOpen && searchInputRef.current) {
            searchInputRef.current.focus();
        }
    }, [isSearchOpen]);

    if (!activeConversation || !user)
        return null;
    // Determine status and contact details of direct contact
    let otherStatus;
    let statusText = '';
    let displayName = activeConversation.name;
    let displayAvatar = activeConversation.avatar;
    if (activeConversation.type === 'direct') {
        const otherId = activeConversation.participantIds.find(id => id !== user.id);
        const otherUser = allUsers.find(u => u.id === otherId);
        otherStatus = otherUser?.status;
        if (otherUser) {
            displayName = otherUser.name;
            displayAvatar = otherUser.avatar;
        }
    }
    // Safety guard: Never display logged-in user's own name in header
    if (user && activeConversation.type === 'direct' && displayName.toLowerCase() === user.name.toLowerCase()) {
        const otherId = activeConversation.participantIds.find(id => id !== user.id);
        const otherUser = allUsers.find(u => u.id === otherId);
        if (otherUser && otherUser.name.toLowerCase() !== user.name.toLowerCase()) {
            displayName = otherUser.name;
            displayAvatar = otherUser.avatar;
        }
        else {
            const altUser = allUsers.find(u => u.id !== user.id && u.name.toLowerCase() !== user.name.toLowerCase());
            if (altUser) {
                displayName = altUser.name;
                displayAvatar = altUser.avatar;
            }
        }
    }
    if (activeConversation.type === 'direct') {
        statusText = otherStatus === 'online' ? 'Online' : 'Offline';
    }
    else {
        const count = activeConversation.participantIds?.length || 0;
        statusText = `${count} members`;
    }
    // Check if other participant is currently typing
    const otherTyping = (typingUsers || []).filter(u => u.conversationId === activeConversation.id && u.userId !== user.id);
    const isVerified = Boolean(verifiedConversations && verifiedConversations[activeConversation.id]);
    return (<div className="relative z-20 animate-header-down">
      <div className="h-16 px-4 bg-white/70 dark:bg-[#0c0a1a]/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
        {/* Left: Avatar & Contact Details */}
        <div className="flex items-center gap-3 min-w-0">
          <button onClick={onBackMobile} className="md:hidden p-1.5 -ml-1 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <ArrowLeft className="w-5 h-5"/>
          </button>

          <div onClick={() => setIsDetailsOpen(prev => !prev)} className="flex items-center gap-3 cursor-pointer group min-w-0">
            <Avatar src={displayAvatar} name={displayName} size="md" status={activeConversation.type === 'direct' ? otherStatus : undefined}/>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors truncate">
                  {displayName}
                </h2>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsE2EEModalOpen(true);
                  }}
                  className={`p-1 rounded-lg transition-colors flex items-center gap-1 ${
                    isVerified
                      ? 'text-emerald-500 hover:bg-emerald-500/10'
                      : 'text-purple-400 hover:text-purple-300 hover:bg-purple-500/15'
                  }`}
                  title={isVerified ? "End-to-End Encrypted • Verified Contact" : "End-to-End Encrypted (Click to verify safety numbers)"}
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  {isVerified && (
                    <span className="text-[10px] font-bold text-emerald-500 hidden sm:inline">Verified</span>
                  )}
                </button>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate flex items-center gap-1.5">
                {otherTyping.length > 0 ? (
                  <span className="text-brand-600 dark:text-brand-400 font-semibold animate-pulse flex items-center gap-1.5">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-brand-500"></span>
                    </span>
                    <span>{otherTyping[0].userName} is typing...</span>
                  </span>
                ) : (
                  <>
                    {activeConversation.type === 'group' && (<Users className="w-3 h-3 text-slate-400"/>)}
                    <span>{statusText}</span>
                  </>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1">
          {/* Call actions */}
          <button onClick={() => startCall('audio')} className="p-2 text-slate-500 dark:text-slate-400 hover-icon-purple rounded-xl transition-colors" title="Start voice call">
            <Phone className="w-4 h-4"/>
          </button>
          <button onClick={() => startCall('video')} className="p-2 text-slate-500 dark:text-slate-400 hover-icon-purple rounded-xl transition-colors" title="Start video call">
            <Video className="w-4 h-4"/>
          </button>

          {/* Wallpaper Theme Customizer */}
          <button onClick={() => setIsWallpaperModalOpen(true)} className="p-2 text-slate-500 dark:text-slate-400 hover-icon-purple rounded-xl transition-colors" title="Customize chat wallpaper">
            <Palette className="w-4 h-4"/>
          </button>

          {/* Starred Messages */}
          <button onClick={() => setIsStarredModalOpen(true)} className="p-2 text-slate-500 dark:text-slate-400 hover-icon-purple rounded-xl transition-colors" title="Starred / Bookmarked messages">
            <Star className="w-4 h-4"/>
          </button>

          {/* Export & Backup Chat */}
          <button onClick={() => setIsExportModalOpen(true)} className="p-2 text-slate-500 dark:text-slate-400 hover-icon-purple rounded-xl transition-colors" title="Export & backup chat (PDF, Markdown, JSON)">
            <FileDown className="w-4 h-4"/>
          </button>

          {/* Search inside active chat */}
          <button 
            id="chat-search-toggle-btn"
            type="button"
            onClick={() => {
              const nextState = !isSearchOpen;
              setIsSearchOpen(nextState);
              if (!nextState) {
                  setMessageSearchQuery('');
              } else {
                  setTimeout(() => searchInputRef.current?.focus(), 50);
              }
            }} 
            className={`p-2 rounded-xl transition-all cursor-pointer ${isSearchOpen || messageSearchQuery
              ? 'text-purple-600 dark:text-purple-400 bg-purple-500/20 ring-1 ring-purple-500/40 shadow-xs'
              : 'text-slate-500 dark:text-slate-400 hover-icon-purple'}`} 
            title={isSearchOpen ? "Close search (Esc)" : "Search in conversation"}
          >
            <Search className="w-4 h-4"/>
          </button>

          {/* Conversation Details toggle */}
          <button onClick={() => setIsDetailsOpen(prev => !prev)} className={`p-2 rounded-xl transition-colors ${isDetailsOpen
            ? 'text-purple-600 dark:text-purple-400 bg-purple-500/15'
            : 'text-slate-500 dark:text-slate-400 hover-icon-purple'}`} title="Conversation info & media">
            <SidebarIcon className="w-4 h-4"/>
          </button>

          {/* Mobile Sign Out button */}
          <button
            type="button"
            onClick={() => setShowSignOutConfirm(true)}
            className="md:hidden p-2 rounded-xl text-rose-500 hover:text-rose-600 hover:bg-rose-500/15 bg-rose-500/10 transition-all cursor-pointer"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* In-Chat Search Bar Dropdown */}
      {isSearchOpen && (
        <div id="in-chat-search-bar" className="px-4 py-2.5 bg-white/95 dark:bg-[#110f22]/95 border-b border-purple-500/30 backdrop-blur-md flex items-center justify-between gap-3 shadow-md animate-in slide-in-from-top-1 duration-150 relative z-30">
          <div className="flex items-center gap-2 flex-1 min-w-0 bg-slate-100 dark:bg-slate-900/90 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-inner focus-within:border-purple-500 focus-within:ring-1 focus-within:ring-purple-500 transition-all">
            <Search className="w-4 h-4 text-purple-500 flex-shrink-0"/>
            <input 
              ref={searchInputRef}
              type="text" 
              autoFocus 
              placeholder="Search within this conversation (press Enter to jump)..." 
              value={messageSearchQuery} 
              onChange={e => setMessageSearchQuery(e.target.value)} 
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  if (e.shiftKey) {
                    handlePrevMatch();
                  } else {
                    handleNextMatch();
                  }
                } else if (e.key === 'Escape') {
                  setIsSearchOpen(false);
                  setMessageSearchQuery('');
                }
              }}
              className="flex-1 bg-transparent text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none"
            />
            {messageSearchQuery && (
              <button 
                type="button"
                onClick={() => setMessageSearchQuery('')} 
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title="Clear query"
              >
                <X className="w-3.5 h-3.5"/>
              </button>
            )}
          </div>

          {/* Results counter & Match navigation */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {messageSearchQuery.trim() && (
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-lg border ${
                matchingMessages.length > 0 
                  ? 'bg-purple-500/15 text-purple-600 dark:text-purple-300 border-purple-500/30' 
                  : 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30'
              }`}>
                {matchingMessages.length > 0 
                  ? `${currentMatchIndex + 1} of ${matchingMessages.length}` 
                  : 'No matches'}
              </span>
            )}

            {matchingMessages.length > 0 && (
              <div className="flex items-center gap-1">
                <button 
                  type="button" 
                  onClick={handlePrevMatch} 
                  className="p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/40 transition-all cursor-pointer shadow-xs"
                  title="Previous match (Shift+Enter)"
                >
                  <ChevronUp className="w-3.5 h-3.5" />
                </button>
                <button 
                  type="button" 
                  onClick={handleNextMatch} 
                  className="p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/40 transition-all cursor-pointer shadow-xs"
                  title="Next match (Enter)"
                >
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            <button 
              type="button" 
              onClick={() => {
                setIsSearchOpen(false);
                setMessageSearchQuery('');
              }} 
              className="p-1.5 rounded-xl text-rose-500 bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 transition-all cursor-pointer shadow-xs"
              title="Close search (Esc)"
            >
              <X className="w-4 h-4 text-rose-500 stroke-[2.5]" />
            </button>
          </div>
        </div>
      )}

      {/* Call toast notification */}
      {callNotice && (<div className="absolute top-16 left-1/2 -translate-x-1/2 mt-2 px-4 py-2 bg-slate-900 text-slate-100 text-xs font-medium rounded-full shadow-2xl border border-slate-700/80 flex items-center gap-2 animate-bounce-subtle z-50">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"/>
          <span>{callNotice}</span>
        </div>)}

      {/* Mobile Sign Out Confirmation Dialog */}
      <SignOutConfirmModal
        isOpen={showSignOutConfirm}
        onCancel={() => setShowSignOutConfirm(false)}
        onConfirm={handleConfirmSignOut}
      />
    </div>);
};
