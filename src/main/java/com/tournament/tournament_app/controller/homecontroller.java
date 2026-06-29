package com.tournament.tournament_app.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class homecontroller {

    @GetMapping("/")
    public String home(){
        return "Tournament App Backend Running Successfully";
    }
}