import React from 'react';
import { useChat } from '../../context/ChatContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
export const TypingIndicator = () => {
    const { typingUsers, isSelfTyping } = useChat();
    const { user } = useAuth();

    // Filter out own typing from socket broadcasts for other users
    const otherTyping = (typingUsers || []).filter(t => t.userId !== user?.id);

    if (otherTyping.length === 0 && !isSelfTyping)
        return null;

    let text = '';
    let isSelf = false;

    if (otherTyping.length === 1) {
        text = `${otherTyping[0].userName} is typing`;
    }
    else if (otherTyping.length === 2) {
        text = `${otherTyping[0].userName} and ${otherTyping[1].userName} are typing`;
    }
    else if (otherTyping.length > 2) {
        text = `${otherTyping[0].userName} and ${otherTyping.length - 1} others are typing`;
    }
    else if (isSelfTyping) {
        text = 'You are typing';
        isSelf = true;
    }

    return (<div className="px-4 py-1.5 flex-shrink-0 flex items-center gap-2 animate-fade-in-up">
      <div className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full backdrop-blur-md border shadow-md text-xs transition-all ${
        isSelf 
          ? 'bg-white/90 dark:bg-slate-800/90 border-slate-300/80 dark:border-slate-700/80 text-slate-600 dark:text-slate-300' 
          : 'bg-white/95 dark:bg-slate-800/95 border-brand-500/40 dark:border-brand-500/30 text-brand-600 dark:text-brand-300 ring-1 ring-brand-500/20'
      }`}>
        <span className="relative flex h-2 w-2">
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isSelf ? 'bg-slate-400' : 'bg-brand-400'}`}></span>
          <span className={`relative inline-flex rounded-full h-2 w-2 ${isSelf ? 'bg-slate-500' : 'bg-brand-500'}`}></span>
        </span>
        <span className="font-semibold text-[11px] tracking-tight">{text}</span>
        {/* Animated dots with cascading typing-dot keyframe */}
        <div className="flex items-end gap-0.5 ml-0.5 h-3">
          <span className={`w-1.5 h-1.5 rounded-full animate-typing-dot ${isSelf ? 'bg-slate-400' : 'bg-brand-500'}`} style={{ animationDelay: '0ms' }}/>
          <span className={`w-1.5 h-1.5 rounded-full animate-typing-dot ${isSelf ? 'bg-slate-400' : 'bg-brand-500'}`} style={{ animationDelay: '200ms' }}/>
          <span className={`w-1.5 h-1.5 rounded-full animate-typing-dot ${isSelf ? 'bg-slate-400' : 'bg-brand-500'}`} style={{ animationDelay: '400ms' }}/>
        </div>
      </div>
    </div>);
};
