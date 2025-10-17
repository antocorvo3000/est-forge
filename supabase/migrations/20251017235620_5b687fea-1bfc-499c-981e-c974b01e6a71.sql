-- Add font_size_settings column to azienda table
ALTER TABLE azienda 
ADD COLUMN font_size_settings DECIMAL(3,2) DEFAULT 1.00;