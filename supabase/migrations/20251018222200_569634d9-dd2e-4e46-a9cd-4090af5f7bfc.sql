-- Aggiungi campo per abilitare/disabilitare la numerazione progressiva personalizzata
ALTER TABLE public.azienda 
ADD COLUMN numerazione_progressiva_attiva boolean DEFAULT false;

COMMENT ON COLUMN public.azienda.numerazione_progressiva_attiva IS 'Se true, usa il numero progressivo iniziale personalizzato invece di partire da 1';