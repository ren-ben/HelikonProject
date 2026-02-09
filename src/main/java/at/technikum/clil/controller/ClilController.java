package at.technikum.clil.controller;

import at.technikum.clil.dto.ClilResponse;
import at.technikum.clil.dto.LessonMaterialDto;
import at.technikum.clil.dto.MaterialCreateRequest;
import at.technikum.clil.dto.MaterialRequest;
import at.technikum.clil.dto.MaterialUpdateRequest;
import at.technikum.clil.model.User;
import at.technikum.clil.service.RagProxyService;
import at.technikum.clil.service.MaterialService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.Duration;
import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/v1/clil")
public class ClilController {

    private final RagProxyService ragProxyService;
    private final MaterialService materialService;

    public ClilController(RagProxyService ragProxyService, MaterialService materialService) {
        this.ragProxyService = ragProxyService;
        this.materialService = materialService;
    }

    @GetMapping("/models")
    public ResponseEntity<List<String>> getAvailableModels() {
        try {
            List<String> models = ragProxyService.listAvailableModels()
                    .block(Duration.ofSeconds(30));
            return ResponseEntity.ok(models);
        } catch (Exception e) {
            log.error("Error fetching models: {}", e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }

    @PostMapping("/generate")
    public ResponseEntity<ClilResponse> generateLessonMaterial(
            @RequestBody MaterialRequest request) {
        try {
            ClilResponse response = ragProxyService.generateMaterial(request)
                    .block(Duration.ofSeconds(180));
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error generating material: {}", e.getMessage());
            return ResponseEntity.internalServerError()
                    .body(ClilResponse.builder()
                            .formattedResponse("<div class='error'>Failed to generate content</div>")
                            .build());
        }
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