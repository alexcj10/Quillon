export interface FormattedText {
  text: string;
  formatted: string;
  cursorOffset: number;
}

export function formatMarkdown(text: string, cursorPosition: number): FormattedText {
  let formatted = text;
  let cursorOffset = 0;

  // Handle headers (hide # symbol)
  formatted = formatted.replace(/^(#{1,6})\s+(.+)$/gm, (match, hashes, content) => {
    const level = hashes.length;
    if (cursorPosition > 0 && cursorPosition <= match.length) {
      cursorOffset = -(hashes.length + 1); // +1 for the space
    }
    return `<h${level} class="markdown-header">${content}</h${level}>`;
  });

  // Handle bold text (hide ** symbols)
  formatted = formatted.replace(/\*\*(.+?)\*\*/g, (match, content, offset) => {
    if (cursorPosition > offset && cursorPosition <= offset + match.length) {
      const beforeCursor = match.substring(0, cursorPosition - offset);
      const asteriskCount = (beforeCursor.match(/\*\*/g) || []).length;
      cursorOffset -= asteriskCount * 2;
    }
    return `<strong class="markdown-bold">${content}</strong>`;
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