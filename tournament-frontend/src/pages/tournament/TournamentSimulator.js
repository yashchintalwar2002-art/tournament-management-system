import React, { useState, useEffect, useRef } from "react";
import { FaPlay, FaBrain, FaChartBar, FaSyncAlt, FaAward, FaSlidersH } from "react-icons/fa";
import API from "../../services/api";
import Layout from "../../components/Layout";
import "./TournamentSimulator.css";

function TournamentSimulator() {
  const [tournaments, setTournaments] = useState([]);
  const [selectedTournamentId, setSelectedTournamentId] = useState("");
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(false);
  const [simulationState, setSimulationState] = useState("idle"); // idle, loading, completed
  const [simMessage, setSimMessage] = useState("");
  const [champion, setChampion] = useState(null);
  
  // Advanced Simulation Config sliders
  const [factorCaptain, setFactorCaptain] = useState(70);
  const [factorForm, setFactorForm] = useState(60);
  const [factorLuck, setFactorLuck] = useState(30);

  // Radar comparison states
  const [selectedTeamA, setSelectedTeamA] = useState(null);
  const [selectedTeamB, setSelectedTeamB] = useState(null);

  const canvasRef = useRef(null);

  useEffect(() => {
    fetchTournaments();
  }, []);

  useEffect(() => {
    if (selectedTournamentId) {
      fetchTeams(selectedTournamentId);
    } else {
      setTeams([]);
      setSelectedTeamA(null);
      setSelectedTeamB(null);
      setChampion(null);
      setSimulationState("idle");
    }
  }, [selectedTournamentId]);

  useEffect(() => {
    if (teams.length >= 2) {
      setSelectedTeamA(teams[0]);
      setSelectedTeamB(teams[1]);
    }
  }, [teams]);

  useEffect(() => {
    drawRadarChart();
  }, [selectedTeamA, selectedTeamB]);

  const fetchTournaments = async () => {
    try {
      const res = await API.get("/tournaments");
      setTournaments(res.data);
    } catch (err) {
      console.error("Failed to fetch tournaments:", err);
    }
  };

  const fetchTeams = async (id) => {
    try {
      const res = await API.get(`/teams/tournament/${id}`);
      setTeams(res.data);
      setChampion(null);
      setSimulationState("idle");
    } catch (err) {
      console.error("Failed to fetch teams:", err);
    }
  };

  const drawRadarChart = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const cx = canvas.width / 2;
    const cy = canvas.height / 2 + 10;
    const r = Math.min(canvas.width, canvas.height) / 2.6;

    const labels = ["Batting", "Bowling", "Captaincy", "Consistency", "Synergy"];
    const numPoints = labels.length;

    // Helper to generate mock stats based on team name length/seed
    const getStats = (team) => {
      if (!team) return [50, 50, 50, 50, 50];
      const seed = team.teamName.length;
      return [
        60 + (seed * 3) % 35, // Batting
        55 + (seed * 7) % 40, // Bowling
        65 + (seed * 11) % 30, // Captaincy
        50 + (seed * 13) % 45, // Consistency
        70 + (seed * 5) % 25, // Synergy
      ];
    };

    const statsA = getStats(selectedTeamA);
    const statsB = getStats(selectedTeamB);

    // 1. Draw web grid circles/pentagons
    ctx.strokeStyle = "rgba(99, 102, 241, 0.15)";
    ctx.lineWidth = 1;
    for (let j = 1; j <= 4; j++) {
      const scale = j / 4;
      ctx.beginPath();
      for (let i = 0; i < numPoints; i++) {
        const angle = (i * 2 * Math.PI) / numPoints - Math.PI / 2;
        const x = cx + r * scale * Math.cos(angle);
        const y = cy + r * scale * Math.sin(angle);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.stroke();
    }

    // 2. Draw axis lines
    ctx.beginPath();
    for (let i = 0; i < numPoints; i++) {
      const angle = (i * 2 * Math.PI) / numPoints - Math.PI / 2;
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + r * Math.cos(angle), cy + r * Math.sin(angle));
    }
    ctx.stroke();

    // 3. Draw Labels
    ctx.fillStyle = "#94a3b8";
    ctx.font = "bold 11px 'Outfit', sans-serif";
    ctx.textAlign = "center";
    for (let i = 0; i < numPoints; i++) {
      const angle = (i * 2 * Math.PI) / numPoints - Math.PI / 2;
      const x = cx + (r + 20) * Math.cos(angle);
      const y = cy + (r + 14) * Math.sin(angle) + 4;
      ctx.fillText(labels[i], x, y);
    }

    // Helper to draw radar region
    const drawRegion = (stats, strokeColor, fillColor) => {
      ctx.beginPath();
      for (let i = 0; i < numPoints; i++) {
        const angle = (i * 2 * Math.PI) / numPoints - Math.PI / 2;
        const scale = stats[i] / 100;
        const x = cx + r * scale * Math.cos(angle);
        const y = cy + r * scale * Math.sin(angle);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.fillStyle = fillColor;
      ctx.fill();
    };

    // Draw Team A (Neon Indigo)
    if (selectedTeamA) {
      drawRegion(statsA, "#818cf8", "rgba(129, 140, 248, 0.2)");
    }

    // Draw Team B (Neon Cyan)
    if (selectedTeamB) {
      drawRegion(statsB, "#22d3ee", "rgba(34, 211, 238, 0.2)");
    }
  };

  const handleSimulate = () => {
    if (teams.length < 2) {
      alert("At least 2 teams are required to simulate a tournament.");
      return;
    }

    setSimulationState("loading");
    setSimMessage("Initializing AI Simulator Engine...");

    const messages = [
      "Analyzing rosters & batsman career logs...",
      "Evaluating captaincy records & form factors...",
      "Simulating match fixtures (Quarterfinals)...",
      "Running Monte Carlo probability runs (Semifinals)...",
      "Processing finals championship outcome...",
      "AI Calculation completed!"
    ];

    let currentMsgIdx = 0;
    const interval = setInterval(() => {
      if (currentMsgIdx < messages.length) {
        setSimMessage(messages[currentMsgIdx]);
        currentMsgIdx++;
      } else {
        clearInterval(interval);
        
        // Probabilistic Winner Selector using captain name length, team name, and sliders
        const scores = teams.map(team => {
          const baseSeed = team.teamName.length * 5 + (team.captainName || "").length * 3;
          const configModifier = (factorCaptain / 10) * 1.5 + (factorForm / 10) * 1.2;
          const randomFactor = Math.random() * factorLuck;
          return { team, totalScore: baseSeed + configModifier + randomFactor };
        });

        // Sort descending by score
        scores.sort((a, b) => b.totalScore - a.totalScore);
        
        setChampion(scores[0].team);
        setSimulationState("completed");
      }
    }, 600);
  };

  return (
    <Layout
      title="AI Match Simulator"
      subtitle="Run predictive match analytics and simulate outcomes using neural parameters."
    >
      <div className="ts-layout">
        
        {/* Left Side: Simulation Board */}
        <div className="ts-main-card">
          <div className="ts-card-header">
            <FaBrain className="ts-icon-brain" />
            <h3>Neural Simulation Engine</h3>
          </div>

          <div className="ts-form-group">
            <label className="ts-label">Select Tournament</label>
            <div className="ops-input">
              <select
                value={selectedTournamentId}
                onChange={(e) => setSelectedTournamentId(e.target.value)}
              >
                <option value="">Select Tournament to Simulate</option>
                {tournaments.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
          </div>

          {selectedTournamentId && (
            <div className="ts-details">
              <p>Registered Teams: <strong>{teams.length}</strong></p>

              {/* Sliders Panel */}
              <div className="ts-sliders-card">
                <div className="ts-slider-title">
                  <FaSlidersH />
                  <span>Neural Weight Factors</span>
                </div>

                <div className="ts-slider-box">
                  <div className="ts-slider-header">
                    <span>Captain Influence</span>
                    <span>{factorCaptain}%</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    value={factorCaptain}
                    onChange={(e) => setFactorCaptain(Number(e.target.value))}
                    className="ts-slider-input"
                  />
                </div>

                <div className="ts-slider-box">
                  <div className="ts-slider-header">
                    <span>Recent Form Weight</span>
                    <span>{factorForm}%</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    value={factorForm}
                    onChange={(e) => setFactorForm(Number(e.target.value))}
                    className="ts-slider-input"
                  />
                </div>

                <div className="ts-slider-box">
                  <div className="ts-slider-header">
                    <span>Luck Factor / Variance</span>
                    <span>{factorLuck}%</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="80"
                    value={factorLuck}
                    onChange={(e) => setFactorLuck(Number(e.target.value))}
                    className="ts-slider-input"
                  />
                </div>
              </div>

              {simulationState === "idle" && (
                <button onClick={handleSimulate} className="ops-primary ts-btn-run">
                  <FaPlay /> Run Simulator
                </button>
              )}

              {simulationState === "loading" && (
                <div className="ts-loading-box">
                  <div className="ts-spinner-pulse"></div>
                  <span className="ts-loading-text">{simMessage}</span>
                </div>
              )}

              {simulationState === "completed" && champion && (
                <div className="ts-winner-box animate-fade-in-up">
                  <div className="ts-winner-crown"><FaAward /></div>
                  <h4>Predicted Champion</h4>
                  <h3>{champion.teamName}</h3>
                  <p>Captain: {champion.captainName || "N/A"}</p>
                  <button onClick={() => setSimulationState("idle")} className="ts-btn-re-run">
                    <FaSyncAlt /> Simulate Again
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Side: Analytics & Head to Head Radar */}
        <div className="ts-analytics-card">
          <div className="ts-card-header">
            <FaChartBar className="ts-icon-chart" />
            <h3>Head-to-Head Visualizer</h3>
          </div>

          {teams.length >= 2 ? (
            <div className="ts-radar-container">
              <div className="ts-radar-selectors">
                <div className="ops-input ts-select-half">
                  <select
                    value={selectedTeamA ? selectedTeamA.id : ""}
                    onChange={(e) => setSelectedTeamA(teams.find(t => t.id === Number(e.target.value)))}
                  >
                    {teams.map(t => (
                      <option key={t.id} value={t.id}>{t.teamName}</option>
                    ))}
                  </select>
                </div>

                <span className="ts-vs-badge">VS</span>

                <div className="ops-input ts-select-half">
                  <select
                    value={selectedTeamB ? selectedTeamB.id : ""}
                    onChange={(e) => setSelectedTeamB(teams.find(t => t.id === Number(e.target.value)))}
                  >
                    {teams.map(t => (
                      <option key={t.id} value={t.id}>{t.teamName}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="ts-radar-canvas-box">
                <canvas ref={canvasRef} width={280} height={280} />
              </div>

              <div className="ts-radar-legend">
                <div className="ts-legend-item">
                  <span className="ts-legend-dot team-a"></span>
                  <span>{selectedTeamA ? selectedTeamA.teamName : "Team A"}</span>
                </div>
                <div className="ts-legend-item">
                  <span className="ts-legend-dot team-b"></span>
                  <span>{selectedTeamB ? selectedTeamB.teamName : "Team B"}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="ts-empty-state">
              <p>Please select a tournament with at least 2 registered teams to view matchup data.</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

export default TournamentSimulator;
