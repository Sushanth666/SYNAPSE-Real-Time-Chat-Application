import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useChat } from '../../context/ChatContext.jsx';
import { Avatar } from '../common/Avatar.jsx';
import { 
  X, Users, Image as ImageIcon, FileText, Bell, BellOff, Shield, 
  ExternalLink, Download, Search, Mic, Link as LinkIcon, Copy, 
  Check, FileArchive, FileCode, Play, Pause, HardDrive
} from 'lucide-react';

export const ConversationDetails = () => {
  const { user, allUsers } = useAuth();
  const { activeConversation, isDetailsOpen, setIsDetailsOpen, messages, setLightboxImage } = useChat();
  const [activeTab, setActiveTab] = useState('media');
  const [isMuted, setIsMuted] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
  const [copiedLinkId, setCopiedLinkId] = useState(null);
  const [playingAudioId, setPlayingAudioId] = useState(null);

  if (!activeConversation || !isDetailsOpen || !user) return null;

  // Filter participants
  const participants = (allUsers || []).filter(u => activeConversation.participantIds.includes(u.id));

  // Determine display name and avatar for direct chat
  let displayName = activeConversation.name;
  let displayAvatar = activeConversation.avatar;
  if (activeConversation.type === 'direct') {
    const otherId = activeConversation.participantIds.find(id => id !== user.id);
    const otherUser = (allUsers || []).find(u => u.id === otherId);
    if (otherUser) {
      displayName = otherUser.name;
      displayAvatar = otherUser.avatar;
    }
  }

  // Safety guard: NEVER display logged-in user's own name for direct chat
  if (user && activeConversation.type === 'direct' && displayName.toLowerCase() === user.name.toLowerCase()) {
    const otherId = activeConversation.participantIds.find(id => id !== user.id);
    const otherUser = (allUsers || []).find(u => u.id === otherId);
    if (otherUser && otherUser.name.toLowerCase() !== user.name.toLowerCase()) {
      displayName = otherUser.name;
      displayAvatar = otherUser.avatar;
    } else {
      const altUser = (allUsers || []).find(u => u.id !== user.id && u.name.toLowerCase() !== user.name.toLowerCase());
      if (altUser) {
        displayName = altUser.name;
        displayAvatar = altUser.avatar;
      }
    }
  }

  // Extract shared images from conversation messages
  const imageAttachments = useMemo(() => {
    if (!messages) return [];
    const list = [];
    messages.forEach(m => {
      if (m.attachments) {
        m.attachments.forEach(att => {
          if (att.type && att.type.startsWith('image/')) {
            list.push({
              ...att,
              messageId: m.id,
              senderId: m.senderId,
              createdAt: m.createdAt,
            });
          }
        });
      }
    });
    return list;
  }, [messages]);

  // Extract shared documents from conversation messages
  const docAttachments = useMemo(() => {
    if (!messages) return [];
    const list = [];
    messages.forEach(m => {
      if (m.attachments) {
        m.attachments.forEach(att => {
          if (!att.type || !att.type.startsWith('image/')) {
            list.push({
              ...att,
              messageId: m.id,
              senderId: m.senderId,
              createdAt: m.createdAt,
            });
          }
        });
      }
    });
    return list;
  }, [messages]);

  // Extract voice memos
  const voiceMemos = useMemo(() => {
    if (!messages) return [];
    return messages
      .filter(m => m.voiceMemo && !m.isDeleted)
      .map(m => ({
        id: m.id,
        voiceMemo: m.voiceMemo,
        senderId: m.senderId,
        createdAt: m.createdAt,
      }));
  }, [messages]);

  // Extract shared links
  const sharedLinks = useMemo(() => {
    if (!messages) return [];
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const links = [];
    messages.forEach(m => {
      if (m.text && !m.isDeleted) {
        const matches = m.text.match(urlRegex);
        if (matches) {
          matches.forEach(url => {
            let domain = '';
            try {
              domain = new URL(url).hostname;
            } catch {
              domain = url;
            }
            links.push({
              id: `${m.id}-${url}`,
              url,
              domain,
              senderId: m.senderId,
              createdAt: m.createdAt,
              contextText: m.text,
            });
          });
        }
      }
    });
    return links;
  }, [messages]);

  // Storage calculation
  const totalSizeBytes = useMemo(() => {
    const imgSize = imageAttachments.reduce((acc, cur) => acc + (cur.size || 0), 0);
    const docSize = docAttachments.reduce((acc, cur) => acc + (cur.size || 0), 0);
    return imgSize + docSize;
  }, [imageAttachments, docAttachments]);

  const formatFileSize = (bytes) => {
    if (!bytes) return 'Unknown size';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const formatDate = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const getSenderName = (senderId) => {
    const found = (allUsers || []).find(u => u.id === senderId);
    return found ? found.name : 'User';
  };

  // Filtered lists based on search query
  const query = searchFilter.toLowerCase().trim();

  const filteredImages = useMemo(() => {
    if (!query) return imageAttachments;
    return imageAttachments.filter(img => 
      (img.name && img.name.toLowerCase().includes(query)) ||
      getSenderName(img.senderId).toLowerCase().includes(query)
    );
  }, [imageAttachments, query, allUsers]);

  const filteredDocs = useMemo(() => {
    if (!query) return docAttachments;
    return docAttachments.filter(doc => 
      (doc.name && doc.name.toLowerCase().includes(query)) ||
      getSenderName(doc.senderId).toLowerCase().includes(query)
    );
  }, [docAttachments, query, allUsers]);

  const filteredVoiceMemos = useMemo(() => {
    if (!query) return voiceMemos;
    return voiceMemos.filter(v => 
      getSenderName(v.senderId).toLowerCase().includes(query)
    );
  }, [voiceMemos, query, allUsers]);

  const filteredLinks = useMemo(() => {
    if (!query) return sharedLinks;
    return sharedLinks.filter(l => 
      l.url.toLowerCase().includes(query) ||
      l.domain.toLowerCase().includes(query) ||
      getSenderName(l.senderId).toLowerCase().includes(query)
    );
  }, [sharedLinks, query, allUsers]);

  const handleCopyLink = (linkId, url) => {
    navigator.clipboard.writeText(url);
    setCopiedLinkId(linkId);
    setTimeout(() => setCopiedLinkId(null), 2000);
  };

  const toggleAudio = (id, audioUrl) => {
    if (playingAudioId === id) {
      setPlayingAudioId(null);
    } else {
      setPlayingAudioId(id);
      const audio = new Audio(audioUrl);
      audio.play();
      audio.onended = () => setPlayingAudioId(null);
    }
  };

  // Helper for document icons
  const renderDocIcon = (filename = '', type = '') => {
    const ext = filename.split('.').pop()?.toLowerCase();
    if (['zip', 'rar', 'tar', 'gz', '7z'].includes(ext)) {
      return <FileArchive className="w-4 h-4 text-amber-500" />;
    }
    if (['js', 'jsx', 'ts', 'tsx', 'html', 'css', 'json', 'py', 'java', 'cpp'].includes(ext)) {
      return <FileCode className="w-4 h-4 text-cyan-500" />;
    }
    if (['pdf'].includes(ext)) {
      return <FileText className="w-4 h-4 text-rose-500" />;
    }
    return <FileText className="w-4 h-4 text-purple-500" />;
  };

  return (
    <aside className="w-84 sm:w-96 h-full border-l border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-[#0c0a1a]/95 backdrop-blur-xl flex flex-col z-30 transition-all duration-300 shadow-2xl">
      {/* Header */}
      <div className="h-16 px-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <span>Conversation Details</span>
        </h3>
        <button 
          type="button"
          onClick={() => setIsDetailsOpen(false)} 
          className="p-2 rounded-xl text-slate-400 hover-icon-purple"
          title="Close details"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Profile & Channel Overview */}
      <div className="p-4 text-center border-b border-slate-200 dark:border-slate-800/80 flex flex-col items-center bg-gradient-to-b from-purple-500/5 to-transparent">
        <Avatar src={displayAvatar} name={displayName} size="xl" className="mb-2.5 ring-4 ring-purple-500/20 shadow-xl" />
        <h4 className="text-base font-bold text-slate-900 dark:text-slate-100 truncate max-w-[260px]">
          {displayName}
        </h4>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 max-w-[260px] line-clamp-2">
          {activeConversation.description || (activeConversation.type === 'group' ? 'Group channel' : 'Direct conversation')}
        </p>

        {/* Quick controls & stats */}
        <div className="flex items-center gap-2 mt-3">
          <button 
            type="button"
            onClick={() => setIsMuted(!isMuted)} 
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
              isMuted
                ? 'bg-rose-500/15 text-rose-400 border-rose-500/30'
                : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700/80 hover:border-purple-500/40'
            }`}
          >
            {isMuted ? <BellOff className="w-3.5 h-3.5" /> : <Bell className="w-3.5 h-3.5" />}
            <span>{isMuted ? 'Muted' : 'Mute'}</span>
          </button>

          <div className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-600 dark:text-purple-300 text-xs font-medium">
            <HardDrive className="w-3.5 h-3.5" />
            <span>{formatFileSize(totalSizeBytes)}</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 px-2 pt-1.5 bg-slate-50/50 dark:bg-purple-950/20 overflow-x-auto scrollbar-none">
        <button 
          type="button"
          onClick={() => setActiveTab('media')} 
          className={`px-3 py-2 text-xs font-semibold border-b-2 transition-all flex items-center justify-center gap-1.5 flex-shrink-0 ${
            activeTab === 'media'
              ? 'border-purple-600 text-purple-600 dark:text-purple-400 dark:border-purple-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <ImageIcon className="w-3.5 h-3.5" />
          <span>Photos ({imageAttachments.length})</span>
        </button>

        <button 
          type="button"
          onClick={() => setActiveTab('files')} 
          className={`px-3 py-2 text-xs font-semibold border-b-2 transition-all flex items-center justify-center gap-1.5 flex-shrink-0 ${
            activeTab === 'files'
              ? 'border-purple-600 text-purple-600 dark:text-purple-400 dark:border-purple-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Docs ({docAttachments.length})</span>
        </button>

        <button 
          type="button"
          onClick={() => setActiveTab('voice')} 
          className={`px-3 py-2 text-xs font-semibold border-b-2 transition-all flex items-center justify-center gap-1.5 flex-shrink-0 ${
            activeTab === 'voice'
              ? 'border-purple-600 text-purple-600 dark:text-purple-400 dark:border-purple-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Mic className="w-3.5 h-3.5" />
          <span>Audio ({voiceMemos.length})</span>
        </button>

        <button 
          type="button"
          onClick={() => setActiveTab('links')} 
          className={`px-3 py-2 text-xs font-semibold border-b-2 transition-all flex items-center justify-center gap-1.5 flex-shrink-0 ${
            activeTab === 'links'
              ? 'border-purple-600 text-purple-600 dark:text-purple-400 dark:border-purple-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <LinkIcon className="w-3.5 h-3.5" />
          <span>Links ({sharedLinks.length})</span>
        </button>

        <button 
          type="button"
          onClick={() => setActiveTab('members')} 
          className={`px-3 py-2 text-xs font-semibold border-b-2 transition-all flex items-center justify-center gap-1.5 flex-shrink-0 ${
            activeTab === 'members'
              ? 'border-purple-600 text-purple-600 dark:text-purple-400 dark:border-purple-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Members ({participants.length})</span>
        </button>
      </div>

      {/* Filter Search inside Media/Docs */}
      {activeTab !== 'members' && (
        <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/70 dark:bg-[#120f22]">
          <div className="relative flex items-center">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 pointer-events-none" />
            <input 
              type="text"
              placeholder={`Filter ${activeTab}...`}
              value={searchFilter}
              onChange={e => setSearchFilter(e.target.value)}
              className="w-full bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-xl pl-8 pr-7 py-1.5 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
            />
            {searchFilter && (
              <button 
                type="button"
                onClick={() => setSearchFilter('')}
                className="absolute right-2 text-slate-400 hover:text-slate-200"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Tab contents */}
      <div className="flex-1 min-h-0 overflow-y-auto p-3">
        {/* 1. Photos & Videos Grid */}
        {activeTab === 'media' && (
          <div className="animate-message-enter">
            {filteredImages.length === 0 ? (
              <div className="text-center py-12 text-xs text-slate-400 animate-message-enter">
                <div className="w-12 h-12 mx-auto mb-2 rounded-2xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
                  <ImageIcon className="w-6 h-6 text-purple-400" />
                </div>
                <p className="font-semibold text-slate-700 dark:text-slate-300">No photos found</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Images sent in this chat appear here</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {filteredImages.map((img, idx) => (
                  <div 
                    key={img.id || `${img.url}-${idx}`} 
                    onClick={() => setLightboxImage(img.url)} 
                    className="aspect-square rounded-xl overflow-hidden cursor-pointer group relative border border-slate-200 dark:border-purple-900/30 shadow-xs hover:shadow-glow-purple transition-all"
                    title={`${img.name} • Shared by ${getSenderName(img.senderId)}`}
                  >
                    <img 
                      src={img.url} 
                      alt={img.name} 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-1.5 text-white">
                      <div className="self-end p-1 rounded-lg bg-black/40 backdrop-blur-xs">
                        <ExternalLink className="w-3 h-3" />
                      </div>
                      <div className="truncate text-[10px] font-medium leading-tight">
                        <span className="block truncate">{img.name}</span>
                        <span className="text-[9px] text-slate-300 font-normal">{formatDate(img.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 2. Documents & Files List */}
        {activeTab === 'files' && (
          <div className="space-y-2 animate-message-enter">
            {filteredDocs.length === 0 ? (
              <div className="text-center py-12 text-xs text-slate-400 animate-message-enter">
                <div className="w-12 h-12 mx-auto mb-2 rounded-2xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
                  <FileText className="w-6 h-6 text-purple-400" />
                </div>
                <p className="font-semibold text-slate-700 dark:text-slate-300">No documents found</p>
                <p className="text-[11px] text-slate-400 mt-0.5">PDFs, archives, and docs shared in chat appear here</p>
              </div>
            ) : (
              filteredDocs.map((doc, idx) => (
                <div 
                  key={doc.id || `${doc.url}-${idx}`} 
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/80 text-xs transition-all hover:border-purple-500/50 hover:shadow-xs group"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="p-2 rounded-xl bg-purple-500/15 border border-purple-500/20 flex-shrink-0">
                      {renderDocIcon(doc.name, doc.type)}
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[160px]" title={doc.name}>
                        {doc.name}
                      </div>
                      <div className="text-[10px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                        <span>{formatFileSize(doc.size)}</span>
                        <span>•</span>
                        <span>{getSenderName(doc.senderId)}</span>
                        <span>•</span>
                        <span>{formatDate(doc.createdAt)}</span>
                      </div>
                    </div>
                  </div>

                  <a 
                    href={doc.url} 
                    download={doc.name} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="p-2 rounded-xl text-slate-400 hover-icon-purple flex-shrink-0" 
                    title="Download document"
                  >
                    <Download className="w-4 h-4" />
                  </a>
                </div>
              ))
            )}
          </div>
        )}

        {/* 3. Audio & Voice Memos */}
        {activeTab === 'voice' && (
          <div className="space-y-2 animate-message-enter">
            {filteredVoiceMemos.length === 0 ? (
              <div className="text-center py-12 text-xs text-slate-400 animate-message-enter">
                <div className="w-12 h-12 mx-auto mb-2 rounded-2xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
                  <Mic className="w-6 h-6 text-purple-400" />
                </div>
                <p className="font-semibold text-slate-700 dark:text-slate-300">No voice memos</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Voice notes recorded in this chat appear here</p>
              </div>
            ) : (
              filteredVoiceMemos.map(memo => {
                const isPlaying = playingAudioId === memo.id;
                return (
                  <div 
                    key={memo.id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/80 text-xs transition-all hover:border-purple-500/50"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <button 
                        type="button"
                        onClick={() => toggleAudio(memo.id, memo.voiceMemo.audioUrl)}
                        className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-600 to-violet-600 text-white flex items-center justify-center shadow-md shadow-purple-500/30 flex-shrink-0 active:scale-95 transition-transform"
                      >
                        {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5" />}
                      </button>
                      <div className="min-w-0">
                        <div className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                          Voice Memo ({memo.voiceMemo.duration ? `${Math.round(memo.voiceMemo.duration)}s` : 'Audio'})
                        </div>
                        <div className="text-[10px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                          <span>{getSenderName(memo.senderId)}</span>
                          <span>•</span>
                          <span>{formatDate(memo.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* 4. Shared Links */}
        {activeTab === 'links' && (
          <div className="space-y-2 animate-message-enter">
            {filteredLinks.length === 0 ? (
              <div className="text-center py-12 text-xs text-slate-400 animate-message-enter">
                <div className="w-12 h-12 mx-auto mb-2 rounded-2xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
                  <LinkIcon className="w-6 h-6 text-purple-400" />
                </div>
                <p className="font-semibold text-slate-700 dark:text-slate-300">No links shared</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Links and URLs sent in messages appear here</p>
              </div>
            ) : (
              filteredLinks.map(link => {
                const isCopied = copiedLinkId === link.id;
                return (
                  <div 
                    key={link.id}
                    className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/80 text-xs transition-all hover:border-purple-500/50 group"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="p-1.5 rounded-lg bg-purple-500/15 text-purple-400 flex-shrink-0">
                          <LinkIcon className="w-3.5 h-3.5" />
                        </div>
                        <div className="min-w-0">
                          <span className="font-semibold text-slate-800 dark:text-slate-200 truncate block text-[11px]">
                            {link.domain}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            Shared by {getSenderName(link.senderId)} • {formatDate(link.createdAt)}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          type="button"
                          onClick={() => handleCopyLink(link.id, link.url)}
                          className="p-1.5 rounded-lg text-slate-400 hover-icon-purple"
                          title={isCopied ? "Copied!" : "Copy Link"}
                        >
                          {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                        <a
                          href={link.url}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 rounded-lg text-slate-400 hover-icon-purple"
                          title="Open Link"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>

                    <a 
                      href={link.url} 
                      target="_blank" 
                      rel="noreferrer" 
                      className="mt-1.5 text-purple-600 dark:text-purple-400 hover:underline text-[11px] truncate block font-mono"
                    >
                      {link.url}
                    </a>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* 5. Members List */}
        {activeTab === 'members' && (
          <div className="space-y-2 animate-message-enter">
            {participants.map(p => {
              const isAdmin = activeConversation.adminIds?.includes(p.id);
              const isCurrentUser = p.id === user.id;
              return (
                <div 
                  key={p.id} 
                  className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-all hover:translate-x-0.5"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Avatar src={p.avatar} name={p.name} size="sm" status={p.status} />
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate flex items-center gap-1.5">
                        <span>{p.name}</span>
                        {isCurrentUser && (
                          <span className="text-[10px] text-purple-500 font-semibold">(You)</span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400 truncate">
                        {p.bio || p.email}
                      </div>
                    </div>
                  </div>

                  {isAdmin && (
                    <span className="flex items-center gap-0.5 text-[10px] px-2 py-0.5 bg-purple-500/20 text-purple-300 rounded-md font-semibold border border-purple-500/30">
                      <Shield className="w-2.5 h-2.5" />
                      Admin
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </aside>
  );
};
