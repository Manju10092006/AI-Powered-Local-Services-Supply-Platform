const fs = require('fs');
const path = require('path');

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

const dir = path.join(__dirname, 'worker');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));

for (const file of files) {
  const p = path.join(dir, file);
  let content = fs.readFileSync(p, 'utf8');
  if (!content.includes('worker-shipnow.css')) {
    const pageId = file.replace('.html', '');
    const titleCase = pageId.charAt(0).toUpperCase() + pageId.slice(1);
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>FixMate Pro — ${titleCase}</title>
  <link rel="stylesheet" href="../assets/css/worker-shipnow.css">
</head>
<body>
  ${sidebarHtml}
  <main class="main-content">
    <div id="page-content-mount">
      <div class="sn-header">
        <div>
          <h1 class="sn-page-title">${titleCase}</h1>
          <div class="sn-breadcrumb">Dashboard / <span>${titleCase}</span></div>
        </div>
      </div>
      <div class="sn-card" style="min-height: 500px; display:flex; align-items:center; justify-content:center; flex-direction:column; gap:20px;">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#e5e7eb" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
        <div style="font-size:18px; font-weight:600; color:var(--text-gray);">${titleCase} Space</div>
        <p style="color:#9ca3af; font-size:13px;">This module will be ready soon.</p>
      </div>
    </div>
  </main>
  
  <script src="../assets/js/api.js"></script>
  <script src="../assets/js/main.js"></script>
  <script>
    document.querySelectorAll('.dash-menu-item').forEach(el => el.classList.remove('active'));
    const act = document.querySelector('.dash-menu-item[data-id="${pageId}"]');
    if (act) act.classList.add('active');
  </script>
</body>
</html>`;
    fs.writeFileSync(p, html, 'utf8');
    console.log('Fixed', p);
  }
}
