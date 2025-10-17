import { motion } from "framer-motion";
import { Pencil, Trash2 } from "lucide-react";
import type { Quote } from "@/types/quote";
import { Button } from "./ui/button";

interface QuoteItemProps {
  quote: Quote;
  index: number;
  onEdit: (quote: Quote) => void;
  onDelete: (id: string) => void;
}

export const QuoteItem = ({ quote, index, onEdit, onDelete }: QuoteItemProps) => {
  const formatQuoteNumber = (num?: number) => {
    if (!num) return '00';
    return num.toString().padStart(2, '0');
  };

  const displayYear = quote.year || new Date(quote.date).getFullYear();
  const displayAddress = quote.clientAddress || 'Indirizzo non disponibile';

  return (
    <motion.div
      layout="position"
      initial={{ opacity: 0, y: 8 }}
      animate={{ 
        opacity: 1, 
        y: 0,
        transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] }
      }}
      exit={{ 
        opacity: 0,
        transition: { duration: 0.2, ease: [0.4, 0, 0.2, 1] }
      }}
      transition={{
        layout: { duration: 0.3, ease: [0.4, 0, 0.2, 1] }
      }}
      className="group grid grid-cols-[auto_1fr_auto] gap-3 sm:gap-4 p-3 sm:p-4 bg-white border border-border rounded-xl shadow-sm hover:shadow-md hover:border-border ease-out"
      style={{
        background: 'white',
        transition: 'background 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        willChange: 'auto'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'linear-gradient(135deg, hsl(210 15% 88%), hsl(210 12% 85%))';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'white';
      }}
    >
      <div className="w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border-2 border-primary/20">
        <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6 sm:w-7 sm:h-7">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" 
                stroke="hsl(var(--primary))" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="hsl(var(--primary) / 0.1)"/>
          <path d="M14 2v6h6" 
                stroke="hsl(var(--primary))" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M16 13H8M16 17H8M10 9H8" 
                stroke="hsl(var(--primary))" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      </div>

      <div className="min-w-0 flex flex-col gap-1 justify-center">
        <h3 className="font-bold text-base sm:text-lg tracking-tight">
          {formatQuoteNumber(quote.number)}-{displayYear} {quote.client}
        </h3>
        <p className="text-sm text-muted-foreground truncate">
          {displayAddress}
        </p>
      </div>

      <div className="flex items-center gap-1 sm:gap-2">
        <Button
          size="sm"
          onClick={() => onEdit(quote)}
          className="h-8 sm:h-9 px-2 sm:px-3 gap-1.5 bg-primary text-white hover:brightness-110"
        >
          <Pencil className="w-4 h-4" />
          <span className="hidden sm:inline text-xs font-semibold">Modifica</span>
        </Button>
        <Button
          size="sm"
          onClick={() => onDelete(quote.id)}
          className="h-8 sm:h-9 px-2 sm:px-3 gap-1.5 bg-destructive text-white hover:brightness-110"
        >
          <Trash2 className="w-4 h-4" />
          <span className="hidden sm:inline text-xs font-semibold">Elimina</span>
        </Button>
      </div>
    </motion.div>
  );
};
