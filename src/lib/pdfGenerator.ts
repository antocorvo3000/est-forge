import jsPDF from "jspdf";
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

// Funzione per calcolare hash SHA-256 semplificato del documento
const generateDocumentHash = (quoteData: QuoteData): string => {
  const dataString = `${quoteData.numero}-${quoteData.anno}-${quoteData.totale}-${quoteData.cliente.nome}-${quoteData.oggetto}`;
  let hash = 0;
  for (let i = 0; i < dataString.length; i++) {
    const char = dataString.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16).toUpperCase().padStart(8, '0');
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
  const margin = 12.7;
  const footerHeight = 15;
  const topMargin = margin;
  const bottomMargin = margin + footerHeight;
  const minSpaceBeforeBreak = 15;

  // Genera hash documento univoco
  const documentHash = generateDocumentHash(quoteData);
  const quoteReference = `${quoteData.numero.toString().padStart(2, "0")}-${quoteData.anno}`;

  // Configurazione colonne
  const colWidths = {
    nr: 8,
    desc: 0,
    um: 15,
    qty: 12,
    price: 24,
    total: 24,
  };

  colWidths.desc =
    pageWidth - 2 * margin - colWidths.nr - colWidths.um - colWidths.qty - colWidths.price - colWidths.total;

  // NUOVA FUNZIONE: Watermark su ogni pagina
  const addWatermark = (currentPage: number, totalPages: number) => {
    doc.setTextColor(200, 200, 200);
    doc.setFontSize(40);
    doc.setFont("helvetica", "bold");
    
    const watermarkText = `Prev. ${quoteReference}`;
    const watermarkText2 = `Tot. € ${formatCurrency(quoteData.totale)}`;
    
    // Salva stato corrente
    doc.saveGraphicsState();
    
    // Ruota e posiziona watermark diagonale
    const centerX = pageWidth / 2;
    const centerY = pageHeight / 2;
    
    doc.setGState(new doc.GState({ opacity: 0.1 }));
    
    // Watermark principale
    const angle = -45;
    const radians = (angle * Math.PI) / 180;
    
    doc.text(watermarkText, centerX, centerY - 10, {
      align: "center",
      angle: angle,
    });
    
    doc.text(watermarkText2, centerX, centerY + 10, {
      align: "center",
      angle: angle,
    });
    
    // Ripristina stato
    doc.restoreGraphicsState();
    doc.setTextColor(0, 0, 0);
  };

  // NUOVA FUNZIONE: Box identificativo documento in alto a ogni pagina (tranne prima)
  const addDocumentIdentifier = (currentPage: number, totalPages: number) => {
    if (currentPage === 1) return;
    
    const boxHeight = 8;
    const boxY = topMargin;
    
    // Box con sfondo chiaro
    doc.setFillColor(245, 245, 250);
    doc.setDrawColor(100, 100, 150);
    doc.setLineWidth(0.3);
    doc.rect(margin, boxY, pageWidth - 2 * margin, boxHeight, "FD");
    
    // Testo identificativo
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(60, 60, 80);
    
    const identifierText = `PREVENTIVO N. ${quoteReference} | TOTALE: € ${formatCurrency(quoteData.totale)} | HASH: ${documentHash} | PAG. ${currentPage}/${totalPages}`;
    doc.text(identifierText, pageWidth / 2, boxY + 5, { align: "center" });
    
    doc.setTextColor(0, 0, 0);
  };

  const addFooter = (currentPage: number, totalPages: number, showCompanyData: boolean = true) => {
    const footerBaseY = pageHeight - footerHeight + 2;

    if (!showCompanyData) {
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text(`Pagina ${currentPage} di ${totalPages}`, pageWidth - margin, footerBaseY + 6, {
        align: "right",
      });
      return;
    }

    if (settings.logoPath) {
      try {
        const img = new Image();
        img.src = settings.logoPath;

        const maxFooterWidth = 10;
        const maxFooterHeight = 5;
        const imgAspectRatio = img.width / img.height;

        let footerLogoWidth = maxFooterWidth;
        let footerLogoHeight = maxFooterWidth / imgAspectRatio;

        if (footerLogoHeight > maxFooterHeight) {
          footerLogoHeight = maxFooterHeight;
          footerLogoWidth = maxFooterHeight * imgAspectRatio;
        }

        doc.addImage(
          settings.logoPath,
          "PNG",
          margin,
          footerBaseY,
          footerLogoWidth,
          footerLogoHeight
        );
      } catch (error) {
        console.warn("Logo footer non caricato:", error);
      }
    }

    doc.setFontSize(6.5);
    doc.setTextColor(80, 80, 80);
    const centerX = pageWidth / 2;

    const companyDataLine = `${settings.name} - P.IVA ${settings.vatNumber} - ${settings.address} - Tel. ${settings.phone} - ${settings.email}`;
    doc.setFont("helvetica", "normal");
    doc.text(companyDataLine, centerX, footerBaseY + 6, { align: "center" });

    doc.setFontSize(7.5);
    doc.setTextColor(100, 100, 100);
    doc.text(`Pagina ${currentPage} di ${totalPages}`, pageWidth - margin, footerBaseY + 6, {
      align: "right",
    });
  };

  let yPos = topMargin;

  // Logo e intestazione
  if (settings.logoPath) {
    try {
      const img = new Image();
      img.src = settings.logoPath;
      await new Promise((resolve) => {
        img.onload = resolve;
      });

      const maxHeaderWidth = 40;
      const maxHeaderHeight = 20;
      const imgAspectRatio = img.width / img.height;

      let headerLogoWidth = maxHeaderWidth;
      let headerLogoHeight = maxHeaderWidth / imgAspectRatio;

      if (headerLogoHeight > maxHeaderHeight) {
        headerLogoHeight = maxHeaderHeight;
        headerLogoWidth = maxHeaderHeight * imgAspectRatio;
      }

      doc.addImage(settings.logoPath, "PNG", margin, yPos, headerLogoWidth, headerLogoHeight);
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

  // Cliente
  let clientYPos = topMargin + 25;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text(`C.a. ${quoteData.cliente.nome}`, pageWidth - margin, clientYPos, { align: "right" });
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
    doc.text(quoteData.cliente.address, pageWidth - margin, clientYPos, { align: "right" });
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
  doc.text(`Preventivo N. ${quoteReference}`, margin, yPos);
  
  // NUOVO: Hash documento visibile nella prima pagina
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(100, 100, 100);
  doc.text(`Codice Documento: ${documentHash}`, margin, yPos + 3);
  doc.setTextColor(0, 0, 0);
  
  yPos += 9;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text(`Oggetto: ${quoteData.oggetto}`, margin, yPos);
  yPos += 8;

  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("Ubicazione lavoro:", margin, yPos);
  const ubicazioneLabel = "Ubicazione lavoro:";
  const labelWidth = doc.getTextWidth(ubicazioneLabel);
  doc.setFont("helvetica", "normal");
  const ubicazioneText = ` ${quoteData.ubicazione.via}, ${quoteData.ubicazione.cap} ${quoteData.ubicazione.citta} (${quoteData.ubicazione.provincia})`;
  doc.text(ubicazioneText, margin + labelWidth, yPos);
  yPos += 8;

  const drawTableHeader = (y: number, showCarriedForward: boolean = false, carriedAmount: number = 0) => {
    if (showCarriedForward && carriedAmount > 0) {
      const carriedHeight = 6;
      doc.setFillColor(240, 248, 255);
      doc.setDrawColor(70, 130, 180);
      doc.setLineWidth(0.3);

      let x = margin;
      doc.rect(
        x,
        y,
        colWidths.nr + colWidths.desc + colWidths.um + colWidths.qty + colWidths.price,
        carriedHeight,
        "FD"
      );
      doc.rect(
        x + colWidths.nr + colWidths.desc + colWidths.um + colWidths.qty + colWidths.price,
        y,
        colWidths.total,
        carriedHeight,
        "FD"
      );

      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(70, 130, 180);
      doc.text("← Riporto da pagina precedente", margin + 2, y + carriedHeight - 1.5);
      doc.text(`€ ${formatCurrency(carriedAmount)}`, pageWidth - margin - 2, y + carriedHeight - 1.5, {
        align: "right",
      });
      doc.setTextColor(0, 0, 0);

      y += carriedHeight;
    }

    doc.setFillColor(200, 200, 200);
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.3);

    let x = margin;
    const headerHeight = 7;

    doc.rect(x, y, colWidths.nr, headerHeight, "FD");
    x += colWidths.nr;
    doc.rect(x, y, colWidths.desc, headerHeight, "FD");
    x += colWidths.desc;
    doc.rect(x, y, colWidths.um, headerHeight, "FD");
    x += colWidths.um;
    doc.rect(x, y, colWidths.qty, headerHeight, "FD");
    x += colWidths.qty;
    doc.rect(x, y, colWidths.price, headerHeight, "FD");
    x += colWidths.price;
    doc.rect(x, y, colWidths.total, headerHeight, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0);

    x = margin;
    const textY = y + headerHeight - 2;

    doc.text("Nr", x + colWidths.nr / 2, textY, { align: "center" });
    x += colWidths.nr;
    doc.text("Descrizione", x + colWidths.desc / 2, textY, { align: "center" });
    x += colWidths.desc;
    doc.text("U.M.", x + colWidths.um / 2, textY, { align: "center" });
    x += colWidths.um;
    doc.text("Qtà", x + colWidths.qty / 2, textY, { align: "center" });
    x += colWidths.qty;
    doc.text("Prezzo Unit.", x + colWidths.price / 2, textY, { align: "center" });
    x += colWidths.price;
    doc.text("Totale", x + colWidths.total / 2, textY, { align: "center" });

    return y + headerHeight;
  };

  const drawPageSubtotalBox = (y: number, pageSubtotal: number, runningTotal: number, pageNumber: number) => {
    const boxHeight = 14;
    const boxWidth = 80;
    const boxX = pageWidth - margin - boxWidth;

    doc.setFillColor(255, 248, 230);
    doc.setDrawColor(220, 160, 70);
    doc.setLineWidth(0.4);
    doc.rect(boxX, y, boxWidth, boxHeight, "FD");

    doc.setDrawColor(220, 160, 70);
    doc.setLineWidth(0.2);
    doc.line(boxX, y + 7, boxX + boxWidth, y + 7);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(0, 0, 0);

    doc.text(`Subtotale Pagina ${pageNumber}:`, boxX + 2, y + 5);
    doc.text(`€ ${formatCurrency(pageSubtotal)}`, boxX + boxWidth - 2, y + 5, { align: "right" });

    doc.setTextColor(220, 100, 0);
    doc.text("Totale Progressivo:", boxX + 2, y + 11);
    doc.text(`€ ${formatCurrency(runningTotal)}`, boxX + boxWidth - 2, y + 11, { align: "right" });

    doc.setTextColor(0, 0, 0);

    doc.setFont("helvetica", "italic");
    doc.setFontSize(7);
    doc.setTextColor(100, 100, 100);
    doc.text("(Continua alla pagina successiva)", pageWidth - margin, y + boxHeight + 3, { align: "right" });
    doc.setTextColor(0, 0, 0);

    return y + boxHeight + 5;
  };

  let cumulativeSubtotal = 0;
  let pageSubtotal = 0;
  let currentPageNumber = 1;
  let itemsProcessed = 0;
  const firstPageTableStart = yPos;
  let isFirstPage = true;
  let carriedForwardAmount = 0;
  let notesPrinted = false;
  let paymentPrinted = false;
  let signaturePrinted = false;

  yPos = drawTableHeader(yPos, false, 0);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(0, 0, 0);

  quoteData.righe.forEach((riga, index) => {
    const nr = (index + 1).toString();
    const um = riga.unita_misura;
    const qty = riga.quantita.toString();
    const price = `€ ${formatCurrency(riga.prezzo_unitario)}`;
    const total = `€ ${formatCurrency(riga.totale)}`;

    const descLines = doc.splitTextToSize(riga.descrizione, colWidths.desc - 4);
    const lineHeight = 4;
    const minChunkHeight = 10;

    const totalRowHeight = Math.max(descLines.length * lineHeight + 4, minChunkHeight);
    const spaceLeft = pageHeight - bottomMargin - yPos;

    if (totalRowHeight > spaceLeft - 20) {
      if (!isFirstPage || yPos > firstPageTableStart + 20) {
        yPos = drawPageSubtotalBox(yPos + 3, pageSubtotal, cumulativeSubtotal, currentPageNumber);
        carriedForwardAmount = cumulativeSubtotal;
        pageSubtotal = 0;
      }

      doc.addPage();
      currentPageNumber++;
      yPos = topMargin + 10; // Spazio per box identificativo
      isFirstPage = false;
      yPos = drawTableHeader(yPos, true, carriedForwardAmount);
    }

    const rowStartY = yPos;
    let x = margin;

    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.3);
    doc.rect(x, rowStartY, colWidths.nr, totalRowHeight);
    x += colWidths.nr;
    doc.rect(x, rowStartY, colWidths.desc, totalRowHeight);
    x += colWidths.desc;
    doc.rect(x, rowStartY, colWidths.um, totalRowHeight);
    x += colWidths.um;
    doc.rect(x, rowStartY, colWidths.qty, totalRowHeight);
    x += colWidths.qty;
    doc.rect(x, rowStartY, colWidths.price, totalRowHeight);
    x += colWidths.price;
    doc.rect(x, rowStartY, colWidths.total, totalRowHeight);

    x = margin;

    doc.setFont("helvetica", "normal");
    doc.text(nr, x + colWidths.nr / 2, rowStartY + 5, { align: "center" });
    x += colWidths.nr;

    doc.setFont("helvetica", "normal");
    for (let i = 0; i < descLines.length; i++) {
      doc.text(descLines[i], x + 2, rowStartY + 5 + i * lineHeight);
    }
    x += colWidths.desc;

    doc.setFont("helvetica", "normal");
    const bottomTextY = rowStartY + totalRowHeight - 2;

    doc.text(um, x + colWidths.um / 2, bottomTextY, { align: "center" });
    x += colWidths.um;

    doc.text(qty, x + colWidths.qty - 2, bottomTextY, { align: "right" });
    x += colWidths.qty;

    doc.text(price, x + colWidths.price - 2, bottomTextY, { align: "right" });
    x += colWidths.price;

    doc.text(total, x + colWidths.total - 2, bottomTextY, { align: "right" });

    cumulativeSubtotal += riga.totale;
    pageSubtotal += riga.totale;
    itemsProcessed++;

    yPos += totalRowHeight;
  });

  yPos += 5;

  const spaceNeededForTotals = 25;
  const spaceAvailableForTotals = pageHeight - bottomMargin - yPos;

  if (spaceAvailableForTotals < spaceNeededForTotals) {
    yPos = drawPageSubtotalBox(yPos + 3, pageSubtotal, cumulativeSubtotal, currentPageNumber);
    carriedForwardAmount = cumulativeSubtotal;
    pageSubtotal = 0;

    doc.addPage();
    currentPageNumber++;
    yPos = topMargin + 10;
    yPos = drawTableHeader(yPos, true, carriedForwardAmount);
    yPos += 5;
  }

  const summaryStartX = margin;
  const summaryHeight = 6;

  doc.setFont("helvetica", "bold");
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.3);
  doc.setTextColor(0, 0, 0);

  // Subtotale finale
  doc.rect(
    summaryStartX,
    yPos,
    colWidths.nr + colWidths.desc + colWidths.um + colWidths.qty + colWidths.price,
    summaryHeight
  );
  doc.rect(
    summaryStartX + colWidths.nr + colWidths.desc + colWidths.um + colWidths.qty + colWidths.price,
    yPos,
    colWidths.total,
    summaryHeight
  );

  doc.text("Subtotale:", pageWidth - margin - colWidths.total - 2, yPos + summaryHeight - 2, {
    align: "right",
  });
  doc.text(`€ ${formatCurrency(quoteData.subtotale)}`, pageWidth - margin - 2, yPos + summaryHeight - 2, {
    align: "right",
  });

  yPos += summaryHeight;

  if (quoteData.showDiscountInTable && quoteData.sconto_percentuale && quoteData.sconto_percentuale > 0) {
    doc.rect(
      summaryStartX,
      yPos,
      colWidths.nr + colWidths.desc + colWidths.um + colWidths.qty + colWidths.price,
      summaryHeight
    );
    doc.rect(
      summaryStartX + colWidths.nr + colWidths.desc + colWidths.um + colWidths.qty + colWidths.price,
      yPos,
      colWidths.total,
      summaryHeight
    );

    doc.setTextColor(255, 0, 0);
    doc.text("Sconto:", pageWidth - margin - colWidths.total - 2, yPos + summaryHeight - 2, {
      align: "right",
    });
    doc.text(`-${quoteData.sconto_percentuale}%`, pageWidth - margin - 2, yPos + summaryHeight - 2, {
      align: "right",
    });
    doc.setTextColor(0, 0, 0);

    yPos += summaryHeight;
  }

  // Totale finale
  doc.rect(
    summaryStartX,
    yPos,
    colWidths.nr + colWidths.desc + colWidths.um + colWidths.qty + colWidths.price,
    summaryHeight
  );
  doc.rect(
    summaryStartX + colWidths.nr + colWidths.desc + colWidths.um + colWidths.qty + colWidths.price,
    yPos,
    colWidths.total,
    summaryHeight
  );

  doc.text("TOTALE:", pageWidth - margin - colWidths.total - 2, yPos + summaryHeight - 2, {
    align: "right",
  });
  doc.text(`€ ${formatCurrency(quoteData.totale)}`, pageWidth - margin - 2, yPos + summaryHeight - 2, {
    align: "right",
  });

  yPos += summaryHeight + 10;

  let totalBottomContentHeight = 0;

  if (quoteData.note && !notesPrinted) {
    const noteLines = doc.splitTextToSize(quoteData.note, pageWidth - 2 * margin);
    totalBottomContentHeight += 15 + noteLines.length * 4 + 5;
  }

  if (quoteData.modalita_pagamento && !paymentPrinted) {
    const paymentLines = doc.splitTextToSize(quoteData.modalita_pagamento, pageWidth - 2 * margin);
    totalBottomContentHeight += 10 + paymentLines.length * 4 + 10;
  }

  if (!signaturePrinted) {
    totalBottomContentHeight += 35; // Più spazio per disclaimer firma
  }

  if ((pageHeight - bottomMargin - yPos) < totalBottomContentHeight + minSpaceBeforeBreak) {
    doc.addPage();
    yPos = topMargin + 10;
  }

  if (quoteData.note && !notesPrinted) {
    yPos += 10;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("Note:", margin, yPos);
    yPos += 5;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    const noteLines = doc.splitTextToSize(quoteData.note, pageWidth - 2 * margin);
    doc.text(noteLines, margin, yPos);
    yPos += noteLines.length * 4 + 5;
    notesPrinted = true;
  }

  if (quoteData.modalita_pagamento && !paymentPrinted) {
    yPos += 5;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("Modalità di pagamento:", margin, yPos);
    yPos += 5;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    const paymentLines = doc.splitTextToSize(quoteData.modalita_pagamento, pageWidth - 2 * margin);
    doc.text(paymentLines, margin, yPos);
    yPos += paymentLines.length * 4 + 10;
    paymentPrinted = true;
  }

  // NUOVO: Firma con disclaimer specifico
  if (!signaturePrinted) {
    yPos += 5;
    
    // Box disclaimer firma
    const disclaimerBoxHeight = 12;
    doc.setFillColor(255, 250, 240);
    doc.setDrawColor(200, 150, 50);
    doc.setLineWidth(0.3);
    doc.rect(margin, yPos, pageWidth - 2 * margin, disclaimerBoxHeight, "FD");
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(150, 100, 0);
    doc.text("ATTENZIONE:", margin + 2, yPos + 4);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(0, 0, 0);
    const disclaimerText = `Con la firma si accetta il Preventivo N. ${quoteReference} (Codice: ${documentHash}) per un importo totale di € ${formatCurrency(quoteData.totale)}. Verificare che tutte le pagine del presente documento rechino lo stesso numero di preventivo e codice documento.`;
    const disclaimerLines = doc.splitTextToSize(disclaimerText, pageWidth - 2 * margin - 50);
    doc.text(disclaimerLines, margin + 45, yPos + 4);
    
    yPos += disclaimerBoxHeight + 5;
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text("Firma per Accettazione", pageWidth - margin, yPos, { align: "right" });
    yPos += 15;
    doc.setFont("helvetica", "normal");
    doc.line(pageWidth - margin - 60, yPos, pageWidth - margin, yPos);
    signaturePrinted = true;
  }

  // Applica watermark e identificativi a tutte le pagine
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    addWatermark(i, totalPages);
    addDocumentIdentifier(i, totalPages);
    addFooter(i, totalPages, i !== 1);
  }

  return doc;
};
