import { useState, useEffect } from "react";
import type { Quote, QuoteFormData } from "@/types/quote";

const STORAGE_KEY = "quotes-data";

const initialQuotes: Quote[] = [
  { id: "Q-2025-014", title: "Audit sicurezza", client: "Omicron Finance", amount: 2800.0, date: "2025-09-01", createdAt: "2025-09-01T10:00:00" },
  { id: "Q-2025-013", title: "ERP personalizzato", client: "Nu Delta", amount: 12500.0, date: "2025-09-04", createdAt: "2025-09-04T10:00:00" },
  { id: "Q-2025-012", title: "Monitoraggio rete", client: "Lambda Works", amount: 1500.0, date: "2025-09-08", createdAt: "2025-09-08T10:00:00" },
  { id: "Q-2025-011", title: "PC dipendenti (5pz)", client: "Kappa Retail", amount: 4250.0, date: "2025-09-10", createdAt: "2025-09-10T10:00:00" },
  { id: "Q-2025-010", title: "Backup cloud 2TB", client: "Theta Labs", amount: 870.0, date: "2025-09-12", createdAt: "2025-09-12T10:00:00" },
  { id: "Q-2025-009", title: "Sito vetrina aziendale", client: "Alpha Media", amount: 3100.0, date: "2025-09-15", createdAt: "2025-09-15T10:00:00" },
  { id: "Q-2025-008", title: "Formazione staff IT", client: "Epsilon Consulting", amount: 980.0, date: "2025-09-18", createdAt: "2025-09-18T10:00:00" },
  { id: "Q-2025-007", title: "Cablaggio magazzino", client: "Sigma Logistica", amount: 5200.0, date: "2025-09-20", createdAt: "2025-09-20T10:00:00" },
  { id: "Q-2025-006", title: "Rinnovo firewall", client: "Rho Tech", amount: 1450.0, date: "2025-09-25", createdAt: "2025-09-25T10:00:00" },
  { id: "Q-2025-005", title: "Licenze software annuali", client: "Omega S.p.A.", amount: 2100.0, date: "2025-09-28", createdAt: "2025-09-28T10:00:00" },
  { id: "Q-2025-004", title: "Assistenza trimestrale", client: "Delta S.r.l.", amount: 750.0, date: "2025-10-15", createdAt: "2025-10-15T10:00:00" },
  { id: "Q-2025-003", title: "Server NAS + backup", client: "Gamma Consulting", amount: 6120.0, date: "2025-10-11", createdAt: "2025-10-11T10:00:00" },
  { id: "Q-2025-002", title: "Impianto Wi‑Fi sede 2", client: "BetaTech SRL", amount: 3890.5, date: "2025-10-06", createdAt: "2025-10-06T10:00:00" },
  { id: "Q-2025-001", title: "Fornitura rete ufficio", client: "Acme S.p.A.", amount: 2480.0, date: "2025-10-03", createdAt: "2025-10-03T10:00:00" },
];

export const useQuotes = () => {
  const [quotes, setQuotes] = useState<Quote[]>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : initialQuotes;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(quotes));
  }, [quotes]);

  const addQuote = (data: QuoteFormData) => {
    const year = new Date().getFullYear();
    const maxNum = quotes
      .map((q) => parseInt(q.id.split("-")[2]))
      .reduce((max, num) => Math.max(max, num), 0);
    const newId = `Q-${year}-${String(maxNum + 1).padStart(3, "0")}`;

    const newQuote: Quote = {
      ...data,
      id: newId,
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
