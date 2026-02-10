package at.technikum.clil.service;

import at.technikum.clil.model.Subject;
import at.technikum.clil.model.User;
import at.technikum.clil.repository.SubjectRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class SubjectService {

    private final SubjectRepository subjectRepository;

    private static final List<String> DEFAULT_SUBJECTS = List.of(
            "Deutsch", "Englisch", "Informatik", "Elektrotechnik",
            "Maschinenbau", "Mechatronik", "Netzwerktechnik", "Elektronik",
            "Datenbanken", "Webentwicklung", "Mathematik", "Physik"
    );

    public List<Subject> getSubjects(User owner) {
        List<Subject> subjects = subjectRepository.findByOwnerOrderByCreatedAtAsc(owner);
        if (subjects.isEmpty()) {
            // Lazy seed on first access
            seedDefaults(owner);
            subjects = subjectRepository.findByOwnerOrderByCreatedAtAsc(owner);
        }
        return subjects;
    }

    public Subject addSubject(String name, User owner) {
        String trimmed = name.trim();
        if (trimmed.isEmpty()) {
            throw new IllegalArgumentException("Subject name cannot be empty");
        }
        if (subjectRepository.existsByNameAndOwner(trimmed, owner)) {
            throw new IllegalArgumentException("Subject '" + trimmed + "' already exists");
        }
        Subject subject = Subject.builder()
                .name(trimmed)
                .owner(owner)
                .build();
        Subject saved = subjectRepository.save(subject);
        log.info("Created subject '{}' for user {}", saved.getName(), owner.getUsername());
        return saved;
    }

    public boolean deleteSubject(Long id, User owner) {
        return subjectRepository.findById(id)
                .filter(s -> s.getOwner().getId().equals(owner.getId()))
                .map(s -> {
                    subjectRepository.delete(s);
                    log.info("Deleted subject '{}' for user {}", s.getName(), owner.getUsername());
                    return true;
                })
                .orElse(false);
    }

    private void seedDefaults(User owner) {
        log.info("Seeding default subjects for user {}", owner.getUsername());
        for (String name : DEFAULT_SUBJECTS) {
            subjectRepository.save(Subject.builder()
                    .name(name)
                    .owner(owner)
                    .build());
        }
    }
}
