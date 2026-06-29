package com.tournament.tournament_app.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.tournament.tournament_app.entity.Commentary;
import java.util.List;

@Repository
public interface CommentaryRepository extends JpaRepository<Commentary, Long> {
    List<Commentary> findByMatchIdOrderByTimestampDesc(Long matchId);
    void deleteByMatchId(Long matchId);
}
