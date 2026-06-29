package com.tournament.tournament_app.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.tournament.tournament_app.dto.LoginResponse;
import com.tournament.tournament_app.entity.User;
import com.tournament.tournament_app.repository.UserRepository;
import com.tournament.tournament_app.security.JwtUtil;

@RestController
@RequestMapping("/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JwtUtil jwtUtil;

    private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

    @PostMapping("/register")
    public User register(@RequestBody User user) {
        if (user.getEmail() != null && !user.getEmail().isBlank()) {
            User existingUser = userRepository.findByEmail(user.getEmail());
            if (existingUser != null) {
                throw new RuntimeException("Email already exists");
            }
        }

        if (user.getMobileNumber() != null && !user.getMobileNumber().isBlank()) {
            if (userRepository.findByMobileNumber(user.getMobileNumber()).isPresent()) {
                throw new RuntimeException("Mobile number already registered");
            }
        }

        user.setPassword(encoder.encode(user.getPassword()));

        if (user.getRole() == null || user.getRole().isBlank()) {
            user.setRole("PLAYER");
        }

        user.setRole(user.getRole().toUpperCase());

        return userRepository.save(user);
    }

    @PostMapping("/login")
    public LoginResponse login(@RequestBody User user) {
        User dbUser = null;
        if (user.getEmail() != null && !user.getEmail().isBlank()) {
            dbUser = userRepository.findByEmail(user.getEmail());
        } else if (user.getMobileNumber() != null && !user.getMobileNumber().isBlank()) {
            dbUser = userRepository.findByMobileNumber(user.getMobileNumber()).orElse(null);
        }

        if (dbUser != null && encoder.matches(user.getPassword(), dbUser.getPassword())) {
            String identifier = dbUser.getEmail() != null ? dbUser.getEmail() : dbUser.getMobileNumber();
            String token = jwtUtil.generateToken(identifier);

            return new LoginResponse(token, dbUser.getRole());
        }

        throw new RuntimeException("Invalid Credentials");
    }

    @GetMapping("/users")
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }
}