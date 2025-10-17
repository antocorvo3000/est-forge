import { useState, useEffect } from "react";
import type { Quote, QuoteFormData } from "@/types/quote";

const STORAGE_KEY = "quotes-data";

const initialQuotes: Quote[] = [
  { id: "Q-2025-014", number: 14, year: 2025, title: "Audit sicurezza", client: "Omicron Finance", clientAddress: "Via Torino 45, Roma (RM)", amount: 2800.0, date: "2025-09-01", createdAt: "2025-09-01T10:00:00" },
  { id: "Q-2025-013", number: 13, year: 2025, title: "ERP personalizzato", client: "Nu Delta", clientAddress: "Corso Italia 12, Napoli (NA)", amount: 12500.0, date: "2025-09-04", createdAt: "2025-09-04T10:00:00" },
  { id: "Q-2025-012", number: 12, year: 2025, title: "Monitoraggio rete", client: "Lambda Works", clientAddress: "Via Garibaldi 89, Torino (TO)", amount: 1500.0, date: "2025-09-08", createdAt: "2025-09-08T10:00:00" },
  { id: "Q-2025-011", number: 11, year: 2025, title: "PC dipendenti (5pz)", client: "Kappa Retail", clientAddress: "Piazza Duomo 3, Firenze (FI)", amount: 4250.0, date: "2025-09-10", createdAt: "2025-09-10T10:00:00" },
  { id: "Q-2025-010", number: 10, year: 2025, title: "Backup cloud 2TB", client: "Theta Labs", clientAddress: "Via Mazzini 67, Bologna (BO)", amount: 870.0, date: "2025-09-12", createdAt: "2025-09-12T10:00:00" },
  { id: "Q-2025-009", number: 9, year: 2025, title: "Sito vetrina aziendale", client: "Alpha Media", clientAddress: "Viale Europa 22, Verona (VR)", amount: 3100.0, date: "2025-09-15", createdAt: "2025-09-15T10:00:00" },
  { id: "Q-2025-008", number: 8, year: 2025, title: "Formazione staff IT", client: "Epsilon Consulting", clientAddress: "Via Cavour 56, Padova (PD)", amount: 980.0, date: "2025-09-18", createdAt: "2025-09-18T10:00:00" },
  { id: "Q-2025-007", number: 7, year: 2025, title: "Cablaggio magazzino", client: "Sigma Logistica", clientAddress: "Zona Industriale 1, Prato (PO)", amount: 5200.0, date: "2025-09-20", createdAt: "2025-09-20T10:00:00" },
  { id: "Q-2025-006", number: 6, year: 2025, title: "Rinnovo firewall", client: "Rho Tech", clientAddress: "Via Dante 34, Genova (GE)", amount: 1450.0, date: "2025-09-25", createdAt: "2025-09-25T10:00:00" },
  { id: "Q-2025-005", number: 5, year: 2025, title: "Licenze software annuali", client: "Omega S.p.A.", clientAddress: "Corso Vittorio 78, Brescia (BS)", amount: 2100.0, date: "2025-09-28", createdAt: "2025-09-28T10:00:00" },
  { id: "Q-2025-004", number: 4, year: 2025, title: "Assistenza trimestrale", client: "Delta S.r.l.", clientAddress: "Via Po 15, Modena (MO)", amount: 750.0, date: "2025-10-15", createdAt: "2025-10-15T10:00:00" },
  { id: "Q-2025-003", number: 3, year: 2025, title: "Server NAS + backup", client: "Gamma Consulting", clientAddress: "Piazza Castello 9, Parma (PR)", amount: 6120.0, date: "2025-10-11", createdAt: "2025-10-11T10:00:00" },
  { id: "Q-2025-002", number: 2, year: 2025, title: "Impianto Wi‑Fi sede 2", client: "BetaTech SRL", clientAddress: "Via Venezia 44, Bergamo (BG)", amount: 3890.5, date: "2025-10-06", createdAt: "2025-10-06T10:00:00" },
  { id: "Q-2025-001", number: 1, year: 2025, title: "Fornitura rete ufficio", client: "Acme S.p.A.", clientAddress: "Via Roma 1, Milano (MI)", amount: 2480.0, date: "2025-10-03", createdAt: "2025-10-03T10:00:00" },
];

export const useQuotes = () => {
  const [quotes, setQuotes] = useState<Quote[]>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        // Check if old data format - if any quote is missing number/year, use initial quotes
        if (parsed.length > 0 && (!parsed[0].number || !parsed[0].year || !parsed[0].clientAddress)) {
          console.log("Old data format detected, using initial quotes");
          return initialQuotes;
        }
        return parsed;
      } catch (e) {
        return initialQuotes;
      }
    }
    return initialQuotes;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(quotes));
  }, [quotes]);

  const addQuote = (data: QuoteFormData) => {
    const year = new Date().getFullYear();
    const maxNum = quotes
      .filter((q) => q.year === year)
      .map((q) => q.number)
      .reduce((max, num) => Math.max(max, num), 0);
    const newNum = maxNum + 1;
    const newId = `Q-${year}-${String(newNum).padStart(3, "0")}`;

    const newQuote: Quote = {
      ...data,
      id: newId,
      number: newNum,
      year: year,
      createdAt: new Date().toISOString(),
    };

    setQuotes((prev) => [newQuote, ...prev]);
  };

  const updateQuote = (id: string, data: QuoteFormData) => {
    setQuotes((prev) =>
      prev.map((q) => (q.id === id ? { ...q, ...data } : q))
    );
  };

  const deleteQuote = (id: string) => {
    setQuotes((prev) => prev.filter((q) => q.id !== id));
  };

  const sortedQuotes = [...quotes].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return {
    quotes: sortedQuotes,
    addQuote,
    updateQuote,
    deleteQuote,
  };
};
