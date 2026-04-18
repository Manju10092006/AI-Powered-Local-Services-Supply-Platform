/* ============================================
   FIXMATE AI — Frontend API Layer
   Connects all HTML pages to the backend
   ============================================ */

function resolveApiBase() {
  if (typeof window !== "undefined") {
    const w = window.__FIXMATE_API_BASE__;
    if (w && typeof w === "string" && /^https?:\/\//i.test(w)) return w.replace(/\/$/, "");
    try {
      const ls = localStorage.getItem("fixmate_api_base");
      if (ls && /^https?:\/\//i.test(ls)) return ls.replace(/\/$/, "");
    } catch (_) {}
  }
  return "http://localhost:5000";
}

const API_BASE = resolveApiBase();
if (typeof window !== "undefined") window.FIXMATE_API_BASE = API_BASE;

// ---- Maps ----
const MapsAPI = {
  async getApiKey() {
    try {
      const res = await api("/api/maps/key");
      if (res && res.key) return res.key;
    } catch(e) {}
    return null;
  },
  
  async loadScript() {
    if (window.google && window.google.maps) return Promise.resolve();
    return new Promise(async (resolve, reject) => {
      const key = await this.getApiKey();
      if (!key) {
        reject(new Error("Google Maps API key unavailable. Configure /api/maps/key and allowed referrers."));
        return;
      }
      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=${key}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }
};

// ---- Auth Manager ----
const Auth = {
  getToken() {
    return localStorage.getItem("fixmate_token") || sessionStorage.getItem("fixmate_token");
  },
  getUser() {
    try {
      const u = localStorage.getItem("fixmate_user") || sessionStorage.getItem("fixmate_user");
      if (!u || u === "undefined" || u === "null" || u === "") return null;
      return JSON.parse(u);
    } catch {
      this.logout(); // Corrupted state
      return null;
    }
  },
  getRole() {
    return localStorage.getItem("fixmate_role") || sessionStorage.getItem("fixmate_role") || "customer";
  },
  isLoggedIn() {
    return !!this.getToken() && !!this.getUser();
  },
  save(token, user, role, rememberMe = true) {
    const storage = rememberMe ? localStorage : sessionStorage;
    
    // Clear the other storage to prevent conflicts
    const otherStorage = rememberMe ? sessionStorage : localStorage;
    otherStorage.removeItem("fixmate_token");
    otherStorage.removeItem("fixmate_user");
    otherStorage.removeItem("fixmate_role");

    if (token) storage.setItem("fixmate_token", token);
    else storage.removeItem("fixmate_token");
    
    if (user && Object.keys(user).length > 0) {
      storage.setItem("fixmate_user", JSON.stringify(user));
    } else {
      storage.removeItem("fixmate_user");
    }
    
    if (role) storage.setItem("fixmate_role", role);
    else storage.removeItem("fixmate_role");
  },
  logout() {
    localStorage.removeItem("fixmate_token");
    localStorage.removeItem("fixmate_user");
    localStorage.removeItem("fixmate_role");
    sessionStorage.removeItem("fixmate_token");
    sessionStorage.removeItem("fixmate_user");
    sessionStorage.removeItem("fixmate_role");
    this.redirectToLogin();
  },
  redirectToLogin() {
    // Dynamically calculate root layout prefix
    const path = window.location.pathname;
    let prefix = "";
    if (path.includes('/customer/') || path.includes('/worker/') || path.includes('/admin/')) {
      prefix = "../";
    }
    if (!path.endsWith('login.html')) {
        window.location.href = prefix + "login.html";
    }
  },
  redirectToDashboard() {
    const role = this.getRole();
    const path = window.location.pathname;
    let prefix = "";
    if (path.includes('/customer/') || path.includes('/worker/') || path.includes('/admin/')) {
      prefix = "../";
    }
    
    if (role === "worker") {
      const u = this.getUser();
      if (u && u.onboardingApproved === false) {
        window.location.href = prefix + "worker/onboarding.html";
        return;
      }
      window.location.href = prefix + "worker/dashboard.html";
    }
    else if (role === "admin") window.location.href = prefix + "admin/dashboard.html";
    else window.location.href = prefix + "customer/dashboard.html";
  }
};

// ---- API Fetch Helper ----
function parseApiBody(text, res, endpoint) {
  const trimmed = (text || "").trim();
  if (!trimmed) return {};
  if (trimmed.startsWith("<")) {
    throw new Error(
      `The server returned a web page instead of JSON for "${endpoint}" (${res.status}). ` +
        `Start the API from folder backend-repo/server (node server.js) so ${API_BASE} serves FixMate JSON, ` +
        `or set localStorage fixmate_api_base to your API URL. Wrong port or static file server often causes this.`
    );
  }
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`Invalid JSON from "${endpoint}" (${res.status}).`);
  }
}

async function api(endpoint, options = {}) {
  const skipLogoutOn401 = options.skipLogoutOn401 === true;
  const fetchOptions = { ...options };
  delete fetchOptions.skipLogoutOn401;

  const url = `${API_BASE}${endpoint}`;
  const headers = { "Content-Type": "application/json", ...fetchOptions.headers };
  const token = Auth.getToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;

  let res;
  let text = "";
  try {
    res = await fetch(url, { ...fetchOptions, headers });
    text = await res.text();
  } catch (err) {
    const msg = err && err.message ? err.message : String(err);
    if (msg.includes("Failed to fetch") || err.name === "TypeError") {
      console.warn("[API] Server unreachable:", url);
      return null;
    }
    throw err;
  }

  const data = parseApiBody(text, res, endpoint);

  if (res.status === 401) {
    if (token && !skipLogoutOn401) Auth.logout();
    return null;
  }
  if (!res.ok) {
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  return data;
}

/** Unauthenticated JSON fetch (public preview routes on same API_BASE) */
async function fetchPublicJson(method, pathAndQuery, jsonBody) {
  const path = pathAndQuery.startsWith("/") ? pathAndQuery : `/${pathAndQuery}`;
  const url = `${API_BASE}${path}`;
  const headers = {};
  if (jsonBody != null && method !== "GET") headers["Content-Type"] = "application/json";
  const opts = { method, headers };
  if (jsonBody != null && method !== "GET") opts.body = JSON.stringify(jsonBody);
  let res;
  let text = "";
  try {
    res = await fetch(url, opts);
    text = await res.text();
  } catch (err) {
    const msg = err && err.message ? err.message : String(err);
    if (msg.includes("Failed to fetch") || err.name === "TypeError") {
      console.warn("[API] Public fetch unreachable:", url);
      return null;
    }
    throw err;
  }
  const data = parseApiBody(text, res, path.split("?")[0]);
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

// ---- Auth API ----
const AuthAPI = {
  async login(email, password) {
    let data;
    try {
      data = await api("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password })
      });
    } catch(err) {
      console.warn("Login failed via API:", err);
    }
    
    if (!data) {
      console.warn("Backend API unreachable. Using MOCK login fallback.");
      let role = "customer";
      if (email.includes("admin")) role = "admin";
      if (email.includes("worker") || email.includes("pro") || email.includes("otp")) role = "worker";
      
      data = {
        token: "mock-jwt-token-12345",
        user: {
          id: "usr_mock",
          name: role === "admin" ? "Admin User" : role === "worker" ? "Pro Worker" : "John Customer",
          email: email,
          phone: "9988776655",
          onboardingApproved: true
        },
        role: role,
        redirect: role === "admin" ? "/admin/dashboard.html" : role === "worker" ? "/worker/dashboard.html" : "/customer/dashboard.html"
      };
    }
    return data;
  },
  async register(payload) {
    let data;
    try {
      data = await api("/auth/register", {
        method: "POST",
        body: JSON.stringify(payload)
      });
    } catch(err) {
      console.warn("Register failed via API:", err);
    }
    
    if (!data) {
      console.warn("Backend API unreachable. Using MOCK register fallback.");
      const role = payload.role || "customer";
      data = {
        token: "mock-jwt-token-67890",
        user: { ...payload, id: "usr_mock", onboardingApproved: true },
        role: role,
        redirect: role === "admin" ? "/admin/dashboard.html" : role === "worker" ? "/worker/dashboard.html" : "/customer/dashboard.html"
      };
    }
    return data;
  },
  async verify() {
    return api("/auth/verify");
  }
};

// ---- User API ----
const UserAPI = {
  /** @param {{ optional?: boolean }} [opts] optional:true → no auto-logout on 401 (cart / soft reads) */
  async getMe(opts) {
    const optional = opts && opts.optional === true;
    return api("/api/users/me", optional ? { skipLogoutOn401: true } : {});
  },
  async updateProfile(data) {
    return api("/api/users/me", { method: "PUT", body: JSON.stringify(data) });
  },
  async getBookings() { return api("/api/users/bookings"); },
  async getStats() { return api("/api/users/stats"); }
};

// ---- Worker API ----
const WorkerAPI = {
  async getDashboard() { return api("/api/workers/dashboard"); },
  async getProSummary() {
    return api("/api/workers/pro/summary");
  },
  async getOnboardingStatus() {
    return api("/api/workers/onboarding/status");
  },
  async saveOnboardingStep(body) {
    return api("/api/workers/onboarding/step", { method: "PUT", body: JSON.stringify(body || {}) });
  },
  async submitOnboarding() {
    return api("/api/workers/onboarding/submit", { method: "POST", body: JSON.stringify({}) });
  },
  async getMessages() {
    return api("/api/workers/messages");
  },
  async getMessageThread(bookingId) {
    return api(`/api/workers/messages/${encodeURIComponent(bookingId)}`);
  },
  async getActiveBooking() {
    return api("/api/workers/active-booking");
  },
  async getPerformance() {
    return api("/api/workers/performance");
  },
  async getDocuments() {
    return api("/api/workers/documents");
  },
  async updateDocument(docId, body) {
    return api(`/api/workers/documents/${encodeURIComponent(docId)}`, {
      method: "PUT",
      body: JSON.stringify(body || {})
    });
  },
  async getJobs() { return api("/api/workers/jobs"); },
  async acceptJob(id) {
    return api(`/api/workers/jobs/${encodeURIComponent(id)}/accept`, { method: "POST", body: "{}" });
  },
  async startJob(id) {
    return api(`/api/workers/jobs/${encodeURIComponent(id)}/start`, { method: "POST", body: "{}" });
  },
  async rejectJob(id) { return api(`/api/workers/jobs/${id}/reject`, { method: "POST" }); },
  async completeJob(id) { return api(`/api/workers/jobs/${id}/complete`, { method: "POST" }); },
  async getEarnings() { return api("/api/workers/earnings"); },
  async toggleOnline() { return api("/api/workers/toggle-online", { method: "PATCH" }); },
  async updateProfile(data) {
    return api("/api/workers/profile", { method: "PUT", body: JSON.stringify(data) });
  },
  async getFastOffers() {
    return api("/api/workers/fast-offers");
  },
  async acceptFastOffer(inviteId) {
    return api(`/api/workers/fast-offers/${encodeURIComponent(inviteId)}/accept`, { method: "POST" });
  },
  async rejectFastOffer(inviteId) {
    return api(`/api/workers/fast-offers/${encodeURIComponent(inviteId)}/reject`, { method: "POST" });
  }
};

// ---- Booking API ----
const BookingAPI = {
  async list() { return api("/api/bookings"); },
  async create(data) {
    return api("/api/bookings", { method: "POST", body: JSON.stringify(data) });
  },
  async get(id) { return api(`/api/bookings/${encodeURIComponent(id)}`); },
  async cancel(id) { return api(`/api/bookings/${encodeURIComponent(id)}/cancel`, { method: "PATCH" }); },
  async reschedule(id, body) {
    return api(`/api/bookings/${encodeURIComponent(id)}/reschedule`, {
      method: "PATCH",
      body: JSON.stringify(body || {})
    });
  },
  async rate(id, rating, comment) {
    return api(`/api/bookings/${encodeURIComponent(id)}/rate`, { method: "POST", body: JSON.stringify({ rating, comment }) });
  }
};

const SlotAPI = {
  async available(params) {
    const qs = new URLSearchParams(params).toString();
    try {
      const data = await api(`/api/slots/available?${qs}`, { skipLogoutOn401: true });
      if (data && Array.isArray(data.slots)) return data;
    } catch (e) {
      console.warn("[SlotAPI] /api/slots:", e?.message);
    }
    try {
      const data = await fetchPublicJson("GET", `/public/slots/available?${qs}`);
      if (data && Array.isArray(data.slots)) return data;
    } catch (e2) {
      console.warn("[SlotAPI] /public/slots:", e2?.message);
    }
    return { slots: [], durationMins: 60 };
  }
};

const FastBookingAPI = {
  async analyze(problem) {
    const res = await fetch(`${API_BASE}/fast-booking/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ problem })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `Analyze failed (${res.status})`);
    return data;
  },
  async confirm(payload) {
    return api("/fast-booking/confirm", { method: "POST", body: JSON.stringify(payload || {}) });
  },
  async status(id) {
    return api(`/fast-booking/status/${encodeURIComponent(id)}`);
  }
};

const BookingAIAPI = {
  /**
   * Live pricing: try public route first (no JWT). Same engine as /api/ai/calculate-booking.
   * Calling protected first with a stale/mock token returned 401 → Auth.logout() and often
   * prevented the public fallback from completing, so the cart always showed offline pricing.
   */
  async calculateBooking(payload) {
    const body = { ...(payload || {}) };
    try {
      const pr = await fetchPublicJson("POST", "/public/calculate-booking", body);
      if (pr && pr.engine) return pr;
    } catch (e) {
      console.warn("[BookingAIAPI] /public/calculate-booking:", e?.message);
    }
    let r = null;
    try {
      r = await api("/api/ai/calculate-booking", {
        method: "POST",
        body: JSON.stringify(body),
        skipLogoutOn401: true
      });
    } catch (e2) {
      console.warn("[BookingAIAPI] /api/ai/calculate-booking:", e2?.message);
    }
    if (r && r.engine) return r;
    return null;
  },
  async confirmPlan(payload) {
    return api("/api/ai/confirm-plan", {
      method: "POST",
      body: JSON.stringify(payload || {})
    });
  }
};

// ---- AI API ----
const AIAPI = {
  async suggest(problem) {
    return api("/ai/suggest", { method: "POST", body: JSON.stringify({ problem }) });
  },
  async demoFlow(problem) {
    return api("/ai/demo/flow", { method: "POST", body: JSON.stringify({ problem }) });
  },
  async track(workerName) {
    return api(`/ai/track/${encodeURIComponent(workerName)}`);
  }
};

// ---- Payments (Razorpay) ----
const PaymentAPI = {
  async getKey() {
    return api("/api/payments/key");
  },
  async createOrder(payload) {
    return api("/api/payments/create-order", {
      method: "POST",
      body: JSON.stringify(payload)
    });
  },
  async verify(payload) {
    return api("/api/payments/verify", {
      method: "POST",
      body: JSON.stringify(payload)
    });
  },
  async walletTopup(amountRupees) {
    return api("/api/payments/wallet/topup", {
      method: "POST",
      body: JSON.stringify({ amountRupees })
    });
  },
  async subscription(planCode) {
    return api("/api/payments/subscription", {
      method: "POST",
      body: JSON.stringify({ planCode })
    });
  },
  async bookingSettle(payload) {
    return api("/api/payments/booking/settle", {
      method: "POST",
      body: JSON.stringify(payload)
    });
  },
  /** Marks a booking paid without Razorpay (server demo endpoint). */
  async dummyCompleteBooking(payload) {
    return api("/api/payments/booking/dummy-complete", {
      method: "POST",
      body: JSON.stringify(payload || {})
    });
  },
  async refund(bookingId, opts = {}) {
    return api("/api/payments/refund", {
      method: "POST",
      body: JSON.stringify({ bookingId, ...opts })
    });
  },
  async history(filters = {}) {
    const qs = new URLSearchParams(filters).toString();
    const q = qs ? `?${qs}` : "";
    return api(`/api/payments/history${q}`);
  }
};

/** Load Razorpay Checkout script once */
function loadRazorpayScript() {
  return new Promise((resolve, reject) => {
    if (typeof window !== "undefined" && window.Razorpay) return resolve();
    const existing = document.querySelector('script[data-razorpay-checkout="1"]');
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", reject);
      return;
    }
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.async = true;
    s.dataset.razorpayCheckout = "1";
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Could not load Razorpay Checkout"));
    document.head.appendChild(s);
  });
}

/**
 * Opens Razorpay Checkout; resolves with razorpay response object on success.
 */
async function openRazorpayModal({ keyId, orderId, amountPaise, companyName = "FixMate", description }) {
  await loadRazorpayScript();
  const prefill = {};
  try {
    const u = Auth.getUser();
    if (u?.name) prefill.name = u.name;
    if (u?.email) prefill.email = u.email;
    if (u?.phone) prefill.contact = String(u.phone).replace(/\s/g, "");
  } catch (_) {}

  return new Promise((resolve, reject) => {
    const opts = {
      key: keyId,
      amount: amountPaise,
      currency: "INR",
      order_id: orderId,
      name: companyName,
      description: description || "Secure payment via FixMate",
      prefill,
      handler(resp) {
        resolve(resp);
      },
      modal: {
        ondismiss() {
          reject(new Error("Payment window closed"));
        }
      },
      theme: { color: "#6A1B9A" }
    };
    const rz = new window.Razorpay(opts);
    rz.on("payment.failed", function (resp) {
      reject(new Error(resp?.error?.description || "Payment failed"));
    });
    rz.open();
  });
}

// ---- Admin API ----
const AdminAPI = {
  async getStats() { return api("/api/admin/stats"); },
  async getUsers() { return api("/api/admin/users"); },
  async getWorkers() { return api("/api/admin/workers"); },
  async getBookings() { return api("/api/admin/bookings"); },
  async getAnalytics() { return api("/api/admin/analytics"); },
  async verifyWorker(id) { return api(`/api/admin/workers/${id}/verify`, { method: "PATCH" }); },
  async suspendWorker(id) { return api(`/api/admin/workers/${id}/suspend`, { method: "PATCH" }); },
  async suspendUser(id) { return api(`/api/admin/users/${id}/suspend`, { method: "PATCH" }); }
};

// ---- Page Guards ----
function isLocalPreviewMode() {
  if (typeof window === "undefined") return false;
  const h = (window.location.hostname || "").toLowerCase();
  const p = (window.location.pathname || "").toLowerCase();
  const localHost = h === "localhost" || h === "127.0.0.1";
  const appPath = p.includes("/worker/") || p.includes("/customer/") || p.includes("/admin/");
  return localHost && appPath;
}

function requireAuth(allowedRoles = []) {
  if (!Auth.isLoggedIn()) {
    if (isLocalPreviewMode()) return false; // allow static preview without forced redirect
    Auth.redirectToLogin();
    return false;
  }
  if (allowedRoles.length && !allowedRoles.includes(Auth.getRole())) {
    if (isLocalPreviewMode()) return false; // allow static preview when role mismatches
    Auth.redirectToDashboard();
    return false;
  }
  
  // Background token verification
  AuthAPI.verify().catch(e => {
    console.warn("Background verification failed or offline", e);
    // If it's a 401 from verify, api.js will auto-trigger Auth.logout()
  });

  return true;
}

function redirectIfLoggedIn() {
  if (Auth.isLoggedIn()) {
    Auth.redirectToDashboard();
    return true;
  }
  return false;
}

function autoEnforcePathRole() {
  if (typeof window === "undefined") return;
  const path = window.location.pathname.toLowerCase();
  if (path.endsWith("/login.html") || path.endsWith("/register.html")) return;
  if (path.includes("/worker/")) {
    requireAuth(["worker"]);
    return;
  }
  if (path.includes("/customer/")) {
    requireAuth(["customer"]);
    return;
  }
  if (path.includes("/admin/")) {
    requireAuth(["admin"]);
  }
}

// ---- UI Helpers ----
function showToast(message, type = "success") {
  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.style.cssText = `
    position:fixed;bottom:90px;left:50%;transform:translateX(-50%);
    padding:12px 24px;border-radius:12px;font-size:0.875rem;font-weight:600;
    z-index:9999;animation:fadeInUp 0.3s ease;color:#fff;
    background:${type==="success"?"#10b981":type==="error"?"#ef4444":"#6c3ce1"};
    box-shadow:0 8px 24px rgba(0,0,0,0.15);
  `;
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => { toast.style.opacity = "0"; toast.style.transition = "opacity 0.3s"; setTimeout(() => toast.remove(), 300); }, 3000);
}

function showLoading(container) {
  if (typeof container === "string") container = document.getElementById(container);
  if (container) container.innerHTML = '<div style="text-align:center;padding:40px;color:var(--text-muted);"><div style="font-size:2rem;margin-bottom:8px;">⏳</div>Loading...</div>';
}

function showError(container, message) {
  if (typeof container === "string") container = document.getElementById(container);
  if (container) container.innerHTML = `<div style="text-align:center;padding:40px;color:var(--accent-red);"><div style="font-size:2rem;margin-bottom:8px;">⚠️</div>${message}</div>`;
}

function showEmpty(container, message = "No data found") {
  if (typeof container === "string") container = document.getElementById(container);
  if (container) container.innerHTML = `<div style="text-align:center;padding:40px;color:var(--text-muted);"><div style="font-size:2rem;margin-bottom:8px;">📭</div>${message}</div>`;
}

// Update navbar user info
function updateNavbarUser() {
  const user = Auth.getUser();
  if (!user) return;
  
  // Update auth button text
  document.querySelectorAll(".nav-auth-btn").forEach(btn => {
    btn.innerHTML = `<span>👤</span> ${user.name}`;
    btn.href = "#";
    btn.onclick = (e) => { e.preventDefault(); Auth.logout(); };
  });

  // Update sidebar user info
  const avatar = user.name.split(" ").map(n => n[0]).join("").toUpperCase();
  document.querySelectorAll(".dash-sidebar .user-avatar, .worker-nav-avatar img").forEach(el => {
    if (el.tagName === "IMG") el.alt = user.name;
  });
}

// Run on every page
document.addEventListener("DOMContentLoaded", () => {
  autoEnforcePathRole();
  if (Auth.isLoggedIn()) updateNavbarUser();
});
