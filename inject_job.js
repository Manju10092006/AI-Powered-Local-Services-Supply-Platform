const fs = require('fs');
const path = require('path');

const contentHtml = `
    <div class="sn-header">
      <div>
        <h1 class="sn-page-title">Jobs & Shipments</h1>
        <div class="sn-breadcrumb">Dashboard / <span>Jobs & Shipments</span></div>
      </div>
      <div>
        <div class="sn-search-bar" style="width:320px;">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          <input type="text" placeholder="Search shipments, clients...">
        </div>
      </div>
    </div>

    <!-- 4 Metrics above -->
    <div class="sn-grid-4">
      <div class="sn-card row-card">
        <div class="sn-metric-icon" style="background:#111827;">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
        </div>
        <div class="sn-metric-info">
          <div class="sn-metric-label">Total Jobs</div>
          <div class="sn-metric-val">12,450</div>
          <div class="sn-metric-sub" style="display:flex; gap:8px;">
            <div style="flex:1;"><div class="progress-track" style="width:100%;"><div class="progress-fill" style="width:80%;"></div></div></div>
            <span style="background:var(--success-green-light); color:var(--success-green);">+8.2%</span>
          </div>
        </div>
      </div>
      
      <div class="sn-card row-card">
        <div class="sn-metric-icon" style="background:#f59e0b;">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14"></path><path d="M12 5l7 7-7 7"></path></svg>
        </div>
        <div class="sn-metric-info">
          <div class="sn-metric-label">En-Route / Going</div>
          <div class="sn-metric-val">3,120</div>
          <div class="sn-metric-sub" style="display:flex; gap:8px;">
            <div style="flex:1;"><div class="progress-track" style="width:100%;"><div class="progress-fill" style="width:40%; background:#f59e0b;"></div></div></div>
            <span style="background:var(--warning-orange-light); color:var(--warning-orange);">41.2%</span>
          </div>
        </div>
      </div>
      
      <div class="sn-card row-card">
        <div class="sn-metric-icon" style="background:var(--primary-red);">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path><polyline points="13 2 13 9 20 9"></polyline></svg>
        </div>
        <div class="sn-metric-info">
          <div class="sn-metric-label">In Progress</div>
          <div class="sn-metric-val">4,080</div>
          <div class="sn-metric-sub" style="display:flex; gap:8px;">
            <div style="flex:1;"><div class="progress-track" style="width:100%;"><div class="progress-fill" style="width:50%; background:var(--primary-red);"></div></div></div>
            <span style="background:var(--primary-red-light); color:var(--primary-red);">52.3%</span>
          </div>
        </div>
      </div>
      
      <div class="sn-card row-card">
        <div class="sn-metric-icon" style="background:var(--success-green);">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
        </div>
        <div class="sn-metric-info">
          <div class="sn-metric-label">Completed Jobs</div>
          <div class="sn-metric-val">5,250</div>
          <div class="sn-metric-sub" style="display:flex; gap:8px;">
            <div style="flex:1;"><div class="progress-track" style="width:100%;"><div class="progress-fill" style="width:90%; background:var(--success-green);"></div></div></div>
            <span style="background:var(--success-green-light); color:var(--success-green);">86.4%</span>
          </div>
        </div>
      </div>
    </div>

    <!-- MAIN TWO COLUMNS -->
    <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 24px;">
      
      <!-- SHIPMENTS TABLE -->
      <div class="sn-card" style="padding:0;">
        <div class="sn-section-header" style="padding:24px 24px 0; border-bottom:1px solid var(--border-color); padding-bottom:16px;">
          <h3 class="sn-section-title">Latest Job Requests</h3>
          <div style="display:flex; gap:12px;">
            <div class="sn-btn-group">
              <button class="sn-btn active">View All</button>
              <button class="sn-btn">Completed</button>
              <button class="sn-btn">In Transit</button>
              <button class="sn-btn">Pending</button>
            </div>
            <button class="sn-btn"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg> Filters</button>
          </div>
        </div>
        
        <div style="padding:0 24px 24px; overflow-x:auto;">
          <table class="sn-table">
            <thead>
              <tr>
                <th>Job ID v</th>
                <th>Client Name v</th>
                <th>Route Info v</th>
                <th>Vehicle Type v</th>
                <th>Status v</th>
              </tr>
            </thead>
            <tbody>
              <!-- Row 1 -->
              <tr>
                <td class="sn-id">#SH900382<br><span style="font-size:10px; color:var(--text-gray); font-weight:400;">Just now</span></td>
                <td><div style="display:flex;align-items:center;gap:8px;font-weight:600;"><img src="https://placehold.co/100?text=JD" style="width:24px;height:24px;border-radius:50%;"> John Doe</div></td>
                <td>
                  <div style="font-size:12px; font-weight:600;">JFK Airport -> Brooklyn</div>
                  <div style="font-size:10px; color:var(--text-gray);">14 miles • Est 45m</div>
                </td>
                <td><span style="font-size:12px; background:#f3f4f6; padding:4px 8px; border-radius:4px; font-weight:500;">Flatbed Truck</span></td>
                <td><span class="sn-tag paid" style="background:#dbeafe; color:#2563eb;">In Transit</span></td>
              </tr>
              <!-- Row 2 -->
              <tr>
                <td class="sn-id">#SH892374<br><span style="font-size:10px; color:var(--text-gray); font-weight:400;">10m ago</span></td>
                <td><div style="display:flex;align-items:center;gap:8px;font-weight:600;"><img src="https://placehold.co/100?text=AM" style="width:24px;height:24px;border-radius:50%;"> Alice Miller</div></td>
                <td>
                  <div style="font-size:12px; font-weight:600;">Port Newark -> Manhattan</div>
                  <div style="font-size:10px; color:var(--text-gray);">22 miles • Est 1h 15m</div>
                </td>
                <td><span style="font-size:12px; background:#f3f4f6; padding:4px 8px; border-radius:4px; font-weight:500;">Cargo Van</span></td>
                <td><span class="sn-tag" style="background:var(--success-green-light); color:var(--success-green);">Delivered</span></td>
              </tr>
              <!-- Row 3 -->
              <tr>
                <td class="sn-id">#SH844732<br><span style="font-size:10px; color:var(--text-gray); font-weight:400;">35m ago</span></td>
                <td><div style="display:flex;align-items:center;gap:8px;font-weight:600;"><img src="https://placehold.co/100?text=RT" style="width:24px;height:24px;border-radius:50%;"> Robert Tran</div></td>
                <td>
                  <div style="font-size:12px; font-weight:600;">Queens -> Bronx</div>
                  <div style="font-size:10px; color:var(--text-gray);">18 miles • Est 50m</div>
                </td>
                <td><span style="font-size:12px; background:#f3f4f6; padding:4px 8px; border-radius:4px; font-weight:500;">Box Truck</span></td>
                <td><span class="sn-tag unpaid" style="background:var(--primary-red-light); color:var(--primary-red);">Delayed</span></td>
              </tr>
              <!-- Row 4 -->
              <tr>
                <td class="sn-id">#SH822941<br><span style="font-size:10px; color:var(--text-gray); font-weight:400;">1h ago</span></td>
                <td><div style="display:flex;align-items:center;gap:8px;font-weight:600;"><img src="https://placehold.co/100?text=SK" style="width:24px;height:24px;border-radius:50%;"> Sarah Kim</div></td>
                <td>
                  <div style="font-size:12px; font-weight:600;">Staten Island -> Newark</div>
                  <div style="font-size:10px; color:var(--text-gray);">12 miles • Est 35m</div>
                </td>
                <td><span style="font-size:12px; background:#f3f4f6; padding:4px 8px; border-radius:4px; font-weight:500;">Step Van</span></td>
                <td><span class="sn-tag paid" style="background:#fef3c7; color:#d97706;">Pending</span></td>
              </tr>
              <!-- Row 5 -->
              <tr>
                <td class="sn-id">#SH811234<br><span style="font-size:10px; color:var(--text-gray); font-weight:400;">3h ago</span></td>
                <td><div style="display:flex;align-items:center;gap:8px;font-weight:600;"><img src="https://placehold.co/100?text=PL" style="width:24px;height:24px;border-radius:50%;"> Paul Lee</div></td>
                <td>
                  <div style="font-size:12px; font-weight:600;">Hoboken -> Jersey City</div>
                  <div style="font-size:10px; color:var(--text-gray);">4 miles • Est 15m</div>
                </td>
                <td><span style="font-size:12px; background:#f3f4f6; padding:4px 8px; border-radius:4px; font-weight:500;">Sprinter Van</span></td>
                <td><span class="sn-tag" style="background:var(--success-green-light); color:var(--success-green);">Delivered</span></td>
              </tr>
            </tbody>
          </table>
          <div style="display:flex; justify-content:space-between; align-items:center; margin-top:16px;">
            <div style="font-size:12px; color:var(--text-gray);">Showing 1 to 5 of 124 entries</div>
            <div style="display:flex; gap:4px;">
              <button class="sn-btn" style="padding:4px 8px;">&lt;</button>
              <button class="sn-btn active" style="padding:4px 8px; background:var(--text-dark); color:white;">1</button>
              <button class="sn-btn" style="padding:4px 8px;">2</button>
              <button class="sn-btn" style="padding:4px 8px;">3</button>
              <button class="sn-btn" style="padding:4px 8px;">&gt;</button>
            </div>
          </div>
        </div>
      </div>

      <!-- MAP PANEL -->
      <div class="sn-card">
        <div class="sn-section-header" style="margin-bottom:16px;">
          <h3 class="sn-section-title">Live Tracking</h3>
          <button class="sn-btn" style="padding:4px 8px;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 3 21 3 21 9"></polyline><polyline points="9 21 3 21 3 15"></polyline><line x1="21" y1="3" x2="14" y2="10"></line><line x1="3" y1="21" x2="10" y2="14"></line></svg></button>
        </div>
        
        <div class="sn-map-wrap" style="height: 400px; margin-bottom:16px;">
          <img src="https://images.unsplash.com/photo-1524661135-423995f22d0b?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80" alt="Map" style="width:100%; height:100%; object-fit:cover; border-radius:8px;">
        </div>

        <div style="font-weight:600; font-size:14px; margin-bottom:12px;">Active Fleet Area</div>
        
        <div style="display:flex; flex-direction:column; gap:12px;">
          <div style="display:flex; justify-content:space-between; align-items:center; padding-bottom:12px; border-bottom:1px solid #f3f4f6;">
            <div style="display:flex; align-items:center; gap:8px;">
              <div style="width:8px; height:8px; border-radius:50%; background:#2563eb;"></div>
              <span style="font-size:13px; font-weight:500;">North Zone Route</span>
            </div>
            <span style="font-size:12px; font-weight:700; color:var(--text-gray);">14 Active</span>
          </div>
          
          <div style="display:flex; justify-content:space-between; align-items:center; padding-bottom:12px; border-bottom:1px solid #f3f4f6;">
            <div style="display:flex; align-items:center; gap:8px;">
              <div style="width:8px; height:8px; border-radius:50%; background:var(--primary-red);"></div>
              <span style="font-size:13px; font-weight:500;">South Zone Route</span>
            </div>
            <span style="font-size:12px; font-weight:700; color:var(--text-gray);">8 Active</span>
          </div>
          
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <div style="display:flex; align-items:center; gap:8px;">
              <div style="width:8px; height:8px; border-radius:50%; background:var(--success-green);"></div>
              <span style="font-size:13px; font-weight:500;">East Zone Route</span>
            </div>
            <span style="font-size:12px; font-weight:700; color:var(--text-gray);">12 Active</span>
          </div>
        </div>
      </div>
      
    </div>
`;
let file = fs.readFileSync(path.join(__dirname, 'worker/jobs.html'), 'utf8');
file = file.replace(/<div id="page-content-mount">[\s\S]*?<\/div>/, `<div id="page-content-mount">\n${contentHtml}\n</div>`);
fs.writeFileSync(path.join(__dirname, 'worker/jobs.html'), file, 'utf8');
console.log('Injected jobs content.');
