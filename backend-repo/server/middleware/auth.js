/* ============================================
   JWT Auth Middleware
   Simple HMAC-SHA256 token for hackathon demo
   ============================================ */
const crypto = require("crypto");
const { findUserById, safeUser } = require("../data/store");

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET || JWT_SECRET.length < 24 || JWT_SECRET === "fixmate-ai-secret-key-2026") {
  throw new Error("JWT_SECRET missing or weak. Set a strong secret in backend-repo/server/.env");
}
const TOKEN_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

function createToken(userId, role) {
  const payload = {
    id: userId,
    role: role,
    iat: Date.now(),
    exp: Date.now() + TOKEN_EXPIRY
  };
  const data = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = crypto.createHmac("sha256", JWT_SECRET).update(data).digest("base64url");
  return `${data}.${sig}`;
}

function verifyToken(token) {
  try {
    const [data, sig] = token.split(".");
    if (!data || !sig) return null;
    
    const expectedSig = crypto.createHmac("sha256", JWT_SECRET).update(data).digest("base64url");
    if (sig !== expectedSig) return null;
    
    const payload = JSON.parse(Buffer.from(data, "base64url").toString());
    if (payload.exp < Date.now()) return null;
    
    return payload;
  } catch {
    return null;
  }
}

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "No authentication token provided" });
  }

  const token = authHeader.slice(7);
  const payload = verifyToken(token);
  if (!payload) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }

  const user = findUserById(payload.id);
  if (!user) {
    return res.status(401).json({ error: "User not found" });
  }

  req.user = safeUser(user);
  req.userId = payload.id;
  req.userRole = payload.role;
  next();
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.userRole)) {
      return res.status(403).json({ error: "Unauthorized: insufficient permissions" });
    }
    next();
  };
}

module.exports = { createToken, verifyToken, authMiddleware, requireRole };
