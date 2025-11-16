import React, { useEffect } from 'react';
import Button from './Button.jsx';
import { cn } from '../../utils/format.js';

const Modal = ({
  open,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onClose,
  confirmVariant = 'primary',
  children
}) => {
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose?.();
      }
    };

    if (open) {
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 px-4 py-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl focus:outline-none focus-visible:ring-4 focus-visible:ring-brand-accent">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="modal-title" className="text-lg font-semibold text-brand-text">
              {title}
            </h2>
            {description ? <p className="mt-1 text-sm text-slate-600">{description}</p> : null}
          </div>
          <button
            type="button"
            className="rounded-full p-1 text-slate-500 transition hover:bg-slate-100 hover:text-brand-primary"
            onClick={onClose}
            aria-label="Close dialog"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="h-5 w-5"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {children ? <div className="mt-4">{children}</div> : null}

        <div className={cn('mt-6 flex flex-wrap items-center justify-end gap-3')}>
          <Button variant="secondary" onClick={onClose}>
            {cancelText}
          </Button>
          <Button variant={confirmVariant} onClick={onConfirm}>
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Modal;
