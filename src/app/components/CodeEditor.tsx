import React, { useMemo } from 'react';
import Editor from 'react-simple-code-editor';
import Prism from 'prismjs';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-python';
import '../../styles/prism-theme.css'; // Custom theme
import clsx from 'clsx';

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  language: 'js' | 'py';
  className?: string;
  readOnly?: boolean;
}

export const CodeEditor = React.memo(function CodeEditor({ value, onChange, language, className, readOnly = false }: CodeEditorProps) {
  // Memoize line numbers to prevent recalculation on every render
  const lineNumbers = useMemo(() => {
    const lineCount = value.split('\n').length;
    return Array.from({ length: lineCount }, (_, i) => i + 1);
  }, [value]);

  // Memoize highlight function to prevent recreation
  const highlightCode = useMemo(() => {
    return (code: string) => Prism.highlight(
      code, 
      language === 'js' ? Prism.languages.javascript : Prism.languages.python, 
      language === 'js' ? 'javascript' : 'python'
    );
  }, [language]);

  return (
    <div className={clsx("relative w-full h-full flex font-mono text-sm group", className)}>
      {/* Line Numbers */}
      <div className="flex flex-col items-end px-4 py-6 text-right select-none text-white/20 bg-black/20 border-r border-white/5 font-mono text-sm leading-[1.5]">
        {lineNumbers.map((num) => (
          <div key={num} className="h-[21px]">{num}</div>
        ))}
      </div>

      {/* Editor Area */}
      <div className="relative flex-1 h-full overflow-auto custom-scrollbar">
        <Editor
          value={value}
          onValueChange={onChange}
          highlight={highlightCode}
          padding={24}
          style={{
            fontFamily: '"Fira Code", "JetBrains Mono", monospace',
            fontSize: 14,
            backgroundColor: 'transparent',
            minHeight: '100%',
            lineHeight: 1.5,
          }}
          className="min-h-full"
          textareaClassName="focus:outline-none"
          readOnly={readOnly}
        />
      </div>
    </div>
  );
});