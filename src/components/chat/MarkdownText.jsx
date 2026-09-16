import React from 'react';
import { CodeSnippet } from './CodeSnippet.jsx';
import { CheckSquare, Square, ExternalLink } from 'lucide-react';
export const MarkdownText = ({ text, isMe, searchQuery = '' }) => {
    if (!text)
        return null;
    // 1. Split text into code blocks and non-code segments
    const codeBlockRegex = /```([a-zA-Z0-9_-]*)\n?([\s\S]*?)```/g;
    const elements = [];
    let lastIndex = 0;
    let match;
    while ((match = codeBlockRegex.exec(text)) !== null) {
        if (match.index > lastIndex) {
            const regularText = text.substring(lastIndex, match.index);
            elements.push(renderTextWithBlocks(regularText, `text-${lastIndex}`, isMe, searchQuery));
        }
        const language = match[1] || 'code';
        const code = match[2];
        elements.push(<CodeSnippet key={`code-${match.index}`} language={language} code={code}/>);
        lastIndex = codeBlockRegex.lastIndex;
    }
    if (lastIndex < text.length) {
        elements.push(renderTextWithBlocks(text.substring(lastIndex), `text-${lastIndex}`, isMe, searchQuery));
    }
    return <div className="space-y-1 select-text">{elements}</div>;
};
// Render block elements: blockquotes, checklists, lists, paragraphs
function renderTextWithBlocks(blockText, keyPrefix, isMe, searchQuery) {
    const lines = blockText.split('\n');
    const renderedLines = [];
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        // Blockquote
        if (line.startsWith('> ')) {
            renderedLines.push(<blockquote key={`${keyPrefix}-quote-${i}`} className={`border-l-2 pl-3 py-1 my-1 italic text-xs ${isMe
                    ? 'border-white/50 text-white/90 bg-white/10 rounded-r-lg'
                    : 'border-brand-500 text-slate-600 dark:text-slate-300 bg-slate-100/70 dark:bg-slate-800/60 rounded-r-lg'}`}>
          {renderInlineMarkdown(line.substring(2), isMe, searchQuery)}
        </blockquote>);
            continue;
        }
        // Checklist unchecked: - [ ]
        if (/^-\s*\[\s*\]\s+/.test(line)) {
            const content = line.replace(/^-\s*\[\s*\]\s+/, '');
            renderedLines.push(<div key={`${keyPrefix}-chk-${i}`} className="flex items-center gap-2 text-xs my-0.5">
          <Square className="w-3.5 h-3.5 flex-shrink-0 opacity-70"/>
          <span>{renderInlineMarkdown(content, isMe, searchQuery)}</span>
        </div>);
            continue;
        }
        // Checklist checked: - [x]
        if (/^-\s*\[[xX]\]\s+/.test(line)) {
            const content = line.replace(/^-\s*\[[xX]\]\s+/, '');
            renderedLines.push(<div key={`${keyPrefix}-chk-${i}`} className="flex items-center gap-2 text-xs my-0.5 opacity-80">
          <CheckSquare className="w-3.5 h-3.5 flex-shrink-0 text-brand-500"/>
          <span className="line-through">{renderInlineMarkdown(content, isMe, searchQuery)}</span>
        </div>);
            continue;
        }
        // Bullet list: - item or * item
        if (/^[-*]\s+/.test(line)) {
            const content = line.replace(/^[-*]\s+/, '');
            renderedLines.push(<div key={`${keyPrefix}-list-${i}`} className="flex items-start gap-2 text-xs my-0.5 pl-1">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-current mt-1.5 flex-shrink-0 opacity-70"/>
          <span>{renderInlineMarkdown(content, isMe, searchQuery)}</span>
        </div>);
            continue;
        }
        // Standard line
        if (line.trim() === '') {
            renderedLines.push(<div key={`${keyPrefix}-empty-${i}`} className="h-2"/>);
        }
        else {
            renderedLines.push(<p key={`${keyPrefix}-p-${i}`} className="leading-relaxed text-xs sm:text-sm">
          {renderInlineMarkdown(line, isMe, searchQuery)}
        </p>);
        }
    }
    return <div key={keyPrefix}>{renderedLines}</div>;
}

// Helper to highlight search query in raw text
function highlightText(content, query, keyPrefix = 'hl') {
    if (!query || !query.trim() || typeof content !== 'string') return content;
    const escaped = query.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escaped})`, 'gi');
    const parts = content.split(regex);
    if (parts.length <= 1) return content;
    return parts.map((part, idx) =>
        part.toLowerCase() === query.trim().toLowerCase() ? (
            <mark key={`${keyPrefix}-${idx}`} className="bg-amber-300 dark:bg-amber-400 text-slate-900 font-extrabold px-1 py-0.2 rounded shadow-xs">
                {part}
            </mark>
        ) : (
            part
        )
    );
}

// Render inline elements: bold, italic, strikethrough, inline code, @mentions, URLs
function renderInlineMarkdown(text, isMe, searchQuery) {
    // Regex to match inline tokens
    const inlineRegex = /(`[^`]+`|\*\*[^*]+\*\*|__[^_]+__|~~[^~]+~~|~[^~]+~|\*[^*]+\*|_[^_]+_|@[a-zA-Z0-9_.-]+|https?:\/\/[^\s]+)/g;
    const parts = [];
    let lastIndex = 0;
    let match;
    while ((match = inlineRegex.exec(text)) !== null) {
        if (match.index > lastIndex) {
            parts.push(highlightText(text.substring(lastIndex, match.index), searchQuery, `txt-${lastIndex}`));
        }
        const token = match[0];
        if (token.startsWith('`') && token.endsWith('`')) {
            // Inline code
            parts.push(<code key={match.index} className={`px-1.5 py-0.5 rounded-md font-mono text-[11px] font-semibold ${isMe
                    ? 'bg-black/25 text-white border border-white/20'
                    : 'bg-slate-200 dark:bg-slate-800 text-brand-600 dark:text-brand-400 border border-slate-300 dark:border-slate-700'}`}>
          {highlightText(token.slice(1, -1), searchQuery, `code-${match.index}`)}
        </code>);
        }
        else if ((token.startsWith('**') && token.endsWith('**')) || (token.startsWith('__') && token.endsWith('__'))) {
            // Bold
            parts.push(<strong key={match.index} className="font-bold">
          {highlightText(token.slice(2, -2), searchQuery, `bold-${match.index}`)}
        </strong>);
        }
        else if ((token.startsWith('~~') && token.endsWith('~~')) || (token.startsWith('~') && token.endsWith('~'))) {
            // Strikethrough
            const sliceCount = token.startsWith('~~') ? 2 : 1;
            parts.push(<span key={match.index} className="line-through opacity-80">
          {highlightText(token.slice(sliceCount, -sliceCount), searchQuery, `strike-${match.index}`)}
        </span>);
        }
        else if ((token.startsWith('*') && token.endsWith('*')) || (token.startsWith('_') && token.endsWith('_'))) {
            // Italic
            parts.push(<em key={match.index} className="italic">
          {highlightText(token.slice(1, -1), searchQuery, `italic-${match.index}`)}
        </em>);
        }
        else if (token.startsWith('@')) {
            // @mention pill
            parts.push(<span key={match.index} className={`inline-flex items-center px-1.5 py-0.2 mx-0.5 rounded-md font-semibold text-xs transition-all hover:scale-105 select-none ${isMe
                    ? 'bg-white/25 text-white font-bold'
                    : 'bg-brand-500/15 text-brand-600 dark:text-brand-300 border border-brand-500/25'}`}>
          {token}
        </span>);
        }
        else if (token.startsWith('http://') || token.startsWith('https://')) {
            // Clickable URL
            parts.push(<a key={match.index} href={token} target="_blank" rel="noopener noreferrer" className={`inline-flex items-center gap-0.5 underline font-medium hover:opacity-80 transition-opacity ${isMe ? 'text-white' : 'text-brand-600 dark:text-brand-400'}`}>
          <span>{token.length > 35 ? `${token.substring(0, 32)}...` : token}</span>
          <ExternalLink className="w-3 h-3 inline-block"/>
        </a>);
        }
        else {
            parts.push(highlightText(token, searchQuery, `tok-${match.index}`));
        }
        lastIndex = inlineRegex.lastIndex;
    }
    if (lastIndex < text.length) {
        parts.push(highlightText(text.substring(lastIndex), searchQuery, `end-${lastIndex}`));
    }
    return parts.length > 0 ? parts : highlightText(text, searchQuery, 'full');
}
