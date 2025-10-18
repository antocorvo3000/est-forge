import { useTheme } from "next-themes";
import { Toaster as Sonner, toast } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      position="top-right"
      offset="80px"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-gray-800 group-[.toaster]:text-white group-[.toaster]:border-gray-700 group-[.toaster]:shadow-lg group-[.toaster]:rounded-lg group-[.toaster]:max-w-[380px]",
          description: "group-[.toast]:text-white/90 group-[.toast]:break-words",
          actionButton: "group-[.toast]:bg-white/20 group-[.toast]:text-white group-[.toast]:hover:bg-white/30",
          cancelButton: "group-[.toast]:bg-white/10 group-[.toast]:text-white/70 group-[.toast]:hover:bg-white/20",
          success: "group-[.toast]:text-white",
          error: "group-[.toast]:text-white",
          info: "group-[.toast]:text-white",
          warning: "group-[.toast]:text-white",
        },
      }}
      {...props}
    />
  );
};

export { Toaster, toast };
