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

  const colWidths = {
    nr: 8,
    desc: 0,
    um: 15,
    qty: 12,
    price: 24,
    total: 24,
  };

  colWidths.desc =
    pageWidth -
    2 * margin -
    colWidths.nr -
    colWidths.um -
    colWidths.qty -
    colWidths.price -
    colWidths.total;

  const maxDescWidth = colWidths.desc - 4;

  const quoteReference = `${quoteData.numero.toString().padStart(2, "0")}-${quoteData.anno}`;

  // Spezza testo in modo intelligente:
  // - testo con spazi: usa word-break di jsPDF
  // - testo senza spazi o troppo lungo: spezza a forza carattere per carattere
  const splitSmart = (text: string, maxWidth: number): string[] => {
    // FONDAMENTALE: assicurati che il font sia corretto prima di misurare
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    
    // Primo tentativo: usa splitTextToSize (gestisce word-break)
    let lines: string[];
    try {
      lines = doc.splitTextToSize(text, maxWidth);
    } catch (e) {
      lines = [text];
    }
    
    const result: string[] = [];
    
    // Per ogni linea, verifica che stia effettivamente dentro maxWidth
    for (const line of lines) {
      const lineWidth = doc.getTextWidth(line);
      
      if (lineWidth <= maxWidth) {
        // OK, la linea ci sta
        result.push(line);
      } else {
        // La linea è ancora troppo lunga: spezzala a forza
        let remaining = line;
        
        while (remaining.length > 0) {
          // Trova quanti caratteri ci stanno
          let fitLength = remaining.length;
          
          while (fitLength > 0 && doc.getTextWidth(remaining.substring(0, fitLength)) > maxWidth) {
            fitLength--;
          }
          
          // Assicurati di prendere almeno 1 carattere (evita loop infinito)
          if (fitLength <= 0) {
            fitLength = 1;
          }
          
          result.push(remaining.substring(0, fitLength));
          remaining = remaining.substring(fitLength);
        }
      }
    }
    
    return result;
  };

  const addFooter = (
    currentPage: number,
    totalPages: number,
    showCompanyData: boolean = true
  ) => {
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
      } catch {
        // ignore
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

  // Logo header aumentato del 30% in più
  if (settings.logoPath) {
    try {
      const img = new Image();
      img.src = settings.logoPath;
      await new Promise((resolve) => {
        img.onload = resolve;
      });

      const maxHeaderWidth = 67.6;  // 52 * 1.3
      const maxHeaderHeight = 33.8;  // 26 * 1.3
      const imgAspectRatio = img.width / img.height;

      let headerLogoWidth = maxHeaderWidth;
      let headerLogoHeight = maxHeaderWidth / imgAspectRatio;

      if (headerLogoHeight > maxHeaderHeight) {
        headerLogoHeight = maxHeaderHeight;
        headerLogoWidth = maxHeaderHeight * imgAspectRatio;
      }

      doc.addImage(settings.logoPath, "PNG", margin, yPos, headerLogoWidth, headerLogoHeight);
    } catch {
      // ignore
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
  yPos += 6;
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

  const drawTableHeader = (y: number) => {
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

    // reset al font normale
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0);

    return y + headerHeight;
  };

  let currentPageNumber = 1;
  let notesPrinted = false;
  let paymentPrinted = false;
  let signaturePrinted = false;

  const pagesWithTotals: number[] = [];
  const pagesWithTableContent: number[] = [1];

  yPos = drawTableHeader(yPos);

  // RIGHE TABELLA con splitSmart
  quoteData.righe.forEach((riga, index) => {
    const nr = (index + 1).toString();
    const um = riga.unita_misura;
    const qty = riga.quantita.toString();
    const price = `€ ${formatCurrency(riga.prezzo_unitario)}`;
    const total = `€ ${formatCurrency(riga.totale)}`;

    // Assicura font corretto PRIMA di splitSmart
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    
    const fullDescLines = splitSmart(riga.descrizione, maxDescWidth);

    const lineHeight = 4;
    const cellPaddingTop = 5;
    const minRowHeight = 10;

    let startLineIndex = 0;

    while (startLineIndex < fullDescLines.length) {
      const availableHeight = pageHeight - bottomMargin - yPos;
      const maxLinesThisPage = Math.floor((availableHeight - cellPaddingTop) / lineHeight);

      if (maxLinesThisPage <= 0) {
        doc.addPage();
        currentPageNumber++;
        pagesWithTableContent.push(currentPageNumber);
        yPos = topMargin;
        yPos = drawTableHeader(yPos);
        continue;
      }

      const remainingLines = fullDescLines.length - startLineIndex;
      const linesThisChunk = Math.min(remainingLines, maxLinesThisPage);
      const chunkLines = fullDescLines.slice(
        startLineIndex,
        startLineIndex + linesThisChunk
      );
      const isLastChunk = startLineIndex + linesThisChunk >= fullDescLines.length;

      const rowHeight = Math.max(chunkLines.length * lineHeight + cellPaddingTop, minRowHeight);
      const spaceForRow = pageHeight - bottomMargin - yPos;

      if (rowHeight > spaceForRow) {
        doc.addPage();
        currentPageNumber++;
        pagesWithTableContent.push(currentPageNumber);
        yPos = topMargin;
        yPos = drawTableHeader(yPos);
        continue;
      }

      const rowStartY = yPos;
      let x = margin;

      // celle
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.3);

      doc.rect(x, rowStartY, colWidths.nr, rowHeight);
      x += colWidths.nr;
      doc.rect(x, rowStartY, colWidths.desc, rowHeight);
      x += colWidths.desc;
      doc.rect(x, rowStartY, colWidths.um, rowHeight);
      x += colWidths.um;
      doc.rect(x, rowStartY, colWidths.qty, rowHeight);
      x += colWidths.qty;
      doc.rect(x, rowStartY, colWidths.price, rowHeight);
      x += colWidths.price;
      doc.rect(x, rowStartY, colWidths.total, rowHeight);

      const descX = margin + colWidths.nr;
      const descYStart = rowStartY + cellPaddingTop;

      // Assicura font normale per il testo
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);

      if (startLineIndex === 0) {
        doc.text(nr, margin + colWidths.nr / 2, rowStartY + 5, { align: "center" });
      }

      chunkLines.forEach((line, i) => {
        doc.text(line, descX + 2, descYStart + i * lineHeight);
      });

      x = descX + colWidths.desc;
      const bottomTextY = rowStartY + rowHeight - 2;

      if (isLastChunk) {
        doc.text(um, x + colWidths.um / 2, bottomTextY, { align: "center" });
        x += colWidths.um;

        doc.text(qty, x + colWidths.qty - 2, bottomTextY, { align: "right" });
        x += colWidths.qty;

        doc.text(price, x + colWidths.price - 2, bottomTextY, { align: "right" });
        x += colWidths.price;

        doc.text(total, x + colWidths.total - 2, bottomTextY, { align: "right" });
      }

      yPos += rowHeight;
      startLineIndex += linesThisChunk;
    }
  });

  yPos += 5;

  const spaceNeededForTotals = 25;
  const spaceAvailableForTotals = pageHeight - bottomMargin - yPos;

  if (spaceAvailableForTotals < spaceNeededForTotals) {
    doc.addPage();
    currentPageNumber++;
    pagesWithTableContent.push(currentPageNumber);
    yPos = topMargin;
    yPos = drawTableHeader(yPos);
    yPos += 5;
  }

  pagesWithTotals.push(currentPageNumber);

  const summaryStartX = margin;
  const summaryHeight = 6;

  doc.setFont("helvetica", "bold");
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.3);
  doc.setTextColor(0, 0, 0);

  // Subtotale
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

  if (
    quoteData.showDiscountInTable &&
    quoteData.sconto_percentuale &&
    quoteData.sconto_percentuale > 0
  ) {
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

  // Totale
  doc.rect(
    summaryStartX,
    yPos,
    colWidths.nr +
      colWidths.desc +
      colWidths.um +
      colWidths.qty +
      colWidths.price,
    summaryHeight
  );
  doc.rect(
    summaryStartX +
      colWidths.nr +
      colWidths.desc +
      colWidths.um +
      colWidths.qty +
      colWidths.price,
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
    totalBottomContentHeight += 25;
  }

  const needsNewPageForBottom =
    pageHeight - bottomMargin - yPos < totalBottomContentHeight + minSpaceBeforeBreak;

  if (needsNewPageForBottom) {
    doc.addPage();
    currentPageNumber++;
    const hasTableContent = false;
    if (!hasTableContent) {
      const boxHeight = 8;
      yPos = topMargin + boxHeight + 12;
    } else {
      yPos = topMargin;
    }
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

  if (!signaturePrinted) {
    yPos += 5;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("Firma per Accettazione", pageWidth - margin, yPos, { align: "right" });
    yPos += 15;
    doc.setFont("helvetica", "normal");
    doc.line(pageWidth - margin - 60, yPos, pageWidth - margin, yPos);
    signaturePrinted = true;
  }

  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);

    const hasTableContent =
      pagesWithTableContent.includes(i) || pagesWithTotals.includes(i);
    const shouldShowBox = i > 1 && !hasTableContent;

    if (shouldShowBox) {
      const boxHeight = 8;
      const boxY = topMargin;

      doc.setFillColor(245, 245, 250);
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.3);
      doc.rect(margin, boxY, pageWidth - 2 * margin, boxHeight, "FD");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(7);
      doc.setTextColor(0, 0, 0);

      const identifierText = `PREVENTIVO N. ${quoteReference} | TOTALE: € ${formatCurrency(
        quoteData.totale
      )}`;
      doc.text(identifierText, pageWidth / 2, boxY + 5, { align: "center" });

      doc.setTextColor(0, 0, 0);
    }

    addFooter(i, totalPages, i !== 1);
  }

  return doc;
};
