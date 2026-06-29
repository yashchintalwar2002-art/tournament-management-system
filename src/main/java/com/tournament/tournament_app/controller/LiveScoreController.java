package com.tournament.tournament_app.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import com.tournament.tournament_app.entity.LiveScore;
import com.tournament.tournament_app.repository.LiveScoreRepository;

@RestController
@RequestMapping("/live-score")
@CrossOrigin(origins = "*")
public class LiveScoreController {

    @Autowired
    private LiveScoreRepository liveScoreRepository;

    // Get all matches
    @GetMapping
    public List<LiveScore> getAllScores() {
        return liveScoreRepository.findAll();
    }

    // Add new live match
    @PostMapping
    public LiveScore addMatch(@RequestBody LiveScore liveScore) {
        return liveScoreRepository.save(liveScore);
    }

    // Update score
    @PutMapping("/{id}")
    public LiveScore updateScore(
            @PathVariable Long id,
            @RequestBody LiveScore updatedMatch) {

        LiveScore match = liveScoreRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Match not found"));

        match.setScoreA(updatedMatch.getScoreA());
        match.setScoreB(updatedMatch.getScoreB());
        match.setStatus(updatedMatch.getStatus());

        return liveScoreRepository.save(match);
    }

    // Delete match
    @DeleteMapping("/{id}")
    public String deleteMatch(@PathVariable Long id) {

        liveScoreRepository.deleteById(id);

        return "Match deleted";
    }
}