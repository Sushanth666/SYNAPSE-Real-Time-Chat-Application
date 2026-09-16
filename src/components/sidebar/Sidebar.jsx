import React, { useState } from 'react';
import { useChat } from '../../context/ChatContext.jsx';
import { SidebarHeader } from './SidebarHeader.jsx';
import { SearchBar } from './SearchBar.jsx';
import { ConversationList } from './ConversationList.jsx';
import { UserProfileFooter } from './UserProfileFooter.jsx';
import { NewChatModal } from '../modals/NewChatModal.jsx';
import { SwitchUserModal } from '../modals/SwitchUserModal.jsx';
import { ProfileModal } from '../modals/ProfileModal.jsx';
export const Sidebar = () => {
    const { isProfileModalOpen, setIsProfileModalOpen } = useChat();
    const [isNewChatOpen, setIsNewChatOpen] = useState(false);
    const [isSwitchUserOpen, setIsSwitchUserOpen] = useState(false);
    return (<aside className="w-full md:w-80 lg:w-96 h-full flex flex-col bg-white dark:bg-[#0f172a] border-r border-slate-200 dark:border-slate-800 flex-shrink-0 select-none">
      {/* Top Header: Brand Title & Quick Actions */}
      <SidebarHeader onOpenNewChat={() => setIsNewChatOpen(true)}/>

      {/* Filter and Search */}
      <SearchBar />

      {/* Conversation / Chats List */}
      <ConversationList onOpenNewChat={() => setIsNewChatOpen(true)}/>

      {/* Bottom Footer: Logged-in User Profile & Details */}
      <UserProfileFooter onOpenProfile={() => setIsProfileModalOpen(true)} onOpenSwitchUser={() => setIsSwitchUserOpen(true)}/>

      {/* Modals */}
      <ProfileModal isOpen={isProfileModalOpen} onClose={() => setIsProfileModalOpen(false)}/>
      <NewChatModal isOpen={isNewChatOpen} onClose={() => setIsNewChatOpen(false)}/>
      <SwitchUserModal isOpen={isSwitchUserOpen} onClose={() => setIsSwitchUserOpen(false)}/>
    </aside>);
};
