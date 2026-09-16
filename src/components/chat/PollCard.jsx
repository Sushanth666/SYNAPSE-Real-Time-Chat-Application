import React from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { BarChart2, CheckCircle2, Circle } from 'lucide-react';
export const PollCard = ({ poll, messageId, onVote, isMe }) => {
    const { user } = useAuth();
    const totalVotes = poll.options.reduce((sum, opt) => sum + opt.votes.length, 0);
    return (<div className={`p-4 rounded-2xl min-w-[280px] sm:min-w-[320px] max-w-md ${isMe
            ? 'bg-brand-700/20 border border-brand-500/30 text-white'
            : 'bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 text-slate-800 dark:text-slate-100'}`}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <div className="p-1.5 rounded-lg bg-brand-500/20 text-brand-400">
          <BarChart2 className="w-4 h-4"/>
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="text-xs sm:text-sm font-bold truncate">
            {poll.question}
          </h4>
          <span className="text-[10px] opacity-75">
            {totalVotes} {totalVotes === 1 ? 'vote' : 'votes'} • {poll.allowsMultiple ? 'Multiple choices' : 'Single choice'}
          </span>
        </div>
      </div>

      {/* Options */}
      <div className="space-y-2">
        {poll.options.map(option => {
            const hasVoted = user ? option.votes.includes(user.id) : false;
            const votePercent = totalVotes > 0 ? Math.round((option.votes.length / totalVotes) * 100) : 0;
            return (<button key={option.id} onClick={() => onVote(messageId, option.id)} className={`w-full text-left p-2.5 rounded-xl border relative overflow-hidden transition-all group ${hasVoted
                    ? 'border-brand-500/60 bg-brand-500/10 dark:bg-brand-500/20'
                    : 'border-slate-200 dark:border-slate-700 hover:border-brand-500/40 bg-white dark:bg-slate-900/60'}`}>
              {/* Animated progress background bar */}
              <div className={`absolute inset-y-0 left-0 transition-all duration-500 ${hasVoted
                    ? 'bg-brand-500/25 dark:bg-brand-500/35'
                    : 'bg-slate-200/50 dark:bg-slate-700/40'}`} style={{ width: `${votePercent}%` }}/>

              {/* Content */}
              <div className="relative z-10 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  {hasVoted ? (<CheckCircle2 className="w-4 h-4 text-brand-500 flex-shrink-0"/>) : (<Circle className="w-4 h-4 text-slate-400 group-hover:text-brand-500 transition-colors flex-shrink-0"/>)}
                  <span className="text-xs font-semibold truncate">
                    {option.text}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400 flex-shrink-0">
                  <span>{votePercent}%</span>
                  <span className="text-[10px] font-normal opacity-70">({option.votes.length})</span>
                </div>
              </div>
            </button>);
        })}
      </div>
    </div>);
};
