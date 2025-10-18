import { useTheme } from "next-themes";
import { Toaster as Sonner, toast as sonnerToast } from "sonner";
import { X } from "lucide-react";
import { useEffect, useState, useRef } from "react";

type ToasterProps = React.ComponentProps<typeof Sonner>;

interface CustomToastProps {
  message: string;
  toastId: string | number;
  onDismiss: () => void;
}

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
    <svg width="16" height="16" className="absolute top-2 right-2 -rotate-90 pointer-events-none">
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

const CustomToast = ({ message, toastId, onDismiss }: CustomToastProps) => {
  const [isPaused, setIsPaused] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (!isPaused) {
      timeoutRef.current = setTimeout(() => {
        onDismiss();
      }, 5000);
    } else {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isPaused, onDismiss]);

  return (
    <div
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className="relative bg-gray-800 text-white border border-gray-700 shadow-lg rounded-lg p-4 pr-10 min-h-[80px] w-[280px]"
    >
      <div className="text-sm leading-relaxed break-words">
        {message}
      </div>
      <CircularTimer 
        duration={5000} 
        isPaused={isPaused}
      />
      <button
        onClick={onDismiss}
        className="absolute top-2 right-7 w-4 h-4 flex items-center justify-center rounded-full bg-gray-700 hover:bg-gray-600 transition-colors z-10"
        aria-label="Chiudi notifica"
      >
        <X className="w-2.5 h-2.5 text-white" />
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
      offset="16px"
      duration={Infinity}
      visibleToasts={20}
      gap={8}
      toastOptions={{
        unstyled: true,
        className: "toast-slide-in",
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
