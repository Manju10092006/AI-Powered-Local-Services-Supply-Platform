/* ============================================
   FIXMATE AI — Unified Backend Server
   Merges: Node AI server + Python backend logic
   Auth: JWT-based with in-memory store
   ============================================ */
const path = require("path");
// `override: true` so values from server/.env win over empty inherited vars (Windows / CI often set RAZORPAY_* blank).
require("dotenv").config({ path: path.join(__dirname, ".env"), quiet: true, override: true });
const express = require("express");
const crypto = require("crypto");
const aiRoutes = require("./routes/aiRoutes");
const healthRoutes = require("./routes/healthRoutes");
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const workerRoutes = require("./routes/workerRoutes");
const bookingRoutes = require("./routes/bookingRoutes");
const adminRoutes = require("./routes/adminRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const slotRoutes = require("./routes/slotRoutes");
const aiBookingRoutes = require("./routes/aiBookingRoutes");
const { analyze: fastBookingAnalyze, customerRouter: fastBookingCustomerRouter } = require("./routes/fastBookingRoutes");
const { authMiddleware } = require("./middleware/auth");
const { isConfigured: isRazorpayConfigured } = require("./services/razorpayService");
const { bookings, workers } = require("./data/store");
const { generateSlots } = require("./services/slotEngine");
const { calculateBookingAI } = require("./services/bookingAIEngine");

const app = express();
const PORT = process.env.PORT || 5000;
app.disable("x-powered-by");

// Rate limiting
const requestStore = new Map();
const MAX_REQUESTS_PER_MINUTE = 60;

// CORS — allow configured frontend origins only
const configuredOrigins = (process.env.FRONTEND_ORIGINS || "")
  .split(",")
  .map(s => s.trim())
  .filter(Boolean);
const defaultOrigins = ["http://localhost:5501", "http://127.0.0.1:5501", "http://localhost:3000"];
const allowedOrigins = new Set(configuredOrigins.length ? configuredOrigins : defaultOrigins);
app.use((req, res, next) => {
  const origin = req.headers.origin || "";
  if (origin && !allowedOrigins.has(origin)) {
    return res.status(403).json({ error: "Origin not allowed" });
  }
  if (origin) res.header("Access-Control-Allow-Origin", origin);
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (origin) res.header("Access-Control-Allow-Credentials", "true");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

app.use(express.json({ limit: "5mb" }));

// Request logging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

// Rate limiter
app.use((req, res, next) => {
  const ip = req.ip || req.socket?.remoteAddress || "unknown";
  const now = Date.now();
  const windowStart = now - 60_000;
  const recent = (requestStore.get(ip) || []).filter(ts => ts > windowStart);
  if (recent.length >= MAX_REQUESTS_PER_MINUTE) {
    return res.status(429).json({ error: "Too many requests" });
  }
  recent.push(now);
  requestStore.set(ip, recent);
  next();
});

// Health
app.get("/", (req, res) => {
  res.json({ message: "FixMate AI backend running", version: "2.0.0" });
});

// Public routes
app.use("/health", healthRoutes);
app.use("/auth", authRoutes);

/* Public pricing + slots (no JWT) — same engines as /api/*; use when SPA hits wrong origin or for previews */
app.get("/public/slots/available", (req, res) => {
  const { date, city, category } = req.query;
  if (!date || !category) {
    return res.status(400).json({ error: "date and category are required (YYYY-MM-DD)" });
  }
  const result = generateSlots({
    date: String(date),
    city: String(city || "Hyderabad"),
    category: String(category),
    bookings,
    workers,
    membership: "free"
  });
  if (result.error) return res.status(400).json({ error: result.error });
  return res.json(result);
});

app.post("/public/calculate-booking", (req, res) => {
  const { service, category, problem, cartValue, city, membership, llmHints } = req.body || {};
  const customer = {
    city: String(city || "Hyderabad"),
    membership: String(membership || "free").toLowerCase()
  };
  const engine = calculateBookingAI({
    service: String(service || ""),
    category: String(category || "cleaning"),
    problem: String(problem || ""),
    cartValue: Number(cartValue) || 0,
    customer,
    now: new Date(),
    llmHints: llmHints && typeof llmHints === "object" ? llmHints : null
  });
  return res.json({ ok: true, engine, source: "public" });
});

// AI routes (public - for demo/search)
app.use("/ai", aiRoutes);

// Smart booking — AI Express analyze (public)
app.post("/fast-booking/analyze", fastBookingAnalyze);

// Google Maps browser key (locked by referrer in GCP)
app.get("/api/maps/key", authMiddleware, (req, res) => {
  const key = process.env.GOOGLE_MAPS_API_KEY || process.env.MAPS_BROWSER_KEY || "";
  if (!key) return res.status(503).json({ error: "Google Maps key not configured" });
  return res.json({ key });
});

// Protected routes
app.use("/api/users", authMiddleware, userRoutes);
app.use("/api/workers", authMiddleware, workerRoutes);
app.use("/worker", authMiddleware, workerRoutes);
app.use("/api/bookings", authMiddleware, bookingRoutes);
app.use("/api/slots", authMiddleware, slotRoutes);
app.use("/api/ai", authMiddleware, aiBookingRoutes);
app.use("/fast-booking", authMiddleware, fastBookingCustomerRouter);
app.use("/api/payments", authMiddleware, paymentRoutes);
app.use("/api/admin", authMiddleware, adminRoutes);

// Error handler
app.use((err, req, res, next) => {
  console.error("[SERVER_ERROR]", err.message);
  res.status(err.status || 500).json({ error: err.message || "Internal server error" });
});

const server = app.listen(PORT);
server.once("listening", () => {
  console.log(`\n🔧 FixMate AI unified server running on http://localhost:${PORT}`);
  console.log(`   Auth:     POST /auth/login, /auth/register`);
  console.log(`   AI:       POST /ai/suggest, /ai/demo/flow, /ai/demo/run, /ai/book`);
  console.log(`   Users:    GET  /api/users/me`);
  console.log(`   Bookings: GET  /api/bookings, POST /api/bookings, PATCH /api/bookings/:id/reschedule`);
  console.log(`   Slots:    GET  /api/slots/available?date=&category=&city=`);
  console.log(`   Public:   GET  /public/slots/available?date=&category=&city=`);
  console.log(`   Public:   POST /public/calculate-booking (pricing preview, no auth)\n`);
  console.log(`   Fast:     POST /fast-booking/analyze | /fast-booking/confirm | GET /fast-booking/status/:id`);
  console.log(`   Payments: POST /api/payments/create-order, /verify, GET /history\n`);
  console.log(`   Workers:  GET  /api/workers/dashboard, POST /worker/toggle-status`);
  console.log(`   Admin:    GET  /api/admin/stats\n`);
  console.log(
    isRazorpayConfigured()
      ? "   Razorpay: enabled (keys loaded)\n"
      : "   Razorpay: NOT configured — set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in backend-repo/server/.env\n"
  );
});
server.on("error", err => {
  console.error("[LISTEN_ERROR]", err.message);
  process.exit(1);
});

// Piped stdin (e.g. `concurrently` on Windows) can close immediately; keep the handle active so the process stays up.
if (process.stdin?.resume) {
  try {
    process.stdin.resume();
  } catch (_) {}
}
