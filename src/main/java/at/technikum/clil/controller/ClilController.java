package at.technikum.clil.controller;

import at.technikum.clil.dto.ClilResponse;
import at.technikum.clil.dto.LessonMaterialDto;
import at.technikum.clil.dto.MaterialCreateRequest;
import at.technikum.clil.dto.MaterialRequest;
import at.technikum.clil.dto.MaterialUpdateRequest;
import at.technikum.clil.model.User;
import at.technikum.clil.service.OllamaService;
import at.technikum.clil.service.MaterialService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

import java.time.Duration;
import java.util.List;

@RestController
@RequestMapping("/api/v1/clil")
public class ClilController {

    private final OllamaService ollamaService;
    private final MaterialService materialService;

    public ClilController(OllamaService ollamaService, MaterialService materialService) {
        this.ollamaService = ollamaService;
        this.materialService = materialService;
    }

    @GetMapping("/models")
    public Mono<ResponseEntity<List<String>>> getAvailableModels() {
        return ollamaService.listAvailableModels()
                .doOnSuccess(models -> System.out.println("Successfully fetched " + models.size() + " models: " + models))
                .doOnError(error -> System.err.println("Error fetching models: " + error.getMessage()))
                .map(ResponseEntity::ok)
                .onErrorReturn(ResponseEntity.internalServerError().build());
    }

    @PostMapping("/generate")
    public Mono<ResponseEntity<ClilResponse>> generateLessonMaterial(
            @RequestBody MaterialRequest request) {
        return ollamaService.generateMaterial(
                        request.getModelName(),
                        request.getMaterialType(),
                        request.getTopic(),
                        request.getPrompt(),
                        request.getSubject(),
                        request.getLanguageLevel(),
                        request.getVocabPercentage(),
                        request.getContentFocus(),
                        request.getIncludeVocabList(),
                        request.getDescription()
                )
                .timeout(Duration.ofSeconds(180))
                .map(ResponseEntity::ok)
                .onErrorReturn(ResponseEntity.internalServerError()
                        .body(ClilResponse.builder()
                                .formattedResponse("<div class='error'>Failed to generate content</div>")
                                .build()));
    }

    @GetMapping("/materials")
    public ResponseEntity<List<LessonMaterialDto>> getAllMaterials(
            @AuthenticationPrincipal User user) {
        List<LessonMaterialDto> materials = materialService.getAllMaterials(user);
        return ResponseEntity.ok(materials);
    }

    @GetMapping("/materials/{id}")
    public ResponseEntity<LessonMaterialDto> getMaterial(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) {
        return materialService.getMaterialById(id, user)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/materials")
    public ResponseEntity<LessonMaterialDto> createMaterial(
            @RequestBody MaterialCreateRequest request,
            @AuthenticationPrincipal User user) {
        try {
            LessonMaterialDto created = materialService.createMaterial(request, user);
            return ResponseEntity.ok(created);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PutMapping("/materials/{id}")
    public ResponseEntity<LessonMaterialDto> updateMaterial(
            @PathVariable Long id,
            @RequestBody MaterialUpdateRequest request,
            @AuthenticationPrincipal User user) {
        try {
            return materialService.updateMaterial(id, request, user)
                    .map(ResponseEntity::ok)
                    .orElse(ResponseEntity.notFound().build());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @DeleteMapping("/materials/{id}")
    public ResponseEntity<Void> deleteMaterial(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) {
        if (materialService.deleteMaterial(id, user)) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
}