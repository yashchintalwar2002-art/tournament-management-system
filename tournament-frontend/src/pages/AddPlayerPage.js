import React, { useEffect, useState } from "react";
import API from "../services/api";
import Layout from "../components/Layout";
import { FaEdit } from "react-icons/fa";
import "./AddPlayerPage.css";

const getSportConfig = (gameNameInput) => {
  const game = gameNameInput ? gameNameInput.toLowerCase().trim() : "";
  
  if (game.includes("cricket")) {
    return {
      gameName: "Cricket",
      maxStarters: 11,
      maxRoster: 18,
      roles: ["Batsman", "Bowler", "All-Rounder", "Wicket-Keeper"]
    };
  } else if (game.includes("football") || game.includes("soccer")) {
    return {
      gameName: "Football",
      maxStarters: 11,
      maxRoster: 23,
      roles: ["Forward", "Midfielder", "Defender", "Goalkeeper"]
    };
  } else if (game.includes("basketball")) {
    return {
      gameName: "Basketball",
      maxStarters: 5,
      maxRoster: 15,
      roles: ["Point Guard", "Shooting Guard", "Small Forward", "Power Forward", "Center"]
    };
  } else if (game.includes("bgmi") || game.includes("pubg") || game.includes("freefire") || game.includes("free fire") || game.includes("battle royale")) {
    return {
      gameName: "Battle Royale",
      maxStarters: 4,
      maxRoster: 6,
      roles: ["IGL", "Assaulter", "Sniper", "Support", "Scout"]
    };
  } else if (game.includes("valorant")) {
    return {
      gameName: "Valorant",
      maxStarters: 5,
      maxRoster: 7,
      roles: ["Duelist", "Initiator", "Sentinel", "Controller", "Coach"]
    };
  } else if (game.includes("tennis")) {
    return {
      gameName: "Tennis",
      maxStarters: 2,
      maxRoster: 2,
      roles: ["Singles Player", "Doubles Player"]
    };
  } else if (game.includes("badminton")) {
    return {
      gameName: "Badminton",
      maxStarters: 2,
      maxRoster: 2,
      roles: ["Singles Player", "Doubles Player"]
    };
  } else if (game.includes("chess")) {
    return {
      gameName: "Chess",
      maxStarters: 1,
      maxRoster: 1,
      roles: ["Player"]
    };
  } else if (game.includes("kabaddi")) {
    return {
      gameName: "Kabaddi",
      maxStarters: 7,
      maxRoster: 12,
      roles: ["Raider", "Defender", "All-Rounder"]
    };
  } else if (game.includes("hockey")) {
    return {
      gameName: "Hockey",
      maxStarters: 11,
      maxRoster: 18,
      roles: ["Forward", "Midfielder", "Defender", "Goalkeeper"]
    };
  }
  
  return {
    gameName: "General",
    maxStarters: 11,
    maxRoster: 15,
    roles: ["Player", "Captain", "Coach", "Manager"]
  };
};

function AddPlayerPage() {
  const [teams, setTeams] = useState([]);
  const [tournaments, setTournaments] = useState([]);
  const [selectedTournament, setSelectedTournament] = useState("");
  const [selectedTeam, setSelectedTeam] = useState("");
  const [playerName, setPlayerName] = useState("");
  const [role, setRole] = useState("");
  const [jerseyNumber, setJerseyNumber] = useState("");
  const [isSubstitute, setIsSubstitute] = useState(false);
  const [players, setPlayers] = useState([]);
  const [toasts, setToasts] = useState([]);

  // States for player edit
  const [editingPlayer, setEditingPlayer] = useState(null);
  const [editPlayerName, setEditPlayerName] = useState("");
  const [editRole, setEditRole] = useState("");
  const [editJerseyNumber, setEditJerseyNumber] = useState("");
  const [editIsSubstitute, setEditIsSubstitute] = useState(false);

  const handleEditClick = (player) => {
    setEditingPlayer(player);
    setEditPlayerName(player.playerName || "");
    setEditRole(player.role || "");
    setEditJerseyNumber(player.jerseyNumber || "");
    setEditIsSubstitute(player.isSubstitute === true || player.substitute === true);
  };

  const savePlayerChanges = async () => {
    if (!editPlayerName || !editRole || !editJerseyNumber) {
      showToast("Please fill all player fields.", "warning");
      return;
    }
    try {
      await API.put(`/players/${editingPlayer.id}`, {
        playerName: editPlayerName,
        role: editRole,
        jerseyNumber: editJerseyNumber,
        isSubstitute: editIsSubstitute,
      });
      showToast(`Player updated successfully!`, "success");
      setEditingPlayer(null);
      fetchPlayers(selectedTeam);
    } catch (error) {
      console.log(error);
      const errorMsg = error.response?.data?.message || error.response?.data || "Failed to update player.";
      showToast(errorMsg, "error");
    }
  };

  useEffect(() => {
    fetchTournaments();
    fetchTeams();
  }, []);

  const showToast = (text, type = "success") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, text, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const fetchTournaments = async () => {
    try {
      const response = await API.get("/tournaments");
      setTournaments(response.data);
    } catch (error) {
      console.log(error);
      showToast("Failed to load tournaments.", "error");
    }
  };

  const fetchTeams = async () => {
    try {
      const response = await API.get("/teams");
      setTeams(response.data);
    } catch (error) {
      console.log(error);
      showToast("Failed to load available teams.", "error");
    }
  };

  const fetchPlayers = async (teamId) => {
    if (!teamId) return;
    try {
      const res = await API.get(`/players/team/${teamId}`);
      setPlayers(res.data);
    } catch (error) {
      console.log(error);
      showToast("Failed to load roster players.", "error");
    }
  };

  const addPlayer = async () => {
    if (!selectedTeam || !playerName || !role || !jerseyNumber) {
      showToast("Please fill all player fields.", "warning");
      return;
    }

    try {
      await API.post(`/players/add/${selectedTeam}`, {
        playerName,
        role,
        jerseyNumber,
        isSubstitute,
      });

      showToast(`Player "${playerName}" registered successfully!`, "success");
      setPlayerName("");
      setRole("");
      setJerseyNumber("");
      setIsSubstitute(false);
      fetchPlayers(selectedTeam);
    } catch (error) {
      console.log(error);
      const errorMsg = error.response?.data?.message || error.response?.data || "Failed to add player.";
      showToast(errorMsg, "error");
    }
  };

  const filteredTeams = selectedTournament
    ? teams.filter((t) => t.tournament && t.tournament.id.toString() === selectedTournament && t.status !== "REJECTED")
    : [];

  const starters = players.filter(p => !(p.isSubstitute === true || p.substitute === true));
  const substitutes = players.filter(p => p.isSubstitute === true || p.substitute === true);

  const selectedTournObj = tournaments.find(t => t.id.toString() === selectedTournament);
  const config = getSportConfig(selectedTournObj?.game);
  let maxStarters = config.maxStarters;
  let maxRoster = config.maxRoster;
  let gameName = config.gameName;
  let roles = config.roles;
  
  if (gameName === "General" && selectedTournObj?.maxPlayers > 0) {
    maxRoster = selectedTournObj.maxPlayers;
    maxStarters = Math.min(11, maxRoster);
  }

  return (
    <Layout
      title="Add Players"
      subtitle="Register players and assign them to participating team rosters."
    >
      <div className="ops-page">
        <div className="ops-grid">
          <div>
            <div className="ops-card">
              <div className="ops-card-header">
                <h3>Register Player</h3>
                <p>Add player details and link them to a team roster.</p>
              </div>

              <div className="ops-form">
                <label>
                  Select Tournament
                  <div className="ops-input">
                    <select
                      value={selectedTournament}
                      onChange={(e) => {
                        setSelectedTournament(e.target.value);
                        setSelectedTeam("");
                        setPlayers([]);
                      }}
                    >
                      <option value="">Select Tournament</option>
                      {tournaments.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </label>

                <label>
                  Select Team
                  <div className="ops-input">
                    <select
                      value={selectedTeam}
                      onChange={(e) => {
                        setSelectedTeam(e.target.value);
                        fetchPlayers(e.target.value);
                      }}
                      disabled={!selectedTournament}
                    >
                      <option value="">Select Team</option>
                      {filteredTeams.map((team) => (
                        <option key={team.id} value={team.id}>
                          {team.teamName}
                        </option>
                      ))}
                    </select>
                  </div>
                </label>

                <label>
                  Player Name
                  <div className="ops-input">
                    <input
                      placeholder="Enter player name"
                      value={playerName}
                      onChange={(e) => setPlayerName(e.target.value)}
                      disabled={!selectedTeam}
                    />
                  </div>
                </label>

                <label>
                  Player Role
                  <div className="ops-input">
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      disabled={!selectedTeam}
                    >
                      <option value="">Select Role</option>
                      {roles.map(r => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  </div>
                </label>

                <label>
                  Jersey Number
                  <div className="ops-input">
                    <input
                      placeholder="Jersey Number"
                      value={jerseyNumber}
                      onChange={(e) => setJerseyNumber(e.target.value)}
                      disabled={!selectedTeam}
                    />
                  </div>
                </label>

                <label>
                  Squad Role / Status
                  <div className="ops-input">
                    <select
                      value={isSubstitute ? "BENCH" : "STARTER"}
                      onChange={(e) => setIsSubstitute(e.target.value === "BENCH")}
                      disabled={!selectedTeam}
                    >
                      <option value="STARTER">Playing XI / Starter</option>
                      <option value="BENCH">Substitute / Bench</option>
                    </select>
                  </div>
                </label>

                <button className="ops-primary" onClick={addPlayer} disabled={!selectedTeam}>
                  Add Player
                </button>
              </div>
            </div>

            <div className="ops-card" style={{ marginTop: "18px" }}>
              <div className="ops-card-header">
                <h3>Available Teams</h3>
                <p>Select a team below to view its roster or register new players.</p>
              </div>

              <div className="team-list available-teams-scrollable">
                {!selectedTournament ? (
                  <div className="ops-empty">
                    <p>Select a tournament first to view its registered teams.</p>
                  </div>
                ) : filteredTeams.length === 0 ? (
                  <div className="ops-empty">
                    <p>No approved teams found for this tournament.</p>
                  </div>
                ) : (
                  filteredTeams.map((team) => (
                    <div
                      className={`team-item clickable-team ${selectedTeam === team.id.toString() ? "active-team-card" : ""}`}
                      key={team.id}
                      onClick={() => {
                        setSelectedTeam(team.id.toString());
                        fetchPlayers(team.id);
                      }}
                    >
                      <div className="team-icon">
                        {team.teamName.substring(0, 2).toUpperCase()}
                      </div>
                      <div style={{ flex: 1 }}>
                        <h4 style={{ margin: 0, color: "var(--text-primary)" }}>{team.teamName}</h4>
                        <p style={{ margin: "2px 0 0", fontSize: "11px", color: "var(--text-secondary)" }}>
                          Roster Approved
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="ops-card players-card">
            <div className="ops-card-header">
              <h3>Team Players ({players.length}/{maxRoster})</h3>
              <p>Roster of currently registered players. {selectedTournObj && <span style={{color: "var(--primary)", fontWeight: "600"}}>{gameName} Rules Apply (Max {maxStarters} Starters).</span>}</p>
            </div>

            <div className="team-list players-roster-scrollable">
              {players.length === 0 ? (
                <div className="ops-empty">
                  <p>No players added to this team yet.</p>
                </div>
              ) : (
                <>
                  <h4 style={{ margin: "10px 0 6px 0", color: "#10b981", fontSize: "12px", textTransform: "uppercase", letterSpacing: "1px", display: "flex", alignItems: "center", gap: "6px" }}>
                    🟢 Playing XI / Starters ({starters.length}/{maxStarters})
                  </h4>
                  {starters.length === 0 ? (
                    <div style={{ padding: "8px 12px", color: "var(--text-secondary)", fontSize: "12px", border: "1px dashed var(--border)", borderRadius: "8px", marginBottom: "12px", textAlign: "center" }}>
                      No starters registered.
                    </div>
                  ) : (
                    starters.map((player) => (
                      <div className="team-item" key={player.id} style={{ marginBottom: "8px" }}>
                        <div className="team-icon" style={{ background: "rgba(16, 185, 129, 0.15)", color: "#10b981" }}>
                          #{player.jerseyNumber}
                        </div>
                        <div style={{ flex: 1 }}>
                          <h4 style={{ margin: 0 }}>{player.playerName}</h4>
                          <p style={{ margin: 0, fontSize: "11px", color: "var(--text-secondary)" }}>{player.role || "Player"}</p>
                        </div>
                        <button className="edit-action-btn" title="Edit Player" onClick={() => handleEditClick(player)}>
                          <FaEdit />
                        </button>
                      </div>
                    ))
                  )}

                  <h4 style={{ margin: "18px 0 6px 0", color: "#f59e0b", fontSize: "12px", textTransform: "uppercase", letterSpacing: "1px", display: "flex", alignItems: "center", gap: "6px" }}>
                    🟠 Substitutes / Bench ({substitutes.length}/{maxRoster - maxStarters})
                  </h4>
                  {substitutes.length === 0 ? (
                    <div style={{ padding: "8px 12px", color: "var(--text-secondary)", fontSize: "12px", border: "1px dashed var(--border)", borderRadius: "8px", textAlign: "center" }}>
                      No substitutes registered.
                    </div>
                  ) : (
                    substitutes.map((player) => (
                      <div className="team-item" key={player.id} style={{ marginBottom: "8px" }}>
                        <div className="team-icon" style={{ background: "rgba(245, 158, 11, 0.15)", color: "#f59e0b" }}>
                          #{player.jerseyNumber}
                        </div>
                        <div style={{ flex: 1 }}>
                          <h4 style={{ margin: 0 }}>{player.playerName}</h4>
                          <p style={{ margin: 0, fontSize: "11px", color: "var(--text-secondary)" }}>{player.role || "Substitute"}</p>
                        </div>
                        <button className="edit-action-btn" title="Edit Player" onClick={() => handleEditClick(player)}>
                          <FaEdit />
                        </button>
                      </div>
                    ))
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {editingPlayer && (
        <div className="player-modal-overlay">
          <div className="player-modal-card animate-fade-in-up">
            <div className="player-modal-header">
              <h3>Edit Player Profile</h3>
              <p>Modify player's name, role, jersey, and roster status.</p>
            </div>
            <div className="player-modal-body">
              <div className="ops-form">
                <label>
                  Player Name
                  <div className="ops-input">
                    <input
                      placeholder="Enter player name"
                      value={editPlayerName}
                      onChange={(e) => setEditPlayerName(e.target.value)}
                    />
                  </div>
                </label>

                <label>
                  Player Role
                  <div className="ops-input">
                    <select
                      value={editRole}
                      onChange={(e) => setEditRole(e.target.value)}
                    >
                      <option value="">Select Role</option>
                      {roles.map(r => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  </div>
                </label>

                <label>
                  Jersey Number
                  <div className="ops-input">
                    <input
                      placeholder="Jersey Number"
                      value={editJerseyNumber}
                      onChange={(e) => setEditJerseyNumber(e.target.value)}
                    />
                  </div>
                </label>

                <label>
                  Squad Role / Status
                  <div className="ops-input">
                    <select
                      value={editIsSubstitute ? "BENCH" : "STARTER"}
                      onChange={(e) => setEditIsSubstitute(e.target.value === "BENCH")}
                    >
                      <option value="STARTER">Playing XI / Starter</option>
                      <option value="BENCH">Substitute / Bench</option>
                    </select>
                  </div>
                </label>
              </div>
            </div>
            <div className="player-modal-actions">
              <button className="ops-cancel-btn" onClick={() => setEditingPlayer(null)}>
                Cancel
              </button>
              <button className="ops-primary" onClick={savePlayerChanges}>
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification Banner Container */}
      <div className="toast-container">
        {toasts.map((toast) => (
          <div key={toast.id} className={`in-app-toast ${toast.type}`}>
            <span>{toast.text}</span>
            <button className="toast-close-btn" onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}>
              &times;
            </button>
          </div>
        ))}
      </div>
    </Layout>
  );
}

export default AddPlayerPage;