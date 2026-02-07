package at.technikum.clil.controller;

import at.technikum.clil.dto.UserDto;
import at.technikum.clil.model.Role;
import at.technikum.clil.service.AdminService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Slf4j
@RestController
@RequestMapping("/api/v1/clil/admin")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminController {

    private final AdminService adminService;

    @GetMapping("/users")
    public ResponseEntity<List<UserDto>> getAllUsers() {
        return ResponseEntity.ok(adminService.getAllUsers());
    }

    @GetMapping("/users/{id}")
    public ResponseEntity<UserDto> getUser(@PathVariable Long id) {
        return adminService.getUserById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @SuppressWarnings("unchecked")
    @PutMapping("/users/{id}/roles")
    public ResponseEntity<UserDto> updateUserRoles(
            @PathVariable Long id,
            @RequestBody Map<String, Object> body) {
        List<String> roleNames = (List<String>) body.get("roles");
        if (roleNames == null || roleNames.isEmpty()) {
            return ResponseEntity.badRequest().build();
        }

        Set<Role> roles;
        try {
            roles = roleNames.stream()
                    .map(Role::valueOf)
                    .collect(Collectors.toSet());
        } catch (IllegalArgumentException e) {
            log.warn("Invalid role name in request: {}", roleNames);
            return ResponseEntity.badRequest().build();
        }

        return adminService.updateUserRoles(id, roles)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        if (adminService.deleteUser(id)) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getSystemStats() {
        return ResponseEntity.ok(adminService.getSystemStats());
    }
}
