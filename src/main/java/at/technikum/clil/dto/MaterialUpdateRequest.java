package at.technikum.clil.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class MaterialUpdateRequest {
    
    private String materialType;
    private String topic;
    private String content;
    private String formattedHtml;
    private String subject;
    private String languageLevel;
    private Integer vocabPercentage;
    private List<String> tags;
} 