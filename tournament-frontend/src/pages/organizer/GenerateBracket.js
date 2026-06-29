import React, { useEffect, useState } from "react";
import { FaBolt, FaProjectDiagram, FaTrophy } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import API from "../../services/api";
import Layout from "../../components/Layout";
import "./GenerateBracket.css";

function GenerateBracket() {
  const [tournaments, setTournaments] = useState([]);
  const [tournamentId, setTournamentId] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchTournaments();
  }, []);

  const fetchTournaments = async () => {
    try {
      const res = await API.get("/tournaments");
      setTournaments(res.data);
    } catch (err) {
      console.error(err);
      setError("Failed to load tournaments.");
    }
  };

  const handleGeneratePlayoffs = async () => {
    setMessage("");
    setError("");

    if (!tournamentId) {
      setError("Please select a tournament.");
      return;
    }

    try {
      setLoading(true);
      const res = await API.post(`/matches/generate-playoffs/${tournamentId}`);
      setMessage(`Playoffs generated successfully. ${res.data.length} matches created.`);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to generate playoffs.");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateLeague = async () => {
    setMessage("");
    setError("");

    if (!tournamentId) {
      setError("Please select a tournament.");
      return;
    }

    try {
      setLoading(true);
      const res = await API.post(`/matches/auto-schedule/${tournamentId}`);
      setMessage(`League matches generated successfully. ${res.data.length} matches created.`);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to generate league matches.");
    } finally {
      setLoading(false);
    }
  };

  const goToBracket = () => {
    if (!tournamentId) {
      setError("Please select a tournament first.");
      return;
    }
    navigate(`/bracket-view/${tournamentId}`);
  };

  return (
    <Layout
      title="Generate Schedule"
      subtitle="Create league matches or playoffs automatically."
    >
      <div className="ops-page">
        <div className="ops-hero">
          <div className="ops-hero-left">
            <div className="ops-badge">
              <FaProjectDiagram />
            </div>
            <div>
              <span className="section-label">Schedule engine</span>
              <h2>Tournament Scheduler</h2>
              <p>Select a tournament to automatically generate league matches or a playoffs bracket.</p>
            </div>
          </div>

          <div className="ops-stat">
            <strong>{tournaments.length}</strong>
            <span>Tournaments</span>
          </div>
        </div>

        <div className="ops-card">
          <div className="ops-card-header">
            <h3>Generate Schedule</h3>
            <p>The system pairs registered teams into league matches or IPL-style playoffs.</p>
          </div>

          <div className="ops-form">
            <label>
              Select Tournament
              <div className="ops-input">
                <FaTrophy />
                <select value={tournamentId} onChange={(e) => setTournamentId(e.target.value)}>
                  <option value="">Select Tournament</option>
                  {tournaments.map((tournament) => (
                    <option key={tournament.id} value={tournament.id}>
                      {tournament.name}
                    </option>
                  ))}
                </select>
              </div>
            </label>

            <div className="ops-actions" style={{ gap: "10px", flexWrap: "wrap" }}>
              <button className="ops-primary" onClick={handleGeneratePlayoffs} disabled={loading}>
                {loading ? "Generating..." : (
                  <>
                    <FaBolt />{" "}
                    {(() => {
                      const selectedTourn = tournaments.find(t => t.id.toString() === tournamentId);
                      if (!selectedTourn) return "Generate Playoffs";
                      const game = selectedTourn.game?.toLowerCase() || "";
                      if (game.includes("cricket")) {
                        return "Generate Playoffs (IPL Format)";
                      } else if (game.includes("bgmi") || game.includes("pubg") || game.includes("freefire") || game.includes("free fire") || game.includes("battle")) {
                        return "Generate Lobby Matches (3 Lobbies)";
                      }
                      return "Generate Playoff Bracket (SF & Final)";
                    })()}
                  </>
                )}
              </button>
              <button className="ops-primary" onClick={handleGenerateLeague} disabled={loading} style={{ background: "linear-gradient(135deg, #10b981, #047857)", boxShadow: "0 4px 12px rgba(16, 185, 129, 0.25)" }}>
                {loading ? "Generating..." : <><FaBolt /> Generate League Matches</>}
              </button>
              <button className="ops-secondary" onClick={goToBracket}>
                View Bracket
              </button>
            </div>
          </div>

          {message && <div className="ops-success">{message}</div>}
          {error && <div className="ops-error">{error}</div>}

          <div className="ops-note">
            <h4>Rules</h4>
            <ul>
              <li><strong>Playoffs (Cricket):</strong> Generates IPL-style Qualifier 1, Eliminator, Qualifier 2, and Final (requires min 4 teams).</li>
              <li><strong>Playoffs (Battle Royale):</strong> Generates 3 Lobby Matches for all participating teams.</li>
              <li><strong>Playoffs (Other Sports):</strong> Generates single-elimination Semi-Finals (1st vs 4th, 2nd vs 3rd) and a Final (requires min 4 teams).</li>
              <li><strong>League Matches:</strong> Generates a full round-robin schedule for all registered teams.</li>
              <li>Only generate a schedule once to avoid duplicate matches.</li>
            </ul>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default GenerateBracket;
