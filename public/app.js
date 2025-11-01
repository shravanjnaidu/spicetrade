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
      alert("Account created — you can now post ads on the dashboard");
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

// replace earlier loadAds function to use renderAds
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

// Update header nav based on login state and handle sign-out
function updateHeader() {
  // prefer the right-side header if available, else fallback to header nav
  const right = document.querySelector('.header-right');
  const navFallback = document.querySelector('.site-header nav');
  const container = right || navFallback;
  if (!container) return;

  const user = JSON.parse(localStorage.getItem('spicetrade_user') || 'null');
  if (user && user.id) {
    // place post ad + welcome + sign out in the chosen container
    container.innerHTML = `\n      <nav>\n        <a href="/dashboard.html" class="btn" id="postAdBtn">Post an ad</a>\n        <span class="user">Welcome, ${escapeHtml(user.name || user.email)}</span>\n        <button id="signOutBtn" class="btn secondary">Sign out</button>\n      </nav>\n    `;

    // attach handler after inserting
    const btn = document.getElementById('signOutBtn');
    if (btn)
      btn.addEventListener('click', () => {
        localStorage.removeItem('spicetrade_user');
        updateHeader();
        window.location.href = '/';
      });
  } else {
    // show sign in / sign up when logged out
    container.innerHTML = `\n      <nav>\n        <a href="/login.html" class="btn">Sign in</a>\n        <a href="/signup.html" class="btn">Sign up</a>\n        <a href="/dashboard.html" class="btn secondary">View ads</a>\n      </nav>\n    `;
  }
}

// initialize header state
updateHeader();

// Category filter: clicking a .cat tag filters listings by keyword
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
      // mark active tag
      document
        .querySelectorAll(".sub-header .cat, .header-tags .cat")
        .forEach((el) => {
          el.classList.toggle("active", el.textContent.trim() === cat);
        });
    })
    .catch((err) => {
      if (list) list.innerHTML = "<p>Error loading ads</p>";
    });
}

// attach handlers to category tags (works whether tags are in .sub-header or .header-tags)
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
