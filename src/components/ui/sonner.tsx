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
  duration, 
  isPaused, 
  onComplete 
}: { 
  duration: number; 
  isPaused: boolean;
  onComplete: () => void;
}) => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (isPaused) return;

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
  }, [duration, isPaused, onComplete]);

  useEffect(() => {
    if (isPaused) {
      setProgress(0);
    }
  }, [isPaused]);

  const radius = 8;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <svg width="20" height="20" className="absolute top-3 right-3 -rotate-90 pointer-events-none">
      <circle
        cx="10"
        cy="10"
        r={radius}
        stroke="white"
        strokeWidth="2"
        fill="none"
        opacity="0.3"
      />
      <circle
        cx="10"
        cy="10"
        r={radius}
        stroke="#374151"
        strokeWidth="2"
        fill="none"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        className="transition-all duration-100"
        style={{ strokeLinecap: 'round' }}
      />
    </svg>
  );
};

const CustomToast = ({ message, toastId, onDismiss }: CustomToastProps) => {
  const [isPaused, setIsPaused] = useState(false);

  return (
    <div
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className="relative"
    >
      <div className="pr-8 text-sm leading-relaxed break-words">
        {message}
      </div>
      <CircularTimer 
        duration={5000} 
        isPaused={isPaused}
        onComplete={onDismiss}
      />
      <button
        onClick={onDismiss}
        className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors z-10"
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
      className="toaster group"
      position="top-right"
      offset="80px"
      duration={5000}
      visibleToasts={10}
      gap={12}
      toastOptions={{
        classNames: {
          toast: "group toast bg-gray-800 text-white border border-gray-700 shadow-lg rounded-lg p-4 min-h-[80px] w-[280px] toast-slide-in",
          title: "text-white text-sm font-medium",
          description: "text-white/90 break-words text-sm leading-relaxed",
          actionButton: "bg-white/20 text-white hover:bg-white/30 px-3 py-1 rounded text-sm transition-colors",
          cancelButton: "bg-white/10 text-white/70 hover:bg-white/20 px-3 py-1 rounded text-sm transition-colors",
          closeButton: "bg-white/10 hover:bg-white/20 text-white border-white/20",
        },
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
      duration: 5000,
    }
  );
  return toastId;
};

export { Toaster, toast };
