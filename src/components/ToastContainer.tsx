import React from 'react';
import { ToastMessage } from '../types';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

interface ToastContainerProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onDismiss }) => {
  return (
    <div className="fixed top-3 right-3 sm:top-5 sm:right-5 z-[150] space-y-3 pointer-events-none w-[92%] sm:w-auto max-w-md mx-auto left-0 sm:left-auto">
      {toasts.map((toast) => {
        const isSuccess = toast.type === 'success';
        const isError = toast.type === 'error';

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto px-5 py-3.5 rounded-2xl shadow-2xl font-semibold text-sm flex items-center justify-between gap-3 backdrop-blur-md border transition-all duration-300 transform translate-y-0 ${
              isSuccess
                ? 'bg-emerald-500/95 text-zinc-950 border-emerald-400 shadow-emerald-500/20'
                : isError
                ? 'bg-red-500/95 text-white border-red-400 shadow-red-500/20'
                : 'bg-zinc-800/95 text-white border-zinc-700 shadow-black/40'
            }`}
          >
            <div className="flex items-center gap-2.5">
              {isSuccess && <CheckCircle2 className="w-5 h-5 flex-shrink-0" />}
              {isError && <AlertCircle className="w-5 h-5 flex-shrink-0" />}
              {!isSuccess && !isError && <Info className="w-5 h-5 flex-shrink-0" />}
              <span className="leading-snug">{toast.message}</span>
            </div>
            <button
              onClick={() => onDismiss(toast.id)}
              className="opacity-70 hover:opacity-100 transition p-1"
              title="Cerrar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
