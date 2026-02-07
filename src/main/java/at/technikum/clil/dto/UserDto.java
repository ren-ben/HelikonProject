package at.technikum.clil.dto;

import at.technikum.clil.model.Role;
import at.technikum.clil.model.User;

import java.util.Set;
import java.util.stream.Collectors;

public record UserDto(
        Long id,
        String username,
        String email,
        Set<String> roles,
        String createdAt,
        long materialCount
) {
    public static UserDto fromEntity(User user, long materialCount) {
        Set<String> roleNames = user.getRoles().stream()
                .map(Role::name)
                .collect(Collectors.toSet());
        return new UserDto(
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                roleNames,
                user.getCreatedAt() != null ? user.getCreatedAt().toString() : null,
                materialCount
        );
    }
}
