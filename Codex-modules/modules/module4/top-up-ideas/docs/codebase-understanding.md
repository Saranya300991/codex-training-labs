# Codebase Understanding Answers

This document now describes the Myntra-style store after the modification ideas were implemented across both the frontend and backend. Each section notes what the project looked like before the changes and what was added in the current version.

## 1. Entry Point Architecture

Before the changes, the frontend flow was simple: `frontend/src/main.jsx` mounted `App.jsx`, and `App.jsx` rendered a hero section, category panel, product grid, and a small status card. The backend entry point was `backend/index.js`, which defined the Express app, kept the product list inline, and exposed a single `GET /api/products` route.

After the changes, the entry points remain the same, but the responsibilities expanded:

- `frontend/src/main.jsx` still boots the app
- `frontend/src/App.jsx` now also owns the mega menu state, rotating offer banner, filter drawer state, and mini cart persistence
- `frontend/src/App.css` now supports dropdown states, animated offer cards, a three-column shopping layout, and responsive behavior for the new controls
- `backend/index.js` now loads catalog content from `backend/catalog.json`, logs every request, validates the outgoing payload shape, and exposes both `GET /api/products` and `GET /api/health`
- `backend/validate-catalog.js` was added as a simple validation harness for the JSON-backed catalog

So the architecture still uses the same React + Express split, but it now behaves more like a small product experience rather than a static demo page.

## 2. Data Flow and API Contract

Before the modifications, the frontend requested `http://localhost:5174/api/products`, then stored two things in state: `banner` and `products`. The backend shaped each product with `priceFormatted` and returned a payload like:

```json
{
  "banner": "Festival Drop | Free COD | Express delivery",
  "curated": []
}
```

After the modifications, the frontend still fetches the same endpoint, but it hydrates more UI behavior from the response:

- `banner` for the hero highlight chips
- `curated` for the product grid and filter results
- `offers` for the rotating localized offer banner

The backend now reads raw source data from `backend/catalog.json`, enriches each product with `priceFormatted`, validates the final payload, and returns:

```json
{
  "banner": "Festival Drop | Free COD | Express delivery",
  "offers": [
    {
      "headline": "Diwali Flash Sale",
      "detail": "Rotating offers now come from the backend and animate in the hero banner."
    }
  ],
  "curated": [
    {
      "id": 1,
      "name": "Anaya Chiffon Saree",
      "price": 4599,
      "currency": "INR",
      "badge": "New",
      "category": "Ethnic",
      "description": "Lightweight chiffon saree paired with subtle embroidery.",
      "delivery": "2-3 days",
      "priceFormatted": "Rs. 4,599.00"
    }
  ]
}
```

The frontend then derives several new views from that payload:

- `megaMenuGroups` for the hover menu sections
- `filteredProducts` for the category, price, and delivery drawer
- `cartItems` for the mini cart stored in `localStorage`
- `cartTotal` for the running order summary

The key change is that the app now has one fetch, but several derived UI stories built from that same shared catalog response.

## 3. Frontend Responsibilities

Before the changes, the React layer mainly handled loading state, error state, category extraction, and product rendering. The UI was presentational and read-only.

After the changes, the frontend supports four major feature additions from `modification-ideas.md`:

1. Mega menu for Indian festivals
   The new `MegaMenu` component exposes a hover and focus-driven panel with `aria-haspopup`, `aria-expanded`, and `aria-controls`. It surfaces "Festive Picks" and "Local Artisan" groups using the same fetched catalog rather than a separate endpoint.

2. Filterable product drawer
   `FilterDrawer` introduces stateful selectors for:
   - category
   - price range
   - delivery speed

   The product list is filtered through `filteredProducts`, which combines those selectors before rendering.

3. Localized offer banner
   The previous hero status card was replaced with `OfferRotator`, which cycles through backend-provided offers on a timer and announces updates with `aria-live="polite"`.

4. Mini cart experience
   `MiniCart` now tracks selected products in `localStorage` under `bazaar-india-cart`, shows a running total, and allows users to remove saved items.

This shifts the frontend from "catalog viewer" to "interactive merchandising surface."

## 4. Backend Responsibilities

Before the changes, the backend had one in-memory `products` array and one route. It formatted prices and returned JSON, but there was no request logging, no health endpoint, and no catalog validation step.

After the changes, the backend now includes:

- `catalog.json` as the source of truth for banner text, rotating offers, and products
- request logging middleware that prints method, URL, status, and elapsed time
- `validateCatalogResponse(payload)` to catch malformed responses before they go out
- `GET /api/health` for a lightweight service check
- `validate-catalog.js` and `npm run validate` to verify the catalog structure on demand

The backend still stays intentionally small, but it is more production-shaped than before because catalog content, observability, and data validation are no longer mixed directly into one inline route.

## 5. Operational Notes and Validation

Before the changes, operational notes were mostly limited to "run the frontend" and "run the backend." There was no built-in data validation script and no richer documentation about how changes had altered the stack.

After the modifications, the project was validated with these commands:

- backend: `npm run validate`
- frontend: `npm run lint`
- frontend: `npm run build`

Observed outcomes:

- catalog validation passed
- lint passed after converting the offer update to a functional state setter
- production build passed successfully
- the first build attempt failed inside the Windows sandbox with `spawn EPERM`, so the build was rerun outside the sandbox and then completed successfully

The current operational picture is stronger than before because the codebase now has:

- data validation for the backend source file
- request logging for live API calls
- a health endpoint
- documented before-and-after behavior in the prompt answer files

## 6. Summarization Habit for a Larger Repo

Before the modifications, a summary of this codebase could stop at the main app, the single route, and the product cards. After the modifications, a useful summary must also capture derived behavior and side effects, not just entry points.

For a larger repository, I would now summarize this project using:

- entry points: `frontend/src/main.jsx`, `frontend/src/App.jsx`, `backend/index.js`
- source-of-truth data files: `backend/catalog.json`
- runtime scripts: `npm run dev`, `npm start`, `npm run validate`, `npm run lint`, `npm run build`
- derived UI systems: mega menu, filter drawer, rotating offers, mini cart
- supporting docs: documentary, report, and summary answer files in this folder

That keeps the summary actionable because it shows both where the app starts and where the most meaningful new behavior now lives.
