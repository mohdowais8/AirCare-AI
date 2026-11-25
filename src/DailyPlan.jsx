
import React, { useState } from "react";
import { apiUrl } from "./api.js";
import "./DailyPlan.css";

export default function DailyPlan({ aqi, pm25, loading, error, location, source, dataType }) {
  const [activity, setActivity] = useState("College and outdoor travel");
  const [plan, setPlan] = useState("");
  const [generating, setGenerating] = useState(false);
  const [planError, setPlanError] = useState("");

  async function generatePlan() {
    if (aqi == null) {
      setPlanError("AQI data is not available yet.");
      return;
    }

    setGenerating(true);
    setPlanError("");
    setPlan("");

    try {
      const response = await fetch(apiUrl("/api/plan"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ aqi, pm25, activity, location, source, dataType }),
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.error || "Request failed");

      setPlan(data.plan || "No plan generated.");
    } catch (err) {
      const message =
        err?.message && err.message !== "Failed to fetch"
          ? err.message
          : "Unable to generate your AI plan. Check your backend connection and retry.";
      setPlanError(message);
    } finally {
      setGenerating(false);
    }
  }

  const sections = plan
    ? plan
        .split(
          /(?=^#{0,3}\s*\d*\.?\s*(?:Air Quality Overview|Outdoor Activity|Workout Advice|Personal Protection|Indoor Air Tips|Today's Action Plan))/im
        )
        .map((section) => section.trim())
        .filter(Boolean)
    : [];

  const sectionIcons = ["🌍", "🏃", "🏋️", "🛡️", "🏠", "📋"];

  // AQI-based health risk analysis
  const risk = (() => {
    if (aqi == null)
      return {
        label: "Unavailable",
        color: "#94a3b8",
        message: "AQI data is unavailable.",
      };

    if (aqi <= 50)
      return {
        label: "Low Risk",
        color: "#34d399",
        message: "Air quality is generally satisfactory. Normal outdoor activities are usually suitable.",
      };

    if (aqi <= 100)
      return {
        label: "Moderate Risk",
        color: "#facc15",
        message: "Air quality is acceptable, but unusually sensitive people may experience effects.",
      };

    if (aqi <= 150)
      return {
        label: "Elevated Risk",
        color: "#fb923c",
        message: "Sensitive groups should reduce prolonged or intense outdoor activity.",
      };

    if (aqi <= 200)
      return {
        label: "High Risk",
        color: "#f87171",
        message: "Health effects may occur. Reduce outdoor exposure and consider protection.",
      };

    if (aqi <= 300)
      return {
        label: "Very High Risk",
        color: "#c084fc",
        message: "Health alert conditions. Limit outdoor activity and take precautions.",
      };

    return {
      label: "Severe Risk",
      color: "#f43f5e",
      message: "Severe air quality conditions. Avoid outdoor exposure as much as possible.",
    };
  })();

  return (
    <div className="daily-plan-container">
      <div className="daily-plan-header">
        <div className="daily-plan-title">
          <span className="daily-plan-badge">✦ AI POWERED</span>
          <h1>Daily Protection Plan</h1>
          <p>Your intelligent guide to breathing healthier every day.</p>
        </div>
      </div>

      {/* AQI CARDS */}
      <div className="daily-plan-aqi">
        <div className="daily-plan-aqi-card">
          <div className="aqi-card-top">
            <span>Air Quality Index</span>
            <span className="aqi-live-dot"></span>
          </div>

          <div className="aqi-big-number">
            {loading ? "..." : aqi ?? "--"}
          </div>

          <div className="aqi-card-bottom">Current AQI</div>
        </div>

        <div className="daily-plan-aqi-card pm-card">
          <div className="aqi-card-top">
            <span>Particulate Matter</span>
          </div>

          <div className="aqi-big-number">
            {loading ? "..." : pm25 ?? "--"}
          </div>

          <div className="aqi-card-bottom">PM2.5 μg/m³</div>
        </div>
      </div>

      {/* HEALTH RISK ANALYSIS */}
      <div className="health-risk-card">
        <div className="health-risk-top">
          <div>
            <span className="daily-plan-badge">HEALTH ANALYSIS</span>
            <h2>Air Health Risk</h2>
          </div>

          <div
            className="health-risk-indicator"
            style={{
              background: risk.color,
              boxShadow: `0 0 18px ${risk.color}`,
            }}
          />
        </div>

        <h3 style={{ color: risk.color }}>{risk.label}</h3>

        <p>{loading ? "Analyzing air quality..." : risk.message}</p>

        <div className="health-risk-scale">
          <div
            style={{
              width: `${Math.min(Math.max((aqi || 0) / 500, 0) * 100, 100)}%`,
              background: risk.color,
            }}
          />
        </div>

        <small>Risk indicator based on current AQI</small>
      </div>

      {/* AI PLAN GENERATOR */}
      <div className="daily-plan-generator">
        <div className="generator-heading">
          <div className="generator-icon">✦</div>

          <div>
            <h2>Personalize your day</h2>
            <p>Tell AI what you're planning today.</p>
          </div>
        </div>

        <input
          type="text"
          value={activity}
          onChange={(e) => setActivity(e.target.value)}
          placeholder="Enter your planned activities..."
        />

        <button
          className="generate-plan-button"
          onClick={generatePlan}
          disabled={generating || loading || aqi == null}
        >
          {generating ? "✦ AI is analyzing..." : "✦ Generate My AI Plan"}
        </button>

        {planError && <p className="daily-plan-error">{planError}</p>}
      </div>

      {/* LOADING */}
      {generating && (
        <div className="plan-loading">
          <div className="plan-loader"></div>

          <h3>AirCare AI is analyzing your environment</h3>

          <p>Creating recommendations for your day...</p>
        </div>
      )}

      {/* AI GENERATED PLAN */}
      {plan && !generating && (
        <div className="generated-plan-area">
          <div className="generated-plan-heading">
            <div>
              <span className="daily-plan-badge">AI ANALYSIS</span>
              <h2>Your personalized plan</h2>
            </div>
          </div>

          <div className="plan-section-grid">
            {sections.length > 0 ? (
              sections.map((section, index) => {
                const cleanSection = section.replace(/^#{0,3}\s*/, "");

                const headingMatch = cleanSection.match(
                  /^(\d*\.?\s*)?([^\n]+)/
                );

                const heading =
                  headingMatch?.[2]?.trim() || "Recommendation";

                const body = cleanSection
                  .replace(/^(\d*\.?\s*)?[^\n]+\n?/, "")
                  .trim();

                return (
                  <div className="plan-section-card" key={index}>
                    <div className="plan-section-icon">
                      {sectionIcons[index % sectionIcons.length]}
                    </div>

                    <h3>{heading}</h3>

                    <p>{body || cleanSection}</p>
                  </div>
                );
              })
            ) : (
              <div className="plan-section-card full-plan-card">
                <div className="plan-section-icon">🌿</div>

                <h3>AI Recommendations</h3>

                <p>{plan}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
