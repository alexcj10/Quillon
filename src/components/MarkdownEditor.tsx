import React, { useState, useRef, useEffect } from 'react';
import { formatMarkdown, getCursorPosition, setCursorPosition } from '../utils/markdownUtils';

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  isTitle?: boolean;
}

export function MarkdownEditor({
  value,
  onChange,
  placeholder,
  className = '',
  isTitle = false
}: MarkdownEditorProps) {
  const editorRef = useRef<HTMLTextAreaElement | HTMLInputElement>(null);
  const [cursorPosition, setCursorPos] = useState(0);
  const [isComposing, setIsComposing] = useState(false);

  useEffect(() => {
    if (editorRef.current && !isComposing) {
      const formatted = formatMarkdown(value, cursorPosition);
      const newPosition = cursorPosition + formatted.cursorOffset;
      
      requestAnimationFrame(() => {
        if (editorRef.current) {
          setCursorPosition(editorRef.current, newPosition);
        }
      });
    }
  }, [value, cursorPosition, isComposing]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    const newValue = e.target.value;
    const newCursorPos = getCursorPosition(e.target);
    setCursorPos(newCursorPos);
    onChange(newValue);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const target = e.target as HTMLTextAreaElement | HTMLInputElement;
      const start = target.selectionStart || 0;
      const end = target.selectionEnd || 0;
      
      const newValue = value.substring(0, start) + '  ' + value.substring(end);
      onChange(newValue);
      
      requestAnimationFrame(() => {
        if (editorRef.current) {
          setCursorPosition(editorRef.current, start + 2);
        }
      });
    }
  };

  const baseClassName = `w-full p-3 border rounded-lg bg-white/90 dark:bg-gray-700/90 
    border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-200 
    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
    ${className}`;

  if (isTitle) {
    return (
      <div className="relative">
        <input
          ref={editorRef as React.RefObject<HTMLInputElement>}
          type="text"
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onCompositionStart={() => setIsComposing(true)}
          onCompositionEnd={() => setIsComposing(false)}
          placeholder={placeholder}
          className={`${baseClassName} text-xl font-semibold`}
          required
        />
        <div
          className={`absolute inset-0 p-3 pointer-events-none ${baseClassName} text-xl font-semibold`}
          dangerouslySetInnerHTML={{ __html: formatMarkdown(value, cursorPosition).formatted }}
        />
      </div>
    );
  }

  return (
    <div className="relative">
      <textarea
        ref={editorRef as React.RefObject<HTMLTextAreaElement>}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onCompositionStart={() => setIsComposing(true)}
        onCompositionEnd={() => setIsComposing(false)}
        placeholder={placeholder}
        className={`${baseClassName} resize-none`}
        required
      />
      <div
        className={`absolute inset-0 p-3 pointer-events-none ${baseClassName} overflow-hidden`}
        dangerouslySetInnerHTML={{ __html: formatMarkdown(value, cursorPosition).formatted }}
      />
    </div>
  );
}