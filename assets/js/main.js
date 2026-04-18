/* ============================================
   FIXMATE AI — Main JavaScript
   ============================================ */

// ---- Global State ----
const APP = {
  currentCity: 'Hyderabad',
  cities: ['Hyderabad','Bangalore','Mumbai','Delhi','Chennai','Pune','Kolkata','Ahmedabad','Jaipur','Lucknow'],
  isOnline: false,
  servicesData: null,
  toolsData: null,
};

// ---- DOM Ready ----
document.addEventListener('DOMContentLoaded', () => {
  normalizeWorkerSidebar();
  hydrateWorkerNavBadges();
  initNavbar();
  initCitySelector();
  initSearch();
  initScrollReveal();
  initServiceRows();
  initCategoryCards();
  initEmergencyCards();
  initCounters();
  initHeroSearch();
  initMobileNav();
  initSpaRouter();
});

function normalizeWorkerSidebar(root = document) {
  const path = (window.location.pathname || "").toLowerCase();
  if (!path.includes("/worker/")) return;
  const map = {
    jobs: { text: "Jobs & Visits", href: "jobs.html" },
    earnings: { text: "Invoices & Billing", href: "earnings.html" },
    availability: { text: "Calendar", href: "schedule.html" },
    tracking: { text: "Tracking", href: "tracking.html" },
    "tools-store": { text: "Team / Nearby Pros", href: "tools-store.html" },
    profile: { text: "Settings", href: "profile.html" },
    messages: { text: "Inbox", href: "messages.html" },
    notifications: { text: "Documents", href: "documents.html" },
    settings: { text: "Settings", href: "profile.html" }
  };
  root.querySelectorAll(".dash-menu-item").forEach((a) => {
    const id = a.dataset && a.dataset.id;
    if (!id || !map[id]) return;
    const label = map[id].text;
    const href = map[id].href;
    const badge = a.querySelector(".sn-nav-badge");
    const textNode = Array.from(a.childNodes).find(n => n.nodeType === Node.TEXT_NODE && n.textContent.trim().length);
    if (textNode) textNode.textContent = ` ${label} `;
    a.setAttribute("href", href);
    if (badge && (id === "notifications" || id === "settings")) badge.style.display = "none";
  });
}

async function hydrateWorkerNavBadges() {
  const path = (window.location.pathname || "").toLowerCase();
  if (!path.includes("/worker/")) return;
  if (typeof WorkerAPI === "undefined" || typeof Auth === "undefined" || !Auth.isLoggedIn || !Auth.isLoggedIn()) return;
  try {
    const jobs = await WorkerAPI.getJobs();
    const incoming = (jobs && jobs.incoming) ? jobs.incoming.length : 0;
    const rows = Array.from(document.querySelectorAll('.dash-menu-item[data-id="jobs"], .dash-menu-item[data-id="messages"]'));
    rows.forEach((a) => {
      let badge = a.querySelector(".sn-nav-badge");
      if (!badge) {
        badge = document.createElement("span");
        badge.className = "sn-nav-badge";
        a.appendChild(badge);
      }
      if (a.dataset.id === "jobs") {
        badge.style.display = incoming > 0 ? "" : "none";
        badge.textContent = incoming > 99 ? "99+" : String(incoming);
      }
    });
  } catch (_) {}
}

// ---- SPA Router ----
function initSpaRouter() {
  document.addEventListener('click', async (e) => {
    const link = e.target.closest('a');
    if (!link) return;
    const href = link.getAttribute('href');
    if (!href || href.startsWith('#') || href.startsWith('javascript:')) return;
    if (link.host !== window.location.host) return;
    if (link.target === '_blank') return;
    if (link.pathname === window.location.pathname && link.search === window.location.search) {
      e.preventDefault();
      return;
    }

    const oldMain = document.querySelector('.main-content');
    if (!oldMain) return; // Allow normal navigation outside dashboard

    e.preventDefault();
    const url = link.href;

    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error('Page fetch failed');
      const text = await res.text();
      const doc = new DOMParser().parseFromString(text, 'text/html');
      const newMain = doc.querySelector('.main-content');

      if (!newMain) {
        window.location.href = url;
        return;
      }

      oldMain.innerHTML = newMain.innerHTML;
      document.title = doc.title;
      window.history.pushState({}, '', url);

      // Re-run any scripts contained inside the new main area
      const scripts = oldMain.querySelectorAll('script');
      scripts.forEach(oldScript => {
        const newScript = document.createElement('script');
        Array.from(oldScript.attributes).forEach(attr => newScript.setAttribute(attr.name, attr.value));
        newScript.appendChild(document.createTextNode(oldScript.innerHTML));
        oldScript.parentNode.replaceChild(newScript, oldScript);
      });

      // Update active sidebar item smoothly
      document.querySelectorAll('.dash-menu-item, .mobile-nav-item').forEach(el => {
        el.classList.remove('active');
        const linkPath = el.getAttribute('href').split('?')[0].split('/').pop();
        const navTarget = new URL(url).pathname.split('/').pop();
        if (linkPath && navTarget && linkPath === navTarget) {
          el.classList.add('active');
        }
      });
      normalizeWorkerSidebar(oldMain.closest("body") || document);
      
      window.scrollTo({ top: 0, behavior: 'smooth' });

      // Custom Route Initializers
      if (document.querySelector('.worker-layout') && typeof initEarningsChart === 'function') initEarningsChart();
      if (document.querySelector('.admin-layout') && typeof initAdminChart === 'function') initAdminChart();
      if (url.includes('track.html') && typeof initGoogleMapsTracking === 'function') initGoogleMapsTracking();

    } catch (err) {
      console.warn("SPA Navigation failed, falling back", err);
      window.location.href = url; // Fallback perfectly to standard href routing
    }
  });

  window.addEventListener('popstate', async () => {
    const oldMain = document.querySelector('.main-content');
    if (!oldMain) {
      window.location.reload();
      return;
    }
    try {
      const res = await fetch(window.location.href);
      const text = await res.text();
      const doc = new DOMParser().parseFromString(text, 'text/html');
      const newMain = doc.querySelector('.main-content');
      if (newMain) {
        oldMain.innerHTML = newMain.innerHTML;
        document.title = doc.title;
      } else {
        window.location.reload();
      }
    } catch {
      window.location.reload();
    }
  });
}

// ---- Navbar Scroll Effect ----
function initNavbar() {
  const navbar = document.querySelector('.navbar');
  if (!navbar) return;
  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 10);
  });
}

// ---- City Selector ----
function initCitySelector() {
  const selector = document.querySelector('.city-selector');
  const dropdown = document.querySelector('.city-dropdown');
  if (!selector || !dropdown) return;

  selector.addEventListener('click', (e) => {
    e.stopPropagation();
    dropdown.classList.toggle('active');
  });

  document.addEventListener('click', () => {
    dropdown.classList.remove('active');
  });

  dropdown.querySelectorAll('.city-item').forEach(item => {
    item.addEventListener('click', () => {
      APP.currentCity = item.textContent.trim();
      document.querySelector('.city-name').textContent = APP.currentCity;
      dropdown.querySelectorAll('.city-item').forEach(i => i.classList.remove('active'));
      item.classList.add('active');
      dropdown.classList.remove('active');
    });
  });
}

// ---- Search ----
function initSearch() {
  const searchInput = document.querySelector('.nav-search-input');
  const suggestions = document.querySelector('.search-suggestions');
  if (!searchInput || !suggestions) return;

  const popularSearches = [
    { icon: '🔧', text: 'Plumber', cat: 'Plumbing Services' },
    { icon: '⚡', text: 'Electrician', cat: 'Electrical Services' },
    { icon: '❄️', text: 'AC Repair', cat: 'AC & Appliances' },
    { icon: '🧹', text: 'Home Cleaning', cat: 'Cleaning Services' },
    { icon: '💇', text: 'Salon at Home', cat: 'Beauty & Salon' },
    { icon: '🎨', text: 'House Painting', cat: 'Painting Services' },
    { icon: '🪚', text: 'Carpenter', cat: 'Carpentry' },
    { icon: '🐛', text: 'Pest Control', cat: 'Pest Control' },
  ];

  searchInput.addEventListener('focus', () => {
    if (!searchInput.value) {
      renderSuggestions(popularSearches);
      suggestions.classList.add('active');
    }
  });

  searchInput.addEventListener('input', () => {
    const q = searchInput.value.toLowerCase();
    if (!q) {
      renderSuggestions(popularSearches);
    } else {
      const filtered = popularSearches.filter(s => 
        s.text.toLowerCase().includes(q) || s.cat.toLowerCase().includes(q)
      );
      renderSuggestions(filtered.length ? filtered : [{ icon: '🔍', text: searchInput.value, cat: 'Search all services' }]);
    }
    suggestions.classList.add('active');
  });

  document.addEventListener('click', (e) => {
    if (!e.target.closest('.nav-search')) {
      suggestions.classList.remove('active');
    }
  });

  function renderSuggestions(items) {
    suggestions.innerHTML = items.map(s => `
      <div class="suggestion-item" onclick="searchService('${s.text}')">
        <div class="suggestion-icon">${s.icon}</div>
        <div>
          <div class="suggestion-text">${s.text}</div>
          <div class="suggestion-category">${s.cat}</div>
        </div>
      </div>
    `).join('');
  }
}

function searchService(query) {
  // Scroll to services or filter
  const section = document.querySelector('.service-section');
  if (section) section.scrollIntoView({ behavior: 'smooth' });
}

// ---- Hero Search ----
function initHeroSearch() {
  const heroSearch = document.querySelector('.hero-search');
  if (!heroSearch) return;
  const input = heroSearch.querySelector('input');
  const btn = heroSearch.querySelector('button');
  if (btn) {
    btn.addEventListener('click', () => {
      if (input && input.value) searchService(input.value);
    });
  }
  // Tag clicks
  document.querySelectorAll('.hero-tag').forEach(tag => {
    tag.addEventListener('click', () => {
      if (input) input.value = tag.textContent;
    });
  });
}

// ---- Scroll Reveal ----
function initScrollReveal() {
  const reveals = document.querySelectorAll('.reveal');
  if (!reveals.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

  reveals.forEach(el => observer.observe(el));
}

// ---- Counter Animation ----
function initCounters() {
  const counters = document.querySelectorAll('[data-count]');
  if (!counters.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateCounter(entry.target);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });

  counters.forEach(el => observer.observe(el));
}

function animateCounter(el) {
  const target = parseInt(el.dataset.count);
  const suffix = el.dataset.suffix || '';
  const prefix = el.dataset.prefix || '';
  const duration = 2000;
  const start = performance.now();

  function update(now) {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const current = Math.floor(eased * target);
    el.textContent = prefix + current.toLocaleString('en-IN') + suffix;
    if (progress < 1) requestAnimationFrame(update);
  }
  requestAnimationFrame(update);
}

// ---- Load & Render Services ----
async function initServiceRows() {
  try {
    const res = await fetch('assets/data/services.json');
    const data = await res.json();
    APP.servicesData = data;
    renderServiceRows(data);
  } catch (e) {
    console.log('Using inline service data');
  }
}

function renderServiceRows(data) {
  if (!data || !data.services) return;
  const categories = data.categories || [];
  
  // Group services by category
  const grouped = {};
  data.services.forEach(s => {
    if (!grouped[s.category]) grouped[s.category] = [];
    grouped[s.category].push(s);
  });

  // Row sections to render
  const rowConfigs = [
    { id: 'most-booked', title: '🔥 Most Booked Services', filter: s => s.reviews > 5000 },
    { id: 'recommended', title: '✨ Recommended For You', filter: s => s.rating >= 4.6 },
    { id: 'cleaning-row', title: '🧹 Cleaning Services', filter: s => s.category === 'cleaning' },
    { id: 'repair-row', title: '🔧 Repair & Maintenance', filter: s => ['plumbing','electrical','carpentry'].includes(s.category) },
    { id: 'salon-row', title: '💇 Salon at Home', filter: s => s.category === 'salon' },
    { id: 'ac-row', title: '❄️ AC & Appliance Repair', filter: s => ['ac-repair','appliance'].includes(s.category) },
    { id: 'painting-row', title: '🎨 Painting & Interiors', filter: s => ['painting','interiors'].includes(s.category) },
    { id: 'budget-row', title: '💰 Budget Friendly Services', filter: s => s.price <= 499 },
    { id: 'trending-row', title: '📈 Trending Near You', filter: s => s.badge && s.badge !== '' },
  ];

  rowConfigs.forEach(config => {
    const container = document.getElementById(config.id);
    if (!container) return;
    const services = data.services.filter(config.filter).slice(0, 12);
    container.innerHTML = services.map(s => createServiceCard(s)).join('');
  });
}

function createServiceCard(s) {
  const stars = '★'.repeat(Math.floor(s.rating)) + (s.rating % 1 >= 0.5 ? '½' : '');
  const badgeHTML = s.badge ? `<div class="service-card-badge"><span class="badge badge-${s.badgeType}">${s.badge}</span></div>` : '';
  
  return `
    <div class="service-card" onclick="openServiceDetail(${s.id})">
      ${badgeHTML}
      <div class="service-card-wishlist" onclick="event.stopPropagation()">♡</div>
      <div class="service-card-img">
        <img src="Images/${s.image}" alt="${s.title}" loading="lazy" onerror="this.src='https://placehold.co/260x170/f1f5f9/94a3b8?text=${encodeURIComponent(s.title)}'">
      </div>
      <div class="service-card-body">
        <div class="service-card-category">${s.category.replace('-',' ')}</div>
        <div class="service-card-title">${s.title}</div>
        <div class="service-card-rating">
          <span class="rating-num">${s.rating}</span>
          <span class="rating-stars">${'★'.repeat(5)}</span>
          <span class="rating-count">(${s.reviews.toLocaleString('en-IN')})</span>
        </div>
        <div class="service-card-meta">
          <span>⏱ ${s.duration}</span>
        </div>
        <div class="service-card-price">
          <span class="price-current">₹${s.price.toLocaleString('en-IN')}</span>
          <span class="price-original">₹${s.originalPrice.toLocaleString('en-IN')}</span>
          <span class="price-discount">${s.discount}% off</span>
        </div>
        <div class="service-card-actions">
          <button class="btn-book" onclick="event.stopPropagation(); bookService(${s.id})">Book Now</button>
          <button class="btn-details">Details</button>
        </div>
      </div>
    </div>
  `;
}

function openServiceDetail(id) {
  // Navigate to booking page
  window.location.href = `customer/booking.html?service=${id}`;
}

function bookService(id) {
  window.location.href = `customer/booking.html?service=${id}&book=1`;
}

// ---- Category Cards ----
function initCategoryCards() {
  const container = document.getElementById('category-cards');
  if (!container) return;

  const categories = [
    { name: 'Cleaning', emoji: '🧹', color: 'blue', count: '28 services', id: 'cleaning' },
    { name: 'Plumbing', emoji: '🔧', color: 'cyan', count: '22 services', id: 'plumbing' },
    { name: 'Electrical', emoji: '⚡', color: 'yellow', count: '25 services', id: 'electrical' },
    { name: 'AC Repair', emoji: '❄️', color: 'blue', count: '20 services', id: 'ac-repair' },
    { name: 'Salon', emoji: '💇', color: 'pink', count: '30 services', id: 'salon' },
    { name: 'Painting', emoji: '🎨', color: 'orange', count: '15 services', id: 'painting' },
    { name: 'Carpentry', emoji: '🪚', color: 'green', count: '18 services', id: 'carpentry' },
    { name: 'Pest Control', emoji: '🐛', color: 'red', count: '12 services', id: 'pest-control' },
    { name: 'Appliances', emoji: '🔌', color: 'purple', count: '24 services', id: 'appliance' },
    { name: 'Shifting', emoji: '📦', color: 'orange', count: '10 services', id: 'shifting' },
    { name: 'Interiors', emoji: '🏠', color: 'green', count: '16 services', id: 'interiors' },
    { name: 'Emergency', emoji: '🚨', color: 'red', count: '8 services', id: 'emergency' },
  ];

  container.innerHTML = categories.map(c => `
    <div class="category-card" onclick="filterByCategory('${c.id}')">
      <div class="category-card-icon ${c.color}">${c.emoji}</div>
      <div class="category-card-title">${c.name}</div>
      <div class="category-card-count">${c.count}</div>
    </div>
  `).join('');
}

function filterByCategory(id) {
  // Scroll to relevant section
  const section = document.querySelector(`[data-category="${id}"]`) || document.querySelector('.service-section');
  if (section) section.scrollIntoView({ behavior: 'smooth' });
}

// ---- Emergency Cards ----
function initEmergencyCards() {
  const container = document.getElementById('emergency-cards');
  if (!container) return;

  const emergencies = [
    { icon: '⚡', title: 'Emergency Electrician', status: '5 available now', desc: 'Short circuit, power failure' },
    { icon: '🔧', title: 'Emergency Plumber', status: '3 available now', desc: 'Pipe burst, water leak' },
    { icon: '❄️', title: 'Emergency AC Repair', status: '4 available now', desc: 'AC not working, gas leak' },
    { icon: '🔑', title: 'Door Lock Emergency', status: '2 available now', desc: 'Locked out, key broken' },
    { icon: '🔥', title: 'Gas Leak Emergency', status: '3 available now', desc: 'LPG leak, stove issue' },
    { icon: '💧', title: 'Water Flooding', status: '2 available now', desc: 'Basement, pipeline burst' },
  ];

  container.innerHTML = emergencies.map(e => `
    <div class="emergency-card" onclick="bookService(85)">
      <div class="emergency-card-icon">${e.icon}</div>
      <div class="emergency-card-info">
        <h4>${e.title}</h4>
        <p>${e.desc}</p>
      </div>
      <div class="emergency-card-status">
        <span class="pulse-dot"></span>
        ${e.status}
      </div>
    </div>
  `).join('');
}

// ---- Mobile Nav ----
function initMobileNav() {
  const toggle = document.querySelector('.nav-mobile-toggle');
  const drawer = document.querySelector('.mobile-drawer');
  const overlay = document.querySelector('.mobile-overlay');
  
  if (toggle && drawer && overlay) {
    toggle.addEventListener('click', () => {
      drawer.classList.add('active');
      overlay.classList.add('active');
    });
    overlay.addEventListener('click', () => {
      drawer.classList.remove('active');
      overlay.classList.remove('active');
    });
  }

  // Bottom nav active state
  document.querySelectorAll('.mobile-nav-item').forEach(item => {
    item.addEventListener('click', function() {
      document.querySelectorAll('.mobile-nav-item').forEach(i => i.classList.remove('active'));
      this.classList.add('active');
    });
  });
}

// ---- Scroll horizontal rows with buttons ----
function scrollRow(btnEl, direction) {
  const row = btnEl.closest('.service-section, .offers-section, .emergency-section, .testimonials-section, .quick-categories')
    ?.querySelector('.scroll-row');
  if (row) {
    row.scrollBy({ left: direction * 300, behavior: 'smooth' });
  }
}

// ---- Toggle Online/Offline (Worker) ----
function toggleOnline() {
  APP.isOnline = !APP.isOnline;
  const toggle = document.querySelector('.toggle-switch');
  const statusDot = document.querySelector('.toggle-status .status-dot');
  const statusText = document.querySelector('.toggle-status .status-text');
  
  if (toggle) toggle.classList.toggle('active', APP.isOnline);
  if (statusDot) statusDot.classList.toggle('online', APP.isOnline);
  if (statusText) {
    statusText.textContent = APP.isOnline ? 'Online' : 'Offline';
    statusText.style.color = APP.isOnline ? 'var(--accent-green)' : 'var(--text-muted)';
  }
}

// ---- Accept / Reject Job ----
function acceptJob(btn) {
  const card = btn.closest('.job-card');
  if (card) {
    card.style.borderLeftColor = 'var(--accent-green)';
    card.innerHTML = `
      <div style="text-align:center;padding:20px;">
        <div style="font-size:2rem;margin-bottom:8px;">✅</div>
        <h4>Job Accepted!</h4>
        <p style="font-size:0.875rem;color:var(--text-muted);">Navigate to customer location</p>
      </div>
    `;
  }
}

function rejectJob(btn) {
  const card = btn.closest('.job-card');
  if (card) {
    card.style.opacity = '0.5';
    card.style.borderLeftColor = 'var(--accent-red)';
    setTimeout(() => card.remove(), 500);
  }
}

// ---- Chart Bars (Worker Earnings) ----
function initEarningsChart() {
  const bars = document.querySelectorAll('.chart-bar');
  bars.forEach(bar => {
    const h = bar.dataset.height;
    if (h) bar.style.height = h + '%';
  });
}

// ---- Toast ----
function showToast(message, type = 'success') {
  const toast = document.createElement('div');
  toast.style.cssText = `
    position: fixed; bottom: 90px; left: 50%; transform: translateX(-50%);
    padding: 12px 24px; border-radius: 12px; font-size: 0.875rem; font-weight: 600;
    z-index: 9999; animation: fadeInUp 0.3s ease; color: #fff;
    background: ${type === 'success' ? 'var(--accent-green)' : type === 'error' ? 'var(--accent-red)' : 'var(--primary)'};
    box-shadow: 0 8px 24px rgba(0,0,0,0.15);
  `;
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// ---- Modal ----
function openModal(id) {
  const modal = document.getElementById(id);
  if (modal) {
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  }
}

function closeModal(id) {
  const modal = document.getElementById(id);
  if (modal) {
    modal.style.display = 'none';
    document.body.style.overflow = '';
  }
}

// ---- Admin chart init ----
function initAdminChart() {
  const bars = document.querySelectorAll('.admin-chart-card .chart-bar');
  bars.forEach(bar => {
    const h = bar.dataset.height;
    if (h) {
      setTimeout(() => {
        bar.style.height = h + '%';
      }, 100);
    }
  });
}

// Auto-init for worker page
if (document.querySelector('.worker-layout')) {
  document.addEventListener('DOMContentLoaded', () => {
    initEarningsChart();
  });
}
// Auto-init for admin page
if (document.querySelector('.admin-layout')) {
  document.addEventListener('DOMContentLoaded', () => {
    initAdminChart();
  });
}
