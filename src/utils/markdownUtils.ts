export interface FormattedText {
  text: string;
  formatted: string;
  cursorOffset: number;
}

export function formatMarkdown(text: string, cursorPosition: number): FormattedText {
  let formatted = text;
  let cursorOffset = 0;

  // Handle headers
  formatted = formatted.replace(/^(#{1,6})\s(.+)$/gm, (match, hashes, content) => {
    const level = hashes.length;
    return `<h${level}>${content}</h${level}>`;
  });

  // Handle bold text
  let boldOffset = 0;
  formatted = formatted.replace(/\*\*(.+?)\*\*/g, (match, content, offset) => {
    // If cursor is within or right after the bold marks, adjust offset
    if (cursorPosition > offset && cursorPosition <= offset + match.length) {
      const beforeCursor = match.substring(0, cursorPosition - offset);
      const boldCount = (beforeCursor.match(/\*\*/g) || []).length;
      cursorOffset -= boldCount * 2;
    }
    return `<strong>${content}</strong>`;
  });

  return {
    text: text,
    formatted: formatted,
    cursorOffset
  };
}

export function getFormattedHTML(text: string): string {
  return formatMarkdown(text, -1).formatted;
}

export function getCursorPosition(element: HTMLInputElement | HTMLTextAreaElement): number {
  return element.selectionStart || 0;
}

export function setCursorPosition(
  element: HTMLInputElement | HTMLTextAreaElement,
  position: number
): void {
  element.setSelectionRange(position, position);
}