import { useTheme } from "next-themes";
import { Toaster as Sonner, toast as sonnerToast } from "sonner";
import { X } from "lucide-react";
import { useEffect, useState } from "react";

type ToasterProps = React.ComponentProps<typeof Sonner>;

interface CustomToastProps {
  message: string;
  toastId: string | number;
  onDismiss: () => void;
}

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

const CustomToast = ({ message, toastId, onDismiss }: CustomToastProps) => {
  const [isTimerActive, setIsTimerActive] = useState(true);

  return (
    <div
      onMouseEnter={() => setIsTimerActive(false)}
      onMouseLeave={() => setIsTimerActive(true)}
      className="relative bg-gray-800 text-white border border-gray-700 shadow-xl rounded-lg p-4 pr-8 min-h-[100px] w-[260px]"
    >
      <div className="text-sm leading-relaxed break-words pr-4">
        {message}
      </div>
      <CircularTimer 
        isActive={isTimerActive}
        onComplete={onDismiss}
      />
      <button
        onClick={onDismiss}
        className="absolute -top-2 -right-2 w-5 h-5 flex items-center justify-center rounded-full bg-gray-700 hover:bg-gray-600 transition-colors z-20 border-2 border-gray-800"
        aria-label="Chiudi notifica"
      >
        <X className="w-3 h-3 text-white" />
      </button>
    </div>
  );
};

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      position="top-right"
      offset={12}
      duration={Infinity}
      visibleToasts={20}
      gap={10}
      expand={false}
      richColors={false}
      closeButton={false}
      style={{
        right: '12px',
        top: '80px',
      }}
      toastOptions={{
        unstyled: true,
        className: "toast-slide-in-from-right",
      }}
      {...props}
    />
  );
};

const toast = (message: string) => {
  const toastId = sonnerToast.custom(
    (t) => (
      <CustomToast 
        message={message} 
        toastId={t}
        onDismiss={() => sonnerToast.dismiss(t)}
      />
    ),
    {
      duration: Infinity,
    }
  );
  
  return toastId;
};

export { Toaster, toast };
