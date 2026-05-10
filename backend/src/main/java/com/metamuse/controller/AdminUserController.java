package com.metamuse.controller;

import com.metamuse.enums.UserRole;
import com.metamuse.model.User;
import com.metamuse.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/users")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminUserController {

    private final UserService userService;
    private final PasswordEncoder passwordEncoder;

    @GetMapping
    public ResponseEntity<List<User>> getAllUsers() {
        List<User> users = userService.getAll();
        users.forEach(u -> u.setPassword(null));
        return ResponseEntity.ok(users);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getUser(@PathVariable String id) {
        try {
            User user = userService.findByIdNumber(id);
            user.setPassword(null);
            return ResponseEntity.ok(user);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping
    public ResponseEntity<?> createUser(@RequestBody Map<String, String> body) {
        try {
            String idNumber = body.get("idNumber");
            String username = body.get("username");
            String email = body.get("email");
            String password = body.get("password");
            String roleStr = body.get("role");

            if (idNumber == null || idNumber.isBlank()) return ResponseEntity.badRequest().body(Map.of("error", "ID is required"));
            if (username == null || username.isBlank()) return ResponseEntity.badRequest().body(Map.of("error", "Username is required"));
            if (email == null || email.isBlank()) return ResponseEntity.badRequest().body(Map.of("error", "Email is required"));
            if (password == null || password.isBlank()) return ResponseEntity.badRequest().body(Map.of("error", "Password is required"));

            UserRole role;
            try { role = UserRole.valueOf(roleStr.toUpperCase()); }
            catch (Exception e) { return ResponseEntity.badRequest().body(Map.of("error", "Invalid role")); }

            User user = User.builder()
                    .idNumber(idNumber)
                    .username(username)
                    .email(email)
                    .password(passwordEncoder.encode(password))
                    .role(role)
                    .build();

            user = userService.add(user);
            user.setPassword(null);
            return ResponseEntity.ok(user);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateUser(@PathVariable String id, @RequestBody Map<String, String> body) {
        try {
            User user = userService.findByIdNumber(id);

            if (body.containsKey("username") && !body.get("username").isBlank()) {
                user.setUsername(body.get("username"));
            }
            if (body.containsKey("email") && !body.get("email").isBlank()) {
                user.setEmail(body.get("email"));
            }
            if (body.containsKey("role") && !body.get("role").isBlank()) {
                user.setRole(UserRole.valueOf(body.get("role").toUpperCase()));
            }
            if (body.containsKey("password") && !body.get("password").isBlank()) {
                user.setPassword(passwordEncoder.encode(body.get("password")));
            }

            user = userService.add(user);
            user.setPassword(null);
            return ResponseEntity.ok(user);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}/role")
    public ResponseEntity<?> updateRole(@PathVariable String id, @RequestBody Map<String, String> body) {
        try {
            User user = userService.findByIdNumber(id);
            user.setRole(UserRole.valueOf(body.get("role").toUpperCase()));
            userService.add(user);
            return ResponseEntity.ok(Map.of("message", "Role updated"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable String id) {
        try {
            userService.deleteByIdNumber(id);
            return ResponseEntity.ok(Map.of("message", "User deleted"));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }
}
