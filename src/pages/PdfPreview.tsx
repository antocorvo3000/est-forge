import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import {
  ArrowLeft,
  Download,
  Printer,
  ZoomIn,
  ZoomOut,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
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

interface RenderedPage {
  pageNum: number;
  dataUrl: string;
  width: number;
  height: number;
}

// Carica pdf.js dai file locali o, in fallback, da CDN
const loadPdfJs = async (): Promise<any> => {
  return new Promise((resolve, reject) => {
    if ((window as any).pdfjsLib) {
      resolve((window as any).pdfjsLib);
      return;
    }

    const script = document.createElement("script");
    script.src = "/src/pages/pdf.min.js";

    script.onload = () => {
      const pdfjsLib = (window as any).pdfjsLib;
      if (pdfjsLib) {
        pdfjsLib.GlobalWorkerOptions.workerSrc = "/src/pages/pdf.worker.min.js";
        resolve(pdfjsLib);
      } else {
        console.log("File locali non trovati, uso CDN...");
        loadFromCDN().then(resolve).catch(reject);
      }
    };

    script.onerror = () => {
      console.log("Errore caricamento file locali, uso CDN...");
      loadFromCDN().then(resolve).catch(reject);
    };

    document.head.appendChild(script);
  });
};

const loadFromCDN = (): Promise<any> => {
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";

    script.onload = () => {
      const pdfjsLib = (window as any).pdfjsLib;
      if (pdfjsLib) {
        pdfjsLib.GlobalWorkerOptions.workerSrc =
          "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
        resolve(pdfjsLib);
      } else {
        reject(new Error("pdfjsLib non trovato"));
      }
    };

    script.onerror = () => reject(new Error("Errore caricamento CDN"));
    document.head.appendChild(script);
  });
};

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
  const [renderedPages, setRenderedPages] = useState<RenderedPage[]>([]);
  const [pdfJsLoaded, setPdfJsLoaded] = useState(false);
  const [pdfJsLib, setPdfJsLib] = useState<any>(null);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const pageRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Carica pdf.js all'avvio
  useEffect(() => {
    loadPdfJs()
      .then((lib) => {
        setPdfJsLib(lib);
        setPdfJsLoaded(true);
      })
      .catch((err) => {
        console.error("Errore caricamento pdf.js:", err);
        toast.error("Impossibile caricare il visualizzatore PDF");
      });
  }, []);

  // Renderizza tutte le pagine del PDF come immagini
  const renderPdfPages = useCallback(
    async (url: string) => {
      if (!pdfJsLib) return;

      try {
        const loadingTask = pdfJsLib.getDocument(url);
        const pdf = await loadingTask.promise;

        setTotalPages(pdf.numPages);

        const pages: RenderedPage[] = [];
        const scale = 2;

        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
          const page = await pdf.getPage(pageNum);
          const viewport = page.getViewport({ scale });

          const canvas = document.createElement("canvas");
          const context = canvas.getContext("2d");

          canvas.width = viewport.width;
          canvas.height = viewport.height;

          if (context) {
            await page.render({
              canvasContext: context,
              viewport: viewport,
            }).promise;

            const dataUrl = canvas.toDataURL("image/png");

            pages.push({
              pageNum,
              dataUrl,
              width: viewport.width,
              height: viewport.height,
            });
          }
        }

        setRenderedPages(pages);
        setLoading(false);
      } catch (err) {
        console.error("Errore rendering PDF:", err);
        toast.error("Errore durante il rendering del PDF");
      }
    },
    [pdfJsLib]
  );

  // Recupera i dati dal navigation state, genera il PDF e crea il blob URL
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

  // Quando pdf.js è caricato e il blob URL è pronto, renderizza le pagine
  useEffect(() => {
    if (pdfJsLoaded && pdfBlobUrl) {
      renderPdfPages(pdfBlobUrl);
    }
  }, [pdfJsLoaded, pdfBlobUrl, renderPdfPages]);

  // Imposta lo zoom iniziale per far stare la prima pagina intera nel viewer
  useEffect(() => {
  const container = scrollContainerRef.current;
  if (!container || renderedPages.length === 0) return;

  // usa requestAnimationFrame per essere sicuro che il layout sia calcolato
  requestAnimationFrame(() => {
    const firstPage = renderedPages[0];

    const pageWidth = firstPage.width;
    const pageHeight = firstPage.height;

    const containerWidth = container.clientWidth;
    const containerHeight = container.clientHeight;

    if (!pageWidth || !pageHeight || !containerWidth || !containerHeight) return;

    const scaleX = containerWidth / pageWidth;
    const scaleY = containerHeight / pageHeight;

    const fitScale = Math.min(scaleX, scaleY);

    setZoomLevel(fitScale);
  });
}, [renderedPages]);


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

    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => container.removeEventListener("scroll", handleScroll);
  }, [renderedPages]);

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
    toast.error("Sblocca i popup per poter stampare");
    return;
  }

  const triggerPrint = () => {
    try {
      printWindow.focus();
      printWindow.print();
      toast.success("Invio alla stampante...");
    } catch (error) {
      console.error("Errore stampa:", error);
      toast.error("Errore durante la stampa");
    }
  };

  // Alcuni browser caricano il PDF come plugin: aspetta un attimo prima di stampare
  printWindow.addEventListener("load", () => {
    setTimeout(triggerPrint, 400);
  });
};


  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setZoomLevel((prev) => Math.max(prev - 0.25, 0.5));
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      pageRefs.current[currentPage - 2]?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      pageRefs.current[currentPage]?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  };

  const handleGoBack = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    navigate(returnPath, { replace: true });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <div className="text-lg">
            {!pdfJsLoaded ? "Caricamento visualizzatore..." : "Generazione PDF in corso..."}
          </div>
        </div>
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
            <div
              ref={scrollContainerRef}
              className="pdf-scroll-container flex-1 overflow-y-auto overflow-x-hidden"
            >
              <div
                className="flex flex-col items-center gap-6 py-4"
                style={{
                  transform: `scale(${zoomLevel})`,
                  transformOrigin: "top center",
                  transition: "transform 0.2s ease-out",
                }}
              >
                {renderedPages.map((page, index) => (
                  <div
                    key={page.pageNum}
                    ref={(element) => (pageRefs.current[index] = element)}
                    style={{
                      width: "fit-content",
                      height: "fit-content",
                      backgroundColor: "white",
                      boxShadow: "0 8px 24px rgba(0, 0, 0, 0.15)",
                      borderRadius: "4px",
                      overflow: "hidden",
                      lineHeight: 0,
                    }}
                  >
                    <img
                      src={page.dataUrl}
                      alt={`Pagina ${page.pageNum}`}
                      style={{
                        display: "block",
                        maxWidth: "100%",
                        height: "auto",
                        margin: 0,
                        padding: 0,
                      }}
                      draggable={false}
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

        .pdf-scroll-container {
          scroll-behavior: smooth;
          -webkit-overflow-scrolling: touch;
        }

        .pdf-scroll-container::-webkit-scrollbar {
          width: 10px;
        }

        .pdf-scroll-container::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.05);
          border-radius: 5px;
        }

        .pdf-scroll-container::-webkit-scrollbar-thumb {
          background: rgba(0, 0, 0, 0.25);
          border-radius: 5px;
        }

        .pdf-scroll-container::-webkit-scrollbar-thumb:hover {
          background: rgba(0, 0, 0, 0.35);
        }
      `}</style>
    </div>
  );
};

export default PdfPreview;
