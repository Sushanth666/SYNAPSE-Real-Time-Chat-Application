import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Search, X, Smile, ThumbsUp, Heart, Sparkles, Coffee, Cat } from 'lucide-react';

const EMOJI_CATEGORIES = [
  {
    id: 'smileys',
    name: 'Smileys',
    icon: Smile,
    emojis: [
      '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '🥲', '🥹',
      '☺️', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘',
      '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐',
      '🤓', '😎', '🥸', '🤩', '🥳', '😏', '😒', '😞', '😔', '😟',
      '😕', '🙁', '🥺', '😢', '😭', '😤', '😠', '😡', '🤯', '😳',
      '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗', '🤔', '🫣',
      '🤭', '🤫', '🫠', '🤐', '😴', '🤤', '😵', '😵‍💫', '😷', '🤒'
    ]
  },
  {
    id: 'gestures',
    name: 'Hands',
    icon: ThumbsUp,
    emojis: [
      '👍', '👎', '👌', '✌️', '🤞', '🫰', '🤟', '🤘', '🤙', '👈',
      '👉', '👆', '🖕', '👇', '☝️', '👋', '🤚', '🖐️', '✋', '🖖',
      '🫱', '🫲', '🫳', '🫴', '👏', '🙌', '👐', '🤲', '🤝', '🙏',
      '✍️', '💅', '🤳', '💪', '🦾', '👀', '👁️', '👅', '👄', '🫦',
      '🫂', '👥', '👤', '🗣️', '👶', '👧', '🧒', '👦', '👩', '👨'
    ]
  },
  {
    id: 'hearts',
    name: 'Hearts',
    icon: Heart,
    emojis: [
      '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔',
      '❤️‍🔥', '❤️‍🩹', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝',
      '💟', '✨', '⭐', '🌟', '💫', '💥', '🔥', '💯', '🎉', '🎊',
      '🎈', '🎁', '🏆', '🥇', '🥈', '🥉', '🏅', '🎖️', '👑', '💎'
    ]
  },
  {
    id: 'objects',
    name: 'Tech',
    icon: Sparkles,
    emojis: [
      '🚀', '🛸', '✈️', '🚗', '🏎️', '🚲', '🛵', '🏍️', '🚨', '🛰️',
      '📱', '💻', '🖥️', '⌨️', '🖱️', '📷', '📹', '🕹️', '🎮', '🎙️',
      '🎧', '🎼', '🎵', '🎶', '🥁', '🎸', '🎹', '🎷', '🎺', '🎻',
      '⚽', '🏀', '🏈', '⚾', '🎾', '🏐', '🎱', '🎯', '🎲', '🧩',
      '🔔', '📢', '📣', '📦', '📫', '📝', '📌', '📍', '🔑', '🔒',
      '🛡️', '⚡', '💡', '⏰', '⏱️', '⏳', '⌛', '🔋', '🔌', '📡'
    ]
  },
  {
    id: 'food',
    name: 'Food',
    icon: Coffee,
    emojis: [
      '☕', '🍵', '🧃', '🥤', '🧋', '🍺', '🍻', '🍷', '🥂', '🍾',
      '🍕', '🍔', '🍟', '🌭', '🥪', '🌮', '🌯', '🥗', '🍝', '🍜',
      '🍲', '🍛', '🍣', '🍱', '🥟', '🍤', '🍙', '🍚', '🍢', '🍡',
      '🍦', '🍧', '🍨', '🍩', '🍪', '🎂', '🍰', '🧁', '🍫', '🍿',
      '🍎', '🍏', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🍒',
      '🍑', '🥭', '🍍', '🥥', '🥝', '🥑', '🥦', '🌽', '🥕', '🥜'
    ]
  },
  {
    id: 'animals',
    name: 'Nature',
    icon: Cat,
    emojis: [
      '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯',
      '🦁', '🐮', '🐷', '🐸', '🐵', '🐔', '🐧', '🐦', '🐤', '🦆',
      '🦅', '🦉', '🦇', '🐺', '🐗', '🐴', '🦄', '🐝', '🐛', '🦋',
      '🐢', '🐍', '🐙', '🦑', '🐬', '🐳', '🐋', '🦈', '🐊', '🐅',
      '🐘', '🦔', '🐾', '🌲', '🌳', '🌴', '🌵', '🌷', '🌸', '🌹',
      '🌺', '🌻', '🌼', '🍁', '🍂', '🍃', '🍄', '🌍', '🌙', '☀️'
    ]
  }
];

export const EmojiPickerPopover = ({ onSelect, onClose }) => {
  const [activeCategory, setActiveCategory] = useState('smileys');
  const [searchQuery, setSearchQuery] = useState('');
  const popoverRef = useRef(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  // Flattened emoji search
  const filteredEmojis = useMemo(() => {
    if (!searchQuery.trim()) return null;
    const q = searchQuery.toLowerCase();
    const all = EMOJI_CATEGORIES.flatMap(c => c.emojis);
    return all.filter((e, idx, arr) => arr.indexOf(e) === idx);
  }, [searchQuery]);

  const currentCategoryObj = EMOJI_CATEGORIES.find(c => c.id === activeCategory) || EMOJI_CATEGORIES[0];

  return (
    <div
      ref={popoverRef}
      className="absolute bottom-12 left-0 w-80 max-h-84 bg-white/95 dark:bg-[#120f22]/95 backdrop-blur-xl border border-slate-200 dark:border-purple-900/40 rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden animate-modal-in select-none"
      onClick={e => e.stopPropagation()}
    >
      {/* Search Header */}
      <div className="p-2.5 pb-2 border-b border-slate-100 dark:border-purple-900/30">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search all emojis..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-7 py-1.5 bg-slate-100 dark:bg-slate-900/80 border border-slate-200 dark:border-purple-900/30 rounded-xl text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-brand-500 transition-all"
            autoFocus
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Category Tabs */}
      {!searchQuery && (
        <div className="flex items-center justify-between px-2 py-1.5 border-b border-slate-100 dark:border-purple-900/20 bg-slate-50/50 dark:bg-purple-950/20">
          {EMOJI_CATEGORIES.map(cat => {
            const Icon = cat.icon;
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id)}
                className={`p-1.5 rounded-xl transition-all flex items-center justify-center ${
                  isActive
                    ? 'bg-brand-500/20 text-brand-600 dark:text-brand-300 font-bold scale-110 shadow-xs ring-1 ring-brand-500/30'
                    : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                }`}
                title={cat.name}
              >
                <Icon className="w-4 h-4" />
              </button>
            );
          })}
        </div>
      )}

      {/* Emoji Grid Container */}
      <div className="flex-1 overflow-y-auto p-2.5 max-h-56">
        {searchQuery ? (
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1 mb-1.5">
              Matching Emojis
            </div>
            <div className="grid grid-cols-7 gap-1">
              {filteredEmojis.map((emoji, idx) => (
                <button
                  key={`${emoji}-${idx}`}
                  type="button"
                  onClick={() => onSelect(emoji)}
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-lg hover:scale-135 active:scale-95 hover:bg-brand-500/15 transition-all duration-150"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1 mb-1.5 flex items-center justify-between">
              <span>{currentCategoryObj.name}</span>
              <span className="text-[9px] text-slate-400 font-normal">{currentCategoryObj.emojis.length} emojis</span>
            </div>
            <div className="grid grid-cols-7 gap-1">
              {currentCategoryObj.emojis.map((emoji, idx) => (
                <button
                  key={`${emoji}-${idx}`}
                  type="button"
                  onClick={() => onSelect(emoji)}
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-lg hover:scale-135 active:scale-95 hover:bg-brand-500/15 transition-all duration-150"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Quick Access Footer */}
      <div className="px-3 py-1.5 border-t border-slate-100 dark:border-purple-900/30 bg-slate-50/70 dark:bg-purple-950/40 flex items-center justify-between text-[11px] text-slate-400">
        <span className="text-[10px] font-medium">Quick pick:</span>
        <div className="flex items-center gap-1">
          {['❤️', '🔥', '😂', '👍', '🚀', '🎉', '💯'].map(e => (
            <button
              key={e}
              type="button"
              onClick={() => onSelect(e)}
              className="hover:scale-125 transition-transform p-0.5 text-xs"
            >
              {e}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
