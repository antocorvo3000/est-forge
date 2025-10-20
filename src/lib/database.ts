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
  numero_progressivo_iniziale?: number;
  numerazione_progressiva_attiva?: boolean;
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

// ===== GESTIONE CACHE PREVENTIVI =====

// Salva o aggiorna nella cache
export async function salvaCachePreventivo(dati: {
  id?: string;
  numero?: number;
  anno?: number;
  cliente_id?: string;
  oggetto?: string;
  ubicazione_via?: string;
  ubicazione_citta?: string;
  ubicazione_provincia?: string;
  ubicazione_cap?: string;
  subtotale?: number;
  sconto_percentuale?: number;
  sconto_valore?: number;
  totale?: number;
  note?: string;
  modalita_pagamento?: string;
  stato?: string;
  tipo_operazione: 'creazione' | 'modifica' | 'clonazione';
  preventivo_originale_id?: string;
  righe?: any[];
  dati_cliente?: any;
}) {
  const cacheData: any = {
    numero: dati.numero,
    anno: dati.anno,
    cliente_id: dati.cliente_id,
    oggetto: dati.oggetto,
    ubicazione_via: dati.ubicazione_via,
    ubicazione_citta: dati.ubicazione_citta,
    ubicazione_provincia: dati.ubicazione_provincia,
    ubicazione_cap: dati.ubicazione_cap,
    subtotale: dati.subtotale,
    sconto_percentuale: dati.sconto_percentuale,
    sconto_valore: dati.sconto_valore,
    totale: dati.totale,
    note: dati.note,
    modalita_pagamento: dati.modalita_pagamento,
    stato: dati.stato,
    tipo_operazione: dati.tipo_operazione,
    preventivo_originale_id: dati.preventivo_originale_id,
    righe: dati.righe ? JSON.stringify(dati.righe) : null,
    dati_cliente: dati.dati_cliente ? JSON.stringify(dati.dati_cliente) : null,
  };

  // Se c'è un ID specifico, aggiorna quel record
  if (dati.id) {
    const { error } = await supabase
      .from("preventivi_cache")
      .update(cacheData)
      .eq("id", dati.id);

    if (error) {
      console.error("Errore aggiornamento cache:", error);
      throw error;
    }
    return dati.id;
  }
  
  // Per modifiche, cerca per preventivo_originale_id e tipo_operazione
  if (dati.tipo_operazione === 'modifica' && dati.preventivo_originale_id) {
    const { data: existing, error: searchError } = await supabase
      .from("preventivi_cache")
      .select("id")
      .eq("preventivo_originale_id", dati.preventivo_originale_id)
      .eq("tipo_operazione", "modifica")
      .maybeSingle();

    if (searchError) {
      console.error("Errore ricerca cache esistente per modifica:", searchError);
    }

    // Se esiste, aggiorna quel record
    if (existing) {
      const { error } = await supabase
        .from("preventivi_cache")
        .update(cacheData)
        .eq("id", existing.id);

      if (error) {
        console.error("Errore aggiornamento cache modifica esistente:", error);
        throw error;
      }
      return existing.id;
    }
  }
  
  // Per creazioni e clonazioni, se numero e anno sono presenti cerca per quelli
  if (dati.numero && dati.anno && (dati.tipo_operazione === 'creazione' || dati.tipo_operazione === 'clonazione')) {
    const { data: existing, error: searchError } = await supabase
      .from("preventivi_cache")
      .select("id")
      .eq("numero", dati.numero)
      .eq("anno", dati.anno)
      .eq("tipo_operazione", dati.tipo_operazione)
      .maybeSingle();

    if (searchError) {
      console.error("Errore ricerca cache esistente:", searchError);
    }

    // Se esiste, aggiorna quel record
    if (existing) {
      const { error } = await supabase
        .from("preventivi_cache")
        .update(cacheData)
        .eq("id", existing.id);

      if (error) {
        console.error("Errore aggiornamento cache esistente:", error);
        throw error;
      }
      return existing.id;
    }
  }

  // Altrimenti inserisci un nuovo record
  const { data, error } = await supabase
    .from("preventivi_cache")
    .insert(cacheData)
    .select("id")
    .single();

  if (error) {
    console.error("Errore inserimento cache:", error);
    throw error;
  }
  return data.id;
}

// Carica tutti i preventivi dalla cache
export async function caricaCachePreventivi() {
  const { data, error } = await supabase
    .from("preventivi_cache")
    .select("*")
    .order("aggiornato_il", { ascending: false });

  if (error) {
    console.error("Errore caricamento cache:", error);
    return [];
  }

  return (data || []).map(item => ({
    ...item,
    righe: item.righe ? JSON.parse(item.righe as string) : [],
    dati_cliente: item.dati_cliente ? JSON.parse(item.dati_cliente as string) : null,
  }));
}

// Carica un preventivo dalla cache
export async function caricaCachePreventivo(id: string) {
  const { data, error } = await supabase
    .from("preventivi_cache")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error("Errore caricamento cache preventivo:", error);
    return null;
  }

  return {
    ...data,
    righe: data.righe ? JSON.parse(data.righe as string) : [],
    dati_cliente: data.dati_cliente ? JSON.parse(data.dati_cliente as string) : null,
  };
}

// Elimina dalla cache
export async function eliminaCachePreventivo(id: string) {
  const { error } = await supabase
    .from("preventivi_cache")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Errore eliminazione cache:", error);
    throw error;
  }
}

// Elimina dalla cache per ID preventivo originale (quando si salva)
export async function eliminaCachePerPreventivoOriginale(preventivoId: string) {
  const { error } = await supabase
    .from("preventivi_cache")
    .delete()
    .eq("preventivo_originale_id", preventivoId);

  if (error) {
    console.error("Errore eliminazione cache per preventivo originale:", error);
    throw error;
  }
}
