import React, { useEffect, useState } from "react";
import { FaCalendarAlt, FaFlagCheckered, FaTrophy, FaUsers } from "react-icons/fa";
import API from "../../services/api";
import Layout from "../../components/Layout";
import "./MatchScheduler.css";

function MatchScheduler() {
  const [tournaments, setTournaments] = useState([]);
  const [form, setForm] = useState({
    tournamentId: "",
    teamA: "",
    teamB: "",
    matchDate: "",
    status: "UPCOMING",
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    try {
      setLoading(true);
      await API.post("/matches", {
        teamA: form.teamA,
        teamB: form.teamB,
        matchDate: form.matchDate,
        status: form.status,
        tournament: { id: Number(form.tournamentId) },
      });

      setMessage("Match scheduled successfully.");
      setForm({
        tournamentId: "",
        teamA: "",
        teamB: "",
        matchDate: "",
        status: "UPCOMING",
      });
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to schedule match.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout title="Match Scheduler" subtitle="Create fixtures for tournament operations.">
      <div className="ops-page">
        <div className="ops-hero">
          <div className="ops-hero-left">
            <div className="ops-badge">
              <FaCalendarAlt />
            </div>
            <div>
              <span className="section-label">Fixture setup</span>
              <h2>Schedule Tournament Matches</h2>
              <p>Select a tournament, set teams, choose a date, and publish the fixture.</p>
            </div>
          </div>

          <div className="ops-stat">
            <strong>{tournaments.length}</strong>
            <span>Tournaments</span>
          </div>
        </div>

        <div className="ops-grid">
          <div className="ops-card">
            <div className="ops-card-header">
              <h3>Create Match</h3>
              <p>Fill in the form below to schedule a match.</p>
            </div>

            <form onSubmit={handleSubmit} className="ops-form">
              <label>
                Tournament
                <div className="ops-input">
                  <FaTrophy />
                  <select name="tournamentId" value={form.tournamentId} onChange={handleChange} required>
                    <option value="">Select Tournament</option>
                    {tournaments.map((tournament) => (
                      <option key={tournament.id} value={tournament.id}>
                        {tournament.name}
                      </option>
                    ))}
                  </select>
                </div>
              </label>

              <label>
                Team A
                <div className="ops-input">
                  <FaUsers />
                  <input name="teamA" value={form.teamA} onChange={handleChange} placeholder="Enter Team A" required />
                </div>
              </label>

              <label>
                Team B
                <div className="ops-input">
                  <FaUsers />
                  <input name="teamB" value={form.teamB} onChange={handleChange} placeholder="Enter Team B" required />
                </div>
              </label>

              <label>
                Match Date & Time
                <div className="ops-input">
                  <FaCalendarAlt />
                  <input type="datetime-local" name="matchDate" value={form.matchDate} onChange={handleChange} required />
                </div>
              </label>

              <label>
                Status
                <div className="ops-input">
                  <FaFlagCheckered />
                  <select name="status" value={form.status} onChange={handleChange} required>
                    <option value="UPCOMING">UPCOMING</option>
                    <option value="LIVE">LIVE</option>
                    <option value="COMPLETED">COMPLETED</option>
                  </select>
                </div>
              </label>

              <button type="submit" className="ops-primary" disabled={loading}>
                {loading ? "Scheduling..." : "Schedule Match"}
              </button>
            </form>

            {message && <div className="ops-success">{message}</div>}
            {error && <div className="ops-error">{error}</div>}
          </div>

          <div className="ops-card">
            <div className="ops-card-header">
              <h3>Fixture Preview</h3>
              <p>Confirm the match setup before publishing.</p>
            </div>

            <div className="preview-list">
              <p><strong>Tournament:</strong> {form.tournamentId || "Not selected"}</p>
              <p><strong>Team A:</strong> {form.teamA || "-"}</p>
              <p><strong>Team B:</strong> {form.teamB || "-"}</p>
              <p><strong>Status:</strong> {form.status}</p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default MatchScheduler;
