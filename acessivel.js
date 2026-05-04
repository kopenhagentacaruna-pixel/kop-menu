const categoryNames = {
  salgados: "Salgados",
  "bebidas-quentes": "Bebidas Quentes",
  "bebidas-geladas": "Bebidas Geladas",
  sobremesas: "Sobremesas",
  "sorvetes-sundaes-milkshakes": "Sorvetes, Sundaes e Milkshakes",
};

const categoryOrder = [
  "salgados",
  "bebidas-quentes",
  "bebidas-geladas",
  "sobremesas",
  "sorvetes-sundaes-milkshakes",
];

const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const categoryLinks = document.querySelector("#categoryLinks");
const menuContent = document.querySelector("#menuContent");

function normalizeCategory(category) {
  const normalized = String(category || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  const aliases = {
    sobremesa: "sobremesas",
    sobremesas: "sobremesas",
    salgado: "salgados",
    salgados: "salgados",
    "bebidas-quentes": "bebidas-quentes",
    "bebida-quente": "bebidas-quentes",
    "bebidas-geladas": "bebidas-geladas",
    "bebida-gelada": "bebidas-geladas",
    "doce-pausa": "bebidas-geladas",
    "sorvetes-sundaes-e-milkshakes": "sorvetes-sundaes-milkshakes",
    "sorvetes-sundaes-milkshakes": "sorvetes-sundaes-milkshakes",
  };

  return aliases[normalized] || normalized || "sobremesas";
}

function slugify(value) {
  return String(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function renderPrices(options) {
  return (options || [{ label: "Unidade", price: 0 }])
    .map((option) => `<li>${escapeHtml(option.label)}: ${currency.format(Number(option.price) || 0)}</li>`)
    .join("");
}

function renderCategory(category, items) {
  const title = categoryNames[category] || category;
  return `
    <section id="${slugify(category)}" aria-labelledby="${slugify(category)}-title">
      <h2 id="${slugify(category)}-title">${title}</h2>
      <ul class="menu-list">
        ${items
          .map(
            (item) => `
              <li class="item">
                <h3>${escapeHtml(item.name)}</h3>
                ${item.description ? `<p class="description">${escapeHtml(item.description)}</p>` : ""}
                <ul class="prices">
                  ${renderPrices(item.options)}
                </ul>
              </li>
            `
          )
          .join("")}
      </ul>
    </section>
  `;
}

async function loadMenu() {
  const response = await fetch(`./menu-data.json?v=${Date.now()}`);
  if (!response.ok) throw new Error("Não foi possível carregar o cardápio.");
  const items = await response.json();
  if (!Array.isArray(items)) throw new Error("Formato de cardápio inválido.");
  return items;
}

function renderMenu(items) {
  const groups = categoryOrder
    .map((category) => ({
      category,
      items: items.filter((item) => normalizeCategory(item.category) === category),
    }))
    .filter((group) => group.items.length);

  categoryLinks.innerHTML = groups
    .map((group) => `<li><a href="#${slugify(group.category)}">${categoryNames[group.category]}</a></li>`)
    .join("");

  menuContent.classList.remove("status");
  menuContent.innerHTML = groups.map((group) => renderCategory(group.category, group.items)).join("");
}

loadMenu()
  .then(renderMenu)
  .catch(() => {
    menuContent.textContent = "Não foi possível carregar o cardápio acessível. Tente novamente mais tarde.";
  });
