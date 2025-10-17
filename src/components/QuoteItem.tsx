import { motion } from "framer-motion";
import { FileText, Pencil, Trash2 } from "lucide-react";
import type { Quote } from "@/types/quote";
import { Button } from "./ui/button";

interface QuoteItemProps {
  quote: Quote;
  index: number;
  onEdit: (quote: Quote) => void;
  onDelete: (id: string) => void;
}

export const QuoteItem = ({ quote, index, onEdit, onDelete }: QuoteItemProps) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("it-IT", {
      style: "currency",
      currency: "EUR",
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("it-IT");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.995 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        delay: index * 0.03,
        duration: 0.3,
        ease: [0.2, 0.8, 0.2, 1],
      }}
      whileHover={{
        y: -2,
        transition: { duration: 0.2 },
      }}
      className="group grid grid-cols-[auto_1fr_auto] gap-2 sm:gap-3 p-2 sm:p-3 bg-white border border-border rounded-xl shadow-sm hover:shadow-md hover:border-primary/30 hover:bg-accent/50 transition-all duration-200"
    >
      <div className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-lg bg-accent border border-border">
        <FileText className="w-4 h-4 text-foreground/70" strokeWidth={1.4} />
      </div>

      <div className="min-w-0 flex flex-col gap-1">
        <h3 className="font-bold text-sm sm:text-base tracking-tight truncate">
          {quote.title}
        </h3>
        <p className="text-xs sm:text-sm text-muted-foreground truncate">
          {quote.id} • {quote.client} • {formatDate(quote.date)} • {formatCurrency(quote.amount)}
        </p>
      </div>

      <div className="flex items-center gap-1 sm:gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onEdit(quote)}
          className="h-8 sm:h-9 px-2 sm:px-3 gap-1.5 text-primary hover:bg-primary/10 hover:text-primary"
        >
          <Pencil className="w-4 h-4" />
          <span className="hidden sm:inline text-xs font-semibold">Modifica</span>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDelete(quote.id)}
          className="h-8 sm:h-9 px-2 sm:px-3 gap-1.5 text-destructive hover:bg-destructive/10 hover:text-destructive"
        >
          <Trash2 className="w-4 h-4" />
          <span className="hidden sm:inline text-xs font-semibold">Elimina</span>
        </Button>
      </div>
    </motion.div>
  );
};
