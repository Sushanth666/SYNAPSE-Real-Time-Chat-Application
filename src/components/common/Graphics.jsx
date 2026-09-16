import React from 'react';
/**
 * EmptyChatGraphic: Modern animated vector illustration for the empty conversation area
 */
export const EmptyChatGraphic = ({ className = 'w-48 h-48' }) => {
    return (<div className={`relative flex items-center justify-center select-none ${className}`}>
      {/* Background ambient glow */}
      <div className="absolute w-40 h-40 rounded-full bg-gradient-to-tr from-brand-500/25 via-purple-500/20 to-cyan-500/25 blur-2xl animate-pulse-subtle pointer-events-none"/>

      <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-xl">
        <defs>
          <linearGradient id="mainBubbleGrad" x1="20" y1="30" x2="160" y2="150" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#6366f1"/>
            <stop offset="60%" stopColor="#8b5cf6"/>
            <stop offset="100%" stopColor="#06b6d4"/>
          </linearGradient>
          <linearGradient id="secondaryBubbleGrad" x1="120" y1="100" x2="180" y2="160" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#ec4899"/>
            <stop offset="100%" stopColor="#f43f5e"/>
          </linearGradient>
          <linearGradient id="orbitGrad" x1="0" y1="0" x2="200" y2="200" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#818cf8" stopOpacity="0.4"/>
            <stop offset="100%" stopColor="#c084fc" stopOpacity="0.1"/>
          </linearGradient>
          <filter id="glowFilter" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="4" result="blur"/>
            <feComposite in="SourceGraphic" in2="blur" operator="over"/>
          </filter>
        </defs>

        {/* Orbit Rings */}
        <circle cx="100" cy="100" r="72" stroke="url(#orbitGrad)" strokeWidth="1.5" strokeDasharray="4 6" className="animate-spin" style={{ animationDuration: '30s' }}/>
        <circle cx="100" cy="100" r="54" stroke="url(#orbitGrad)" strokeWidth="1.5" strokeDasharray="3 4" className="animate-spin" style={{ animationDuration: '20s', animationDirection: 'reverse' }}/>

        {/* Main Floating Chat Bubble */}
        <g className="animate-float">
          <rect x="42" y="52" width="96" height="66" rx="20" fill="url(#mainBubbleGrad)" filter="url(#glowFilter)"/>
          {/* Glass reflection highlight */}
          <path d="M48 64 Q90 56 132 64" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" opacity="0.45"/>

          {/* Speech dots */}
          <circle cx="68" cy="85" r="5" fill="#ffffff" opacity="0.9"/>
          <circle cx="90" cy="85" r="5" fill="#ffffff" opacity="0.9"/>
          <circle cx="112" cy="85" r="5" fill="#ffffff" opacity="0.9"/>

          {/* Bubble tail */}
          <path d="M52 116 L44 128 L64 116 Z" fill="url(#mainBubbleGrad)"/>
        </g>

        {/* Secondary Floating Reaction Bubble */}
        <g className="animate-float-reverse">
          <circle cx="146" cy="122" r="24" fill="url(#secondaryBubbleGrad)" filter="url(#glowFilter)"/>
          {/* Heart icon inside secondary bubble */}
          <path d="M146 128 C146 128 138 123 138 118 C138 115 140 113 143 113 C145 113 146 115 146 115 C146 115 147 113 149 113 C152 113 154 115 154 118 C154 123 146 128 146 128 Z" fill="#ffffff"/>
        </g>

        {/* Small floating sparkles */}
        <g className="animate-pulse">
          <path d="M50 38 L52 44 L58 46 L52 48 L50 54 L48 48 L42 46 L48 44 Z" fill="#38bdf8" opacity="0.8"/>
          <path d="M162 60 L163 64 L167 65 L163 66 L162 70 L161 66 L157 65 L161 64 Z" fill="#fbbf24" opacity="0.9"/>
          <circle cx="36" cy="98" r="2.5" fill="#a855f7" opacity="0.7"/>
          <circle cx="168" cy="154" r="3" fill="#06b6d4" opacity="0.8"/>
        </g>
      </svg>
    </div>);
};
/**
 * NoMessagesGraphic: Illustrated empty chat graphic for freshly created or empty conversations
 */
export const NoMessagesGraphic = ({ className = 'w-36 h-36' }) => {
    return (<div className={`relative flex items-center justify-center select-none ${className}`}>
      <div className="absolute w-28 h-28 rounded-full bg-brand-500/15 blur-xl animate-pulse pointer-events-none"/>

      <svg viewBox="0 0 160 160" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        <defs>
          <linearGradient id="paperGrad" x1="30" y1="40" x2="130" y2="120" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#818cf8"/>
            <stop offset="100%" stopColor="#4f46e5"/>
          </linearGradient>
        </defs>

        {/* Dashed trail */}
        <path d="M30 115 Q60 125 75 105 T115 65" stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="3 4" strokeLinecap="round" opacity="0.6"/>

        {/* Floating Paper Plane */}
        <g className="animate-float">
          <path d="M125 45 L50 78 L85 92 L125 45 Z" fill="url(#paperGrad)"/>
          <path d="M125 45 L85 92 L92 112 L105 84 L125 45 Z" fill="#3730a3"/>
          <path d="M85 92 L92 112 L87 97 Z" fill="#1e1b4b" opacity="0.4"/>
        </g>

        {/* Sparkles */}
        <circle cx="45" cy="55" r="2.5" fill="#38bdf8" className="animate-pulse"/>
        <circle cx="135" cy="95" r="2" fill="#fbbf24" className="animate-pulse"/>
      </svg>
    </div>);
};
/**
 * NoSearchResultsGraphic: Graphic for when searches yield 0 results
 */
export const NoSearchResultsGraphic = ({ className = 'w-32 h-32' }) => {
    return (<div className={`relative flex items-center justify-center select-none ${className}`}>
      <div className="absolute w-24 h-24 rounded-full bg-slate-500/15 blur-lg pointer-events-none"/>
      <svg viewBox="0 0 140 140" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        <circle cx="65" cy="65" r="38" stroke="#6366f1" strokeWidth="3" opacity="0.3" strokeDasharray="4 4" className="animate-spin" style={{ animationDuration: '18s' }}/>
        <g className="animate-float">
          <circle cx="65" cy="65" r="26" fill="#6366f1" fillOpacity="0.1" stroke="#6366f1" strokeWidth="3"/>
          <line x1="84" y1="84" x2="110" y2="110" stroke="#6366f1" strokeWidth="4" strokeLinecap="round"/>
          <line x1="55" y1="65" x2="75" y2="65" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round"/>
        </g>
      </svg>
    </div>);
};
