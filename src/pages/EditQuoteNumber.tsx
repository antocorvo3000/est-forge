import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useCompanySettings } from "@/hooks/useCompanySettings";
import { useQuotes } from "@/hooks/useQuotes";
import { aggiornaPreventivo } from "@/lib/database";
import { toast } from "@/lib/toast";

const EditQuoteNumber = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { settings } = useCompanySettings();
  const { quotes } = useQuotes();
  const quoteToEdit = location.state?.quote;
  
  const [quoteNumber, setQuoteNumber] = useState<string>("");
  const [quoteYear, setQuoteYear] = useState<string>("");
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!quoteToEdit) {
      navigate("/");
    } else {
      setQuoteNumber(quoteToEdit.number.toString());
      setQuoteYear(quoteToEdit.year.toString());
    }
  }, [quoteToEdit, navigate]);

  const handleSave = async () => {
    const num = parseInt(quoteNumber);
    const year = parseInt(quoteYear);
    
    if (isNaN(num) || num < 1) {
      setErrorMessage("Il numero del preventivo deve essere maggiore di 0");
      setShowErrorDialog(true);
      return;
    }
    
    if (isNaN(year) || year < 2000 || year > 2100) {
      setErrorMessage("L'anno deve essere compreso tra 2000 e 2100");
      setShowErrorDialog(true);
      return;
    }
    
    // Controlla se il nuovo numero/anno esiste già (escludendo il preventivo corrente)
    const exists = quotes.find((q) => q.number === num && q.year === year && q.id !== quoteToEdit.id);
    if (exists) {
      setErrorMessage(
        `Il preventivo ${num.toString().padStart(2, '0')}-${year} esiste già. Eliminare quello esistente per continuare o modificarlo.`
      );
      setShowErrorDialog(true);
      return;
    }

    try {
      await aggiornaPreventivo(quoteToEdit.id, {
        numero: num,
        anno: year,
      });
      
      toast.success("Numero e anno modificati con successo");
      navigate("/");
    } catch (error) {
      console.error("Errore aggiornamento:", error);
      toast.error("Errore durante la modifica");
    }
  };

  if (!quoteToEdit) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6" style={{ fontSize: `${settings.fontSizeEditNumber}rem` }}>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-2xl p-3 sm:p-4 flex items-center gap-3 mb-6"
        >
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/")}
            className="h-10 w-10"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-3xl font-extrabold tracking-tight">Modifica Numero e Anno</h1>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass rounded-2xl p-6"
        >
          <div className="mb-6 p-4 bg-muted rounded-lg">
            <h2 className="font-bold mb-2" style={{ fontSize: `${settings.fontSizeEditNumber}rem` }}>
              Preventivo: {quoteToEdit.number.toString().padStart(2, '0')}-{quoteToEdit.year} {quoteToEdit.client}
            </h2>
            <p className="text-sm text-muted-foreground" style={{ fontSize: `${settings.fontSizeEditNumber}rem` }}>
              {quoteToEdit.title || "Senza oggetto"}
            </p>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="quote-number" style={{ fontSize: `${settings.fontSizeEditNumber}rem` }}>
                Numero Preventivo
              </Label>
              <Input
                id="quote-number"
                type="number"
                min="1"
                value={quoteNumber}
                onChange={(e) => setQuoteNumber(e.target.value)}
                placeholder="Es: 1"
                className="bg-white"
                style={{ fontSize: `${settings.fontSizeEditNumber}rem` }}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="quote-year" style={{ fontSize: `${settings.fontSizeEditNumber}rem` }}>
                Anno
              </Label>
              <Input
                id="quote-year"
                type="number"
                min="2000"
                max="2100"
                value={quoteYear}
                onChange={(e) => setQuoteYear(e.target.value)}
                placeholder={`Es: ${new Date().getFullYear()}`}
                className="bg-white"
                style={{ fontSize: `${settings.fontSizeEditNumber}rem` }}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => navigate("/")}
                className="flex-1"
                style={{ fontSize: `${settings.fontSizeEditNumber}rem` }}
              >
                Annulla
              </Button>
              <Button
                onClick={handleSave}
                className="flex-1"
                style={{ fontSize: `${settings.fontSizeEditNumber}rem` }}
              >
                Salva
              </Button>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Error Dialog */}
      <AlertDialog open={showErrorDialog} onOpenChange={setShowErrorDialog}>
        <AlertDialogContent className="bg-white border-2 border-border max-w-lg p-8">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl font-bold text-red-600">Errore</AlertDialogTitle>
            <AlertDialogDescription className="text-lg font-semibold text-black mt-4">
              {errorMessage}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-6">
            <AlertDialogAction 
              onClick={() => setShowErrorDialog(false)}
              className="text-lg font-bold px-8 py-6"
            >
              OK
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default EditQuoteNumber;
