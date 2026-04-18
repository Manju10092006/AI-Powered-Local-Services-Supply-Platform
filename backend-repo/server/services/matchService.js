const { workers } = require("../data/store");

const categoryPriceMap = {
  "AC Repair": 1000,
  Plumbing: 500,
  Electrical: 700,
  Cleaning: 600,
  Salon: 900,
  Painting: 800,
  "Pest Control": 700,
  "Appliance Repair": 900,
  General: 500
};

const urgencySurcharge = {
  HIGH: 300,
  MEDIUM: 150,
  LOW: 0
};

function normalizeCategory(category) {
  if (!category || typeof category !== "string") return "General";
  const key = category.toLowerCase().trim();
  const map = {
    "ac repair": "AC Repair",
    "ac-repair": "AC Repair",
    plumbing: "Plumbing",
    electrical: "Electrical",
    cleaning: "Cleaning",
    salon: "Salon",
    painting: "Painting",
    "pest control": "Pest Control",
    "pest-control": "Pest Control",
    "appliance repair": "Appliance Repair",
    "appliance": "Appliance Repair",
    general: "General"
  };
  return map[key] || category.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function getWorkerAvailability(worker) {
  if (worker.availability) return worker.availability;
  return worker.isOnline ? "ONLINE" : "OFFLINE";
}

function isCategoryMatch(worker, category) {
  const normalized = normalizeCategory(category).toLowerCase();
  const skill = (worker.skill || "").toLowerCase();
  const skills = Array.isArray(worker.skills) ? worker.skills.map((item) => item.toLowerCase()) : [];

  if (skill === normalized) return true;
  if (skill.includes(normalized)) return true;
  if (skills.some((item) => item.includes(normalized))) return true;
  return false;
}

function getWorkerScore(worker, category) {
  let score = 0;
  score += getWorkerAvailability(worker) === "ONLINE" ? 100 : 0;
  score += isCategoryMatch(worker, category) ? 50 : 0;
  score += Math.round(worker.rating || 0) * 10;
  return score;
}

function getFallbackWorker() {
  return {
    id: null,
    name: "Support Team",
    rating: 4.1,
    category: "General",
    availability: "ONLINE"
  };
}

function getBestWorkerByCategory(category) {
  const normalizedCategory = normalizeCategory(category);
  const availableWorkers = workers.filter((worker) => worker.isVerified);
  if (!availableWorkers.length) return getFallbackWorker();

  const onlineWorkers = availableWorkers.filter((worker) => getWorkerAvailability(worker) === "ONLINE");
  const candidates = onlineWorkers.length ? onlineWorkers : availableWorkers;

  const sorted = candidates.slice().sort((a, b) => getWorkerScore(b, normalizedCategory) - getWorkerScore(a, normalizedCategory));
  return sorted[0] || getFallbackWorker();
}

function findNextAvailableWorker(booking, excludeWorkerId) {
  const normalizedCategory = normalizeCategory(booking.category || "General");
  const availableWorkers = workers.filter(
    (worker) => worker.isVerified && getWorkerAvailability(worker) === "ONLINE" && worker.id !== excludeWorkerId
  );
  if (!availableWorkers.length) return getFallbackWorker();

  const sorted = availableWorkers.slice().sort(
    (a, b) => getWorkerScore(b, normalizedCategory) - getWorkerScore(a, normalizedCategory)
  );
  return sorted[0] || getFallbackWorker();
}

function getBasePrice(category) {
  return categoryPriceMap[normalizeCategory(category)] || categoryPriceMap.General;
}

function calculateEstimatedCost(category, urgency) {
  return getBasePrice(category) + (urgencySurcharge[urgency] || 0);
}

function getFallbackPrice(category) {
  return getBasePrice(category);
}

module.exports = {
  workers,
  fallbackPrices: categoryPriceMap,
  getBestWorkerByCategory,
  getFallbackPrice,
  calculateEstimatedCost,
  normalizeCategory,
  getWorkerScore,
  getFallbackWorker,
  findNextAvailableWorker,
  isCategoryMatch
};
