/**
 * Booking AI engine — pricing + ETA layered on FixMate recommendation analysis.
 * Used by POST /api/ai/calculate-booking and /public/calculate-booking
 */
const { workers } = require("../data/store");
const { isCategoryMatch } = require("./matchService");
const {
  deepAnalyzeComplaint,
  mergeLlmHints,
  rankWorkers,
  buildFixmateRecommendation
} = require("./recommendationEngine");

function hourIST(d) {
  return new Date(d).getHours();
}

function isWeekend(d) {
  const day = new Date(d).getDay();
  return day === 0 || day === 6;
}

function analyzeProblem(problem) {
  const p = String(problem || "").toLowerCase();
  let severity = "Low";
  let issueType = "General service";
  let workersRequired = 1;
  const workerRoles = [];

  const heavy = /heavy|flood|burst|urgent|emergency|sparking|danger|severe|major/.test(p);
  const leak = /leak|leaking|drip|water|bathroom|kitchen|pipe|tap|drain/.test(p);
  const ac = /ac|cooling|gas|compressor|split|not cooling/.test(p);
  const clean = /full house|deep clean|3bhk|2bhk|whole home|entire/.test(p);

  if (clean) {
    severity = "Medium";
    issueType = "Full home deep cleaning";
    workersRequired = 3;
    workerRoles.push("Team lead", "Cleaner 1", "Cleaner 2");
  } else if (ac && /noise|gas|multiple/.test(p)) {
    severity = "High";
    issueType = "AC system fault";
    workersRequired = 1;
    workerRoles.push("Senior AC technician");
  } else if (leak && heavy) {
    severity = "High";
    issueType = "Bathroom / plumbing leakage";
    workersRequired = 2;
    workerRoles.push("Senior Plumber", "Helper");
  } else if (leak) {
    severity = "Low";
    issueType = "Minor leak / fitting";
    workersRequired = 1;
    workerRoles.push("Plumber");
  } else if (heavy) {
    severity = "High";
    issueType = "Urgent repair";
    workersRequired = 2;
    workerRoles.push("Lead technician", "Helper");
  } else if (p.length > 40) {
    severity = "Medium";
    issueType = "Detailed issue report";
    workersRequired = 1;
    workerRoles.push("Specialist");
  } else {
    workerRoles.push("Technician");
  }

  return { severity, issueType, workersRequired, workerRoles };
}

function severityRank(s) {
  if (s === "High") return 3;
  if (s === "Medium") return 2;
  return 1;
}

function mapDeepToProb(merged) {
  let roles = ["Technician"];
  if (merged.workersRequired >= 3) roles = ["Team lead", "Technician 1", "Technician 2"];
  else if (merged.workersRequired === 2) roles = ["Lead technician", "Helper"];
  return {
    severity: merged.severityForPricing,
    issueType: merged.issueTypeForPricing,
    workersRequired: merged.workersRequired,
    workerRoles: roles
  };
}

function mergeProbWithLegacy(deepProb, legacyProb) {
  const severity =
    severityRank(legacyProb.severity) > severityRank(deepProb.severity) ? legacyProb.severity : deepProb.severity;
  const workersRequired = Math.max(deepProb.workersRequired, legacyProb.workersRequired);
  const issueType =
    severityRank(legacyProb.severity) > severityRank(deepProb.severity) ? legacyProb.issueType : deepProb.issueType;
  const workerRoles =
    workersRequired === legacyProb.workersRequired ? legacyProb.workerRoles : deepProb.workerRoles;
  return { severity, issueType, workersRequired, workerRoles };
}

function countEligibleWorkers(city, category) {
  const c = (city || "").toLowerCase();
  const list = workers.filter(w => (w.city || "").toLowerCase() === c && w.isVerified);
  const online = list.filter(w => w.isOnline);
  const pool = online.length ? online : list;
  if (!category || String(category).toLowerCase() === "grouped") return pool.length;
  return pool.filter(w => isCategoryMatch(w, category)).length || pool.length;
}

/**
 * @param {object} input
 * @param {object} [input.llmHints] optional client-side LLM structured hints
 * @returns full engine output + fixmateRecommendation
 */
function calculateBookingAI(input) {
  const {
    service = "",
    category = "cleaning",
    problem = "",
    cartValue = 0,
    customer = null,
    now = new Date(),
    llmHints = null
  } = input;

  const city = customer?.city || "Hyderabad";
  const membership = String(customer?.membership || "free").toLowerCase();
  const isPlus = membership === "plus" || membership === "premium";

  const merged = mergeLlmHints(deepAnalyzeComplaint(problem, category), llmHints);
  const deepProb = mapDeepToProb(merged);
  const legacyProb = analyzeProblem(problem);
  const prob = String(problem || "").trim().length < 3 ? legacyProb : mergeProbWithLegacy(deepProb, legacyProb);

  const slugForWorkers = merged.categorySlug || category;
  const workersNear = countEligibleWorkers(city, slugForWorkers);
  const peakHour = hourIST(now) >= 18 && hourIST(now) < 22;
  const weekend = isWeekend(now);

  const baseFare = Math.max(299, Math.round(Number(cartValue) * 0.85) || 699);
  let extraWorkerFee = prob.workersRequired > 1 ? 299 : 0;
  if (prob.workersRequired >= 3) extraWorkerFee = 499;

  let priorityFee = workersNear >= 3 ? 49 : workersNear >= 1 ? 69 : 99;
  let peakFee = (peakHour ? 99 : 0) + (weekend ? 29 : 0);
  if (merged.urgency === "Emergency") {
    priorityFee += 79;
    peakFee += 49;
  } else if (merged.urgency === "High") {
    priorityFee += 39;
  }
  if (isPlus) {
    priorityFee = 0;
    peakFee = 0;
  }

  const discount = weekend ? 80 : prob.severity === "Low" ? 40 : 20;

  const fastTotal = Math.round(baseFare + extraWorkerFee + priorityFee + peakFee - discount * 0.25);
  const scheduledTotal = Math.round(baseFare + extraWorkerFee * 0.5 + peakFee * 0.5 - discount);
  const budgetTotal = Math.round(baseFare - discount * 1.5);

  const finalPrices = {
    fast: Math.max(fastTotal, baseFare + 49),
    scheduled: Math.max(scheduledTotal, baseFare + 29),
    budget: Math.max(budgetTotal, Math.round(baseFare * 0.88))
  };

  let recommendedPlan = "Smart Scheduled";
  if (merged.recommendedMode === "instant" || prob.severity === "High") recommendedPlan = "Fast Delivery";
  else if (merged.recommendedMode === "flexible" || (prob.severity === "Low" && cartValue < 800)) {
    recommendedPlan = "Budget Flexible";
  }

  const upgradeProposal =
    prob.workersRequired >= 2
      ? {
          message: `Approve upgraded plan with ${prob.workersRequired} workers (+₹${extraWorkerFee} manpower)?`,
          feeINR: extraWorkerFee,
          approveRequired: true
        }
      : { message: null, feeINR: 0, approveRequired: false };

  const fastETA = workersNear >= 4 ? "12 mins" : workersNear >= 2 ? "18 mins" : "22 mins";
  const normalETA = "Tomorrow 10 AM";
  const budgetETA = "Today Evening";

  const engine = {
    severity: prob.severity,
    issueType: prob.issueType,
    workersRequired: prob.workersRequired,
    workerRoles: prob.workerRoles,
    estimatedDuration: prob.workersRequired >= 3 ? "3–4 hrs" : prob.workersRequired === 2 ? "2 hrs" : "1 hr",
    fastETA,
    normalETA,
    budgetETA,
    baseFare,
    extraWorkerFee,
    priorityFee,
    peakFee,
    discount,
    recommendedPlan,
    finalPrices,
    workersAvailableNear: workersNear,
    demandLevel: peakHour ? "high" : weekend ? "elevated" : "normal",
    membershipNote: isPlus ? "Plus: priority & peak fees waived in engine." : null,
    upgradeProposal,
    meta: {
      service,
      category: slugForWorkers,
      cartCategory: category,
      city,
      cartValue: Number(cartValue) || 0,
      analysis: merged
    }
  };

  const workersTop = rankWorkers(city, slugForWorkers, 3);
  engine.fixmateRecommendation = buildFixmateRecommendation(engine, merged, workersTop);

  return engine;
}

module.exports = { calculateBookingAI, analyzeProblem };
