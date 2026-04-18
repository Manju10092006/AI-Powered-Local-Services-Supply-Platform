const axios = require("axios");

const API_URL = "http://localhost:5000/ai/suggest";
const testInputs = [
  "AC not cooling",
  "water leaking from pipe",
  "fan not working",
  "gas leak in kitchen",
  "asdfghjkl"
];

const validUrgency = ["HIGH", "MEDIUM", "LOW"];
const validSource = ["AI", "Fallback"];

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function validateResponse(data) {
  const hasCategory = typeof data.category === "string" && data.category.trim().length > 0;
  const hasEstimatedPrice = typeof data.estimated_price === "number" && Number.isFinite(data.estimated_price);
  const hasWorker = data.worker && typeof data.worker === "object";
  const hasValidUrgency = validUrgency.includes(data.urgency);
  const hasValidSource = validSource.includes(data.source);

  return hasCategory && hasEstimatedPrice && hasWorker && hasValidUrgency && hasValidSource;
}

async function runTests() {
  console.log("Starting FixMate AI API tests...\n");

  for (const input of testInputs) {
    try {
      const response = await axios.post(API_URL, { problem: input });
      const data = response.data;

      console.log(`Input: "${input}"`);
      console.log("Full response:", data);
      console.log("category:", data.category);
      console.log("estimated_price:", data.estimated_price);
      console.log("urgency:", data.urgency);
      console.log("source:", data.source);

      if (!validateResponse(data)) {
        console.log(`❌ Test Failed for: ${input}\n`);
      } else {
        console.log("✅ Test Passed\n");
      }
    } catch (error) {
      console.log(`Input: "${input}"`);
      if (error.response) {
        console.log(
          `❌ Request Error: status=${error.response.status}, data=${JSON.stringify(error.response.data)}\n`
        );
      } else {
        console.log(`❌ Request Error: ${error.message}\n`);
      }
    }

    await sleep(1000);
  }

  console.log("All tests completed");
}

runTests();
