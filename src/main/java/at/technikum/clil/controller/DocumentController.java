package at.technikum.clil.controller;

import at.technikum.clil.model.User;
import at.technikum.clil.service.DocumentProxyService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.Duration;
import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/v1/clil")
public class DocumentController {

    private final DocumentProxyService documentProxyService;

    public DocumentController(DocumentProxyService documentProxyService) {
        this.documentProxyService = documentProxyService;
    }

    @PostMapping("/documents/upload")
    public ResponseEntity<Map<String, Object>> uploadDocument(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "subject", required = false, defaultValue = "") String subject,
            @AuthenticationPrincipal User user) {
        log.info("Document upload request — file: {}, user: {}, subject: {}",
                file.getOriginalFilename(), user.getUsername(), subject);

        try {
            Map<String, Object> result = documentProxyService.uploadDocument(file, user.getId(), subject)
                    .block(Duration.ofSeconds(120));
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("Document upload failed: {}", e.getMessage());
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", "Document upload failed"));
        }
    }

    @GetMapping("/documents")
    public ResponseEntity<List<Map<String, Object>>> listDocuments(
            @AuthenticationPrincipal User user) {
        try {
            List<Map<String, Object>> docs = documentProxyService.listDocuments(user.getId())
                    .block(Duration.ofSeconds(30));
            return ResponseEntity.ok(docs);
        } catch (Exception e) {
            log.error("Error listing documents: {}", e.getMessage());
            return ResponseEntity.internalServerError()
                    .body(List.of());
        }
    }

    @DeleteMapping("/documents")
    public ResponseEntity<Map<String, Object>> deleteDocuments(
            @RequestBody Map<String, List<String>> body,
            @AuthenticationPrincipal User user) {
        List<String> docIds = body.get("docIds");
        log.info("Document delete request — docIds: {}, user: {}", docIds, user.getUsername());

        try {
            Map<String, Object> result = documentProxyService.deleteDocuments(docIds)
                    .block(Duration.ofSeconds(30));
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("Document deletion failed: {}", e.getMessage());
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", "Document deletion failed"));
        }
    }

    @PostMapping("/query")
    public ResponseEntity<Map<String, Object>> queryDocuments(
            @RequestBody Map<String, Object> body,
            @AuthenticationPrincipal User user) {
        String query = (String) body.get("query");
        int topK = body.containsKey("topK") ? ((Number) body.get("topK")).intValue() : 5;
        String subject = (String) body.get("subject");

        log.info("RAG query request — user: {}, topK: {}, subject: {}", user.getUsername(), topK, subject);

        try {
            Map<String, Object> result = documentProxyService.queryDocuments(query, user.getId(), topK, subject)
                    .block(Duration.ofSeconds(120));
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("Query failed: {}", e.getMessage());
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", "Query failed"));
        }
    }
}
