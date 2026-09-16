import React from 'react';
import { useChat } from '../../context/ChatContext.jsx';
/**
 * ChatBackground: Dynamically renders selected wallpaper pattern and ambient glow mesh
 */
export const ChatBackground = ({ className = '' }) => {
    const { wallpaperTheme } = useChat();
    return (<div aria-hidden="true" className={`absolute inset-0 overflow-hidden pointer-events-none select-none z-0 ${className}`}>
      {/* 1. Base Ambient Canvas & Orbs */}
      {wallpaperTheme === 'sunset-aurora' ? (<>
          <div className="absolute inset-0 bg-gradient-to-br from-amber-50/90 via-rose-50/80 to-purple-50/70 dark:from-[#130d1a] dark:via-[#190e1d] dark:to-[#0f0914]"/>
          <div className="absolute -top-20 -right-20 w-[480px] h-[480px] rounded-full bg-gradient-to-br from-amber-500/25 via-rose-500/20 to-transparent blur-3xl animate-pulse-subtle"/>
          <div className="absolute top-1/3 -left-28 w-[440px] h-[440px] rounded-full bg-gradient-to-tr from-orange-500/20 via-pink-500/15 to-transparent blur-3xl animate-pulse-subtle" style={{ animationDelay: '1.5s' }}/>
          <div className="absolute -bottom-20 right-1/4 w-[500px] h-[500px] rounded-full bg-gradient-to-tl from-purple-600/20 via-rose-500/15 to-transparent blur-3xl animate-pulse-subtle" style={{ animationDelay: '3s' }}/>
        </>) : (<>
          <div className="absolute inset-0 bg-gradient-to-br from-slate-100/90 via-slate-50/80 to-purple-50/50 dark:from-[#090714] dark:via-[#0e0b1f] dark:to-[#080613]"/>
          <div className="absolute -top-20 -right-20 w-[460px] h-[460px] rounded-full bg-gradient-to-br from-purple-600/20 via-violet-500/15 to-transparent blur-3xl animate-pulse-subtle"/>
          <div className="absolute top-1/3 -left-28 w-[420px] h-[420px] rounded-full bg-gradient-to-tr from-fuchsia-500/18 via-purple-500/14 to-transparent blur-3xl animate-pulse-subtle" style={{ animationDelay: '1.5s' }}/>
          <div className="absolute -bottom-20 right-1/4 w-[480px] h-[480px] rounded-full bg-gradient-to-tl from-indigo-600/16 via-violet-500/12 to-transparent blur-3xl animate-pulse-subtle" style={{ animationDelay: '3s' }}/>
        </>)}

      {/* 2. Theme Patterns */}
      {wallpaperTheme === 'doodle' && (<svg className="absolute inset-0 w-full h-full text-slate-700 dark:text-purple-300 opacity-[0.11] dark:opacity-[0.14]" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
          <defs>
            <pattern id="chat-doodle-pattern" x="0" y="0" width="120" height="120" patternUnits="userSpaceOnUse">
              {/* Paper Airplane */}
              <path d="M14 22 L32 16 L25 34 L22 26 L14 22 Z M22 26 L31 17" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              {/* Chat Bubble with 3 dots */}
              <g transform="translate(68, 12)">
                <rect x="0" y="0" width="24" height="17" rx="5" fill="none" stroke="currentColor" strokeWidth="1.8"/>
                <path d="M4 17 L2 21 L8 17" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
                <circle cx="6" cy="8.5" r="1.3" fill="currentColor"/>
                <circle cx="12" cy="8.5" r="1.3" fill="currentColor"/>
                <circle cx="18" cy="8.5" r="1.3" fill="currentColor"/>
              </g>
              {/* Sparkle Star */}
              <path d="M106 32 Q106 37 111 37 Q106 37 106 42 Q106 37 101 37 Q106 37 106 32 Z" fill="currentColor"/>
              {/* Small Heart */}
              <path d="M18 64 C18 64 12 59 12 55 C12 52.5 14 51 16.5 51 C18 51 19 52 19 52 C19 52 20 51 21.5 51 C24 51 26 52.5 26 55 C26 59 18 64 18 64 Z" fill="currentColor" fillOpacity="0.3" stroke="currentColor" strokeWidth="1.8"/>
              {/* Double Check / Delivery tick */}
              <g transform="translate(48, 54)">
                <path d="M2 7 L6 11 L14 3" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M7 7 L10 10 L17 3" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </g>
              {/* Smiley Face */}
              <g transform="translate(86, 60)">
                <circle cx="10" cy="10" r="9" fill="none" stroke="currentColor" strokeWidth="1.8"/>
                <circle cx="7" cy="8" r="1.3" fill="currentColor"/>
                <circle cx="13" cy="8" r="1.3" fill="currentColor"/>
                <path d="M6 12 Q10 16 14 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
              </g>
              {/* Lightning bolt */}
              <path d="M32 88 L26 97 L31 97 L27 107 L36 96 L31 96 Z" fill="currentColor" fillOpacity="0.25" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"/>
              {/* Sound Wave Bars */}
              <g transform="translate(56, 94)">
                <line x1="2" y1="8" x2="2" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <line x1="6" y1="4" x2="6" y2="16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <line x1="10" y1="2" x2="10" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <line x1="14" y1="6" x2="14" y2="14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <line x1="18" y1="8" x2="18" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </g>
              {/* Coffee Cup */}
              <g transform="translate(94, 98)">
                <path d="M2 3 L14 3 L13 11 C13 13 11 14 9 14 L7 14 C5 14 3 13 3 11 Z" fill="none" stroke="currentColor" strokeWidth="1.8"/>
                <path d="M14 5 C16 5 17 6 17 7.5 C17 9 16 10 13.5 10" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
              </g>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#chat-doodle-pattern)"/>
        </svg>)}

      {wallpaperTheme === 'cyber-mesh' && (<svg className="absolute inset-0 w-full h-full text-indigo-500 dark:text-cyan-400 opacity-[0.12] dark:opacity-[0.18]" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
          <defs>
            <pattern id="cyber-grid" width="48" height="48" patternUnits="userSpaceOnUse">
              <path d="M 48 0 L 0 0 0 48" fill="none" stroke="currentColor" strokeWidth="1"/>
              <circle cx="0" cy="0" r="2" fill="currentColor"/>
              <path d="M 24 24 L 48 48" fill="none" stroke="currentColor" strokeWidth="0.8" strokeDasharray="3 3" opacity="0.6"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#cyber-grid)"/>
        </svg>)}

      {wallpaperTheme === 'dot-matrix' && (<svg className="absolute inset-0 w-full h-full text-slate-600 dark:text-brand-300 opacity-[0.16] dark:opacity-[0.2]" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
          <defs>
            <pattern id="dot-matrix-pattern" width="24" height="24" patternUnits="userSpaceOnUse">
              <circle cx="3" cy="3" r="1.5" fill="currentColor"/>
              <circle cx="15" cy="15" r="1" fill="currentColor" opacity="0.5"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#dot-matrix-pattern)"/>
        </svg>)}

      {wallpaperTheme === 'sunset-aurora' && (<svg className="absolute inset-0 w-full h-full text-amber-500 dark:text-rose-300 opacity-[0.12] dark:opacity-[0.15]" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
          <defs>
            <pattern id="sunset-pattern" width="60" height="60" patternUnits="userSpaceOnUse">
              <circle cx="30" cy="30" r="1" fill="currentColor"/>
              <path d="M 15 30 Q 30 15 45 30 T 75 30" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.4"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#sunset-pattern)"/>
        </svg>)}

      {/* 'clean-gradient' renders only the soft glass tint without pattern */}
    </div>);
};
