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

  function loadListings() {
    fetch("/api/ads")
      .then(function (r) {
        return r.json();
      })
      .then(renderListings)
      .catch(function (err) {
        console.error("[home-desktop] listings error", err);
        if (listingsGrid)
          listingsGrid.innerHTML =
            '<p class="empty-msg">Could not load listings.</p>';
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
    bannerCarousel.innerHTML = banners
      .slice(0, 1)
      .map(function (b) {
        return (
          '<a href="' +
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
      .join("");
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
