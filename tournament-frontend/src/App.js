import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import AuthPage from "./pages/AuthPage";
import AdminDashboard from "./pages/admin/AdminDashboard";
import OrganizerDashboard from "./pages/organizer/OrganizerDashboard";
import PlayerDashboard from "./pages/player/PlayerDashboard";
import CreateTournament from "./pages/tournament/CreateTournament";
import TournamentList from "./pages/tournament/TournamentList";
import UserList from "./pages/admin/UserList";
import MatchScheduler from "./pages/organizer/MatchScheduler";
import MatchList from "./pages/match/MatchList";
import AddTeams from "./pages/organizer/AddTeams";
import GenerateBracket from "./pages/organizer/GenerateBracket";
import BracketView from "./pages/BracketView/BracketView";
import UpdateMatchResult from "./pages/organizer/UpdateMatchResult";
import GenerateNextRound from "./pages/organizer/GenerateNextRound";
import TournamentDetails from "./pages/tournament/TournamentDetails";
import SocialLoginSuccess from "./pages/SocialLoginSuccess";
import JoinTournament from "./pages/player/JoinTournament";
import AddPlayerPage from "./pages/AddPlayerPage";
import AddPlayers from "./pages/AddPlayers";
import LiveScorePage from "./pages/live/LiveScorePage";
import PlayerProfile from "./pages/player/PlayerProfile";
import MatchSetupWizard from "./pages/organizer/MatchSetupWizard";
import ProtectedRoute from "./components/ProtectedRoute";
import SplashScreen from "./components/SplashScreen";
import JerseyDesigner from "./pages/player/JerseyDesigner";
import TournamentSimulator from "./pages/tournament/TournamentSimulator";
import LiveMatchCenter from "./pages/live/LiveMatchCenter";
import SmartScheduler from "./pages/organizer/SmartScheduler";
import AICoach from "./pages/player/AICoach";

function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [globalToasts, setGlobalToasts] = useState([]);

  useEffect(() => {
    const originalAlert = window.alert;
    window.alert = (message) => {
      const id = Date.now();
      let type = "success";
      const lower = message.toLowerCase();
      if (lower.includes("fail") || lower.includes("error") || lower.includes("invalid") || lower.includes("wrong")) {
        type = "error";
      } else if (lower.includes("warning") || lower.includes("select") || lower.includes("fill")) {
        type = "warning";
      }
      setGlobalToasts((prev) => [...prev, { id, text: message, type }]);
      setTimeout(() => {
        setGlobalToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4000);
    };
    return () => {
      window.alert = originalAlert;
    };
  }, []);

  if (showSplash) {
    return <SplashScreen onFinished={() => setShowSplash(false)} />;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<AuthPage />} />
        <Route path="/register" element={<AuthPage />} />
        <Route path="/social-login-success" element={<SocialLoginSuccess />} />

        <Route
          path="/admin"
          element={
            <ProtectedRoute role="ADMIN">
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/organizer"
          element={
            <ProtectedRoute role="ORGANIZER">
              <OrganizerDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/player"
          element={
            <ProtectedRoute allowedRoles={["PLAYER"]}>
              <PlayerDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/tournaments"
          element={
            <ProtectedRoute allowedRoles={["ADMIN", "ORGANIZER", "PLAYER"]}>
              <TournamentList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/tournament-details/:id"
          element={
            <ProtectedRoute allowedRoles={["ADMIN", "ORGANIZER", "PLAYER"]}>
              <TournamentDetails />
            </ProtectedRoute>
          }
        />
        <Route
          path="/matches"
          element={
            <ProtectedRoute allowedRoles={["ADMIN", "ORGANIZER", "PLAYER"]}>
              <MatchList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/bracket-view/:tournamentId"
          element={
            <ProtectedRoute allowedRoles={["ADMIN", "ORGANIZER", "PLAYER"]}>
              <BracketView />
            </ProtectedRoute>
          }
        />
        <Route
          path="/live-score"
          element={
            <ProtectedRoute allowedRoles={["ADMIN", "ORGANIZER", "PLAYER"]}>
              <LiveScorePage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/users"
          element={
            <ProtectedRoute role="ADMIN">
              <UserList />
            </ProtectedRoute>
          }
        />

        <Route
          path="/create-tournament"
          element={
            <ProtectedRoute allowedRoles={["ADMIN", "ORGANIZER"]}>
              <CreateTournament />
            </ProtectedRoute>
          }
        />
        <Route
          path="/add-teams"
          element={
            <ProtectedRoute allowedRoles={["ADMIN", "ORGANIZER"]}>
              <AddTeams />
            </ProtectedRoute>
          }
        />
        <Route
          path="/generate-bracket"
          element={
            <ProtectedRoute allowedRoles={["ADMIN", "ORGANIZER"]}>
              <GenerateBracket />
            </ProtectedRoute>
          }
        />
        <Route
          path="/update-match-result"
          element={
            <ProtectedRoute allowedRoles={["ADMIN", "ORGANIZER"]}>
              <UpdateMatchResult />
            </ProtectedRoute>
          }
        />
        <Route
          path="/generate-next-round"
          element={
            <ProtectedRoute allowedRoles={["ADMIN", "ORGANIZER"]}>
              <GenerateNextRound />
            </ProtectedRoute>
          }
        />
        <Route
          path="/match-scheduler"
          element={
            <ProtectedRoute allowedRoles={["ADMIN", "ORGANIZER"]}>
              <MatchScheduler />
            </ProtectedRoute>
          }
        />
        <Route
          path="/match-setup-wizard"
          element={
            <ProtectedRoute allowedRoles={["ADMIN", "ORGANIZER"]}>
              <MatchSetupWizard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/add-player"
          element={
            <ProtectedRoute allowedRoles={["ADMIN", "ORGANIZER"]}>
              <AddPlayerPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/add_player"
          element={
            <ProtectedRoute allowedRoles={["ADMIN", "ORGANIZER"]}>
              <AddPlayerPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/add-players"
          element={
            <ProtectedRoute allowedRoles={["ADMIN", "ORGANIZER"]}>
              <AddPlayers />
            </ProtectedRoute>
          }
        />

        <Route
          path="/join-tournament"
          element={
            <ProtectedRoute allowedRoles={["PLAYER"]}>
              <JoinTournament />
            </ProtectedRoute>
          }
        />
        <Route
          path="/player-profile"
          element={
            <ProtectedRoute allowedRoles={["ADMIN", "ORGANIZER", "PLAYER"]}>
              <PlayerProfile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/jersey-designer"
          element={
            <ProtectedRoute allowedRoles={["ADMIN", "ORGANIZER", "PLAYER"]}>
              <JerseyDesigner />
            </ProtectedRoute>
          }
        />
        <Route
          path="/tournament-simulator"
          element={
            <ProtectedRoute allowedRoles={["ADMIN", "ORGANIZER", "PLAYER"]}>
              <TournamentSimulator />
            </ProtectedRoute>
          }
        />
        <Route
          path="/live-match-center/:matchId"
          element={
            <ProtectedRoute allowedRoles={["ADMIN", "ORGANIZER", "PLAYER"]}>
              <LiveMatchCenter />
            </ProtectedRoute>
          }
        />
        <Route
          path="/smart-scheduler"
          element={
            <ProtectedRoute allowedRoles={["ADMIN", "ORGANIZER"]}>
              <SmartScheduler />
            </ProtectedRoute>
          }
        />
        <Route
          path="/ai-coach"
          element={
            <ProtectedRoute allowedRoles={["ADMIN", "ORGANIZER", "PLAYER"]}>
              <AICoach />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
      <div className="toast-container">
        {globalToasts.map((toast) => (
          <div key={toast.id} className={`in-app-toast ${toast.type}`}>
            <span>{toast.text}</span>
            <button className="toast-close-btn" onClick={() => setGlobalToasts(prev => prev.filter(t => t.id !== toast.id))}>
              &times;
            </button>
          </div>
        ))}
      </div>
    </BrowserRouter>
  );
}

export default App;
