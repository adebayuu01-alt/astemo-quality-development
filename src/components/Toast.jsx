import React, { useEffect } from 'react';
import ReactDOM from 'react-dom';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';

export default function Toast({
  type = 'success',
  title,
  message,
  onClose,
  duration = 3500
}) {
  useEffect(() => {
    if (duration) {
      const timer = setTimeout(() => {
        onClose?.();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const isSuccess = type === 'success';

  if (typeof document === 'undefined') return null;

  return ReactDOM.createPortal(
    <div
      className={`fixed top-6 right-6 z-[9999] flex items-start gap-3 w-96 p-4 rounded-lg border shadow-lg transition-all duration-300 animate-in fade-in slide-in-from-top-4 ${
        isSuccess
          ? 'bg-[#EAF8F1] border-[#00A854] text-[#00A854]'
          : 'bg-[#FFF2F0] border-[#FF4D4F] text-[#FF4D4F]'
      }`}
    >
      <div className="mt-0.5 flex-shrink-0">
        {isSuccess ? (
          <CheckCircle2 className="w-5 h-5 text-[#00A854]" />
        ) : (
          <AlertCircle className="w-5 h-5 text-[#FF4D4F]" />
        )}
      </div>

      <div className="flex-1">
        <h4 className="text-sm font-semibold">{title}</h4>
        {message && <p className="text-xs mt-0.5 text-gray-600 leading-relaxed">{message}</p>}
      </div>

      <button
        onClick={onClose}
        className="text-gray-400 hover:text-gray-600 transition-colors p-1"
      >
        <X className="w-4 h-4" />
      </button>
    </div>,
    document.body
  );
}
