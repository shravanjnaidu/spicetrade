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

// Ad form
const adForm = document.getElementById("adForm");
if (adForm) {
  adForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const fd = new FormData(adForm);
    const payload = {
      title: fd.get("title"),
      description: fd.get("description"),
    };
    const user = JSON.parse(localStorage.getItem("spicetrade_user") || "null");
    if (user && user.id) payload.userId = user.id;
    const res = await postJSON("/api/ads", payload);
    if (res && res.id) {
      adForm.reset();
      loadAds();
    } else {
      alert(res.error || "Could not post ad");
    }
  });
}

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
    const el = document.createElement("div");
    el.className = "ad";
    el.innerHTML = `<h3>${escapeHtml(a.title)}</h3><p>${escapeHtml(
      a.description
    )}</p><div style="display:flex;justify-content:space-between;align-items:center;margin-top:8px"><small>by ${escapeHtml(
      a.author || "anonymous"
    )}</small><small>${new Date(
      a.createdAt
    ).toLocaleDateString()}</small></div>`;
    list.appendChild(el);
  });
}

async function loadAds() {
  const list = document.getElementById("adsList");
  if (!list) return;
  list.innerHTML = "Loading...";
  try {
    const res = await fetch("/api/ads");
    const ads = await res.json();
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
  const right = document.querySelector(".header-right");
  const navFallback = document.querySelector(".site-header nav");
  const container = right || navFallback;
  if (!container) return;

  const user = JSON.parse(localStorage.getItem("spicetrade_user") || "null");
  if (user && user.id) {
    container.innerHTML = `\n      <nav>\n        <a href="/dashboard.html" class="btn" id="postAdBtn">Post an ad</a>\n        <span class="user">Welcome, ${escapeHtml(
      user.name || user.email
    )}</span>\n        <button id="signOutBtn" class="btn secondary">Sign out</button>\n      </nav>\n    `;
    const btn = document.getElementById("signOutBtn");
    if (btn)
      btn.addEventListener("click", () => {
        localStorage.removeItem("spicetrade_user");
        updateHeader();
        window.location.href = "/";
      });
  } else {
    container.innerHTML = `\n      <nav>\n        <a href="/login.html" class="btn">Sign in</a>\n        <a href="/signup.html" class="btn">Sign up</a>\n        <a href="/dashboard.html" class="btn secondary">View ads</a>\n      </nav>\n    `;
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
