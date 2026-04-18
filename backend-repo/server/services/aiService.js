const axios = require("axios");

const HUGGING_FACE_URL =
  "https://api-inference.huggingface.co/models/google/flan-t5-base";

function classifyByKeywords(problemText) {
  const text = problemText.toLowerCase();

  if (text.includes("ac") || text.includes("air conditioner") || text.includes("cooling")) {
    return "AC Repair";
  }
  if (text.includes("pipe") || text.includes("leak") || text.includes("tap") || text.includes("drain")) {
    return "Plumbing";
  }
  if (text.includes("switch") || text.includes("wiring") || text.includes("light") || text.includes("electric")) {
    return "Electrical";
  }

  return "General";
}

function classifyMultipleByKeywords(problemText) {
  const text = problemText.toLowerCase();
  const categories = [];

  if (text.includes("ac") || text.includes("air conditioner") || text.includes("cooling")) {
    categories.push("AC Repair");
  }
  if (text.includes("pipe") || text.includes("leak") || text.includes("tap") || text.includes("drain")) {
    categories.push("Plumbing");
  }
  if (text.includes("switch") || text.includes("wiring") || text.includes("light") || text.includes("electric") || text.includes("fan")) {
    categories.push("Electrical");
  }

  return categories.length ? [...new Set(categories)] : ["General"];
}

function safeParseAiJson(rawText) {
  try {
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;

    const parsed = JSON.parse(jsonMatch[0]);
    if (!parsed || typeof parsed !== "object") return null;

    const category = typeof parsed.category === "string" ? parsed.category.trim() : "";
    const price = Number(parsed.price);

    if (!category) return null;
    if (!Number.isFinite(price) || price <= 0) {
      return { category, price: null };
    }

    return { category, price: Math.round(price) };
  } catch (error) {
    return null;
  }
}

function safeParseAiMultiJson(rawText) {
  try {
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;

    const parsed = JSON.parse(jsonMatch[0]);
    if (!parsed || typeof parsed !== "object") return null;

    const categories = Array.isArray(parsed.categories)
      ? parsed.categories.filter((item) => typeof item === "string").map((item) => item.trim()).filter(Boolean)
      : [];

    if (!categories.length) return null;

    return { categories: [...new Set(categories)] };
  } catch (error) {
    return null;
  }
}

async function getAiSuggestion(problem) {
  const fallbackCategories = classifyMultipleByKeywords(problem);
  const token = process.env.HUGGING_FACE_API_KEY;

  if (!token) {
    return {
      categories: fallbackCategories,
      price: null,
      source: "fallback_no_api_key"
    };
  }

  const prompt = `
Strictly return ONLY JSON. If you add anything else, the answer is wrong.

{
  "categories": ["AC Repair", "Plumbing", "Electrical", "General"]
}

Problem: "${problem}"
`.trim();

  try {
    const response = await axios.post(
      HUGGING_FACE_URL,
      { inputs: prompt },
      {
        headers: {
          Authorization: `Bearer ${token}`
        },
        timeout: 15000
      }
    );

    const outputText = Array.isArray(response.data)
      ? response.data[0]?.generated_text || ""
      : "";

    const parsed = safeParseAiMultiJson(outputText);
    if (!parsed) {
      return {
        categories: fallbackCategories,
        price: null,
        source: "fallback_parse_failed"
      };
    }

    return {
      categories: parsed.categories,
      price: null,
      source: "ai"
    };
  } catch (error) {
    return {
      categories: fallbackCategories,
      price: null,
      source: "fallback_api_error"
    };
  }
}

module.exports = {
  getAiSuggestion,
  classifyByKeywords,
  classifyMultipleByKeywords
};
