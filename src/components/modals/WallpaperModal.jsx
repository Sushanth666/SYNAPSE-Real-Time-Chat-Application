import React from 'react';
import { useChat } from '../../context/ChatContext.jsx';
import { X, Check, Sparkles, Palette, Grid, Sun, LayoutGrid, Layers } from 'lucide-react';
const THEMES = [
    {
        id: 'doodle',
        name: 'Signature Doodle',
        description: 'Crisp vector chat icons, sparkles, hearts, and planes',
        icon: Sparkles,
        gradient: 'from-slate-800 to-indigo-950',
        accentColor: 'text-brand-400'
    },
    {
        id: 'cyber-mesh',
        name: 'Cyber Mesh',
        description: 'Subtle matrix grid and futuristic isometric circuit lines',
        icon: Grid,
        gradient: 'from-[#070b19] to-[#0d1b2a]',
        accentColor: 'text-cyan-400'
    },
    {
        id: 'dot-matrix',
        name: 'Minimal Dot Matrix',
        description: 'Clean architectural polka dot matrix for high focus',
        icon: LayoutGrid,
        gradient: 'from-[#0f172a] to-[#1e293b]',
        accentColor: 'text-blue-400'
    },
    {
        id: 'sunset-aurora',
        name: 'Sunset Aurora',
        description: 'Warm peach, coral, and glowing violet ambient lights',
        icon: Sun,
        gradient: 'from-[#1a0f24] via-[#240e1b] to-[#14081c]',
        accentColor: 'text-rose-400'
    },
    {
        id: 'clean-gradient',
        name: 'Clean Modern Glass',
        description: 'Smooth minimal tint without background patterns',
        icon: Layers,
        gradient: 'from-slate-900 to-slate-950',
        accentColor: 'text-emerald-400'
    }
];
export const WallpaperModal = () => {
    const { isWallpaperModalOpen, setIsWallpaperModalOpen, wallpaperTheme, setWallpaperTheme } = useChat();
    if (!isWallpaperModalOpen)
        return null;
    return (<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col p-6 animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-brand-500/10 text-brand-500 flex items-center justify-center">
              <Palette className="w-5 h-5"/>
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Chat Wallpaper & Themes
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Personalize the background ambiance of your chat canvas
              </p>
            </div>
          </div>

          <button onClick={() => setIsWallpaperModalOpen(false)} className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <X className="w-4 h-4"/>
          </button>
        </div>

        {/* Theme Options Grid */}
        <div className="py-4 space-y-2.5 max-h-[420px] overflow-y-auto">
          {THEMES.map(theme => {
            const isSelected = wallpaperTheme === theme.id;
            const Icon = theme.icon;
            return (<button key={theme.id} type="button" onClick={() => setWallpaperTheme(theme.id)} className={`w-full p-3.5 rounded-2xl border text-left transition-all duration-150 flex items-center gap-3.5 group relative overflow-hidden ${isSelected
                    ? 'border-brand-500 bg-brand-500/10 dark:bg-brand-500/15 shadow-sm'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30'}`}>
                {/* Mini Visual Preview Pill */}
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${theme.gradient} flex items-center justify-center flex-shrink-0 shadow-inner border border-white/10`}>
                  <Icon className={`w-6 h-6 ${theme.accentColor} transition-transform group-hover:scale-110`}/>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      {theme.name}
                    </span>
                    {isSelected && (<span className="px-2 py-0.5 rounded-full bg-brand-500 text-white text-[10px] font-bold">
                        Active
                      </span>)}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                    {theme.description}
                  </p>
                </div>

                {/* Radio checkmark */}
                <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${isSelected
                    ? 'bg-brand-500 text-white scale-100 shadow-sm'
                    : 'border border-slate-300 dark:border-slate-600 opacity-50 group-hover:opacity-100'}`}>
                  {isSelected && <Check className="w-3.5 h-3.5 stroke-[2.5]"/>}
                </div>
              </button>);
        })}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
          <button type="button" onClick={() => setIsWallpaperModalOpen(false)} className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-md shadow-brand-500/20 active:scale-95 transition-all">
            Apply & Close
          </button>
        </div>
      </div>
    </div>);
};
