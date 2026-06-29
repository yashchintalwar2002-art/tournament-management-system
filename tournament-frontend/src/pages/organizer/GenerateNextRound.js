import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaFlagCheckered, FaForward, FaTrophy } from "react-icons/fa";
import API from "../../services/api";
import Layout from "../../components/Layout";
import "./GenerateNextRound.css";

function GenerateNextRound() {
  const [tournaments, setTournaments] = useState([]);
  const [tournamentId, setTournamentId] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loadingSemi, setLoadingSemi] = useState(false);
  const [loadingFinal, setLoadingFinal] = useState(false);
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

  const generateSemiFinal = async () => {
    setMessage("");
    setError("");

    if (!tournamentId) {
      setError("Please select a tournament.");
      return;
    }

    try {
      setLoadingSemi(true);
      const res = await API.post(`/matches/generate-semi-final/${tournamentId}`);
      setMessage(`Semi final generated successfully. ${res.data.length} matches created.`);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to generate semi final.");
    } finally {
      setLoadingSemi(false);
    }
  };

  const generateFinal = async () => {
    setMessage("");
    setError("");

    if (!tournamentId) {
      setError("Please select a tournament.");
      return;
    }

    try {
      setLoadingFinal(true);
      await API.post(`/matches/generate-final/${tournamentId}`);
      setMessage("Final generated successfully.");
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to generate final.");
    } finally {
      setLoadingFinal(false);
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
      title="Generate Next Round"
      subtitle="Progress the tournament from quarter finals to semi finals and final."
    >
      <div className="ops-page">
        <div className="ops-hero">
          <div className="ops-hero-left">
            <div className="ops-badge">
              <FaForward />
            </div>
            <div>
              <span className="section-label">Round progression</span>
              <h2>Generate Semi Final & Final</h2>
              <p>Generate the next round after winners are updated from the previous round.</p>
            </div>
          </div>
        </div>

        <div className="ops-card">
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

            <div className="ops-actions">
              <button className="ops-primary" onClick={generateSemiFinal} disabled={loadingSemi}>
                {loadingSemi ? "Generating..." : "Generate Semi Final"}
              </button>
              <button className="ops-primary" onClick={generateFinal} disabled={loadingFinal}>
                {loadingFinal ? "Generating..." : "Generate Final"}
              </button>
              <button className="ops-secondary" onClick={goToBracket}>
                <FaFlagCheckered /> View Bracket
              </button>
            </div>
          </div>

          {message && <div className="ops-success">{message}</div>}
          {error && <div className="ops-error">{error}</div>}

          <div className="ops-note">
            <h4>Rules</h4>
            <ul>
              <li>Generate semi finals only after all quarter-final winners are updated.</li>
              <li>Generate the final only after all semi-final winners are updated.</li>
              <li>Each round should be generated only once.</li>
            </ul>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default GenerateNextRound;
