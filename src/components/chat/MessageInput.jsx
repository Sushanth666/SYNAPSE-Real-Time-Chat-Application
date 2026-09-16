import React, { useState, useRef, useEffect } from 'react';
import { useChat } from '../../context/ChatContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { Avatar } from '../common/Avatar.jsx';
import { EmojiPickerPopover } from './EmojiPickerPopover.jsx';
import { Send, Paperclip, Smile, X, Reply, Pencil, Image as ImageIcon, FileText, Loader2, Check, BarChart2, Mic, Trash2, AlertCircle, Clock, Sparkles } from 'lucide-react';
export const MessageInput = () => {
    const { sendMessage, replyingTo, setReplyingTo, editingMessage, setEditingMessage, editMessage, startTyping, stopTyping, sendVoiceMemo, setIsPollModalOpen, activeConversation, scheduledMessages, cancelScheduledMessage, setIsScheduleModalOpen } = useChat();
    const { allUsers, user } = useAuth();
    const [text, setText] = useState('');
    const [attachments, setAttachments] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [showScheduledDrawer, setShowScheduledDrawer] = useState(false);
    // Filter scheduled messages for active conversation
    const convScheduled = React.useMemo(() => {
        if (!scheduledMessages || !activeConversation) return [];
        return scheduledMessages.filter(s => s.conversationId === activeConversation.id);
    }, [scheduledMessages, activeConversation]);
    // Real microphone voice recording states & refs
    const [isRecording, setIsRecording] = useState(false);
    const [recordSeconds, setRecordSeconds] = useState(0);
    const [liveWaveforms, setLiveWaveforms] = useState([12, 18, 14, 24, 16, 28, 20, 15, 25, 18, 22, 14, 20, 16, 12]);
    const [isProcessingAudio, setIsProcessingAudio] = useState(false);
    const [micError, setMicError] = useState(null);
    // @mention autocomplete state
    const [mentionQuery, setMentionQuery] = useState(null);
    const [mentionIndex, setMentionIndex] = useState(0);
    // Filter participants matching @mention query
    const mentionCandidates = React.useMemo(() => {
        if (mentionQuery === null)
            return [];
        const q = mentionQuery.toLowerCase();
        const participants = activeConversation
            ? allUsers.filter(u => activeConversation.participantIds.includes(u.id) && u.id !== user?.id)
            : allUsers.filter(u => u.id !== user?.id);
        return participants.filter(u => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
    }, [mentionQuery, activeConversation, allUsers, user?.id]);
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const audioStreamRef = useRef(null);
    const audioContextRef = useRef(null);
    const analyserRef = useRef(null);
    const animFrameRef = useRef(null);
    const recordIntervalRef = useRef(null);
    const textareaRef = useRef(null);
    const fileInputRef = useRef(null);
    // When editingMessage changes, preload textarea
    useEffect(() => {
        if (editingMessage) {
            setText(editingMessage.text);
            if (textareaRef.current) {
                textareaRef.current.focus();
            }
        }
    }, [editingMessage]);
    // Focus textarea and scroll into view when replying
    useEffect(() => {
        if (replyingTo && textareaRef.current) {
            textareaRef.current.focus();
            textareaRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }, [replyingTo]);
    // Auto-resize textarea
    const adjustHeight = () => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 140)}px`;
        }
    };
    const handleTextChange = (e) => {
        const val = e.target.value;
        setText(val);
        adjustHeight();
        if (val.trim()) {
            startTyping();
        } else {
            stopTyping();
        }
        // Check for @mention trigger at cursor
        const cursor = e.target.selectionStart || val.length;
        const textBeforeCursor = val.slice(0, cursor);
        const match = textBeforeCursor.match(/(?:^|\s)@([a-zA-Z0-9_.-]*)$/);
        if (match) {
            setMentionQuery(match[1]);
            setMentionIndex(0);
        }
        else {
            setMentionQuery(null);
        }
    };
    const insertMention = (targetUser) => {
        if (!textareaRef.current)
            return;
        const cursor = textareaRef.current.selectionStart || text.length;
        const textBeforeCursor = text.slice(0, cursor);
        const textAfterCursor = text.slice(cursor);
        const updatedBefore = textBeforeCursor.replace(/(?:^|\s)@([a-zA-Z0-9_.-]*)$/, (match) => {
            const leadingSpace = match.startsWith(' ') ? ' ' : '';
            return `${leadingSpace}@${targetUser.name} `;
        });
        const newText = updatedBefore + textAfterCursor;
        setText(newText);
        setMentionQuery(null);
        setTimeout(() => {
            if (textareaRef.current) {
                textareaRef.current.focus();
                const pos = updatedBefore.length;
                textareaRef.current.setSelectionRange(pos, pos);
            }
        }, 0);
    };
    const handleKeyDown = (e) => {
        // Keyboard navigation inside @mention dropdown
        if (mentionQuery !== null && mentionCandidates.length > 0) {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setMentionIndex(prev => (prev + 1) % mentionCandidates.length);
                return;
            }
            if (e.key === 'ArrowUp') {
                e.preventDefault();
                setMentionIndex(prev => (prev - 1 + mentionCandidates.length) % mentionCandidates.length);
                return;
            }
            if (e.key === 'Enter' || e.key === 'Tab') {
                e.preventDefault();
                insertMention(mentionCandidates[mentionIndex]);
                return;
            }
            if (e.key === 'Escape') {
                e.preventDefault();
                setMentionQuery(null);
                return;
            }
        }
        if (e.key === 'Escape') {
            if (replyingTo) {
                e.preventDefault();
                setReplyingTo(null);
                return;
            }
            if (editingMessage) {
                e.preventDefault();
                setEditingMessage(null);
                setText('');
                return;
            }
        }
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };
    const handleSend = async () => {
        if (!text.trim() && attachments.length === 0)
            return;
        if (editingMessage) {
            editMessage(editingMessage.id, text.trim());
            setText('');
            setEditingMessage(null);
        }
        else {
            const currentText = text.trim();
            const currentAttachments = [...attachments];
            setText('');
            setAttachments([]);
            stopTyping();
            if (textareaRef.current) {
                textareaRef.current.style.height = 'auto';
            }
            await sendMessage(currentText, currentAttachments);
        }
    };
    const handleFileUpload = async (e) => {
        const files = e.target.files;
        if (!files || files.length === 0)
            return;
        const file = files[0];
        setUploading(true);
        setUploadProgress(15);
        // Simulate progress while uploading
        const progressInterval = setInterval(() => {
            setUploadProgress(prev => {
                if (prev >= 85) {
                    clearInterval(progressInterval);
                    return 90;
                }
                return prev + 25;
            });
        }, 150);
        const formData = new FormData();
        formData.append('file', file);
        try {
            const res = await fetch('/api/upload', {
                method: 'POST',
                body: formData
            });
            clearInterval(progressInterval);
            setUploadProgress(100);
            if (res.ok) {
                const attachment = await res.json();
                setAttachments(prev => [...prev, attachment]);
            }
            else {
                // Fallback for demo: create data URL
                const isImage = file.type.startsWith('image/');
                const url = URL.createObjectURL(file);
                setAttachments(prev => [
                    ...prev,
                    {
                        id: `att_${Date.now()}`,
                        name: file.name,
                        size: file.size,
                        type: file.type,
                        url,
                        thumbnail: isImage ? url : undefined
                    }
                ]);
            }
        }
        catch {
            // Local fallback
            const isImage = file.type.startsWith('image/');
            const url = URL.createObjectURL(file);
            setAttachments(prev => [
                ...prev,
                {
                    id: `att_${Date.now()}`,
                    name: file.name,
                    size: file.size,
                    type: file.type,
                    url,
                    thumbnail: isImage ? url : undefined
                }
            ]);
        }
        finally {
            setTimeout(() => {
                setUploading(false);
                setUploadProgress(0);
                if (fileInputRef.current)
                    fileInputRef.current.value = '';
            }, 300);
        }
    };
    const removeAttachment = (id) => {
        setAttachments(prev => prev.filter(a => a.id !== id));
    };
    const cleanupAudioResources = () => {
        if (recordIntervalRef.current) {
            clearInterval(recordIntervalRef.current);
            recordIntervalRef.current = null;
        }
        if (animFrameRef.current) {
            cancelAnimationFrame(animFrameRef.current);
            animFrameRef.current = null;
        }
        if (audioStreamRef.current) {
            audioStreamRef.current.getTracks().forEach(track => track.stop());
            audioStreamRef.current = null;
        }
        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
            audioContextRef.current.close().catch(() => { });
            audioContextRef.current = null;
        }
        analyserRef.current = null;
        mediaRecorderRef.current = null;
    };
    const startRecording = async () => {
        setMicError(null);
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            setMicError('Microphone access is not supported in this browser.');
            return;
        }
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            audioStreamRef.current = stream;
            // Real-time audio analyser for frequency-responsive waveform visualizer
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            if (AudioContextClass) {
                const audioCtx = new AudioContextClass();
                audioContextRef.current = audioCtx;
                const analyser = audioCtx.createAnalyser();
                analyser.fftSize = 64;
                analyserRef.current = analyser;
                const source = audioCtx.createMediaStreamSource(stream);
                source.connect(analyser);
                const dataArray = new Uint8Array(analyser.frequencyBinCount);
                const updateVisualizer = () => {
                    if (analyserRef.current) {
                        analyserRef.current.getByteFrequencyData(dataArray);
                        const samples = [];
                        const step = Math.max(1, Math.floor(dataArray.length / 15));
                        for (let i = 0; i < 15; i++) {
                            const val = dataArray[i * step] || 0;
                            // Map frequency intensity to bar height in pixels (between 6px and 26px)
                            samples.push(Math.max(6, Math.min(26, Math.round((val / 255) * 22) + 6)));
                        }
                        setLiveWaveforms(samples);
                        animFrameRef.current = requestAnimationFrame(updateVisualizer);
                    }
                };
                animFrameRef.current = requestAnimationFrame(updateVisualizer);
            }
            // MediaRecorder initialization with broad format compatibility
            let mimeType = '';
            const preferredTypes = [
                'audio/webm;codecs=opus',
                'audio/webm',
                'audio/ogg;codecs=opus',
                'audio/ogg',
                'audio/mp4'
            ];
            for (const t of preferredTypes) {
                if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(t)) {
                    mimeType = t;
                    break;
                }
            }
            const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
            mediaRecorderRef.current = recorder;
            audioChunksRef.current = [];
            recorder.ondataavailable = (e) => {
                if (e.data && e.data.size > 0) {
                    audioChunksRef.current.push(e.data);
                }
            };
            recorder.start(200); // 200ms chunk interval
            setIsRecording(true);
            setRecordSeconds(0);
            recordIntervalRef.current = setInterval(() => {
                setRecordSeconds(s => s + 1);
            }, 1000);
        }
        catch (err) {
            console.error('Error accessing microphone:', err);
            cleanupAudioResources();
            setIsRecording(false);
            if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
                setMicError('Microphone permission denied. Please allow microphone access in your browser to record.');
            }
            else {
                setMicError('Unable to access microphone. Please check your audio input device.');
            }
        }
    };
    const cancelRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            try {
                mediaRecorderRef.current.stop();
            }
            catch { }
        }
        cleanupAudioResources();
        setIsRecording(false);
        setRecordSeconds(0);
        setIsProcessingAudio(false);
    };
    const finishRecording = async () => {
        if (!mediaRecorderRef.current || isProcessingAudio)
            return;
        setIsProcessingAudio(true);
        const duration = Math.max(1, recordSeconds);
        const recorder = mediaRecorderRef.current;
        const blobPromise = new Promise((resolve) => {
            recorder.onstop = () => {
                const mime = recorder.mimeType || 'audio/webm';
                const blob = new Blob(audioChunksRef.current, { type: mime });
                resolve(blob);
            };
        });
        if (recorder.state !== 'inactive') {
            recorder.stop();
        }
        try {
            const audioBlob = await blobPromise;
            let audioUrl = '';
            // Generate 28-bar visualizer snapshot
            const barsCount = 28;
            const waveform = [];
            for (let i = 0; i < barsCount; i++) {
                waveform.push(Math.floor(Math.random() * 70) + 30);
            }
            // 1. Try uploading to backend /api/upload
            try {
                const formData = new FormData();
                const ext = audioBlob.type.includes('ogg') ? 'ogg' : audioBlob.type.includes('mp4') ? 'mp4' : 'webm';
                formData.append('file', audioBlob, `voice_${Date.now()}.${ext}`);
                const res = await fetch('/api/upload', {
                    method: 'POST',
                    body: formData
                });
                if (res.ok) {
                    const data = await res.json();
                    if (data && data.url) {
                        audioUrl = data.url;
                    }
                }
            }
            catch (uploadErr) {
                console.warn('Backend upload failed, converting to Data URL fallback:', uploadErr);
            }
            // 2. Guaranteed fallback: Convert Blob to Data URL so audio is directly playable anywhere
            if (!audioUrl) {
                audioUrl = await new Promise((resolve) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result);
                    reader.readAsDataURL(audioBlob);
                });
            }
            await sendVoiceMemo(duration, waveform, audioUrl);
        }
        catch (err) {
            console.error('Failed to process voice recording:', err);
        }
        finally {
            cleanupAudioResources();
            setIsRecording(false);
            setRecordSeconds(0);
            setIsProcessingAudio(false);
        }
    };
    const formatRecordTime = (sec) => {
        const mins = Math.floor(sec / 60);
        const remaining = sec % 60;
        return `${mins}:${remaining < 10 ? '0' : ''}${remaining}`;
    };
    useEffect(() => {
        return () => {
            cleanupAudioResources();
        };
    }, []);
    const addEmoji = (emoji) => {
        setText(prev => prev + emoji);
        if (textareaRef.current) {
            textareaRef.current.focus();
        }
    };
    return (<div className="flex-shrink-0 p-3 bg-white/70 dark:bg-[#111827]/80 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 relative z-20">
      {/* @Mention Autocomplete Dropdown */}
      {mentionQuery !== null && mentionCandidates.length > 0 && (<div className="absolute bottom-full left-4 mb-2 w-72 max-h-60 overflow-y-auto bg-white dark:bg-[#151c2c] border border-slate-200 dark:border-slate-700/80 rounded-2xl shadow-2xl z-50 p-1.5 animate-in fade-in slide-in-from-bottom-2 duration-150">
          <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <span>Members</span>
            <span>Tab or ↵ to select</span>
          </div>
          <div className="mt-1 space-y-0.5">
            {mentionCandidates.map((candidate, idx) => (<button key={candidate.id} type="button" onMouseDown={e => {
                    e.preventDefault();
                    insertMention(candidate);
                }} className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-left transition-colors ${idx === mentionIndex
                    ? 'bg-brand-500/15 text-brand-600 dark:text-brand-300 font-medium'
                    : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200'}`}>
                <Avatar src={candidate.avatar} name={candidate.name} size="xs" status={candidate.status}/>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-semibold truncate flex items-center justify-between">
                    <span>{candidate.name}</span>
                    <span className="text-[10px] text-slate-400 font-normal capitalize">{candidate.status}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 truncate block">{candidate.email}</span>
                </div>
              </button>))}
          </div>
        </div>)}

      {/* GLITTER REPLYING BANNER (Top of the Chat Box) */}
      {replyingTo && (() => {
        const replySender = allUsers.find(u => u.id === replyingTo.senderId);
        const replySenderName = replyingTo.senderId === user?.id 
            ? 'yourself' 
            : (replySender?.name || replyingTo.senderName || 'Teammate');
        const replySnippet = replyingTo.text?.trim()
            || (replyingTo.attachments?.length ? `📎 ${replyingTo.attachments[0].name || 'Attachment'}` : '')
            || (replyingTo.voiceMemo ? '🎤 Voice memo' : '')
            || (replyingTo.poll ? `📊 Poll: ${replyingTo.poll.question}` : 'Original message');

        return (
          <div id="glitter-reply-box" className="relative mb-3 rounded-2xl overflow-hidden border border-purple-500/40 bg-gradient-to-r from-purple-900/30 via-fuchsia-900/25 to-purple-950/40 dark:from-purple-950/80 dark:via-fuchsia-950/60 dark:to-purple-950/80 shadow-[0_0_25px_rgba(168,85,247,0.35)] backdrop-blur-xl animate-in slide-in-from-bottom-2 duration-200">
            {/* Continuous Glitter Shimmer Strip across the top of the chat box */}
            <div className="h-1.5 w-full bg-gradient-to-r from-purple-500 via-pink-400 via-amber-300 via-cyan-400 to-purple-500 animate-glitter-shimmer" />

            <div className="p-3 flex items-center justify-between gap-3 relative">
              {/* Subtle ambient glitter blur orb */}
              <div className="absolute top-1/2 left-4 -translate-y-1/2 w-28 h-28 bg-purple-500/15 rounded-full blur-2xl pointer-events-none" />

              <div className="flex items-center gap-3 min-w-0 relative z-10">
                <div className="truncate">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-xs text-purple-700 dark:text-purple-200 tracking-tight flex items-center gap-1.5">
                      <Reply className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                      Replying to {replySenderName}
                    </span>
                  </div>

                  <p className="text-slate-700 dark:text-slate-200 truncate text-xs font-medium mt-1 pl-0.5 max-w-xl">
                    "{replySnippet}"
                  </p>
                </div>
              </div>

              <button 
                type="button"
                onClick={() => setReplyingTo(null)} 
                className="p-2 rounded-xl text-rose-500 bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 hover:scale-105 active:scale-95 transition-all flex-shrink-0 relative z-10 cursor-pointer shadow-xs"
                title="Cancel reply (Esc)"
              >
                <X className="w-4 h-4 text-rose-500 stroke-[2.5]"/>
              </button>
            </div>
          </div>
        );
      })()}

      {/* Editing Banner */}
      {editingMessage && (<div className="mb-2 p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between text-xs animate-in slide-in-from-bottom-2 duration-150">
          <div className="flex items-center gap-2 min-w-0">
            <Pencil className="w-4 h-4 text-amber-400 flex-shrink-0"/>
            <div className="truncate">
              <span className="font-semibold text-amber-300">Editing message</span>
              <p className="text-slate-400 truncate text-[11px]">Press Enter to save or cancel</p>
            </div>
          </div>
          <button onClick={() => { setEditingMessage(null); setText(''); }} className="p-1.5 rounded-xl text-rose-500 bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 transition-colors cursor-pointer" title="Cancel edit">
            <X className="w-3.5 h-3.5"/>
          </button>
        </div>)}

      {/* Microphone Error Banner */}
      {micError && (<div className="mb-2 p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-between text-xs animate-in slide-in-from-bottom-2 duration-150">
          <div className="flex items-center gap-2 min-w-0 text-rose-600 dark:text-rose-400">
            <AlertCircle className="w-4 h-4 flex-shrink-0"/>
            <p className="truncate text-xs font-medium">{micError}</p>
          </div>
          <button onClick={() => setMicError(null)} className="p-1.5 rounded-xl text-rose-500 bg-rose-500/20 hover:bg-rose-500/30 transition-colors cursor-pointer">
            <X className="w-3.5 h-3.5"/>
          </button>
        </div>)}

      {/* Attachment Preview Chips */}
      {attachments.length > 0 && (<div className="mb-2 flex flex-wrap gap-2">
          {attachments.map(att => (<div key={att.id} className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200">
              {att.type.startsWith('image/') ? (<ImageIcon className="w-3.5 h-3.5 text-brand-400"/>) : (<FileText className="w-3.5 h-3.5 text-brand-400"/>)}
              <span className="truncate max-w-[150px] font-medium">{att.name}</span>
              <button onClick={() => removeAttachment(att.id)} className="text-rose-500 hover:text-rose-600 bg-rose-500/10 hover:bg-rose-500/20 p-1 rounded-lg ml-1 cursor-pointer transition-colors" title="Remove attachment">
                <X className="w-3.5 h-3.5"/>
              </button>
            </div>))}
        </div>)}

      {/* Upload Progress Bar */}
      {uploading && (<div className="mb-2 space-y-1">
          <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium">
            <span className="flex items-center gap-1.5">
              <Loader2 className="w-3 h-3 animate-spin text-brand-400"/>
              Uploading attachment...
            </span>
            <span>{uploadProgress}%</span>
          </div>
          <div className="w-full h-1 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-brand-500 transition-all duration-150" style={{ width: `${uploadProgress}%` }}/>
          </div>
        </div>)}

      {/* Pending Scheduled Messages Drawer */}
      {convScheduled.length > 0 && (
        <div className="mb-2.5 p-2.5 rounded-2xl bg-purple-500/10 border border-purple-500/25 flex flex-col gap-1.5 animate-in slide-in-from-bottom-2 duration-200">
          <div className="flex items-center justify-between px-1">
            <button 
              type="button" 
              onClick={() => setShowScheduledDrawer(!showScheduledDrawer)}
              className="flex items-center gap-2 text-xs font-semibold text-purple-600 dark:text-purple-300 hover:underline"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>{convScheduled.length} scheduled message{convScheduled.length > 1 ? 's' : ''} pending</span>
            </button>
            <span className="text-[10px] text-slate-400 font-mono">
              Next: {new Date(convScheduled[0].scheduledFor).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>

          {showScheduledDrawer && (
            <div className="space-y-1.5 pt-1 border-t border-purple-500/20 max-h-36 overflow-y-auto">
              {convScheduled.map(item => (
                <div key={item.id} className="flex items-center justify-between p-2 rounded-xl bg-white/70 dark:bg-purple-950/40 border border-purple-500/20 text-xs">
                  <div className="min-w-0 pr-2">
                    <p className="text-slate-800 dark:text-slate-200 truncate font-medium">{item.text}</p>
                    <p className="text-[10px] text-purple-600 dark:text-purple-400 font-mono mt-0.5">
                      Will send {new Date(item.scheduledFor).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        sendMessage(item.text, item.attachments, item.conversationId);
                        cancelScheduledMessage(item.id);
                      }}
                      className="px-2 py-1 rounded-lg bg-purple-600 text-white text-[10px] font-semibold hover:bg-purple-500 transition-colors"
                      title="Send now immediately"
                    >
                      Send now
                    </button>
                    <button
                      type="button"
                      onClick={() => cancelScheduledMessage(item.id)}
                      className="p-1 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                      title="Cancel schedule"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Input row or Voice Recording bar */}
      {isRecording ? (<div className="flex items-center justify-between gap-3 px-3.5 py-2.5 bg-rose-500/10 dark:bg-rose-500/15 border border-rose-500/30 rounded-2xl animate-in slide-in-from-bottom-2 duration-150">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
            </span>
            <span className="text-xs font-semibold text-rose-600 dark:text-rose-400">
              {isProcessingAudio ? 'Processing audio...' : 'Recording Voice Note'}
            </span>
            <span className="font-mono text-xs text-slate-700 dark:text-slate-200 bg-white/80 dark:bg-slate-800/80 px-2 py-0.5 rounded-md shadow-sm">
              {formatRecordTime(recordSeconds)}
            </span>
          </div>

          {/* Dynamic real-time recording waveform visualizer */}
          <div className="flex items-center gap-1 flex-1 max-w-[200px] h-7 justify-center px-2">
            {liveWaveforms.map((h, i) => (<div key={i} className="w-1.5 bg-rose-500 rounded-full transition-all duration-75" style={{
                    height: `${h}px`,
                }}/>))}
          </div>

          <div className="flex items-center gap-1.5">
            <button type="button" disabled={isProcessingAudio} onClick={cancelRecording} className="p-2 text-slate-400 hover:text-rose-400 hover:bg-white/80 dark:hover:bg-slate-800 rounded-xl transition-colors disabled:opacity-40" title="Cancel recording">
              <Trash2 className="w-4 h-4"/>
            </button>
            <button type="button" disabled={isProcessingAudio} onClick={finishRecording} className="p-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl shadow-md shadow-rose-500/20 active:scale-95 transition-all flex items-center gap-1.5 text-xs font-semibold px-3 disabled:opacity-50" title="Send voice note">
              {isProcessingAudio ? (<>
                  <Loader2 className="w-3.5 h-3.5 animate-spin"/>
                  <span>Saving...</span>
                </>) : (<>
                  <Send className="w-3.5 h-3.5"/>
                  <span>Send</span>
                </>)}
            </button>
          </div>
        </div>) : (<div className="flex items-end gap-2">
          {/* Attachment button */}
          <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept="image/*,.pdf,.doc,.docx,.txt"/>
          <button type="button" onClick={() => fileInputRef.current?.click()} className="p-2.5 text-slate-500 dark:text-slate-400 hover-icon-purple rounded-xl transition-colors flex-shrink-0" title="Attach image or file">
            <Paperclip className="w-5 h-5"/>
          </button>

          {/* Create Poll button */}
          <button type="button" onClick={() => setIsPollModalOpen(true)} className="p-2.5 text-slate-500 dark:text-slate-400 hover-icon-purple rounded-xl transition-colors flex-shrink-0" title="Create an interactive poll">
            <BarChart2 className="w-5 h-5"/>
          </button>

          {/* Emoji trigger & popover */}
          <div className="relative flex-shrink-0">
            <button type="button" onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="p-2.5 text-slate-500 dark:text-slate-400 hover-icon-purple rounded-xl transition-colors" title="Emoji picker">
              <Smile className="w-5 h-5"/>
            </button>

            {showEmojiPicker && (
              <EmojiPickerPopover
                onSelect={addEmoji}
                onClose={() => setShowEmojiPicker(false)}
              />
            )}
          </div>

          {/* Main Textarea */}
          <div className="flex-1 bg-slate-100 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl px-3.5 py-2.5 focus-within:border-brand-500 focus-within:ring-1 focus-within:ring-brand-500 transition-all flex items-center">
            <textarea ref={textareaRef} rows={1} value={text} onChange={handleTextChange} onKeyDown={handleKeyDown} placeholder={editingMessage ? 'Update your message...' : 'Type a message... (Enter to send, Shift+Enter for newline)'} className="w-full bg-transparent text-xs sm:text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none resize-none leading-relaxed max-h-32"/>
          </div>

          {/* Voice Memo Mic Button */}
          {!text.trim() && attachments.length === 0 && !editingMessage && (<button type="button" onClick={startRecording} className="p-2.5 rounded-2xl text-slate-500 dark:text-slate-400 hover-icon-purple rounded-xl transition-colors flex-shrink-0" title="Record voice memo">
              <Mic className="w-5 h-5"/>
            </button>)}

          {/* Schedule Message (Send Later) Button */}
          {!editingMessage && (
            <button 
              type="button" 
              onClick={() => setIsScheduleModalOpen(true)} 
              disabled={!text.trim() && attachments.length === 0} 
              className="p-2.5 rounded-2xl text-slate-500 dark:text-slate-400 hover-icon-purple disabled:opacity-40 disabled:hover:scale-100 transition-all flex-shrink-0" 
              title="Schedule message (Send later)"
            >
              <Clock className="w-5 h-5"/>
            </button>
          )}

          {/* Send Button */}
          <button type="button" onClick={handleSend} disabled={!text.trim() && attachments.length === 0} className="p-2.5 rounded-2xl bg-gradient-to-tr from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 disabled:opacity-40 disabled:hover:from-purple-600 disabled:hover:to-violet-600 text-white shadow-md shadow-purple-500/30 active:scale-95 transition-all flex-shrink-0" title="Send message (Enter)">
            {editingMessage ? <Check className="w-5 h-5"/> : <Send className="w-5 h-5"/>}
          </button>
        </div>)}
    </div>);
};
