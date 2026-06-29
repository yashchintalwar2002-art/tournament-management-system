import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FaBroadcastTower, FaClock, FaChevronLeft, FaGamepad, FaVolumeUp } from "react-icons/fa";
import API from "../../services/api";
import Layout from "../../components/Layout";
import "./LiveMatchCenter.css";

function LiveMatchCenter() {
  const { matchId } = useParams();
  const navigate = useNavigate();
  const [match, setMatch] = useState(null);
  const [loading, setLoading] = useState(true);

  // Scoreboard simulation states
  const [score, setScore] = useState(0);
  const [wickets, setWickets] = useState(0);
  const [overs, setOvers] = useState(0.0);
  const [balls, setBalls] = useState(0);
  const [winProbA, setWinProbA] = useState(55); // percentage for Team A
  const [targetScore, setTargetScore] = useState(165);
  const [commentaries, setCommentaries] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);
  const [flashAnimation, setFlashAnimation] = useState(null);
  const [isAutoSimulate, setIsAutoSimulate] = useState(false);
  const [isTtsEnabled, setIsTtsEnabled] = useState(false);

  // Web Audio API Synthetic Stadium Sounds
  const playSynthSound = (type) => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      
      if (type === "cheer") {
        // High-pass white noise sweeping upward for cheering crowd
        const bufferSize = audioCtx.sampleRate * 1.5; // 1.5s
        const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = Math.random() * 2 - 1;
        }
        
        const noise = audioCtx.createBufferSource();
        noise.buffer = buffer;
        
        const filter = audioCtx.createBiquadFilter();
        filter.type = "bandpass";
        filter.frequency.value = 1000;
        
        const gainNode = audioCtx.createGain();
        gainNode.gain.setValueAtTime(0.01, audioCtx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.35, audioCtx.currentTime + 0.3);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 1.5);
        
        noise.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        
        noise.start();
      } else if (type === "horn") {
        // Oscillating dual-sine waves for boundary air-horns
        const osc1 = audioCtx.createOscillator();
        const osc2 = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        
        osc1.type = "sawtooth";
        osc1.frequency.value = 220; // low A
        osc2.type = "sine";
        osc2.frequency.value = 225; // slight detune
        
        gainNode.gain.setValueAtTime(0.18, audioCtx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.18, audioCtx.currentTime + 0.6);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.8);
        
        osc1.connect(gainNode);
        osc2.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        
        osc1.start();
        osc2.start();
        
        osc1.stop(audioCtx.currentTime + 0.8);
        osc2.stop(audioCtx.currentTime + 0.8);
      } else if (type === "siren") {
        // High frequency siren alarm sweeping back and forth
        const osc = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        
        osc.type = "sine";
        osc.frequency.setValueAtTime(440, audioCtx.currentTime);
        osc.frequency.linearRampToValueAtTime(880, audioCtx.currentTime + 0.3);
        osc.frequency.linearRampToValueAtTime(440, audioCtx.currentTime + 0.6);
        osc.frequency.linearRampToValueAtTime(880, audioCtx.currentTime + 0.9);
        
        gainNode.gain.setValueAtTime(0.12, audioCtx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.12, audioCtx.currentTime + 0.9);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 1.2);
        
        osc.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        
        osc.start();
        osc.stop(audioCtx.currentTime + 1.2);
      } else if (type === "boo") {
        // Low-pitch noise rumble for crowd groan/boo
        const osc = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        
        osc.type = "triangle";
        osc.frequency.setValueAtTime(110, audioCtx.currentTime);
        osc.frequency.linearRampToValueAtTime(85, audioCtx.currentTime + 1.2);
        
        gainNode.gain.setValueAtTime(0.25, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 1.5);
        
        osc.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        
        osc.start();
        osc.stop(audioCtx.currentTime + 1.5);
      }
    } catch (e) {
      console.warn("AudioContext failed to trigger:", e);
    }
  };

  const speakCommentary = (text) => {
    try {
      window.speechSynthesis.cancel(); // stop previous speech
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.05; // announcer pace
      utterance.pitch = 0.95; // radio commentator tone
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn("SpeechSynthesis error:", e);
    }
  };

  const autoSimIntervalRef = useRef(null);

  // Setup default match details if API fails
  const mockMatch = {
    id: matchId || 99,
    teamA: "Chennai Super Kings",
    teamB: "Mumbai Indians",
    status: "LIVE",
    currentBatsman: "Ruturaj Gaikwad",
    currentBowler: "Jasprit Bumrah",
    batsmanRuns: 42,
    batsmanBalls: 26,
    overs: 12.4
  };

  useEffect(() => {
    fetchMatchDetails();
    return () => {
      if (autoSimIntervalRef.current) {
        clearInterval(autoSimIntervalRef.current);
      }
    };
  }, [matchId]);

  useEffect(() => {
    if (isAutoSimulate) {
      autoSimIntervalRef.current = setInterval(() => {
        // Run a random ball simulation
        const randomEvents = ["dot", "1run", "2runs", "four", "six", "wicket", "wide"];
        const event = randomEvents[Math.floor(Math.random() * randomEvents.length)];
        handleSimulateBall(event);
      }, 4000);
    } else {
      if (autoSimIntervalRef.current) {
        clearInterval(autoSimIntervalRef.current);
      }
    }
  }, [isAutoSimulate, score, wickets, balls, winProbA]);

  const fetchMatchDetails = async () => {
    try {
      setLoading(true);
      const res = await API.get(`/matches/${matchId}`);
      setMatch(res.data);
      // Initialize scoring states from API if available
      setScore(res.data.scoreA || 86);
      setWickets(res.data.wickets || 2);
      setOvers(res.data.overs || 10.2);
      setBalls(Math.floor((res.data.overs || 10.2) * 6));
    } catch (err) {
      console.warn("Could not load match from API, loading mock data:", err);
      setMatch(mockMatch);
      setScore(88);
      setWickets(3);
      setOvers(11.2);
      setBalls(68);
    } finally {
      setLoading(false);
      // Seed initial commentaries
      setCommentaries([
        { over: "11.2", text: "Jasprit Bumrah bowl to Ruturaj Gaikwad, Dot ball. Defended back to the bowler." },
        { over: "11.1", text: "Jasprit Bumrah bowl to Ruturaj Gaikwad, 1 run. Guided down to third man." }
      ]);
      setChatMessages([
        { user: "SuperFan7", text: "CSK is looking extremely strong tonight! 💛" },
        { user: "MiPaltan", text: "Bumrah's spell is crucial. One wicket here changes the game!" }
      ]);
    }
  };

  const handleSimulateBall = (event) => {
    let runsAdded = 0;
    let wicketsAdded = 0;
    let extraBall = false;
    let eventName = "";
    let commentaryText = "";
    let chatText = "";

    const batsman = match ? match.currentBatsman || "Ruturaj Gaikwad" : "Ruturaj Gaikwad";
    const bowler = match ? match.currentBowler || "Jasprit Bumrah" : "Jasprit Bumrah";

    switch (event) {
      case "dot":
        eventName = "DOT BALL";
        commentaryText = `${bowler} bowl to ${batsman}, Dot ball. Driven to short mid-wicket.`;
        break;
      case "1run":
        runsAdded = 1;
        eventName = "1 RUN";
        commentaryText = `${bowler} bowl to ${batsman}, 1 run. Punched off the backfoot to cover.`;
        break;
      case "2runs":
        runsAdded = 2;
        eventName = "2 RUNS";
        commentaryText = `${bowler} bowl to ${batsman}, 2 runs. Flicked away to deep square leg.`;
        break;
      case "four":
        runsAdded = 4;
        eventName = "FOUR!";
        commentaryText = `${bowler} bowl to ${batsman}, FOUR! Splendid cover drive racing away to the boundary.`;
        chatText = "WHAT A SHOT! Classy boundary! 🏏🔥";
        break;
      case "six":
        runsAdded = 6;
        eventName = "SIX!!!";
        commentaryText = `${bowler} bowl to ${batsman}, SIX! Absolute monster! Launched way back into the stands!`;
        chatText = "MASSIVE SIX! That went out of the stadium! 🚀👑";
        break;
      case "wicket":
        wicketsAdded = 1;
        eventName = "WICKET OUT!";
        commentaryText = `${bowler} bowl to ${batsman}, OUT! Clean bowled! The stump goes cartwheeling away!`;
        chatText = "OH NO! Big wicket for Mumbai! 😱💔";
        break;
      case "wide":
        runsAdded = 1;
        extraBall = true;
        eventName = "WIDE BALL";
        commentaryText = `${bowler} bowl, Wide ball down the leg side. Wides recorded.`;
        break;
      default:
        break;
    }

    // Trigger flash animation
    setFlashAnimation(eventName);
    setTimeout(() => setFlashAnimation(null), 1500);

    // Calculate new overs/balls count
    let nextBalls = balls;
    if (!extraBall) {
      nextBalls += 1;
    }
    const nextOversCalculated = Math.floor(nextBalls / 6) + (nextBalls % 6) / 10;

    // Update scoreboard
    const nextScore = score + runsAdded;
    const nextWickets = wickets + wicketsAdded;
    
    setScore(nextScore);
    setWickets(nextWickets);
    setBalls(nextBalls);
    setOvers(nextOversCalculated);

    // Dynamic win probability shift
    let nextProb = winProbA;
    if (runsAdded >= 4) nextProb = Math.min(95, winProbA + 4);
    else if (wicketsAdded > 0) nextProb = Math.max(10, winProbA - 12);
    else if (event === "dot") nextProb = Math.max(10, winProbA - 1);
    setWinProbA(nextProb);

    // Prepend Commentary
    const newCommentary = {
      over: nextOversCalculated.toFixed(1),
      text: commentaryText
    };
    setCommentaries(prev => [newCommentary, ...prev]);

    // Speak commentary if enabled
    if (isTtsEnabled) {
      speakCommentary(commentaryText);
    }

    // Auto-trigger soundboard based on event
    if (event === "four" || event === "six") {
      playSynthSound("cheer");
      setTimeout(() => playSynthSound("horn"), 850);
    } else if (event === "wicket") {
      playSynthSound("siren");
      setTimeout(() => playSynthSound("boo"), 1050);
    } else if (event === "dot") {
      playSynthSound("boo");
    }

    // Add simulated Cheer message
    if (chatText) {
      const mockUsers = ["CskLover", "StrikersFan", "SportyJohn", "CaptainCoolFan"];
      const randomUser = mockUsers[Math.floor(Math.random() * mockUsers.length)];
      setChatMessages(prev => [...prev, { user: randomUser, text: chatText }]);
    }
  };

  if (loading) {
    return (
      <Layout title="Live Match Center" subtitle="Simulating connection...">
        <div className="lmc-loader">
          <div className="lmc-spinner"></div>
          <p>Connecting to broadcast network...</p>
        </div>
      </Layout>
    );
  }

  const teamA = match ? match.teamA : "Team A";
  const teamB = match ? match.teamB : "Team B";

  return (
    <Layout
      title="Live Match Center"
      subtitle="Immersive real-time scoreboard, win projection, and chat dashboard."
    >
      <div className="lmc-back-nav">
        <button onClick={() => navigate("/live-score")} className="lmc-btn-back">
          <FaChevronLeft /> Back to Live Scores
        </button>
      </div>

      <div className="lmc-stadium-layout">
        
        {/* Main Dashboard Panel */}
        <div className="lmc-stadium-card">
          <div className="lmc-live-indicator animate-pulse">
            <FaBroadcastTower />
            <span>LIVE BROADCAST</span>
          </div>

          <div className="lmc-score-grid">
            <div className="lmc-team-scores">
              <h2>{teamA}</h2>
              <div className="lmc-runs-counter">
                <span>{score}</span>
                <span>/</span>
                <span>{wickets}</span>
              </div>
              <span className="lmc-overs-count">Overs: {overs.toFixed(1)}</span>
            </div>

            <div className="lmc-match-vs">VS</div>

            <div className="lmc-team-scores opacity-70">
              <h2>{teamB}</h2>
              <div className="lmc-runs-counter">
                <span>{targetScore}</span>
              </div>
              <span className="lmc-overs-count">Innings Completed</span>
            </div>
          </div>

          {/* Win Probability Bar */}
          <div className="lmc-probability-panel">
            <span className="lmc-prob-label">Win Projection</span>
            <div className="lmc-prob-bar-container">
              <div className="lmc-prob-segment team-a" style={{ width: `${winProbA}%` }}>
                <span>{winProbA}%</span>
              </div>
              <div className="lmc-prob-segment team-b" style={{ width: `${100 - winProbA}%` }}>
                <span>{100 - winProbA}%</span>
              </div>
            </div>
            <div className="lmc-prob-legends">
              <span>{teamA}</span>
              <span>{teamB}</span>
            </div>
          </div>

          {/* Interactive Soundboard & TTS Console */}
          <div className="lmc-soundboard-panel">
            <div className="lmc-sim-header">
              <FaVolumeUp />
              <span>Stadium Cheer Soundboard & Commentary Settings</span>
              <button 
                className={`lmc-btn-tts ${isTtsEnabled ? "active" : ""}`}
                onClick={() => setIsTtsEnabled(!isTtsEnabled)}
              >
                {isTtsEnabled ? "Auto Voice: ON" : "Auto Voice: OFF"}
              </button>
            </div>
            <div className="lmc-soundboard-actions">
              <button onClick={() => playSynthSound("cheer")} className="lmc-btn-sound">📣 Cheer</button>
              <button onClick={() => playSynthSound("horn")} className="lmc-btn-sound">📯 Horn</button>
              <button onClick={() => playSynthSound("siren")} className="lmc-btn-sound">🚨 Siren</button>
              <button onClick={() => playSynthSound("boo")} className="lmc-btn-sound">👎 Boo</button>
            </div>
          </div>

          {/* Interactive Simulation Controls */}
          <div className="lmc-simulator-panel">
            <div className="lmc-sim-header">
              <FaGamepad />
              <span>Event Simulator Action Deck</span>
              <button 
                className={`lmc-btn-auto-sim ${isAutoSimulate ? "active" : ""}`}
                onClick={() => setIsAutoSimulate(!isAutoSimulate)}
              >
                {isAutoSimulate ? "Stop Auto-Play" : "Auto-Play Simulation"}
              </button>
            </div>

            <div className="lmc-sim-actions">
              <button onClick={() => handleSimulateBall("dot")} className="lmc-btn-sim">Dot</button>
              <button onClick={() => handleSimulateBall("1run")} className="lmc-btn-sim">+1 Run</button>
              <button onClick={() => handleSimulateBall("2runs")} className="lmc-btn-sim">+2 Runs</button>
              <button onClick={() => handleSimulateBall("four")} className="lmc-btn-sim boundary-btn">Four (4)</button>
              <button onClick={() => handleSimulateBall("six")} className="lmc-btn-sim boundary-btn">Six (6)</button>
              <button onClick={() => handleSimulateBall("wicket")} className="lmc-btn-sim wicket-btn">Wicket</button>
              <button onClick={() => handleSimulateBall("wide")} className="lmc-btn-sim">Wide</button>
            </div>
          </div>

          {/* Flash animation overlays */}
          {flashAnimation && (
            <div className="lmc-flash-overlay animate-scale-pop">
              <span>{flashAnimation}</span>
            </div>
          )}
        </div>

        {/* Side Panel: Commentary & Cheer Chat */}
        <div className="lmc-side-panel">
          <div className="lmc-tabs">
            <span className="lmc-tab active">Commentary Log</span>
          </div>

          <div className="lmc-commentary-scroll">
            {commentaries.map((com, index) => (
              <div key={index} className="lmc-com-item animate-fade-in-up">
                <span className="lmc-com-over">Over {com.over}</span>
                <p className="lmc-com-text">{com.text}</p>
              </div>
            ))}
          </div>

          <div className="lmc-chat-header">
            <FaVolumeUp />
            <span>Cheer Chat Box</span>
          </div>

          <div className="lmc-chat-scroll">
            {chatMessages.map((msg, index) => (
              <div key={index} className="lmc-chat-bubble">
                <strong className="lmc-chat-user">{msg.user}:</strong>
                <span className="lmc-chat-text">{msg.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default LiveMatchCenter;
