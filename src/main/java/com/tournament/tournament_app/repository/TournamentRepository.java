package com.tournament.tournament_app.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.tournament.tournament_app.entity.Tournament;

public interface TournamentRepository extends JpaRepository<Tournament, Long> {
}