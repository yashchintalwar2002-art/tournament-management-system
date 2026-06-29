package com.tournament.tournament_app.security;

import java.io.IOException;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.DefaultOAuth2User;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import com.tournament.tournament_app.entity.User;
import com.tournament.tournament_app.repository.UserRepository;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Component
public class OAuth2LoginSuccessHandler implements AuthenticationSuccessHandler {

    @Autowired
    private UserRepository userRepository;

    @Override
    public void onAuthenticationSuccess(
            HttpServletRequest request,
            HttpServletResponse response,
            Authentication authentication)
            throws IOException, ServletException {

        DefaultOAuth2User oauthUser =
                (DefaultOAuth2User) authentication.getPrincipal();

        String email = oauthUser.getAttribute("email");

        System.out.println("Google Login Success: " + email);

        // Find user in database
        User user = userRepository.findByEmail(email);

        // If user does not exist create PLAYER by default
        if (user == null) {
            user = new User();
            user.setEmail(email);
            user.setPassword("");
            user.setRole("PLAYER");

            userRepository.save(user);
        }

        // Redirect based on role
        if ("ADMIN".equals(user.getRole())) {
            response.sendRedirect("http://localhost:3000/admin");

        } else if ("ORGANIZER".equals(user.getRole())) {
            response.sendRedirect("http://localhost:3000/organizer");

        } else {
            response.sendRedirect("http://localhost:3000/player");
        }
    }
}