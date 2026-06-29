package com.tournament.tournament_app.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    @Autowired(required = false)
    private JavaMailSender mailSender;

    public void sendEmail(String toEmail, String subject, String body) {
        if (mailSender == null || toEmail == null || toEmail.isEmpty()) {
            System.out.println("SIMULATED EMAIL to " + toEmail + " | Subject: " + subject + " | Body: " + body);
            return;
        }

        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(toEmail);
            message.setSubject(subject);
            message.setText(body);
            // The 'from' address is automatically picked up from application.properties
            mailSender.send(message);
            System.out.println("Email sent successfully to " + toEmail);
        } catch (Exception e) {
            System.err.println("Failed to send email to " + toEmail + ": " + e.getMessage());
            // Fallback to simulation if email fails (e.g. invalid credentials)
            System.out.println("SIMULATED EMAIL to " + toEmail + " | Subject: " + subject + " | Body: " + body);
        }
    }
}
