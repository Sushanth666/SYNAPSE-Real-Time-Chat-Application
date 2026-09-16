import React, { useState, useEffect } from 'react';
import { useChat } from '../../context/ChatContext.jsx';
import { Search, X } from 'lucide-react';
export const SearchBar = () => {
    const { searchQuery, setSearchQuery, activeFilter, setActiveFilter, conversations } = useChat();
    const [localSearch, setLocalSearch] = useState(searchQuery);
    // Debounce search update (300ms)
    useEffect(() => {
        const handler = setTimeout(() => {
            setSearchQuery(localSearch);
        }, 300);
        return () => clearTimeout(handler);
    }, [localSearch, setSearchQuery]);
    const totalUnreadCount = conversations.filter(c => (c.unreadCount || 0) > 0).length;
    const filters = [
        { label: 'All', key: 'all' },
        { label: 'Unread', key: 'unread', badge: totalUnreadCount },
        { label: 'Direct', key: 'direct' },
        { label: 'Groups', key: 'group' },
    ];
    return (<div className="p-3 border-b border-slate-200 dark:border-slate-800 space-y-2.5">
      {/* Search Input */}
      <div className="relative">
        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"/>
        <input type="text" placeholder="Search chats or messages..." value={localSearch} onChange={e => setLocalSearch(e.target.value)} className="w-full pl-8 pr-7 py-1.5 bg-slate-100 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all"/>
        {localSearch && (<button onClick={() => setLocalSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <X className="w-3.5 h-3.5"/>
          </button>)}
      </div>

      {/* Filter Tabs - Aligned across full width */}
      <div className="w-full grid grid-cols-4 gap-2 pt-1 pb-0.5">
        {filters.map(f => (<button key={f.key} type="button" onClick={() => setActiveFilter(f.key)} className={`w-full py-2 px-1 text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-1.5 whitespace-nowrap text-center ${activeFilter === f.key
                ? 'bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 text-white shadow-md shadow-purple-600/25 ring-1 ring-purple-500/50'
                : 'bg-slate-100/90 dark:bg-slate-800/90 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-200/80 dark:hover:bg-slate-700'}`}>
            <span>{f.label}</span>
            {f.badge !== undefined && f.badge > 0 && (<span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold leading-none ${activeFilter === f.key
                    ? 'bg-white text-purple-700'
                    : 'bg-purple-600 text-white'}`}>
                {f.badge}
              </span>)}
          </button>))}
      </div>
    </div>);
};
