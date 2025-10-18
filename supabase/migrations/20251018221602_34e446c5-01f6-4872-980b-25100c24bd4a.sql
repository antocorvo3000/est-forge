-- Aggiungi campo per numero progressivo iniziale nella tabella azienda
ALTER TABLE public.azienda 
ADD COLUMN numero_progressivo_iniziale integer DEFAULT 1;

COMMENT ON COLUMN public.azienda.numero_progressivo_iniziale IS 'Numero da cui iniziare la numerazione progressiva dei preventivi';