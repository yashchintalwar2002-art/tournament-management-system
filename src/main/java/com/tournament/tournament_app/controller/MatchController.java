package com.tournament.tournament_app.controller;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.tournament.tournament_app.entity.Match;
import com.tournament.tournament_app.entity.Player;
import com.tournament.tournament_app.entity.Team;
import com.tournament.tournament_app.entity.Tournament;
import com.tournament.tournament_app.entity.Commentary;
import com.tournament.tournament_app.entity.ChatMessage;
import com.tournament.tournament_app.repository.MatchRepository;
import com.tournament.tournament_app.repository.PlayerRepository;
import com.tournament.tournament_app.repository.TeamRepository;
import com.tournament.tournament_app.repository.TournamentRepository;
import com.tournament.tournament_app.repository.CommentaryRepository;
import com.tournament.tournament_app.repository.ChatMessageRepository;

@RestController
@RequestMapping("/matches")
@CrossOrigin(origins = "*")
public class MatchController {

    @Autowired
    private MatchRepository matchRepository;

    @Autowired
    private jakarta.servlet.http.HttpServletRequest request;

    private void validateTournamentAccess(Tournament tournament) {
        String userEmail = request.getHeader("X-User-Email");
        String creator = tournament.getCreatedBy();
        if (creator == null || creator.trim().isEmpty()) {
            creator = "admin@gmail.com";
        }
        if (userEmail == null || userEmail.trim().isEmpty()) {
            throw new org.springframework.web.server.ResponseStatusException(
                org.springframework.http.HttpStatus.FORBIDDEN,
                "Access denied. You do not have write access to this tournament."
            );
        }
        if (creator.equalsIgnoreCase(userEmail.trim())) {
            return;
        }
        String collaborators = tournament.getCollaborators();
        if (collaborators != null && !collaborators.trim().isEmpty()) {
            String[] collabs = collaborators.split(",");
            for (String collab : collabs) {
                if (collab.trim().equalsIgnoreCase(userEmail.trim())) {
                    return;
                }
            }
        }
        throw new org.springframework.web.server.ResponseStatusException(
            org.springframework.http.HttpStatus.FORBIDDEN,
            "Access denied. You do not have write access to this tournament."
        );
    }

    @Autowired
    private TeamRepository teamRepository;

    @Autowired
    private TournamentRepository tournamentRepository;

    @Autowired
    private PlayerRepository playerRepository;

    @Autowired
    private CommentaryRepository commentaryRepository;

    @Autowired
    private ChatMessageRepository chatMessageRepository;

    @Autowired
    private ObjectMapper objectMapper;

    private void addCommentaryEvent(Match match, String event, String description) {
        addCommentaryEvent(match, event, description, match.getCurrentBatsman());
    }

    private void addCommentaryEvent(Match match, String event, String description, String batsmanName) {
        try {
            Commentary comm = new Commentary();
            comm.setMatchId(match.getId());
            comm.setOverBall(String.valueOf(match.getOvers()));
            comm.setEvent(event);
            comm.setDescription(description);
            comm.setBowlerName(match.getCurrentBowler());
            comm.setBatsmanName(batsmanName);
            commentaryRepository.save(comm);
        } catch (Exception e) {
            System.err.println("Failed to save commentary: " + e.getMessage());
        }
    }

    private void updatePlayerCareerStats(Match match, String playerName, int runs, int balls, int wickets, int runsConceded, boolean isBatsman) {
        try {
            if (match.getTournament() == null) return;
            List<Team> teams = teamRepository.findByTournamentId(match.getTournament().getId());
            for (Team team : teams) {
                List<Player> players = playerRepository.findByTeamId(team.getId());
                for (Player player : players) {
                    if (player.getPlayerName() != null && player.getPlayerName().trim().equalsIgnoreCase(playerName.trim())) {
                        if (isBatsman) {
                            player.setBattingRuns((player.getBattingRuns() == null ? 0 : player.getBattingRuns()) + runs);
                            player.setBattingBalls((player.getBattingBalls() == null ? 0 : player.getBattingBalls()) + balls);
                        } else {
                            player.setBowlingWickets((player.getBowlingWickets() == null ? 0 : player.getBowlingWickets()) + wickets);
                            player.setBowlingRunsConceded((player.getBowlingRunsConceded() == null ? 0 : player.getBowlingRunsConceded()) + runsConceded);
                        }
                        playerRepository.save(player);
                        return;
                    }
                }
            }
        } catch (Exception e) {
            System.err.println("Failed to update player career stats: " + e.getMessage());
        }
    }

    private void updatePlayerCareerMatches(Match match, String playerName) {
        try {
            if (match.getTournament() == null) return;
            List<Team> teams = teamRepository.findByTournamentId(match.getTournament().getId());
            for (Team team : teams) {
                List<Player> players = playerRepository.findByTeamId(team.getId());
                for (Player player : players) {
                    if (player.getPlayerName() != null && player.getPlayerName().trim().equalsIgnoreCase(playerName.trim())) {
                        player.setMatchesPlayed((player.getMatchesPlayed() == null ? 0 : player.getMatchesPlayed()) + 1);
                        player.setBattingInnings((player.getBattingInnings() == null ? 0 : player.getBattingInnings()) + 1);
                        playerRepository.save(player);
                        return;
                    }
                }
            }
        } catch (Exception e) {
            System.err.println("Failed to update player matches: " + e.getMessage());
        }
    }

    private String getTeamBattingFirst(Match match) {
        String tA = match.getTeamA();
        String tB = match.getTeamB();
        String tossWin = match.getTossWinner();
        String tossDec = match.getTossDecision();
        
        if (tossWin != null && !tossWin.trim().isEmpty()) {
            boolean isAWin = tossWin.equalsIgnoreCase(tA);
            if (isAWin) {
                if ("BOWL".equalsIgnoreCase(tossDec)) {
                    return tB;
                }
            } else {
                if ("BAT".equalsIgnoreCase(tossDec)) {
                    return tB;
                }
            }
        }
        return tA;
    }

    private String getTeamBattingSecond(Match match) {
        String first = getTeamBattingFirst(match);
        if (first.equalsIgnoreCase(match.getTeamA())) {
            return match.getTeamB();
        } else {
            return match.getTeamA();
        }
    }

    private void validateActivePlayers(Match match) {
        if (match.getCurrentBatsman() == null || match.getCurrentBatsman().trim().isEmpty() || "Batsman".equalsIgnoreCase(match.getCurrentBatsman().trim()) || "New Batsman".equalsIgnoreCase(match.getCurrentBatsman().trim())) {
            throw new org.springframework.web.server.ResponseStatusException(
                org.springframework.http.HttpStatus.BAD_REQUEST,
                "Please select an active striker batsman first."
            );
        }
        if (match.getCurrentBowler() == null || match.getCurrentBowler().trim().isEmpty() || "Bowler".equalsIgnoreCase(match.getCurrentBowler().trim())) {
            throw new org.springframework.web.server.ResponseStatusException(
                org.springframework.http.HttpStatus.BAD_REQUEST,
                "Please select an active bowler for the next over."
            );
        }
    }

    private void checkOverEnd(Match match) {
        Double currentOvers = match.getOvers();
        if (currentOvers > 0.0 && Math.round((currentOvers - currentOvers.intValue()) * 10) == 0) {
            rotateStrike(match);
            match.setLastBowler(match.getCurrentBowler());
            match.setCurrentBowler("Bowler");
            match.setLastEvent("OVER END (Select New Bowler)");
            addCommentaryEvent(match, "OVER END", "End of the over. Strike is rotated. Please select a new bowler.");
        }
    }

    private void deductPlayerCareerStats(Match match, String playerName, int runs, int balls, int wickets, int runsConceded, boolean isBatsman) {
        try {
            if (match.getTournament() == null) return;
            List<Team> teams = teamRepository.findByTournamentId(match.getTournament().getId());
            for (Team team : teams) {
                List<Player> players = playerRepository.findByTeamId(team.getId());
                for (Player player : players) {
                    if (player.getPlayerName() != null && player.getPlayerName().trim().equalsIgnoreCase(playerName.trim())) {
                        if (isBatsman) {
                            player.setBattingRuns(Math.max(0, (player.getBattingRuns() == null ? 0 : player.getBattingRuns()) - runs));
                            player.setBattingBalls(Math.max(0, (player.getBattingBalls() == null ? 0 : player.getBattingBalls()) - balls));
                        } else {
                            player.setBowlingWickets(Math.max(0, (player.getBowlingWickets() == null ? 0 : player.getBowlingWickets()) - wickets));
                            player.setBowlingRunsConceded(Math.max(0, (player.getBowlingRunsConceded() == null ? 0 : player.getBowlingRunsConceded()) - runsConceded));
                        }
                        playerRepository.save(player);
                        return;
                    }
                }
            }
        } catch (Exception e) {
            System.err.println("Failed to deduct player career stats: " + e.getMessage());
        }
    }

    private void deductPlayerMatchesAndInnings(Match match, String playerName) {
        try {
            if (match.getTournament() == null) return;
            List<Team> teams = teamRepository.findByTournamentId(match.getTournament().getId());
            for (Team team : teams) {
                List<Player> players = playerRepository.findByTeamId(team.getId());
                for (Player player : players) {
                    if (player.getPlayerName() != null && player.getPlayerName().trim().equalsIgnoreCase(playerName.trim())) {
                        player.setMatchesPlayed(Math.max(0, (player.getMatchesPlayed() == null ? 0 : player.getMatchesPlayed()) - 1));
                        player.setBattingInnings(Math.max(0, (player.getBattingInnings() == null ? 0 : player.getBattingInnings()) - 1));
                        playerRepository.save(player);
                        return;
                    }
                }
            }
        } catch (Exception e) {
            System.err.println("Failed to deduct matches/innings: " + e.getMessage());
        }
    }

    private double getRealOvers(Double oversVal, Integer wickets, Double maxOvers) {
        double max = maxOvers != null ? maxOvers : 20.0;
        if (wickets != null && wickets >= 10) {
            return max;
        }
        if (oversVal == null) {
            return 0.0;
        }
        int completedOvers = (int) Math.floor(oversVal);
        int balls = (int) Math.round((oversVal - completedOvers) * 10);
        int totalBalls = completedOvers * 6 + balls;
        return totalBalls / 6.0;
    }

    private void updatePlayerStatsOnMatchCompletion(Match match) {
        try {
            if (match.getTournament() == null) return;
            
            List<Commentary> commentaries = commentaryRepository.findByMatchIdOrderByTimestampDesc(match.getId());
            
            java.util.Set<String> battedPlayers = new java.util.HashSet<>();
            java.util.Set<String> bowledPlayers = new java.util.HashSet<>();
            java.util.Set<String> dismissedPlayers = new java.util.HashSet<>();
            
            if (match.getCurrentBatsman() != null && !match.getCurrentBatsman().trim().isEmpty() 
                    && !"Batsman".equalsIgnoreCase(match.getCurrentBatsman()) 
                    && !"New Batsman".equalsIgnoreCase(match.getCurrentBatsman())) {
                battedPlayers.add(match.getCurrentBatsman().trim().toLowerCase());
            }
            if (match.getCurrentNonStriker() != null && !match.getCurrentNonStriker().trim().isEmpty() 
                    && !"Non-Striker".equalsIgnoreCase(match.getCurrentNonStriker()) 
                    && !"New Batsman".equalsIgnoreCase(match.getCurrentNonStriker())) {
                battedPlayers.add(match.getCurrentNonStriker().trim().toLowerCase());
            }
            if (match.getCurrentBowler() != null && !match.getCurrentBowler().trim().isEmpty() 
                    && !"Bowler".equalsIgnoreCase(match.getCurrentBowler())) {
                bowledPlayers.add(match.getCurrentBowler().trim().toLowerCase());
            }
            
            for (Commentary comm : commentaries) {
                String event = comm.getEvent();
                String batsman = comm.getBatsmanName();
                String bowler = comm.getBowlerName();
                
                if (batsman != null && !batsman.trim().isEmpty() 
                        && !"Batsman".equalsIgnoreCase(batsman) 
                        && !"New Batsman".equalsIgnoreCase(batsman)) {
                    battedPlayers.add(batsman.trim().toLowerCase());
                }
                if (bowler != null && !bowler.trim().isEmpty() 
                        && !"Bowler".equalsIgnoreCase(bowler)) {
                    bowledPlayers.add(bowler.trim().toLowerCase());
                }
                if (event != null && "WICKET".equalsIgnoreCase(event.trim()) && batsman != null && !batsman.trim().isEmpty()) {
                    dismissedPlayers.add(batsman.trim().toLowerCase());
                }
            }
            
            List<Team> teams = teamRepository.findByTournamentId(match.getTournament().getId());
            for (Team team : teams) {
                if (team.getTeamName().equalsIgnoreCase(match.getTeamA()) || team.getTeamName().equalsIgnoreCase(match.getTeamB())) {
                    List<Player> players = playerRepository.findByTeamId(team.getId());
                    for (Player player : players) {
                        if (player.getPlayerName() == null) continue;
                        String pNameLower = player.getPlayerName().trim().toLowerCase();
                        
                        if (battedPlayers.isEmpty() && bowledPlayers.isEmpty()) {
                            // Manual result override fallback: increment matchesPlayed for everyone
                            player.setMatchesPlayed((player.getMatchesPlayed() == null ? 0 : player.getMatchesPlayed()) + 1);
                            playerRepository.save(player);
                        } else {
                            boolean hasBatted = battedPlayers.contains(pNameLower);
                            boolean hasBowled = bowledPlayers.contains(pNameLower);
                            boolean wasDismissed = dismissedPlayers.contains(pNameLower);
                            
                            if (hasBatted) {
                                if (!wasDismissed) {
                                    player.setMatchesPlayed((player.getMatchesPlayed() == null ? 0 : player.getMatchesPlayed()) + 1);
                                    player.setBattingInnings((player.getBattingInnings() == null ? 0 : player.getBattingInnings()) + 1);
                                    playerRepository.save(player);
                                }
                            } else if (hasBowled) {
                                player.setMatchesPlayed((player.getMatchesPlayed() == null ? 0 : player.getMatchesPlayed()) + 1);
                                playerRepository.save(player);
                            }
                        }
                    }
                }
            }
        } catch (Exception e) {
            System.err.println("Failed to update player stats on match completion: " + e.getMessage());
        }
    }

    private void revertPlayerStatsOnMatchCompletion(Match match) {
        try {
            if (match.getTournament() == null) return;
            
            List<Commentary> commentaries = commentaryRepository.findByMatchIdOrderByTimestampDesc(match.getId());
            
            java.util.Set<String> battedPlayers = new java.util.HashSet<>();
            java.util.Set<String> bowledPlayers = new java.util.HashSet<>();
            java.util.Set<String> dismissedPlayers = new java.util.HashSet<>();
            
            if (match.getCurrentBatsman() != null && !match.getCurrentBatsman().trim().isEmpty() 
                    && !"Batsman".equalsIgnoreCase(match.getCurrentBatsman()) 
                    && !"New Batsman".equalsIgnoreCase(match.getCurrentBatsman())) {
                battedPlayers.add(match.getCurrentBatsman().trim().toLowerCase());
            }
            if (match.getCurrentNonStriker() != null && !match.getCurrentNonStriker().trim().isEmpty() 
                    && !"Non-Striker".equalsIgnoreCase(match.getCurrentNonStriker()) 
                    && !"New Batsman".equalsIgnoreCase(match.getCurrentNonStriker())) {
                battedPlayers.add(match.getCurrentNonStriker().trim().toLowerCase());
            }
            if (match.getCurrentBowler() != null && !match.getCurrentBowler().trim().isEmpty() 
                    && !"Bowler".equalsIgnoreCase(match.getCurrentBowler())) {
                bowledPlayers.add(match.getCurrentBowler().trim().toLowerCase());
            }
            
            for (Commentary comm : commentaries) {
                String event = comm.getEvent();
                String batsman = comm.getBatsmanName();
                String bowler = comm.getBowlerName();
                
                if (batsman != null && !batsman.trim().isEmpty() 
                        && !"Batsman".equalsIgnoreCase(batsman) 
                        && !"New Batsman".equalsIgnoreCase(batsman)) {
                    battedPlayers.add(batsman.trim().toLowerCase());
                }
                if (bowler != null && !bowler.trim().isEmpty() 
                        && !"Bowler".equalsIgnoreCase(bowler)) {
                    bowledPlayers.add(bowler.trim().toLowerCase());
                }
                if (event != null && "WICKET".equalsIgnoreCase(event.trim()) && batsman != null && !batsman.trim().isEmpty()) {
                    dismissedPlayers.add(batsman.trim().toLowerCase());
                }
            }
            
            List<Team> teams = teamRepository.findByTournamentId(match.getTournament().getId());
            for (Team team : teams) {
                if (team.getTeamName().equalsIgnoreCase(match.getTeamA()) || team.getTeamName().equalsIgnoreCase(match.getTeamB())) {
                    List<Player> players = playerRepository.findByTeamId(team.getId());
                    for (Player player : players) {
                        if (player.getPlayerName() == null) continue;
                        String pNameLower = player.getPlayerName().trim().toLowerCase();
                        
                        if (battedPlayers.isEmpty() && bowledPlayers.isEmpty()) {
                            // Manual result override fallback revert
                            player.setMatchesPlayed(Math.max(0, (player.getMatchesPlayed() == null ? 0 : player.getMatchesPlayed()) - 1));
                            playerRepository.save(player);
                        } else {
                            boolean hasBatted = battedPlayers.contains(pNameLower);
                            boolean hasBowled = bowledPlayers.contains(pNameLower);
                            boolean wasDismissed = dismissedPlayers.contains(pNameLower);
                            
                            if (hasBatted) {
                                if (!wasDismissed) {
                                    player.setMatchesPlayed(Math.max(0, (player.getMatchesPlayed() == null ? 0 : player.getMatchesPlayed()) - 1));
                                    player.setBattingInnings(Math.max(0, (player.getBattingInnings() == null ? 0 : player.getBattingInnings()) - 1));
                                    playerRepository.save(player);
                                }
                            } else if (hasBowled) {
                                player.setMatchesPlayed(Math.max(0, (player.getMatchesPlayed() == null ? 0 : player.getMatchesPlayed()) - 1));
                                playerRepository.save(player);
                            }
                        }
                    }
                }
            }
        } catch (Exception e) {
            System.err.println("Failed to revert player stats on match completion: " + e.getMessage());
        }
    }

    private void deductFielderStats(String fielderName, String dismissalType) {
        try {
            List<Player> players = playerRepository.findAll();
            for (Player p : players) {
                if (p.getPlayerName().equalsIgnoreCase(fielderName)) {
                    if ("Caught".equalsIgnoreCase(dismissalType) || "Caught & Bowled".equalsIgnoreCase(dismissalType)) {
                        p.setCatches(Math.max(0, (p.getCatches() == null ? 0 : p.getCatches()) - 1));
                    } else if ("Stumped".equalsIgnoreCase(dismissalType)) {
                        p.setStumpings(Math.max(0, (p.getStumpings() == null ? 0 : p.getStumpings()) - 1));
                    } else if ("Run Out".equalsIgnoreCase(dismissalType)) {
                        p.setRunouts(Math.max(0, (p.getRunouts() == null ? 0 : p.getRunouts()) - 1));
                    }
                    playerRepository.save(p);
                    break;
                }
            }
        } catch (Exception e) {
            System.err.println("Failed to deduct fielder stats: " + e.getMessage());
        }
    }

    private void revertPlayerCareerStatsForMatch(Match match) {
        try {
            List<Commentary> commentaries = commentaryRepository.findByMatchIdOrderByTimestampDesc(match.getId());
            for (Commentary comm : commentaries) {
                String event = comm.getEvent();
                if (event == null) continue;
                event = event.toUpperCase();
                
                String batsmanName = comm.getBatsmanName();
                String bowlerName = comm.getBowlerName();
                
                if (event.contains("RUN")) {
                    int runs = 0;
                    java.util.regex.Matcher m = java.util.regex.Pattern.compile("(\\d+)").matcher(event);
                    if (m.find()) {
                        runs = Integer.parseInt(m.group(1));
                    }
                    if (batsmanName != null && !batsmanName.trim().isEmpty() && !"Batsman".equalsIgnoreCase(batsmanName)) {
                        deductPlayerCareerStats(match, batsmanName, runs, 1, 0, runs, true);
                    }
                    if (bowlerName != null && !bowlerName.trim().isEmpty() && !"Bowler".equalsIgnoreCase(bowlerName)) {
                        deductPlayerCareerStats(match, bowlerName, 0, 1, 0, runs, false);
                    }
                } else if (event.equals("DOT BALL")) {
                    if (batsmanName != null && !batsmanName.trim().isEmpty() && !"Batsman".equalsIgnoreCase(batsmanName)) {
                        deductPlayerCareerStats(match, batsmanName, 0, 1, 0, 0, true);
                    }
                    if (bowlerName != null && !bowlerName.trim().isEmpty() && !"Bowler".equalsIgnoreCase(bowlerName)) {
                        deductPlayerCareerStats(match, bowlerName, 0, 1, 0, 0, false);
                    }
                } else if (event.equals("WICKET")) {
                    String desc = comm.getDescription();
                    if (desc != null) {
                        if (desc.startsWith("OUT!")) {
                            if (batsmanName != null && !batsmanName.trim().isEmpty() && !"Batsman".equalsIgnoreCase(batsmanName)) {
                                deductPlayerCareerStats(match, batsmanName, 0, 1, 0, 0, true);
                                deductPlayerMatchesAndInnings(match, batsmanName);
                            }
                            if (bowlerName != null && !bowlerName.trim().isEmpty() && !"Bowler".equalsIgnoreCase(bowlerName)) {
                                deductPlayerCareerStats(match, bowlerName, 0, 1, 1, 0, false);
                            }
                        } else if (desc.startsWith("WICKET!")) {
                            String dismissalType = "Bowled";
                            java.util.regex.Matcher mDismissal = java.util.regex.Pattern.compile("dismissed \\(([^)]+)\\)").matcher(desc);
                            if (mDismissal.find()) {
                                dismissalType = mDismissal.group(1);
                            }
                            
                            String fielder = null;
                            java.util.regex.Matcher mFielder = java.util.regex.Pattern.compile("caught/assisted by ([\\w\\s\\-]+) off the bowling").matcher(desc);
                            if (mFielder.find()) {
                                fielder = mFielder.group(1).trim();
                            }
                            
                            if (fielder != null && !fielder.isEmpty()) {
                                deductFielderStats(fielder, dismissalType);
                            }
                            
                            if (batsmanName != null && !batsmanName.trim().isEmpty() && !"New Batsman".equalsIgnoreCase(batsmanName)) {
                                deductPlayerCareerStats(match, batsmanName, 0, 1, 0, 0, true);
                                deductPlayerMatchesAndInnings(match, batsmanName);
                            }
                            
                            if (!"Run Out".equalsIgnoreCase(dismissalType) && !"Retired Hurt".equalsIgnoreCase(dismissalType) && bowlerName != null && !bowlerName.trim().isEmpty() && !"Bowler".equalsIgnoreCase(bowlerName)) {
                                deductPlayerCareerStats(match, bowlerName, 0, 1, 1, 0, false);
                            }
                        }
                    }
                }
            }
        } catch (Exception e) {
            System.err.println("Failed to revert player career stats: " + e.getMessage());
        }
    }

    private void resetMatchScoringState(Match match) {
        revertPlayerCareerStatsForMatch(match);

        match.setScoreA(0);
        match.setScoreB(0);
        match.setWickets(0);
        match.setOvers(0.0);
        match.setFours(0);
        match.setSixes(0);
        match.setCurrentInnings(1);
        match.setTargetScore(0);
        match.setCurrentBatsman("Batsman");
        match.setCurrentNonStriker("Non-Striker");
        match.setCurrentBowler("Bowler");
        match.setBatsmanRuns(0);
        match.setBatsmanBalls(0);
        match.setNonStrikerRuns(0);
        match.setNonStrikerBalls(0);
        match.setBowlerWickets(0);
        match.setExtras(0);
        match.setTossWinner("");
        match.setTossDecision("");
        match.setLastEvent("");
        match.setLastBowler(null);
        match.setRollbackState(null);
        match.setFirstInningsOvers(0.0);
        match.setFirstInningsWickets(0);
        match.setWinner(null);
        match.setStatus("UPCOMING");
        try {
            commentaryRepository.deleteByMatchId(match.getId());
            chatMessageRepository.deleteByMatchId(match.getId());
        } catch (Exception e) {
            System.err.println("Failed to clear commentary/chat on reset: " + e.getMessage());
        }
    }

    private void propagatePlayoffWinner(Match completedMatch) {
        try {
            if (completedMatch.getTournament() == null) return;
            String winner = completedMatch.getWinner();
            String loser = null;
            if (winner != null) {
                if (winner.equalsIgnoreCase(completedMatch.getTeamA())) {
                    loser = completedMatch.getTeamB();
                } else {
                    loser = completedMatch.getTeamA();
                }
            }
            
            if (winner == null || winner.trim().isEmpty()) return;

            List<Match> tournamentMatches = matchRepository.findByTournamentId(completedMatch.getTournament().getId());
            String label = completedMatch.getMatchDate();
            if (label == null || label.trim().isEmpty()) return;

            for (Match m : tournamentMatches) {
                if ("COMPLETED".equalsIgnoreCase(m.getStatus())) continue;
                
                boolean changed = false;
                String winnerPlaceholder = "Winner of " + label;
                if (winnerPlaceholder.equalsIgnoreCase(m.getTeamA())) {
                    m.setTeamA(winner);
                    changed = true;
                }
                if (winnerPlaceholder.equalsIgnoreCase(m.getTeamB())) {
                    m.setTeamB(winner);
                    changed = true;
                }
                
                String loserPlaceholder = "Loser of " + label;
                if (loserPlaceholder.equalsIgnoreCase(m.getTeamA()) && loser != null) {
                    m.setTeamA(loser);
                    changed = true;
                }
                if (loserPlaceholder.equalsIgnoreCase(m.getTeamB()) && loser != null) {
                    m.setTeamB(loser);
                    changed = true;
                }
                
                if (changed) {
                    matchRepository.save(m);
                }
            }
        } catch (Exception e) {
            System.err.println("Failed to propagate playoff winner: " + e.getMessage());
        }
    }

    private void revertPlayoffWinnerPropagation(Match resetMatch) {
        try {
            if (resetMatch.getTournament() == null) return;
            String label = resetMatch.getMatchDate();
            if (label == null || label.trim().isEmpty()) return;

            List<Match> tournamentMatches = matchRepository.findByTournamentId(resetMatch.getTournament().getId());
            
            String winner = resetMatch.getWinner();
            String loser = null;
            if (winner != null) {
                if (winner.equalsIgnoreCase(resetMatch.getTeamA())) {
                    loser = resetMatch.getTeamB();
                } else {
                    loser = resetMatch.getTeamA();
                }
            }
            
            if (winner == null || winner.trim().isEmpty()) return;

            String winnerPlaceholder = "Winner of " + label;
            String loserPlaceholder = "Loser of " + label;

            for (Match m : tournamentMatches) {
                if ("COMPLETED".equalsIgnoreCase(m.getStatus())) continue;
                
                boolean changed = false;
                if (winner.equalsIgnoreCase(m.getTeamA())) {
                    m.setTeamA(winnerPlaceholder);
                    changed = true;
                } else if (loser != null && loser.equalsIgnoreCase(m.getTeamA()) && label.contains("Qualifier 1")) {
                    m.setTeamA(loserPlaceholder);
                    changed = true;
                }
                
                if (winner.equalsIgnoreCase(m.getTeamB())) {
                    m.setTeamB(winnerPlaceholder);
                    changed = true;
                } else if (loser != null && loser.equalsIgnoreCase(m.getTeamB()) && label.contains("Qualifier 1")) {
                    m.setTeamB(loserPlaceholder);
                    changed = true;
                }
                
                if (changed) {
                    matchRepository.save(m);
                }
            }
        } catch (Exception e) {
            System.err.println("Failed to revert playoff winner propagation: " + e.getMessage());
        }
    }

    @GetMapping
    public List<Match> getAllMatches() {
        return matchRepository.findAll();
    }

    private Double getMaxOversForGame(String game) {
        if (game == null) {
            return 20.0;
        }
        String g = game.toLowerCase().trim();
        if (g.contains("odi") || g.contains("fifty")) {
            return 50.0;
        } else if (g.contains("t20") || g.contains("twenty")) {
            return 20.0;
        } else if (g.contains("test")) {
            return 90.0;
        } else if (g.contains("football") || g.contains("soccer")) {
            return 90.0;
        } else if (g.contains("basketball")) {
            return 40.0;
        }
        return 20.0;
    }

    @PostMapping
    public Match createMatch(@RequestBody Match match) {
        if (match.getTournament() != null && match.getTournament().getId() != null) {
            Tournament tournament = tournamentRepository.findById(match.getTournament().getId())
                    .orElseThrow(() -> new RuntimeException("Tournament not found"));
            validateTournamentAccess(tournament);
            match.setTournament(tournament);
            if (match.getMaxOvers() == null || match.getMaxOvers() == 0.0) {
                match.setMaxOvers(getMaxOversForGame(tournament.getGame()));
            }
        }
        if (match.getScoreA() == null) match.setScoreA(0);
        if (match.getScoreB() == null) match.setScoreB(0);
        if (match.getWickets() == null) match.setWickets(0);
        if (match.getOvers() == null) match.setOvers(0.0);
        if (match.getCurrentInnings() == null) match.setCurrentInnings(1);
        if (match.getStatus() == null) match.setStatus("UPCOMING");
        return matchRepository.save(match);
    }


    @GetMapping("/live")
    public List<Match> getLiveMatches() {
        return matchRepository.findByStatus("LIVE");
    }

    @GetMapping("/tournament/{tournamentId}")
    public List<Match> getMatchesByTournament(
            @PathVariable Long tournamentId
    ) {
        return matchRepository.findByTournamentId(tournamentId);
    }

    @PostMapping("/auto-schedule/{tournamentId}")
    public List<Match> autoSchedule(
            @PathVariable Long tournamentId
    ) {
        Tournament tournament = tournamentRepository.findById(tournamentId)
                .orElseThrow(() -> new RuntimeException("Tournament not found"));

        List<Team> teams = teamRepository.findByTournamentId(tournamentId);
        if (teams.size() < 2) {
            throw new RuntimeException("Need at least 2 teams to schedule fixtures");
        }

        List<Match> matches = new ArrayList<>();
        // Generate round robin pairings
        for (int i = 0; i < teams.size(); i++) {
            for (int j = i + 1; j < teams.size(); j++) {
                Match match = new Match();
                match.setTournament(tournament);
                match.setTeamA(teams.get(i).getTeamName());
                match.setTeamB(teams.get(j).getTeamName());
                match.setRound("LEAGUE_MATCH");
                match.setStatus("UPCOMING");
                match.setScoreA(0);
                match.setScoreB(0);
                match.setMaxOvers(getMaxOversForGame(tournament.getGame()));
                match.setWinner(null);
                
                matches.add(matchRepository.save(match));
            }
        }
        return matches;
    }

    @PostMapping("/generate-playoffs/{tournamentId}")
    public List<Match> generatePlayoffs(
            @PathVariable Long tournamentId
    ) {

        Tournament tournament =
                tournamentRepository.findById(tournamentId)
                        .orElseThrow(() ->
                                new RuntimeException("Tournament not found"));

        List<Team> teams =
                teamRepository.findByTournamentId(tournamentId);

        if (teams.isEmpty()) {
            throw new RuntimeException("No teams registered for this tournament");
        }

        String game = tournament.getGame() != null ? tournament.getGame().toLowerCase().trim() : "";
        boolean isBattleRoyale = game.contains("bgmi") || game.contains("pubg") 
                || game.contains("freefire") || game.contains("free fire") 
                || game.contains("battle") || game.contains("apex") || game.contains("cod");

        List<Match> matches = new ArrayList<>();

        if (isBattleRoyale) {
            // For Battle Royale games (BGMI, Free Fire)
            List<Match> existing = matchRepository.findByTournamentIdAndRound(tournamentId, "LOBBY_STAGE");
            if (!existing.isEmpty()) {
                throw new RuntimeException("Battle Royale Lobby matches already generated");
            }
            // Generate 3 match lobbies for all teams to play
            for (int r = 1; r <= 3; r++) {
                Match match = new Match();
                match.setTournament(tournament);
                match.setTeamA("All Teams (" + teams.size() + ")");
                match.setTeamB("Lobby Match " + r);
                match.setRound("LOBBY_STAGE");
                match.setStatus("UPCOMING");
                match.setScoreA(0);
                match.setScoreB(0);
                match.setMaxOvers(0.0);
                match.setWinner(null);
                matches.add(matchRepository.save(match));
            }
            return matches;
        } else {
            if (teams.size() < 4) {
                throw new RuntimeException("At least 4 teams are required to generate playoffs.");
            }

            List<Match> leagueMatches = matchRepository.findByTournamentIdAndRound(tournamentId, "LEAGUE_MATCH");
            if (leagueMatches.isEmpty()) {
                throw new RuntimeException("No league matches found. League matches must be completed first.");
            }
            
            boolean anyIncomplete = leagueMatches.stream().anyMatch(m -> !"COMPLETED".equals(m.getStatus()));
            if (anyIncomplete) {
                throw new RuntimeException("All league matches must be completed before generating playoffs.");
            }

            java.util.Map<String, com.tournament.tournament_app.dto.TeamStanding> standingsMap = new java.util.HashMap<>();
            for (Team t : teams) {
                standingsMap.put(t.getTeamName(), new com.tournament.tournament_app.dto.TeamStanding(t.getTeamName()));
            }

            for (Match m : leagueMatches) {
                if ("COMPLETED".equals(m.getStatus())) {
                    com.tournament.tournament_app.dto.TeamStanding tsA = standingsMap.get(m.getTeamA());
                    com.tournament.tournament_app.dto.TeamStanding tsB = standingsMap.get(m.getTeamB());
                    
                    int scoreA = m.getScoreA() != null ? m.getScoreA() : 0;
                    int scoreB = m.getScoreB() != null ? m.getScoreB() : 0;

                    if (game.contains("cricket")) {
                        String firstBat = getTeamBattingFirst(m);
                        boolean isTeamAFirst = m.getTeamA().equalsIgnoreCase(firstBat);
                        
                        int wicketsA = isTeamAFirst ? (m.getFirstInningsWickets() != null ? m.getFirstInningsWickets() : 0) : (m.getWickets() != null ? m.getWickets() : 0);
                        int wicketsB = isTeamAFirst ? (m.getWickets() != null ? m.getWickets() : 0) : (m.getFirstInningsWickets() != null ? m.getFirstInningsWickets() : 0);
                        
                        double oversARaw = isTeamAFirst ? (m.getFirstInningsOvers() != null ? m.getFirstInningsOvers() : 0.0) : (m.getOvers() != null ? m.getOvers() : 0.0);
                        double oversBRaw = isTeamAFirst ? (m.getOvers() != null ? m.getOvers() : 0.0) : (m.getFirstInningsOvers() != null ? m.getFirstInningsOvers() : 0.0);
                        
                        double maxOvers = m.getMaxOvers() != null ? m.getMaxOvers() : 20.0;
                        
                        double realOversA = getRealOvers(oversARaw, wicketsA, maxOvers);
                        double realOversB = getRealOvers(oversBRaw, wicketsB, maxOvers);

                        if (tsA != null) {
                            tsA.setMatchesPlayed(tsA.getMatchesPlayed() + 1);
                            tsA.setTotalRunsScored(tsA.getTotalRunsScored() + scoreA);
                            tsA.setTotalOversFaced(tsA.getTotalOversFaced() + realOversA);
                            tsA.setTotalRunsConceded(tsA.getTotalRunsConceded() + scoreB);
                            tsA.setTotalOversBowled(tsA.getTotalOversBowled() + realOversB);
                        }
                        if (tsB != null) {
                            tsB.setMatchesPlayed(tsB.getMatchesPlayed() + 1);
                            tsB.setTotalRunsScored(tsB.getTotalRunsScored() + scoreB);
                            tsB.setTotalOversFaced(tsB.getTotalOversFaced() + realOversB);
                            tsB.setTotalRunsConceded(tsB.getTotalRunsConceded() + scoreA);
                            tsB.setTotalOversBowled(tsB.getTotalOversBowled() + realOversA);
                        }
                    } else {
                        if (tsA != null) {
                            tsA.setMatchesPlayed(tsA.getMatchesPlayed() + 1);
                            tsA.setTotalRunsScored(tsA.getTotalRunsScored() + scoreA);
                            tsA.setTotalRunsConceded(tsA.getTotalRunsConceded() + scoreB);
                        }
                        if (tsB != null) {
                            tsB.setMatchesPlayed(tsB.getMatchesPlayed() + 1);
                            tsB.setTotalRunsScored(tsB.getTotalRunsScored() + scoreB);
                            tsB.setTotalRunsConceded(tsB.getTotalRunsConceded() + scoreA);
                        }
                    }

                    if (tsA != null && tsB != null) {
                        if (m.getTeamA().equals(m.getWinner())) {
                            tsA.setWins(tsA.getWins() + 1);
                            tsA.setPoints(tsA.getPoints() + 2);
                            tsB.setLosses(tsB.getLosses() + 1);
                        } else if (m.getTeamB().equals(m.getWinner())) {
                            tsB.setWins(tsB.getWins() + 1);
                            tsB.setPoints(tsB.getPoints() + 2);
                            tsA.setLosses(tsA.getLosses() + 1);
                        } else if (m.getWinner() == null || m.getWinner().equalsIgnoreCase("tie") || m.getWinner().equalsIgnoreCase("draw")) {
                            tsA.setTies(tsA.getTies() + 1);
                            tsB.setTies(tsB.getTies() + 1);
                            tsA.setPoints(tsA.getPoints() + 1);
                            tsB.setPoints(tsB.getPoints() + 1);
                        }
                    }
                }
            }
            
            List<com.tournament.tournament_app.dto.TeamStanding> standings = new java.util.ArrayList<>(standingsMap.values());
            if (game.contains("cricket")) {
                for (com.tournament.tournament_app.dto.TeamStanding ts : standings) {
                    double rateFor = ts.getTotalOversFaced() > 0 ? (double) ts.getTotalRunsScored() / ts.getTotalOversFaced() : 0;
                    double rateAgainst = ts.getTotalOversBowled() > 0 ? (double) ts.getTotalRunsConceded() / ts.getTotalOversBowled() : 0;
                    ts.setNetRunRate(rateFor - rateAgainst);
                }
            } else {
                for (com.tournament.tournament_app.dto.TeamStanding ts : standings) {
                    ts.setNetRunRate(ts.getTotalRunsScored() - ts.getTotalRunsConceded());
                }
            }
            
            standings.sort((a, b) -> {
                if (a.getPoints() != b.getPoints()) {
                    return Integer.compare(b.getPoints(), a.getPoints());
                }
                return Double.compare(b.getNetRunRate(), a.getNetRunRate());
            });

            Double maxOvers = getMaxOversForGame(tournament.getGame());

            if (game.contains("cricket")) {
                List<Match> existing = matchRepository.findByTournamentIdAndRound(tournamentId, "PLAYOFFS");
                if (!existing.isEmpty()) {
                    throw new RuntimeException("Playoffs matches already generated");
                }

                // Qualifier 1
                Match q1 = new Match();
                q1.setTournament(tournament);
                q1.setTeamA(standings.get(0).getTeamName());
                q1.setTeamB(standings.get(1).getTeamName());
                q1.setRound("PLAYOFFS");
                q1.setStatus("UPCOMING");
                q1.setMaxOvers(maxOvers);
                q1.setMatchDate("Qualifier 1");
                matches.add(matchRepository.save(q1));

                // Eliminator
                Match eliminator = new Match();
                eliminator.setTournament(tournament);
                eliminator.setTeamA(standings.get(2).getTeamName());
                eliminator.setTeamB(standings.get(3).getTeamName());
                eliminator.setRound("PLAYOFFS");
                eliminator.setStatus("UPCOMING");
                eliminator.setMaxOvers(maxOvers);
                eliminator.setMatchDate("Eliminator");
                matches.add(matchRepository.save(eliminator));

                // Qualifier 2
                Match q2 = new Match();
                q2.setTournament(tournament);
                q2.setTeamA("Loser of Qualifier 1");
                q2.setTeamB("Winner of Eliminator");
                q2.setRound("PLAYOFFS");
                q2.setStatus("UPCOMING");
                q2.setMaxOvers(maxOvers);
                q2.setMatchDate("Qualifier 2");
                matches.add(matchRepository.save(q2));

                // Final
                Match finalMatch = new Match();
                finalMatch.setTournament(tournament);
                finalMatch.setTeamA("Winner of Qualifier 1");
                finalMatch.setTeamB("Winner of Qualifier 2");
                finalMatch.setRound("FINAL");
                finalMatch.setStatus("UPCOMING");
                finalMatch.setMaxOvers(maxOvers);
                finalMatch.setMatchDate("Final");
                matches.add(matchRepository.save(finalMatch));
            } else {
                List<Match> existingSF = matchRepository.findByTournamentIdAndRound(tournamentId, "SEMI_FINAL");
                List<Match> existingF = matchRepository.findByTournamentIdAndRound(tournamentId, "FINAL");
                if (!existingSF.isEmpty() || !existingF.isEmpty()) {
                    throw new RuntimeException("Playoffs matches already generated");
                }

                // Semi-Final 1: 1st vs 4th
                Match sf1 = new Match();
                sf1.setTournament(tournament);
                sf1.setTeamA(standings.get(0).getTeamName());
                sf1.setTeamB(standings.get(3).getTeamName());
                sf1.setRound("SEMI_FINAL");
                sf1.setStatus("UPCOMING");
                sf1.setMaxOvers(maxOvers);
                sf1.setMatchDate("Semi-Final 1");
                matches.add(matchRepository.save(sf1));

                // Semi-Final 2: 2nd vs 3rd
                Match sf2 = new Match();
                sf2.setTournament(tournament);
                sf2.setTeamA(standings.get(1).getTeamName());
                sf2.setTeamB(standings.get(2).getTeamName());
                sf2.setRound("SEMI_FINAL");
                sf2.setStatus("UPCOMING");
                sf2.setMaxOvers(maxOvers);
                sf2.setMatchDate("Semi-Final 2");
                matches.add(matchRepository.save(sf2));

                // Final
                Match finalMatch = new Match();
                finalMatch.setTournament(tournament);
                finalMatch.setTeamA("Winner of Semi-Final 1");
                finalMatch.setTeamB("Winner of Semi-Final 2");
                finalMatch.setRound("FINAL");
                finalMatch.setStatus("UPCOMING");
                finalMatch.setMaxOvers(maxOvers);
                finalMatch.setMatchDate("Final");
                matches.add(matchRepository.save(finalMatch));
            }

            return matches;
        }
    }

    @PutMapping("/update-result/{matchId}")
    public Match updateResult(
            @PathVariable Long matchId,
            @RequestParam Integer scoreA,
            @RequestParam Integer scoreB
    ) {

        Match match =
                matchRepository.findById(matchId)
                        .orElseThrow(() ->
                                new RuntimeException("Match not found"));

        if ("COMPLETED".equalsIgnoreCase(match.getStatus())) {
            revertPlayoffWinnerPropagation(match);
            revertPlayerStatsOnMatchCompletion(match);
        }

        match.setScoreA(scoreA);
        match.setScoreB(scoreB);

        match.setStatus("COMPLETED");

        if (scoreA > scoreB) {
            match.setWinner(match.getTeamA());
        } else if (scoreB > scoreA) {
            match.setWinner(match.getTeamB());
        } else {
            throw new RuntimeException(
                    "Draw not allowed");
        }

        updatePlayerStatsOnMatchCompletion(match);

        Match saved = matchRepository.save(match);
        propagatePlayoffWinner(saved);
        return saved;
    }

    @PutMapping("/update-status/{matchId}")
    @org.springframework.transaction.annotation.Transactional
    public Match updateMatchStatus(
            @PathVariable Long matchId,
            @RequestParam String status
    ) {

        Match match =
                matchRepository.findById(matchId)
                        .orElseThrow(() ->
                                new RuntimeException("Match not found"));

        String newStatus = status.toUpperCase();
        String oldStatus = match.getStatus() != null ? match.getStatus().toUpperCase() : "UPCOMING";
        if (!newStatus.equals(oldStatus)) {
            if ("COMPLETED".equals(oldStatus)) {
                revertPlayoffWinnerPropagation(match);
                revertPlayerStatsOnMatchCompletion(match);
            }
            if ("LIVE".equals(newStatus)) {
                resetMatchScoringState(match);
            } else if ("UPCOMING".equals(newStatus) && ("LIVE".equals(oldStatus) || "COMPLETED".equals(oldStatus))) {
                resetMatchScoringState(match);
            } else if ("COMPLETED".equals(newStatus)) {
                updatePlayerStatsOnMatchCompletion(match);
            }
        }

        match.setStatus(status);

        Match saved = matchRepository.save(match);
        if (!newStatus.equals(oldStatus) && "COMPLETED".equals(newStatus)) {
            propagatePlayoffWinner(saved);
        }
        return saved;
    }

    @PostMapping("/generate-semi-final/{tournamentId}")
    public List<Match> generateSemiFinal(
            @PathVariable Long tournamentId
    ) {

        Tournament tournament =
                tournamentRepository.findById(tournamentId)
                        .orElseThrow(() ->
                                new RuntimeException("Tournament not found"));

        List<Match> quarterFinals =
                matchRepository.findByTournamentIdAndRound(
                        tournamentId,
                        "QUARTER_FINAL"
                );

        List<String> winners = new ArrayList<>();

        for (Match match : quarterFinals) {
            winners.add(match.getWinner());
        }

        List<Match> semiFinals = new ArrayList<>();

        for (int i = 0; i < winners.size(); i += 2) {

            Match match = new Match();

            match.setTournament(tournament);
            match.setTeamA(winners.get(i));
            match.setTeamB(winners.get(i + 1));

            match.setRound("SEMI_FINAL");
            match.setStatus("UPCOMING");

            match.setScoreA(0);
            match.setScoreB(0);
            match.setMaxOvers(getMaxOversForGame(tournament.getGame()));

            semiFinals.add(
                    matchRepository.save(match)
            );
        }

        return semiFinals;
    }

    // =========================
    // LIVE SCORING WITH CRICKET RULES
    // =========================

    private Double incrementOvers(Double currentOvers) {
        if (currentOvers == null) {
            currentOvers = 0.0;
        }
        long whole = currentOvers.longValue();
        double fraction = currentOvers - whole;
        long balls = Math.round(fraction * 10.0);
        balls++;
        if (balls >= 6) {
            whole++;
            balls = 0;
        }
        return whole + (balls / 10.0);
    }

    private void checkInningsAndMatchStatus(Match match) {
        if (match.getScoreA() == null) match.setScoreA(0);
        if (match.getScoreB() == null) match.setScoreB(0);
        if (match.getWickets() == null) match.setWickets(0);
        if (match.getOvers() == null) match.setOvers(0.0);
        if (match.getMaxOvers() == null) match.setMaxOvers(20.0);
        if (match.getCurrentInnings() == null) match.setCurrentInnings(1);

        if (match.getCurrentInnings() == 1) {
            boolean inningsOver = false;
            if (match.getWickets() >= 10) {
                inningsOver = true;
                match.setLastEvent("INNINGS 1 END: All Out");
            } else if (match.getOvers() >= match.getMaxOvers()) {
                inningsOver = true;
                match.setLastEvent("INNINGS 1 END: Overs Limit");
            }

            if (inningsOver) {
                match.setFirstInningsOvers(match.getOvers());
                match.setFirstInningsWickets(match.getWickets());
                match.setCurrentInnings(2);
                match.setTargetScore(match.getScoreA() + 1);
                match.setWickets(0);
                match.setOvers(0.0);
                match.setScoreB(0);
                match.setLastEvent("Target: " + match.getTargetScore() + " runs");
            }
        } else {
            boolean matchOver = false;
            String firstBat = getTeamBattingFirst(match);
            String secondBat = getTeamBattingSecond(match);

            if (match.getScoreB() >= match.getTargetScore()) {
                matchOver = true;
                match.setStatus("COMPLETED");
                match.setWinner(secondBat);
                match.setLastEvent(secondBat + " won by " + (10 - match.getWickets()) + " wickets! 🎉");
                updatePlayerStatsOnMatchCompletion(match);
            } else if (match.getWickets() >= 10) {
                matchOver = true;
                match.setStatus("COMPLETED");
                match.setWinner(firstBat);
                match.setLastEvent(firstBat + " won by " + (match.getScoreA() - match.getScoreB()) + " runs! 🎉");
                updatePlayerStatsOnMatchCompletion(match);
            } else if (match.getOvers() >= match.getMaxOvers()) {
                matchOver = true;
                match.setStatus("COMPLETED");
                if (match.getScoreB().equals(match.getScoreA())) {
                    match.setWinner("DRAW");
                    match.setLastEvent("Match Tied! 🤝");
                } else {
                    match.setWinner(firstBat);
                    match.setLastEvent(firstBat + " won by " + (match.getScoreA() - match.getScoreB()) + " runs! 🎉");
                }
                updatePlayerStatsOnMatchCompletion(match);
            }
            if (matchOver) {
                matchRepository.save(match);
                propagatePlayoffWinner(match);
            }
        }
    }

    private void saveRollbackState(Match match) {
        try {
            java.util.Map<String, Object> state = new java.util.HashMap<>();
            state.put("scoreA", match.getScoreA() == null ? 0 : match.getScoreA());
            state.put("scoreB", match.getScoreB() == null ? 0 : match.getScoreB());
            state.put("wickets", match.getWickets() == null ? 0 : match.getWickets());
            state.put("overs", match.getOvers() == null ? 0.0 : match.getOvers());
            state.put("fours", match.getFours() == null ? 0 : match.getFours());
            state.put("sixes", match.getSixes() == null ? 0 : match.getSixes());
            state.put("lastEvent", match.getLastEvent() == null ? "" : match.getLastEvent());
            state.put("currentInnings", match.getCurrentInnings() == null ? 1 : match.getCurrentInnings());
            state.put("targetScore", match.getTargetScore() == null ? 0 : match.getTargetScore());
            state.put("maxOvers", match.getMaxOvers() == null ? 20.0 : match.getMaxOvers());
            state.put("currentBatsman", match.getCurrentBatsman() == null ? "Batsman" : match.getCurrentBatsman());
            state.put("currentNonStriker", match.getCurrentNonStriker() == null ? "Non-Striker" : match.getCurrentNonStriker());
            state.put("currentBowler", match.getCurrentBowler() == null ? "Bowler" : match.getCurrentBowler());
            state.put("batsmanRuns", match.getBatsmanRuns() == null ? 0 : match.getBatsmanRuns());
            state.put("batsmanBalls", match.getBatsmanBalls() == null ? 0 : match.getBatsmanBalls());
            state.put("nonStrikerRuns", match.getNonStrikerRuns() == null ? 0 : match.getNonStrikerRuns());
            state.put("nonStrikerBalls", match.getNonStrikerBalls() == null ? 0 : match.getNonStrikerBalls());
            state.put("bowlerWickets", match.getBowlerWickets() == null ? 0 : match.getBowlerWickets());
            state.put("extras", match.getExtras() == null ? 0 : match.getExtras());
            state.put("status", match.getStatus() == null ? "UPCOMING" : match.getStatus());

            String json = objectMapper.writeValueAsString(state);
            match.setRollbackState(json);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private void rotateStrike(Match match) {
        String tempName = match.getCurrentBatsman();
        match.setCurrentBatsman(match.getCurrentNonStriker());
        match.setCurrentNonStriker(tempName);

        Integer tempRuns = match.getBatsmanRuns() != null ? match.getBatsmanRuns() : 0;
        match.setBatsmanRuns(match.getNonStrikerRuns() != null ? match.getNonStrikerRuns() : 0);
        match.setNonStrikerRuns(tempRuns);

        Integer tempBalls = match.getBatsmanBalls() != null ? match.getBatsmanBalls() : 0;
        match.setBatsmanBalls(match.getNonStrikerBalls() != null ? match.getNonStrikerBalls() : 0);
        match.setNonStrikerBalls(tempBalls);
    }

    @PutMapping("/{matchId}/run/{runs}")
    public Match addRuns(
            @PathVariable Long matchId,
            @PathVariable Integer runs
    ) {
        Match match = matchRepository.findById(matchId)
                .orElseThrow(() -> new RuntimeException("Match not found"));

        validateActivePlayers(match);
        saveRollbackState(match);

        if (match.getFours() == null) match.setFours(0);
        if (match.getSixes() == null) match.setSixes(0);
        if (match.getBatsmanRuns() == null) match.setBatsmanRuns(0);
        if (match.getBatsmanBalls() == null) match.setBatsmanBalls(0);
        if (match.getNonStrikerRuns() == null) match.setNonStrikerRuns(0);
        if (match.getNonStrikerBalls() == null) match.setNonStrikerBalls(0);

        if (match.getCurrentInnings() == null) match.setCurrentInnings(1);

        if (match.getCurrentInnings() == 1) {
            if (match.getScoreA() == null) match.setScoreA(0);
            match.setScoreA(match.getScoreA() + runs);
        } else {
            if (match.getScoreB() == null) match.setScoreB(0);
            match.setScoreB(match.getScoreB() + runs);
        }

        // Accumulate stats for active striker
        match.setBatsmanRuns(match.getBatsmanRuns() + runs);
        match.setBatsmanBalls(match.getBatsmanBalls() + 1);

        if (runs == 4) {
            match.setFours(match.getFours() + 1);
        }
        if (runs == 6) {
            match.setSixes(match.getSixes() + 1);
        }

        // Update player stats
        updatePlayerCareerStats(match, match.getCurrentBatsman(), runs, 1, 0, runs, true);
        updatePlayerCareerStats(match, match.getCurrentBowler(), 0, 1, 0, runs, false);

        // Rotate strike if runs is odd
        if (runs % 2 != 0) {
            rotateStrike(match);
        }

        match.setOvers(incrementOvers(match.getOvers()));
        match.setLastEvent(runs + " RUN" + (runs > 1 ? "S" : ""));

        // Save Commentary
        String striker = match.getCurrentBatsman();
        String bowler = match.getCurrentBowler();
        String desc = striker + " works it away for " + runs + " run(s) off " + bowler + ".";
        if (runs == 4) {
            desc = "FOUR! Beautiful boundary by " + striker + " off " + bowler + "! Shot of the day past cover!";
        } else if (runs == 6) {
            desc = "MAXIMUM! " + striker + " launches " + bowler + " over the ropes for a towering SIX!";
        }
        addCommentaryEvent(match, runs + " RUNS", desc);

        checkOverEnd(match);
        checkInningsAndMatchStatus(match);
        return matchRepository.save(match);
    }

    @PutMapping("/{matchId}/wicket")
    public Match wicket(
            @PathVariable Long matchId
    ) {
        Match match = matchRepository.findById(matchId)
                .orElseThrow(() -> new RuntimeException("Match not found"));

        validateActivePlayers(match);
        saveRollbackState(match);

        if (match.getWickets() == null) match.setWickets(0);
        if (match.getBowlerWickets() == null) match.setBowlerWickets(0);

        String outBatsman = match.getCurrentBatsman();
        String activeBowler = match.getCurrentBowler();

        // Increment batsman stats
        if (outBatsman != null && !"New Batsman".equalsIgnoreCase(outBatsman)) {
            updatePlayerCareerStats(match, outBatsman, 0, 1, 0, 0, true);
            updatePlayerCareerMatches(match, outBatsman);
        }
        // Increment bowler stats
        if (activeBowler != null && !"Bowler".equalsIgnoreCase(activeBowler)) {
            updatePlayerCareerStats(match, activeBowler, 0, 1, 1, 0, false);
        }

        match.setWickets(match.getWickets() + 1);
        match.setBowlerWickets(match.getBowlerWickets() + 1);

        addCommentaryEvent(match, "WICKET", "OUT! " + outBatsman + " is clean bowled! " + activeBowler + " strikes!", outBatsman);

        // Striker is out: reset stats and prompt for next striker
        match.setBatsmanRuns(0);
        match.setBatsmanBalls(0);
        match.setCurrentBatsman("New Batsman");

        match.setOvers(incrementOvers(match.getOvers()));
        match.setLastEvent("WICKET!");

        checkOverEnd(match);
        checkInningsAndMatchStatus(match);
        return matchRepository.save(match);
    }

    @PutMapping("/{matchId}/ball")
    public Match ball(
            @PathVariable Long matchId
    ) {
        Match match = matchRepository.findById(matchId)
                .orElseThrow(() -> new RuntimeException("Match not found"));

        validateActivePlayers(match);
        saveRollbackState(match);

        match.setOvers(incrementOvers(match.getOvers()));
        match.setLastEvent("BALL");

        checkOverEnd(match);
        checkInningsAndMatchStatus(match);
        return matchRepository.save(match);
    }

    @PutMapping("/{matchId}/dot-ball")
    public Match dotBall(
            @PathVariable Long matchId
    ) {
        Match match = matchRepository.findById(matchId)
                .orElseThrow(() -> new RuntimeException("Match not found"));

        validateActivePlayers(match);
        saveRollbackState(match);

        if (match.getBatsmanBalls() == null) match.setBatsmanBalls(0);
        match.setBatsmanBalls(match.getBatsmanBalls() + 1);

        updatePlayerCareerStats(match, match.getCurrentBatsman(), 0, 1, 0, 0, true);
        updatePlayerCareerStats(match, match.getCurrentBowler(), 0, 1, 0, 0, false);

        match.setOvers(incrementOvers(match.getOvers()));
        match.setLastEvent("DOT BALL");

        addCommentaryEvent(match, "DOT BALL", match.getCurrentBowler() + " bowls a dot ball to " + match.getCurrentBatsman() + ".");

        checkOverEnd(match);
        checkInningsAndMatchStatus(match);
        return matchRepository.save(match);
    }

    @PutMapping("/{matchId}/leg-bye")
    public Match legBye(
            @PathVariable Long matchId
    ) {
        Match match = matchRepository.findById(matchId)
                .orElseThrow(() -> new RuntimeException("Match not found"));

        validateActivePlayers(match);
        saveRollbackState(match);

        if (match.getExtras() == null) match.setExtras(0);
        if (match.getBatsmanBalls() == null) match.setBatsmanBalls(0);

        match.setBatsmanBalls(match.getBatsmanBalls() + 1);
        match.setExtras(match.getExtras() + 1);

        if (match.getCurrentInnings() == null) match.setCurrentInnings(1);

        if (match.getCurrentInnings() == 1) {
            if (match.getScoreA() == null) match.setScoreA(0);
            match.setScoreA(match.getScoreA() + 1);
        } else {
            if (match.getScoreB() == null) match.setScoreB(0);
            match.setScoreB(match.getScoreB() + 1);
        }

        match.setOvers(incrementOvers(match.getOvers()));
        match.setLastEvent("LEG BYE (+1 Run)");
        addCommentaryEvent(match, "LEG BYE", match.getCurrentBowler() + " bowls a leg bye to " + match.getCurrentBatsman() + ".");

        rotateStrike(match); // Rotate strike for the single run taken on leg bye

        checkOverEnd(match);
        checkInningsAndMatchStatus(match);
        return matchRepository.save(match);
    }

    @PutMapping("/{matchId}/wide")
    public Match logWide(
            @PathVariable Long matchId
    ) {
        Match match = matchRepository.findById(matchId)
                .orElseThrow(() -> new RuntimeException("Match not found"));

        validateActivePlayers(match);
        saveRollbackState(match);

        if (match.getExtras() == null) match.setExtras(0);
        match.setExtras(match.getExtras() + 1);

        if (match.getCurrentInnings() == null) match.setCurrentInnings(1);

        if (match.getCurrentInnings() == 1) {
            if (match.getScoreA() == null) match.setScoreA(0);
            match.setScoreA(match.getScoreA() + 1);
        } else {
            if (match.getScoreB() == null) match.setScoreB(0);
            match.setScoreB(match.getScoreB() + 1);
        }

        match.setLastEvent("WIDE (+1 Run)");
        addCommentaryEvent(match, "WIDE", match.getCurrentBowler() + " bowls a wide to " + match.getCurrentBatsman() + ".");
        checkInningsAndMatchStatus(match);
        return matchRepository.save(match);
    }

    @PutMapping("/{matchId}/no-ball")
    public Match logNoBall(
            @PathVariable Long matchId
    ) {
        Match match = matchRepository.findById(matchId)
                .orElseThrow(() -> new RuntimeException("Match not found"));

        validateActivePlayers(match);
        saveRollbackState(match);

        if (match.getExtras() == null) match.setExtras(0);
        match.setExtras(match.getExtras() + 1);

        if (match.getCurrentInnings() == null) match.setCurrentInnings(1);

        if (match.getCurrentInnings() == 1) {
            if (match.getScoreA() == null) match.setScoreA(0);
            match.setScoreA(match.getScoreA() + 1);
        } else {
            if (match.getScoreB() == null) match.setScoreB(0);
            match.setScoreB(match.getScoreB() + 1);
        }

        match.setLastEvent("NO BALL (+1 Run)");
        addCommentaryEvent(match, "NO BALL", match.getCurrentBowler() + " bowls a no ball to " + match.getCurrentBatsman() + ".");
        checkInningsAndMatchStatus(match);
        return matchRepository.save(match);
    }

    @PutMapping("/{matchId}/rotate-strike")
    public Match manualRotateStrike(
            @PathVariable Long matchId
    ) {
        Match match = matchRepository.findById(matchId)
                .orElseThrow(() -> new RuntimeException("Match not found"));

        saveRollbackState(match);

        rotateStrike(match);
        match.setLastEvent("STRIKE ROTATED");
        return matchRepository.save(match);
    }

    @PutMapping("/{matchId}/undo")
    public Match undo(
            @PathVariable Long matchId
    ) {
        Match match = matchRepository.findById(matchId)
                .orElseThrow(() -> new RuntimeException("Match not found"));

        String rollbackJson = match.getRollbackState();
        if (rollbackJson == null || rollbackJson.trim().isEmpty()) {
            throw new RuntimeException("No event to undo");
        }

        try {
            java.util.Map<String, Object> state = objectMapper.readValue(rollbackJson, java.util.Map.class);
            match.setScoreA((Integer) state.get("scoreA"));
            match.setScoreB((Integer) state.get("scoreB"));
            match.setWickets((Integer) state.get("wickets"));
            match.setOvers(((Number) state.get("overs")).doubleValue());
            match.setFours((Integer) state.get("fours"));
            match.setSixes((Integer) state.get("sixes"));
            match.setLastEvent((String) state.get("lastEvent"));
            match.setCurrentInnings((Integer) state.get("currentInnings"));
            match.setTargetScore((Integer) state.get("targetScore"));
            match.setMaxOvers(((Number) state.get("maxOvers")).doubleValue());
            match.setCurrentBatsman((String) state.get("currentBatsman"));
            match.setCurrentNonStriker((String) state.get("currentNonStriker"));
            match.setCurrentBowler((String) state.get("currentBowler"));
            match.setBatsmanRuns((Integer) state.get("batsmanRuns"));
            match.setBatsmanBalls((Integer) state.get("batsmanBalls"));
            match.setNonStrikerRuns((Integer) state.get("nonStrikerRuns"));
            match.setNonStrikerBalls((Integer) state.get("nonStrikerBalls"));
            match.setBowlerWickets((Integer) state.get("bowlerWickets"));
            match.setExtras((Integer) state.get("extras"));
            match.setStatus((String) state.get("status"));
            
            // Clear rollback to prevent double undo
            match.setRollbackState(null);
            
            return matchRepository.save(match);
        } catch (Exception e) {
            throw new RuntimeException("Failed to undo: " + e.getMessage());
        }
    }

    @PutMapping("/{matchId}/wicket-detail")
    public Match wicketDetail(
            @PathVariable Long matchId,
            @RequestParam String dismissalType, // Bowled, Caught, LBW, Run Out, Stumped, Retired Hurt
            @RequestParam(required = false) String fielder
    ) {
        Match match = matchRepository.findById(matchId)
                .orElseThrow(() -> new RuntimeException("Match not found"));

        validateActivePlayers(match);
        saveRollbackState(match);

        if (match.getWickets() == null) match.setWickets(0);
        if (match.getBowlerWickets() == null) match.setBowlerWickets(0);

        // If it's a dismissal that increments wickets (everything except Retired Hurt)
        if (!"Retired Hurt".equalsIgnoreCase(dismissalType)) {
            match.setWickets(match.getWickets() + 1);
            // Run Outs do not credit the bowler with a wicket
            if (!"Run Out".equalsIgnoreCase(dismissalType)) {
                match.setBowlerWickets(match.getBowlerWickets() + 1);
            }
        }

        // Process fielder career stats if provided
        if (fielder != null && !fielder.trim().isEmpty()) {
            List<Player> players = playerRepository.findAll();
            for (Player p : players) {
                if (p.getPlayerName().equalsIgnoreCase(fielder)) {
                    if ("Caught".equalsIgnoreCase(dismissalType) || "Caught & Bowled".equalsIgnoreCase(dismissalType)) {
                        p.setCatches((p.getCatches() == null ? 0 : p.getCatches()) + 1);
                    } else if ("Stumped".equalsIgnoreCase(dismissalType)) {
                        p.setStumpings((p.getStumpings() == null ? 0 : p.getStumpings()) + 1);
                    } else if ("Run Out".equalsIgnoreCase(dismissalType)) {
                        p.setRunouts((p.getRunouts() == null ? 0 : p.getRunouts()) + 1);
                    }
                    playerRepository.save(p);
                    break;
                }
            }
        }

        // Increment matches played / stats for batsman who gets out
        String outBatsman = match.getCurrentBatsman();
        String bowler = match.getCurrentBowler();
        if (outBatsman != null && !"New Batsman".equalsIgnoreCase(outBatsman)) {
            List<Player> players = playerRepository.findAll();
            for (Player p : players) {
                if (p.getPlayerName().equalsIgnoreCase(outBatsman)) {
                    p.setMatchesPlayed((p.getMatchesPlayed() == null ? 0 : p.getMatchesPlayed()) + 1);
                    p.setBattingInnings((p.getBattingInnings() == null ? 0 : p.getBattingInnings()) + 1);
                    p.setBattingBalls((p.getBattingBalls() == null ? 0 : p.getBattingBalls()) + 1);
                    playerRepository.save(p);
                    break;
                }
            }
        }

        // Process bowler wicket stats if not run out
        if (!"Run Out".equalsIgnoreCase(dismissalType) && !"Retired Hurt".equalsIgnoreCase(dismissalType) && bowler != null) {
            updatePlayerCareerStats(match, bowler, 0, 1, 1, 0, false);
        }

        // Add commentary
        String desc = "WICKET! " + outBatsman + " is dismissed (" + dismissalType + ")";
        if (fielder != null && !fielder.trim().isEmpty()) {
            desc += " caught/assisted by " + fielder;
        }
        desc += " off the bowling of " + bowler + ".";
        addCommentaryEvent(match, "WICKET", desc, outBatsman);

        // Reset batsman stats
        match.setBatsmanRuns(0);
        match.setBatsmanBalls(0);
        match.setCurrentBatsman("New Batsman");

        match.setOvers(incrementOvers(match.getOvers()));
        match.setLastEvent("OUT! (" + dismissalType + (fielder != null && !fielder.trim().isEmpty() ? " by " + fielder : "") + ")");

        checkOverEnd(match);
        checkInningsAndMatchStatus(match);
        return matchRepository.save(match);
    }

    @PutMapping("/{matchId}/lbw")
    public Match lbw(
            @PathVariable Long matchId
    ) {
        Match match = matchRepository.findById(matchId)
                .orElseThrow(() -> new RuntimeException("Match not found"));

        match.setLastEvent("LBW APPEAL");
        return matchRepository.save(match);
    }

    @PutMapping("/{matchId}/inning-break")
    public Match inningBreak(
            @PathVariable Long matchId
    ) {
        Match match = matchRepository.findById(matchId)
                .orElseThrow(() -> new RuntimeException("Match not found"));

        match.setFirstInningsOvers(match.getOvers());
        match.setFirstInningsWickets(match.getWickets());
        match.setCurrentInnings(2);
        match.setTargetScore((match.getScoreA() == null ? 0 : match.getScoreA()) + 1);
        match.setWickets(0);
        match.setOvers(0.0);
        match.setScoreB(0);
        match.setLastEvent("Innings Break: Target " + match.getTargetScore());
        return matchRepository.save(match);
    }

    @PutMapping("/{matchId}/second-innings")
    public Match secondInnings(
            @PathVariable Long matchId
    ) {
        Match match = matchRepository.findById(matchId)
                .orElseThrow(() -> new RuntimeException("Match not found"));

        match.setFirstInningsOvers(match.getOvers());
        match.setFirstInningsWickets(match.getWickets());
        match.setCurrentInnings(2);
        match.setScoreB(0);
        match.setWickets(0);
        match.setOvers(0.0);
        match.setLastEvent("SECOND INNING START");
        return matchRepository.save(match);
    }

    @PutMapping("/{matchId}/return-innings-1")
    public Match returnToFirstInnings(
            @PathVariable Long matchId
    ) {
        Match match = matchRepository.findById(matchId)
                .orElseThrow(() -> new RuntimeException("Match not found"));

        saveRollbackState(match);

        match.setFirstInningsOvers(0.0);
        match.setFirstInningsWickets(0);
        match.setCurrentInnings(1);
        match.setTargetScore(0);
        match.setLastEvent("Returned to Innings 1");
        return matchRepository.save(match);
    }

    @PostMapping("/generate-final/{tournamentId}")
    public Match generateFinal(
            @PathVariable Long tournamentId
    ) {

        Tournament tournament =
                tournamentRepository.findById(tournamentId)
                        .orElseThrow(() ->
                                new RuntimeException("Tournament not found"));

        List<Match> semiFinals =
                matchRepository.findByTournamentIdAndRound(
                        tournamentId,
                        "SEMI_FINAL"
                );

        List<String> winners =
                new ArrayList<>();

        for (Match match : semiFinals) {
            winners.add(match.getWinner());
        }

        Match finalMatch =
                new Match();

        finalMatch.setTournament(
                tournament
        );

        finalMatch.setTeamA(
                winners.get(0)
        );

        finalMatch.setTeamB(
                winners.get(1)
        );

        finalMatch.setRound("FINAL");

        finalMatch.setStatus("UPCOMING");

        finalMatch.setScoreA(0);
        finalMatch.setScoreB(0);
        finalMatch.setMaxOvers(getMaxOversForGame(tournament.getGame()));

        return matchRepository.save(
                finalMatch
        );
    }

    @PutMapping("/{matchId}/reset")
    @org.springframework.transaction.annotation.Transactional
    public Match resetMatch(@PathVariable Long matchId) {
        Match match = matchRepository.findById(matchId)
                .orElseThrow(() -> new RuntimeException("Match not found"));
        if ("COMPLETED".equals(match.getStatus())) {
            revertPlayoffWinnerPropagation(match);
            revertPlayerStatsOnMatchCompletion(match);
        }
        resetMatchScoringState(match);
        return matchRepository.save(match);
    }

    @PutMapping("/{matchId}/players")
    public Match updateMatchPlayers(
            @PathVariable Long matchId,
            @RequestParam(required = false) String batsman,
            @RequestParam(required = false) String nonStriker,
            @RequestParam(required = false) String bowler
    ) {
        Match match = matchRepository.findById(matchId)
                .orElseThrow(() -> new RuntimeException("Match not found"));
        if (batsman != null && !batsman.trim().isEmpty()) {
            if (!batsman.equals(match.getCurrentBatsman())) {
                match.setCurrentBatsman(batsman);
                match.setBatsmanRuns(0);
                match.setBatsmanBalls(0);
            }
        }
        if (nonStriker != null && !nonStriker.trim().isEmpty()) {
            if (!nonStriker.equals(match.getCurrentNonStriker())) {
                match.setCurrentNonStriker(nonStriker);
                match.setNonStrikerRuns(0);
                match.setNonStrikerBalls(0);
            }
        }
        if (bowler != null && !bowler.trim().isEmpty() && !"Bowler".equalsIgnoreCase(bowler)) {
            if (!bowler.equalsIgnoreCase(match.getCurrentBowler())) {
                if (bowler.equalsIgnoreCase(match.getLastBowler())) {
                    throw new org.springframework.web.server.ResponseStatusException(
                        org.springframework.http.HttpStatus.BAD_REQUEST,
                        "Bowler " + bowler + " cannot bowl consecutive overs. Please select a different bowler."
                    );
                }
                long ballsBowled = commentaryRepository.findByMatchIdOrderByTimestampDesc(matchId).stream()
                    .filter(c -> c.getBowlerName() != null && c.getBowlerName().equalsIgnoreCase(bowler))
                    .filter(c -> !"WIDE".equalsIgnoreCase(c.getEvent()) && !"NO BALL".equalsIgnoreCase(c.getEvent()) && !"OVER END".equalsIgnoreCase(c.getEvent()))
                    .count();
                if (ballsBowled >= 24) {
                    throw new org.springframework.web.server.ResponseStatusException(
                        org.springframework.http.HttpStatus.BAD_REQUEST,
                        "Bowler " + bowler + " has already bowled 4 overs (24 balls) in this match."
                    );
                }
                match.setCurrentBowler(bowler);
                match.setBowlerWickets(0);
            }
        }
        return matchRepository.save(match);
    }

    @PutMapping("/{id}")
    @org.springframework.transaction.annotation.Transactional
    public Match updateMatch(@PathVariable Long id, @RequestBody java.util.Map<String, Object> payload) {
        Match match = matchRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Match not found"));

        boolean statusChangedToUpcomingOrLive = false;
        String newStatus = null;
        if (payload.containsKey("status") && payload.get("status") != null) {
            newStatus = payload.get("status").toString().toUpperCase();
        }
        String oldStatus = match.getStatus() != null ? match.getStatus().toUpperCase() : "UPCOMING";
        boolean statusChanged = newStatus != null && !newStatus.equals(oldStatus);

        if (statusChanged) {
            if ("COMPLETED".equals(oldStatus)) {
                revertPlayerStatsOnMatchCompletion(match);
            }
            if ("LIVE".equals(newStatus)) {
                resetMatchScoringState(match);
                statusChangedToUpcomingOrLive = true;
            } else if ("UPCOMING".equals(newStatus) && ("LIVE".equals(oldStatus) || "COMPLETED".equals(oldStatus))) {
                resetMatchScoringState(match);
                statusChangedToUpcomingOrLive = true;
            }
        }

        try {
            if (statusChangedToUpcomingOrLive) {
                // Remove all scoring-related fields so the reset values are not overwritten by stale client data
                String[] scoringKeys = {
                    "scoreA", "scorea", "scoreB", "scoreb", "wickets", "overs", "fours", "sixes", 
                    "lastEvent", "lastevent", "currentInnings", "currentinnings", "targetScore", "targetscore",
                    "currentBatsman", "currentbatsman", "currentNonStriker", "currentnonstriker", 
                    "currentBowler", "currentbowler", "batsmanRuns", "batsmanruns", "batsmanBalls", "batsmanballs",
                    "nonStrikerRuns", "nonstrikerruns", "nonStrikerBalls", "nonstrikerballs", 
                    "bowlerWickets", "bowlerwickets", "extras", "rollbackState", "rollbackstate",
                    "lastBowler", "lastbowler"
                };
                for (String key : scoringKeys) {
                    payload.remove(key);
                }
            }

            // Map tournament if present in the payload
            if (payload.containsKey("tournament") && payload.get("tournament") instanceof java.util.Map) {
                java.util.Map<?, ?> tMap = (java.util.Map<?, ?>) payload.get("tournament");
                if (tMap.containsKey("id") && tMap.get("id") != null) {
                    Long tId = Long.valueOf(tMap.get("id").toString());
                    Tournament tournament = tournamentRepository.findById(tId)
                        .orElseThrow(() -> new RuntimeException("Tournament not found"));
                    match.setTournament(tournament);
                }
                payload.remove("tournament");
            }

            objectMapper.readerForUpdating(match).readValue(objectMapper.writeValueAsString(payload));
            
            if (statusChanged && "COMPLETED".equals(newStatus)) {
                updatePlayerStatsOnMatchCompletion(match);
            }
        } catch (Exception e) {
            throw new RuntimeException("Failed to update match: " + e.getMessage());
        }

        Match saved = matchRepository.save(match);
        if (statusChanged && "COMPLETED".equals(newStatus)) {
            propagatePlayoffWinner(saved);
        }
        return saved;
    }


    @PutMapping("/{matchId}/toss")
    public Match updateMatchToss(
            @PathVariable Long matchId,
            @RequestParam String tossWinner,
            @RequestParam String tossDecision
    ) {
        Match match = matchRepository.findById(matchId)
                .orElseThrow(() -> new RuntimeException("Match not found"));
        match.setTossWinner(tossWinner);
        match.setTossDecision(tossDecision);
        
        // Also log this in match commentary
        addCommentaryEvent(match, "TOSS", tossWinner + " won the toss and elected to " + ("BAT".equalsIgnoreCase(tossDecision) ? "bat" : "field") + " first.");
        
        return matchRepository.save(match);
    }

    @GetMapping("/{matchId}/commentary")
    public List<Commentary> getMatchCommentary(@PathVariable Long matchId) {
        return commentaryRepository.findByMatchIdOrderByTimestampDesc(matchId);
    }

    @DeleteMapping("/commentary/{commentaryId}")
    public void deleteCommentary(@PathVariable Long commentaryId) {
        commentaryRepository.deleteById(commentaryId);
    }

    @GetMapping("/{matchId}/chat")
    public List<ChatMessage> getMatchChat(@PathVariable Long matchId) {
        return chatMessageRepository.findByMatchIdOrderByTimestampAsc(matchId);
    }

    @PostMapping("/{matchId}/chat")
    public ChatMessage postMatchChat(
            @PathVariable Long matchId,
            @RequestBody ChatMessage chatMessage
    ) {
        chatMessage.setMatchId(matchId);
        chatMessage.setTimestamp(java.time.LocalDateTime.now());
        return chatMessageRepository.save(chatMessage);
    }

    @DeleteMapping("/{id}")
    @org.springframework.transaction.annotation.Transactional
    public String deleteMatch(@PathVariable Long id) {
        Match match = matchRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Match not found"));
        
        commentaryRepository.deleteByMatchId(id);
        chatMessageRepository.deleteByMatchId(id);
        matchRepository.delete(match);
        return "Match deleted successfully";
    }

    @DeleteMapping("/all")
    @org.springframework.transaction.annotation.Transactional
    public String deleteAllMatches() {
        commentaryRepository.deleteAll();
        chatMessageRepository.deleteAll();
        matchRepository.deleteAll();
        return "All matches deleted successfully";
    }
}