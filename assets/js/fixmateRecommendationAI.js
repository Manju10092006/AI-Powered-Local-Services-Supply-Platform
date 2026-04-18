/**
 * FixMate client-side recommendation helper — Puter.js (optional) + safe JSON parse.
 * Does not replace server pricing; sends structured llmHints to /api/ai/calculate-booking.
 */
(function () {
  const CACHE = new Map();
  const CACHE_TTL_MS = 90_000;
  const MAX_CACHE = 40;

  function cacheKey(text, cat) {
    return `${cat}|${String(text || "").trim().toLowerCase().slice(0, 400)}`;
  }

  function stripJsonFence(s) {
    let t = String(s || "").trim();
    t = t.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
    return t.trim();
  }

  function safeJsonExtractObject(text) {
    const cleaned = stripJsonFence(text);
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start === -1 || end === -1 || end <= start) return null;
    try {
      return JSON.parse(cleaned.slice(start, end + 1));
    } catch {
      return null;
    }
  }

  function ensurePuter() {
    return typeof puter !== "undefined" && puter && puter.ai && typeof puter.ai.chat === "function";
  }

  function loadPuterScript() {
    return new Promise((resolve, reject) => {
      if (ensurePuter()) {
        resolve();
        return;
      }
      const existing = document.querySelector('script[data-fm-puter="1"]');
      if (existing) {
        existing.addEventListener("load", () => resolve(), { once: true });
        existing.addEventListener("error", () => reject(new Error("Puter script failed")), { once: true });
        return;
      }
      const s = document.createElement("script");
      s.src = "https://js.puter.com/v2/";
      s.async = true;
      s.dataset.fmPuter = "1";
      s.onload = () => resolve();
      s.onerror = () => reject(new Error("Puter script blocked"));
      document.head.appendChild(s);
    });
  }

  function buildPrompt(problem, cartCategoryHint) {
    return `You are FixMate AI Assistant for India home services ONLY: plumbing, electrical, AC & appliances, cleaning, pest control, painting, carpentry, CCTV / smart home, general technician visits, booking options, and rough triage (NOT medical, legal, politics, jokes, code, cricket, or unrelated chat).

If the user message is NOT about home repair / maintenance / installation / cleaning, respond with ONLY this JSON:
{"outOfDomain":true,"message":"I'm FixMate AI Assistant. I help only with home repairs, services, worker recommendations, booking options, claims and pricing."}

Otherwise respond ONLY with valid JSON (no markdown) in this exact shape:
{
  "issueSummary": "one or two sentences",
  "category": "Plumber|Electrician|AC Repair|Appliance Repair|Carpenter|Cleaning|Pest Control|Painting|CCTV / Smart Home|General Technician",
  "urgency": "Low|Medium|High|Emergency",
  "urgencyScore": 1,
  "complexity": "Basic|Standard|Advanced|Expert Required",
  "recommendedMode": "instant|scheduled|flexible",
  "why": "short reason tied to safety / damage / comfort",
  "confidence": 0.0,
  "followUpQuestion": null,
  "workersRequired": 1
}

Rules: sparking/smoke/gas smell/flooding => Emergency. Ceiling drip when upstairs appliance runs => High plumbing, Advanced, instant or scheduled ok, workersRequired 1-2.

Customer text:
"""${String(problem || "").replace(/"/g, "'").slice(0, 1200)}"""

Cart / catalogue category hint (slug or label): ${String(cartCategoryHint || "cleaning").slice(0, 80)}`;
  }

  /**
   * @returns {Promise<object|null>} llmHints object for API, or null to skip
   */
  async function analyzeComplaintWithPuter(problem, cartCategoryHint) {
    const p = String(problem || "").trim();
    if (p.length < 6) return null;

    const ck = cacheKey(p, cartCategoryHint);
    const hit = CACHE.get(ck);
    if (hit && Date.now() - hit.t < CACHE_TTL_MS) return hit.v;

    try {
      await loadPuterScript();
    } catch {
      return null;
    }
    if (!ensurePuter()) return null;

    try {
      const raw = await puter.ai.chat(buildPrompt(p, cartCategoryHint), {
        model: "gpt-5-nano",
        temperature: 0.25
      });
      let text = "";
      if (typeof raw === "string") text = raw;
      else if (raw && typeof raw.text === "string") text = raw.text;
      else if (raw && typeof raw.message === "string") text = raw.message;
      else text = JSON.stringify(raw || "");
      const obj = safeJsonExtractObject(text);
      if (!obj || typeof obj !== "object") return null;
      if (obj.outOfDomain === true) {
        const v = {
          outOfDomain: true,
          message:
            obj.message ||
            "I'm FixMate AI Assistant. I help only with home repairs, services, worker recommendations, booking options, claims and pricing."
        };
        CACHE.set(ck, { t: Date.now(), v });
        return v;
      }
      const v = {
        issueSummary: obj.issueSummary,
        category: obj.category,
        urgency: obj.urgency,
        urgencyScore: Number(obj.urgencyScore),
        complexity: obj.complexity,
        recommendedMode: obj.recommendedMode,
        why: obj.why,
        confidence: Number(obj.confidence),
        followUpQuestion: obj.followUpQuestion == null ? null : String(obj.followUpQuestion),
        workersRequired: Number(obj.workersRequired)
      };
      if (CACHE.size > MAX_CACHE) CACHE.clear();
      CACHE.set(ck, { t: Date.now(), v });
      return v;
    } catch (e) {
      console.warn("[FixmatePuter]", e && e.message);
      return null;
    }
  }

  window.FixmateRecommendationAI = {
    analyzeComplaintWithPuter,
    safeJsonExtractObject,
    loadPuterScript
  };
})();
