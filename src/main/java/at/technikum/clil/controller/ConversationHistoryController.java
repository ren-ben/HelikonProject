package at.technikum.clil.controller;

import at.technikum.clil.dto.ConversationMessageDTO;
import at.technikum.clil.model.User;
import at.technikum.clil.service.ConversationHistoryService;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/clil/materials/{materialId}/conversation")
@RequiredArgsConstructor
public class ConversationHistoryController {

    private final ConversationHistoryService conversationService;

    @GetMapping
    public ResponseEntity<List<ConversationMessageDTO>> getConversationHistory(
            @PathVariable Long materialId,
            @AuthenticationPrincipal User currentUser) {

        var history = conversationService.getConversationHistory(materialId, currentUser.getId());
        return ResponseEntity.ok(history);
    }

    @PostMapping
    public ResponseEntity<ConversationMessageDTO> addMessage(
            @PathVariable Long materialId,
            @RequestBody ConversationMessageRequest request,
            @AuthenticationPrincipal User currentUser) {

        var message = conversationService.addMessage(
                materialId,
                currentUser.getId(),
                request.getRole(),
                request.getMessage(),
                request.getModelUsed()
        );

        return ResponseEntity.ok(message);
    }

    @Data
    public static class ConversationMessageRequest {
        private String role;
        private String message;
        private String modelUsed;
    }
}
