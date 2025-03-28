import { useEffect, useRef } from 'react';

interface UseOutsideClickProps {
  onOutsideClick: () => void;
  isOpen: boolean;
}

export function useOutsideClick({ onOutsideClick, isOpen }: UseOutsideClickProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        onOutsideClick();
      }
    }

    function handleEscapeKey(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onOutsideClick();
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscapeKey);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [onOutsideClick, isOpen]);

  return ref;
} 