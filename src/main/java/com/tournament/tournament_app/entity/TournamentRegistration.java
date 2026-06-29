package com.tournament.tournament_app.entity;

import jakarta.persistence.*;

@Entity
public class TournamentRegistration {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String playerEmail;

    @ManyToOne
    @JoinColumn(name = "tournament_id")
    private Tournament tournament;

    // GETTERS
    public Long getId() {
        return id;
    }

    public String getPlayerEmail() {
        return playerEmail;
    }

    public Tournament getTournament() {
        return tournament;
    }

    // SETTERS
    public void setId(Long id) {
        this.id = id;
    }

    public void setPlayerEmail(String playerEmail) {
        this.playerEmail = playerEmail;
    }

    public void setTournament(Tournament tournament) {
        this.tournament = tournament;
    }

    public void setTournament1(Team tournament) {
        throw new UnsupportedOperationException("Not supported yet.");
    }

    public void setTournament(Team tournament) {
        throw new UnsupportedOperationException("Not supported yet.");
    }
}