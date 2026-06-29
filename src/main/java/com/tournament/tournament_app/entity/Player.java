package com.tournament.tournament_app.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "players")
public class Player {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String playerName;
    private String role; // Batsman, Bowler, All-Rounder, Wicket-Keeper
    private String jerseyNumber;
    private String mobileNumber;
    private Boolean isSubstitute;

    // Team Role in Club/Team
    private String teamRole = "MEMBER"; // OWNER, CAPTAIN, ADMIN, MEMBER

    // Career stats
    private Integer matchesPlayed = 0;
    private Integer battingRuns = 0;
    private Integer battingBalls = 0;
    private Integer battingInnings = 0;
    private Integer bowlingWickets = 0;
    private Integer bowlingRunsConceded = 0;
    private Integer bowlingOvers = 0;
    private Integer catches = 0;
    private Integer runouts = 0;
    private Integer stumpings = 0;

    @ManyToOne
    @JoinColumn(name = "team_id")
    private Team team;

    private String battingHand = "Right Hand";
    private String bowlingStyle = "Right-arm Fast";
    private String city = "";
    private String dob = "";
    private String avatarUrl = "";

    public Player() {
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getPlayerName() {
        return playerName;
    }

    public void setPlayerName(String playerName) {
        this.playerName = playerName;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public String getJerseyNumber() {
        return jerseyNumber;
    }

    public void setJerseyNumber(String jerseyNumber) {
        this.jerseyNumber = jerseyNumber;
    }

    public String getMobileNumber() {
        return mobileNumber;
    }

    public void setMobileNumber(String mobileNumber) {
        this.mobileNumber = mobileNumber;
    }

    public String getTeamRole() {
        return teamRole;
    }

    public void setTeamRole(String teamRole) {
        this.teamRole = teamRole;
    }

    public Integer getMatchesPlayed() {
        return matchesPlayed;
    }

    public void setMatchesPlayed(Integer matchesPlayed) {
        this.matchesPlayed = matchesPlayed;
    }

    public Integer getBattingRuns() {
        return battingRuns;
    }

    public void setBattingRuns(Integer battingRuns) {
        this.battingRuns = battingRuns;
    }

    public Integer getBattingBalls() {
        return battingBalls;
    }

    public void setBattingBalls(Integer battingBalls) {
        this.battingBalls = battingBalls;
    }

    public Integer getBattingInnings() {
        return battingInnings;
    }

    public void setBattingInnings(Integer battingInnings) {
        this.battingInnings = battingInnings;
    }

    public Integer getBowlingWickets() {
        return bowlingWickets;
    }

    public void setBowlingWickets(Integer bowlingWickets) {
        this.bowlingWickets = bowlingWickets;
    }

    public Integer getBowlingRunsConceded() {
        return bowlingRunsConceded;
    }

    public void setBowlingRunsConceded(Integer bowlingRunsConceded) {
        this.bowlingRunsConceded = bowlingRunsConceded;
    }

    public Integer getBowlingOvers() {
        return bowlingOvers;
    }

    public void setBowlingOvers(Integer bowlingOvers) {
        this.bowlingOvers = bowlingOvers;
    }

    public Integer getCatches() {
        return catches;
    }

    public void setCatches(Integer catches) {
        this.catches = catches;
    }

    public Integer getRunouts() {
        return runouts;
    }

    public void setRunouts(Integer runouts) {
        this.runouts = runouts;
    }

    public Integer getStumpings() {
        return stumpings;
    }

    public void setStumpings(Integer stumpings) {
        this.stumpings = stumpings;
    }

    public Team getTeam() {
        return team;
    }

    public void setTeam(Team team) {
        this.team = team;
    }

    public String getBattingHand() {
        return battingHand;
    }

    public void setBattingHand(String battingHand) {
        this.battingHand = battingHand;
    }

    public String getBowlingStyle() {
        return bowlingStyle;
    }

    public void setBowlingStyle(String bowlingStyle) {
        this.bowlingStyle = bowlingStyle;
    }

    public String getCity() {
        return city;
    }

    public void setCity(String city) {
        this.city = city;
    }

    public String getDob() {
        return dob;
    }

    public void setDob(String dob) {
        this.dob = dob;
    }

    public String getAvatarUrl() {
        return avatarUrl;
    }

    public void setAvatarUrl(String avatarUrl) {
        this.avatarUrl = avatarUrl;
    }

    public Boolean getIsSubstitute() {
        return isSubstitute != null ? isSubstitute : false;
    }

    public Boolean getIsSubstituteRaw() {
        return isSubstitute;
    }

    public void setIsSubstitute(Boolean isSubstitute) {
        this.isSubstitute = isSubstitute;
    }
}
