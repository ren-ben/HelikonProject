package at.technikum.clil.service;

import at.technikum.clil.dto.UserDto;
import at.technikum.clil.model.Role;
import at.technikum.clil.model.User;
import at.technikum.clil.repository.LessonMaterialRepository;
import at.technikum.clil.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

@Slf4j
@Service
@RequiredArgsConstructor
public class AdminService {

    private final UserRepository userRepository;
    private final LessonMaterialRepository materialRepository;

    @Transactional(readOnly = true)
    public List<UserDto> getAllUsers() {
        return userRepository.findAll().stream()
                .map(user -> UserDto.fromEntity(user, materialRepository.countByOwner(user)))
                .toList();
    }

    @Transactional(readOnly = true)
    public Optional<UserDto> getUserById(Long id) {
        return userRepository.findById(id)
                .map(user -> UserDto.fromEntity(user, materialRepository.countByOwner(user)));
    }

    @Transactional
    public Optional<UserDto> updateUserRoles(Long userId, Set<Role> roles) {
        return userRepository.findById(userId)
                .map(user -> {
                    log.info("Updating roles for user {} (id={}): {} -> {}", user.getUsername(), userId, user.getRoles(), roles);
                    user.setRoles(roles);
                    User saved = userRepository.save(user);
                    return UserDto.fromEntity(saved, materialRepository.countByOwner(saved));
                });
    }

    @Transactional
    public boolean deleteUser(Long userId) {
        if (userRepository.existsById(userId)) {
            log.info("Deleting user with id={}", userId);
            userRepository.deleteById(userId);
            return true;
        }
        return false;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getSystemStats() {
        long totalUsers = userRepository.count();
        long totalMaterials = materialRepository.count();

        Map<String, Object> stats = new LinkedHashMap<>();
        stats.put("totalUsers", totalUsers);
        stats.put("totalMaterials", totalMaterials);
        return stats;
    }
}
