import { supabase } from "@/integrations/supabase/client";

// Carica i dati aziendali
export async function caricaDatiAzienda() {
  const { data, error } = await supabase
    .from("azienda")
    .select("*")
    .single();

  if (error) {
    console.error("Errore nel caricamento dati azienda:", error);
    return null;
  }

  return data;
}

// Salva i dati aziendali
export async function salvaDatiAzienda(dati: {
  ragione_sociale: string;
  partita_iva: string;
  sede_legale: string;
  telefono: string;
  email: string;
  logo_url?: string;
  font_size_list?: number;
  font_size_quote?: number;
  font_size_client?: number;
  font_size_settings?: number;
  font_size_custom_quote?: number;
  font_size_clone?: number;
  font_size_edit_number?: number;
}) {
  // Prima controlla se esiste già un record
  const { data: existing } = await supabase
    .from("azienda")
    .select("id")
    .single();

  if (existing) {
    // Aggiorna
    const { error } = await supabase
      .from("azienda")
      .update(dati)
      .eq("id", existing.id);

    if (error) {
      console.error("Errore nell'aggiornamento dati azienda:", error);
      throw error;
    }
  } else {
    // Inserisci
    const { error } = await supabase
      .from("azienda")
      .insert(dati);

    if (error) {
      console.error("Errore nell'inserimento dati azienda:", error);
      throw error;
    }
  }
}

// Carica il logo dallo storage
export async function caricaLogo(file: File): Promise<string> {
  // Elimina il vecchio logo se esiste
  const { data: oldFiles } = await supabase.storage
    .from("loghi")
    .list();

  if (oldFiles && oldFiles.length > 0) {
    await supabase.storage
      .from("loghi")
      .remove(oldFiles.map(f => f.name));
  }

  // Carica il nuovo logo
  const fileName = `logo-${Date.now()}.${file.name.split('.').pop()}`;
  const { error } = await supabase.storage
    .from("loghi")
    .upload(fileName, file);

  if (error) {
    console.error("Errore nel caricamento logo:", error);
    throw error;
  }

  // Ottieni l'URL pubblico
  const { data } = supabase.storage
    .from("loghi")
    .getPublicUrl(fileName);

  return data.publicUrl;
}

// Elimina il logo
export async function eliminaLogo() {
  const { data: files } = await supabase.storage
    .from("loghi")
    .list();

  if (files && files.length > 0) {
    await supabase.storage
      .from("loghi")
      .remove(files.map(f => f.name));
  }
}

// Carica tutti i preventivi con i dati del cliente
export async function caricaPreventivi() {
  const { data, error } = await supabase
    .from("preventivi")
    .select(`
      *,
      clienti (
        nome_ragione_sociale,
        via,
        citta,
        provincia
      )
    `)
    .order("anno", { ascending: false })
    .order("numero", { ascending: false });

  if (error) {
    console.error("Errore nel caricamento preventivi:", error);
    return [];
  }

  return data || [];
}

// Salva un nuovo preventivo
export async function salvaPreventivo(preventivo: any) {
  const { data, error } = await supabase
    .from("preventivi")
    .insert(preventivo)
    .select()
    .single();

  if (error) {
    console.error("Errore nel salvataggio preventivo:", error);
    throw error;
  }

  return data;
}

// Aggiorna un preventivo
export async function aggiornaPreventivo(id: string, preventivo: any) {
  const { error } = await supabase
    .from("preventivi")
    .update(preventivo)
    .eq("id", id);

  if (error) {
    console.error("Errore nell'aggiornamento preventivo:", error);
    throw error;
  }
}

// Elimina un preventivo
export async function eliminaPreventivo(id: string) {
  const { error } = await supabase
    .from("preventivi")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Errore nell'eliminazione preventivo:", error);
    throw error;
  }
}

// Salva o aggiorna un cliente
export async function salvaCliente(cliente: any) {
  const { data, error } = await supabase
    .from("clienti")
    .upsert(cliente)
    .select()
    .single();

  if (error) {
    console.error("Errore nel salvataggio cliente:", error);
    throw error;
  }

  return data;
}

// Salva le righe di un preventivo
export async function salvaRighePreventivo(preventivo_id: string, righe: any[]) {
  // Prima elimina le righe esistenti
  await supabase
    .from("righe_preventivo")
    .delete()
    .eq("preventivo_id", preventivo_id);

  // Poi inserisci le nuove righe
  const { error } = await supabase
    .from("righe_preventivo")
    .insert(righe.map((r, i) => ({
      ...r,
      preventivo_id,
      numero_riga: i + 1
    })));

  if (error) {
    console.error("Errore nel salvataggio righe preventivo:", error);
    throw error;
  }
}
