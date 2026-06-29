package com.tournament.tournament_app.dto;

import lombok.Data;

@Data
public class LoginRequest {

    private String email;
    private String password;

    public String getEmail() {
        throw new UnsupportedOperationException("Not supported yet.");
    }

    public CharSequence getPassword1() {
        throw new UnsupportedOperationException("Not supported yet.");
    }

    public CharSequence getPassword() {
        throw new UnsupportedOperationException("Not supported yet.");
    }

}