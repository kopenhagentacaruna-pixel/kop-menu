const STORAGE_KEY = "kop-price-labels-v1";
const LABELS_PER_PAGE = 15;

const initialProducts = [];

let products = normalizeProducts(loadProducts());

const rowsEl = document.querySelector("#productRows");
const printAreaEl = document.querySelector("#printArea");
const reportInput = document.querySelector("#reportInput");
const reportStatus = document.querySelector("#reportStatus");
const imageResults = document.querySelector("#imageResults");
document.body.classList.add("edit-mode");

function loadProducts() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    return initialProducts;
  } catch {
    return initialProducts;
  }
}

function normalizeProducts(items, minimumRows = LABELS_PER_PAGE) {
  const cleanItems = (Array.isArray(items) ? items : []).map((item) => ({
    name: item.name || "",
    weight: item.weight || "",
    price: item.price || "",
  }));

  while (cleanItems.length < minimumRows) {
    cleanItems.push({ name: "", weight: "", price: "" });
  }

  return cleanItems;
}

function saveProducts() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
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

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function productToLabel(product) {
  if (!product.name && !product.weight && !product.price) {
    return '<article class="label empty-label"></article>';
  }

  return `
    <article class="label">
      <div class="product-name">${escapeHtml(product.name)}</div>
      <div class="product-weight">${escapeHtml(product.weight)}</div>
      <div class="product-price">${escapeHtml(formatCurrency(product.price))}</div>
    </article>
  `;
}

function getExpandedLabels() {
  return products;
}

function activeProducts() {
  return products.filter((product) => product.name || product.weight || product.price);
}

function renderRows() {
  rowsEl.innerHTML = products
    .map(
      (product, index) => `
        <tr>
          <td><input value="${escapeHtml(product.name)}" data-field="name" data-index="${index}" aria-label="Produto" /></td>
          <td><input value="${escapeHtml(product.weight)}" data-field="weight" data-index="${index}" aria-label="Peso" /></td>
          <td><input value="${escapeHtml(product.price)}" data-field="price" data-index="${index}" aria-label="Preço" /></td>
          <td>
            <div class="row-actions">
              <button class="row-button" type="button" data-duplicate="${index}" aria-label="Duplicar lançamento">+</button>
              <button class="row-button" type="button" data-remove="${index}" aria-label="Excluir lançamento">×</button>
            </div>
          </td>
        </tr>
      `,
    )
    .join("");
}

function renderPreview() {
  const labels = getExpandedLabels();

  const pageTotal = Math.max(1, Math.ceil(labels.length / LABELS_PER_PAGE));
  const sheets = [];

  for (let page = 0; page < pageTotal; page += 1) {
    const pageLabels = labels.slice(page * LABELS_PER_PAGE, (page + 1) * LABELS_PER_PAGE);
    const emptySlots = LABELS_PER_PAGE - pageLabels.length;
    const realLabels = [
      ...pageLabels.map(productToLabel),
      ...Array.from({ length: emptySlots }, () => '<article class="label empty-label"></article>'),
    ];
    const labelsWithGhostColumn = [];

    for (let row = 0; row < 5; row += 1) {
      labelsWithGhostColumn.push(...realLabels.slice(row * 3, row * 3 + 3));
      labelsWithGhostColumn.push('<article class="ghost-label" aria-hidden="true"></article>');
    }

    sheets.push(`
      <section class="sheet" aria-label="Folha ${page + 1}">
        ${labelsWithGhostColumn.join("")}
      </section>
    `);
  }

  printAreaEl.innerHTML = sheets.join("");
}

function render() {
  saveProducts();
  renderRows();
  renderPreview();
}

rowsEl.addEventListener("input", (event) => {
  const input = event.target.closest("input[data-field]");
  if (!input) return;

  const index = Number(input.dataset.index);
  const field = input.dataset.field;
  products[index][field] = input.value;
  saveProducts();
  renderPreview();
});

rowsEl.addEventListener("change", (event) => {
  const input = event.target.closest("input[data-field='price']");
  if (!input) return;

  const index = Number(input.dataset.index);
  products[index].price = normalizePrice(input.value);
  render();
});

rowsEl.addEventListener("click", (event) => {
  const duplicateButton = event.target.closest("button[data-duplicate]");
  if (duplicateButton) {
    const index = Number(duplicateButton.dataset.duplicate);
    products.splice(index + 1, 0, { ...products[index] });
    products = normalizeProducts(products);
    render();
    return;
  }

  const removeButton = event.target.closest("button[data-remove]");
  if (!removeButton) return;

  products.splice(Number(removeButton.dataset.remove), 1);
  products = normalizeProducts(products);
  render();
});

function cm(value) {
  return (value * 300) / 2.54;
}

function pt(value) {
  return (value * 300) / 72;
}

function wrapText(context, text, maxWidth, maxLines) {
  const words = String(text || "").split(/\s+/).filter(Boolean);
  const lines = [];
  let line = "";

  for (const word of words) {
    const attempt = line ? `${line} ${word}` : word;
    if (context.measureText(attempt).width <= maxWidth || !line) {
      line = attempt;
      continue;
    }

    lines.push(line);
    line = word;
    if (lines.length === maxLines) break;
  }

  if (line && lines.length < maxLines) lines.push(line);
  if (words.length && lines.length === maxLines) {
    while (context.measureText(`${lines[maxLines - 1]}...`).width > maxWidth && lines[maxLines - 1].length > 3) {
      lines[maxLines - 1] = lines[maxLines - 1].slice(0, -1).trim();
    }
    if (lines[maxLines - 1] && words.join(" ").length > lines.join(" ").length) {
      lines[maxLines - 1] = `${lines[maxLines - 1]}...`;
    }
  }

  return lines;
}

function drawLabel(context, product, labelIndex, x, y, width, height) {
  if (!product.name && !product.weight && !product.price) return;

  const childIndex = labelIndex + Math.floor(labelIndex / 3) + 1;
  const isFirstColumn = childIndex % 4 === 1;
  const row = Math.floor(labelIndex / 3);
  const rowAdjustments = [-0.5, -0.5, -0.5, -1, -1.5];
  const rowShift = cm(rowAdjustments[row] || 0);
  const rightPadding = isFirstColumn ? cm(0.83) : cm(0.03);
  const leftPadding = cm(0.03);
  const maxWidth = width - leftPadding - rightPadding;
  const right = x + width - rightPadding;

  context.save();
  context.fillStyle = "#000";
  context.textAlign = "right";
  context.textBaseline = "top";

  const nameSize = pt(10);
  context.font = `italic 700 ${nameSize}px Calibri, Arial, sans-serif`;
  const nameLines = wrapText(context, product.name, isFirstColumn ? Math.min(maxWidth, cm(5.4)) : maxWidth, 3);
  const nameLineHeight = nameSize * 1.05;

  const weightSize = pt(10);
  const priceSize = pt(24);
  const weightLineHeight = product.weight ? weightSize * 1.05 : 0;
  const priceLineHeight = priceSize;
  const priceGap = cm(0.06);
  const priceShift = cm(0.3);
  const blockHeight = nameLines.length * nameLineHeight + weightLineHeight + priceGap + priceLineHeight;
  let cursorY = y + rowShift + height / 2 - blockHeight / 2;

  context.font = `italic 700 ${nameSize}px Calibri, Arial, sans-serif`;
  for (const line of nameLines) {
    context.fillText(line, right, cursorY);
    cursorY += nameLineHeight;
  }

  if (product.weight) {
    context.font = `italic 700 ${weightSize}px Calibri, Arial, sans-serif`;
    context.fillText(product.weight, right, cursorY);
    cursorY += weightLineHeight;
  }

  context.font = `italic 700 ${priceSize}px Calibri, Arial, sans-serif`;
  context.fillText(formatCurrency(product.price), right, cursorY + priceGap + priceShift);
  context.restore();
}

function renderLabelPageImage(pageProducts) {
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(cm(29.7));
  canvas.height = Math.round(cm(21));
  const context = canvas.getContext("2d");
  const columns = [cm(7.752), cm(8.149), cm(7.938)];
  const rowHeight = cm(4.3);

  context.fillStyle = "#fff";
  context.fillRect(0, 0, canvas.width, canvas.height);

  for (let index = 0; index < LABELS_PER_PAGE; index += 1) {
    const row = Math.floor(index / 3);
    const col = index % 3;
    const x = columns.slice(0, col).reduce((sum, value) => sum + value, 0);
    const y = row * rowHeight;
    drawLabel(context, pageProducts[index] || {}, index, x, y, columns[col], rowHeight);
  }

  return canvas.toDataURL("image/jpeg", 1);
}

function generateLabelImages() {
  const labels = activeProducts();
  if (!labels.length) return [];

  const pageTotal = Math.ceil(labels.length / LABELS_PER_PAGE);
  const imageUrls = [];
  for (let page = 0; page < pageTotal; page += 1) {
    imageUrls.push(renderLabelPageImage(labels.slice(page * LABELS_PER_PAGE, (page + 1) * LABELS_PER_PAGE)));
  }
  return imageUrls;
}

function renderImageLinks(imageUrls) {
  imageResults.classList.toggle("has-images", imageUrls.length > 0);
  imageResults.innerHTML = `
    <div class="image-toolbar">
      <button type="button" data-edit-labels>Edição de Etiquetas</button>
      <button type="button" data-download-pdf>Baixar Tudo em PDF</button>
    </div>
    ${imageUrls
      .map(
        (url, index) =>
          `<div class="image-card">
          <strong>Folha ${index + 1}</strong>
          <a href="${url}" download="etiquetas-folha-${String(index + 1).padStart(2, "0")}.jpg" target="_blank" rel="noopener">Baixar</a>
          <button type="button" data-print-image="${index}">Imprimir</button>
        </div>`,
      )
      .join("")}`;
  imageResults.currentImageUrls = imageUrls;
}

function showEditMode() {
  document.body.classList.add("edit-mode");
  document.body.classList.remove("labels-mode");
  imageResults.classList.remove("has-images");
  imageResults.innerHTML = "";
  imageResults.currentImageUrls = [];
}

function showLabelsMode() {
  document.body.classList.add("labels-mode");
  document.body.classList.remove("edit-mode");
}

function dataUrlToBytes(dataUrl) {
  const base64 = dataUrl.split(",")[1] || "";
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

function asciiBytes(value) {
  const bytes = new Uint8Array(value.length);
  for (let index = 0; index < value.length; index += 1) {
    bytes[index] = value.charCodeAt(index) & 0xff;
  }
  return bytes;
}

function joinBytes(parts) {
  const length = parts.reduce((sum, part) => sum + part.length, 0);
  const output = new Uint8Array(length);
  let offset = 0;
  for (const part of parts) {
    output.set(part, offset);
    offset += part.length;
  }
  return output;
}

function makePdfFromImages(imageUrls) {
  if (!window.jspdf || !window.jspdf.jsPDF) {
    throw new Error("O gerador de PDF não foi carregado. Atualize a página e tente novamente.");
  }

  const pdf = new window.jspdf.jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a4",
    compress: true,
  });

  imageUrls.forEach((imageUrl, index) => {
    if (index > 0) pdf.addPage("a4", "landscape");
    pdf.addImage(imageUrl, "JPEG", 0, 0, 297, 210, `folha-${index + 1}`, "FAST");
  });

  return pdf.output("blob");
}

function downloadBlob(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function openImagesForPrint(imageUrls, shouldPrint = false) {
  const win = window.open("", "_blank");
  if (!win) return false;

  win.document.write(`<!doctype html>
    <html lang="pt-BR">
      <head>
        <meta charset="UTF-8" />
        <title>Imprimir Etiquetas</title>
        <style>
          @page { size: 297mm 210mm; margin: 0; }
          html, body { margin: 0; background: white; }
          .screen-actions {
            position: sticky;
            top: 0;
            z-index: 10;
            display: flex;
            gap: 10px;
            align-items: center;
            padding: 12px;
            background: #fffaf2;
            border-bottom: 1px solid #dec9bd;
            font-family: Avenir, "Helvetica Neue", Arial, sans-serif;
          }
          .screen-actions button {
            border: 1px solid #8e1730;
            border-radius: 8px;
            padding: 9px 12px;
            background: #8e1730;
            color: #fff6e8;
            font: inherit;
            font-weight: 800;
            cursor: pointer;
          }
          .screen-actions span {
            color: #7a625c;
            font-size: 14px;
          }
          img { display: block; width: 297mm; height: 210mm; page-break-after: always; }
          img:last-child { page-break-after: auto; }
          @media print {
            .screen-actions { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="screen-actions">
          <button type="button" onclick="window.close()">Voltar para lista</button>
          <span>Se a janela não fechar, volte para a aba anterior do navegador.</span>
        </div>
        ${imageUrls.map((url) => `<img src="${url}" alt="Folha de etiquetas" />`).join("")}
        ${
          shouldPrint
            ? `<script>
                Promise.all(Array.from(document.images).map((image) => image.complete ? Promise.resolve() : new Promise((resolve) => {
                  image.onload = resolve;
                  image.onerror = resolve;
                }))).then(() => {
                  setTimeout(() => window.print(), 250);
                });
              <\/script>`
            : ""
        }
      </body>
    </html>`);
  win.document.close();
  return true;
}

document.querySelector("#imageButton").addEventListener("click", () => {
  const imageUrls = generateLabelImages();
  if (!imageUrls.length) {
    reportStatus.textContent = "Carregue o relatório ou preencha ao menos uma etiqueta antes de gerar as imagens.";
    return;
  }

  renderImageLinks(imageUrls);
  showLabelsMode();
  reportStatus.textContent = `${imageUrls.length} folha(s) gerada(s). Use os botões abaixo para baixar ou imprimir cada folha.`;
});

imageResults.addEventListener("click", (event) => {
  const editButton = event.target.closest("button[data-edit-labels]");
  if (editButton) {
    showEditMode();
    reportStatus.textContent = "Edição de etiquetas aberta.";
    rowsEl.closest(".table-wrap").scrollIntoView({ behavior: "smooth", block: "start" });
    return;
  }

  const pdfButton = event.target.closest("button[data-download-pdf]");
  if (pdfButton) {
    const imageUrls = imageResults.currentImageUrls || [];
    if (!imageUrls.length) return;
    try {
      downloadBlob(makePdfFromImages(imageUrls), "etiquetas-kopenhagen-tacaruna.pdf");
      reportStatus.textContent = `${imageUrls.length} folha(s) baixada(s) em PDF. Imprima em escala 100% ou tamanho real.`;
    } catch (error) {
      reportStatus.textContent = error.message || "Não foi possível gerar o PDF.";
    }
    return;
  }

  const button = event.target.closest("button[data-print-image]");
  if (!button) return;

  const imageUrls = imageResults.currentImageUrls || [];
  const imageUrl = imageUrls[Number(button.dataset.printImage)];
  if (!imageUrl) return;

  const opened = openImagesForPrint([imageUrl], true);
  reportStatus.textContent = opened
    ? `Folha ${Number(button.dataset.printImage) + 1} enviada para impressão. Use escala 100% ou tamanho real.`
    : "O navegador bloqueou a janela de impressão. Libere pop-ups ou use o botão Baixar.";
});

document.querySelector("#loadReportButton").addEventListener("click", () => {
  reportInput.click();
});

reportInput.addEventListener("change", async () => {
  const file = reportInput.files && reportInput.files[0];
  if (!file) return;

  reportStatus.textContent = "Lendo relatório...";

  try {
    if (!window.extractRelatorio5301FromArrayBuffer) {
      throw new Error("O leitor do relatório não foi carregado. Atualize a página e tente novamente.");
    }

    const items = await window.extractRelatorio5301FromArrayBuffer(await file.arrayBuffer());
    if (!items.length) {
      const detail = window.lastRelatorio5301Debug ? ` Detalhe: ${window.lastRelatorio5301Debug}` : "";
      throw new Error(`Não encontrei produtos com preço nesse PDF. Confirme se é o relatório 5301 de preços.${detail}`);
    }

    products = normalizeProducts(items);
    render();
    reportStatus.textContent = `${items.length} produtos encontrados. Todos foram carregados.`;
  } catch (error) {
    reportStatus.textContent = error.message || "Não foi possível carregar o relatório.";
  } finally {
    reportInput.value = "";
  }
});



document.querySelector("#clearButton").addEventListener("click", () => {
  products = normalizeProducts([]);
  render();
});


render();
