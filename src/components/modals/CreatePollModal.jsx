import React, { useState } from 'react';
import { X, Plus, Trash2, BarChart2 } from 'lucide-react';
export const CreatePollModal = ({ isOpen, onClose, onCreatePoll }) => {
    const [question, setQuestion] = useState('');
    const [options, setOptions] = useState(['', '']);
    const [allowsMultiple, setAllowsMultiple] = useState(false);
    const [error, setError] = useState(null);
    if (!isOpen)
        return null;
    const handleOptionChange = (index, val) => {
        setOptions(prev => {
            const next = [...prev];
            next[index] = val;
            return next;
        });
    };
    const addOption = () => {
        if (options.length >= 6)
            return;
        setOptions(prev => [...prev, '']);
    };
    const removeOption = (index) => {
        if (options.length <= 2)
            return;
        setOptions(prev => prev.filter((_, i) => i !== index));
    };
    const handleSubmit = (e) => {
        e.preventDefault();
        if (!question.trim()) {
            setError('Please provide a poll question.');
            return;
        }
        const cleanOptions = options.map(o => o.trim()).filter(Boolean);
        if (cleanOptions.length < 2) {
            setError('Please provide at least 2 options.');
            return;
        }
        onCreatePoll(question.trim(), cleanOptions, allowsMultiple);
        onClose();
        // Reset
        setQuestion('');
        setOptions(['', '']);
        setAllowsMultiple(false);
        setError(null);
    };
    return (<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-modal-in" onClick={e => e.stopPropagation()}>
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-brand-500"/>
            <span>Create In-Chat Poll</span>
          </h2>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <X className="w-4 h-4"/>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Poll Question *
            </label>
            <input type="text" required placeholder="e.g. When should we deploy the real-time update?" value={question} onChange={e => setQuestion(e.target.value)} className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 text-xs focus:outline-none focus:border-brand-500"/>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Options *
            </label>
            {options.map((opt, index) => (<div key={index} className="flex items-center gap-2">
                <input type="text" required placeholder={`Option ${index + 1}`} value={opt} onChange={e => handleOptionChange(index, e.target.value)} className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 text-xs focus:outline-none focus:border-brand-500"/>
                {options.length > 2 && (<button type="button" onClick={() => removeOption(index)} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors" title="Remove option">
                    <Trash2 className="w-3.5 h-3.5"/>
                  </button>)}
              </div>))}

            {options.length < 6 && (<button type="button" onClick={addOption} className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-brand-600 dark:text-brand-400 hover:text-brand-500 py-1">
                <Plus className="w-3.5 h-3.5"/>
                <span>Add another option</span>
              </button>)}
          </div>

          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 cursor-pointer">
              <input type="checkbox" checked={allowsMultiple} onChange={e => setAllowsMultiple(e.target.checked)} className="rounded border-slate-300 text-brand-600 focus:ring-brand-500"/>
              <span>Allow multiple choices</span>
            </label>
          </div>

          {error && (<p className="text-xs text-rose-500 font-medium">{error}</p>)}

          <div className="pt-2 flex items-center justify-end gap-2">
            <button type="button" onClick={onClose} className="px-3.5 py-1.5 text-xs font-medium text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white rounded-lg transition-colors">
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 text-xs font-semibold bg-brand-600 hover:bg-brand-500 text-white rounded-xl shadow-md shadow-brand-500/20 active:scale-95 transition-all">
              Create Poll
            </button>
          </div>
        </form>
      </div>
    </div>);
};
