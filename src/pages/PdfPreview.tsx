import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, Download, Printer, ZoomIn, ZoomOut, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/lib/toast";
import { generateQuotePDF } from "@/lib/pdfGenerator";
import type { CompanySettings } from "@/types/companySettings";

// PDF viewer (installato con: npm i @react-pdf-viewer/core pdfjs-dist)
import { Worker, Viewer, SpecialZoomLevel } from "@react-pdf-viewer/core";
import "@react-pdf-viewer/core/lib/styles/index.css";

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
  ubicazione: {
    via: string;
    citta: string;
    provincia: string;
    cap: string;
  };
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

  // Stato UI
  const [zoom, setZoom] = useState(100); // 50..200
  const [loading, setLoading] = useState(true);
  const [quoteData, setQuoteData] = useState<QuoteData | null>(null);
  const [settings, setSettings] = useState<CompanySettings | null>(null);
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string>("");
  const [returnPath, setReturnPath] = useState<string>("/");

  // Per mostrare le pagine (solo info, lo scroll rimane unico e continuo)
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);

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

    const initPdf = async () => {
      try {
        // Genera PDF (jsPDF o similare) e ottieni Blob
        const pdf = await generateQuotePDF(data, companySettings);

        // numero pagine (se disponibile dall’oggetto pdf)
        try {
          const n = pdf.getNumberOfPages?.();
          if (typeof n === "number") setTotalPages(n);
        } catch {
          // in caso non sia disponibile, rimane 1 e il viewer calcolerà da sé
        }

        const blob = pdf.output("blob");
        const pdfBlob = new Blob([blob], { type: "application/pdf" });
        const url = URL.createObjectURL(pdfBlob);
        setPdfBlobUrl(url);
        setLoading(false);
      } catch (error) {
        console.error("Errore generazione PDF:", error);
        toast.error("Errore durante la generazione del PDF");
        navigate(-1);
      }
    };

    initPdf();

    return () => {
      if (pdfBlobUrl) URL.revokeObjectURL(pdfBlobUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state, navigate]);

  const handleSave = () => {
    if (!pdfBlobUrl || !quoteData) return;

    const link = document.createElement("a");
    link.href = pdfBlobUrl;
    link.download = `Preventivo_${quoteData.numero.toString().padStart(2, "0")}-${quoteData.anno}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success("PDF salvato con successo");
  };

  const handlePrint = () => {
    if (!pdfBlobUrl) return;

    const printWindow = window.open(pdfBlobUrl, "_blank");
    if (!printWindow) {
      toast.error("Sblocca i popup per stampare");
      return;
    }

    printWindow.addEventListener("load", () => {
      printWindow.focus();
      printWindow.print();
    });

    toast.success("Invio alla stampante...");
  };

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 25, 200));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 25, 50));

  const handleGoBack = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigate(returnPath, { replace: true });
  };

  // Aggancia eventi di pagina dal viewer
  const handlePageChange = (e: { currentPage: number; doc?: unknown }) => {
    setCurrentPage(e.currentPage + 1); // l’evento è 0-based
  };

  const workerUrl = "https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js";

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg">Generazione PDF in corso...</div>
        </div>
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

        {/* Main */}
        <div className="flex gap-6">
          {/* PDF Viewer container */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex-1 glass rounded-2xl p-4 overflow-hidden flex flex-col"
            style={{ maxHeight: "calc(100vh - 180px)" }}
          >
            {/* Scroll UNICO sul contenitore principale */}
            <div className="flex justify-center overflow-y-auto scrollbar-thin pr-2 flex-1">
              <div className="flex flex-col items-center w-full">
                {/* Nessuna cornice: niente iframe, niente embed */}
                <Worker workerUrl={workerUrl}>
                  <Viewer
                    fileUrl={pdfBlobUrl}
                    // Zoom vettoriale (non sgrana)
                    defaultScale={SpecialZoomLevel.ActualSize}
                    // Applichiamo la nostra percentuale
                    renderPage={(props) => {
                      // Imposta scala dinamica in base allo stato zoom
                      const scale = zoom / 100;
                      return (
                        <div
                          style={{
                            // rimuove margini/cornici
                            background: "transparent",
                            // centra la pagina
                            display: "flex",
                            justifyContent: "center",
                          }}
                        >
                          <props.canvasLayer.render
                            {...props.canvasLayerProps}
                            // forziamo la scala sul layer canvas
                            transform={`scale(${scale})`}
                            // manteniamo l'origine in alto
                            transformOrigin="top center"
                          />
                          {/* testo selezionabile sopra il canvas */}
                          <props.textLayer.render
                            {...props.textLayerProps}
                            transform={`scale(${scale})`}
                            transformOrigin="top center"
                          />
                          {/* annotation layer (link cliccabili, ecc) */}
                          <props.annotationLayer.render
                            {...props.annotationLayerProps}
                            transform={`scale(${scale})`}
                            transformOrigin="top center"
                          />
                        </div>
                      );
                    }}
                    onPageChange={handlePageChange}
                    // rimuove bordi/ombre di default
                    theme={{
                      theme: "light",
                    }}
                  />
                </Worker>
              </div>
            </div>
          </motion.div>

          {/* Control Panel */}
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
              disabled={zoom >= 200}
            >
              <ZoomIn className="w-5 h-5" />
              <span className="text-center leading-tight whitespace-normal">Zoom avanti</span>
            </Button>

            <Button
              onClick={handleZoomOut}
              variant="outline"
              className="h-24 w-full flex flex-col items-center justify-center gap-1 text-xs px-1"
              title="Zoom Out"
              disabled={zoom <= 50}
            >
              <ZoomOut className="w-5 h-5" />
              <span className="text-center leading-tight whitespace-normal">Zoom indietro</span>
            </Button>

            <Button
              variant="outline"
              className="h-16 w-full flex flex-col items-center justify-center gap-1 text-xs cursor-default pointer-events-none"
            >
              <span className="font-semibold">Zoom:</span>
              <span>{zoom}%</span>
            </Button>

            {/* Indicatore pagina (lo scroll è unico, qui mostri solo info) */}
            <div className="mt-4 space-y-2">
              <Button
                variant="outline"
                className="h-14 w-full flex items-center justify-center text-xs cursor-default pointer-events-none"
                title="Pagina corrente"
              >
                <ChevronLeft className="w-0 h-0 opacity-0" />
                <span className="text-center leading-tight">
                  Pagina {currentPage} / {totalPages}
                </span>
                <ChevronRight className="w-0 h-0 opacity-0" />
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default PdfPreview;
