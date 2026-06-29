import React, { useState, useEffect, useRef } from "react";
import { FaRobot, FaPaperPlane, FaLightbulb, FaShieldAlt, FaTrophy, FaChevronRight } from "react-icons/fa";
import "./AICoach.css";

const PRESETS = [
  { id: "batting", label: "Optimize Chennai Batting Order", query: "Can you analyze Chennai's batting stats and optimize their lineup for the final match?" },
  { id: "spin", label: "Counter Spin Strategy", query: "What is the best tactical approach to counter Mumbai's spin bowlers on a dry pitch?" },
  { id: "weather", label: "Weather & Pitch Impact", query: "How will overcast conditions and a damp outfield impact bowling tactics in today's match?" }
];

const RESPONSES = {
  batting: `### 🏏 Chennai Optimized Batting Order Analysis

Based on current season statistics and player form, here is the suggested optimal lineup:

1. **Ruturaj Gaikwad (Anchor / Opener)**: Matches the highest power-hitting rating (92) with a strong control index. Perfect to anchor the powerplay.
2. **Devon Conway (Stroke Maker)**: Provides a left-hand/right-hand opening combination to disrupt bowlers' line and length.
3. **Shivam Dube (Spin Basher)**: Positioned at 3 to capitalize on middle-overs spin matchups. Strong aerial hit rate.
4. **Ajinkya Rahane (Pace Accumulator)**: Solid defensive profile. Ideal shield if early wickets fall.
5. **MS Dhoni (Finisher / Captain)**: 95 OVR Rating. Keep in reserve for the final 4 overs to secure maximum boundary conversion.

*💡 Tactical Tip:* Maintain a left-right combination to force Mumbai to constantly alter field setups.`,
  
  spin: `### 🌀 Countering Spin Bowlers on Dry Pitches

A dry pitch will offer significant turn and grip. Here is the AI tactical checklist to counter spin:

* **Footwork Aggression:** Encourage batsmen to use their feet to reach the pitch of the ball, preventing spin from developing off the surface.
* **Sweep Shots:** Utilize sweep and reverse-sweep variations to disperse the close-in fielder grid (silly point, short leg).
* **Target Short Boundary:** Mumbai's spinners tend to bowl flatter. Exploit the shorter leg-side boundary using horizontal bat sweeps.
* **Rotate Strike:** Limit dot ball pressure by dropping soft-hands singles into the vacant cover areas.

*🛡️ Key Batter:* Shivam Dube has a spin strike rate of **152.4%** this season and is your primary weapon against spin.`,

  weather: `### 🌧️ Overcast & Damp Outfield Tactical Guide

Overcast conditions introduce swing, and a damp outfield slows boundary runs. Adjust your tactics as follows:

1. **Bowlers - Pitch Up:** Instruct swing bowlers (e.g. Deepak Chahar) to bowl full, searching for early lateral movement through the air.
2. **Avoid Spin Early:** A damp ball is difficult to grip. Restrict spinners to the middle overs once the ball dry-cloth routines are established.
3. **Batsmen - Play Straight:** Swing is most lethal in the first 6 overs. Play with a straight bat face and avoid cross-batted hooks.
4. **Fielding Hustle:** A damp outfield makes diving risky but stops boundaries. Prioritize sliding blocks and backup throws.

*🏆 Winning Choice:* If you win the toss, **Fielding First** is highly recommended as the dampness will dry up, making chasing easier under lights.`
};

export default function AICoach() {
  const [messages, setMessages] = useState([
    {
      id: "welcome",
      sender: "bot",
      text: "Hello! I am your AI Tactical Commentator. Ask me about batting orders, counter strategies, or pitch analysis."
    }
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleSend = (textToSend) => {
    if (!textToSend.trim()) return;

    // Add user message
    const userMsg = { id: Date.now().toString(), sender: "user", text: textToSend };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    // Simulate bot response
    setTimeout(() => {
      let botText = "I have analyzed your query. To get the best tactical setup, please select one of the pre-configured prompt chips above.";
      
      // Match queries to presets
      const lower = textToSend.toLowerCase();
      if (lower.includes("batting") || lower.includes("lineup")) {
        botText = RESPONSES.batting;
      } else if (lower.includes("spin") || lower.includes("spinner")) {
        botText = RESPONSES.spin;
      } else if (lower.includes("weather") || lower.includes("pitch")) {
        botText = RESPONSES.weather;
      }

      const botMsg = { id: (Date.now() + 1).toString(), sender: "bot", text: botText };
      setMessages(prev => [...prev, botMsg]);
      setIsTyping(false);
    }, 1500);
  };

  return (
    <div className="ai-coach-container">
      <div className="ai-coach-header">
        <FaRobot className="ai-robot-icon animate-pulse" />
        <div>
          <h1>AI Tactical Coach</h1>
          <p className="subtitle">Real-time match predictions, strategy sheets, and roster optimization advice</p>
        </div>
      </div>

      <div className="ai-coach-grid">
        {/* Preset Prompt Cards */}
        <div className="presets-panel">
          <h3>Quick Strategy Templates</h3>
          <div className="presets-list">
            {PRESETS.map(p => (
              <button key={p.id} onClick={() => handleSend(p.query)} className="preset-card glass-panel">
                <div className="pc-left">
                  {p.id === "batting" && <FaTrophy className="p-icon color-yellow" />}
                  {p.id === "spin" && <FaShieldAlt className="p-icon color-blue" />}
                  {p.id === "weather" && <FaLightbulb className="p-icon color-cyan" />}
                  <span>{p.label}</span>
                </div>
                <FaChevronRight className="arrow-icon" />
              </button>
            ))}
          </div>

          <div className="ai-stats-card glass-panel">
            <h4>Tactical Engine Status</h4>
            <div className="stats-row">
              <span>Model Accuracy</span>
              <span className="val text-cyan">94.8%</span>
            </div>
            <div className="stats-row">
              <span>Database Sync</span>
              <span className="val text-green">LIVE</span>
            </div>
            <div className="stats-row">
              <span>Active Parameters</span>
              <span className="val">1,240 runs/sec</span>
            </div>
          </div>
        </div>

        {/* Chat Interface */}
        <div className="ai-chat-panel glass-panel">
          <div className="chat-messages-container">
            {messages.map(msg => (
              <div key={msg.id} className={`message-bubble ${msg.sender}`}>
                <div className="avatar">
                  {msg.sender === "bot" ? <FaRobot /> : "U"}
                </div>
                <div className="message-content">
                  {msg.sender === "bot" ? (
                    // Simple markdown-style renderer
                    <div className="markdown-render">
                      {msg.text.split("\n").map((line, idx) => {
                        if (line.startsWith("###")) {
                          return <h4 key={idx}>{line.replace("###", "")}</h4>;
                        }
                        if (line.startsWith("* ")) {
                          return <li key={idx}>{line.replace("* ", "")}</li>;
                        }
                        if (line.startsWith("1.") || line.startsWith("2.") || line.startsWith("3.") || line.startsWith("4.") || line.startsWith("5.")) {
                          return <p key={idx} className="ordered-line">{line}</p>;
                        }
                        return <p key={idx}>{line}</p>;
                      })}
                    </div>
                  ) : (
                    <p>{msg.text}</p>
                  )}
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="message-bubble bot typing">
                <div className="avatar"><FaRobot /></div>
                <div className="message-content">
                  <span className="dot"></span>
                  <span className="dot"></span>
                  <span className="dot"></span>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input Box */}
          <div className="chat-input-bar">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend(input)}
              placeholder="Ask AI Coach (e.g. Optimize batting lineup)..."
            />
            <button onClick={() => handleSend(input)} className="send-btn">
              <FaPaperPlane />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
