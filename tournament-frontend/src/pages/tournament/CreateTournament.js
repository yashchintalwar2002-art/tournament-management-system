import React, { useState, useEffect } from "react";
import { FaGamepad, FaTrophy, FaUsers, FaHourglassHalf, FaRegClock, FaShieldAlt } from "react-icons/fa";
import Layout from "../../components/Layout";
import API from "../../services/api";
import "./CreateTournament.css";

function CreateTournament() {
  const [formData, setFormData] = useState({
    name: "",
    game: "T20 Cricket",
    maxPlayers: "",
  });
  const [selectedTemplate, setSelectedTemplate] = useState("T20 Cricket");
  const [customGameName, setCustomGameName] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tournaments, setTournaments] = useState([]);
  const [editingId, setEditingId] = useState(null);

  const role = sessionStorage.getItem("role") || "PLAYER";
  const isAdmin = role === "ADMIN" || role === "ORGANIZER";
  const userEmail = sessionStorage.getItem("email");

  const hasWriteAccess = (tournament) => {
    if (!isAdmin) return false;
    let creator = tournament?.createdBy;
    if (!creator) creator = "admin@gmail.com";
    if (userEmail && creator.toLowerCase() === userEmail.toLowerCase()) return true;
    const collaborators = tournament?.collaborators ? tournament.collaborators.split(",").filter(c => c.trim().length > 0) : [];
    return collaborators.some(collab => userEmail && collab.trim().toLowerCase() === userEmail.toLowerCase());
  };

  const isCreator = (tournament) => {
    if (!isAdmin) return false;
    let creator = tournament?.createdBy;
    if (!creator) creator = "admin@gmail.com";
    return userEmail && creator.toLowerCase() === userEmail.toLowerCase();
  };

  const [confirmModal, setConfirmModal] = useState({
    show: false,
    title: "Confirm Action",
    message: "",
    onConfirm: null
  });

  const triggerConfirm = (title, message, onConfirm) => {
    setConfirmModal({
      show: true,
      title,
      message,
      onConfirm
    });
  };

  const GAME_RULES = {
    "T20 Cricket": {
      overs: "20.0 overs per innings",
      players: "11 players per team",
      bowlerLimit: "Maximum 4.0 overs per bowler",
      powerplay: "Overs 1-6 (max 2 fielders outside 30-yard circle)",
      tiebreaker: "Super Over (1 over per team)",
      description: "Fast-paced cricket format played within 3 hours. Standard ICC T20 International rules apply."
    },
    "ODI Cricket": {
      overs: "50.0 overs per innings",
      players: "11 players per team",
      bowlerLimit: "Maximum 10.0 overs per bowler",
      powerplay: "P1 (1-10 overs, max 2 fielders out), P2 (11-40, max 4 fielders), P3 (41-50, max 5 fielders)",
      tiebreaker: "Super Over (if tied in knockout matches)",
      description: "One Day International format. A balanced test of tactical pacing and endurance."
    },
    "Test Cricket": {
      overs: "90.0 overs per day (unlimited total)",
      players: "11 players per team",
      bowlerLimit: "No bowler limit",
      powerplay: "No powerplay / fielding restrictions",
      tiebreaker: "Match declared draw if 5 days complete without result",
      description: "The ultimate traditional format. Played over 5 days with red ball and unlimited overs."
    },
    "Football (Soccer)": {
      overs: "90 minutes (2 halves of 45 mins)",
      players: "11 players on field",
      bowlerLimit: "Max 3 substitutions allowed (plus 1 in extra time)",
      powerplay: "Yellow/Red card disciplinary rules apply",
      tiebreaker: "Extra time (30 mins) followed by penalty shootout (best of 5)",
      description: "Standard FIFA rules. Association football match layout."
    },
    "Basketball": {
      overs: "48 minutes (4 quarters of 12 mins)",
      players: "5 players on court",
      bowlerLimit: "6 personal fouls (5 in FIBA) leads to fouling out",
      powerplay: "24-second shot clock, 8-second backcourt rule",
      tiebreaker: "5-minute overtime periods until winner is decided",
      description: "Standard NBA/FIBA rules. High scoring, rapid end-to-end action."
    },
    "BGMI (Battlegrounds Mobile India)": {
      overs: "Match Duration: ~30 minutes",
      players: "4 players per squad (Squad mode)",
      bowlerLimit: "Maximum 16 squads in a single lobby",
      powerplay: "Zone shrink timings and placement multipliers",
      tiebreaker: "Total kills points / placement rank points",
      description: "Battle royale tactical shooter. Teams fight to survive and earn chicken dinner."
    },
    "Free Fire": {
      overs: "Match Duration: ~15-20 minutes",
      players: "4 players per squad (Squad mode)",
      bowlerLimit: "Maximum 12 squads in a lobby",
      powerplay: "Airdrop drops, character skill triggers active",
      tiebreaker: "Kills points + survival order points",
      description: "Fast battle royale game. Survival is the key to Booyah!"
    },
    "Valorant": {
      overs: "First to 13 rounds win (approx 40 mins)",
      players: "5 players per team (Attacker/Defender)",
      bowlerLimit: "Ability usage limits per round",
      powerplay: "Buy phase, spike planting, ultimate charge",
      tiebreaker: "Overtime (must win by 2 rounds)",
      description: "Esports 5v5 character-based tactical shooter. Plant or defuse the Spike."
    },
    "Tennis": {
      overs: "Best of 3 or 5 sets",
      players: "1 player (Singles) or 2 players (Doubles)",
      bowlerLimit: "Alternating service games",
      powerplay: "Deuce / Advantage scoring system",
      tiebreaker: "Tiebreak game (first to 7 points, win by 2)",
      description: "Classic racket sport. Played on hard, grass, or clay courts."
    },
    "Badminton": {
      overs: "Best of 3 games of 21 points",
      players: "1 player (Singles) or 2 players (Doubles)",
      bowlerLimit: "Server alternates sides on points",
      powerplay: "Interval at 11 points in each game",
      tiebreaker: "Must win by 2 points (cap at 30 points)",
      description: "Fast-paced racket sport. Played with shuttles over a high net."
    },
    "Chess": {
      overs: "Time control: e.g. 10m+5s (Rapid)",
      players: "1 player per side (White vs Black)",
      bowlerLimit: "N/A",
      powerplay: "Opening theory, castling rules",
      tiebreaker: "Armageddon blitz game if score is tied",
      description: "Esports/traditional board game of strategy and tactics."
    },
    "Kabaddi": {
      overs: "40 minutes (2 halves of 20 mins)",
      players: "7 active players (plus 5 substitutes)",
      bowlerLimit: "30-second raid time limit",
      powerplay: "Super Tackle (3 or less defenders = 2 points)",
      tiebreaker: "5 Golden Raids with no block option",
      description: "Traditional contact sport. Raiders score points by tagging defenders."
    },
    "Hockey": {
      overs: "60 minutes (4 quarters of 15 mins)",
      players: "11 players on field",
      bowlerLimit: "Unlimited rolling substitutions",
      powerplay: "Penalty corner, penalty stroke, green/yellow cards",
      tiebreaker: "Penalty shootout (8-second runs from 23m line)",
      description: "Fast paced field hockey. Association rules apply."
    },
    "Custom": {
      overs: "Custom rules apply",
      players: "Flexible team capacity",
      bowlerLimit: "No default bowler limit",
      powerplay: "No default restrictions",
      tiebreaker: "Custom organizer decisions",
      description: "Create your own rules format. Fill in details and start playing."
    }
  };

  const handleTemplateChange = (e) => {
    const template = e.target.value;
    setSelectedTemplate(template);
    if (template === "Custom") {
      setFormData({
        ...formData,
        game: customGameName || "Custom Game",
      });
    } else {
      setFormData({
        ...formData,
        game: template,
      });
    }
  };

  const handleCustomGameChange = (e) => {
    const val = e.target.value;
    setCustomGameName(val);
    setFormData({
      ...formData,
      game: val,
    });
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const fetchTournaments = async () => {
    try {
      const res = await API.get("/tournaments");
      setTournaments(res.data);
    } catch (err) {
      console.error("Tournament fetch error:", err);
    }
  };

  useEffect(() => {
    fetchTournaments();
  }, []);

  const startEdit = (tournament) => {
    setEditingId(tournament.id);
    setFormData({
      name: tournament.name || "",
      game: tournament.game || "",
      maxPlayers: tournament.maxPlayers || "",
    });

    const isPreset = Object.keys(GAME_RULES).includes(tournament.game);
    if (isPreset) {
      setSelectedTemplate(tournament.game);
      setCustomGameName("");
    } else {
      setSelectedTemplate("Custom");
      setCustomGameName(tournament.game);
    }
    setMessage("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setFormData({
      name: "",
      game: selectedTemplate === "Custom" ? "" : selectedTemplate,
      maxPlayers: "",
    });
    setCustomGameName("");
    setMessage("");
  };

  const deleteTournament = (id) => {
    triggerConfirm(
      "Delete Tournament?",
      "Are you sure you want to delete this tournament? This will remove all associated matches, teams, and registrations. This action cannot be undone.",
      async () => {
        try {
          await API.delete(`/tournaments/${id}`);
          setMessage("Tournament deleted successfully.");
          if (editingId === id) {
            cancelEdit();
          }
          fetchTournaments();
        } catch (error) {
          console.error("DELETE TOURNAMENT ERROR:", error);
          setMessage("Failed to delete tournament.");
        }
      }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setIsSubmitting(true);

    try {
      if (editingId) {
        await API.put(`/tournaments/${editingId}`, {
          name: formData.name,
          game: formData.game,
          maxPlayers: Number(formData.maxPlayers),
        });
        setMessage("Tournament updated successfully.");
      } else {
        await API.post("/tournaments", {
          name: formData.name,
          game: formData.game,
          maxPlayers: Number(formData.maxPlayers),
        });
        setMessage("Tournament created successfully.");
      }

      setFormData({
        name: "",
        game: selectedTemplate === "Custom" ? "" : selectedTemplate,
        maxPlayers: "",
      });
      if (selectedTemplate === "Custom") {
        setCustomGameName("");
      }
      setEditingId(null);
      fetchTournaments();
    } catch (error) {
      console.error("SUBMIT TOURNAMENT ERROR:", error);
      setMessage(
        error.response?.data?.message ||
          `Failed to process tournament (${error.response?.status || "No server"}).`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeRules = GAME_RULES[selectedTemplate] || GAME_RULES["Custom"];

  return (
    <Layout
      title="Create Tournament"
      subtitle="Set up a new competition with game templates and rules."
    >
      <div className="create-tournament-wrap">
        <div className="create-tournament-card">
          <div className="create-tournament-header">
            <div className="create-badge">
              <FaTrophy />
            </div>
            <div>
              <span className="section-label">New event</span>
              <h2>Create Tournament</h2>
              <p>Configure matches automatically loaded with professional game structures.</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="create-form">
            <div className="create-form-group">
              <label htmlFor="name">Tournament Name</label>
              <div className="input-shell">
                <FaTrophy />
                <input
                  id="name"
                  type="text"
                  name="name"
                  placeholder="Example: Spring Championship"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="create-form-group">
              <label htmlFor="gameTemplate">Game Template</label>
              <div className="input-shell">
                <FaGamepad />
                <select
                  id="gameTemplate"
                  value={selectedTemplate}
                  onChange={handleTemplateChange}
                  className="game-select"
                >
                  <option value="T20 Cricket">T20 Cricket (20 Overs)</option>
                  <option value="ODI Cricket">ODI Cricket (50 Overs)</option>
                  <option value="Test Cricket">Test Cricket (90 Overs/Day)</option>
                  <option value="Football (Soccer)">Football (Soccer - 90 mins)</option>
                  <option value="Basketball">Basketball (48 mins)</option>
                  <option value="BGMI (Battlegrounds Mobile India)">BGMI (Battle Royale)</option>
                  <option value="Free Fire">Free Fire (Battle Royale)</option>
                  <option value="Valorant">Valorant (Esports 5v5)</option>
                  <option value="Tennis">Tennis (Racket Sport)</option>
                  <option value="Badminton">Badminton (Racket Sport)</option>
                  <option value="Chess">Chess (Strategy Board)</option>
                  <option value="Kabaddi">Kabaddi (Contact Sport)</option>
                  <option value="Hockey">Hockey (Field Sport)</option>
                  <option value="Custom">Custom Game...</option>
                </select>
              </div>
            </div>


            {selectedTemplate === "Custom" && (
              <div className="create-form-group">
                <label htmlFor="game">Custom Game Name</label>
                <div className="input-shell">
                  <FaGamepad />
                  <input
                    id="game"
                    type="text"
                    name="game"
                    placeholder="Example: Badminton"
                    value={customGameName}
                    onChange={handleCustomGameChange}
                    required
                  />
                </div>
              </div>
            )}

            <div className="create-form-group">
              <label htmlFor="maxPlayers">Max Teams</label>
              <div className="input-shell">
                <FaUsers />
                <input
                  id="maxPlayers"
                  type="number"
                  name="maxPlayers"
                  min="2"
                  placeholder="Example: 8"
                  value={formData.maxPlayers}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div style={{ display: "flex", gap: "10px" }}>
              <button type="submit" className="create-btn" style={{ flex: 1 }} disabled={isSubmitting}>
                {editingId ? (isSubmitting ? "Saving..." : "Save Changes") : (isSubmitting ? "Creating..." : "Create Tournament")}
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="create-btn"
                  style={{
                    flex: 1,
                    background: "rgba(239, 68, 68, 0.15)",
                    border: "1px solid rgba(239, 68, 68, 0.3)",
                    color: "#fca5a5",
                    boxShadow: "none"
                  }}
                >
                  Cancel Edit
                </button>
              )}
            </div>
          </form>

          {message && <p className="create-message">{message}</p>}
        </div>

        <div className="rules-card">
          <div className="rules-header">
            <FaGamepad className="rules-icon" />
            <div>
              <h3>{selectedTemplate} Rulebook</h3>
              <p className="rules-description">{activeRules.description}</p>
            </div>
          </div>

          <div className="rules-details-grid">
            <div className="rule-item">
              <FaHourglassHalf className="rule-item-icon" />
              <div>
                <strong>Overs / Duration</strong>
                <span>{activeRules.overs}</span>
              </div>
            </div>

            <div className="rule-item">
              <FaUsers className="rule-item-icon" />
              <div>
                <strong>Team Composition</strong>
                <span>{activeRules.players}</span>
              </div>
            </div>

            <div className="rule-item">
              <FaRegClock className="rule-item-icon" />
              <div>
                <strong>Bowler Limit / Subs</strong>
                <span>{activeRules.bowlerLimit}</span>
              </div>
            </div>

            <div className="rule-item">
              <FaShieldAlt className="rule-item-icon" />
              <div>
                <strong>Powerplay / Special</strong>
                <span>{activeRules.powerplay}</span>
              </div>
            </div>

            <div className="rule-item">
              <FaTrophy className="rule-item-icon" />
              <div>
                <strong>Tiebreaker Rules</strong>
                <span>{activeRules.tiebreaker}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="create-tournament-card" style={{ gridColumn: "1 / -1", marginTop: "24px" }}>
          <div className="create-tournament-header">
            <div className="create-badge">
              <FaTrophy />
            </div>
            <div>
              <span className="section-label">Manage existing</span>
              <h2>Tournament Management</h2>
              <p>View, edit parameters, or delete created tournaments.</p>
            </div>
          </div>

          {tournaments.length === 0 ? (
            <p className="no-tournaments-msg" style={{ textAlign: "center", color: "var(--text-secondary)", padding: "20px" }}>No tournaments created yet.</p>
          ) : (
            <div className="tournaments-table-wrapper" style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", color: "var(--text-primary)", fontSize: "13px" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border)", height: "40px", textAlign: "left", color: "var(--text-secondary)" }}>
                    <th style={{ padding: "10px" }}>Tournament Name</th>
                    <th style={{ padding: "10px" }}>Sport / Game</th>
                    <th style={{ padding: "10px" }}>Max Teams</th>
                    <th style={{ padding: "10px", textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {tournaments.map((t) => (
                    <tr key={t.id} style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.05)", height: "46px" }}>
                      <td style={{ padding: "10px", fontWeight: "700" }}>{t.name}</td>
                      <td style={{ padding: "10px" }}>{t.game}</td>
                      <td style={{ padding: "10px" }}>{t.maxPlayers || t.maxTeams || 16}</td>
                      <td style={{ padding: "10px", textAlign: "right" }}>
                        {hasWriteAccess(t) && (
                          <button
                            onClick={() => startEdit(t)}
                            style={{
                              marginRight: "8px",
                              padding: "6px 12px",
                              fontSize: "11px",
                              fontWeight: "800",
                              borderRadius: "6px",
                              border: "1px solid rgba(245, 158, 11, 0.3)",
                              background: "rgba(245, 158, 11, 0.15)",
                              color: "#fcd34d",
                              cursor: "pointer"
                            }}
                          >
                            ✏️ Edit
                          </button>
                        )}
                        {isCreator(t) && (
                          <button
                            onClick={() => deleteTournament(t.id)}
                            style={{
                              padding: "6px 12px",
                              fontSize: "11px",
                              fontWeight: "800",
                              borderRadius: "6px",
                              border: "1px solid rgba(239, 68, 68, 0.3)",
                              background: "rgba(239, 68, 68, 0.15)",
                              color: "#fca5a5",
                              cursor: "pointer"
                            }}
                          >
                            🗑️ Delete
                          </button>
                        )}
                        {!hasWriteAccess(t) && (
                          <span style={{ fontSize: "11px", color: "var(--text-secondary)", fontStyle: "italic" }}>
                            Read Only
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

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
    </Layout>
  );
}

export default CreateTournament;

