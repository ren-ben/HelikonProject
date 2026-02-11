package at.technikum.clil.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class MaterialRequest {
    private String materialType;
    private String topic;
    private String prompt;
    private String subject;
    private String languageLevel;
    private Integer vocabPercentage;
    private String contentFocus;
    private Boolean includeVocabList;
    private String description;
    private String modelName;
    private Boolean useDocumentContext;
    private String userId;
    private String contextSubject;
    private String citationStyle;
}
