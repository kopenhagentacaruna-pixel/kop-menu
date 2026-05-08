const STORAGE_KEY = "kop-price-labels-v1";
const LABELS_PER_PAGE = 15;

const initialProducts = [];

let products = normalizeProducts(loadProducts());

const rowsEl = document.querySelector("#productRows");
const printAreaEl = document.querySelector("#printArea");
const reportInput = document.querySelector("#reportInput");
const reportStatus = document.querySelector("#reportStatus");

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

document.querySelector("#printButton").addEventListener("click", () => window.print());

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
