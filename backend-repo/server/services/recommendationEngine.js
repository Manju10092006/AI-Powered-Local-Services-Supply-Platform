/**
 * FixMate Recommendation Engine — hybrid complaint understanding + worker ranking.
 * Complements bookingAIEngine pricing; safe to call without external LLM.
 */
const { workers } = require("../data/store");
const { isCategoryMatch } = require("./matchService");

const CATEGORY_SLUGS = [
  "plumbing",
  "electrical",
  "ac-repair",
  "appliance",
  "cleaning",
  "pest-control",
  "painting",
  "carpentry",
  "salon",
  "general"
];

const LABEL_TO_SLUG = {
  Plumber: "plumbing",
  Plumbing: "plumbing",
  Electrician: "electrical",
  Electrical: "electrical",
  "AC Repair": "ac-repair",
  "Appliance Repair": "appliance",
  Appliance: "appliance",
  Cleaning: "cleaning",
  "Pest Control": "pest-control",
  Painting: "painting",
  Carpenter: "carpentry",
  "CCTV / Smart Home": "electrical",
  "General Technician": "general",
  General: "general"
};

function slugFromLabel(label) {
  const s = LABEL_TO_SLUG[String(label || "").trim()];
  if (s) return s;
  const k = String(label || "")
    .toLowerCase()
    .replace(/\s+/g, "-");
  return CATEGORY_SLUGS.includes(k) ? k : "general";
}

function scoreUrgencyAndSignals(p) {
  let score = 3;
  const symptoms = [];
  const hidden = [];
  let risk = "Low";
  let room = "";
  let appliance = "";

  if (/bathroom|kitchen|ceiling|wall|balcony|bedroom|living/.test(p)) {
    const m = p.match(/(bathroom|kitchen|ceiling|wall|balcony|bedroom|living\s*room)/);
    if (m) room = m[1];
  }
  if (/washing\s*machine|dishwasher|geyser|water\s*heater|fridge|refrigerator|microwave|oven|ac\b|split/.test(p)) {
    const m = p.match(/(washing\s*machine|dishwasher|geyser|water\s*heater|fridge|refrigerator|microwave|oven|ac|split)/i);
    if (m) appliance = m[1];
  }

  if (/sparking|spark|arc\s*ing|burning\s*smell|smoke\s*from\s*socket|electrocution|live\s*wire/.test(p)) {
    score = 10;
    symptoms.push("Electrical arcing or burn risk");
    hidden.push("Possible short or loose neutral / socket fault");
    risk = "Critical";
  } else if (/gas\s*smell|lpg\s*leak|gas\s*leak/.test(p)) {
    score = 10;
    symptoms.push("Gas odor reported");
    hidden.push("Potential LPG / line leak — needs immediate verification");
    risk = "Critical";
  } else if (/flooding|gushing|burst|water\s*pouring|can't\s*stop\s*the\s*water/.test(p)) {
    score = 9;
    symptoms.push("Uncontrolled water flow");
    hidden.push("Shut-off valve or concealed pipe failure");
    risk = "High";
  } else if (
    /ceiling|upstairs|through\s*the\s*wall|when\s*.*runs|only\s*when|stain|seep|damp\s*patch/.test(p) &&
    /water|wet|drip|leak|moist/.test(p)
  ) {
    score = Math.max(score, 7);
    symptoms.push("Water marks or dripping tied to usage upstairs / appliances");
    hidden.push("Often concealed supply or drain line — not only surface leak");
    risk = "High";
  } else if (/night|today|right\s*now|urgent|asap|immediately|can't\s*wait/.test(p)) {
    score = Math.max(score, 6);
    symptoms.push("Time-sensitive request");
  } else if (/not\s*cooling|weak\s*cooling|ice\s*formation|gas\s*refill|compressor|noise/.test(p)) {
    score = Math.max(score, 5);
    symptoms.push("HVAC / cooling performance issue");
  } else if (/no\s*power|tripping|mcb|fuse|whole\s*house\s*dark/.test(p)) {
    score = Math.max(score, 7);
    symptoms.push("Power loss or protective device tripping");
  }

  return { score, symptoms, hidden, risk, room, appliance };
}

function pickCategories(p, cartCategorySlug) {
  const labels = new Set();
  if (/sparking|socket|mcb|fuse|wiring|no\s*power|tripping|fan|switch|light|electric|short/.test(p)) labels.add("Electrician");
  if (
    /plumb|leak|drip|pipe|tap|drain|toilet|clog|water|bathroom|kitchen\s*sink|ceiling|sewage|flood|wet/.test(p)
  ) {
    labels.add("Plumber");
  }
  if (/ac\b|air\s*con|split|not\s*cooling|cooling|gas\s*refill|compressor|hvac|ice\s*on\s*coil/.test(p)) labels.add("AC Repair");
  if (/fridge|washing|oven|microwave|appliance|dishwasher/.test(p)) labels.add("Appliance Repair");
  if (/pest|termite|rodent|cockroach|lizard/.test(p)) labels.add("Pest Control");
  if (/paint|wall\s*crack|peel|waterproof/.test(p)) labels.add("Painting");
  if (/wood|door|hinge|shelf|carpent/.test(p)) labels.add("Carpenter");
  if (/deep\s*clean|sofa\s*clean|bathroom\s*clean|full\s*house\s*clean/.test(p)) labels.add("Cleaning");

  if (!labels.size) {
    const slug = String(cartCategorySlug || "cleaning").toLowerCase();
    if (slug === "plumbing") labels.add("Plumber");
    else if (slug === "electrical") labels.add("Electrician");
    else if (slug === "ac-repair") labels.add("AC Repair");
    else if (slug === "cleaning") labels.add("Cleaning");
    else if (slug === "painting") labels.add("Painting");
    else if (slug === "salon") labels.add("General Technician");
    else labels.add("General Technician");
  }

  return [...labels];
}

function deepAnalyzeComplaint(problem, cartCategorySlug = "cleaning") {
  const p = String(problem || "").toLowerCase().trim();
  const sig = scoreUrgencyAndSignals(p);
  const categories = pickCategories(p, cartCategorySlug);
  const primaryLabel = categories[0] || "General Technician";
  const categorySlug = slugFromLabel(primaryLabel);

  let urgency = "Low";
  if (sig.score >= 10) urgency = "Emergency";
  else if (sig.score >= 8) urgency = "High";
  else if (sig.score >= 5) urgency = "Medium";

  let complexity = "Standard";
  if (/concealed|inside\s*the\s*wall|ceiling\s*cavity|multiple\s*floors|rewire|panel/.test(p)) complexity = "Advanced";
  if (sig.score >= 9 || /sparking|gas\s*smell|flooding/.test(p)) complexity = "Expert Required";
  if (sig.score <= 3 && /dust|minor|small\s*crack|single\s*tap/.test(p)) complexity = "Basic";

  let recommendedMode = "scheduled";
  if (urgency === "Emergency" || urgency === "High") recommendedMode = "instant";
  else if (urgency === "Low" && sig.score <= 4 && !/night|today|urgent/.test(p)) recommendedMode = "flexible";

  const issueSummary =
    sig.score >= 7 && /ceiling|upstairs|when/.test(p)
      ? "Possible concealed or pressure-linked plumbing leak affecting ceilings or adjacent rooms."
      : sig.score >= 9
        ? "Urgent home service issue — safety or property damage risk."
        : p.length > 20
          ? `Reported issue: ${String(problem).slice(0, 160)}${String(problem).length > 160 ? "…" : ""}`
          : "Routine home service assessment — add a few details for a sharper match.";

  const why =
    recommendedMode === "instant"
      ? "Higher urgency or active damage risk — fastest dispatch reduces further loss."
      : recommendedMode === "flexible"
        ? "Lower urgency — off-peak routing saves cost without sacrificing verified quality."
        : "Standard planning — pick a slot so we reserve the best-rated available technician.";

  let workersRequired = 1;
  if (/full\s*house|3bhk|2bhk|whole\s*home|entire|team/.test(p)) workersRequired = 3;
  else if ((/leak|flood|ceiling/.test(p) && sig.score >= 7) || /two\s*workers|2\s*workers/.test(p)) workersRequired = 2;

  let severity = "Low";
  if (urgency === "Emergency" || urgency === "High") severity = "High";
  else if (urgency === "Medium") severity = "Medium";

  let confidence = p.length > 60 ? 0.88 : p.length > 25 ? 0.78 : 0.62;
  let followUpQuestion = null;
  if (confidence < 0.75) {
    followUpQuestion =
      /leak|wet|drip/.test(p) && !/constant|only\s*when|stopped/.test(p)
        ? "Is the leakage constant, or only when taps / washing machine / shower run?"
        : "Roughly when did it start, and is anyone in the home affected (slip / smell / sparks)?";
  }

  return {
    issueSummary,
    symptoms: sig.symptoms,
    hiddenCauses: sig.hidden,
    riskLevel: sig.risk,
    roomOrLocation: sig.room || null,
    appliance: sig.appliance || null,
    categoryLabels: categories,
    categorySlug,
    primaryCategoryLabel: primaryLabel,
    urgency,
    urgencyScore: Math.min(10, Math.max(1, sig.score)),
    complexity,
    recommendedMode,
    why,
    confidence,
    followUpQuestion,
    workersRequired,
    severityForPricing: severity,
    issueTypeForPricing:
      primaryLabel === "Plumber"
        ? "Plumbing assessment"
        : primaryLabel === "Electrician"
          ? "Electrical safety check"
          : primaryLabel === "AC Repair"
            ? "AC performance diagnosis"
            : "Home service visit"
  };
}

function mergeLlmHints(base, llmHints) {
  if (!llmHints || typeof llmHints !== "object") return { ...base, llmUsed: false };
  if (llmHints.outOfDomain === true) return { ...base, llmUsed: false, llmRefusal: llmHints.message || null };

  const conf = Number(llmHints.confidence);
  if (!Number.isFinite(conf) || conf < 0.45) return { ...base, llmUsed: false };

  const merged = { ...base, llmUsed: true, llmConfidence: conf };
  if (typeof llmHints.issueSummary === "string" && llmHints.issueSummary.length > 8) {
    merged.issueSummary = llmHints.issueSummary.slice(0, 400);
  }
  if (typeof llmHints.why === "string" && llmHints.why.length > 5) merged.why = llmHints.why.slice(0, 500);
  if (typeof llmHints.followUpQuestion === "string" && llmHints.followUpQuestion.length > 5) {
    merged.followUpQuestion = llmHints.followUpQuestion.slice(0, 220);
  }
  if (typeof llmHints.category === "string" && llmHints.category.length > 1) {
    const slug = slugFromLabel(llmHints.category);
    merged.primaryCategoryLabel = llmHints.category.trim();
    merged.categorySlug = slug;
    if (!merged.categoryLabels.includes(llmHints.category.trim())) merged.categoryLabels.unshift(llmHints.category.trim());
  }
  if (typeof llmHints.urgency === "string") {
    const u = llmHints.urgency.trim();
    if (["Low", "Medium", "High", "Emergency"].includes(u)) merged.urgency = u;
  }
  const us = Number(llmHints.urgencyScore);
  if (Number.isFinite(us)) merged.urgencyScore = Math.min(10, Math.max(1, us));
  if (typeof llmHints.complexity === "string" && llmHints.complexity.length > 2) merged.complexity = llmHints.complexity;
  if (typeof llmHints.recommendedMode === "string") {
    const m = llmHints.recommendedMode.toLowerCase();
    if (m === "instant" || m === "fast") merged.recommendedMode = "instant";
    else if (m === "flexible" || m === "budget") merged.recommendedMode = "flexible";
    else merged.recommendedMode = "scheduled";
  }
  if (Number.isFinite(llmHints.workersRequired)) {
    merged.workersRequired = Math.min(4, Math.max(1, Math.round(llmHints.workersRequired)));
  }
  if (merged.urgency === "Emergency" || merged.urgency === "High") merged.severityForPricing = "High";
  else if (merged.urgency === "Medium") merged.severityForPricing = "Medium";
  else merged.severityForPricing = "Low";

  return merged;
}

function rankWorkers(city, categorySlug, limit = 3) {
  const c = (city || "Hyderabad").toLowerCase();
  let pool = workers.filter(w => w.isVerified && (w.city || "").toLowerCase() === c);
  if (!pool.length) pool = workers.filter(w => w.isVerified);

  pool.sort((a, b) => {
    const ma = isCategoryMatch(a, categorySlug) ? 2 : isCategoryMatch(a, "general") ? 0 : 1;
    const mb = isCategoryMatch(b, categorySlug) ? 2 : isCategoryMatch(b, "general") ? 0 : 1;
    if (mb !== ma) return mb - ma;
    const oa = a.isOnline ? 1 : 0;
    const ob = b.isOnline ? 1 : 0;
    if (ob !== oa) return ob - oa;
    return (b.rating || 0) - (a.rating || 0);
  });

  const tagFor = w => {
    const sk = (w.skill || "").trim();
    if (isCategoryMatch(w, categorySlug)) return `${sk || "Verified"} · matched`;
    return `${sk || "Pro"} · nearby`;
  };

  return pool.slice(0, limit).map((w, i) => ({
    id: w.id,
    name: (w.name || "Pro").split(/\s+/)[0],
    rating: Number(w.rating) || 4.7,
    distance: `${(0.7 + i * 0.45).toFixed(1)} km`,
    tag: tagFor(w),
    isOnline: !!w.isOnline
  }));
}

function buildFixmateRecommendation(engine, deep, workersTop) {
  return {
    issueSummary: deep.issueSummary,
    category: deep.primaryCategoryLabel,
    categories: deep.categoryLabels,
    categorySlug: deep.categorySlug,
    urgency: deep.urgency,
    urgencyScore: deep.urgencyScore,
    complexity: deep.complexity,
    recommendedMode: deep.recommendedMode,
    why: deep.why,
    pricing: {
      instant: engine.finalPrices.fast,
      scheduled: engine.finalPrices.scheduled,
      flexible: engine.finalPrices.budget
    },
    recommendedWorkers: workersTop,
    followUpQuestion: deep.followUpQuestion,
    confidence: deep.confidence,
    symptoms: deep.symptoms,
    riskLevel: deep.riskLevel,
    llmUsed: !!deep.llmUsed,
    llmRefusal: deep.llmRefusal || null
  };
}

module.exports = {
  deepAnalyzeComplaint,
  mergeLlmHints,
  rankWorkers,
  buildFixmateRecommendation,
  slugFromLabel
};
