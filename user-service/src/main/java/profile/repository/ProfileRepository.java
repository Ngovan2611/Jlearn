package profile.repository;

import org.springframework.data.neo4j.repository.Neo4jRepository;
import org.springframework.stereotype.Repository;
import profile.entity.Profile;

@Repository
public interface ProfileRepository extends Neo4jRepository<Profile,String> {

}
