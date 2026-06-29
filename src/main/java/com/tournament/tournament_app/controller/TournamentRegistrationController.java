package com.tournament.tournament_app.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import com.tournament.tournament_app.entity.Tournament;
import com.tournament.tournament_app.entity.TournamentRegistration;
import com.tournament.tournament_app.repository.TournamentRegistrationRepository;
import com.tournament.tournament_app.repository.TournamentRepository;

@RestController
@RequestMapping("/tournament-registrations")
@CrossOrigin(origins = "*")
public class TournamentRegistrationController {

    @Autowired
    private TournamentRegistrationRepository registrationRepository;

    @Autowired
    private TournamentRepository tournamentRepository;

    @PostMapping
    public TournamentRegistration joinTournament(@RequestParam Long tournamentId,
                                                 @RequestParam String playerEmail) {

        Tournament tournament = tournamentRepository.findById(tournamentId)
                .orElseThrow(() -> new RuntimeException("Tournament not found"));

        TournamentRegistration registration = new TournamentRegistration();
        registration.setTournament(tournament);
        registration.setPlayerEmail(playerEmail);

        return registrationRepository.save(registration);
    }
}