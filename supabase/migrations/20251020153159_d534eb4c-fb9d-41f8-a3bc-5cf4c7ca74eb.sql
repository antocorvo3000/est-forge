-- Crea tabella per cache dei preventivi in corso
CREATE TABLE IF NOT EXISTS public.preventivi_cache (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  numero integer,
  anno integer,
  cliente_id uuid,
  oggetto text,
  ubicazione_via text,
  ubicazione_citta text,
  ubicazione_provincia text,
  ubicazione_cap text,
  subtotale numeric DEFAULT 0,
  sconto_percentuale numeric DEFAULT 0,
  sconto_valore numeric DEFAULT 0,
  totale numeric DEFAULT 0,
  note text,
  modalita_pagamento text,
  stato text DEFAULT 'bozza',
  tipo_operazione text NOT NULL, -- 'creazione', 'modifica', 'clonazione'
  preventivo_originale_id uuid, -- ID del preventivo originale se è una modifica
  righe jsonb, -- Righe del preventivo in formato JSON
  dati_cliente jsonb, -- Dati del cliente in formato JSON
  creato_il timestamp with time zone DEFAULT now(),
  aggiornato_il timestamp with time zone DEFAULT now()
);

-- Abilita RLS
ALTER TABLE public.preventivi_cache ENABLE ROW LEVEL SECURITY;

-- Policy per permettere tutte le operazioni
CREATE POLICY "Tutti possono gestire cache preventivi"
  ON public.preventivi_cache
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Trigger per aggiornare automaticamente aggiornato_il
CREATE TRIGGER aggiorna_cache_timestamp
  BEFORE UPDATE ON public.preventivi_cache
  FOR EACH ROW
  EXECUTE FUNCTION public.aggiorna_timestamp();

-- Indice per migliorare le performance
CREATE INDEX idx_preventivi_cache_aggiornato ON public.preventivi_cache(aggiornato_il DESC);