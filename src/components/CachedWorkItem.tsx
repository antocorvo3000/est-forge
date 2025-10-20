import { forwardRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2, RotateCcw, Info } from "lucide-react";
import { Button } from "./ui/button";
import { Checkbox } from "./ui/checkbox";
import { format } from "date-fns";

interface CachedWork {
  id: string;
  numero?: number;
  anno?: number;
  oggetto?: string;
  tipo_operazione: string;
  preventivo_originale_id?: string;
  righe: any[];
  dati_cliente: any;
  totale?: number;
  aggiornato_il: string;
}

interface CachedWorkItemProps {
  work: CachedWork;
  index: number;
  onRecover: (work: CachedWork) => void;
  onDelete: (id: string) => void;
  onInfo: (work: CachedWork) => void;
  fontSize?: number;
  isSelectionMode?: boolean;
  isSelected?: boolean;
  onSelect?: () => void;
  showInfo?: boolean;
  onInfoToggle?: () => void;
  onMouseLeave?: () => void;
}

const getTipoOperazioneLabel = (tipo: string) => {
  switch (tipo) {
    case 'creazione': return 'Creazione';
    case 'modifica': return 'Modifica';
    case 'clonazione': return 'Clonazione';
    default: return tipo;
  }
};

export const CachedWorkItem = forwardRef<HTMLDivElement, CachedWorkItemProps>(
  ({ work, index, onRecover, onDelete, onInfo, fontSize = 1, isSelectionMode = false, isSelected = false, onSelect, showInfo = false, onInfoToggle, onMouseLeave }, ref) => {
  const formatQuoteNumber = (num?: number) => {
    if (!num) return '00';
    return num.toString().padStart(2, '0');
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const displayTitle = work.numero && work.anno 
    ? `${formatQuoteNumber(work.numero)}-${work.anno} ${work.dati_cliente?.name || 'Cliente sconosciuto'}`
    : `Senza numero e anno - ${work.dati_cliente?.name || 'Cliente sconosciuto'}`;

  const displaySubtitle = work.dati_cliente?.city 
    ? `${work.dati_cliente.city}${work.dati_cliente.province ? ` (${work.dati_cliente.province})` : ''}`
    : 'Città non disponibile';

  return (
    <motion.div
      layout
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
      className="group grid grid-cols-[auto_auto_minmax(0,1fr)_minmax(0,2fr)] gap-2 sm:gap-3 p-3 sm:p-4 bg-white border border-border rounded-xl shadow-sm hover:shadow-md hover:border-border ease-out"
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
        if (onMouseLeave) onMouseLeave();
      }}
      ref={ref}
    >
      <motion.div
        layout
        initial={false}
        animate={{ 
          opacity: isSelectionMode ? 1 : 0,
          scale: isSelectionMode ? 1 : 0.5,
          width: isSelectionMode ? 'auto' : 0,
          marginRight: isSelectionMode ? undefined : 0
        }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        className="flex items-center justify-center overflow-hidden"
      >
        {isSelectionMode && (
          <Checkbox
            checked={isSelected}
            onCheckedChange={onSelect}
            className="w-5 h-5"
          />
        )}
      </motion.div>
      <div className="w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center rounded-xl bg-gradient-to-br from-orange-500/10 to-orange-500/5 border-2 border-orange-500/20">
        <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6 sm:w-7 sm:h-7">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" 
                stroke="hsl(30 100% 50%)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="hsl(30 100% 50% / 0.1)"/>
          <path d="M14 2v6h6" 
                stroke="hsl(30 100% 50%)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M16 13H8M16 17H8M10 9H8" 
                stroke="hsl(30 100% 50%)" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      </div>

      <div className="min-w-0 flex flex-col gap-1 justify-center">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="font-bold text-base sm:text-lg tracking-tight" style={{ fontSize: `${fontSize}rem` }}>
            {displayTitle}
          </h3>
          <span className="text-xs px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-600 font-medium">
            {getTipoOperazioneLabel(work.tipo_operazione)}
          </span>
        </div>
        <p className="text-sm text-muted-foreground truncate" style={{ fontSize: `${fontSize * 0.875}rem` }}>
          {displaySubtitle}
        </p>
        <p className="text-xs text-muted-foreground">
          Ultimo salvataggio: {format(new Date(work.aggiornato_il), 'dd/MM/yyyy HH:mm')}
        </p>
      </div>

      <div className="flex items-center justify-end gap-3 sm:gap-4 min-w-0">
        <AnimatePresence mode="wait">
          {!isSelectionMode && !showInfo && (
            <motion.div
              key="buttons"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
              className="flex items-center gap-1 sm:gap-2 flex-shrink-0"
              style={{ fontSize: `${fontSize}rem` }}
            >
              <Button
                size="sm"
                onClick={onInfoToggle}
                className="h-8 sm:h-9 px-2 sm:px-3 gap-1.5 bg-blue-600 text-white hover:brightness-110"
              >
                <Info className="w-4 h-4" />
                <span className="hidden sm:inline text-xs font-semibold">Info</span>
              </Button>
              <Button
                size="sm"
                onClick={() => onRecover(work)}
                className="h-8 sm:h-9 px-2 sm:px-3 gap-1.5 bg-green-600 text-white hover:brightness-110"
              >
                <RotateCcw className="w-4 h-4" />
                <span className="hidden sm:inline text-xs font-semibold">Recupera</span>
              </Button>
              <Button
                size="sm"
                onClick={() => onDelete(work.id)}
                className="h-8 sm:h-9 px-2 sm:px-3 gap-1.5 bg-destructive text-white hover:brightness-110"
              >
                <Trash2 className="w-4 h-4" />
                <span className="hidden sm:inline text-xs font-semibold">Elimina</span>
              </Button>
            </motion.div>
          )}

          {!isSelectionMode && showInfo && (
            <motion.div
              key="info"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
              className="flex items-center gap-3 sm:gap-4 min-w-0 w-full"
              style={{ fontSize: `${fontSize}rem` }}
            >
              <p className="text-sm font-semibold text-primary line-clamp-2 break-all overflow-hidden flex-1 min-w-0">
                {work.oggetto || 'Nessun oggetto'}
              </p>
              {work.totale !== undefined && (
                <p className="text-sm font-bold text-foreground whitespace-nowrap flex-shrink-0">
                  {formatCurrency(work.totale)}
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
});

CachedWorkItem.displayName = "CachedWorkItem";
