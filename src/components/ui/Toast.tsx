'use client';

import { useState, useEffect, useCallback } from 'react';
import { CheckCircle, XCircle, X } from 'lucide-react';

export type ToastType = 'success' | 'error';

export interface ToastMessage {
  id: number;
  type: ToastType;
  message: string;
}

interface ToastProps {
  toasts: ToastMessage[];
  onRemove: (id: number) => void;
}

export function Toast({ toasts, onRemove }: ToastProps) {
  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={`flex items-start gap-3 px-4 py-3 rounded-xl shadow-lg border pointer-events-auto min-w-72 max-w-sm animate-in slide-in-from-right ${
            toast.type === 'success'
              ? 'bg-white border-green-200'
              : 'bg-white border-red-200'
          }`}
          style={{ animation: 'slideIn 0.2s ease-out' }}
        >
          {toast.type === 'success'
            ? <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
            : <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          }
          <p className="text-sm text-gray-700 flex-1 leading-relaxed">{toast.message}</p>
          <button
            onClick={() => onRemove(toast.id)}
            className="text-gray-400 hover:text-gray-600 flex-shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(100%); }
          to   { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}

// Hook to manage toasts
export function useToast() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const remove = useCallback((id: number) => {
    setToasts(t => t.filter(x => x.id !== id));
  }, []);

  const add = useCallback((message: string, type: ToastType = 'success', duration = 4000) => {
    const id = Date.now();
    setToasts(t => [...t, { id, type, message }]);
    setTimeout(() => remove(id), duration);
  }, [remove]);

  const success = useCallback((msg: string) => add(msg, 'success'), [add]);
  const error   = useCallback((msg: string) => add(msg, 'error'),   [add]);

  return { toasts, remove, success, error };
}
