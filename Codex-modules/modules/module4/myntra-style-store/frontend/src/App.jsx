import { useEffect, useMemo, useState } from "react";
import "./App.css";

const API_BASE = "http://localhost:5174/api";
const CART_KEY = "muse-avenue-cart";
const WISHLIST_KEY = "muse-avenue-wishlist";
const DEFAULT_CATEGORIES = ["Men", "Women", "Kids", "Beauty", "Home & Living"];

function readStore(key, fallback) {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function Icon({ name }) {
  const icons = {
    search: <path d="M15.5 15.5 20 20M17 9.5A7.5 7.5 0 1 1 2 9.5a7.5 7.5 0 0 1 15 0Z" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />,
    heart: <path d="M12 20.4s-7-4.5-7-10.2A4.2 4.2 0 0 1 9.2 6c1.2 0 2.3.5 2.8 1.4A3.6 3.6 0 0 1 14.8 6 4.2 4.2 0 0 1 19 10.2C19 15.9 12 20.4 12 20.4Z" fill="none" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.8" />,
    cart: <><path d="M3.5 4h2.1l1.6 9.2a1.2 1.2 0 0 0 1.2 1h7.4a1.2 1.2 0 0 0 1.2-.9L19 7H7.2" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" /><circle cx="10" cy="19" r="1.4" fill="currentColor" /><circle cx="17" cy="19" r="1.4" fill="currentColor" /></>,
    user: <><circle cx="12" cy="8" r="3.5" fill="none" stroke="currentColor" strokeWidth="1.8" /><path d="M5 20a7 7 0 0 1 14 0" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" /></>,
    star: <path d="m12 3 2.7 5.4 6 .9-4.3 4.2 1 5.9L12 16.5l-5.4 2.9 1-5.9L3.3 9.3l6-.9Z" fill="currentColor" />,
    close: <path d="M5 5l14 14M19 5 5 19" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />,
    minus: <path d="M5 12h14" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />,
    plus: <path d="M12 5v14M5 12h14" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />,
  };
  return <svg aria-hidden="true" className="icon-svg" viewBox="0 0 24 24">{icons[name]}</svg>;
}

function useRoute() {
  const getLocation = () => ({ pathname: window.location.pathname, search: window.location.search });
  const [route, setRoute] = useState(getLocation);

  useEffect(() => {
    const onPopState = () => setRoute(getLocation());
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  function navigate(pathname, params = {}) {
    const search = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== "" && value !== undefined && value !== null) search.set(key, value);
    });
    const url = search.toString() ? `${pathname}?${search}` : pathname;
    window.history.pushState({}, "", url);
    setRoute(getLocation());
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return { route, navigate };
}

function Navbar({
  categories,
  searchValue,
  onSearchChange,
  onSearchSubmit,
  onNavigate,
  onOpenPanel,
  wishlistCount,
  cartCount,
}) {
  return (
    <>
      <div className="promo-strip">End of Season Sale | Up to 60% off | Free shipping above INR 1,999</div>
      <header className="site-header">
        <button type="button" className="logo-lockup" onClick={() => onNavigate("/")}>
          <span className="logo-mark">M</span>
          <span><strong>Muse Avenue</strong><small>Premium fashion curation</small></span>
        </button>
        <nav className="category-nav" aria-label="Categories">
          {categories.map((category) => (
            <button key={category} type="button" className="nav-link" onClick={() => onNavigate("/products", { category })}>
              {category}
            </button>
          ))}
        </nav>
        <form className="search-shell" onSubmit={onSearchSubmit}>
          <Icon name="search" />
          <input type="search" value={searchValue} onChange={(event) => onSearchChange(event.target.value)} placeholder="Search shirts, dresses, sneakers..." />
        </form>
        <div className="header-icons">
          <button type="button" className="icon-button" onClick={() => onOpenPanel("profile")}><Icon name="user" /><span>Profile</span></button>
          <button type="button" className="icon-button" onClick={() => onOpenPanel("wishlist")}><span className="icon-badge">{wishlistCount}</span><Icon name="heart" /><span>Wishlist</span></button>
          <button type="button" className="icon-button" onClick={() => onOpenPanel("cart")}><span className="icon-badge">{cartCount}</span><Icon name="cart" /><span>Cart</span></button>
        </div>
      </header>
    </>
  );
}

function ProductCard({ product, onNavigate, onAddToCart, onToggleWishlist, wishlisted }) {
  return (
    <article className="product-card">
      <div className="product-media">
        <img src={product.images[0]} alt={product.name} />
        <div className="product-overlay">
          <button type="button" className="ghost-pill" onClick={() => onNavigate(`/products/${product.slug}`)}>Quick View</button>
          <button type="button" className={wishlisted ? "icon-circle active" : "icon-circle"} onClick={() => onToggleWishlist(product.slug)} aria-label="Toggle wishlist">
            <Icon name="heart" />
          </button>
        </div>
      </div>
      <div className="product-body">
        <div className="product-row"><span className="product-brand">{product.brand}</span><span className="product-badge">{product.badge}</span></div>
        <button type="button" className="product-title" onClick={() => onNavigate(`/products/${product.slug}`)}>{product.name}</button>
        <p className="product-description">{product.description}</p>
        <div className="product-rating"><span className="rating-pill"><Icon name="star" />{product.rating}</span><span>{product.reviewCount} reviews</span></div>
        <div className="product-pricing"><strong>{product.priceFormatted}</strong><span>{product.originalPriceFormatted}</span><em>{product.discount}% off</em></div>
        <div className="product-actions">
          <button type="button" className="secondary-btn" onClick={() => onAddToCart(product, product.sizes?.[0], 1)}>Add to Cart</button>
          <button type="button" className="ghost-btn" onClick={() => onNavigate(`/products/${product.slug}`)}>View Details</button>
        </div>
      </div>
    </article>
  );
}

function Footer({ onNavigate }) {
  return (
    <footer className="site-footer">
      <div><h4>Muse Avenue</h4><p>Minimal, premium shopping across fashion, beauty, and modern living.</p></div>
      <div><h4>Explore</h4><button type="button" onClick={() => onNavigate("/")}>Home</button><button type="button" onClick={() => onNavigate("/products")}>Shop</button><button type="button">About</button></div>
      <div><h4>Support</h4><button type="button">Contact</button><button type="button">Policies</button><button type="button">Returns</button></div>
      <div><h4>Social</h4><button type="button">Instagram</button><button type="button">Pinterest</button><button type="button">YouTube</button></div>
    </footer>
  );
}

function Drawer({ panel, cartItems, wishlistItems, cartTotal, onClose, onNavigate, onRemoveCart, onAdjustQty }) {
  if (!panel) return null;

  return (
    <div className="panel-backdrop" onClick={onClose}>
      <aside className="side-panel" onClick={(event) => event.stopPropagation()}>
        <div className="panel-header">
          <div>
            <p className="eyebrow-text">{panel === "cart" ? "Your Bag" : panel === "wishlist" ? "Saved Styles" : "Account"}</p>
            <h3>{panel === "cart" ? "Cart" : panel === "wishlist" ? "Wishlist" : "Profile"}</h3>
          </div>
          <button type="button" className="icon-circle" onClick={onClose}><Icon name="close" /></button>
        </div>

        {panel === "profile" && (
          <div className="panel-content">
            <p>Sign in to sync your wishlist, bag, and order tracking across devices.</p>
            <button type="button" className="primary-btn">Continue</button>
          </div>
        )}

        {panel === "wishlist" && (
          <div className="panel-content">
            {wishlistItems.length ? wishlistItems.map((item) => (
              <button key={item.slug} type="button" className="mini-item" onClick={() => { onNavigate(`/products/${item.slug}`); onClose(); }}>
                <img src={item.images[0]} alt={item.name} />
                <div><strong>{item.name}</strong><span>{item.brand}</span><small>{item.priceFormatted}</small></div>
              </button>
            )) : <p>Your wishlist is empty. Save a few looks to revisit them later.</p>}
          </div>
        )}

        {panel === "cart" && (
          <>
            <div className="panel-content">
              {cartItems.length ? cartItems.map((item) => (
                <article key={item.key} className="cart-row">
                  <img src={item.images[0]} alt={item.name} />
                  <div className="cart-row-copy">
                    <strong>{item.name}</strong>
                    <span>{item.brand}</span>
                    <small>{item.selectedSize ? `Size ${item.selectedSize}` : "One size"} | {item.priceFormatted}</small>
                    <div className="quantity-row">
                      <button type="button" onClick={() => onAdjustQty(item.key, -1)}><Icon name="minus" /></button>
                      <span>{item.quantity}</span>
                      <button type="button" onClick={() => onAdjustQty(item.key, 1)}><Icon name="plus" /></button>
                    </div>
                  </div>
                  <button type="button" className="ghost-link" onClick={() => onRemoveCart(item.key)}>Remove</button>
                </article>
              )) : <p>Your cart is empty. Add something refined to get started.</p>}
            </div>
            <div className="panel-footer"><div><p>Total</p><strong>{cartTotal}</strong></div><button type="button" className="primary-btn">Checkout</button></div>
          </>
        )}
      </aside>
    </div>
  );
}

function LoadingCopy({ text }) {
  return <div className="loading-shell">{text}</div>;
}

function App() {
  const { route, navigate } = useRoute();
  const [homeData, setHomeData] = useState(null);
  const [listingData, setListingData] = useState(null);
  const [detailData, setDetailData] = useState(null);
  const [panel, setPanel] = useState(null);
  const [heroIndex, setHeroIndex] = useState(0);
  const [searchValue, setSearchValue] = useState("");
  const [wishlist, setWishlist] = useState(() => readStore(WISHLIST_KEY, []));
  const [cartItems, setCartItems] = useState(() => readStore(CART_KEY, []));
  const [selectedSize, setSelectedSize] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);

  const detailSlug = route.pathname.startsWith("/products/") ? route.pathname.replace("/products/", "") : "";
  const isListingPage = route.pathname === "/products";
  const filters = useMemo(() => {
    const params = new URLSearchParams(route.search);
    return {
      category: params.get("category") ?? "",
      brand: params.get("brand") ?? "",
      rating: params.get("rating") ?? "",
      sort: params.get("sort") ?? "popularity",
      search: params.get("search") ?? "",
      minPrice: params.get("minPrice") ?? "",
      maxPrice: params.get("maxPrice") ?? "",
    };
  }, [route.search]);

  useEffect(() => {
    window.localStorage.setItem(CART_KEY, JSON.stringify(cartItems));
  }, [cartItems]);

  useEffect(() => {
    window.localStorage.setItem(WISHLIST_KEY, JSON.stringify(wishlist));
  }, [wishlist]);

  useEffect(() => {
    setSearchValue(filters.search);
  }, [filters.search]);

  useEffect(() => {
    fetch(`${API_BASE}/home`)
      .then((response) => response.json())
      .then(setHomeData)
      .catch((error) => console.error("Unable to load homepage", error));
  }, []);

  useEffect(() => {
    if (!homeData?.heroSlides?.length || route.pathname !== "/") return undefined;
    const timer = window.setInterval(() => {
      setHeroIndex((current) => (current + 1) % homeData.heroSlides.length);
    }, 4200);
    return () => window.clearInterval(timer);
  }, [homeData, route.pathname]);

  useEffect(() => {
    if (!isListingPage) return;
    fetch(`${API_BASE}/products${route.search}`)
      .then((response) => response.json())
      .then(setListingData)
      .catch((error) => console.error("Unable to load listing", error));
  }, [isListingPage, route.search]);

  useEffect(() => {
    if (!detailSlug) return;
    fetch(`${API_BASE}/products/${detailSlug}`)
      .then((response) => response.json())
      .then((data) => {
        setDetailData(data);
        setSelectedSize(data.product.sizes[0] ?? "");
        setQuantity(1);
        setActiveImage(0);
      })
      .catch((error) => console.error("Unable to load detail page", error));
  }, [detailSlug]);

  const cartCount = useMemo(() => cartItems.reduce((sum, item) => sum + item.quantity, 0), [cartItems]);
  const cartTotal = useMemo(() => {
    const total = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(total);
  }, [cartItems]);

  const productLookup = useMemo(() => {
    const items = [
      ...(homeData?.trendingProducts ?? []),
      ...(listingData?.products ?? []),
      ...(detailData ? [detailData.product] : []),
      ...(detailData?.relatedProducts ?? []),
    ];
    return Object.fromEntries(items.map((item) => [item.slug, item]));
  }, [homeData, listingData, detailData]);

  const wishlistItems = useMemo(() => wishlist.map((slug) => productLookup[slug]).filter(Boolean), [wishlist, productLookup]);
  const categories = homeData?.categories ?? listingData?.categories ?? DEFAULT_CATEGORIES;

  function handleNavigate(pathname, params = {}) {
    navigate(pathname, params);
  }

  function updateFilters(updates) {
    handleNavigate("/products", { ...filters, ...updates });
  }

  function toggleWishlist(slug) {
    setWishlist((current) => current.includes(slug) ? current.filter((item) => item !== slug) : [...current, slug]);
  }

  function addToCart(product, size = product.sizes?.[0] ?? "", qty = 1) {
    const key = `${product.slug}-${size}`;
    setCartItems((current) => {
      const existing = current.find((item) => item.key === key);
      if (existing) {
        return current.map((item) => item.key === key ? { ...item, quantity: item.quantity + qty } : item);
      }
      return [...current, { key, slug: product.slug, name: product.name, brand: product.brand, price: product.price, priceFormatted: product.priceFormatted, images: product.images, quantity: qty, selectedSize: size }];
    });
    setPanel("cart");
  }

  function adjustQty(key, delta) {
    setCartItems((current) => current.map((item) => item.key === key ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item));
  }

  function removeCart(key) {
    setCartItems((current) => current.filter((item) => item.key !== key));
  }

  function submitSearch(event) {
    event.preventDefault();
    handleNavigate("/products", { ...filters, search: searchValue });
  }

  function renderHome() {
    if (!homeData) return <LoadingCopy text="Loading the premium storefront..." />;
    const hero = homeData.heroSlides[heroIndex] ?? homeData.heroSlides[0];
    return (
      <div className="page-shell">
        <section className="hero-banner">
          <div className="hero-copy">
            <p className="eyebrow-text">{hero.eyebrow}</p>
            <h1>{hero.title}</h1>
            <p>{hero.subtitle}</p>
            <div className="hero-cta-row">
              <button type="button" className="primary-btn" onClick={() => handleNavigate("/products", { sort: "popularity" })}>{hero.ctaLabel}</button>
              <button type="button" className="ghost-btn" onClick={() => handleNavigate("/products")}>Explore Collection</button>
            </div>
          </div>
          <div className="hero-image-shell">
            <img src={hero.image} alt={hero.title} className="hero-image" />
            <div className="hero-indicators">{homeData.heroSlides.map((slide, index) => <span key={slide.id} className={index === heroIndex ? "dot active" : "dot"} />)}</div>
          </div>
        </section>

        <section className="section-block">
          <div className="section-heading"><div><p className="eyebrow-text">Shop by category</p><h2>Fashion-first edits with a modern premium mood</h2></div></div>
          <div className="category-tile-grid">
            {homeData.categoryTiles.map((tile) => (
              <button key={tile.name} type="button" className="category-tile" onClick={() => handleNavigate("/products", { category: tile.name })}>
                <img src={tile.image} alt={tile.name} />
                <div className="category-tile-copy"><strong>{tile.name}</strong><span>{tile.caption}</span></div>
              </button>
            ))}
          </div>
        </section>

        <section className="section-block">
          <div className="section-heading"><div><p className="eyebrow-text">Trending products</p><h2>Editorial picks from the latest drop</h2></div><button type="button" className="ghost-btn" onClick={() => handleNavigate("/products", { sort: "popularity" })}>View All</button></div>
          <div className="carousel-row">
            {homeData.trendingProducts.map((product) => (
              <ProductCard key={product.slug} product={product} onNavigate={handleNavigate} onAddToCart={addToCart} onToggleWishlist={toggleWishlist} wishlisted={wishlist.includes(product.slug)} />
            ))}
          </div>
        </section>

        <section className="section-block brand-highlight-shell">
          <div className="section-heading"><div><p className="eyebrow-text">Brand highlights</p><h2>Labels shaping the modern fashion mood board</h2></div></div>
          <div className="brand-grid">
            {homeData.brandHighlights.map((brand) => (
              <article key={brand.name} className="brand-card" style={{ "--accent-card": brand.accent }}>
                <strong>{brand.name}</strong>
                <p>{brand.description}</p>
              </article>
            ))}
          </div>
        </section>
      </div>
    );
  }

  function renderListing() {
    if (!listingData) return <LoadingCopy text="Loading new arrivals..." />;
    return (
      <div className="page-shell listing-shell">
        <section className="listing-hero">
          <div><p className="eyebrow-text">Product listing</p><h1>Clean, elevated fashion with strong filters and sharper browsing</h1><p>Refine your grid by category, brand, price, ratings, or popularity.</p></div>
          <div className="listing-meta"><span>{listingData.total} styles</span><label>Sort<select value={filters.sort} onChange={(event) => updateFilters({ sort: event.target.value })}><option value="popularity">Popularity</option><option value="price-asc">Price: Low to High</option><option value="price-desc">Price: High to Low</option><option value="rating">Top Rated</option></select></label></div>
        </section>
        <div className="listing-layout">
          <aside className="filters-sidebar">
            <div className="filter-section"><h3>Category</h3><div className="filter-chip-list"><button type="button" className={!filters.category ? "filter-chip active" : "filter-chip"} onClick={() => updateFilters({ category: "" })}>All</button>{listingData.filters.categories.map((category) => <button key={category} type="button" className={filters.category === category ? "filter-chip active" : "filter-chip"} onClick={() => updateFilters({ category })}>{category}</button>)}</div></div>
            <div className="filter-section"><h3>Brand</h3><select value={filters.brand} onChange={(event) => updateFilters({ brand: event.target.value })}><option value="">All brands</option>{listingData.filters.brands.map((brand) => <option key={brand} value={brand}>{brand}</option>)}</select></div>
            <div className="filter-section"><h3>Price range</h3><div className="price-inputs"><input type="number" placeholder="Min" value={filters.minPrice} onChange={(event) => updateFilters({ minPrice: event.target.value })} /><input type="number" placeholder="Max" value={filters.maxPrice} onChange={(event) => updateFilters({ maxPrice: event.target.value })} /></div></div>
            <div className="filter-section"><h3>Ratings</h3><div className="filter-chip-list"><button type="button" className={!filters.rating ? "filter-chip active" : "filter-chip"} onClick={() => updateFilters({ rating: "" })}>All</button>{listingData.filters.ratings.map((rating) => <button key={rating} type="button" className={String(filters.rating) === String(rating) ? "filter-chip active" : "filter-chip"} onClick={() => updateFilters({ rating })}>{rating}+ stars</button>)}</div></div>
          </aside>
          <section className="listing-grid">{listingData.products.map((product) => <ProductCard key={product.slug} product={product} onNavigate={handleNavigate} onAddToCart={addToCart} onToggleWishlist={toggleWishlist} wishlisted={wishlist.includes(product.slug)} />)}</section>
        </div>
      </div>
    );
  }

  function renderDetail() {
    if (!detailData) return <LoadingCopy text="Loading product detail..." />;
    const { product, relatedProducts } = detailData;
    const image = product.images[activeImage] ?? product.images[0];
    return (
      <div className="page-shell detail-shell">
        <button type="button" className="ghost-link back-link" onClick={() => handleNavigate("/products")}>Back to products</button>
        <section className="detail-layout">
          <div className="gallery-column">
            <div className="gallery-thumbs">{product.images.map((item, index) => <button key={item} type="button" className={index === activeImage ? "thumb-button active" : "thumb-button"} onClick={() => setActiveImage(index)}><img src={item} alt={`${product.name} view ${index + 1}`} /></button>)}</div>
            <div className="detail-main-image"><img src={image} alt={product.name} /></div>
          </div>
          <div className="detail-copy">
            <p className="eyebrow-text">{product.category}</p>
            <h1>{product.name}</h1>
            <strong className="detail-brand">{product.brand}</strong>
            <div className="detail-rating"><span className="rating-pill"><Icon name="star" />{product.rating}</span><span>{product.reviewCount} verified reviews</span></div>
            <div className="detail-pricing"><strong>{product.priceFormatted}</strong><span>{product.originalPriceFormatted}</span><em>{product.discount}% off</em></div>
            <p className="detail-description">{product.description}</p>
            <div className="selection-block"><h3>Select size</h3><div className="size-grid">{product.sizes.map((size) => <button key={size} type="button" className={selectedSize === size ? "size-chip active" : "size-chip"} onClick={() => setSelectedSize(size)}>{size}</button>)}</div></div>
            <div className="selection-row"><div><h3>Quantity</h3><div className="quantity-stepper"><button type="button" onClick={() => setQuantity((current) => Math.max(1, current - 1))}><Icon name="minus" /></button><span>{quantity}</span><button type="button" onClick={() => setQuantity((current) => current + 1)}><Icon name="plus" /></button></div></div><div className="delivery-pill">{product.delivery}</div></div>
            <div className="detail-actions"><button type="button" className="primary-btn" onClick={() => addToCart(product, selectedSize, quantity)}>Add to Cart</button><button type="button" className="secondary-btn" onClick={() => addToCart(product, selectedSize, quantity)}>Buy Now</button></div>
            <div className="detail-panels">
              <article><h3>Why you will love it</h3><ul>{product.details.map((detail) => <li key={detail}>{detail}</li>)}</ul></article>
              <article><h3>Reviews</h3><div className="review-stack">{product.reviews.map((review) => <div key={`${review.author}-${review.title}`} className="review-card"><div className="review-head"><strong>{review.title}</strong><span>{review.rating}.0</span></div><p>{review.comment}</p><small>{review.author}</small></div>)}</div></article>
            </div>
          </div>
        </section>
        <section className="section-block">
          <div className="section-heading"><div><p className="eyebrow-text">Related styles</p><h2>More looks from the same mood board</h2></div></div>
          <div className="carousel-row">{relatedProducts.map((productItem) => <ProductCard key={productItem.slug} product={productItem} onNavigate={handleNavigate} onAddToCart={addToCart} onToggleWishlist={toggleWishlist} wishlisted={wishlist.includes(productItem.slug)} />)}</div>
        </section>
      </div>
    );
  }

  return (
    <div className="fashion-app">
      <Navbar categories={categories} searchValue={searchValue} onSearchChange={setSearchValue} onSearchSubmit={submitSearch} onNavigate={handleNavigate} onOpenPanel={setPanel} wishlistCount={wishlist.length} cartCount={cartCount} />
      <main className="app-main">{route.pathname === "/" ? renderHome() : isListingPage ? renderListing() : renderDetail()}</main>
      <Footer onNavigate={handleNavigate} />
      <Drawer panel={panel} cartItems={cartItems} wishlistItems={wishlistItems} cartTotal={cartTotal} onClose={() => setPanel(null)} onNavigate={handleNavigate} onRemoveCart={removeCart} onAdjustQty={adjustQty} />
    </div>
  );
}

export default App;
