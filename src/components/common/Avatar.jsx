import React, { useState, useEffect } from 'react';

export const Avatar = ({ src, name, size = 'md', status, className = '', }) => {
    const [imgError, setImgError] = useState(false);

    // Reset error state if src changes
    useEffect(() => {
        setImgError(false);
    }, [src]);

    const sizeClasses = {
        xs: 'w-6 h-6 text-[11px]',
        sm: 'w-8 h-8 text-xs font-bold',
        md: 'w-10 h-10 text-sm font-bold',
        lg: 'w-12 h-12 text-base font-bold',
        xl: 'w-16 h-16 text-2xl font-bold',
        '2xl': 'w-20 h-20 text-3xl font-bold',
    };
    const statusDotSizes = {
        xs: 'w-2 h-2 ring-1',
        sm: 'w-2.5 h-2.5 ring-1.5',
        md: 'w-3 h-3 ring-2',
        lg: 'w-3.5 h-3.5 ring-2',
        xl: 'w-4 h-4 ring-2',
        '2xl': 'w-5 h-5 ring-2',
    };
    const statusColors = {
        online: 'bg-emerald-500 ring-white dark:ring-[#0b0f19]',
        away: 'bg-amber-500 ring-white dark:ring-[#0b0f19]',
        busy: 'bg-rose-500 ring-white dark:ring-[#0b0f19]',
        offline: 'bg-slate-400 ring-white dark:ring-[#0b0f19]',
    };
    // Generate deterministic gradient for avatars
    const getGradient = (str) => {
        const gradients = [
            'from-indigo-600 to-purple-600',
            'from-blue-600 to-cyan-500',
            'from-violet-600 to-fuchsia-600',
            'from-emerald-600 to-teal-500',
            'from-rose-500 to-pink-600',
            'from-amber-500 to-orange-600',
            'from-teal-600 to-emerald-500',
            'from-sky-600 to-indigo-600',
        ];
        let hash = 0;
        for (let i = 0; i < (str || '').length; i++) {
            hash = str.charCodeAt(i) + ((hash << 5) - hash);
        }
        return gradients[Math.abs(hash) % gradients.length];
    };
    // User's first letter
    const firstLetter = (() => {
        if (!name)
            return '?';
        const trimmed = name.trim();
        // Check if starts with emoji (e.g. 🚀 Product Launch or 🎨 Design Systems)
        const match = trimmed.match(/(\p{Emoji_Presentation}|\p{Extended_Pictographic})/u);
        if (match && trimmed.startsWith(match[0])) {
            return match[0];
        }
        return trimmed.charAt(0).toUpperCase();
    })();

    return (
      <div className={`relative inline-flex flex-shrink-0 select-none ${className}`}>
        {src && !imgError ? (
          <img
            src={src}
            alt={name || 'Avatar'}
            onError={() => setImgError(true)}
            className={`${sizeClasses[size] || sizeClasses.md} rounded-full object-cover object-center aspect-square shadow-sm ring-1 ring-black/10 dark:ring-white/20`}
          />
        ) : (
          <div className={`${sizeClasses[size] || sizeClasses.md} rounded-full aspect-square bg-gradient-to-tr ${getGradient(name)} flex items-center justify-center font-bold text-white shadow-sm ring-1 ring-white/20`}>
            <span>{firstLetter}</span>
          </div>
        )}

        {status && (
          <span className={`absolute bottom-0 right-0 rounded-full ${statusColors[status]} ${statusDotSizes[size]} transition-all duration-300 shadow-sm`} title={`Status: ${status}`}/>
        )}
      </div>
    );
};
