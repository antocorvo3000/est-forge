-- Correggi la funzione aggiorna_timestamp con search_path sicuro
CREATE OR REPLACE FUNCTION aggiorna_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.aggiornato_il = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public;