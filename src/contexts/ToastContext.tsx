/* eslint-disable react-refresh/only-export-components */
import { createContext, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import { Toast } from '../components/Toast';
import type { ToastType } from '../components/Toast';

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void;
}

export const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<{ message: string; type: ToastType; isVisible: boolean }>({
    message: '',
    type: 'info',
    isVisible: false,
  });

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    // Hide current if any, then show new
    setToast(prev => ({ ...prev, isVisible: false }));
    
    setTimeout(() => {
      setToast({ message, type, isVisible: true });
    }, 100);
  }, []);

  const closeToast = useCallback(() => {
    setToast(prev => ({ ...prev, isVisible: false }));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <Toast 
        message={toast.message} 
        type={toast.type} 
        isVisible={toast.isVisible} 
        onClose={closeToast} 
      />
    </ToastContext.Provider>
  );
}