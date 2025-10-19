import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
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

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('it-IT', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

export const generateQuotePDF = async (
  quoteData: QuoteData,
  settings: CompanySettings
): Promise<jsPDF> => {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 12.7; // Margini stretti Word (0.5 inch = 12.7mm)
  let yPos = margin;

  // Helper per aggiungere numero di pagina
  const addPageNumber = (currentPage: number, totalPages: number) => {
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text(
      `Pagina ${currentPage} di ${totalPages}`,
      pageWidth - margin,
      pageHeight - 10,
      { align: "right" }
    );
  };

  // Logo aziendale (se presente)
  if (settings.logoPath) {
    try {
      // Converti URL in base64 se necessario
      const img = new Image();
      img.src = settings.logoPath;
      await new Promise((resolve) => {
        img.onload = resolve;
      });
      doc.addImage(settings.logoPath, "PNG", margin, yPos, 40, 20);
    } catch (error) {
      console.warn("Logo non caricato:", error);
    }
  }

  // Dati azienda (sinistra sotto logo)
  yPos += 25;
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text(settings.name, margin, yPos);
  yPos += 5;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text(`P.IVA ${settings.vatNumber}`, margin, yPos);
  yPos += 4;
  doc.text(`Sede legale: ${settings.address}`, margin, yPos);
  yPos += 4;
  doc.text(`Tel. ${settings.phone}`, margin, yPos);
  yPos += 4;
  doc.text(`Email: ${settings.email}`, margin, yPos);

  // Dati cliente (destra, allineato in alto)
  let clientYPos = margin + 25;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text(`C.a. ${quoteData.cliente.nome}`, pageWidth - margin, clientYPos, {
    align: "right",
  });
  clientYPos += 5;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  if (quoteData.cliente.taxCode) {
    doc.text(`CF/P.IVA: ${quoteData.cliente.taxCode}`, pageWidth - margin, clientYPos, {
      align: "right",
    });
    clientYPos += 4;
  }
  if (quoteData.cliente.address) {
    doc.text(quoteData.cliente.address, pageWidth - margin, clientYPos, {
      align: "right",
    });
    clientYPos += 4;
  }
  if (quoteData.cliente.city || quoteData.cliente.zip) {
    const cityLine = `${quoteData.cliente.zip || ""} ${quoteData.cliente.city || ""} ${
      quoteData.cliente.province ? `(${quoteData.cliente.province})` : ""
    }`.trim();
    doc.text(cityLine, pageWidth - margin, clientYPos, { align: "right" });
    clientYPos += 4;
  }
  if (quoteData.cliente.phone) {
    doc.text(`Tel. ${quoteData.cliente.phone}`, pageWidth - margin, clientYPos, {
      align: "right",
    });
    clientYPos += 4;
  }
  if (quoteData.cliente.email) {
    doc.text(`Email: ${quoteData.cliente.email}`, pageWidth - margin, clientYPos, {
      align: "right",
    });
  }

  // Preventivo numero e oggetto allineati a sinistra
  yPos = Math.max(yPos, clientYPos) + 10;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text(
    `Preventivo N. ${quoteData.numero.toString().padStart(2, "0")}-${quoteData.anno}`,
    margin,
    yPos
  );
  yPos += 6;
  doc.setFontSize(11);
  doc.text(`Oggetto: ${quoteData.oggetto}`, margin, yPos);
  yPos += 8;

  // Ubicazione lavoro
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  const ubicazioneText = `Ubicazione lavoro: ${quoteData.ubicazione.via}, ${quoteData.ubicazione.cap} ${quoteData.ubicazione.citta} (${quoteData.ubicazione.provincia})`;
  doc.text(ubicazioneText, margin, yPos);
  yPos += 8;

  // Tabella delle voci con subtotale e totale integrati
  const tableData = quoteData.righe.map((riga, index) => [
    (index + 1).toString(),
    riga.descrizione,
    riga.unita_misura,
    riga.quantita.toString(),
    `€ ${formatCurrency(riga.prezzo_unitario)}`,
    `€ ${formatCurrency(riga.totale)}`,
  ]);

  // Aggiungi riga subtotale
  tableData.push([
    { content: "Subtotale:", colSpan: 5, styles: { halign: "right", fontStyle: "bold" } },
    `€ ${formatCurrency(quoteData.subtotale)}`,
  ] as any);

  // Aggiungi riga sconto se necessario
  if (
    quoteData.showDiscountInTable &&
    quoteData.sconto_percentuale &&
    quoteData.sconto_percentuale > 0
  ) {
    tableData.push([
      { content: "Sconto:", colSpan: 5, styles: { halign: "right", fontStyle: "bold", textColor: [255, 0, 0] } },
      { content: `-${quoteData.sconto_percentuale}%`, styles: { textColor: [255, 0, 0] } },
    ] as any);
  }

  // Aggiungi riga totale
  tableData.push([
    { content: "TOTALE:", colSpan: 5, styles: { halign: "right", fontStyle: "bold" } },
    `€ ${formatCurrency(quoteData.totale)}`,
  ] as any);

  autoTable(doc, {
    startY: yPos,
    head: [["Nr", "Descrizione", "U.M.", "Qtà", "Prezzo Unit.", "Totale"]],
    body: tableData,
    theme: "grid",
    styles: {
      fontSize: 9,
      cellPadding: 2,
      lineColor: [0, 0, 0],
      lineWidth: 0.1,
    },
    headStyles: {
      fillColor: [200, 200, 200],
      textColor: [0, 0, 0],
      fontStyle: "bold",
      halign: "center",
    },
    columnStyles: {
      0: { cellWidth: 10, halign: "center", valign: "bottom" },
      1: { cellWidth: "auto", halign: "left", valign: "bottom" },
      2: { cellWidth: 20, halign: "center", valign: "bottom" },
      3: { cellWidth: 18, halign: "right", valign: "bottom" },
      4: { cellWidth: 28, halign: "right", valign: "bottom" },
      5: { cellWidth: 28, halign: "right", valign: "bottom" },
    },
    didDrawPage: (data) => {
      // Aggiungi numero pagina su ogni pagina
      const pageCount = (doc as any).internal.getNumberOfPages();
      const currentPage = (doc as any).internal.getCurrentPageInfo().pageNumber;
      addPageNumber(currentPage, pageCount);
    },
  });

  // Posizione dopo la tabella
  yPos = (doc as any).lastAutoTable.finalY + 8;

  // Note (se presenti)
  if (quoteData.note) {
    yPos += 10;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("Note:", margin, yPos);
    yPos += 5;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    const noteLines = doc.splitTextToSize(quoteData.note, pageWidth - 2 * margin);
    doc.text(noteLines, margin, yPos);
    yPos += noteLines.length * 4;
  }

  // Modalità di pagamento
  if (quoteData.modalita_pagamento) {
    yPos += 5;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("Modalità di pagamento:", margin, yPos);
    yPos += 5;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(quoteData.modalita_pagamento, margin, yPos);
    yPos += 10;
  }

  // Firma per accettazione
  yPos += 5;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("Firma per Accettazione", pageWidth - margin, yPos, { align: "right" });
  yPos += 15;
  doc.setFont("helvetica", "normal");
  doc.line(pageWidth - margin - 60, yPos, pageWidth - margin, yPos);

  // Aggiungi numeri di pagina su tutte le pagine
  const totalPages = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    addPageNumber(i, totalPages);
  }

  return doc;
};
