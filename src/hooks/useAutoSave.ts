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
  const isFirstRun = useRef(true);
  const lastSavedData = useRef<string>("");
  const hasInitialSave = useRef(false);

  // Aggiorna il cacheId se viene passato dall'esterno
  useEffect(() => {
    if (cacheId && cacheId !== currentCacheIdRef.current) {
      currentCacheIdRef.current = cacheId;
      console.log("CacheId aggiornato dall'esterno:", cacheId);
    }
  }, [cacheId]);

  const save = useCallback(async () => {
    if (!enabled) return;

    if (!data.numero || !data.anno) {
      console.log("Auto-save: numero o anno mancanti, salvataggio rimandato");
      return;
    }

    try {
      const currentDataString = JSON.stringify(data);

      if (currentDataString === lastSavedData.current) {
        return;
      }

      console.log("Auto-save: usando cacheId:", currentCacheIdRef.current);

      const id = await salvaCachePreventivo({
        ...data,
        id: currentCacheIdRef.current,
      });

      if (!currentCacheIdRef.current) {
        currentCacheIdRef.current = id;
        console.log("Auto-save: nuovo cacheId assegnato:", id);
      }

      lastSavedData.current = currentDataString;
      hasInitialSave.current = true;

      console.log("Auto-save completato:", id, new Date().toLocaleTimeString());
    } catch (error) {
      console.error("Errore auto-save:", error);
    }
  }, [data, enabled]);

  useEffect(() => {
    if (saveImmediately && enabled && !hasInitialSave.current && data.numero && data.anno) {
      console.log("Auto-save: salvataggio immediato iniziale");
      save();
    }
  }, [saveImmediately, enabled, data.numero, data.anno, save]);

  useEffect(() => {
    if (isFirstRun.current && !saveImmediately) {
      isFirstRun.current = false;
      return;
    }

    if (!enabled) return;

    if (!data.numero || !data.anno) {
      return;
    }

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
  }, [save, delay, enabled, data, saveImmediately]);

  useEffect(() => {
    return () => {
      if (enabled && data.numero && data.anno && currentCacheIdRef.current && hasInitialSave.current) {
        const currentDataString = JSON.stringify(data);
        if (currentDataString !== lastSavedData.current) {
          salvaCachePreventivo({
            ...data,
            id: currentCacheIdRef.current,
          }).catch((err) => console.error("Errore salvataggio finale:", err));
        }
      }
    };
  }, [data, enabled]);

  return {
    cacheId: currentCacheIdRef.current,
    saveNow: save,
  };
}
