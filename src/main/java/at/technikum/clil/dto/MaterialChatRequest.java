package at.technikum.clil.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

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
}
