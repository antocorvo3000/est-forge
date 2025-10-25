import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCompanySettings } from "@/hooks/useCompanySettings";
import { useQuotes } from "@/hooks/useQuotes";

const CloneQuote = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { settings } = useCompanySettings();
  const { quotes } = useQuotes();
  const quoteToClone = location.state?.quote;

  const [step, setStep] = useState<"choice" | "custom" | "modify">("choice");
  const [cloneNumber, setCloneNumber] = useState<number | null>(null);
  const [cloneYear, setCloneYear] = useState<number | null>(null);
  const [quoteNumber, setQuoteNumber] = useState<string>("1");
  const [quoteYear, setQuoteYear] = useState<string>(new Date().getFullYear().toString());
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!quoteToClone) {
      navigate("/");
    }
  }, [quoteToClone, navigate]);

  const handleProgressiveChoice = () => {
    // Calcola il prossimo numero progressivo
    const year = new Date().getFullYear();
    const currentYearQuotes = quotes
      .filter((q) => q.year === year)
      .map((q) => q.number)
      .sort((a, b) => a - b);

    // Se la numerazione personalizzata è attiva, parte dal numero impostato
    // Altrimenti parte da 1
    const baseNumber = settings.customNumberingEnabled ? settings.startingQuoteNumber : 1;

    // Trova il primo numero disponibile >= baseNumber
    let newNum = baseNumber;
    for (const num of currentYearQuotes) {
      if (num >= baseNumber) {
        if (num === newNum) {
          newNum++;
        } else if (num > newNum) {
          break;
        }
      }
    }

    setCloneNumber(newNum);
    setCloneYear(year);
    setStep("modify");
  };

  const handleCustomChoice = () => {
    setStep("custom");
  };

  const handleCustomConfirm = () => {
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

    const exists = quotes.find((q) => q.number === num && q.year === year);
    if (exists) {
      setErrorMessage(
        `Il preventivo ${num.toString().padStart(2, "0")}-${year} esiste già. Eliminare quello esistente per continuare o modificarlo.`,
      );
      setShowErrorDialog(true);
      return;
    }

    setCloneNumber(num);
    setCloneYear(year);
    setStep("modify");
  };

  if (!quoteToClone) {
    return null;
  }

  // Se siamo nello step "modify", naviga alla pagina di modifica
  if (step === "modify" && cloneNumber !== null && cloneYear !== null) {
    navigate(`/modify-quote/${quoteToClone.id}`, {
      state: {
        quote: quoteToClone,
        isCloning: true,
        cloneNumber,
        cloneYear,
      },
    });
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6" style={{ fontSize: `${settings.fontSizeClone}rem` }}>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-2xl p-3 sm:p-4 flex items-center gap-3 mb-6"
        >
          <Button variant="ghost" size="icon" onClick={() => navigate("/")} className="h-10 w-10">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-3xl font-extrabold tracking-tight">Clonazione Preventivo</h1>
        </motion.div>

        <AnimatePresence mode="wait">
          {step === "choice" && (
            <motion.div
              key="choice"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="glass rounded-2xl p-6"
            >
              <div className="space-y-6">
                <div className="text-center space-y-2">
                  <h2 className="text-2xl font-bold">Scegli numerazione</h2>
                  <p className="text-lg text-muted-foreground">
                    Vuoi mantenere la numerazione progressiva o inserire un numero personalizzato?
                  </p>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={handleCustomChoice}
                    className="flex-1 h-14 text-lg font-bold"
                    style={{ fontSize: `${settings.fontSizeClone}rem` }}
                  >
                    Personalizzato
                  </Button>
                  <Button
                    onClick={handleProgressiveChoice}
                    className="flex-1 h-14 text-lg font-bold"
                    style={{ fontSize: `${settings.fontSizeClone}rem` }}
                  >
                    Progressivo
                  </Button>
                </div>
              </div>
            </motion.div>
          )}

          {step === "custom" && (
            <motion.div
              key="custom"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="glass rounded-2xl p-6"
            >
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="quote-number" style={{ fontSize: `${settings.fontSizeClone}rem` }}>
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
                    style={{ fontSize: `${settings.fontSizeClone}rem` }}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="quote-year" style={{ fontSize: `${settings.fontSizeClone}rem` }}>
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
                    style={{ fontSize: `${settings.fontSizeClone}rem` }}
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => navigate("/")}
                    className="flex-1"
                    style={{ fontSize: `${settings.fontSizeClone}rem` }}
                  >
                    Annulla
                  </Button>
                  <Button
                    onClick={handleCustomConfirm}
                    className="flex-1"
                    style={{ fontSize: `${settings.fontSizeClone}rem` }}
                  >
                    Conferma
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
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
            <AlertDialogAction onClick={() => setShowErrorDialog(false)} className="text-lg font-bold px-8 py-6">
              OK
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default CloneQuote;
