import { useEffect, useRef, useCallback } from 'react';
import { salvaCachePreventivo } from '@/lib/database';

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
  tipo_operazione: 'creazione' | 'modifica' | 'clonazione';
  preventivo_originale_id?: string;
  righe?: any[];
  dati_cliente?: any;
}

interface UseAutoSaveOptions {
  data: AutoSaveData;
  enabled?: boolean;
  delay?: number; // millisecondi
  cacheId?: string; // ID esistente della cache
}

export function useAutoSave({ data, enabled = true, delay = 2000, cacheId }: UseAutoSaveOptions) {
  const timeoutRef = useRef<NodeJS.Timeout>();
  const currentCacheIdRef = useRef<string | undefined>(cacheId);
  const isFirstRun = useRef(true);

  const save = useCallback(async () => {
    if (!enabled) return;

    try {
      const id = await salvaCachePreventivo({
        ...data,
        id: currentCacheIdRef.current,
      });
      
      // Salva l'ID per gli aggiornamenti successivi
      if (!currentCacheIdRef.current) {
        currentCacheIdRef.current = id;
      }
      
      console.log('Auto-save completato:', id);
    } catch (error) {
      console.error('Errore auto-save:', error);
    }
  }, [data, enabled]);

  useEffect(() => {
    // Skip il primo render per evitare salvataggi inutili
    if (isFirstRun.current) {
      isFirstRun.current = false;
      return;
    }

    if (!enabled) return;

    // Cancella il timeout precedente
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Imposta un nuovo timeout
    timeoutRef.current = setTimeout(() => {
      save();
    }, delay);

    // Cleanup
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [save, delay, enabled]);

  return {
    cacheId: currentCacheIdRef.current,
    saveNow: save,
  };
}
