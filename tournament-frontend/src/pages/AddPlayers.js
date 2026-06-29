import React, { useEffect, useState } from "react";
import API from "../services/api";

function AddPlayers() {
  const [teams, setTeams] = useState([]);
  const [teamId, setTeamId] = useState("");

  const [playerName, setPlayerName] = useState("");
  const [role, setRole] = useState("");
  const [jerseyNumber, setJerseyNumber] = useState("");

  const [players, setPlayers] = useState([]);

  useEffect(() => {
    loadTeams();
  }, []);

  const loadTeams = async () => {
    const res = await API.get("/teams");
    setTeams(res.data.filter((team) => team.status === "APPROVED" && team.tournament));
  };

  const loadPlayers = async (id) => {
    const res = await API.get(
      `/players/team/${id}`
    );
    setPlayers(res.data);
  };

  const addPlayer = async () => {
    if (!teamId) {
      alert("Select team");
      return;
    }

    await API.post(
      `/players/add/${teamId}`,
      {
        playerName,
        role,
        jerseyNumber,
      }
    );

    setPlayerName("");
    setRole("");
    setJerseyNumber("");

    loadPlayers(teamId);
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>Add Players</h2>

      <select
        value={teamId}
        onChange={(e) => {
          setTeamId(e.target.value);
          loadPlayers(e.target.value);
        }}
      >
        <option value="">Select Team</option>

        {teams.map((team) => (
          <option
            key={team.id}
            value={team.id}
          >
            {team.teamName}
          </option>
        ))}
      </select>

      <br />
      <br />

      <input
        placeholder="Player Name"
        value={playerName}
        onChange={(e) =>
          setPlayerName(e.target.value)
        }
      />

      <br />
      <br />

      <input
        placeholder="Role"
        value={role}
        onChange={(e) =>
          setRole(e.target.value)
        }
      />

      <br />
      <br />

      <input
        placeholder="Jersey Number"
        value={jerseyNumber}
        onChange={(e) =>
          setJerseyNumber(e.target.value)
        }
      />

      <br />
      <br />

      <button onClick={addPlayer}>
        Add Player
      </button>

      <hr />

      <h3>Team Players</h3>

      {players.map((player) => (
        <div key={player.id}>
          {player.playerName} - {player.role} #
          {player.jerseyNumber}
        </div>
      ))}
    </div>
  );
}

export default AddPlayers;