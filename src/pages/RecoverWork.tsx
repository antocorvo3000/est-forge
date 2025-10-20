import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, CheckSquare, X, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CompanyHeader } from "@/components/CompanyHeader";
import { CachedWorkItem } from "@/components/CachedWorkItem";
import { useCompanySettings } from "@/hooks/useCompanySettings";
import { caricaCachePreventivi, eliminaCachePreventivo } from "@/lib/database";
import { toast } from "@/lib/toast";
import { format } from "date-fns";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface CachedWork {
  id: string;
  numero?: number;
  anno?: number;
  oggetto?: string;
  tipo_operazione: string;
  preventivo_originale_id?: string;
  righe: any[];
  dati_cliente: any;
  totale?: number;
  aggiornato_il: string;
}

const RecoverWork = () => {
  const navigate = useNavigate();
  const { settings } = useCompanySettings();
  const [cachedWorks, setCachedWorks] = useState<CachedWork[]>([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedWorks, setSelectedWorks] = useState<Set<string>>(new Set());
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    workId?: string;
  }>({ open: false });
  const [infoDialog, setInfoDialog] = useState<{
    open: boolean;
    work?: CachedWork;
  }>({ open: false });
  const [infoWorkId, setInfoWorkId] = useState<string | null>(null);

  useEffect(() => {
    loadCachedWorks();
  }, []);

  const loadCachedWorks = async () => {
    const works = await caricaCachePreventivi();
    setCachedWorks(works);
  };

  const handleRecover = (work: CachedWork) => {
    // Naviga alla pagina di modifica con i dati dalla cache
    navigate(`/modify-quote/${work.preventivo_originale_id || 'new'}`, {
      state: {
        fromCache: true,
        cacheId: work.id,
        cacheData: work
      }
    });
  };

  const handleDeleteClick = (workId: string) => {
    setDeleteDialog({ open: true, workId });
  };

  const handleDeleteConfirm = async () => {
    if (deleteDialog.workId) {
      try {
        await eliminaCachePreventivo(deleteDialog.workId);
        await loadCachedWorks();
        toast.success("Lavoro interrotto eliminato");
        setDeleteDialog({ open: false });
      } catch (error) {
        toast.error("Errore durante l'eliminazione");
      }
    }
  };

  const handleShowInfo = (work: CachedWork) => {
    setInfoDialog({ open: true, work });
  };

  const handleToggleSelection = () => {
    setIsSelectionMode(!isSelectionMode);
    setSelectedWorks(new Set());
  };

  const handleSelectWork = (workId: string) => {
    const newSelected = new Set(selectedWorks);
    if (newSelected.has(workId)) {
      newSelected.delete(workId);
    } else {
      newSelected.add(workId);
    }
    setSelectedWorks(newSelected);
  };

  const handleDeselectAll = () => {
    setSelectedWorks(new Set());
    setIsSelectionMode(false);
  };

  const handleDeleteSelected = async () => {
    try {
      await Promise.all(Array.from(selectedWorks).map(id => eliminaCachePreventivo(id)));
      toast.success(`${selectedWorks.size} lavor${selectedWorks.size === 1 ? 'o eliminato' : 'i eliminati'}`);
      await loadCachedWorks();
      setSelectedWorks(new Set());
      setIsSelectionMode(false);
    } catch (error) {
      toast.error("Errore durante l'eliminazione");
    }
  };

  const getTipoOperazioneLabel = (tipo: string) => {
    switch (tipo) {
      case 'creazione': return 'Creazione';
      case 'modifica': return 'Modifica';
      case 'clonazione': return 'Clonazione';
      default: return tipo;
    }
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 sm:py-6 w-full flex-1 flex flex-col gap-3 sm:gap-4 overflow-hidden">
        <CompanyHeader />

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass rounded-2xl p-3 sm:p-4 flex items-center gap-3 mb-2"
        >
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/")}
            className="h-10 w-10"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-3xl font-extrabold tracking-tight">Recupera Lavoro Interrotto</h1>
        </motion.div>

        <motion.main
          initial={{ opacity: 0, y: 10 }}
          animate={{ 
            opacity: 1, 
            y: 0,
            transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] }
          }}
          className="glass rounded-2xl p-3 sm:p-4 flex-1 overflow-hidden flex flex-col"
          style={{
            willChange: 'auto'
          }}
        >
          <motion.div 
            className="space-y-2 sm:space-y-3 overflow-y-auto scrollbar-thin pr-2 flex-1"
            layout
            transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
          >
            {cachedWorks.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="text-center py-12 text-muted-foreground"
              >
                Nessun lavoro interrotto trovato. I lavori vengono salvati automaticamente durante la creazione, modifica o clonazione di un preventivo.
              </motion.div>
            ) : (
              <AnimatePresence mode="popLayout">
                {cachedWorks.map((work, index) => (
                  <CachedWorkItem
                    key={work.id}
                    work={work}
                    index={index}
                    onRecover={handleRecover}
                    onDelete={handleDeleteClick}
                    onInfo={handleShowInfo}
                    fontSize={settings.fontSizeList}
                    isSelectionMode={isSelectionMode}
                    isSelected={selectedWorks.has(work.id)}
                    onSelect={() => handleSelectWork(work.id)}
                    showInfo={infoWorkId === work.id}
                    onInfoToggle={() => setInfoWorkId(infoWorkId === work.id ? null : work.id)}
                    onMouseLeave={() => setInfoWorkId(null)}
                  />
                ))}
              </AnimatePresence>
            )}
          </motion.div>
        </motion.main>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
          className="flex justify-start gap-3"
        >
          <AnimatePresence mode="wait">
            {selectedWorks.size === 0 ? (
              <motion.div
                key="select-btn"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2 }}
              >
                <Button
                  onClick={handleToggleSelection}
                  variant={isSelectionMode ? "secondary" : "default"}
                  className="h-11 gap-2 shadow-lg"
                >
                  <CheckSquare className="w-5 h-5" />
                  <span>Seleziona lavori</span>
                </Button>
              </motion.div>
            ) : (
              <motion.div
                key="action-btns"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2 }}
                className="flex gap-3"
              >
                <Button
                  onClick={handleDeselectAll}
                  variant="outline"
                  className="h-11 gap-2 shadow-lg"
                >
                  <X className="w-5 h-5" />
                  <span>Deseleziona tutti</span>
                </Button>
                <Button
                  onClick={handleDeleteSelected}
                  variant="destructive"
                  className="h-11 gap-2 shadow-lg"
                >
                  <Trash2 className="w-5 h-5" />
                  <span>Elimina selezionati ({selectedWorks.size})</span>
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Conferma eliminazione</AlertDialogTitle>
            <AlertDialogDescription>
              Sei sicuro di voler eliminare questo lavoro interrotto? Questa azione non può essere annullata.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm}>
              Elimina
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={infoDialog.open} onOpenChange={(open) => setInfoDialog({ open, work: undefined })}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Informazioni Lavoro Interrotto</DialogTitle>
          </DialogHeader>
          {infoDialog.work && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Informazioni Generali</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {infoDialog.work.numero && infoDialog.work.anno && (
                    <div>
                      <span className="text-muted-foreground">Numero:</span>{' '}
                      <span className="font-medium">{String(infoDialog.work.numero).padStart(2, '0')}-{infoDialog.work.anno}</span>
                    </div>
                  )}
                  <div>
                    <span className="text-muted-foreground">Tipo:</span>{' '}
                    <span className="font-medium">{getTipoOperazioneLabel(infoDialog.work.tipo_operazione)}</span>
                  </div>
                  {infoDialog.work.oggetto && (
                    <div className="col-span-2">
                      <span className="text-muted-foreground">Oggetto:</span>{' '}
                      <span className="font-medium">{infoDialog.work.oggetto}</span>
                    </div>
                  )}
                  <div className="col-span-2">
                    <span className="text-muted-foreground">Ultimo salvataggio:</span>{' '}
                    <span className="font-medium">{format(new Date(infoDialog.work.aggiornato_il), 'dd/MM/yyyy HH:mm:ss')}</span>
                  </div>
                </div>
              </div>

              {infoDialog.work.dati_cliente && (
                <div>
                  <h3 className="font-semibold mb-2">Cliente</h3>
                  <div className="text-sm space-y-1">
                    {infoDialog.work.dati_cliente.nome_ragione_sociale && (
                      <p><span className="text-muted-foreground">Nome:</span> {infoDialog.work.dati_cliente.nome_ragione_sociale}</p>
                    )}
                    {infoDialog.work.dati_cliente.via && (
                      <p><span className="text-muted-foreground">Indirizzo:</span> {infoDialog.work.dati_cliente.via}</p>
                    )}
                    {infoDialog.work.dati_cliente.citta && (
                      <p>
                        <span className="text-muted-foreground">Città:</span>{' '}
                        {infoDialog.work.dati_cliente.citta}
                        {infoDialog.work.dati_cliente.provincia && ` (${infoDialog.work.dati_cliente.provincia})`}
                      </p>
                    )}
                  </div>
                </div>
              )}

              <div>
                <h3 className="font-semibold mb-2">Riepilogo Economico</h3>
                <div className="text-sm space-y-1">
                  {infoDialog.work.totale !== undefined && (
                    <p className="text-lg font-bold text-primary">Totale: €{infoDialog.work.totale.toFixed(2)}</p>
                  )}
                  <p><span className="text-muted-foreground">Righe:</span> {infoDialog.work.righe?.length || 0}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RecoverWork;
