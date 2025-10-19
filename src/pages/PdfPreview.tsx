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
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

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
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string>("");
  const [zoom, setZoom] = useState(100);
  const [loading, setLoading] = useState(true);
  const [quoteData, setQuoteData] = useState<QuoteData | null>(null);
  const [settings, setSettings] = useState<CompanySettings | null>(null);
  const [useCanvasFallback, setUseCanvasFallback] = useState(false);
  const [pdfPages, setPdfPages] = useState<HTMLCanvasElement[]>([]);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);

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

    const generatePdf = async () => {
      let blobUrl = "";
      try {
        const pdf = await generateQuotePDF(data, companySettings);
        const blob = pdf.output("blob");
        
        // Crea un nuovo Blob con Content-Type corretto
        const pdfBlob = new Blob([blob], { type: "application/pdf" });
        blobUrl = URL.createObjectURL(pdfBlob);
        setPdfBlobUrl(blobUrl);

        // Prova a caricare nell'iframe
        setTimeout(() => {
          // Se l'iframe non carica, usa fallback con canvas
          if (iframeRef.current) {
            iframeRef.current.onload = () => {
              // Iframe caricato con successo
              setLoading(false);
            };
            iframeRef.current.onerror = () => {
              // Fallback a canvas
              renderWithPdfJs(pdfBlob);
            };
          }
        }, 1000);

        // Fallback automatico per Safari/Firefox
        const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
        const isFirefox = navigator.userAgent.toLowerCase().indexOf('firefox') > -1;
        
        if (isSafari || isFirefox) {
          renderWithPdfJs(pdfBlob);
        } else {
          setLoading(false);
        }
      } catch (error) {
        console.error("Errore generazione PDF:", error);
        toast.error("Errore durante la generazione del PDF");
        navigate(-1);
      }
    };

    generatePdf();

    return () => {
      if (pdfBlobUrl) {
        URL.revokeObjectURL(pdfBlobUrl);
      }
    };
  }, [location.state, navigate]);

  const renderWithPdfJs = async (pdfBlob: Blob) => {
    try {
      const arrayBuffer = await pdfBlob.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;
      
      const canvases: HTMLCanvasElement[] = [];
      
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const viewport = page.getViewport({ scale: 1.5 });
        
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");
        
        if (!context) continue;
        
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        
        await page.render({
          canvasContext: context,
          viewport: viewport,
          canvas: canvas,
        }).promise;
        
        canvases.push(canvas);
      }
      
      setPdfPages(canvases);
      setUseCanvasFallback(true);
      setLoading(false);
    } catch (error) {
      console.error("Errore rendering PDF.js:", error);
      toast.error("Errore durante il rendering del PDF");
    }
  };

  const handleSave = async () => {
    if (!quoteData || !settings) return;
    
    try {
      const pdf = await generateQuotePDF(quoteData, settings);
      const filename = `Preventivo_${quoteData.numero.toString().padStart(2, "0")}-${quoteData.anno}.pdf`;
      pdf.save(filename);
      toast.success("PDF salvato con successo");
    } catch (error) {
      console.error("Errore salvataggio PDF:", error);
      toast.error("Errore durante il salvataggio");
    }
  };

  const handlePrint = () => {
    if (useCanvasFallback) {
      // Stampa da canvas
      window.print();
    } else if (iframeRef.current?.contentWindow) {
      // Stampa da iframe
      try {
        iframeRef.current.contentWindow.print();
      } catch (error) {
        console.error("Errore stampa iframe:", error);
        window.print();
      }
    } else {
      window.print();
    }
    toast.success("Invio alla stampante...");
  };

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 25, 200));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 25, 50));
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
              {useCanvasFallback ? (
                // Fallback: Rendering con PDF.js su canvas
                <div ref={canvasContainerRef} className="space-y-4">
                  {pdfPages.map((canvas, index) => (
                    <div
                      key={index}
                      className="shadow-lg rounded-lg overflow-hidden"
                      style={{
                        aspectRatio: "210/297",
                        width: "595px", // A4 width in pixels at 72 DPI
                      }}
                    >
                      <div
                        dangerouslySetInnerHTML={{
                          __html: canvas.outerHTML,
                        }}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                // Primary: Iframe con sandbox
                <iframe
                  ref={iframeRef}
                  src={`${pdfBlobUrl}#toolbar=0&navpanes=0`}
                  className="border-0 rounded-lg shadow-lg"
                  sandbox="allow-scripts allow-same-origin allow-downloads"
                  style={{
                    width: "595px", // A4 width
                    height: "842px", // A4 height
                  }}
                  title="PDF Preview"
                />
              )}
            </div>
          </motion.div>

          {/* Control Panel */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="w-20 flex flex-col gap-3"
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
              disabled={zoom >= 200}
            >
              <ZoomIn className="w-5 h-5" />
              <span>+</span>
            </Button>

            <Button
              onClick={handleZoomOut}
              variant="outline"
              className="h-16 w-16 flex flex-col items-center justify-center gap-1 text-xs"
              title="Zoom Out"
              disabled={zoom <= 50}
            >
              <ZoomOut className="w-5 h-5" />
              <span>-</span>
            </Button>

            {/* Zoom indicator */}
            <div className="text-center text-xs text-muted-foreground mt-2">
              {zoom}%
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default PdfPreview;
