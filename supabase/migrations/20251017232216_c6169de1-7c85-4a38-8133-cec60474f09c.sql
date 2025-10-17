-- Abilita realtime per la tabella preventivi
ALTER TABLE preventivi REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE preventivi;