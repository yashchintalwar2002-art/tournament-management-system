package com.tournament.tournament_app.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import com.tournament.tournament_app.entity.Team;
import com.tournament.tournament_app.entity.Tournament;
import com.tournament.tournament_app.repository.TeamRepository;
import com.tournament.tournament_app.repository.TournamentRepository;

@RestController
@RequestMapping("/teams")
@CrossOrigin(origins = "*")
public class TeamController {

    @Autowired
    private TeamRepository teamRepository;

    @Autowired
    private TournamentRepository tournamentRepository;

    // PLAYER JOIN TOURNAMENT
    @PostMapping
    public Team addTeam(@RequestBody Team team, @RequestHeader(value = "X-User-Email", required = false) String userEmail) {

        Tournament tournament = tournamentRepository
                .findById(team.getTournament().getId())
                .orElseThrow(() -> new RuntimeException("Tournament not found"));

        Team newTeam = new Team();

        newTeam.setTeamName(team.getTeamName());
        newTeam.setCaptainName(team.getCaptainName());
        newTeam.setContactEmail(team.getContactEmail());
        newTeam.setLogo(team.getLogo() != null ? team.getLogo() : "");
        newTeam.setCity(team.getCity() != null ? team.getCity() : "");
        newTeam.setDescription(team.getDescription() != null ? team.getDescription() : "");
        newTeam.setJerseyColor(team.getJerseyColor() != null ? team.getJerseyColor() : "");
        newTeam.setCategory(team.getCategory() != null ? team.getCategory() : "Leather Ball");

        newTeam.setTournament(tournament);

        boolean hasAccess = false;
        try {
            validateTournamentAccess(tournament, userEmail);
            hasAccess = true;
        } catch (Exception e) {
            hasAccess = false;
        }

        if (hasAccess && team.getStatus() != null && !team.getStatus().trim().isEmpty()) {
            newTeam.setStatus(team.getStatus());
        } else {
            newTeam.setStatus("PENDING");
        }

        return teamRepository.save(newTeam);
    }
    @GetMapping
        public List<Team> getAllTeams() {
            return teamRepository.findAll();
        }

    // VIEW TOURNAMENT TEAMS
    @GetMapping("/tournament/{tournamentId}")
    public List<Team> getTeamsByTournament(@PathVariable Long tournamentId) {
        // fall back to filtering in controller if repository method isn't defined
        List<Team> all = teamRepository.findAll();
        return all.stream()
                .filter(t -> t.getTournament() != null && tournamentId.equals(t.getTournament().getId()))
                .toList();
    }

    // ORGANIZER APPROVES TEAM
    @PutMapping("/{id}/approve")
    public Team approveTeam(@PathVariable Long id, @RequestHeader(value = "X-User-Email", required = false) String userEmail) {

        Team team = teamRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Team not found"));

        if (team.getTournament() != null) {
            validateTournamentAccess(team.getTournament(), userEmail);
        }

        team.setStatus("APPROVED");

        return teamRepository.save(team);
    }

    // ORGANIZER REJECTS TEAM
    @PutMapping("/{id}/reject")
    public Team rejectTeam(@PathVariable Long id, @RequestHeader(value = "X-User-Email", required = false) String userEmail) {

        Team team = teamRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Team not found"));

        if (team.getTournament() != null) {
            validateTournamentAccess(team.getTournament(), userEmail);
        }

        team.setStatus("REJECTED");

        return teamRepository.save(team);
    }

    // UPDATE TEAM
    @PutMapping("/{id}")
    public Team updateTeam(@PathVariable Long id, @RequestBody Team updatedTeam, @RequestHeader(value = "X-User-Email", required = false) String userEmail) {
        Team team = teamRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Team not found"));

        if (team.getTournament() != null) {
            validateTournamentAccess(team.getTournament(), userEmail);
        }

        team.setTeamName(updatedTeam.getTeamName());
        team.setCaptainName(updatedTeam.getCaptainName());
        team.setContactEmail(updatedTeam.getContactEmail());
        team.setLogo(updatedTeam.getLogo() != null ? updatedTeam.getLogo() : "");
        team.setCity(updatedTeam.getCity() != null ? updatedTeam.getCity() : "");
        team.setDescription(updatedTeam.getDescription() != null ? updatedTeam.getDescription() : "");
        team.setJerseyColor(updatedTeam.getJerseyColor() != null ? updatedTeam.getJerseyColor() : "");
        team.setCategory(updatedTeam.getCategory() != null ? updatedTeam.getCategory() : "Leather Ball");
        return teamRepository.save(team);
    }

    // DELETE TEAM
    @DeleteMapping("/{id}")
    public String deleteTeam(@PathVariable Long id, @RequestHeader(value = "X-User-Email", required = false) String userEmail) {

        Team team = teamRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Team not found"));

        if (team.getTournament() != null) {
            validateTournamentAccess(team.getTournament(), userEmail);
        }

        teamRepository.delete(team);

        return "Team deleted successfully";
    }

    private void validateTournamentAccess(Tournament tournament, String userEmail) {
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
}