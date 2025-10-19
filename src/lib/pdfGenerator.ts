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

  // Helper per aggiungere footer con logo, dati azienda e numero pagina
  const addFooter = (currentPage: number, totalPages: number, showCompanyData: boolean = true) => {
    const footerY = pageHeight - 10;
    
    // Prima pagina: solo numero pagina (dati azienda già presenti in alto)
    if (!showCompanyData) {
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text(
        `Pagina ${currentPage} di ${totalPages}`,
        pageWidth - margin,
        footerY,
        { align: "right" }
      );
      return;
    }
    
    // Altre pagine: logo + dati azienda + numero pagina
    // Logo a sinistra (piccolo)
    if (settings.logoPath) {
      try {
        doc.addImage(settings.logoPath, "PNG", margin, footerY - 6, 15, 8);
      } catch (error) {
        console.warn("Logo footer non caricato:", error);
      }
    }
    
    // Dati azienda al centro
    doc.setFontSize(7);
    doc.setTextColor(80, 80, 80);
    const centerX = pageWidth / 2;
    let footerTextY = footerY - 6;
    
    doc.setFont("helvetica", "bold");
    doc.text(settings.name, centerX, footerTextY, { align: "center" });
    footerTextY += 3;
    
    doc.setFont("helvetica", "normal");
    doc.text(`P.IVA ${settings.vatNumber} - ${settings.address}`, centerX, footerTextY, { align: "center" });
    footerTextY += 3;
    doc.text(`Tel. ${settings.phone} - Email: ${settings.email}`, centerX, footerTextY, { align: "center" });
    
    // Numero pagina a destra
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text(
      `Pagina ${currentPage} di ${totalPages}`,
      pageWidth - margin,
      footerY,
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

  // Funzione helper per pre-splittare le descrizioni lunghe
  const splitDescriptionIntoRows = (
    itemNumber: string,
    descriptionText: string,
    um: string,
    qty: string,
    priceUnit: string,
    total: string,
    maxLinesPerChunk: number = 14
  ): any[] => {
    // Imposta font per calcolare correttamente le dimensioni
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    
    // Calcola larghezza disponibile per la descrizione
    const otherColumnsWidth = 8 + 15 + 12 + 24 + 24; // Nr + U.M. + Qtà + Prezzo + Totale
    const descColumnWidth = pageWidth - 2 * margin - otherColumnsWidth;
    
    // Spezza il testo in righe
    const lines = doc.splitTextToSize(descriptionText, descColumnWidth);
    
    if (lines.length === 0) {
      lines.push('');
    }
    
    // Se ci sono poche righe (1-2), crea una singola riga normale
    if (lines.length <= 2) {
      return [[itemNumber, descriptionText, um, qty, priceUnit, total]];
    }
    
    // Spezza in chunks
    const rows: any[] = [];
    const chunks: string[][] = [];
    
    for (let i = 0; i < lines.length; i += maxLinesPerChunk) {
      chunks.push(lines.slice(i, i + maxLinesPerChunk));
    }
    
    // Prima riga: numero + primo chunk descrizione (se più di un chunk)
    if (chunks.length === 1) {
      // Un solo chunk: riga completa con tutti i valori
      rows.push([itemNumber, chunks[0].join('\n'), um, qty, priceUnit, total]);
    } else {
      // Prima riga: numero + descrizione che occupa le restanti colonne
      rows.push([
        itemNumber,
        { content: chunks[0].join('\n'), colSpan: 5 }
      ]);
      
      // Righe intermedie (se ci sono): solo descrizione su tutta la larghezza
      for (let i = 1; i < chunks.length - 1; i++) {
        rows.push([
          { content: chunks[i].join('\n'), colSpan: 6 }
        ]);
      }
      
      // Ultima riga: ultimo chunk + valori numerici (allineati in basso)
      rows.push([
        '',
        { content: chunks[chunks.length - 1].join('\n'), styles: { valign: 'bottom' } },
        { content: um, styles: { valign: 'bottom' } },
        { content: qty, styles: { valign: 'bottom' } },
        { content: priceUnit, styles: { valign: 'bottom' } },
        { content: total, styles: { valign: 'bottom' } }
      ]);
    }
    
    return rows;
  };

  // Pre-split delle descrizioni e costruzione righe tabella
  const tableData: any[] = [];
  quoteData.righe.forEach((riga, index) => {
    const rows = splitDescriptionIntoRows(
      (index + 1).toString(),
      riga.descrizione,
      riga.unita_misura,
      riga.quantita.toString(),
      `€ ${formatCurrency(riga.prezzo_unitario)}`,
      `€ ${formatCurrency(riga.totale)}`,
      14 // maxLinesPerChunk - regolabile
    );
    tableData.push(...rows);
  });

  autoTable(doc, {
    startY: yPos,
    head: [["Nr", "Descrizione", "U.M.", "Qtà", "Prezzo Unit.", "Totale"]],
    body: tableData,
    theme: "grid",
    styles: {
      fontSize: 9,
      cellPadding: 2,
      lineColor: [0, 0, 0],
      lineWidth: 0.3,
      textColor: [0, 0, 0],
    },
    headStyles: {
      fillColor: [200, 200, 200],
      textColor: [0, 0, 0],
      fontStyle: "bold",
      halign: "center",
    },
    bodyStyles: {
      textColor: [0, 0, 0],
    },
    columnStyles: {
      0: { cellWidth: 8, halign: "center", valign: "top" },
      1: { cellWidth: "auto", halign: "left", valign: "top", overflow: "linebreak" },
      2: { cellWidth: 15, halign: "center", valign: "bottom" },
      3: { cellWidth: 12, halign: "right", valign: "bottom" },
      4: { cellWidth: 24, halign: "right", valign: "bottom" },
      5: { cellWidth: 24, halign: "right", valign: "bottom" },
    },
    margin: { bottom: 25 },
    didDrawPage: (data) => {
      const pageCount = (doc as any).internal.getNumberOfPages();
      const currentPage = data.pageNumber;
      addFooter(currentPage, pageCount, currentPage !== 1);
    },
  });

  // Posizione dopo la tabella
  yPos = (doc as any).lastAutoTable.finalY + 8;

  // Calcola spazio necessario per subtotale/sconto/totale + note + pagamento + firma
  const summaryHeight = 15; // Righe per subtotale, sconto (se presente), totale
  const notesHeight = quoteData.note ? 25 : 0;
  const paymentHeight = quoteData.modalita_pagamento ? 20 : 0;
  const signatureHeight = 25;
  const totalNeededSpace = summaryHeight + notesHeight + paymentHeight + signatureHeight;

  // Se non c'è abbastanza spazio, vai a nuova pagina
  if (yPos + totalNeededSpace > pageHeight - margin - 10) {
    doc.addPage();
    yPos = margin;
  }

  // Aggiungi subtotale, sconto e totale come tabella separata
  const summaryData: any[] = [];
  summaryData.push([
    { content: "Subtotale:", colSpan: 5, styles: { halign: "right", fontStyle: "bold" } },
    `€ ${formatCurrency(quoteData.subtotale)}`,
  ]);

  if (
    quoteData.showDiscountInTable &&
    quoteData.sconto_percentuale &&
    quoteData.sconto_percentuale > 0
  ) {
    summaryData.push([
      { content: "Sconto:", colSpan: 5, styles: { halign: "right", fontStyle: "bold", textColor: [255, 0, 0] } },
      { content: `-${quoteData.sconto_percentuale}%`, styles: { textColor: [255, 0, 0] } },
    ]);
  }

  summaryData.push([
    { content: "TOTALE:", colSpan: 5, styles: { halign: "right", fontStyle: "bold" } },
    `€ ${formatCurrency(quoteData.totale)}`,
  ]);

  autoTable(doc, {
    startY: yPos,
    body: summaryData,
    theme: "grid",
    styles: {
      fontSize: 9,
      cellPadding: 2,
      lineColor: [0, 0, 0],
      lineWidth: 0.3,
      textColor: [0, 0, 0],
    },
    columnStyles: {
      0: { cellWidth: 8 },
      1: { cellWidth: "auto" },
      2: { cellWidth: 15 },
      3: { cellWidth: 12 },
      4: { cellWidth: 24 },
      5: { cellWidth: 24 },
    },
    margin: { bottom: 25 }, // Margine inferiore per non sovrapporre il footer
    didDrawPage: (data) => {
      const pageCount = (doc as any).internal.getNumberOfPages();
      const currentPage = (doc as any).internal.getCurrentPageInfo().pageNumber;
      addFooter(currentPage, pageCount, currentPage !== 1);
    },
  });

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

  // Aggiungi footer su tutte le pagine
  const totalPages = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    addFooter(i, totalPages, i !== 1);
  }

  return doc;
};
