import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, Download, Printer, ZoomIn, ZoomOut, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/lib/toast";
import { generateQuotePDF } from "@/lib/pdfGenerator";
import type { CompanySettings } from "@/types/companySettings";

import * as pdfjsLib from "pdfjs-dist";

// Worker URL
pdfjsLib.GlobalWorkerOptions.workerSrc = "https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.worker.min.js";

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

interface PageData {
  pageNum: number;
  canvas: HTMLCanvasElement | null;
  width: number;
  height: number;
}

const PdfPreview = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [loading, setLoading] = useState(true);
  const [quoteData, setQuoteData] = useState<QuoteData | null>(null);
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string>("");
  const [returnPath, setReturnPath] = useState<string>("/");

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [pages, setPages] = useState<PageData[]>([]);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const pageRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Carica e renderizza PDF
  const loadPdf = useCallback(async (url: string) => {
    try {
      const loadingTask = pdfjsLib.getDocument(url);
      const pdf = await loadingTask.promise;
      
      setTotalPages(pdf.numPages);
      
      const pagesData: PageData[] = [];
      
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 1.5 }); // Scala base per qualità
        
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");
        
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        
        if (context) {
          await page.render({
            canvasContext: context,
            viewport: viewport,
          }).promise;
        }
        
        pagesData.push({
          pageNum: i,
          canvas: canvas,
          width: viewport.width,
          height: viewport.height,
        });
      }
      
      setPages(pagesData);
      setLoading(false);
    } catch (err) {
      console.error("Errore caricamento PDF:", err);
      toast.error("Errore durante il caricamento del PDF");
    }
  }, []);

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

    (async () => {
      try {
        const pdf = await generateQuotePDF(data, companySettings);
        const blob = pdf.output("blob");
        const pdfBlob = new Blob([blob], { type: "application/pdf" });
        const url = URL.createObjectURL(pdfBlob);
        setPdfBlobUrl(url);
        await loadPdf(url);
      } catch (err) {
        console.error("Errore generazione PDF:", err);
        toast.error("Errore durante la generazione del PDF");
        navigate(-1);
      }
    })();

    return () => {
      if (pdfBlobUrl) URL.revokeObjectURL(pdfBlobUrl);
    };
  }, [location.state, navigate, loadPdf]);

  // Rileva pagina corrente durante lo scroll
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const containerRect = container.getBoundingClientRect();
      const containerCenter = containerRect.top + containerRect.height / 2;

      for (let i = 0; i < pageRefs.current.length; i++) {
        const pageEl = pageRefs.current[i];
        if (pageEl) {
          const pageRect = pageEl.getBoundingClientRect();
          if (pageRect.top <= containerCenter && pageRect.bottom >= containerCenter) {
            setCurrentPage(i + 1);
            break;
          }
        }
      }
    };

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, [pages]);

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
    
    const iframe = document.createElement("iframe");
    iframe.style.display = "none";
    iframe.src = pdfBlobUrl;
    document.body.appendChild(iframe);
    
    iframe.onload = () => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        toast.success("Invio alla stampante...");
        setTimeout(() => document.body.removeChild(iframe), 1000);
      } catch {
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
    setZoomLevel((prev) => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setZoomLevel((prev) => Math.max(prev - 0.25, 0.5));
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      const targetPage = currentPage - 1;
      pageRefs.current[targetPage - 1]?.scrollIntoView({ 
        behavior: "smooth", 
        block: "center" 
      });
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      const targetPage = currentPage + 1;
      pageRefs.current[targetPage - 1]?.scrollIntoView({ 
        behavior: "smooth", 
        block: "center" 
      });
    }
  };

  const handleGoBack = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigate(returnPath, { replace: true });
  };

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
        {/* Header */}
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
          {/* PDF Viewer */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex-1 glass rounded-2xl p-4 flex flex-col min-h-0 overflow-hidden"
          >
            {/* Container con UN SOLO scroll verticale */}
            <div
              ref={scrollContainerRef}
              className="flex-1 overflow-y-auto overflow-x-hidden"
              style={{
                scrollSnapType: "y mandatory",
                scrollBehavior: "smooth",
              }}
            >
              {/* Wrapper per ZOOM - scala container + pagine insieme */}
              <div
                className="flex flex-col items-center gap-6 py-4"
                style={{
                  transform: `scale(${zoomLevel})`,
                  transformOrigin: "top center",
                  transition: "transform 0.2s ease-out",
                }}
              >
                {pages.map((page, index) => (
                  /* Container SINGOLA PAGINA - FIT esatto */
                  <div
                    key={page.pageNum}
                    ref={(el) => (pageRefs.current[index] = el)}
                    className="page-container"
                    style={{
                      scrollSnapAlign: "center",
                      scrollSnapStop: "always",
                      width: "fit-content",
                      height: "fit-content",
                      backgroundColor: "white",
                      boxShadow: "0 8px 24px rgba(0, 0, 0, 0.15)",
                      borderRadius: "4px",
                      overflow: "hidden",
                      lineHeight: 0,
                    }}
                  >
                    {/* Canvas renderizzato - NO spazi */}
                    anvas
                      ref={(canvasEl) => {
                        if (canvasEl && page.canvas) {
                          const ctx = canvasEl.getContext("2d");
                          canvasEl.width = page.width;
                          canvasEl.height = page.height;
                          if (ctx) {
                            ctx.drawImage(page.canvas, 0, 0);
                          }
                        }
                      }}
                      style={{
                        display: "block",
                        margin: 0,
                        padding: 0,
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Control Panel */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="w-20 flex flex-col gap-3 flex-shrink-0"
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
        body {
          overflow: hidden !important;
        }

        /* Scrollbar personalizzata */
        .flex-1.overflow-y-auto::-webkit-scrollbar {
          width: 10px;
        }

        .flex-1.overflow-y-auto::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.05);
          border-radius: 5px;
        }

        .flex-1.overflow-y-auto::-webkit-scrollbar-thumb {
          background: rgba(0, 0, 0, 0.25);
          border-radius: 5px;
        }

        .flex-1.overflow-y-auto::-webkit-scrollbar-thumb:hover {
          background: rgba(0, 0, 0, 0.35);
        }
      `}</style>
    </div>
  );
};

export default PdfPreview;
