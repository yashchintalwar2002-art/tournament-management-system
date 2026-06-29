import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  FaBroadcastTower,
  FaClipboardCheck,
  FaForward,
  FaSitemap,
  FaTrophy,
  FaUsers,
  FaPlay,
  FaEdit,
  FaShieldAlt,
} from "react-icons/fa";
import Layout from "../../components/Layout";
import API from "../../services/api";
import "./OrganizerDashboard.css";

function OrganizerDashboard() {
  const [matches, setMatches] = useState([]);
  const [activeTab, setActiveTab] = useState("live");
  const [editingMatchId, setEditingMatchId] = useState(null);

  // Edit Match states
  const [showEditMatchModal, setShowEditMatchModal] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [editMatchForm, setEditMatchForm] = useState({
    teamA: "",
    teamB: "",
    groundName: "",
    ballType: "LEATHER",
    matchType: "LIMITED_OVERS",
    matchDate: "",
    maxOvers: 20.0,
    status: "UPCOMING",
    round: "LEAGUE_MATCH",
    scoreA: 0,
    scoreB: 0,
    wickets: 0,
    overs: 0.0,
    currentInnings: 1,
    targetScore: 0
  });

  const role = sessionStorage.getItem("role") || "PLAYER";
  const isAdmin = role === "ADMIN" || role === "ORGANIZER";
  const userEmail = sessionStorage.getItem("email");
  const [resumeName, setResumeName] = useState("");

  useEffect(() => {
    const fetchProfileName = async () => {
      try {
        const userRes = await API.get(`/users/current?identifier=${encodeURIComponent(userEmail)}`);
        const mobile = userRes.data.mobileNumber;
        if (mobile) {
          const profileRes = await API.get(`/players/profile/${mobile}`);
          if (profileRes.data && profileRes.data.playerName) {
            setResumeName(profileRes.data.playerName);
          }
        }
      } catch (err) {
        // Silent catch
      }
    };
    if (userEmail) {
      fetchProfileName();
    }
  }, [userEmail]);

  const hasWriteAccess = (match) => {
    if (!isAdmin) return false;
    const tourney = match?.tournament;
    if (!tourney) return false;
    let creator = tourney.createdBy;
    if (!creator) creator = "admin@gmail.com";
    if (userEmail && creator.toLowerCase() === userEmail.toLowerCase()) return true;
    const collaborators = tourney.collaborators ? tourney.collaborators.split(",").filter(c => c.trim().length > 0) : [];
    return collaborators.some(collab => userEmail && collab.trim().toLowerCase() === userEmail.toLowerCase());
  };

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      const res = await API.get("/matches");
      const filtered = res.data.filter(hasWriteAccess);
      setMatches(filtered);
    } catch (error) {
      console.error("Dashboard data error:", error);
    }
  };

  const handleStartMatch = async (matchId) => {
    try {
      await API.put(`/matches/update-status/${matchId}?status=LIVE`);
      fetchDashboardData();
    } catch (error) {
      console.error("Start match error:", error);
      alert("Failed to start match");
    }
  };

  const handleAddRun = async (matchId, runs) => {
    try {
      await API.put(`/matches/${matchId}/run/${runs}`);
      fetchDashboardData();
    } catch (error) {
      console.error("Add run error:", error);
    }
  };

  const handleUpdateAction = async (matchId, action) => {
    try {
      await API.put(`/matches/${matchId}/${action}`);
      fetchDashboardData();
    } catch (error) {
      console.error("Action error:", error);
    }
  };

  const handleUpdatePlayers = async (matchId) => {
    try {
      const batsman = document.getElementById(`dash-batsman-${matchId}`).value;
      const nonStriker = document.getElementById(`dash-nonstriker-${matchId}`).value;
      const bowler = document.getElementById(`dash-bowler-${matchId}`).value;
      await API.put(`/matches/${matchId}/players?batsman=${encodeURIComponent(batsman)}&nonStriker=${encodeURIComponent(nonStriker)}&bowler=${encodeURIComponent(bowler)}`);
      fetchDashboardData();
    } catch (error) {
      console.error("Update players error:", error);
    }
  };

  const handleEditMatchSubmit = async (e) => {
    e.preventDefault();
    if (!selectedMatch) return;
    try {
      await API.put(`/matches/${selectedMatch.id}`, editMatchForm);
      setShowEditMatchModal(false);
      fetchDashboardData();
      alert("Fixture updated successfully!");
    } catch (error) {
      console.error("Edit match error:", error);
      alert("Failed to edit match.");
    }
  };

  return (
    <Layout
      title="Organizer Dashboard"
      subtitle="Manage tournaments, teams, brackets, and match results."
    >
      <div className="organizer-hero animate-fade-in-up">
        <div style={{ display: "flex", alignItems: "center", gap: "20px", width: "100%", justifyContent: "space-between", flexWrap: "wrap" }}>
          <div>
            <span className="hero-label">Event operations</span>
            <h2 style={{ fontSize: "32px", fontWeight: 800, margin: "6px 0" }}>
              Welcome back, <span className="premium-admin-dashboard-name">{resumeName || (userEmail && userEmail.toLowerCase() === "admin@gmail.com" ? "Super Admin" : (userEmail ? userEmail.split("@")[0].charAt(0).toUpperCase() + userEmail.split("@")[0].slice(1) : "Organizer"))}</span>
            </h2>
            <p>Create events, add teams, generate brackets, and post results with fewer clicks.</p>
          </div>
          <div className="premium-admin-icon-3d-glowing">
            <FaShieldAlt />
          </div>
        </div>

        <div className="organizer-hero-stats">
          <div>
            <strong>Teams</strong>
            <span>Roster ready</span>
          </div>
          <div>
            <strong>Rounds</strong>
            <span>Bracket flow</span>
          </div>
          <div>
            <strong>Live</strong>
            <span>Score center</span>
          </div>
        </div>
      </div>

      <div className="organizer-grid">
        <div className="premium-card animate-fade-in-up" style={{ animationDelay: "0.05s" }}>
          <div className="premium-icon">
            <FaTrophy />
          </div>
          <h2>Tournament Control Center</h2>
          <p>
            Start with a tournament, register teams, generate the bracket, then
            update results as matches finish.
          </p>

          <div className="premium-actions">
            <Link to="/create-tournament">Create Tournament</Link>
            <Link to="/tournaments">Manage Tournaments</Link>
            <Link to="/add-teams">Add Teams</Link>
            <Link to="/add-player">Add Players</Link>
            <Link to="/generate-bracket">Generate Bracket</Link>
            <Link to="/update-match-result">Update Results</Link>
            <Link to="/live-score">Live Score</Link>
            <Link to="/match-setup-wizard" style={{ background: "linear-gradient(135deg, var(--warning), #d97706)", color: "white" }}>Match Setup Wizard</Link>
            <Link to="/smart-scheduler" style={{ background: "linear-gradient(135deg, var(--primary), var(--accent-purple))", color: "white" }}>Smart Scheduler</Link>
            <Link to="/tournament-simulator" style={{ background: "linear-gradient(135deg, var(--accent), var(--primary))", color: "white" }}>AI Predictor</Link>
          </div>
        </div>

        <div className="organizer-card dark-card wide-card animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
          <div className="organizer-card-header" style={{ justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div className="organizer-card-icon" style={{ background: "linear-gradient(135deg, var(--accent-purple), var(--primary))" }}>
                <FaBroadcastTower />
              </div>
              <div>
                <h3>Live & Upcoming Match Control</h3>
                <p>Direct dashboard scoring updates and status monitoring.</p>
              </div>
            </div>
            <div className="dash-tab-buttons">
              <button
                className={`dash-tab-btn ${activeTab === "live" ? "active" : ""}`}
                onClick={() => setActiveTab("live")}
              >
                Live Action ({matches.filter((m) => m.status === "LIVE").length})
              </button>
              <button
                className={`dash-tab-btn ${activeTab === "upcoming" ? "active" : ""}`}
                onClick={() => setActiveTab("upcoming")}
              >
                Upcoming ({matches.filter((m) => m.status !== "LIVE" && m.status !== "COMPLETED").length})
              </button>
            </div>
          </div>

          <div className="dash-matches-container">
            {activeTab === "live" ? (
              matches.filter((m) => m.status === "LIVE").length === 0 ? (
                <div className="dash-matches-empty">
                  <p>No matches are currently live.</p>
                </div>
              ) : (
                <div className="dash-matches-list animate-fade-in">
                  {matches.filter((m) => m.status === "LIVE").map((match) => (
                    <div key={match.id} className="dash-match-row">
                      <div className="dash-match-header">
                        <span className="dash-match-tournament">{match.tournament?.name} - {match.round}</span>
                        <span className="dash-match-status-live"><span className="live-pulse-dot" style={{ marginRight: "6px" }}></span>LIVE</span>
                      </div>
                      <div className="dash-match-body">
                        <div className="dash-match-teams">
                          <div className="dash-team-score">
                            <strong>{match.teamA}</strong> <span>{match.scoreA} {match.currentInnings === 1 ? `/${match.wickets}` : ""}</span>
                          </div>
                          <div className="dash-vs">vs</div>
                          <div className="dash-team-score">
                            <strong>{match.teamB}</strong> <span>{match.scoreB} {match.currentInnings === 2 ? `/${match.wickets}` : ""}</span>
                          </div>
                        </div>
                        <div className="dash-match-meta">
                          <span>Overs: {match.overs} | Last Event: {match.lastEvent || "-"}</span>
                          <button
                            className="dash-quick-score-toggle"
                            onClick={() => setEditingMatchId(editingMatchId === match.id ? null : match.id)}
                          >
                            {editingMatchId === match.id ? "Close Console" : "Quick Score"}
                          </button>
                        </div>
                      </div>

                      {editingMatchId === match.id && (
                        <div className="dash-scorer-console animate-fade-in">
                          <div className="dash-console-buttons">
                            {[1, 2, 3].map((runs) => (
                              <button key={runs} className="btn-dash-run" onClick={() => handleAddRun(match.id, runs)}>
                                +{runs}
                              </button>
                            ))}
                            <button className="btn-dash-boundary" onClick={() => handleAddRun(match.id, 4)}>+4</button>
                            <button className="btn-dash-boundary" onClick={() => handleAddRun(match.id, 6)}>+6</button>
                            <button className="btn-dash-dot" onClick={() => handleUpdateAction(match.id, "dot-ball")}>Dot</button>
                            <button className="btn-dash-wide" onClick={() => handleUpdateAction(match.id, "wide")} style={{ background: "rgba(139, 92, 246, 0.1)", color: "#c084fc", borderColor: "rgba(139, 92, 246, 0.3)" }}>Wide</button>
                            <button className="btn-dash-noball" onClick={() => handleUpdateAction(match.id, "no-ball")} style={{ background: "rgba(244, 63, 94, 0.1)", color: "#fb7185", borderColor: "rgba(244, 63, 94, 0.3)" }}>No Ball</button>
                            <button className="btn-dash-rotate" onClick={() => handleUpdateAction(match.id, "rotate-strike")} style={{ background: "rgba(59, 130, 246, 0.1)", color: "#60a5fa", borderColor: "rgba(59, 130, 246, 0.3)" }}>Rotate</button>
                            <button className="btn-dash-wicket" onClick={() => handleUpdateAction(match.id, "wicket")}>Wicket</button>
                            <button className="btn-dash-control" onClick={() => handleUpdateAction(match.id, "inning-break")}>End Innings 1</button>
                          </div>
                          <div className="dash-console-inputs">
                            <input
                              type="text"
                              placeholder="Striker"
                              id={`dash-batsman-${match.id}`}
                              defaultValue={match.currentBatsman || ""}
                              className="dash-console-input"
                            />
                            <input
                              type="text"
                              placeholder="Non-Striker"
                              id={`dash-nonstriker-${match.id}`}
                              defaultValue={match.currentNonStriker || ""}
                              className="dash-console-input"
                            />
                            <input
                              type="text"
                              placeholder="Bowler"
                              id={`dash-bowler-${match.id}`}
                              defaultValue={match.currentBowler || ""}
                              className="dash-console-input"
                            />
                            <button className="btn-dash-set" onClick={() => handleUpdatePlayers(match.id)}>Set</button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )
            ) : (
              matches.filter((m) => m.status !== "LIVE" && m.status !== "COMPLETED").length === 0 ? (
                <div className="dash-matches-empty">
                  <p>No upcoming matches scheduled.</p>
                </div>
              ) : (
                <div className="dash-matches-list animate-fade-in">
                  {matches.filter((m) => m.status !== "LIVE" && m.status !== "COMPLETED").map((match) => (
                    <div key={match.id} className="dash-match-row">
                      <div className="dash-match-header">
                        <span className="dash-match-tournament">{match.tournament?.name} - {match.round}</span>
                        <span className="dash-match-status-upcoming">Upcoming</span>
                      </div>
                      <div className="dash-match-body">
                        <div className="dash-match-teams">
                          <strong>{match.teamA}</strong> <span style={{ margin: "0 10px", opacity: 0.5 }}>vs</span> <strong>{match.teamB}</strong>
                        </div>
                        <div className="dash-match-meta" style={{ justifyContent: "flex-end", gap: "8px" }}>
                          <button
                            className="dash-btn-edit"
                            style={{
                              background: "rgba(245, 158, 11, 0.15)",
                              color: "#fcd34d",
                              border: "1px solid rgba(245, 158, 11, 0.2)",
                              borderRadius: "8px",
                              padding: "6px 12px",
                              fontSize: "11px",
                              fontWeight: "800",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              gap: "4px"
                            }}
                            onClick={() => {
                              setSelectedMatch(match);
                              setEditMatchForm({
                                teamA: match.teamA || "",
                                teamB: match.teamB || "",
                                groundName: match.groundName || "",
                                ballType: match.ballType || "LEATHER",
                                matchType: match.matchType || "LIMITED_OVERS",
                                matchDate: match.matchDate || "",
                                maxOvers: match.maxOvers || 20.0,
                                status: match.status || "UPCOMING",
                                round: match.round || "LEAGUE_MATCH",
                                scoreA: match.scoreA || 0,
                                scoreB: match.scoreB || 0,
                                wickets: match.wickets || 0,
                                overs: match.overs || 0.0,
                                currentInnings: match.currentInnings || 1,
                                targetScore: match.targetScore || 0
                              });
                              setShowEditMatchModal(true);
                            }}
                          >
                            <FaEdit /> Edit Fixture
                          </button>

                          <button
                            className="dash-btn-start"
                            onClick={() => handleStartMatch(match.id)}
                            style={{
                              background: "linear-gradient(135deg, var(--primary), var(--accent-purple))",
                              color: "white",
                              border: "none",
                              borderRadius: "8px",
                              padding: "6px 12px",
                              fontSize: "11px",
                              fontWeight: "800",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              gap: "4px"
                            }}
                          >
                            <FaPlay size={10} /> Start Match
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}
          </div>
        </div>

        <Link to="/add-teams" className="organizer-card purple-card animate-fade-in-up" style={{ animationDelay: "0.15s" }}>
          <div className="organizer-card-icon">
            <FaUsers />
          </div>
          <h3>Add Teams</h3>
          <p>Register teams before bracket generation begins.</p>
          <span>Open teams</span>
        </Link>

        <Link to="/generate-bracket" className="organizer-card blue-card animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
          <div className="organizer-card-icon">
            <FaSitemap />
          </div>
          <h3>Generate Bracket</h3>
          <p>Create quarter-final, semi-final, and final match paths.</p>
          <span>Generate</span>
        </Link>

        <Link to="/update-match-result" className="organizer-card green-card animate-fade-in-up" style={{ animationDelay: "0.25s" }}>
          <div className="organizer-card-icon">
            <FaClipboardCheck />
          </div>
          <h3>Update Results</h3>
          <p>Enter scores, select winners, and prepare the next round.</p>
          <span>Update</span>
        </Link>

        <div className="organizer-card dark-card wide-card animate-fade-in-up" style={{ animationDelay: "0.3s" }}>
          <div className="organizer-card-header">
            <div className="organizer-card-icon">
              <FaTrophy />
            </div>
            <div>
              <h3>Organizer Flow</h3>
              <p>Follow the same sequence every time for a clean event day.</p>
            </div>
          </div>

          <div className="organizer-flow">
            <Link to="/tournaments">
              <FaTrophy /> Tournament
            </Link>
            <Link to="/add-teams">
              <FaUsers /> Teams
            </Link>
            <Link to="/generate-bracket">
              <FaSitemap /> Bracket
            </Link>
            <Link to="/update-match-result">
              <FaClipboardCheck /> Results
            </Link>
            <Link to="/generate-next-round">
              <FaForward /> Next Round
            </Link>
            <Link to="/live-score">
              <FaBroadcastTower /> Live
            </Link>
          </div>
        </div>
      </div>

      {/* Edit Match Modal */}
      {showEditMatchModal && (
        <div className="msw-modal-overlay">
          <div className="msw-modal-content">
            <h3>Modify Match Fixture</h3>
            <p>Update grounds, scheduling, and custom limits.</p>

            <form onSubmit={handleEditMatchSubmit} className="pp-form" style={{ maxWidth: "100%" }}>
              <div className="pp-input-row">
                <label>
                  Team A Name
                  <input
                    type="text"
                    value={editMatchForm.teamA}
                    onChange={(e) => setEditMatchForm({ ...editMatchForm, teamA: e.target.value })}
                    required
                  />
                </label>

                <label>
                  Team B Name
                  <input
                    type="text"
                    value={editMatchForm.teamB}
                    onChange={(e) => setEditMatchForm({ ...editMatchForm, teamB: e.target.value })}
                    required
                  />
                </label>
              </div>

              <div className="pp-input-row">
                <label>
                  Ground / Ground Name
                  <input
                    type="text"
                    placeholder="e.g. Kennington Oval"
                    value={editMatchForm.groundName}
                    onChange={(e) => setEditMatchForm({ ...editMatchForm, groundName: e.target.value })}
                  />
                </label>

                <label>
                  Scheduled Date/Time
                  <input
                    type="text"
                    placeholder="e.g. 2026-06-01 14:00"
                    value={editMatchForm.matchDate}
                    onChange={(e) => setEditMatchForm({ ...editMatchForm, matchDate: e.target.value })}
                  />
                </label>
              </div>

              <div className="pp-input-row">
                <label>
                  Overs Limit
                  <input
                    type="number"
                    value={editMatchForm.maxOvers}
                    onChange={(e) => setEditMatchForm({ ...editMatchForm, maxOvers: parseFloat(e.target.value) })}
                    required
                  />
                </label>

                <label>
                  Round / Phase
                  <input
                    type="text"
                    value={editMatchForm.round}
                    onChange={(e) => setEditMatchForm({ ...editMatchForm, round: e.target.value })}
                  />
                </label>
              </div>

              <div className="pp-input-row">
                <label>
                  Ball Type
                  <select
                    value={editMatchForm.ballType}
                    onChange={(e) => setEditMatchForm({ ...editMatchForm, ballType: e.target.value })}
                  >
                    <option value="LEATHER">Leather Ball</option>
                    <option value="TENNIS">Tennis Ball</option>
                    <option value="OTHER">Other</option>
                  </select>
                </label>

                <label>
                  Match Type
                  <select
                    value={editMatchForm.matchType}
                    onChange={(e) => setEditMatchForm({ ...editMatchForm, matchType: e.target.value })}
                  >
                    <option value="LIMITED_OVERS">Limited Overs</option>
                    <option value="TEST">Test Match</option>
                  </select>
                </label>
              </div>

              <div className="msw-actions-row" style={{ marginTop: "20px" }}>
                <button 
                  type="button" 
                  className="msw-secondary-btn" 
                  onClick={() => setShowEditMatchModal(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="msw-primary-btn" 
                  style={{ background: "#f59e0b" }}
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}

export default OrganizerDashboard;
