/* POST /fast-booking/analyze (public) + customer /confirm + /status/:id */
const express = require("express");
const {
  bookings,
  fastRequests,
  fastInvites,
  workers,
  findUserById
} = require("../data/store");
const { requireRole } = require("../middleware/auth");
const {
  analyzeFastBooking,
  rankWorkersForFast,
  newFastId,
  newInviteId
} = require("../services/fastBookingService");

function analyze(req, res) {
  const { problem } = req.body || {};
  if (!problem || String(problem).trim().length < 4) {
    return res.status(400).json({ error: "Describe your issue (at least a few words)" });
  }
  const analysis = analyzeFastBooking(problem);
  return res.json({ analysis, problem: String(problem).slice(0, 500) });
}

const customerRouter = express.Router();
customerRouter.use(requireRole("customer"));

customerRouter.post("/confirm", (req, res) => {
  const { problem, address } = req.body || {};
  if (!problem || String(problem).trim().length < 4) {
    return res.status(400).json({ error: "problem is required" });
  }
  const customer = findUserById(req.userId);
  if (!customer) return res.status(404).json({ error: "User not found" });

  const analysis = analyzeFastBooking(problem);
  const price = Math.round((analysis.priceLowINR + analysis.priceHighINR) / 2);
  const fastId = newFastId();

  const booking = {
    id: `FX-${28476 + bookings.length}`,
    customerId: req.userId,
    workerId: null,
    service: `${analysis.serviceLabel} (AI Express)`,
    category: analysis.category,
    price,
    paymentStatus: "pending",
    status: "scheduled",
    type: "scheduled",
    bookingMode: "fast",
    fastRequestId: fastId,
    address: address || customer.address || "Address on profile",
    description: String(problem).slice(0, 500),
    otp: null,
    rating: null,
    createdAt: new Date().toISOString(),
    scheduledAt: new Date(Date.now() + analysis.etaMinutes * 60_000).toISOString(),
    slotStart: null,
    slotEnd: null,
    slotLabel: null,
    serviceDurationMins: analysis.workersNeeded * 45,
    etaMinutes: analysis.etaMinutes,
    guaranteeMinutes: analysis.guaranteeMinutes,
    analysisSnapshot: analysis,
    pricingBreakdown: {
      baseINR: price,
      surgeINR: 0,
      labels: ["AI Express dispatch fee included"]
    }
  };

  const fast = {
    id: fastId,
    customerId: req.userId,
    bookingId: booking.id,
    status: "dispatching",
    analysis,
    createdAt: new Date().toISOString(),
    inviteExpiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString()
  };

  const ranked = rankWorkersForFast(customer, workers, analysis.category);
  const acceptDeadline = Date.now() + 15_000;

  for (const w of ranked) {
    fastInvites.push({
      id: newInviteId(),
      fastRequestId: fastId,
      workerId: w.id,
      bookingId: booking.id,
      status: "pending",
      createdAt: new Date().toISOString(),
      expiresAt: new Date(acceptDeadline).toISOString()
    });
  }

  fastRequests.push(fast);
  bookings.push(booking);

  return res.status(201).json({
    fastRequest: fast,
    booking,
    dispatchedTo: ranked.length,
    message: "Request sent to nearby pros — first acceptance wins."
  });
});

customerRouter.get("/status/:id", (req, res) => {
  const fr = fastRequests.find(f => f.id === req.params.id);
  if (!fr) return res.status(404).json({ error: "Fast request not found" });
  if (fr.customerId !== req.userId) return res.status(403).json({ error: "Not authorized" });
  const booking = bookings.find(b => b.id === fr.bookingId);
  const invites = fastInvites.filter(i => i.fastRequestId === fr.id);
  return res.json({
    fastRequest: fr,
    booking: booking || null,
    invitesSummary: {
      pending: invites.filter(i => i.status === "pending").length,
      accepted: invites.find(i => i.status === "accepted") || null
    }
  });
});

module.exports = { analyze, customerRouter };
