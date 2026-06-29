package com.tournament.tournament_app.entity;

import jakarta.persistence.*;

@Entity
public class Tournament {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    private String game;
    private int maxPlayers;

    private String logo = "";
    private String organizer = "";
    private String description = "";
    private String city = "";
    private String ground = "";
    private String startDate = "";
    private String endDate = "";
    private String format = "T20";
    private String structure = "LEAGUE";
    private Double entryFee = 0.0;
    private Integer maxTeams = 16;
    private Integer overs = 20;
    private Integer pointsForWin = 2;
    private Integer powerplayOvers = 6;
    private Boolean superOver = false;

    private String createdBy = "";
    private String collaborators = "";

    // getters
    public Long getId() { return id; }
    public String getName() { return name; }
    public String getGame() { return game; }
    public int getMaxPlayers() { return maxPlayers; }

    public String getLogo() { return logo; }
    public String getOrganizer() { return organizer; }
    public String getDescription() { return description; }
    public String getCity() { return city; }
    public String getGround() { return ground; }
    public String getStartDate() { return startDate; }
    public String getEndDate() { return endDate; }
    public String getFormat() { return format; }
    public String getStructure() { return structure; }
    public Double getEntryFee() { return entryFee; }
    public Integer getMaxTeams() { return maxTeams; }
    public Integer getOvers() { return overs; }
    public Integer getPointsForWin() { return pointsForWin; }
    public Integer getPowerplayOvers() { return powerplayOvers; }
    public Boolean getSuperOver() { return superOver; }

    // setters
    public void setId(Long id) { this.id = id; }
    public void setName(String name) { this.name = name; }
    public void setGame(String game) { this.game = game; }
    public void setMaxPlayers(int maxPlayers) { this.maxPlayers = maxPlayers; }

    public void setLogo(String logo) { this.logo = logo; }
    public void setOrganizer(String organizer) { this.organizer = organizer; }
    public void setDescription(String description) { this.description = description; }
    public void setCity(String city) { this.city = city; }
    public void setGround(String ground) { this.ground = ground; }
    public void setStartDate(String startDate) { this.startDate = startDate; }
    public void setEndDate(String endDate) { this.endDate = endDate; }
    public void setFormat(String format) { this.format = format; }
    public void setStructure(String structure) { this.structure = structure; }
    public void setEntryFee(Double entryFee) { this.entryFee = entryFee; }
    public void setMaxTeams(Integer maxTeams) { this.maxTeams = maxTeams; }
    public void setOvers(Integer overs) { this.overs = overs; }
    public void setPointsForWin(Integer pointsForWin) { this.pointsForWin = pointsForWin; }
    public void setPowerplayOvers(Integer powerplayOvers) { this.powerplayOvers = powerplayOvers; }
    public void setSuperOver(Boolean superOver) { this.superOver = superOver; }

    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }

    public String getCollaborators() { return collaborators; }
    public void setCollaborators(String collaborators) { this.collaborators = collaborators; }
}