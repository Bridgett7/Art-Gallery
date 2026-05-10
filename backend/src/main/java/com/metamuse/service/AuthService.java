package com.metamuse.service;

import com.metamuse.dto.auth.*;
import com.metamuse.enums.UserRole;
import com.metamuse.model.Address;
import com.metamuse.model.User;
import com.metamuse.repository.UserRepository;
import com.metamuse.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final EmailService emailService;

    // In-memory reset tokens (in production, use DB or Redis)
    private final Map<String, String> resetTokens = new ConcurrentHashMap<>();

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        // Validate uniqueness
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new RuntimeException("Username already exists");
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already exists");
        }

        // Validate password strength
        validatePassword(request.getPassword());

        // Parse role
        UserRole role;
        try {
            role = UserRole.valueOf(request.getRole().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new RuntimeException("Invalid role. Must be ADMIN, ARTIST, or VISITOR");
        }

        // Build address if provided
        Address address = null;
        if (request.getStreet() != null && !request.getStreet().isBlank()) {
            address = Address.builder()
                    .street(request.getStreet())
                    .city(request.getCity())
                    .country(request.getCountry())
                    .postalCode(request.getPostalCode())
                    .build();
        }

        // Create user
        String userId = "USR" + System.currentTimeMillis() + (int) (Math.random() * 1000);
        User user = User.builder()
                .idNumber(userId)
                .username(request.getUsername())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(role)
                .address(address)
                .build();

        userRepository.save(user);

        // Generate token
        String token = jwtService.generateToken(user.getIdNumber(), user.getUsername(), user.getRole().name());

        return AuthResponse.builder()
                .token(token)
                .userId(user.getIdNumber())
                .username(user.getUsername())
                .email(user.getEmail())
                .role(user.getRole().name())
                .profilePicture(user.getProfilePicture())
                .build();
    }

    public AuthResponse login(LoginRequest request) {
        // Find user by username or email
        User user = userRepository.findByUsernameOrEmail(
                request.getUsernameOrEmail(), request.getUsernameOrEmail()
        ).orElseThrow(() -> new RuntimeException("Invalid credentials"));

        // Verify password
        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new RuntimeException("Invalid credentials");
        }

        // Generate token
        String token = jwtService.generateToken(user.getIdNumber(), user.getUsername(), user.getRole().name());

        return AuthResponse.builder()
                .token(token)
                .userId(user.getIdNumber())
                .username(user.getUsername())
                .email(user.getEmail())
                .role(user.getRole().name())
                .profilePicture(user.getProfilePicture())
                .build();
    }

    public User getCurrentUser(String userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    public void requestPasswordReset(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        String token = UUID.randomUUID().toString().substring(0, 6).toUpperCase();
        resetTokens.put(token, user.getIdNumber());

        String body = """
                <h2>Password Reset</h2>
                <p>Hello %s,</p>
                <p>Your password reset code is: <strong>%s</strong></p>
                <p>This code will expire when the server restarts.</p>
                <br>
                <p>If you did not request this, please ignore this email.</p>
                """.formatted(user.getUsername(), token);

        emailService.sendSimpleEmail(email, "MetaMuse - Password Reset Code", body);
    }

    @Transactional
    public void resetPassword(String token, String newPassword) {
        String userId = resetTokens.get(token);
        if (userId == null) {
            throw new RuntimeException("Invalid or expired reset code");
        }

        validatePassword(newPassword);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
        resetTokens.remove(token);
    }

    private void validatePassword(String password) {
        if (password.length() < 8) {
            throw new RuntimeException("Password must be at least 8 characters long");
        }
        if (password.length() > 128) {
            throw new RuntimeException("Password must not exceed 128 characters");
        }
        if (!password.matches(".*[A-Z].*")) {
            throw new RuntimeException("Password must contain at least one uppercase letter");
        }
        if (!password.matches(".*[a-z].*")) {
            throw new RuntimeException("Password must contain at least one lowercase letter");
        }
        if (!password.matches(".*\\d.*")) {
            throw new RuntimeException("Password must contain at least one digit");
        }
        if (!password.matches(".*[!@#$%^&*()_+\\-=\\[\\]{}|;:,.<>?].*")) {
            throw new RuntimeException("Password must contain at least one special character");
        }
    }
}
