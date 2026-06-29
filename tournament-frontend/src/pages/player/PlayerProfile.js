import React, { useEffect, useState, useCallback } from "react";
import Layout from "../../components/Layout";
import API from "../../services/api";
import { FaUser, FaTrophy, FaMobileAlt, FaAward, FaUsers, FaCrown, FaEdit, FaMapMarkerAlt, FaCalendarAlt, FaHandPaper, FaBaseballBall } from "react-icons/fa";
import "./PlayerProfile.css";

function PlayerProfile() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showEditModal, setShowEditModal] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");

  // Fields for Profile Onboarding
  const [onboardForm, setOnboardForm] = useState({
    playerName: "",
    role: "Batsman",
    jerseyNumber: "",
    battingHand: "Right Hand",
    bowlingStyle: "Right-arm Fast",
    city: "",
    dob: "",
    avatarUrl: "",
    mobileNumber: ""
  });

  // Fields for Profile Editing
  const [editForm, setEditForm] = useState({
    playerName: "",
    role: "Batsman",
    jerseyNumber: "",
    battingHand: "Right Hand",
    bowlingStyle: "Right-arm Fast",
    city: "",
    dob: "",
    avatarUrl: ""
  });

  const email = sessionStorage.getItem("email");

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      // 1. Get current User
      const userRes = await API.get(`/users/current?identifier=${encodeURIComponent(email)}`);
      setUser(userRes.data);

      const mobile = userRes.data.mobileNumber;
      if (mobile) {
        try {
          // 2. Try fetching Player career stats
          const profileRes = await API.get(`/players/profile/${mobile}`);
          setProfile(profileRes.data);
          // Sync edit form fields
          setEditForm({
            playerName: profileRes.data.playerName || "",
            role: profileRes.data.role || "Batsman",
            jerseyNumber: profileRes.data.jerseyNumber || "",
            battingHand: profileRes.data.battingHand || "Right Hand",
            bowlingStyle: profileRes.data.bowlingStyle || "Right-arm Fast",
            city: profileRes.data.city || "",
            dob: profileRes.data.dob || "",
            avatarUrl: profileRes.data.avatarUrl || ""
          });
        } catch (err) {
          // Profile not onboarded yet
          setProfile(null);
        }
      }
    } catch (err) {
      console.error(err);
      setError("Failed to load user account details.");
    } finally {
      setLoading(false);
    }
  }, [email]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleSendOtp = async () => {
    if (!onboardForm.mobileNumber || onboardForm.mobileNumber.length < 10) {
      setError("Please enter a valid 10-digit mobile number first.");
      return;
    }
    try {
      setLoading(true);
      setError("");
      const res = await API.post(`/users/${user.id}/send-otp?mobileNumber=${onboardForm.mobileNumber}`);
      setOtpSent(true);
      alert("Simulation: Your OTP is " + res.data.otp);
      setSuccess("OTP sent successfully to your mobile number.");
      setTimeout(() => setSuccess(""), 4000);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to send OTP.");
    } finally {
      setLoading(false);
    }
  };

  const handleOnboard = async (e) => {
    e.preventDefault();
    let finalMobile = user?.mobileNumber;
    if (!finalMobile) {
      if (!otpSent) {
        setError("Please verify your mobile number with OTP first.");
        return;
      }
      if (!otpCode) {
        setError("Please enter the OTP.");
        return;
      }
      finalMobile = onboardForm.mobileNumber;
      try {
        setLoading(true);
        await API.post(`/users/${user.id}/verify-otp?mobileNumber=${finalMobile}&otp=${otpCode}`);
      } catch (err) {
        setLoading(false);
        setError(err.response?.data?.message || "Invalid OTP. Verification failed.");
        return;
      }
    }

    try {
      setLoading(true);
      setError("");
      
      const teamsRes = await API.get("/teams");
      let teamId = null;
      if (teamsRes.data && teamsRes.data.length > 0) {
        teamId = teamsRes.data[0].id;
      } else {
        setError("No teams available to join. Please create a team first.");
        setLoading(false);
        return;
      }

      await API.post(`/players/add/${teamId}`, {
        playerName: onboardForm.playerName,
        role: onboardForm.role,
        jerseyNumber: onboardForm.jerseyNumber,
        mobileNumber: finalMobile,
        teamRole: "MEMBER",
        isSubstitute: true,
        battingHand: onboardForm.battingHand,
        bowlingStyle: onboardForm.bowlingStyle,
        city: onboardForm.city,
        dob: onboardForm.dob,
        avatarUrl: onboardForm.avatarUrl
      });

      setSuccess("Profile registered successfully! Match stats will now auto-link.");
      fetchProfile();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || err.message || "Failed to onboard player profile.");
    } finally {
      setLoading(false);
    }
  };

  const handleEditProfileSubmit = async (e) => {
    e.preventDefault();
    if (!profile) return;
    try {
      setLoading(true);
      setError("");
      const res = await API.put(`/players/${profile.id}`, editForm);
      setProfile(res.data);
      setSuccess("Profile updated successfully!");
      setShowEditModal(false);
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error(err);
      setError("Failed to update player details.");
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (roleType) => {
    if (!profile) return;
    try {
      const res = await API.put(`/players/${profile.id}/role?role=${roleType}`);
      setProfile(res.data);
      setSuccess(`Role updated to ${roleType}!`);
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error(err);
      setError("Failed to update club role.");
    }
  };

  if (loading && !user) {
    return (
      <Layout title="Player Profile">
        <div className="pp-loading">Loading digital resume...</div>
      </Layout>
    );
  }

  return (
    <Layout
      title="Cricket Resume"
      subtitle="Your lifetime grassroots stats and club affiliations."
    >
      <div className="pp-container">
        {error && <div className="pp-error-banner">{error}</div>}
        {success && <div className="pp-success-banner">{success}</div>}

        {!profile ? (
          <div className="pp-onboard-card animate-fade-in-up">
            <div className="pp-onboard-header">
              <FaAward size={32} className="pp-icon-onboard" />
              <h3>Create Your Digital Resume</h3>
              {user?.mobileNumber ? (
                <p>Onboard now to automatically link your lifetime cricket stats using your unique mobile number: <strong>{user.mobileNumber}</strong></p>
              ) : (
                <p>Onboard now to automatically link your lifetime cricket stats. Please provide your mobile number below.</p>
              )}
            </div>

            <form onSubmit={handleOnboard} className="pp-form">
              {!user?.mobileNumber && (
                <>
                  <div className="pp-input-row">
                    <label>
                      Mobile Number
                      <div style={{ display: "flex", gap: "10px" }}>
                        <input
                          type="text"
                          placeholder="Enter 10-digit mobile number"
                          value={onboardForm.mobileNumber}
                          onChange={(e) => setOnboardForm({ ...onboardForm, mobileNumber: e.target.value })}
                          required
                          disabled={otpSent}
                          style={{ flex: 1 }}
                        />
                        {!otpSent && (
                          <button 
                            type="button" 
                            onClick={handleSendOtp} 
                            disabled={loading}
                            style={{ padding: "0 15px", background: "#3b82f6", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "bold" }}
                          >
                            {loading ? "..." : "Send OTP"}
                          </button>
                        )}
                      </div>
                    </label>
                  </div>
                  
                  {otpSent && (
                    <div className="pp-input-row animate-fade-in-up">
                      <label>
                        Enter OTP
                        <input
                          type="text"
                          placeholder="Enter 6-digit OTP"
                          value={otpCode}
                          onChange={(e) => setOtpCode(e.target.value)}
                          required
                        />
                      </label>
                    </div>
                  )}
                </>
              )}
              <div className="pp-input-row">
                <label>
                  Player Name
                  <input
                    type="text"
                    placeholder="Enter your name"
                    value={onboardForm.playerName}
                    onChange={(e) => setOnboardForm({ ...onboardForm, playerName: e.target.value })}
                    required
                  />
                </label>
              </div>

              <div className="pp-input-row">
                <label>
                  Jersey Number
                  <input
                    type="text"
                    placeholder="e.g. 7, 18, 45"
                    value={onboardForm.jerseyNumber}
                    onChange={(e) => setOnboardForm({ ...onboardForm, jerseyNumber: e.target.value })}
                    required
                  />
                </label>

                <label>
                  Primary Role
                  <select
                    value={onboardForm.role}
                    onChange={(e) => setOnboardForm({ ...onboardForm, role: e.target.value })}
                  >
                    <option value="Batsman">Batsman</option>
                    <option value="Bowler">Bowler</option>
                    <option value="All-Rounder">All-Rounder</option>
                    <option value="Wicket-Keeper">Wicket-Keeper</option>
                  </select>
                </label>
              </div>

              <div className="pp-input-row">
                <label>
                  Batting Hand
                  <select
                    value={onboardForm.battingHand}
                    onChange={(e) => setOnboardForm({ ...onboardForm, battingHand: e.target.value })}
                  >
                    <option value="Right Hand">Right Hand</option>
                    <option value="Left Hand">Left Hand</option>
                  </select>
                </label>

                <label>
                  Bowling Style
                  <select
                    value={onboardForm.bowlingStyle}
                    onChange={(e) => setOnboardForm({ ...onboardForm, bowlingStyle: e.target.value })}
                  >
                    <option value="Right-arm Fast">Right-arm Fast</option>
                    <option value="Right-arm Spin">Right-arm Spin</option>
                    <option value="Left-arm Fast">Left-arm Fast</option>
                    <option value="Left-arm Spin">Left-arm Spin</option>
                    <option value="None">None</option>
                  </select>
                </label>
              </div>

              <div className="pp-input-row">
                <label>
                  City
                  <input
                    type="text"
                    placeholder="Enter your city"
                    value={onboardForm.city}
                    onChange={(e) => setOnboardForm({ ...onboardForm, city: e.target.value })}
                  />
                </label>

                <label>
                  Date of Birth
                  <input
                    type="date"
                    value={onboardForm.dob}
                    onChange={(e) => setOnboardForm({ ...onboardForm, dob: e.target.value })}
                  />
                </label>
              </div>

              <button type="submit" className="pp-btn-submit" disabled={loading}>
                {loading ? "Registering..." : "Onboard Profile"}
              </button>
            </form>
          </div>
        ) : (
          <div className="pp-grid">
            {/* Header Resume Card */}
            <div className="pp-card pp-header-card animate-fade-in-up">
              <div className="pp-avatar">
                <FaUser />
              </div>
              <div className="pp-user-details">
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <h2>{profile.playerName}</h2>
                  <button 
                    className="pp-edit-profile-btn" 
                    onClick={() => setShowEditModal(true)}
                    title="Edit Resume Details"
                  >
                    <FaEdit /> Edit
                  </button>
                </div>
                <div className="pp-badges">
                  <span className="pp-badge-chip role-chip">{profile.role}</span>
                  <span className="pp-badge-chip jersey-chip">#{profile.jerseyNumber}</span>
                  <span className="pp-badge-chip mobile-chip">
                    <FaMobileAlt /> {profile.mobileNumber}
                  </span>
                </div>
                
                <div className="pp-extended-details-grid">
                  <div className="pp-detail-pill">
                    <FaHandPaper /> <span>{profile.battingHand || "Right Hand"}</span>
                  </div>
                  <div className="pp-detail-pill">
                    <FaBaseballBall /> <span>{profile.bowlingStyle || "Right-arm Fast"}</span>
                  </div>
                  {profile.city && (
                    <div className="pp-detail-pill">
                      <FaMapMarkerAlt /> <span>{profile.city}</span>
                    </div>
                  )}
                  {profile.dob && (
                    <div className="pp-detail-pill">
                      <FaCalendarAlt /> <span>{profile.dob}</span>
                    </div>
                  )}
                </div>

                <p className="pp-club-info">
                  <FaUsers /> Member of <strong>{profile.team?.teamName || "Grassroots Club"}</strong>
                </p>
              </div>
              <div className="pp-club-role-control">
                <span className="pp-role-label">Club Member Role:</span>
                <div className="pp-role-badges">
                  {["OWNER", "CAPTAIN", "ADMIN", "MEMBER"].map((r) => (
                    <button
                      key={r}
                      onClick={() => handleRoleChange(r)}
                      className={`pp-role-btn ${profile.teamRole === r ? "active" : ""}`}
                    >
                      {r === "OWNER" && <FaCrown style={{ marginRight: "4px" }} />}
                      {r}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Career Batting Stats Card */}
            <div className="pp-card pp-stats-card animate-fade-in-up" style={{ animationDelay: "0.05s" }}>
              <div className="pp-card-title font-green">🏏 Batting Statistics</div>
              <div className="pp-stats-grid">
                <div className="pp-stat-item">
                  <strong>{profile.matchesPlayed ?? 0}</strong>
                  <span>Matches</span>
                </div>
                <div className="pp-stat-item">
                  <strong>{profile.battingInnings ?? 0}</strong>
                  <span>Innings</span>
                </div>
                <div className="pp-stat-item">
                  <strong>{profile.battingRuns ?? 0}</strong>
                  <span>Runs</span>
                </div>
                <div className="pp-stat-item">
                  <strong>{profile.battingBalls ?? 0}</strong>
                  <span>Balls</span>
                </div>
                <div className="pp-stat-item">
                  <strong>
                    {profile.battingInnings > 0
                      ? (profile.battingRuns / profile.battingInnings).toFixed(2)
                      : "0.00"}
                  </strong>
                  <span>Average</span>
                </div>
                <div className="pp-stat-item">
                  <strong>
                    {profile.battingBalls > 0
                      ? ((profile.battingRuns / profile.battingBalls) * 100).toFixed(2)
                      : "0.00"}
                  </strong>
                  <span>Strike Rate</span>
                </div>
              </div>
            </div>

            {/* Career Bowling Stats Card */}
            <div className="pp-card pp-stats-card animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
              <div className="pp-card-title font-blue">⚾ Bowling Statistics</div>
              <div className="pp-stats-grid">
                <div className="pp-stat-item">
                  <strong>{profile.bowlingWickets ?? 0}</strong>
                  <span>Wickets</span>
                </div>
                <div className="pp-stat-item">
                  <strong>{profile.bowlingRunsConceded ?? 0}</strong>
                  <span>Runs Conc</span>
                </div>
                <div className="pp-stat-item">
                  <strong>{profile.bowlingOvers ?? 0}</strong>
                  <span>Overs</span>
                </div>
                <div className="pp-stat-item">
                  <strong>
                    {profile.bowlingOvers > 0
                      ? (profile.bowlingRunsConceded / profile.bowlingOvers).toFixed(2)
                      : "0.00"}
                  </strong>
                  <span>Economy</span>
                </div>
              </div>
            </div>

            {/* Career Fielding Stats Card */}
            <div className="pp-card pp-stats-card animate-fade-in-up" style={{ animationDelay: "0.15s" }}>
              <div className="pp-card-title font-purple">🧤 Fielding Statistics</div>
              <div className="pp-stats-grid" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
                <div className="pp-stat-item">
                  <strong>{profile.catches ?? 0}</strong>
                  <span>Catches</span>
                </div>
                <div className="pp-stat-item">
                  <strong>{profile.runouts ?? 0}</strong>
                  <span>Run Outs</span>
                </div>
                <div className="pp-stat-item">
                  <strong>{profile.stumpings ?? 0}</strong>
                  <span>Stumpings</span>
                </div>
              </div>
            </div>

            {/* Achievements Cabinet Card */}
            <div className="pp-card pp-stats-card animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
              <div className="pp-card-title font-purple">🏆 Trophy Cabinet & Career Achievements</div>
              <div className="pp-badges-grid">
                <div className="pp-badge-cabinet-item">
                  <div className="pp-badge-icon century-gold">🏏</div>
                  <div className="pp-badge-desc">
                    <h4>Century Maker</h4>
                    <p>Scored 100+ runs in a single tournament</p>
                  </div>
                </div>
                <div className="pp-badge-cabinet-item">
                  <div className="pp-badge-icon hattrick-blue">⚡</div>
                  <div className="pp-badge-desc">
                    <h4>Hat-trick Hero</h4>
                    <p>Took 3 wickets in 3 consecutive deliveries</p>
                  </div>
                </div>
                <div className="pp-badge-cabinet-item">
                  <div className="pp-badge-icon glove-amber">🧤</div>
                  <div className="pp-badge-desc">
                    <h4>Golden Glove</h4>
                    <p>Completed 15+ catches/stumpings</p>
                  </div>
                </div>
                <div className="pp-badge-cabinet-item">
                  <div className="pp-badge-icon captain-crown">👑</div>
                  <div className="pp-badge-desc">
                    <h4>Captain Cool</h4>
                    <p>Led team to a tournament final</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Edit Profile Modal */}
      {showEditModal && (
        <div className="msw-modal-overlay">
          <div className="msw-modal-content">
            <h3>Edit Digital Resume</h3>
            <p>Update your details instantly across the grassroots cricket network.</p>

            <form onSubmit={handleEditProfileSubmit} className="pp-form" style={{ maxWidth: "100%" }}>
              <div className="pp-input-row">
                <label>
                  Player Name
                  <input
                    type="text"
                    value={editForm.playerName}
                    onChange={(e) => setEditForm({ ...editForm, playerName: e.target.value })}
                    required
                  />
                </label>
              </div>

              <div className="pp-input-row">
                <label>
                  Jersey Number
                  <input
                    type="text"
                    value={editForm.jerseyNumber}
                    onChange={(e) => setEditForm({ ...editForm, jerseyNumber: e.target.value })}
                    required
                  />
                </label>

                <label>
                  Primary Role
                  <select
                    value={editForm.role}
                    onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                  >
                    <option value="Batsman">Batsman</option>
                    <option value="Bowler">Bowler</option>
                    <option value="All-Rounder">All-Rounder</option>
                    <option value="Wicket-Keeper">Wicket-Keeper</option>
                  </select>
                </label>
              </div>

              <div className="pp-input-row">
                <label>
                  Batting Hand
                  <select
                    value={editForm.battingHand}
                    onChange={(e) => setEditForm({ ...editForm, battingHand: e.target.value })}
                  >
                    <option value="Right Hand">Right Hand</option>
                    <option value="Left Hand">Left Hand</option>
                  </select>
                </label>

                <label>
                  Bowling Style
                  <select
                    value={editForm.bowlingStyle}
                    onChange={(e) => setEditForm({ ...editForm, bowlingStyle: e.target.value })}
                  >
                    <option value="Right-arm Fast">Right-arm Fast</option>
                    <option value="Right-arm Spin">Right-arm Spin</option>
                    <option value="Left-arm Fast">Left-arm Fast</option>
                    <option value="Left-arm Spin">Left-arm Spin</option>
                    <option value="None">None</option>
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
                  Date of Birth
                  <input
                    type="date"
                    value={editForm.dob}
                    onChange={(e) => setEditForm({ ...editForm, dob: e.target.value })}
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
                  style={{ background: "#10b981" }}
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

export default PlayerProfile;
