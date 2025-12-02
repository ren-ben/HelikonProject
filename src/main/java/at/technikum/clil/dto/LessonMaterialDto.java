package at.technikum.clil.dto;

import at.technikum.clil.model.LessonMaterial;
import java.util.List;

public record LessonMaterialDto(
        Long id,
        String materialType,
        String topic,
        String formattedHtml,
        String subject,
        String languageLevel,
        Integer vocabPercentage,
        String contentFocus,
        Boolean includeVocabList,
        String description,
        List<String> tags,
        String createdAt,
        String modifiedAt
) {
    public static LessonMaterialDto fromEntity(LessonMaterial entity) {
        return new LessonMaterialDto(
                entity.getId(),
                entity.getMaterialType(),
                entity.getTopic(),
                entity.getAiResponse(),
                entity.getSubject(),
                entity.getLanguageLevel(),
                entity.getVocabPercentage(),
                entity.getContentFocus(),
                entity.getIncludeVocabList(),
                entity.getDescription(),
                entity.getTags(),
                entity.getCreatedAt().toString(),
                entity.getModifiedAt() != null ? entity.getModifiedAt().toString() : entity.getCreatedAt().toString()
        );
    }
    
    // Helper method for frontend compatibility
    public String content() {
        return formattedHtml;
    }
}
