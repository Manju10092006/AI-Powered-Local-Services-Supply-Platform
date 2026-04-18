/* Booking cancellation refunds — wallet default, optional Razorpay refund when configured */
const crypto = require("crypto");
const { getRazorpay, isConfigured } = require("./razorpayService");
const {
  users,
  bookings,
  recordPayment,
  addWalletTransaction,
  ensureCustomerWallet,
  findBookingPayment
} = require("../data/store");

async function gatewayRefundIfPossible(gatewayPaymentId, amountPaise, notes) {
  const rz = getRazorpay();
  if (!rz || !gatewayPaymentId || !amountPaise) return { gatewayOk: false, razorpayRefundId: null };
  try {
    const refund = await rz.payments.refund(gatewayPaymentId, {
      amount: amountPaise,
      notes: notes || {}
    });
    return { gatewayOk: true, razorpayRefundId: refund?.id || null };
  } catch (e) {
    console.warn("[REFUND_GATEWAY]", e.message);
    return { gatewayOk: false, razorpayRefundId: null };
  }
}

/**
 * Refund booking — destination "wallet" (default) credits customer wallet.
 * destination "original" tries Razorpay refund when gateway payment exists, else credits wallet.
 */
async function applyBookingRefund(bookingId, refundAmountInr, options = {}) {
  const booking = bookings.find(b => b.id === bookingId);
  if (!booking) return { ok: false, error: "Booking not found" };

  const destination = options.destination === "original" ? "original" : "wallet";
  const customer = users.find(u => u.id === booking.customerId);
  if (!customer || customer.role !== "customer") return { ok: false, error: "Customer not found" };
  ensureCustomerWallet(customer);

  const amt = Math.min(refundAmountInr, booking.price || refundAmountInr);
  if (amt <= 0) return { ok: false, error: "Nothing to refund" };

  const prior = findBookingPayment(bookingId);
  const gatewayPaymentId = prior?.gatewayPaymentId || booking.gatewayPaymentId || null;
  let creditedWallet = 0;
  let razorpayRefundId = null;

  const creditWallet = () => {
    customer.walletBalance += amt;
    creditedWallet = amt;
    addWalletTransaction({
      userId: customer.id,
      amount: amt,
      type: "REFUND_BOOKING",
      referenceId: bookingId,
      meta: { bookingId, destination }
    });
  };

  if (destination === "original" && gatewayPaymentId && isConfigured()) {
    const paise = Math.round(amt * 100);
    const gr = await gatewayRefundIfPossible(gatewayPaymentId, paise, { bookingId });
    razorpayRefundId = gr.razorpayRefundId;
    if (!gr.gatewayOk) {
      customer.walletBalance += amt;
      creditedWallet = amt;
      addWalletTransaction({
        userId: customer.id,
        amount: amt,
        type: "REFUND_FALLBACK",
        referenceId: bookingId,
        meta: { reason: "gateway_refund_failed", bookingId }
      });
    }
  } else if (destination === "original" && !gatewayPaymentId) {
    creditWallet();
  } else {
    creditWallet();
  }

  booking.paymentStatus = "refunded";
  recordPayment({
    id: `pay_${crypto.randomBytes(6).toString("hex")}`,
    userId: customer.id,
    bookingId,
    type: "REFUND",
    amount: amt,
    status: "completed",
    gateway: destination === "original" && razorpayRefundId ? "razorpay" : "wallet",
    gatewayOrderId: prior?.gatewayOrderId || null,
    gatewayPaymentId,
    razorpayRefundId,
    refundStatus: "full",
    metadata: { destination, bookingId },
    createdAt: new Date().toISOString()
  });

  return {
    ok: true,
    amount: amt,
    destination: razorpayRefundId ? "original" : "wallet",
    creditedWallet,
    razorpayRefundId
  };
}

module.exports = { applyBookingRefund };
