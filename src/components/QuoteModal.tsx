import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import type { Quote, QuoteFormData } from "@/types/quote";

interface QuoteModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: QuoteFormData) => void;
  quote?: Quote;
}

export const QuoteModal = ({ open, onClose, onSave, quote }: QuoteModalProps) => {
  const [formData, setFormData] = useState<QuoteFormData>({
    title: "",
    client: "",
    clientAddress: "",
    amount: 0,
    date: new Date().toISOString().split("T")[0],
  });

  useEffect(() => {
    if (quote) {
      setFormData({
        title: quote.title,
        client: quote.client,
        clientAddress: quote.clientAddress,
        amount: quote.amount,
        date: quote.date,
      });
    } else {
      setFormData({
        title: "",
        client: "",
        clientAddress: "",
        amount: 0,
        date: new Date().toISOString().split("T")[0],
      });
    }
  }, [quote, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="glass border-border sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            {quote ? "Modifica Preventivo" : "Nuovo Preventivo"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title" className="text-sm font-semibold">
              Titolo
            </Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Es. Audit sicurezza"
              required
              className="bg-white"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="client" className="text-sm font-semibold">
              Cliente / Ragione Sociale
            </Label>
            <Input
              id="client"
              value={formData.client}
              onChange={(e) => setFormData({ ...formData, client: e.target.value })}
              placeholder="Es. Acme S.p.A."
              required
              className="bg-white"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="clientAddress" className="text-sm font-semibold">
              Indirizzo Cliente
            </Label>
            <Input
              id="clientAddress"
              value={formData.clientAddress}
              onChange={(e) => setFormData({ ...formData, clientAddress: e.target.value })}
              placeholder="Es. Via Roma 1, Milano (MI)"
              required
              className="bg-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount" className="text-sm font-semibold">
                Importo (€)
              </Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                value={formData.amount || ""}
                onChange={(e) =>
                  setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })
                }
                placeholder="0.00"
                required
                className="bg-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="date" className="text-sm font-semibold">
                Data
              </Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
                className="bg-white"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={onClose}>
              Annulla
            </Button>
            <Button type="submit" className="bg-gradient-to-b from-primary to-primary-glow shadow-[var(--shadow-primary)] hover:brightness-105">
              {quote ? "Salva modifiche" : "Crea preventivo"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
