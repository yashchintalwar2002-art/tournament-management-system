package com.tournament.tournament_app.repository;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import com.tournament.tournament_app.entity.Match;

public interface MatchRepository extends JpaRepository<Match, Long> {

    List<Match> findByTournamentId(Long tournamentId);

    List<Match> findByTournamentIdAndRound(Long tournamentId, String round);

    List<Match> findByTournamentIdAndRoundAndStatus(Long tournamentId, String round, String status);

    List<Match> findByStatus(String status);
}