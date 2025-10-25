import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, Download, Printer, ZoomIn, ZoomOut, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/lib/toast";
import { generateQuotePDF } from "@/lib/pdfGenerator";
import type { CompanySettings } from "@/types/companySettings";

// PDF viewer
import { Worker, Viewer } from "@react-pdf-viewer/core";
import { zoomPlugin } from "@react-pdf-viewer/zoom";
import "@react-pdf-viewer/core/lib/styles/index.css";
import "@react-pdf-viewer/zoom/lib/styles/index.css";
import "./pdf-transparent.css"; // solo per BG trasparente (niente height!)

interface QuoteData {
  numero: number;
  anno: number;
  oggetto: string;
  cliente: {
    nome: string;
    taxCode?: string;
    address?: string;
    city?: string;
    province?: string;
    zip?: string;
    phone?: string;
    email?: string;
  };
  ubicazione: { via: string; citta: string; provincia: string; cap: string };
  righe: Array<{
    descrizione: string;
    unita_misura: string;
    quantita: number;
    prezzo_unitario: number;
    totale: number;
  }>;
  subtotale: number;
  sconto_percentuale?: number;
  sconto_valore?: number;
  totale: number;
  note?: string;
  modalita_pagamento?: string;
  showDiscountInTable: boolean;
}

const PdfPreview = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [loading, setLoading] = useState(true);
  const [quoteData, setQuoteData] = useState<QuoteData | null>(null);
  const [settings, setSettings] = useState<CompanySettings | null>(null);
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string>("");
  const [returnPath, setReturnPath] = useState<string>("/");

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // zoom plugin (per i pulsanti esterni)
  const zoomPluginInstance = zoomPlugin();
  const { zoomTo } = zoomPluginInstance;

  useEffect(() => {
    const data = location.state?.quoteData as QuoteData;
    const companySettings = location.state?.settings as CompanySettings;
    const fromPath = location.state?.from as string;

    if (fromPath) setReturnPath(fromPath);

    if (!data || !companySettings) {
      toast.error("Nessun dato disponibile per generare il PDF");
      navigate("/");
      return;
    }

    setQuoteData(data);
    setSettings(companySettings);

    (async () => {
      try {
        const pdf = await generateQuotePDF(data, companySettings);
        // (se disponibile) ricava n. pagine
        try {
          const n = pdf.getNumberOfPages?.();
          if (typeof n === "number") setTotalPages(n);
        } catch {}

        const blob = pdf.output("blob");
        const url = URL.createObjectURL(new Blob([blob], { type: "application/pdf" }));
        setPdfBlobUrl(url);
        setLoading(false);
      } catch (err) {
        console.error("Errore generazione PDF:", err);
        toast.error("Errore durante la generazione del PDF");
        navigate(-1);
      }
    })();

    return () => {
      if (pdfBlobUrl) URL.revokeObjectURL(pdfBlobUrl);
    };
  }, [location.state, navigate]);

  const handleSave = () => {
    if (!pdfBlobUrl || !quoteData) return;
    const a = document.createElement("a");
    a.href = pdfBlobUrl;
    a.download = `Preventivo_${quoteData.numero.toString().padStart(2, "0")}-${quoteData.anno}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    toast.success("PDF salvato con successo");
  };

  const handlePrint = () => {
    if (!pdfBlobUrl) return;
    const w = window.open(pdfBlobUrl, "_blank");
    if (!w) return toast.error("Sblocca i popup per stampare");
    w.addEventListener("load", () => {
      w.focus();
      w.print();
    });
    toast.success("Invio alla stampante...");
  };

  // zoom esterno
  const handleZoomIn = () => zoomTo((s) => s + 0.25);
  const handleZoomOut = () => zoomTo((s) => Math.max(0.5, s - 0.25));

  const handleGoBack = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigate(returnPath, { replace: true });
  };

  const workerUrl = "https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js";

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-lg">Generazione PDF in corso...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-2xl p-3 sm:p-4 flex items-center gap-3 mb-6"
        >
          <Button variant="ghost" size="icon" onClick={handleGoBack} className="h-10 w-10">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-3xl font-extrabold tracking-tight">Genera PDF Preventivo</h1>
        </motion.div>

        <div className="flex gap-6">
          {/* ⬇️ Widget PDF: IDENTICO a prima, con scroll interno e altezza fissa */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex-1 glass rounded-2xl p-4 overflow-hidden flex flex-col min-h-0" // <- min-h-0 per consentire lo scroll del figlio
            style={{ maxHeight: "calc(100vh - 180px)" }}
          >
            {/* Contenitore scrollabile (interno al widget) */}
            <div className="flex justify-center overflow-y-auto scrollbar-thin pr-2 flex-1 min-h-0">
              {pdfBlobUrl ? (
                <div className="w-full flex flex-col items-center">
                  <Worker workerUrl={workerUrl}>
                    <Viewer
                      fileUrl={pdfBlobUrl}
                      plugins={[zoomPluginInstance]}
                      // Mostra la PRIMA PAGINA intera nel widget
                      defaultScale="page-fit"
                      // aggiorna tot pagine/corrente
                      onDocumentLoad={(e) => setTotalPages(e.doc.numPages)}
                      onPageChange={(e) => setCurrentPage(e.currentPage + 1)}
                    />
                  </Worker>
                </div>
              ) : (
                <div className="text-gray-500 text-sm">⚠️ PDF non disponibile</div>
              )}
            </div>
          </motion.div>

          {/* Pannello comandi (come prima) */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="w-20 flex flex-col gap-3 sticky top-4"
          >
            <Button
              onClick={handleSave}
              className="h-16 w-full flex flex-col items-center justify-center gap-1 text-xs"
              title="Salva PDF"
            >
              <Download className="w-5 h-5" />
              <span>Salva</span>
            </Button>

            <Button
              onClick={handlePrint}
              className="h-16 w-full flex flex-col items-center justify-center gap-1 text-xs"
              title="Stampa PDF"
            >
              <Printer className="w-5 h-5" />
              <span>Stampa</span>
            </Button>

            <Button
              onClick={handleZoomIn}
              variant="outline"
              className="h-24 w-full flex flex-col items-center justify-center gap-1 text-xs px-1"
              title="Zoom In"
            >
              <ZoomIn className="w-5 h-5" />
              <span className="text-center leading-tight whitespace-normal">Zoom avanti</span>
            </Button>

            <Button
              onClick={handleZoomOut}
              variant="outline"
              className="h-24 w-full flex flex-col items-center justify-center gap-1 text-xs px-1"
              title="Zoom Out"
            >
              <ZoomOut className="w-5 h-5" />
              <span className="text-center leading-tight whitespace-normal">Zoom indietro</span>
            </Button>

            <Button
              variant="outline"
              className="h-16 w-full flex flex-col items-center justify-center gap-1 text-xs cursor-default pointer-events-none"
            >
              <span className="font-semibold">Pagina</span>
              <span>
                {currentPage} / {totalPages}
              </span>
            </Button>

            {/* (Opzionale) Navigazione frecce disabilitata graficamente, lasciata per simmetria UI */}
            <Button
              variant="outline"
              className="h-14 w-full flex items-center justify-center text-xs cursor-default pointer-events-none"
            >
              <ChevronLeft className="w-0 h-0 opacity-0" />
              <span className="text-center leading-tight"> </span>
              <ChevronRight className="w-0 h-0 opacity-0" />
            </Button>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default PdfPreview;
