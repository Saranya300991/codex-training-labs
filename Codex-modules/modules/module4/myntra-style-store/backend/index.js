const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 5174;

app.use(cors());
app.use(express.json());

function loadCatalog() {
  const catalogPath = path.join(__dirname, "catalog.json");
  const rawCatalog = fs.readFileSync(catalogPath, "utf8");
  return JSON.parse(rawCatalog);
}

function formatPrice(price, currency = "INR") {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(price);
}

function serializeProduct(product) {
  return {
    ...product,
    currency: product.currency || "INR",
    priceFormatted: formatPrice(product.price, product.currency || "INR"),
    originalPriceFormatted: formatPrice(product.originalPrice, product.currency || "INR"),
  };
}

function validateHomeResponse(payload) {
  if (!payload?.site?.name) {
    throw new Error("Home payload must include site metadata");
  }

  if (!Array.isArray(payload.heroSlides) || !Array.isArray(payload.trendingProducts)) {
    throw new Error("Home payload must include heroSlides and trendingProducts");
  }
}

function validateListingResponse(payload) {
  if (!Array.isArray(payload.products) || !payload.filters) {
    throw new Error("Listing payload must include products and filters");
  }
}

function validateDetailResponse(payload) {
  if (!payload?.product || !Array.isArray(payload.relatedProducts)) {
    throw new Error("Detail payload must include product and relatedProducts");
  }
}

function buildFilterMetadata(products) {
  return {
    categories: [...new Set(products.map((product) => product.category))],
    brands: [...new Set(products.map((product) => product.brand))],
    ratings: [4, 3, 2, 1],
  };
}

function applyListingFilters(products, query) {
  const {
    category,
    brand,
    rating,
    sort = "popularity",
    search = "",
    minPrice,
    maxPrice,
  } = query;

  const minimumRating = Number(rating || 0);
  const minimumPrice = Number(minPrice || 0);
  const maximumPrice = Number(maxPrice || Number.MAX_SAFE_INTEGER);
  const searchTerm = search.trim().toLowerCase();

  const filtered = products.filter((product) => {
    const categoryMatch = !category || category === "All" || product.category === category;
    const brandMatch = !brand || product.brand === brand;
    const ratingMatch = !minimumRating || product.rating >= minimumRating;
    const priceMatch = product.price >= minimumPrice && product.price <= maximumPrice;
    const searchMatch =
      !searchTerm ||
      [product.name, product.brand, product.category, product.description]
        .join(" ")
        .toLowerCase()
        .includes(searchTerm);

    return categoryMatch && brandMatch && ratingMatch && priceMatch && searchMatch;
  });

  const sorted = [...filtered].sort((left, right) => {
    if (sort === "price-asc") return left.price - right.price;
    if (sort === "price-desc") return right.price - left.price;
    if (sort === "rating") return right.rating - left.rating;
    return right.popularity - left.popularity;
  });

  return sorted;
}

app.use((req, res, next) => {
  const startedAt = Date.now();
  res.on("finish", () => {
    console.log(
      `[${new Date().toISOString()}] ${req.method} ${req.originalUrl} ${res.statusCode} ${
        Date.now() - startedAt
      }ms`,
    );
  });
  next();
});

app.get("/api/home", (req, res) => {
  try {
    const catalog = loadCatalog();
    const payload = {
      site: catalog.site,
      categories: catalog.categories,
      heroSlides: catalog.heroSlides,
      categoryTiles: catalog.categoryTiles,
      brandHighlights: catalog.brandHighlights,
      trendingProducts: [...catalog.products]
        .sort((left, right) => right.popularity - left.popularity)
        .slice(0, 6)
        .map(serializeProduct),
    };

    validateHomeResponse(payload);
    res.json(payload);
  } catch (error) {
    console.error("Home request failed", error);
    res.status(500).json({ message: "Unable to load homepage data" });
  }
});

app.get("/api/products", (req, res) => {
  try {
    const catalog = loadCatalog();
    const filteredProducts = applyListingFilters(catalog.products, req.query);

    const payload = {
      site: catalog.site,
      categories: catalog.categories,
      products: filteredProducts.map(serializeProduct),
      filters: buildFilterMetadata(catalog.products),
      total: filteredProducts.length,
    };

    validateListingResponse(payload);
    res.json(payload);
  } catch (error) {
    console.error("Listing request failed", error);
    res.status(500).json({ message: "Unable to load products" });
  }
});

app.get("/api/products/:slug", (req, res) => {
  try {
    const catalog = loadCatalog();
    const product = catalog.products.find((item) => item.slug === req.params.slug);

    if (!product) {
      res.status(404).json({ message: "Product not found" });
      return;
    }

    const relatedProducts = catalog.products
      .filter((item) => item.slug !== product.slug && item.category === product.category)
      .slice(0, 4)
      .map(serializeProduct);

    const payload = {
      product: serializeProduct(product),
      relatedProducts,
    };

    validateDetailResponse(payload);
    res.json(payload);
  } catch (error) {
    console.error("Product detail request failed", error);
    res.status(500).json({ message: "Unable to load product detail" });
  }
});

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", service: "catalog-api" });
});

app.listen(PORT, () => {
  console.log(`Catalog API listening on http://localhost:${PORT}`);
});
