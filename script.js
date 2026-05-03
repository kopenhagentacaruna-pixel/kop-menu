const menuItems = [
  {
    name: "Café Expresso",
    category: "bebidas-quentes",
    description: "Café expresso feito com grão arábica.",
    drink: "#8b4c22",
    foam: "#bd8953",
    options: [
      { label: "60ml", price: 11.9 },
      { label: "100ml", price: 19.9 },
    ],
  },
  {
    name: "Café Carioca",
    category: "bebidas-quentes",
    description: "Café expresso menos intenso.",
    drink: "#9b5a2f",
    foam: "#c79764",
    options: [{ label: "50ml", price: 11.9 }],
  },
  {
    name: "Café com Leite",
    category: "bebidas-quentes",
    description: "Café expresso com leite vaporizado.",
    drink: "#c8a37b",
    foam: "#f4dfc4",
    options: [
      { label: "50ml", price: 13.9 },
      { label: "150ml", price: 20.9 },
    ],
  },
  {
    name: "Canelinha",
    category: "bebidas-quentes",
    description: "Café, leite vaporizado e canela em pó.",
    drink: "#c19064",
    foam: "#efd5b8",
    options: [
      { label: "50ml", price: 13.9 },
      { label: "150ml", price: 20.9 },
    ],
  },
  {
    name: "Capuccino Tradicional",
    category: "bebidas-quentes",
    description: "Café expresso com leite, chocolate em lascas, companhia chantilly.",
    drink: "#bd8a58",
    foam: "#f0d8bd",
    options: [
      { label: "50ml", price: 19.9 },
      { label: "150ml", price: 26.9 },
    ],
  },
  {
    name: "Capuccino Língua de Gato",
    category: "bebidas-quentes",
    description: "Café expresso com leite e chocolate em lascas.",
    drink: "#b97f54",
    foam: "#edd2b0",
    options: [
      { label: "50ml", price: 23.9 },
      { label: "150ml", price: 29.9 },
    ],
  },
  {
    name: "Capuccino Soul Good",
    category: "bebidas-quentes",
    description: "Café expresso com leite vegetal, mini tablete Soul Good e gotas de chocolate.",
    drink: "#a86d48",
    foam: "#dfc2a1",
    options: [
      { label: "50ml", price: 26.5 },
      { label: "150ml", price: 31.5 },
    ],
  },
  {
    name: "Chocolate Quente",
    category: "bebidas-quentes",
    description: "Chocolate quente saboroso feito a partir do melhor cacau com nata.",
    drink: "#9c5b34",
    foam: "#c99764",
    options: [
      { label: "50ml", price: 14.9 },
      { label: "150ml", price: 22.9 },
    ],
  },
  {
    name: "Chococcino",
    category: "bebidas-quentes",
    description: "Bebida cremosa com leite vaporizado e chocolate em lascas.",
    drink: "#5c3424",
    foam: "#2f211c",
    options: [
      { label: "50ml", price: 19.9 },
      { label: "150ml", price: 26.9 },
    ],
  },
  {
    name: "Mexicano",
    category: "bebidas-quentes",
    description: "Chocolate intenso cremoso com toque de canela e pimenta chantilly.",
    drink: "#45251d",
    foam: "#82523a",
    options: [
      { label: "50ml", price: 19.9 },
      { label: "150ml", price: 26.9 },
    ],
  },
  {
    name: "Chá Quente",
    category: "bebidas-quentes",
    description: "Consulte disponibilidade em loja.",
    drink: "#622118",
    foam: "#8d4b35",
    options: [{ label: "150ml", price: 10.9 }],
  },
  {
    name: "Mini Trufa",
    category: "bebidas-geladas",
    description: "Bebida quente acompanhada de mini trufa Mil Delícias.",
    type: "combo",
    drink: "#9b5a2f",
    foam: "#c79764",
    extra: "#241d18",
    options: [{ label: "Expresso 50ml", price: 14.9 }],
  },
  {
    name: "Brown Good",
    category: "bebidas-geladas",
    description: "Bebida quente acompanhada de brownie Brown Soul Good 20g.",
    type: "combo",
    drink: "#9b5a2f",
    foam: "#c79764",
    extra: "#5d3025",
    options: [{ label: "Expresso 50ml", price: 19.9 }],
  },
  {
    name: "Cookies Copacol",
    category: "bebidas-geladas",
    description: "Bebida quente acompanhada de cookies nos sabores do dia.",
    type: "combo",
    drink: "#9b5a2f",
    foam: "#c79764",
    extra: "#e5d4c5",
    options: [{ label: "Expresso 50ml", price: 24.9 }],
  },
  {
    name: "Cookie 3 Sabores",
    category: "sobremesas",
    description: "Cookie saboroso nos sabores chocolate, baunilha ou trufas.",
    type: "treat",
    drink: "#7a4d35",
    foam: "#d8b17b",
    extra: "#6c3d2f",
    options: [{ label: "100g", price: 42.39 }],
  },
  {
    name: "Barra Nuts",
    category: "sobremesas",
    description: "Barra Nuts de castanha ao leite com chocolate.",
    type: "treat",
    drink: "#5a2f27",
    foam: "#a77852",
    extra: "#2f211c",
    options: [{ label: "100g", price: 43.79 }],
  },
  {
    name: "Brownie Gourmet",
    category: "sobremesas",
    description: "Brownie cremoso e coberto pelo irresistível chocolate.",
    type: "treat",
    drink: "#6b382d",
    foam: "#b97c5c",
    extra: "#4a2a22",
    options: [{ label: "55g", price: 20.9 }],
  },
  {
    name: "Pão de Queijo",
    category: "salgados",
    description: "Pão de queijo assado, dourado por fora e macio por dentro.",
    type: "savory",
    options: [{ label: "Unidade", price: 10.9 }],
  },
  {
    name: "Mini Pão de Queijo",
    category: "salgados",
    description: "Porção de mini pães de queijo para acompanhar café ou chocolate quente.",
    type: "savory",
    options: [{ label: "Porção", price: 18.9 }],
  },
  {
    name: "Croissant Caprese",
    category: "salgados",
    description: "Croissant recheado em versão caprese.",
    type: "savory",
    options: [{ label: "Unidade", price: 26.9 }],
  },
  {
    name: "Krok Monsier",
    category: "salgados",
    description: "Sanduíche tostado com recheio cremoso e cobertura gratinada.",
    type: "savory",
    options: [{ label: "Unidade", price: 29.9 }],
  },
];

const defaultMenuItems = menuItems.map((item) => ({ ...item, options: item.options.map((option) => ({ ...option })) }));

function shouldUseDefaultSavoryImage(item) {
  const defaultSavoryNames = ["Pão de Queijo", "Mini Pão de Queijo", "Croissant Caprese", "Krok Monsier"];
  return item.category === "salgados" && defaultSavoryNames.includes(item.name);
}

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
    delicia: "sobremesas",
    delicias: "sobremesas",
    "bebidas-quentes": "bebidas-quentes",
    "bebida-quente": "bebidas-quentes",
    "doce-pausa": "bebidas-geladas",
    "doce-paula": "bebidas-geladas",
    "bebidas-geladas": "bebidas-geladas",
    "bebida-gelada": "bebidas-geladas",
    "sorvetes-sundaes-e-milkshakes": "sorvetes-sundaes-milkshakes",
    "sorvetes-sundaes-milkshakes": "sorvetes-sundaes-milkshakes",
  };

  return aliases[normalized] || normalized || "sobremesas";
}

function normalizeMenuItem(item) {
  return {
    ...item,
    category: normalizeCategory(item.category),
    options: Array.isArray(item.options) && item.options.length ? item.options : [{ label: "Unidade", price: 0 }],
  };
}

async function loadMenuItems() {
  try {
    const response = await fetch(`./menu-data.json?v=${Date.now()}`);
    if (!response.ok) throw new Error("Arquivo de dados não encontrado.");
    const items = await response.json();
    if (!Array.isArray(items) || !items.length) throw new Error("Arquivo de dados vazio.");
    return items.map(normalizeMenuItem);
  } catch {
    return defaultMenuItems.map(normalizeMenuItem);
  }
}

const categoryNames = {
  todos: "Todos os itens",
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

let activeCategory = "todos";
let searchTerm = "";

const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const menuList = document.querySelector("#menuList");
const itemCount = document.querySelector("#itemCount");
const searchInput = document.querySelector("#searchInput");
const categoryTitle = document.querySelector("#categoryTitle");
const tabs = document.querySelectorAll(".tab");
const topbar = document.querySelector(".topbar");
const menuTools = document.querySelector(".menu-tools");

function updateStickyOffset() {
  if (!topbar) return;
  document.documentElement.style.setProperty("--topbar-height", `${Math.ceil(topbar.getBoundingClientRect().height)}px`);
}

function normalizeText(value) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function slugify(value) {
  return normalizeText(value).replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function getFilteredItems() {
  const normalizedSearch = normalizeText(searchTerm);

  return menuItems
    .filter((item) => {
      const itemCategory = normalizeCategory(item.category);
      const matchesCategory = activeCategory === "todos" || itemCategory === activeCategory;
      const searchable = normalizeText(
        `${item.name} ${item.description} ${item.options.map((option) => option.label).join(" ")}`
      );
      return matchesCategory && searchable.includes(normalizedSearch);
    })
    .sort((first, second) => {
      const firstCategory = normalizeCategory(first.category);
      const secondCategory = normalizeCategory(second.category);
      const firstOrder = categoryOrder.includes(firstCategory) ? categoryOrder.indexOf(firstCategory) : 999;
      const secondOrder = categoryOrder.includes(secondCategory) ? categoryOrder.indexOf(secondCategory) : 999;
      return firstOrder - secondOrder;
    });
}

function getImageSource(item) {
  return item.image || `${slugify(item.name)}.png`;
}

function renderMenu() {
  const filteredItems = getFilteredItems();
  categoryTitle.textContent = categoryNames[activeCategory];
  itemCount.textContent = `${filteredItems.length} ${filteredItems.length === 1 ? "item" : "itens"}`;

  if (!filteredItems.length) {
    menuList.innerHTML = '<div class="empty-state">Nenhum item encontrado nessa busca.</div>';
    return;
  }

  menuList.innerHTML = filteredItems
    .map((item) => {
      const cardClass = item.type ? `menu-card ${item.type}` : "menu-card";

      return `
        <article class="${cardClass}" data-category="${normalizeCategory(item.category)}">
          <div class="cup-art">
            <img src="${getImageSource(item)}" alt="${item.name}" loading="lazy" />
          </div>
          <div class="item-info">
            <div class="item-heading">
              <h3>${item.name}</h3>
            </div>
            <p class="description">${item.description}</p>
            <div class="price-list">
              ${item.options
                .map(
                  (option) => `
                    <div class="price-row">
                      <span>${option.label}</span>
                      <strong>${currency.format(option.price)}</strong>
                    </div>
                  `
                )
                .join("")}
            </div>
          </div>
        </article>
      `;
    })
    .join("");
}

function resetTabsToAll() {
  activeCategory = "todos";
  tabs.forEach((tab) => {
    tab.classList.toggle("active", tab.dataset.category === "todos");
  });
}

if (menuList && searchInput && categoryTitle) {
  updateStickyOffset();
  window.addEventListener("resize", updateStickyOffset);
  resetTabsToAll();

  searchInput.addEventListener("input", (event) => {
    searchTerm = event.target.value;
    renderMenu();
  });

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      tabs.forEach((entry) => entry.classList.remove("active"));
      tab.classList.add("active");
      activeCategory = tab.dataset.category;
      renderMenu();
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  });

  loadMenuItems().then((loadedItems) => {
    menuItems.splice(0, menuItems.length, ...loadedItems);
    resetTabsToAll();
    renderMenu();
  });
}
