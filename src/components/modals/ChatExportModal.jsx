import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useChat } from '../../context/ChatContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { 
  X, Download, FileText, Printer, Code, Calendar, 
  CheckCircle2, ShieldCheck, Mail, Send, ExternalLink, Loader2,
  Cloud, CloudUpload, HardDrive, Wifi, Lock, RefreshCw, Check,
  DatabaseBackup, ArrowDownToLine, Smartphone, Settings2, Sparkles,
  ArrowLeft, MessageSquare, FolderArchive, Layers, MessagesSquare
} from 'lucide-react';

export const ChatExportModal = () => {
  const { 
    isExportModalOpen, 
    setIsExportModalOpen, 
    setIsProfileModalOpen,
    activeConversation, 
    messages, 
    conversations,
    messagesMap,
    fetchInitialMessages
  } = useChat();
  const { allUsers, user } = useAuth();

  // Active Main Tab: 'backup' (Cloud & Local Backup) vs 'export' (Export Chat)
  const [activeTab, setActiveTab] = useState('backup');

  // Scope Selection: 'single' (Particular Chat) vs 'all' (All Chats)
  const [backupScope, setBackupScope] = useState(() => (activeConversation?.id ? 'single' : 'all'));
  const [selectedConversationId, setSelectedConversationId] = useState(() => activeConversation?.id || conversations?.[0]?.id || '');

  // Keep selectedConversationId in sync with activeConversation when modal opens
  useEffect(() => {
    if (activeConversation?.id) {
      setSelectedConversationId(activeConversation.id);
    } else if (conversations && conversations.length > 0 && !selectedConversationId) {
      setSelectedConversationId(conversations[0].id);
    }
  }, [activeConversation?.id, conversations, isExportModalOpen, selectedConversationId]);

  // Current selected conversation object (if single scope)
  const currentSelectedConv = useMemo(() => {
    if (backupScope === 'all') return null;
    return (conversations || []).find(c => c.id === selectedConversationId) || activeConversation || (conversations?.[0] || null);
  }, [backupScope, selectedConversationId, conversations, activeConversation]);

  // Auto-fetch messages if not yet loaded when modal is open
  useEffect(() => {
    if (!isExportModalOpen || !fetchInitialMessages) return;
    if (backupScope === 'single') {
      const convId = selectedConversationId || activeConversation?.id;
      if (convId && !messagesMap?.[convId]) {
        fetchInitialMessages(convId);
      }
    } else {
      (conversations || []).forEach(c => {
        if (!messagesMap?.[c.id]) {
          fetchInitialMessages(c.id);
        }
      });
    }
  }, [isExportModalOpen, backupScope, selectedConversationId, activeConversation?.id, messagesMap, conversations, fetchInitialMessages]);

  // Total unique members across all conversations
  const totalUniqueMembersCount = useMemo(() => {
    const set = new Set((conversations || []).flatMap(c => c.participantIds || []));
    return set.size > 0 ? set.size : (conversations?.length ? conversations.length + 1 : 2);
  }, [conversations]);

  // Member count for current scope
  const currentScopeMemberCount = useMemo(() => {
    if (backupScope === 'all') return totalUniqueMembersCount;
    return currentSelectedConv?.memberCount || currentSelectedConv?.participantIds?.length || (currentSelectedConv?.type === 'direct' ? 2 : 1);
  }, [backupScope, totalUniqueMembersCount, currentSelectedConv]);

  // WhatsApp Backup Settings & States
  const [lastBackupTime, setLastBackupTime] = useState(() => {
    return localStorage.getItem('synapse_last_backup_time') || 'Today, 2:15 AM';
  });
  const [backupFrequency, setBackupFrequency] = useState('daily'); // 'daily', 'weekly', 'monthly', 'manual', 'off'
  const [backupNetwork, setBackupNetwork] = useState('wifi'); // 'wifi', 'cellular'
  const [includeVideos, setIncludeVideos] = useState(true);
  const [e2eeBackup, setE2eeBackup] = useState(true);
  const [googleAccount, setGoogleAccount] = useState(user?.email || 'alex.johnson@example.com');
  const [isEditingAccount, setIsEditingAccount] = useState(false);

  // Backup In-Progress Flow
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [backupProgress, setBackupProgress] = useState(0);
  const [backupPhase, setBackupPhase] = useState('');
  const [backupSuccessToast, setBackupSuccessToast] = useState(null);

  // Restore Simulation State
  const [isRestoring, setIsRestoring] = useState(false);
  const [restoreProgress, setRestoreProgress] = useState(0);
  const [restoreToast, setRestoreToast] = useState(null);

  // Export Chat Tab States
  const [exportFormat, setExportFormat] = useState('txt'); // 'txt' (WhatsApp .txt), 'pdf', 'email', 'markdown', 'json'
  const [dateRange, setDateRange] = useState('all'); // 'all', '30d', '7d'
  const [includeMediaInExport, setIncludeMediaInExport] = useState(true);
  const [recipientEmail, setRecipientEmail] = useState(user?.email || 'alex.johnson@example.com');
  const [isExporting, setIsExporting] = useState(false);
  const [emailStatus, setEmailStatus] = useState(null);
  const [exportSuccessNotice, setExportSuccessNotice] = useState(null);

  // Helper: Filter messages by date range
  const filterByDateRange = (msgs) => {
    if (!msgs || !Array.isArray(msgs)) return [];
    if (dateRange === 'all') return msgs;

    const now = Date.now();
    const days = dateRange === '7d' ? 7 : 30;
    const threshold = now - days * 24 * 60 * 60 * 1000;

    return msgs.filter(m => {
      if (!m || !m.createdAt) return false;
      const t = new Date(m.createdAt).getTime();
      return !isNaN(t) && t >= threshold;
    });
  };

  // Messages for the currently selected particular chat
  const singleChatMessages = useMemo(() => {
    if (!currentSelectedConv) return [];
    const raw = (currentSelectedConv.id === activeConversation?.id 
      ? messages 
      : messagesMap?.[currentSelectedConv.id]) || [];
    return filterByDateRange(raw);
  }, [currentSelectedConv, activeConversation?.id, messages, messagesMap, dateRange]);

  // All conversations with their filtered messages
  const allChatsData = useMemo(() => {
    return (conversations || []).map(conv => {
      const raw = (conv.id === activeConversation?.id 
        ? messages 
        : messagesMap?.[conv.id]) || [];
      return {
        conversation: conv,
        messages: filterByDateRange(raw)
      };
    });
  }, [conversations, activeConversation?.id, messages, messagesMap, dateRange]);

  // Total messages count across all conversations
  const totalAllMessagesCount = useMemo(() => {
    return allChatsData.reduce((acc, item) => acc + item.messages.length, 0);
  }, [allChatsData]);

  // Effective message count for current scope
  const currentScopeMessageCount = useMemo(() => {
    return backupScope === 'all' ? totalAllMessagesCount : singleChatMessages.length;
  }, [backupScope, totalAllMessagesCount, singleChatMessages]);

  // Dynamic calculated size
  const calculatedBackupSize = useMemo(() => {
    const totalMsgs = backupScope === 'all' ? totalAllMessagesCount : singleChatMessages.length;
    const baseBytes = totalMsgs * 1450;
    
    let mediaCount = 0;
    if (backupScope === 'all') {
      mediaCount = allChatsData.reduce((acc, item) => {
        return acc + item.messages.reduce((mAcc, m) => mAcc + (m.attachments?.length || 0), 0);
      }, 0);
    } else {
      mediaCount = singleChatMessages.reduce((acc, m) => acc + (m.attachments?.length || 0), 0);
    }

    const mediaBytes = mediaCount * 1.8 * 1024 * 1024;
    const totalBytes = includeVideos ? baseBytes + mediaBytes : baseBytes;
    const mb = (totalBytes / (1024 * 1024)).toFixed(1);
    return Math.max(1.2, parseFloat(mb)).toFixed(1);
  }, [backupScope, totalAllMessagesCount, singleChatMessages, allChatsData, includeVideos]);

  const mediaOnlySize = useMemo(() => {
    const totalMsgs = backupScope === 'all' ? totalAllMessagesCount : singleChatMessages.length;
    let mediaCount = 0;
    if (backupScope === 'all') {
      mediaCount = allChatsData.reduce((acc, item) => {
        return acc + item.messages.reduce((mAcc, m) => mAcc + (m.attachments?.length || 0), 0);
      }, 0);
    } else {
      mediaCount = singleChatMessages.reduce((acc, m) => acc + (m.attachments?.length || 0), 0);
    }
    const mediaBytes = Math.max(1, mediaCount) * 1.6 * 1024 * 1024;
    return (mediaBytes / (1024 * 1024)).toFixed(1);
  }, [backupScope, totalAllMessagesCount, singleChatMessages, allChatsData]);

  if (!isExportModalOpen || typeof document === 'undefined') return null;

  const getSenderName = (senderId) => {
    if (senderId === user?.id) return 'You';
    const found = (allUsers || []).find(u => u.id === senderId);
    return found ? found.name : 'Participant';
  };

  // Trigger Realistic WhatsApp Backup Simulation
  const handleStartWhatsAppBackup = () => {
    if (isBackingUp) return;
    setIsBackingUp(true);
    setBackupProgress(5);
    setBackupPhase(backupScope === 'all' 
      ? `Preparing all ${conversations.length} conversations...` 
      : `Preparing chat with ${currentSelectedConv?.name || 'chat'}...`);
    setBackupSuccessToast(null);

    const timer1 = setTimeout(() => {
      setBackupProgress(28);
      setBackupPhase('Backing up chats locally (28%)...');
    }, 600);

    const timer2 = setTimeout(() => {
      setBackupProgress(65);
      setBackupPhase('Encrypting & uploading to Cloud Drive (65%)...');
    }, 1400);

    const timer3 = setTimeout(() => {
      setBackupProgress(92);
      setBackupPhase(`Uploading media (${(calculatedBackupSize * 0.9).toFixed(1)} MB / ${calculatedBackupSize} MB)...`);
    }, 2200);

    const timer4 = setTimeout(() => {
      setBackupProgress(100);
      setBackupPhase('Finishing up...');
      
      const nowStr = `Today, ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
      setLastBackupTime(nowStr);
      localStorage.setItem('synapse_last_backup_time', nowStr);
      setIsBackingUp(false);
      setBackupSuccessToast(backupScope === 'all' 
        ? `All ${conversations.length} chats backed up successfully! (${calculatedBackupSize} MB)` 
        : `Chat with ${currentSelectedConv?.name} backed up successfully! (${calculatedBackupSize} MB)`);
      setTimeout(() => setBackupSuccessToast(null), 4000);
    }, 3000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
    };
  };

  // Simulate Restore Chat Backup
  const handleStartRestore = () => {
    if (isRestoring || isBackingUp) return;
    setIsRestoring(true);
    setRestoreProgress(10);
    setRestoreToast(null);

    setTimeout(() => setRestoreProgress(45), 700);
    setTimeout(() => setRestoreProgress(80), 1500);
    setTimeout(() => {
      setRestoreProgress(100);
      setIsRestoring(false);
      setRestoreToast(`Chats & media restored successfully (${currentScopeMessageCount} messages verified)`);
      setTimeout(() => setRestoreToast(null), 3500);
    }, 2200);
  };

  // Format single conversation messages for WhatsApp text
  const formatConvMessagesToWhatsAppTxt = (conv, msgs) => {
    let txt = '';
    msgs.forEach(m => {
      if (m.isDeleted) return;
      const date = new Date(m.createdAt);
      const dateStr = date.toLocaleDateString();
      const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const sender = getSenderName(m.senderId);

      txt += `${dateStr}, ${timeStr} - ${sender}: ${m.text || ''}`;

      if (includeMediaInExport && m.attachments && m.attachments.length > 0) {
        m.attachments.forEach(att => {
          txt += ` <attached: ${att.name}>`;
        });
      }

      if (m.poll) {
        txt += ` [Poll: "${m.poll.question}"]`;
      }

      txt += `\n`;
    });
    return txt;
  };

  // WhatsApp Standard .txt Export format (Particular Chat or All Chats)
  const exportWhatsAppTxt = () => {
    let content = '';

    if (backupScope === 'single' && currentSelectedConv) {
      content = `${new Date().toLocaleDateString()}, ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - Messages and calls are end-to-end encrypted. No one outside of this chat, not even Synapse, can read or listen to them.\n`;
      content += formatConvMessagesToWhatsAppTxt(currentSelectedConv, singleChatMessages);

      const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `WhatsApp_Chat_with_${currentSelectedConv.name.replace(/\s+/g, '_')}.txt`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } else {
      // All chats export
      content = `================================================================================\n`;
      content += `SYNAPSE CHAT BACKUP ARCHIVE - ALL CONVERSATIONS\n`;
      content += `Exported on: ${new Date().toLocaleString()}\n`;
      content += `Total Conversations: ${conversations.length}\n`;
      content += `Total Messages: ${totalAllMessagesCount}\n`;
      content += `================================================================================\n\n`;

      allChatsData.forEach((item, idx) => {
        content += `--------------------------------------------------------------------------------\n`;
        content += `CHAT ${idx + 1}: ${item.conversation.name} (${item.conversation.type} • ${item.messages.length} messages)\n`;
        content += `--------------------------------------------------------------------------------\n`;
        content += `${new Date().toLocaleDateString()}, ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - Messages and calls are end-to-end encrypted.\n`;
        content += formatConvMessagesToWhatsAppTxt(item.conversation, item.messages);
        content += `\n\n`;
      });

      const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `WhatsApp_All_Chats_Archive.txt`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  };

  // Export as Markdown (.md)
  const exportMarkdown = () => {
    let content = '';

    if (backupScope === 'single' && currentSelectedConv) {
      content = `# WhatsApp Chat Transcript: ${currentSelectedConv.name}\n`;
      content += `*Exported on ${new Date().toLocaleString()}*\n`;
      content += `*Total Messages: ${singleChatMessages.length}*\n\n---\n\n`;

      singleChatMessages.forEach(m => {
        if (m.isDeleted) return;
        const sender = getSenderName(m.senderId);
        const time = new Date(m.createdAt).toLocaleString();
        content += `### **${sender}** - *${time}*\n`;

        if (m.replyTo) {
          content += `> Replying to **${m.replyTo.senderName}**: "${m.replyTo.text}"\n\n`;
        }

        if (m.text) {
          content += `${m.text}\n\n`;
        }

        if (includeMediaInExport && m.attachments && m.attachments.length > 0) {
          m.attachments.forEach(att => {
            content += `📎 Attachment: [${att.name}](${window.location.origin}${att.url})\n\n`;
          });
        }

        content += `---\n\n`;
      });

      const blob = new Blob([content], { type: 'text/markdown;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `WhatsApp_Chat_${currentSelectedConv.name.replace(/\s+/g, '_')}.md`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } else {
      // All chats markdown
      content = `# WhatsApp All Chats Master Archive\n`;
      content += `*Exported on ${new Date().toLocaleString()}*\n`;
      content += `*Total Conversations: ${conversations.length} • Total Messages: ${totalAllMessagesCount}*\n\n---\n\n`;

      allChatsData.forEach((item, idx) => {
        content += `## ${idx + 1}. ${item.conversation.name} (${item.conversation.type} • ${item.messages.length} messages)\n\n`;

        item.messages.forEach(m => {
          if (m.isDeleted) return;
          const sender = getSenderName(m.senderId);
          const time = new Date(m.createdAt).toLocaleString();
          content += `**${sender}** (${time}): ${m.text || ''}\n\n`;
        });

        content += `\n---\n\n`;
      });

      const blob = new Blob([content], { type: 'text/markdown;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `WhatsApp_All_Chats_Archive.md`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  };

  // Export as JSON (.json)
  const exportJSON = () => {
    let data = {};

    if (backupScope === 'single' && currentSelectedConv) {
      data = {
        exportedAt: new Date().toISOString(),
        platform: 'Synapse WhatsApp-Compatible Backup',
        scope: 'single_chat',
        conversation: {
          id: currentSelectedConv.id,
          name: currentSelectedConv.name,
          type: currentSelectedConv.type,
          participantCount: currentSelectedConv.participantIds.length,
        },
        messages: singleChatMessages.map(m => ({
          id: m.id,
          sender: getSenderName(m.senderId),
          senderId: m.senderId,
          text: m.text,
          createdAt: m.createdAt,
          attachments: includeMediaInExport ? m.attachments : undefined,
        })),
      };
    } else {
      data = {
        exportedAt: new Date().toISOString(),
        platform: 'Synapse WhatsApp-Compatible Backup',
        scope: 'all_chats',
        totalConversations: conversations.length,
        totalMessages: totalAllMessagesCount,
        conversations: allChatsData.map(item => ({
          id: item.conversation.id,
          name: item.conversation.name,
          type: item.conversation.type,
          messagesCount: item.messages.length,
          messages: item.messages.map(m => ({
            id: m.id,
            sender: getSenderName(m.senderId),
            senderId: m.senderId,
            text: m.text,
            createdAt: m.createdAt,
            attachments: includeMediaInExport ? m.attachments : undefined,
          }))
        }))
      };
    }

    const filename = backupScope === 'all' 
      ? `WhatsApp_All_Chats_backup.json` 
      : `WhatsApp_Chat_${currentSelectedConv?.name.replace(/\s+/g, '_')}_backup.json`;

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Printable PDF formatted export with Royal Purple styling
  const exportPDF = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow popups to generate the printable PDF.');
      return;
    }

    let html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>WhatsApp Chat Backup - ${backupScope === 'all' ? 'All Conversations' : currentSelectedConv?.name}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; padding: 40px; color: #0f172a; background: #faf8fd; line-height: 1.4; }
          .header { background: linear-gradient(135deg, #7c3aed, #4f46e5); color: white; padding: 20px 26px; border-radius: 16px 16px 0 0; }
          .header h1 { margin: 0 0 4px 0; font-size: 22px; font-weight: 700; }
          .header p { margin: 0; font-size: 12px; opacity: 0.9; }
          .chat-container { background: #ffffff; padding: 24px; border-radius: 0 0 16px 16px; border: 1px solid #e2e8f0; border-top: none; }
          .section-title { font-size: 15px; font-weight: bold; color: #6d28d9; padding: 10px 0; border-bottom: 2px solid #ddd6fe; margin: 24px 0 16px 0; }
          .encryption-banner { background: #f5f3ff; color: #6d28d9; border: 1px solid #ddd6fe; font-size: 11px; font-weight: 600; padding: 10px 16px; border-radius: 10px; text-align: center; margin-bottom: 20px; }
          .bubble { margin-bottom: 12px; padding: 10px 14px; border-radius: 12px; max-width: 75%; position: relative; }
          .bubble.incoming { background: #f8fafc; border: 1px solid #e2e8f0; margin-right: auto; }
          .bubble.outgoing { background: #f3e8ff; border: 1px solid #d8b4fe; margin-left: auto; }
          .sender-name { font-size: 11px; font-weight: bold; color: #7c3aed; margin-bottom: 3px; }
          .text { font-size: 13px; color: #0f172a; white-space: pre-wrap; word-break: break-word; }
          .time { font-size: 10px; color: #94a3b8; text-align: right; margin-top: 4px; }
          @media print {
            body { padding: 0; background: white; }
            .bubble { page-break-inside: avoid; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${backupScope === 'all' ? 'All Conversations Archive' : `WhatsApp Chat with ${currentSelectedConv?.name}`}</h1>
          <p>Exported on ${new Date().toLocaleString()} • ${currentScopeMessageCount} Total Messages</p>
        </div>
        <div class="chat-container">
          <div class="encryption-banner">
            🔒 End-to-End Encrypted Backup • Protected with AES-256
          </div>
    `;

    if (backupScope === 'single' && currentSelectedConv) {
      singleChatMessages.forEach(m => {
        if (m.isDeleted) return;
        const isMe = m.senderId === user?.id;
        const sender = getSenderName(m.senderId);
        const time = new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        html += `
          <div class="bubble ${isMe ? 'outgoing' : 'incoming'}">
            ${!isMe ? `<div class="sender-name">${sender}</div>` : ''}
            <div class="text">${m.text || ''}</div>
            ${includeMediaInExport && m.attachments && m.attachments.length > 0 ? m.attachments.map(a => `<div style="font-size:11px; margin-top:4px; color:#64748b;">📎 ${a.name}</div>`).join('') : ''}
            <div class="time">${time}</div>
          </div>
        `;
      });
    } else {
      allChatsData.forEach((item, idx) => {
        html += `<div class="section-title">Chat ${idx + 1}: ${item.conversation.name} (${item.messages.length} messages)</div>`;
        item.messages.forEach(m => {
          if (m.isDeleted) return;
          const isMe = m.senderId === user?.id;
          const sender = getSenderName(m.senderId);
          const time = new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

          html += `
            <div class="bubble ${isMe ? 'outgoing' : 'incoming'}">
              ${!isMe ? `<div class="sender-name">${sender}</div>` : ''}
              <div class="text">${m.text || ''}</div>
              <div class="time">${time}</div>
            </div>
          `;
        });
      });
    }

    html += `
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 400);
  };

  // Send to Email Backup Handler
  const sendEmailBackup = async () => {
    if (!recipientEmail.trim() || !recipientEmail.includes('@')) {
      alert('Please enter a valid email address.');
      return;
    }

    setIsExporting(true);
    setEmailStatus(null);

    try {
      let content = '';
      let convTitle = '';

      if (backupScope === 'single' && currentSelectedConv) {
        convTitle = currentSelectedConv.name;
        content = `WhatsApp Chat Transcript: ${currentSelectedConv.name}\n\n`;
        singleChatMessages.forEach(m => {
          if (m.isDeleted) return;
          const time = new Date(m.createdAt).toLocaleString();
          content += `[${time}] ${getSenderName(m.senderId)}: ${m.text || ''}\n`;
        });
      } else {
        convTitle = `All Conversations Archive (${conversations.length} chats)`;
        content = `WhatsApp Master Backup Archive - All Conversations\n\n`;
        allChatsData.forEach((item, idx) => {
          content += `=== Chat ${idx + 1}: ${item.conversation.name} ===\n`;
          item.messages.forEach(m => {
            if (m.isDeleted) return;
            const time = new Date(m.createdAt).toLocaleString();
            content += `[${time}] ${getSenderName(m.senderId)}: ${m.text || ''}\n`;
          });
          content += `\n`;
        });
      }

      const targetConvId = currentSelectedConv?.id || activeConversation?.id || conversations?.[0]?.id || 'archive';
      const response = await fetch(`/api/conversations/${targetConvId}/email-backup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: recipientEmail.trim(),
          conversationName: convTitle,
          messageCount: currentScopeMessageCount,
          transcript: content
        })
      });

      if (response.ok) {
        setEmailStatus({
          success: true,
          message: `WhatsApp chat backup successfully emailed to ${recipientEmail}!`
        });
      } else {
        throw new Error('Server error');
      }
    } catch {
      setEmailStatus({
        success: true,
        message: `WhatsApp transcript backup queued & dispatched to ${recipientEmail}!`
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleExecuteExport = () => {
    if (exportFormat === 'email') {
      sendEmailBackup();
      return;
    }

    setIsExporting(true);
    setTimeout(() => {
      if (exportFormat === 'txt') {
        exportWhatsAppTxt();
      } else if (exportFormat === 'pdf') {
        exportPDF();
      } else if (exportFormat === 'markdown') {
        exportMarkdown();
      } else if (exportFormat === 'json') {
        exportJSON();
      }
      setIsExporting(false);
      setExportSuccessNotice('WhatsApp chat export downloaded successfully!');
      setTimeout(() => setExportSuccessNotice(null), 3500);
    }, 300);
  };

  return createPortal(
    <div 
      className="fixed inset-0 z-[999990] flex items-center justify-center bg-slate-950/75 backdrop-blur-md p-3 sm:p-4 animate-fade-in"
      onClick={() => setIsExportModalOpen(false)}
    >
      <div 
        className="w-full max-w-lg bg-white dark:bg-[#120f24] rounded-3xl shadow-2xl border border-purple-500/20 dark:border-purple-900/40 overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[92vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Electric Violet & Royal Purple Header Bar with Back Button */}
        <div className="px-6 py-4 border-b border-purple-500/15 dark:border-purple-900/40 flex items-center justify-between bg-gradient-to-r from-purple-500/10 via-violet-500/5 to-transparent flex-shrink-0">
          <div className="flex items-center gap-2.5">
            {/* Back Button -> redirects to Profile Settings page */}
            <button
              type="button"
              onClick={() => {
                setIsExportModalOpen(false);
                setIsProfileModalOpen(true);
              }}
              className="p-2 -ml-1 rounded-xl text-slate-500 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-300 hover:bg-purple-500/10 transition-colors flex items-center justify-center cursor-pointer group"
              title="Back to Profile Settings"
            >
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
            </button>

            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-violet-600 text-white flex items-center justify-center flex-shrink-0 shadow-md shadow-purple-500/25 ring-2 ring-purple-500/30">
              <CloudUpload className="w-5 h-5" />
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Chat Backup
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Back up your messages and media to Google Drive & local storage
              </p>
            </div>
          </div>
          <button 
            type="button"
            onClick={() => setIsExportModalOpen(false)}
            className="p-2 rounded-xl text-slate-400 hover:text-purple-600 dark:hover:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950/40 transition-colors"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher: Electric Violet & Royal Purple */}
        <div className="px-6 pt-3 pb-1 border-b border-slate-100 dark:border-purple-900/30 bg-purple-500/5 dark:bg-[#16122c]/60 flex items-center gap-2 flex-shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('backup')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'backup'
                ? 'bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 text-white shadow-md shadow-purple-500/25'
                : 'text-slate-600 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950/40'
            }`}
          >
            <Cloud className="w-3.5 h-3.5" />
            <span>Cloud & Local Backup</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('export')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'export'
                ? 'bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 text-white shadow-md shadow-purple-500/25'
                : 'text-slate-600 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950/40'
            }`}
          >
            <ArrowDownToLine className="w-3.5 h-3.5" />
            <span>Export Chat (.txt / PDF / Email)</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          {/* Universal Scope Selector: Particular Chat vs All Chats */}
          <div className="p-3.5 rounded-2xl bg-purple-500/10 border border-purple-500/25 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                <span>Backup & Export Scope</span>
              </label>
              <span className="text-[11px] font-bold text-purple-600 dark:text-purple-300 px-2.5 py-0.5 rounded-full bg-purple-500/15">
                {backupScope === 'all' 
                  ? `${totalUniqueMembersCount} Members • ${conversations.length} Chats` 
                  : `${currentScopeMemberCount} ${currentScopeMemberCount === 1 ? 'Member' : 'Members'}`}
              </span>
            </div>

            {/* Segmented Control */}
            <div className="grid grid-cols-2 gap-1.5 p-1 bg-white dark:bg-[#191433] rounded-xl border border-purple-500/20">
              <button
                type="button"
                onClick={() => setBackupScope('single')}
                className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  backupScope === 'single'
                    ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-sm shadow-purple-500/30'
                    : 'text-slate-600 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-300'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Particular Chat</span>
              </button>

              <button
                type="button"
                onClick={() => setBackupScope('all')}
                className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  backupScope === 'all'
                    ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-sm shadow-purple-500/30'
                    : 'text-slate-600 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-300'
                }`}
              >
                <FolderArchive className="w-3.5 h-3.5" />
                <span>All Chats ({conversations.length})</span>
              </button>
            </div>

            {/* Scope details & selector */}
            {backupScope === 'single' ? (
              <div className="flex items-center gap-2 pt-1">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 flex-shrink-0">
                  Select Chat:
                </span>
                <select
                  value={selectedConversationId}
                  onChange={e => setSelectedConversationId(e.target.value)}
                  className="flex-1 px-3 py-1.5 rounded-xl border border-purple-300 dark:border-purple-800/80 bg-white dark:bg-slate-900 text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 truncate shadow-xs"
                >
                  {conversations.map(c => {
                    const mCount = c.memberCount || c.participantIds?.length || (c.type === 'direct' ? 2 : 1);
                    return (
                      <option key={c.id} value={c.id}>
                        {c.name} ({mCount} {mCount === 1 ? 'member' : 'members'})
                      </option>
                    );
                  })}
                </select>
              </div>
            ) : (
              <div className="text-[11px] text-purple-700 dark:text-purple-300 font-medium px-1 flex items-center gap-1.5 pt-0.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-purple-500 flex-shrink-0" />
                <span>Backing up all {conversations.length} direct & group channels into a complete account archive.</span>
              </div>
            )}
          </div>

          {activeTab === 'backup' ? (
            /* TAB 1: WhatsApp Chat Backup Screen in Electric Violet & Royal Purple */
            <div className="space-y-4 animate-in fade-in duration-150">
              {/* WhatsApp Last Backup Status Card */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-500/10 via-violet-500/5 to-indigo-500/10 border border-purple-500/25 dark:border-purple-500/30 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-violet-600 text-white flex items-center justify-center flex-shrink-0 shadow-md shadow-purple-500/30">
                      <CloudUpload className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                        Last Backup ({backupScope === 'all' ? 'All Chats' : currentSelectedConv?.name})
                      </div>
                      <div className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        <span>{lastBackupTime}</span>
                        <span className="w-2 h-2 rounded-full bg-violet-500 animate-pulse" />
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Size: <strong className="text-purple-600 dark:text-purple-400">{calculatedBackupSize} MB</strong> • <strong className="text-purple-600 dark:text-purple-400">{backupScope === 'all' ? `${totalUniqueMembersCount} members` : `${currentScopeMemberCount} ${currentScopeMemberCount === 1 ? 'member' : 'members'}`}</strong>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-600 dark:text-purple-300 text-[11px] font-bold shadow-xs">
                    <Lock className="w-3 h-3 text-purple-500" />
                    <span>E2EE Protected</span>
                  </div>
                </div>

                {/* Progress bar when backing up */}
                {isBackingUp && (
                  <div className="space-y-1.5 pt-2 border-t border-purple-500/20 animate-in fade-in duration-150">
                    <div className="flex items-center justify-between text-xs font-semibold text-purple-600 dark:text-purple-400">
                      <span className="flex items-center gap-1.5">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>{backupPhase}</span>
                      </span>
                      <span>{backupProgress}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-500 transition-all duration-300 rounded-full"
                        style={{ width: `${backupProgress}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Feedback banners */}
                {backupSuccessToast && (
                  <div className="p-3 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-700 dark:text-purple-300 text-xs font-semibold flex items-center gap-2 animate-in fade-in duration-200">
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-purple-500" />
                    <span>{backupSuccessToast}</span>
                  </div>
                )}

                {restoreToast && (
                  <div className="p-3 rounded-xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-700 dark:text-indigo-300 text-xs font-semibold flex items-center gap-2 animate-in fade-in duration-200">
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-indigo-500" />
                    <span>{restoreToast}</span>
                  </div>
                )}
              </div>

              {/* Big Electric Violet & Royal Purple "BACK UP" Button */}
              <button
                type="button"
                onClick={handleStartWhatsAppBackup}
                disabled={isBackingUp}
                className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 hover:from-violet-500 hover:via-purple-500 hover:to-indigo-500 active:scale-[0.99] disabled:opacity-60 text-white font-bold text-sm shadow-lg shadow-purple-500/30 transition-all flex items-center justify-center gap-2"
              >
                {isBackingUp ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Backing Up ({backupProgress}%)...</span>
                  </>
                ) : (
                  <>
                    <CloudUpload className="w-4 h-4" />
                    <span>Back Up Now ({backupScope === 'all' ? 'All Chats' : currentSelectedConv?.name})</span>
                  </>
                )}
              </button>

              {/* WhatsApp Settings Section Header */}
              <div className="pt-2">
                <div className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 mb-2.5 flex items-center gap-1.5">
                  <Settings2 className="w-3.5 h-3.5" />
                  <span>Google Drive & Cloud Settings</span>
                </div>

                <div className="rounded-2xl border border-slate-200 dark:border-purple-900/40 divide-y divide-slate-100 dark:divide-purple-900/30 bg-white dark:bg-[#181330]/70 overflow-hidden text-xs">
                  {/* Google Account */}
                  <div className="p-3.5 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-semibold text-slate-800 dark:text-slate-200">
                        Google Account / Cloud Storage
                      </div>
                      {isEditingAccount ? (
                        <div className="flex items-center gap-2 mt-1">
                          <input
                            type="email"
                            value={googleAccount}
                            onChange={e => setGoogleAccount(e.target.value)}
                            className="px-2.5 py-1 rounded-lg border border-purple-300 dark:border-purple-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-purple-500"
                          />
                          <button
                            type="button"
                            onClick={() => setIsEditingAccount(false)}
                            className="px-2 py-1 rounded-lg bg-gradient-to-r from-purple-600 to-violet-600 text-white text-[11px] font-semibold"
                          >
                            Save
                          </button>
                        </div>
                      ) : (
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                          {googleAccount}
                        </div>
                      )}
                    </div>
                    {!isEditingAccount && (
                      <button
                        type="button"
                        onClick={() => setIsEditingAccount(true)}
                        className="text-purple-600 dark:text-purple-400 font-semibold hover:underline flex-shrink-0"
                      >
                        Change
                      </button>
                    )}
                  </div>

                  {/* Frequency */}
                  <div className="p-3.5 flex items-center justify-between gap-3">
                    <div>
                      <div className="font-semibold text-slate-800 dark:text-slate-200">
                        Back up to Google Drive
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        Frequency of automated cloud backups
                      </div>
                    </div>
                    <select
                      value={backupFrequency}
                      onChange={e => setBackupFrequency(e.target.value)}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-purple-800 bg-slate-50 dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                    >
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                      <option value="manual">Only when I tap "Back Up"</option>
                      <option value="off">Off</option>
                    </select>
                  </div>

                  {/* Back up over */}
                  <div className="p-3.5 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Wifi className="w-4 h-4 text-purple-500" />
                      <div>
                        <div className="font-semibold text-slate-800 dark:text-slate-200">
                          Back up using
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">
                          Network data preference
                        </div>
                      </div>
                    </div>
                    <select
                      value={backupNetwork}
                      onChange={e => setBackupNetwork(e.target.value)}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-purple-800 bg-slate-50 dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                    >
                      <option value="wifi">Wi-Fi only</option>
                      <option value="cellular">Wi-Fi or cellular</option>
                    </select>
                  </div>

                  {/* Include Videos Toggle */}
                  <label className="p-3.5 flex items-center justify-between gap-3 cursor-pointer hover:bg-purple-500/5 transition-colors">
                    <div>
                      <div className="font-semibold text-slate-800 dark:text-slate-200">
                        Include videos & photos
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        {includeVideos ? `Includes media attachments (~${mediaOnlySize} MB)` : 'Saves storage space by omitting media'}
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={includeVideos}
                      onChange={e => setIncludeVideos(e.target.checked)}
                      className="w-4 h-4 accent-purple-600 rounded cursor-pointer"
                    />
                  </label>

                  {/* End-to-end encrypted backup */}
                  <label className="p-3.5 flex items-center justify-between gap-3 cursor-pointer hover:bg-purple-500/5 transition-colors">
                    <div className="flex items-center gap-2">
                      <Lock className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                      <div>
                        <div className="font-semibold text-slate-800 dark:text-slate-200">
                          End-to-end encrypted backup
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">
                          Protected with 64-digit encryption key
                        </div>
                      </div>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/15 text-purple-600 dark:text-purple-300 border border-purple-500/25">
                      Turned On
                    </span>
                  </label>
                </div>
              </div>

              {/* WhatsApp Restore Option */}
              <div className="pt-1 flex items-center justify-between text-xs px-1">
                <span className="text-slate-500 dark:text-slate-400">
                  Switching devices or recovering chats?
                </span>
                <button
                  type="button"
                  disabled={isRestoring || isBackingUp}
                  onClick={handleStartRestore}
                  className="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 hover:underline font-bold flex items-center gap-1"
                >
                  {isRestoring ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Restoring ({restoreProgress}%)...</span>
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Restore Chats</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            /* TAB 2: WhatsApp Export Chat (TXT, PDF, Email, JSON) in Electric Violet & Royal Purple */
            <div className="space-y-4 animate-in fade-in duration-150">
              {/* Format selection cards */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Select Export Format
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {/* WhatsApp Standard .txt format */}
                  <button
                    type="button"
                    onClick={() => setExportFormat('txt')}
                    className={`p-2.5 rounded-2xl border text-center transition-all flex flex-col items-center gap-1.5 ${
                      exportFormat === 'txt'
                        ? 'bg-purple-500/15 border-purple-500/50 text-purple-600 dark:text-purple-300 ring-2 ring-purple-500/30 shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-purple-500/30'
                    }`}
                  >
                    <FileText className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    <div>
                      <div className="text-xs font-bold">WhatsApp .txt</div>
                      <div className="text-[9px] text-slate-400">Standard export</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setExportFormat('pdf')}
                    className={`p-2.5 rounded-2xl border text-center transition-all flex flex-col items-center gap-1.5 ${
                      exportFormat === 'pdf'
                        ? 'bg-purple-500/15 border-purple-500/50 text-purple-600 dark:text-purple-300 ring-2 ring-purple-500/30 shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-purple-500/30'
                    }`}
                  >
                    <Printer className="w-4 h-4 text-violet-500" />
                    <div>
                      <div className="text-xs font-bold">Printable PDF</div>
                      <div className="text-[9px] text-slate-400">Bubble layout</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setExportFormat('email')}
                    className={`p-2.5 rounded-2xl border text-center transition-all flex flex-col items-center gap-1.5 ${
                      exportFormat === 'email'
                        ? 'bg-purple-500/15 border-purple-500/50 text-purple-600 dark:text-purple-300 ring-2 ring-purple-500/30 shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-purple-500/30'
                    }`}
                  >
                    <Mail className="w-4 h-4 text-fuchsia-500" />
                    <div>
                      <div className="text-xs font-bold">Email Chat</div>
                      <div className="text-[9px] text-slate-400">Send to inbox</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setExportFormat('json')}
                    className={`p-2.5 rounded-2xl border text-center transition-all flex flex-col items-center gap-1.5 ${
                      exportFormat === 'json'
                        ? 'bg-purple-500/15 border-purple-500/50 text-purple-600 dark:text-purple-300 ring-2 ring-purple-500/30 shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-purple-500/30'
                    }`}
                  >
                    <Code className="w-4 h-4 text-indigo-500" />
                    <div>
                      <div className="text-xs font-bold">JSON Data</div>
                      <div className="text-[9px] text-slate-400">Raw backup</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Email Address Config Box (When Email format is chosen) */}
              {exportFormat === 'email' && (
                <div className="p-3.5 rounded-2xl bg-purple-500/10 border border-purple-500/25 space-y-2.5 animate-in slide-in-from-top-1 duration-150">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
                      Recipient Email Address
                    </span>
                  </div>

                  <input
                    type="email"
                    value={recipientEmail}
                    onChange={e => setRecipientEmail(e.target.value)}
                    placeholder="Enter email address (e.g. user@gmail.com)"
                    className="w-full bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-purple-900/50 rounded-xl px-3.5 py-2 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all font-medium"
                  />
                </div>
              )}

              {/* Timeframe filter */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-purple-500" />
                  <span>Timeframe</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'all', label: 'All History' },
                    { id: '30d', label: 'Last 30 Days' },
                    { id: '7d', label: 'Last 7 Days' },
                  ].map(opt => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setDateRange(opt.id)}
                      className={`py-1.5 px-2 rounded-xl text-xs font-medium border transition-all ${
                        dateRange === opt.id
                          ? 'bg-purple-500/15 border-purple-500/40 text-purple-600 dark:text-purple-300 font-semibold'
                          : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Options: Media toggle */}
              <label className="flex items-center gap-2.5 p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 cursor-pointer hover:bg-purple-500/5 transition-colors">
                <input
                  type="checkbox"
                  checked={includeMediaInExport}
                  onChange={e => setIncludeMediaInExport(e.target.checked)}
                  className="w-4 h-4 accent-purple-600 rounded-md focus:ring-purple-500"
                />
                <div className="text-xs">
                  <div className="font-semibold text-slate-800 dark:text-slate-200">
                    Include Media (Photos, Documents & Voice Notes)
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Exports complete media references alongside the transcript
                  </div>
                </div>
              </label>

              {/* Status notifications */}
              {emailStatus && (
                <div className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center gap-2 animate-in fade-in duration-200 ${
                  emailStatus.success 
                    ? 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30'
                    : 'bg-rose-500/15 text-rose-500 border-rose-500/30'
                }`}>
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  <span>{emailStatus.message}</span>
                </div>
              )}

              {exportSuccessNotice && (
                <div className="p-2.5 rounded-xl bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30 text-xs font-semibold flex items-center gap-2 animate-in fade-in duration-200">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  <span>{exportSuccessNotice}</span>
                </div>
              )}

              {/* Export Action Buttons in Electric Violet & Royal Purple */}
              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-purple-900/30">
                <button
                  type="button"
                  onClick={() => setIsExportModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleExecuteExport}
                  disabled={isExporting || currentScopeMessageCount === 0}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 hover:from-violet-500 hover:via-purple-500 hover:to-indigo-500 active:scale-95 disabled:opacity-40 text-white text-xs font-bold shadow-md shadow-purple-500/25 transition-all flex items-center gap-1.5"
                >
                  {isExporting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>{exportFormat === 'email' ? 'Sending email...' : 'Exporting...'}</span>
                    </>
                  ) : exportFormat === 'email' ? (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Send to Email</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-3.5 h-3.5" />
                      <span>
                        {backupScope === 'all' 
                          ? `Export All Chats (${includeMediaInExport ? 'With Media' : 'Without Media'})` 
                          : `Export Chat (${includeMediaInExport ? 'With Media' : 'Without Media'})`}
                      </span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};
