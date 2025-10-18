import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { X } from 'lucide-react';
import { useEffect } from 'react';

interface NotificationAction {
  label: string;
  onClick: () => void;
}

interface Notification {
  id: string;
  message: string;
  action?: NotificationAction;
}

interface NotificationContextType {
  showNotification: (message: string, action?: NotificationAction) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// Variabile globale per accedere al context dall'esterno
let globalShowNotification: ((message: string, action?: NotificationAction) => void) | null = null;

const CircularTimer = ({ 
  isActive,
  onComplete
}: { 
  isActive: boolean;
  onComplete: () => void;
}) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!isActive) {
      setProgress(0);
      return;
    }

    const duration = 5000;
    const startTime = Date.now();
    
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const newProgress = Math.min((elapsed / duration) * 100, 100);
      setProgress(newProgress);
      
      if (newProgress >= 100) {
        onComplete();
      }
    }, 16);

    return () => clearInterval(interval);
  }, [isActive, onComplete]);

  const radius = 6;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <svg width="16" height="16" className="absolute top-2 right-2 -rotate-90 pointer-events-none z-10">
      <circle
        cx="8"
        cy="8"
        r={radius}
        stroke="white"
        strokeWidth="1.5"
        fill="none"
        opacity="0.3"
      />
      <circle
        cx="8"
        cy="8"
        r={radius}
        stroke="#1f2937"
        strokeWidth="1.5"
        fill="none"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        style={{ strokeLinecap: 'round' }}
      />
    </svg>
  );
};

interface NotificationItemProps {
  notification: Notification;
  onDismiss: (id: string) => void;
}

const NotificationItem = ({ notification, onDismiss }: NotificationItemProps) => {
  const [isTimerActive, setIsTimerActive] = useState(true);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Trigger slide-in animation
    setTimeout(() => setIsVisible(true), 10);
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(() => {
      onDismiss(notification.id);
    }, 300);
  };

  const handleComplete = () => {
    handleDismiss();
  };

  const handleAction = () => {
    if (notification.action) {
      notification.action.onClick();
      handleDismiss();
    }
  };

  return (
    <div
      className={`notification-item ${isVisible ? 'notification-item-enter' : ''}`}
      onMouseEnter={() => setIsTimerActive(false)}
      onMouseLeave={() => setIsTimerActive(true)}
    >
      <div className="relative bg-gray-800 text-white border border-gray-700 shadow-2xl rounded-lg p-4 pr-10 min-h-[100px] w-[260px] flex flex-col">
        <div className="text-sm leading-relaxed break-words pr-2 flex-1">
          {notification.message}
        </div>
        {notification.action && (
          <button
            onClick={handleAction}
            className="mt-3 w-full bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded transition-colors text-sm"
          >
            {notification.action.label}
          </button>
        )}
        <CircularTimer 
          isActive={isTimerActive}
          onComplete={handleComplete}
        />
        <button
          onClick={handleDismiss}
          className="absolute -top-2.5 -right-2.5 w-6 h-6 flex items-center justify-center rounded-full bg-gray-700 hover:bg-gray-600 transition-colors z-20 border-2 border-gray-800 shadow-lg"
          aria-label="Chiudi notifica"
        >
          <X className="w-3.5 h-3.5 text-white" />
        </button>
      </div>
    </div>
  );
};

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const showNotification = useCallback((message: string, action?: NotificationAction) => {
    const id = `notification-${Date.now()}-${Math.random()}`;
    setNotifications(prev => [...prev, { id, message, action }]);
  }, []);

  const dismissNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  // Rendi la funzione disponibile globalmente
  useEffect(() => {
    globalShowNotification = showNotification;
    return () => {
      globalShowNotification = null;
    };
  }, [showNotification]);

  return (
    <NotificationContext.Provider value={{ showNotification }}>
      {children}
      <div className="notification-container">
        {notifications.map((notification) => (
          <NotificationItem
            key={notification.id}
            notification={notification}
            onDismiss={dismissNotification}
          />
        ))}
      </div>
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within NotificationProvider');
  }
  return context;
};

// API compatibile con il vecchio sistema toast
export const toast = {
  success: (message: string, options?: { action?: NotificationAction }) => {
    if (globalShowNotification) {
      globalShowNotification(message, options?.action);
    }
  },
  error: (message: string, options?: { action?: NotificationAction }) => {
    if (globalShowNotification) {
      globalShowNotification(message, options?.action);
    }
  },
  info: (message: string, options?: { action?: NotificationAction }) => {
    if (globalShowNotification) {
      globalShowNotification(message, options?.action);
    }
  },
  warning: (message: string, options?: { action?: NotificationAction }) => {
    if (globalShowNotification) {
      globalShowNotification(message, options?.action);
    }
  },
};
