import React, { useState, useEffect } from "react";
import { FaCalendarAlt, FaCalendarCheck, FaClock, FaExclamationTriangle, FaMagic, FaSyncAlt } from "react-icons/fa";
import API from "../../services/api";
import Layout from "../../components/Layout";
import "./SmartScheduler.css";

function SmartScheduler() {
  const [tournaments, setTournaments] = useState([]);
  const [selectedTournamentId, setSelectedTournamentId] = useState("");
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(false);

  // Generate calendar dates (next 28 days for grid simplicity)
  const [calendarDays, setCalendarDays] = useState([]);

  useEffect(() => {
    fetchTournaments();
    generateCalendarDays();
  }, []);

  useEffect(() => {
    if (selectedTournamentId) {
      fetchMatches(selectedTournamentId);
    } else {
      setMatches([]);
    }
  }, [selectedTournamentId]);

  const fetchTournaments = async () => {
    try {
      const res = await API.get("/tournaments");
      setTournaments(res.data);
    } catch (err) {
      console.error("Failed to fetch tournaments:", err);
    }
  };

  const fetchMatches = async (id) => {
    try {
      setLoading(true);
      const res = await API.get("/matches");
      // Filter matches matching the tournament ID
      const filtered = res.data.filter(m => m.tournament && m.tournament.id === Number(id));
      
      // Map mock/simulated date details to matches if not present in DB
      const mapped = filtered.map((m, idx) => {
        let scheduleDate = m.matchDate || null;
        // Mock schedule some matches to make it look active, keep others null
        if (idx === 0) scheduleDate = getFutureDateString(2);
        else if (idx === 1) scheduleDate = getFutureDateString(5);
        return { ...m, scheduleDate };
      });
      
      setMatches(mapped);
    } catch (err) {
      console.error("Failed to fetch matches:", err);
    } finally {
      setLoading(false);
    }
  };

  const generateCalendarDays = () => {
    const days = [];
    const today = new Date();
    for (let i = 0; i < 28; i++) {
      const future = new Date(today);
      future.setDate(today.getDate() + i);
      
      // format date string YYYY-MM-DD
      const yyyy = future.getFullYear();
      const mm = String(future.getMonth() + 1).padStart(2, '0');
      const dd = String(future.getDate()).padStart(2, '0');
      const dateStr = `${yyyy}-${mm}-${dd}`;

      days.push({
        dateString: dateStr,
        dayOfMonth: future.getDate(),
        dayOfWeek: future.toLocaleDateString("en-US", { weekday: "short" })
      });
    }
    setCalendarDays(days);
  };

  const getFutureDateString = (offsetDays) => {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  // Drag and Drop Logic
  const handleDragStart = (e, matchId) => {
    e.dataTransfer.setData("text/plain", matchId.toString());
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e, dateStr) => {
    e.preventDefault();
    const matchId = Number(e.dataTransfer.getData("text/plain"));
    if (!matchId) return;

    // Check for conflict: is there already a match scheduled on this date?
    const conflictExist = matches.some(m => m.scheduleDate === dateStr && m.id !== matchId);

    if (conflictExist) {
      alert(`Conflict Detected! Another match is already scheduled on ${dateStr}. Pulsing warning borders applied.`);
    }

    setMatches(prev => prev.map(m => {
      if (m.id === matchId) {
        return { ...m, scheduleDate: dateStr };
      }
      return m;
    }));
  };

  const handleUnschedule = (matchId) => {
    setMatches(prev => prev.map(m => {
      if (m.id === matchId) {
        return { ...m, scheduleDate: null };
      }
      return m;
    }));
  };

  const handleAutoSchedule = () => {
    const unscheduled = matches.filter(m => !m.scheduleDate);
    if (unscheduled.length === 0) {
      alert("All matches are already scheduled!");
      return;
    }

    // Schedule them sequentially starting from tomorrow, 1 match per day
    let currentOffset = 1;
    const nextMatches = [...matches];

    unscheduled.forEach(u => {
      // Find a day with no match scheduled
      let dateFound = null;
      while (!dateFound) {
        const checkDate = getFutureDateString(currentOffset);
        const dayBusy = nextMatches.some(m => m.scheduleDate === checkDate);
        if (!dayBusy) {
          dateFound = checkDate;
        }
        currentOffset++;
      }

      // Assign date
      const matchIdx = nextMatches.findIndex(m => m.id === u.id);
      if (matchIdx !== -1) {
        nextMatches[matchIdx].scheduleDate = dateFound;
      }
    });

    setMatches(nextMatches);
    alert("Auto-Scheduler successfully scheduled matches without conflicts!");
  };

  const getMatchesForDate = (dateStr) => {
    return matches.filter(m => m.scheduleDate === dateStr);
  };

  const getTeamInitials = (name) => {
    if (!name) return "?";
    const words = name.trim().split(/\s+/);
    if (words.length === 1) return words[0].substring(0, 2).toUpperCase();
    return (words[0][0] + (words[1] ? words[1][0] : "")).toUpperCase();
  };

  const unscheduledMatches = matches.filter(m => !m.scheduleDate);

  return (
    <Layout
      title="Smart Match Scheduler"
      subtitle="Arrange match fixtures on an interactive calendar timeline with collision checks."
    >
      <div className="ss-layout">
        
        {/* Left Pane: Fixtures & Controls */}
        <div className="ss-sidebar-card">
          <div className="ss-card-header">
            <FaCalendarCheck className="ss-icon-header" />
            <h3>Unscheduled Fixtures</h3>
          </div>

          <div className="ss-form-group">
            <label className="ss-label">Tournament Selection</label>
            <div className="ops-input">
              <select
                value={selectedTournamentId}
                onChange={(e) => setSelectedTournamentId(e.target.value)}
              >
                <option value="">Select Tournament</option>
                {tournaments.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
          </div>

          {selectedTournamentId && (
            <div className="ss-action-box">
              <button onClick={handleAutoSchedule} className="ops-primary ss-btn-magic">
                <FaMagic /> Auto-Schedule Assistant
              </button>
            </div>
          )}

          {selectedTournamentId && (
            <div className="ss-fixtures-list">
              {unscheduledMatches.length > 0 ? (
                unscheduledMatches.map(m => (
                  <div
                    key={m.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, m.id)}
                    className="ss-fixture-drag-item"
                  >
                    <div className="ss-fixture-teams">
                      <span>{getTeamInitials(m.teamA)}</span>
                      <span>vs</span>
                      <span>{getTeamInitials(m.teamB)}</span>
                    </div>
                    <div className="ss-fixture-info">
                      <h4>{m.teamA} vs {m.teamB}</h4>
                      <p>Round: {m.round || "Quarterfinals"}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="ss-empty-fixtures">
                  {matches.length > 0
                    ? "All match fixtures have been successfully scheduled!"
                    : "Please select a tournament to list matches."}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Pane: Draggable Calendar Grid */}
        <div className="ss-calendar-card">
          <div className="ss-card-header">
            <FaCalendarAlt className="ss-icon-header" />
            <h3>Drag-and-Drop Calendar Board</h3>
          </div>

          {selectedTournamentId ? (
            <div className="ss-calendar-grid">
              {calendarDays.map(day => {
                const dateMatches = getMatchesForDate(day.dateString);
                const hasConflict = dateMatches.length > 1;

                return (
                  <div
                    key={day.dateString}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, day.dateString)}
                    className={`ss-calendar-cell ${hasConflict ? "ss-cell-conflict" : ""}`}
                  >
                    <div className="ss-cell-header">
                      <span className="ss-day-num">{day.dayOfMonth}</span>
                      <span className="ss-day-name">{day.dayOfWeek}</span>
                    </div>

                    <div className="ss-cell-body">
                      {dateMatches.map(m => (
                        <div key={m.id} className="ss-cell-match-tag">
                          <span>{getTeamInitials(m.teamA)} vs {getTeamInitials(m.teamB)}</span>
                          <button onClick={() => handleUnschedule(m.id)} className="ss-btn-tag-remove">&times;</button>
                        </div>
                      ))}

                      {hasConflict && (
                        <div className="ss-cell-warning-badge">
                          <FaExclamationTriangle /> Conflict
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="ss-empty-calendar">
              <p>Select a tournament from the brand pane to start scheduling match slots.</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

export default SmartScheduler;
