import React, { useEffect, useState } from "react";
import Layout from "../../components/Layout";
import API from "../../services/api";
import { useNavigate } from "react-router-dom";
import { FaTrophy, FaCalendarCheck, FaCalendarAlt, FaFlagCheckered, FaMapMarkerAlt, FaExchangeAlt, FaUserCheck, FaUserCircle, FaClock } from "react-icons/fa";
import "./MatchSetupWizard.css";

const getGroundsForTournament = (tournament) => {
  if (!tournament) return [];
  const list = [];

  // Add the tournament's specific ground if configured
  if (tournament.ground && tournament.ground.trim() !== "") {
    list.push(tournament.ground.trim());
  }

  const nameLower = (tournament.name || "").toLowerCase();
  const gameLower = (tournament.game || "").toLowerCase();

  // 1. IPL Grounds
  if (nameLower.includes("ipl") || nameLower.includes("indian premier league")) {
    return [
      ...list,
      "Wankhede Stadium, Mumbai",
      "M. Chinnaswamy Stadium, Bengaluru",
      "Narendra Modi Stadium, Ahmedabad",
      "Eden Gardens, Kolkata",
      "Arun Jaitley Stadium, Delhi",
      "MA Chidambaram Stadium, Chennai",
      "Rajiv Gandhi International Cricket Stadium, Hyderabad",
      "PCA IS Bindra Stadium, Mohali",
      "MCA Stadium, Pune",
      "Sawai Mansingh Stadium, Jaipur",
      "HPCA Stadium, Dharamshala",
      "Ekana Cricket Stadium, Lucknow"
    ];
  }

  // 2. General Cricket
  if (
    gameLower.includes("cricket") ||
    nameLower.includes("cricket") ||
    nameLower.includes("world cup") ||
    nameLower.includes("trophy")
  ) {
    return [
      ...list,
      "Lord's Cricket Ground, London",
      "Melbourne Cricket Ground (MCG)",
      "Sydney Cricket Ground (SCG)",
      "Adelaide Oval",
      "The Oval, London",
      "Wankhede Stadium, Mumbai",
      "MA Chidambaram Stadium, Chennai",
      "Eden Gardens, Kolkata",
      "Trent Bridge, Nottingham",
      "Newlands, Cape Town"
    ];
  }

  // 3. Football / Soccer
  if (
    gameLower.includes("football") ||
    gameLower.includes("soccer") ||
    nameLower.includes("football") ||
    nameLower.includes("soccer") ||
    nameLower.includes("cup")
  ) {
    return [
      ...list,
      "Wembley Stadium, London",
      "Camp Nou, Barcelona",
      "Santiago Bernabéu, Madrid",
      "Old Trafford, Manchester",
      "San Siro, Milan",
      "Allianz Arena, Munich",
      "Parc des Princes, Paris",
      "Maracanã, Rio de Janeiro"
    ];
  }

  // 4. Basketball
  if (gameLower.includes("basketball") || nameLower.includes("basketball")) {
    return [
      ...list,
      "Madison Square Garden, New York",
      "Crypto.com Arena, Los Angeles",
      "United Center, Chicago",
      "TD Garden, Boston",
      "Chase Center, San Francisco"
    ];
  }

  // 5. BGMI / Free Fire / PUBG (Esports Maps)
  if (
    gameLower.includes("bgmi") ||
    gameLower.includes("free fire") ||
    gameLower.includes("pubg") ||
    gameLower.includes("battlegrounds")
  ) {
    return [
      ...list,
      "Erangel (Main Map)",
      "Miramar (Desert Map)",
      "Sanhok (Tropical Map)",
      "Vikendi (Snow Map)",
      "Livik (Mini Map)",
      "Bermuda (Free Fire)",
      "Kalahari (Free Fire)"
    ];
  }

  // 6. Valorant
  if (gameLower.includes("valorant")) {
    return [
      ...list,
      "Bind",
      "Haven",
      "Split",
      "Ascent",
      "Icebox",
      "Breeze",
      "Fracture",
      "Pearl",
      "Lotus",
      "Sunset"
    ];
  }

  // 7. Tennis
  if (gameLower.includes("tennis") || nameLower.includes("tennis")) {
    return [
      ...list,
      "Centre Court, Wimbledon",
      "Arthur Ashe Stadium, US Open",
      "Court Philippe Chatrier, Roland Garros",
      "Rod Laver Arena, Australian Open"
    ];
  }

  // 8. Badminton
  if (gameLower.includes("badminton") || nameLower.includes("badminton")) {
    return [
      ...list,
      "Musashino Forest Sport Plaza, Tokyo",
      "Istora Senayan, Jakarta",
      "Birmingham Arena, UK"
    ];
  }

  // 9. Chess
  if (gameLower.includes("chess") || nameLower.includes("chess")) {
    return [
      ...list,
      "Main Tournament Hall",
      "Grandmaster Lounge",
      "Online Chess Arena"
    ];
  }

  // 10. Kabaddi
  if (gameLower.includes("kabaddi") || nameLower.includes("kabaddi")) {
    return [
      ...list,
      "Netaji Subhash Chandra Bose Indoor Stadium",
      "Shree Shiv Chhatrapati Sports Complex",
      "Kanteerava Indoor Stadium"
    ];
  }

  // 11. Hockey
  if (gameLower.includes("hockey") || nameLower.includes("hockey")) {
    return [
      ...list,
      "Major Dhyan Chand National Stadium",
      "Kalinga Stadium, Bhubaneswar",
      "Birsa Munda Hockey Stadium, Rourkela"
    ];
  }

  return [
    ...list,
    "National Sports Arena",
    "City Central Ground",
    "University Sports Complex",
    "County Grounds"
  ];
};

function MatchSetupWizard() {
  const navigate = useNavigate();
  
  // Step tracker
  const [step, setStep] = useState(1);
  const [tournaments, setTournaments] = useState([]);
  const [selectedTournament, setSelectedTournament] = useState("");
  const [teams, setTeams] = useState([]);
  
  // Form fields
  const [teamAId, setTeamAId] = useState("");
  const [teamBId, setTeamBId] = useState("");
  const [groundName, setGroundName] = useState("");
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleHour, setScheduleHour] = useState("12");
  const [scheduleMinute, setScheduleMinute] = useState("00");
  const [schedulePeriod, setSchedulePeriod] = useState("PM");
  const [ballType, setBallType] = useState("TENNIS");
  const [matchType, setMatchType] = useState("LIMITED_OVERS");
  const [maxOvers, setMaxOvers] = useState(20);

  // Players / Squad
  const [playersA, setPlayersA] = useState([]);
  const [playersB, setPlayersB] = useState([]);
  const [selectedSquadA, setSelectedSquadA] = useState([]);
  const [selectedSquadB, setSelectedSquadB] = useState([]);
  const [wkA, setWkA] = useState("");
  const [wkB, setWkB] = useState("");

  // Toss Simulation
  const [isFlipping, setIsFlipping] = useState(false);
  const [tossResult, setTossResult] = useState(null); // { winnerId, decision: 'BAT'|'BOWL' }
  const [userTossChoice, setUserTossChoice] = useState("heads");

  // Starting lineups
  const [striker, setStriker] = useState("");
  const [nonStriker, setNonStriker] = useState("");
  const [bowler, setBowler] = useState("");

  const [error, setError] = useState("");

  useEffect(() => {
    fetchTournaments();
  }, []);

  const fetchTournaments = async () => {
    try {
      const res = await API.get("/tournaments");
      setTournaments(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleTournamentChange = async (e) => {
    const tId = e.target.value;
    setSelectedTournament(tId);
    setTeamAId("");
    setTeamBId("");
    setGroundName("");
    setScheduleDate("");
    setScheduleHour("12");
    setScheduleMinute("00");
    setSchedulePeriod("PM");
    if (tId) {
      try {
        const res = await API.get(`/teams/tournament/${tId}`);
        setTeams(res.data);
      } catch (err) {
        console.error(err);
      }
    }
  };

  const fetchRosters = async () => {
    if (!teamAId || !teamBId) {
      setError("Please select both teams.");
      return;
    }
    setError("");
    try {
      const [resA, resB] = await Promise.all([
        API.get(`/players/team/${teamAId}`),
        API.get(`/players/team/${teamBId}`),
      ]);
      setPlayersA(resA.data);
      setPlayersB(resB.data);
      // Auto pre-select all if roster is small, or empty arrays
      setSelectedSquadA(resA.data.slice(0, 11).map((p) => p.playerName));
      setSelectedSquadB(resB.data.slice(0, 11).map((p) => p.playerName));
      setStep(2);
    } catch (err) {
      setError("Failed to fetch player rosters.");
    }
  };

  const toggleSquadPlayer = (name, teamFlag) => {
    if (teamFlag === "A") {
      if (selectedSquadA.includes(name)) {
        setSelectedSquadA(selectedSquadA.filter((n) => n !== name));
      } else {
        setSelectedSquadA([...selectedSquadA, name]);
      }
    } else {
      if (selectedSquadB.includes(name)) {
        setSelectedSquadB(selectedSquadB.filter((n) => n !== name));
      } else {
        setSelectedSquadB([...selectedSquadB, name]);
      }
    }
  };

  const startTossFlip = () => {
    setIsFlipping(true);
    setTimeout(() => {
      setIsFlipping(false);
      const isA = Math.random() > 0.5;
      const winner = isA ? teams.find((t) => t.id === parseInt(teamAId)) : teams.find((t) => t.id === parseInt(teamBId));
      setTossResult({
        winnerId: winner.id,
        winnerName: winner.teamName,
        decision: "BAT",
      });
    }, 1500);
  };

  const handleDecisionSelect = (decision) => {
    setTossResult({ ...tossResult, decision });
  };

  const handleSetupLineups = () => {
    setStep(4);
  };

  const handleCreateMatch = async () => {
    if (!striker || !nonStriker || !bowler) {
      setError("Please pick opening batsman and bowler.");
      return;
    }

    try {
      const teamAName = teams.find((t) => t.id === parseInt(teamAId))?.teamName;
      const teamBName = teams.find((t) => t.id === parseInt(teamBId))?.teamName;

      // Determine who bats first
      // Toss winner decisions:
      // If team A wins toss and chooses BAT -> Team A is current striker team (innings 1)
      // If team A wins toss and chooses BOWL -> Team B is current striker team (innings 1)
      const tossWinnerName = tossResult.winnerName;
      const isTeamABatFirst =
        (tossResult.winnerId === parseInt(teamAId) && tossResult.decision === "BAT") ||
        (tossResult.winnerId === parseInt(teamBId) && tossResult.decision === "BOWL");

      let combinedMatchDate = "";
      if (scheduleDate) {
        let h24 = parseInt(scheduleHour);
        if (schedulePeriod === "PM" && h24 < 12) {
          h24 += 12;
        } else if (schedulePeriod === "AM" && h24 === 12) {
          h24 = 0;
        }
        const hourStr = String(h24).padStart(2, "0");
        const minuteStr = String(scheduleMinute).padStart(2, "0");
        combinedMatchDate = `${scheduleDate}T${hourStr}:${minuteStr}`;
      }

      const matchPayload = {
        tournament: { id: selectedTournament },
        teamA: teamAName,
        teamB: teamBName,
        groundName,
        ballType,
        matchType,
        matchDate: combinedMatchDate,
        tossWinner: tossWinnerName,
        tossDecision: tossResult.decision,
        currentInnings: 1,
        maxOvers: parseFloat(maxOvers),
        status: "LIVE",
        currentBatsman: striker,
        currentNonStriker: nonStriker,
        currentBowler: bowler,
        scoreA: 0,
        scoreB: 0,
        wickets: 0,
        overs: 0.0,
      };

      const res = await API.post("/matches", matchPayload);
      navigate("/live-score");
    } catch (err) {
      console.error(err);
      setError("Failed to create and start live match.");
    }
  };

  // Get active batting list options based on toss
  const getBattingTeamPlayers = () => {
    const isTeamABat =
      (tossResult?.winnerId === parseInt(teamAId) && tossResult?.decision === "BAT") ||
      (tossResult?.winnerId === parseInt(teamBId) && tossResult?.decision === "BOWL");
    return isTeamABat ? selectedSquadA : selectedSquadB;
  };

  // Get active bowling list options based on toss
  const getBowlingTeamPlayers = () => {
    const isTeamABat =
      (tossResult?.winnerId === parseInt(teamAId) && tossResult?.decision === "BAT") ||
      (tossResult?.winnerId === parseInt(teamBId) && tossResult?.decision === "BOWL");
    return isTeamABat ? selectedSquadB : selectedSquadA;
  };

  const activeTournament = tournaments.find(t => t.id === parseInt(selectedTournament));
  const groundsList = activeTournament ? Array.from(new Set(getGroundsForTournament(activeTournament))) : [];

  const handleGroundSelect = (e) => {
    const val = e.target.value;
    if (val === "CUSTOM") {
      setShowCustomGroundInput(true);
      setGroundName("");
    } else {
      setShowCustomGroundInput(false);
      setGroundName(val);
    }
  };

  return (
    <Layout
      title="Match Setup Wizard"
      subtitle="Complete playing rosters, virtual toss, and schedule details."
    >
      <div className="msw-container">
        {/* Step Progress Indicators */}
        <div className="msw-progress-bar">
          {[
            { s: 1, label: "Scheduling", icon: <FaCalendarCheck /> },
            { s: 2, label: "Squad Roster", icon: <FaUserCheck /> },
            { s: 3, label: "Virtual Toss", icon: <FaExchangeAlt /> },
            { s: 4, label: "Starting XI", icon: <FaFlagCheckered /> },
          ].map((item) => (
            <div key={item.s} className={`msw-step-pill ${step === item.s ? "active" : step > item.s ? "completed" : ""}`}>
              <div className="step-icon">{item.icon}</div>
              <span>{item.label}</span>
            </div>
          ))}
        </div>

        {error && <div className="msw-error-banner">{error}</div>}

        {/* Step 1: Scheduling Details */}
        {step === 1 && (
          <div className="msw-card animate-fade-in-up">
            <h3>Step 1: Match Scheduling Details</h3>
            <div className="msw-form">
              <label>
                Select Tournament
                <select value={selectedTournament} onChange={handleTournamentChange}>
                  <option value="">Choose Tournament</option>
                  {tournaments.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </label>

              <div className="msw-row">
                <label>
                  Team A
                  <select value={teamAId} onChange={(e) => setTeamAId(e.target.value)}>
                    <option value="">Choose Team A</option>
                    {teams.map((t) => (
                      <option key={t.id} value={t.id} disabled={t.id === parseInt(teamBId)}>{t.teamName}</option>
                    ))}
                  </select>
                </label>

                <label>
                  Team B
                  <select value={teamBId} onChange={(e) => setTeamBId(e.target.value)}>
                    <option value="">Choose Team B</option>
                    {teams.map((t) => (
                      <option key={t.id} value={t.id} disabled={t.id === parseInt(teamAId)}>{t.teamName}</option>
                    ))}
                  </select>
                </label>
              </div>

              <label>
                Ground Name
                <div className="msw-input-icon-box">
                  <FaMapMarkerAlt />
                  <input
                    type="text"
                    list="grounds-list"
                    placeholder="Enter or select ground/pitch location"
                    value={groundName}
                    onChange={(e) => setGroundName(e.target.value)}
                    disabled={!selectedTournament}
                    required
                  />
                  <datalist id="grounds-list">
                    {groundsList.map((g) => (
                      <option key={g} value={g} />
                    ))}
                  </datalist>
                </div>
              </label>

              <div className="msw-row">
                <label>
                  Match Date
                  <div className="msw-input-icon-box">
                    <FaCalendarAlt />
                    <input
                      type="date"
                      value={scheduleDate}
                      onChange={(e) => setScheduleDate(e.target.value)}
                      required
                    />
                  </div>
                </label>

                <label>
                  Match Time
                  <div className="msw-time-picker-box">
                    <FaClock style={{ color: "var(--text-secondary)", marginRight: "4px" }} />
                    <select
                      value={scheduleHour}
                      onChange={(e) => setScheduleHour(e.target.value)}
                      className="msw-time-select"
                    >
                      {Array.from({ length: 12 }, (_, i) => String(i + 1)).map((h) => (
                        <option key={h} value={h}>{h.padStart(2, "0")}</option>
                      ))}
                    </select>
                    <span className="msw-time-separator">:</span>
                    <select
                      value={scheduleMinute}
                      onChange={(e) => setScheduleMinute(e.target.value)}
                      className="msw-time-select"
                    >
                      {Array.from({ length: 60 }, (_, i) => String(i)).map((m) => (
                        <option key={m} value={m}>{m.padStart(2, "0")}</option>
                      ))}
                    </select>
                    <select
                      value={schedulePeriod}
                      onChange={(e) => setSchedulePeriod(e.target.value)}
                      className="msw-time-period-select"
                      style={{ marginLeft: "auto" }}
                    >
                      <option value="AM">AM</option>
                      <option value="PM">PM</option>
                    </select>
                  </div>
                </label>
              </div>

              <div className="msw-row">
                <label>
                  Ball Type
                  <select value={ballType} onChange={(e) => setBallType(e.target.value)}>
                    <option value="TENNIS">Tennis Ball (Grassroots)</option>
                    <option value="LEATHER">Leather Ball (Corporate/Club)</option>
                  </select>
                </label>

                <label>
                  Match Type
                  <select value={matchType} onChange={(e) => setMatchType(e.target.value)}>
                    <option value="LIMITED_OVERS">Limited Overs (T20/League)</option>
                    <option value="TEST">Test Match (90 Overs/Day)</option>
                  </select>
                </label>

                <label>
                  Overs per Innings
                  <input
                    type="number"
                    value={maxOvers}
                    onChange={(e) => setMaxOvers(e.target.value)}
                  />
                </label>
              </div>

              <button className="msw-primary-btn" onClick={fetchRosters}>
                Next: Squad Selection
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Squad Selection */}
        {step === 2 && (
          <div className="msw-card animate-fade-in-up">
            <h3>Step 2: Squad Selection (Playing XI)</h3>
            <p>Select which registered players are in the active lineup.</p>
            
            <div className="msw-roster-split">
              {/* Team A Roster */}
              <div className="roster-box">
                <h4>{teams.find((t) => t.id === parseInt(teamAId))?.teamName}</h4>
                <div className="player-checklist">
                  {playersA.length === 0 ? (
                    <p className="no-players-text">No players onboarded. All default slots will be used.</p>
                  ) : (
                    playersA.map((p) => (
                      <label key={p.id} className="player-checkbox-item">
                        <input
                          type="checkbox"
                          checked={selectedSquadA.includes(p.playerName)}
                          onChange={() => toggleSquadPlayer(p.playerName, "A")}
                        />
                        <span>{p.playerName} ({p.role})</span>
                      </label>
                    ))
                  )}
                </div>
              </div>

              {/* Team B Roster */}
              <div className="roster-box">
                <h4>{teams.find((t) => t.id === parseInt(teamBId))?.teamName}</h4>
                <div className="player-checklist">
                  {playersB.length === 0 ? (
                    <p className="no-players-text">No players onboarded. All default slots will be used.</p>
                  ) : (
                    playersB.map((p) => (
                      <label key={p.id} className="player-checkbox-item">
                        <input
                          type="checkbox"
                          checked={selectedSquadB.includes(p.playerName)}
                          onChange={() => toggleSquadPlayer(p.playerName, "B")}
                        />
                        <span>{p.playerName} ({p.role})</span>
                      </label>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="msw-actions-row">
              <button className="msw-secondary-btn" onClick={() => setStep(1)}>Back</button>
              <button className="msw-primary-btn" onClick={() => setStep(3)}>Next: Flip Toss</button>
            </div>
          </div>
        )}

        {/* Step 3: Toss Simulation */}
        {step === 3 && (
          <div className="msw-card animate-fade-in-up">
            <h3>Step 3: Virtual Toss Flipping</h3>
            <p>Perform the coin toss match-day flip simulation.</p>

            <div className="msw-toss-box">
              <div className={`msw-coin-flip ${isFlipping ? "spinning" : ""}`}>
                <span>🏏</span>
              </div>

              {!tossResult ? (
                <div className="toss-controls">
                  <div className="toss-choice-row">
                    <button
                      onClick={() => setUserTossChoice("heads")}
                      className={`choice-btn ${userTossChoice === "heads" ? "active" : ""}`}
                    >
                      Heads
                    </button>
                    <button
                      onClick={() => setUserTossChoice("tails")}
                      className={`choice-btn ${userTossChoice === "tails" ? "active" : ""}`}
                    >
                      Tails
                    </button>
                  </div>
                  <button className="msw-toss-btn" onClick={startTossFlip} disabled={isFlipping}>
                    {isFlipping ? "Flipping Coin..." : "Flip Coin"}
                  </button>
                </div>
              ) : (
                <div className="toss-winner-card animate-fade-in">
                  <h4>🏆 {tossResult.winnerName} won the Toss!</h4>
                  <p>Choose their match-day election decision:</p>
                  <div className="decision-buttons">
                    <button
                      onClick={() => handleDecisionSelect("BAT")}
                      className={`decision-btn ${tossResult.decision === "BAT" ? "active" : ""}`}
                    >
                      Elected to BAT
                    </button>
                    <button
                      onClick={() => handleDecisionSelect("BOWL")}
                      className={`decision-btn ${tossResult.decision === "BOWL" ? "active" : ""}`}
                    >
                      Elected to BOWL
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="msw-actions-row">
              <button className="msw-secondary-btn" onClick={() => setStep(2)}>Back</button>
              <button
                className="msw-primary-btn"
                onClick={handleSetupLineups}
                disabled={!tossResult}
              >
                Next: Select Opening Lineup
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Starting Lineups */}
        {step === 4 && (
          <div className="msw-card animate-fade-in-up">
            <h3>Step 4: Opening Lineup (Opening batsmen/bowler)</h3>
            <p>Pick the batsman to start on strike and the opening bowler.</p>

            <div className="msw-starting-fields">
              <label>
                Opening Striker
                <select value={striker} onChange={(e) => setStriker(e.target.value)}>
                  <option value="">Select Striker</option>
                  {getBattingTeamPlayers().map((name) => (
                    <option key={name} value={name} disabled={name === nonStriker}>{name}</option>
                  ))}
                </select>
              </label>

              <label>
                Opening Non-Striker
                <select value={nonStriker} onChange={(e) => setNonStriker(e.target.value)}>
                  <option value="">Select Non-Striker</option>
                  {getBattingTeamPlayers().map((name) => (
                    <option key={name} value={name} disabled={name === striker}>{name}</option>
                  ))}
                </select>
              </label>

              <label>
                Opening Bowler
                <select value={bowler} onChange={(e) => setBowler(e.target.value)}>
                  <option value="">Select Bowler</option>
                  {getBowlingTeamPlayers().map((name) => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
              </label>
            </div>

            <div className="msw-actions-row">
              <button className="msw-secondary-btn" onClick={() => setStep(3)}>Back</button>
              <button className="msw-primary-btn green-btn" onClick={handleCreateMatch}>
                Play Ball: Start Scoring
              </button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

export default MatchSetupWizard;
