import React, { useEffect } from 'react';
import ReactDOM from 'react-dom';

export default function ModalPortal({ isOpen, children, onClose }) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen || typeof document === 'undefined') return null;

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
      {/* Fullscreen backdrop blur with ZERO gap anywhere on screen */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      {/* Modal Box */}
      <div className="relative z-10 w-full flex justify-center animate-in fade-in zoom-in-95 duration-150">
        {children}
      </div>
    </div>,
    document.body
  );
}
