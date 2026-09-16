import React, { useState, useRef, useEffect } from 'react';
import { useChat } from '../../context/ChatContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { Avatar } from '../common/Avatar.jsx';
import { MarkdownText } from './MarkdownText.jsx';
import { X, Send, Paperclip, CornerDownRight, MessageSquare, Clock } from 'lucide-react';
export const ThreadDrawer = () => {
    const { user, allUsers } = useAuth();
    const { activeThreadMessage, closeThread, threadMessages, sendThreadReply } = useChat();
    const [text, setText] = useState('');
    const [attachments, setAttachments] = useState([]);
    const textareaRef = useRef(null);
    const repliesEndRef = useRef(null);
    const fileInputRef = useRef(null);
    const parentId = activeThreadMessage?.id || '';
    const replies = parentId ? (threadMessages[parentId] || []) : [];
    // Auto-scroll to bottom on new reply
    useEffect(() => {
        repliesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [replies.length]);
    if (!activeThreadMessage)
        return null;
    const parentSender = allUsers.find(u => u.id === activeThreadMessage.senderId);
    const parentSenderName = parentSender?.name || (activeThreadMessage.senderId === user?.id ? 'You' : 'Team Member');
    const handleSend = async (e) => {
        if (e)
            e.preventDefault();
        if (!text.trim() && attachments.length === 0)
            return;
        const replyText = text.trim();
        const replyAtts = [...attachments];
        setText('');
        setAttachments([]);
        await sendThreadReply(activeThreadMessage.id, replyText, replyAtts);
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
        }
    };
    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };
    const handleFileUpload = (e) => {
        const file = e.target.files?.[0];
        if (!file)
            return;
        const url = URL.createObjectURL(file);
        setAttachments(prev => [
            ...prev,
            {
                id: `att_${Date.now()}`,
                name: file.name,
                size: file.size,
                type: file.type,
                url,
                thumbnail: file.type.startsWith('image/') ? url : undefined
            }
        ]);
        if (fileInputRef.current)
            fileInputRef.current.value = '';
    };
    const formatTime = (iso) => {
        if (!iso)
            return '';
        const d = new Date(iso);
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };
    return (<aside className="w-full sm:w-[400px] lg:w-[420px] flex-shrink-0 h-full border-l border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-[#0e1320]/95 backdrop-blur-xl flex flex-col z-30 shadow-2xl animate-in slide-in-from-right duration-200">
      {/* Thread Header */}
      <div className="h-16 px-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-white/60 dark:bg-[#131929]/70 backdrop-blur-md">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-brand-500/15 text-brand-500 flex items-center justify-center flex-shrink-0">
            <MessageSquare className="w-4 h-4"/>
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5 truncate">
              <span>Thread</span>
              <span className="text-xs font-normal text-slate-400">with {parentSenderName}</span>
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
              {replies.length} {replies.length === 1 ? 'reply' : 'replies'}
            </p>
          </div>
        </div>

        <button onClick={closeThread} className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" title="Close thread">
          <X className="w-4 h-4"/>
        </button>
      </div>

      {/* Thread Content Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Parent Message Card */}
        <div className="p-3.5 rounded-2xl bg-slate-100/80 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/70 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Avatar src={parentSender?.avatar} name={parentSenderName} size="sm"/>
              <div>
                <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                  {parentSenderName}
                </span>
                <span className="text-[10px] text-slate-400 ml-2">
                  {formatTime(activeThreadMessage.createdAt)}
                </span>
              </div>
            </div>
          </div>

          <div className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 pl-1">
            <MarkdownText text={activeThreadMessage.text}/>
          </div>

          {/* Attachments if any */}
          {activeThreadMessage.attachments && activeThreadMessage.attachments.length > 0 && (<div className="flex flex-wrap gap-1.5 pt-1">
              {activeThreadMessage.attachments.map(att => (<div key={att.id} className="px-2 py-1 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-[11px] text-slate-700 dark:text-slate-200 truncate max-w-[200px]">
                  📎 {att.name}
                </div>))}
            </div>)}
        </div>

        {/* Replies Divider */}
        <div className="flex items-center gap-2 my-3 select-none">
          <div className="h-px bg-slate-200 dark:bg-slate-800 flex-1"/>
          <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1 uppercase tracking-wider">
            <CornerDownRight className="w-3 h-3 text-brand-400"/>
            {replies.length} {replies.length === 1 ? 'Reply' : 'Replies'}
          </span>
          <div className="h-px bg-slate-200 dark:bg-slate-800 flex-1"/>
        </div>

        {/* Replies List */}
        {replies.length === 0 ? (<div className="py-8 text-center text-slate-400 space-y-2">
            <Clock className="w-6 h-6 mx-auto opacity-40 text-brand-400 animate-pulse"/>
            <p className="text-xs">No replies in this thread yet.</p>
            <p className="text-[11px] text-slate-500">Be the first to reply below.</p>
          </div>) : (replies.map(reply => {
            const isMe = reply.senderId === user?.id;
            const sender = allUsers.find(u => u.id === reply.senderId);
            const senderName = isMe ? 'You' : (sender?.name || 'Team Member');
            return (<div key={reply.id} className="flex items-start gap-2.5 animate-in fade-in slide-in-from-bottom-1 duration-150">
                <Avatar src={isMe ? user?.avatar : sender?.avatar} name={senderName} size="sm"/>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                      {senderName}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {formatTime(reply.createdAt)}
                    </span>
                  </div>

                  <div className={`p-3 rounded-2xl text-xs sm:text-sm leading-relaxed ${isMe
                    ? 'bg-gradient-to-tr from-purple-600 via-violet-600 to-indigo-500 text-white rounded-tr-xs shadow-sm shadow-purple-500/20'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-tl-xs border border-slate-200/80 dark:border-slate-700/80'}`}>
                    <MarkdownText text={reply.text} isMe={isMe}/>

                    {/* Attachments */}
                    {reply.attachments && reply.attachments.length > 0 && (<div className="mt-2 space-y-1">
                        {reply.attachments.map(att => (<div key={att.id} className={`px-2 py-1 rounded-lg text-xs truncate max-w-full ${isMe ? 'bg-white/20 text-white' : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200'}`}>
                            📎 {att.name}
                          </div>))}
                      </div>)}
                  </div>
                </div>
              </div>);
        }))}
        <div ref={repliesEndRef}/>
      </div>

      {/* Thread Input Box */}
      <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-[#111827]/90 backdrop-blur-md">
        {/* Attachment preview */}
        {attachments.length > 0 && (<div className="mb-2 flex flex-wrap gap-1.5">
            {attachments.map(att => (<div key={att.id} className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-[11px] text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
                <span className="truncate max-w-[120px]">{att.name}</span>
                <button type="button" onClick={() => setAttachments([])} className="text-slate-400 hover:text-rose-400">
                  <X className="w-3 h-3"/>
                </button>
              </div>))}
          </div>)}

        <div className="flex items-end gap-2">
          <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden"/>
          <button type="button" onClick={() => fileInputRef.current?.click()} className="p-2 text-slate-400 hover-icon-purple rounded-xl transition-colors flex-shrink-0" title="Attach file to thread reply">
            <Paperclip className="w-4 h-4"/>
          </button>

          <div className="flex-1 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl px-3 py-2 focus-within:border-brand-500 transition-all flex items-center">
            <textarea ref={textareaRef} rows={1} value={text} onChange={e => setText(e.target.value)} onKeyDown={handleKeyDown} placeholder={`Reply in thread... (Enter to send)`} className="w-full bg-transparent text-xs sm:text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none resize-none leading-relaxed max-h-28"/>
          </div>

          <button type="button" onClick={() => handleSend()} disabled={!text.trim() && attachments.length === 0} className="p-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 disabled:opacity-40 disabled:hover:bg-brand-600 text-white shadow-md shadow-brand-500/20 active:scale-95 transition-all flex-shrink-0" title="Send reply">
            <Send className="w-4 h-4"/>
          </button>
        </div>
      </div>
    </aside>);
};
