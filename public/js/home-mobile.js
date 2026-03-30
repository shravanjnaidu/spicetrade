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
  'use strict';

  var PAGE_SIZE = window.__MOBILE_PAGE_SIZE__ || 12;

  var _products     = [];
  var _page         = 0;

  var listingsGrid   = document.getElementById('listingsGrid');
  var reqList        = document.getElementById('requirementsList');
  var storesRow      = document.getElementById('storesRow');
  var loadMoreBtn    = document.getElementById('loadMoreBtn');
  var bannerSection  = document.getElementById('mobileBannerSection');
  var bannerCarousel = document.getElementById('mobileBannerCarousel');

  // ── Helpers ──────────────────────────────────────────────────────────────────

  function esc(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function formatPrice(price, unit) {
    if (price == null) return 'Contact';
    return '₹' + Number(price).toLocaleString('en-IN') + (unit ? '/' + esc(unit) : '');
  }

  function isRequirement(ad) {
    return (
      ad.listingType === 'requirement' ||
      (ad.listingType === null && (ad.role === 'buyer' || (!ad.role && !ad.price)))
    );
  }

  // ── Products grid ─────────────────────────────────────────────────────────────

  function renderPage() {
    if (!listingsGrid || _products.length === 0) return;

    var start = _page * PAGE_SIZE;
    var slice = _products.slice(start, start + PAGE_SIZE);

    if (_page === 0) listingsGrid.innerHTML = '';

    slice.forEach(function (ad) {
      var imgSrc = ad.imageUrl || '';
      var imgTag = imgSrc
        ? '<img src="' + esc(imgSrc) + '" alt="' + esc(ad.title) + '" loading="lazy" />'
        : '<div style="width:100%;aspect-ratio:1;background:#f5f5f5;display:flex;align-items:center;justify-content:center;font-size:2rem">📦</div>';

      var card = document.createElement('a');
      card.className = 'listing-card';
      card.href = '/listing.html?id=' + encodeURIComponent(ad.id);
      card.innerHTML =
        imgTag +
        '<div class="listing-card-body">' +
          '<div class="listing-card-title">' + esc(ad.title) + '</div>' +
          '<div class="listing-card-price">' + formatPrice(ad.price, ad.unit) + '</div>' +
        '</div>';
      listingsGrid.appendChild(card);
    });

    _page++;
    if (loadMoreBtn) {
      loadMoreBtn.style.display = _page * PAGE_SIZE >= _products.length ? 'none' : '';
    }
  }

  // ── Requirements list ──────────────────────────────────────────────────────────

  function renderRequirements(reqs) {
    if (!reqList) return;
    if (!reqs || reqs.length === 0) {
      reqList.innerHTML = '<p style="padding:12px 16px;color:#888;font-size:.85rem">No requirements posted yet.</p>';
      return;
    }
    reqList.innerHTML = reqs.slice(0, 8).map(function (ad) {
      var timeAgo = ad.createdAt ? new Date(ad.createdAt).toLocaleDateString() : '';
      return (
        '<a class="req-card" href="/listing.html?id=' + esc(ad.id) + '">' +
          '<div class="req-card-title">' + esc(ad.title) + '</div>' +
          '<div class="req-card-meta">' +
            (ad.category ? '<span class="req-tag">' + esc(ad.category) + '</span>' : '') +
            (ad.author || ad.storeName
              ? '<span class="req-author">' + esc(ad.storeName || ad.author) + '</span>'
              : '') +
            (timeAgo ? '<span class="req-date">' + timeAgo + '</span>' : '') +
          '</div>' +
        '</a>'
      );
    }).join('');
  }

  // ── Single API fetch, split into products + requirements ───────────────────────

  function loadAds() {
    fetch('/api/ads')
      .then(function (r) { return r.json(); })
      .then(function (ads) {
        var reqs = [];
        ads.forEach(function (ad) {
          if (isRequirement(ad)) reqs.push(ad);
          else _products.push(ad);
        });

        if (_products.length === 0 && listingsGrid) {
          listingsGrid.innerHTML =
            '<p style="padding:16px;grid-column:1/-1;text-align:center;color:#888">No listings yet.</p>';
          if (loadMoreBtn) loadMoreBtn.style.display = 'none';
        } else {
          renderPage();
        }

        renderRequirements(reqs);
      })
      .catch(function (err) {
        console.error('[home-mobile] ads error', err);
        if (listingsGrid) listingsGrid.innerHTML =
          '<p style="padding:16px;grid-column:1/-1;color:#888">Could not load listings.</p>';
        if (reqList) reqList.innerHTML = '';
      });
  }

  if (loadMoreBtn) {
    loadMoreBtn.addEventListener('click', renderPage);
  }

  // ── Stores ───────────────────────────────────────────────────────────────────

  function renderStores(stores) {
    if (!storesRow) return;
    if (!stores || stores.length === 0) { storesRow.innerHTML = ''; return; }

    storesRow.innerHTML = stores.slice(0, 8).map(function (s) {
      var logo = s.logo
        ? '<img src="' + esc(s.logo) + '" alt="' + esc(s.storeName || s.name) +
          '" loading="lazy" style="width:56px;height:56px;border-radius:50%;object-fit:cover;margin:0 auto 8px;display:block" />'
        : '<div style="width:56px;height:56px;border-radius:50%;background:#f0f0f0;margin:0 auto 8px"></div>';
      return (
        '<a class="store-card" href="/store-profile.html?id=' + esc(s.id) + '">' +
          logo +
          '<div class="store-card-name" style="font-size:.75rem;text-align:center;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' +
            esc(s.storeName || s.name) +
          '</div>' +
        '</a>'
      );
    }).join('');
  }

  function loadStores() {
    fetch('/api/stores')
      .then(function (r) { return r.json(); })
      .then(renderStores)
      .catch(function (err) { console.error('[home-mobile] stores error', err); });
  }

  // ── Banner ads ────────────────────────────────────────────────────────────────

  function loadBanners() {
    fetch('/api/banner-ads')
      .then(function (r) { return r.ok ? r.json() : []; })
      .then(function (banners) {
        if (!banners || banners.length === 0 || !bannerSection || !bannerCarousel) return;
        var b = banners[0];
        bannerSection.style.display = '';
        bannerCarousel.innerHTML =
          '<a href="' + esc(b.targetUrl || '#') + '" target="_blank" rel="noopener noreferrer">' +
            '<img src="' + esc(b.imageUrl) + '" alt="' + esc(b.title) +
              '" loading="lazy" style="width:100%;display:block" />' +
          '</a>';
      })
      .catch(function () {});
  }

  // ── Init ──────────────────────────────────────────────────────────────────────

  loadAds();
  loadStores();
  loadBanners();

})();

 * Key differences from home-desktop.js:
 *   • Smaller initial page size (window.__MOBILE_PAGE_SIZE__, default 12)
 *   • "Load more" pagination button
 *   • Stores rendered as a horizontal scroll row (4 columns max visible)
 *   • Banner carousel shows a single image (no heavy JS slider library)
 *   • All <img> elements get loading="lazy" for native lazy loading
 */

(function () {
  "use strict";

  // ── Config ──────────────────────────────────────────────────────────────────
  var PAGE_SIZE = window.__MOBILE_PAGE_SIZE__ || 12;

  var _allAds = [];
  var _page = 0; // how many pages have been rendered so far

  // ── DOM refs ────────────────────────────────────────────────────────────────
  var listingsGrid = document.getElementById("listingsGrid");
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

  // ── Listings ─────────────────────────────────────────────────────────────────

  function renderPage() {
    if (!listingsGrid || _allAds.length === 0) return;

    var start = _page * PAGE_SIZE;
    var slice = _allAds.slice(start, start + PAGE_SIZE);

    if (_page === 0) {
      // First paint: replace skeletons
      listingsGrid.innerHTML = "";
    }

    slice.forEach(function (ad) {
      var imgSrc = ad.imageUrl || "";
      var imgTag = imgSrc
        ? '<img src="' +
          esc(imgSrc) +
          '" alt="' +
          esc(ad.title) +
          '" loading="lazy" />'
        : '<div style="width:100%;aspect-ratio:1;background:#f5f5f5;display:flex;align-items:center;justify-content:center;font-size:2rem">📦</div>';

      var card = document.createElement("a");
      card.className = "listing-card";
      card.href = "/listing.html?id=" + encodeURIComponent(ad.id);
      card.innerHTML =
        imgTag +
        '<div class="listing-card-body">' +
        '<div class="listing-card-title">' +
        esc(ad.title) +
        "</div>" +
        '<div class="listing-card-price">' +
        formatPrice(ad.price, ad.unit) +
        "</div>" +
        "</div>";
      listingsGrid.appendChild(card);
    });

    _page++;

    // Hide "Load more" if we've exhausted all ads
    if (loadMoreBtn) {
      loadMoreBtn.style.display =
        _page * PAGE_SIZE >= _allAds.length ? "none" : "";
    }
  }

  function loadListings() {
    fetch("/api/ads")
      .then(function (r) {
        return r.json();
      })
      .then(function (ads) {
        _allAds = ads || [];
        if (_allAds.length === 0 && listingsGrid) {
          listingsGrid.innerHTML =
            '<p style="padding:16px;grid-column:1/-1;text-align:center;color:#888">' +
            "No listings yet.</p>";
          if (loadMoreBtn) loadMoreBtn.style.display = "none";
          return;
        }
        renderPage();
      })
      .catch(function (err) {
        console.error("[home-mobile] listings error", err);
        if (listingsGrid)
          listingsGrid.innerHTML =
            '<p style="padding:16px;grid-column:1/-1;color:#888">Could not load listings.</p>';
      });
  }

  if (loadMoreBtn) {
    loadMoreBtn.addEventListener("click", function () {
      renderPage();
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
    var b = banners[0];
    bannerSection.style.display = "";
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

  loadListings();
  loadStores();
  loadBanners();
})();
