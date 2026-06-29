package com.tournament.tournament_app.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "commentaries")
public class Commentary {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long matchId;
    private String overBall;
    private String event;
    
    @Column(length = 500)
    private String description;
    
    private String bowlerName;
    private String batsmanName;
    
    private LocalDateTime timestamp = LocalDateTime.now();

    public Commentary() {
    }

    public Commentary(Long matchId, String overBall, String event, String description) {
        this.matchId = matchId;
        this.overBall = overBall;
        this.event = event;
        this.description = description;
    }

    public Commentary(Long matchId, String overBall, String event, String description, String bowlerName) {
        this.matchId = matchId;
        this.overBall = overBall;
        this.event = event;
        this.description = description;
        this.bowlerName = bowlerName;
    }

    public String getBowlerName() {
        return bowlerName;
    }

    public void setBowlerName(String bowlerName) {
        this.bowlerName = bowlerName;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getMatchId() {
        return matchId;
    }

    public void setMatchId(Long matchId) {
        this.matchId = matchId;
    }

    public String getOverBall() {
        return overBall;
    }

    public void setOverBall(String overBall) {
        this.overBall = overBall;
    }

    public String getEvent() {
        return event;
    }

    public void setEvent(String event) {
        this.event = event;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public LocalDateTime getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(LocalDateTime timestamp) {
        this.timestamp = timestamp;
    }

    public String getBatsmanName() {
        return batsmanName;
    }

    public void setBatsmanName(String batsmanName) {
        this.batsmanName = batsmanName;
    }
}
