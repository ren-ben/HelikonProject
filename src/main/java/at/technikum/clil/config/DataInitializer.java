package at.technikum.clil.config;

import at.technikum.clil.model.Role;
import at.technikum.clil.model.User;
import at.technikum.clil.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.Set;

@Slf4j
@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        if (userRepository.count() == 0) {
            User admin = User.builder()
                    .username("admin")
                    .email("admin@helikon.at")
                    .password(passwordEncoder.encode("admin123"))
                    .roles(Set.of(Role.ADMIN))
                    .approved(true)
                    .build();

            userRepository.save(admin);
            log.info("Default admin user created — username: admin, password: admin123");
        } else {
            // Ensure the admin user always has the ADMIN role
            userRepository.findByUsername("admin").ifPresent(admin -> {
                if (!admin.getRoles().contains(Role.ADMIN)) {
                    Set<Role> updated = new java.util.HashSet<>(admin.getRoles());
                    updated.add(Role.ADMIN);
                    admin.setRoles(updated);
                    admin.setApproved(true);
                    userRepository.save(admin);
                    log.info("Admin role granted to existing 'admin' user");
                }
            });
        }
    }
}
