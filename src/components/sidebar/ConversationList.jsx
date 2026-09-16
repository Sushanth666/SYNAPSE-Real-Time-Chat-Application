import React from 'react';
import { useChat } from '../../context/ChatContext.jsx';
import { ConversationItem } from './ConversationItem.jsx';
import { Plus } from 'lucide-react';
import { NoSearchResultsGraphic, EmptyChatGraphic } from '../common/Graphics.jsx';
export const ConversationList = ({ onOpenNewChat }) => {
    const { conversations, activeConversationId, setActiveConversationId, searchQuery, activeFilter, isInitialLoading, } = useChat();
    // Filter conversations
    const filteredConversations = conversations.filter(c => {
        // 1. Search Query
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            const matchName = c.name.toLowerCase().includes(q);
            const matchLastMsg = c.lastMessage?.text?.toLowerCase().includes(q);
            if (!matchName && !matchLastMsg)
                return false;
        }
        // 2. Filter Pills
        if (activeFilter === 'unread') {
            return (c.unreadCount || 0) > 0;
        }
        if (activeFilter === 'direct') {
            return c.type === 'direct';
        }
        if (activeFilter === 'group') {
            return c.type === 'group';
        }
        return true;
    });
    if (isInitialLoading) {
        return (<div className="flex-1 p-3 space-y-2 overflow-hidden">
        {[1, 2, 3, 4, 5, 6].map((i, idx) => (<div key={i} className="flex items-center gap-3 p-2 rounded-xl opacity-0 animate-fade-in-left" style={{ animationDelay: `${idx * 60}ms`, animationFillMode: 'forwards' }}>
            <div className="w-10 h-10 rounded-full skeleton flex-shrink-0"/>
            <div className="flex-1 space-y-2">
              <div className="w-28 h-3 skeleton rounded-full"/>
              <div className="w-44 h-2.5 skeleton rounded-full"/>
            </div>
            <div className="w-6 h-6 skeleton rounded-full"/>
          </div>))}
      </div>);
    }
    if (filteredConversations.length === 0) {
        return (<div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-slate-500 animate-fade-in-up">
        <div className="mb-2 animate-float">
          {searchQuery ? (<NoSearchResultsGraphic className="w-24 h-24"/>) : (<EmptyChatGraphic className="w-24 h-24"/>)}
        </div>
        <p className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1 animate-fade-in-up delay-100">
          {searchQuery ? 'No matching conversations' : 'No conversations found'}
        </p>
        <p className="text-[11px] text-slate-400 max-w-[200px] mb-4 animate-fade-in-up delay-200">
          {searchQuery ? 'Try matching another name or keyword' : 'Start a new conversation with a teammate'}
        </p>
        {!searchQuery && (<button onClick={onOpenNewChat} className="flex items-center gap-1.5 px-3.5 py-1.5 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-brand-600/30 transition-all hover:scale-105 active:scale-95 animate-fade-in-up delay-300">
            <Plus className="w-3.5 h-3.5"/>
            <span>New Chat</span>
          </button>)}
      </div>);
    }
    return (<div className="flex-1 overflow-y-auto py-1">
      {filteredConversations.map((conv, idx) => (
        <div
          key={conv.id}
          className="opacity-0 animate-slide-sidebar"
          style={{ animationDelay: `${Math.min(idx * 40, 400)}ms`, animationFillMode: 'forwards' }}
        >
          <ConversationItem
            conversation={conv}
            isActive={conv.id === activeConversationId}
            onSelect={() => setActiveConversationId(conv.id)}
          />
        </div>
      ))}
    </div>);
};
