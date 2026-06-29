import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import API from "../../services/api";
import {
  FaBroadcastTower,
  FaCalendarAlt,
  FaEye,
  FaGamepad,
  FaSitemap,
  FaTrophy,
  FaUserShield,
  FaUser,
  FaPalette,
  FaBrain,
} from "react-icons/fa";
import Layout from "../../components/Layout";
import "./PlayerDashboard.css";

function PlayerDashboard() {
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

  return (
    <Layout
      title="Player Dashboard"
      subtitle="View tournaments, matches, live scores, and bracket progress."
    >
      <div className="player-hero">
        <div className="player-hero-left">
          <div className="player-avatar">
            <FaGamepad />
          </div>

          <div>
            <span className="hero-label">Player hub</span>
            <h2>
              Welcome back, <span className="premium-admin-dashboard-name">{resumeName || (userEmail ? userEmail.split("@")[0].charAt(0).toUpperCase() + userEmail.split("@")[0].slice(1) : "Player")}</span>
            </h2>
            <p>
              Track tournaments, view match schedules, follow live scores, and
              watch bracket progress from one clean player workspace.
            </p>
          </div>
        </div>

        <div className="player-mode-pill">
          <FaUserShield /> Player Mode
        </div>
      </div>

      <div className="player-grid">
        <Link to="/player-profile" className="player-card green-card">
          <div className="player-card-icon">
            <FaUser />
          </div>
          <h3>My Profile</h3>
          <p>View your career cricket stats, averages, and club info.</p>
          <span>
            <FaEye /> Open
          </span>
        </Link>

        <Link to="/tournaments" className="player-card blue-card">
          <div className="player-card-icon">
            <FaTrophy />
          </div>
          <h3>View Tournaments</h3>
          <p>Explore active tournaments and open complete event details.</p>
          <span>
            <FaEye /> Open
          </span>
        </Link>

        <Link to="/matches" className="player-card purple-card">
          <div className="player-card-icon">
            <FaCalendarAlt />
          </div>
          <h3>View Matches</h3>
          <p>Check quarter-final, semi-final, and final schedules.</p>
          <span>
            <FaEye /> Open
          </span>
        </Link>

        <Link to="/live-score" className="player-card red-card">
          <div className="player-card-icon">
            <FaBroadcastTower />
          </div>
          <h3>Live Scores</h3>
          <p>Watch live match status and score updates as they happen.</p>
          <span>
            <FaEye /> Open
          </span>
        </Link>

        <Link to="/jersey-designer" className="player-card blue-card">
          <div className="player-card-icon" style={{ background: "linear-gradient(135deg, var(--primary), var(--accent-purple))" }}>
            <FaPalette />
          </div>
          <h3>Jersey Customizer</h3>
          <p>Design your custom club kit and export digital trading cards.</p>
          <span>
            <FaEye /> Customize
          </span>
        </Link>

        <Link to="/tournament-simulator" className="player-card purple-card">
          <div className="player-card-icon" style={{ background: "linear-gradient(135deg, var(--accent-purple), var(--primary))" }}>
            <FaBrain />
          </div>
          <h3>AI Predictor</h3>
          <p>Run simulated matches and analyze team statistics metrics.</p>
          <span>
            <FaEye /> Predict
          </span>
        </Link>

        <Link to="/tournaments" className="player-card green-card">
          <div className="player-card-icon">
            <FaSitemap />
          </div>
          <h3>Bracket Progress</h3>
          <p>Select a tournament and view the path to the champion.</p>
          <span>
            <FaEye /> Open
          </span>
        </Link>
      </div>

      <div className="player-info-card">
        <h3>Player Access</h3>
        <p>
          Players can view tournaments, matches, brackets, live scores, and
          results. Organizer actions stay protected for admin and organizer roles.
        </p>
      </div>
    </Layout>
  );
}

export default PlayerDashboard;
