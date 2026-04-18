/* ============================================
   In-Memory Data Store
   For hackathon demo — no external DB needed
   ============================================ */
const crypto = require("crypto");

// --- Users ---
const users = [
  {
    id: "u_001",
    name: "Manjunath",
    email: "manjunath@fixmate.com",
    phone: "+91 98765 43210",
    password: hashPw("pass1234"),
    role: "customer",
    city: "Hyderabad",
    address: "Flat 302, Sunshine Apartments, Madhapur, Hyderabad 500081",
    membership: "plus",
    walletBalance: 2450,
    rewardPoints: 320,
    membershipExpiresAt: "2026-12-31T23:59:59Z",
    createdAt: "2025-01-15T10:00:00Z",
    savedAddresses: [
      { label: "Home", address: "Flat 302, Sunshine Apartments, Madhapur, Hyderabad", isDefault: true },
      { label: "Office", address: "WeWork Galaxy, Residency Rd, Bangalore", isDefault: false }
    ]
  },
  {
    id: "u_002",
    name: "Priya Agarwal",
    email: "priya@fixmate.com",
    phone: "+91 87654 32109",
    password: hashPw("pass1234"),
    role: "customer",
    city: "Bangalore",
    address: "HSR Layout, Bangalore",
    membership: "plus",
    walletBalance: 120,
    rewardPoints: 80,
    membershipExpiresAt: "2026-08-01T23:59:59Z",
    createdAt: "2025-02-20T10:00:00Z",
    savedAddresses: []
  },
  {
    id: "u_003",
    name: "Suresh Kapoor",
    email: "suresh@fixmate.com",
    phone: "+91 76543 21098",
    password: hashPw("pass1234"),
    role: "customer",
    city: "Mumbai",
    address: "Bandra West, Mumbai",
    membership: "free",
    walletBalance: 0,
    rewardPoints: 40,
    membershipExpiresAt: null,
    createdAt: "2025-03-10T10:00:00Z",
    savedAddresses: []
  }
];

// --- Workers ---
const workers = [
  {
    id: "w_001",
    role: "worker",
    name: "Rajesh Kumar",
    email: "rajesh@fixmate.com",
    phone: "+91 87654 32109",
    password: hashPw("pass1234"),
    role: "worker",
    city: "Hyderabad",
    skill: "Cleaning",
    skills: ["Deep Cleaning", "Bathroom Cleaning", "Kitchen Cleaning", "Sofa Cleaning"],
    experience: "5+ years",
    rating: 4.8,
    totalJobs: 1247,
    totalEarnings: 324000,
    isOnline: true,
    isVerified: true,
    avatar: "img_4.jpeg",
    createdAt: "2024-04-10T10:00:00Z",
    serviceZones: ["Madhapur", "Gachibowli", "Kondapur", "Kukatpally", "HITEC City"],
    wallet: 24560,
    bank: { name: "State Bank of India", account: "XXXX4521", ifsc: "SBIN0012345", upi: "rajesh@upi" },
    onboardingApproved: true,
    approvalStatus: "approved"
  },
  {
    id: "w_002",
    role: "worker",
    name: "Sunil Electrician",
    email: "sunil@fixmate.com",
    phone: "+91 76543 21098",
    password: hashPw("pass1234"),
    role: "worker",
    city: "Hyderabad",
    skill: "Electrical",
    skills: ["Fan Installation", "Switchboard Repair", "Wiring", "Short Circuit"],
    experience: "8 years",
    rating: 4.7,
    totalJobs: 892,
    totalEarnings: 278000,
    isOnline: true,
    isVerified: true,
    avatar: "img_5.jpeg",
    createdAt: "2024-03-15T10:00:00Z",
    serviceZones: ["Madhapur", "Kondapur", "Ameerpet", "Begumpet"],
    wallet: 18340,
    bank: {},
    onboardingApproved: true,
    approvalStatus: "approved"
  },
  {
    id: "w_003",
    role: "worker",
    name: "Ravi Plumber",
    email: "ravi@fixmate.com",
    phone: "+91 65432 10987",
    password: hashPw("pass1234"),
    role: "worker",
    city: "Hyderabad",
    skill: "Plumbing",
    skills: ["Pipe Repair", "Tap Replacement", "Drain Cleaning", "Leak Fix"],
    experience: "6 years",
    rating: 4.6,
    totalJobs: 654,
    totalEarnings: 194000,
    isOnline: false,
    isVerified: true,
    avatar: "img_6.jpeg",
    createdAt: "2024-05-20T10:00:00Z",
    serviceZones: ["Kukatpally", "Miyapur", "Gachibowli"],
    wallet: 12450,
    bank: {},
    onboardingApproved: true,
    approvalStatus: "approved"
  },
  {
    id: "w_004",
    role: "worker",
    name: "CoolFix Technician",
    email: "coolfix@fixmate.com",
    phone: "+91 54321 09876",
    password: hashPw("pass1234"),
    role: "worker",
    city: "Bangalore",
    skill: "AC Repair",
    skills: ["AC Gas Refill", "AC Deep Cleaning", "AC Installation", "Compressor Repair"],
    experience: "7 years",
    rating: 4.9,
    totalJobs: 1034,
    totalEarnings: 412000,
    isOnline: true,
    isVerified: true,
    avatar: "img_7.jpeg",
    createdAt: "2024-02-10T10:00:00Z",
    serviceZones: ["Koramangala", "HSR Layout", "BTM Layout", "Indiranagar"],
    wallet: 32100,
    bank: {},
    onboardingApproved: true,
    approvalStatus: "approved"
  },
  {
    id: "w_005",
    role: "worker",
    name: "Meera Beauty",
    email: "meera@fixmate.com",
    phone: "+91 43210 98765",
    password: hashPw("pass1234"),
    role: "worker",
    city: "Pune",
    skill: "Salon",
    skills: ["Bridal Makeup", "Facial", "Hair Spa", "Waxing", "Manicure"],
    experience: "4 years",
    rating: 4.8,
    totalJobs: 456,
    totalEarnings: 210000,
    isOnline: true,
    isVerified: true,
    avatar: "img_8.jpeg",
    createdAt: "2024-06-10T10:00:00Z",
    serviceZones: [],
    wallet: 15670,
    bank: {},
    onboardingApproved: true,
    approvalStatus: "approved"
  }
];

// --- Admin ---
const admins = [
  {
    id: "a_001",
    name: "Admin",
    email: "admin@fixmate.com",
    password: hashPw("admin1234"),
    role: "admin",
    createdAt: "2024-01-01T10:00:00Z"
  }
];

// --- Bookings ---
const bookings = [
  {
    id: "FX-28475",
    customerId: "u_001",
    workerId: "w_001",
    service: "Full Home Deep Cleaning — 2BHK",
    category: "cleaning",
    price: 1999,
    status: "in-progress",
    type: "scheduled",
    address: "Flat 302, Sunshine Apts, Madhapur",
    otp: "4729",
    rating: null,
    paymentStatus: "paid",
    createdAt: "2026-04-17T08:30:00Z",
    scheduledAt: "2026-04-17T09:00:00Z"
  },
  {
    id: "FX-28474",
    customerId: "u_001",
    workerId: null,
    service: "AC Gas Refill + Deep Cleaning (Split AC)",
    category: "ac-repair",
    price: 1849,
    status: "scheduled",
    type: "scheduled",
    address: "Flat 302, Sunshine Apts, Madhapur",
    otp: null,
    rating: null,
    paymentStatus: "pending",
    createdAt: "2026-04-16T14:00:00Z",
    scheduledAt: "2026-04-18T10:00:00Z"
  },
  {
    id: "FX-28473",
    customerId: "u_001",
    workerId: "w_002",
    service: "Interior Painting — Master Bedroom",
    category: "painting",
    price: 2999,
    status: "confirmed",
    type: "scheduled",
    address: "Flat 302, Sunshine Apts, Madhapur",
    otp: null,
    rating: null,
    paymentStatus: "pending",
    createdAt: "2026-04-15T10:00:00Z",
    scheduledAt: "2026-04-19T15:00:00Z"
  },
  {
    id: "FX-28470",
    customerId: "u_001",
    workerId: "w_001",
    service: "Bathroom Cleaning",
    category: "cleaning",
    price: 499,
    status: "completed",
    type: "scheduled",
    address: "Flat 302, Sunshine Apts, Madhapur",
    otp: null,
    rating: 5,
    paymentStatus: "paid",
    createdAt: "2026-04-14T10:00:00Z",
    scheduledAt: "2026-04-15T10:00:00Z"
  },
  {
    id: "FX-28450",
    customerId: "u_001",
    workerId: "w_002",
    service: "Fan Installation — Ceiling Fan",
    category: "electrical",
    price: 199,
    status: "completed",
    type: "scheduled",
    address: "Flat 302, Sunshine Apts, Madhapur",
    otp: null,
    rating: 4,
    paymentStatus: "paid",
    createdAt: "2026-04-11T10:00:00Z",
    scheduledAt: "2026-04-12T10:00:00Z"
  },
  {
    id: "FX-28412",
    customerId: "u_001",
    workerId: "w_003",
    service: "General Pest Control — 2BHK",
    category: "pest-control",
    price: 799,
    status: "completed",
    type: "scheduled",
    address: "Flat 302, Sunshine Apts, Madhapur",
    otp: null,
    rating: 5,
    paymentStatus: "paid",
    createdAt: "2026-04-08T10:00:00Z",
    scheduledAt: "2026-04-09T10:00:00Z"
  }
];

// --- Payments & wallet ledger (in-memory) ---
const payments = [];
const walletTransactions = [];
const pendingRazorpayOrders = Object.create(null);
const processedRazorpayPaymentIds = [];

const SUBSCRIPTION_PLANS = {
  plus_monthly: { label: "FixMate Plus — Monthly", tier: "plus", months: 1, amountRupees: 199 },
  plus_yearly: { label: "FixMate Plus — Yearly", tier: "plus", months: 12, amountRupees: 1999 },
  premium_monthly: { label: "FixMate Premium — Monthly", tier: "premium", months: 1, amountRupees: 499 },
  premium_yearly: { label: "FixMate Premium — Yearly", tier: "premium", months: 12, amountRupees: 4999 }
};

function couponDiscountINR(code, subtotal) {
  if (!code || typeof code !== "string") return { discount: 0, label: null };
  const c = code.trim().toUpperCase();
  if (c === "SAVE10") {
    const discount = Math.min(500, Math.round(subtotal * 0.1));
    return { discount, label: "SAVE10 (10% up to ₹500)" };
  }
  if (c === "FIX50") {
    return { discount: Math.min(50, subtotal), label: "FIX50 (₹50 off)" };
  }
  return { discount: 0, label: null };
}

function ensureCustomerWallet(user) {
  if (typeof user.walletBalance !== "number") user.walletBalance = 0;
  if (typeof user.rewardPoints !== "number") user.rewardPoints = 0;
}

function addWalletTransaction({ userId, amount, type, referenceId, meta }) {
  const row = {
    id: `wt_${crypto.randomBytes(6).toString("hex")}`,
    userId,
    amount,
    type,
    referenceId: referenceId || null,
    meta: meta || {},
    createdAt: new Date().toISOString()
  };
  walletTransactions.push(row);
  return row;
}

function recordPayment(row) {
  payments.push(row);
  return row;
}

function findBookingPayment(bookingId) {
  return payments
    .filter(p => p.bookingId === bookingId && p.type === "BOOKING" && p.status === "completed")
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
}

function isDuplicateGatewayPayment(gatewayPaymentId) {
  if (!gatewayPaymentId) return false;
  return processedRazorpayPaymentIds.includes(gatewayPaymentId);
}

function markGatewayPaymentProcessed(gatewayPaymentId) {
  if (gatewayPaymentId && !processedRazorpayPaymentIds.includes(gatewayPaymentId)) {
    processedRazorpayPaymentIds.push(gatewayPaymentId);
  }
}

// --- Smart booking: AI express / dispatch (in-memory) ---
const fastRequests = [];
const fastInvites = [];

// Optional admin blocks — slot engine can read later
const emergencyBlocks = [];

// --- Notifications ---
const notifications = [];

// --- Helper ---
function hashPw(password) {
  return crypto.createHash("sha256").update(password).digest("hex");
}

function generateId(prefix = "bk") {
  return `${prefix}_${crypto.randomBytes(4).toString("hex")}`;
}

function getAll(role) {
  if (role === "customer") return users;
  if (role === "worker") return workers;
  if (role === "admin") return admins;
  return [];
}

function findUserByEmail(email) {
  const allUsers = [...users, ...workers, ...admins];
  return allUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
}

function findUserById(id) {
  const allUsers = [...users, ...workers, ...admins];
  return allUsers.find(u => u.id === id);
}

function safeUser(user) {
  if (!user) return null;
  const { password, ...safe } = user;
  return safe;
}

/** One-shot plan from cart AI flow (consumed on booking create) */
const customerPlanDrafts = Object.create(null);

function setCustomerPlanDraft(userId, draft) {
  customerPlanDrafts[userId] = { ...draft, savedAt: Date.now() };
}

function consumeCustomerPlanDraft(userId) {
  const d = customerPlanDrafts[userId];
  if (!d) return null;
  if (Date.now() - d.savedAt > 60 * 60 * 1000) {
    delete customerPlanDrafts[userId];
    return null;
  }
  delete customerPlanDrafts[userId];
  return d;
}

module.exports = {
  users, workers, admins, bookings, notifications,
  payments, walletTransactions, pendingRazorpayOrders,
  fastRequests, fastInvites, emergencyBlocks,
  SUBSCRIPTION_PLANS,
  hashPw, generateId, findUserByEmail, findUserById, safeUser, getAll,
  setCustomerPlanDraft, consumeCustomerPlanDraft,
  couponDiscountINR, ensureCustomerWallet, addWalletTransaction, recordPayment,
  findBookingPayment, isDuplicateGatewayPayment, markGatewayPaymentProcessed
};
