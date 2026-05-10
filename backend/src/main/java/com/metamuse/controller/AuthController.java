package com.metamuse.controller;

import com.metamuse.dto.auth.*;
import com.metamuse.model.User;
import com.metamuse.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest request) {
        try {
            AuthResponse response = authService.register(request);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest request) {
        try {
            AuthResponse response = authService.login(request);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        if (email == null || email.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Email is required"));
        }
        try {
            authService.requestPasswordReset(email);
            return ResponseEntity.ok(Map.of("message", "If this email exists, a reset code has been sent"));
        } catch (RuntimeException e) {
            // Don't reveal if email exists or not
            return ResponseEntity.ok(Map.of("message", "If this email exists, a reset code has been sent"));
        }
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody Map<String, String> body) {
        String token = body.get("token");
        String newPassword = body.get("newPassword");
        if (token == null || newPassword == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Token and new password are required"));
        }
        try {
            authService.resetPassword(token, newPassword);
            return ResponseEntity.ok(Map.of("message", "Password reset successfully"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(Authentication authentication) {
        if (authentication == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Not authenticated"));
        }
        String userId = (String) authentication.getPrincipal();
        User user = authService.getCurrentUser(userId);

        var response = new java.util.HashMap<String, Object>();
        response.put("userId", user.getIdNumber());
        response.put("username", user.getUsername());
        response.put("email", user.getEmail());
        response.put("role", user.getRole().name());
        response.put("profilePicture", user.getProfilePicture() != null ? user.getProfilePicture() : "");
        response.put("address", user.getAddress() != null ? Map.of(
                "id", user.getAddress().getId(),
                "street", user.getAddress().getStreet() != null ? user.getAddress().getStreet() : "",
                "city", user.getAddress().getCity() != null ? user.getAddress().getCity() : "",
                "country", user.getAddress().getCountry() != null ? user.getAddress().getCountry() : "",
                "postalCode", user.getAddress().getPostalCode() != null ? user.getAddress().getPostalCode() : ""
        ) : null);

        return ResponseEntity.ok(response);
    }
}
