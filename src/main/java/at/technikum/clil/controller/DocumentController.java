package at.technikum.clil.controller;

import at.technikum.clil.model.User;
import at.technikum.clil.service.DocumentProxyService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import reactor.core.publisher.Mono;

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
    public Mono<ResponseEntity<Map<String, Object>>> uploadDocument(
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal User user) {
        log.info("Document upload request — file: {}, user: {}", file.getOriginalFilename(), user.getUsername());

        return documentProxyService.uploadDocument(file, user.getId())
                .timeout(Duration.ofSeconds(120))
                .map(ResponseEntity::ok)
                .onErrorReturn(ResponseEntity.internalServerError()
                        .body(Map.of("error", "Document upload failed")));
    }

    @GetMapping("/documents")
    public Mono<ResponseEntity<List<Map<String, Object>>>> listDocuments(
            @AuthenticationPrincipal User user) {
        return documentProxyService.listDocuments(user.getId())
                .map(ResponseEntity::ok)
                .onErrorReturn(ResponseEntity.internalServerError()
                        .body(List.of()));
    }

    @DeleteMapping("/documents")
    public Mono<ResponseEntity<Map<String, Object>>> deleteDocuments(
            @RequestBody Map<String, List<String>> body,
            @AuthenticationPrincipal User user) {
        List<String> docIds = body.get("docIds");
        log.info("Document delete request — docIds: {}, user: {}", docIds, user.getUsername());

        return documentProxyService.deleteDocuments(docIds)
                .map(ResponseEntity::ok)
                .onErrorReturn(ResponseEntity.internalServerError()
                        .body(Map.of("error", "Document deletion failed")));
    }

    @PostMapping("/query")
    public Mono<ResponseEntity<Map<String, Object>>> queryDocuments(
            @RequestBody Map<String, Object> body,
            @AuthenticationPrincipal User user) {
        String query = (String) body.get("query");
        int topK = body.containsKey("topK") ? ((Number) body.get("topK")).intValue() : 5;

        log.info("RAG query request — user: {}, topK: {}", user.getUsername(), topK);

        return documentProxyService.queryDocuments(query, user.getId(), topK)
                .timeout(Duration.ofSeconds(120))
                .map(ResponseEntity::ok)
                .onErrorReturn(ResponseEntity.internalServerError()
                        .body(Map.of("error", "Query failed")));
    }
}
