package com.tournament.tournament_app.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.tournament.tournament_app.entity.LiveScore;

public interface LiveScoreRepository extends JpaRepository<LiveScore, Long> {

}