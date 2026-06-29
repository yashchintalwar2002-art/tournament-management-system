import React, { useEffect, useState } from "react";
import { FaCheckCircle, FaPlus, FaTrash, FaTrophy, FaUsers, FaEdit, FaEnvelope, FaUser, FaPalette } from "react-icons/fa";
import API from "../../services/api";
import Layout from "../../components/Layout";
import "./AddTeams.css";

function AddTeams() {
  const [tournaments, setTournaments] = useState([]);
  const [teams, setTeams] = useState([]);
  const [form, setForm] = useState({ tournamentId: "", teamName: "", captainName: "", contactEmail: "" });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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

  // Edit Team state
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [editForm, setEditForm] = useState({
    teamName: "",
    captainName: "",
    contactEmail: "",
    logo: "",
    city: "",
    description: "",
    jerseyColor: "",
    category: "Leather Ball"
  });

  useEffect(() => {
    fetchTournaments();
    const queryParams = new URLSearchParams(window.location.search);
    const urlTournamentId = queryParams.get("tournamentId");
    if (urlTournamentId) {
      setForm((prev) => ({ ...prev, tournamentId: urlTournamentId }));
    }
  }, []);

  useEffect(() => {
    if (form.tournamentId) {
      fetchTeams(form.tournamentId);
    } else {
      setTeams([]);
    }
  }, [form.tournamentId]);

  const fetchTournaments = async () => {
    try {
      const res = await API.get("/tournaments");
      setTournaments(res.data);
    } catch (err) {
      console.error(err);
      setError("Failed to load tournaments.");
    }
  };

  const fetchTeams = async (tournamentId) => {
    try {
      const res = await API.get(`/teams/tournament/${tournamentId}`);
      setTeams(res.data);
    } catch (err) {
      console.error(err);
      setError("Failed to load teams.");
    }
  };

  const handleDeleteTeam = async (teamId) => {
    if (!window.confirm("Are you sure you want to remove this team?")) return;
    try {
      await API.delete(`/teams/${teamId}`);
      setMessage("Team removed successfully.");
      fetchTeams(form.tournamentId);
    } catch (err) {
      console.error(err);
      setError("Failed to remove team.");
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    if (!form.tournamentId) {
      setError("Please select a tournament.");
      return;
    }

    try {
      setLoading(true);
      await API.post("/teams", {
        teamName: form.teamName,
        captainName: form.captainName || "Team Captain",
        contactEmail: form.contactEmail || "captain@example.com",
        tournament: { id: Number(form.tournamentId) },
        status: "APPROVED",
      });

      setMessage("Team added successfully.");
      setForm((prev) => ({ ...prev, teamName: "", captainName: "", contactEmail: "" }));
      fetchTeams(form.tournamentId);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || err.response?.data || "Failed to add team.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTeam = async (e) => {
    e.preventDefault();
    if (!selectedTeam) return;
    try {
      setLoading(true);
      setError("");
      await API.put(`/teams/${selectedTeam.id}`, editForm);
      setMessage("Team updated successfully!");
      setShowEditModal(false);
      fetchTeams(form.tournamentId);
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      console.error(err);
      setError("Failed to update team details.");
    } finally {
      setLoading(false);
    }
  };

  const handleApproveTeam = async (teamId) => {
    try {
      setLoading(true);
      setError("");
      await API.put(`/teams/${teamId}/approve`);
      setMessage("Team approved successfully!");
      fetchTeams(form.tournamentId);
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      console.error(err);
      setError("Failed to approve team.");
    } finally {
      setLoading(false);
    }
  };

  const handleRejectTeam = async (teamId) => {
    try {
      setLoading(true);
      setError("");
      await API.put(`/teams/${teamId}/reject`);
      setMessage("Team rejected successfully.");
      fetchTeams(form.tournamentId);
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      console.error(err);
      setError("Failed to reject team.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout
      title="Add Teams"
      subtitle="Register teams before generating tournament brackets."
      isFullWidth={true}
    >
      <div className="ops-page">
        <div className="ops-hero">
          <div className="ops-hero-left">
            <div className="ops-badge">
              <FaUsers />
            </div>
            <div>
              <span className="section-label">Roster setup</span>
              <h2>Team Management</h2>
              <p>Add teams to a tournament, then generate the bracket when the roster is ready.</p>
            </div>
          </div>

          <div className="ops-stat">
            <strong>{teams.length}</strong>
            <span>Teams Added</span>
          </div>
        </div>

        <div className="ops-grid">
          <div className="ops-card">
            <div className="ops-card-header">
              <h3>Add New Team</h3>
              <p>Select a tournament and register a team.</p>
            </div>

            <form onSubmit={handleSubmit} className="ops-form">
              <label>
                Tournament
                <div className="ops-input">
                  <FaTrophy />
                  <select
                    name="tournamentId"
                    value={form.tournamentId}
                    onChange={handleChange}
                    required
                  >
                    <option value="">Select Tournament</option>
                    {tournaments.filter(hasWriteAccess).map((tournament) => (
                      <option key={tournament.id} value={tournament.id}>
                        {tournament.name}
                      </option>
                    ))}
                  </select>
                </div>
              </label>

              <label>
                Team Name
                <div className="ops-input">
                  <FaUsers />
                  <input
                    type="text"
                    name="teamName"
                    value={form.teamName}
                    onChange={handleChange}
                    placeholder="Enter team name"
                    required
                  />
                </div>
              </label>

              <label>
                Captain Name
                <div className="ops-input">
                  <FaUser />
                  <input
                    type="text"
                    name="captainName"
                    value={form.captainName}
                    onChange={handleChange}
                    placeholder="Enter Captain name"
                  />
                </div>
              </label>

              <label>
                Captain Email
                <div className="ops-input">
                  <FaEnvelope />
                  <input
                    type="email"
                    name="contactEmail"
                    value={form.contactEmail}
                    onChange={handleChange}
                    placeholder="Enter Captain email"
                  />
                </div>
              </label>

              <button type="submit" className="ops-primary" disabled={loading}>
                {loading ? "Adding..." : "Add Team"}
              </button>
            </form>

            {message && <div className="ops-success">{message}</div>}
            {error && <div className="ops-error">{error}</div>}
          </div>

          <div className="ops-card">
            <div className="ops-card-header">
              <h3>Registered Teams</h3>
              <p>
                {form.tournamentId
                  ? "Teams currently added to the selected tournament."
                  : "Select a tournament to view its teams."}
              </p>
            </div>

            {teams.length > 0 ? (
              <div className="team-list">
                {teams.map((team, index) => (
                  <div 
                    className="team-item animate-fade-in-up" 
                    key={team.id}
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    <div className="team-icon">
                      <FaCheckCircle />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <h4 style={{ margin: 0 }}>{team.teamName}</h4>
                        <span 
                          style={{
                            fontSize: "10px",
                            padding: "2px 6px",
                            borderRadius: "4px",
                            fontWeight: "800",
                            background: team.status === "APPROVED" ? "rgba(16, 185, 129, 0.15)" : team.status === "REJECTED" ? "rgba(239, 68, 68, 0.15)" : "rgba(245, 158, 11, 0.15)",
                            color: team.status === "APPROVED" ? "#34d399" : team.status === "REJECTED" ? "#fca5a5" : "#fcd34d",
                            border: `1px solid ${team.status === "APPROVED" ? "rgba(16, 185, 129, 0.3)" : team.status === "REJECTED" ? "rgba(239, 68, 68, 0.3)" : "rgba(245, 158, 11, 0.3)"}`
                          }}
                        >
                          {team.status || "PENDING"}
                        </span>
                      </div>
                      <p style={{ margin: "4px 0 0 0", fontSize: "11px", color: "var(--text-secondary)" }}>
                        Captain: <strong>{team.captainName || "N/A"}</strong> | City: <strong>{team.city || "Grassroots"}</strong>
                      </p>
                    </div>
                    <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                      {team.status === "PENDING" && (
                        <>
                          <button
                            onClick={() => handleApproveTeam(team.id)}
                            style={{
                              background: "rgba(16, 185, 129, 0.2)",
                              color: "#34d399",
                              border: "1px solid rgba(16, 185, 129, 0.4)",
                              padding: "6px 12px",
                              borderRadius: "8px",
                              cursor: "pointer",
                              fontSize: "12px",
                              fontWeight: "700"
                            }}
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleRejectTeam(team.id)}
                            style={{
                              background: "rgba(239, 68, 68, 0.2)",
                              color: "#fca5a5",
                              border: "1px solid rgba(239, 68, 68, 0.4)",
                              padding: "6px 12px",
                              borderRadius: "8px",
                              cursor: "pointer",
                              fontSize: "12px",
                              fontWeight: "700"
                            }}
                          >
                            Reject
                          </button>
                        </>
                      )}
                      <button 
                        onClick={() => {
                          setSelectedTeam(team);
                          setEditForm({
                            teamName: team.teamName || "",
                            captainName: team.captainName || "",
                            contactEmail: team.contactEmail || "",
                            logo: team.logo || "",
                            city: team.city || "",
                            description: team.description || "",
                            jerseyColor: team.jerseyColor || "",
                            category: team.category || "Leather Ball"
                          });
                          setShowEditModal(true);
                        }}
                        style={{
                          background: "rgba(99, 102, 241, 0.15)",
                          color: "#a5b4fc",
                          border: "1px solid rgba(99, 102, 241, 0.3)",
                          padding: "6px 12px",
                          borderRadius: "8px",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: "4px"
                        }}
                      >
                        <FaEdit /> Edit
                      </button>
                      <button 
                        onClick={() => handleDeleteTeam(team.id)}
                        style={{
                          background: "rgba(239, 68, 68, 0.1)",
                          color: "var(--danger)",
                          border: "1px solid rgba(239, 68, 68, 0.2)",
                          padding: "6px 12px",
                          borderRadius: "8px",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: "4px"
                        }}
                      >
                        <FaTrash /> Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="ops-empty">
                <FaPlus />
                <p>No teams added yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Team Modal */}
      {showEditModal && (
        <div className="msw-modal-overlay">
          <div className="msw-modal-content">
            <h3>Edit Team Properties</h3>
            <p>Update jersey color, captain details, and ball category.</p>

            <form onSubmit={handleUpdateTeam} className="pp-form" style={{ maxWidth: "100%" }}>
              <div className="pp-input-row">
                <label>
                  Team Name
                  <input
                    type="text"
                    value={editForm.teamName}
                    onChange={(e) => setEditForm({ ...editForm, teamName: e.target.value })}
                    required
                  />
                </label>
              </div>

              <div className="pp-input-row">
                <label>
                  Captain Name
                  <input
                    type="text"
                    value={editForm.captainName}
                    onChange={(e) => setEditForm({ ...editForm, captainName: e.target.value })}
                    required
                  />
                </label>

                <label>
                  Captain Email
                  <input
                    type="email"
                    value={editForm.contactEmail}
                    onChange={(e) => setEditForm({ ...editForm, contactEmail: e.target.value })}
                    required
                  />
                </label>
              </div>

              <div className="pp-input-row">
                <label>
                  Jersey Color
                  <input
                    type="text"
                    placeholder="e.g. Blue, Red & Gold"
                    value={editForm.jerseyColor}
                    onChange={(e) => setEditForm({ ...editForm, jerseyColor: e.target.value })}
                  />
                </label>

                <label>
                  Ball Category
                  <select
                    value={editForm.category}
                    onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                  >
                    <option value="Leather Ball">Leather Ball</option>
                    <option value="Tennis Ball">Tennis Ball</option>
                    <option value="Other">Other</option>
                  </select>
                </label>
              </div>

              <div className="pp-input-row">
                <label>
                  City
                  <input
                    type="text"
                    value={editForm.city}
                    onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                  />
                </label>

                <label>
                  Logo Description / URL
                  <input
                    type="text"
                    placeholder="e.g. Shield logo"
                    value={editForm.logo}
                    onChange={(e) => setEditForm({ ...editForm, logo: e.target.value })}
                  />
                </label>
              </div>

              <div className="pp-input-row">
                <label>
                  Team Description
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
                  style={{ background: "#3b82f6" }}
                  disabled={loading}
                >
                  {loading ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}

export default AddTeams;
