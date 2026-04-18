/* AI Express / fast booking heuristics + worker ranking */
const crypto = require("crypto");
const { isCategoryMatch, getWorkerScore } = require("./matchService");

function analyzeFastBooking(problem) {
  const p = String(problem || "").toLowerCase();
  let category = "plumbing";
  let serviceLabel = "Plumbing visit";
  let severity = "MEDIUM";

  if (/ac|cooling|compressor|split|window ac/.test(p)) {
    category = "ac-repair";
    serviceLabel = "AC repair & servicing";
  } else if (/spark|switch|fan|wiring|electric|mcb|short/.test(p)) {
    category = "electrical";
    serviceLabel = "Electrical safety & repair";
  } else if (/paint|wall|ceiling/.test(p)) {
    category = "painting";
    serviceLabel = "Painting touch-up";
  } else if (/clean|sofa|bathroom|kitchen deep/.test(p)) {
    category = "cleaning";
    serviceLabel = "Home cleaning";
  } else if (/pest|termite|cockroach/.test(p)) {
    category = "pest-control";
    serviceLabel = "Pest control";
  } else if (/leak|water|pipe|tap|drain|kitchen|bathroom/.test(p)) {
    category = "plumbing";
    serviceLabel = "Plumbing & leak fix";
  }

  if (/burst|flood|urgent|emergency|heavily|sparking|fire|danger/.test(p)) severity = "HIGH";

  const workersNeeded = severity === "HIGH" ? 2 : 1;
  const baseEta = severity === "HIGH" ? 12 : workersNeeded > 1 ? 16 : 18;
  const guaranteeMinutes = baseEta <= 14 ? 10 : 18;
  const priceLowINR = severity === "HIGH" ? 699 : 499;
  const priceHighINR = severity === "HIGH" ? 999 : 849;

  return {
    serviceLabel,
    category,
    severity,
    workersNeeded,
    etaMinutes: baseEta,
    guaranteeMinutes,
    guaranteeBadge: `⚡ ${guaranteeMinutes} Min ${guaranteeMinutes <= 12 ? "Available" : "Arrival"}`,
    priceLowINR,
    priceHighINR,
    summary: `${serviceLabel} · ${severity} priority`
  };
}

function rankWorkersForFast(customer, workers, category) {
  const c = (customer?.city || "").toLowerCase();
  const pool = workers.filter(w => w.role === "worker" && w.isVerified && (w.city || "").toLowerCase() === c);
  const plusBoost = (customer?.membership || "").toLowerCase() === "plus" || (customer?.membership || "").toLowerCase() === "premium" ? 25 : 0;

  const scored = pool.map(w => {
    let s = getWorkerScore(w, category) + plusBoost;
    if (isCategoryMatch(w, category)) s += 40;
    s += (w.rating || 0) * 15;
    s += (w.totalJobs || 0) * 0.01;
    return { worker: w, score: s };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.map(x => x.worker).slice(0, 15);
}

function newFastId() {
  return `fb_${crypto.randomBytes(5).toString("hex")}`;
}

function newInviteId() {
  return `fbi_${crypto.randomBytes(4).toString("hex")}`;
}

module.exports = {
  analyzeFastBooking,
  rankWorkersForFast,
  newFastId,
  newInviteId
};
