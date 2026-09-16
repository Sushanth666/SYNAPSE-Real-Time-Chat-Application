import React, { useState } from 'react';
import { useTheme } from '../../context/ThemeContext.jsx';
import { soundManager } from '../../utils/sound.js';
import { Plus, Moon, Sun, Volume2, VolumeX, } from 'lucide-react';
export const SidebarHeader = ({ onOpenNewChat }) => {
    const { theme, toggleTheme } = useTheme();
    const [soundEnabled, setSoundEnabled] = useState(() => soundManager.getSoundEnabled());
    const handleToggleSound = () => {
        const next = soundManager.toggleSound();
        setSoundEnabled(next);
    };
    return (<div className="h-16 px-4 border-b border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-[#111827]/80 backdrop-blur-md flex items-center justify-between flex-shrink-0">
      {/* Brand Title */}
      <div className="flex items-center gap-2.5">
        <img src="/synapse-logo.png" alt="Synapse" className="w-8 h-8 rounded-xl shadow-md shadow-cyan-500/25 object-cover ring-1 ring-cyan-500/30"/>
        <div>
          <h1 className="text-base font-extrabold tracking-tight bg-gradient-to-r from-slate-900 via-purple-600 to-violet-600 dark:from-white dark:via-purple-300 dark:to-violet-300 bg-clip-text text-transparent">
            Synapse
          </h1>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium -mt-0.5 tracking-tight truncate max-w-[150px]" title="Connected in real time">
            Connected in real time
          </p>
        </div>
      </div>

      {/* Header Actions */}
      <div className="flex items-center gap-1">
        {/* Theme Toggle */}
        <button onClick={toggleTheme} className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover-icon-purple" title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}>
          {theme === 'dark' ? <Sun className="w-4 h-4"/> : <Moon className="w-4 h-4"/>}
        </button>

        {/* Sound Toggle */}
        <button onClick={handleToggleSound} className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover-icon-purple" title={soundEnabled ? 'Mute notification sounds' : 'Unmute notification sounds'}>
          {soundEnabled ? <Volume2 className="w-4 h-4"/> : <VolumeX className="w-4 h-4 text-slate-400"/>}
        </button>

        {/* New Chat Button */}
        <button
          onClick={onOpenNewChat}
          className="group relative inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 hover:from-purple-500 hover:via-violet-500 hover:to-indigo-500 text-white text-xs font-bold tracking-wide shadow-md shadow-purple-600/30 hover:shadow-lg hover:shadow-purple-600/50 hover:scale-105 active:scale-95 transition-all duration-200 ml-1 select-none"
          title="Create a new conversation or group"
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.75] transition-transform duration-300 group-hover:rotate-90" />
          <span>New</span>
        </button>
      </div>
    </div>);
};
