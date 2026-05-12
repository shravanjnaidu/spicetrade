/**
 * public/js/home-mobile.js
 * ────────────────────────
 * Homepage initialisation for the mobile layout.
 * - Products (non-requirements) → paginated #listingsGrid
 * - Requirements                → #requirementsList (matches desktop behaviour)
 * - Stores                      → horizontal #storesRow
 * - Banner ads                  → #mobileBannerCarousel
 */

(function () {
  "use strict";

  var PAGE_SIZE = window.__MOBILE_PAGE_SIZE__ || 12;

  var _products = [];
  var _page = 0;

  var listingsGrid = document.getElementById("listingsGrid");
  var reqList = document.getElementById("requirementsList");
  var storesRow = document.getElementById("storesRow");
  var loadMoreBtn = document.getElementById("loadMoreBtn");
  var bannerSection = document.getElementById("mobileBannerSection");
  var bannerCarousel = document.getElementById("mobileBannerCarousel");

  // ── Helpers ──────────────────────────────────────────────────────────────────

  function esc(str) {
    return String(str || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function formatPrice(price, unit) {
    if (price == null) return "Contact";
    return (
      "₹" +
      Number(price).toLocaleString("en-IN") +
      (unit ? "/" + esc(unit) : "")
    );
  }

  function isRequirement(ad) {
    var lt = ad.listingType;
    var ltUnset = lt == null || lt === "";
    return (
      lt === "requirement" ||
      (ltUnset && (ad.role === "buyer" || (!ad.role && !ad.price)))
    );
  }

  function renderStars(avg, count) {
    if (!count || count === 0)
      return '<span class="card-no-reviews">No reviews</span>';
    var full = Math.floor(avg);
    var half = avg - full >= 0.5 ? 1 : 0;
    var empty = 5 - full - half;
    var stars =
      '<span class="card-stars-filled">' +
      "★".repeat(full) +
      "</span>" +
      (half ? '<span class="card-stars-half">★</span>' : "") +
      '<span class="card-stars-empty">' +
      "☆".repeat(empty) +
      "</span>";
    return (
      '<div class="card-rating">' +
      stars +
      '<span class="card-rating-count">(' +
      count +
      ")</span>" +
      "</div>"
    );
  }

  // ── Products grid ─────────────────────────────────────────────────────────────

  // Cache: adId → { avg, count }
  var _ratingCache = {};

  function renderPage() {
    if (!listingsGrid || _products.length === 0) return;

    var start = _page * PAGE_SIZE;
    var slice = _products.slice(start, start + PAGE_SIZE);

    if (_page === 0) listingsGrid.innerHTML = "";

    slice.forEach(function (ad) {
      var imgSrc = ad.imageUrl || "";
      var imgTag = imgSrc
        ? '<img src="' +
          esc(imgSrc) +
          '" alt="' +
          esc(ad.title) +
          '" loading="lazy" />'
        : '<div style="width:100%;aspect-ratio:1;background:#f5f5f5;display:flex;align-items:center;justify-content:center;font-size:2rem">📦</div>';

      var rStats = _ratingCache[ad.id] || {};
      var ratingHtml = renderStars(rStats.avg || 0, rStats.count || 0);
      var sellerName = ad.storeName || ad.author || "";

      var card = document.createElement("a");
      card.className = "listing-card";
      card.href = "/listing/" + encodeURIComponent(ad.id);
      card.innerHTML =
        imgTag +
        '<div class="listing-card-body">' +
        '<div class="listing-card-title">' +
        esc(ad.title) +
        "</div>" +
        ratingHtml +
        '<div class="listing-card-price">' +
        formatPrice(ad.price, ad.unit) +
        "</div>" +
        (sellerName
          ? '<div class="listing-card-seller">' + esc(sellerName) + "</div>"
          : "") +
        "</div>";
      listingsGrid.appendChild(card);
    });

    _page++;
    if (loadMoreBtn) {
      loadMoreBtn.style.display =
        _page * PAGE_SIZE >= _products.length ? "none" : "";
    }
  }

  // ── Requirements list ──────────────────────────────────────────────────────────

  function renderRequirements(reqs) {
    if (!reqList) return;
    if (!reqs || reqs.length === 0) {
      reqList.innerHTML =
        '<div class="req-empty-state"><p class="req-empty-msg">No buyer requirements posted yet.</p></div>';
      return;
    }
    reqList.innerHTML = reqs
      .slice(0, 8)
      .map(function (ad) {
        var timeAgo = ad.createdAt
          ? new Date(ad.createdAt).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
            })
          : "";
        return (
          '<a class="req-card" href="/listing/' +
          esc(ad.id) +
          '">' +
          '<div class="req-card-title">' +
          esc(ad.title) +
          "</div>" +
          '<div class="req-card-meta">' +
          (ad.category
            ? '<span class="req-tag">' + esc(ad.category) + "</span>"
            : "") +
          (ad.quantity
            ? '<span class="req-tag req-tag-qty">Qty: ' +
              esc(String(ad.quantity)) +
              (ad.unit ? " " + esc(ad.unit) : "") +
              "</span>"
            : "") +
          (ad.author || ad.storeName
            ? '<span class="req-author">' +
              esc(ad.storeName || ad.author) +
              "</span>"
            : "") +
          (timeAgo ? '<span class="req-date">' + timeAgo + "</span>" : "") +
          "</div>" +
          "</a>"
        );
      })
      .join("");
  }

  // ── Single API fetch, split into products + requirements ───────────────────────

  function loadAds() {
    fetch("/api/ads")
      .then(function (r) {
        return r.json();
      })
      .then(function (ads) {
        var reqs = [];
        ads.forEach(function (ad) {
          if (isRequirement(ad)) reqs.push(ad);
          else _products.push(ad);
        });

        if (_products.length === 0 && listingsGrid) {
          listingsGrid.innerHTML =
            '<p style="padding:16px;grid-column:1/-1;text-align:center;color:#888">No listings yet.</p>';
          if (loadMoreBtn) loadMoreBtn.style.display = "none";
          renderRequirements(reqs);
          return;
        }

        // Fetch review stats for all products in parallel, then render
        var statsFetches = _products.map(function (ad) {
          return fetch("/api/reviews/stats/" + ad.id)
            .then(function (r) {
              return r.json();
            })
            .then(function (s) {
              if (s && s.totalReviews) {
                _ratingCache[ad.id] = {
                  avg: s.averageRating,
                  count: s.totalReviews,
                };
              }
            })
            .catch(function () {}); // ignore per-product errors
        });

        Promise.all(statsFetches).then(function () {
          renderPage();
        });

        renderRequirements(reqs);
      })
      .catch(function (err) {
        console.error("[home-mobile] ads error", err);
        if (listingsGrid)
          listingsGrid.innerHTML =
            '<p style="padding:16px;grid-column:1/-1;color:#888">Could not load listings.</p>';
        if (reqList) reqList.innerHTML = "";
      });
  }

  if (loadMoreBtn) {
    loadMoreBtn.addEventListener("click", renderPage);
  }

  // ── Stores ───────────────────────────────────────────────────────────────────

  function renderStores(stores) {
    if (!storesRow) return;
    if (!stores || stores.length === 0) {
      storesRow.innerHTML = "";
      return;
    }

    storesRow.innerHTML = stores
      .slice(0, 8)
      .map(function (s) {
        var logo = s.logo
          ? '<img src="' +
            esc(s.logo) +
            '" alt="' +
            esc(s.storeName || s.name) +
            '" loading="lazy" style="width:56px;height:56px;border-radius:50%;object-fit:cover;margin:0 auto 8px;display:block" />'
          : '<div style="width:56px;height:56px;border-radius:50%;background:#f0f0f0;margin:0 auto 8px"></div>';
        return (
          '<a class="store-card" href="/store-profile.html?id=' +
          esc(s.id) +
          '">' +
          logo +
          '<div class="store-card-name" style="font-size:.75rem;text-align:center;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' +
          esc(s.storeName || s.name) +
          "</div>" +
          "</a>"
        );
      })
      .join("");
  }

  function loadStores() {
    fetch("/api/stores")
      .then(function (r) {
        return r.json();
      })
      .then(renderStores)
      .catch(function (err) {
        console.error("[home-mobile] stores error", err);
      });
  }

  // ── Banner ads ────────────────────────────────────────────────────────────────

  function renderBanners(banners) {
    if (!banners || banners.length === 0 || !bannerSection || !bannerCarousel)
      return;
    bannerSection.style.display = "";

    if (banners.length === 1) {
      var b = banners[0];
      bannerCarousel.innerHTML =
        '<a href="' +
        esc(b.targetUrl || "#") +
        '" target="_blank" rel="noopener noreferrer">' +
        '<img src="' +
        esc(b.imageUrl) +
        '" alt="' +
        esc(b.title) +
        '" loading="lazy" style="width:100%;display:block" />' +
        "</a>";
      return;
    }

    // ── Multi-slide carousel ──────────────────────────────────────────────────
    var current = 0;
    var total = banners.length;
    var timer;

    var track =
      '<div class="c-track">' +
      banners
        .map(function (b) {
          return (
            '<a class="c-slide" href="' +
            esc(b.targetUrl || "#") +
            '" target="_blank" rel="noopener noreferrer">' +
            '<img src="' +
            esc(b.imageUrl) +
            '" alt="' +
            esc(b.title) +
            '" loading="lazy" style="width:100%;display:block" />' +
            "</a>"
          );
        })
        .join("") +
      "</div>";

    var controls =
      '<button class="c-prev" aria-label="Previous slide">&#8249;</button>' +
      '<button class="c-next" aria-label="Next slide">&#8250;</button>' +
      '<div class="c-dots">' +
      banners
        .map(function (_, i) {
          return (
            '<button class="c-dot' +
            (i === 0 ? " active" : "") +
            '" data-i="' +
            i +
            '" aria-label="Go to slide ' +
            (i + 1) +
            '"></button>'
          );
        })
        .join("") +
      "</div>";

    bannerCarousel.innerHTML = track + controls;

    var trackEl = bannerCarousel.querySelector(".c-track");

    function goTo(idx) {
      current = ((idx % total) + total) % total;
      trackEl.style.transform = "translateX(-" + current * 100 + "%)";
      bannerCarousel.querySelectorAll(".c-dot").forEach(function (d, i) {
        d.classList.toggle("active", i === current);
      });
    }

    function startAuto() {
      timer = setInterval(function () {
        goTo(current + 1);
      }, 4500);
    }

    function stopAuto() {
      clearInterval(timer);
    }

    bannerCarousel
      .querySelector(".c-prev")
      .addEventListener("click", function (e) {
        e.preventDefault();
        stopAuto();
        goTo(current - 1);
        startAuto();
      });
    bannerCarousel
      .querySelector(".c-next")
      .addEventListener("click", function (e) {
        e.preventDefault();
        stopAuto();
        goTo(current + 1);
        startAuto();
      });
    bannerCarousel.querySelectorAll(".c-dot").forEach(function (dot) {
      dot.addEventListener("click", function (e) {
        e.preventDefault();
        stopAuto();
        goTo(parseInt(dot.dataset.i, 10));
        startAuto();
      });
    });

    // Pause on touch (mobile swipe prevention for now)
    bannerCarousel.addEventListener("touchstart", stopAuto, { passive: true });
    bannerCarousel.addEventListener("touchend", startAuto, { passive: true });

    startAuto();
  }

  function loadBanners() {
    fetch("/api/banner-ads")
      .then(function (r) {
        return r.ok ? r.json() : [];
      })
      .then(renderBanners)
      .catch(function () {});
  }

  // ── Init ──────────────────────────────────────────────────────────────────────

  loadAds();
  loadStores();
  loadBanners();
})();
