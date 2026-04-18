const fs = require('fs');
const path = require('path');

const contentHtml = `
    <div class="sn-header">
      <div>
        <h1 class="sn-page-title">Invoices & Billing</h1>
        <div class="sn-breadcrumb">Dashboard / <span>Invoices & Billing</span></div>
      </div>
      <div>
        <div class="sn-search-bar" style="width:320px;">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          <input type="text" placeholder="Search anything">
        </div>
      </div>
    </div>

    <!-- 4 Metrics above -->
    <div class="sn-grid-4">
      <div class="sn-card row-card">
        <div class="sn-metric-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
        </div>
        <div class="sn-metric-info" style="text-align:center;">
          <div class="sn-metric-label" style="justify-content:center;">Paid Invoices</div>
          <div class="sn-metric-val">$28,890</div>
          <div class="sn-metric-sub">from <span style="background:var(--success-green-light); color:var(--success-green);">350</span> Invoices</div>
        </div>
      </div>
      
      <div class="sn-card row-card">
        <div class="sn-metric-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="9" y1="9" x2="15" y2="15"></line><line x1="15" y1="9" x2="9" y2="15"></line></svg>
        </div>
        <div class="sn-metric-info" style="text-align:center;">
          <div class="sn-metric-label" style="justify-content:center;">Unpaid Invoices</div>
          <div class="sn-metric-val">$16,700</div>
          <div class="sn-metric-sub">from <span style="background:var(--success-green-light); color:var(--success-green);">120</span> Invoices</div>
        </div>
      </div>
      
      <div class="sn-card row-card">
        <div class="sn-metric-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><path d="M12 8v4l3 3"></path></svg>
        </div>
        <div class="sn-metric-info" style="text-align:center;">
          <div class="sn-metric-label" style="justify-content:center;">Pending Invoices</div>
          <div class="sn-metric-val">$8,050</div>
          <div class="sn-metric-sub">from <span style="background:var(--success-green-light); color:var(--success-green);">80</span> Invoices</div>
        </div>
      </div>
      
      <div class="sn-card row-card">
        <div class="sn-metric-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
        </div>
        <div class="sn-metric-info" style="text-align:center;">
          <div class="sn-metric-label" style="justify-content:center;">Overdue Invoices</div>
          <div class="sn-metric-val">$22,110</div>
          <div class="sn-metric-sub">from <span style="background:var(--success-green-light); color:var(--success-green);">245</span> Invoices</div>
        </div>
      </div>
    </div>

    <!-- MAIN TWO COLUMNS -->
    <div style="display: grid; grid-template-columns: 2fr 1.2fr; gap: 24px;">
      
      <!-- INVOICES TABLE -->
      <div class="sn-card" style="padding:0;">
        <div class="sn-section-header" style="padding:24px 24px 0;">
          <h3 class="sn-section-title">Invoices</h3>
          <div style="display:flex; gap:12px;">
            <div class="sn-search-bar" style="width:200px; padding:6px 12px; background:#f9fafb;">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
              <input type="text" placeholder="Search invoices">
            </div>
            <button class="sn-btn"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg></button>
            <button class="sn-btn primary">New Invoice</button>
          </div>
        </div>
        
        <div style="padding:0 24px 24px; overflow-x:auto;">
          <table class="sn-table">
            <thead>
              <tr>
                <th style="width:20px;">-</th>
                <th>Invoice ID v</th>
                <th>Company v</th>
                <th>Shipping ID v</th>
                <th>Date v</th>
                <th>Amount v</th>
                <th>Status v</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><input type="checkbox"></td>
                <td class="sn-id red">INV-1001 <svg width="12" height="12" style="margin-left:4px;" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg></td>
                <td><div style="display:flex;align-items:center;gap:8px;font-weight:600;"><div style="width:16px;height:16px;border-radius:50%;background:#1e1e1e;"></div> TechGear Inc.</div></td>
                <td style="color:var(--text-gray);">#SH9283746</td>
                <td><div>Mar 15, 2035 <span style="font-size:10px; color:#9ca3af;">(Issued)</span></div><div>Mar 22, 2035 <span style="font-size:10px; color:#9ca3af;">(Due)</span></div></td>
                <td style="font-weight:600;">$1,250.00</td>
                <td><span class="sn-tag paid">Paid</span></td>
              </tr>
              <tr>
                <td><input type="checkbox"></td>
                <td class="sn-id red">INV-1002 <svg width="12" height="12" style="margin-left:4px;" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg></td>
                <td><div style="display:flex;align-items:center;gap:8px;font-weight:600;"><div style="width:16px;height:16px;border-radius:50%;background:var(--primary-red);"><svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3"><polygon points="12 2 2 22 22 22"></polygon></svg></div> StyleHub Co.</div></td>
                <td style="color:var(--text-gray);">#SH9182635</td>
                <td><div>Mar 16, 2035 <span style="font-size:10px; color:#9ca3af;">(Issued)</span></div><div>Mar 23, 2035 <span style="font-size:10px; color:#9ca3af;">(Due)</span></div></td>
                <td style="font-weight:600;">$980.00</td>
                <td><span class="sn-tag unpaid">Unpaid</span></td>
              </tr>
              <tr>
                <td><input type="checkbox"></td>
                <td class="sn-id red">INV-1003 <svg width="12" height="12" style="margin-left:4px;" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg></td>
                <td><div style="display:flex;align-items:center;gap:8px;font-weight:600;"><div style="width:16px;height:16px;border-radius:2px;background:#1e1e1e;"></div> FreshNest</div></td>
                <td style="color:var(--text-gray);">#SH9037821</td>
                <td><div>Mar 14, 2035 <span style="font-size:10px; color:#9ca3af;">(Issued)</span></div><div>Mar 21, 2035 <span style="font-size:10px; color:#9ca3af;">(Due)</span></div></td>
                <td style="font-weight:600;">$1,320.00</td>
                <td><span class="sn-tag paid">Paid</span></td>
              </tr>
              <tr>
                <td><input type="checkbox"></td>
                <td class="sn-id red">INV-1004 <svg width="12" height="12" style="margin-left:4px;" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg></td>
                <td><div style="display:flex;align-items:center;gap:8px;font-weight:600;"><div style="width:16px;height:16px;border-radius:50%;border:3px solid var(--primary-red);"></div> FitPlus Gear</div></td>
                <td style="color:var(--text-gray);">#SH9374652</td>
                <td><div>Mar 17, 2035 <span style="font-size:10px; color:#9ca3af;">(Issued)</span></div><div>Mar 24, 2035 <span style="font-size:10px; color:#9ca3af;">(Due)</span></div></td>
                <td style="font-weight:600;">$1,150.00</td>
                <td><span class="sn-tag unpaid">Unpaid</span></td>
              </tr>
              <tr class="highlight">
                <td><input type="checkbox" checked></td>
                <td class="sn-id red">INV-1008 <svg width="12" height="12" style="margin-left:4px;" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg></td>
                <td><div style="display:flex;align-items:center;gap:8px;font-weight:600; color:var(--primary-red);"><div style="width:16px;height:16px;font-style:italic;font-weight:800;">M</div> ModaWear</div></td>
                <td style="color:var(--text-gray);">#SH8893247</td>
                <td><div>Mar 16, 2035 <span style="font-size:10px; color:#9ca3af;">(Issued)</span></div><div>Mar 23, 2035 <span style="font-size:10px; color:#9ca3af;">(Due)</span></div></td>
                <td style="font-weight:600;">$910.00</td>
                <td><span class="sn-tag unpaid">Unpaid</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- INVOICE DETAILS PANEL -->
      <div class="sn-detail-panel">
        <div class="sn-dp-header">
          <h3 class="sn-section-title">Invoice Details</h3>
          <div style="display:flex; gap:8px;">
            <button class="sn-btn">Edit</button>
            <button class="sn-btn">Hold</button>
            <button class="sn-btn primary">Send Invoice</button>
          </div>
        </div>
        
        <div style="display:flex;justify-content:space-between; margin-bottom:24px;">
          <div>
            <h2 style="font-size:16px; font-weight:700; color:var(--text-dark); margin-bottom:8px;">Invoice <span class="sn-id red">#INV-1008</span></h2>
            <span class="sn-tag unpaid">Unpaid</span>
          </div>
          <div style="text-align:right; font-size:12px; color:var(--text-gray); line-height:1.6;">
            <div>Issue Date <strong style="color:var(--text-dark);">Mar 16, 2035</strong></div>
            <div>Due Date <strong style="color:var(--text-dark);">Mar 23, 2035</strong></div>
          </div>
        </div>
        
        <div style="background:#f9fafb; border-radius:12px; padding:20px; display:flex; justify-content:space-between; margin-bottom:24px;">
          <div>
            <div style="font-size:11px; color:#9ca3af; margin-bottom:8px;">Bill From</div>
            <div style="font-weight:700; font-size:14px;">ModaWear</div>
            <div style="font-size:12px; color:var(--primary-red); margin-bottom:8px;">billing@modawear.com</div>
            <div style="font-size:11px; color:var(--text-gray); line-height:1.5;">89 Franklin St, Boston,<br>MA 02110, USA<br>+1 617-555-2290</div>
          </div>
          <div style="text-align:right;">
            <div style="font-size:11px; color:#9ca3af; margin-bottom:8px;">Bill To</div>
            <div style="font-weight:700; font-size:14px;">FixMate Pro Services</div>
            <div style="font-size:12px; color:var(--text-gray); margin-bottom:8px;">accounts@fixmate.in</div>
            <div style="font-size:11px; color:var(--text-gray); line-height:1.5;">Madhapur, Hi-tech City,<br>Hyderabad, INDIA<br>+91 99887 66554</div>
          </div>
        </div>
        
        <div style="font-weight:700; font-size:14px; margin-bottom:16px;">Job Summary</div>
        <table style="width:100%; border-collapse:collapse; font-size:12px;">
          <thead>
            <tr style="border-bottom:1px solid var(--border-color);">
              <th style="padding:10px 0; text-align:left; color:#9ca3af; font-weight:600;">Description v</th>
              <th style="padding:10px 0; text-align:left; color:#9ca3af; font-weight:600;">Service Type v</th>
              <th style="padding:10px 0; text-align:right; color:#9ca3af; font-weight:600;">Price v</th>
              <th style="padding:10px 0; text-align:right; color:#9ca3af; font-weight:600;">Qty v</th>
              <th style="padding:10px 0; text-align:right; color:#9ca3af; font-weight:600;">Amount v</th>
            </tr>
          </thead>
          <tbody>
            <tr style="border-bottom:1px solid #f3f4f6;">
              <td style="padding:16px 0; font-weight:500;">AC Repair Pack</td>
              <td style="padding:16px 0; color:var(--text-gray);">Home Service<br><span style="font-size:10px; color:#9ca3af;">Standard</span></td>
              <td style="padding:16px 0; text-align:right;">$120.00</td>
              <td style="padding:16px 0; text-align:right;">3</td>
              <td style="padding:16px 0; text-align:right; font-weight:600;">$360.00</td>
            </tr>
            <tr style="border-bottom:1px solid #f3f4f6;">
              <td style="padding:16px 0; font-weight:500;">Deep Cleaning Sets</td>
              <td style="padding:16px 0; color:var(--text-gray);">Home Service<br><span style="font-size:10px; color:#9ca3af;">Standard</span></td>
              <td style="padding:16px 0; text-align:right;">$180.00</td>
              <td style="padding:16px 0; text-align:right;">2</td>
              <td style="padding:16px 0; text-align:right; font-weight:600;">$360.00</td>
            </tr>
            <tr>
              <td style="padding:16px 0; font-weight:500;">Electric Setup Pack</td>
              <td style="padding:16px 0; color:var(--text-gray);">Commercial<br><span style="font-size:10px; color:#9ca3af;">Express</span></td>
              <td style="padding:16px 0; text-align:right;">$95.00</td>
              <td style="padding:16px 0; text-align:right;">2</td>
              <td style="padding:16px 0; text-align:right; font-weight:600;">$190.00</td>
            </tr>
          </tbody>
        </table>
        
        <div style="margin-top:24px; display:flex; justify-content:flex-end;">
          <div style="width:250px; font-size:12px;">
            <div style="display:flex; justify-content:space-between; margin-bottom:12px;"><span style="color:var(--text-gray);">Sub Total</span><strong style="color:var(--text-dark);">$910.00</strong></div>
            <div style="display:flex; justify-content:space-between; margin-bottom:12px;"><span style="color:var(--text-gray);">Tax (8%)</span><strong style="color:var(--text-dark);">$72.80</strong></div>
            <div style="display:flex; justify-content:space-between; margin-bottom:16px; padding-bottom:16px; border-bottom:1px solid var(--border-color);"><span style="color:var(--text-gray);">Fee</span><strong style="color:var(--text-dark);">$10.00</strong></div>
            <div style="display:flex; justify-content:space-between; font-size:14px;"><strong style="color:var(--text-dark);">Total</strong><strong style="color:var(--text-dark);">$992.80</strong></div>
          </div>
        </div>
        
        <div style="margin-top:32px; font-size:11px; color:#9ca3af;">
          <strong style="display:block; margin-bottom:4px;">Note</strong>
          Please process payment by the due date to avoid service disruption. Late fees may apply after 3 business days past due.
        </div>
      </div>
      
    </div>
`;
let file = fs.readFileSync(path.join(__dirname, 'worker/earnings.html'), 'utf8');
file = file.replace(/<div id="page-content-mount">[\s\S]*?<\/div>/, `<div id="page-content-mount">\n${contentHtml}\n</div>`);
fs.writeFileSync(path.join(__dirname, 'worker/earnings.html'), file, 'utf8');
console.log('Injected earnings content.');
