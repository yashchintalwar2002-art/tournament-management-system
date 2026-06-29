import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../../components/Layout";
import API from "../../services/api";
import { FaCalendarAlt, FaSignal, FaTrophy, FaUsers, FaEdit, FaClock, FaInfoCircle } from "react-icons/fa";
import "./MatchList.css";

const getGroundsForTournament = (tournament) => {
  if (!tournament) return [];
  const list = [];

  // Add the tournament's specific ground if configured
  if (tournament.ground && tournament.ground.trim() !== "") {
    list.push(tournament.ground.trim());
  }

  const nameLower = (tournament.name || "").toLowerCase();
  const gameLower = (tournament.game || "").toLowerCase();

  // 1. IPL Grounds
  if (nameLower.includes("ipl") || nameLower.includes("indian premier league")) {
    return [
      ...list,
      "Wankhede Stadium, Mumbai",
      "M. Chinnaswamy Stadium, Bengaluru",
      "Narendra Modi Stadium, Ahmedabad",
      "Eden Gardens, Kolkata",
      "Arun Jaitley Stadium, Delhi",
      "MA Chidambaram Stadium, Chennai",
      "Rajiv Gandhi International Cricket Stadium, Hyderabad",
      "PCA IS Bindra Stadium, Mohali",
      "MCA Stadium, Pune",
      "Sawai Mansingh Stadium, Jaipur",
      "HPCA Stadium, Dharamshala",
      "Ekana Cricket Stadium, Lucknow"
    ];
  }

  // 2. General Cricket
  if (
    gameLower.includes("cricket") ||
    nameLower.includes("cricket") ||
    nameLower.includes("world cup") ||
    nameLower.includes("trophy")
  ) {
    return [
      ...list,
      "Lord's Cricket Ground, London",
      "Melbourne Cricket Ground (MCG)",
      "Sydney Cricket Ground (SCG)",
      "Adelaide Oval",
      "The Oval, London",
      "Wankhede Stadium, Mumbai",
      "MA Chidambaram Stadium, Chennai",
      "Eden Gardens, Kolkata",
      "Trent Bridge, Nottingham",
      "Newlands, Cape Town"
    ];
  }

  // 3. Football / Soccer
  if (
    gameLower.includes("football") ||
    gameLower.includes("soccer") ||
    nameLower.includes("football") ||
    nameLower.includes("soccer") ||
    nameLower.includes("cup")
  ) {
    return [
      ...list,
      "Wembley Stadium, London",
      "Camp Nou, Barcelona",
      "Santiago Bernabéu, Madrid",
      "Old Trafford, Manchester",
      "San Siro, Milan",
      "Allianz Arena, Munich",
      "Parc des Princes, Paris",
      "Maracanã, Rio de Janeiro"
    ];
  }

  // 4. Basketball
  if (gameLower.includes("basketball") || nameLower.includes("basketball")) {
    return [
      ...list,
      "Madison Square Garden, New York",
      "Crypto.com Arena, Los Angeles",
      "United Center, Chicago",
      "TD Garden, Boston",
      "Chase Center, San Francisco"
    ];
  }

  // 5. BGMI / Free Fire / PUBG (Esports Maps)
  if (
    gameLower.includes("bgmi") ||
    gameLower.includes("free fire") ||
    gameLower.includes("pubg") ||
    gameLower.includes("battlegrounds")
  ) {
    return [
      ...list,
      "Erangel (Main Map)",
      "Miramar (Desert Map)",
      "Sanhok (Tropical Map)",
      "Vikendi (Snow Map)",
      "Livik (Mini Map)",
      "Bermuda (Free Fire)",
      "Kalahari (Free Fire)"
    ];
  }

  // 6. Valorant
  if (gameLower.includes("valorant")) {
    return [
      ...list,
      "Bind",
      "Haven",
      "Split",
      "Ascent",
      "Icebox",
      "Breeze",
      "Fracture",
      "Pearl",
      "Lotus",
      "Sunset"
    ];
  }

  // 7. Tennis
  if (gameLower.includes("tennis") || nameLower.includes("tennis")) {
    return [
      ...list,
      "Centre Court, Wimbledon",
      "Arthur Ashe Stadium, US Open",
      "Court Philippe Chatrier, Roland Garros",
      "Rod Laver Arena, Australian Open"
    ];
  }

  // 8. Badminton
  if (gameLower.includes("badminton") || nameLower.includes("badminton")) {
    return [
      ...list,
      "Musashino Forest Sport Plaza, Tokyo",
      "Istora Senayan, Jakarta",
      "Birmingham Arena, UK"
    ];
  }

  // 9. Chess
  if (gameLower.includes("chess") || nameLower.includes("chess")) {
    return [
      ...list,
      "Main Tournament Hall",
      "Grandmaster Lounge",
      "Online Chess Arena"
    ];
  }

  // 10. Kabaddi
  if (gameLower.includes("kabaddi") || nameLower.includes("kabaddi")) {
    return [
      ...list,
      "Netaji Subhash Chandra Bose Indoor Stadium",
      "Shree Shiv Chhatrapati Sports Complex",
      "Kanteerava Indoor Stadium"
    ];
  }

  // 11. Hockey
  if (gameLower.includes("hockey") || nameLower.includes("hockey")) {
    return [
      ...list,
      "Major Dhyan Chand National Stadium",
      "Kalinga Stadium, Bhubaneswar",
      "Birsa Munda Hockey Stadium, Rourkela"
    ];
  }

  return [
    ...list,
    "National Sports Arena",
    "City Central Ground",
    "University Sports Complex",
    "County Grounds"
  ];
};

const formatMatchDateTime = (dateTimeStr) => {
  if (!dateTimeStr) return "Not scheduled";
  try {
    const [datePart, timePart] = dateTimeStr.split("T");
    if (!datePart) return "Not scheduled";
    
    const [year, month, day] = datePart.split("-");
    const months = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun", 
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ];
    const monthName = months[parseInt(month) - 1] || month;
    const formattedDate = `${monthName} ${parseInt(day)}, ${year}`;

    if (!timePart) return formattedDate;

    const [hour, minute] = timePart.split(":");
    const h = parseInt(hour);
    const ampm = h >= 12 ? "PM" : "AM";
    const displayHour = h % 12 === 0 ? 12 : h % 12;
    const formattedTime = `${String(displayHour).padStart(2, '0')}:${minute} ${ampm}`;

    return `${formattedDate} at ${formattedTime}`;
  } catch (err) {
    return dateTimeStr.replace("T", " ");
  }
};

function MatchList() {
  const navigate = useNavigate();
  const [matches, setMatches] = useState([]);
  const [message, setMessage] = useState("");
  const [activeTab, setActiveTab] = useState("live");

  // Custom Confirm Dialog States
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: null
  });

  const triggerConfirm = (title, message, onConfirm) => {
    setConfirmDialog({
      isOpen: true,
      title,
      message,
      onConfirm: () => {
        onConfirm();
        setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
      }
    });
  };

  // Automatically select the active tab based on which section has content
  useEffect(() => {
    if (matches.length > 0) {
      const hasLive = matches.some((m) => (m.status || "").toUpperCase() === "LIVE");
      const hasUpcoming = matches.some((m) => {
        const s = (m.status || "").toUpperCase();
        return s === "UPCOMING" || s === "";
      });
      if (hasLive) {
        setActiveTab("live");
      } else if (hasUpcoming) {
        setActiveTab("upcoming");
      } else {
        setActiveTab("completed");
      }
    }
  }, [matches]);

  // Edit Match modal states
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [editForm, setEditForm] = useState({
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
    targetScore: 0,
    winner: ""
  });

  const [matchEditDate, setMatchEditDate] = useState("");
  const [matchEditHour, setMatchEditHour] = useState("12");
  const [matchEditMinute, setMatchEditMinute] = useState("00");
  const [matchEditPeriod, setMatchEditPeriod] = useState("PM");

  const role = sessionStorage.getItem("role") || "PLAYER";
  const isAdmin = role === "ADMIN" || role === "ORGANIZER";
  const userEmail = sessionStorage.getItem("email");

  const hasWriteAccessForMatch = (match) => {
    if (!isAdmin) return false;
    const tourney = match?.tournament;
    if (!tourney) return false; // fallback
    let creator = tourney.createdBy;
    if (!creator) creator = "admin@gmail.com";
    if (userEmail && creator.toLowerCase() === userEmail.toLowerCase()) return true;
    const collaborators = tourney.collaborators ? tourney.collaborators.split(",").filter(c => c.trim().length > 0) : [];
    return collaborators.some(collab => userEmail && collab.trim().toLowerCase() === userEmail.toLowerCase());
  };

  useEffect(() => {
    fetchMatches();
  }, []);

  const fetchMatches = async () => {
    try {
      const res = await API.get("/matches");
      setMatches(res.data);
      setMessage("");
    } catch (err) {
      console.error(err);
      setMessage("Failed to load matches.");
    }
  };

  const handleStartMatch = async (matchId) => {
    try {
      await API.put(`/matches/update-status/${matchId}?status=LIVE`);
      fetchMatches();
      alert("Match started live successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to start match live.");
    }
  };

  const handleEditMatchSubmit = async (e) => {
    e.preventDefault();
    if (!selectedMatch) return;
    try {
      let combinedDate = "";
      if (matchEditDate) {
        let h24 = parseInt(matchEditHour);
        if (matchEditPeriod === "PM" && h24 < 12) {
          h24 += 12;
        } else if (matchEditPeriod === "AM" && h24 === 12) {
          h24 = 0;
        }
        const hourStr = String(h24).padStart(2, "0");
        const minuteStr = String(matchEditMinute).padStart(2, "0");
        combinedDate = `${matchEditDate}T${hourStr}:${minuteStr}`;
      }
      const updatedForm = { ...editForm, matchDate: combinedDate };
      await API.put(`/matches/${selectedMatch.id}`, updatedForm);
      setShowEditModal(false);
      fetchMatches();
      alert("Match saved successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to update match.");
    }
  };

  const handleDeleteMatch = (matchId) => {
    triggerConfirm(
      "Confirm Match Deletion",
      "Are you sure you want to delete this match? This cannot be undone.",
      async () => {
        try {
          await API.delete(`/matches/${matchId}`);
          fetchMatches();
          setMessage("Match deleted successfully!");
          setTimeout(() => setMessage(""), 4000);
        } catch (err) {
          console.error(err);
          setMessage("Failed to delete match.");
          setTimeout(() => setMessage(""), 4000);
        }
      }
    );
  };

  const handleDeleteAllMatches = () => {
    triggerConfirm(
      "Warning: Delete All Matches",
      "Are you sure you want to delete ALL matches across the platform? This action is permanent and cannot be undone.",
      async () => {
        try {
          await API.delete('/matches/all');
          fetchMatches();
          setMessage("All matches deleted successfully!");
          setTimeout(() => setMessage(""), 4000);
        } catch (err) {
          console.error(err);
          setMessage("Failed to delete all matches.");
          setTimeout(() => setMessage(""), 4000);
        }
      }
    );
  };

  const stats = useMemo(
    () => ({
      total: matches.length,
      live: matches.filter((match) => match.status === "LIVE").length,
      complete: matches.filter((match) => match.status === "COMPLETED").length,
    }),
    [matches]
  );

  const liveMatches = useMemo(() => matches.filter((m) => (m.status || "").toUpperCase() === "LIVE"), [matches]);
  const upcomingMatches = useMemo(() => matches.filter((m) => {
    const status = (m.status || "").toUpperCase();
    return status === "UPCOMING" || status === "";
  }), [matches]);
  const completedMatches = useMemo(() => matches.filter((m) => (m.status || "").toUpperCase() === "COMPLETED"), [matches]);

  const getStatusClass = (status) => {
    if (status === "LIVE") return "status-live";
    if (status === "COMPLETED") return "status-completed";
    return "status-upcoming";
  };

  const openEditModal = (match) => {
    setSelectedMatch(match);
    const [d, t] = (match.matchDate || "").split("T");
    setMatchEditDate(d || "");
    if (t) {
      const timeParts = t.split(":");
      const h24 = parseInt(timeParts[0]) || 0;
      const m = timeParts[1] || "00";
      setMatchEditMinute(m.substring(0, 2));
      const p = h24 >= 12 ? "PM" : "AM";
      setMatchEditPeriod(p);
      let h12 = h24 % 12;
      if (h12 === 0) h12 = 12;
      setMatchEditHour(String(h12));
    } else {
      setMatchEditHour("12");
      setMatchEditMinute("00");
      setMatchEditPeriod("PM");
    }
    setEditForm({
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
      targetScore: match.targetScore || 0,
      winner: match.winner || ""
    });
    setShowEditModal(true);
  };

  const renderMatchCard = (match, index) => (
    <div 
      className="matchlist-card animate-fade-in-up" 
      key={match.id}
      style={{ animationDelay: `${index * 0.05}s` }}
    >
      <div className="matchlist-card-top">
        <div className="matchlist-card-icon">
          <FaTrophy />
        </div>
        <div className={`match-status ${getStatusClass(match.status)}`}>
          <FaSignal />
          <span>{match.status || "UPCOMING"}</span>
        </div>
      </div>

      <h3>
        {match.teamA || "Team A"} vs {match.teamB || "Team B"}
      </h3>

      <div className="score-strip">
        <span>{match.scoreA ?? 0}</span>
        <small>score</small>
        <span>{match.scoreB ?? 0}</span>
      </div>

      <div className="matchlist-info">
        <div className="matchlist-row">
          <FaUsers />
          <span>
            <strong>Teams</strong>
            {match.teamA || "TBD"} / {match.teamB || "TBD"}
          </span>
        </div>

        <div className="matchlist-row">
          <FaCalendarAlt />
          <span>
            <strong>Date</strong>
            {formatMatchDateTime(match.matchDate)}
          </span>
        </div>

        {match.groundName && (
          <div className="matchlist-row">
            <FaTrophy />
            <span>
              <strong>Ground</strong>
              {match.groundName}
            </span>
          </div>
        )}

        <div className="matchlist-row">
          <FaTrophy />
          <span>
            <strong>Tournament</strong>
            {match.tournament ? match.tournament.name : "N/A"}
          </span>
        </div>
      </div>

      {hasWriteAccessForMatch(match) && (
        <div className="matchlist-actions-footer" style={{ display: "flex", gap: "10px", marginTop: "12px", borderTop: "1px solid rgba(255, 255, 255, 0.05)", paddingTop: "10px" }}>
          <button
            onClick={() => openEditModal(match)}
            style={{
              flex: 1,
              background: "rgba(245, 158, 11, 0.1)",
              color: "#fbbf24",
              border: "1px solid rgba(245, 158, 11, 0.2)",
              padding: "6px 12px",
              borderRadius: "6px",
              fontSize: "11px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "4px",
              fontWeight: "800",
              transition: "all 0.2s"
            }}
          >
            <FaEdit /> Edit
          </button>
          <button
            onClick={() => handleDeleteMatch(match.id)}
            style={{
              flex: 1,
              background: "rgba(239, 68, 68, 0.15)",
              color: "#fca5a5",
              border: "1px solid rgba(239, 68, 68, 0.2)",
              padding: "6px 12px",
              borderRadius: "6px",
              fontSize: "11px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "4px",
              fontWeight: "800",
              transition: "all 0.2s"
            }}
          >
            🗑️ Delete
          </button>
        </div>
      )}
    </div>
  );

  return (
    <Layout
      title="Matches"
      subtitle="View scheduled, live, and completed fixtures."
    >
      <div className="matchlist-page">
        <div className="matchlist-hero">
          <div className="matchlist-hero-left">
            <div className="matchlist-badge">
              <FaCalendarAlt />
            </div>
            <div>
              <span className="section-label">Fixture control</span>
              <h2>All Matches</h2>
              <p>Track tournament fixtures and match progress in one place.</p>
              {false && matches.length > 0 && (
                <button 
                  onClick={handleDeleteAllMatches} 
                  className="btn-delete-all-matches"
                  style={{
                    marginTop: "12px",
                    background: "rgba(239, 68, 68, 0.15)",
                    color: "#ef4444",
                    border: "1px solid rgba(239, 68, 68, 0.3)",
                    padding: "6px 12px",
                    borderRadius: "6px",
                    fontSize: "12px",
                    cursor: "pointer",
                    fontWeight: "700",
                    transition: "all 0.2s"
                  }}
                >
                  🗑️ Delete All Matches
                </button>
              )}
            </div>
          </div>

          <div className="matchlist-stats">
            <div className="matchlist-stat-card">
              <strong>{stats.total}</strong>
              <span>Total</span>
            </div>
            <div className="matchlist-stat-card">
              <strong>{stats.live}</strong>
              <span>Live</span>
            </div>
            <div className="matchlist-stat-card">
              <strong>{stats.complete}</strong>
              <span>Done</span>
            </div>
          </div>
        </div>

        {message && <div className="matchlist-error">{message}</div>}

        {matches.length === 0 ? (
          <div className="matchlist-empty">
            <h3>No matches found</h3>
            <p>Schedule a match from the Organizer or Admin dashboard.</p>
          </div>
        ) : (
          <>
            {/* Sliding Tabs Bar */}
            <div className="sliding-tabs-container">
              <div className={`sliding-tab-pill active-${activeTab}`}></div>
              <button 
                type="button"
                className={`sliding-tab-btn ${activeTab === "live" ? "active" : ""}`}
                onClick={() => setActiveTab("live")}
              >
                <span className="live-dot-pulse"></span> Live Action ({liveMatches.length})
              </button>
              <button 
                type="button"
                className={`sliding-tab-btn ${activeTab === "upcoming" ? "active" : ""}`}
                onClick={() => setActiveTab("upcoming")}
              >
                📅 Upcoming ({upcomingMatches.length})
              </button>
              <button 
                type="button"
                className={`sliding-tab-btn ${activeTab === "completed" ? "active" : ""}`}
                onClick={() => setActiveTab("completed")}
              >
                🏆 Completed ({completedMatches.length})
              </button>
            </div>

            <div className="matchlist-sections">
              {/* Live Matches Section */}
              {activeTab === "live" && (
                <div className="matchlist-section animate-fade-in-up">
                  <h3 className="matchlist-section-title">
                    <span className="live-dot-pulse"></span> 🔴 Live Action
                    <span className="matchlist-section-count">{liveMatches.length}</span>
                  </h3>
                  {liveMatches.length > 0 ? (
                    <div className="matchlist-grid">
                      {liveMatches.map((match, index) => renderMatchCard(match, index))}
                    </div>
                  ) : (
                    <div className="matchlist-empty-sub">
                      <p>No matches are currently live.</p>
                    </div>
                  )}
                </div>
              )}

              {/* Upcoming Matches Section */}
              {activeTab === "upcoming" && (
                <div className="matchlist-section animate-fade-in-up">
                  <h3 className="matchlist-section-title">
                    📅 Upcoming Fixtures
                    <span className="matchlist-section-count">{upcomingMatches.length}</span>
                  </h3>
                  {upcomingMatches.length > 0 ? (
                    <div className="matchlist-grid">
                      {upcomingMatches.map((match, index) => renderMatchCard(match, index))}
                    </div>
                  ) : (
                    <div className="matchlist-empty-sub">
                      <p>No upcoming matches scheduled.</p>
                    </div>
                  )}
                </div>
              )}

              {/* Completed Matches Section */}
              {activeTab === "completed" && (
                <div className="matchlist-section animate-fade-in-up">
                  <h3 className="matchlist-section-title">
                    🏆 Completed Results
                    <span className="matchlist-section-count">{completedMatches.length}</span>
                  </h3>
                  {completedMatches.length > 0 ? (
                    <div className="matchlist-grid">
                      {completedMatches.map((match, index) => renderMatchCard(match, index))}
                    </div>
                  ) : (
                    <div className="matchlist-empty-sub">
                      <p>No completed matches found.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Edit Match Modal */}
      {showEditModal && (
        <div className="msw-modal-overlay">
          <div className="msw-modal-content" style={{ maxWidth: "580px" }}>
            <h3>Edit Match Setup & Score</h3>
            <p>Update live state, scheduled grounds, or finalize results.</p>

            <form onSubmit={handleEditMatchSubmit} className="pp-form" style={{ maxWidth: "100%" }}>
              <div className="pp-input-row">
                <label>
                  Team A
                  <input
                    type="text"
                    value={editForm.teamA}
                    onChange={(e) => setEditForm({ ...editForm, teamA: e.target.value })}
                    required
                  />
                </label>

                <label>
                  Team B
                  <input
                    type="text"
                    value={editForm.teamB}
                    onChange={(e) => setEditForm({ ...editForm, teamB: e.target.value })}
                    required
                  />
                </label>
              </div>

              <div className="pp-input-row">
                <label>
                  Team A Score
                  <input
                    type="number"
                    value={editForm.scoreA}
                    onChange={(e) => setEditForm({ ...editForm, scoreA: parseInt(e.target.value) })}
                    required
                  />
                </label>

                <label>
                  Team B Score
                  <input
                    type="number"
                    value={editForm.scoreB}
                    onChange={(e) => setEditForm({ ...editForm, scoreB: parseInt(e.target.value) })}
                    required
                  />
                </label>
              </div>

              <div className="pp-input-row">
                <label>
                  Wickets Down
                  <input
                    type="number"
                    value={editForm.wickets}
                    onChange={(e) => setEditForm({ ...editForm, wickets: parseInt(e.target.value) })}
                    required
                  />
                </label>

                <label>
                  Overs Bowled
                  <input
                    type="number"
                    step="0.1"
                    value={editForm.overs}
                    onChange={(e) => setEditForm({ ...editForm, overs: parseFloat(e.target.value) })}
                    required
                  />
                </label>
              </div>

              <div className="pp-input-row">
                <label>
                  Ground / Venue
                  <input
                    type="text"
                    list="match-list-grounds-list"
                    value={editForm.groundName}
                    onChange={(e) => setEditForm({ ...editForm, groundName: e.target.value })}
                  />
                  <datalist id="match-list-grounds-list">
                    {selectedMatch && getGroundsForTournament(selectedMatch.tournament).map((g) => (
                      <option key={g} value={g} />
                    ))}
                  </datalist>
                </label>
              </div>

              <div className="pp-input-row">
                <label>
                  Scheduled Date
                  <input
                    type="date"
                    value={matchEditDate}
                    onChange={(e) => setMatchEditDate(e.target.value)}
                    required
                  />
                </label>

                <label>
                  Scheduled Time
                  <div className="msw-time-picker-box">
                    <FaClock style={{ color: "var(--text-secondary)", marginRight: "4px" }} />
                    <select
                      value={matchEditHour}
                      onChange={(e) => setMatchEditHour(e.target.value)}
                      className="msw-time-select"
                    >
                      {Array.from({ length: 12 }, (_, i) => String(i + 1)).map((h) => (
                        <option key={h} value={h}>{h.padStart(2, "0")}</option>
                      ))}
                    </select>
                    <span className="msw-time-separator">:</span>
                    <select
                      value={matchEditMinute}
                      onChange={(e) => setMatchEditMinute(e.target.value)}
                      className="msw-time-select"
                    >
                      {Array.from({ length: 60 }, (_, i) => String(i)).map((m) => (
                        <option key={m} value={m}>{m.padStart(2, "0")}</option>
                      ))}
                    </select>
                    <select
                      value={matchEditPeriod}
                      onChange={(e) => setMatchEditPeriod(e.target.value)}
                      className="msw-time-period-select"
                      style={{ marginLeft: "auto" }}
                    >
                      <option value="AM">AM</option>
                      <option value="PM">PM</option>
                    </select>
                  </div>
                </label>
              </div>

              <div className="pp-input-row">
                <label>
                  Overs Limit
                  <input
                    type="number"
                    value={editForm.maxOvers}
                    onChange={(e) => setEditForm({ ...editForm, maxOvers: parseFloat(e.target.value) })}
                    required
                  />
                </label>

                <label>
                  Match Round
                  <input
                    type="text"
                    value={editForm.round}
                    onChange={(e) => setEditForm({ ...editForm, round: e.target.value })}
                  />
                </label>
              </div>

              <div className="pp-input-row">
                <label>
                  Match Status
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                  >
                    <option value="UPCOMING">Upcoming</option>
                    <option value="LIVE">Live</option>
                    <option value="COMPLETED">Completed</option>
                  </select>
                </label>

                <label>
                  Declared Winner
                  <input
                    type="text"
                    placeholder="e.g. Team A"
                    value={editForm.winner}
                    onChange={(e) => setEditForm({ ...editForm, winner: e.target.value })}
                  />
                </label>
              </div>

              <div className="msw-actions-row" style={{ marginTop: "20px" }}>
                <button 
                  type="button" 
                  className="msw-secondary-btn" 
                  onClick={() => setShowEditModal(false)}
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

      {confirmDialog.isOpen && (
        <div className="custom-confirm-overlay">
          <div className="custom-confirm-card animate-scale-pop">
            <div className="custom-confirm-header">
              <FaInfoCircle className="custom-confirm-icon" />
              <h3>{confirmDialog.title}</h3>
            </div>
            <p className="custom-confirm-message">{confirmDialog.message}</p>
            <div className="custom-confirm-actions">
              <button 
                className="custom-confirm-btn cancel"
                onClick={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
              >
                Cancel
              </button>
              <button 
                className="custom-confirm-btn confirm"
                onClick={confirmDialog.onConfirm}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}

export default MatchList;
