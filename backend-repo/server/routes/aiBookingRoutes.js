/* POST /api/ai/calculate-booking | /api/ai/confirm-plan — cart AI engine */
const express = require("express");
const { findUserById, bookings, workers, setCustomerPlanDraft } = require("../data/store");
const { requireRole } = require("../middleware/auth");
const { calculateBookingAI } = require("../services/bookingAIEngine");
const { validateSlotAgainstEngine } = require("../services/slotEngine");

const router = express.Router();
router.use(requireRole("customer"));

router.post("/calculate-booking", (req, res) => {
  const { service, category, problem, cartValue, llmHints } = req.body || {};
  const customer = findUserById(req.userId);
  const engine = calculateBookingAI({
    service: String(service || ""),
    category: String(category || "cleaning"),
    problem: String(problem || ""),
    cartValue: Number(cartValue) || 0,
    customer,
    now: new Date(),
    llmHints: llmHints && typeof llmHints === "object" ? llmHints : null
  });
  return res.json({ ok: true, engine });
});

router.post("/confirm-plan", (req, res) => {
  const body = req.body || {};
  const { planType, service, category, problem, cartValue, date, slotId, city, llmHints } = body;
  if (!["fast", "scheduled", "budget"].includes(planType)) {
    return res.status(400).json({ error: "planType must be fast, scheduled, or budget" });
  }
  const customer = findUserById(req.userId);
  const engine = calculateBookingAI({
    service: String(service || ""),
    category: String(category || "cleaning"),
    problem: String(problem || ""),
    cartValue: Number(cartValue) || 0,
    customer,
    now: new Date(),
    llmHints: llmHints && typeof llmHints === "object" ? llmHints : null
  });

  const priceKey = planType === "fast" ? "fast" : planType === "scheduled" ? "scheduled" : "budget";
  let finalPrice = engine.finalPrices[priceKey];
  const baseCartINR = Number(cartValue) || engine.baseFare;
  const cat = String(category || "cleaning");

  const draft = {
    planType,
    baseCartINR,
    engine,
    category: cat,
    service: String(service || "FixMate service"),
    problem: String(problem || "").slice(0, 500),
    bookingMode: planType === "scheduled" ? "slot" : "standard",
    pricingBreakdown: {
      baseINR: baseCartINR,
      plan: planType,
      priorityINR: planType === "fast" ? engine.priorityFee : 0,
      peakINR: planType === "fast" ? engine.peakFee : Math.round(engine.peakFee * 0.5),
      extraWorkerINR: engine.extraWorkerFee,
      discountINR: engine.discount,
      surgeINR: 0
    }
  };

  if (planType === "scheduled") {
    if (!date || !slotId) {
      return res.status(400).json({ error: "date and slotId are required for scheduled plan" });
    }
    const v = validateSlotAgainstEngine(
      { date, city: city || customer?.city, category: cat, slotId },
      bookings,
      workers,
      customer
    );
    if (!v.ok) return res.status(400).json({ error: v.error });
    const surge = v.slot.totalSurchargeINR || 0;
    draft.date = date;
    draft.slotId = slotId;
    draft.city = city || customer?.city;
    draft.slotMeta = v.slot;
    draft.pricingBreakdown.surgeINR = surge;
    finalPrice = Math.round(finalPrice + surge);
  }

  draft.finalPrice = finalPrice;
  setCustomerPlanDraft(req.userId, draft);

  return res.json({
    ok: true,
    planType,
    finalPrice,
    bookingMode: draft.bookingMode,
    message: "Plan saved — continue to payment."
  });
});

module.exports = router;
