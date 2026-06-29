package com.tournament.tournament_app.controller;

import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import com.tournament.tournament_app.entity.User;
import com.tournament.tournament_app.repository.UserRepository;

@RestController
@RequestMapping("/users")
@CrossOrigin(origins = "*")
public class UserController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private com.tournament.tournament_app.service.EmailService emailService;

    @GetMapping
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    @PutMapping("/{id}/role")
    public User updateUserRole(@PathVariable Long id, @RequestParam String role) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
        user.setRole(role.toUpperCase());
        return userRepository.save(user);
    }

    private final java.util.concurrent.ConcurrentHashMap<Long, String> otpStore = new java.util.concurrent.ConcurrentHashMap<>();

    @PostMapping("/{id}/send-otp")
    public java.util.Map<String, String> sendOtp(@PathVariable Long id, @RequestParam String mobileNumber) {
        User user = userRepository.findById(id).orElseThrow(() -> new RuntimeException("User not found"));
        // Generate 6 digit OTP
        String otp = String.format("%06d", new java.util.Random().nextInt(999999));
        otpStore.put(id, otp);
        
        // Send actual Email
        String subject = "Tournament Pro - Verification Code";
        String message = "Your Tournament Pro verification code is: " + otp;
        
        // We use the user's email address to send the OTP
        String userEmail = user.getEmail();
        if (userEmail != null && !userEmail.isEmpty()) {
            emailService.sendEmail(userEmail, subject, message);
        } else {
            System.err.println("User does not have an email address to receive OTP");
        }

        java.util.Map<String, String> response = new java.util.HashMap<>();
        response.put("message", "OTP sent successfully");
        response.put("otp", otp); // Keep this so frontend can simulate it without API keys
        return response;
    }

    @PostMapping("/{id}/verify-otp")
    public User verifyOtp(@PathVariable Long id, @RequestParam String mobileNumber, @RequestParam String otp) {
        User user = userRepository.findById(id).orElseThrow(() -> new RuntimeException("User not found"));
        String storedOtp = otpStore.get(id);
        if (storedOtp != null && storedOtp.equals(otp)) {
            user.setMobileNumber(mobileNumber);
            otpStore.remove(id);
            return userRepository.save(user);
        } else {
            throw new org.springframework.web.server.ResponseStatusException(
                org.springframework.http.HttpStatus.BAD_REQUEST, "Invalid OTP"
            );
        }
    }

    @DeleteMapping("/{id}")
    public String deleteUser(@PathVariable Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
        userRepository.delete(user);
        return "User deleted successfully";
    }

    @GetMapping("/current")
    public User getCurrentUser(@RequestParam String identifier) {
        User user = null;
        if (identifier.contains("@")) {
            user = userRepository.findByEmail(identifier);
        } else {
            user = userRepository.findByMobileNumber(identifier).orElse(null);
        }
        if (user == null) {
            throw new RuntimeException("User not found");
        }
        return user;
    }
}
