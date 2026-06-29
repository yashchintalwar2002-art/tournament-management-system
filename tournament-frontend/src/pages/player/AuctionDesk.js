import React, { useState, useEffect } from "react";
import { FaGavel, FaClock, FaHistory, FaCheckCircle, FaExclamationTriangle, FaDollarSign } from "react-icons/fa";
import "./AuctionDesk.css";

const INITIAL_PLAYERS = [
  { id: 1, name: "Ruturaj Gaikwad", role: "Batsman", rating: 92, basePrice: 50, currentPrice: 50, status: "Available" },
  { id: 2, name: "MS Dhoni", role: "Wicketkeeper", rating: 95, basePrice: 100, currentPrice: 100, status: "Available" },
  { id: 3, name: "Virat Kohli", role: "Batsman", rating: 96, basePrice: 150, currentPrice: 150, status: "Available" },
  { id: 4, name: "Jasprit Bumrah", role: "Bowler", rating: 95, basePrice: 120, currentPrice: 120, status: "Available" },
  { id: 5, name: "Rashid Khan", role: "Bowler", rating: 93, basePrice: 80, currentPrice: 80, status: "Available" },
  { id: 6, name: "Glenn Maxwell", role: "All-Rounder", rating: 91, basePrice: 70, currentPrice: 70, status: "Available" },
  { id: 7, name: "Ravindra Jadeja", role: "All-Rounder", rating: 94, basePrice: 100, currentPrice: 100, status: "Available" }
];

const FRANCHISES = [
  { id: "CSK", name: "Chennai Kings", budget: 1000, spent: 0, color: "#eab308" },
  { id: "MI", name: "Mumbai Titans", budget: 1000, spent: 0, color: "#0ea5e9" },
  { id: "RCB", name: "Bengaluru Bulls", budget: 1000, spent: 0, color: "#ef4444" },
  { id: "DC", name: "Delhi Devils", budget: 1000, spent: 0, color: "#f97316" }
];

export default function AuctionDesk() {
  const [players, setPlayers] = useState(INITIAL_PLAYERS);
  const [franchises, setFranchises] = useState(FRANCHISES);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [currentBid, setCurrentBid] = useState(50);
  const [lastBiddingTeam, setLastBiddingTeam] = useState(null);
  const [timeLeft, setTimeLeft] = useState(15);
  const [isLive, setIsLive] = useState(false);
  const [bidHistory, setBidHistory] = useState([]);
  const [soldPlayers, setSoldPlayers] = useState([]);
  const [activeBidder, setActiveBidder] = useState("CSK");

  const currentPlayer = players[currentPlayerIndex];

  // Timer simulation
  useEffect(() => {
    let timer;
    if (isLive && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isLive) {
      handleSold();
    }
    return () => clearInterval(timer);
  }, [timeLeft, isLive]);

  // Simulated Bidding War (Auto-bids)
  useEffect(() => {
    let botTimer;
    if (isLive && timeLeft > 5 && Math.random() > 0.6) {
      botTimer = setTimeout(() => {
        // Pick a random team that isn't the last bidder and has enough budget
        const remainingTeams = franchises.filter(
          (f) => f.id !== lastBiddingTeam && f.budget - f.spent > currentBid + 10
        );
        if (remainingTeams.length > 0) {
          const randomTeam = remainingTeams[Math.floor(Math.random() * remainingTeams.length)];
          botBid(randomTeam.id);
        }
      }, 3000 + Math.random() * 3000);
    }
    return () => clearTimeout(botTimer);
  }, [timeLeft, isLive, currentBid, lastBiddingTeam]);

  // Reset bidding state for next player
  const loadPlayer = (index) => {
    if (index >= players.length) return;
    setCurrentPlayerIndex(index);
    setCurrentBid(players[index].basePrice);
    setLastBiddingTeam(null);
    setTimeLeft(15);
    setBidHistory([]);
  };

  const botBid = (teamId) => {
    const increment = currentBid >= 100 ? 20 : 10;
    const nextBid = currentBid + increment;
    
    // Check budget
    const team = franchises.find(f => f.id === teamId);
    if (team.budget - team.spent < nextBid) return;

    setCurrentBid(nextBid);
    setLastBiddingTeam(teamId);
    setTimeLeft(15); // reset timer

    const newLog = {
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      team: team.name,
      amount: nextBid
    };
    setBidHistory(prev => [newLog, ...prev]);
  };

  const handlePlaceBid = () => {
    const increment = currentBid >= 100 ? 20 : 10;
    const nextBid = currentBid + increment;
    
    // Manual bid placed by activeBidder
    const team = franchises.find(f => f.id === activeBidder);
    if (team.budget - team.spent < nextBid) {
      alert("Insufficient franchise budget!");
      return;
    }

    setCurrentBid(nextBid);
    setLastBiddingTeam(activeBidder);
    setTimeLeft(15);

    const newLog = {
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      team: team.name,
      amount: nextBid
    };
    setBidHistory(prev => [newLog, ...prev]);
  };

  const handleSold = () => {
    if (!currentPlayer) return;

    if (lastBiddingTeam) {
      // Mark as sold to last bidding team
      const buyer = franchises.find(f => f.id === lastBiddingTeam);
      
      setFranchises(prev => prev.map(f => {
        if (f.id === lastBiddingTeam) {
          return { ...f, spent: f.spent + currentBid };
        }
        return f;
      }));

      const soldItem = {
        player: currentPlayer.name,
        role: currentPlayer.role,
        price: currentBid,
        teamName: buyer.name,
        color: buyer.color
      };
      setSoldPlayers(prev => [soldItem, ...prev]);
      
      // Update player list status
      setPlayers(prev => prev.map((p, idx) => {
        if (idx === currentPlayerIndex) {
          return { ...p, status: `Sold to ${buyer.name} (${currentBid}L)` };
        }
        return p;
      }));
    } else {
      // Unsold
      setPlayers(prev => prev.map((p, idx) => {
        if (idx === currentPlayerIndex) {
          return { ...p, status: "Unsold" };
        }
        return p;
      }));
    }

    // Go to next player
    if (currentPlayerIndex + 1 < players.length) {
      loadPlayer(currentPlayerIndex + 1);
    } else {
      setIsLive(false);
      alert("Player auction pool completed!");
    }
  };

  const toggleLive = () => {
    setIsLive(!isLive);
  };

  return (
    <div className="auction-desk-container">
      <div className="auction-header">
        <div className="ah-left">
          <FaGavel className="gavel-icon" />
          <div>
            <h1>IPL Live Player Auction</h1>
            <p className="subtitle">Premium Real-Time Franchise Bidding Console</p>
          </div>
        </div>
        <button onClick={toggleLive} className={`live-btn ${isLive ? "active" : ""}`}>
          {isLive ? "PAUSE BIDDING" : "START LIVE AUCTION"}
        </button>
      </div>

      <div className="auction-grid">
        {/* Left Side: Current Bidding Card */}
        <div className="auction-card-panel">
          {currentPlayer ? (
            <div className="player-auction-card">
              <div className="pac-header">
                <span className="role-tag">{currentPlayer.role.toUpperCase()}</span>
                <span className="rating-badge">{currentPlayer.rating} OVR</span>
              </div>
              <div className="pac-avatar-placeholder">
                <FaGavel size={60} color="#38bdf8" />
              </div>
              <h2>{currentPlayer.name}</h2>
              <div className="pac-details">
                <div className="p-detail">
                  <span className="p-label">BASE PRICE</span>
                  <span className="p-val">{currentPlayer.basePrice} LAKH</span>
                </div>
                <div className="p-detail">
                  <span className="p-label">STATUS</span>
                  <span className={`p-val status ${currentPlayer.status.toLowerCase()}`}>
                    {currentPlayer.status}
                  </span>
                </div>
              </div>

              {/* Bidding Display */}
              <div className="bid-price-display">
                <span className="bid-label">CURRENT BID</span>
                <span className="bid-amount">{currentBid} LAKH</span>
                {lastBiddingTeam && (
                  <span className="bidder-team">
                    Bidding Team: {franchises.find(f => f.id === lastBiddingTeam)?.name}
                  </span>
                )}
              </div>

              {/* Timer Bar */}
              <div className="timer-wrapper">
                <div className="timer-header">
                  <FaClock /> Timer Remaining: {timeLeft}s
                </div>
                <div className="timer-track">
                  <div className="timer-progress" style={{ width: `${(timeLeft / 15) * 100}%` }}></div>
                </div>
              </div>

              {/* Bidding Action Controls */}
              <div className="bid-controls">
                <div className="control-group">
                  <label>Select Your Franchise</label>
                  <select value={activeBidder} onChange={(e) => setActiveBidder(e.target.value)}>
                    {franchises.map((f) => (
                      <option key={f.id} value={f.id}>{f.name}</option>
                    ))}
                  </select>
                </div>
                <div className="btn-actions-grid">
                  <button disabled={!isLive} onClick={handlePlaceBid} className="place-bid-btn">
                    Place Bid (+{currentBid >= 100 ? "20L" : "10L"})
                  </button>
                  <button disabled={!isLive} onClick={handleSold} className="sold-btn">
                    Mark Sold / Pass
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="no-players-card">
              <FaCheckCircle size={50} color="#22c55e" />
              <h3>Auction Completed</h3>
              <p>All players from the draft pool have been processed.</p>
            </div>
          )}
        </div>

        {/* Right Side: Logs & Budget Ledger */}
        <div className="auction-stats-panel">
          {/* Budget Ledger */}
          <div className="glass-panel budget-ledger">
            <h3>Franchise Budgets</h3>
            <div className="ledger-grid">
              {franchises.map((f) => {
                const remaining = f.budget - f.spent;
                const progress = (remaining / f.budget) * 100;
                return (
                  <div key={f.id} className="ledger-item" style={{ "--neon-color": f.color }}>
                    <div className="item-labels">
                      <span className="team-n">{f.name}</span>
                      <span className="budget-rem">{remaining}L / {f.budget}L</span>
                    </div>
                    <div className="ledger-bar">
                      <div className="ledger-fill" style={{ width: `${progress}%`, backgroundColor: f.color }}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Real-time Bid History Logs */}
          <div className="glass-panel bid-history-panel">
            <h3><FaHistory /> Bidding Log</h3>
            <div className="history-logs-list">
              {bidHistory.length > 0 ? (
                bidHistory.map((log, idx) => (
                  <div key={idx} className="log-row">
                    <span className="log-time">{log.time}</span>
                    <span className="log-team">{log.team}</span>
                    <span className="log-amt">{log.amount}L</span>
                  </div>
                ))
              ) : (
                <div className="empty-logs">No bids placed yet. Start live bidding to view logs.</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Draft Board Grid */}
      <div className="draft-board-panel glass-panel">
        <h2>Draft Board (Sold Players)</h2>
        <div className="draft-board-grid">
          {soldPlayers.length > 0 ? (
            soldPlayers.map((item, idx) => (
              <div key={idx} className="drafted-card" style={{ borderLeft: `4px solid ${item.color}` }}>
                <h4>{item.player}</h4>
                <div className="draft-sub">
                  <span>{item.role}</span>
                  <span className="sold-price" style={{ color: item.color }}>{item.price} LAKH</span>
                </div>
                <p className="buyer-tag" style={{ color: item.color }}>{item.teamName}</p>
              </div>
            ))
          ) : (
            <div className="empty-draft">No players drafted yet. Bids won will appear here.</div>
          )}
        </div>
      </div>
    </div>
  );
}
