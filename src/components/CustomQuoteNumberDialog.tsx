import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface CustomQuoteNumberDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (number: number, year: number) => void;
}

export function CustomQuoteNumberDialog({ open, onClose, onConfirm }: CustomQuoteNumberDialogProps) {
  const currentYear = new Date().getFullYear();
  const [quoteNumber, setQuoteNumber] = useState<string>("1");
  const [quoteYear, setQuoteYear] = useState<string>(currentYear.toString());

  const handleConfirm = () => {
    const num = parseInt(quoteNumber);
    const year = parseInt(quoteYear);
    
    if (isNaN(num) || num < 1) {
      return;
    }
    
    if (isNaN(year) || year < 2000 || year > 2100) {
      return;
    }
    
    onConfirm(num, year);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Numero Preventivo Personalizzato</DialogTitle>
          <DialogDescription>
            Inserisci il numero e l'anno del preventivo
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="quote-number">Numero Preventivo</Label>
            <Input
              id="quote-number"
              type="number"
              min="1"
              value={quoteNumber}
              onChange={(e) => setQuoteNumber(e.target.value)}
              placeholder="Es: 1"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="quote-year">Anno</Label>
            <Input
              id="quote-year"
              type="number"
              min="2000"
              max="2100"
              value={quoteYear}
              onChange={(e) => setQuoteYear(e.target.value)}
              placeholder={`Es: ${currentYear}`}
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Annulla
          </Button>
          <Button onClick={handleConfirm}>
            Conferma
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
