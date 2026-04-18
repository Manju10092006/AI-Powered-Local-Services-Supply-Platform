const fs = require('fs');
const path = require('path');

const contentHtml = `
    <div class="sn-header">
      <div>
        <h1 class="sn-page-title">Fleets & Overview</h1>
        <div class="sn-breadcrumb">Dashboard / <span>Fleets</span></div>
      </div>
      <div style="display:flex; gap:12px;">
        <button class="sn-btn active" style="background:#111827; color:#fff;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg> North Zone</button>
        <button class="sn-btn"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg> South Zone</button>
        <button class="sn-btn"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg> East Zone</button>
        <button class="sn-btn"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg> West Zone</button>
      </div>
    </div>

    <div class="sn-grid-4">
      <div class="sn-card">
        <div class="sn-metric-label">Total Jobs Today <svg width="16" height="16" stroke-width="2" viewBox="0 0 24 24" fill="none" stroke="#9ca3af"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg></div>
        <div class="sn-metric-val" style="display:flex;align-items:center;gap:12px;">42 <span style="background:var(--success-green-light); color:var(--success-green); font-size:12px; font-weight:700; padding:4px 8px; border-radius:12px; display:flex; align-items:center;"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="18 15 12 9 6 15"></polyline></svg> 2.56%</span></div>
      </div>
      <div class="sn-card">
        <div class="sn-metric-label">Average Distance <svg width="16" height="16" stroke-width="2" viewBox="0 0 24 24" fill="none" stroke="#9ca3af"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg></div>
        <div class="sn-metric-val" style="display:flex;align-items:center;gap:12px;"><span style="color:var(--primary-red);"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg></span> 1,280 <span style="font-size:14px;font-weight:600;color:var(--text-gray);">km</span> <span style="background:var(--success-green-light); color:var(--success-green); font-size:12px; font-weight:700; padding:4px 8px; border-radius:12px; display:flex; align-items:center;"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="18 15 12 9 6 15"></polyline></svg> 3.84%</span></div>
      </div>
      <div class="sn-card">
        <div class="sn-metric-label">On-Time Arrival Rate <svg width="16" height="16" stroke-width="2" viewBox="0 0 24 24" fill="none" stroke="#9ca3af"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg></div>
        <div class="sn-metric-val" style="display:flex;align-items:center;gap:12px;"><span style="color:var(--primary-red);"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg></span> 92% <span style="background:var(--primary-red-light); color:var(--primary-red); font-size:12px; font-weight:700; padding:4px 8px; border-radius:12px; display:flex; align-items:center;"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="6 9 12 15 18 9"></polyline></svg> 0.97%</span></div>
      </div>
      <div class="sn-card">
        <div class="sn-metric-label">Total Sub-Workers <svg width="16" height="16" stroke-width="2" viewBox="0 0 24 24" fill="none" stroke="#9ca3af"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg></div>
        <div class="sn-metric-val" style="display:flex;align-items:center;gap:12px;"><span style="color:var(--primary-red);"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg></span> 36 <span style="background:var(--success-green-light); color:var(--success-green); font-size:12px; font-weight:700; padding:4px 8px; border-radius:12px; display:flex; align-items:center;"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="18 15 12 9 6 15"></polyline></svg> 5.80%</span></div>
      </div>
    </div>

    <!-- MIDDLE ROW (Map, Chart, Costs) -->
    <div style="display: grid; grid-template-columns: 1fr 300px 300px; gap: 20px; margin-bottom: 24px;">
      
      <!-- MAP -->
      <div class="sn-card" style="padding:16px;">
        <div class="sn-search-bar" style="width:100%; margin-bottom:16px; background:#f9fafb;">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          <input type="text" placeholder="Search vehicle, customers, & others...">
        </div>
        <div class="sn-map-wrap" style="height: 380px; position:relative; overflow:hidden;">
          <img src="https://images.unsplash.com/photo-1524661135-423995f22d0b?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80" alt="Map" style="width:100%; height:100%; object-fit:cover; opacity:0.8;">
          <div style="position:absolute; top:50%; left:50%; transform:translate(-50%,-50%);">
            <svg viewBox="0 0 24 24" width="40" height="40" fill="var(--primary-red)"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
          </div>
          <!-- Vehicle Popup -->
          <div style="position:absolute; bottom:20px; left:20px; background:#fff; padding:16px; border-radius:12px; box-shadow:0 10px 25px rgba(0,0,0,0.1); width:240px;">
            <img src="https://images.unsplash.com/photo-1555122108-b6b694c9a61e?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80" style="width:100%; height:80px; object-fit:cover; border-radius:8px; margin-bottom:12px;">
            <div style="font-weight:700; font-size:14px; margin-bottom:4px;">Sprinter Van</div>
            <div style="font-size:12px; color:var(--text-gray); margin-bottom:12px;">Black • OR 7N4 9GH</div>
            <div style="display:flex; align-items:center; gap:8px;">
              <div style="width:24px; height:24px; border-radius:50%; background:#e2e8f0; display:flex; align-items:center; justify-content:center; font-size:10px;">OL</div>
              <span style="font-size:12px; font-weight:500;">Oscar Liem</span>
            </div>
          </div>
        </div>
      </div>

      <!-- FLEET STATUS -->
      <div class="sn-card">
        <div class="sn-section-header" style="margin-bottom:32px;">
          <h3 class="sn-section-title">Fleet Status</h3>
          <svg width="20" height="20" stroke="#9ca3af" stroke-width="2" fill="none"><circle cx="12" cy="12" r="1"></circle><circle cx="19" cy="12" r="1"></circle><circle cx="5" cy="12" r="1"></circle></svg>
        </div>
        <div class="fleet-circle">
          <h2>42</h2>
          <p>Total All Fleets</p>
        </div>
        <div style="margin-top:auto;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; font-size:13px; font-weight:600; color:var(--text-gray);">
            <div><span style="display:inline-block; width:12px; height:12px; border-radius:50%; background:var(--primary-red); margin-right:8px;"></span>Active <span style="font-weight:400; margin-left:8px;">69%</span></div>
            <span style="background:var(--primary-red-light); color:var(--primary-red); padding:2px 8px; border-radius:12px;">29</span>
          </div>
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; font-size:13px; font-weight:600; color:var(--text-gray);">
            <div><span style="display:inline-block; width:12px; height:12px; border-radius:50%; background:var(--text-dark); margin-right:8px;"></span>Idle <span style="font-weight:400; margin-left:8px;">19%</span></div>
            <span style="background:#f3f4f6; color:var(--text-dark); padding:2px 8px; border-radius:12px;">8</span>
          </div>
          <div style="display:flex; justify-content:space-between; align-items:center; font-size:13px; font-weight:600; color:var(--text-gray);">
            <div><span style="display:inline-block; width:12px; height:12px; border-radius:50%; background:#e5e7eb; margin-right:8px;"></span>Under Maintenance <span style="font-weight:400; margin-left:8px;">12%</span></div>
            <span style="background:#f3f4f6; color:var(--text-dark); padding:2px 8px; border-radius:12px;">5</span>
          </div>
        </div>
      </div>

      <!-- COST PERFORMANCE -->
      <div class="sn-card">
        <div class="sn-section-header" style="margin-bottom:20px;">
          <h3 class="sn-section-title">Cost Performance</h3>
          <svg width="20" height="20" stroke="#9ca3af" stroke-width="2" fill="none"><circle cx="12" cy="12" r="1"></circle><circle cx="19" cy="12" r="1"></circle><circle cx="5" cy="12" r="1"></circle></svg>
        </div>
        <div style="background:#f9fafb; padding:24px; border-radius:12px; text-align:center; margin-bottom:24px;">
          <p style="font-size:12px; color:var(--text-gray); font-weight:600; margin-bottom:8px;">Total Overall Cost</p>
          <h2 style="font-size:28px; font-weight:800; color:var(--text-dark); margin-bottom:12px;">$82,000 USD</h2>
          <span style="background:var(--success-green-light); color:var(--success-green); font-size:12px; font-weight:700; padding:4px 8px; border-radius:12px; display:inline-flex; align-items:center;"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="18 15 12 9 6 15"></polyline></svg> 2.5%</span>
        </div>
        
        <div>
          <div style="display:flex; align-items:center; gap:12px; margin-bottom:20px;">
            <div style="font-size:14px; font-weight:700; color:var(--text-gray);">1</div>
            <div style="flex:1;">
              <div style="font-size:13px; font-weight:600;">Fuel & Mileage</div>
              <div style="font-size:11px; color:var(--text-gray);">$39,360 USD</div>
            </div>
            <div style="background:var(--primary-red); color:#fff; font-size:11px; font-weight:700; padding:4px 8px; border-radius:6px;">48%</div>
          </div>
          <div style="display:flex; align-items:center; gap:12px; margin-bottom:20px;">
            <div style="font-size:14px; font-weight:700; color:var(--text-gray);">2</div>
            <div style="flex:1;">
              <div style="font-size:13px; font-weight:600;">Maintenance & Repairs</div>
              <div style="font-size:11px; color:var(--text-gray);">$26,240 USD</div>
            </div>
            <div style="background:var(--primary-red); color:#fff; font-size:11px; font-weight:700; padding:4px 8px; border-radius:6px; opacity:0.8;">32%</div>
          </div>
          <div style="display:flex; align-items:center; gap:12px;">
            <div style="font-size:14px; font-weight:700; color:var(--text-gray);">3</div>
            <div style="flex:1;">
              <div style="font-size:13px; font-weight:600;">Driver Wages</div>
              <div style="font-size:11px; color:var(--text-gray);">$16,400 USD</div>
            </div>
            <div style="background:var(--primary-red); color:#fff; font-size:11px; font-weight:700; padding:4px 8px; border-radius:6px; opacity:0.6;">20%</div>
          </div>
        </div>
      </div>
    </div>

    <!-- BOTTOM ROW (Schedule & Alerts) -->
    <div style="display: grid; grid-template-columns: 1fr 300px; gap: 20px;">
      
      <!-- Maintenance Schedule -->
      <div class="sn-card" style="padding:0;">
        <div class="sn-section-header" style="padding:24px 24px 0;">
          <h3 class="sn-section-title">Maintenance Schedule</h3>
          <div style="display:flex; gap:12px;">
            <div class="sn-search-bar" style="width:240px; padding:6px 12px;">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
              <input type="text" placeholder="Search vehicle, driver, etc">
            </div>
            <button class="sn-btn"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg> Filter v</button>
          </div>
        </div>
        <div style="padding:0 24px 24px; overflow-x:auto;">
          <table class="sn-table">
            <thead>
              <tr>
                <th style="width:40px;"><input type="checkbox"></th>
                <th>Vehicle Type v</th>
                <th>Assigned Driver v</th>
                <th>Service v</th>
                <th>Date v</th>
                <th>Status v</th>
                <th>Notes v</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><input type="checkbox"></td>
                <td><div style="display:flex; align-items:center; gap:12px;"><div style="width:36px; height:24px; background:white; border-radius:4px; box-shadow:0 2px 4px rgba(0,0,0,0.1);"></div><div><div style="font-weight:600;">Cargo Van</div><div style="font-size:11px; color:var(--text-gray);">Red - CA 5F9 3LQ</div></div></div></td>
                <td style="color:var(--text-gray);">Daniel Cooper</td>
                <td style="font-weight:500;">Tire Rotation</td>
                <td><div>Mar 22, 2035</div><div style="font-size:11px; color:var(--text-gray);">09:00 AM</div></td>
                <td><span style="display:inline-flex; align-items:center; gap:6px; font-weight:500;"><span style="width:8px; height:8px; border-radius:50%; background:#d1d5db;"></span> Scheduled</span></td>
                <td style="color:var(--text-gray);">Check tire pressure as well</td>
              </tr>
              <tr>
                <td><input type="checkbox"></td>
                <td><div style="display:flex; align-items:center; gap:12px;"><div style="width:36px; height:24px; background:white; border-radius:4px; box-shadow:0 2px 4px rgba(0,0,0,0.1);"></div><div><div style="font-weight:600;">Flatbed Truck</div><div style="font-size:11px; color:var(--text-gray);">Blue - FL 2B7 6XP</div></div></div></td>
                <td style="color:var(--text-gray);">Leo Fernandez</td>
                <td style="font-weight:500;">Engine Diagnostic</td>
                <td><div>Mar 21, 2035</div><div style="font-size:11px; color:var(--text-gray);">03:00 PM</div></td>
                <td><span style="display:inline-flex; align-items:center; gap:6px; font-weight:500; color:var(--success-green);"><span style="width:8px; height:8px; border-radius:50%; background:var(--success-green);"></span> Completed</span></td>
                <td style="color:var(--text-gray);">Engine light issue resolved</td>
              </tr>
              <tr>
                <td><input type="checkbox"></td>
                <td><div style="display:flex; align-items:center; gap:12px;"><div style="width:36px; height:24px; background:white; border-radius:4px; box-shadow:0 2px 4px rgba(0,0,0,0.1);"></div><div><div style="font-weight:600;">Box Truck</div><div style="font-size:11px; color:var(--text-gray);">White - TX BK2 1RT</div></div></div></td>
                <td style="color:var(--text-gray);">Ava Martinez</td>
                <td style="font-weight:500;">Oil Change</td>
                <td><div>Mar 23, 2035</div><div style="font-size:11px; color:var(--text-gray);">11:30 AM</div></td>
                <td><span style="display:inline-flex; align-items:center; gap:6px; font-weight:500;"><span style="width:8px; height:8px; border-radius:50%; background:#d1d5db;"></span> Scheduled</span></td>
                <td style="color:var(--text-gray);">Use synthetic oil only</td>
              </tr>
              <tr>
                <td><input type="checkbox"></td>
                <td><div style="display:flex; align-items:center; gap:12px;"><div style="width:36px; height:24px; background:white; border-radius:4px; box-shadow:0 2px 4px rgba(0,0,0,0.1);"></div><div><div style="font-weight:600;">Step Van</div><div style="font-size:11px; color:var(--text-gray);">Yellow - NY 3Q5 2WL</div></div></div></td>
                <td style="color:var(--text-gray);">Dina Choi</td>
                <td style="font-weight:500;">Transmission Service</td>
                <td><div>Mar 25, 2035</div><div style="font-size:11px; color:var(--text-gray);">01:00 PM</div></td>
                <td><span style="display:inline-flex; align-items:center; gap:6px; font-weight:500;"><span style="width:8px; height:8px; border-radius:50%; background:#d1d5db;"></span> Scheduled</span></td>
                <td style="color:var(--text-gray);">Transmission slipping reported</td>
              </tr>
              <tr>
                <td><input type="checkbox"></td>
                <td><div style="display:flex; align-items:center; gap:12px;"><div style="width:36px; height:24px; background:white; border-radius:4px; box-shadow:0 2px 4px rgba(0,0,0,0.1);"></div><div><div style="font-weight:600;">Sprinter Van</div><div style="font-size:11px; color:var(--text-gray);">Black - OR 7N4 9GH</div></div></div></td>
                <td style="color:var(--text-gray);">Oscar Liem</td>
                <td style="font-weight:500;">Brake Inspection</td>
                <td><div>Mar 24, 2035</div><div style="font-size:11px; color:var(--text-gray);">10:15 AM</div></td>
                <td><span style="display:inline-flex; align-items:center; gap:6px; font-weight:500; color:var(--primary-red);"><span style="width:8px; height:8px; border-radius:50%; background:var(--primary-red);"></span> Pending</span></td>
                <td style="color:var(--text-gray);">Brake pads may require replacement</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Vehicle Alerts -->
      <div class="sn-card">
        <div class="sn-section-header" style="margin-bottom:24px;">
          <h3 class="sn-section-title">Vehicle Alerts</h3>
          <svg width="20" height="20" stroke="#9ca3af" stroke-width="2" fill="none"><circle cx="12" cy="12" r="1"></circle><circle cx="19" cy="12" r="1"></circle><circle cx="5" cy="12" r="1"></circle></svg>
        </div>
        <div style="display:flex; flex-direction:column; gap:20px;">
          
          <div style="display:flex; gap:16px;">
            <div style="width:32px; height:32px; border-radius:8px; background:var(--text-dark); color:white; display:flex; align-items:center; justify-content:center; flex-shrink:0;">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path><line x1="4" y1="22" x2="4" y2="15"></line></svg>
            </div>
            <div>
              <div style="font-size:13px; font-weight:700; color:var(--text-dark); margin-bottom:2px;">Low Tire Pressure</div>
              <div style="font-size:11px; font-weight:600; color:var(--primary-red); margin-bottom:4px;">CA 5F9 3LQ <span style="color:var(--text-gray); font-weight:500;">• Cargo Van</span></div>
              <div style="font-size:10px; color:var(--text-gray);">March 21, 2035 - 08:45 AM</div>
            </div>
          </div>
          
          <div style="display:flex; gap:16px;">
            <div style="width:32px; height:32px; border-radius:8px; background:var(--text-dark); color:white; display:flex; align-items:center; justify-content:center; flex-shrink:0;">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path><line x1="4" y1="22" x2="4" y2="15"></line></svg>
            </div>
            <div>
              <div style="font-size:13px; font-weight:700; color:var(--text-dark); margin-bottom:2px;">Oil Level Critical</div>
              <div style="font-size:11px; font-weight:600; color:var(--primary-red); margin-bottom:4px;">TX 8K2 1RT <span style="color:var(--text-gray); font-weight:500;">• Box Truck</span></div>
              <div style="font-size:10px; color:var(--text-gray);">March 20, 2035 - 03:10 PM</div>
            </div>
          </div>
          
          <div style="display:flex; gap:16px;">
            <div style="width:32px; height:32px; border-radius:8px; background:var(--text-dark); color:white; display:flex; align-items:center; justify-content:center; flex-shrink:0;">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"></path><line x1="4" y1="22" x2="4" y2="15"></line></svg>
            </div>
            <div>
              <div style="font-size:13px; font-weight:700; color:var(--text-dark); margin-bottom:2px;">Engine Check Light On</div>
              <div style="font-size:11px; font-weight:600; color:var(--primary-red); margin-bottom:4px;">FL 2B7 6XP <span style="color:var(--text-gray); font-weight:500;">• Flatbed Truck</span></div>
              <div style="font-size:10px; color:var(--text-gray);">March 20, 2035 - 11:25 AM</div>
            </div>
          </div>
          
        </div>
      </div>
      
    </div>
`;
let file = fs.readFileSync(path.join(__dirname, 'worker/dashboard.html'), 'utf8');
file = file.replace(/<div id="page-content-mount">[\s\S]*?<\/div>/, `<div id="page-content-mount">\n${contentHtml}\n</div>`);
fs.writeFileSync(path.join(__dirname, 'worker/dashboard.html'), file, 'utf8');
console.log('Injected dashboard content.');
