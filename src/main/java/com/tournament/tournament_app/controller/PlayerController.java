package com.tournament.tournament_app.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import com.tournament.tournament_app.entity.Player;
import com.tournament.tournament_app.entity.Team;
import com.tournament.tournament_app.repository.PlayerRepository;
import com.tournament.tournament_app.repository.TeamRepository;
import java.util.List;

@RestController
@RequestMapping("/players")
@CrossOrigin(origins = "*")
public class PlayerController {

    @Autowired
    private PlayerRepository playerRepository;

    @Autowired
    private TeamRepository teamRepository;

    @Autowired
    private com.tournament.tournament_app.repository.UserRepository userRepository;

    @GetMapping("/team/{teamId}")
    public List<Player> getPlayersByTeam(@PathVariable Long teamId) {
        return playerRepository.findByTeamId(teamId);
    }

    @PostMapping("/add/{teamId}")
    public Player addPlayer(
            @PathVariable Long teamId,
            @RequestBody Player player,
            @RequestHeader(value = "X-User-Email", required = false) String userEmail
    ) {
        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new RuntimeException("Team not found"));
        
        validateTournamentAccess(team, userEmail);
        
        if (team.getTournament() != null) {
            com.tournament.tournament_app.entity.Tournament tournament = team.getTournament();
            SportConfig config = getSportConfig(tournament.getGame(), tournament.getMaxPlayers());
            
            List<Player> currentPlayers = playerRepository.findByTeamId(teamId);
            long totalCount = currentPlayers.size();
            long starterCount = currentPlayers.stream().filter(p -> !p.getIsSubstitute()).count();
            
            if (totalCount >= config.maxRoster) {
                throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.BAD_REQUEST,
                    "Cannot add player. The maximum roster limit of " + config.maxRoster + " players for " + config.gameName + " is already reached."
                );
            }
            
            if (!player.getIsSubstitute() && starterCount >= config.maxStarters) {
                throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.BAD_REQUEST,
                    "Cannot add starter. The maximum playing squad of " + config.maxStarters + " players (Starting XI) for " + config.gameName + " is already reached. Please register the player as a substitute."
                );
            }
        }
        
        player.setTeam(team);
        
        // Default career stats & profile fields
        if (player.getIsSubstitute() == null) player.setIsSubstitute(false);
        if (player.getMatchesPlayed() == null) player.setMatchesPlayed(0);
        if (player.getBattingRuns() == null) player.setBattingRuns(0);
        if (player.getBattingBalls() == null) player.setBattingBalls(0);
        if (player.getBattingInnings() == null) player.setBattingInnings(0);
        if (player.getBowlingWickets() == null) player.setBowlingWickets(0);
        if (player.getBowlingRunsConceded() == null) player.setBowlingRunsConceded(0);
        if (player.getBowlingOvers() == null) player.setBowlingOvers(0);
        if (player.getCatches() == null) player.setCatches(0);
        if (player.getRunouts() == null) player.setRunouts(0);
        if (player.getStumpings() == null) player.setStumpings(0);
        if (player.getTeamRole() == null) player.setTeamRole("MEMBER");
        if (player.getBattingHand() == null) player.setBattingHand("Right Hand");
        if (player.getBowlingStyle() == null) player.setBowlingStyle("Right-arm Fast");
        if (player.getCity() == null) player.setCity("");
        if (player.getDob() == null) player.setDob("");
        if (player.getAvatarUrl() == null) player.setAvatarUrl("");

        return playerRepository.save(player);
    }

    @PutMapping("/{id}")
    public Player updatePlayer(@PathVariable Long id, @RequestBody Player updatedPlayer, @RequestHeader(value = "X-User-Email", required = false) String userEmail) {
        Player player = playerRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Player not found"));
        
        boolean isSelf = false;
        if (userEmail != null && !userEmail.trim().isEmpty()) {
            com.tournament.tournament_app.entity.User user = userRepository.findByEmail(userEmail.trim());
            System.err.println("DEBUG UPDATE PLAYER - userEmail: [" + userEmail + "], foundUser: " + (user != null ? "YES" : "NO"));
            if (user != null) {
                System.err.println("DEBUG UPDATE PLAYER - user mobile: [" + user.getMobileNumber() + "], player mobile: [" + player.getMobileNumber() + "]");
            }
            if (user != null && user.getMobileNumber() != null && player.getMobileNumber() != null) {
                if (user.getMobileNumber().trim().equals(player.getMobileNumber().trim())) {
                    isSelf = true;
                }
            }
        }
        if (!isSelf) {
            validateTournamentAccess(player.getTeam(), userEmail);
        }
        
        if (updatedPlayer.getIsSubstituteRaw() != null && !updatedPlayer.getIsSubstituteRaw() && player.getIsSubstitute()) {
            Team team = player.getTeam();
            if (team != null && team.getTournament() != null) {
                com.tournament.tournament_app.entity.Tournament tournament = team.getTournament();
                SportConfig config = getSportConfig(tournament.getGame(), tournament.getMaxPlayers());
                
                List<Player> currentPlayers = playerRepository.findByTeamId(team.getId());
                long starterCount = currentPlayers.stream().filter(p -> !p.getIsSubstitute()).count();
                if (starterCount >= config.maxStarters) {
                    throw new org.springframework.web.server.ResponseStatusException(
                        org.springframework.http.HttpStatus.BAD_REQUEST,
                        "Cannot change player to starter. The maximum playing squad of " + config.maxStarters + " players (Starting XI) for " + config.gameName + " is already reached."
                    );
                }
            }
        }
        
        player.setPlayerName(updatedPlayer.getPlayerName());
        player.setJerseyNumber(updatedPlayer.getJerseyNumber());
        player.setRole(updatedPlayer.getRole());
        player.setBattingHand(updatedPlayer.getBattingHand());
        player.setBowlingStyle(updatedPlayer.getBowlingStyle());
        player.setCity(updatedPlayer.getCity());
        player.setDob(updatedPlayer.getDob());
        player.setAvatarUrl(updatedPlayer.getAvatarUrl());
        if (updatedPlayer.getIsSubstituteRaw() != null) {
            player.setIsSubstitute(updatedPlayer.getIsSubstituteRaw());
        }
        return playerRepository.save(player);
    }

    @PutMapping("/{id}/role")
    public Player updatePlayerRole(
            @PathVariable Long id,
            @RequestParam String role,
            @RequestHeader(value = "X-User-Email", required = false) String userEmail
    ) {
        Player player = playerRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Player not found"));
        
        boolean isSelf = false;
        if (userEmail != null && !userEmail.trim().isEmpty()) {
            com.tournament.tournament_app.entity.User user = userRepository.findByEmail(userEmail.trim());
            if (user != null && user.getMobileNumber() != null && player.getMobileNumber() != null) {
                if (user.getMobileNumber().trim().equals(player.getMobileNumber().trim())) {
                    isSelf = true;
                }
            }
        }
        if (!isSelf) {
            validateTournamentAccess(player.getTeam(), userEmail);
        }
        player.setTeamRole(role.toUpperCase());
        return playerRepository.save(player);
    }

    @GetMapping("/profile/{mobileNumber}")
    public Player getPlayerByMobile(@PathVariable String mobileNumber) {
        return playerRepository.findFirstByMobileNumberOrderByIdDesc(mobileNumber)
                .orElseThrow(() -> new RuntimeException("Player profile not found for this mobile number"));
    }

    private void validateTournamentAccess(Team team, String userEmail) {
        if (team == null || team.getTournament() == null) {
            return;
        }
        com.tournament.tournament_app.entity.Tournament tournament = team.getTournament();
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

    public static class SportConfig {
        public String gameName;
        public int maxStarters;
        public int maxRoster;

        public SportConfig(String gameName, int maxStarters, int maxRoster) {
            this.gameName = gameName;
            this.maxStarters = maxStarters;
            this.maxRoster = maxRoster;
        }
    }

    public static SportConfig getSportConfig(String gameTemplate, int customMaxPlayers) {
        String game = gameTemplate != null ? gameTemplate.toLowerCase().trim() : "";
        if (game.contains("cricket")) {
            return new SportConfig("Cricket", 11, 18);
        } else if (game.contains("football") || game.contains("soccer")) {
            return new SportConfig("Football", 11, 23);
        } else if (game.contains("basketball")) {
            return new SportConfig("Basketball", 5, 15);
        } else if (game.contains("bgmi") || game.contains("pubg") || game.contains("freefire") || game.contains("free fire") || game.contains("battle royale")) {
            return new SportConfig("Battle Royale", 4, 6);
        } else if (game.contains("valorant")) {
            return new SportConfig("Valorant", 5, 7);
        } else if (game.contains("tennis")) {
            return new SportConfig("Tennis", 2, 2);
        } else if (game.contains("badminton")) {
            return new SportConfig("Badminton", 2, 2);
        } else if (game.contains("chess")) {
            return new SportConfig("Chess", 1, 1);
        } else if (game.contains("kabaddi")) {
            return new SportConfig("Kabaddi", 7, 12);
        } else if (game.contains("hockey")) {
            return new SportConfig("Hockey", 11, 18);
        }

        int maxRoster = customMaxPlayers > 0 ? customMaxPlayers : 15;
        int maxStarters = Math.min(11, maxRoster);
        return new SportConfig("General", maxStarters, maxRoster);
    }
}
