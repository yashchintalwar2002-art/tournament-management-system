import React, { useCallback, useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import Layout from "../../components/Layout";
import API from "../../services/api";
import {
  FaBroadcastTower,
  FaCalendarAlt,
  FaGamepad,
  FaMedal,
  FaProjectDiagram,
  FaTrophy,
  FaUsers,
  FaEdit,
  FaMapMarkerAlt,
  FaClock,
  FaCoins,
  FaCogs,
  FaSyncAlt,
  FaInfoCircle,
  FaSitemap,
  FaFlagCheckered
} from "react-icons/fa";
import "./TournamentDetails.css";

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

function TournamentDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [tournament, setTournament] = useState(null);
  const [teams, setTeams] = useState([]);
  const [matches, setMatches] = useState([]);
  const [error, setError] = useState("");
  const [activeSubTab, setActiveSubTab] = useState("teams"); // teams, matches, pointsTable, insights, leaderboards, brackets
  
  // Leaderboards and bracket states
  const [leaderboard, setLeaderboard] = useState({ orangeCap: [], purpleCap: [], mvp: [] });
  const [expandedMatchId, setExpandedMatchId] = useState(null);
  const [hoveredTeam, setHoveredTeam] = useState(null);
  const [activeMobileTab, setActiveMobileTab] = useState("qf");

  // Edit states
  const [showEditModal, setShowEditModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    game: "",
    maxPlayers: 0,
    logo: "",
    organizer: "",
    description: "",
    city: "",
    ground: "",
    startDate: "",
    endDate: "",
    format: "T20",
    structure: "LEAGUE",
    entryFee: 0.0,
    maxTeams: 16,
    overs: 20,
    pointsForWin: 2,
    powerplayOvers: 6,
    superOver: false
  });

  const [showMatchEditModal, setShowMatchEditModal] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [matchEditDate, setMatchEditDate] = useState("");
  const [matchEditHour, setMatchEditHour] = useState("12");
  const [matchEditMinute, setMatchEditMinute] = useState("00");
  const [matchEditPeriod, setMatchEditPeriod] = useState("PM");
  const [matchEditForm, setMatchEditForm] = useState({
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

  const role = sessionStorage.getItem("role") || "PLAYER";
  const isAdmin = role === "ADMIN" || role === "ORGANIZER";
  const userEmail = sessionStorage.getItem("email");
  const isCreator = (() => {
    if (!isAdmin) return false;
    let creator = tournament?.createdBy;
    if (!creator) creator = "admin@gmail.com";
    return userEmail && creator.toLowerCase() === userEmail.toLowerCase();
  })();
  const hasWriteAccess = (() => {
    if (!isAdmin) return false;
    let creator = tournament?.createdBy;
    if (!creator) creator = "admin@gmail.com";
    if (userEmail && creator.toLowerCase() === userEmail.toLowerCase()) return true;
    const collaborators = tournament?.collaborators ? tournament.collaborators.split(",").filter(c => c.trim().length > 0) : [];
    return collaborators.some(collab => userEmail && collab.trim().toLowerCase() === userEmail.toLowerCase());
  })();

  const [showShareModal, setShowShareModal] = useState(false);
  const [shareEmail, setShareEmail] = useState("");
  const [shareLoading, setShareLoading] = useState(false);

  const [confirmModal, setConfirmModal] = useState({
    show: false,
    title: "Confirm Action",
    message: "",
    onConfirm: null
  });

  const [alertModal, setAlertModal] = useState({
    show: false,
    title: "Notification",
    message: ""
  });

  const triggerConfirm = (title, message, onConfirm) => {
    setConfirmModal({
      show: true,
      title,
      message,
      onConfirm
    });
  };

  const triggerAlert = (title, message) => {
    setAlertModal({
      show: true,
      title,
      message
    });
  };

  const handleShareAction = async (email, action) => {
    if (!email || !email.trim()) return;
    try {
      setShareLoading(true);
      const res = await API.put(`/tournaments/${id}/share`, null, {
        params: {
          email: email.trim(),
          action: action
        }
      });
      setTournament(res.data);
      setShareEmail("");
      triggerAlert("Success", `Collaborator ${action === "ADD" ? "added" : "removed"} successfully!`);
    } catch (err) {
      console.error("Error sharing tournament:", err);
      triggerAlert("Error", err.response?.data?.message || err.response?.data || "Failed to update collaborators.");
    } finally {
      setShareLoading(false);
    }
  };

  const collaboratorList = tournament?.collaborators ? tournament.collaborators.split(",").filter(c => c.trim().length > 0) : [];

  const handleDeleteTournament = () => {
    triggerConfirm(
      "Delete Tournament?",
      "Are you sure you want to delete this tournament? This will remove all associated matches, teams, and registrations. This action cannot be undone.",
      async () => {
        try {
          setLoading(true);
          setError("");
          await API.delete(`/tournaments/${id}`);
          navigate("/tournaments");
        } catch (err) {
          console.error("Delete tournament error:", err);
          setError("Failed to delete tournament.");
        } finally {
          setLoading(false);
        }
      }
    );
  };

  const fetchTournamentDetails = useCallback(async () => {
    try {
      const [tournamentRes, teamsRes, matchesRes, leaderboardRes] = await Promise.all([
        API.get(`/tournaments/${id}`),
        API.get(`/teams/tournament/${id}`),
        API.get(`/matches/tournament/${id}`),
        API.get(`/tournaments/${id}/leaderboard`).catch(err => {
          console.error("Leaderboard fetch error:", err);
          return { data: { orangeCap: [], purpleCap: [], mvp: [] } };
        })
      ]);

      setTournament(tournamentRes.data);
      setTeams(teamsRes.data);
      setMatches(matchesRes.data);
      setLeaderboard(leaderboardRes.data || { orangeCap: [], purpleCap: [], mvp: [] });
      
      // Seed edit form
      setEditForm({
        name: tournamentRes.data.name || "",
        game: tournamentRes.data.game || "",
        maxPlayers: tournamentRes.data.maxPlayers || 0,
        logo: tournamentRes.data.logo || "",
        organizer: tournamentRes.data.organizer || "",
        description: tournamentRes.data.description || "",
        city: tournamentRes.data.city || "",
        ground: tournamentRes.data.ground || "",
        startDate: tournamentRes.data.startDate || "",
        endDate: tournamentRes.data.endDate || "",
        format: tournamentRes.data.format || "T20",
        structure: tournamentRes.data.structure || "LEAGUE",
        entryFee: tournamentRes.data.entryFee || 0.0,
        maxTeams: tournamentRes.data.maxTeams || 16,
        overs: tournamentRes.data.overs || 20,
        pointsForWin: tournamentRes.data.pointsForWin || 2,
        powerplayOvers: tournamentRes.data.powerplayOvers || 6,
        superOver: tournamentRes.data.superOver || false
      });
      
      setError("");
    } catch (err) {
      console.error(err);
      setError("Failed to load tournament details.");
    }
  }, [id]);

  const getBracketMatches = (round) => matches.filter((m) => m.round === round);

  const getTeamLogo = (teamName) => {
    if (!teamName || teamName === "TBD") return "?";
    return teamName.substring(0, 2).toUpperCase();
  };

  const getTeamColor = (teamName) => {
    if (!teamName || teamName === "TBD") return "#475569";
    let hash = 0;
    for (let i = 0; i < teamName.length; i++) {
      hash = teamName.charCodeAt(i) + ((hash << 5) - hash);
    }
    const colors = [
      "linear-gradient(135deg, #3b82f6, #1d4ed8)",
      "linear-gradient(135deg, #ec4899, #be185d)",
      "linear-gradient(135deg, #10b981, #047857)",
      "linear-gradient(135deg, #f59e0b, #b45309)",
      "linear-gradient(135deg, #8b5cf6, #5b21b6)",
      "linear-gradient(135deg, #ef4444, #991b1b)",
      "linear-gradient(135deg, #06b6d4, #0891b2)"
    ];
    return colors[Math.abs(hash) % colors.length];
  };

  const renderBracketMatch = (match, label) => {
    const isCompleted = match.status === "COMPLETED";
    const isLive = match.status === "LIVE";
    const isExpanded = expandedMatchId === match.id;

    const isTeamAHovered = hoveredTeam && match.teamA === hoveredTeam;
    const isTeamBHovered = hoveredTeam && match.teamB === hoveredTeam;
    const isMatchHighlighted = isTeamAHovered || isTeamBHovered;

    return (
      <div className="bv-match-container animate-fade-in-up" key={match.id}>
        <div
          className={`bv-match-card ${isMatchHighlighted ? "highlighted-match" : ""} ${isLive ? "live-match" : ""}`}
          onClick={() => setExpandedMatchId(isExpanded ? null : match.id)}
          style={{ cursor: "pointer" }}
        >
          <div className="bv-match-label">{label}</div>

          <div className="bv-match-content">
            <div
              className={`bv-team-row ${isTeamAHovered ? "highlighted" : ""} ${match.winner === match.teamA ? "winner" : ""}`}
              onMouseEnter={() => match.teamA && match.teamA !== "TBD" && setHoveredTeam(match.teamA)}
              onMouseLeave={() => setHoveredTeam(null)}
            >
              <div className="bv-team-info">
                <span className="bv-team-avatar" style={{ background: getTeamColor(match.teamA) }}>
                  {getTeamLogo(match.teamA)}
                </span>
                <span className="bv-team-name">{match.teamA || "TBD"}</span>
              </div>
              <strong className="bv-score">{match.scoreA ?? "-"}</strong>
            </div>

            <div
              className={`bv-team-row ${isTeamBHovered ? "highlighted" : ""} ${match.winner === match.teamB ? "winner" : ""}`}
              onMouseEnter={() => match.teamB && match.teamB !== "TBD" && setHoveredTeam(match.teamB)}
              onMouseLeave={() => setHoveredTeam(null)}
            >
              <div className="bv-team-info">
                <span className="bv-team-avatar" style={{ background: getTeamColor(match.teamB) }}>
                  {getTeamLogo(match.teamB)}
                </span>
                <span className="bv-team-name">{match.teamB || "TBD"}</span>
              </div>
              <strong className="bv-score">{match.scoreB ?? "-"}</strong>
            </div>

            <div className="bv-result-row">
              {isLive ? (
                <span className="bv-live-indicator"><span className="live-pulse-dot" style={{ marginRight: "6px" }}></span> LIVE</span>
              ) : isCompleted ? (
                <span className="bv-completed-indicator">🏆 Winner: {match.winner}</span>
              ) : (
                <span className="bv-upcoming-indicator">📅 Scheduled Match</span>
              )}
            </div>
          </div>
        </div>

        {isExpanded && (
          <div className="bv-details-drawer animate-fade-in">
            <div className="bv-drawer-header">Match Overview</div>
            <div className="bv-drawer-grid">
              <div>
                <strong>Innings:</strong> <span>{match.currentInnings || 1}</span>
              </div>
              <div>
                <strong>Overs:</strong> <span>{match.overs || "0.0"}</span>
              </div>
              <div>
                <strong>Fours:</strong> <span>{match.fours || 0}</span>
              </div>
              <div>
                <strong>Sixes:</strong> <span>{match.sixes || 0}</span>
              </div>
              {match.status === "LIVE" && (
                <>
                  <div style={{ gridColumn: "span 2" }}>
                    <strong>Batsman:</strong> <span style={{ color: "#fff" }}>{match.currentBatsman || "Striker"}</span>
                  </div>
                  <div style={{ gridColumn: "span 2" }}>
                    <strong>Bowler:</strong> <span style={{ color: "#fff" }}>{match.currentBowler || "Bowler"}</span>
                  </div>
                </>
              )}
              <div style={{ gridColumn: "span 2", borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "6px", marginTop: "4px" }}>
                <strong>Last Ball Event:</strong> <span style={{ color: "var(--accent)" }}>{match.lastEvent || "-"}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  useEffect(() => {
    fetchTournamentDetails();
  }, [fetchTournamentDetails]);

  const handleAutoSchedule = async () => {
    try {
      setError("");
      await API.post(`/matches/auto-schedule/${id}`);
      fetchTournamentDetails();
      setActiveSubTab("matches");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to generate fixtures.");
    }
  };

  const handleUpdateTournament = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError("");
      const res = await API.put(`/tournaments/${id}`, editForm);
      setTournament(res.data);
      setShowEditModal(false);
      fetchTournamentDetails();
    } catch (err) {
      console.error(err);
      setError("Failed to update tournament parameters.");
    } finally {
      setLoading(false);
    }
  };

  const handleMatchEditSubmit = async (e) => {
    e.preventDefault();
    if (!selectedMatch) return;
    try {
      setLoading(true);
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
      const updatedForm = { ...matchEditForm, matchDate: combinedDate };
      await API.put(`/matches/${selectedMatch.id}`, updatedForm);
      setShowMatchEditModal(false);
      fetchTournamentDetails();
      triggerAlert("Success", "Match saved successfully!");
    } catch (err) {
      console.error(err);
      triggerAlert("Error", "Failed to update match.");
    } finally {
      setLoading(false);
    }
  };

  const getStatusClass = (status) => {
    if (status === "LIVE") return "td-status-live";
    if (status === "COMPLETED") return "td-status-completed";
    return "td-status-upcoming";
  };

  return (
    <Layout
      title="Tournament Details"
      subtitle="View teams, matches, bracket, and live score."
    >
      <div className="td-page">
        {error && <div className="td-error">{error}</div>}

        <div className="td-hero">
          <div className="td-hero-left">
            <div className="td-badge">
              <FaTrophy />
            </div>

            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <h2>{tournament?.name || "Tournament"}</h2>
                {hasWriteAccess && (
                  <button 
                    className="pp-edit-profile-btn" 
                    onClick={() => setShowEditModal(true)}
                    style={{ background: "rgba(245, 158, 11, 0.15)", color: "#fcd34d", border: "1px solid rgba(245, 158, 11, 0.3)" }}
                  >
                    <FaEdit /> Edit Settings
                  </button>
                )}
                {isCreator && (
                  <>
                    <button 
                      className="pp-edit-profile-btn" 
                      onClick={() => setShowShareModal(true)}
                      style={{ background: "rgba(99, 102, 241, 0.15)", color: "#c7d2fe", border: "1px solid rgba(99, 102, 241, 0.3)" }}
                    >
                      🤝 Share Access
                    </button>
                    <button 
                      className="pp-edit-profile-btn" 
                      onClick={handleDeleteTournament}
                      style={{ background: "rgba(239, 68, 68, 0.15)", color: "#fca5a5", border: "1px solid rgba(239, 68, 68, 0.3)" }}
                    >
                      🗑️ Delete Tournament
                    </button>
                  </>
                )}
              </div>
              <p style={{ margin: "4px 0 10px 0" }}>
                {tournament?.description || "Complete tournament overview for teams, matches, results, and live progress."}
              </p>

              <div className="td-meta" style={{ display: "flex", flexWrap: "wrap", gap: "12px", fontSize: "12px", color: "var(--text-secondary)" }}>
                <span>
                  <FaGamepad /> {tournament?.game || "Cricket"} ({tournament?.format || "T20"})
                </span>
                <span>
                  <FaUsers /> Max Teams: {tournament?.maxTeams || 16}
                </span>
                {tournament?.ground && (
                  <span>
                    <FaMapMarkerAlt /> {tournament?.ground}, {tournament?.city || "Grassroots"}
                  </span>
                )}
                {tournament?.startDate && (
                  <span>
                    <FaCalendarAlt /> {tournament?.startDate} to {tournament?.endDate || "TBD"}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="td-actions">
            <Link to={`/bracket-view/${id}`} className="td-primary-btn">
              <FaProjectDiagram /> View Bracket
            </Link>

            <Link to="/live-score" className="td-secondary-btn">
              <FaBroadcastTower /> Live Score
            </Link>

            <Link to="/matches" className="td-secondary-btn">
              <FaCalendarAlt /> Matches
            </Link>
          </div>
        </div>

        {/* Extended Stats Bar */}
        <div className="td-stats-grid">
          <div className="td-stat-card">
            <span>{teams.length}</span>
            <p>Teams Added</p>
          </div>

          <div className="td-stat-card">
            <span>{matches.length}</span>
            <p>Total Matches</p>
          </div>

          <div className="td-stat-card">
            <span>{matches.filter((m) => m.status === "LIVE").length}</span>
            <p>Live Matches</p>
          </div>

          <div className="td-stat-card">
            <span>{tournament?.overs || 20}</span>
            <p>Overs Limit</p>
          </div>
        </div>

        {/* Dynamic sub tab switches */}
        <div className="td-tab-switches" style={{ display: "flex", gap: "10px", margin: "20px 0 10px", borderBottom: "1px solid var(--border)", paddingBottom: "10px", flexWrap: "wrap" }}>
          {[
            { id: "teams", label: "Teams", count: teams.length },
            { id: "matches", label: "Matches / Fixtures", count: matches.length },
            { id: "pointsTable", label: "Points Table", count: null },
            { id: "leaderboards", label: "Leaderboards & Awards", count: null },
            { id: "brackets", label: "Tournament Bracket", count: null },
            { id: "insights", label: "Insights & Streaming", count: null },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id)}
              style={{
                background: activeSubTab === tab.id ? "linear-gradient(135deg, var(--primary), var(--accent-purple))" : "rgba(15, 23, 42, 0.4)",
                color: activeSubTab === tab.id ? "white" : "var(--text-secondary)",
                padding: "8px 16px",
                border: "none",
                borderRadius: "8px",
                fontWeight: "800",
                fontSize: "12px",
                cursor: "pointer",
                transition: "all 0.2s ease"
              }}
            >
              {tab.label} {tab.count !== null && `(${tab.count})`}
            </button>
          ))}
        </div>

        {/* Tab Content Display */}
        <div className="td-tab-content">
          {activeSubTab === "teams" && (
            <div className="td-card">
              <div className="td-card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <h3>Registered Teams</h3>
                  <p>Teams participating in this tournament.</p>
                </div>
                {hasWriteAccess && (
                  <Link 
                    to={`/add-teams?tournamentId=${id}`}
                    className="td-primary-btn"
                    style={{ padding: "8px 16px", fontSize: "12px", gap: "6px", display: "flex", alignItems: "center" }}
                  >
                    <FaUsers /> Register Team
                  </Link>
                )}
              </div>

              {teams.length > 0 ? (
                <div className="td-team-list">
                  {teams.map((team) => (
                    <div className="td-team-item" key={team.id}>
                      <div className="td-team-icon">
                        <FaUsers />
                      </div>
                      <div>
                        <h4>{team.teamName}</h4>
                        <p style={{ margin: 0, fontSize: "11px", color: "var(--text-secondary)" }}>
                          Jersey: <strong style={{ color: team.jerseyColor || "gray" }}>{team.jerseyColor || "Standard"}</strong> | Category: <strong>{team.category || "Leather Ball"}</strong>
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="td-empty">No teams added yet.</div>
              )}
            </div>
          )}

          {activeSubTab === "matches" && (
            <div className="td-card">
              <div className="td-card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
                <div>
                  <h3>Match Fixtures</h3>
                  <p>Generated matches, tournament schedules, and results.</p>
                </div>
                {matches.length === 0 && teams.length >= 2 && (
                  <button
                    onClick={handleAutoSchedule}
                    style={{
                      background: "linear-gradient(135deg, var(--warning), #d97706)",
                      color: "white",
                      padding: "8px 16px",
                      fontSize: "11px",
                      fontWeight: "800",
                      borderRadius: "6px",
                      border: "none",
                      cursor: "pointer"
                    }}
                  >
                    ⚡ Smart Auto-Schedule
                  </button>
                )}
              </div>

              {matches.length > 0 ? (
                <div className="td-match-grid-display" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "16px", marginTop: "14px" }}>
                  {matches.map((match) => (
                    <div className="td-match-item" key={match.id} style={{ margin: 0 }}>
                      <div className="td-match-top">
                        <div className="td-round-chip">
                          <FaMedal /> {match.round || "ROUND"}
                        </div>

                        <div className={`td-status-chip ${getStatusClass(match.status)}`}>
                          {match.status || "UPCOMING"}
                        </div>
                      </div>

                      <h4>
                        {match.teamA || "TBD"} vs {match.teamB || "TBD"}
                      </h4>

                      <div className="td-score-row">
                        <span>{match.teamA || "Team A"}</span>
                        <strong>{match.scoreA ?? 0} {match.currentInnings === 1 && match.status === "LIVE" ? `/${match.wickets}` : ""}</strong>
                      </div>

                      <div className="td-score-row">
                        <span>{match.teamB || "Team B"}</span>
                        <strong>{match.scoreB ?? 0} {match.currentInnings === 2 && match.status === "LIVE" ? `/${match.wickets}` : ""}</strong>
                      </div>

                      <p className="td-winner">Winner: {match.winner || (match.status === "LIVE" ? "Match Live 🏏" : "Pending")}</p>

                      <div className="td-match-footer-info" style={{ marginTop: "12px", borderTop: "1px solid rgba(255, 255, 255, 0.05)", paddingTop: "8px", display: "grid", gap: "6px", fontSize: "11px", color: "var(--text-secondary)" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <FaCalendarAlt />
                          <span>{formatMatchDateTime(match.matchDate)}</span>
                        </div>
                        {match.groundName && (
                          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <FaMapMarkerAlt />
                            <span>{match.groundName}</span>
                          </div>
                        )}
                      </div>
                      {hasWriteAccess && (
                        <button
                          onClick={() => {
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
                            setMatchEditForm({
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
                            setShowMatchEditModal(true);
                          }}
                          style={{
                            marginTop: "10px",
                            width: "100%",
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
                            gap: "6px",
                            fontWeight: "800",
                            transition: "all 0.2s"
                          }}
                        >
                          <FaEdit /> Edit Match Details
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="td-empty">
                  No fixtures scheduled yet. Use Smart Auto-Schedule to draw matches.
                </div>
              )}
            </div>
          )}

          {activeSubTab === "pointsTable" && (
            <div className="td-card">
              <div className="td-card-header">
                <h3>Tournament Standings</h3>
                <p>Dynamic Points Table updated live from completed league results.</p>
              </div>

              <div className="td-table-wrapper" style={{ overflowX: "auto", marginTop: "14px" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
                  <thead>
                    <tr style={{ borderBottom: "2px solid var(--border)", color: "var(--text-secondary)", height: "36px" }}>
                      <th style={{ padding: "8px" }}>Team</th>
                      <th style={{ padding: "8px", textAlign: "center" }}>P</th>
                      <th style={{ padding: "8px", textAlign: "center" }}>W</th>
                      <th style={{ padding: "8px", textAlign: "center" }}>L</th>
                      <th style={{ padding: "8px", textAlign: "center" }}>T</th>
                      <th style={{ padding: "8px", textAlign: "center" }}>NRR</th>
                      <th style={{ padding: "8px", textAlign: "center" }}>PTS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      const getTeamBattingFirst = (match) => {
                        const { teamA, teamB, tossWinner, tossDecision } = match;
                        if (tossWinner && tossWinner.trim()) {
                          const isAWin = tossWinner.toLowerCase() === teamA.toLowerCase();
                          if (isAWin) {
                            if (tossDecision && tossDecision.toUpperCase() === "BOWL") {
                              return teamB;
                            }
                          } else {
                            if (tossDecision && tossDecision.toUpperCase() === "BAT") {
                              return teamB;
                            }
                          }
                        }
                        return teamA;
                      };

                      const getRealOvers = (oversVal, wickets, maxOvers) => {
                        const max = maxOvers || 20.0;
                        if (wickets >= 10) {
                          return max;
                        }
                        if (!oversVal) {
                          return 0.0;
                        }
                        const completedOvers = Math.floor(oversVal);
                        const balls = Math.round((oversVal - completedOvers) * 10);
                        const totalBalls = completedOvers * 6 + balls;
                        return totalBalls / 6.0;
                      };

                      const standings = teams.map((team) => {
                        const teamMatches = matches.filter(
                          (m) =>
                            m.status === "COMPLETED" &&
                            (m.teamA === team.teamName || m.teamB === team.teamName)
                        );
                        
                        let won = 0;
                        let lost = 0;
                        let tied = 0;
                        let totalRunsScored = 0;
                        let totalOversFaced = 0;
                        let totalRunsConceded = 0;
                        let totalOversBowled = 0;

                        teamMatches.forEach((m) => {
                          const isTeamA = m.teamA === team.teamName;
                          
                          if (m.winner === team.teamName) {
                            won++;
                          } else if (!m.winner || m.winner.toUpperCase() === "TIE" || m.winner.toUpperCase() === "DRAW") {
                            tied++;
                          } else {
                            lost++;
                          }

                          const runsScored = isTeamA ? (m.scoreA || 0) : (m.scoreB || 0);
                          const runsConceded = isTeamA ? (m.scoreB || 0) : (m.scoreA || 0);
                          
                          const firstBat = getTeamBattingFirst(m);
                          const isFirstBat = team.teamName.toLowerCase() === firstBat.toLowerCase();
                          
                          const wicketsLost = isFirstBat ? (m.firstInningsWickets || 0) : (m.wickets || 0);
                          const wicketsTaken = isFirstBat ? (m.wickets || 0) : (m.firstInningsWickets || 0);

                          const oversFacedVal = isFirstBat ? (m.firstInningsOvers || 0) : (m.overs || 0);
                          const oversBowledVal = isFirstBat ? (m.overs || 0) : (m.firstInningsOvers || 0);

                          const maxOvers = m.maxOvers || 20.0;

                          const realOversFaced = getRealOvers(oversFacedVal, wicketsLost, maxOvers);
                          const realOversBowled = getRealOvers(oversBowledVal, wicketsTaken, maxOvers);

                          totalRunsScored += runsScored;
                          totalOversFaced += realOversFaced;
                          totalRunsConceded += runsConceded;
                          totalOversBowled += realOversBowled;
                        });

                        const points = won * 2 + tied * 1;
                        const runRateFor = totalOversFaced > 0 ? totalRunsScored / totalOversFaced : 0;
                        const runRateAgainst = totalOversBowled > 0 ? totalRunsConceded / totalOversBowled : 0;
                        const nrr = runRateFor - runRateAgainst;

                        return {
                          name: team.teamName,
                          played: teamMatches.length,
                          won,
                          lost,
                          tied,
                          nrr: nrr.toFixed(3),
                          pts: points,
                        };
                      }).sort((a, b) => b.pts - a.pts || parseFloat(b.nrr) - parseFloat(a.nrr));

                      if (standings.length === 0) {
                        return (
                          <tr>
                            <td colSpan="7" style={{ textAlign: "center", padding: "20px", color: "var(--text-secondary)" }}>
                              No teams registered.
                            </td>
                          </tr>
                        );
                      }

                      return standings.map((row, idx) => (
                        <tr key={idx} style={{ borderBottom: "1px solid var(--border)", height: "40px" }}>
                          <td style={{ padding: "8px", fontWeight: "800", color: "var(--text-primary)" }}>{row.name}</td>
                          <td style={{ padding: "8px", textAlign: "center" }}>{row.played}</td>
                          <td style={{ padding: "8px", textAlign: "center", color: "var(--accent)" }}>{row.won}</td>
                          <td style={{ padding: "8px", textAlign: "center", color: "var(--danger)" }}>{row.lost}</td>
                          <td style={{ padding: "8px", textAlign: "center", color: "var(--text-secondary)" }}>{row.tied}</td>
                          <td style={{ padding: "8px", textAlign: "center" }}>{row.nrr}</td>
                          <td style={{ padding: "8px", textAlign: "center", fontWeight: "900", color: "var(--warning)" }}>{row.pts}</td>
                        </tr>
                      ));
                    })()}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeSubTab === "insights" && (
            <div className="td-grid-insights" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px" }}>
              {/* Mock Video Live Stream */}
              <div className="td-card">
                <div className="td-card-header">
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <h3>CricStream Live</h3>
                    <span className="live-pulse-dot" style={{ background: "red", boxShadow: "0 0 6px red", padding: "3px 8px", borderRadius: "4px", fontSize: "9px", color: "white", fontWeight: "900" }}>LIVE</span>
                  </div>
                  <p>Broadcasting match-day highlights and overlays.</p>
                </div>
                
                <div className="stream-player-mock" style={{ position: "relative", width: "100%", height: "200px", borderRadius: "10px", background: "#0f172a", border: "1px solid var(--border)", marginTop: "14px", display: "grid", placeItems: "center" }}>
                  <div style={{ textAlign: "center", color: "var(--text-secondary)" }}>
                    <div style={{ fontSize: "36px", marginBottom: "8px" }}>📺</div>
                    <strong>Broadcast Feed Offline</strong>
                    <p style={{ fontSize: "11px", margin: "4px 0 0" }}>Start a live match to establish WebSocket streaming.</p>
                  </div>
                </div>
              </div>

              {/* AI Post-Match Insights */}
              <div className="td-card">
                <div className="td-card-header">
                  <h3>AI Match Analyst Insights</h3>
                  <p>Automated summary analytics from league stats.</p>
                </div>

                <div className="ai-insights-box" style={{ marginTop: "14px", display: "grid", gap: "10px" }}>
                  {matches.filter((m) => m.status === "COMPLETED").length === 0 ? (
                    <div className="td-empty" style={{ margin: 0, padding: "20px" }}>
                      AI Analyst: No completed matches found to analyze performance metrics. Complete matches to generate insights.
                    </div>
                  ) : (
                    (() => {
                      const completed = matches.filter((m) => m.status === "COMPLETED");
                      const topWinner = completed[0].winner;
                      return (
                        <div style={{ background: "rgba(99, 102, 241, 0.05)", border: "1px solid rgba(99, 102, 241, 0.2)", borderRadius: "10px", padding: "14px" }}>
                          <span style={{ fontSize: "10px", fontWeight: "900", color: "var(--primary)", textTransform: "uppercase" }}>AI MATCH REPORT</span>
                          <h4 style={{ margin: "6px 0 8px", fontSize: "14px" }}>Dominance Tracker</h4>
                          <p style={{ fontSize: "13px", color: "var(--text-secondary)", margin: 0, lineHeight: 1.5 }}>
                            Team <strong>{topWinner}</strong> is currently dominating league rounds. Run rate statistics suggest their opening batsman shows strong strike consistency. Future brackets recommend tight spin bowling lines to restrict run accumulation.
                          </p>
                        </div>
                      );
                    })()
                  )}
                </div>
              </div>
            </div>
          )}

          {activeSubTab === "leaderboards" && (
            <div className="td-leaderboards-tab animate-fade-in-up">
              <div className="td-card" style={{ marginBottom: "20px" }}>
                <div className="td-card-header">
                  <h3>Tournament Leaderboards & Awards</h3>
                  <p>Top batsmen, top bowlers, and MVP player statistics for the tournament.</p>
                </div>

                <div className="leaderboards-grid">
                  {/* 1. Orange Cap Card */}
                  <div className="leaderboard-cap-card orange-cap">
                    <div className="cap-card-header">
                      <span className="cap-badge">🟠 Orange Cap</span>
                      <h4>Top Run Scorers</h4>
                    </div>
                    <div className="cap-list">
                      {!leaderboard.orangeCap || leaderboard.orangeCap.length === 0 ? (
                        <div className="no-cap-data">No batting stats recorded yet.</div>
                      ) : (
                        leaderboard.orangeCap.map((player, idx) => (
                          <div className="cap-player-row" key={player.id || idx}>
                            <span className={`cap-rank rank-${idx + 1}`}>{idx + 1}</span>
                            <div className="cap-player-details">
                              <span className="player-name">{player.playerName}</span>
                              <span className="player-team">{player.team?.teamName || "Grassroots Team"}</span>
                            </div>
                            <div className="cap-stat">
                              <strong>{player.battingRuns || 0}</strong>
                              <span>Runs ({player.matchesPlayed || 0} matches)</span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* 2. Purple Cap Card */}
                  <div className="leaderboard-cap-card purple-cap">
                    <div className="cap-card-header">
                      <span className="cap-badge">🟣 Purple Cap</span>
                      <h4>Top Wicket Takers</h4>
                    </div>
                    <div className="cap-list">
                      {!leaderboard.purpleCap || leaderboard.purpleCap.length === 0 ? (
                        <div className="no-cap-data">No bowling stats recorded yet.</div>
                      ) : (
                        leaderboard.purpleCap.map((player, idx) => (
                          <div className="cap-player-row" key={player.id || idx}>
                            <span className={`cap-rank rank-${idx + 1}`}>{idx + 1}</span>
                            <div className="cap-player-details">
                              <span className="player-name">{player.playerName}</span>
                              <span className="player-team">{player.team?.teamName || "Grassroots Team"}</span>
                            </div>
                            <div className="cap-stat">
                              <strong>{player.bowlingWickets || 0}</strong>
                              <span>Wickets ({player.matchesPlayed || 0} matches)</span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* 3. MVP Card */}
                  <div className="leaderboard-cap-card mvp-cap">
                    <div className="cap-card-header">
                      <span className="cap-badge">🏆 MVP Standings</span>
                      <h4>Most Valuable Player</h4>
                    </div>
                    <div className="cap-list">
                      {!leaderboard.mvp || leaderboard.mvp.length === 0 ? (
                        <div className="no-cap-data">No stats recorded yet.</div>
                      ) : (
                        leaderboard.mvp.map((player, idx) => {
                          const runs = player.battingRuns || 0;
                          const wickets = player.bowlingWickets || 0;
                          const points = (runs * 1.0) + (wickets * 20.0);
                          return (
                            <div className="cap-player-row" key={player.id || idx}>
                              <span className={`cap-rank rank-${idx + 1}`}>{idx + 1}</span>
                              <div className="cap-player-details">
                                <span className="player-name">{player.playerName}</span>
                                <span className="player-team">{player.team?.teamName || "Grassroots Team"}</span>
                              </div>
                              <div className="cap-stat">
                                <strong>{points.toFixed(0)}</strong>
                                <span>Points ({runs}R / {wickets}W)</span>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeSubTab === "brackets" && (
            <div className="td-card animate-fade-in-up">
              <div className="td-card-header">
                <h3>Tournament Bracket Diagram</h3>
                <p>Visual tree progression of knockout rounds.</p>
              </div>
              {(() => {
                const quarterFinals = getBracketMatches("QUARTER_FINAL");
                const semiFinals = getBracketMatches("SEMI_FINAL");
                const finals = getBracketMatches("FINAL");
                const champion = finals.length > 0 && finals[0].winner ? finals[0].winner : "TBD";

                return (
                  <div className="bv-page" style={{ gap: "16px", marginTop: "14px" }}>
                    <div className="bv-mobile-tabs" style={{ display: "flex", marginBottom: "15px" }}>
                      <button className={activeMobileTab === "qf" ? "active" : ""} onClick={() => setActiveMobileTab("qf")}>QF</button>
                      <button className={activeMobileTab === "sf" ? "active" : ""} onClick={() => setActiveMobileTab("sf")}>SF</button>
                      <button className={activeMobileTab === "f" ? "active" : ""} onClick={() => setActiveMobileTab("f")}>Final</button>
                      <button className={activeMobileTab === "champ" ? "active" : ""} onClick={() => setActiveMobileTab("champ")}>Champion</button>
                    </div>

                    <div className="bv-bracket">
                      <div className={`bv-column ${activeMobileTab === "qf" ? "mobile-visible" : "mobile-hidden"}`}>
                        <div className="bv-column-title purple-title">QUARTER FINALS</div>
                        {quarterFinals.length > 0 ? (
                          quarterFinals.map((m, index) => renderBracketMatch(m, `QF ${index + 1}`))
                        ) : (
                          <div className="bv-empty" style={{ margin: 0, height: "80px", minHeight: "80px" }}>No QF matches found.</div>
                        )}
                      </div>

                      <div className={`bv-column bv-semi-column ${activeMobileTab === "sf" ? "mobile-visible" : "mobile-hidden"}`}>
                        <div className="bv-column-title blue-title">SEMI FINALS</div>
                        {semiFinals.length > 0 ? (
                          semiFinals.map((m, index) => renderBracketMatch(m, `SF ${index + 1}`))
                        ) : (
                          <>
                            <div className="bv-placeholder-match">SF 1<br />TBD vs TBD</div>
                            <div className="bv-placeholder-match">SF 2<br />TBD vs TBD</div>
                          </>
                        )}
                      </div>

                      <div className={`bv-column ${activeMobileTab === "f" ? "mobile-visible" : "mobile-hidden"}`}>
                        <div className="bv-column-title purple-title">FINAL</div>
                        {finals.length > 0 ? (
                          finals.map((m) => renderBracketMatch(m, "F"))
                        ) : (
                          <div className="bv-placeholder-match">Final Match<br />TBD vs TBD</div>
                        )}
                      </div>

                      <div className={`bv-column ${activeMobileTab === "champ" ? "mobile-visible" : "mobile-hidden"}`}>
                        <div className="bv-column-title gold-title">CHAMPION</div>
                        <div className="bv-champion-card">
                          <div className="bv-trophy">🏆</div>
                          <h2 style={{ fontSize: "14px", fontWeight: "900", letterSpacing: "0.05em", color: "#fbbf24" }}>⭐ CHAMPION ⭐</h2>
                          <div className="bv-champion-name">{champion}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      </div>

      {/* Edit Tournament Modal */}
      {showEditModal && (
        <div className="msw-modal-overlay">
          <div className="msw-modal-content" style={{ maxWidth: "600px" }}>
            <h3>Configure Tournament Rules</h3>
            <p>Modify venues, formats, dates, overs, and registration fees.</p>

            <form onSubmit={handleUpdateTournament} className="pp-form" style={{ maxWidth: "100%" }}>
              <div className="pp-input-row">
                <label>
                  Tournament Name
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    required
                  />
                </label>
              </div>

              <div className="pp-input-row">
                <label>
                  Sport/Game
                  <input
                    type="text"
                    value={editForm.game}
                    onChange={(e) => setEditForm({ ...editForm, game: e.target.value })}
                    required
                  />
                </label>

                <label>
                  Max Teams
                  <input
                    type="number"
                    value={editForm.maxTeams}
                    onChange={(e) => setEditForm({ ...editForm, maxTeams: parseInt(e.target.value) })}
                    required
                  />
                </label>
              </div>

              <div className="pp-input-row">
                <label>
                  Ground / Ground Name
                  <input
                    type="text"
                    placeholder="e.g. Lord's"
                    value={editForm.ground}
                    onChange={(e) => setEditForm({ ...editForm, ground: e.target.value })}
                  />
                </label>

                <label>
                  City
                  <input
                    type="text"
                    value={editForm.city}
                    onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                  />
                </label>
              </div>

              <div className="pp-input-row">
                <label>
                  Start Date
                  <input
                    type="date"
                    value={editForm.startDate}
                    onChange={(e) => setEditForm({ ...editForm, startDate: e.target.value })}
                  />
                </label>

                <label>
                  End Date
                  <input
                    type="date"
                    value={editForm.endDate}
                    onChange={(e) => setEditForm({ ...editForm, endDate: e.target.value })}
                  />
                </label>
              </div>

              <div className="pp-input-row">
                <label>
                  Match Format
                  <select
                    value={editForm.format}
                    onChange={(e) => setEditForm({ ...editForm, format: e.target.value })}
                  >
                    <option value="T10">T10 League</option>
                    <option value="T20">T20 International</option>
                    <option value="ODI">One Day (50 overs)</option>
                    <option value="Custom">Custom overs</option>
                  </select>
                </label>

                <label>
                  Overs Limit (per innings)
                  <input
                    type="number"
                    value={editForm.overs}
                    onChange={(e) => setEditForm({ ...editForm, overs: parseInt(e.target.value) })}
                    required
                  />
                </label>
              </div>

              <div className="pp-input-row">
                <label>
                  Entry Fee ($)
                  <input
                    type="number"
                    step="0.01"
                    value={editForm.entryFee}
                    onChange={(e) => setEditForm({ ...editForm, entryFee: parseFloat(e.target.value) })}
                  />
                </label>

                <label>
                  Organizer Name
                  <input
                    type="text"
                    value={editForm.organizer}
                    onChange={(e) => setEditForm({ ...editForm, organizer: e.target.value })}
                  />
                </label>
              </div>

              <div className="pp-input-row">
                <label>
                  Tournament Description
                  <textarea
                    rows={2}
                    value={editForm.description}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    style={{
                      border: "1px solid var(--border)",
                      borderRadius: "8px",
                      padding: "8px 12px",
                      background: "rgba(15, 23, 42, 0.6)",
                      color: "var(--text-primary)",
                      fontFamily: "inherit",
                      fontSize: "13px",
                      outline: "none"
                    }}
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
                  disabled={loading}
                >
                  {loading ? "Saving..." : "Save Configuration"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Edit Match Modal */}
      {showMatchEditModal && (
        <div className="msw-modal-overlay">
          <div className="msw-modal-content" style={{ maxWidth: "580px" }}>
            <h3>Edit Match Details</h3>
            <p>Update teams, scores, live wickets, scheduled dates/time, and match status.</p>

            <form onSubmit={handleMatchEditSubmit} className="pp-form" style={{ maxWidth: "100%" }}>
              <div className="pp-input-row">
                <label>
                  Team A
                  <input
                    type="text"
                    value={matchEditForm.teamA}
                    onChange={(e) => setMatchEditForm({ ...matchEditForm, teamA: e.target.value })}
                    required
                  />
                </label>

                <label>
                  Team B
                  <input
                    type="text"
                    value={matchEditForm.teamB}
                    onChange={(e) => setMatchEditForm({ ...matchEditForm, teamB: e.target.value })}
                    required
                  />
                </label>
              </div>

              <div className="pp-input-row">
                <label>
                  Team A Score
                  <input
                    type="number"
                    value={matchEditForm.scoreA}
                    onChange={(e) => setMatchEditForm({ ...matchEditForm, scoreA: parseInt(e.target.value) || 0 })}
                    required
                  />
                </label>

                <label>
                  Team B Score
                  <input
                    type="number"
                    value={matchEditForm.scoreB}
                    onChange={(e) => setMatchEditForm({ ...matchEditForm, scoreB: parseInt(e.target.value) || 0 })}
                    required
                  />
                </label>
              </div>

              <div className="pp-input-row">
                <label>
                  Wickets Down
                  <input
                    type="number"
                    value={matchEditForm.wickets}
                    onChange={(e) => setMatchEditForm({ ...matchEditForm, wickets: parseInt(e.target.value) || 0 })}
                    required
                  />
                </label>

                <label>
                  Overs Bowled
                  <input
                    type="number"
                    step="0.1"
                    value={matchEditForm.overs}
                    onChange={(e) => setMatchEditForm({ ...matchEditForm, overs: parseFloat(e.target.value) || 0.0 })}
                    required
                  />
                </label>
              </div>

              <div className="pp-input-row">
                <label>
                  Ground / Venue
                  <input
                    type="text"
                    list="edit-grounds-list"
                    value={matchEditForm.groundName}
                    onChange={(e) => setMatchEditForm({ ...matchEditForm, groundName: e.target.value })}
                  />
                  <datalist id="edit-grounds-list">
                    {Array.from(new Set(getGroundsForTournament(tournament))).map((g) => (
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
                    value={matchEditForm.maxOvers}
                    onChange={(e) => setMatchEditForm({ ...matchEditForm, maxOvers: parseFloat(e.target.value) || 20.0 })}
                    required
                  />
                </label>

                <label>
                  Match Round
                  <input
                    type="text"
                    value={matchEditForm.round}
                    onChange={(e) => setMatchEditForm({ ...matchEditForm, round: e.target.value })}
                  />
                </label>
              </div>

              <div className="pp-input-row">
                <label>
                  Match Status
                  <select
                    value={matchEditForm.status}
                    onChange={(e) => setMatchEditForm({ ...matchEditForm, status: e.target.value })}
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
                    value={matchEditForm.winner}
                    onChange={(e) => setMatchEditForm({ ...matchEditForm, winner: e.target.value })}
                  />
                </label>
              </div>

              <div className="msw-actions-row" style={{ marginTop: "20px" }}>
                <button 
                  type="button" 
                  className="msw-secondary-btn" 
                  onClick={() => setShowMatchEditModal(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="msw-primary-btn" 
                  style={{ background: "#f59e0b" }}
                  disabled={loading}
                >
                  {loading ? "Saving..." : "Save Match"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Share Tournament Modal */}
      {showShareModal && (
        <div className="msw-modal-overlay">
          <div className="msw-modal-content" style={{ maxWidth: "450px" }}>
            <h3>Manage Tournament Access</h3>
            <p>Add other admins or organizers to allow them to edit settings, manage matches, teams, and scores.</p>

            <div style={{ marginTop: "15px", display: "grid", gap: "12px" }}>
              <div style={{ display: "flex", gap: "8px" }}>
                <input
                  type="email"
                  placeholder="Enter admin/organizer email"
                  value={shareEmail}
                  onChange={(e) => setShareEmail(e.target.value)}
                  style={{
                    flex: 1,
                    border: "1px solid var(--border)",
                    borderRadius: "8px",
                    padding: "8px 12px",
                    background: "rgba(15, 23, 42, 0.6)",
                    color: "var(--text-primary)",
                    fontSize: "13px",
                    outline: "none"
                  }}
                />
                <button
                  type="button"
                  onClick={() => handleShareAction(shareEmail, "ADD")}
                  disabled={shareLoading || !shareEmail.trim()}
                  style={{
                    background: "linear-gradient(135deg, var(--primary), var(--accent-purple))",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    padding: "8px 16px",
                    fontWeight: "800",
                    fontSize: "12px",
                    cursor: "pointer"
                  }}
                >
                  {shareLoading ? "Adding..." : "Add"}
                </button>
              </div>

              <div style={{ marginTop: "10px" }}>
                <h4 style={{ fontSize: "12px", color: "var(--text-secondary)", marginBottom: "6px" }}>Collaborators with Access:</h4>
                {collaboratorList.length === 0 ? (
                  <div style={{ fontSize: "12px", color: "var(--text-secondary)", fontStyle: "italic" }}>No collaborators added yet. Only you have access.</div>
                ) : (
                  <div style={{ display: "grid", gap: "6px" }}>
                    {collaboratorList.map((collab) => (
                      <div key={collab} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(255,255,255,0.05)", padding: "6px 12px", borderRadius: "6px" }}>
                        <span style={{ fontSize: "13px", color: "var(--text-primary)" }}>{collab}</span>
                        <button
                          type="button"
                          onClick={() => handleShareAction(collab, "REMOVE")}
                          disabled={shareLoading}
                          style={{
                            background: "transparent",
                            border: "none",
                            color: "var(--danger)",
                            fontSize: "12px",
                            cursor: "pointer",
                            fontWeight: "800"
                          }}
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="msw-actions-row" style={{ marginTop: "20px" }}>
              <button
                type="button"
                className="msw-secondary-btn"
                onClick={() => setShowShareModal(false)}
                style={{ width: "100%" }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Premium 3D Confirm Modal */}
      {confirmModal.show && (
        <div className="custom-premium-modal-overlay">
          <div className="custom-premium-modal-card">
            <div className="modal-3d-glow"></div>
            <div className="modal-header-icon">⚠️</div>
            <h3>{confirmModal.title}</h3>
            <p>{confirmModal.message}</p>
            <div className="modal-actions">
              <button 
                className="modal-btn-cancel" 
                onClick={() => setConfirmModal({ ...confirmModal, show: false })}
              >
                Cancel
              </button>
              <button 
                className="modal-btn-confirm" 
                onClick={() => {
                  if (confirmModal.onConfirm) confirmModal.onConfirm();
                  setConfirmModal({ ...confirmModal, show: false });
                }}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Premium 3D Alert Modal */}
      {alertModal.show && (
        <div className="custom-premium-modal-overlay">
          <div className="custom-premium-modal-card">
            <div className="modal-3d-glow"></div>
            <div className="modal-header-icon alert-icon">ℹ️</div>
            <h3>{alertModal.title}</h3>
            <p>{alertModal.message}</p>
            <div className="modal-actions">
              <button 
                className="modal-btn-confirm" 
                onClick={() => setAlertModal({ ...alertModal, show: false })}
                style={{ width: "100%" }}
              >
                Okay
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}

export default TournamentDetails;
