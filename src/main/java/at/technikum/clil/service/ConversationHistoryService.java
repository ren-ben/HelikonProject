package at.technikum.clil.service;

import at.technikum.clil.dto.ConversationMessageDTO;
import at.technikum.clil.model.MaterialConversationHistory;
import at.technikum.clil.repository.ConversationHistoryRepository;
import at.technikum.clil.repository.LessonMaterialRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ConversationHistoryService {

    private final ConversationHistoryRepository conversationRepository;
    private final LessonMaterialRepository materialRepository;

    @Transactional(readOnly = true)
    public List<ConversationMessageDTO> getConversationHistory(Long materialId, Long userId) {
        var material = materialRepository.findById(materialId)
                .orElseThrow(() -> new RuntimeException("Material not found"));

        if (!material.getOwner().getId().equals(userId)) {
            throw new RuntimeException("Unauthorized access to conversation history");
        }

        return conversationRepository.findByMaterialIdOrderByTimestampAsc(materialId)
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public ConversationMessageDTO addMessage(Long materialId, Long userId, String role,
                                             String message, String modelUsed) {
        var material = materialRepository.findById(materialId)
                .orElseThrow(() -> new RuntimeException("Material not found"));

        if (!material.getOwner().getId().equals(userId)) {
            throw new RuntimeException("Unauthorized");
        }

        var conversationEntry = MaterialConversationHistory.builder()
                .materialId(materialId)
                .userId(userId)
                .role(role)
                .message(message)
                .timestamp(LocalDateTime.now())
                .modelUsed(modelUsed)
                .build();

        var saved = conversationRepository.save(conversationEntry);
        return toDTO(saved);
    }

    private ConversationMessageDTO toDTO(MaterialConversationHistory entity) {
        return ConversationMessageDTO.builder()
                .id(entity.getId())
                .role(entity.getRole())
                .message(entity.getMessage())
                .timestamp(entity.getTimestamp())
                .modelUsed(entity.getModelUsed())
                .build();
    }
}
