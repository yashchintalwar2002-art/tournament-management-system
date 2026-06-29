package com.tournament.tournament_app.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import com.tournament.tournament_app.entity.Tournament;
import com.tournament.tournament_app.repository.TournamentRepository;

@RestController
@RequestMapping("/tournaments")
@CrossOrigin(origins = "*")
public class TournamentController {

    @Autowired
    private TournamentRepository tournamentRepository;

    @PostMapping
    public Tournament createTournament(@RequestBody Tournament tournament, @RequestHeader(value = "X-User-Email", required = false) String userEmail) {
        if (userEmail != null && !userEmail.trim().isEmpty()) {
            tournament.setCreatedBy(userEmail.trim());
        }
        return tournamentRepository.save(tournament);
    }

    @GetMapping
    public List<Tournament> getAllTournaments() {
        return tournamentRepository.findAll();
    }

    @GetMapping("/{id}")
    public Tournament getTournamentById(@PathVariable Long id) {
        return tournamentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Tournament not found"));
    }

    @PutMapping("/{id}")
    public Tournament updateTournament(@PathVariable Long id, @RequestBody Tournament updatedTournament, @RequestHeader(value = "X-User-Email", required = false) String userEmail) {
        Tournament tournament = tournamentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Tournament not found"));

        if (!hasAccess(tournament, userEmail)) {
            throw new org.springframework.web.server.ResponseStatusException(
                org.springframework.http.HttpStatus.FORBIDDEN,
                "You do not have write access to this tournament."
            );
        }

        tournament.setName(updatedTournament.getName());
        tournament.setGame(updatedTournament.getGame());
        tournament.setMaxPlayers(updatedTournament.getMaxPlayers());
        
        tournament.setLogo(updatedTournament.getLogo() != null ? updatedTournament.getLogo() : "");
        tournament.setOrganizer(updatedTournament.getOrganizer() != null ? updatedTournament.getOrganizer() : "");
        tournament.setDescription(updatedTournament.getDescription() != null ? updatedTournament.getDescription() : "");
        tournament.setCity(updatedTournament.getCity() != null ? updatedTournament.getCity() : "");
        tournament.setGround(updatedTournament.getGround() != null ? updatedTournament.getGround() : "");
        tournament.setStartDate(updatedTournament.getStartDate() != null ? updatedTournament.getStartDate() : "");
        tournament.setEndDate(updatedTournament.getEndDate() != null ? updatedTournament.getEndDate() : "");
        tournament.setFormat(updatedTournament.getFormat() != null ? updatedTournament.getFormat() : "T20");
        tournament.setStructure(updatedTournament.getStructure() != null ? updatedTournament.getStructure() : "LEAGUE");
        tournament.setEntryFee(updatedTournament.getEntryFee() != null ? updatedTournament.getEntryFee() : 0.0);
        tournament.setMaxTeams(updatedTournament.getMaxTeams() != null ? updatedTournament.getMaxTeams() : 16);
        tournament.setOvers(updatedTournament.getOvers() != null ? updatedTournament.getOvers() : 20);
        tournament.setPointsForWin(updatedTournament.getPointsForWin() != null ? updatedTournament.getPointsForWin() : 2);
        tournament.setPowerplayOvers(updatedTournament.getPowerplayOvers() != null ? updatedTournament.getPowerplayOvers() : 6);
        tournament.setSuperOver(updatedTournament.getSuperOver() != null ? updatedTournament.getSuperOver() : false);

        return tournamentRepository.save(tournament);
    }

    @Autowired
    private com.tournament.tournament_app.repository.TeamRepository teamRepository;

    @Autowired
    private com.tournament.tournament_app.repository.PlayerRepository playerRepository;

    @Autowired
    private com.tournament.tournament_app.repository.MatchRepository matchRepository;

    @Autowired
    private com.tournament.tournament_app.repository.TournamentRegistrationRepository tournamentRegistrationRepository;

    @Autowired
    private com.tournament.tournament_app.repository.CommentaryRepository commentaryRepository;

    @Autowired
    private com.tournament.tournament_app.repository.ChatMessageRepository chatMessageRepository;

    @DeleteMapping("/{id}")
    @org.springframework.transaction.annotation.Transactional
    public String deleteTournament(@PathVariable Long id, @RequestHeader(value = "X-User-Email", required = false) String userEmail) {
        Tournament tournament = tournamentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Tournament not found"));

        String creator = tournament.getCreatedBy();
        if (creator != null && !creator.trim().isEmpty()) {
            if (userEmail == null || !creator.equalsIgnoreCase(userEmail.trim())) {
                throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.FORBIDDEN,
                    "Only the tournament creator can delete this tournament."
                );
            }
        }

        // 1. Delete all tournament registrations
        List<com.tournament.tournament_app.entity.TournamentRegistration> regs = tournamentRegistrationRepository.findByTournamentId(id);
        tournamentRegistrationRepository.deleteAll(regs);

        // 2. Delete all matches (along with commentary and chat logs)
        List<com.tournament.tournament_app.entity.Match> matches = matchRepository.findByTournamentId(id);
        for (com.tournament.tournament_app.entity.Match match : matches) {
            commentaryRepository.deleteByMatchId(match.getId());
            chatMessageRepository.deleteByMatchId(match.getId());
        }
        matchRepository.deleteAll(matches);

        // 3. Delete players of teams and then the teams
        List<com.tournament.tournament_app.entity.Team> teams = teamRepository.findByTournamentId(id);
        for (com.tournament.tournament_app.entity.Team team : teams) {
            List<com.tournament.tournament_app.entity.Player> players = playerRepository.findByTeamId(team.getId());
            playerRepository.deleteAll(players);
        }
        teamRepository.deleteAll(teams);

        // 4. Finally delete the tournament itself
        tournamentRepository.delete(tournament);
        return "Tournament deleted successfully ✅";
    }

    @GetMapping("/{id}/leaderboard")
    public java.util.Map<String, List<com.tournament.tournament_app.entity.Player>> getTournamentLeaderboard(@PathVariable Long id) {
        List<com.tournament.tournament_app.entity.Team> teams = teamRepository.findByTournamentId(id);
        List<com.tournament.tournament_app.entity.Player> allPlayers = new java.util.ArrayList<>();
        for (com.tournament.tournament_app.entity.Team team : teams) {
            allPlayers.addAll(playerRepository.findByTeamId(team.getId()));
        }

        // 1. Orange Cap (Top Batsmen)
        List<com.tournament.tournament_app.entity.Player> orangeCap = new java.util.ArrayList<>(allPlayers);
        orangeCap.sort((p1, p2) -> {
            int runs1 = p1.getBattingRuns() == null ? 0 : p1.getBattingRuns();
            int runs2 = p2.getBattingRuns() == null ? 0 : p2.getBattingRuns();
            return Integer.compare(runs2, runs1);
        });
        if (orangeCap.size() > 10) {
            orangeCap = orangeCap.subList(0, 10);
        }

        // 2. Purple Cap (Top Bowlers)
        List<com.tournament.tournament_app.entity.Player> purpleCap = new java.util.ArrayList<>(allPlayers);
        purpleCap.sort((p1, p2) -> {
            int wickets1 = p1.getBowlingWickets() == null ? 0 : p1.getBowlingWickets();
            int wickets2 = p2.getBowlingWickets() == null ? 0 : p2.getBowlingWickets();
            return Integer.compare(wickets2, wickets1);
        });
        if (purpleCap.size() > 10) {
            purpleCap = purpleCap.subList(0, 10);
        }

        // 3. MVP ranking
        List<com.tournament.tournament_app.entity.Player> mvp = new java.util.ArrayList<>(allPlayers);
        mvp.sort((p1, p2) -> {
            int runs1 = p1.getBattingRuns() == null ? 0 : p1.getBattingRuns();
            int wickets1 = p1.getBowlingWickets() == null ? 0 : p1.getBowlingWickets();
            double mvp1 = (runs1 * 1.0) + (wickets1 * 20.0);

            int runs2 = p2.getBattingRuns() == null ? 0 : p2.getBattingRuns();
            int wickets2 = p2.getBowlingWickets() == null ? 0 : p2.getBowlingWickets();
            double mvp2 = (runs2 * 1.0) + (wickets2 * 20.0);

            return Double.compare(mvp2, mvp1);
        });
        if (mvp.size() > 10) {
            mvp = mvp.subList(0, 10);
        }

        java.util.Map<String, List<com.tournament.tournament_app.entity.Player>> result = new java.util.HashMap<>();
        result.put("orangeCap", orangeCap);
        result.put("purpleCap", purpleCap);
        result.put("mvp", mvp);
        return result;
    }

    @PutMapping("/{id}/share")
    public Tournament shareTournament(
            @PathVariable Long id,
            @RequestParam String email,
            @RequestParam String action, // "ADD" or "REMOVE"
            @RequestHeader(value = "X-User-Email", required = false) String userEmail) {
        
        Tournament tournament = tournamentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Tournament not found"));

        // Only the creator can share
        String creator = tournament.getCreatedBy();
        if (creator != null && !creator.trim().isEmpty()) {
            if (userEmail == null || !creator.equalsIgnoreCase(userEmail.trim())) {
                throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.FORBIDDEN,
                    "Only the tournament creator can manage collaborators."
                );
            }
        }

        String collaboratorsStr = tournament.getCollaborators();
        java.util.Set<String> collaboratorSet = new java.util.LinkedHashSet<>();
        if (collaboratorsStr != null && !collaboratorsStr.trim().isEmpty()) {
            for (String c : collaboratorsStr.split(",")) {
                if (!c.trim().isEmpty()) {
                    collaboratorSet.add(c.trim().toLowerCase());
                }
            }
        }

        String targetEmail = email.trim().toLowerCase();
        if ("ADD".equalsIgnoreCase(action)) {
            collaboratorSet.add(targetEmail);
        } else if ("REMOVE".equalsIgnoreCase(action)) {
            collaboratorSet.remove(targetEmail);
        }

        tournament.setCollaborators(String.join(",", collaboratorSet));
        return tournamentRepository.save(tournament);
    }

    private boolean hasAccess(Tournament tournament, String userEmail) {
        String creator = tournament.getCreatedBy();
        if (creator == null || creator.trim().isEmpty()) {
            creator = "admin@gmail.com";
        }
        if (userEmail == null || userEmail.trim().isEmpty()) {
            return false;
        }
        if (creator.equalsIgnoreCase(userEmail.trim())) {
            return true;
        }
        String collaborators = tournament.getCollaborators();
        if (collaborators != null && !collaborators.trim().isEmpty()) {
            String[] collabs = collaborators.split(",");
            for (String collab : collabs) {
                if (collab.trim().equalsIgnoreCase(userEmail.trim())) {
                    return true;
                }
            }
        }
        return false;
    }
}
