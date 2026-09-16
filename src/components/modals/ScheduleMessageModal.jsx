import React, { useState } from 'react';
import { useChat } from '../../context/ChatContext.jsx';
import { Clock, Calendar, X, Sparkles, Send } from 'lucide-react';

export const ScheduleMessageModal = ({ initialText = '', initialAttachments = [], onScheduled }) => {
  const { isScheduleModalOpen, setIsScheduleModalOpen, scheduleMessage } = useChat();

  // Helper to format ISO to datetime-local input string
  const toLocalISO = (date) => {
    const tzOffset = date.getTimezoneOffset() * 60000;
    const localISOTime = new Date(date.getTime() - tzOffset).toISOString().slice(0, 16);
    return localISOTime;
  };

  const defaultDate = new Date(Date.now() + 15 * 60 * 1000); // 15 mins from now
  const [scheduledDateTime, setScheduledDateTime] = useState(toLocalISO(defaultDate));
  const [selectedPreset, setSelectedPreset] = useState('15m');
  const [text, setText] = useState(initialText);

  if (!isScheduleModalOpen) return null;

  const presets = [
    {
      id: '15m',
      label: 'In 15 minutes',
      getDate: () => new Date(Date.now() + 15 * 60 * 1000),
    },
    {
      id: '1h',
      label: 'In 1 hour',
      getDate: () => new Date(Date.now() + 60 * 60 * 1000),
    },
    {
      id: '3h',
      label: 'In 3 hours',
      getDate: () => new Date(Date.now() + 3 * 60 * 60 * 1000),
    },
    {
      id: 'tomorrow',
      label: 'Tomorrow at 9:00 AM',
      getDate: () => {
        const d = new Date();
        d.setDate(d.getDate() + 1);
        d.setHours(9, 0, 0, 0);
        return d;
      },
    },
  ];

  const handleSelectPreset = (preset) => {
    setSelectedPreset(preset.id);
    setScheduledDateTime(toLocalISO(preset.getDate()));
  };

  const handleCustomChange = (e) => {
    setSelectedPreset('custom');
    setScheduledDateTime(e.target.value);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!text.trim()) return;

    const targetTimestamp = new Date(scheduledDateTime).getTime();
    if (isNaN(targetTimestamp) || targetTimestamp <= Date.now()) {
      alert('Please choose a time in the future.');
      return;
    }

    scheduleMessage(text, targetTimestamp, initialAttachments);
    setIsScheduleModalOpen(false);
    if (onScheduled) onScheduled();
  };

  const targetDateObj = new Date(scheduledDateTime);
  const formattedScheduledTime = !isNaN(targetDateObj.getTime())
    ? targetDateObj.toLocaleDateString([], { month: 'short', day: 'numeric', weekday: 'short' }) +
      ' at ' +
      targetDateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '';

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200"
      onClick={() => setIsScheduleModalOpen(false)}
    >
      <div 
        className="w-full max-w-md bg-white dark:bg-[#120f24] rounded-3xl shadow-2xl border border-slate-200 dark:border-purple-900/40 overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between bg-gradient-to-r from-purple-500/10 via-violet-500/5 to-transparent">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Schedule Message
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Send later across time zones automatically
              </p>
            </div>
          </div>
          <button 
            type="button"
            onClick={() => setIsScheduleModalOpen(false)}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Message Textarea */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Message Content
            </label>
            <textarea
              rows={3}
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="What would you like to say later?"
              required
              className="w-full bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all resize-none"
            />
          </div>

          {/* Quick Presets */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-purple-500" />
              <span>Quick Timing Presets</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {presets.map(p => {
                const isSelected = selectedPreset === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleSelectPreset(p)}
                    className={`py-2 px-3 rounded-xl text-xs font-medium border text-left transition-all flex items-center justify-between ${
                      isSelected
                        ? 'bg-purple-500/15 border-purple-500/50 text-purple-600 dark:text-purple-300 shadow-xs ring-1 ring-purple-500/30 font-semibold'
                        : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-purple-500/30'
                    }`}
                  >
                    <span>{p.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Date & Time Picker */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>Or Choose Custom Date & Time</span>
            </label>
            <input
              type="datetime-local"
              value={scheduledDateTime}
              onChange={handleCustomChange}
              min={toLocalISO(new Date())}
              className="w-full bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
            />
          </div>

          {/* Target time preview pill */}
          <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-600 dark:text-purple-300 text-xs flex items-center justify-between">
            <span className="font-medium">Will be sent:</span>
            <span className="font-bold">{formattedScheduledTime}</span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/80">
            <button
              type="button"
              onClick={() => setIsScheduleModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!text.trim()}
              className="px-5 py-2 rounded-xl bg-gradient-to-tr from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500 disabled:opacity-40 text-white text-xs font-semibold shadow-md shadow-purple-500/30 active:scale-95 transition-all flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Schedule Send</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
