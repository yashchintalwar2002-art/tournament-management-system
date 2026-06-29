import React, { useEffect, useState } from "react";
import API from "../../services/api";

function JoinTournament() {

  const [tournaments, setTournaments] = useState([]);

  const [formData, setFormData] = useState({
    teamName: "",
    captainName: "",
    contactEmail: "",
    tournamentId: ""
  });

  useEffect(() => {
    fetchTournaments();
  }, []);

  const fetchTournaments = async () => {
    try {
      const res = await API.get("/tournaments");
      setTournaments(res.data);
    } catch (err) {
      console.log(err);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const joinTournament = async (e) => {
    e.preventDefault();

    try {

      await API.post("/teams", {
        teamName: formData.teamName,
        captainName: formData.captainName,
        contactEmail: formData.contactEmail,

        tournament: {
          id: formData.tournamentId
        }
      });

      alert("Team Joined Successfully");

    } catch (err) {
      console.log(err);
      alert("Error");
    }
  };

  return (
    <div className="container mt-5">

      <h2>Join Tournament</h2>

      <form onSubmit={joinTournament}>

        <input
          type="text"
          name="teamName"
          placeholder="Team Name"
          className="form-control mb-3"
          onChange={handleChange}
        />

        <input
          type="text"
          name="captainName"
          placeholder="Captain Name"
          className="form-control mb-3"
          onChange={handleChange}
        />

        <input
          type="email"
          name="contactEmail"
          placeholder="Contact Email"
          className="form-control mb-3"
          onChange={handleChange}
        />

        <select
          name="tournamentId"
          className="form-control mb-3"
          onChange={handleChange}
        >

          <option>Select Tournament</option>

          {tournaments.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}

        </select>

        <button className="btn btn-primary">
          Join Tournament
        </button>

      </form>
    </div>
  );
}

export default JoinTournament;