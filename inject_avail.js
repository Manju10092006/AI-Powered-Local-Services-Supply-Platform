const fs = require('fs');
const path = require('path');

const contentHtml = `
    <div class="sn-header">
      <div>
        <h1 class="sn-page-title">Calendar & Schedule</h1>
        <div class="sn-breadcrumb">Dashboard / <span>Calendar</span></div>
      </div>
      <div>
        <button class="sn-btn primary">Add Schedule</button>
      </div>
    </div>

    <div class="sn-card" style="min-height: 500px; display:flex; align-items:center; justify-content:center; flex-direction:column; gap:20px;">
      <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#e5e7eb" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
      <div style="font-size:18px; font-weight:600; color:var(--text-gray);">Calendar View</div>
      <p style="color:#9ca3af; font-size:13px;">Manage your availability and shifts here.</p>
    </div>
`;
let file = fs.readFileSync(path.join(__dirname, 'worker/availability.html'), 'utf8');
file = file.replace(/<div id="page-content-mount">[\s\S]*?<\/div>/, `<div id="page-content-mount">\n${contentHtml}\n</div>`);
fs.writeFileSync(path.join(__dirname, 'worker/availability.html'), file, 'utf8');
console.log('Injected availability content.');
