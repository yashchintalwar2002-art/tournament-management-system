import React, { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaBroadcastTower,
  FaGamepad,
  FaSignal,
  FaSyncAlt,
  FaTrophy,
  FaCrown,
  FaShieldAlt,
} from "react-icons/fa";
import API from "../../services/api";
import "./LiveScorePage.css";

function LiveScorePage() {
  const [matches, setMatches] = useState([]);
  const [message, setMessage] = useState("");
  const [lastUpdated, setLastUpdated] = useState("");

  const [selectedPosition, setSelectedPosition] = useState("");
  const [showWicketModal, setShowWicketModal] = useState(false);
  const [activeMatchId, setActiveMatchId] = useState(null);
  const [dismissalType, setDismissalType] = useState("Bowled");
  const [fielderName, setFielderName] = useState("");
  const [isCustomFielder, setIsCustomFielder] = useState(false);

  // Scoreboard Quick Edit states
  const [isEditingScoreboard, setIsEditingScoreboard] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [eventAnimation, setEventAnimation] = useState(null);
  const [presentationMatch, setPresentationMatch] = useState(null);
  const [focusedMatchId, setFocusedMatchId] = useState(null);

  const [simulatedMatch, setSimulatedMatch] = useState({
    id: "simulated-live-99",
    teamA: "Chennai Super Kings",
    teamB: "Mumbai Indians",
    scoreA: 142,
    scoreB: 0,
    wickets: 3,
    overs: 18.2,
    currentBatsman: "Ruturaj Gaikwad",
    batsmanRuns: 64,
    batsmanBalls: 41,
    currentNonStriker: "MS Dhoni",
    nonStrikerRuns: 18,
    nonStrikerBalls: 9,
    currentBowler: "Jasprit Bumrah",
    bowlerWickets: 2,
    status: "LIVE",
    isSimulated: true,
    tournament: { name: "Indian Premier League" },
    round: "QUALIFIER 1"
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setSimulatedMatch(prev => {
        const events = ["dot", "1run", "2runs", "four", "six", "wicket"];
        const event = events[Math.floor(Math.random() * events.length)];
        
        let runs = 0;
        let wickets = prev.wickets;
        let bRuns = prev.batsmanRuns;
        let bBalls = prev.batsmanBalls + 1;
        let lastEvent = prev.lastEvent || "-";

        if (event === "dot") {
          lastEvent = "Dot ball";
        } else if (event === "1run") {
          runs = 1;
          bRuns += 1;
          lastEvent = "1 run";
        } else if (event === "2runs") {
          runs = 2;
          bRuns += 2;
          lastEvent = "2 runs";
        } else if (event === "four") {
          runs = 4;
          bRuns += 4;
          lastEvent = "FOUR!!!";
        } else if (event === "six") {
          runs = 6;
          bRuns += 6;
          lastEvent = "SIX!!!";
        } else if (event === "wicket") {
          wickets = wickets < 9 ? wickets + 1 : 0;
          bRuns = 0;
          bBalls = 0;
          lastEvent = "WICKET OUT!!!";
        }

        let nextOvers = prev.overs;
        let whole = Math.floor(nextOvers);
        let fraction = Math.round((nextOvers - whole) * 10) + 1;
        if (fraction >= 6) {
          whole += 1;
          fraction = 0;
        }
        if (whole >= 20) {
          whole = 0;
          fraction = 0;
        }
        nextOvers = whole + (fraction / 10);

        return {
          ...prev,
          scoreA: prev.scoreA + runs,
          wickets,
          overs: nextOvers,
          batsmanRuns: bRuns,
          batsmanBalls: bBalls,
          lastEvent
        };
      });
    }, 3500);

    return () => clearInterval(interval);
  }, []);

  const displayedMatches = React.useMemo(() => {
    const hasLive = matches.some(m => (m.status || "").toUpperCase() === "LIVE");
    if (hasLive) return matches;
    return [simulatedMatch, ...matches];
  }, [matches, simulatedMatch]);

  const [activePanelTab, setActivePanelTab] = useState("");
  const prevFocusedMatchIdRef = useRef(null);
  
  // Refs for tracking match state changes and animation triggers (real-time for players)
  const prevMatchesRef = useRef({});
  const lastTriggeredAnimationRef = useRef({});

  // Toss setup states
  const [showTossModal, setShowTossModal] = useState(false);
  const [tossWinner, setTossWinner] = useState("");
  const [tossDecision, setTossDecision] = useState("BAT");

  // Custom Confirmation Modal state
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmModalConfig, setConfirmModalConfig] = useState({
    title: "Confirm Action",
    message: "Are you sure?",
    onConfirm: () => {}
  });
  
  // CricHeroes Commentary & Chat Cheer states
  const [activeTabMap, setActiveTabMap] = useState({});
  const [commentaryMap, setCommentaryMap] = useState({});
  const [chatMap, setChatMap] = useState({});
  const [chatUser, setChatUser] = useState(sessionStorage.getItem("username") || "Fan");
  const [chatInputMap, setChatInputMap] = useState({});
  const [cheerEmojis] = useState(["🔥", "🏏", "👏", "🙌", "🎉", "👑", "💪"]);
  const [allTeams, setAllTeams] = useState([]);
  const [playersMap, setPlayersMap] = useState({});

  const navigate = useNavigate();
  const email = sessionStorage.getItem("email") || "user@tournament.app";
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
        // Silent catch
      }
    };
    if (email) {
      fetchProfileName();
    }
  }, [email]);

  const showToast = (text, type = "success") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, text, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const triggerAnimation = useCallback((type, matchId) => {
    const last = lastTriggeredAnimationRef.current[matchId];
    const now = Date.now();
    // Prevent double triggering the exact same animation within 3.5s
    if (last && last.type === type && (now - last.timestamp) < 3500) {
      return;
    }
    lastTriggeredAnimationRef.current[matchId] = { type, timestamp: now };
    setEventAnimation({ type, matchId });
    setTimeout(() => {
      setEventAnimation(null);
    }, 3500);
  }, []);

  const triggerConfirm = (title, message, onConfirm) => {
    setConfirmModalConfig({
      title,
      message,
      onConfirm: () => {
        onConfirm();
        setShowConfirmModal(false);
      }
    });
    setShowConfirmModal(true);
  };

  const handleDeleteCommentary = (commentaryId, matchId) => {
    triggerConfirm(
      "Delete Commentary Entry",
      "Are you sure you want to delete this commentary entry? This action cannot be undone.",
      async () => {
        try {
          await API.delete(`/matches/commentary/${commentaryId}`);
          showToast("Commentary deleted successfully.", "success");
          fetchCommentary(matchId);
        } catch (err) {
          console.error(err);
          showToast("Failed to delete commentary.", "error");
        }
      }
    );
  };

  const [scoreboardForm, setScoreboardForm] = useState({
    scoreA: 0,
    scoreB: 0,
    wickets: 0,
    overs: 0.0,
    extras: 0,
    targetScore: 0,
    currentBatsman: "",
    batsmanRuns: 0,
    batsmanBalls: 0,
    currentNonStriker: "",
    nonStrikerRuns: 0,
    nonStrikerBalls: 0,
    currentBowler: "",
    bowlerWickets: 0,
    currentInnings: 1,
    status: "LIVE",
    teamA: "",
    teamB: "",
    maxOvers: 20.0
  });

  const role = sessionStorage.getItem("role") || "PLAYER";
  const isAdmin = role === "ADMIN" || role === "ORGANIZER";
  const userEmail = sessionStorage.getItem("email");
  const getTeamInitials = (name) => {
    if (!name) return "?";
    const words = name.trim().split(/\s+/);
    if (words.length === 1) return words[0].substring(0, 2).toUpperCase();
    return (words[0][0] + (words[1] ? words[1][0] : "")).toUpperCase();
  };

  const isBowlerChangeRequired = (match) => {
    if (!match || match.status !== "LIVE") return false;
    const overs = match.overs ?? 0.0;
    const isOverComplete = overs > 0 && (overs % 1 === 0);
    if (!isOverComplete) return false;
    const curBowler = (match.currentBowler || "").trim();
    const lastBowler = (match.lastBowler || "").trim();
    if (!curBowler || curBowler === "Bowler" || curBowler === "Select Bowler") return true;
    if (lastBowler && curBowler.toLowerCase() === lastBowler.toLowerCase()) return true;
    return false;
  };

  const hasWriteAccess = (match) => {
    if (!isAdmin) return false;
    const tourney = match?.tournament;
    if (!tourney) return false; // fallback
    let creator = tourney.createdBy;
    if (!creator) creator = "admin@gmail.com";
    if (userEmail && creator.toLowerCase() === userEmail.toLowerCase()) return true;
    const collaborators = tourney.collaborators ? tourney.collaborators.split(",").filter(c => c.trim().length > 0) : [];
    return collaborators.some(collab => userEmail && collab.trim().toLowerCase() === userEmail.toLowerCase());
  };

  const fetchCommentary = useCallback(async (matchId) => {
    try {
      const res = await API.get(`/matches/${matchId}/commentary`);
      setCommentaryMap((prev) => ({ ...prev, [matchId]: res.data }));
    } catch (err) {
      console.error(err);
    }
  }, []);

  const fetchChat = useCallback(async (matchId) => {
    try {
      const res = await API.get(`/matches/${matchId}/chat`);
      setChatMap((prev) => ({ ...prev, [matchId]: res.data }));
    } catch (err) {
      console.error(err);
    }
  }, []);

  const fetchLiveMatches = useCallback(async () => {
    try {
      const res = await API.get("/matches");
      const liveMatches = res.data.filter((match) => match.status === "LIVE");
      
      // Compare and trigger animations for players & fans viewing the screen (real-time sync)
      liveMatches.forEach((match) => {
        const prevMatch = prevMatchesRef.current[match.id];
        if (prevMatch) {
          // If the last event has changed or wickets increased
          const eventChanged = match.lastEvent && match.lastEvent !== prevMatch.lastEvent;
          const wicketsIncreased = (match.wickets ?? 0) > (prevMatch.wickets ?? 0) && (match.currentInnings === prevMatch.currentInnings);

          if (eventChanged || wicketsIncreased) {
            const ev = (match.lastEvent || "").toUpperCase();
            if (ev.includes("4 RUN") || ev.includes("FOUR")) {
              triggerAnimation("FOUR", match.id);
            } else if (ev.includes("6 RUN") || ev.includes("SIX")) {
              triggerAnimation("SIX", match.id);
            } else if (ev.includes("LBW")) {
              triggerAnimation("LBW WICKET", match.id);
            } else if (ev.includes("WICKET") || ev.includes("OUT!") || ev.includes("DISMISSED") || wicketsIncreased) {
              triggerAnimation("WICKET", match.id);
            } else if (ev.includes("WIDE")) {
              triggerAnimation("WIDE", match.id);
            } else if (ev.includes("NO BALL")) {
              triggerAnimation("NO BALL", match.id);
            } else if (ev.includes("LEG BYE")) {
              triggerAnimation("LEG BYE", match.id);
            } else if (ev.includes("OVER END")) {
              triggerAnimation("OVER END", match.id);
            } else if (ev.includes("DOT") || ev.includes("DOT BALL") || ev === "0" || ev.includes("0 RUN")) {
              triggerAnimation("DOT BALL", match.id);
            }
          }
        }
        
        // Cache current match stats for the next comparison
        prevMatchesRef.current[match.id] = {
          scoreA: match.scoreA,
          scoreB: match.scoreB,
          wickets: match.wickets,
          overs: match.overs,
          lastEvent: match.lastEvent
        };
      });

      setMatches(liveMatches);
      setMessage("");
      setLastUpdated(new Date().toLocaleTimeString());

      if (liveMatches.length === 1) {
        setFocusedMatchId(liveMatches[0].id);
      } else if (liveMatches.length > 1) {
        if (focusedMatchId && !liveMatches.some(m => m.id === focusedMatchId)) {
          setFocusedMatchId(null);
        }
      } else {
        setFocusedMatchId(null);
      }

      // Prefetch commentaries for all live matches to support over review and bowler limits
      liveMatches.forEach((m) => {
        fetchCommentary(m.id);
      });

      if (liveMatches.length > 0) {
        try {
          const teamsRes = await API.get("/teams");
          const teamsList = teamsRes.data;
          setAllTeams(teamsList);

          const activeTeamIds = new Set();
          liveMatches.forEach((m) => {
            const tA = teamsList.find(t => t.teamName === m.teamA);
            const tB = teamsList.find(t => t.teamName === m.teamB);
            if (tA) activeTeamIds.add(tA.id);
            if (tB) activeTeamIds.add(tB.id);
          });

          const newPlayersMap = {};
          await Promise.all(
            Array.from(activeTeamIds).map(async (teamId) => {
              try {
                const playersRes = await API.get(`/players/team/${teamId}`);
                newPlayersMap[teamId] = playersRes.data;
              } catch (err) {
                console.error("Failed to load players for team " + teamId, err);
              }
            })
          );
          setPlayersMap(newPlayersMap);
        } catch (err) {
          console.error("Failed to fetch teams/rosters", err);
        }
      }
    } catch (err) {
      console.error(err);
      setMessage("Failed to load live scores.");
    }
  }, [triggerAnimation, fetchCommentary, focusedMatchId]);

  const toggleInteractiveTab = (matchId, tab) => {
    setActiveTabMap((prev) => ({
      ...prev,
      [matchId]: prev[matchId] === tab ? null : tab
    }));
    if (tab === "commentary") {
      fetchCommentary(matchId);
    } else if (tab === "chat") {
      fetchChat(matchId);
    }
  };

  const submitChatMessage = async (e, matchId, customMsg = null, reaction = "") => {
    if (e) e.preventDefault();
    const text = customMsg || chatInputMap[matchId] || "";
    if (!text && !reaction) return;

    try {
      await API.post(`/matches/${matchId}/chat`, {
        username: chatUser,
        message: text,
        reactionEmoji: reaction
      });
      setChatInputMap((prev) => ({ ...prev, [matchId]: "" }));
      fetchChat(matchId);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (focusedMatchId && focusedMatchId !== prevFocusedMatchIdRef.current) {
      const match = matches.find(m => m.id === focusedMatchId);
      if (match) {
        if (hasWriteAccess(match)) {
          setActivePanelTab("console");
        } else {
          setActivePanelTab("commentary");
        }
      }
    }
    prevFocusedMatchIdRef.current = focusedMatchId;
  }, [focusedMatchId, matches]);

  useEffect(() => {
    fetchLiveMatches();

    const interval = setInterval(() => {
      fetchLiveMatches();
      // Refresh details for active tabs
      Object.keys(activeTabMap).forEach((matchId) => {
        if (activeTabMap[matchId] === "commentary") {
          fetchCommentary(matchId);
        } else if (activeTabMap[matchId] === "chat") {
          fetchChat(matchId);
        }
      });
      if (focusedMatchId) {
        if (activePanelTab === "commentary") {
          fetchCommentary(focusedMatchId);
        } else if (activePanelTab === "chat") {
          fetchChat(focusedMatchId);
        }
      }
    }, 4000);
    return () => clearInterval(interval);
  }, [fetchLiveMatches, activeTabMap, fetchCommentary, fetchChat, focusedMatchId, activePanelTab]);

  const updateAction = async (id, action) => {
    try {
      await API.put(`/matches/${id}/${action}`);
      fetchLiveMatches();
      let displayAction = action.replace("-", " ");
      displayAction = displayAction.charAt(0).toUpperCase() + displayAction.slice(1);
      showToast(`${displayAction} completed successfully!`, "success");
      
      if (action === "no-ball") triggerAnimation("NO BALL", id);
      if (action === "wide") triggerAnimation("WIDE", id);
      if (action === "leg-bye") triggerAnimation("LEG BYE", id);
      if (action === "lbw") triggerAnimation("LBW WICKET", id);
      if (action === "dot-ball") triggerAnimation("DOT BALL", id);
      
      // refresh commentary
      fetchCommentary(id);
    } catch (err) {
      console.error(err);
      showToast(`Failed to perform action: ${action.replace("-", " ")}.`, "error");
    }
  };

  const addRun = async (id, runs) => {
    try {
      await API.put(`/matches/${id}/run/${runs}`);
      if (selectedPosition) {
        setSelectedPosition("");
      }
      fetchLiveMatches();
      showToast(`Added +${runs} run(s).`, "success");
      
      if (runs === 4) triggerAnimation("FOUR", id);
      if (runs === 6) triggerAnimation("SIX", id);

      // refresh commentary
      fetchCommentary(id);
    } catch (err) {
      console.error(err);
      showToast("Failed to record runs.", "error");
    }
  };

  const handleUndo = async (id) => {
    try {
      await API.put(`/matches/${id}/undo`);
      fetchLiveMatches();
      showToast("Last ball undone successfully.", "success");
    } catch (err) {
      showToast("No event to undo.", "warning");
    }
  };

  const submitWicketDetail = async () => {
    if (!activeMatchId) return;
    try {
      await API.put(`/matches/${activeMatchId}/wicket-detail?dismissalType=${encodeURIComponent(dismissalType)}&fielder=${encodeURIComponent(fielderName)}`);
      setShowWicketModal(false);
      setFielderName("");
      fetchLiveMatches();
      showToast("Wicket recorded successfully!", "success");
      triggerAnimation("WICKET", activeMatchId);
    } catch (err) {
      console.error(err);
      showToast("Failed to submit wicket details.", "error");
    }
  };

  const updatePlayers = async (id, batsman, nonStriker, bowler) => {
    try {
      await API.put(`/matches/${id}/players?batsman=${encodeURIComponent(batsman)}&nonStriker=${encodeURIComponent(nonStriker)}&bowler=${encodeURIComponent(bowler)}`);
      fetchLiveMatches();
      showToast("Active players updated successfully!", "success");
    } catch (err) {
      console.error(err);
      showToast("Failed to update active players.", "error");
    }
  };

  const handleScoreboardOverrideSubmit = async (e) => {
    e.preventDefault();
    if (!activeMatchId) return;
    try {
      await API.put(`/matches/${activeMatchId}`, scoreboardForm);
      setIsEditingScoreboard(false);
      fetchLiveMatches();
      showToast("Scoreboard updated successfully!", "success");
    } catch (err) {
      console.error(err);
      showToast("Failed to update scoreboard.", "error");
    }
  };

  const getBattingOrder = (match) => {
    const tA = match.teamA || "Team A";
    const tB = match.teamB || "Team B";
    const tossWin = match.tossWinner;
    const tossDec = match.tossDecision;

    let firstBat = tA;
    let secondBat = tB;

    if (tossWin && tossWin.trim() !== "") {
      const isAWin = tossWin.toLowerCase() === tA.toLowerCase();
      if (isAWin) {
        if (tossDec === "BOWL") {
          firstBat = tB;
          secondBat = tA;
        }
      } else {
        if (tossDec === "BAT") {
          firstBat = tB;
          secondBat = tA;
        }
      }
    }
    return { firstBat, secondBat };
  };

  const getFieldingPlayers = () => {
    const match = matches.find(m => m.id === activeMatchId);
    if (!match) return [];
    const { firstBat, secondBat } = getBattingOrder(match);
    const bowlingTeamName = match.currentInnings === 1 ? secondBat : firstBat;
    const bowlTeamObj = allTeams.find(t => t.teamName === bowlingTeamName);
    return bowlTeamObj ? (playersMap[bowlTeamObj.id] || []) : [];
  };

  const getDismissedBatsmen = (matchId) => {
    const commentaries = commentaryMap[matchId] || [];
    return commentaries
      .filter(c => c.event === "WICKET" && c.batsmanName && !c.description?.includes("Retired Hurt"))
      .map(c => c.batsmanName.trim().toLowerCase());
  };

  const getSelectableBatsmen = (battingPlayers, match, isStriker) => {
    const otherBatsmanName = isStriker 
      ? (match.currentNonStriker || "").trim().toLowerCase() 
      : (match.currentBatsman || "").trim().toLowerCase();
      
    const currentSelectedName = isStriker
      ? (match.currentBatsman || "").trim().toLowerCase()
      : (match.currentNonStriker || "").trim().toLowerCase();
      
    const dismissedNames = getDismissedBatsmen(match.id);
    
    return battingPlayers.filter(p => {
      const pNameLower = (p.playerName || "").trim().toLowerCase();
      
      // Always allow the currently selected player for this position
      if (currentSelectedName && pNameLower === currentSelectedName) {
        return true;
      }
      
      // Exclude the other batsman
      if (otherBatsmanName && pNameLower === otherBatsmanName) {
        return false;
      }
      
      // Exclude dismissed batsmen
      if (dismissedNames.includes(pNameLower)) {
        return false;
      }
      
      return true;
    });
  };

  const handleEditTossClick = (match) => {
    setActiveMatchId(match.id);
    setTossWinner(match.tossWinner || match.teamA || "");
    setTossDecision(match.tossDecision || "BAT");
    setShowTossModal(true);
  };

  const submitTossSetup = async () => {
    if (!activeMatchId) return;
    try {
      await API.put(`/matches/${activeMatchId}/toss?tossWinner=${encodeURIComponent(tossWinner)}&tossDecision=${encodeURIComponent(tossDecision)}`);
      setShowTossModal(false);
      fetchLiveMatches();
      showToast("Toss configured successfully!", "success");
    } catch (err) {
      console.error(err);
      showToast("Failed to configure toss.", "error");
    }
  };


  const getCricketStats = (match) => {
    const scoreA = match.scoreA ?? 0;
    const scoreB = match.scoreB ?? 0;
    const wickets = match.wickets ?? 0;
    const overs = match.overs ?? 0.0;
    const maxOvers = match.maxOvers ?? 20.0;
    const currentInnings = match.currentInnings ?? 1;
    const target = match.targetScore ?? 0;

    const getBallsFromOvers = (oversVal) => {
      const whole = Math.floor(oversVal);
      const fraction = Math.round((oversVal - whole) * 10);
      return (whole * 6) + fraction;
    };

    const totalBalls = Math.floor(maxOvers) * 6;
    const ballsBowled = getBallsFromOvers(overs);
    const ballsRemaining = Math.max(0, totalBalls - ballsBowled);

    let crr = "0.00";
    if (ballsBowled > 0) {
      const currentScore = currentInnings === 1 ? scoreA : scoreB;
      crr = ((currentScore / ballsBowled) * 6).toFixed(2);
    }

    let rrr = null;
    let runsNeeded = null;
    if (currentInnings === 2 && match.status === "LIVE") {
      runsNeeded = Math.max(0, target - scoreB);
      if (ballsRemaining > 0) {
        rrr = ((runsNeeded / ballsRemaining) * 6).toFixed(2);
      } else {
        rrr = runsNeeded > 0 ? "∞" : "0.00";
      }
    }

    return {
      crr,
      rrr,
      runsNeeded,
      ballsRemaining,
      ballsBowled
    };
  };

  const getBowlerOversCount = (matchId, bowlerName) => {
    if (!bowlerName || bowlerName === "Bowler") return 0.0;
    const commentaries = commentaryMap[matchId] || [];
    const legalBalls = commentaries.filter(c => 
      c.bowlerName?.toLowerCase().trim() === bowlerName.toLowerCase().trim() &&
      c.event && 
      !["WIDE", "NO BALL", "OVER END"].includes(c.event.toUpperCase())
    ).length;
    const whole = Math.floor(legalBalls / 6);
    const fraction = legalBalls % 6;
    return whole + (fraction / 10.0);
  };

  const isBowlerDisabled = (match, bowlerName) => {
    if (!bowlerName || bowlerName === "Bowler" || bowlerName === "Select Bowler") return false;
    if (match.lastBowler && match.lastBowler.toLowerCase().trim() === bowlerName.toLowerCase().trim()) {
      return true;
    }
    const count = getBowlerOversCount(match.id, bowlerName);
    if (count >= 4.0) {
      return true;
    }
    return false;
  };

  const getCurrentOverBalls = (match, commentaries) => {
    if (!commentaries || commentaries.length === 0) return [];
    const currentOvers = match.overs || 0.0;
    const whole = Math.floor(currentOvers);
    const fraction = Math.round((currentOvers - whole) * 10);
    
    let targetOverStr;
    if (fraction === 0) {
      targetOverStr = (whole - 1).toString();
    } else {
      targetOverStr = whole.toString();
    }
    
    return commentaries
      .filter(c => {
        const ob = c.overBall || "";
        if (fraction === 0) {
          return ob.startsWith(targetOverStr + ".") || ob === whole.toFixed(1);
        } else {
          return ob.startsWith(targetOverStr + ".");
        }
      })
      .reverse();
  };

  const getBallDisplay = (event) => {
    const ev = event ? event.toUpperCase() : "";
    if (ev.includes("DOT") || ev.includes("DOT BALL")) return "0";
    if (ev.includes("WIDE")) return "Wd";
    if (ev.includes("NO BALL")) return "Nb";
    if (ev.includes("WICKET")) return "W";
    if (ev.includes("LEG BYE")) return "Lb";
    if (ev.includes("LBW")) return "LBW";
    if (ev.includes("1 RUN") || ev.includes("1 RUNS")) return "1";
    if (ev.includes("2 RUN") || ev.includes("2 RUNS")) return "2";
    if (ev.includes("3 RUN") || ev.includes("3 RUNS")) return "3";
    if (ev.includes("4 RUN") || ev.includes("4 RUNS")) return "4";
    if (ev.includes("6 RUN") || ev.includes("6 RUNS")) return "6";
    const matchRuns = ev.match(/(\d+)\s*RUN/);
    if (matchRuns) return matchRuns[1];
    return "•";
  };

  const focusedMatch = displayedMatches.find(m => m.id === focusedMatchId);

  const dashboardPath = role === "ADMIN" ? "/admin" : role === "ORGANIZER" ? "/organizer" : "/player";

  return (
    <div className="live-page-fullscreen-wrapper">
      <div className="bg-glow-container">
        <div className="bg-glow-ball bg-glow-ball-1"></div>
        <div className="bg-glow-ball bg-glow-ball-2"></div>
        <div className="bg-glow-ball bg-glow-ball-3"></div>
      </div>
      
      <header className="live-page-topbar">
        <div className="live-page-topbar-left">
          <button className="btn-back-dashboard" onClick={() => navigate(dashboardPath)}>
            ← Back to Dashboard
          </button>
          <div className="topbar-title-group">
            <span className="eyebrow">Live operations</span>
            <h1>Live Match Center</h1>
            <p>Monitor live games and update scoring controls in real time.</p>
          </div>
        </div>
        
        <div className="live-page-topbar-right">
          <div className="live-stat-card topbar-stat">
            <strong>{displayedMatches.filter(m => (m.status || "").toUpperCase() === "LIVE").length}</strong>
            <span>Active</span>
          </div>

          <div className="live-refresh-box topbar-refresh">
            <div className="live-refresh-icon">
              <FaSyncAlt />
            </div>
            <div>
              <strong>Sync Active</strong>
              <p>{lastUpdated ? `Updated ${lastUpdated}` : "Waiting..."}</p>
            </div>
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
        </div>
      </header>

      <div className="live-page">

        {message && <div className="live-error">{message}</div>}

        {!focusedMatch && (
          <>
            {/* Live Marquee & Headlines Ticker */}
            <div className="live-ticker-banner animate-fade-in-up">
              <div className="live-ticker-badge">⚡ BROADCAST UPDATES</div>
              <div className="live-ticker-marquee">
                <div className="marquee-content">
                  🔥 MATCH DAY ALERT: Mumbai Indians vs Chennai Super Kings live from MA Chidambaram Stadium! &nbsp;&nbsp;•&nbsp;&nbsp; 👑 STATS ALERT: Ruturaj Gaikwad leads with 412 season runs! &nbsp;&nbsp;•&nbsp;&nbsp; ⚡ SPEED ALERT: Jasprit Bumrah has taken 18 wickets at an economy of 6.2! &nbsp;&nbsp;•&nbsp;&nbsp; 🏏 NEXT FIXTURE: Sunrisers Hyderabad vs Rajasthan Royals starting at 07:30 PM! &nbsp;&nbsp;•&nbsp;&nbsp; 🔥 MATCH DAY ALERT: Mumbai Indians vs Chennai Super Kings live from MA Chidambaram Stadium!
                </div>
              </div>
            </div>

            {/* Star Performers Grid */}
            <div className="star-performers-section animate-fade-in-up">
              <h3>🌟 Match Day Star Performers</h3>
              <div className="star-performers-grid">
                <div className="star-card glass-panel">
                  <div className="star-avatar-3d">👑</div>
                  <div className="star-info">
                    <h4>Ruturaj Gaikwad</h4>
                    <p>Chennai Super Kings</p>
                    <span className="star-stat">421 Runs • 144.2 SR</span>
                  </div>
                </div>
                <div className="star-card glass-panel">
                  <div className="star-avatar-3d">🔥</div>
                  <div className="star-info">
                    <h4>Jasprit Bumrah</h4>
                    <p>Mumbai Indians</p>
                    <span className="star-stat">18 Wkts • 6.18 Econ</span>
                  </div>
                </div>
                <div className="star-card glass-panel">
                  <div className="star-avatar-3d">⚡</div>
                  <div className="star-info">
                    <h4>Virat Kohli</h4>
                    <p>Royal Challengers</p>
                    <span className="star-stat">389 Runs • 138.5 SR</span>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {!focusedMatch ? (
          /* Grid View of all active matches */
          <div className="live-grid animate-fade-in">
            {displayedMatches.length > 0 ? (
              displayedMatches.map((match) => {
                const { firstBat, secondBat } = getBattingOrder(match);
                return (
                  <div 
                    className="live-card compact-live-card" 
                    key={match.id}
                    onClick={() => setFocusedMatchId(match.id)}
                    style={{ cursor: "pointer" }}
                  >
                    <div className="live-card-top">
                      <div className="live-round-chip">
                        <FaTrophy />
                        <span>{match.round || "ROUND"}</span>
                      </div>
                      <div className="live-status-chip">
                        <FaSignal />
                        <span>LIVE</span>
                      </div>
                    </div>

                    <div className="live-tournament-name">{match.tournament?.name || "Tournament"}</div>

                    <div className="live-scoreboard compact-scoreboard">
                      <div className="live-team-row">
                        <div className="team-badge-circle compact-badge">{getTeamInitials(firstBat)}</div>
                        <span className="compact-team-name">{firstBat}</span>
                        <span className="compact-team-score">
                          {match.scoreA ?? 0}
                          {match.currentInnings === 1 && <span className="compact-wickets">/{match.wickets ?? 0}</span>}
                        </span>
                      </div>
                      <div className="live-team-row">
                        <div className="team-badge-circle compact-badge">{getTeamInitials(secondBat)}</div>
                        <span className="compact-team-name">{secondBat}</span>
                        <span className="compact-team-score">
                          {match.scoreB ?? 0}
                          {match.currentInnings === 2 && <span className="compact-wickets">/{match.wickets ?? 0}</span>}
                        </span>
                      </div>
                    </div>

                    <div className="compact-card-footer">
                      <span className="compact-overs-val">Overs: {match.overs ?? "0.0"}</span>
                      <div style={{ display: "flex", gap: "6px" }}>
                        <button 
                          className="btn-enter-match-center"
                          onClick={(e) => {
                            e.stopPropagation();
                            setFocusedMatchId(match.id);
                          }}
                        >
                          🎯 Score Center
                        </button>
                        <button 
                          className="btn-enter-match-center"
                          style={{ background: "linear-gradient(135deg, var(--primary), var(--accent-purple))", borderColor: "transparent", color: "white" }}
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/live-match-center/${match.id}`);
                          }}
                        >
                          📺 Stadium Live
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="live-empty">
                <h3>No live matches</h3>
                <p>Start a live match to see score updates here.</p>
              </div>
            )}
          </div>
        ) : (
          /* Dual-Panel Immersive Focused Match Center */
          (() => {
            const match = focusedMatch;
            const stats = getCricketStats(match);
            const isLocked = isBowlerChangeRequired(match);
            const { firstBat, secondBat } = getBattingOrder(match);
            const canWrite = hasWriteAccess(match);

            return (
              <div className="live-focused-container animate-page-fade-in">
                {/* Left Panel: Massive Stadium Scoreboard & Stats */}
                <div className="live-focused-left">
                  <div className="focused-left-header">
                    {matches.length > 1 && (
                      <button className="btn-back-list" onClick={() => setFocusedMatchId(null)}>
                        ← Back to Matches List
                      </button>
                    )}
                    <button
                      className="btn-presentation-mode"
                      onClick={() => setPresentationMatch(match)}
                      title="Stadium Broadcast View"
                      style={{ marginLeft: matches.length > 1 ? "12px" : "0" }}
                    >
                      📺 Stadium Broadcast Mode
                    </button>
                  </div>

                  <div className="live-card focused-scoreboard-card">
                    <div className="live-card-top">
                      <div className="live-round-chip">
                        <FaTrophy />
                        <span>{match.round || "ROUND"}</span>
                      </div>
                      <div className="live-status-chip">
                        <FaSignal />
                        <span>LIVE</span>
                      </div>
                    </div>

                    <div className="live-tournament-name">{match.tournament?.name || "Tournament"}</div>

                    <div className="live-toss-banner-container">
                      <div 
                        className={`live-toss-banner ${canWrite ? "clickable-banner" : ""}`}
                        onClick={canWrite ? () => handleEditTossClick(match) : undefined}
                        title={canWrite ? "Click to configure toss" : undefined}
                      >
                        {match.tossWinner ? (
                          <>
                            <span className="coin-emoji">🪙</span>
                            <span>{match.tossWinner}</span> won the toss and elected to <span>{match.tossDecision === "BAT" ? "bat" : "field"}</span> first
                            {canWrite && <span className="edit-toss-hint"> (Click to Edit)</span>}
                          </>
                        ) : (
                          <>
                            <span className="coin-emoji">🪙</span>
                            <span>Toss not decided yet.</span>
                            {canWrite && <span className="edit-toss-hint"> (Click to Configure Toss)</span>}
                          </>
                        )}
                      </div>
                    </div>

                    <div className="live-scoreboard">
                      <div className={`live-team-box ${match.currentInnings === 1 ? "batting-active" : ""}`}>
                        <div className="team-badge-wrapper">
                          <div className="team-badge-circle badge-team-a">
                            {getTeamInitials(firstBat)}
                          </div>
                        </div>
                        <div className="live-team-name">
                          {firstBat}
                          {match.tossWinner === firstBat && <span className="toss-winner-coin" title="Toss Winner">🪙</span>}
                          {match.currentInnings === 1 && <span className="batting-dot"></span>}
                        </div>
                        <div className="live-score">
                          {match.scoreA ?? 0}
                          {match.currentInnings === 1 && <span className="score-wickets">/{match.wickets ?? 0}</span>}
                        </div>
                        <p className="overs-val">
                          {match.currentInnings === 1 ? `Overs: ${match.overs ?? "0.0"}` : "Innings 1 Completed"}
                        </p>
                      </div>

                      <div className="live-vs">
                        <div className="vs-badge">
                          <FaGamepad />
                          <span>VS</span>
                        </div>
                      </div>

                      <div className={`live-team-box ${match.currentInnings === 2 ? "batting-active" : ""}`}>
                        <div className="team-badge-wrapper">
                          <div className="team-badge-circle badge-team-b">
                            {getTeamInitials(secondBat)}
                          </div>
                        </div>
                        <div className="live-team-name">
                          {secondBat}
                          {match.tossWinner === secondBat && <span className="toss-winner-coin" title="Toss Winner">🪙</span>}
                          {match.currentInnings === 2 && <span className="batting-dot"></span>}
                        </div>
                        <div className="live-score">
                          {match.scoreB ?? 0}
                          {match.currentInnings === 2 && <span className="score-wickets">/{match.wickets ?? 0}</span>}
                        </div>
                        <p className="overs-val">
                          {match.currentInnings === 2 ? `Overs: ${match.overs ?? "0.0"}` : "Yet to bat"}
                        </p>
                      </div>
                    </div>

                    <div className="live-active-players">
                      <div className="player-role-stat batsman-stat-item active-striker-stat">
                        <span className="player-role-badge batsman-badge">Striker</span>
                        <span className="player-active-name">
                          <span className="bat-icon-glow">🏏</span> {match.currentBatsman || "Striker"}
                        </span>
                        <span className="player-stats-numbers">
                          <strong>{match.batsmanRuns ?? 0}</strong> <span className="balls-count">({match.batsmanBalls ?? 0}b)</span>
                        </span>
                      </div>
                      <div className="player-role-stat batsman-stat-item">
                        <span className="player-role-badge batsman-badge non-striker-badge">Non-Striker</span>
                        <span className="player-active-name">{match.currentNonStriker || "Non-Striker"}</span>
                        <span className="player-stats-numbers">
                          <strong>{match.nonStrikerRuns ?? 0}</strong> <span className="balls-count">({match.nonStrikerBalls ?? 0}b)</span>
                        </span>
                      </div>
                      <div className="player-role-stat bowler-stat-item">
                        <span className="player-role-badge bowler-badge">Bowler</span>
                        <span className="player-active-name">{match.currentBowler || "Bowler"}</span>
                        <span className="player-stats-numbers font-gold">
                          <strong>{match.bowlerWickets ?? 0}</strong> <span className="wicket-lbl">Wkts</span> <span className="overs-count">({getBowlerOversCount(match.id, match.currentBowler)} ov)</span>
                        </span>
                      </div>
                    </div>

                    {commentaryMap[match.id] && (
                      <div className="live-over-review">
                        <span className="over-review-title">This Over:</span>
                        <div className="over-review-balls">
                          {getCurrentOverBalls(match, commentaryMap[match.id]).map((ball, idx) => {
                            const val = getBallDisplay(ball.event);
                            return (
                              <span 
                                key={`${ball.id}-${idx}`} 
                                className={`over-ball-bubble ball-${val.toLowerCase()}`}
                                title={`${ball.overBall} Overs: ${ball.description}`}
                              >
                                {val}
                              </span>
                            );
                          })}
                          {getCurrentOverBalls(match, commentaryMap[match.id]).length === 0 && (
                            <span className="over-ball-empty">Waiting for first ball...</span>
                          )}
                        </div>
                      </div>
                    )}

                    {stats && (
                      <div className="scorecard-cricket-stats">
                        <div className="stats-metric">
                          <strong>CRR</strong>
                          <span>{stats.crr}</span>
                        </div>
                        {stats.rrr && (
                          <div className="stats-metric">
                            <strong>RRR</strong>
                            <span className="rrr-glow">{stats.rrr}</span>
                          </div>
                        )}
                        <div className="stats-metric font-gold">
                          <strong>Extras</strong>
                          <span>{match.extras ?? 0}</span>
                        </div>
                        <div className="stats-metric">
                          <strong>Max Overs</strong>
                          <span>{match.maxOvers ?? "20.0"}</span>
                        </div>
                      </div>
                    )}

                    {stats && stats.runsNeeded !== null && (
                      <div className="scorecard-chase-banner">
                        {stats.runsNeeded > 0 ? (
                          <>
                            <span>Target: <strong>{match.targetScore}</strong></span>
                            <span>Need <strong>{stats.runsNeeded}</strong> runs off <strong>{stats.ballsRemaining}</strong> balls</span>
                          </>
                        ) : (
                          <span className="chase-completed">Target Chased! 🏆</span>
                        )}
                      </div>
                    )}

                    <div className="live-footer">
                      <p><strong>Fours:</strong> {match.fours ?? 0}</p>
                      <p><strong>Sixes:</strong> {match.sixes ?? 0}</p>
                      <p><strong>Last Ball:</strong> {match.lastEvent || "-"}</p>
                      <p><strong>Winner:</strong> {match.winner || "Match in progress"}</p>
                    </div>
                  </div>
                </div>

                {/* Right Panel: Scoring controls / Commentary / Chat tabs */}
                <div className="live-focused-right">
                  <div className="focused-right-tabs-header">
                    {canWrite && (
                      <button 
                        className={`focused-tab-btn ${activePanelTab === 'console' ? 'active' : ''}`}
                        onClick={() => setActivePanelTab('console')}
                      >
                        🎮 Scorer Console
                      </button>
                    )}
                    <button 
                      className={`focused-tab-btn ${activePanelTab === 'commentary' ? 'active' : ''}`}
                      onClick={() => setActivePanelTab('commentary')}
                    >
                      🎙️ Commentary
                    </button>
                    <button 
                      className={`focused-tab-btn ${activePanelTab === 'chat' ? 'active' : ''}`}
                      onClick={() => setActivePanelTab('chat')}
                    >
                      💬 Fan Cheer
                    </button>
                  </div>

                  <div className="focused-right-tab-content">
                    {/* Console Tab */}
                    {activePanelTab === 'console' && canWrite && (
                      <div className="admin-scoring-console animate-fade-in">
                        <div className="admin-console-header">Scorer Controls</div>
                        
                        {isLocked && (
                          <div className="bowler-required-alert">
                            <span className="alert-icon">⚠️</span>
                            <div className="alert-content">
                              <strong>New Bowler Required!</strong>
                              <p>Select a new bowler in the Players Setup below to start the next over.</p>
                            </div>
                          </div>
                        )}

                        <div className="console-group">
                          <span className="console-group-label">Fielding Pos</span>
                          <div className="fielding-positions-grid" style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                            {["Point", "Cover", "Mid-off", "Mid-on", "Mid-wicket", "Fine-leg", "Third-man", "Square-leg", "Long-on", "Long-off"].map((pos) => (
                              <button
                                key={pos}
                                className={`btn-pos ${selectedPosition === pos ? "active" : ""}`}
                                style={{
                                  padding: "4px 8px",
                                  fontSize: "10px",
                                  borderRadius: "6px",
                                  border: selectedPosition === pos ? "1px solid var(--primary)" : "1px solid var(--border)",
                                  background: selectedPosition === pos ? "rgba(99, 102, 241, 0.15)" : "rgba(15, 23, 42, 0.4)",
                                  color: selectedPosition === pos ? "var(--primary)" : "var(--text-secondary)",
                                  cursor: "pointer"
                                }}
                                onClick={() => setSelectedPosition(pos === selectedPosition ? "" : pos)}
                              >
                                {pos}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="console-group">
                          <span className="console-group-label">Runs</span>
                          <div className="console-buttons">
                            {[1, 2, 3].map((runs) => (
                              <button key={runs} className="btn-run" onClick={() => addRun(match.id, runs)} disabled={isLocked}>
                                +{runs}
                              </button>
                            ))}
                            <button className="btn-boundary btn-four" onClick={() => addRun(match.id, 4)} disabled={isLocked}>
                              +4 (Four)
                            </button>
                            <button className="btn-boundary btn-six" onClick={() => addRun(match.id, 6)} disabled={isLocked}>
                              +6 (Six)
                            </button>
                          </div>
                        </div>

                        <div className="console-group">
                          <span className="console-group-label">Extras</span>
                          <div className="console-buttons">
                            <button className="btn-dot" onClick={() => updateAction(match.id, "dot-ball")} disabled={isLocked}>Dot</button>
                            <button className="btn-extra" onClick={() => updateAction(match.id, "leg-bye")} disabled={isLocked}>Leg Bye</button>
                            <button className="btn-wide" onClick={() => updateAction(match.id, "wide")} disabled={isLocked}>Wide (+1)</button>
                            <button className="btn-noball" onClick={() => updateAction(match.id, "no-ball")} disabled={isLocked}>No Ball (+1)</button>
                            <button className="btn-lbw" onClick={() => updateAction(match.id, "lbw")} disabled={isLocked}>LBW</button>
                          </div>
                        </div>

                        <div className="console-group">
                          <span className="console-group-label">Strike</span>
                          <div className="console-buttons">
                            <button className="btn-rotate" onClick={() => updateAction(match.id, "rotate-strike")} disabled={isLocked}>
                              🔄 Rotate Strike
                            </button>
                          </div>
                        </div>

                        <div className="console-group">
                          <span className="console-group-label">Out & Reset</span>
                          <div className="console-buttons">
                            <button className="btn-wicket" onClick={() => {
                              setActiveMatchId(match.id);
                              setIsCustomFielder(false);
                              setFielderName("");
                              setShowWicketModal(true);
                            }} disabled={isLocked}>
                              Wicket (Out)
                            </button>
                            <button className="btn-undo" onClick={() => handleUndo(match.id)} style={{ background: "rgba(239, 68, 68, 0.1)", color: "var(--danger)", borderColor: "rgba(239, 68, 68, 0.3)" }}>
                              ↩️ Undo Ball
                            </button>
                            <button
                              className="btn-pos active"
                              onClick={() => {
                                setActiveMatchId(match.id);
                                setScoreboardForm({
                                  scoreA: match.scoreA ?? 0,
                                  scoreB: match.scoreB ?? 0,
                                  wickets: match.wickets ?? 0,
                                  overs: match.overs ?? 0.0,
                                  extras: match.extras ?? 0,
                                  targetScore: match.targetScore ?? 0,
                                  currentBatsman: match.currentBatsman ?? "",
                                  batsmanRuns: match.batsmanRuns ?? 0,
                                  batsmanBalls: match.batsmanBalls ?? 0,
                                  currentNonStriker: match.currentNonStriker ?? "",
                                  nonStrikerRuns: match.nonStrikerRuns ?? 0,
                                  nonStrikerBalls: match.nonStrikerBalls ?? 0,
                                  currentBowler: match.currentBowler ?? "",
                                  bowlerWickets: match.bowlerWickets ?? 0,
                                  currentInnings: match.currentInnings ?? 1,
                                  status: match.status ?? "LIVE",
                                  teamA: match.teamA,
                                  teamB: match.teamB,
                                  groundName: match.groundName,
                                  ballType: match.ballType,
                                  matchType: match.matchType,
                                  maxOvers: match.maxOvers,
                                  round: match.round
                                });
                                setIsEditingScoreboard(true);
                              }}
                              style={{
                                background: "rgba(245, 158, 11, 0.15)",
                                color: "#fcd34d",
                                border: "1px solid rgba(245, 158, 11, 0.3)"
                              }}
                            >
                              ✏️ Edit
                            </button>
                            <button
                              className="btn-pos active"
                              onClick={() => handleEditTossClick(match)}
                              style={{
                                background: "rgba(59, 130, 246, 0.15)",
                                color: "#60a5fa",
                                border: "1px solid rgba(59, 130, 246, 0.3)"
                              }}
                            >
                              🪙 Toss
                            </button>
                            <button
                              className="btn-pos active"
                              onClick={() => {
                                triggerConfirm(
                                  "Reset Match Scoring State",
                                  "Are you sure you want to reset this match scoring state completely? This will clear all runs, wickets, overs, commentary, and unlock bowler selection.",
                                  async () => {
                                    try {
                                      await API.put(`/matches/${match.id}/reset`);
                                      fetchLiveMatches();
                                      showToast("Match scoring state reset successfully!", "success");
                                    } catch (err) {
                                      console.error(err);
                                      showToast("Failed to reset match.", "error");
                                    }
                                  }
                                );
                              }}
                              style={{
                                background: "rgba(239, 68, 68, 0.15)",
                                color: "#fca5a5",
                                border: "1px solid rgba(239, 68, 68, 0.2)"
                              }}
                            >
                              ⚠️ Reset
                            </button>
                          </div>
                        </div>

                        <div className="console-group">
                          <span className="console-group-label">Innings</span>
                          <div className="console-buttons">
                            <button className="btn-innings-break" onClick={() => updateAction(match.id, "inning-break")}>
                              End Innings 1
                            </button>
                            <button className="btn-force-second" onClick={() => updateAction(match.id, "second-innings")}>
                              Reset Innings 2
                            </button>
                            {match.currentInnings === 2 && (
                              <button
                                className="btn-pos active"
                                style={{
                                  background: "rgba(59, 130, 246, 0.15)",
                                  color: "#60a5fa",
                                  border: "1px solid rgba(59, 130, 246, 0.3)"
                                }}
                                onClick={() => updateAction(match.id, "return-innings-1")}
                              >
                                ↩️ Innings 1
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="console-group">
                          <span className="console-group-label">Players Setup</span>
                          <div className="active-player-inputs">
                            {(() => {
                              const battingTeamName = match.currentInnings === 1 ? firstBat : secondBat;
                              const bowlingTeamName = match.currentInnings === 1 ? secondBat : firstBat;

                              const batTeamObj = allTeams.find(t => t.teamName === battingTeamName);
                              const bowlTeamObj = allTeams.find(t => t.teamName === bowlingTeamName);

                              const battingPlayers = batTeamObj ? (playersMap[batTeamObj.id] || []) : [];
                              const bowlingPlayers = bowlTeamObj ? (playersMap[bowlTeamObj.id] || []) : [];

                              return (
                                <>
                                  <select
                                    id={`batsman-${match.id}`}
                                    key={match.currentBatsman}
                                    defaultValue={match.currentBatsman || ""}
                                    className="console-text-input"
                                  >
                                    <option value="">Striker</option>
                                    {battingPlayers.length > 0 && (
                                      <optgroup label={`${battingTeamName} (Batting)`}>
                                        {getSelectableBatsmen(battingPlayers, match, true).map(p => (
                                          <option key={p.id} value={p.playerName}>{p.playerName} ({p.role || "Player"})</option>
                                        ))}
                                      </optgroup>
                                    )}
                                  </select>

                                  <select
                                    id={`nonstriker-${match.id}`}
                                    key={match.currentNonStriker}
                                    defaultValue={match.currentNonStriker || ""}
                                    className="console-text-input"
                                  >
                                    <option value="">Non-Striker</option>
                                    {battingPlayers.length > 0 && (
                                      <optgroup label={`${battingTeamName} (Batting)`}>
                                        {getSelectableBatsmen(battingPlayers, match, false).map(p => (
                                          <option key={p.id} value={p.playerName}>{p.playerName} ({p.role || "Player"})</option>
                                        ))}
                                      </optgroup>
                                    )}
                                  </select>

                                  <select
                                    id={`bowler-${match.id}`}
                                    key={match.currentBowler}
                                    defaultValue={match.currentBowler || ""}
                                    className={`console-text-input ${isLocked ? "highlight-bowler-select" : ""}`}
                                  >
                                    <option value="">Bowler</option>
                                    {bowlingPlayers.length > 0 && (
                                      <optgroup label={`${bowlingTeamName} (Bowling)`}>
                                        {bowlingPlayers.map(p => {
                                          const oversCount = getBowlerOversCount(match.id, p.playerName);
                                          const isDisabled = isBowlerDisabled(match, p.playerName);
                                          const isLast = match.lastBowler && match.lastBowler.toLowerCase().trim() === p.playerName.toLowerCase().trim();
                                          
                                          let labelSuffix = `(${oversCount} ov)`;
                                          if (isLast) labelSuffix = `(Last - ${oversCount} ov)`;
                                          else if (oversCount >= 4.0) labelSuffix = `(Max 4 Overs)`;
                                          
                                          return (
                                            <option 
                                              key={p.id} 
                                              value={p.playerName}
                                              disabled={isDisabled}
                                              style={isDisabled ? { color: "var(--text-secondary)", opacity: 0.5 } : {}}
                                            >
                                              {p.playerName} {labelSuffix}
                                            </option>
                                          );
                                        })}
                                      </optgroup>
                                    )}
                                  </select>
                                </>
                              );
                            })()}
                            <button
                              className="btn-update-players"
                              onClick={() => {
                                const bVal = document.getElementById(`batsman-${match.id}`).value;
                                const nsVal = document.getElementById(`nonstriker-${match.id}`).value;
                                const boVal = document.getElementById(`bowler-${match.id}`).value;
                                updatePlayers(match.id, bVal, nsVal, boVal);
                              }}
                            >
                              Set
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Commentary Tab */}
                    {activePanelTab === 'commentary' && (
                      <div className="commentary-panel animate-fade-in">
                        <h4>Live ball-by-ball narratives</h4>
                        <div className="commentary-scroll">
                          {(!commentaryMap[match.id] || commentaryMap[match.id].length === 0) ? (
                            <p className="no-data">No commentary events logged yet. Play ball!</p>
                          ) : (
                            commentaryMap[match.id].map((comm) => (
                              <div key={comm.id} className="commentary-node">
                                <span className="comm-over">{comm.overBall} Overs</span>
                                <div className="comm-bubble">
                                  <span className={`comm-badge ${comm.event?.toLowerCase().replace(" ", "-")}`}>{comm.event}</span>
                                  <p className="comm-desc">{comm.description}</p>
                                </div>
                                {canWrite && (
                                  <button className="comm-delete-btn" onClick={() => handleDeleteCommentary(comm.id, match.id)}>
                                    🗑️
                                  </button>
                                )}
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    )}

                    {/* Chat Tab */}
                    {activePanelTab === 'chat' && (
                      <div className="chat-panel animate-fade-in">
                        <h4>Cheer Room & Fan Discussion</h4>
                        <div className="chat-scroll">
                          {(!chatMap[match.id] || chatMap[match.id].length === 0) ? (
                            <p className="no-data">No chats yet. Be the first to cheer!</p>
                          ) : (
                            chatMap[match.id].map((msg) => (
                              <div key={msg.id} className="chat-node">
                                <strong>{msg.username}</strong>
                                <div className="chat-bubble">
                                  {msg.message && <p>{msg.message}</p>}
                                  {msg.reactionEmoji && <span className="reaction-badge">{msg.reactionEmoji}</span>}
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                        
                        <div className="cheer-emoji-shelf">
                          {cheerEmojis.map((emoji) => (
                            <button key={emoji} type="button" onClick={() => submitChatMessage(null, match.id, "Sent reaction", emoji)}>
                              {emoji}
                            </button>
                          ))}
                        </div>

                        <form className="chat-input-form" onSubmit={(e) => submitChatMessage(e, match.id)}>
                          <input
                            type="text"
                            placeholder="Your Nickname"
                            value={chatUser}
                            onChange={(e) => {
                              setChatUser(e.target.value);
                              sessionStorage.setItem("username", e.target.value);
                            }}
                            className="chat-user-input"
                            required
                          />
                          <input
                            type="text"
                            placeholder="Cheer for your team!"
                            value={chatInputMap[match.id] || ""}
                            onChange={(e) => setChatInputMap((prev) => ({ ...prev, [match.id]: e.target.value }))}
                            className="chat-text-input"
                            required
                          />
                          <button type="submit" className="chat-send-btn">Send</button>
                        </form>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })()
        )}
      </div>

      {/* Dismissal Modal */}
      {showWicketModal && (
        <div className="msw-modal-overlay">
          <div className="msw-modal-content">
            <h3>Record Wicket Dismissal</h3>
            <p>Select specific dismissal details and fielder credit.</p>
            <div className="pp-form" style={{ maxWidth: "100%" }}>
              <label>
                Dismissal Type
                <select value={dismissalType} onChange={(e) => setDismissalType(e.target.value)}>
                  <option value="Bowled">Bowled</option>
                  <option value="Caught">Caught</option>
                  <option value="LBW">LBW</option>
                  <option value="Run Out">Run Out</option>
                  <option value="Stumped">Stumped</option>
                  <option value="Caught & Bowled">Caught & Bowled</option>
                  <option value="Retired Hurt">Retired Hurt</option>
                </select>
              </label>

              {["Caught", "Stumped", "Run Out"].includes(dismissalType) && (
                <label style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  Fielder Name (for catches/runouts/stumpings)
                  {(() => {
                    const fieldingPlayers = getFieldingPlayers();
                    if (fieldingPlayers.length > 0 && !isCustomFielder) {
                      return (
                        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                          <select
                            value={fielderName}
                            onChange={(e) => {
                              if (e.target.value === "__custom__") {
                                setIsCustomFielder(true);
                                setFielderName("");
                              } else {
                                setFielderName(e.target.value);
                              }
                            }}
                            style={{
                              width: "100%",
                              minHeight: "36px",
                              backgroundColor: "var(--input-bg)",
                              color: "#ffffff",
                              border: "1px solid var(--card-border)",
                              borderRadius: "8px",
                              padding: "0 10px",
                              fontSize: "12.5px"
                            }}
                          >
                            <option value="">Select Fielder</option>
                            {fieldingPlayers.map((p) => (
                              <option key={p.id} value={p.playerName}>
                                {p.playerName} ({p.role || "Player"})
                              </option>
                            ))}
                            <option value="__custom__">✏️ Enter Custom Name...</option>
                          </select>
                        </div>
                      );
                    } else {
                      return (
                        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                          <input
                            type="text"
                            placeholder="Enter fielder's name"
                            value={fielderName}
                            onChange={(e) => setFielderName(e.target.value)}
                            style={{
                              width: "100%",
                              minHeight: "36px",
                              backgroundColor: "var(--input-bg)",
                              color: "#ffffff",
                              border: "1px solid var(--card-border)",
                              borderRadius: "8px",
                              padding: "0 10px",
                              fontSize: "12.5px"
                            }}
                          />
                          {fieldingPlayers.length > 0 && (
                            <button
                              type="button"
                              onClick={() => {
                                setIsCustomFielder(false);
                                setFielderName("");
                              }}
                              style={{
                                alignSelf: "flex-end",
                                background: "none",
                                border: "none",
                                color: "#60a5fa",
                                cursor: "pointer",
                                fontSize: "11px",
                                textDecoration: "underline",
                                padding: 0
                              }}
                            >
                              Back to Player List
                            </button>
                          )}
                        </div>
                      );
                    }
                  })()}
                </label>
              )}

              <div className="msw-actions-row">
                <button className="msw-secondary-btn" onClick={() => setShowWicketModal(false)}>
                  Cancel
                </button>
                <button className="msw-primary-btn green-btn" onClick={submitWicketDetail}>
                  Confirm Out
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Scoreboard Quick Edit / Override Modal */}
      {isEditingScoreboard && (
        <div className="msw-modal-overlay">
          <div className="msw-modal-content" style={{ maxWidth: "580px" }}>
            <h3>Scoreboard Override Console</h3>
            <p style={{ color: "var(--warning)", fontWeight: "bold" }}>⚠️ Direct database overrides. Sync with official ground scorecard.</p>

            <form onSubmit={handleScoreboardOverrideSubmit} className="ls-override-form">
              <div className="ls-override-row">
                <label>
                  Team A Score
                  <input
                    type="number"
                    value={scoreboardForm.scoreA}
                    onChange={(e) => setScoreboardForm({ ...scoreboardForm, scoreA: parseInt(e.target.value) })}
                    required
                  />
                </label>

                <label>
                  Team B Score
                  <input
                    type="number"
                    value={scoreboardForm.scoreB}
                    onChange={(e) => setScoreboardForm({ ...scoreboardForm, scoreB: parseInt(e.target.value) })}
                    required
                  />
                </label>
              </div>

              <div className="ls-override-row">
                <label>
                  Wickets Out
                  <input
                    type="number"
                    value={scoreboardForm.wickets}
                    onChange={(e) => setScoreboardForm({ ...scoreboardForm, wickets: parseInt(e.target.value) })}
                    required
                  />
                </label>

                <label>
                  Overs Bowled
                  <input
                    type="number"
                    step="0.1"
                    value={scoreboardForm.overs}
                    onChange={(e) => setScoreboardForm({ ...scoreboardForm, overs: parseFloat(e.target.value) })}
                    required
                  />
                </label>
              </div>

              <div className="ls-override-row">
                <label>
                  Extras
                  <input
                    type="number"
                    value={scoreboardForm.extras}
                    onChange={(e) => setScoreboardForm({ ...scoreboardForm, extras: parseInt(e.target.value) })}
                    required
                  />
                </label>

                <label>
                  Target Score (2nd innings)
                  <input
                    type="number"
                    value={scoreboardForm.targetScore}
                    onChange={(e) => setScoreboardForm({ ...scoreboardForm, targetScore: parseInt(e.target.value) })}
                    required
                  />
                </label>
              </div>

              <div className="ls-override-row">
                <label>
                  Striker Name
                  <input
                    type="text"
                    value={scoreboardForm.currentBatsman}
                    onChange={(e) => setScoreboardForm({ ...scoreboardForm, currentBatsman: e.target.value })}
                  />
                </label>

                <label>
                  Striker Runs
                  <input
                    type="number"
                    value={scoreboardForm.batsmanRuns}
                    onChange={(e) => setScoreboardForm({ ...scoreboardForm, batsmanRuns: parseInt(e.target.value) })}
                  />
                </label>

                <label>
                  Striker Balls
                  <input
                    type="number"
                    value={scoreboardForm.batsmanBalls}
                    onChange={(e) => setScoreboardForm({ ...scoreboardForm, batsmanBalls: parseInt(e.target.value) })}
                  />
                </label>
              </div>

              <div className="ls-override-row">
                <label>
                  Non-Striker Name
                  <input
                    type="text"
                    value={scoreboardForm.currentNonStriker}
                    onChange={(e) => setScoreboardForm({ ...scoreboardForm, currentNonStriker: e.target.value })}
                  />
                </label>

                <label>
                  Non-Striker Runs
                  <input
                    type="number"
                    value={scoreboardForm.nonStrikerRuns}
                    onChange={(e) => setScoreboardForm({ ...scoreboardForm, nonStrikerRuns: parseInt(e.target.value) })}
                  />
                </label>

                <label>
                  Non-Striker Balls
                  <input
                    type="number"
                    value={scoreboardForm.nonStrikerBalls}
                    onChange={(e) => setScoreboardForm({ ...scoreboardForm, nonStrikerBalls: parseInt(e.target.value) })}
                  />
                </label>
              </div>

              <div className="ls-override-row">
                <label>
                  Active Bowler Name
                  <input
                    type="text"
                    value={scoreboardForm.currentBowler}
                    onChange={(e) => setScoreboardForm({ ...scoreboardForm, currentBowler: e.target.value })}
                  />
                </label>

                <label>
                  Bowler Wickets
                  <input
                    type="number"
                    value={scoreboardForm.bowlerWickets}
                    onChange={(e) => setScoreboardForm({ ...scoreboardForm, bowlerWickets: parseInt(e.target.value) })}
                  />
                </label>

                <label>
                  Current Innings (1 or 2)
                  <input
                    type="number"
                    value={scoreboardForm.currentInnings}
                    onChange={(e) => setScoreboardForm({ ...scoreboardForm, currentInnings: parseInt(e.target.value) })}
                  />
                </label>
              </div>

              <div className="msw-actions-row" style={{ marginTop: "20px" }}>
                <button 
                  type="button" 
                  className="msw-secondary-btn" 
                  onClick={() => setIsEditingScoreboard(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="msw-primary-btn" 
                  style={{ background: "#f59e0b" }}
                >
                  Confirm Override
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* Toss Setup Modal */}
      {showTossModal && (
        <div className="msw-modal-overlay">
          <div className="msw-modal-content" style={{ maxWidth: "400px" }}>
            <h3>Configure Match Toss</h3>
            <p>Setup which team won the toss and what they elected to do.</p>
            {(() => {
              const activeMatch = matches.find(m => m.id === activeMatchId);
              if (!activeMatch) return null;
              return (
                <div className="pp-form" style={{ maxWidth: "100%" }}>
                  <label>
                    Toss Winner
                    <select value={tossWinner} onChange={(e) => setTossWinner(e.target.value)}>
                      <option value={activeMatch.teamA}>{activeMatch.teamA}</option>
                      <option value={activeMatch.teamB}>{activeMatch.teamB}</option>
                    </select>
                  </label>

                  <label style={{ marginTop: "12px" }}>
                    Toss Decision
                    <select value={tossDecision} onChange={(e) => setTossDecision(e.target.value)}>
                      <option value="BAT">Bat First</option>
                      <option value="BOWL">Bowl First</option>
                    </select>
                  </label>

                  <div className="msw-actions-row" style={{ marginTop: "24px" }}>
                    <button className="msw-secondary-btn" onClick={() => setShowTossModal(false)}>
                      Cancel
                    </button>
                    <button className="msw-primary-btn" style={{ background: "var(--primary)" }} onClick={submitTossSetup}>
                      Save Toss Setup
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* Custom Confirmation Modal */}
      {showConfirmModal && (
        <div className="custom-premium-modal-overlay">
          <div className="custom-premium-modal-card">
            <div className="modal-3d-glow"></div>
            <div className="modal-header-icon">⚠️</div>
            <h3>{confirmModalConfig.title}</h3>
            <p>{confirmModalConfig.message}</p>
            <div className="modal-actions">
              <button 
                className="modal-btn-cancel" 
                onClick={() => setShowConfirmModal(false)}
              >
                Cancel
              </button>
              <button 
                className="modal-btn-confirm" 
                style={{ background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)", boxShadow: "0 4px 12px rgba(239, 68, 68, 0.3)" }}
                onClick={confirmModalConfig.onConfirm}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Toast Notification Banner Container */}
      <div className="toast-container">
        {toasts.map((toast) => (
          <div key={toast.id} className={`in-app-toast ${toast.type}`}>
            <span>{toast.text}</span>
            <button className="toast-close-btn" onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}>
              &times;
            </button>
          </div>
        ))}
      </div>

      {/* Global Full Screen 3D Event Animation Overlay */}
      {eventAnimation && (
        <div className="event-3d-overlay animate-3d-pop">
          <div className="event-3d-text" data-text={eventAnimation.type}>
            {eventAnimation.type}
          </div>
        </div>
      )}

      {/* Stadium Presentation Mode Overlay */}
      {(() => {
        const activePresMatch = presentationMatch ? matches.find(m => m.id === presentationMatch.id) : null;
        if (!activePresMatch) return null;
        
        const stats = getCricketStats(activePresMatch);
        const { firstBat, secondBat } = getBattingOrder(activePresMatch);
        
        return (
          <div className="presentation-overlay">
            <div className="presentation-header">
              <div>
                <span className="section-label">{activePresMatch.tournament?.name || "Tournament"}</span>
                <h2>{activePresMatch.round || "Match"} - Live Stadium Center</h2>
              </div>
              <button className="btn-exit-presentation" onClick={() => setPresentationMatch(null)}>
                ✕ Close Full Screen
              </button>
            </div>

            <div className="presentation-content">
              <div className="pres-scoreboard">
                <div className={`pres-team-box ${activePresMatch.currentInnings === 1 ? "batting-active" : ""}`}>
                  <div className="team-badge-circle pres-team-badge badge-team-a">
                    {getTeamInitials(firstBat)}
                  </div>
                  <div className="pres-team-name">
                    {firstBat}
                    {activePresMatch.tossWinner === firstBat && <span className="toss-winner-coin" title="Toss Winner">🪙</span>}
                    {activePresMatch.currentInnings === 1 && <span className="batting-dot"></span>}
                  </div>
                  <div className="pres-score">
                    {activePresMatch.scoreA ?? 0}
                    {activePresMatch.currentInnings === 1 && <span className="pres-score-wickets">/{activePresMatch.wickets ?? 0}</span>}
                  </div>
                  <p className="pres-overs">
                    {activePresMatch.currentInnings === 1 ? `Overs: ${activePresMatch.overs ?? "0.0"}` : "Innings 1 Completed"}
                  </p>
                </div>

                <div className="pres-vs">
                  <FaGamepad />
                  <span>VS</span>
                </div>

                <div className={`pres-team-box ${activePresMatch.currentInnings === 2 ? "batting-active" : ""}`}>
                  <div className="team-badge-circle pres-team-badge badge-team-b">
                    {getTeamInitials(secondBat)}
                  </div>
                  <div className="pres-team-name">
                    {secondBat}
                    {activePresMatch.tossWinner === secondBat && <span className="toss-winner-coin" title="Toss Winner">🪙</span>}
                    {activePresMatch.currentInnings === 2 && <span className="batting-dot"></span>}
                  </div>
                  <div className="pres-score">
                    {activePresMatch.scoreB ?? 0}
                    {activePresMatch.currentInnings === 2 && <span className="pres-score-wickets">/{activePresMatch.wickets ?? 0}</span>}
                  </div>
                  <p className="pres-overs">
                    {activePresMatch.currentInnings === 2 ? `Overs: ${activePresMatch.overs ?? "0.0"}` : "Yet to bat"}
                  </p>
                </div>
              </div>

              <div className="pres-players-stats">
                <div className="pres-active-players">
                  <div className="player-role-stat batsman-stat-item active-striker-stat pres-player-card">
                    <span className="player-role-badge batsman-badge">Striker</span>
                    <span className="player-active-name">
                      <span className="bat-icon-glow">🏏</span> {activePresMatch.currentBatsman || "Striker"}
                    </span>
                    <span className="player-stats-numbers">
                      <strong>{activePresMatch.batsmanRuns ?? 0}</strong> <span className="balls-count">({activePresMatch.batsmanBalls ?? 0}b)</span>
                    </span>
                  </div>
                  <div className="player-role-stat batsman-stat-item pres-player-card">
                    <span className="player-role-badge batsman-badge non-striker-badge">Non-Striker</span>
                    <span className="player-active-name">{activePresMatch.currentNonStriker || "Non-Striker"}</span>
                    <span className="player-stats-numbers">
                      <strong>{activePresMatch.nonStrikerRuns ?? 0}</strong> <span className="balls-count">({activePresMatch.nonStrikerBalls ?? 0}b)</span>
                    </span>
                  </div>
                  <div className="player-role-stat bowler-stat-item pres-player-card">
                    <span className="player-role-badge bowler-badge">Bowler</span>
                    <span className="player-active-name">{activePresMatch.currentBowler || "Bowler"}</span>
                    <span className="player-stats-numbers font-gold">
                      <strong>{activePresMatch.bowlerWickets ?? 0}</strong> <span className="wicket-lbl">Wkts</span> <span className="overs-count">({getBowlerOversCount(activePresMatch.id, activePresMatch.currentBowler)} ov)</span>
                    </span>
                  </div>
                </div>

                <div className="stats-metric pres-over-review">
                  <span className="over-review-title" style={{ display: "block", marginBottom: "8px" }}>This Over</span>
                  <div className="over-review-balls" style={{ justifyContent: "center" }}>
                    {commentaryMap[activePresMatch.id] && getCurrentOverBalls(activePresMatch, commentaryMap[activePresMatch.id]).map((ball, idx) => {
                      const val = getBallDisplay(ball.event);
                      return (
                        <span 
                          key={`${ball.id}-${idx}`} 
                          className={`over-ball-bubble ball-${val.toLowerCase()}`}
                          title={`${ball.overBall} Overs: ${ball.description}`}
                        >
                          {val}
                        </span>
                      );
                    })}
                    {(!commentaryMap[activePresMatch.id] || getCurrentOverBalls(activePresMatch, commentaryMap[activePresMatch.id]).length === 0) && (
                      <span className="over-ball-empty">Waiting...</span>
                    )}
                  </div>
                </div>
              </div>

              {stats && stats.runsNeeded !== null && (
                <div className="scorecard-chase-banner pres-chase-banner">
                  {stats.runsNeeded > 0 ? (
                    <>
                      <span>Target Score: <strong>{activePresMatch.targetScore}</strong></span>
                      <span>Need <strong>{stats.runsNeeded}</strong> runs from <strong>{stats.ballsRemaining}</strong> balls</span>
                    </>
                  ) : (
                    <span className="chase-completed" style={{ fontSize: "22px" }}>Target Chased! 🏆</span>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })()}
    </div>
  );
}

export default LiveScorePage;

