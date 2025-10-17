import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { CompanyHeader } from "@/components/CompanyHeader";
import { SearchBar } from "@/components/SearchBar";
import { QuoteItem } from "@/components/QuoteItem";
import { QuoteModal } from "@/components/QuoteModal";
import { DeleteConfirmDialog } from "@/components/DeleteConfirmDialog";
import { Button } from "@/components/ui/button";
import { useQuotes } from "@/hooks/useQuotes";
import { toast } from "sonner";
import type { Quote } from "@/types/quote";

const Index = () => {
  const navigate = useNavigate();
  const { quotes, addQuote, updateQuote, deleteQuote } = useQuotes();
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingQuote, setEditingQuote] = useState<Quote | undefined>();
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    quote?: Quote;
  }>({ open: false });

  const filteredQuotes = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
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
  }, [quotes, searchQuery]);

  const handleNewQuote = () => {
    setEditingQuote(undefined);
    setIsModalOpen(true);
  };

  const handleEditQuote = (quote: Quote) => {
    setEditingQuote(quote);
    setIsModalOpen(true);
  };

  const handleDeleteClick = (quote: Quote) => {
    setDeleteDialog({ open: true, quote });
  };

  const handleDeleteConfirm = () => {
    if (deleteDialog.quote) {
      deleteQuote(deleteDialog.quote.id);
      toast.success("Preventivo eliminato con successo");
      setDeleteDialog({ open: false });
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
    <div className="min-h-screen overflow-x-hidden">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 sm:py-6 pb-16 space-y-3 sm:space-y-4">
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
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass rounded-2xl p-3 sm:p-4 mx-4 sm:mx-6"
        >
          <div className="space-y-2 sm:space-y-3 max-h-[calc(70px*5+0.75rem*4)] overflow-y-auto scrollbar-thin pr-1">
            {filteredQuotes.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
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
                  />
                ))}
              </AnimatePresence>
            )}
          </div>
        </motion.main>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
          className="flex justify-end mx-4 sm:mx-6 mt-3"
        >
          <Button
            size="icon"
            onClick={() => navigate("/settings")}
            className="h-12 w-12 rounded-full shadow-lg"
          >
            <Settings className="w-5 h-5" />
          </Button>
        </motion.div>

        <div className="h-12" aria-hidden="true" />
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
