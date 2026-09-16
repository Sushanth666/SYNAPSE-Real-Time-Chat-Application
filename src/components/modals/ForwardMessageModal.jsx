import React, { useState, useMemo } from 'react';
import { useChat } from '../../context/ChatContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { Avatar } from '../common/Avatar.jsx';
import { X, Search, Forward, Send, Users, CheckCircle2 } from 'lucide-react';
export const ForwardMessageModal = () => {
    const { user, allUsers } = useAuth();
    const { conversations, forwardingMessage, setForwardingMessage, forwardMessageToConversation } = useChat();
    const [searchQuery, setSearchQuery] = useState('');
    const [forwardingTargetId, setForwardingTargetId] = useState(null);
    const filteredConversations = useMemo(() => {
        if (!searchQuery.trim())
            return conversations;
        const q = searchQuery.toLowerCase();
        return conversations.filter(c => c.name.toLowerCase().includes(q));
    }, [conversations, searchQuery]);
    if (!forwardingMessage)
        return null;
    const originalSender = allUsers.find(u => u.id === forwardingMessage.senderId);
    const originalSenderName = originalSender?.name || (forwardingMessage.senderId === user?.id ? 'You' : 'Team Member');
    const handleForward = async (targetConvId) => {
        setForwardingTargetId(targetConvId);
        await forwardMessageToConversation(targetConvId);
        setForwardingTargetId(null);
    };
    return (<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="relative w-full max-w-md bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col p-6 animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-brand-500/10 text-brand-500 flex items-center justify-center">
              <Forward className="w-4 h-4"/>
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Forward Message
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Select a direct chat or channel to forward to
              </p>
            </div>
          </div>

          <button onClick={() => setForwardingMessage(null)} className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <X className="w-4 h-4"/>
          </button>
        </div>

        {/* Message Preview Snippet */}
        <div className="my-3 p-3 rounded-2xl bg-slate-100/80 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 text-xs">
          <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-semibold mb-1">
            <Forward className="w-3 h-3 text-brand-400"/>
            <span>Forwarding from {originalSenderName}:</span>
          </div>
          <p className="text-slate-700 dark:text-slate-200 line-clamp-2 italic font-sans">
            "{forwardingMessage.text || (forwardingMessage.voiceMemo ? 'Voice memo' : 'Attachment')}"
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative mb-3">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2"/>
          <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search chats or members..." className="w-full bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-xl pl-9 pr-3.5 py-2 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-brand-500 transition-colors"/>
        </div>

        {/* Conversations List */}
        <div className="space-y-1 max-h-64 overflow-y-auto pr-1">
          {filteredConversations.length === 0 ? (<p className="py-6 text-center text-xs text-slate-400">
              No matching chats found.
            </p>) : (filteredConversations.map(conv => {
            const isGroup = conv.type === 'group';
            const otherUserId = conv.participantIds.find(id => id !== user?.id);
            const other = allUsers.find(u => u.id === otherUserId);
            const displayName = isGroup ? conv.name : (other?.name || conv.name);
            const displayAvatar = isGroup ? conv.avatar : (other?.avatar || conv.avatar);
            const isSending = forwardingTargetId === conv.id;
            return (<div key={conv.id} className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Avatar src={displayAvatar} name={displayName} size="sm" status={!isGroup ? other?.status : undefined}/>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                        {displayName}
                      </p>
                      <p className="text-[10px] text-slate-400 truncate flex items-center gap-1">
                        {isGroup && <Users className="w-2.5 h-2.5"/>}
                        <span>{isGroup ? `${conv.participantIds.length} members` : (other?.status || 'direct')}</span>
                      </p>
                    </div>
                  </div>

                  <button type="button" disabled={isSending} onClick={() => handleForward(conv.id)} className="p-1.5 px-3 rounded-lg bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white text-xs font-semibold shadow-sm transition-all active:scale-95 flex items-center gap-1 flex-shrink-0">
                    {isSending ? (<CheckCircle2 className="w-3.5 h-3.5 animate-spin"/>) : (<>
                        <Send className="w-3 h-3"/>
                        <span>Send</span>
                      </>)}
                  </button>
                </div>);
        }))}
        </div>
      </div>
    </div>);
};
