package com.tournament.tournament_app.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.tournament.tournament_app.entity.Team;

public interface TeamRepository extends JpaRepository<Team, Long> {

    List<Team> findByTournamentId(Long tournamentId);
}