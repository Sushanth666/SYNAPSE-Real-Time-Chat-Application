import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useChat } from '../../context/ChatContext.jsx';
import { Avatar } from '../common/Avatar.jsx';
import { PollCard } from './PollCard.jsx';
import { VoiceMemoPlayer } from './VoiceMemoPlayer.jsx';
import { CodeSnippet } from './CodeSnippet.jsx';
import { format } from 'date-fns';
import { Check, CheckCheck, Clock, AlertCircle, RotateCcw, Smile, Reply, Pencil, Trash2, Copy, FileText, Download, ExternalLink, CornerDownRight, Pin, Star, Forward, MessageSquare } from 'lucide-react';
import { MarkdownText } from './MarkdownText.jsx';
export const MessageItem = ({ message, isGroup, onJumpToMessage, isHighlighted = false, }) => {
    const { user, allUsers } = useAuth();
    const { reactToMessage, deleteMessage, setReplyingTo, setEditingMessage, retryMessage, setLightboxImage, messageSearchQuery, votePoll, togglePinMessage, toggleStarMessage, openThread, setForwardingMessage, replyingTo, showToast } = useChat();
    const isMe = user?.id === message.senderId;
    const sender = allUsers.find(u => u.id === message.senderId);
    const senderName = isMe ? 'You' : (sender?.name || 'User');
    const isMentioned = Boolean(!isMe &&
        user &&
        (message.mentions?.includes(user.id) ||
            (user.name && message.text.toLowerCase().includes(`@${user.name.toLowerCase()}`))));
    const formatTimeAgo = (iso) => {
        if (!iso)
            return '';
        try {
            const diffMs = Date.now() - new Date(iso).getTime();
            const diffMins = Math.floor(diffMs / (60 * 1000));
            if (diffMins < 1)
                return 'just now';
            if (diffMins < 60)
                return `${diffMins}m ago`;
            const diffHours = Math.floor(diffMins / 60);
            if (diffHours < 24)
                return `${diffHours}h ago`;
            return `${Math.floor(diffHours / 24)}d ago`;
        }
        catch {
            return '';
        }
    };
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [copied, setCopied] = useState(false);
    // Time format
    const formattedTime = (() => {
        try {
            return format(new Date(message.createdAt), 'h:mm a');
        }
        catch {
            return '';
        }
    })();

    const fallbackCopyText = (str) => {
        try {
            const el = document.createElement('textarea');
            el.value = str;
            el.setAttribute('readonly', '');
            el.style.position = 'fixed';
            el.style.opacity = '0';
            document.body.appendChild(el);
            el.select();
            document.execCommand('copy');
            document.body.removeChild(el);
        } catch { }
    };

    const handleCopy = () => {
        const textToCopy = message.text || message.attachments?.[0]?.url || message.attachments?.[0]?.name || (message.poll ? `Poll: ${message.poll.question}` : '');
        if (textToCopy) {
            try {
                if (navigator?.clipboard?.writeText) {
                    navigator.clipboard.writeText(textToCopy).catch(() => {
                        fallbackCopyText(textToCopy);
                    });
                } else {
                    fallbackCopyText(textToCopy);
                }
            } catch {
                fallbackCopyText(textToCopy);
            }
            setCopied(true);
            if (showToast) {
                showToast('✓ Copied to clipboard!');
            }
            setTimeout(() => setCopied(false), 2200);
        }
    };
    const quickEmojis = ['👍', '❤️', '😂', '🔥', '🎉', '🚀'];
    const formatFileSize = (bytes) => {
        if (bytes < 1024)
            return bytes + ' B';
        if (bytes < 1024 * 1024)
            return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };
    // Search query highlight helper
    const renderMessageContent = (text) => {
        if (!text)
            return null;
        // Check for code blocks ```lang ... ```
        const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
        if (codeBlockRegex.test(text)) {
            const elements = [];
            let lastIndex = 0;
            let match;
            const regex = /```(\w+)?\n([\s\S]*?)```/g;
            while ((match = regex.exec(text)) !== null) {
                if (match.index > lastIndex) {
                    elements.push(<span key={lastIndex}>
              {text.substring(lastIndex, match.index)}
            </span>);
                }
                elements.push(<CodeSnippet key={match.index} language={match[1] || 'code'} code={match[2]}/>);
                lastIndex = regex.lastIndex;
            }
            if (lastIndex < text.length) {
                elements.push(<span key={lastIndex}>
            {text.substring(lastIndex)}
          </span>);
            }
            return elements;
        }
        if (!messageSearchQuery.trim()) {
            return text;
        }
        const parts = text.split(new RegExp(`(${messageSearchQuery})`, 'gi'));
        return (<>
        {parts.map((part, i) => part.toLowerCase() === messageSearchQuery.toLowerCase() ? (<mark key={i} className="bg-amber-300 text-slate-900 rounded-sm px-0.5 font-bold">
              {part}
            </mark>) : (part))}
      </>);
    };
    const isCurrentReplyTarget = replyingTo?.id === message.id;
    const isSearchMatch = Boolean(
        messageSearchQuery && 
        messageSearchQuery.trim() && 
        (
            (message.text && message.text.toLowerCase().includes(messageSearchQuery.trim().toLowerCase())) ||
            (message.attachments && message.attachments.some(a => a.name?.toLowerCase().includes(messageSearchQuery.trim().toLowerCase()))) ||
            (message.poll && message.poll.question?.toLowerCase().includes(messageSearchQuery.trim().toLowerCase()))
        )
    );

    return (<div 
        id={`msg-${message.id}`} 
        onDoubleClick={() => {
            setEditingMessage(null);
            setReplyingTo(message);
        }}
        className={`group relative flex gap-2.5 px-4 py-1.5 transition-all duration-300 ${
            isMe ? 'flex-row-reverse animate-bubble-right' : 'flex-row animate-bubble-left'
        } ${isHighlighted ? 'animate-highlight bg-brand-500/10 rounded-2xl' : ''} ${
            isCurrentReplyTarget ? 'bg-purple-500/10 rounded-2xl ring-1 ring-purple-500/40 shadow-xs' : ''
        } ${isSearchMatch ? 'ring-2 ring-amber-400/80 dark:ring-amber-400/80 bg-amber-400/5 rounded-2xl shadow-sm' : ''}`}
    >
      {/* Sender Avatar (for other users or in groups) */}
      {!isMe && (<div className="flex-shrink-0 pt-1">
          <Avatar src={sender?.avatar} name={senderName} size="sm" status={sender?.status}/>
        </div>)}

      {/* Message Bubble Container */}
      <div className={`relative max-w-[85%] sm:max-w-[70%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
        {/* Sender Name & Mention tag (in group chats, for other users) */}
        {isGroup && !isMe && senderName && (<div className="flex items-center gap-1.5 mb-1 px-1">
            <span className="text-xs font-semibold text-brand-600 dark:text-brand-400">
              {senderName}
            </span>
            {isMentioned && (<span className="px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold text-[10px] border border-amber-500/30 flex items-center gap-0.5 animate-pulse">
                @You
              </span>)}
          </div>)}

        {/* Quoted Reply Preview */}
        {message.replyTo && (<div onClick={() => onJumpToMessage(message.replyTo.id)} className={`mb-1 p-2 rounded-xl text-xs cursor-pointer border flex items-start gap-1.5 transition-all hover:opacity-90 max-w-full truncate ${isMe
                ? 'bg-purple-900/50 border-purple-500/40 text-purple-100'
                : 'bg-slate-200/60 dark:bg-slate-800/80 border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300'}`}>
            <CornerDownRight className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-purple-300"/>
            <div className="truncate">
              <span className="font-semibold block text-[10px] text-purple-300">
                Replying to {message.replyTo.senderName}
              </span>
              <span className="truncate text-[11px] opacity-80 block">
                {message.replyTo.text || 'Original message'}
              </span>
            </div>
          </div>)}

        {/* Interactive Poll */}
        {message.poll ? (<PollCard poll={message.poll} messageId={message.id} onVote={votePoll} isMe={isMe}/>) : message.voiceMemo ? (
        /* Voice Message Player */
        <VoiceMemoPlayer voiceMemo={message.voiceMemo} isMe={isMe}/>) : (
        /* Standard Bubble */
        <div className={`relative px-3.5 py-2.5 rounded-2xl shadow-bubble transition-all ${isMentioned
                ? 'ring-2 ring-amber-400/80 bg-amber-500/10 shadow-[0_0_15px_rgba(251,191,36,0.2)]'
                : ''} ${message.isDeleted
                ? 'bg-slate-100/60 dark:bg-slate-800/40 text-slate-400 italic border border-dashed border-slate-300 dark:border-slate-700 text-xs'
                : isMe
                    ? 'bg-gradient-to-tr from-purple-600 via-violet-600 to-indigo-500 text-white rounded-tr-xs shadow-md shadow-purple-500/20'
                    : 'bg-white dark:bg-[#1a162f] text-slate-800 dark:text-slate-100 border border-slate-200/70 dark:border-purple-900/30 rounded-tl-xs'}`}>
            {/* Forwarded From Pill */}
            {message.forwardedFrom && (<div className={`flex items-center gap-1.5 text-[11px] font-medium mb-1.5 pb-1 border-b select-none ${isMe ? 'border-white/20 text-white/85' : 'border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400'}`}>
                <Forward className="w-3 h-3 text-brand-400 inline-block"/>
                <span>Forwarded from <span className="font-semibold">{message.forwardedFrom.name}</span></span>
              </div>)}
            {/* Attachments */}
            {message.attachments && message.attachments.length > 0 && (<div className="space-y-2 mb-2">
                {message.attachments.map((att) => {
                    const isImage = att.type.startsWith('image/');
                    return isImage ? (<div key={att.id} onClick={() => setLightboxImage(att.url)} className="relative rounded-xl overflow-hidden cursor-pointer group/img max-w-sm border border-black/10">
                      <img src={att.url} alt={att.name} className="w-full max-h-64 object-cover group-hover/img:scale-[1.02] transition-transform duration-200"/>
                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center text-white">
                        <ExternalLink className="w-5 h-5 drop-shadow"/>
                      </div>
                    </div>) : (<div key={att.id} className={`flex items-center gap-3 p-2.5 rounded-xl border ${isMe
                            ? 'bg-white/10 border-white/20 text-white'
                            : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100'}`}>
                      <div className="p-2 rounded-lg bg-brand-500/20 text-brand-400">
                        <FileText className="w-5 h-5"/>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold truncate">{att.name}</p>
                        <p className="text-[10px] opacity-70">{formatFileSize(att.size)}</p>
                      </div>
                      <a href={att.url} download={att.name} target="_blank" rel="noreferrer" className="p-1.5 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 transition-colors" title="Download file">
                        <Download className="w-4 h-4"/>
                      </a>
                    </div>);
                })}
              </div>)}

            {/* Message Text with Full Markdown & Syntax-highlighting */}
            {message.text && (<div className="text-xs sm:text-sm leading-relaxed">
                <MarkdownText text={message.text} isMe={isMe} searchQuery={messageSearchQuery}/>
              </div>)}

            {/* Timestamp & Status Metadata */}
            <div className={`mt-1 flex items-center justify-end gap-1.5 text-[10px] select-none ${isMe ? 'text-purple-200' : 'text-slate-400'}`}>
              {message.isPinned && (<span title="Pinned in this channel" className="text-amber-400">
                  <Pin className="w-3 h-3 fill-current"/>
                </span>)}
              {message.isStarred && (<span title="Starred message" className="text-amber-400">
                  <Star className="w-3 h-3 fill-current"/>
                </span>)}
              {message.isEdited && !message.isDeleted && (<span className="italic opacity-75">edited</span>)}
              <span>{formattedTime}</span>

              {/* Delivery Ticks (for my messages) */}
              {isMe && !message.isDeleted && (<span className="inline-flex items-center">
                  {message.status === 'pending' && (<span title="Sending...">
                      <Clock className="w-3 h-3 text-purple-200 animate-pulse"/>
                    </span>)}
                  {message.status === 'sent' && (<span title="Sent to server">
                      <Check className="w-3 h-3 text-purple-200"/>
                    </span>)}
                  {message.status === 'delivered' && (<span title="Delivered to recipient">
                      <CheckCheck className="w-3 h-3 text-purple-200"/>
                    </span>)}
                  {message.status === 'read' && (<span title="Read by recipient">
                      <CheckCheck className="w-3 h-3 text-fuchsia-300 font-bold"/>
                    </span>)}
                  {message.status === 'failed' && (<div className="flex items-center gap-1 text-rose-300">
                      <AlertCircle className="w-3 h-3"/>
                      <button onClick={() => retryMessage(message)} className="underline font-bold hover:text-white flex items-center gap-0.5">
                        <RotateCcw className="w-2.5 h-2.5"/>
                        Retry
                      </button>
                    </div>)}
                </span>)}
            </div>
          </div>)}

        {/* Reactions List */}
        {message.reactions && Object.keys(message.reactions).length > 0 && (<div className="flex flex-wrap gap-1 mt-1 z-10">
            {Object.entries(message.reactions).map(([emoji, userIds]) => {
                if (userIds.length === 0)
                    return null;
                const hasReacted = user && userIds.includes(user.id);
                return (<button key={emoji} onClick={() => reactToMessage(message.id, emoji)} className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border transition-all duration-150 hover:scale-110 active:scale-90 ${hasReacted
                        ? 'bg-brand-500/20 border-brand-500/50 text-brand-600 dark:text-brand-300 font-bold shadow-xs shadow-brand-500/20'
                        : 'bg-white/85 dark:bg-slate-800/85 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 shadow-xs'}`} title={`${userIds.length} ${userIds.length === 1 ? 'person' : 'people'} reacted`}>
                  <span className="inline-block transform hover:scale-125 transition-transform">{emoji}</span>
                  <span className="text-[10px] font-bold">{userIds.length}</span>
                </button>);
            })}
          </div>)}

        {/* Slack-Style Thread Summary Badge */}
        {message.threadCount && message.threadCount > 0 ? (<button type="button" onClick={() => openThread(message)} className="mt-1.5 flex items-center gap-2 px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-brand-50 dark:bg-slate-800/90 dark:hover:bg-brand-500/15 text-brand-600 dark:text-brand-400 text-xs font-semibold border border-slate-200/80 dark:border-slate-700/80 shadow-xs transition-all hover:scale-102 group/thread">
            <MessageSquare className="w-3.5 h-3.5 text-brand-500 group-hover/thread:rotate-12 transition-transform"/>
            <span>{message.threadCount} {message.threadCount === 1 ? 'reply' : 'replies'}</span>
            {message.lastReplyAt && (<span className="text-[10px] text-slate-400 font-normal">
                • Last reply {formatTimeAgo(message.lastReplyAt)}
              </span>)}
          </button>) : null}
      </div>

      {/* Floating Hover Action Toolbar */}
      {!message.isDeleted && (<div className={`absolute -top-3 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transform translate-y-1 group-hover:translate-y-0 transition-all duration-200 flex items-center gap-0.5 p-1 rounded-xl bg-white/95 dark:bg-slate-800/95 backdrop-blur-md border border-slate-200 dark:border-slate-700 shadow-xl z-30 ${isMe ? 'right-2 sm:right-auto sm:left-4' : 'left-2 sm:left-auto sm:right-4'}`}>
          {/* Reaction Quick Picker */}
          <div className="relative">
            <button onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="p-1.5 rounded-lg text-slate-400 hover-icon-purple" title="Add reaction">
              <Smile className="w-3.5 h-3.5"/>
            </button>

            {showEmojiPicker && (<div className="absolute bottom-8 left-0 flex items-center gap-1.5 p-2 bg-white/95 dark:bg-slate-800/95 backdrop-blur-md border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl z-50 animate-modal-in" onClick={e => e.stopPropagation()}>
                {quickEmojis.map(emoji => (<button key={emoji} onClick={() => {
                        reactToMessage(message.id, emoji);
                        setShowEmojiPicker(false);
                    }} className="p-1 hover:scale-135 active:scale-90 transition-transform text-base select-none">
                    {emoji}
                  </button>))}
              </div>)}
          </div>

          {/* Star / Bookmark */}
          <button onClick={() => toggleStarMessage(message.id)} className={`p-1.5 rounded-lg transition-colors ${message.isStarred
                ? 'text-amber-500 hover:bg-amber-500/10'
                : 'text-slate-400 hover-icon-purple'}`} title={message.isStarred ? 'Unstar message' : 'Star message'}>
            <Star className={`w-3.5 h-3.5 ${message.isStarred ? 'fill-current' : ''}`}/>
          </button>

          {/* Pin */}
          <button onClick={() => togglePinMessage(message.id)} className={`p-1.5 rounded-lg transition-colors ${message.isPinned
                ? 'text-purple-600 dark:text-purple-400 bg-purple-500/15'
                : 'text-slate-400 hover-icon-purple'}`} title={message.isPinned ? 'Unpin message' : 'Pin message'}>
            <Pin className={`w-3.5 h-3.5 ${message.isPinned ? 'fill-current' : ''}`}/>
          </button>

          {/* Reply in Thread */}
          <button onClick={() => openThread(message)} className="p-1.5 rounded-lg text-slate-400 hover-icon-purple" title="Reply in thread">
            <MessageSquare className="w-3.5 h-3.5"/>
          </button>

          {/* Forward */}
          <button onClick={() => setForwardingMessage(message)} className="p-1.5 rounded-lg text-slate-400 hover-icon-purple" title="Forward message">
            <Forward className="w-3.5 h-3.5"/>
          </button>

          {/* Reply directly */}
          <button 
            type="button"
            id={`reply-btn-${message.id}`}
            onClick={(e) => {
              e.stopPropagation();
              setEditingMessage(null);
              const nextState = isCurrentReplyTarget ? null : message;
              setReplyingTo(nextState);
              if (nextState && showToast) {
                showToast(`✨ Replying to ${senderName}`);
              }
            }} 
            className={`p-1.5 rounded-lg transition-all cursor-pointer ${
              isCurrentReplyTarget 
                ? 'text-purple-600 dark:text-purple-300 bg-purple-500/25 ring-1 ring-purple-500/50 shadow-xs scale-105' 
                : 'text-slate-400 hover-icon-purple'
            }`} 
            title={isCurrentReplyTarget ? 'Cancel reply' : 'Reply to message'}
          >
            <Reply className="w-3.5 h-3.5"/>
          </button>

          {/* Copy Text */}
          <button 
            type="button"
            id={`copy-btn-${message.id}`}
            onClick={(e) => {
              e.stopPropagation();
              handleCopy();
            }} 
            className={`p-1.5 rounded-lg transition-all cursor-pointer ${
              copied 
                ? 'text-emerald-500 bg-emerald-500/20 ring-1 ring-emerald-500/40 scale-105' 
                : 'text-slate-400 hover-icon-purple'
            }`} 
            title={copied ? 'Copied to clipboard!' : 'Copy message text'}
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-500"/> : <Copy className="w-3.5 h-3.5"/>}
          </button>

          {/* Edit (only if sent by me and not poll/voice) */}
          {isMe && !message.poll && !message.voiceMemo && (<button onClick={() => setEditingMessage(message)} className="p-1.5 rounded-lg text-slate-400 hover-icon-purple" title="Edit message">
              <Pencil className="w-3.5 h-3.5"/>
            </button>)}

          {/* Delete (only if sent by me) */}
          {isMe && (<button onClick={() => deleteMessage(message.id)} className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors" title="Delete message">
              <Trash2 className="w-3.5 h-3.5"/>
            </button>)}
        </div>)}
    </div>);
};
