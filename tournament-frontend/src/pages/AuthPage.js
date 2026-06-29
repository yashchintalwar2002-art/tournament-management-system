import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { FaEnvelope, FaLock, FaArrowRight, FaTrophy, FaUser, FaUsers } from "react-icons/fa";
import API from "../services/api";
import "./AuthPage.css";

function AuthPage() {
  const navigate = useNavigate();
  const location = useLocation();

  // Determine initial state based on URL path
  const isRegisterRoute = location.pathname === "/register";
  const [isFlipped, setIsFlipped] = useState(isRegisterRoute);

  useEffect(() => {
    setIsFlipped(location.pathname === "/register");
  }, [location.pathname]);

  const toggleFlip = (e, path) => {
    e.preventDefault();
    setIsFlipped(!isFlipped);
    // Optionally update URL without full page reload
    window.history.pushState({}, "", path);
  };

  // --- LOGIN STATE ---
  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [isLoginSubmitting, setIsLoginSubmitting] = useState(false);

  const handleLoginChange = (e) => {
    setLoginData({ ...loginData, [e.target.name]: e.target.value });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoginSubmitting(true);
    try {
      const isMobile = /^\d+$/.test(loginData.email);
      const payload = isMobile
        ? { mobileNumber: loginData.email, password: loginData.password }
        : { email: loginData.email, password: loginData.password };

      const response = await API.post("/auth/login", payload);

      sessionStorage.setItem("token", response.data.token);
      sessionStorage.setItem("role", response.data.role);
      sessionStorage.setItem("email", loginData.email);

      if (response.data.role === "ADMIN") {
        navigate("/admin");
      } else if (response.data.role === "ORGANIZER") {
        navigate("/organizer");
      } else {
        navigate("/player");
      }
    } catch (error) {
      alert("Invalid email or password");
    } finally {
      setIsLoginSubmitting(false);
    }
  };

  // --- REGISTER STATE ---
  const [registerData, setRegisterData] = useState({
    name: "",
    email: "",
    password: "",
    role: "PLAYER",
    mobileNumber: "",
  });
  const [isRegisterSubmitting, setIsRegisterSubmitting] = useState(false);

  const handleRegisterChange = (e) => {
    setRegisterData({ ...registerData, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setIsRegisterSubmitting(true);
    try {
      const payload = {
        email: registerData.email,
        password: registerData.password,
        role: registerData.role,
        mobileNumber: registerData.mobileNumber,
      };

      await API.post("/auth/register", payload);
      // On success, flip back to login
      setIsFlipped(false);
      window.history.pushState({}, "", "/login");
      alert("Registration successful! Please login.");
    } catch (error) {
      console.log(error.response?.data || error.message);
      alert("Registration failed. Please check the details and try again.");
    } finally {
      setIsRegisterSubmitting(false);
    }
  };

  const apiBaseUrl = process.env.REACT_APP_API_URL || "http://localhost:8080";
  const googleLoginUrl = `${apiBaseUrl}/oauth2/authorization/google`;

  return (
    <div className="auth-page">
      {/* Animated Live Wallpaper Background */}
      <div className="auth-bg">
        <div className="bg-blob blob-1"></div>
        <div className="bg-blob blob-2"></div>
        <div className="bg-blob blob-3"></div>
      </div>

      <div className="auth-container">
        {/* Left Side: Showcase Text */}
        <section className="auth-showcase">
          <h1>Tournament Pro Operations</h1>
          <p>
            Experience premium tournament management. Build brackets, manage teams, 
            update results, and track live scores from one centralized dashboard.
          </p>
          <div className="auth-metrics">
            <div className="auth-metric">
              <strong>Live</strong>
              <span>Score Tracking</span>
            </div>
            <div className="auth-metric">
              <strong>8+</strong>
              <span>Team Brackets</span>
            </div>
            <div className="auth-metric">
              <strong>3</strong>
              <span>Role Workspaces</span>
            </div>
          </div>
        </section>

        {/* Right Side: 3D Flip Card */}
        <section className="auth-panel">
          <div className="auth-scene">
            <div className={`auth-card ${isFlipped ? "is-flipped" : ""}`}>
              
              {/* FRONT FACE (LOGIN) */}
              <div className="auth-face auth-front">
                <div className="auth-brand">
                  <div className="auth-logo"><FaTrophy /></div>
                  <div>
                    <span>Tournament Pro</span>
                    <h2>Operations Portal</h2>
                  </div>
                </div>

                <h1>Welcome back</h1>
                <p className="auth-subtitle">Sign in to manage tournaments and matches.</p>

                <form className="auth-form" onSubmit={handleLogin}>
                  <div className="auth-input-group">
                    <div className="auth-input-icon"><FaEnvelope /></div>
                    <input
                      type="text"
                      name="email"
                      placeholder="Email or Mobile number"
                      value={loginData.email}
                      onChange={handleLoginChange}
                      required
                    />
                  </div>

                  <div className="auth-input-group">
                    <div className="auth-input-icon"><FaLock /></div>
                    <input
                      type="password"
                      name="password"
                      placeholder="Password"
                      value={loginData.password}
                      onChange={handleLoginChange}
                      required
                    />
                  </div>

                  <button type="submit" className="auth-btn" disabled={isLoginSubmitting}>
                    {isLoginSubmitting ? "Signing in..." : "Login"} <FaArrowRight />
                  </button>

                  <div className="auth-divider">
                    <span></span><p>or</p><span></span>
                  </div>

                  <button type="button" className="auth-google-btn" onClick={() => window.location.href = googleLoginUrl}>
                    <span className="auth-google-icon">G</span>
                    Continue with Google
                  </button>
                </form>

                <div className="auth-footer">
                  Don't have an account? 
                  <a href="/register" onClick={(e) => toggleFlip(e, "/register")}> Register</a>
                </div>
              </div>

              {/* BACK FACE (REGISTER) */}
              <div className="auth-face auth-back">
                <div className="auth-brand">
                  <div className="auth-logo"><FaTrophy /></div>
                  <div>
                    <span>Tournament Pro</span>
                    <h2>Create Account</h2>
                  </div>
                </div>

                <h1>Join the Platform</h1>
                <p className="auth-subtitle">Choose your role and start building.</p>

                <form className="auth-form" onSubmit={handleRegister}>
                  <div className="auth-input-group">
                    <div className="auth-input-icon"><FaUser /></div>
                    <input type="text" name="name" placeholder="Full name" value={registerData.name} onChange={handleRegisterChange} required />
                  </div>
                  <div className="auth-input-group">
                    <div className="auth-input-icon"><FaEnvelope /></div>
                    <input type="email" name="email" placeholder="Email address" value={registerData.email} onChange={handleRegisterChange} required />
                  </div>
                  <div className="auth-input-group">
                    <div className="auth-input-icon"><FaLock /></div>
                    <input type="password" name="password" placeholder="Password" value={registerData.password} onChange={handleRegisterChange} required />
                  </div>
                  <div className="auth-input-group">
                    <div className="auth-input-icon"><span style={{ fontSize: "14px", fontWeight: "bold", opacity: 0.6 }}>#</span></div>
                    <input type="text" name="mobileNumber" placeholder="Mobile number (Unique ID)" value={registerData.mobileNumber} onChange={handleRegisterChange} required />
                  </div>
                  <div className="auth-input-group">
                    <div className="auth-input-icon"><FaUsers /></div>
                    <select name="role" value={registerData.role} onChange={handleRegisterChange}>
                      <option value="PLAYER">Player</option>
                      <option value="ORGANIZER">Organizer</option>
                      <option value="ADMIN">Admin</option>
                    </select>
                  </div>

                  <button type="submit" className="auth-btn" disabled={isRegisterSubmitting}>
                    {isRegisterSubmitting ? "Creating..." : "Register"} <FaArrowRight />
                  </button>
                </form>

                <div className="auth-footer">
                  Already have an account? 
                  <a href="/login" onClick={(e) => toggleFlip(e, "/login")}> Login</a>
                </div>
              </div>

            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default AuthPage;
