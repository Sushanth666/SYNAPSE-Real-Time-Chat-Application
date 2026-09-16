import React, { useState, useEffect } from 'react';
import { useChat } from '../../context/ChatContext.jsx';
import { Sidebar } from '../sidebar/Sidebar.jsx';
import { ChatArea } from '../chat/ChatArea.jsx';
import { StatusBanner } from '../common/StatusBanner.jsx';
import { ImageLightboxModal } from '../modals/ImageLightboxModal.jsx';
import { CreatePollModal } from '../modals/CreatePollModal.jsx';
import { StarredMessagesModal } from '../modals/StarredMessagesModal.jsx';
import { WallpaperModal } from '../modals/WallpaperModal.jsx';
import { CallModal } from '../modals/CallModal.jsx';
import { ForwardMessageModal } from '../modals/ForwardMessageModal.jsx';
import { ChatExportModal } from '../modals/ChatExportModal.jsx';
import { E2EESecurityModal } from '../modals/E2EESecurityModal.jsx';
import { ScheduleMessageModal } from '../modals/ScheduleMessageModal.jsx';

export const AppLayout = () => {
    const { 
        activeConversationId, 
        setActiveConversationId, 
        isPollModalOpen, 
        setIsPollModalOpen, 
        sendPoll, 
        isStarredModalOpen, 
        setIsStarredModalOpen,
        isExportModalOpen,
        isE2EEModalOpen,
        isScheduleModalOpen
    } = useChat();
    const [mobileView, setMobileView] = useState('sidebar');
    // Switch to chat view when a conversation is selected on mobile
    useEffect(() => {
        if (activeConversationId) {
            setMobileView('chat');
        }
    }, [activeConversationId]);
    const handleBackToSidebar = () => {
        setMobileView('sidebar');
    };
    const handleJumpToStarredMessage = (conversationId, messageId) => {
        setIsStarredModalOpen(false);
        if (activeConversationId !== conversationId) {
            setActiveConversationId(conversationId);
        }
        setTimeout(() => {
            const el = document.getElementById(`msg-${messageId}`);
            if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                el.classList.add('ring-2', 'ring-brand-500', 'rounded-2xl', 'transition-all');
                setTimeout(() => {
                    el.classList.remove('ring-2', 'ring-brand-500', 'rounded-2xl', 'transition-all');
                }, 2200);
            }
        }, 250);
    };
    return (<div className="h-screen w-screen flex flex-col overflow-hidden bg-slate-100 dark:bg-[#0b0f19] text-slate-800 dark:text-slate-100 font-sans">
      {/* Top Reconnection / Offline status banner */}
      <StatusBanner />

      {/* Main app body */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Sidebar — slides in from left */}
        <div className={`h-full md:block ${mobileView === 'sidebar' ? 'block w-full' : 'hidden'} md:w-auto animate-sidebar-enter`}>
          <Sidebar />
        </div>

        {/* Chat Area — slides in from right */}
        <div className={`h-full flex-1 ${mobileView === 'chat' ? 'flex' : 'hidden'} md:flex min-w-0 min-h-0 overflow-hidden animate-chat-enter`}>
          <ChatArea onBackMobile={handleBackToSidebar}/>
        </div>
      </div>

      {/* Global Image Lightbox Modal */}
      <ImageLightboxModal />

      {/* Create Poll Modal */}
      <CreatePollModal isOpen={isPollModalOpen} onClose={() => setIsPollModalOpen(false)} onCreatePoll={sendPoll}/>

      {/* Starred Messages Modal */}
      <StarredMessagesModal isOpen={isStarredModalOpen} onClose={() => setIsStarredModalOpen(false)} onJumpToMessage={handleJumpToStarredMessage}/>

      {/* Wallpaper & Theme Customizer Modal */}
      <WallpaperModal />

      {/* Interactive Video & Voice Call Modal */}
      <CallModal />

      {/* Message Forwarding Modal */}
      <ForwardMessageModal />

      {/* Chat Export & Backup Modal */}
      {isExportModalOpen && <ChatExportModal />}

      {/* End-to-End Encryption Security Modal */}
      {isE2EEModalOpen && <E2EESecurityModal />}

      {/* Schedule Message Modal */}
      {isScheduleModalOpen && <ScheduleMessageModal />}
    </div>);
};
