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

  // Prepara i dati della tabella - SENZA valori nelle colonne 2-5
  const tableData: any[] = [];
  const rowMetadata: Map<number, { nr: string; um: string; qty: string; price: string; total: string }> = new Map();

  quoteData.righe.forEach((riga, index) => {
    const nr = (index + 1).toString();
    const um = riga.unita_misura;
    const qty = riga.quantita.toString();
    const price = `€ ${formatCurrency(riga.prezzo_unitario)}`;
    const total = `€ ${formatCurrency(riga.totale)}`;

    rowMetadata.set(index, { nr, um, qty, price, total });

    // IMPORTANTE: Le colonne 2-5 sono vuote, le riempiremo dopo
    tableData.push([
      nr,
      riga.descrizione,
      "", // U.M. vuota
      "", // Qtà vuota
      "", // Prezzo vuoto
      "", // Totale vuoto
    ]);
  });

  // Tracciamento delle celle per ogni riga e pagina
  const rowCellsMap: Map<
    number,
    Array<{
      columnIndex: number;
      page: number;
      x: number;
      y: number;
      width: number;
      height: number;
    }>
  > = new Map();

  // Traccia l'ultima cella disegnata per ogni riga
  const rowLastCellMap: Map<
    number,
    {
      page: number;
      y: number;
      height: number;
    }
  > = new Map();

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

    didDrawCell: (data) => {
      if (data.section === "body") {
        const rowIndex = data.row.index;

        if (!rowCellsMap.has(rowIndex)) {
          rowCellsMap.set(rowIndex, []);
        }

        const cellInfo = {
          columnIndex: data.column.index,
          page: data.pageNumber,
          x: data.cell.x,
          y: data.cell.y,
          width: data.cell.width,
          height: data.cell.height,
        };

        rowCellsMap.get(rowIndex)!.push(cellInfo);

        // Aggiorna l'ultima cella della riga (usiamo colonna descrizione come riferimento)
        if (data.column.index === 1) {
          rowLastCellMap.set(rowIndex, {
            page: data.pageNumber,
            y: data.cell.y,
            height: data.cell.height,
          });
        }
      }
    },

    didDrawPage: (data) => {
      const pageCount = (doc as any).internal.getNumberOfPages();
      const currentPage = data.pageNumber;
      addFooter(currentPage, pageCount, currentPage !== 1);
    },
  });

  // Post-processing: riempi le celle vuote con i valori corretti
  rowCellsMap.forEach((cells, rowIndex) => {
    const metadata = rowMetadata.get(rowIndex);
    if (!metadata) return;

    // Raggruppa celle per pagina
    const cellsByPage: Map<number, typeof cells> = new Map();
    cells.forEach((cell) => {
      if (!cellsByPage.has(cell.page)) {
        cellsByPage.set(cell.page, []);
      }
      cellsByPage.get(cell.page)!.push(cell);
    });

    const pages = [...cellsByPage.keys()].sort((a, b) => a - b);
    const isMultiPage = pages.length > 1;
    const firstPage = pages[0];
    const lastPage = pages[pages.length - 1];

    // Per ogni pagina dove appare la riga
    pages.forEach((page, pageIdx) => {
      const isFirst = pageIdx === 0;
      const isLast = pageIdx === pages.length - 1;
      const pageCells = cellsByPage.get(page)!;

      doc.setPage(page);
      doc.setFontSize(9);
      doc.setTextColor(0, 0, 0);
      doc.setFont("helvetica", "normal");

      pageCells.forEach((cell) => {
        // Colonna Nr (0)
        if (cell.columnIndex === 0 && isMultiPage && !isFirst) {
          // Cancella il numero nelle pagine successive
          doc.setFillColor(255, 255, 255);
          doc.rect(cell.x, cell.y, cell.width, cell.height, "F");
          doc.setDrawColor(0, 0, 0);
          doc.setLineWidth(0.3);
          doc.rect(cell.x, cell.y, cell.width, cell.height, "S");
        }

        // Colonne valori (2-5): mostra solo nell'ultima pagina
        if (cell.columnIndex >= 2 && cell.columnIndex <= 5) {
          if (!isMultiPage || isLast) {
            // Disegna i valori
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

            // Allinea il testo in basso della cella
            const textY = cell.y + cell.height - 2;

            if (align === "center") {
              doc.text(text, cell.x + cell.width / 2, textY, { align: "center" });
            } else {
              doc.text(text, cell.x + cell.width - 2, textY, { align: "right" });
            }
          }
        }
      });
    });
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
