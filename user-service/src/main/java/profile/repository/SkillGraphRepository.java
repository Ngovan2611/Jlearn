package profile.repository;

import org.springframework.data.neo4j.repository.Neo4jRepository;
import org.springframework.data.neo4j.repository.query.Query;
import org.springframework.data.repository.query.Param;
import profile.entity.Skill;

public interface SkillGraphRepository
        extends Neo4jRepository<Skill, String> {

    @Query("""
        MATCH (p:Profile {userId: $userId})
        MERGE (s:SKILL {name: $skillName})
        MERGE (p)-[:HAS_SKILL]->(s)
        RETURN count(s) > 0
        """)
    boolean addSkillToProfile(
            @Param("userId") String userId,
            @Param("skillName") String skillName
    );
}