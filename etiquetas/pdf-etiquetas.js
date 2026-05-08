(function (global) {
  const CM_TO_PT = 28.3464566929;
  const PAGE_WIDTH = 29.7 * CM_TO_PT;
  const PAGE_HEIGHT = 21 * CM_TO_PT;
  const LABELS_PER_PAGE = 15;
  const TOP_MARGIN = 0.32 * CM_TO_PT;
  const COLUMN_WIDTHS = [7.752, 8.149, 7.938].map((value) => value * CM_TO_PT);
  const ROW_HEIGHT = 4.3 * CM_TO_PT;
  const ROW_OFFSETS = [0.1, 0.2, 0, 0, 0].map((value) => value * CM_TO_PT);
  const PRICE_OFFSET = 0.3 * CM_TO_PT;
  const SIDE_PADDING = 0.03 * CM_TO_PT;
  const FIRST_COLUMN_RIGHT_PADDING = 0.83 * CM_TO_PT;

  function escapePdfText(value) {
    return String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^\x20-\x7e]/g, "")
      .replace(/\\/g, "\\\\")
      .replace(/\(/g, "\\(")
      .replace(/\)/g, "\\)");
  }

  function normalizePrice(value) {
    const raw = String(value || "")
      .replace(/[^\d,.-]/g, "")
      .replace(/\./g, "")
      .replace(",", ".");
    const number = Number(raw);
    if (!Number.isFinite(number)) return "0,00";
    return number.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function formatCurrency(value) {
    return `R$ ${normalizePrice(value)}`;
  }

  function textWidth(text, fontSize) {
    const source = String(text || "");
    let units = 0;
    for (const char of source) {
      if (char === " ") units += 0.32;
      else if ("ilI.,'".includes(char)) units += 0.28;
      else if ("MW@#".includes(char)) units += 0.9;
      else if (/[A-Z0-9$]/.test(char)) units += 0.66;
      else units += 0.56;
    }
    return units * fontSize;
  }

  function wrapText(text, fontSize, maxWidth, maxChars) {
    const words = String(text || "").trim().split(/\s+/).filter(Boolean);
    const lines = [];
    let current = "";

    for (const word of words) {
      const candidate = current ? `${current} ${word}` : word;
      const overChars = maxChars && candidate.length > maxChars;
      if (current && (textWidth(candidate, fontSize) > maxWidth || overChars)) {
        lines.push(current);
        current = word;
      } else {
        current = candidate;
      }
    }

    if (current) lines.push(current);
    return lines.slice(0, 2);
  }

  function drawRightText(text, xRight, y, fontSize) {
    const safeText = escapePdfText(text);
    const x = xRight - textWidth(text, fontSize);
    return `BT /F1 ${fontSize} Tf 0 0 0 rg 1 0 0 1 ${x.toFixed(2)} ${y.toFixed(2)} Tm (${safeText}) Tj ET\n`;
  }

  function drawLabel(product, index) {
    if (!product || (!product.name && !product.weight && !product.price)) return "";

    const row = Math.floor(index / 3);
    const column = index % 3;
    const xLeft = COLUMN_WIDTHS.slice(0, column).reduce((sum, width) => sum + width, 0);
    const xRight = xLeft + COLUMN_WIDTHS[column] - (column === 0 ? FIRST_COLUMN_RIGHT_PADDING : SIDE_PADDING);
    const centerFromTop = TOP_MARGIN + row * ROW_HEIGHT + ROW_HEIGHT / 2 + ROW_OFFSETS[row];
    const centerY = PAGE_HEIGHT - centerFromTop;
    const maxTextWidth = COLUMN_WIDTHS[column] - (column === 0 ? FIRST_COLUMN_RIGHT_PADDING : SIDE_PADDING * 2);
    const nameLines = wrapText(product.name || "", 12, maxTextWidth, column === 0 ? 23 : null);
    const weight = String(product.weight || "").trim();
    const price = product.price ? formatCurrency(product.price) : "";
    const normalLineHeight = 12.6;
    const priceFontSize = 24;
    const priceGap = 5;
    const textBlockHeight =
      nameLines.length * normalLineHeight + (weight ? normalLineHeight : 0) + (price ? priceGap + priceFontSize : 0);
    let y = centerY + textBlockHeight / 2 - 10;
    let content = "";

    for (const line of nameLines) {
      content += drawRightText(line, xRight, y, 12);
      y -= normalLineHeight;
    }

    if (weight) {
      content += drawRightText(weight, xRight, y, 12);
      y -= normalLineHeight;
    }

    if (price) {
      content += drawRightText(price, xRight, y - priceGap - PRICE_OFFSET, priceFontSize);
    }

    return content;
  }

  function buildPdfBytes(products) {
    const cleanProducts = Array.isArray(products) ? products : [];
    const pageCount = Math.max(1, Math.ceil(cleanProducts.length / LABELS_PER_PAGE));
    const objects = [];

    function addObject(content) {
      objects.push(content);
      return objects.length;
    }

    const catalogId = addObject("<< /Type /Catalog /Pages 2 0 R >>");
    const pagesId = addObject("");
    const fontId = addObject("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-BoldOblique /Encoding /WinAnsiEncoding >>");
    const pageIds = [];

    for (let page = 0; page < pageCount; page += 1) {
      const pageProducts = cleanProducts.slice(page * LABELS_PER_PAGE, (page + 1) * LABELS_PER_PAGE);
      let stream = "";
      for (let index = 0; index < LABELS_PER_PAGE; index += 1) {
        stream += drawLabel(pageProducts[index], index);
      }

      const contentId = addObject(`<< /Length ${stream.length} >>\nstream\n${stream}endstream`);
      const pageId = addObject(
        `<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 ${PAGE_WIDTH.toFixed(2)} ${PAGE_HEIGHT.toFixed(
          2,
        )}] /Resources << /Font << /F1 ${fontId} 0 R >> >> /Contents ${contentId} 0 R >>`,
      );
      pageIds.push(pageId);
    }

    objects[pagesId - 1] = `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pageIds.length} >>`;
    objects[catalogId - 1] = `<< /Type /Catalog /Pages ${pagesId} 0 R >>`;

    let pdf = "%PDF-1.4\n";
    const offsets = [0];
    objects.forEach((content, index) => {
      offsets.push(pdf.length);
      pdf += `${index + 1} 0 obj\n${content}\nendobj\n`;
    });

    const xrefOffset = pdf.length;
    pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
    for (let index = 1; index < offsets.length; index += 1) {
      pdf += `${String(offsets[index]).padStart(10, "0")} 00000 n \n`;
    }
    pdf += `trailer\n<< /Size ${objects.length + 1} /Root ${catalogId} 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

    const bytes = new Uint8Array(pdf.length);
    for (let index = 0; index < pdf.length; index += 1) {
      bytes[index] = pdf.charCodeAt(index) & 0xff;
    }
    return bytes;
  }

  function downloadEtiquetasPdf(products) {
    const bytes = buildPdfBytes(products);
    const blob = new Blob([bytes], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "etiquetas-kopenhagen-tacaruna.pdf";
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  global.buildEtiquetasPdfBytes = buildPdfBytes;
  global.downloadEtiquetasPdf = downloadEtiquetasPdf;
})(typeof window !== "undefined" ? window : globalThis);
