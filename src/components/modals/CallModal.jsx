import React, { useState, useEffect, useRef } from 'react';
import { useChat } from '../../context/ChatContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { Avatar } from '../common/Avatar.jsx';
import { Mic, MicOff, Video, VideoOff, PhoneOff, ScreenShare, Sparkles, Phone } from 'lucide-react';
export const CallModal = () => {
    const { user, allUsers } = useAuth();
    const { activeCall, endCall, toggleMuteCall, toggleVideoCall, activeConversation } = useChat();
    const [callDuration, setCallDuration] = useState(0);
    const [isRinging, setIsRinging] = useState(true);
    const [isScreenSharing, setIsScreenSharing] = useState(false);
    const [isCameraActive, setIsCameraActive] = useState(true);
    const [isMicMuted, setIsMicMuted] = useState(false);
    const localVideoRef = useRef(null);
    const localStreamRef = useRef(null);
    const ringToneOscRef = useRef(null);
    // Participant metadata
    const otherParticipantId = activeConversation?.participantIds.find(id => id !== user?.id);
    const otherUser = allUsers.find(u => u.id === otherParticipantId);
    const callTitle = activeConversation?.type === 'group'
        ? activeConversation.name
        : (otherUser?.name || 'Call Participant');
    const callAvatar = activeConversation?.type === 'group'
        ? activeConversation.avatar
        : otherUser?.avatar;
    // Synthesize pleasant ringing tone with Web Audio API
    useEffect(() => {
        if (!activeCall)
            return;
        let audioCtx = null;
        let timer = null;
        if (isRinging) {
            try {
                const AudioContextClass = window.AudioContext || window.webkitAudioContext;
                if (AudioContextClass) {
                    audioCtx = new AudioContextClass();
                    const playRing = () => {
                        if (!audioCtx || audioCtx.state === 'closed')
                            return;
                        const osc = audioCtx.createOscillator();
                        const gain = audioCtx.createGain();
                        osc.type = 'sine';
                        osc.frequency.setValueAtTime(440, audioCtx.currentTime);
                        gain.gain.setValueAtTime(0.04, audioCtx.currentTime);
                        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 1.2);
                        osc.connect(gain);
                        gain.connect(audioCtx.destination);
                        osc.start();
                        osc.stop(audioCtx.currentTime + 1.2);
                    };
                    playRing();
                    timer = setInterval(playRing, 2600);
                }
            }
            catch { }
            // Auto-connect call after 2.8 seconds of ringing
            const connectTimer = setTimeout(() => {
                setIsRinging(false);
            }, 2800);
            return () => {
                clearInterval(timer);
                clearTimeout(connectTimer);
                if (audioCtx && audioCtx.state !== 'closed') {
                    audioCtx.close().catch(() => { });
                }
            };
        }
    }, [activeCall, isRinging]);
    // Duration timer once connected
    useEffect(() => {
        if (!activeCall || isRinging)
            return;
        const timer = setInterval(() => {
            setCallDuration(prev => prev + 1);
        }, 1000);
        return () => clearInterval(timer);
    }, [activeCall, isRinging]);
    // Setup local webcam preview if video call
    useEffect(() => {
        if (!activeCall || isRinging || activeCall.type !== 'video' || !isCameraActive) {
            if (localStreamRef.current) {
                localStreamRef.current.getTracks().forEach(t => t.stop());
                localStreamRef.current = null;
            }
            return;
        }
        navigator.mediaDevices?.getUserMedia({ video: true, audio: true })
            .then(stream => {
            localStreamRef.current = stream;
            if (localVideoRef.current) {
                localVideoRef.current.srcObject = stream;
            }
        })
            .catch(err => {
            console.warn('Camera preview not accessible in this environment:', err);
        });
        return () => {
            if (localStreamRef.current) {
                localStreamRef.current.getTracks().forEach(t => t.stop());
                localStreamRef.current = null;
            }
        };
    }, [activeCall, isRinging, isCameraActive]);
    if (!activeCall)
        return null;
    const handleToggleMic = () => {
        setIsMicMuted(!isMicMuted);
        toggleMuteCall();
        if (localStreamRef.current) {
            localStreamRef.current.getAudioTracks().forEach(track => {
                track.enabled = isMicMuted;
            });
        }
    };
    const handleToggleCamera = () => {
        const nextState = !isCameraActive;
        setIsCameraActive(nextState);
        toggleVideoCall();
        if (localStreamRef.current) {
            localStreamRef.current.getVideoTracks().forEach(track => {
                track.enabled = nextState;
            });
        }
    };
    const formatCallTime = (secs) => {
        const mins = Math.floor(secs / 60);
        const remaining = secs % 60;
        return `${mins.toString().padStart(2, '0')}:${remaining.toString().padStart(2, '0')}`;
    };
    return (<div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 dark:bg-black/80 backdrop-blur-md dark:backdrop-blur-xl p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white/95 dark:bg-gradient-to-b dark:from-slate-900 dark:via-[#0e1424] dark:to-[#070a12] border border-slate-200/90 dark:border-slate-700/70 rounded-3xl overflow-hidden shadow-2xl flex flex-col items-center justify-between min-h-[480px] p-6 text-slate-900 dark:text-white select-none transition-colors duration-200">
        {/* Ambient background aura glow */}
        <div className="absolute -top-24 left-1/4 w-72 h-72 bg-brand-500/10 dark:bg-brand-500/20 rounded-full blur-3xl pointer-events-none"/>
        <div className="absolute -bottom-24 right-1/4 w-72 h-72 bg-indigo-500/10 dark:bg-indigo-500/20 rounded-full blur-3xl pointer-events-none"/>

        {/* Top Bar: Call Type Badge & Duration */}
        <div className="w-full flex items-center justify-between z-10">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100/90 dark:bg-white/10 backdrop-blur-md border border-slate-200/80 dark:border-white/15 text-xs font-semibold text-slate-700 dark:text-white shadow-xs">
            {activeCall.type === 'video' ? (<Video className="w-3.5 h-3.5 text-brand-500 dark:text-brand-400"/>) : (<Phone className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400"/>)}
            <span className="capitalize">{activeCall.type} Call</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse"/>
          </div>

          <div className="px-3.5 py-1 rounded-full bg-slate-100/90 dark:bg-black/40 border border-slate-200/80 dark:border-white/10 font-mono text-xs text-slate-600 dark:text-slate-300 shadow-xs">
            {isRinging ? 'Connecting...' : formatCallTime(callDuration)}
          </div>
        </div>

        {/* Middle Stage: Ringing State OR Video / Speaker Stage */}
        {isRinging ? (<div className="flex flex-col items-center justify-center my-auto space-y-6 z-10">
            <div className="relative">
              {/* Animated Radar Pulse Rings */}
              <div className="absolute -inset-6 rounded-full bg-brand-500/15 dark:bg-brand-500/20 animate-ping opacity-75"/>
              <div className="absolute -inset-12 rounded-full bg-brand-500/10 dark:bg-brand-500/10 animate-pulse"/>
              <Avatar src={callAvatar} name={callTitle} size="xl"/>
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">{callTitle}</h3>
              <p className="text-xs text-brand-600 dark:text-brand-400 font-medium flex items-center justify-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 animate-spin"/>
                <span>Ringing recipient...</span>
              </p>
            </div>
          </div>) : (<div className="w-full flex-1 my-4 relative rounded-2xl overflow-hidden bg-slate-50/90 dark:bg-slate-950/80 border border-slate-200/90 dark:border-white/10 flex items-center justify-center z-10 min-h-[260px] shadow-inner">
            {/* Main Remote View: Video or Animated Speaker Avatar */}
            {activeCall.type === 'video' && !isCameraActive ? (<div className="flex flex-col items-center gap-3">
                <Avatar src={callAvatar} name={callTitle} size="xl"/>
                <span className="text-xs text-slate-500 dark:text-slate-400">Remote participant camera active</span>
              </div>) : activeCall.type === 'video' ? (
            /* High-quality interactive remote stream with participant */
            <div className="relative w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-900 to-indigo-950">
                <div className="flex flex-col items-center gap-3">
                  <div className="relative">
                    <Avatar src={callAvatar} name={callTitle} size="xl"/>
                    <span className="absolute bottom-1 right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 ring-2 ring-slate-900"/>
                  </div>
                  <div className="text-center">
                    <h4 className="text-sm font-bold text-white">{callTitle}</h4>
                    {/* Simulated Voice wave bars */}
                    <div className="flex items-center gap-1 justify-center mt-2 h-4">
                      {[30, 60, 90, 45, 80, 50, 75].map((h, i) => (<div key={i} className="w-1 bg-brand-400 rounded-full animate-sound-wave-2" style={{ height: `${h}%`, animationDelay: `${i * 120}ms` }}/>))}
                    </div>
                  </div>
                </div>
              </div>) : (
            /* Voice Call Connected Screen */
            <div className="flex flex-col items-center justify-center gap-4 py-8">
                <div className="relative">
                  <div className="absolute -inset-3 rounded-full bg-emerald-500/20 animate-pulse"/>
                  <Avatar src={callAvatar} name={callTitle} size="xl"/>
                </div>
                <div className="text-center">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">{callTitle}</h3>
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-0.5">High Definition Audio Connected</p>
                </div>
                {/* Real-time wave visualizer */}
                <div className="flex items-center gap-1.5 h-6 mt-1">
                  {[20, 50, 80, 40, 95, 60, 30, 85, 45, 70, 30].map((val, idx) => (<div key={idx} className="w-1.5 bg-gradient-to-t from-brand-500 to-emerald-500 dark:from-brand-500 dark:to-emerald-400 rounded-full animate-pulse" style={{
                        height: `${Math.max(6, Math.sin((callDuration * 3) + idx) * 12 + 14)}px`,
                        animationDelay: `${idx * 80}ms`
                    }}/>))}
                </div>
              </div>)}

            {/* Local Video Picture-in-Picture Card */}
            {activeCall.type === 'video' && (<div className="absolute bottom-3 right-3 w-32 sm:w-40 aspect-video rounded-xl overflow-hidden border border-slate-300 dark:border-white/20 bg-slate-900 shadow-xl">
                {isCameraActive ? (<video ref={localVideoRef} autoPlay muted playsInline className="w-full h-full object-cover scale-x-[-1]"/>) : (<div className="w-full h-full flex flex-col items-center justify-center bg-slate-800 text-slate-400 text-[10px]">
                    <VideoOff className="w-4 h-4 mb-1 text-slate-500"/>
                    <span>Camera Off</span>
                  </div>)}
                <span className="absolute bottom-1 left-1.5 text-[9px] px-1.5 py-0.2 rounded bg-black/60 text-white font-medium">
                  You
                </span>
              </div>)}
          </div>)}

        {/* Bottom Control Bar */}
        <div className="flex items-center justify-center gap-3 sm:gap-4 z-10 w-full pt-2">
          {/* Mute Microphone */}
          <button type="button" onClick={handleToggleMic} className={`p-3.5 rounded-2xl transition-all duration-150 active:scale-95 flex items-center justify-center shadow-lg ${isMicMuted
            ? 'bg-rose-500/15 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-300 dark:border-rose-500/40 hover:bg-rose-500/25'
            : 'bg-slate-100 hover:bg-slate-200 dark:bg-[#1e2738] dark:hover:bg-[#28344c] text-slate-700 dark:text-white border border-slate-200/90 dark:border-slate-700/60'}`} title={isMicMuted ? 'Unmute microphone' : 'Mute microphone'}>
            {isMicMuted ? <MicOff className="w-5 h-5"/> : <Mic className="w-5 h-5"/>}
          </button>

          {/* Video Toggle (if video call) */}
          {activeCall.type === 'video' && (<button type="button" onClick={handleToggleCamera} className={`p-3.5 rounded-2xl transition-all duration-150 active:scale-95 flex items-center justify-center shadow-lg ${!isCameraActive
                ? 'bg-rose-500/15 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-300 dark:border-rose-500/40 hover:bg-rose-500/25'
                : 'bg-slate-100 hover:bg-slate-200 dark:bg-[#1e2738] dark:hover:bg-[#28344c] text-slate-700 dark:text-white border border-slate-200/90 dark:border-slate-700/60'}`} title={isCameraActive ? 'Turn off camera' : 'Turn on camera'}>
              {isCameraActive ? <Video className="w-5 h-5"/> : <VideoOff className="w-5 h-5"/>}
            </button>)}

          {/* Screen Share simulation */}
          {activeCall.type === 'video' && (<button type="button" onClick={() => setIsScreenSharing(!isScreenSharing)} className={`p-3.5 rounded-2xl transition-all duration-150 active:scale-95 flex items-center justify-center shadow-lg ${isScreenSharing
                ? 'bg-brand-500 text-white border border-brand-400 hover:bg-brand-600'
                : 'bg-slate-100 hover:bg-slate-200 dark:bg-[#1e2738] dark:hover:bg-[#28344c] text-slate-700 dark:text-white border border-slate-200/90 dark:border-slate-700/60'}`} title="Toggle screen share">
              <ScreenShare className="w-5 h-5"/>
            </button>)}

          {/* End Call button */}
          <button type="button" onClick={endCall} className="p-3.5 px-6 rounded-2xl bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white font-semibold transition-all duration-150 active:scale-95 flex items-center gap-2 shadow-xl shadow-rose-600/30" title="End call">
            <PhoneOff className="w-5 h-5"/>
            <span className="text-xs font-bold">End</span>
          </button>
        </div>
      </div>
    </div>);
};
