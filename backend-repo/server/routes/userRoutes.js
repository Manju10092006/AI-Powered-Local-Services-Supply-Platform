/* User Routes — Customer Profile & Data */
const express = require("express");
const { findUserById, bookings } = require("../data/store");

const router = express.Router();

// GET /api/users/me
router.get("/me", (req, res) => {
  return res.json({ user: req.user });
});

// PUT /api/users/me — update profile
router.put("/me", (req, res) => {
  const { findUserById: find } = require("../data/store");
  const user = find(req.userId);
  if (!user) return res.status(404).json({ error: "User not found" });

  const { name, phone, city, address } = req.body || {};
  if (name) user.name = name;
  if (phone) user.phone = phone;
  if (city) user.city = city;
  if (address) user.address = address;

  const { password, ...safe } = user;
  return res.json({ user: safe, message: "Profile updated" });
});

// GET /api/users/bookings — customer's bookings
router.get("/bookings", (req, res) => {
  const { workers: allWorkers } = require("../data/store");
  const myBookings = bookings
    .filter(b => b.customerId === req.userId)
    .map(b => {
      const worker = allWorkers.find(w => w.id === b.workerId);
      return {
        ...b,
        workerName: worker ? worker.name : "Pending assignment",
        workerRating: worker ? worker.rating : null,
        workerAvatar: worker ? worker.avatar : null
      };
    })
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  return res.json({ bookings: myBookings, total: myBookings.length });
});

// GET /api/users/stats — customer dashboard stats
router.get("/stats", (req, res) => {
  const myBookings = bookings.filter(b => b.customerId === req.userId);
  const active = myBookings.filter(b => ["in-progress", "scheduled", "confirmed", "assigned"].includes(b.status));
  const completed = myBookings.filter(b => b.status === "completed");
  const totalSpent = completed.reduce((sum, b) => sum + b.price, 0);
  const savings = Math.round(totalSpent * 0.15); // Plus discount simulation

  return res.json({
    activeBookings: active.length,
    completed: completed.length,
    totalSpent,
    savings,
    activeList: active.map(b => {
      const { workers: allWorkers } = require("../data/store");
      const worker = allWorkers.find(w => w.id === b.workerId);
      return { ...b, workerName: worker?.name || "Pending", workerRating: worker?.rating };
    })
  });
});

module.exports = router;
