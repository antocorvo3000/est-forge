import { useEffect, useRef, useCallback } from "react";
import { salvaCachePreventivo } from "@/lib/database";

interface AutoSaveData {
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
}

interface UseAutoSaveOptions {
  data: AutoSaveData;
  enabled?: boolean;
  delay?: number;
  cacheId?: string;
  saveImmediately?: boolean;
}

export function useAutoSave({
  data,
  enabled = true,
  delay = 2000,
  cacheId,
  saveImmediately = false,
}: UseAutoSaveOptions) {
  const timeoutRef = useRef<NodeJS.Timeout>();
  const currentCacheIdRef = useRef<string | undefined>(cacheId);
  const lastSavedData = useRef<string>("");
  const isSavingRef = useRef(false);

  // Quando viene passato un cacheId dall'esterno, lo impostiamo subito
  useEffect(() => {
    if (cacheId && !currentCacheIdRef.current) {
      currentCacheIdRef.current = cacheId;
      console.log("[useAutoSave] CacheId impostato dall'esterno:", cacheId);
    }
  }, [cacheId]);

  const save = useCallback(async () => {
    if (!enabled) return;
    if (isSavingRef.current) return;

    if (!data.numero || !data.anno) {
      console.log("[useAutoSave] Numero o anno mancanti, skip");
      return;
    }

    const currentDataString = JSON.stringify(data);
    if (currentDataString === lastSavedData.current) {
      return;
    }

    try {
      isSavingRef.current = true;

      console.log("[useAutoSave] Salvataggio con ID:", currentCacheIdRef.current || "nuovo");

      const returnedId = await salvaCachePreventivo({
        ...data,
        id: currentCacheIdRef.current,
      });

      // Se non avevamo un ID, lo salviamo
      if (!currentCacheIdRef.current && returnedId) {
        currentCacheIdRef.current = returnedId;
        console.log("[useAutoSave] Nuovo ID assegnato:", returnedId);
      }

      lastSavedData.current = currentDataString;
      console.log("[useAutoSave] Completato:", currentCacheIdRef.current, new Date().toLocaleTimeString());
    } catch (error) {
      console.error("[useAutoSave] Errore:", error);
    } finally {
      isSavingRef.current = false;
    }
  }, [data, enabled]);

  // Salvataggio immediato se richiesto
  useEffect(() => {
    if (saveImmediately && enabled && data.numero && data.anno) {
      console.log("[useAutoSave] Salvataggio immediato");
      save();
    }
  }, [saveImmediately, enabled, data.numero, data.anno, save]);

  // Auto-save con delay
  useEffect(() => {
    if (!enabled || !data.numero || !data.anno) return;

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      save();
    }, delay);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [data, delay, enabled, save]);

  // Salvataggio finale quando il componente si smonta
  useEffect(() => {
    return () => {
      if (enabled && data.numero && data.anno && currentCacheIdRef.current) {
        const currentDataString = JSON.stringify(data);
        if (currentDataString !== lastSavedData.current) {
          console.log("[useAutoSave] Salvataggio finale unmount");
          salvaCachePreventivo({
            ...data,
            id: currentCacheIdRef.current,
          }).catch((err) => console.error("[useAutoSave] Errore salvataggio finale:", err));
        }
      }
    };
  }, []);

  return {
    cacheId: currentCacheIdRef.current,
    saveNow: save,
  };
}
