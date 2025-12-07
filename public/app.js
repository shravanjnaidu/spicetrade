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

// Search handler (on index page)
const searchForm = document.getElementById("searchForm");
if (searchForm) {
  searchForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const q = document.getElementById("q").value.trim().toLowerCase();
    const res = await fetch("/api/ads");
    const ads = await res.json();
    const filtered = ads.filter(
      (a) =>
        (a.title || "").toLowerCase().includes(q) ||
        (a.description || "").toLowerCase().includes(q)
    );
    renderAds(filtered);
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
        <a href="/dashboard.html" class="dropdown-item">Manage Listings</a>
        <a href="/messages.html" class="dropdown-item">Messages</a>
        <a href="/profile.html" class="dropdown-item">Profile</a>
        <a href="#" class="dropdown-item" id="signOutBtn">Sign out</a>
      `;
    } else {
      dropdownItems = `
        <a href="/dashboard.html" class="dropdown-item">My Listings</a>
        <a href="/messages.html" class="dropdown-item">Messages</a>
        <a href="/profile.html" class="dropdown-item">Profile</a>
        <a href="#" class="dropdown-item" id="signOutBtn">Sign out</a>
      `;
    }

    container.innerHTML = `
      <nav>
        <a href="${dashboardLink}" class="btn">${dashboardLabel}</a>
        <div class="user-dropdown">
          <span class="user">Welcome, ${escapeHtml(
            user.name || user.email
          )}</span>
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

// init
loadAds();
