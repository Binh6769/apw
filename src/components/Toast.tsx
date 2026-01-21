import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import clsx from 'clsx';

export type ToastType = 'success' | 'error' | 'info';

interface ToastProps {
  message: string;
  type?: ToastType;
  isVisible: boolean;
  onClose: () => void;
  duration?: number;
}

export function Toast({ message, type = 'info', isVisible, onClose, duration = 3000 }: ToastProps) {
  const [isShowing, setIsShowing] = useState(false);

  useEffect(() => {
    if (isVisible) {
      const showTimer = setTimeout(() => setIsShowing(true), 10);
      const timer = setTimeout(() => {
        setIsShowing(false);
        setTimeout(onClose, 300); // Wait for animation
      }, duration);
      return () => {
        clearTimeout(showTimer);
        clearTimeout(timer);
      };
    } else {
      const t = setTimeout(() => setIsShowing(false), 0);
      return () => clearTimeout(t);
    }
  }, [isVisible, duration, onClose]);

  if (!isVisible && !isShowing) return null;

  return createPortal(
    <div className={clsx(
      "fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] transition-all duration-300 ease-in-out",
      isShowing ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
    )}>
      <div className={clsx(
        "px-6 py-3 rounded-full shadow-lg font-semibold text-white flex items-center gap-2",
        type === 'success' ? "bg-black" : 
        type === 'error' ? "bg-red-600" : "bg-gray-800"
      )}>
        {message}
      </div>
    </div>,
    document.body
  );
}
