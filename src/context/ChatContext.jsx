import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext.jsx';
import { useSocket } from './SocketContext.jsx';
import { soundManager } from '../utils/sound.js';
import { updateTabAnimation, stopTabAnimation } from '../utils/tabAnimator.js';
const ChatContext = createContext(undefined);
export const ChatProvider = ({ children }) => {
    const { user, allUsers, refreshUsers, updateStatus } = useAuth();
    const { send, on, connectionState } = useSocket();
    const [conversations, setConversations] = useState([]);
    const [activeConversationId, setActiveConversationId] = useState(null);
    const [messagesMap, setMessagesMap] = useState({});
    const [hasMoreMap, setHasMoreMap] = useState({});
    const [cursorMap, setCursorMap] = useState({});
    const [isLoadingMessages, setIsLoadingMessages] = useState(false);
    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const [typingMap, setTypingMap] = useState({});
    const [isSelfTyping, setIsSelfTyping] = useState(false);
    const isTypingRef = useRef(false);
    const typingTimeoutRef = useRef(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilter, setActiveFilter] = useState('all');
    const [messageSearchQuery, setMessageSearchQuery] = useState('');
    const [replyingTo, setReplyingTo] = useState(null);
    const [editingMessage, setEditingMessage] = useState(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [lightboxImage, setLightboxImage] = useState(null);
    const [isPollModalOpen, setIsPollModalOpen] = useState(false);
    const [isStarredModalOpen, setIsStarredModalOpen] = useState(false);
    // Threading state
    const [activeThreadMessage, setActiveThreadMessage] = useState(null);
    const [threadMessages, setThreadMessages] = useState({});
    // Wallpaper theme state
    const [wallpaperTheme, setWallpaperThemeState] = useState(() => {
        return localStorage.getItem('chat_wallpaper_theme') || 'doodle';
    });
    const [isWallpaperModalOpen, setIsWallpaperModalOpen] = useState(false);
    const setWallpaperTheme = useCallback((theme) => {
        setWallpaperThemeState(theme);
        localStorage.setItem('chat_wallpaper_theme', theme);
    }, []);
    // Forwarding state
    const [forwardingMessage, setForwardingMessage] = useState(null);
    // Scheduled messages state
    const [scheduledMessages, setScheduledMessages] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem('chat_scheduled_messages') || '[]');
        } catch {
            return [];
        }
    });
    const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
    // Profile modal state
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    // Export modal state
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);
    // E2EE verification state
    const [isE2EEModalOpen, setIsE2EEModalOpen] = useState(false);
    const [verifiedConversations, setVerifiedConversations] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem('chat_e2ee_verified') || '{}');
        } catch {
            return {};
        }
    });
    const toggleVerifyConversation = useCallback((convId) => {
        setVerifiedConversations(prev => {
            const next = { ...prev, [convId]: !prev[convId] };
            localStorage.setItem('chat_e2ee_verified', JSON.stringify(next));
            return next;
        });
    }, []);
    // Toast notification state
    const [toastNotification, setToastNotification] = useState(null);
    const showToast = useCallback((message, type = 'success') => {
        setToastNotification({ message, type, id: Date.now() });
        setTimeout(() => setToastNotification(null), 2500);
    }, []);

    // Interactive Calling state
    const [activeCall, setActiveCall] = useState(null);
    const startCall = useCallback((type) => {
        if (!activeConversationId)
            return;
        setActiveCall({
            type,
            conversationId: activeConversationId,
            status: 'ringing',
            startedAt: Date.now(),
            isMuted: false,
            isVideoOff: false
        });
    }, [activeConversationId]);
    const endCall = useCallback(() => {
        setActiveCall(null);
    }, []);
    const toggleMuteCall = useCallback(() => {
        setActiveCall(prev => prev ? { ...prev, isMuted: !prev.isMuted } : null);
    }, []);
    const toggleVideoCall = useCallback(() => {
        setActiveCall(prev => prev ? { ...prev, isVideoOff: !prev.isVideoOff } : null);
    }, []);
    const openThread = useCallback((message) => {
        setActiveThreadMessage(message);
        setThreadMessages(prev => {
            if (prev[message.id])
                return prev;
            const seedReplies = [];
            if (message.threadCount && message.threadCount > 0) {
                seedReplies.push({
                    id: `seed_reply_1_${message.id}`,
                    conversationId: message.conversationId,
                    parentMessageId: message.id,
                    senderId: message.senderId === user?.id ? 'u2' : user?.id || 'u1',
                    text: 'Checking this right now, will update the team shortly!',
                    createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
                    status: 'read'
                });
            }
            return { ...prev, [message.id]: seedReplies };
        });
    }, [user?.id]);
    const closeThread = useCallback(() => {
        setActiveThreadMessage(null);
    }, []);
    const sendThreadReply = useCallback(async (parentMessageId, text, attachments) => {
        if (!activeConversationId || !user)
            return;
        const replyId = `reply_${Date.now()}`;
        const newReply = {
            id: replyId,
            tempId: replyId,
            conversationId: activeConversationId,
            parentMessageId,
            senderId: user.id,
            text,
            attachments: attachments || [],
            createdAt: new Date().toISOString(),
            status: 'sent'
        };
        setThreadMessages(prev => ({
            ...prev,
            [parentMessageId]: [...(prev[parentMessageId] || []), newReply]
        }));
        setMessagesMap(prev => {
            const list = prev[activeConversationId] || [];
            return {
                ...prev,
                [activeConversationId]: list.map(m => m.id === parentMessageId
                    ? {
                        ...m,
                        threadCount: (m.threadCount || 0) + 1,
                        lastReplyAt: new Date().toISOString()
                    }
                    : m)
            };
        });
        setActiveThreadMessage(prev => {
            if (prev && prev.id === parentMessageId) {
                return {
                    ...prev,
                    threadCount: (prev.threadCount || 0) + 1,
                    lastReplyAt: new Date().toISOString()
                };
            }
            return prev;
        });
        soundManager.playMessageSent();
        send('message:send', {
            conversationId: activeConversationId,
            parentMessageId,
            text,
            attachments: attachments || [],
            tempId: replyId
        });
    }, [activeConversationId, user, send]);
    const forwardMessageToConversation = useCallback(async (targetConversationId) => {
        if (!forwardingMessage || !user)
            return;
        const originalSender = allUsers?.find(u => u.id === forwardingMessage.senderId)?.name || 'Someone';
        const fwdId = `fwd_${Date.now()}`;
        const forwardedMsg = {
            id: fwdId,
            tempId: fwdId,
            conversationId: targetConversationId,
            senderId: user.id,
            text: forwardingMessage.text,
            attachments: forwardingMessage.attachments ? [...forwardingMessage.attachments] : [],
            voiceMemo: forwardingMessage.voiceMemo ? { ...forwardingMessage.voiceMemo } : undefined,
            poll: forwardingMessage.poll ? { ...forwardingMessage.poll } : undefined,
            forwardedFrom: {
                name: originalSender,
                originalMessageId: forwardingMessage.id
            },
            createdAt: new Date().toISOString(),
            status: 'sent'
        };
        setMessagesMap(prev => ({
            ...prev,
            [targetConversationId]: [...(prev[targetConversationId] || []), forwardedMsg]
        }));
        soundManager.playMessageSent();
        send('message:send', {
            conversationId: targetConversationId,
            text: forwardedMsg.text,
            attachments: forwardedMsg.attachments,
            voiceMemo: forwardedMsg.voiceMemo,
            poll: forwardedMsg.poll,
            forwardedFrom: forwardedMsg.forwardedFrom,
            tempId: fwdId
        });
        setForwardingMessage(null);
        setActiveConversationId(targetConversationId);
    }, [forwardingMessage, user, allUsers, send]);
    // Active conversation helper
    const activeConversation = conversations.find(c => c.id === activeConversationId) || null;
    const currentMessages = activeConversationId ? (messagesMap[activeConversationId] || []) : [];
    const currentHasMore = activeConversationId ? (hasMoreMap[activeConversationId] ?? false) : false;
    const currentTypingUsers = activeConversationId ? (typingMap[activeConversationId] || []) : [];
    const activePinnedMessage = currentMessages.find(m => m.isPinned) || null;
    // Mark active chat as read
    const markAsRead = useCallback((convId) => {
        if (!user)
            return;
        send('message:read', { conversationId: convId });
        setConversations(prev => prev.map(c => (c.id === convId ? { ...c, unreadCount: 0 } : c)));
        setMessagesMap(prev => {
            const list = prev[convId];
            if (!list)
                return prev;
            return {
                ...prev,
                [convId]: list.map(m => m.senderId !== user.id && m.status !== 'read' ? { ...m, status: 'read' } : m)
            };
        });
    }, [user, send]);

    // Fetch messages for active conversation
    const fetchInitialMessages = useCallback(async (convId) => {
        if (!convId) return;
        setIsLoadingMessages(true);
        try {
            const res = await fetch(`/api/conversations/${convId}/messages?limit=25`);
            if (res.ok) {
                const data = await res.json();
                setMessagesMap(prev => ({
                    ...prev,
                    [convId]: data.messages
                }));
                setHasMoreMap(prev => ({
                    ...prev,
                    [convId]: data.hasMore
                }));
                setCursorMap(prev => ({
                    ...prev,
                    [convId]: data.nextCursor
                }));
                markAsRead(convId);
            }
        }
        catch (err) {
            console.error('Failed to load messages for conversation:', convId, err);
        }
        finally {
            setIsLoadingMessages(false);
        }
    }, [markAsRead]);

    // Fetch conversations list with fast parallel initial message load
    const fetchConversations = useCallback(async () => {
        if (!user)
            return;
        try {
            const res = await fetch(`/api/conversations?userId=${user.id}`);
            if (res.ok) {
                const data = await res.json();
                setConversations(data);
                // Do not select any chat by default - user must explicitly select
                if (activeConversationId) {
                    const stillExists = data.some((c) => c.id === activeConversationId);
                    if (!stillExists) {
                        setActiveConversationId(null);
                    } else if (!messagesMap[activeConversationId]) {
                        fetchInitialMessages(activeConversationId);
                    }
                }
            }
        }
        catch (err) {
            console.error('Failed to load conversations:', err);
        }
        finally {
            setIsInitialLoading(false);
        }
    }, [user, activeConversationId, messagesMap, fetchInitialMessages]);

    // Reset conversation selection and maps when user switches
    useEffect(() => {
        setActiveConversationId(null);
        setMessagesMap({});
        setHasMoreMap({});
        setCursorMap({});
    }, [user?.id]);

    useEffect(() => {
        fetchConversations();
    }, [fetchConversations]);
    // Reset composer and search state ONLY when switching active conversation
    useEffect(() => {
        setReplyingTo(null);
        setEditingMessage(null);
        setMessageSearchQuery('');
    }, [activeConversationId]);

    // Fetch messages or mark as read when active conversation changes or needs initial load
    useEffect(() => {
        if (activeConversationId) {
            if (!messagesMap[activeConversationId]) {
                fetchInitialMessages(activeConversationId);
            }
            else {
                markAsRead(activeConversationId);
            }
        }
    }, [activeConversationId, fetchInitialMessages, markAsRead]);

    // Load more older messages (infinite scroll up)
    const loadMoreMessages = useCallback(async () => {
        if (!activeConversationId || isLoadingMessages)
            return;
        const hasMore = hasMoreMap[activeConversationId];
        const cursor = cursorMap[activeConversationId];
        if (!hasMore || !cursor)
            return;
        setIsLoadingMessages(true);
        try {
            const res = await fetch(`/api/conversations/${activeConversationId}/messages?limit=20&before=${encodeURIComponent(cursor)}`);
            if (res.ok) {
                const data = await res.json();
                setMessagesMap(prev => ({
                    ...prev,
                    [activeConversationId]: [...data.messages, ...(prev[activeConversationId] || [])]
                }));
                setHasMoreMap(prev => ({
                    ...prev,
                    [activeConversationId]: data.hasMore
                }));
                setCursorMap(prev => ({
                    ...prev,
                    [activeConversationId]: data.nextCursor
                }));
            }
        }
        catch (err) {
            console.error('Failed to load older messages:', err);
        }
        finally {
            setIsLoadingMessages(false);
        }
    }, [activeConversationId, isLoadingMessages, hasMoreMap, cursorMap]);
    // Optimistic Send Message
    const sendMessage = useCallback(async (text, attachments, targetConversationId = null) => {
        const convId = targetConversationId || activeConversationId;
        if (!convId || !user)
            return;
        if (!text.trim() && (!attachments || attachments.length === 0))
            return;
        const tempId = `temp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
        
        let replyInfo = undefined;
        if (replyingTo) {
            let replySenderName = 'Teammate';
            if (replyingTo.senderId === user.id) {
                replySenderName = 'You';
            } else {
                const foundUser = allUsers.find(u => u.id === replyingTo.senderId);
                replySenderName = foundUser?.name || replyingTo.senderName || 'Teammate';
            }
            const replyPreviewText = replyingTo.text?.trim()
                || (replyingTo.attachments?.length ? `📎 ${replyingTo.attachments[0].name || 'Attachment'}` : '')
                || (replyingTo.voiceMemo ? '🎤 Voice note' : '')
                || (replyingTo.poll ? `📊 Poll: ${replyingTo.poll.question}` : 'Message');

            replyInfo = {
                id: replyingTo.id,
                senderId: replyingTo.senderId,
                senderName: replySenderName,
                text: replyPreviewText
            };
        }
        const optimisticMsg = {
            id: tempId,
            tempId,
            conversationId: convId,
            senderId: user.id,
            text,
            createdAt: new Date().toISOString(),
            status: 'pending',
            replyTo: replyInfo,
            attachments,
            reactions: {}
        };
        setMessagesMap(prev => ({
            ...prev,
            [convId]: [...(prev[convId] || []), optimisticMsg]
        }));
        soundManager.playMessageSent();
        setConversations(prev => {
            const list = [...prev];
            const idx = list.findIndex(c => c.id === convId);
            if (idx !== -1) {
                const updated = {
                    ...list[idx],
                    lastMessage: optimisticMsg,
                    updatedAt: optimisticMsg.createdAt
                };
                list.splice(idx, 1);
                list.unshift(updated);
            }
            return list;
        });
        setReplyingTo(null);
        if (isTypingRef.current) {
            isTypingRef.current = false;
            send('typing:stop', { conversationId: convId });
        }
        const delivered = send('message:send', {
            conversationId: convId,
            text,
            replyTo: replyInfo,
            attachments,
            tempId
        });
        if (!delivered || connectionState !== 'connected') {
            setTimeout(() => {
                setMessagesMap(prev => {
                    const list = prev[convId] || [];
                    return {
                        ...prev,
                        [convId]: list.map(m => m.tempId === tempId ? { ...m, status: 'failed', error: 'Network disconnected' } : m)
                    };
                });
            }, 2000);
        }
    }, [activeConversationId, user, allUsers, replyingTo, conversations, send, connectionState]);

    // Scheduled message helper functions
    const scheduleMessage = useCallback((text, scheduledFor, attachments = [], targetConvId = null) => {
        const convId = targetConvId || activeConversationId;
        if (!convId || !text.trim()) return null;
        const newScheduled = {
            id: `sched_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            conversationId: convId,
            text,
            attachments: attachments || [],
            scheduledFor,
            createdAt: new Date().toISOString(),
            status: 'pending'
        };
        setScheduledMessages(prev => {
            const updated = [...prev, newScheduled];
            localStorage.setItem('chat_scheduled_messages', JSON.stringify(updated));
            return updated;
        });
        return newScheduled;
    }, [activeConversationId]);

    const cancelScheduledMessage = useCallback((id) => {
        setScheduledMessages(prev => {
            const updated = prev.filter(item => item.id !== id);
            localStorage.setItem('chat_scheduled_messages', JSON.stringify(updated));
            return updated;
        });
    }, []);

    const rescheduleMessage = useCallback((id, newScheduledFor) => {
        setScheduledMessages(prev => {
            const updated = prev.map(item => item.id === id ? { ...item, scheduledFor: newScheduledFor } : item);
            localStorage.setItem('chat_scheduled_messages', JSON.stringify(updated));
            return updated;
        });
    }, []);

    // Auto-dispatch scheduled messages when their trigger time arrives
    useEffect(() => {
        const interval = setInterval(() => {
            const now = Date.now();
            setScheduledMessages(prev => {
                const due = prev.filter(item => item.scheduledFor <= now && item.status === 'pending');
                if (due.length === 0) return prev;

                due.forEach(item => {
                    sendMessage(item.text, item.attachments, item.conversationId);
                });

                const remaining = prev.filter(item => item.scheduledFor > now);
                localStorage.setItem('chat_scheduled_messages', JSON.stringify(remaining));
                return remaining;
            });
        }, 1000);
        return () => clearInterval(interval);
    }, [sendMessage]);
    // Send Poll
    const sendPoll = useCallback(async (question, optionsList, allowsMultiple) => {
        if (!activeConversationId || !user)
            return;
        const pollData = {
            id: `poll_${Date.now()}`,
            question,
            options: optionsList.map((text, idx) => ({ id: `opt_${idx}`, text, votes: [] })),
            totalVotes: 0,
            allowsMultiple
        };
        const tempId = `temp_poll_${Date.now()}`;
        const optimisticMsg = {
            id: tempId,
            tempId,
            conversationId: activeConversationId,
            senderId: user.id,
            text: '',
            createdAt: new Date().toISOString(),
            status: 'pending',
            poll: pollData
        };
        setMessagesMap(prev => ({
            ...prev,
            [activeConversationId]: [...(prev[activeConversationId] || []), optimisticMsg]
        }));
        soundManager.playMessageSent();
        send('message:send', {
            conversationId: activeConversationId,
            text: '',
            poll: pollData,
            tempId
        });
    }, [activeConversationId, user, send]);
    // Vote in Poll
    const votePoll = useCallback((messageId, optionId) => {
        if (!user || !activeConversationId)
            return;
        send('message:vote', { messageId, optionId });
        setMessagesMap(prev => {
            const list = prev[activeConversationId] || [];
            return {
                ...prev,
                [activeConversationId]: list.map(m => {
                    if (m.id !== messageId || !m.poll)
                        return m;
                    const poll = { ...m.poll };
                    poll.options = poll.options.map(opt => {
                        if (opt.id === optionId) {
                            const hasVoted = opt.votes.includes(user.id);
                            return {
                                ...opt,
                                votes: hasVoted
                                    ? opt.votes.filter(id => id !== user.id)
                                    : [...opt.votes, user.id]
                            };
                        }
                        else if (!poll.allowsMultiple) {
                            return {
                                ...opt,
                                votes: opt.votes.filter(id => id !== user.id)
                            };
                        }
                        return opt;
                    });
                    return { ...m, poll };
                })
            };
        });
    }, [user, activeConversationId, send]);
    // Send Voice Memo
    const sendVoiceMemo = useCallback(async (duration, waveform, audioUrl) => {
        if (!activeConversationId || !user)
            return;
        const voiceData = {
            id: `vm_${Date.now()}`,
            url: audioUrl || '',
            duration,
            waveform: waveform || [30, 50, 80, 45, 90, 70, 40, 60, 100, 80, 50, 30]
        };
        const tempId = `temp_vm_${Date.now()}`;
        const optimisticMsg = {
            id: tempId,
            tempId,
            conversationId: activeConversationId,
            senderId: user.id,
            text: 'Voice message',
            createdAt: new Date().toISOString(),
            status: 'pending',
            voiceMemo: voiceData
        };
        setMessagesMap(prev => ({
            ...prev,
            [activeConversationId]: [...(prev[activeConversationId] || []), optimisticMsg]
        }));
        soundManager.playMessageSent();
        send('message:send', {
            conversationId: activeConversationId,
            text: 'Voice message',
            voiceMemo: voiceData,
            tempId
        });
    }, [activeConversationId, user, send]);
    // Toggle Pin Message
    const togglePinMessage = useCallback((messageId) => {
        if (!activeConversationId || !user)
            return;
        send('message:pin', { messageId, conversationId: activeConversationId });
        setMessagesMap(prev => {
            const list = prev[activeConversationId] || [];
            return {
                ...prev,
                [activeConversationId]: list.map(m => m.id === messageId ? { ...m, isPinned: !m.isPinned } : m)
            };
        });
    }, [activeConversationId, user, send]);
    // Toggle Star / Bookmark Message
    const toggleStarMessage = useCallback((messageId) => {
        setMessagesMap(prev => {
            const next = { ...prev };
            Object.keys(next).forEach(cId => {
                next[cId] = next[cId].map(m => m.id === messageId ? { ...m, isStarred: !m.isStarred } : m);
            });
            return next;
        });
    }, []);
    // Retry sending failed message
    const retryMessage = useCallback(async (failedMsg) => {
        if (!user)
            return;
        const convId = failedMsg.conversationId;
        setMessagesMap(prev => {
            const list = prev[convId] || [];
            return {
                ...prev,
                [convId]: list.map(m => m.id === failedMsg.id || m.tempId === failedMsg.tempId ? { ...m, status: 'pending', error: undefined } : m)
            };
        });
        const sent = send('message:send', {
            conversationId: convId,
            text: failedMsg.text,
            replyTo: failedMsg.replyTo,
            attachments: failedMsg.attachments,
            poll: failedMsg.poll,
            voiceMemo: failedMsg.voiceMemo,
            tempId: failedMsg.tempId || failedMsg.id
        });
        if (!sent) {
            setTimeout(() => {
                setMessagesMap(prev => {
                    const list = prev[convId] || [];
                    return {
                        ...prev,
                        [convId]: list.map(m => m.id === failedMsg.id || m.tempId === failedMsg.tempId
                            ? { ...m, status: 'failed', error: 'Could not send message. Socket offline.' }
                            : m)
                    };
                });
            }, 500);
        }
    }, [user, send]);
    // Edit message
    const editMessage = useCallback((messageId, newText) => {
        if (!newText.trim() || !user)
            return;
        send('message:edit', { messageId, text: newText });
        if (activeConversationId) {
            setMessagesMap(prev => {
                const list = prev[activeConversationId] || [];
                return {
                    ...prev,
                    [activeConversationId]: list.map(m => m.id === messageId ? { ...m, text: newText, isEdited: true, updatedAt: new Date().toISOString() } : m)
                };
            });
        }
        setEditingMessage(null);
    }, [user, send, activeConversationId]);
    // Delete message
    const deleteMessage = useCallback((messageId) => {
        if (!user)
            return;
        send('message:delete', { messageId });
        if (activeConversationId) {
            setMessagesMap(prev => {
                const list = prev[activeConversationId] || [];
                return {
                    ...prev,
                    [activeConversationId]: list.map(m => m.id === messageId ? { ...m, isDeleted: true, text: 'This message was deleted', attachments: [], poll: undefined, voiceMemo: undefined } : m)
                };
            });
        }
    }, [user, send, activeConversationId]);
    // Emoji Reactions
    const reactToMessage = useCallback((messageId, emoji) => {
        if (!user || !activeConversationId)
            return;
        send('message:react', { messageId, emoji });
        setMessagesMap(prev => {
            const list = prev[activeConversationId] || [];
            return {
                ...prev,
                [activeConversationId]: list.map(m => {
                    if (m.id !== messageId)
                        return m;
                    const reactions = { ...(m.reactions || {}) };
                    const users = reactions[emoji] || [];
                    if (users.includes(user.id)) {
                        const nextUsers = users.filter(id => id !== user.id);
                        if (nextUsers.length === 0) {
                            delete reactions[emoji];
                        }
                        else {
                            reactions[emoji] = nextUsers;
                        }
                    }
                    else {
                        reactions[emoji] = [...users, user.id];
                    }
                    return { ...m, reactions };
                })
            };
        });
    }, [user, activeConversationId, send]);
    // Typing indicators
    const stopTyping = useCallback(() => {
        setIsSelfTyping(false);
        if (!activeConversationId || !user)
            return;
        if (isTypingRef.current) {
            isTypingRef.current = false;
            send('typing:stop', { conversationId: activeConversationId });
        }
    }, [activeConversationId, user, send]);

    const startTyping = useCallback(() => {
        setIsSelfTyping(true);
        if (!activeConversationId || !user)
            return;
        if (!isTypingRef.current) {
            isTypingRef.current = true;
            send('typing:start', { conversationId: activeConversationId });
        }
        if (typingTimeoutRef.current)
            clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
            stopTyping();
        }, 2200);
    }, [activeConversationId, user, send, stopTyping]);

    const simulateTyping = useCallback((durationMs = 3500) => {
        if (!activeConversationId || !user)
            return;
        send('typing:simulate', { conversationId: activeConversationId });
        // Immediate local response for smooth feedback
        const conv = conversations.find(c => c.id === activeConversationId);
        if (conv) {
            const partnerId = conv.participantIds.find(id => id !== user.id) || 'u2';
            const partnerUser = allUsers.find(u => u.id === partnerId) || { id: 'u2', name: 'Sarah Connor' };
            setTypingMap(prev => {
                const current = prev[activeConversationId] || [];
                if (current.some(t => t.userId === partnerUser.id))
                    return prev;
                return {
                    ...prev,
                    [activeConversationId]: [...current, { userId: partnerUser.id, userName: partnerUser.name, timestamp: Date.now() }]
                };
            });
            setTimeout(() => {
                setTypingMap(prev => {
                    const current = prev[activeConversationId] || [];
                    return {
                        ...prev,
                        [activeConversationId]: current.filter(t => t.userId !== partnerUser.id)
                    };
                });
            }, durationMs);
        }
    }, [activeConversationId, user, conversations, allUsers, send]);
    // Create Conversation (direct or group)
    const createConversation = useCallback(async (type, name, participantIds, avatar, description) => {
        const res = await fetch('/api/conversations', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type, name, participantIds, avatar, description })
        });
        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error || 'Failed to create conversation');
        }
        const created = await res.json();
        setConversations(prev => [created, ...prev.filter(c => c.id !== created.id)]);
        setActiveConversationId(created.id);
        return created;
    }, []);
    // Real-Time Socket Event Listeners
    useEffect(() => {
        const unsubNewMsg = on('message:new', ({ message, tempId }) => {
            const convId = message.conversationId;
            const isFromMe = message.senderId === user?.id;
            if (!isFromMe) {
                soundManager.playIncomingMessage();
            }
            setMessagesMap(prev => {
                const list = prev[convId] || [];
                if (tempId) {
                    const idx = list.findIndex(m => m.tempId === tempId || m.id === tempId);
                    if (idx !== -1) {
                        const next = [...list];
                        next[idx] = message;
                        return { ...prev, [convId]: next };
                    }
                }
                if (list.some(m => m.id === message.id))
                    return prev;
                return { ...prev, [convId]: [...list, message] };
            });
            setConversations(prev => {
                const list = [...prev];
                const idx = list.findIndex(c => c.id === convId);
                const isActiveChat = activeConversationId === convId;
                if (idx !== -1) {
                    const currentConv = list[idx];
                    const unread = (!isActiveChat && !isFromMe) ? (currentConv.unreadCount || 0) + 1 : 0;
                    const updated = {
                        ...currentConv,
                        lastMessage: message,
                        unreadCount: unread,
                        updatedAt: message.createdAt
                    };
                    list.splice(idx, 1);
                    list.unshift(updated);
                }
                return list;
            });
            if (activeConversationId === convId && !isFromMe) {
                markAsRead(convId);
            }
        });
        const unsubStatus = on('message:status', ({ conversationId, status }) => {
            setMessagesMap(prev => {
                const list = prev[conversationId];
                if (!list)
                    return prev;
                return {
                    ...prev,
                    [conversationId]: list.map(m => m.senderId === user?.id && m.status !== 'read' ? { ...m, status } : m)
                };
            });
        });
        const unsubUpdate = on('message:update', ({ message }) => {
            setMessagesMap(prev => {
                const list = prev[message.conversationId];
                if (!list)
                    return prev;
                return {
                    ...prev,
                    [message.conversationId]: list.map(m => (m.id === message.id ? message : m))
                };
            });
        });
        const unsubDelete = on('message:deleted', ({ conversationId, messageId }) => {
            setMessagesMap(prev => {
                const list = prev[conversationId];
                if (!list)
                    return prev;
                return {
                    ...prev,
                    [conversationId]: list.map(m => m.id === messageId ? { ...m, isDeleted: true, text: 'This message was deleted', attachments: [], poll: undefined, voiceMemo: undefined } : m)
                };
            });
        });
        const unsubReaction = on('message:reaction', ({ conversationId, messageId, reactions }) => {
            setMessagesMap(prev => {
                const list = prev[conversationId];
                if (!list)
                    return prev;
                return {
                    ...prev,
                    [conversationId]: list.map(m => m.id === messageId ? { ...m, reactions } : m)
                };
            });
        });
        const unsubPin = on('message:pin', ({ conversationId, messageId, isPinned }) => {
            setMessagesMap(prev => {
                const list = prev[conversationId];
                if (!list)
                    return prev;
                return {
                    ...prev,
                    [conversationId]: list.map(m => (m.id === messageId ? { ...m, isPinned } : m))
                };
            });
        });
        const unsubVote = on('message:vote', ({ conversationId, messageId, poll }) => {
            setMessagesMap(prev => {
                const list = prev[conversationId];
                if (!list)
                    return prev;
                return {
                    ...prev,
                    [conversationId]: list.map(m => (m.id === messageId ? { ...m, poll } : m))
                };
            });
        });
        const unsubTyping = on('typing:update', ({ conversationId, userId, userName, isTyping }) => {
            setTypingMap(prev => {
                const current = prev[conversationId] || [];
                if (isTyping) {
                    if (current.some(t => t.userId === userId))
                        return prev;
                    return {
                        ...prev,
                        [conversationId]: [...current, { userId, userName: userName || 'Someone', timestamp: Date.now() }]
                    };
                }
                else {
                    return {
                        ...prev,
                        [conversationId]: current.filter(t => t.userId !== userId)
                    };
                }
            });
            if (isTyping) {
                setTimeout(() => {
                    setTypingMap(prev => {
                        const current = prev[conversationId] || [];
                        return {
                            ...prev,
                            [conversationId]: current.filter(t => t.userId !== userId)
                        };
                    });
                }, 4500);
            }
        });
        const unsubNewConv = on('conversation:new', (conv) => {
            setConversations(prev => {
                if (prev.some(c => c.id === conv.id))
                    return prev;
                return [conv, ...prev];
            });
        });
        const unsubPresence = on('presence:update', (payload) => {
            if (payload?.userId === user?.id && payload?.status && updateStatus) {
                updateStatus(payload.status);
            }
            if (refreshUsers) refreshUsers();
        });
        return () => {
            unsubNewMsg();
            unsubStatus();
            unsubUpdate();
            unsubDelete();
            unsubReaction();
            unsubPin();
            unsubVote();
            unsubTyping();
            unsubNewConv();
            unsubPresence();
        };
    }, [on, user, activeConversationId, markAsRead, refreshUsers, updateStatus]);
    const totalUnread = conversations.reduce((acc, c) => acc + (c.unreadCount || 0), 0);
    const activeTypingList = (activeConversationId && typingMap[activeConversationId]) || [];
    const isSomeoneTyping = activeTypingList.length > 0;
    const typingUserName = activeTypingList[0]?.userName || '';

    useEffect(() => {
        updateTabAnimation({
            unreadCount: totalUnread,
            isTyping: isSomeoneTyping,
            typingName: typingUserName
        });

        return () => {
            stopTabAnimation();
        };
    }, [totalUnread, isSomeoneTyping, typingUserName]);
    return (<ChatContext.Provider value={{
            conversations,
            activeConversationId,
            activeConversation,
            messages: currentMessages,
            messagesMap,
            hasMoreMessages: currentHasMore,
            isLoadingMessages,
            isInitialLoading,
            typingUsers: currentTypingUsers,
            searchQuery,
            activeFilter,
            messageSearchQuery,
            replyingTo,
            editingMessage,
            isDetailsOpen,
            lightboxImage,
            activePinnedMessage,
            isPollModalOpen,
            isStarredModalOpen,
            // Threading
            activeThreadMessage,
            openThread,
            closeThread,
            threadMessages,
            sendThreadReply,
            // Wallpaper
            wallpaperTheme,
            setWallpaperTheme,
            isWallpaperModalOpen,
            setIsWallpaperModalOpen,
            // Forwarding
            forwardingMessage,
            setForwardingMessage,
            forwardMessageToConversation,
            // Calling
            activeCall,
            startCall,
            endCall,
            toggleMuteCall,
            toggleVideoCall,
            setActiveConversationId,
            setSearchQuery,
            setActiveFilter,
            setMessageSearchQuery,
            setReplyingTo,
            setEditingMessage,
            setIsDetailsOpen,
            setLightboxImage,
            setIsPollModalOpen,
            setIsStarredModalOpen,
            // Scheduled messages
            scheduledMessages,
            scheduleMessage,
            cancelScheduledMessage,
            rescheduleMessage,
            isScheduleModalOpen,
            setIsScheduleModalOpen,
            // Profile modal
            isProfileModalOpen,
            setIsProfileModalOpen,
            // Export modal
            isExportModalOpen,
            setIsExportModalOpen,
            // E2EE
            isE2EEModalOpen,
            setIsE2EEModalOpen,
            verifiedConversations,
            toggleVerifyConversation,
            toastNotification,
            showToast,
            fetchInitialMessages,
            loadMoreMessages,
            sendMessage,
            sendPoll,
            votePoll,
            sendVoiceMemo,
            togglePinMessage,
            toggleStarMessage,
            retryMessage,
            editMessage,
            deleteMessage,
            reactToMessage,
            startTyping,
            stopTyping,
            simulateTyping,
            isSelfTyping,
            typingMap,
            markAsRead,
            createConversation,
            refreshConversations: fetchConversations
        }}>
      {children}
    </ChatContext.Provider>);
};
export const useChat = () => {
    const context = useContext(ChatContext);
    if (!context) {
        throw new Error('useChat must be used within a ChatProvider');
    }
    return context;
};
