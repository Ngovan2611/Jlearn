package profile.repository;

import org.springframework.data.neo4j.repository.Neo4jRepository;
import profile.entity.Skill;

import java.util.Optional;

public interface SkillRepository extends Neo4jRepository<Skill, String> {

    Optional<Skill> findByNameIgnoreCase(String name);
}