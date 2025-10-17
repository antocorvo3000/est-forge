-- Tabella per i dati aziendali
CREATE TABLE IF NOT EXISTS azienda (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ragione_sociale TEXT NOT NULL,
  partita_iva TEXT NOT NULL,
  sede_legale TEXT NOT NULL,
  telefono TEXT NOT NULL,
  email TEXT NOT NULL,
  logo_url TEXT,
  creato_il TIMESTAMP WITH TIME ZONE DEFAULT now(),
  aggiornato_il TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabella per i clienti
CREATE TABLE IF NOT EXISTS clienti (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome_ragione_sociale TEXT NOT NULL,
  codice_fiscale_piva TEXT,
  via TEXT,
  citta TEXT,
  provincia TEXT,
  cap TEXT,
  telefono TEXT,
  email TEXT,
  creato_il TIMESTAMP WITH TIME ZONE DEFAULT now(),
  aggiornato_il TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabella per i preventivi
CREATE TABLE IF NOT EXISTS preventivi (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero INTEGER NOT NULL,
  anno INTEGER NOT NULL,
  cliente_id UUID REFERENCES clienti(id) ON DELETE SET NULL,
  oggetto TEXT,
  ubicazione_via TEXT,
  ubicazione_citta TEXT,
  ubicazione_provincia TEXT,
  ubicazione_cap TEXT,
  subtotale DECIMAL(10,2) DEFAULT 0,
  sconto_percentuale DECIMAL(5,2) DEFAULT 0,
  sconto_valore DECIMAL(10,2) DEFAULT 0,
  totale DECIMAL(10,2) DEFAULT 0,
  note TEXT,
  modalita_pagamento TEXT,
  stato TEXT DEFAULT 'bozza',
  creato_il TIMESTAMP WITH TIME ZONE DEFAULT now(),
  aggiornato_il TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(numero, anno)
);

-- Tabella per le righe dei preventivi
CREATE TABLE IF NOT EXISTS righe_preventivo (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  preventivo_id UUID NOT NULL REFERENCES preventivi(id) ON DELETE CASCADE,
  numero_riga INTEGER NOT NULL,
  descrizione TEXT NOT NULL,
  unita_misura TEXT NOT NULL,
  quantita DECIMAL(10,2) NOT NULL DEFAULT 0,
  prezzo_unitario DECIMAL(10,2) NOT NULL DEFAULT 0,
  totale DECIMAL(10,2) NOT NULL DEFAULT 0,
  creato_il TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Indici per migliorare le performance
CREATE INDEX IF NOT EXISTS idx_preventivi_cliente ON preventivi(cliente_id);
CREATE INDEX IF NOT EXISTS idx_preventivi_anno ON preventivi(anno);
CREATE INDEX IF NOT EXISTS idx_righe_preventivo ON righe_preventivo(preventivo_id);

-- Trigger per aggiornare automaticamente aggiornato_il
CREATE OR REPLACE FUNCTION aggiorna_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.aggiornato_il = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER aggiorna_azienda_timestamp
  BEFORE UPDATE ON azienda
  FOR EACH ROW
  EXECUTE FUNCTION aggiorna_timestamp();

CREATE TRIGGER aggiorna_clienti_timestamp
  BEFORE UPDATE ON clienti
  FOR EACH ROW
  EXECUTE FUNCTION aggiorna_timestamp();

CREATE TRIGGER aggiorna_preventivi_timestamp
  BEFORE UPDATE ON preventivi
  FOR EACH ROW
  EXECUTE FUNCTION aggiorna_timestamp();

-- Abilita RLS (Row Level Security)
ALTER TABLE azienda ENABLE ROW LEVEL SECURITY;
ALTER TABLE clienti ENABLE ROW LEVEL SECURITY;
ALTER TABLE preventivi ENABLE ROW LEVEL SECURITY;
ALTER TABLE righe_preventivo ENABLE ROW LEVEL SECURITY;

-- Policy per permettere a tutti di leggere e modificare (per ora senza autenticazione)
CREATE POLICY "Tutti possono leggere azienda" ON azienda FOR SELECT USING (true);
CREATE POLICY "Tutti possono modificare azienda" ON azienda FOR ALL USING (true);

CREATE POLICY "Tutti possono leggere clienti" ON clienti FOR SELECT USING (true);
CREATE POLICY "Tutti possono gestire clienti" ON clienti FOR ALL USING (true);

CREATE POLICY "Tutti possono leggere preventivi" ON preventivi FOR SELECT USING (true);
CREATE POLICY "Tutti possono gestire preventivi" ON preventivi FOR ALL USING (true);

CREATE POLICY "Tutti possono leggere righe" ON righe_preventivo FOR SELECT USING (true);
CREATE POLICY "Tutti possono gestire righe" ON righe_preventivo FOR ALL USING (true);

-- Crea bucket per il logo aziendale
INSERT INTO storage.buckets (id, name, public) 
VALUES ('loghi', 'loghi', true)
ON CONFLICT (id) DO NOTHING;

-- Policy per lo storage del logo
CREATE POLICY "Tutti possono vedere i loghi" ON storage.objects 
  FOR SELECT USING (bucket_id = 'loghi');

CREATE POLICY "Tutti possono caricare loghi" ON storage.objects 
  FOR INSERT WITH CHECK (bucket_id = 'loghi');

CREATE POLICY "Tutti possono aggiornare loghi" ON storage.objects 
  FOR UPDATE USING (bucket_id = 'loghi');

CREATE POLICY "Tutti possono eliminare loghi" ON storage.objects 
  FOR DELETE USING (bucket_id = 'loghi');

-- Inserisci dati azienda di default
INSERT INTO azienda (ragione_sociale, partita_iva, sede_legale, telefono, email)
VALUES ('ZetaForge S.r.l.', '01234567890', 'Via Roma 1, Milano (MI)', '+39 02 123456', 'info@zetaforge.it')
ON CONFLICT DO NOTHING;

-- Inserisci clienti di esempio
INSERT INTO clienti (nome_ragione_sociale, codice_fiscale_piva, via, citta, provincia, cap, telefono, email) VALUES
('Rossi Mario', 'RSSMRA80A01F205X', 'Via Garibaldi 15', 'Milano', 'MI', '20100', '+39 333 1234567', 'mario.rossi@example.com'),
('Bianchi S.r.l.', '12345678901', 'Corso Italia 42', 'Roma', 'RM', '00100', '+39 06 9876543', 'info@bianchi.it'),
('Verdi Costruzioni', '98765432109', 'Via Dante 88', 'Torino', 'TO', '10100', '+39 011 5554444', 'verdi@costruzioni.it'),
('Neri & Associati', '55566677788', 'Piazza San Marco 1', 'Venezia', 'VE', '30100', '+39 041 2223344', 'neri@associati.com'),
('Gialli Impianti', '11122233344', 'Via Mazzini 7', 'Firenze', 'FI', '50100', '+39 055 7778899', 'gialli@impianti.it')
ON CONFLICT DO NOTHING;

-- Inserisci preventivi di esempio
DO $$
DECLARE
  cliente_id1 UUID;
  cliente_id2 UUID;
  cliente_id3 UUID;
  preventivo_id1 UUID;
  preventivo_id2 UUID;
  preventivo_id3 UUID;
BEGIN
  -- Ottieni gli ID dei clienti
  SELECT id INTO cliente_id1 FROM clienti WHERE nome_ragione_sociale = 'Rossi Mario' LIMIT 1;
  SELECT id INTO cliente_id2 FROM clienti WHERE nome_ragione_sociale = 'Bianchi S.r.l.' LIMIT 1;
  SELECT id INTO cliente_id3 FROM clienti WHERE nome_ragione_sociale = 'Verdi Costruzioni' LIMIT 1;

  -- Preventivo 1
  INSERT INTO preventivi (numero, anno, cliente_id, oggetto, ubicazione_via, ubicazione_citta, ubicazione_provincia, ubicazione_cap, subtotale, totale, modalita_pagamento, stato)
  VALUES (1, 2025, cliente_id1, 'Ristrutturazione appartamento', 'Via Garibaldi 15', 'Milano', 'MI', '20100', 15000.00, 15000.00, 'bonifico', 'bozza')
  RETURNING id INTO preventivo_id1;

  INSERT INTO righe_preventivo (preventivo_id, numero_riga, descrizione, unita_misura, quantita, prezzo_unitario, totale) VALUES
  (preventivo_id1, 1, 'Demolizione pavimento esistente', 'mq', 50, 15.00, 750.00),
  (preventivo_id1, 2, 'Posa nuovo pavimento in gres porcellanato', 'mq', 50, 45.00, 2250.00),
  (preventivo_id1, 3, 'Tinteggiatura pareti', 'mq', 150, 12.00, 1800.00),
  (preventivo_id1, 4, 'Rifacimento impianto elettrico', 'a corpo', 1, 3500.00, 3500.00),
  (preventivo_id1, 5, 'Sostituzione infissi', 'pz', 6, 1200.00, 7200.00);

  -- Preventivo 2
  INSERT INTO preventivi (numero, anno, cliente_id, oggetto, ubicazione_via, ubicazione_citta, ubicazione_provincia, ubicazione_cap, subtotale, sconto_percentuale, sconto_valore, totale, modalita_pagamento, stato)
  VALUES (2, 2025, cliente_id2, 'Impianto climatizzazione ufficio', 'Corso Italia 42', 'Roma', 'RM', '00100', 8500.00, 10, 850.00, 7650.00, 'da-concordare', 'bozza')
  RETURNING id INTO preventivo_id2;

  INSERT INTO righe_preventivo (preventivo_id, numero_riga, descrizione, unita_misura, quantita, prezzo_unitario, totale) VALUES
  (preventivo_id2, 1, 'Climatizzatore 12000 BTU', 'pz', 3, 800.00, 2400.00),
  (preventivo_id2, 2, 'Climatizzatore 18000 BTU', 'pz', 2, 1200.00, 2400.00),
  (preventivo_id2, 3, 'Installazione e messa in opera', 'a corpo', 1, 1800.00, 1800.00),
  (preventivo_id2, 4, 'Tubazioni e materiale vario', 'a corpo', 1, 1900.00, 1900.00);

  -- Preventivo 3
  INSERT INTO preventivi (numero, anno, cliente_id, oggetto, ubicazione_via, ubicazione_citta, ubicazione_provincia, ubicazione_cap, subtotale, totale, modalita_pagamento, stato, note)
  VALUES (3, 2025, cliente_id3, 'Rifacimento tetto e grondaie', 'Via Dante 88', 'Torino', 'TO', '10100', 22000.00, 22000.00, 'bonifico', 'bozza', 'Lavori da eseguire entro marzo 2025')
  RETURNING id INTO preventivo_id3;

  INSERT INTO righe_preventivo (preventivo_id, numero_riga, descrizione, unita_misura, quantita, prezzo_unitario, totale) VALUES
  (preventivo_id3, 1, 'Rimozione vecchio manto', 'mq', 120, 18.00, 2160.00),
  (preventivo_id3, 2, 'Posa nuovo manto tegole', 'mq', 120, 65.00, 7800.00),
  (preventivo_id3, 3, 'Lattoneria e grondaie', 'm', 45, 85.00, 3825.00),
  (preventivo_id3, 4, 'Ponteggio e sicurezza', 'a corpo', 1, 4500.00, 4500.00),
  (preventivo_id3, 5, 'Smaltimento materiali', 'a corpo', 1, 3715.00, 3715.00);
END $$;