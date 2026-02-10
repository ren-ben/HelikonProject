package at.technikum.clil.controller;

import at.technikum.clil.model.Subject;
import at.technikum.clil.model.User;
import at.technikum.clil.service.SubjectService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/v1/clil/subjects")
@RequiredArgsConstructor
public class SubjectController {

    private final SubjectService subjectService;

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getSubjects(
            @AuthenticationPrincipal User user) {
        List<Subject> subjects = subjectService.getSubjects(user);
        List<Map<String, Object>> result = subjects.stream()
                .map(s -> Map.<String, Object>of("id", s.getId(), "name", s.getName()))
                .toList();
        return ResponseEntity.ok(result);
    }

    @PostMapping
    public ResponseEntity<?> createSubject(
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal User user) {
        String name = body.get("name");
        if (name == null || name.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Name is required"));
        }
        try {
            Subject created = subjectService.addSubject(name, user);
            return ResponseEntity.ok(Map.of("id", created.getId(), "name", created.getName()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteSubject(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) {
        if (subjectService.deleteSubject(id, user)) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
}
