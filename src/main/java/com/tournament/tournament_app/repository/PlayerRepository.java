package com.tournament.tournament_app.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.tournament.tournament_app.entity.Player;
import java.util.List;
import java.util.Optional;

@Repository
public interface PlayerRepository extends JpaRepository<Player, Long> {
    List<Player> findByTeamId(Long teamId);
    Optional<Player> findFirstByMobileNumberOrderByIdDesc(String mobileNumber);
}
