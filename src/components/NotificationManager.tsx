import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { X } from 'lucide-react';
import { useEffect, useRef } from 'react';

interface Notification {
  id: string;
  message: string;
}

interface NotificationContextType {
  showNotification: (message: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

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

  return (
    <div
      className={`notification-item ${isVisible ? 'notification-item-enter' : ''}`}
      onMouseEnter={() => setIsTimerActive(false)}
      onMouseLeave={() => setIsTimerActive(true)}
    >
      <div className="relative bg-gray-800 text-white border border-gray-700 shadow-2xl rounded-lg p-4 pr-8 min-h-[100px] w-[260px] flex items-start">
        <div className="text-sm leading-relaxed break-words pr-4 flex-1">
          {notification.message}
        </div>
        <CircularTimer 
          isActive={isTimerActive}
          onComplete={handleComplete}
        />
        <button
          onClick={handleDismiss}
          className="absolute -top-2 -right-2 w-5 h-5 flex items-center justify-center rounded-full bg-gray-700 hover:bg-gray-600 transition-colors z-20 border-2 border-gray-800 shadow-lg"
          aria-label="Chiudi notifica"
        >
          <X className="w-3 h-3 text-white" />
        </button>
      </div>
    </div>
  );
};

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const showNotification = useCallback((message: string) => {
    const id = `notification-${Date.now()}-${Math.random()}`;
    setNotifications(prev => [...prev, { id, message }]);
  }, []);

  const dismissNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

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
