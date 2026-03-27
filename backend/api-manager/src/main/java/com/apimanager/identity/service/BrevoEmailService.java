package com.apimanager.identity.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

@Service
public class BrevoEmailService {

    @Value("${brevo.api-key}")
    private String apiKey;

    @Value("${brevo.sender-email}")
    private String senderEmail;

    @Value("${brevo.sender-name}")
    private String senderName;

    private final RestTemplate restTemplate = new RestTemplate();

    private static final String BREVO_URL = "https://api.brevo.com/v3/smtp/email";

    public void sendPasswordResetEmail(String toEmail, String toName,
                                       String resetLink, String role) {

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("api-key", apiKey);

        Map<String, Object> body = Map.of(
            "sender",  Map.of("email", senderEmail, "name", senderName),
            "to",      List.of(Map.of("email", toEmail, "name", toName)),
            "subject", "Reset Your Password — APIManager",
            "htmlContent", buildEmailHtml(toName, resetLink, role)
        );

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);

        ResponseEntity<String> response = restTemplate.postForEntity(BREVO_URL, entity, String.class);

        if (!response.getStatusCode().is2xxSuccessful()) {
            throw new RuntimeException("Failed to send email via Brevo: " + response.getBody());
        }
    }

    private String buildEmailHtml(String name, String resetLink, String role) {
        return """
            <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;
                        padding:32px;background:#020b16;color:white;border-radius:16px;">
              <h2 style="color:#00d4b4;">APIManager — Password Reset</h2>
              <p>Hi <strong>%s</strong>,</p>
              <p>We received a request to reset the password for your
                 <strong>%s</strong> account.</p>
              <p>Click the button below. This link expires in <strong>1 hour</strong>.</p>
              <a href="%s"
                 style="display:inline-block;margin:24px 0;padding:14px 28px;
                        background:linear-gradient(135deg,#00d4b4,#0891b2);
                        color:#04121f;border-radius:10px;text-decoration:none;
                        font-weight:bold;font-size:15px;">
                Reset Password
              </a>
              <p style="color:#888;font-size:13px;">
                If you didn't request this, you can safely ignore this email.
              </p>
              <hr style="border:none;border-top:1px solid #1a2a3a;margin:24px 0"/>
              <p style="color:#555;font-size:12px;">Or copy this link: %s</p>
            </div>
        """.formatted(name, role, resetLink, resetLink);
    }
}