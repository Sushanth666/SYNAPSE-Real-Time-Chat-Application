import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause } from 'lucide-react';
export const VoiceMemoPlayer = ({ voiceMemo, isMe }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [playbackRate, setPlaybackRate] = useState(1);
    const [audioDuration, setAudioDuration] = useState(voiceMemo.duration || 12);
    const audioRef = useRef(null);
    const synthTimerRef = useRef(null);
    const lastLoadedUrlRef = useRef('');
    const duration = audioDuration || voiceMemo.duration || 12;
    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (synthTimerRef.current)
                clearInterval(synthTimerRef.current);
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current = null;
            }
        };
    }, []);
    const togglePlay = () => {
        if (isPlaying) {
            pauseAudio();
        }
        else {
            playAudio();
        }
    };
    const playAudio = () => {
        setIsPlaying(true);
        const hasAudioUrl = Boolean(voiceMemo.url &&
            (voiceMemo.url.startsWith('http') ||
                voiceMemo.url.startsWith('/') ||
                voiceMemo.url.startsWith('data:') ||
                voiceMemo.url.startsWith('blob:')));
        if (hasAudioUrl) {
            if (!audioRef.current || lastLoadedUrlRef.current !== voiceMemo.url) {
                if (audioRef.current) {
                    audioRef.current.pause();
                }
                const audio = new Audio(voiceMemo.url);
                audio.volume = 1.0;
                lastLoadedUrlRef.current = voiceMemo.url;
                audio.onloadedmetadata = () => {
                    if (audio.duration && isFinite(audio.duration) && audio.duration > 0) {
                        setAudioDuration(Math.round(audio.duration));
                    }
                };
                audio.onended = () => {
                    setIsPlaying(false);
                    setCurrentTime(0);
                };
                audio.ontimeupdate = () => {
                    setCurrentTime(audio.currentTime);
                };
                audioRef.current = audio;
            }
            const audio = audioRef.current;
            audio.playbackRate = playbackRate;
            if (currentTime > 0 && Math.abs(audio.currentTime - currentTime) > 0.3) {
                audio.currentTime = currentTime;
            }
            audio.play().catch((err) => {
                console.warn('HTML5 Audio playback failed, using synthesizer fallback:', err);
                simulatePlayback();
            });
        }
        else {
            simulatePlayback();
        }
    };
    const pauseAudio = () => {
        setIsPlaying(false);
        if (audioRef.current) {
            audioRef.current.pause();
        }
        if (synthTimerRef.current) {
            clearInterval(synthTimerRef.current);
        }
    };
    const playSynthesizerBeep = () => {
        try {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (AudioCtx) {
                const ctx = new AudioCtx();
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(440, ctx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(580, ctx.currentTime + 0.15);
                gain.gain.setValueAtTime(0.08, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start();
                osc.stop(ctx.currentTime + 0.2);
            }
        }
        catch { }
    };
    const simulatePlayback = () => {
        if (synthTimerRef.current)
            clearInterval(synthTimerRef.current);
        playSynthesizerBeep();
        const intervalMs = 100 / playbackRate;
        synthTimerRef.current = setInterval(() => {
            setCurrentTime(prev => {
                if (prev >= duration) {
                    clearInterval(synthTimerRef.current);
                    setIsPlaying(false);
                    return 0;
                }
                return prev + 0.1 * playbackRate;
            });
        }, intervalMs);
    };
    const toggleSpeed = (e) => {
        e.stopPropagation();
        const speeds = [1, 1.5, 2];
        const nextIdx = (speeds.indexOf(playbackRate) + 1) % speeds.length;
        const nextRate = speeds[nextIdx];
        setPlaybackRate(nextRate);
        if (audioRef.current) {
            audioRef.current.playbackRate = nextRate;
        }
    };
    const handleSeek = (index, total) => {
        const target = (index / total) * duration;
        setCurrentTime(target);
        if (audioRef.current) {
            audioRef.current.currentTime = target;
        }
    };
    const formatTime = (secs) => {
        const m = Math.floor(secs / 60);
        const s = Math.floor(secs % 60);
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };
    // Generate or use waveform amplitudes
    const bars = voiceMemo.waveform && voiceMemo.waveform.length > 0
        ? voiceMemo.waveform
        : [20, 45, 60, 80, 40, 65, 95, 75, 45, 60, 90, 100, 70, 50, 65, 40, 85, 90, 60, 35, 55, 70, 45, 25];
    const progressPercent = (currentTime / duration) * 100;
    return (<div className={`flex items-center gap-3 p-2.5 rounded-2xl min-w-[240px] select-none transition-all duration-200 ${isMe
            ? 'bg-brand-700/40 border border-brand-400/30 text-white shadow-sm'
            : 'bg-slate-100 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 text-slate-800 dark:text-slate-100 shadow-sm'}`}>
      {/* Play/Pause Button with pulse glow when active */}
      <button onClick={togglePlay} className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 shadow-md transition-all active:scale-95 ${isPlaying ? 'ring-2 ring-brand-400/50 scale-105' : ''} ${isMe
            ? 'bg-white text-brand-600 hover:bg-white/90'
            : 'bg-brand-600 text-white hover:bg-brand-500'}`} title={isPlaying ? 'Pause' : 'Play voice memo'}>
        {isPlaying ? <Pause className="w-4 h-4 fill-current"/> : <Play className="w-4 h-4 ml-0.5 fill-current"/>}
      </button>

      {/* Waveform & Scrubber */}
      <div className="flex-1 flex flex-col justify-center gap-1 min-w-0">
        <div className="flex items-center gap-1 h-8 cursor-pointer group/wave">
          {bars.map((amplitude, i) => {
            const barPercent = (i / bars.length) * 100;
            const isPlayed = barPercent <= progressPercent;
            const isCurrentBar = isPlaying && Math.abs(barPercent - progressPercent) < (100 / bars.length) * 1.5;
            return (<div key={i} onClick={() => handleSeek(i, bars.length)} className="flex-1 h-full flex items-center" title={`${Math.round((i / bars.length) * duration)}s`}>
                <div className={`w-full rounded-full transition-all duration-100 group-hover/wave:opacity-90 ${isPlayed
                    ? isMe ? 'bg-white shadow-[0_0_8px_rgba(255,255,255,0.4)]' : 'bg-brand-600 dark:bg-brand-400 shadow-[0_0_8px_rgba(168,85,247,0.45)]'
                    : isMe ? 'bg-brand-300/40' : 'bg-slate-300 dark:bg-slate-700'} ${isCurrentBar ? (i % 3 === 0 ? 'animate-sound-wave-1' : i % 3 === 1 ? 'animate-sound-wave-2' : 'animate-sound-wave-3') : ''}`} style={{
                    height: `${Math.max(20, Math.min(amplitude, 100))}%`,
                }}/>
              </div>);
        })}
        </div>

        {/* Time & Speed metadata */}
        <div className={`flex items-center justify-between text-[10px] font-medium ${isMe ? 'text-brand-200' : 'text-slate-500 dark:text-slate-400'}`}>
          <div className="flex items-center gap-1.5">
            <span>{formatTime(currentTime)} / {formatTime(duration)}</span>
            {isPlaying && (<span className="flex items-center gap-0.5 ml-1">
                <span className="w-1 h-2 rounded-full bg-current animate-sound-wave-1"/>
                <span className="w-1 h-3.5 rounded-full bg-current animate-sound-wave-2"/>
                <span className="w-1 h-2.5 rounded-full bg-current animate-sound-wave-3"/>
              </span>)}
          </div>

          <button onClick={toggleSpeed} className={`px-1.5 py-0.2 rounded font-bold transition-transform active:scale-90 ${isMe
            ? 'bg-white/20 hover:bg-white/30 text-white'
            : 'bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200'}`} title="Toggle playback speed">
            {playbackRate}x
          </button>
        </div>
      </div>
    </div>);
};
