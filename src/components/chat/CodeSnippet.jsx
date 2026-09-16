import React, { useState, useMemo } from 'react';
import { CheckCheck, Terminal, FileCode } from 'lucide-react';
// Tokenize and highlight code lines without requiring heavy external dependencies
function highlightTokens(line, lang) {
    const language = lang.toLowerCase();
    // Keyword sets based on language
    const jsKeywords = /\b(const|let|var|function|return|if|else|for|while|import|from|export|default|class|extends|new|this|async|await|try|catch|throw|finally|typeof|instanceof|interface|type|null|undefined|true|false)\b/g;
    const pyKeywords = /\b(def|class|return|if|elif|else|for|while|import|from|as|try|except|finally|raise|with|yield|in|is|not|and|or|lambda|None|True|False|self)\b/g;
    const sqlKeywords = /\b(SELECT|FROM|WHERE|INSERT|INTO|UPDATE|DELETE|JOIN|LEFT|RIGHT|INNER|OUTER|GROUP|BY|ORDER|HAVING|LIMIT|CREATE|TABLE|ALTER|DROP|INDEX|PRIMARY|KEY|AND|OR|NOT|AS|VALUES)\b/gi;
    const cssKeywords = /\b(display|flex|grid|color|background|padding|margin|border|width|height|position|absolute|relative|fixed|font|text|align|center|none|block|inline|rem|px|em)\b/gi;
    let keywordRegex = jsKeywords;
    if (language === 'python' || language === 'py')
        keywordRegex = pyKeywords;
    else if (language === 'sql')
        keywordRegex = sqlKeywords;
    else if (language === 'css' || language === 'scss')
        keywordRegex = cssKeywords;
    // Split tokens by comments, strings, and standard words
    const regex = /("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`|\/\/.*$|#.*$|\b\d+(?:\.\d+)?\b|[a-zA-Z_$][a-zA-Z0-9_$]*|[{}()[\].,;:+\-*/%=<>!&|^~?])/g;
    const nodes = [];
    let lastIndex = 0;
    let match;
    while ((match = regex.exec(line)) !== null) {
        if (match.index > lastIndex) {
            nodes.push(line.substring(lastIndex, match.index));
        }
        const token = match[0];
        if (token.startsWith('//') || token.startsWith('#')) {
            // Comment
            nodes.push(<span key={match.index} className="text-slate-500 italic">
          {token}
        </span>);
        }
        else if (token.startsWith('"') || token.startsWith("'") || token.startsWith('`')) {
            // String
            nodes.push(<span key={match.index} className="text-emerald-400">
          {token}
        </span>);
        }
        else if (/^\d+(?:\.\d+)?$/.test(token)) {
            // Number
            nodes.push(<span key={match.index} className="text-amber-400 font-semibold">
          {token}
        </span>);
        }
        else if (keywordRegex.test(token)) {
            // Keyword
            nodes.push(<span key={match.index} className="text-purple-400 font-bold">
          {token}
        </span>);
        }
        else if (/^[A-Z][a-zA-Z0-9_$]*$/.test(token)) {
            // Types / Classes (PascalCase)
            nodes.push(<span key={match.index} className="text-cyan-300 font-medium">
          {token}
        </span>);
        }
        else if (['=', '==', '===', '!=', '!==', '>', '<', '>=', '<=', '+', '-', '*', '/', '&&', '||', '=>'].includes(token)) {
            // Operators
            nodes.push(<span key={match.index} className="text-rose-400">
          {token}
        </span>);
        }
        else {
            nodes.push(token);
        }
        lastIndex = regex.lastIndex;
    }
    if (lastIndex < line.length) {
        nodes.push(line.substring(lastIndex));
    }
    return nodes.length > 0 ? nodes : [line];
}
export const CodeSnippet = ({ language = 'code', code }) => {
    const [copied, setCopied] = useState(false);
    const cleanCode = useMemo(() => code.trim(), [code]);
    const lines = useMemo(() => cleanCode.split('\n'), [cleanCode]);
    const handleCopy = () => {
        navigator.clipboard.writeText(cleanCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };
    const getLanguageBadge = (lang) => {
        const l = lang.toLowerCase();
        if (['ts', 'typescript', 'tsx'].includes(l))
            return { name: 'TypeScript', color: 'text-blue-400' };
        if (['js', 'javascript', 'jsx'].includes(l))
            return { name: 'JavaScript', color: 'text-amber-300' };
        if (['py', 'python'].includes(l))
            return { name: 'Python', color: 'text-emerald-400' };
        if (['html', 'xml'].includes(l))
            return { name: 'HTML', color: 'text-orange-400' };
        if (['css', 'scss'].includes(l))
            return { name: 'CSS', color: 'text-pink-400' };
        if (['json'].includes(l))
            return { name: 'JSON', color: 'text-yellow-400' };
        if (['sql'].includes(l))
            return { name: 'SQL', color: 'text-teal-400' };
        if (['sh', 'bash', 'zsh', 'terminal'].includes(l))
            return { name: 'Bash', color: 'text-lime-400' };
        return { name: lang.toUpperCase(), color: 'text-brand-400' };
    };
    const badge = getLanguageBadge(language);
    return (<div className="my-2 rounded-2xl overflow-hidden border border-slate-700/80 bg-[#0d1117] text-slate-200 text-xs font-mono shadow-xl max-w-full group/snippet">
      {/* Header Bar */}
      <div className="px-3.5 py-2 bg-[#161b22] border-b border-slate-700/70 flex items-center justify-between select-none">
        <div className="flex items-center gap-2">
          {['sh', 'bash', 'terminal'].includes(language.toLowerCase()) ? (<Terminal className="w-3.5 h-3.5 text-lime-400"/>) : (<FileCode className={`w-3.5 h-3.5 ${badge.color}`}/>)}
          <span className={`text-[11px] font-bold uppercase tracking-wider ${badge.color}`}>
            {badge.name}
          </span>
          <span className="text-[10px] text-slate-500 font-sans">
            {lines.length} {lines.length === 1 ? 'line' : 'lines'}
          </span>
        </div>

        <button onClick={handleCopy} className="flex items-center gap-1.5 text-[11px] font-sans font-medium text-slate-400 hover:text-white px-2.5 py-1 rounded-lg hover:bg-slate-800 border border-transparent hover:border-slate-700 transition-all active:scale-95" title="Copy code to clipboard">
          {copied ? (<>
              <CheckCheck className="w-3.5 h-3.5 text-emerald-400"/>
              <span className="text-emerald-400">Copied!</span>
            </>) : (<>
              <Terminal className="w-3.5 h-3.5"/>
              <span>Copy</span>
            </>)}
        </button>
      </div>

      {/* Code Body with Line Numbers */}
      <div className="overflow-x-auto py-2.5 select-text text-[11px] sm:text-xs leading-relaxed">
        <table className="w-full border-collapse">
          <tbody>
            {lines.map((line, idx) => (<tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                {/* Line Number Gutter */}
                <td className="w-10 pr-3 pl-3 text-right select-none text-slate-600 font-mono text-[10px] align-top border-r border-slate-800">
                  {idx + 1}
                </td>
                {/* Highlighted Code Line */}
                <td className="pl-3.5 pr-4 whitespace-pre font-mono font-normal">
                  {highlightTokens(line, language)}
                </td>
              </tr>))}
          </tbody>
        </table>
      </div>
    </div>);
};
