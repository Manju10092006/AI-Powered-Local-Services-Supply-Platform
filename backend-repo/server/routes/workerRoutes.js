/* Worker Routes — Dashboard, Jobs, Earnings */
const express = require("express");
const { bookings, workers, users, findUserById, fastInvites, fastRequests } = require("../data/store");
const { requireRole } = require("../middleware/auth");
const { findNextAvailableWorker } = require("../services/matchService");

const router = express.Router();

// Only workers can access worker APIs
router.use(requireRole("worker"));

// GET /api/workers/dashboard
router.get("/dashboard", (req, res) => {
  const worker = findUserById(req.userId);
  if (!worker || worker.role !== "worker") {
    return res.status(403).json({ error: "Worker access only" });
  }

  const myJobs = bookings.filter(b => b.workerId === req.userId);
  const todayJobs = myJobs.filter(b => {
    const d = new Date(b.createdAt);
    const now = new Date();
    return d.toDateString() === now.toDateString();
  });
  const todayEarnings = todayJobs.filter(b => b.status === "completed").reduce((s, b) => s + b.price, 0);

  return res.json({
    worker: { ...req.user, wallet: worker.wallet },
    stats: {
      todayEarnings,
      todayJobs: todayJobs.length,
      rating: worker.rating,
      monthJobs: worker.totalJobs,
      wallet: worker.wallet,
      isOnline: worker.isOnline
    }
  });
});

// GET /api/workers/jobs — pending job requests for this worker's skill area
router.get("/jobs", (req, res) => {
  const worker = findUserById(req.userId);
  if (!worker || worker.role !== "worker") {
    return res.status(403).json({ error: "Worker access only" });
  }

  const withCustomer = b => {
    const u = users.find(x => x.id === b.customerId);
    return { ...b, customerName: u ? u.name : "Customer" };
  };

  const assignedJobs = bookings.filter(b => b.workerId === req.userId).map(withCustomer);

  const pendingJobs = bookings
    .filter(b => !b.workerId && ["scheduled", "pending"].includes(b.status))
    .map(withCustomer);

  return res.json({
    assigned: assignedJobs,
    incoming: pendingJobs,
    total: assignedJobs.length + pendingJobs.length
  });
});

// POST /api/workers/jobs/:id/accept
router.post("/jobs/:id/accept", handleAcceptBooking);
router.post("/bookings/:id/accept", handleAcceptBooking);

// POST /api/workers/jobs/:id/reject
router.post("/jobs/:id/reject", handleRejectBooking);
router.post("/bookings/:id/reject", handleRejectBooking);

function handleAcceptBooking(req, res) {
  const booking = bookings.find((b) => b.id === req.params.id);
  if (!booking) return res.status(404).json({ error: "Booking not found" });

  const worker = findUserById(req.userId);
  if (!worker || worker.role !== "worker") {
    return res.status(403).json({ error: "Worker access only" });
  }
  if (!worker.isOnline) {
    return res.status(400).json({ error: "Worker must be online to accept jobs" });
  }
  if (booking.workerId && booking.workerId !== req.userId) {
    return res.status(409).json({ error: "Job already assigned to another worker" });
  }
  if (!["scheduled", "pending", "assigned"].includes(booking.status)) {
    return res.status(400).json({ error: `Cannot accept job in status: ${booking.status}` });
  }

  booking.workerId = req.userId;
  booking.status = "confirmed";
  booking.otp = String(Math.floor(1000 + Math.random() * 9000));

  return res.json({ message: "Job accepted", booking });
}

function handleRejectBooking(req, res) {
  const booking = bookings.find((b) => b.id === req.params.id);
  if (!booking) return res.status(404).json({ error: "Booking not found" });

  if (booking.workerId !== req.userId) {
    return res.status(403).json({ error: "Not authorized to reject this booking" });
  }

  const nextWorker = findNextAvailableWorker(booking, req.userId);
  if (nextWorker && nextWorker.id) {
    booking.workerId = nextWorker.id;
    booking.status = "assigned";
    booking.otp = String(Math.floor(1000 + Math.random() * 9000));
    return res.json({ message: "Job rejected and reassigned", booking, nextWorker });
  }

  booking.workerId = null;
  booking.status = "scheduled";
  return res.json({ message: "Job rejected, no worker available right now", booking, nextWorker });
}

// POST /api/workers/jobs/:id/complete
router.post("/jobs/:id/complete", (req, res) => {
  const booking = bookings.find((b) => b.id === req.params.id);
  if (!booking) return res.status(404).json({ error: "Booking not found" });
  if (booking.workerId !== req.userId) {
    return res.status(403).json({ error: "Not authorized to complete this job" });
  }
  if (!["confirmed", "in-progress", "assigned"].includes(booking.status)) {
    return res.status(400).json({ error: `Cannot complete job in status: ${booking.status}` });
  }

  booking.status = "completed";
  booking.completedAt = new Date().toISOString();
  const worker = findUserById(req.userId);
  if (worker) {
    worker.totalJobs += 1;
    worker.totalEarnings += booking.price;
    worker.wallet += Math.round(booking.price * 0.8); // 80% to worker
  }
  return res.json({ message: "Job completed", booking });
});

// POST /api/workers/jobs/:id/start
router.post("/jobs/:id/start", (req, res) => {
  const booking = bookings.find((b) => b.id === req.params.id);
  if (!booking) return res.status(404).json({ error: "Booking not found" });
  if (booking.workerId !== req.userId) {
    return res.status(403).json({ error: "Not authorized to start this job" });
  }
  if (!["confirmed", "assigned"].includes(booking.status)) {
    return res.status(400).json({ error: `Cannot start job in status: ${booking.status}` });
  }
  booking.status = "in-progress";
  booking.startedAt = new Date().toISOString();
  return res.json({ message: "Job started", booking });
});

// GET /api/workers/earnings
router.get("/earnings", (req, res) => {
  const worker = findUserById(req.userId);
  if (!worker || worker.role !== "worker") {
    return res.status(403).json({ error: "Worker access only" });
  }

  const myJobs = bookings.filter((b) => b.workerId === req.userId && b.status === "completed");
  const weekEarnings = [2100, 3400, 2750, 4050, 3100, 4400, 4850]; // Simulated

  return res.json({
    wallet: worker.wallet,
    totalEarnings: worker.totalEarnings,
    thisWeek: weekEarnings.reduce((a, b) => a + b, 0),
    thisMonth: worker.totalEarnings,
    weekChart: weekEarnings,
    completedJobs: myJobs.length,
    avgPerJob: myJobs.length ? Math.round(worker.totalEarnings / myJobs.length) : 0
  });
});

// POST /api/workers/toggle-status
router.post("/toggle-status", (req, res) => {
  const worker = findUserById(req.userId);
  if (!worker || worker.role !== "worker") {
    return res.status(403).json({ error: "Worker access only" });
  }

  const status = (req.body?.status || "ONLINE").toString().toUpperCase();
  const allowed = ["ONLINE", "OFFLINE", "BUSY"];
  if (!allowed.includes(status)) {
    return res.status(400).json({ error: "Status must be ONLINE, OFFLINE, or BUSY" });
  }

  worker.availability = status;
  worker.isOnline = status === "ONLINE";
  return res.json({ availability: worker.availability, isOnline: worker.isOnline });
});

// PATCH /api/workers/toggle-online
router.patch("/toggle-online", (req, res) => {
  const worker = findUserById(req.userId);
  if (!worker || worker.role !== "worker") {
    return res.status(403).json({ error: "Worker access only" });
  }
  worker.isOnline = !worker.isOnline;
  worker.availability = worker.isOnline ? "ONLINE" : "OFFLINE";
  return res.json({ isOnline: worker.isOnline, availability: worker.availability });
});

// GET /api/workers/fast-offers — AI Express invites (15s accept window)
router.get("/fast-offers", (req, res) => {
  const worker = findUserById(req.userId);
  if (!worker || worker.role !== "worker") {
    return res.status(403).json({ error: "Worker access only" });
  }
  const now = Date.now();
  const mine = fastInvites.filter(
    i => i.workerId === req.userId && i.status === "pending" && new Date(i.expiresAt).getTime() > now
  );
  const invites = mine.map(i => {
    const fr = fastRequests.find(f => f.id === i.fastRequestId);
    const b = bookings.find(bk => bk.id === i.bookingId);
    return {
      ...i,
      booking: b
        ? { id: b.id, service: b.service, price: b.price, address: b.address, etaMinutes: b.etaMinutes }
        : null,
      analysis: fr?.analysis || null
    };
  });
  return res.json({ invites });
});

router.post("/fast-offers/:inviteId/accept", (req, res) => {
  const invite = fastInvites.find(i => i.id === req.params.inviteId);
  if (!invite || invite.workerId !== req.userId) return res.status(404).json({ error: "Invite not found" });
  const worker = findUserById(req.userId);
  if (worker && worker.isOnline === false) {
    return res.status(400).json({ error: "Go online to accept express jobs" });
  }
  if (invite.status !== "pending") return res.status(400).json({ error: "Invite no longer active" });
  if (Date.now() > new Date(invite.expiresAt).getTime()) {
    invite.status = "expired";
    return res.status(400).json({ error: "Invite expired" });
  }
  const fr = fastRequests.find(f => f.id === invite.fastRequestId);
  const booking = bookings.find(b => b.id === invite.bookingId);
  if (!fr || !booking) return res.status(404).json({ error: "Booking missing" });
  if (fr.status !== "dispatching") return res.status(400).json({ error: "Already assigned" });

  booking.workerId = req.userId;
  booking.status = "assigned";
  booking.otp = String(Math.floor(1000 + Math.random() * 9000));
  fr.status = "assigned";
  fr.acceptedWorkerId = req.userId;
  invite.status = "accepted";
  for (const o of fastInvites) {
    if (o.fastRequestId === fr.id && o.id !== invite.id && o.status === "pending") o.status = "expired";
  }
  return res.json({ message: "Fast booking accepted", booking });
});

router.post("/fast-offers/:inviteId/reject", (req, res) => {
  const invite = fastInvites.find(i => i.id === req.params.inviteId);
  if (!invite || invite.workerId !== req.userId) return res.status(404).json({ error: "Invite not found" });
  invite.status = "rejected";
  return res.json({ message: "Declined" });
});

// PUT /api/workers/profile
router.put("/profile", (req, res) => {
  const worker = findUserById(req.userId);
  if (!worker || worker.role !== "worker") {
    return res.status(403).json({ error: "Worker access only" });
  }
  const { name, phone, city, skill, experience, serviceZones } = req.body || {};
  if (name) worker.name = name;
  if (phone) worker.phone = phone;
  if (city) worker.city = city;
  if (skill) worker.skill = skill;
  if (experience) worker.experience = experience;
  if (serviceZones) worker.serviceZones = serviceZones;

  const { password, ...safe } = worker;
  return res.json({ worker: safe, message: "Profile updated" });
});

// --- FixMate Worker Pro: dashboard summary, onboarding, messages, tracking ---

router.get("/onboarding/status", (req, res) => {
  const worker = findUserById(req.userId);
  if (!worker || worker.role !== "worker") return res.status(403).json({ error: "Worker only" });
  return res.json({
    onboardingApproved: worker.onboardingApproved !== false,
    approvalStatus: worker.approvalStatus || "approved",
    currentStep: worker.onboarding?.currentStep || 7,
    submittedAt: worker.onboarding?.submittedAt || null,
    data: worker.onboarding?.data || {}
  });
});

router.put("/onboarding/step", (req, res) => {
  const worker = findUserById(req.userId);
  if (!worker || worker.role !== "worker") return res.status(403).json({ error: "Worker only" });
  const { step, data } = req.body || {};
  const n = Number(step);
  if (!Number.isFinite(n) || n < 1 || n > 7) {
    return res.status(400).json({ error: "step must be 1-7" });
  }
  if (!worker.onboarding) worker.onboarding = { currentStep: 1, data: {}, submittedAt: null };
  worker.onboarding.currentStep = Math.max(worker.onboarding.currentStep || 1, n);
  if (data && typeof data === "object") {
    worker.onboarding.data = { ...worker.onboarding.data, ...data, lastStep: n };
  }
  return res.json({ ok: true, onboarding: worker.onboarding });
});

router.post("/onboarding/submit", (req, res) => {
  const worker = findUserById(req.userId);
  if (!worker || worker.role !== "worker") return res.status(403).json({ error: "Worker only" });
  if (!worker.onboarding) worker.onboarding = { currentStep: 7, data: {}, submittedAt: null };
  worker.onboarding.submittedAt = new Date().toISOString();
  worker.onboarding.currentStep = 7;
  worker.approvalStatus = "in_review";
  worker.onboardingApproved = false;
  return res.json({
    ok: true,
    message: "Documents under review — AI + manual verification in progress.",
    approvalStatus: worker.approvalStatus
  });
});

router.get("/pro/summary", (req, res) => {
  const worker = findUserById(req.userId);
  if (!worker || worker.role !== "worker") return res.status(403).json({ error: "Worker only" });

  const myJobs = bookings.filter(b => b.workerId === req.userId);
  const completed = myJobs.filter(b => b.status === "completed");
  const now = new Date();
  const todayStr = now.toDateString();
  const todayEarn = completed
    .filter(b => new Date(b.createdAt).toDateString() === todayStr)
    .reduce((s, b) => s + (Number(b.price) || 0), 0);

  const byCat = {};
  completed.forEach(b => {
    const c = (b.category || "general").replace(/-/g, " ");
    byCat[c] = (byCat[c] || 0) + 1;
  });
  const jobTypes = Object.entries(byCat).map(([label, value]) => ({ label, value }));

  const last7 = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const ds = d.toDateString();
    const sum = completed
      .filter(b => new Date(b.createdAt).toDateString() === ds)
      .reduce((s, b) => s + (Number(b.price) || 0), 0);
    last7.push(Math.round(sum || (worker.totalEarnings > 0 ? 800 + i * 120 : 0)));
  }

  const feed = [];
  completed.slice(0, 4).forEach(b => {
    feed.push({
      type: "payment",
      text: `₹${b.price} credited — ${(b.service || "Job").slice(0, 42)}`,
      at: b.createdAt
    });
  });
  myJobs
    .filter(b => ["confirmed", "in-progress", "assigned"].includes(b.status))
    .slice(0, 2)
    .forEach(b => {
      feed.push({ type: "booking", text: `Active: ${(b.service || "").slice(0, 50)}`, at: b.scheduledAt || b.createdAt });
    });

  const incoming = bookings.filter(b => !b.workerId && ["scheduled", "pending"].includes(b.status)).length;

  return res.json({
    kpis: {
      totalEarnings: worker.totalEarnings || 0,
      todayEarnings: todayEarn,
      jobsCompleted: completed.length,
      rating: worker.rating || 0,
      acceptanceRate: Math.min(99, 85 + Math.min(14, completed.length)),
      monthlyGrowth: 8.2,
      pendingPayout: Math.round((worker.wallet || 0) * 0.25),
      incomingNearby: incoming
    },
    charts: {
      earningsWeek: last7,
      jobTypes: jobTypes.length ? jobTypes : [{ label: "Service", value: 1 }]
    },
    feed: feed.slice(0, 10),
    wallet: worker.wallet || 0,
    isOnline: !!worker.isOnline,
    totalJobs: worker.totalJobs || 0
  });
});

router.get("/messages", (req, res) => {
  const worker = findUserById(req.userId);
  if (!worker || worker.role !== "worker") return res.status(403).json({ error: "Worker only" });
  const my = bookings.filter(b => b.workerId === req.userId || (!b.workerId && b.status === "scheduled"));
  const threads = my.slice(0, 30).map(b => {
    const u = users.find(x => x.id === b.customerId);
    return {
      id: `th_${b.id}`,
      bookingId: b.id,
      customerName: u ? u.name : "Customer",
      customerPhone: u ? u.phone : "",
      lastMessage: (b.description || b.service || "Booking update").slice(0, 120),
      updatedAt: b.scheduledAt || b.createdAt,
      unread: b.workerId === req.userId ? 0 : 1
    };
  });
  return res.json({ threads });
});

router.get("/messages/:bookingId", (req, res) => {
  const worker = findUserById(req.userId);
  const b = bookings.find(x => x.id === req.params.bookingId);
  if (!b) return res.status(404).json({ error: "Not found" });
  if (b.workerId && b.workerId !== req.userId) return res.status(403).json({ error: "Forbidden" });
  const u = users.find(x => x.id === b.customerId);
  return res.json({
    booking: b,
    customer: u ? { name: u.name, phone: u.phone, city: u.city } : null,
    messages: [
      { id: 1, from: "customer", text: "Hi, are you on the way?", at: b.createdAt },
      { id: 2, from: "system", text: "Booking confirmed. Share OTP on arrival.", at: b.createdAt }
    ]
  });
});

router.get("/active-booking", (req, res) => {
  const worker = findUserById(req.userId);
  if (!worker || worker.role !== "worker") return res.status(403).json({ error: "Worker only" });
  const b = bookings.find(
    x => x.workerId === req.userId && ["confirmed", "in-progress", "assigned"].includes(x.status)
  );
  if (!b) return res.json({ booking: null });
  const u = users.find(x => x.id === b.customerId);
  return res.json({
    booking: b,
    customer: u ? { name: u.name, phone: u.phone } : { name: "Customer", phone: "" }
  });
});

router.get("/performance", (req, res) => {
  const worker = findUserById(req.userId);
  if (!worker || worker.role !== "worker") return res.status(403).json({ error: "Worker only" });
  const my = bookings.filter(b => b.workerId === req.userId);
  const completed = my.filter(b => b.status === "completed").length;
  const cancelled = my.filter(b => b.status === "cancelled").length;
  const total = my.length || 1;
  return res.json({
    acceptancePct: Math.round(88 + (worker.rating || 4) * 2),
    completionPct: Math.round((completed / total) * 100),
    avgRating: worker.rating || 0,
    cancellationPct: Math.round((cancelled / total) * 100),
    repeatCustomers: Math.min(completed, 12),
    peakHours: ["10–12", "17–20"],
    series: [12, 18, 14, 22, 28, 20, 16]
  });
});

router.get("/documents", (req, res) => {
  const worker = findUserById(req.userId);
  if (!worker || worker.role !== "worker") return res.status(403).json({ error: "Worker only" });
  const docs = worker.workerDocuments && worker.workerDocuments.length
    ? worker.workerDocuments
    : [
        { id: "kyc", label: "Aadhaar / National ID", status: worker.isVerified ? "approved" : "pending" },
        { id: "pan", label: "PAN / Tax ID", status: "pending" },
        { id: "skill", label: "Skill certificate", status: "pending" },
        { id: "bank", label: "Bank verification", status: worker.bank && worker.bank.ifsc ? "approved" : "pending" },
        { id: "insurance", label: "Insurance", status: "pending" }
      ];
  return res.json({ documents: docs });
});

router.put("/documents/:docId", (req, res) => {
  const worker = findUserById(req.userId);
  if (!worker || worker.role !== "worker") return res.status(403).json({ error: "Worker only" });
  const { status, note } = req.body || {};
  if (!worker.workerDocuments) worker.workerDocuments = [];
  let row = worker.workerDocuments.find(d => d.id === req.params.docId);
  if (!row) {
    row = { id: req.params.docId, label: req.params.docId, status: "pending" };
    worker.workerDocuments.push(row);
  }
  if (status) row.status = status;
  if (note) row.note = note;
  return res.json({ ok: true, document: row });
});

module.exports = router;
