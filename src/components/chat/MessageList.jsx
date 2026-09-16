import React, { useRef, useEffect, useState } from 'react';
import { useChat } from '../../context/ChatContext.jsx';
import { MessageItem } from './MessageItem.jsx';
import { isToday, isYesterday, format } from 'date-fns';
import { ArrowDown, Loader2 } from 'lucide-react';
import { NoMessagesGraphic } from '../common/Graphics.jsx';
export const MessageList = () => {
    const { messages, activeConversation, hasMoreMessages, isLoadingMessages, loadMoreMessages } = useChat();
    const containerRef = useRef(null);
    const bottomRef = useRef(null);
    const [showScrollBottom, setShowScrollBottom] = useState(false);
    const [highlightedMsgId, setHighlightedMsgId] = useState(null);
    const prevScrollHeightRef = useRef(0);
    const userScrolledUpRef = useRef(false);
    const prevConvIdRef = useRef(null);
    const prevMessagesLenRef = useRef(0);
    // Scroll to bottom immediately on conversation change
    useEffect(() => {
        if (activeConversation?.id !== prevConvIdRef.current) {
            prevConvIdRef.current = activeConversation?.id || null;
            userScrolledUpRef.current = false;
            setShowScrollBottom(false);
            prevMessagesLenRef.current = messages.length;
            requestAnimationFrame(() => {
                if (bottomRef.current) {
                    bottomRef.current.scrollIntoView({ behavior: 'auto' });
                }
            });
        }
    }, [activeConversation?.id, messages.length]);
    // Smooth scroll to bottom on new messages IF user has not scrolled up
    useEffect(() => {
        const isNewMessage = messages.length > prevMessagesLenRef.current;
        prevMessagesLenRef.current = messages.length;
        if (isNewMessage && !userScrolledUpRef.current) {
            requestAnimationFrame(() => {
                bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
            });
        }
    }, [messages]);
    // Handle scroll for infinite scrolling and bottom indicator
    const handleScroll = async (e) => {
        const target = e.currentTarget;
        const { scrollTop, scrollHeight, clientHeight } = target;
        // Detect if user has scrolled away from bottom (more than 150px)
        const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
        const isUp = distanceFromBottom > 150;
        userScrolledUpRef.current = isUp;
        setShowScrollBottom(isUp);
        // If near top and has more messages
        if (scrollTop < 40 && hasMoreMessages && !isLoadingMessages) {
            prevScrollHeightRef.current = scrollHeight;
            await loadMoreMessages();
            // Adjust scroll to maintain position
            requestAnimationFrame(() => {
                if (containerRef.current) {
                    const newScrollHeight = containerRef.current.scrollHeight;
                    containerRef.current.scrollTop = newScrollHeight - prevScrollHeightRef.current;
                    prevScrollHeightRef.current = 0;
                }
            });
        }
    };
    const scrollToBottom = () => {
        userScrolledUpRef.current = false;
        setShowScrollBottom(false);
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    };
    const jumpToMessage = (messageId) => {
        const el = document.getElementById(`msg-${messageId}`);
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            setHighlightedMsgId(messageId);
            setTimeout(() => setHighlightedMsgId(null), 2500);
        }
    };
    const formatDateDivider = (dateStr) => {
        try {
            const date = new Date(dateStr);
            if (isToday(date))
                return 'Today';
            if (isYesterday(date))
                return 'Yesterday';
            return format(date, 'MMMM d, yyyy');
        }
        catch {
            return '';
        }
    };
    if (messages.length === 0 && !isLoadingMessages) {
        return (<div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-500 select-none animate-fade-in">
        <div className="mb-3">
          <NoMessagesGraphic className="w-32 h-32 mx-auto"/>
        </div>
        <h3 className="text-base font-bold text-slate-800 dark:text-slate-200 mb-1.5">
          No messages in this chat yet
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mb-4 leading-relaxed">
          Say hello or send a file below to start collaborating!
        </p>
        <div className="flex flex-wrap items-center justify-center gap-2">
          {['👋 Hello team!', '🚀 Ready to sync', '📎 Sending spec doc'].map((suggestion, idx) => (<span key={idx} className="px-2.5 py-1 text-[11px] font-medium rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700/60 shadow-xs cursor-default">
              {suggestion}
            </span>))}
        </div>
      </div>);
    }
    return (<div ref={containerRef} onScroll={handleScroll} className="flex-1 min-h-0 overflow-y-auto px-2 sm:px-4 py-4 space-y-1 relative overscroll-contain">
      {/* Infinite Scroll Top Loading Spinner */}
      {isLoadingMessages && (<div className="py-2 flex items-center justify-center text-xs text-slate-400 gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-brand-500"/>
          <span>Loading earlier messages...</span>
        </div>)}

      {/* Messages Stream with Date Dividers */}
      {messages.map((message, index) => {
            const prevMessage = messages[index - 1];
            const currentDate = formatDateDivider(message.createdAt);
            const prevDate = prevMessage ? formatDateDivider(prevMessage.createdAt) : null;
            const showDateDivider = !prevDate || currentDate !== prevDate;
            return (<React.Fragment key={message.id || message.tempId}>
            {showDateDivider && (<div className="flex items-center justify-center my-4 select-none">
                <span className="px-3 py-1 rounded-full bg-slate-200/80 dark:bg-slate-800/80 text-[11px] font-semibold text-slate-500 dark:text-slate-400 backdrop-blur-sm border border-slate-300/40 dark:border-slate-700/50">
                  {currentDate}
                </span>
              </div>)}

            <MessageItem message={message} isGroup={activeConversation?.type === 'group'} onJumpToMessage={jumpToMessage} isHighlighted={message.id === highlightedMsgId}/>
          </React.Fragment>);
        })}

      {/* Bottom Anchor */}
      <div ref={bottomRef} className="h-1"/>

      {/* Floating Scroll to Bottom FAB */}
      {showScrollBottom && (<button onClick={scrollToBottom} className="fixed bottom-24 right-8 p-2.5 rounded-full bg-brand-600 hover:bg-brand-500 text-white shadow-xl shadow-brand-500/40 active:scale-90 hover:scale-110 transition-all z-30 animate-modal-in" title="Scroll to latest messages">
          <ArrowDown className="w-4 h-4 animate-bounce"/>
        </button>)}
    </div>);
};
