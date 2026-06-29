import React, { useState, useRef, useEffect } from "react";
import { FaPalette, FaDownload, FaUndo, FaTrophy, FaUser, FaSave } from "react-icons/fa";
import Layout from "../../components/Layout";
import API from "../../services/api";
import "./JerseyDesigner.css";

function JerseyDesigner() {
  const [tournaments, setTournaments] = useState([]);
  const [teams, setTeams] = useState([]);
  const [selectedTeamId, setSelectedTeamId] = useState("");
  const [selectedTeam, setSelectedTeam] = useState(null);

  const [teamName, setTeamName] = useState("CHENNAI KINGS");
  const [captainName, setCaptainName] = useState("Ruturaj Gaikwad");
  const [jerseyNumber, setJerseyNumber] = useState("7");
  const [pattern, setPattern] = useState("stripes"); // solid, stripes, hoops, gradient, sash, checks, chevron, camo
  const [primaryColor, setPrimaryColor] = useState("#fbbf24"); // yellow
  const [secondaryColor, setSecondaryColor] = useState("#1e3a8a"); // deep blue
  const [roleType, setRoleType] = useState("All-Rounder");
  const [saving, setSaving] = useState(false);
  
  const canvasRef = useRef(null);

  const userEmail = sessionStorage.getItem("email") || "admin@gmail.com";
  const role = sessionStorage.getItem("role") || "PLAYER";
  const isAdmin = role === "ADMIN" || role === "ORGANIZER";

  const hasWriteAccess = (tournament) => {
    if (!isAdmin) return false;
    let creator = tournament?.createdBy;
    if (!creator) creator = "admin@gmail.com";
    if (userEmail && creator.toLowerCase() === userEmail.toLowerCase()) return true;
    const collaborators = tournament?.collaborators ? tournament.collaborators.split(",").filter(c => c.trim().length > 0) : [];
    return collaborators.some(collab => userEmail && collab.trim().toLowerCase() === userEmail.toLowerCase());
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    drawCard();
  }, [teamName, captainName, jerseyNumber, pattern, primaryColor, secondaryColor, roleType]);

  useEffect(() => {
    if (selectedTeamId) {
      const team = teams.find((t) => t.id === Number(selectedTeamId));
      if (team) {
        setSelectedTeam(team);
        setTeamName(team.teamName || "");
        setCaptainName(team.captainName || "");
        
        // Deserialize jerseyColor (format: #primary,#secondary,pattern)
        if (team.jerseyColor && team.jerseyColor.includes(",")) {
          const parts = team.jerseyColor.split(",");
          if (parts[0]) setPrimaryColor(parts[0]);
          if (parts[1]) setSecondaryColor(parts[1]);
          if (parts[2]) setPattern(parts[2]);
        }
      }
    } else {
      setSelectedTeam(null);
    }
  }, [selectedTeamId, teams]);

  const fetchData = async () => {
    try {
      const [tourneysRes, teamsRes] = await Promise.all([
        API.get("/tournaments"),
        API.get("/teams"),
      ]);

      // Filter tournaments the user can configure
      const allowedTourneys = tourneysRes.data.filter(hasWriteAccess);
      setTournaments(allowedTourneys);

      // Filter teams registered under those tournaments
      const allowedTeams = teamsRes.data.filter((t) =>
        t.tournament && allowedTourneys.some((tn) => tn.id === t.tournament.id)
      );
      setTeams(allowedTeams);
    } catch (err) {
      console.error("Failed to load customizer details:", err);
    }
  };

  const drawCard = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 1. Draw Glass Card background with neon-indigo glow
    const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    grad.addColorStop(0, "#111424");
    grad.addColorStop(1, "#070912");
    ctx.fillStyle = grad;
    
    const roundRect = (x, y, w, h, r) => {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + w, y, x + w, y + h, r);
      ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r);
      ctx.arcTo(x, y, x + w, y, r);
      ctx.closePath();
    };

    roundRect(10, 10, canvas.width - 20, canvas.height - 20, 20);
    ctx.fill();

    ctx.strokeStyle = "rgba(99, 102, 241, 0.4)";
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.strokeStyle = "rgba(34, 211, 238, 0.25)";
    ctx.lineWidth = 1;
    roundRect(14, 14, canvas.width - 28, canvas.height - 28, 16);
    ctx.stroke();

    ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
    roundRect(25, 25, canvas.width - 50, 45, 10);
    ctx.fill();

    ctx.fillStyle = "#818cf8";
    ctx.font = "bold 13px 'Outfit', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("TOURNAMENT PRO TRADING CARD", canvas.width / 2, 52);

    const cx = canvas.width / 2;
    const cy = 175; // Elevated slightly to float centrally on the card

    // 1. Soft shadow under the floating jersey
    const jerseyShadow = ctx.createRadialGradient(cx, cy + 60, 5, cx, cy + 60, 40);
    jerseyShadow.addColorStop(0, "rgba(0, 0, 0, 0.4)");
    jerseyShadow.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = jerseyShadow;
    ctx.beginPath();
    ctx.ellipse(cx, cy + 60, 36, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    // 2. Unified premium jersey shape vector path
    const drawJerseyPath = (ctx, cx, cy) => {
      ctx.beginPath();
      ctx.moveTo(cx - 14, cy - 40); // neck left (y = 135)
      ctx.quadraticCurveTo(cx, cy - 30, cx + 14, cy - 40); // neck curve
      ctx.lineTo(cx + 38, cy - 36); // shoulder right (y = 139)
      ctx.lineTo(cx + 70, cy - 16); // sleeve top right (y = 159)
      ctx.lineTo(cx + 58, cy + 2);  // sleeve opening bottom right (y = 177)
      ctx.lineTo(cx + 36, cy - 10); // underarm right (y = 165)
      ctx.lineTo(cx + 34, cy + 47); // waist bottom right (y = 222)
      ctx.lineTo(cx - 34, cy + 47); // waist bottom left (y = 222)
      ctx.lineTo(cx - 36, cy - 10); // underarm left (y = 165)
      ctx.lineTo(cx - 58, cy + 2);  // sleeve opening bottom left (y = 177)
      ctx.lineTo(cx - 70, cy - 16); // sleeve top left (y = 159)
      ctx.lineTo(cx - 38, cy - 36); // shoulder left (y = 139)
      ctx.closePath();
    };

    // Draw main jersey filled body
    drawJerseyPath(ctx, cx, cy);
    ctx.fillStyle = primaryColor;
    ctx.fill();

    // Clip pattern drawings to jersey shape
    ctx.save();
    drawJerseyPath(ctx, cx, cy);
    ctx.clip();

    ctx.fillStyle = secondaryColor;
    if (pattern === "stripes") {
      for (let i = -80; i <= 80; i += 20) {
        ctx.fillRect(cx + i - 4, cy - 45, 8, 100);
      }
    } else if (pattern === "hoops") {
      for (let i = -40; i <= 50; i += 18) {
        ctx.fillRect(cx - 85, cy + i - 4, 170, 8);
      }
    } else if (pattern === "gradient") {
      const jGrad = ctx.createLinearGradient(cx, cy - 40, cx, cy + 50);
      jGrad.addColorStop(0, primaryColor);
      jGrad.addColorStop(1, secondaryColor);
      ctx.fillStyle = jGrad;
      ctx.fillRect(cx - 85, cy - 45, 170, 100);
    } else if (pattern === "sash") {
      ctx.beginPath();
      ctx.moveTo(cx - 80, cy - 20);
      ctx.lineTo(cx - 50, cy - 40);
      ctx.lineTo(cx + 80, cy + 30);
      ctx.lineTo(cx + 50, cy + 50);
      ctx.closePath();
      ctx.fill();
    } else if (pattern === "checks") {
      for (let row = 0; row < 6; row++) {
        for (let col = 0; col < 8; col++) {
          if ((row + col) % 2 === 1) {
            ctx.fillRect(cx - 80 + col * 20, cy - 40 + row * 16, 20, 16);
          }
        }
      }
    } else if (pattern === "chevron") {
      ctx.beginPath();
      ctx.moveTo(cx, cy - 10);
      ctx.lineTo(cx + 80, cy - 40);
      ctx.lineTo(cx + 80, cy - 25);
      ctx.lineTo(cx, cy + 5);
      ctx.lineTo(cx - 80, cy - 25);
      ctx.lineTo(cx - 80, cy - 40);
      ctx.closePath();
      ctx.fill();
    } else if (pattern === "camo") {
      ctx.beginPath();
      ctx.arc(cx - 30, cy - 20, 16, 0, Math.PI * 2);
      ctx.arc(cx - 10, cy - 10, 14, 0, Math.PI * 2);
      ctx.arc(cx + 25, cy + 12, 18, 0, Math.PI * 2);
      ctx.arc(cx + 40, cy - 10, 15, 0, Math.PI * 2);
      ctx.arc(cx - 25, cy + 32, 16, 0, Math.PI * 2);
      ctx.arc(cx + 10, cy + 28, 14, 0, Math.PI * 2);
      ctx.arc(cx + 15, cy - 30, 12, 0, Math.PI * 2);
      ctx.fill();
    } else if (pattern === "argyle") {
      ctx.strokeStyle = secondaryColor;
      ctx.lineWidth = 1.5;
      for (let i = -80; i <= 80; i += 24) {
        ctx.beginPath();
        ctx.moveTo(cx + i - 24, cy - 50);
        ctx.lineTo(cx + i + 24, cy + 50);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(cx + i + 24, cy - 50);
        ctx.lineTo(cx + i - 24, cy + 50);
        ctx.stroke();
      }
      ctx.fillStyle = secondaryColor;
      for (let i = -80; i <= 80; i += 24) {
        ctx.beginPath();
        ctx.moveTo(cx + i, cy - 15);
        ctx.lineTo(cx + i + 5, cy - 10);
        ctx.lineTo(cx + i, cy - 5);
        ctx.lineTo(cx + i - 5, cy - 10);
        ctx.closePath();
        ctx.fill();
        
        ctx.beginPath();
        ctx.moveTo(cx + i, cy + 15);
        ctx.lineTo(cx + i + 5, cy + 20);
        ctx.lineTo(cx + i, cy + 25);
        ctx.lineTo(cx + i - 5, cy + 20);
        ctx.closePath();
        ctx.fill();
      }
    } else if (pattern === "split") {
      ctx.fillStyle = secondaryColor;
      ctx.fillRect(cx, cy - 50, 85, 100);
    } else if (pattern === "flames") {
      ctx.fillStyle = secondaryColor;
      ctx.beginPath();
      ctx.moveTo(cx - 34, cy + 47);
      ctx.quadraticCurveTo(cx - 30, cy + 20, cx - 24, cy + 10);
      ctx.quadraticCurveTo(cx - 20, cy + 25, cx - 12, cy + 47);
      ctx.moveTo(cx - 12, cy + 47);
      ctx.quadraticCurveTo(cx, cy + 10, cx, cy - 5);
      ctx.quadraticCurveTo(cx + 4, cy + 20, cx + 12, cy + 47);
      ctx.moveTo(cx + 12, cy + 47);
      ctx.quadraticCurveTo(cx + 20, cy + 25, cx + 24, cy + 10);
      ctx.quadraticCurveTo(cx + 30, cy + 20, cx + 34, cy + 47);
      ctx.closePath();
      ctx.fill();
    } else if (pattern === "lightning") {
      ctx.fillStyle = secondaryColor;
      ctx.beginPath();
      ctx.moveTo(cx + 15, cy - 40);
      ctx.lineTo(cx - 8, cy - 5);
      ctx.lineTo(cx + 6, cy - 5);
      ctx.lineTo(cx - 15, cy + 40);
      ctx.lineTo(cx + 8, cy + 5);
      ctx.lineTo(cx - 6, cy + 5);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 1.2;
      ctx.stroke();
    }
    ctx.restore();

    // Draw collar trims and sleeve cuffs
    ctx.strokeStyle = secondaryColor;
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(cx - 14, cy - 40);
    ctx.quadraticCurveTo(cx, cy - 30, cx + 14, cy - 40);
    ctx.stroke();

    ctx.strokeStyle = "rgba(0, 0, 0, 0.25)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx - 13, cy - 38);
    ctx.quadraticCurveTo(cx, cy - 28, cx + 13, cy - 38);
    ctx.stroke();

    ctx.strokeStyle = secondaryColor;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(cx - 70, cy - 16);
    ctx.lineTo(cx - 58, cy + 2);
    ctx.moveTo(cx + 70, cy - 16);
    ctx.lineTo(cx + 58, cy + 2);
    ctx.stroke();

    // 3D creases
    ctx.strokeStyle = "rgba(0, 0, 0, 0.12)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(cx - 36, cy - 10);
    ctx.quadraticCurveTo(cx - 20, cy + 2, cx - 8, cy + 20);
    ctx.moveTo(cx + 36, cy - 10);
    ctx.quadraticCurveTo(cx + 20, cy + 2, cx + 8, cy + 20);
    ctx.stroke();

    const leftShadow = ctx.createLinearGradient(cx - 34, cy, cx - 20, cy);
    leftShadow.addColorStop(0, "rgba(0, 0, 0, 0.18)");
    leftShadow.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = leftShadow;
    ctx.beginPath();
    ctx.moveTo(cx - 36, cy - 10);
    ctx.lineTo(cx - 34, cy + 47);
    ctx.lineTo(cx - 20, cy + 47);
    ctx.lineTo(cx - 20, cy - 10);
    ctx.closePath();
    ctx.fill();

    const rightShadow = ctx.createLinearGradient(cx + 34, cy, cx + 20, cy);
    rightShadow.addColorStop(0, "rgba(0, 0, 0, 0.18)");
    rightShadow.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = rightShadow;
    ctx.beginPath();
    ctx.moveTo(cx + 36, cy - 10);
    ctx.lineTo(cx + 34, cy + 47);
    ctx.lineTo(cx + 20, cy + 47);
    ctx.lineTo(cx + 20, cy - 10);
    ctx.closePath();
    ctx.fill();

    const lightCrease = ctx.createLinearGradient(cx - 6, cy - 30, cx + 6, cy - 30);
    lightCrease.addColorStop(0, "rgba(255, 255, 255, 0.12)");
    lightCrease.addColorStop(0.5, "rgba(255, 255, 255, 0)");
    lightCrease.addColorStop(1, "rgba(255, 255, 255, 0.08)");
    ctx.fillStyle = lightCrease;
    ctx.fillRect(cx - 5, cy - 30, 10, 75);

    // Jersey center numbers
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 26px 'Outfit', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(jerseyNumber, cx, cy + 18);

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 18px 'Outfit', sans-serif";
    ctx.fillText(teamName.toUpperCase(), cx, 265);

    ctx.fillStyle = "#94a3b8";
    ctx.font = "500 12px 'Outfit', sans-serif";
    ctx.fillText("CAPTAIN", cx, 285);

    ctx.fillStyle = "#22d3ee";
    ctx.font = "bold 14px 'Outfit', sans-serif";
    ctx.fillText(captainName, cx, 305);

    ctx.fillStyle = "rgba(255, 255, 255, 0.03)";
    roundRect(20, 330, canvas.width - 40, 75, 10);
    ctx.fill();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.07)";
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = "#94a3b8";
    ctx.font = "bold 10px 'Outfit', sans-serif";
    ctx.fillText("ROLE", cx - 88, 355);
    ctx.fillText("STATUS", cx, 355);
    ctx.fillText("POWER", cx + 88, 355);

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 12px 'Outfit', sans-serif";
    ctx.fillText(roleType, cx - 88, 382);
    
    ctx.fillStyle = "#22c55e";
    ctx.fillText("REGISTERED", cx, 382);

    ctx.fillStyle = "#fbbf24";
    ctx.fillText("95 OVR", cx + 88, 382);
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const url = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.download = `${teamName.replace(/\s+/g, "_").toLowerCase()}_card.png`;
    link.href = url;
    link.click();
  };

  const handleSaveToProfile = async () => {
    if (!selectedTeamId || !selectedTeam) return;
    try {
      setSaving(true);
      const serializedJersey = `${primaryColor},${secondaryColor},${pattern}`;
      await API.put(`/teams/${selectedTeamId}`, {
        ...selectedTeam,
        teamName,
        captainName,
        jerseyColor: serializedJersey
      });
      alert("Team jersey configurations saved directly to the database profile!");
      fetchData(); // reload
    } catch (err) {
      console.error(err);
      alert("Failed to save jersey profile. Access restricted to Tournament owners.");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setSelectedTeamId("");
    setTeamName("CHENNAI KINGS");
    setCaptainName("Ruturaj Gaikwad");
    setJerseyNumber("7");
    setPattern("stripes");
    setPrimaryColor("#fbbf24");
    setSecondaryColor("#1e3a8a");
    setRoleType("All-Rounder");
  };

  return (
    <Layout
      title="Jersey Customizer"
      subtitle="Design your team jersey and export dynamic trading cards."
    >
      <div className="jd-layout">
        
        {/* Left pane: custom controls */}
        <div className="jd-controls-card">
          <div className="jd-header">
            <FaPalette className="jd-icon-header" />
            <h3>Brand Customizer</h3>
          </div>

          <div className="jd-form-group">
            <label className="jd-label">Load Existing Team Profile</label>
            <div className="ops-input">
              <FaTrophy />
              <select
                value={selectedTeamId}
                onChange={(e) => setSelectedTeamId(e.target.value)}
              >
                <option value="">Load From Database (Optional)</option>
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.teamName} ({t.tournament?.name || "League"})
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="jd-form-group">
            <label className="jd-label">Team Name</label>
            <div className="ops-input">
              <FaTrophy />
              <input
                type="text"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                maxLength={22}
                placeholder="Enter team name"
              />
            </div>
          </div>

          <div className="jd-form-group">
            <label className="jd-label">Captain Name</label>
            <div className="ops-input">
              <FaUser />
              <input
                type="text"
                value={captainName}
                onChange={(e) => setCaptainName(e.target.value)}
                maxLength={20}
                placeholder="Enter captain name"
              />
            </div>
          </div>

          <div className="jd-grid-2">
            <div className="jd-form-group">
              <label className="jd-label">Jersey Number</label>
              <div className="ops-input">
                <input
                  type="text"
                  value={jerseyNumber}
                  onChange={(e) => setJerseyNumber(e.target.value.replace(/\D/g, "").slice(0, 3))}
                  placeholder="7"
                />
              </div>
            </div>

            <div className="jd-form-group">
              <label className="jd-label">Player Role</label>
              <div className="ops-input">
                <select value={roleType} onChange={(e) => setRoleType(e.target.value)}>
                  <option value="Batsman">Batsman</option>
                  <option value="Bowler">Bowler</option>
                  <option value="All-Rounder">All-Rounder</option>
                  <option value="Wicketkeeper">Wicketkeeper</option>
                </select>
              </div>
            </div>
          </div>

          <div className="jd-form-group">
            <label className="jd-label">Premium Pattern Style</label>
            <div className="ops-input">
              <select value={pattern} onChange={(e) => setPattern(e.target.value)}>
                <optgroup label="Standard Patterns">
                  <option value="solid">Solid Base</option>
                  <option value="stripes">Vertical Stripes</option>
                  <option value="hoops">Horizontal Hoops</option>
                  <option value="gradient">Gradient Blend</option>
                </optgroup>
                <optgroup label="Premium Patterns">
                  <option value="sash">Diagonal Sash</option>
                  <option value="checks">Checkerboard Grid</option>
                  <option value="chevron">Chevron V-Neck</option>
                  <option value="camo">Neon Camo</option>
                  <option value="argyle">Diamond Argyle</option>
                  <option value="split">Dual Split</option>
                  <option value="flames">Flame Burst</option>
                  <option value="lightning">Lightning Strike</option>
                </optgroup>
              </select>
            </div>
          </div>

          <div className="jd-color-pickers">
            <div className="jd-color-box">
              <label className="jd-label">Primary Color</label>
              <div className="jd-color-input-container">
                <input
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                />
                <span className="jd-color-hex">{primaryColor}</span>
              </div>
            </div>

            <div className="jd-color-box">
              <label className="jd-label">Accent Color</label>
              <div className="jd-color-input-container">
                <input
                  type="color"
                  value={secondaryColor}
                  onChange={(e) => setSecondaryColor(e.target.value)}
                />
                <span className="jd-color-hex">{secondaryColor}</span>
              </div>
            </div>
          </div>

          <div className="jd-actions">
            <button onClick={handleDownload} className="ops-primary jd-btn-action">
              <FaDownload /> Download Card
            </button>
            {selectedTeamId && (
              <button 
                onClick={handleSaveToProfile} 
                className="ops-primary jd-btn-action" 
                style={{ background: "linear-gradient(135deg, #10b981 0%, #059669 100%)" }}
                disabled={saving}
              >
                <FaSave /> {saving ? "Saving..." : "Save to Team"}
              </button>
            )}
            <button onClick={handleReset} className="jd-btn-reset">
              <FaUndo /> Reset
            </button>
          </div>
        </div>

        {/* Right pane: premium card visual presentation */}
        <div className="jd-preview-card">
          <div className="jd-preview-glow"></div>
          <canvas
            ref={canvasRef}
            width={340}
            height={430}
            className="jd-canvas-element"
          />
        </div>
      </div>
    </Layout>
  );
}

export default JerseyDesigner;
