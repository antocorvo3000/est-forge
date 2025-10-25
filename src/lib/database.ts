import { supabase } from "@/integrations/supabase/client";

// Carica i dati aziendali
export async function caricaDatiAzienda() {
  const { data, error } = await supabase.from("azienda").select("*").single();

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
  const { data: existing } = await supabase.from("azienda").select("id").single();

  if (existing) {
    const { error } = await supabase.from("azienda").update(dati).eq("id", existing.id);

    if (error) {
      console.error("Errore nell'aggiornamento dati azienda:", error);
      throw error;
    }
  } else {
    const { error } = await supabase.from("azienda").insert(dati);

    if (error) {
      console.error("Errore nell'inserimento dati azienda:", error);
      throw error;
    }
  }
}

// Carica il logo dallo storage
export async function caricaLogo(file: File): Promise<string> {
  const { data: oldFiles } = await supabase.storage.from("loghi").list();

  if (oldFiles && oldFiles.length > 0) {
    await supabase.storage.from("loghi").remove(oldFiles.map((f) => f.name));
  }

  const fileName = `logo-${Date.now()}.${file.name.split(".").pop()}`;
  const { error } = await supabase.storage.from("loghi").upload(fileName, file);

  if (error) {
    console.error("Errore nel caricamento logo:", error);
    throw error;
  }

  const { data } = supabase.storage.from("loghi").getPublicUrl(fileName);

  return data.publicUrl;
}

// Elimina il logo
export async function eliminaLogo() {
  const { data: files } = await supabase.storage.from("loghi").list();

  if (files && files.length > 0) {
    await supabase.storage.from("loghi").remove(files.map((f) => f.name));
  }
}

// Carica tutti i preventivi con i dati del cliente
export async function caricaPreventivi() {
  const { data, error } = await supabase
    .from("preventivi")
    .select(
      `
      *,
      clienti (
        nome_ragione_sociale,
        via,
        citta,
        provincia
      )
    `,
    )
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
  const { data, error } = await supabase.from("preventivi").insert(preventivo).select().single();

  if (error) {
    console.error("Errore nel salvataggio preventivo:", error);
    throw error;
  }

  return data;
}

// Aggiorna un preventivo
export async function aggiornaPreventivo(id: string, preventivo: any) {
  const { error } = await supabase.from("preventivi").update(preventivo).eq("id", id);

  if (error) {
    console.error("Errore nell'aggiornamento preventivo:", error);
    throw error;
  }
}

// Elimina un preventivo
export async function eliminaPreventivo(id: string) {
  const { error } = await supabase.from("preventivi").delete().eq("id", id);

  if (error) {
    console.error("Errore nell'eliminazione preventivo:", error);
    throw error;
  }
}

// Salva o aggiorna un cliente
export async function salvaCliente(cliente: any) {
  const { data, error } = await supabase.from("clienti").upsert(cliente).select().single();

  if (error) {
    console.error("Errore nel salvataggio cliente:", error);
    throw error;
  }

  return data;
}

// Salva le righe di un preventivo
export async function salvaRighePreventivo(preventivo_id: string, righe: any[]) {
  await supabase.from("righe_preventivo").delete().eq("preventivo_id", preventivo_id);

  const { error } = await supabase.from("righe_preventivo").insert(
    righe.map((r, i) => ({
      ...r,
      preventivo_id,
      numero_riga: i + 1,
    })),
  );

  if (error) {
    console.error("Errore nel salvataggio righe preventivo:", error);
    throw error;
  }
}

// ===== GESTIONE CACHE PREVENTIVI =====

// Salva o aggiorna nella cache - LOGICA RISCRITTA
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
  tipo_operazione: "creazione" | "modifica" | "clonazione";
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

  console.log("[salvaCachePreventivo] Inizio con ID:", dati.id);

  // CASO 1: Se è passato un ID specifico, aggiorna SOLO quel record
  if (dati.id) {
    console.log("[salvaCachePreventivo] Aggiornamento record esistente:", dati.id);
    const { error } = await supabase.from("preventivi_cache").update(cacheData).eq("id", dati.id);

    if (error) {
      console.error("Errore aggiornamento cache:", error);
      throw error;
    }
    return dati.id;
  }

  // CASO 2: Nessun ID passato, cerca record esistente
  let existingId: string | null = null;

  if (dati.tipo_operazione === "modifica" && dati.preventivo_originale_id) {
    // Per MODIFICA: cerca per preventivo_originale_id
    console.log("[salvaCachePreventivo] Ricerca modifica per preventivo_originale_id:", dati.preventivo_originale_id);

    const { data: existing, error: searchError } = await supabase
      .from("preventivi_cache")
      .select("id")
      .eq("preventivo_originale_id", dati.preventivo_originale_id)
      .eq("tipo_operazione", "modifica")
      .maybeSingle();

    if (searchError) {
      console.error("Errore ricerca modifica:", searchError);
    }

    if (existing) {
      existingId = existing.id;
      console.log("[salvaCachePreventivo] Trovato record modifica esistente:", existingId);
    }
  } else if (
    (dati.tipo_operazione === "creazione" || dati.tipo_operazione === "clonazione") &&
    dati.numero &&
    dati.anno
  ) {
    // Per CREAZIONE e CLONAZIONE: cerca per numero + anno + tipo
    console.log("[salvaCachePreventivo] Ricerca", dati.tipo_operazione, "per numero/anno:", dati.numero, dati.anno);

    const { data: existing, error: searchError } = await supabase
      .from("preventivi_cache")
      .select("id")
      .eq("numero", dati.numero)
      .eq("anno", dati.anno)
      .eq("tipo_operazione", dati.tipo_operazione)
      .maybeSingle();

    if (searchError) {
      console.error("Errore ricerca creazione/clonazione:", searchError);
    }

    if (existing) {
      existingId = existing.id;
      console.log("[salvaCachePreventivo] Trovato record", dati.tipo_operazione, "esistente:", existingId);
    }
  }

  // CASO 3: Se esiste un record, aggiornalo
  if (existingId) {
    console.log("[salvaCachePreventivo] Aggiornamento record trovato:", existingId);
    const { error } = await supabase.from("preventivi_cache").update(cacheData).eq("id", existingId);

    if (error) {
      console.error("Errore aggiornamento cache trovata:", error);
      throw error;
    }
    return existingId;
  }

  // CASO 4: Nessun record esistente, creane uno nuovo
  console.log("[salvaCachePreventivo] Creazione nuovo record");
  const { data, error } = await supabase.from("preventivi_cache").insert(cacheData).select("id").single();

  if (error) {
    console.error("Errore inserimento cache:", error);
    throw error;
  }

  console.log("[salvaCachePreventivo] Nuovo record creato:", data.id);
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

  return (data || []).map((item) => ({
    ...item,
    righe: item.righe ? JSON.parse(item.righe as string) : [],
    dati_cliente: item.dati_cliente ? JSON.parse(item.dati_cliente as string) : null,
  }));
}

// Carica un preventivo dalla cache
export async function caricaCachePreventivo(id: string) {
  const { data, error } = await supabase.from("preventivi_cache").select("*").eq("id", id).single();

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
  const { error } = await supabase.from("preventivi_cache").delete().eq("id", id);

  if (error) {
    console.error("Errore eliminazione cache:", error);
    throw error;
  }
}

// Elimina dalla cache per ID preventivo originale
export async function eliminaCachePerPreventivoOriginale(preventivoId: string) {
  const { error } = await supabase.from("preventivi_cache").delete().eq("preventivo_originale_id", preventivoId);

  if (error) {
    console.error("Errore eliminazione cache per preventivo originale:", error);
    throw error;
  }
}

// Pulisce duplicati (utile per riparare dati già esistenti)
export async function pulisciDuplicatiCache() {
  try {
    const { data: allRecords, error } = await supabase
      .from("preventivi_cache")
      .select("*")
      .order("aggiornato_il", { ascending: false });

    if (error || !allRecords) {
      console.error("Errore caricamento cache per pulizia:", error);
      return;
    }

    const seen = new Map<string, string>();
    const toDelete: string[] = [];

    for (const record of allRecords) {
      let key: string;

      if (record.tipo_operazione === "modifica" && record.preventivo_originale_id) {
        key = `modifica-${record.preventivo_originale_id}`;
      } else if (record.numero && record.anno) {
        key = `${record.tipo_operazione}-${record.numero}-${record.anno}`;
      } else {
        continue;
      }

      if (seen.has(key)) {
        toDelete.push(record.id);
      } else {
        seen.set(key, record.id);
      }
    }

    if (toDelete.length > 0) {
      await supabase.from("preventivi_cache").delete().in("id", toDelete);

      console.log(`Puliti ${toDelete.length} duplicati dalla cache`);
    }
  } catch (error) {
    console.error("Errore pulizia duplicati cache:", error);
  }
}
