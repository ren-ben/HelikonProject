package at.technikum.clil.service;

import at.technikum.clil.dto.LessonMaterialDto;
import at.technikum.clil.dto.MaterialCreateRequest;
import at.technikum.clil.dto.MaterialUpdateRequest;
import at.technikum.clil.model.LessonMaterial;
import at.technikum.clil.repository.LessonMaterialRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class MaterialService {

    private final LessonMaterialRepository repository;

    /**
     * Erstellt ein neues Material
     */
    public LessonMaterialDto createMaterial(MaterialCreateRequest request) {
        log.debug("Creating new material: {}", request.getTopic());
        
        // Use aiResponse if provided, otherwise use content
        String content = request.getAiResponse() != null ? request.getAiResponse() : request.getContent();
        
        // Validation
        validateMaterialRequest(request.getMaterialType(), request.getTopic(), content);
        
        LessonMaterial material = LessonMaterial.builder()
                .materialType(request.getMaterialType())
                .topic(request.getTopic())
                .aiResponse(content)
                .formattedHtml(request.getFormattedHtml() != null ? request.getFormattedHtml() : content)
                .subject(request.getSubject())
                .languageLevel(request.getLanguageLevel())
                .vocabPercentage(request.getVocabPercentage())
                .tags(request.getTags())
                .build();
        
        LessonMaterial saved = repository.save(material);
        log.info("Created material with ID: {} - Type: {}, Subject: {}, Language: {}", 
            saved.getId(), 
            saved.getMaterialType(), 
            saved.getSubject(), 
            saved.getLanguageLevel()
        );
        
        return LessonMaterialDto.fromEntity(saved);
    }

    /**
     * Aktualisiert ein bestehendes Material
     */
    public Optional<LessonMaterialDto> updateMaterial(Long id, MaterialUpdateRequest request) {
        log.debug("Updating material with ID: {}", id);
        
        return repository.findById(id)
                .map(existingMaterial -> {
                    // Update only non-null fields
                    if (request.getMaterialType() != null) {
                        existingMaterial.setMaterialType(request.getMaterialType());
                    }
                    if (request.getTopic() != null) {
                        existingMaterial.setTopic(request.getTopic());
                    }
                    if (request.getContent() != null) {
                        existingMaterial.setAiResponse(request.getContent());
                    }
                    if (request.getFormattedHtml() != null) {
                        existingMaterial.setFormattedHtml(request.getFormattedHtml());
                    }
                    if (request.getSubject() != null) {
                        existingMaterial.setSubject(request.getSubject());
                    }
                    if (request.getLanguageLevel() != null) {
                        existingMaterial.setLanguageLevel(request.getLanguageLevel());
                    }
                    if (request.getVocabPercentage() != null) {
                        existingMaterial.setVocabPercentage(request.getVocabPercentage());
                    }
                    if (request.getTags() != null) {
                        existingMaterial.setTags(request.getTags());
                    }
                    
                    // Always update modifiedAt
                    existingMaterial.setModifiedAt(LocalDateTime.now());
                    
                    // Validate only if fields are provided
                    if (request.getMaterialType() != null || request.getTopic() != null || request.getContent() != null) {
                        validateMaterialRequest(
                            existingMaterial.getMaterialType(), 
                            existingMaterial.getTopic(), 
                            existingMaterial.getAiResponse()
                        );
                    }
                    
                    LessonMaterial updated = repository.save(existingMaterial);
                    log.info("Updated material with ID: {} - Fields updated: {}", 
                        updated.getId(), 
                        getUpdatedFields(request)
                    );
                    
                    return LessonMaterialDto.fromEntity(updated);
                });
    }

    /**
     * Helper method to log which fields were updated
     */
    private String getUpdatedFields(MaterialUpdateRequest request) {
        StringBuilder fields = new StringBuilder();
        if (request.getMaterialType() != null) fields.append("materialType,");
        if (request.getTopic() != null) fields.append("topic,");
        if (request.getContent() != null) fields.append("content,");
        if (request.getFormattedHtml() != null) fields.append("formattedHtml,");
        if (request.getSubject() != null) fields.append("subject,");
        if (request.getLanguageLevel() != null) fields.append("languageLevel,");
        if (request.getVocabPercentage() != null) fields.append("vocabPercentage,");
        if (request.getTags() != null) fields.append("tags,");
        return fields.length() > 0 ? fields.substring(0, fields.length() - 1) : "none";
    }

    /**
     * Ruft alle Materialien ab
     */
    @Transactional(readOnly = true)
    public List<LessonMaterialDto> getAllMaterials() {
        log.debug("Fetching all materials");
        
        return repository.findAllOrderByCreatedAtDesc()
                .stream()
                .map(LessonMaterialDto::fromEntity)
                .toList();
    }

    /**
     * Ruft ein Material nach ID ab
     */
    @Transactional(readOnly = true)
    public Optional<LessonMaterialDto> getMaterialById(Long id) {
        log.debug("Fetching material with ID: {}", id);
        
        return repository.findById(id)
                .map(LessonMaterialDto::fromEntity);
    }

    /**
     * Löscht ein Material
     */
    public boolean deleteMaterial(Long id) {
        log.debug("Deleting material with ID: {}", id);
        
        if (repository.existsById(id)) {
            repository.deleteById(id);
            log.info("Deleted material with ID: {}", id);
            return true;
        }
        
        log.warn("Material with ID {} not found for deletion", id);
        return false;
    }

    /**
     * Ruft Materialien nach Typ ab
     */
    @Transactional(readOnly = true)
    public List<LessonMaterialDto> getMaterialsByType(String materialType) {
        log.debug("Fetching materials by type: {}", materialType);
        
        return repository.findByMaterialType(materialType)
                .stream()
                .map(LessonMaterialDto::fromEntity)
                .toList();
    }

    /**
     * Validiert Material-Anfragen
     */
    private void validateMaterialRequest(String materialType, String topic, String content) {
        if (materialType == null || materialType.trim().isEmpty()) {
            throw new IllegalArgumentException("Material type cannot be empty");
        }
        if (topic == null || topic.trim().isEmpty()) {
            throw new IllegalArgumentException("Topic cannot be empty");
        }
        if (content == null || content.trim().isEmpty()) {
            throw new IllegalArgumentException("Content cannot be empty");
        }
        
        // Additional business validation
        if (materialType.length() > 50) {
            throw new IllegalArgumentException("Material type too long (max 50 characters)");
        }
        if (topic.length() > 200) {
            throw new IllegalArgumentException("Topic too long (max 200 characters)");
        }
    }
} 