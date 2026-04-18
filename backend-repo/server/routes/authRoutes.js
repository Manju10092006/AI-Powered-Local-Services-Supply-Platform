/* Auth Routes — Login & Register */
const express = require("express");
const { findUserByEmail, hashPw, generateId, users, workers, safeUser } = require("../data/store");
const { createToken } = require("../middleware/auth");

const router = express.Router();

// POST /auth/login
router.post("/login", (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  const user = findUserByEmail(email);
  if (!user || user.password !== hashPw(password)) {
    return res.status(401).json({ error: "Invalid email or password" });
  }

  const token = createToken(user.id, user.role);
  return res.json({
    token,
    user: safeUser(user),
    role: user.role,
    redirect: user.role === "customer" ? "/customer/dashboard.html"
             : user.role === "worker" ? "/worker/dashboard.html"
             : "/admin/dashboard.html"
  });
});

// POST /auth/register
router.post("/register", (req, res) => {
  const { name, email, phone, password, city } = req.body || {};
  const role = "customer";
  
  if (!name || !email || !password) {
    return res.status(400).json({ error: "Name, email, and password are required" });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters" });
  }

  const existing = findUserByEmail(email);
  if (existing) {
    return res.status(409).json({ error: "An account with this email already exists" });
  }

  const newUser = {
    id: generateId(role === "worker" ? "w" : "u"),
    name,
    email: email.toLowerCase(),
    phone: phone || "",
    password: hashPw(password),
    role,
    city: city || "Hyderabad",
    createdAt: new Date().toISOString()
  };

  if (role === "worker") {
    Object.assign(newUser, {
      skill: skill || "General",
      skills: [],
      experience: "1-2 years",
      rating: 0,
      totalJobs: 0,
      totalEarnings: 0,
      isOnline: false,
      isVerified: false,
      avatar: "",
      serviceZones: [],
      wallet: 0,
      bank: {},
      onboardingApproved: false,
      approvalStatus: "pending_onboarding",
      onboarding: { currentStep: 1, data: {}, submittedAt: null },
      workerDocuments: []
    });
    workers.push(newUser);
  } else {
    Object.assign(newUser, {
      address: "",
      membership: "free",
      walletBalance: 0,
      rewardPoints: 0,
      membershipExpiresAt: null,
      savedAddresses: []
    });
    users.push(newUser);
  }

  const token = createToken(newUser.id, newUser.role);
  return res.status(201).json({
    token,
    user: safeUser(newUser),
    role: newUser.role,
    redirect: "/customer/dashboard.html"
  });
});

// GET /auth/verify — check if token is still valid
router.get("/verify", (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ valid: false });
  }
  const { verifyToken } = require("../middleware/auth");
  const { findUserById } = require("../data/store");
  const payload = verifyToken(authHeader.slice(7));
  if (!payload) return res.status(401).json({ valid: false });
  const user = findUserById(payload.id);
  if (!user) return res.status(401).json({ valid: false });
  return res.json({ valid: true, user: safeUser(user), role: user.role });
});

module.exports = router;
