import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, Download, Printer, ExternalLink } from "lucide-react";
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
  const [loading, setLoading] = useState(true);
  const [quoteData, setQuoteData] = useState<QuoteData | null>(null);
  const [settings, setSettings] = useState<CompanySettings | null>(null);
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string>("");

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
        
        // Crea Blob URL
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

  const handleOpenInNewTab = () => {
    if (!pdfBlobUrl) return;
    
    const newWindow = window.open(pdfBlobUrl, "_blank");
    if (!newWindow) {
      toast.error("Sblocca i popup per aprire il PDF");
    }
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
        <div className="grid grid-cols-1 gap-6">
          {/* PDF Preview usando iframe */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-2xl p-6"
          >
            <div className="aspect-[1/1.414] w-full max-w-3xl mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
              <iframe
                src={pdfBlobUrl}
                className="w-full h-full border-0"
                title="Anteprima PDF"
              />
            </div>
          </motion.div>

          {/* Control Panel */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass rounded-2xl p-6"
          >
            <div className="flex flex-wrap gap-3 justify-center">
              <Button
                onClick={handleSave}
                size="lg"
                className="gap-2"
              >
                <Download className="w-5 h-5" />
                Salva PDF
              </Button>

              <Button
                onClick={handlePrint}
                size="lg"
                variant="outline"
                className="gap-2"
              >
                <Printer className="w-5 h-5" />
                Stampa
              </Button>

              <Button
                onClick={handleOpenInNewTab}
                size="lg"
                variant="outline"
                className="gap-2"
              >
                <ExternalLink className="w-5 h-5" />
                Apri in nuova scheda
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default PdfPreview;
