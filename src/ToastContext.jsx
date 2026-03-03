import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

const ToastContext = createContext({});

export const useToast = () => useContext(ToastContext);

function ToastItem({ toast: t, onRemove }) {
  const [visible, setVisible] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));

    if (t.duration) {
      timerRef.current = setTimeout(() => {
        setVisible(false);
        setTimeout(() => onRemove(t.id), 300);
      }, t.duration);
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [t.id, t.duration, onRemove]);

  const handleClose = () => {
    setVisible(false);
    setTimeout(() => onRemove(t.id), 300);
  };

  const config = {
    success: { border: 'border-emerald-500/30', icon: CheckCircle, iconColor: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    error:   { border: 'border-red-500/30',     icon: AlertCircle, iconColor: 'text-red-400',     bg: 'bg-red-500/10' },
    warning: { border: 'border-amber-500/30',    icon: AlertCircle, iconColor: 'text-amber-400',   bg: 'bg-amber-500/10' },
    info:    { border: 'border-blue-500/30',     icon: Info,        iconColor: 'text-blue-400',    bg: 'bg-blue-500/10' },
  }[t.type] || config.info;

  const Icon = config.icon;

  return (
    <div
      className={`flex items-start gap-3 p-4 rounded-2xl border backdrop-blur-xl bg-[var(--bg-modal)] shadow-2xl max-w-sm transition-all duration-300 ${config.border} ${visible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'}`}
    >
      <div className={`${config.bg} p-1.5 rounded-lg flex-shrink-0`}>
        <Icon size={16} className={config.iconColor} />
      </div>
      <p className="text-sm text-[var(--text-primary)] flex-1 leading-relaxed">{t.message}</p>
      <button onClick={handleClose} className="text-[var(--text-muted)] hover:text-[var(--text-primary)] flex-shrink-0 transition-colors">
        <X size={14} />
      </button>
    </div>
  );
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const addToast = useCallback(({ type, message, duration }) => {
    const id = Date.now() + Math.random();
    setToasts(prev => {
      const next = [...prev, { id, type, message, duration }];
      return next.length > 5 ? next.slice(-5) : next;
    });
  }, []);

  const toast = {
    success: (message) => addToast({ type: 'success', message, duration: 3000 }),
    error:   (message) => addToast({ type: 'error',   message, duration: null }),
    warning: (message) => addToast({ type: 'warning', message, duration: 5000 }),
    info:    (message) => addToast({ type: 'info',    message, duration: 4000 }),
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed top-4 left-4 right-4 sm:left-auto z-[100] flex flex-col gap-2 pointer-events-none">
        {toasts.map(t => (
          <div key={t.id} className="pointer-events-auto">
            <ToastItem toast={t} onRemove={removeToast} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
