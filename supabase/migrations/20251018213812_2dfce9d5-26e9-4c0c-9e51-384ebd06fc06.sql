-- Aggiungi colonne per font size delle nuove schermate
ALTER TABLE public.azienda 
ADD COLUMN IF NOT EXISTS font_size_clone numeric DEFAULT 1.00,
ADD COLUMN IF NOT EXISTS font_size_edit_number numeric DEFAULT 1.00;