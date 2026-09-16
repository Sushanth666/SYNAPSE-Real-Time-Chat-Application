import React from 'react';
import { Pin, X, ChevronRight } from 'lucide-react';
export const PinnedBanner = ({ pinnedMessage, onJumpToMessage, onUnpin, senderName = 'Someone', }) => {
    if (!pinnedMessage)
        return null;
    return (<div className="px-4 py-2 flex-shrink-0 bg-brand-500/10 dark:bg-brand-600/15 border-b border-brand-500/25 flex items-center justify-between gap-3 text-xs z-10 select-none animate-in slide-in-from-top-1 duration-150">
      <div onClick={() => onJumpToMessage(pinnedMessage.id)} className="flex items-center gap-2 min-w-0 flex-1 cursor-pointer group">
        <div className="p-1 rounded-md bg-brand-500/20 text-brand-600 dark:text-brand-400 flex-shrink-0">
          <Pin className="w-3.5 h-3.5 fill-current"/>
        </div>
        <div className="min-w-0 flex-1">
          <span className="font-bold text-brand-600 dark:text-brand-300 mr-1.5">
            Pinned by {senderName}:
          </span>
          <span className="text-slate-700 dark:text-slate-300 truncate inline-block max-w-[280px] sm:max-w-md align-bottom">
            {pinnedMessage.poll ? `📊 Poll: ${pinnedMessage.poll.question}` : pinnedMessage.text}
          </span>
        </div>
        <ChevronRight className="w-4 h-4 text-brand-400 group-hover:translate-x-0.5 transition-transform flex-shrink-0"/>
      </div>

      <button onClick={() => onUnpin(pinnedMessage.id)} className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded transition-colors flex-shrink-0" title="Unpin message">
        <X className="w-3.5 h-3.5"/>
      </button>
    </div>);
};
