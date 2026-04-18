const fs = require('fs');
const path = require('path');

const custDir = path.join(__dirname, 'customer');
const files = ['booking.html', 'cart.html', 'claims.html', 'history.html', 'profile.html', 'track.html'];

const newHead = `
  <!-- Add Instrument Serif and Inter fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <style>
    /* Premium SaaS Reset & Tokens */
    :root {
      --bg: #FAFAFA; --surface: #FFFFFF; --surface-frosted: rgba(255, 255, 255, 0.75);
      --fg: #111827; --fg-muted: #6B7280; --border: #F3F4F6; --border-strong: #E5E7EB;
      --accent: #5B7AF7; --accent-light: #EFF2FE; --success: #10B981; --warning: #F59E0B;
      --font-display: 'Instrument Serif', serif; --font-body: 'Inter', sans-serif;
      --radius-sm: 8px; --radius-md: 12px; --radius-lg: 20px; --radius-xl: 32px;
      --shadow-sm: 0 1px 3px rgba(0,0,0,0.05); --shadow-md: 0 10px 25px -5px rgba(0,0,0,0.02), 0 4px 10px -5px rgba(0,0,0,0.01);
      --shadow-lg: 0 20px 40px -10px rgba(0,0,0,0.05); --shadow-glow: 0 10px 30px -10px rgba(91,122,247,0.3);
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: var(--font-body); background-color: var(--bg); color: var(--fg); line-height: 1.5; -webkit-font-smoothing: antialiased; background-image: radial-gradient(circle at 100% 0%, rgba(91,122,247,0.04) 0%, transparent 25%), radial-gradient(circle at 0% 100%, rgba(91,122,247,0.03) 0%, transparent 20%); background-attachment: fixed; }
    .app-container { display: flex; min-height: 100vh; max-width: 1600px; margin: 0 auto; }
    .sidebar { width: 260px; background: var(--surface); border-right: 1px solid var(--border); display: flex; flex-direction: column; position: sticky; top: 0; height: 100vh; z-index: 50; }
    .brand { height: 80px; display: flex; align-items: center; padding: 0 24px; font-family: var(--font-display); font-size: 28px; font-style: italic; color: var(--fg); letter-spacing: -0.5px; border-bottom: 1px solid var(--border); text-decoration: none; }
    .nav-menu { padding: 24px 12px; flex: 1; display: flex; flex-direction: column; gap: 4px; }
    .nav-item { display: flex; align-items: center; gap: 12px; padding: 10px 16px; border-radius: var(--radius-sm); color: var(--fg-muted); text-decoration: none; font-weight: 500; font-size: 14px; transition: all 0.2s ease; }
    .nav-item svg { width: 18px; height: 18px; opacity: 0.7; }
    .nav-item:hover { background: var(--bg); color: var(--fg); }
    .nav-item.active { background: var(--accent-light); color: var(--accent); }
    .nav-item.active svg { opacity: 1; stroke: var(--accent); }
    .sidebar-footer { padding: 24px; border-top: 1px solid var(--border); }
    .user-profile { display: flex; align-items: center; gap: 12px; cursor: pointer; }
    .avatar { width: 40px; height: 40px; border-radius: 50%; background: linear-gradient(135deg, var(--accent), #9b87f5); color: white; display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 14px; box-shadow: 0 4px 12px rgba(91,122,247,0.2); }
    .user-info .name { font-weight: 600; font-size: 14px; color: var(--fg); }
    .user-info .plan { font-size: 12px; color: var(--accent); font-weight: 500; display:flex; align-items:center; gap:4px; }
    .main-content { flex: 1; padding: 40px 48px; overflow-y: auto; }
    /* Legacy dash-header mapping for imported pages */
    .dash-header { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 40px; }
    .dash-header h1 { font-family: var(--font-display); font-size: 48px; font-weight: 400; letter-spacing: -1px; line-height: 1.1; margin-bottom: 8px; }
    .dash-header p, .dash-header .subtitle { color: var(--fg-muted); font-size: 15px; }
    .bg-shape { position: fixed; top: -20vh; right: -10vw; width: 60vw; height: 60vw; border-radius: 50%; background: radial-gradient(circle, rgba(91,122,247,0.08) 0%, transparent 60%); pointer-events: none; z-index: -1; filter: blur(40px); }
    
    /* Legacy Buttons mapped to modern style */
    .btn { display: inline-flex; align-items: center; justify-content: center; gap: 8px; padding: 10px 20px; border-radius: 100px; font-weight: 500; font-size: 14px; cursor: pointer; transition: all 0.2s ease; text-decoration: none; border: 1px solid transparent; }
    .btn-primary { background: var(--fg); color: white; box-shadow: 0 4px 14px rgba(0,0,0,0.1); }
    .btn-primary:hover { background: #000; transform: translateY(-1px); box-shadow: 0 6px 20px rgba(0,0,0,0.15); }
    .btn-secondary, .btn-outline { background: white; border-color: var(--border-strong); color: var(--fg); }
    .btn-secondary:hover, .btn-outline:hover { background: var(--bg); border-color: #d1d5db; }
    
    .list-item, .glass-card { background: var(--surface-frosted); backdrop-filter: blur(20px); border: 1px solid rgba(255, 255, 255, 0.4); border-radius: var(--radius-lg); padding: 24px; box-shadow: var(--shadow-md); margin-bottom: 16px; }
    .badge { display: inline-flex; align-items: center; padding: 4px 10px; border-radius: 100px; font-size: 12px; font-weight: 500; }
    .badge-success { background: rgba(16,185,129,0.1); color: var(--success); }
    .badge-warning { background: rgba(245,158,11,0.1); color: var(--warning); }
    .badge-danger { background: rgba(239,68,68,0.1); color: #EF4444; }
    .input { border: 1px solid var(--border-strong); border-radius: var(--radius-sm); padding: 8px 12px; font-family: var(--font-body); }
    
    @media (max-width: 768px) { .sidebar { display: none; } .main-content { padding: 24px 20px; } }
  </style>
`;

const newSidebar = `
<div class="bg-shape"></div>
<div class="app-container">
  <!-- Sleek Sidebar -->
  <aside class="sidebar">
    <a href="../index.html" class="brand">FixMate</a>
    <nav class="nav-menu">
      <a href="dashboard.html" class="nav-item dm-dashboard">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="9" rx="1"></rect><rect x="14" y="3" width="7" height="5" rx="1"></rect><rect x="14" y="12" width="7" height="9" rx="1"></rect><rect x="3" y="16" width="7" height="5" rx="1"></rect></svg>
        Overview
      </a>
      <a href="booking.html" class="nav-item dm-booking">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"></path></svg>
        Book Service
      </a>
      <a href="history.html" class="nav-item dm-history">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
        History
      </a>
      <a href="track.html" class="nav-item dm-track">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
        Track Worker
      </a>
      <a href="claims.html" class="nav-item dm-claims">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
        Protection
      </a>
      <a href="profile.html" class="nav-item dm-profile">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
        Settings
      </a>
    </nav>
    <div class="sidebar-footer">
      <div class="user-profile" onclick="Auth.logout()">
        <div class="avatar" id="sidebar-avatar">M</div>
        <div class="user-info">
          <div class="name" id="sidebar-name">Manjunath</div>
          <div class="plan"><svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg> Premium Member</div>
        </div>
      </div>
    </div>
  </aside>
  <main class="main-content">
`;

files.forEach(file => {
  const p = path.join(custDir, file);
  if (!fs.existsSync(p)) return;
  let content = fs.readFileSync(p, 'utf8');

  content = content.replace(/<nav class="navbar".*?<\/nav>/s, '');
  content = content.replace(/<aside class="dash-sidebar".*?<\/aside>/s, '');

  content = content.replace(/<div class="dashboard-layout">/, newSidebar);
  content = content.replace(/<main class="dash-main">/, '');
  
  content = content.replace(/<link rel="stylesheet" href="\.\.\/assets\/css\/navbar\.css">/g, '');
  content = content.replace(/<link rel="stylesheet" href="\.\.\/assets\/css\/customer\.css">/g, '');
  
  if (!content.includes('Instrument Serif')) {
      content = content.replace(/<\/title>/, '<\/title>' + newHead);
  }
  
  let name = file.replace('.html', '');
  const activeScript = "<script>\n" +
    "    document.querySelectorAll('.nav-item').forEach(el=>el.classList.remove('active'));\n" +
    "    let act = document.querySelector('.dm-" + name + "');\n" +
    "    if(act) act.classList.add('active');\n" +
    "  </script>\n";
    
  if (!content.includes("document.querySelector('.dm-" + name + "')")) {
    content = content.replace('</body>', activeScript + '</body>');
  }

  content = content.replace(/background:#fff;border-radius:var\(--radius-lg\);padding:24px;border:1px solid var\(--border-light\)/g, 'background:var(--surface-frosted);border-radius:var(--radius-lg);padding:24px;border:1px solid rgba(255,255,255,0.4);box-shadow:var(--shadow-md)');
  
  fs.writeFileSync(p, content, 'utf8');
  console.log('Updated ' + file);
});

const mainJsPath = path.join(__dirname, 'assets', 'js', 'main.js');
let mainjs = fs.readFileSync(mainJsPath, 'utf8');
mainjs = mainjs.replace(/const oldMain = document\.querySelector\('\.dash-main'\);/g, "const oldMain = document.querySelector('.main-content');");
mainjs = mainjs.replace(/const newMain = doc\.querySelector\('\.dash-main'\);/g, "const newMain = doc.querySelector('.main-content');");
fs.writeFileSync(mainJsPath, mainjs, 'utf8');
console.log('Updated main.js SPA router');
