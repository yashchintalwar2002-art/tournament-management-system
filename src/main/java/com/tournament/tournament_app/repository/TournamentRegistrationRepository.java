package com.tournament.tournament_app.repository;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import com.tournament.tournament_app.entity.TournamentRegistration;

public interface TournamentRegistrationRepository extends JpaRepository<TournamentRegistration, Long> {
    List<TournamentRegistration> findByTournamentId(Long tournamentId);
}