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
  const [displayValue, setDisplayValue] = useState(value);
  const editorRef = useRef<HTMLTextAreaElement | HTMLInputElement>(null);
  const [cursorPosition, setCursorPos] = useState(0);

  useEffect(() => {
    if (editorRef.current) {
      const formatted = formatMarkdown(value, cursorPosition);
      setDisplayValue(formatted.formatted);
      
      // Restore cursor position after formatting
      const newPosition = cursorPosition + formatted.cursorOffset;
      requestAnimationFrame(() => {
        if (editorRef.current) {
          setCursorPosition(editorRef.current, newPosition);
        }
      });
    }
  }, [value, cursorPosition]);

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

  if (isTitle) {
    return (
      <input
        ref={editorRef as React.RefObject<HTMLInputElement>}
        type="text"
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={`w-full p-3 border rounded-lg bg-white/90 dark:bg-gray-700/90 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-200 ${className}`}
      />
    );
  }

  return (
    <textarea
      ref={editorRef as React.RefObject<HTMLTextAreaElement>}
      value={value}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      placeholder={placeholder}
      className={`w-full p-3 border rounded-lg bg-white/90 dark:bg-gray-700/90 border-gray-300 dark:border-gray-600 text-gray-800 dark:text-gray-200 ${className}`}
    />
  );
}