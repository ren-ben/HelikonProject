package at.technikum.clil.repository;

import at.technikum.clil.model.Subject;
import at.technikum.clil.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SubjectRepository extends JpaRepository<Subject, Long> {

    List<Subject> findByOwnerOrderByCreatedAtAsc(User owner);

    boolean existsByNameAndOwner(String name, User owner);

    long countByOwner(User owner);
}
