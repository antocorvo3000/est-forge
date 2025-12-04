import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, Download, Printer, ZoomIn, ZoomOut, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/lib/toast";
import { generateQuotePDF } from "@/lib/pdfGenerator";
import type { CompanySettings } from "@/types/companySettings";

import { Worker, Viewer, SpecialZoomLevel, ScrollMode } from "@react-pdf-viewer/core";
import { zoomPlugin } from "@react-pdf-viewer/zoom";
import "@react-pdf-viewer/core/lib/styles/index.css";
import "@react-pdf-viewer/zoom/lib/styles/index.css";
import "./pdf-transparent.css";

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
  const [zoomLevel, setZoomLevel] = useState(1);

  const viewerContainerRef = useRef<HTMLDivElement>(null);

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
        const blob = pdf.output("blob");
        const pdfBlob = new Blob([blob], { type: "application/pdf" });
        const url = URL.createObjectURL(pdfBlob);
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
    
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.src = pdfBlobUrl;
    document.body.appendChild(iframe);
    
    iframe.onload = () => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        toast.success("Invio alla stampante...");
        setTimeout(() => document.body.removeChild(iframe), 1000);
      } catch (error) {
        const w = window.open(pdfBlobUrl, "_blank");
        if (!w) {
          toast.error("Sblocca i popup per stampare");
        } else {
          w.addEventListener("load", () => {
            w.focus();
            w.print();
          });
        }
        document.body.removeChild(iframe);
      }
    };
  };

  const handleZoomIn = () => {
    const newZoom = Math.min(zoomLevel + 0.25, 3);
    setZoomLevel(newZoom);
    zoomTo(newZoom);
  };

  const handleZoomOut = () => {
    const newZoom = Math.max(0.5, zoomLevel - 0.25);
    setZoomLevel(newZoom);
    zoomTo(newZoom);
  };

  const handlePreviousPage = () => {
    if (currentPage > 1 && viewerContainerRef.current) {
      const targetPageIndex = currentPage - 2;
      const pageElement = viewerContainerRef.current.querySelector(
        `[data-testid="core__page-layer-${targetPageIndex}"]`
      );
      if (pageElement) {
        pageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages && viewerContainerRef.current) {
      const targetPageIndex = currentPage;
      const pageElement = viewerContainerRef.current.querySelector(
        `[data-testid="core__page-layer-${targetPageIndex}"]`
      );
      if (pageElement) {
        pageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  };

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
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6 w-full flex-1 flex flex-col min-h-0">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-2xl p-3 sm:p-4 flex items-center gap-3 mb-6 flex-shrink-0"
        >
          <Button variant="ghost" size="icon" onClick={handleGoBack} className="h-10 w-10">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-3xl font-extrabold tracking-tight">Genera PDF Preventivo</h1>
        </motion.div>

        <div className="flex gap-6 flex-1 min-h-0 overflow-hidden">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex-1 glass rounded-2xl p-4 flex flex-col min-h-0 overflow-hidden"
            ref={viewerContainerRef}
          >
            <div 
              className="flex-1 min-h-0 w-full pdf-zoom-wrapper"
              style={{
                transform: `scale(${zoomLevel})`,
                transformOrigin: 'top center',
                transition: 'transform 0.2s ease-out',
                overflow: 'visible'
              }}
            >
              {pdfBlobUrl ? (
                <Worker workerUrl={workerUrl}>
                  <div className="h-full w-full">
                    <Viewer
                      fileUrl={pdfBlobUrl}
                      plugins={[zoomPluginInstance]}
                      defaultScale={SpecialZoomLevel.PageFit}
                      scrollMode={ScrollMode.Page}
                      onDocumentLoad={(e) => {
                        setTotalPages(e.doc.numPages);
                        setCurrentPage(1);
                      }}
                      onPageChange={(e) => setCurrentPage(e.currentPage + 1)}
                    />
                  </div>
                </Worker>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                  ⚠️ PDF non disponibile
                </div>
              )}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="w-20 flex flex-col gap-3"
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
              className="h-16 w-full flex flex-col items-center justify-center gap-1 text-xs px-1"
              title="Zoom Avanti"
              disabled={zoomLevel >= 3}
            >
              <ZoomIn className="w-5 h-5" />
              <span className="text-[10px]">Zoom +</span>
            </Button>

            <Button
              onClick={handleZoomOut}
              variant="outline"
              className="h-16 w-full flex flex-col items-center justify-center gap-1 text-xs px-1"
              title="Zoom Indietro"
              disabled={zoomLevel <= 0.5}
            >
              <ZoomOut className="w-5 h-5" />
              <span className="text-[10px]">Zoom -</span>
            </Button>

            <div className="h-px bg-border my-2" />

            <Button
              onClick={handlePreviousPage}
              variant="outline"
              className="h-16 w-full flex flex-col items-center justify-center gap-1 text-xs px-1"
              title="Pagina Precedente"
              disabled={currentPage === 1}
            >
              <ChevronLeft className="w-5 h-5" />
              <span className="text-[10px]">Prec</span>
            </Button>

            <Button
              onClick={handleNextPage}
              variant="outline"
              className="h-16 w-full flex flex-col items-center justify-center gap-1 text-xs px-1"
              title="Pagina Successiva"
              disabled={currentPage >= totalPages}
            >
              <ChevronRight className="w-5 h-5" />
              <span className="text-[10px]">Succ</span>
            </Button>

            <Button
              variant="outline"
              className="h-16 w-full flex flex-col items-center justify-center gap-1 text-xs cursor-default pointer-events-none"
            >
              <span className="font-semibold text-[10px]">Pagina</span>
              <span className="text-[11px] font-bold">
                {currentPage} / {totalPages}
              </span>
            </Button>
          </motion.div>
        </div>
      </div>

      <style>{`
        /* BLOCCA SCROLL PAGINA */
        body {
          overflow: hidden !important;
        }

        /* Zoom wrapper con overflow visible per permettere rendering */
        .pdf-zoom-wrapper {
          will-change: transform;
        }

        /* VIEWER - scroll verticale con snap tra pagine */
        .rpv-core__inner-pages {
          background-color: transparent !important;
          padding: 1rem 0 !important;
          scroll-snap-type: y mandatory !important;
          scroll-behavior: smooth !important;
          display: flex !important;
          flex-direction: column !important;
          align-items: center !important;
          gap: 1.5rem !important;
        }

        /* CONTAINER SINGOLA PAGINA - FIT con pagina PDF */
        .rpv-core__page-layer {
          scroll-snap-align: center !important;
          scroll-snap-stop: always !important;
          background-color: white !important;
          box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15) !important;
          border-radius: 4px !important;
          padding: 0 !important;
          margin: 0 !important;
          width: fit-content !important;
          height: fit-content !important;
        }

        /* Container interno FIT */
        .rpv-core__inner-container {
          width: 100% !important;
          height: 100% !important;
          display: flex !important;
          justify-content: center !important;
          align-items: center !important;
        }

        /* Canvas senza spazi */
        .rpv-core__canvas-layer {
          line-height: 0 !important;
          display: block !important;
        }

        .rpv-core__canvas-layer canvas {
          display: block !important;
          margin: 0 !important;
          padding: 0 !important;
        }

        /* Text layer */
        .rpv-core__text-layer {
          line-height: 1 !important;
        }

        /* Nascondi frecce native */
        .rpv-core__arrow-button {
          display: none !important;
        }

        /* Scrollbar personalizzata */
        .rpv-core__inner-pages::-webkit-scrollbar {
          width: 10px;
        }

        .rpv-core__inner-pages::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.05);
          border-radius: 5px;
        }

        .rpv-core__inner-pages::-webkit-scrollbar-thumb {
          background: rgba(0, 0, 0, 0.25);
          border-radius: 5px;
        }

        .rpv-core__inner-pages::-webkit-scrollbar-thumb:hover {
          background: rgba(0, 0, 0, 0.35);
        }
      `}</style>
    </div>
  );
};

export default PdfPreview;
