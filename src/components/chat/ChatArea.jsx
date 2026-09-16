import React from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useChat } from '../../context/ChatContext.jsx';
import { ChatHeader } from './ChatHeader.jsx';
import { MessageList } from './MessageList.jsx';
import { TypingIndicator } from './TypingIndicator.jsx';
import { MessageInput } from './MessageInput.jsx';
import { ConversationDetails } from './ConversationDetails.jsx';
import { PinnedBanner } from './PinnedBanner.jsx';
import { Sparkles, Check } from 'lucide-react';
import { EmptyChatGraphic } from '../common/Graphics.jsx';
import { ChatBackground } from './ChatBackground.jsx';
import { ThreadDrawer } from './ThreadDrawer.jsx';
export const ChatArea = ({ onBackMobile }) => {
    const { allUsers } = useAuth();
    const { activeConversation, isDetailsOpen, activePinnedMessage, togglePinMessage, toastNotification } = useChat();
    const handleJumpToMessage = (messageId) => {
        const el = document.getElementById(`msg-${messageId}`);
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            el.classList.add('ring-2', 'ring-brand-500', 'rounded-2xl', 'transition-all');
            setTimeout(() => {
                el.classList.remove('ring-2', 'ring-brand-500', 'rounded-2xl', 'transition-all');
            }, 2200);
        }
    };
    const pinnedSender = activePinnedMessage
        ? allUsers.find(u => u.id === activePinnedMessage.senderId)?.name || 'Someone'
        : 'Someone';
    if (!activeConversation) {
        return (<main className="flex-1 h-full flex flex-col items-center justify-center p-8 bg-slate-50 dark:bg-[#0b0f19] text-center select-none relative overflow-hidden">
        {/* Subtle ambient animated backdrop */}
        <ChatBackground />
        <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl pointer-events-none animate-pulse-subtle"/>
        <div className="absolute bottom-1/4 right-1/3 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none animate-pulse-subtle" style={{ animationDelay: '1s' }}/>

        {/* Animated Vector Graphic */}
        <div className="mb-6 relative z-10">
          <EmptyChatGraphic className="w-52 h-52 sm:w-60 sm:h-60 mx-auto"/>
        </div>

        <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100 mb-2.5 tracking-tight relative z-10">
          Select a Conversation
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mb-6 leading-relaxed relative z-10">
          Choose from your active conversations on the left, or start a new direct chat or group channel to begin collaborating in real time.
        </p>
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 shadow-sm text-xs text-slate-600 dark:text-slate-300 relative z-10 animate-fade-in">
          <Sparkles className="w-4 h-4 text-amber-500 animate-pulse"/>
          <span className="font-medium">Real-time WebSocket streaming & optimistic updates active</span>
        </div>
      </main>);
    }
    return (<main className="flex-1 h-full flex overflow-hidden bg-slate-100/60 dark:bg-[#0b0f19] relative">
      <ChatBackground />
      <div className="flex-1 h-full flex flex-col min-w-0 min-h-0 overflow-hidden relative z-10">
        <ChatHeader onBackMobile={onBackMobile}/>
        {activePinnedMessage && (<PinnedBanner pinnedMessage={activePinnedMessage} onJumpToMessage={handleJumpToMessage} onUnpin={togglePinMessage} senderName={pinnedSender}/>)}
        <MessageList />
        <TypingIndicator />
        <MessageInput />
      </div>

      {/* Thread side drawer */}
      <ThreadDrawer />

      {isDetailsOpen && <ConversationDetails />}

      {/* Floating Copied & Action Toast Notification */}
      {toastNotification && (
        <div 
          id="global-toast-notification"
          className="fixed top-6 left-1/2 -translate-x-1/2 z-[999999] flex items-center gap-3 px-5 py-3 rounded-2xl bg-slate-900/95 dark:bg-[#0f172a]/95 text-white border border-emerald-500/60 shadow-[0_10px_35px_rgba(16,185,129,0.35)] backdrop-blur-xl animate-toast-in pointer-events-none"
        >
          <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0 ring-1 ring-emerald-400/50">
            <Check className="w-4 h-4 text-emerald-400 stroke-[3]" />
          </div>
          <span className="text-xs sm:text-sm font-bold tracking-wide text-white">{toastNotification.message}</span>
        </div>
      )}
    </main>);
};
