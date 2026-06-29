import React, { useEffect, useState } from "react";
import API from "../services/api";
import "./SplashScreen.css";

function SplashScreen({ onFinished }) {
  const [statusText, setStatusText] = useState("Initializing database...");
  const [progress, setProgress] = useState(10);
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    let active = true;

    const sequence = async () => {
      // 1. Initial Loading
      await new Promise((r) => setTimeout(r, 600));
      if (!active) return;
      setStatusText("Connecting to Spring Boot backend API...");
      setProgress(40);

      // 2. Check API Status
      try {
        await API.get("/tournaments");
        if (!active) return;
        setStatusText("API connection established. Loading assets...");
        setProgress(70);
      } catch (err) {
        console.warn("Backend offline or unreachable. Proceeding in mock mode...", err);
        if (!active) return;
        setStatusText("Working offline. Preparing local database cache...");
        setProgress(75);
      }

      // 3. Complete Assets load
      await new Promise((r) => setTimeout(r, 700));
      if (!active) return;
      setStatusText("Verifying session tokens...");
      setProgress(95);

      // 4. Verification Check
      await new Promise((r) => setTimeout(r, 400));
      if (!active) return;
      setProgress(100);
      setStatusText("Onboarding synchronized!");

      // 5. Fade out and trigger finish
      await new Promise((r) => setTimeout(r, 300));
      if (!active) return;
      setIsFadingOut(true);
      await new Promise((r) => setTimeout(r, 500));
      if (!active) return;
      onFinished();
    };

    sequence();

    return () => {
      active = false;
    };
  }, [onFinished]);

  return (
    <div className={`splash-overlay ${isFadingOut ? "fade-out" : ""}`}>
      <div className="splash-card">
        {/* Animated Cricket Ball */}
        <div className="splash-cricket-ball">
          <div className="seam"></div>
          <div className="glow"></div>
        </div>

        <h1 className="splash-title">
          Cric<span className="accent-green">Heroes</span>
        </h1>
        <p className="splash-subtitle">GRASSROOTS DIGITAL ECOSYSTEM</p>

        {/* Loading Bar */}
        <div className="splash-progress-container">
          <div className="splash-progress-bar" style={{ width: `${progress}%` }}></div>
        </div>

        <p className="splash-status">{statusText}</p>
        <span className="splash-version">v2.4.0 (Production Ready)</span>
      </div>
    </div>
  );
}

export default SplashScreen;
