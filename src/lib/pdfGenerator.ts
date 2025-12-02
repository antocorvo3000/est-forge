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
  const footerHeight = 30;
  const topMargin = margin;
  const bottomMargin = margin + footerHeight;

  // Lo spazio disponibile è: altezza pagina - margini top e bottom
  // Questo assicura che il contenuto non sovrapponga il footer
  const getAvailableHeight = () => {
    return pageHeight - topMargin - bottomMargin;
  };

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

  const addFooter = (currentPage: number, totalPages: number, showCompanyData: boolean = true) => {
    const footerStartY = pageHeight - footerHeight + 5;

    if (!showCompanyData) {
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text(`Pagina ${currentPage} di ${totalPages}`, pageWidth - margin, pageHeight - 10, {
        align: "right",
      });
      return;
    }

    if (settings.logoPath) {
      try {
        const img = new Image();
        img.src = settings.logoPath;

        // Calcola dimensioni proporzionali per il logo footer
        const maxFooterWidth = 15;
        const maxFooterHeight = 8;
        const imgAspectRatio = img.width / img.height;

        let footerLogoWidth = maxFooterWidth;
        let footerLogoHeight = maxFooterWidth / imgAspectRatio;

        // Se l'altezza supera il massimo, ricalcola partendo dall'altezza
        if (footerLogoHeight > maxFooterHeight) {
          footerLogoHeight = maxFooterHeight;
          footerLogoWidth = maxFooterHeight * imgAspectRatio;
        }

        doc.addImage(
          settings.logoPath,
          "PNG",
          margin,
          footerStartY - 2,
          footerLogoWidth,
          footerLogoHeight
        );
      } catch (error) {
        console.warn("Logo footer non caricato:", error);
      }
    }

    doc.setFontSize(7);
    doc.setTextColor(80, 80, 80);
    const centerX = pageWidth / 2;
    let footerTextY = footerStartY;

    doc.setFont("helvetica", "bold");
    doc.text(settings.name, centerX, footerTextY, { align: "center" });
    footerTextY += 3;

    doc.setFont("helvetica", "normal");
    doc.text(`P.IVA ${settings.vatNumber} - ${settings.address}`, centerX, footerTextY, {
      align: "center",
    });
    footerTextY += 3;
    doc.text(`Tel. ${settings.phone} - Email: ${settings.email}`, centerX, footerTextY, {
      align: "center",
    });

    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text(`Pagina ${currentPage} di ${totalPages}`, pageWidth - margin, pageHeight - 10, {
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

      // Calcola dimensioni proporzionali per il logo header
      const maxHeaderWidth = 40;
      const maxHeaderHeight = 20;
      const imgAspectRatio = img.width / img.height;

      let headerLogoWidth = maxHeaderWidth;
      let headerLogoHeight = maxHeaderWidth / imgAspectRatio;

      // Se l'altezza supera il massimo, ricalcola partendo dall'altezza
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
  doc.text(`Preventivo N. ${quoteData.numero.toString().padStart(2, "0")}-${quoteData.anno}`, margin, yPos);
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

  // Funzione per disegnare header tabella
  const drawTableHeader = (y: number, showCarriedForward: boolean = false, carriedAmount: number = 0) => {
    // Se c'è un riporto, mostralo prima dell'header
    if (showCarriedForward && carriedAmount > 0) {
      const carriedHeight = 6;
      doc.setFillColor(240, 240, 255);
      doc.setDrawColor(0, 0, 255);
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

      doc.setFont("helvetica", "italic");
      doc.setFontSize(8);
      doc.setTextColor(0, 0, 255);
      doc.text("← Riporto da pagina precedente:", margin + 2, y + carriedHeight - 1.5);
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

  // Funzione per disegnare subtotale parziale (riporto pagina)
  const drawPartialSubtotal = (y: number, amount: number) => {
    const summaryHeight = 6;
    const summaryStartX = margin;

    doc.setFillColor(255, 255, 240);
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.3);

    doc.rect(
      summaryStartX,
      y,
      colWidths.nr + colWidths.desc + colWidths.um + colWidths.qty + colWidths.price,
      summaryHeight,
      "FD"
    );
    doc.rect(
      summaryStartX + colWidths.nr + colWidths.desc + colWidths.um + colWidths.qty + colWidths.price,
      y,
      colWidths.total,
      summaryHeight,
      "FD"
    );

    doc.setFont("helvetica", "italic");
    doc.setFontSize(8);
    doc.setTextColor(0, 0, 0);
    doc.text("Riporto a pagina successiva →", pageWidth - margin - colWidths.total - 2, y + summaryHeight - 1.5, {
      align: "right",
    });
    doc.text(`€ ${formatCurrency(amount)}`, pageWidth - margin - 2, y + summaryHeight - 1.5, {
      align: "right",
    });

    return y + summaryHeight;
  };

  // Tracciamento per i subtotali progressivi
  let cumulativeSubtotal = 0;
  let itemsProcessed = 0;
  const firstPageTableStart = yPos;
  let isFirstPage = true;
  let carriedForwardAmount = 0;

  yPos = drawTableHeader(yPos, false, 0);

  // Disegna righe con logica di split e subtotali progressivi
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

    let lineIndex = 0;
    let isFirstChunk = true;
    let itemAddedToCumulative = false;

    while (lineIndex < descLines.length) {
      // Calcola lo spazio disponibile fino al footer
      const spaceLeft = pageHeight - bottomMargin - yPos;
      const maxLinesInChunk = Math.floor((spaceLeft - 4) / lineHeight);

      // Verifica se serve nuova pagina
      if (maxLinesInChunk < 2 && lineIndex < descLines.length) {
        // Mostra subtotale parziale prima di cambiare pagina
        if (!isFirstPage || yPos > firstPageTableStart + 20) {
          yPos = drawPartialSubtotal(yPos, cumulativeSubtotal);
          carriedForwardAmount = cumulativeSubtotal;
        }

        doc.addPage();
        yPos = topMargin;
        isFirstPage = false;
        yPos = drawTableHeader(yPos, true, carriedForwardAmount);
        continue;
      }

      const remainingLines = descLines.length - lineIndex;
      const linesToDraw = Math.min(maxLinesInChunk, remainingLines);
      const chunkHeight = Math.max(linesToDraw * lineHeight + 4, minChunkHeight);
      const isLastChunk = lineIndex + linesToDraw >= descLines.length;

      const rowStartY = yPos;
      let x = margin;

      // Disegna bordi
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.3);
      doc.rect(x, rowStartY, colWidths.nr, chunkHeight);
      x += colWidths.nr;
      doc.rect(x, rowStartY, colWidths.desc, chunkHeight);
      x += colWidths.desc;
      doc.rect(x, rowStartY, colWidths.um, chunkHeight);
      x += colWidths.um;
      doc.rect(x, rowStartY, colWidths.qty, chunkHeight);
      x += colWidths.qty;
      doc.rect(x, rowStartY, colWidths.price, chunkHeight);
      x += colWidths.price;
      doc.rect(x, rowStartY, colWidths.total, chunkHeight);

      // Contenuto
      x = margin;

      // Nr - solo primo chunk
      if (isFirstChunk) {
        doc.setFont("helvetica", "normal");
        doc.text(nr, x + colWidths.nr / 2, rowStartY + 5, { align: "center" });
      }
      x += colWidths.nr;

      // Descrizione
      doc.setFont("helvetica", "normal");
      for (let i = 0; i < linesToDraw; i++) {
        doc.text(descLines[lineIndex + i], x + 2, rowStartY + 5 + i * lineHeight);
      }
      x += colWidths.desc;

      // Valori - solo ultimo chunk
      if (isLastChunk) {
        doc.setFont("helvetica", "normal");
        const bottomTextY = rowStartY + chunkHeight - 2;

        doc.text(um, x + colWidths.um / 2, bottomTextY, { align: "center" });
        x += colWidths.um;

        doc.text(qty, x + colWidths.qty - 2, bottomTextY, { align: "right" });
        x += colWidths.qty;

        doc.text(price, x + colWidths.price - 2, bottomTextY, { align: "right" });
        x += colWidths.price;

        doc.text(total, x + colWidths.total - 2, bottomTextY, { align: "right" });

        // Aggiungi al subtotale cumulativo solo quando l'item è completato
        if (!itemAddedToCumulative) {
          cumulativeSubtotal += riga.totale;
          itemsProcessed++;
          itemAddedToCumulative = true;
        }
      }

      yPos += chunkHeight;
      lineIndex += linesToDraw;
      isFirstChunk = false;
    }
  });

  // Dopo aver disegnato tutte le righe, verifica spazio per i totali
  yPos += 5;

  // Verifica se c'è spazio per i totali nella pagina corrente
  // Spazio necessario: subtotale + sconto (se presente) + totale + spazio = circa 20mm
  const spaceNeededForTotals = 25;
  const spaceAvailableForTotals = pageHeight - bottomMargin - yPos;

  if (spaceAvailableForTotals < spaceNeededForTotals) {
    // Mostra subtotale parziale prima di cambiare pagina
    yPos = drawPartialSubtotal(yPos, cumulativeSubtotal);
    carriedForwardAmount = cumulativeSubtotal;

    doc.addPage();
    yPos = topMargin;
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

  // Sconto
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

  // Note
  if (quoteData.note) {
    // Verifica spazio disponibile per le note
    const noteHeaderHeight = 10;
    const spaceAvailableForNotes = pageHeight - bottomMargin - yPos - noteHeaderHeight;

    if (spaceAvailableForNotes < 10) {
      // Se non c'è spazio, aggiungi una nuova pagina
      doc.addPage();
      yPos = topMargin;
    }

    yPos += 10;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("Note:", margin, yPos);
    yPos += 5;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    const noteLines = doc.splitTextToSize(quoteData.note, pageWidth - 2 * margin);
    
    // Calcola spazio necessario per le note
    const noteHeight = noteLines.length * 4;
    const spaceNeededForNotes = noteHeight + 5;
    const spaceAvailableForNotesContent = pageHeight - bottomMargin - yPos;

    if (spaceAvailableForNotesContent < spaceNeededForNotes) {
      // Se le note non entrano, aggiungi una nuova pagina
      doc.addPage();
      yPos = topMargin;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text("Note:", margin, yPos);
      yPos += 5;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
    }

    doc.text(noteLines, margin, yPos);
    yPos += noteLines.length * 4 + 5;
  }

  // Modalità pagamento
  if (quoteData.modalita_pagamento) {
    // Verifica spazio disponibile per la modalità di pagamento
    const paymentHeaderHeight = 10;
    const spaceAvailableForPayment = pageHeight - bottomMargin - yPos - paymentHeaderHeight;

    if (spaceAvailableForPayment < 10) {
      // Se non c'è spazio, aggiungi una nuova pagina
      doc.addPage();
      yPos = topMargin;
    }

    yPos += 5;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("Modalità di pagamento:", margin, yPos);
    yPos += 5;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    const paymentLines = doc.splitTextToSize(quoteData.modalita_pagamento, pageWidth - 2 * margin);
    
    // Calcola spazio necessario per la modalità di pagamento
    const paymentHeight = paymentLines.length * 4;
    const spaceNeededForPayment = paymentHeight + 10;
    const spaceAvailableForPaymentContent = pageHeight - bottomMargin - yPos;

    if (spaceAvailableForPaymentContent < spaceNeededForPayment) {
      // Se la modalità di pagamento non entra, aggiungi una nuova pagina
      doc.addPage();
      yPos = topMargin;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text("Modalità di pagamento:", margin, yPos);
      yPos += 5;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
    }

    doc.text(paymentLines, margin, yPos);
    yPos += paymentLines.length * 4 + 10;
  }

  // Firma
  // Verifica spazio disponibile per la firma
  const spaceNeededForSignature = 20;
  const spaceAvailableForSignature = pageHeight - bottomMargin - yPos;

  if (spaceAvailableForSignature < spaceNeededForSignature) {
    // Se non c'è spazio, aggiungi una nuova pagina
    doc.addPage();
    yPos = topMargin;
  }

  yPos += 5;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("Firma per Accettazione", pageWidth - margin, yPos, { align: "right" });
  yPos += 15;
  doc.setFont("helvetica", "normal");
  doc.line(pageWidth - margin - 60, yPos, pageWidth - margin, yPos);

  // Footer
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    addFooter(i, totalPages, i !== 1);
  }

  return doc;
};
