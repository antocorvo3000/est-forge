-- Aggiungi colonne per le dimensioni del testo
ALTER TABLE azienda 
ADD COLUMN IF NOT EXISTS font_size_list DECIMAL(3,2) DEFAULT 1.00,
ADD COLUMN IF NOT EXISTS font_size_quote DECIMAL(3,2) DEFAULT 1.00,
ADD COLUMN IF NOT EXISTS font_size_client DECIMAL(3,2) DEFAULT 1.00;