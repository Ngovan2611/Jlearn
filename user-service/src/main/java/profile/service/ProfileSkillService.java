package profile.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import profile.entity.Profile;
import profile.repository.ProfileRepository;
import profile.repository.SkillGraphRepository;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ProfileSkillService {

    private final ProfileRepository profileRepository;
    private final SkillGraphRepository skillGraphRepository;

    @Transactional
    public void addSkills(String userId, List<String> skills) {
        Profile profile = profileRepository.findByUserId(userId)
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "Profile not found for userId: " + userId
                        )
                );

        if (skills == null || skills.isEmpty()) {
            return;
        }

        for (String rawSkill : skills) {
            if (rawSkill == null || rawSkill.isBlank()) {
                continue;
            }

            String skillName = rawSkill.trim();

            boolean linked = skillGraphRepository.addSkillToProfile(
                    profile.getUserId(),
                    skillName
            );

            if (!linked) {
                throw new IllegalStateException(
                        "Unable to link skill: " + skillName
                );
            }
        }
    }
}