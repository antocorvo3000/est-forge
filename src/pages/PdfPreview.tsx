import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, Download, Printer, ZoomIn, ZoomOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/lib/toast";
import { generateQuotePDF } from "@/lib/pdfGenerator";
import type { CompanySettings } from "@/types/companySettings";
import * as pdfjsLib from "pdfjs-dist";

// Configura worker di PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

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
  const [scale, setScale] = useState(1.2);
  const [loading, setLoading] = useState(true);
  const [quoteData, setQuoteData] = useState<QuoteData | null>(null);
  const [settings, setSettings] = useState<CompanySettings | null>(null);
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [arrayBuffer, setArrayBuffer] = useState<ArrayBuffer | null>(null);
  const [blobUrl, setBlobUrl] = useState<string>("");
  const pagesContainerRef = useRef<HTMLDivElement>(null);

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
        const blob = pdf.output("blob");
        
        // Converti in ArrayBuffer per PDF.js
        const buffer = await blob.arrayBuffer();
        setArrayBuffer(buffer);
        
        // Crea Blob URL per salva/stampa
        const pdfBlob = new Blob([buffer], { type: "application/pdf" });
        const url = URL.createObjectURL(pdfBlob);
        setBlobUrl(url);
        
        // Carica documento con PDF.js
        const loadingTask = pdfjsLib.getDocument({ data: buffer });
        const pdfDocument = await loadingTask.promise;
        setPdfDoc(pdfDocument);
        
        setLoading(false);
      } catch (error) {
        console.error("Errore generazione PDF:", error);
        toast.error("Errore durante la generazione del PDF");
        navigate(-1);
      }
    };

    initPdf();

    return () => {
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
      }
    };
  }, [location.state, navigate]);

  useEffect(() => {
    if (pdfDoc && pagesContainerRef.current) {
      renderAllPages();
    }
  }, [pdfDoc, scale]);

  const renderAllPages = async () => {
    if (!pdfDoc || !pagesContainerRef.current) return;

    // Pulisci container
    pagesContainerRef.current.innerHTML = "";

    // Renderizza ogni pagina
    for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
      try {
        const page = await pdfDoc.getPage(pageNum);
        
        // Viewport con scala per mantenere proporzioni A4
        const viewport = page.getViewport({ scale });

        // Crea canvas
        const canvas = document.createElement("canvas");
        canvas.className = "pdf-page";
        const context = canvas.getContext("2d", { alpha: false });
        
        if (!context) continue;

        canvas.width = Math.ceil(viewport.width);
        canvas.height = Math.ceil(viewport.height);

        // Applica stili
        canvas.style.background = "#fff";
        canvas.style.borderRadius = "8px";
        canvas.style.boxShadow = "0 1px 4px rgba(0,0,0,0.08)";
        canvas.style.marginBottom = "12px";

        pagesContainerRef.current.appendChild(canvas);

        // Renderizza
        await page.render({
          canvasContext: context,
          viewport: viewport,
        }).promise;
      } catch (error) {
        console.error(`Errore rendering pagina ${pageNum}:`, error);
      }
    }
  };

  const handleSave = () => {
    if (!blobUrl || !quoteData) return;
    
    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = `Preventivo_${quoteData.numero.toString().padStart(2, "0")}-${quoteData.anno}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success("PDF salvato con successo");
  };

  const handlePrint = () => {
    if (!blobUrl) return;
    
    const printWindow = window.open(blobUrl, "_blank");
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
    setScale((prev) => Math.min(prev + 0.15, 4.0));
  };

  const handleZoomOut = () => {
    setScale((prev) => Math.max(prev - 0.15, 0.25));
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
        <div className="grid grid-cols-[1fr_80px] gap-4 items-start">
          {/* PDF Viewer */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass rounded-2xl p-4 overflow-auto"
            style={{
              maxHeight: "calc(100vh - 180px)",
            }}
          >
            <div
              ref={pagesContainerRef}
              className="flex flex-col items-center gap-3"
            />
          </motion.div>

          {/* Control Panel */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex flex-col gap-3 sticky top-4"
          >
            <Button
              onClick={handleSave}
              className="h-16 w-16 flex flex-col items-center justify-center gap-1 text-xs"
              title="Salva PDF"
            >
              <Download className="w-5 h-5" />
              <span>Salva</span>
            </Button>

            <Button
              onClick={handlePrint}
              className="h-16 w-16 flex flex-col items-center justify-center gap-1 text-xs"
              title="Stampa PDF"
            >
              <Printer className="w-5 h-5" />
              <span>Stampa</span>
            </Button>

            <Button
              onClick={handleZoomIn}
              variant="outline"
              className="h-16 w-16 flex flex-col items-center justify-center gap-1 text-xs"
              title="Zoom In"
              disabled={scale >= 4.0}
            >
              <ZoomIn className="w-5 h-5" />
              <span>+</span>
            </Button>

            <Button
              onClick={handleZoomOut}
              variant="outline"
              className="h-16 w-16 flex flex-col items-center justify-center gap-1 text-xs"
              title="Zoom Out"
              disabled={scale <= 0.25}
            >
              <ZoomOut className="w-5 h-5" />
              <span>-</span>
            </Button>

            {/* Zoom indicator */}
            <div className="text-center text-xs text-muted-foreground mt-2">
              {Math.round(scale * 100)}%
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default PdfPreview;
