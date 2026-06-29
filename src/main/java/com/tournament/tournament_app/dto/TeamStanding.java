package com.tournament.tournament_app.dto;

public class TeamStanding {
    private String teamName;
    private int matchesPlayed;
    private int wins;
    private int losses;
    private int ties;
    private int points;
    private double netRunRate;
    
    private int totalRunsScored;
    private double totalOversFaced;
    private int totalRunsConceded;
    private double totalOversBowled;

    public TeamStanding(String teamName) {
        this.teamName = teamName;
    }

    public String getTeamName() { return teamName; }
    public void setTeamName(String teamName) { this.teamName = teamName; }

    public int getMatchesPlayed() { return matchesPlayed; }
    public void setMatchesPlayed(int matchesPlayed) { this.matchesPlayed = matchesPlayed; }

    public int getWins() { return wins; }
    public void setWins(int wins) { this.wins = wins; }

    public int getLosses() { return losses; }
    public void setLosses(int losses) { this.losses = losses; }

    public int getTies() { return ties; }
    public void setTies(int ties) { this.ties = ties; }

    public int getPoints() { return points; }
    public void setPoints(int points) { this.points = points; }

    public double getNetRunRate() { return netRunRate; }
    public void setNetRunRate(double netRunRate) { this.netRunRate = netRunRate; }

    public int getTotalRunsScored() { return totalRunsScored; }
    public void setTotalRunsScored(int totalRunsScored) { this.totalRunsScored = totalRunsScored; }

    public double getTotalOversFaced() { return totalOversFaced; }
    public void setTotalOversFaced(double totalOversFaced) { this.totalOversFaced = totalOversFaced; }

    public int getTotalRunsConceded() { return totalRunsConceded; }
    public void setTotalRunsConceded(int totalRunsConceded) { this.totalRunsConceded = totalRunsConceded; }

    public double getTotalOversBowled() { return totalOversBowled; }
    public void setTotalOversBowled(double totalOversBowled) { this.totalOversBowled = totalOversBowled; }
}
