import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useChat } from '../../context/ChatContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { Avatar } from '../common/Avatar.jsx';
import { 
  X, ZoomIn, ZoomOut, Download, ChevronLeft, ChevronRight, 
  RotateCw, Copy, Check, Calendar, HardDrive 
} from 'lucide-react';

export const ImageLightboxModal = () => {
  const { lightboxImage, setLightboxImage, messages } = useChat();
  const { allUsers } = useAuth();

  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [copied, setCopied] = useState(false);

  // Extract all image attachments across the current conversation messages
  const allImages = useMemo(() => {
    if (!messages) return [];
    const list = [];
    messages.forEach(m => {
      if (m.attachments) {
        m.attachments.forEach(att => {
          if (att.type && att.type.startsWith('image/')) {
            list.push({
              id: att.id,
              url: att.url,
              name: att.name || 'Image',
              size: att.size,
              senderId: m.senderId,
              createdAt: m.createdAt,
            });
          }
        });
      }
    });
    return list;
  }, [messages]);

  // Current active image URL
  const targetUrl = typeof lightboxImage === 'string' ? lightboxImage : lightboxImage?.url;

  // Determine active index
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (targetUrl && allImages.length > 0) {
      const idx = allImages.findIndex(img => img.url === targetUrl);
      if (idx !== -1) {
        setCurrentIndex(idx);
      }
    }
  }, [targetUrl, allImages]);

  // Current image item
  const currentImage = allImages[currentIndex] || (targetUrl ? { url: targetUrl, name: 'Image' } : null);

  // Sender details
  const sender = useMemo(() => {
    if (!currentImage?.senderId || !allUsers) return null;
    return allUsers.find(u => u.id === currentImage.senderId);
  }, [currentImage, allUsers]);

  // Zoom / Rotate Handlers
  const handleZoomIn = useCallback(() => setScale(s => Math.min(s + 0.25, 3.5)), []);
  const handleZoomOut = useCallback(() => setScale(s => Math.max(s - 0.25, 0.4)), []);
  const handleResetZoom = useCallback(() => {
    setScale(1);
    setRotation(0);
  }, []);
  const handleRotate = useCallback(() => setRotation(r => (r + 90) % 360), []);

  // Previous & Next navigation
  const handlePrev = useCallback(() => {
    if (allImages.length <= 1) return;
    setCurrentIndex(idx => (idx === 0 ? allImages.length - 1 : idx - 1));
    setScale(1);
    setRotation(0);
  }, [allImages.length]);

  const handleNext = useCallback(() => {
    if (allImages.length <= 1) return;
    setCurrentIndex(idx => (idx === allImages.length - 1 ? 0 : idx + 1));
    setScale(1);
    setRotation(0);
  }, [allImages.length]);

  const handleCopyLink = () => {
    if (!currentImage?.url) return;
    navigator.clipboard.writeText(window.location.origin + currentImage.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Keyboard navigation
  useEffect(() => {
    if (!lightboxImage) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setLightboxImage(null);
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === '+' || e.key === '=') {
        handleZoomIn();
      } else if (e.key === '-') {
        handleZoomOut();
      } else if (e.key === '0') {
        handleResetZoom();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxImage, setLightboxImage, handlePrev, handleNext, handleZoomIn, handleZoomOut, handleResetZoom]);

  if (!lightboxImage || !currentImage) return null;

  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const formatDate = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ' at ' + 
      date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div 
      className="fixed inset-0 z-[100] flex flex-col items-center justify-between bg-black/92 backdrop-blur-xl p-4 select-none animate-in fade-in duration-200"
      onClick={() => setLightboxImage(null)}
    >
      {/* Top Header Bar */}
      <div 
        className="w-full max-w-6xl flex items-center justify-between bg-slate-900/80 border border-slate-800/80 backdrop-blur-md p-2.5 rounded-2xl shadow-2xl z-20"
        onClick={e => e.stopPropagation()}
      >
        {/* Left: Sender & Metadata info */}
        <div className="flex items-center gap-3 min-w-0">
          {sender && (
            <Avatar src={sender.avatar} name={sender.name} size="sm" className="ring-2 ring-purple-500/50" />
          )}
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-100 truncate">
                {sender ? sender.name : (currentImage.name || 'Shared Photo')}
              </span>
              {allImages.length > 1 && (
                <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-semibold text-[10px] border border-purple-500/30">
                  {currentIndex + 1} of {allImages.length}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5 truncate">
              {currentImage.createdAt && (
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-slate-500" />
                  {formatDate(currentImage.createdAt)}
                </span>
              )}
              {currentImage.size && (
                <>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <HardDrive className="w-3 h-3 text-slate-500" />
                    {formatFileSize(currentImage.size)}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right: Controls toolbar */}
        <div className="flex items-center gap-1">
          {/* Zoom controls */}
          <button 
            type="button"
            onClick={handleZoomOut} 
            className="p-2 text-slate-300 hover-icon-purple rounded-xl transition-all" 
            title="Zoom Out (-)"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          
          <button 
            type="button"
            onClick={handleResetZoom} 
            className="px-2.5 py-1 text-xs font-mono text-slate-300 hover-icon-purple rounded-xl transition-all"
            title="Reset Zoom (0)"
          >
            {Math.round(scale * 100)}%
          </button>
          
          <button 
            type="button"
            onClick={handleZoomIn} 
            className="p-2 text-slate-300 hover-icon-purple rounded-xl transition-all" 
            title="Zoom In (+)"
          >
            <ZoomIn className="w-4 h-4" />
          </button>

          {/* Rotate */}
          <button 
            type="button"
            onClick={handleRotate} 
            className="p-2 text-slate-300 hover-icon-purple rounded-xl transition-all" 
            title="Rotate 90° Clockwise"
          >
            <RotateCw className="w-4 h-4" />
          </button>

          {/* Copy Link */}
          <button 
            type="button"
            onClick={handleCopyLink} 
            className="p-2 text-slate-300 hover-icon-purple rounded-xl transition-all" 
            title={copied ? "Link Copied!" : "Copy Image Link"}
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          </button>

          {/* Download */}
          <a 
            href={currentImage.url} 
            download={currentImage.name || 'image'} 
            target="_blank" 
            rel="noreferrer" 
            className="p-2 text-slate-300 hover-icon-purple rounded-xl transition-all" 
            title="Download Full Resolution"
          >
            <Download className="w-4 h-4" />
          </a>

          <div className="w-[1px] h-5 bg-slate-800 mx-1" />

          {/* Close */}
          <button 
            type="button"
            onClick={() => setLightboxImage(null)} 
            className="p-2 text-rose-400 hover:text-rose-300 hover:bg-rose-500/15 rounded-xl transition-all" 
            title="Close (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Image Stage with Left & Right Arrows */}
      <div 
        className="relative flex-1 w-full flex items-center justify-center min-h-0 my-3" 
        onClick={e => e.stopPropagation()}
      >
        {/* Previous Image Arrow */}
        {allImages.length > 1 && (
          <button
            type="button"
            onClick={handlePrev}
            className="absolute left-4 z-20 p-3 rounded-2xl bg-slate-900/80 hover:bg-purple-600 text-white border border-slate-700/60 shadow-2xl transition-all hover:scale-110 active:scale-95 group"
            title="Previous image (Left Arrow)"
          >
            <ChevronLeft className="w-6 h-6 group-hover:-translate-x-0.5 transition-transform" />
          </button>
        )}

        {/* Display Image Container */}
        <div className="relative max-w-[85vw] max-h-[70vh] flex items-center justify-center overflow-hidden">
          <img 
            src={currentImage.url} 
            alt={currentImage.name || 'Full view'} 
            style={{ 
              transform: `scale(${scale}) rotate(${rotation}deg)`,
              transition: scale === 1 ? 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)' : 'none'
            }} 
            className="max-h-[70vh] max-w-[85vw] object-contain rounded-2xl shadow-2xl border border-white/10"
          />
        </div>

        {/* Next Image Arrow */}
        {allImages.length > 1 && (
          <button
            type="button"
            onClick={handleNext}
            className="absolute right-4 z-20 p-3 rounded-2xl bg-slate-900/80 hover:bg-purple-600 text-white border border-slate-700/60 shadow-2xl transition-all hover:scale-110 active:scale-95 group"
            title="Next image (Right Arrow)"
          >
            <ChevronRight className="w-6 h-6 group-hover:translate-x-0.5 transition-transform" />
          </button>
        )}
      </div>

      {/* Bottom Filmstrip Thumbnail Carousel */}
      {allImages.length > 1 && (
        <div 
          className="max-w-4xl w-full bg-slate-900/80 border border-slate-800/80 backdrop-blur-md p-2 rounded-2xl shadow-2xl z-20 flex items-center gap-2 overflow-x-auto justify-center"
          onClick={e => e.stopPropagation()}
        >
          {allImages.map((img, idx) => {
            const isActive = idx === currentIndex;
            return (
              <button
                key={img.id || `${img.url}-${idx}`}
                type="button"
                onClick={() => {
                  setCurrentIndex(idx);
                  setScale(1);
                  setRotation(0);
                }}
                className={`relative w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 transition-all duration-200 border-2 ${
                  isActive 
                    ? 'border-purple-500 scale-105 shadow-glow-purple ring-2 ring-purple-500/40' 
                    : 'border-transparent opacity-50 hover:opacity-100 hover:scale-102'
                }`}
                title={img.name}
              >
                <img src={img.url} alt={img.name} className="w-full h-full object-cover" />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
