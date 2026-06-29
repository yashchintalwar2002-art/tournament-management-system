import React, { useEffect, useState } from "react";
import { FaFlagCheckered, FaTrophy } from "react-icons/fa";
import API from "../../services/api";
import Layout from "../../components/Layout";
import "./UpdateMatchResult.css";

function UpdateMatchResult() {
  const [tournaments, setTournaments] = useState([]);
  const [tournamentId, setTournamentId] = useState("");
  const [matches, setMatches] = useState([]);
  const [scores, setScores] = useState({});
  const [statuses, setStatuses] = useState({});
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetchTournaments();
  }, []);

  useEffect(() => {
    if (tournamentId) {
      fetchMatches(tournamentId);
    } else {
      setMatches([]);
    }
  }, [tournamentId]);

  const fetchTournaments = async () => {
    try {
      const res = await API.get("/tournaments");
      setTournaments(res.data);
    } catch (err) {
      console.error(err);
      setError("Failed to load tournaments.");
    }
  };

  const fetchMatches = async (id) => {
    try {
      const res = await API.get(`/matches/tournament/${id}`);
      setMatches(res.data);
    } catch (err) {
      console.error(err);
      setError("Failed to load matches.");
    }
  };

  const handleScoreChange = (matchId, field, value) => {
    setScores((prev) => ({ ...prev, [matchId]: { ...prev[matchId], [field]: value } }));
  };

  const handleStatusChange = (matchId, value) => {
    setStatuses((prev) => ({ ...prev, [matchId]: value }));
  };

  const handleUpdateResult = async (matchId) => {
    setMessage("");
    setError("");

    const scoreA = scores[matchId]?.scoreA;
    const scoreB = scores[matchId]?.scoreB;

    if (scoreA === undefined || scoreB === undefined || scoreA === "" || scoreB === "") {
      setError("Please enter both scores.");
      return;
    }

    try {
      await API.put(`/matches/update-result/${matchId}?scoreA=${scoreA}&scoreB=${scoreB}`);
      setMessage("Match result updated successfully.");
      fetchMatches(tournamentId);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to update result.");
    }
  };

  const handleUpdateStatus = async (matchId) => {
    setMessage("");
    setError("");

    const status = statuses[matchId];
    if (!status) {
      setError("Please select status.");
      return;
    }

    try {
      await API.put(`/matches/update-status/${matchId}?status=${status}`);
      setMessage(`Match status updated to ${status}.`);
      fetchMatches(tournamentId);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to update status.");
    }
  };

  return (
    <Layout title="Update Match Result" subtitle="Update scores, winners, and live status.">
      <div className="ops-page">
        <div className="ops-hero">
          <div className="ops-hero-left">
            <div className="ops-badge">
              <FaFlagCheckered />
            </div>
            <div>
              <span className="section-label">Results desk</span>
              <h2>Result & Live Status Management</h2>
              <p>Select a tournament and manage each match result.</p>
            </div>
          </div>

          <div className="ops-stat">
            <strong>{matches.length}</strong>
            <span>Matches</span>
          </div>
        </div>

        <div className="ops-card">
          <div className="ops-form compact-form">
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
          </div>

          {message && <div className="ops-success">{message}</div>}
          {error && <div className="ops-error">{error}</div>}

          <div className="result-list">
            {matches.length > 0 ? (
              matches.map((match) => (
                <div className="result-card" key={match.id}>
                  <div className="result-top">
                    <div>
                      <h3>{match.teamA || "Team A"} vs {match.teamB || "Team B"}</h3>
                      <p>Round: {match.round || "N/A"} | Status: {match.status || "UPCOMING"}</p>
                    </div>
                    <span>Winner: {match.winner || "Pending"}</span>
                  </div>

                  <div className="result-controls">
                    <label>
                      {match.teamA || "Team A"} Score
                      <input
                        type="number"
                        value={scores[match.id]?.scoreA || ""}
                        onChange={(e) => handleScoreChange(match.id, "scoreA", e.target.value)}
                      />
                    </label>
                    <label>
                      {match.teamB || "Team B"} Score
                      <input
                        type="number"
                        value={scores[match.id]?.scoreB || ""}
                        onChange={(e) => handleScoreChange(match.id, "scoreB", e.target.value)}
                      />
                    </label>
                    <label>
                      Match Status
                      <select
                        value={statuses[match.id] || ""}
                        onChange={(e) => handleStatusChange(match.id, e.target.value)}
                      >
                        <option value="">Select Status</option>
                        <option value="UPCOMING">UPCOMING</option>
                        <option value="LIVE">LIVE</option>
                        <option value="COMPLETED">COMPLETED</option>
                      </select>
                    </label>
                  </div>

                  <div className="ops-actions">
                    <button className="ops-primary" onClick={() => handleUpdateResult(match.id)}>
                      Update Result
                    </button>
                    <button className="ops-secondary" onClick={() => handleUpdateStatus(match.id)}>
                      Update Status
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="ops-empty">No matches found. Generate bracket first.</div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default UpdateMatchResult;
