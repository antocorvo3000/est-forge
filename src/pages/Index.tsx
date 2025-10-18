import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Settings, FileEdit } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { CompanyHeader } from "@/components/CompanyHeader";
import { SearchBar } from "@/components/SearchBar";
import { QuoteItem } from "@/components/QuoteItem";
import { QuoteModal } from "@/components/QuoteModal";
import { DeleteConfirmDialog } from "@/components/DeleteConfirmDialog";
import { Button } from "@/components/ui/button";
import { useQuotes } from "@/hooks/useQuotes";
import { useCompanySettings } from "@/hooks/useCompanySettings";
import { toast } from "sonner";
import type { Quote } from "@/types/quote";

// Hook per debouncing
function useDebounce(value: string, delay: number) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

const Index = () => {
  const navigate = useNavigate();
  const { quotes, addQuote, updateQuote, deleteQuote } = useQuotes();
  const { settings } = useCompanySettings();
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 150);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingQuote, setEditingQuote] = useState<Quote | undefined>();
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    quote?: Quote;
  }>({ open: false });

  const filteredQuotes = useMemo(() => {
    const query = debouncedSearch.toLowerCase().trim();
    if (!query) return quotes;

    return quotes.filter(
      (q) => {
        const quoteNumber = `${q.number?.toString().padStart(2, '0')}-${q.year}`;
        return (
          q.title?.toLowerCase().includes(query) ||
          q.client?.toLowerCase().includes(query) ||
          q.clientAddress?.toLowerCase().includes(query) ||
          quoteNumber.includes(query) ||
          q.id?.toLowerCase().includes(query)
        );
      }
    );
  }, [quotes, debouncedSearch]);

  const handleNewQuote = () => {
    navigate("/create-quote");
  };

  const handleCustomQuote = () => {
    navigate("/custom-quote-number");
  };

  const handleEditQuote = (quote: Quote) => {
    navigate(`/modify-quote/${quote.id}`, { state: { quote } });
  };

  const handleDeleteClick = (quote: Quote) => {
    setDeleteDialog({ open: true, quote });
  };

  const handleDeleteConfirm = async () => {
    if (deleteDialog.quote) {
      try {
        await deleteQuote(deleteDialog.quote.id);
        toast.success("Preventivo eliminato con successo");
        setDeleteDialog({ open: false });
      } catch (error) {
        toast.error("Errore durante l'eliminazione");
      }
    }
  };

  const handleSaveQuote = (data: any) => {
    if (editingQuote) {
      updateQuote(editingQuote.id, data);
      toast.success("Preventivo aggiornato con successo");
    } else {
      addQuote(data);
      toast.success("Preventivo creato con successo");
    }
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 sm:py-6 w-full flex-1 flex flex-col gap-3 sm:gap-4 overflow-hidden">
        <CompanyHeader />

        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass rounded-2xl p-3 sm:p-4 grid sm:grid-cols-[1fr_auto] gap-3 items-center mx-4 sm:mx-6"
        >
          <SearchBar value={searchQuery} onChange={setSearchQuery} />
          <Button
            onClick={handleNewQuote}
            className="h-10 sm:h-11 gap-2 font-bold"
          >
            <Plus className="w-5 h-5" strokeWidth={2.4} />
            <span className="hidden sm:inline">Nuovo preventivo</span>
            <span className="sm:hidden">Nuovo</span>
          </Button>
        </motion.section>

        <motion.main
          initial={{ opacity: 0, y: 10 }}
          animate={{ 
            opacity: 1, 
            y: 0,
            transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] }
          }}
          className="glass rounded-2xl p-3 sm:p-4 mx-4 sm:mx-6 flex-1 overflow-hidden flex flex-col"
          style={{
            willChange: 'auto'
          }}
        >
          <motion.div 
            className="space-y-2 sm:space-y-3 overflow-y-auto scrollbar-thin pr-2 flex-1"
            layout
            transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
          >
            {filteredQuotes.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="text-center py-12 text-muted-foreground"
              >
                {searchQuery
                  ? "Nessun preventivo trovato"
                  : "Nessun preventivo presente. Creane uno nuovo!"}
              </motion.div>
            ) : (
              <AnimatePresence mode="popLayout">
                {filteredQuotes.map((quote, index) => (
                  <QuoteItem
                    key={quote.id}
                    quote={quote}
                    index={index}
                    onEdit={handleEditQuote}
                    onDelete={() => handleDeleteClick(quote)}
                    fontSize={settings.fontSizeList}
                  />
                ))}
              </AnimatePresence>
            )}
          </motion.div>
        </motion.main>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
          className="flex justify-between mx-4 sm:mx-6 mt-3"
        >
          <Button
            onClick={handleCustomQuote}
            className="h-11 gap-2 shadow-lg"
          >
            <FileEdit className="w-5 h-5" />
            <span>Nuovo Preventivo Personalizzato</span>
          </Button>
          
          <Button
            onClick={() => navigate("/settings")}
            className="h-11 gap-2 shadow-lg"
          >
            <Settings className="w-5 h-5" />
            <span>Impostazioni</span>
          </Button>
        </motion.div>
      </div>

      <QuoteModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveQuote}
        quote={editingQuote}
      />

      <DeleteConfirmDialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false })}
        onConfirm={handleDeleteConfirm}
        quoteName={deleteDialog.quote?.title || ""}
      />
    </div>
  );
};

export default Index;
