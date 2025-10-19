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
  return new Intl.NumberFormat("it-IT", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

export const generateQuotePDF = async (quoteData: QuoteData, settings: CompanySettings): Promise<jsPDF> => {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 12.7;
  let yPos = margin;

  const addFooter = (currentPage: number, totalPages: number, showCompanyData: boolean = true) => {
    const footerY = pageHeight - 10;

    if (!showCompanyData) {
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text(`Pagina ${currentPage} di ${totalPages}`, pageWidth - margin, footerY, { align: "right" });
      return;
    }

    if (settings.logoPath) {
      try {
        doc.addImage(settings.logoPath, "PNG", margin, footerY - 6, 15, 8);
      } catch (error) {
        console.warn("Logo footer non caricato:", error);
      }
    }

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

    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text(`Pagina ${currentPage} di ${totalPages}`, pageWidth - margin, footerY, { align: "right" });
  };

  if (settings.logoPath) {
    try {
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

  yPos = Math.max(yPos, clientYPos) + 10;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text(`Preventivo N. ${quoteData.numero.toString().padStart(2, "0")}-${quoteData.anno}`, margin, yPos);
  yPos += 6;
  doc.setFontSize(11);
  doc.text(`Oggetto: ${quoteData.oggetto}`, margin, yPos);
  yPos += 8;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  const ubicazioneText = `Ubicazione lavoro: ${quoteData.ubicazione.via}, ${quoteData.ubicazione.cap} ${quoteData.ubicazione.citta} (${quoteData.ubicazione.provincia})`;
  doc.text(ubicazioneText, margin, yPos);
  yPos += 8;

  // Prepara i dati della tabella
  const tableData: any[] = [];
  const rowMetadata: Map<number, { um: string; qty: string; price: string; total: string }> = new Map();

  quoteData.righe.forEach((riga, index) => {
    const um = riga.unita_misura;
    const qty = riga.quantita.toString();
    const price = `€ ${formatCurrency(riga.prezzo_unitario)}`;
    const total = `€ ${formatCurrency(riga.totale)}`;

    rowMetadata.set(index, { um, qty, price, total });

    tableData.push([(index + 1).toString(), riga.descrizione, um, qty, price, total]);
  });

  // Tracciamento delle righe divise
  const rowPageMap: Map<number, { pages: number[]; cells: any[] }> = new Map();

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
      2: { cellWidth: 15, halign: "center", valign: "top" },
      3: { cellWidth: 12, halign: "right", valign: "top" },
      4: { cellWidth: 24, halign: "right", valign: "top" },
      5: { cellWidth: 24, halign: "right", valign: "top" },
    },
    margin: { bottom: 25 },

    didDrawCell: (data) => {
      if (data.section === "body") {
        const rowIndex = data.row.index;

        // Inizializza il tracking per questa riga se non esiste
        if (!rowPageMap.has(rowIndex)) {
          rowPageMap.set(rowIndex, { pages: [], cells: [] });
        }

        const rowData = rowPageMap.get(rowIndex)!;

        // Aggiungi la pagina se non è già presente
        if (!rowData.pages.includes(data.pageNumber)) {
          rowData.pages.push(data.pageNumber);
        }

        // Salva i dati della cella
        rowData.cells.push({
          columnIndex: data.column.index,
          page: data.pageNumber,
          x: data.cell.x,
          y: data.cell.y,
          width: data.cell.width,
          height: data.cell.height,
        });
      }
    },

    didDrawPage: (data) => {
      const pageCount = (doc as any).internal.getNumberOfPages();
      const currentPage = data.pageNumber;
      addFooter(currentPage, pageCount, currentPage !== 1);
    },
  });

  // Post-processing: nascondi i valori nelle prime parti e ridisegnali nell'ultima
  rowPageMap.forEach((rowData, rowIndex) => {
    if (rowData.pages.length > 1) {
      // Questa riga è divisa su più pagine
      const lastPage = Math.max(...rowData.pages);
      const metadata = rowMetadata.get(rowIndex);

      if (!metadata) return;

      // Filtra le celle per colonne 2-5 (U.M., Qtà, Prezzo, Totale)
      const valueCells = rowData.cells.filter((cell) => cell.columnIndex >= 2 && cell.columnIndex <= 5);

      // Nascondi i valori in tutte le pagine tranne l'ultima
      valueCells.forEach((cell) => {
        if (cell.page !== lastPage) {
          doc.setPage(cell.page);
          doc.setFillColor(255, 255, 255);
          doc.rect(cell.x, cell.y, cell.width, cell.height, "F");

          // Ridisegna solo i bordi
          doc.setDrawColor(0, 0, 0);
          doc.setLineWidth(0.3);
          doc.rect(cell.x, cell.y, cell.width, cell.height, "S");
        }
      });

      // Ridisegna i valori nell'ultima pagina, allineati in basso
      const lastPageCells = valueCells.filter((cell) => cell.page === lastPage);

      doc.setPage(lastPage);
      doc.setFontSize(9);
      doc.setTextColor(0, 0, 0);
      doc.setFont("helvetica", "normal");

      lastPageCells.forEach((cell) => {
        let text = "";
        let align: "center" | "right" = "center";

        switch (cell.columnIndex) {
          case 2: // U.M.
            text = metadata.um;
            align = "center";
            break;
          case 3: // Qtà
            text = metadata.qty;
            align = "right";
            break;
          case 4: // Prezzo Unit.
            text = metadata.price;
            align = "right";
            break;
          case 5: // Totale
            text = metadata.total;
            align = "right";
            break;
        }

        // Cancella il contenuto esistente
        doc.setFillColor(255, 255, 255);
        doc.rect(cell.x, cell.y, cell.width, cell.height, "F");

        // Ridisegna i bordi
        doc.setDrawColor(0, 0, 0);
        doc.setLineWidth(0.3);
        doc.rect(cell.x, cell.y, cell.width, cell.height, "S");

        // Calcola la posizione Y per allineare il testo in basso
        const textY = cell.y + cell.height - 2;

        if (align === "center") {
          doc.text(text, cell.x + cell.width / 2, textY, { align: "center" });
        } else {
          doc.text(text, cell.x + cell.width - 2, textY, { align: "right" });
        }
      });
    }
  });

  yPos = (doc as any).lastAutoTable.finalY + 8;

  const summaryHeight = 15;
  const notesHeight = quoteData.note ? 25 : 0;
  const paymentHeight = quoteData.modalita_pagamento ? 20 : 0;
  const signatureHeight = 25;
  const totalNeededSpace = summaryHeight + notesHeight + paymentHeight + signatureHeight;

  if (yPos + totalNeededSpace > pageHeight - margin - 10) {
    doc.addPage();
    yPos = margin;
  }

  const summaryData: any[] = [];
  summaryData.push([
    { content: "Subtotale:", colSpan: 5, styles: { halign: "right", fontStyle: "bold" } },
    `€ ${formatCurrency(quoteData.subtotale)}`,
  ]);

  if (quoteData.showDiscountInTable && quoteData.sconto_percentuale && quoteData.sconto_percentuale > 0) {
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
    margin: { bottom: 25 },
    didDrawPage: (data) => {
      const pageCount = (doc as any).internal.getNumberOfPages();
      const currentPage = (doc as any).internal.getCurrentPageInfo().pageNumber;
      addFooter(currentPage, pageCount, currentPage !== 1);
    },
  });

  yPos = (doc as any).lastAutoTable.finalY + 8;

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

  yPos += 5;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("Firma per Accettazione", pageWidth - margin, yPos, { align: "right" });
  yPos += 15;
  doc.setFont("helvetica", "normal");
  doc.line(pageWidth - margin - 60, yPos, pageWidth - margin, yPos);

  const totalPages = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    addFooter(i, totalPages, i !== 1);
  }

  return doc;
};
