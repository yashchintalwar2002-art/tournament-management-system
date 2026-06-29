import React, { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  FaHome,
  FaTrophy,
  FaCalendarAlt,
  FaChartLine,
  FaSignOutAlt,
  FaPlusCircle,
  FaUsers,
  FaSitemap,
  FaUser,
  FaCrown,
  FaShieldAlt,
  FaPalette,
  FaBrain,
  FaCalendarCheck,
  FaRobot,
} from "react-icons/fa";
import API from "../services/api";
import "./Layout.css";

function Layout({ children, title = "Dashboard", subtitle = "Welcome back", isFullWidth = false }) {
  const navigate = useNavigate();
  const role = sessionStorage.getItem("role") || "PLAYER";
  const email = sessionStorage.getItem("email") || "team@tournament.app";

  const [resumeName, setResumeName] = useState("");

  const getAdminName = () => {
    if (!email) return "Admin";
    if (email.toLowerCase() === "admin@gmail.com") return "Super Admin";
    const parts = email.split("@");
    if (parts.length > 0) {
      const name = parts[0];
      return name.charAt(0).toUpperCase() + name.slice(1);
    }
    return "Admin";
  };

  useEffect(() => {
    const fetchProfileName = async () => {
      try {
        const userRes = await API.get(`/users/current?identifier=${encodeURIComponent(email)}`);
        const mobile = userRes.data.mobileNumber;
        if (mobile) {
          const profileRes = await API.get(`/players/profile/${mobile}`);
          if (profileRes.data && profileRes.data.playerName) {
            setResumeName(profileRes.data.playerName);
          }
        }
      } catch (err) {
        // Silent catch: fallback will apply
      }
    };
    if (email) {
      fetchProfileName();
    }
  }, [email]);

  const logout = () => {
    sessionStorage.clear();
    navigate("/login");
  };

  const dashboardPath =
    role === "ADMIN" ? "/admin" : role === "ORGANIZER" ? "/organizer" : "/player";

  const navItems = [
    { to: dashboardPath, label: "Dashboard", icon: <FaHome /> },
    { to: "/player-profile", label: "My Profile", icon: <FaUser /> },
    ...(role === "ADMIN" || role === "ORGANIZER"
      ? [{ to: "/create-tournament", label: "Create", icon: <FaPlusCircle /> }]
      : []),
    { to: "/tournaments", label: "Tournaments", icon: <FaTrophy /> },
    ...(role === "ADMIN" || role === "ORGANIZER"
      ? [{ to: "/add-teams", label: "Add Teams", icon: <FaUsers /> }]
      : []),
    { to: "/matches", label: "Matches", icon: <FaCalendarAlt /> },
    { to: "/live-score", label: "Live Score", icon: <FaChartLine /> },
    { to: "/jersey-designer", label: "Jersey Design", icon: <FaPalette /> },
    { to: "/tournament-simulator", label: "AI Simulator", icon: <FaBrain /> },
    { to: "/ai-coach", label: "AI Coach", icon: <FaRobot /> },
    ...(role === "ADMIN" || role === "ORGANIZER"
      ? [{ to: "/smart-scheduler", label: "Scheduler", icon: <FaCalendarCheck /> }]
      : []),
    ...(role === "ADMIN" ? [{ to: "/users", label: "Users", icon: <FaUsers /> }] : []),
    ...(role === "ADMIN" || role === "ORGANIZER"
      ? [{ to: "/generate-bracket", label: "Brackets", icon: <FaSitemap /> }]
      : []),
  ];

  return (
    <div className="app-shell">
      <div className="bg-glow-container">
        <div className="bg-glow-ball bg-glow-ball-1"></div>
        <div className="bg-glow-ball bg-glow-ball-2"></div>
        <div className="bg-glow-ball bg-glow-ball-3"></div>
      </div>
      <aside className="app-sidebar">
        <div className="brand-lockup">
          <div className="brand-mark">
            <FaTrophy />
          </div>
          <div>
            <p className="brand-kicker">Tournament Pro</p>
            <h2>Command Center</h2>
          </div>
        </div>

        <nav className="app-nav" aria-label="Primary navigation">
          {navItems.map((item) => (
            <NavLink
              key={`${item.to}-${item.label}`}
              to={item.to}
              className={({ isActive }) =>
                isActive ? "app-nav-item active" : "app-nav-item"
              }
            >
              {item.icon}
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>


        <button className="logout-button" onClick={logout}>
          <FaSignOutAlt />
          <span>Logout</span>
        </button>
      </aside>

      <main className="app-main">
        <header className="app-topbar">
          <div>
            <span className="eyebrow">Live operations</span>
            <h1>{title}</h1>
            <p>{subtitle}</p>
          </div>
          {role === "ADMIN" || role === "ORGANIZER" ? (
            <div className="premium-admin-header-card">
              <div className="premium-admin-logo-container">
                <div className="premium-admin-logo-3d">
                  {role === "ADMIN" ? <FaCrown /> : <FaShieldAlt />}
                </div>
                <div className="premium-admin-logo-glow"></div>
              </div>
              <div className="premium-admin-details">
                <span className="premium-admin-kicker">{role} Mode</span>
                <span className="premium-admin-name-3d">{resumeName || getAdminName()}</span>
              </div>
            </div>
          ) : (
            <div className="role-pill">{role} Mode</div>
          )}
        </header>

        <section className={`app-content ${isFullWidth ? "full-width" : ""}`}>{children}</section>
      </main>
    </div>
  );
}

export default Layout;
