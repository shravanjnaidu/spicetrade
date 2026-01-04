// Clean, single-file app.js for the site
// Minimal frontend logic for signup, login, ads
async function postJSON(url, data) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
}

// Signup form
const signupForm = document.getElementById("signupForm");
if (signupForm) {
  signupForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const fd = new FormData(signupForm);
    const payload = {
      name: fd.get("name"),
      email: fd.get("email"),
      password: fd.get("password"),
      role: fd.get("role") || null,
    };
    const res = await postJSON("/api/signup", payload);
    if (res && res.success) {
      localStorage.setItem(
        "spicetrade_user",
        JSON.stringify({
          id: res.userId,
          email: payload.email,
          name: payload.name,
        })
      );
      window.location.href = "/dashboard.html";
    } else {
      alert(res.error || "Signup failed");
    }
  });
}

// Ad form handler is in dashboard.html to include tags
// Removed from here to prevent duplicate submissions

// Enhanced Amazon-style search handler
const searchForm = document.getElementById("searchForm");
const searchInput = document.getElementById("q");
let searchTimeout = null;
let allAds = []; // Cache all ads for faster filtering

// Fetch all ads once for search
async function fetchAllAds() {
  try {
    const res = await fetch("/api/ads");
    allAds = await res.json();
  } catch (err) {
    console.error("Failed to fetch ads:", err);
    allAds = [];
  }
}

// Enhanced search function that searches across multiple fields
function performSearch(query) {
  const listingsTitle = document.getElementById("listingsTitle");
  const searchResultsContainer = document.getElementById("searchResultsContainer");
  const homeContent = document.getElementById("homeContent");
  const searchBreadcrumb = document.getElementById("searchBreadcrumb");
  
  if (!query || query.trim() === "") {
    // Show home content, hide search results
    if (searchResultsContainer) searchResultsContainer.style.display = "none";
    if (homeContent) homeContent.style.display = "block";
    renderAds(allAds);
    if (listingsTitle) {
      listingsTitle.textContent = "Latest Buyer Requirements";
    }
    return;
  }

  // Show search results, hide home content
  if (searchResultsContainer) searchResultsContainer.style.display = "block";
  if (homeContent) homeContent.style.display = "none";

  const q = query.toLowerCase().trim();
  const searchTerms = q.split(/\s+/); // Split by spaces for multi-word search

  const filtered = allAds.filter((ad) => {
    // Search in title
    const titleMatch = (ad.title || "").toLowerCase().includes(q);
    
    // Search in description
    const descMatch = (ad.description || "").toLowerCase().includes(q);
    
    // Search in tags
    const tagsMatch = ad.tags && ad.tags.some(tag => 
      tag.toLowerCase().includes(q)
    );
    
    // Search in category
    const categoryMatch = (ad.category || "").toLowerCase().includes(q);
    
    // Search in author/store name
    const authorMatch = (ad.author || "").toLowerCase().includes(q);
    
    // Multi-word search: check if all terms match at least one field
    const multiWordMatch = searchTerms.every(term => {
      const t = term.toLowerCase();
      return (
        (ad.title || "").toLowerCase().includes(t) ||
        (ad.description || "").toLowerCase().includes(t) ||
        (ad.category || "").toLowerCase().includes(t) ||
        (ad.author || "").toLowerCase().includes(t) ||
        (ad.tags && ad.tags.some(tag => tag.toLowerCase().includes(t)))
      );
    });

    return titleMatch || descMatch || tagsMatch || categoryMatch || authorMatch || multiWordMatch;
  });

  // Update breadcrumb
  if (searchBreadcrumb) {
    searchBreadcrumb.textContent = `Results for "${query}"`;
  }

  // Update results count
  const resultsCount = document.getElementById("resultsCount");
  if (resultsCount) {
    resultsCount.textContent = `${filtered.length} result${filtered.length !== 1 ? 's' : ''} for "${query}"`;
  }

  // Render Amazon-style results
  renderAmazonResults(filtered, query);
  
  // Build filters from results
  buildFilters(filtered);
}

// Render products in Amazon-style grid
function renderAmazonResults(products, query) {
  const grid = document.getElementById("searchResultsGrid");
  if (!grid) return;
  
  if (!products || products.length === 0) {
    grid.innerHTML = `
      <div class="amazon-empty-state">
        <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="#888" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
        <h3>No results found for "${escapeHtml(query)}"</h3>
        <p>Try checking your spelling or use more general terms</p>
        <button onclick="document.getElementById('q').value=''; document.getElementById('clearSearch').click();" class="apply-filter-btn">Clear Search</button>
      </div>
    `;
    return;
  }
  
  grid.innerHTML = "";
  products.forEach(product => {
    const card = document.createElement("div");
    card.className = "amazon-product-card";
    card.onclick = () => window.location.href = `/listing.html?id=${product.id}`;
    
    // Product image
    const img = document.createElement("img");
    img.className = "amazon-product-image";
    img.src = product.imageUrl || "https://via.placeholder.com/300x300?text=No+Image";
    img.alt = product.title || "Product";
    img.loading = "lazy";
    card.appendChild(img);
    
    // Product title
    const title = document.createElement("h3");
    title.className = "amazon-product-title";
    title.textContent = product.title || "Untitled";
    card.appendChild(title);
    
    // Rating (use real data from product)
    if (product.reviewCount > 0) {
      const rating = document.createElement("div");
      rating.className = "amazon-product-rating";
      
      const stars = document.createElement("div");
      stars.className = "amazon-stars";
      const numStars = Math.round(product.averageRating || 0);
      stars.innerHTML = "★".repeat(numStars) + "☆".repeat(5 - numStars);
      
      const count = document.createElement("span");
      count.className = "amazon-rating-count";
      count.textContent = product.reviewCount;
      
      rating.appendChild(stars);
      rating.appendChild(count);
      card.appendChild(rating);
    }
    
    // Price
    if (product.price) {
      const price = document.createElement("div");
      price.className = "amazon-product-price";
      price.innerHTML = `<span class="amazon-product-price-small">$</span>${parseFloat(product.price).toFixed(2)}`;
      card.appendChild(price);
    }
    
    // Tags
    if (product.tags && product.tags.length > 0) {
      const tagsDiv = document.createElement("div");
      tagsDiv.className = "amazon-product-tags";
      product.tags.slice(0, 3).forEach(tag => {
        const tagSpan = document.createElement("span");
        tagSpan.className = "amazon-product-tag";
        tagSpan.textContent = tag;
        tagsDiv.appendChild(tagSpan);
      });
      card.appendChild(tagsDiv);
    }
    
    // Store name
    if (product.author) {
      const store = document.createElement("div");
      store.className = "amazon-product-store";
      store.textContent = `by ${product.author}`;
      card.appendChild(store);
    }
    
    grid.appendChild(card);
  });
}

// Build dynamic filters from search results
function buildFilters(products) {
  // Category filters
  const categories = {};
  const tags = {};
  const stores = {};
  
  products.forEach(p => {
    if (p.category) {
      categories[p.category] = (categories[p.category] || 0) + 1;
    }
    if (p.tags) {
      p.tags.forEach(tag => {
        tags[tag] = (tags[tag] || 0) + 1;
      });
    }
    if (p.author) {
      stores[p.author] = (stores[p.author] || 0) + 1;
    }
  });
  
  // Render category filters
  const categoryFilters = document.getElementById("categoryFilters");
  if (categoryFilters) {
    categoryFilters.innerHTML = Object.entries(categories)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([cat, count]) => `
        <label>
          <input type="checkbox" class="category-filter" value="${escapeHtml(cat)}">
          <span>${escapeHtml(cat)}</span>
          <span class="count">(${count})</span>
        </label>
      `).join('');
    
    // Add event listeners
    categoryFilters.querySelectorAll('input').forEach(input => {
      input.addEventListener('change', applyFilters);
    });
  }
  
  // Render tags filters
  const tagsFilters = document.getElementById("tagsFilters");
  if (tagsFilters) {
    tagsFilters.innerHTML = Object.entries(tags)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15)
      .map(([tag, count]) => `
        <label>
          <input type="checkbox" class="tag-filter" value="${escapeHtml(tag)}">
          <span>${escapeHtml(tag)}</span>
          <span class="count">(${count})</span>
        </label>
      `).join('');
    
    tagsFilters.querySelectorAll('input').forEach(input => {
      input.addEventListener('change', applyFilters);
    });
  }
  
  // Render store filters
  const storesFilters = document.getElementById("storesFilters");
  if (storesFilters) {
    storesFilters.innerHTML = Object.entries(stores)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([store, count]) => `
        <label>
          <input type="checkbox" class="store-filter" value="${escapeHtml(store)}">
          <span>${escapeHtml(store)}</span>
          <span class="count">(${count})</span>
        </label>
      `).join('');
    
    storesFilters.querySelectorAll('input').forEach(input => {
      input.addEventListener('change', applyFilters);
    });
  }
}

// Apply filters to search results
let currentFilteredResults = [];

function applyFilters() {
  const query = document.getElementById("q").value.trim();
  
  // Get base filtered results
  const q = query.toLowerCase().trim();
  const searchTerms = q.split(/\s+/);
  
  let filtered = allAds.filter((ad) => {
    const titleMatch = (ad.title || "").toLowerCase().includes(q);
    const descMatch = (ad.description || "").toLowerCase().includes(q);
    const tagsMatch = ad.tags && ad.tags.some(tag => tag.toLowerCase().includes(q));
    const categoryMatch = (ad.category || "").toLowerCase().includes(q);
    const authorMatch = (ad.author || "").toLowerCase().includes(q);
    const multiWordMatch = searchTerms.every(term => {
      const t = term.toLowerCase();
      return (
        (ad.title || "").toLowerCase().includes(t) ||
        (ad.description || "").toLowerCase().includes(t) ||
        (ad.category || "").toLowerCase().includes(t) ||
        (ad.author || "").toLowerCase().includes(t) ||
        (ad.tags && ad.tags.some(tag => tag.toLowerCase().includes(t)))
      );
    });
    return titleMatch || descMatch || tagsMatch || categoryMatch || authorMatch || multiWordMatch;
  });
  
  // Apply category filters
  const selectedCategories = Array.from(document.querySelectorAll('.category-filter:checked')).map(cb => cb.value);
  if (selectedCategories.length > 0) {
    filtered = filtered.filter(ad => selectedCategories.includes(ad.category));
  }
  
  // Apply tag filters
  const selectedTags = Array.from(document.querySelectorAll('.tag-filter:checked')).map(cb => cb.value);
  if (selectedTags.length > 0) {
    filtered = filtered.filter(ad => ad.tags && ad.tags.some(tag => selectedTags.includes(tag)));
  }
  
  // Apply store filters
  const selectedStores = Array.from(document.querySelectorAll('.store-filter:checked')).map(cb => cb.value);
  if (selectedStores.length > 0) {
    filtered = filtered.filter(ad => selectedStores.includes(ad.author));
  }
  
  // Apply price filter
  const minPrice = parseFloat(document.getElementById("minPrice")?.value);
  const maxPrice = parseFloat(document.getElementById("maxPrice")?.value);
  if (!isNaN(minPrice) && minPrice >= 0) {
    filtered = filtered.filter(ad => ad.price && parseFloat(ad.price) >= minPrice);
  }
  if (!isNaN(maxPrice) && maxPrice >= 0) {
    filtered = filtered.filter(ad => ad.price && parseFloat(ad.price) <= maxPrice);
  }
  
  currentFilteredResults = filtered;
  
  // Update results count
  const resultsCount = document.getElementById("resultsCount");
  if (resultsCount) {
    resultsCount.textContent = `${filtered.length} result${filtered.length !== 1 ? 's' : ''}`;
  }
  
  // Apply sorting
  const sortSelect = document.getElementById("sortSelect");
  if (sortSelect) {
    applySorting(filtered, sortSelect.value);
  } else {
    renderAmazonResults(filtered, query);
  }
}

// Apply sorting
function applySorting(products, sortBy) {
  let sorted = [...products];
  
  switch(sortBy) {
    case 'price-low':
      sorted.sort((a, b) => (parseFloat(a.price) || 0) - (parseFloat(b.price) || 0));
      break;
    case 'price-high':
      sorted.sort((a, b) => (parseFloat(b.price) || 0) - (parseFloat(a.price) || 0));
      break;
    case 'newest':
      sorted.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      break;
    case 'rating':
      sorted.sort((a, b) => (b.rating || 0) - (a.rating || 0));
      break;
    default: // featured
      // Keep original order
      break;
  }
  
  const query = document.getElementById("q").value.trim();
  renderAmazonResults(sorted, query);
}

// Search form submit handler
if (searchForm) {
  searchForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const query = searchInput.value.trim();
    
    // Hide suggestions when submitting
    hideSuggestions();
    
    if (!query) {
      // If empty, show home content
      const searchResultsContainer = document.getElementById("searchResultsContainer");
      const homeContent = document.getElementById("homeContent");
      if (searchResultsContainer) searchResultsContainer.style.display = "none";
      if (homeContent) homeContent.style.display = "block";
      return;
    }
    
    if (allAds.length === 0) {
      await fetchAllAds();
    }
    
    performSearch(query);
  });
}

// Real-time search as you type (like Amazon)
let selectedSuggestionIndex = -1;

if (searchInput) {
  // Fetch ads when page loads
  fetchAllAds();
  
  const clearBtn = document.getElementById("clearSearch");
  const suggestionsDropdown = document.getElementById("searchSuggestions");
  
  searchInput.addEventListener("input", (e) => {
    const query = e.target.value.trim();
    
    // Show/hide clear button
    if (clearBtn) {
      clearBtn.style.display = query ? "flex" : "none";
    }
    
    // Show autocomplete suggestions
    if (query && query.length >= 2) {
      showSearchSuggestions(query);
    } else {
      hideSuggestions();
    }
    
    // Don't auto-search anymore - only on Enter or selection
    selectedSuggestionIndex = -1;
  });
  
  // Handle keyboard navigation in suggestions
  searchInput.addEventListener("keydown", (e) => {
    if (!suggestionsDropdown || suggestionsDropdown.style.display === "none") {
      return;
    }
    
    const suggestions = suggestionsDropdown.querySelectorAll(".search-suggestion-item");
    
    if (e.key === "ArrowDown") {
      e.preventDefault();
      selectedSuggestionIndex = Math.min(selectedSuggestionIndex + 1, suggestions.length - 1);
      updateSuggestionHighlight(suggestions);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      selectedSuggestionIndex = Math.max(selectedSuggestionIndex - 1, -1);
      updateSuggestionHighlight(suggestions);
    } else if (e.key === "Enter" && selectedSuggestionIndex >= 0) {
      e.preventDefault();
      suggestions[selectedSuggestionIndex].click();
    } else if (e.key === "Escape") {
      hideSuggestions();
    }
  });
  
  // Clear search button functionality
  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      searchInput.value = "";
      clearBtn.style.display = "none";
      hideSuggestions();
      
      // Show home content
      const searchResultsContainer = document.getElementById("searchResultsContainer");
      const homeContent = document.getElementById("homeContent");
      if (searchResultsContainer) searchResultsContainer.style.display = "none";
      if (homeContent) homeContent.style.display = "block";
      
      searchInput.focus();
    });
  }
  
  // Clear on Escape key
  searchInput.addEventListener("keyup", (e) => {
    if (e.key === "Escape" && !suggestionsDropdown?.style.display !== "none") {
      searchInput.value = "";
      if (clearBtn) clearBtn.style.display = "none";
      hideSuggestions();
      
      const searchResultsContainer = document.getElementById("searchResultsContainer");
      const homeContent = document.getElementById("homeContent");
      if (searchResultsContainer) searchResultsContainer.style.display = "none";
      if (homeContent) homeContent.style.display = "block";
    }
  });
  
  // Close suggestions when clicking outside
  document.addEventListener("click", (e) => {
    if (!searchInput.contains(e.target) && !suggestionsDropdown?.contains(e.target)) {
      hideSuggestions();
    }
  });
}

// Show search suggestions dropdown
function showSearchSuggestions(query) {
  if (allAds.length === 0) return;
  
  const suggestionsDropdown = document.getElementById("searchSuggestions");
  if (!suggestionsDropdown) return;
  
  const q = query.toLowerCase().trim();
  
  // Find matching products
  const matches = allAds.filter((ad) => {
    const titleMatch = (ad.title || "").toLowerCase().includes(q);
    const descMatch = (ad.description || "").toLowerCase().includes(q);
    const tagsMatch = ad.tags && ad.tags.some(tag => tag.toLowerCase().includes(q));
    const categoryMatch = (ad.category || "").toLowerCase().includes(q);
    const authorMatch = (ad.author || "").toLowerCase().includes(q);
    
    return titleMatch || descMatch || tagsMatch || categoryMatch || authorMatch;
  }).slice(0, 8); // Show max 8 suggestions
  
  if (matches.length === 0) {
    suggestionsDropdown.innerHTML = '<div class="search-no-suggestions">No matching products found</div>';
    suggestionsDropdown.style.display = "block";
    return;
  }
  
  suggestionsDropdown.innerHTML = '<div class="search-suggestions-header">Suggested Products</div>';
  
  matches.forEach((product, index) => {
    const item = document.createElement("div");
    item.className = "search-suggestion-item";
    item.dataset.index = index;
    
    // Product image
    if (product.imageUrl) {
      const img = document.createElement("img");
      img.className = "search-suggestion-image";
      img.src = product.imageUrl;
      img.alt = product.title || "Product";
      img.loading = "lazy";
      item.appendChild(img);
    } else {
      const placeholder = document.createElement("div");
      placeholder.className = "search-suggestion-image";
      placeholder.style.background = "#f0f0f0";
      placeholder.style.display = "flex";
      placeholder.style.alignItems = "center";
      placeholder.style.justifyContent = "center";
      placeholder.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ccc" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>';
      item.appendChild(placeholder);
    }
    
    // Product info
    const content = document.createElement("div");
    content.className = "search-suggestion-content";
    
    const title = document.createElement("div");
    title.className = "search-suggestion-title";
    title.textContent = product.title || "Untitled";
    content.appendChild(title);
    
    const meta = document.createElement("div");
    meta.className = "search-suggestion-meta";
    
    if (product.price) {
      const price = document.createElement("span");
      price.className = "search-suggestion-price";
      price.textContent = `$${parseFloat(product.price).toFixed(2)}`;
      meta.appendChild(price);
    }
    
    if (product.category) {
      const category = document.createElement("span");
      category.className = "search-suggestion-category";
      category.textContent = product.category;
      meta.appendChild(category);
    }
    
    content.appendChild(meta);
    item.appendChild(content);
    
    // Icon
    const icon = document.createElement("div");
    icon.className = "search-suggestion-icon";
    icon.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>';
    item.appendChild(icon);
    
    // Click handler
    item.addEventListener("click", () => {
      searchInput.value = product.title;
      hideSuggestions();
      performSearch(product.title);
    });
    
    suggestionsDropdown.appendChild(item);
  });
  
  suggestionsDropdown.style.display = "block";
  selectedSuggestionIndex = -1;
}

// Hide suggestions dropdown
function hideSuggestions() {
  const suggestionsDropdown = document.getElementById("searchSuggestions");
  if (suggestionsDropdown) {
    suggestionsDropdown.style.display = "none";
  }
  selectedSuggestionIndex = -1;
}

// Update suggestion highlight for keyboard navigation
function updateSuggestionHighlight(suggestions) {
  suggestions.forEach((item, index) => {
    if (index === selectedSuggestionIndex) {
      item.classList.add("active");
      item.scrollIntoView({ block: "nearest" });
    } else {
      item.classList.remove("active");
    }
  });
}

function renderAds(ads) {
  const list = document.getElementById("adsList");
  if (!list) return;
  if (!ads || !ads.length) {
    list.innerHTML = "<p>No listings</p>";
    return;
  }
  list.innerHTML = "";
  ads.forEach((a) => {
    const el = document.createElement("article");
    el.className = "ad";
    el.style.cursor = "pointer";
    el.addEventListener("click", () => {
      window.location.href = `/listing.html?id=${a.id}`;
    });

    if (a.imageUrl) {
      const img = document.createElement("img");
      img.className = "ad-image";
      img.src = a.imageUrl;
      img.alt = a.title || "ad image";
      img.loading = "lazy";
      el.appendChild(img);
    }

    const body = document.createElement("div");
    body.className = "ad-body";

    const h3 = document.createElement("h3");
    h3.textContent = a.title || "";
    body.appendChild(h3);

    const p = document.createElement("p");
    p.textContent = a.description || "";
    body.appendChild(p);

    // Add tags display
    if (a.tags && a.tags.length > 0) {
      const tagsDiv = document.createElement("div");
      tagsDiv.style.cssText =
        "display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px;";
      a.tags.forEach((tag) => {
        const tagSpan = document.createElement("span");
        tagSpan.style.cssText =
          "background: #f0f0f0; padding: 4px 8px; border-radius: 3px; font-size: 12px; color: #555; text-transform: lowercase;";
        tagSpan.textContent = tag;
        tagsDiv.appendChild(tagSpan);
      });
      body.appendChild(tagsDiv);
    }

    const meta = document.createElement("div");
    meta.style.display = "flex";
    meta.style.justifyContent = "space-between";
    meta.style.alignItems = "center";
    meta.style.marginTop = "8px";

    const authorWrapper = document.createElement("div");
    authorWrapper.style.display = "flex";
    authorWrapper.style.alignItems = "center";
    authorWrapper.style.gap = "8px";

    // Add profile picture if available
    if (a.profilePicture) {
      const profileImg = document.createElement("img");
      profileImg.src = a.profilePicture;
      profileImg.style.cssText =
        "width: 24px; height: 24px; border-radius: 50%; object-fit: cover;";
      profileImg.alt = a.author || "User";
      authorWrapper.appendChild(profileImg);
    } else {
      // Show initial letter as fallback
      const initial = document.createElement("div");
      initial.textContent = (a.author || "A").charAt(0).toUpperCase();
      initial.style.cssText =
        "width: 24px; height: 24px; border-radius: 50%; background: var(--accent); color: white; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 600;";
      authorWrapper.appendChild(initial);
    }

    const author = document.createElement("small");
    author.textContent = a.author || "anonymous";
    authorWrapper.appendChild(author);

    meta.appendChild(authorWrapper);

    const date = document.createElement("small");
    date.textContent = a.createdAt
      ? new Date(a.createdAt).toLocaleDateString()
      : "";
    meta.appendChild(date);

    body.appendChild(meta);
    el.appendChild(body);

    list.appendChild(el);
  });
}

async function loadAds() {
  const list = document.getElementById("adsList");
  if (!list) return;
  list.innerHTML = "Loading...";
  try {
    const res = await fetch("/api/ads");
    let ads = await res.json();

    // Filter ads by current user if on dashboard page
    if (window.location.pathname.includes("/dashboard.html")) {
      const user = JSON.parse(
        localStorage.getItem("spicetrade_user") || "null"
      );
      if (user && user.id) {
        ads = ads.filter((ad) => ad.userId === user.id);
      }
    }
    // On home page, show only buyer requirements (not seller products)
    else if (
      window.location.pathname === "/" ||
      window.location.pathname === "/index.html"
    ) {
      ads = ads.filter((ad) => ad.role === "buyer" || (!ad.role && !ad.price));
    }

    renderAds(ads);
  } catch (err) {
    list.innerHTML = "<p>Error loading ads</p>";
  }
}

function escapeHtml(s) {
  if (!s) return "";
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

// --- signup modal logic -------------------------------------------------
function showSignupModal() {
  const modal = document.getElementById("signupModal");
  if (!modal) return;
  modal.classList.add("open");
}
function hideSignupModal() {
  const modal = document.getElementById("signupModal");
  if (!modal) return;
  modal.classList.remove("open");
}

// Use delegated click handling so dynamically-inserted "Sign up" links
// (for example those added by updateHeader) are intercepted.
document.addEventListener("click", (e) => {
  // If user clicked an anchor that points to /signup.html on the landing page,
  // open the modal instead of navigating. This handles anchors inserted later.
  const anchor = e.target.closest('a[href="/signup.html"], a.signup-link');
  if (anchor) {
    if (location.pathname === "/" || location.pathname.endsWith("index.html")) {
      e.preventDefault();
      showSignupModal();
      return;
    }
    // otherwise allow normal navigation
  }

  // If user clicked a modal option (buyer/seller), navigate to signup with role
  const opt = e.target.closest("[data-signup-role]");
  if (opt) {
    const role = opt.getAttribute("data-signup-role");
    window.location.href = "/signup.html?role=" + encodeURIComponent(role);
    return;
  }

  // clicking the close button or backdrop closes the modal
  if (
    e.target.closest("#signupModal .close") ||
    e.target.id === "signupModal"
  ) {
    hideSignupModal();
  }
});

// Update header nav based on login state and handle sign-out
function updateHeader() {
  // Skip header update on admin pages
  if (window.location.pathname.includes("/admin")) return;

  const right = document.querySelector(".header-right");
  const navFallback = document.querySelector(".site-header nav");
  const container = right || navFallback;
  if (!container) return;

  const user = JSON.parse(localStorage.getItem("spicetrade_user") || "null");
  if (user && user.id) {
    // Show different navigation for sellers
    const isSeller = user.role === "seller";
    const dashboardLink = isSeller
      ? "/seller-dashboard.html"
      : "/dashboard.html";
    const dashboardLabel = isSeller ? "Manage Store" : "Post a requirement";

    // Build dropdown menu items based on role
    let dropdownItems = "";
    if (isSeller) {
      dropdownItems = `
        <a href="/seller-dashboard.html" class="dropdown-item">Manage Store</a>
        <a href="/messages.html" class="dropdown-item">Messages <span id="messagesBadge" class="notification-badge"></span></a>
        <a href="/profile.html" class="dropdown-item">Profile</a>
        <a href="#" class="dropdown-item" id="signOutBtn">Sign out</a>
      `;
    } else {
      dropdownItems = `
        <a href="/dashboard.html" class="dropdown-item">My Listings</a>
        <a href="/wishlist.html" class="dropdown-item">My Wishlist</a>
        <a href="/messages.html" class="dropdown-item">Messages <span id="messagesBadge" class="notification-badge"></span></a>
        <a href="/profile.html" class="dropdown-item">Profile</a>
        <a href="#" class="dropdown-item" id="signOutBtn">Sign out</a>
      `;
    }

    container.innerHTML = `
      <nav>
        <a href="${dashboardLink}" class="btn">${dashboardLabel}</a>
        <div class="user-dropdown">
          <span class="user">
            <span class="user-notification-icon" id="userNotificationIcon" style="display: none;">
              <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                <circle cx="4" cy="4" r="4" fill="#ff4444"/>
              </svg>
            </span>
            Welcome, ${escapeHtml(user.name || user.email)}
          </span>
          <div class="dropdown-menu">
            ${dropdownItems}
          </div>
        </div>
      </nav>
    `;
    const btn = document.getElementById("signOutBtn");
    if (btn)
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        localStorage.removeItem("spicetrade_user");
        updateHeader();
        window.location.href = "/";
      });
  } else {
    container.innerHTML = `
      <nav>
        <a href="/login.html" class="btn">Sign in</a>
        <a href="/signup.html" class="btn">Sign up</a>
        <!-- <a href="/dashboard.html" class="btn secondary">View ads</a> -->
      </nav>
    `;
  }
}

updateHeader();

// Fetch and update unread message count
async function updateMessageNotification() {
  const user = JSON.parse(localStorage.getItem("spicetrade_user") || "null");
  if (!user) return;

  try {
    const response = await fetch(`/api/messages/unread/${user.id}`);
    const data = await response.json();

    if (data.unreadCount > 0) {
      const badge = document.getElementById("messagesBadge");
      if (badge) {
        badge.textContent = data.unreadCount;
        badge.style.display = "inline-block";
      }

      // Show notification icon on user welcome text
      const userIcon = document.getElementById("userNotificationIcon");
      if (userIcon) {
        userIcon.style.display = "inline-block";
      }
    } else {
      // Hide notification icon when no unread messages
      const userIcon = document.getElementById("userNotificationIcon");
      if (userIcon) {
        userIcon.style.display = "none";
      }
    }
  } catch (error) {
    console.error("Failed to fetch unread count:", error);
  }
}

// Check for new messages every 10 seconds
updateMessageNotification();
setInterval(updateMessageNotification, 10000);

function filterByCategory(cat) {
  const qInput = document.getElementById("q");
  if (qInput) qInput.value = cat;
  const list = document.getElementById("adsList");
  if (list) list.innerHTML = "Loading...";
  fetch("/api/ads")
    .then((r) => r.json())
    .then((ads) => {
      const keyword = (cat || "").toLowerCase();
      const filtered = ads.filter(
        (a) =>
          (a.title || "").toLowerCase().includes(keyword) ||
          (a.description || "").toLowerCase().includes(keyword)
      );
      renderAds(filtered);
      document
        .querySelectorAll(".sub-header .cat, .header-tags .cat")
        .forEach((el) => {
          el.classList.toggle("active", el.textContent.trim() === cat);
        });
    })
    .catch(() => {
      if (list) list.innerHTML = "<p>Error loading ads</p>";
    });
}

document
  .querySelectorAll(".sub-header .cat, .header-tags .cat")
  .forEach((el) => {
    el.addEventListener("click", (e) => {
      e.preventDefault();
      const cat = el.textContent.trim();
      filterByCategory(cat);
    });
  });

// Amazon-style filter controls
const sortSelect = document.getElementById("sortSelect");
if (sortSelect) {
  sortSelect.addEventListener("change", (e) => {
    const query = document.getElementById("q")?.value.trim();
    if (query && currentFilteredResults.length > 0) {
      applySorting(currentFilteredResults, e.target.value);
    }
  });
}

const applyPriceBtn = document.getElementById("applyPriceFilter");
if (applyPriceBtn) {
  applyPriceBtn.addEventListener("click", applyFilters);
}

const clearFiltersBtn = document.getElementById("clearFilters");
if (clearFiltersBtn) {
  clearFiltersBtn.addEventListener("click", () => {
    // Clear all checkboxes
    document.querySelectorAll('.category-filter, .tag-filter, .store-filter').forEach(cb => {
      cb.checked = false;
    });
    
    // Clear price inputs
    const minPrice = document.getElementById("minPrice");
    const maxPrice = document.getElementById("maxPrice");
    if (minPrice) minPrice.value = "";
    if (maxPrice) maxPrice.value = "";
    
    // Re-apply search without filters
    const query = document.getElementById("q")?.value.trim();
    if (query) {
      performSearch(query);
    }
  });
}

// init
loadAds();
