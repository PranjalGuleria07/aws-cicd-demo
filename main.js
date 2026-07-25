/**
 * TRAVEL BOOKING WEBSITE — main.js
 * Vanilla JavaScript. No frameworks. Flask REST API backend.
 *
 * API Base: /api
 *   GET  /api/destinations          — list (params: q, region, sort, limit, featured)
 *   GET  /api/destinations/<id>     — detail
 *   POST /api/contact               — contact form
 *   POST /api/newsletter            — newsletter subscription
 *   GET  /api/health                — health check
 */

'use strict';

/* ═══════════════════════════════════════════════════════════
   API CLIENT — thin wrapper around fetch()
   ═══════════════════════════════════════════════════════════ */
const API = {
  BASE: '/api',

  /**
   * GET request with query params object.
   * @param {string} path - e.g. '/destinations'
   * @param {Object} params - query string params
   * @returns {Promise<Object>} parsed JSON response
   */
  async get(path, params = {}) {
    const url = new URL(this.BASE + path, window.location.origin);
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') {
        url.searchParams.set(k, v);
      }
    });
    const res = await fetch(url.toString(), {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(err.error || `HTTP ${res.status}`);
    }
    return res.json();
  },

  /**
   * POST request with JSON body.
   * @param {string} path
   * @param {Object} body
   * @returns {Promise<Object>} parsed JSON response
   */
  async post(path, body = {}) {
    const res = await fetch(this.BASE + path, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({ error: res.statusText }));
    if (!res.ok && res.status !== 422) {
      throw new Error(data.error || `HTTP ${res.status}`);
    }
    return { ok: res.ok, status: res.status, data };
  },
};


/* ═══════════════════════════════════════════════════════════
   LOADING SCREEN
   ═══════════════════════════════════════════════════════════ */
function initLoadingScreen() {
  const loader = document.getElementById('loading-screen');
  if (!loader) return;
  setTimeout(() => {
    loader.classList.add('hidden');
    loader.addEventListener('transitionend', () => loader.remove(), { once: true });
  }, 1600);
}


/* ═══════════════════════════════════════════════════════════
   NAVIGATION
   ═══════════════════════════════════════════════════════════ */
function initNavigation() {
  const navbar     = document.querySelector('.navbar');
  const hamburger  = document.querySelector('.nav-hamburger');
  const mobileMenu = document.querySelector('.mobile-menu');

  if (!navbar) return;

  const onScroll = () => navbar.classList.toggle('scrolled', window.scrollY > 20);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  if (hamburger && mobileMenu) {
    hamburger.addEventListener('click', () => {
      const isOpen = hamburger.classList.toggle('open');
      mobileMenu.classList.toggle('open', isOpen);
      document.body.style.overflow = isOpen ? 'hidden' : '';
      hamburger.setAttribute('aria-expanded', isOpen);
    });
    mobileMenu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        hamburger.classList.remove('open');
        mobileMenu.classList.remove('open');
        document.body.style.overflow = '';
        hamburger.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // Active link highlight based on current URL path
  const path = window.location.pathname;
  document.querySelectorAll('.nav-links a, .mobile-menu a').forEach(link => {
    const href = link.getAttribute('href');
    if (!href) return;
    const isActive =
      (href === '/'             && (path === '/' || path === ''))     ||
      (href === '/destinations' && path.startsWith('/destinations'))  ||
      (href === '/contact'      && path.startsWith('/contact'));
    if (isActive) link.classList.add('active');
  });
}


/* ═══════════════════════════════════════════════════════════
   SCROLL REVEAL
   ═══════════════════════════════════════════════════════════ */
function initScrollReveal() {
  const observer = new IntersectionObserver(
    entries => entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('revealed'); observer.unobserve(e.target); }
    }),
    { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
  );
  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
}


/* ═══════════════════════════════════════════════════════════
   WISHLIST TOGGLE
   ═══════════════════════════════════════════════════════════ */
function initWishlists() {
  document.addEventListener('click', e => {
    const btn = e.target.closest('.dest-card-wishlist');
    if (!btn) return;
    btn.classList.toggle('active');
    const svg = btn.querySelector('svg');
    svg.setAttribute('fill', btn.classList.contains('active') ? 'currentColor' : 'none');
  });
}


/* ═══════════════════════════════════════════════════════════
   BUILD DESTINATION CARD HTML
   ═══════════════════════════════════════════════════════════ */
function buildDestCard(dest) {
  return `
    <div class="dest-card reveal"
         data-region="${dest.region}"
         data-name="${(dest.name || '').toLowerCase()}"
         data-country="${(dest.country || '').toLowerCase()}"
         data-price="${dest.price}"
         data-rating="${dest.rating}">
      <div class="dest-card-img">
        <img src="${dest.image}" alt="${dest.name}" loading="lazy"/>
        <div class="dest-card-badge">
          <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
          ${dest.tag || 'Featured'}
        </div>
        <button class="dest-card-wishlist" aria-label="Add ${dest.name} to wishlist">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
        </button>
      </div>
      <div class="dest-card-body">
        <div class="dest-card-meta">
          <span class="dest-card-country">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
            ${dest.country}
          </span>
          <span class="dest-card-rating">
            <svg viewBox="0 0 24 24" fill="#FBBF24" aria-hidden="true"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
            ${dest.rating}
            <span style="color:var(--color-text-muted);font-weight:400">(${(dest.reviews || 0).toLocaleString()})</span>
          </span>
        </div>
        <h3 class="dest-card-name">${dest.name}</h3>
        <p class="dest-card-desc">${dest.description}</p>
        <div class="dest-card-footer">
          <div>
            <div class="dest-card-price-label">Starting from</div>
            <div class="dest-card-price-num">$${(dest.price || 0).toLocaleString()} <span>/ person</span></div>
          </div>
          <button class="dest-card-btn" data-id="${dest.id}">View Details</button>
        </div>
      </div>
    </div>
  `;
}


/* ═══════════════════════════════════════════════════════════
   SKELETON LOADERS
   ═══════════════════════════════════════════════════════════ */
function buildSkeletonCard() {
  return `
    <div class="dest-card skeleton-card" aria-hidden="true" style="pointer-events:none">
      <div class="dest-card-img" style="background:linear-gradient(90deg,#f0f0f0 25%,#e0e0e0 50%,#f0f0f0 75%);background-size:200% 100%;animation:shimmer 1.5s infinite;"></div>
      <div class="dest-card-body">
        <div style="height:14px;background:#f0f0f0;border-radius:4px;margin-bottom:12px;animation:shimmer 1.5s infinite;background-size:200% 100%;background:linear-gradient(90deg,#f0f0f0 25%,#e0e0e0 50%,#f0f0f0 75%);"></div>
        <div style="height:20px;background:#f0f0f0;border-radius:4px;margin-bottom:8px;width:70%;animation:shimmer 1.5s infinite;background-size:200% 100%;background:linear-gradient(90deg,#f0f0f0 25%,#e0e0e0 50%,#f0f0f0 75%);"></div>
        <div style="height:14px;background:#f0f0f0;border-radius:4px;margin-bottom:4px;animation:shimmer 1.5s infinite;background-size:200% 100%;background:linear-gradient(90deg,#f0f0f0 25%,#e0e0e0 50%,#f0f0f0 75%);"></div>
        <div style="height:14px;background:#f0f0f0;border-radius:4px;width:85%;animation:shimmer 1.5s infinite;background-size:200% 100%;background:linear-gradient(90deg,#f0f0f0 25%,#e0e0e0 50%,#f0f0f0 75%);"></div>
      </div>
    </div>
  `;
}

function showSkeletons(container, count = 6) {
  container.innerHTML = Array(count).fill(buildSkeletonCard()).join('');
}

function showApiError(container, message = 'Failed to load destinations.') {
  container.innerHTML = `
    <div style="grid-column:1/-1;text-align:center;padding:64px 0;">
      <svg viewBox="0 0 24 24" fill="none" stroke="var(--color-error)" stroke-width="1.5"
           style="width:56px;height:56px;margin:0 auto 16px;">
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="8" x2="12" y2="12"/>
        <line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
      <h3 style="font-size:1.1rem;color:var(--color-navy);margin-bottom:8px;">Oops! Something went wrong</h3>
      <p style="color:var(--color-text-muted);font-size:.9rem;">${message}</p>
      <button onclick="window.location.reload()" class="btn btn-outline" style="margin-top:20px;">
        Try Again
      </button>
    </div>
  `;
}


/* ═══════════════════════════════════════════════════════════
   HOME PAGE — Featured Destinations (API: featured=true, limit=6)
   ═══════════════════════════════════════════════════════════ */
async function initHomeFeatured() {
  const grid = document.getElementById('featured-destinations-grid');
  if (!grid) return;

  showSkeletons(grid, 6);

  try {
    const res = await API.get('/destinations', { featured: 'true', limit: 6, sort: 'popular' });
    const destinations = res.data || [];

    if (destinations.length === 0) {
      grid.innerHTML = '<p style="text-align:center;color:var(--color-text-muted);">No featured destinations available.</p>';
      return;
    }

    grid.innerHTML = destinations.map(buildDestCard).join('');
    initScrollReveal();
  } catch (err) {
    console.error('Failed to load featured destinations:', err);
    showApiError(grid, err.message);
  }
}


/* ═══════════════════════════════════════════════════════════
   DESTINATIONS PAGE — Full listing with search + filter
   All filtering/sorting is delegated to the Flask API.
   ═══════════════════════════════════════════════════════════ */
let activeFilter = 'all';
let activeSearch = '';
let activeSort   = 'popular';
let debounceTimer;

async function initDestinationsPage() {
  const container   = document.getElementById('dest-cards-container');
  const searchInput = document.getElementById('dest-search');
  const filterBtns  = document.querySelectorAll('.filter-btn');
  const sortSelect  = document.getElementById('sort-select');
  const countEl     = document.getElementById('dest-count-num');
  const noResults   = document.querySelector('.no-results');
  const gridViewBtn = document.getElementById('grid-view-btn');
  const listViewBtn = document.getElementById('list-view-btn');

  if (!container) return;

  // Read initial query from URL (from hero search redirect)
  const params = new URLSearchParams(window.location.search);
  const q = params.get('q');
  if (q && searchInput) {
    searchInput.value = q;
    activeSearch = q;
  }

  async function fetchAndRender() {
    showSkeletons(container, 6);
    if (noResults) noResults.classList.remove('visible');

    try {
      const res = await API.get('/destinations', {
        q:      activeSearch,
        region: activeFilter,
        sort:   activeSort,
      });

      const destinations = res.data || [];

      if (countEl) countEl.textContent = res.meta?.total ?? destinations.length;

      if (destinations.length === 0) {
        container.innerHTML = '';
        if (noResults) noResults.classList.add('visible');
        return;
      }

      container.innerHTML = destinations.map(buildDestCard).join('');
      initScrollReveal();
    } catch (err) {
      console.error('Failed to load destinations:', err);
      showApiError(container, err.message);
    }
  }

  // Search — debounced
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        activeSearch = searchInput.value.trim();
        fetchAndRender();
      }, 350);
    });
  }

  // Region filter buttons
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeFilter = btn.dataset.filter || 'all';
      fetchAndRender();
    });
  });

  // Sort
  if (sortSelect) {
    sortSelect.addEventListener('change', () => {
      activeSort = sortSelect.value;
      fetchAndRender();
    });
  }

  // View toggle (grid / list — client-side only, no API call)
  if (gridViewBtn && listViewBtn) {
    gridViewBtn.addEventListener('click', () => {
      container.classList.remove('list-view');
      gridViewBtn.classList.add('active');
      listViewBtn.classList.remove('active');
    });
    listViewBtn.addEventListener('click', () => {
      container.classList.add('list-view');
      listViewBtn.classList.add('active');
      gridViewBtn.classList.remove('active');
    });
  }

  // Initial load
  await fetchAndRender();
}


/* ═══════════════════════════════════════════════════════════
   CONTACT FORM — Posts to /api/contact
   ═══════════════════════════════════════════════════════════ */
function initContactForm() {
  const form      = document.getElementById('contact-form');
  const successEl = document.getElementById('form-success');
  if (!form) return;

  const validators = {
    name:    v => v.trim().length >= 2 ? null : 'Please enter your full name (at least 2 characters).',
    email:   v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? null : 'Please enter a valid email address.',
    phone:   v => !v || /^[\+]?[\d\s\-\(\)]{7,20}$/.test(v) ? null : 'Please enter a valid phone number.',
    subject: v => v && v !== '' ? null : 'Please select a subject.',
    message: v => v.trim().length >= 10 ? null : 'Message must be at least 10 characters long.',
  };

  function showError(field, msg) {
    const input = form.querySelector(`#${field}`);
    const errEl = form.querySelector(`#${field}-error`);
    if (input) { input.classList.add('error'); input.classList.remove('success'); }
    if (errEl) {
      const span = errEl.querySelector('span') || errEl;
      span.textContent = msg;
      errEl.classList.add('visible');
    }
  }

  function clearError(field) {
    const input = form.querySelector(`#${field}`);
    const errEl = form.querySelector(`#${field}-error`);
    if (input) { input.classList.remove('error'); input.classList.add('success'); }
    if (errEl) errEl.classList.remove('visible');
  }

  // Live per-field validation
  Object.keys(validators).forEach(field => {
    const input = form.querySelector(`#${field}`);
    if (!input) return;
    input.addEventListener('blur', () => {
      const err = validators[field](input.value);
      err ? showError(field, err) : clearError(field);
    });
    input.addEventListener('input', () => {
      if (input.classList.contains('error')) {
        const err = validators[field](input.value);
        err ? showError(field, err) : clearError(field);
      }
    });
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Client-side validation first
    let isValid = true;
    Object.keys(validators).forEach(field => {
      const input = form.querySelector(`#${field}`);
      if (!input) return;
      const err = validators[field](input.value);
      if (err) { showError(field, err); isValid = false; }
      else      { clearError(field); }
    });
    if (!isValid) return;

    // Loading state
    const submitBtn = form.querySelector('.form-submit');
    const originalHTML = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
           style="animation:spin .8s linear infinite" aria-hidden="true">
        <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
      </svg>
      Sending…
    `;

    try {
      const { ok, status, data } = await API.post('/contact', {
        name:    form.querySelector('#name')?.value.trim(),
        email:   form.querySelector('#email')?.value.trim(),
        phone:   form.querySelector('#phone')?.value.trim(),
        subject: form.querySelector('#subject')?.value,
        message: form.querySelector('#message')?.value.trim(),
      });

      if (status === 422 && data.errors) {
        // Server-side validation errors — map back to fields
        Object.entries(data.errors).forEach(([field, msg]) => showError(field, msg));
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalHTML;
        return;
      }

      if (ok) {
        form.style.display = 'none';
        if (successEl) successEl.classList.add('visible');
      } else {
        throw new Error(data.error || 'Submission failed');
      }
    } catch (err) {
      console.error('Contact form error:', err);
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalHTML;
      // Show a general error below the button
      const existingAlert = form.querySelector('.form-general-error');
      if (!existingAlert) {
        const alert = document.createElement('p');
        alert.className = 'form-general-error';
        alert.style.cssText = 'color:var(--color-error);font-size:.85rem;margin-top:12px;text-align:center;';
        alert.textContent = err.message || 'Something went wrong. Please try again.';
        submitBtn.parentNode.insertBefore(alert, submitBtn.nextSibling);
        setTimeout(() => alert.remove(), 5000);
      }
    }
  });
}


/* ═══════════════════════════════════════════════════════════
   HERO SEARCH — Redirects to /destinations?q=...
   ═══════════════════════════════════════════════════════════ */
function initHeroSearch() {
  const searchBtn = document.querySelector('.search-btn');
  if (!searchBtn) return;

  searchBtn.addEventListener('click', () => {
    const dest = document.getElementById('search-destination')?.value.trim();
    if (!dest) {
      const inp = document.getElementById('search-destination');
      if (inp) {
        inp.focus();
        inp.style.borderColor = 'var(--color-error)';
        setTimeout(() => (inp.style.borderColor = ''), 2000);
      }
      return;
    }
    window.location.href = `/destinations?q=${encodeURIComponent(dest)}`;
  });

  // Also support Enter key in search inputs
  document.querySelectorAll('.search-input-wrap input').forEach(inp => {
    inp.addEventListener('keydown', e => {
      if (e.key === 'Enter') searchBtn.click();
    });
  });
}


/* ═══════════════════════════════════════════════════════════
   NEWSLETTER — Posts to /api/newsletter
   ═══════════════════════════════════════════════════════════ */
function initNewsletters() {
  document.querySelectorAll('.footer-newsletter-input').forEach(wrap => {
    const input = wrap.querySelector('input');
    const btn   = wrap.querySelector('button');
    if (!btn || !input) return;

    const subscribe = async () => {
      const email = input.value.trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        input.style.borderColor = 'var(--color-error)';
        setTimeout(() => (input.style.borderColor = ''), 2000);
        return;
      }

      btn.disabled  = true;
      btn.textContent = '…';

      try {
        const { ok, data } = await API.post('/newsletter', { email });
        if (ok) {
          btn.textContent = '✓ Subscribed!';
          btn.style.background = 'var(--color-success)';
          input.value    = '';
          input.disabled = true;
        } else {
          btn.textContent = 'Retry';
          btn.disabled = false;
        }
      } catch {
        btn.textContent = 'Retry';
        btn.disabled = false;
      }
    };

    btn.addEventListener('click', subscribe);
    input.addEventListener('keydown', e => { if (e.key === 'Enter') subscribe(); });
  });
}


/* ═══════════════════════════════════════════════════════════
   SMOOTH SCROLL
   ═══════════════════════════════════════════════════════════ */
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', e => {
      const target = document.querySelector(link.getAttribute('href'));
      if (target) { e.preventDefault(); target.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
    });
  });
}


/* ═══════════════════════════════════════════════════════════
   SPIN KEYFRAME + SHIMMER (for loading animations)
   ═══════════════════════════════════════════════════════════ */
(function injectKeyframes() {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes spin    { to { transform: rotate(360deg); } }
    @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
  `;
  document.head.appendChild(style);
})();


/* ═══════════════════════════════════════════════════════════
   INIT
   ═══════════════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  initLoadingScreen();
  initNavigation();
  initScrollReveal();
  initWishlists();
  initHomeFeatured();       // async — fetches from /api/destinations
  initDestinationsPage();   // async — fetches from /api/destinations
  initContactForm();
  initHeroSearch();
  initNewsletters();
  initSmoothScroll();
});
