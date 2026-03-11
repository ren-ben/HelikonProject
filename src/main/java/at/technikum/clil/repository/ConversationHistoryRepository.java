package at.technikum.clil.repository;

import at.technikum.clil.model.MaterialConversationHistory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ConversationHistoryRepository extends JpaRepository<MaterialConversationHistory, Long> {

    List<MaterialConversationHistory> findByMaterialIdOrderByTimestampAsc(Long materialId);

    void deleteByMaterialId(Long materialId);
    Page<MaterialConversationHistory> findByMaterialIdAndUserIdOrderByTimestampDesc(
            Long materialId, Long userId, Pageable pageable);
}
