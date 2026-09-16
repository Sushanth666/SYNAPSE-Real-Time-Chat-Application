import React from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useChat } from '../../context/ChatContext.jsx';
import { Avatar } from '../common/Avatar.jsx';
import { format, isToday, isYesterday } from 'date-fns';
import { Check, CheckCheck, Clock, Image, FileText, Users } from 'lucide-react';
export const ConversationItem = ({ conversation, isActive, onSelect, }) => {
    const { user, allUsers } = useAuth();
    const { typingMap } = useChat();
    // Determine other participant's status, display name, and avatar if direct chat
    let otherStatus;
    let displayName = conversation.name;
    let displayAvatar = conversation.avatar;
    if (conversation.type === 'direct' && user) {
        const otherId = conversation.participantIds.find(id => id !== user.id);
        const otherUser = allUsers.find(u => u.id === otherId);
        otherStatus = otherUser?.status;
        if (otherUser) {
            displayName = otherUser.name;
            displayAvatar = otherUser.avatar;
        }
    }
    // Safety guard: NEVER display logged-in user's own credentials/name for a chat
    if (user && conversation.type === 'direct' && displayName.toLowerCase() === user.name.toLowerCase()) {
        const otherId = conversation.participantIds.find(id => id !== user.id);
        const otherUser = allUsers.find(u => u.id === otherId);
        if (otherUser && otherUser.name.toLowerCase() !== user.name.toLowerCase()) {
            displayName = otherUser.name;
            displayAvatar = otherUser.avatar;
        }
        else {
            const altUser = allUsers.find(u => u.id !== user.id && u.name.toLowerCase() !== user.name.toLowerCase());
            if (altUser) {
                displayName = altUser.name;
                displayAvatar = altUser.avatar;
            }
        }
    }
    // Check if anyone in this specific conversation is typing
    const convTyping = (typingMap?.[conversation.id] || []).filter(t => t.userId !== user?.id);
    const isTyping = convTyping.length > 0;
    // Format timestamp
    const formatTime = (dateStr) => {
        if (!dateStr)
            return '';
        try {
            const date = new Date(dateStr);
            if (isToday(date)) {
                return format(date, 'h:mm a');
            }
            if (isYesterday(date)) {
                return 'Yesterday';
            }
            return format(date, 'MMM d');
        }
        catch {
            return '';
        }
    };
    const lastMsg = conversation.lastMessage;
    const isSentByMe = lastMsg && user && lastMsg.senderId === user.id;
    return (<div onClick={onSelect} className={`group relative flex items-center gap-3 p-3 mx-2 my-0.5 rounded-2xl cursor-pointer transition-all duration-200 active-press ${isActive
            ? 'bg-brand-500/15 dark:bg-brand-500/20 border border-brand-500/40 text-slate-900 dark:text-slate-100 shadow-sm translate-x-1'
            : 'hover:bg-slate-100/90 dark:hover:bg-slate-800/70 hover:translate-x-0.5 border border-transparent text-slate-700 dark:text-slate-300'}`}>
      {/* Avatar with Status Dot */}
      <div className="relative flex-shrink-0 transition-spring group-hover:scale-110">
        <Avatar src={displayAvatar} name={displayName} size="md" status={conversation.type === 'direct' ? otherStatus : undefined}/>
        {conversation.type === 'group' && (<span className="absolute -bottom-1 -right-1 p-0.5 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-brand-600 dark:text-brand-400 shadow-sm">
            <Users className="w-2.5 h-2.5"/>
          </span>)}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <h3 className={`text-xs font-bold truncate transition-colors ${isActive ? 'text-brand-600 dark:text-brand-300' : 'text-slate-900 dark:text-slate-100 group-hover:text-brand-500'}`}>
            {displayName}
          </h3>
          <span className="text-[10px] text-slate-400 font-medium whitespace-nowrap ml-2">
            {formatTime(conversation.updatedAt)}
          </span>
        </div>

        <div className="flex items-center justify-between gap-1">
          {/* Typing indicator preview or last message snippet */}
          <div className="flex-1 min-w-0 flex items-center gap-1 text-[11px] truncate">
            {isTyping ? (<span className="text-brand-500 font-medium animate-pulse flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-ping inline-block"/>
                <span>{convTyping[0].userName} is typing...</span>
              </span>) : lastMsg ? (<>
                {isSentByMe && (<span className="inline-flex items-center flex-shrink-0">
                    {lastMsg.status === 'pending' && <Clock className="w-3 h-3 text-slate-400"/>}
                    {lastMsg.status === 'sent' && <Check className="w-3 h-3 text-slate-400"/>}
                    {lastMsg.status === 'delivered' && <CheckCheck className="w-3 h-3 text-slate-400"/>}
                    {lastMsg.status === 'read' && <CheckCheck className="w-3 h-3 text-cyan-500 dark:text-cyan-400"/>}
                  </span>)}
                {lastMsg.attachments && lastMsg.attachments.length > 0 && (<span className="inline-flex items-center gap-0.5 text-slate-400 font-medium flex-shrink-0">
                    {lastMsg.attachments[0].type.startsWith('image/') ? (<Image className="w-3 h-3 text-brand-400"/>) : (<FileText className="w-3 h-3 text-brand-400"/>)}
                  </span>)}
                <span className="truncate text-slate-500 dark:text-slate-400">
                  {lastMsg.isDeleted ? 'This message was deleted' : lastMsg.text || 'Shared attachment'}
                </span>
              </>) : (<span className="text-slate-400 italic">No messages yet</span>)}
          </div>

          {/* Unread Count Badge — springs in when count > 0 */}
          {conversation.unreadCount !== undefined && conversation.unreadCount > 0 && (<span key={conversation.unreadCount} className="flex-shrink-0 ml-1.5 px-1.5 py-0.5 min-w-[18px] text-center text-[10px] font-bold text-white bg-gradient-to-r from-purple-600 to-fuchsia-600 rounded-full shadow-md shadow-purple-500/30 animate-unread-badge">
              {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
            </span>)}
        </div>
      </div>
    </div>);
};
