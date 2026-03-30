/**
 * public/js/home-desktop.js
 * ─────────────────────────
 * Homepage initialisation for the desktop layout.
 * Fetches listings and stores from the API and renders them into the Jinja2
 * skeleton grids, replacing the CSS shimmer placeholders.
 *
 * Loaded as a <script defer> after app.js so global helpers (if any) are
 * available, but this file is self-contained enough to work standalone.
 */

(function () {
  "use strict";

  // ── Config ──────────────────────────────────────────────────────────────────
  var PAGE_SIZE = 16; // listings per initial load on desktop

  // ── DOM refs ────────────────────────────────────────────────────────────────
  var listingsGrid = document.getElementById("listingsGrid");
  var requirementsList = document.getElementById("requirementsList");
  var storesRow = document.getElementById("storesRow");
  var bannerSection = document.getElementById("bannerSection");
  var bannerCarousel = document.getElementById("bannerCarousel");

  // ── Helpers ──────────────────────────────────────────────────────────────────

  function esc(str) {
    // Basic XSS guard for values injected into innerHTML
    return String(str || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function formatPrice(price, unit) {
    if (price == null) return "Contact for price";
    return (
      "₹" +
      Number(price).toLocaleString("en-IN") +
      (unit ? " / " + esc(unit) : "")
    );
  }

  // ── Listings ─────────────────────────────────────────────────────────────────

  function renderListings(ads) {
    if (!listingsGrid) return;
    if (!ads || ads.length === 0) {
      listingsGrid.innerHTML =
        '<p class="empty-msg">No listings yet. <a href="/seller-dashboard.html">Be the first to post!</a></p>';
      return;
    }

    listingsGrid.innerHTML = ads
      .slice(0, PAGE_SIZE)
      .map(function (ad) {
        var imgSrc =
          ad.imageUrl || (ad.images && JSON.parse(ad.images || "[]")[0]) || "";
        var imgTag = imgSrc
          ? '<img src="' +
            esc(imgSrc) +
            '" alt="' +
            esc(ad.title) +
            '" loading="lazy" />'
          : '<div class="no-img-placeholder">📦</div>';
        return (
          '<a class="listing-card" href="/listing.html?id=' +
          esc(ad.id) +
          '">' +
          imgTag +
          '<div class="listing-card-body">' +
          '<div class="listing-card-title">' +
          esc(ad.title) +
          "</div>" +
          '<div class="listing-card-price">' +
          formatPrice(ad.price, ad.unit) +
          "</div>" +
          '<div class="listing-card-meta">' +
          esc(ad.storeName || ad.author || "") +
          "</div>" +
          "</div>" +
          "</a>"
        );
      })
      .join("");
  }

  function isRequirement(ad) {
    return (
      ad.listingType === "requirement" ||
      (ad.listingType === null &&
        (ad.role === "buyer" || (!ad.role && !ad.price)))
    );
  }

  function renderRequirements(reqs) {
    if (!requirementsList) return;
    if (!reqs || reqs.length === 0) {
      requirementsList.innerHTML =
        '<p class="empty-msg">No requirements posted yet.</p>';
      return;
    }
    requirementsList.innerHTML = reqs
      .slice(0, 8)
      .map(function (ad) {
        var timeAgo = ad.createdAt
          ? new Date(ad.createdAt).toLocaleDateString()
          : "";
        return (
          '<a class="req-card" href="/listing.html?id=' +
          esc(ad.id) +
          '">' +
          '<div class="req-card-title">' +
          esc(ad.title) +
          "</div>" +
          '<div class="req-card-meta">' +
          (ad.category
            ? '<span class="req-tag">' + esc(ad.category) + "</span>"
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

  function loadListings() {
    fetch("/api/ads")
      .then(function (r) {
        return r.json();
      })
      .then(function (ads) {
        var reqs = [];
        var listings = [];
        (ads || []).forEach(function (ad) {
          if (isRequirement(ad)) reqs.push(ad);
          else listings.push(ad);
        });
        renderListings(listings);
        renderRequirements(reqs);
      })
      .catch(function (err) {
        console.error("[home-desktop] listings error", err);
        if (listingsGrid)
          listingsGrid.innerHTML =
            '<p class="empty-msg">Could not load listings.</p>';
        if (requirementsList) requirementsList.innerHTML = "";
      });
  }

  // ── Stores ───────────────────────────────────────────────────────────────────

  function renderStores(stores) {
    if (!storesRow) return;
    if (!stores || stores.length === 0) {
      storesRow.innerHTML = "";
      return;
    }

    storesRow.innerHTML = stores
      .slice(0, 6)
      .map(function (s) {
        var logo = s.logo
          ? '<img src="' +
            esc(s.logo) +
            '" alt="' +
            esc(s.storeName || s.name) +
            '" loading="lazy" />'
          : '<div class="skeleton-avatar" style="width:56px;height:56px;border-radius:50%;background:#f0f0f0;margin:0 auto 8px"></div>';
        return (
          '<a class="store-card" href="/store-profile.html?id=' +
          esc(s.id) +
          '">' +
          logo +
          '<div class="store-card-name">' +
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
        console.error("[home-desktop] stores error", err);
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
        '" loading="lazy" />' +
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
            '" loading="lazy" />' +
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
      }, 5000);
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

    bannerCarousel.addEventListener("mouseenter", stopAuto);
    bannerCarousel.addEventListener("mouseleave", startAuto);

    startAuto();
  }

  function loadBanners() {
    fetch("/api/banner-ads")
      .then(function (r) {
        return r.ok ? r.json() : [];
      })
      .then(renderBanners)
      .catch(function () {}); // banners are non-essential
  }

  // ── Hero search redirect ─────────────────────────────────────────────────────

  var heroForm = document.getElementById("heroSearchForm");
  if (heroForm) {
    heroForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var q = heroForm.querySelector('input[name="q"]');
      if (q && q.value.trim()) {
        window.location.href =
          "/all-listings.html?q=" + encodeURIComponent(q.value.trim());
      }
    });
  }

  // ── Init ──────────────────────────────────────────────────────────────────────

  loadListings();
  loadStores();
  loadBanners();
})();
