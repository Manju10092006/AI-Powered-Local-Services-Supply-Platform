/* Razorpay client — secrets stay on server only */
let instance = null;

function getCredentials() {
  const keyId = String(process.env.RAZORPAY_KEY_ID || process.env.RAZORPAY_API_KEY || "").trim();
  const keySecret = String(process.env.RAZORPAY_KEY_SECRET || process.env.RAZORPAY_API_SECRET || "").trim();
  return { keyId, keySecret };
}

function isConfigured() {
  const { keyId, keySecret } = getCredentials();
  return Boolean(keyId && keySecret);
}

function getKeyId() {
  return getCredentials().keyId || null;
}

function getKeySecret() {
  return getCredentials().keySecret || null;
}

function getRazorpay() {
  if (!isConfigured()) return null;
  if (!instance) {
    const Razorpay = require("razorpay");
    const { keyId, keySecret } = getCredentials();
    instance = new Razorpay({ key_id: keyId, key_secret: keySecret });
  }
  return instance;
}

module.exports = { getRazorpay, isConfigured, getKeyId, getKeySecret };
