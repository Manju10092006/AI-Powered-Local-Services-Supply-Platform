/* ============================================
   FIXMATE AI — Frontend API Layer
   Connects all HTML pages to the backend
   ============================================ */

const API_BASE = "http://localhost:5000";

// ---- Auth Manager ----
const Auth = {
  getToken() {
    return localStorage.getItem("fixmate_token");
  },
  getUser() {
    try { return JSON.parse(localStorage.getItem("fixmate_user")); } catch { return null; }
  },
  getRole() {
    return localStorage.getItem("fixmate_role");
  },
  isLoggedIn() {
    return !!this.getToken();
  },
  save(token, user, role) {
    localStorage.setItem("fixmate_token", token);
    localStorage.setItem("fixmate_user", JSON.stringify(user));
    localStorage.setItem("fixmate_role", role);
  },
  logout() {
    localStorage.removeItem("fixmate_token");
    localStorage.removeItem("fixmate_user");
    localStorage.removeItem("fixmate_role");
    // Redirect to login relative to current path depth
    const depth = window.location.pathname.split("/").filter(Boolean).length;
    const prefix = depth > 1 ? "../" : "";
    window.location.href = prefix + "login.html";
  },
  redirectToDashboard() {
    const role = this.getRole();
    const depth = window.location.pathname.split("/").filter(Boolean).length;
    const prefix = depth > 1 ? "../" : "";
    if (role === "worker") window.location.href = prefix + "worker/dashboard.html";
    else if (role === "admin") window.location.href = prefix + "admin/dashboard.html";
    else window.location.href = prefix + "customer/dashboard.html";
  }
};

// ---- API Fetch Helper ----
async function api(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const headers = { "Content-Type": "application/json", ...options.headers };
  const token = Auth.getToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;

  try {
    const res = await fetch(url, { ...options, headers });
    const data = await res.json();

    if (res.status === 401) {
      // Token expired or invalid
      Auth.logout();
      return null;
    }
    if (!res.ok) {
      throw new Error(data.error || `Request failed (${res.status})`);
    }
    return data;
  } catch (err) {
    if (err.message.includes("Failed to fetch") || err.message.includes("NetworkError")) {
      console.warn("[API] Server unreachable, using offline mode");
      return null;
    }
    throw err;
  }
}

// ---- Auth API ----
const AuthAPI = {
  async login(email, password) {
    return api("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password })
    });
  },
  async register(data) {
    return api("/auth/register", {
      method: "POST",
      body: JSON.stringify(data)
    });
  },
  async verify() {
    return api("/auth/verify");
  }
};

// ---- User API ----
const UserAPI = {
  async getMe() { return api("/api/users/me"); },
  async updateProfile(data) {
    return api("/api/users/me", { method: "PUT", body: JSON.stringify(data) });
  },
  async getBookings() { return api("/api/users/bookings"); },
  async getStats() { return api("/api/users/stats"); }
};

// ---- Worker API ----
const WorkerAPI = {
  async getDashboard() { return api("/api/workers/dashboard"); },
  async getJobs() { return api("/api/workers/jobs"); },
  async acceptJob(id) { return api(`/api/workers/jobs/${id}/accept`, { method: "POST" }); },
  async rejectJob(id) { return api(`/api/workers/jobs/${id}/reject`, { method: "POST" }); },
  async completeJob(id) { return api(`/api/workers/jobs/${id}/complete`, { method: "POST" }); },
  async getEarnings() { return api("/api/workers/earnings"); },
  async toggleOnline() { return api("/api/workers/toggle-online", { method: "PATCH" }); },
  async updateProfile(data) {
    return api("/api/workers/profile", { method: "PUT", body: JSON.stringify(data) });
  }
};

// ---- Booking API ----
const BookingAPI = {
  async list() { return api("/api/bookings"); },
  async create(data) {
    return api("/api/bookings", { method: "POST", body: JSON.stringify(data) });
  },
  async get(id) { return api(`/api/bookings/${id}`); },
  async cancel(id) { return api(`/api/bookings/${id}/cancel`, { method: "PATCH" }); },
  async rate(id, rating, comment) {
    return api(`/api/bookings/${id}/rate`, { method: "POST", body: JSON.stringify({ rating, comment }) });
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
function requireAuth(allowedRoles = []) {
  if (!Auth.isLoggedIn()) {
    const depth = window.location.pathname.split("/").filter(Boolean).length;
    const prefix = depth > 1 ? "../" : "";
    window.location.href = prefix + "login.html";
    return false;
  }
  if (allowedRoles.length && !allowedRoles.includes(Auth.getRole())) {
    Auth.redirectToDashboard();
    return false;
  }
  return true;
}

function redirectIfLoggedIn() {
  if (Auth.isLoggedIn()) {
    Auth.redirectToDashboard();
    return true;
  }
  return false;
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
  if (Auth.isLoggedIn()) updateNavbarUser();
});
