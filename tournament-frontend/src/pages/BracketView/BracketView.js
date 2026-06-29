import React, { useEffect, useState, useCallback } from "react";
import API from "../../services/api";
import { useParams } from "react-router-dom";
import {
  FaTrophy,
  FaUsers,
  FaSitemap,
  FaFlagCheckered,
  FaSyncAlt,
  FaInfoCircle,
} from "react-icons/fa";
import Layout from "../../components/Layout";
import "./BracketView.css";

function BracketView() {
  const { tournamentId } = useParams();

  const [matches, setMatches] = useState([]);
  const [teams, setTeams] = useState([]);
  const [error, setError] = useState("");
  const [hoveredTeam, setHoveredTeam] = useState(null);
  const [expandedMatchId, setExpandedMatchId] = useState(null);
  const [activeMobileTab, setActiveMobileTab] = useState("qf");
  const [connections, setConnections] = useState([]);

  const fetchBracket = useCallback(async () => {
    try {
      const matchRes = await API.get(`/matches/tournament/${tournamentId}`);
      const teamRes = await API.get(`/teams/tournament/${tournamentId}`);
      setMatches(matchRes.data);
      setTeams(teamRes.data);
      setError("");
    } catch (err) {
      console.error(err);
      setError("Failed to load bracket ❌");
    }
  }, [tournamentId]);

  useEffect(() => {
    fetchBracket();
  }, [fetchBracket]);

  const getMatches = useCallback((round) => matches.filter((m) => m.round === round), [matches]);

  const quarterFinals = getMatches("QUARTER_FINAL");
  const semiFinals = getMatches("SEMI_FINAL");
  const finals = getMatches("FINAL");

  const updatePaths = useCallback(() => {
    if (window.innerWidth < 980) {
      setConnections([]);
      return;
    }

    const parentEl = document.querySelector(".bv-bracket");
    if (!parentEl) return;

    const parentRect = parentEl.getBoundingClientRect();
    const paths = [];

    const getConnectorPath = (startEl, endEl, teamName) => {
      if (!startEl || !endEl) return null;
      const startRect = startEl.getBoundingClientRect();
      const endRect = endEl.getBoundingClientRect();

      const x1 = startRect.right - parentRect.left;
      const y1 = startRect.top + startRect.height / 2 - parentRect.top;
      const x2 = endRect.left - parentRect.left;
      const y2 = endRect.top + endRect.height / 2 - parentRect.top;

      const dx = x2 - x1;
      const mx = x1 + dx / 2;
      const d = `M ${x1} ${y1} H ${mx} V ${y2} H ${x2}`;

      const isHighlighted = hoveredTeam && teamName && teamName !== "TBD" && teamName === hoveredTeam;
      const isCompleted = teamName && teamName !== "TBD";

      return { d, highlighted: isHighlighted, completed: isCompleted };
    };

    // 1. Connect Quarter Finals to Semi Finals (QF 1 & QF 2 -> SF 1, QF 3 & QF 4 -> SF 2)
    for (let i = 0; i < 4; i++) {
      const qfEl = document.getElementById(`match-qf-${i}`);
      const sfIndex = i < 2 ? 0 : 1;
      const sfEl = document.getElementById(`match-sf-${sfIndex}`);
      
      if (qfEl && sfEl) {
        const qfMatch = quarterFinals[i];
        const winner = qfMatch ? qfMatch.winner : null;
        const path = getConnectorPath(qfEl, sfEl, winner);
        if (path) paths.push(path);
      }
    }

    // 2. Connect Semi Finals to Finals (SF 1 & SF 2 -> F 1)
    for (let i = 0; i < 2; i++) {
      const sfEl = document.getElementById(`match-sf-${i}`);
      const fEl = document.getElementById(`match-f-0`);
      
      if (sfEl && fEl) {
        const sfMatch = semiFinals[i];
        const winner = sfMatch ? sfMatch.winner : null;
        const path = getConnectorPath(sfEl, fEl, winner);
        if (path) paths.push(path);
      }
    }

    // 3. Connect Finals to Champion Card
    const fEl = document.getElementById(`match-f-0`);
    const champEl = document.getElementById(`match-champion`);
    if (fEl && champEl) {
      const fMatch = finals[0];
      const winner = fMatch ? fMatch.winner : null;
      const path = getConnectorPath(fEl, champEl, winner);
      if (path) paths.push(path);
    }

    setConnections(paths);
  }, [quarterFinals, semiFinals, finals, hoveredTeam]);

  useEffect(() => {
    const timer = setTimeout(updatePaths, 150);
    return () => clearTimeout(timer);
  }, [matches, hoveredTeam, expandedMatchId, updatePaths]);

  useEffect(() => {
    window.addEventListener("resize", updatePaths);
    return () => window.removeEventListener("resize", updatePaths);
  }, [updatePaths]);

  const champion = finals.length > 0 && finals[0].winner ? finals[0].winner : "TBD";
  const completedCount = matches.filter((m) => m.status === "COMPLETED").length;

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

  const renderMatch = (match, label, domId) => {
    const isCompleted = match.status === "COMPLETED";
    const isLive = match.status === "LIVE";
    const isExpanded = expandedMatchId === match.id;

    const isTeamAHovered = hoveredTeam && match.teamA === hoveredTeam;
    const isTeamBHovered = hoveredTeam && match.teamB === hoveredTeam;
    const isMatchHighlighted = isTeamAHovered || isTeamBHovered;

    return (
      <div className="bv-match-container animate-fade-in-up" key={match.id} id={domId}>
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

  return (
    <Layout
      title="Bracket View"
      subtitle="Track the tournament progress from quarter finals to champion"
    >
      <div className="bv-page">
        <div className="bv-stats animate-fade-in-up">
          <div className="bv-stat-item">
            <div className="bv-stat-icon purple">
              <FaUsers />
            </div>
            <div>
              <h3>{teams.length}</h3>
              <p>Teams</p>
              <span>Participating</span>
            </div>
          </div>

          <div className="bv-stat-item">
            <div className="bv-stat-icon blue">
              <FaSitemap />
            </div>
            <div>
              <h3>{quarterFinals.length}</h3>
              <p>Quarter Finals</p>
              <span>{quarterFinals.filter((m) => m.status === "COMPLETED").length} Completed</span>
            </div>
          </div>

          <div className="bv-stat-item">
            <div className="bv-stat-icon blue">
              <FaSitemap />
            </div>
            <div>
              <h3>{semiFinals.length}</h3>
              <p>Semi Finals</p>
              <span>{semiFinals.filter((m) => m.status === "COMPLETED").length} Completed</span>
            </div>
          </div>

          <div className="bv-stat-item">
            <div className="bv-stat-icon green">
              <FaFlagCheckered />
            </div>
            <div>
              <h3>{finals.length}</h3>
              <p>Final</p>
              <span>{completedCount} Total Completed</span>
            </div>
          </div>
        </div>

        {error && <div className="bv-error">{error}</div>}

        <div className="bv-main-card animate-fade-in-up" style={{ animationDelay: "0.05s" }}>
          <div className="bv-main-header">
            <div>
              <h2>
                <FaTrophy style={{ color: "#fbbf24", marginRight: "8px" }} /> Tournament Bracket
              </h2>
              <p>Visual progress of the competition</p>
            </div>

            <button className="bv-refresh-btn" onClick={fetchBracket}>
              <FaSyncAlt /> Refresh
            </button>
          </div>

          <div className="bv-mobile-tabs">
            <button className={activeMobileTab === "qf" ? "active" : ""} onClick={() => setActiveMobileTab("qf")}>Quarter Finals</button>
            <button className={activeMobileTab === "sf" ? "active" : ""} onClick={() => setActiveMobileTab("sf")}>Semi Finals</button>
            <button className={activeMobileTab === "f" ? "active" : ""} onClick={() => setActiveMobileTab("f")}>Final</button>
            <button className={activeMobileTab === "champ" ? "active" : ""} onClick={() => setActiveMobileTab("champ")}>Champion</button>
          </div>

          <div className="bv-bracket" style={{ position: "relative" }}>
            {/* SVG Connector lines overlay */}
            <svg
              className="bv-bracket-svg"
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                pointerEvents: "none",
                zIndex: 0,
              }}
            >
              {connections.map((c, i) => {
                let strokeColor = "rgba(255, 255, 255, 0.08)";
                let strokeWidth = "2";
                let glowFilter = "none";

                if (c.highlighted) {
                  strokeColor = "var(--primary, #818cf8)";
                  strokeWidth = "3";
                  glowFilter = "drop-shadow(0 0 6px var(--primary, #818cf8))";
                } else if (c.completed) {
                  strokeColor = "rgba(129, 140, 248, 0.35)";
                  strokeWidth = "2";
                }

                return (
                  <path
                    key={i}
                    d={c.d}
                    stroke={strokeColor}
                    strokeWidth={strokeWidth}
                    fill="none"
                    style={{
                      filter: glowFilter,
                      transition: "stroke 0.2s, stroke-width 0.2s, filter 0.2s",
                    }}
                  />
                );
              })}
            </svg>

            <div className={`bv-column ${activeMobileTab === "qf" ? "mobile-visible" : "mobile-hidden"}`}>
              <div className="bv-column-title purple-title">QUARTER FINALS</div>

              {quarterFinals.length > 0 ? (
                quarterFinals.map((m, index) => renderMatch(m, `QF ${index + 1}`, `match-qf-${index}`))
              ) : (
                <div className="bv-empty">No quarter final matches yet.</div>
              )}
            </div>

            <div className={`bv-column bv-semi-column ${activeMobileTab === "sf" ? "mobile-visible" : "mobile-hidden"}`}>
              <div className="bv-column-title blue-title">SEMI FINALS</div>

              {semiFinals.length > 0 ? (
                semiFinals.map((m, index) => renderMatch(m, `SF ${index + 1}`, `match-sf-${index}`))
              ) : (
                <>
                  <div className="bv-placeholder-match" id="match-sf-0">SF 1<br />TBD vs TBD</div>
                  <div className="bv-placeholder-match" id="match-sf-1">SF 2<br />TBD vs TBD</div>
                </>
              )}
            </div>

            <div className={`bv-column ${activeMobileTab === "f" ? "mobile-visible" : "mobile-hidden"}`}>
              <div className="bv-column-title purple-title">FINAL</div>

              {finals.length > 0 ? (
                finals.map((m) => renderMatch(m, "F", "match-f-0"))
              ) : (
                <div className="bv-placeholder-match" id="match-f-0">Final<br />TBD vs TBD</div>
              )}
            </div>

            <div className={`bv-column ${activeMobileTab === "champ" ? "mobile-visible" : "mobile-hidden"}`}>
              <div className="bv-column-title gold-title">CHAMPION</div>

              <div className="bv-champion-card" id="match-champion">
                <div className="bv-trophy">🏆</div>
                <h2>⭐ CHAMPION ⭐</h2>
                <div className="bv-champion-name">{champion}</div>
              </div>
            </div>
          </div>

          <div className="bv-info-box">
            <div className="bv-info-icon">
              <FaInfoCircle />
            </div>
            <div>
              <h4>How it works?</h4>
              <p>
                Quarter finals are played first. Winners move to semi finals.
                Semi final winners compete in the final to become the champion.
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default BracketView;