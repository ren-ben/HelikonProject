package at.technikum.clil.repository;

import at.technikum.clil.model.LessonMaterial;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LessonMaterialRepository extends JpaRepository<LessonMaterial, Long> {

    List<LessonMaterial> findByMaterialType(String materialType);

    List<LessonMaterial> findByTopic(String topic);

    List<LessonMaterial> findByMaterialTypeAndTopic(String materialType, String topic);

    @Query("SELECT lm FROM LessonMaterial lm ORDER BY lm.createdAt DESC")
    List<LessonMaterial> findAllOrderByCreatedAtDesc();

    @Query("SELECT DISTINCT lm.materialType FROM LessonMaterial lm")
    List<String> findDistinctMaterialTypes();

    @Query("SELECT DISTINCT lm.topic FROM LessonMaterial lm")
    List<String> findDistinctTopics();
}