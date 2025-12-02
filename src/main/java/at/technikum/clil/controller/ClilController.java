package at.technikum.clil.controller;

import at.technikum.clil.dto.ClilResponse;
import at.technikum.clil.dto.LessonMaterialDto;
import at.technikum.clil.dto.MaterialCreateRequest;
import at.technikum.clil.dto.MaterialRequest;
import at.technikum.clil.dto.MaterialUpdateRequest;
import at.technikum.clil.service.OllamaService;
import at.technikum.clil.service.MaterialService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

import java.time.Duration;
import java.util.List;

@RestController
@RequestMapping("/api/v1/clil")
//@CrossOrigin(origins = {"http://localhost:63342", "http://localhost:5173"})
@CrossOrigin(origins = "*")
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
    public ResponseEntity<List<LessonMaterialDto>> getAllMaterials() {
        List<LessonMaterialDto> materials = materialService.getAllMaterials();
        return ResponseEntity.ok(materials);
    }



    @GetMapping("/materials/{id}")
    public ResponseEntity<LessonMaterialDto> getMaterial(@PathVariable Long id) {
        return materialService.getMaterialById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/materials")
    public ResponseEntity<LessonMaterialDto> createMaterial(
            @RequestBody MaterialCreateRequest request) {
        try {
            LessonMaterialDto created = materialService.createMaterial(request);
            return ResponseEntity.ok(created);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PutMapping("/materials/{id}")
    public ResponseEntity<LessonMaterialDto> updateMaterial(
            @PathVariable Long id,
            @RequestBody MaterialUpdateRequest request) {
        try {
            return materialService.updateMaterial(id, request)
                    .map(ResponseEntity::ok)
                    .orElse(ResponseEntity.notFound().build());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @DeleteMapping("/materials/{id}")
    public ResponseEntity<Void> deleteMaterial(@PathVariable Long id) {
        if (materialService.deleteMaterial(id)) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
}