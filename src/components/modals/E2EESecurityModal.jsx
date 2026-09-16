import React, { useMemo } from 'react';
import { useChat } from '../../context/ChatContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { 
  X, ShieldCheck, Lock, CheckCircle2, QrCode, 
  Key, ShieldAlert, Copy, Check 
} from 'lucide-react';

export const E2EESecurityModal = () => {
  const { isE2EEModalOpen, setIsE2EEModalOpen, activeConversation, verifiedConversations, toggleVerifyConversation } = useChat();
  const { allUsers, user } = useAuth();
  const [copied, setCopied] = React.useState(false);

  // Determine other participant - hook runs unconditionally at top
  const otherParticipant = useMemo(() => {
    if (!activeConversation?.participantIds || !allUsers) return null;
    const otherId = activeConversation.participantIds.find(id => id !== user?.id);
    return allUsers.find(u => u.id === otherId) || { name: activeConversation?.name || 'Contact' };
  }, [activeConversation, allUsers, user]);

  // Deterministically generate a 60-digit safety number based on conversation ID
  const safetyNumberBlocks = useMemo(() => {
    if (!activeConversation) return [];
    let hash = 0;
    const str = `${activeConversation.id}-${activeConversation.participantIds?.slice().sort().join('-')}-e2ee-key`;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash |= 0;
    }

    const blocks = [];
    let seed = Math.abs(hash) || 123456789;
    for (let b = 0; b < 12; b++) {
      seed = (seed * 9301 + 49297) % 233280;
      const num = Math.floor(10000 + (seed / 233280) * 90000);
      blocks.push(String(num));
    }
    return blocks;
  }, [activeConversation]);

  if (!isE2EEModalOpen || !activeConversation) return null;

  const isVerified = Boolean(verifiedConversations && verifiedConversations[activeConversation.id]);
  const fullSafetyNumberString = safetyNumberBlocks.join(' ');

  const handleCopy = () => {
    navigator.clipboard.writeText(fullSafetyNumberString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200"
      onClick={() => setIsE2EEModalOpen(false)}
    >
      <div 
        className="w-full max-w-md bg-white dark:bg-[#120f24] rounded-3xl shadow-2xl border border-slate-200 dark:border-purple-900/40 overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between bg-gradient-to-r from-emerald-500/10 via-purple-500/5 to-transparent">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-500 dark:text-emerald-400 border border-emerald-500/30">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                <span>End-to-End Encryption</span>
                {isVerified && (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold border border-emerald-500/30">
                    Verified
                  </span>
                )}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                AES-256-GCM & Curve25519 Cryptographic Protocol
              </p>
            </div>
          </div>
          <button 
            type="button"
            onClick={() => setIsE2EEModalOpen(false)}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4">
          {/* Security description box */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex items-start gap-3">
            <div className="p-2 rounded-xl bg-purple-500/15 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5">
              <Lock className="w-4 h-4" />
            </div>
            <div className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Messages and calls to this chat are protected with end-to-end encryption. Only you and <strong>{otherParticipant?.name || 'the recipient'}</strong> have the unique security keys to read them.
            </div>
          </div>

          {/* Safety Number Fingerprint Grid */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-purple-500" />
                <span>60-Digit Safety Number</span>
              </label>
              <button
                type="button"
                onClick={handleCopy}
                className="text-[11px] font-medium text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

            {/* 12-block grid */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#0c0a1a] border border-slate-200 dark:border-purple-900/30 font-mono text-xs text-slate-800 dark:text-slate-200 grid grid-cols-3 gap-y-2 gap-x-3 text-center select-all">
              {safetyNumberBlocks.map((blk, idx) => (
                <div key={idx} className="p-1 rounded-lg bg-white/60 dark:bg-purple-950/20 border border-slate-200/60 dark:border-purple-900/20 tracking-wider">
                  {blk}
                </div>
              ))}
            </div>
          </div>

          {/* QR Verification Mockup Card */}
          <div className="p-3 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-900 flex items-center justify-center border border-purple-500/30">
                <QrCode className="w-6 h-6 text-purple-500" />
              </div>
              <div className="text-xs">
                <div className="font-semibold text-slate-800 dark:text-slate-200">In-Person Key Verification</div>
                <div className="text-[10px] text-slate-400">Scan QR code to verify security numbers match</div>
              </div>
            </div>
          </div>

          {/* Mark as Verified Toggle */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
            <div>
              <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <CheckCircle2 className={`w-3.5 h-3.5 ${isVerified ? 'text-emerald-400' : 'text-slate-400'}`} />
                <span>Mark as Verified</span>
              </div>
              <div className="text-[11px] text-slate-400">
                {isVerified ? 'You have verified this contact’s keys' : 'Confirm that safety numbers have been verified'}
              </div>
            </div>

            <button
              type="button"
              onClick={() => toggleVerifyConversation(activeConversation.id)}
              className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                isVerified ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'
              }`}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                  isVerified ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Footer */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-end">
            <button
              type="button"
              onClick={() => setIsE2EEModalOpen(false)}
              className="px-5 py-2 rounded-xl bg-gradient-to-tr from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 text-white text-xs font-semibold shadow-md shadow-purple-500/30 active:scale-95 transition-all"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
