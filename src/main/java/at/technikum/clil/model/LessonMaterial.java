package at.technikum.clil.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "lesson_materials")
public class LessonMaterial {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String materialType;  // e.g., "lesson plan", "quiz", "reading exercise"

    @Column(nullable = false)
    private String topic;  // e.g., "Object-Oriented Programming"

    @Column(columnDefinition = "TEXT", nullable = false)
    private String aiResponse;

    @Column(columnDefinition = "TEXT")
    private String formattedHtml;

    @Column
    private String subject;

    @Column
    private String languageLevel;

    @Column
    private Integer vocabPercentage;

    @Column
    private String contentFocus;

    @Column
    private Boolean includeVocabList;

    @Column(columnDefinition = "TEXT")
    private String description;

    @ElementCollection
    @CollectionTable(name = "material_tags", joinColumns = @JoinColumn(name = "material_id"))
    @Column(name = "tag")
    private List<String> tags;

    @Builder.Default
    @Column(updatable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column
    private LocalDateTime modifiedAt;
}