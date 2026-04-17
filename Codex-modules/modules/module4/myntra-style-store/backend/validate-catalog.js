const fs = require("fs");
const path = require("path");

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function validateProduct(product) {
  const requiredKeys = [
    "id",
    "name",
    "price",
    "badge",
    "category",
    "description",
    "delivery",
  ];

  requiredKeys.forEach((key) => {
    assert(product[key] !== undefined, `Missing product field: ${key}`);
  });

  assert(typeof product.id === "number", "Product id must be a number");
  assert(typeof product.name === "string", "Product name must be a string");
  assert(typeof product.price === "number", "Product price must be a number");
}

function main() {
  const catalogPath = path.join(__dirname, "catalog.json");
  const raw = fs.readFileSync(catalogPath, "utf8");
  const catalog = JSON.parse(raw);

  assert(typeof catalog.site?.name === "string", "Catalog site name must be a string");
  assert(Array.isArray(catalog.categories), "Catalog categories must be an array");
  assert(Array.isArray(catalog.heroSlides), "Catalog heroSlides must be an array");
  assert(Array.isArray(catalog.categoryTiles), "Catalog categoryTiles must be an array");
  assert(Array.isArray(catalog.brandHighlights), "Catalog brandHighlights must be an array");
  assert(Array.isArray(catalog.products), "Catalog products must be an array");
  assert(catalog.products.length > 0, "Catalog must include at least one product");

  catalog.heroSlides.forEach((slide, index) => {
    assert(typeof slide.title === "string", `Hero slide ${index} title must be a string`);
    assert(typeof slide.image === "string", `Hero slide ${index} image must be a string`);
  });

  catalog.categoryTiles.forEach((tile, index) => {
    assert(typeof tile.name === "string", `Category tile ${index} name must be a string`);
    assert(typeof tile.image === "string", `Category tile ${index} image must be a string`);
  });

  catalog.brandHighlights.forEach((brand, index) => {
    assert(typeof brand.name === "string", `Brand ${index} name must be a string`);
    assert(typeof brand.description === "string", `Brand ${index} description must be a string`);
  });

  catalog.products.forEach((product) => {
    validateProduct(product);
    assert(typeof product.slug === "string", "Product slug must be a string");
    assert(typeof product.brand === "string", "Product brand must be a string");
    assert(typeof product.originalPrice === "number", "Product originalPrice must be a number");
    assert(typeof product.discount === "number", "Product discount must be a number");
    assert(typeof product.rating === "number", "Product rating must be a number");
    assert(Array.isArray(product.images), "Product images must be an array");
    assert(Array.isArray(product.sizes), "Product sizes must be an array");
    assert(Array.isArray(product.reviews), "Product reviews must be an array");
  });

  console.log("Catalog validation passed.");
}

main();
