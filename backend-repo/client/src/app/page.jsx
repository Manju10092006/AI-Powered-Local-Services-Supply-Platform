"use client";

import { useEffect, useState } from "react";

const API_BASE_URL = "http://localhost:5000/ai";

export default function HomePage() {
  const [problem, setProblem] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [trackingLive, setTrackingLive] = useState(false);
  const [error, setError] = useState("");
  const [demoRunning, setDemoRunning] = useState(false);
  const sampleInputs = ["AC not cooling", "Water leaking pipe", "Gas leak in kitchen"];

  useEffect(() => {
    let intervalId;

    if (trackingLive && result?.worker?.name) {
      intervalId = setInterval(() => {
        fetchTracking(result.worker.name);
      }, 2000);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [trackingLive, result?.worker?.name]);

  function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async function fetchSuggestion(problemInput) {
    const inputToUse = (problemInput ?? problem).trim();
    if (!inputToUse) return;

    try {
      setLoading(true);
      setError("");
      setTrackingLive(false);
      setProblem(inputToUse);

      const response = await fetch(`${API_BASE_URL}/demo/flow`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ problem: inputToUse })
      });

      if (!response.ok) {
        throw new Error("Failed to fetch suggestion");
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function runDemo() {
    const demoProblems = ["AC not cooling", "fan not working", "gas leak in kitchen"];
    setDemoRunning(true);
    setTrackingLive(false);
    setError("");

    try {
      for (let i = 0; i < demoProblems.length; i += 1) {
        await fetchSuggestion(demoProblems[i]);
        if (i < demoProblems.length - 1) {
          await sleep(2000);
        }
      }
    } finally {
      setDemoRunning(false);
    }
  }

  async function fetchTracking(workerName) {
    try {
      const encodedName = encodeURIComponent(workerName);
      const response = await fetch(`${API_BASE_URL}/track/${encodedName}`);
      if (!response.ok) return;

      const trackingData = await response.json();
      setResult((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          tracking: {
            location: trackingData.location,
            status: trackingData.status,
            eta: trackingData.eta
          }
        };
      });
    } catch {
      // Ignore tracking errors to keep UI simple.
    }
  }

  function toggleLiveTracking() {
    if (!result?.worker?.name) return;
    setTrackingLive((prev) => !prev);
  }

  function getCategoryBadgeClass(category) {
    if (category === "AC Repair") return "bg-blue-100 text-blue-700";
    if (category === "Plumbing") return "bg-cyan-100 text-cyan-700";
    if (category === "Electrical") return "bg-purple-100 text-purple-700";
    return "bg-gray-100 text-gray-700";
  }

  function getUrgencyClass(urgency) {
    if (urgency === "HIGH") return "text-red-600";
    if (urgency === "MEDIUM") return "text-yellow-600";
    return "text-green-600";
  }

  const confidenceValue = Number(result?.confidence) || 0;
  const categoryLabel = Array.isArray(result?.categories)
    ? result.categories.join(", ")
    : result?.category || "General";
  const priceValue = result?.total_price ?? result?.estimated_price ?? 0;
  const locationText =
    result?.tracking?.location?.lat !== undefined && result?.tracking?.location?.lng !== undefined
      ? `${Number(result.tracking.location.lat).toFixed(6)}, ${Number(result.tracking.location.lng).toFixed(6)}`
      : "-";

  return (
    <main className="min-h-screen bg-gray-100 p-6">
      <div className="mx-auto max-w-2xl rounded-xl bg-white p-6 shadow-md">
        <h1 className="text-2xl font-bold text-gray-900">FixMate AI</h1>
        <p className="mt-1 text-sm text-gray-600">AI service suggestion + live worker tracking</p>

        <div className="mt-6 space-y-2">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
            Demo Mode (for quick showcase)
          </p>
          <div className="flex flex-wrap gap-2">
            {sampleInputs.map((sample) => (
              <button
                key={sample}
                onClick={() => fetchSuggestion(sample)}
                disabled={loading || demoRunning}
                className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {sample}
              </button>
            ))}
          </div>

          <label className="mb-2 block text-sm font-medium text-gray-700">Describe your problem</label>
          <input
            type="text"
            value={problem}
            onChange={(e) => setProblem(e.target.value)}
            placeholder="Try: AC not cooling, water leaking pipe, fan not working"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
          <button
            onClick={() => fetchSuggestion()}
            disabled={loading || demoRunning}
            className="mt-3 inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-white transition hover:bg-blue-700 hover:shadow disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? (
              <>
                <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Analyzing problem...
              </>
            ) : (
              "Get Suggestion"
            )}
          </button>
          <button
            onClick={runDemo}
            disabled={loading || demoRunning}
            className="ml-2 mt-3 inline-flex items-center rounded-lg bg-purple-600 px-4 py-2 text-white transition hover:bg-purple-700 hover:shadow disabled:cursor-not-allowed disabled:opacity-60"
          >
            {demoRunning ? "Running Demo..." : "Run Demo"}
          </button>
        </div>

        {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}

        {result ? (
          <div className="mt-6 rounded-xl border border-gray-200 p-5">
            <h2 className="text-lg font-semibold text-gray-900">Result</h2>

            <div className="mt-4 flex items-center justify-between">
              <span
                className={`inline-flex rounded-full px-3 py-1 text-sm font-medium ${getCategoryBadgeClass(result.category)}`}
              >
                {categoryLabel}
              </span>
              <p className="text-3xl font-extrabold text-gray-900">INR {priceValue}</p>
            </div>

            <div className="mt-4 space-y-1 text-sm">
              {Array.isArray(result?.workers) ? (
                <div>
                  <p><strong>Workers:</strong></p>
                  {result.workers.map((item) => (
                    <p key={`${item.category}-${item.name}`} className="ml-2">
                      {item.category}: {item.name} (Rating: {item.rating})
                    </p>
                  ))}
                </div>
              ) : (
                <p>
                  <strong>Worker:</strong> {result.worker?.name} (Rating: {result.worker?.rating})
                </p>
              )}
              <p>
                <strong>Urgency:</strong>{" "}
                <span className={`font-semibold ${getUrgencyClass(result.urgency)}`}>{result.urgency}</span>
              </p>
              <p>
                <strong>Confidence:</strong> {confidenceValue}%
              </p>
              <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
                <div
                  className="h-full rounded-full bg-blue-600 transition-all"
                  style={{ width: `${Math.max(0, Math.min(100, confidenceValue))}%` }}
                />
              </div>
              <p><strong>Explanation:</strong> {result.explanation}</p>
            </div>

            <div className="mt-4 rounded-lg bg-gray-50 p-3 text-sm">
              <div className="mb-1 flex items-center justify-between">
                <p className="font-medium">Tracking</p>
                {trackingLive ? (
                  <span className="inline-flex items-center text-xs font-semibold text-green-600">
                    <span className="mr-1 animate-pulse">●</span> Live
                  </span>
                ) : null}
              </div>
              <p>
                <strong>Location:</strong> {locationText}
              </p>
              <p>
                <strong>Status:</strong> <span className="font-semibold">{result.tracking?.status}</span>
              </p>
              <p><strong>ETA:</strong> {result.tracking?.eta}</p>
            </div>

            <button
              onClick={toggleLiveTracking}
              className="mt-4 rounded-lg bg-green-600 px-4 py-2 text-white transition hover:bg-green-700 hover:shadow"
            >
              {trackingLive ? "Stop Live Tracking" : "Track Live"}
            </button>
          </div>
        ) : null}
      </div>
    </main>
  );
}
