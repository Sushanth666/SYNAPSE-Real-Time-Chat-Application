import React from 'react';
import { useAuth } from './context/AuthContext.jsx';
import { SocketProvider } from './context/SocketContext.jsx';
import { ChatProvider } from './context/ChatContext.jsx';
import { AuthView } from './components/auth/AuthView.jsx';
import { AppLayout } from './components/layout/AppLayout.jsx';
import { Loader2 } from 'lucide-react';
import './utils/tabAnimator.js';
export const AppContent = () => {
    const { user, isLoading } = useAuth();
    if (isLoading) {
        return (<div className="h-screen w-screen flex flex-col items-center justify-center bg-[#080c14] text-white">
        <div className="relative mb-5 animate-pulse">
          <img src="/synapse-logo.png" alt="Synapse" className="w-16 h-16 rounded-2xl shadow-2xl shadow-cyan-500/30 ring-1 ring-cyan-500/40 object-cover"/>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
          <Loader2 className="w-4 h-4 animate-spin text-cyan-400"/>
          <span>Connecting to Synapse...</span>
        </div>
      </div>);
    }
    if (!user) {
        return <AuthView />;
    }
    return (<SocketProvider>
      <ChatProvider>
        <AppLayout />
      </ChatProvider>
    </SocketProvider>);
};
export default function App() {
    return <AppContent />;
}
