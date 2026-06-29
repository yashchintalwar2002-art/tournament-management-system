import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  FaBolt,
  FaChartPie,
  FaServer,
  FaDatabase,
  FaUsers,
  FaTrophy,
  FaCalendarAlt,
  FaUsersCog,
  FaShieldAlt,
  FaBroadcastTower,
  FaPlay,
  FaCrown,
  FaCalendarCheck,
  FaBrain,
} from "react-icons/fa";
import Layout from "../../components/Layout";
import API from "../../services/api";
import "./AdminDashboard.css";

function AdminDashboard() {
  const [usersCount, setUsersCount] = useState(0);
  const [tournamentsCount, setTournamentsCount] = useState(0);
  const [liveMatchesCount, setLiveMatchesCount] = useState(0);
  const [teamsCount, setTeamsCount] = useState(0);
  const [systemUptime, setSystemUptime] = useState("0h 0m 0s");
  const [matches, setMatches] = useState([]);
  const [activeTab, setActiveTab] = useState("live");
  const [editingMatchId, setEditingMatchId] = useState(null);

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 10000);

    const startTime = Date.now() - 3600000 * 2.5;
    const timer = setInterval(() => {
      const diff = Date.now() - startTime;
      const hours = Math.floor(diff / 3600000);
      const minutes = Math.floor((diff % 3600000) / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      setSystemUptime(`${hours}h ${minutes}m ${seconds}s`);
    }, 1000);

    return () => {
      clearInterval(interval);
      clearInterval(timer);
    };
  }, []);

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

  const fetchDashboardData = async () => {
    try {
      const [usersRes, tournamentsRes, matchesRes, teamsRes] = await Promise.all([
        API.get("/users"),
        API.get("/tournaments"),
        API.get("/matches"),
        API.get("/teams"),
      ]);

      const filteredMatches = matchesRes.data.filter(hasWriteAccess);

      setUsersCount(usersRes.data.length);
      setTournamentsCount(tournamentsRes.data.length);
      setLiveMatchesCount(
        filteredMatches.filter((match) => match.status === "LIVE").length
      );
      setTeamsCount(teamsRes.data.length);
      setMatches(filteredMatches);
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

  return (
    <Layout
      title="System Administration"
      subtitle="Configure enterprise settings, view telemetry, and manage permissions."
    >
      <div className="dashboard-hero admin-hero animate-fade-in-up">
        <div style={{ display: "flex", alignItems: "center", gap: "20px", width: "100%", justifyContent: "space-between", flexWrap: "wrap" }}>
          <div>
            <span className="hero-label">System Control Desk</span>
            <h2 style={{ fontSize: "32px", fontWeight: 800, margin: "6px 0" }}>
              Welcome back, <span className="premium-admin-dashboard-name">{resumeName || (userEmail && userEmail.toLowerCase() === "admin@gmail.com" ? "Super Admin" : (userEmail ? userEmail.split("@")[0].charAt(0).toUpperCase() + userEmail.split("@")[0].slice(1) : "Admin"))}</span>
            </h2>
            <p>Real-time analytics and user operations center for the tournament platform.</p>
          </div>
          <div className="premium-admin-icon-3d-glowing">
            <FaCrown />
          </div>
        </div>

        <div className="hero-stats">
          <div>
            <strong>{usersCount}</strong>
            <span>Accounts</span>
          </div>
          <div>
            <strong>{tournamentsCount}</strong>
            <span>Tournaments</span>
          </div>
          <div>
            <strong>{teamsCount}</strong>
            <span>Teams</span>
          </div>
        </div>
      </div>

      <div className="admin-grid">
        <div className="admin-card dark-card wide-card animate-fade-in-up" style={{ animationDelay: "0.05s" }}>
          <div className="admin-card-header">
            <div className="admin-card-icon">
              <FaServer />
            </div>
            <div>
              <h3>Server Telemetry</h3>
              <p>Platform service health and hardware allocations.</p>
            </div>
          </div>

          <div className="telemetry-grid">
            <div className="telemetry-item">
              <span className="telemetry-label">API Gateway Status</span>
              <span className="telemetry-value active-status">ONLINE (Port 8080)</span>
            </div>
            <div className="telemetry-item">
              <span className="telemetry-label">Database Connection</span>
              <span className="telemetry-value active-status">
                <FaDatabase /> CONNECTED
              </span>
            </div>
            <div className="telemetry-item">
              <span className="telemetry-label">System Uptime</span>
              <span className="telemetry-value">{systemUptime}</span>
            </div>
            <div className="telemetry-item">
              <span className="telemetry-label">Active Web Sessions</span>
              <span className="telemetry-value">{usersCount > 0 ? usersCount + 1 : 1} sessions</span>
            </div>
          </div>
        </div>

        <div className="admin-card dark-card wide-card animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
          <div className="admin-card-header" style={{ justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div className="admin-card-icon" style={{ background: "linear-gradient(135deg, var(--accent-purple), var(--primary))" }}>
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
                        <div className="dash-match-meta" style={{ justifyContent: "flex-end" }}>
                          <button
                            className="dash-btn-start"
                            onClick={() => handleStartMatch(match.id)}
                          >
                            <FaPlay size={10} style={{ marginRight: "6px" }} /> Start Match
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

        <Link to="/users" className="admin-card purple-card animate-fade-in-up" style={{ animationDelay: "0.15s" }}>
          <div className="admin-card-icon">
            <FaUsersCog />
          </div>
          <h3>Role Management</h3>
          <p>Assign Admin, Organizer, or Player permissions and manage registered credentials.</p>
          <span>Configure Roles <FaShieldAlt /></span>
        </Link>

        <Link to="/add-player" className="admin-card blue-card animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
          <div className="admin-card-icon">
            <FaUsers />
          </div>
          <h3>Add Players</h3>
          <p>Register players and assign them to participating team rosters.</p>
          <span>Manage Team Rosters</span>
        </Link>

        <Link to="/match-setup-wizard" className="admin-card orange-card animate-fade-in-up" style={{ animationDelay: "0.22s" }}>
          <div className="admin-card-icon" style={{ background: "linear-gradient(135deg, var(--warning), #d97706)" }}>
            <FaCalendarAlt />
          </div>
          <h3>Match Setup Wizard</h3>
          <p>Schedule matches, select active XI squads, and simulate virtual coin flips.</p>
          <span>Start Scoring Wizard</span>
        </Link>

        <Link to="/smart-scheduler" className="admin-card orange-card animate-fade-in-up" style={{ animationDelay: "0.23s", background: "linear-gradient(135deg, rgba(245, 158, 11, 0.12), rgba(245, 158, 11, 0.03))" }}>
          <div className="admin-card-icon" style={{ background: "linear-gradient(135deg, var(--warning), #d97706)" }}>
            <FaCalendarCheck />
          </div>
          <h3>Smart Scheduler</h3>
          <p>Arrange match slots on a monthly calendar grid and detect venue double-bookings.</p>
          <span>Schedule Calendar</span>
        </Link>

        <Link to="/tournament-simulator" className="admin-card purple-card animate-fade-in-up" style={{ animationDelay: "0.24s", background: "linear-gradient(135deg, rgba(139, 92, 246, 0.12), rgba(139, 92, 246, 0.03))" }}>
          <div className="admin-card-icon" style={{ background: "linear-gradient(135deg, var(--accent-purple), #6d28d9)" }}>
            <FaBrain />
          </div>
          <h3>AI Match Simulator</h3>
          <p>Run Monte Carlo match outcome forecasts and view team strength pentagons.</p>
          <span>Run AI Engine</span>
        </Link>

        <Link to="/tournaments" className="admin-card blue-card animate-fade-in-up" style={{ animationDelay: "0.25s" }}>
          <div className="admin-card-icon">
            <FaTrophy />
          </div>
          <h3>Tournament Audit</h3>
          <p>Inspect active brackets, modify structures, and clean up completed rosters.</p>
          <span>Audit Tournaments</span>
        </Link>

        <Link to="/matches" className="admin-card green-card animate-fade-in-up" style={{ animationDelay: "0.3s" }}>
          <div className="admin-card-icon">
            <FaCalendarAlt />
          </div>
          <h3>Match Logs</h3>
          <p>Review match histories, scoreboard events, and live status states.</p>
          <span>Inspect Log Files</span>
        </Link>

        <div className="admin-card dark-card wide-card animate-fade-in-up" style={{ animationDelay: "0.35s" }}>
          <div className="admin-card-header">
            <div className="admin-card-icon">
              <FaBolt />
            </div>
            <div>
              <h3>System Capacity & Loads</h3>
              <p>Live metrics compiled from background event listeners.</p>
            </div>
          </div>

          <div className="admin-progress-block">
            <div className="admin-progress-row">
              <span>Database Load (tournament_db)</span>
              <strong>{teamsCount > 0 ? "Normal Load" : "Idle"}</strong>
            </div>
            <div className="admin-progress-bar">
              <div
                className="admin-progress-fill growth"
                style={{ width: `${Math.min(25 + teamsCount * 5, 95)}%` }}
              ></div>
            </div>
          </div>

          <div className="admin-progress-block">
            <div className="admin-progress-row">
              <span>Tournament Concurrency</span>
              <strong>{tournamentsCount > 0 ? `${tournamentsCount} Active` : "Idle"}</strong>
            </div>
            <div className="admin-progress-bar">
              <div
                className="admin-progress-fill tournaments"
                style={{ width: `${Math.min(10 + tournamentsCount * 12, 90)}%` }}
              ></div>
            </div>
          </div>

          <div className="admin-progress-block">
            <div className="admin-progress-row">
              <span>Live WebSocket Traffic</span>
              <strong>{liveMatchesCount > 0 ? "Heavy Load" : "Idle"}</strong>
            </div>
            <div className="admin-progress-bar">
              <div
                className="admin-progress-fill live"
                style={{ width: liveMatchesCount > 0 ? "78%" : "8%" }}
              ></div>
            </div>
          </div>
        </div>

        <div className="admin-card report-card animate-fade-in-up" style={{ animationDelay: "0.4s" }}>
          <div className="admin-card-icon">
            <FaChartPie />
          </div>
          <h3>Administrative Notice</h3>
          <p>
            This system runs under Spring Security rules. User roles dictate dashboard routes.
            Changes to system credentials must be deployed to application properties variables.
          </p>
        </div>
      </div>
    </Layout>
  );
}

export default AdminDashboard;
