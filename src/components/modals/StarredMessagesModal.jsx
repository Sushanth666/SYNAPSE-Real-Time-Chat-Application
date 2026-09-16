import React from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useChat } from '../../context/ChatContext.jsx';
import { Avatar } from '../common/Avatar.jsx';
import { X, Star, ArrowRight, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
export const StarredMessagesModal = ({ isOpen, onClose, onJumpToMessage, }) => {
    const { allUsers } = useAuth();
    const { messages, conversations, toggleStarMessage } = useChat();
    if (!isOpen)
        return null;
    // Filter starred messages across conversation
    const starredMessages = messages.filter(m => m.isStarred);
    return (<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-modal-in" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Star className="w-4 h-4 text-amber-500 fill-current animate-pulse"/>
            <span>Starred Messages ({starredMessages.length})</span>
          </h2>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <X className="w-4 h-4"/>
          </button>
        </div>

        {/* List */}
        <div className="p-4 space-y-2.5 overflow-y-auto flex-1">
          {starredMessages.length === 0 ? (<div className="text-center py-12 text-slate-400 animate-message-enter">
              <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/30 flex items-center justify-center animate-bounce-subtle">
                <Star className="w-6 h-6 text-amber-500 fill-amber-500/30"/>
              </div>
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                No starred messages yet
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5 max-w-[240px] mx-auto">
                Hover over any message and click the star icon to keep key notes handy.
              </p>
            </div>) : (starredMessages.map(msg => {
            const sender = allUsers.find(u => u.id === msg.senderId);
            const conv = conversations.find(c => c.id === msg.conversationId);
            return (<div key={msg.id} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex flex-col gap-2 group">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Avatar src={sender?.avatar} name={sender?.name || 'User'} size="xs"/>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        {sender?.name}
                      </span>
                      {conv && (<span className="text-[10px] text-slate-400">
                          in {conv.name}
                        </span>)}
                    </div>

                    <button onClick={() => toggleStarMessage(msg.id)} className="text-slate-400 hover:text-rose-500 transition-colors" title="Remove from starred">
                      <Trash2 className="w-3.5 h-3.5"/>
                    </button>
                  </div>

                  <p className="text-xs text-slate-700 dark:text-slate-300 line-clamp-2">
                    {msg.poll ? `📊 Poll: ${msg.poll.question}` : msg.text}
                  </p>

                  <div className="flex items-center justify-between pt-1 border-t border-slate-200 dark:border-slate-700/40 text-[10px] text-slate-400">
                    <span>{format(new Date(msg.createdAt), 'MMM d, h:mm a')}</span>
                    <button onClick={() => {
                    onJumpToMessage(msg.conversationId, msg.id);
                    onClose();
                }} className="flex items-center gap-1 font-semibold text-brand-600 dark:text-brand-400 hover:underline">
                      <span>Jump</span>
                      <ArrowRight className="w-3 h-3"/>
                    </button>
                  </div>
                </div>);
        }))}
        </div>
      </div>
    </div>);
};
