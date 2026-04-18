/* Admin Routes */
const express = require("express");
const { users, workers, admins, bookings, safeUser } = require("../data/store");
const { requireRole } = require("../middleware/auth");

const router = express.Router();

// All admin routes require admin role
router.use(requireRole("admin"));

// GET /api/admin/stats
router.get("/stats", (req, res) => {
  const activeBookings = bookings.filter(b => ["in-progress", "scheduled", "confirmed", "assigned"].includes(b.status));
  const completedToday = bookings.filter(b => b.status === "completed");
  const totalRevenue = completedToday.reduce((s, b) => s + b.price, 0);
  const onlineWorkers = workers.filter(w => w.isOnline);
  const pendingVerification = workers.filter(w => !w.isVerified);

  return res.json({
    revenue: totalRevenue,
    activeBookings: activeBookings.length,
    totalUsers: users.length,
    totalWorkers: workers.length,
    onlineWorkers: onlineWorkers.length,
    pendingVerification: pendingVerification.length,
    openComplaints: 23,
    completedToday: completedToday.length
  });
});

// GET /api/admin/users
router.get("/users", (req, res) => {
  return res.json({
    users: users.map(u => safeUser(u)),
    total: users.length
  });
});

// GET /api/admin/workers
router.get("/workers", (req, res) => {
  return res.json({
    workers: workers.map(w => {
      const { password, ...safe } = w;
      return safe;
    }),
    total: workers.length,
    online: workers.filter(w => w.isOnline).length,
    pending: workers.filter(w => !w.isVerified).length
  });
});

// GET /api/admin/bookings
router.get("/bookings", (req, res) => {
  const enriched = bookings.map(b => {
    const customer = users.find(u => u.id === b.customerId);
    const worker = workers.find(w => w.id === b.workerId);
    return {
      ...b,
      customerName: customer?.name || "Unknown",
      workerName: worker?.name || "Unassigned"
    };
  }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  return res.json({ bookings: enriched, total: enriched.length });
});

// PATCH /api/admin/workers/:id/verify
router.patch("/workers/:id/verify", (req, res) => {
  const worker = workers.find(w => w.id === req.params.id);
  if (!worker) return res.status(404).json({ error: "Worker not found" });
  worker.isVerified = true;
  return res.json({ message: "Worker verified", workerId: worker.id });
});

// PATCH /api/admin/workers/:id/suspend
router.patch("/workers/:id/suspend", (req, res) => {
  const worker = workers.find(w => w.id === req.params.id);
  if (!worker) return res.status(404).json({ error: "Worker not found" });
  worker.isOnline = false;
  worker.isVerified = false;
  return res.json({ message: "Worker suspended" });
});

// PATCH /api/admin/users/:id/suspend
router.patch("/users/:id/suspend", (req, res) => {
  const user = users.find(u => u.id === req.params.id);
  if (!user) return res.status(404).json({ error: "User not found" });
  user.suspended = true;
  return res.json({ message: "User suspended" });
});

// GET /api/admin/analytics
router.get("/analytics", (req, res) => {
  const completedBookings = bookings.filter(b => b.status === "completed");
  const totalRevenue = completedBookings.reduce((s, b) => s + b.price, 0);
  const avgBookingValue = completedBookings.length ? Math.round(totalRevenue / completedBookings.length) : 0;
  const completionRate = bookings.length ? Math.round((completedBookings.length / bookings.length) * 100) : 0;

  return res.json({
    monthlyRevenue: totalRevenue,
    totalBookings: bookings.length,
    completionRate,
    avgBookingValue,
    newUsersMonth: 4890,
    avgResponseTime: "8 min",
    repeatRate: 68,
    cancellationRate: 4.2,
    emergencySuccess: 96,
    revenueChart: [15, 18, 23, 28, 31, 33, 30, 36, 35, 38, 40, 42],
    cityData: [
      { city: "Hyderabad", revenue: 1250000, bookings: 5420 },
      { city: "Bangalore", revenue: 1020000, bookings: 4890 },
      { city: "Mumbai", revenue: 890000, bookings: 3560 },
      { city: "Delhi", revenue: 640000, bookings: 2890 },
      { city: "Chennai", revenue: 480000, bookings: 1690 }
    ]
  });
});

module.exports = router;
