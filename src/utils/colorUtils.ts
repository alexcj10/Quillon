export function getNoteColorClass(color?: string): string {
  if (!color) {
    return 'bg-gray-100 dark:bg-gray-800';
  }
  return `bg-note-${color}-light dark:bg-note-${color}-dark`;
}