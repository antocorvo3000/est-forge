import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, Download, Printer, ZoomIn, ZoomOut } from "lucide-react";
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
  const [pdfDataUrl, setPdfDataUrl] = useState<string>("");
  const [zoom, setZoom] = useState(100);
  const [loading, setLoading] = useState(true);
  const [quoteData, setQuoteData] = useState<QuoteData | null>(null);
  const [settings, setSettings] = useState<CompanySettings | null>(null);

  useEffect(() => {
    const data = location.state?.quoteData as QuoteData;
    const companySettings = location.state?.settings as CompanySettings;
    
    if (!data || !companySettings) {
      toast.error("Nessun dato disponibile per generare il PDF");
      navigate("/");
      return;
    }

    setQuoteData(data);
    setSettings(companySettings);

    // Genera il PDF
    const generatePdf = async () => {
      let blobUrl = "";
      try {
        const pdf = await generateQuotePDF(data, companySettings);
        // Usa Blob URL invece di data URL per evitare blocchi di Chrome
        const blob = pdf.output("blob");
        blobUrl = URL.createObjectURL(blob);
        setPdfDataUrl(blobUrl);
      } catch (error) {
        console.error("Errore generazione PDF:", error);
        toast.error("Errore durante la generazione del PDF");
        navigate("/");
      } finally {
        setLoading(false);
      }
    };

    generatePdf();

    // Cleanup: revoca il Blob URL quando il componente viene smontato
    return () => {
      if (pdfDataUrl) {
        URL.revokeObjectURL(pdfDataUrl);
      }
    };
  }, [location.state, navigate]);

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

  const handlePrint = async () => {
    if (!quoteData || !settings) return;
    
    try {
      const pdf = await generateQuotePDF(quoteData, settings);
      const blob = pdf.output("blob");
      const url = URL.createObjectURL(blob);
      const printWindow = window.open(url);
      
      if (printWindow) {
        printWindow.addEventListener("load", () => {
          printWindow.print();
        });
        toast.success("Invio alla stampante...");
      } else {
        toast.error("Impossibile aprire la finestra di stampa");
      }
    } catch (error) {
      console.error("Errore stampa PDF:", error);
      toast.error("Errore durante la stampa");
    }
  };

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 25, 200));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 25, 50));
  };

  if (loading || !pdfDataUrl) {
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
            onClick={() => navigate("/")}
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
            <div className="flex justify-center">
              <object
                data={pdfDataUrl}
                type="application/pdf"
                className="border-0 rounded-lg shadow-lg"
                style={{
                  width: `${zoom}%`,
                  height: `${(297 / 210) * zoom * 2.83}px`,
                  minHeight: "842px",
                  transition: "all 0.3s ease",
                }}
              >
                <p className="text-center p-4">
                  Il tuo browser non supporta la visualizzazione PDF.
                  <br />
                  <Button onClick={handleSave} className="mt-4">
                    Scarica PDF
                  </Button>
                </p>
              </object>
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
