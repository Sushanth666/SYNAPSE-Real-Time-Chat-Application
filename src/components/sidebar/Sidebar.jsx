import React, { useState, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useChat } from '../../context/ChatContext.jsx';
import { SidebarHeader } from './SidebarHeader.jsx';
import { SearchBar } from './SearchBar.jsx';
import { ConversationList } from './ConversationList.jsx';
import { UserProfileFooter } from './UserProfileFooter.jsx';
import { NewChatModal } from '../modals/NewChatModal.jsx';
import { SwitchUserModal } from '../modals/SwitchUserModal.jsx';
import { ProfileModal } from '../modals/ProfileModal.jsx';
import { SignOutConfirmModal } from '../common/SignOutConfirmModal.jsx';

export const Sidebar = () => {
    const { logout } = useAuth();
    const { isProfileModalOpen, setIsProfileModalOpen } = useChat();
    const [isNewChatOpen, setIsNewChatOpen] = useState(false);
    const [isSwitchUserOpen, setIsSwitchUserOpen] = useState(false);
    const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);

    const handleConfirmSignOut = useCallback(() => {
        setShowSignOutConfirm(false);
        logout();
    }, [logout]);

    return (<aside className="w-full md:w-80 lg:w-96 h-full flex flex-col bg-white dark:bg-[#0f172a] border-r border-slate-200 dark:border-slate-800 flex-shrink-0 select-none">
      {/* Top Header: Brand Title & Quick Actions */}
      <SidebarHeader 
        onOpenNewChat={() => setIsNewChatOpen(true)}
        onSignOut={() => setShowSignOutConfirm(true)}
      />

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
      <SignOutConfirmModal
        isOpen={showSignOutConfirm}
        onCancel={() => setShowSignOutConfirm(false)}
        onConfirm={handleConfirmSignOut}
      />
    </aside>);
};
