const { getAiSuggestion } = require("../services/aiService");
const {
  workers,
  fallbackPrices,
  getBestWorkerByCategory,
  getFallbackPrice,
  calculateEstimatedCost,
  getFallbackWorker,
  normalizeCategory
} = require("../services/matchService");
const { bookings, generateId } = require("../data/store");

let trackedLocation = {
  // Hyderabad starting point
  lat: 17.385,
  lng: 78.4867
};

function getUrgency(problem) {
  const text = problem.toLowerCase();

  if (
    text.includes("gas leak") ||
    text.includes("fire") ||
    text.includes("burning smell") ||
    text.includes("sparks")
  ) {
    return {
      urgency: "HIGH",
      urgency_message: "Immediate attention required"
    };
  }

  if (text.includes("not working") || text.includes("stopped") || text.includes("broken")) {
    return {
      urgency: "MEDIUM",
      urgency_message: "Needs quick service"
    };
  }

  if (text.includes("slow cooling") || text.includes("minor leak") || text.includes("noise")) {
    return {
      urgency: "LOW",
      urgency_message: "Can be scheduled normally"
    };
  }

  return {
    urgency: "LOW",
    urgency_message: "Can be scheduled normally"
  };
}

async function getSuggestionResult(problem) {
  try {
    let aiSuggestion = null;
    let source = "AI";

    try {
      aiSuggestion = await getAiSuggestion(problem);
    } catch {
      aiSuggestion = null;
    }

    const validCategories = Array.isArray(aiSuggestion?.categories)
      ? aiSuggestion.categories
          .map((category) => normalizeCategory(category))
          .filter((category) => fallbackPrices[category])
      : [];

    if (!validCategories.length) {
      source = "Fallback";
    }

    const categories = validCategories.length ? [...new Set(validCategories)] : ["General"];
    const urgencyInfo = getUrgency(problem);
    const total_price = calculateEstimatedCost(categories[0], urgencyInfo.urgency);
    const breakdown = categories.reduce((acc, category) => {
      acc[category] = getFallbackPrice(category);
      return acc;
    }, {});
    const workersByCategory = categories.map((category) => ({
      category,
      ...getBestWorkerByCategory(category)
    }));
    const worker = workersByCategory[0];

    return {
      category: categories[0],
      estimated_price: total_price,
      estimated_cost: total_price,
      worker,
      categories,
      total_price,
      breakdown,
      workers: workersByCategory,
      urgency: urgencyInfo.urgency,
      urgency_message: urgencyInfo.urgency_message,
      source
    };
  } catch (error) {
    const categories = ["General"];
    const urgencyInfo = getUrgency(problem || "");
    const total_price = calculateEstimatedCost("General", urgencyInfo.urgency);
    const breakdown = { General: getFallbackPrice("General") };
    const worker = getBestWorkerByCategory("General");

    return {
      category: "General",
      estimated_price: total_price,
      estimated_cost: total_price,
      worker,
      categories,
      total_price,
      breakdown,
      workers: [{ category: "General", ...worker }],
      urgency: urgencyInfo.urgency,
      urgency_message: urgencyInfo.urgency_message,
      source: "Fallback"
    };
  }
}

async function suggestService(req, res) {
  try {
    const { problem } = req.body || {};
    if (!problem || typeof problem !== "string" || problem.trim().length < 3) {
      return res.status(400).json({ error: "Invalid problem input" });
    }

    const suggestion = await getSuggestionResult(problem);

    console.log(
      `[AI_SUGGEST] problem="${problem}" category="${suggestion.category}" price=${suggestion.estimated_price} urgency=${suggestion.urgency} source=${suggestion.source}`
    );

    return res.json({
      ...suggestion,
      tracking_enabled: true
    });
  } catch (error) {
    console.error("[AI_SUGGEST_ERROR]", error.message);
    const fallbackSuggestion = await getSuggestionResult(req.body?.problem || "");
    return res.json({
      ...fallbackSuggestion,
      source: "Fallback",
      tracking_enabled: true
    });
  }
}

function listWorkers(req, res) {
  return res.json({ workers });
}

function getTrackingStatus() {
  const statuses = ["on the way", "arriving", "nearby"];
  return statuses[Math.floor(Math.random() * statuses.length)];
}

function getRandomEta() {
  const minutes = Math.floor(Math.random() * 8) + 3; // 3 to 10
  return `${minutes} mins`;
}

function getConfidence(source) {
  // Deterministic range by source with simple random value.
  if (source === "AI") return Math.floor(Math.random() * 16) + 80; // 80-95
  return Math.floor(Math.random() * 16) + 60; // 60-75
}

function getExplanation(category) {
  if (category === "AC Repair") {
    return "Detected cooling-related issue, likely compressor or gas problem";
  }
  if (category === "Plumbing") {
    return "Detected water leakage or pipe-related issue";
  }
  if (category === "Electrical") {
    return "Detected electrical appliance malfunction";
  }
  return "Issue unclear, using general service category";
}

function getExplanationForCategories(categories) {
  return categories.map((category) => getExplanation(category)).join("; ");
}

async function trackWorker(req, res) {
  const tracking = await getTrackingResult(req.params.workerName);
  return res.json(tracking);
}

async function getTrackingResult(workerName) {
  // Optional small delay to simulate realtime fetch latency.
  const delayMs = Math.floor(Math.random() * 501);
  await new Promise((resolve) => setTimeout(resolve, delayMs));

  // Move a little on each request.
  const latOffset = (Math.random() - 0.5) * 0.001;
  const lngOffset = (Math.random() - 0.5) * 0.001;

  trackedLocation = {
    lat: Number((trackedLocation.lat + latOffset).toFixed(6)),
    lng: Number((trackedLocation.lng + lngOffset).toFixed(6))
  };

  return {
    worker: decodeURIComponent(workerName),
    location: trackedLocation,
    status: getTrackingStatus(),
    eta: getRandomEta()
  };
}

async function demoFlow(req, res) {
  const startTime = Date.now();
  try {
    const { problem } = req.body || {};
    if (!problem || typeof problem !== "string" || problem.trim().length < 3) {
      return res.status(400).json({ error: "Invalid problem input" });
    }

    const suggestion = await getSuggestionResult(problem);
    const tracking = await getTrackingResult(suggestion.worker.name);
    const confidence = getConfidence(suggestion.source);
    const explanation = getExplanationForCategories(suggestion.categories);

    return res.json({
      categories: suggestion.categories,
      total_price: suggestion.total_price,
      breakdown: suggestion.breakdown,
      workers: suggestion.workers,
      urgency: suggestion.urgency,
      source: suggestion.source,
      confidence,
      explanation,
      tracking: {
        location: tracking.location,
        status: tracking.status,
        eta: tracking.eta
      }
    });
  } catch (error) {
    console.error("[DEMO_FLOW_ERROR]", error.message);
    return res.status(500).json({
      error: "Something went wrong",
      source: "Fallback"
    });
  } finally {
    console.log(`[PERF] /demo/flow took ${Date.now() - startTime}ms`);
  }
}

function generateBookingId() {
  return `bk_${Math.random().toString(36).slice(2, 10)}`;
}

async function createBooking(req, res) {
  const { problem } = req.body || {};
  if (!problem || typeof problem !== "string" || problem.trim().length < 3) {
    return res.status(400).json({ error: "Invalid problem input" });
  }

  const suggestion = await getSuggestionResult(problem);
  const worker = suggestion.worker || getFallbackWorker();

  const booking = {
    id: generateBookingId(),
    customerId: null,
    workerId: worker.id || null,
    worker,
    problem: problem.trim(),
    category: suggestion.category,
    price: suggestion.estimated_price,
    status: "assigned",
    type: "demo",
    address: "Demo request",
    otp: worker.id ? String(Math.floor(1000 + Math.random() * 9000)) : null,
    rating: null,
    createdAt: new Date().toISOString(),
    scheduledAt: new Date().toISOString()
  };

  bookings.push(booking);

  return res.json({
    bookingId: booking.id,
    category: booking.category,
    price: booking.price,
    worker: booking.worker,
    status: booking.status
  });
}

async function demoRun(req, res) {
  try {
    const { problem } = req.body || {};
    if (!problem || typeof problem !== "string" || problem.trim().length < 3) {
      return res.status(400).json({ error: "Invalid problem input" });
    }

    const suggestion = await getSuggestionResult(problem);
    const worker = suggestion.worker || getFallbackWorker();
    const booking = {
      id: generateBookingId(),
      customerId: null,
      workerId: worker.id || null,
      worker,
      problem: problem.trim(),
      category: suggestion.category,
      price: suggestion.estimated_price,
      status: "assigned",
      type: "demo",
      address: "Demo request",
      otp: worker.id ? String(Math.floor(1000 + Math.random() * 9000)) : null,
      rating: null,
      createdAt: new Date().toISOString(),
      scheduledAt: new Date().toISOString()
    };

    bookings.push(booking);

    return res.json({
      problem: booking.problem,
      category: booking.category,
      urgency: suggestion.urgency,
      estimated_cost: booking.price,
      worker: booking.worker,
      booking_id: booking.id,
      status: booking.status
    });
  } catch (error) {
    console.error("[DEMO_RUN_ERROR]", error.message);
    return res.status(500).json({ error: "Unable to complete demo run" });
  }
}

function listBookings(req, res) {
  return res.json({ bookings });
}

module.exports = {
  suggestService,
  listWorkers,
  trackWorker,
  demoFlow,
  createBooking,
  demoRun,
  listBookings
};
