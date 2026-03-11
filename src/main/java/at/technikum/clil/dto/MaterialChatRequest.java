package at.technikum.clil.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MaterialChatRequest {
    private String prompt;
    private String content;
    private String language;
    private String languageLevel;
    private String subject;
    private String modelName;
    private Boolean useDocumentContext;
    private String userId;
    private List<ConversationMessageDTO> chatHistory;
}

