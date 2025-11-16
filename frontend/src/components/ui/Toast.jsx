import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from 'react';

const ToastContext = createContext({ addToast: () => {} });
let toastIdCounter = 0;

const ToastItem = ({ toast, onDismiss }) => {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.id), toast.duration);
    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, onDismiss]);

  const borderClass =
    toast.variant === 'success'
      ? 'border-brand-success'
      : toast.variant === 'error'
      ? 'border-brand-error'
      : 'border-indigo-200';

  return (
    <div
      className={`pointer-events-auto w-full max-w-md rounded-xl border ${borderClass} bg-white p-4 shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-2`}
      role="status"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-semibold text-brand-text">{toast.title}</p>
          {toast.description ? (
            <p className="mt-1 text-sm text-slate-600">{toast.description}</p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={() => onDismiss(toast.id)}
          className="ml-4 text-slate-500 transition-colors hover:text-brand-primary"
          aria-label="Dismiss notification"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            className="h-5 w-5"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const addToast = useCallback(
    ({ title, description, variant = 'info', duration = 5000 }) => {
      toastIdCounter += 1;
      const id = toastIdCounter;
      setToasts((prev) => [...prev, { id, title, description, variant, duration }]);
      return id;
    },
    []
  );

  const contextValue = useMemo(
    () => ({
      addToast,
      removeToast
    }),
    [addToast, removeToast]
  );

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <div
        aria-live="assertive"
        className="pointer-events-none fixed inset-x-0 top-4 z-50 flex flex-col items-center space-y-3 px-4"
      >
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onDismiss={removeToast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => useContext(ToastContext);
