import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  FaCheckCircle,
  FaEye,
  FaGamepad,
  FaList,
  FaSearch,
  FaTrophy,
  FaUsers,
} from "react-icons/fa";
import Layout from "../../components/Layout";
import API from "../../services/api";
import "./TournamentList.css";

function TournamentList() {
  const [tournaments, setTournaments] = useState([]);
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [joiningId, setJoiningId] = useState(null);

  useEffect(() => {
    fetchTournaments();
  }, []);

  const fetchTournaments = async () => {
    try {
      const res = await API.get("/tournaments");
      setTournaments(res.data);
      setError("");
    } catch (err) {
      console.error("Tournament fetch error:", err);
      setError("Failed to load tournaments.");
    }
  };

  const filteredTournaments = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return tournaments;

    return tournaments.filter((tournament) =>
      [tournament.name, tournament.game]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(normalizedQuery))
    );
  }, [query, tournaments]);

  const joinTournament = async (id) => {
    const email = sessionStorage.getItem("email");

    setMessage("");
    setError("");

    if (!email) {
      setError("User email not found. Please login again.");
      return;
    }

    try {
      setJoiningId(id);

      await API.post(
        `/tournament-registrations?tournamentId=${id}&playerEmail=${encodeURIComponent(
          email
        )}`
      );

      setMessage("Joined tournament successfully.");
    } catch (err) {
      console.error("Join error:", err);
      setError(
        err.response?.data?.message ||
          err.response?.data ||
          "Failed to join tournament."
      );
    } finally {
      setJoiningId(null);
    }
  };

  const role = sessionStorage.getItem("role") || "PLAYER";
  const isAdmin = role === "ADMIN" || role === "ORGANIZER";
  const userEmail = sessionStorage.getItem("email");

  const isCreator = (tournament) => {
    if (!isAdmin) return false;
    const creator = tournament?.createdBy;
    if (!creator) return true; // Legacy tournament
    return userEmail && creator.toLowerCase() === userEmail.toLowerCase();
  };

  const handleDeleteTournament = async (id) => {
    if (!window.confirm("Are you sure you want to delete this tournament? This will remove all associated matches and registrations.")) {
      return;
    }
    try {
      setMessage("");
      setError("");
      await API.delete(`/tournaments/${id}`);
      setMessage("Tournament deleted successfully.");
      fetchTournaments();
    } catch (err) {
      console.error("Delete error:", err);
      setError("Failed to delete tournament.");
    }
  };

  return (
    <Layout
      title="Tournaments"
      subtitle="Explore active tournaments, join events, and open brackets."
    >
      <div className="tournament-page-header">
        <div className="tournament-page-title">
          <div className="tournament-page-badge">
            <FaTrophy />
          </div>
          <div>
            <span className="section-label">Tournament directory</span>
            <h2>Available Tournaments</h2>
            <p>{tournaments.length} events loaded across the platform.</p>
          </div>
        </div>

        <label className="tournament-search">
          <FaSearch />
          <input
            type="search"
            placeholder="Search by name or game"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
      </div>

      {message && <div className="tournament-success">{message}</div>}
      {error && <div className="tournament-error">{error}</div>}

      <div className="tournament-grid">
        {filteredTournaments.length > 0 ? (
          filteredTournaments.map((tournament, index) => (
            <div 
              className="tournament-card animate-fade-in-up" 
              key={tournament.id}
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <div className="tournament-card-top">
                <div className="tournament-card-icon">
                  <FaTrophy />
                </div>

                <div className="tournament-card-chip">
                  <FaCheckCircle />
                  <span>Open</span>
                </div>
              </div>

              <h3>{tournament.name}</h3>

              <div className="tournament-card-info">
                <div className="tournament-info-row">
                  <FaGamepad />
                  <span>
                    <strong>Game</strong>
                    {tournament.game}
                  </span>
                </div>

                <div className="tournament-info-row">
                  <FaUsers />
                  <span>
                    <strong>Max Players</strong>
                    {tournament.maxPlayers}
                  </span>
                </div>
              </div>

              <div className="tournament-action-row">
                <Link
                  to={`/tournament-details/${tournament.id}`}
                  className="secondary-action"
                >
                  <FaEye /> Details
                </Link>
                <Link
                  to={`/bracket-view/${tournament.id}`}
                  className="secondary-action"
                >
                  <FaList /> Bracket
                </Link>

                <button
                  className="primary-action"
                  onClick={() => joinTournament(tournament.id)}
                  disabled={joiningId === tournament.id}
                >
                  {joiningId === tournament.id ? "Joining..." : "Join"}
                </button>

                {isCreator(tournament) && (
                  <button
                    className="secondary-action"
                    onClick={() => handleDeleteTournament(tournament.id)}
                    style={{
                      gridColumn: "span 2",
                      background: "rgba(239, 68, 68, 0.15)",
                      border: "1px solid rgba(239, 68, 68, 0.3)",
                      color: "#fca5a5",
                    }}
                  >
                    🗑️ Delete Tournament
                  </button>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="empty-state-card">
            <h3>No tournaments found</h3>
            <p>Create a tournament or adjust your search.</p>
          </div>
        )}
      </div>
    </Layout>
  );
}

export default TournamentList;
