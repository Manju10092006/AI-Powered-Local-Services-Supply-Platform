/* Booking Routes — standard + slot + backward compatible */
const express = require("express");
const { bookings, workers, findUserById, consumeCustomerPlanDraft } = require("../data/store");
const { requireRole } = require("../middleware/auth");
const { applyBookingRefund } = require("../services/bookingRefund");
const { validateSlotAgainstEngine, pickWorkerForSlot } = require("../services/slotEngine");

const router = express.Router();

// GET /api/bookings — list bookings for current user
router.get("/", (req, res) => {
  let result;
  if (req.userRole === "customer") {
    result = bookings.filter(b => b.customerId === req.userId);
  } else if (req.userRole === "worker") {
    result = bookings.filter(b => b.workerId === req.userId);
  } else {
    result = bookings;
  }

  result = result
    .map(b => {
      const worker = workers.find(w => w.id === b.workerId);
      return {
        ...b,
        workerName: worker?.name || "Pending",
        workerRating: worker?.rating || null
      };
    })
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  return res.json({ bookings: result, total: result.length });
});

// POST /api/bookings — create (standard | slot | cart plan draft from /api/ai/confirm-plan)
router.post("/", requireRole("customer"), (req, res) => {
  const body = req.body || {};
  const {
    service,
    category,
    price,
    address,
    type = "scheduled",
    scheduledAt,
    description,
    bookingMode = "standard",
    slotId,
    slotStart,
    slotEnd,
    slotLabel: clientSlotLabel,
    city,
    date,
    useStoredPlan,
    planType
  } = body;

  let planDraft = null;
  if (useStoredPlan && planType) {
    planDraft = consumeCustomerPlanDraft(req.userId);
    if (!planDraft || planDraft.planType !== planType) {
      return res.status(400).json({ error: "No confirmed plan — return to cart and confirm your plan again." });
    }
  }

  if (!service || !category) {
    return res.status(400).json({ error: "Service and category are required" });
  }

  const customer = findUserById(req.userId);
  const basePrice = planDraft ? planDraft.baseCartINR : Number(price) || 499;

  const resolvedMode = planDraft ? planDraft.bookingMode : bookingMode === "slot" ? "slot" : "standard";

  const booking = {
    id: `FX-${28476 + bookings.length}`,
    customerId: req.userId,
    workerId: null,
    service,
    category,
    price: basePrice,
    paymentStatus: "pending",
    status: type === "emergency" ? "assigned" : "scheduled",
    type: type || "scheduled",
    bookingMode: resolvedMode,
    planType: planDraft ? planDraft.planType : undefined,
    address: address || customer?.address || "Address not provided",
    description: description || "",
    otp: null,
    rating: null,
    createdAt: new Date().toISOString(),
    scheduledAt: scheduledAt || new Date().toISOString(),
    slotStart: null,
    slotEnd: null,
    slotLabel: null,
    serviceDurationMins: null,
    pricingBreakdown: null,
    cityZone: null,
    fastRequestId: null,
    etaMinutes: null,
    guaranteeMinutes: null,
    analysisSnapshot: null
  };

  const slotDateArg = planDraft?.date || date;
  const slotIdArg = planDraft?.slotId || slotId;
  const slotCityArg = planDraft?.city || city;
  const slotCategoryArg = planDraft?.category || category;

  if (resolvedMode === "slot") {
    if (!slotDateArg) {
      return res.status(400).json({ error: "Slot booking requires date (YYYY-MM-DD)" });
    }
    const v = validateSlotAgainstEngine(
      {
        date: slotDateArg,
        city: slotCityArg || customer?.city,
        category: slotCategoryArg,
        slotId: slotIdArg,
        slotStart,
        slotEnd
      },
      bookings,
      workers,
      customer
    );
    if (!v.ok) return res.status(400).json({ error: v.error });

    const slot = v.slot;
    const startMs = new Date(slot.startISO).getTime();
    const endMs = new Date(slot.endISO).getTime();
    const surge = slot.totalSurchargeINR || 0;
    booking.price = Math.round(basePrice + surge);
    booking.scheduledAt = slot.startISO;
    booking.slotStart = slot.startISO;
    booking.slotEnd = slot.endISO;
    booking.slotLabel = clientSlotLabel || slot.label;
    booking.serviceDurationMins = v.gen.durationMins;
    booking.cityZone = slotCityArg || customer?.city;
    booking.pricingBreakdown = {
      baseINR: basePrice,
      surgeINR: surge,
      labels: slot.fees.labels || []
    };

    const picked = pickWorkerForSlot(startMs, endMs, booking.cityZone, slotCategoryArg, bookings, workers);
    if (picked) {
      booking.workerId = picked.id;
      booking.status = "confirmed";
      booking.otp = String(Math.floor(1000 + Math.random() * 9000));
    }
  } else if (type === "emergency") {
    const available = workers.filter(w => w.isOnline && w.isVerified);
    if (available.length) {
      booking.workerId = available[0].id;
      booking.otp = String(Math.floor(1000 + Math.random() * 9000));
    }
  }

  if (planDraft) {
    booking.price = Math.round(planDraft.finalPrice);
    booking.planType = planDraft.planType;
    booking.pricingBreakdown = planDraft.pricingBreakdown;
    booking.analysisSnapshot = planDraft.engine;
    if (planDraft.problem) {
      booking.description = [booking.description || "Cart checkout", planDraft.problem].join("\n\n").slice(0, 900);
    }
  }

  bookings.push(booking);

  const worker = workers.find(w => w.id === booking.workerId);
  return res.status(201).json({
    booking,
    workerName: worker?.name || "Finding worker...",
    message:
      resolvedMode === "slot"
        ? "Slot booking created — pay to confirm."
        : type === "emergency"
          ? "Emergency booking created! Worker dispatched."
          : planDraft
            ? "Booking created with your selected plan — complete payment."
            : "Booking created successfully!"
  });
});

// PATCH /api/bookings/:id/reschedule — slot / time (must be before GET /:id)
router.patch("/:id/reschedule", requireRole("customer"), (req, res) => {
  const booking = bookings.find(b => b.id === req.params.id);
  if (!booking) return res.status(404).json({ error: "Booking not found" });
  if (booking.customerId !== req.userId) {
    return res.status(403).json({ error: "Not authorized" });
  }
  if (["completed", "cancelled"].includes(booking.status)) {
    return res.status(400).json({ error: "Cannot reschedule this booking" });
  }

  const { date, slotId, slotStart, slotEnd, city, category, price } = req.body || {};
  const customer = findUserById(req.userId);
  const cat = category || booking.category;
  const basePrice = Number(price) || booking.pricingBreakdown?.baseINR || booking.price;

  if (date && (slotId || (slotStart && slotEnd))) {
    const v = validateSlotAgainstEngine(
      { date, city: city || customer?.city || booking.cityZone, category: cat, slotId, slotStart, slotEnd },
      bookings.filter(b => b.id !== booking.id),
      workers,
      customer
    );
    if (!v.ok) return res.status(400).json({ error: v.error });
    const slot = v.slot;
    const surge = slot.totalSurchargeINR || 0;
    booking.price = Math.round(basePrice + surge);
    booking.scheduledAt = slot.startISO;
    booking.slotStart = slot.startISO;
    booking.slotEnd = slot.endISO;
    booking.slotLabel = slot.label;
    booking.serviceDurationMins = v.gen.durationMins;
    booking.pricingBreakdown = {
      baseINR: basePrice,
      surgeINR: surge,
      labels: slot.fees.labels || []
    };
    booking.bookingMode = "slot";
  } else if (req.body?.scheduledAt) {
    booking.scheduledAt = req.body.scheduledAt;
  } else {
    return res.status(400).json({ error: "Provide scheduledAt or slot selection (date + slotId)" });
  }

  return res.json({ message: "Booking rescheduled", booking });
});

// GET /api/bookings/:id
router.get("/:id", (req, res) => {
  const booking = bookings.find(b => b.id === req.params.id);
  if (!booking) return res.status(404).json({ error: "Booking not found" });
  const canRead =
    req.userRole === "admin" ||
    booking.customerId === req.userId ||
    booking.workerId === req.userId;
  if (!canRead) return res.status(403).json({ error: "Not authorized" });

  const worker = workers.find(w => w.id === booking.workerId);
  return res.json({
    ...booking,
    worker: worker
      ? { name: worker.name, phone: worker.phone, rating: worker.rating, avatar: worker.avatar, skill: worker.skill }
      : null
  });
});

// PATCH /api/bookings/:id/cancel
router.patch("/:id/cancel", async (req, res) => {
  const booking = bookings.find(b => b.id === req.params.id);
  if (!booking) return res.status(404).json({ error: "Booking not found" });
  if (booking.customerId !== req.userId && req.userRole !== "admin") {
    return res.status(403).json({ error: "Not authorized" });
  }
  if (["completed", "in-progress"].includes(booking.status)) {
    return res.status(400).json({ error: "Cannot cancel once service has started or completed" });
  }
  if (booking.status === "cancelled") {
    return res.status(400).json({ error: "Booking already cancelled" });
  }
  booking.status = "cancelled";

  let refund = null;
  if (booking.paymentStatus === "paid") {
    refund = await applyBookingRefund(booking.id, booking.price, {
      destination: req.body?.refundDestination === "original" ? "original" : "wallet"
    });
  }

  return res.json({ message: "Booking cancelled", booking, refund });
});

// POST /api/bookings/:id/rate
router.post("/:id/rate", requireRole("customer"), (req, res) => {
  const { rating, comment } = req.body || {};
  const booking = bookings.find(b => b.id === req.params.id);
  if (!booking) return res.status(404).json({ error: "Booking not found" });
  if (booking.customerId !== req.userId) {
    return res.status(403).json({ error: "Not authorized to rate this booking" });
  }

  booking.rating = rating || 5;
  booking.comment = comment || "";

  if (booking.workerId) {
    const worker = workers.find(w => w.id === booking.workerId);
    if (worker) {
      worker.rating =
        Math.round(((worker.rating * worker.totalJobs + booking.rating) / (worker.totalJobs + 1)) * 10) / 10;
    }
  }
  return res.json({ message: "Rating submitted", booking });
});

module.exports = router;
