/**
 * FixMate Worker Pro — shared sidebar + mobile nav (vanilla).
 * Call WorkerPro.init({ page: 'dashboard' }) after DOM ready; requires #wp-sidebar and optional #wp-mobile-nav.
 */
(function () {
  const ICON = {
    home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>',
    jobs: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>',
    cal: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>',
    money: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>',
    wallet: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>',
    chart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 20V10M12 20V4M6 20v-6"/></svg>',
    alert: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>',
    msg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',
    star: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>',
    file: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>',
    gear: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>',
    map: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></svg>',
    tool: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>'
  };

  const ITEMS = [
    { id: "dashboard", href: "dashboard.html", label: "Dashboard", icon: "home" },
    { id: "jobs", href: "jobs.html", label: "Jobs", icon: "jobs" },
    { id: "schedule", href: "schedule.html", label: "Schedule", icon: "cal" },
    { id: "earnings", href: "earnings.html", label: "Earnings", icon: "money" },
    { id: "wallet", href: "wallet.html", label: "Wallet", icon: "wallet" },
    { id: "performance", href: "performance.html", label: "Performance", icon: "chart" },
    { id: "claims", href: "claims.html", label: "Claims", icon: "alert" },
    { id: "messages", href: "messages.html", label: "Messages", icon: "msg" },
    { id: "reviews", href: "reviews.html", label: "Reviews", icon: "star" },
    { id: "documents", href: "documents.html", label: "Documents", icon: "file" },
    { id: "tracking", href: "tracking.html", label: "Live tracking", icon: "map" },
    { id: "availability", href: "availability.html", label: "Availability", icon: "cal" },
    { id: "tools", href: "tools-store.html", label: "Tools store", icon: "tool" },
    { id: "profile", href: "profile.html", label: "Settings", icon: "gear" }
  ];

  function linkHtml(item, activeId) {
    const active = item.id === activeId ? " active" : "";
    const ic = ICON[item.icon] || ICON.home;
    return `<a class="wp-nav-link${active}" href="${item.href}">${ic}<span>${item.label}</span></a>`;
  }

  function sidebarHtml(activeId, user) {
    const name = (user && user.name) || "Worker";
    const initials = name
      .split(/\s+/)
      .map(p => p[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
    const mainIds = new Set([
      "dashboard",
      "jobs",
      "schedule",
      "earnings",
      "wallet",
      "performance",
      "claims",
      "messages",
      "reviews",
      "documents",
      "tracking"
    ]);
    const main = ITEMS.filter(i => mainIds.has(i.id));
    const rest = ITEMS.filter(i => !mainIds.has(i.id));
    return `
      <a class="wp-brand" href="../index.html">
        <span class="wp-brand-mark">FM</span>
        <span class="wp-brand-text">FixMate <span>Pro</span></span>
      </a>
      <div class="wp-user-card">
        <div class="wp-user-avatar">${initials}</div>
        <div class="wp-user-meta">
          <div class="wp-user-name">${escapeHtml(name)}</div>
          <div class="wp-user-role">Service professional</div>
        </div>
      </div>
      <nav class="wp-nav">
        <div class="wp-nav-label">Menu</div>
        ${main.map(i => linkHtml(i, activeId)).join("")}
        <div class="wp-nav-label">More</div>
        ${rest.map(i => linkHtml(i, activeId)).join("")}
      </nav>
      <div class="wp-sidebar-pro">
        <p>Unlock priority dispatch, lower platform fees, and Pro badge on your profile.</p>
        <button type="button" class="wp-btn-pro" onclick="if(typeof showToast==='function')showToast('Pro coming soon','success')">Go Pro</button>
      </div>
    `;
  }

  function mobileHtml(activeId) {
    const mob = [
      { id: "dashboard", href: "dashboard.html", label: "Home", icon: "home" },
      { id: "jobs", href: "jobs.html", label: "Jobs", icon: "jobs" },
      { id: "earnings", href: "earnings.html", label: "Earn", icon: "money" },
      { id: "messages", href: "messages.html", label: "Chat", icon: "msg" },
      { id: "profile", href: "profile.html", label: "Profile", icon: "gear" }
    ];
    return mob
      .map(m => {
        const ac = m.id === activeId ? " active" : "";
        return `<a class="${ac}" href="${m.href}">${ICON[m.icon]}${m.label}</a>`;
      })
      .join("");
  }

  function escapeHtml(s) {
    return String(s || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function init(opts) {
    const page = (opts && opts.page) || "dashboard";
    const sb = document.getElementById("wp-sidebar");
    if (sb) {
      const user = typeof Auth !== "undefined" && Auth.getUser ? Auth.getUser() : null;
      sb.innerHTML = sidebarHtml(page, user);
    }
    const mn = document.getElementById("wp-mobile-nav");
    if (mn) mn.innerHTML = mobileHtml(page);
  }

  window.WorkerPro = { init };
})();
