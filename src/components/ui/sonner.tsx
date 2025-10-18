import { useTheme } from "next-themes";
import { Toaster as Sonner, toast as sonnerToast } from "sonner";
import { X } from "lucide-react";
import { useEffect, useState, useRef } from "react";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const CircularTimer = ({ 
  duration, 
  isPaused
}: { 
  duration: number; 
  isPaused: boolean;
}) => {
  const [progress, setProgress] = useState(0);
  const startTimeRef = useRef<number>(Date.now());
  const accumulatedTimeRef = useRef<number>(0);

  useEffect(() => {
    if (isPaused) {
      accumulatedTimeRef.current += Date.now() - startTimeRef.current;
      return;
    }

    startTimeRef.current = Date.now();
    const interval = setInterval(() => {
      const elapsed = accumulatedTimeRef.current + (Date.now() - startTimeRef.current);
      const newProgress = Math.min((elapsed / duration) * 100, 100);
      setProgress(newProgress);
    }, 16);

    return () => clearInterval(interval);
  }, [duration, isPaused]);

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
        className="transition-all duration-100"
        style={{ strokeLinecap: 'round' }}
      />
    </svg>
  );
};

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();
  const [pausedToasts, setPausedToasts] = useState<Set<string | number>>(new Set());

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      position="top-right"
      offset={16}
      duration={5000}
      visibleToasts={20}
      gap={8}
      richColors={false}
      toastOptions={{
        classNames: {
          toast: "bg-gray-800 text-white border border-gray-700 shadow-lg rounded-lg p-4 pr-10 min-h-[80px] w-[280px] relative",
          title: "text-white text-sm font-medium",
          description: "text-white/90 break-words text-sm leading-relaxed pr-6",
          actionButton: "bg-white/20 text-white hover:bg-white/30 px-3 py-1 rounded text-sm transition-colors",
          cancelButton: "bg-white/10 text-white/70 hover:bg-white/20 px-3 py-1 rounded text-sm transition-colors",
          closeButton: "hidden",
        },
      }}
      {...props}
    />
  );
};

const toast = (message: string) => {
  let isPaused = false;
  let timeoutId: NodeJS.Timeout;
  
  const toastId = sonnerToast.custom(
    (t) => {
      const handleMouseEnter = () => {
        isPaused = true;
        if (timeoutId) clearTimeout(timeoutId);
      };

      const handleMouseLeave = () => {
        isPaused = false;
        timeoutId = setTimeout(() => {
          sonnerToast.dismiss(t);
        }, 5000);
      };

      const handleDismiss = () => {
        if (timeoutId) clearTimeout(timeoutId);
        sonnerToast.dismiss(t);
      };

      // Auto dismiss after 5 seconds
      if (!isPaused && !timeoutId) {
        timeoutId = setTimeout(() => {
          sonnerToast.dismiss(t);
        }, 5000);
      }

      return (
        <div
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          className="relative w-full"
        >
          <div className="text-sm leading-relaxed break-words pr-6">
            {message}
          </div>
          <CircularTimer 
            duration={5000} 
            isPaused={isPaused}
          />
          <button
            onClick={handleDismiss}
            className="absolute top-2 right-7 w-4 h-4 flex items-center justify-center rounded-full bg-gray-700 hover:bg-gray-600 transition-colors z-20"
            aria-label="Chiudi notifica"
          >
            <X className="w-2.5 h-2.5 text-white" />
          </button>
        </div>
      );
    },
    {
      duration: Infinity,
    }
  );
  
  return toastId;
};

export { Toaster, toast };
