(function (global) {
  const CM_TO_CSS_PX = 96 / 2.54;
  const CSS_TO_PT = 0.75;
  const PAGE_WIDTH = 841.91998;
  const PAGE_HEIGHT = 594.95996;
  const LABELS_PER_PAGE = 15;
  const COLUMN_LEFTS = [0, 293, 601];
  const COLUMN_WIDTHS = [293, 308, 300];
  const ROW_TOPS = [3.7795276, 170.5590432, 325, 488, 650];
  const FIRST_COLUMN_RIGHT_PADDING = 0.83 * CM_TO_CSS_PX;
  const DEFAULT_RIGHT_PADDING = 0.03 * CM_TO_CSS_PX;
  const PRODUCT_FONT_CSS = 16;
  const PRICE_FONT_CSS = 32;
  const PRODUCT_FONT_PT = 12;
  const PRICE_FONT_PT = 24;
  let canvasContext = null;

  function encodePdfText(value) {
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

  function getCanvasContext() {
    if (canvasContext || typeof document === "undefined") return canvasContext;
    const canvas = document.createElement("canvas");
    canvasContext = canvas.getContext("2d");
    return canvasContext;
  }

  function measureTextWidth(value, fontSizeCss) {
    const text = String(value || "");
    const context = getCanvasContext();
    if (context) {
      context.font = `italic 700 ${fontSizeCss}px Calibri, Arial, sans-serif`;
      return context.measureText(text).width;
    }

    let width = 0;
    for (const char of text) {
      if (char === " ") width += 0.32;
      else if ("ijlI.,'".includes(char)) width += 0.28;
      else if ("MW@#%".includes(char)) width += 0.88;
      else if (/[A-Z0-9$]/.test(char)) width += 0.66;
      else width += 0.55;
    }
    return width * fontSizeCss;
  }

  function wrapText(value, fontSizeCss, maxWidth, maxChars) {
    const words = String(value || "").trim().split(/\s+/).filter(Boolean);
    const lines = [];
    let line = "";

    for (const word of words) {
      const candidate = line ? `${line} ${word}` : word;
      if (line && (measureTextWidth(candidate, fontSizeCss) > maxWidth || (maxChars && candidate.length > maxChars))) {
        lines.push(line);
        line = word;
      } else {
        line = candidate;
      }
    }

    if (line) lines.push(line);
    return lines.slice(0, 2);
  }

  function cssX(value) {
    return value * CSS_TO_PT;
  }

  function cssY(value) {
    return PAGE_HEIGHT - value * CSS_TO_PT;
  }

  function drawRightAlignedText(text, rightCssX, baselineCssY, fontSizeCss) {
    const x = cssX(rightCssX - measureTextWidth(text, fontSizeCss));
    const y = cssY(baselineCssY);
    const fontSizePt = fontSizeCss === PRICE_FONT_CSS ? PRICE_FONT_PT : PRODUCT_FONT_PT;
    return `BT /F1 ${fontSizePt} Tf 0 0 0 rg 1 0 0 1 ${x.toFixed(2)} ${y.toFixed(2)} Tm (${encodePdfText(text)}) Tj ET\n`;
  }

  function drawLabel(product, slotIndex) {
    if (!product || (!product.name && !product.weight && !product.price)) return "";

    const row = Math.floor(slotIndex / 3);
    const column = slotIndex % 3;
    const leftX = COLUMN_LEFTS[column];
    const rightPadding = column === 0 ? FIRST_COLUMN_RIGHT_PADDING : DEFAULT_RIGHT_PADDING;
    const rightX = leftX + COLUMN_WIDTHS[column] - rightPadding;
    const maxTextWidth = COLUMN_WIDTHS[column] - rightPadding - DEFAULT_RIGHT_PADDING;
    const rowTop = ROW_TOPS[row];
    const nameLines = wrapText(product.name || "", PRODUCT_FONT_CSS, maxTextWidth, column === 0 ? 23 : null);
    const weight = String(product.weight || "").trim();
    const price = product.price ? formatCurrency(product.price) : "";
    let content = "";

    const firstTextOffset = nameLines.length > 1 ? 52 : 60;
    for (let index = 0; index < nameLines.length; index += 1) {
      content += drawRightAlignedText(nameLines[index], rightX, rowTop + firstTextOffset + index * 17, PRODUCT_FONT_CSS);
    }

    if (weight) {
      content += drawRightAlignedText(weight, rightX, rowTop + firstTextOffset + nameLines.length * 17, PRODUCT_FONT_CSS);
    }

    if (price) {
      content += drawRightAlignedText(price, rightX, rowTop + 125.118, PRICE_FONT_CSS);
    }

    return content;
  }

  function createPdfBytes(products) {
    const items = Array.isArray(products) ? products : [];
    const pageCount = Math.max(1, Math.ceil(items.length / LABELS_PER_PAGE));
    const objects = [];

    function addObject(content) {
      objects.push(content);
      return objects.length;
    }

    const catalogId = addObject("");
    const pagesId = addObject("");
    const fontId = addObject("<< /Type /Font /Subtype /Type1 /BaseFont /Calibri-BoldItalic /Encoding /WinAnsiEncoding >>");
    const pageIds = [];

    for (let pageIndex = 0; pageIndex < pageCount; pageIndex += 1) {
      const pageItems = items.slice(pageIndex * LABELS_PER_PAGE, (pageIndex + 1) * LABELS_PER_PAGE);
      let stream = "";
      for (let slotIndex = 0; slotIndex < LABELS_PER_PAGE; slotIndex += 1) {
        stream += drawLabel(pageItems[slotIndex], slotIndex);
      }

      const streamId = addObject(`<< /Length ${stream.length} >>\nstream\n${stream}endstream`);
      const pageId = addObject(
        `<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 ${PAGE_WIDTH.toFixed(2)} ${PAGE_HEIGHT.toFixed(
          2,
        )}] /CropBox [0 0 ${PAGE_WIDTH.toFixed(2)} ${PAGE_HEIGHT.toFixed(
          2,
        )}] /Rotate 0 /Resources << /Font << /F1 ${fontId} 0 R >> >> /Contents ${streamId} 0 R >>`,
      );
      pageIds.push(pageId);
    }

    objects[catalogId - 1] = `<< /Type /Catalog /Pages ${pagesId} 0 R /PageLayout /SinglePage /ViewerPreferences << /PrintScaling /None /PickTrayByPDFSize true >> >>`;
    objects[pagesId - 1] = `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pageIds.length} >>`;

    let pdf = "%PDF-1.4\n%\xE2\xE3\xCF\xD3\n";
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

  function baixarPdfEtiquetas(products) {
    const bytes = createPdfBytes(products);
    const blob = new Blob([bytes], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "etiquetas-kopenhagen-tacaruna.pdf";
    document.body.appendChild(link);
    link.click();
    link.remove();

    return { url, fileName: link.download };
  }

  global.baixarPdfEtiquetas = baixarPdfEtiquetas;
  global.criarPdfEtiquetasBytes = createPdfBytes;

  if (typeof module !== "undefined" && module.exports) {
    module.exports = { createPdfBytes };
  }
})(typeof window !== "undefined" ? window : globalThis);
