import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, Download, Printer, ZoomIn, ZoomOut, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/lib/toast";
import { generateQuotePDF } from "@/lib/pdfGenerator";
import type { CompanySettings } from "@/types/companySettings";

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
  const [zoom, setZoom] = useState(100);
  const [loading, setLoading] = useState(true);
  const [quoteData, setQuoteData] = useState<QuoteData | null>(null);
  const [settings, setSettings] = useState<CompanySettings | null>(null);
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const data = location.state?.quoteData as QuoteData;
    const companySettings = location.state?.settings as CompanySettings;
    
    if (!data || !companySettings) {
      toast.error("Nessun dato disponibile per generare il PDF");
      navigate(-1);
      return;
    }

    setQuoteData(data);
    setSettings(companySettings);

    const initPdf = async () => {
      try {
        // Genera il PDF
        const pdf = await generateQuotePDF(data, companySettings);
        const numPages = pdf.getNumberOfPages();
        setTotalPages(numPages);
        
        const blob = pdf.output("blob");
        
        // Crea Blob URL per iframe
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
      if (pdfBlobUrl) {
        URL.revokeObjectURL(pdfBlobUrl);
      }
    };
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

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 25, 200));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 25, 50));
  };

  const handlePrevPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

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
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="h-10 w-10"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-3xl font-extrabold tracking-tight">
            Genera PDF Preventivo
          </h1>
        </motion.div>

        {/* Main content */}
        <div className="flex gap-6">
          {/* PDF Viewer */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex-1 glass rounded-2xl p-4 overflow-auto"
            style={{
              maxHeight: "calc(100vh - 180px)",
            }}
          >
            <div 
              className="flex justify-center"
              style={{
                transform: `scale(${zoom / 100})`,
                transformOrigin: "top center",
                transition: "transform 0.3s ease",
              }}
            >
              <iframe
                ref={iframeRef}
                src={`${pdfBlobUrl}#page=${currentPage}&toolbar=0&navpanes=0&scrollbar=0`}
                className="border-0 rounded-lg shadow-lg bg-white"
                style={{
                  width: "595px", // A4 width in pixels at 72 DPI
                  height: "842px", // A4 height in pixels at 72 DPI
                }}
                title="Anteprima PDF"
              />
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
              <span className="text-center leading-tight whitespace-normal">Zoom in avanti</span>
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

            {/* Zoom indicator */}
            <div className="text-center text-xs text-muted-foreground mt-2">
              {zoom}%
            </div>

            {/* Page navigation */}
            <div className="mt-4 space-y-2">
              <Button
                onClick={handlePrevPage}
                variant="outline"
                className="h-12 w-full flex items-center justify-center gap-1 text-xs"
                title="Pagina precedente"
                disabled={currentPage <= 1}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>

              <div className="text-center text-xs text-muted-foreground py-1">
                Pagina {currentPage} di {totalPages}
              </div>

              <Button
                onClick={handleNextPage}
                variant="outline"
                className="h-12 w-full flex items-center justify-center gap-1 text-xs"
                title="Pagina successiva"
                disabled={currentPage >= totalPages}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default PdfPreview;
