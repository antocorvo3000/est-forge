import { useState, useEffect } from "react";
import type { Quote, QuoteFormData } from "@/types/quote";
import { caricaPreventivi, salvaPreventivo, aggiornaPreventivo, eliminaPreventivo, salvaCliente, salvaRighePreventivo } from "@/lib/database";
import { supabase } from "@/integrations/supabase/client";

export const useQuotes = () => {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadQuotes();
    
    // Setup realtime subscription
    const channel = supabase
      .channel('preventivi-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'preventivi'
        },
        () => {
          loadQuotes();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadQuotes = async () => {
    try {
      const data = await caricaPreventivi();
      const mappedQuotes: Quote[] = data.map((p: any) => ({
        id: p.id,
        number: p.numero,
        year: p.anno,
        title: p.oggetto || "",
        client: p.clienti?.nome_ragione_sociale || "",
        clientAddress: `${p.ubicazione_via || ""}, ${p.ubicazione_citta || ""} (${p.ubicazione_provincia || ""})`,
        amount: parseFloat(p.totale) || 0,
        date: p.creato_il?.split('T')[0] || "",
        createdAt: p.creato_il || "",
      }));
      setQuotes(mappedQuotes);
    } catch (error) {
      console.error("Errore caricamento preventivi:", error);
    } finally {
      setLoading(false);
    }
  };

  const getQuoteById = async (id: string) => {
    try {
      const { data, error } = await supabase
        .from("preventivi")
        .select(`
          *,
          clienti (*),
          righe_preventivo (*)
        `)
        .eq("id", id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Errore caricamento preventivo:", error);
      throw error;
    }
  };

  const addQuote = async (data: QuoteFormData) => {
    try {
      const year = new Date().getFullYear();
      const maxNum = quotes
        .filter((q) => q.year === year)
        .map((q) => q.number)
        .reduce((max, num) => Math.max(max, num), 0);
      const newNum = maxNum + 1;

      // Estrai dati cliente dall'indirizzo
      const addressParts = data.clientAddress.split(',');
      const via = addressParts[0]?.trim() || "";
      const cityPart = addressParts[1]?.trim() || "";
      const cityMatch = cityPart.match(/^(.+?)\s*\(([A-Z]{2})\)$/);
      const citta = cityMatch?.[1]?.trim() || cityPart;
      const provincia = cityMatch?.[2] || "";

      // Salva cliente
      const cliente = await salvaCliente({
        nome_ragione_sociale: data.client,
        via,
        citta,
        provincia,
      });

      // Salva preventivo
      const preventivo = await salvaPreventivo({
        numero: newNum,
        anno: year,
        cliente_id: cliente.id,
        oggetto: data.title,
        totale: data.amount,
      });

      await loadQuotes();
    } catch (error) {
      console.error("Errore salvataggio preventivo:", error);
      throw error;
    }
  };

  const updateQuote = async (id: string, data: QuoteFormData) => {
    try {
      // Estrai dati cliente dall'indirizzo
      const addressParts = data.clientAddress.split(',');
      const via = addressParts[0]?.trim() || "";
      const cityPart = addressParts[1]?.trim() || "";
      const cityMatch = cityPart.match(/^(.+?)\s*\(([A-Z]{2})\)$/);
      const citta = cityMatch?.[1]?.trim() || cityPart;
      const provincia = cityMatch?.[2] || "";

      // Salva/aggiorna cliente
      const cliente = await salvaCliente({
        nome_ragione_sociale: data.client,
        via,
        citta,
        provincia,
      });

      // Aggiorna preventivo
      await aggiornaPreventivo(id, {
        cliente_id: cliente.id,
        oggetto: data.title,
        totale: data.amount,
      });

      await loadQuotes();
    } catch (error) {
      console.error("Errore aggiornamento preventivo:", error);
      throw error;
    }
  };

  const deleteQuote = async (id: string) => {
    try {
      await eliminaPreventivo(id);
      await loadQuotes();
    } catch (error) {
      console.error("Errore eliminazione preventivo:", error);
      throw error;
    }
  };

  const sortedQuotes = [...quotes].sort(
    (a, b) => {
      // Prima ordina per anno decrescente, poi per numero decrescente
      if (b.year !== a.year) {
        return b.year - a.year;
      }
      return b.number - a.number;
    }
  );

  return {
    quotes: sortedQuotes,
    addQuote,
    updateQuote,
    deleteQuote,
    getQuoteById,
    loading,
  };
};
