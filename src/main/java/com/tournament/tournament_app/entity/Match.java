package com.tournament.tournament_app.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "matches")
public class Match {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String teamA;
    private String teamB;

    private Integer scoreA = 0;
    private Integer scoreB = 0;

    private String winner;
    private String round;   // QUARTER_FINAL, SEMI_FINAL, FINAL
    private String status;  // UPCOMING, LIVE, COMPLETED
    private String matchDate;

    private String groundName;
    private String ballType; // TENNIS, LEATHER
    private String matchType; // LIMITED_OVERS, TEST
    private String tossWinner;
    private String tossDecision; // BAT, BOWL
    private String lastBowler;

    @Lob
    @Column(columnDefinition = "LONGTEXT")
    private String rollbackState;

    // Live scoring fields
    private Integer wickets = 0;
    private Double overs = 0.0;
    private Integer fours = 0;
    private Integer sixes = 0;
    private String lastEvent;

    private Integer currentInnings = 1;
    private Integer targetScore = 0;
    private Double maxOvers = 20.0;

    private String currentBatsman = "Batsman";
    private String currentNonStriker = "Non-Striker";
    private String currentBowler = "Bowler";

    private Integer batsmanRuns = 0;
    private Integer batsmanBalls = 0;
    private Integer nonStrikerRuns = 0;
    private Integer nonStrikerBalls = 0;
    private Integer bowlerWickets = 0;
    private Integer extras = 0;

    private Double firstInningsOvers = 0.0;
    private Integer firstInningsWickets = 0;


    @ManyToOne
    @JoinColumn(name = "tournament_id")
    private Tournament tournament;

    public Long getId() {
        return id;
    }

    public String getTeamA() {
        return teamA;
    }

    public String getTeamB() {
        return teamB;
    }

    public Integer getScoreA() {
        return scoreA;
    }

    public Integer getScoreB() {
        return scoreB;
    }

    public String getWinner() {
        return winner;
    }

    public String getRound() {
        return round;
    }

    public String getStatus() {
        return status;
    }

    public String getMatchDate() {
        return matchDate;
    }

    public Tournament getTournament() {
        return tournament;
    }

    public Integer getWickets() {
        return wickets;
    }

    public Double getOvers() {
        return overs;
    }

    public Integer getFours() {
        return fours;
    }

    public Integer getSixes() {
        return sixes;
    }

    public String getLastEvent() {
        return lastEvent;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public void setTeamA(String teamA) {
        this.teamA = teamA;
    }

    public void setTeamB(String teamB) {
        this.teamB = teamB;
    }

    public void setScoreA(Integer scoreA) {
        this.scoreA = scoreA;
    }

    public void setScoreB(Integer scoreB) {
        this.scoreB = scoreB;
    }

    public void setWinner(String winner) {
        this.winner = winner;
    }

    public void setRound(String round) {
        this.round = round;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public void setMatchDate(String matchDate) {
        this.matchDate = matchDate;
    }

    public void setTournament(Tournament tournament) {
        this.tournament = tournament;
    }

    public void setWickets(Integer wickets) {
        this.wickets = wickets;
    }

    public void setOvers(Double overs) {
        this.overs = overs;
    }

    public void setFours(Integer fours) {
        this.fours = fours;
    }

    public void setSixes(Integer sixes) {
        this.sixes = sixes;
    }

    public void setLastEvent(String lastEvent) {
        this.lastEvent = lastEvent;
    }

    public Integer getCurrentInnings() {
        return currentInnings;
    }

    public void setCurrentInnings(Integer currentInnings) {
        this.currentInnings = currentInnings;
    }

    public Integer getTargetScore() {
        return targetScore;
    }

    public void setTargetScore(Integer targetScore) {
        this.targetScore = targetScore;
    }

    public Double getMaxOvers() {
        return maxOvers;
    }

    public void setMaxOvers(Double maxOvers) {
        this.maxOvers = maxOvers;
    }

    public String getCurrentBatsman() {
        return currentBatsman;
    }

    public void setCurrentBatsman(String currentBatsman) {
        this.currentBatsman = currentBatsman;
    }

    public String getCurrentBowler() {
        return currentBowler;
    }

    public void setCurrentBowler(String currentBowler) {
        this.currentBowler = currentBowler;
    }

    public String getCurrentNonStriker() {
        return currentNonStriker;
    }

    public void setCurrentNonStriker(String currentNonStriker) {
        this.currentNonStriker = currentNonStriker;
    }

    public Integer getBatsmanRuns() {
        return batsmanRuns;
    }

    public void setBatsmanRuns(Integer batsmanRuns) {
        this.batsmanRuns = batsmanRuns;
    }

    public Integer getBatsmanBalls() {
        return batsmanBalls;
    }

    public void setBatsmanBalls(Integer batsmanBalls) {
        this.batsmanBalls = batsmanBalls;
    }

    public Integer getBowlerWickets() {
        return bowlerWickets;
    }

    public void setBowlerWickets(Integer bowlerWickets) {
        this.bowlerWickets = bowlerWickets;
    }

    public Integer getExtras() {
        return extras;
    }

    public void setExtras(Integer extras) {
        this.extras = extras;
    }

    public Integer getNonStrikerRuns() {
        return nonStrikerRuns;
    }

    public void setNonStrikerRuns(Integer nonStrikerRuns) {
        this.nonStrikerRuns = nonStrikerRuns;
    }

    public Integer getNonStrikerBalls() {
        return nonStrikerBalls;
    }

    public void setNonStrikerBalls(Integer nonStrikerBalls) {
        this.nonStrikerBalls = nonStrikerBalls;
    }

    public String getGroundName() {
        return groundName;
    }

    public void setGroundName(String groundName) {
        this.groundName = groundName;
    }

    public String getBallType() {
        return ballType;
    }

    public void setBallType(String ballType) {
        this.ballType = ballType;
    }

    public String getMatchType() {
        return matchType;
    }

    public void setMatchType(String matchType) {
        this.matchType = matchType;
    }

    public String getTossWinner() {
        return tossWinner;
    }

    public void setTossWinner(String tossWinner) {
        this.tossWinner = tossWinner;
    }

    public String getTossDecision() {
        return tossDecision;
    }

    public void setTossDecision(String tossDecision) {
        this.tossDecision = tossDecision;
    }

    public String getRollbackState() {
        return rollbackState;
    }

    public void setRollbackState(String rollbackState) {
        this.rollbackState = rollbackState;
    }

    public String getLastBowler() {
        return lastBowler;
    }

    public void setLastBowler(String lastBowler) {
        this.lastBowler = lastBowler;
    }

    public Double getFirstInningsOvers() {
        return firstInningsOvers;
    }

    public void setFirstInningsOvers(Double firstInningsOvers) {
        this.firstInningsOvers = firstInningsOvers;
    }

    public Integer getFirstInningsWickets() {
        return firstInningsWickets;
    }

    public void setFirstInningsWickets(Integer firstInningsWickets) {
        this.firstInningsWickets = firstInningsWickets;
    }
}