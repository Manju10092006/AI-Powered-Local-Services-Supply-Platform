/* Payment & Razorpay — server-side only */
const express = require("express");
const crypto = require("crypto");
const {
  users,
  bookings,
  payments,
  walletTransactions,
  pendingRazorpayOrders,
  SUBSCRIPTION_PLANS,
  couponDiscountINR,
  ensureCustomerWallet,
  addWalletTransaction,
  recordPayment,
  isDuplicateGatewayPayment,
  markGatewayPaymentProcessed
} = require("../data/store");

const { getRazorpay, isConfigured, getKeyId, getKeySecret } = require("../services/razorpayService");
const { applyBookingRefund } = require("../services/bookingRefund");
const { requireRole } = require("../middleware/auth");

const router = express.Router();

function bumpMembership(user, planCode) {
  const plan = SUBSCRIPTION_PLANS[planCode];
  if (!plan || !user) return;
  const tier = plan.tier;
  const months = plan.months;
  const base =
    user.membershipExpiresAt && new Date(user.membershipExpiresAt) > new Date()
      ? new Date(user.membershipExpiresAt)
      : new Date();
  base.setMonth(base.getMonth() + months);
  user.membershipExpiresAt = base.toISOString();
  user.membership = tier === "premium" ? "premium" : "plus";
}

function settleBreakdown(bookingPrice, user, walletAmount = 0, rewardPointsToUse = 0, couponCode = "") {
  ensureCustomerWallet(user);
  let owed = bookingPrice;
  const { discount, label } = couponDiscountINR(couponCode, owed);
  owed -= discount;
  const rp = Math.min(
    rewardPointsToUse || 0,
    user.rewardPoints || 0,
    Math.max(owed, 0)
  );
  owed -= rp;
  const wb = Math.min(walletAmount || 0, user.walletBalance || 0, Math.max(owed, 0));
  owed -= wb;
  const rz = Math.max(0, Math.round(owed * 100) / 100);
  return {
    couponDiscount: discount,
    couponLabel: label,
    rewardApplied: rp,
    walletApplied: wb,
    razorpayINR: rz,
    totalPayable: bookingPrice
  };
}

function verifyRazorpaySignature(orderId, paymentId, signature) {
  const secret = getKeySecret();
  if (!secret) return false;
  const body = `${orderId}|${paymentId}`;
  const expected = crypto.createHmac("sha256", secret).update(body).digest("hex");
  return expected === signature;
}

function newPaymentId() {
  return `pay_${crypto.randomBytes(8).toString("hex")}`;
}

// GET /api/payments/key
router.get("/key", requireRole("customer"), (req, res) => {
  if (!isConfigured()) {
    return res.status(503).json({
      error: "Razorpay is not configured (set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET)."
    });
  }
  return res.json({ keyId: getKeyId() });
});

async function createOrder(req, res) {
  if (!isConfigured()) {
    return res.status(503).json({ error: "Razorpay is not configured." });
  }
  const {
    type,
    amountRupees,
    bookingId,
    planCode,
    walletAmount,
    rewardPointsToUse,
    couponCode,
    advancePercent
  } = req.body || {};

  const user = users.find(u => u.id === req.userId);
  if (!user) return res.status(404).json({ error: "User not found" });
  ensureCustomerWallet(user);

  let purpose = String(type || "").toUpperCase();
  if (!purpose) return res.status(400).json({ error: "type is required (BOOKING | WALLET | SUBSCRIPTION)" });

  const rz = getRazorpay();
  let amountPaise;
  const meta = {
    userId: req.userId,
    type: purpose,
    walletAmount: Number(walletAmount) || 0,
    rewardPointsToUse: Number(rewardPointsToUse) || 0,
    couponCode: couponCode || ""
  };

  try {
    if (purpose === "WALLET") {
      const ar = Number(amountRupees);
      if (!ar || ar < 1) return res.status(400).json({ error: "amountRupees must be at least ₹1" });
      amountPaise = Math.round(ar * 100);
      meta.walletTopUpInr = ar;
    } else if (purpose === "SUBSCRIPTION") {
      const plan = SUBSCRIPTION_PLANS[planCode];
      if (!plan) {
        return res.status(400).json({ error: "Invalid planCode", valid: Object.keys(SUBSCRIPTION_PLANS) });
      }
      amountPaise = Math.round(plan.amountRupees * 100);
      meta.planCode = planCode;
    } else if (purpose === "BOOKING") {
      const booking = bookings.find(b => b.id === bookingId);
      if (!booking || booking.customerId !== req.userId) {
        return res.status(404).json({ error: "Booking not found" });
      }
      let priceBasis = booking.price;
      if (advancePercent && advancePercent > 0 && advancePercent < 100) {
        priceBasis = Math.round((booking.price * advancePercent) / 100);
      }
      const br = settleBreakdown(
        priceBasis,
        user,
        meta.walletAmount,
        meta.rewardPointsToUse,
        meta.couponCode
      );
      if (br.razorpayINR <= 0) {
        return res.status(400).json({
          error: "Nothing to charge via Razorpay — use POST /api/payments/booking/settle instead.",
          breakdown: br
        });
      }
      if (amountRupees != null && Math.abs(Number(amountRupees) - br.razorpayINR) > 0.02) {
        return res.status(400).json({ error: "amountRupees does not match server breakdown", breakdown: br });
      }
      amountPaise = Math.round(br.razorpayINR * 100);
      meta.bookingId = bookingId;
      meta.breakdown = br;
      meta.advancePercent = advancePercent || null;
      meta.bookingPriceBasis = priceBasis;
    } else {
      return res.status(400).json({ error: "Unsupported type" });
    }

    const order = await rz.orders.create({
      amount: amountPaise,
      currency: "INR",
      receipt: `${purpose.slice(0, 6)}_${crypto.randomBytes(4).toString("hex")}`,
      notes: {
        userId: req.userId,
        purpose,
        bookingId: meta.bookingId || "",
        planCode: meta.planCode || ""
      }
    });

    pendingRazorpayOrders[order.id] = {
      ...meta,
      expectedAmountPaise: amountPaise,
      createdAt: Date.now()
    };

    return res.json({
      success: true,
      keyId: getKeyId(),
      orderId: order.id,
      amountPaise,
      currency: "INR",
      breakdown: meta.breakdown || null
    });
  } catch (e) {
    console.error("[create-order]", e);
    return res.status(500).json({ error: e.message || "Could not create order" });
  }
}

router.post("/create-order", requireRole("customer"), createOrder);

router.post("/wallet/topup", requireRole("customer"), (req, res) => {
  req.body = { ...req.body, type: "WALLET" };
  return createOrder(req, res);
});

router.post("/subscription", requireRole("customer"), (req, res) => {
  req.body = { ...req.body, type: "SUBSCRIPTION" };
  return createOrder(req, res);
});

// POST /api/payments/booking/settle — wallet / rewards / coupon only
router.post("/booking/settle", requireRole("customer"), (req, res) => {
  const { bookingId, walletAmount, rewardPointsToUse, couponCode } = req.body || {};
  const booking = bookings.find(b => b.id === bookingId);
  if (!booking || booking.customerId !== req.userId) {
    return res.status(404).json({ error: "Booking not found" });
  }
  const user = users.find(u => u.id === req.userId);
  ensureCustomerWallet(user);

  const br = settleBreakdown(booking.price, user, walletAmount, rewardPointsToUse, couponCode);
  if (br.razorpayINR > 0.02) {
    return res.status(400).json({
      error: "Outstanding Razorpay amount — pay via Checkout or reduce wallet/rewards.",
      breakdown: br
    });
  }

  user.rewardPoints -= br.rewardApplied;
  user.walletBalance -= br.walletApplied;

  booking.paymentStatus = "paid";

  addWalletTransaction({
    userId: user.id,
    amount: -br.walletApplied,
    type: "BOOKING_PAYMENT",
    referenceId: bookingId,
    meta: { coupon: br.couponLabel, rewards: br.rewardApplied }
  });

  recordPayment({
    id: newPaymentId(),
    userId: user.id,
    bookingId,
    type: "BOOKING",
    amount: booking.price,
    status: "completed",
    gateway: br.walletApplied > 0 || br.rewardApplied > 0 ? "mixed" : "wallet",
    gatewayOrderId: null,
    gatewayPaymentId: null,
    refundStatus: "none",
    metadata: {
      breakdown: br,
      method: "wallet_rewards_coupon"
    },
    createdAt: new Date().toISOString()
  });

  return res.json({
    success: true,
    booking,
    breakdown: br,
    walletBalance: user.walletBalance,
    rewardPoints: user.rewardPoints
  });
});

/**
 * Demo checkout — marks booking paid without Razorpay (local / hackathon).
 * Does not move wallet balance; records a completed payment with gateway "dummy".
 */
router.post("/booking/dummy-complete", requireRole("customer"), (req, res) => {
  if (process.env.ALLOW_DEMO_PAYMENTS !== "true") {
    return res.status(403).json({ error: "Demo payment completion disabled" });
  }
  const { bookingId } = req.body || {};
  if (!bookingId) return res.status(400).json({ error: "bookingId is required" });
  const booking = bookings.find(b => b.id === bookingId);
  if (!booking || booking.customerId !== req.userId) {
    return res.status(404).json({ error: "Booking not found" });
  }
  if (booking.paymentStatus === "paid") {
    return res.json({
      success: true,
      duplicate: true,
      booking,
      message: "Booking is already marked paid."
    });
  }
  const user = users.find(u => u.id === req.userId);
  if (!user) return res.status(404).json({ error: "User not found" });

  booking.paymentStatus = "paid";

  recordPayment({
    id: newPaymentId(),
    userId: user.id,
    bookingId: booking.id,
    type: "BOOKING",
    amount: booking.price,
    status: "completed",
    gateway: "dummy",
    gatewayOrderId: null,
    gatewayPaymentId: `dummy_${crypto.randomBytes(6).toString("hex")}`,
    refundStatus: "none",
    metadata: { method: "demo_no_gateway" },
    createdAt: new Date().toISOString()
  });

  return res.json({
    success: true,
    booking,
    message: "Booking confirmed (demo — no real payment)."
  });
});

// POST /api/payments/verify
router.post("/verify", requireRole("customer"), async (req, res) => {
  const {
    razorpay_payment_id,
    razorpay_order_id,
    razorpay_signature,
    typeHint
  } = req.body || {};

  if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
    return res.status(400).json({
      error: "razorpay_payment_id, razorpay_order_id and razorpay_signature are required"
    });
  }

  if (isDuplicateGatewayPayment(razorpay_payment_id)) {
    const existing = payments.find(p => p.gatewayPaymentId === razorpay_payment_id);
    return res.json({ success: true, duplicate: true, payment: existing });
  }

  if (!verifyRazorpaySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature)) {
    return res.status(400).json({ success: false, error: "Invalid payment signature" });
  }

  const pending = pendingRazorpayOrders[razorpay_order_id];
  if (!pending || pending.userId !== req.userId) {
    return res.status(400).json({ error: "Unknown or expired order — cannot verify" });
  }

  delete pendingRazorpayOrders[razorpay_order_id];
  const purpose = pending.type || String(typeHint || "").toUpperCase();

  const user = users.find(u => u.id === req.userId);
  ensureCustomerWallet(user);

  try {
    if (purpose === "WALLET") {
      const topUp = pending.walletTopUpInr || 0;
      user.walletBalance += topUp;
      addWalletTransaction({
        userId: user.id,
        amount: topUp,
        type: "ADD_MONEY",
        referenceId: razorpay_order_id,
        meta: { gateway: "razorpay" }
      });
      const row = recordPayment({
        id: newPaymentId(),
        userId: user.id,
        bookingId: null,
        type: "WALLET",
        amount: topUp,
        status: "completed",
        gateway: "razorpay",
        gatewayOrderId: razorpay_order_id,
        gatewayPaymentId: razorpay_payment_id,
        refundStatus: "none",
        metadata: { purpose: "wallet_topup" },
        createdAt: new Date().toISOString()
      });
      markGatewayPaymentProcessed(razorpay_payment_id);
      return res.json({
        success: true,
        payment: row,
        walletBalance: user.walletBalance
      });
    }

    if (purpose === "SUBSCRIPTION") {
      const plan = SUBSCRIPTION_PLANS[pending.planCode];
      if (!plan) return res.status(400).json({ error: "Invalid subscription metadata" });
      bumpMembership(user, pending.planCode);
      const row = recordPayment({
        id: newPaymentId(),
        userId: user.id,
        bookingId: null,
        type: "SUBSCRIPTION",
        amount: plan.amountRupees,
        status: "completed",
        gateway: "razorpay",
        gatewayOrderId: razorpay_order_id,
        gatewayPaymentId: razorpay_payment_id,
        refundStatus: "none",
        metadata: { planCode: pending.planCode },
        createdAt: new Date().toISOString()
      });
      markGatewayPaymentProcessed(razorpay_payment_id);
      return res.json({
        success: true,
        payment: row,
        membership: user.membership,
        membershipExpiresAt: user.membershipExpiresAt
      });
    }

    if (purpose === "BOOKING") {
      const booking = bookings.find(b => b.id === pending.bookingId);
      if (!booking || booking.customerId !== req.userId) {
        return res.status(400).json({ error: "Booking mismatch" });
      }
      const br =
        pending.breakdown ||
        settleBreakdown(
          pending.bookingPriceBasis != null ? pending.bookingPriceBasis : booking.price,
          user,
          pending.walletAmount,
          pending.rewardPointsToUse,
          pending.couponCode
        );

      user.rewardPoints -= br.rewardApplied;
      user.walletBalance -= br.walletApplied;

      addWalletTransaction({
        userId: user.id,
        amount: -br.walletApplied,
        type: "BOOKING_PAYMENT",
        referenceId: booking.id,
        meta: { razorpayInr: br.razorpayINR, coupon: br.couponLabel }
      });

      booking.paymentStatus = "paid";
      booking.gatewayPaymentId = razorpay_payment_id;

      recordPayment({
        id: newPaymentId(),
        userId: user.id,
        bookingId: booking.id,
        type: "BOOKING",
        amount: booking.price,
        status: "completed",
        gateway: br.walletApplied > 0 || br.rewardApplied > 0 ? "mixed" : "razorpay",
        gatewayOrderId: razorpay_order_id,
        gatewayPaymentId: razorpay_payment_id,
        refundStatus: "none",
        metadata: {
          breakdown: br,
          advancePercent: pending.advancePercent
        },
        createdAt: new Date().toISOString()
      });
      markGatewayPaymentProcessed(razorpay_payment_id);
      return res.json({
        success: true,
        booking,
        breakdown: br,
        walletBalance: user.walletBalance,
        rewardPoints: user.rewardPoints
      });
    }

    return res.status(400).json({ error: "Unsupported payment purpose" });
  } catch (e) {
    console.error("[verify]", e);
    return res.status(500).json({ error: e.message || "Verification failed" });
  }
});

// GET /api/payments/history
router.get("/history", requireRole("customer"), (req, res) => {
  const { type, status, gateway } = req.query || {};
  let list = payments.filter(p => p.userId === req.userId);
  if (type) list = list.filter(p => p.type === String(type).toUpperCase());
  if (status) list = list.filter(p => p.status === status);
  if (gateway) list = list.filter(p => p.gateway === gateway);
  list = list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const wt = walletTransactions.filter(w => w.userId === req.userId);
  return res.json({
    payments: list,
    walletTransactions: wt.slice(-100).reverse()
  });
});

// POST /api/payments/refund — customer (own booking) or admin
router.post("/refund", (req, res, next) => {
  const { requireRole: rr } = require("../middleware/auth");
  if (req.userRole === "customer" || req.userRole === "admin") return next();
  return res.status(403).json({ error: "Forbidden" });
}, async (req, res) => {
  const { bookingId, destination = "wallet", amountRupees } = req.body || {};
  const booking = bookings.find(b => b.id === bookingId);
  if (!booking) return res.status(404).json({ error: "Booking not found" });
  if (req.userRole === "customer" && booking.customerId !== req.userId) {
    return res.status(403).json({ error: "Forbidden" });
  }
  if (booking.paymentStatus !== "paid") {
    return res.status(400).json({ error: "No completed payment to refund for this booking" });
  }
  const refundAmt = amountRupees != null ? Number(amountRupees) : booking.price;
  const result = await applyBookingRefund(bookingId, refundAmt, { destination });
  if (!result.ok) return res.status(400).json(result);
  return res.json({ success: true, ...result });
});

module.exports = router;
