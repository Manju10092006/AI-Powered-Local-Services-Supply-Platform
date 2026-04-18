const fs = require('fs');
const path = require('path');

const css = `
/* SHIPNOW STYLE WORKER PORTAL */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

:root {
  --bg-color: #f1f5f9;
  --sidebar-bg: #ffffff;
  --card-bg: #ffffff;
  --text-dark: #111827;
  --text-gray: #6b7280;
  --text-light: #9ca3af;
  --border-color: #e5e7eb;
  
  --primary-red: #ef4444;
  --primary-red-light: #fee2e2;
  
  --success-green: #10b981;
  --success-green-light: #d1fae5;
  
  --warning-orange: #f59e0b;
  --warning-orange-light: #fef3c7;

  --rounded-sm: 6px;
  --rounded-md: 10px;
  --rounded-lg: 16px;
  --rounded-xl: 24px;
}

* { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Inter', sans-serif; }
body { background-color: var(--bg-color); color: var(--text-dark); display: flex; height: 100vh; overflow: hidden; }

/* SIDEBAR */
.sn-sidebar {
  width: 260px;
  background-color: var(--sidebar-bg);
  height: 100vh;
  border-right: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  z-index: 50;
}

.sn-logo-area {
  padding: 24px;
  display: flex;
  align-items: center;
  gap: 12px;
}
.sn-logo-icon {
  width: 28px;
  height: 28px;
  background-color: var(--primary-red);
  transform: skew(-15deg);
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.sn-logo-icon::before {
  content: '';
  width: 12px;
  height: 4px;
  background: white;
  transform: skew(15deg);
}
.sn-logo-text {
  font-weight: 800;
  font-size: 20px;
  letter-spacing: -0.5px;
  color: var(--text-dark);
}

.sn-user-profile {
  margin: 0 20px 20px;
  padding: 10px;
  border: 1px solid var(--border-color);
  border-radius: var(--rounded-md);
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  background: #fafafa;
}
.sn-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  object-fit: cover;
}
.sn-user-info { flex: 1; }
.sn-user-name { font-size: 14px; font-weight: 600; color: var(--text-dark); }
.sn-user-role { font-size: 12px; color: var(--text-gray); }

.sn-nav {
  flex: 1;
  overflow-y: auto;
  padding: 0 12px;
}
.sn-nav-item {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 12px 16px;
  margin-bottom: 4px;
  border-radius: var(--rounded-md);
  color: var(--text-gray);
  text-decoration: none;
  font-weight: 500;
  font-size: 14px;
  transition: all 0.2s;
  position: relative;
}
.sn-nav-item:hover {
  background-color: #f9fafb;
  color: var(--text-dark);
}
.sn-nav-item.active {
  background-color: var(--primary-red-light);
  color: var(--primary-red);
}
.sn-nav-item.active::before {
  content: '';
  position: absolute;
  left: 0;
  top: 10%;
  height: 80%;
  width: 4px;
  background-color: var(--primary-red);
  border-radius: 0 4px 4px 0;
}
.sn-nav-icon {
  width: 20px;
  height: 20px;
  stroke-width: 2px;
}

.sn-nav-badge {
  margin-left: auto;
  background-color: var(--primary-red);
  color: white;
  font-size: 11px;
  padding: 2px 6px;
  border-radius: 10px;
  font-weight: 700;
}
.sn-nav-divider {
  height: 1px;
  background-color: var(--border-color);
  margin: 16px 0;
}

.sn-promo {
  margin: 20px;
  padding: 24px;
  background-color: #1e1e1e;
  border-radius: var(--rounded-lg);
  color: white;
  position: relative;
  overflow: hidden;
}
.sn-promo::after {
  content: '';
  position: absolute;
  top: -20px;
  right: -20px;
  width: 100px;
  height: 100px;
  background: linear-gradient(135deg, var(--primary-red) 0%, transparent 100%);
  opacity: 0.5;
  transform: rotate(45deg);
}
.sn-promo h3 { font-size: 18px; margin-bottom: 8px; font-weight: 700; }
.sn-promo p { font-size: 12px; color: #a1a1aa; margin-bottom: 20px; line-height: 1.5; }
.sn-promo-btn {
  background: white;
  color: #1e1e1e;
  border: none;
  padding: 10px 16px;
  border-radius: var(--rounded-sm);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  width: 100%;
}

/* MAIN CONTENT AREA */
.main-content {
  flex: 1;
  overflow-y: auto;
  padding: 32px 40px;
}

/* HEADER */
.sn-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
}
.sn-page-title {
  font-size: 24px;
  font-weight: 700;
  color: var(--text-dark);
}
.sn-breadcrumb {
  font-size: 12px;
  color: var(--text-gray);
  margin-top: 4px;
}
.sn-breadcrumb span { color: var(--primary-red); }
.sn-search-bar {
  display: flex;
  align-items: center;
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  padding: 10px 16px;
  border-radius: var(--rounded-md);
  width: 320px;
}
.sn-search-bar input {
  border: none;
  outline: none;
  background: transparent;
  width: 100%;
  margin-left: 10px;
  font-size: 14px;
  color: var(--text-dark);
}
.sn-search-bar input::placeholder { color: var(--text-gray); }

/* WIDGET GRIDS */
.sn-grid-4 {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-bottom: 24px;
}
.sn-grid-metrics {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 24px;
  margin-bottom: 24px;
}

/* CARDS */
.sn-card {
  background: var(--card-bg);
  border-radius: var(--rounded-lg);
  padding: 24px;
  border: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
}
.sn-card.row-card {
  flex-direction: row;
  align-items: center;
  gap: 20px;
}

.sn-metric-icon {
  width: 48px;
  height: 48px;
  border-radius: var(--rounded-md);
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--primary-red);
  color: white;
}
.sn-metric-info {
  flex: 1;
}
.sn-metric-label {
  font-size: 13px;
  color: var(--text-gray);
  font-weight: 500;
  margin-bottom: 6px;
  display: flex;
  justify-content: space-between;
}
.sn-metric-val {
  font-size: 28px;
  font-weight: 700;
  color: var(--text-dark);
  margin-bottom: 4px;
}
.sn-metric-sub {
  font-size: 11px;
  color: var(--text-gray);
}
.sn-metric-sub span { font-weight: 600; padding: 2px 6px; border-radius: 4px; margin-left: 4px; }
.sn-metric-sub span.up { background: var(--success-green-light); color: var(--success-green); }
.sn-metric-sub span.down { background: var(--primary-red-light); color: var(--primary-red); }

/* FILTERS & BUTTONS */
.sn-section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}
.sn-section-title {
  font-size: 18px;
  font-weight: 600;
}
.sn-btn {
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  padding: 8px 16px;
  border-radius: var(--rounded-sm);
  font-size: 13px;
  font-weight: 600;
  color: var(--text-dark);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}
.sn-btn.primary {
  background: var(--text-dark);
  color: white;
  border-color: var(--text-dark);
}
.sn-btn-group {
  display: flex;
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: var(--rounded-sm);
  overflow: hidden;
}
.sn-btn-group .sn-btn {
  border: none;
  border-radius: 0;
  border-right: 1px solid var(--border-color);
  background: transparent;
}
.sn-btn-group .sn-btn:last-child { border-right: none; }
.sn-btn-group .sn-btn.active {
  background: var(--text-dark);
  color: white;
}

/* TABLES & LISTS */
.sn-table-wrap {
  width: 100%;
  border-collapse: collapse;
}
.sn-table {
  width: 100%;
  text-align: left;
}
.sn-table th {
  padding: 16px 0;
  border-bottom: 2px solid var(--border-color);
  font-size: 12px;
  font-weight: 600;
  color: var(--text-gray);
}
.sn-table td {
  padding: 16px 0;
  border-bottom: 1px solid var(--border-color);
  font-size: 13px;
  vertical-align: middle;
}
.sn-table tr:hover td {
  background-color: #fafafa;
}
.sn-table tr.highlight td {
  background-color: var(--primary-red-light);
}
.sn-table .sn-id { font-weight: 600; color: #1e1e1e; }
.sn-table .sn-id.red { color: var(--primary-red); }

/* TAGS */
.sn-tag {
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
}
.sn-tag.paid { background: var(--success-green-light); color: var(--success-green); }
.sn-tag.unpaid { background: var(--primary-red-light); color: var(--primary-red); }
.sn-tag.pending { background: #f3f4f6; color: #4b5563; }
.sn-tag.overdue { border: 1px solid var(--primary-red); color: var(--primary-red); background: transparent; }

/* INVOICE DETAIL PANEL (Right side in earnings) */
.sn-detail-panel {
  background: var(--card-bg);
  border-radius: var(--rounded-lg);
  padding: 24px;
  border: 1px solid var(--border-color);
}
.sn-dp-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 24px;
}

/* PROGRESS BAR */
.progress-track {
  width: 100px;
  height: 6px;
  background: var(--border-color);
  border-radius: 3px;
  display: inline-block;
  margin-right: 12px;
}
.progress-fill {
  height: 100%;
  background: var(--primary-red);
  border-radius: 3px;
}

/* FLEET CIRCLE GRAPH (Dashboard) */
.fleet-circle {
  width: 200px;
  height: 200px;
  border-radius: 50%;
  border: 24px solid var(--border-color);
  border-left-color: var(--primary-red);
  border-top-color: var(--text-dark);
  margin: 0 auto 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
}
.fleet-circle h2 { font-size: 32px; font-weight: 800; }
.fleet-circle p { font-size: 12px; color: var(--text-gray); }

/* Map Wrapper */
.sn-map-wrap {
  width: 100%;
  height: 350px;
  background: #e2e8f0;
  border-radius: var(--rounded-md);
  margin-bottom: 20px;
  background-image: url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+PHBhdGggZD0iTTAgMGg0MHY0MEgwVjB6bTIwIDIwYzAgNS41MjMgNC40NzcgMTAgMTAgMTBTMzAgMjUuNTIzIDMwIDIwIDI1LjUyMyAxMCAyMCAxMCAxMCAxNC40NzcgMTAgMjBzNC40NzcgMTAgMTAgMTB6IiBmaWxsPSIjY2JkNWUxIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiLz48L3N2Zz4=');
  position: relative;
}

`;

const sidebarHtml = `
<aside class="sn-sidebar">
  <div class="sn-logo-area">
    <div class="sn-logo-icon"></div>
    <div class="sn-logo-text">FIXMATE PRO</div>
  </div>
  
  <div class="sn-user-profile">
    <img src="../Images/img_4.jpeg" alt="Avatar" class="sn-avatar" onerror="this.src='https://placehold.co/100?text=JD'">
    <div class="sn-user-info">
      <div class="sn-user-name">John Doe</div>
      <div class="sn-user-role">Worker Level</div>
    </div>
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6b7280" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
  </div>

  <nav class="sn-nav">
    <a href="dashboard.html" class="sn-nav-item dash-menu-item" data-id="dashboard">
      <svg class="sn-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect x="3" y="3" width="7" height="9" rx="1"></rect><rect x="14" y="3" width="7" height="5" rx="1"></rect><rect x="14" y="12" width="7" height="9" rx="1"></rect><rect x="3" y="16" width="7" height="5" rx="1"></rect></svg>
      Dashboard
    </a>
    <a href="jobs.html" class="sn-nav-item dash-menu-item" data-id="jobs">
      <svg class="sn-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>
      Jobs & Shipments
    </a>
    <a href="earnings.html" class="sn-nav-item dash-menu-item" data-id="earnings">
      <svg class="sn-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
      Invoices & Billing
    </a>
    <a href="availability.html" class="sn-nav-item dash-menu-item" data-id="availability">
      <svg class="sn-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
      Calendar
    </a>
    <a href="tracking.html" class="sn-nav-item dash-menu-item" data-id="tracking">
      <svg class="sn-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
      Tracking
    </a>
    <a href="tools-store.html" class="sn-nav-item dash-menu-item" data-id="tools-store">
      <svg class="sn-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
      Drivers / Workers
    </a>
    <a href="profile.html" class="sn-nav-item dash-menu-item" data-id="profile">
      <svg class="sn-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
      Warehouse
    </a>

    <div class="sn-nav-divider"></div>

    <a href="messages.html" class="sn-nav-item dash-menu-item" data-id="messages">
      <svg class="sn-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
      Message
      <span class="sn-nav-badge">19</span>
    </a>
    <a href="notifications.html" class="sn-nav-item dash-menu-item" data-id="notifications">
      <svg class="sn-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
      Notification
      <span class="sn-nav-badge" style="background-color: var(--warning-orange);">5</span>
    </a>
    <a href="settings.html" class="sn-nav-item dash-menu-item" data-id="settings">
      <svg class="sn-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
      Settings
    </a>
  </nav>

  <div class="sn-promo">
    <h3>Loving<br>FixMate<br>Free?</h3>
    <p>Go Pro to access priority support, real-time tracking, and full analytics.</p>
    <button class="sn-promo-btn">Go Pro Today</button>
  </div>
</aside>
`;

fs.writeFileSync(path.join(__dirname, 'assets/css/worker-shipnow.css'), css, 'utf8');
console.log('Saved assets/css/worker-shipnow.css');

const pages = ['dashboard.html', 'jobs.html', 'earnings.html', 'availability.html', 'profile.html', 'tools-store.html'];

for (const page of pages) {
  const p = path.join(__dirname, 'worker', page);
  if (fs.existsSync(p)) {
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>FixMate Pro — ${page.replace('.html', '')}</title>
  <link rel="stylesheet" href="../assets/css/worker-shipnow.css">
</head>
<body>
  ${sidebarHtml}
  <main class="main-content">
    <div id="page-content-mount">
      <div style="padding: 100px; text-align: center; color: #9ca3af; font-size: 20px;">
        Loading data for ${page.replace('.html', '')}...
      </div>
    </div>
  </main>
  
  <script src="../assets/js/api.js"></script>
  <script src="../assets/js/main.js"></script>
  <script>
    // Update active nav based on page name
    document.querySelectorAll('.dash-menu-item').forEach(el => el.classList.remove('active'));
    const act = document.querySelector('.dash-menu-item[data-id="${page.replace('.html', '')}"]');
    if (act) act.classList.add('active');
  </script>
</body>
</html>`;
    fs.writeFileSync(p, html, 'utf8');
    console.log('Overwrote', p);
  }
}
