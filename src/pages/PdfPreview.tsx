import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, Download, Printer, ZoomIn, ZoomOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/lib/toast";
import type jsPDF from "jspdf";

const PdfPreview = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [pdfDoc, setPdfDoc] = useState<jsPDF | null>(null);
  const [pdfDataUrl, setPdfDataUrl] = useState<string>("");
  const [zoom, setZoom] = useState(100);

  useEffect(() => {
    const pdf = location.state?.pdf as jsPDF;
    if (!pdf) {
      toast.error("Nessun PDF da visualizzare");
      navigate(-1);
      return;
    }

    setPdfDoc(pdf);
    // Genera URL del PDF per visualizzazione
    const dataUrl = pdf.output("dataurlstring");
    setPdfDataUrl(dataUrl);
  }, [location.state, navigate]);

  const handleSave = () => {
    if (!pdfDoc) return;
    
    const numero = location.state?.numero || "preventivo";
    const anno = location.state?.anno || new Date().getFullYear();
    const filename = `Preventivo_${numero.toString().padStart(2, "0")}-${anno}.pdf`;
    
    pdfDoc.save(filename);
    toast.success("PDF salvato con successo");
  };

  const handlePrint = () => {
    if (!pdfDoc) return;
    
    // Apri finestra di stampa
    const blob = pdfDoc.output("blob");
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
  };

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 25, 200));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 25, 50));
  };

  if (!pdfDataUrl) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg">Caricamento PDF...</div>
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
            <iframe
              src={pdfDataUrl}
              className="w-full border-0 rounded-lg shadow-lg"
              style={{
                height: "800px",
                transform: `scale(${zoom / 100})`,
                transformOrigin: "top center",
                transition: "transform 0.3s ease",
              }}
              title="PDF Preview"
            />
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
