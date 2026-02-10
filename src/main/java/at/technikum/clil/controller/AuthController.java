package at.technikum.clil.controller;

import at.technikum.clil.dto.auth.*;
import at.technikum.clil.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest request) {
        try {
            authService.register(request);
            return ResponseEntity.ok(Map.of(
                    "message", "Registrierung erfolgreich. Bitte warten Sie auf die Freigabe durch einen Administrator."));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(
                    ErrorResponse.builder()
                            .status(400)
                            .error("Bad Request")
                            .message(e.getMessage())
                            .timestamp(LocalDateTime.now())
                            .path("/api/v1/auth/register")
                            .build());
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest request) {
        try {
            AuthResponse response = authService.login(request);
            return ResponseEntity.ok(response);
        } catch (org.springframework.security.authentication.DisabledException e) {
            return ResponseEntity.status(403).body(
                    ErrorResponse.builder()
                            .status(403)
                            .error("Forbidden")
                            .message("Ihr Konto wurde noch nicht freigegeben. Bitte warten Sie auf die Freigabe durch einen Administrator.")
                            .timestamp(LocalDateTime.now())
                            .path("/api/v1/auth/login")
                            .build());
        } catch (Exception e) {
            return ResponseEntity.status(401).body(
                    ErrorResponse.builder()
                            .status(401)
                            .error("Unauthorized")
                            .message("Invalid username or password")
                            .timestamp(LocalDateTime.now())
                            .path("/api/v1/auth/login")
                            .build());
        }
    }

    @PostMapping("/refresh")
    public ResponseEntity<?> refresh(@Valid @RequestBody RefreshRequest request) {
        try {
            AuthResponse response = authService.refresh(request);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(401).body(
                    ErrorResponse.builder()
                            .status(401)
                            .error("Unauthorized")
                            .message("Invalid or expired refresh token")
                            .timestamp(LocalDateTime.now())
                            .path("/api/v1/auth/refresh")
                            .build());
        }
    }
}
